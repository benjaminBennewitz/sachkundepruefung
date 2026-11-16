/* scripts/ui/accessibility-speech.js */

/**
 * @file Vorlesen mit einer lokalen deutschen Browserstimme.
 * @description Liest sichtbare Inhalte ohne versteckte Lösungen und stoppt beim Fragenwechsel.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';

(access => {
  access.Speech = class Speech {
    /**
     * Verbindet verfügbare lokale Stimmen, Seitenwechsel und Änderungen der aktuellen Frage.
     * @param {Function} changed Aktualisiert Bedienelemente bei Statusänderungen.
     */
    constructor(changed) {
      this.engine = window.speechSynthesis;
      this.changed = changed;
      this.active = false;
      this.paused = false;
      this.generation = 0;
      this.engine?.addEventListener('voiceschanged', changed);
      window.addEventListener('pagehide', () => this.stop());
      const questions = document.getElementById('questions');
      if (questions) {
        this.observer = new MutationObserver(() => this.stop());
        this.observer.observe(questions, { childList: true, subtree: true });
      }
    }

    /** @returns {SpeechSynthesisVoice|undefined} Ausschließlich eine lokale deutsche Stimme. */
    voice() {
      if (!window.SpeechSynthesisUtterance) return undefined;
      return this.engine?.getVoices().find(voice => voice.localService && /^de(?:-|$)/i.test(voice.lang));
    }

    /**
     * Schließt verborgene, eingeklappte und reine Bedienbereiche aus.
     * @param {HTMLElement} element Möglicher Lesetext.
     * @returns {boolean} Ob der Text tatsächlich sichtbar und lesbar ist.
     */
    readable(element) {
      return !element.closest('[hidden], nav, .visually-hidden, button') &&
        element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
    }

    /** @returns {string[]} Sichtbare Frage samt Antworten oder redaktionelle Hauptinhalte. */
    paragraphs() {
      const question = document.querySelector('.question-card');
      const root = question || document.querySelector('main');
      if (!root) return [];
      const selector = question ? '.question-number, .question-prompt, legend, .mapping-context, .answer-option' :
        'h1, h2, h3, p, li';
      return [...root.querySelectorAll(selector)]
        .filter(element => this.readable(element) && (question || !element.parentElement.closest('li')))
        .map(element => element.innerText.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
    }

    /**
     * Begrenzt einzelne Sprachaufträge ohne Wörter oder Absätze zu verschlucken.
     * @param {string[]} paragraphs Sichtbare Textabsätze.
     * @returns {string[]} Kurze, nacheinander gesprochene Abschnitte.
     */
    chunks(paragraphs) {
      return paragraphs.flatMap(paragraph => paragraph.match(/.{1,220}(?:\s|$)|\S{1,220}/g) || []);
    }

    /** @returns {void} Startet eine lokale Stimme nach einer ausdrücklichen Bedienaktion. */
    start() {
      const voice = this.voice();
      if (!voice) return;
      this.stop();
      const chunks = this.chunks(this.paragraphs());
      if (!chunks.length) return;
      this.active = true;
      const generation = this.generation;
      const next = () => {
        if (generation !== this.generation) return;
        const text = chunks.shift();
        if (!text) { this.stop(); return; }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.lang = voice.lang;
        utterance.rate = .95;
        utterance.onend = next;
        utterance.onerror = () => this.stop();
        this.engine.speak(utterance);
      };
      next();
      this.changed();
    }

    /** @returns {void} Pausiert oder setzt die laufende lokale Ausgabe fort. */
    pause() {
      if (!this.active) return;
      this.paused = !this.paused;
      if (this.paused) this.engine.pause();
      else this.engine.resume();
      this.changed();
    }

    /** @returns {void} Verwirft auch noch wartende Sprachabschnitte. */
    stop() {
      this.generation += 1;
      const wasActive = this.active;
      this.active = false;
      this.paused = false;
      if (wasActive) this.engine?.cancel();
      this.changed();
    }
  };
})(window.LHUNDG_ACCESS);
