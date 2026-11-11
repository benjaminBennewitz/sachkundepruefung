/* scripts/pages/prepare-pages.mjs */

/**
 * @file Statische Seiten und Suchmaschinenangaben.
 * @description Erzeugt Inhaltsseiten, Header, Footer, SEO-Dateien und den CSP-Hash des JSON-LD-Blocks.
 * @author Benjamin Bennewitz [B²]
 */
import {
  readFileSync,
  writeFileSync,
  rmSync
} from 'node:fs';
import {
  resolve
} from 'node:path';
import {
  createHash
} from 'node:crypto';
import {
  projectRoot,
  readSiteConfig
} from '../config.mjs';
import {
  header,
  disclaimer,
  footer
} from './ui-shell.mjs';
import {
  createContentPages
} from './content-pages.mjs';

const root = projectRoot;
const config = readSiteConfig();

/** Maskiert dynamische Textwerte für die HTML-Ausgabe. */
const escape = value => String(value || '')
  .replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

/** Kennzeichnet fehlende Betreiberangaben im lokalen Entwurf. */
const missing = label => `<strong class="missing-field">[${label} ergänzen]</strong>`;
const operator = config.operator;
const address = operator.address.length ? operator.address.map(escape)
  .join('<br>') : missing('Ladungsfähige Anschrift');
const email = operator.email ?
  `<a href="mailto:${escape(operator.email)}">${escape(operator.email)}</a>` : missing(
    'E-Mail-Adresse');
const incomplete = !operator.address.length || !operator.email || !config.hosting.provider || !
  config.hosting.address || !config.hosting.logRetention;
const draft = incomplete ?
  '<p class="release-note">Entwurf: Betreiber- und Hostingangaben sind noch unvollständig. Vor Veröffentlichung in scripts/site-config.js ergänzen und diese Seiten mit node scripts/pages/prepare-pages.mjs neu erzeugen.</p>' :
  '';

/** Dokumenttitel und Kurztexte für die öffentlichen Informationsseiten. */
const searchMetadata = {
  'hundewissen.html': {
    'title': 'Listenhunde & Haltungsauflagen in NRW | Hundewissen',
    'description': 'Listenhunde in NRW: Orientierung zu Haltungsauflagen, Sachkundenachweis, Maulkorb, Leinenpflicht und Wesenstest – mit Links zu Behörden und Rechtstexten.'
  },
  'quellen.html': {
    'title': 'Sachkunde NRW: Fragenkataloge und Originalquellen',
    'description': 'Quellen der Sachkunde-Fragen für Hunde in NRW: Rhein-Erft, Köln und Tierärztekammern. Originalunterlagen, Lösungsschlüssel und Grenzen der Testreihen.'
  },
  'gut-zu-wissen.html': {
    'title': 'Sachkundeprüfung NRW: Testreihen, Lerntipps & Hundereisen',
    'description': 'Hilfe zum kostenlosen Sachkunde-Trainer für NRW: passende Testreihe wählen, Lernstand speichern und Regeln für Reisen mit Hund nachlesen.'
  }
};

/**
 * Erzeugt eine Inhaltsseite mit gemeinsamer Navigation und SEO-Metadaten.
 * @param {string} file Zieldatei im Projektordner.
 * @param {string} title Sichtbare Hauptüberschrift.
 * @param {string} description Kurzbeschreibung, sofern kein SEO-Eintrag vorliegt.
 * @param {string} content HTML des Seiteninhalts aus den lokalen Vorlagen.
 * @param {boolean} [noindex=false] Schließt einen Entwurf von der Indexierung aus.
 * @returns {void}
 */
