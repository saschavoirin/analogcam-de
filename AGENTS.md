# AGENTS.md

## Architektur

- Astro mit TypeScript, statischer Output, Vanilla-CSS und sehr wenig Vanilla-JS.
- Keine Frameworks wie React/Vue/Svelte, kein CMS, Backend, Tracking oder externe Assets.
- Hosting-Ziel: GitHub Pages via GitHub Actions, Domain `https://analogcam.de`.

## Verzeichnisse

- `src/pages/`: statische Seiten und Album-Routen.
- `src/content/albums/<slug>/`: Album-Ordner mit `index.md` und weboptimierten Bildern.
- `src/config/site.ts`: zentrale Website- und Betreiberkonfiguration.
- `scripts/`: Album-, Import-, Validierungs- und Größen-Tools.
- `docs/DEPLOYMENT.md`: GitHub-Pages- und united-domains-Anleitung.

## Befehle

- `npm run dev`: lokale Entwicklung.
- `npm run check`: Astro/TypeScript plus Foto-Validierung.
- `npm run build`: Produktions-Build.
- `npm run size:check`: Größenprüfung nach dem Build.
- `npm run album:new -- --slug ... --title ... --date YYYY-MM-DD`
- `npm run photos:import -- --album ... --from "..."`
- `npm run album:archive -- --album ...`

## Content-Modell

- Jedes Album hat `title`, `slug`, `date`, `status`, `cover` und `photos`.
- `status`: `draft` wird nicht gebaut, `published` erscheint auf der Startseite, `archived` im Archiv.
- Fotos haben `src`, `order`, `alt`, optional `caption` und `sha256`.
- Sortierung: Datum absteigend, dann Slug.

## Bildregeln

- Nur weboptimierte Display-Master committen, keine Originalscans.
- Import erzeugt sRGB-JPEGs, entfernt Metadaten/GPS und begrenzt die lange Kante auf ca. 3200 px.
- Originale nur außerhalb von Git sichern, optional mit `.analogcam.local.json`.
- Alt-Texte nach dem Import manuell prüfen; neutrale Startwerte sind nur Platzhalter.

## Abhängigkeiten

- Wenige Abhängigkeiten, bevorzugt Astro- und Node-Bordmittel.
- Kein Tailwind, Bootstrap, jQuery, Lightbox-Paket oder Frontend-Framework hinzufügen.
- `package-lock.json` muss committed bleiben; npm verwenden.

## Tests und Done

- Vor Abschluss: `npm ci`, `npm run astro:check`, `npm run photos:validate`, `npm run build`, `npm run size:check`.
- Keine Secrets, keine `.analogcam.local.json`, keine Originalscans committen.
- Lightbox per Maus und Tastatur prüfen, wenn UI geändert wird.
