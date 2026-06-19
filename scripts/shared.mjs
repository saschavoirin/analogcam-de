import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
export const albumsRoot = path.join(projectRoot, "src", "content", "albums");
export const localConfigPath = path.join(projectRoot, ".analogcam.local.json");
export const statusValues = new Set(["draft", "published", "archived"]);
export const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff"]);
export const webImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith("--")) {
      throw new Error(`Unerwartetes Argument: ${token}`);
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

export function assertSlug(slug) {
  if (!slugPattern.test(slug)) {
    throw new Error(
      `Ungültiger Slug "${slug}". Erlaubt sind Kleinbuchstaben, Zahlen und Bindestriche.`,
    );
  }
}

export function assertIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`Ungültiges Datum "${value}". Erwartet wird YYYY-MM-DD.`);
  }
}

export function albumDir(slug) {
  assertSlug(slug);
  return path.join(albumsRoot, slug);
}

export function albumIndexPath(slug) {
  return path.join(albumDir(slug), "index.md");
}

export async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

export async function readMarkdown(filePath) {
  const source = await readFile(filePath, "utf8");
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    throw new Error(`${filePath} enthält keinen gültigen YAML-Frontmatter-Block.`);
  }

  return {
    data: YAML.parse(match[1]) ?? {},
    body: match[2] ?? "",
  };
}

export function serializeAlbumData(data) {
  const ordered = {
    title: data.title ?? "",
    slug: data.slug ?? "",
    date: data.date ?? "",
    status: data.status ?? "draft",
    description: data.description ?? undefined,
    location: data.location ?? undefined,
    camera: data.camera ?? undefined,
    lens: data.lens ?? undefined,
    film: data.film ?? undefined,
    cover: data.cover ?? "",
    photos: Array.isArray(data.photos)
      ? data.photos.map((photo) => ({
          src: photo.src,
          order: Number(photo.order),
          alt: photo.alt,
          caption: photo.caption || undefined,
          sha256: photo.sha256 || undefined,
        }))
      : [],
  };

  return JSON.parse(JSON.stringify(ordered));
}

export async function writeMarkdown(filePath, data, body = "") {
  const frontmatter = YAML.stringify(serializeAlbumData(data), {
    lineWidth: 0,
    singleQuote: false,
  }).trimEnd();

  await writeFile(filePath, `---\n${frontmatter}\n---\n${body}`, "utf8");
}

export async function readAlbum(slug) {
  const filePath = albumIndexPath(slug);

  if (!(await pathExists(filePath))) {
    throw new Error(`Album "${slug}" existiert nicht: ${filePath}`);
  }

  const album = await readMarkdown(filePath);
  return { ...album, filePath };
}

export async function readLocalConfig() {
  if (!(await pathExists(localConfigPath))) return {};

  const text = await readFile(localConfigPath, "utf8");
  return JSON.parse(text);
}

export async function sha256File(filePath) {
  const hash = createHash("sha256");

  await new Promise((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });

  return hash.digest("hex");
}

export function normalizeFileStem(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function padPhotoNumber(value) {
  return String(value).padStart(3, "0");
}

export function neutralAltText(title) {
  return `Analoge Fotografie aus dem Album "${title}".`;
}

export function isNeutralAltText(value) {
  return /^Analoge Fotografie aus dem Album ".+"\.$/.test(value ?? "");
}

export async function assertDirectory(dirPath, label) {
  const stats = await stat(dirPath).catch(() => null);

  if (!stats?.isDirectory()) {
    throw new Error(`${label} ist kein Verzeichnis: ${dirPath}`);
  }
}

export function isImportableImage(filePath) {
  return imageExtensions.has(path.extname(filePath).toLowerCase());
}

export function isWebImage(filePath) {
  return webImageExtensions.has(path.extname(filePath).toLowerCase());
}

export function formatBytes(bytes) {
  const units = ["B", "KiB", "MiB", "GiB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
