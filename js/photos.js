/**
 * photos.js — THE ONLY FILE YOU EDIT TO CHANGE PHOTOS.
 *
 * Everything visual on the site reads from here or from a plain `src`
 * attribute in index.html. Nothing on the deployed site accepts an upload
 * from a visitor: images are files in this repo, served like any other
 * asset. See README → "Photos".
 *
 * To add a hero-mosaic photo:
 *   1. drop the file into assets/photos/
 *   2. add its filename to the `mosaic` list below
 * Missing files are skipped silently, so a half-filled list still renders.
 *
 * Sizing guidance: mosaic tiles render around 170×230 CSS px and are
 * heavily dimmed, so ~600px on the long edge is plenty. Keep each file
 * under ~250KB — 28 tiles cycle through this pool and they all load.
 */
(function () {
  window.JACK_PHOTOS = {
    // Prefix applied to every bare filename in `mosaic`.
    base: './assets/photos/',

    // Hero mosaic pool. Tiles slowly cycle through this list, so the pool
    // can be much smaller than the 28 tiles on screen — 10–16 is a good
    // number. Order barely matters; tiles are offset from each other.
    mosaic: [
      'hero-01.jpg',
      'hero-02.jpg',
      'hero-03.jpg',
      'hero-04.jpg',
      'hero-05.jpg',
      'hero-06.jpg',
      'hero-07.jpg',
      'hero-08.jpg',
      'hero-09.jpg',
      'hero-10.jpg',
      'hero-11.jpg',
      'hero-12.jpg',
    ],
  };
})();
