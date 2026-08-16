/**
 * globe.js — the interactive wireframe globe in the ~/jack hero.
 *
 * Owns everything about the globe: geometry, projection, land data,
 * flight route, drag/inertia, hover lighting, click-to-focus zoom,
 * and per-frame drawing. The page (index.html) forwards pointer events,
 * calls frame(), and listens to onFocusChange for the chapter HUD.
 *
 * Usage:
 *   const globe = new GlobeRenderer(canvasEl);
 *   globe.onFocusChange = city => { ... };   // city object or null
 *   // each animation frame: globe.frame()
 *   // pointer wiring:      globe.startDrag(x, y) / pointerMove(x, y) / endDrag()
 *   // programmatic:        globe.setFocus(cityOrNull)
 *
 * Interaction model:
 *   hover  — sheen follows the cursor; nearest pin locks on and pops its label
 *   drag   — horizontal spins (inertia on release), vertical tilts (springs back)
 *   click  — on a pin: the globe eases to center it and zooms in ("focus");
 *            click anywhere else on the sphere, drag, or Esc releases it
 *
 * Rendering model: orthographic projection of unit-sphere points.
 * Every drawable (graticule, coastline, flight arc) is an array of
 * [x, y, z] unit vectors; rot() applies the current yaw/tilt and
 * anything with z > 0 faces the viewer and gets drawn.
 *
 * Land data: Natural Earth coastlines (public domain) fetched at runtime
 * from the version-pinned world-atlas CDN. If the fetch fails the globe
 * still renders (graticule + route only).
 */

const D2R = Math.PI / 180;
// Fallbacks only — the live values are read from the page's CSS tokens in
// readPalette() so the globe follows the light/dark switch (js/theme.js).
const ACCENT = [121, 176, 255];   // brand blue, matches --accent-rgb
const INK = [233, 237, 242];      // ink, matches --ink-rgb

/** Read an "r,g,b" CSS custom property off <html>. */
function cssRGB(name, fallback) {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const p = raw.split(',').map(s => parseFloat(s.trim()));
    return p.length === 3 && p.every(Number.isFinite) ? p : fallback;
  } catch (e) {
    return fallback;
  }
}

/** lat/lon in degrees → unit vector [x, y, z]. */
function v3(lat, lon) {
  const p = lat * D2R, l = lon * D2R;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
}

/**
 * The stops of Jack's life, in the order the route is flown.
 * ox/oy — per-city label offsets in px, hand-tuned so the clustered
 *         northeast-US labels never overlap.
 * desc/href — chapter blurb + timeline anchor shown in the focus HUD.
 */
export const CITIES = [
  { n: 'NYC', lat: 40.71, lon: -74.01, ox: 8,   oy: 22,  desc: 'born here — 2003',                href: '#stop-nyc' },
  { n: 'HKG', lat: 22.32, lon: 114.17, ox: 10,  oy: -7,  desc: 'grew up — 2003–2017',             href: '#stop-hkg' },
  { n: 'YYZ', lat: 43.65, lon: -79.38, ox: -52, oy: -14, desc: 'UCC — 2017–2021',                 href: '#stop-yyz' },
  { n: 'BOS', lat: 42.36, lon: -71.06, ox: 12,  oy: -8,  desc: 'BU · rugby · DJ sets — 2021–2025', href: '#stop-bos' },
  { n: 'DTW', lat: 42.33, lon: -83.05, ox: -52, oy: 16,  desc: 'GM internship — 2023',            href: '#stop-dtw' },
  { n: 'MUC', lat: 48.14, lon: 11.58,  ox: 10,  oy: -8,  desc: 'kyrall — now',                    href: '#stop-muc' },
];

/** Route as indices into CITIES: NYC → HK → Toronto → Boston → Detroit → Boston → Munich. */
export const ROUTE = [0, 1, 2, 3, 4, 3, 5];

