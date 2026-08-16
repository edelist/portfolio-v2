# ~/jack — personal site (v2)

Interactive wireframe globe with click-to-focus zoom, typeable terminal,
scroll-drawn flight-path timeline, a border-to-border photo wall that
crossfades and catches a passing light, custom cursor. Light and dark.

## File map

```
index.html            page markup + the page controller:
                      theme tokens · custom cursor · Munich clock · scroll
                      system (route draw pinned to mid-viewport + sideways
                      card reveal) · smooth in-page navigation · wiring for
                      globe, mosaic & terminal · focus HUD
js/theme.js           light/dark switch — runs in <head>, before first paint
js/photos.js          THE PHOTO LIST. The one file you edit to change the
                      hero mosaic pool
js/mosaic.js          <photo-mosaic> — the hero wall: slideshow, light
                      sweep, cursor light
js/photo-slot.js      <photo-slot> — read-only image frame (flags, card logos)
js/globe.js           the hero globe: projection math, coastlines, flight
                      route, drag/inertia, hover lighting, click-to-focus
js/terminal.js        terminal command table — add commands here
js/support.js         rendering runtime — do not edit
assets/photos/        your photos (see the README in there)
assets/logos/         company / school marks (see the README in there)
assets/font-awesome/  icons (socials, resume download, scroll hints)
js/image-slot.js      UNUSED — the old drag-and-drop authoring component.
                      Nothing loads it any more; safe to delete
```

## Photos — how they work now

**Every image on the site is a file in this repo.** There is no upload path,
for you or for a visitor: no file input, no drop target, no click handler on
any image. Nothing a visitor does can change what anyone sees.

