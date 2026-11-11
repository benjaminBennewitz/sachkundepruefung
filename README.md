# NRW Sachkundeprüfung – Lernhilfe

Kostenlose statische Lernhilfe mit lokalen Lernständen, quellenbezogenen Katalogen und
Testreihen. HTML, CSS und JavaScript ohne Framework, Paketinstallation, Werbung,
Tracking oder externe Schriften.

Entwicklung und Design: Benjamin Bennewitz **[B²]**.

## Verbindliche Inhaltsquelle

Die sechs HTML-Dateien im Projekt-Root sind die **Single Source of Truth**:
`index.html`, `gut-zu-wissen.html`, `hundewissen.html`, `quellen.html`, `impressum.html`
und `datenschutz.html`.

Inhalte, Header, Footer, Hinweise und Seitenmetadaten werden direkt dort gepflegt.
Es gibt keine zweite Fassung dieser Seiten in Generator-JavaScript oder zusätzlichen
HTML-Vorlagen und keinen Seitengenerator. Der Browser verwendet genau diese vorhandenen Dateien. Fragenkataloge und interaktiver
Lernzustand bleiben unabhängig davon in den bestehenden Lernskripten.

Das Deployment prüft und archiviert den gepflegten Stand. Es erzeugt keine Seiten,
minifiziert nichts und ändert weder HTML-Formatierung noch Einrückung oder Zeilenenden.
Lediglich der vorhandene CSP-Hash in `.htaccess` wird bei geändertem JSON-LD abgeglichen;
der HTML-Inhalt selbst bleibt dabei unangetastet.

## Ordnerstruktur

| Pfad | Aufgabe |
| --- | --- |
| `*.html` | Einzige Inhaltsquelle der öffentlichen Seiten |
| `styles/tokens.css` | Farben für Light, Dark und Systemmodus |
| `styles/interface.css` | Oberfläche, Zustände und responsive Layouts |
| `scripts/learning/` | Trainer, Profile, Zustand, Ansichten, Auswertung und Fragenbestand |
| `scripts/ui/` | Frühe Theme-Anwendung, gemeinsame UI und Custom Controls |
| `scripts/quality/` | Daten-, Pfad-, SEO-, Release- und Funktionsprüfungen |
| `scripts/site-config.js` | Laufzeit- und Prüfkonfiguration einschließlich Domain, Betreiber, Hosting und PayPal |
| `scripts/config.mjs` | Gemeinsame Pfade und Konfiguration der lokalen Prüfwerkzeuge |
| `scripts/prepare-deployment.mjs` | Vorprüfung für die direkte Archivierung der vorhandenen Dateien |
| `deployment/` | Vorhandenes Windows-Deployment, Serverskript und Anleitung |
| `assets/` | Lokale Aufgabenabbildungen und Werkzeugsymbole |
| `docs/` | Quellen, Audits, Pflegekonventionen und dokumentierte Prüfungen |

Ein Skript-Unterordner enthält mindestens drei fachlich zusammengehörige Dateien.
Der nicht mehr benötigte Seitenordner und der alte einmalige Strukturmigrator sind entfernt.

## Lokal entwickeln und prüfen

Die Werkzeuge benötigen Node.js ab Version 20. Die Website benötigt einen modernen Browser
und einen statischen HTTP-Server, beispielsweise VS Code Live Server. Nicht über `file://`
öffnen, damit Origin und Browserspeicher dem späteren Betrieb entsprechen.

```cmd
node scripts\quality\check-paths.mjs
node scripts\quality\validate-data.mjs
node --test scripts\quality\core.test.cjs scripts\quality\session.test.cjs scripts\quality\checks.test.mjs
node --test scripts\quality\html-preservation.test.mjs
node scripts\prepare-deployment.mjs --check-only
```

Die HTML-Erhaltungstests führen die echte Deployment-Vorbereitung ausschließlich in
aufgeräumten temporären Projektkopien aus. Sie laufen separat, damit sich die Vorprüfung
nicht über ihren eigenen Integrationstest erneut aufruft. Geprüft werden sowohl die reine
Vorprüfung als auch der CSP-Abgleich bei bewusst formatiertem JSON-LD.

Der Datenvalidator liest im Standardlauf ausschließlich vorhandene Dateien. Zum bewussten
Aktualisieren der dokumentierten Prüfaufnahme dient:

```cmd
node scripts\quality\validate-data.mjs --write-report
```

Der Bericht trennt das aktuelle technische Prüfdatum vom gespeicherten Quellenstand.
Er bestätigt keine erneute PDF- oder Rechtsprüfung. Die Vorprüfung bindet auch die
Regressionstests der Qualitätswerkzeuge ein. Dateiaufgaben, Prüfumfang und Grenzen:
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Inhalte und gemeinsame Bereiche pflegen

- Texte unmittelbar in der jeweiligen Root-HTML-Datei ändern.
- Gemeinsame Navigation, Footer und Hinweise bei einer Änderung in allen betroffenen
  Root-Seiten abgleichen. Keine zusätzliche Inhaltskopie in einem Skript anlegen.
- Betreiberangaben unmittelbar in Impressum und Datenschutz pflegen. Die vorhandene
  Konfiguration für Laufzeit und Release-Prüfung erzeugt daraus keine Texte.
- Titel, Beschreibung, Canonical und OpenGraph direkt in den Seitenköpfen pflegen;
  strukturierte Daten stehen unmittelbar in `index.html`.
