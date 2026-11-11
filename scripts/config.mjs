/* scripts/config.mjs */

/**
 * @file Konfiguration der lokalen Werkzeuge.
 * @description Liest zentrale Prüfwerte, normalisiert Domain und Landespfad und verändert keine Projektdateien.
 * @author Benjamin Bennewitz [B²]
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Gemeinsame absolute Projektwurzel, unabhängig vom Arbeitsverzeichnis des aufrufenden Prozesses.
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Normalisiert eine Produktionsdomain; ein leerer Wert kennzeichnet eine lokale Vorschau.
 *
 * @param {string} value HTTPS-Origin ohne Pfad oder Zugangsdaten.
 * @returns {string} Normalisierte Origin oder leerer String.
 * @throws {Error} Bei einer ungeeigneten oder nicht als URL lesbaren Adresse.
 */
export function normalizeOrigin(value) {
  // Die lokale Vorschau benötigt keine verbindliche Produktionsdomain.
  if (!value) return '';

  const url = new URL(value);  // Parser prüft zuerst die tatsächliche URL-Struktur.

  validateOrigin(url);  // Verhindert Pfade, Zugangsdaten und reservierte Beispieladressen.

  return url.origin;
}

/**
 * Prüft die bisher zugelassenen Eigenschaften einer echten HTTPS-Produktionsdomain.
 *
 * @param {URL} url Bereits geparste Produktionsadresse.
 * @returns {void} Kein Rückgabewert.
 * @throws {Error} Wenn die Adresse kein geeignetes Produktionsziel beschreibt.
 */
function validateOrigin(url) {
  // Sowohl URL-Bestandteile als auch der Host müssen die bisherigen Produktionsregeln erfüllen.
  if (invalidOriginParts(url) || !url.hostname.includes('.') || reservedOriginHost(url.hostname)) {
    throw new Error('LHUNDG_ORIGIN muss eine echte HTTPS-Origin ohne Pfad, Query oder Zugangsdaten sein.');
  }
}

/**
 * Normalisiert den Landesbereich ohne abschließenden Schrägstrich.
 *
 * @param {string} [value] Unterverzeichnis wie /nrw oder leer für die Domainwurzel.
 * @returns {string} Geprüfter relativer URL-Pfad ohne abschließenden Schrägstrich.
 * @throws {Error} Bei unzulässigen Zeichen oder ungeeigneter Pfadstruktur.
 */
export function normalizeBasePath(value = '') {
  // Die Domainwurzel wird wie bisher als leerer Landespfad dargestellt.
  if (!value || value === '/') return '';

  const path = value.replace(/\/$/, '');  // Entfernt ausschließlich den optionalen letzten Schrägstrich.

  // Landespfade dürfen nur aus einfachen kleingeschriebenen URL-Segmenten bestehen.
  if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) {
    throw new Error('LHUNDG_BASE_PATH muss ein einfacher Unterverzeichnispfad wie /nrw sein.');
  }

  return path;
}

/**
 * Liest die Browserkonfiguration und berücksichtigt vorhandene Deployment-Überschreibungen.
 *
 * @returns {object} Betreiber-, Hosting- und Domainkonfiguration mit berechneter siteUrl.
 */
export function readSiteConfig() {
  const scope = { window: {} };  // Frischer Kontext verhindert dauerhafte Änderungen an Browser- oder Prozess-Globals.

  vm.runInNewContext(readFileSync(resolve(projectRoot, 'scripts/site-config.js'), 'utf8'), scope);

  const config = scope.window.SITE_CONFIG;  // Ausschließlich die vorhandene zentrale Projektkonfiguration.

  config.origin = normalizeOrigin(process.env.LHUNDG_ORIGIN ?? config.origin);
  config.basePath = normalizeBasePath(process.env.LHUNDG_BASE_PATH ?? config.basePath);
  config.siteUrl = config.origin ? config.origin + config.basePath : '';

  return config;
}

/**
 * Erkennt für eine reine Produktions-Origin unzulässige zusätzliche URL-Bestandteile.
 *
 * @param {URL} url Bereits geparste Produktionsadresse.
 * @returns {boolean} Ob Protokoll, Pfad oder zusätzliche Bestandteile ungeeignet sind.
 */
function invalidOriginParts(url) {
  const extras = [url.port, url.username, url.password, url.search, url.hash];  // Diese zusätzlichen Origin-Bestandteile müssen leer bleiben.

  return url.protocol !== 'https:' || url.pathname !== '/' || extras.some(Boolean);
}

/**
 * Erkennt die bisher ausgeschlossenen lokalen und reservierten Beispielhosts.
 *
 * @param {string} hostname Bereits durch den URL-Parser normalisierter Hostname.
 * @returns {boolean} Ob der Host als Produktionsdomain ausgeschlossen ist.
 */
function reservedOriginHost(hostname) {
  const examples = ['example.com', 'example.org', 'example.net'];  // Bisher explizit ausgeschlossene Beispieldomains.

  return /(?:^|\.)(?:invalid|localhost|example|test)$/.test(hostname) || examples.includes(hostname);
}
