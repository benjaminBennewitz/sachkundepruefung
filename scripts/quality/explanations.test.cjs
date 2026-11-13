/* scripts/quality/explanations.test.cjs */

/**
 * @file Sicherheitsgrenzen der ergänzenden Lernhinweise.
 * @description Prüft Freigabe nach Bewertung, Quellbindung und den getrennten Hinweiszustand.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { environment, session } = require('./learning-fixtures.cjs');

/**
 * Lädt echte Lernmodule und die minimal benötigten DOM-Ziele.
 * @param {string} [query] Gewählter Lern- oder Prüfungsmodus.
 * @returns {object} Sitzung, Feedback und zugängliche Kartenfelder.
 */
function setup(query = '') {
  const env = environment(['data', 'essen', 'core', 'profiles', 'session', 'explanations', 'question-feedback', 'foundations']);
  const current = session(env, query);
  const fields = {
    '.status-pill': {}, '.question-check': {}, '.feedback': {},
    '.question-explanation': { hidden: true, open: false }
  };
  const classes = new Set();
  const card = {
    querySelector: name => fields[name],
    classList: { toggle: (name, active) => active ? classes.add(name) : classes.delete(name) }
  };
  return { ...env, current, fields, classes, card, feedback: new env.trainer.QuestionFeedback(current) };
}

test('Erklärungen und Quellenlösung erscheinen erst nach ausdrücklicher Prüfung', () => {
  const env = setup();
  const question = env.current.questions[1];
  env.current.state.answers.set(question.id, new Set(['B']));
  env.feedback.update(question, env.card);
  assert.equal(env.fields['.question-explanation'].hidden, true);
  assert.equal(env.fields['.feedback'].hidden, true);
  env.current.state.checked.set(question.id, env.current.signature(question));
  env.feedback.update(question, env.card);
  assert.equal(env.fields['.question-explanation'].hidden, false);
  assert.equal(env.classes.has('correct'), true);
  assert.equal(env.fields['.feedback'].textContent, 'Richtig!');
});

test('Antwortänderung verwirft und schließt den bisherigen Lernhinweis', () => {
  const env = setup();
  const question = env.current.questions[1];
  env.current.state.answers.set(question.id, new Set(['B', 'C']));
  env.current.state.checked.set(question.id, env.current.signature(question));
  env.feedback.update(question, env.card);
  assert.equal(env.classes.has('wrong'), true);
  assert.match(env.fields['.feedback'].textContent, /Lösung laut Quelle:\nB:/);
  env.fields['.question-explanation'].open = true;
  env.current.state.checked.delete(question.id);
  env.feedback.update(question, env.card);
  assert.equal(env.fields['.question-explanation'].hidden, true);
  assert.equal(env.fields['.question-explanation'].open, false);
});

test('Laufende Tests geben auch bei vorhandenem Bewertungszustand keine Erklärung frei', () => {
  const env = setup('mode=exam34');
  const question = env.current.questions[0];
  env.current.state.answers.set(question.id, new Set(question.correct));
  env.current.state.checked.set(question.id, env.current.signature(question));
  env.feedback.update(question, env.card);
  assert.equal(env.fields['.question-explanation'].hidden, true);
  assert.equal(env.fields['.feedback'].hidden, true);
  env.current.state.finished = true;
  env.feedback.update(question, env.card);
  assert.equal(env.fields['.question-explanation'].hidden, false);
  assert.equal(env.fields['.feedback'].hidden, false);
});

test('Alle Erklärungen sind an vorhandene Original-UIDs gebunden und ändern keine Lösungen', () => {
  const env = setup();
  const before = JSON.stringify(env.scope.LHUNDG_QUESTIONS);
  const entries = Object.entries(env.scope.LHUNDG_EXPLANATIONS);
  assert.equal(entries.length, 66);
  for (const [uid, entry] of entries) {
    const question = env.scope.LHUNDG_QUESTIONS.find(item => item.uid === uid);
    assert.ok(['legacy203', 'rhein97'].includes(question?.sourceKey));
    assert.ok(entry.text.length > 0);
    if (entry.sourceUrl) assert.equal(new URL(entry.sourceUrl).protocol, 'https:');
    for (const reference of entry.references || []) {
      assert.equal(new URL(reference.url).protocol, 'https:');
      assert.ok(reference.label.length > 0);
    }
    env.feedback.feedbackText(question, new Set(question.correct), true);
  }
  assert.equal(env.feedback.createExplanation({ uid: 'unbekannt' }), null);
  assert.equal(JSON.stringify(env.scope.LHUNDG_QUESTIONS), before);
});

