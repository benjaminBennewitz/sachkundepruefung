/* scripts/ui/navigation.js */

/**
 * @file Gemeinsame mobile Hauptnavigation.
 * @description Bündelt vorhandene Links und Werkzeuge ohne doppelte Bedienelemente oder IDs.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  const header = document.querySelector('.site-header');
  const navigation = header?.querySelector('.header-nav');
  const tools = header?.querySelector('.header-tools');
  if (!header || !navigation || !tools) return;

  const viewport = window.matchMedia('(max-width: 800px)');
  const support = tools.querySelector('[data-open-support]');
  const project = header.querySelector('.header-project');
  const panel = document.createElement('div');
  const toggle = document.createElement('button');
  const supportHome = document.createComment('Position der Unterstützung im Desktop-Header');
  const projectHome = document.createComment('Position der Projekthinweise im Desktop-Header');
  support?.before(supportHome);
  project?.before(projectHome);
  panel.id = 'header-navigation-panel';
  panel.className = 'header-navigation-panel';
  toggle.type = 'button';
  toggle.className = 'icon-button header-menu-toggle';
  toggle.textContent = '☰';
  toggle.setAttribute('aria-controls', panel.id);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Menü öffnen');
  header.append(panel, toggle);
  panel.append(navigation, tools);

  /**
   * Öffnet oder schließt das mobile Menü und synchronisiert seine Zugänglichkeit.
   * @param {boolean} expanded Gewünschter Zustand.
   * @param {boolean} [restoreFocus] Fokus bei Escape zum Auslöser zurückgeben.
   * @returns {void} Kein Rückgabewert.
   */
  function setExpanded(expanded, restoreFocus = false) {
    panel.hidden = viewport.matches && !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.setAttribute('aria-label', expanded ? 'Menü schließen' : 'Menü öffnen');
    toggle.textContent = expanded ? '×' : '☰';
    if (restoreFocus) toggle.focus();
  }

  /**
   * Verwendet auf Desktop dieselben Originalelemente wieder an ihren bisherigen Positionen.
   * @returns {void} Kein Rückgabewert.
   */
  function syncViewport() {
    const activeElement = document.activeElement;
    header.classList.toggle('has-mobile-navigation', viewport.matches);
    if (viewport.matches) {
      if (support) header.insertBefore(support, toggle);
      if (project) panel.append(project);
    } else {
      if (support) supportHome.after(support);
      if (project) projectHome.after(project);
    }
    setExpanded(false);
    if (viewport.matches && panel.contains(activeElement)) toggle.focus();
  }

  toggle.addEventListener('click', () => setExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
  header.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return;
    event.preventDefault();
    setExpanded(false, true);
  });
  navigation.addEventListener('click', event => {
    if (viewport.matches && event.target.closest('a')) setExpanded(false);
  });
  document.addEventListener('click', event => {
    if (viewport.matches && !header.contains(event.target) && !event.target.closest('dialog')) setExpanded(false);
  });
  header.addEventListener('focusout', event => {
    if (viewport.matches && !header.contains(event.relatedTarget) && !event.relatedTarget?.closest('dialog')) {
      setExpanded(false);
    }
  });
  viewport.addEventListener('change', syncViewport);
  syncViewport();
})();
