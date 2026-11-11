/* scripts/learning/question-view.js */

/**
 * @file Fragenkarten und Antwortbedienung.
 * @description Rendert einzelne Fragen, Herkunft, Auswahl und ausdrückliches Lösungsfeedback.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.QuestionView = class QuestionView {
  /**
   * @param {TrainerSession} session Aktiver Lernzustand.
   * @param {Function} onChange Aktualisiert Übersicht oder gefilterte Ansicht nach einer Änderung.
   */
  constructor(session, onChange) {
    this.session = session;                // Gemeinsame Sitzung als einzige Quelle für Lern- und Prüfungszustand.
    this.state = session.state;            // Gemeinsam genutzter Zustand; keine zweite Kopie des Lernstands.
    this.dom = window.LHUNDG_TRAINER.dom;  // Vorhandene sichere Helfer zum Erzeugen und Auffinden von DOM-Elementen.
    this.onChange = onChange;              // Rückmeldung an die Lernansicht nach Änderungen an Antwort oder Merkliste.
  }

  /** @param {SachkundeQuestion} question Frage. @returns {HTMLElement} Vollständige Fragenkarte. */
  render(question) {
    const card = this.dom.node('article', undefined, 'question-card');  // Neue Fragenkarte, auf die Status, Antworten und Fokusziel bezogen werden.
    const feedback = this.dom.node('div', undefined, 'feedback');       // Zugänglicher Rückmeldebereich; Inhalte erscheinen erst nach ausdrücklicher Prüfung.

    card.id = `q-${question.id}`;
    card.setAttribute('aria-labelledby', `prompt-${question.id}`);
    feedback.setAttribute('role', 'status');

    card.append(this.createHeader(question), this.createPrompt(question), this.createSource(question));
    this.appendNotes(card, question);  // Ergänzt Prüfungsteil sowie die für diese Frage geltenden Herkunftshinweise.

    // Abbildungen werden nur bei Fragen eingefügt, deren Inhalt sie tatsächlich benötigt.
    if (question.requiresVisual) card.append(this.createImages(question));

    // Zuordnungsbegriffe erscheinen nur bei Fragen mit einem erklärenden Zielverzeichnis.
    if (question.mappingTargets) card.append(this.createMappingContext(question));

    card.append(this.createFieldset(question), this.createActions(question, card), feedback);
    this.update(question, card);  // Bringt Status, Prüfbutton und Rückmeldung der bestehenden Karte auf denselben Stand.

    return card;
  }

  /** @param {SachkundeQuestion} question Frage. @returns {HTMLElement} Nummer, Status und Merken. */
  createHeader(question) {
    const header = this.dom.node('div', undefined, 'question-card-head');                             // Kopfzeile für Fragenummer, Status und Merkschalter.
    const number = this.session.questions.indexOf(question) + 1;                                      // Position in der aktuellen Test- oder Katalogreihenfolge, nicht die Originalnummer.
    const bookmark = this.dom.button('', 'bookmark', () => this.toggleBookmark(question, bookmark));  // Merkschalter, der nur den aktuellen Lernbereich verändert.

    bookmark.setAttribute('aria-label', `Frage ${question.sourceId} merken`);
    this.updateBookmark(question, bookmark);                                                          // Gleicht Sternsymbol und aria-pressed mit dem aktuellen Merkzustand ab.

    header.append(
      this.dom.node('p', `FRAGE ${number} / ${this.session.questions.length}`, 'question-number'),
      this.dom.node('span', '', 'status-pill'),
      bookmark
    );

    return header;
  }

  /** @param {SachkundeQuestion} question Frage. @returns {HTMLElement} Fokussierbare Überschrift. */
  createPrompt(question) {
    const prompt = this.dom.node('h3', question.prompt, 'question-prompt');  // Frageüberschrift, die bei Tastaturnavigation gezielt fokussiert werden kann.

    prompt.tabIndex = -1;
    prompt.id = `prompt-${question.id}`;

    return prompt;
  }

  /** @param {SachkundeQuestion} question Frage. @returns {HTMLElement} Herkunft und Originalverweis. */
  createSource(question) {
    const source = window.LHUNDG_SOURCES[question.sourceKey];                           // Metadaten der tatsächlich verwendeten Quellfassung.
    const provenance = this.dom.node('div', undefined, 'question-source');              // Gemeinsamer Bereich für Quellenname und nachvollziehbaren Herkunftslink.
    const kind = question.example ? 'Beispielfrage' : 'Originalfrage';                  // Eigene Beispiele werden ausdrücklich von Originalfragen unterschieden.
    const page = question.sourcePage ? ` · Vorlagenseite ${question.sourcePage}` : '';  // Optionale Vorlagenseite; ohne Angabe wird kein Seitenzusatz erfunden.

    provenance.append(
      this.dom.node('span', `${source.label} · ${kind} ${question.sourceId}${page} · ${question.category}`)
    );
    provenance.append(this.createSourceLink(question, question.sourceUrl || source.page));

    return provenance;
  }

  /** Erstellt den Herkunftslink und sichert externe Ziele gegen Zugriff auf das Ausgangsfenster. */
  createSourceLink(question, url) {
    const link = this.dom.node('a', this.sourceLinkText(question, url));  // Herkunfts- oder Rechtsgrundlagenlink mit kontextgerechter Beschriftung.
    const external = url.startsWith('https://');                          // Nur externe HTTPS-Quellen öffnen in einem abgesicherten neuen Tab.

    link.href = url;

    // Externe Originalquellen erhalten einen neuen Tab und dürfen das Ausgangsfenster nicht steuern.
    if (external) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer external';
    }

    return link;
  }

  /** Unterscheidet eigene Rechtsbeispiele, externe Originalquellen und lokale Herkunftshinweise. */
  sourceLinkText(question, url) {
    // Eigene Fragen verlinken ihre konkrete Rechtsgrundlage statt eines angeblichen Originalkatalogs.
    if (question.example) return `Rechtsgrundlage: ${question.legalReference} ↗`;
    // Öffentliche Herausgeberquellen werden als externe Originalverweise beschriftet.
    if (url.startsWith('https://')) return 'Originalquelle beim Herausgeber ↗';

    return 'Herkunft dieses Übungsbogens →';
  }

  /** Ergänzt Prüfungsteil und quellenbezogene Hinweise in ihrer bisherigen Reihenfolge. */
  appendNotes(card, question) {
    const section = this.session.config.sections?.find(item => item.id === question.examSection);  // Zugeordneter Teil der Essen-Übung, falls dieses Profil Abschnitte besitzt.
    const notes = this.sourceNotes(question);                                                      // In der vorgesehenen Reihenfolge ausgewählte Herkunfts- und Beispielhinweise.

    // Ein Prüfungsteil wird nur bei einem vorhandenen Abschnitt des Beispielprofils genannt.
    if (section) card.append(this.dom.node('p', `Prüfungsteil: ${section.label}`, 'microcopy'));

    // Übernimmt die anwendbaren Herkunftshinweise in ihrer vorgesehenen Reihenfolge.
    for (const note of notes) {

      // Nicht zutreffende Beispiel- oder Quellenhinweise werden nicht als leere Absätze eingefügt.
      if (note) card.append(this.dom.node('p', note, 'source-note'));
    }
  }

  /** Liefert nur die zur Quelle gehörenden Einordnungen; Beispiele bleiben ausdrücklich erkennbar. */
  sourceNotes(question) {
    return [
      question.example &&
        'Eigene Beispielfrage – geschätztes, nicht verbindliches Beispiel. Keine Essener Originalfrage.',
      question.referenceOnly &&
        'Dieser Lernbereich nutzt den bereitgestellten Kölner Übungsbogen; Lösungen gelten nur für diese Fassung. Bochum empfiehlt den öffentlichen Kölner Katalog zur Themenvorbereitung. Veröffentlichte Fassungen können von diesem Übungsbogen abweichen. Keine Nachbildung der Bochumer Prüfung.',
      question.note
    ];
  }

  /** @param {SachkundeQuestion} question Bildfrage. @returns {HTMLElement} Responsiver Bildbereich. */
  createImages(question) {
    const images = this.dom.node('div', undefined, 'question-images');                                      // Gemeinsamer Bereich für alle nötigen Teilabbildungen dieser Frage.
    question.images.forEach((source, index) => images.append(this.createImage(question, source, index)));   // Erzeugt alle benötigten Teilabbildungen mit einem eindeutigen Alternativtext.

    return images;
  }

  /**
   * @param {SachkundeQuestion} question Bildfrage.
   * @param {string} source Lokaler Bildpfad.
   * @param {number} index Teilabbildung ab null.
   * @returns {HTMLImageElement} Verzögert geladenes Bild mit bekannten Abmessungen.
   */
  createImage(question, source, index) {
    const image = document.createElement('img');                           // Native Aufgabenabbildung mit späterer Größen- und Lade-Konfiguration.
    const part = question.images.length > 1 ? `, Teil ${index + 1}` : '';  // Zusätzliche Teilnummer im Alternativtext nur bei mehreren Bildern.
    const size = window.LHUNDG_IMAGE_SIZES?.[source];                      // Bekannte Originalmaße zur Vermeidung von Layoutsprüngen.

    image.src = `${source}?v=26`;
    image.alt = `Aufgabenabbildung zu ${question.source}, Frage ${question.sourceId}${part}. Die dargestellte Haltung ist Gegenstand der Frage.`;
    image.loading = 'lazy';
    image.decoding = 'async';

    // Bekannte Breite und Höhe reservieren den Bildplatz schon vor dem Laden.
    if (size) [image.width, image.height] = size;

    return image;
  }

  /** @param {SachkundeQuestion} question Zuordnungsfrage. @returns {HTMLElement} Begriffshilfe. */
  createMappingContext(question) {
    const context = this.dom.node('div', undefined, 'mapping-context');  // Begriffshilfe zu Zuordnungsaufgaben; ihre Reihenfolge verrät keine Lösung.

    context.append(this.dom.node('p', 'Mögliche Begriffe (die Reihenfolge ist keine Lösung):', 'microcopy'));

    // Listet die angebotenen Ziele als Begriffshilfe auf, ohne sie als Lösung zuzuordnen.
    for (const [key, value] of Object.entries(question.mappingTargets)) {
      context.append(this.dom.node('p', `${key} · ${value}`));
    }

    return context;
  }

  /** @param {SachkundeQuestion} question Frage. @returns {HTMLFieldSetElement} Antwortbereich. */
  createFieldset(question) {
    const fieldset = this.dom.node('fieldset');  // Semantische Gruppierung aller Antworten mit gemeinsamer Anleitung.

    // Zuordnungen und Mehrfachauswahl benötigen unterschiedliche Bedienhinweise.
    const instruction = question.type === 'mapping'
      ? 'Ordne jeder Position einen Begriff oder eine Abbildung zu.'
      : 'Eine oder mehrere Antworten können richtig sein.';

    fieldset.append(this.dom.node('legend', instruction), this.createAnswerGrid(question));

    return fieldset;
  }

  /** Erstellt abhängig vom Fragetyp Checkboxen oder positionsgebundene Radiogruppen. */
  createAnswerGrid(question) {
    const mapping = question.type === 'mapping';                                             // Unterscheidet Positions-Ziel-Zuordnungen von Multiple Choice.
    const grid = this.dom.node('div', undefined, mapping ? 'mapping-grid' : 'answer-grid');  // Passender Layoutcontainer für Radiogruppen oder Checkbox-Antworten.

    // Zuordnungen erhalten positionsgebundene Radiogruppen, normale Fragen einzelne Checkbox-Antworten.
    if (mapping) {

      // Erstellt pro zu beantwortender Position genau eine Zeile mit ihrer Radiogruppe.
      for (const key of question.mappingKeys) grid.append(this.createMappingRow(question, key));
    } else {
      // Erstellt zu jedem angebotenen Antwortbuchstaben eine eigenständige Checkbox-Option.
      for (const letter of question.options) {
        grid.append(this.createOption(question, letter, question.answers[letter]));
      }
    }

    return grid;
  }

  /** @param {SachkundeQuestion} question Frage. @param {string} key Position. @returns {HTMLElement} Zeile. */
  createMappingRow(question, key) {
    const row = this.dom.node('div', undefined, 'mapping-row');          // Eine zu beantwortende Position innerhalb der Zuordnungsfrage.
    const choices = this.dom.node('div', undefined, 'mapping-choices');  // Radiogruppe aller angebotenen Ziele dieser Position.

    // Übernimmt vorhandene Positionsbegriffe oder nennt ersatzweise die Position.
    const label = question.mappingLabels?.[key]
      ? `${key} · ${question.mappingLabels[key]}`
      : `Position ${key} →`;

    row.append(this.dom.node('strong', label));

    // Bietet dieser Position jedes zulässige Zuordnungsziel zur Auswahl an.
    for (const choice of question.mappingChoices) {
      choices.append(this.createOption(question, `${key}:${choice}`, choice, key));
    }

    row.append(choices);

    return row;
  }

  /**
   * @param {SachkundeQuestion} question Frage.
   * @param {string} token Gespeicherter Antwortwert.
   * @param {string} text Sichtbarer Antworttext.
   * @param {string} [mapKey] Position bei Zuordnungen.
   * @returns {HTMLLabelElement} Native, gestaltete Auswahl mit Text.
   */
  createOption(question, token, text, mapKey) {
    const className = mapKey ? 'answer-option mapping-option' : 'answer-option';  // Zusätzliche Darstellung für die kompakte Zuordnungsoption.
    const label = this.dom.node('label', undefined, className);                   // Klickbare Beschriftung, die das native Eingabeelement einschließt.
    const input = this.createInput(question, token, text, mapKey);                // Vorkonfigurierte Checkbox oder Radioauswahl mit Änderungsbehandlung.

    label.append(input);

    // Antwortbuchstaben gehören zur Mehrfachauswahl; Zuordnungen tragen bereits ihre eigene Zielbeschriftung.
    if (!mapKey) label.append(this.dom.node('strong', token, 'answer-letter'));
    label.append(this.dom.node('span', text));

    return label;
  }

  /**
   * @param {SachkundeQuestion} question Frage.
   * @param {string} token Antwortwert.
   * @param {string} text Antworttext.
   * @param {string} [mapKey] Zuordnungsposition.
   */
  createInput(question, token, text, mapKey) {
    const input = document.createElement('input');  // Natives Steuerelement für Browser-, Tastatur- und Assistenzbedienung.

    // Zuordnungen erlauben je Position nur ein Radioziel; normale Fragen unterstützen mehrere Checkboxen.
    input.type = mapKey ? 'radio' : 'checkbox';
    input.value = token;
    input.checked = this.state.answers.get(question.id)?.has(token) || false;

    // Eine Zuordnungsposition bekommt eine eigene Radiogruppe mit eindeutiger zugänglicher Beschriftung.
    if (mapKey) {
      input.name = `mapping-${question.id}-${mapKey}`;
      input.setAttribute('aria-label', this.mappingLabel(question, mapKey, text));
    }
    input.addEventListener('change', () => this.changeAnswer(question, input, mapKey));  // Übernimmt Änderungen dieser nativen Antwortauswahl in den aktuellen Lernzustand.

    return input;
  }

  /** Beschriftet eine Zuordnung mit Position, Ziel und gegebenenfalls erläuternden Begriffen. */
  mappingLabel(question, key, text) {
    const position = question.mappingLabels?.[key] ? `: ${question.mappingLabels[key]}` : '';    // Optionaler Begriffsname der zuzuordnenden Position.
    const target = question.mappingTargets?.[text] ? `: ${question.mappingTargets[text]}` : '';  // Optionale Erläuterung zum angebotenen Zuordnungsziel.

    return `${key}${position} zu ${text}${target}`;
  }

  /** @param {SachkundeQuestion} question Frage. @param {HTMLElement} card Karte. @returns {HTMLElement} Prüfaktion. */
  createActions(question, card) {
    const actions = this.dom.node('div', undefined, 'question-actions');  // Aktionszeile für die Einzelprüfung dieser Frage.

    // Prüfbutton, der an die aktuell dargestellte Frage und Karte gebunden ist.
    const check = this.dom.button('Antwort prüfen', 'secondary question-check', () =>
      this.check(question, card)
    );

    // Im laufenden Test bleibt die Einzelprüfung verborgen; im Lernmodus folgt sie der Feedback-Einstellung.
    check.hidden = this.session.isExam ? !this.state.finished : !this.state.instant;
    actions.append(check);

    return actions;
  }

  /** @param {SachkundeQuestion} question Frage. @param {HTMLElement} bookmark Merkschalter. */
  updateBookmark(question, bookmark) {
    const marked = this.state.bookmarks.has(question.id);  // Aktueller Merkzustand für Textsymbol und aria-pressed.

    // Ein gefüllter Stern steht für eine vorhandene Markierung, ein leerer für eine unmarkierte Frage.
    bookmark.textContent = marked ? '★' : '☆';
    bookmark.setAttribute('aria-pressed', String(marked));
  }

  /** @param {SachkundeQuestion} question Frage. @param {HTMLElement} bookmark Merkschalter. */
  toggleBookmark(question, bookmark) {
    // Eine vorhandene Markierung wird entfernt, eine noch fehlende wird neu gesetzt.
    if (this.state.bookmarks.has(question.id)) this.state.bookmarks.delete(question.id);
    else this.state.bookmarks.add(question.id);
    this.updateBookmark(question, bookmark);            // Gleicht Sternsymbol und aria-pressed mit dem aktuellen Merkzustand ab.
    this.session.persist();                             // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.
    this.onChange(this.state.status === 'bookmarked');  // Meldet die Änderung an die Lernansicht zur Synchronisierung von Raster und gegebenenfalls Filtern.
  }

  /** Übernimmt die Auswahl, verwirft ihre alte Bewertung und aktualisiert die sichtbare Karte. */
  changeAnswer(question, input, mapKey) {
    const selected = new Set(this.state.answers.get(question.id) || []);  // Arbeitskopie der bisherigen Antwort; der alte Zustand wird nicht direkt verändert.

    // Bei Radioantworten wird nur die bisherige Auswahl derselben Zuordnungsposition ersetzt.
    if (mapKey) this.clearMappingSelection(selected, mapKey);

    // Aktivierte Optionen kommen zur Auswahl hinzu, deaktivierte werden daraus entfernt.
    if (input.checked) selected.add(input.value);
    else selected.delete(input.value);

    // Eine leere Auswahl wird als offene Frage geführt und nicht als leere Antwort gespeichert.
    if (selected.size) this.state.answers.set(question.id, selected);
    else this.state.answers.delete(question.id);

    this.state.checked.delete(question.id);
    this.dom.get('result').hidden = true;
    this.session.persist();                                  // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.
    this.update(question, input.closest('.question-card'));  // Bringt Status, Prüfbutton und Rückmeldung der bestehenden Karte auf denselben Stand.
    this.onChange(false);                                    // Aktualisiert die Übersicht; eine bloße Antwortänderung führt noch keinen Filterwechsel aus.
  }

  /** Entfernt bei Radiogruppen nur die bisherige Antwort derselben Zuordnungsposition. */
  clearMappingSelection(selected, mapKey) {
    // Prüft die bisherigen Tokens, um nur die ersetzte Zuordnungsposition freizugeben.
    for (const value of selected) {

      // Die Antworten anderer Zuordnungspositionen bleiben unverändert.
      if (value.startsWith(`${mapKey}:`)) selected.delete(value);
    }
  }

  /** @param {SachkundeQuestion} question Frage. @param {HTMLElement} card Karte. */
  check(question, card) {
    this.state.checked.set(question.id, this.session.signature(question));
    this.session.persist();       // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.
    this.update(question, card);  // Bringt Status, Prüfbutton und Rückmeldung der bestehenden Karte auf denselben Stand.

    // Eine jetzt richtige Frage kann aus der aktiven Fehlerwiederholung entfernt werden.
    this.onChange(
      this.state.status === 'wrong' &&
        window.LHUNDG_CORE.exact(this.state.answers.get(question.id) || new Set(), question.correct)
    );
  }

  /** Synchronisiert Status, Prüfaktion und Lösungsfeedback einer bestehenden Fragenkarte. */
  update(question, card) {
    const selected = this.state.answers.get(question.id) || new Set();   // Aktuelle Auswahl oder eine leere Menge für unbeantwortete Fragen.
    const checked = this.state.checked.has(question.id);                 // Die Antwort wurde ausdrücklich geprüft; erst dann ist Lösungsfeedback zulässig.
    const right = window.LHUNDG_CORE.exact(selected, question.correct);  // Exakte Gleichheit mit dem vollständigen Lösungsschlüssel.
    const check = card.querySelector('.question-check');                 // Vorhandener Prüfbutton, dessen Verfügbarkeit zur Vollständigkeit passen muss.
    const feedback = card.querySelector('.feedback');                    // Bestehender Rückmeldebereich für die geprüfte Auswahl.

    card.classList.toggle('correct', checked && right);
    card.classList.toggle('wrong', checked && !right);
    card.querySelector('.status-pill').textContent = this.statusText(question, selected, checked, right);

    // Die Einzelprüfung verlangt mindestens eine Auswahl oder eine vollständige Zuordnung.
    check.disabled = !window.LHUNDG_CORE.complete(question, selected);
    // Eine bereits ausgewertete Auswahl kann über denselben Button erneut geprüft werden.
    check.textContent = checked ? 'Erneut prüfen' : 'Antwort prüfen';

    feedback.hidden = !checked;
    // Nur ausdrücklich geprüfte Antworten erhalten einen sichtbaren Lösungstext.
    if (checked) feedback.textContent = this.feedbackText(question, selected, right);
  }

  /** Formuliert den Kartenstatus; Bewertung hat Vorrang vor bloßer Vollständigkeit. */
  statusText(question, selected, checked, right) {
    // Eine vorhandene Bewertung hat Vorrang vor den Zuständen beantwortet, teilweise und offen.
    if (checked) return right ? '✓ Richtig' : '× Falsch';
    
    // Vollständige, aber ungeprüfte Antworten werden noch nicht als richtig oder falsch bezeichnet.
    if (window.LHUNDG_CORE.complete(question, selected)) return '● Beantwortet';

    // Eine unvollständige Auswahl heißt teilweise, eine leere Auswahl bleibt offen.
    return selected.size ? 'Teilweise' : '○ Offen';
  }

  /** Formatiert eine Lösung als Zuordnungspaar oder als Antwortbuchstabe mit Antworttext. */
  formatSolution(question, token) {
    // Zuordnungen erhalten Pfeile; normale Antworten enthalten Buchstabe und Antworttext.
    return question.type === 'mapping'
      ? token.replace(':', ' → ')
      : `${token}: ${question.answers[token]}`;
  }

  /** Formuliert das aufgelöste Ergebnis mit klarer Trennung von Original- und Beispiellösung. */
  feedbackText(question, selected, right) {
    // Lesbare Auswahl mit Zuordnungspfeilen; ohne Tokens steht ausdrücklich keine.
    const selection = selected.size
      ? [...selected].map(value => value.replace(':', ' → ')).join(', ')
      : 'keine';
    const prefix = right ? 'Richtig! ' : `Deine Auswahl: ${selection}. `;                             // Richtige Antworten werden bestätigt, bei Fehlern wird die eigene Auswahl genannt.
    const source = question.example ? 'Lösung der eigenen Beispielfrage' : 'Lösung laut Quelle';      // Kennzeichnet eigene Beispiellösungen statt einer angeblich amtlichen Quelle.
    const solution = question.correct.map(token => this.formatSolution(question, token)).join('\n');  // Vollständiger Lösungsschlüssel mit je einer Antwort pro Zeile.
    const explanation = question.explanation ? `\n\nEinordnung: ${question.explanation}` : '';        // Optionale fachliche Einordnung, sichtbar erst zusammen mit dem Lösungsfeedback.

    return `${prefix}${source}:\n${solution}${explanation}`;
  }
};
