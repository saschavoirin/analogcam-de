#!/usr/bin/env node
import { mkdir } from "node:fs/promises";
import {
  albumIndexPath,
  assertIsoDate,
  assertSlug,
  parseArgs,
  pathExists,
  writeMarkdown,
} from "./shared.mjs";

async function main() {
  const args = parseArgs();
  const slug = String(args.slug ?? "");
  const title = String(args.title ?? "");
  const date = String(args.date ?? "");

  if (!slug || !title || !date) {
    throw new Error(
      'Nutzung: npm run album:new -- --slug berlin-juni-2026 --title "Berlin, Juni 2026" --date 2026-06-01',
    );
  }

  assertSlug(slug);
  assertIsoDate(date);

  const filePath = albumIndexPath(slug);

  if (await pathExists(filePath)) {
    throw new Error(`Album "${slug}" existiert bereits.`);
  }

  await mkdir(new URL(`../src/content/albums/${slug}/`, import.meta.url), {
    recursive: true,
  });

  await writeMarkdown(
    filePath,
    {
      title,
      slug,
      date,
      status: "draft",
      cover: "",
      photos: [],
    },
    "\n",
  );

  console.log(`Album angelegt: src/content/albums/${slug}/index.md`);
  console.log("Status ist draft. Setze später status: published, wenn alles geprüft ist.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
