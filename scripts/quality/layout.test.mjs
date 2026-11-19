/* scripts/quality/layout.test.mjs */

/**
 * @file Regressionstests für die gemeinsamen Layoutvorlagen.
 * @description Prüft SSI-Varianten, Navigationsanker und den zentralen Austausch eines Fragments.
 * @author Benjamin Bennewitz [B²]
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { projectRoot } from '../config.mjs';
import { elements } from './markup.mjs';
import { readLayoutPage } from './layout-includes.mjs';
import { edit, snapshot } from './quality-fixtures.mjs';

test('Layoutvorlagen erhalten aktive Navigation und direkte Traineraktionen', () => {
  const pages = snapshot(projectRoot);
  for (const [name, html] of pages) {
    assert.match(html.toString('utf8'), /<!--#include virtual="templates\/site-header\.html" -->/);
    const tags = elements(readLayoutPage(join(projectRoot, name)));
    assert.equal(tags.filter(tag => tag.attributes.class === 'site-header wrap').length, 1, name);
    const current = tags.filter(tag => tag.attributes['aria-current'] === 'page');
    const isWorkspace = name === 'lernen.html';
    const expectedHref = {
      'index.html': './',
      'lernen.html': 'lernen.html#trainer',
      'grundlagen.html': 'grundlagen.html',
      'gut-zu-wissen.html': 'gut-zu-wissen.html',
      'hundewissen.html': 'hundewissen.html',
      'quellen.html': 'quellen.html'
    }[name];
    assert.deepEqual(current.map(tag => tag.attributes.href), expectedHref ? [expectedHref] : [], name);

    for (const id of ['importTrigger', 'importProgress', 'exportProgress', 'reset', 'previous', 'next']) {
      assert.equal(tags.filter(tag => tag.attributes.id === id).length, isWorkspace ? 1 : 0, `${name}: ${id}`);
    }
    assert.equal(tags.filter(tag => tag.attributes.id === 'geschichte').length, name === 'index.html' || isWorkspace ? 1 : 0, name);
    assert.equal(tags.filter(tag => tag.attributes.class === 'site-footer wrap').length, isWorkspace ? 0 : 1, name);
    assert.equal(tags.filter(tag => tag.attributes.class === 'workspace-footer').length, isWorkspace ? 1 : 0, name);
  }
});

test('Eine Änderung an der Vorlage wirkt auf die Seiten, ohne deren Quelldateien zu ändern', context => {
  const root = mkdtempSync(join(tmpdir(), 'lhundg-layout-'));
  context.after(() => rmSync(root, { force: true, recursive: true }));
  for (const name of ['index.html', 'quellen.html', 'templates']) {
    cpSync(join(projectRoot, name), join(root, name), { recursive: true });
  }

  const original = snapshot(root);
  edit(root, 'templates/site-footer.html', html => html.replace('Originalquellen</a>', 'Quellen ansehen</a>'));

  for (const name of original.keys()) {
    const file = join(root, name);
    assert.match(readLayoutPage(file), /Quellen ansehen<\/a>/);
    assert.deepEqual(readFileSync(file), original.get(name));
  }
});
