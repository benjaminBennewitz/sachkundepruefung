# Technische Dokumentation

Pflegestand: 11.11.2026, Codebasis V40 · Benjamin Bennewitz [B²].
Diese Datei beschreibt Architektur, Schnittstellen und Pflege. Einstieg und lokale Befehle:
[README](../README.md). Serverinstallation und Veröffentlichung:
[Deployment-Anleitung](../deployment/README.md).

## Inhaltsquellen und Aufbau

Die sechs Root-HTML-Dateien sind die einzige Inhaltsquelle für die öffentlichen Seiten.
Texte, Navigation, Footer, Hinweise und Metadaten werden unmittelbar dort gepflegt.
Es gibt keinen Seitengenerator und keine parallelen HTML-Templates. Auch eine Änderung
der Betreiberkonfiguration erzeugt keine neuen Rechtstexte. Gemeinsame Bereiche bei
Änderungen in allen betroffenen Root-Seiten abgleichen.

Fragen und Lösungsschlüssel stehen in den Lernskripten. Dynamisch erzeugte Fragenkarten,
Modale und Controls sind Anwendungselemente; sie ersetzen keine Root-Inhaltsseiten.

Browsercode sind klassische Scripts mit ausdrücklich gepflegter Reihenfolge und `defer`.
Nur `scripts/ui/theme.js` läuft früh und synchron im Head, damit die gespeicherte Farbwahl
vor dem ersten Zeichnen angewendet wird. Lokale Werkzeuge verwenden `.mjs` für ES-Module
und `.cjs` für CommonJS. Node.js ab Version 20 genügt; kein Framework, Bundler oder Build.

### Lernmodule

| Datei unter `scripts/learning/` | Verantwortung |
| --- | --- |
| `data.js`, `essen.js`, `sources.js` | Quellfragen, eigener Essen-Beispielpool und Quellenmetadaten |
| `core.js` | DOM-unabhängige Antwortvalidierung, Auswahl und Teilbewertung |
| `profiles.js` | Pools, Testumfänge, Grenzen und historische Speicherschlüssel |
| `dom.js` | Sichere DOM-Helfer und gemeinsame Typverweise |
| `session.js` | Fragenfolge, Zustand, Wiederherstellung und Speicherzugriff |
| `question-view.js` | Fragenkarte, Abbildungen, Herkunft und Lösungsfeedback |
| `learning-view.js` | Ansichten, Fortschritt, Navigation und Fokus |
| `filter-view.js` | Suchtreffer, direkte Merkliste, Status-/Themenfilter und gefilterte Fragenverweise |
| `results.js` | Abschlussbestätigung, Übungswertung und Ergebnisdarstellung |
| `progress.js` | Vollständige Importvalidierung, Zusammenführung und Katalogexport |
| `keyboard.js` | TV-Steuerung und Bewegung im Fragenraster |
| `controller.js` | Controls und Bedienaktionen verbinden |
| `app.js` | Session, Lernansicht und Controller erzeugen und starten |

Registrierung unter `window.LHUNDG_TRAINER`, zuerst durch `profiles.js`. Der kleine
`app.js`-Einstieg bleibt sinnvoll: Module definieren ihre Aufgaben, erst der Einstieg
erzeugt die laufende Anwendung. Zustände werden über Konstruktorparameter weitergegeben.
`QuestionView` meldet Änderungen an die Lernansicht über einen Callback.

Die verbindliche Reihenfolge steht in `index.html`: zentrale Konfiguration, gemeinsame UI,
Daten, Essen-Erweiterung, Quellen, Core, Profile, DOM, Session, Fragenansicht, Lernansicht,
Ergebnisse, Sicherungen, Tastatur, Controller, App und anschließend Custom Controls.
`filter-view.js` wird vor `learning-view.js` eingebunden; die Lernansicht erzeugt genau eine
Filtersteuerung mit demselben Session-Zustand.

### UI und zentrale Skripte

