/* scripts/quality/check-release.mjs */

/**
 * @file Prüfung der Veröffentlichungsangaben.
 * @description Prüft Betreiberkonfiguration und die ausdrücklich anzugebende Freigabe, ohne Rechte selbst zu bestätigen.
 * @author Benjamin Bennewitz [B²]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, readSiteConfig } from '../config.mjs';

const config = readSiteConfig();  // Konfiguration liefert Prüfwerte; Rechtstexte bleiben direkt in den Root-Seiten.
const missing = [];               // Sammelt offene Angaben, damit ein Lauf alle bekannten Lücken melden kann.

/**
 * Sammelt fehlende Domain-, Betreiber- und Hostingangaben für die Release-Prüfung.
 *
 * @returns {void} Kein Rückgabewert.
 */
function checkOperator() {
  // Ohne Domain kann das Produktionspaket keine verbindliche Veröffentlichungsadresse prüfen.
  if (!config.origin) missing.push('Produktionsdomain: LHUNDG_ORIGIN oder scripts/site-config.js');

  // Die Anschrift muss als eigener Pflichtwert vorliegen.
  if (!config.operator.address.length) missing.push('Ladungsfähige Anschrift');

  // Eine vorhandene Anschrift ersetzt keinen direkten Kontaktweg.
  if (!config.operator.email) missing.push('Kontakt-E-Mail');

  // Hostingangaben müssen den tatsächlichen Betrieb einschließlich Protokollaufbewahrung beschreiben.
  if (!config.hosting.provider || !config.hosting.address || !config.hosting.logRetention) {
    missing.push('Tatsächlicher Hostinganbieter, Anschrift und Log-Löschfrist');
  }
}

/**
 * Prüft eine konfigurierte PayPal-Adresse; ein leerer Link bleibt zulässig.
 *
 * @returns {void} Kein Rückgabewert.
 */
function checkPaypal() {
  // Ein leerer Link verhindert die Veröffentlichung nicht.
  if (!config.paypalUrl) {
    console.log('PayPal-Link noch leer: Unterstützung bleibt optional und ausgeblendet.');

    return;
  }
  try {
    const url = new URL(config.paypalUrl);                                         // URL-Parsing verhindert eine bloße Teilstringprüfung des Hostnamens.
    const hosts = ['paypal.com', 'www.paypal.com', 'paypal.me', 'www.paypal.me'];  // Ausdrücklich zugelassene PayPal-Hosts; ähnliche Namen genügen nicht.

    // Nur HTTPS und die ausdrücklich unterstützten PayPal-Hosts sind zugelassen.
    if (url.protocol !== 'https:' || !hosts.includes(url.hostname)) missing.push('Gültige HTTPS-PayPal-Adresse');
  } catch {
    missing.push('Gültige PayPal-Adresse');
  }
}

/**
 * Sammelt eine fehlende Rechtebestätigung und Platzhalter in den Root-Rechtstexten.
 *
 * @returns {void} Kein Rückgabewert.
 */
function checkApproval() {
  // Die bestehende manuelle Freigabe bleibt verpflichtend und wird nicht aus grünen Tests abgeleitet.
  if (!process.argv.includes('--rights-confirmed')) {
    missing.push(
      'Freigabe zur öffentlichen Übernahme der Fragen und Abbildungen; nach Klärung --rights-confirmed angeben'
    );
  }

  // Betreiber pflegen fehlende Angaben unmittelbar in diesen Seiten, ohne Generator oder Template.
  for (const file of ['impressum.html', 'datenschutz.html']) {
    // Die bestehende Platzhaltermarkierung kennzeichnet noch nicht vervollständigte Angaben.
    if (readFileSync(resolve(projectRoot, file), 'utf8').includes('missing-field')) {
      missing.push(`${file}: Fehlende Angaben direkt in der Root-HTML-Datei ergänzen`);
    }
  }
}

/**
 * Meldet offene Release-Angaben und setzt bei fehlenden Angaben den Fehlerstatus.
 *
 * @returns {void} Kein Rückgabewert.
 */
function showResult() {
  // Eine einzige offene Pflichtangabe verhindert die technische Release-Freigabe.
  if (missing.length) {
    console.error(`Vor dem öffentlichen Start noch offen:\n${missing.map(value => `- ${value}`).join('\n')}`);
    process.exitCode = 1;

    return;
  }
  console.log(
    'Betreiberangaben vollständig; Freigabe zur Übernahme wurde bestätigt. Technische und rechtliche Endkontrolle am Live-Server bleibt erforderlich.'
  );
}

checkOperator();  // Sammelt fehlende Domain-, Betreiber- und Hostingangaben.
checkPaypal();    // Kontrolliert die optionale Unterstützungsadresse.
checkApproval();  // Erhält die bestehende manuelle Freigabe und die Platzhalterprüfung.
showResult();     // Gibt das Gesamtergebnis mit maschinenlesbarem Exitstatus aus.
