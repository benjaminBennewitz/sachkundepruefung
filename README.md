# NRW Sachkundeprüfung Lernhilfe · v13

Kostenloser, unabhängiger Lerntrainer für das LHundG NRW. Statische HTML-/CSS-/JavaScript-Anwendung ohne Framework, Backend, Buildpflicht, Tracking oder externe Schriften.

## Änderungen in v13

- Einheitliche, sticky Navigation auf allen Seiten. Import, Export, Reset und Unterstützung per PayPal als beschriftete Icon-Schaltflächen; Hell-/Dunkel-Umschaltung über Sonne/Mond. Beim ersten Aufruf ohne gespeicherte Auswahl folgt die Darstellung dem System. Auf Inhaltsseiten führen Lernstand-Werkzeuge zum Trainer; dort ist die gewünschte Schaltfläche fokussiert und die Aktion erfordert einen weiteren bewussten Klick.
- „Gut zu wissen“ als eigene Seite. Neue Seite „Hundewissen“ mit amtlich belegter Einordnung von § 3 / § 10 / § 11, Sachkunde und Verhaltensprüfung. Stand der Quellen 06.11.2026. Die aktuelle Landesverordnung und Verwaltungsvorschriften haben bei abweichenden alten Stadtinformationen Vorrang.
- Testprofile: 34 aus Rhein-Erft 203, mindestens 24 richtig; MG-Simulation weiterhin 119 aus 398, mindestens 90 richtig; §-11-Übung 30 aus 197 ohne erfundene Bestehensgrenze. Alle Ziehungen sind zufällige Übungen ohne behauptete amtliche Themengewichtung. Die ursprüngliche MG-Speicheridentität bleibt kompatibel.
- Deutlicher Sofort-Feedback-Schalter, im Lernmodus zunächst aktiv. Neue Präferenz `lhundg-instant-feedback-v2`, Standard An. Prüfbutton an jeder Frage, Lösung erst nach ausdrücklichem Prüfen. Im Test vor Abschluss gesperrt.
- Einmaliger Unterstützungsdialog nach der ersten vollständigen Auswertung mit mindestens einer Antwort pro Browsersitzung; kein Hinweis nach einem bloßen Zwischenergebnis. Sitzungsmarkierung `lhundg-support-shown-v1`, keine Übermittlung oder Tracking. Header-Herz öffnet den Dialog jederzeit. Escape, Schließen und Fokus-Rückgabe werden unterstützt. Ohne persönliche PayPal-URL bleibt die Zahlungsaktion ausdrücklich als noch nicht eingerichtet gekennzeichnet; keine erfundene Empfängeradresse.
- Impressum mit den vom Betreiber gelieferten Daten. Allgemeine Datenschutztexte und Hostingangaben aus design-code-repeat.de/datenschutz übernommen; für diese App unzutreffende Aussagen zu Infrastructure API / Kontaktformular / CSRF-Cookies entfernt. Lernspeicher, Sitzungsmarkierung und PayPal ergänzt. Der Originaltext und Abrufzeitpunkt sind als Entwicklerreferenz in scripts/fixtures/dcr-privacy-source.json abgelegt. Die tatsächlichen Log-Löschfristen am Server bleiben vom Betreiber mit den übernommenen allgemeinen Angaben abzugleichen.
- Prominenter Disclaimer und Haftungshinweis mit Vorbehalt zwingender gesetzlicher Haftung. Keine Rechtsberatung und keine Garantie der Rechtswirksamkeit des Haftungstexts.
- Neue Inhaltsseiten sind vollständig statisch, indexierbar und in Navigation, Footer und Sitemap verlinkt. Header und Disclaimer stammen zentral aus scripts/ui-shell.mjs; Fach- und Datenschutzinhalte aus scripts/content-pages.mjs.

Dieser Patch setzt den eingespielten v12-Patch voraus. Den bestehenden assets-Ordner und data.js behalten. Fragen und Lösungen wurden in diesem Schritt nicht verändert. Als nächste konkrete Angabe fehlt der persönliche PayPal-Link. Die Freigabe der öffentlichen Wiederverwendung der Originalfragen/Abbildungen bleibt separat zu klären.

## Patch einspielen

Nur die neuen und geänderten Dateien über den bestehenden Projektstand kopieren. Der bestehende Ordner `assets/` muss erhalten bleiben. Die Anwendung nutzt daraus nur noch fachlich notwendige Aufgabenabbildungen; vorhandene unbenutzte Screenshots werden weder geladen noch pauschal gelöscht. Eine kleine lokale SVG-Datei dient als Favicon. Alle Textdateien im Patch verwenden CRLF.

## Noch vor dem öffentlichen Start erforderlich

In `site-config.js` vervollständigen:

- Betreiber: ladungsfähige Anschrift und Kontakt-E-Mail. Die gelieferten Betreiberangaben sind eingetragen.
- Tatsächlicher Hostinganbieter, dessen Anschrift und die tatsächliche Protokollierung / Log-Löschfrist. Nicht durch eine erfundene Standardfrist ersetzen. Datenschutztext gegen die reale Konfiguration prüfen.
- Persönlicher HTTPS-PayPal-Unterstützungslink. Nur paypal.com / paypal.me einschließlich www werden akzeptiert. Ohne gültigen Link wird kein funktionsloser Zahlungsbutton angeboten.
- Falls die finale Domain anders lautet, `origin` korrigieren.

Anschließend aus dem Projektverzeichnis:

```cmd
node scripts/prepare-pages.mjs
node scripts/validate-data.mjs
node --test scripts/core.test.cjs
node scripts/check-release.mjs --rights-confirmed
```

`--rights-confirmed` erst setzen, wenn die öffentliche Wiederverwendung der Fragen und Abbildungen tatsächlich erlaubt ist. Ein frei herunterladbares PDF ist keine automatische Wiederveröffentlichungslizenz. Das Skript meldet fehlende Angaben, ist aber keine Rechtsprüfung. Die gelieferten Betreiber- und vorhandenen Hostingangaben sind eingetragen; bei Änderungen der Infrastruktur bitte aktualisieren. Separate AGB wurden nicht angelegt.

Die generierten Seiten sind echte statische HTML-Dateien: Quellen, Impressum und Datenschutz funktionieren ohne JavaScript. `prepare-pages.mjs` aktualisiert außerdem Sitemap, robots.txt und den CSP-Hash für die strukturierten Daten. Bei einer späteren Domainänderung genügt die neue Origin-Konfiguration und eine erneute Generierung.

## Lernbereiche und geprüfte Inhalte

| Bereich | Fragen | Einordnung |
| --- | ---: | --- |
| Alle Quellen | 400 | Bisheriger Basispool plus zwei Formulierungsvarianten |
| §-3-Basispool | 398 | Bisheriger MG-Pool, mit berichtigtem Rhein-Erft-Schlüssel |
| Rhein-Erft 203 | 203 | Offizieller aktueller PDF-Schlüssel separat abgeglichen |
| Rhein-Erft 97 | 97 | Zugesandte Fassung, bestehender Schlüssel übernommen |
| Köln A/B/C | 115 | Zugesandte Fassung, A11 entfällt; eigener bestehender Schlüssel |
| Tierärztekammern ab 2025 | 197 | Ergänzender Katalog für § 11, beide Kammern identischer Inhalt |
| MG-Simulation | 119 | Aus 398 Basisfragen, bestanden ab 90, ohne Zeitlimit |

Die beiden beigefügten Kammer-Lösungsdateien sind bytegleich. Die Fragefassungen stimmen in allen 197 extrahierten Fragen samt Antworttexten überein; lediglich Layoutabstände unterscheiden sich.

Beim zusätzlichen Abgleich des alten Rhein-Erft-203-Datensatzes mit dem offiziell veröffentlichten PDF wurden drei Übertragungsfehler korrigiert: 158 → A/B/C/D, 160 → B/C/D, 161 → A/B/C/D. Das D steht in der Lösungstabelle nach einem Seitenumbruch auf Seite 50; die Überschriften stehen auf Seite 49. Alle 203 Schlüssel wurden positionsbezogen aus der offiziellen Tabelle verglichen, die fraglichen Seiten zusätzlich visuell geprüft. Keine Korrektur aus allgemeinem Hundewissen.

Nach diesen Berichtigungen entsprechen 195 Kammerfragen vorhandenen Fragen mit identischen Antworten und Lösungen nach Formatierungsnormalisierung. Bei 158 und 173 sind Formulierungen verschieden; diese Varianten bleiben zusätzlich erhalten. `QUESTION_AUDIT.json` enthält den ursprünglichen Vergleich und die abschließende Einordnung inklusive Korrekturen.

Die öffentlich verlinkte Kölner Fassung Mai 2019 ist eine andere Ausgabe als der zugesandte Katalog, z. B. bei A1. Ihre Lösungen werden nicht auf die importierte Fassung übertragen. Zur exakt zugesandten Köln- und Rhein-Erft-97-Fassung liegt noch kein verifizierter öffentlicher Direktlink vor. Das ist auf der Quellen-Seite und an den betreffenden Fragen ausdrücklich gekennzeichnet. Keine erfundenen Original-Links.

Die tatsächlichen MG-Fragen sind nicht bekannt. 119 / 90 / kein Zeitlimit beruhen auf einer privaten Mitteilung an den Initiator. Diese Angaben sind keine landesweite Regel und öffentlich nicht unabhängig bestätigt.

## Bedienung und Zugänglichkeit

