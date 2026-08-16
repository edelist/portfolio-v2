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
    //
    // Names are hero-NN.jpg, zero-padded, one lowercase extension. That is a
    // convention, not a requirement — but it sidesteps a real trap: GitHub
    // Pages serves from a case-sensitive filesystem, so a stray 'IMG_1.JPG'
    // listed here as '.jpg' 404s in production while working fine in local
    // preview on macOS, which is not case-sensitive.
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
      'hero-13.jpg',
      'hero-14.jpg',
      'hero-15.jpg',
      'hero-16.jpg',
      'hero-17.jpg',
      'hero-18.jpg',
      'hero-19.jpg',
      'hero-20.jpg',
      'hero-21.jpg',
      'hero-22.jpg',
      'hero-23.jpg',
      'hero-24.jpg',
      'hero-25.jpg',
    ],
  };
})();
