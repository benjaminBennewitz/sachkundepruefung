/* scripts/quality/check-seo.mjs */

/**
 * @file Prüfung der öffentlichen Suchmaschinen-Metadaten.
 * @description Prüft eindeutige Seitentitel, Beschreibungen, Canonicals, Sitemap und das durch CSP freigegebene JSON-LD.
 * @author Benjamin Bennewitz [B²]
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, readSiteConfig } from '../config.mjs';

const config = readSiteConfig();
const titles = new Set();
const descriptions = new Set();
const addresses = new Set();
const headers = readFileSync(resolve(projectRoot, '.htaccess'), 'utf8');
const pages = readdirSync(projectRoot).filter(name => name.endsWith('.html'));

/**
 * Liest die doppelt angeführten Attribute eines vorhandenen HTML-Tags.
 * @param {string} tag HTML-Tag aus einer Projektdatei.
 * @returns {Object<string, string>} Attribute mit unveränderten Werten.
 */
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)]
    .map(match => [match[1], match[2]]));
}

for (const file of pages) {
  const source = readFileSync(resolve(projectRoot, file), 'utf8');
  const title = source.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim();
  const metadata = [...source.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
  const description = metadata.find(meta => meta.name === 'description')?.content?.trim();
  const canonical = [...source.matchAll(/<link\b[^>]*>/gi)]
    .map(match => attributes(match[0])).filter(link => link.rel === 'canonical');
  const expectedUrl = `${config.siteUrl}/${file === 'index.html' ? '' : file}`;

  assert(title && !titles.has(title), `${file}: Seitentitel fehlt oder ist doppelt.`);
  assert(description && !descriptions.has(description), `${file}: Beschreibung fehlt oder ist doppelt.`);
  assert.equal([...source.matchAll(/<h1\b/gi)].length, 1, `${file}: genau eine Hauptüberschrift erwartet.`);
  assert.equal(canonical.length, 1, `${file}: genau ein Canonical erwartet.`);
  assert.equal(canonical[0].href, expectedUrl, `${file}: Canonical passt nicht zur Domain.`);
  assert.equal(metadata.find(meta => meta.property === 'og:url')?.content, expectedUrl,
    `${file}: OpenGraph-Adresse passt nicht zum Canonical.`);
  assert.equal(metadata.find(meta => meta.property === 'og:title')?.content, title,
    `${file}: OpenGraph-Titel weicht vom Seitentitel ab.`);
  assert.equal(metadata.find(meta => meta.name === 'robots')?.content, 'index,follow',
    `${file}: öffentliche Seite ist nicht zur Indexierung freigegeben.`);

  for (const match of source.matchAll(/<script\b(?=[^>]*\btype="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/gi)) {
    const value = match[1].replace(/\r\n?/g, '\n');
    const schema = JSON.parse(value);
    const hash = createHash('sha256').update(value).digest('base64');
    assert(headers.includes(`'sha256-${hash}'`), `${file}: JSON-LD wird von der CSP blockiert.`);
    assert.equal(schema.url, expectedUrl, `${file}: strukturierte Daten enthalten eine falsche Adresse.`);
  }
  titles.add(title);
  descriptions.add(description);
  addresses.add(expectedUrl);
}

const sitemap = readFileSync(resolve(projectRoot, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
assert.equal(locations.length, addresses.size, 'Sitemap enthält fehlende oder doppelte Seiten.');
assert.deepEqual(new Set(locations), addresses, 'Sitemap stimmt nicht mit den öffentlichen Seiten überein.');
const robots = readFileSync(resolve(projectRoot, 'robots.txt'), 'utf8');
assert.match(robots, /^Allow:\s*\/\s*$/m, 'robots.txt muss den öffentlichen Bereich freigeben.');
assert(robots.includes(`Sitemap: ${config.siteUrl}/sitemap.xml`), 'Sitemap-Verweis fehlt in robots.txt.');
console.log(`${pages.length} Seitentitel, Beschreibungen und Canonicals sowie Sitemap, robots.txt und JSON-LD geprüft.`);
