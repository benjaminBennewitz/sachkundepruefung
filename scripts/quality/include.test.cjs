/* scripts/quality/include.test.cjs */

/**
 * @file Regressionstests der Browser-Includes.
 * @description Prüft paralleles Laden, Navigation, Originalcontrols und den Fehlerpfad.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');

const script = readFileSync(resolve(__dirname, '../ui/include.js'), 'utf8');

/**
 * Führt den Browsercode mit kontrollierbaren Antworten und den benötigten DOM-Schnittstellen aus.
 * @param {string} pathname Aufgerufene Seite einschließlich optionaler Query und Fragment.
 * @returns {object} Eingefügte Fragmente, Netzantworten und Bereitschaftssignal.
 */
function fixture(pathname) {
  const attributes = {};
  const localControl = { id: 'importTrigger' };
  const trainer = pathname.startsWith('/nrw/lernen.html');
  const oldLink = { remove() { this.removed = true; } };
  const link = href => ({
    getAttribute: () => href,
    setAttribute: (name, value) => { attributes[href] = [name, value]; }
  });
  const controls = {
    querySelectorAll: () => [oldLink],
    prepend(...children) { this.inserted = children; }
  };
  const slots = ['header', 'footer'].map(name => ({
    tagName: name.toUpperCase(),
    dataset: { layoutSrc: `templates/site-${name}.html` },
    contains: () => false,
    querySelector: () => trainer ? { children: [localControl] } : null,
    replaceChildren(...nodes) { this.content = nodes; },
    removeAttribute() { delete this.dataset.layoutSrc; }
  }));
  const fragments = ['header', 'footer'].map(name => ({
    matches: selector => selector === `${name}.site-${name}`,
    querySelector: () => controls,
    querySelectorAll: () => [link('./'), link('lernen.html#trainer')],
    childNodes: [name]
  }));
  const requests = new Map();
  const errors = [];
  const window = {};
  const document = {
    querySelectorAll: () => slots,
    createElement: () => ({
      content: {},
      set innerHTML(value) { this.content.firstElementChild = fragments[value]; }
    })
  };
  runInNewContext(script, {
    window, document, location: { href: 'https://example.test' + pathname },
    URL, AbortSignal, console: { error: message => errors.push(message) },
    fetch: path => new Promise(resolve => requests.set(path, resolve))
  });
  return { window, requests, slots, controls, attributes, oldLink, localControl, errors };
}

test('Beide Fragmente starten parallel; der Lerntrainer behält seine Originalcontrols', async () => {
  const layout = fixture('/nrw/lernen.html?mode=mg#trainer');
  const { requests, window, slots, attributes, controls, oldLink, localControl } = layout;
  assert.deepEqual([...requests.keys()], ['templates/site-header.html', 'templates/site-footer.html']);
  requests.get('templates/site-footer.html')({ ok: true, text: async () => 1 });
  requests.get('templates/site-header.html')({ ok: true, text: async () => 0 });
  await window.LHUNDG_LAYOUT_READY;
  assert.deepEqual(slots.map(slot => slot.content[0]), ['header', 'footer']);
  assert.deepEqual(attributes, { 'lernen.html#trainer': ['aria-current', 'page'] });
  assert.equal(controls.inserted[0], localControl);
  assert.equal(oldLink.removed, true);
});

test('Ein fehlendes Fragment lässt seine Ersatzlinks stehen und blockiert die Bereitschaft nicht', async () => {
  const { requests, window, slots, errors, attributes } = fixture('/nrw/index.html');
  requests.get('templates/site-header.html')({ ok: true, text: async () => 0 });
  requests.get('templates/site-footer.html')({ ok: false, status: 404 });
  await window.LHUNDG_LAYOUT_READY;
  assert.deepEqual(attributes, { './': ['aria-current', 'page'] });
  assert.equal(slots[1].content, undefined);
  assert.equal(slots[1].dataset.layoutFailed, '');
  assert.match(errors[0], /site-footer\.html/);
});
