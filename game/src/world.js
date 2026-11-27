// The run itself: Giblet the turkey sprints right while the farmyard scrolls left. He
// switches lanes, jumps the low hazards, and must reach the freedom woods 1500 metres
// away before Farmer Bram — who closes in on every stumble — catches him.
//
// The world is a fixed-step simulation: step(dt, move) advances it by dt seconds. `move`
// is { lane: -1 | 0 | 1, jump: boolean } for that step. It returns event flags.
import {
  FARMER,
  GOAL_METRES,
  HAZARD,
  JUMP,
  LANES,
  LIVES,
  PICKUP,
  PLAYER,
  POOL_SIZE,
  PX_PER_METRE,
  SPEED,
  STEP,
} from './config.js';

export const EVENT_HIT = 1;
export const EVENT_OVER = 2;
export const EVENT_PICKUP = 4;
export const EVENT_DODGE = 8;

export const KIND_OVEN = 'oven';
export const KIND_KNIFE = 'knife';
export const KIND_BALE = 'bale';
export const KIND_CORN = 'corn';
export const KIND_PIE = 'pie';

const HAZARD_KINDS = [KIND_OVEN, KIND_KNIFE, KIND_BALE];

/** A hazard the turkey can jump clean over (knife, bale) or must go around (oven). */
function isJumpable(kind) {
  return kind === KIND_KNIFE || kind === KIND_BALE;
}

function hazardSize(kind) {
  if (kind === KIND_OVEN) return HAZARD.oven;
  if (kind === KIND_KNIFE) return HAZARD.knife;
  return HAZARD.bale;
}

