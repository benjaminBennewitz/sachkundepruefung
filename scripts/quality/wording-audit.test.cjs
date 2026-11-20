/* scripts/quality/wording-audit.test.cjs */

/**
 * @file Vollständigkeit und Quellbindung des redaktionellen Wortlautaudits.
 * @description Erkennt veraltete Reihenfolgen, veränderte Quelldaten und unverbundene Hinweise.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const { environment } = require('./learning-fixtures.cjs');

test('Der Auditnachweis umfasst jede der 400 Fragen genau einmal und gehört zu unveränderten Daten', () => {
  const { scope } = environment(['data', 'explanations']);
  const audit = JSON.parse(readFileSync(resolve(__dirname, '../../docs/WORDING_AUDIT.json'), 'utf8'));
  const questions = scope.LHUNDG_DATA.allPool;
  assert.equal(audit.questions.length, 400);
  assert.equal(new Set(audit.questions.map(row => row.uid)).size, 400);
  assert.equal(audit.gradingChanged, false);
  assert.equal(audit.dataSha256, createHash('sha256').update(readFileSync(resolve(__dirname, '../learning/data.js'))).digest('hex'));
  for (const [index, row] of audit.questions.entries()) {
    assert.equal(row.uid, questions[index].uid);
    assert.equal(row.number, index + 1);
    assert.equal(row.reviewed, true);
    if (row.action !== 'none') assert(scope.LHUNDG_EXPLANATIONS[row.uid]?.text);
    if (row.caution) assert.equal(scope.LHUNDG_EXPLANATIONS[row.uid].caution, row.caution);
  }
  assert.equal(Object.values(audit.counts).reduce((sum, value) => sum + value, 0), 400);
});


test('Alle sichtbaren Quellen sind als deutschsprachige Ziele geprüft; reine Texthilfen brauchen keinen Link', () => {
  const { scope } = environment(['data', 'explanations']);
  const audit = JSON.parse(readFileSync(resolve(__dirname, '../../docs/WORDING_AUDIT.json'), 'utf8'));
  const entries = scope.LHUNDG_EXPLANATIONS;
  assert.equal(audit.sourceReview.language, 'de');
  assert.equal(audit.sourceReview.reviewedEntries, Object.keys(entries).length);
  const approved = new Set(audit.sourceReview.approvedUrls);
  const used = new Set();
  for (const [uid, entry] of Object.entries(entries)) {
    const references = entry.references || (entry.sourceUrl ? [{ url: entry.sourceUrl }] : []);
    for (const reference of references) {
      assert(approved.has(reference.url), `Nicht sprachlich geprüfte Quelle: ${uid} ${reference.url}`);
      assert.doesNotMatch(reference.label || '', /englisch|english/i);
      used.add(reference.url);
    }
  }
  assert.deepEqual([...used].sort(), [...approved].sort());
  for (const uid of ['legacy-10', 'legacy-15']) {
    assert.equal(entries[uid].sourceUrl, undefined);
    assert.equal(entries[uid].references, undefined);
  }
});
