/* scripts/pages/content-pages.mjs */

/**
 * @file Inhaltsvorlagen der Informationsseiten.
 * @description Pflegt Hilfetexte, Behördenquellen und wiederverwendete Datenschutzabschnitte.
 * @author Benjamin Bennewitz [B²]
 */
import {
  readFileSync
} from 'node:fs';
import {
  fileURLToPath
} from 'node:url';
const links = {
  law: 'https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/',
  vv: 'https://recht.nrw.de/lrmb/verwaltungsvorschrift/07102026-verwaltungsvorschriften-zum-landeshundegesetz-vv-lhundg-nrw/',
  dvo: 'https://recht.nrw.de/lrgv/rechtsverordnung/09122025-ordnungsbehoerdliche-verordnung-zur-durchfuehrung-des/',
  koeln: 'https://www.stadt-koeln.de/service/produkt/sachkundenachweis-fuer-hundehalterinnen',
  verhalten: 'https://www.stadt-koeln.de/service/produkte/00610/index.html',
  kammer: 'https://www.tieraerztekammer-nordrhein.de/tierhalter/sachkundebescheinigung-lhundg/',
  ministry: 'https://www.mlv.nrw.de/themen/verbraucherschutz/tierschutz-und-tierhaltung/hobby-tierhaltung/hunde/'
};

/** Verlinkt eine gepflegte Behördenquelle mit sicherer Zielöffnung. */
const ref = (key, label) =>
  `<a href="${links[key]}" target="_blank" rel="noopener noreferrer external">${label} ↗</a>`;

/**
 * Geprüfte Reisehinweise für kurze private Aufenthalte ab NRW.
 * @type {string}
 * @description Quellenstand 09.11.2026; individuelle Auflagen sind am Reiseziel zu klären.
 */
