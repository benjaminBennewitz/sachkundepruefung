# Validierung v19 · 06.11.2026

## Daten

- 612 stabile Quellfragen mit eindeutiger numerischer ID, UID und sourceKey/sourceId.
- Pools: 203 / 97 / 115 / 197, Basispool 398, Gesamtpool 400.
- Alle Antwortschlüssel vorhanden, keine unbekannten Antwortoptionen und keine fehlenden verwendeten Bilder.
- Alle 203 Rhein-Erft-Schlüssel gegen den offiziellen PDF-Schlüssel abgeglichen. Übertragungsfehler bei 158, 160 und 161 korrigiert (fehlendes D nach Seitenumbruch).
- Alle 197 Kammerfragen mit beiden bereitgestellten Fragenfassungen verglichen; Frage- und Antworttext stimmen normalisiert überein. Beide Lösungsdateien sind bytegleich. Lösungen über Originalnummern zugeordnet und wichtige Tabellen visuell kontrolliert.
- Rhein-Erft 97 und Köln 115: Schlüssel aus dem vorhandenen Stand übernommen, keine erneute Behauptung eines vollständigen Original-PDF-Audits für nicht beigefügte Originalfassungen.
- Öffentliches Kölner Referenz-PDF ist nicht identisch zur zugesandten Ausgabe und wird entsprechend gekennzeichnet.
- Bildbedarf ist explizit im Datenmodell hinterlegt; Textzuordnungen sind getrennt dargestellt.

## Automatisierte Prüfung

```cmd
node scripts/validate-data.mjs
node --test scripts/core.test.cjs
```

Geprüft werden u. a. vollständige MC-Wertung, zusätzliche falsche Antworten, Zuordnungspaare und Teilantworten, 119 eindeutige Zufallsfragen ohne Änderung der Quellreihenfolge sowie ungültige Speichertokens.

## Browserprüfung

- Desktop: Hell/Dunkel, Suche mit Leerzustand, Fokus-/Listenansicht, Merkliste.
- Antwortfeedback erst nach Bestätigung, Rücknahme nach Änderung, erneut richtige Wertung.
- Antworten, Bewertungen und Merkliste nach Reload wiederhergestellt.
- Lernstand als JSON exportiert und dieselbe Datei über den Dateidialog erfolgreich wieder importiert; bestätigte Zusammenführung im UI sichtbar.
- In einer 320-px-Browser-Einbettung echte mobile CSS-Breakpoints geprüft: keine horizontale Dokumentüberschreitung; aufgrund vertikaler Scrollbar 305 px nutzbarer Dokumentbereich. Tablet-Einbettung mit 768 px zusätzlich visuell geprüft.
- Vollständige und teilweise Zuordnung interaktiv geprüft; Teilantwort kann nicht einzeln ausgewertet werden.
- Prüfungssimulation erzeugt 119 Fragen; Einzelfeedback vor Abschluss gesperrt; offene Antworten werden bei bestätigter Auswertung als falsch gezählt.
- Farbtoken-Paare für normale Texte, Buttons, Erfolg, Fehler und Quellenhinweise in beiden Themes rechnerisch geprüft: alle untersuchten Text-Kontraste mindestens 4,5:1.

## Grenzen

Kein vollständiges WCAG-Konformitätsgutachten und keine Prüfung mit allen Screenreadern oder echten TV-Fernbedienungen. Keine Aussage über einen Lighthouse-Wert des Live-Hostings. Apache-Header und Kompression wurden hier nicht mit dem Produktivserver verifiziert. Betreiber-/Hostingangaben sind aus den bereitgestellten Angaben übernommen; die tatsächliche Protokollierung ist abzugleichen und der PayPal-Link noch zu ergänzen; die Rechte zur öffentlichen Übernahme der Fragen/Abbildungen sind vor dem Start zu klären. Der Release-Check meldet diese Punkte bewusst als offen.

## Ergänzende Prüfung v13

