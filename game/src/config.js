// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical area;
// the renderer scales it to the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  walk: 195,
  sneak: 105,
  run: 235,
};

export const GUARD = {
  radius: 15,
  patrol: 68,
  curious: 95,
  chase: 148,
  coneRange: 265,
  coneHalf: 0.61, // radians, ~35 degrees each side
  spotRate: 1.5, // suspicion per second at point blank, scaled by distance
  forgetRate: 0.7,
};

export const CAMERA = {
  coneRange: 305,
  coneHalf: 0.5,
  sweep: 0.55, // radians per second
  spotRate: 1.1,
};

export const ALARM = {
  riseSuspicious: 2.2, // per second while any guard is suspicious
  riseAlert: 9.0, // per second while any guard is fully alert
  riseCamera: 5.0, // per second while a camera sees the player
  decay: 3.2, // per second while nobody sees the player
  gemGrab: 25, // instant jump when the Sun is taken
  lockdown: 100,
};

export const TOOLS = { smoke: 2, coins: 3 };
export const SMOKE = { radius: 95, seconds: 4.5 };
export const COIN = { throwDist: 150, investigate: 3.2, radius: 320 };

export const SCORES = { gem: 500, side: 100, timeBonus: 600, quietBonus: 100 };

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gilded.best';

export const PALETTE = {
  backdrop: '#0b0e1a',
  floorA: '#171c2e',
  floorB: '#131829',
  carpet: '#4a1a22',
  carpetTrim: '#8a6d2f',
  wall: '#232a44',
  wallTrim: '#c9a24b',
  caseGlass: '#2c4a6b',
  caseFrame: '#c9a24b',
  pillar: '#3a4364',
  pillarHi: '#5a6694',
  gem: '#ffd94d',
  gemGlow: '#ffedb0',
  loot: '#e8b64c',
  exit: '#37d67a',
  player: '#10131f',
  playerScarf: '#2dd4bf',
  guard: '#2b3a67',
  guardCap: '#8fa8e8',
  cone: 'rgba(255, 214, 90, 0.30)',
  coneSuspicious: 'rgba(255, 150, 60, 0.38)',
  coneAlert: 'rgba(255, 70, 70, 0.38)',
  coneCamera: 'rgba(255, 140, 70, 0.26)',
  smoke: 'rgba(200, 205, 220, 0.28)',
  text: '#f2ead8',
  muted: '#9aa3bd',
  gold: '#c9a24b',
  red: '#ff5252',
  panel: 'rgba(10, 13, 26, 0.82)',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const SERIF = 'Georgia, "Times New Roman", serif';