function page(file, title, description, content, noindex = false) {
  const documentTitle = searchMetadata[file]?.title ?? `${title} | Sachkunde NRW`;
  description = searchMetadata[file]?.description ?? description;
  const html =
    `<!doctype html>
<html lang="de"${['gut-zu-wissen.html', 'hundewissen.html'].includes(file) ? ' class="knowledge-page"' : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}"><title>${escape(documentTitle)}</title><meta name="description" content="${escape(description)}">${config.origin ? `<link rel="canonical" href="${escape(config.siteUrl)}/${file}">` : ''}<meta property="og:type" content="website"><meta property="og:locale" content="de_DE"><meta property="og:title" content="${escape(documentTitle)}"><meta property="og:description" content="${escape(description)}">${config.origin ? `<meta property="og:url" content="${escape(config.siteUrl)}/${file}">` : ''}<link rel="icon" href="favicon.svg" type="image/svg+xml" sizes="any">  <link rel="icon" href="favicon.png" type="image/png" sizes="96x96">  <link rel="shortcut icon" href="favicon.ico" type="image/x-icon"><script src="scripts/ui/theme.js?v=19"></script><link rel="stylesheet" href="styles/tokens.css?v=19"><link rel="stylesheet" href="styles/interface.css?v=26"></head>
<body><a class="skip-link" href="#inhalt">Zum Inhalt</a>${header(file)}
<main id="inhalt" class="prose wrap" tabindex="-1"><p class="eyebrow">SACHKUNDE / NRW</p><h1>${escape(title)}</h1>${['quellen.html','gut-zu-wissen.html','hundewissen.html'].includes(file) ? disclaimer : ''}${content}</main>${footer()}<script src="scripts/site-config.js?v=23" defer></script><script src="scripts/ui/common.js?v=25" defer></script><script src="scripts/ui/controls.js?v=19" defer></script></body></html>`;
  writeFileSync(resolve(root, file), html.replace(/\r?\n/g, '\r\n'));
}
page('impressum.html', 'Impressum',
  'Anbieter und Kontakt der unabhängigen, kostenlosen NRW-Sachkunde-Lernhilfe.',
  `${draft}<h2>Anbieter und Kontakt</h2><p>${escape(operator.name)}<br>${address}</p><p>E-Mail: ${email}<br>Telefon: ${escape(operator.phone)}</p><h2>Über dieses Projekt</h2><p>Die NRW Sachkundeprüfung Lernhilfe ist ein unabhängiges, kostenlos zugängliches Lernangebot. Sie wird nicht von einer Behörde oder Tierärztekammer betrieben. Der Trainer erteilt keinen Sachkundenachweis und ersetzt keine Prüfung oder behördliche Auskunft.</p><p>Fragen und Lösungen basieren auf den unter <a href="quellen.html">Quellen</a> beschriebenen Unterlagen. Eigene unverbindliche Beispielfragen sind gesondert gekennzeichnet. Verbindlich sind die Vorgaben der zuständigen Stelle. Hinweise auf Übertragungsfehler nehmen wir über die angegebene Kontaktadresse entgegen.</p><h2>Freiwillige Unterstützung</h2><p>Die Nutzung bleibt kostenlos. Eine freiwillige Unterstützung über einen externen PayPal-Link ist keine Voraussetzung für die Nutzung und begründet keinen Anspruch auf zusätzliche Leistungen. Es wird keine Spendenbescheinigung ausgestellt.</p><h2 id="haftung">Hinweise zu Inhalten und Haftung</h2><p><strong>Keine Rechtsberatung, keine behördliche Auskunft und keine Garantie für das Bestehen einer Prüfung.</strong> Die Texte und Fragen dienen ausschließlich dem Lernen und der allgemeinen Orientierung. Für Richtigkeit, Vollständigkeit und Aktualität wird keine Gewähr übernommen. Insbesondere können ältere Originalfragen vom aktuellen Recht oder heutigen fachlichen Empfehlungen abweichen.</p><p>Soweit gesetzlich zulässig, ist eine Haftung für Schäden durch die Nutzung der unentgeltlichen Lerninhalte ausgeschlossen. Unberührt bleiben gesetzlich zwingende Ansprüche, insbesondere wegen Vorsatzes, grober Fahrlässigkeit sowie wegen Verletzung von Leben, Körper oder Gesundheit. Dieser Hinweis hebt gesetzliche Verantwortlichkeiten nicht auf.</p><p>Eine pauschale Distanzierung von verlinkten Inhalten ersetzt keine gesetzliche Pflicht. Bei konkreten Hinweisen auf Rechtsverletzungen oder Übertragungsfehler werden die betroffenen Inhalte geprüft und erforderlichenfalls berichtigt oder entfernt.</p>`
  );
