/* scripts/learning/sources.js */

/**
 * @file Originalquellen der Kataloge.
 * @description Verbindet jeden Katalog mit seiner dokumentierten Originalquelle.
 * @author Benjamin Bennewitz [B²]
 */

/**
 * @type {Record<string, {label: string, page: string}>}
 * Originalverweise werden ausschließlich auf einen ausdrücklichen Klick geöffnet.
 */

// sourceKey jeder Frage verweist auf genau einen dieser Herkunftsnachweise.
// label benennt die verwendete Fassung; page führt zur Originalquelle oder zur dokumentierten Herkunft.
window.LHUNDG_SOURCES = {
  essenExample: {
    label: 'Eigene, unverbindliche Rechtsfrage',
    page: 'quellen.html#essen-beispiel'
  },
  legacy203: {
    label: 'Rhein-Erft-Kreis · 203',
    page: 'https://portal.rhein-erft-kreis.de/detail/-/vr-bis-detail/dienstleistung/42735/show'
  },
  rhein97: {
    label: 'Rhein-Erft · zugesandter Übungsbogen (97)',
    page: 'quellen.html#rhein97'
  },
  koeln: {
    label: 'Stadt Köln · A/B/C',
    page: 'https://www.stadt-koeln.de/service/produkt/sachkundenachweis-fuer-hundehalterinnen'
  },
  kammer197: {
    label: 'Tierärztekammern · ab 2025 (§ 11)',
    page: 'https://www.tieraerztekammer-nordrhein.de/tierhalter/sachkundebescheinigung-lhundg/'
  }
};
