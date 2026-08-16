# assets/logos

Company / school marks that sit in the header of each timeline card, next to
the traffic-light dots. They render at 15×15, greyscale, and colourize when
you hover the card they belong to.

Filenames are referenced directly in `index.html`, so they must match:

| file                        | card              |
| --------------------------- | ----------------- |
| `kyrall.svg`                | `munich.kyrall`   |
| `roomform.svg`              | `boston.roomform` |
| `red-hat.svg`               | `boston.redhat`   |
| `general-motors.svg`        | `detroit.gm`      |
| `boston-university.svg`     | `boston.bu`       |
| `upper-canada-college.svg`  | `toronto.ucc`     |

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