test('Problematische Schlüssel werden als Katalogtreffer eingeordnet und verraten im Test keine Lösung', () => {
  const env = setup('mode=exam34');
  const question = env.scope.LHUNDG_QUESTIONS.find(item => item.uid === 'r97-58');
  const selected = new Set(question.correct);
  assert.match(env.feedback.feedbackText(question, selected, true), /nach hinterlegtem Katalogschlüssel/);
  env.current.state.answers.set(question.id, selected);
  env.current.state.checked.set(question.id, env.current.signature(question));
  env.feedback.update(question, env.card);
  assert.equal(env.fields['.feedback'].hidden, true);
  assert.equal(env.fields['.question-explanation'].hidden, true);
  env.current.state.finished = true;
  env.feedback.update(question, env.card);
  assert.match(env.fields['.feedback'].textContent, /Quelle beachten/);
  assert.equal(env.fields['.question-explanation'].hidden, false);
});

test('Quellenhinweise bleiben getrennt von Originalantworten und verlinken benannte Fachquellen', () => {
  const env = setup();
  env.feedback.dom = {
    node: (tag, text, className) => ({ tag, text, className, children: [], append(...nodes) { this.children.push(...nodes); } })
  };
  const question = env.scope.LHUNDG_QUESTIONS.find(item => item.uid === 'r97-58');
  const details = env.feedback.createExplanation(question);
  assert.equal(details.hidden, true);
  assert.match(details.children[0].text, /Quelle beachten/);
  const content = details.children[1];
  assert.match(content.children[1].text, /Katalogwiderspruch/);
  const links = content.children.flatMap(node => node.children).filter(node => node.tag === 'a');
  assert.equal(links.length, 2);
  assert.ok(links.every(link => link.rel.includes('noopener') && link.target === '_blank'));
  assert.deepEqual(Array.from(question.correct), ['B', 'C', 'D']);
});

/**
 * Verbindet den echten Einstieg mit einem beobachtbaren Modalabschluss.
 * @param {object} env Isolierte Lernumgebung.
 * @returns {object} Aufrufe, Linkaktion und Abschlussfunktion.
 */
function bindWelcome(env) {
  let click;
  const calls = [];
  const resolvers = [];
  const link = { addEventListener: (event, handler) => { click = handler; } };
  const trainer = {};
  env.scope.document = { getElementById: id => id === 'foundationsLink' ? link : trainer };
  env.scope.LHUNDG_UI.modal = options => {
    calls.push(options);
    return new Promise(resolve => resolvers.push(resolve));
  };
  env.trainer.bindFoundations(env.current);
  return { calls, link, click: event => click(event), close: value => resolvers.shift()(value) };
}

/** @returns {Promise<void>} Wartet auf den Abschluss der asynchronen Modalbehandlung. */
function settle() {
  return new Promise(resolve => setImmediate(resolve));
}

test('Begrüßung speichert erst nach Schließen und bleibt unabhängig vom Lernreset', async () => {
  const env = setup();
  const key = 'lhundg-foundations-dismissed-v1';
  const ui = bindWelcome(env);
  assert.equal(ui.calls.length, 1);
  assert.equal(env.scope.localStorage.getItem(key), null);
  ui.close('learn');
  await settle();
  assert.equal(env.scope.localStorage.getItem(key), 'true');
  env.current.reset();
  assert.equal(bindWelcome(env).calls.length, 0);
});

test('Automatische Begrüßung bleibt in Prüfungen, TV und direkten Werkzeugaufrufen aus', () => {
  for (const query of ['mode=exam34', 'tv=1', 'action=export']) {
    assert.equal(bindWelcome(setup(query)).calls.length, 0, query);
  }
});

test('Manueller Zugang bleibt erreichbar und verhindert parallele Modale', async () => {
  const env = setup();
  env.current.write('localStorage', 'lhundg-foundations-dismissed-v1', true);
  const ui = bindWelcome(env);
  let prevented = false;
  ui.click({ preventDefault: () => { prevented = true; } });
  ui.click({ preventDefault: () => {} });
  assert.equal(prevented, true);
  assert.equal(ui.calls.length, 1);
  assert.equal(ui.calls[0].returnFocus, ui.link);
  ui.close('cancel');
  await settle();
  ui.click({ ctrlKey: true, preventDefault: () => { throw Error('Normaler Link muss erhalten bleiben'); } });
  assert.equal(ui.calls.length, 1);
});

test('Schließen funktioniert bei gesperrtem Speicher; Lesefehler öffnen die eigene HTML-Seite', async () => {
  const env = setup();
  env.scope.localStorage.getItem = () => { throw Error('blocked'); };
  env.scope.localStorage.setItem = () => { throw Error('blocked'); };
  let destination;
  env.scope.location.assign = value => { destination = value; };
  env.scope.fetch = async () => ({ ok: false });
  const ui = bindWelcome(env);
  ui.close('read');
  await settle();
  assert.equal(destination, 'grundlagen.html');
  assert.equal(env.current.storageFailed, true);
});
