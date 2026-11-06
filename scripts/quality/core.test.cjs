/* scripts/quality/core.test.cjs */

/**
 * @file Regressionstests der Auswertung.
 * @description Regressionstests für Bewertung, Zufallsauswahl, Testgrößen und Antwortvalidierung.
 * @author Benjamin Bennewitz [B²]
 */
const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const {
  exact,
  randomQuestions,
  validAnswers,
  complete
} = require('../learning/core.js');
const multi = {
  id: 1,
  type: 'multi',
  options: ['A', 'B', 'C', 'D'],
  correct: ['A', 'C']
};
const mapping = {
  id: 2,
  type: 'mapping',
  mappingKeys: ['a', 'b'],
  mappingChoices: ['1', '2'],
  correct: ['a:2', 'b:1']
};
test('Multiple Choice verlangt alle richtigen Antworten ohne zusätzliche Auswahl', () => {
  assert(exact(new Set(['C', 'A']), multi.correct));
  for (const selection of [
      [],
      ['A'],
      ['A', 'B', 'C']
    ]) assert(!exact(new Set(selection), multi.correct));
});
test('Zuordnung wertet die vollständigen Paare und erkennt Teilantworten', () => {
  assert(exact(new Set(['b:1', 'a:2']), mapping.correct));
  assert(!exact(new Set(['a:1', 'b:2']), mapping.correct));
  assert(!complete(mapping, new Set(['a:2'])));
  assert(complete(mapping, new Set(mapping.correct)));
});
test('Simulation zieht exakt 119 eindeutige Fragen und verändert den Pool nicht', () => {
  const pool = Array.from({
    length: 398
  }, (_, id) => ({
    id
  }));
  const expected = pool.map(q => q.id);
  for (let i = 0; i < 20; i++) {
    const drawn = randomQuestions(pool, 119);
    assert.equal(drawn.length, 119);
    assert.equal(new Set(drawn.map(q => q.id))
      .size, 119);
  }
  assert.deepEqual(pool.map(q => q.id), expected);
});
test('Unbekannte Antworttokens und widersprüchliche Zuordnungen werden abgewiesen', () => {
  const restored = validAnswers({
    1: ['A', 'A', 'X'],
    2: ['a:1', 'a:2', 'b:1'],
    999: ['A']
  }, [multi, mapping]);
  assert.deepEqual([...restored.get(1)], ['A']);
  assert(!restored.has(2));
  assert(!restored.has(999));
  assert.equal(validAnswers(null, [multi])
    .size, 0);
  assert.equal(validAnswers(['A'], [multi])
    .size, 0);
});
test('Bestehensgrenze der Simulation liegt bei 90 von 119', () => {
  const score = answers => answers.filter((selection) => exact(new Set(selection), ['A']))
    .length >= 90;
  assert(!score(Array.from({
    length: 119
  }, (_, i) => i < 89 ? ['A'] : [])));
  assert(score(Array.from({
    length: 119
  }, (_, i) => i < 90 ? ['A'] : [])));
});

test('Neue Testreihen ziehen 34 bzw. 30 eindeutige Fragen aus ihrem eigenen Pool', () => {
  for (const [size, count] of [
      [203, 34],
      [197, 30]
    ]) {
    const pool = Array.from({
      length: size
    }, (_, id) => ({
      id
    }));
    for (let i = 0; i < 15; i++) {
      const drawn = randomQuestions(pool, count);
      assert.equal(drawn.length, count);
      assert.equal(new Set(drawn.map(q => q.id))
        .size, count);
      assert(drawn.every(q => pool.includes(q)));
    }
  }
});