const travelContent = `
<section class="travel-section" aria-labelledby="reisen">
  <p class="eyebrow">MIT HUND UNTERWEGS</p>
  <h2 id="reisen">Andere Orte. Andere Regeln.</h2>
  <p>Kurzübersicht für private Besuche und Urlaubsreisen <strong>ab NRW</strong>, besonders mit Listenhunden. Ein Umzug, eine Übernahme oder ein Tiertransport kann andere Voraussetzungen haben. Innerhalb Deutschlands geht es um Aufenthalts- und Führungsregeln, nicht um eine Einreise aus dem Ausland.</p>
  <aside class="travel-note" aria-label="Vor der Reise beachten">
    <strong>Die NRW-Befreiung reist nicht automatisch mit.</strong>
        <ul class="travel-checklist">
      <li><strong>Besuch melden?</strong> Vor der Reise prüfen, ob Urlaub, Besuch oder Durchreise am Ziel anzeige-, melde- oder genehmigungspflichtig sind. Frage die zuständige Behörde nach Fristen und benötigten Unterlagen für deinen Hund und deinen Aufenthaltszeitraum.</li>
      <li><strong>Wesenstest und Befreiung:</strong> Ein in NRW bestandener Test oder eine Leinen-/Maulkorbbefreiung gelten in anderen Bundesländern und Staaten nicht zwangsläufig. Die Anerkennung muss die zuständige Stelle am Ziel bestätigen.</li>
      <li><strong>Papiere mitnehmen:</strong> Heimtier-/Impfausweis, Haltungserlaubnis, Versicherungsnachweis sowie Test-, Befreiungs- und gegebenenfalls Besuchsbescheide griffbereit mitführen. Für Auslandsreisen ist der EU-Heimtierausweis wichtig; der normale Impfpass allein reicht dafür nicht.</li>
      <li><strong>Örtliche Regeln:</strong> Rassedefinitionen können auch Mischlinge erfassen. Leine, Maulkorb sowie Vorgaben für Durchreise, Unterkunft und Verkehrsmittel mitprüfen.</li>
    </ul>
  </aside>
  <h3 id="bundeslaender">Die anderen 15 Bundesländer</h3>
  <p>Besuchsfristen sind Ausnahmen von bestimmten Pflichten, keine pauschale Reiseerlaubnis. Örtliche Regeln und individuelle Anordnungen können zusätzlich gelten.</p>
  <div class="travel-grid">
    <details class="travel-card" id="reise-bw">
      <summary><span>Baden-Württemberg</span><span class="travel-tag">Leine + Maulkorb</span></summary>
      <div class="travel-card-body">
        <p>Für betroffene Kampf- und gefährliche Hunde gelten auch bei Urlaub und Durchreise die besonderen Führungsregeln: sichere Aufsicht sowie grundsätzlich Leine und Maulkorb. Die Besuchsausnahme ersetzt diese Pflichten nicht; örtliche Vorschriften kommen hinzu.</p>
        <p class="source-links"><a href="https://im.baden-wuerttemberg.de/fileadmin/redaktion/m-im/intern/dateien/pdf/Kampfhundeverordnung.pdf" target="_blank" rel="noopener noreferrer external">PolVOgH: § 7 Abs. 2 i. V. m. § 4 ↗</a> · <a href="https://im.baden-wuerttemberg.de/de/sicherheit/kampfhundeverordnung" target="_blank" rel="noopener noreferrer external">Innenministerium BW ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-bayern">
      <summary><span>Bayern</span><span class="travel-tag">Gemeinde prüfen</span></summary>
      <div class="travel-card-body">
        <p>Nach Auskunft der Bayerischen Polizei löst ein nur vorübergehender Urlaub von wenigen Wochen keine Haltungserlaubnis aus. Leinenpflichten und weitere Anordnungen bestimmt aber auch die Gemeinde. <strong>Vorher konkret am Urlaubsort nachfragen:</strong> Freising verlangt beispielsweise eine vorherige Anmeldung/Genehmigung und Leine mit Maulkorb.</p>
        <p class="source-links"><a href="https://www.gesetze-bayern.de/Content/Document/BayLStVG-37" target="_blank" rel="noopener noreferrer external">Art. 37 LStVG ↗</a> · <a href="https://www.polizei.bayern.de/aktuelles/recht/001665/index.html" target="_blank" rel="noopener noreferrer external">Polizei Bayern: Frage 6 ↗</a> · <a href="https://www.freising.de/leben-wohnen/tiere/kampfhunde" target="_blank" rel="noopener noreferrer external">Beispiel Freising ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-berlin">
      <summary><span>Berlin</span><span class="travel-tag">Leine + Maulkorb</span></summary>
      <div class="travel-card-body">
        <p>Für Listenhunde gilt in der Öffentlichkeit grundsätzlich Leinenpflicht; ab dem siebten Lebensmonat zusätzlich Maulkorbpflicht. Eine bestandene Wesensprüfung hebt diese Maulkorbpflicht nicht auf. Auch Gäste müssen die Berliner Anforderungen an die Hundehaftpflicht beachten; Anzeige und Besuchsregelung beim zuständigen Ordnungsamt klären.</p>
        <p class="source-links"><a href="https://www.berlin.de/sen/verbraucherschutz/aufgaben/hundehaltung/artikel.1485419.php" target="_blank" rel="noopener noreferrer external">Berliner HundeG / FAQ: Nr. 15, 16 und 19 ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-brandenburg">
      <summary><span>Brandenburg</span><span class="travel-tag">Besuch bis 1 Monat</span></summary>
      <div class="travel-card-body">
        <p>Seit Juli 2024 gibt es keine Rasseliste mehr. Bei einem ununterbrochenen Besuch bis zu einem Monat entfallen die Kennzeichnungs-/Anzeigepflicht nach § 2 und die Erlaubnispflicht nach § 6. Die übrigen Regeln gelten weiter – insbesondere Leine an den genannten Orten und Maulkorb in öffentlichen Verkehrsmitteln und Verwaltungsgebäuden.</p>
        <p class="source-links"><a href="https://bravors.brandenburg.de/verordnungen/hundehv" target="_blank" rel="noopener noreferrer external">HundehV: §§ 3, 5 und 15 ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-bremen">
      <summary><span>Bremen</span><span class="travel-tag">Besuch max. 24 h</span></summary>
      <div class="travel-card-body">
        <p>Für Pitbull Terrier, Bullterrier, American Staffordshire Terrier, Staffordshire Bullterrier und entsprechende Kreuzungen gilt grundsätzlich ein Haltungsverbot. Die Stadt nennt als Besuchsausnahme <strong>höchstens 24 Stunden</strong>; rechtmäßige Haltung am Herkunftsort ist Voraussetzung. Dabei gelten Leine und Maulkorb. Längere Aufenthalte vorher mit dem Ordnungsamt klären.</p>
        <p class="source-links"><a href="https://www.service.bremen.de/dienstleistungen/gefaehrliche-hunde-10103" target="_blank" rel="noopener noreferrer external">Bremen: HundeHG, insbesondere §§ 3 und 5 ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-hamburg">
      <summary><span>Hamburg</span><span class="travel-tag">Besuch bis 2 Monate</span></summary>
      <div class="travel-card-body">
        <p>Bei einer Haltung bis zu zwei Monaten sieht § 22 Abs. 3 unter anderem eine Ausnahme von der Erlaubnispflicht vor; die kurze Aufenthaltsdauer muss auf Verlangen nachgewiesen werden. Für gefährliche Hunde bleiben grundsätzlich Leine und Maulkorb vorgeschrieben. Die allgemeine Leinenpflicht gilt auch für andere Hunde.</p>
        <p class="source-links"><a href="https://www.hamburg.de/politik-und-verwaltung/behoerden/bjv/themen/verbraucherschutz/tiere/hundegesetz" target="_blank" rel="noopener noreferrer external">Hamburg: HundeG, §§ 8, 17 und 22 ↗</a> · <a href="https://www.hamburg.de/politik-und-verwaltung/behoerden/bjv/themen/verbraucherschutz/tiere/hundegesetz/anleinpflicht-89206" target="_blank" rel="noopener noreferrer external">Aktuelle Hinweise zu Leine und Maulkorb ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-hessen">
      <summary><span>Hessen</span><span class="travel-tag">Sachkunde: 4 Wochen</span></summary>
      <div class="travel-card-body">
        <p>Bei einem vorübergehenden Aufenthalt bis zu vier Wochen kann für gefährliche Hunde der Sachkundenachweis durch das Führen mit Maulkorb ersetzt werden. Für auswärtige gefährliche Hunde gilt zudem Leinenpflicht. <strong>Das ist keine pauschale Ausnahme von allen Erlaubnispflichten:</strong> Aufenthalt und Unterlagen vorher mit dem Ordnungsamt klären.</p>
        <p class="source-links"><a href="https://www.rv.hessenrecht.hessen.de/bshe/document/jlr-NNLHE0000541F" target="_blank" rel="noopener noreferrer external">HundeVO: § 4 Abs. 5 und § 9 ↗</a> · <a href="https://rp-darmstadt.hessen.de/sites/rp-darmstadt.hessen.de/files/2022-03/hinweise_fuer_die_durchfuehrung_der_hundevo_vom_5.11.2014.pdf" target="_blank" rel="noopener noreferrer external">Amtliche VVHundeVO 2026: zu § 4 Abs. 5 ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-mv">
      <summary><span>Mecklenburg-Vorpommern</span><span class="travel-tag">Besuchsausnahme</span></summary>
      <div class="travel-card-body">
        <p>Die Rasse allein entscheidet nicht über die Gefährlichkeit. Bei einem nur vorübergehenden Aufenthalt mit einem gefährlichen Hund entfällt die Haltungserlaubnis; bei mehr als einem Monat ist der Besuch der örtlichen Ordnungsbehörde anzuzeigen. Die sonstigen Führungs- und Sicherungspflichten bleiben bestehen.</p>
        <p class="source-links"><a href="https://verwaltung.bund.de/leistungsverzeichnis/DE/leistung/99110009010000/herausgeber/MV-117899302/region/130000000000" target="_blank" rel="noopener noreferrer external">HundehVO M-V: § 8 Abs. 4 / Behördeninformation ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-niedersachsen">
      <summary><span>Niedersachsen</span><span class="travel-tag">Keine Rasseliste</span></summary>
      <div class="travel-card-body">
        <p>Eine Rassezugehörigkeit allein führt nicht zur Einstufung als gefährlich. Für im Einzelfall gefährliche Hunde gelten besondere Regeln. Örtliche Leinenpflichten beachten; in der freien Landschaft gilt während der Brut- und Setzzeit vom <strong>1. April bis 15. Juli</strong> grundsätzlich Leinenpflicht.</p>
        <p class="source-links"><a href="https://www.laves.niedersachsen.de/startseite/tiere/tierschutz/tierhaltung/das-niedersaechsische-hundegesetz-nhundg-110827.html" target="_blank" rel="noopener noreferrer external">NHundG: § 7 / LAVES ↗</a> · <a href="https://www.ml.niedersachsen.de/startseite/themen/wald_holz_jagd/wald_und_forstwirtschaft/mit-dem-hund-in-der-freien-landschaft-faq-132036.html" target="_blank" rel="noopener noreferrer external">NWaldLG: § 33 / Landesministerium ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-rp">
      <summary><span>Rheinland-Pfalz</span><span class="travel-tag">Besuch bis 2 Monate</span></summary>
      <div class="travel-card-body">
        <p>Ohne Wohnung in Rheinland-Pfalz greift bei höchstens zwei Monaten ununterbrochenem Aufenthalt die Besuchsausnahme insbesondere von der Haltungserlaubnis. Für dort gefährliche Hunde bleiben grundsätzlich Leinen- und Maulkorbpflicht bestehen. American Staffordshire Terrier, Staffordshire Bullterrier, Pit-Bull-Typen und deren Abkömmlinge sind besonders erfasst.</p>
        <p class="source-links"><a href="https://landesrecht.rlp.de/bsrp/document/jlr-LHundGRP2004rahmen" target="_blank" rel="noopener noreferrer external">LHundG RLP: §§ 1, 5 und 9 ↗</a> · <a href="https://service.rlp.de/detail?areaId=36691&amp;ouId=&amp;pstId=8966754" target="_blank" rel="noopener noreferrer external">Behördenhinweise Rheinland-Pfalz ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-saarland">
      <summary><span>Saarland</span><span class="travel-tag">Vorher abstimmen</span></summary>
      <div class="travel-card-body">
        <p>Für Listenhunde bestehen Sondervorschriften nach § 6 der saarländischen Polizeiverordnung. Erlaubnis, Anerkennung eines vorhandenen Wesenstests und konkrete Besuchsbedingungen vor der Reise mit der Ortspolizeibehörde klären. Eine NRW-Befreiung allein ist keine Bestätigung für das Saarland.</p>
        <p class="source-links"><a href="https://www.saarbruecken.de/rathaus/was_erledige_ich_wo/index-k" target="_blank" rel="noopener noreferrer external">Saarbrücken: Kampfhunde / Listenhunde, § 6 PVO ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-sachsen">
      <summary><span>Sachsen</span><span class="travel-tag">Leine + Maulkorb</span></summary>
      <div class="travel-card-body">
        <p>Für nach sächsischem Recht gefährliche Hunde gelten außerhalb sicher umfriedeter Grundstücke sowie auf Zuwegen und in Treppenhäusern von Mehrfamilienhäusern Leine und Maulkorb. Eine Person darf nicht mehrere gefährliche Hunde gleichzeitig führen. Erlaubnis und mögliche Anerkennung der Unterlagen vor dem Besuch bei der zuständigen Behörde klären.</p>
        <p class="source-links"><a href="https://revosax.sachsen.de/vorschrift/4280" target="_blank" rel="noopener noreferrer external">GefHundG: §§ 5 und 6 ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-st">
      <summary><span>Sachsen-Anhalt</span><span class="travel-tag">Besuch bis 2 Monate</span></summary>
      <div class="travel-card-body">
        <p>Wer dort keine Hauptwohnung hat und mit dem Hund höchstens zwei Monate ununterbrochen bleibt, fällt unter die Besuchsausnahme von § 4 Abs. 1 und 2. Das betrifft den dortigen Wesenstestnachweis bzw. die Haltungserlaubnis. Allgemeine Sicherheitspflichten, örtliche Leinenregeln und individuelle Anordnungen gelten weiter.</p>
        <p class="source-links"><a href="https://lvwa.sachsen-anhalt.de/fileadmin/Bibliothek/Politik_und_Verwaltung/LVWA/LVwA/Dokumente/2_bauordnungkommunales/201/hunde/2016_hundeg.pdf" target="_blank" rel="noopener noreferrer external">HundeG LSA: § 4 Abs. 3 Nr. 3 ↗</a> · <a href="https://mi.sachsen-anhalt.de/sicherheit-ordnung/page/gefahrenabwehr-hundegesetz" target="_blank" rel="noopener noreferrer external">Landesministerium: aktuelle Übersicht ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-sh">
      <summary><span>Schleswig-Holstein</span><span class="travel-tag">Keine Rasseliste</span></summary>
      <div class="travel-card-body">
        <p>Die Gefährlichkeit wird anhand des Verhaltens statt allein anhand der Rasse beurteilt. Leinenpflichten gelten unter anderem in bestimmten öffentlichen Bereichen; zusätzliche Regeln bestehen beispielsweise im Wald, an Stränden und in Schutzgebieten. Bei individuell gefährlichen Hunden die Anforderungen vorher mit dem Amt klären.</p>
        <p class="source-links"><a href="https://www.schleswig-holstein.de/DE/fachinhalte/T/tierschutz/Hunde/_documents/hundehaltung_privat.html" target="_blank" rel="noopener noreferrer external">HundeG SH: allgemeine Pflichten / Land SH ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-thueringen">
      <summary><span>Thüringen</span><span class="travel-tag">Besuchsregeln prüfen</span></summary>
      <div class="travel-card-body">
        <p>Für gefährliche Hunde regelt § 12 insbesondere das Führen mit Leine und Maulkorb; § 13 enthält Ausnahmen für vorübergehende Aufenthalte ohne Wohnung in Thüringen. Vor der Reise die Einstufung des Hundes und die Anwendbarkeit der Besuchsausnahme beim Ordnungsamt bestätigen lassen.</p>
        <p class="source-links"><a href="https://www.landesrecht.thueringen.de/bsth/document/jlr-NNLTH00003900" target="_blank" rel="noopener noreferrer external">ThürTierGefG: §§ 3, 12 und 13 ↗</a></p>
      </div>
    </details>
  </div>
  <h3 id="ausland">Niederlande, Österreich, Belgien und Italien</h3>
  <div class="travel-note">
    <strong>EU-Basis für diese vier Reiseziele</strong>
    <p>Für die übliche private Reise mit deinem Hund aus Deutschland: Kennzeichnung durch Mikrochip (ältere, rechtmäßig verwendbare Kennzeichnungen bleiben möglich), EU-Heimtierausweis und gültige Tollwutimpfung. Die Kennzeichnung muss vor bzw. spätestens bei der Impfung erfolgen; nach der Erstimpfung mindestens 21 Tage warten. Bei lückenloser Auffrischung beginnt diese Wartezeit nicht erneut. Für Jungtiere keine Ausnahme voraussetzen. Die Übersicht betrifft Reisen ohne Verkauf oder Halterwechsel, üblicherweise mit höchstens fünf Heimtieren.</p>
    <p class="source-links"><a href="https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX:32026R0131" target="_blank" rel="noopener noreferrer external">VO (EU) 2026/131: insbesondere Art. 7–11 ↗</a> · <a href="https://europa.eu/youreurope/citizens/travel/carry/pets-and-other-animals/index_de.htm" target="_blank" rel="noopener noreferrer external">EU: Reisen mit Haustieren ↗</a></p>
  </div>
  <div class="travel-grid travel-countries">
    <details class="travel-card" id="reise-nl">
      <summary><span>Niederlande</span><span class="travel-tag">EU-Basis + Gemeinde</span></summary>
      <div class="travel-card-body">
        <p>Das frühere landesweite Pitbull-Verbot nach der „Regeling agressieve dieren“ wurde aufgehoben. Die hier geprüften Einreisehinweise nennen kein rassebezogenes Einreiseverbot. Gemeinden können jedoch Leinen- und Maulkorbauflagen für gefährliche Hunde festlegen; Strand- und Parkregeln sind örtlich verschieden.</p>
        <p class="source-links"><a href="https://english.nvwa.nl/topics/animal-health/travelling-to-the-netherlands-with-your-dog-or-cat" target="_blank" rel="noopener noreferrer external">NVWA: amtliche Einreisehinweise ↗</a> · <a href="https://zoek.officielebekendmakingen.nl/stcrt-2008-2461.html" target="_blank" rel="noopener noreferrer external">Rechtstext: Aufhebung der RAD ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-at">
      <summary><span>Österreich</span><span class="travel-tag">Bundesland entscheidet</span></summary>
      <div class="travel-card-body">
        <p>Die EU-Basis regelt die Tiergesundheit; für das Führen gelten zusätzlich Landes- und Gemeinderegeln. Besonders beachten:</p>
        <ul>
          <li><strong>Wien:</strong> Für Listenhunde grundsätzlich Leine und ab über sechs Monaten Maulkorb, auch bei kurzem Besuch; Ausnahme für vollständig umzäunte Hundezonen. Führschein-/Besuchsfragen vorher mit MA 60 klären.</li>
          <li><strong>Niederösterreich:</strong> Für Hunde mit erhöhtem Gefährdungspotenzial gelten an den gesetzlich bezeichneten öffentlichen Orten Leine <em>und</em> Maulkorb.</li>
          <li><strong>Oberösterreich:</strong> Für Hunde spezieller Rassen ab zwölf Monaten grundsätzlich Leine <em>und</em> Maulkorb an öffentlichen Orten, soweit keine örtlich wirksame Befreiung vorliegt; Ausnahmen für eingezäunte Freilaufflächen.</li>
          <li><strong>Vorarlberg:</strong> Listenhundehaltung ist bewilligungspflichtig. Die Gemeinde muss klären, welche Vorgaben für den geplanten Aufenthalt gelten. Auch die anderen Bundesländer separat am Ziel prüfen.</li>
        </ul>
        <p class="source-links"><a href="https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrW&amp;Gesetzesnummer=20000404" target="_blank" rel="noopener noreferrer external">Wien: Tierhaltegesetz § 5a ↗</a> · <a href="https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LrNO&amp;Gesetzesnummer=20000995" target="_blank" rel="noopener noreferrer external">NÖ: Hundehaltegesetz § 8 ↗</a> · <a href="https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=LROO&amp;Gesetzesnummer=20001317" target="_blank" rel="noopener noreferrer external">OÖ: HHG 2024 §§ 6 und 9 ↗</a> · <a href="https://www.oesterreich.gv.at/.syndication?municipalityCode=20724&amp;pageId=4b0716c6-14e8-4c66-b675-9fe993322b2c" target="_blank" rel="noopener noreferrer external">Vorarlberg: Landes-Sicherheitsgesetz / Kampfhundeverordnung ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-be">
      <summary><span>Belgien</span><span class="travel-tag">Gemeinde entscheidet</span></summary>
      <div class="travel-card-body">
        <p>Die amtlichen tiergesundheitlichen Einreisehinweise verlangen die EU-Basis. Zusätzlich die Polizeiverordnung jeder Zielgemeinde prüfen: Dort können rassebezogene Auflagen und Verbote stehen. <strong>Beispiel Lüttich:</strong> Leine und Maulkorb für die dort aufgeführten Rassen, darunter Amstaff, sowie deren Kreuzungen auf öffentlichen Wegen und öffentlich zugänglichem Privatgelände. Das ist keine Regel für ganz Belgien.</p>
        <p class="source-links"><a href="https://www.fasfc.be/import-belgium/going-holiday/rabies-and-travelling-pets" target="_blank" rel="noopener noreferrer external">FASFC: Einreise aus EU-Staaten ↗</a> · <a href="https://www.policeliege.be/128/article" target="_blank" rel="noopener noreferrer external">Lüttich: Polizeiverordnung, Änderungen 2015/2023 ↗</a></p>
      </div>
    </details>
    <details class="travel-card" id="reise-it">
      <summary><span>Italien</span><span class="travel-tag">Leine bis 1,5 m</span></summary>
      <div class="travel-card-body">
        <p>Zusätzlich zur EU-Basis gilt nach der nationalen Hunde-Sicherheitsverordnung: In Stadtgebieten und öffentlich zugänglichen Bereichen Leine von höchstens <strong>1,5 Metern</strong>, ausgenommen ausgewiesene Hundeauslaufflächen. Einen passenden Maulkorb mitführen und bei Gefahr oder behördlicher Aufforderung anlegen. Für behördlich als besonders riskant erfasste Hunde gelten strengere Regeln. Regionale und kommunale Regeln zusätzlich prüfen.</p>
        <p class="source-links"><a href="https://www.gazzettaufficiale.it/eli/id/2013/09/06/13A07313/sg" target="_blank" rel="noopener noreferrer external">Ordinanza 6 agosto 2013: Art. 1 und 3 ↗</a> · <a href="https://www.gazzettaufficiale.it/eli/id/2026/09/05/26A04624/SG" target="_blank" rel="noopener noreferrer external">Fortgeltung: Ordinanza 16 luglio 2026 ↗</a></p>
      </div>
    </details>
  </div>
  <p class="microcopy">Weitere Länder sind hier noch nicht geprüft. Aus dieser Übersicht lässt sich keine Freigabe für andere Ziele oder Transitländer ableiten.</p>
  <h3 id="rueckreise">Rückreise nach Deutschland: bei Listenhunden mitdenken</h3>
  <p>Für Pitbull-Terrier, American Staffordshire-Terrier, Staffordshire-Bullterrier, Bullterrier und deren Kreuzungen besteht ein grundsätzliches Verbringungs-/Einfuhrverbot. <strong>Die Rückkehr nach einem vorübergehenden Auslandsaufenthalt an einen Ort in Deutschland, an dem der Hund rechtmäßig gehalten werden darf, ist ausgenommen.</strong> Dafür Identität und berechtigte Haltung mit geeigneten amtlichen Bescheinigungen nachweisen und die vorgeschriebenen Unterlagen mitführen. Die Vier-Wochen-Regel für Begleitpersonen mit Wohnsitz im Ausland ist eine andere Ausnahme.</p>
  <p class="source-links"><a href="https://www.gesetze-im-internet.de/hundverbreinfg/__2.html" target="_blank" rel="noopener noreferrer external">HundVerbrEinfG: § 2 ↗</a> · <a href="https://www.gesetze-im-internet.de/hundverbreinfvo/__2.html" target="_blank" rel="noopener noreferrer external">HundVerbrEinfVO: § 2 Abs. 2 und 3 ↗</a> · <a href="https://www.gesetze-im-internet.de/hundverbreinfvo/__3.html" target="_blank" rel="noopener noreferrer external">Mitführpflichten: § 3 ↗</a></p>
  <div class="travel-note">
    <strong>Vor Abfahrt griffbereit</strong>
    <ul class="travel-checklist">
      <li>Heimtierausweis, Chipnummer und gültige Tollwutimpfung für Auslandsreisen.</li>
      <li>Amtliche Haltungserlaubnis, vorhandene Befreiungen und Prüfungsnachweise.</li>
      <li>Versicherungsnachweis mit passender Auslandsdeckung.</li>
      <li>Bestätigung nötiger Besuchsgenehmigungen; kurze Leine und passender Maulkorb.</li>
    </ul>
  </div>
  <p class="microcopy">Quellenprüfung: <time datetime="2026-11-09">9. November 2026</time>. Bewusst gekürzte Orientierung, keine individuelle Rechtsberatung. Die verlinkten Vorschriften, örtliche Anordnungen und die Auskunft der zuständigen Behörde sind maßgeblich. Vor jeder Reise den aktuellen Stand prüfen.</p>
</section>
`;

