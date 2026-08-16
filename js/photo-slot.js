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
 *   quiet   render NOTHING when src is missing/broken, instead of the dashed
 *           placeholder. Use for decoration that is optional — a 15px company
 *           logo reads as a dashed box, not as "drop a file here".
 *
 * The element also reflects its state as a `data-empty` attribute whenever
 * there is no image to show, so a wrapper can collapse its own layout (see
 * .jos-logo in index.html, which uses :has() to drop the flex gap too).
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
    /* Same deterrent as the mosaic: the host element becomes the hit target,
       so right-click offers the page menu rather than "Save image as", and
       the image can't be dragged out. Not protection — just not one click. */
    img{width:100%;height:100%;display:block;opacity:0;transition:opacity .45s ease;
        pointer-events:none;-webkit-user-drag:none;user-select:none;
        -webkit-touch-callout:none}
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
    static get observedAttributes() { return ['src', 'fit', 'label', 'radius', 'quiet']; }

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
        this._sync();
      });
      this._img.addEventListener('error', () => {
        this._img.classList.remove('on');
        this._sync();
      });
    }

    connectedCallback() { this._render(); this._settle(); }
    disconnectedCallback() { cancelAnimationFrame(this._raf); }
    attributeChangedCallback() { this._render(); }

    /**
     * Is there an image to show? DERIVED from the <img> every time, never
     * remembered from a transition: the page re-renders on a 1s clock, so
     * _render() can run long after the load or error fired and still has to
     * reach the same answer. (Marking the state only when `src` changed left
     * a failed image looking non-empty forever.)
     */
    _isEmpty() {
      if (!(this.getAttribute('src') || '')) return true;
      if (!this._img.complete) return true;     // in flight
      return !this._img.naturalWidth;           // settled but broken
    }
    /** Show/hide the placeholder and mirror the state onto the host. */
    _setEmpty(empty) {
      this._ph.hidden = !empty || this.hasAttribute('quiet');
      this.toggleAttribute('data-empty', empty);
    }
    _sync() { this._setEmpty(this._isEmpty()); }
    /**
     * Converge on the derived answer after a src change. load/error are the
     * primary signal, but a slot can miss one — an element re-created by the
     * page runtime around an already-cached failure never sees an error fire
     * — and a stale "not empty" leaves a 15px hole in the row forever. So
     * re-check each frame until the image has settled, then stop.
     */
    _settle() {
      cancelAnimationFrame(this._raf);
      const tick = () => {
        this._sync();
        if (!this._img.complete) this._raf = requestAnimationFrame(tick);
      };
      this._raf = requestAnimationFrame(tick);
    }

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
        if (src) this._img.setAttribute('src', src);
        else this._img.removeAttribute('src');
        this._settle();
      }
      this._sync();
    }
  }

  if (!customElements.get('photo-slot')) customElements.define('photo-slot', PhotoSlot);
})();