export class GlobeRenderer {
  /**
   * @param {HTMLCanvasElement} canvas  square canvas; drawn at 2x for retina.
   * @param {object} [opts]
   * @param {number} [opts.size=460]     CSS pixel size of the canvas.
   * @param {number} [opts.radius=182]   globe radius in CSS px.
   * @param {number} [opts.baseTilt=.38] resting tilt (rad); drag offsets spring back to this.
   */
  constructor(canvas, { size = 460, radius = 182, baseTilt = .38 } = {}) {
    this.cv = canvas;
    // Radius, label offsets and type all track the canvas size, so the globe
    // is one shape at any width. rFrac pins the sphere's share of the box.
    this.rFrac = radius / size;
    this.baseTilt = baseTilt;
    this.setSize(size);
    this.yaw = 2.2;          // current rotation around the poles
    this.yawVel = 0;         // spin inertia after a drag release
    this.tiltOff = 0;        // vertical drag offset, springs back to 0
    this.zoom = 1;           // eases toward 1.22 while a city is focused
    this.dragging = false;
    this.moved = 99;         // px moved during the current drag (click detector)
    this.px = -1e4; this.py = -1e4;  // pointer, canvas-local CSS px
    this.glow = 0;           // 0→1 hover-light amount (eased)
    this.focus = null;       // focused city or null
    this.hoveredCity = null; // set each frame; used by the click handler
    this.onFocusChange = null;

    this.cities = CITIES.map(c => ({ ...c, v: v3(c.lat, c.lon) }));
    this.arcs = this.buildRouteArcs();
    this.landArcs = null;
    this.loadLand();
    this.readPalette();
    // follow the site-wide light/dark switch
    if (window.jackTheme) this.offTheme = window.jackTheme.onChange(() => this.readPalette());

    // tap/click-to-focus: a press that barely moved toggles focus on the pin
    // under the pointer. Picked fresh here rather than read off the last
    // frame — a touch tap has no pointermove before it and can land between
    // two frames, which would otherwise make pins dead on a phone.
    canvas.addEventListener('pointerup', () => {
      if (this.moved >= 6) return;                       // that was a drag
      const hit = this.pickCity();
      if (hit && hit !== this.focus) this.setFocus(hit);
      else this.setFocus(null);                          // empty sphere / same pin = release
    });
  }

  /**
   * Resize the globe in place — the hero calls this so the whole section
   * fits the viewport at any zoom or screen size. Owns both the CSS box and
   * the 2×-retina backing store, so the page never sets either.
   * @param {number} size  CSS pixels, square.
   */
  setSize(size) {
    size = Math.max(120, Math.round(size));
    if (size === this.size) return;
    this.size = size;
    this.c = size / 2;
    this.R = size * this.rFrac;
    this.k = size / 460;            // everything in px scales off this
    this.fs = Math.max(9, Math.round(19 * this.k));   // city label type
    this.cv.width = size * 2;
    this.cv.height = size * 2;
    this.cv.style.width = size + 'px';
    this.cv.style.height = size + 'px';
  }

  /** Pull the current theme's accent/ink out of the page's CSS tokens. */
  readPalette() {
    this.accent = cssRGB('--accent-rgb', ACCENT);
    this.ink = cssRGB('--ink-rgb', INK);
    this.soft = cssRGB('--accent-soft-rgb', [173, 206, 255]);
    // Ink lines carry the coastlines. On a light page a .3-alpha near-black
    // is already strong, so the whole ink channel is damped there; on dark
    // it needs the extra lift to read against the background.
    this.inkA = this.ink[0] + this.ink[1] + this.ink[2] > 380 ? 1 : .62;
  }

  /** Great-circle arcs between consecutive route stops (slerp, slight lift). */
  buildRouteArcs() {
    const arcs = [];
    for (let i = 0; i < ROUTE.length - 1; i++) {
      const a = this.cities[ROUTE[i]].v, b = this.cities[ROUTE[i + 1]].v;
      const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
      const om = Math.acos(dot), so = Math.sin(om) || 1e-6, pts = [];
      for (let k = 0; k <= 24; k++) {
        const t = k / 24, s0 = Math.sin((1 - t) * om) / so, s1 = Math.sin(t * om) / so;
        const lift = 1 + Math.sin(t * Math.PI) * .06;   // arcs bow slightly off the surface
        pts.push([(a[0] * s0 + b[0] * s1) * lift, (a[1] * s0 + b[1] * s1) * lift, (a[2] * s0 + b[2] * s1) * lift]);
      }
      arcs.push(pts);
    }
    return arcs;
  }

  /** Fetch Natural Earth land (TopoJSON) and pre-project every coastline arc. */
  loadLand() {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json')
      .then(r => r.json())
      .then(topo => {
        const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
        this.landArcs = topo.arcs.map(arc => {
          let x = 0, y = 0; const pts = [];
          arc.forEach(([dx, dy], i) => {
            x += dx; y += dy;
            if (i % 2 && i !== arc.length - 1) return;  // downsample 2:1, keep endpoints
            pts.push(v3(y * sy + ty, x * sx + tx));
          });
          return pts;
        }).filter(a => a.length > 1);
      })
      .catch(() => {});   // globe still works without land
  }

