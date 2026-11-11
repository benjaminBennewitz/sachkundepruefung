/* scripts/quality/checks.test.mjs */

/**
 * @file Regressionstests der Qualitätswerkzeuge.
 * @description Manipuliert ausschließlich temporäre Kopien und prüft die echten CLI-Einstiege und Datenregeln.
 * @author Benjamin Bennewitz [B²]
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fixture, edit, run, snapshot } from './quality-fixtures.mjs';
import { elements } from './markup.mjs';
import { checkQuestions } from './data-rules.mjs';
import fixtures from './learning-fixtures.cjs';
import { projectRoot } from '../config.mjs';

/**
 * Prüft Prozessfehler und Exitstatus und zeigt bei Abweichung die Werkzeugausgabe.
 *
 * @param {object} result Prozessresultat.
 * @param {number} [status] Erwarteter Exitstatus; ohne Angabe wird Erfolg erwartet.
 * @returns {void} Kein Rückgabewert.
 */
function expectStatus(result, status = 0) {
  assert.ifError(result.error);
  assert.equal(result.status, status, result.stdout + result.stderr);
}

/**
 * Entfernt aktive strukturierte Daten als gezielte Fehleingabe des SEO-Tests.
 *
 * @param {string} source Index-HTML.
 * @returns {string} Dieselbe Seite ohne aktive strukturierte Daten.
 */
function removeJsonLd(source) {
  return source.replace(/<script\b(?=[^>]*type=["']application\/ld\+json["'])[^>]*>[\s\S]*?<\/script>/i, '');
}

/**
 * Verschiebt den gültigen Hash in die falsche CSP-Richtlinie als gezielte Fehleingabe.
 *
 * @param {string} source Apache-Konfiguration.
 * @returns {string} Hash im falschen CSP-Bereich als gezielte Fehleingabe.
 */
function moveHash(source) {
  const hash = source.match(/'sha256-[^']+'/)[0];  // Der gültige Wert bleibt erhalten, nur seine Richtlinie wird falsch.

  return source.replace(hash, '').replace('style-src ', `style-src ${hash} `);
}

/**
 * Lädt eine unabhängige Kopie einer echten eigenen Rechtsfrage als Testeingabe.
 *
 * @returns {object} Einzelne eigene Rechtsfrage mit lokalen Objektprototypen.
 */
function example() {
  const { scope } = fixtures.environment(['data', 'essen']);  // Isolierte echte Datenmodule als Quelle einer unabhängigen Rechtsfrage.

  return fixtures.plain(scope.LHUNDG_DATA.essenExamples.find(question => question.example));
}

test('Markup trennt echte Attribute von data-id, Kommentaren und Rohtext', () => {
  // Gezielte HTML-Testeingabe mit den für diesen Fall relevanten Attributen und Rohtextblöcken.
  const html = `<!-- <a id="fake" href="missing"> --><script>const x = '<a id="fake">';</script>
    <a DATA-ID="extra" ID='real' href=page.html?x=1&amp;y=2 title="a > b">Link</a>`;
  const tags = elements(html);  // Weder Kommentar noch JavaScript-String erzeugen einen Link.

  assert.equal(tags.length, 2);
  assert.deepEqual(tags[1].attributes, { 'data-id': 'extra', id: 'real', href: 'page.html?x=1&y=2', title: 'a > b' });
});

test('Pfadprüfung akzeptiert vorhandene Verweise und Sprungziele mit einfachen Quotes', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'index.html', html =>
    html.replace('</body>', `<a id='quality-target' href='#quality-target'>Test</a></body>`)
  );

  expectStatus(run(root, 'quality/check-paths.mjs'));
});

test('Pfadprüfung lehnt einen fehlenden Verweis mit einfachen Quotes ab', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'index.html', html => html.replace('</body>', `<a href='missing-quality-target.html'>Test</a></body>`));

  const result = run(root, 'quality/check-paths.mjs');  // Ausgabe und Exitstatus des tatsächlich ausgeführten Prüfeinstiegs.

  expectStatus(result, 1);
  assert.match(result.stderr, /missing-quality-target/);
});

