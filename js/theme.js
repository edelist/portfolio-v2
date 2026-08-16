/**
 * theme.js — light/dark switch for the whole site.
 *
 * The page's colours are CSS custom properties defined in index.html's
 * <style> block: one set on :root (dark) and an override set on
 * [data-theme="light"]. Every colour in the markup goes through those
 * tokens, so flipping one attribute on <html> re-themes everything,
 * including the canvas globe (which reads --accent-rgb / --ink-rgb via
 * getComputedStyle on each theme change).
 *
 * This runs as a classic script in <head> so the attribute is set BEFORE
 * first paint — no dark flash on a light-mode reload.
 *
 * Order of preference: saved choice → OS setting → dark.
 *
 * API (window.jackTheme):
 *   get()          → 'dark' | 'light'
 *   set(t)         apply and remember
 *   toggle()       flip
 *   onChange(fn)   subscribe; returns an unsubscribe function
 */
(function () {
  const KEY = 'jack.theme';
  const root = document.documentElement;
  const subs = new Set();

  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (saved !== 'light' && saved !== 'dark') saved = null;

  const media = window.matchMedia && matchMedia('(prefers-color-scheme: light)');
  root.setAttribute('data-theme', saved || (media && media.matches ? 'light' : 'dark'));

  // Follow the OS while the visitor hasn't made an explicit choice.
  if (media && media.addEventListener) {
    media.addEventListener('change', e => {
      let s = null;
      try { s = localStorage.getItem(KEY); } catch (err) { /* ignore */ }
      if (s === 'light' || s === 'dark') return;
      root.setAttribute('data-theme', e.matches ? 'light' : 'dark');
      subs.forEach(fn => fn(root.getAttribute('data-theme')));
    });
  }

  window.jackTheme = {
    get() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; },
    set(t) {
      const v = t === 'light' ? 'light' : 'dark';
      root.setAttribute('data-theme', v);
      try { localStorage.setItem(KEY, v); } catch (e) { /* ignore */ }
      subs.forEach(fn => fn(v));
    },
    toggle() { this.set(this.get() === 'dark' ? 'light' : 'dark'); },
    onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
  };
})();
