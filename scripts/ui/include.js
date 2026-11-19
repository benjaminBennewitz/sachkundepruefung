/* scripts/ui/include.js */

/**
 * @file Gemeinsamer Kopf- und Fußbereich.
 * @description Lädt lokale HTML-Fragmente für die laufende Seite und stellt deren Bereitschaft bereit.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  /**
   * Erhält die direkten Lernstandswerkzeuge und kennzeichnet den aktuellen Navigationslink.
   * @param {HTMLElement} slot Kopfbereich der aktuellen Seite.
   * @param {HTMLElement} header Geladener Kopfbereich mit gemeinsamen Links und Werkzeugen.
   * @returns {void} Kein Rückgabewert.
   */
  function prepareHeader(slot, header) {
    const localTools = slot.querySelector('.header-tools');
    if (localTools) {
      const tools = header.querySelector('.header-tools');
      for (const link of tools.querySelectorAll('a[href^="lernen.html?action="]')) link.remove();
      tools.prepend(...localTools.children);
    }

    const current = new URL(location.href);
    const currentPath = current.pathname.replace(/\/index\.html$/, '/');
    for (const link of header.querySelectorAll('.header-nav a[href]')) {
      const target = new URL(link.getAttribute('href'), current);
      if (target.pathname === currentPath) link.setAttribute('aria-current', 'page');
    }
  }

  /**
   * Lädt ein projekteeigenes Fragment und ersetzt den Inhalt des vorhandenen Landmarks.
   * @param {HTMLElement} slot Landmark mit relativer Datei-URL und Ersatzlinks.
   * @returns {Promise<void>} Einfügen des Fragments oder Erhalt der Ersatzlinks im Fehlerfall.
   */
  async function loadFragment(slot) {
    const path = slot.dataset.layoutSrc;
    try {
      const response = await fetch(path, {
        mode: 'same-origin',
        credentials: 'same-origin',
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const template = document.createElement('template');
      template.innerHTML = await response.text();
      const fragment = template.content.firstElementChild;
      const isHeader = slot.tagName === 'HEADER';
      const expected = isHeader ? 'header.site-header' : 'footer.site-footer';
      if (!fragment?.matches(expected)) throw new Error('Unerwartetes HTML-Fragment.');

      const active = document.activeElement;
      const hadFocus = slot.contains(active);
      if (isHeader) prepareHeader(slot, fragment);
      slot.replaceChildren(...fragment.childNodes);
      slot.removeAttribute('data-layout-src');
      if (hadFocus) {
        const next = slot.contains(active) ? active : slot.querySelector('a[href]');
        next?.focus({ preventScroll: true });
      }
    } catch (error) {
      slot.dataset.layoutFailed = '';
      console.error(`Der gemeinsame Seitenbereich konnte nicht geladen werden: ${path}`, error);
    }
  }

  window.LHUNDG_LAYOUT_READY = Promise.all(
    Array.from(document.querySelectorAll('[data-layout-src]'), loadFragment)
  );
})();
