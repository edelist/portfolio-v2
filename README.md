# ~/jack — personal site (v2)

Interactive wireframe globe with click-to-focus zoom, typeable terminal,
scroll-drawn flight-path timeline, a border-to-border photo wall that
crossfades and catches a passing light, custom cursor. Light and dark.

## File map

```
site.webmanifest      PWA manifest (name, icons, theme colours)
robots.txt            crawl policy + sitemap pointer
sitemap.xml           one URL; update if the site ever gets more pages
index.html            page markup + the page controller:
                      theme tokens · custom cursor · Munich clock · scroll
                      system (route draw pinned to mid-viewport + sideways
                      card reveal) · smooth in-page navigation · wiring for
                      globe, mosaic & terminal · focus HUD
js/theme.js           light/dark switch — runs in <head>, before first paint
js/photos.js          THE PHOTO LIST. The one file you edit to change the
                      hero mosaic pool
js/mosaic.js          <photo-mosaic> — the hero wall: panning belt, light
                      sweep, cursor light
js/photo-slot.js      <photo-slot> — read-only image frame (flags, card logos)
js/globe.js           the hero globe: projection math, coastlines, flight
                      route, drag/inertia, hover lighting, click-to-focus
js/terminal.js        terminal command table — add commands here
js/support.js         rendering runtime — do not edit
assets/photos/        your photos (see the README in there)
assets/logos/         company / school marks (see the README in there)
assets/thumbs/        log-card thumbnails (see the README in there)
assets/favicon.svg    THE mark — shell prompt on an accent tile; edit this one
assets/favicon.ico    …and re-export the rasters to match (favicon-16/-32,
assets/og.png         apple-touch-icon, icon-192/-512). og.png is the 1200×630
                      social card.
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
| log thumbnails | `src` on the `<photo-slot>` inside each `.jos-log-shot` |

Drop the files into `assets/photos/` and `assets/logos/` — those folders have
their own READMEs with the exact filenames and sizes. **A missing file
renders a dashed placeholder showing the path it wants**, so you can add them
one at a time without the layout ever breaking.

## About saving the images

The photos aren't protected and can't be. A browser has to download an image
to display it, so by the time a visitor sees the wall the file is already on
their disk — reachable from DevTools, the network panel, the cache, or a
screenshot. Anything a page does about this is a speed bump, not a lock.

What the site does do is remove the one-click path: the `<img>` elements in
`<photo-mosaic>` and `<photo-slot>` carry `pointer-events:none`, so the hit
target is the element behind them and a right-click offers the ordinary page
menu instead of "Save image as", plus `-webkit-user-drag:none` so an image
can't be dragged out to the desktop. This is free here because nothing on the
wall is hover-driven — the cursor light reads the pointer's coordinates, not
events on the tiles.

Deliberately NOT done: blocking `contextmenu` across the page. It breaks
back/forward, open-in-new-tab, copy and spellcheck for every visitor, it is
trivially bypassed, and it announces the intent far more loudly than it
enforces it. If the photos genuinely must not circulate, the options that
actually work are serving them visibly watermarked, or at a resolution too low
to be worth taking.

## The hero mosaic

`<photo-mosaic>` runs three things on one number per tile per frame:

- **pan** — the whole wall is one belt sliding steadily left→right, ~14s per
  column, like a sheet drawn across the screen. It's built one column wider
  than it needs and rests one column left of the frame; a column that has
  cleared the right edge wraps round to the front and is refilled, so the pan
  never ends and photos only ever change off-screen. Refills keep duplicates apart — a tile never repeats the photo
  above it or the one level with it in the next column, so the same picture is
  never visible twice side by side
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
radius, `PAN_MS` for how long the belt takes to advance one column.

Because the tiles move, each one's horizontal position is recomputed every
frame from its column's place on the belt, not fixed at build time — the sweep
and the cursor light both read it fresh.

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

### Nodes live on the curve's turning points

This is load-bearing, not decoration. Every node sits where the curve doubles
back — where it is momentarily vertical and therefore covers the least
horizontal distance inside a label's 14px band. Measured, the eight nodes need
gaps of 15 · 30 · 31 · 29 · 30 · 30 · 30 · 15 px. *That* is where the 30 comes
from.

Between two turning points the curve runs flat, and a label there needs 34–54px
to clear it — at the midpoint of a segment, 54. **So you cannot drop a stop
part-way along the spine and keep the label rule.** A new entry either branches
off an existing node (what `sites.bu.edu/boas` does) or gets a turning point of
its own.

### Adding a stop to the spine

`fortune` was added this way. The catch is that turning points **alternate**
left/right, so inserting one would flip the side of every node below it and
force a full re-layout. Insert a **pair** instead — one segment becomes three:

```
…250,560  C90,650 660,690 830,740     ← new right extremum = the new stop
          C1000,850 420,860 250,920   ← new left extremum, a plain bend, no node
          C90,990 660,1030 830,1100   ← the old next node, now 270px lower
