/**
 * terminal.js — command table for the hero shell.
 *
 * The shell UI lives in index.html; this module is just content.
 * To add a command: add a key here and (optionally) list it in `help`.
 *
 * respond(input) → string reply, or the symbol string '\u0000CLEAR'
 * (exported as CLEAR) when the screen should be wiped.
 */

export const CLEAR = '\u0000CLEAR';

export const COMMANDS = {
  help:    "commands: whoami · where · next · work · fun · resume · contact · ls · clear",
  whoami:  "jack — engineer · founder · artist/dj · athlete",
  where:   "toronto → munich. spin the globe and see.",
  next:    "kyrall @ munich — new thread spawning",
  work:    "bu boas.lab → gm → red hat → roomform → kyrall — scroll ↓ for the flight path",
  fun:    "producing & dj'ing · rugby · guitar · learning",
  resume:  "hit the resume button in the status bar — pdf incoming",
  contact: "jackedelist@gmail.com — socket open",
  ls:      "story/  logs/  contact/",
  sudo:    "nice try.",
  cd:      "no place like ~",
};

/** First word of the input picks the command; unknown → gentle error. */
export function respond(input) {
  const c = input.toLowerCase().split(/\s+/)[0];
  if (c === 'clear') return CLEAR;
  return COMMANDS[c] || `command not found: ${c} — try 'help'`;
}
