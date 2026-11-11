/* scripts/quality/data-rules.mjs */

/**
 * @file Strukturregeln für Katalogfragen und eigene Beispiele.
 * @description Trennt wiederverwendbare Datenprüfungen von Dateiladen, Bericht und Konsolenausgabe.
 * @author Benjamin Bennewitz [B²]
 */
import assert from 'node:assert/strict';
import { existsSync, statSync, realpathSync } from 'node:fs';
import { resolve, relative, sep, isAbsolute } from 'node:path';

/**
 * Prüft angebotene Multiple-Choice-Optionen, Antworttexte und Lösungstokens.
 *
 * @param {object} question Multiple-Choice-Frage mit Optionen, Antworttexten und Lösung.
 * @returns {void} Kein Rückgabewert.
 */
function checkOptions(question) {
  const { options, answers, correct, uid } = question;  // Antwortoptionen, Texte und Schlüssel dieser Frage; die UID ordnet Fehler eindeutig zu.

  assert(Array.isArray(options) && options.length, `Fehlende Optionen ${uid}`);
  assert.equal(new Set(options).size, options.length, `Doppelte Option ${uid}`);

  // Jeder sichtbare Auswahlwert benötigt einen lesbaren Antworttext.
  for (const token of options) assert(answers[token]?.trim(), `Fehlender Antworttext ${uid}:${token}`);

  // Der Schlüssel darf ausschließlich tatsächlich angebotene Optionen benennen.
  for (const token of correct) assert(options.includes(token), `Ungültige Lösung ${uid}:${token}`);
}

/**
 * Prüft die vollständige und eindeutige Lösung einer Zuordnungsfrage.
 *
 * @param {object} question Zuordnungsfrage mit Schlüsseln und angebotenen Zielen.
 * @returns {void} Kein Rückgabewert.
 */
function checkMapping(question) {
  const { mappingKeys, correct, uid } = question;  // Zeilen und Lösungsschlüssel der Zuordnungsfrage.

  assert.equal(new Set(mappingKeys).size, mappingKeys.length, `Doppelte Zuordnung ${uid}`);
  assert.equal(mappingKeys.length, correct.length, `Unvollständige Zuordnung ${uid}`);

  // Jede Zeile muss genau eine gültige Lösung besitzen.
  for (const key of mappingKeys) assert.equal(correct.filter(token => token.startsWith(`${key}:`)).length, 1, uid);

  // Jedes Lösungspaar muss aus einer angebotenen Zeile und einem angebotenen Ziel bestehen.
  for (const token of correct) checkMappingPair(question, token);
}

/**
 * Prüft die Bildkennzeichnung und lokale Abbildungen einer Frage.
 *
 * @param {string} root Absolute Projektwurzel.
 * @param {object} question Frage mit Bildkennzeichnung und Bildpfaden.
 * @returns {void} Kein Rückgabewert.
 */
function checkImages(root, question) {
  assert.equal(typeof question.requiresVisual, 'boolean', `Fehlende Bildkennzeichnung ${question.uid}`);
  assert(Array.isArray(question.images), `Fehlende Bildliste ${question.uid}`);

  // Eine ausdrücklich visuelle Aufgabe darf keine leere Bildliste haben.
  if (question.requiresVisual) assert(question.images.length, `Fehlende Aufgabenabbildung ${question.uid}`);

  // Auch optionale Abbildungen müssen als echte Datei innerhalb des Pakets vorliegen.
  for (const image of question.images) checkImageFile(root, image);
}

/**
 * Prüft die Fragenkennungen und registriert sie für die Erkennung von Duplikaten.
 *
 * @param {object} question Frage mit stabiler ID, UID und Quellen-ID.
 * @param {Set[]} seen Getrennte Mengen für bereits belegte ID, UID und Quellen-ID.
 * @returns {void} Kein Rückgabewert.
 */
