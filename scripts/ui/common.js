/* scripts/ui/common.js */

/**
 * @file Öffentliche UI-Schnittstelle und Initialisierung der gemeinsamen Bausteine.
 * @description Öffentliche UI-Schnittstelle und Initialisierung der gemeinsamen Bausteine.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  const modal = new ui.Modal();           // Gemeinsame native Dialoginstanz mit serieller Warteschlange.
  const toasts = new ui.Toasts();         // Gemeinsame Statusmeldungen mit drei sichtbaren Plätzen.
  const support = new ui.Support(modal);  // Freiwillige Unterstützung verwendet dieselbe Dialoginstanz.

  /**
   * Fragt eine Entscheidung ab; Abbrechen und Escape liefern false.
   *
   * @param {object} options Dialogtext und Aktionsbeschriftungen.
   * @param {string} options.title Zugängliche Überschrift.
   * @param {string} options.message Erläuterung der Folgen.
   * @param {string} [options.confirmLabel] Text der bestätigenden Aktion.
   * @param {string} [options.cancelLabel] Text der abbrechenden Aktion.
   * @param {boolean} [options.danger] Kennzeichnung einer löschenden Aktion.
   * @returns {Promise<boolean>} Ob ausdrücklich bestätigt wurde.
   */
  async function confirm(options) {
    return (await modal.open(confirmationOptions(options))) === 'confirm';
  }

  /**
   * Stellt die bisherigen Bestätigungs- und Abbruchaktionen mit ihren Standardbeschriftungen zusammen.
   *
   * @param {object} options Dialogtext und optionale Aktionsbeschriftungen.
   * @returns {ModalOptions} Optionen für den gemeinsamen nativen Dialog.
   */
  function confirmationOptions({
    title,
    message,
    confirmLabel = 'Bestätigen',
    cancelLabel = 'Abbrechen',
    danger = false
  }) {
    return {
      title,
      message,
      actions: [
        { label: cancelLabel, value: 'cancel', autofocus: true },
        { label: confirmLabel, value: 'confirm', primary: true, danger }
      ]
    };
  }

  // Die bisherige öffentliche Schnittstelle bleibt für alle Lernmodule und Root-Seiten unverändert.
  window.LHUNDG_UI = Object.freeze({ modal: modal.open.bind(modal), toast: toasts.show.bind(toasts), confirm });
  window.openSupportDialog = support.open.bind(support);

  ui.bindTheme();  // Synchronisiert Farbwahl, Tooltip und zugängliche Schalterbeschriftung.
  support.bind();  // Aktiviert vorhandene Footer-Links und manuelle Unterstützungsdialoge.
})(window.LHUNDG_UI_PARTS);