  /** Focus a city (globe eases to center it, zooms in) or release with null. */
  setFocus(city) {
    if (city === this.focus) { if (!city) return; }
    this.focus = city;
    if (city) {
      const [x, y, z] = city.v;
      // yaw that brings the city to the front meridian, tilt that centers it vertically
      this.targetYaw = Math.atan2(-x, z);
      this.targetTilt = Math.atan2(y, Math.hypot(x, z)) - this.baseTilt;
      this.yawVel = 0;
    }
    if (this.onFocusChange) this.onFocusChange(city);
  }

  /**
   * Nearest pin to the current pointer, or null. Uses each city's projection
   * from the last frame — the sphere can't have turned since — against the
   * live pointer position, so it is correct even with no frame in between.
   */
  pickCity() {
    const R = this.R * this.zoom, C = this.c;
    let best = null, bd = 46 * this.k;
    for (const city of this.cities) {
      const p = city._p;
      if (!p || p[2] <= 0) continue;
      const d = Math.hypot(C + p[0] * R - this.px, C - p[1] * R - this.py);
      if (d < bd) { bd = d; best = city; }
    }
    return best;
  }

  // ── pointer wiring (called by the page) ──────────────────────────────
  /** @param x,y  clientX/clientY of the press. */
  startDrag(x, y) {
    // Seed the pointer here too: on touch there is no hover to have set it,
    // so without this the first tap on a pin reads as "empty sphere".
    const r = this.cv.getBoundingClientRect();
    this.px = x - r.left; this.py = y - r.top;
    this.dragging = true; this.moved = 0; this.lastX = x; this.lastY = y;
  }
  endDrag() { this.dragging = false; }
  /** Global pointermove — tracks hover always, rotates while dragging. */
  pointerMove(x, y) {
    const r = this.cv.getBoundingClientRect();
    this.px = x - r.left; this.py = y - r.top;
    if (!this.dragging) return;
    const dx = x - this.lastX, dy = y - this.lastY;
    this.lastX = x; this.lastY = y;
    this.moved += Math.abs(dx) + Math.abs(dy);
    if (this.focus && this.moved > 12) this.setFocus(null);   // a real drag releases focus
    this.yawVel = dx * .005;
    this.yaw += this.yawVel;
    // drag up → tilt down (natural "grab the sphere" feel), clamped, springs back
    this.tiltOff = Math.max(-.55, Math.min(.55, this.tiltOff + dy * .004));
  }

