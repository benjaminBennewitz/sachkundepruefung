/* scripts/quality/check-seo.mjs */

/**
 * @file Prüfung der öffentlichen Suchmaschinen-Metadaten.
 * @description Prüft Root-Metadaten, Sitemap und JSON-LD samt Freigabe in der wirksamen script-src-Richtlinie.
 * @author Benjamin Bennewitz [B²]
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, readSiteConfig } from '../config.mjs';
import { elements, decodeEntities } from './markup.mjs';

const config = readSiteConfig();                                                // Ein gemeinsamer Sollwert für Canonical, OpenGraph und Sitemap.
const titles = new Set();                                                       // Seitentitel müssen im öffentlichen Angebot eindeutig sein.
const descriptions = new Set();                                                 // Identische Beschreibungen würden fehlende Seitenpflege verdecken.
const addresses = new Set();                                                    // Diese Seiten müssen vollständig in der Sitemap vorkommen.
const pages = readdirSync(projectRoot).filter(name => name.endsWith('.html'));  // Öffentliche HTML-Dateien im Projekt-Root; jede erhält ihre eigene Solladresse.

/**
 * Liest eine vorhandene Projektdatei unverändert als UTF-8-Text.
 *
 * @param {string} name Relativer Projektpfad.
 * @returns {string} Unveränderter Dateiinhalt für die Prüfung.
 */
function read(name) {
  return readFileSync(resolve(projectRoot, name), 'utf8');
}

/**
 * Liest script-src aus den aktiven, einzeiligen Apache-CSP-Headern.
 *
 * @returns {string[]} script-src-Werte der aktiven CSP-Header; Hashes anderer Richtlinien zählen nicht.
 */
function scriptPolicies() {
  const headers = read('.htaccess').split(/\r?\n/);  // Das Projekt verwendet einzeilige Apache-Header.
  const policies = [];                               // Erzwingende CSPs müssen das JSON-LD jeweils freigeben.

  // Kommentare und Report-Only-Header werden von der Zeilenprüfung ausgeschlossen.
  for (const line of headers) {
    const policy = scriptPolicy(line);  // script-src, leerer Wert oder null für andere Header.

    // Nur ein tatsächlich aktiver CSP-Header trägt zur Freigabeprüfung bei.
    if (policy !== null) policies.push(policy);
  }

  assert(policies.length, 'Keine aktive Content-Security-Policy gefunden.');

  return policies;
}

const policies = scriptPolicies();  // Mehrere aktive Policies müssen das Script jeweils erlauben.

/**
 * Liest die SEO-Metadaten einer Seite und prüft deren erforderliche Grundstruktur.
 *
 * @param {object[]} tags Erkannte Elemente.
 * @param {string} file Seitenname.
 * @returns {object} Prüfwerte der Seite.
 */
function pageMetadata(tags, file) {
  const metadata = tags.filter(tag => tag.name === 'meta').map(tag => tag.attributes);              // Alle aktiven Meta-Attribute dieser Seite für Beschreibung, OpenGraph und Indexierung.
  const canonical = tags.filter(tag => tag.name === 'link' && tag.attributes.rel === 'canonical');  // Aktive Canonical-Angaben; ihre Anzahl wird vor dem Zugriff geprüft.
  const titleTags = tags.filter(tag => tag.name === 'title');                                       // Aktive Titel-Elemente; genau eines muss den Seitentitel liefern.

  assert.equal(titleTags.length, 1, `${file}: genau ein Seitentitel erwartet.`);
  assert.equal(canonical.length, 1, `${file}: genau ein Canonical erwartet.`);
  assert.equal(tags.filter(tag => tag.name === 'h1').length, 1, `${file}: genau eine Hauptüberschrift erwartet.`);

  return {
    metadata,
    canonical: canonical[0].attributes.href,
    title: decodeEntities(titleTags[0].content).trim(),
    description: metadata.find(meta => meta.name === 'description')?.content?.trim()
  };
}

/**
 * Vergleicht die Seitenmetadaten mit der erwarteten Veröffentlichungsadresse.
 *
 * @param {object} page Gelesene Metadaten.
 * @param {string} file Seitenname.
 * @param {string} url Erwartete Adresse.
 * @returns {void} Kein Rückgabewert.
 */
function checkMetadata(page, file, url) {
  const { title, description, metadata, canonical } = page;  // Gemeinsame Prüfwerte der gelesenen Seite.

  assert(title && !titles.has(title), `${file}: Seitentitel fehlt oder ist doppelt.`);
  assert(description && !descriptions.has(description), `${file}: Beschreibung fehlt oder ist doppelt.`);
  assert.equal(canonical, url, `${file}: Canonical passt nicht zur Domain.`);

  checkOpenGraph(page, file, url);  // Gleicht die geteilte Vorschau mit Titel und Veröffentlichungsadresse ab.

  assert.equal(metadata.find(meta => meta.name === 'robots')?.content, 'index,follow', `${file}: Indexierung fehlt.`);
  titles.add(title);
  descriptions.add(description);
}

/**
 * Prüft JSON-LD auf der Startseite und seine Freigabe in allen aktiven CSPs.
 *
 * @param {object[]} tags Seitenelemente.
 * @param {string} file Seitenname.
 * @param {string} url Erwartete Adresse.
 * @returns {void} Kein Rückgabewert.
 */
