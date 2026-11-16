# Lernarbeitsplatz und Barrierefreiheit

Stand: 16. November 2026. Auf der freigegebenen Apricot-Gestaltung aufgebaut.

## Seiten und Wege

`index.html` ist die Begrüßungsseite mit Einstieg, Geschichte, FAQ und Unterstützung.
Sie lädt keine Fragenbestände und keine Lernsteuerung mehr. `lernen.html` enthält
den eigentlichen Trainer. Lernstände behalten dieselben lokalen Schlüssel und
bleiben deshalb beim Wechsel auf die neue URL verfügbar.

Alle internen Lernlinks zeigen auf `lernen.html`. Frühere Links zur Startseite
mit `mode`, `ids`, `tv`, `action` oder `#trainer` werden unter Erhalt der Parameter
weitergeleitet. Die Startseite und `#geschichte` bleiben direkt erreichbar.
Die neue Lernseite besitzt eigene Metadaten, einen Canonical und einen Sitemap-
Eintrag; Prüfungs- und TV-Varianten bleiben wie bisher noindex.

## Bildschirmhöhe und Scrollverhalten

Auf Desktop ab 1000 Pixel Breite und 620 Pixel Höhe besteht die Lernseite aus
zwei Grid-Zeilen: tatsächlich hohe Kopfzeile und verbleibender Lernraum.
Die Seite nutzt `100dvh`; das Padding liegt innerhalb dieser Höhe. Es gibt
keinen zweiten Abzug einer geschätzten Kopfzeile oder einer großen Überschrift.

Die Katalogspalte enthält Auswahl, Fortschritt, Weiterlernen, Merkliste und die
Buttons für Fragenübersicht und Testreihen. Die Werkzeugleiste enthält Katalog-
bezeichnung, Ansicht und den Zugang zu Filter/Auswertung. Filter, Testprofile
und Fragenübersicht verwenden das bestehende gemeinsame native Dialogsystem.
Die originalen Controls werden verschoben und zurückgeführt, nicht kopiert.

Sidebar und Werkzeugleiste haben keinen eigenen Y-Scroll. Für überlange Fragen,
Abbildungen, Rückmeldungen und die Listenansicht bleibt ein scrollbarer
Fragenbereich. Eine vollständige Darstellung jeder beliebig langen Frage in
jeder Fenstergröße ist ohne kleinere Schrift oder Scrollen nicht möglich.

Bei schmalen oder sehr niedrigen Fenstern nutzt die Lernseite den normalen
Dokumentfluss. Auch bei vergrößerter Schrift darf die Seite wachsen. Inhalte
werden dafür nicht versteckt oder verkleinert. Die Textvergrößerung über das
A11y-Menü hat Vorrang vor einer festen Fensterhöhe.

## Selects und Fragenübersicht

Die zuvor falsche Kombination aus Auswahl-Hintergrund und Auswahl-Textfarbe
wurde zentral in `styles/character.css` korrigiert. Der Auswahlhaken übernimmt
die aktuelle Textfarbe. Geöffnete Menüs erhalten die Farbrolle ihres Auslösers:
Waldgrün/Apricot in der Katalogspalte, das aktive Seitenschema in Dialogen.

Ausgelagerte Select-Menüs werden beim Öffnen in den aktuellen nativen Dialog
gehängt. Dadurch liegen sie im richtigen Top Layer und werden nicht durch
`inert` außerhalb des Dialogs unbedienbar. Außerhalb eines Dialogs liegen sie
weiterhin am Body. Die vorhandene Tastatursteuerung bleibt erhalten.

Für offen, beantwortet, richtig und falsch sind Hintergrund, Schrift und Rahmen
im Fragenraster jeweils vollständig festgelegt. Geprüfte Zustände haben Vorrang
vor „beantwortet“. Aktuelle Fragen haben einen Fokusrahmen; ✓, ×, Merker und
zugängliche Statusbeschriftungen bleiben erhalten.

## A11y-Menü

Der Personen-Button befindet sich in der Werkzeuggruppe des Headers, mobil
innerhalb des Hauptmenüs. Das mitgelieferte DCR-Modul dient als Referenz;
die Umsetzung nutzt die vorhandenen statischen JS-Module und den gemeinsamen
Dialog, ohne Angular oder zusätzliche Abhängigkeiten.

