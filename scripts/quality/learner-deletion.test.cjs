/* scripts/quality/learner-deletion.test.cjs */

/**
 * @file Entfernen von Personenprofilen und Schutz vorhandener Lernstände.
 * @description Prüft Löschumfang, Rücknahme bei Speicherfehlern und gelöschte Personen in anderen Tabs.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const { environment, session, save, plain } = require('./learning-fixtures.cjs');
const source = readFileSync(resolve(__dirname, '../ui/learner-state.js'), 'utf8');

/** @param {object} env Browserkontext. @returns {object} Echte Profilverwaltung. */
function load(env) {
  let sequence = 0;
  env.scope.crypto = { randomUUID: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` };
  vm.runInContext(source, env.context);
  return env.scope.LHUNDG_LEARNERS;
}

test('Keine automatische Standardperson; das erste benannte Profil erhält vorhandene Antworten', () => {
  const env = environment();
  save(env.scope.localStorage, 'lhundg-learners-v1', { version: 1,
    people: [{ id: 'standard', name: 'Standard', goal: 'open' }] });
  save(env.scope.localStorage, 'lhundg-answers-all-v1', { 1: ['A'] });
  const people = load(env);
  assert.deepEqual(plain(people.list()), []);
  assert.equal(people.current().name, 'Dein Lernstand');
  const ben = people.save('Ben', 'para3');
  assert.equal(ben.id, 'standard');
  assert.equal(people.list().length, 1);
  assert.equal(people.list()[0].name, 'Ben');
  assert.deepEqual([...session(env).state.answers.get(1)], ['A']);
  assert.equal(people.legacyAvailable(), false);
});

test('Ein alter unbenannter Stand bleibt bei bestehenden Personen ausdrücklich übernehmbar', () => {
  const env = environment();
  save(env.scope.localStorage, 'lhundg-learners-v1', { version: 1, people: [
    { id: 'standard', name: 'Standard', goal: 'open' },
    { id: 'p-existing-person', name: 'Ben', goal: 'para3' }
  ] });
  save(env.scope.localStorage, 'lhundg-answers-all-v1', { 1: ['A'] });
  const people = load(env);
  assert.equal(people.list().length, 1);
  assert.equal(people.current().name, 'Ben');
  assert.equal(people.legacyAvailable(), true);
  const fresh = people.save('Nadin', 'para11');
  assert.notEqual(fresh.id, 'standard');
  people.select(fresh.id);
  assert.equal(session(env).state.answers.size, 0);
  const inherited = people.save('Alter Lernstand', 'open', undefined, true);
  people.select(inherited.id);
  assert.deepEqual([...session(env).state.answers.get(1)], ['A']);
  assert.equal(people.list().length, 3);
});

test('Löschen der ersten Person entfernt ihre alten Lernschlüssel und schützt gemeinsame Einstellungen', () => {
  const env = environment();
  const people = load(env);
  people.save('Ben', 'para3');
  const first = session(env);
  first.state.answers.set(1, new Set(['A']));
  first.persist();
  save(env.scope.localStorage, 'lhundg-overview-v1', { answered: 1 });
  save(env.scope.localStorage, 'lhundg-theme-v1', 'dark');
  save(env.scope.localStorage, 'lhundg-accessibility-v1', { zoom: 125 });
  save(env.scope.localStorage, 'lhundg-release-seen', '2026.11.17.2');
  save(env.scope.sessionStorage, 'lhundg-exam-meta-v2:1-2', { finished: true });
  people.remove('standard');
  assert.equal(people.list().length, 0);
  assert.equal(env.scope.localStorage.getItem('lhundg-answers-all-v1'), null);
  assert.equal(env.scope.localStorage.getItem('lhundg-overview-v1'), null);
  assert.equal(env.scope.sessionStorage.getItem('lhundg-exam-meta-v2:1-2'), null);
  assert.equal(JSON.parse(env.scope.localStorage.getItem('lhundg-theme-v1')), 'dark');
  assert(env.scope.localStorage.getItem('lhundg-accessibility-v1'));
  assert(env.scope.localStorage.getItem('lhundg-release-seen'));
  first.persist();
  assert.equal(env.scope.localStorage.getItem('lhundg-answers-all-v1'), null);
});

test('Löschen einer weiteren Person berührt weder Antworten noch Tests anderer Personen', () => {
  const env = environment();
  const people = load(env);
  people.save('Ben', 'para3');
  const first = session(env);
  first.state.answers.set(1, new Set(['A']));
  first.persist();
  const nadin = people.save('Nadin', 'para11');
  people.select(nadin.id);
  const second = session(env);
  second.state.answers.set(1, new Set(['B']));
  second.persist();
  save(env.scope.sessionStorage, people.key('lhundg-exam34-v1:1-2', nadin.id), { 1: ['B'] });
  save(env.scope.sessionStorage, 'lhundg-exam34-v1:1-2', { 1: ['A'] });
  people.remove(nadin.id);
  assert.equal(people.current().name, 'Ben');
  assert.deepEqual([...session(env).state.answers.get(1)], ['A']);
  assert.equal(env.scope.localStorage.getItem(people.key('lhundg-answers-all-v1', nadin.id)), null);
  assert.equal(env.scope.sessionStorage.getItem(people.key('lhundg-exam34-v1:1-2', nadin.id)), null);
  assert(env.scope.sessionStorage.getItem('lhundg-exam34-v1:1-2'));
});

test('Ein Löschfehler stellt die vorherigen Daten wieder her und meldet keinen Erfolg', () => {
  const env = environment();
  const people = load(env);
  people.save('Ben', 'para3');
  const current = session(env);
  current.state.answers.set(1, new Set(['A']));
  current.persist();
  save(env.scope.sessionStorage, 'lhundg-exam34-v1:1-2', { 1: ['A'] });
  const before = [...env.scope.localStorage.values.entries()].sort();
  env.scope.sessionStorage.removeItem = () => { throw new Error('blocked'); };
  assert.throws(() => people.remove('standard'), /nicht vollständig gelöscht/);
  assert.deepEqual([...env.scope.localStorage.values.entries()].sort(), before);
  assert.equal(people.current().name, 'Ben');
  assert.deepEqual([...session(env).state.answers.get(1)], ['A']);
});

test('Andere Tabs entfernen ihre Teststände und schreiben gelöschte Personen nicht erneut', () => {
  const first = environment();
  const people = load(first);
  people.save('Ben', 'para3');
  const nadin = people.save('Nadin', 'para11');
  const other = environment();
  other.scope.localStorage = first.scope.localStorage;
  const events = {};
  const deleted = [];
  other.scope.addEventListener = (name, fn) => { events[name] = fn; };
  other.scope.CustomEvent = class CustomEvent { constructor(type, values) { this.type = type; this.detail = values.detail; } };
  other.scope.dispatchEvent = event => deleted.push(event.detail.id);
  const otherPeople = load(other);
  const stale = session(other);
  save(other.scope.sessionStorage, 'lhundg-exam34-v1:1-2', { 1: ['A'] });
  save(other.scope.sessionStorage, otherPeople.key('lhundg-exam34-v1:1-2', nadin.id), { 1: ['B'] });
  people.remove('standard');
  events.storage({ key: 'lhundg-learners-v1' });
  assert.equal(other.scope.sessionStorage.getItem('lhundg-exam34-v1:1-2'), null);
  assert(other.scope.sessionStorage.getItem(otherPeople.key('lhundg-exam34-v1:1-2', nadin.id)));
  assert.equal(otherPeople.current().name, 'Nadin');
  assert.deepEqual(deleted, ['standard']);
  stale.persist();
  assert.equal(other.scope.localStorage.getItem('lhundg-answers-all-v1'), null);
});

test('Eine veraltete Sitzung überschreibt auch ein später neu angelegtes erstes Profil nicht', () => {
  const env = environment();
  const people = load(env);
  people.save('Ben', 'para3');
  const stale = session(env);
  stale.state.answers.set(1, new Set(['A']));
  stale.persist();
  people.remove('standard');
  people.save('Nadin', 'para11');
  const fresh = session(env);
  fresh.state.answers.set(1, new Set(['B']));
  fresh.persist();
  stale.persist();
  assert.deepEqual([...session(env).state.answers.get(1)], ['B']);
});
