/* scripts/quality/learning-fixtures.cjs */

/**
 * @file Isolierte Testumgebung für die klassischen Lernskripte.
 * @description Lädt echte Projektmodule ohne Browser und trennt Arbeitsspeicher, LocalStorage und SessionStorage.
 * @author Benjamin Bennewitz [B²]
 */
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');

/**
 * Erzeugt einen isolierten Storage-Ersatz mit einsehbarem Inhalt für Tests.
 *
 * @returns {object} Storage-Ersatz mit Map, getItem und setItem.
 */
function memoryStorage() {
  const values = new Map();  // Pro Test ein unabhängiger Speicher; kein Zustand gelangt in einen anderen Test.

  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

/**
 * Erzeugt die benötigten Browser-Globals und eine Sammlung aufgezeichneter Toasts.
 *
 * @returns {object} Browser-Globals unter scope und aufgezeichnete Toasts unter messages.
 */
function browserScope() {
  const messages = [];  // Erfasst Warnungen, ohne die UI oder einen echten Browser vorauszusetzen.
  // Minimale Browser-Globals; die eigentlichen Lernmodule werden erst danach geladen.
  const scope = {
    URL,
    URLSearchParams,
    location: { href: 'https://local.invalid/nrw/' },
    history: { replaceState: () => {} },
    localStorage: memoryStorage(),
    sessionStorage: memoryStorage(),
    LHUNDG_UI: { toast: (...args) => messages.push(args) }
  };

  scope.window = scope;

  return { scope, messages };
}

/**
 * Lädt echte Lernmodule in einen eigenen VM-Kontext mit getrennten Speicherobjekten.
 *
 * @param {string[]} [files] Lernmodule in Browserreihenfolge.
 * @returns {object} Scope, VM-Kontext, Trainer-Klassen und aufgezeichnete Toasts.
 */
function environment(files = ['data', 'essen', 'core', 'profiles', 'session', 'progress']) {
  const { scope, messages } = browserScope();  // Dieselben Globals stehen allen Modulen dieses Tests zur Verfügung.
  const context = vm.createContext(scope);     // Jede Umgebung besitzt ihre eigenen globalen Kataloge und Klassen.

  // Die tatsächlichen Dateien werden ausgeführt; der Test kopiert keine Fachlogik.
  for (const file of files) {
    vm.runInContext(readFileSync(resolve(__dirname, `../learning/${file}.js`), 'utf8'), context);
  }

  return { scope, context, trainer: scope.LHUNDG_TRAINER, messages };
}

/**
 * Erzeugt eine echte Trainer-Sitzung aus den URL-Parametern der Testeingabe.
 *
 * @param {object} env Testumgebung.
 * @param {string} [query] URL-Parameter.
 * @returns {object} Echte Trainer-Sitzung.
 */
function session(env, query = '') {
  return new env.trainer.Session(new URLSearchParams(query));
}

/**
 * Legt einen JSON-kodierten Wert im angegebenen Testspeicher ab.
 *
 * @param {object} storage Speicherersatz.
 * @param {string} key Schlüssel.
 * @param {*} value Zu speichernder JSON-Wert.
 * @returns {void} Kein Rückgabewert.
 */
function save(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

/**
 * Überführt einen VM-Wert in JSON-kompatible Objekte mit lokalen Prototypen.
 *
 * @param {*} value Wert aus einem VM-Kontext.
 * @returns {*} JSON-Wert mit lokalen Objektprototypen zum Vergleichen.
 */
function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

module.exports = { environment, session, save, plain };
