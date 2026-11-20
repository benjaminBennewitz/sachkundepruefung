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
    details.append(this.dom.node('summary', entry.caution ? 'Antwort verstehen · Kataloghinweis' : 'Antwort verstehen'));
    content.append(this.dom.node('p', 'Lernhilfe zur Antwort dieses Katalogs', 'microcopy'));
    content.append(this.explanationText('p', entry.text));
    if (entry.caution) content.append(this.explanationText('p', entry.caution, 'source-note'));
    if (entry.note) content.append(this.explanationText('p', entry.note, 'source-note'));
    if (entry.extra) content.append(this.createExtra(entry.extra));
    const references = entry.references || (entry.sourceUrl ? [{ url: entry.sourceUrl, label: 'Fachliche Quelle' }] : []);
    for (const reference of references) {
      const paragraph = this.dom.node('p');
      const link = this.dom.node('a', `${reference.label} ↗`);
      link.href = reference.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer external';
      paragraph.append(link);
      content.append(paragraph);
    }
    if (entry.comparisons) content.append(this.createComparison(entry.comparisons));
    details.append(content);
    return details;
  }

  /**
   * Trennt kurzes Zusatzwissen optisch von der vorausgehenden Testantwort.
   * @param {{title: string, items: Array<{label: string, text: string}>, note?: string}} extra Belegte Zusatzinformationen.
   * @returns {HTMLElement} Beschrifteter Wissensblock ohne eigene Auswahl- oder Bewertungslogik.
   */
  createExtra(extra) {
    const section = this.dom.node('section', undefined, 'explanation-extra');
    const list = this.dom.node('ul');
    section.append(this.dom.node('h4', extra.title));
    for (const { label, text } of extra.items) {
      const item = this.dom.node('li');
      item.append(this.dom.node('strong', `${label}: `), this.explanationText('span', text));
      list.append(item);
    }
    section.append(list);
    if (extra.note) section.append(this.explanationText('p', extra.note));
    return section;
  }

  /**
   * Hebt einzelne Antwortbuchstaben hervor und behandelt alle anderen Inhalte als reinen Text.
   * @param {string} tag Absatz, Textabschnitt oder Bildunterschrift.
   * @param {string} text Redaktioneller Text ohne HTML oder Markdown.
   * @param {string} [className] Vorhandene Stilklasse für einen ergänzenden Hinweis.
   * @returns {HTMLElement} Textelement mit sicheren Textknoten und starken Antwortbuchstaben.
   */
  explanationText(tag, text, className) {
    const paragraph = this.dom.node(tag, undefined, className);
    text.split(/\b([A-F])\b/u).forEach((part, index) => {
      if (part) paragraph.append(index % 2 ? this.dom.node('strong', part) : part);
    });
    return paragraph;
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
      figure.append(image, this.explanationText('figcaption', item.caption));
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

    this.updateAnswers(question, card, checked);
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

  /**
   * Markiert ausgewählte richtige/falsche und fehlende richtige Antworten erst nach der Freigabe.
   * @param {SachkundeQuestion} question Frage mit ihrem unveränderten Lösungsschlüssel.
   * @param {HTMLElement} card Bestehende Fragenkarte.
   * @param {boolean} checked Ob Lösungsfeedback für diese Frage sichtbar sein darf.
   * @returns {void} Kein Rückgabewert.
   */
  updateAnswers(question, card, checked) {
    for (const option of card.querySelectorAll('.answer-option')) {
      const input = option.querySelector('input');
      const correct = question.correct.includes(input.value);
      const missing = checked && correct && !input.checked;
      const incorrect = checked && !correct && input.checked;
      const selectedCorrect = checked && correct && input.checked;
      option.classList.toggle('answer-missing', missing);
      option.classList.toggle('answer-incorrect', incorrect);
      option.classList.toggle('answer-correct', selectedCorrect);
      let state = option.querySelector('.answer-state');
      if (!checked) {
        state?.remove();
        continue;
      }
      if (!state) {
        state = this.dom.node('span', '', 'answer-state');
        option.append(state);
      }
      state.textContent = missing ? '! Fehlte' : incorrect ? '× Falsch gewählt' : selectedCorrect ? '✓ Richtig gewählt' : '';
      state.hidden = !state.textContent;
      /* Zuordnungsfelder zeigen den Status kompakt; die volle Bedeutung bleibt zugänglich. */
      if (question.type === 'mapping') {
        const description = state.textContent;
        state.textContent = description.charAt(0);
        state.setAttribute('role', 'img');
        state.setAttribute('aria-label', description);
        state.title = description;
      }
    }
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
    if (right) return window.LHUNDG_EXPLANATIONS[question.uid]?.caution
      ? 'Richtig! Lies auch den Kataloghinweis unter „Antwort verstehen“.'
      : 'Richtig!';
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
