/* scripts/quality/learners.test.cjs */

/**
 * @file Personenbezogene Speicherung und Erhalt bestehender Lernstände.
 * @description Prüft echte Module mit getrennten Katalogen, Tests, Importen und Browser-Tabs.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const { environment, session, save, plain } = require('./learning-fixtures.cjs');
const source = readFileSync(resolve(__dirname, '../ui/learner-state.js'), 'utf8');

/** @param {object} env Testumgebung. @returns {object} Echtes Personenmodul. */
function loadPeople(env) {
  let sequence = 0;
  env.scope.crypto = { randomUUID: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}` };
  vm.runInContext(source, env.context);
  return env.scope.LHUNDG_LEARNERS;
}

/** @returns {object} Gemeinsam geladene Lern- und Personenmodule. */
function setup() {
  const env = environment();
  env.people = loadPeople(env);
  env.people.save('Erste Person', 'open');
  return env;
}

test('Vorhandene Antworten, Merker und Bewertungen bleiben beim Benennen ohne Kopie erhalten', () => {
  const env = setup();
  save(env.scope.localStorage, 'lhundg-answers-all-v1', { 1: ['A'] });
  save(env.scope.localStorage, 'lhundg-meta-all-v2', { bookmarks: [1], checked: { 1: 'A' } });
  const current = session(env);
  assert.equal(current.learnerId, 'standard');
  assert.equal(current.storageKey(current.answerKey), current.answerKey);
  assert.deepEqual([...current.state.answers.get(1)], ['A']);
  assert(current.state.bookmarks.has(1));
  assert.equal(current.state.checked.get(1), 'A');
  assert.equal(env.people.chosen(), false);
});

test('Neue Personen übernehmen keine alten Antworten; Antworten und Merker werden getrennt wiederhergestellt', () => {
  const env = setup();
  save(env.scope.localStorage, 'lhundg-answers-mg-v1', { 1: ['A'] });
  const person = env.people.save('Nadin', 'para3');
  env.people.select(person.id);
  const current = session(env);
  assert.equal(current.state.answers.size, 0);
  current.state.answers.set(1, new Set(['B']));
  current.state.bookmarks.add(1);
  current.persist();
  env.people.select('standard');
  assert.deepEqual([...session(env).state.answers.get(1)], ['A']);
  assert.equal(session(env).state.bookmarks.size, 0);
  env.people.select(person.id);
  assert.deepEqual([...session(env).state.answers.get(1)], ['B']);
  assert(session(env).state.bookmarks.has(1));
});

test('Eine laufende Sitzung bleibt nach Profilwechsel an ihre ursprüngliche Person gebunden', () => {
  const env = setup();
  const first = session(env);
  env.people.select(env.people.save('Ben', 'para11').id);
  first.state.answers.set(1, new Set(['A']));
  first.persist();
  assert.equal(session(env).state.answers.size, 0);
  env.people.select('standard');
  assert.deepEqual([...session(env).state.answers.get(1)], ['A']);
});

test('Dieselbe Testfolge hat je Person getrennte Antworten und Abschlusszustände im Sitzungsspeicher', () => {
  const env = setup();
  const first = session(env, 'mode=exam34');
  const query = 'mode=exam34&ids=' + first.questions.map(q => q.id).join(',');
  first.state.answers.set(first.questions[0].id, new Set(['A']));
  first.state.finished = true;
  first.persist();
  env.people.select(env.people.save('Zweite Person', 'para3').id);
  const fresh = session(env, query);
  assert.equal(fresh.state.answers.size, 0);
  assert.equal(fresh.state.finished, false);
  assert.equal(fresh.kind, 'sessionStorage');
  env.people.select('standard');
  assert.equal(session(env, query).state.finished, true);
});

test('Alte Importdateien ergänzen nur das aktive Personenprofil und lassen andere Personen unverändert', () => {
  const env = setup();
  const first = session(env, 'mode=legacy203');
  first.state.answers.set(1, new Set(['A']));
  first.persist();
  env.people.select(env.people.save('Nadin', 'para3').id);
  const current = session(env, 'mode=legacy203');
  const progress = new env.trainer.Progress(current, {});
  const imported = { format: 'lhundg-learning', version: 1,
    catalogues: { legacy203: { answers: { 1: ['B'] }, bookmarks: [2] } } };
  progress.validateFormat(imported);
  for (const update of progress.collectUpdates(imported)) progress.merge(update);
  assert.deepEqual([...current.state.answers.get(1)], ['B']);
  assert(current.state.bookmarks.has(2));
  env.people.select('standard');
  assert.deepEqual([...session(env, 'mode=legacy203').state.answers.get(1)], ['A']);
});

test('Sicherungen sammeln ausschließlich Katalogstände der aktiven Person', () => {
  const env = setup();
  const first = session(env);
  first.state.answers.set(1, new Set(['A']));
  first.persist();
  env.people.select(env.people.save('Ben', 'para11').id);
  const current = session(env);
  const data = new env.trainer.Progress(current, {}).collectCatalogues();
  assert.deepEqual(plain(data.all.answers), {});
  assert.equal(Object.keys(data).length, 6);
});

test('Umbenennen und Lernzielwechsel erhalten Kennung, Lernstand und alle Kataloge', () => {
  const env = setup();
  const person = env.people.save('Ben', 'open');
  env.people.select(person.id);
  const current = session(env);
  current.state.answers.set(1, new Set(['A']));
  current.persist();
  assert.equal(env.people.save('B²', 'para3', person.id).id, person.id);
  assert.equal(env.people.current().name, 'B²');
  assert.deepEqual([...session(env).state.answers.get(1)], ['A']);
  assert.equal(session(env, 'mode=kammer197').questions.length, 197);
});

test('Ungültige Namen, doppelte Namen, fremde Lernziele und Schlüssel werden abgewiesen', () => {
  const env = setup();
  env.people.save('Ben', 'para3');
  for (const name of ['', '  ', 'x'.repeat(33), ' ben ']) assert.throws(() => env.people.save(name, 'open'));
  assert.throws(() => env.people.save('Nadin', 'invented'));
  assert.throws(() => env.people.key('answers', '../../other'));
  assert.throws(() => env.people.select('other'));
});

test('Speichersperren verhindern keine Standardsitzung und erzeugen kein scheinbar gespeichertes Profil', () => {
  const env = setup();
  env.scope.localStorage.setItem = () => { throw new Error('quota'); };
  env.scope.sessionStorage.setItem = () => { throw new Error('blocked'); };
  assert.throws(() => env.people.save('Ben', 'para3'), /nicht gespeichert/);
  assert.equal(env.people.select('standard'), false);
  const current = session(env);
  current.state.answers.set(1, new Set(['A']));
  current.persist();
  assert.equal(current.state.answers.size, 1);
  assert.equal(env.people.list().length, 1);
});

test('Offene Tabs behalten ihre Person, während neue Tabs die letzte Wahl anbieten', () => {
  const env = setup();
  const person = env.people.save('Ben', 'para11');
  const second = environment();
  second.scope.localStorage = env.scope.localStorage;
  const secondPeople = loadPeople(second);
  env.people.select(person.id);
  assert.equal(secondPeople.current().id, 'standard');
  vm.runInContext(source, second.context);
  assert.equal(second.scope.LHUNDG_LEARNERS.current().id, 'standard');
  const third = environment();
  third.scope.localStorage = env.scope.localStorage;
  assert.equal(loadPeople(third).current().id, person.id);
});

test('Manipulierte Registry erzeugt weder fremde Schlüssel noch doppelte Personen', () => {
  const env = environment();
  save(env.scope.localStorage, 'lhundg-learners-v1', { version: 1, people: [
    { id: '../../secret', name: 'Fremd', goal: 'open' },
    { id: 'standard', name: 'Standard', goal: 'open' },
    { id: 'standard', name: 'Duplikat', goal: 'para3' }
  ] });
  assert.deepEqual(plain(loadPeople(env).list()), []);
});

/** Kleiner DOM-Ersatz für die echten Profil- und Vergleichsmodule. */
class Element {
  constructor(tag, text = '', className = '') {
    Object.assign(this, { tag, textContent: text, className, children: [], dataset: {}, handlers: {}, attributes: {} });
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(name, callback) { this.handlers[name] = callback; }
  focus() {}
}

/** @param {Element} node Baum. @param {string} tag Elementname. @returns {Element} Erstes Element. */
function find(node, tag) {
  if (node.tag === tag) return node;
  for (const child of node.children) {
    const match = find(child, tag);
    if (match) return match;
  }
}

test('Erste Profilanlage beendet die Auswahl vor dem Start der eigentlichen Lernsitzung', async () => {
  const env = setup();
  const trigger = new Element('button');
  const events = {};
  env.scope.Event = class Event { constructor(type) { this.type = type; } };
  env.scope.dispatchEvent = event => { events[event.type] = true; };
  env.scope.addEventListener = () => {};
  env.scope.document = { body: { classList: { contains: () => true } },
    querySelectorAll: () => [], querySelector: () => trigger, createTextNode: text => new Element('text', text), addEventListener() {} };
  const ui = env.scope.LHUNDG_UI_PARTS = { node: (tag, text, className) => new Element(tag, text, className) };
  vm.runInContext(readFileSync(resolve(__dirname, '../ui/learner-panel.js'), 'utf8'), env.context);
  let options, close;
  const modal = { open(value) { options = value; return new Promise(resolve => { close = resolve; }); },
    dialog: { close: value => close(value) } };
  const ready = ui.bindLearners(modal);
  const form = find(options.content, 'form');
  find(form, 'input').value = 'Ben';
  find(form, 'select').value = 'para3';
  form.handlers.submit({ preventDefault() {} });
  await ready;
  assert.equal(env.people.current().name, 'Ben');
  assert.notEqual(session(env).learnerId, 'standard');
  assert.equal(events['lhundg:profile-change'], true);
  assert.equal(options.closeButton, true);
});

test('Profilvergleich zeigt echte katalogbezogene Zähler und unbekannte Werte ohne erfundene Erfolge', () => {
  const env = setup();
  const person = env.people.save('Nadin', 'para11');
  save(env.scope.localStorage, 'lhundg-overview-v1', { version: 1, mode: 'all', total: 400,
    answered: 10, checked: 8, correct: 6, wrong: 2, bookmarked: 3 });
  const values = {};
  const grid = new Element('div');
  const section = {};
  grid.closest = () => section;
  const card = { dataset: { catalogueMode: 'all', questionCount: '400' },
    querySelector: selector => selector === 'h3' ? { textContent: 'Alle Quellen' } :
      { getAttribute: () => 'lernen.html?mode=all' } };
  const root = { querySelector: selector => values[selector] ||= {} };
  const listeners = {};
  Object.assign(env.scope, { document: { getElementById: () => root, querySelectorAll: () => [card],
    querySelector: () => grid, createElement: tag => new Element(tag) },
    addEventListener: (name, fn) => { listeners[name] = fn; } });
  vm.runInContext(readFileSync(resolve(__dirname, '../ui/learning-overview.js'), 'utf8'), env.context);
  assert.equal(section.hidden, false);
  assert.equal(grid.children.length, 2);
  const first = grid.children[0];
  assert.equal(find(first, 'dd').textContent, '10 / 400');
  assert(first.children.some(node => node.textContent === '8 geprüft · 75 % richtig'));
  assert.equal(find(grid.children[1], 'dd').textContent, '—');
  assert(grid.children[1].children.some(node => node.textContent === 'Noch kein Katalog gelernt'));
  env.people.select(person.id);
  listeners['lhundg:profile-change']();
  assert.equal(values['[data-overview=correct]'].textContent, '—');
  assert.equal(values['[data-overview-continue]'].href, 'lernen.html?mode=kammer197');
  assert.equal(grid.children[1].dataset.active, 'true');
  env.people.remove(person.id);
  listeners['lhundg:profile-change']();
  assert.equal(section.hidden, true);
  assert.equal(grid.children.length, 1);
  env.people.remove('standard');
  listeners['lhundg:profile-change']();
  assert.equal(section.hidden, true);
  assert.equal(grid.children.length, 0);
});

/** @param {boolean[]} answers Antworten auf die zwei Löschbestätigungen. @returns {Promise<object>} Ergebnis des echten Profildialogs. */
async function deleteThroughPanel(answers) {
  const env = setup();
  env.people.select('standard');
  const current = session(env);
  current.state.answers.set(1, new Set(['A']));
  current.persist();
  const trigger = new Element('button');
  const calls = [];
  const confirms = [];
  const handlers = {};
  env.scope.Event = class Event { constructor(type) { this.type = type; } };
  env.scope.dispatchEvent = () => {};
  env.scope.addEventListener = () => {};
  env.scope.location.assign = href => calls.push(href);
  env.scope.LHUNDG_UI.confirm = async options => { confirms.push(options); return answers.shift(); };
  env.scope.document = { body: { classList: { contains: () => true } },
    querySelectorAll: () => [], querySelector: () => trigger,
    createTextNode: text => new Element('text', text),
    addEventListener: (name, fn) => { handlers[name] = fn; } };
  const ui = env.scope.LHUNDG_UI_PARTS = { node: (tag, text, className) => new Element(tag, text, className) };
  vm.runInContext(readFileSync(resolve(__dirname, '../ui/learner-panel.js'), 'utf8'), env.context);
  let options, close;
  const modal = { open(value) { options = value; return new Promise(resolve => { close = resolve; }); },
    dialog: { close: value => close(value) } };
  await ui.bindLearners(modal);
  handlers.click({ preventDefault() {}, target: { closest: selector => selector === '[data-open-learners]' ? trigger : null } });
  const row = options.content.children[0].children[0];
  const button = row.children.find(child => child.textContent === 'Löschen');
  assert.equal(button.attributes['aria-label'], 'Erste Person löschen');
  button.handlers.click();
  await new Promise(resolve => setImmediate(resolve));
  return { env, calls, confirms };
}

test('Abbruch bei jeder der beiden Löschbestätigungen erhält Profil und Lernstand', async () => {
  for (const answers of [[false], [true, false]]) {
    const result = await deleteThroughPanel(answers);
    assert(result.env.people.has('standard'));
    assert.deepEqual([...session(result.env).state.answers.get(1)], ['A']);
    assert.equal(result.calls.length, 0);
    assert(result.confirms.every(options => options.danger === true));
  }
});

test('Erst beide bestätigten Löschdialoge entfernen die aktive Person und verlassen ihren Lernbereich', async () => {
  const result = await deleteThroughPanel([true, true]);
  assert.equal(result.confirms.length, 2);
  assert.equal(result.env.people.has('standard'), false);
  assert.equal(result.calls.length, 1);
  assert.match(result.calls[0], /lernen.html#trainer$/);
});
