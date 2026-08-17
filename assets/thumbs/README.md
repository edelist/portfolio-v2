# assets/thumbs

Project thumbnails for the **logs** section. Each one fills the content pane
of its card — the card is built to read as a screenshot of the thing, so the
image is the first thing under the title bar, not a decoration beside it.

Filenames are referenced directly in `index.html`, so they must match:

| file                        | card               | have it? |
| --------------------------- | ------------------ | -------- |
| `roomform.jpg`              | `roomform.ai`      | yes      |
| `dodgeball.jpg`             | `tke.dodgeball`    | yes      |
| `ansible-wrangler.jpg`      | `ansible.wrangler` | yes      |
| `vslam.jpg`                 | `vslam.3d`         | yes      |
| `audio-style-transfer.jpg`  | `melstyle.ai`      | yes      |
| `filesystem.jpg`            | `fs.impl`          | yes      |
| `threads.jpg`               | `threads.lib`      | yes      |
| `unix-shell.jpg`            | `unix.shell`       | yes      |
| `alu.jpg`                   | `alu.v`            | yes      |
| `sevenseg.jpg`              | `sevenseg.drv`     | yes      |
| `bike-light.jpg`            | `bike.light`       | yes      |
| `fpga-clock.jpg`            | `fpga.clock`       | yes      |
| `gopher.jpg`                | `gopher.app`       | yes      |
| `tellura.jpg`               | `tellura.pub`      | yes      |
| `pokemon.jpg`               | `pokemon.sim`      | **no**   |

**A missing file is not a broken layout.** `<photo-slot>` renders a dashed
placeholder captioned with the path it wants, at the correct size — which is
what `pokemon.sim` shows today.

## How these were normalised

The supplied files ranged from 200×200 to 2777×1857, aspect ratios from 0.92
to 3.50, and seven of them were PNGs carrying a `.jpg` extension. They were
converted to real progressive JPEGs at 16:10 under two different treatments,
because they are two different kinds of picture:

- **Crop** (`bike-light`, `tellura`, `unix-shell`) — photos, and anything
  already near 16:10. Centre-cropped to fill the pane.
- **Fit** (everything else) — diagrams, plots, logos and icons, letterboxed
  onto a matched background rather than cropped. **This is the important
  one.** `audio-style-transfer` is a 3.14:1 spectrogram and `ansible-wrangler`
  is 3.50:1; a centre crop to 16:10 throws away half the width, which for a
  plot or a schematic is the half carrying the information.

The letterbox colour is sampled from each source's own corners, so it's
invisible where the source already had a flat margin — white behind the
diagrams, black behind the Roomform logo, the BASH card's own charcoal.

**Transparent sources are flattened onto white, never onto the panel.** Five
of them (`alu`, `filesystem`, `threads`, `sevenseg`, `audio-style-transfer`)
are black line art on transparency. Flattened onto the card's dark panel they
would have disappeared entirely.

Nothing was upscaled beyond 2.2×, so the two 200×200 icons land at 512×320
rather than being stretched to mush.

## If you replace one

16:10, ~1000×625, under 250KB, and **it must survive being desaturated** —
the pane sits at `grayscale(.55)` / 82% opacity until you hover the card, so
an image that reads only through its colour will look dead at rest.

Drop a new file in at any aspect ratio and re-run the normalisation rather
than hand-cropping; the crop/fit rule is what keeps the wide ones legible.

## Two things worth knowing

**`unix-shell.jpg` is 267×167** — smaller than the 379px box it renders in,
so it is visibly soft, and worse on a hidpi screen. It's the only one below
1×. A larger source would fix it.

**Six are stock logos rather than artefacts of the work**: `ansible-wrangler`
(the Ansible mark), `filesystem` and `threads` (generic icons), `unix-shell`
(the BASH logo), `gopher` (a cartoon gopher), `dodgeball` (the St. Jude
mark). They're clean and they read, but the eight that *are* real output —
the ALU schematic, the FPGA board, the spectrogram, the SLAM point cloud, the
clock block diagram, the pickup wiring, the bike light on the bench, the
Roomform mark — are noticeably stronger in the grid. Screenshots of your own
work beat category icons here, because the card is already shaped like a
window.
