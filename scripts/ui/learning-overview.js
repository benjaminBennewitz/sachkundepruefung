/* scripts/ui/learning-overview.js */

/**
 * @file Kleiner Lernüberblick auf der Begrüßungsseite.
 * @description Verwendet eine geprüfte lokale Zusammenfassung, ohne Fragenbestände nachzuladen.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  const root = document.getElementById('learningOverview');
  if (!root) return;
  const cards = [...document.querySelectorAll('[data-catalogue-mode]')];

  /**
   * Verwirft fremde Kataloge und widersprüchliche oder veraltete Zähler.
   * @param {unknown} value Gespeicherte Übersicht.
   * @returns {HTMLElement|null} Passende, projektseitig gepflegte Katalogkarte.
   */
  function catalogue(value) {
    if (!value || value.version !== 1) return null;
    const card = cards.find(item => item.dataset.catalogueMode === value.mode);
    if (!card || value.total !== Number(card.dataset.questionCount)) return null;
    const fields = ['total', 'answered', 'checked', 'correct', 'wrong', 'bookmarked'];
    if (!fields.every(name => Number.isInteger(value[name]) && value[name] >= 0 && value[name] <= value.total)) return null;
    if (value.correct + value.wrong !== value.checked || value.checked > value.answered) return null;
    return card;
  }

  /** @returns {void} Zeigt den letzten Katalog; fehlende Kennzahlen bleiben ausdrücklich unbekannt. */
  function refresh() {
    let summary;
    try { summary = JSON.parse(localStorage.getItem('lhundg-overview-v1')); } catch { summary = null; }
    const card = catalogue(summary);
    root.querySelector('[data-overview-title]').textContent = card ?
      `Zuletzt: ${card.querySelector('h3').textContent}` : 'Dein Lernüberblick';
    for (const name of ['answered', 'correct', 'wrong', 'bookmarked']) {
      root.querySelector(`[data-overview=${name}]`).textContent = card ?
        (name === 'answered' ? `${summary.answered} / ${summary.total}` : summary[name]) : '—';
    }
    root.querySelector('[data-overview-note]').textContent = card ?
      (summary.checked ? `${summary.checked} Fragen geprüft · ${Math.round(summary.correct / summary.checked * 100)} % davon richtig.` :
        'In diesem Katalog ist noch keine Antwort geprüft.') :
      'Dein Überblick wird beim nächsten Lernen aus dem aktiven Katalog aktualisiert.';
    root.querySelector('[data-overview-continue]').href = card ?
      card.querySelector('[data-catalogue-start]').getAttribute('href') : 'lernen.html';
  }

  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => { if (event.key === 'lhundg-overview-v1' || event.key === null) refresh(); });
  refresh();
})();
