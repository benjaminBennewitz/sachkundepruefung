/* scripts/learning/workspace-tools.js */

/**
 * @file Lernwerkzeuge ohne dauerhaft belegten Fragenraum.
 * @description Zeigt die vorhandenen Controls unverändert im gemeinsamen Dialog und führt sie zurück.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  const depot = document.getElementById('learningToolDepot');
  const modal = document.querySelector('.ui-modal');
  const definitions = {
    settings: ['Filter und Auswertung', 'Suche, Lernstatus und Auswertungsaktionen für deinen aktiven Katalog.'],
    overview: ['Fragenübersicht', 'Wähle eine Frage. Status und Merker gehören zum aktiven Katalog.'],
    tests: ['Testreihe starten', 'Prüfe Profil, Herkunft und Bedingungen vor dem Start.']
  };
  let opening = false;

  for (const trigger of document.querySelectorAll('[data-learning-tool]')) {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.addEventListener('click', async () => {
      if (opening) return;
      opening = true;
      const name = trigger.dataset.learningTool;
      const content = document.getElementById(`learning-${name}`);
      const [title, message] = definitions[name];
      const details = content.querySelector('details');
      if (details) details.open = true;
      let returnToQuestion = false;
      const continueAction = event => {
        returnToQuestion = Boolean(event.target.closest('.nav-q, #intermediate, #evaluate'));
        if (event.target.closest('.nav-q, #startExam, #intermediate, #evaluate, #showMatchList')) {
          window.LHUNDG_UI_PARTS.activeSelect?.close();
          modal.close('continue');
        }
      };
      content.addEventListener('click', continueAction, true);
      try {
        await window.LHUNDG_UI.modal({ title, message, content, returnFocus: trigger,
          actions: [{ label: 'Fertig', value: 'close', primary: true }] });
      } finally {
        window.LHUNDG_UI_PARTS.activeSelect?.close();
        content.removeEventListener('click', continueAction, true);
        depot.append(content);
        if (returnToQuestion) {
          const target = document.querySelector('#result:not([hidden]), .question-prompt');
          target?.focus({ preventScroll: true });
        }
        opening = false;
      }
    });
  }
})();
