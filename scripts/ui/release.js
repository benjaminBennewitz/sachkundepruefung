/* scripts/ui/release.js */

/**
 * @file Versionierte Neuigkeiten im gemeinsamen Dialog.
 * @description Zeigt aktuelle Neuigkeiten mit Historie und speichert ausschließlich die zuletzt gesehene Version.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  const storageKey = 'lhundg-release-seen';
  const releases = Object.freeze([{
    version: '2026.11.17.2',
    date: '17. November 2026',
    title: 'Ein Lernplatz für jede Person.',
    message: 'Gemeinsam üben, den eigenen Stand behalten und den passenden Nachweis finden. Das ist neu:',
    features: [
      ['Eigene lokale Lernprofile.', 'Profile anlegen, benennen und nach zwei Bestätigungen löschen. Dein erstes Profil übernimmt den bisherigen Lernstand.'],
      ['Fortschritte miteinander vergleichen.', 'Die Startseite zeigt Kennzahlen je Profil samt Katalog und Anzahl geprüfter Fragen.'],
      ['Den richtigen Nachweis finden.', '§§ 3, 10 und 11 klarer unterscheiden und den Weg zur Haltungserlaubnis einschließlich Führungszeugnis und Mietwohnung nachvollziehen.']
    ]
  }, {
    version: '2026.11.17',
    date: '17. November 2026',
    title: 'Das große Design-Refactoring.',
    message: 'Eine gemeinsame Gestaltung für die gesamte Lernhilfe – mit mehr Persönlichkeit und einem eigenen Platz zum Lernen.',
    features: [
      ['Eine eigene visuelle Identität.', 'Aufeinander abgestimmte Naturfarben, klare Typografie und ein einheitliches Erscheinungsbild für helle und dunkle Darstellung.'],
      ['Ein eigenständiger Lernbereich.', 'Fragen und Antworten erhalten mehr Raum. Suche, Filter, Fragenübersicht, Sofortfeedback sowie Zwischen- und Gesamtauswertung sind im Lernbereich gebündelt.'],
      ['Fortschritt im Blick.', 'Katalogbezogene Kennzahlen zeigen beantwortete Fragen, geprüfte richtige Antworten, Fehler und Merker.'],
      ['Wissen im Magazinformat.', 'Die Infoseiten verbinden zusammenhängende Texte, wechselnde Spalten und persönliche Hundebilder.'],
      ['Lesen und Lernen erleichtern.', 'Textvergrößerung, zusätzliche Kontraste, alternative Statusfarben und Vorlesen mit einer lokalen deutschen Systemstimme, sofern verfügbar.']
    ]
  }]);
  /* Der erste Eintrag ist immer aktuell; frühere Einträge bleiben darunter unverändert lesbar. */
  const release = releases[0];

  /**
   * Liest nur die zuletzt geschlossene Release-Version; gesperrter Speicher blockiert keinen Dialog.
   * @returns {string|null} Gespeicherte Versionskennung oder null ohne verfügbaren Speicher.
   */
  function seenVersion() {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  }

  /**
   * Baut die Neuigkeiten als sichere Textknoten ohne HTML-Interpolation.
   * @returns {HTMLElement} Aktuelle Neuigkeiten mit anschließender Historie.
   */
  function buildContent() {
    const content = ui.node('div', '', 'release-content');
    release.features.forEach(([title, text], index) => {
      const section = ui.node('section');
      const number = ui.node('span', String(index + 1).padStart(2, '0'), 'release-number');
      const copy = ui.node('div');
      number.setAttribute('aria-hidden', 'true');
      copy.append(ui.node('h3', title), ui.node('p', text));
      section.append(number, copy);
      content.append(section);
    });
    if (releases.length > 1) content.append(buildHistory());
    return content;
  }

  /** @returns {HTMLElement} Frühere Updates in umgekehrt chronologischer Reihenfolge. */
  function buildHistory() {
    const history = ui.node('div', '', 'release-history');
    const title = ui.node('h3', 'Frühere Updates');
    title.id = 'releaseHistoryTitle';
    history.setAttribute('role', 'region');
    history.setAttribute('aria-labelledby', title.id);
    history.append(title, ui.node('p', 'Was sich zuvor verändert hat – zum Nachlesen.'));
    for (const entry of releases.slice(1)) {
      const article = ui.node('article', '', 'release-history-entry');
      article.setAttribute('aria-labelledby', `release-${entry.version}`);
      const heading = ui.node('h4', entry.title);
      heading.id = `release-${entry.version}`;
      article.append(ui.node('p', `${entry.date} · Version ${entry.version}`, 'release-history-meta'),
        heading, ui.node('p', entry.message));
      const features = ui.node('ul');
      for (const [label, text] of entry.features) {
        const item = ui.node('li');
        item.append(ui.node('strong', label), ui.node('p', text));
        features.append(item);
      }
      article.append(features);
      history.append(article);
    }
    return history;
  }

  /**
   * Bindet manuelle Update-Zugänge und reiht ein neues Release vor den übrigen Einstiegen ein.
   * @param {Modal} modal Gemeinsame native Dialogsteuerung.
   * @returns {Promise<void>} Abschluss des gegebenenfalls automatisch angezeigten Updates.
   */
  ui.bindRelease = async modal => {
    let opening = false;

    /**
     * Öffnet die aktuellen Neuigkeiten auch dann, wenn diese Version bereits gesehen wurde.
     * @param {HTMLElement} [trigger] Auslöser für die Fokus-Rückgabe beim manuellen Öffnen.
     * @returns {Promise<void>} Abschluss nach Schließen des Updates.
     */
    async function openUpdate(trigger) {
      if (opening) return;
      opening = true;
      try {
        await modal.open({
          eyebrow: `Update / ${release.version}`,
          title: release.title,
          message: release.message,
          content: buildContent(),
          returnFocus: trigger,
          closeButton: true,
          actions: [{ label: 'Alles klar. Los geht’s!', value: 'close', primary: true }],
          note: 'Weiterhin kostenlos, ohne Anmeldung und ohne Werbung.'
        });
        try {
          /* Ein fester Schlüssel ersetzt die vorige Version ohne Verlauf oder Zeitstempel. */
          window.localStorage.setItem(storageKey, release.version);
        } catch {
          /* Gesperrter Speicher verhindert das Lesen und Weiterlernen nicht. */
        }
      } finally {
        opening = false;
      }
    }

    for (const link of document.querySelectorAll('[data-open-release]')) {
      link.addEventListener('click', async event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        await openUpdate(link);
      });
    }
    /* Die Anmeldung erfolgt vor dem ersten await dieser Bindung und behält dadurch ihren Vorrang. */
    if (seenVersion() !== release.version) await openUpdate();
  };
})(window.LHUNDG_UI_PARTS);
