/* scripts/ui/toast-item.js */

/**
 * @file Darstellung und pausierbare Lebensdauer einer einzelnen Statusmeldung.
 * @description Darstellung und pausierbare Lebensdauer einer einzelnen Statusmeldung.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  ui.ToastItem = class ToastItem {
    /**
     * Initialisiert den Lebenszyklus einer einzelnen sichtbaren Statusmeldung.
     *
     * @param {object} manager Gemeinsame Warteschlange und Live-Ankündigungen.
     * @param {object} entry Meldung mit Typ, Schlüssel, Dauer und ursprünglichem Auslöser.
     * @returns {ToastItem} Noch nicht eingehängte Statusmeldung.
     */
    constructor(manager, entry) {
      this.manager = manager;           // Gemeinsame Steuerung für Warteschlange und Fokus-Rückgabe.
      this.entry = entry;               // Unveränderte Meldung einschließlich ursprünglichem Auslöser.
      this.timer = undefined;           // Ein laufendes Zeitlimit existiert erst nach resume().
      this.remaining = entry.duration;  // Restlaufzeit, die bei jeder Pause erhalten bleibt.
      this.started = 0;                 // Beginn des zuletzt gestarteten Zeitabschnitts.
      this.hovered = false;             // Mausbedienung pausiert ein automatisches Schließen.
      this.focused = false;             // Tastaturbedienung pausiert unabhängig von der Maus.
      this.element = this.build();      // Sicher aufgebautes Toast-Element mit Schließen-Button.

      this.bind();  // Aktiviert Zeitpausen und manuelles Schließen erst nach dem DOM-Aufbau.
    }

    /**
     * Baut den sichtbaren Meldungsinhalt mit dem vorhandenen Statuslayout auf.
     *
     * @returns {HTMLElement} Noch nicht eingehängtes Toast-Element.
     */
    build() {
      const toast = ui.node('div', '', `ui-toast ui-toast--${this.entry.type}`);  // Typ bestimmt die bestehende Zustandsdarstellung.
      const content = ui.node('div');                                             // Getrennter Textbereich vor dem Schließen-Button.
      const label = this.manager.labels[this.entry.type];                         // Sichtbare Bedeutung derselben Meldung.

      content.append(ui.node('strong', label), ui.node('p', this.entry.message));
      toast.append(content, this.closeButton(label));

      return toast;
    }

    /**
     * Erstellt den separat beschrifteten Schließen-Button einer Meldung.
     *
     * @param {string} label Bedeutung der Statusmeldung.
     * @returns {HTMLButtonElement} Zugänglich beschrifteter Button.
     */
    closeButton(label) {
      const close = ui.node('button', '×', 'toast-close');  // Rein textbasiertes Zeichen ohne Icon-Abhängigkeit.

      close.type = 'button';
      close.setAttribute('aria-label', `${label} schließen`);
      close.addEventListener('click', () => this.dismiss());

      return close;
    }

    /**
     * Verbindet Maus- und Tastaturkontakt mit dem pausierbaren Zeitlimit.
     *
     * @returns {void} Kein Rückgabewert.
     */
    bind() {
      this.element.addEventListener('pointerenter', () => {
        this.hovered = true;
        this.pause();
      });
      this.element.addEventListener('pointerleave', () => {
        this.hovered = false;
        this.resume();
      });
      this.element.addEventListener('focusin', () => {
        this.focused = true;
        this.pause();
      });
      this.element.addEventListener('focusout', event => this.onFocusOut(event));
    }

    /**
     * Startet das Zeitlimit erst wieder, wenn der Fokus die gesamte Meldung verlassen hat.
     *
     * @param {FocusEvent} event Fokuswechsel mit dem nachfolgenden Zielelement.
     * @returns {void} Kein Rückgabewert.
     */
    onFocusOut(event) {
      this.focused = this.element.contains(event.relatedTarget);

      // Fokuswechsel innerhalb derselben Meldung darf ihre Pause nicht aufheben.
      if (!this.focused) this.resume();
    }

    /**
     * Stoppt ein laufendes Zeitlimit und erhält dessen noch verfügbare Restzeit.
     *
     * @returns {void} Kein Rückgabewert.
     */
    pause() {
      // Ohne laufenden Timer darf die verbleibende Zeit nicht erneut verkürzt werden.
      if (this.timer === undefined) return;

      clearTimeout(this.timer);
      this.timer = undefined;
      this.remaining = Math.max(0, this.remaining - (Date.now() - this.started));
    }

    /**
     * Setzt ausschließlich zeitbegrenzte und aktuell nicht bediente Meldungen fort.
     *
     * @returns {void} Kein Rückgabewert.
     */
    resume() {
      // Dauer 0 bleibt bestehen; Maus, Tastatur und ein verdeckter Tab pausieren den Ablauf.
      if (!this.entry.duration || this.timer !== undefined || this.hovered || this.focused || document.hidden) return;

      this.started = Date.now();
      this.timer = setTimeout(() => this.dismiss(), this.remaining);
    }

    /**
     * Entfernt die Meldung und gibt ihren Platz sowie gegebenenfalls den Tastaturfokus frei.
     *
     * @returns {void} Kein Rückgabewert.
     */
    dismiss() {
      const hadFocus = this.element.contains(document.activeElement);  // Fokus-Rückgabe ist nur nach Tastaturbedienung nötig.

      this.pause();  // Verhindert ein späteres zweites Entfernen durch denselben Timer.
      this.manager.active.delete(this.entry.key);
      this.element.remove();
      this.manager.drain();  // Füllt einen freigewordenen Platz aus der Warteschlange auf.

      // Neu erscheinende Meldungen erhalten nur nach explizitem Schließen den bisherigen Toast-Fokus.
      if (hadFocus) this.restoreFocus();
    }

    /**
     * Gibt den Fokus an den nächsten Toast-Button oder den ursprünglichen Auslöser zurück.
     *
     * @returns {void} Kein Rückgabewert.
     */
    restoreFocus() {
      const target = this.manager.region.querySelector('button') || this.entry.origin;  // Verbleibende Meldung hat Vorrang.

      // Ein inzwischen entferntes Ursprungselement ist kein zulässiges Fokusziel mehr.
      if (target?.isConnected) target.focus({ preventScroll: true });
    }
  };
})(window.LHUNDG_UI_PARTS);
