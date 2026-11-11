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

  // Interne Bausteine werden in stabiler Script-Reihenfolge ergänzt; die öffentliche API entsteht in common.js.
  window.LHUNDG_UI_PARTS = { node, decoratePaypalLink, bindTheme };
})();
