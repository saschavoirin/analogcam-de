import { getCollection, type CollectionEntry } from "astro:content";

export type Album = CollectionEntry<"albums">;

export function sortAlbums(albums: Album[]) {
  return [...albums].sort((left, right) => {
    const byDate = right.data.date.getTime() - left.data.date.getTime();
    return byDate || left.data.slug.localeCompare(right.data.slug, "de");
  });
}

export async function getVisibleAlbums() {
  return sortAlbums(
    await getCollection("albums", ({ data }) => data.status !== "draft"),
  );
}

export async function getPublishedAlbums() {
  return sortAlbums(
    await getCollection("albums", ({ data }) => data.status === "published"),
  );
}

export async function getArchivedAlbums() {
  return sortAlbums(
    await getCollection("albums", ({ data }) => data.status === "archived"),
  );
}

export function getAlbumUrl(album: Album) {
  return `/alben/${album.data.slug}/`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function getAlbumMeta(album: Album) {
  return [
    ["Datum", formatDate(album.data.date)],
    ["Ort", album.data.location],
    ["Kamera", album.data.camera],
    ["Objektiv", album.data.lens],
    ["Film", album.data.film],
  ].filter((item): item is [string, string] => Boolean(item[1]));
}

export function groupArchivedAlbumsByYear(albums: Album[]) {
  const groups = new Map<string, Album[]>();

  for (const album of albums) {
    const year = String(album.data.date.getFullYear());
    const current = groups.get(year) ?? [];
    current.push(album);
    groups.set(year, current);
  }

  return [...groups.entries()].sort(([left], [right]) =>
    right.localeCompare(left, "de"),
  );
}
