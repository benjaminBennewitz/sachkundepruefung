/* scripts/quality/review.test.cjs */

/**
 * @file Regressionen der dynamischen Fehlersammlung und frischen Wiederholung.
 * @description Prüft echte Filter, Renderer, Bewertung und Speicherung mit einem kleinen DOM-Ersatz.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fixtures = require('./learning-fixtures.cjs');

/** Minimales DOM für die vorhandenen Karten, ohne Layout- oder Browseraussagen abzuleiten. */
class Node {
  /** @param {string} tag Elementname. */
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.className = '';
    this.attributes = {};
    this.hidden = false;
    this.value = '';
    this.checked = false;
    this.events = {};
    this.textContent = '';
    this.classList = {
      contains: name => this.className.split(' ').includes(name),
      toggle: (name, value) => {
        const classes = new Set(this.className.split(' ').filter(Boolean));
        if (value) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' ');
      }
    };
  }
  /** @returns {Node|undefined} Erstes Kindelement. */
  get firstElementChild() { return this.children[0]; }
  /** @param {...(Node|string)} nodes Elemente oder wie im Browser in Textknoten umzuwandelnde Zeichenfolgen. */
  append(...nodes) {
    for (const node of nodes) {
      const child = typeof node === 'string' ? new Node('#text') : node;
      if (typeof node === 'string') child.textContent = node;
      child.parent = this;
      this.children.push(child);
    }
  }
  /** @param {string} name Attribut. @param {string} value Wert. */
  setAttribute(name, value) { this.attributes[name] = value; }
  /** @param {string} name Attribut. */
  removeAttribute(name) { delete this.attributes[name]; }
  /** @param {string} name Ereignis. @param {Function} action Behandlung. */
  addEventListener(name, action) { this.events[name] = action; }
  /** @param {string} selector Einzelklasse oder Elementname. @returns {boolean} Treffer. */
  matches(selector) { return selector.startsWith('.') ? this.classList.contains(selector.slice(1)) : this.tag === selector; }
  /** @param {string} selector Einzelklasse oder Elementname. @returns {Node[]} Nachfahren. */
  querySelectorAll(selector) {
    return this.children.flatMap(node => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]);
  }
  /** @param {string} selector Einzelklasse oder Elementname. @returns {Node|undefined} Erster Nachfahr. */
  querySelector(selector) { return this.querySelectorAll(selector)[0]; }
  /** @param {string} selector Klasse. @returns {Node|undefined} Passender Vorfahr. */
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
  /** Merkt den gezielt gesetzten Fokus. */
  focus() { this.focused = true; }
  /** Entfernt dieses Element aus seinem Elternknoten. */
  remove() { this.parent.children = this.parent.children.filter(node => node !== this); }
}

/** @param {string} [mode] Katalog oder Prüfung. @returns {object} Echte Module und isolierte Oberfläche. */
function setup(mode = '') {
  const env = fixtures.environment(['data', 'essen', 'sources', 'core', 'profiles', 'dom', 'session',
    'explanations', 'question-feedback', 'question-view', 'filter-view', 'review', 'controller', 'learning-view']);
  const controls = new Map();
  env.scope.clearTimeout = clearTimeout;
  env.scope.document = { createElement: tag => new Node(tag), createElementNS: (_, tag) => new Node(tag), createDocumentFragment: () => new Node('fragment'),
    getElementById: id => { if (!controls.has(id)) controls.set(id, new Node('div')); return controls.get(id); } };
  const session = fixtures.session(env, mode);
  const view = { session, state: session.state, dom: env.trainer.dom, navButtons: new Map(), pageSize: () => 1,
    render() { this.review.update(); }, updateOverview() {},
    applyFilters(options) { this.filters.apply(options); } };
  view.updateFeedbackToggle = () => env.trainer.LearningView.prototype.updateFeedbackToggle.call(view);
  view.cards = new env.trainer.QuestionView(session, () => {});
  view.filters = new env.trainer.FilterView(session, view);
  view.review = new env.trainer.Review(session, view);
  return { ...env, session, view, review: view.review, get: env.trainer.dom.get };
}

/** @param {object} env Umgebung. @param {number} index Frageposition. @param {string[]} values Auswahl. @returns {object} Frage. */
function checkedAnswer(env, index, values) {
  const question = env.session.questions[index];
  env.session.state.answers.set(question.id, new Set(values));
  env.session.state.checked.set(question.id, env.session.signature(question));
  return question;
}

