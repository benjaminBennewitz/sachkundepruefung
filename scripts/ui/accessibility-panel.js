/* scripts/ui/accessibility-panel.js */

/**
 * @file Globale Einstellungen für Barrierefreiheit.
 * @description Überträgt das Referenzpanel in das vorhandene native Dialogsystem der Lernhilfe.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

((ui, access) => {
  /**
   * Verbindet Header-Buttons und Einstellungsdialog ohne zusätzliches Dialogsystem.
   * @param {Modal} modal Gemeinsame Dialoginstanz.
   * @returns {void} Kein Rückgabewert.
   */
  ui.bindAccessibility = modal => {
    let content;
    let opening = false;
    const update = () => {
      if (!content) return;
      const state = access.get();
      for (const button of content.querySelectorAll('[data-preference]')) {
        button.setAttribute('aria-pressed', String(state[button.dataset.preference] === button.dataset.value));
      }
      content.querySelector('[data-speech=start]').disabled = !speech.voice();
      content.querySelector('[data-speech=pause]').disabled = !speech.active;
      content.querySelector('[data-speech=stop]').disabled = !speech.active;
      content.querySelector('[data-speech=pause]').textContent = speech.paused ? 'Fortsetzen' : 'Pause';
      content.querySelector('[data-speech-status]').textContent = speech.voice() ?
        (speech.active ? 'Vorlesen aktiv. Beim Fragenwechsel stoppt die Ausgabe.' : 'Lokale deutsche Stimme verfügbar.') :
        'Keine lokale deutsche Stimme verfügbar. Vorlesen benötigt eine passende Browser-/Systemstimme.';
    };
    const speech = new access.Speech(update);
    window.addEventListener('lhundg:accessibility-change', update);

    /**
     * Erzeugt eine beschriftete Gruppe mit tastaturbedienbaren Einstellungsbuttons.
     * @param {string} label Sichtbare Gruppenüberschrift.
     * @param {string} name Gespeicherte Präferenz.
     * @param {Array[]} values Werte mit verständlichen Bezeichnungen.
     * @returns {HTMLElement} Fieldset mit nativer Beschriftung.
     */
    function group(label, name, values) {
      const fieldset = ui.node('fieldset', '', 'accessibility-group');
      fieldset.append(ui.node('legend', label));
      const buttons = ui.node('div', '', 'accessibility-choices');
      for (const [value, text] of values) {
        const button = ui.node('button', text, 'secondary');
        button.type = 'button';
        Object.assign(button.dataset, { preference: name, value });
        button.addEventListener('click', () => access.set({ [name]: value }));
        buttons.append(button);
      }
      fieldset.append(buttons);
      return fieldset;
    }

    /** @returns {HTMLElement} Kompaktes Bedienpanel für Text, Kontrast, Statusfarben und Vorlesen. */
    function build() {
      const panel = ui.node('div', '', 'accessibility-content');
      const preferences = ui.node('div', '', 'accessibility-preferences');
      const statusColors = group('Statusfarben', 'colorVision', [
        ['default', 'Standard'], ['blue-amber', 'Blau / Orange']
      ]);
      const preview = ui.node('div', '', 'accessibility-status-preview');
      preview.append(ui.node('span', '✓ Richtig', 'status-preview-correct'),
        ui.node('span', '× Falsch', 'status-preview-wrong'));
      statusColors.append(preview, ui.node('p',
        'Ändert die Richtig-/Falsch-Markierungen im Trainer, nicht die übrigen Seitenfarben.', 'microcopy'));
      preferences.append(
        group('Textgröße', 'textSize', [['normal', '100 %'], ['large', '125 %'], ['larger', '150 %']]),
        group('Kontrast', 'contrast', [['normal', 'Normal'], ['high', 'Hoch']]),
        statusColors);
      panel.append(preferences);
      const reading = ui.node('fieldset', '', 'accessibility-group');
      reading.append(ui.node('legend', 'Vorlesen'));
      const controls = ui.node('div', '', 'accessibility-choices');
      for (const [action, label] of [['start', 'Vorlesen'], ['pause', 'Pause'], ['stop', 'Stoppen']]) {
        const button = ui.node('button', label, 'secondary');
        button.type = 'button';
        button.dataset.speech = action;
        button.addEventListener('click', () => speech[action]());
        controls.append(button);
      }
      const status = ui.node('p', '', 'microcopy');
      status.dataset.speechStatus = '';
      status.setAttribute('role', 'status');
      reading.append(controls, status);
      const footer = ui.node('div', '', 'accessibility-footer');
      const reset = ui.node('button', 'Zurücksetzen', 'text-button');
      reset.type = 'button';
      reset.addEventListener('click', () => access.reset());
      footer.append(ui.node('p', 'Einstellungen bleiben in diesem Browser.', 'microcopy'), reset);
      panel.append(reading, footer);
      return panel;
    }

    for (const trigger of document.querySelectorAll('[data-open-accessibility]')) {
      trigger.addEventListener('click', async () => {
        if (opening) return;
        opening = true;
        try {
          content = build();
          update();
          await modal.open({ title: 'Barrierefreiheit', message: 'Text, Kontrast und Vorlesen anpassen.',
            content, returnFocus: trigger, actions: [{ label: 'Fertig', value: 'close', primary: true }] });
        } finally {
          opening = false;
          content = null;
        }
      });
    }
  };
})(window.LHUNDG_UI_PARTS, window.LHUNDG_ACCESS);
