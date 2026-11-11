/* scripts/learning/dom.js */

/**
 * @file Gemeinsame DOM-Helfer des Trainers.
 * @description Erstellt Texte und Aktionen ohne HTML-Interpolation.
 * @author Benjamin Bennewitz [B²]
 *
 * @typedef {InstanceType<typeof window.LHUNDG_TRAINER.Session>} TrainerSession
 * @typedef {InstanceType<typeof window.LHUNDG_TRAINER.LearningView>} TrainerLearningView
 */
window.LHUNDG_TRAINER.dom = {
  /** @param {string} id Element-ID. @returns {HTMLElement} Vorhandenes Bedienelement. */
  get(id) {
    return document.getElementById(id);
  },

  /**
   * @param {string} tag HTML-Elementname.
   * @param {string} [text] Sicher einzusetzender Text.
   * @param {string} [className] CSS-Klassen.
   * @returns {HTMLElement} Noch nicht eingefügtes Element.
   */
  node(tag, text, className) {
    const element = document.createElement(tag);  // Neues DOM-Element; Text wird ohne HTML-Auswertung eingesetzt.

    // Auch ein ausdrücklich leerer Text wird übernommen; nur ein fehlender Text bleibt ungesetzt.
    if (text !== undefined) element.textContent = text;
    // Zusätzliche CSS-Klassen werden nur bei tatsächlich übergebenem Klassennamen gesetzt.
    if (className) element.className = className;

    return element;
  },

  /**
   * @param {string} text Buttonbeschriftung.
   * @param {string} className CSS-Klassen.
   * @param {Function} action Klickbehandlung.
   * @returns {HTMLButtonElement} Formularunabhängige Aktion.
   */
  button(text, className, action) {
    const element = this.node('button', text, className);  // Nativer Button mit vorhandenen Text- und Klassen-Helfern.

    element.type = 'button';
    element.addEventListener('click', action);

    return element;
  }
};
