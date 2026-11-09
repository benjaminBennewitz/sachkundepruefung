/* scripts/site-config.js */

/**
 * @file Zentrale Projektkonfiguration.
 * @description Zentrale Betreiber-, Hosting- und optionale PayPal-Konfiguration. Domain und Landesbereich sind getrennt konfiguriert.
 * @author Benjamin Bennewitz [B²]
 */

/**
 * @type {{origin: string, basePath: string, operator: {name: string, address: string[], email: string, phone: string}, paypalUrl: string, hosting: {provider: string, address: string, logRetention: string}}}
 * Hauptdomain und Unterverzeichnis des NRW-Lerntrainers.
 */
window.SITE_CONFIG = {
  origin: 'https://hunde-sachkundetrainer.de',
  basePath: '/nrw',
  operator: {
    name: 'Benjamin Bennewitz',
    address: ['c/o', 'Linzer Straße 45', '53604 Bad Honnef', 'Deutschland'],
    email: 'kontakt@design-code-repeat.de',
    phone: '+49 162 9038166'
  },
  paypalUrl: 'https://paypal.me/BBennewitz',
  hosting: {
    provider: 'netcup GmbH',
    address: 'Emmy-Noether-Straße 10, 76131 Karlsruhe, Deutschland',
    logRetention: 'Technische Logdaten werden nur im Rahmen der für Betrieb, Sicherheit und Fehleranalyse erforderlichen Fristen vorgehalten.'
  }
};
