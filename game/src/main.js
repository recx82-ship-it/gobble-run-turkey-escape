// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the spawn pattern. ?shot=start|play|chase|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_OVER, EVENT_PICKUP } from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_JUMP,
  ACTION_LANE_DOWN,
  ACTION_LANE_UP,
  ACTION_MUTE,
  ACTION_PAUSE,
  ACTION_RESTART,
  createInput,
} from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

// Test hook only: ?debug=1 exposes the world so a play-test can drive it by keys
// and read back the run. Nothing in the game reads it.
if (params.get('debug') === '1') window.__world = world;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.gobble();
    announce('Playing. Run 1500 metres to the freedom woods. Three lives.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (world.state.reason === 'escaped') {
      audio.escaped();
      announce(`Escaped! Score ${world.state.score}. Best ${best}.`);
    } else {
      audio.caught();
      announce(`Caught. Score ${world.state.score}. Best ${best}.`);
    }
  }

  function handleActions(actions) {
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM) audio.unlock();
    // Space (jump) also starts and restarts, like a click does.
    if (screen === SCREEN_TITLE && (actions & (ACTION_CONFIRM | ACTION_JUMP))) {
      startGame();
      return;
    }
    if (screen === SCREEN_OVER && (actions & (ACTION_CONFIRM | ACTION_RESTART | ACTION_JUMP))) {
      startGame();
      return;
    }
    if (screen === SCREEN_PAUSED && (actions & (ACTION_PAUSE | ACTION_CONFIRM))) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (screen === SCREEN_PLAY && (actions & ACTION_PAUSE)) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, null, true);
      return;
    }
    const move = {
      lane: (actions & ACTION_LANE_DOWN ? 1 : 0) - (actions & ACTION_LANE_UP ? 1 : 0),
      jump: Boolean(actions & ACTION_JUMP),
    };
    if (move.lane !== 0) audio.lane();
    if (move.jump) audio.jump();
    const events = world.step(STEP, move, false);
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_HIT) {
      audio.hit();
      announce(world.state.lives === 1 ? 'Hit. 1 life left. The farmer is closing in!' : `Hit. ${world.state.lives} lives left.`);
    }
    if (events & EVENT_OVER) endGame();
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    // Actions are read once per frame; the first simulation sub-step takes them,
    // later catch-up sub-steps take none, so a press is never applied twice.
    const actions = input.takeActions();
    handleActions(actions);
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      let first = true;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(first ? actions : 0);
        first = false;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, audio.isMuted());
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch the turkey unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gobble Run. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
