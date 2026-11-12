/* scripts/prepare-deployment.mjs */

/**
 * @file Prüfung vor dem direkten Deployment.
 * @description Prüft vorhandene Projektdateien; HTML bleibt unverändert, nur der CSP-Hash wird bei Bedarf aktualisiert.
 * @author Benjamin Bennewitz [B²]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { projectRoot, readSiteConfig } from './config.mjs';
import { elements } from './quality/markup.mjs';

const checkOnly = process.argv.includes('--check-only');  // Reine Prüfung verzichtet auf CSP-Schreiben und Release-Freigabe.
const config = readSiteConfig();                          // Bestehende zentrale Konfiguration einschließlich Umgebungsüberschreibungen.

// Ein Produktionspaket benötigt im Gegensatz zur reinen Vorprüfung eine verbindliche Domain.
if (!checkOnly && !config.origin) {
  throw new Error('Die Domain ist noch offen. Vor dem Deployment LHUNDG_ORIGIN oder scripts/site-config.js ergänzen.');
}

/**
 * Führt einen vorhandenen Prüfeinstieg im Projektordner aus und erhält dessen Konsolenausgabe.
 *
 * @param {string[]} args Argumente für denselben Node-Prozess wie beim Aufruf dieser Vorbereitung.
 * @returns {void} Kein Rückgabewert.
 * @throws {Error} Bei Startfehlern oder einem fehlgeschlagenen Prüfschritt.
 */
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: projectRoot, stdio: 'inherit', env: process.env });  // Unveränderte Umgebung und sichtbare Werkzeugdiagnose.

  // Ein Startfehler hat noch keinen fachlich auswertbaren Exitstatus.
  if (result.error) throw result.error;

  // Ein einziger fehlgeschlagener Schritt verhindert alle nachfolgenden Vorbereitungsschritte.
  if (result.status !== 0) throw new Error(`Prüfschritt fehlgeschlagen: node ${args.join(' ')}`);
}

/**
 * Liest den aktiven JSON-LD-Rohtext der maßgeblichen Startseite ohne HTML neu zu schreiben.
 *
 * @returns {string} Script-Inhalt oder leerer String ohne aktives JSON-LD.
 */
function structuredData() {
  const html = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');                                              // Betreiberpflegte Inhaltsquelle bleibt unangetastet.
  const script = elements(html).find(tag => tag.name === 'script' && tag.attributes.type === 'application/ld+json');  // Gemeinsame Markup-Auswertung mit der SEO-Prüfung.

  return script?.content || '';
}

/**
 * Berechnet den CSP-Hash aus gültigem JSON-LD mit browserüblich normalisierten Zeilenenden.
 *
 * @param {string} source Unveränderter Rohtext des aktiven JSON-LD-Scripts.
 * @returns {string} SHA-256-Hash in Base64 ohne CSP-Präfix.
 * @throws {SyntaxError} Wenn der Rohtext kein gültiges JSON enthält.
 */
function structuredDataHash(source) {
  JSON.parse(source);  // Auch ein technisch berechenbarer Hash darf ungültiges JSON nicht freigeben.

  return createHash('sha256').update(source.replace(/\r\n?/g, '\n')).digest('base64');
}

/**
 * Ersetzt den bisher vorgesehenen JSON-LD-Hash innerhalb der bestehenden script-src-Richtlinie.
 *
 * @param {string} headers Vorhandener Apache-Konfigurationstext.
 * @param {string} hash Neu berechneter SHA-256-Hash ohne CSP-Präfix.
 * @returns {string} Aktualisierter Headertext ohne weitere Formatänderungen.
 * @throws {Error} Wenn der bisherige Hash-Eintrag fehlt.
 */
function replaceStructuredDataHash(headers, hash) {
  const directive = /(script-src[^;"\r\n]*?)'sha256-[^']*'/;  // Bestehender einzelner Inline-Script-Hash des Projekts.

  // Ohne vorgesehenen Hash-Platzhalter darf keine neue CSP-Struktur stillschweigend erzeugt werden.
  if (!directive.test(headers)) throw new Error('JSON-LD-Hash fehlt in der CSP. script-src in .htaccess prüfen.');

  return headers.replace(directive, `$1'sha256-${hash}'`);
}

/**
 * Gleicht ausschließlich den bestehenden CSP-Hash mit dem vorhandenen JSON-LD ab.
 *
 * @returns {void} Kein Rückgabewert; unveränderte Header werden nicht neu geschrieben.
 */
function syncStructuredDataHash() {
  const source = structuredData();  // Nur aktive Script-Inhalte zählen, keine auskommentierten JSON-LD-Beispiele.

  // Fehlende strukturierte Daten meldet anschließend die bestehende SEO-Prüfung.
  if (!source) return;

  const path = resolve(projectRoot, '.htaccess');                                  // Einziges von der Vorbereitung veränderbares Projektartefakt.
  const headers = readFileSync(path, 'utf8');                                      // Ursprüngliche Formatierung bleibt bei der Ersetzung erhalten.
  const updated = replaceStructuredDataHash(headers, structuredDataHash(source));  // Nur der vorhandene Hash ändert sich.

  // Identische Inhalte benötigen keinen Schreibzugriff auf die Apache-Konfiguration.
  if (updated !== headers) writeFileSync(path, updated);
}

run(['scripts/quality/validate-data.mjs']);  // Prüft Fragen, eigene Beispiele und Poolreferenzen ohne Berichtsschreiben.
// Prüft Bewertung, Zustand und die Qualitätswerkzeuge.
run([
  '--test',
  'scripts/quality/core.test.cjs',
  'scripts/quality/session.test.cjs',
  'scripts/quality/filters.test.cjs',
  'scripts/quality/explanations.test.cjs',
  'scripts/quality/checks.test.mjs'
]);

// Die reine Vorprüfung darf auch den bestehenden CSP-Hash nicht neu schreiben.
if (!checkOnly) syncStructuredDataHash();

run(['scripts/quality/check-paths.mjs']);  // Prüft vorhandene lokale Verweise und HTML-Sprungziele.
run(['scripts/quality/check-seo.mjs']);    // Prüft Metadaten, Sitemap und die tatsächliche JSON-LD-Freigabe.

// Die bisherige manuelle Rechtebestätigung bleibt ausschließlich Teil der echten Release-Prüfung.
if (!checkOnly)
  run(['scripts/quality/check-release.mjs', ...process.argv.slice(2).filter(arg => arg === '--rights-confirmed')]);

console.log(
  checkOnly
    ? 'Aktuelle Projektdateien erfolgreich geprüft.'
    : 'Aktuelle Projektdateien für das direkte Deployment vorbereitet.'
);
