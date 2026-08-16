# assets/photos

Drop your photos in here as ordinary files and commit them. Nothing on the
site accepts an upload from a visitor — these files *are* the photos.

## Hero mosaic

**Dropping a file in this folder is not enough — it also has to be listed in
`js/photos.js`.** That list is the pool; the folder is just storage. A name in
the list with no file behind it leaves that tile empty, so you can fill the
wall a few photos at a time.

Names are `hero-NN.jpg` — zero-padded, one lowercase extension. That's a
convention rather than a requirement, but it sidesteps a real trap: GitHub
Pages serves from a case-sensitive filesystem, so a file actually named
`IMG_1.JPG` listed as `.jpg` will 404 in production while working perfectly in
local preview on macOS, which is not case-sensitive. Keeping every name in one
shape means never hitting it.

- ~600–900px on the long edge is plenty (tiles render ~197×215 and are dimmed)
- keep each file under ~150KB — **the whole pool loads, eagerly, on first
  paint**, because this wall is the hero background and above the fold
- landscape or portrait both work; tiles crop to fill

The 25 photos currently in the pool are straight off a camera or phone —
12.9 MB total, averaging 517 KB each, some 3000px+ wide for a 197px tile.
That is the single heaviest thing on the site by a wide margin. Resizing the
long edge to 900px at JPEG quality ~82 typically brings the pool to 2–3 MB
with no visible difference at this size.

## Timeline polaroids — removed

The three polaroids that sat beside the flight path (`hong-kong.jpg`,
`bu-rugby.jpg`, `fortune-dj.jpg`) were taken out. Nothing references those
filenames any more, so dropping the files back in does nothing on its own —
you'd re-add the `<photo-slot>` blocks in `index.html` too.

Worth knowing if you bring them back: the left-hand polaroid positions
overlapped the city labels on the route (`hong-kong.jpg` ran 52px into the
HONG KONG label). Either place them clear of the labels' 30px lane beside
each dot, or move the labels.
