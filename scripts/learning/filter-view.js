/* scripts/learning/filter-view.js */

/**
 * @file Auffindbare Merkliste und verständliche Suchtreffer.
 * @description Verbindet bestehende Filterzustände mit Trefferhinweisen, Listenansicht und gefilterter Navigation.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.FilterView = class FilterView {
  /**
   * Verwendet ausschließlich die vorhandene Sitzung und Lernansicht als Zustandsquelle.
   *
   * @param {TrainerSession} session Aktiver Katalog oder Test.
   * @param {TrainerLearningView} view Bestehende Fragenansicht und Navigation.
   * @returns {FilterView} Filtersteuerung ohne eigene Kopie des Lernstands.
   */
  constructor(session, view) {
    this.session = session;                // Aktiver Lernbereich einschließlich seiner bisherigen Merkliste.
    this.view = view;                      // Erzeugt weiterhin die eigentlichen Fragenkarten und Ansichten.
    this.state = session.state;            // Gemeinsame Filter-, Antwort- und Positionszustände.
    this.dom = window.LHUNDG_TRAINER.dom;  // Sichere vorhandene DOM-Helfer.
    this.core = window.LHUNDG_CORE;        // Bestehende Vollständigkeits- und Bewertungsregeln.
    this.searchTimer = null;               // Übernimmt nur die letzte Eingabe nach der bisherigen kurzen Pause.
  }

  /**
   * Verbindet Suche, Filter und die neuen direkten Zugänge zu Merkliste und Trefferliste.
   *
   * @returns {void} Kein Rückgabewert.
   */
  bind() {
    this.dom.get('search').addEventListener('input', () => this.scheduleSearch());
    this.dom.get('statusFilter').addEventListener('change', event => this.setFilter('status', event.target.value));
    this.dom.get('categoryFilter').addEventListener('change', event => this.setFilter('category', event.target.value));
    this.dom.get('clearFilters').addEventListener('click', () => this.view.goTo(this.session.questions[0].id));
    this.dom.get('showBookmarks').addEventListener('click', () => this.showBookmarks());
    this.dom.get('showMatchList').addEventListener('click', () => this.view.changeView('list'));
  }

  /**
   * Übernimmt einen vorhandenen Status- oder Themenfilter und beginnt bei seinem ersten Treffer.
   *
   * @param {string} field Einer der intern vorgegebenen Zustandsnamen status oder category.
   * @param {string} value Neuer Wert aus dem vorhandenen Select-Modell.
   * @returns {void} Kein Rückgabewert.
   */
  setFilter(field, value) {
    this.state[field] = value;
    this.apply();  // Die Trefferfolge wird immer aus dem aktuellen Gesamtzustand gebildet.
  }

  /**
   * Übernimmt die letzte Sucheingabe ohne bei jedem einzelnen Tastendruck Karten neu aufzubauen.
   *
   * @returns {void} Kein Rückgabewert.
   */
  scheduleSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.state.search = this.dom.get('search').value.trim().toLocaleLowerCase('de');
      this.apply();  // Die bestehende Einzelfragenansicht erhält ausdrücklich benannte Treffer-Navigation.
    }, 140);
  }

  /**
   * Öffnet ausschließlich die gemerkten Fragen des aktiven Lernbereichs als Liste.
   *
   * @returns {void} Kein Rückgabewert.
   */
  showBookmarks() {
    this.clear();  // Ein vorheriger Suchbegriff oder Themenfilter darf die Merkliste nicht unbemerkt verbergen.
    this.state.status = 'bookmarked';
    this.state.view = 'list';
    this.dom.get('statusFilter').value = 'bookmarked';
    this.dom.get('viewSelect').value = 'list';
    this.view.syncViewUrl();      // Verlässt gegebenenfalls die TV-Ansicht auch in der URL.
    this.apply({ focus: true });  // Zeigt die Merkliste ab ihrer ersten Seite mit acht Karten.
    this.session.persist();       // Erhält die gewählte Ansicht und die aktuelle Lernposition.
  }

  /**
   * Prüft Suchtext, Thema und Lernstatus mit denselben Katalog- und Antwortdaten wie bisher.
   *
   * @param {SachkundeQuestion} question Zu prüfende Frage.
   * @returns {boolean} Ob alle aktiven Filter auf diese Frage zutreffen.
   */
  matches(question) {
    const text = `${question.sourceId} ${question.prompt} ${Object.values(question.answers).join(' ')}`;  // Gesucht wird auch in Antworttexten.
    const search = !this.state.search || text.toLocaleLowerCase('de').includes(this.state.search);        // Unveränderte deutsche Kleinschreibung.
    const category = this.state.category === 'all' || question.category === this.state.category;          // Thema grenzt die gleiche Trefferfolge ein.

    return search && category && this.matchesStatus(question);
  }

  /**
   * Unterscheidet unverändert offene, beantwortete, gemerkte und ausdrücklich falsch geprüfte Fragen.
   *
   * @param {SachkundeQuestion} question Frage mit ihrem bestehenden Antwortzustand.
   * @returns {boolean} Ob die Frage zum ausgewählten Lernstatus gehört.
   */
  matchesStatus(question) {
    const selected = this.state.answers.get(question.id);  // Noch nicht beantwortete Fragen besitzen keine Auswahlmenge.
    const status = this.state.status;                      // Aktueller nativer Lernstatusfilter.

    // Der allgemeine Status schränkt die Fragen nicht ein.
    if (status === 'all') return true;
    // Offen und beantwortet beziehen sich auf Vollständigkeit, nicht auf Richtigkeit.
    if (status === 'open') return !this.core.complete(question, selected);
    // Eine vollständige Auswahl muss noch nicht ausdrücklich ausgewertet sein.
    if (status === 'answered') return this.core.complete(question, selected);
    // Ausschließlich gesetzte Sternmarkierungen gehören zur Merkliste.
    if (status === 'bookmarked') return this.state.bookmarks.has(question.id);

    return (
      status === 'wrong' &&
      this.state.checked.has(question.id) &&
      !this.core.exact(selected || new Set(), question.correct)
    );
  }

  /**
   * Bildet die Trefferfolge und synchronisiert ihre erste beziehungsweise noch erreichbare Seite.
   *
   * @param {object} [options] Positions- und Fokusverhalten.
   * @param {boolean} [options.reset] Bei einer neuen Auswahl mit der ersten Trefferseite beginnen.
   * @param {boolean} [options.focus] Die erste sichtbare Frage gezielt fokussieren.
   * @returns {void} Kein Rückgabewert.
   */
  apply({ reset = true, focus = false } = {}) {
    this.state.items = this.session.questions.filter(question => this.matches(question));

    this.clampPosition(reset);  // Entfernte Merker dürfen keine nicht mehr vorhandene Listenseite zurücklassen.
    this.updateSummary();       // Erklärt Treffermenge, Suchumfang und verfügbare Listenansicht.
    this.updateNavigation();    // Auch direkte Fragenverweise zeigen nur die gefilterte Menge.
    this.view.render(focus);    // Antwort- und Bewertungslogik bleibt bei der bisherigen Lernansicht.
  }

  /**
   * Begrenzt die aktuelle Position auf eine noch vorhandene Einzel- oder Achterseite.
   *
   * @param {boolean} reset Bei einem neuen Filter mit der ersten Trefferseite beginnen.
   * @returns {void} Kein Rückgabewert.
   */
  clampPosition(reset) {
    // Geänderte Filter beginnen bei ihrem ersten Treffer; Merkeränderungen erhalten die erreichbare Seite.
    if (reset) this.state.index = 0;

    const size = this.view.pageSize();                                                  // Eine Einzelkarte oder die bestehende Achter-Liste.
    const last = Math.max(0, Math.floor((this.state.items.length - 1) / size) * size);  // Letzte noch vorhandene Trefferseite.

    this.state.index = Math.max(0, Math.min(this.state.index, last));
  }

  /**
   * Setzt ausschließlich die bestehenden Filter und eine noch ausstehende Sucheingabe zurück.
   *
   * @returns {void} Kein Rückgabewert.
   */
  clear() {
    clearTimeout(this.searchTimer);
    this.state.search = '';
    this.state.status = 'all';
    this.state.category = 'all';
    this.dom.get('search').value = '';
    this.dom.get('statusFilter').value = 'all';
    this.dom.get('categoryFilter').value = 'all';
  }

  /**
   * Macht die Merkliste einschließlich leerem Zustand direkt sichtbar und erreichbar.
   *
   * @returns {void} Kein Rückgabewert.
   */
  updateBookmarks() {
    const button = this.dom.get('showBookmarks');  // Direkter Zugang bleibt auch bei noch leerer Merkliste bedienbar.
    const count = this.state.bookmarks.size;       // Merker gehören ausschließlich zum aktuellen Lernbereich.

    button.textContent = `★ Merkliste (${count})`;
    button.setAttribute('aria-pressed', String(this.state.status === 'bookmarked'));
    button.setAttribute('aria-label', `Merkliste dieses Lernbereichs anzeigen: ${count} gemerkte Fragen`);
  }

  /**
   * Erklärt eine aktive Suche beziehungsweise Merkliste unmittelbar neben den Filtern.
   *
   * @returns {void} Kein Rückgabewert.
   */
  updateSummary() {
    const active = Boolean(this.state.search || this.state.status !== 'all' || this.state.category !== 'all');  // Mindestens eine Einschränkung ist gesetzt.

    this.dom.get('clearFilters').hidden = !active;
    this.dom.get('filterResults').hidden = !active;
    this.dom.get('matchCount').hidden = !active;
    this.dom.get('matchCount').textContent = this.summaryText();
    this.dom.get('showMatchList').hidden = !this.state.items.length || this.state.view === 'list';
    this.updateCollectionHeading();  // Benennt die Merkliste als eigenen sichtbaren Bereich mit eindeutigem Rückweg.
    this.updateBookmarks();  // Zustandsanzeige folgt auch einer Auswahl über den bestehenden Statusfilter.
  }

  /**
   * Kennzeichnet die geöffnete Merkliste und bietet den direkten Rückweg zum vollständigen Katalog.
   *
   * @returns {void} Kein Rückgabewert.
   */
  updateCollectionHeading() {
    const bookmarked = this.state.status === 'bookmarked';  // Gilt auch bei zusätzlicher Suche oder Themeneinschränkung.
    const title = this.session.config.title;  // Unveränderte Bezeichnung des aktiven Katalogs oder Testprofils.

    this.dom.get('modeTitle').textContent = bookmarked ? `Merkliste · ${title}` : title;
    this.dom.get('clearFilters').textContent = bookmarked ? 'Alle Fragen anzeigen' : 'Filter löschen';
  }

  /**
   * Formuliert die Treffermenge einschließlich Suchbegriff und verständlichem Suchumfang.
   *
   * @returns {string} Sicher als Text einzusetzende Ergebnisbeschreibung.
   */
  summaryText() {
    const count = this.state.items.length;              // Treffer nach Anwendung aller drei vorhandenen Filter.
    const query = this.dom.get('search').value.trim();  // Sichtbare Originalschreibweise statt normalisierter Vergleichsform.

    // Der Suchumfang nennt ausdrücklich Antworten, damit ein Treffer ohne Begriff in der Überschrift verständlich bleibt.
    if (this.state.search)
      return `${count} Treffer für „${query}“ in Fragen und Antworten. Weitere Filter werden berücksichtigt.`;
    // Merker sind nicht mit dem Gesamtbestand anderer Kataloge vermischt.
    if (this.state.status === 'bookmarked')
      return `${count} von ${this.state.bookmarks.size} gemerkten Fragen passen zu deinen Filtern.`;

    return `${count} von ${this.session.questions.length} Fragen passen zu deinen Filtern.`;
  }

  /**
   * Begrenzt direkte Fragenverweise auf dieselben Treffer wie die eigentlichen Fragenkarten.
   *
   * @returns {void} Kein Rückgabewert.
   */
  updateNavigation() {
    const ids = new Set(this.state.items.map(question => question.id));  // Einmalige Menge aller erreichbaren Treffer-IDs.

    // Ausgeblendete Rasterbuttons dürfen auch per Tastatur nicht angesteuert werden.
    for (const [id, button] of this.view.navButtons) button.hidden = !ids.has(id);
  }

  /**
   * Benennt Blätteraktionen und die Position ausdrücklich innerhalb der aktiven Trefferfolge.
   *
   * @returns {void} Kein Rückgabewert.
   */
  updatePagination() {
    const search = Boolean(this.state.search);                                                     // Suchtreffer benötigen andere Aktionsbeschriftungen als der vollständige Katalog.
    const prefix = search ? 'Treffer ' : this.state.status === 'bookmarked' ? 'Merkliste: ' : '';  // Verhindert Verwechslung mit Original-Fragenummern.
    const end = Math.min(this.state.index + this.view.pageSize(), this.state.items.length);        // Letzte dargestellte Trefferposition.
    const range = this.view.pageSize() > 1 ? `–${end}` : '';                                       // Listen zeigen ihre vollständige Seitenspanne.

    this.dom.get('previous').disabled = this.state.index <= 0;
    this.dom.get('next').disabled = this.state.index + this.view.pageSize() >= this.state.items.length;
    this.dom.get('previous').textContent = search ? '← Vorherige Treffer' : '← Zurück';
    this.dom.get('next').textContent = search ? 'Nächste Treffer →' : 'Weiter →';
    this.dom.get('position').textContent = this.state.items.length
      ? `${prefix}${this.state.index + 1}${range} von ${this.state.items.length}`
      : 'Keine Treffer';
  }

  /**
   * Erklärt fehlende Suchtreffer oder eine noch leere Merkliste mit der passenden nächsten Aktion.
   *
   * @returns {string} Lesbarer Leerzustand ohne Bezug auf nicht passende Bewertungsaktionen.
   */
  emptyMessage() {
    // Suchbegriffe können sowohl durch Text als auch durch weitere Filter keine Treffer haben.
    if (this.state.search) return 'Keine passenden Suchtreffer. Ändere den Suchbegriff oder lösche weitere Filter.';
    // Merklisten unterscheiden fehlende Markierungen von nur ausgefilterten Fragen.
    if (this.state.status === 'bookmarked') return this.emptyBookmarks();

    return 'Zu diesen Filtern gibt es keine Fragen. Ändere die Filter oder prüfe zuerst Antworten für die Fehlerwiederholung.';
  }

  /**
   * Unterscheidet eine tatsächlich leere Merkliste von nur ausgefilterten Merkern.
   *
   * @returns {string} Passender Hinweis ohne irreführende Aussage über gespeicherte Merker.
   */
  emptyBookmarks() {
    // Vorhandene Merker können durch einen zusätzlichen Themenfilter vollständig unsichtbar werden.
    if (this.state.bookmarks.size) return 'Keine gemerkten Fragen passen zu deinen Filtern. Ändere den Themenfilter.';

    return 'Deine Merkliste ist noch leer. Markiere Fragen mit dem Stern an der Fragenkarte.';
  }
};
