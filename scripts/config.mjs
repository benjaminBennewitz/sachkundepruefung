/* scripts/config.mjs */

/**
 * @file Konfiguration der lokalen Werkzeuge.
 * @description Gemeinsame Projektpfade und Konfiguration für lokale Werkzeuge.
 * @author Benjamin Bennewitz [B²]
 */
import {
  readFileSync,
  writeFileSync
} from 'node:fs';
import {
  dirname,
  resolve
} from 'node:path';
import {
  fileURLToPath
} from 'node:url';
import vm from 'node:vm';

/** @type {string} Absoluter Projektordner, unabhängig vom Arbeitsverzeichnis. */
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Prüft eine Produktionsdomain; ein leerer Wert kennzeichnet eine lokale Vorschau.
 * @param {string} value HTTPS-Origin ohne Pfad oder Zugangsdaten.
 * @returns {string} Normalisierte Origin oder leerer String.
 * @throws {Error} Bei einer ungeeigneten Produktionsadresse.
 */
export function normalizeOrigin(value) {
  if (!value) return '';
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.pathname !==
    '/' || url.search || url.hash || !url.hostname.includes('.') ||
    /(?:^|\.)(?:invalid|localhost|example|test)$/.test(url.hostname) || ['example.com',
      'example.org', 'example.net'
    ].includes(url.hostname)) {
    throw new Error(
      'LHUNDG_ORIGIN muss eine echte HTTPS-Origin ohne Pfad, Query oder Zugangsdaten sein.');
  }
  return url.origin;
}

/**
 * Normalisiert den Landesbereich ohne abschließenden Schrägstrich.
 * @param {string} value Unterverzeichnis wie /nrw oder leer für die Domainwurzel.
 * @returns {string} Geprüfter relativer URL-Pfad.
 */
export function normalizeBasePath(value = '') {
  if (!value || value === '/') return '';
  const path = value.replace(/\/$/, '');
  if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)) {
    throw new Error('LHUNDG_BASE_PATH muss ein einfacher Unterverzeichnispfad wie /nrw sein.');
  }
  return path;
}

/**
 * Liest die Browserkonfiguration und übernimmt optional die Deployment-Domain.
 * @returns {object} Betreiber-, Hosting- und Domainkonfiguration.
 */
export function readSiteConfig() {
  const scope = {
    window: {}
  };
  vm.runInNewContext(readFileSync(resolve(projectRoot, 'scripts/site-config.js'), 'utf8'), scope);
  const config = scope.window.SITE_CONFIG;
  config.origin = normalizeOrigin(process.env.LHUNDG_ORIGIN ?? config.origin);
  config.basePath = normalizeBasePath(process.env.LHUNDG_BASE_PATH ?? config.basePath);
  config.siteUrl = config.origin ? config.origin + config.basePath : '';
  return config;
}

/**
 * Schreibt Projekttext mit den vereinbarten CRLF-Zeilenenden.
 * @param {string} path Absoluter Dateipfad.
 * @param {string} content UTF-8-Inhalt.
 */
export function writeText(path, content) {
  writeFileSync(path, content.replace(/\r?\n/g, '\r\n'));
}
