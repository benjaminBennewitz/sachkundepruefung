/* scripts/ui/common.js */

/**
 * @file Gemeinsame UI-Funktionen.
 * @description Theme-Steuerung, wiederverwendbare Modale und Toasts sowie freiwilliger Unterstützungsdialog.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';
(() => {
  const toggle = document.querySelector('#themeToggle');

  /** Synchronisiert Farbmodus, Symbol und zugängliche Beschriftung mit der gespeicherten oder systemweiten Auswahl. */
  function updateThemeButton() {
    const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement
      .dataset.theme && matchMedia('(prefers-color-scheme: dark)')
        .matches);
    document.documentElement.dataset.activeTheme = dark ? 'dark' : 'light';
    toggle?.setAttribute('aria-label', dark ? 'Helles Farbschema aktivieren' :
      'Dunkles Farbschema aktivieren');
    if (toggle) toggle.querySelector('.tool-tip')
      .textContent = dark ? 'Hell einschalten' : 'Dunkel einschalten';
  }
  updateThemeButton();
  matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', updateThemeButton);
  toggle?.addEventListener('click', () => {
    const theme = document.documentElement.dataset.activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('lhundg-theme-v1', theme);
    } catch { }
    updateThemeButton();
  });
  /**
   * @typedef {Object} ModalAction
   * @property {string} label Sichtbare Aktionsbeschriftung.
   * @property {string} [value] Rückgabewert eines schließenden Buttons.
   * @property {string} [href] Externes Linkziel statt eines schließenden Buttons.
   * @property {boolean} [primary] Hebt die Aktion hervor.
   * @property {boolean} [danger] Kennzeichnet eine löschende Aktion.
   * @property {boolean} [autofocus] Fokussiert diese Aktion beim Öffnen.
   * @property {boolean} [paypal] Ergänzt das lokale PayPal-Zeichen.
   */

  /**
   * @typedef {Object} ModalOptions
   * @property {string} title Zugängliche Dialogüberschrift.
   * @property {string} message Beschreibung der Entscheidung.
   * @property {string} [eyebrow] Kurzer Kontext über der Überschrift.
   * @property {string} [note] Zusätzlicher Hinweis unter den Aktionen.
   * @property {ModalAction[]} actions Verfügbare Dialogaktionen.
   * @property {HTMLElement} [returnFocus] Fokusziel nach dem Schließen.
   */

  /**
   * Erzeugt die gemeinsam verwendete Modal-Komponente.
   * Native Dialoge übernehmen Fokusbegrenzung, Escape und den inaktiven Hintergrund.
   * @returns {(options: ModalOptions) => Promise<string>} Öffnet Dialoge nacheinander.
   */
  function createModal() {
    const dialog = document.createElement('dialog');
    dialog.className = 'ui-modal';
    dialog.setAttribute('aria-labelledby', 'uiModalTitle');
    dialog.setAttribute('aria-describedby', 'uiModalMessage');
    document.body.append(dialog);
    let sequence = Promise.resolve();

    /**
     * Zeigt eine einzelne Entscheidung und räumt Listener nach dem Schließen auf.
     * @param {ModalOptions} options Beschriftungen und Aktionen.
     * @returns {Promise<string>} Aktionswert oder „cancel“ bei Escape.
     */
    function present(options) {
      return new Promise(resolve => {
        const origin = options.returnFocus || document.activeElement;
        const card = document.createElement('div');
        card.className = 'ui-modal-inner';
        if (options.eyebrow) {
          const eyebrow = document.createElement('p');
          eyebrow.className = 'eyebrow';
          eyebrow.textContent = options.eyebrow;
          card.append(eyebrow);
        }
        const title = document.createElement('h2');
        title.id = 'uiModalTitle';
        title.textContent = options.title;
        const message = document.createElement('p');
        message.id = 'uiModalMessage';
        message.textContent = options.message;
        card.append(title, message);
        const actions = document.createElement('div');
        actions.className = 'dialog-actions';
        for (const action of options.actions) {
          const control = document.createElement(action.href ? 'a' : 'button');
          control.className = action.danger ? 'button danger-button' :
            action.primary ? 'button primary' : 'button secondary';
          control.textContent = action.label;
          if (action.href) {
            control.href = action.href;
            control.target = '_blank';
            control.rel = 'noopener noreferrer external';
            if (action.paypal) decoratePaypalLink(control);
          } else {
            control.type = 'button';
            control.addEventListener('click', () => dialog.close(action.value || 'cancel'));
          }
          control.autofocus = action.autofocus === true;
          actions.append(control);
        }
        card.append(actions);
        if (options.note) {
          const note = document.createElement('p');
          note.className = 'microcopy';
          note.textContent = options.note;
          card.append(note);
        }
        dialog.replaceChildren(card);
        dialog.returnValue = '';
        dialog.addEventListener('close', () => {
          document.documentElement.classList.remove('modal-open');
          if (origin?.isConnected) origin.focus({ preventScroll: true });
          resolve(dialog.returnValue || 'cancel');
        }, { once: true });
        document.documentElement.classList.add('modal-open');
        dialog.showModal();
      });
    }

    return options => {
      const result = sequence.then(() => present(options));
      sequence = result.catch(() => {});
      return result;
    };
  }

  /**
   * @typedef {Object} ToastOptions
   * @property {'info'|'success'|'warning'|'error'} [type] Bedeutung und Darstellung.
   * @property {number} [duration] Anzeigezeit in Millisekunden; 0 bleibt bis zum Schließen.
   * @property {string} [key] Verhindert doppelte gleichzeitige Meldungen.
   */

  /**
   * Erzeugt sichtbare Toasts und getrennte Screenreader-Ankündigungen.
   * Höchstens drei Toasts sind gleichzeitig sichtbar; weitere Meldungen warten.
   * @returns {(message: string, options?: ToastOptions) => void} Zeigt eine Meldung.
   */
  function createToasts() {
    const region = document.createElement('section');
    region.className = 'toast-region';
    region.setAttribute('aria-label', 'Statusmeldungen');
    const polite = document.createElement('div');
    polite.className = 'sr-only';
    polite.setAttribute('role', 'status');
    polite.setAttribute('aria-atomic', 'true');
    const urgent = document.createElement('div');
    urgent.className = 'sr-only';
    urgent.setAttribute('role', 'alert');
    urgent.setAttribute('aria-atomic', 'true');
    document.body.append(region, polite, urgent);
    const active = new Map();
    const pending = [];
    const labels = { info: 'Info', success: 'Erledigt', warning: 'Wichtiger Hinweis', error: 'Fehler' };
    const announcements = { polite: [], urgent: [] };
    let announcementPending = false;

    /**
     * Bündelt gleichzeitig erscheinende Meldungen für vollständige Live-Ankündigungen.
     * @param {string} message Fertiger Meldungstext mit Bedeutung.
     * @param {boolean} assertive Ob die Meldung dringlich ist.
     * @returns {void}
     */
    function announce(message, assertive) {
      announcements[assertive ? 'urgent' : 'polite'].push(message);
      if (announcementPending) return;
      announcementPending = true;
      polite.textContent = '';
      urgent.textContent = '';
      requestAnimationFrame(() => {
        polite.textContent = announcements.polite.splice(0).join(' ');
        urgent.textContent = announcements.urgent.splice(0).join(' ');
        announcementPending = false;
      });
    }


    /** Rendert wartende Meldungen, ohne den Lernbereich oder dessen Fokus zu verschieben. */
    function drain() {
      while (active.size < 3 && pending.length) {
        const entry = pending.shift();
        const { message, type, key, duration } = entry;
        const toast = document.createElement('div');
        toast.className = `ui-toast ui-toast--${type}`;
        const content = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = labels[type];
        const copy = document.createElement('p');
        copy.textContent = message;
        content.append(title, copy);
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'toast-close';
        close.setAttribute('aria-label', `${labels[type]} schließen`);
        close.textContent = '×';
        toast.append(content, close);
        let timer;
        let remaining = duration;
        let started = 0;
        let hovered = false;
        let focused = false;

        /** Pausiert die Restzeit bei Maus, Tastatur oder verdecktem Browser-Tab. */
        function pause() {
          if (timer === undefined) return;
          clearTimeout(timer);
          timer = undefined;
          remaining = Math.max(0, remaining - (Date.now() - started));
        }

        /** Setzt nur zeitlich begrenzte, gerade nicht bediente Meldungen fort. */
        function resume() {
          if (!duration || timer !== undefined || hovered || focused || document.hidden) return;
          started = Date.now();
          timer = setTimeout(dismiss, remaining);
        }

        /** Entfernt eine Meldung und gibt den nächsten Platz in der Warteschlange frei. */
        function dismiss() {
          pause();
          const hadFocus = toast.contains(document.activeElement);
          active.delete(key);
          toast.remove();
          drain();
          if (hadFocus) {
            const target = region.querySelector('button') || entry.origin;
            if (target?.isConnected) target.focus({ preventScroll: true });
          }
        }

        close.addEventListener('click', dismiss);
        toast.addEventListener('pointerenter', () => { hovered = true; pause(); });
        toast.addEventListener('pointerleave', () => { hovered = false; resume(); });
        toast.addEventListener('focusin', () => { focused = true; pause(); });
        toast.addEventListener('focusout', event => {
          focused = toast.contains(event.relatedTarget);
          if (!focused) resume();
        });
        active.set(key, { pause, resume });
        region.append(toast);
        announce(`${labels[type]}: ${message}`, type === 'error' || type === 'warning');
        resume();
      }
    }

    document.addEventListener('visibilitychange', () => {
      for (const toast of active.values()) document.hidden ? toast.pause() : toast.resume();
    });

    return (message, options = {}) => {
      const type = Object.hasOwn(labels, options.type) ? options.type : 'info';
      const key = options.key || `${type}:${message}`;
      if (active.has(key) || pending.some(entry => entry.key === key)) return;
      const duration = options.duration ?? (type === 'warning' || type === 'error' ? 0 : 8000);
      pending.push({ message, type, key, duration, origin: document.activeElement });
      drain();
    };
  }

  const modal = createModal();
  const toast = createToasts();
  window.LHUNDG_UI = Object.freeze({
    modal,
    toast,
    /**
     * Fragt eine Entscheidung ab; Abbrechen und Escape liefern false.
     * @param {Object} options Dialogtext und Aktionsbeschriftungen.
     * @param {string} options.title Überschrift.
     * @param {string} options.message Erläuterung der Folgen.
     * @param {string} [options.confirmLabel] Text der bestätigenden Aktion.
     * @param {string} [options.cancelLabel] Text der abbrechenden Aktion.
     * @param {boolean} [options.danger] Markiert eine löschende Aktion.
     * @returns {Promise<boolean>} Ob ausdrücklich bestätigt wurde.
     */
    async confirm({ title, message, confirmLabel = 'Bestätigen', cancelLabel = 'Abbrechen', danger = false }) {
      return await modal({ title, message, actions: [
        { label: cancelLabel, value: 'cancel', autofocus: true },
        { label: confirmLabel, value: 'confirm', primary: true, danger }
      ] }) === 'confirm';
    }
  });

  const paypalUrl = window.SITE_CONFIG?.paypalUrl || '';
  let validPaypal = false;
  try {
    const url = new URL(paypalUrl);
    validPaypal = url.protocol === 'https:' && ['paypal.com', 'www.paypal.com', 'paypal.me',
      'www.paypal.me'
    ].includes(url.hostname);
  } catch { }
  /**
   * Ergänzt das lokale PayPal-Zeichen, ohne den Linktext zu ersetzen.
   * @param {HTMLAnchorElement} link Unterstützungslink im Footer oder Dialog.
   * @returns {void}
   */
  function decoratePaypalLink(link) {
    if (link.querySelector('.paypal-icon')) return;
    const icon = document.createElement('img');
    icon.className = 'paypal-icon';
    icon.src = 'assets/icons/paypal.svg';
    icon.alt = '';
    icon.width = 24;
    icon.height = 24;
    icon.setAttribute('aria-hidden', 'true');
    link.classList.add('paypal-button');
    link.prepend(icon);
  }

  document.querySelectorAll('[data-paypal]')
    .forEach(link => {
      if (validPaypal) {
        link.href = paypalUrl;
        link.hidden = false;
        decoratePaypalLink(link);
      }
    });
  document.querySelectorAll('[data-support-pending]')
    .forEach(el => {
      el.hidden = validPaypal;
    });
  let supportShown = false;
  let supportPending = false;
  try {
    supportShown = sessionStorage.getItem('lhundg-support-shown-v1') === '1';
  } catch { }

  /**
   * Öffnet die Unterstützung über dieselbe Modal-Komponente wie alle Bestätigungen.
   * @param {Object} [options] Aufrufkontext.
   * @param {boolean} [options.automatic] Höchstens einmal pro Sitzung automatisch öffnen.
   * @param {HTMLElement} [options.returnFocus] Rücksprungziel nach dem Schließen.
   * @returns {Promise<void>} Wird nach dem Schließen erfüllt.
   */
  window.openSupportDialog = async ({ automatic = false, returnFocus = document.activeElement } = {}) => {
    if (supportPending || (automatic && supportShown)) return;
    supportPending = true;
    supportShown = true;
    try {
      sessionStorage.setItem('lhundg-support-shown-v1', '1');
    } catch { }
    const actions = [];
    if (validPaypal) actions.push({ label: 'Mit PayPal unterstützen', href: paypalUrl, primary: true, paypal: true });
    actions.push({ label: automatic ? 'Zum Ergebnis' : 'Weiterlernen', value: 'cancel', autofocus: true });
    try {
      await modal({
        title: 'Lernen soll kostenlos bleiben.',
        eyebrow: 'FREIWILLIG. OHNE WERBUNG.',
        message: 'Hier gibt es bewusst keine Werbung: Du sollst in Ruhe lernen und dich konzentrieren können. Für Server und Bereitstellung entstehen trotzdem laufende Kosten. Wenn dir die Lernhilfe etwas bringt, freue ich mich über eine kleine Unterstützung. Alles bleibt auch ohne Beitrag kostenlos. Danke, dass du dabei bist!',
        note: validPaypal ? 'Externer Zahlungsdienst · Keine Spendenbescheinigung · Kein Kauf zusätzlicher Funktionen.' :
          'Der persönliche PayPal-Link wird noch ergänzt. Du kannst die Lernhilfe uneingeschränkt nutzen.',
        actions,
        returnFocus
      });
    } finally {
      supportPending = false;
    }
  };
  document.querySelectorAll('[data-open-support]').forEach(button =>
    button.addEventListener('click', () => window.openSupportDialog()));
})();