```

Parity is preserved, so every node below keeps its side and only moves down by
the added height. Everything below the insertion — cards, leaves, labels,
connector lines, node circles — shifts by that same delta, and the SVG height,
its viewBox and the stage height grow with it.

Two things that bit me doing it:

- **Labels match `left:…px;top:…px` too.** A blanket regex over that pattern
  shifts them along with the blocks; shifting labels separately as well moves
  them twice.
- **Check the new node's required gap before building on it.** Reshaping a
  segment changes the curve at *both* ends — the first attempt pushed Red Hat's
  requirement from 31 to 36px. Tuning the control points brought it back to
  31/30/29, keeping the 30px rule intact.

The stage's height is read from its inline style by `layoutStage()` and scaled;
it is deliberately **not** duplicated in the script (it used to be, and the copy
silently overrode the markup the moment the stage grew). It parses the inline
attribute rather than `getComputedStyle`, because below 1100px the stylesheet
forces `height:auto`, so the computed value there is the content height, not the
design height.

Flags come from `assets/flags/` (see the README there) and always lead the
name, on both sides, so every label reads the same way round.

All nine nodes are labelled. Toronto appears twice (Roomform, UCC) and Boston
three times (Red Hat, Fortune, BU) — which is the path being honest, not a
duplication bug.

## Branches off a node

The BOAS card and three leaves (`rugby`, `pep.band`, `tke`) hang off the BU
node; four hang off the high-school node (Camp Arowhon first, then Sports,
Music, Boarding); `hockey` hangs off Hong Kong. A leaf's logo is optional —
several carry none.

Branches are ordinary absolutely positioned blocks joined to their node by an
`<svg><line>`. `sonder.ground` and the two leaves under it (`Big Night
Entertainment`, `Red Bull USA`) all hang off Fortune's node this way — the leaf
lines run *behind* the cards above them and only their tails show, which is the
same trick the BU cluster uses.

**Links.** Card window titles (`a.jos-win-t`) and leaf names (`a.jos-leaf-n`)
can both be links — 8 and 6 of them are. All use `target="_blank"` with
`rel="noopener noreferrer"`. Titles keep `.jos-win-t`, so a long one still
ellipsizes instead of pushing the date out of the header. `roomform.ai`,
`hongkong.sar`, `manhattan.nyc`, `tellura.pub` and `tke.dodgeball` stay plain
text — they're labels, not addresses.

**Leaves are styled entirely by `.jos-leaf`** — position is the only thing
inline. They carry the same affordances as a full stop, which is deliberate:

| carried over | why |
| --- | --- |
| `data-hot` | the custom cursor ring locks on, same as a card |
| hover border lift | via `style-hover`, same accent and `.25s` transition |
| `.jos-card` | gives the light-mode shadow **and** `.jos-card:hover .jos-logo`, so a leaf's logo colourizes like a card's |

Deliberately *not* carried over: the traffic-light dots and an `#id` anchor,
which belong to an actual stop the globe can link to, and the full fly-in
distance (leaves use `data-fly=".55"` so they settle before their parent).

Two traps:

- **A connector line that passes behind a leaf is fine** — leaves are DOM
  elements with an opaque fill painted over the SVG, so the line is occluded.
  Don't contort the layout to avoid crossings.
- **Heights are not what the markup suggests.** Cards render 120–200px and
  leaves 42px depending on wrapping, so space them off measured boxes, not off
  the padding you wrote. Getting this wrong is silent — blocks just overlap.

## Text staying inside its box

Both nodes and leaves are hardened against overflow, including the
pathological case of a single unbroken string longer than the block:

- `.jos-leaf>span{min-width:0}` — without it a flex row refuses to shrink and
  the text overhangs the leaf rather than wrapping.
