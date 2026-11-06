/* scripts/quality/validate-data.mjs */

/**
 * @file Prüfung der Fragen und Lösungsschlüssel.
 * @description Prüft Frage-IDs, Lösungsschlüssel, Poolreferenzen und sämtliche Aufgabenabbildungen.
 * @author Benjamin Bennewitz [B²]
 */
import {
  readFileSync,
  existsSync,
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
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const context = {
  window: {}
};
vm.runInNewContext(readFileSync(resolve(root, 'scripts/learning/data.js'), 'utf8'), context);
const questions = context.window.LHUNDG_QUESTIONS;
const data = context.window.LHUNDG_DATA;
const expected = JSON.parse(readFileSync(resolve(root, 'scripts/quality/official-keys.json'),
  'utf8'));
const ids = new Set();
const uids = new Set();
const sourceIds = new Set();
for (const q of questions) {
  assert(!ids.has(q.id), `Doppelte ID ${q.id}`);
  ids.add(q.id);
  assert(!uids.has(q.uid), `Doppelte UID ${q.uid}`);
  uids.add(q.uid);
  const sourceId = `${q.sourceKey}:${q.sourceId}`;
  assert(!sourceIds.has(sourceId), `Doppelte Quellen-ID ${sourceId}`);
  sourceIds.add(sourceId);
  assert(q.prompt.trim(), `Leere Frage ${q.uid}`);
  assert(q.correct.length > 0, `Fehlende Lösung ${q.uid}`);
  if (q.type === 'mapping') {
    assert.equal(q.mappingKeys.length, q.correct.length, `Unvollständige Zuordnung ${q.uid}`);
    for (const key of q.mappingKeys) assert.equal(q.correct.filter(v => v.startsWith(`${key}:`))
      .length, 1);
    for (const token of q.correct) {
      const [key, value] = token.split(':');
      assert(q.mappingKeys.includes(key) && q.mappingChoices.includes(value));
    }
  } else {
    for (const letter of q.options) assert(q.answers[letter]?.trim(),
      `Fehlender Antworttext ${q.uid}:${letter}`);
    for (const letter of q.correct) assert(q.options.includes(letter),
      `Ungültige Lösung ${q.uid}:${letter}`);
  }
  assert.equal(typeof q.requiresVisual, 'boolean');
  if (q.requiresVisual) assert(q.images.length > 0);
  for (const image of q.images) assert(existsSync(resolve(root, image)),
    `Fehlende Abbildung ${image}`);
  if (expected[q.sourceKey]) assert.equal(JSON.stringify([...q.correct].sort()), JSON.stringify(
    expected[q.sourceKey][q.sourceId]), `Lösung weicht von PDF ab: ${q.uid}`);
}
const counts = {};
for (const [key, pool] of Object.entries(data)) {
  assert(pool.every(Boolean), `Fehlende Poolreferenz ${key}`);
  assert.equal(new Set(pool.map(q => q.id))
    .size, pool.length, `Doppelte Pool-ID ${key}`);
  counts[key] = pool.length;
}
assert.equal(counts.mgPool, 398);
assert.equal(counts.allPool, 400);
assert.equal(counts.kammer197, 197);
assert(!data.koeln.some(q => q.sourceId === 'A11'));
const report = {
  version: 21,
  date: '2026-11-06',
  counts,
  canonicalQuestions: questions.length,
  missingKeys: 0,
  invalidKeys: 0,
  missingAssets: 0,
  verifiedOfficialKeys: {
    legacy203: 203,
    kammer197: 197
  },
  inheritedProvidedKeys: {
    rhein97: 97,
    koeln: 115
  },
  correctedLegacyQuestions: [158, 160, 161]
};
writeFileSync(resolve(root, 'docs/validation.json'), JSON.stringify(report, null, 2)
  .replace(/\r?\n/g, '\r\n') + '\r\n');
console.log(JSON.stringify(report, null, 2));
