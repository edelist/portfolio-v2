# assets/thumbs

Project thumbnails for the **logs** section. Each one fills the content pane
of its card — the card is built to read as a screenshot of the thing, so the
image is the first thing under the title bar, not a decoration beside it.

Filenames are referenced directly in `index.html`, so they must match:

| file             | card            | have it? |
| ---------------- | --------------- | -------- |
| `tellura.jpg`    | `tellura.pub`   | no       |
| `dodgeball.jpg`  | `tke.dodgeball` | no       |

**A missing file is not a broken layout.** `<photo-slot>` renders a dashed
placeholder captioned with the path it wants, at the correct size, so the
section is shippable before either image exists — and you can add them one at
a time.

## Sizing

- **16:10, landscape.** The pane is `aspect-ratio:16/10` and the image is
  `object-fit:cover`, so anything else gets cropped from the centre. Crop it
  yourself if the middle isn't the part that matters.
- **~1000×625 is plenty.** The pane renders ~570×356 on a full-width desktop
  card and goes full-width below 1100px, where the two cards stack.
- **Keep each file under ~250KB**, same budget as the hero pool.
- Thumbnails sit at `grayscale(.55)` / 82% opacity until you hover the card,
  so **pick images that survive being desaturated** — one that reads only
  through its colour will look dead at rest. High contrast and a clear subject
  beat a busy screenshot.

## Adding a third log

Copy a `.jos-log` block in `index.html`, point `src` and `label` at a new file
in here, and add the row to the table above. Three cards in the flex row get
narrow on desktop — past three, give `.jos-logs` a wrap or a grid.
