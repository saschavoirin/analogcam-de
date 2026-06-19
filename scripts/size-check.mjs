#!/usr/bin/env node
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { albumsRoot, formatBytes, isWebImage, pathExists, projectRoot } from "./shared.mjs";

const distFailBytes = 850 * 1024 * 1024;
const imageWarnBytes = 750 * 1024 * 1024;

async function directorySize(root, filter = () => true) {
  if (!(await pathExists(root))) return 0;

  const entries = await readdir(root, { withFileTypes: true });
  let total = 0;

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      total += await directorySize(fullPath, filter);
      continue;
    }

    if (entry.isFile() && filter(fullPath)) {
      total += (await stat(fullPath)).size;
    }
  }

  return total;
}

async function main() {
  const distDir = path.join(projectRoot, "dist");
  const distSize = await directorySize(distDir);
  const webImageSize = await directorySize(albumsRoot, isWebImage);

  console.log(`dist: ${formatBytes(distSize)}`);
  console.log(`Webbildquellen: ${formatBytes(webImageSize)}`);

  if (distSize >= distFailBytes) {
    console.error(
      `dist überschreitet ${formatBytes(distFailBytes)}. Reduziere Alben/Bilder oder plane Object Storage beziehungsweise ein Image-CDN ein.`,
    );
    process.exit(1);
  }

  if (webImageSize >= imageWarnBytes) {
    console.warn(
      `Warnung: Webbildquellen überschreiten ${formatBytes(imageWarnBytes)}. Für weiteres Wachstum Object Storage oder ein Image-CDN vorbereiten.`,
    );
  }

  console.log("Größenprüfung abgeschlossen.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
