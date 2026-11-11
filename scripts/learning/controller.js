/* scripts/learning/controller.js */

/**
 * @file Initialisierung und Bedienaktionen des Trainers.
 * @description Verbindet vorhandene Controls mit Lernansicht, Auswertung und Sicherungen.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.Controller = class Controller {
  /** @param {TrainerSession} session Zustand. @param {TrainerLearningView} view Ansicht. */
  constructor(session, view) {
    this.session = session;                                             // Gemeinsame Sitzung als einzige Quelle für Lern- und Prüfungszustand.
    this.view = view;                                                   // Lernansicht für Rendering, Navigation und Fokusführung.
    this.dom = window.LHUNDG_TRAINER.dom;                               // Vorhandene sichere Helfer zum Erzeugen und Auffinden von DOM-Elementen.
    this.results = new window.LHUNDG_TRAINER.Results(session, view);    // Auswertung und Ergebnisdarstellung für diese Sitzung.
    this.progress = new window.LHUNDG_TRAINER.Progress(session, view);  // Import und Export der Kataloglernstände.
    this.keyboard = new window.LHUNDG_TRAINER.Keyboard(view);           // Tastatursteuerung mit denselben Navigationsaktionen wie die Oberfläche.
  }

  /** Verbindet die Oberfläche und stellt den zuletzt gespeicherten Lernbereich dar. */
  start() {
    this.configureControls();           // Stellt die Oberfläche auf den aktiven Lern- oder Prüfungsmodus ein.
    this.configureTestOptions();        // Passt die Testauswahl an die aktuelle Bildschirmbreite an.
    this.showExampleNotice();           // Kennzeichnet das Essen-Profil ausdrücklich als unverbindliches Beispiel.
    this.configureIndexing();           // Schließt Prüfungs- und TV-Varianten von der Suchmaschinenindexierung aus.
    this.bindNavigation();              // Verbindet Katalogwechsel, Ansichtswechsel und Blätteraktionen.
    this.bindFilters();                 // Aktiviert Textsuche, Themenauswahl und Lernstatusfilter.
    this.bindTools();                   // Verbindet Auswertung, Rücksetzen und Lernstandsicherungen mit der Oberfläche.
    this.keyboard.bind();               // Ergänzt TV-Tasten und die gesonderte Navigation in den Fragenrastern.
    this.view.initialize();             // Baut Filter, Fragenübersicht und die gespeicherte Lernposition auf.
    this.session.showStorageWarning();  // Meldet beim Wiederherstellen bereits erkannte Speicherprobleme.
    this.handleRequestedTool();         // Fokussiert ein per URL angefordertes Werkzeug, ohne es automatisch auszuführen.
  }

  /** Initialisiert die zum aktiven Lern- und Prüfungsmodus passenden Controls. */
  configureControls() {
    this.configureLearningControls();  // Synchronisiert Katalog, Ansicht und Feedback-Sperre.
    this.configureExamControls();      // Setzt die Testauswahl und die zum Modus passenden Abschlussaktionen.
    this.view.updateFeedbackToggle();  // Aktualisiert Beschriftung und zugänglichen Zustand der Einzelprüfung.
    this.updateTestProfile();          // Zeigt Beschreibung und Umfang des gerade ausgewählten Testprofils.
  }

  /** Stellt Katalog, Ansicht und Feedback-Sperre für den aktiven Modus ein. */
  configureLearningControls() {
    const { state, config, isExam } = this.session;  // Ansicht, Profiltexte und Testsperre des aktuellen Modus.

    this.dom.get('modeSelect').value = this.activeCatalogue();
    this.dom.get('modeTitle').textContent = config.title;
    this.dom.get('viewSelect').value = state.view;
    this.dom.get('instantFeedback').disabled = isExam;
  }

  /** Ordnet die vorhandenen Prüfungsmodi ihrer bisherigen Katalogauswahl zu. */
  activeCatalogue() {
    const { mode, isExam } = this.session;  // Aktueller Modus und Unterscheidung zwischen Katalog und Prüfung.

    // Im Lernmodus bleibt der ausdrücklich ausgewählte Katalog aktiv.
    if (!isExam) return mode;
    // Die §-11-Prüfung gehört zum Kammerkatalog.
    if (mode === 'exam11') return 'kammer197';
    // Der 34er-Test verwendet ausschließlich Rhein-Erft 203.
    if (mode === 'exam34') return 'legacy203';

    return 'mg';
  }

  /** Stellt Testauswahl, Abschlussaktionen und die einmalige Startmeldung ein. */
  configureExamControls() {
    const { mode, isExam } = this.session;                           // Aktiver Modus für Auswahl und Beschriftung der Testaktionen.
    const defaultTest = mode === 'kammer197' ? 'exam11' : 'exam34';  // Kammerkatalog startet die §-11-Übung, andere Kataloge den 34er-Test.

    this.dom.get('intermediate').hidden = isExam;
    // Ein laufender Test wird als Simulation abgeschlossen, ein Lernkatalog als Katalog ausgewertet.
    this.dom.get('evaluate').textContent = isExam ? 'Simulation auswerten' : 'Katalog auswerten';
    // Prüfungen bieten die nächste offene Frage, Kataloge die normale Lernfortsetzung an.
    this.dom.get('resume').textContent = isExam ? 'Nächste offene Frage →' : 'Weiterlernen →';
    // Ein aktiver Test behält sein Profil; Lernkataloge erhalten das dazu passende Startprofil.
    this.dom.get('testSelect').value = isExam ? mode : defaultTest;

    // Nur ein gestarteter Test benötigt den Hinweis auf die bis zum Abschluss gesperrten Lösungen.
    if (isExam) {
      // Erklärt den gestarteten Prüfungsmodus und die bis zur Gesamtauswertung gesperrten Lösungen.
      window.LHUNDG_UI.toast(
        'Test gestartet. Antworten werden erst bei der Auswertung aufgelöst. Dein Katalog-Lernstand bleibt erhalten.'
      );
    }
  }

  /** Hält Testoptionen auf kleinen Bildschirmen zunächst geschlossen. */
  configureTestOptions() {
    const mobile = matchMedia('(max-width: 800px)');          // Beobachtet den Wechsel zur kompakten Ansicht bis 800 Pixel.
    const options = document.querySelector('.test-options');  // Aufklappbarer Bereich für Testprofile und Teststart.

    options.open = !mobile.matches;
    // Reagiert auch nach dem Start auf einen Wechsel zwischen mobiler und breiter Ansicht.
    mobile.addEventListener('change', event => {
      options.open = !event.matches;
    });
  }

  /** Kennzeichnet die eigene Essen-Simulation vor dem Fragenteil. */
  showExampleNotice() {
    const notice = this.dom.get('exampleNotice');                        // Vorhandener Hinweisbereich über den Fragen.
    const link = this.dom.node('a', 'Aufteilung, Quellen und Wertung');  // Verweist auf Herkunft, Annahmen und Wertung des Essen-Beispiels.

    notice.hidden = !this.session.config.sections;

    // Ohne Beispielprofil bleibt der Hinweis verborgen und erhält keinen zusätzlichen Inhalt.
    if (notice.hidden) return;

    link.href = 'gut-zu-wissen.html#essen-beispiel';
    notice.append(
      this.dom.node('strong', 'Unverbindliches, geschätztes Beispiel. '),
      document.createTextNode('Eigene Auswahl und Übungswertung; keine Essener Originalprüfung. '),
      link
    );
  }

  /** Hält Prüfungen und TV-Varianten außerhalb der Suchmaschinenindexierung. */
  configureIndexing() {
    // Prüfungsfolgen und TV-Varianten sollen keine eigenen Suchmaschinentreffer erzeugen.
    if (this.session.isExam || this.session.params.has('tv')) {
      document.querySelector('meta[name=robots]').content = 'noindex,follow';
    }
  }

  /** Synchronisiert Erklärung und Startbeschriftung mit dem ausgewählten Testprofil. */
  updateTestProfile() {
    const profile = this.session.profiles[this.dom.get('testSelect').value];  // Profil, das gerade in der Testauswahl gewählt ist.

    this.dom.get('testDescription').textContent = profile.description;
    this.dom.get('startExam').textContent =
      `${this.session.isExam ? 'Neuen Test' : 'Test'} starten · ${profile.examCount} ↗`;
  }

  /** Bindet Katalogwechsel, Blättern und Ansichtswechsel an. */
  bindNavigation() {
    this.dom.get('modeSelect').addEventListener('change', event => this.changeMode(event.target.value));       // Wechselt zum gewählten Katalog mit dessen getrenntem Lernstand.
    this.dom.get('testSelect').addEventListener('change', () => this.updateTestProfile());                     // Zeigt vor dem Start die Bedingungen des ausgewählten Prüfungsprofils.
    this.dom.get('startExam').addEventListener('click', () => this.startExam());                               // Startet die ausgewählte Testreihe und schützt einen laufenden Stand vor unbeabsichtigtem Neustart.
    this.dom.get('previous').addEventListener('click', () => this.view.step(-1));                              // Blättert zur vorherigen sichtbaren Fragenseite.
    this.dom.get('next').addEventListener('click', () => this.view.step(1));                                   // Blättert zur nächsten sichtbaren Fragenseite.
    this.dom.get('resume').addEventListener('click', () => this.view.resume());                                // Öffnet die nächste noch unvollständig beantwortete Frage.
    this.dom.get('viewSelect').addEventListener('change', event => this.view.changeView(event.target.value));  // Wechselt Fokus-, Listen- oder TV-Ansicht mit passender Position.
    this.dom.get('instantFeedback').addEventListener('click', () => this.view.toggleFeedback());               // Schaltet die manuelle Einzelprüfung im Lernmodus um.
  }

  /** Bindet Suche mit Verzögerung sowie Status- und Themenfilter an. */
  bindFilters() {
    this.dom.get('search').addEventListener('input', () => this.scheduleSearch());  // Übernimmt erst die letzte Sucheingabe nach einer kurzen Eingabepause.
    // Filtert nach offen, beantwortet, geprüft falsch oder gemerkt.
    this.dom.get('statusFilter').addEventListener('change', event => {
      this.session.state.status = event.target.value;
      this.view.applyFilters();                                                     // Zeigt nach der Zustandsänderung erneut nur die aktuell passenden Fragen.
    });
    // Beschränkt den Katalog auf das ausgewählte Thema.
    this.dom.get('categoryFilter').addEventListener('change', event => {
      this.session.state.category = event.target.value;
      this.view.applyFilters();                                                     // Zeigt nach der Zustandsänderung erneut nur die aktuell passenden Fragen.
    });
    // Hebt sämtliche Filter auf und öffnet die erste Katalogfrage.
    this.dom
      .get('clearFilters')
      .addEventListener('click', () => this.view.goTo(this.session.questions[0].id));
  }

  /** Übernimmt erst die letzte Sucheingabe, um unnötige Neuaufbauten zu vermeiden. */
  scheduleSearch() {
    clearTimeout(this.searchTimer);  // Verwirft die noch ausstehende Suche der vorherigen Eingabe.
    // Merkt die verzögerte Suche, damit eine neue Eingabe die vorherige Anforderung verwerfen kann.
    this.searchTimer = setTimeout(() => {
      this.session.state.search = this.dom.get('search').value.trim().toLocaleLowerCase('de');
      this.view.applyFilters();      // Zeigt nach der Zustandsänderung erneut nur die aktuell passenden Fragen.
    }, 140);
  }

  /** Bindet Auswertung, Rücksetzen und Dateisicherung an bestehende Bedienelemente an. */
  bindTools() {
    this.dom.get('intermediate').addEventListener('click', () => this.results.evaluate(true));              // Wertet nur bereits vollständig beantwortete Fragen als Zwischenstand aus.
    this.dom.get('evaluate').addEventListener('click', () => this.results.evaluate(false));                 // Fordert die Gesamtauswertung einschließlich offener Fragen an.
    this.dom.get('reset').addEventListener('click', () => this.reset());                                    // Fragt vor dem Löschen des aktuellen Lernstands ausdrücklich nach.
    this.dom.get('exportProgress').addEventListener('click', () => this.progress.export());                 // Stellt eine lokale Sicherung aller Kataloglernstände bereit.
    this.dom.get('importProgress').addEventListener('change', event => this.progress.import(event));        // Prüft die ausgewählte Sicherungsdatei vor Bestätigung und Zusammenführung.
    this.dom.get('importTrigger').addEventListener('click', () => this.dom.get('importProgress').click());  // Öffnet die vorhandene Dateiauswahl ohne automatische Dateiübernahme.
  }

  /** @param {string} mode Bekannter Katalog; Test-IDs werden beim Wechsel entfernt. */
  changeMode(mode) {
    const url = new URL(location.href);  // Neue Adresse ohne bisherige Prüfungsparameter.

    url.search = '';
    url.hash = 'trainer';
    // Der Gesamtpool ist der Standard und benötigt keinen zusätzlichen Modusparameter.
    if (mode !== 'all') url.searchParams.set('mode', mode);
    // Eine bereits aktive TV-Ansicht bleibt beim Katalogwechsel erhalten.
    if (this.session.state.view === 'tv') url.searchParams.set('tv', '1');
    location.assign(url);  // Öffnet den neuen Modus mit dessen eigenem Lern- oder Prüfungszustand.
  }

  /** @returns {Promise<void>} Rücksetzen nach ausdrücklicher Bestätigung. */
  async reset() {
    const accepted = await this.confirmReset();  // Ausdrückliche Zustimmung zum Löschen dieses Lernbereichs.

    // Abbrechen lässt Antworten, Bewertungen und Merkliste unverändert.
    if (!accepted) return;

    this.session.reset();                                                                    // Leert nur den aktuellen Lernbereich; andere Kataloge bleiben erhalten.
    this.dom.get('result').hidden = true;
    this.session.persist();                                                                  // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.
    this.view.goTo(this.session.questions[0].id);                                            // Öffnet die Zielkarte ohne aktive Filter und führt den Fokus zur Frage.
    window.LHUNDG_UI.toast('Dieser Lernbereich wurde zurückgesetzt.', { type: 'success' });  // Bestätigt das abgeschlossene Rücksetzen ausschließlich dieses Lernbereichs.
  }

  /** Fragt die bestehende Bestätigung ab, bevor Antworten oder Markierungen gelöscht werden. */
  confirmReset() {
    return window.LHUNDG_UI.confirm({
      title: 'Lernbereich zurücksetzen?',
      message: 'Antworten, Bewertungen und Merkliste in diesem Lernbereich werden gelöscht. Andere Lernbereiche bleiben erhalten.',
      confirmLabel: 'Ja, zurücksetzen',
      cancelLabel: 'Nein, weiterlernen',
      danger: true
    });
  }
  /** @returns {Promise<boolean>} Freigabe zum Verlassen eines laufenden, beantworteten Tests. */
  async confirmNewExam() {
    // Ohne laufenden beantworteten Test muss kein Verlust eines Prüfungsstands bestätigt werden.
    if (!this.session.isExam || this.session.state.finished || !this.session.state.answers.size) return true;

    return window.LHUNDG_UI.confirm({
      title: 'Neue Testreihe starten?',
      message: 'Du verlässt die laufende Simulation und startest eine neue zufällige Auswahl.',
      confirmLabel: 'Neue Testreihe',
      cancelLabel: 'Im Test bleiben'
    });
  }

  /** @returns {Promise<void>} Startet eine neue Auswahl im sitzungsbezogenen Prüfungsspeicher. */
  async startExam() {
    // Eine abgelehnte Neustart-Bestätigung lässt die laufende Testfolge geöffnet.
    if (!(await this.confirmNewExam())) return;

    const mode = this.dom.get('testSelect').value;                                                             // Gewünschter Testmodus aus der Testauswahl.
    const profile = this.session.profiles[mode];                                                               // Vorgaben für Fragenquelle und Umfang dieses Tests.
    const selected = window.LHUNDG_CORE.randomQuestions(window.LHUNDG_DATA[profile.pool], profile.examCount);  // Neue zufällige Testfolge aus dem vorgesehenen Pool.
    const url = new URL(location.href);                                                                        // Adresse, in der Modus und konkrete Fragenfolge festgehalten werden.

    url.search = '';
    url.hash = 'trainer';
    url.searchParams.set('mode', mode);
    url.searchParams.set('ids', selected.map(question => question.id).join(','));
    // Die gewählte TV-Ansicht gilt auch für den neu gestarteten Test.
    if (this.session.state.view === 'tv') url.searchParams.set('tv', '1');
    location.assign(url);  // Öffnet den neuen Modus mit dessen eigenem Lern- oder Prüfungszustand.
  }

  /** Markiert ein per URL angefordertes Werkzeug, ohne Dateiaktionen automatisch auszulösen. */
  handleRequestedTool() {
    const actions = { import: 'importTrigger', export: 'exportProgress', reset: 'reset' };  // Zuordnung erlaubter URL-Aktionen zu ihren Bedienelementen.
    const button = actions[this.session.params.get('action')];                              // Zum angeforderten Werkzeug gehörende Element-ID.

    // Ohne zugeordnetes Werkzeug wird weder der Fokus verschoben noch ein Auftrag ausgeführt.
    if (!button) return;

    const url = new URL(location.href);  // Kopie der Adresse zum Entfernen des bereits behandelten Auftrags.

    url.searchParams.delete('action');
    history.replaceState(null, '', url);  // Aktualisiert die Adresse ohne Seitenreload und ohne zusätzlichen Verlaufseintrag.
    // Verlangt für Import, Export oder Löschen weiterhin eine ausdrückliche Benutzeraktion.
    window.LHUNDG_UI.toast(
      'Das gewünschte Werkzeug ist oben in der Navigation markiert. Klicke darauf, um fortzufahren.'
    );
    this.dom.get(button).focus();
  }
};