function checkStructuredData(tags, file, url) {
  const scripts = tags.filter(tag => tag.name === 'script' && tag.attributes.type === 'application/ld+json');  // Aktive JSON-LD-Blöcke dieser Seite.

  // Die Startseite ist die bestehende Quelle der strukturierten Projektdaten.
  if (file === 'index.html') assert.equal(scripts.length, 1, 'index.html: genau ein JSON-LD-Script erwartet.');

  // Weitere öffentliche Seiten dürfen eigene strukturierte Daten mit passender Adresse besitzen.
  for (const script of scripts) checkStructuredScript(script, file, url);
}

/**
 * Gleicht die Sitemap und den robots.txt-Verweis mit den öffentlichen Seiten ab.
 *
 * @returns {void} Kein Rückgabewert.
 */
function checkDiscovery() {
  // Dekodierte Sitemap-Adressen; Menge und Anzahl müssen alle öffentlichen Seiten genau abdecken.
  const locations = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decodeEntities(match[1]));

  assert.equal(locations.length, addresses.size, 'Sitemap enthält fehlende oder doppelte Seiten.');
  assert.deepEqual(new Set(locations), addresses, 'Sitemap stimmt nicht mit den öffentlichen Seiten überein.');

  const robots = read('robots.txt');  // Die lokale Vorlage wird beim Deployment für die Domainwurzel verwendet.

  assert.match(robots, /^Allow:\s*\/\s*$/m, 'robots.txt muss den öffentlichen Bereich freigeben.');
  assert(robots.includes(`Sitemap: ${config.siteUrl}/sitemap.xml`), 'Sitemap-Verweis fehlt in robots.txt.');
}

// Jede Root-Seite wird genau einmal gegen die gemeinsame Veröffentlichungsadresse geprüft.
for (const file of pages) {
  // Erkannte aktive Elemente; Kommentare und eingebetteter Rohtext erzeugen keine zusätzlichen Tags.
  const tags = elements(read(file));
  const url = `${config.siteUrl}/${file === 'index.html' ? '' : file}`;  // Erwartete öffentliche Adresse dieser Root-Seite.

  checkMetadata(pageMetadata(tags, file), file, url);  // Prüft Titel, Beschreibung, Canonical, OpenGraph und Indexierung.
  checkStructuredData(tags, file, url);                // Prüft vorhandenes JSON-LD samt Adresse und CSP-Freigabe.
  addresses.add(url);                                  // Nimmt die gültige Seitenadresse in die spätere Sitemap-Prüfung auf.
}

checkDiscovery();
console.log(
  `${pages.length} Seitentitel, Beschreibungen und Canonicals sowie Sitemap, robots.txt und JSON-LD geprüft.`
);

/**
 * Prüft Inhalt, Veröffentlichungsadresse und CSP-Freigabe eines JSON-LD-Scripts.
 *
 * @param {object} script Aktives Script-Element mit seinem unveränderten Rohtext.
 * @param {string} file Dateiname für die Fehlerdiagnose.
 * @param {string} url Erwartete Veröffentlichungsadresse.
 * @returns {void} Kein Rückgabewert.
 */
function checkStructuredScript(script, file, url) {
  const value = script.content.replace(/\r\n?/g, '\n');                             // Zeilenenden werden wie beim HTML-Einlesen im Browser normalisiert.
  const schema = JSON.parse(value);                                                 // Fehlerhaftes JSON muss auch bei passendem Hash scheitern.
  const token = `'sha256-${createHash('sha256').update(value).digest('base64')}'`;  // Exakter Hash dieses Script-Inhalts.

  assert(
    policies.every(policy => policy.trim().split(/\s+/).includes(token)),
    `${file}: JSON-LD wird von der CSP blockiert.`
  );
  assert.equal(schema.url, url, `${file}: strukturierte Daten enthalten eine falsche Adresse.`);
}

/**
 * Liest script-src aus genau einer aktiven Apache-CSP-Headerzeile.
 *
 * @param {string} line Unveränderte Zeile aus .htaccess.
 * @returns {string|null} Richtlinienwert, leer bei fehlendem script-src oder null ohne aktiven CSP-Header.
 */
function scriptPolicy(line) {
  const match = line.match(/^\s*Header\s+(?:always\s+)?set\s+Content-Security-Policy\s+"([^"]+)"/i);  // Nur aktive, erzwingende CSP-Header.

  // Auskommentierte Angaben und Report-Only-Richtlinien erlauben keine Scriptausführung.
  if (!match) return null;

  return match[1].split(';').find(value => /^\s*script-src\s/i.test(value)) ?? '';
}

/**
 * Gleicht OpenGraph-Titel und -Adresse mit den bereits gelesenen Seitenangaben ab.
 *
 * @param {object} page Gelesener Titel und Meta-Attribute.
 * @param {string} file Dateiname für die Fehlerdiagnose.
 * @param {string} url Erwartete Veröffentlichungsadresse.
 * @returns {void} Kein Rückgabewert.
 */
function checkOpenGraph(page, file, url) {
  const address = page.metadata.find(meta => meta.property === 'og:url')?.content;  // Vorschauadresse der Seite.
  const title = page.metadata.find(meta => meta.property === 'og:title')?.content;  // Vorschautitel der Seite.

  assert.equal(address, url, `${file}: OpenGraph-Adresse weicht ab.`);
  assert.equal(title, page.title, `${file}: OpenGraph-Titel weicht ab.`);
}