/** @param {object} env Umgebung. @param {object} question Frage. @param {string[]} values Neuer Entwurf. */
function draft(env, question, values) {
  env.review.practice.state.answers.set(question.id, new Set(values));
  env.review.practice.state.checked.delete(question.id);
  env.review.practice.persist();
}

test('Meine Fehler enthält nur vollständige, gültig falsch geprüfte Antworten und keine offenen Fragen', () => {
  const env = setup();
  const wrong = checkedAnswer(env, 1, ['A']);
  checkedAnswer(env, 3, ['B']);
  env.session.state.answers.set(env.session.questions[0].id, new Set(['A']));
  const mapping = env.session.questions.find(question => question.type === 'mapping');
  env.session.state.answers.set(mapping.id, new Set([mapping.correct[0]]));
  env.session.state.checked.set(mapping.id, env.session.signature(mapping));
  assert.deepEqual(Array.from(env.review.errors(), question => question.id), [wrong.id]);
  env.session.state.answers.set(wrong.id, new Set(['C']));
  assert.equal(env.review.errors().length, 0);
});

test('Neue Runde zeigt echte Karten ohne Vorauswahl, Fehlerfarben und sichtbare Erklärungen', () => {
  const env = setup();
  const question = checkedAnswer(env, 1, ['A']);
  env.review.start();
  const card = env.review.cards.render(question);
  assert(card.querySelectorAll('input').every(input => !input.checked));
  assert.equal(card.classList.contains('wrong'), false);
  assert.equal(card.querySelector('.status-pill').textContent, '○ Offen');
  assert.equal(card.querySelector('.feedback').hidden, true);
  assert.equal(card.querySelector('.question-explanation').hidden, true);
  assert.deepEqual(Array.from(env.session.state.answers.get(question.id)), ['A']);
});

test('Erst Prüfen ersetzt den Originalstand; Erfolg reduziert die Sammlung, aber nie die laufende Folge', () => {
  const env = setup();
  const first = checkedAnswer(env, 1, ['A']);
  const second = checkedAnswer(env, 3, ['A']);
  env.session.persist();
  env.review.start();
  draft(env, first, ['B']);
  assert.deepEqual(Array.from(env.session.state.answers.get(first.id)), ['A']);
  const before = new env.trainer.Session(new URLSearchParams('mode=all'));
  assert.deepEqual(Array.from(before.state.answers.get(first.id)), ['A']);
  const card = env.review.cards.render(first);
  env.review.cards.check(first, card);
  assert.equal(card.querySelector('.feedback').hidden, false);
  assert.equal(card.querySelector('.question-explanation').hidden, false);
  assert.deepEqual(Array.from(env.session.state.answers.get(first.id)), ['B']);
  assert.deepEqual(Array.from(env.review.errors(), question => question.id), [second.id]);
  env.view.applyFilters();
  assert.deepEqual(Array.from(env.session.state.items, question => question.id), [first.id, second.id]);
  assert.equal(env.review.score().correct, 1);
  const restored = new env.trainer.Session(new URLSearchParams('mode=all'));
  assert.deepEqual(Array.from(restored.state.answers.get(first.id)), ['B']);
  assert.equal(restored.state.checked.has(first.id), true);
});

test('Abbrechen verwirft ungeprüfte Entwürfe, erhält aber bereits geprüfte Erfolge und Merker', () => {
  const env = setup();
  const first = checkedAnswer(env, 1, ['A']);
  const second = checkedAnswer(env, 3, ['A']);
  env.review.start();
  draft(env, first, ['B']);
  env.review.cards.check(first, env.review.cards.render(first));
  draft(env, second, ['B']);
  env.review.practice.state.bookmarks.add(second.id);
  env.review.practice.persist();
  env.review.finish();
  assert.equal(env.review.active, false);
  assert.deepEqual(Array.from(env.session.state.answers.get(first.id)), ['B']);
  assert.deepEqual(Array.from(env.session.state.answers.get(second.id)), ['A']);
  assert(env.session.state.bookmarks.has(second.id));
  assert.equal(env.session.state.items.length, 1);
  assert.match(env.messages.at(-1)[0], /1 von 2/);
});

test('Erneute falsche Bewertung bleibt im Fehlerbestand', () => {
  const env = setup();
  const question = checkedAnswer(env, 1, ['A']);
  env.review.start();
  draft(env, question, ['C']);
  env.review.cards.check(question, env.review.cards.render(question));
  assert.equal(env.review.errors().length, 1);
  assert.equal(env.review.score().correct, 0);
  assert.deepEqual(Array.from(env.session.state.answers.get(question.id)), ['C']);
});

