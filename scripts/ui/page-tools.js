/* scripts/ui/page-tools.js */

/**
 * @file Kompakte Ortsinformationen und Rückweg zum Seitenanfang.
 * @description Ergänzt vorhandene Inhalte um gemeinsame Dialoge und eine dezente Scrollaktion.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  /**
   * Rahmt das per Fragment verlinkte Quellenkärtchen bis zur nächsten bewussten Bedienung ein.
   * @returns {void} Kein Rückgabewert; programmatisches Ankerscrollen entfernt den Rahmen nicht.
   */
  function bindSourceTarget() {
    const cards = new Map(Array.from(document.querySelectorAll('.source-card[id]'))
      .filter(card => card.id).map(card => [card.id, card]));
    if (!cards.size) return;
    let dispose = () => {};

    /** @returns {void} Synchronisiert Ziel, sichtbare Position und einmalige Abschlussereignisse. */
    function highlight() {
      dispose();
      let id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const card = cards.get(id);
      if (!card) return;
      let settled = false;
      let timer;
      const removals = [];

      /** @returns {void} Entfernt ausschließlich die temporäre Hervorhebung und ihre Listener. */
      const clear = () => {
        card.classList.remove('source-target');
        window.clearTimeout(timer);
        removals.forEach(remove => remove());
      };
      /** @returns {void} Wartet auf das Ende des automatischen Scrollens, ohne Nutzeraktionen zu sperren. */
      const settle = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => { settled = true; }, 180);
      };
      /** @param {string} name Ereignis. @param {Function} handler Rückmeldung. @returns {void} Registrierung. */
      const listen = (name, handler) => {
        window.addEventListener(name, handler, { capture: true, passive: true });
        removals.push(() => window.removeEventListener(name, handler, true));
      };
      dispose = clear;
      card.classList.add('source-target');
      listen('scroll', () => { if (settled) clear(); else settle(); });
      listen('pointerdown', clear);
      listen('click', clear);
      listen('wheel', clear);
      listen('touchmove', clear);
      listen('keydown', event => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) clear();
      });
      card.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      settle();
    }

    window.addEventListener('hashchange', highlight);
    window.addEventListener('pageshow', highlight);
    highlight();
  }

  /**
   * Nutzt für Ortsinformationen die vorhandene Modalinstanz und erhält native Details als Fallback.
   * @param {Modal} modal Gemeinsame Dialogsteuerung.
   * @returns {void} Kein Rückgabewert.
   */
  ui.bindPageTools = modal => {
    bindSourceTarget();
    let opening = false;
    for (const details of document.querySelectorAll('[data-city-dialog]')) {
      const summary = details.querySelector(':scope > summary');
      const content = details.querySelector('.city-content');
      summary.setAttribute('aria-haspopup', 'dialog');
      summary.addEventListener('click', async event => {
        if (event.target.closest('a, button, input, select')) return;
        event.preventDefault();
        if (opening) return;
        opening = true;
        details.open = false;
        try {
          await modal.open({
            title: summary.textContent.trim(),
            message: 'Örtliche Angaben und ihre Herkunft. Für deinen Termin ist die zuständige Prüfstelle maßgeblich.',
            content, returnFocus: summary, closeButton: true, actions: []
          });
        } finally {
          details.append(content);
          details.open = false;
          opening = false;
        }
      });
    }

    const learningSlot = document.getElementById?.('learningScrollTop');
    const button = ui.node('button', learningSlot ? 'Nach oben ↑' : '↑', 'scroll-top');
    button.type = 'button';
    button.hidden = true;
    button.setAttribute('aria-label', 'Zum Seitenanfang');
    button.title = 'Zum Seitenanfang';
    (learningSlot || document.body).append(button);
    const update = () => { button.hidden = window.scrollY < 400; };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('pageshow', update);
    button.addEventListener('click', () => {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      document.querySelector('.site-header .brand')?.focus({ preventScroll: true });
    });
    update();
  };
})(window.LHUNDG_UI_PARTS);
