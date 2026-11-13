/* scripts/ui/navigation.js */

/**
 * @file Gemeinsame mobile Hauptnavigation.
 * @description Verwendet vorhandene Links und Werkzeuge in einem bildschirmfüllenden nativen Navigationsdialog.
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
  const overlay = document.createElement('dialog');
  const topbar = document.createElement('div');
  const title = document.createElement('h2');
  const close = document.createElement('button');
  const supportHome = document.createComment('Position der Unterstützung im Desktop-Header');
  const projectHome = document.createComment('Position der Projekthinweise im Desktop-Header');
  support?.before(supportHome);
  project?.before(projectHome);
  panel.id = 'header-navigation-panel';
  panel.className = 'header-navigation-panel';
  toggle.type = 'button';
  toggle.className = 'icon-button header-menu-toggle';
  toggle.setAttribute('aria-controls', panel.id);
  toggle.setAttribute('aria-haspopup', 'dialog');
  overlay.className = 'mobile-navigation-overlay';
  overlay.setAttribute('aria-labelledby', 'mobile-navigation-title');
  topbar.className = 'mobile-navigation-topbar';
  title.id = 'mobile-navigation-title';
  title.textContent = 'Menü';
  close.type = 'button';
  close.className = 'mobile-navigation-close';
  close.textContent = 'Schließen ×';
  topbar.append(title, close);
  overlay.append(topbar);
  document.body.append(overlay);
  header.append(panel, toggle);
  panel.append(navigation, tools);

  /**
   * Öffnet das native Menü mit Fokusbegrenzung oder stellt Header und Scrollen wieder her.
   * @param {boolean} expanded Gewünschter Zustand.
   * @param {boolean} [restoreFocus] Fokus beim manuellen Schließen zum Auslöser zurückgeben.
   * @returns {void} Kein Rückgabewert.
   */
  function setExpanded(expanded, restoreFocus = false) {
    const opened = viewport.matches && expanded;
    toggle.setAttribute('aria-expanded', String(opened));
    toggle.setAttribute('aria-label', opened ? 'Menü schließen' : 'Menü öffnen');
    toggle.textContent = opened ? '×' : '☰';
    document.documentElement.classList.toggle('navigation-open', opened);
    panel.hidden = viewport.matches && !opened;
    if (opened) {
      overlay.append(panel);
      if (!overlay.open) overlay.showModal();
      overlay.scrollTop = 0;
      close.focus({ preventScroll: true });
    } else {
      if (overlay.open) overlay.close();
      header.insertBefore(panel, toggle);
      if (restoreFocus) toggle.focus({ preventScroll: true });
    }
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
    if (!viewport.matches && topbar.contains(activeElement)) navigation.querySelector('a')?.focus();
  }

  toggle.addEventListener('click', () => setExpanded(!overlay.open));
  close.addEventListener('click', () => setExpanded(false, true));
  overlay.addEventListener('cancel', event => {
    event.preventDefault();
    setExpanded(false, true);
  });
  overlay.addEventListener('close', () => {
    if (!overlay.open) setExpanded(false);
  });
  navigation.addEventListener('click', event => {
    if (viewport.matches && event.target.closest('a')) setExpanded(false);
  });
  viewport.addEventListener('change', syncViewport);
  syncViewport();
})();
