/* scripts/pages/ui-shell.mjs */

/**
 * @file Gemeinsamer Seitenrahmen.
 * @description Gemeinsame statische Navigation, Haftungshinweis und Fußzeile.
 * @author Benjamin Bennewitz [B²]
 */

/** @type {Record<string, string>} Lokale Pfaddaten der dekorativen Werkzeugsymbole. */
const icons = {
  export: '<path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/>',
  import: '<path d="M12 16V4m-4 4 4-4 4 4M5 16v5h14v-5"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 7M4 4v7h7"/>',
  heart: '<path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l1.5 1.5m13 13L20 20M4 20l1.5-1.5m13-13L20 4"/>',
  moon: '<path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z"/>'
};

/** Erzeugt ein dekoratives, lokal eingebettetes SVG-Symbol. */
const svg = (key, cls = '') =>
  `<svg class="${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`;

/** Erzeugt einen beschrifteten Werkzeugbutton mit eigenem Tooltip. */
const tool = (key, label, attrs, content = '') =>
  `<button class="icon-button" type="button" aria-label="${label}" ${attrs}>${content || svg(key)}<span class="tool-tip" aria-hidden="true">${label}</span></button>`;

/** Erzeugt die gemeinsame Hauptnavigation und markiert die aktuelle Seite. */
export function header(file = 'index.html') {
  const home = file === 'index.html';
  const actions = home ?
    tool('import', 'Lernstand laden', 'id="importTrigger"') +
    '<input id="importProgress" type="file" accept="application/json,.json" hidden>' + tool(
      'export', 'Lernstand sichern', 'id="exportProgress"') + tool('reset',
        'Diesen Lernbereich zurücksetzen', 'id="reset"') :
    ['import', 'export', 'reset'].map((key, i) =>
      `<a class="icon-button" aria-label="${['Lernstand laden', 'Lernstand sichern', 'Lernbereich zurücksetzen'][i]} – im Trainer" href="./?action=${key}#trainer">${svg(key)}<span class="tool-tip" aria-hidden="true">${['Laden', 'Sichern', 'Zurücksetzen'][i]} im Trainer</span></a>`
    )
      .join('');
  return `<header class="site-header wrap"><a class="brand" href="./" aria-label="Sachkunde NRW – Startseite"><span class="brand-mark" aria-hidden="true">§</span><span>SACHKUNDE<span class="brand-sub">NRW / DIE LERNHILFE</span></span></a><nav class="header-nav" aria-label="Hauptnavigation">${[['index.html', 'Lernen', home ? '#trainer' : './#trainer'], ['gut-zu-wissen.html', 'Gut zu wissen', 'gut-zu-wissen.html'], ['hundewissen.html', 'Hundewissen', 'hundewissen.html'], ['quellen.html', 'Quellen', 'quellen.html']].map(([key, label, href]) => `<a href="${href}"${file === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav><div class="header-tools" role="group" aria-label="Darstellung und Lernwerkzeuge">${actions}${tool('heart', 'Über PayPal unterstützen', 'data-open-support')}${tool('sun', 'Farbschema wechseln', 'id="themeToggle"', svg('sun', 'theme-sun') + svg('moon', 'theme-moon'))}</div></header>`;
}

/** @type {string} Gemeinsamer Hinweis auf den unverbindlichen Charakter der Lernhilfe. */
export const disclaimer =
  `<aside class="legal-disclaimer" aria-label="Wichtiger Hinweis zur Lernhilfe"><strong>REINE LERNHILFE. KEINE RECHTSBERATUNG. KEINE PRÜFUNGSGARANTIE.</strong><p>Dieses unabhängige Angebot ersetzt weder behördliche Auskünfte noch eine Sachkunde- oder Verhaltensprüfung. Für Richtigkeit, Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen. Maßgeblich sind geltendes Recht und die Auskunft deiner zuständigen Behörde. Ein gutes Übungsergebnis garantiert kein Bestehen. <a href="impressum.html#haftung">Hinweise zur Haftung</a></p></aside>`;

/** Erzeugt die gemeinsame Fußzeile mit Copyright, Entwicklerlink und Informationslinks. */
export function footer(home = false) {
  return `<footer class="site-footer wrap"><p class="footer-credit">© ${new Date().getFullYear()} Benjamin Bennewitz <a class="developer-tag" href="https://design-code-repeat.de/" aria-label="Entwicklung und Design: Benjamin Bennewitz">[B²]</a></p><nav aria-label="Rechtliches und Informationen"><a href="quellen.html">Originalquellen</a><a href="gut-zu-wissen.html">Gut zu wissen</a><a href="hundewissen.html">Hundewissen</a><a href="impressum.html">Impressum</a><a href="datenschutz.html">Datenschutz</a><a href="${home ? '#trainer' : './#trainer'}">Zum Lernen ↑</a></nav></footer>`;
}
