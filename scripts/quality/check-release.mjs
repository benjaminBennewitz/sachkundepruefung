/* scripts/quality/check-release.mjs */

/**
 * @file Prüfung der Veröffentlichungsangaben.
 * @description Prüft vor dem Produktionspaket Domain, Betreiberangaben und die bestehende Freigabekennzeichnung.
 * @author Benjamin Bennewitz [B²]
 */
import {
  readFileSync
} from 'node:fs';
import {
  resolve
} from 'node:path';
import {
  projectRoot,
  readSiteConfig
} from '../config.mjs';
const root = projectRoot;
const config = readSiteConfig();
const missing = [];
if (!config.origin) missing.push('Produktionsdomain: LHUNDG_ORIGIN oder scripts/site-config.js');
if (!config.operator.address.length) missing.push('Ladungsfähige Anschrift');
if (!config.operator.email) missing.push('Kontakt-E-Mail');
if (!config.hosting.provider || !config.hosting.address || !config.hosting.logRetention) missing
  .push('Tatsächlicher Hostinganbieter, Anschrift und Log-Löschfrist');
if (!config.paypalUrl) console.log(
  'PayPal-Link noch leer: Unterstützung bleibt optional und ausgeblendet.');
if (config.paypalUrl) {
  try {
    const url = new URL(config.paypalUrl);
    if (url.protocol !== 'https:' || !['paypal.com', 'www.paypal.com', 'paypal.me', 'www.paypal.me']
      .includes(url.hostname)) missing.push('Gültige HTTPS-PayPal-Adresse');
  } catch {
    missing.push('Gültige PayPal-Adresse');
  }
}
if (!process.argv.includes('--rights-confirmed')) missing.push(
  'Freigabe zur öffentlichen Übernahme der Fragen und Abbildungen; nach Klärung --rights-confirmed angeben'
);
for (const file of ['impressum.html', 'datenschutz.html'])
  if (readFileSync(resolve(root, file), 'utf8')
    .includes('missing-field')) missing.push(
      `${file}: Seiten nach Ergänzung der Konfiguration neu erzeugen`);
if (missing.length) {
  console.error(`Vor dem öffentlichen Start noch offen:\n${missing.map(v => `- ${v}`).join('\n')}`);
  process.exitCode = 1;
} else console.log(
  'Betreiberangaben vollständig; Freigabe zur Übernahme wurde bestätigt. Technische und rechtliche Endkontrolle am Live-Server bleibt erforderlich.'
);
