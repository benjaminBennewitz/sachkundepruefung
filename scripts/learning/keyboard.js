/* scripts/learning/keyboard.js */

/**
 * @file Tastatursteuerung des Lerntrainers.
 * @description Verbindet TV-Bedienung und Rasterbewegung mit vorhandenen Fokuszielen.
 * @author Benjamin Bennewitz [B²]
 */
window.LHUNDG_TRAINER.Keyboard = class Keyboard {
  /** @param {TrainerLearningView} view Lernansicht und Fragenübersicht. */
  constructor(view) {
    this.view = view;                      // Lernansicht für Rendering, Navigation und Fokusführung.
    this.state = view.state;               // Gemeinsam genutzter Zustand; keine zweite Kopie des Lernstands.
    this.dom = window.LHUNDG_TRAINER.dom;  // Vorhandene sichere Helfer zum Erzeugen und Auffinden von DOM-Elementen.
  }

  /** Bindet einmalig TV-Tasten sowie die beiden Fragenraster an. */
  bind() {
    document.addEventListener('keydown', event => this.handleTv(event));        // Verbindet Tastendrücke im Dokument mit der kontextabhängigen TV-Steuerung.
    // Gibt dem Fragenraster eine eigene Bewegung anhand seiner tatsächlichen Spaltenzahl.
    this.dom
      .get('questionNav')
      .addEventListener('keydown', event =>
        this.moveInGrid(event, this.dom.get('questionNav'), [...this.view.navButtons.values()])
      );
    // Ergänzt bei vorhandenen Fehlern die Tastatursteuerung des Fehlerrasters.
    this.dom.get('result').addEventListener('keydown', event => {
      const grid = this.dom.get('result').querySelector('.error-number-grid');  // Fehlernavigation, die erst nach einer Auswertung vorhanden sein kann.

      // Nur ein vorhandenes Fehlerraster kann eigene Rastertasten verarbeiten.
      if (grid) this.moveInGrid(event, grid, [...grid.querySelectorAll('button')]);
    });
  }

  /** @param {KeyboardEvent} event Taste. @returns {boolean} Ob TV-Bedienung hier Vorrang hat. */
  acceptsTvKey(event) {
    const modified = event.ctrlKey || event.metaKey || event.altKey;  // Zusatzmodifikatoren kennzeichnen Tastenkombinationen außerhalb der TV-Steuerung.
    const resultVisible = !this.dom.get('result').hidden;             // Ein offenes Ergebnis hat Vorrang vor der Fragenbedienung.

    // Außerhalb der TV-Ansicht, bei Tastenkombinationen oder offenem Ergebnis greift die TV-Steuerung nicht ein.
    if (this.state.view !== 'tv' || modified || resultVisible) return false;

    const target = event.target;                          // Element, von dem der aktuelle Tastendruck ausgeht.
    // Eingabefelder und editierbare Inhalte behalten ihre eigene Tastaturbedienung.
    const editing = target.matches('select, input[type=search], input[type=file], textarea') ||
      target.isContentEditable;
    const inNavigation = target.closest('#questionNav');  // Fragenraster mit separater Pfeiltastensteuerung.
    const inTrainer = target.closest('#trainer');         // Begrenzt TV-Tasten auf den tatsächlichen Lernbereich.

    // Eingaben und Raster behalten Vorrang; die übrigen TV-Tasten gelten nur innerhalb des Trainers.
    return !editing && !inNavigation && Boolean(inTrainer);
  }

  /** @param {KeyboardEvent} event Tastendruck im TV-Lernbereich. */
  handleTv(event) {
    // Nicht zur TV-Bedienung gehörende Tastendrücke behalten ihr normales Browserverhalten.
    if (!this.acceptsTvKey(event)) return;

    // Rechts und links wechseln zwischen den gefilterten Fragenseiten.
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();                               // Verhindert die konkurrierende Standardaktion für eine hier behandelte Taste.
      this.view.step(event.key === 'ArrowRight' ? 1 : -1);  // Blättert im gefilterten Ergebnis und erhält die passende Fokusführung.
    // Andernfalls gilt: Aufwärts und abwärts bewegen den Fokus innerhalb der Antworten.
    } else if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      this.moveBetweenAnswers(event);                       // Bewegt den Fokus zwischen aktivierbaren Antworten und sichtbarer Prüfaktion.
    // Andernfalls gilt: Home und End springen zur ersten beziehungsweise letzten gefilterten Frage.
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();                               // Verhindert die konkurrierende Standardaktion für eine hier behandelte Taste.
      // Home wählt Index null, End die letzte vorhandene Frage der aktuellen Treffermenge.
      this.state.index = event.key === 'Home' ? 0 : Math.max(0, this.state.items.length - 1);
      this.view.render(true);                               // Zeigt das per Home oder End gewählte Ziel mit kontrollierter Fokusführung.
      this.view.session.persist();                          // Sichert die per Tastatur geänderte Position im zum Modus gehörenden Speicher.
    // Andernfalls gilt: Enter übernimmt bei nativen Antwortfeldern dieselbe Auswahlaktion wie ein Klick.
    } else if (event.key === 'Enter' && event.target.matches('input[type=checkbox],input[type=radio]')) {
      event.preventDefault();                               // Verhindert die konkurrierende Standardaktion für eine hier behandelte Taste.
      event.target.click();
    }
  }

  /** @param {KeyboardEvent} event Aufwärts- oder Abwärtstaste in den Antwortoptionen. */
  moveBetweenAnswers(event) {
    // Nur aktivierbare Antworten und sichtbare Prüfaktionen sind Fokusziele.
    const controls = [
      ...this.dom.get('questions').querySelectorAll('input, .question-check:not([hidden])')
    ].filter(element => !element.disabled);

    // Ohne aktivierbare Antwort oder Prüfaktion gibt es kein zulässiges Fokusziel.
    if (!controls.length) return;

    event.preventDefault();                                    // Verhindert die konkurrierende Standardaktion für eine hier behandelte Taste.
    const current = controls.indexOf(document.activeElement);  // Position des aktuell fokussierten Steuerelements; -1 bedeutet außerhalb der Liste.
    const direction = event.key === 'ArrowDown' ? 1 : -1;      // Abwärts bewegt vorwärts, aufwärts rückwärts durch die Fokusziele.

    controls[(current + direction + controls.length) % controls.length].focus();
  }

  /**
   * @param {KeyboardEvent} event Rastertaste.
   * @param {HTMLElement} container Raster mit tatsächlicher CSS-Spaltenzahl.
   * @param {HTMLElement[]} buttons Fokussierbare Rasterzellen in Dokumentreihenfolge.
   */
  moveInGrid(event, container, buttons) {
    const index = buttons.indexOf(document.activeElement);  // Position des fokussierten Buttons im aktuellen Raster.

    // Tastendrücke außerhalb der Rasterbuttons dürfen keine Rasterbewegung auslösen.
    if (index < 0) return;

    const offset = this.gridOffset(event.key, container, buttons.length);  // Tastenabhängiger Versatz; unbekannte Tasten liefern undefined.

    // Unbekannte Tasten bleiben für Browser und andere Controls verfügbar.
    if (offset === undefined) return;

    const targetIndex = Math.max(0, Math.min(buttons.length - 1, index + offset));  // Auf vorhandene Rasterzellen begrenztes Fokusziel.
    event.preventDefault();                                                         // Verhindert die konkurrierende Standardaktion für eine hier behandelte Taste.
    event.stopPropagation();                                                        // Verhindert, dass dieselbe Rastertaste zusätzlich von der TV-Steuerung verarbeitet wird.
    buttons[targetIndex].focus();
  }

  /** Übersetzt eine Rastertaste anhand der tatsächlichen CSS-Spaltenzahl in einen Versatz. */
  gridOffset(key, container, count) {
    const columns = getComputedStyle(container).gridTemplateColumns.split(' ').length;  // Tatsächliche Rasterbreite, damit Auf/Ab auch responsiv dieselbe Spalte treffen.
    // Versätze für horizontale Bewegung, Zeilenwechsel und Rastergrenzen.
    const moves = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
      Home: -count,
      End: count
    };

    // Nur eigene bekannte Tastenbezeichnungen liefern einen Versatz, andere bleiben unbehandelt.
    return Object.hasOwn(moves, key) ? moves[key] : undefined;
  }
};