- Hell, dunkel oder Systemdarstellung; sofort vor dem ersten Zeichnen angewandt.
- Responsive CSS-Grid-Layouts ab 320 px, begrenzte maximale Inhaltsbreite.
- Fokusfrage, acht Fragen pro Listenseite oder TV-Ansicht; keine hunderte Fragekarten gleichzeitig im DOM.
- Suche in Fragen und Antworttexten, Themenfilter für zugeordnete Themen, offene / beantwortete / geprüfte falsche Fragen sowie Merkliste.
- Die Themen stammen aus dem Kammerkatalog und sind auf identische Original-IDs des großen Rhein-Erft-Katalogs übertragen. Andere Fragen tragen „Weitere Themen“, keine automatisch erfundenen Kategorien.
- Mehrfachauswahl wird erst nach „Antwort prüfen“ bewertet. Jede Änderung entfernt die bisherige Einzelbewertung. In der Simulation gibt es vor der Gesamtauswertung kein Lösungsfeedback.
- Zuordnungen sind erst nach Wahl aller Positionen vollständig. Textzuordnungen sind in getrennte Begriffe und Positionen aufgelöst; keine unlesbaren zusammenextrahierten PDF-Spalten.
- Merkliste, Lernposition und Bewertungen werden je Lernbereich gespeichert.
- Export / Import als lokale JSON-Datei, mit Schema- und Größenprüfung. Import führt bestätigte Antworten zusammen; gleiche Fragen werden durch importierte Antworten überschrieben. Bewertungen werden zurückgesetzt. Simulationen werden nicht exportiert.
- Native Eingaben und Auswahlfelder, sichtbarer Fokus, beschriftete Fortschrittsanzeige, Skip-Link, Textmeldungen zusätzlich zu Farben, `prefers-reduced-motion`.
- TV: Links/rechts Fragen, hoch/runter Antwortfokus, Home/End erste/letzte Frage, Enter Auswahl. In Suche/Selects werden die Tasten nicht abgefangen. Fehlernummern und Fragenübersicht haben eine rasterabhängige Pfeilnavigation.

## Datenspeicherung

Die bisherigen Antwortschlüssel bleiben unverändert:

- `lhundg-answers-v1`
- `lhundg-answers-mg-v1`
- `lhundg-answers-rhein97-v1`
- `lhundg-answers-koeln-v1`

Neue Bereiche: `lhundg-answers-all-v1`, `lhundg-answers-kammer197-v1`. Der neue Gesamtbereich übernimmt beim ersten Öffnen den alten MG-Lernstand, falls noch kein eigener Gesamtlernstand existiert. Die anschließende Speicherung bleibt getrennt.

UI-Metadaten: `lhundg-meta-<modus>-v2`; dazu `lhundg-instant-feedback-v1` und `lhundg-theme-v1`. Vorhandene numerische Stringwerte für Sofort-Feedback bleiben kompatibel. Ungültige Antworttokens werden beim Wiederherstellen verworfen. Bei blockiertem oder vollem Speicher bleibt die Anwendung bedienbar und weist auf die notwendige manuelle Sicherung hin.

Prüfungen nutzen ausschließlich sessionStorage für Antworten/Prüfungszustand. Fragen-IDs in der URL werden auf exakt 119 eindeutige Einträge aus dem Basispool geprüft; fehlerhafte Auswahlen werden neu erzeugt. Die Kryptografie-API mit unverzerrtem Ziehen wird genutzt, sofern verfügbar.

## Öffentlicher Betrieb, SEO und Performance

- Sprechender statischer Titel, Beschreibung, Canonicals, Open Graph, WebApplication-JSON-LD ohne erfundene Bewertungen, Sitemap und robots.txt.
- Simulationen und TV-URLs erhalten `noindex,follow`; Apache setzt dies zusätzlich als Header. Normale Katalog-URLs verweisen kanonisch auf die Startseite.
- Keine externen Requests beim normalen Seitenaufruf. Quellen und PayPal sind reine ausgehende Links; keine Zahlungs-SDKs oder Drittanbieter-Assets.
- Bilder nur für bildabhängige Aufgaben, lazy / async und mit festen intrinsischen Abmessungen.
- `.htaccess`: Kompression, Cache-Steuerung, Referrer-Policy, CSP, kein Directory Listing. Entwicklungsdateien werden bei aktivem mod_rewrite nicht öffentlich ausgeliefert.
- HTTPS am Hosting konfigurieren. `.htaccess` ist Apache-spezifisch; beim Live-Start auf Unterstützung, Header, Kompression und mögliche Hosting-Overrides prüfen.
- Keine pauschale Garantie für Indexierung oder „100 Punkte“: Lighthouse und tatsächliche Server-Header müssen nach dem Deployment auf der realen Domain geprüft werden. Die Website wurde hier nicht auf den Produktivserver übertragen.

## Dateiverantwortlichkeiten

`app.js`: Lernablauf, Filter, begrenztes Rendering, Auswertung, Navigation.
`core.js`: reine Bewertungs-, Speicherprüfungs- und Zufallsauswahlfunktionen.
`data.js`: kanonische Fragen, stabile IDs/UIDs, referenzierte Pools, Bildabmessungen.
`sources.js`: Herkunft und verifizierte Referenz-Links.
`theme.js` / `common.js`: Darstellung und PayPal-Link-Aktivierung.
`site-config.js`: öffentliche Betreiberangaben.
`scripts/`: lokale Inhaltsgenerierung und Prüfung; kein Laufzeit-Build erforderlich.
