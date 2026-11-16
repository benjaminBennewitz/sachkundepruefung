/* scripts/quality/workspace.test.cjs */

/**
 * @file Regressionstests für Lernrouting, Darstellungspräferenzen und lokale Sprachausgabe.
 * @description Prüft Speichergrenzen, Inhaltsauswahl und Menü-Kontext unabhängig von vorhandenen Bilddateien.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

/**
 * Führt ein echtes UI-Modul in einer isolierten Browserumgebung aus.
 * @param {string} name Dateiname ohne Erweiterung.
 * @param {object} scope Unterstützte Browser-Globals.
 * @returns {object} Ausführungsumgebung.
 */
function load(name, scope) {
  vm.runInNewContext(readFileSync(resolve(__dirname, `../ui/${name}.js`), 'utf8'), scope);
  return scope;
}

/**
 * Erzeugt isolierte Präferenzen mit optional gesperrtem Speicher.
 * @param {object} options Rohwert und Speicherschutz.
 * @returns {object} Zustand, Dokument und Speicherprotokoll.
 */
function preferences({ saved = null, blocked = false } = {}) {
  const values = new Map([['learning-progress', 'unverändert']]);
  if (saved !== null) values.set('lhundg-accessibility-v1', saved);
  const motion = { matches: false, addEventListener(name, handler) { this.changed = handler; } };
  const scope = {
    document: { documentElement: { dataset: {} } },
    localStorage: { getItem: key => values.get(key) ?? null,
      setItem(key, value) { if (blocked) throw new Error('gesperrt'); values.set(key, value); } },
    matchMedia: () => motion,
    CustomEvent: class CustomEvent {}, dispatchEvent() {}
  };
  scope.window = scope;
  load('accessibility-state', scope);
  return { access: scope.LHUNDG_ACCESS, document: scope.document, values, motion };
}

test('Ungültige Präferenzen und fremde Schlüssel werden nicht ins Dokument übernommen', () => {
  const env = preferences({ saved: '{"textSize":"huge","motion":"off","unknown":"bad","contrast":"high"}' });
  assert.equal(env.access.get().textSize, 'normal');
  assert.equal(env.document.documentElement.dataset.motion, undefined);
  assert.equal(env.document.documentElement.dataset.contrast, 'high');
  assert.equal(env.document.documentElement.dataset.unknown, undefined);
  assert.equal(env.values.get('learning-progress'), 'unverändert');
});

test('Gesperrter Speicher verhindert weder Schriftvergrößerung noch Zurücksetzen', () => {
  const env = preferences({ blocked: true });
  assert.equal(env.access.set({ textSize: 'larger' }), false);
  assert.equal(env.document.documentElement.dataset.textSize, 'larger');
  env.access.reset();
  assert.equal(env.document.documentElement.dataset.textSize, 'normal');
  assert.equal(env.values.get('learning-progress'), 'unverändert');
});

test('Entfernte Bewegungs- und Oberflächenoptionen werden auch aus alten Speicherständen verworfen', () => {
  const env = preferences({ saved: '{"textSize":"large","motion":"off","comfort":"simple"}' });
  assert.equal(env.access.get().textSize, 'large');
  assert.equal(env.access.get().motion, undefined);
  assert.equal(env.access.get().comfort, undefined);
  assert.equal(env.document.documentElement.dataset.motion, undefined);
  assert.equal(env.document.documentElement.dataset.comfort, undefined);
});

test('Alte Prüfungslinks behalten Modus, Fragenfolge und TV-Parameter', () => {
  let redirected;
  const href = 'https://hunde-sachkundetrainer.de/nrw/?mode=exam11&ids=4%2C9&tv=1#trainer';
  load('learning-entry', { URL, location: { href, replace(value) { redirected = value; } } });
  const target = new URL(redirected);
  assert.equal(target.pathname, '/nrw/lernen.html');
  assert.equal(target.searchParams.get('ids'), '4,9');
  assert.equal(target.searchParams.get('tv'), '1');
  assert.equal(target.hash, '#trainer');
});

test('Startseite und persönliche Geschichte werden ohne Lernauftrag nicht weitergeleitet', () => {
  for (const suffix of ['', '#geschichte', '?utm_source=test']) {
    load('learning-entry', { URL,
      location: { href: `https://hunde-sachkundetrainer.de/nrw/${suffix}`,
        replace() { assert.fail('Unerwartete Weiterleitung'); } } });
  }
});

