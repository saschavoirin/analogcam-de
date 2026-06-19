import type { ImageMetadata } from "astro";
import type { Album } from "./albums";

type ImageModule = { default: ImageMetadata };

const imageModules = import.meta.glob<ImageModule>(
  "/src/content/albums/**/*.{jpg,jpeg,png,webp,avif}",
  { eager: true },
);

function cleanReference(reference: string) {
  return reference.replace(/^\.?\//, "").replace(/\\/g, "/");
}

export function resolveAlbumImage(album: Album, reference: string) {
  if (!reference) return undefined;

  const key = `/src/content/albums/${album.data.slug}/${cleanReference(reference)}`;
  return imageModules[key]?.default;
}

export function getAlbumCover(album: Album) {
  return resolveAlbumImage(album, album.data.cover);
}

export function getAlbumPhotos(album: Album) {
  return [...album.data.photos]
    .sort((left, right) => left.order - right.order || left.src.localeCompare(right.src))
    .map((photo) => ({
      ...photo,
      image: resolveAlbumImage(album, photo.src),
    }));
}
