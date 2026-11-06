@echo off
setlocal EnableExtensions DisableDelayedExpansion
REM deployment/deploy-lhundg-local.cmd
REM AUTHOR: Benjamin Bennewitz [B2]
REM Prueft und packt die statische Website; kein Angular/npm-Build erforderlich.
REM Domain und /nrw kommen aus scripts/site-config.js; optional per Umgebung ueberschreibbar.
REM SSH-Key kann pro Rechner ueber LHUNDG_SSH_KEY konfiguriert werden.

set "PROJECT_DIR=%~dp0.."
set "RELEASE_ID=%RANDOM%-%RANDOM%"
set "ARCHIVE=%TEMP%\lhundg-%RELEASE_ID%.tar.gz"
if not defined LHUNDG_SSH_KEY set "LHUNDG_SSH_KEY=%USERPROFILE%\.ssh\id_ed25519"
set "SERVER_USER=ben"
set "SERVER_HOST=159.195.54.12"
set "SERVER_ARCHIVE=/tmp/lhundg-%RELEASE_ID%.tar.gz"
set "SERVER_DEPLOY=/usr/local/bin/deploy-lhundg"

cd /d "%PROJECT_DIR%" || exit /b 1
if not exist "%LHUNDG_SSH_KEY%" (
  echo [LHUNDG][FEHLER] SSH-Key fehlt. LHUNDG_SSH_KEY pruefen.
  exit /b 1
)
for %%T in (git node tar ssh scp) do (
  where %%T >nul 2>&1
  if errorlevel 1 (
    echo [LHUNDG][FEHLER] Benoetigtes Werkzeug fehlt: %%T
    exit /b 1
  )
)
echo [LHUNDG] Git aktualisieren...
git pull --ff-only || exit /b 1
echo [LHUNDG] Aktuelle Projektdateien fuer das Deployment pruefen...
REM Nach geklaerter Freigabe mit --rights-confirmed starten; sonst stoppt die vorhandene Release-Pruefung.
set "RELEASE_RIGHTS="
if /I "%~1"=="--rights-confirmed" set "RELEASE_RIGHTS=--rights-confirmed"
if not "%~1"=="" if not defined RELEASE_RIGHTS exit /b 1
node scripts\prepare-deployment.mjs %RELEASE_RIGHTS% || exit /b 1
if not exist "%PROJECT_DIR%\index.html" exit /b 1
echo [LHUNDG] Archiv erstellen...
tar -czf "%ARCHIVE%" -C "%PROJECT_DIR%" index.html quellen.html gut-zu-wissen.html hundewissen.html impressum.html datenschutz.html favicon.svg robots.txt sitemap.xml .htaccess assets styles scripts/site-config.js scripts/learning scripts/ui || goto :failed
echo [LHUNDG] Archiv hochladen...
scp -i "%LHUNDG_SSH_KEY%" "%ARCHIVE%" "%SERVER_USER%@%SERVER_HOST%:%SERVER_ARCHIVE%" || goto :failed
echo [LHUNDG] Server-Deployment starten...
ssh -t -i "%LHUNDG_SSH_KEY%" "%SERVER_USER%@%SERVER_HOST%" "sudo %SERVER_DEPLOY% %SERVER_ARCHIVE%" || goto :failed
if exist "%ARCHIVE%" del /f /q "%ARCHIVE%"
echo [LHUNDG] Deployment abgeschlossen.
exit /b 0

:failed
if exist "%ARCHIVE%" del /f /q "%ARCHIVE%"
echo [LHUNDG][FEHLER] Deployment abgebrochen.
exit /b 1
