#!/usr/bin/env bash
# deployment/deploy-lhundg-server.sh
# AUTHOR: Benjamin Bennewitz [B²]
# Installationsziel: /usr/local/bin/deploy-lhundg
set -euo pipefail

# Nach Festlegung der Domain und Anlage des KeyHelp-Webspaces ausfuellen.
DOMAIN=""
WEB_USER=""
WEB_GROUP=""
ARCHIVE="${1:-}"
CHECK_ONLY="${2:-}"

fail() { echo "[LHUNDG][FEHLER] $*" >&2; exit 1; }
[[ -n "$ARCHIVE" && -f "$ARCHIVE" && ! -L "$ARCHIVE" ]] || fail "Archiv fehlt oder ist ein Symlink."
[[ -z "$CHECK_ONLY" || "$CHECK_ONLY" == "--check-archive" || "$CHECK_ONLY" == "--dry-run" ]] || fail "Unbekannte Option."
command -v python3 >/dev/null || fail "python3 fehlt."
TMP_DIR="$(mktemp -d /tmp/lhundg.XXXXXX)"
cleanup() { rm -rf -- "$TMP_DIR"; }
trap cleanup EXIT

# Nur reguläre öffentliche Dateien zulassen; keine Links, Traversal-Pfade oder Entwicklungswerkzeuge.
python3 - "$ARCHIVE" "$TMP_DIR" <<'PY'
import re
import shutil
import sys
import tarfile
from pathlib import Path, PurePosixPath

archive, destination = sys.argv[1:]
required = {
    'index.html', 'quellen.html', 'gut-zu-wissen.html', 'hundewissen.html',
    'impressum.html', 'datenschutz.html', '.htaccess', 'robots.txt', 'sitemap.xml',
    'favicon.svg', 'styles/tokens.css', 'styles/interface.css',
    'scripts/site-config.js', 'scripts/learning/app.js', 'scripts/learning/core.js',
    'scripts/learning/data.js', 'scripts/learning/sources.js',
    'scripts/ui/theme.js', 'scripts/ui/common.js', 'scripts/ui/controls.js',
}
seen = set()
with tarfile.open(archive, 'r:gz') as bundle:
    members = bundle.getmembers()
    if sum(member.size for member in members) > 100 * 1024 * 1024:
        raise SystemExit('Archiv ist unerwartet gross.')
    for member in members:
        path = PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or '\\' in member.name:
            raise SystemExit('Unsicherer Archivpfad.')
        name = path.as_posix()
        if name == '.' and member.isdir():
            continue
        if not member.isdir() and not member.isfile():
            raise SystemExit('Links und Sonderdateien sind nicht erlaubt.')
        if member.isdir():
            if name not in {'assets', 'assets/questions', 'assets/sources', 'assets/sources/koeln', 'assets/sources/rhein97', 'styles', 'scripts', 'scripts/learning', 'scripts/ui'}:
                raise SystemExit('Unerwarteter Ordner: ' + name)
            continue
        if name not in required and not re.fullmatch(r'assets/(?:questions|sources/(?:koeln|rhein97))/[a-zA-Z0-9-]+\.webp', name):
            raise SystemExit('Unerwartete Datei: ' + name)
        if name in seen:
            raise SystemExit('Doppelte Datei: ' + name)
        seen.add(name)
    if not required.issubset(seen):
        raise SystemExit('Pflichtdateien fehlen: ' + ', '.join(sorted(required - seen)))
    for member in members:
        if member.isfile():
            target = Path(destination, PurePosixPath(member.name))
            target.parent.mkdir(parents=True, exist_ok=True)
            with bundle.extractfile(member) as source, target.open('wb') as output:
                shutil.copyfileobj(source, output)
print('[LHUNDG] Archivstruktur erfolgreich geprueft.')
PY

if [[ "$CHECK_ONLY" == "--check-archive" ]]; then exit 0; fi
[[ "$(id -u)" -eq 0 ]] || fail "Mit sudo/root ausfuehren."
[[ "$DOMAIN" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$ ]] || fail "Domain ist noch offen oder ungueltig."
[[ "$WEB_USER" =~ ^[a-z_][a-z0-9_-]*$ && "$WEB_GROUP" =~ ^[a-z_][a-z0-9_-]*$ ]] || fail "KeyHelp-Benutzer und Gruppe eintragen."
WEB_DIR="/home/users/$WEB_USER/www/$DOMAIN"
[[ -d "$WEB_DIR" && ! -L "$WEB_DIR" ]] || fail "Webroot fehlt oder ist ein Symlink: $WEB_DIR"
id "$WEB_USER" >/dev/null 2>&1 || fail "Webspace-Benutzer fehlt."
getent group "$WEB_GROUP" >/dev/null || fail "Webspace-Gruppe fehlt."
command -v rsync >/dev/null || fail "rsync fehlt."
# Ein versehentliches Paket für eine andere Domain darf den Webspace nicht ersetzen.
python3 - "$TMP_DIR/index.html" "$DOMAIN" <<'PY'
import re
import sys
from pathlib import Path
html = Path(sys.argv[1]).read_text(encoding='utf-8')
if not re.search(r'<link rel="canonical" href="https://' + re.escape(sys.argv[2]) + r'/">', html):
    raise SystemExit('Canonical und konfigurierter Ziel-Webspace stimmen nicht ueberein.')
PY
if [[ "$CHECK_ONLY" == "--dry-run" ]]; then
  rsync -an --delete --exclude='.well-known/' "$TMP_DIR/" "$WEB_DIR/"
  exit 0
fi

echo "[LHUNDG] Website nach $WEB_DIR spiegeln..."
rsync -a --delete --exclude='.well-known/' "$TMP_DIR/" "$WEB_DIR/"
chown -R "$WEB_USER:$WEB_GROUP" "$WEB_DIR"
find "$WEB_DIR" -type d -exec chmod 755 {} \;
find "$WEB_DIR" -type f -exec chmod 644 {} \;
rm -f -- "$ARCHIVE"
echo "[LHUNDG] Deployment erfolgreich."
