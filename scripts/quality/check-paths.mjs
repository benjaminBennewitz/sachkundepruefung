/* scripts/quality/check-paths.mjs */

/**
 * @file Prüfung lokaler Dateiverweise.
 * @description Prüft lokale HTML-, CSS- und Asset-Verweise vor dem Verpacken.
 * @author Benjamin Bennewitz [B²]
 */
import {
  readFileSync,
  existsSync,
  readdirSync,
  statSync
} from 'node:fs';
import {
  resolve,
  relative,
  dirname,
  extname
} from 'node:path';
import assert from 'node:assert/strict';
import {
  projectRoot,
  readSiteConfig
} from '../config.mjs';

const root = resolve(process.argv[2] || projectRoot);
const mountPath = readSiteConfig().basePath;
const htmlFiles = readdirSync(root)
  .filter(name => name.endsWith('.html'));
let checked = 0;

/** Prüft einen lokalen Verweis einschließlich eines optionalen HTML-Sprungziels. */
function checkReference(value, source) {
  if (!value || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value)) return;
  const url = new URL(value,
    `https://local.invalid${mountPath}/${relative(root, source).replaceAll('\\', '/')}`);
  const pathname = decodeURIComponent(url.pathname);
  assert(!mountPath || pathname === mountPath || pathname.startsWith(mountPath + '/'),
    `Verweis verlässt den Landesbereich: ${value}`);
  const localPath = pathname.slice(mountPath.length) || '/';
  const path = resolve(root, `.${localPath}`);
  assert(!relative(root, path)
    .startsWith('..'), `Pfad verlässt das Paket: ${value}`);
  const target = existsSync(path) && statSync(path)
    .isDirectory() ? resolve(path, 'index.html') : path;
  assert(existsSync(target), `${relative(root, source)}: fehlender Verweis ${value}`);
  if (url.hash && extname(target) === '.html') {
    const id = decodeURIComponent(url.hash.slice(1));
    assert(readFileSync(target, 'utf8')
      .includes(`id="${id}"`), `${relative(root, source)}: Sprungziel fehlt: ${value}`);
  }
  checked++;
}
for (const name of htmlFiles) {
  const file = resolve(root, name);
  const html = readFileSync(file, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids)
    .size, ids.length, `Doppelte HTML-ID: ${name}`);
  for (const match of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) checkReference(match[1], file);
}
for (const name of readdirSync(resolve(root, 'styles'))) {
  const file = resolve(root, 'styles', name);
  for (const match of readFileSync(file, 'utf8')
      .matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) checkReference(match[1], file);
}
console.log(`${htmlFiles.length} HTML-Seiten und ${checked} lokale Verweise geprüft.`);
