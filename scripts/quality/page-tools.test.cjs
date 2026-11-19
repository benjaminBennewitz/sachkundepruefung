/* scripts/quality/page-tools.test.cjs */

/**
 * @file Regressionen für FAQ-Gruppen, Ortsinformationen und die Scrollaktion.
 * @description Prüft Bedienverhalten ohne Änderungen an Produktivdaten oder Browserpräferenzen.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

/** Führt das bestehende UI-Modul im angegebenen isolierten Kontext aus. */
function load(name, scope) {
  vm.runInNewContext(readFileSync(resolve(__dirname, '../ui/' + name + '.js'), 'utf8'), scope);
}

/** Minimales natives Detail mit Summary und auslösbaren Ereignissen. */
function detail(group) {
  const summary = { handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; },
    setAttribute() {}, textContent: 'Stadt und Herkunft' };
  return { summary, open: false, handlers: {},
    getAttribute: name => name === 'name' ? group : null,
    removeAttribute() {}, querySelector: () => summary,
    addEventListener(name, handler) { this.handlers[name] = handler; },
    getBoundingClientRect() { return { height: this.open ? 160 : 40 }; },
    classList: { add() {}, remove() {} } };
}

/** Nativer Summary-Klick mit unverändertem Linkverhalten. */
function click() {
  return { defaultPrevented: false, button: 0, target: { closest: () => null }, preventDefault() {} };
}

test('FAQ öffnet stets nur einen Eintrag derselben Gruppe; andere Details bleiben unabhängig', () => {
  const entries = [detail('faq'), detail('faq'), detail(null)];
  const window = {};
  load('shared', { window, document: { querySelectorAll: () => entries }, matchMedia: () => ({ matches: true }) });
  window.LHUNDG_UI_PARTS.bindDetails();
  entries[0].summary.handlers.click(click());
  assert.equal(entries[0].open, true);
  entries[2].summary.handlers.click(click());
  entries[1].summary.handlers.click(click());
  assert.equal(entries[0].open, false);
  assert.equal(entries[1].open, true);
  assert.equal(entries[2].open, true);
});

/** Richtet eine Seite mit einem Ortsprofil und der gemeinsamen Scrollaktion ein. */
function page({ learning = false } = {}) {
  const city = detail(null);
  const content = {};
  city.querySelector = selector => selector === '.city-content' ? content : city.summary;
  city.append = node => { city.restored = node; };
  const listeners = {};
  const controls = [];
  const placements = [];
  const calls = [];
  const ui = { node: (tag, text) => ({ textContent: text, handlers: {}, setAttribute() {},
    addEventListener(name, handler) { this.handlers[name] = handler; } }) };
  const window = { LHUNDG_UI_PARTS: ui, scrollY: 0,
    addEventListener(name, handler) { listeners[name] = handler; },
    scrollTo(options) { calls.push(options); } };
  const document = { querySelectorAll: () => [city],
    getElementById: id => learning && id === 'learningScrollTop' ?
      { append(node) { controls.push(node); placements.push('learning'); } } : null,
    body: { append(node) { controls.push(node); placements.push('body'); } },
    querySelector: () => ({ focus() { calls.push('focus'); } }) };
  load('page-tools', { window, document, matchMedia: () => ({ matches: true }) });
  let close;
  let dialog;
  ui.bindPageTools({ open(options) { dialog = options; return new Promise(resolve => { close = resolve; }); } });
  return { window, city, content, controls, placements, calls, listeners, close: () => close('close'), get dialog() { return dialog; } };
}

test('Ortsinhalt öffnet im gemeinsamen Dialog und kehrt in den geschlossenen Eintrag zurück', async () => {
  const p = page();
  const pending = p.city.summary.handlers.click(click());
  assert.equal(p.city.open, false);
  assert.equal(p.dialog.content, p.content);
  assert.equal(p.dialog.closeButton, true);
  assert.equal(p.dialog.returnFocus, p.city.summary);
  p.close();
  await pending;
  assert.equal(p.city.restored, p.content);
  assert.equal(p.city.open, false);
});

