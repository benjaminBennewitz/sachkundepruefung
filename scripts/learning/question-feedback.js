/* scripts/learning/question-feedback.js */

/**
 * @file Lösungsfeedback und optionale Lernhinweise.
 * @description Trennt Quellenlösung, ergänzende Erklärung und Sichtbarkeit nach der Auswertung.
 * @author Benjamin Bennewitz [B²]
 */

window.LHUNDG_TRAINER.QuestionFeedback = class QuestionFeedback {
  /** @param {TrainerSession} session Bestehende Sitzung als einzige Zustandsquelle. */
  constructor(session) {
    this.session = session;
    this.state = session.state;
    this.dom = window.LHUNDG_TRAINER.dom;
  }

  /**
   * Erstellt ausschließlich vorhandene, quellbezogene Erklärungen zunächst verborgen.
   * @param {SachkundeQuestion} question Originalfrage.
   * @returns {HTMLDetailsElement|null} Native, per Tastatur bedienbare Erklärung oder null.
   */
  createExplanation(question) {
    const entry = window.LHUNDG_EXPLANATIONS[question.uid];
    if (!entry) return null;

    const details = this.dom.node('details', undefined, 'question-explanation');
    const content = this.dom.node('div', undefined, 'explanation-content');
    details.hidden = true;
    details.append(this.dom.node('summary', 'Antwort verstehen'));
    content.append(this.dom.node('p', 'Ergänzende Erklärung des Trainers', 'microcopy'));
    content.append(this.dom.node('p', entry.text));
    if (entry.note) content.append(this.dom.node('p', entry.note, 'source-note'));
    if (entry.sourceUrl) {
      const link = this.dom.node('a', 'Fachliche Quelle ↗');
      link.href = entry.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer external';
      content.append(link);
    }
    if (entry.comparisons) content.append(this.createComparison(entry.comparisons));
    details.append(content);
    return details;
  }

  /**
   * Zeigt ausschließlich vorhandene Originalbilder als beschrifteten Vergleich nach der Prüfung.
   * @param {Array<{uid: string, caption: string}>} comparisons Quellbezogene Vergleichsbilder.
   * @returns {HTMLElement} Vergleich ohne veränderte oder nachgezeichnete Bildmerkmale.
   */
  createComparison(comparisons) {
    const group = this.dom.node('div', undefined, 'explanation-comparison');
    for (const item of comparisons) {
      const question = window.LHUNDG_QUESTIONS.find(candidate => candidate.uid === item.uid);
      if (!question?.images.length) continue;
      const figure = this.dom.node('figure');
      const image = this.dom.node('img');
      const source = question.images[0];
      image.src = source;
      image.alt = `Originalzeichnung zu Frage ${question.sourceId}. ${item.caption}`;
      image.loading = 'lazy';
      image.decoding = 'async';
      const size = window.LHUNDG_IMAGE_SIZES[source];
      if (size) [image.width, image.height] = size;
      figure.append(image, this.dom.node('figcaption', item.caption));
      group.append(figure);
    }
    return group;
  }

  /** Synchronisiert Status, Prüfaktion und Lösungsfeedback einer bestehenden Fragenkarte. */
  update(question, card) {
    /* Aktuelle Auswahl oder eine leere Menge für unbeantwortete Fragen. */
    const selected = this.state.answers.get(question.id) || new Set();
    /* Die Antwort wurde ausdrücklich geprüft; erst dann ist Lösungsfeedback zulässig. */
    const checked = this.state.checked.has(question.id) && (!this.session.isExam || this.state.finished);
    /* Exakte Gleichheit mit dem vollständigen Lösungsschlüssel. */
    const right = window.LHUNDG_CORE.exact(selected, question.correct);
    /* Vorhandener Prüfbutton, dessen Verfügbarkeit zur Vollständigkeit passen muss. */
    const check = card.querySelector('.question-check');
    /* Bestehender Rückmeldebereich für die geprüfte Auswahl. */
    const feedback = card.querySelector('.feedback');

    card.classList.toggle('correct', checked && right);
    card.classList.toggle('wrong', checked && !right);
    card.querySelector('.status-pill').textContent = this.statusText(question, selected, checked, right);

    /* Die Einzelprüfung verlangt mindestens eine Auswahl oder eine vollständige Zuordnung. */

    check.disabled = !window.LHUNDG_CORE.complete(question, selected);
    /* Eine bereits ausgewertete Auswahl kann über denselben Button erneut geprüft werden. */

    check.textContent = checked ? 'Erneut prüfen' : 'Antwort prüfen';

    const details = card.querySelector('.question-explanation');
    if (details) {
      details.hidden = !checked;
      if (!checked) details.open = false;
    }
    feedback.hidden = !checked;
    /* Nur ausdrücklich geprüfte Antworten erhalten einen sichtbaren Lösungstext. */

    if (checked) feedback.textContent = this.feedbackText(question, selected, right);
  }

  /** Formuliert den Kartenstatus; Bewertung hat Vorrang vor bloßer Vollständigkeit. */
  statusText(question, selected, checked, right) {
    /* Eine vorhandene Bewertung hat Vorrang vor den Zuständen beantwortet, teilweise und offen. */

    if (checked) return right ? '✓ Richtig' : '× Falsch';
    
    /* Vollständige, aber ungeprüfte Antworten werden noch nicht als richtig oder falsch bezeichnet. */

    if (window.LHUNDG_CORE.complete(question, selected)) return '● Beantwortet';

    /* Eine unvollständige Auswahl heißt teilweise, eine leere Auswahl bleibt offen. */

    return selected.size ? 'Teilweise' : '○ Offen';
  }

  /** Formatiert eine Lösung als Zuordnungspaar oder als Antwortbuchstabe mit Antworttext. */
  formatSolution(question, token) {
    /* Zuordnungen erhalten Pfeile; normale Antworten enthalten Buchstabe und Antworttext. */

    return question.type === 'mapping'
      ? token.replace(':', ' → ')
      : `${token}: ${question.answers[token]}`;
  }

  /** Formuliert das aufgelöste Ergebnis mit klarer Trennung von Original- und Beispiellösung. */
  feedbackText(question, selected, right) {
    if (right) return 'Richtig!';
    /* Lesbare Auswahl mit Zuordnungspfeilen; ohne Tokens steht ausdrücklich keine. */

    const selection = selected.size
      ? [...selected].map(value => value.replace(':', ' → ')).join(', ')
      : 'keine';
    /* Bei Fehlern bleibt die eigene Auswahl neben dem Quellenschlüssel nachvollziehbar. */
    const prefix = `Deine Auswahl: ${selection}. `;
    /* Kennzeichnet eigene Beispiellösungen statt einer angeblich amtlichen Quelle. */
    const source = question.example ? 'Lösung der eigenen Beispielfrage' : 'Lösung laut Quelle';
    /* Vollständiger Lösungsschlüssel mit je einer Antwort pro Zeile. */
    const solution = question.correct.map(token => this.formatSolution(question, token)).join('\n');
    /* Optionale fachliche Einordnung, sichtbar erst zusammen mit dem Lösungsfeedback. */
    const explanation = question.explanation ? `\n\nEinordnung: ${question.explanation}` : '';

    return `${prefix}${source}:\n${solution}${explanation}`;
  }
};
