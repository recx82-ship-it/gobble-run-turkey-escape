// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.
// Gobble Run: Giblet the turkey sprints across the farmyard toward the freedom woods,
// 1500 metres away, while Farmer Bram chases from behind and the farm itself — ovens,
// carving knives and hay bales — tries to slow him down.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Three running lanes across the farmyard; the turkey switches between them. */
export const LANES = [398, 498, 598];
/** Draw scale per lane, for a little depth: the far lane is smaller. */
export const LANE_SCALE = [0.9, 1.0, 1.1];

export const PLAYER = {
  /** Fixed horizontal spot; the world scrolls past the turkey. */
  x: 230,
  width: 64,
  height: 58,
  /** Seconds of mercy after a hit, while the turkey flashes. */
  invulnerable: 1.5,
};

export const LIVES = 3;
/** Metres of farmyard between the turkey and the freedom woods. */
export const GOAL_METRES = 1500;
/** Pixels scrolled per metre of distance. */
export const PX_PER_METRE = 18;

/** The farmer's chase: gap 100 means far behind, 0 means caught. */
export const FARMER = {
  startGap: 75,
  hitLoss: 28,
  regenPerSecond: 5,
  /** Seconds after a hit before the gap starts growing again. */
  regenDelay: 2,
};

export const SPEED = {
  start: 300,
  perMetre: 0.14,
  max: 640,
};

export const JUMP = {
  /** Initial upward speed; gravity pulls the turkey back down. */
  velocity: 760,
  gravity: 2100,
  /** Highest point of a full jump, in pixels above the lane. */
  apex: 138,
};

export const HAZARD = {
  /** Seconds between spawn columns; shrinks as the run gets faster. */
  interval: 0.85,
  intervalMin: 0.5,
  intervalPerMetre: 0.00012,
  oven: { width: 92, height: 168, points: 2 },
  knife: { width: 96, height: 34, points: 2 },
  bale: { width: 78, height: 62, points: 2 },
};

export const PICKUP = {
  corn: { size: 34, points: 10 },
  pie: { size: 38, points: 25 },
  /** Chance a spawn column carries a pie instead of corn. */
  pieChance: 0.14,
};

/** How many entities can exist at once; the pool is allocated once, at boot. */
export const POOL_SIZE = 96;

export const PALETTE = {
  skyTop: '#7ec8ee',
  skyBottom: '#fdf3c4',
  sun: '#ffd94d',
  cloud: '#ffffff',
  hillFar: '#8fbf6a',
  hillNear: '#6da84f',
  barn: '#b8452f',
  barnRoof: '#7e2f1d',
  fence: '#8a5a33',
  ground: '#c9a15e',
  lane: ['#b98d4e', '#c9a15e', '#d9b06e'],
  grass: '#5da24a',
  turkeyBody: '#8a5a2e',
  turkeyBelly: '#c98d4e',
  turkeyTail: ['#a0522d', '#d2691e', '#e8a33c', '#7a3b1e'],
  turkeyHead: '#e8e0d0',
  turkeyWattle: '#e5534b',
  turkeyBeak: '#f2a541',
  farmerShirt: '#3f6fb5',
  farmerOveralls: '#2f4d7a',
  farmerHat: '#e8d27a',
  farmerSkin: '#e8b98a',
  ovenBody: '#4a4a52',
  ovenDoor: '#2b2b31',
  ovenFire: '#ff7a1a',
  ovenGlow: '#ffb347',
  knifeBlade: '#d7dce3',
  knifeHandle: '#5a3a22',
  bale: '#e0b64f',
  baleBand: '#b98d2e',
  corn: '#f2c94c',
  cornHusk: '#4e9e3f',
  pie: '#e8823a',
  pieCrust: '#c96a1e',
  panel: 'rgba(20, 26, 20, 0.72)',
  text: '#fff8e7',
  muted: '#d8cdb4',
  danger: '#ff5a3c',
  good: '#7ee081',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gobble-run.best';
