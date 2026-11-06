(function (root) {
  'use strict';
  /** Vergleicht die vollständige Auswahl, einschließlich zusätzlicher falscher Antworten. */
  function exact(selected, correct) {
    return selected.size === correct.length && correct.every(answer => selected.has(answer));
  }
  /** Erzeugt eine unverzerrte Zufallszahl, sofern die Web-Crypto-API verfügbar ist. */
  function randomInt(max) {
    if (!root.crypto?.getRandomValues) return Math.floor(Math.random() * max);
    const buffer = new Uint32Array(1), limit = 0x100000000 - (0x100000000 % max);
    do { root.crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
    return buffer[0] % max;
  }
  /** Mischt eine Kopie; die Reihenfolge des Quellkatalogs bleibt unverändert. */
  function randomQuestions(pool, count) {
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }
  /** Prüft gespeicherte oder importierte Antworten gegen das tatsächliche Datenschema. */
  function validAnswers(raw, pool) {
    const result = new Map();
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return result;
    for (const q of pool) {
      const values = raw[q.id];
      if (!Array.isArray(values)) continue;
      const allowed = q.type === 'mapping'
        ? q.mappingKeys.flatMap(key => q.mappingChoices.map(choice => `${key}:${choice}`))
        : q.options;
      const selected = [...new Set(values.filter(v => typeof v === 'string' && allowed.includes(v)))];
      if (q.type === 'mapping' && q.mappingKeys.some(key => selected.filter(v => v.startsWith(`${key}:`)).length > 1)) continue;
      if (selected.length) result.set(q.id, new Set(selected));
    }
    return result;
  }
  /** Erkennt vollständig beantwortete Zuordnungen; Teilantworten bleiben offen. */
  function complete(question, selected = new Set()) {
    return question.type === 'mapping' ? question.mappingKeys.every(key => [...selected].some(v => v.startsWith(`${key}:`))) : selected.size > 0;
  }
  const api = { exact, randomQuestions, validAnswers, complete };
  if (typeof module !== 'undefined') module.exports = api;
  else root.LHUNDG_CORE = api;
})(globalThis);