- `overflow-wrap:anywhere` on leaf text and on card `h3`/`p`.
- The card's window-title row is flex with the date pinned right, so only
  `.jos-win-t` may shrink (and ellipsizes); everything else is `flex:none`.
  Otherwise a long title squeezes the dots and pushes the date out.

There's a stress check worth re-running after editing copy: set any title or
body to a 68-character unbroken string and confirm `scrollWidth` never exceeds
`clientWidth` on the enclosing `.jos-card` / `.jos-leaf`.

**Labels are hidden below 1100px** (`.jos-stage>span{display:none}`) along with
the whole SVG route — the stacked mobile layout has no curve to label, and each
card names its own city in its window title.

## Log cards

The fifteen cards under `// logs — projects` take the window metaphor literally:
the thumbnail **is** the window's content pane, so the order is title bar →
screenshot → copy → action bar, which is where a real app puts each of them.

```
.jos-logs        the grid — auto-fill, so the column count is never authored
.jos-log         the card — a flex column, so the footer can sink
.jos-log-shot    16:10 thumbnail pane, full-bleed under the title bar
.jos-log-body    h3 + blurb
.jos-log-foot    action bar; margin-top:auto pins it to the bottom
.jos-log-cta     the button — résumé-style pill, prefixed with a `$` prompt
```

Five things worth knowing:

- **The grid floor is `minmax(min(340px,100%),1fr)`, and the `min()` is
  load-bearing.** A bare `minmax(340px,1fr)` floor is a *hard* minimum: on a
  320px phone the content box is 288px, the column stays 340, and every card
  overhangs by 52px. The page doesn't scroll — the wrapper's `overflow-x:hidden`
  clips it — so the failure is silent and just shears the right edge off every
  card. `min()` lets the floor collapse to the container. Measured at 320 ·
  390 · 900 · 1280: 1 · 1 · 2 · 3 columns, zero overhang at each.
- **`margin-top:auto` on the footer is what aligns the CTAs.** The blurbs are
  different lengths; without it each button sits wherever its own text ends
  and the row looks ragged. Grid rows stretch, so every card in a row is the
  same height and the buttons land on one line. Verified at all four widths.
- **The rest state greys the thumbnail** (`grayscale(.55)`, 82% opacity) and
  hover clears it — the same greyscale→colour reveal the card logos use. The
  filter sits on the `<photo-slot>`, **not** on `.jos-log-shot`, or it would
  desaturate the accent sweep painted over it too.
- **The sweep is an `animation`, not a `transition`.** `josSweep` runs the
  mosaic's light front across the shot once on hover-*in*; a transition would
  sweep back out again on hover-out, which reads as a glitch. The
  reduced-motion block at the foot of the sheet already neutralises it.
- **These cards hover in CSS, not via `style-hover`.** Three things move on
  one hover (border, thumbnail, sweep) and two need a pseudo-element, so
  splitting it across both mechanisms would be worse than picking one.

A missing thumbnail renders `<photo-slot>`'s dashed placeholder at the right
size, captioned with the path it wants — the section ships before the images
do, which is the state all fifteen are in now. Sizing rules and the filename
table are in `assets/thumbs/README.md`.

### Order is reverse-chronological, and DOM order *is* page order

Newest at the top, sorted by **end** date then start date. The grid places
cards in document order, so unlike the timeline — which re-sorts itself on
mobile via `[data-m]` — there is no ordering attribute here to keep in sync.
**Adding a card means inserting it at the right date, not appending it.**

Each card shows only its **end date** — when the project finished — not a
range, so `Dec 2024` rather than `Sep–Dec 2024`. That is what the sort is on,
so the column reads straight down. Six cards now share `Dec 2022`; ties are
ordered by hand and mean nothing.

The timeline cards above are unaffected and keep their ranges (`Sep 2022 – Sep
2024`, `2017–2021`) — those are tenures, not projects.

The date column got wider when ranges replaced single months, which is worth
knowing because `.jos-win-t` is the only part of that header row allowed to
shrink. Checked at 1280 and 320: no title ellipsizes and no date wraps, but
that's the thing a longer date eats into.

### A language line under the heading

