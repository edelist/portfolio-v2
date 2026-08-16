# assets/logos

Company / school marks that sit in the header of each timeline card, next to
the traffic-light dots. They render at 15×15, greyscale, and colourize when
you hover the card they belong to.

Filenames are referenced directly in `index.html`, so they must match:

| file                        | where                          | have it? |
| --------------------------- | ------------------------------ | -------- |
| `kyrall.svg`                | `kyrall.com` card              | yes      |
| `roomform.svg`              | `roomform.ai` card             | yes      |
| `red-hat.svg`               | `redhat.com` card              | yes      |
| `general-motors.svg`        | `gm.com` card                  | yes      |
| `boston-university.svg`     | `bu.edu` card                  | yes      |
| `upper-canada-college.svg`  | `ucc.on.ca` card               | yes      |
| `boas-lab.svg`              | `boaslab.org` card             | **no**   |
| `fortune.svg`               | `fortune.dj` leaf              | **no**   |
| `bu-rugby.svg`              | `rugby` leaf                   | **no**   |
| `bu-pep-band.svg`           | `pep.band` leaf                | **no**   |
| `tke.svg`                   | `tke` leaf                     | **no**   |
| `camp-arowhon.svg`          | `arowhon.guitar` leaf          | **no**   |

The six marked **no** are referenced but not in the repo yet. That is not a
broken state: those slots carry `quiet`, so a missing file collapses the logo
*and the gap beside it* — the row just reads without a mark. Drop the file in
with the matching name and it appears, no markup change.

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
