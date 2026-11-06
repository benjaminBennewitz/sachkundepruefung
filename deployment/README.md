# Deployment – vorbereitet, Domain noch offen

Die beigefügte DCR-Vorlage wurde für die statische Lernhilfe angepasst. Ablauf: `git pull --ff-only`, Prüfung der aktuellen Dateien, direkt daraus erzeugtes TAR-Archiv, SCP, SSH und serverseitiges Spiegeln per rsync. Kein Angular-Build, kein `npm ci`, keine Fonts-Kopie.

## Einmalig nach der Domainentscheidung

1. Domain und KeyHelp-Webspace anlegen.
2. `DOMAIN`, `WEB_USER` und `WEB_GROUP` in `deploy-lhundg-server.sh` eintragen. Der Webroot wird daraus als `/home/users/WEB_USER/www/DOMAIN` abgeleitet.
3. Die vorhandenen Werte für SSH-Benutzer und Host im lokalen CMD-Skript prüfen. Sie stammen aus der gelieferten Vorlage.
4. Domain und gegebenenfalls rechnerabhängigen SSH-Key lokal setzen:

```cmd
setx LHUNDG_ORIGIN "https://DEINE-DOMAIN"
setx LHUNDG_SSH_KEY "%USERPROFILE%\.ssh\id_ed25519"
```

Danach ein neues CMD-Fenster öffnen. Alternativ mit `set` nur für die aktuelle Sitzung setzen. Platzhalter durch die echte Domain ersetzen. Das lokale Skript beendet sich vor Git, Build oder Upload, solange die Domain fehlt.

Das fertig konfigurierte Serverskript einmalig installieren:

```cmd
scp -i "%LHUNDG_SSH_KEY%" deployment\deploy-lhundg-server.sh ben@159.195.54.12:/tmp/deploy-lhundg-server.sh
ssh -t -i "%LHUNDG_SSH_KEY%" ben@159.195.54.12 "sudo install -o root -g root -m 755 /tmp/deploy-lhundg-server.sh /usr/local/bin/deploy-lhundg"
```

SSH-Key und Serveradresse gegebenenfalls anpassen. Das Serverskript benötigt Bash, Python 3 und rsync. Die Datei hat LF-Zeilenenden und darf bei der Übertragung nicht in CRLF umgewandelt werden.

## Reguläres Deployment

Aus dem Projektordner in CMD, nach tatsächlicher Freigabe der übernommenen Inhalte:

```cmd
deployment\deploy-lhundg-local.cmd --rights-confirmed
```

Der vorhandene Release-Schalter bestätigt keine Rechte automatisch. Er ist nur nach deren Klärung zu verwenden. Ein leerer PayPal-Link bleibt zulässig.

Die aktuellen sechs HTML-Seiten, Styles, Browser-Skripte, Aufgabenbilder, Favicon, robots.txt, Sitemap und `.htaccess` werden mit einer ausdrücklichen Dateiliste direkt aus dem Projektordner archiviert. Ein `dist`-Ordner und eine zusätzliche Projektkopie werden nicht angelegt. Tests, Fixtures, Quellwerkzeuge, Dokumentation, Git-Daten und Deployment-Dateien bleiben lokal.

Das Serverskript prüft das gesamte Archiv vor dem Entpacken auf unerlaubte Dateien, fehlende Pflichtdateien, Links, Pfade außerhalb des Pakets und Duplikate. Zusätzlich muss die Canonical-Adresse zur konfigurierten Domain passen.

Wie in der Vorlage wird der Ziel-Webspace mit `rsync --delete` gespiegelt. Dort anderweitig abgelegte Dateien werden entfernt; `.well-known/` bleibt erhalten. Ausschließlich den eigens dafür angelegten Webspace verwenden. Dateirechte und Besitzer werden anschließend korrigiert.

## Nur prüfen

Archivstruktur ohne Root-Rechte und ohne Webspace-Änderung prüfen:

```bash
bash deployment/deploy-lhundg-server.sh /pfad/zum/lhundg.tar.gz --check-archive
```

Nach vollständiger Serverkonfiguration Änderungen nur anzeigen:

```bash
sudo /usr/local/bin/deploy-lhundg /tmp/lhundg.tar.gz --dry-run
```

Diese Varianten veröffentlichen nichts. Bei Fehlern vor rsync bleibt der Webspace unberührt. Ein fehlgeschlagenes Archiv wird serverseitig zur Fehleranalyse behalten; temporär entpackte Dateien werden immer entfernt.

## Stand der Prüfung

Direkte Archivierung, Daten, Pfade, Shell-Syntax sowie gültige und manipulierte Archive wurden lokal geprüft. Windows-CMD und ein echtes SSH-/rsync-Deployment wurden in dieser Linux-Umgebung nicht ausgeführt. Domain und Webspace-Daten sind absichtlich nicht vorweggenommen.
