/* scripts/prepare-deployment.mjs */

/**
 * @file Prüfung vor dem direkten Deployment.
 * @description Prüft die vorhandenen Dateien für das direkte Deployment. HTML bleibt unverändert; nur der CSP-Hash wird bei Bedarf aktualisiert.
 * @author Benjamin Bennewitz [B²]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import {
  spawnSync
} from 'node:child_process';
import {
  projectRoot,
  readSiteConfig
} from './config.mjs';

const checkOnly = process.argv.includes('--check-only');
const config = readSiteConfig();
if (!checkOnly && !config.origin) throw new Error(
  'Die Domain ist noch offen. Vor dem Deployment LHUNDG_ORIGIN oder scripts/site-config.js ergänzen.'
);

/** Führt eine vorhandene Prüfung im Projektordner aus. */
function run(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Prüfschritt fehlgeschlagen: node ${args.join(' ')}`);
}
/** Hält die CSP passend zum vorhandenen JSON-LD, ohne dessen HTML zu verändern. */
function syncStructuredDataHash() {
  const html = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');
  const jsonLd = html.match(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (!jsonLd) return;

  JSON.parse(jsonLd);
  const hash = createHash('sha256').update(jsonLd.replace(/\r\n?/g, '\n')).digest('base64');
  const path = resolve(projectRoot, '.htaccess');
  const headers = readFileSync(path, 'utf8');
  const directive = /(script-src[^;"\r\n]*?)'sha256-[^']*'/;
  if (!directive.test(headers)) {
    throw new Error('JSON-LD-Hash fehlt in der CSP. script-src in .htaccess prüfen.');
  }

  const updated = headers.replace(directive, `$1'sha256-${hash}'`);
  if (updated !== headers) writeFileSync(path, updated);
}

run(['scripts/quality/validate-data.mjs']);
run(['--test', 'scripts/quality/core.test.cjs']);
if (!checkOnly) syncStructuredDataHash();
run(['scripts/quality/check-paths.mjs']);
if (!checkOnly) run(['scripts/quality/check-release.mjs', ...process.argv.slice(2)
  .filter(arg => arg === '--rights-confirmed')
]);
console.log(checkOnly ? 'Aktuelle Projektdateien erfolgreich geprüft.' :
  'Aktuelle Projektdateien für das direkte Deployment vorbereitet.');