/** Erzeugt Hilfe, Hundewissen und Datenschutz aus den gepflegten Inhaltsquellen. */
export function createContentPages(page, {
  root,
  config,
  escape,
  address,
  email
}) {
  const fixture = JSON.parse(readFileSync(fileURLToPath(new URL('./dcr-privacy-source.json', import
    .meta.url)), 'utf8'));
  const reusable = ['Grundsatz und Rechtsgrundlagen', 'Direkte Kontaktaufnahme per E-Mail',
    'Server-Logs', 'Speicherdauer', 'Deine Rechte'
  ];
  const sections = fixture.sections.filter(s => reusable.includes(s.title));

  /** Erzeugt einen wiederverwendeten Datenschutzabschnitt mit projektspezifischer Formulierung. */
  const renderSection = s =>
    `<h2>${escape(s.title)}</h2>${s.paragraphs.map(p => `<p>${escape(p.replace('Formularinhalte und E-Mail-Adressen werden nicht in den technischen API-Logs protokolliert.','').replace('Kontaktanfragen zu möglichen oder bestehenden Leistungen werden gemäß Art. 6 Abs. 1 lit. b DSGVO zur Durchführung vorvertraglicher Maßnahmen beziehungsweise zur Vertragskommunikation verarbeitet.','Kontaktanfragen zur Lernhilfe werden zur Bearbeitung und Beantwortung auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO verarbeitet. Unser berechtigtes Interesse ist es, Anfragen zu beantworten und Übertragungsfehler zu beheben.'))}</p>`).join('')}`;
  page('datenschutz.html', 'Datenschutz',
    'Datenschutzhinweise der kostenlosen NRW-Lernhilfe: Hosting, lokale Lernstände, E-Mail-Kontakt und PayPal.',
    `
<h2>Verantwortlicher</h2><p>${escape(config.operator.name)}<br>${address}<br>E-Mail: ${email}<br>Telefon: ${escape(config.operator.phone)}</p>
${renderSection(sections.find(s => s.title==='Grundsatz und Rechtsgrundlagen'))}
<h2>Hosting und Serverbetrieb</h2><p>Die Website wird auf angemieteter Serverinfrastruktur der ${escape(config.hosting.provider)}, ${escape(config.hosting.address)}, betrieben. Dabei können technisch erforderliche Verbindungsdaten verarbeitet werden. Der Server und die Maildienste werden innerhalb dieser Infrastruktur eigenständig administriert. Der Hostinganbieter ist technischer Empfänger; soweit erforderlich besteht eine Vereinbarung zur Auftragsverarbeitung nach Art. 28 DSGVO.</p>
${renderSection(sections.find(s => s.title==='Server-Logs'))}
<h2 id="browserspeicher">Lokaler Lernfortschritt und Darstellung</h2><p>Antworten, gemerkte Fragen, geprüfte Bewertungen, Lernposition, Ansicht, Sofort-Feedback und das gewählte Hell-/Dunkel-Schema werden ausschließlich im Browser gespeichert (localStorage). Die Lernhilfe übermittelt diese Angaben nicht an den Betreiber. Sie bleiben bis zum Zurücksetzen eines Lernbereichs beziehungsweise Löschen der Websitedaten gespeichert. Ein Export erzeugt eine Datei auf deinem Gerät; ein Import verarbeitet die von dir gewählte Datei lokal und führt die Lernstände nach deiner Bestätigung zusammen.</p><p>Testantworten und Prüfungszustand liegen getrennt im Sitzungsspeicher (sessionStorage) und werden nach Ende der Browsersitzung entfernt. In Test-URLs stehen nur Fragenummern, keine Antworten. Ein Hinweis auf freiwillige Unterstützung wird nach der ersten vollständigen Auswertung einer Browsersitzung angezeigt. Eine lokale Sitzungsmarkierung verhindert weitere automatische Hinweise in derselben Sitzung. Sie wird nicht an den Server übermittelt und dient nicht der Wiedererkennung über mehrere Sitzungen oder dem Tracking.</p><p>Die Anwendung setzt keine HTTP-Cookies und enthält keine Analyse-, Werbe- oder Trackingdienste. Die genannten Speicherzugriffe dienen den benutzten Lern- und Darstellungsfunktionen sowie der Vermeidung wiederholter Hinweise. Soweit sie für den ausdrücklich gewünschten Dienst unbedingt erforderlich sind, gilt § 25 Abs. 2 Nr. 2 TDDDG. Soweit personenbezogene Daten betroffen sind, erfolgt die Verarbeitung für den sicheren und nutzerfreundlichen Betrieb nach Art. 6 Abs. 1 lit. f DSGVO. Du kannst die lokalen Daten über deine Browserfunktionen löschen. Bei blockiertem oder vollem Speicher ist Lernen ohne dauerhafte Sicherung möglich.</p>
${renderSection(sections.find(s => s.title==='Direkte Kontaktaufnahme per E-Mail'))}
<h2>Externe Links und freiwillige Unterstützung</h2><p>Behörden, Tierärztekammern und PayPal werden ausschließlich verlinkt. Es werden keine Inhalte, Schriftarten, Zahlungs-SDKs oder Tracking-Pixel dieser Anbieter automatisch geladen. Erst das Öffnen eines externen Links verbindet deinen Browser mit dem jeweiligen Anbieter.</p><p>Für die freiwillige Unterstützung führt ein Link zu PayPal (Europe) S.à r.l. et Cie, S.C.A., 22–24 Boulevard Royal, L-2449 Luxemburg. Es gilt die <a href="https://www.paypal.com/de/legalhub/paypal/privacy-full" target="_blank" rel="noopener noreferrer external">Datenschutzerklärung von PayPal ↗</a>, auch hinsichtlich weiterer Empfänger und möglicher Übermittlungen in Drittländer. Als Empfänger einer Zahlung können wir die zur Abwicklung erforderlichen Transaktionsinformationen erhalten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, für gesetzliche Aufbewahrungspflichten Art. 6 Abs. 1 lit. c DSGVO. Diese Angaben werden nur für Abwicklung, erforderliche Nachweise und gesetzliche Aufbewahrung verarbeitet. Eine Zahlung ist freiwillig und schaltet keine zusätzlichen Lernfunktionen frei.</p>
${renderSection(sections.find(s => s.title==='Speicherdauer'))}
${renderSection(sections.find(s => s.title==='Deine Rechte'))}<p>Eine Beschwerde ist insbesondere bei der <a href="https://www.ldi.nrw.de/" target="_blank" rel="noopener noreferrer external">Landesbeauftragten für Datenschutz und Informationsfreiheit NRW ↗</a> möglich. Die Lernhilfe trifft keine automatisierten Entscheidungen mit rechtlicher oder ähnlich erheblicher Wirkung.</p><p>Stand: 6. November 2026. Grundlage sind die allgemeinen Datenschutzhinweise von <a href="https://design-code-repeat.de/datenschutz" target="_blank" rel="noopener noreferrer external">Design. Code. Repeat. ↗</a>, ergänzt um die Funktionen dieser Lernhilfe. Abschnitte zu dortigen Kontaktformularen, Infrastructure API und CSRF-Cookies treffen auf diese Anwendung nicht zu.</p>`
    );
  page('gut-zu-wissen.html', 'Gut zu wissen',
    'Sachkunde lernen und mit Hund reisen: Kurzinfos zu Bundesländern, Niederlanden, Österreich, Belgien und Italien mit amtlichen Quellen.', `

<nav class="knowledge-nav" aria-label="Auf dieser Seite">
  <a href="#lerntrainer">Lernen &amp; Testreihen</a>
  <a href="#bundeslaender">Andere Bundesländer</a>
  <a href="#ausland">Vier Reiseziele in Europa</a>
  <a href="#rueckreise">Rückreise &amp; Unterlagen</a>
</nav>
<p>Lerne zuerst in Ruhe und prüfe danach dein Wissen. Die Lernkataloge und Testreihen haben getrennte Lernstände. Welche Bescheinigung du brauchst, klärst du mit der zuständigen Behörde. Die <a href="hundewissen.html">Informationsseite zu Hundehaltung, Sachkunde und Verhaltensprüfung</a> hilft bei der ersten Einordnung.</p>
<p>Kein passender Test dabei? Schicke mir gern deine Informationen mit <strong>Stadt und Bundesland</strong> sowie möglichst einer amtlichen Quelle. Dann kann ich prüfen, ob ich eine passende Testreihe ergänzen kann. <a href="mailto:kontakt@design-code-repeat.de?subject=Sachkundenachweis%20f%C3%BCr%20Hunde%20%28Bundesland%29">Testreihe per E-Mail vorschlagen</a>.</p>
<h2 id="lerntrainer">Direktes Feedback zu jeder Frage</h2><p><strong>„Sofort-Feedback: An“</strong> zeigt im Lernmodus bei jeder Frage einen eigenen Button „Antwort prüfen“. Wähle zunächst alle passenden Antworten aus und drücke dann auf den Button. Erst jetzt erscheinen die Wertung und die richtige Lösung der Quelle. Eine geänderte Antwort setzt die Bewertung zurück; du kannst erneut prüfen. Bei Zuordnungen müssen zunächst alle Positionen ausgefüllt sein.</p><p>Der Schalter lässt sich jederzeit ausschalten. In Testreihen bleibt Einzelfeedback bis zur Abschlussauswertung gesperrt, damit die Lösungen den Test nicht vorwegnehmen.</p>
<h2 id="testreihen">Welche Testreihe passt zu mir?</h2><div class="table-scroll"><table><thead><tr><th>Testreihe</th><th>Fragenbasis</th><th>Wertung in dieser Lernhilfe</th></tr></thead><tbody><tr><td>§ 3 / § 10 · Rhein-Erft</td><td>34 zufällige Fragen aus dem 203er-Katalog</td><td>Mindestens 24 vollständig richtig; Eckdaten aus dem veröffentlichten Rhein-Erft-PDF. Keine identische amtliche Auswahl.</td></tr><tr><td>§ 3 · MG-Simulation</td><td>119 Fragen aus dem bisherigen 398er-Basispool</td><td>Mindestens 90 richtig, kein Zeitlimit; privat mitgeteilte Eckdaten, keine veröffentlichte Originalprüfung.</td></tr><tr><td>§ 11 · Kammer-Übung</td><td>30 zufällige Fragen aus dem 197er-Kammerkatalog</td><td>Lernquote ohne verbindliches Bestanden/Nicht-bestanden. Zufällige Übung, keine Nachbildung der amtlichen Themenauswahl oder des Gesprächs.</td></tr></tbody></table></div><p>Für die tierärztliche Sachkunde nach § 11 nennt die Tierärztekammer Nordrhein 30 Fragen und ein anschließendes Informationsgespräch; eine festgesetzte Fehlerquote gibt sie nicht an. Die Unterschiede betreffen insbesondere den zulässigen Nachweisweg, die lokale Prüfung und zusätzliche Rechtsfragen – nicht ein völlig anderes Grundwissen über Hunde.</p><p class="source-links">${ref('kammer','Tierärztekammer Nordrhein: Ablauf und Bewertung')} · ${ref('koeln','Stadt Köln: Sachkundenachweis')} · <a href="quellen.html#rhein203">Rhein-Erft: Originalquelle und Herkunft</a></p>
<h2>Wann zählt eine Frage als richtig?</h2><p>Alle laut zugehörigem Lösungsschlüssel richtigen Antworten müssen gewählt sein, zusätzliche falsche Antworten dürfen nicht gewählt sein. Jede Zuordnung muss stimmen. Die Zwischenwertung bezieht sich nur auf vollständig beantwortete Fragen. Die Gesamtauswertung zählt offene und unvollständige Antworten als falsch. Der Status „Beantwortet“ ist noch keine richtige Lösung.</p>
<h2>Lernstand mitnehmen oder zurücksetzen</h2><p>Oben in der Navigation findest du „Lernstand sichern“, „Lernstand laden“ und „Lernbereich zurücksetzen“. Eine Sicherung ist eine lokale JSON-Datei ohne Konto oder Cloud-Synchronisation. Beim Import werden die Lernstände nach Bestätigung zusammengeführt; importierte Antworten ersetzen vorhandene Antworten derselben Frage, Bewertungen werden zurückgesetzt. Zurücksetzen löscht nur den aktuell gewählten Lernbereich.</p>
<h2 id="tastatur">Ansichten und Tastatur</h2>
<p><strong>Fokus:</strong> eine Frage auf einmal. <strong>Liste:</strong> acht Fragen pro Seite. Die Stern-Schaltfläche merkt eine Frage; Suche, Themenfilter und „Fehler wiederholen“ helfen beim gezielten Lernen.</p>
<p>Im <strong>TV-Modus</strong> kannst du den Trainer mit der Tastatur bedienen:</p>
<dl class="keyboard-guide">
  <div><dt><kbd aria-label="Pfeil links">←</kbd> <kbd aria-label="Pfeil rechts">→</kbd></dt><dd>Zur vorherigen oder nächsten Frage wechseln.</dd></div>
  <div><dt><kbd aria-label="Pfeil hoch">↑</kbd> <kbd aria-label="Pfeil runter">↓</kbd></dt><dd>Den Fokus zwischen den Antworten bewegen.</dd></div>
  <div><dt><kbd>Enter</kbd></dt><dd>Die fokussierte Antwort auswählen.</dd></div>
  <div><dt><kbd>Home</kbd> <kbd>End</kbd></dt><dd>Zur ersten oder letzten Frage springen (Pos1/Ende).</dd></div>
</dl>
<p>In Such- und Auswahlfeldern gelten weiterhin deren übliche Tasten. Modale lassen sich mit <kbd>Esc</kbd> abbrechen.</p>
<h2>Quellen statt Prüfungsgarantie</h2><p>Viele der verwendeten Fragenkataloge wurden mir von den zuständigen Ämtern persönlich zugesandt oder sind öffentlich abrufbar. Persönlich zugesandte Unterlagen haben nicht immer eine öffentliche Originaladresse; das wird bei den Quellen kenntlich gemacht.</p><p>Jede Frage nennt ihre Herkunft und Originalnummer. Nicht öffentlich belegte PDF-Adressen und abweichende Fassungen sind gekennzeichnet. Ältere Aussagen in Originalfragen können vom aktuellen Recht oder heutigen fachlichen Empfehlungen abweichen. Die Wertung folgt dem bezeichneten Lösungsschlüssel; aktuelle rechtliche Orientierung findest du auf <a href="hundewissen.html">Hundewissen</a>.</p>
${travelContent}
<p><a class="primary button" href="./#trainer">Zum Lerntrainer →</a></p>`);
  page('hundewissen.html', 'Hundehaltung & Sachkunde in NRW',
    'Amtlich belegte Orientierung zu Listenhunden, § 3, § 10, § 11, Sachkundenachweis und Verhaltensprüfung in NRW.',
    `
<p>„Listenhund“, Sachkunde und Wesenstest werden oft in einem Atemzug genannt. Sie beschreiben aber unterschiedliche Dinge: die rechtliche Einordnung des Hundes, Kenntnisse des Menschen und die Beurteilung des Hund-Halter-Gespanns. Diese Übersicht ist allgemeine Orientierung für Nordrhein-Westfalen, Stand 6. November 2026.</p>
<h2 id="einstufung">Was bedeutet „Listenhund“?</h2><p>„Listenhund“ ist eine gebräuchliche Sammelbezeichnung. Das NRW-Gesetz unterscheidet gefährliche Hunde (§ 3), Hunde bestimmter Rassen (§ 10) und große Hunde (§ 11). Eine gesetzliche Rassezuordnung ist keine individuelle Verhaltensdiagnose. Auch die Einordnung von Kreuzungen und eine etwaige Gefährlichkeitsfeststellung gehören in die Hände der zuständigen Behörde.</p>
<div class="table-scroll"><table><thead><tr><th>Gruppe</th><th>Einordnung</th><th>Wichtige Unterscheidung</th></tr></thead><tbody><tr><td>§ 3</td><td>Pitbull Terrier, American Staffordshire Terrier, Staffordshire Bullterrier und Bullterrier sowie gesetzlich erfasste Kreuzungen. Zusätzlich im Einzelfall festgestellte gefährliche Hunde unabhängig von der Rasse.</td><td>Für die Haltung ist grundsätzlich eine Erlaubnis erforderlich; Sachkunde über die amtliche Tierärztin oder den amtlichen Tierarzt.</td></tr><tr><td>§ 10</td><td>Alano, American Bulldog, Bullmastiff, Mastiff, Mastín Español, Mastino Napoletano, Fila Brasileiro, Dogo Argentino, Rottweiler und Tosa Inu sowie gesetzlich erfasste Kreuzungen.</td><td>Besondere Erlaubnis- und Haltungsvoraussetzungen; anerkannte Sachverständige bzw. Stellen können ebenfalls zuständig sein.</td></tr><tr><td>§ 11</td><td>Ausgewachsen mindestens 40 cm Widerristhöhe <strong>oder</strong> mindestens 20 kg; soweit keine strengere Einordnung greift.</td><td>Anzeige und Nachweise gegenüber der Behörde; Sachkunde auch durch von der Tierärztekammer benannte Tierärzte möglich.</td></tr></tbody></table></div><p class="source-links">${ref('law','LHundG NRW: §§ 3, 4, 6, 10 und 11')} · ${ref('ministry','Landwirtschaftsministerium NRW: Hunde')}</p>
<h2 id="sachkunde">Sachkundenachweis: Wissen des Menschen</h2><p>Die Themen überschneiden sich stark: Hundeverhalten, Haltung und Pflege, Gefahrensituationen, Lernen und Ausbildung sowie rechtliche Regeln. Bei § 3 ist der Nachweisweg strenger als bei großen Hunden nach § 11. Eine Bescheinigung für große Hunde ist deshalb nicht automatisch ein passender Nachweis für einen gefährlichen Hund. Eine vorhandene Bescheinigung solltest du der zuständigen Stelle zur Prüfung vorlegen.</p><p>Für § 3 kann die Kenntnisprüfung nach der Landesverordnung als Fachgespräch oder vergleichbares schriftliches Verfahren stattfinden. Es gibt keine einzige NRW-weit identische Online-Prüfung. Beispiel Köln: Die Stadt nennt 34 Fragen und mindestens 24 vollständig richtige Antworten. Für § 11 beschreibt die Tierärztekammer Nordrhein 30 Fragen mit Informationsgespräch, ohne feste veröffentlichte Fehlerquote. In dieser Lernhilfe sind die <a href="gut-zu-wissen.html#testreihen">Testreihen entsprechend getrennt</a>.</p><p class="source-links">${ref('dvo','DVO LHundG NRW: § 1')} · ${ref('vv','Verwaltungsvorschriften: Nr. 6.2')} · ${ref('koeln','Stadt Köln: Prüfungsablauf')} · ${ref('kammer','Tierärztekammer: § 11')}</p>
<h2 id="verhalten">Wesenstest / Verhaltensprüfung: Hund und führende Person</h2><p>Die Verhaltensprüfung beurteilt unter anderem Gehorsam und Reaktionen in Alltagssituationen – etwa gegenüber Menschen, anderen Hunden, Bewegung oder ungewohnten Reizen. Sie ersetzt nicht den Sachkundenachweis des Menschen. Ein bestandenes Ergebnis kann bei Hunden nach § 3 Abs. 2 oder § 10 Grundlage eines Antrags auf Befreiung von bestimmten Leinen- und/oder Maulkorbpflichten sein. Für im Einzelfall gefährliche Hunde nach § 3 Abs. 3 ist diese reguläre Befreiungsmöglichkeit nach § 5 Abs. 3 nicht vorgesehen.</p><p><strong>Bestanden heißt nicht automatisch befreit.</strong> Erst die zuständige Behörde entscheidet über den Antrag und dessen Umfang. Andere gesetzliche oder örtliche Leinenpflichten können trotzdem weiter gelten. Weitere Aufsichtspersonen müssen gegebenenfalls mit dem Hund in die Prüfung einbezogen werden.</p><p>Für Mindestalter, Zulassung, Termine und benötigte Unterlagen ist die aktuelle Auskunft der zuständigen Stelle entscheidend. Die geltende Landesverordnung nennt für die Verhaltensprüfung ein Mindestalter von 24 Monaten. Einzelne kommunale Internetseiten enthalten noch andere Altersangaben; bei solchen Abweichungen sind die aktuelle Rechtslage und die Behörde maßgeblich.</p><p class="source-links">${ref('dvo','Aktuelle DVO: § 3 Verhaltensprüfung')} · ${ref('vv','Verwaltungsvorschriften: Nr. 5.3')} · ${ref('verhalten','Stadt Köln: Verhaltensprüfung/Wesenstest')}</p>
<h2 id="vorbereitung">Vor Anschaffung oder Prüfung klären</h2><ol><li><strong>Ordnungsamt:</strong> Einstufung, Erlaubnis bzw. Anzeige und notwendige Unterlagen erfragen – bei erlaubnispflichtiger Haltung möglichst vor der Anschaffung.</li><li><strong>Veterinäramt oder zuständige Prüfstelle:</strong> passenden Sachkundenachweis, tatsächlichen Prüfungsumfang und aktuelle Vorbereitungsmaterialien bestätigen lassen.</li><li><strong>Unterlagen:</strong> je nach Fall etwa Identitäts-, Zuverlässigkeits-, Versicherungs-, Kennzeichnungs- und Unterbringungsnachweise. Der Sachkundenachweis allein ist noch keine Haltungserlaubnis.</li><li><strong>Alltag:</strong> Bei Bedarf mit einer qualifizierten Hundeschule auf sichere Führung und Alltagssituationen vorbereiten. Dieser Online-Trainer ist kein praktisches Training.</li></ol><p class="source-links">${ref('law','Gesetzliche Voraussetzungen')} · ${ref('ministry','Land NRW: Haltung und Pflichten')}</p><h2>Quellenstand und Grenzen</h2><p>Quellen wurden am 6. November 2026 geprüft. Die verlinkte DVO gilt in der Fassung vom 9. Dezember 2025, die Verwaltungsvorschriften in der Fassung vom 7. Oktober 2026. Prüfungsfragen können ältere Quellenstände abbilden; ihre Lösung ist nicht automatisch eine aktuelle Rechtsauskunft. Für individuelle Entscheidungen wende dich an deine zuständige Behörde oder eine qualifizierte Rechtsberatung.</p>`
    );
}
