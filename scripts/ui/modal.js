/* scripts/ui/modal.js */

/**
 * @file Native Modale mit serieller Warteschlange und Fokus-Rückgabe.
 * @description Native Modale mit serieller Warteschlange und Fokus-Rückgabe.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  /**
   * @typedef {object} ModalAction
   * @property {string} label Sichtbare Aktionsbeschriftung.
   * @property {string} [value] Rückgabewert eines schließenden Buttons.
   * @property {string} [href] Externes Linkziel statt eines schließenden Buttons.
   * @property {boolean} [primary] Hebt die Aktion hervor.
   * @property {boolean} [danger] Kennzeichnet eine löschende Aktion.
   * @property {boolean} [autofocus] Fokussiert diese Aktion beim Öffnen.
   * @property {boolean} [paypal] Ergänzt das lokale PayPal-Zeichen.
   */

  /**
   * @typedef {object} ModalOptions
   * @property {string} title Zugängliche Dialogüberschrift.
   * @property {string} message Beschreibung der Entscheidung.
   * @property {string} [eyebrow] Kurzer Kontext über der Überschrift.
   * @property {string} [note] Zusätzlicher Hinweis unter den Aktionen.
   * @property {HTMLElement} [content] Optionaler Inhalt aus einer lokalen, vertrauenswürdigen Projektseite.
   * @property {ModalAction[]} actions Verfügbare Dialogaktionen.
   * @property {HTMLElement} [returnFocus] Fokusziel nach dem Schließen.
   */

  ui.Modal = class Modal {
    /**
     * Erstellt genau ein wiederverwendetes natives Dialogelement.
     *
     * @returns {Modal} Neue Modal-Steuerung mit zunächst leerer Warteschlange.
     */
    constructor() {
      this.dialog = ui.node('dialog', '', 'ui-modal');  // Gemeinsames natives Element für alle Entscheidungen.
      this.sequence = Promise.resolve();                // Jeder Dialog wartet auf den Abschluss des vorherigen.

      this.dialog.setAttribute('aria-labelledby', 'uiModalTitle');
      this.dialog.setAttribute('aria-describedby', 'uiModalMessage');
      document.body.append(this.dialog);
    }

    /**
     * Reiht einen Dialog ein und erhält die Warteschlange auch nach einem fehlgeschlagenen Aufruf.
     *
     * @param {ModalOptions} options Texte und Aktionen dieses Dialogs.
     * @returns {Promise<string>} Aktionswert oder cancel beim Abbrechen.
     */
    open(options) {
      const result = this.sequence.then(() => this.present(options));  // Nur dieser Aufrufer erhält sein Ergebnis oder seinen Fehler.

      this.sequence = result.catch(() => {});  // Ein einzelner Fehler darf spätere Dialoge nicht blockieren.

      return result;
    }

    /**
     * Zeigt einen einzelnen Dialog und verknüpft dessen Schließen mit seinem Ergebnis.
     *
     * @param {ModalOptions} options Texte, Aktionen und optionales Rücksprungziel.
     * @returns {Promise<string>} Ergebnis nach Schließen und Fokus-Rückgabe.
     */
    present(options) {
      return new Promise(resolve => {
        const origin = options.returnFocus || document.activeElement;  // Fokusziel vor dem Öffnen dieser Entscheidung.

        this.dialog.replaceChildren(this.buildCard(options));
        this.dialog.returnValue = '';
        this.dialog.addEventListener('close', () => this.finish(origin, resolve), { once: true });
        document.documentElement.classList.add('modal-open');
        this.dialog.showModal();
        /* Längere Lesetexte beginnen oben, statt durch eine Aktion am Ende nach unten zu springen. */
        if (options.content) {
          const title = this.dialog.querySelector('#uiModalTitle');
          title.tabIndex = -1;
          title.focus({ preventScroll: true });
          this.dialog.scrollTop = 0;
        }
      });
    }

    /**
     * Entfernt den Modalzustand und gibt Fokus sowie Entscheidung an den Aufrufer zurück.
     *
     * @param {HTMLElement} origin Vor dem Öffnen aktives oder ausdrücklich angegebenes Element.
     * @param {Function} resolve Abschlussfunktion des zugehörigen Dialog-Promises.
     * @returns {void} Kein Rückgabewert.
     */
    finish(origin, resolve) {
      document.documentElement.classList.remove('modal-open');

      // Entfernte Auslöser dürfen nicht mehr fokussiert werden.
      if (origin?.isConnected) origin.focus({ preventScroll: true });

      resolve(this.dialog.returnValue || 'cancel');
    }

    /**
     * Baut ausschließlich den Inhaltsbereich eines Dialogs aus sicheren Textknoten auf.
     *
     * @param {ModalOptions} options Dialoginhalt einschließlich optionaler Zusatztexte.
     * @returns {HTMLElement} Vollständiger Inhalt für das wiederverwendete dialog-Element.
     */
    buildCard(options) {
      const card = ui.node('div', '', 'ui-modal-inner');  // Gemeinsamer Rahmen für Texte und Aktionen.

      // Der Kontext über der Überschrift ist optional.
      if (options.eyebrow) card.append(ui.node('p', options.eyebrow, 'eyebrow'));

      card.append(this.title(options.title), this.message(options.message));
      /* Eingehängte Projektinhalte behalten native Links und Überschriften ohne HTML-Interpolation. */
      if (options.content) card.append(options.content);
      card.append(this.actions(options.actions));

      // Ein Zusatzhinweis wird nur bei tatsächlich vorhandenem Text angehängt.
      if (options.note) card.append(ui.node('p', options.note, 'microcopy'));

      return card;
    }

    /**
     * Erstellt die über aria-labelledby verknüpfte Dialogüberschrift.
     *
     * @param {string} text Sichtbarer Titel.
     * @returns {HTMLHeadingElement} Sicher befüllte Dialogüberschrift.
     */
    title(text) {
      const title = ui.node('h2', text);  // Feste ID verbindet die Überschrift mit dem nativen Dialog.

      title.id = 'uiModalTitle';

      return title;
    }

    /**
     * Erstellt den über aria-describedby verknüpften Erklärungstext.
     *
     * @param {string} text Sichtbare Erläuterung der Entscheidung.
     * @returns {HTMLParagraphElement} Sicher befüllte Dialogbeschreibung.
     */
    message(text) {
      const message = ui.node('p', text);  // Feste ID verbindet den Erklärungstext mit dem nativen Dialog.

      message.id = 'uiModalMessage';

      return message;
    }

    /**
     * Ordnet die verfügbaren Aktionen in ihrer ausdrücklich vorgegebenen Reihenfolge an.
     *
     * @param {ModalAction[]} actions Schließende Buttons und externe Links.
     * @returns {HTMLElement} Aktionsbereich mit allen bedienbaren Controls.
     */
    actions(actions) {
      const group = ui.node('div', '', 'dialog-actions');  // Vorhandenes Layout aus dem gemeinsamen Designsystem.

      // Die Reihenfolge bestimmt Darstellung und initialen Tastaturfokus.
      for (const action of actions) group.append(this.action(action));

      return group;
    }

    /**
     * Erstellt eine Aktion mit gemeinsamer Darstellung und ihrem jeweiligen Bedienverhalten.
     *
     * @param {ModalAction} action Einzelne Dialogaktion.
     * @returns {HTMLElement} Schließender Button oder externer Link.
     */
    action(action) {
      const className = action.danger ? 'button danger-button' : action.primary ? 'button primary' : 'button secondary';  // Gefahr hat wie bisher Vorrang vor primärer Hervorhebung.
      const control = ui.node(action.href ? 'a' : 'button', action.label, className);                                     // Der Aktionstyp folgt dem vorhandenen Linkziel.

      // Links öffnen externe Ziele; Buttons schließen die Entscheidung mit ihrem Aktionswert.
      if (action.href) this.configureLink(control, action);
      else this.configureButton(control, action);

      control.autofocus = action.autofocus === true;

      return control;
    }

    /**
     * Konfiguriert eine externe Dialogaktion ohne den aktuellen Dialog zu schließen.
     *
     * @param {HTMLAnchorElement} control Vorbereitetes Linkelement.
     * @param {ModalAction} action Linkziel und optionale PayPal-Kennzeichnung.
     * @returns {void} Kein Rückgabewert.
     */
    configureLink(control, action) {
      Object.assign(control, { href: action.href, target: '_blank', rel: 'noopener noreferrer external' });

      // Nur PayPal-Aktionen erhalten das lokale Zahlungsdienst-Icon.
      if (action.paypal) ui.decoratePaypalLink(control);
    }

    /**
     * Verbindet einen Dialogbutton mit seinem schließenden Aktionswert.
     *
     * @param {HTMLButtonElement} control Vorbereiteter Button.
     * @param {ModalAction} action Entscheidung mit optionalem Rückgabewert.
     * @returns {void} Kein Rückgabewert.
     */
    configureButton(control, action) {
      control.type = 'button';
      control.addEventListener('click', () => this.dialog.close(action.value || 'cancel'));
    }
  };
})(window.LHUNDG_UI_PARTS);
