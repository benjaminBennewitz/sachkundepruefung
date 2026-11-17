/* scripts/quality/workspace-tools.test.cjs */

/**
 * @file Mobile Klappbereiche und feststehende Fragenübersicht.
 * @description Prüft Originalcontrols, Fokus, responsive Wechsel und Rückgabe der Legende ohne Browserabhängigkeit.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

/** Bewegliche DOM-Knoten für echte Werkzeugereignisse. */
class Node {
  constructor() { this.children = []; this.handlers = {}; this.attributes = {}; this.dataset = {}; }
  append(...nodes) { for (const node of nodes) this.insertBefore(node, null); }
  insertBefore(node, sibling) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
    this.children.splice(sibling ? this.children.indexOf(sibling) : this.children.length, 0, node);
    node.parent = this;
  }
  contains(node) { return this === node || this.children.some(child => child.contains(node)); }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  addEventListener(name, handler) { this.handlers[name] = handler; }
  removeEventListener(name) { delete this.handlers[name]; }
  focus() { this.focused = true; }
}

/** @param {boolean} compact Ob mobile Bedienung aktiv ist. @returns {object} Echte Werkzeugbindung mit DOM-Ersatz. */
function setup(compact = true) {
  const viewport = { matches: compact, handlers: [], addEventListener(name, handler) { this.handlers.push(handler); } };
  const toggles = [new Node(), new Node()];
  const bodies = [new Node(), new Node()];
  toggles.forEach((button, index) => button.setAttribute('aria-controls', 'panel' + index));
  const depot = new Node();
  const content = new Node();
  const details = new Node();
  const legend = new Node();
  const grid = new Node();
  details.append(legend, grid); content.append(details); depot.append(content);
  content.querySelector = selector => selector === 'details' ? details : selector === '.nav-legend' ? legend : grid;
  const triggers = [new Node(), new Node()];
  triggers[0].dataset.learningTool = 'overview';
  triggers[1].dataset.learningTool = 'tests';
  const ids = { panel0: bodies[0], panel1: bodies[1], learningToolDepot: depot,
    'learning-overview': content, 'learning-tests': content };
  const window = { LHUNDG_UI_PARTS: {}, LHUNDG_UI: {} };
  let options, close;
  const sticky = new Node();
  window.LHUNDG_UI.modal = value => {
    options = value;
    if (value.stickyHeader) sticky.append(value.stickyHeader);
    return new Promise(resolve => { close = resolve; });
  };
  const document = { activeElement: null, getElementById: id => ids[id],
    querySelector: () => ({ close() {} }),
    querySelectorAll: selector => selector === '[data-mobile-toggle]' ? toggles : triggers };
  vm.runInNewContext(readFileSync(resolve(__dirname, '../learning/workspace-tools.js'), 'utf8'), {
    window, document, matchMedia: () => viewport
  });
  return { viewport, toggles, bodies, document, window, triggers, content, details, legend, grid, depot,
    close: () => close('close'), get options() { return options; } };
}

test('Mobil beginnen beide Bereiche geschlossen und lassen sich unabhängig öffnen', () => {
  const p = setup();
  assert(p.bodies.every(body => body.hidden));
  assert(p.toggles.every(toggle => !toggle.hidden && toggle.attributes['aria-expanded'] === 'false'));
  p.toggles[0].handlers.click();
  assert.equal(p.bodies[0].hidden, false);
  assert.equal(p.bodies[1].hidden, true);
  p.toggles[1].handlers.click();
  assert.equal(p.bodies[1].hidden, false);
});

test('Desktop zeigt alle Controls; beim Rückwechsel bleibt die mobile Wahl erhalten', () => {
  const p = setup();
  p.toggles[0].handlers.click();
  p.viewport.matches = false;
  p.viewport.handlers.forEach(fn => fn());
  assert(p.bodies.every(body => !body.hidden));
  assert(p.toggles.every(toggle => toggle.hidden));
  p.viewport.matches = true;
  p.viewport.handlers.forEach(fn => fn());
  assert.equal(p.bodies[0].hidden, false);
  assert.equal(p.bodies[1].hidden, true);
});

test('Einklappen schließt eine zugehörige Combobox und gibt verborgenen Fokus zurück', () => {
  const p = setup(false);
  const input = new Node();
  p.bodies[0].append(input);
  p.document.activeElement = input;
  let closed = 0;
  p.window.LHUNDG_UI_PARTS.activeSelect = { trigger: input, close() { closed += 1; } };
  p.viewport.matches = true;
  p.viewport.handlers.forEach(fn => fn());
  assert.equal(closed, 1);
  assert.equal(p.toggles[0].focused, true);
});

test('Fragenübersicht verwendet die echte Legende im fixierten Kopf und gibt sie anschließend zurück', async () => {
  const p = setup();
  const pending = p.triggers[0].handlers.click();
  assert.equal(p.options.stickyHeader, p.legend);
  assert.equal(p.options.content, p.content);
  assert.equal(p.details.children.includes(p.legend), false);
  p.close();
  await pending;
  assert.equal(p.details.children[0], p.legend);
  assert.equal(p.details.children[1], p.grid);
  assert.equal(p.content.parent, p.depot);
});

test('Andere Lernwerkzeuge erhalten keinen fixierten Fragenkopf', async () => {
  const p = setup();
  const pending = p.triggers[1].handlers.click();
  assert.equal(p.options.stickyHeader, null);
  p.close();
  await pending;
});

test('Das gemeinsame Schließen-Symbol ist dekoratives lokales CSS statt eines Schriftzeichens', () => {
  const window = {};
  const document = { createElement() { return new Node(); } };
  vm.runInNewContext(readFileSync(resolve(__dirname, '../ui/shared.js'), 'utf8'), { window, document });
  const icon = window.LHUNDG_UI_PARTS.closeIcon();
  assert.equal(icon.className, 'ui-close-icon');
  assert.equal(icon.textContent, '');
  assert.equal(icon.attributes['aria-hidden'], 'true');
});
