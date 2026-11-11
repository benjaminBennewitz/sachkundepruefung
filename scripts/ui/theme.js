/* scripts/ui/theme.js */

/**
 * @file Frühe Anwendung der gespeicherten Farbwahl vor dem ersten Zeichnen.
 * @description Frühe Anwendung der gespeicherten Farbwahl vor dem ersten Zeichnen.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

try {
  const theme = localStorage.getItem('lhundg-theme-v1');  // Unveränderter historischer Schlüssel der expliziten Farbwahl.

  // Andere oder fehlende Speicherwerte lassen die systemweite Farbwahl unverändert wirken.
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // Ohne verfügbaren Browserspeicher bleibt das System-Farbschema aktiv.
}
