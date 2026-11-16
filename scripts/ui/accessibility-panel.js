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

    /** @returns {HTMLElement} Bedienpanel mit denselben Präferenzgruppen wie die Referenz. */
    function build() {
      const panel = ui.node('div', '', 'accessibility-content');
      const quick = ui.node('div', '', 'accessibility-choices');
      const calm = ui.node('button', 'Ruhige Darstellung', 'secondary');
      const reset = ui.node('button', 'Zurücksetzen', 'secondary');
      calm.type = reset.type = 'button';
      calm.addEventListener('click', () => access.set({ motion: 'off', comfort: 'simple', contrast: 'high' }));
      reset.addEventListener('click', () => access.reset());
      quick.append(calm, reset);
      panel.append(quick,
        group('Textgröße', 'textSize', [['normal', '100 %'], ['large', '112,5 %'], ['larger', '125 %']]),
        group('Bewegung', 'motion', [['system', 'Wie im System'], ['reduced', 'Reduziert'], ['off', 'Aus']]),
        group('Oberfläche', 'comfort', [['expressive', 'Gestaltet'], ['simple', 'Ruhig']]),
        group('Kontrast', 'contrast', [['normal', 'Normal'], ['high', 'Hoch']]),
        group('Farben unterscheiden', 'colorVision', [['default', 'Standard'], ['blue-amber', 'Blau / Orange']]));
      panel.append(ui.node('p', 'Die alternative Palette unterscheidet Erfolg und Fehler mit Blau und Orange. ' +
        'Zeichen und Beschriftungen bleiben in beiden Paletten erhalten.', 'microcopy'));
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
      panel.append(controls, status, ui.node('p', 'Deine Auswahl wird nur in diesem Browser gespeichert. ' +
        'Vergrößerte Texte dürfen mehr Platz benötigen; Inhalte bleiben erreichbar.', 'microcopy'));
      return panel;
    }

    for (const trigger of document.querySelectorAll('[data-open-accessibility]')) {
      trigger.addEventListener('click', async () => {
        if (opening) return;
        opening = true;
        try {
          content = build();
          update();
          await modal.open({ title: 'Barrierefreiheit', message: 'Passe die Darstellung und das Lesen an deine Bedürfnisse an.',
            content, returnFocus: trigger, actions: [{ label: 'Fertig', value: 'close', primary: true }] });
        } finally {
          opening = false;
          content = null;
        }
      });
    }
  };
})(window.LHUNDG_UI_PARTS, window.LHUNDG_ACCESS);
