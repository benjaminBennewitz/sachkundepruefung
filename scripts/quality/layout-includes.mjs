/* scripts/quality/layout-includes.mjs */

/**
 * @file Prüfansicht für die Apache-Layout-Includes.
 * @description Löst die im Projekt verwendeten SSI-Anweisungen für lokale Markup- und Pfadprüfungen auf.
 * @author Benjamin Bennewitz [B²]
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const condition = /<!--#if expr='([^']+)' -->([\s\S]*?)<!--#endif -->/g;
const include = /<!--#include virtual="((?:templates\/)?[a-z-]+\.html)" -->/g;
const documentName = /^v\("DOCUMENT_NAME"\) = "([a-z-]+\.html)"$/;

/**
 * Liest Root-HTML einschließlich seiner Kopf- und Fußbereiche für die lokalen Prüfwerkzeuge.
 * @param {string} file Absoluter Pfad zur Root-HTML-Datei.
 * @returns {string} Ausgabe mit aufgelösten Layout-Teildateien.
 */
export function readLayoutPage(file) {
  return readFragment(file, basename(file), [file]);
}

/**
 * Liest eine Datei und wertet die projektspezifischen Seitenvarianten und relativen Includes aus.
 * @param {string} file Absoluter Pfad der gelesenen Datei.
 * @param {string} page Dateiname der ursprünglich angeforderten Seite.
 * @param {string[]} chain Aktuelle Include-Kette zur Erkennung von Schleifen.
 * @returns {string} HTML-Fragment für die angeforderte Seite.
 */
function readFragment(file, page, chain) {
  const html = readFileSync(file, 'utf8');
  const selected = html.replace(condition, (_, expression, body) => {
    const alternatives = expression.split(' || ').map(part => documentName.exec(part));
    assert(alternatives.every(Boolean), `Unbekannter SSI-Ausdruck in ${file}: ${expression}`);
    const [matched, fallback = ''] = body.split('<!--#else -->');
    return alternatives.some(match => match[1] === page) ? matched : fallback;
  });

  const output = selected.replace(include, (_, path) => {
    const target = resolve(dirname(file), path);
    assert(!chain.includes(target), `Zyklisches SSI-Include: ${[...chain, target].join(' → ')}`);
    return readFragment(target, page, [...chain, target]);
  });
  assert(!output.includes('<!--#'), `Unbekannte oder unvollständige SSI-Anweisung in ${file}`);
  return output;
}
