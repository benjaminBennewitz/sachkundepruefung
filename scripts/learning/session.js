/* scripts/learning/session.js */

/**
 * @file Lernzustand und Browserspeicher.
 * @description Hält stabile Speicherschlüssel, Testauswahl und Antwortzustände zusammen.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.Session = class Session {
  /** @param {URLSearchParams} params Aktuelle URL-Parameter. */
  constructor(params) {
    this.params = params;                                                                       // Parameter der beim Start geöffneten Adresse.
    this.profiles = window.LHUNDG_TRAINER.profiles;                                             // Vorhandene Katalog- und Prüfungskonfigurationen.
    this.mode = Object.hasOwn(this.profiles, params.get('mode')) ? params.get('mode') : 'all';  // Bekannter URL-Modus oder der Gesamtpool als Rückfallwert.
    this.config = this.profiles[this.mode];                                                     // Konfiguration des für diese Sitzung ausgewählten Profils.
    this.isExam = Number.isInteger(this.config.examCount);                                      // Ein festgelegter Testumfang kennzeichnet einen Prüfungsmodus.

    this.storageFailed = false;                                   // Merkt Speicherprobleme, ohne den laufenden Trainer zu blockieren.
    this.storageWarningShown = false;                             // Verhindert wiederholte Warnungen für denselben Speicherfehler.
    this.questions = this.selectQuestions();                      // Konkreter Katalog oder konkrete Testfolge dieser Sitzung.
    this.kind = this.isExam ? 'sessionStorage' : 'localStorage';  // Tests bleiben in sessionStorage; Kataloge verwenden localStorage.
    this.answerKey = this.getAnswerKey();                         // Bestehender Schlüssel für Antworten dieses Katalogs oder Tests.
    this.metaKey = this.getMetaKey();                             // Passender Schlüssel für Position, Merker und Bewertungssignaturen.

    this.state = this.restoreState();  // Zentraler wiederhergestellter Zustand für Antworten, Merker und Anzeige.
    this.restoreChecked();             // Übernimmt nur Bewertungen, die noch zur aktuellen Antwortsignatur passen.
  }

  /** @returns {SachkundeQuestion[]} Gewählter Katalog oder wiederherstellbarer Test. */
  selectQuestions() {
    const pool = window.LHUNDG_DATA[this.config.pool];  // Unveränderter Fragenpool des ausgewählten Profils.

    // Lernkataloge verwenden ihren vollständigen Pool und benötigen keine zufällige Prüfungsfolge.
    if (!this.isExam) return pool;

    const questions = this.restoreExamQuestions(pool);  // Wiederhergestellte oder neu gezogene Prüfungsfolge.
    this.updateExamUrl(questions);                      // Hält die konkrete Testfolge für Reload und Wiederherstellung in der URL fest.

    return questions;
  }

  /** Validiert die vollständige URL-Auswahl; ungültige Folgen werden neu gezogen. */
  restoreExamQuestions(pool) {
    const ids = (this.params.get('ids') || '').split(',').filter(Boolean).map(Number);  // Aus der URL gelesene numerische Frage-IDs in ihrer angegebenen Reihenfolge.
    const byId = new Map(pool.map(question => [question.id, question]));                // Nachschlagetabelle der in diesem Prüfungspool erlaubten Fragen.
    const correctCount = ids.length === this.config.examCount;                          // Die übergebene Folge besitzt genau den vorgesehenen Testumfang.
    const uniqueIds = new Set(ids).size === ids.length;                                 // Keine Frage darf innerhalb derselben Testfolge doppelt vorkommen.
    const knownIds = ids.every(id => byId.has(id));                                     // Jede ID gehört tatsächlich zum ausgewählten Fragenpool.

    // Nur eine vollständige, eindeutige und zum Pool gehörende ID-Folge wird unverändert wiederhergestellt.
    if (correctCount && uniqueIds && knownIds) {
      return ids.map(id => byId.get(id));
    }

    return window.LHUNDG_CORE.randomQuestions(pool, this.config.examCount);
  }

  /** Hält die konkrete Testfolge für Reload und Wiederherstellung in der URL fest. */
  updateExamUrl(questions) {
    const url = new URL(location.href);                            // Kopie der aktuellen Adresse; andere Parameter bleiben bestehen.
    const ids = questions.map(question => question.id).join(',');  // Konkrete Fragenfolge für einen stabil wiederherstellbaren Prüfungstest.

    url.searchParams.set('ids', ids);
    history.replaceState(null, '', url);  // Aktualisiert die Adresse ohne Seitenreload und ohne zusätzlichen Verlaufseintrag.
  }

  /** @returns {string} Unveränderter Antwortschlüssel für Katalog oder konkrete Testfolge. */
  getAnswerKey() {
    const ids = this.questions.map(question => question.id).join('-');  // Reihenfolgeabhängiger Schlüsselteil zur Trennung konkreter Tests.

    // Prüfungsfolgen erhalten eigene Schlüssel; Kataloge behalten ihre bestehenden Antwortschlüssel.
    return this.isExam ? `lhundg-${this.mode}-v1:${ids}` : this.config.key;
  }

  /** @returns {string} Kompatibler Metadatenschlüssel einschließlich MG-Sondername. */
  getMetaKey() {
    const ids = this.questions.map(question => question.id).join('-');  // Identifiziert dieselbe konkrete Fragenfolge wie die zugehörigen Antworten.
    const mode = this.mode === 'mgexam' ? 'exam' : this.mode;           // Behält den historischen MG-Namen exam für bereits gespeicherte Sitzungen bei.

    // Prüfungsmetadaten bleiben folgenbezogen, Katalogmetadaten bleiben modusbezogen.
    return this.isExam ? `lhundg-${mode}-meta-v2:${ids}` : `lhundg-meta-${this.mode}-v2`;
  }

  /** @returns {object} Validierte Metadaten oder ein leerer Ausgangszustand. */
  readMeta() {
    const meta = this.read(this.kind, this.metaKey, {});  // Gelesener Rohwert, der noch auf eine gültige Objektform geprüft wird.

    // Nur ein echtes Objekt wird als Metadaten verwendet; andere Formen fallen auf einen leeren Stand zurück.
    return meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {};
  }

  /** @returns {unknown} Gespeicherte Antworten, im Gesamtpool gegebenenfalls alter Basispool. */
  readAnswers() {
    const saved = this.read(this.kind, this.answerKey);  // Eigener Antwortstand; null bedeutet fehlend und unterscheidet sich von einem leeren Stand.

    // Nur ein fehlender Gesamtpool-Stand übernimmt den alten Basispool; ein bewusst leerer Stand bleibt leer.
    return this.mode === 'all' && saved === null
      ? this.read('localStorage', this.profiles.mg.key, {})
      : saved;
  }

  /** @returns {object} Laufender Zustand mit validierten Antworten und frischen Filtern. */
  restoreState() {
    const meta = this.readMeta();                                                         // Validierte Metadaten des aktuellen Katalogs oder Tests.
    const answers = window.LHUNDG_CORE.validAnswers(this.readAnswers(), this.questions);  // Gegen den aktiven Pool bereinigte Antwortmengen.
    const bookmarks = new Set(this.validBookmarks(meta.bookmarks));                       // Nur bekannte Frage-IDs werden als Merkliste wiederhergestellt.

    return {
      answers,
      bookmarks,
      checked: new Map(),
      finished: this.isExam && meta.finished === true,
      ...this.restoreDisplayState(meta),
      items: this.questions,
      search: '',
      status: 'all',
      category: 'all'
    };
  }

  /** Übernimmt gespeicherte Darstellung und Position unabhängig von den Lernfiltern. */
  restoreDisplayState(meta) {
    const savedIndex = this.questions.findIndex(question => question.uid === meta.position);  // Position der gespeicherten UID; -1 bedeutet, dass sie im aktuellen Pool fehlt.
    const instant = this.read('localStorage', 'lhundg-instant-feedback-v2', '1');             // Katalogübergreifende Einstellung zur Einzelprüfung, mit aktiviertem Standardwert.

    return {
      view: this.restoreView(meta.view),
      index: Math.max(0, savedIndex),
      instant: String(instant) === '1'
    };
  }
  /** @param {unknown} ids Gespeicherte Markierungen. @returns {number[]} Bekannte Frage-IDs. */
  validBookmarks(ids) {
    const known = new Set(this.questions.map(question => question.id));  // IDs des aktiven Pools als Referenz für erlaubte Markierungen.

    // Nur bekannte IDs aus einer tatsächlich gespeicherten Liste dürfen wiederhergestellt werden.
    return Array.isArray(ids) ? ids.filter(id => known.has(id)) : [];
  }

  /** @param {string} saved Gespeicherte Ansicht. @returns {string} Gültige Ansicht. */
  restoreView(saved) {
    // Ein ausdrücklicher TV-Parameter hat Vorrang vor der gespeicherten Ansicht.
    if (this.params.get('tv') === '1') return 'tv';

    // Unbekannte gespeicherte Ansichten fallen auf die Fokusansicht zurück.
    return ['focus', 'list', 'tv'].includes(saved) ? saved : 'focus';
  }

  /**
   * @param {SachkundeQuestion} question Frage im aktiven Lernbereich.
   * @returns {boolean} Ob die Lösung für die aktuelle Auswahl sichtbar werden darf.
   */
  canShowEvaluation(question) {
    if (this.isExam) return this.state.finished;
    return window.LHUNDG_CORE.complete(question, this.state.answers.get(question.id));
  }

  /** Übernimmt Bewertungen nur für die unveränderte Antwort und abgeschlossene Tests. */
  restoreChecked() {
    const meta = this.readMeta();  // Gespeicherte Bewertungssignaturen des aktuellen Lernbereichs.

    // Vergleicht jede aktuelle Frage mit ihrer gespeicherten Bewertungssignatur.
    for (const question of this.questions) {
      const signature = this.signature(question);  // Sortierte aktuelle Antwort, die exakt zur gespeicherten Bewertung passen muss.

      // Bewertungen gelten nur für dieselbe Antwortsignatur und bei Tests erst nach dem Abschluss.
      if (this.canShowEvaluation(question) && meta.checked?.[question.id] === signature) {
        this.state.checked.set(question.id, signature);
      }
    }
  }

  /** @param {SachkundeQuestion} question Frage. @returns {string} Sortierte Antwortsignatur. */
  signature(question) {
    return [...(this.state.answers.get(question.id) || [])].sort().join('|');
  }

  /**
   * @param {'localStorage'|'sessionStorage'} kind Speicherbereich.
   * @param {string} key Speicherschlüssel.
   * @param {*} [fallback=null] Ersatz bei fehlenden oder unlesbaren Daten.
   * @returns {*} Gelesenes JSON oder Ersatz; Speicherfehler blockieren das Lernen nicht.
   */
  read(kind, key, fallback = null) {
    // Ein gesperrter Speicher oder ungültiges JSON darf den Trainerstart nicht abbrechen.
    try {
      const raw = window[kind].getItem(key);  // Ungeparster Speicherinhalt; ein fehlender Schlüssel liefert null.

      // Ein fehlender Schlüssel verwendet den Ersatzwert; vorhandener Inhalt wird als JSON gelesen.
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      // Merkt den Fehler und verwendet den vom Aufrufer vorgesehenen Ersatzwert.
      this.storageFailed = true;

      return fallback;
    }
  }

  /**
   * @param {'localStorage'|'sessionStorage'} kind Speicherbereich.
   * @param {string} key Speicherschlüssel.
   * @param {*} value JSON-kompatibler Wert.
   */
  write(kind, key, value) {
    // Speichersperren und volle Kontingente dürfen den aktuellen Lernzustand nicht zerstören.
    try {
      window[kind].setItem(key, JSON.stringify(value));
    } catch {
      // Behält die aktuellen Antworten im Arbeitsspeicher und warnt höchstens einmal.
      this.storageFailed = true;
      this.showStorageWarning();  // Warnt einmalig, während die aktuellen Antworten weiter im Arbeitsspeicher bleiben.
    }
  }

  /** Meldet Speicherprobleme einmalig; der aktuelle Zustand bleibt im Arbeitsspeicher. */
  showStorageWarning() {
    // Ohne Speicherfehler oder nach bereits gezeigter Warnung wird kein weiterer Hinweis erzeugt.
    if (!this.storageFailed || this.storageWarningShown) return;

    this.storageWarningShown = true;
    // Zeigt eine bleibende Warnung mit dem Hinweis auf eine zusätzliche Dateisicherung.
    window.LHUNDG_UI.toast(
      'Dein Browser blockiert die Speicherung oder der Speicher ist voll. Du kannst weiterlernen; sichere deinen Lernstand vor dem Schließen über „Lernstand sichern“.',
      {
        type: 'warning',
        key: 'storage-failed',
        duration: 0
      }
    );
  }

  /** Sichert Antworten und Metadaten ausschließlich im aktiven Katalog oder Test. */
  persist() {
    this.write(this.kind, this.answerKey, this.serializeAnswers());  // Schreibt diesen Teil des Lernstands in den für Katalog oder Test vorgesehenen Speicher.
    // Schreibt diesen Teil des Lernstands in den für Katalog oder Test vorgesehenen Speicher.
    this.write(this.kind, this.metaKey, {
      version: 2,
      bookmarks: [...this.state.bookmarks],
      checked: Object.fromEntries(this.state.checked),
      position: this.state.items[this.state.index]?.uid,
      view: this.state.view,
      finished: this.state.finished
    });
  }

  /** @returns {object} JSON-kompatible Auswahl nach Frage-ID. */
  serializeAnswers() {
    return Object.fromEntries([...this.state.answers].map(([id, values]) => [id, [...values]]));
  }

  /** Setzt ausschließlich den laufenden Lernbereich zurück; Speicherung erfolgt beim Aufrufer. */
  reset() {
    this.state.answers.clear();
    this.state.bookmarks.clear();
    this.state.checked.clear();
    this.state.finished = false;
    this.state.index = 0;
  }
};
