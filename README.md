# analogcam.de

Eine reduzierte statische Website für eigene analoge Fotografien. Es gibt kein
Backend, keine Datenbank, keine Cookies, kein Tracking, keine externen Fonts und
keine Drittanbieter-Skripte.

## Voraussetzungen

- Node.js 24 LTS
- npm 11 oder neuer
- Git

## Installation

```sh
npm ci
```

Beim ersten Klonen ohne `package-lock.json` nur einmal:

```sh
npm install
```

Danach wird immer `npm ci` verwendet.

## Lokale Vorschau

```sh
npm run dev
```

Die Adresse wird im Terminal angezeigt, meistens `http://localhost:4321`.

## Produktions-Build

```sh
npm run build
npm run preview
```

## Täglicher Ablauf

1. Scans in einen lokalen Ordner außerhalb dieses Repositories legen.
2. Album erstellen.
3. Fotos importieren.
4. `src/content/albums/<slug>/index.md` prüfen.
5. `npm run check` ausführen.
6. Vorschau ansehen.
7. Committen und nach `main` pushen.

## Neues Album

```sh
npm run album:new -- \
  --slug berlin-juni-2026 \
  --title "Berlin, Juni 2026" \
  --date 2026-06-01
```

Das Album startet mit `status: draft` und wird nicht öffentlich gebaut.

Der mitgelieferte Draft `src/content/albums/vorlage/index.md` hält die
Content Collection schon im leeren Projekt initialisiert. Er wird nicht
veröffentlicht und kann gelöscht werden, sobald mindestens ein eigenes Album
existiert.

## Fotos importieren

```sh
npm run photos:import -- \
  --album berlin-juni-2026 \
  --from "/Pfad/zu/meinen/Scans"
```

Der Import akzeptiert JPEG, PNG und TIFF. Die Quelldateien werden nicht
verändert oder gelöscht. Im Albumordner landen nur weboptimierte JPEG-Master:
sRGB, lange Kante ca. 3200 Pixel, ohne veröffentlichte Metadaten und ohne GPS.

Duplikate werden über SHA-256 der Quelldatei erkannt. Der Import kann mehrfach
ausgeführt werden, ohne dieselben Bilder erneut anzulegen.

## Metadaten und Alt-Texte bearbeiten

Bearbeite danach:

```text
src/content/albums/berlin-juni-2026/index.md
```

Wichtige Felder:

- `description`, `location`, `camera`, `lens`, `film` sind optional.
- `cover` bestimmt das Titelbild.
- `photos[].alt` muss individuell geprüft werden.
- `photos[].caption` nur ausfüllen, wenn eine Bildunterschrift angezeigt werden soll.

Der Import erzeugt neutrale Alt-Texte als Startpunkt. `npm run photos:validate`
weist darauf hin, welche Alt-Texte noch verbessert werden sollten.

## Album veröffentlichen

In `index.md`:

```yaml
status: published
```

Dann prüfen:

```sh
npm run check
npm run build
npm run size:check
```

## Album archivieren

```sh
npm run album:archive -- --album berlin-juni-2026
```

Das setzt `status: archived`. Das Album erscheint dann im Website-Archiv unter
`/archiv/`, bleibt aber unter `/alben/berlin-juni-2026/` erreichbar.

## Originale extern sichern

Das öffentliche Website-Archiv ist nur die Seite `/archiv/` für ältere Alben.
Es ist kein Speicherort für Originalscans.

Das private Originaldatei-Archiv liegt außerhalb von Git, zum Beispiel auf
einer externen Platte oder in einem lokalen Fotoarchiv. Beim Import kannst du
Originale dorthin kopieren lassen:

```sh
npm run photos:import -- \
  --album berlin-juni-2026 \
  --from "/Pfad/zu/meinen/Scans" \
  --archive-to "/Pfad/zum/Originalarchiv"
```

Oder lokal, nicht committet:

```json
{
  "defaultOriginalArchive": "/Pfad/zum/Originalarchiv"
}
```

Diese Datei heißt `.analogcam.local.json` und ist in `.gitignore` eingetragen.
Originale werden nur kopiert, nie verschoben oder gelöscht. Konflikte werden
nicht still überschrieben.

## Git-Commit und Push

```sh
git status
git add .
git commit -m "Add Berlin June 2026 album"
git push origin main
```

Nach dem Push startet GitHub Actions automatisch Prüfung und Veröffentlichung.

## Automatische Veröffentlichung

GitHub Actions führt aus:

```sh
npm ci
npm run astro:check
npm run photos:validate
npm run build
npm run size:check
```

Nur `main` wird per GitHub Pages veröffentlicht.

## Domain-Einrichtung

Die konkrete Anleitung steht in `docs/DEPLOYMENT.md`.

Kurzfassung:

1. Repository auf GitHub erstellen.
2. Code nach `main` pushen.
3. Settings -> Pages -> Source: GitHub Actions.
4. Custom domain: `analogcam.de`.
5. Domain per TXT-Eintrag verifizieren.
6. Danach DNS bei united-domains setzen.
7. HTTPS erzwingen, sobald GitHub die Domain geprüft hat.

## Häufige Fehler

- **Album erscheint nicht:** `status` steht noch auf `draft`.
- **Build bricht wegen Bildpfad ab:** `cover` oder `photos[].src` zeigt auf eine fehlende Datei.
- **Alt-Text-Warnungen:** Importierte neutrale Alt-Texte manuell verbessern.
- **Duplikat wird übersprungen:** Dieselbe Quelldatei wurde bereits importiert.
- **Domain noch nicht erreichbar:** DNS kann bis zu 24 Stunden verzögert sichtbar werden.

## Speichergrenzen

```sh
npm run size:check
```

Das Skript gibt die Größe von `dist` und der Webbildquellen aus. Es schlägt bei
ca. 850 MiB für `dist` fehl und warnt ab ca. 750 MiB Webbildquellen. GitHub
Pages ist gut für eine schlanke statische Fotoseite, aber nicht für ein
dauerhaft wachsendes Bildarchiv im Originalumfang.

## Spätere Migration auf externen Bildspeicher

Originalscans bleiben von Anfang an außerhalb von Git. Die Website nutzt eine
saubere Albumstruktur und zentrale Bildauflösung in `src/lib/images.ts`, damit
später Object Storage oder ein Image-CDN ergänzt werden kann, ohne das
Content-Modell grundlegend umzubauen.
