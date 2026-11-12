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

  /**
   * Öffnet die Projekthinweise über dieselbe native Modal- und Fokussteuerung wie die übrige Oberfläche.
   * @returns {void} Kein Rückgabewert.
   */
  function bindAbout() {
    for (const link of document.querySelectorAll('[data-open-about]')) {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        void modal.open({
          title: 'Über diese Lernhilfe',
          message: 'Aus einem privaten Lernprojekt wurde ein frei zugänglicher Trainer für alle, die mit Hund durchs Leben gehen. Das Angebot ist unabhängig, werbefrei und kostenlos. Es ersetzt weder behördliche Auskünfte noch eine Sachkunde- oder Verhaltensprüfung. Für Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen. Maßgeblich sind geltendes Recht und die Auskunft deiner zuständigen Behörde. Ein gutes Übungsergebnis garantiert kein Bestehen.',
          note: 'Reine Lernhilfe. Keine Rechtsberatung. Keine Prüfungsgarantie.',
          returnFocus: link,
          actions: [{ label: 'Schließen', value: 'close', primary: true, autofocus: true }]
        });
      });
    }
  }

  // Die bisherige öffentliche Schnittstelle bleibt für alle Lernmodule und Root-Seiten unverändert.
  window.LHUNDG_UI = Object.freeze({ modal: modal.open.bind(modal), toast: toasts.show.bind(toasts), confirm });
  window.openSupportDialog = support.open.bind(support);

  bindAbout();
  ui.bindDetails();  // Animiert native Aufklappbereiche auf sämtlichen Root-Seiten.
  ui.bindTheme();    // Synchronisiert Farbwahl, Tooltip und zugängliche Schalterbeschriftung.
  support.bind();    // Aktiviert vorhandene Footer-Links und manuelle Unterstützungsdialoge.
})(window.LHUNDG_UI_PARTS);
