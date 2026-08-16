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

## Timeline polaroids

These are referenced by name directly in `index.html`, so the filename must
match exactly:

| file              | where it appears        |
| ----------------- | ----------------------- |
| `hong-kong.jpg`   | HKG stop, 2003–2017     |
| `bu-rugby.jpg`    | BOS stop, 2021–2025     |
| `fortune-dj.jpg`  | Roomform stop, top left |

Frames are 180×140, so ~540×420 covers retina.

Until a file exists the slot shows a dashed placeholder with the path it is
looking for — so the layout never breaks while you're still collecting them.
