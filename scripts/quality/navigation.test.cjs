/* scripts/quality/navigation.test.cjs */

/**
 * @file Zustands- und Fokusprüfung der bildschirmfüllenden Hauptnavigation.
 * @description Prüft Originalelemente, Dialogabschluss und Rückkehr zum Desktop ohne zusätzliche DOM-Abhängigkeit.
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
      const classes = new Set();
      this.classList = {
        toggle: (name, active) => active ? classes.add(name) : classes.delete(name),
        contains: name => classes.has(name)
      };
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
    showModal() { this.open = true; }
    close() { this.open = false; }
  }
  const header = new Node('header', 'site-header');
  const brand = new Node('div', 'header-brand-group');
  const project = new Node('div', 'header-project');
  const navigation = new Node('nav', 'header-nav');
  navigation.append(new Node('a'));
  const tools = new Node('div', 'header-tools');
  const support = new Node('button');
  support.support = true;
  const theme = new Node('button');
  tools.append(theme, support);
  brand.append(project);
  header.append(brand, navigation, tools);
  document = {
    activeElement: null, listeners: {}, body: new Node('body'), documentElement: new Node('html'),
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
    panel: header.querySelector('.header-navigation-panel'), toggle: header.querySelector('.icon-button header-menu-toggle'),
    overlay: document.body.querySelector('.mobile-navigation-overlay'),
    close: document.body.querySelector('.mobile-navigation-close'), Node };
}

test('Mobil öffnet die Originalnavigation als nativen Dialog mit eigenem Schließen-Button', () => {
  const ui = setup();
  assert.equal(ui.panel.hidden, true);
  assert.equal(ui.support.parent, ui.header);
  assert.equal(ui.project.parent, ui.panel);
  ui.toggle.listeners.click();
  assert.equal(ui.overlay.open, true);
  assert.equal(ui.panel.parent, ui.overlay);
  assert.equal(ui.panel.hidden, false);
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'true');
  assert.equal(ui.toggle.getAttribute('aria-haspopup'), 'dialog');
  assert.equal(ui.document.documentElement.classList.contains('navigation-open'), true);
  assert.equal(ui.document.activeElement, ui.close);
});

test('Escape hebt die Scrollsperre auf und gibt den Fokus zum Burger zurück', () => {
  const ui = setup();
  ui.toggle.listeners.click();
  let prevented = false;
  ui.overlay.listeners.cancel({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(ui.overlay.open, false);
  assert.equal(ui.panel.hidden, true);
  assert.equal(ui.panel.parent, ui.header);
  assert.equal(ui.document.documentElement.classList.contains('navigation-open'), false);
  assert.equal(ui.document.activeElement, ui.toggle);
});

test('Schließen-Taste und Seitennavigation schließen den Dialog ohne Werkzeugkopien', () => {
  const ui = setup();
  ui.toggle.listeners.click();
  ui.close.listeners.click();
  assert.equal(ui.overlay.open, false);
  assert.equal(ui.document.activeElement, ui.toggle);
  ui.toggle.listeners.click();
  ui.navigation.listeners.click({ target: new ui.Node('a') });
  assert.equal(ui.overlay.open, false);
  assert.equal(ui.toggle.getAttribute('aria-expanded'), 'false');
  assert.equal(ui.theme.parent, ui.tools);
});

test('Desktop schließt den Dialog, entsperrt die Seite und erhält die Originalelemente zurück', () => {
  const ui = setup();
  ui.toggle.listeners.click();
  ui.viewport.matches = false;
  ui.viewport.change();
  assert.equal(ui.overlay.open, false);
  assert.equal(ui.panel.hidden, false);
  assert.equal(ui.support.parent, ui.tools);
  assert.equal(ui.project.parent, ui.brand);
  assert.equal(ui.document.documentElement.classList.contains('navigation-open'), false);
  assert.equal(ui.document.activeElement, ui.navigation.querySelector('a'));
  ui.theme.focus();
  ui.viewport.matches = true;
  ui.viewport.change();
  assert.equal(ui.panel.hidden, true);
  assert.equal(ui.document.activeElement, ui.toggle);
});

test('Ein verspätetes natives close-Ereignis schließt ein erneut geöffnetes Menü nicht', () => {
  const ui = setup();
  ui.toggle.listeners.click();
  ui.close.listeners.click();
  ui.toggle.listeners.click();
  ui.overlay.listeners.close();
  assert.equal(ui.overlay.open, true);
  assert.equal(ui.document.documentElement.classList.contains('navigation-open'), true);
});
