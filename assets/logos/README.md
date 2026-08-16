# assets/logos

Company / school marks. On a card they sit in the header next to the
traffic-light dots; on a leaf they sit at the left of the row. Either way they
render at 15×15, greyscale, and colourize when you hover the block they're in
— leaves included, since they carry `.jos-card` for exactly that.

Filenames are referenced directly in `index.html`, so they must match:

| file                      | where                          | have it? |
| -------------------------| ------------------------------ | -------- |
| `bu-rugby.svg`           | `Men's Rugby` leaf             | yes      |
| `bu-pep-band.svg`        | `Pep Band` leaf                | yes      |
| `tke.svg`                | `Tau Kappa Epsilon` leaf       | yes      |
| `camp-arowhon.svg`       | `Camp Arowhon` leaf            | yes      |
| `upper-canada-college.svg`| `ucc.on.ca` card               | yes      |
| `boston-university.svg`  | `bu.edu` card                  | yes      |
| `fortune.svg`            | `4tune.vip` card               | yes      |
| `sonder-ground.svg`      | `sonder.ground` card           | yes      |
| `big-night.svg`          | `Big Night Entertainment` leaf | yes      |
| `red-bull.svg`           | `Red Bull USA` leaf            | yes      |
| `general-motors.svg`     | `gm.com` card                  | yes      |
| `red-hat.svg`            | `redhat.com` card              | yes      |
| `roomform.svg`           | `roomform.ai` card             | yes      |
| `kyrall.svg`             | `kyrall.com` card              | yes      |

No logo by choice: `manhattan.nyc`, `Hockey`, `hongkong.sar`, `Sports`, `Music`, `Boarding`, `sites.bu.edu/boas`, `tellura.pub`, `tke.dodgeball`.

## These files are far too big

They render at **15×15 px** but total ~2.9 MB — `boston-university.svg` alone is
1.2 MB, `roomform.svg` 688 KB. That is ~2.9 MB of page weight spent on marks
smaller than a favicon, all of it on the critical path for the timeline.

Worth running each through an SVG minifier (SVGO, or "Save as → optimised SVG"
in Illustrator/Figma). Most of the bulk is usually embedded raster data, editor
metadata, or thousands of path nodes describing detail that is invisible at
15px. If a mark will not reduce, a 32×32 PNG beats a 1 MB SVG comfortably —
change the extension in `index.html` to match.

Notes:

- **SVG preferred** — they're 15px on screen and need to stay crisp. A
  transparent PNG at 64×64 or larger works too; change the extension in
  `index.html` if you use one.
- **Square-ish marks only.** Use the logomark (the icon), not the full
  wordmark — a wide lockup squeezed into 15px is illegible. The slot uses
  `fit="contain"`, so it letterboxes rather than crops.
- **Transparent background**, or the mark will sit in a visible box.
- A missing file leaves a small dashed placeholder in the header rather
  than breaking the row, so you can add them one at a time.
- These are third-party trademarks. Using them to say where you worked is
  ordinary résumé practice; don't restyle or recolour them.

To add a logo to another card, copy the `<photo-slot class="jos-logo" …>`
line in that card's header in `index.html`.
