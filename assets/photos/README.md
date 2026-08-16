# assets/photos

Drop your photos in here as ordinary files and commit them. Nothing on the
site accepts an upload from a visitor — these files *are* the photos.

## Hero mosaic

Filenames are listed in `js/photos.js` (`hero-01.jpg` … `hero-12.jpg` out of
the box). Add or rename entries there to change the pool. A name in the list
with no file behind it just leaves that tile empty, so you can fill the wall
a few photos at a time.

- ~600px on the long edge is plenty (tiles render ~170×230 and are dimmed)
- keep each file under ~250KB — the whole pool loads
- landscape or portrait both work; tiles crop to fill

## Timeline polaroids — removed

The three polaroids that sat beside the flight path (`hong-kong.jpg`,
`bu-rugby.jpg`, `fortune-dj.jpg`) were taken out. Nothing references those
filenames any more, so dropping the files back in does nothing on its own —
you'd re-add the `<photo-slot>` blocks in `index.html` too.

Worth knowing if you bring them back: the left-hand polaroid positions
overlapped the city labels on the route (`hong-kong.jpg` ran 52px into the
HONG KONG label). Either place them clear of the labels' 30px lane beside
each dot, or move the labels.
