/* scripts/ui/common.js */

/**
 * @file Gemeinsame UI-Funktionen.
 * @description Gemeinsame Theme-Steuerung und freiwilliger Unterstützungsdialog aller Seiten.
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
  const paypalUrl = window.SITE_CONFIG?.paypalUrl || '';
  let validPaypal = false;
  try {
    const url = new URL(paypalUrl);
    validPaypal = url.protocol === 'https:' && ['paypal.com', 'www.paypal.com', 'paypal.me',
      'www.paypal.me'
    ].includes(url.hostname);
  } catch { }
  document.querySelectorAll('[data-paypal]')
    .forEach(link => {
      if (validPaypal) {
        link.href = paypalUrl;
        link.hidden = false;
      }
    });
  document.querySelectorAll('[data-support-pending]')
    .forEach(el => {
      el.hidden = validPaypal;
    });
  let supportShown = false;
  let returnFocus = null;
  try {
    supportShown = sessionStorage.getItem('lhundg-support-shown-v1') === '1';
  } catch { }
  const dialog = document.createElement('dialog');
  dialog.className = 'support-dialog';
  dialog.setAttribute('aria-labelledby', 'supportTitle');
  dialog.setAttribute('aria-describedby', 'supportCopy');
  const card = document.createElement('div');
  card.className = 'support-dialog-inner';
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = 'FREIWILLIG. OHNE WERBUNG.';
  const title = document.createElement('h2');
  title.id = 'supportTitle';
  title.textContent = 'Lernen soll kostenlos bleiben.';
  const copy = document.createElement('p');
  copy.id = 'supportCopy';
  copy.textContent =
    'Hier gibt es bewusst keine Werbung: Du sollst in Ruhe lernen und dich konzentrieren können. Für Server und Bereitstellung entstehen trotzdem laufende Kosten. Wenn dir die Lernhilfe etwas bringt, freue ich mich über eine kleine Unterstützung. Alles bleibt auch ohne Beitrag kostenlos. Danke, dass du dabei bist!';
  const actions = document.createElement('div');
  actions.className = 'dialog-actions';
  if (validPaypal) {
    const link = document.createElement('a');
    link.className = 'primary button';
    link.href = paypalUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer external';
    link.textContent = 'Über PayPal unterstützen ↗';
    actions.append(link);
  } else {
    const note = document.createElement('p');
    note.className = 'microcopy';
    note.textContent =
      'Der persönliche PayPal-Link wird noch ergänzt. Du kannst die Lernhilfe uneingeschränkt nutzen.';
    card.append(note);
  }
  const close = document.createElement('button');
  close.className = 'secondary';
  close.type = 'button';
  close.textContent = 'Weiterlernen';
  close.autofocus = true;
  close.addEventListener('click', () => dialog.close());
  actions.append(close);
  const small = document.createElement('p');
  small.className = 'microcopy';
  small.textContent =
    'Externer Zahlungsdienst · Keine Spendenbescheinigung · Kein Kauf zusätzlicher Funktionen.';
  card.prepend(eyebrow, title, copy);
  card.append(actions, small);
  dialog.append(card);
  document.body.append(dialog);
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect
        .top || event.clientY > rect.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    const target = returnFocus;
    returnFocus = null;
    if (target?.isConnected) target.focus({
      preventScroll: true
    });
  });

  /** Öffnet den freiwilligen Unterstützungshinweis automatisch höchstens einmal pro Browsersitzung. */
  window.openSupportDialog = ({
    automatic = false,
    returnFocus: target = document.activeElement
  } = {}) => {
    if (dialog.open || (automatic && supportShown)) return;
    supportShown = true;
    try {
      sessionStorage.setItem('lhundg-support-shown-v1', '1');
    } catch { }
    returnFocus = target;
    close.textContent = automatic ? 'Zum Ergebnis' : 'Weiterlernen';
    dialog.showModal();
  };
  document.querySelectorAll('[data-open-support]')
    .forEach(button => button.addEventListener('click', () => window.openSupportDialog()));
})();