| Datei unter `scripts/ui/` | Verantwortung |
| --- | --- |
| `theme.js` | Frühe gespeicherte Farbwahl ohne Modulabhängigkeiten |
| `shared.js` | Sichere Text-/DOM-Helfer, PayPal-Icon, Farbwahlschalter und native Details-Animation |
| `modal.js` | Nativer Dialog, Aktionen, Warteschlange und Fokus-Rückgabe |
| `toast-item.js` | Einzelne Meldung mit pausierbarer Laufzeit und Schließen |
| `toasts.js` | Warteschlange, Duplikatschutz und getrennte Live-Ankündigungen |
| `support.js` | Freiwillige Unterstützung, PayPal-Ziel und Sitzungsbegrenzung |
| `common.js` | Bestehende öffentliche UI-Schnittstelle und Initialisierung |
| `select-view.js` | Darstellung, Beschriftung, Optionen und Viewport-Position |
| `select-keyboard.js` | Tastatur und Anfangsbuchstabensuche |
| `select.js` | Natives Auswahlmodell und Bedienzustand |
| `controls.js` | Initialisierung, Außenereignisse, Aktualisierung und Suchfeld |

Gemeinsame Reihenfolge: `shared`, `modal`, `toast-item`, `toasts`, `support`, `common`.
Die Lernseite lädt anschließend vor `controls` die Module `select-view`, `select-keyboard`
und `select`. Informationsseiten benötigen diese drei Select-Fachmodule nicht.
Bei neuen Selects auf weiteren Seiten deren Abhängigkeiten ebenfalls ausdrücklich einbinden.
`controls.js` erhält `refreshCustomControls()` auf allen Seiten.

`SelectView` bündelt die Darstellung; `CustomSelect` erweitert sie um Bedienung und
Modelländerungen. `SelectKeyboard` hält den eigenen Suchzustand je Instanz.
`window.LHUNDG_UI_PARTS` verbindet interne Bausteine, ist aber keine Anwendungsschnittstelle.

Direkt unter `scripts/`: `site-config.js` enthält zentrale Laufzeitwerte, `config.mjs` liest
und normalisiert diese einschließlich `LHUNDG_ORIGIN`/`LHUNDG_BASE_PATH`.
`prepare-deployment.mjs` koordiniert Prüfungen und den begrenzten CSP-Hash-Abgleich.

## UI-Schnittstellen und Zustandsregeln

`window.LHUNDG_UI` ist eingefroren. Inhalte werden über Textknoten ausgegeben.
Vorhandene Styles und Zustandsklassen liegen in `styles/interface.css`.

```js
const accepted = await window.LHUNDG_UI.confirm({
  title: 'Lernbereich zurücksetzen?',
  message: 'Antworten und Merkliste werden gelöscht.',
  confirmLabel: 'Ja, zurücksetzen',
  cancelLabel: 'Weiterlernen',
  danger: true
});

// Erst eine ausdrücklich bestätigte Entscheidung darf die nachfolgende Änderung auslösen.
if (!accepted) return;
```

`confirm(options)` liefert `Promise<boolean>`; Escape und Abbrechen liefern `false`.
`modal(options)` liefert `Promise<string>`, beim Abbrechen `cancel`. Optionen:
`title`, `message`, `actions`, optional `eyebrow`, `note`, `returnFocus`.
Aktionen besitzen `label` und entweder einen schließenden `value` oder ein externes `href`;
optional `primary`, `danger`, `autofocus`, `paypal`. Links schließen den Dialog nicht.
Die vollständigen Typen stehen in `modal.js`.

Ein wiederverwendetes natives `dialog` übernimmt die modale Browserbedienung.
Aufrufe warten nacheinander. Abbruch erhält bei Bestätigungen den Anfangsfokus;
nach Schließen geht der Fokus ohne Scrollsprung zum noch vorhandenen Auslöser zurück.
Auch die freiwillige Unterstützung verwendet diese Warteschlange.

```js
window.LHUNDG_UI.toast('Lernstand geladen.', { type: 'success' });
window.LHUNDG_UI.toast('Speicherung blockiert.', {
  type: 'warning', key: 'storage-failed', duration: 0
});
```

