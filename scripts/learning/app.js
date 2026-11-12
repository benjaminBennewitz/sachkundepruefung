/* scripts/learning/app.js */

/**
 * @file Einstieg des Lerntrainers.
 * @description Verbindet Zustand, Lernansicht und Bediensteuerung nach dem Laden der Module.
 * @author Benjamin Bennewitz [B²]
 */
(() => {
  'use strict';

  const trainer = window.LHUNDG_TRAINER;                                      // Gemeinsamer Namensraum mit den zuvor geladenen Modulen.
  const session = new trainer.Session(new URLSearchParams(location.search));  // Aktiver Katalog oder Test einschließlich wiederhergestelltem Lernstand.
  const view = new trainer.LearningView(session);                             // Darstellung und Navigation für genau diesen Lernzustand.

  const controller = new trainer.Controller(session, view);  // Verbindet die Module mit den vorhandenen Bedienelementen.

  trainer.bindFoundations(session);
  controller.start();  // Startet den Trainer erst, nachdem Zustand und Anzeige miteinander verbunden sind.
})();
