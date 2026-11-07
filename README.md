# NRW Sachkundeprüfung – Lernhilfe

Kostenlose statische Lernhilfe mit lokalen Lernständen, quellenbezogenen Katalogen und Testreihen. HTML, CSS und JavaScript ohne Framework, Paketinstallation, Tracking oder externe Schriften.

Entwicklung und Design: Benjamin Bennewitz **[B²]**.

## Ordnerstruktur

| Pfad | Aufgabe |
| --- | --- |
| `*.html` | Startseite und statisch lesbare Informationsseiten |
| `styles/tokens.css` | Zusammengefasste Farbwerte für Light, Dark und Systemmodus |
| `styles/interface.css` | Dokumentierte Oberfläche, Zustände und responsive Layouts |
| `scripts/learning/` | Trainer, Auswertung, Fragebestand und Quellen – vier zusammengehörige Dateien |
| `scripts/ui/` | Theme vor dem Zeichnen, gemeinsame UI und Custom Controls – drei Dateien |
| `scripts/pages/` | Seitengenerator, Inhaltsvorlagen und gemeinsamer Seitenrahmen; Datenschutz-Referenz daneben |
| `scripts/quality/` | Datenprüfung, Pfadprüfung, Release-Prüfung und Core-Tests; offizielle Lösungsschlüssel daneben |
| `scripts/site-config.js` | Domain, Betreiber, Hosting und optionaler PayPal-Link |
| `scripts/config.mjs` | Gemeinsame Konfigurations- und Pfadfunktionen für lokale Werkzeuge |
| `scripts/prepare-deployment.mjs` | Prüft vorhandene Dateien für das direkte Deployment; HTML bleibt unverändert |
| `scripts/migrate-structure.mjs` | Einmalige reversible Bereinigung bisheriger Dateipfade |
| `deployment/` | Windows-Deployment, Linux-Serverskript und Anleitung |
| `assets/` | Unveränderte Aufgabenabbildungen |
| `docs/` | Datenprüfung, Audit und Anleitung für den Strukturpatch |

Ein Skript-Unterordner enthält mindestens drei fachlich zusammengehörige Skriptdateien. Es werden keine leeren Modulhüllen oder Unterordner für einzelne Dateien angelegt.

## Strukturpatch einspielen

Den Patch im vorhandenen Projekt entpacken. Assets und Git-Verzeichnis behalten. Anschließend in CMD aus dem Projektordner:

```cmd
node scripts\migrate-structure.mjs
node scripts\migrate-structure.mjs --apply
```

Der erste Aufruf prüft nur. Der zweite verschiebt alte Dateien nach vollständiger Vorprüfung in eine Sicherung **neben** dem Projekt. Individuell veränderte Altdateien führen vor der ersten Verschiebung zum Abbruch. Details: `docs/MIGRATION.md`.

## Lokal starten und prüfen

Voraussetzung für die Werkzeuge: Node.js ab Version 20. Die Website selbst benötigt nur einen modernen Browser und einen statischen HTTP-Server. Es gibt keine npm-Abhängigkeiten.

Für die direkte Entwicklung den Projektordner über deinen lokalen Server öffnen, beispielsweise mit VS Code Live Server. Nicht per `file://` öffnen: Origin und Browserspeicher sollen dem späteren Betrieb entsprechen.

```cmd
node scripts\quality\check-paths.mjs
node scripts\quality\validate-data.mjs
node --test scripts\quality\core.test.cjs
node scripts\prepare-deployment.mjs --check-only
```

Der letzte Befehl prüft die aktuellen Dateien ohne Kopie oder Ausgabeordner. Für die lokale Vorschau direkt die `index.html` im Projektordner über Live Server öffnen.

## Domain und Produktion

Die Projektadresse ist **https://hunde-sachkundetrainer.de/nrw/**. In `scripts/site-config.js` werden Hauptdomain und Landesbereich getrennt gepflegt:

```js
origin: 'https://hunde-sachkundetrainer.de',
basePath: '/nrw',
```

Der Seitengenerator ist ein separat aufrufbares Pflegewerkzeug für Seitenvorlagen und SEO-Dateien. Er ist kein Teil des Deployments und schreibt HTML aus den Vorlagen neu. Nur ausdrücklich ausführen, wenn die Seiten aus diesen Vorlagen erzeugt werden sollen:

```cmd
node scripts\pages\prepare-pages.mjs
```

Optional überschreiben `LHUNDG_ORIGIN` und `LHUNDG_BASE_PATH` die gespeicherten Werte. Für die lokale Entwicklung bleibt die vorhandene `index.html` im Projektordner verwendbar, da interne Links und Assets relative Pfade nutzen.

Die eigentliche robots.txt muss an **https://hunde-sachkundetrainer.de/robots.txt** liegen und auf **https://hunde-sachkundetrainer.de/nrw/sitemap.xml** verweisen. Das Server-Skript legt sie bei Bedarf an. Eine bereits vorhandene Domain-robots.txt wird beibehalten; ihr Sitemap-Verweis ist dann beim Einrichten zu ergänzen.

Der bestehende Schalter `--rights-confirmed` ist ausschließlich nach tatsächlicher Klärung der Übernahme der Fragen und Abbildungen zu verwenden. Ein leerer PayPal-Link verhindert die kostenlose Veröffentlichung nicht.

Das vorbereitete Deployment ist in `deployment/README.md` beschrieben. Es wurde kein Server angesprochen und nichts veröffentlicht.

## Pflege und Konventionen

- Inhalte und Lösungen nur anhand ihrer Originalquelle ändern. Frage-IDs, Pool-IDs und Speicherschlüssel beim Umordnen beibehalten.
- Das Deployment verändert und formatiert keine HTML-Dateien. Es prüft und archiviert die vorhandenen Dateien. Der CSP-Hash in `.htaccess` wird bei verändertem JSON-LD passend aktualisiert.
- `scripts/pages/prepare-pages.mjs` ist ein optionales, manuell gestartetes Pflegewerkzeug: Es ersetzt HTML aus den Vorlagen und ist kein Formatierer für handgepflegte Seiten.
- Öffentliche Skripte bleiben klassische Browser-Skripte in ihrer bisherigen Ladereihenfolge. Die Dateiverlagerung führt kein Framework und keine neue Laufzeitabhängigkeit ein.
- CSS: Dateikopf mit `[B²]`, zweistelliges Inhaltsverzeichnis und dazu passende Abschnittskommentare; keine Inline-Kommentare. Kaskadenreihenfolge der UI-Regeln bleibt erhalten.
- JavaScript: knappe deutsche JSDoc-Beschreibungen wie im Portfolio, Abstand zwischen Funktionen und ausgeschriebene Anweisungen. Typangaben bleiben an fachlichen Schnittstellen; offensichtliche UI-Helfer erhalten keine langen Parameterlisten. Der Fragetyp ist in `scripts/learning/data.js` dokumentiert.
- Projektdateien verwenden CRLF. Das Linux-Serverskript verwendet bewusst LF; `.gitattributes` hält diese notwendige Ausnahme fest.
- Das Deployment packt ausschließlich die öffentlichen Originaldateien direkt in ein temporäres TAR-Archiv. Es gibt keinen Build- oder Vorschauordner. Archive gehören nicht ins Repository.

## Umstellung von v17 auf v18

Patch entpacken. Das bisherige Build-Skript und dessen erzeugte Kopie einmalig entfernen:

```cmd
del scripts\build.mjs
rmdir /s /q dist
```

Anschließend direkt im Projektordner entwickeln. Das Deployment prüft die aktuellen Dateien und archiviert sie ohne weitere Dateikopie.
