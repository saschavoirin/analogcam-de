#!/usr/bin/env node
import { parseArgs, readAlbum, writeMarkdown } from "./shared.mjs";

async function main() {
  const args = parseArgs();
  const slug = String(args.album ?? "");

  if (!slug) {
    throw new Error("Nutzung: npm run album:archive -- --album berlin-juni-2026");
  }

  const album = await readAlbum(slug);
  album.data.status = "archived";

  await writeMarkdown(album.filePath, album.data, album.body);
  console.log(`Album archiviert: ${slug}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