test('Pfadprüfung ignoriert auskommentierte Links und zählt data-id nicht als ID', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'index.html', html =>
    html.replace(
      '</body>',
      `<!-- <a href='missing.html'> -->
    <span data-id='same'></span><span data-id='same'></span></body>`
    )
  );

  expectStatus(run(root, 'quality/check-paths.mjs'));
});

test('Pfadprüfung erkennt doppelte echte IDs und fehlende gleichnamige absolute Projektverweise', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'index.html', html => html.replace('</body>', `<span id='dup'></span><span id='dup'></span></body>`));

  const duplicate = run(root, 'quality/check-paths.mjs');  // Resultat des Pfadprüfers mit absichtlich doppelt vergebenen Element-IDs.

  expectStatus(duplicate, 1);
  assert.match(duplicate.stderr, /Doppelte HTML-ID/);
  edit(root, 'index.html', html => html.replaceAll(" id='dup'", " data-id='dup'"));
  edit(root, 'index.html', html =>
    html.replace('</body>', `<a href="https://hunde-sachkundetrainer.de/nrw/missing.html">Test</a></body>`)
  );

  expectStatus(run(root, 'quality/check-paths.mjs'), 1);
});

test('SEO-Prüfung erkennt dieselben Metadaten mit einfachen statt doppelten Quotes', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  // Nur Attribute im Seitenkopf ändern ihre Quotes; JSON-LD-Inhalt und CSP-Hash bleiben identisch.
  edit(root, 'index.html', html =>
    html
      .replace(/<(meta|link)\b[^>]*>/gi, tag => tag.replace(/="([^"]*)"/g, "='$1'"))
      .replace('type="application/ld+json"', "type='application/ld+json'")
  );

  expectStatus(run(root, 'quality/check-seo.mjs'));
});

test('SEO-Prüfung lehnt fehlendes JSON-LD ab', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'index.html', removeJsonLd);

  const result = run(root, 'quality/check-seo.mjs');  // Ausgabe und Exitstatus des tatsächlich ausgeführten Prüfeinstiegs.

  expectStatus(result, 1);
  assert.match(result.stderr, /genau ein JSON-LD/);
});

test('SEO-Prüfung akzeptiert auskommentiertes JSON-LD nicht als vorhandene Projektdaten', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'index.html', html =>
    html.replace(/(<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>)/i, '<!-- $1 -->')
  );

  expectStatus(run(root, 'quality/check-seo.mjs'), 1);
});

test('SEO-Prüfung lehnt einen korrekten Hash in style-src ab', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, '.htaccess', moveHash);

  const result = run(root, 'quality/check-seo.mjs');  // Ausgabe und Exitstatus des tatsächlich ausgeführten Prüfeinstiegs.

  expectStatus(result, 1);
  assert.match(result.stderr, /CSP blockiert/);
});

test('SEO-Prüfung nutzt auskommentierte CSP-Header nicht als Scriptfreigabe', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, '.htaccess', source => source.replace(/^([ \t]*Header[^\r\n]*Content-Security-Policy[^\r\n]*)/gm, '# $1'));

  expectStatus(run(root, 'quality/check-seo.mjs'), 1);
});

test('Eigene Rechtsfragen werden mit denselben strengen Antwortregeln geprüft', () => {
  const question = example();  // Eine ungültige Auswahl muss bereits vor der Poolstatistik scheitern.

  question.correct = ['X'];

  assert.throws(() => checkQuestions([question], {}, projectRoot), /Ungültige Lösung/);
  question.correct = ['A', 'A'];

  assert.throws(() => checkQuestions([question], {}, projectRoot), /Doppelte Lösung/);
});

test('Eigene Rechtsfragen benötigen Kennzeichnung und amtliche HTTPS-Quellen', () => {
  const question = example();  // Unabhängige eigene Rechtsfrage, die ausschließlich als Testeingabe verändert wird.

  question.example = false;

  assert.throws(() => checkQuestions([question], {}, projectRoot));
  question.example = true;
  question.sourceUrl = 'https://example.org/';

  assert.throws(() => checkQuestions([question], {}, projectRoot), /Unbekannte Beispielquelle/);
});

