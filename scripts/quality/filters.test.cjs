/* scripts/quality/filters.test.cjs */

/**
 * @file Regressionstests für Suchtreffer und die direkt erreichbare Merkliste.
 * @description Prüft echte Katalogdaten und Filtersteuerung mit kleinen DOM-Ersatzobjekten ohne zusätzliche Abhängigkeiten.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fixtures = require('./learning-fixtures.cjs');

/**
 * Stellt nur die von der Filtersteuerung tatsächlich verwendeten Control-Eigenschaften bereit.
 *
 * @returns {object} Kontrollierbarer Text-, Sichtbarkeits- und Ereigniszustand.
 */
function control() {
  const attributes = new Map();  // Zugängliche Beschriftungen und gedrückter Merklisten-Zustand.
  const events = new Map();      // Aufgezeichnete Bindungen können ohne Browser ausgeführt werden.

  return {
    value: '',
    textContent: '',
    hidden: false,
    disabled: false,
    attributes,
    events,
    setAttribute: (name, value) => attributes.set(name, value),
    addEventListener: (name, handler) => events.set(name, handler)
  };
}

/**
 * Lädt echte Session-, Bewertungs- und Filtermodule mit isolierten minimalen Controls.
 *
 * @returns {object} Aktive Sitzung, Filtersteuerung und beobachtbare Darstellungsaufrufe.
 */
function environment() {
  const env = fixtures.environment(['data', 'essen', 'core', 'profiles', 'session', 'filter-view']);  // Echte Produktionsmodule.
  env.scope.clearTimeout = clearTimeout;                                                              // Derselbe Timerzugang wie im Browser; ein leerer Such-Timer bleibt gefahrlos löschbar.
  env.scope.setTimeout = setTimeout;
  const session = fixtures.session(env);  // Unveränderter Gesamtpool mit eigenem Testspeicher.
  const controls = new Map();             // Keine DOM- oder Paketinstallation für die CLI-Tests erforderlich.
  const calls = [];                       // Erfasst Rendering, Fokusanforderung und Ansichtssynchronisierung.

  env.trainer.dom = {
    get: id => {
      // Jedes verwendete Control erhält genau einen wieder auffindbaren Ersatz.
      if (!controls.has(id)) controls.set(id, control());
      return controls.get(id);
    }
  };
  const view = viewStub(session, calls);                      // Stellt ausschließlich die bestehenden Schnittstellen der Lernansicht bereit.
  const filters = new env.trainer.FilterView(session, view);  // Tatsächliche Filterimplementierung.

  return { session, controls, calls, filters, get: env.trainer.dom.get, view };
}

/**
 * Ersetzt die Kartendarstellung, während Zustand und Filter weiterhin aus echten Modulen kommen.
 *
 * @param {object} session Echte Trainer-Sitzung.
 * @param {Array} calls Nach außen beobachtbare Darstellungsaufrufe.
 * @returns {object} Minimale vorhandene Lernansicht-Schnittstelle.
 */
function viewStub(session, calls) {
  const navButtons = new Map(session.questions.map(question => [question.id, control()]));  // Echte Frage-IDs als Navigationsziele.

  return {
    navButtons,
    pageSize: () => (session.state.view === 'list' ? 8 : 1),
    render: focus => calls.push({ render: true, focus }),
    syncViewUrl: () => calls.push({ view: session.state.view }),
    goTo: id => calls.push({ goTo: id }),
    changeView: view => calls.push({ changeView: view })
  };
}

test('Suche berücksichtigt echte Antworttexte sowie Fragetexte und Originalnummern', () => {
  const { session, filters } = environment();  // Jede Prüfung startet mit unabhängigem Katalogzustand.
  const question = session.questions.find(
    question =>
      !question.prompt.toLowerCase().includes('maulkorb') &&
      Object.values(question.answers).some(answer => answer.toLowerCase().includes('maulkorb'))
  );

  assert(question, 'Für die Prüfung muss ein echter Treffer ausschließlich im Antworttext vorhanden sein.');
  session.state.search = 'maulkorb';
  assert(filters.matches(question));
  session.state.search = 'zzzzNichtImKatalog';
  assert(!filters.matches(question));
});

