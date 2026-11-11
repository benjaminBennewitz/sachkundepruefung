/* scripts/ui/select-keyboard.js */

/**
 * @file Tastatursteuerung und Anfangsbuchstabensuche eigener Auswahlfelder.
 * @description Tastatursteuerung und Anfangsbuchstabensuche eigener Auswahlfelder.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  /**
   * Normalisiert Suchbuchstaben unabhängig von Großschreibung und Umlauten.
   *
   * @param {string} value Tastatureingabe oder sichtbarer Optionstext.
   * @returns {string} Deutsche Kleinschreibung ohne kombinierende Akzentzeichen.
   */
  function normalize(value) {
    return value
      .toLocaleLowerCase('de')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  ui.SelectKeyboard = class SelectKeyboard {
    /**
     * Trennt die Tastaturzustände von Darstellung und nativem Select-Datenmodell.
     *
     * @param {object} control Zugehöriges CustomSelect mit Navigation und Auswahlübernahme.
     * @returns {SelectKeyboard} Tastatursteuerung mit zunächst leerer Buchstabensuche.
     */
    constructor(control) {
      this.control = control;  // Einziger zu steuernder Combobox-Auslöser mit seinem Menü.
      this.query = '';         // Aktuelle Anfangsbuchstabensuche innerhalb des 700-ms-Zeitfensters.
      this.queryTimer = null;  // Setzt ausschließlich die Buchstabensuche nach Inaktivität zurück.
      // Bekannte Tasten mit ihrer jeweiligen Aufgabe.
      this.handlers = {
        Tab: 'closeTab',
        Escape: 'closeEscape',
        ArrowDown: 'moveArrow',
        ArrowUp: 'moveArrow',
        Home: 'moveEdge',
        End: 'moveEdge',
        Enter: 'selectCurrent',
        ' ': 'selectCurrent'
      };
    }

    /**
     * Leitet ausschließlich unmodifizierte Bedien- und Zeichentasten an ihre Aufgabe weiter.
     *
     * @param {KeyboardEvent} event Tastaturereignis am Combobox-Auslöser.
     * @returns {void} Kein Rückgabewert.
     */
    onKey(event) {
      // Betriebssystem- und Browserkombinationen müssen ihre ursprüngliche Wirkung behalten.
      if (event.altKey || event.ctrlKey || event.metaKey) return;

      const handler = Object.hasOwn(this.handlers, event.key) ? this.handlers[event.key] : null;  // Nur ausdrücklich zugeordnete Bedienaktionen.

      // Andere einzelne Zeichen gehören zur Anfangsbuchstabensuche; Sondertasten bleiben unbehandelt.
      if (handler) this[handler](event);
      else if (event.key.length === 1) this.search(event);
    }

    /**
     * Unterbindet die Seitenaktion einer ausschließlich innerhalb der Combobox verwendeten Taste.
     *
     * @param {KeyboardEvent} event Bereits als Combobox-Bedienung erkanntes Ereignis.
     * @returns {void} Kein Rückgabewert.
     */
    consume(event) {
      event.preventDefault();
      event.stopPropagation();
    }

    /**
     * Schließt das Menü und lässt den regulären Tab-Fokuswechsel unverändert zu.
     *
     * @returns {void} Kein Rückgabewert.
     */
    closeTab() {
      this.control.close();
    }

    /**
     * Verarbeitet Escape nur bei einem tatsächlich geöffneten Menü.
     *
     * @param {KeyboardEvent} event Escape-Ereignis am Combobox-Auslöser.
     * @returns {void} Kein Rückgabewert.
     */
    closeEscape(event) {
      // Ein geschlossenes Menü darf Escape nicht für andere Oberflächenfunktionen abfangen.
      if (this.control.menu.hidden) return;

      this.consume(event);
      this.control.close();
    }

    /**
     * Öffnet das Menü oder verschiebt eine bereits sichtbare vorläufige Auswahl.
     *
     * @param {KeyboardEvent} event ArrowDown oder ArrowUp.
     * @returns {void} Kein Rückgabewert.
     */
    moveArrow(event) {
      this.consume(event);

      // Der erste Pfeildruck öffnet wie bisher nur bei der tatsächlichen Auswahl.
      if (this.control.menu.hidden) this.control.open();
      else this.control.move(event.key === 'ArrowDown' ? 1 : -1);
    }

    /**
     * Wählt die erste beziehungsweise letzte freigegebene Option vorläufig aus.
     *
     * @param {KeyboardEvent} event Home oder End.
     * @returns {void} Kein Rückgabewert.
     */
    moveEdge(event) {
      this.consume(event);

      // Die Randnavigation ist auch bei ursprünglich geschlossenem Menü verfügbar.
      if (this.control.menu.hidden) this.control.open();

      this.control.index = event.key === 'Home' ? 0 : this.control.options.length - 1;

      // Gesperrte Randoptionen werden in Richtung des Menüinneren übersprungen.
      if (this.control.options[this.control.index]?.disabled) this.control.move(event.key === 'Home' ? 1 : -1);

      this.control.highlight();
    }

    /**
     * Öffnet ein geschlossenes Menü oder bestätigt dessen vorläufig aktive Option.
     *
     * @param {KeyboardEvent} event Enter oder Leertaste.
     * @returns {void} Kein Rückgabewert.
     */
    selectCurrent(event) {
      this.consume(event);

      // Der erste Druck öffnet, der nächste übernimmt den aktiven Eintrag.
      if (this.control.menu.hidden) this.control.open();
      else this.control.choose(this.control.index);
    }

    /**
     * Ergänzt die Buchstabensuche und hebt die erste dazu passende freigegebene Option hervor.
     *
     * @param {KeyboardEvent} event Einzelnes Suchzeichen.
     * @returns {void} Kein Rückgabewert.
     */
    search(event) {
      this.consume(event);
      this.updateQuery(event.key);  // Wiederholte gleiche Buchstaben wechseln zyklisch zwischen passenden Optionen.

      // Die Suche öffnet bei Bedarf das Menü ohne eine Auswahl bereits zu bestätigen.
      if (this.control.menu.hidden) this.control.open();

      this.findMatch();  // Sucht ab dem zur aktuellen Buchstabenfolge passenden Startpunkt.
    }

    /**
     * Aktualisiert die Suchfolge und erneuert ihr bisheriges 700-ms-Zeitfenster.
     *
     * @param {string} key Einzelnes gedrücktes Suchzeichen.
     * @returns {void} Kein Rückgabewert.
     */
    updateQuery(key) {
      this.query += normalize(key);

      // Mehrfach derselbe Buchstabe bedeutet zyklisches Suchen statt einer längeren Zeichenfolge.
      if (this.query.length > 1 && [...this.query].every(char => char === this.query[0])) this.query = this.query[0];

      clearTimeout(this.queryTimer);
      this.queryTimer = setTimeout(() => {
        this.query = '';
      }, 700);
    }

    /**
     * Durchsucht die Optionen zyklisch und überspringt gesperrte oder nicht passende Einträge.
     *
     * @returns {void} Kein Rückgabewert.
     */
    findMatch() {
      const start = this.query.length === 1 ? this.control.index + 1 : 0;  // Ein Buchstabe sucht hinter dem aktiven Eintrag weiter.

      // Höchstens ein vollständiger Umlauf verhindert Endlosschleifen bei fehlenden Treffern.
      for (let offset = 0; offset < this.control.options.length; offset++) {
        const index = (start + offset) % this.control.options.length;  // Zyklischer Index im ursprünglichen Optionsmodell.
        const option = this.control.options[index];                    // Originaltext und Sperrzustand bleiben die Suchgrundlage.

        // Nur freigegebene Optionen mit passendem normalisiertem Anfang dürfen aktiv werden.
        if (!option.disabled && normalize(option.textContent.trim()).startsWith(this.query)) {
          this.control.index = index;
          this.control.highlight();
          break;
        }
      }
    }
  };
})(window.LHUNDG_UI_PARTS);