test('Der Datenvalidator erfasst Essen und verändert im Standardlauf weder Bericht noch HTML', context => {
  const root = fixture(context);                                             // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.
  const before = readFileSync(resolve(root, 'docs/validation.json'));        // Referenz des dokumentierten Berichts vor dem Prüflauf.
  const modified = statSync(resolve(root, 'docs/validation.json')).mtimeMs;  // Änderungszeit des Berichts vor dem Lauf; auch identisches Neuschreiben würde auffallen.
  const html = snapshot(root);  // Bytegenauer Ausgangsstand aller Root-Seiten.
  const result = run(root, 'quality/validate-data.mjs');  // Ausgabe und Exitstatus des tatsächlich ausgeführten Prüfeinstiegs.

  expectStatus(result);
  assert.equal(JSON.parse(result.stdout).exampleQuestions, 16);
  assert.equal(JSON.parse(result.stdout).counts.essenExamples, 50);
  assert.deepEqual(readFileSync(resolve(root, 'docs/validation.json')), before);
  assert.equal(statSync(resolve(root, 'docs/validation.json')).mtimeMs, modified);
  assert.deepEqual(snapshot(root), html);
});

test('Nur --write-report aktualisiert den Prüfbericht einschließlich Herkunftsgrenze', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'docs/validation.json', () => '{}\r\n');

  expectStatus(run(root, 'quality/validate-data.mjs', ['--write-report']));

  const report = readFileSync(resolve(root, 'docs/validation.json'), 'utf8');  // Ausdrücklich neu geschriebene Prüfaufnahme zur Inhalts- und CRLF-Kontrolle.

  assert.equal(JSON.parse(report).exampleQuestions, 16);
  assert.match(report, /keine erneute PDF-/);
  assert(!/(?<!\r)\n/.test(report), 'Bericht muss CRLF verwenden.');
});

test('Release-Prüfung erhält die vorhandene manuelle Rechtefreigabe als Pflicht', context => {
  const result = run(fixture(context), 'quality/check-release.mjs');  // Ausgabe und Exitstatus des tatsächlich ausgeführten Prüfeinstiegs.

  expectStatus(result, 1);
  assert.match(result.stderr, /Freigabe zur öffentlichen Übernahme/);
});

test('Der echte Daten-CLI verwirft eine ungültige Lösung im Essen-Modul', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'scripts/learning/essen.js', source => source.replace(/("correct":\s*\[)[\s\S]*?\]/, '$1"X"]'));

  const result = run(root, 'quality/validate-data.mjs');  // Ausgabe und Exitstatus des tatsächlich ausgeführten Prüfeinstiegs.

  expectStatus(result, 1);
  assert.match(result.stderr, /Ungültige Lösung/);
});

test('Abbildungsverweise müssen auf echte Dateien statt Verzeichnisse zeigen', () => {
  const question = example();  // Unabhängige eigene Rechtsfrage, die ausschließlich als Testeingabe verändert wird.

  question.images = ['assets'];

  assert.throws(() => checkQuestions([question], {}, projectRoot), /Fehlende Abbildung/);
});

test('Release-Prüfung lehnt eine fremde Domain trotz PayPal im Namen ab', context => {
  const root = fixture(context);  // Temporäre Projektwurzel; alle Änderungen dieses Tests bleiben in dieser Kopie.

  edit(root, 'scripts/site-config.js', source =>
    source.replace('https://paypal.me/BBennewitz', 'https://paypal.me.example.org/')
  );

  const result = run(root, 'quality/check-release.mjs');  // Ausgabe und Exitstatus des tatsächlich ausgeführten Prüfeinstiegs.

  expectStatus(result, 1);
  assert.match(result.stderr, /Gültige HTTPS-PayPal-Adresse/);
});
