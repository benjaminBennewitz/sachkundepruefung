/* scripts/quality/session.test.cjs */

/**
 * @file Regressionstests für Lernzustand und Sicherungen.
 * @description Prüft Speicherschlüssel, Testisolation und validierten Import ohne Browserabhängigkeit.
 * @author Benjamin Bennewitz [B²]
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { environment, session, save, plain } = require('./learning-fixtures.cjs');

test('Alle Kataloge behalten ihre Antwort- und Metadatenschlüssel', () => {
  const env = environment();  // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.

  // Unveränderte historische Antwortschlüssel in derselben Reihenfolge wie die Katalogprofile.
  const keys = [
    'lhundg-answers-all-v1',
    'lhundg-answers-mg-v1',
    'lhundg-answers-v1',
    'lhundg-answers-rhein97-v1',
    'lhundg-answers-koeln-v1',
    'lhundg-answers-kammer197-v1'
  ];

  // Jeder Katalog besitzt einen eigenen dauerhaften Antwort- und Metadatenbereich.
  ['all', 'mg', 'legacy203', 'rhein97', 'koeln', 'kammer197'].forEach((mode, index) => {
    const current = session(env, `mode=${mode}`);  // Reales Profil mit seinem unveränderten Speicherschlüssel.

    assert.equal(current.answerKey, keys[index]);
    assert.equal(current.metaKey, `lhundg-meta-${mode}-v2`);
    assert.equal(current.kind, 'localStorage');
  });
});

test('Gesamtpool übernimmt alte Basispool-Antworten nur ohne eigenen Lernstand', () => {
  const env = environment();  // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.

  save(env.scope.localStorage, 'lhundg-answers-mg-v1', { 1: ['A'] });

  assert.deepEqual(plain(session(env).serializeAnswers()), { 1: ['A'] });
  // Auch ein absichtlich leerer eigener Stand verhindert die erneute Übernahme alter Antworten.
  save(env.scope.localStorage, 'lhundg-answers-all-v1', {});

  assert.deepEqual(plain(session(env).serializeAnswers()), {});
});

test('Bewertungen werden nur für dieselbe Auswahl, bekannte Merker und Positionen wiederhergestellt', () => {
  const env = environment();                           // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.
  const uid = env.scope.LHUNDG_DATA.legacy203[1].uid;  // Zweite Katalogfrage als wiederherzustellende Leseposition.

  save(env.scope.localStorage, 'lhundg-answers-v1', { 1: ['A', 'B'], 2: ['C'] });
  save(env.scope.localStorage, 'lhundg-meta-legacy203-v2', {
    checked: { 1: 'A|B', 2: 'A' },
    bookmarks: [1, 999999],
    position: uid,
    view: 'list'
  });

  const current = session(env, 'mode=legacy203');  // Aktiver Katalog mit dauerhaftem Lernstand.

  assert.equal(current.state.checked.get(1), 'A|B');
  assert.equal(current.state.checked.has(2), false);
  assert.deepEqual([...current.state.bookmarks], [1]);
  assert.equal(current.state.index, 1);
  assert.equal(current.state.view, 'list');
});

test('Jedes Prüfungsprofil sichert ausschließlich sitzungsbezogen und erhält seine Testfolge', () => {
  const env = environment();  // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.

  // Alle Prüfungsprofile müssen ihre Auswahl ausschließlich im Sitzungsspeicher ablegen.
  for (const mode of ['exam34', 'exam11', 'mgexam', 'essenexam']) {
    const current = session(env, `mode=${mode}`);                          // Reales Profil mit seinem unveränderten Speicherschlüssel.
    const ids = current.questions.map(question => question.id).join(',');  // Die Reihenfolge wird über die URL wiederhergestellt.
    const restored = session(env, `mode=${mode}&ids=${ids}`);              // Zweiter Aufruf derselben Testfolge.

    assert.equal(restored.answerKey, current.answerKey);
    assert.equal(current.kind, 'sessionStorage');

    // Das historische MG-Präfix lautet exam und muss für vorhandene Sitzungen erhalten bleiben.
    const metaMode = mode === 'mgexam' ? 'exam' : mode;  // Historisches Metadatenpräfix; MG-Simulationen verwenden weiterhin exam.

    assert(current.metaKey.startsWith(`lhundg-${metaMode}-meta-v2:`));
    current.persist();
  }

  assert.equal(env.scope.localStorage.values.size, 0);
});

test('Ungültige und doppelte Test-IDs werden vollständig durch eine eindeutige Auswahl ersetzt', () => {
  const env = environment();  // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.

  // Zu kurze, doppelte und unbekannte ID-Folgen dürfen keine unvollständige Prüfung erzeugen.
  for (const ids of ['1,2', Array(34).fill(1).join(','), Array(34).fill(999999).join(',')]) {
    const current = session(env, `mode=exam34&ids=${ids}`);  // Ungültige Parameter lösen eine vollständige Neuauswahl aus.

    assert.equal(current.questions.length, 34);
    assert.equal(new Set(current.questions.map(question => question.id)).size, 34);
    assert(current.questions.every(question => env.scope.LHUNDG_DATA.legacy203.includes(question)));
  }
});

test('Ein laufender Test zeigt keine gespeicherten Bewertungen vor dem Abschluss', () => {
  const env = environment();                                                            // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.
  const current = session(env, 'mode=exam34');                                          // Sitzung mit zufällig bestimmter 34er-Testfolge.
  const question = current.questions[0];                                                // Eine einzige beantwortete Frage genügt für den Wiederherstellungstest.
  const query = `mode=exam34&ids=${current.questions.map(item => item.id).join(',')}`;  // Identische Auswahl vor und nach Abschluss.

  current.state.answers.set(question.id, new Set(question.correct));
  current.state.checked.set(question.id, current.signature(question));
  current.persist();

  assert.equal(session(env, query).state.checked.size, 0);
  current.state.finished = true;  // Erst der abgeschlossene Test darf seine gespeicherten Bewertungen zeigen.
  current.persist();

  assert.equal(session(env, query).state.checked.size, 1);
});

test('Gesperrter Speicher unterbricht Lernen nicht und meldet sich nur einmal', () => {
  const env = environment();  // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.

  env.scope.localStorage.getItem = () => {
    throw new Error('blocked');
  };  // Simuliert verweigerten Browserzugriff.
  env.scope.localStorage.setItem = () => {
    throw new Error('blocked');
  };

  const current = session(env);  // Lernen muss trotz gesperrtem Speicher weiterlaufen.

  current.state.answers.set(1, new Set(['A']));
  current.persist();  // Erster Speicherfehler meldet die Warnung.
  current.persist();  // Wiederholter Fehler darf keine zweite identische Meldung erzeugen.

  assert.equal(current.state.answers.get(1).has('A'), true);
  assert.equal(env.messages.length, 1);
  assert.equal(env.messages[0][1].key, 'storage-failed');
});

test('Ungültiger Import wird vor jeder Speicheränderung verworfen', async () => {
  const env = environment();                                    // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.
  const progress = new env.trainer.Progress(session(env), {});  // Importvalidierung benötigt keine echte DOM-Ansicht.
  // Ein gültiger erster Katalog darf bei ungültigem zweitem Katalog noch nicht gespeichert werden.
  // Gültiger erster und ungültiger zweiter Importkatalog zur Prüfung atomarer Validierung.
  const data = {
    format: 'lhundg-learning',
    version: 1,
    catalogues: {
      legacy203: { answers: { 1: ['A'] }, bookmarks: [] },
      koeln: { answers: { 999999: ['X'] }, bookmarks: [] }
    }
  };

  await assert.rejects(progress.readFile({ size: 100, text: async () => JSON.stringify(data) }), /ungültige/);
  await assert.rejects(progress.readFile({ size: 4, text: async () => 'null' }), /unterstützte/);

  assert.equal(env.scope.localStorage.values.size, 0);
});

test('Import ersetzt gleiche Antworten, vereinigt Merker und setzt Bewertungen zurück', () => {
  const env = environment();                       // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.
  const current = session(env, 'mode=legacy203');  // Aktiver Katalog mit dauerhaftem Lernstand.

  save(env.scope.localStorage, current.answerKey, { 1: ['A'], 2: ['B'] });
  save(env.scope.localStorage, current.metaKey, { checked: { 1: 'A' }, bookmarks: [2], view: 'list' });

  const progress = new env.trainer.Progress(current, {});  // Prüft den echten Import-/Exportdienst ohne Rendering.

  progress.merge(progress.validateCatalogue('legacy203', current.config, { answers: { 1: ['C'] }, bookmarks: [1] }));

  assert.deepEqual(plain(current.serializeAnswers()), { 1: ['C'], 2: ['B'] });
  assert.deepEqual([...current.state.bookmarks], [2, 1]);

  const meta = JSON.parse(env.scope.localStorage.getItem(current.metaKey));  // Kontrolliert den gespeicherten Zustand nach dem Merge.

  assert.deepEqual(meta.checked, {});
  assert.equal(meta.view, 'list');
});

test('Export schließt Prüfungsdaten aus und nutzt bei Speichersperren den aktiven Zustand', () => {
  const env = environment();                       // Frischer VM-Kontext mit getrennten Speicherersatzobjekten je Test.
  const current = session(env, 'mode=legacy203');  // Aktiver Katalog mit dauerhaftem Lernstand.

  current.state.answers.set(1, new Set(['B']));

  const progress = new env.trainer.Progress(current, {});  // Prüft den echten Import-/Exportdienst ohne Rendering.

  // Der Export muss bei tatsächlich blockiertem Lesen den aktiven Lernstand weiter bereitstellen.
  env.scope.localStorage.getItem = () => {
    throw new Error('blocked');
  };  // Simuliert verweigerten Browserzugriff.

  const data = progress.collectCatalogues();  // Ausschließlich dauerhafte Kataloge gehören in die Sicherung.

  assert.equal(current.storageFailed, true);
  assert.deepEqual(plain(data.legacy203.answers), { 1: ['B'] });
  assert.deepEqual(Object.keys(data), ['all', 'mg', 'legacy203', 'rhein97', 'koeln', 'kammer197']);
});
