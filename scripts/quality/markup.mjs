/* scripts/quality/markup.mjs */

/**
 * @file Gemeinsames Lesen des statischen Projekt-Markups.
 * @description Erkennt Attribute und Rohtextblöcke ohne DOM-Abhängigkeit; kein vollständiger HTML-Validator.
 * @author Benjamin Bennewitz [B²]
 */
// Kommentare und Rohtext werden als Ganzes erfasst, damit darin enthaltene Tags keine Verweise vortäuschen.
const tags =
  /<!--[\s\S]*?-->|<(script|style|title|textarea)\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/\1\s*>|<([a-z][\w:-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi;
const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' };  // Unterstützte benannte HTML-Zeichenreferenzen ohne zusätzliche DOM-Abhängigkeit.

/**
 * Löst unterstützte benannte und numerische HTML-Zeichenreferenzen auf.
 *
 * @param {string} value Attribut oder Text.
 * @returns {string} Aufgelöste Standard- und numerische Zeichenreferenzen.
 */
export function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, decodeEntity);
}

/**
 * Liest HTML-Attribute unabhängig von der verwendeten Anführungszeichenart.
 *
 * @param {string} source Attributbereich eines Tags.
 * @returns {Object<string, string>} Attributwerte unter kleingeschriebenen Namen.
 */
export function attributes(source) {
  const values = {};                                                                // Nur vollständige Attributnamen zählen; data-id ist keine id.
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'<>`]+)))?/g;  // Erkennt vollständige Attributnamen sowie alle drei unterstützten Arten von Attributwerten.

  // Einfach, doppelt und nicht angeführte Werte entsprechen denselben HTML-Attributen.
  for (const match of source.matchAll(pattern)) {
    const name = match[1].toLowerCase();  // Normalisierter Attributname; die Attributwerte behalten ihre Schreibweise.

    values[name] ??= decodeEntities(match[2] ?? match[3] ?? match[4] ?? '');
  }

  return values;
}

/**
 * Liest öffnende Elemente, ohne Kommentare oder Rohtext als weiteres HTML auszuwerten.
 *
 * @param {string} html Unveränderte Root-Seite.
 * @returns {object[]} Öffnende Elemente mit Name, Attributen und optionalem Rohtextinhalt.
 */
export function elements(html) {
  const result = [];  // Dokumentreihenfolge bleibt für Mehrfachangaben und Diagnose erhalten.

  // Rohtextblöcke werden nicht rekursiv als HTML ausgewertet.
  for (const match of html.matchAll(tags)) {
    // Auskommentierte Verweise und Metadaten gehören nicht zum aktiven Dokument.
    if (match[0].startsWith('<!--')) continue;

    result.push(elementFromMatch(match));
  }

  return result;
}

/**
 * Dekodiert eine einzelne unterstützte HTML-Zeichenreferenz.
 *
 * @param {string} token Vollständige Referenz als unveränderter Ersatz bei ungültigen Werten.
 * @param {string} key Name oder numerischer Inhalt zwischen & und Semikolon.
 * @returns {string} Dekodiertes Zeichen oder unveränderte Referenz.
 */
function decodeEntity(token, key) {
  // Benannte Referenzen lassen sich direkt über die unterstützten HTML-Zeichen auflösen.
  if (!key.startsWith('#')) return entities[key.toLowerCase()] ?? token;

  const hex = key[1].toLowerCase() === 'x';                             // Hexadezimale Referenzen beginnen mit #x.
  const code = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);  // Unicode-Codepunkt der numerischen Referenz.

  // Ungültige Unicode-Werte bleiben für die nachfolgende Prüfung sichtbar.
  if (code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return token;

  return String.fromCodePoint(code);
}

/**
 * Überträgt einen erkannten Rohtextblock oder ein öffnendes Tag in die gemeinsame Elementform.
 *
 * @param {RegExpMatchArray} match Treffer des gemeinsamen Markup-Musters.
 * @returns {object} Elementname, gelesene Attribute und gegebenenfalls Rohtextinhalt.
 */
function elementFromMatch(match) {
  return {
    name: (match[1] ?? match[4]).toLowerCase(),
    attributes: attributes(match[2] ?? match[5]),
    content: match[3] ?? ''
  };
}
