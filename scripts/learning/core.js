/* scripts/learning/core.js */

/**
 * @file Bewertung und Antwortvalidierung.
 * @description Frameworkunabhängige Bewertung, Zufallsauswahl und Validierung gespeicherter Antworten.
 * @author Benjamin Bennewitz [B²]
 */
(function (root) {
  'use strict';

  /**
   * Vergleicht eine vollständige Auswahl einschließlich zusätzlich angekreuzter falscher Antworten.
   * @param {Set<string>} selected Gewählte Antworttokens.
   * @param {string[]} correct Vollständiger Lösungsschlüssel.
   * @returns {boolean} Nur bei exakt gleicher Auswahl wahr.
   */
  function exact(selected, correct) {
    return selected.size === correct.length && correct.every(answer => selected.has(answer));
  }

  /**
   * Zieht eine gleichverteilte Zufallszahl; nutzt bevorzugt Web Crypto mit Rejection Sampling.
   * @param {number} max Positive exklusive Obergrenze.
   * @returns {number} Ganze Zahl von 0 bis max - 1.
   */
  function randomInt(max) {
    if (!root.crypto?.getRandomValues) return Math.floor(Math.random() * max);
    const buffer = new Uint32Array(1);
    const limit = 0x100000000 - (0x100000000 % max);
    do {
      root.crypto.getRandomValues(buffer);
    } while (buffer[0] >= limit);
    return buffer[0] % max;
  }

  /**
   * Mischt eine Kopie des Katalogs mit Fisher-Yates und entnimmt eindeutige Fragen.
   * @template T
   * @param {T[]} pool Unverändert bleibender Ausgangskatalog.
   * @param {number} count Gewünschte Anzahl.
   * @returns {T[]} Neue Auswahl ohne Veränderung des Originals.
   */
  function randomQuestions(pool, count) {
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }

  /**
   * Validiert gespeicherte Antworten und verwirft unbekannte Tokens oder widersprüchliche Zuordnungen.
   * @param {unknown} raw Ungeprüfte Daten aus Import oder Browserspeicher.
   * @param {SachkundeQuestion[]} pool Katalog als verbindliche Referenz.
   * @returns {Map<number, Set<string>>} Bereinigte Auswahl nach Frage-ID.
   */
  function validAnswers(raw, pool) {
    const result = new Map();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
    for (const q of pool) {
      const values = raw[q.id];
      if (!Array.isArray(values)) continue;
      const allowed = q.type === 'mapping' ?
        q.mappingKeys.flatMap(key => q.mappingChoices.map(choice => `${key}:${choice}`)) :
        q.options;
      const selected = [...new Set(values.filter(v => typeof v === 'string' && allowed.includes(
        v)))];
      if (q.type === 'mapping' && q.mappingKeys.some(key => selected.filter(v => v.startsWith(
        `${key}:`))
        .length > 1)) continue;
      if (selected.length) result.set(q.id, new Set(selected));
    }
    return result;
  }

  /**
   * Erkennt vollständige Zuordnungen oder mindestens eine Multiple-Choice-Auswahl.
   * @param {SachkundeQuestion} question Zu prüfende Frage.
   * @param {Set<string>} [selected=new Set()] Aktuelle Antwortauswahl.
   * @returns {boolean} Ob die Frage vollständig beantwortet ist.
   */
  function complete(question, selected = new Set()) {
    return question.type === 'mapping' ? question.mappingKeys.every(key => [...selected].some(v =>
      v.startsWith(`${key}:`))) : selected.size > 0;
  }
  /**
   * Wertet die eigene Beispielsimulation ohne Teilpunkte aus; jeder Teil muss separat bestehen.
   * @param {Array<SachkundeQuestion & {examSection: string}>} questions Vollständige Testauswahl.
   * @param {Map<number, Set<string>>} answers Gewählte Antworten nach Frage-ID.
   * @param {{id: string, label: string}[]} sections Erwartete Prüfungsteile.
   * @returns {{correct: number, total: number, required: number, passed: boolean,
   *   sections: {id: string, label: string, correct: number, total: number, required: number, passed: boolean}[]}}
   * Gesamtergebnis mit aufgerundeter 75-Prozent-Grenze; fehlende oder unbekannte Teile bestehen nicht.
   */
  function evaluateSections(questions, answers, sections) {
    const results = sections.map(section => {
      const items = questions.filter(question => question.examSection === section.id);
      const correct = items.filter(question => exact(answers.get(question.id) || new Set(),
        question.correct)).length;
      const required = Math.ceil(items.length * 0.75);
      return { ...section, correct, total: items.length, required,
        passed: items.length > 0 && correct >= required };
    });
    const correct = results.reduce((sum, section) => sum + section.correct, 0);
    const required = Math.ceil(questions.length * 0.75);
    const covered = questions.every(question => sections.some(section =>
      section.id === question.examSection));
    return { correct, total: questions.length, required,
      passed: covered && results.length > 0 && results.every(section => section.passed) &&
        correct >= required, sections: results };
  }
  const api = {
    exact,
    randomQuestions,
    validAnswers,
    complete,
    evaluateSections
  };
  if (typeof module !== 'undefined') module.exports = api;
  else root.LHUNDG_CORE = api;
})(globalThis);
