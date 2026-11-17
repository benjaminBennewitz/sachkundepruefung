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
`scripts/ui/release.js` im Objekt `release` gepflegt. Bei neuen Neuigkeiten die
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
