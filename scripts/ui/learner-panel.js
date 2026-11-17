/* scripts/ui/learner-panel.js */

/**
 * @file Profilwahl vor dem Lernen und auf der Startseite.
 * @description Nutzt den gemeinsamen Dialog für Auswahl, Neuanlage und Bearbeitung lokaler Personenprofile.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(ui => {
  /** @param {object} modal Gemeinsame Modalsteuerung mit Release-Warteschlange. */
  ui.bindLearners = function bindLearners(modal) {
    const people = window.LHUNDG_LEARNERS;
    if (!people) return;
    const learning = document.body.classList.contains('learning-page');
    let opening = false;

    /** @returns {void} Aktualisiert die sichtbare Person und die passende Orientierung. */
    function refresh() {
      const person = people.current();
      for (const label of document.querySelectorAll('[data-learner-name]')) label.textContent = person.name;
      for (const label of document.querySelectorAll('[data-learner-goal]')) label.textContent = people.goals[person.goal];
    }

    /** @param {string} id Ausgewählte Person. @returns {Promise<boolean>} Ob gewechselt werden darf. */
    async function activate(id, prepared = false) {
      const previous = people.current().id;
      const changed = id !== previous;
      const initial = !people.chosen();
      if (learning && changed && people.chosen() && !prepared) {
        const accepted = await window.LHUNDG_UI.confirm({ title: 'Personenprofil wechseln?',
          message: 'Der aktuelle Stand bleibt bei diesem Profil gespeichert. Ein laufender Test wird verlassen und bleibt in dieser Browsersitzung bei der bisherigen Person erhalten.',
          confirmLabel: 'Profil wechseln' });
        if (!accepted) return false;
      }
      if (!prepared) window.dispatchEvent(new Event('lhundg:before-profile-change'));
      const persisted = people.select(id);
      if (!persisted) window.LHUNDG_UI.toast('Die Profilwahl konnte nicht dauerhaft gespeichert werden.', { type: 'warning' });
      if (!persisted && learning && changed) {
        people.select(previous);
        return false;
      }
      if (learning && (changed || prepared) && !initial) {
        const target = new URL(location.href);
        /* Eine fremde Person erhält keine laufende Prüfungsfolge oder Importaktion als Einstieg. */
        if (changed) target.searchParams.delete('ids');
        target.searchParams.delete('action');
        target.hash = 'trainer';
        const mode = target.searchParams.get('mode');
        if (changed && ['exam34', 'mgexam', 'exam11', 'essenexam'].includes(mode)) target.searchParams.delete('mode');
        if (!target.searchParams.has('mode') && people.current().goal === 'para11') target.searchParams.set('mode', 'kammer197');
        location.assign(target.href);
      } else {
        refresh();
        window.dispatchEvent(new Event('lhundg:profile-change'));
      }
      return true;
    }

    /** @param {string} id Person. @param {HTMLElement} origin Fokusziel. @returns {Promise<void>} Zwei Prüfungen und Löschung. */
    async function deletePerson(id, origin) {
      const person = people.list().find(item => item.id === id);
      if (!person) return;
      const first = await window.LHUNDG_UI.confirm({ title: `Profil „${person.name}“ löschen?`,
        message: 'Damit werden die Antworten, Merker, Bewertungen und Lernstände dieser Person in allen Katalogen entfernt. Sichere den Lernstand vorher, wenn du ihn behalten möchtest.',
        confirmLabel: 'Weiter zum Löschen', danger: true });
      if (!first) return;
      const second = await window.LHUNDG_UI.confirm({ title: 'Endgültig löschen?',
        message: `Letzte Bestätigung: Das Profil „${person.name}“ samt seinen lokalen Lern- und Testständen wird gelöscht. Andere Profile bleiben erhalten. Ohne Sicherung lässt sich dies nicht rückgängig machen.`,
        confirmLabel: 'Ja, Profil endgültig löschen', danger: true });
      if (!second) return;
      const active = people.current().id === id;
      try {
        people.remove(id);
        window.LHUNDG_UI.toast(`Profil „${person.name}“ gelöscht.`, { type: 'success' });
        if (learning && active) {
          location.assign(new URL('lernen.html#trainer', location.href).href);
        } else {
          refresh();
          window.dispatchEvent(new Event('lhundg:profile-change'));
          origin?.focus({ preventScroll: true });
        }
      } catch (failure) {
        window.LHUNDG_UI.toast(failure.message, { type: 'warning', duration: 0 });
      }
    }

    /** @param {HTMLElement} origin Auslöser für die Fokus-Rückgabe. @returns {Promise<void>} Dialogende. */
    async function open(origin) {
      if (opening) return;
      opening = true;
      const content = ui.node('div', '', 'learner-panel');
      const list = ui.node('div', '', 'learner-options');
      const form = ui.node('form', '', 'learner-form');
      const title = ui.node('h3', 'Neues Profil anlegen');
      const nameLabel = ui.node('label', 'Name oder Spitzname');
      const name = ui.node('input');
      Object.assign(name, { id: 'learnerName', name: 'learnerName', maxLength: 32, required: true, autocomplete: 'off' });
      nameLabel.htmlFor = name.id;
      const goalLabel = ui.node('label', 'Worauf bereitest du dich vor?');
      const goal = ui.node('select');
      goal.id = 'learnerGoal';
      goalLabel.htmlFor = goal.id;
      for (const [value, label] of Object.entries(people.goals)) {
        const option = ui.node('option', label);
        option.value = value;
        goal.append(option);
      }
      const hint = ui.node('p', people.list().length ? 'Das Lernziel gibt Orientierung. Alle Kataloge bleiben frei wählbar.' :
        'Dein bisheriger Lernstand wird beim ersten Profil übernommen. Alle Kataloge bleiben frei wählbar.', 'microcopy');
      const inherit = ui.node('input');
      inherit.type = 'checkbox';
      const inheritLabel = ui.node('label', '', 'learner-inherit');
      inheritLabel.append(inherit, document.createTextNode('Bisherigen unbenannten Lernstand übernehmen'));
      inheritLabel.hidden = !people.list().length || !people.legacyAvailable();
      const error = ui.node('p', '', 'learner-error');
      error.setAttribute('role', 'alert');
      const submit = ui.node('button', 'Profil anlegen und verwenden', 'primary');
      submit.type = 'submit';
      form.append(title, nameLabel, name, goalLabel, goal, inheritLabel, hint, error, submit);
      content.append(list, form);
      let editing;

      /** @returns {void} Zeigt alle Personen; Profilnamen werden ausschließlich als Text gesetzt. */
      function render() {
        list.replaceChildren();
        for (const person of people.list()) {
          const row = ui.node('div', '', 'learner-option');
          const choose = ui.node('button', person.name, 'secondary');
          choose.type = 'button';
          choose.dataset.personId = person.id;
          choose.setAttribute('aria-pressed', String(person.id === people.current().id));
          const detail = ui.node('span', people.goals[person.goal], 'microcopy');
          choose.append(detail);
          const edit = ui.node('button', 'Bearbeiten', 'secondary');
          edit.type = 'button';
          edit.setAttribute('aria-label', `${person.name} bearbeiten`);
          edit.addEventListener('click', () => {
            editing = person.id;
            inherit.checked = false;
            inheritLabel.hidden = true;
            name.value = person.name;
            goal.value = person.goal;
            title.textContent = 'Profil bearbeiten';
            submit.textContent = 'Speichern und auswählen';
            error.textContent = '';
            name.focus();
          });
          const remove = ui.node('button', 'Löschen', 'danger-button');
          remove.type = 'button';
          remove.setAttribute('aria-label', `${person.name} löschen`);
          remove.addEventListener('click', () => modal.dialog.close(`delete:${person.id}`));
          row.append(choose, edit, remove);
          list.append(row);
        }
      }
      render();
      /* Die Wahl schließt zunächst diesen Dialog; Bestätigungen nutzen danach dieselbe Warteschlange. */
      list.addEventListener('click', event => {
        const button = event.target.closest('[data-person-id]');
        if (button) modal.dialog.close(button.dataset.personId);
      });
      form.addEventListener('submit', event => {
        event.preventDefault();
        try {
          window.dispatchEvent(new Event('lhundg:before-profile-change'));
          const person = people.save(name.value, goal.value, editing, !editing && inherit.checked);
          modal.dialog.close(`saved:${person.id}`);
        } catch (failure) {
          error.textContent = failure.message;
        }
      });
      try {
        const result = await modal.open({ title: 'Wer lernt heute?',
          message: 'Jede Person hat eigene Lernstände und Merker. Alles bleibt in diesem Browser – ohne Konto und ohne Zugriffsschutz.',
          content, closeButton: true, returnFocus: origin, actions: [] });
        if (result.startsWith('delete:')) await deletePerson(result.slice(7), origin);
        else if (result.startsWith('saved:')) await activate(result.slice(6), true);
        else if (people.list().some(person => person.id === result)) await activate(result);
        else people.select(people.current().id);
        refresh();
        window.dispatchEvent(new Event('lhundg:profile-change'));
      } finally {
        opening = false;
      }
    }

    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-open-learners]');
      if (trigger) { event.preventDefault(); void open(trigger); }
      const select = event.target.closest('[data-select-learner]');
      if (select) void activate(select.dataset.selectLearner);
    });
    window.addEventListener('pageshow', refresh);
    window.addEventListener('storage', refresh);
    refresh();
    /* Release zuerst; der gemeinsame Dialog reiht die Profilwahl vor dem Grundlagenhinweis ein. */
    if (learning && !people.chosen()) return open(document.querySelector('[data-open-learners]'));
    return Promise.resolve();
  };
})(window.LHUNDG_UI_PARTS);
