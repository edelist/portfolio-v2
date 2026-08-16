# assets/logos

Company / school marks. On a card they sit in the header next to the
traffic-light dots; on a leaf they sit at the left of the row. Either way they
render at 15×15, greyscale, and colourize when you hover the block they're in
— leaves included, since they carry `.jos-card` for exactly that.

Filenames are referenced directly in `index.html`, so they must match:

| file                        | where                          | have it? |
| --------------------------- | ------------------------------ | -------- |
| `kyrall.svg`                | `kyrall.com` card              | yes      |
| `roomform.svg`              | `roomform.ai` card             | yes      |
| `red-hat.svg`               | `redhat.com` card              | yes      |
| `general-motors.svg`        | `gm.com` card                  | yes      |
| `boston-university.svg`     | `bu.edu` card                  | yes      |
| `upper-canada-college.svg`  | `ucc.on.ca` card               | yes      |
| `bu-rugby.svg`              | `rugby` leaf                   | yes      |
| `bu-pep-band.svg`           | `pep.band` leaf                | yes      |
| `tke.svg`                   | `tke` leaf                     | yes      |
| `camp-arowhon.svg`          | `arowhon.guitar` leaf          | yes      |

Four leaves carry no logo by choice — `Sports`, `Music`, `Boarding` and
`Hockey` — as does the BOAS card.

If you do add one later, the slot markup is a `<span class="jos-logo">` with a
`quiet` `<photo-slot>` inside; copy any existing leaf's. `quiet` means a
missing file collapses the logo *and the gap beside it*, so a reference
without a file is never a broken state.

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
