import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const photoSchema = z.object({
  src: z.string().min(1),
  order: z.number().int().nonnegative(),
  alt: z.string().min(1),
  caption: z.string().optional(),
  sha256: z.string().length(64).optional(),
});

const albums = defineCollection({
  loader: glob({
    base: "./src/content/albums",
    pattern: "**/index.md",
  }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(slugPattern),
    date: z.coerce.date(),
    status: z.enum(["draft", "published", "archived"]).default("draft"),
    description: z.string().optional(),
    location: z.string().optional(),
    camera: z.string().optional(),
    lens: z.string().optional(),
    film: z.string().optional(),
    cover: z.string().default(""),
    photos: z.array(photoSchema).default([]),
  }),
});

export const collections = { albums };
