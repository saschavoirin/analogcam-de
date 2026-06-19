# Deployment: analogcam.de auf GitHub Pages und united-domains

Diese Anleitung ist auf GitHub Pages mit GitHub Actions und die Domain
`analogcam.de` bei united-domains zugeschnitten.

Die offiziellen GitHub-Pages-DNS-Werte wurden am 19. Juni 2026 gegen die
GitHub-Dokumentation geprüft:

- GitHub Docs: <https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site>

## 1. GitHub-Repository erstellen

Auf GitHub ein neues Repository erstellen:

```text
analogcam-de
```

Falls noch kein Remote gesetzt ist:

```sh
git remote add origin git@github.com:<GITHUB_USERNAME>/analogcam-de.git
```

Falls der Remote bereits existiert, prüfen:

```sh
git remote -v
```

Wenn aus dem Remote kein Benutzername erkennbar ist, in dieser Anleitung
`<GITHUB_USERNAME>` ersetzen.

## 2. Code nach main pushen

```sh
git branch -M main
git push -u origin main
```

## 3. GitHub Pages auf GitHub Actions stellen

In GitHub:

1. Repository öffnen.
2. Settings -> Pages.
3. Unter "Build and deployment" als Source "GitHub Actions" auswählen.

Die Workflows liegen in:

- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`

## 4. Custom Domain in GitHub eintragen

In Settings -> Pages bei "Custom domain" zuerst eintragen:

```text
analogcam.de
```

Speichern und die DNS-Konfiguration noch nicht sofort umstellen, wenn die
Domain bei GitHub noch nicht verifiziert ist.

Dieses Projekt verwendet keine `public/CNAME`. Bei GitHub-Actions-Deployments
ist die Pages-Einstellung für die Custom Domain maßgeblich; eine CNAME-Datei
wäre nur eine zusätzliche Dokumentation und darf keinen abweichenden Domainwert
enthalten.

## 5. Domain bei GitHub verifizieren

Wenn möglich zuerst unter GitHub -> Account/Organization Settings -> Pages die
Domain verifizieren. GitHub zeigt dafür einen TXT-Eintrag an.

Bei united-domains:

```text
Domain bzw. DNS-Symbol -> DNS-Einträge
```

Dort den von GitHub angezeigten TXT-Eintrag setzen. Erst nach erfolgreicher
Verifikation mit den eigentlichen Pages-DNS-Einträgen fortfahren.

## 6. Bestehende DNS-Einträge entfernen

Vor dem Setzen der GitHub-Werte entfernen oder ersetzen:

- Parking-A-Records
- Weiterleitungs- oder Webspace-Standardwerte
- vorhandene `@`-A-Records, die nicht zu GitHub Pages gehören
- vorhandene `@`-AAAA-Records, die nicht zu GitHub Pages gehören
- widersprüchliche CNAME- oder ALIAS/ANAME-Einträge
- Wildcard-Einträge wie `*.analogcam.de`

Keine Wildcard-DNS-Einträge verwenden.

## 7. DNS bei united-domains konfigurieren

Bei united-domains sinngemäß:

```text
Domain bzw. DNS-Symbol -> DNS-Einträge
```

Für `analogcam.de` vier A-Records setzen:

```text
@  A  185.199.108.153
@  A  185.199.109.153
@  A  185.199.110.153
@  A  185.199.111.153
```

Optional, aber empfohlen, vier AAAA-Records setzen:

```text
@  AAAA  2606:50c0:8000::153
@  AAAA  2606:50c0:8001::153
@  AAAA  2606:50c0:8002::153
@  AAAA  2606:50c0:8003::153
```

Für `www.analogcam.de` einen CNAME auf die GitHub-Pages-Standarddomain setzen:

```text
www  CNAME  <GITHUB_USERNAME>.github.io
```

Der Repository-Name wird beim CNAME nicht angehängt. GitHub Pages leitet die
korrekt konfigurierte `www`-Variante auf die in Pages eingetragene Custom
Domain weiter.

## 8. DNS prüfen

macOS/Linux:

```sh
dig analogcam.de +noall +answer -t A
dig analogcam.de +noall +answer -t AAAA
dig www.analogcam.de +nostats +nocomments +nocmd
```

Windows PowerShell:

```powershell
Resolve-DnsName analogcam.de -Type A
Resolve-DnsName analogcam.de -Type AAAA
Resolve-DnsName www.analogcam.de -Type CNAME
```

Die A- und AAAA-Antworten müssen den GitHub-Werten aus Abschnitt 7 entsprechen.
DNS-Änderungen können verzögert sichtbar werden, laut GitHub bis zu 24 Stunden.

## 9. HTTPS erzwingen

Wenn GitHub Pages die Domain erfolgreich geprüft hat:

1. Settings -> Pages öffnen.
2. "Enforce HTTPS" aktivieren.

Falls die Option noch nicht aktivierbar ist, warten und später erneut prüfen.

## 10. Deployment prüfen

Nach einem Push auf `main`:

1. Actions-Tab öffnen.
2. `CI` muss erfolgreich sein.
3. `Deploy to GitHub Pages` muss erfolgreich sein.
4. Danach `https://analogcam.de` und `https://www.analogcam.de` prüfen.

`www.analogcam.de` soll nicht als eigene Website laufen, sondern über GitHub
Pages auf die kanonische Domain `analogcam.de` weiterleiten.
