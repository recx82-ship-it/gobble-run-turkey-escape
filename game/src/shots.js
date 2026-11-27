// The screenshot scenes behind ?shot=start|play|chase|end. Each one plays the real rules
// forward from a fresh world for a fixed number of steps, steered by a simple autopilot
// (look ahead in each lane, keep clear of ovens, jump the low hazards, chase the corn),
// so the frame is what a short game really looks like and the same seed always gives
// the same frame.
import { FIELD, GOAL_METRES, LANES, PLAYER, STEP } from './config.js';
import { EVENT_OVER, KIND_BALE, KIND_KNIFE, KIND_OVEN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 4;
const PLAY_SECONDS = 24;
const CHASE_SECONDS = 34;
const END_LIMIT_SECONDS = 600;
const SAMPLE = 1 / 30;
/** How far ahead, in seconds, the autopilot checks each lane. */
const HORIZON_PLAY = 0.9;
const HORIZON_END = 0.22;
/** Extra room, each side, it keeps between the turkey and a hazard. */
const MARGIN = 14;

function isHazard(kind) {
  return kind === KIND_OVEN || kind === KIND_KNIFE || kind === KIND_BALE;
}

/** Seconds until the turkey, in `lane` and jumping or not, hits a hazard; Infinity if never. */
function timeToHit(state, lane, horizon, jump) {
  const groundY = LANES[lane];
  for (let t = SAMPLE; t <= horizon; t += SAMPLE) {
    for (const item of state.entities) {
      if (!item.active || !isHazard(item.kind) || item.lane !== lane) continue;
      const x = item.x - state.speed * t;
      if (x + item.w / 2 < PLAYER.x - PLAYER.width / 2 - MARGIN || x - item.w / 2 > PLAYER.x + PLAYER.width / 2 + MARGIN) continue;
      if (jump && (item.kind === KIND_KNIFE || item.kind === KIND_BALE)) continue;
      if (t * state.speed < 0) continue;
      return t;
    }
  }
  return Infinity;
}

/** Pick the safest lane (preferring the one with corn), and jump when a low hazard is close. */
function autopilot(state, horizon) {
  const player = state.player;
  const move = { lane: 0, jump: false };
  // A low hazard right in front of us in our lane: jump it.
  for (const item of state.entities) {
    if (!item.active || !isHazard(item.kind) || item.lane !== player.lane) continue;
    const dx = item.x - PLAYER.x;
    if (dx > 0 && dx < 150 && (item.kind === KIND_KNIFE || item.kind === KIND_BALE) && !player.jumping) {
      move.jump = true;
      return move;
    }
  }
  // Otherwise choose the safest ADJACENT lane (the turkey moves one lane at a time,
  // so the lane it steps into must be safe, not just the far one it is heading for),
  // preferring one with corn ahead.
  let bestLane = player.lane;
  let bestTime = timeToHit(state, player.lane, horizon, false);
  for (let lane = player.lane - 1; lane <= player.lane + 1; lane += 1) {
    if (lane < 0 || lane >= LANES.length || lane === player.lane) continue;
    const time = timeToHit(state, lane, horizon, false);
    let bonus = 0;
    for (const item of state.entities) {
      if (item.active && item.kind !== KIND_OVEN && item.kind !== KIND_KNIFE && item.kind !== KIND_BALE && item.lane === lane && item.x > PLAYER.x && item.x < PLAYER.x + 500) bonus = 0.05;
    }
    if (time + bonus > bestTime) {
      bestTime = time + bonus;
      bestLane = lane;
    }
  }
  move.lane = bestLane > player.lane ? 1 : bestLane < player.lane ? -1 : 0;
  return move;
}

function runFor(world, seconds, horizon) {
  for (let i = 0; i < seconds / STEP; i += 1) {
    if (world.step(STEP, autopilot(world.state, horizon), false) & EVENT_OVER) break;
  }
}

/**
 * Set `world` to the named scene (start, play, chase or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'chase' && name !== 'end') {
    for (let i = 0; i < START_SECONDS / STEP; i += 1) world.step(STEP, null, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runFor(world, PLAY_SECONDS, HORIZON_PLAY);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'chase') {
    // A long run with a good pilot, then force the farmer right onto the turkey's
    // tail: the frame shows the chase at its hottest, ovens and knives ahead.
    runFor(world, CHASE_SECONDS, HORIZON_PLAY);
    world.state.gap = 14;
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  // End: a careless pilot with a short horizon gets caught, as a hurried player is.
  const limit = END_LIMIT_SECONDS;
  for (let i = 0; i < limit / STEP; i += 1) {
    if (world.step(STEP, autopilot(world.state, HORIZON_END), false) & EVENT_OVER) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score };
}

export { FIELD, GOAL_METRES };