function checkIdentity(question, seen) {
  const values = [question.id, question.uid, `${question.sourceKey}:${question.sourceId}`];  // Getrennt zu prüfende ID, UID und Quellenkennung derselben Frage.

  assert(
    Number.isInteger(question.id) && question.uid && question.sourceKey && question.sourceId,
    'Unvollständige Fragenidentität'
  );

  // ID, UID und Quellen-ID werden jeweils unabhängig auf Doppelbelegung geprüft.
  for (const [index, value] of values.entries()) {
    assert(!seen[index].has(value), `Doppelte Fragenkennung ${value}`);
    seen[index].add(value);
  }
}

/**
 * Vergleicht einen hinterlegten amtlichen Lösungsschlüssel mit der Katalogfrage.
 *
 * @param {object} question Frage.
 * @param {object} expected Gespeicherter amtlicher Referenzschlüssel.
 * @returns {void} Kein Rückgabewert.
 */
function checkReferenceKey(question, expected) {
  const catalogue = expected[question.sourceKey];  // Nur die beiden ausdrücklich hinterlegten Quellen sind Referenzschlüssel.

  // Zugesandte Kataloge und eigene Beispiele besitzen keine solche amtliche Vergleichsdatei.
  if (!catalogue) return;

  assert.deepEqual(
    [...question.correct].sort(),
    catalogue[question.sourceId],
    `Lösung weicht vom Referenzschlüssel ab: ${question.uid}`
  );
}

/**
 * Prüft Kennzeichnung, Erläuterung und Quellenmetadaten einer eigenen Rechtsfrage.
 *
 * @param {object} question Eigene, ausdrücklich gekennzeichnete Rechtsfrage.
 * @returns {void} Kein Rückgabewert.
 */
function checkExample(question) {
  assert.equal(question.sourceKey, 'essenExample');
  assert.equal(question.examSection, 'law');
  assert.equal(question.example, true);
  assert.equal(question.options.length, 4);
  assert(question.correct.length < 4, `Unbrauchbare Beispielauswahl ${question.uid}`);

  checkExampleSource(question);  // Prüft Protokoll und amtlichen Host der angegebenen Quelle.

  assert(question.legalReference?.startsWith('§'), `Fehlende Rechtsgrundlage ${question.uid}`);
  assert(question.explanation?.length > 30, `Fehlende Erläuterung ${question.uid}`);
}

/**
 * Prüft jede eigenständige Frage mit den Regeln ihres Fragetypen und ihrer Herkunft.
 *
 * @param {object[]} questions Originale und eigene Fragen ohne Poolkopien.
 * @param {object} expected Referenzen.
 * @param {string} root Projektwurzel.
 * @returns {void} Kein Rückgabewert.
 */
export function checkQuestions(questions, expected, root) {
  const seen = [new Set(), new Set(), new Set()];  // Getrennte Eindeutigkeitsmengen für ID, UID und Quellen-ID.

  // Poolkopien werden separat verglichen; hier wird jede eigenständige Frage genau einmal geprüft.
  for (const question of questions) {
    checkIdentity(question, seen);            // Schützt die dauerhaft verwendeten Fragenkennungen.
    checkQuestion(question, expected, root);  // Prüft Antwortstruktur, Abbildungen und Herkunft.
  }
}

/**
 * Prüft bekannte, unveränderte Poolfragen und ermittelt die tatsächlichen Poolgrößen.
 *
 * @param {object} data Laufzeitpools.
 * @param {object[]} questions Bekannte Fragen.
 * @returns {object} Tatsächliche Poolgrößen.
 */
export function checkPools(data, questions) {
  const known = new Map(questions.map(question => [question.uid, question]));  // Unveränderte Vorlagen nach UID.
  const counts = collectPoolCounts(data, known);                               // Größen ausschließlich erfolgreich geprüfter Pools.

  checkPoolSizes(data, counts);  // Erhält die festen Poolgrößen und die bekannte Kölner Ausnahme A11.

  return counts;
}

/**
 * Vergleicht eine Poolfrage mit ihrer bekannten Vorlage ohne Abschnittszuordnung.
 *
 * @param {object} question Poolfrage.
 * @param {Map} known Bekannte Identitäten.
 * @param {string} key Poolname.
 * @returns {void} Kein Rückgabewert.
 */