Toast-Typen: `info`, `success`, `warning`, `error`. Infos/Erfolge verschwinden standardmäßig
nach 8 Sekunden, Warnungen/Fehler erst nach Schließen. `duration: 0` bleibt unbegrenzt;
`key` verhindert sichtbare und wartende Duplikate. Höchstens drei Meldungen sind sichtbar,
weitere warten in Eingangsreihenfolge. Maus-, Tastaturkontakt und verdeckter Tab pausieren
die Restzeit. Infos werden höflich, Warnungen/Fehler dringlich und gebündelt angekündigt.
Toasts übernehmen beim Erscheinen keinen Fokus und verschieben den Lernbereich nicht.

`openSupportDialog({ automatic, returnFocus })` liefert `Promise<void>`. Automatische
Anzeige höchstens einmal je Sitzung; manuelle Aufrufe bleiben möglich. Nur bekannte
HTTPS-PayPal-Ziele werden sichtbar. Fehlender Zahlungslink oder gesperrter Speicher
sperrt keine Lernfunktion. `refreshCustomControls()` synchronisiert programmatisch geänderte
Select-Werte/Sperren und den Suchfeld-Löschbutton. Pfeile ändern zunächst nur die aktive
Option; Enter/Leertaste übernehmen sie. Escape verwirft die vorläufige Auswahl, Tab lässt
den regulären Fokuswechsel zu. Gesperrte Optionen werden übersprungen. Die normalisierte
Anfangsbuchstabensuche wird nach 700 ms zurückgesetzt.

Kataloge verwenden `localStorage`, konkrete Prüfungsfolgen getrennt `sessionStorage`.
IDs, UIDs, Antwort-/Metadaten-Schlüssel und historische Fallbacks nicht beiläufig ändern.
Bewertungen gelten nur für dieselbe Antwortsignatur; laufende Tests zeigen Lösungen erst
nach Abschluss. Import wird vollständig validiert, bevor Speicheränderungen erfolgen.
Export enthält Katalogstände, keine Prüfungssitzungen. Speicherfehler lassen den aktiven
Arbeitsspeicher nutzbar und erzeugen höchstens einen bleibenden Warnhinweis.

## Such-/Merklistenführung und Bewegung

Die Merkliste war bereits im Lernstatusfilter vorhanden und besitzt jetzt einen direkten,
auch im leeren Zustand bedienbaren Zugang mit Anzahl. Er öffnet ausschließlich die Merker
des aktuellen Lernbereichs als Achter-Liste und hebt vorherige Text-/Themenfilter auf.
Die Überschrift kennzeichnet die Merkliste; `Alle Fragen anzeigen` führt zurück zum Katalog.
Eine danach gewählte Suche oder ein Thema darf die Merkliste weiter eingrenzen. Leere
Merklisten und nur durch Filter verborgene Merker erhalten unterschiedliche Erklärungen.
Die gespeicherten Antwort-, Merker- und Bewertungsschlüssel ändern sich nicht.

Suche bleibt eine wörtliche, deutsch kleingeschriebene Suche in Originalnummer, Fragetext
und sämtlichen Antworttexten. Der sichtbare Hinweis nennt diesen Umfang. Treffer-Navigation
und Fragenraster zeigen dieselbe Folge; Raster-Direktsprünge erhalten die Filter. Andere
Direktsprünge, etwa Fehlernavigation oder Filterlöschen, verwenden weiterhin den vollständigen
Katalog. Nach Entfernen letzter Merker bleibt eine existierende Achterseite erreichbar.
`Treffer als Liste anzeigen` synchronisiert auch das native Ansichts-Control und dessen
sichtbare Combobox. Es entsteht kein zweiter Lernstand und keine neue Ergebnisseite.

`DetailsMotion` in `shared.js` verbindet jeweils nur den direkten Summary-Auslöser mit
seinem nativen Details-Element. Beide Höhen werden tatsächlich aus dem vorhandenen Layout
gemessen; keine feste Maximalhöhe. 240-ms-Animationen lassen sich am Zwischenstand umkehren.
Programmatische Offen-Zustände, verschachtelte Bereiche und Summary-Links bleiben unabhängig.
Bei `prefers-reduced-motion: reduce` oder fehlendem `Element.animate` wird unmittelbar
umgeschaltet. Select-Menüs nutzen ergänzend CSS-Übergänge für Browser mit diskreten
Display-Transitionen; ohne diese Unterstützung bleibt die bisherige unmittelbare Bedienung.

