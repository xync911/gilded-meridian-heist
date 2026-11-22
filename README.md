# GILDED — The Meridian Gallery Heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/xync911/gilded-meridian-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/xync911/gilded-meridian-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A complete top-down stealth heist game that runs offline in a desktop browser from
static files. One thief, four patrolling guards, three sweeping cameras, one priceless
gem — the Sun of Meridian — and an alarm meter that decides whether the night ends in
a clean getaway or a lockdown.

## Play

- **WASD / arrows** — move. **Shift** — sneak (slower, harder to spot).
- **Space** — grab loot when close. **Q** — smoke pellet (2). **C** — toss a coin
  to distract a nearby guard (3). **P** — pause. **M** — mute.
- Read the vision cones before you move: a guard's `?` means it is getting
  suspicious, `!` means it has seen you. Cameras sweep on their own. If the alarm
  meter fills, the whole gallery hunts you.
- Steal the Sun of Meridian from its dais, then reach the green EXIT door. Side
  loot (a portrait, a golden bust, a vase) pays $100 each; a fast, quiet getaway
  pays a bonus.

## Files

- `game/` — the playable game (plain HTML + ES modules, no libraries, no network).
- `screenshots/` — four real renders of the game's own code.
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output`
  and writes `/output/dossier.json` with the kit's `buildDossier`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

An entry for make.fun's "Make the best heist game" bounty. Original art, sounds
(synthesised Web Audio), names and level — nothing copied from a commercial game.