function checkPoolQuestion(question, known, key) {
  assert(question && known.has(question.uid), `Fehlende Poolreferenz ${key}`);

  const { examSection, ...copy } = question;                                      // Nur die Prüfungsteil-Zuordnung darf im Pool ergänzt werden.
  const { examSection: originalSection, ...original } = known.get(question.uid);  // Vorlage ohne ihre Abschnittszuordnung; die übrigen Felder sind der Vergleichsmaßstab.

  assert.deepEqual(copy, original, `Veränderte Poolfrage ${key}:${question.uid}`);
}

/**
 * Prüft die eigene 17/17/16-Verteilung und den Umfang eigener Rechtsbeispiele.
 *
 * @param {object[]} questions Vollständiger Essen-Beispielpool.
 * @param {object[]} sections Laufzeitdefinitionen der drei Prüfungsteile.
 * @returns {void} Kein Rückgabewert.
 */
export function checkSections(questions, sections) {
  assert.deepEqual(
    Array.from(sections, section => section.id),
    ['biology', 'behavior', 'law']
  );

  const counts = sections.map(section => questions.filter(question => question.examSection === section.id).length);  // Tatsächliche Fragenanzahl je Beispielteil in der Reihenfolge der Abschnittsdefinitionen.

  assert.deepEqual(Array.from(counts), [17, 17, 16], 'Essen-Beispiel weicht von der eigenen Teilverteilung ab.');
  assert.equal(questions.filter(question => question.example).length, 16);
}

/**
 * Prüft beide Seiten eines einzelnen Zuordnungs-Lösungstokens.
 *
 * @param {object} question Frage mit angebotenen Zeilen und Zielen.
 * @param {string} token Lösungspaar in der Schreibweise Schlüssel:Ziel.
 * @returns {void} Kein Rückgabewert.
 */
function checkMappingPair(question, token) {
  const pair = token.split(':');  // Genau zwei Teile sind als Schlüssel und Ziel zulässig.

  assert(
    pair.length === 2 && question.mappingKeys.includes(pair[0]) && question.mappingChoices.includes(pair[1]),
    `Ungültiges Paar ${question.uid}:${token}`
  );
}

/**
 * Prüft eine Bilddatei auf Vorhandensein und Verbleib innerhalb der Projektwurzel.
 *
 * @param {string} root Absolute Projektwurzel.
 * @param {string} image Bildpfad aus der Frage, relativ zur Projektwurzel.
 * @returns {void} Kein Rückgabewert.
 */
function checkImageFile(root, image) {
  const target = resolve(root, image);  // Absoluter Bildpfad vor der Auflösung möglicher Symlinks.

  assert(existsSync(target) && statSync(target).isFile(), `Fehlende Abbildung ${image}`);

  const path = relative(realpathSync(root), realpathSync(target));  // Tatsächlicher Abstand des Dateiziels zur Projektwurzel.

  assert(path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path), `Abbildung verlässt das Paket: ${image}`);
}

/**
 * Prüft die Quellenadresse einer eigenen Rechtsfrage ohne einen Netzwerkabruf.
 *
 * @param {object} question Eigene Rechtsfrage mit Quellenadresse und UID.
 * @returns {void} Kein Rückgabewert.
 */
function checkExampleSource(question) {
  const source = new URL(question.sourceUrl);  // Nur die Adresse wird geprüft; der Rechtsinhalt wird nicht abgerufen.

  assert.equal(source.protocol, 'https:');
  assert(
    ['www.gesetze-im-internet.de', 'recht.nrw.de'].includes(source.hostname),
    `Unbekannte Beispielquelle ${question.uid}`
  );
}

/**
 * Führt die inhaltlichen Strukturprüfungen für eine bereits identifizierte Frage aus.
 *
 * @param {object} question Eigenständige Katalog- oder Beispielfrage.
 * @param {object} expected Gespeicherte amtliche Referenzschlüssel.
 * @param {string} root Absolute Projektwurzel für Bilddateien.
 * @returns {void} Kein Rückgabewert.
 */