Runde Icon-Buttons erhalten explizite Innenabstände und mittige SVG-Zellen. Bookmark-Buttons
behalten quadratische Maße auch im mobilen Layout; der Such-Löschbutton verwendet eine
explizite Zeilenhöhe. Farben und Zustände verwenden ausschließlich vorhandene Design-Tokens.
Die CSS-Datei wurde syntaktisch geparst; der bestehende Autorenblock blieb unverändert.
Der lokale Chromium-Start war wegen gesperrter Socket-Erzeugung nicht möglich. Pixelgenaue
Zentrierung, tatsächliche Animationswirkung und native Tastatur-/Dialogdetails benötigen
deshalb weiterhin die Sichtprüfung im realen Browser; die DOM-Tests simulieren Geometrie
und Animationsabschluss.

## Qualitätsprüfung und Nachweise

| Werkzeug unter `scripts/quality/` | Prüfumfang |
| --- | --- |
| `validate-data.mjs`, `data-rules.mjs` | Identitäten, Antworten, Abbildungen, Referenzschlüssel, Poolkopien und Essen-Metadaten |
| `check-paths.mjs`, `markup.mjs` | Lokale Verweise, Paketgrenzen, echte IDs, Sprungziele und statisches Markup |
| `check-seo.mjs` | Titel, Beschreibungen, H1, Canonical, OpenGraph, Indexierung, Sitemap, robots.txt und JSON-LD/CSP |
| `check-release.mjs` | Konfigurationsangaben, optionales PayPal-Ziel und manuelle Rechtebestätigung |
| `core.test.cjs`, `session.test.cjs` | Bewertung, Zufallsauswahl, reale Profilwerte, Speicher, Import und Export |
| `filters.test.cjs` | Antworttext-Suche, Statusregeln, Merkliste, Treffergrenzen und gefilterte Navigation |
| `checks.test.mjs` | Bewusst fehlerhafte Eingaben für die Qualitätswerkzeuge |
| `html-preservation.test.mjs` | Bytegenauer HTML-Erhalt bei Vorprüfung und CSP-Abgleich |
| `learning-fixtures.cjs`, `quality-fixtures.mjs` | Isolierte Datenkontexte, Speicherersatz und temporäre Prüfeingaben |
| `official-keys.json` | Gespeicherte amtliche Referenzschlüssel; keine laufend neu abgerufenen Quellen |

Standardprüfungen und einzelne Testbefehle stehen im Root-README. `--check-only` verändert
keine Projektdateien. Die HTML-Erhaltungstests laufen separat, weil sie selbst die echte
Vorbereitung aufrufen; ihre Aufnahme in deren Testliste würde eine Rekursion erzeugen.
Temporäre Testkopien schließen Repository, Archive und Deploymentverzeichnisse aus.

`validate-data.mjs` liest standardmäßig nur. Ausschließlich `--write-report` schreibt
`docs/validation.json` mit CRLF. `date` ist der technische UTC-Prüftag, `referenceDate` der
hinterlegte Quellenstand. `verifiedOfficialKeys` zählt den Vergleich gegen den gespeicherten
amtlichen Schlüssel, keine neue PDF-/Rechtsprüfung. `QUESTION_AUDIT.json` bleibt als
historischer Beleg für Katalogvergleich, Wortlautvarianten und Schlüsselkorrekturen erhalten.
Die 193 Einträge unter `matches` sind nicht mit dem späteren Endvergleich von 195 identischen
Fragen gleichzusetzen; der Originalnachweis bleibt unverändert.

Der Datenlauf erfasst 612 Quellfragen sowie 16 eigene Rechtsbeispiele und sieben Pools.
Der MG-Test prüft das reale Profil 90/119, nicht eine im Test selbst erfundene Bestehensformel.
Die eigenen Essen-Grenzen werden mit der tatsächlichen Teilbewertung geprüft.
Markupparsing berücksichtigt Kommentare, Rohtext, echte Attributnamen und verschiedene
Quotes. Fehlendes Startseiten-JSON-LD und Hashes in Kommentaren, `style-src` oder
Report-Only-Headern gelten nicht als Scriptfreigabe.

