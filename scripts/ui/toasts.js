/* scripts/ui/toasts.js */

/**
 * @file Warteschlange, Duplikatschutz und Live-Ankündigungen für Statusmeldungen.
 * @description Warteschlange, Duplikatschutz und Live-Ankündigungen für Statusmeldungen.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  /**
   * @typedef {object} ToastOptions
   * @property {'info'|'success'|'warning'|'error'} [type] Bedeutung und Darstellung.
   * @property {number} [duration] Anzeigezeit in Millisekunden; 0 bleibt bis zum Schließen.
   * @property {string} [key] Verhindert doppelte gleichzeitige Meldungen.
   */

  ui.Toasts = class Toasts {
    /**
     * Initialisiert Meldungsbereich, Warteschlange und getrennte Screenreader-Ankündigungen.
     *
     * @returns {Toasts} Steuerung mit zunächst leerer Warteschlange.
     */
    constructor() {
      this.active = new Map();                                                                             // Sichtbare Meldungen mit pausierbarer Restlaufzeit nach eindeutigem Schlüssel.
      this.pending = [];                                                                                   // Noch nicht sichtbare Meldungen in ihrer Eingangsreihenfolge.
      this.labels = { info: 'Info', success: 'Erledigt', warning: 'Wichtiger Hinweis', error: 'Fehler' };  // Gemeinsame Bedeutungsbeschriftungen.
      this.announcements = { polite: [], urgent: [] };                                                     // Getrennte Sammlung gleichzeitig eintreffender Ankündigungen.
      this.announcementPending = false;                                                                    // Verhindert mehrere parallele Animation-Frame-Aufträge.

      this.createRegions();  // Erstellt sichtbare Toasts und getrennte Live-Bereiche.
      document.addEventListener('visibilitychange', () => this.onVisibilityChange());
    }

    /**
     * Hängt den sichtbaren Bereich und beide unsichtbaren Live-Bereiche einmalig ein.
     *
     * @returns {void} Kein Rückgabewert.
     */
    createRegions() {
      this.region = ui.node('section', '', 'toast-region');  // Sichtbare Meldungen ohne Übernahme des Lernfokus.
      this.polite = this.liveRegion('status');               // Höfliche Ankündigung von Informationen und Erfolgen.
      this.urgent = this.liveRegion('alert');                // Dringliche Ankündigung von Warnungen und Fehlern.

      this.region.setAttribute('aria-label', 'Statusmeldungen');
      document.body.append(this.region, this.polite, this.urgent);
    }

    /**
     * Erstellt einen unsichtbaren, atomar vorgelesenen Screenreader-Bereich.
     *
     * @param {string} role status für höfliche oder alert für dringliche Ankündigungen.
     * @returns {HTMLElement} Noch nicht eingehängter Live-Bereich.
     */
    liveRegion(role) {
      const region = ui.node('div', '', 'sr-only');  // Ausschließlich für assistive Technik sichtbare Meldung.

      region.setAttribute('role', role);
      region.setAttribute('aria-atomic', 'true');

      return region;
    }

    /**
     * Nimmt eine neue Meldung auf und verhindert gleichzeitige Duplikate.
     *
     * @param {string} message Sicher auszugebender Meldungstext.
     * @param {ToastOptions} [options] Bedeutung, Sichtbarkeitsdauer und optionaler Schlüssel.
     * @returns {void} Kein Rückgabewert.
     */
    show(message, options = {}) {
      const type = Object.hasOwn(this.labels, options.type) ? options.type : 'info';  // Unbekannte Typen bleiben neutrale Infos.
      const key = options.key || `${type}:${message}`;                                // Identität gilt für sichtbare und wartende Meldungen.

      // Ein bereits sichtbarer oder wartender Schlüssel erzeugt keine zweite Meldung.
      if (this.active.has(key) || this.pending.some(entry => entry.key === key)) return;

      const duration = options.duration ?? (type === 'warning' || type === 'error' ? 0 : 8000);  // Warnungen und Fehler bleiben standardmäßig stehen.

      this.pending.push({ message, type, key, duration, origin: document.activeElement });
      this.drain();  // Zeigt die Meldung unmittelbar, sofern einer der drei Plätze frei ist.
    }

    /**
     * Füllt die sichtbaren Plätze in Eingangsreihenfolge mit höchstens drei Meldungen.
     *
     * @returns {void} Kein Rückgabewert.
     */
    drain() {
      // Zusätzliche Meldungen bleiben in der Warteschlange, bis ein sichtbarer Toast geschlossen wird.
      while (this.active.size < 3 && this.pending.length) {
        const entry = this.pending.shift();           // Älteste noch nicht sichtbare Meldung.
        const toast = new ui.ToastItem(this, entry);  // Eigener pausierbarer Lebenszyklus für genau diese Meldung.

        this.active.set(entry.key, toast);
        this.region.append(toast.element);
        this.announce(
          `${this.labels[entry.type]}: ${entry.message}`,
          entry.type === 'error' || entry.type === 'warning'
        );
        toast.resume();  // Startet nur bei begrenzter Dauer und sichtbarem, unbedientem Toast.
      }
    }

    /**
     * Bündelt gleichzeitig eintreffende Meldungen für vollständige Live-Ankündigungen.
     *
     * @param {string} message Fertiger Meldungstext einschließlich Bedeutung.
     * @param {boolean} assertive Ob eine dringliche Ankündigung erforderlich ist.
     * @returns {void} Kein Rückgabewert.
     */
    announce(message, assertive) {
      this.announcements[assertive ? 'urgent' : 'polite'].push(message);

      // Ein geplanter Frame übernimmt bereits alle bis dahin eintreffenden Meldungen.
      if (this.announcementPending) return;

      this.announcementPending = true;
      this.polite.textContent = '';
      this.urgent.textContent = '';
      requestAnimationFrame(() => this.flushAnnouncements());
    }

    /**
     * Übergibt die gesammelten Texte getrennt an beide Live-Bereiche.
     *
     * @returns {void} Kein Rückgabewert.
     */
    flushAnnouncements() {
      this.polite.textContent = this.announcements.polite.splice(0).join(' ');
      this.urgent.textContent = this.announcements.urgent.splice(0).join(' ');
      this.announcementPending = false;
    }

    /**
     * Pausiert alle sichtbaren Meldungen im verdeckten Tab und setzt sie bei Rückkehr fort.
     *
     * @returns {void} Kein Rückgabewert.
     */
    onVisibilityChange() {
      // Die einzelne Meldung berücksichtigt beim Fortsetzen zusätzlich Maus- und Tastaturkontakt.
      for (const toast of this.active.values()) document.hidden ? toast.pause() : toast.resume();
    }
  };
})(window.LHUNDG_UI_PARTS);