test('Lernstatus unterscheidet Vollständigkeit, ausdrückliche Bewertung und gesetzte Merker', () => {
  const { session, filters } = environment();
  const question = session.questions[0];  // Tatsächlicher Lösungsschlüssel statt nachgebauter Bewertungsformel.

  session.state.status = 'open';
  assert(filters.matchesStatus(question));
  session.state.answers.set(question.id, new Set(question.correct));
  assert(!filters.matchesStatus(question));
  session.state.status = 'wrong';
  assert(!filters.matchesStatus(question));
  session.state.status = 'bookmarked';
  assert(!filters.matchesStatus(question));
  session.state.bookmarks.add(question.id);
  assert(filters.matchesStatus(question));
});

test('Filteranwendung begrenzt Fragenverweise auf dieselbe Trefferfolge wie die Karten', () => {
  const { session, filters, view, get } = environment();

  session.state.search = 'maulkorb';
  get('search').value = 'Maulkorb';
  filters.apply();

  assert(session.state.items.length > 1 && session.state.items.length < session.questions.length);
  assert.equal([...view.navButtons.values()].filter(button => !button.hidden).length, session.state.items.length);
  assert.match(get('matchCount').textContent, /Treffer für „Maulkorb“ in Fragen und Antworten/);
});

test('Direkte Merkliste verwirft andere Filter, zeigt acht pro Seite und erhält Antworten', () => {
  const { session, filters, get, calls } = environment();
  const question = session.questions[0];  // Bereits beantwortete und gemerkte echte Frage.

  session.state.answers.set(question.id, new Set(question.correct));
  session.state.bookmarks.add(question.id);
  session.state.search = 'nicht passend';
  session.state.category = 'nicht passend';
  filters.showBookmarks();

  assert.equal(session.state.search, '');
  assert.equal(session.state.category, 'all');
  assert.equal(session.state.view, 'list');
  assert.equal(session.state.items.length, 1);
  assert.equal(get('statusFilter').value, 'bookmarked');
  assert.match(get('modeTitle').textContent, /^Merkliste/);
  assert.equal(get('clearFilters').textContent, 'Alle Fragen anzeigen');
  assert(session.state.answers.has(question.id));
  assert(calls.some(call => call.focus === true));
});

test('Leere Merkliste und nur ausgefilterte Merker erhalten unterschiedliche Hinweise', () => {
  const { session, filters } = environment();

  session.state.status = 'bookmarked';
  assert.match(filters.emptyMessage(), /Merkliste ist noch leer/);
  session.state.bookmarks.add(session.questions[0].id);
  assert.match(filters.emptyMessage(), /Keine gemerkten Fragen passen zu deinen Filtern/);
  assert(!filters.emptyMessage().includes('Merkliste ist noch leer'));
});

test('Entfernte letzte Trefferseite begrenzt den Index auf den Anfang der vorhandenen Achterseite', () => {
  const { session, filters } = environment();

  session.state.view = 'list';
  session.state.items = session.questions.slice(0, 8);
  session.state.index = 8;
  filters.clampPosition(false);

  assert.equal(session.state.index, 0);
  session.state.items = session.questions.slice(0, 10);
  session.state.index = 8;
  filters.clampPosition(false);
  assert.equal(session.state.index, 8);
});

test('Treffernavigation benennt ihre Position und sperrt die Grenzen', () => {
  const { session, filters, get } = environment();

  session.state.search = 'maulkorb';
  filters.apply();
  filters.updatePagination();

  assert(get('previous').disabled);
  assert(!get('next').disabled);
  assert.match(get('position').textContent, /^Treffer 1 von/);
  assert.equal(get('next').textContent, 'Nächste Treffer →');
  session.state.index = session.state.items.length - 1;
  filters.updatePagination();
  assert(get('next').disabled);
});

test('Merkliste bleibt leer bedienbar, und die Filterbindung verbindet ihren direkten Zugang', () => {
  const { session, filters, get } = environment();

  filters.bind();
  filters.updateBookmarks();
  assert.equal(get('showBookmarks').textContent, '★ Merkliste (0)');
  assert(!get('showBookmarks').disabled);
  get('showBookmarks').events.get('click')();

  assert.equal(session.state.status, 'bookmarked');
  assert.equal(get('showBookmarks').attributes.get('aria-pressed'), 'true');
});
