# Designidentität: Mensch & Hund

Stand: 17. November 2026. Helles Naturweiß, Salbei und Blattgrün tragen das
Erscheinungsbild. Moosgrün gibt Schrift und Aktionen Halt; Apricot bleibt ein
kleiner warmer Akzent. Es gibt kein globales Linienmuster und keine
Hintergrundtexturen. Die kräftige Sans-Serif-Typografie bleibt erhalten.

## Gemeinsame Rollen

Die Startseite liegt auf `index.html`, der eigenständige Lernbereich auf
`lernen.html`. Alle Seiten verwenden die semantischen Rollen aus `tokens.css`.
Navigation, Footer, Katalogseitenleiste und portierte Select-Menüs besitzen keine
separate fest eingebaute Dunkelpalette mehr. Light/Dark, hoher Kontrast und
alternative Statusfarben verwenden dieselbe Vererbung.

| Datei | Verantwortung |
| --- | --- |
| `styles/tokens.css` | Farb-, Typografie-, Abstands- und Formrollen |
| `styles/character.css` | Navigation, Controls, Dialoge und Footer |
| `styles/editorial-identity.css` | Einstieg, gemeinsame Inhaltsstile, FAQ |
| `styles/magazine.css` | Redaktionelle Raster, Bildstrecken und Release-Inhalt |
| `styles/learning-identity.css` | Lernkomponenten und ihre Zustände |
| `styles/workspace.css` | Lernhöhe, Werkzeugdialoge und kleine Viewports |
| `styles/accessibility.css` | Textgröße, Kontrast und Statusfarben |
| `styles/learning-overview.css` | Kennzahlen, Katalogkarten und Bildabschnitt |

## Magazin statt Textbox

Alle sechs Informationsseiten haben einen Bild/Text-Auftakt und eigene Kapitel.
Zweispaltige Kapitel stehen neben breiten Vergleichen und Bildstrecken. Quellen
stehen auf großen Bildschirmen in drei, auf mittleren in zwei Spalten. Reiseziele
verwenden ebenfalls ein responsives Raster. Impressum und Datenschutz gliedern
ihre vorhandenen Texte in ruhigere zweispaltige Kapitel.

Die pauschale Begrenzung aller Absätze auf 78ch entfällt. Die konkrete
Spaltenbreite bestimmt die Lesebreite. Tabellen bleiben horizontal erreichbar;
unter 800 px werden Kapitel einspaltig. Im Grundlagen-Dialog bleibt der Text
linear; zusätzliche redaktionelle Fotos werden dort ausgeblendet.

Die bestehenden Sachinformationen, Bewertungsschlüssel und Quellen wurden nicht
geändert. Ergänzt wurden kurze redaktionelle Auftakte, Bildunterschriften und die
technische Information zum Speichern der gesehenen Release-Version.

## Originalfotos

Alle 15 hochgeladenen Fotos wurden wiederhergestellt. Neun ausgewählte Motive
werden als lokale WebP-Derivate eingesetzt. Die Dateien wurden verkleinert und
anhand ihrer EXIF-Orientierung ausgerichtet; es gibt keine generative Bearbeitung.
EXIF-Daten werden nicht in die ausgelieferten Derivate übernommen.

| WebP-Datei unter `assets/public/` | Original |
| --- | --- |
| `huendin-sonne.webp` | `20160502_125326.jpg` |
| `huendin-strand.webp` | `20171015_151404.jpg` |
| `huendin-miteinander.webp` | `20171015_150310.jpg` |
| `huendin-pfote.webp` | `20180330_215639.jpg` |
| `huendin-auge.webp` | `IMG-20200124-WA0003.jpg` |
| `huendin-nase.webp` | `IMG-20200124-WA0008.jpg` |
| `huendin-draussen.webp` | `FILE33536.JPG` |
| `huendin-ruhe.webp` | `IMG-20220814-WA0000.jpg` |
| `zwei-hunde.webp` | `FILE36046.JPG` |

Die beiden alten KI-Platzhalter sind nicht mehr verlinkt. Bestehende lokale
Kopien bleiben optional im Deployment zulässig. Das Bild der persönlichen
Entstehungsgeschichte bleibt erhalten.

## Prüfung und Übernahme

91 Tests sowie Daten-, lokale Verweis- und SEO-Prüfung bestehen mit der aktuellen
Projekt-ZIP. Die vorhandenen Informationsabsätze, Listen und Überschriften sowie
alle bisherigen IDs wurden mit dem Ausgangsstand abgeglichen. Die geprüften
normalen Text-/Flächenpaare erreichen mindestens 5,44:1.

Eine visuelle Browser- und Tastaturprüfung konnte in dieser Umgebung nicht
abgeschlossen werden: Der lokale Chromium-Start scheitert an gesperrten
System-Sockets; der separate Vorschaubrowser erreicht den lokalen Server nicht.
Die tatsächlichen Bildausschnitte und Umbrüche deshalb vor Veröffentlichung
prüfen, besonders bei 320 px, Textvergrößerung und im Lernbereich.

