/* scripts/quality/html-preservation.test.mjs */

/**
 * @file Integrationstests zum Erhalt der Root-HTML-Dateien.
 * @description Führt die echte Deployment-Vorbereitung in isolierten Projektkopien aus und vergleicht die HTML-Bytes.
 * @author Benjamin Bennewitz [B²]
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fixture, run, snapshot } from './quality-fixtures.mjs';

/**
 * Vergleicht Anzahl und Bytes der Root-Seiten mit ihrem Zustand vor der Vorbereitung.
 *
 * @param {string} root Absolute Wurzel der temporären Projektkopie.
 * @param {Map<string, Buffer>} before Root-Seiten vor dem geprüften Prozess.
 * @returns {void} Kein Rückgabewert.
 */
function assertUnchanged(root, before) {
  const after = snapshot(root);  // Tatsächlicher Dateistand nach Abschluss des Vorbereitungsprozesses.

  assert.deepEqual([...after.keys()], [...before.keys()]);

  // Jede Seite bleibt einschließlich ihrer ursprünglichen Formatierung exakt erhalten.
  for (const [name, bytes] of before) assert.deepEqual(after.get(name), bytes, name);
}

/**
 * Formatiert JSON-LD nur in der Testkopie als Eingabe für den HTML-Erhaltungstest.
 *
 * @param {string} root Absolute Wurzel der temporären Projektkopie.
 * @returns {void} Kein Rückgabewert.
 */
function formatStructuredData(root) {
  const path = resolve(root, 'index.html');  // Nur die Startseite der Testkopie wird als Testeingabe formatiert.
  const html = readFileSync(path, 'utf8');   // Der vorhandene Script-Rahmen einschließlich seiner Attributzeilen bleibt erhalten.
  // Neu formatierte Testeingabe: Der Script-Rahmen bleibt erhalten; nur JSON erhält Einrückung und CRLF.
  const formatted = html.replace(
    /(<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>)([\s\S]*?)(<\/script>)/i,
    (_, start, value, end) =>
      `${start}\r\n${JSON.stringify(JSON.parse(value), null, 2).replace(/\n/g, '\r\n')}\r\n${end}`
  );

  writeFileSync(path, formatted);
}

test('Die reine Deployment-Prüfung verändert keine Root-HTML-Datei', context => {
  const root = fixture(context);                                         // Alle weiteren Prozesse arbeiten ausschließlich in dieser Kopie.
  const before = snapshot(root);                                         // Bytegenaue Referenz des vom Betreiber gepflegten HTML-Stands.
  const result = run(root, 'prepare-deployment.mjs', ['--check-only']);  // Führt Daten-, Funktions-, Pfad- und SEO-Prüfungen tatsächlich aus.

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assertUnchanged(root, before);
});

test('Auch der CSP-Abgleich erhält formatiertes Root-HTML ohne Rechtebestätigung oder Veröffentlichung', context => {
  const root = fixture(context);  // Ein vorhandener Veröffentlichungsnachweis wird für diesen Test nicht behauptet.

  formatStructuredData(root);  // Erzeugt eine absichtlich formatierte HTML-Testeingabe mit verändertem CSP-Hash.

  const before = snapshot(root);                             // Enthält die ausdrücklich beizubehaltende JSON-Einrückung und CRLF-Zeilenenden.
  const headers = readFileSync(resolve(root, '.htaccess'));  // Der frühere Hash passt noch nicht zum formatierten Script.
  const result = run(root, 'prepare-deployment.mjs');        // Erreicht den CSP-Abgleich und die anschließenden Prüfungen, aber keine Veröffentlichung.

  assert.equal(result.status, 1);  // Die bestehende Release-Prüfung verlangt weiterhin die hier absichtlich fehlende Freigabe.
  assert.match(result.stderr, /Freigabe zur öffentlichen Übernahme/);
  assert.notDeepEqual(readFileSync(resolve(root, '.htaccess')), headers);
  assertUnchanged(root, before);
});