export function createWorld(random) {
  const state = {
    time: 0,
    distance: 0,
    scrolled: 0,
    speed: SPEED.start,
    score: 0,
    bonus: 0,
    lives: LIVES,
    gap: FARMER.startGap,
    timeSinceHit: 99,
    over: false,
    reason: null,
    player: { lane: 1, jumpY: 0, vy: 0, jumping: false, invuln: 0, runPhase: 0 },
    entities: [],
  };
  for (let i = 0; i < POOL_SIZE; i += 1) {
    state.entities.push({ active: false, kind: KIND_CORN, lane: 1, x: 0, w: 0, h: 0, bob: 0, passed: false });
  }

  let spawnTimer = 1.1;

  function spawn(kind, lane, x) {
    for (let i = 0; i < state.entities.length; i += 1) {
      const e = state.entities[i];
      if (e.active) continue;
      const size = kind === KIND_CORN ? PICKUP.corn : kind === KIND_PIE ? PICKUP.pie : hazardSize(kind);
      e.active = true;
      e.kind = kind;
      e.lane = lane;
      e.x = x;
      e.w = size.width ?? size.size;
      e.h = size.height ?? size.size;
      e.bob = random() * Math.PI * 2;
      e.passed = false;
      return;
    }
  }

  /** Spawn one column of trouble ahead: never blocks all three lanes. */
  function spawnColumn() {
    const lanes = [0, 1, 2].sort(() => random() - 0.5);
    const roll = random();
    const x = 1360;
    if (roll < 0.55) {
      // One hazard, corn in another lane.
      spawn(HAZARD_KINDS[Math.floor(random() * HAZARD_KINDS.length)], lanes[0], x);
      if (random() < 0.75) spawn(KIND_CORN, lanes[1], x + 90);
    } else if (roll < 0.85) {
      // Two lanes blocked; the third stays open (at least one hazard is jumpable).
      const first = HAZARD_KINDS[Math.floor(random() * HAZARD_KINDS.length)];
      let second = HAZARD_KINDS[Math.floor(random() * HAZARD_KINDS.length)];
      if (first === KIND_OVEN && second === KIND_OVEN) second = KIND_KNIFE;
      spawn(first, lanes[0], x);
      spawn(second, lanes[1], x + 40);
      if (random() < 0.6) spawn(KIND_CORN, lanes[2], x + 120);
    } else {
      // A lone hazard and a rare pumpkin pie in the open lane.
      spawn(HAZARD_KINDS[Math.floor(random() * HAZARD_KINDS.length)], lanes[0], x);
      spawn(random() < PICKUP.pieChance ? KIND_PIE : KIND_CORN, lanes[1], x + 110);
    }
  }

  function hit() {
    state.lives -= 1;
    state.gap = Math.max(0, state.gap - FARMER.hitLoss);
    state.timeSinceHit = 0;
    state.player.invuln = PLAYER.invulnerable;
    if (state.lives <= 0 || state.gap <= 0) {
      state.over = true;
      state.reason = 'caught';
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  return {
    state,

    reset() {
      state.time = 0;
      state.distance = 0;
      state.scrolled = 0;
      state.speed = SPEED.start;
      state.score = 0;
      state.bonus = 0;
      state.lives = LIVES;
      state.gap = FARMER.startGap;
      state.timeSinceHit = 99;
      state.over = false;
      state.reason = null;
      state.player.lane = 1;
      state.player.jumpY = 0;
      state.player.vy = 0;
      state.player.jumping = false;
      state.player.invuln = 0;
      state.player.runPhase = 0;
      for (const e of state.entities) e.active = false;
      spawnTimer = 1.1;
    },

    step(dt, move, attract) {
      if (state.over) return 0;
      let events = 0;
      state.time += dt;
      state.player.runPhase += dt * state.speed * 0.045;
      if (state.player.invuln > 0) state.player.invuln -= dt;
      state.timeSinceHit += dt;

      // The farmer gains on every stumble, then slowly loses ground while the
      // turkey runs clean.
      if (state.timeSinceHit > FARMER.regenDelay && state.gap < FARMER.startGap) {
        state.gap = Math.min(FARMER.startGap, state.gap + FARMER.regenPerSecond * dt);
      }

      if (attract) {
        // Title screen: the turkey jogs in place and the yard scrolls by.
        state.scrolled += SPEED.start * 0.6 * dt;
        return 0;
      }

      // Lane change and jump.
      if (move) {
        if (move.lane !== 0) {
          const next = state.player.lane + move.lane;
          if (next >= 0 && next < LANES.length) state.player.lane = next;
        }
        if (move.jump && !state.player.jumping) {
          state.player.jumping = true;
          state.player.vy = JUMP.velocity;
        }
      }
      if (state.player.jumping) {
        state.player.vy -= JUMP.gravity * dt;
        state.player.jumpY += state.player.vy * dt;
        if (state.player.jumpY <= 0) {
          state.player.jumpY = 0;
          state.player.vy = 0;
          state.player.jumping = false;
        }
      }

      // Speed grows with distance; the run gets hotter the further he gets.
      state.speed = Math.min(SPEED.max, SPEED.start + state.distance * SPEED.perMetre);
      state.scrolled += state.speed * dt;
      state.distance = state.scrolled / PX_PER_METRE;
      state.score = Math.floor(state.distance) + state.bonus;

      if (state.distance >= GOAL_METRES) {
        state.over = true;
        state.reason = 'escaped';
        return EVENT_OVER;
      }

      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnColumn();
        const interval = Math.max(
          HAZARD.intervalMin,
          HAZARD.interval - state.distance * HAZARD.intervalPerMetre,
        );
        spawnTimer = interval * (0.85 + random() * 0.3);
      }

      const groundY = LANES[state.player.lane];
      const turkeyLeft = PLAYER.x - PLAYER.width / 2 + 8;
      const turkeyRight = PLAYER.x + PLAYER.width / 2 - 8;
      const turkeyTop = groundY - state.player.jumpY - PLAYER.height;
      const turkeyBottom = groundY - state.player.jumpY;

      for (const e of state.entities) {
        if (!e.active) continue;
        e.x -= state.speed * dt;
        e.bob += dt * 3;
        if (e.x < -160) {
          e.active = false;
          continue;
        }
        const eGround = LANES[e.lane];
        const eLeft = e.x - e.w / 2;
        const eRight = e.x + e.w / 2;
        const overlapsX = eRight > turkeyLeft && eLeft < turkeyRight;
        if (!overlapsX || e.lane !== state.player.lane) {
          if (!e.passed && e.x + e.w / 2 < turkeyLeft && (e.kind === KIND_OVEN || e.kind === KIND_KNIFE || e.kind === KIND_BALE)) {
            e.passed = true;
            state.bonus += hazardSize(e.kind).points;
            events |= EVENT_DODGE;
          }
          continue;
        }
        if (e.kind === KIND_CORN || e.kind === KIND_PIE) {
          // Pickups float just above the ground; a jump can still grab them.
          const pickTop = eGround - 44 - e.h / 2;
          const pickBottom = eGround - 44 + e.h / 2;
          if (turkeyBottom > pickTop && turkeyTop < pickBottom) {
            e.active = false;
            state.bonus += e.kind === KIND_PIE ? PICKUP.pie.points : PICKUP.corn.points;
            events |= EVENT_PICKUP;
          }
          continue;
        }
        // Hazards: a jump clears a low one only if the turkey's feet are above it.
        const hazardTop = eGround - e.h;
        const cleared = isJumpable(e.kind) && state.player.jumpY >= e.h - 12;
        if (!cleared && turkeyBottom > hazardTop + 6 && turkeyTop < eGround - 4) {
          e.active = false;
          if (state.player.invuln <= 0) events |= hit();
          if (state.over) return events | EVENT_OVER;
        } else if (!e.passed && e.x + e.w / 2 < turkeyLeft) {
          e.passed = true;
          state.bonus += hazardSize(e.kind).points;
          events |= EVENT_DODGE;
        }
      }
      return events;
    },
  };
}

export { STEP };
