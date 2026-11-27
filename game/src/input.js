// Keyboard and pointer input. Lane changes and jumps are one-shot presses, queued as bit
// flags and taken once by the loop, so a press between two frames is never lost and never
// counted twice. Confirm starts and restarts; pause and mute are one-shot too.
//
// Keyboard: Up / W lane up, Down / S lane down, Space jump, Enter confirm,
// P or Esc pause, M mute, R restart on the end screen.
// Mouse: click the top third to run a lane up, the bottom third a lane down, the middle
// to jump; a click also starts and restarts.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_LANE_UP = 8;
export const ACTION_LANE_DOWN = 16;
export const ACTION_JUMP = 32;
export const ACTION_RESTART = 64;

const LANE_UP = new Set(['ArrowUp', 'KeyW']);
const LANE_DOWN = new Set(['ArrowDown', 'KeyS']);
const JUMP = new Set(['Space']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);

export function createInput(target) {
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (LANE_UP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_LANE_UP;
    } else if (LANE_DOWN.has(event.code)) {
      if (!event.repeat) actions |= ACTION_LANE_DOWN;
    } else if (JUMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_JUMP;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else {
      return;
    }
    event.preventDefault();
  });

  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    const y = ((event.clientY - rect.top) / rect.height) * 720;
    if (y < 240) actions |= ACTION_LANE_UP;
    else if (y > 480) actions |= ACTION_LANE_DOWN;
    else actions |= ACTION_JUMP;
    // A click is also a confirm, so it starts and restarts the game.
    actions |= ACTION_CONFIRM;
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
