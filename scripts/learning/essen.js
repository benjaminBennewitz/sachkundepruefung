/* scripts/learning/essen.js */

/**
 * @file Unverbindliche Beispielsimulation nach Essener Rahmenbedingungen.
 * @description Eigene Rechtsfragen und getrennte Auswahl vorhandener Katalogfragen. Keine Essener Originalfragen.
 * @author Benjamin Bennewitz [B²]
 */
/* global LHUNDG_DATA */
(() => {
  'use strict';

  /**
   * @typedef {SachkundeQuestion & {examSection: string, example?: boolean,
   *   legalReference?: string, sourceUrl?: string, explanation?: string}} EssenQuestion
   */

  /** @type {{id: string, label: string}[]} Die Dreiteilung ist bestätigt, die konkrete Verteilung unsere Annahme. */
  const sections = [
    { id: 'biology', label: 'Biologie und Gesundheit' },
    { id: 'behavior', label: 'Verhalten und Erziehung' },
    { id: 'law', label: 'Recht' }
  ];

  /** @type {EssenQuestion[]} Eigene, nicht amtlich bestätigte Beispiele; Rechtsabgleich vom 11.11.2026. */
  const lawQuestions = [
  {
    "id": 4001,
    "uid": "essen-example-law-01",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E01",
    "type": "multi",
    "prompt": "Welche Pflichten bestehen nach § 2 TierSchG für jemanden, der einen Hund hält oder betreut?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Den Hund bedarfsgerecht ernähren und pflegen.",
      "B": "Den Hund verhaltensgerecht unterbringen.",
      "C": "Die dafür erforderlichen Kenntnisse und Fähigkeiten besitzen.",
      "D": "Bewegung darf unabhängig von Schmerzen beliebig eingeschränkt werden."
    },
    "correct": [
      "A",
      "B",
      "C"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 2 TierSchG",
    "sourceUrl": "https://www.gesetze-im-internet.de/tierschg/__2.html",
    "explanation": "Die Pflichten betreffen Ernährung, Pflege, Unterbringung und die nötigen Kenntnisse. Bewegung darf nicht so eingeschränkt werden, dass Schmerzen oder vermeidbare Leiden oder Schäden entstehen."
  },
  {
    "id": 4002,
    "uid": "essen-example-law-02",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E02",
    "type": "multi",
    "prompt": "Eine Person möchte ihren Hund loswerden und setzt ihn deshalb aus. Welche Aussage trifft nach § 3 TierSchG zu?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Das ist erlaubt, sobald kein Kaufpreis verlangt wird.",
      "B": "Das Aussetzen oder Zurücklassen eines betreuten Tieres, um sich seiner zu entledigen, ist verboten.",
      "C": "Das ist zulässig, wenn Futter daneben steht.",
      "D": "Das ist nur bei Hunden bestimmter Rassen verboten."
    },
    "correct": [
      "B"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 3 Satz 1 Nr. 3 TierSchG",
    "sourceUrl": "https://www.gesetze-im-internet.de/tierschg/__3.html",
    "explanation": "Das Verbot betrifft ein Tier, das im Haus, Betrieb oder sonst in menschlicher Obhut gehalten wird. Es darf nicht ausgesetzt oder zurückgelassen werden, um sich seiner zu entledigen oder der Halter- oder Betreuerpflicht zu entziehen."
  },
  {
    "id": 4003,
    "uid": "essen-example-law-03",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E03",
    "type": "multi",
    "prompt": "Wie viel Umgang mit einer Betreuungsperson schreibt § 2 TierSchHuV Welpen bis zu einem Alter von 20 Wochen mindestens vor?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Zehn Minuten pro Woche.",
      "B": "Eine Stunde jeden zweiten Tag.",
      "C": "Vier Stunden pro Tag.",
      "D": "Es gibt für diese Altersgruppe keine Mindestdauer."
    },
    "correct": [
      "C"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 2 Abs. 1 TierSchHuV",
    "sourceUrl": "https://www.gesetze-im-internet.de/tierschhuv/__2.html",
    "explanation": "Für Welpen bis 20 Wochen sind mindestens vier Stunden täglicher Umgang vorgeschrieben. Das bedeutet keine vier Stunden ununterbrochenes Training. Auslauf und Sozialkontakte müssen zu Alter, Rasse und Gesundheitszustand passen."
  },
  {
    "id": 4004,
    "uid": "essen-example-law-04",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E04",
    "type": "multi",
    "prompt": "Welche Aussagen über Erziehungsmittel treffen nach § 2 Abs. 5 TierSchHuV zu?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Stachelhalsbänder sind beim Training verboten.",
      "B": "Andere für den Hund schmerzhafte Mittel sind bei Ausbildung und Erziehung ebenfalls verboten.",
      "C": "Ein kurzer Einsatz schmerzhafter Mittel ist grundsätzlich erlaubt.",
      "D": "Das Verbot gilt nur für gewerbliches Training."
    },
    "correct": [
      "A",
      "B"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 2 Abs. 5 TierSchHuV",
    "sourceUrl": "https://www.gesetze-im-internet.de/tierschhuv/__2.html",
    "explanation": "Das Verbot umfasst Ausbildung, Erziehung und Training von Hunden. Es ist nicht auf gewerbliche Angebote beschränkt."
  },
  {
    "id": 4005,
    "uid": "essen-example-law-05",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E05",
    "type": "multi",
    "prompt": "Ein einzelner Hund ist 60 cm hoch am Widerrist. Welche uneingeschränkt benutzbare Mindestbodenfläche nennt § 6 Abs. 2 Satz 1 TierSchHuV für seinen Zwinger? Sonderausnahmen sind hier nicht gegeben.",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "4 m².",
      "B": "6 m².",
      "C": "10 m².",
      "D": "8 m²."
    },
    "correct": [
      "D"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 6 Abs. 2 TierSchHuV",
    "sourceUrl": "https://www.gesetze-im-internet.de/tierschhuv/__6.html",
    "explanation": "Bei mehr als 50 bis einschließlich 65 cm Widerristhöhe sind im Regelfall mindestens 8 m² nötig. Seitenlängen und weitere Anforderungen gelten zusätzlich. Die Vorschrift enthält auch eine Ausnahme für Hunde, die regelmäßig überwiegend außerhalb des Zwingers sind."
  },
  {
    "id": 4006,
    "uid": "essen-example-law-06",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E06",
    "type": "multi",
    "prompt": "Welche Pflichten nennt § 8 TierSchHuV ausdrücklich?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Wasser im gewöhnlichen Aufenthaltsbereich jederzeit ausreichend und in geeigneter Qualität bereitstellen.",
      "B": "Die Unterbringung mindestens zweimal täglich überprüfen und Mängel unverzüglich beheben.",
      "C": "Kot täglich entfernen.",
      "D": "Wasser nur nach dem Spaziergang anbieten."
    },
    "correct": [
      "A",
      "B",
      "C"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 8 Abs. 1 und 2 TierSchHuV",
    "sourceUrl": "https://www.gesetze-im-internet.de/tierschhuv/__8.html",
    "explanation": "Ständiger Zugang zu ausreichendem Wasser, mindestens zwei tägliche Kontrollen der Unterbringung und tägliche Kotentfernung sind unterschiedliche Pflichten. Dazu kommen unter anderem Fütterung, Pflege und Schutz vor Überhitzung."
  },
  {
    "id": 4007,
    "uid": "essen-example-law-07",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E07",
    "type": "multi",
    "prompt": "Welche Aussage zur Anbindehaltung trifft nach § 7 TierSchHuV zu?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Jede dauerhafte Anbindehaltung ist erlaubt, wenn die Leine drei Meter lang ist.",
      "B": "Hunde dürfen grundsätzlich nicht angebunden gehalten werden; eine eng begrenzte Ausnahme besteht bei begleiteten Tätigkeiten, für die sie ausgebildet wurden oder werden.",
      "C": "Ein schweres Kettenhalsband ersetzt die gesetzlichen Anforderungen.",
      "D": "Die Vorschrift gilt nur für Welpen."
    },
    "correct": [
      "B"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 7 TierSchHuV",
    "sourceUrl": "https://www.gesetze-im-internet.de/tierschhuv/__7.html",
    "explanation": "Die Ausnahme verlangt die Begleitung einer Betreuungsperson während der Ausbildungstätigkeit oder der erlernten Tätigkeit. Zusätzlich gelten unter anderem mindestens drei Meter Anbindung, Schutz gegen Aufdrehen und nicht verletzende, nicht zuziehende Ausrüstung. Eine lange Leine allein erlaubt keine dauerhafte Anbindehaltung."
  },
  {
    "id": 4008,
    "uid": "essen-example-law-08",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E08",
    "type": "multi",
    "prompt": "Wann fällt ein ausgewachsener Hund nach der Größendefinition unter § 11 Abs. 1 LHundG NRW?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Erst wenn er gleichzeitig mindestens 40 cm Widerristhöhe und mindestens 20 kg erreicht.",
      "B": "Nur wenn er schwerer als 20 kg und höher als 40 cm ist.",
      "C": "Ab mindestens 40 cm Widerristhöhe oder mindestens 20 kg Gewicht.",
      "D": "Nur nach einer Verhaltensprüfung."
    },
    "correct": [
      "C"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 11 Abs. 1 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Die Grenzen sind einschließlich gemeint und durch „oder“ verknüpft. Für gefährliche Hunde und Hunde bestimmter Rassen gelten zusätzlich die jeweiligen besonderen Vorschriften."
  },
  {
    "id": 4009,
    "uid": "essen-example-law-09",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E09",
    "type": "multi",
    "prompt": "Kann auch ein Hund außerhalb der in § 3 Abs. 2 LHundG NRW genannten Rassen im Einzelfall als gefährlich festgestellt werden?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Ja, bei Vorliegen der gesetzlichen Voraussetzungen nach behördlicher Feststellung und amtstierärztlicher Begutachtung.",
      "B": "Nein, ausschließlich die Rasse entscheidet.",
      "C": "Ja, bereits jede private Vermutung ersetzt die behördliche Feststellung.",
      "D": "Nein, ein Sachkundenachweis schließt eine solche Feststellung dauerhaft aus."
    },
    "correct": [
      "A"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 3 Abs. 1 und 3 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Neben der rassebezogenen Vermutung gibt es die gesetzlich beschriebenen Einzelfälle. Die zuständige Behörde stellt die Gefährlichkeit nach Begutachtung durch den amtlichen Tierarzt fest."
  },
  {
    "id": 4010,
    "uid": "essen-example-law-10",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E10",
    "type": "multi",
    "prompt": "Welche Aussagen zur Haltungserlaubnis für einen gefährlichen Hund nach § 4 LHundG NRW sind richtig?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Ein bestandener Onlinetest ersetzt die Haltungserlaubnis.",
      "B": "Sachkunde allein erfüllt automatisch alle Erlaubnisvoraussetzungen.",
      "C": "Die antragstellende Person muss mindestens 18 Jahre alt sein.",
      "D": "Neben Sachkunde und Zuverlässigkeit sind unter anderem sichere Unterbringung, Versicherungsnachweis und Kennzeichnung nachzuweisen."
    },
    "correct": [
      "C",
      "D"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 4 Abs. 1 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Die Haltung ist erlaubnispflichtig. Die aufgezählten Voraussetzungen sind kumulativ; bei den in § 4 Abs. 2 genannten Hunden ist außerdem ein besonderes privates oder öffentliches Interesse erforderlich."
  },
  {
    "id": 4011,
    "uid": "essen-example-law-11",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E11",
    "type": "multi",
    "prompt": "Ein Hund nach § 3 Abs. 2 LHundG NRW hat eine Verhaltensprüfung bestanden. Was folgt daraus für Leine und Maulkorb?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Alle Pflichten entfallen automatisch überall.",
      "B": "Eine Befreiung setzt einen Antrag und eine behördliche Entscheidung voraus.",
      "C": "Für die in § 2 Abs. 2 und § 11 Abs. 6 genannten Bereiche ist keine Befreiung von der Anleinpflicht nach § 5 Abs. 3 möglich.",
      "D": "Der bestandene Test ersetzt die Haltungserlaubnis."
    },
    "correct": [
      "B",
      "C"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 5 Abs. 3 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Eine bestandene Verhaltensprüfung allein ist keine Befreiung. Die Behörde entscheidet auf Antrag; bestimmte gesetzliche Anleinpflichten bleiben von einer solchen Befreiung ausgenommen."
  },
  {
    "id": 4012,
    "uid": "essen-example-law-12",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E12",
    "type": "multi",
    "prompt": "Eine Person muss ihre Sachkunde für einen gefährlichen Hund durch eine Prüfung nachweisen und fällt unter keine gesetzliche Anerkennung als sachkundig. Welchen Nachweis nennt § 6 Abs. 2 LHundG NRW?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Die Sachkundebescheinigung des amtlichen Tierarztes.",
      "B": "Eine beliebige Teilnahmebescheinigung einer Hundeschule.",
      "C": "Das Ergebnis dieses kostenlosen Trainers.",
      "D": "Eine reine Hundesteuerquittung."
    },
    "correct": [
      "A"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 6 Abs. 2 und 3 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Für diesen Fall nennt § 6 Abs. 2 die amtstierärztliche Bescheinigung. Absatz 3 regelt Personen, die bereits als sachkundig gelten. Für § 10 und § 11 bestehen andere zusätzliche Nachweiswege."
  },
  {
    "id": 4013,
    "uid": "essen-example-law-13",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E13",
    "type": "multi",
    "prompt": "Eine Halterin zieht mit ihrem gefährlichen Hund an einen anderen Haltungsort um. Was verlangt § 8 LHundG NRW?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Nur die Post muss informiert werden.",
      "B": "Mitteilungspflichten entstehen nur bei einem Wechsel des Bundeslandes.",
      "C": "Eine bestehende Erlaubnis beseitigt jede Anzeigepflicht.",
      "D": "Der Wechsel ist der bisher zuständigen und auch der für den neuen Haltungsort zuständigen Behörde anzuzeigen."
    },
    "correct": [
      "D"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 8 Abs. 1 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Der Wechsel des Haltungsortes ist anzeigepflichtig. Daneben nennt § 8 weitere Ereignisse, etwa Abhandenkommen und Tod des Hundes. Das ist von der Hundesteueranmeldung zu unterscheiden."
  },
  {
    "id": 4014,
    "uid": "essen-example-law-14",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E14",
    "type": "multi",
    "prompt": "Welche Mindestversicherungssummen nennt § 5 Abs. 5 LHundG NRW für die Haftpflicht eines gefährlichen Hundes?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "50.000 Euro für Personen- und 25.000 Euro für sonstige Schäden.",
      "B": "500.000 Euro für Personenschäden und 250.000 Euro für sonstige Schäden.",
      "C": "250.000 Euro für Personenschäden und 500.000 Euro für sonstige Schäden.",
      "D": "Es gibt keine gesetzlichen Mindestversicherungssummen."
    },
    "correct": [
      "B"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 5 Abs. 5 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Die Versicherung muss abgeschlossen und aufrechterhalten werden. Die genannten Beträge sind gesetzliche Mindestversicherungssummen, keine Empfehlung zur optimalen Deckung."
  },
  {
    "id": 4015,
    "uid": "essen-example-law-15",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E15",
    "type": "multi",
    "prompt": "Welchen zusätzlichen Nachweisweg eröffnet § 10 Abs. 3 LHundG NRW für die Sachkunde bei Hunden bestimmter Rassen?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Jede Hundeschule darf ohne Anerkennung die Bescheinigung erteilen.",
      "B": "Ein Online-Ergebnis ersetzt die Sachkundebescheinigung.",
      "C": "Auch anerkannte Sachverständige oder anerkannte sachverständige Stellen können die Bescheinigung erteilen.",
      "D": "Es ist überhaupt kein Sachkundenachweis erforderlich."
    },
    "correct": [
      "C"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 10 Abs. 3 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Die gesetzliche Anerkennung ist entscheidend. Die zusätzliche Möglichkeit für § 10 ist nicht mit einer allgemeinen Prüfungsbefugnis jeder Tierarztpraxis für §-3-Hunde gleichzusetzen."
  },
  {
    "id": 4016,
    "uid": "essen-example-law-16",
    "source": "Eigene Rechts-Beispielfrage",
    "sourceKey": "essenExample",
    "sourceId": "E16",
    "type": "multi",
    "prompt": "Was muss die führende Person beim Führen eines gefährlichen Hundes außerhalb des befriedeten Besitztums nach § 4 Abs. 6 LHundG NRW mitführen?",
    "category": "Recht",
    "options": [
      "A",
      "B",
      "C",
      "D"
    ],
    "answers": {
      "A": "Nur den Kaufvertrag.",
      "B": "Nur einen Screenshot des Trainerergebnisses.",
      "C": "Ausschließlich den Impfpass; andere Unterlagen sind nie erforderlich.",
      "D": "Die Haltungserlaubnis oder eine Kopie; auf Verlangen ist sie kontrollbefugten Dienstkräften auszuhändigen."
    },
    "correct": [
      "D"
    ],
    "requiresVisual": false,
    "images": [],
    "examSection": "law",
    "example": true,
    "legalReference": "§ 4 Abs. 6 LHundG NRW",
    "sourceUrl": "https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/",
    "explanation": "Die Mitführpflicht betrifft die Erlaubnis oder ihre Kopie. Ein Lerntrainer stellt keine Haltungserlaubnis und keinen amtlichen Sachkundenachweis aus."
  }
];

  /**
   * Übernimmt ausschließlich Kopien; Originalkatalog, Herkunft und Lösungsschlüssel bleiben unverändert.
   * @param {number[]} ids Ausgewählte Originalnummern aus dem 203er-Katalog.
   * @param {string} section Schlüssel des zugehörigen Übungsteils.
   * @returns {EssenQuestion[]} Eigene Auswahl bestehender Fragen mit Abschnittszuordnung.
   */
  function selectQuestions(ids, section) {
    return ids.map(id => {
      const question = LHUNDG_DATA.legacy203.find(item => item.id === id);
      if (!question) throw new Error(`Fehlende Essen-Beispielfrage: ${id}`);
      return { ...question, examSection: section };
    });
  }

  window.LHUNDG_ESSEN_SECTIONS = sections;
  LHUNDG_DATA.essenExamples = [
    ...selectQuestions([94, 97, 105, 113, 115, 118, 124, 127, 130, 133, 137, 140, 142, 146, 152, 154, 158], 'biology'),
    ...selectQuestions([1, 3, 8, 9, 11, 13, 18, 21, 24, 25, 28, 31, 33, 51, 62, 70, 77], 'behavior'),
    ...lawQuestions
  ];
})();
