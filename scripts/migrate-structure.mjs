/* scripts/migrate-structure.mjs */

/**
 * @file Reversible Umstellung der Dateipfade.
 * @description Entfernt alte Pfade nach dem Einspielen des Strukturpatches durch reversible Verschiebung.
 * @author Benjamin Bennewitz [B²]
 */
import {
  existsSync,
  readFileSync,
  mkdtempSync,
  mkdirSync,
  renameSync,
  readdirSync,
  rmdirSync
} from 'node:fs';
import {
  resolve,
  dirname,
  basename
} from 'node:path';
import {
  createHash
} from 'node:crypto';
import {
  projectRoot
} from './config.mjs';

/** @type {{old: string, target: string, sha256: string}[]} Geprüfte Altpfade des bereitgestellten ZIP-Stands. */
const moves = [{
  "old": "app.js",
  "target": "scripts/learning/app.js",
  "sha256": "83510697f173e70c20066c6c44a430ea1a09938a24a5d6d62323bf0dcb1c3e39"
}, {
  "old": "core.js",
  "target": "scripts/learning/core.js",
  "sha256": "2c4b6a59a2dad9f5d65af2855ca1112f5830c36204a27e373eec99ecd02c77dd"
}, {
  "old": "data.js",
  "target": "scripts/learning/data.js",
  "sha256": "76aaac4827c748baff6b52c2816eecfae56f393ab4924eae530504086212bf07"
}, {
  "old": "sources.js",
  "target": "scripts/learning/sources.js",
  "sha256": "91351740a6a7ef198212fa2e8196c9d3461498b55eddf69309adf279bae5c26c"
}, {
  "old": "theme.js",
  "target": "scripts/ui/theme.js",
  "sha256": "81ab3e575b3b7239749c9f5127da6bcd21f051ed22bdbc03132fa0045bd3eea2"
}, {
  "old": "common.js",
  "target": "scripts/ui/common.js",
  "sha256": "132471d10f45a84e7553fc3f1e75eb7b0629d9db23fca5f426ea6caa288e11f3"
}, {
  "old": "controls.js",
  "target": "scripts/ui/controls.js",
  "sha256": "cbea2e80979c3d5a74c824cbb12da7509c7b3b291df269c7df336ad47e4f4059"
}, {
  "old": "site-config.js",
  "target": "scripts/site-config.js",
  "sha256": "754e22e25eed623bd2999810c019f932547dda70bd933b703ffa8d0443b4a052"
}, {
  "old": "scripts/prepare-pages.mjs",
  "target": "scripts/pages/prepare-pages.mjs",
  "sha256": "7828925d40ce2b57a455ae78b4625dc574e8ff9a9af6994fc459330ffea09bca"
}, {
  "old": "scripts/content-pages.mjs",
  "target": "scripts/pages/content-pages.mjs",
  "sha256": "0aa81ad764cfb3e6f609f5b3cc0daea7da55e270b2d94c99d4c4989163da2133"
}, {
  "old": "scripts/ui-shell.mjs",
  "target": "scripts/pages/ui-shell.mjs",
  "sha256": "59744c7eb24e92f41696e27203410f34d6b2cebeff8e52d775647b5ca1feb652"
}, {
  "old": "scripts/check-release.mjs",
  "target": "scripts/quality/check-release.mjs",
  "sha256": "5b2ccf5995f8e83b6e5a7cb486f9cc2320e5aeb7a3b472e0b4df7a8c60c59d32"
}, {
  "old": "scripts/validate-data.mjs",
  "target": "scripts/quality/validate-data.mjs",
  "sha256": "17046230053f28a72016041f4cc9d7f255836ca15f8fe73f19deb8b1f109f108"
}, {
  "old": "scripts/core.test.cjs",
  "target": "scripts/quality/core.test.cjs",
  "sha256": "0a12517a8540fb4b85bac11b7085cd1a8a0482ff80a6357eaa9585277400fc5d"
}, {
  "old": "scripts/fixtures/official-keys.json",
  "target": "scripts/quality/official-keys.json",
  "sha256": "97bdcdce708fd4d48ffc1241a54b8b1d990568d000805451a1e9e365fbeb766a"
}, {
  "old": "scripts/fixtures/dcr-privacy-source.json",
  "target": "scripts/pages/dcr-privacy-source.json",
  "sha256": "8e1ca6fae1b565af5a8db866b911c28445d47f66a68b8a431d378eadb5e7cf52"
}, {
  "old": "styles.css",
  "target": "styles/interface.css",
  "sha256": "06c72a299a28c07196f0850e5ce02f0e13bbcd5e73f159fbf32b0c77b40d185e"
}, {
  "old": "QUESTION_AUDIT.json",
  "target": "docs/QUESTION_AUDIT.json",
  "sha256": "23452c45bd0957a1eee843675c226bb5c5720f2472df3daefa6f635a143b6f21"
}, {
  "old": "VALIDATION.md",
  "target": "docs/VALIDATION.md",
  "sha256": "2329fac8340fe5d9e4efc5ff8e81ae41f97dfb74c63df52adaafb00acf4f9573"
}, {
  "old": "validation.json",
  "target": "docs/validation.json",
  "sha256": "3be11288e3ae8ecc080953a40ad3fa18a101d847ad5394f49624de9413feee35"
}];
const pending = moves.filter(item => existsSync(resolve(projectRoot, item.old)));
for (const item of pending) {
  if (!existsSync(resolve(projectRoot, item.target))) throw new Error(
    `Neue Zieldatei fehlt: ${item.target}. Zuerst den Patch vollständig entpacken.`);
  const actual = createHash('sha256')
    .update(readFileSync(resolve(projectRoot, item.old)))
    .digest('hex');
  if (actual !== item.sha256) throw new Error(
    `Altdatei wurde verändert: ${item.old}. Vor der Umstellung manuell abgleichen; es wurde nichts verschoben.`
  );
}
if (!pending.length) {
  console.log('Die Struktur ist bereits bereinigt.');
} else if (!process.argv.includes('--apply')) {
  console.log(
    `Geprüfte Altdateien: ${pending.length}. Zum reversiblen Verschieben --apply ergänzen.`);
  console.log(pending.map(item => `${item.old} -> ${item.target}`)
    .join('\n'));
} else {
  const backup = mkdtempSync(resolve(dirname(projectRoot),
    `${basename(projectRoot)}-vor-aufraeumen-`));
  console.log(`Sicherung der Altdateien: ${backup}`);
  for (const item of pending) {
    const destination = resolve(backup, item.old);
    mkdirSync(dirname(destination), {
      recursive: true
    });
    renameSync(resolve(projectRoot, item.old), destination);
  }
  const fixtures = resolve(projectRoot, 'scripts/fixtures');
  if (existsSync(fixtures) && !readdirSync(fixtures)
    .length) rmdirSync(fixtures);
  console.log(`Struktur bereinigt. Alte Dateien liegen außerhalb des Projekts: ${backup}`);
}
