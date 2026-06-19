#!/usr/bin/env node
import { copyFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  albumDir,
  assertDirectory,
  ensureDirectory,
  formatBytes,
  isImportableImage,
  neutralAltText,
  normalizeFileStem,
  padPhotoNumber,
  parseArgs,
  pathExists,
  readAlbum,
  readLocalConfig,
  sha256File,
  writeMarkdown,
} from "./shared.mjs";

async function listImages(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listImages(fullPath)));
      continue;
    }

    if (entry.isFile() && isImportableImage(fullPath)) {
      files.push(fullPath);
    }
  }

  return files.sort((left, right) =>
    path.relative(root, left).localeCompare(path.relative(root, right), "de", {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

async function nextAvailableTarget(dir, startOrder) {
  let order = startOrder;

  while (true) {
    const fileName = `${padPhotoNumber(order)}.jpg`;
    const target = path.join(dir, fileName);

    if (!(await pathExists(target))) {
      return { order, fileName, target };
    }

    order += 1;
  }
}

async function writeWebImage(source, target, maxEdge) {
  const pipeline = sharp(source, { failOn: "warning" })
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toColorspace("srgb")
    .jpeg({
      quality: 88,
      mozjpeg: true,
    });

  await pipeline.toFile(target);
}

async function archiveOriginal(source, archiveRoot, albumSlug, sourceHash) {
  const archiveDir = path.join(archiveRoot, albumSlug);
  await ensureDirectory(archiveDir);

  const ext = path.extname(source).toLowerCase();
  const stem = normalizeFileStem(path.basename(source, ext)) || "scan";
  let destination = path.join(archiveDir, `${stem}${ext}`);

  if (await pathExists(destination)) {
    const existingHash = await sha256File(destination);

    if (existingHash === sourceHash) {
      return { action: "skipped", destination };
    }

    destination = path.join(archiveDir, `${stem}-${sourceHash.slice(0, 12)}${ext}`);

    if (await pathExists(destination)) {
      const conflictHash = await sha256File(destination);

      if (conflictHash === sourceHash) {
        return { action: "skipped", destination };
      }

      throw new Error(
        `Archivkonflikt: ${destination} existiert bereits mit anderem SHA-256.`,
      );
    }
  }

  await copyFile(source, destination);
  const copiedHash = await sha256File(destination);

  if (copiedHash !== sourceHash) {
    throw new Error(`Archivkopie fehlgeschlagen, Prüfsumme weicht ab: ${destination}`);
  }

  return { action: "copied", destination };
}

async function main() {
  const args = parseArgs();
  const albumSlug = String(args.album ?? "");
  const sourceDir = args.from ? path.resolve(String(args.from)) : "";
  const maxEdge = Number(args["max-edge"] ?? 3200);

  if (!albumSlug || !sourceDir) {
    throw new Error(
      'Nutzung: npm run photos:import -- --album berlin-juni-2026 --from "/Pfad/zu/meinen/Scans"',
    );
  }

  if (!Number.isInteger(maxEdge) || maxEdge < 800 || maxEdge > 6400) {
    throw new Error("--max-edge muss eine ganze Zahl zwischen 800 und 6400 sein.");
  }

  await assertDirectory(sourceDir, "Quellpfad");

  const localConfig = await readLocalConfig();
  const archiveRoot = args["archive-to"]
    ? path.resolve(String(args["archive-to"]))
    : localConfig.defaultOriginalArchive
      ? path.resolve(String(localConfig.defaultOriginalArchive))
      : "";

  const album = await readAlbum(albumSlug);
  const targetDir = albumDir(albumSlug);
  const sources = await listImages(sourceDir);

  if (sources.length === 0) {
    console.log("Keine importierbaren Bilder gefunden. Unterstützt: JPEG, PNG, TIFF.");
    return;
  }

  const photos = Array.isArray(album.data.photos) ? [...album.data.photos] : [];
  const knownHashes = new Set(photos.map((photo) => photo.sha256).filter(Boolean));
  let nextOrder =
    photos.reduce((highest, photo) => Math.max(highest, Number(photo.order) || 0), 0) + 1;

  let imported = 0;
  let duplicates = 0;
  let archived = 0;

  for (const source of sources) {
    const sourceHash = await sha256File(source);

    if (knownHashes.has(sourceHash)) {
      duplicates += 1;
      continue;
    }

    const target = await nextAvailableTarget(targetDir, nextOrder);
    await writeWebImage(source, target.target, maxEdge);

    photos.push({
      src: target.fileName,
      order: target.order,
      alt: neutralAltText(album.data.title),
      sha256: sourceHash,
    });

    knownHashes.add(sourceHash);
    nextOrder = target.order + 1;
    imported += 1;

    const writtenSize = (await stat(target.target)).size;
    console.log(`Importiert: ${path.basename(source)} -> ${target.fileName} (${formatBytes(writtenSize)})`);

    if (archiveRoot) {
      const result = await archiveOriginal(source, archiveRoot, albumSlug, sourceHash);
      if (result.action === "copied") archived += 1;
    }
  }

  photos.sort((left, right) => Number(left.order) - Number(right.order));
  album.data.photos = photos;

  if (!album.data.cover && photos[0]) {
    album.data.cover = photos[0].src;
  }

  await writeMarkdown(album.filePath, album.data, album.body);

  console.log(`Fertig: ${imported} importiert, ${duplicates} Duplikate übersprungen.`);
  if (archiveRoot) {
    console.log(`Private Originalkopien: ${archived} neu in ${archiveRoot}`);
  }
  console.log("Bitte Alt-Texte und optionale Bildunterschriften in index.md prüfen.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
