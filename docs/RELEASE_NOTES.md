## Update-Dialog mit Historie

Der Dialog zeigt das aktuelle Update zuerst und darunter „Frühere Updates“ mit
Version und Datum. Der große Design-Refactor bleibt dort einschließlich Gestaltung,
ausgelagertem Lernbereich, Kennzahlen, Magazinseiten und Barrierefreiheit lesbar.
Die komplette Historie nutzt denselben scrollbaren Dialog; der Schließen-Button
oben erlaubt den Ausstieg, ohne bis zum Ende lesen zu müssen.

Die zentrale Liste `releases` in `scripts/ui/release.js` wird absteigend gepflegt.
Der erste Eintrag bestimmt Titel, aktuelle Neuigkeiten und automatische Anzeige.
Neue Releases oben ergänzen und vorhandene Einträge für die Historie erhalten.
Ältere Versionskennungen ohne dokumentierte Release-Inhalte werden nicht erfunden.

Die aktuelle Kennung bleibt `2026.11.17.2`. Die Historienergänzung erzwingt keine
zusätzliche automatische Anzeige. Release zuerst, manuelles Öffnen über „Was ist
neu?“, Escape, Fokus-Rückgabe und der einzelne Schlüssel `lhundg-release-seen`
bleiben erhalten. Nur das Schließen merkt die aktuelle Version; ältere Einträge
haben keinen eigenen Gesehen-Zustand.

## Ergänzung: Profilverwaltung

- Kein automatisch sichtbares Standardprofil. Lernen ohne benanntes Profil bleibt möglich.
- Das erste benannte Profil übernimmt vorhandene Lernschlüssel, ohne Daten zu kopieren.
  Ein alter unbenannter Stand neben bereits vorhandenen Profilen bleibt beim Anlegen
  eines weiteren Profils ausdrücklich übernehmbar.
- „Gemeinsam lernen“ ist bei null oder einer selbst benannten Person ausgeblendet.
- Profile lassen sich über „Löschen“ und zwei aufeinanderfolgende Bestätigungen entfernen.
  Abbrechen in jedem Schritt erhält alle Daten. Ein aktiver Lernbereich wird danach verlassen.
- Löschungen betreffen nur zugehörige Antworten, Merker, Metadaten, Kennzahlen, Lernpräferenzen
  und Teststände. Gemeinsame Farb-, Barrierefreiheits- und Update-Einstellungen bleiben erhalten.
- Andere offene Tabs werden über die lokale Speicheränderung informiert. Ihre zugehörigen
  Teststände werden entfernt; veraltete Sitzungen dürfen gelöschte Personen nicht erneut speichern.
- Eine interne Instanzkennung verhindert, dass eine alte Sitzung ein später neu angelegtes
  erstes Profil mit derselben historischen Speicherkennung überschreibt.

# Release 2026.11.17.2

## Lokale Personenprofile

Profile lassen sich auf der Startseite und im Lernbereich anlegen, benennen und
wechseln. Vor der ersten Lernsitzung erscheint die Wahl nach dem Update-Dialog;
der eigentliche Trainer wartet auf deren Abschluss. Name und Lernziel sind
freiwillige lokale Angaben. Alle Kataloge bleiben unabhängig vom Lernziel erreichbar.
Vorhandene Antworten und Merker bleiben unter ihren bisherigen Schlüsseln im
ersten selbst benannten Profil erhalten. Weitere Personen erhalten eigene Schlüssel.

Antworten, Merker, Bewertungen, Position, Sofort-Feedback, Grundlagenhinweis und
Katalogübersicht sind je Person getrennt. Tests bleiben im Sitzungsspeicher und
sind zusätzlich je Person getrennt. Ein bereits offener Tab behält sein Profil;
ein neuer Tab bietet die zuletzt gewählte Person an. Gemeinsame Einstellungen
für Farbschema, Barrierefreiheit und gesehene Update-Version bleiben unverändert.

Die Startseite vergleicht die Profile anhand des jeweils zuletzt verwendeten
Katalogs. Katalogname, Umfang und Zahl geprüfter Fragen machen die Grenzen des
Vergleichs sichtbar. Fehlende Daten werden als unbekannt dargestellt.

Import und Export betreffen nur die Kataloge der aktiven Person. Das bestehende
Dateiformat Version 1 bleibt lesbar; neue Exporte enthalten zusätzlich Name und
Lernziel. Importierte Dateien legen keine Person an und überschreiben keine
anderen Profile. Die Profile sind ohne Passwortschutz und ohne Cloud-Abgleich.

