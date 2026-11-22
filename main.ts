// GILDED — The Meridian Gallery Heist: the program that hands the game in.
//
// It copies game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored make.fun
// library. Node 22, standard library only. The game itself is plain static files
// a desktop browser loads offline: game/index.html and the ES modules it loads,
// no library and no network request.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where the game lives (beside this file) and where the grader wants it.
const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The playable game is plain static files, so the first thing to check is that
// its front door exists; without index.html there is nothing to hand in.
const gameDir = join(here, 'game');
if (!existsSync(join(gameDir, 'index.html'))) {
  throw new Error('GILDED: game/index.html is missing, nothing to hand in');
}

// Screenshots are real renders of the game's own code, taken by its maker;
// the first by name is the cover. Hidden files never count as screenshots.
const shotsDir = join(here, 'screenshots');
const shots = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith('.'))
  : [];

mkdirSync(out, { recursive: true });
cpSync(gameDir, join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (shots.length > 0) cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The dossier is what the judge reads: the screenshots plus a text of the source,
// written by the kit's library from the files just copied. Its caps are the
// scorer's own (reference/gate.json): only text_max_bytes shapes the bytes, the
// rest refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files in game/ or 48 MiB of game files, in all, or
// a path under game/ over 1000 bytes: game/ counts beside /output's own
// 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`GILDED handed in: ${shots.length} screenshot(s), dossier at ${join(out, 'dossier.json')}`);