Zuletzt für V40 geprüft: 49 Projekttests einschließlich acht neuer Filtertests und zwei
HTML-Erhaltungstests erfolgreich. Die Deployment-Vorprüfung führt davon 47 aus; die beiden
HTML-Integrationstests bleiben wegen ihres eigenen Vorbereitungsaufrufs separat.

Zusätzlich 63 DOM-Prüfungen erfolgreich: die bisherigen 44 UI-Vergleiche/Seiteninitialisierungen
sowie 19 neue Abläufe für direkte Merkliste, gespeicherte Antworten, Suchtreffer, Listenwechsel,
Raster-Tastatur, leere Zustände, Themenfilter und Auf-/Zuklappen. Die zusätzlichen DOM-
Prüfumgebungen sind keine Projektabhängigkeiten. Ein vollständiges öffentliches Archiv wurde
lokal akzeptiert, ein fehlendes Filtermodul und unbekannte Scripts werden abgewiesen.
Frühere PageSpeed-Werte und Browser-Sichtungen sind keine neue Messung des aktuellen Stands.

Grenzen: kein vollständiger HTML-/CSS-/Apache-Parser, keine externen Linkabrufe, keine
Prüfung von CSS-Escapes, CSS-Imports oder `srcset`. Die DOM-Simulation verwendet Ersatz für
native Dialoge, ResizeObserver, Medienabfragen, Layoutmaße und Timer. Offen bleibt eine
echte Sicht-/Tastaturprüfung in Light/Dark bei 320/768 px und Desktop, einschließlich
nativer Dialoge. Kein vollständiges WCAG-/Screenreader-Gutachten, keine neue Lighthouse-
Messung, kein durch diese lokalen Prüfungen belegtes SSH-/rsync-Deployment.

## Codekonventionen und bekannte Ausnahmen

Eine Funktion hat eine fachliche Aufgabe. Ziel: höchstens 20 Zeilen einschließlich JSDoc,
Kommentaren und Leerzeilen; keine Verdichtung zur Einhaltung einer Zahl. Mehrzeiliges
JSDoc trennt Beschreibung, Parameter und Rückgabe. Ergänzende Erklärungen verwenden `//`:
kurze rechte Kommentare innerhalb ihrer Blöcke ausrichten; längere Erklärungen und
Kommentare zu Bedingungen/Schleifen darüber. Deklarationen bleiben vor den jeweils
abhängigen Schritten; DOM-Zugriffe dürfen nicht vor ihre erforderliche Erzeugung wandern.

Für neue/betroffene Funktionsdateien gilt das Projektziel 400 Zeilen. Im unveränderten
Lern-Altbestand hat `question-view.js` noch 414 Zeilen; bei einer künftigen Bearbeitung
kontrolliert aufteilen. Datenbestände `data.js`/`essen.js` sind gesondert zu behandeln.
Äußere Script-Hüllen dienen der Isolation, ihre Fachfunktionen werden einzeln betrachtet.
CSS behält den vorgegebenen Autorenblock und Abschnittsaufbau; keine Inline-Kommentare.
CRLF für Projekttexte, LF für das Linux-Serverskript gemäß `.gitattributes`.

Aktuell dokumentierte kurze Funktionsausnahmen:

