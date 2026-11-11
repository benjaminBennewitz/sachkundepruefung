/* scripts/site-config.js */

/**
 * @file Zentrale Projektkonfiguration.
 * @description Zentrale Betreiber-, Hosting- und optionale PayPal-Konfiguration. Domain und Landesbereich sind getrennt konfiguriert.
 * @author Benjamin Bennewitz [B²]
 */

/**
 * @typedef {object} SiteConfig
 * @property {string} origin HTTPS-Domain ohne Landespfad.
 * @property {string} basePath Landesbereich ohne abschließenden Schrägstrich.
 * @property {object} operator Tatsächliche Betreiber- und Kontaktdaten.
 * @property {string} operator.name Veröffentlichter Betreibername.
 * @property {string[]} operator.address Ladungsfähige Anschrift in ihrer bisherigen Reihenfolge.
 * @property {string} operator.email Öffentliche Kontaktadresse.
 * @property {string} operator.phone Öffentliche Telefonnummer.
 * @property {string} paypalUrl Optionales HTTPS-Ziel der freiwilligen Unterstützung.
 * @property {object} hosting Angaben zum tatsächlichen Hosting und zur Protokollaufbewahrung.
 * @property {string} hosting.provider Name des Hostinganbieters.
 * @property {string} hosting.address Anschrift des Hostinganbieters.
 * @property {string} hosting.logRetention Bisher hinterlegter Hinweis zur Aufbewahrung technischer Logs.
 */

/**
 * Gemeinsame Laufzeit- und Prüfwerte; Inhalte der Root-Rechtstexte werden daraus nicht erzeugt.
 *
 * @type {SiteConfig}
 */
window.SITE_CONFIG = {
  // Produktionsdomain und Landesbereich werden von lokalen Prüfwerkzeugen gemeinsam ausgewertet.
  origin: 'https://hunde-sachkundetrainer.de',
  basePath: '/nrw',

  // Veröffentlichte Betreiberangaben bleiben gegenüber dem bereitgestellten Projektstand unverändert.
  operator: {
    name: 'Benjamin Bennewitz',
    address: ['c/o', 'Linzer Straße 45', '53604 Bad Honnef', 'Deutschland'],
    email: 'kontakt@design-code-repeat.de',
    phone: '+49 162 9038166'
  },

  // Ein leerer Zahlungslink blendet nur die freiwillige Unterstützung aus, niemals Lernfunktionen.
  paypalUrl: 'https://paypal.me/BBennewitz',

  // Diese Werte beschreiben den tatsächlichen Betrieb und werden im Release auf Vollständigkeit geprüft.
  hosting: {
    provider: 'netcup GmbH',
    address: 'Emmy-Noether-Straße 10, 76131 Karlsruhe, Deutschland',
    logRetention:
      'Technische Logdaten werden nur im Rahmen der für Betrieb, Sicherheit und Fehleranalyse erforderlichen Fristen vorgehalten.'
  }
};
