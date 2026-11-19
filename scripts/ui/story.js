/* scripts/ui/story.js */

/**
 * @file Persönliche Entstehungsgeschichte des Hunde-Sachkundetrainers.
 * @description Ergänzt die bestehende Modal-Steuerung um einen verlinkbaren, redaktionellen Projektbericht.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  /**
   * Erzeugt den ausschließlich projektseitig gepflegten, vertrauenswürdigen Inhalt der Geschichte.
   *
   * @returns {HTMLElement} Artikel mit Foto und persönlichem Bericht.
   */
  function storyContent() {
    const article = document.createElement('article');

    article.className = 'story-content';
    article.innerHTML = `
      <figure class="story-photo">
        <img src="assets/public/du-und-ich.webp" width="1440" height="956"
          alt="Benjamin und seine Hündin auf einem Felsen vor einem Wasserfall." decoding="async">
      </figure>
      <div class="story-copy">
        <p>Am 15. September 2026 musste ich mich von meiner geliebten Hündin verabschieden. Wer schon einmal einen Hund verloren hat, weiß, welche Leere ein solcher Abschied hinterlässt. Ich hatte mir fest vorgenommen, erst einmal keinen neuen Hund aufzunehmen. Ich wollte mir Zeit geben, zu trauern und den Verlust zu verarbeiten.</p>
        <p>Aber das Herz hält sich bekanntlich nicht immer an die Vorsätze des Verstandes.</p>
        <p>Denn natürlich stöberte ich trotzdem auf den Webseiten verschiedener Tierheime. Nur mal schauen, ganz unverbindlich. Und plötzlich war er da: ein Staffordshire-Mischling, in den ich mich auf Anhieb schockverliebte. So viel also zu meinen guten Vorsätzen.</p>
        <p>Mit diesem Moment begann eine unerwartete Reise.</p>
        <p>Ich informierte mich über die besonderen Voraussetzungen zur Haltung eines solchen Hundes in NRW und stieß dabei schnell auf ein Problem: Es gab jede Menge allgemeine Informationen, aber kaum konkrete Antworten. Gerade zum Ablauf der Sachkundeprüfung in Mönchengladbach fand ich erstaunlich wenig.</p>
        <p>Erst auf persönliche Nachfrage beim Veterinäramt erhielt ich die Informationen, nach denen ich gesucht hatte. Und ich dachte mir: <strong>Das muss doch einfacher gehen!</strong></p>
        <p>Also begann ich, Fragenkataloge zu vergleichen, Informationen zusammenzutragen und Veterinärämter in ganz NRW persönlich anzuschreiben. Bis heute versuche ich auf diesem Weg, möglichst verlässliche Auskünfte zu bekommen und Unterschiede zwischen den einzelnen Prüfungsstellen verständlich darzustellen.</p>
        <p>Dabei sollte der Sachkundetrainer ursprünglich gar nicht öffentlich werden. Eigentlich wollte ich nur gemütlich auf dem Sofa sitzen und meine Prüfungsfragen am Fernseher üben. Daher stammt übrigens auch der TV-Modus, den man bis heute aktivieren kann.</p>
        <p>Doch aus dieser kleinen privaten Lernhilfe wurde nach und nach ein kostenloses, unabhängiges Projekt, das hoffentlich auch anderen Menschen die Vorbereitung erleichtert. Ohne Anmeldung, ohne Werbung und mit dem Anspruch, offizielle Quellen, bestätigte Auskünfte und eigene Ergänzungen transparent voneinander zu unterscheiden.</p>
        <p>Und irgendwie führt mich diese ganze Geschichte immer wieder zu ihrem eigentlichen Anfang zurück.</p>
        <p class="story-dedication"><strong>Zu meiner Hündin.</strong></p>
        <p>Ohne sie hätte ich mich vielleicht nie wieder so intensiv mit dem Thema Hundehaltung beschäftigt. Ohne den Schmerz ihres Verlustes hätte ich vermutlich nicht auf diesen Tierheimseiten gestöbert. Ohne diesen einen Staffordshire-Mischling hätte ich mich nicht auf die Suche nach all diesen Informationen gemacht.</p>
        <p>Und ohne diese Suche gäbe es diesen Trainer nicht.</p>
        <p class="story-quote"><strong>Manchmal hinterlassen unsere Hunde eben weit mehr als Pfotenabdrücke in unserem Leben.</strong></p>
        <p>Wenn dieses Projekt heute einem Menschen hilft, sich ein wenig sicherer auf seinen neuen vierbeinigen Begleiter vorzubereiten, dann ist daraus etwas Gutes entstanden.</p>
        <p>Und vielleicht ist das auch eine besonders schöne Art, meiner Hündin ein kleines Stück von dem zurückzugeben, was sie mir all die Jahre geschenkt hat.</p>
        <p class="story-signature"><strong>Benjamin Bennewitz</strong><span>Initiator des Hunde-Sachkundetrainers NRW</span></p>
      </div>`;

    return article;
  }

  /**
   * Öffnet die Geschichte über das bestehende native Dialogsystem einschließlich Fokus-Rückgabe.
   *
   * @param {Modal} modal Gemeinsame Dialoginstanz.
   * @param {HTMLElement | null} trigger Auslöser oder null bei direktem Aufruf per URL-Fragment.
   * @returns {void} Kein Rückgabewert.
   */
  function showStory(modal, trigger) {
    const content = storyContent();

    void modal.open({
      title: 'Die Geschichte hinter dem Sachkundetrainer',
      message: 'Manchmal entstehen die schönsten Dinge aus Momenten, mit denen man nie gerechnet hätte.',
      content,
      returnFocus: trigger || undefined,
      closeButton: true,
      actions: [{ label: 'Schließen', value: 'close', primary: true }]
    });
  }

  /**
   * Verbindet Footer-Verweise und einen direkt teilbaren Fragmentlink mit der bestehenden Dialoginstanz.
   *
   * @param {Modal} modal Gemeinsame Dialoginstanz.
   * @returns {void} Kein Rückgabewert.
   */
  ui.bindStory = modal => {
    for (const link of document.querySelectorAll('[data-open-story]')) {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        showStory(modal, link);
      });
    }

    if (window.location.hash === '#geschichte') showStory(modal, null);
    window.addEventListener('hashchange', () => {
      if (window.location.hash === '#geschichte' && !modal.dialog.open) showStory(modal, null);
    });
  };
})(window.LHUNDG_UI_PARTS);
