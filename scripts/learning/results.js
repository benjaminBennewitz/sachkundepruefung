/* scripts/learning/results.js */

/**
 * @file Auswertung und Ergebnisdarstellung.
 * @description Koordiniert den Testabschluss und zeigt Gesamtwertung, Prüfungsteile und Fehlerwege.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.Results = class Results {
  /** Feste Wertungshinweise, getrennt von der Auswahl des passenden Ergebnisses. */
  static descriptions = {
    example:
      'Unverbindliches, geschätztes Beispiel. Eigene Übungswertung: 1 Punkt nur bei vollständig richtiger Auswahl; ' +
      'sonst 0 Punkte. Keine Teilpunkte. Mindestens 75 % je Teil und insgesamt (38 von 50). ' +
      'Die unbekannte Essener Teilpunktewertung und ein Nachgespräch werden nicht nachgebildet.',
    catalogue:
      'Alle Fragen dieses Lernbereichs wurden gewertet. ' +
      'Offene und unvollständige Antworten zählen als falsch.',
    kammer:
      'Diese Übungsrunde hat keine verbindliche Bestehensgrenze. ' +
      'Die prüfende Stelle beurteilt deine Sachkunde, gegebenenfalls im Gespräch.'
  };

  /** @param {TrainerSession} session Lernzustand. @param {TrainerLearningView} view Sichtbare Lernansicht. */
  constructor(session, view) {
    this.session = session;                // Gemeinsame Sitzung als einzige Quelle für Lern- und Prüfungszustand.
    this.state = session.state;            // Gemeinsam genutzter Zustand; keine zweite Kopie des Lernstands.
    this.view = view;                      // Lernansicht für Rendering, Navigation und Fokusführung.
    this.dom = window.LHUNDG_TRAINER.dom;  // Vorhandene sichere Helfer zum Erzeugen und Auffinden von DOM-Elementen.
    this.core = window.LHUNDG_CORE;        // DOM-unabhängige Regeln für Vollständigkeit, Validierung und Wertung.
  }

  /** @param {boolean} [intermediate=false] Nur vollständig beantwortete Fragen werten. @returns {Promise<void>} Abschluss. */
  async evaluate(intermediate = false) {
    const chosen = this.questionsToEvaluate(intermediate);                // Für die angeforderte Zwischen- oder Gesamtauswertung relevante Fragen.
    const accepted = await this.confirmCompletion(chosen, intermediate);  // Freigabe zum Abschluss; bei offenen Prüfungsfragen ist eine Bestätigung erforderlich.

    // Eine abgelehnte Abschlussbestätigung verändert weder Prüfungszustand noch Bewertungen.
    if (!accepted) return;

    this.markEvaluated(chosen);  // Markiert die ausgewählten Antworten als geprüft und sichert den gegebenenfalls abgeschlossenen Test.

    const score = this.calculate(chosen);  // Berechnetes Gesamtergebnis einschließlich gegebenenfalls separater Prüfungsteile.

    this.render(score, intermediate);  // Baut die Ergebnisübersicht aus der gerade berechneten Gesamt- und Teilwertung auf.
    this.show();                       // Macht die fertige Auswertung sichtbar und führt Fokus und Lesebereich dorthin.

    // Der optionale Unterstützungshinweis erscheint nur nach einer Gesamtauswertung mit vorhandenen Antworten.
    if (!intermediate && this.state.answers.size) {
      window.openSupportDialog?.({ automatic: true, returnFocus: this.dom.get('result') });  // Öffnet den optional vorhandenen Unterstützungshinweis mit Rückkehr zum Ergebnis.
    }
  }

  /** Beschränkt nur die Zwischenauswertung auf bereits vollständig beantwortete Fragen. */
  questionsToEvaluate(intermediate) {
    // Eine Gesamtauswertung umfasst auch offene und unvollständige Fragen.
    if (!intermediate) return this.session.questions;

    return this.session.questions.filter(question =>
      this.core.complete(question, this.state.answers.get(question.id))
    );
  }
  /** @param {SachkundeQuestion[]} chosen Auswahl. @param {boolean} intermediate Zwischenstand. @returns {Promise<boolean>} Freigabe. */
  async confirmCompletion(chosen, intermediate) {
    // Zwischenstände, Lernkataloge und bereits abgeschlossene Tests benötigen keine Abschlusswarnung.
    if (intermediate || !this.session.isExam || this.state.finished) return true;

    // Offene und unvollständige Fragen, die beim Abschluss null Punkte erhalten.
    const open = chosen.filter(
      question => !this.core.complete(question, this.state.answers.get(question.id))
    ).length;

    // Ein vollständig beantworteter Test kann ohne Warnung vor offenen Antworten ausgewertet werden.
    if (!open) return true;

    return window.LHUNDG_UI.confirm({
      title: 'Test jetzt auswerten?',
      message: `Noch ${open} Fragen sind offen oder unvollständig und werden als falsch gewertet.`,
      confirmLabel: 'Jetzt auswerten',
      cancelLabel: 'Weiter beantworten'
    });
  }

  /** @param {SachkundeQuestion[]} chosen Fragen, deren aktuelle Antworten als geprüft markiert werden. */
  markEvaluated(chosen) {
    // Nur Prüfungsmodi benötigen einen sitzungsbezogenen Abschlussstatus.
    if (this.session.isExam) this.state.finished = true;
    // Bindet jede Bewertung an die aktuelle Auswahl, damit spätere Änderungen sie ungültig machen.
    for (const question of chosen) {
      if (this.session.canShowEvaluation(question)) {
        this.state.checked.set(question.id, this.session.signature(question));
      }
    }
    this.session.persist();  // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.
    this.view.render();      // Zeigt die aktualisierten Karten und synchronisiert ihre Zustände mit der Navigation.
  }

  /** @param {SachkundeQuestion[]} chosen Auswahl. @returns {object} Gesamt- und optionale Abschnittswertung. */
  calculate(chosen) {
    // Alle nicht exakt richtigen Fragen, einschließlich offener und unvollständiger.
    const wrong = chosen.filter(
      question => !this.core.exact(this.state.answers.get(question.id) || new Set(), question.correct)
    );
    const sections = this.session.config.sections;  // Abschnittsvorgaben des Profils; nur das Essen-Beispiel benötigt eine Teilwertung.

    return {
      total: chosen.length,
      wrong,
      correct: chosen.length - wrong.length,
      sectionScore: sections ? this.core.evaluateSections(chosen, this.state.answers, sections) : null
    };
  }

  /** @param {object} score Ergebnis. @param {boolean} intermediate Zwischenstand. @returns {string} Ergebnistitel. */
  title(score, intermediate) {
    // Das Essen-Beispiel verlangt bestandene Teilwertungen und erhält deshalb einen eigenen Ergebnistitel.
    if (score.sectionScore) {
      // Nur das Erreichen der im Profil festgelegten Grenze führt zum Titel Übungstest bestanden.
      return score.sectionScore.passed
        ? 'Beispieltest nach Übungswertung bestanden.'
        : 'Beispieltest: Noch ein bisschen üben.';
    }

    // Eine Zwischenauswertung behauptet noch kein abgeschlossenes Gesamtergebnis.
    if (intermediate) return 'Dein Zwischenstand';
    // Katalogauswertungen sind Lernstände und keine bestandenen Prüfungen.
    if (!this.session.isExam) return 'Deine Auswertung';
    // Die Kammerübung zeigt eine Lernquote ohne verbindliche Bestehensgrenze.
    if (this.session.config.passCount === null) return 'Deine §-11-Lernquote';

    // Nur das Erreichen der im Profil festgelegten Grenze führt zum Titel Übungstest bestanden.
    return score.correct >= this.session.config.passCount
      ? 'Übungstest bestanden.'
      : 'Noch ein bisschen üben.';
  }

  /** @param {object} score Ergebnis. @param {boolean} intermediate Zwischenstand. @returns {string} Wertungsgrenzen. */
  description(score, intermediate) {
    const { isExam, config } = this.session;    // Aktiver Wertungskontext mit seinen festgelegten Übungsgrenzen.
    const descriptions = Results.descriptions;  // Gemeinsam gepflegte Texte für Beispiel-, Katalog- und Kammerauswertung.

    // Für das Essen-Beispiel werden die eigenen Annahmen und die fehlenden Teilpunkte offengelegt.
    if (score.sectionScore) return descriptions.example;
    // Ein Zwischenstand erläutert ausdrücklich seinen auf beantwortete Fragen begrenzten Umfang.
    if (intermediate) return `Nur ${score.total} vollständig beantwortete Fragen wurden gewertet.`;
    // Ein Katalogabschluss zählt auch offene und unvollständige Antworten als falsch.
    if (!isExam) return descriptions.catalogue;
    // Die §-11-Übung darf aus einer Lernquote keine amtliche Bestehenszusage machen.
    if (config.passCount === null) return descriptions.kammer;

    return `Mindestens ${config.passCount} von ${config.examCount} sind in diesem Übungstest erforderlich. Keine Garantie für die echte Prüfung.`;
  }

  /** @param {object} score Ergebnis. @param {boolean} intermediate Zwischenstand. */
  render(score, intermediate) {
    const result = this.dom.get('result');  // Vorhandener Ergebnisbereich, dessen bisheriger Inhalt vollständig ersetzt wird.

    result.replaceChildren(
      this.dom.node('h3', this.title(score, intermediate)),
      this.dom.node('p', this.description(score, intermediate)),
      this.createStats(score)
    );
    // Nur Profile mit Abschnitten erhalten zusätzlich die getrennten Teilergebnisse.
    if (score.sectionScore) this.appendSections(result, score.sectionScore);
    // Fehlernavigation erscheint nur, wenn es falsche oder offene Fragen gibt.
    if (score.wrong.length) {
      result.append(
        this.dom.node('p', 'Zu einer falschen oder offenen Frage springen:'),
        this.createErrors(score.wrong)
      );
    }
    result.append(this.createActions(score.wrong.some(question => this.state.checked.has(question.id))));
  }

  /** @param {object} score Ergebnis. @returns {HTMLElement} Gesamtstatistik. */
  createStats(score) {
    const stats = this.dom.node('div', undefined, 'result-stats');                               // Container der drei Gesamtkennzahlen.
    const percent = score.total ? `${Math.round((score.correct / score.total) * 100)} %` : '–';  // Gerundete Trefferquote; bei leerer Zwischenauswertung steht ein Gedankenstrich.

    stats.append(
      this.createStat(`${score.correct} / ${score.total}`, 'richtig'),
      this.createStat(percent, 'richtige Antworten'),
      this.createStat(String(score.wrong.length), 'falsch / offen')
    );

    return stats;
  }

  /** @param {string} value Wert. @param {string} label Bedeutung. @returns {HTMLElement} Kennzahl. */
  createStat(value, label) {
    const stat = this.dom.node('div', undefined, 'result-stat');  // Einheitliche Darstellung einer Kennzahl mit lesbarer Bedeutung.

    stat.append(this.dom.node('strong', value), this.dom.node('span', label));

    return stat;
  }

  /** @param {HTMLElement} result Ergebnisbereich. @param {object} score Abschnittswertung. */
  appendSections(result, score) {
    const sections = this.dom.node('div', undefined, 'result-stats');  // Separater Kennzahlenbereich für die drei Prüfungsteile.

    // Zeigt jeden Prüfungsteil mit seiner eigenen, separat zu erreichenden Grenze.
    for (const section of score.sections) sections.append(this.createSectionStat(section));

    result.append(
      this.dom.node('h4', 'Alle drei Teile müssen mindestens 75 % erreichen.'),
      sections,
      this.dom.node('p',
        'Die Verteilung 17 / 17 / 16 ist unsere Annahme. Ein gutes Gesamtergebnis gleicht einen nicht bestandenen Teil nicht aus.'
      )
    );
  }

  /** Zeigt Quote und separat zu erreichende Grenze eines Prüfungsteils. */
  createSectionStat(section) {
    const stat = this.createStat(`${section.correct} / ${section.total}`, section.label);  // Erreichte Punktzahl im Verhältnis zum Umfang dieses Teils.
    const status = section.passed ? 'Erreicht' : 'Nicht erreicht';                         // Aussage, ob die eigene Teilgrenze erreicht wurde.

    stat.append(this.dom.node('p', `${status} · mindestens ${section.required} richtig`));

    return stat;
  }

  /** @param {SachkundeQuestion[]} wrong Falsche oder offene Fragen. @returns {HTMLElement} Fehlernavigation. */
  createErrors(wrong) {
    const errors = this.dom.node('div', undefined, 'error-number-grid');  // Tastaturbedienbares Raster der falschen und offenen Fragen.

    // Verbindet jede falsche oder offene Frage mit ihrer Position und einem direkten Rücksprung.
    for (const question of wrong) {
      const number = this.session.questions.indexOf(question) + 1;                                        // Position dieser Frage innerhalb der aktuellen Testfolge.
      const button = this.dom.button(String(number), 'error-number', () => this.view.goTo(question.id));  // Rücksprung zur konkreten Frage, ohne die Herkunftsnummer zu verlieren.

      button.setAttribute('aria-label', `Frage ${number}, ${question.source} ${question.sourceId}`);
      errors.append(button);
    }

    return errors;
  }

  /** @param {boolean} hasErrors Fehlerwiederholung anbieten. @returns {HTMLElement} Ergebnisaktionen. */
  createActions(hasErrors) {
    const actions = this.dom.node('div', undefined, 'result-actions');                                 // Aktionen zum Fortsetzen, Wiederholen und Schließen der Auswertung.
    const continueButton = this.dom.button('Weiterlernen', 'primary', () => this.continueLearning());  // Setzt das Lernen bei der nächsten offenen Frage fort.
    const closeButton = this.dom.button('Ergebnis schließen', 'secondary', () => this.close());        // Schließt die Auswertung und gibt den Fokus an ihren Auslöser zurück.

    actions.append(continueButton);

    // Fehlerwiederholung wird nur angeboten, wenn tatsächlich falsche oder offene Fragen vorhanden sind.
    if (hasErrors) {
      actions.append(this.dom.button('Fehler wiederholen', 'secondary', () => this.repeatErrors()));
    }

    actions.append(closeButton);

    return actions;
  }

  /** Schließt das Ergebnis und setzt das Lernen bei der nächsten offenen Frage fort. */
  continueLearning() {
    this.dom.get('result').hidden = true;
    this.view.resume();  // Sucht die nächste offene Frage, bei Bedarf wieder vom Kataloganfang.
  }

  /** Schließt das Ergebnis und gibt den Fokus an die Auswertungsaktion zurück. */
  close() {
    this.dom.get('result').hidden = true;
    this.dom.get('evaluate').focus();
  }

  /** Aktiviert die vorhandene Fehlerfilterung und fokussiert die erste Fehlerfrage. */
  repeatErrors() {
    this.dom.get('result').hidden = true;
    this.state.status = 'wrong';
    this.dom.get('statusFilter').value = 'wrong';
    this.view.applyFilters({ focus: true });  // Zeigt die Fehlerliste und setzt den Fokus auf ihre erste passende Frage.
  }

  /** Macht das Ergebnis sichtbar und verschiebt den Fokus ohne unkontrollierten Scrollsprung. */
  show() {
    const result = this.dom.get('result');  // Ergebnis als gemeinsames Ziel für Sichtbarkeit, Tastaturfokus und Rückkehr aus dem Dialog.

    result.hidden = false;
    result.focus({ preventScroll: true });
    this.view.reveal(result);
  }
};
