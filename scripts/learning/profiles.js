/* scripts/learning/profiles.js */

/**
 * @file Verfügbare Lern- und Prüfungsprofile.
 * @description Quellkataloge und Prüfungsprofile des Trainers.
 * @author Benjamin Bennewitz [B²]
 */
// Zentrale Profildefinitionen: mehrere Ortsprofile dürfen denselben Quellpool verwenden.
// pool verweist auf Fragen; key trennt Kataloglernstände und bleibt für Prüfungssitzungen null.
// examCount bestimmt den Testumfang, passCount die eigene Übungsgrenze; null bedeutet keine Bestehenszusage.
// sections aktiviert die getrennten Teilwertungen und die ausdrückliche Kennzeichnung des Essen-Beispiels.
window.LHUNDG_TRAINER = {
  profiles: {
    // Gesamtpool mit Quellenvarianten und eigenem dauerhaftem Lernstand.
    all: {
      pool: 'allPool',
      title: 'Alle Quellen',
      key: 'lhundg-answers-all-v1',
      description: '400 Fragen und Quellenvarianten. Kammerfragen nach § 11 ergänzen den bisherigen §-3-Basispool.'
    },
    // Bisheriger §-3-Basispool, ohne Behauptung eines unveröffentlichten MG-Originalkatalogs.
    mg: {
      pool: 'mgPool',
      title: '§-3-Basispool',
      key: 'lhundg-answers-mg-v1',
      description: '398 Fragen aus den bereitgestellten Rhein-Erft- und Köln-Katalogen. Keine unveröffentlichten MG-Originalfragen.'
    },
    // Rhein-Erft-203-Fassung mit dem ältesten weiter gültigen Antwortschlüssel.
    legacy203: {
      pool: 'legacy203',
      title: 'Rhein-Erft · 203 Fragen',
      key: 'lhundg-answers-v1',
      description: 'Bisheriger §-3-/§-10-Katalog mit seinem eigenen Lösungsschlüssel. Dein alter Lernstand bleibt erhalten.'
    },
    // Zugesandte 97er-Fassung mit eigener Herkunft und eigenem Lernstand.
    rhein97: {
      pool: 'rhein97',
      title: 'Rhein-Erft · 97 Fragen',
      key: 'lhundg-answers-rhein97-v1',
      description: 'Zugesandter Übungsbogen mit Multiple Choice und Zuordnungen. Öffentliche Originaladresse bisher nicht belegt.'
    },
    // Bereitgestellte Kölner Fassung mit eigenen Originalnummern A/B/C.
    koeln: {
      pool: 'koeln',
      title: 'Köln · A / B / C',
      key: 'lhundg-answers-koeln-v1',
      description: '115 aktive Fragen aus dem bereitgestellten Übungsbogen. A11 entfällt im Original.'
    },
    // Kammerfassung ab 2025 als eigener §-11-Lernkatalog.
    kammer197: {
      pool: 'kammer197',
      title: 'Tierärztekammern · 197 Fragen',
      key: 'lhundg-answers-kammer197-v1',
      description: 'Gemeinsamer Katalog ab 2025 für § 11. Ergänzendes Wissen für § 3; kein amtlicher §-3-Prüfungsbogen.'
    },
    // 34 zufällige Rhein-Erft-Fragen; Übungsgrenze 24 vollständig richtige Antworten.
    exam34: {
      pool: 'legacy203',
      title: 'Rhein-Erft-Test · 34 Fragen',
      key: null,
      examCount: 34,
      passCount: 24,
      description: '34 zufällige Fragen aus dem Rhein-Erft-203-Katalog. Übung nach dessen veröffentlichten Eckdaten: mindestens 24 richtig, kein Originalprüfungsbogen.'
    },
    // 30 Kammerfragen als Lernquote ohne verbindliche Bestehensgrenze.
    exam11: {
      pool: 'kammer197',
      title: '§-11-Übungsrunde · 30 Fragen',
      key: null,
      examCount: 30,
      passCount: null,
      description: '30 zufällige Kammerfragen für große Hunde. Lernquote ohne verbindliche Bestehensgrenze; das erforderliche Gespräch und die Entscheidung der prüfenden Stelle werden nicht simuliert.'
    },
    // Eigenes 50er-Beispiel mit gesonderten Teilgrenzen; keine Essener Originalprüfung.
    essenexam: {
      pool: 'essenExamples',
      title: 'Essen · geschätztes Beispiel',
      key: null,
      examCount: 50,
      passCount: 38,
      sections: window.LHUNDG_ESSEN_SECTIONS,
      description: 'Unverbindliches, geschätztes Beispiel: 50 Fragen ohne Zeitlimit. Eigene Aufteilung 17 / 17 / 16; 34 vorhandene Katalogfragen und 16 eigene Rechtsfragen. Übungswertung: 1 Punkt nur bei vollständig richtiger Auswahl, keine Teilpunkte. Mindestens 75 % insgesamt UND je Teil; keine Essener Originalprüfung.'
    },
    // 119er-Simulation nach privater Behördenauskunft; kein öffentlich belegter MG-Originalbogen.
    mgexam: {
      pool: 'mgPool',
      title: 'MG-Simulation · 119 Fragen',
      key: null,
      examCount: 119,
      passCount: 90,
      description: 'Ohne Zeitlimit. Bestanden ab 90 richtigen Antworten. Nach privat mitgeteilten Eckdaten; keine Originalprüfung.'
    }
  }
};
