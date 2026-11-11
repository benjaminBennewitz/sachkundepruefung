/* scripts/quality/core.test.cjs */

/**
 * @file Regressionstests der Auswertung.
 * @description Prüft echte Bewertungsfunktionen, Profilwerte und Zufallsauswahl mit getrennten Grenzfällen.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const { exact, randomQuestions, validAnswers, complete, evaluateSections } = require('../learning/core.js');
const { environment, plain } = require('./learning-fixtures.cjs');

// Kleine synthetische Fragen isolieren Antwortregeln vom umfangreichen Katalogbestand.
const multi = { id: 1, type: 'multi', options: ['A', 'B', 'C', 'D'], correct: ['A', 'C'] };  // Kleine Multiple-Choice-Testfrage mit zwei richtigen und zwei falschen Auswahlwerten.
const mapping = {
  id: 2,
  type: 'mapping',
  mappingKeys: ['a', 'b'],
  mappingChoices: ['1', '2'],
  correct: ['a:2', 'b:1']
};  // Kleine Zuordnungs-Testfrage mit zwei Zeilen und jeweils einem richtigen Ziel.

/**
 * Lädt das echte Essen-Modul und prüft dabei den Erhalt des ursprünglichen Datenbestands.
 *
 * @returns {object} Beispielpool, Abschnittsdefinitionen und unveränderte Originalfragen.
 */
function loadEssen() {
  const { scope, context } = environment(['data']);         // Vor der Erweiterung wird der tatsächliche Grundbestand gesichert.
  const original = JSON.stringify(scope.LHUNDG_QUESTIONS);  // Unveränderte Referenz aus dem echten Grundbestand zum Vergleich mit der Erweiterung.
  const pools = JSON.stringify(scope.LHUNDG_POOLS);         // Gesicherter Poolstand vor dem Laden des Essen-Moduls; er darf nicht verändert werden.

  vm.runInContext(readFileSync(resolve(__dirname, '../learning/essen.js'), 'utf8'), context);

  assert.equal(JSON.stringify(scope.LHUNDG_QUESTIONS), original);
  assert.equal(JSON.stringify(scope.LHUNDG_POOLS), pools);

  return {
    questions: scope.LHUNDG_DATA.essenExamples,
    sections: scope.LHUNDG_ESSEN_SECTIONS,
    originals: scope.LHUNDG_DATA.legacy203
  };
}

/**
 * Ermittelt die Anzahl der Fragen je vorgegebenem Prüfungsteil.
 *
 * @param {object[]} questions Fragenfolge.
 * @param {object[]} sections Abschnittsdefinitionen.
 * @returns {number[]} Verteilung je Teil.
 */
function sectionCounts(questions, sections) {
  return Array.from(sections, section => questions.filter(question => question.examSection === section.id).length);
}

/**
 * Erstellt vollständige Antwortmengen für eine vorgegebene Anzahl richtiger Antworten je Teil.
 *
 * @param {object} pool Beispielpool.
 * @param {number[]} counts Richtige Antworten pro Teil.
 * @returns {Map} Vollständig richtige Auswahlen.
 */
function answerCounts(pool, counts) {
  const answers = new Map();  // Nicht aufgenommene Fragen bleiben leer und werden deshalb als falsch gewertet.

  // Pro Teil werden genau die gewünschten Anzahlen mit ihrem vollständigen Schlüssel beantwortet.
  for (const [index, section] of pool.sections.entries()) {
    // Fragen dieses Abschnitts, die für den gewünschten Grenzfall vollständig richtig beantwortet werden.
    const selected = pool.questions.filter(question => question.examSection === section.id).slice(0, counts[index]);

    // Die Antwortmenge entspricht der echten Eingabeform der Bewertungsfunktion.
    for (const question of selected) answers.set(question.id, new Set(question.correct));
  }

  return answers;
}

/**
 * Prüft, dass Essen-Abschnittszuordnungen nur an Kopien der Originalfragen hängen.
 *
 * @param {object} pool Beispielpool mit kopierten Fragen und unveränderten Originalvorlagen.
 * @returns {void} Kein Rückgabewert.
 */
function assertOriginalCopies(pool) {
  // Eigene Rechtsbeispiele werden separat geprüft und haben keinen amtlichen Originaldatensatz.
  for (const question of pool.questions.filter(question => !question.example)) {
    const { examSection, ...copy } = question;                              // Abschnittszuordnung separat von den unverändert zu vergleichenden Fragefeldern.
    const original = pool.originals.find(item => item.id === question.id);  // Unveränderte Referenz aus dem echten Grundbestand zum Vergleich mit der Erweiterung.

    assert.notEqual(question, original);
    assert.equal(JSON.stringify(copy), JSON.stringify(original));
    assert(['biology', 'behavior'].includes(examSection));
  }
}

