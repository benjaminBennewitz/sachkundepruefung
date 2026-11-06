# Validierung v13 · 06.11.2026

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
