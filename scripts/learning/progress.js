/* scripts/learning/progress.js */

/**
 * @file Import und Export von Kataloglernständen.
 * @description Validiert Sicherungen vor Änderungen und führt nur bekannte Kataloge zusammen.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.Progress = class Progress {
  /** @param {TrainerSession} session Lernzustand. @param {TrainerLearningView} view Lernansicht. */
  constructor(session, view) {
    this.session = session;                // Gemeinsame Sitzung als einzige Quelle für Lern- und Prüfungszustand.
    this.view = view;                      // Lernansicht für Rendering, Navigation und Fokusführung.
    this.dom = window.LHUNDG_TRAINER.dom;  // Vorhandene sichere Helfer zum Erzeugen und Auffinden von DOM-Elementen.
    this.core = window.LHUNDG_CORE;        // DOM-unabhängige Regeln für Vollständigkeit, Validierung und Wertung.
  }

  /** @returns {object} Alle Kataloglernstände; Prüfungen bleiben ausgeschlossen. */
  collectCatalogues() {
    const catalogues = {};  // Sicherungsobjekt für Kataloge; Prüfungssitzungen gehören nicht hinein.

    // Sichtet die bekannten Profile mit ihren unveränderten Katalogschlüsseln.
    for (const [name, entry] of Object.entries(this.session.profiles)) {
      // Nur Profile mit dauerhaftem Katalogschlüssel gehören in die Sicherung.
      if (entry.key) catalogues[name] = this.readCatalogue(name, entry);
    }

    // Beim aktiven Lernkatalog hat der aktuelle Arbeitsspeicher auch bei blockierter Speicherung Vorrang.
    if (!this.session.isExam) {
      catalogues[this.session.mode] = {
        answers: this.session.serializeAnswers(),
        bookmarks: [...this.session.state.bookmarks]
      };
    }

    return catalogues;
  }

  /** Liest einen gespeicherten Katalog, ohne Prüfungsdaten in die Sicherung aufzunehmen. */
  readCatalogue(name, entry) {
    const meta = this.session.read('localStorage', `lhundg-meta-${name}-v2`, {}) || {};  // Gespeicherte Katalogmetadaten oder leerer Ersatz bei fehlendem Stand.
    const answers = this.session.read('localStorage', entry.key, {});                    // Gespeicherte Antworten unter dem unveränderten Katalogschlüssel.

    return {
      answers,
      bookmarks: Array.isArray(meta.bookmarks) ? meta.bookmarks : []
    };
  }

  /** Stellt eine Sicherungsdatei bereit; ein abgeschlossener Download ist nicht feststellbar. */
  export() {
    this.session.persist();  // Sichert Antworten und Metadaten im zuständigen Katalog- oder Sitzungsspeicher.

    const data = { format: 'lhundg-learning', version: 1, catalogues: this.collectCatalogues() };  // Versioniertes Sicherungsformat mit sämtlichen Kataloglernständen.
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });          // Als JSON kodierter Dateiinhalt für den lokalen Browserdownload.
    const url = URL.createObjectURL(blob);                                                         // Temporäre Objektadresse; sie wird nach der Download-Anforderung freigegeben.
    const link = this.dom.node('a');                                                               // Nicht sichtbarer Downloadauslöser mit einem datierten Dateinamen.

    link.href = url;
    link.download = `sachkunde-lernstand-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);  // Gibt die temporäre Downloadadresse nach der Anforderung wieder frei.
    // Bestätigt die Downloadbereitstellung; ein tatsächliches Speichern auf dem Datenträger ist nicht nachweisbar.
    window.LHUNDG_UI.toast(
      'Lernstand-Datei zum Speichern bereitgestellt. Prüfungssimulationen sind nicht Bestandteil der Sicherung.',
      { type: 'success' }
    );
  }

  /** @param {Event} event Dateiauswahl. @returns {Promise<void>} Import einschließlich Bestätigung. */
  async import(event) {
    const file = event.target.files[0];  // Erste ausgewählte Sicherungsdatei; Abbrechen liefert keine Datei.

    // Wird die Dateiauswahl abgebrochen, gibt es nichts zu prüfen oder zu übernehmen.
    if (!file) return;

    // Dateilesen, Validierung und Übernahme können verständlich gemeldete Fehler auslösen.
    try {
      const updates = await this.readFile(file);    // Vollständig validierte Katalogänderungen, noch ohne Speicherzugriff zum Schreiben.
      const accepted = await this.confirmImport();  // Zustimmung zum Zusammenführen nach erfolgreicher Vorprüfung.

      // Ohne Zustimmung werden die vorvalidierten Änderungen verworfen.
      if (!accepted) return;

      this.applyUpdates(updates);  // Führt die bestätigten Katalogänderungen zusammen und aktualisiert anschließend die Oberfläche.
    } catch (error) {
      this.notifyError(error);     // Meldet einen verständlichen Datei- oder Validierungsfehler über die gemeinsame UI.
    } finally {
      // Setzt die Dateiauswahl auch bei Abbruch oder Fehler zurück, damit dieselbe Datei erneut gewählt werden kann.
      event.target.value = '';
    }
  }

  /** Übernimmt bestätigte Änderungen und aktualisiert danach die Lernansicht. */
  applyUpdates(updates) {
    // Führt alle zuvor validierten und gemeinsam bestätigten Katalogänderungen nacheinander zusammen.
    for (const update of updates) this.merge(update);

    this.dom.get('result').hidden = true;
    this.view.applyFilters();  // Zeigt nach der Zustandsänderung erneut nur die aktuell passenden Fragen.
    this.notifyImported();     // Unterscheidet erfolgreichen Import und eingeschränkte dauerhafte Speicherung.
  }

  /** @param {File} file Gewählte Sicherung. @returns {Promise<object[]>} Vollständig vorvalidierte Änderungen. */
  async readFile(file) {
    // Dateien über zwei Megabyte werden vor dem Einlesen und Parsen abgelehnt.
    if (file.size > 2_000_000) throw new Error('Die Datei ist zu groß (maximal 2 MB).');

    const imported = JSON.parse(await file.text());   // Geparster, zunächst weiterhin ungeprüfter JSON-Inhalt.

    this.validateFormat(imported);                    // Prüft Kennung, Version und Katalogcontainer vor jeder inhaltlichen Übernahme.

    return this.collectUpdates(imported);
  }

  /** Verwirft fremde Formate vor der katalogbezogenen Antwortvalidierung. */
  validateFormat(imported) {
    const knownFormat = imported?.format === 'lhundg-learning';  // Erwartete Formatkennung des eigenen Lernstandexports.
    const knownVersion = imported?.version === 1;                // Nur Version 1 des Sicherungsformats wird verarbeitet.
    const catalogues = imported?.catalogues;                     // Zu prüfender Container der einzelnen Katalogstände.

    // Fremde Kennungen, Versionen und fehlende Katalogcontainer sind kein unterstütztes Sicherungsformat.
    if (!knownFormat || !knownVersion || !catalogues || typeof catalogues !== 'object') {
      throw new Error('Das ist keine unterstützte Lernstand-Datei.');
    }
  }

  /** Sammelt vorvalidierte Änderungen; unbekannte Katalognamen werden nicht übernommen. */
  collectUpdates(imported) {
    const updates = [];  // Validierte Änderungen, die erst nach Bestätigung übernommen werden.

    // Gleicht die Sicherung mit bekannten Profilen ab, bevor irgendeine Änderung gespeichert wird.
    for (const [name, entry] of Object.entries(this.session.profiles)) {
      // Prüfungsprofile und nicht enthaltene Kataloge werden beim Import übersprungen.
      if (entry.key && Object.hasOwn(imported.catalogues, name)) {
        updates.push(this.validateCatalogue(name, entry, imported.catalogues[name]));
      }
    }

    // Eine Sicherung ohne bekannten Katalog darf keinen leeren Scheinimport melden.
    if (!updates.length) throw new Error('Die Datei enthält keinen bekannten Lernbereich.');

    return updates;
  }

  /** Validiert Antworttokens und Merker gegen den ursprünglichen Katalog. */
  validateCatalogue(name, entry, item) {
    this.validateCatalogueShape(item);  // Prüft die erwartete Struktur, bevor Antwortlisten und Merker gelesen werden.

    const pool = window.LHUNDG_DATA[entry.pool];                                                          // Originalkatalog als Referenz für erlaubte Fragen und Antworttokens.
    const answers = this.core.validAnswers(item.answers, pool);                                           // Durch den Bewertungskern bereinigte Antwortauswahl.
    const ids = new Set(pool.map(question => question.id));                                               // Alle im betreffenden Katalog tatsächlich vorhandenen Frage-IDs.
    const invalidCount = answers.size !== Object.keys(item.answers).length;                               // Bereinigung hat unbekannte oder ungültige Frageantworten verworfen.
    const invalidAnswers = [...answers].some(([id, values]) => values.size !== item.answers[id].length);  // Bereinigung hat ungültige oder doppelte Antworttokens entfernt.
    const invalidBookmarks = item.bookmarks.some(id => !ids.has(id));                                     // Mindestens eine Markierung verweist auf eine fremde Frage.

    // Verworfene Tokens oder fremde Frage-IDs führen zur Ablehnung, statt den Import still zu verändern.
    if (invalidCount || invalidAnswers || invalidBookmarks) {
      throw new Error('Die Lernstand-Datei enthält ungültige Antworten oder Fragen.');
    }

    return { name, entry, answers, bookmarks: item.bookmarks };
  }

  /** Prüft die Katalogstruktur, bevor Antworten und Merker daraus gelesen werden. */
  validateCatalogueShape(item) {
    const validAnswers = item?.answers && typeof item.answers === 'object' && !Array.isArray(item.answers);  // Erwartet ein Antwortobjekt, ausdrücklich kein Array.
    const validBookmarks = Array.isArray(item?.bookmarks);                                                   // Markierungen müssen als Liste vorliegen.

    // Unvollständige Katalogstrukturen werden vor der inhaltlichen Antwortprüfung abgewiesen.
    if (!item || typeof item !== 'object' || !validAnswers || !validBookmarks) {
      throw new Error('Die Lernstand-Datei ist unvollständig.');
    }
  }

  /** @returns {Promise<boolean>} Zustimmung zum Zusammenführen nach vollständiger Validierung. */
  confirmImport() {
    return window.LHUNDG_UI.confirm({
      title: 'Lernstand laden?',
      message:
        'Lernstände werden zusammengeführt. Bei derselben Frage ersetzt die importierte Antwort die bisherige. Bewertungen werden zurückgesetzt.',
      confirmLabel: 'Laden und zusammenführen'
    });
  }

  /** @param {object} update Validierter Katalog; Prüfungszustände werden nicht berührt. */
  merge(update) {
    const pool = window.LHUNDG_DATA[update.entry.pool];                     // Referenzkatalog des zu importierenden Lernstands.
    const saved = this.session.read('localStorage', update.entry.key, {});  // Bisher gespeicherte Antworten dieses Katalogs.
    const existing = this.core.validAnswers(saved, pool);                   // Gültiger Altstand, den importierte Antworten bei derselben Frage ersetzen.

    // Importierte Antworten ersetzen dieselben Frage-IDs; übrige Altantworten bleiben erhalten.
    for (const [id, values] of update.answers) existing.set(id, values);

    const serialized = Object.fromEntries([...existing].map(([id, values]) => [id, [...values]]));  // JSON-kompatible Antwortlisten statt der intern verwendeten Sets.
    this.session.write('localStorage', update.entry.key, serialized);                               // Sichert die zusammengeführten Antworten, bevor Metadaten und aktive Ansicht synchronisiert werden.
    const bookmarks = this.mergeMetadata(update);                                                   // Zusammengeführte Markierungen nach Aktualisierung der Metadaten.
    this.replaceActiveState(update, existing, bookmarks);                                           // Aktualisiert nur bei demselben geöffneten Katalog auch dessen Arbeitsspeicher.
  }

  /** Synchronisiert nach einem Import nur den aktuell geöffneten Katalog im Arbeitsspeicher. */
  replaceActiveState(update, answers, bookmarks) {
    // Andere Kataloge werden nur gespeichert; der gerade offene Prüfungs- oder Lernzustand bleibt getrennt.
    if (update.name !== this.session.mode) return;

    this.session.state.answers = answers;
    this.session.state.bookmarks = new Set(bookmarks);
    this.session.state.checked.clear();
  }
  /** @param {object} update Validierte Änderung. @returns {number[]} Zusammengeführte Markierungen. */
  mergeMetadata(update) {
    const key = `lhundg-meta-${update.name}-v2`;                    // Bestehender Metadatenschlüssel des importierten Katalogs.
    const meta = this.session.read('localStorage', key, {}) || {};  // Altmetadaten, deren Ansicht und Position erhalten bleiben.

    // Vereinigung alter und importierter Merker ohne doppelte IDs.
    const bookmarks = [
      ...new Set([...(Array.isArray(meta.bookmarks) ? meta.bookmarks : []), ...update.bookmarks])
    ];

    this.session.write('localStorage', key, { ...meta, checked: {}, bookmarks });  // Erhält Ansicht und Position, vereinigt Merker und verwirft überholte Bewertungen.

    return bookmarks;
  }

  /** Meldet den Import unter Berücksichtigung eventuell eingeschränkter Speicherung. */
  notifyImported() {
    const failed = this.session.storageFailed;  // Merkt, ob Lesen oder Schreiben des Browserspeichers eingeschränkt war.
    
    // Erfolgsmeldung oder Hinweis auf zusätzlich nötige Dateisicherung.
    const text = failed
      ? 'Lernstand übernommen. Die dauerhafte Speicherung ist eingeschränkt; bitte sichere ihn zusätzlich als Datei.'
      : 'Lernstand geladen. Deine Antworten wurden zusammengeführt.';

    window.LHUNDG_UI.toast(text, { type: failed ? 'warning' : 'success' });  // Meldet eine erfolgreiche Übernahme oder die zusätzlich eingeschränkte Speicherung.
  }

  /** @param {unknown} error Parser-, Validierungs- oder Dateifehler. */
  notifyError(error) {
    // Unterscheidet ungültiges JSON, konkrete Fehler und einen allgemeinen Ersatztext.
    const message =
      error instanceof SyntaxError
        ? 'Die Datei ist beschädigt oder enthält kein gültiges JSON. Bitte wähle eine exportierte Lernstand-Datei.'
        : error instanceof Error
          ? error.message
          : 'Die Datei konnte nicht geladen werden.';

    window.LHUNDG_UI.toast(message, { type: 'error' });  // Zeigt den verständlich eingeordneten Fehler, ohne die Lernansicht zu verlassen.
  }
};
