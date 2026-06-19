#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  albumIndexPath,
  albumsRoot,
  isNeutralAltText,
  isWebImage,
  pathExists,
  readMarkdown,
  slugPattern,
  statusValues,
} from "./shared.mjs";

async function albumSlugs() {
  if (!(await pathExists(albumsRoot))) return [];

  const entries = await readdir(albumsRoot, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name !== ".git")
    .sort((left, right) => left.localeCompare(right, "de"));
}

function addIssue(list, message) {
  list.push(message);
}

async function validateAlbum(slug) {
  const errors = [];
  const warnings = [];
  const filePath = albumIndexPath(slug);

  if (!(await pathExists(filePath))) {
    return {
      errors: [`${slug}: index.md fehlt.`],
      warnings,
    };
  }

  let data;

  try {
    data = (await readMarkdown(filePath)).data;
  } catch (error) {
    return {
      errors: [`${slug}: ${error.message}`],
      warnings,
    };
  }

  if (data.slug !== slug) {
    addIssue(errors, `${slug}: Frontmatter slug muss "${slug}" sein.`);
  }

  if (!slugPattern.test(data.slug ?? "")) {
    addIssue(errors, `${slug}: Slug enthält ungültige Zeichen.`);
  }

  if (!data.title) {
    addIssue(errors, `${slug}: title fehlt.`);
  }

  if (!data.date || Number.isNaN(Date.parse(data.date))) {
    addIssue(errors, `${slug}: date fehlt oder ist ungültig.`);
  }

  if (!statusValues.has(data.status)) {
    addIssue(errors, `${slug}: status muss draft, published oder archived sein.`);
  }

  const photos = Array.isArray(data.photos) ? data.photos : [];
  const publicAlbum = data.status === "published" || data.status === "archived";

  if (publicAlbum && photos.length === 0) {
    addIssue(errors, `${slug}: veröffentlichte oder archivierte Alben brauchen Fotos.`);
  }

  if (publicAlbum && !data.cover) {
    addIssue(errors, `${slug}: cover fehlt.`);
  }

  if (data.cover) {
    const coverPath = path.join(albumsRoot, slug, data.cover);
    if (!(await pathExists(coverPath))) {
      addIssue(errors, `${slug}: cover existiert nicht: ${data.cover}`);
    }
  }

  const seenSrc = new Set();
  const seenOrder = new Set();
  const seenHash = new Set();

  for (const photo of photos) {
    const label = `${slug}: Foto ${photo.src ?? "[ohne src]"}`;

    if (!photo.src) {
      addIssue(errors, `${label}: src fehlt.`);
      continue;
    }

    const imagePath = path.join(albumsRoot, slug, photo.src);

    if (seenSrc.has(photo.src)) {
      addIssue(errors, `${label}: src ist doppelt.`);
    }
    seenSrc.add(photo.src);

    if (!(await pathExists(imagePath))) {
      addIssue(errors, `${label}: Datei fehlt.`);
    } else if (!isWebImage(imagePath)) {
      addIssue(errors, `${label}: Webbild muss JPEG, PNG, WebP oder AVIF sein.`);
    }

    if (!Number.isInteger(photo.order) || photo.order < 0) {
      addIssue(errors, `${label}: order muss eine nichtnegative ganze Zahl sein.`);
    } else if (seenOrder.has(photo.order)) {
      addIssue(errors, `${label}: order ${photo.order} ist doppelt.`);
    }
    seenOrder.add(photo.order);

    if (!photo.alt) {
      addIssue(errors, `${label}: alt fehlt.`);
    } else if (isNeutralAltText(photo.alt)) {
      addIssue(warnings, `${label}: neutraler Alt-Text sollte individuell verbessert werden.`);
    }

    if (photo.sha256) {
      if (!/^[a-f0-9]{64}$/.test(photo.sha256)) {
        addIssue(errors, `${label}: sha256 ist ungültig.`);
      } else if (seenHash.has(photo.sha256)) {
        addIssue(errors, `${label}: sha256 ist doppelt.`);
      }
      seenHash.add(photo.sha256);
    }
  }

  return { errors, warnings };
}

async function main() {
  const slugs = await albumSlugs();
  const errors = [];
  const warnings = [];

  for (const slug of slugs) {
    const result = await validateAlbum(slug);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  for (const warning of warnings) {
    console.warn(`Warnung: ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Fehler: ${error}`);
    }
    process.exit(1);
  }

  console.log(
    `Fotoinhalte geprüft: ${slugs.length} Album${slugs.length === 1 ? "" : "s"}, ${warnings.length} Warnung${warnings.length === 1 ? "" : "en"}.`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