/**
 * Prüft Umfang, Eindeutigkeit und Herkunft einer echten Zufallsauswahl.
 *
 * @param {object[]} pool Unveränderter Ausgangspool.
 * @param {number} count Erwartete Anzahl gezogener Fragen.
 * @returns {void} Kein Rückgabewert.
 */
function assertDraw(pool, count) {
  // Die Produktionsfunktion bestimmt die Reihenfolge; der Test verlangt keine bestimmte Zufallsfolge.
  const drawn = randomQuestions(pool, count);

  assert.equal(drawn.length, count);
  assert.equal(new Set(drawn.map(question => question.id)).size, count);
  assert(drawn.every(question => pool.includes(question)));
}

test('Multiple Choice verlangt alle richtigen Antworten ohne zusätzliche Auswahl', () => {
  assert(exact(new Set(['C', 'A']), multi.correct));

  // Leer, unvollständig und mit falscher Zusatzantwort sind drei verschiedene Fehlerfälle.
  for (const selection of [[], ['A'], ['A', 'B', 'C']]) assert(!exact(new Set(selection), multi.correct));
});

test('Zuordnung wertet die vollständigen Paare und erkennt Teilantworten', () => {
  assert(exact(new Set(['b:1', 'a:2']), mapping.correct));
  assert(!exact(new Set(['a:1', 'b:2']), mapping.correct));
  assert(!complete(mapping, new Set(['a:2'])));
  assert(complete(mapping, new Set(mapping.correct)));
});

test('Simulation zieht exakt 119 eindeutige Fragen und verändert den Pool nicht', () => {
  const pool = Array.from({ length: 398 }, (_, id) => ({ id }));  // Synthetischer Ausgangspool für die Prüfung von Ziehungsgröße und Herkunft.
  const expected = pool.map(question => question.id);             // Referenz der Reihenfolge vor allen Zufallsziehungen.

  // Wiederholungen prüfen die Auswahlregeln, keine statistische Gleichverteilung.
  for (let index = 0; index < 20; index++) assertDraw(pool, 119);

  assert.deepEqual(
    pool.map(question => question.id),
    expected
  );
});

test('Unbekannte Antworttokens und widersprüchliche Zuordnungen werden abgewiesen', () => {
  const restored = validAnswers({ 1: ['A', 'A', 'X'], 2: ['a:1', 'a:2', 'b:1'], 999: ['A'] }, [multi, mapping]);  // Von der Produktionsfunktion validierte Antworten nach Entfernung ungültiger Tokens.

  assert.deepEqual([...restored.get(1)], ['A']);
  assert(!restored.has(2));
  assert(!restored.has(999));
  assert.equal(validAnswers(null, [multi]).size, 0);
  assert.equal(validAnswers(['A'], [multi]).size, 0);
});

test('Das echte MG-Profil verwendet 90 von 119 Fragen aus dem 398er-Pool', () => {
  const { scope, trainer } = environment();  // Prüft die ausgelieferte Konfiguration statt einer im Test nachgebauten Bestehensformel.
  const profile = trainer.profiles.mgexam;   // Das ausgelieferte MG-Prüfungsprofil mit Pool, Testumfang und Bestehensgrenze.

  assert.equal(profile.passCount, 90);
  assert.equal(profile.examCount, 119);
  assert.equal(scope.LHUNDG_DATA[profile.pool].length, 398);
  assert.equal(profile.key, null);
});

test('Neue Testreihen ziehen 34 bzw. 30 eindeutige Fragen aus ihrem eigenen Pool', () => {
  // Unterschiedliche Poolgrößen dürfen nicht versehentlich dieselbe feste Ziehungsgröße verwenden.
  for (const [size, count] of [
    [203, 34],
    [197, 30]
  ]) {
    const pool = Array.from({ length: size }, (_, id) => ({ id }));  // Synthetischer Ausgangspool für die Prüfung von Ziehungsgröße und Herkunft.

    // Jede Wiederholung muss Größe, Eindeutigkeit und Herkunft der Auswahl erfüllen.
    for (let index = 0; index < 15; index++) assertDraw(pool, count);
  }
});

