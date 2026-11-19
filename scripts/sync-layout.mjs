/* scripts/sync-layout.mjs */

/**
 * @file Gemeinsame Vorlagen für Kopf- und Fußbereich.
 * @description Übernimmt die Vorlagen in markierte Root-HTML-Blöcke oder prüft ihren Stand.
 * @author Benjamin Bennewitz [B²]
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot } from './config.mjs';

const checkOnly = process.argv.includes('--check');

/**
 * Liest ein Vorlagenfragment mit einheitlichen internen Zeilenenden.
 * @param {string} name Dateiname im Vorlagenordner.
 * @returns {string} Fragment ohne abschließenden Zeilenumbruch.
 */
function readTemplate(name) {
  return readFileSync(resolve(projectRoot, 'templates', name), 'utf8')
    .replace(/\r\n/g, '\n')
    .trimEnd();
}

/**
 * Ersetzt genau einen kommentierten Block und übernimmt seine Zeilenenden.
 * @param {string} html Vorhandener Dateiinhalt.
 * @param {string} name Beschriftung der Blockgrenzen.
 * @param {string} fragment Vorlageninhalt mit LF-Zeilenenden.
 * @returns {string} Dateiinhalt mit aktualisiertem Block.
 */
function replaceBlock(html, name, fragment) {
  const startMarker = `<!-- BLOCK START: ${name} -->`;
  const endMarker = `<!-- BLOCK END: ${name} -->`;
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end <= start || start !== html.lastIndexOf(startMarker) || end !== html.lastIndexOf(endMarker)) {
    throw new Error(`Blockgrenzen fehlen, sind vertauscht oder mehrfach vorhanden: ${name}`);
  }

  const startOfContent = html.indexOf('\n', start + startMarker.length) + 1;
  const endOfContent = html.lastIndexOf('\n', end) + 1;
  if (startOfContent <= start || startOfContent > endOfContent) {
    throw new Error(`Blockgrenzen müssen auf eigenen Zeilen stehen: ${name}`);
  }

  const eol = html[startOfContent - 2] === '\r' ? '\r\n' : '\n';
  return html.slice(0, startOfContent) + fragment.replaceAll('\n', eol) + eol + html.slice(endOfContent);
}

/**
 * Kennzeichnet die aktuelle Seite in der Hauptnavigation und erhält die Geschichtsanker.
 * @param {string} header Gemeinsamer Kopfbereich.
 * @param {string} page Dateiname der Zielseite.
 * @returns {string} Kopfbereich für die Zielseite.
 */
function renderHeader(header, page) {
  const currentHref = page === 'index.html' ? './' : page;
  const withCurrentPage = header.replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/, navigation =>
    navigation.replace(/<a href="([^"]+)">/g, (link, href) =>
      href.split('#')[0] === currentHref ? `<a href="${href}" aria-current="page">` : link
    )
  );

  if (page === 'index.html' || page === 'lernen.html') {
    return withCurrentPage.replace('<header class="site-header wrap">', '<header class="site-header wrap" id="geschichte">');
  }
  return withCurrentPage;
}

const header = readTemplate('site-header.html');
const workspaceHeader = replaceBlock(header, 'Lernstandswerkzeuge', readTemplate('workspace-header-actions.html'));
const footer = readTemplate('site-footer.html');
const workspaceFooter = readTemplate('workspace-footer.html');
const pages = readdirSync(projectRoot).filter(name => name.endsWith('.html')).map(name => {
  const path = resolve(projectRoot, name);
  const html = readFileSync(path, 'utf8');
  const isWorkspace = name === 'lernen.html';

  try {
    const withHeader = replaceBlock(html, 'Vorlage Kopfbereich', renderHeader(isWorkspace ? workspaceHeader : header, name));
    const updated = replaceBlock(withHeader, 'Vorlage Fußbereich', isWorkspace ? workspaceFooter : footer);
    return { name, path, html, updated };
  } catch (error) {
    throw new Error(`${name}: ${error.message}`, { cause: error });
  }
});

const changed = pages.filter(page => page.html !== page.updated);
if (checkOnly && changed.length) {
  console.error(`Vorlagenblöcke veraltet: ${changed.map(page => page.name).join(', ')}. Mit node scripts/sync-layout.mjs aktualisieren.`);
  process.exitCode = 1;
} else {
  for (const page of changed) writeFileSync(page.path, page.updated);
  console.log(changed.length ? `${changed.length} HTML-Seiten aktualisiert.` : `${pages.length} HTML-Seiten entsprechen den Layoutvorlagen.`);
}
