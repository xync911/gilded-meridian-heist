// The four screenshot scenes behind ?shot=cover|sneak|gem|escape. Each one places the real
// world into a staged moment — the thief, the guards and the cameras are all the game's own
// state, drawn by the game's own renderer — so the frame is what a real game looks like, and
// the same seed always gives the same frame.

import { SCREEN_PLAY } from './render.js';

function placeGuard(g, x, y, angle, state, suspicion) {
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.state = state;
  g.suspicion = suspicion;
  g.lastSeen = null;
  g.investigate = null;
  g.pause = 99;
}

function placeCamera(c, angle, sees) {
  c.angle = angle;
  c.sees = sees;
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Any other name stages the cover.
 */
export function stageShot(name, world) {
  const s = world.state;
  world.reset();
  const p = s.player;
  const [g1, g2, g3, g4] = s.guards;
  const [c1, c2, c3] = s.cameras;

  if (name === 'sneak') {
    // Early, quiet: the thief slips along the left wing while two cones cross ahead.
    p.x = 185;
    p.y = 615;
    p.angle = -Math.PI / 2;
    p.sneaking = true;
    placeGuard(g1, 560, 180, Math.PI / 2, 'patrol', 0);
    placeGuard(g2, 190, 420, Math.PI / 2, 'patrol', 0.12);
    placeGuard(g3, 1090, 470, Math.PI / 2, 'patrol', 0);
    placeGuard(g4, 640, 330, Math.PI, 'patrol', 0);
    placeCamera(c1, 1.15, false);
    placeCamera(c2, Math.PI - 1.0, false);
    placeCamera(c3, Math.PI / 2 + 0.5, false);
    s.alarm = 12;
    s.elapsed = 24;
    return { screen: SCREEN_PLAY };
  }

  if (name === 'gem') {
    // The grab: the thief lifts the Sun off its pedestal as a guard turns and the alarm spikes.
    p.x = 640;
    p.y = 205;
    p.angle = -Math.PI / 2;
    s.loot[0].taken = true;
    s.gemTaken = true;
    s.lootValue = 600;
    s.loot[1].taken = true;
    placeGuard(g1, 700, 180, Math.PI * 0.85, 'alert', 1);
    placeGuard(g2, 190, 300, 0, 'curious', 0.55);
    placeGuard(g3, 1090, 300, Math.PI, 'patrol', 0);
    placeGuard(g4, 560, 330, -Math.PI / 2, 'curious', 0.6);
    placeCamera(c1, 0.9, false);
    placeCamera(c2, Math.PI - 0.9, false);
    placeCamera(c3, Math.PI / 2, true);
    s.alarm = 72;
    s.message = 'THE SUN IS YOURS — RUN FOR THE EXIT!';
    s.messageT = 99;
    s.elapsed = 96;
    return { screen: SCREEN_PLAY };
  }

  if (name === 'escape') {
    // The getaway: lockdown, the gem in hand, smoke behind the thief, guards closing in.
    p.x = 640;
    p.y = 610;
    p.angle = Math.PI / 2;
    s.loot[0].taken = true;
    s.gemTaken = true;
    s.lootValue = 800;
    s.loot[1].taken = true;
    s.loot[2].taken = true;
    s.smoke.push({ x: 640, y: 520, t: 3 });
    s.smokeLeft = 1;
    s.coinsLeft = 1;
    placeGuard(g1, 560, 420, Math.PI / 2, 'alert', 1);
    placeGuard(g2, 420, 560, 0, 'alert', 1);
    placeGuard(g3, 860, 560, Math.PI, 'alert', 1);
    placeGuard(g4, 700, 480, Math.PI * 0.75, 'alert', 1);
    placeCamera(c1, 1.2, true);
    placeCamera(c2, Math.PI - 1.1, false);
    placeCamera(c3, Math.PI / 2 - 0.4, true);
    s.alarm = 91;
    s.message = 'LOCKDOWN — THEY ARE COMING FOR YOU';
    s.messageT = 99;
    s.elapsed = 142;
    return { screen: SCREEN_PLAY };
  }

  // cover: the signature frame — the thief crouched behind a case, a cone sweeping inches
  // away, a camera crossing, the gem glowing on its dais, the alarm already climbing.
  p.x = 470;
  p.y = 360;
  p.angle = -Math.PI / 2;
  p.sneaking = true;
  s.loot[1].taken = true;
  s.lootValue = 100;
  placeGuard(g1, 700, 180, 2.4, 'curious', 0.45);
  placeGuard(g2, 190, 470, Math.PI / 2, 'patrol', 0);
  placeGuard(g3, 1090, 380, -Math.PI / 2, 'patrol', 0);
  placeGuard(g4, 780, 430, Math.PI * 0.85, 'patrol', 0.2);
  placeCamera(c1, 1.05, false);
  placeCamera(c2, Math.PI - 0.95, false);
  placeCamera(c3, Math.PI / 2 + 0.55, false);
  s.alarm = 38;
  s.elapsed = 61;
  return { screen: SCREEN_PLAY };
}
