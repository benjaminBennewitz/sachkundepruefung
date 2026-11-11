/* scripts/ui/controls.js */

/**
 * @file Initialisierung, Außenbedienung und Suchfeld der eigenen Controls.
 * @description Initialisierung, Außenbedienung und Suchfeld der eigenen Controls.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  const controls = [];  // Vorhandene Select-Modelle erhalten jeweils genau eine sichtbare Combobox.

  ui.activeSelect = null;  // Gemeinsamer Verweis auf das aktuell offene Menü, unabhängig von der Instanz.

  /**
   * Synchronisiert programmatisch geänderte native Werte mit den sichtbaren Comboboxen.
   *
   * @returns {void} Kein Rückgabewert.
   */
  function refreshControls() {
    // Die öffentliche Aktualisierung baut nur tatsächlich geänderte sichtbare Controls neu auf.
    for (const control of controls) {
      const text = control.select.selectedOptions[0]?.textContent || 'Bitte auswählen';  // Aktueller nativer Auswahltext.

      // Änderungen von Text oder Sperrzustand müssen auch ohne natives change-Ereignis sichtbar werden.
      if (control.value.textContent !== text || control.trigger.disabled !== control.select.disabled) control.refresh();
    }
  }

  /**
   * Schließt ein aktives Menü bei Maus- oder Fokuswechsel außerhalb seiner beiden DOM-Bereiche.
   *
   * @param {Event} event Pointer- oder Fokusereignis auf Dokumentebene.
   * @returns {void} Kein Rückgabewert.
   */
  function onOutside(event) {
    const active = ui.activeSelect;  // Auslöserrahmen und gesondert eingehängte Listbox gehören zur selben Instanz.

    // Interne Bedienung darf das eigene Menü nicht schließen.
    if (active && !active.root.contains(event.target) && !active.menu.contains(event.target)) active.close();
  }

  /**
   * Hält das aktive Menü beim Seiten-Scroll sichtbar oder schließt es mit seinem verschwundenen Auslöser.
   *
   * @param {Event} event Scrollereignis einschließlich verschachtelter Scrollbereiche.
   * @returns {void} Kein Rückgabewert.
   */
  function onScroll(event) {
    const active = ui.activeSelect;  // Nur das aktuell sichtbare Menü benötigt eine Positionskorrektur.

    // Menüinterner Scroll verändert nicht die Lage des Auslösers auf der Seite.
    if (!active || active.menu.contains(event.target)) return;

    const bounds = active.trigger.getBoundingClientRect();  // Sichtbarer Bereich des zugehörigen Auslösers.

    // Vollständig herausgescrollte Auslöser schließen ihr Menü; sichtbare erhalten eine neue Position.
    if (bounds.bottom < 0 || bounds.top > innerHeight) active.close();
    else active.position();
  }

  /**
   * Bindet die gemeinsamen Außen-, Scroll- und Größenereignisse einmalig auf Dokumentebene.
   *
   * @returns {void} Kein Rückgabewert.
   */
  function bindOutsideEvents() {
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', onOutside);
    addEventListener('resize', () => ui.activeSelect?.position());
    document.addEventListener('scroll', onScroll, true);
  }

  /**
   * Erstellt die bisherigen Suchfeld-Elemente ohne Änderung des vorhandenen Input-Datenmodells.
   *
   * @param {HTMLInputElement} search Vorhandenes Fragen-Suchfeld.
   * @returns {HTMLButtonElement} Zugehöriger Löschbutton.
   */
  function buildSearch(search) {
    const oldLabel = search.closest('label');              // Bisheriger Rahmen wird durch ein getrenntes zugängliches Label ersetzt.
    const group = ui.node('div', '', 'search-label');      // Neuer Rahmen für Beschriftung und Suchfeld.
    const label = ui.node('label', 'Fragen durchsuchen');  // Bisheriger sichtbarer Beschriftungstext.
    const frame = ui.node('div', '', 'search-control');    // Rahmen für Symbol, unveränderten Input und Löschbutton.
    const icon = ui.node('span', '', 'search-symbol');     // Rein dekoratives Suchsymbol aus den vorhandenen Styles.
    const clear = ui.node('button', '×', 'search-clear');  // Eigenständig bedienbarer Löschbutton.

    label.htmlFor = search.id;
    icon.setAttribute('aria-hidden', 'true');
    configureClear(clear, search);
    oldLabel.replaceWith(group);
    frame.append(icon, search, clear);
    group.append(label, frame);

    return clear;
  }

  /**
   * Kennzeichnet den Suchfeld-Löschbutton mit seinem anfänglichen Zustand.
   *
   * @param {HTMLButtonElement} clear Vorbereiteter Löschbutton.
   * @param {HTMLInputElement} search Unverändertes Suchfeld mit seinem Anfangswert.
   * @returns {void} Kein Rückgabewert.
   */
  function configureClear(clear, search) {
    clear.type = 'button';
    clear.setAttribute('aria-label', 'Suche löschen');
    clear.hidden = !search.value;
  }

  /**
   * Leert die Suche und meldet die Änderung mit dem bereits vorhandenen Input-Ereignis.
   *
   * @param {HTMLInputElement} search Aktives Fragen-Suchfeld.
   * @param {HTMLButtonElement} clear Zugehöriger Löschbutton.
   * @returns {void} Kein Rückgabewert.
   */
  function clearSearch(search, clear) {
    search.value = '';
    clear.hidden = true;
    search.dispatchEvent(new Event('input', { bubbles: true }));
    search.focus();
  }

  /**
   * Verbindet die Suche und erhält die bestehende öffentliche Aktualisierungsfunktion.
   *
   * @returns {void} Kein Rückgabewert.
   */
  function initializeSearch() {
    const search = document.querySelector('#search');  // Nur die Lernseite besitzt ein Fragen-Suchfeld.

    // Informationsseiten benötigen keine Suchfeld-Elemente oder zusätzlichen Listener.
    if (!search) return;

    const clear = buildSearch(search);  // Sichtbarer Löschbutton zum unverändert verwendeten Input.

    clear.addEventListener('click', () => clearSearch(search, clear));
    search.addEventListener('input', () => {
      clear.hidden = !search.value;
    });
    window.refreshCustomControls = () => {
      refreshControls();
      clear.hidden = !search.value;
    };
  }

  // Die Reihenfolge erhält native Datenmodelle, bevor die gemeinsamen Außenereignisse aktiv werden.
  for (const select of document.querySelectorAll('select')) controls.push(new ui.CustomSelect(select));

  window.refreshCustomControls = refreshControls;
  bindOutsideEvents();  // Schließt und positioniert ausschließlich das tatsächlich aktive Menü.
  initializeSearch();   // Erweitert die Lernsuche, sofern diese auf der aktuellen Seite vorhanden ist.
})(window.LHUNDG_UI_PARTS);
