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
  complete,
  evaluateSections
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

/** Lädt die Erweiterung isoliert und prüft, dass sie bestehende Kataloge unverändert lässt. */
function loadEssen() {
  const { readFileSync } = require('node:fs');
  const { resolve } = require('node:path');
  const vm = require('node:vm');
  const context = vm.createContext({ window: {} });
  vm.runInContext(readFileSync(resolve(__dirname, '../learning/data.js'), 'utf8'), context);
  context.LHUNDG_DATA = context.window.LHUNDG_DATA;
  const original = JSON.stringify(context.window.LHUNDG_QUESTIONS);
  const pools = JSON.stringify(context.window.LHUNDG_POOLS);
  vm.runInContext(readFileSync(resolve(__dirname, '../learning/essen.js'), 'utf8'), context);
  assert.equal(JSON.stringify(context.window.LHUNDG_QUESTIONS), original);
  assert.equal(JSON.stringify(context.window.LHUNDG_POOLS), pools);
  return { questions: context.window.LHUNDG_DATA.essenExamples,
    sections: context.window.LHUNDG_ESSEN_SECTIONS,
    originals: context.window.LHUNDG_DATA.legacy203 };
}

test('Essen-Beispiel enthält 50 eindeutige Fragen in 17/17/16, ohne Originale zu verändern', () => {
  const { questions, sections, originals } = loadEssen();
  assert.equal(questions.length, 50);
  assert.equal(new Set(questions.map(q => q.id)).size, 50);
  assert.equal(new Set(questions.map(q => q.uid)).size, 50);
  assert.deepEqual(Array.from(sections, s => questions.filter(q => q.examSection === s.id).length), [17, 17, 16]);
  for (const question of questions.filter(q => !q.example)) {
    const { examSection, ...copy } = question;
    const original = originals.find(q => q.id === question.id);
    assert.notEqual(question, original);
    assert.equal(JSON.stringify(copy), JSON.stringify(original));
    assert(['biology', 'behavior'].includes(examSection));
  }
  for (let i = 0; i < 10; i++) {
    const shuffled = randomQuestions(questions, 50);
    assert.equal(new Set(shuffled.map(q => q.id)).size, 50);
    assert.deepEqual(Array.from(sections, s => shuffled.filter(q => q.examSection === s.id).length), [17, 17, 16]);
  }
});

test('Eigene Rechtsfragen sind markiert und besitzen gültige Schlüssel und amtliche Quellen', () => {
  const { questions } = loadEssen();
  const own = questions.filter(q => q.example);
  assert.equal(own.length, 16);
  for (const q of own) {
    assert.equal(q.sourceKey, 'essenExample');
    assert.equal(q.examSection, 'law');
    assert.equal(q.options.length, 4);
    assert(q.correct.length > 0 && q.correct.length < 4);
    assert.equal(new Set(q.correct).size, q.correct.length);
    assert(q.correct.every(token => q.options.includes(token)));
    assert(q.options.every(token => typeof q.answers[token] === 'string'));
    assert(['www.gesetze-im-internet.de', 'recht.nrw.de'].includes(new URL(q.sourceUrl).hostname));
    assert(q.legalReference.startsWith('§'));
    assert(q.explanation.length > 30);
  }
});

test('Essen-Übungswertung verlangt 13/17, 13/17 und 12/16 ohne Ausgleich zwischen Teilen', () => {
  const { questions, sections } = loadEssen();
  /** Erstellt einen Antwortsatz mit vorgegebenen richtigen Anzahlen je Prüfungsteil. */
  const answerCounts = counts => {
    const answers = new Map();
    sections.forEach((section, index) => questions.filter(q => q.examSection === section.id)
      .slice(0, counts[index]).forEach(q => answers.set(q.id, new Set(q.correct))));
    return answers;
  };
  const boundary = evaluateSections(questions, answerCounts([13, 13, 12]), sections);
  assert(boundary.passed);
  assert.equal(boundary.correct, 38);
  assert.equal(boundary.required, 38);
  assert.deepEqual(Array.from(boundary.sections, s => s.required), [13, 13, 12]);
  for (const counts of [[12, 17, 16], [17, 12, 16], [17, 17, 11]]) {
    const score = evaluateSections(questions, answerCounts(counts), sections);
    assert(score.correct >= 38);
    assert(!score.passed);
    assert.equal(score.sections.filter(s => !s.passed).length, 1);
  }
  assert(evaluateSections(questions, answerCounts([17, 17, 16]), sections).passed);
  assert(!evaluateSections(questions, new Map(), sections).passed);
});

test('Essen-Übung vergibt keine Teilpunkte; unbekannte und fehlende Abschnitte bestehen nicht', () => {
  const sections = [{ id: 'law', label: 'Recht' }];
  const question = { ...multi, examSection: 'law' };
  for (const selected of [[], ['A'], ['A', 'B', 'C']]) {
    const score = evaluateSections([question], new Map([[1, new Set(selected)]]), sections);
    assert.equal(score.correct, 0);
    assert(!score.passed);
  }
  assert(evaluateSections([question], new Map([[1, new Set(['A', 'C'])]]), sections).passed);
  assert(!evaluateSections([{ ...question, examSection: 'unknown' }], new Map(), sections).passed);
  assert(!evaluateSections([], new Map(), sections).passed);
  assert(!evaluateSections([question], new Map(), []).passed);
});