function checkQuestion(question, expected, root) {
  checkQuestionAnswers(question);         // Prüft Fragetext und Antworten nach dem jeweiligen Aufgabentyp.
  checkImages(root, question);            // Prüft Bildkennzeichnung und tatsächlich vorhandene Abbildungen.
  checkReferenceKey(question, expected);  // Vergleicht gegebenenfalls den gespeicherten amtlichen Schlüssel.

  // Eigene Rechtsbeispiele benötigen zusätzlich die ausdrücklich sichtbare Herkunftskennzeichnung.
  if (question.sourceKey === 'essenExample' || question.example) checkExample(question);
}

/**
 * Prüft Fragetext und Lösung und wählt anschließend die Regeln des Fragetypen.
 *
 * @param {object} question Frage mit Fragetext, Typ und Lösungsschlüssel.
 * @returns {void} Kein Rückgabewert.
 */
function checkQuestionAnswers(question) {
  assert(question.prompt?.trim(), `Leere Frage ${question.uid}`);
  assert(Array.isArray(question.correct) && question.correct.length, `Fehlende Lösung ${question.uid}`);
  assert.equal(new Set(question.correct).size, question.correct.length, `Doppelte Lösung ${question.uid}`);
  assert(['multi', 'mapping'].includes(question.type), `Unbekannter Fragetyp ${question.uid}`);

  // Zuordnungen benötigen Schlüssel-Ziel-Paare; Multiple Choice benötigt angebotene Antwortoptionen.
  if (question.type === 'mapping') checkMapping(question);
  else checkOptions(question);
}

/**
 * Prüft jeden Laufzeitpool und sammelt anschließend seine tatsächliche Größe.
 *
 * @param {object} data Laufzeitpools nach Poolschlüssel.
 * @param {Map} known Bekannte Fragen nach UID.
 * @returns {object} Anzahl der Fragen unter dem jeweiligen Poolschlüssel.
 */
function collectPoolCounts(data, known) {
  const counts = {};  // Statistik enthält auch den gesonderten Essen-Beispielpool.

  // Ein Pool wird erst nach erfolgreicher Struktur- und Vorlagenprüfung gezählt.
  for (const [key, pool] of Object.entries(data)) {
    checkPool(pool, known, key);  // Prüft jede enthaltene Referenz und unveränderte Frage.
    counts[key] = pool.length;
  }

  return counts;
}

/**
 * Prüft die Eindeutigkeit und bekannten Fragen eines einzelnen Laufzeitpools.
 *
 * @param {object[]} pool Fragenfolge des Pools.
 * @param {Map} known Bekannte Fragen nach UID.
 * @param {string} key Poolname für die Fehlerdiagnose.
 * @returns {void} Kein Rückgabewert.
 */
function checkPool(pool, known, key) {
  assert(Array.isArray(pool) && pool.length, `Leerer Pool ${key}`);
  assert.equal(new Set(pool.map(question => question?.id)).size, pool.length, `Doppelte Pool-ID ${key}`);

  // Auch die für Essen ergänzten Kopien müssen ihrer bekannten Vorlage entsprechen.
  for (const question of pool) checkPoolQuestion(question, known, key);
}

/**
 * Prüft die bestehenden festen Poolgrößen und die bekannte Kölner Ausnahme.
 *
 * @param {object} data Laufzeitpools einschließlich der Kölner Fragen.
 * @param {object} counts Tatsächlich geprüfte Poolgrößen.
 * @returns {void} Kein Rückgabewert.
 */
function checkPoolSizes(data, counts) {
  assert.equal(counts.mgPool, 398);
  assert.equal(counts.allPool, 400);
  assert.equal(counts.kammer197, 197);
  assert.equal(counts.essenExamples, 50);
  assert(!data.koeln.some(question => question.sourceId === 'A11'));
}
