# Gemeinsame Modale und Toasts

Stand: 9. November 2026 · Benjamin Bennewitz [B²]

## Verantwortung und Einbindung

scripts/ui/common.js stellt window.LHUNDG_UI bereit. Es wird auf allen Seiten nach site-config.js und vor scripts/learning/app.js eingebunden. Die Komponenten verwenden Textknoten statt HTML-Interpolation. Styling und Theme-Zustände: styles/interface.css, Abschnitt 10; Modal-Grundlayout: vorhandener Abschnitt 04.

Ein wiederverwendetes natives dialog-Element übernimmt modale Bedienung, inaktiven Hintergrund, Fokusbegrenzung und Escape. Mehrere Aufrufe warten nacheinander. Beim Schließen wird der Fokus ohne Scrollsprung zurückgegeben. Abbrechen erhält automatisch den Anfangsfokus. Auch PayPal verwendet diese Komponente.

## Bestätigung

```js
const accepted = await window.LHUNDG_UI.confirm({
  title: 'Lernbereich zurücksetzen?',
  message: 'Antworten und Merkliste werden gelöscht.',
  confirmLabel: 'Ja, zurücksetzen',
  cancelLabel: 'Nein, weiterlernen',
  danger: true
});
if (!accepted) return;
// Erst hier die bestätigte Aktion durchführen.
```

confirm liefert Promise<boolean>. Escape und Abbrechen liefern false. Für eigene Dialoge steht modal(options) mit title, message, optional eyebrow/note/returnFocus und actions bereit. Buttons schließen über ihren value; externe Links lassen den Dialog offen. modal liefert Promise<string>, bei Escape „cancel“. Typen und Aktionsoptionen stehen per JSDoc im Modul.

## Informationen und Fehler

```js
window.LHUNDG_UI.toast('Lernstand geladen.', { type: 'success' });
window.LHUNDG_UI.toast('Der Browser blockiert die Speicherung.', {
  type: 'warning', key: 'storage-failed', duration: 0
});
```

Typen: info, success, warning, error. Infos und Erfolge bleiben acht Sekunden sichtbar; Warnungen und Fehler bis zum manuellen Schließen. duration überschreibt die Zeit in Millisekunden, 0 bleibt unbegrenzt. key verhindert gleichzeitige Duplikate. Maximal drei Toasts sind sichtbar, weitere warten in einer FIFO-Schlange. Zeitlimits pausieren bei Maus-/Tastaturkontakt und bei ausgeblendetem Tab.

Toasts sind fest positioniert, verschieben den Lernbereich nicht und übernehmen beim Erscheinen keinen Fokus. Separate Live-Bereiche melden Infos höflich und Warnungen/Fehler dringlich; gleichzeitige Meldungen werden für die Ankündigung gebündelt. Nach Tastatur-Schließen geht der Fokus zum nächsten Toast oder zum Auslöser zurück.

## Integration

- Zurücksetzen, Import, Abschluss unvollständiger Tests und Neustart einer laufenden Simulation warten auf das Modal.
- Import/Export, Rücksetzen, Teststart und Werkzeughinweise verwenden Toasts.
- Speicherprobleme: einmaliger bleibender Toast; Speicherhinweis unter dem Trainer bleibt unverändert.
- Ungültiges JSON: verständlicher deutscher Hinweis; importierte Daten werden vor dem Zusammenführen weiterhin validiert.
- Export meldet „zum Speichern bereitgestellt“: Der Abschluss des Browser-Downloads auf dem Datenträger ist nicht feststellbar.
- Keine Toasts für jede automatisch gespeicherte Antwort.

## Navigation und Inhalte

Sichtbare Hover-/Focus-/Active-Zustände in der Navigation. Smooth Scroll nur für html.knowledge-page, bei prefers-reduced-motion ohne Animation; Fragenwechsel bleiben direkt. Alle sechs Footer enthalten NRW-Hinweis und mailto an kontakt@design-code-repeat.de mit Betreff „Sachkundenachweis für Hunde (Bundesland)“.

Hilfetexte: Kontakt für fehlende Prüfungsprofile, Herkunft zugesandter Fragen, Tastaturübersicht mit kbd-Elementen. Reisehinweise: Anzeige-/Genehmigungspflichten vor dem Besuch prüfen, Anerkennung von Wesenstests und Befreiungen klären, Impfausweis und behördliche Papiere mitnehmen.

Die optionalen Seitenvorlagen sind synchron aktualisiert. Das Deployment erzeugt oder formatiert HTML weiterhin nicht neu.

## Prüfung

Sechs Kernprüfungen bestanden. Skript-Syntax und lokale Verweise geprüft. Im Browser geprüft: Rücksetzen bestätigen/abbrechen, Escape/Fokus-Rückgabe, Import/Export und Importfehler, offene Testauswertung, Neustart-Abfrage, PayPal auf gemeinsamem Modal, Toast-Warteschlange und simulierter gesperrter Speicher. Mobile Modalbreite bei 320 Pixeln und Hilfetexte bei 768 Pixeln ohne horizontalen Seitenüberlauf geprüft. Native Browser-Abfragen und alte Inline-Hinweisfelder entfernt.

Keine neuen öffentlichen Dateipfade: vorhandenes UI-Modul. Keine Änderung oder Neuinstallation des Serverskripts nötig.
