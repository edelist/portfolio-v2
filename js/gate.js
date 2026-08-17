/**
 * gate.js — a temporary "not ready yet" curtain over the site.
 *
 * READ THIS BEFORE TRUSTING IT.
 *
 * This is NOT security, and cannot be. GitHub Pages serves static files and
 * has no server-side auth, so the page's entire HTML is delivered to the
 * browser BEFORE this script runs. That means every one of these still works:
 *
 *   curl https://jedelist.com          -> the whole page
 *   View Source / DevTools             -> the whole page
 *   JavaScript disabled                -> no gate at all
 *
 * The password is stored as a SHA-256 hash rather than plaintext, which only
 * stops someone reading it out of this file at a glance. It does not protect
 * the content, because the content was never hidden in the first place.
 *
 * What this DOES do: stop a casual visitor who opens the URL from browsing
 * the site. That is the whole of it. If the content genuinely must not be
 * seen, take the site down or put real auth in front of it — see the README.
 *
 * Loads in the real <head>, before the runtime, so the curtain is up before
 * anything paints. Unlock lasts for the browser session (sessionStorage), so
 * a reload does not re-prompt but a new tab does.
 *
 * TO REMOVE THE GATE, three things go together:
 *   1. delete the <script src="./js/gate.js"> line in index.html
 *   2. flip <meta name="robots"> back to "index, follow" in index.html
 *   3. restore robots.txt to "Allow: /"
 * Search for GATE in those files to find all of them.
 */
(function () {
  var KEY = 'jack.gate.v1';
  // sha256("edelist")
  var HASH = '4503a67590e44f39ff03310fd1b8b29ac958dbc593c92373ac58afed901e894a';

  try {
    if (sessionStorage.getItem(KEY) === HASH) return;
  } catch (e) { /* storage blocked; fall through and prompt */ }

  // Hide the document immediately. Injected into <html> because <body> does
  // not exist yet at this point in the parse.
  var hide = document.createElement('style');
  hide.id = 'jos-gate-hide';
  hide.textContent =
    'body{visibility:hidden!important}' +
    '#jos-gate{visibility:visible!important}';
  document.documentElement.appendChild(hide);

  // The theme tokens live in the runtime's injected stylesheet, which has not
  // arrived yet, so the curtain carries its own copy of both palettes.
  var css = document.createElement('style');
  css.textContent = [
    '#jos-gate{position:fixed;inset:0;z-index:2147483647;display:flex;',
    '  align-items:center;justify-content:center;padding:24px;',
    '  box-sizing:border-box;background:#08090c;color:#e9edf2;',
    "  font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace}",
    '[data-theme="light"] #jos-gate{background:#eceef3;color:#14181f}',
    '#jos-gate .win{width:min(420px,100%);border:1px solid rgba(255,255,255,.12);',
    '  border-radius:10px;overflow:hidden;background:rgba(15,17,21,.96)}',
    '[data-theme="light"] #jos-gate .win{border-color:rgba(20,24,31,.12);',
    '  background:#fff;box-shadow:0 1px 2px rgba(20,24,31,.06),0 8px 24px rgba(20,24,31,.05)}',
    '#jos-gate .bar{display:flex;align-items:center;gap:8px;padding:8px 12px;',
    '  border-bottom:1px solid rgba(255,255,255,.07);font-size:11px;color:rgba(233,237,242,.5)}',
    '[data-theme="light"] #jos-gate .bar{border-color:rgba(20,24,31,.07);color:rgba(20,24,31,.5)}',
    '#jos-gate .dot{width:7px;height:7px;border-radius:50%;opacity:.8;flex:none}',
    '#jos-gate .body{padding:16px 14px;display:flex;flex-direction:column;gap:10px}',
    '#jos-gate p{margin:0;font-size:12px;line-height:1.6;color:rgba(233,237,242,.6)}',
    '[data-theme="light"] #jos-gate p{color:rgba(20,24,31,.6)}',
    '#jos-gate form{display:flex;gap:8px;align-items:center}',
    '#jos-gate .p{color:#79b0ff}',
    '[data-theme="light"] #jos-gate .p{color:#2a63c4}',
    '#jos-gate input{flex:1;min-width:0;background:transparent;border:none;outline:none;',
    "  color:inherit;font-family:inherit;font-size:13px;caret-color:#79b0ff}",
    '#jos-gate .err{font-size:11px;color:#ff5f57;min-height:14px}'
  ].join('');
  document.documentElement.appendChild(css);

  function sha256(s) {
    var enc = new TextEncoder().encode(s);
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      return Array.prototype.map
        .call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    });
  }

  function mount() {
    var g = document.createElement('div');
    g.id = 'jos-gate';
    g.innerHTML =
      '<div class="win">' +
      '  <div class="bar">' +
      '    <span class="dot" style="background:#ff5f57"></span>' +
      '    <span class="dot" style="background:#febc2e"></span>' +
      '    <span class="dot" style="background:#28c840"></span>' +
      '    <span>jack@edelist:~ — locked</span>' +
      '  </div>' +
      '  <div class="body">' +
      '    <p>This site is not public yet.</p>' +
      '    <form><span class="p">$</span>' +
      '      <input type="password" autocomplete="current-password"' +
      '             aria-label="Site password" placeholder="password" autofocus>' +
      '    </form>' +
      '    <span class="err" role="alert"></span>' +
      '  </div>' +
      '</div>';
    document.documentElement.appendChild(g);

    var input = g.querySelector('input');
    var err = g.querySelector('.err');
    input.focus();

    g.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      if (!(window.crypto && crypto.subtle)) {
        err.textContent = 'this browser cannot check the password';
        return;
      }
      sha256(input.value).then(function (h) {
        if (h !== HASH) {
          err.textContent = 'incorrect';
          input.value = '';
          input.focus();
          return;
        }
        try { sessionStorage.setItem(KEY, HASH); } catch (e2) { /* fine */ }
        g.remove();
        var s = document.getElementById('jos-gate-hide');
        if (s) s.remove();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
