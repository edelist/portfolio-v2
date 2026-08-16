/**
 * mosaic.js — <photo-mosaic>, the living wall behind the hero.
 *
 * Three things happen on this grid at once:
 *
 *  1. PAN — the whole wall is one belt sliding steadily rightward, like a
 *     sheet being drawn across the screen. It is built one column wider than
 *     it needs to be and rests one column to the left of the frame; when the
 *     right-most column has fully cleared the right edge it wraps round to
 *     the front of the belt and is refilled, so the pan never ends and
 *     nothing is ever seen changing. Photos only ever change off-screen.
 *
 *     Refills keep duplicates apart: a tile never repeats the photo directly
 *     above it or the one level with it in the neighbouring column, so the
 *     same picture is never visible twice side by side.
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
 * The lighting is one number per tile per frame ("lit", 0→1) driving opacity
 * + grayscale, written only when it actually changed. The page's single rAF
 * loop calls frame(); the element never starts its own. Because the tiles
 * move, each one's horizontal position is recomputed every frame from its
 * column's place on the belt rather than fixed at build time.
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
  // ── pan ────────────────────────────────────────────────────────────────
  const PAN_MS = 14000;  // ms for the belt to advance one whole column
  const GAPPX = 8;       // gutter between tiles, both axes
  const MAX_DT = 100;    // ms — clamp the frame delta so a backgrounded tab
                         // resuming can't teleport the belt forward
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
    :host{display:block;position:relative;overflow:hidden}
    /* The belt. Wider than the host by one spare column, translated left a
       little more each frame; when a column has fully cleared the left edge
       it is moved to the end and refilled, so the pan never ends. */
    .grid{position:absolute;top:0;bottom:0;left:0;display:flex;gap:${GAPPX}px;
          padding:${GAPPX}px 0;box-sizing:border-box;will-change:transform}
    .col{display:flex;flex-direction:column;gap:${GAPPX}px;flex:none}
    .tile{position:relative;flex:1;min-height:0;border-radius:4px;
          background:rgba(var(--ink-rgb,233,237,242),.035);
          will-change:opacity,filter,transform;
          transform-origin:50% 50%}
    .inner{position:absolute;inset:0;border-radius:inherit;overflow:hidden}
    /* pointer-events:none makes the tile div, not the photo, the hit target,
       so a right-click gets the ordinary page menu instead of "Save image
       as"; -webkit-user-drag stops dragging one to the desktop. Neither
       protects the file — see README — they just remove the one-click path.
       Safe here because nothing about this wall is hover-driven: the cursor
       light reads the pointer's coordinates, not events on the tiles. */
    .inner img{position:absolute;inset:0;width:100%;height:100%;
               object-fit:cover;display:block;opacity:0;
               transition:opacity .6s ease;
               pointer-events:none;-webkit-user-drag:none;user-select:none;
               -webkit-touch-callout:none}
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
      if (this._nCols === cols && this._nRows === rows && this._tiles.length) return;
      this._grid.textContent = '';
      this._tiles.length = 0;
      this._nCols = cols; this._nRows = rows;
      this._offset = 0; this._lastNow = 0; this._w = 0;

      // Shuffle once so the belt doesn't march through the folder in
      // filename order, which reads as a pattern rather than a wall.
      const list = this._photos().slice();
      for (let i = list.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [list[i], list[j]] = [list[j], list[i]];
      }
      this._pool = list;
      this._cursor = 0;

      // cols + 1: the spare is what occupies the gap opening on the right
      this._belt = [];
      for (let c = 0; c <= cols; c++) this._belt.push(this._makeCol(rows, c));
      this._belt.forEach(col => this._grid.appendChild(col.el));
      this._belt.forEach(col => this._fill(col));
    }

    _makeCol(rows, pos) {
      const el = document.createElement('div');
      el.className = 'col';
      const tiles = [];
      for (let r = 0; r < rows; r++) {
        const tl = document.createElement('div'); tl.className = 'tile';
        const inner = document.createElement('div'); inner.className = 'inner';
        const rim = document.createElement('div'); rim.className = 'rim';
        const img = document.createElement('img');
        img.alt = ''; img.draggable = false;
        // NOT loading="lazy": this wall is the hero background, entirely above
        // the fold, so lazy buys nothing and costs correctness — the deferral
        // is driven by intersection observation, which doesn't run when the
        // page isn't being painted, leaving every tile permanently blank.
        img.decoding = 'async';
        img.addEventListener('load', () => img.classList.add('on'));
        // A file that isn't in the repo yet just leaves the tile empty, which
        // still takes part in the sweep — the wall works unfilled.
        img.addEventListener('error', () => img.classList.remove('on'));
        inner.appendChild(img);
        tl.appendChild(inner); tl.appendChild(rim);
        el.appendChild(tl);
        const t = { el: tl, rim, img, src: null, row: r, cy: (r + .5) / rows, cx: 0, lit: -1 };
        tiles.push(t); this._tiles.push(t);
      }
      return { el, tiles, pos };
    }

    /**
     * Next photo that none of the cell's already-placed neighbours is using.
     * Walks the shuffled pool from a rotating cursor, so the choice stays
     * varied rather than always falling back to the same few files.
     */
    _pick(banned) {
      const p = this._pool;
      if (!p.length) return null;
      for (let k = 0; k < p.length; k++) {
        const u = p[(this._cursor + k) % p.length];
        if (!banned.has(u)) { this._cursor = (this._cursor + k + 1) % p.length; return u; }
      }
      const u = p[this._cursor % p.length];          // pool smaller than the ban set
      this._cursor = (this._cursor + 1) % p.length;
      return u;
    }

    /**
     * Fill a column, keeping duplicates apart: a tile may not repeat the photo
     * directly above it, nor the one level with it in EITHER neighbouring
     * column. Checking both sides (rather than just the one the belt happens
     * to recycle away from) keeps this correct whichever way the belt runs.
     * The tile below is not banned — it is assigned next, and bans this one.
     */
    _fill(col) {
      const i = this._belt.indexOf(col);
      const left = this._belt[i - 1], right = this._belt[i + 1];
      col.tiles.forEach((t, r) => {
        const banned = new Set();
        if (r > 0) banned.add(col.tiles[r - 1].src);
        if (left) banned.add(left.tiles[r].src);
        if (right) banned.add(right.tiles[r].src);
        banned.delete(null);
        const u = this._pick(banned);
        if (!u || u === t.src) return;
        t.src = u;
        t.img.classList.remove('on');
        t.img.setAttribute('src', u);
      });
    }

    /** Move the right-most column round to the front of the belt and refill
     *  it. Both the position it leaves and the one it arrives at are off
     *  screen, so the wrap is never visible. */
    _recycle() {
      const col = this._belt.pop();
      this._belt.unshift(col);
      this._grid.insertBefore(col.el, this._grid.firstChild);
      this._belt.forEach((c, i) => { c.pos = i; });
      this._fill(col);
    }

    /** Column geometry follows the host's width; recompute only when it moves. */
    _measure(w) {
      if (w === this._w) return;
      this._w = w;
      this._colW = Math.max(1, (w - (this._nCols - 1) * GAPPX) / this._nCols);
      for (const col of this._belt) col.el.style.width = this._colW + 'px';
    }

    /**
     * One frame of lighting. px/py are viewport coordinates of the pointer
     * (pass -1e4 to park the cursor light off-grid); now is ms.
     */
    frame(px, py, now) {
      if (!this._tiles.length) return;
      const r = this.getBoundingClientRect();
      if (r.width <= 0 || r.bottom < -200 || r.top > innerHeight + 200) return;

      // advance the belt, recycling any column that has cleared the left edge
      this._measure(r.width);
      const step = this._colW + GAPPX;
      // Clamped at BOTH ends. The upper clamp stops a backgrounded tab from
      // teleporting the belt on resume; the lower one stops a `now` that ever
      // goes backwards from driving the offset negative, which the modulo
      // below cannot pull back — the belt would slide away and never return.
      const dt = Math.max(0, Math.min(MAX_DT, this._lastNow ? now - this._lastNow : 0));
      this._lastNow = now;
      this._offset += dt * (step / PAN_MS);
      while (this._offset >= step) { this._offset -= step; this._recycle(); }
      // The belt travels RIGHT, so it sits one column further left than the
      // frame and closes that gap as it goes; the spare column is the one
      // waiting off the left edge, and columns leave past the right one.
      this._grid.style.transform = `translateX(${(this._offset - step).toFixed(2)}px)`;
      // every tile's horizontal position now moves, so the sweep and cursor
      // light have to read it fresh rather than from a value fixed at build
      for (const col of this._belt) {
        const cx = (col.pos * step + this._offset - step + this._colW / 2) / r.width;
        for (const t of col.tiles) t.cx = cx;
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
