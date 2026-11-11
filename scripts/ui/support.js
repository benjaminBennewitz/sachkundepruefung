/* scripts/ui/support.js */

/**
 * @file Freiwilliger Unterstützungsdialog und validierte PayPal-Verweise.
 * @description Freiwilliger Unterstützungsdialog und validierte PayPal-Verweise.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  ui.Support = class Support {
    /**
     * Bereitet die vorhandene Unterstützungsfunktion mit ihrem bisherigen Sitzungsschlüssel vor.
     *
     * @param {Modal} modal Gemeinsam verwendete Modal-Steuerung.
     * @returns {Support} Steuerung mit erkanntem Link- und Sitzungsstatus.
     */
    constructor(modal) {
      this.modal = modal;                                    // Unterstützungsdialoge verwenden dieselbe Warteschlange wie Bestätigungen.
      this.paypalUrl = window.SITE_CONFIG?.paypalUrl || '';  // Optionaler zentraler Konfigurationswert.
      this.validPaypal = this.checkPaypal();                 // Nur bekannte HTTPS-PayPal-Ziele werden sichtbar gemacht.
      this.shown = this.readShown();                         // Automatische Anzeige bleibt auf eine Anzeige je Sitzung begrenzt.
      this.pending = false;                                  // Verhindert gleichzeitig eingereihte Unterstützungsdialoge.
    }

    /**
     * Erkennt einen gültigen optionalen PayPal-Link ohne Netzwerkabruf.
     *
     * @returns {boolean} Ob das konfigurierte Ziel zu den unterstützten HTTPS-Hosts gehört.
     */
    checkPaypal() {
      try {
        const url = new URL(this.paypalUrl);                                           // Vollständiges URL-Parsing statt einer unsicheren Teilstringprüfung.
        const hosts = ['paypal.com', 'www.paypal.com', 'paypal.me', 'www.paypal.me'];  // Bisher zugelassene Zielhosts.

        return url.protocol === 'https:' && hosts.includes(url.hostname);
      } catch {
        return false;
      }
    }

    /**
     * Liest die bisherige automatische Anzeige, ohne gesperrten Browserspeicher vorauszusetzen.
     *
     * @returns {boolean} Ob in dieser Sitzung bereits ein Unterstützungsdialog vermerkt wurde.
     */
    readShown() {
      try {
        return sessionStorage.getItem('lhundg-support-shown-v1') === '1';
      } catch {
        return false;
      }
    }

    /**
     * Vermerkt eine Anzeige im Arbeitsspeicher und nach Möglichkeit im Sitzungsspeicher.
     *
     * @returns {void} Kein Rückgabewert.
     */
    markShown() {
      this.pending = true;
      this.shown = true;

      try {
        sessionStorage.setItem('lhundg-support-shown-v1', '1');
      } catch {
        // Auch ohne Sitzungsspeicher verhindert der aktive Arbeitsspeicher doppelte automatische Anzeigen.
      }
    }

    /**
     * Aktiviert gültige Footer-Links und verbindet die vorhandenen Dialogauslöser.
     *
     * @returns {void} Kein Rückgabewert.
     */
    bind() {
      // Ohne gültigen Link bleiben die vorhandenen Unterstützungshinweise erhalten.
      for (const link of document.querySelectorAll('[data-paypal]')) this.configureLink(link);

      // Der Platzhalter erscheint ausschließlich solange noch kein gültiger PayPal-Link vorliegt.
      for (const hint of document.querySelectorAll('[data-support-pending]')) hint.hidden = this.validPaypal;

      // Alle vorhandenen Auslöser verwenden weiterhin den öffentlichen, manuell aufrufbaren Dialog.
      for (const button of document.querySelectorAll('[data-open-support]')) {
        button.addEventListener('click', () => window.openSupportDialog());
      }
    }

    /**
     * Aktiviert einen vorhandenen Unterstützungslink nur bei gültigem Konfigurationsziel.
     *
     * @param {HTMLAnchorElement} link Vorhandener, zunächst optional verborgener Footer-Link.
     * @returns {void} Kein Rückgabewert.
     */
    configureLink(link) {
      // Ungültige oder noch fehlende Zahlungsziele dürfen nicht eingeblendet werden.
      if (!this.validPaypal) return;

      link.href = this.paypalUrl;
      link.hidden = false;
      ui.decoratePaypalLink(link);
    }

    /**
     * Öffnet die freiwillige Unterstützung mit dem bisherigen Schutz vor Mehrfachaufrufen.
     *
     * @param {object} [options] Aufrufkontext.
     * @param {boolean} [options.automatic] Höchstens einmal pro Sitzung automatisch öffnen.
     * @param {HTMLElement} [options.returnFocus] Rücksprungziel nach dem Schließen.
     * @returns {Promise<void>} Abschluss nach Schließen oder unmittelbar bei einem übersprungenen Aufruf.
     */
    async open({ automatic = false, returnFocus = document.activeElement } = {}) {
      // Bereits wartende Dialoge und wiederholte automatische Anzeigen werden ausgelassen.
      if (this.pending || (automatic && this.shown)) return;

      this.markShown();  // Markiert den Aufruf bereits vor dem Einreihen in die Modal-Warteschlange.

      try {
        await this.modal.open(this.options(automatic, returnFocus));
      } finally {
        this.pending = false;
      }
    }

    /**
     * Stellt unveränderte Texte und Aktionen des freiwilligen Unterstützungsdialogs zusammen.
     *
     * @param {boolean} automatic Ob der Aufruf vom Testergebnis statt vom Nutzer ausgelöst wurde.
     * @param {HTMLElement} returnFocus Rücksprungziel nach dem Schließen.
     * @returns {ModalOptions} Optionen für die gemeinsame Modal-Komponente.
     */
    options(automatic, returnFocus) {
      return {
        title: 'Lernen soll kostenlos bleiben.',
        eyebrow: 'FREIWILLIG. OHNE WERBUNG.',
        message:
          'Hier gibt es bewusst keine Werbung: Du sollst in Ruhe lernen und dich konzentrieren können. Für Server und Bereitstellung entstehen trotzdem laufende Kosten. Wenn dir die Lernhilfe etwas bringt, freue ich mich über eine kleine Unterstützung. Alles bleibt auch ohne Beitrag kostenlos. Danke, dass du dabei bist!',
        note: this.validPaypal
          ? 'Externer Zahlungsdienst · Keine Spendenbescheinigung · Kein Kauf zusätzlicher Funktionen.'
          : 'Der persönliche PayPal-Link wird noch ergänzt. Du kannst die Lernhilfe uneingeschränkt nutzen.',
        actions: this.actions(automatic),
        returnFocus
      };
    }

    /**
     * Erstellt die bisherige PayPal-Aktion und die zum Aufruf passende Rückkehraktion.
     *
     * @param {boolean} automatic Ob die Rückkehr zum Testergebnis beschriftet werden soll.
     * @returns {ModalAction[]} Sichtbare Aktionen in ihrer bisherigen Reihenfolge.
     */
    actions(automatic) {
      const actions = [];  // Ohne gültigen Zahlungslink bleibt ausschließlich die Rückkehraktion erhalten.

      // Unterstützung bleibt optional und wird nur mit gültigem Ziel angeboten.
      if (this.validPaypal)
        actions.push({ label: 'Mit PayPal unterstützen', href: this.paypalUrl, primary: true, paypal: true });

      actions.push({ label: automatic ? 'Zum Ergebnis' : 'Weiterlernen', value: 'cancel', autofocus: true });

      return actions;
    }
  };
})(window.LHUNDG_UI_PARTS);