test('Prüfungen starten keine Runde und Katalogwechsel erhalten getrennte Fehlerbestände', () => {
  const exam = setup('mode=exam34');
  checkedAnswer(exam, 0, ['unbekannt']);
  exam.review.start();
  assert.equal(exam.review.active, false);
  const env = setup();
  checkedAnswer(env, 1, ['A']);
  env.session.persist();
  const other = new env.trainer.Session(new URLSearchParams('mode=rhein97'));
  assert.equal(other.state.checked.size, 0);
  assert.equal(other.state.answers.size, 0);
});


test('Eine unvollständige Zuordnung überschreibt den alten Stand auch bei gesetztem Prüfmarker nicht', () => {
  const env = setup();
  const question = env.session.questions.find(item => item.type === 'mapping');
  const wrong = Array.from(question.correct);
  const [key, target] = wrong[0].split(':');
  wrong[0] = `${key}:${question.mappingChoices.find(value => value !== target)}`;
  env.session.state.answers.set(question.id, new Set(wrong));
  env.session.state.checked.set(question.id, env.session.signature(question));
  env.review.start();
  draft(env, question, [question.correct[0]]);
  env.review.practice.state.checked.set(question.id, env.review.practice.signature(question));
  env.review.practice.persist();
  assert.deepEqual(Array.from(env.session.state.answers.get(question.id)), wrong);
  draft(env, question, Array.from(question.correct));
  env.review.cards.check(question, env.review.cards.render(question));
  assert.equal(env.review.errors().length, 0);
  assert.equal(env.session.state.items.length, 1);
});

test('Eine neue Runde nimmt nur die jetzt verbleibenden Fehler auf; Filterwechsel verwirft Entwürfe', () => {
  const env = setup();
  const first = checkedAnswer(env, 1, ['A']);
  const second = checkedAnswer(env, 3, ['A']);
  env.review.start();
  draft(env, first, ['B']);
  env.review.cards.check(first, env.review.cards.render(first));
  env.review.finish();
  env.review.start();
  assert.deepEqual(Array.from(env.review.questions, question => question.id), [second.id]);
  draft(env, second, ['B']);
  env.view.filters.setFilter('category', 'all');
  assert.equal(env.review.active, false);
  assert.deepEqual(Array.from(env.session.state.answers.get(second.id)), ['A']);
});


test('Die Fußaktion wertet verdeckte Versuche aus und beendet erst danach die Wiederholung', () => {
  const env = setup();
  const question = checkedAnswer(env, 1, ['A']);
  env.session.state.instant = false;
  env.review.start();
  draft(env, question, ['B']);
  env.review.update();
  assert.equal(env.get('evaluate').textContent, 'Runde auswerten');
  assert.equal(env.get('instantFeedback').attributes['aria-pressed'], 'false');
  assert.equal(env.get('instantFeedback').disabled, false);
  assert.equal(env.review.cards.render(question).querySelector('.question-check').hidden, true);
  assert.deepEqual(Array.from(env.session.state.answers.get(question.id)), ['A']);
  const controller = Object.create(env.trainer.Controller.prototype);
  controller.dom = env.trainer.dom;
  controller.view = env.view;
  controller.results = { evaluate() { throw Error('Keine Katalogauswertung während der Runde'); } };
  controller.progress = {};
  controller.bindTools();
  env.get('evaluate').events.click();
  assert.equal(env.review.active, true);
  assert.deepEqual(Array.from(env.session.state.answers.get(question.id)), ['B']);
  const graded = env.review.cards.render(question);
  assert.equal(graded.querySelector('.feedback').hidden, false);
  assert.equal(graded.querySelector('.question-explanation').hidden, false);
  assert.equal(env.get('evaluate').textContent, 'Runde abschließen');
  env.get('evaluate').events.click();
  assert.equal(env.review.active, false);
  assert.equal(env.get('evaluate').textContent, 'Katalog auswerten');
  assert.equal(env.session.state.instant, false);
});

test('Meine Fehler öffnet zuerst zwei Optionen ohne Fragenkarten und mit gezieltem Fokus', () => {
  const env = setup();
  const question = checkedAnswer(env, 1, ['A']);
  env.review.bind();
  env.get('showErrors').events.click();
  assert.equal(env.review.choosing, true);
  assert.equal(env.get('errorCollectionChoices').hidden, false);
  assert.equal(env.get('questions').hidden, true);
  assert.equal(env.get('errorCollectionTitle').focused, true);
  const content = env.trainer.LearningView.prototype.createQuestionPage.call(env.view);
  assert.equal(content.children.length, 0);
  env.get('viewErrorAnswers').events.click();
  assert.equal(env.review.choosing, false);
  assert.equal(env.get('questions').hidden, false);
  assert.equal(env.get('errorCollectionChoices').hidden, true);
  const viewed = env.view.cards.render(question);
  assert.equal(viewed.querySelector('.feedback').hidden, false);
  assert.equal(viewed.querySelector('.question-explanation').hidden, false);
});

