/* scripts/ui/learner-state.js */

/**
 * @file Lokale Personenprofile und ihre Speicherschlüssel.
 * @description Trennt Personen von Katalogen und erhält alte Lernstände ohne sichtbares Standardprofil.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  const registryKey = 'lhundg-learners-v1';
  const activeKey = 'lhundg-learner-active-v1';
  const lastKey = 'lhundg-learner-last-v1';
  const goals = Object.freeze({ open: 'Noch offen', para3: '§ 3 · gefährliche Hunde',
    para10: '§ 10 · bestimmte Rassen', para11: '§ 11 · große Hunde' });
  const standard = { id: 'standard', name: 'Dein Lernstand', goal: 'open' };

  /** @returns {object[]} Validierte Personen; unbekannte Daten werden nicht als Schlüssel verwendet. */
  function storedPeople() {
    try {
      const data = JSON.parse(localStorage.getItem(registryKey));
      if (data?.version !== 1 || !Array.isArray(data.people)) return [];
      const seen = new Set();
      const people = data.people.filter(person => {
        if (!person || typeof person.id !== 'string' || !/^(standard|p-[a-z0-9-]{8,60})$/.test(person.id) ||
            seen.has(person.id) || typeof person.name !== 'string' || !person.name.trim() ||
            person.name.length > 32 || !Object.hasOwn(goals, person.goal)) return false;
        seen.add(person.id);
        return true;
      }).slice(0, 13).map(({ id, name, goal, generation }) => ({ id, name, goal,
        generation: typeof generation === 'string' && /^[a-z0-9-]{8,60}$/.test(generation) ? generation : 'legacy' }));
      return people;
    } catch {
      return [];
    }
  }

  /** @returns {object[]} Nur selbst benannte Personen; die frühere Vorgabe bleibt unsichtbar. */
  function list() {
    return storedPeople().filter(person => person.id !== 'standard' || person.name !== 'Standard');
  }

  /** @param {string} id Person. @param {string} [generation] Instanz einer laufenden Sitzung. @returns {boolean} Ob das Profil noch existiert. */
  function has(id, generation) {
    return list().some(person => person.id === id && (generation === undefined || person.generation === generation));
  }

  /** @returns {string} Tabbezogene Auswahl; andere offene Tabs behalten ihre Person. */
  function initialId() {
    try {
      const id = sessionStorage.getItem(activeKey) || localStorage.getItem(lastKey);
      return has(id) ? id : list()[0]?.id || 'standard';
    } catch {
      return 'standard';
    }
  }

  let activeId = initialId();
  try { sessionStorage.setItem(activeKey, activeId); } catch { /* Auswahl bleibt im Arbeitsspeicher. */ }
  let activeNamed = has(activeId);
  let knownProfiles = new Map(list().map(person => [person.id, person.generation]));
  let selected = false;
  try { selected = localStorage.getItem(lastKey) !== null; } catch { /* Standard bleibt benutzbar. */ }

  /** @returns {object} Kopie des aktiven Personenprofils. */
  function current() {
    return list().find(person => person.id === activeId) || list()[0] || { ...standard };
  }

  /**
   * Die historische Kennung verwendet die alten Schlüssel ohne Kopie oder Datenverlust.
   * @param {string} base Bisheriger Lernschlüssel.
   * @param {string} [id] Fest an eine Lernsitzung gebundene Person.
   * @returns {string} Personenbezogener Schlüssel.
   */
  function key(base, id = current().id) {
    if (id === 'standard') return base;
    if (!/^p-[a-z0-9-]{8,60}$/.test(id)) throw new Error('Unbekanntes Personenprofil.');
    return `lhundg-person:${id}:${base}`;
  }

  /**
   * Speichert nur nach erfolgreicher Validierung; Antworten werden niemals mitkopiert.
   * @param {string} name Gewünschter Anzeigename.
   * @param {string} goal Lernziel unabhängig vom gewählten Katalog.
   * @param {string} [id] Vorhandene Person zum Umbenennen.
   * @param {boolean} [inheritLegacy] Übernimmt ausdrücklich den bisherigen unbenannten Lernstand.
   * @returns {object} Gespeichertes Profil.
   */
  function save(name, goal, id, inheritLegacy = false) {
    const clean = String(name).trim().replace(/\s+/g, ' ');
    if (!clean || clean.length > 32) throw new Error('Bitte einen Namen mit 1 bis 32 Zeichen eingeben.');
    if (clean.toLocaleLowerCase('de') === 'standard') throw new Error('Bitte einen persönlichen Profilnamen wählen.');
    if (!Object.hasOwn(goals, goal)) throw new Error('Bitte ein gültiges Lernziel wählen.');
    const people = list();
    if (people.some(person => person.id !== id && person.name.toLocaleLowerCase('de') === clean.toLocaleLowerCase('de'))) {
      throw new Error('Diesen Profilnamen gibt es bereits.');
    }
    if (id && !people.some(person => person.id === id)) throw new Error('Das Profil ist nicht mehr vorhanden.');
    if (!id && people.length >= 12) throw new Error('Es sind höchstens zwölf lokale Profile möglich.');
    const identifier = id || ((!people.length || inheritLegacy) && !has('standard') ? 'standard' : `p-${crypto.randomUUID()}`);
    const generation = people.find(item => item.id === identifier)?.generation || crypto.randomUUID();
    const person = { id: identifier, name: clean, goal, generation };
    const updated = [...storedPeople().filter(item => item.id !== identifier), person];
    try {
      localStorage.setItem(registryKey, JSON.stringify({ version: 1, people: updated }));
      knownProfiles = new Map(list().map(item => [item.id, item.generation]));
    } catch {
      throw new Error('Das Profil konnte nicht gespeichert werden. Bitte Browserspeicher freigeben; Lernen ohne Profil bleibt möglich.');
    }
    return person;
  }

  /**
   * Wechselt nur diesen Tab; laufende Sessions behalten bis zum Neuladen ihre feste Personenkennung.
   * @param {string} id Vorhandenes Profil.
   * @returns {boolean} Ob die Wahl dauerhaft gespeichert werden konnte.
   */
  function select(id) {
    if (!has(id) && !(id === 'standard' && !list().length)) throw new Error('Unbekanntes Personenprofil.');
    activeId = id;
    activeNamed = has(id);
    selected = true;
    let persisted = false;
    try { sessionStorage.setItem(activeKey, id); persisted = true; } catch { /* Lokale Wahl bleibt als Rückfall. */ }
    try { localStorage.setItem(lastKey, id); persisted = true; } catch { /* Der Tab behält seine Auswahl. */ }
    return persisted;
  }

  /**
   * Grenzt alte Lernschlüssel ausdrücklich von gemeinsamen Einstellungen ab.
   * @param {string} base Speicherschlüssel.
   * @param {string} kind Speicherbereich.
   * @returns {boolean} Ob der Schlüssel ausschließlich zum früheren unbenannten Lernstand gehört.
   */
  function legacyKey(base, kind) {
    if (kind === 'sessionStorage') return /^lhundg-(exam34|mgexam|exam11|essenexam|exam)-(v1|meta-v2):/.test(base);
    return /^lhundg-answers-(all-v1|mg-v1|v1|rhein97-v1|koeln-v1|kammer197-v1)$/.test(base) ||
      /^lhundg-meta-(all|mg|legacy203|rhein97|koeln|kammer197)-v2$/.test(base) ||
      ['lhundg-overview-v1', 'lhundg-instant-feedback-v2', 'lhundg-foundations-dismissed-v1'].includes(base);
  }

  /** @param {string} id Person. @param {string} kind Speicherbereich. @returns {Array} Betroffene Schlüssel und Werte. */
  function records(id, kind) {
    const storage = window[kind];
    const prefix = `lhundg-person:${id}:`;
    return Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter(base => base && (id === 'standard' ? legacyKey(base, kind) : base.startsWith(prefix)))
      .map(base => [base, storage.getItem(base)]);
  }

  /** @returns {boolean} Ob ein bisheriger unbenannter Lernstand ausdrücklich übernommen werden kann. */
  function legacyAvailable() {
    if (has('standard')) return false;
    try { return records('standard', 'localStorage').length > 0; } catch { return false; }
  }

  /**
   * Löscht ausschließlich diese Person; bei einem Speicherfehler werden die vorherigen Werte wiederhergestellt.
   * @param {string} id Nach zwei Bestätigungen ausgewählte Person.
   * @returns {void} Kein Rückgabewert.
   */
  function remove(id) {
    if (!has(id)) throw new Error('Dieses Profil ist nicht mehr vorhanden.');
    const remaining = storedPeople().filter(person => person.id !== id);
    const fallback = remaining.find(person => person.id !== 'standard' || person.name !== 'Standard')?.id || 'standard';
    const snapshots = [];
    try {
      for (const kind of ['localStorage', 'sessionStorage']) {
        snapshots.push(...records(id, kind).map(([base, value]) => ({ kind, base, value })));
      }
      snapshots.push({ kind: 'localStorage', base: registryKey, value: localStorage.getItem(registryKey) });
      for (const [kind, base] of [['localStorage', lastKey], ['sessionStorage', activeKey]]) {
        if (window[kind].getItem(base) === id) snapshots.push({ kind, base, value: id });
      }
      /* Die Registry ist der letzte Schreibzugriff und veröffentlicht die Löschung erst nach den übrigen Änderungen. */
      const mutations = [...snapshots.filter(item => item.base !== registryKey),
        ...snapshots.filter(item => item.base === registryKey)];
      for (const item of mutations) {
        const storage = window[item.kind];
        if (item.base === registryKey) storage.setItem(item.base, JSON.stringify({ version: 1, people: remaining }));
        else if (item.base === lastKey || item.base === activeKey) storage.setItem(item.base, fallback);
        else storage.removeItem(item.base);
      }
    } catch {
      for (const item of snapshots) {
        try {
          if (item.value === null) window[item.kind].removeItem(item.base);
          else window[item.kind].setItem(item.base, item.value);
        } catch { /* Ein dauerhaft blockierter Speicher erlaubt auch keine Wiederherstellung. */ }
      }
      throw new Error('Das Profil konnte nicht vollständig gelöscht werden. Bitte den Browserspeicher prüfen.');
    }
    if (activeId === id) { activeId = fallback; activeNamed = has(fallback); }
    knownProfiles = new Map(list().map(person => [person.id, person.generation]));
  }

  /* Andere Tabs entfernen ihre eigenen Teststände und dürfen gelöschte Profile nicht wieder beschreiben. */
  window.addEventListener?.('storage', event => {
    if (event.key !== registryKey && event.key !== null) return;
    const fresh = new Map(list().map(person => [person.id, person.generation]));
    const deleted = [...knownProfiles].filter(([id, generation]) => fresh.get(id) !== generation).map(([id]) => id);
    knownProfiles = fresh;
    if (activeNamed && deleted.includes(activeId)) {
      activeId = list()[0]?.id || 'standard';
      activeNamed = has(activeId);
      try { sessionStorage.setItem(activeKey, activeId); } catch { /* Auswahl bleibt im Arbeitsspeicher. */ }
    }
    for (const id of deleted) {
      try { for (const [base] of records(id, 'sessionStorage')) sessionStorage.removeItem(base); } catch { /* Session verhindert neue Schreibzugriffe. */ }
      window.dispatchEvent(new CustomEvent('lhundg:profile-deleted', { detail: { id } }));
    }
  });

  window.LHUNDG_LEARNERS = Object.freeze({ list, current, key, save, select, goals, has, remove, legacyAvailable, chosen: () => selected });
})();
