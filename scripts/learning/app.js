/* scripts/learning/app.js */

/**
 * @file Einstieg des Lerntrainers.
 * @description Verbindet Zustand, Lernansicht und Bediensteuerung nach dem Laden der Module.
 * @author Benjamin Bennewitz [B²]
 */
(async () => {
  'use strict';

  await window.LHUNDG_LEARNERS_READY;

  const trainer = window.LHUNDG_TRAINER;                                      // Gemeinsamer Namensraum mit den zuvor geladenen Modulen.
  const session = new trainer.Session(new URLSearchParams(location.search));  // Aktiver Katalog oder Test einschließlich wiederhergestelltem Lernstand.
  const view = new trainer.LearningView(session);                             // Darstellung und Navigation für genau diesen Lernzustand.

  const controller = new trainer.Controller(session, view);  // Verbindet die Module mit den vorhandenen Bedienelementen.

  window.addEventListener('lhundg:before-profile-change', () => session.persist());
  window.addEventListener('lhundg:profile-deleted', event => {
    if (session.namedLearner && event.detail.id === session.learnerId) {
      location.replace(new URL('lernen.html#trainer', location.href).href);
    }
  });
  trainer.bindFoundations(session);
  controller.start();  // Startet den Trainer erst, nachdem Zustand und Anzeige miteinander verbunden sind.
})();
