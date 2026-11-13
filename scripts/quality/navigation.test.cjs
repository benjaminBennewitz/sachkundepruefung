/* scripts/quality/navigation.test.cjs */

/**
 * @file Zustands- und Fokusprüfung der mobilen Hauptnavigation.
 * @description Prüft Originalelemente, Menüabschluss und Rückkehr zum Desktop ohne zusätzliche DOM-Abhängigkeit.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

/**
 * Erzeugt die für echte Menüereignisse benötigten DOM-Knoten mit beweglichen Originalreferenzen.
 * @returns {object} Menüumgebung mit Ereignissen und veränderbarer MediaQuery.
 */
function setup() {
  let document;
  class Node {
    constructor(tag, className = '') {
      this.tag = tag;
      this.className = className;
      this.children = [];
      this.listeners = {};
      this.attributes = {};
      this.hidden = false;
      this.classList = { toggle: (name, active) => { this.mobile = active; } };
    }
    append(...nodes) { for (const node of nodes) this.insertBefore(node, null); }
    insertBefore(node, sibling) {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1);
      const index = sibling ? this.children.indexOf(sibling) : this.children.length;
      this.children.splice(index, 0, node);
      node.parent = this;
    }
    before(node) { this.parent.insertBefore(node, this); }
    after(node) { this.parent.insertBefore(node, this.parent.children[this.parent.children.indexOf(this) + 1]); }
    matches(selector) {
      return selector === this.tag || selector === '.' + this.className ||
        (selector === '[data-open-support]' && this.support);
    }
    querySelector(selector) {
      for (const child of this.children) {
        if (child.matches(selector)) return child;
        const found = child.querySelector(selector);
        if (found) return found;
      }
      return null;
    }
    closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector); }
    contains(node) { return Boolean(node && (node === this || this.children.some(child => child.contains(node)))); }
    setAttribute(name, value) { this.attributes[name] = value; }
    getAttribute(name) { return this.attributes[name]; }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    focus() { document.activeElement = this; }
  }
  const header = new Node('header', 'site-header');
  const brand = new Node('div', 'header-brand-group');
  const project = new Node('div', 'header-project');
  const navigation = new Node('nav', 'header-nav');
  const tools = new Node('div', 'header-tools');
  const support = new Node('button');
  support.support = true;
  const theme = new Node('button');
  tools.append(theme, support);
  brand.append(project);
  header.append(brand, navigation, tools);
  document = {
    activeElement: null, listeners: {},
    querySelector: () => header,
    createElement: tag => new Node(tag),
    createComment: () => new Node('comment'),
    addEventListener(name, handler) { this.listeners[name] = handler; }
  };
  const viewport = { matches: true, addEventListener(name, handler) { this.change = handler; } };
  vm.runInNewContext(readFileSync(resolve(__dirname, '../ui/navigation.js'), 'utf8'), {
    document, window: { matchMedia: () => viewport }
  });
  return { header, brand, project, navigation, tools, support, theme, document, viewport,
    panel: header.querySelector('.header-navigation-panel'), toggle: header.querySelector('.icon-button header-menu-toggle'), Node };
}

test('Mobil bündelt Originalnavigation und Werkzeuge, das Herz bleibt neben dem Burger', () => {
  const ui = setup();
  assert.equal(ui.panel.hidden, true);
  assert.equal(ui.support.parent, ui.header);
  assert.equal(ui.project.parent, ui.panel);
  assert.equal(ui.theme.parent, ui.tools);
  ui.toggle.listeners.click();
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(ui.panel.hidden, false);
  let prevented = false;
  ui.header.listeners.keydown({ key: 'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.panel.hidden, true);
  assert.equal(ui.document.activeElement, ui.toggle);
});

test('Desktop erhält dieselben Bedienelemente und deren bisherige Reihenfolge zurück', () => {
  const ui = setup();
  ui.toggle.listeners.click();
  ui.viewport.matches = false;
  ui.viewport.change();
  assert.equal(ui.panel.hidden, false);
  assert.equal(ui.support.parent, ui.tools);
  assert.equal(ui.project.parent, ui.brand);
  assert.ok(ui.tools.children.indexOf(ui.theme) < ui.tools.children.indexOf(ui.support));
  ui.theme.focus();
  ui.viewport.matches = true;
  ui.viewport.change();
  assert.equal(ui.panel.hidden, true);
  assert.equal(ui.document.activeElement, ui.toggle);
});

test('Seitennavigation, Außenklick und Verlassen per Tab schließen das mobile Menü', () => {
  const ui = setup();
  ui.toggle.listeners.click();
  ui.navigation.listeners.click({ target: new ui.Node('a') });
  assert.equal(ui.panel.hidden, true);
  ui.toggle.listeners.click();
  ui.document.listeners.click({ target: new ui.Node('main') });
  assert.equal(ui.panel.hidden, true);
  ui.toggle.listeners.click();
  ui.header.listeners.focusout({ relatedTarget: new ui.Node('input') });
  assert.equal(ui.panel.hidden, true);
});

test('Ein vom Menü geöffneter Dialog behält sein sichtbares Rücksprungziel', () => {
  const ui = setup();
  const dialog = new ui.Node('dialog');
  ui.toggle.listeners.click();
  ui.header.listeners.focusout({ relatedTarget: dialog });
  ui.document.listeners.click({ target: dialog });
  assert.equal(ui.panel.hidden, false);
});
