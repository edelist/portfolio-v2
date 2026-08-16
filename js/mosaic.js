/**
 * mosaic.js — <photo-mosaic>, the living wall behind the hero.
 *
 * Three things happen on this grid at once:
 *
 *  1. SLIDESHOW — every tile holds two stacked <img> layers. On a slow
 *     round-robin (one tile every SWAP_MS) a tile crossfades to the next
 *     photo in the pool, so the wall is always quietly turning over
 *     without any two tiles changing together.
 *
 *  2. SWEEP — a light front travels left→right across the grid on a long
 *     cycle. It is not a straight vertical line: the front is sheared by
 *     row and bent by a slow sine, so it arrives as a leaning, breathing
 *     wave. It has two parts — a narrow bright CORE (the "line" itself,
 *     which also rims the tile it crosses in accent blue) and a wide soft
 *     BODY trailing it, which is what actually lifts photos out of the
 *     dark. A tile the front is crossing also lifts very slightly in Z.
 *
 *  3. CURSOR LIGHT — the same lighting response follows the pointer, so
 *     the cursor reads as a hand-held version of the sweep rather than a
 *     separate hover effect. This is why the tiles carry no CSS :hover
 *     rule: hover and sweep are the same channel, combined per frame.
 *
 * Everything above is one number per tile per frame ("lit", 0→1) driving
 * opacity + grayscale, written only when it actually changed. The page's
 * single rAF loop calls frame(); the element never starts its own.
 *
 * Photos come from window.JACK_PHOTOS (js/photos.js). Visitors cannot add
 * or replace them — there is no input, drop target, or click handler here.
 *
 * Attributes: cols (default 7) · rows (default 4) — the wide-screen grid.
 * Below NARROW px the element rebuilds itself at cols/rows from the `narrow`
 * pair instead, because 7 columns on a phone is 28 stamps, not photographs.
 *
 * Usage:
 *   <photo-mosaic cols="7" rows="4"></photo-mosaic>
 *   // each animation frame, from the page:
 *   mosaicEl.frame(pointerX, pointerY, performance.now());
 *
 * Tuning constants are grouped at the top of the file.
 */
