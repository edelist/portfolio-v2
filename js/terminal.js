/**
 * terminal.js — command table for the hero shell.
 *
 * The shell UI lives in index.html; this module is just content.
 * To add a command: add a key here and (optionally) list it in `help`.
 *
 * respond(input) → one of:
 *   a plain string                  print it
 *   CLEAR                           wipe the screen
 *   GOTO + selector                 print a line, then scroll there
 *
 * The two sentinels are actions rather than replies; the page handles them in
 * runCmd(). Everything else is just content, so adding a command means adding
 * a key to COMMANDS and (optionally) listing it in `help`.
 */

export const CLEAR = '\u0000CLEAR';
export const GOTO = '\u0000GOTO:';

/**
 * Directories `ls` advertises, and where each one goes. The shell prints
 * "story/  logs/  contact/" — so it has to be able to walk into them, or the
 * listing is a promise it doesn't keep.
 */
export const PLACES = {
  story:   '#story',
  logs:    '#logs',
  contact: '#contact',
};

export const COMMANDS = {
  help:    "commands: whoami · where · next · work · fun · resume · contact · ls · cd · clear",
  whoami:  "jack — engineer · founder · artist/dj · athlete",
  where:   "toronto → munich. spin the globe and see.",
  next:    "kyrall @ munich — new thread spawning",
  work:    "bu boas.lab → gm → red hat → roomform → kyrall — scroll ↓ for the flight path",
  fun:    "producing & dj'ing · rugby · guitar · learning",
  resume:  "hit the resume button in the status bar — pdf incoming",
  contact: "jackedelist@gmail.com — socket open",
  ls:      "story/  logs/  contact/   — cd into one, or ./story",
  sudo:    "nice try.",
};

/**
 * First word of the input picks the command; unknown → gentle error.
 *
 * Navigation is accepted in the two shapes the page already teaches: `./story`
 * (what the nav bar in the status bar is labelled) and `cd story` (what `ls`
 * implies). A bare `contact` stays the email command — it answers a question,
 * where `./contact` asks to be taken somewhere.
 */
export function respond(input) {
  const words = input.trim().toLowerCase().split(/\s+/);
  const c = words[0];
  if (c === 'clear') return CLEAR;

  // ./story
  if (c.startsWith('./')) {
    const p = c.slice(2).replace(/\/$/, '');
    return PLACES[p] ? GOTO + PLACES[p] : `no such directory: ${c} — try 'ls'`;
  }
  // cd story · cd story/ · cd ~ · cd
  if (c === 'cd') {
    const p = (words[1] || '').replace(/\/$/, '');
    if (!p || p === '~' || p === '/') return GOTO + 'TOP';
    const hit = PLACES[p.replace(/^\.\//, '')];
    return hit ? GOTO + hit : `cd: no such directory: ${p} — try 'ls'`;
  }
  return COMMANDS[c] || `command not found: ${c} — try 'help'`;
}
