/* scripts/learning/core.js */

/**
 * @file Bewertung und Antwortvalidierung.
 * @description Frameworkunabhängige Bewertung, Zufallsauswahl und Validierung gespeicherter Antworten.
 * @author Benjamin Bennewitz [B²]
 */
(function (root) {
  'use strict';

  /**
   * @typedef {object} SectionResult
   * @property {string} id Schlüssel des Prüfungsteils.
   * @property {string} label Lesbarer Name des Prüfungsteils.
   * @property {number} correct Vollständig richtige Antworten.
   * @property {number} total Anzahl der Fragen im Teil.
   * @property {number} required Aufgerundete 75-Prozent-Grenze.
   * @property {boolean} passed Ob der vorhandene Teil seine Grenze erreicht.
   */

  /**
   * Vergleicht die vollständige Auswahl einschließlich zusätzlicher falscher Antworten.
   * @param {Set<string>} selected Gewählte Antworttokens.
   * @param {string[]} correct Vollständiger Lösungsschlüssel.
   * @returns {boolean} Nur bei exakt gleicher Auswahl wahr.
   */
  function exact(selected, correct) {
    return selected.size === correct.length && correct.every(answer => selected.has(answer));
  }

  /**
   * Zieht bevorzugt per Web Crypto eine gleichverteilte Zufallszahl.
   * @param {number} max Positive exklusive Obergrenze.
   * @returns {number} Ganze Zahl von 0 bis max - 1.
   */
  function randomInt(max) {
    // Fehlt Web Crypto, bleibt die Auswahl über den vorhandenen Math.random-Fallback nutzbar.
    if (!root.crypto?.getRandomValues) return Math.floor(Math.random() * max);

    const buffer = new Uint32Array(1);                // Speicherplatz für eine vorzeichenlose 32-Bit-Zufallszahl.
    const limit = 0x100000000 - (0x100000000 % max);  // Exklusive Annahmegrenze, die Verzerrungen bei der Restbildung verhindert.

    // Werte oberhalb der Grenze würden kleine Ergebnisse beim Restbilden bevorzugen.
    // Zieht erneut, solange die Zufallszahl außerhalb des gleichverteilten Annahmebereichs liegt.
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
    const copy = [...pool];  // Eigene Arbeitskopie; der ursprüngliche Pool wird nicht umsortiert.

    // Durchläuft die Arbeitskopie rückwärts und tauscht jede Position mit einem gleichverteilten Vorgänger.
    for (let index = copy.length - 1; index > 0; index--) {
      const target = randomInt(index + 1);  // Gleichverteilter Tauschpartner zwischen Anfang und aktueller Position.

      [copy[index], copy[target]] = [copy[target], copy[index]];
    }

    return copy.slice(0, count);
  }

  /**
   * Bereinigt gespeicherte Antworten anhand des aktiven Katalogs.
   * @param {unknown} raw Ungeprüfte Daten aus Import oder Browserspeicher.
   * @param {SachkundeQuestion[]} pool Katalog als verbindliche Referenz.
   * @returns {Map<number, Set<string>>} Gültige Auswahl nach Frage-ID.
   */
  function validAnswers(raw, pool) {
    const result = new Map();  // Bereinigte Antworten; unbekannte Fragen werden nicht übernommen.

    // Fehlende Werte, Arrays und andere ungeeignete Speicherformen enthalten keinen gültigen Antwortstand.
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;

    // Prüft ausschließlich bekannte Katalogfragen; fremde IDs aus dem Rohobjekt bleiben außen vor.
    for (const question of pool) {
      const selected = selectValidAnswers(raw[question.id], question);  // Gültige Tokens der aktuell geprüften Katalogfrage.

      // Nur Fragen mit mindestens einem gültigen Token werden im bereinigten Stand gespeichert.
      if (selected.length) result.set(question.id, new Set(selected));
    }

    return result;
  }

  /**
   * @param {unknown} values Gespeicherte Tokens einer einzelnen Frage.
   * @param {SachkundeQuestion} question Zugehörige Katalogfrage.
   * @returns {string[]} Eindeutige gültige Tokens; widersprüchliche Zuordnungen ergeben keine Auswahl.
   */
  function selectValidAnswers(values, question) {
    // Ein einzelner Antwortwert muss als Tokenliste vorliegen.
    if (!Array.isArray(values)) return [];

    const allowed = allowedTokens(question);  // Für diesen Fragetyp zulässige Buchstaben oder Zuordnungspaare.
    // Bekannte Texttokens, bereinigt um ungültige Werte und Duplikate.
    const selected = [...new Set(
      values.filter(value => typeof value === 'string' && allowed.includes(value))
    )];

    // Mehrere Ziele derselben Zuordnungsposition verwerfen die ganze Auswahl dieser Frage.
    if (hasMappingConflict(question, selected)) return [];

    return selected;
  }

  /** Liefert Antwortbuchstaben oder alle erlaubten Positions-Ziel-Paare einer Frage. */
  function allowedTokens(question) {
    // Multiple Choice verwendet die vorgegebenen Buchstaben statt Positions-Ziel-Paaren.
    if (question.type !== 'mapping') return question.options;

    // Zuordnungsaufgaben erlauben jede Kombination aus bekannter Position und bekanntem Ziel.
    return question.mappingKeys.flatMap(key =>
      question.mappingChoices.map(choice => `${key}:${choice}`)
    );
  }

  /** Erkennt mehrere Ziele für dieselbe Position, ohne verschiedene Positionen einzuschränken. */
  function hasMappingConflict(question, selected) {
    // Mehrfachauswahl hat keine Positionsbindung und kann deshalb keinen Zuordnungskonflikt besitzen.
    if (question.type !== 'mapping') return false;

    // Mehr als ein Ziel für denselben Positionspräfix macht die Auswahl widersprüchlich.
    return question.mappingKeys.some(key =>
      selected.filter(value => value.startsWith(`${key}:`)).length > 1
    );
  }

  /**
   * Erkennt vollständige Zuordnungen oder mindestens eine Multiple-Choice-Auswahl.
   * @param {SachkundeQuestion} question Zu prüfende Frage.
   * @param {Set<string>} [selected=new Set()] Aktuelle Antwortauswahl.
   * @returns {boolean} Ob die Frage vollständig beantwortet ist.
   */
  function complete(question, selected = new Set()) {
    // Bei Multiple Choice genügt mindestens eine Auswahl für den Zustand beantwortet.
    if (question.type !== 'mapping') return selected.size > 0;

    // Bei Zuordnungen muss für jede Position mindestens ein gültiges Ziel gewählt sein.
    return question.mappingKeys.every(key =>
      [...selected].some(value => value.startsWith(`${key}:`))
    );
  }

  /**
   * @param {SachkundeQuestion[]} questions Vollständige Testauswahl mit Abschnittszuordnung.
   * @param {Map<number, Set<string>>} answers Aktuelle Antworten.
   * @param {{id: string, label: string}} section Auszuwertender Prüfungsteil.
   * @returns {SectionResult} Eigene Übungswertung ohne Teilpunkte.
   */
  function evaluateSection(questions, answers, section) {
    const items = questions.filter(question => question.examSection === section.id);  // Nur Fragen des gerade bewerteten Prüfungsteils.
    // Anzahl vollständig richtiger Antworten in diesem Teil.
    const correct = items.filter(question =>
      exact(answers.get(question.id) || new Set(), question.correct)
    ).length;
    const required = Math.ceil(items.length * 0.75);                                  // Aufgerundete 75-Prozent-Grenze des tatsächlich vorhandenen Teils.
    const passed = items.length > 0 && correct >= required;                           // Ein fehlender Teil besteht auch mit rechnerisch null benötigten Punkten nicht.

    return { ...section, correct, total: items.length, required, passed };
  }

  /**
   * Jeder Teil und das Gesamtergebnis müssen separat die eigene 75-Prozent-Grenze erreichen.
   * @param {SachkundeQuestion[]} questions Vollständige Testauswahl mit Abschnittszuordnung.
   * @param {Map<number, Set<string>>} answers Gewählte Antworten nach Frage-ID.
   * @param {{id: string, label: string}[]} sections Erwartete Prüfungsteile.
   * @returns {{correct: number, total: number, required: number, passed: boolean, sections: SectionResult[]}} Übungswertung.
   */
  function evaluateSections(questions, answers, sections) {
    const results = sections.map(section => evaluateSection(questions, answers, section));  // Einzelwertungen aller erwarteten Prüfungsteile.
    const correct = results.reduce((sum, section) => sum + section.correct, 0);             // Summe der vollständig richtigen Antworten über die bekannten Teile.
    const required = Math.ceil(questions.length * 0.75);                                    // Zusätzlich zu den Teilgrenzen benötigte Gesamtpunktzahl.
    // Jede Testfrage muss einem erwarteten Prüfungsteil zugeordnet sein.
    const covered = questions.every(question =>
      sections.some(section => section.id === question.examSection)
    );
    // Bestehen verlangt bekannte Teile sowie alle Teilgrenzen und die Gesamtgrenze.
    const passed = covered && results.length > 0 &&
      results.every(section => section.passed) && correct >= required;

    return { correct, total: questions.length, required, passed, sections: results };
  }

  // Unveränderte öffentliche Schnittstellen für Browser und Node-Tests.
  const api = {
    exact,
    randomQuestions,
    validAnswers,
    complete,
    evaluateSections
  };

  // Node-Tests erhalten CommonJS-Exporte; im Browser wird derselbe Kern am globalen Objekt bereitgestellt.
  if (typeof module !== 'undefined') module.exports = api;
  else root.LHUNDG_CORE = api;
})(globalThis);