(The previous `<image-slot>` component accepted a drag-and-drop, which was an
authoring convenience that only worked inside the preview runtime. On a
deployed site it would have let a visitor swap an image **in their own
browser tab only** — nothing shared, nothing saved, gone on reload — but it
also showed them a "browse files" affordance, which is not what you want on a
portfolio. It's gone.)

Three places take images:

| what | where the filename lives |
| ---- | ------------------------ |
| hero mosaic | the `mosaic` list in `js/photos.js` |
| city flags         | `assets/flags/` — see the README there              |
| company logos | `src` on the six `<photo-slot class="jos-logo">`s in card headers |

Drop the files into `assets/photos/` and `assets/logos/` — those folders have
their own READMEs with the exact filenames and sizes. **A missing file
renders a dashed placeholder showing the path it wants**, so you can add them
one at a time without the layout ever breaking.

## The hero mosaic

`<photo-mosaic>` runs three things on one number per tile per frame:

- **slideshow** — one tile every ~2.3s crossfades to the next photo in the
  pool, so the wall turns over continuously and never in lockstep
- **sweep** — a light front crosses left→right over ~5.4s, rests 1.8s, and
  comes again. It's sheared by row and bent by a slow sine, so it arrives as
  a leaning, breathing wave rather than a ruled line. A narrow bright core
  rims the tile it crosses in accent blue; a wide soft glow trails behind it
  and does most of the lifting
- **cursor light** — the same response follows the pointer, so the cursor
  reads as a handheld version of the sweep. (This is why the tiles have no
  CSS `:hover` — hover and sweep are one channel, combined per frame.)

Tuning constants are grouped at the top of `js/mosaic.js`: `SWEEP`/`GAP` for
how long a pass takes and how long the wall rests between passes,
`SHEAR`/`WAVE` for the shape of the front, `CORE`/`BODY` for its width,
`SWEEP_MAX` for how far the sweep alone lifts a tile, `REACH` for the cursor
radius, `SWAP_MS` for the slideshow rate.

## Responsive

Two layouts, one breakpoint at **1100px**.

**Above 1100px** the flight path keeps its designed geometry — cards
absolutely positioned in a 1200×1860 stage sharing coordinates with the SVG
route. Between 1100 and 1260 the stage is scaled down *whole* by
`layoutStage()` rather than reflowed, so the composition survives; the route
draw divides by that scale when it maps viewport-y onto the path.

**Below 1100px** the geometry can't hold, so the stage becomes a plain flex
column: the SVG route and its lat/long callouts drop out, an accent rail down
the left carries the path idea, and every block is re-sorted newest→oldest
via `[data-m]` (DOM order is oldest-first, which is right for the drawn route
and wrong for a column). Adding a stop means giving it a `data-m` too.

The hero fits any viewport at any zoom: `layoutHero()` measures what the
non-globe parts of the column actually come to and gives the globe the rest,
so the shell's bottom border always clears the fold. It re-runs on resize and
once webfonts land. `globe.setSize()` scales radius, type and label offsets
together, so the globe is one shape at any width.

That makes the hero's padding, gaps and shell chrome a *budget the globe is
competing with* — which is why they're vh-relative clamps rather than fixed
px. Trim them and the globe grows by exactly that much; pad them out and it
shrinks. It maxes at 520px on a tall window.

Touch is handled, not just fitted:

- **the pointer layers only exist while a finger is down.** A mouse is always
  a pointer; a finger is one only while touching. On lift, the cursor, the
  glow and the mosaic's light are hidden and the pointer is parked
  off-screen — otherwise they stay burning wherever the last touch was.
  `cursor:none` is still limited to fine pointers, so a hybrid's real mouse
  cursor is never hidden.
- **the globe uses `touch-action:pan-y`**, so a vertical swipe scrolls past
  it while a sideways drag still spins it.
- **pin taps pick the city on `pointerup`** from the live pointer rather than
  the last hovered frame — a tap has no hover before it, and can land between
  two frames.

Below 700px the mosaic rebuilds itself as 3×6 instead of 7×4; 28 tiles on a
phone are stamps, not photographs.

## Flight-path city labels

Each stop's name sits **30px from its dot, vertically centred on it**, on the
side its node faces. That's the whole rule — `.jos-city--l` / `.jos-city--r`
in the stylesheet do the alignment via `translate(-100%,-50%)` /
`translateY(-50%)`, so label width never enters into it and the two numbers in
each label's inline style are just the node's own coordinates ±30.

**Why 30 and not something tidier:** the route doesn't stop at a node, it
overshoots it. Within a label's own 14px-tall band the path runs up to 15px
past the node on the label's side, so anything under ~25px puts the line
through the type. 30 leaves at least 12px of clear air at every stop, and 30
at the two endpoints where the path terminates on the node.

If you move a node, move its label by the same delta and re-check clearance —
the curve's overshoot changes with the control points, not just the node.

Flags come from `assets/flags/` (see the README there) and always lead the
name, on both sides, so every label reads the same way round.

All eight nodes are labelled. Boston appears three times because three
separate stops are in Boston (Roomform, Red Hat, BU) — that's the path being
honest, not a duplication bug.

**Labels are hidden below 1100px** (`.jos-stage>span{display:none}`) along with
the whole SVG route — the stacked mobile layout has no curve to label, and each
card names its own city in its window title.

## Theming

Every colour goes through CSS custom properties defined in one place — the
`:root` and `[data-theme="light"]` blocks at the top of `index.html`. Flip
the attribute and the whole site re-skins, canvas globe included (it reads
`--accent-rgb` / `--ink-rgb` on each theme change).

`js/theme.js` loads in the real `<head>` so the theme resolves *before* first
paint — no dark flash on a light-mode reload. It prefers a saved choice, then
the OS setting, then dark, and keeps following the OS until the visitor picks
a side with the status-bar toggle.

To reskin, edit those two token blocks and nothing else.

## Editing guide

- **Resume link** — search `YOUR_RESUME_LINK` in `index.html` (2 places:
  status bar + contact section) and paste your Google Drive share URL.
- **Copy / resume content** — the card divs in `index.html`; each has an
  OS-window header (`munich.kyrall`, `boston.bu`, …) and an `id="stop-…"`
  anchor used by the globe's "open chapter" links.
- **Terminal commands** — `js/terminal.js`, one key per command.
- **Cities / route / focus blurbs** — `CITIES` and `ROUTE` at the top of
  `js/globe.js` (`desc`/`href` feed the click-to-focus HUD).
- **Adding a timeline stop** — see the comment above the `#story` section
  in `index.html` (path, node circle, card, one `[x,y]` entry — and a
  `data-m` so the mobile column knows where it sits).
- **Scroll feel** — tuning constants live in `updateScroll()` in
  `index.html`: entry distance (170), settle window (vh * .38), and the
  mid-viewport pin (vh * .5) for the route tip. The nav's flight speed is
  in `glideTo()` just above it.

## Interactions cheat-sheet

- Globe: hover = light + city lock-on · drag = spin/tilt · click a pin =
  zoom + chapter card ("open chapter" flies to the timeline) · Esc releases.
- Nav: status-bar links ease the page to their target instead of jumping;
  "open chapter" lands its card dead-centre in the viewport (any anchor with
  `data-center` does). Any scroll, touch, or keypress hands control back.
- Terminal: `help`, `whoami`, `where`, `next`, `work`, `play`, `resume`,
  `contact`, `ls`, `clear` (+ a couple of easter eggs).
- Timeline: route draws pinned to mid-screen; cards slide in from their
  side of the page; the card logos colourize on hover.
- Status bar: the theme toggle names the mode it will switch you to.

## Deploy on GitHub Pages

1. Push these files to your repo's `main`.
2. Settings → Pages → Source: `main` / root.
3. (Optional) add a `CNAME` file with your custom domain.

Notes:
- Coastlines load at runtime from the pinned `world-atlas` CDN
  (Natural Earth data, public domain); the globe degrades gracefully offline.
- ES modules require http(s) — use Pages or any local server, not `file://`.
- Works from 320px up; no horizontal scroll at any width.
