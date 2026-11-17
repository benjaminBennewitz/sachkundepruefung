/* scripts/ui/release.js */

/**
 * @file Versionierte Neuigkeiten im gemeinsamen Dialog.
 * @description Reiht das aktuelle Release zuerst ein und ersetzt beim Schließen die zuletzt gesehene Version.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  const storageKey = 'lhundg-release-seen';
  const release = Object.freeze({
    version: '2026.11.17',
    title: 'Dein neuer Lernplatz ist da.',
    message: 'Der Sachkundetrainer hat ein neues Gesicht bekommen. Das ist neu:',
    features: [
      ['Mehr Platz für deine Fragen.', 'Der eigenständige Lernbereich bündelt Fragen, Antworten und Werkzeuge an einem Ort.'],
      ['Dein Fortschritt im Blick.', 'Lernüberblick und Kennzahlen zeigen deinen Stand im jeweiligen Katalog – direkt aus deinem Browser.'],
      ['So liest und lernst du leichter.', 'Größere Texte, mehr Kontrast, alternative Statusfarben und Vorlesen mit einer lokalen deutschen Systemstimme, wenn verfügbar.']
    ]
  });

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
   * @returns {HTMLElement} Kapitel des aktuellen Releases.
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
    return content;
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
