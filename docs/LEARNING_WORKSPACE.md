# Lernarbeitsplatz und Barrierefreiheit

Stand: 17. November 2026. Die Naturfarben und Magazinlayouts sind in
`docs/DESIGN_DIRECTION.md` dokumentiert; der versionierte Release-Einstieg in
`docs/RELEASE_NOTES.md`. Der Fragenbereich und seine Datenhaltung bleiben erhalten.

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

Auf Desktop ab 1000 Pixel Breite und 720 Pixel Höhe besteht die Lernseite aus
zwei Grid-Zeilen: tatsächlich hohe Kopfzeile und verbleibender Lernraum.
Die Seite nutzt `100dvh`; das Padding liegt innerhalb dieser Höhe. Es gibt
keinen zweiten Abzug einer geschätzten Kopfzeile oder einer großen Überschrift.

Die Katalogspalte enthält Auswahl, Fortschritt, Weiterlernen, Merkliste und die
Buttons für Fragenübersicht und Testreihen. Suche, Thema, Lernstatus und Ansicht
stehen direkt über den Fragen. Sofort-Feedback, Zwischenergebnis und Auswertung
stehen dauerhaft unter der Frage neben der Seitennavigation. Nur Testprofile
und Fragenübersicht verwenden das gemeinsame native Dialogsystem. Die
Werkzeugdialoge besitzen einen Schließen-Button neben der Überschrift.
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
die aktuelle Textfarbe. Menüs und Katalogspalte verwenden dasselbe aktive
Light-/Dark-Schema wie die restliche Oberfläche. Eine zusätzliche fest eingebaute
Dunkelpalette wird nicht mehr verwendet.

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
| Textgröße | 100 %, 125 % oder 150 %; bei Vergrößerung freier Seitenfluss |
| Kontrast | Zusätzliche Kontrastrollen für helles und dunkles Schema |
| Statusfarben | Standard oder Blau/Orange für Richtig/Falsch, mit direkter Vorschau; keine medizinische Farbsehkorrektur behauptet |
| Vorlesen | Sichtbare Frage samt Antworten oder redaktionelle Hauptinhalte |
| Zurücksetzen | Nur A11y-Präferenzen zurücksetzen, Lernstände bleiben erhalten |

Die Einstellungen werden unter `lhundg-accessibility-v1` gespeichert. Gesperrter
Speicher verhindert die aktuelle Anwendung nicht. Fremde oder ungültige
Speicherwerte werden verworfen. Bewegung folgt automatisch der Systempräferenz; zusätzliche Bewegungs- und
Oberflächenoptionen sind nicht mehr im Menü. Alte Werte werden nicht mehr angewendet.

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

- 99 Tests bestanden, einschließlich der bisherigen 17 Prüfungen zu Lernwerkzeugen
  und Kennzahlen sowie sechs Prüfungen zum Release-Einstieg. Zusätzliche Prüfungen betreffen
  den Schließen-Button und das Anwenden der alternativen Statuspalette. Die aktuelle
  Projekt-ZIP enthält die zuvor fehlenden Original-Assets.
- Neue Tests prüfen Speichergrenzen und Rücksetzen, bereinigte Altdaten, erhaltene
  Lernparameter, lokale Stimmen, Ausschluss verborgener Lösungen, Stoppen alter
  Sprachaufträge und den Dialog-/Farbkontext der Select-Menüs.
- Datenprüfung, lokale Verweisprüfung und SEO-Prüfung für acht Seiten erfolgreich.
  Eine fachliche Neubewertung der Originalinhalte war nicht Teil der Gestaltung.
- Die Deployment-Archivprüfung akzeptiert die neue explizite Dateiliste und
  verwirft eine unbekannte PHP-Datei. Das ist eine Struktur-Fixture, kein Deployment.
- Neue/angepasste Funktionsdateien umfassen höchstens 400 Zeilen. Texte im Patch haben
  CRLF. Lern- und Bewertungskerne sowie Fragenbestände bleiben unverändert.
- Visuelle Browser-, Responsive- und Tastaturprüfung hier weiterhin nicht verfügbar.
  Die Bildschirmdarstellung und tatsächlich installierte lokale Stimmen bitte vor
  Übernahme lokal kontrollieren. Eine pauschale WCAG-Konformität wird nicht behauptet.

Empfohlene lokale Prüfung: 1440×900, 1366×768, 1024×768, 390×844 und 320×640;
Light/Dark/Systemmodus, Textgröße 150 %, Browserzoom 200 %, Fokus/Liste/TV,
lange Fragen und Abbildungen, alle Select-Zustände, Merkliste, Fragenraster,
Testneustart mit Bestätigung sowie Wechsel zwischen beiden Farbpaletten.

## Installation

Der aktuelle Patch setzt die ZIP `dogtest--171126--0916.zip` voraus und enthält
nur seitdem geänderte oder neue Dateien. Vor dem nächsten Deployment das
aktualisierte Serverskript gemäß `deployment/README.md` erneut installieren.
Es wurde nichts committed oder veröffentlicht.

## Lernüberblick und Inhalte aus der Stitch-Referenz

Die Referenz liefert die Idee für persönliche Kennzahlen, direkte Katalogkarten,
separate Übungsprofile und einen Bildabschnitt. Farben, Typografie und Formensprache
verwenden inzwischen die Naturfarben. Zahlen und unzutreffende Prüfungsaussagen
der Referenz wurden nicht übernommen.

