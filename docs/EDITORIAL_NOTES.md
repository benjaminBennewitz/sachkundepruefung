# Redaktion und Quellenabgleich – 17. November 2026

Die Grundlagen sind redaktionell neu formuliert. Ihre Kapitel verbinden
zusammengehörige Gedanken statt einzelner Katalogmerksätze. Es wurden keine
Originalfragen, Lösungen, eigenen Essen-Fragen oder Bewertungsregeln geändert.
Die detaillierte rechtliche Orientierung bleibt auf Haltung & Recht; diese
Überarbeitung ist keine vollständige erneute Prüfung aller dortigen Rechtsangaben.

## Fachliche Grundlagen

- [§ 2 TierSchHuV](https://www.gesetze-im-internet.de/tierschhuv/__2.html):
  bedarfsgerechter Auslauf und Betreuung; Sozialkontakte mit den vorgesehenen
  individuellen Ausnahmen. Die Neufassung leitet daraus keine pauschale Pflicht
  zu jedem Hundekontakt ab.
- [AVSAB: Position Statements](https://avsab.org/resources/position-statements/):
  aktuelle Bekräftigung belohnungsbasierter Lernmethoden und Abgrenzung aversiver
  Verfahren. Die Grundlagen beschreiben verständliche Alternativen und
  bewältigbare Lernschritte, keine individuelle Verhaltenstherapie.

## Kataloge und Simulationen

Die Daten des aktuellen Projekts zeigen große inhaltliche Überschneidungen
zwischen dem 398er-Basispool und den Kammerfragen. Daraus folgt keine amtliche
Anerkennung eines Nachweises oder Gleichheit der Katalogfassungen. „Basispool“
ist deshalb neutral benannt; die quellenbezogenen Lernbereiche bleiben getrennt.

Alle vier Testprofile sind unverbindliche, geschätzte Prüfungssimulationen.
Veröffentlichte Eckdaten und persönliche Behördenauskünfte werden weiterhin
als Herkunft benannt; die projektseitige Auswahl und Umsetzung bleiben eine
Annäherung. Nicht jede bekannte Eckzahl ist selbst geschätzt. Die einheitliche
Kennzeichnung betrifft die Simulation als Ganzes. Das Essen-Beispiel enthält
weiterhin 34 Katalogfragen und 16 ausdrücklich gekennzeichnete eigene Fragen.

## Fotobearbeitung

Beim Motiv `huendin-strand.webp` wurden die Personen im Hintergrund mit dem
integrierten Bildwerkzeug entfernt (kein API-/CLI-Aufruf). Auftrag: ausschließlich die Hintergrundpersonen durch
passenden Sand, Vegetation, Wasser oder Himmel ersetzen; Motiv, Hund, Halsband,
Licht und Bildaufbau erhalten. Das Ergebnis wurde visuell geprüft und als lokales
WebP im vorhandenen Format 1000 × 1333 übernommen. Die hochgeladenen Originale
bleiben unverändert. Die Verwendung als Website-Asset ist Bestandteil dieses Patches.

## Prüfung

99 Funktionstests, lokale Verweise, Daten und SEO geprüft. Neue Regressionen
betreffen fehlende richtige Antworten, das Unterdrücken von Lösungshinweisen
im laufenden Test, die gemeinsame Simulationseinordnung, FAQ-Gruppen,
Ortsdialoge und Reduced Motion beim Scrollen. Der vorliegende Patch hat keine
abgeschlossene visuelle Browserprüfung; Bildausschnitte, Dialoggrößen und
Umbrüche müssen vor Veröffentlichung im Zielbrowser kontrolliert werden.


## Ergänzung: Kategorien und Haltungserlaubnis – 17. November 2026

Geprüfte Grundlagen der gezielten Ergänzung:

- LHundG NRW, insbesondere §§ 4 bis 7, 10 und 11, aktuelle Fassung 27.09.2016:
  https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/
- VV LHundG NRW, aktuelle Fassung 07.10.2026, insbesondere Nr. 4, 6.2 und 7:
  https://recht.nrw.de/lrmb/verwaltungsvorschrift/07102026-verwaltungsvorschriften-zum-landeshundegesetz-vv-lhundg-nrw/
- Stadt Düsseldorf, Verfahrensbeschreibung Haltung eines gefährlichen Hundes:
  https://service.duesseldorf.de/suche/-/vr-bis-detail/dienstleistung/403/show
- Amt für Wohnen Dortmund, amtlicher Leitfaden Wohnraummietrecht, Abschnitt Tierhaltung:
  https://www.dortmund.de/dortmund/projekte/rathaus/verwaltung/amt-fuer-wohnen/downloads/mietrecht/mietrecht.pdf

Die Darstellung trennt amtliche Nachweiswege, mietrechtliche Klärung und redaktionelle
Lernempfehlungen. Ein allgemeiner Katalog wird nicht als austauschbarer amtlicher
Nachweis bezeichnet. Es gibt keine Behauptung einer festen Zahl exklusiver §-3-Fragen.
Die Zustimmung zur konkreten Hundehaltung wird nicht als überall identische
Antragsunterlage oder pauschaler mietrechtlicher Genehmigungsanspruch dargestellt.
Die Ergänzung ist keine vollständige erneute Prüfung der Reise- und Ortskapitel.


## Vollständige redaktionelle Durchsicht „Antwort verstehen“ – 19. November 2026

Prüfumfang: alle 66 Einträge in `scripts/learning/explanations.js`, einschließlich
Hinweistexten, Vorbehalten und Bildvergleichsbeschriftungen. Jeder Eintrag wurde mit
der zugehörigen Frage, allen Antwortmöglichkeiten und dem hinterlegten Lösungsschlüssel
abgeglichen. Die sieben erläuterten Hundezeichnungen wurden visuell gesichtet.
34 Einträge wurden präzisiert, 32 unverändert übernommen.

Die getrennten 16 Einordnungen eigener Essen-Beispielfragen wurden zusätzlich
mitgelesen, sind aber keine der 66 „Antwort verstehen“-Erklärungen und bleiben unverändert.
Diese Zusatzsichtung ist keine vollständige neue rechtliche Prüfung des Essen-Moduls.

### Redaktionelle Maßstäbe

- Möglichkeiten nicht in Garantien oder Ausschließlichkeiten umformulieren.
- Beispiele müssen alle genannten Voraussetzungen erhalten, besonders die tatsächliche
  Dauer. Ein Tierarztbesuch ist keine Zeitangabe. Auch wenige Minuten sind keine
  garantierte sichere Tragedauer einer Maulschlaufe.
- Fehlende Gewissheit ist kein Beweis für die Unmöglichkeit einer Antwort.
- Eine unklare Originalantwort nicht durch erfundene Absichten des Herausgebers erklären.
- Katalogschlüssel als Bewertungsvorgabe benennen, nicht als Handlungsauftrag.
- Unterschiedliche Situationen oder undefinierte Begriffe nicht ohne Weiteres als
  direkten Katalogwiderspruch bezeichnen.
- Bildbeobachtung und Deutung der Quelle trennen; keine zusätzlichen Bildmerkmale erfinden.
- Warnzeichen, Anzeichen, Diagnose und gesetzliche Einordnung auseinanderhalten.

### Ergebnis je Eintrag

Nummern beziehen sich auf die Originalfragen der jeweiligen Quellenfassung.
Sie sind keine dauerhaften Positionen in einer gefilterten oder gemischten Anzeige.

| Quellenfassung / Originalfrage | Ergebnis | Begründung |
| --- | --- | --- |
| Rhein-Erft · 203 / 2 | Unverändert | „Nur“ und rassetypische Tendenzen sind bereits klar abgegrenzt. |
| Rhein-Erft · 203 / 4 | Präzisiert | Katalogdefinition ausdrücklich von einer allgemeingültigen Altersgrenze getrennt. |
| Rhein-Erft · 203 / 7 | Präzisiert | Beispiel auf die tatsächliche Tragezeit von wenigen Minuten eingegrenzt; Wartezeit und Gesamtbesuch ausdrücklich ausgeschlossen. |
| Rhein-Erft · 203 / 8 | Präzisiert | Stresswirkung als Möglichkeit statt als für jeden Kampf feststehende Reaktion beschrieben. |
| Rhein-Erft · 203 / 11 | Unverändert | Kein Schutzversprechen aus Beschwichtigung oder dem Wort Welpenschutz. |
| Rhein-Erft · 203 / 16 | Präzisiert | Sichtbare Bildmerkmale und Interpretation der Quelle ausdrücklich getrennt. |
| Rhein-Erft · 203 / 30 | Präzisiert | Geltungsbereich NRW und Rückrufbedingung aus C ausdrücklich aufgenommen. |
| Rhein-Erft · 203 / 33 | Präzisiert | Aufsichtspflicht nicht versehentlich auf kleine Kinder beschränkt. |
| Rhein-Erft · 203 / 40 | Präzisiert | Impfvorschriften, konkreter Kontaktfall und pauschale Aussage über das Vorkommen getrennt. |
| Rhein-Erft · 203 / 42 | Unverändert | Keine pauschale Erlaubnis aus Wohnungsgröße oder Achtstundengrenze. |
| Rhein-Erft · 203 / 48 | Präzisiert | Unbelegte Häufigkeit nicht zur eigenen Tatsachenbehauptung gemacht. |
| Rhein-Erft · 203 / 51 | Unverändert | Fixieren und Anspannung werden gemeinsam betrachtet, nicht jeder Blickkontakt. |
| Rhein-Erft · 203 / 53 | Präzisiert | „Zugestürmt“ nicht zu einer bloßen Annäherung abgeschwächt. |
| Rhein-Erft · 203 / 54 | Präzisiert | Warnzeichen nicht als sicheren Beweis für schlechte Herkunft dargestellt. |
| Rhein-Erft · 203 / 56 | Unverändert | Begrenzte Aussagekraft der Zeichnung wird ausdrücklich offengelegt. |
| Rhein-Erft · 203 / 59 | Präzisiert | Das Wort „kann“ nicht zu einer Lerngarantie verschärft; offene Bedeutung von D kenntlich gemacht. |
| Rhein-Erft · 203 / 69 | Unverändert | Grundverbot, jagdliche Ausnahme und medizinischer Einzelfall getrennt. |
| Rhein-Erft · 203 / 72 | Präzisiert | Unterschiedliche Erziehungsaussagen nicht als bewiesenen Widerspruch derselben Situation bezeichnet. |
| Rhein-Erft · 203 / 74 | Präzisiert | Einzelfallabwägung von einer eigenständigen gesetzlichen Erlaubnis getrennt. |
| Rhein-Erft · 203 / 79 | Unverändert | Mitverursachung und automatische Teilschuld ausdrücklich getrennt. |
| Rhein-Erft · 203 / 81 | Präzisiert | Möglichkeit einer Wirkung, hormoneller Zusammenhang und Garantie getrennt; B nicht künstlich eindeutig gemacht. |
| Rhein-Erft · 203 / 92 | Präzisiert | Vermeidung nicht als Verzicht auf Abklärung oder pauschale Nichtbehandlung erscheinen lassen. |
| Rhein-Erft · 203 / 6 | Unverändert | Gesamtbild und Quellenzuordnung statt Einzelmerkmal als Beweis. |
| Rhein-Erft · 203 / 26 | Unverändert | Sichtbare Haltung wird beschrieben und dem Katalog zugeordnet. |
| Rhein-Erft · 203 / 46 | Präzisiert | Stärke der Haltung und Spielabsicht nicht aus der Zeichnung überinterpretiert. |
| Rhein-Erft · 203 / 65 | Unverändert | Beobachtbare Haltung und Quellenzuordnung sind nachvollziehbar getrennt. |
| Rhein-Erft · 203 / 75 | Präzisiert | Nicht eindeutig sichtbares Ohrmerkmal aus der Bildbeschreibung entfernt. |
| Zugesandter 97er-Bogen / 24 | Präzisiert | Vermutete Herausgeberabsicht durch klare Trennung von Schlüssel und fachlicher Einschränkung ersetzt. |
| Zugesandter 97er-Bogen / 29 | Präzisiert | Den undefinierten Begriff „autoritär“ nicht mit schmerzhafter Erziehung gleichgesetzt. |
| Zugesandter 97er-Bogen / 32 | Unverändert | Instrumentabhängige Anwendung, kein pauschales Herausdrehen mit Pinzette. |
| Zugesandter 97er-Bogen / 33 | Präzisiert | Keine nachträgliche sichere Begründung für E erfunden; kein Bedrängen oder Sofaverbot aus Nichtzählung abgeleitet. |
| Zugesandter 97er-Bogen / 37 | Präzisiert | Nicht gefragte Ausnahme entfernt statt eine unvollständige Erlaubnisbedingung zu ergänzen. |
| Zugesandter 97er-Bogen / 40 | Präzisiert | Antwort C ausdrücklich zugeordnet; kleine Rasse nicht mit allgemeiner Befreiung gleichgesetzt. |
| Zugesandter 97er-Bogen / 42 | Unverändert | Achte Lebenswoche und Alter über acht Wochen präzise unterschieden. |
| Zugesandter 97er-Bogen / 46 | Präzisiert | Nicht aus fehlendem Nachweis auf Unmöglichkeit geschlossen; Kann-Frage als offen gekennzeichnet. |
| Zugesandter 97er-Bogen / 55 | Präzisiert | Familiäre Zugehörigkeit von der Formulierung „gleichberechtigt“ getrennt. |
| Zugesandter 97er-Bogen / 58 | Präzisiert | Schlüssel ausdrücklich von Trainingsauftrag, Fachposition und Rechtsfolge getrennt. |
| Rhein-Erft · 203 / 15 | Präzisiert | Grundausrüstung nicht für jede konkrete Anwendung freigegeben; Katalogschlüssel nicht als Auftrag bezeichnet. |
| Rhein-Erft · 203 / 31 | Unverändert | Kombination von Signalen; Wedeln nicht mit Freundlichkeit gleichgesetzt. |
| Rhein-Erft · 203 / 41 | Präzisiert | Lernkatalogzuordnung nicht als verbindliche Prüfungsantwort jedes Herausgebers bezeichnet. |
| Rhein-Erft · 203 / 57 | Präzisiert | Mehrere Rassen und Besuchsruhe nicht einzeln zu Beweisen für Unseriosität gemacht. |
| Rhein-Erft · 203 / 86 | Unverändert | Mögliche Geste nicht mit nachgewiesener Absicht gleichgesetzt. |
| Rhein-Erft · 203 / 108 | Unverändert | Angebrachtsein und gesetzliche Leinenpflicht unterschieden. |
| Rhein-Erft · 203 / 120 | Unverändert | Oder-Verknüpfung und zusätzliche gesetzliche Gruppen berücksichtigt. |
| Rhein-Erft · 203 / 132 | Unverändert | Mögliche Ursachen nicht als Diagnose des einzelnen Hundes ausgegeben. |
| Rhein-Erft · 203 / 135 | Präzisiert | Verlauf und Häufigkeit nicht über den Wortlaut hinaus erklärt; passende Fachquelle statt allgemeiner Zyklusseite. |
| Rhein-Erft · 203 / 137 | Unverändert | Mögliche Anzeichen nicht als sichere Diagnose oder Verhalten jeder Hündin dargestellt. |
| Rhein-Erft · 203 / 140 | Unverändert | Konkrete Verhaltensänderung und Kann-Aussage werden erhalten. |
| Rhein-Erft · 203 / 154 | Unverändert | Anzeichen nicht mit sicherem Befallsnachweis gleichgesetzt. |
| Rhein-Erft · 203 / 159 | Unverändert | Unklare Ursachenzuschreibung in A wird nicht nachträglich gerechtfertigt. |
| Rhein-Erft · 203 / 161 | Unverändert | Rassenunterschiede nicht mit festen Individualeigenschaften gleichgesetzt. |
| Rhein-Erft · 203 / 174 | Präzisiert | Mehrdeutiges „dieser Schlüssel“ und vermeintlicher Auftrag zur Anwendung entfernt. |
| Rhein-Erft · 203 / 181 | Unverändert | Herkunft weder als Diagnose noch als allgemeiner Häufigkeitsbeleg ausgegeben. |
| Rhein-Erft · 203 / 188 | Präzisiert | Regelmäßigen Kontakt nicht pauschal mit Überforderung gleichgesetzt. |
| Rhein-Erft · 203 / 193 | Präzisiert | „Nur kümmern“ auf Aufmerksamkeit bei der Begrüßung eingegrenzt, keine allgemeine Versorgungsregel. |
| Rhein-Erft · 203 / 198 | Unverändert | Verkürzte Antwortmöglichkeiten nicht als vollständige gesetzliche Voraussetzungen dargestellt. |
| Rhein-Erft · 203 / 202 | Unverändert | Gefragte falsche Aussagen werden deutlich von wahren Aussagen getrennt. |
| Zugesandter 97er-Bogen / 2 | Unverändert | Herstellerbezogene Gültigkeit nicht durch ein pauschales Dreijahresintervall ersetzt. |
| Zugesandter 97er-Bogen / 5 | Unverändert | Zusätzliche Altersphase im Schlüssel wird nicht als allgemein gesicherte Phasengrenze behauptet. |
| Zugesandter 97er-Bogen / 7 | Präzisiert | Allgemeine Ursachenfrage nicht als Diagnose eines konkreten Hundes behandelt. |
| Zugesandter 97er-Bogen / 13 | Unverändert | Zuordnungen bleiben quellengebunden; Rute allein wird nicht zur Diagnose. |
| Zugesandter 97er-Bogen / 14 | Unverändert | Bedeutung mehrerer Rechtsgebiete nicht mit gleichzeitiger Anwendbarkeit verwechselt. |
| Zugesandter 97er-Bogen / 17 | Präzisiert | Mögliche Übertragungswege nicht zu sicherer Infektion bei jedem Kotkontakt gemacht. |
| Zugesandter 97er-Bogen / 27 | Unverändert | Zeitfenster nicht als sichere Fruchtbarkeits- oder Verhütungskalenderregel dargestellt. |
| Zugesandter 97er-Bogen / 43 | Unverändert | Größenstaffel und offene Haltungsumstände statt pauschaler Rassenregel. |
| Zugesandter 97er-Bogen / 57 | Unverändert | Hauptsächliche und ausschließliche Sinneswahrnehmung getrennt. |

### Gezielt herangezogene Grundlagen

- [Bundestierärztekammer: Gefahr durch falschen Maulkorb](https://www.bundestieraerztekammer.de/presse/archiv/16/2016/gefahr-durch-falschen-maulkorb/1245): kurzzeitiger Einsatz, Hecheln und Grenzen enger Maulschlaufen.
- [TVT: Merkblatt 145 Maulkorbtraining](https://www.gtvmt.de/wp-content/uploads/2023/03/TVT_MB_145_Maulkorbtraining.pdf): Maulschlaufe nicht als Trainings- oder Alltagsmaulkorb.
- [AVSAB: Position Statements](https://avsab.org/resources/position-statements/): belohnungsbasiertes Training und Abgrenzung aversiver Verfahren.
- [WSAVA: Reproduktionsleitlinie](https://onlinelibrary.wiley.com/doi/full/10.1111/jsap.13724): keine pauschale Verhaltensgarantie durch Kastration.
- [LGL: Alleinfuttermittel](https://www.lgl.bayern.de/tiergesundheit/futtermittel/ueberwachung/ue_2025_alleinfuttermittel.htm): Fertigfutterbegriff und Bedarfsdeckung.
- [LGL: Zecken entfernen](https://www.lgl.bayern.de/gesundheit/infektionsschutz/infektionskrankheiten_a_z/borreliose/zecken_entfernen.htm): Grenzen der pauschalen Drehanweisung.
- [Merck Veterinary Manual: Verhaltensmodifikation](https://www.merckvetmanual.com/dog-owners/behavior-of-dogs/behavior-modification-in-dogs): behutsame Annäherung statt Überforderung.
- [Merck Veterinary Manual: Scheinträchtigkeit](https://www.merckvetmanual.com/reproductive-system/reproductive-diseases-of-the-female-small-animal/pseudopregnancy-in-small-animals): unterschiedliche klinische Ausprägungen; keine Behandlungsschemata übernommen.
- [ESCCAP: Würmer bei Hunden](https://www.esccap.de/parasiten/wuermer/wuermer-bei-hunden/): mögliche Übertragungswege statt Infektionsgarantie.
- [AVA: Sozialisation und Gewöhnung](https://www.ava.com.au/policy/puppy-and-kitten-socialisation-and-habituation): frühe sensible Entwicklung und individuell angepasste Erfahrungen.
- [Landesforstgesetz NRW](https://recht.nrw.de/lrgv/gesetz/30102026-landesforstgesetz-lfog/): allgemeine Waldregel, § 2 Absatz 3.
- [LHundG NRW](https://recht.nrw.de/lrgv/gesetz/27092016-hundegesetz-fuer-das-land-nordrhein-westfalen-landeshundegesetz-lhundg-nrw/): insbesondere §§ 3 bis 5, 8, 10 und 11.
- [TierSchG § 6](https://www.gesetze-im-internet.de/tierschg/__6.html): gesetzliche Ausnahmen von Eingriffsverboten.
- [TierSchHuV § 2](https://www.gesetze-im-internet.de/tierschhuv/__2.html): Altersgrenze und schmerzhafte Mittel.
- [TierSchHuV § 6](https://www.gesetze-im-internet.de/tierschhuv/__6.html): größenabhängige Zwingerflächen und zusätzliche Voraussetzungen.
- [TollwV § 9](https://www.gesetze-im-internet.de/tollwv_1991/__9.html): Unterscheidung von Impfschutz und Maßnahmen nach möglichem Kontakt.
- [BGB § 254](https://www.gesetze-im-internet.de/bgb/__254.html): ursächlicher Beitrag statt automatischer Teilschuld.

### Grenzen und technische Erhaltung

Dies ist eine redaktionelle Prüfung auf Widersprüche und Interpretationsrisiken,
keine Garantie, dass jede Originalfrage eindeutig oder fachlich aktuell ist.
Unklare Originale bleiben als solche erkennbar. Original-PDFs wurden nicht vollständig
neu abgeglichen; die aktuelle Prüfungsverwendung zugesandter Fassungen wird nicht bestätigt.
Die übrigen Fragen ohne Erklärung wurden durch diesen Auftrag nicht vollständig geprüft.

Originalfragen, Antworttexte, Schlüssel, Reihenfolge, Bewertung und Speicherzustände
bleiben unverändert. Die Versionskennung des Erklärungsskripts auf `lernen.html`
wurde erhöht, damit Browser die überarbeiteten Texte laden.
