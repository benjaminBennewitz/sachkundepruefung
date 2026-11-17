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
