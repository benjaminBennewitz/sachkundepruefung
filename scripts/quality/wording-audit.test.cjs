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
