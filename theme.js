/** Setzt das gewählte Farbschema vor dem ersten Zeichnen. */
try {
  const theme = localStorage.getItem('lhundg-theme-v1');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch { /* Ohne Browserspeicher bleibt das System-Farbschema aktiv. */ }