test('Zum-Seitenanfang erscheint erst nach Scrollen und berücksichtigt reduzierte Bewegung', () => {
  const p = page();
  const button = p.controls[0];
  assert.equal(button.hidden, true);
  p.window.scrollY = 500;
  p.listeners.scroll();
  assert.equal(button.hidden, false);
  button.handlers.click();
  assert.equal(p.calls[0].top, 0);
  assert.equal(p.calls[0].behavior, 'auto');
  assert.equal(p.calls[1], 'focus');
});


test('Im Lernbereich liegt der Rückweg im vorgesehenen Footer-Platz statt über der Navigation', () => {
  const p = page({ learning: true });
  assert.deepEqual(p.placements, ['learning']);
  assert.equal(p.controls[0].textContent, 'Nach oben ↑');
  p.window.scrollY = 500;
  p.listeners.scroll();
  assert.equal(p.controls[0].hidden, false);
});

/** @param {string} hash Fragment. @returns {object} Quellenkarten mit beobachtbaren Ereignissen und Scrollabschluss. */
function sourcePage(hash = '#rhein97') {
  const handlers = new Map();
  const timers = new Map();
  let nextTimer = 0;
  const cards = ['rhein97', 'koeln'].map(id => {
    const classes = new Set();
    return { id, classes, calls: [], classList: {
      add: name => classes.add(name), remove: name => classes.delete(name)
    }, scrollIntoView(options) { this.calls.push(options); } };
  });
  const window = { location: { hash }, scrollY: 0, LHUNDG_UI_PARTS: {
    node: () => ({ setAttribute() {}, addEventListener() {} })
  }, addEventListener(name, handler) {
    if (!handlers.has(name)) handlers.set(name, new Set());
    handlers.get(name).add(handler);
  }, removeEventListener(name, handler) { handlers.get(name)?.delete(handler); },
  setTimeout(handler) { timers.set(++nextTimer, handler); return nextTimer; },
  clearTimeout(id) { timers.delete(id); } };
  const document = {
    querySelectorAll: selector => selector === '.source-card[id]' ? cards : [],
    getElementById: () => null, body: { append() {} }
  };
  load('page-tools', { window, document, matchMedia: () => ({ matches: false }) });
  window.LHUNDG_UI_PARTS.bindPageTools({});
  return { window, cards,
    emit(name, event = {}) { for (const handler of [...handlers.get(name) || []]) handler(event); },
    settle() { const queued = [...timers.values()]; timers.clear(); queued.forEach(handler => handler()); }
  };
}

test('Ein Herkunftsfragment rahmt nur die passende Quelle ein und überlebt automatisches Ankerscrollen', () => {
  const p = sourcePage();
  assert.equal(p.cards[0].classes.has('source-target'), true);
  assert.equal(p.cards[1].classes.has('source-target'), false);
  assert.equal(p.cards[0].calls[0].behavior, 'smooth');
  p.emit('scroll');
  assert.equal(p.cards[0].classes.has('source-target'), true);
  p.settle();
  p.emit('scroll');
  assert.equal(p.cards[0].classes.has('source-target'), false);
});

test('Klick, Scrollabsicht und Scrolltasten entfernen den Quellenrahmen ohne Wartezeit', () => {
  for (const event of ['pointerdown', 'click', 'wheel', 'touchmove', 'keydown']) {
    const p = sourcePage();
    p.emit(event, { key: 'PageDown' });
    assert.equal(p.cards[0].classes.has('source-target'), false, event);
  }
});

test('Hashwechsel räumt den alten Rahmen auf; unbekannte und fehlerhafte Ziele bleiben ohne Markierung', () => {
  const p = sourcePage();
  p.window.location.hash = '#koeln';
  p.emit('hashchange');
  assert.equal(p.cards[0].classes.has('source-target'), false);
  assert.equal(p.cards[1].classes.has('source-target'), true);
  for (const hash of ['#unbekannt', '#%ZZ', '']) {
    p.window.location.hash = hash;
    p.emit('hashchange');
    assert.ok(p.cards.every(card => !card.classes.has('source-target')));
  }
});
