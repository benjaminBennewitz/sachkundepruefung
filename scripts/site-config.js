/* scripts/site-config.js */

/**
 * @file Zentrale Projektkonfiguration.
 * @description Zentrale Betreiber-, Hosting- und optionale PayPal-Konfiguration. Origin bleibt bis zur Domainentscheidung leer.
 * @author Benjamin Bennewitz [B²]
 */

/**
 * @type {{origin: string, operator: {name: string, address: string[], email: string, phone: string}, paypalUrl: string, hosting: {provider: string, address: string, logRetention: string}}}
 * Leere Origin für die lokale Vorschau; Produktionsdomain beim Build ergänzen.
 */
window.SITE_CONFIG = {
  origin: '',
  operator: {
    name: 'Benjamin Bennewitz',
    address: ['c/o', 'Linzer Straße 45', '53604 Bad Honnef', 'Deutschland'],
    email: 'kontakt@design-code-repeat.de',
    phone: '+49 162 9038166'
  },
  paypalUrl: '',
  hosting: {
    provider: 'netcup GmbH',
    address: 'Emmy-Noether-Straße 10, 76131 Karlsruhe, Deutschland',
    logRetention: 'Technische Logdaten werden nur im Rahmen der für Betrieb, Sicherheit und Fehleranalyse erforderlichen Fristen vorgehalten.'
  }
};
