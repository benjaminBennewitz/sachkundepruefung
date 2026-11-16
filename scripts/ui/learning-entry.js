/* scripts/ui/learning-entry.js */

/**
 * @file Kompatibilität vorhandener Lernlinks.
 * @description Leitet frühere Katalog-, Test-, TV- und Werkzeuglinks mit ihren Parametern weiter.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(() => {
  const current = new URL(location.href);
  const learning = ['mode', 'tv', 'action', 'ids'].some(key => current.searchParams.has(key));
  if (learning || current.hash === '#trainer') {
    const target = new URL('lernen.html', current);
    target.search = current.search;
    target.hash = current.hash === '#geschichte' ? '' : current.hash;
    location.replace(target.href);
  }
})();