| Bereich / Datei | Funktion beziehungsweise Methode (Zeilen inklusive Dokumentation) |
| --- | --- |
| Learning / `controller.js` | `configureExamControls` (21) |
| Learning / `core.js` | `validAnswers` (22), `evaluateSections` (21) |
| Learning / `keyboard.js` | `handleTv` (25), `moveInGrid` (21) |
| Learning / `learning-view.js` | `updateNavigationButton` (22), `goTo` (23) |
| Learning / `filter-view.js` | `matchesStatus` (25) |
| Learning / `progress.js` | `import` (24) |
| Learning / `question-view.js` | `render` (21), `createImage` (21), `createInput` (22), `update` (21) |
| Learning / `results.js` | `title` (22) |
| Quality / `check-release.mjs` | `checkPaypal` (22), `checkApproval` (21) |
| Quality / `check-seo.mjs` | `scriptPolicies` (21), `pageMetadata` (23), `checkMetadata` (21) |
| Quality / `core.test.cjs` | `loadEssen` (21), `answerCounts` (21) |
| Quality / `filters.test.cjs` | `environment` (25) |
| Quality / `data-rules.mjs` | `checkIdentity` (21) |
| Quality / `learning-fixtures.cjs` | `browserScope` (22) |
| Quality / `quality-fixtures.mjs` | `fixture` (23) |
| Quality / `validate-data.mjs` | `report` (23) |
| Quality / `session.test.cjs` | Katalogschlüssel-Test (22), Prüfungsprofil-Test (21) |
| UI / `common.js` | `confirmationOptions` (22) |
| UI / `controls.js` | `buildSearch` (23), `initializeSearch` (22) |
| UI / `select-keyboard.js` | `constructor` (22), `findMatch` (21) |
| UI / `select.js` | `choose` (22) |
| UI / `shared.js` | `DetailsMotion.toggle` (22) |

## Datenladung, SEO und Veröffentlichung

Eine bedarfsgerechte Fragenladung ist geplant, aber nicht umgesetzt: `data.js` lädt weiterhin
den Gesamtbestand. Nach Quellkatalogen statt Städten trennen, weil mehrere Ortsprofile
dieselben Quellen nutzen. Essen benötigt Rhein-Erft-203 plus eigene Beispiele; Köln,
Rhein-Erft-97 und Kammern jeweils ihren Quellkatalog. Basispool/Gesamtpool müssen über ihre
bestehenden Pool-IDs aufgelöst werden. Keine vollständigen Frageobjekte für gemeinsame
Pools duplizieren; abweichende Quellenfassungen getrennt halten. Beim Import alle benötigten
Kataloge vor der Validierung bereitstellen. `connect-src 'none'` sperrt derzeit `fetch`;
JSON-Nachladen wäre eine gesonderte Änderung der Lade- und CSP-Architektur.

Metadaten stehen im Root-HTML. Bei neuen Seiten oder Domain-/Pfadänderungen auch Canonical,
OpenGraph, JSON-LD, Sitemap und robots.txt abgleichen. Prüfungsvarianten bleiben `noindex`.
Die Domain-robots.txt muss an der Domainwurzel liegen; eine vorhandene Datei wird vom
Serverskript nicht ungefragt ersetzt. FAQ-Inhalte stehen statisch in der Startseite;
Rich Results, Indexierung und Ranking werden nicht zugesichert.

Versionierte JS-/CSS-URLs werden laut vorhandener Apache-Konfiguration 30 Tage, unversionierte
einen Tag, Bilder ein Jahr gecacht; HTML bleibt `no-cache`. Geänderte URLs entsprechend
versionieren. Bildversionen liegen inzwischen in `QuestionView.createImage`, nicht in
`app.js`. Aufgabenbilder bleiben lokal, mit echten Abmessungen, responsiver Begrenzung
und ohne erfundene Ergänzungen ursprünglich abgeschnittener Zeichnungen. `.htaccess`-
Wirksamkeit, Kompression, Cache-Header und aktuelle PageSpeed-Werte am Live-Server prüfen.

Das Deployment prüft und archiviert öffentliche Originaldateien. Kein `dist`, kein Generator,
keine Minifizierung/HTML-Umformatierung. Nur der vorhandene JSON-LD-Hash in `.htaccess`
darf bei normaler Vorbereitung angepasst werden. `--rights-confirmed` dokumentiert eine
tatsächliche Betreiberfreigabe, erteilt keine Rechte. Vor dem nächsten Deployment muss
das V40-Serverskript mit der zusätzlichen Pflichtdatei `scripts/learning/filter-view.js`
installiert sein. Die V38-UI-Dateifreigaben bleiben darin erhalten.
Installation und regulärer Ablauf bleiben ausschließlich in der Deployment-Anleitung.
