# Designidentität: Mensch & Hund

Stand: 16. November 2026. Apricot, Waldgrün, warmes Weiß, kräftige Sans-Serif-
Typografie und die gemeinsame Formensprache bleiben die gestalterische Grundlage.
Ein globales Linienmuster oder andere Hintergrundtexturen gibt es nicht. Die
Stitch-Referenz ergänzt Inhaltsideen und Bildrhythmus, ohne ihre Optik zu übernehmen.

## Aktueller Stand

Die Begrüßungsseite liegt auf `index.html`, der Lernarbeitsplatz auf `lernen.html`.
Inhaltsseiten, Quellen, FAQ, Dialoge und Footer nutzen dieselben Designrollen.
Die zusätzliche Trennung schafft Platz für Fragen, ohne den Einstieg zu verändern.

| Datei | Verantwortung |
| --- | --- |
| `styles/tokens.css` | Farb-, Typografie-, Abstands- und Formrollen |
| `styles/character.css` | Gemeinsame Navigation, Controls, Dialoge und Footer |
| `styles/editorial-identity.css` | Einstieg, Seitenauftakte und Wissensinhalte |
| `styles/learning-identity.css` | Lernkomponenten und vollständige Farbzustände |
| `styles/workspace.css` | Verfügbare Lernhöhe, Werkzeugdialoge und kleine Viewports |
| `styles/accessibility.css` | Kompaktes Menü, Textgröße, Kontrast und Statusfarben |
| `styles/learning-overview.css` | Persönliche Kennzahlen, Katalogkarten und Bildabschnitt |

Die bestehenden funktionalen Basis-Styles werden weiterverwendet. Es gibt
keine Frameworkmigration, keinen neuen Build und keine zusätzlichen Bibliotheken.
Die neuen beziehungsweise angepassten Funktionsdateien bleiben unter 400 Zeilen.

## Foto

`assets/public/lernfreund-platzhalter.webp` ist ein ausdrücklich gekennzeichneter
KI-Platzhalter, nicht Bens tatsächliche Hündin. Das Bild der persönlichen
Geschichte wird nicht ersetzt. Für das spätere Original sind 960 × 640 Pixel
vorgesehen; Ausschnitt aktuell horizontal mittig, vertikal 39 %. Bei Übernahme
Alternativtext und Platzhalterhinweis in `index.html` anpassen. Bei Umbenennung
zusätzlich HTML-Verweis und serverseitige Dateiliste ändern.

## Prüfung und Übernahme

Umsetzung, A11y-Einstellungen, Datenhaltung, Tests und verbleibende Grenzen sind
in `docs/LEARNING_WORKSPACE.md` dokumentiert. Die visuelle Browserprüfung bleibt
offen. Vorhandene Original-Assets sind weiterhin erforderlich. Das aktualisierte
Serverskript muss vor einem späteren Deployment erneut installiert werden.
