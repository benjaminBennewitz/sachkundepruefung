/* scripts/ui/select.js */

/**
 * @file Auswahlzustand und Bedienbindung eigener Select-Comboboxen.
 * @description Auswahlzustand und Bedienbindung eigener Select-Comboboxen.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  ui.CustomSelect = class CustomSelect extends ui.SelectView {
    /**
     * Verbindet Darstellung, Tastatur und Änderungsbeobachtung mit dem nativen Select-Modell.
     *
     * @param {HTMLSelectElement} select Vorhandenes Datenmodell der Auswahl.
     * @returns {CustomSelect} Vollständig bedienbare Combobox mit synchronisiertem Anfangswert.
     */
    constructor(select) {
      super(select);
      this.index = 0;                               // Vorläufige Auswahl folgt nach refresh() dem tatsächlichen Select-Wert.
      this.keyboard = new ui.SelectKeyboard(this);  // Eigene Tastaturzustände je Combobox.

      this.bind();     // Verbindet Auslöser und Änderungen des nativen Modells.
      this.refresh();  // Übernimmt Optionen, Auswahltext und Sperrzustand vor der ersten Bedienung.
    }

    /**
     * Verbindet Nutzeraktionen und beobachtbare Änderungen des nativen Datenmodells.
     *
     * @returns {void} Kein Rückgabewert.
     */
    bind() {
      this.trigger.addEventListener('click', () => (this.menu.hidden ? this.open() : this.close()));
      this.trigger.addEventListener('keydown', event => this.keyboard.onKey(event));
      this.select.addEventListener('change', () => this.refresh());
      new MutationObserver(() => this.refresh()).observe(this.select, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['disabled', 'label', 'selected']
      });
    }

    /**
     * Öffnet diese Combobox und schließt gegebenenfalls die bisher aktive Auswahl.
     *
     * @returns {void} Kein Rückgabewert.
     */
    open() {
      // Gesperrte oder leere Selects dürfen kein bedienbares Menü öffnen.
      if (this.trigger.disabled || !this.options.length) return;

      ui.activeSelect?.close();  // Es bleibt wie bisher höchstens ein Menü gleichzeitig geöffnet.
      this.revealTrigger();      // Hält den Auslöser vor der Menüpositionierung im sichtbaren Bereich.
      ui.activeSelect = this;
      this.index = Math.max(0, this.select.selectedIndex);
      this.showMenu();  // Übernimmt einen zulässigen Startindex und synchronisiert alle Offen-Zustände.
    }

    /**
     * Scrollt einen außerhalb des Viewports liegenden Auslöser nur knapp in den sichtbaren Bereich.
     *
     * @returns {void} Kein Rückgabewert.
     */
    revealTrigger() {
      const bounds = this.trigger.getBoundingClientRect();  // Aktuelle Lage des Auslösers vor dem Öffnen.

      // Sichtbare Auslöser benötigen keinen Seiten-Scroll.
      if (bounds.top < 0 || bounds.bottom > innerHeight) {
        this.trigger.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      }
    }

    /**
     * Aktiviert die sichtbaren und zugänglichen Offen-Zustände des vorbereiteten Menüs.
     *
     * @returns {void} Kein Rückgabewert.
     */
    showMenu() {
      // Ein gesperrter tatsächlicher Auswahlwert darf nicht der erste aktive Menüeintrag bleiben.
      if (this.options[this.index]?.disabled) this.move(1);

      this.menu.hidden = false;
      this.trigger.setAttribute('aria-expanded', 'true');
      this.root.classList.add('is-open');
      this.highlight();  // Kennzeichnet den anfänglich aktiven Nachfahren.
      this.position();   // Begrenzt das Menü auf den aktuellen Viewport.
    }

    /**
     * Schließt das Menü und entfernt den vorläufig aktiven ARIA-Nachfahren.
     *
     * @returns {void} Kein Rückgabewert.
     */
    close() {
      this.menu.hidden = true;
      this.trigger.setAttribute('aria-expanded', 'false');
      this.trigger.removeAttribute('aria-activedescendant');
      this.root.classList.remove('is-open');

      // Das Schließen einer anderen Instanz darf die gerade aktive Combobox nicht zurücksetzen.
      if (ui.activeSelect === this) ui.activeSelect = null;
    }

    /**
     * Verschiebt die vorläufige Auswahl zyklisch zur nächsten freigegebenen Option.
     *
     * @param {number} direction 1 für vorwärts oder -1 für rückwärts.
     * @returns {void} Kein Rückgabewert.
     */
    move(direction) {
      this.index = this.nextIndex(direction);  // Ohne freigegebenen Treffer bleibt die bisherige Auswahl erhalten.

      // Geschlossene Menüs benötigen noch keine sichtbare Hervorhebung.
      if (!this.menu.hidden) this.highlight();
    }

    /**
     * Übernimmt ausschließlich eine freigegebene Option in das native Datenmodell.
     *
     * @param {number} index Gewählter Index im unveränderten Optionsmodell.
     * @returns {void} Kein Rückgabewert.
     */
    choose(index) {
      const option = this.options[index];  // Tatsächlich angebotene Option mit ihrem aktuellen Sperrzustand.

      // Fehlende oder inzwischen gesperrte Einträge dürfen keinen Modellwert verändern.
      if (!option || option.disabled) return;

      const changed = this.select.value !== option.value;  // Ein change-Ereignis ist nur bei Wertwechsel nötig.

      this.select.value = option.value;
      this.close();    // Entfernt den vorläufigen Offen-Zustand vor dem Fokus-Rücksprung.
      this.refresh();  // Zeigt den neu bestätigten Wert einschließlich Auswahlmarkierung.
      this.trigger.focus({ preventScroll: true });

      // Unveränderte Auswahlen erzeugen weiterhin keine künstlichen Änderungsmeldungen.
      if (changed) this.select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    /**
     * Sucht zyklisch den nächsten freigegebenen Index ohne den Auswahlzustand zu verändern.
     *
     * @param {number} direction 1 für vorwärts oder -1 für rückwärts.
     * @returns {number} Nächster freigegebener oder unveränderter bisheriger Index.
     */
    nextIndex(direction) {
      const size = this.options.length;  // Höchstens ein Umlauf, auch wenn alle Optionen gesperrt sind.

      // Die Suche beginnt direkt hinter der vorläufig aktiven Option in Navigationsrichtung.
      for (let offset = 1; offset <= size; offset++) {
        const next = (this.index + direction * offset + size * 2) % size;  // Zyklischer Zielindex.

        // Der erste freigegebene Treffer beendet die Suche ohne Änderung des nativen Werts.
        if (!this.options[next].disabled) return next;
      }

      return this.index;
    }
  };
})(window.LHUNDG_UI_PARTS);
