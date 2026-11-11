/* scripts/quality/quality-fixtures.mjs */

/**
 * @file Temporäre Projektkopien für die Werkzeugtests.
 * @description Kopiert nur Prüfeingaben; Repository, Archive und Deploymentverzeichnisse werden nicht vervielfältigt.
 * @author Benjamin Bennewitz [B²]
 */
import { cpSync, readdirSync, mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { projectRoot } from '../config.mjs';

/**
 * Erzeugt eine begrenzte Projektkopie und registriert ihre Bereinigung nach dem Test.
 *
 * @param {object} context Node-Testkontext.
 * @returns {string} Absolute Wurzel der nach dem Test automatisch entfernten Projektkopie.
 */
export function fixture(context) {
  const root = mkdtempSync(join(tmpdir(), 'lhundg-quality-'));  // OS-Temporärverzeichnis außerhalb des geprüften Projekts.
  // Benötigte öffentliche Root-Dateien; Archive und Repository bleiben außerhalb der Testkopie.
  const files = readdirSync(projectRoot).filter(name => /\.(html|xml|txt)$/.test(name) || name.startsWith('favicon.'));

  context.after(() => rmSync(root, { recursive: true, force: true }));

  // Öffentliche Root-Dateien und CSP bilden dieselben Eingaben wie im echten Vorbereitungsprozess.
  for (const name of [...files, '.htaccess', 'scripts', 'styles', 'assets']) {
    cpSync(resolve(projectRoot, name), resolve(root, name), { recursive: true });
  }

  mkdirSync(resolve(root, 'docs'));
  cpSync(resolve(projectRoot, 'docs/validation.json'), resolve(root, 'docs/validation.json'));

  return root;
}

/**
 * Verändert ausschließlich eine ausdrücklich benannte Datei der temporären Testkopie.
 *
 * @param {string} root Testwurzel.
 * @param {string} name Relativer Dateiname.
 * @param {Function} change Texttransformation.
 * @returns {void} Kein Rückgabewert.
 */
export function edit(root, name, change) {
  const path = resolve(root, name);  // Nur die explizite Testkopie wird verändert.

  writeFileSync(path, change(readFileSync(path, 'utf8')));
}

/**
 * Führt einen echten Prüfeinstieg mit festgelegter Domain in einer Testkopie aus.
 *
 * @param {string} root Testwurzel.
 * @param {string} script Prüfeinstieg unter scripts/.
 * @param {string[]} [options] Argumente.
 * @returns {object} Prozessresultat mit status, stdout, stderr und optionalem error.
 */
export function run(root, script, options = []) {
  // Feste Produktionsadresse für reproduzierbare CLI-Tests unabhängig von lokalen Überschreibungen.
  const env = { ...process.env, LHUNDG_ORIGIN: 'https://hunde-sachkundetrainer.de', LHUNDG_BASE_PATH: '/nrw' };

  return spawnSync(process.execPath, [resolve(root, 'scripts', script), ...options], {
    cwd: root,
    env,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 4 * 1024 * 1024
  });
}

/**
 * Sichert sämtliche Root-HTML-Dateien einer Testkopie als unveränderte Bytes.
 *
 * @param {string} root Testwurzel.
 * @returns {Map<string, Buffer>} Root-Dateinamen und zugehörige unveränderte Dateibytes.
 */
export function snapshot(root) {
  const names = readdirSync(root).filter(name => name.endsWith('.html'));  // Erzeugte und entfernte Seiten würden mit auffallen.

  return new Map(names.map(name => [name, readFileSync(resolve(root, name))]));
}
