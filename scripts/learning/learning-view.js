/* scripts/learning/learning-view.js */

/**
 * @file Lernansicht, Filter und Navigation.
 * @description Hält sichtbare Fragenseite, Fortschritt, Fokus und Scrollposition synchron.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.LearningView = class LearningView {
  /** @param {TrainerSession} session Aktiver Lernzustand. */
  constructor(session) {
    this.session = session;                                                                            // Gemeinsame Sitzung als einzige Quelle für Lern- und Prüfungszustand.
    this.state = session.state;                                                                        // Gemeinsam genutzter Zustand; keine zweite Kopie des Lernstands.
    this.dom = window.LHUNDG_TRAINER.dom;                                                              // Vorhandene sichere Helfer zum Erzeugen und Auffinden von DOM-Elementen.
    this.core = window.LHUNDG_CORE;                                                                    // DOM-unabhängige Regeln für Vollständigkeit, Validierung und Wertung.
    this.filters = new window.LHUNDG_TRAINER.FilterView(session, this);                                // Gemeinsame Such- und Merkliste ohne zweiten Lernzustand.
    this.navButtons = new Map();                                                                       // Bereits erzeugte Fragenbuttons nach stabiler Frage-ID.
    this.cards = new window.LHUNDG_TRAINER.QuestionView(session, refilter => this.refresh(refilter));  // Erzeugt Karten und meldet Änderungen zur Synchronisierung an die Lernansicht.
  }

  /** Baut einmalig die zum Katalog gehörenden Filter und Fragenverweise auf. */
  initialize() {
    this.observeHeader();                 // Hält den benötigten Platz des Headers im responsiven Lernlayout aktuell.
    this.populateCategories();            // Baut die Themenauswahl aus dem tatsächlich geladenen Katalog auf.
    this.createNavigation();              // Erzeugt direkte Fragenverweise, ohne alle Fragenkarten in das DOM zu laden.
    this.applyFilters({ reset: false });  // Stellt die gespeicherte Lernposition dar, ohne wieder am Anfang zu beginnen.
  }

  /** Hält die Headerhöhe ohne synchrone Startmessung im CSS verfügbar. */
  observeHeader() {
    const header = document.querySelector('.site-header');  // Kopfbereich, dessen Höhe den sichtbaren Lernraum beeinflusst.

    // Beobachter für die Headerhöhe; seine Callback-Werte steuern die CSS-Layoutvariable.
    this.headerObserver = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0] ?? entry.borderBoxSize;                    // Unterstützt die Array- und Objektvariante der ResizeObserver-Angabe.
      const height = `${box?.blockSize ?? header.getBoundingClientRect().height}px`;  // Gemeldete Höhe mit Layout-Messung als Fallback für ältere Browser.
      const style = document.documentElement.style;                                   // Inline-Variablen am Wurzelelement für die gemeinsame Layoutberechnung.

      // Nur eine tatsächlich geänderte Höhe wird geschrieben, um unnötige Layoutaktualisierungen zu vermeiden.
      if (style.getPropertyValue('--header-height') !== height) {
        style.setProperty('--header-height', height);
      }
    });
    this.headerObserver.observe(header);
  }

  /** Ergänzt vorhandene Themenauswahl um die Kategorien des aktiven Katalogs. */
  populateCategories() {
    const categories = [...new Set(this.session.questions.map(question => question.category))];  // Einmalige Themen des aktiven Katalogs, anschließend deutsch sortiert.

    categories.sort((first, second) => first.localeCompare(second, 'de'));
    // Erzeugt genau eine Auswahloption pro bereits dedupliziertem Thema.
    for (const category of categories) {
      const option = this.dom.node('option', category);  // Neue Auswahloption für das aktuelle Thema.

      option.value = category;
      this.dom.get('categoryFilter').append(option);
    }
  }

  /** Erstellt die Fragenübersicht gesammelt; nur sichtbare Karten werden später gerendert. */
  createNavigation() {
    const fragment = document.createDocumentFragment();                                                     // Sammelt die Fragenbuttons vor dem gemeinsamen Einfügen ins DOM.
    const numbered = ['all', 'mg', 'mgexam', 'exam34', 'exam11', 'essenexam'].includes(this.session.mode);  // Gemeinsame Pools und Tests zeigen laufende statt quellbezogener Nummern.

    // Erzeugt für jede Frage ihren Direktverweis mit Position und nachvollziehbarer Herkunft.
    this.session.questions.forEach((question, index) => {
      const label = numbered ? String(index + 1) : question.sourceId;                                       // Sichtbare laufende Nummer oder Originalnummer des Einzelkatalogs.
      const button = this.dom.button(label, 'nav-q', () => this.goTo(question.id, { keepFilters: true }));  // Direktnavigation zur zugehörigen stabilen Frage-ID.

      button.title = `${question.source} · Originalfrage ${question.sourceId}`;
      this.navButtons.set(question.id, button);
      fragment.append(button);
    });
    this.dom.get('questionNav').append(fragment);
  }

  /** @returns {number} Anzahl gleichzeitig sichtbarer Fragen. */
  pageSize() {
    // Die Liste zeigt acht Fragen; Fokus- und TV-Ansicht zeigen jeweils genau eine.
    return this.state.view === 'list' ? 8 : 1;
  }

  /** @param {boolean} refilter Ob eine geänderte Frage aus dem aktiven Filter fallen kann. */
  refresh(refilter) {
    this.updateOverview();  // Synchronisiert Fortschritt, Merker und Bewertungszustände der Fragenverweise.
    // Eine Frage, die den aktiven Merk- oder Fehlerfilter verlässt, erfordert eine neue Trefferliste.
    if (refilter) this.applyFilters({ reset: false, focus: true });
  }

  /** Aktualisiert Fortschritt und erreichbare Zustände der Fragenübersicht. */
  updateOverview() {
    this.filters.updateBookmarks();  // Aktualisiert die direkt sichtbare Anzahl nach jedem Setzen oder Entfernen eines Sterns.
    this.updateProgress();           // Aktualisiert die Anzahl vollständig beantworteter Fragen unabhängig von ihrer Richtigkeit.
    // IDs der aktuell angezeigten Fragen für aria-current im Fragenraster.
    const visible = new Set(
      this.state.items
        .slice(this.state.index, this.state.index + this.pageSize())
        .map(question => question.id)
    );

    // Synchronisiert alle Fragenverweise, auch wenn ihre Karte gerade nicht gerendert ist.
    for (const question of this.session.questions) this.updateNavigationButton(question, visible);
  }

  /** Aktualisiert sichtbare und zugängliche Fortschrittsangaben. */
  updateProgress() {
    const progress = this.dom.get('progressBar');  // Natives Fortschrittselement mit zugänglicher Beschriftung.
    const total = this.session.questions.length;   // Gesamtumfang des aktiven Katalogs oder Tests, unabhängig von Filtern.
    // Vollständig beantwortete Fragen; Richtigkeit wird hier nicht vorausgesetzt.
    const answered = this.session.questions.filter(question =>
      this.core.complete(question, this.state.answers.get(question.id))
    ).length;
    const percent = Math.round(answered / total * 100);  // Gerundeter Anteil beantworteter Fragen für die sichtbare Prozentangabe.

    this.dom.get('progressText').textContent = `${answered} / ${total} beantwortet`;
    this.dom.get('progressPercent').textContent = `${percent} %`;

    progress.value = answered;
    progress.max = total;
    progress.textContent = `${percent} %`;
    progress.setAttribute('aria-label', `${answered} von ${total} Fragen beantwortet`);
  }

  /** Synchronisiert Farben, Markierung und zugängliche Beschriftung eines Fragenverweises. */
  updateNavigationButton(question, visible) {
    const button = this.navButtons.get(question.id);                                                    // Bereits vorhandener Rasterbutton dieser Frage.
    const checked = this.state.checked.has(question.id);                                                // Kennzeichnet eine ausdrücklich ausgewertete Antwort.
    const right = this.core.exact(this.state.answers.get(question.id) || new Set(), question.correct);  // Exakte Richtigkeit; wird erst zusammen mit checked sichtbar.
    const answered = this.core.complete(question, this.state.answers.get(question.id));                 // Vollständigkeit unabhängig davon, ob die Antwort bereits geprüft wurde.
    const bookmarked = this.state.bookmarks.has(question.id);                                           // Aktuelle Merkliste des geöffneten Lernbereichs.
    const status = checked ? (right ? 'richtig' : 'falsch') : (answered ? 'beantwortet' : 'offen');     // Geprüfte Antworten zeigen richtig/falsch, sonst nur beantwortet/offen.
    // Screenreader-Beschriftung mit Status, Merker und Originalherkunft.
    const label = `Frage ${button.textContent}, ${status}${bookmarked ? ', gemerkt' : ''}, ${question.source} ${question.sourceId}`;

    button.classList.toggle('answered', answered);
    button.classList.toggle('correct', checked && right);
    button.classList.toggle('wrong', checked && !right);
    button.classList.toggle('bookmarked', bookmarked);

    // Nur aktuell dargestellte Fragen tragen aria-current; alle anderen verlieren die Markierung.
    if (visible.has(question.id)) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');

    button.setAttribute('aria-label', label);
  }




  /**
   * Synchronisiert die gefilterte Fragenfolge über die gemeinsame Filtersteuerung.
   *
   * @param {object} [options] Bestehende Optionen reset und focus.
   * @returns {void} Kein Rückgabewert.
   */
  applyFilters(options = {}) {
    this.filters.apply(options);  // Behält die von Controller, Ergebnissen und Sicherungen verwendete Schnittstelle.
  }

  /**
   * Setzt bestehende Such-, Status- und Themenfilter einschließlich offener Sucheingaben zurück.
   *
   * @returns {void} Kein Rückgabewert.
   */
  clearFilters() {
    this.filters.clear();  // Native Controls und Modell bleiben in derselben bisherigen Zustandsquelle.
  }

  /**
   * Öffnet eine bekannte Frage und erhält auf Wunsch die aktuelle Trefferfolge.
   *
   * @param {number} id Stabile Frage-ID des gewählten Ziels.
   * @param {object} [options] Kontext des Direktsprungs.
   * @param {boolean} [options.keepFilters] Bestehende Suche und Merkliste erhalten.
   * @returns {void} Kein Rückgabewert.
   */
  goTo(id, { keepFilters = false } = {}) {
    // Trefferverweise erhalten Suchbegriff und Merkliste; sonstige Direktsprünge öffnen den ganzen Katalog.
    if (!keepFilters) this.clearFilters();                                      // Setzt Filtermodell und sichtbare Controls auf alle Fragen zurück.
    const questions = keepFilters ? this.state.items : this.session.questions;  // Maßgebliche Reihenfolge dieses Direktsprungs.

    this.state.index = questions.findIndex(question => question.id === id);
    // In der Listenansicht wird auf den Anfang der betreffenden Achterseite ausgerichtet.
    if (this.state.view === 'list') this.state.index = Math.floor(this.state.index / 8) * 8;

    this.dom.get('result').hidden = true;
    this.applyFilters({ reset: false });  // Rendert die gezielt gewählte Frage, ohne ihren eben gesetzten Index zurückzusetzen.
    this.session.persist();               // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.

    this.revealQuestion(id);  // Fokussiert nach dem Rendern genau das gewählte Ziel innerhalb seiner Seite.
  }

  /**
   * Fokussiert eine bereits gerenderte Zielkarte, auch innerhalb einer Trefferliste.
   *
   * @param {number} id Stabile ID der gerade geöffneten Frage.
   * @returns {void} Kein Rückgabewert.
   */
  revealQuestion(id) {
    // Die Zielkarte existiert erst nach dem Rendern der neuen Fragenseite.
    const card = this.dom.get(`q-${id}`);  // Nach dem Rendern neu erzeugte Karte als Ziel für Sichtbarkeit und Fokus.

    this.reveal(card);  // Bringt das Ziel nur bei Bedarf unterhalb des Headers in den sichtbaren Lesebereich.
    card?.querySelector('.question-prompt')?.focus({ preventScroll: true });
  }

  /** @param {boolean} [focus=false] Fokussiert die erste sichtbare Frage ohne Scrollsprung. */
  render(focus = false) {
    window.refreshCustomControls?.();  // Synchronisiert die sichtbaren Custom Controls mit ihren nativen Auswahlwerten.
    this.filters.updateSummary();      // Hält Listenaktion und Filterhinweis auch beim reinen Ansichtswechsel synchron.
    document.body.classList.toggle('tv-mode', this.state.view === 'tv');

    this.dom.get('questions').replaceChildren(this.createQuestionPage());
    this.updatePagination();  // Gleicht Blätterbuttons und Positionsangabe mit der aktuellen Treffermenge ab.
    this.updateOverview();    // Synchronisiert Fortschritt, Merker und Bewertungszustände der Fragenverweise.

    // Ein ausdrücklich angeforderter Fokuswechsel macht die erste sichtbare Frage zum Tastaturziel.
    if (focus) this.focusQuestion();
  }

  /** Baut ausschließlich die sichtbaren Fragen oder den Leerzustand auf. */
  createQuestionPage() {
    const fragment = document.createDocumentFragment();                                            // Noch nicht eingefügter Inhalt der nächsten Fragenseite.
    const visible = this.state.items.slice(this.state.index, this.state.index + this.pageSize());  // Begrenzt die DOM-Erzeugung auf eine Frage oder acht Listeneinträge.

    // Erzeugt nur die sichtbaren Karten und hält den restlichen Katalog außerhalb des DOM.
    for (const question of visible) fragment.append(this.cards.render(question));

    // Ohne Treffer wird ein verständlicher Leerzustand anstelle einer leeren Fragenfläche gezeigt.
    if (!visible.length) {
      fragment.append(this.dom.node('p',
        this.filters.emptyMessage(),
        'empty-state'
      ));
    }

    return fragment;
  }
  /**
   * Aktualisiert die Blätteraktionen innerhalb des aktuellen Katalogs oder Suchergebnisses.
   *
   * @returns {void} Kein Rückgabewert.
   */
  updatePagination() {
    this.filters.updatePagination();  // Treffer erhalten ausdrücklich benannte Vor-/Zurückaktionen.
  }

  /** Fokussiert die sichtbare Überschrift und bringt nur bei Bedarf die Karte in den Lesebereich. */
  focusQuestion() {
    const container = this.dom.get('questions');  // Bereich der gerade gerenderten Karten und ihrer Fokusüberschriften.

    container.querySelector('.question-prompt')?.focus({ preventScroll: true });
    this.reveal(container.firstElementChild);  // Bringt das Ziel nur bei Bedarf unterhalb des Headers in den sichtbaren Lesebereich.
  }

  /** @param {HTMLElement} card Karte oder Ergebnis im Desktop- oder mobilen Seitenfluss. */
  reveal(card) {
    // Ohne vorhandene Zielkarte gibt es keine Position zu messen oder sichtbar zu machen.
    if (!card) return;

    const stage = this.dom.get('questionStage');  // Lernbereich, der auf Desktop unabhängig von der Seite scrollen kann.

    // Bei internem Desktop-Scrollen wird die Karte im Lernbereich statt nur in der Seite ausgerichtet.
    if (getComputedStyle(stage).overflowY === 'auto') return this.revealInStage(card, stage);

    const top = card.getBoundingClientRect().top;                                                // Aktuelle Oberkante der Zielkarte im sichtbaren Fenster.
    const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;  // Unterkante des Headers, unter der die Frage lesbar bleiben muss.

    // Die Seite bewegt sich nur, wenn die Karte vom Header verdeckt ist oder außerhalb des Fensters liegt.
    if (top < headerBottom + 16 || top >= window.innerHeight) {
      window.scrollBy({ top: top - headerBottom - 16, behavior: 'instant' });
    }
  }

  /** @param {HTMLElement} card Sichtbares Ziel. @param {HTMLElement} stage Scrollbarer Lernbereich. */
  revealInStage(card, stage) {
    const trainerTop = scrollY + this.dom.get('trainer').getBoundingClientRect().top;            // Absolute Dokumentposition des Lernbereichs.
    const headerHeight = document.querySelector('.site-header').getBoundingClientRect().height;  // Platz für den sichtbaren Header beim Ausrichten des Lernbereichs.

    window.scrollTo({ top: trainerTop - headerHeight, behavior: 'instant' });
    stage.scrollTo({
      top: stage.scrollTop + card.getBoundingClientRect().top - stage.getBoundingClientRect().top,
      behavior: 'instant'
    });
  }

  /** @param {number} direction Blätterrichtung: -1 oder 1. */
  step(direction) {
    const last = Math.max(0, Math.floor((this.state.items.length - 1) / this.pageSize()) * this.pageSize());  // Startindex der letzten vollständigen oder angebrochenen Fragenseite.

    this.state.index = Math.max(0, Math.min(last, this.state.index + direction * this.pageSize()));
    this.render(true);       // Zeigt die neue Fragenseite und führt den Tastaturfokus auf ihre erste Frage.
    this.session.persist();  // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.
  }

  /** Springt zur nächsten offenen Frage, bei Bedarf vom Kataloganfang. */
  resume() {
    const questions = this.session.questions;                                                       // Ungefilterte Reihenfolge des aktiven Lernbereichs.
    const current = this.state.items[this.state.index];                                             // Aktuelle Frage als Ausgangspunkt der Suche.
    const isOpen = question => !this.core.complete(question, this.state.answers.get(question.id));  // Prüft Antwortvollständigkeit, unabhängig von Richtigkeit und Bewertung.
    // Sucht ab der aktuellen Position, dann vom Anfang; ohne offene Frage bleibt die aktuelle.
    const next =
      questions.find((question, index) => index >= questions.indexOf(current) && isOpen(question)) ||
      questions.find(isOpen) ||
      current;

    // Ein vorhandenes Ziel wird ohne störende Such- und Statusfilter geöffnet.
    if (next) this.goTo(next.id);
  }

  /** @param {string} value Neue Ansicht; hält die Listenposition auf einer Seitengrenze. */
  changeView(value) {
    this.state.view = value;
    this.dom.get('viewSelect').value = value;  // Auch direkte Listenaktionen halten das native Modell und den sichtbaren Combobox-Wert synchron.
    this.state.index = Math.floor(this.state.index / this.pageSize()) * this.pageSize();
    this.syncViewUrl();      // Hält einen direkten Wechsel aus der TV-Ansicht auch in der Adresse synchron.
    this.filters.updateSummary();  // Hält den Listen-Zugang auch bei einem direkten Ansichtswechsel synchron.
    this.render(true);       // Rendert die neue Ansicht mit passender Seitengrenze und bewusstem Fokuswechsel.
    this.session.persist();  // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.
  }

  /**
   * Synchronisiert ausschließlich den TV-Parameter mit der bereits gewählten Ansicht.
   *
   * @returns {void} Kein Rückgabewert.
   */
  syncViewUrl() {
    const url = new URL(location.href);  // Kopie der Adresse zum Synchronisieren des TV-Parameters.

    // Nur die TV-Ansicht benötigt den URL-Parameter; andere Ansichten entfernen ihn wieder.
    if (this.state.view === 'tv') url.searchParams.set('tv', '1');
    else url.searchParams.delete('tv');
    history.replaceState(null, '', url);  // Aktualisiert die Adresse ohne Seitenreload und ohne zusätzlichen Verlaufseintrag.
  }

  /** Aktualisiert Text und zugänglichen Zustand des Feedback-Schalters. */
  updateFeedbackToggle() {
    const toggle = this.dom.get('instantFeedback');  // Schalter für die ausdrückliche Einzelprüfung im Lernmodus.

    // Prüfungen zeigen ihre feste Sperre; Lernkataloge zeigen die veränderbare An/Aus-Einstellung.
    toggle.textContent = this.session.isExam
      ? 'Sofort-Feedback: im Test gesperrt'
      : `Sofort-Feedback: ${this.state.instant ? 'An' : 'Aus'}`;
    toggle.setAttribute('aria-pressed', String(!this.session.isExam && this.state.instant));
  }

  /** Schaltet die manuelle Antwortprüfung im Lernmodus frei oder aus. */
  toggleFeedback() {
    this.state.instant = !this.state.instant;
    this.session.write('localStorage', 'lhundg-instant-feedback-v2', this.state.instant ? '1' : '0');
    this.updateFeedbackToggle();  // Synchronisiert Text und aria-pressed mit der Einzelprüfungs-Einstellung.
    this.render();                // Baut die aktuelle Darstellung aus dem bereits bestehenden Lernzustand auf.
  }
};
