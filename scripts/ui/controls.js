/* scripts/ui/controls.js */

/**
 * @file Tastaturbedienbare Auswahlfelder.
 * @description Eigene Select-Comboboxen und Suchfeld; erhält native Datenmodelle und Tastaturbedienung.
 * @author Benjamin Bennewitz [B²]
 */
'use strict';
(() => {
  let active = null;
  const controls = [];

  /** Normalisiert Suchbuchstaben unabhängig von Großschreibung und Umlauten. */
  const normalize = value => value.toLocaleLowerCase('de')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  class CustomSelect {

    /** Bindet ein eigenes, tastaturbedienbares Auswahlmenü an ein verborgenes Select-Modell. */
    constructor(select) {
      this.select = select;
      this.index = 0;
      this.query = '';
      this.queryTimer = null;
      this.root = document.createElement('div');
      this.root.className = 'custom-select';
      select.before(this.root);
      this.root.append(select);
      select.hidden = true;
      select.tabIndex = -1;
      this.trigger = document.createElement('button');
      this.trigger.type = 'button';
      this.trigger.className = 'select-trigger';
      this.trigger.id = `${select.id}-trigger`;
      this.trigger.setAttribute('role', 'combobox');
      this.trigger.setAttribute('aria-haspopup', 'listbox');
      this.trigger.setAttribute('aria-expanded', 'false');
      this.value = document.createElement('span');
      this.value.id = `${select.id}-value`;
      const arrow = document.createElement('span');
      arrow.className = 'select-chevron';
      arrow.setAttribute('aria-hidden', 'true');
      this.trigger.append(this.value, arrow);
      this.root.append(this.trigger);
      this.menu = document.createElement('div');
      this.menu.id = `${select.id}-listbox`;
      this.menu.className = 'select-menu';
      this.menu.setAttribute('role', 'listbox');
      this.menu.hidden = true;
      document.body.append(this.menu);
      this.trigger.setAttribute('aria-controls', this.menu.id);
      const label = [...document.querySelectorAll('label')].find(label => label.htmlFor ===
        select.id);
      if (label) {
        label.htmlFor = this.trigger.id;
        label.id ||= `${select.id}-label`;
        this.caption = [...label.childNodes].filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent)
          .join(' ')
          .trim();
        this.menu.setAttribute('aria-label', this.caption || 'Auswahl');
      } else this.trigger.setAttribute('aria-label', select.getAttribute('aria-label') || select
        .id);
      this.trigger.addEventListener('click', () => this.menu.hidden ? this.open() : this
        .close());
      this.trigger.addEventListener('keydown', event => this.onKey(event));
      select.addEventListener('change', () => this.refresh());
      new MutationObserver(() => this.refresh())
        .observe(select, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['disabled', 'label', 'selected']
        });
      this.refresh();
    }

    /** Synchronisiert Auswahltext, Optionen, Deaktivierung und ARIA-Beschriftung. */
    refresh() {
      this.options = [...this.select.options];
      this.trigger.disabled = this.select.disabled;
      this.value.textContent = this.select.selectedOptions[0]?.textContent || 'Bitte auswählen';
      this.trigger.setAttribute('aria-label',
        `${this.caption ? this.caption + ': ' : ''}${this.value.textContent}`);
      const selected = Math.max(0, this.select.selectedIndex);
      if (this.menu.hidden) this.index = selected;
      const fragment = document.createDocumentFragment();
      this.options.forEach((option, index) => {
        const item = document.createElement('div');
        item.id = `${this.select.id}-option-${index}`;
        item.className = 'select-option';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(option.selected));
        if (option.disabled) item.setAttribute('aria-disabled', 'true');
        const text = document.createElement('span');
        text.textContent = option.textContent;
        const mark = document.createElement('span');
        mark.className = 'option-mark';
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = option.selected ? '✓' : '';
        item.append(text, mark);
        item.addEventListener('pointerdown', event => event.preventDefault());
        item.addEventListener('click', () => {
          if (!option.disabled) this.choose(index);
        });
        fragment.append(item);
      });
      this.menu.replaceChildren(fragment);
      if (!this.menu.hidden) {
        this.highlight();
        this.position();
      }
    }

    /** Öffnet das einzige aktive Auswahlmenü an der Position seines Auslösers. */
    open() {
      if (this.trigger.disabled || !this.options.length) return;
      active?.close();
      const bounds = this.trigger.getBoundingClientRect();
      if (bounds.top < 0 || bounds.bottom > innerHeight) this.trigger.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'instant'
      });
      active = this;
      this.index = Math.max(0, this.select.selectedIndex);
      if (this.options[this.index]?.disabled) this.move(1);
      this.menu.hidden = false;
      this.trigger.setAttribute('aria-expanded', 'true');
      this.root.classList.add('is-open');
      this.highlight();
      this.position();
    }

    /** Schließt das Menü und entfernt den aktiven ARIA-Nachfahren. */
    close() {
      this.menu.hidden = true;
      this.trigger.setAttribute('aria-expanded', 'false');
      this.trigger.removeAttribute('aria-activedescendant');
      this.root.classList.remove('is-open');
      if (active === this) active = null;
    }

    /** Begrenzt das Menü auf den sichtbaren Viewport und klappt es bei Platzmangel nach oben auf. */
    position() {
      const rect = this.trigger.getBoundingClientRect();
      const inset = 12;
      const viewportWidth = document.documentElement.clientWidth;
      const width = Math.max(0, Math.min(Math.max(rect.width, 230), viewportWidth - inset * 2));
      const below = innerHeight - rect.bottom - inset;
      const above = rect.top - inset;
      const upwards = below < 220 && above > below;
      const height = Math.max(70, Math.min(310, upwards ? above - 8 : below - 8));
      this.menu.style.width = `${width}px`;
      this.menu.style.maxHeight = `${height}px`;
      this.menu.style.left =
        `${Math.max(inset, Math.min(rect.left, viewportWidth - width - inset))}px`;
      this.menu.style.top = upwards ? 'auto' : `${Math.max(inset, rect.bottom + 6)}px`;
      this.menu.style.bottom = upwards ? `${innerHeight - rect.top + 6}px` : 'auto';
    }

    /** Markiert die vorläufig aktive Option und hält sie im Menü sichtbar. */
    highlight() {
      [...this.menu.children].forEach((item, index) => item.classList.toggle('is-active',
        index === this.index));
      const option = this.menu.children[this.index];
      if (option) {
        this.trigger.setAttribute('aria-activedescendant', option.id);
        const top = option.offsetTop;
        const bottom = top + option.offsetHeight;
        if (top < this.menu.scrollTop) this.menu.scrollTop = top;
        else if (bottom > this.menu.scrollTop + this.menu.clientHeight) this.menu.scrollTop =
          bottom - this.menu.clientHeight;
      }
    }

    /** Verschiebt die vorläufige Auswahl zyklisch und überspringt gesperrte Optionen. */
    move(direction) {
      const size = this.options.length;
      for (let i = 1; i <= size; i++) {
        const next = (this.index + direction * i + size * 2) % size;
        if (!this.options[next].disabled) {
          this.index = next;
          break;
        }
      }
      if (!this.menu.hidden) this.highlight();
    }

    /** Übernimmt eine zulässige Option und meldet eine tatsächliche Wertänderung. */
    choose(index) {
      const option = this.options[index];
      if (!option || option.disabled) return;
      const changed = this.select.value !== option.value;
      this.select.value = option.value;
      this.close();
      this.refresh();
      this.trigger.focus({
        preventScroll: true
      });
      if (changed) this.select.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    }

    /** Verarbeitet Pfeile, Home/End, Escape, Tab und die Suche über Anfangsbuchstaben. */
    onKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === 'Tab') {
        this.close();
        return;
      }
      if (event.key === 'Escape') {
        if (!this.menu.hidden) {
          event.preventDefault();
          event.stopPropagation();
          this.close();
        }
        return;
      }
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        if (this.menu.hidden) this.open();
        else this.move(event.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      if (['Home', 'End'].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation();
        if (this.menu.hidden) this.open();
        this.index = event.key === 'Home' ? 0 : this.options.length - 1;
        if (this.options[this.index]?.disabled) this.move(event.key === 'Home' ? 1 : -1);
        this.highlight();
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        if (this.menu.hidden) this.open();
        else this.choose(this.index);
        return;
      }
      if (event.key.length === 1) {
        event.preventDefault();
        event.stopPropagation();
        this.query += normalize(event.key);
        if (this.query.length > 1 && [...this.query].every(char => char === this.query[0])) this
          .query = this.query[0];
        clearTimeout(this.queryTimer);
        this.queryTimer = setTimeout(() => {
          this.query = '';
        }, 700);
        if (this.menu.hidden) this.open();
        const start = this.query.length === 1 ? this.index + 1 : 0;
        for (let offset = 0; offset < this.options.length; offset++) {
          const index = (start + offset) % this.options.length;
          const option = this.options[index];
          if (!option.disabled && normalize(option.textContent.trim())
            .startsWith(this.query)) {
            this.index = index;
            this.highlight();
            break;
          }
        }
      }
    }
  }
  document.querySelectorAll('select')
    .forEach(select => controls.push(new CustomSelect(select)));

  /** Gleicht programmatisch geänderte Select-Werte mit den sichtbaren Controls ab. */
  window.refreshCustomControls = () => controls.forEach(control => {
    const text = control.select.selectedOptions[0]?.textContent || 'Bitte auswählen';
    if (control.value.textContent !== text || control.trigger.disabled !== control.select
      .disabled) control.refresh();
  });
  document.addEventListener('pointerdown', event => {
    if (active && !active.root.contains(event.target) && !active.menu.contains(event.target))
      active.close();
  });
  document.addEventListener('focusin', event => {
    if (active && !active.root.contains(event.target) && !active.menu.contains(event.target))
      active.close();
  });
  addEventListener('resize', () => active?.position());
  document.addEventListener('scroll', event => {
    if (!active || active.menu.contains(event.target)) return;
    const bounds = active.trigger.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) active.close();
    else active.position();
  }, true);

  const search = document.querySelector('#search');
  if (search) {
    const oldLabel = search.closest('label');
    const group = document.createElement('div');
    group.className = 'search-label';
    const label = document.createElement('label');
    label.htmlFor = search.id;
    label.textContent = 'Fragen durchsuchen';
    const frame = document.createElement('div');
    frame.className = 'search-control';
    const icon = document.createElement('span');
    icon.className = 'search-symbol';
    icon.setAttribute('aria-hidden', 'true');
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'search-clear';
    clear.setAttribute('aria-label', 'Suche löschen');
    clear.textContent = '×';
    clear.hidden = !search.value;
    oldLabel.replaceWith(group);
    frame.append(icon, search, clear);
    group.append(label, frame);
    clear.addEventListener('click', () => {
      search.value = '';
      clear.hidden = true;
      search.dispatchEvent(new Event('input', {
        bubbles: true
      }));
      search.focus();
    });
    search.addEventListener('input', () => {
      clear.hidden = !search.value;
    });
    const refresh = window.refreshCustomControls;
    window.refreshCustomControls = () => {
      refresh();
      clear.hidden = !search.value;
    };
  }
})();
