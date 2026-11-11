/* scripts/ui/shared.js */

/**
 * @file Gemeinsame sichere DOM-Helfer und Farbschema-Schalter.
 * @description Gemeinsame sichere DOM-Helfer und Farbschema-Schalter.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  /**
   * Erstellt ein UI-Element ausschließlich aus Text und einer optionalen CSS-Klasse.
   *
   * @param {string} tag HTML-Elementname.
   * @param {string} [text] Sicherer Textinhalt ohne HTML-Interpolation.
   * @param {string} [className] Vorhandene Klassen aus dem Designsystem.
   * @returns {HTMLElement} Noch nicht eingehängtes Element.
   */
  function node(tag, text = '', className = '') {
    const element = document.createElement(tag);  // Neues Element ohne Zugriff auf HTML-Parser.

    element.textContent = text;
    element.className = className;

    return element;
  }

  /**
   * Ergänzt das lokale PayPal-Zeichen, ohne Linktext oder Ziel zu verändern.
   *
   * @param {HTMLAnchorElement} link Unterstützungslink im Footer oder Modal.
   * @returns {void} Kein Rückgabewert.
   */
  function decoratePaypalLink(link) {
    // Bereits dekorierte Links dürfen kein zweites Icon erhalten.
    if (link.querySelector('.paypal-icon')) return;

    const icon = node('img', '', 'paypal-icon');  // Dekoratives Icon mit bewusst leerem Alternativtext.

    Object.assign(icon, { src: 'assets/icons/paypal.svg', alt: '', width: 24, height: 24 });
    icon.setAttribute('aria-hidden', 'true');
    link.classList.add('paypal-button');
    link.prepend(icon);
  }

  /**
   * Gleicht den tatsächlich aktiven Farbmodus mit Button und zugänglicher Beschriftung ab.
   *
   * @returns {void} Kein Rückgabewert.
   */
  function updateThemeButton() {
    const toggle = document.querySelector('#themeToggle');                                            // Optionaler Farbschalter der aktuellen Root-Seite.
    const theme = document.documentElement.dataset.theme;                                             // Gespeicherte Auswahl oder fehlender Wert für den Systemmodus.
    const dark = theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches);  // Tatsächlich aktive Darstellung.

    document.documentElement.dataset.activeTheme = dark ? 'dark' : 'light';
    toggle?.setAttribute('aria-label', dark ? 'Helles Farbschema aktivieren' : 'Dunkles Farbschema aktivieren');

    // Seiten ohne Farbschalter benötigen keinen sichtbaren Tooltip-Abgleich.
    if (toggle) toggle.querySelector('.tool-tip').textContent = dark ? 'Hell einschalten' : 'Dunkel einschalten';
  }

  /**
   * Wechselt die explizite Farbwahl und erhält sie nach Möglichkeit im Browserspeicher.
   *
   * @returns {void} Kein Rückgabewert.
   */
  function toggleTheme() {
    const theme = document.documentElement.dataset.activeTheme === 'dark' ? 'light' : 'dark';  // Gegenstück zum aktuell sichtbaren Modus.

    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem('lhundg-theme-v1', theme);
    } catch {
      // Ein gesperrter Speicher verhindert nur die dauerhafte Sicherung, nicht den Farbwechsel.
    }

    updateThemeButton();  // Hält Tooltip und Screenreader-Beschriftung unmittelbar synchron.
  }

  /**
   * Verbindet Farbwahl und Systemänderungen mit dem vorhandenen Farbschalter.
   *
   * @returns {void} Kein Rückgabewert.
   */
  function bindTheme() {
    const toggle = document.querySelector('#themeToggle');  // Auf Seiten ohne Schalter bleibt die Bindung optional.

    updateThemeButton();  // Initialisiert den aktiven Farbmodus vor weiteren UI-Aktionen.
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeButton);
    toggle?.addEventListener('click', toggleTheme);
  }

  /**
   * Verbindet einen nativen Aufklappbereich mit einer unterbrechbaren Höhenanimation.
   */
  class DetailsMotion {
    /**
     * Erhält native Semantik und verbindet Maus-/Tastaturklicks am vorhandenen Summary.
     *
     * @param {HTMLDetailsElement} element Vorhandener Aufklappbereich einer Root-Seite.
     * @returns {DetailsMotion} Steuerung ohne veränderten anfänglichen Offen-Zustand.
     */
    constructor(element) {
      this.element = element;                                    // Der bestehende native Aufklappbereich bleibt die Inhaltsquelle.
      this.summary = element.querySelector(':scope > summary');  // Ausschließlich der eigene Auslöser, keine verschachtelten Bereiche.
      // Laufende Höhe kann bei schnellen Gegenklicks am sichtbaren Zwischenstand weitergeführt werden.
      this.animation = null;
      this.targetOpen = element.open;  // Gewünschter Endzustand unabhängig vom während des Schließens offenen Nativelement.

      this.summary?.addEventListener('click', event => this.onClick(event));
      element.addEventListener('toggle', () => this.onToggle());
    }

    /**
     * Fängt ausschließlich die normale Bedienung des eigenen Summary-Auslösers ab.
     *
     * @param {MouseEvent} event Klick einschließlich nativ erzeugter Tastaturklicks.
     * @returns {void} Kein Rückgabewert.
     */
    onClick(event) {
      // Links und andere interaktive Summary-Inhalte behalten ihr eigenes Verhalten.
      if (event.defaultPrevented || event.button !== 0 || event.target.closest('a, button, input, select, textarea'))
        return;

      const current = this.animation ? this.targetOpen : this.element.open;  // Externe Zustandswechsel gelten auch vor einem noch ausstehenden Toggle-Ereignis.

      event.preventDefault();
      this.toggle(!current);  // Wiederholte Klicks kehren die laufende Animation um.
    }

    /**
     * Übernimmt externe Zustandswechsel wie responsive Testoptionen oder native Ankeröffnung.
     *
     * @returns {void} Kein Rückgabewert.
     */
    onToggle() {
      // Native Toggle-Ereignisse während der eigenen Animation dürfen deren Endziel nicht überschreiben.
      if (!this.animation) this.targetOpen = this.element.open;
    }

    /**
     * Wechselt den nativen Zustand mit Animation oder unmittelbar bei reduzierter Bewegung.
     *
     * @param {boolean} opening Gewünschter endgültiger Offen-Zustand.
     * @returns {void} Kein Rückgabewert.
     */
    toggle(opening) {
      const from = this.element.getBoundingClientRect().height;                // Sichtbarer Zwischenstand vor dem Abbruch einer vorherigen Animation.
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;  // Aktuelle Systempräferenz wird bei jeder Bedienung neu gelesen.

      this.animation?.cancel();
      this.animation = null;
      this.targetOpen = opening;

      // Ohne Animations-API oder bei reduzierter Bewegung bleibt die native Bedienung unmittelbar.
      if (reduced || !this.element.animate) {
        this.finish();
        return;
      }

      this.animate(from, this.targetHeight(opening));  // Misst beide nativen Zustände ohne feste oder geschätzte Maximalhöhe.
    }

    /**
     * Misst die echte Zielhöhe mit denselben nativen Styles wie der endgültige Zustand.
     *
     * @param {boolean} opening Gewünschter endgültiger Offen-Zustand.
     * @returns {number} Zielhöhe einschließlich bestehender Ränder und Abstände.
     */
    targetHeight(opening) {
      this.element.open = opening;
      const height = this.element.getBoundingClientRect().height;  // Geschlossener Summary oder vollständiger, auch verschachtelter Inhalt.

      this.element.open = true;  // Schließender Inhalt bleibt bis zum Ende der Animation sichtbar.

      return height;
    }

    /**
     * Animiert ausschließlich die Höhe und schließt danach den nativen Zustandswechsel ab.
     *
     * @param {number} from Sichtbare Ausgangshöhe in Pixeln.
     * @param {number} to Gemessene Zielhöhe in Pixeln.
     * @returns {void} Kein Rückgabewert.
     */
    animate(from, to) {
      this.element.classList.add('details-animating');
      this.animation = this.element.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: 240,
        easing: 'cubic-bezier(.2,.65,.3,1)',
        fill: 'both'
      });
      this.animation.onfinish = () => this.finish();
    }

    /**
     * Räumt eine Animation auf und stellt den tatsächlichen nativen Endzustand her.
     *
     * @returns {void} Kein Rückgabewert.
     */
    finish() {
      const animation = this.animation;  // Zuerst lösen, damit ein Toggle-Ereignis den aktuellen Endzustand erkennen kann.

      this.animation = null;
      animation?.cancel();
      this.element.open = this.targetOpen;
      this.element.classList.remove('details-animating');
    }
  }

  /**
   * Ergänzt sämtliche vorhandenen nativen Aufklappbereiche ohne zusätzliche Inhaltsvorlagen.
   *
   * @returns {void} Kein Rückgabewert.
   */
  function bindDetails() {
    // Auch verschachtelte Bereiche besitzen jeweils ihren eigenen Summary und Animationszustand.
    for (const element of document.querySelectorAll('details')) new DetailsMotion(element);
  }

  // Interne Bausteine werden in stabiler Script-Reihenfolge ergänzt; die öffentliche API entsteht in common.js.
  window.LHUNDG_UI_PARTS = { node, decoratePaypalLink, bindTheme, bindDetails };
})();
