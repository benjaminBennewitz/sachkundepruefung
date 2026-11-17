/* scripts/quality/release.test.cjs */

/**
 * @file Prüfungen für den versionierten Release-Einstieg.
 * @description Prüft Dialogreihenfolge, Speicherausfälle und das Überschreiben einer einzigen Versionskennung.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const source = readFileSync(resolve(__dirname, '../ui/release.js'), 'utf8');
const key = 'lhundg-release-seen';

/**
 * Erstellt isolierte Speicher- und Dialogschnittstellen ohne Browserabhängigkeit.
 * @param {string|null} previous Vorherige Release-Version.
 * @param {boolean} blocked Ob Lesen und Schreiben des Browserspeichers scheitern.
 * @returns {object} Testkontext mit noch offenem Dialog und Speichermitschnitt.
 */
function fixture(previous = null, blocked = false) {
  const values = new Map(previous ? [[key, previous]] : []);
  const writes = [];
  const opened = [];
  let close;
  const trigger = { handlers: {}, addEventListener(name, handler) { this.handlers[name] = handler; } };
  const ui = {
    node(tag, text = '', className = '') {
      return { tag, text, className, children: [], append(...nodes) { this.children.push(...nodes); }, setAttribute() {} };
    }
  };
  const window = {
    LHUNDG_UI_PARTS: ui,
    localStorage: {
      getItem(name) { if (blocked) throw new Error('Speicher gesperrt'); return values.get(name) ?? null; },
      setItem(name, value) {
        if (blocked) throw new Error('Speicher voll');
        values.set(name, value);
        writes.push([name, value]);
      }
    }
  };
  vm.runInNewContext(source, { window, document: { querySelectorAll: () => [trigger] } });
  const modal = { open(options) { opened.push(options); return new Promise(resolve => { close = resolve; }); } };
  return { ui, modal, values, writes, opened, trigger, close: value => close(value) };
}

test('Release wird sofort eingereiht und erst nach dem Schließen als gesehen gespeichert', async () => {
  const f = fixture();
  const pending = f.ui.bindRelease(f.modal);
  assert.equal(f.opened.length, 1);
  assert.equal(f.opened[0].content.children.filter(node => node.tag === 'section').length, 3);
  assert.equal(f.writes.length, 0);
  f.close('close');
  await pending;
  assert.equal(f.values.size, 1);
  assert.equal(f.values.get(key), f.opened[0].eyebrow.split(' ').at(-1));
});

test('Gesehene aktuelle Version öffnet beim nächsten Seitenaufruf keinen Dialog', async () => {
  const first = fixture();
  const pending = first.ui.bindRelease(first.modal);
  first.close('close');
  await pending;
  const next = fixture(first.values.get(key));
  await next.ui.bindRelease(next.modal);
  assert.equal(next.opened.length, 0);
  assert.equal(next.writes.length, 0);
});

test('Ein neues Release überschreibt denselben Schlüssel statt weitere Schlüssel anzulegen', async () => {
  const f = fixture('2026.11.16');
  const pending = f.ui.bindRelease(f.modal);
  assert.equal(f.values.get(key), '2026.11.16');
  f.close('close');
  await pending;
  assert.equal(f.values.size, 1);
  assert.notEqual(f.values.get(key), '2026.11.16');
  assert.deepEqual(f.writes.map(([name]) => name), [key]);
});

test('Auch Schließen per Escape merkt die gesehene Version', async () => {
  const f = fixture();
  const pending = f.ui.bindRelease(f.modal);
  f.close('cancel');
  await pending;
  assert.equal(f.writes.length, 1);
});

test('Gesperrter Browserspeicher verhindert weder Anzeige noch Weiterlernen', async () => {
  const f = fixture(null, true);
  const pending = f.ui.bindRelease(f.modal);
  assert.equal(f.opened.length, 1);
  f.close('close');
  await pending;
  assert.equal(f.writes.length, 0);
});