Die Begrüßungsseite zeigt sechs echte Kataloge und vier vorhandene Testprofile mit
deren aktuellen Größen. Der neue Lernüberblick bezieht sich ausschließlich auf den
zuletzt verwendeten Katalog. Die Kataloge werden wegen ihrer überlappenden Fragen
nicht zusammengerechnet. Geprüft richtig/falsch setzt eine vollständige Antwort
und eine noch gültige Prüfsignatur voraus. Eine Übungsquote ist keine Vorhersage
für eine Prüfung. In laufenden Prüfungssimulationen bleiben die zusätzlichen
Kennzahlen verborgen.

Der Trainer schreibt unter `lhundg-overview-v1` eine kleine lokale Zusammenfassung
ohne Einzelantworten, Zeitstempel oder Verlauf. Nur veränderte Zähler werden erneut
gespeichert. Die Startseite lädt dafür weiterhin keine großen Fragenbestände.
Ohne gültige Zusammenfassung erscheinen Gedankenstriche mit Erklärung; ein
vorhandener alter Lernstand wird beim nächsten Öffnen des Katalogs berücksichtigt.

Das A11y-Panel wurde auf Schriftgröße, Kontrast, Statusfarben und Vorlesen gekürzt.
Die Basisschrift verwendet jetzt `rem` statt einer festen Pixelgröße. Die zuvor
pauschal erzwungene zusätzliche Navigationszeile bei Textvergrößerung entfällt;
die Navigation kann bei tatsächlichem Platzmangel umbrechen. Vergrößerte Inhalte
bleiben weiterhin im freien Dokumentfluss erreichbar.

Die beiden früheren KI-Platzhalter sind auf der Startseite durch Originalfotos
ersetzt. Die eingesetzten Motive und deren Ableitungen sind in
`docs/DESIGN_DIRECTION.md` aufgeführt. Das persönliche Geschichtenbild bleibt
unverändert. Alle neuen öffentlichen Dateien sind in der strikten
Deployment-Dateiliste berücksichtigt.
Die visuelle Browserprüfung sowie ein praktischer Vergleich der Schriftgrößen
auf den Zielgeräten bleiben offen; Struktur- und Funktionstests ersetzen sie nicht.

## Fehlende richtige Antworten

Nach einer ausdrücklich geprüften Antwort kennzeichnet die Karte weiterhin ihre
Gesamtwertung. Zusätzlich werden richtig gewählte Antworten grün, falsch
gewählte rot und fehlende richtige Antworten gelb/amber dargestellt. Die
Beschriftungen „Richtig gewählt“, „Falsch gewählt“ und „Fehlte“ machen die
Bedeutung auch ohne Farberkennung verständlich. Fehlende Antworten besitzen
zusätzlich einen gestrichelten Rahmen. Die Blau/Orange-Einstellung übernimmt
die bekannten Richtig-/Falsch-Rollen; „Fehlte“ bleibt eine eigene Hinweisrolle.

Eine geänderte Auswahl entfernt alle alten Markierungen und Beschriftungen bis
zur erneuten Prüfung. Laufende Simulationen zeigen keine Lösungshinweise; erst
nach dem Abschluss werden die Zustände freigegeben. Bewertungsregeln und
Katalogschlüssel werden dafür nicht verändert.


## Personenprofile

`ui/learner-state.js` verwaltet ausschließlich Personen und Schlüssel.
`ui/learner-panel.js` verwendet den vorhandenen gemeinsamen Dialog. Die konfigurierte
Eigenschaft `LHUNDG_TRAINER.profiles` bezeichnet weiterhin Katalog- und Testprofile.
Die Personen heißen im Code deshalb ausdrücklich `LHUNDG_LEARNERS`.

`Session` bindet die Personenkennung beim Start fest und kapselt die Schlüsselbildung
in `storageKey()`. Import, Export und Metadaten verwenden weiterhin diese Session;
Kennzahlen und Startseitenvergleich greifen auf dieselbe Schlüsselbildung zu.
Standard behält die alten Schlüssel ohne destruktive oder duplizierende Migration.
Eine globale Profilwahl aus einem anderen Tab wechselt niemals eine laufende Session.

Der Trainer wartet auf `LHUNDG_LEARNERS_READY`, bevor er Lernstände liest oder den
Grundlagenhinweis öffnet. Dadurch bleibt die Reihenfolge Update, erste Profilwahl,
Grundlagen erhalten. Beim späteren Profilwechsel wird der bisherige Zustand gesichert;
eine laufende Prüfungsfolge wird nicht an die neue Person weitergereicht.


### Profilverwaltung ohne vorgegebene Person

`list()` liefert nur selbst benannte Personen. Ein früherer Eintrag mit Kennung
`standard` und Name `Standard` bleibt für die Datenübernahme unsichtbar. Ohne benannte
Person funktioniert der alte Lernstand weiter. Die historische Kennung bleibt ein
internes Detail und wird nicht als zusätzliches Vergleichsprofil gezählt.

`remove()` sichert betroffene Werte vor der Mutation und versucht bei Fehlern die
Wiederherstellung. Der UI-Aufruf erfolgt erst nach zwei unabhängigen Bestätigungen.
Beim Löschen anderer Personen bleiben aktive Lernstände unverändert. Gegenüber anderen
Tabs verhindern Profilkennung und interne Instanzkennung erneute Schreibzugriffe
veralteter Sessions. Der Vergleich verwendet ausschließlich die benannten Personen.