test('Essen-Beispiel enthält 50 eindeutige Fragen in 17/17/16, ohne Originale zu verändern', () => {
  const pool = loadEssen();  // Prüft zusätzlich beim Laden, dass die Erweiterung den Grundbestand nicht verändert.

  assert.equal(pool.questions.length, 50);
  assert.equal(new Set(pool.questions.map(question => question.id)).size, 50);
  assert.equal(new Set(pool.questions.map(question => question.uid)).size, 50);
  assert.deepEqual(sectionCounts(pool.questions, pool.sections), [17, 17, 16]);
  assertOriginalCopies(pool);

  // Durchmischen darf die Teilverteilung und eindeutigen IDs nicht verändern.
  for (let index = 0; index < 10; index++) {
    const shuffled = randomQuestions(pool.questions, 50);  // Erneut durchmischte Beispielrunde; IDs und Abschnittsverteilung müssen erhalten bleiben.

    assert.equal(new Set(shuffled.map(question => question.id)).size, 50);
    assert.deepEqual(sectionCounts(shuffled, pool.sections), [17, 17, 16]);
  }
});

test('Eigene Rechtsfragen sind markiert und besitzen gültige Schlüssel und amtliche Quellen', () => {
  const own = loadEssen().questions.filter(question => question.example);  // Die 16 eigenen Rechtsbeispiele; kopierte Originalfragen sind hier ausgeschlossen.

  assert.equal(own.length, 16);

  // Metadatenprüfung bestätigt die Kennzeichnung und Quellenadresse, keine neue juristische Bewertung.
  for (const question of own) {
    assert.equal(question.sourceKey, 'essenExample');
    assert.equal(question.examSection, 'law');
    assert.equal(question.options.length, 4);
    assert(question.correct.length > 0 && question.correct.length < 4);
    assert.equal(new Set(question.correct).size, question.correct.length);
    assert(question.correct.every(token => question.options.includes(token)));
    assert(question.options.every(token => typeof question.answers[token] === 'string'));
    assert(['www.gesetze-im-internet.de', 'recht.nrw.de'].includes(new URL(question.sourceUrl).hostname));
    assert(question.legalReference.startsWith('§'));
    assert(question.explanation.length > 30);
  }
});

test('Essen-Übungswertung besteht exakt an den eigenen Grenzen 13/17, 13/17 und 12/16', () => {
  const pool = loadEssen();                                                                         // Echter Essen-Beispielpool mit den drei Abschnittsdefinitionen.
  const score = evaluateSections(pool.questions, answerCounts(pool, [13, 13, 12]), pool.sections);  // Ergebnis der echten Teilbewertung für den jeweils vorbereiteten Grenzfall.

  assert(score.passed);
  assert.equal(score.correct, 38);
  assert.equal(score.required, 38);
  assert.deepEqual(plain(score.sections.map(section => section.required)), [13, 13, 12]);
  assert(evaluateSections(pool.questions, answerCounts(pool, [17, 17, 16]), pool.sections).passed);
  assert(!evaluateSections(pool.questions, new Map(), pool.sections).passed);
});

test('Ein nicht bestandener Essen-Teil kann trotz ausreichender Gesamtsumme nicht ausgeglichen werden', () => {
  const pool = loadEssen();  // Echter Essen-Beispielpool mit den drei Abschnittsdefinitionen.

  // Jeder der drei Teile unterschreitet einzeln seine Grenze, während die Gesamtsumme genügt.
  for (const counts of [
    [12, 17, 16],
    [17, 12, 16],
    [17, 17, 11]
  ]) {
    const score = evaluateSections(pool.questions, answerCounts(pool, counts), pool.sections);  // Ergebnis der echten Teilbewertung für den jeweils vorbereiteten Grenzfall.

    assert(score.correct >= 38);
    assert(!score.passed);
    assert.equal(score.sections.filter(section => !section.passed).length, 1);
  }
});

test('Essen-Übung vergibt keine Teilpunkte; unbekannte und fehlende Abschnitte bestehen nicht', () => {
  const sections = [{ id: 'law', label: 'Recht' }];   // Ein einzelner Prüfungsteil zur isolierten Prüfung der Bewertungsregeln.
  const question = { ...multi, examSection: 'law' };  // Unabhängige eigene Rechtsfrage, die ausschließlich als Testeingabe verändert wird.

  // Auch eine teilweise richtige Auswahl zählt vollständig als falsch.
  for (const selected of [[], ['A'], ['A', 'B', 'C']]) {
    const score = evaluateSections([question], new Map([[1, new Set(selected)]]), sections);  // Ergebnis der echten Teilbewertung für den jeweils vorbereiteten Grenzfall.

    assert.equal(score.correct, 0);
    assert(!score.passed);
  }

  assert(evaluateSections([question], new Map([[1, new Set(['A', 'C'])]]), sections).passed);
  assert(!evaluateSections([{ ...question, examSection: 'unknown' }], new Map(), sections).passed);
  assert(!evaluateSections([], new Map(), sections).passed);
  assert(!evaluateSections([question], new Map(), []).passed);
});