Das angepasste Serverskript muss vor einem späteren Deployment erneut installiert
werden. Es berücksichtigt auch die bereits verwendeten Überblicksmodule.

## Verfeinerung des Lernbereichs und der Bildgrößen

Alle Seiten verlinken dieselben sechs Hauptziele einschließlich Startseite.
Suche und Filter stehen direkt im Lernbereich; der doppelte Katalogtitel bleibt
nur für assistive Technologien erhalten. Der Grundlagenzugang liegt in der
Seitenleiste. Dialoge für Lernwerkzeuge besitzen oben einen Schließen-Button.

Die Grundlagenbilder behalten breite, gleichwertige Bild-/Textspalten. Die
Bildhöhe folgt auf Desktop dem zugehörigen Textblock einschließlich der
Bildunterschrift. Mobil erhält der Bildrahmen 220–320 px Höhe. Die schmalen
Bildspalten und zusätzlich aufgeteilten Textabsätze der vorherigen Fassung
entfallen; schmale Ansichten bleiben einspaltig. Der Seitenauftakt besitzt
wieder seine breite Bildspalte und einen kompakteren Textbereich. Der letzte Bildabschnitt
in „Gut zu wissen“ entfällt. Der breite Bildmoment in „Haltung & Recht“ zeigt
statt des Strandfotos die ruhende Hündin zu Hause.

Blau/Orange betrifft die semantischen Richtig-/Falsch-Rollen. Das A11y-Menü zeigt
dieselben Rollen sofort als Beispiel und erläutert den begrenzten Geltungsbereich.

### Bildhöhe und intrinsische Abmessungen

Bei redaktionellen Bildern setzt `magazine.css` ausdrücklich `height: auto`,
damit die im HTML hinterlegte intrinsische Höhe die CSS-Seitenverhältnisse
nicht übersteuert. Auf der Grundlagenseite liegen die Fotos in eigenen Rahmen; die Bilder sind
darin absolut positioniert. Deshalb bestimmen die Textblöcke die gemeinsame
Zeilenhöhe, nicht die intrinsischen Bildhöhen. `object-fit: cover` beschneidet den
Ausschnitt innerhalb des breiten Rahmens, ohne das Foto zu verzerren. Die
HTML-Abmessungen bleiben als Angaben zum Originalformat erhalten.

### Einheitliche Bild-Titelbereiche und Update-Zugang

Alle sechs Informationsseiten verwenden denselben Bild-Titelbereich mit
`height: clamp(300px, 22vw, 340px)`. Die bisherige Quellen-Darstellung hatte
bereits eine Bild-Mindesthöhe von 300 px; 200 px war daher keine feste
Desktophöhe. Titelgröße, Innenabstände und Bildrahmen sind nun gemeinsam
definiert. Die Sonderregeln des Grundlagen-Titelbereichs entfallen.

Mobil wächst der Textbereich nach Inhalt, während die Bildhöhe 160–200 px
beträgt. Bei vergrößerten A11y-Texten entfällt auch auf Desktop die feste Höhe,
damit Inhalte erreichbar bleiben. Die Bilder im Grundlagen-Haupttext folgen der jeweiligen Textblockhöhe und
bleiben unabhängig vom gemeinsamen Titelbereich.

„Was ist neu?“ öffnet im Footer das aktuelle Update erneut. Im Lernbereich
liegt derselbe Zugang bei den kompakten Informationslinks der Seitenleiste.
Die bereits gesehene Version verhindert ausschließlich das automatische Öffnen.

### Letzte Bild- und Bedienkorrekturen

Die drei Fotos im Grundlagen-Haupttext besitzen einen eigenen Rahmen. Das
zweispaltige Kapitel streckt die Bildspalte auf die Höhe der Textspalte; im
Bildbereich verteilen sich Foto und Bildunterschrift auf flexible und natürliche
Höhe. Die absolut positionierten Fotos vergrößern die Kapitel nicht selbst.
Der Sonnen-Ausschnitt im Titel und der Pfoten-Ausschnitt sitzen tiefer im Rahmen.
„Haltung & Recht“ zeigt im Kopf das Originalfoto mit beiden Hunden.

Die dauerhafte Aktionsleiste des Lernbereichs zeigt Sofort-Feedback,
Zwischenergebnis und Katalog-Auswertung neben der Fragennavigation. Der
Auswertungsdialog und sein Auslöser entfallen. Die vorhandenen Aktionen wurden
verschoben, ihre IDs, Ereignisbindungen und Bewertungsregeln bleiben erhalten.
Prüfungssimulationen behalten ihre bisherigen Sperren bis zur Auswertung.
