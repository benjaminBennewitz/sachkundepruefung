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

  /** @param {string} [id] Personenkennung. @returns {object|null} Ungeprüfte lokale Kennzahlen. */
  function readSummary(id) {
    const key = window.LHUNDG_LEARNERS?.key('lhundg-overview-v1', id) || 'lhundg-overview-v1';
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }

  /** @returns {void} Vergleicht Personen anhand ihres jeweils letzten Katalogs, ohne Erfolge zu erfinden. */
  function compare() {
    const people = window.LHUNDG_LEARNERS;
    if (!people) return;
    const grid = document.querySelector('[data-profile-comparison]');
    if (!grid) return;
    const profiles = people.list();
    grid.closest('section').hidden = profiles.length < 2;
    grid.replaceChildren();
    /** @param {string} tag Element. @param {string} text Sicherer Text. @returns {HTMLElement} Element. */
    const node = (tag, text) => Object.assign(document.createElement(tag), { textContent: text });
    for (const person of profiles) {
      const summary = readSummary(person.id);
      const card = catalogue(summary);
      const article = node('article', '');
      article.className = 'profile-card';
      article.dataset.active = String(person.id === people.current().id);
      article.append(node('h3', person.name));
      article.append(node('p', people.goals[person.goal]));
      const source = node('p', card ? card.querySelector('h3').textContent : 'Noch kein Katalog gelernt');
      source.className = 'eyebrow';
      article.append(source);
      const values = node('dl', '');
      values.className = 'profile-kpis';
      for (const [field, label] of [['answered', 'Beantwortet'], ['correct', 'Richtig geprüft'],
        ['wrong', 'Zum Wiederholen'], ['bookmarked', 'Gemerkt']]) {
        const item = node('div', '');
        const value = card ? (field === 'answered' ? `${summary.answered} / ${summary.total}` : String(summary[field])) : '—';
        item.append(node('dt', label), node('dd', value));
        values.append(item);
      }
      article.append(values);
      const note = node('p', card && summary.checked ?
        `${summary.checked} geprüft · ${Math.round(summary.correct / summary.checked * 100)} % richtig` : 'Noch keine geprüfte Lernquote');
      note.className = 'microcopy';
      article.append(note);
      const select = node('button', person.id === people.current().id ? 'Aktives Profil' : 'Profil auswählen');
      select.type = 'button';
      select.className = 'secondary';
      select.dataset.selectLearner = person.id;
      select.disabled = person.id === people.current().id;
      article.append(select);
      grid.append(article);
    }
  }

  /** @returns {void} Zeigt den letzten Katalog; fehlende Kennzahlen bleiben ausdrücklich unbekannt. */
  function refresh() {
    let summary;
    summary = readSummary();
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
      card.querySelector('[data-catalogue-start]').getAttribute('href') :
      (window.LHUNDG_LEARNERS?.current().goal === 'para11' ? 'lernen.html?mode=kammer197' : 'lernen.html');
    compare();
  }

  window.addEventListener('pageshow', refresh);
  window.addEventListener('lhundg:profile-change', refresh);
  window.addEventListener('lhundg:profile-deleted', refresh);
  window.addEventListener('storage', refresh);
  refresh();
})();
