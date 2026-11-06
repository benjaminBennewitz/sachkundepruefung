/* global LHUNDG_DATA, LHUNDG_CORE, LHUNDG_SOURCES */
(() => {
  'use strict';
  const { exact, randomQuestions, validAnswers, complete } = LHUNDG_CORE;
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const modes = {
    all: { pool: 'allPool', title: 'Alle Quellen', key: 'lhundg-answers-all-v1', description: '400 Fragen und Quellenvarianten. Kammerfragen nach § 11 ergänzen den bisherigen §-3-Basispool.' },
    mg: { pool: 'mgPool', title: '§-3-Basispool', key: 'lhundg-answers-mg-v1', description: '398 Fragen aus den bereitgestellten Rhein-Erft- und Köln-Katalogen. Keine unveröffentlichten MG-Originalfragen.' },
    legacy203: { pool: 'legacy203', title: 'Rhein-Erft · 203 Fragen', key: 'lhundg-answers-v1', description: 'Bisheriger §-3-/§-10-Katalog mit seinem eigenen Lösungsschlüssel. Dein alter Lernstand bleibt erhalten.' },
    rhein97: { pool: 'rhein97', title: 'Rhein-Erft · 97 Fragen', key: 'lhundg-answers-rhein97-v1', description: 'Zugesandter Übungsbogen mit Multiple Choice und Zuordnungen. Öffentliche Originaladresse bisher nicht belegt.' },
    koeln: { pool: 'koeln', title: 'Köln · A / B / C', key: 'lhundg-answers-koeln-v1', description: '115 aktive Fragen aus dem bereitgestellten Übungsbogen. A11 entfällt im Original.' },
    kammer197: { pool: 'kammer197', title: 'Tierärztekammern · 197 Fragen', key: 'lhundg-answers-kammer197-v1', description: 'Gemeinsamer Katalog ab 2025 für § 11. Ergänzendes Wissen für § 3; kein amtlicher §-3-Prüfungsbogen.' },
    exam34: { pool: 'legacy203', title: 'Rhein-Erft-Test · 34 Fragen', key: null, examCount:34, passCount:24, description:'34 zufällige Fragen aus dem Rhein-Erft-203-Katalog. Übung nach dessen veröffentlichten Eckdaten: mindestens 24 richtig, kein Originalprüfungsbogen.' },
    exam11: { pool:'kammer197', title:'§-11-Übungsrunde · 30 Fragen', key:null, examCount:30, passCount:null, description:'30 zufällige Kammerfragen für große Hunde. Lernquote ohne verbindliche Bestehensgrenze; das erforderliche Gespräch und die Entscheidung der prüfenden Stelle werden nicht simuliert.' },
    mgexam: { pool: 'mgPool', title: 'MG-Simulation · 119 Fragen', key: null, examCount:119, passCount:90, description: 'Ohne Zeitlimit. Bestanden ab 90 richtigen Antworten. Nach privat mitgeteilten Eckdaten; keine Originalprüfung.' }
  };
  const mode = Object.hasOwn(modes, params.get('mode')) ? params.get('mode') : 'all';
  const config = modes[mode];
  const isExam = Number.isInteger(config.examCount);
  let storageFailed = false;

  /** Fehler im privaten Modus oder bei Speicherlimits dürfen das Lernen nicht abbrechen. */
  function readStorage(kind, key, fallback = null) {
    try { const raw = window[kind].getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch { storageFailed = true; return fallback; }
  }
  /** Speichert ausschließlich Lern- und UI-Daten unter fest vorgegebenen Schlüsseln. */
  function writeStorage(kind, key, value) {
    try { window[kind].setItem(key, JSON.stringify(value)); }
    catch { storageFailed = true; showStorageWarning(); }
  }
  function showStorageWarning() {
    if (!storageFailed) return;
    $('storageNote').textContent = 'Dein Browser blockiert die Speicherung oder der Speicher ist voll. Du kannst weiterlernen; sichere deinen Lernstand vor dem Schließen über „Lernstand sichern“.';
  }
  const pool = LHUNDG_DATA[config.pool];
  let questions = pool;
  if (isExam) {
    const ids = (params.get('ids') || '').split(',').filter(Boolean).map(Number);
    const byId = new Map(pool.map(q => [q.id, q]));
    questions = ids.length === config.examCount && new Set(ids).size === config.examCount && ids.every(id => byId.has(id))
      ? ids.map(id => byId.get(id)) : randomQuestions(pool, config.examCount);
    const url = new URL(location.href);
    url.searchParams.set('ids', questions.map(q => q.id).join(','));
    history.replaceState(null, '', url);
  }
  const kind = isExam ? 'sessionStorage' : 'localStorage';
  const answerKey = isExam ? `lhundg-${mode}-v1:${questions.map(q => q.id).join('-')}` : config.key;
  const metaKey = isExam ? `lhundg-${mode === 'mgexam' ? 'exam' : mode}-meta-v2:${questions.map(q => q.id).join('-')}` : `lhundg-meta-${mode}-v2`;
  const rawMeta = readStorage(kind, metaKey, {});
  const savedMeta = rawMeta && typeof rawMeta === 'object' && !Array.isArray(rawMeta) ? rawMeta : {};
  let savedAnswers = readStorage(kind, answerKey);
  if (mode === 'all' && savedAnswers === null) savedAnswers = readStorage('localStorage', modes.mg.key, {});
  const state = {
    answers: validAnswers(savedAnswers, questions),
    bookmarks: new Set(Array.isArray(savedMeta.bookmarks) ? savedMeta.bookmarks.filter(id => questions.some(q => q.id === id)) : []),
    checked: new Map(),
    finished: isExam && savedMeta.finished === true,
    view: params.get('tv') === '1' ? 'tv' : ['focus', 'list', 'tv'].includes(savedMeta.view) ? savedMeta.view : 'focus',
    index: Math.max(0, questions.findIndex(q => q.uid === savedMeta.position)),
    instant: String(readStorage('localStorage', 'lhundg-instant-feedback-v2', '1')) === '1',
    items: questions,
    search: '', status: 'all', category: 'all'
  };
  /** Eine gespeicherte Bewertung gilt nur für die unveränderte Antwortauswahl. */
  function signature(q) { return [...(state.answers.get(q.id) || [])].sort().join('|'); }
  for (const q of questions) {
    if ((!isExam || state.finished) && savedMeta.checked?.[q.id] === signature(q)) state.checked.set(q.id, signature(q));
  }
  /** UI-Text wird ausschließlich über textContent eingesetzt. */
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function button(text, className, action) {
    const el = node('button', text, className); el.type = 'button'; el.addEventListener('click', action); return el;
  }
  function notice(text) { $('appNotice').textContent = text; $('appNotice').hidden = false; }
  function reducedMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function persist() {
    writeStorage(kind, answerKey, Object.fromEntries([...state.answers].map(([id, set]) => [id, [...set]])));
    writeStorage(kind, metaKey, { version: 2, bookmarks: [...state.bookmarks], checked: Object.fromEntries(state.checked), position: state.items[state.index]?.uid, view: state.view, finished: state.finished });
  }
  /** Die Katalogwahl erhält die vorhandenen lokalen Speicherschlüssel. */
  function changeMode(value) {
    const url = new URL(location.href); url.search = ''; url.hash = 'trainer';
    if (value !== 'all') url.searchParams.set('mode', value);
    if (state.view === 'tv') url.searchParams.set('tv', '1');
    location.assign(url);
  }
  const mobileTestOptions = matchMedia('(max-width: 800px)');
  const testOptions = document.querySelector('.test-options');
  testOptions.open = !mobileTestOptions.matches;
  mobileTestOptions.addEventListener('change', event => { testOptions.open = !event.matches; });
  $('modeSelect').value = isExam ? mode === 'exam11' ? 'kammer197' : mode === 'exam34' ? 'legacy203' : 'mg' : mode;
  $('modeSelect').addEventListener('change', event => changeMode(event.target.value));
  $('modeTitle').textContent = config.title;
  $('modeDescription').textContent = config.description;
  $('poolCount').textContent = `${questions.length} Fragen · ${isExam ? 'Simulation' : 'in deinem Lernbereich'}`;
  $('viewSelect').value = state.view;
  updateFeedbackToggle();
  $('instantFeedback').disabled = isExam;
  $('examNotice').hidden = !isExam;
  $('intermediate').hidden = isExam;
  $('evaluate').textContent = isExam ? 'Simulation auswerten' : 'Gesamten Katalog auswerten';
  $('resume').textContent = isExam ? 'Nächste offene Frage →' : 'Weiterlernen →';
  $('testSelect').value = isExam ? mode : mode === 'kammer197' ? 'exam11' : 'exam34';
  function updateTestProfile() { $('testDescription').textContent = modes[$('testSelect').value].description; $('startExam').textContent = `${isExam ? 'Neuen Test' : 'Test'} starten · ${modes[$('testSelect').value].examCount} ↗`; }
  $('testSelect').addEventListener('change', updateTestProfile); updateTestProfile();
  $('importTrigger').addEventListener('click', () => $('importProgress').click());
  if (isExam || params.has('tv')) {
    const robots = document.querySelector('meta[name=robots]'); robots.content = 'noindex,follow';
  }
  const categories = [...new Set(questions.map(q => q.category))].sort((a,b) => a.localeCompare(b, 'de'));
  for (const category of categories) { const option = node('option', category); option.value = category; $('categoryFilter').append(option); }
  const navButtons = new Map();
  for (const [index, q] of questions.entries()) {
    const label = ['all', 'mg', 'mgexam', 'exam34', 'exam11'].includes(mode) ? String(index + 1) : q.sourceId;
    const b = button(label, 'nav-q', () => goTo(q.id));
    b.title = `${q.source} · Originalfrage ${q.sourceId}`;
    navButtons.set(q.id, b); $('questionNav').append(b);
  }
  /** Navigation und Fortschritt basieren auf den Daten, unabhängig von gerenderten Karten. */
  function updateOverview() {
    const answered = questions.filter(q => complete(q, state.answers.get(q.id))).length;
    const percent = Math.round(answered / questions.length * 100);
    $('progressText').textContent = `${answered} / ${questions.length} beantwortet`;
    $('progressPercent').textContent = `${percent} %`;
    $('progressBar').value = answered; $('progressBar').max = questions.length;
    $('progressBar').textContent = `${percent} %`;
    $('progressBar').setAttribute('aria-label', `${answered} von ${questions.length} Fragen beantwortet`);
    const visible = new Set(state.items.slice(state.index, state.index + pageSize()).map(q => q.id));
    for (const q of questions) {
      const b = navButtons.get(q.id), checked = state.checked.has(q.id), right = exact(state.answers.get(q.id) || new Set(), q.correct);
      b.classList.toggle('answered', complete(q, state.answers.get(q.id)));
      b.classList.toggle('correct', checked && right); b.classList.toggle('wrong', checked && !right);
      b.classList.toggle('bookmarked', state.bookmarks.has(q.id));
      if (visible.has(q.id)) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      const status = checked ? right ? 'richtig' : 'falsch' : complete(q, state.answers.get(q.id)) ? 'beantwortet' : 'offen';
      b.setAttribute('aria-label', `Frage ${b.textContent}, ${status}${state.bookmarks.has(q.id) ? ', gemerkt' : ''}, ${q.source} ${q.sourceId}`);
    }
  }
  function pageSize() { return state.view === 'list' ? 8 : 1; }
  /** Filter beziehen sich immer auf den ausgewählten Katalog, nie auf andere Lernstände. */
  function applyFilters({ reset = true, focus = false } = {}) {
    state.items = questions.filter(q => {
      const match = !state.search || `${q.sourceId} ${q.prompt} ${Object.values(q.answers).join(' ')}`.toLocaleLowerCase('de').includes(state.search);
      const status = state.status === 'all' || (state.status === 'open' && !complete(q, state.answers.get(q.id))) || (state.status === 'answered' && complete(q, state.answers.get(q.id))) || (state.status === 'wrong' && state.checked.has(q.id) && !exact(state.answers.get(q.id) || new Set(), q.correct)) || (state.status === 'bookmarked' && state.bookmarks.has(q.id));
      return match && status && (state.category === 'all' || q.category === state.category);
    });
    if (reset) state.index = 0;
    state.index = Math.max(0, Math.min(state.index, state.items.length - 1));
    $('clearFilters').hidden = !state.search && state.status === 'all' && state.category === 'all';
    $('matchCount').textContent = `${state.items.length} ${state.items.length === 1 ? 'Frage' : 'Fragen'}`;
    render(focus);
  }
  /** Verhindert, dass ein Filter die angesprungene Frage unsichtbar macht. */
  function goTo(id) {
    state.search = ''; state.status = 'all'; state.category = 'all';
    $('search').value = ''; $('statusFilter').value = 'all'; $('categoryFilter').value = 'all';
    state.index = questions.findIndex(q => q.id === id);
    if (state.view === 'list') state.index = Math.floor(state.index / 8) * 8;
    $('result').hidden = true;
    applyFilters({ reset: false }); persist();
    const card = $(`q-${id}`);
    card?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    card?.querySelector('.question-prompt')?.focus({ preventScroll: true });
  }
  /** Rendert nur eine Fokusfrage oder acht Listenkarten; der Gesamtkatalog bleibt außerhalb des DOM. */
  function render(focus = false) {
    document.body.classList.toggle('tv-mode', state.view === 'tv');
    const fragment = document.createDocumentFragment();
    for (const q of state.items.slice(state.index, state.index + pageSize())) fragment.append(renderQuestion(q));
    if (!state.items.length) fragment.append(node('p', 'Hier ist noch nichts. Ändere die Filter oder prüfe zuerst einige Antworten, um Fehler zu wiederholen.', 'empty-state'));
    $('questions').replaceChildren(fragment);
    $('previous').disabled = state.index <= 0;
    $('next').disabled = state.index + pageSize() >= state.items.length;
    const end = Math.min(state.index + pageSize(), state.items.length);
    $('position').textContent = state.items.length ? `${state.index + 1}${pageSize() > 1 ? `–${end}` : ''} von ${state.items.length}` : 'Keine Treffer';
    updateOverview();
    if (focus) {
      const heading = $('questions').querySelector('.question-prompt');
      heading?.focus({ preventScroll: true });
      $('questions').scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    }
  }
  /** Quellenzuordnung bleibt auch bei ähnlichen Fragen und abweichenden Schlüsseln sichtbar. */
  function renderQuestion(q) {
    const card = node('article', undefined, 'question-card'); card.id = `q-${q.id}`;
    const header = node('div', undefined, 'question-card-head');
    header.append(node('p', `FRAGE ${questions.indexOf(q) + 1} / ${questions.length}`, 'question-number'), node('span', '', 'status-pill'));
    const bookmark = button(state.bookmarks.has(q.id) ? '★' : '☆', 'bookmark', () => {
      if (state.bookmarks.has(q.id)) state.bookmarks.delete(q.id); else state.bookmarks.add(q.id);
      bookmark.textContent = state.bookmarks.has(q.id) ? '★' : '☆'; bookmark.setAttribute('aria-pressed', String(state.bookmarks.has(q.id)));
      persist(); updateOverview();
      if (state.status === 'bookmarked') applyFilters({ reset:false, focus:true });
    });
    bookmark.setAttribute('aria-label', `Frage ${q.sourceId} merken`); bookmark.setAttribute('aria-pressed', String(state.bookmarks.has(q.id))); header.append(bookmark); card.append(header);
    const prompt = node('h4', q.prompt, 'question-prompt'); prompt.tabIndex = -1; prompt.id = `prompt-${q.id}`; card.append(prompt); card.setAttribute('aria-labelledby', prompt.id);
    const source = LHUNDG_SOURCES[q.sourceKey];
    const provenance = node('div', undefined, 'question-source');
    provenance.append(node('span', `${source.label} · Originalfrage ${q.sourceId}${q.sourcePage ? ` · PDF-Seite ${q.sourcePage}` : ''} · ${q.category}`));
    const link = node('a', source.pdf ? q.referenceOnly ? 'Öffentliche Referenz-PDF (andere Fassung) ↗' : 'Original-PDF öffnen ↗' : 'Herkunft dieses Übungsbogens →');
    link.href = source.pdf ? source.pdf + (q.sourcePage ? `#page=${q.sourcePage}` : '') : source.page;
    if (source.pdf) { link.target = '_blank'; link.rel = 'noopener noreferrer external'; }
    provenance.append(link); card.append(provenance);
    if (q.referenceOnly) card.append(node('p', 'Dieser Lernbereich nutzt den zugesandten Übungsbogen. Die öffentlich verlinkte Kölner Fassung (Mai 2019) weicht davon ab; ihre Fragenummern und Lösungen sind nicht übertragbar.', 'source-note'));
    if (q.note) card.append(node('p', q.note, 'source-note'));
    if (q.requiresVisual) {
      const images = node('div', undefined, 'question-images');
      for (const [i, src] of q.images.entries()) {
        const img = document.createElement('img'); img.src = src;
        img.alt = `Aufgabenabbildung zu ${q.source}, Frage ${q.sourceId}${q.images.length > 1 ? `, Teil ${i+1}` : ''}. Die dargestellte Haltung ist Gegenstand der Frage.`;
        img.loading = 'lazy'; img.decoding = 'async';
        const size = window.LHUNDG_IMAGE_SIZES?.[src];
        if (size) { img.width = size[0]; img.height = size[1]; }
        images.append(img);
      }
      card.append(images);
    }
    if (q.mappingTargets) {
      const context = node('div', undefined, 'mapping-context');
      const heading = node('p', 'Mögliche Begriffe (die Reihenfolge ist keine Lösung):', 'microcopy'); context.append(heading);
      for (const [key, value] of Object.entries(q.mappingTargets)) context.append(node('p', `${key} · ${value}`));
      card.append(context);
    }
    const fieldset = node('fieldset');
    fieldset.append(node('legend', q.type === 'mapping' ? 'Ordne jeder Position einen Begriff oder eine Abbildung zu.' : 'Eine oder mehrere Antworten können richtig sein.'));
    const grid = node('div', undefined, q.type === 'mapping' ? 'mapping-grid' : 'answer-grid');
    if (q.type === 'mapping') {
      for (const key of q.mappingKeys) {
        const row = node('div', undefined, 'mapping-row'); row.append(node('strong', q.mappingLabels?.[key] ? `${key} · ${q.mappingLabels[key]}` : `Position ${key} →`));
        const choices = node('div', undefined, 'mapping-choices');
        for (const choice of q.mappingChoices) choices.append(answerOption(q, `${key}:${choice}`, choice, key));
        row.append(choices); grid.append(row);
      }
    } else for (const letter of q.options) grid.append(answerOption(q, letter, q.answers[letter], null));
    fieldset.append(grid); card.append(fieldset);
    const actions = node('div', undefined, 'question-actions');
    const check = button('Antwort prüfen', 'secondary question-check', () => {
      state.checked.set(q.id, signature(q)); persist(); updateCard(q, card); updateOverview();
      if (state.status === 'wrong' && exact(state.answers.get(q.id) || new Set(), q.correct)) applyFilters({ reset:false, focus:true });
    });
    check.hidden = isExam ? !state.finished : !state.instant;
    actions.append(check); card.append(actions);
    const feedback = node('div', undefined, 'feedback'); feedback.setAttribute('role', 'status'); feedback.hidden = true; card.append(feedback);
    updateCard(q, card); return card;
  }
  /** Native Checkboxen und Radios behalten Tastatur- und Screenreader-Verhalten. */
  function answerOption(q, token, text, mapKey) {
    const label = node('label', undefined, mapKey ? 'answer-option mapping-option' : 'answer-option');
    const input = document.createElement('input'); input.type = mapKey ? 'radio' : 'checkbox'; input.value = token;
    if (mapKey) input.name = `mapping-${q.id}-${mapKey}`;
    input.checked = state.answers.get(q.id)?.has(token) || false;
    if (mapKey) input.setAttribute('aria-label', `${mapKey}${q.mappingLabels?.[mapKey] ? ': ' + q.mappingLabels[mapKey] : ''} zu ${text}${q.mappingTargets?.[text] ? ': ' + q.mappingTargets[text] : ''}`);
    input.addEventListener('change', () => {
      const selected = new Set(state.answers.get(q.id) || []);
      if (mapKey) for (const value of selected) if (value.startsWith(`${mapKey}:`)) selected.delete(value);
      if (input.checked) selected.add(token); else selected.delete(token);
      if (selected.size) state.answers.set(q.id, selected); else state.answers.delete(q.id);
      state.checked.delete(q.id); $('result').hidden = true;
      persist(); updateCard(q, input.closest('.question-card')); updateOverview();
    });
    label.append(input);
    if (!mapKey) label.append(node('strong', token, 'answer-letter'));
    label.append(node('span', text)); return label;
  }
  /** Lösungsfeedback erscheint erst nach einer ausdrücklichen Prüfung. */
  function updateCard(q, card) {
    const selected = state.answers.get(q.id) || new Set();
    const checked = state.checked.has(q.id), right = exact(selected, q.correct);
    card.classList.toggle('correct', checked && right); card.classList.toggle('wrong', checked && !right);
    card.querySelector('.status-pill').textContent = checked ? right ? '✓ Richtig' : '× Falsch' : complete(q, selected) ? '● Beantwortet' : selected.size ? 'Teilweise' : '○ Offen';
    const check = card.querySelector('.question-check'); check.disabled = !complete(q, selected); check.textContent = checked ? 'Erneut prüfen' : 'Antwort prüfen';
    const feedback = card.querySelector('.feedback'); feedback.hidden = !checked;
    if (checked) {
      const format = token => q.type === 'mapping' ? token.replace(':', ' → ') : `${token}: ${q.answers[token]}`;
      feedback.textContent = `${right ? 'Richtig! ' : `Deine Auswahl: ${selected.size ? [...selected].map(v => v.replace(':',' → ')).join(', ') : 'keine'}. `}Lösung laut Quelle:\n${q.correct.map(format).join('\n')}`;
    }
  }
  function step(direction) {
    const last = Math.max(0, Math.floor((state.items.length - 1) / pageSize()) * pageSize());
    state.index = Math.max(0, Math.min(last, state.index + direction * pageSize()));
    render(true); persist();
  }
  $('previous').addEventListener('click', () => step(-1)); $('next').addEventListener('click', () => step(1));
  $('resume').addEventListener('click', () => {
    const current = state.items[state.index];
    const next = questions.find((q, i) => i >= questions.indexOf(current) && !complete(q, state.answers.get(q.id))) || questions.find(q => !complete(q, state.answers.get(q.id))) || current;
    if (next) goTo(next.id);
  });
  let debounce;
  $('search').addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(() => { state.search = $('search').value.trim().toLocaleLowerCase('de'); applyFilters(); }, 140); });
  $('statusFilter').addEventListener('change', () => { state.status = $('statusFilter').value; applyFilters(); });
  $('categoryFilter').addEventListener('change', () => { state.category = $('categoryFilter').value; applyFilters(); });
  $('clearFilters').addEventListener('click', () => goTo(questions[0].id));
  $('viewSelect').addEventListener('change', () => {
    state.view = $('viewSelect').value; state.index = Math.floor(state.index / pageSize()) * pageSize();
    const url = new URL(location.href); if (state.view === 'tv') url.searchParams.set('tv','1'); else url.searchParams.delete('tv'); history.replaceState(null, '', url);
    render(); persist();
  });
  function updateFeedbackToggle() {
    $('instantFeedback').textContent = isExam ? 'Sofort-Feedback: im Test gesperrt' : `Sofort-Feedback: ${state.instant ? 'An' : 'Aus'}`;
    $('instantFeedback').setAttribute('aria-pressed', String(!isExam && state.instant));
  }
  $('instantFeedback').addEventListener('click', () => {
    state.instant = !state.instant; writeStorage('localStorage', 'lhundg-instant-feedback-v2', state.instant ? '1' : '0'); updateFeedbackToggle(); render();
  });
  /** Vollauswertung zählt offene Fragen als Fehler; Zwischenergebnisse werten nur vollständige Antworten. */
  function evaluate(intermediate = false) {
    const chosen = intermediate ? questions.filter(q => complete(q, state.answers.get(q.id))) : questions;
    if (!intermediate && isExam && !state.finished) {
      const open = chosen.filter(q => !complete(q, state.answers.get(q.id))).length;
      if (open && !confirm(`Noch ${open} Fragen sind offen oder unvollständig und werden als falsch gewertet. Simulation jetzt auswerten?`)) return;
    }
    if (isExam) state.finished = true;
    for (const q of chosen) state.checked.set(q.id, signature(q));
    persist(); render();
    const wrong = chosen.filter(q => !exact(state.answers.get(q.id) || new Set(), q.correct));
    const correct = chosen.length - wrong.length;
    const result = $('result'); result.replaceChildren();
    result.append(node('h3', intermediate ? 'Dein Zwischenstand' : isExam ? config.passCount === null ? 'Deine §-11-Lernquote' : correct >= config.passCount ? 'Übungstest bestanden.' : 'Noch ein bisschen üben.' : 'Deine Auswertung'));
    result.append(node('p', intermediate ? `Nur ${chosen.length} vollständig beantwortete Fragen wurden gewertet.` : isExam ? config.passCount === null ? 'Diese Übungsrunde hat keine verbindliche Bestehensgrenze. Die prüfende Stelle beurteilt deine Sachkunde, gegebenenfalls im Gespräch.' : `Mindestens ${config.passCount} von ${config.examCount} sind in diesem Übungstest erforderlich. Keine Garantie für die echte Prüfung.` : 'Alle Fragen dieses Lernbereichs wurden gewertet. Offene und unvollständige Antworten zählen als falsch.'));
    const stats = node('div', undefined, 'result-stats');
    for (const [value, label] of [[`${correct} / ${chosen.length}`, 'richtig'], [chosen.length ? `${Math.round(correct/chosen.length*100)} %` : '–', 'richtige Antworten'], [String(wrong.length), 'falsch / offen']]) {
      const stat = node('div', undefined, 'result-stat'); stat.append(node('strong', value), node('span', label)); stats.append(stat);
    }
    result.append(stats);
    if (wrong.length) {
      result.append(node('p', 'Zu einer falschen oder offenen Frage springen:'));
      const errors = node('div', undefined, 'error-number-grid');
      for (const q of wrong) {
        const b = button(String(questions.indexOf(q) + 1), 'error-number', () => goTo(q.id));
        b.setAttribute('aria-label', `Frage ${questions.indexOf(q)+1}, ${q.source} ${q.sourceId}`); errors.append(b);
      }
      result.append(errors);
    }
    const actions = node('div', undefined, 'result-actions');
    actions.append(button('Weiterlernen', 'primary', () => { result.hidden = true; $('resume').click(); }));
    if (wrong.length) actions.append(button('Fehler wiederholen', 'secondary', () => { result.hidden = true; state.status = 'wrong'; $('statusFilter').value = 'wrong'; applyFilters({ focus: true }); }));
    actions.append(button('Ergebnis schließen', 'secondary', () => { result.hidden = true; $('evaluate').focus(); }));
    result.append(actions); result.hidden = false; result.focus(); result.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
    if (!intermediate && state.answers.size) window.openSupportDialog?.({ automatic:true, returnFocus:result });
  }
  $('intermediate').addEventListener('click', () => evaluate(true)); $('evaluate').addEventListener('click', () => evaluate(false));
  $('reset').addEventListener('click', () => {
    if (!confirm('Antworten, Bewertungen und Merkliste in diesem Lernbereich löschen? Andere Lernbereiche bleiben erhalten.')) return;
    state.answers.clear(); state.bookmarks.clear(); state.checked.clear(); state.finished = false; state.index = 0;
    $('result').hidden = true; persist(); goTo(questions[0].id); notice('Dieser Lernbereich wurde zurückgesetzt.');
  });
  $('startExam').addEventListener('click', () => {
    if (isExam && !state.finished && state.answers.size && !confirm('Aktuelle Simulation verlassen und eine neue starten?')) return;
    const profile = modes[$('testSelect').value];
    const selected = randomQuestions(LHUNDG_DATA[profile.pool], profile.examCount);
    const url = new URL(location.href); url.search = ''; url.hash = 'trainer'; url.searchParams.set('mode',$('testSelect').value); url.searchParams.set('ids', selected.map(q => q.id).join(','));
    if (state.view === 'tv') url.searchParams.set('tv','1');
    location.assign(url);
  });
  /** Exportiert ausschließlich bekannte Lernbereiche; keine anderen Daten dieses Origins. */
  $('exportProgress').addEventListener('click', () => {
    persist(); const catalogues = {};
    for (const [name, entry] of Object.entries(modes)) {
      if (!entry.key) continue;
      const answers = readStorage('localStorage', entry.key, {});
      const meta = readStorage('localStorage', `lhundg-meta-${name}-v2`, {}) || {};
      catalogues[name] = { answers, bookmarks: Array.isArray(meta.bookmarks) ? meta.bookmarks : [] };
    }
    if (!isExam) catalogues[mode] = { answers: Object.fromEntries([...state.answers].map(([id,set]) => [id,[...set]])), bookmarks: [...state.bookmarks] };
    const blob = new Blob([JSON.stringify({ format:'lhundg-learning', version:1, catalogues }, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob), link = node('a'); link.href = url; link.download = `sachkunde-lernstand-${new Date().toISOString().slice(0,10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice('Lernstand exportiert. Prüfungssimulationen sind nicht Bestandteil der Sicherung.');
  });
  /** Import ist größenbegrenzt, schemageprüft und führt bekannte Antworten nach Bestätigung zusammen. */
  $('importProgress').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Die Datei ist zu groß (maximal 2 MB).');
      const imported = JSON.parse(await file.text());
      if (imported.format !== 'lhundg-learning' || imported.version !== 1 || !imported.catalogues || typeof imported.catalogues !== 'object') throw new Error('Das ist keine unterstützte Lernstand-Datei.');
      const updates = [];
      for (const [name, entry] of Object.entries(modes)) {
        if (!entry.key || !Object.hasOwn(imported.catalogues, name)) continue;
        const item = imported.catalogues[name];
        if (!item || typeof item !== 'object' || !item.answers || typeof item.answers !== 'object' || Array.isArray(item.answers) || !Array.isArray(item.bookmarks)) throw new Error('Die Lernstand-Datei ist unvollständig.');
        const qlist = LHUNDG_DATA[entry.pool], answers = validAnswers(item.answers, qlist), ids = new Set(qlist.map(q => q.id));
        const rawCount = Object.keys(item.answers).length;
        if (answers.size !== rawCount || [...answers].some(([id,values]) => values.size !== item.answers[id].length) || item.bookmarks.some(id => !ids.has(id))) throw new Error('Die Lernstand-Datei enthält ungültige Antworten oder Fragen.');
        updates.push({ name, entry, answers, bookmarks: item.bookmarks });
      }
      if (!updates.length) throw new Error('Die Datei enthält keinen bekannten Lernbereich.');
      if (!confirm('Lernstände zusammenführen? Bei derselben Frage ersetzt die importierte Antwort die bisherige. Bewertungen werden zurückgesetzt.')) return;
      for (const update of updates) {
        const existing = validAnswers(readStorage('localStorage', update.entry.key, {}), LHUNDG_DATA[update.entry.pool]);
        for (const [id,values] of update.answers) existing.set(id,values);
        writeStorage('localStorage', update.entry.key, Object.fromEntries([...existing].map(([id,set]) => [id,[...set]])));
        const meta = readStorage('localStorage', `lhundg-meta-${update.name}-v2`, {}) || {};
        const bookmarks = [...new Set([...(Array.isArray(meta.bookmarks) ? meta.bookmarks : []), ...update.bookmarks])];
        writeStorage('localStorage', `lhundg-meta-${update.name}-v2`, { ...meta, checked:{}, bookmarks });
        if (update.name === mode) { state.answers = existing; state.bookmarks = new Set(bookmarks); state.checked.clear(); }
      }
      $('result').hidden = true; applyFilters(); notice('Lernstand geladen. Deine Antworten wurden zusammengeführt.');
    } catch (error) { notice(error instanceof Error ? error.message : 'Die Datei konnte nicht geladen werden.'); }
    finally { event.target.value = ''; }
  });
  /** Fernbedienungstasten greifen nur im Lernraum, nicht in Such- oder Auswahlfeldern. */
  document.addEventListener('keydown', event => {
    if (state.view !== 'tv' || event.ctrlKey || event.metaKey || event.altKey || !$('result').hidden) return;
    const target = event.target;
    if (target.closest('#questionNav') || target.matches('select, input[type=search], input[type=file], textarea') || target.isContentEditable || !target.closest('#trainer')) return;
    const controls = [...$('questions').querySelectorAll('input, .question-check:not([hidden])')].filter(el => !el.disabled);
    const current = controls.indexOf(document.activeElement);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 1 : -1); }
    else if (['ArrowDown','ArrowUp'].includes(event.key) && controls.length) { event.preventDefault(); controls[(current + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length].focus(); }
    else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); state.index = event.key === 'Home' ? 0 : Math.max(0,state.items.length - 1); render(true); persist(); }
    else if (event.key === 'Enter' && target.matches('input[type=checkbox],input[type=radio]')) { event.preventDefault(); target.click(); }
  });
  /** Rasterbreite wird aus CSS gelesen, damit Pfeilnavigation auch mobil stimmt. */
  function gridKeyboard(event, container, buttons) {
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    const columns = getComputedStyle(container).gridTemplateColumns.split(' ').length;
    const moves = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-columns, ArrowDown:columns, Home:-buttons.length, End:buttons.length };
    if (!Object.hasOwn(moves, event.key)) return;
    event.preventDefault(); event.stopPropagation(); buttons[Math.max(0,Math.min(buttons.length-1,index + moves[event.key]))].focus();
  }
  $('result').addEventListener('keydown', event => {
    const grid = $('result').querySelector('.error-number-grid');
    if (grid) gridKeyboard(event, grid, [...grid.querySelectorAll('button')]);
  });
  $('questionNav').addEventListener('keydown', event => {
    const buttons = [...navButtons.values()], index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    const columns = getComputedStyle($('questionNav')).gridTemplateColumns.split(' ').length;
    const moves = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-columns, ArrowDown:columns, Home:-buttons.length, End:buttons.length };
    if (!Object.hasOwn(moves, event.key)) return;
    event.preventDefault(); event.stopPropagation(); buttons[Math.max(0,Math.min(buttons.length-1,index + moves[event.key]))].focus();
  });
  applyFilters({ reset:false }); showStorageWarning();
  const action = params.get('action');
  const actionButton = { import:'importTrigger', export:'exportProgress', reset:'reset' }[action];
  if (actionButton) {
    const url = new URL(location.href); url.searchParams.delete('action'); history.replaceState(null,'',url);
    notice('Das gewünschte Werkzeug ist oben in der Navigation markiert. Klicke darauf, um fortzufahren.');
    $(actionButton).focus();
  }
})();