- Neue öffentliche Seiten oder Domain-/Pfadänderungen auch in `sitemap.xml`, `robots.txt`
  und der bestehenden Prüfkonfiguration berücksichtigen.
- Fragen und Lösungsschlüssel nur mit belegter Originalquelle ändern. IDs, Poolreferenzen
  und Speicherschlüssel bei technischen Umordnungen erhalten.

Architektur und technische Pflege: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
Reisehinweise: [docs/TRAVEL_NOTES.md](docs/TRAVEL_NOTES.md).

## Domain und Deployment

Die Projektadresse ist **https://hunde-sachkundetrainer.de/nrw/**. Die Prüfkonfiguration
trennt Origin und Landespfad in `scripts/site-config.js`:

```js
origin: 'https://hunde-sachkundetrainer.de',
basePath: '/nrw',
```

`LHUNDG_ORIGIN` und `LHUNDG_BASE_PATH` können die Prüfwerte überschreiben. Sie schreiben
keine neuen Angaben in die Root-Seiten. Die vorhandenen Canonicals, JSON-LD- und
Sitemap-Adressen müssen zu diesen Werten passen; Abweichungen werden geprüft.

Die eigentliche robots.txt muss an der Domainwurzel liegen und auf
**https://hunde-sachkundetrainer.de/nrw/sitemap.xml** verweisen. Das bestehende Serverskript
legt sie bei Bedarf an und behält eine vorhandene Domain-robots.txt bei.

Das lokale Deployment archiviert ausdrücklich die öffentlichen Originaldateien in ein
temporäres TAR-Archiv. Keine Minifizierung, kein Build, kein `dist`-Ordner und keine
zusätzliche Veröffentlichungskopie. Tests, Werkzeuge und Dokumentation bleiben ausgeschlossen.
Anleitung: [deployment/README.md](deployment/README.md).

Der vorhandene Schalter `--rights-confirmed` dokumentiert ausschließlich eine tatsächlich
vom Betreiber abgegebene Freigabe. Er erteilt keine Rechte automatisch. Vor dem nächsten
Deployment von V38 das aktualisierte Serverskript installieren: Seine Dateifreigabe kennt
die neuen UI-Module. Anleitung: [deployment/README.md](deployment/README.md).

## Code und Dokumentation

Die Browser-Skripte bleiben klassische Skripte in ihrer bestehenden Ladereihenfolge.
Kommentare erklären Variablen, Aufrufe und Entscheidungen. Ergänzende Kommentare verwenden
`//`; Kommentare zu Bedingungen und Schleifen stehen darüber. Kurze rechte Kommentare
sind innerhalb zusammengehöriger Blöcke ausgerichtet. JSDoc steht mehrzeilig: Beschreibung,
Parameter und Rückgabe jeweils in eigenen Zeilen. Leerzeilen trennen Variablenblöcke,
Abfragen und weitere Verarbeitung. Die Dateiköpfe bleiben erhalten.

Ziel sind höchstens 400 Zeilen je Funktionsdatei und 20 Zeilen je Fachfunktion einschließlich
Dokumentation. Der unveränderte Lern-Altbestand `question-view.js` hat noch 414 Zeilen.
Kurze bekannte Funktionsausnahmen und Modulaufgaben stehen gesammelt in
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

CSS behält Autorenblock, Inhaltsverzeichnis und Abschnittsschema; keine Inline-Kommentare.
Projekttexte verwenden CRLF. Das ausführbare Linux-Serverskript behält entsprechend
`.gitattributes` bewusst LF. Archive gehören nicht ins Repository.

## Unterstützung und Favicon

PayPal.Me: https://paypal.me/BBennewitz, zentral als Laufzeitwert in `scripts/site-config.js`.
Alle Lernfunktionen bleiben kostenlos. Das PayPal-Zeichen liegt lokal unter
`assets/icons/paypal.svg`; es wird kein Zahlungs-SDK geladen.

Die Root-Seiten verlinken `favicon.svg`, `favicon.png` und `favicon.ico`.
Die bestehende Domainweiterleitung nach `/nrw/` wird vom vorhandenen Serverskript gepflegt.

## Prüfungsprofile und Quellen

Das Essen-Beispiel verwendet 50 Fragen mit eigener 17/17/16-Verteilung und einer ausdrücklich
eigenen Wertung ohne Teilpunkte. Es rekonstruiert keine Essener Originalprüfung.
Herkunft und Grenzen: [docs/ESSEN_EXAMPLE.md](docs/ESSEN_EXAMPLE.md).

## Ergänzende Dokumentation

| Datei | Zweck |
| --- | --- |
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Architektur, UI-Schnittstellen, Qualitätsprüfung und Pflege |
| [LEGAL_PREPARATION_AUDIT.md](docs/LEGAL_PREPARATION_AUDIT.md) | Fachlicher Themenabgleich, Quellenlücken und Ortskonflikte |
| [ESSEN_EXAMPLE.md](docs/ESSEN_EXAMPLE.md) | Private Behördenauskunft, eigene Annahmen und Herkunft eigener Fragen |
| [TRAVEL_NOTES.md](docs/TRAVEL_NOTES.md) | Redaktionelle Reisehinweise, offene Quellenkonflikte und amtliche Links |

`docs/QUESTION_AUDIT.json` bleibt als historischer Detailnachweis erhalten.
`docs/validation.json` ist die nur auf ausdrücklichen Aufruf aktualisierte technische Prüfaufnahme.
Alte Refactor- und Versionsprotokolle werden nicht parallel weitergeführt.
