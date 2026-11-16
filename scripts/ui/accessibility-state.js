/* scripts/ui/accessibility-state.js */

/**
 * @file Gespeicherte Einstellungen für lesbare und ruhige Darstellung.
 * @description Validiert lokale Präferenzen und setzt ausschließlich bekannte Dokumentattribute.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  const key = 'lhundg-accessibility-v1';
  const choices = {
    textSize: ['normal', 'large', 'larger'],
    contrast: ['normal', 'high'],
    colorVision: ['default', 'blue-amber']
  };
  const defaults = Object.freeze({
    textSize: 'normal', contrast: 'normal', colorVision: 'default'
  });

  /**
   * Erhält nur unterstützte Einstellungen; ungültige Speicherwerte werden verworfen.
   * @param {unknown} value Ungeprüfte gespeicherte Daten.
   * @returns {object} Vollständige, gültige Einstellungen ohne fremde Schlüssel.
   */
  function normalize(value) {
    const input = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return Object.fromEntries(Object.entries(choices).map(([name, values]) =>
      [name, Object.hasOwn(input, name) && values.includes(input[name]) ? input[name] : defaults[name]]));
  }

  /** @returns {object} Gespeicherte Einstellungen oder sichere Standardwerte. */
  function read() {
    try {
      return normalize(JSON.parse(localStorage.getItem(key)));
    } catch {
      return { ...defaults };
    }
  }

  let preferences = read();

  /** @returns {void} Synchronisiert Dokumentattribute und informiert aktive Bedienelemente. */
  function apply() {
    Object.assign(document.documentElement.dataset, preferences);
    delete document.documentElement.dataset.motion;
    delete document.documentElement.dataset.comfort;
    window.dispatchEvent(new CustomEvent('lhundg:accessibility-change'));
  }

  /**
   * Ändert Einstellungen ohne andere lokale Lern- oder Theme-Daten zu überschreiben.
   * @param {object} patch Gewünschte Änderungen.
   * @returns {boolean} Ob die Einstellung zusätzlich dauerhaft gespeichert wurde.
   */
  function set(patch) {
    preferences = normalize({ ...preferences, ...patch });
    apply();
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
      return true;
    } catch {
      window.LHUNDG_UI?.toast('Die Einstellung gilt jetzt, konnte aber nicht dauerhaft gespeichert werden.', {
        key: 'accessibility-storage'
      });
      return false;
    }
  }

  window.LHUNDG_ACCESS = {
    normalize, defaults, get: () => ({ ...preferences }), set, reset: () => set(defaults)
  };
  apply();
})();
