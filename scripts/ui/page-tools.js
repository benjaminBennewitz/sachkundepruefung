/* scripts/ui/page-tools.js */

/**
 * @file Kompakte Ortsinformationen und Rückweg zum Seitenanfang.
 * @description Ergänzt vorhandene Inhalte um gemeinsame Dialoge und eine dezente Scrollaktion.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  /**
   * Nutzt für Ortsinformationen die vorhandene Modalinstanz und erhält native Details als Fallback.
   * @param {Modal} modal Gemeinsame Dialogsteuerung.
   * @returns {void} Kein Rückgabewert.
   */
  ui.bindPageTools = modal => {
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