- Sechs automatisierte Kerntests erfolgreich, einschließlich eindeutiger Auswahl von 34 aus 203 und 30 aus 197 Fragen.
- 34er-Test im Browser gestartet: genau 34 Fragen, richtige Profilbeschreibung, Einzelfeedback während des Tests gesperrt.
- §-11-Übung im Browser gestartet und ausgewertet: genau 30 Fragen, Ergebnis „Deine §-11-Lernquote“, ausdrücklich keine feste Bestehensgrenze.
- Eigener Prüfbutton und Lösungsfeedback an einer Lernfrage interaktiv kontrolliert.
- Unterstützungsdialog nach erster Gesamtauswertung geöffnet, geschlossen und zweite Auswertung in derselben Sitzung ausgeführt: kein erneuter automatischer Hinweis.
- Sonne/Mond-Schalter im Browser betätigt, Zustand und zugängliche Beschriftung korrekt gewechselt.
- Mobile und Tablet-Breite mit echten Browser-Einbettungen geprüft: 320/768 px einschließlich Scrollbar, keine horizontale Dokumentüberschreitung.
- Gemeinsame Navigation, neue statische Informationsseiten und übernommene Kontaktdaten geprüft.
- Betreiberangaben sind nun vollständig übernommen. Offen bleiben persönliche PayPal-URL, Abgleich tatsächlicher Serverprotokollierung und Rechte zur öffentlichen Wiederverwendung.

## Ergänzende Prüfung v14

- Eigene Dropdowns im Desktop-Browser geprüft: Öffnen per Tastatur, Navigation ohne vorzeitige Übernahme, Enter zum Übernehmen, Escape ohne Änderung, Auswahl per Optionsklick.
- Filter-Reset synchronisiert das verborgene Datenmodell und die sichtbare Combobox. Eigene Such-Löschschaltfläche setzt den Suchtext zurück.
- Mobile 320-px-Einbettung mit geöffnetem Dropdown geprüft: kein horizontaler Dokumentüberlauf, Menü innerhalb des sichtbaren Bereichs. Tablet-Ansicht zusätzlich visuell geprüft.
- Neu gestaltete Checkboxen/Radios behalten die bestehenden semantischen Eingabeelemente und Auswertungslogik.
- Öffentliche HTML-Seiten und Quellenkonfiguration auf direkte PDF-/Dokument-Downloadlinks geprüft: keine solchen Links mehr vorhanden.
- Es wurden keine Fragen oder Lösungsschlüssel verändert. Die bestehende Kerntestsuite bleibt maßgeblich.

## UI-Prüfung v15

- Footer desktop in einer Zeile, Copyright und Entwicklerlink vorhanden.
- Rückkehr von Gut zu wissen zum Trainer ohne großen Fokusrahmen; Tastaturfokus bleibt erhalten.
- Speicherhinweis: padding-bottom 16 px.
- Fokusansicht: aufeinanderfolgende Fragen bei gleicher Scrollposition und gleicher Kartenoberkante geprüft.
- Alle 16 Aufgabenabbildungen im Browser erfolgreich geladen, darunter q006.webp.
- Ansichten mit 320 und 768 px Breite ohne horizontalen Überlauf; Hero-Hinweis sichtbar.
- Light und Dark Mode visuell geprüft; sechs bestehende Core-Tests erfolgreich.
- Der lokale 404 beim Nutzer ist nicht direkt einsehbar. Alle referenzierten Abbildungen sind im geprüften Stand vorhanden und werden zur Reparatur vollständig mitgeliefert.

## UI-Prüfung v16

- 1440 × 900 und 1366 × 768: linke Navigation, Kontrollbereich, Fragenfeld und Pagination innerhalb der sichtbaren Bildschirmhöhe geprüft.
- 320 und 768 px: normaler Seitenfluss ohne horizontalen Überlauf.
- Hero-Notiz bei Desktop etwa 614 × 271 px, inhaltlich zweispaltig.
- Fragenwechsel und Listenansicht (acht Karten) mit unveränderter äußerer Position des Lernlayouts geprüft.
- Sofort-Feedback und Zwischenauswertung erreichbar; lange Inhalte können im Fragenfeld gescrollt werden.
- Light und Dark Mode visuell geprüft. Lernstände und Datenformat bleiben kompatibel.

