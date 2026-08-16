# assets/flags

The small flags beside each city name on the flight path. They render at
15×10 CSS px, so these are **deliberately simplified** — the point is that
they read as the right flag at thumbnail size, not that they're accurate
vexillology:

| file     | country   | simplification                                       |
| -------- | --------- | ---------------------------------------------------- |
| `de.svg` | Germany   | none needed — three bands                             |
| `us.svg` | USA       | 7 stripes, not 13; 8 dots for 50 stars                |
| `ca.svg` | Canada    | 11-point maple leaf reduced to a single flat path     |
| `hk.svg` | Hong Kong | bauhinia reduced to its five petals                   |

At 15px, 13 stripes work out to 0.77px each and turn to grey mush, which is
why `us.svg` uses 7. If you ever scale these up past ~24px, swap in proper
full-detail flags instead — the simplifications start to show.

## Swapping one out

Drop a replacement in with the same filename and it's picked up — they're
referenced by path from the `.jos-city` labels in `index.html`. Keep them
SVG and keep the 3:2 viewBox (`0 0 15 10`); `.jos-flag` sizes the box and
`fit="contain"` letterboxes anything that isn't 3:2 rather than cropping it.

National flag designs are not copyrightable, so these are free to use and
modify.

## Adding a country

Add the file here, then add `<span class="jos-flag">` with a `<photo-slot>`
to that city's label in `index.html` — copy any existing `.jos-city` line.
The flag always comes first, before the city name, on both left- and
right-hand labels, so every label reads the same way round.
