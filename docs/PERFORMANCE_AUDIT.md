# Performance-Prüfung vom 17. November 2026

## Gemessener Live-Stand vor diesem Patch

Alle acht öffentlichen Seiten wurden am 17. November 2026 zwischen 15:28 und
15:32 Uhr MEZ über PageSpeed Insights geprüft. Jeder Lauf enthält Mobil und
Desktop. Grundlage: Lighthouse 13.6.0, HeadlessChromium 157; Mobil emuliert ein
Moto G Power mit langsamer 4G-Verbindung. Es sind einzelne Labormessungen,
keine zugesicherten Dauerwerte. Die Läufe melden keine verfügbaren CrUX-Daten.

| Seite | Performance mobil | CLS mobil | LCP mobil | TBT mobil | Performance Desktop | CLS Desktop | LCP Desktop |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Startseite | 90 | 0,192 | 2,1 s | 0 ms | 99 | 0 | 0,4 s |
| Lernen | 77 | 0,544 | 2,3 s | 0 ms | 100 | 0 | 0,5 s |
| Grundlagen | 90 | 0,185 | 2,1 s | 0 ms | 99 | 0 | 0,4 s |
| Gut zu wissen | 91 | 0,185 | 2,0 s | 0 ms | 100 | 0 | 0,4 s |
| Haltung & Recht | 95 | 0 | 2,3 s | 100 ms | 100 | 0 | 0,5 s |
| Quellen | 91 | 0,185 | 1,5 s | 0 ms | 100 | 0 | 0,3 s |
| Impressum | 98 | 0 | 1,8 s | 0 ms | 100 | 0 | 0,4 s |
| Datenschutz | 98 | 0 | 1,4 s | 0 ms | 100 | 0 | 0,3 s |

Barrierefreiheit, Best Practices und SEO erreichen in diesen Läufen auf allen
acht Seiten jeweils 100 Punkte. Das ersetzt keine manuelle Prüfung.

INP lässt sich aus diesen Lade-Labormessungen nicht bewerten. TBT ist ein
separater Lighthouse-Wert und kein gemessener INP. Ohne Felddaten lässt sich
kein vollständiges Bestehen der Core Web Vitals bestätigen.

## Befund und Änderung

PageSpeed nennt auf Grundlagen den gesamten `main` als verschobenes Element
mit 0,185. Auf Lernen entfallen 0,184 auf `main.trainer` und weitere 0,360 auf
`.workspace`. Genannte Elemente sind die betroffenen Flächen; die Ursache muss
zusätzlich im Aufbau geprüft werden.

Der mobile Header zeigt im ursprünglichen HTML zunächst Navigation,
Projekthinweise und Werkzeugleiste im Dokumentfluss. Erst `navigation.js`
verschiebt diese Originalelemente in den Menüdialog. Die Kopfzeile wird dabei
kleiner und verschiebt den Inhalt. Je nach Lade- und Renderzeitpunkt kann der
Umbau vor dem ersten Paint stattfinden; ein einzelner Lauf mit CLS 0 auf einer
anderen Seite beweist daher nicht, dass deren identischer Header stabil startet.

`styles/navigation.css` legt das mobile Raster jetzt vor dem Umbau fest. Die
noch direkt im Header stehenden Menüinhalte nehmen bei aktiviertem JavaScript
keinen Platz ein. Nach der Initialisierung liegen dieselben Elemente im
bestehenden Dialog und werden dort unverändert dargestellt. Ohne JavaScript
greift diese Vorbereitung nicht; die ursprünglichen Navigationslinks bleiben
sichtbar. Es werden weder eine feste Gesamthöhe noch eine zusätzliche Animation
eingeführt. Vergrößerte Schrift darf die Kopfzeile weiterhin vergrößern.

Auf Lernen waren die mobilen Bereiche zunächst ausgeklappt, bevor
`workspace-tools.js` sie schließt. `styles/workspace.css` stellt den geschlossenen
Anfangszustand jetzt bereits vor der Bindung her. Die bestehenden `hidden`-
Zustände und die bisherigen Breakpoints übernehmen danach wieder die Steuerung.
Das HTML kündigt den Anfangszustand passend mit `aria-expanded="false"` an.
Desktop, die unabhängigen Klappschalter und vorhandene Filter bleiben erhalten.

Die sechs redaktionellen Auftaktbilder erhalten außerdem `fetchpriority="high"`.
Sie werden schon bisher sofort geladen und haben feste intrinsische Maße.
Bildinhalte, Ausschnitte und Layoutgrößen wurden nicht verändert. Die Startseite
hatte die Priorität bereits. Cache-Versionen der beiden geänderten Styles wurden
auf allen betroffenen Seiten erhöht. Neue öffentliche Dateien sind nicht nötig.

## Weitere Hinweise aus den Berichten

PageSpeed nennt zusätzlich Bildoptimierung und blockierende Stylesheets.
Auf Grundlagen beträgt die geschätzte Bildersparnis mobil 107 KiB, auf Gut zu
wissen 81 KiB und auf Quellen 23 KiB. Diese Schätzungen sind keine Erklärung für
den gemeinsamen Layoutsprung. Die gezeigten LCP-Werte liegen bereits unter
2,5 Sekunden. Ein Umbau des gesamten Stylesystems oder zusätzliches Laden von
Frameworks wäre für diese beiden konkreten Ursachen unverhältnismäßig.

## Durchgeführte Prüfungen und Grenzen

- `node scripts/prepare-deployment.mjs --check-only`: 131 Tests erfolgreich.
- Acht HTML-Seiten mit 564 lokalen Verweisen erfolgreich geprüft.
- Titel, Beschreibungen, Canonicals, Sitemap, robots.txt und JSON-LD erfolgreich geprüft.
- Geänderte Dateien mit CRLF; vorhandene Deployment-Whitelist bleibt ausreichend.
- Fragebestände, Lösungsschlüssel, Bewertung und gespeicherte Lernstände unverändert.
- Keine Veröffentlichung oder Serveränderung ausgeführt.

Die Messwerte oben gehören zum unveränderten Live-Stand. Ein neuer Score oder
CLS-Wert nach dem Patch wurde nicht gemessen. Ein lokaler Chromium-Prozess ist
in dieser Ausführungsumgebung gesperrt; der Cloud-Browser kann nur den Live-Stand
erreichen. Deshalb ist auch die visuelle Prüfung der geänderten Styles noch offen.

Nach dem Einspielen zunächst bei 320, 390, 800, 801 und 1280 Pixel Breite prüfen:
Menü öffnen/schließen, Tastaturfokus, beide Lern-Klappbereiche, Light/Dark Mode,
Textvergrößerung und Wechsel zwischen Mobil- und Desktoplayout. Navigation auch
mit deaktiviertem JavaScript prüfen. Dann jede URL in PageSpeed erneut messen;
bei abweichenden Ergebnissen zwei weitere Läufe durchführen. Die ersten Besuche
mit Update- und Profilwahl sowie spätere Besuche getrennt betrachten.

## Messwerkzeug und technische Grundlagen

- [PageSpeed Insights](https://pagespeed.web.dev/): Die jeweilige vollständige
  URL einschließlich `/nrw/` prüfen und Mobil/Desktop getrennt vergleichen.
- [Layoutverschiebungen vermeiden](https://web.dev/articles/optimize-cls)
- [CSS-Medienmerkmal scripting](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/scripting)
