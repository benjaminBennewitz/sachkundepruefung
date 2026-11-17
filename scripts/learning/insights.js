/* scripts/learning/insights.js */

/**
 * @file Kennzahlen des aktiven Lernkatalogs.
 * @description Leitet Fortschritt aus dem vorhandenen Zustand ab und speichert eine kleine lokale Übersicht.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(trainer => {
  /**
   * Zählt ausschließlich bekannte Fragen und tatsächlich geprüfte, vollständige Antworten.
   * @param {TrainerSession} session Aktiver Lernzustand.
   * @returns {object|null} Katalogübersicht; Prüfungen bleiben bis zur regulären Auswertung ohne Kennzahlen.
   */
  function calculate(session) {
    if (session.isExam) return null;
    const core = window.LHUNDG_CORE;
    let answered = 0;
    let checked = 0;
    let correct = 0;
    let bookmarked = 0;
    for (const question of session.questions) {
      const answers = session.state.answers.get(question.id) || new Set();
      const complete = core.complete(question, answers);
      if (complete) answered += 1;
      if (complete && session.state.checked.get(question.id) === session.signature(question)) {
        checked += 1;
        if (core.exact(answers, question.correct)) correct += 1;
      }
      if (session.state.bookmarks.has(question.id)) bookmarked += 1;
    }
    return { version: 1, mode: session.mode, total: session.questions.length, answered, checked,
      correct, wrong: checked - correct, bookmarked };
  }

  /**
   * Aktualisiert kleine Kennzahlen, ohne den Fragenraum oder Lernzustand zu verändern.
   * @param {TrainerSession} session Aktiver Lernzustand.
   * @returns {void} Kein Rückgabewert.
   */
  function refresh(session) {
    const root = document.getElementById('learningInsights');
    if (!root) return;
    const summary = calculate(session);
    root.hidden = !summary;
    if (!summary) return;
    for (const name of ['correct', 'wrong', 'bookmarked']) {
      root.querySelector(`[data-insight=${name}]`).textContent = summary[name];
    }
    const accuracy = summary.checked ? Math.round(summary.correct / summary.checked * 100) : null;
    root.querySelector('[data-insight=note]').textContent = accuracy === null ?
      'Richtig und falsch zählen erst nach dem Prüfen.' :
      `${accuracy} % von ${summary.checked} geprüften Fragen richtig.`;
    const serialized = JSON.stringify(summary);
    const key = session.storageKey('lhundg-overview-v1');
    try {
      if (localStorage.getItem(key) !== serialized) {
        localStorage.setItem(key, serialized);
      }
    } catch {
      /* Die laufenden Kennzahlen funktionieren auch bei gesperrtem Browserspeicher. */
    }
  }

  trainer.Insights = Object.freeze({ calculate, refresh });
})(window.LHUNDG_TRAINER);