(function () {
  // ── sweep ──────────────────────────────────────────────────────────────
  const SWEEP = 5400;    // ms the front spends crossing
  const GAP = 1800;      // ms of dark between one sweep leaving and the next
                         // arriving — keep this short or the wall reads dead
  const CYCLE = SWEEP + GAP;
  const SHEAR = 0.30;    // how far the front leans (rows lag the row above)
  const WAVE = 0.055;    // amplitude of the slow bend in the front
  const CORE = 0.020;    // half-width of the bright leading line (0–1 of width)
  const BODY = 0.115;    // half-width of the soft glow trailing it
  const SWEEP_MAX = .62; // the sweep only half-wakes a tile — the cursor is
                         // what takes one all the way up, so the wall stays
                         // background and the pointer stays the loud thing
  // ── cursor ─────────────────────────────────────────────────────────────
  const REACH = 0.20;    // pointer light radius, as a fraction of grid width
  // ── slideshow ──────────────────────────────────────────────────────────
  const SWAP_MS = 2300;  // one tile changes photo this often
  // ── responsive ─────────────────────────────────────────────────────────
  const NARROW = 700;    // px viewport width below which the grid coarsens
  const NARROW_COLS = 3;
  const NARROW_ROWS = 6;
  // ── appearance ─────────────────────────────────────────────────────────
  // Resting/peak tile opacity are theme tokens (--mosaic-rest / --mosaic-peak
  // in index.html), not constants: the same dimming that reads as "faint" on
  // a dark page reads as "washed-out grey grid" on a light one.
  const REST_FALLBACK = 0.14;
  const PEAK_FALLBACK = 0.92;

  const CSS = `
    :host{display:block;position:relative}
    .grid{position:absolute;inset:0;display:grid;gap:8px;padding:8px;
          box-sizing:border-box}
    .tile{position:relative;border-radius:4px;
          background:rgba(var(--ink-rgb,233,237,242),.035);
          will-change:opacity,filter,transform;
          transform-origin:50% 50%}
    .inner{position:absolute;inset:0;border-radius:inherit;overflow:hidden}
    .inner img{position:absolute;inset:0;width:100%;height:100%;
               object-fit:cover;display:block;opacity:0;
               transition:opacity 1.2s ease}
    .inner img.on{opacity:1}
    .rim{position:absolute;inset:0;border-radius:inherit;pointer-events:none}
  `;

  class PhotoMosaic extends HTMLElement {
    constructor() {
      super();
      const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
      root.innerHTML = '<style>' + CSS + '</style><div class="grid"></div>';
      this._grid = root.querySelector('.grid');
      this._tiles = [];
      this._lastSwap = 0;
      this._swapCursor = 0;
      this._built = false;
      this._rest = REST_FALLBACK;
      this._peak = PEAK_FALLBACK;
    }

    connectedCallback() {
      if (!this._built) { this._build(); this._built = true; }
      this._readTokens();
      if (window.jackTheme && !this._offTheme) {
        this._offTheme = window.jackTheme.onChange(() => this._readTokens());
      }
      // Rebuild only when the breakpoint is actually crossed — a plain resize
      // listener would tear the wall down on every pixel of a window drag.
      if (!this._mq && window.matchMedia) {
        this._mq = matchMedia('(max-width:' + (NARROW - 1) + 'px)');
        this._onMq = () => { this._build(); this._readTokens(); };
        if (this._mq.addEventListener) this._mq.addEventListener('change', this._onMq);
      }
    }

    disconnectedCallback() {
      if (this._offTheme) { this._offTheme(); this._offTheme = null; }
      if (this._mq && this._mq.removeEventListener) {
        this._mq.removeEventListener('change', this._onMq);
        this._mq = null;
      }
    }

    /** Re-read the theme's opacity tokens and force a full restyle. */
    _readTokens() {
      const cs = getComputedStyle(this);
      const num = (name, fb) => {
        const v = parseFloat(cs.getPropertyValue(name));
        return Number.isFinite(v) ? v : fb;
      };
      this._rest = num('--mosaic-rest', REST_FALLBACK);
      this._peak = num('--mosaic-peak', PEAK_FALLBACK);
      // invalidate the per-tile write cache so every tile repaints once
      for (const t of this._tiles) t.lit = -1;
    }

    /** Resolved photo URLs. Cached on the list identity — frame() asks for
     *  this 60×/s and the manifest only changes if js/photos.js is edited. */
    _photos() {
      const cfg = window.JACK_PHOTOS || {};
      const list = cfg.mosaic || [];
      if (this._photoSrc !== list) {
        this._photoSrc = list;
        const base = cfg.base || '';
        this._photoUrls = list.map(f => (/^(https?:|\.|\/)/.test(f) ? f : base + f));
      }
      return this._photoUrls;
    }

    _build() {
      const narrow = innerWidth < NARROW;
      const cols = narrow ? NARROW_COLS : (parseInt(this.getAttribute('cols'), 10) || 7);
      const rows = narrow ? NARROW_ROWS : (parseInt(this.getAttribute('rows'), 10) || 4);
      if (this._cols === cols && this._rows === rows && this._tiles.length) return;
      this._grid.textContent = '';
      this._tiles.length = 0;
      this._swapCursor = 0;
      this._cols = cols; this._rows = rows;
      this._grid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
      this._grid.style.gridTemplateRows = `repeat(${rows},1fr)`;

      const list = this._photos();
      const frag = document.createDocumentFragment();
      for (let i = 0; i < cols * rows; i++) {
        const el = document.createElement('div');
        el.className = 'tile';
        const inner = document.createElement('div');
        inner.className = 'inner';
        const rim = document.createElement('div');
        rim.className = 'rim';
        const imgs = [document.createElement('img'), document.createElement('img')];
        imgs.forEach(im => {
          im.alt = ''; im.draggable = false; im.loading = 'lazy';
          // A file that isn't in the repo yet just leaves the tile empty,
          // which still takes part in the sweep — the wall works unfilled.
          im.addEventListener('error', () => im.classList.remove('on'));
          inner.appendChild(im);
        });
        el.appendChild(inner); el.appendChild(rim);
        frag.appendChild(el);

        const t = {
          el, rim, imgs, cur: 0, round: 0,
          // normalized centre, used by both the sweep and the cursor light
          cx: ((i % cols) + .5) / cols,
          cy: (Math.floor(i / cols) + .5) / rows,
          lit: -1,
        };
        if (list.length) this._show(t, i, list[i % list.length]);
        this._tiles.push(t);
      }
      this._grid.appendChild(frag);
      // Stagger the first cycle so the pool doesn't march in index order.
      this._order = this._tiles.map((_, i) => i);
      for (let i = this._order.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [this._order[i], this._order[j]] = [this._order[j], this._order[i]];
      }
    }

    /** Crossfade tile `t` to `src` on its idle layer. */
    _show(t, i, src) {
      const next = t.imgs[1 - t.cur];
      if (next.getAttribute('src') === src) return;
      const onLoad = () => {
        next.removeEventListener('load', onLoad);
        next.classList.add('on');
        t.imgs[t.cur].classList.remove('on');
        t.cur = 1 - t.cur;
      };
      next.addEventListener('load', onLoad);
      next.setAttribute('src', src);
    }

    /**
     * One frame of lighting. px/py are viewport coordinates of the pointer
     * (pass -1e4 to park the cursor light off-grid); now is ms.
     */
    frame(px, py, now) {
      if (!this._tiles.length) return;
      const r = this.getBoundingClientRect();
      if (r.width <= 0 || r.bottom < -200 || r.top > innerHeight + 200) return;

      // slideshow tick — one tile per SWAP_MS, in shuffled order
      const list = this._photos();
      if (list.length > 1 && now - this._lastSwap > SWAP_MS) {
        this._lastSwap = now;
        const i = this._order[this._swapCursor % this._order.length];
        this._swapCursor++;
        const t = this._tiles[i];
        t.round++;
        // stride of 7 keeps neighbours from landing on the same photo
        this._show(t, i, list[(i + t.round * 7) % list.length]);
      }

      // sweep front: -0.35 → 1.35 during SWEEP, then parked off-grid
      const u = (now % CYCLE) / SWEEP;
      const front = u <= 1 ? -0.35 + u * 1.7 : 99;
      const bend = Math.sin(now / 2600);

      // pointer in normalized grid space; aspect-correct the vertical axis
      const aspect = r.height / r.width || 1;
      const hx = (px - r.left) / r.width;
      const hy = (py - r.top) / r.height;
      const near = hx > -.5 && hx < 1.5 && hy > -.5 && hy < 1.5;

      for (const t of this._tiles) {
        let core = 0, body = 0;
        if (front < 90) {
          // the front leans by row and breathes, so it never reads as a
          // ruled vertical line crossing the grid
          const phase = t.cx + (t.cy - .5) * SHEAR + Math.sin(t.cy * 3.1 + bend) * WAVE;
          const d = phase - front;
          core = Math.exp(-(d * d) / (2 * CORE * CORE));
          body = d < 0
            ? Math.exp(-(d * d) / (2 * BODY * BODY))            // trailing glow
            : Math.exp(-(d * d) / (2 * (BODY * .45) * (BODY * .45)));  // tight ahead
        }
        let hov = 0;
        if (near) {
          const dx = t.cx - hx, dy = (t.cy - hy) * aspect;
          const dist = Math.sqrt(dx * dx + dy * dy);
          hov = Math.max(0, 1 - dist / REACH);
          hov *= hov * (3 - 2 * hov);   // smoothstep — soft edge, solid centre
        }

        const shine = Math.min(SWEEP_MAX, core * .85 + body * .62);
        const lit = Math.min(1, Math.max(shine, hov));
        if (Math.abs(lit - t.lit) < .006) continue;   // skip no-op writes
        t.lit = lit;

        const s = t.el.style;
        s.opacity = (this._rest + (this._peak - this._rest) * lit).toFixed(3);
        s.filter = `grayscale(${(1 - lit).toFixed(3)}) saturate(${(.6 + .6 * lit).toFixed(2)})`;
        s.transform = lit > .01 ? `scale(${(1 + .018 * lit).toFixed(4)})` : '';
        s.zIndex = lit > .35 ? '1' : '';
        // the leading edge rims the tile it is crossing, echoing the cursor ring
        const rimA = Math.max(core * .75, hov * .35);
        t.rim.style.boxShadow = rimA > .02
          ? `inset 0 0 0 1px rgba(var(--accent-rgb,121,176,255),${rimA.toFixed(3)}),` +
            `0 0 ${(16 * rimA).toFixed(1)}px rgba(var(--accent-rgb,121,176,255),${(rimA * .45).toFixed(3)})`
          : '';
      }
    }
  }

  if (!customElements.get('photo-mosaic')) customElements.define('photo-mosaic', PhotoMosaic);
})();
