/* scripts/quality/check-paths.mjs */

/**
 * @file Prüfung lokaler Dateiverweise.
 * @description Prüft Root-HTML, CSS-Dateiverweise, Paketgrenzen und HTML-Sprungziele ohne Dateien zu ändern.
 * @author Benjamin Bennewitz [B²]
 */
import { readFileSync, existsSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { resolve, relative, extname, sep, isAbsolute } from 'node:path';
import assert from 'node:assert/strict';
import { projectRoot, readSiteConfig } from '../config.mjs';
import { elements } from './markup.mjs';

const root = resolve(process.argv[2] || projectRoot);                        // Optionales Prüfverzeichnis, keine Ausgabeablage.
const config = readSiteConfig();                                             // Origin und Landespfad entsprechen der Veröffentlichung.
const origin = config.origin || 'https://local.invalid';                     // Konfigurierte Projekt-Origin oder lokale Ersatz-Origin zur Auflösung relativer Verweise.
const htmlFiles = readdirSync(root).filter(name => name.endsWith('.html'));  // Root-Seiten, deren IDs und lokale Dateiverweise geprüft werden.
let checked = 0;                                                             // Zählt geprüfte lokale Vorkommen, auch mehrfach verwendete Assets.

/**
 * Erkennt, ob ein aufgelöster Dateipfad innerhalb der Projektwurzel liegt.
 *
 * @param {string} target Absoluter Dateipfad.
 * @returns {boolean} True, wenn der Pfad innerhalb des Prüfprojekts liegt.
 */
function insideRoot(target) {
  const path = relative(realpathSync(root), target);  // Relativer Abstand zur tatsächlichen Projektwurzel.

  return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

/**
 * Überträgt eine URL innerhalb des Landesbereichs auf ihren lokalen Paketpfad.
 *
 * @param {URL} url Adresse innerhalb der Projekt-Origin.
 * @param {string} value Ursprünglicher Verweis für die Fehlerdiagnose.
 * @returns {string} Absoluter Paketpfad vor der Prüfung des Dateiziels.
 */
function packagePath(url, value) {
  const pathname = decodeURIComponent(url.pathname);  // Dekodierter URL-Pfad einschließlich Landesbereich.
  const base = config.basePath;                       // Gemeinsames Veröffentlichungsverzeichnis, beispielsweise /nrw.

  assert(!base || pathname === base || pathname.startsWith(`${base}/`), `Verweis verlässt den Landesbereich: ${value}`);

  return resolve(root, `.${pathname.slice(base.length) || '/'}`);
}

/**
 * Prüft das Dateiziel eines Paketverweises einschließlich Verzeichnis-Startseiten.
 *
 * @param {URL} url Lokale Projektadresse.
 * @param {string} value Ursprünglicher Verweis für die Fehlerdiagnose.
 * @returns {string} Vorhandene Zieldatei innerhalb der tatsächlichen Projektwurzel.
 */
function targetPath(url, value) {
  const path = packagePath(url, value);  // Lokaler Paketpfad nach Prüfung des Landesbereichs.

  assert(insideRoot(path), `Pfad verlässt das Paket: ${value}`);

  const target = existsSync(path) && statSync(path).isDirectory() ? resolve(path, 'index.html') : path;  // Verzeichnisse verweisen auf ihre Startseite.
  assert(existsSync(target) && statSync(target).isFile(), `Fehlender Dateiverweis: ${value}`);
  assert(insideRoot(realpathSync(target)), `Verweisziel verlässt das Paket: ${value}`);

  return target;
}

/**
 * Löst ausschließlich prüfbare lokale Verweise gegen ihre Quelldatei auf.
 *
 * @param {string} value Relativer Verweis oder absolute Adresse.
 * @param {string} source Absoluter Pfad der Datei mit diesem Verweis.
 * @returns {URL|null} Lokale Adresse oder null für leere beziehungsweise externe Verweise.
 */
function localUrl(value, source) {
  // Leere Attribute, E-Mail, Daten-URLs und fremde Protokolle sind keine Paketdateien.
  if (!value || /^(?!https?:)[a-z][a-z\d+.-]*:/i.test(value)) return null;

  const base = `${origin}${config.basePath}/${relative(root, source).replaceAll('\\', '/')}`;  // Absolute Quelladresse für relative Verweise.
  const url = new URL(value, base);                                                            // Behält bei der Auflösung den tatsächlichen Quellordner bei.

  // Externe Websites werden hier nicht per Netzwerk abgefragt.
  return url.origin === origin ? url : null;
}

/**
 * Prüft das optionale HTML-Sprungziel eines bereits vorhandenen Dateiverweises.
 *
 * @param {URL} url Aufgelöste lokale Adresse einschließlich Fragment.
 * @param {string} target Vorhandene Zieldatei.
 * @param {string} value Ursprünglicher Verweis für die Fehlerdiagnose.
 * @returns {void} Kein Rückgabewert.
 */
function checkAnchor(url, target, value) {
  // Nur HTML-Dateien mit einem Fragment benötigen einen Abgleich ihrer Element-IDs.
  if (!url.hash || extname(target).toLowerCase() !== '.html') return;

  const id = decodeURIComponent(url.hash.slice(1));     // Gesuchte Element-ID ohne führendes Hash-Zeichen.
  const tags = elements(readFileSync(target, 'utf8'));  // Aktive Elemente des tatsächlichen Zieldokuments.

  assert(
    tags.some(tag => tag.attributes.id === id),
    `Sprungziel fehlt: ${value}`
  );
}

/**
 * Prüft einen lokalen Dateiverweis einschließlich eines optionalen HTML-Sprungziels.
 *
 * @param {string} value Verweiswert, auch als absolute URL auf die Projekt-Origin.
 * @param {string} source Absoluter Pfad der Datei mit diesem Verweis.
 * @returns {void} Kein Rückgabewert; gültige lokale Verweise werden mitgezählt.
 */
function checkReference(value, source) {
  const url = localUrl(value, source);  // Prüffähige lokale Adresse oder null für auszuschließende Verweise.

  // Externe und nicht dateibezogene Verweise gehören nicht zur Paketprüfung.
  if (!url) return;

  const target = targetPath(url, value);  // Vorhandene lokale Zieldatei nach Prüfung aller Paketgrenzen.

  checkAnchor(url, target, value);  // Prüft bei Bedarf die Element-ID im Zieldokument.
  checked++;                        // Zählt dieses erfolgreich geprüfte lokale Vorkommen.
}

/**
 * Erkennt mehrfach vergebene echte Element-IDs innerhalb einer HTML-Seite.
 *
 * @param {object[]} tags Aktive Elemente der Seite.
 * @param {string} name Dateiname für die Fehlerdiagnose.
 * @returns {void} Kein Rückgabewert.
 */
function checkIds(tags, name) {
  const ids = tags.filter(tag => 'id' in tag.attributes).map(tag => tag.attributes.id);  // data-id gehört nicht zu dieser ID-Menge.

  assert.equal(new Set(ids).size, ids.length, `Doppelte HTML-ID: ${name}`);
}

/**
 * Prüft echte Element-IDs und lokale Dateiverweise einer Root-Seite.
 *
 * @param {string} name Dateiname einer HTML-Seite im Projekt-Root.
 * @returns {void} Kein Rückgabewert.
 */
function checkPage(name) {
  const file = resolve(root, name);                   // Tatsächliche Quelldatei für das Einlesen und die Verweisauflösung.
  const tags = elements(readFileSync(file, 'utf8'));  // Aktive Elemente ohne Kommentare oder zusätzliche Rohtext-Tags.

  checkIds(tags, name);  // Prüft die Eindeutigkeit innerhalb dieses Dokuments.

  // Jeder Verweis wird unabhängig von der verwendeten Attribut-Quote geprüft.
  for (const tag of tags) {
    checkReference(tag.attributes.href, file);  // Links, Stylesheets und andere href-Ziele.
    checkReference(tag.attributes.src, file);   // Eingebundene Scripts, Bilder und andere src-Ziele.
  }
}

/**
 * Prüft die URL-Verweise einer CSS-Datei ohne auskommentierte Angaben.
 *
 * @param {string} name Dateiname innerhalb des bestehenden Styles-Ordners.
 * @returns {void} Kein Rückgabewert.
 */
function checkStyleFile(name) {
  const file = resolve(root, 'styles', name);                               // Tatsächliche Quelldatei für relative CSS-Verweise.
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');  // Blockkommentare erzeugen keine Asset-Verweise.
  const urls = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/gi;          // Unterstützt auch angeführte Dateinamen mit Leerzeichen.

  // Anführungszeichen gehören zur CSS-Syntax, nicht zum lokalen Dateinamen.
  for (const match of css.matchAll(urls)) checkReference(match[1] ?? match[2] ?? match[3], file);
}

/**
 * Prüft die CSS-Dateien des flach aufgebauten Projekt-Styles-Ordners.
 *
 * @returns {void} Kein Rückgabewert.
 */
function checkStyles() {
  const names = readdirSync(resolve(root, 'styles')).filter(name => name.endsWith('.css'));  // Ausschließlich vorhandene CSS-Dateien.

  // Jede CSS-Datei verwendet ihren eigenen Quellpfad zur Auflösung ihrer URLs.
  for (const name of names) checkStyleFile(name);
}

// Die Prüfung liest vorhandene Seiten und Assets; sie erzeugt oder formatiert nichts.
for (const name of htmlFiles) checkPage(name);

checkStyles();  // Prüft ergänzend sämtliche CSS-Dateiverweise.
console.log(`${htmlFiles.length} HTML-Seiten und ${checked} lokale Verweise geprüft.`);
