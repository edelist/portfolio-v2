/**
 * photo-slot.js — <photo-slot>, a read-only image frame.
 *
 * Replaces the authoring-time <image-slot> drop zone. This element has no
 * upload path at all: no file input, no drag-and-drop, no click handler. A
 * visitor cannot put their own image on the page, in their browser or
 * anyone else's. The picture comes from the `src` attribute, i.e. a file
 * committed to assets/.
 *
 * Until a file exists at `src` the slot renders a labelled placeholder, so
 * the layout is correct before every photo is in place.
 *
 * Attributes (all single-word — the page runtime camel-cases hyphenated
 * attribute names on custom elements, so avoid those here):
 *   src     image URL, resolved against the document.
 *   fit     'cover' (default) | 'contain'. Use contain for logos.
 *   label   placeholder caption shown while src is missing/broken.
 *   radius  corner radius in px (default 4).
 *
 * Usage:
 *   <photo-slot src="./assets/photos/hong-kong.jpg" label="hong kong"></photo-slot>
 *   <photo-slot src="./assets/logos/red-hat.svg" fit="contain" radius="2"></photo-slot>
 */
(function () {
  const CSS = `
    :host{display:block;position:relative;width:100%;height:100%}
    .box{position:absolute;inset:0;overflow:hidden;display:flex;
         align-items:center;justify-content:center}
    img{width:100%;height:100%;display:block;opacity:0;transition:opacity .45s ease}
    img.on{opacity:1}
    .ph{position:absolute;inset:0;display:flex;flex-direction:column;gap:4px;
        align-items:center;justify-content:center;text-align:center;padding:6px;
        box-sizing:border-box;
        background:rgba(var(--ink-rgb,233,237,242),.035);
        border:1px dashed rgba(var(--ink-rgb,233,237,242),.14);
        color:rgba(var(--ink-rgb,233,237,242),.32);
        font-family:'JetBrains Mono',monospace;font-size:9px;line-height:1.3;
        letter-spacing:.02em}
    .ph svg{width:14px;height:14px;opacity:.6}
    :host([hidden]),.ph[hidden]{display:none}
  `;

  const ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
    '<rect x="3" y="5" width="18" height="14" rx="2"/>' +
    '<circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-5-6 6-3-3-4 4"/></svg>';

  class PhotoSlot extends HTMLElement {
    static get observedAttributes() { return ['src', 'fit', 'label', 'radius']; }

    constructor() {
      super();
      const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
      root.innerHTML =
        '<style>' + CSS + '</style>' +
        '<div class="box"><img alt="" draggable="false">' +
        '<div class="ph">' + ICON + '<span></span></div></div>';
      this._box = root.querySelector('.box');
      this._img = root.querySelector('img');
      this._ph = root.querySelector('.ph');
      this._phText = root.querySelector('.ph span');
      // A broken/absent file is the normal pre-upload state, not an error:
      // fall back to the placeholder and keep the layout intact.
      this._img.addEventListener('load', () => {
        this._img.classList.add('on');
        this._ph.hidden = true;
      });
      this._img.addEventListener('error', () => {
        this._img.classList.remove('on');
        this._ph.hidden = false;
      });
    }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { this._render(); }

    _render() {
      const src = this.getAttribute('src') || '';
      const fit = this.getAttribute('fit') === 'contain' ? 'contain' : 'cover';
      const r = parseFloat(this.getAttribute('radius'));
      const radius = (Number.isFinite(r) ? r : 4) + 'px';
      this._box.style.borderRadius = radius;
      this._ph.style.borderRadius = radius;
      this._phText.textContent = this.getAttribute('label') || '';
      this._img.style.objectFit = fit;
      if (this._img.getAttribute('src') !== src) {
        this._img.classList.remove('on');
        this._ph.hidden = false;
        if (src) this._img.setAttribute('src', src);
        else this._img.removeAttribute('src');
      }
    }
  }

  if (!customElements.get('photo-slot')) customElements.define('photo-slot', PhotoSlot);
})();
