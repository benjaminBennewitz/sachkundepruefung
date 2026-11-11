/* scripts/quality/validate-data.mjs */

/**
 * @file Prüfung der Fragen und Lösungsschlüssel.
 * @description Prüft Kataloge und Essen-Beispiele; schreibt einen Bericht ausschließlich mit --write-report.
 * @author Benjamin Bennewitz [B²]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot } from '../config.mjs';
import fixtures from './learning-fixtures.cjs';
import { checkQuestions, checkPools, checkSections } from './data-rules.mjs';

const { scope } = fixtures.environment(['data', 'essen']);                                                      // Dieselben klassischen Datenmodule wie im Browser.
const data = fixtures.plain(scope.LHUNDG_DATA);                                                                 // Lokale Objektprototypen erlauben strenge Strukturvergleiche.
const originals = fixtures.plain(scope.LHUNDG_QUESTIONS);                                                       // Enthält keine Poolkopien und keine eigenen Rechtsbeispiele.
const examples = data.essenExamples.filter(question => question.example);                                       // Eigene Rechtsbeispiele aus dem Beispielpool; kopierte Originalfragen zählen nicht erneut.
const questions = [...originals, ...examples];                                                                  // Jede eigenständige Frage wird genau einmal inhaltlich geprüft.
const expected = JSON.parse(readFileSync(resolve(projectRoot, 'scripts/quality/official-keys.json'), 'utf8'));  // Unveränderter gespeicherter Referenzschlüssel für den lokalen Schlüsselvergleich.

/**
 * Erstellt die technische Prüfaufnahme mit getrenntem Prüf- und Quellenstand.
 *
 * @param {object} counts Geprüfte Poolgrößen.
 * @returns {object} Aktueller technischer Bericht mit abgegrenztem Quellenstand.
 */
function report(counts) {
  return {
    version: 36,
    date: new Date().toISOString().slice(0, 10),
    referenceDate: '2026-11-06',
    verification: 'Lokaler Struktur- und Referenzvergleich; keine erneute PDF- oder Rechtsprüfung.',
    counts,
    canonicalQuestions: originals.length,
    exampleQuestions: examples.length,
    missingKeys: 0,
    invalidKeys: 0,
    missingAssets: 0,
    verifiedOfficialKeys: { legacy203: 203, kammer197: 197 },
    inheritedProvidedKeys: { rhein97: 97, koeln: 115 },
    correctedLegacyQuestions: [158, 160, 161]
  };
}

checkQuestions(questions, expected, projectRoot);                  // Prüft Identität, Antwortstruktur, Dateien und Beispielmetadaten.
const counts = checkPools(data, questions);                        // Stellt bekannte Referenzen und unveränderte Poolfragen sicher.
checkSections(data.essenExamples, scope.LHUNDG_ESSEN_SECTIONS);    // Bestätigt ausschließlich die eigene Beispielverteilung.
const output = JSON.stringify(report(counts), null, 2);            // Auch ein reiner Prüflauf zeigt das Ergebnis auf der Konsole.

// Nur dieser ausdrücklich angegebene Schalter aktualisiert die dokumentierte Prüfaufnahme.
if (process.argv.includes('--write-report')) {
  writeFileSync(resolve(projectRoot, 'docs/validation.json'), output.replace(/\n/g, '\r\n') + '\r\n');
}
console.log(output);
