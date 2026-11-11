/* scripts/ui/select-view.js */

/**
 * @file Darstellung, Beschriftung und Viewport-Position eigener Auswahlfelder.
 * @description Darstellung, Beschriftung und Viewport-Position eigener Auswahlfelder.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  ui.SelectView = class SelectView {
    /**
     * Baut die sichtbaren Teile um ein vorhandenes natives Select-Datenmodell auf.
     *
     * @param {HTMLSelectElement} select Vorhandenes Modell mit Optionen und Auswahlwert.
     * @returns {SelectView} Noch nicht mit Bedienereignissen verbundene Darstellung.
     */
    constructor(select) {
      this.select = select;  // Das native Element bleibt die einzige Quelle des ausgewählten Werts.

      this.createRoot();     // Erhält das native Modell verborgen innerhalb des sichtbaren Rahmens.
      this.createTrigger();  // Baut den fokussierbaren Combobox-Auslöser mit Wert und Pfeil.
      this.createMenu();     // Hängt die Listbox außerhalb möglicher überlaufender Container ein.
      this.bindLabel();      // Verknüpft die vorhandene Beschriftung mit dem neuen Auslöser.
    }

    /**
     * Übernimmt das native Select als verborgenes Datenmodell in einen sichtbaren Rahmen.
     *
     * @returns {void} Kein Rückgabewert.
     */
    createRoot() {
      this.root = ui.node('div', '', 'custom-select');  // Gemeinsamer Rahmen für Datenmodell und sichtbaren Auslöser.

      this.select.before(this.root);
      this.root.append(this.select);
      this.select.hidden = true;
      this.select.tabIndex = -1;
    }

    /**
     * Erstellt den zugänglichen Combobox-Auslöser mit separatem Auswahltext und Pfeil.
     *
     * @returns {void} Kein Rückgabewert.
     */
    createTrigger() {
      this.trigger = ui.node('button', '', 'select-trigger');  // Einziger regulärer Tastatur-Fokuspunkt des Selects.
      this.value = ui.node('span');                            // Sichtbarer Text folgt dem nativen selectedOptions-Eintrag.
      const arrow = ui.node('span', '', 'select-chevron');     // Dekorativer Pfeil ohne eigene Screenreader-Bedeutung.

      Object.assign(this.trigger, { type: 'button', id: `${this.select.id}-trigger` });
      this.value.id = `${this.select.id}-value`;
      this.configureTrigger();  // Hinterlegt die Combobox-Rolle und den zunächst geschlossenen Zustand.
      arrow.setAttribute('aria-hidden', 'true');
      this.trigger.append(this.value, arrow);
      this.root.append(this.trigger);
    }

    /**
     * Kennzeichnet den Auslöser als zunächst geschlossene Combobox mit Listbox-Menü.
     *
     * @returns {void} Kein Rückgabewert.
     */
    configureTrigger() {
      this.trigger.setAttribute('role', 'combobox');
      this.trigger.setAttribute('aria-haspopup', 'listbox');
      this.trigger.setAttribute('aria-expanded', 'false');
    }

    /**
     * Erstellt das gesondert positionierte Menü und verknüpft es mit seinem Auslöser.
     *
     * @returns {void} Kein Rückgabewert.
     */
    createMenu() {
      this.menu = ui.node('div', '', 'select-menu');  // Listbox liegt direkt im Body statt in einem beschnittenen Container.

      this.menu.id = `${this.select.id}-listbox`;
      this.menu.setAttribute('role', 'listbox');
      this.menu.hidden = true;
      document.body.append(this.menu);
      this.trigger.setAttribute('aria-controls', this.menu.id);
    }

    /**
     * Überträgt die vorhandene sichtbare Beschriftung auf Combobox und Listbox.
     *
     * @returns {void} Kein Rückgabewert.
     */
    bindLabel() {
      const label = [...document.querySelectorAll('label')].find(label => label.htmlFor === this.select.id);  // Explizit zugeordnetes ursprüngliches Label.

      // Ohne sichtbares Label bleibt die vorhandene ARIA-Beschriftung beziehungsweise Select-ID der Ersatz.
      if (!label) {
        this.trigger.setAttribute('aria-label', this.select.getAttribute('aria-label') || this.select.id);
        return;
      }

      label.htmlFor = this.trigger.id;
      label.id ||= `${this.select.id}-label`;
      this.caption = this.labelCaption(label);  // Nur direkter Labeltext, ohne Hilfesymbole.

      this.menu.setAttribute('aria-label', this.caption || 'Auswahl');
    }

    /**
     * Überträgt Optionen, Auswahltext und Deaktivierung aus dem nativen Select.
     *
     * @returns {void} Kein Rückgabewert.
     */
    refresh() {
      this.syncValue();  // Übernimmt nativen Wert, Optionsmodell und zugängliche Beschriftung.

      this.renderOptions();  // Baut die aktuellen sichtbaren Einträge aus dem Datenmodell neu auf.

      // Ein bereits offenes Menü muss Hervorhebung und Position nach Datenänderungen behalten.
      if (!this.menu.hidden) {
        this.highlight();
        this.position();
      }
    }

    /**
     * Ersetzt ausschließlich die sichtbaren Menüeinträge durch ihren aktuellen Datenstand.
     *
     * @returns {void} Kein Rückgabewert.
     */
    renderOptions() {
      const fragment = document.createDocumentFragment();  // Gemeinsames Einhängen vermeidet einzelne DOM-Ersetzungen.

      // Reihenfolge und IDs entsprechen weiterhin den Indizes des nativen Selects.
      this.options.forEach((option, index) => fragment.append(this.option(option, index)));

      this.menu.replaceChildren(fragment);
    }

    /**
     * Erstellt einen sichtbaren, zugänglich gekennzeichneten Menüeintrag.
     *
     * @param {HTMLOptionElement} option Native Option mit Text, Auswahl- und Sperrzustand.
     * @param {number} index Unveränderter Index innerhalb des Select-Modells.
     * @returns {HTMLElement} Verbundener Listbox-Eintrag.
     */
    option(option, index) {
      const item = ui.node('div', '', 'select-option');                         // Der Fokus bleibt am Combobox-Auslöser.
      const mark = ui.node('span', option.selected ? '✓' : '', 'option-mark');  // Dekoratives Kennzeichen der tatsächlichen Auswahl.

      item.id = `${this.select.id}-option-${index}`;
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(option.selected));
      mark.setAttribute('aria-hidden', 'true');
      item.append(ui.node('span', option.textContent), mark);
      this.bindOption(item, option, index);  // Sperrzustand und Auswahlverhalten werden getrennt verbunden.

      return item;
    }

    /**
     * Verhindert Fokusverlust und übernimmt ausschließlich freigegebene Optionen.
     *
     * @param {HTMLElement} item Sichtbarer Listbox-Eintrag.
     * @param {HTMLOptionElement} option Zugehörige native Option.
     * @param {number} index Index im unveränderten Select-Modell.
     * @returns {void} Kein Rückgabewert.
     */
    bindOption(item, option, index) {
      // Gesperrte Optionen bleiben sichtbar, sind aber weder per Maus noch Tastatur übernehmbar.
      if (option.disabled) item.setAttribute('aria-disabled', 'true');

      item.addEventListener('pointerdown', event => event.preventDefault());
      item.addEventListener('click', () => {
        // Ein nachträglich gesperrter Eintrag darf beim Klick ebenfalls nicht übernommen werden.
        if (!option.disabled) this.choose(index);
      });
    }

    /**
     * Berechnet die vorhandenen Begrenzungen und Aufklapprichtung innerhalb des Viewports.
     *
     * @returns {object} Position, Breite, Höhe und Aufklapprichtung des Menüs.
     */
    menuBounds() {
      const rect = this.trigger.getBoundingClientRect();                                          // Aktuelle Auslöserposition im sichtbaren Viewport.
      const inset = 12;                                                                           // Mindestabstand zu den Viewporträndern wie bisher.
      const viewportWidth = document.documentElement.clientWidth;                                 // Nutzbare Breite ohne Scrollbalken.
      const width = Math.max(0, Math.min(Math.max(rect.width, 230), viewportWidth - inset * 2));  // Menübreite mit bestehendem Mindestziel.
      const below = innerHeight - rect.bottom - inset;                                            // Verfügbarer Platz unter dem Auslöser.
      const above = rect.top - inset;                                                             // Verfügbarer Platz oberhalb des Auslösers.
      const upwards = below < 220 && above > below;                                               // Öffnet nur bei Platzmangel und mehr Raum nach oben.
      const height = Math.max(70, Math.min(310, upwards ? above - 8 : below - 8));                // Bestehende Höhengrenzen bleiben erhalten.

      return { rect, inset, viewportWidth, width, upwards, height };
    }

    /**
     * Wendet die begrenzte Menüposition ohne Änderung des eigentlichen Seitenlayouts an.
     *
     * @returns {void} Kein Rückgabewert.
     */
    position() {
      const { rect, inset, viewportWidth, width, upwards, height } = this.menuBounds();  // Gemeinsam berechnete Viewport-Grenzen.

      this.menu.style.width = `${width}px`;
      this.menu.style.maxHeight = `${height}px`;
      this.menu.style.left = `${Math.max(inset, Math.min(rect.left, viewportWidth - width - inset))}px`;
      this.menu.style.top = upwards ? 'auto' : `${Math.max(inset, rect.bottom + 6)}px`;
      this.menu.style.bottom = upwards ? `${innerHeight - rect.top + 6}px` : 'auto';
    }

    /**
     * Kennzeichnet den vorläufig aktiven Nachfahren und hält ihn innerhalb des Menüs sichtbar.
     *
     * @returns {void} Kein Rückgabewert.
     */
    highlight() {
      const option = this.menu.children[this.index];  // Vorläufig aktive Option, unabhängig von der bestätigten Auswahl.

      [...this.menu.children].forEach((item, index) => item.classList.toggle('is-active', index === this.index));

      // Leere Menüs besitzen keinen aktiven Nachfahren.
      if (!option) return;

      this.trigger.setAttribute('aria-activedescendant', option.id);
      this.revealOption(option);  // Scrollt ausschließlich innerhalb der Listbox.
    }

    /**
     * Verschiebt den Menü-Scrollbereich nur so weit, dass die aktive Option sichtbar bleibt.
     *
     * @param {HTMLElement} option Aktiver Listbox-Eintrag.
     * @returns {void} Kein Rückgabewert.
     */
    revealOption(option) {
      const top = option.offsetTop;              // Anfang des aktiven Eintrags im Menü.
      const bottom = top + option.offsetHeight;  // Ende des aktiven Eintrags im Menü.

      // Oberhalb beziehungsweise unterhalb abgeschnittene Einträge werden knapp eingeblendet.
      if (top < this.menu.scrollTop) this.menu.scrollTop = top;
      else if (bottom > this.menu.scrollTop + this.menu.clientHeight)
        this.menu.scrollTop = bottom - this.menu.clientHeight;
    }
    /**
     * Liest ausschließlich direkte Textknoten einer vorhandenen Select-Beschriftung.
     *
     * @param {HTMLLabelElement} label Ursprüngliches Label mit möglichen zusätzlichen Hilfesymbolen.
     * @returns {string} Getrimmter Beschriftungstext ohne untergeordnete Icons oder Hinweise.
     */
    labelCaption(label) {
      return [...label.childNodes]
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent)
        .join(' ')
        .trim();
    }

    /**
     * Gleicht sichtbaren Auswahlwert und Bedienzustand mit dem nativen Select-Modell ab.
     *
     * @returns {void} Kein Rückgabewert.
     */
    syncValue() {
      this.options = [...this.select.options];  // Aktuelle Optionen einschließlich programmatischer Änderungen.
      this.trigger.disabled = this.select.disabled;
      this.value.textContent = this.select.selectedOptions[0]?.textContent || 'Bitte auswählen';
      this.trigger.setAttribute('aria-label', `${this.caption ? this.caption + ': ' : ''}${this.value.textContent}`);

      // Ein geschlossenes Menü beginnt beim nächsten Öffnen wieder mit der tatsächlichen Auswahl.
      if (this.menu.hidden) this.index = Math.max(0, this.select.selectedIndex);
    }
  };
})(window.LHUNDG_UI_PARTS);
