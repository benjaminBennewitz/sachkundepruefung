/* scripts/learning/foundations.js */

/**
 * @file Begrüßung und freiwillige Grundlagen.
 * @description Nutzt das gemeinsame Modal und lädt den Lesetext aus derselben eigenständigen HTML-Seite.
 * @author Benjamin Bennewitz [B²]
 */

/**
 * Verbindet den dauerhaften Zugang mit einer einmaligen Begrüßung im Lernmodus.
 * @param {TrainerSession} session Vorhandene Sitzung einschließlich Speicherschutz.
 * @returns {void} Kein Rückgabewert.
 */
window.LHUNDG_TRAINER.bindFoundations = session => {
  const link = document.getElementById('foundationsLink');
  const key = 'lhundg-foundations-dismissed-v1';
  let opening = false;

  /**
   * Lädt ausschließlich den Grundlagenbereich der lokalen Inhaltsseite in das bestehende Modal.
   * @returns {Promise<void>} Abschluss nach Schließen; bei Ladefehlern öffnet die normale HTML-Seite.
   */
  async function readFoundations() {
    try {
      const response = await fetch('grundlagen.html');
      if (!response.ok) throw new Error('Grundlagen nicht verfügbar');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const section = page.getElementById('grundlagen');
      if (!section) throw new Error('Grundlagenbereich fehlt');
      section.querySelector('#foundationsTitle')?.remove();
      section.removeAttribute('aria-labelledby');
      /* Innerhalb des Dialogs stehen Kapitel unter dessen Überschrift der zweiten Ebene. */
      for (const heading of section.querySelectorAll('h2')) {
        const subheading = page.createElement('h3');
        subheading.textContent = heading.textContent;
        heading.replaceWith(subheading);
      }
      section.querySelector('.foundations-return')?.closest('p').remove();
      const content = document.importNode(section, true);
      const pageLink = document.createElement('a');
      pageLink.href = 'grundlagen.html';
      pageLink.textContent = 'Als Seite öffnen →';
      content.prepend(pageLink);
      await window.LHUNDG_UI.modal({
        title: 'Grundlagen',
        message: 'Freiwilliges Lernmaterial. Für die Bewertung gilt weiterhin der Lösungsschlüssel der jeweiligen Quelle.',
        content,
        returnFocus: link,
        actions: [{ label: 'Weiterlernen', value: 'close', primary: true }]
      });
    } catch {
      window.location.assign('grundlagen.html');
    }
  }

  /**
   * Verhindert parallele Begrüßungen und merkt nur den geschlossenen Einstieg, keinen Lesefortschritt.
   * @param {boolean} automatic Ob die Begrüßung beim Seitenstart ausgelöst wurde.
   * @returns {Promise<void>} Abschluss nach Begrüßung und gegebenenfalls freiwilligem Lesen.
   */
  async function welcome(automatic) {
    if (opening) return;
    opening = true;
    try {
      const action = await window.LHUNDG_UI.modal({
        eyebrow: automatic ? 'Willkommen beim Sachkundetrainer' : 'Dein Einstieg',
        title: 'Grundlagen',
        message: 'Du kannst direkt mit den Fragen starten. Wenn du dich zuerst einlesen möchtest, findest du hier die Grundlagen. Nach dem Prüfen hilft dir bei ausgewählten Fragen „Antwort verstehen“ weiter.',
        returnFocus: automatic ? document.getElementById('trainer') : link,
        actions: [
          { label: 'Grundlagen lesen', value: 'read' },
          { label: automatic ? 'Jetzt lernen' : 'Weiterlernen', value: 'learn', primary: true, autofocus: true }
        ]
      });
      session.write('localStorage', key, true);
      if (action === 'read') await readFoundations();
    } finally {
      opening = false;
    }
  }

  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    void welcome(false);
  });
  const automatic = !session.isExam && session.state.view !== 'tv' && !session.params.has('action');
  if (automatic && session.read('localStorage', key, false) !== true) void welcome(true);
};
