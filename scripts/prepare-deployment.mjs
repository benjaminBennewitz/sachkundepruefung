/* scripts/prepare-deployment.mjs */

/**
 * @file Prüfung vor dem direkten Deployment.
 * @description Prüft die aktuellen Projektdateien und bereitet deren direkte Veröffentlichung vor. Erstellt weder eine Projektkopie noch einen Build-Ordner.
 * @author Benjamin Bennewitz [B²]
 */
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
run(['scripts/quality/validate-data.mjs']);
run(['--test', 'scripts/quality/core.test.cjs']);
if (!checkOnly) run(['scripts/pages/prepare-pages.mjs']);
run(['scripts/quality/check-paths.mjs']);
if (!checkOnly) run(['scripts/quality/check-release.mjs', ...process.argv.slice(2)
  .filter(arg => arg === '--rights-confirmed')
]);
console.log(checkOnly ? 'Aktuelle Projektdateien erfolgreich geprüft.' :
  'Aktuelle Projektdateien für das direkte Deployment vorbereitet.');