Ten cards carry a mono accent line between the `h3` and the blurb — `Python`,
`C`, `Verilog`, `SwiftUI` and so on. It reuses the pattern the Fortune and
Roomform timeline cards already use for their org name, so it costs no new
CSS. Cards with no language given (`tellura.pub`, `tke.dodgeball`, `alu.v`,
`sevenseg.drv`, `roomform.ai`) simply omit the span.

### Every CTA now points somewhere real

All twelve supplied GitHub URLs were checked and return 200. Nothing in the
section is a placeholder any more.

Four cards are worth knowing about:

- **`threads.lib` carries two CTAs** — `threading lib` and `tls`. The library
  and the thread-local-storage extension are separate repos, so the footer is
  `flex-wrap` and holds two pills. They fit on one line down to 320px; the
  wrap is insurance, not a layout in use.
- **`bike.light` and `roomform.ai` aren't repos** — both point at Drive
  product videos, so their labels read `watch demo` rather than `view source`.
- **`gopher.app` uses the canonical `/Gopher` repo URL.** An older spelling
  of the name still 301s to it; don't reintroduce it, here or in the markup.
  Following a redirect on every click is worse than pointing at the real name.
- **`tke.dodgeball` points at the St. Jude team page**, so its label is
  `view fundraiser`.

### No em dashes in the descriptions

The card blurbs are written without them, deliberately. If you edit copy, keep
that. Note this applies to the descriptions, not to the en dashes in date
ranges (`Sep–Dec 2024`) or page numbers (`8–29`) — those are a different
character and must stay.

Section headings elsewhere on the page still use em dashes (`// logs —
projects`, the footer line, the terminal greeting); they were left alone as
chrome rather than description.

## If you ever need to gate the site again

There was a password curtain here (`js/gate.js`) and it has been removed. Worth
recording why it was never security, in case the idea comes back: GitHub Pages
serves static files with no server-side auth, so the browser receives the
entire page *before* any script runs. `curl`, View Source, and disabling
JavaScript each returned the whole site with the prompt up. The only part that
genuinely worked was `noindex` + `Disallow: /` keeping it out of search
results.

So a client-side curtain is the right tool for "not ready to show yet" and the
wrong tool for anything confidential. If a real gate is ever needed, only these
actually withhold the content:

- **Take it down** — remove `CNAME` / disable Pages. Total, instant, free.
- **Cloudflare Access** — put the domain behind Cloudflare and require an email
  one-time-pin or Google login. Free tier covers a personal site, and it
  authenticates at the edge, so the HTML never reaches an unauthorised visitor.
- **A host with built-in protection** — Netlify and Vercel both offer
  password-protected sites on paid plans, enforced server-side.

## The site does not depend on a CDN

`js/support.js` renders the whole page and throws if React is missing, so
anything that stops React loading gives a **blank page, not a degraded one**.
It ships pointing at unpkg.com; a CDN outage, a corporate network that blocks
public CDNs, or a region that cannot reach unpkg would all have taken the site
down. That is the wrong failure mode for the one link you hand to a recruiter.

React and ReactDOM are therefore served from `js/vendor/` (144KB). The wiring
is a `window.__resources` map in the real `<head>`, above the runtime script.
That is the runtime's **own** override hook — `cdnScriptFor()` consults it
before falling back to the CDN — so `js/support.js` stays untouched, which
matters because it is generated and marked do-not-edit.

The vendored files are the byte-identical unpkg builds; each was checked
against the SRI hash `support.js` pins before being committed:

```
openssl dgst -sha384 -binary js/vendor/react.production.min.js | openssl base64 -A
```

**If the pinned React version in `support.js` ever changes**, the map keys no
longer match, the runtime silently goes back to unpkg, and you lose this
protection without any visible symptom. Re-download to match and update both
the URLs and the files together.

Babel is deliberately *not* vendored: ~3MB, and only fetched for jsx
`x-import`s, which this page has none of. It still points at unpkg, unused.

Google Fonts is still a third-party request. It cannot carry SRI (the CSS it
returns varies by user agent), and a failure there costs a webfont, not the
page, so it is left alone.

## Metadata, favicon & social cards

Title, description, canonical, theme-colour, icons, Open Graph, Twitter card
and a `Person` JSON-LD block all sit in the **real `<head>`** — deliberately
not in `<helmet>`.

