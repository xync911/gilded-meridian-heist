// The game's rules and state, with no drawing and no browser in it: the thief, four patrolling
// guards, three sweeping cameras, the loot and the alarm meter. step() advances one fixed step
// and returns what happened as bit flags, so the caller can react without the world knowing
// about screens or sound. Nothing here allocates after createWorld returns.

import { ALARM, CAMERA, COIN, FIELD, GUARD, PLAYER, SCORES, SMOKE, TOOLS } from './config.js';

export const EVENT_GRAB = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_WIN = 8;
export const EVENT_SMOKE = 16;
export const EVENT_COIN = 32;
export const EVENT_GEM = 64;

// Rectangles that block movement and sight: the border (with the exit gap at the bottom) and
// the gallery's partitions. Display cases and pillars block too, listed separately.
export const WALLS = [
  { x: 0, y: 0, w: 1280, h: 28 },
  { x: 0, y: 692, w: 600, h: 28 },
  { x: 680, y: 692, w: 600, h: 28 },
  { x: 0, y: 0, w: 28, h: 720 },
  { x: 1252, y: 0, w: 28, h: 720 },
  { x: 340, y: 28, w: 28, h: 240 },
  { x: 912, y: 28, w: 28, h: 240 },
  { x: 28, y: 470, w: 180, h: 28 },
  { x: 1072, y: 470, w: 180, h: 28 },
];

export const CASES = [
  { x: 430, y: 250, w: 130, h: 70 },
  { x: 720, y: 250, w: 130, h: 70 },
  { x: 250, y: 380, w: 130, h: 70 },
  { x: 900, y: 380, w: 130, h: 70 },
  { x: 560, y: 420, w: 160, h: 60 },
];

export const PILLARS = [
  { x: 430, y: 140, r: 24 },
  { x: 850, y: 140, r: 24 },
  { x: 430, y: 560, r: 24 },
  { x: 850, y: 560, r: 24 },
];

export const DAIS = { x: 640, y: 130, r: 42 };
export const EXIT = { x: 600, y: 690, w: 80, h: 30 };

const LOOT_DEFS = [
  { id: 'gem', kind: 'gem', x: 640, y: 130, value: SCORES.gem, name: 'The Sun of Meridian' },
  { id: 'painting', kind: 'side', x: 150, y: 200, value: SCORES.side, name: 'Portrait of the Duchess' },
  { id: 'bust', kind: 'side', x: 1130, y: 200, value: SCORES.side, name: 'Golden Bust of Aurelius' },
  { id: 'vase', kind: 'side', x: 150, y: 600, value: SCORES.side, name: 'Ming Vase' },
];

const GUARD_DEFS = [
  { name: 'Marlow', x: 380, y: 180, waypoints: [{ x: 380, y: 180 }, { x: 900, y: 180 }] },
  { name: 'Iris', x: 190, y: 300, waypoints: [{ x: 190, y: 300 }, { x: 190, y: 580 }] },
  { name: 'Bram', x: 1090, y: 300, waypoints: [{ x: 1090, y: 300 }, { x: 1090, y: 580 }] },
  { name: 'Sable', x: 500, y: 330, waypoints: [{ x: 500, y: 330 }, { x: 780, y: 330 }, { x: 780, y: 520 }, { x: 500, y: 520 }] },
];

const CAMERA_DEFS = [
  { x: 60, y: 60, base: 0.9, sweep: 0.55, range: 0.55 },
  { x: 1220, y: 60, base: Math.PI - 0.9, sweep: 0.55, range: 0.55 },
  { x: 640, y: 66, base: Math.PI / 2, sweep: 0.45, range: 0.75 },
];

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(angle, target, maxStep) {
  const d = angleDiff(angle, target);
  if (Math.abs(d) <= maxStep) return target;
  return angle + Math.sign(d) * maxStep;
}

// --- geometry: segment vs rect (slab test), segment vs circle, ray vs rect/circle ---

function segHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [p, q, min, max] of [[-dx, x1 - r.x, r.x, r.x + r.w], [dx, r.x + r.w - x1, r.x, r.x + r.w], [-dy, y1 - r.y, r.y, r.y + r.h], [dy, r.y + r.h - y1, r.y, r.y + r.h]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) { if (t > tmax) return false; if (t > tmin) tmin = t; }
      else { if (t < tmin) return false; if (t < tmax) tmax = t; }
    }
  }
  return true;
}

function segHitsCircle(x1, y1, x2, y2, c) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - c.x;
  const fy = y1 - c.y;
  const a = dx * dx + dy * dy;
  if (a === 0) return dist(x1, y1, c.x, c.y) < c.r;
  let t = -(fx * dx + fy * dy) / a;
  t = Math.max(0, Math.min(1, t));
  return dist(x1 + dx * t, y1 + dy * t, c.x, c.y) < c.r;
}

/** True when the segment between two points is blocked by any wall, case, pillar or the dais. */
export function losBlocked(x1, y1, x2, y2) {
  for (const r of WALLS) if (segHitsRect(x1, y1, x2, y2, r)) return true;
  for (const r of CASES) if (segHitsRect(x1, y1, x2, y2, r)) return true;
  for (const c of PILLARS) if (segHitsCircle(x1, y1, x2, y2, c)) return true;
  if (segHitsCircle(x1, y1, x2, y2, DAIS)) return true;
  return false;
}

function rayRect(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  const slabs = [
    [ox - r.x, dx, r.w],
    [oy - r.y, dy, r.h],
  ];
  for (const [o, d, size] of slabs) {
    if (d === 0) {
      if (o < 0 || o > size) return Infinity;
    } else {
      let t1 = -o / d;
      let t2 = (size - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return Infinity;
    }
  }
  return tmin;
}

function rayCircle(ox, oy, dx, dy, c) {
  const fx = ox - c.x;
  const fy = oy - c.y;
  const b = fx * dx + fy * dy;
  const cc = fx * fx + fy * fy - c.r * c.r;
  const disc = b * b - cc;
  if (disc < 0) return Infinity;
  const t = -b - Math.sqrt(disc);
  return t >= 0 ? t : Infinity;
}

/** Distance along a ray before it hits anything solid (Infinity when clear). */
export function rayHit(ox, oy, dx, dy) {
  let best = Infinity;
  for (const r of WALLS) best = Math.min(best, rayRect(ox, oy, dx, dy, r));
  for (const r of CASES) best = Math.min(best, rayRect(ox, oy, dx, dy, r));
  for (const c of PILLARS) best = Math.min(best, rayCircle(ox, oy, dx, dy, c));
  best = Math.min(best, rayCircle(ox, oy, dx, dy, DAIS));
  return best;
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  return dist(cx, cy, nx, ny) < r;
}

function resolveCircle(pos, radius) {
  for (const rect of [...WALLS, ...CASES]) {
    if (!circleHitsRect(pos.x, pos.y, radius, rect)) continue;
    const nx = Math.max(rect.x, Math.min(pos.x, rect.x + rect.w));
    const ny = Math.max(rect.y, Math.min(pos.y, rect.y + rect.h));
    let dx = pos.x - nx;
    let dy = pos.y - ny;
    let d = Math.hypot(dx, dy);
    if (d === 0) {
      // Centre inside the rect: push out along the smallest penetration axis.
      const left = pos.x - rect.x;
      const right = rect.x + rect.w - pos.x;
      const top = pos.y - rect.y;
      const bottom = rect.y + rect.h - pos.y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) pos.x = rect.x - radius;
      else if (m === right) pos.x = rect.x + rect.w + radius;
      else if (m === top) pos.y = rect.y - radius;
      else pos.y = rect.y + rect.h + radius;
      continue;
    }
    dx /= d;
    dy /= d;
    pos.x = nx + dx * radius;
    pos.y = ny + dy * radius;
  }
  for (const c of PILLARS) {
    const d = dist(pos.x, pos.y, c.x, c.y);
    if (d < radius + c.r && d > 0) {
      pos.x = c.x + ((pos.x - c.x) / d) * (radius + c.r);
      pos.y = c.y + ((pos.y - c.y) / d) * (radius + c.r);
    }
  }
  const dd = dist(pos.x, pos.y, DAIS.x, DAIS.y);
  if (dd < radius + DAIS.r && dd > 0) {
    pos.x = DAIS.x + ((pos.x - DAIS.x) / dd) * (radius + DAIS.r);
    pos.y = DAIS.y + ((pos.y - DAIS.y) / dd) * (radius + DAIS.r);
  }
  pos.x = Math.max(28 + radius, Math.min(FIELD.width - 28 - radius, pos.x));
  // The exit gap in the bottom wall (x 600..680) is the only way out of the hall.
  const inExitGap = pos.x > 600 + radius && pos.x < 680 - radius;
  const maxY = inExitGap ? FIELD.height - radius : FIELD.height - 28 - radius;
  pos.y = Math.max(28 + radius, Math.min(maxY, pos.y));
}

