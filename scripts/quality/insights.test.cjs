/* scripts/quality/insights.test.cjs */

/**
 * @file Kennzahlen ohne erfundene Erfolge oder zusammengezählte Quellkataloge.
 * @description Prüft tatsächliche Katalogzustände, Prüfungstrennung und den kleinen Startseitenüberblick.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const { environment, session } = require('./learning-fixtures.cjs');

/** @returns {object} Echte Lernmodule einschließlich der neuen Kennzahlen. */
function setup() {
  return environment(['data', 'essen', 'core', 'profiles', 'session', 'insights']);
}

test('Richtig und falsch zählen nur vollständige, ausdrücklich geprüfte Antworten', () => {
  const env = setup();
  const current = session(env);
  const questions = current.questions.filter(q => q.type !== 'mapping' && q.correct.length < q.options.length).slice(0, 3);
  const [right, wrong, untested] = questions;
  current.state.answers.set(right.id, new Set(right.correct));
  current.state.answers.set(wrong.id, new Set([wrong.options.find(option => !wrong.correct.includes(option))]));
  current.state.answers.set(untested.id, new Set(untested.correct));
  current.state.checked.set(right.id, current.signature(right));
  current.state.checked.set(wrong.id, current.signature(wrong));
  current.state.bookmarks.add(untested.id);
  current.state.bookmarks.add(999999);
  const result = env.trainer.Insights.calculate(current);
  assert.equal(result.total, 400);
  assert.equal(result.answered, 3);
  assert.equal(result.checked, 2);
  assert.equal(result.correct, 1);
  assert.equal(result.wrong, 1);
  assert.equal(result.bookmarked, 1);
});

test('Eine unvollständige Zuordnung wird auch bei veraltetem Prüfeintrag nicht als geprüft gezählt', () => {
  const env = setup();
  const current = session(env, 'mode=rhein97');
  const question = current.questions.find(q => q.type === 'mapping');
  current.state.answers.set(question.id, new Set([question.correct[0]]));
  current.state.checked.set(question.id, current.signature(question));
  const result = env.trainer.Insights.calculate(current);
  assert.equal(result.answered, 0);
  assert.equal(result.checked, 0);
});

test('Eine nach der Prüfung geänderte Antwort erhöht die Quote nicht weiter', () => {
  const env = setup();
  const current = session(env);
  const question = current.questions.find(q => q.type !== 'mapping' && q.correct.length < q.options.length);
  current.state.answers.set(question.id, new Set(question.correct));
  current.state.checked.set(question.id, current.signature(question));
  current.state.answers.set(question.id, new Set([question.options.find(value => !question.correct.includes(value))]));
  const result = env.trainer.Insights.calculate(current);
  assert.equal(result.answered, 1);
  assert.equal(result.checked, 0);
  assert.equal(result.correct, 0);
});

test('Prüfungssimulationen geben keine vorzeitigen Kennzahlen heraus', () => {
  const env = setup();
  const current = session(env, 'mode=exam34');
  const question = current.questions[0];
  current.state.answers.set(question.id, new Set(question.correct));
  current.state.checked.set(question.id, current.signature(question));
  assert.equal(env.trainer.Insights.calculate(current), null);
});

test('Eine lokale Übersicht enthält nur Zähler; unveränderte Anzeige schreibt nicht erneut', () => {
  const env = setup();
  const current = session(env);
  const nodes = {};
  const root = { querySelector: selector => nodes[selector] ||= {} };
  env.scope.document = { getElementById: () => root };
  let writes = 0;
  const original = env.scope.localStorage.setItem;
  env.scope.localStorage.setItem = (key, value) => { writes += 1; original(key, value); };
  env.trainer.Insights.refresh(current);
  env.trainer.Insights.refresh(current);
  assert.equal(writes, 1);
  const saved = JSON.parse(env.scope.localStorage.getItem('lhundg-overview-v1'));
  assert.deepEqual(Object.keys(saved).sort(), ['version', 'mode', 'total', 'answered', 'checked', 'correct', 'wrong', 'bookmarked'].sort());
  assert.equal(saved.answered, 0);
  assert.equal(saved.checked, 0);
});

/**
 * Öffnet das echte Startseitenmodul mit einem kontrollierten, lokalen Speicherstand.
 * @param {object|null} saved Ungeprüfte Übersicht.
 * @returns {object} Angezeigte Werte und Rückruf für geänderte Speicherdaten.
 */
function overview(saved) {
  const nodes = {};
  const events = {};
  const card = { dataset: { catalogueMode: 'all', questionCount: '400' },
    querySelector: selector => selector === 'h3' ? { textContent: 'Alle Quellen' } :
      { getAttribute: () => 'lernen.html?mode=all' } };
  const scope = {
    document: {
      getElementById: () => ({ querySelector: selector => nodes[selector] ||= {} }),
      querySelectorAll: () => [card]
    },
    localStorage: { getItem: () => JSON.stringify(saved) },
    addEventListener(name, callback) { events[name] = callback; }
  };
  scope.window = scope;
  vm.runInNewContext(readFileSync(resolve(__dirname, '../ui/learning-overview.js'), 'utf8'), scope);
  return { nodes, clear() { saved = null; events.storage({ key: null }); } };
}

test('Fehlende oder widersprüchliche Startseitenwerte werden nicht als Nullerfolg ausgegeben', () => {
  for (const value of [null, { version: 1, mode: 'unknown' },
    { version: 1, mode: 'all', total: 400, answered: 2, checked: 3, correct: 3, wrong: 0, bookmarked: 0 }]) {
    const view = overview(value);
    assert.equal(view.nodes['[data-overview=correct]'].textContent, '—');
    assert.equal(view.nodes['[data-overview-continue]'].href, 'lernen.html');
  }
});

test('Der Überblick zeigt nur den zuletzt verwendeten Katalog und reagiert auf gelöschten Speicher', () => {
  const view = overview({ version: 1, mode: 'all', total: 400, answered: 10, checked: 8, correct: 6, wrong: 2, bookmarked: 3 });
  assert.equal(view.nodes['[data-overview=answered]'].textContent, '10 / 400');
  assert.equal(view.nodes['[data-overview-continue]'].href, 'lernen.html?mode=all');
  assert.match(view.nodes['[data-overview-note]'].textContent, /75 %/);
  view.clear();
  assert.equal(view.nodes['[data-overview=correct]'].textContent, '—');
});

test('Die beworbenen Katalog- und Testgrößen entsprechen den tatsächlichen Profilen', () => {
  const env = setup();
  const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
  const cards = [...html.matchAll(/data-catalogue-mode="([^"]+)" data-question-count="(\d+)"/g)];
  assert.equal(cards.length, Object.values(env.trainer.profiles).filter(profile => profile.key).length);
  for (const [, mode, count] of cards) {
    assert.equal(Number(count), env.scope.LHUNDG_DATA[env.trainer.profiles[mode].pool].length);
  }
  const tests = [...html.matchAll(/href="lernen.html\?mode=([^"]+)"><strong>(\d+)<\/strong>/g)];
  assert.equal(tests.length, 4);
  for (const [, mode, count] of tests) assert.equal(Number(count), env.trainer.profiles[mode].examCount);
  assert(!html.includes('scripts/learning/data.js'));
});