**This is the load-bearing part.** `<helmet>` is injected by the runtime after
the page boots, and nothing that consumes these tags gets that far: iMessage,
Slack, Discord, X and LinkedIn fetch the raw HTML and never run JavaScript. An
`og:image` inside `<helmet>` is an unfurl that silently doesn't happen. Same
class of reason `js/theme.js` sits up there. Verified with `curl` — all 18
og/twitter tags and 4 icon links are in the raw response.

### The URL is the one thing to keep in step

Every absolute URL is `https://jedelist.com/`, the site's custom domain (set by `CNAME`).
If the domain ever changes, four places move together: the `<head>` block, `sitemap.xml`, `robots.txt`, and
the JSON-LD `url`/`image`.

**`og:image` must stay absolute.** A relative path does not unfurl on any
platform — this is the single most common way a social card silently breaks.

### The mark

The favicon is the shell prompt `>_` — the same brand as `~/jack` and the
blinking caret in the status bar — knocked out of an accent-blue rounded tile,
so it reads as an app icon and suits the OS-window theme.

The wireframe globe was the obvious candidate and is the wrong one: at 16×16
its three ellipses collapse into a fuzzy dot. Two thick strokes survive. Blue
also holds against light *and* dark browser chrome, which a near-black tile
doesn't.

`assets/favicon.svg` is the source of truth and the primary `<link>` — the
only one that stays sharp on a hidpi tab strip. The rasters exist because some
browsers skip SVG icons, and iOS/Android need PNGs:

| file | why |
| ---- | --- |
| `favicon.ico` | 16/32/48/64 multi-size fallback |
| `favicon-16.png`, `favicon-32.png` | explicit small sizes |
| `apple-touch-icon.png` | 180×180, opaque, no corner radius — iOS masks it itself |
| `icon-192.png`, `icon-512.png` | manifest; `purpose:"any maskable"`, so the mark is inset to the middle 80% safe zone |

**If you change the mark, change both** — the SVG and the rasters are separate
files with the same geometry, and nothing regenerates one from the other. The
icons were drawn at 8× and downsampled (Pillow's primitives aren't
antialiased); the numbers are normalised 0–1 coordinates in the SVG.

### The social card

`assets/og.png` is 1200×630, built with the site's real webfonts (Space Grotesk
+ JetBrains Mono) — window chrome, the mark, the name, the tagline. Scrapers
don't run JS, so nothing from the globe or the mosaic can appear in it; it has
to be a static image, which is why it's a purpose-made card rather than a
screenshot.

Re-cut it after changing the tagline or the name. Keep it under ~1MB (it's
60KB) and keep 1200×630 — the `og:image:width`/`height` tags declare it, and a
mismatch makes some platforms fall back to a small square card.

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

- **Site URL** — `jedelist.com` appears in `index.html`'s
  head (canonical, og:url, og:image, twitter:image, JSON-LD), in `sitemap.xml`
  and in `robots.txt`. If a custom domain lands, all three files change
  together — and `og:image` has to stay absolute or the card stops unfurling.
- **Instagram handle is inconsistent** — the hero socials link
  `instagram.com/jack_edelist`; the contact section and the JSON-LD `sameAs`
  link `instagram.com/_edelist`. One of the two is wrong; pick one and make
  all three agree.
- **Resume link** — 2 places in `index.html` (status bar + contact section).
  Use Drive's **direct-download** form, `uc?export=download&id=FILE_ID`, not
  the `/view?usp=sharing` URL Drive hands you — that one opens its preview
  page instead of downloading. Take `FILE_ID` from the share URL. These two
  links carry no `target="_blank"` on purpose: a download navigation would
  leave an empty tab behind. (An `<a download>` attribute can't help — it is
  ignored cross-origin.)
- **Dodgeball CTA** — search `YOUR_DODGEBALL_LINK` in `index.html`. That log
  card had no destination when it was built; the button is wired and waiting
  on a URL. If one never exists, drop that card's `.jos-log-foot` — the
  layout doesn't need it, it just loses the bottom bar.
- **Log card order** — newest-first by DOM order, so changing a date may mean
  moving the block. Every CTA is a live link; nothing is a placeholder.
- **Log thumbnails** — all fifteen are in. `unix-shell.jpg` is the weak one:
  267px of source in a 379px box, so it renders soft. See
  `assets/thumbs/README.md` for sizing and the crop/fit rule.
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
- Terminal: `help`, `whoami`, `where`, `next`, `work`, `fun`, `resume`,
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
