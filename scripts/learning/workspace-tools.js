/* scripts/learning/workspace-tools.js */

/**
 * @file Lernwerkzeuge ohne dauerhaft belegten Fragenraum.
 * @description Zeigt die vorhandenen Controls unverändert im gemeinsamen Dialog und führt sie zurück.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  /** Responsive Klappbereiche erhalten die vorhandenen Controls ohne Duplikate oder zusätzliche Speicherung. */
  function bindMobilePanels() {
    const toggles = [...document.querySelectorAll('[data-mobile-toggle]')];
    if (!toggles.length) return;
    const compact = matchMedia('(max-width: 999px), (max-height: 719px)');
    for (const toggle of toggles) {
      const content = document.getElementById(toggle.getAttribute('aria-controls'));
      let expanded = false;
      /** Sichtbarkeit und Fokus bleiben auch beim Drehen oder Vergrößern des Fensters konsistent. */
      function refresh() {
        toggle.hidden = !compact.matches;
        content.hidden = compact.matches && !expanded;
        toggle.setAttribute('aria-expanded', String(!content.hidden));
        if (content.hidden) {
          const select = window.LHUNDG_UI_PARTS.activeSelect;
          if (select && content.contains(select.trigger)) select.close();
          if (content.contains(document.activeElement)) toggle.focus({ preventScroll: true });
        }
      }
      toggle.addEventListener('click', () => {
        expanded = !expanded;
        refresh();
      });
      compact.addEventListener('change', refresh);
      refresh();
    }
  }

  bindMobilePanels();
  const depot = document.getElementById('learningToolDepot');
  const modal = document.querySelector('.ui-modal');
  const definitions = {
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
      const legend = name === 'overview' ? content.querySelector('.nav-legend') : null;
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
          stickyHeader: legend, closeButton: true, actions: [] });
      } finally {
        window.LHUNDG_UI_PARTS.activeSelect?.close();
        content.removeEventListener('click', continueAction, true);
        if (legend) details.insertBefore(legend, content.querySelector('#questionNav'));
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