/**
 * Erzeugt lokale und entfernte Stimmen sowie sichtbare und verborgene Antworttexte.
 * @returns {object} Sprachausgabe, Protokoll und beobachteter Fragenwechsel.
 */
function speechEnvironment() {
  const spoken = [];
  let cancelled = 0;
  let changedQuestion;
  const voices = [
    { lang: 'de-DE', localService: false, name: 'Remote' },
    { lang: 'en-US', localService: true, name: 'English' },
    { lang: 'de-DE', localService: true, name: 'Deutsch lokal' }
  ];
  const text = (innerText, hidden = false) => ({ innerText, closest: () => hidden ? {} : null,
    getClientRects: () => hidden ? [] : [{}], parentElement: { closest: () => null } });
  const question = { querySelectorAll: selector => {
    assert(!selector.includes('correct') && !selector.includes('feedback'));
    return [text('Frage 1'), text('Wie handelt man?'), text('A: Ruhig bleiben'), text('B: Abstand halten'),
      text('Versteckte Lösung', true)];
  } };
  const scope = {
    LHUNDG_ACCESS: {}, addEventListener() {},
    document: { getElementById: () => ({}), querySelector: () => question },
    getComputedStyle: () => ({ visibility: 'visible' }),
    SpeechSynthesisUtterance: class SpeechSynthesisUtterance { constructor(value) { this.text = value; } },
    speechSynthesis: { getVoices: () => voices, addEventListener() {},
      speak(value) { spoken.push(value); }, cancel() { cancelled += 1; }, pause() {}, resume() {} },
    MutationObserver: class MutationObserver { constructor(callback) { changedQuestion = callback; } observe() {} }
  };
  scope.window = scope;
  load('accessibility-speech', scope);
  return { speech: new scope.LHUNDG_ACCESS.Speech(() => {}), voices, spoken,
    cancelled: () => cancelled, changeQuestion: () => changedQuestion() };
}

test('Vorlesen nutzt ausschließlich lokale deutsche Stimmen und keine verborgenen Lösungen', () => {
  const env = speechEnvironment();
  assert.equal(env.speech.voice().name, 'Deutsch lokal');
  assert(!env.speech.paragraphs().join(' ').includes('Versteckte Lösung'));
  env.voices.pop();
  assert.equal(env.speech.voice(), undefined);
});

test('Ein Fragenwechsel stoppt Vorlesen und verhindert nachlaufende alte Sprachaufträge', () => {
  const env = speechEnvironment();
  env.speech.start();
  const first = env.spoken[0];
  assert.equal(env.speech.active, true);
  env.changeQuestion();
  assert.equal(env.cancelled(), 1);
  first.onend();
  assert.equal(env.spoken.length, 1);
  assert.equal(env.speech.active, false);
});

test('Lange Vorlesetexte werden vollständig in kurze Abschnitte aufgeteilt', () => {
  const env = speechEnvironment();
  const paragraph = Array.from({ length: 200 }, (_, i) => `Wort${i}`).join(' ');
  const chunks = env.speech.chunks([paragraph]);
  assert(chunks.every(chunk => chunk.length <= 221));
  assert.equal(chunks.join(' ').replace(/\s+/g, ' ').trim(), paragraph);
});

test('Select-Menüs verbleiben im geöffneten Dialog und übernehmen ihre Kontextfarbe', () => {
  const scope = { LHUNDG_UI_PARTS: {}, document: { body: { append(menu) { menu.parentElement = this; } } } };
  scope.window = scope;
  load('select-view', scope);
  const dialog = { append(menu) { menu.parentElement = this; } };
  const menu = { parentElement: scope.document.body, dataset: {} };
  const view = { menu, trigger: { closest: selector => selector.startsWith('dialog') ? dialog : {} } };
  scope.LHUNDG_UI_PARTS.SelectView.prototype.mountMenu.call(view);
  assert.equal(menu.parentElement, dialog);
  assert.equal(menu.dataset.palette, 'forest');
  view.trigger.closest = () => null;
  scope.LHUNDG_UI_PARTS.SelectView.prototype.mountMenu.call(view);
  assert.equal(menu.parentElement, scope.document.body);
  assert.equal(menu.dataset.palette, 'default');
});