page('quellen.html', 'Quellen & Originalunterlagen',
  'Herkunft der LHundG-NRW-Lernfragen, Originalquellen und Unterschiede zwischen § 3 und § 11.',
  `
<p>Hier findest du die Herkunft der Fragen, die veröffentlichten Originalunterlagen und die Grenzen dieser Lernhilfe. Die Quellen wurden am 6. November 2026 geprüft. Verlinkte öffentliche Fassungen können sich später ändern. Wir verlinken ausschließlich auf die Originalseiten der Herausgeber. Eigene PDF-Downloads und direkte Dokument-Downloads werden hier nicht angeboten.</p><p class="context-note"><strong>§ 3 ist nicht § 11.</strong> Die Tierärztekammern veröffentlichen ihren Katalog für die Sachkunde großer Hunde nach § 11. Er ergänzt hier das Wissen, ersetzt aber nicht die amtstierärztliche Prüfung für gefährliche Hunde nach § 3. Zuständigkeit und Prüfungsvorgaben bitte bei deinem Veterinäramt klären.</p>
<div class="source-cards"><article class="source-card" id="rhein203"><h2>Rhein-Erft-Kreis · 203</h2><p>Fragen zur Vorbereitung für § 3 / § 10. Grundlage des bisherigen 203er-Lernbereichs. Das offizielle PDF enthält auch die Lösungen. Seine einleitenden Angaben zu 34 Fragen / mindestens 24 richtigen Antworten gelten für den dort beschriebenen Prüfungskontext.</p><a href="https://portal.rhein-erft-kreis.de/detail/-/vr-bis-detail/dienstleistung/42735/show" target="_blank" rel="external noopener noreferrer">Offizielle Informationsseite ↗</a></article>
<article class="source-card" id="rhein97"><h2>Rhein-Erft · 97</h2><p>Als „Übungsfragen Sachkunde §6 LHundG NRW Rhein-Erft-Kreis.pdf“ zugesandter Übungsbogen mit eigenem Lösungsteil. Enthält vier Zuordnungsaufgaben.</p><p>Eine eindeutig passende öffentliche Originaladresse liegt für diese zugesandte Fassung nicht vor. Deshalb wird kein vermeintlicher Direktlink angegeben. Die Herkunftsangabe bezeichnet den bereitgestellten Bogen; eine aktuelle Herausgeberschaft dieser Fassung ist noch zu bestätigen.</p></article>
<article class="source-card" id="koeln"><h2>Köln · A / B / C</h2><p>Der Lernbereich enthält 115 aktive Fragen aus dem zugesandten Übungsbogen; A11 ist darin als „entfällt“ markiert. Seine Lösungsschlüssel bleiben an diese Fassung gebunden.</p><p><strong>Andere Referenzfassung:</strong> Das öffentlich erreichbare Kölner PDF (Mai 2019) ist nicht identisch, etwa bei A1. Es wird zur Einordnung verlinkt; seine Fragenummern und Lösungen dürfen nicht auf den importierten Katalog übertragen werden. Ein öffentlicher Direktlink zur exakt zugesandten Fassung ist noch nicht belegt.</p><a href="https://www.stadt-koeln.de/service/produkt/sachkundenachweis-fuer-hundehalterinnen" target="_blank" rel="external noopener noreferrer">Stadt Köln · Sachkundenachweis ↗</a><p id="bochum"><strong>Vorbereitung in Bochum:</strong> Das Ordnungs- und Veterinäramt der Stadt Bochum empfiehlt den öffentlich zugänglichen Kölner Fragenkatalog zur Orientierung an den relevanten Themen. Fragen und Antworten sollen verstanden und nicht nur wörtlich auswendig gelernt werden. Bochum verwendet einen eigenen Fragenkatalog, der nicht zur Weiterverwendung bereitgestellt wurde. Die Empfehlung bestätigt weder die hier importierte Kölner Fassung noch identische Prüfungsfragen, Fragenzahlen oder Bestehensbedingungen.</p><p class="microcopy">Quelle: persönliche E-Mail-Auskunft der Stadt Bochum an den Betreiber vom <time datetime="2026-11-10">10. November 2026</time>; nicht öffentlich abrufbar. Die Auskunft ist keine Freigabe des Bochumer Fragenkatalogs und keine behördliche Anerkennung dieses Trainers.</p></article>
<article class="source-card" id="kammern"><h2>Tierärztekammern · 197</h2><p>Nordrhein und Westfalen-Lippe veröffentlichen denselben 197er-Katalog ab 1. Januar 2025. Die beiden hochgeladenen Lösungsdateien sind bytegleich; die Fragenfassungen stimmen im ausgelesenen Frage- und Antworttext überein.</p><a href="https://www.tieraerztekammer-nordrhein.de/tierhalter/sachkundebescheinigung-lhundg/" target="_blank" rel="external noopener noreferrer">Nordrhein · Informationen zu § 11 ↗</a><a href="https://www.tieraerztekammer-wl.de/fuer-tierhalter/sachkundenachweis" target="_blank" rel="external noopener noreferrer">Westfalen-Lippe · Informationen ↗</a></article></div>
<h2>Was wurde ergänzt und berichtigt?</h2><p>Der bisherige bereinigte Pool umfasst 398 Fragen. Nach der Berichtigung dreier Übertragungsfehler entsprechen 195 der 197 Kammerfragen bereits vorhandenen Fragen samt Antwortmöglichkeiten und Lösungen (nach Normalisierung von Formatierung und Satzzeichen). Zwei Formulierungsvarianten werden zusätzlich aufgenommen. Der Gesamtpool umfasst deshalb 400 Fragen, der Kammer-Lernbereich separat alle 197.</p><div class="table-scroll"><table><caption>Dokumentierte Unterschiede zum bisherigen Datenbestand</caption><thead><tr><th>Originalfrage</th><th>Feststellung</th><th>Umsetzung</th></tr></thead><tbody><tr><td>158</td><td>Rhein-Erft-Schlüssel enthielt bisher nur A, B, C; Antworttext unterscheidet sich geringfügig.</td><td>D anhand des offiziellen PDFs ergänzt; Formulierungsvariante separat.</td></tr><tr><td>160</td><td>Im bisherigen Rhein-Erft-Datensatz fehlte D.</td><td>Korrigiert auf B, C, D.</td></tr><tr><td>161</td><td>Im bisherigen Rhein-Erft-Datensatz fehlte D.</td><td>Korrigiert auf A, B, C, D.</td></tr><tr><td>173</td><td>Antwort A im Kammerkatalog ist kürzer; Lösung bleibt A, C.</td><td>Beide Formulierungen bleiben quellbezogen erhalten.</td></tr></tbody></table></div><p>Die drei fehlenden D-Antworten stehen in der offiziellen Rhein-Erft-Lösungstabelle hinter einem Seitenumbruch (Seiten 49–50). Es wurden keine Lösungen aus allgemeinem Hundewissen abgeleitet. Eine Frage ist nur bei vollständiger richtiger Auswahl ohne zusätzliche falsche Antwort korrekt. Inhaltlich ältere Aussagen der Originale werden nicht stillschweigend modernisiert.</p>
<h2 id="simulation">Wie ist die MG-Simulation einzuordnen?</h2><p>Die Simulation verwendet 119 zufällige, unterschiedliche Fragen aus dem bisherigen 398er-Basispool. Kein Zeitlimit, mindestens 90 vollständig richtige Antworten. Diese Eckdaten beruhen auf einer privaten Mitteilung der zuständigen Stelle an den Projektinitiator und sind öffentlich nicht unabhängig nachgewiesen. Sie gelten nicht automatisch für andere Kommunen. Die tatsächlichen 119 MG-Fragen liegen nicht vor. Deshalb heißt der Modus ausdrücklich Simulation.</p>    <section aria-labelledby="rechtsquellen">
      <h2 id="rechtsquellen">Rechtstexte und ergänzende Vorbereitung</h2>
      <p>Ergänzender Abgleich am <time datetime="2026-11-11">11. November 2026</time>. Die Rechtstexte helfen
        bei Lücken und verkürzten Formulierungen älterer Fragebögen. Die folgenden Links führen zu den Originalquellen.</p>
      <ul>
        <li><a href="https://www.gesetze-im-internet.de/tierschg/BJNR012770972.html" target="_blank" rel="noopener noreferrer external">Tierschutzgesetz, besonders §§ 1–3 ↗</a> – Grundpflichten und Verbote.</li>
        <li><a href="https://www.gesetze-im-internet.de/tierschhuv/BJNR083800001.html" target="_blank" rel="noopener noreferrer external">Tierschutz-Hundeverordnung ↗</a> – konkrete Anforderungen an Haltung und Versorgung.</li>
        <li><a href="https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/" target="_blank" rel="noopener noreferrer external">LHundG NRW ↗</a> – Hundekategorien, Nachweise und Pflichten.</li>
        <li><a href="https://service.essen.de/detail/-/vr-bis-detail/dienstleistung/41286/show" target="_blank" rel="noopener noreferrer external">Stadt Essen: Meldung und Haltungserlaubnis ↗</a> – örtliches Verfahren, kein Prüfungskatalog.</li>
        <li><a href="https://www.essen.de/leben/umwelt/veterinaerwesen/hundehaltung.de.html" target="_blank" rel="noopener noreferrer external">Stadt Essen: Vorbereitung auf die Sachkundeprüfung ↗</a> – Themen und Originalrechtstexte zusätzlich zu Fragenkatalogen.</li>
      </ul>
      <p id="essen"><strong>Ergänzende Essener Prüfungsangaben:</strong> Persönliche E-Mail-Auskünfte der Stadt
        Essen vom 11. November 2026 bestätigen die Prüfungszuständigkeit für §-3-Hunde sowie ca. 50 schriftliche
        Fragen, grundsätzlich ohne Zeitlimit. Die drei ungefähr gleichmäßig berücksichtigten Teile „Biologie und
        Gesundheit“, „Verhalten und Erziehung“ und „Recht“ müssen jeweils mit 75 % der Punkte bestanden werden;
        die Grenze gilt auch insgesamt. Teilpunkte sind möglich. Das genaue Bewertungsschema ist nicht zur
        Veröffentlichung vorgesehen; ein Originalfragenkatalog wurde nicht bereitgestellt. Die Auskünfte sind
        nicht öffentlich abrufbar und stellen keine behördliche Anerkennung des Trainers dar.
        <a href="hundewissen.html#ort-essen">Ablauf, Nachgespräch und Hinweise für Essen</a>.</p>
      <p id="essen-beispiel"><strong>Eigene Essen-Beispielsimulation:</strong> 50 Fragen mit selbst gewählter
        Verteilung 17 / 17 / 16; keine Essener Originalfragen. 34 Fragen stammen unverändert aus dem
        <a href="#rhein203">Rhein-Erft-203-Katalog</a>. Die 16 gekennzeichneten Rechtsfragen und ihre Erläuterungen
        wurden für diesen Trainer verfasst und am 11. November 2026 mit den oben verlinkten Originalrechtstexten
        abgeglichen. Jede eigene Frage nennt ihre Vorschrift und einen Direktlink zum Herausgeber.
        Die angenommene Themenauswahl ist nicht behördlich bestätigt. Keine Rechtsberatung oder Prüfungsgarantie.
        Die Übung vergibt keine Teilpunkte; das nicht veröffentlichte Essener Bewertungsschema wird nicht rekonstruiert.
        <a href="gut-zu-wissen.html#essen-beispiel">Übungswertung und Grenzen</a>.</p>
      <p><a href="hundewissen.html#lernabdeckung">Welche Themen deckt der Trainer ab?</a> ·
        <a href="hundewissen.html#recht">Leseplan und rechtliche Präzisierungen</a> ·
        <a href="hundewissen.html#staedte">Vorbereitung nach Stadt und Kreis</a></p>
    </section>
<h2>Originale und Nutzungsrechte</h2><p>Die Rechte an den Fragen und Abbildungen verbleiben bei den jeweiligen Rechteinhabern. Die Bereitstellung eines PDFs zum Download bedeutet nicht automatisch eine freie Lizenz zur Wiederveröffentlichung in einem Online-Trainer. Die Freigabe zur öffentlichen Übernahme der hier verwendeten Texte und Abbildungen ist vor dem öffentlichen Start zu klären. Die Originalseiten der Herausgeber werden verlinkt; eigene oder direkte PDF-Downloads werden nicht angeboten.</p><p><a class="primary button" href="./#trainer">Zurück zum Lernen →</a></p>`
  );