## Struktur und Deployment v17

- Neuer Stand basiert auf dem zuletzt bereitgestellten LHundG.zip. Alle 612 Frageobjekte, Pool-IDs und Bildmaße nach JSON-Normalisierung identisch zum Original-ZIP.
- Browsercode nach scripts/learning und scripts/ui verschoben; Entwicklung und Prüfung fachlich in scripts/pages und scripts/quality.
- CSS-Tokens konsolidiert; übrige Kaskadenreihenfolge erhalten, Regeln lesbar formatiert und mit Inhaltsverzeichnis dokumentiert.
- 18 Skripte syntaktisch geprüft. Sechs bestehende Core-Tests, Datenprüfung und 150 lokale HTML-Verweise erfolgreich.
- Reversible Migration mit Originaldateien erfolgreich, zweiter Aufruf ohne Änderung; veränderte Altdatei führt vor jeder Verschiebung zum Abbruch.
- Produktionsbuild ohne Domain blockiert. Produktionsmetadaten mit temporärer Testdomain geprüft, danach lokale noindex-Vorschau wiederhergestellt. Keine Veröffentlichung.
- CSP-Hash, Canonicals, Sitemap und Ausschluss aller Entwicklungsdateien im Paket geprüft.
- Serverskript: bash -n erfolgreich; gültiges Archiv akzeptiert, Traversal, Symlink und private Deployment-Datei abgewiesen.
- Oberfläche, Theme-Wechsel, Quellen-Navigation und fortbestehende Lernposition unter den neuen Pfaden im Browser geprüft; keine 404-Meldungen.
- Windows-CMD, echter SSH-Transport und produktives rsync wurden nicht ausgeführt.

## Direkte Archivierung v18

- Build-Skript und Erstellung einer Projektkopie entfallen.
- prepare-deployment.mjs prüft die Originaldateien; vor Veröffentlichung werden Seiten und Domainmetadaten direkt im Projekt aktualisiert.
- Das CMD-Skript archiviert ausschließlich die öffentlichen Originalpfade. Tests, Werkzeuge, Dokumentation und Deployment-Skripte bleiben ausgeschlossen.
- Historische Beschreibungen von Build und dist in älteren Prüfabschnitten gelten ab v18 nicht mehr.

- Direkte TAR-Erstellung mit exakt der Dateiliste aus dem CMD-Skript: 36 öffentliche Dateien, keine Entwicklungswerkzeuge. Archiv vom unveränderten Server-Prüfer akzeptiert.
- Produktionsvorbereitung ohne Domain weiterhin blockiert; sechs Core-Tests und 150 lokale Verweise erfolgreich geprüft.

## Crawling, Sitemap und Lesbarkeit v19

- Portfolio-Vorlagen aus dem bereitgestellten src.zip gelesen: AppComponent sowie BENTENDO- und DEAD//AIR-Skripte.
- Kürzere JSDoc-Blöcke, Dateipfad vor dem Header, getrennte Variablendeklarationen und Anweisungen sowie konsistente Einrückung.
- Für 17 ausschließlich dokumentierte und formatierte Skripte ausführbare Syntaxstruktur gegen v18 verglichen; Gruppierung von Variablendeklarationen normalisiert. Keine Logikänderung.
- Alle sechs Auswertungstests und die Datenprüfung erfolgreich; 150 lokale Verweise gültig.
- robots.txt erlaubt Crawling. Alle sechs Inhaltsseiten auf index,follow. Tests und TV-Ansichten behalten ihre bisherigen gezielten Indexierungsausnahmen.
- Offene Domain: keine leere Sitemap-Datei, kein falscher Sitemap-Verweis, keine erfundenen Canonicals.
- Mit temporärer Testdomain sechs vollständige Sitemap-URLs per XML-Parser geprüft, Canonicals und CSP-Hash kontrolliert. Direkte Archivierung und Server-Archivprüfung erfolgreich.
- Danach offene Domain wiederhergestellt. Kein Upload und keine Veröffentlichung.