## Orientierung und Haltungserlaubnis

Haltung & Recht erläutert den Unterschied zwischen gemeinsamem Grundwissen und
gesetzlich verschiedenen Nachweiswegen für §§ 3, 10 und 11. Der neue Abschnitt
zur Haltungserlaubnis beschreibt Verfahren, Sachkunde, Führungszeugnis, Versicherung,
Chip, Unterbringung und besonderes Interesse. Mietrechtliche Zustimmung ist davon
getrennt. Startseite und Gut zu wissen verlinken die Orientierung.

Fragen, Lösungsschlüssel, Kataloggrößen und Bewertungsregeln bleiben unverändert.

## Update-Kennung

`2026.11.17.2` ersetzt beim Schließen den bisherigen Wert desselben Schlüssels
`lhundg-release-seen`. Das Update bleibt der erste automatische Dialog. Über
„Was ist neu?“ ist es jederzeit erneut erreichbar.

## Deployment

Die Server-Whitelist enthält die neuen Dateien `scripts/ui/learner-state.js`,
`scripts/ui/learner-panel.js` und `styles/learner-profiles.css`. Vor dem Deployment
muss die aktualisierte Servervorlage installiert sein. Kein Deployment ausgeführt.

---

# Release 2026.11.17

## Neuigkeiten

- Eigenständiger Lernbereich mit mehr Platz für Fragen und Werkzeuge.
- Lokaler Lernüberblick und katalogbezogene Kennzahlen.
- Kompakte Barrierefreiheit mit Textgröße, Kontrast, alternativen Statusfarben
  und lokaler deutscher Sprachausgabe, soweit verfügbar.

Die Lernfunktionen und Barrierefreiheitsfunktionen stammen teilweise aus den
vorherigen Entwicklungsschritten; das Pop-up stellt das gemeinsame aktuelle
Release vor. Geliefert bedeutet nicht veröffentlicht.

## Nächstes Release pflegen

Die Kennung und die sichtbaren Neuigkeiten werden ausschließlich in
`scripts/ui/release.js` in der Liste `releases` gepflegt; der erste Eintrag ist aktuell. Bei neuen Neuigkeiten die
Kennung erhöhen und die Script-Cachekennung auf allen acht HTML-Seiten anpassen.
Die Darstellung verwendet das bestehende native Modal; es gibt keine zweite
Dialogsteuerung.

`common.js` ruft `bindRelease` vor Geschichte und den weiteren Dialogbindungen
auf. Die Anmeldung an der bestehenden Warteschlange erfolgt vor dem ersten
`await`. Die nachfolgende Grundlagenbegrüßung wartet deshalb auf das Release.

Der feste Schlüssel `lhundg-release-seen` enthält nur die zuletzt geschlossene
Kennung als String. Eine andere Kennung zeigt das Pop-up erneut; nach dem
Schließen wird derselbe Schlüssel überschrieben. Auch Escape zählt als gesehen.
Vor dem Schließen erfolgt kein Speichereintrag. Es gibt keine Zeitstempel,
Versionshistorie oder Übermittlung. Gesperrter Speicher verhindert die Nutzung
nicht; dann kann der Hinweis beim nächsten Laden erneut erscheinen.

Die sechs Tests in `scripts/quality/release.test.cjs` prüfen dieses Verhalten
und die Reihenfolge des gemeinsamen Einstiegs. Sie laufen in der bestehenden
Deployment-Vorprüfung mit.

Die drei sichtbaren Neuigkeiten konzentrieren sich auf Lernbereich, Kennzahlen
und Barrierefreiheit. Die Gestaltung wird nicht als eigener Featurepunkt
aufgeführt. Diese redaktionelle Anpassung behält die Release-Kennung bei.

## Update erneut lesen

Der Footer-Link „Was ist neu?“ öffnet das aktuelle Update auch nach dem ersten
Schließen. Im Lernbereich steht derselbe Zugang bei den Informationslinks der
Seitenleiste. Der Dialog verwendet als sichtbare Bezeichnung „Update“; die
Versionskennung und der bestehende localStorage-Schlüssel bleiben erhalten.
Manuelles Öffnen verwendet dieselbe Dialogwarteschlange und gibt den Fokus an
den auslösenden Link zurück. Wiederholte Klicks erzeugen keine Dialogkopien.