createContentPages(page, {
  root,
  config,
  escape,
  address,
  email
});
const indexPath = resolve(root, 'index.html');
let index = readFileSync(indexPath, 'utf8');
index = index.replace(/<header class="site-header wrap">[\s\S]*?<\/header>/, header());
if (!index.includes('<!--legal-disclaimer:start-->')) index = index.replace(
  /<div class="wrap"><p class="context-note">[\s\S]*?<\/p><\/div>/,
  '<!--legal-disclaimer:start--><!--legal-disclaimer:end-->');
index = index.replace(/<!--legal-disclaimer:start-->[\s\S]*?<!--legal-disclaimer:end-->/,
  '<!--legal-disclaimer:start--><!--legal-disclaimer:end-->');
index = index.replace(/<footer class="site-footer wrap">[\s\S]*?<\/footer>/, footer(true));
index = index.replace(/<!--hero-disclaimer:start-->[\s\S]*?<!--hero-disclaimer:end-->/,
  '<!--hero-disclaimer:start-->' + disclaimer + '<!--hero-disclaimer:end-->');
index = index.replace(/<link rel="canonical"[^>]*>/g, '')
  .replace(/<meta property="og:url"[^>]*>/g, '');
index = index.replace(/(<meta name="robots" content=")[^"]*(")/, '$1index,follow$2');
if (config.origin) {
  index = index.replace('</head>',
    `<link rel="canonical" href="${escape(config.siteUrl)}/"><meta property="og:url" content="${escape(config.siteUrl)}/"></head>`
    );
}
index = index.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (match,
  start, value, end) => {
  const schema = JSON.parse(value);
  if (config.origin) schema.url = `${config.siteUrl}/`;
  else delete schema.url;
  return start + JSON.stringify(schema)
    .replace(/</g, '\\u003c') + end;
});
writeFileSync(indexPath, index.replace(/\r?\n/g, '\r\n'));
const sitemapPath = resolve(root, 'sitemap.xml');
const pages = ['', 'quellen.html', 'gut-zu-wissen.html', 'hundewissen.html', 'impressum.html',
  'datenschutz.html'
];
const robots = ['User-agent: *', 'Allow: /'];

if (config.origin) {
  const entries = pages.map(path =>
    `  <url>\n    <loc>${escape(config.siteUrl)}/${path}</loc>\n  </url>`);
  const sitemap = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    ''
  ].join('\n');
  writeFileSync(sitemapPath, sitemap.replace(/\r?\n/g, '\r\n'));
  robots.push(`Sitemap: ${config.siteUrl}/sitemap.xml`);
} else {
  rmSync(sitemapPath, {
    force: true
  });
}

writeFileSync(resolve(root, 'robots.txt'), robots.join('\r\n') + '\r\n');
const jsonLd = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
  ?.[1];
if (jsonLd) {
  const hash = createHash('sha256')
    .update(jsonLd)
    .digest('base64');
  const headersPath = resolve(root, '.htaccess');
  const headers = readFileSync(headersPath, 'utf8')
    .replace(/'sha256-[^']*'/, `'sha256-${hash}'`);
  writeFileSync(headersPath, headers.replace(/\r?\n/g, '\r\n'));
}
console.log('Inhaltsseiten und robots.txt aktualisiert.');
console.log(config.origin ? 'Sitemap mit sechs absoluten Seitenadressen erzeugt.' :
  'Domain noch offen: keine leere oder erfundene Sitemap erzeugt.');
if (incomplete) console.log(
  'Offen: ladungsfähige Anschrift / E-Mail / tatsächliche Hostingangaben.');