  // ── drawing ──────────────────────────────────────────────────────────
  /** Draw one frame. Call from requestAnimationFrame; cheap when offscreen. */
  frame() {
    const cv = this.cv;
    const rect = cv.getBoundingClientRect();
    if (rect.bottom < -50 || rect.top > innerHeight + 50) return;

    if (this.focus && !this.dragging) {
      // ease toward the focused city (shortest way around) and hold there
      const d = (((this.targetYaw - this.yaw + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
      this.yaw += d * .08;
      this.tiltOff += (this.targetTilt - this.tiltOff) * .08;
    } else if (!this.dragging) {
      this.yaw += .0035 + this.yawVel;   // idle spin + decaying inertia
      this.yawVel *= .95;
      this.tiltOff *= .92;               // spring back to the resting tilt
    }
    this.zoom += ((this.focus ? 1.22 : 1) - this.zoom) * .08;

    const R = this.R * this.zoom, C = this.c;
    const px = this.px, py = this.py;
    const inside = ((px - C) / R) ** 2 + ((py - C) / R) ** 2 < 1;
    this.glow += ((inside || this.dragging ? 1 : 0) - this.glow) * .09;
    const g = this.glow;
    const ACC = this.accent, INKC = this.ink, SOFT = this.soft, ia = this.inkA;
    const mix = (i) => Math.round(INKC[i] + (ACC[i] - INKC[i]) * g);

    const pitch = this.baseTilt + this.tiltOff;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cyw = Math.cos(this.yaw), syw = Math.sin(this.yaw);
    /** yaw + tilt rotation; result z > 0 ⇒ front-facing. */
    const rot = v => {
      const x = v[0] * cyw + v[2] * syw, z = -v[0] * syw + v[2] * cyw;
      return [x, v[1] * cp - z * sp, v[1] * sp + z * cp];
    };

    const ctx = cv.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);   // canvas is 2x its CSS size
    ctx.clearRect(0, 0, this.size, this.size);

    /** Stroke a polyline of unit vectors, breaking wherever it dips behind the sphere. */
    const seg = pts3 => {
      ctx.beginPath(); let pen = false;
      for (const v of pts3) {
        const p = rot(v);
        if (p[2] > 0) { const sx = C + p[0] * R, sy = C - p[1] * R; pen ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); pen = true; }
        else pen = false;
      }
      ctx.stroke();
    };

    // hover sheen — a soft light that follows the cursor across the sphere
    if (inside && g > .02) {
      ctx.save(); ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.clip();
      const gr = ctx.createRadialGradient(px, py, 0, px, py, 160 * this.k);
      gr.addColorStop(0, `rgba(${ACC},${.16 * g})`);
      gr.addColorStop(1, `rgba(${ACC},0)`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, this.size, this.size);
      ctx.restore();
    }

    // outline — warms from ink to accent as you hover
    ctx.lineWidth = 1 + .3 * g;
    ctx.strokeStyle = `rgba(${mix(0)},${mix(1)},${mix(2)},${.3 + .3 * g})`;
    ctx.beginPath(); ctx.arc(C, C, R, 0, 7); ctx.stroke();

    // graticule (30° grid)
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(${mix(0)},${mix(1)},${mix(2)},${.11 + .09 * g})`;
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = []; for (let lon = 0; lon <= 360; lon += 6) pts.push(v3(lat, lon));
      seg(pts);
    }
    for (let lon = 0; lon < 360; lon += 30) {
      const pts = []; for (let lat = -90; lat <= 90; lat += 6) pts.push(v3(lat, lon));
      seg(pts);
    }

    // coastlines
    if (this.landArcs) {
      ctx.strokeStyle = `rgba(${INKC},${(.3 + .15 * g) * ia})`;
      ctx.lineWidth = .8;
      this.landArcs.forEach(a => seg(a));
      ctx.lineWidth = 1;
    }

    // flight route
    ctx.strokeStyle = `rgba(${ACC},${.4 + .4 * g})`;
    ctx.lineWidth = 1.2 + .5 * g;
    this.arcs.forEach(a => seg(a));

    // traveler dot — continuously flies the whole route
    const t = performance.now() / 1000;
    const segF = ((t * .045) % 1) * this.arcs.length;
    const ai = Math.min(this.arcs.length - 1, Math.floor(segF));
    const arc = this.arcs[ai];
    const kf = (segF - ai) * (arc.length - 1);
    const k0 = Math.min(arc.length - 2, Math.floor(kf)), kt = kf - k0;
    const tp = rot([0, 1, 2].map(j => arc[k0][j] + (arc[k0 + 1][j] - arc[k0][j]) * kt));
    if (tp[2] > 0) {
      const sx = C + tp[0] * R, sy = C - tp[1] * R;
      ctx.fillStyle = `rgb(${SOFT})`;
      ctx.beginPath(); ctx.arc(sx, sy, 3 * this.k, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(${SOFT},.5)`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(sx, sy, 6.5 * this.k, 0, 7); ctx.stroke();
    }

    // cities — nearest pin within 46px of the cursor locks on
    let hovered = null, hd = 46 * this.k;
    this.cities.forEach(city => {
      const p = rot(city.v); city._p = p;
      if (p[2] <= 0) return;
      const d = Math.hypot(C + p[0] * R - px, C - p[1] * R - py);
      if (d < hd) { hd = d; hovered = city; }
    });
    this.hoveredCity = hovered;
    ctx.font = this.fs + 'px JetBrains Mono, monospace';
    this.cities.forEach(city => {
      const p = city._p;
      if (p[2] <= 0) return;
      const sx = C + p[0] * R, sy = C - p[1] * R;
      const isMuc = city.n === 'MUC';        // Munich = current chapter, always pulses
      const isHot = city === hovered || city === this.focus;
      ctx.fillStyle = isMuc || isHot ? `rgb(${ACC})` : `rgba(${INKC},${.85 * ia})`;
      ctx.beginPath(); ctx.arc(sx, sy, (isHot ? 4.4 : isMuc ? 3.2 + Math.sin(t * 4) * 1.1 : 2.4) * this.k, 0, 7); ctx.fill();
      if (isMuc || isHot) {
        ctx.strokeStyle = `rgba(${ACC},${.5 + Math.sin(t * 4) * .3})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(sx, sy, ((isHot ? 10 : 8) + Math.sin(t * 4) * 2) * this.k, 0, 7); ctx.stroke();
      }
      if (isHot) ctx.font = Math.round(this.fs * 1.16) + 'px JetBrains Mono, monospace';
      ctx.fillStyle = isMuc || isHot ? `rgb(${SOFT})` : `rgba(${INKC},${.5 * ia})`;
      ctx.fillText(city.n, sx + city.ox * this.k, sy + city.oy * this.k);
      if (isHot) ctx.font = this.fs + 'px JetBrains Mono, monospace';
    });
  }
}