test('Gemeinsamer Einstieg reiht Release vor Geschichte und weiteren Modalen ein', () => {
  const order = [];
  class Modal { open() {} }
  class Toasts { show() {} }
  class Support { open() {} bind() { order.push('support'); } }
  const ui = { Modal, Toasts, Support };
  for (const name of ['Release', 'Accessibility', 'Story', 'Details', 'PageTools', 'Theme']) {
    ui['bind' + name] = () => order.push(name.toLowerCase());
  }
  vm.runInNewContext(readFileSync(resolve(__dirname, '../ui/common.js'), 'utf8'), {
    window: { LHUNDG_UI_PARTS: ui }, document: { querySelectorAll: () => [] }
  });
  assert.equal(order[0], 'release');
  assert.ok(order.indexOf('release') < order.indexOf('story'));
});

/** Bereits gesehene Updates bleiben über den Footer erreichbar, ohne parallele Dialogkopien zu erzeugen. */
test('Footer öffnet auch ein bereits gesehenes Update erneut und erhält den Fokusauslöser', async () => {
  const f = fixture();
  const automatic = f.ui.bindRelease(f.modal);
  f.close('close');
  await automatic;
  let prevented = false;
  const click = { preventDefault() { prevented = true; } };
  const manual = f.trigger.handlers.click(click);
  await f.trigger.handlers.click(click);
  assert.equal(f.opened.length, 2);
  assert.equal(f.opened[1].returnFocus, f.trigger);
  assert.equal(prevented, true);
  f.close('close');
  await manual;
  assert.equal(f.values.size, 1);
});

/** Modifizierte Linkklicks behalten die native Browserbedienung. */
test('Strg-Klick auf den Update-Link wird nicht als Popup-Klick abgefangen', async () => {
  const f = fixture();
  const automatic = f.ui.bindRelease(f.modal);
  f.close('close');
  await automatic;
  await f.trigger.handlers.click({ ctrlKey: true, preventDefault() { assert.fail('Native Navigation abgefangen'); } });
  assert.equal(f.opened.length, 1);
});


/** @param {object} root Inhaltsbaum. @returns {object[]} Alle sicheren Textknoten. */
function nodes(root) {
  return [root, ...root.children.flatMap(nodes)];
}

test('Aktuelle Neuigkeiten stehen vor der lesbaren Design-Historie mit Versionskennung', async () => {
  const f = fixture();
  const pending = f.ui.bindRelease(f.modal);
  const content = f.opened[0].content;
  const history = content.children.at(-1);
  assert.equal(history.className, 'release-history');
  assert.equal(history.children[0].text, 'Frühere Updates');
  const entries = history.children.filter(node => node.tag === 'article');
  assert.equal(entries.length, 1);
  const text = nodes(entries[0]).map(node => node.text).join(' ');
  assert.match(text, /2026\.11\.17/);
  assert.match(text, /Design-Refactoring/);
  assert.match(text, /Naturfarben/);
  assert.match(text, /Magazinformat/);
  assert.match(text, /eigenständiger Lernbereich/);
  assert.equal(f.opened[0].closeButton, true);
  assert.equal(f.writes.length, 0);
  f.close('close');
  await pending;
  assert.deepEqual(f.writes, [[key, f.opened[0].eyebrow.split(' ').at(-1)]]);
});

test('Auch der manuelle Einstieg zeigt die Historie und speichert keine einzelnen Historieneinträge', async () => {
  const f = fixture();
  const automatic = f.ui.bindRelease(f.modal);
  f.close('close');
  await automatic;
  const current = f.values.get(key);
  const manual = f.trigger.handlers.click({ preventDefault() {} });
  assert(nodes(f.opened[1].content).some(node => node.text === 'Das große Design-Refactoring.'));
  assert.equal(f.values.get(key), current);
  f.close('cancel');
  await manual;
  assert.equal(f.values.size, 1);
  assert(f.writes.every(([name, value]) => name === key && value === current));
});