export function createWorld() {
  const player = { x: 640, y: 640, angle: -Math.PI / 2, moving: false, sneaking: false };
  const guards = GUARD_DEFS.map((d) => ({
    name: d.name,
    x: d.x,
    y: d.y,
    angle: 0,
    waypoints: d.waypoints,
    wp: 0,
    pause: 0,
    state: 'patrol',
    suspicion: 0,
    lastSeen: null,
    investigate: null,
  }));
  const cameras = CAMERA_DEFS.map((d) => ({ x: d.x, y: d.y, base: d.base, sweep: d.sweep, range: d.range, angle: d.base, t: 0, sees: false }));
  const loot = LOOT_DEFS.map((d) => ({ ...d, taken: false }));
  const smoke = [];
  const coins = [];
  const state = {
    player,
    guards,
    cameras,
    loot,
    smoke,
    coins,
    alarm: 0,
    lootValue: 0,
    gemTaken: false,
    smokeLeft: TOOLS.smoke,
    coinsLeft: TOOLS.coins,
    elapsed: 0,
    won: false,
    caught: false,
    message: '',
    messageT: 0,
  };

  function reset() {
    player.x = 640;
    player.y = 640;
    player.angle = -Math.PI / 2;
    player.moving = false;
    player.sneaking = false;
    guards.forEach((g, i) => {
      g.x = GUARD_DEFS[i].x;
      g.y = GUARD_DEFS[i].y;
      g.angle = 0;
      g.wp = 0;
      g.pause = 0;
      g.state = 'patrol';
      g.suspicion = 0;
      g.lastSeen = null;
      g.investigate = null;
    });
    cameras.forEach((c, i) => {
      c.angle = CAMERA_DEFS[i].base;
      c.t = 0;
      c.sees = false;
    });
    loot.forEach((l) => { l.taken = false; });
    smoke.length = 0;
    coins.length = 0;
    state.alarm = 0;
    state.lootValue = 0;
    state.gemTaken = false;
    state.smokeLeft = TOOLS.smoke;
    state.coinsLeft = TOOLS.coins;
    state.elapsed = 0;
    state.won = false;
    state.caught = false;
    state.message = '';
    state.messageT = 0;
  }

  function inSmoke(x, y) {
    for (const s of smoke) if (dist(x, y, s.x, s.y) < SMOKE.radius) return true;
    return false;
  }

  function smokeBlocks(x1, y1, x2, y2) {
    for (const s of smoke) if (segHitsCircle(x1, y1, x2, y2, { x: s.x, y: s.y, r: SMOKE.radius })) return true;
    return false;
  }

  /** Can `eye` see the player? Cone, range, line of sight and smoke all count. */
  function canSee(eyeX, eyeY, angle, half, range, sneakFactor) {
    const d = dist(eyeX, eyeY, player.x, player.y);
    if (d > range) return 0;
    const a = angleTo(eyeX, eyeY, player.x, player.y);
    if (Math.abs(angleDiff(angle, a)) > half) return 0;
    if (losBlocked(eyeX, eyeY, player.x, player.y)) return 0;
    if (smokeBlocks(eyeX, eyeY, player.x, player.y)) return 0;
    if (inSmoke(player.x, player.y)) return 0;
    const closeness = 1.15 - d / range;
    return Math.max(0, closeness) * sneakFactor;
  }

  function tryGrab() {
    let best = null;
    let bestD = 74; // the dais stops the thief 56 px from the gem, so the reach must clear it
    for (const l of loot) {
      if (l.taken) continue;
      const d = dist(player.x, player.y, l.x, l.y);
      if (d < bestD) {
        bestD = d;
        best = l;
      }
    }
    if (!best) return 0;
    best.taken = true;
    state.lootValue += best.value;
    if (best.kind === 'gem') {
      state.gemTaken = true;
      state.alarm = Math.min(ALARM.lockdown, state.alarm + ALARM.gemGrab);
      state.message = 'THE SUN IS YOURS — RUN FOR THE EXIT!';
      state.messageT = 3;
      return EVENT_GRAB | EVENT_GEM;
    }
    state.message = `${best.name} — $${best.value}`;
    state.messageT = 2;
    return EVENT_GRAB;
  }

  function throwSmoke() {
    if (state.smokeLeft <= 0) return 0;
    state.smokeLeft -= 1;
    smoke.push({ x: player.x, y: player.y, t: SMOKE.seconds });
    return EVENT_SMOKE;
  }

  function tossCoin() {
    if (state.coinsLeft <= 0) return 0;
    state.coinsLeft -= 1;
    const cx = Math.max(60, Math.min(FIELD.width - 60, player.x + Math.cos(player.angle) * COIN.throwDist));
    const cy = Math.max(60, Math.min(FIELD.height - 60, player.y + Math.sin(player.angle) * COIN.throwDist));
    coins.push({ x: cx, y: cy, t: COIN.investigate });
    for (const g of guards) {
      if (dist(g.x, g.y, cx, cy) < COIN.radius && g.state !== 'alert') {
        g.investigate = { x: cx, y: cy, t: COIN.investigate };
      }
    }
    return EVENT_COIN;
  }

  function score() {
    const timeBonus = state.won ? Math.max(0, SCORES.timeBonus - Math.floor(state.elapsed)) : 0;
    const quiet = state.won && state.alarm < 50 ? SCORES.quietBonus : 0;
    return state.lootValue + timeBonus + quiet;
  }

  /**
   * One fixed step. `input` is {x, y, sneak}; `harmless` runs the backdrop (title screen):
   * guards patrol and cameras sweep, but nothing is ever spotted and nobody is caught.
   */
  function step(dt, input, harmless) {
    let events = 0;
    state.elapsed += dt;
    if (state.messageT > 0) state.messageT -= dt;

    // Player movement.
    const speed = input.sneak ? PLAYER.sneak : PLAYER.walk;
    const mx = input.x * speed * dt;
    const my = input.y * speed * dt;
    player.moving = mx !== 0 || my !== 0;
    player.sneaking = input.sneak;
    if (player.moving) player.angle = Math.atan2(my, mx);
    player.x += mx;
    resolveCircle(player, PLAYER.radius);
    player.y += my;
    resolveCircle(player, PLAYER.radius);

    // Smoke and coins decay.
    for (let i = smoke.length - 1; i >= 0; i -= 1) {
      smoke[i].t -= dt;
      if (smoke[i].t <= 0) smoke.splice(i, 1);
    }
    for (let i = coins.length - 1; i >= 0; i -= 1) {
      coins[i].t -= dt;
      if (coins[i].t <= 0) coins.splice(i, 1);
    }

    const sneakFactor = player.sneaking ? 0.55 : 1;
    let anySuspicious = false;
    let anyAlert = false;
    let anyCameraSees = false;

    // Guards: perceive, then move.
    for (const g of guards) {
      const vis = harmless ? 0 : canSee(g.x, g.y, g.angle, GUARD.coneHalf, GUARD.coneRange, sneakFactor);
      if (vis > 0) {
        g.suspicion = Math.min(1, g.suspicion + vis * GUARD.spotRate * dt);
        g.lastSeen = { x: player.x, y: player.y };
      } else {
        g.suspicion = Math.max(0, g.suspicion - GUARD.forgetRate * dt);
      }
      const wasAlert = g.state === 'alert';
      g.state = g.suspicion >= 0.8 ? 'alert' : g.suspicion >= 0.35 ? 'curious' : 'patrol';
      if (g.state === 'alert' && !wasAlert && !harmless) events |= EVENT_SPOTTED;
      if (g.state === 'curious') anySuspicious = true;
      if (g.state === 'alert') anyAlert = true;

      let target = null;
      let spd = GUARD.patrol;
      if (g.investigate) {
        target = g.investigate;
        spd = GUARD.curious;
        g.investigate.t -= dt;
        if (g.investigate.t <= 0) g.investigate = null;
      } else if (g.state === 'alert') {
        target = player;
        spd = state.alarm >= ALARM.lockdown ? GUARD.chase + 25 : GUARD.chase;
      } else if (g.state === 'curious' && g.lastSeen) {
        target = g.lastSeen;
        spd = GUARD.curious;
      } else {
        const wp = g.waypoints[g.wp];
        target = wp;
        if (g.pause > 0) {
          g.pause -= dt;
          target = null;
        } else if (dist(g.x, g.y, wp.x, wp.y) < 10) {
          g.wp = (g.wp + 1) % g.waypoints.length;
          g.pause = 0.8;
          target = null;
        }
      }
      if (target) {
        const a = angleTo(g.x, g.y, target.x, target.y);
        g.angle = turnToward(g.angle, a, 4.5 * dt);
        const d = dist(g.x, g.y, target.x, target.y);
        if (d > 4) {
          const stepLen = Math.min(d, spd * dt);
          g.x += Math.cos(g.angle) * stepLen;
          g.y += Math.sin(g.angle) * stepLen;
          resolveCircle(g, GUARD.radius);
        }
      } else if (g.state === 'curious' && g.lastSeen) {
        g.angle = turnToward(g.angle, angleTo(g.x, g.y, g.lastSeen.x, g.lastSeen.y), 3 * dt);
      }

      // Caught: an alert guard (or lockdown) touches the thief.
      if (!harmless && !state.caught && dist(g.x, g.y, player.x, player.y) < 30 && (g.state === 'alert' || state.alarm >= ALARM.lockdown)) {
        state.caught = true;
        events |= EVENT_CAUGHT;
      }
    }

    // Cameras sweep and watch.
    for (const c of cameras) {
      c.t += dt;
      c.angle = c.base + Math.sin(c.t * c.sweep) * c.range;
      c.sees = !harmless && canSee(c.x, c.y, c.angle, CAMERA.coneHalf, CAMERA.coneRange, sneakFactor) > 0;
      if (c.sees) anyCameraSees = true;
    }

    // The alarm meter.
    if (!harmless) {
      if (anyAlert) state.alarm += ALARM.riseAlert * dt;
      else if (anySuspicious || anyCameraSees) state.alarm += Math.max(ALARM.riseSuspicious, anyCameraSees ? ALARM.riseCamera : 0) * dt;
      else state.alarm -= ALARM.decay * dt;
      state.alarm = Math.max(0, Math.min(ALARM.lockdown, state.alarm));
      if (state.alarm >= ALARM.lockdown && !state.message) {
        state.message = 'LOCKDOWN — THEY ARE COMING FOR YOU';
        state.messageT = 3;
      }
    }

    // Win: the gem is in hand and the thief reaches the exit door.
    if (!harmless && !state.won && state.gemTaken && player.x > EXIT.x && player.x < EXIT.x + EXIT.w && player.y > EXIT.y - 6) {
      state.won = true;
      events |= EVENT_WIN;
    }

    return events;
  }

  reset();
  return { state, reset, step, tryGrab, throwSmoke, tossCoin, score };
}