| Einstellung | Verhalten |
| --- | --- |
| Textgröße | 100 %, 112,5 % oder 125 %; bei Vergrößerung freier Seitenfluss |
| Bewegung | Systempräferenz, reduziert oder aus; gilt auch für JS-Akkordeons |
| Oberfläche | Gestaltet oder ruhiger Einstieg mit reduziertem Bild-/Titelumfang |
| Kontrast | Zusätzliche Kontrastrollen für helles und dunkles Schema |
| Statusfarben | Standard oder Blau/Orange; keine medizinische Farbsehkorrektur behauptet |
| Vorlesen | Sichtbare Frage samt Antworten oder redaktionelle Hauptinhalte |
| Ruhige Darstellung | Bewegung aus, ruhige Oberfläche und hoher Kontrast |
| Zurücksetzen | Nur A11y-Präferenzen zurücksetzen, Lernstände bleiben erhalten |

Die Einstellungen werden unter `lhundg-accessibility-v1` gespeichert. Gesperrter
Speicher verhindert die aktuelle Anwendung nicht. Fremde oder ungültige
Speicherwerte werden verworfen. Standardbewegung folgt der Systempräferenz.

Vorlesen startet nur auf ausdrücklichen Klick und ausschließlich mit einer
vom Browser als lokal gemeldeten deutschen Stimme. Fehlt diese, wird dies
angezeigt und die Vorleseaktion deaktiviert. Es wird kein externer Sprachdienst
eingebunden. Versteckte Lösungen und Feedbackbereiche werden nicht vorgelesen.
Ein Fragenwechsel beendet die Ausgabe und verwirft wartende Sprachabschnitte.
Vorlesen lässt sich pausieren, fortsetzen oder stoppen.

Die Datenschutzseite beschreibt Speicherung und lokale Sprachausgabe.
`connect-src 'self'` ermöglicht das bereits vorhandene lokale Nachladen der
Grundlagen; externe Verbindungen werden dadurch nicht freigegeben.

## Prüfung

- 73 Tests ausgeführt: 67 bestanden. Die neun neuen Tests bestehen vollständig.
  Die sechs bestehenden Fehler betreffen weiterhin fehlende Alt-Assets in der
  bereitgestellten Projekt-ZIP. Keine Aufgabenbilder wurden erfunden oder ersetzt.
- Neue Tests prüfen Speichergrenzen und Rücksetzen, Systembewegung, erhaltene
  Lernparameter, lokale Stimmen, Ausschluss verborgener Lösungen, Stoppen alter
  Sprachaufträge und den Dialog-/Farbkontext der Select-Menüs.
- SEO-Prüfung für acht Seiten erfolgreich. Statische HTML-/CSS-Verweise werden
  geprüft, bis die bestehende Pfadprüfung das fehlende dynamische PayPal-Icon
  meldet. Vollständige Daten-/Release-Prüfung ohne Originalbilder nicht möglich.
- Die Deployment-Archivprüfung akzeptiert die neue explizite Dateiliste und
  verwirft eine unbekannte PHP-Datei. Das ist eine Struktur-Fixture, kein Deployment.
- Neue/angepasste Funktionsdateien bleiben unter 400 Zeilen. Texte im Patch haben
  CRLF. Lern- und Bewertungskerne sowie Fragenbestände bleiben unverändert.
- Visuelle Browser-, Responsive- und Tastaturprüfung hier weiterhin nicht verfügbar.
  Die Bildschirmdarstellung und tatsächlich installierte lokale Stimmen bitte vor
  Übernahme lokal kontrollieren. Eine pauschale WCAG-Konformität wird nicht behauptet.

Empfohlene lokale Prüfung: 1440×900, 1366×768, 1024×768, 390×844 und 320×640;
Light/Dark/Systemmodus, Textgröße 125 %, Browserzoom 200 %, Fokus/Liste/TV,
lange Fragen und Abbildungen, alle Select-Zustände, Merkliste, Fragenraster,
Testneustart mit Bestätigung sowie Wechsel zwischen beiden Farbpaletten.

## Installation

Der Patch setzt den zuletzt gelieferten `Sachkundetrainer_Designidentitaet_Apricot_Patch.zip`
voraus und enthält nur seitdem geänderte oder neue Dateien. Die DCR-Referenz
wird nicht verändert. Die vorhandenen Bild-Assets weiterverwenden. Vor dem
nächsten Deployment das aktualisierte Serverskript gemäß `deployment/README.md`
erneut installieren. Das lokale Archiv-CMD nimmt jetzt auch `lernen.html` auf.
Es wurde nichts committed oder veröffentlicht.
