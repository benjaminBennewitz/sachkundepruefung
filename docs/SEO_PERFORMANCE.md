# SEO und kleine Performance-Verbesserungen

Stand: 10. November 2026 · Benjamin Bennewitz [B²]

## Suchintentionen und Inhalte

- Startseite: kostenloser Online-Trainer zum Sachkundenachweis für Hunde in NRW. Titel, Beschreibung, OpenGraph und WebApplication-Daten stimmen inhaltlich überein.
- Hundewissen: Listenhunde, Haltungsauflagen, Sachkunde und Verhaltensprüfung. Vorhandene Behördenquellen und rechtliche Einordnungen bleiben erhalten.
- Gut zu wissen: Testreihen, Bedienung und Reisen mit Hund. Quellen: Herkunft der Fragen und Originalunterlagen.
- Sechs kurze FAQ-Antworten stehen direkt im Startseiten-HTML, mit Links zu passenden Abschnitten. Kein zusätzliches JavaScript und keine zusätzlichen Seiten mit wiederholtem Inhalt. Kein FAQ-Rich-Result oder bestimmtes Google-Ranking wird versprochen.
- Canonicals, sechs Sitemap-Adressen und robots.txt waren bereits korrekt. Der neue Check prüft sie zusammen mit eindeutigen Titeln und Beschreibungen, genau einer H1 pro Seite, passenden OpenGraph-Adressen und dem JSON-LD-CSP-Hash.
- Überschriften im Trainer: H1 der Seite, H2 des Katalogs, H3 der Frage. Der seitliche Testtitel ist ein Absatz und behält sein Aussehen.

## Performance und Abbildungen

- Die Headerhöhe kommt aus ResizeObserver.borderBoxSize. Die bisherige synchrone Startmessung entfällt; nur ältere Browser benötigen die Messung als Fallback. Unveränderte Höhen lösen keine erneute Style-Zuweisung aus.
- Die Fragenübersicht wird über ein DocumentFragment gesammelt eingefügt.
- Alle 16 WebP-Abbildungen wurden auf die benötigten Hundedarstellungen zugeschnitten. Doppelte Aufgabenstellungen, Antworten und Seitenzahlen entfallen; notwendige Zuordnungszahlen und Buchstaben bleiben erhalten. Bereits im Original angeschnittene Zeichnungen werden nicht erfunden oder ergänzt. Die Herkunft bleibt an jeder Frage sichtbar.
- Die Abbildungen benötigen zusammen 189.700 statt 367.552 Bytes: rund 48 % weniger. Der SVG-Vergleich an q006 war größer als das zugeschnittene WebP. Deshalb bleiben die bestehenden Dateiformate und Pfade erhalten.
- Explizite Bildmaße wurden an alle Zuschnitte angepasst. Bilder werden nicht über ihre natürliche Breite vergrößert und bleiben responsiv auf maximal 260 Pixel Höhe begrenzt.
- JS/CSS mit numerischem `?v=` erhalten 30 Tage Cache, unversionierte JS/CSS weiterhin einen Tag. Bilddateien inklusive PNG/ICO erhalten ein Jahr; HTML bleibt bei `no-cache`.

## Versionswechsel und Deployment

Geänderte CSS-, App- und Datendateien sowie Bildaufrufe verwenden Version 26. Bei späteren Änderungen an lange gecachten Dateien deren URL-Version ebenfalls erhöhen. Bei geänderten Bildern die Version in scripts/learning/app.js erhöhen, damit vorhandene Browser die neuen Dateien laden.

Nur die Dateien dieses Patches über den aktuellen Projektstand kopieren. Kein zusätzlicher Build, kein dist-Ordner, keine Minifizierung. Das Deployment prüft die vorhandenen HTML-Dateien und formatiert sie nicht um. Die optionalen Seitenvorlagen sind ebenfalls aktualisiert. Das Serverskript benötigt wegen dieser Änderungen keine Neuinstallation.

Vorbereitung wie bisher über das lokale Deploymentskript. Der neue Check läuft dabei automatisch; einzeln: `node scripts/quality/check-seo.mjs`. Die übertragenen Assets müssen auch auf dem Rechner liegen, auf dem das Deployment vorbereitet wird; der vorhandene Git-Ausschluss für assets wurde nicht verändert.

## Prüfung und nächste Messung

Datenvalidierung und sechs bestehende Kernprüfungen bestanden. Alle Fragen, Antworten, Lösungsschlüssel und Pools wurden zusätzlich vollständig mit dem gelieferten ZIP verglichen; nur Bildmaße wurden angepasst. Lokale Verweise, Metadaten und CSP geprüft. Browserprüfung: Frage mit Bild, Antwortauswertung, Light/Dark Mode und FAQ.

Ausgangswert des gelieferten PageSpeed-Berichts: Leistung 98, Barrierefreiheit 98, Best Practices 100, SEO 100, LCP 1,1 Sekunden, CLS 0. Das sind Labordaten. Ein neuer Score und reale Core Web Vitals sind erst nach Veröffentlichung messbar. Der lokale statische Preview-Server verarbeitet .htaccess nicht; die Cache-Header nach dem Deployment am Apache-Server prüfen.

Nach dem Deployment PageSpeed erneut ausführen. In der Search Console die überarbeiteten Seiten prüfen und bei Bedarf eine erneute Indexierung anstoßen; die bestehende Sitemap-Adresse bleibt gültig. Suchanfragen und Impressionen zeigen anschließend, welche Inhalte Nutzer tatsächlich finden. Indexierung und Platzierung werden von Google bestimmt.
