/* scripts/ui/theme.js */

/**
 * @file Frühe Anwendung des Farbschemas.
 * @description Wendet die gespeicherte Farbwahl vor dem ersten Zeichnen an, ohne externe Ressourcen zu laden.
 * @author Benjamin Bennewitz [B²]
 */

try {
  const theme = localStorage.getItem('lhundg-theme-v1');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  /* Ohne Browserspeicher bleibt das System-Farbschema aktiv. */
}
