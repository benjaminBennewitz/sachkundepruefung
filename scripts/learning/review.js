/* scripts/learning/review.js */

/**
 * @file Dynamischer Fehlerbereich mit frischen Wiederholungsrunden.
 * @description Leitet Fehler aus geprüften Katalogantworten ab; hält ungeprüfte Versuche ausschließlich im Arbeitsspeicher.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.Review = class Review {
  /** @param {TrainerSession} session Originaler Katalogstand. @param {TrainerLearningView} view Gemeinsame Lernansicht. */
  constructor(session, view) {
    this.session = session;
    this.view = view;
    this.dom = window.LHUNDG_TRAINER.dom;
    this.core = window.LHUNDG_CORE;
    this.active = false;
    this.choosing = false;
    this.questions = [];
    this.practice = null;
    this.cards = null;
  }

  /** @param {SachkundeQuestion} question Originalfrage. @returns {boolean} Aktuell gültig und ausdrücklich falsch geprüft. */
  isError(question) {
    const selected = this.session.state.answers.get(question.id);
    return this.core.complete(question, selected) &&
      this.session.state.checked.get(question.id) === this.session.signature(question) &&
      !this.core.exact(selected, question.correct);
  }

  /** @returns {SachkundeQuestion[]} Nur vollständig und unverändert falsch geprüfte Katalogfragen. */
  errors() {
    return this.session.questions.filter(question => this.isError(question));
  }

  /** Verbindet die dauerhafte Sammlung sowie Start und Abschluss der flüchtigen Runde. */
  bind() {
    this.dom.get('showErrors').addEventListener('click', () => this.open());
    this.dom.get('viewErrorAnswers').addEventListener('click', () => this.show());
    this.dom.get('chooseErrorAction').addEventListener('click', () => this.open());
    this.dom.get('startErrorReview').addEventListener('click', () => this.start());
    this.dom.get('finishErrorReview').addEventListener('click', () => this.finish());
  }

  /** Öffnet zunächst die bewusste Auswahl, ohne bereits eine Fehlerfrage oder Lösung einzublenden. */
  open() {
    if (this.session.isExam) return;
    this.view.filters.clear();
    this.choosing = true;
    this.session.state.status = 'wrong';
    this.dom.get('statusFilter').value = 'wrong';
    this.dom.get('result').hidden = true;
    this.view.applyFilters();
    this.dom.get('questionStage').scrollTop = 0;
    this.dom.get('errorCollectionTitle').focus({ preventScroll: true });
  }

  /** Öffnet die bisherigen Fehler mit Auswahl, Bewertung und Erklärungen. */
  show() {
    this.view.filters.clear();
    this.session.state.status = 'wrong';
    this.dom.get('statusFilter').value = 'wrong';
    this.dom.get('result').hidden = true;
    this.view.applyFilters({ focus: true });
  }

  /** Startet eine feste Fragenfolge ohne die bisherigen Antworten zu löschen. */
  start() {
    if (this.session.isExam || this.active) return;
    const questions = this.errors();
    if (!questions.length) return;
    this.view.filters.clear();
    this.questions = questions;
    this.active = true;
    /* Die vorhandene Kartenkomponente erhält nur einen flüchtigen Antwortstand. */
    const state = { ...this.session.state, answers: new Map(), checked: new Map(), instant: this.session.state.instant, status: 'all' };
    this.practice = Object.assign(Object.create(this.session), { state, isExam: false, persist: () => this.commit() });
    this.cards = new window.LHUNDG_TRAINER.QuestionView(this.practice, () => {
      this.view.updateOverview();
      this.update();
    });
    this.session.state.status = 'wrong';
    this.dom.get('statusFilter').value = 'wrong';
    this.dom.get('result').hidden = true;
    this.view.applyFilters({ focus: true });
  }

  /** Übernimmt ausschließlich vollständig und ausdrücklich neu geprüfte Antworten in denselben Katalog. */
  commit() {
    if (!this.active) return;
    for (const question of this.questions) {
      const selected = this.practice.state.answers.get(question.id);
      if (!this.core.complete(question, selected) ||
        this.practice.state.checked.get(question.id) !== this.practice.signature(question)) continue;
      this.session.state.answers.set(question.id, new Set(selected));
      this.session.state.checked.set(question.id, this.session.signature(question));
    }
    /* Merker teilen sich den Originalzustand; ungeprüfte Antwortentwürfe werden nie serialisiert. */
    this.session.persist();
  }

  /** @returns {{checked: number, correct: number}} Tatsächlich geprüfte Versuche dieser Runde. */
  score() {
    let checked = 0;
    let correct = 0;
    if (!this.active) return { checked, correct };
    for (const question of this.questions) {
      if (this.practice.state.checked.get(question.id) !== this.practice.signature(question)) continue;
      checked += 1;
      if (this.core.exact(this.practice.state.answers.get(question.id) || new Set(), question.correct)) correct += 1;
    }
    return { checked, correct };
  }

  /** Setzt innerhalb der festen Runde bei der nächsten noch nicht erneut geprüften Frage fort. */
  resume() {
    const state = this.session.state;
    const remaining = question => !this.practice.state.checked.has(question.id);
    const next = this.questions.find((question, index) => index >= state.index && remaining(question)) ||
      this.questions.find(remaining) || this.questions[state.index];
    if (next) this.view.goTo(next.id, { keepFilters: true });
  }

  /** Verwirft nur ungeprüfte Entwürfe; bereits geprüfte Ergebnisse sind bereits im Originalstand enthalten. */
  stop() {
    this.active = false;
    this.choosing = false;
    this.questions = [];
    this.practice = null;
    this.cards = null;
  }

  /** @returns {SachkundeQuestion[]} Vollständige Entwürfe, die noch keine passende neue Bewertung besitzen. */
  pending() {
    if (!this.active) return [];
    return this.questions.filter(question =>
      this.core.complete(question, this.practice.state.answers.get(question.id)) &&
      this.practice.state.checked.get(question.id) !== this.practice.signature(question));
  }

  /** @returns {boolean} Ob die feste Fußaktion die noch verdeckten Versuche auswerten soll. */
  requiresEvaluation() {
    return this.active && !this.session.state.instant && (!this.score().checked || this.pending().length > 0);
  }

  /** Führt die im Footer beschriftete Aktion aus, ohne den ganzen Katalog auszuwerten. */
  primaryAction() {
    if (this.requiresEvaluation()) this.evaluate();
    else this.finish();
  }

  /** Prüft bei ausgeschaltetem Sofort-Feedback nur vollständige Versuche und zeigt danach deren Lösungen. */
  evaluate() {
    if (!this.active) return;
    const pending = this.pending();
    if (!pending.length) return;
    for (const question of pending) this.practice.state.checked.set(question.id, this.practice.signature(question));
    this.commit();
    this.view.render();
    const score = this.score();
    window.LHUNDG_UI.toast(`${score.correct} von ${score.checked} erneut geprüften Fragen richtig. ` +
      'Offene oder unvollständige Versuche verändern deinen bisherigen Lernstand nicht.', { type: 'info' });
  }

  /** Beendet die Runde bewusst und zeigt die jetzt verbleibende dynamische Fehlersammlung. */
  finish() {
    if (!this.active) return;
    const { checked, correct } = this.score();
    const total = this.questions.length;
    this.stop();
    this.view.applyFilters({ focus: true });
    window.LHUNDG_UI.toast(`${correct} von ${total} bisherigen Fehlern jetzt richtig beantwortet. ` +
      `${total - checked} Fragen noch nicht erneut geprüft.`, { type: 'info' });
  }

  /** Synchronisiert den Sammlungshinweis, ohne ungeprüfte Lösungen preiszugeben oder die Reihenfolge zu ändern. */
  update() {
    const state = this.session.state;
    const count = this.errors().length;
    const visible = state.status === 'wrong' && !this.session.isExam;
    const button = this.dom.get('showErrors');
    button.hidden = this.session.isExam;
    button.textContent = `Meine Fehler (${count})`;
    button.setAttribute('aria-pressed', String(visible));
    button.setAttribute('aria-label', `Meine Fehler in ${this.session.config.title}: ${count} geprüfte falsche Fragen`);
    this.dom.get('errorCollection').hidden = !visible;
    this.dom.get('errorCollection').classList.toggle('error-collection--choice', this.choosing);
    this.dom.get('questionStage').classList.toggle('question-stage--choice', this.choosing);
    this.dom.get('errorCollectionChoices').hidden = !this.choosing;
    this.dom.get('errorCollectionActions').hidden = this.choosing;
    this.dom.get('startErrorReview').disabled = !count;
    this.dom.get('viewErrorAnswers').disabled = !count;
    this.dom.get('questions').hidden = this.choosing;
    this.dom.get('finishErrorReview').hidden = !this.active;
    for (const id of ['previous', 'next', 'position', 'evaluate']) this.dom.get(id).hidden = this.choosing;
    this.dom.get('intermediate').hidden = this.choosing || this.session.isExam;
    const score = this.score();
    if (this.active) this.practice.state.instant = state.instant;
    this.dom.get('errorCollectionTitle').textContent = this.choosing ? 'Meine Fehler' :
      this.active ? 'Fehler üben' : 'Fehler ansehen';
    this.dom.get('errorCollectionNote').textContent = this.choosing ?
      `${count} geprüfte falsche Fragen aus „${this.session.config.title}“. Was möchtest du tun?` :
      this.active ? `${score.checked} von ${this.questions.length} erneut geprüft · ${score.correct} jetzt richtig` :
        `${state.search || state.category !== 'all' ? `${state.items.length} von ${count}` : count} bisherige Fehler · Auswahl und Lösungen sichtbar`;
    if (this.choosing && !count) this.dom.get('errorCollectionNote').textContent =
      'Noch keine geprüften falschen Antworten in diesem Katalog. Offene Fragen gehören nicht zu „Meine Fehler“.';
    this.dom.get('finishErrorReview').textContent = score.checked === this.questions.length ?
      'Runde abschließen' : 'Runde beenden';
    for (const id of ['search', 'statusFilter', 'categoryFilter', 'intermediate']) {
      this.dom.get(id).disabled = this.active;
    }
    this.dom.get('evaluate').textContent = this.requiresEvaluation() ? 'Runde auswerten' :
      this.active ? this.dom.get('finishErrorReview').textContent :
        this.session.isExam ? 'Simulation auswerten' : 'Katalog auswerten';
    this.dom.get('evaluate').disabled = this.requiresEvaluation() && !this.pending().length;
    this.dom.get('instantFeedback').disabled = this.session.isExam;
    this.view.updateFeedbackToggle?.();
  }
};