test('Der gewohnte Feedbackschalter bleibt auch während der Runde wirksam', () => {
  const env = setup();
  const question = checkedAnswer(env, 1, ['A']);
  env.review.start();
  env.trainer.LearningView.prototype.toggleFeedback.call(env.view);
  assert.equal(env.session.state.instant, false);
  assert.equal(env.review.practice.state.instant, false);
  assert.equal(env.review.cards.render(question).querySelector('.question-check').hidden, true);
  env.trainer.LearningView.prototype.toggleFeedback.call(env.view);
  assert.equal(env.session.state.instant, true);
  assert.equal(env.review.practice.state.instant, true);
  assert.equal(env.review.cards.render(question).querySelector('.question-check').hidden, false);
});

test('Auswahl ändern verwirft Entwürfe; eine leere Sammlung bietet keine wirkungslose Übung an', () => {
  const env = setup();
  const question = checkedAnswer(env, 1, ['A']);
  env.review.start();
  draft(env, question, ['B']);
  env.review.open();
  assert.equal(env.review.active, false);
  assert.equal(env.review.choosing, true);
  assert.deepEqual(Array.from(env.session.state.answers.get(question.id)), ['A']);
  env.session.state.answers.set(question.id, new Set(['B']));
  env.session.state.checked.set(question.id, env.session.signature(question));
  env.review.update();
  assert.equal(env.get('startErrorReview').disabled, true);
  assert.equal(env.get('viewErrorAnswers').disabled, true);
});


test('Nur Zuordnungsfragen mit Bild erhalten die fixierbare Bildansicht', () => {
  const env = setup();
  for (const uid of ['r97-13', 'r97-88', 'r97-92', 'koeln-a2', 'koeln-a3', 'r97-8', 'legacy-6', 'legacy-2']) {
    const question = env.scope.LHUNDG_QUESTIONS.find(item => item.uid === uid);
    const card = env.view.cards.render(question);
    assert.equal(card.classList.contains('question-card--mapping-visual'),
      question.type === 'mapping' && question.requiresVisual, uid);
  }
});


test('Alle Testprofile bieten auf der letzten Frage die aktive Auswertung statt Weiter', () => {
  for (const mode of ['exam34', 'mgexam', 'exam11', 'essenexam']) {
    const env = setup(`mode=${mode}`);
    const { state, questions } = env.session;
    state.items = questions;
    for (const pageSize of [1, 8]) {
      env.view.pageSize = () => pageSize;
      state.index = Math.floor((questions.length - 1) / pageSize) * pageSize;
      env.view.filters.updatePagination();
      assert.equal(env.get('next').textContent, 'Test auswerten', mode);
      assert.equal(env.get('next').disabled, false, mode);
      state.index = 0;
      env.view.filters.updatePagination();
      assert.equal(env.get('next').textContent, 'Weiter →', mode);
    }
  }
});

test('Abgeschlossene Tests, Kataloge und bloße Filterenden bleiben normale Navigation', () => {
  for (const mode of ['', 'mode=exam34']) {
    const env = setup(mode);
    const { state, questions } = env.session;
    state.items = questions.slice(0, 2);
    state.index = 1;
    assert.equal(env.view.filters.canCompleteExam(), false);
    state.items = questions;
    state.index = questions.length - 1;
    state.finished = true;
    env.view.filters.updatePagination();
    assert.equal(env.get('next').textContent, 'Weiter →');
    assert.equal(env.get('next').disabled, true);
  }
});

test('Weiter auf der letzten Testfrage ruft die bestehende Gesamtauswertung auf', () => {
  const env = setup('mode=exam34');
  const calls = [];
  env.view.step = direction => calls.push(['step', direction]);
  const controller = Object.create(env.trainer.Controller.prototype);
  Object.assign(controller, { session: env.session, view: env.view, dom: env.trainer.dom,
    results: { evaluate: intermediate => calls.push(['evaluate', intermediate]) } });
  controller.bindNavigation();
  env.session.state.items = env.session.questions;
  env.session.state.index = 0;
  env.get('next').events.click();
  env.session.state.index = env.session.questions.length - 1;
  env.get('next').events.click();
  assert.deepEqual(calls, [['step', 1], ['evaluate', false]]);
});
