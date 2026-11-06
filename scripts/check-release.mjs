import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const context = { window:{} };
vm.runInNewContext(readFileSync(resolve(root,'site-config.js'),'utf8'),context);
const config = context.window.SITE_CONFIG, missing = [];
if (!config.operator.address.length) missing.push('Ladungsfähige Anschrift');
if (!config.operator.email) missing.push('Kontakt-E-Mail');
if (!config.hosting.provider || !config.hosting.address || !config.hosting.logRetention) missing.push('Tatsächlicher Hostinganbieter, Anschrift und Log-Löschfrist');
if (!config.paypalUrl) missing.push('Persönlicher PayPal-Unterstützungslink (sonst bleibt der Button ausgeblendet)');
if (config.paypalUrl) {
  try { const url = new URL(config.paypalUrl); if (url.protocol !== 'https:' || !['paypal.com','www.paypal.com','paypal.me','www.paypal.me'].includes(url.hostname)) missing.push('Gültige HTTPS-PayPal-Adresse'); }
  catch { missing.push('Gültige PayPal-Adresse'); }
}
if (!process.argv.includes('--rights-confirmed')) missing.push('Freigabe zur öffentlichen Übernahme der Fragen und Abbildungen; nach Klärung --rights-confirmed angeben');
for (const file of ['impressum.html','datenschutz.html']) if (readFileSync(resolve(root,file),'utf8').includes('missing-field')) missing.push(`${file}: Seiten nach Ergänzung der Konfiguration neu erzeugen`);
if (missing.length) { console.error(`Vor dem öffentlichen Start noch offen:\n${missing.map(v => `- ${v}`).join('\n')}`); process.exitCode = 1; }
else console.log('Betreiberangaben vollständig; Freigabe zur Übernahme wurde bestätigt. Technische und rechtliche Endkontrolle am Live-Server bleibt erforderlich.');
