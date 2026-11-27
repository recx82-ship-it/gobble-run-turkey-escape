// Every picture in the game is drawn here, in canvas, from the state: the farmyard
// scrolling past (sky, sun, clouds, hills, the red barn, fences), Giblet the turkey,
// Farmer Bram on his heels, the oven, the carving knife, hay bales, corn and pie,
// the HUD, and the title, paused and end screens. No image files anywhere.
import {
  FARMER,
  FIELD,
  FONT,
  GOAL_METRES,
  LANES,
  LANE_SCALE,
  PALETTE,
  PLAYER,
} from './config.js';
import { KIND_BALE, KIND_CORN, KIND_KNIFE, KIND_OVEN, KIND_PIE } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const W = FIELD.width;
const H = FIELD.height;

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** Giblet the turkey, mid-stride, facing right. scale ~1, runPhase animates the legs. */
function drawTurkey(ctx, x, groundY, scale, runPhase, jumpY) {
  const y = groundY - jumpY;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const legSwing = Math.sin(runPhase) * 10;
  const airborne = jumpY > 4;
  // Tail feathers, fanned.
  ctx.save();
  ctx.translate(-26, -26);
  for (let i = 0; i < 5; i += 1) {
    const angle = -0.9 + i * 0.45;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = PALETTE.turkeyTail[i % PALETTE.turkeyTail.length];
    ctx.beginPath();
    ctx.ellipse(-14, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  // Legs.
  ctx.strokeStyle = '#e8a33c';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (airborne) {
    ctx.moveTo(-6, -8);
    ctx.lineTo(-12, 2);
    ctx.moveTo(8, -8);
    ctx.lineTo(14, 2);
  } else {
    ctx.moveTo(-6, -8);
    ctx.lineTo(-6 + legSwing * 0.5, 0);
    ctx.moveTo(8, -8);
    ctx.lineTo(8 - legSwing * 0.5, 0);
  }
  ctx.stroke();
  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ellipse(ctx, 0, -26, 26, 22);
  ctx.fillStyle = PALETTE.turkeyBelly;
  ellipse(ctx, 8, -20, 15, 13);
  // Wing.
  ctx.fillStyle = '#6e4520';
  ctx.beginPath();
  ctx.ellipse(-2, -26, 16, 10, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Head and neck.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(22, -52, 7, 14, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyHead;
  ellipse(ctx, 26, -64, 11, 10);
  // Beak, wattle, eye.
  ctx.fillStyle = PALETTE.turkeyBeak;
  ctx.beginPath();
  ctx.moveTo(34, -66);
  ctx.lineTo(46, -62);
  ctx.lineTo(34, -59);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyWattle;
  ctx.beginPath();
  ctx.ellipse(30, -54, 3.5, 6, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ellipse(ctx, 29, -66, 2.2, 2.2);
  ctx.restore();
}

/** Farmer Bram, big, red-faced, straw hat, running after his dinner. */
function drawFarmer(ctx, x, groundY, scale, runPhase) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  const legSwing = Math.sin(runPhase + 1.2) * 12;
  // Legs.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -34);
  ctx.lineTo(-8 + legSwing * 0.5, 0);
  ctx.moveTo(8, -34);
  ctx.lineTo(8 - legSwing * 0.5, 0);
  ctx.stroke();
  // Body: overalls and shirt.
  ctx.fillStyle = PALETTE.farmerOveralls;
  rr(ctx, -20, -72, 40, 42, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerShirt;
  rr(ctx, -20, -72, 40, 16, 8);
  ctx.fill();
  // Arms reaching forward.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(14, -62);
  ctx.lineTo(34, -50 + Math.sin(runPhase) * 4);
  ctx.moveTo(14, -56);
  ctx.lineTo(32, -40 - Math.sin(runPhase) * 4);
  ctx.stroke();
  // Head.
  ctx.fillStyle = PALETTE.farmerSkin;
  ellipse(ctx, 4, -86, 14, 13);
  // Straw hat.
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(4, -94, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -98, 13, 8, 0, Math.PI, 0);
  ctx.fill();
  // Angry eyes and moustache.
  ctx.fillStyle = '#222';
  ellipse(ctx, 10, -88, 2, 2);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(6, -80, 12, 3);
  ctx.restore();
}

function drawOven(ctx, x, groundY, scale, time) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  // Heat glow behind.
  const flicker = 0.75 + Math.sin(time * 9) * 0.15 + Math.sin(time * 23) * 0.1;
  ctx.fillStyle = `rgba(255, 122, 26, ${0.25 * flicker})`;
  ellipse(ctx, 0, -70, 66, 78);
  // Body.
  ctx.fillStyle = PALETTE.ovenBody;
  rr(ctx, -46, -168, 92, 168, 10);
  ctx.fill();
  ctx.fillStyle = '#5d5d66';
  rr(ctx, -46, -168, 92, 18, 10);
  ctx.fill();
  // Open door, fire inside.
  ctx.fillStyle = PALETTE.ovenDoor;
  rr(ctx, -32, -120, 64, 84, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.ovenFire;
  ctx.beginPath();
  ctx.moveTo(-24, -40);
  ctx.quadraticCurveTo(-28, -70 - 14 * flicker, -12, -78);
  ctx.quadraticCurveTo(-4, -58, 2, -80);
  ctx.quadraticCurveTo(12, -62, 24, -40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.ovenGlow;
  ctx.beginPath();
  ctx.moveTo(-14, -40);
  ctx.quadraticCurveTo(-16, -58, -6, -64);
  ctx.quadraticCurveTo(0, -52, 6, -64);
  ctx.quadraticCurveTo(14, -56, 14, -40);
  ctx.closePath();
  ctx.fill();
  // Knobs and a "HOT" warning.
  ctx.fillStyle = '#d7dce3';
  ellipse(ctx, -28, -146, 5, 5);
  ellipse(ctx, 0, -146, 5, 5);
  ellipse(ctx, 28, -146, 5, 5);
  text(ctx, 'HOT!', 0, -132, 13, '#ffb347');
  ctx.restore();
}

function drawKnife(ctx, x, groundY, scale, time) {
  ctx.save();
  ctx.translate(x, groundY - 17);
  ctx.scale(scale, scale);
  ctx.rotate(Math.sin(time * 6) * 0.05);
  // Blade.
  ctx.fillStyle = PALETTE.knifeBlade;
  ctx.beginPath();
  ctx.moveTo(-48, -8);
  ctx.lineTo(18, -8);
  ctx.quadraticCurveTo(40, -4, 48, 0);
  ctx.quadraticCurveTo(40, 4, 18, 8);
  ctx.lineTo(-48, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#aab2bd';
  ctx.fillRect(-40, -2, 52, 2);
  // Handle.
  ctx.fillStyle = PALETTE.knifeHandle;
  rr(ctx, -72, -9, 26, 18, 6);
  ctx.fill();
  ctx.fillStyle = '#7a4a26';
  ellipse(ctx, -64, 0, 3, 3);
  ellipse(ctx, -54, 0, 3, 3);
  ctx.restore();
}

function drawBale(ctx, x, groundY, scale) {
  ctx.save();
  ctx.translate(x, groundY - 31);
  ctx.scale(scale, scale);
  ctx.fillStyle = PALETTE.bale;
  ellipse(ctx, 0, 0, 39, 31);
  ctx.strokeStyle = PALETTE.baleBand;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 21, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#c99b2e';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 12, -26);
    ctx.lineTo(i * 12 + 6, 26);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCorn(ctx, x, groundY, scale, bob) {
  ctx.save();
  ctx.translate(x, groundY - 44 + Math.sin(bob) * 5);
  ctx.scale(scale, scale);
  ctx.rotate(0.5);
  ctx.fillStyle = PALETTE.corn;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9a92e';
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 5, -14);
    ctx.lineTo(i * 5, 14);
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.cornHusk;
  ctx.beginPath();
  ctx.moveTo(-8, 8);
  ctx.quadraticCurveTo(-16, 22, -6, 26);
  ctx.quadraticCurveTo(0, 16, 8, 26);
  ctx.quadraticCurveTo(16, 22, 8, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPie(ctx, x, groundY, scale, bob) {
  ctx.save();
  ctx.translate(x, groundY - 44 + Math.sin(bob) * 5);
  ctx.scale(scale, scale);
  ctx.fillStyle = PALETTE.pieCrust;
  ctx.beginPath();
  ctx.moveTo(-19, 12);
  ctx.lineTo(19, 12);
  ctx.lineTo(0, -16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.pie;
  ctx.beginPath();
  ctx.moveTo(-15, 8);
  ctx.lineTo(15, 8);
  ctx.lineTo(0, -12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ellipse(ctx, 0, -2, 5, 4);
  ctx.restore();
}

function drawBackground(ctx, state) {
  const scroll = state.scrolled;
  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, 420);
  sky.addColorStop(0, PALETTE.skyTop);
  sky.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 430);
  // Sun.
  ctx.fillStyle = PALETTE.sun;
  ellipse(ctx, 1120, 90, 46, 46);
  ctx.fillStyle = 'rgba(255, 217, 77, 0.35)';
  ellipse(ctx, 1120, 90, 66, 66);
  // Clouds, drifting slowly.
  ctx.fillStyle = PALETTE.cloud;
  const clouds = [
    [140, 80, 1], [520, 130, 0.8], [880, 60, 1.1], [1180, 170, 0.7], [300, 200, 0.9],
  ];
  for (const [cx, cy, s] of clouds) {
    const x = (((cx - scroll * 0.12) % 1400) + 1400) % 1400 - 60;
    ctx.beginPath();
    ctx.ellipse(x, cy, 52 * s, 20 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 34 * s, cy + 6 * s, 38 * s, 16 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(x - 36 * s, cy + 8 * s, 34 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Far hill and the red barn.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.quadraticCurveTo(320, 300, 640, 390);
  ctx.quadraticCurveTo(960, 320, 1280, 390);
  ctx.lineTo(1280, 430);
  ctx.lineTo(0, 430);
  ctx.closePath();
  ctx.fill();
  const barnX = (((1080 - scroll * 0.25) % 1700) + 1700) % 1700 - 200;
  ctx.fillStyle = PALETTE.barn;
  ctx.fillRect(barnX, 300, 150, 100);
  ctx.fillStyle = PALETTE.barnRoof;
  ctx.beginPath();
  ctx.moveTo(barnX - 10, 302);
  ctx.lineTo(barnX + 75, 252);
  ctx.lineTo(barnX + 160, 302);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fdf3c4';
  ctx.fillRect(barnX + 62, 352, 26, 48);
  ctx.strokeStyle = '#7e2f1d';
  ctx.lineWidth = 3;
  ctx.strokeRect(barnX + 62, 352, 26, 48);
  // Near hill.
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, 430);
  ctx.quadraticCurveTo(400, 370, 800, 425);
  ctx.quadraticCurveTo(1100, 390, 1280, 420);
  ctx.lineTo(1280, 460);
  ctx.lineTo(0, 460);
  ctx.closePath();
  ctx.fill();
  // Ground and lane stripes.
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, 360, W, 360);
  for (let i = 0; i < LANES.length; i += 1) {
    ctx.fillStyle = PALETTE.lane[i];
    ctx.fillRect(0, LANES[i] - 34, W, 68);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(0, LANES[i] - 34, W, 4);
  }
  // Grass tufts and fence posts scrolling past.
  ctx.fillStyle = PALETTE.grass;
  for (let x = -((scroll * 1) % 90); x < W; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x + 700, 372);
    ctx.lineTo(x + 706, 360);
    ctx.lineTo(x + 712, 372);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.fence;
  for (let x = -((scroll * 1) % 160); x < W + 40; x += 160) {
    ctx.fillRect(x + 900, 356, 8, 30);
  }
  ctx.fillRect(0, 362, W, 5);
}

function shadow(ctx, x, groundY, rx, lift = 0) {
  const shrink = Math.max(0.4, 1 - lift / 300);
  ctx.fillStyle = 'rgba(40, 26, 10, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, groundY + 4, rx * shrink, 6 * shrink, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEntities(ctx, state) {
  const { player } = state;
  const groundY = LANES[player.lane];
  // The farmer, closing in as the gap shrinks.
  const farmerX = PLAYER.x - 170 - state.gap * 1.0;
  shadow(ctx, farmerX, LANES[1], 34);
  drawFarmer(ctx, farmerX, LANES[1], 1.15, state.player.runPhase);
  // Entities, far lane first so nearer ones overlap.
  const sorted = state.entities.filter((e) => e.active).sort((a, b) => a.lane - b.lane);
  for (const e of sorted) {
    const scale = LANE_SCALE[e.lane];
    const gy = LANES[e.lane];
    shadow(ctx, e.x, gy, Math.max(20, e.w * 0.45));
    if (e.kind === KIND_OVEN) drawOven(ctx, e.x, gy, scale, state.time);
    else if (e.kind === KIND_KNIFE) drawKnife(ctx, e.x, gy, scale, state.time);
    else if (e.kind === KIND_BALE) drawBale(ctx, e.x, gy, scale);
    else if (e.kind === KIND_CORN) drawCorn(ctx, e.x, gy, scale, e.bob);
    else if (e.kind === KIND_PIE) drawPie(ctx, e.x, gy, scale, e.bob);
  }
  // The turkey, flashing while invulnerable after a hit.
  const flashing = player.invuln > 0 && Math.floor(state.time * 12) % 2 === 0;
  if (!flashing) {
    shadow(ctx, PLAYER.x, groundY, 30, player.jumpY);
    drawTurkey(ctx, PLAYER.x, groundY, LANE_SCALE[player.lane], player.runPhase, player.jumpY);
  }
}

function drawHud(ctx, state, muted) {
  // Top bar.
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, 16, 12, 1248, 64, 12);
  ctx.fill();
  text(ctx, `SCORE  ${state.score}`, 36, 44, 26, PALETTE.text, 'left');
  const remaining = Math.max(0, GOAL_METRES - Math.floor(state.distance));
  text(ctx, `${Math.floor(state.distance)}m  ·  ${remaining}m to the freedom woods`, 640, 32, 20, PALETTE.text);
  // Distance progress bar.
  const barW = 420;
  const bx = 640 - barW / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, bx, 50, barW, 12, 6);
  ctx.fill();
  ctx.fillStyle = PALETTE.good;
  rr(ctx, bx, 50, barW * Math.min(1, state.distance / GOAL_METRES), 12, 6);
  ctx.fill();
  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    const hx = 1130 + i * 34;
    ctx.fillStyle = i < state.lives ? '#ff5a6e' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(hx, 52);
    ctx.bezierCurveTo(hx - 12, 38, hx - 22, 48, hx, 60);
    ctx.bezierCurveTo(hx + 22, 48, hx + 12, 38, hx, 52);
    ctx.fill();
  }
  // Farmer gap bar: how close Bram is.
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, 16, 84, 300, 40, 10);
  ctx.fill();
  text(ctx, 'FARMER', 28, 104, 15, PALETTE.muted, 'left');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, 108, 96, 180, 14, 7);
  ctx.fill();
  ctx.fillStyle = state.gap < 30 ? PALETTE.danger : PALETTE.good;
  rr(ctx, 108, 96, 180 * (state.gap / FARMER.startGap), 14, 7);
  ctx.fill();
  if (state.gap < 30) text(ctx, 'HE IS RIGHT BEHIND YOU!', 300, 104, 15, PALETTE.danger, 'left');
  if (muted) text(ctx, 'MUTED (M)', 1248, 104, 14, PALETTE.muted, 'right');
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(20, 26, 20, 0.82)';
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 248, 231, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawTitle(state, best) {
    drawBackground(ctx, state);
    drawFarmer(ctx, 90, LANES[1], 1.3, state.player.runPhase);
    drawTurkey(ctx, 215, LANES[1], 1.25, state.player.runPhase, 0);
    drawOven(ctx, 1100, LANES[2], 1.0, state.time);
    drawKnife(ctx, 1150, LANES[0], 1.0, state.time);
    ctx.fillStyle = 'rgba(20, 26, 20, 0.45)';
    ctx.fillRect(0, 0, W, H);
    panel(ctx, 290, 84, 700, 552);
    text(ctx, 'GOBBLE RUN', 640, 150, 64, '#ffd94d');
    text(ctx, 'The Great Turkey Escape', 640, 200, 26, PALETTE.text);
    text(ctx, 'Thanksgiving is coming. Farmer Bram has the oven hot', 640, 262, 20, PALETTE.text, 'center', 'normal');
    text(ctx, 'and the carving knife out. Run 1500 metres to the', 640, 290, 20, PALETTE.text, 'center', 'normal');
    text(ctx, 'freedom woods — and do not get caught.', 640, 318, 20, PALETTE.text, 'center', 'normal');
    text(ctx, '↑ / W  lane up      ↓ / S  lane down', 640, 380, 20, PALETTE.text, 'center', 'normal');
    text(ctx, 'SPACE  jump the knife and the hay bales', 640, 410, 20, PALETTE.text, 'center', 'normal');
    text(ctx, 'Mouse: click top / bottom to change lane, middle to jump', 640, 440, 20, PALETTE.muted, 'center', 'normal');
    text(ctx, 'Ovens cannot be jumped — go around them!', 640, 478, 20, '#ffb347', 'center', 'normal');
    text(ctx, 'P pause   ·   M mute', 640, 512, 18, PALETTE.muted, 'center', 'normal');
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) text(ctx, 'PRESS SPACE OR CLICK TO RUN', 640, 566, 24, PALETTE.good);
    if (best > 0) text(ctx, `Best score: ${best}`, 640, 606, 18, PALETTE.muted);
  }

  function drawOver(state, best) {
    drawBackground(ctx, state);
    if (state.reason === 'escaped') {
      drawTurkey(ctx, 1080, LANES[1], 1.5, 0, 0);
      ctx.fillStyle = 'rgba(30, 60, 20, 0.5)';
      ctx.fillRect(0, 0, W, H);
      panel(ctx, 340, 150, 600, 420);
      text(ctx, 'ESCAPED!', 640, 210, 58, PALETTE.good);
      text(ctx, 'Giblet made it to the freedom woods.', 640, 268, 22, PALETTE.text, 'center', 'normal');
      text(ctx, 'No Thanksgiving dinner this year!', 640, 298, 22, PALETTE.text, 'center', 'normal');
    } else {
      drawFarmer(ctx, PLAYER.x - 70, LANES[1], 1.3, 0);
      drawTurkey(ctx, PLAYER.x, LANES[1], 1.0, 0, 0);
      ctx.fillStyle = 'rgba(60, 10, 10, 0.5)';
      ctx.fillRect(0, 0, W, H);
      panel(ctx, 340, 150, 600, 420);
      text(ctx, 'CAUGHT!', 640, 210, 58, PALETTE.danger);
      text(ctx, 'Farmer Bram got his turkey after all.', 640, 268, 22, PALETTE.text, 'center', 'normal');
      text(ctx, 'The oven was already hot…', 640, 298, 22, PALETTE.text, 'center', 'normal');
    }
    text(ctx, `Score  ${state.score}`, 640, 360, 30, PALETTE.text);
    text(ctx, `Distance  ${Math.floor(state.distance)}m of ${GOAL_METRES}m`, 640, 400, 22, PALETTE.text, 'center', 'normal');
    text(ctx, `Best  ${best}`, 640, 432, 22, PALETTE.muted, 'center', 'normal');
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) text(ctx, 'PRESS SPACE OR CLICK TO RUN AGAIN', 640, 500, 22, PALETTE.good);
    text(ctx, 'R restarts too', 640, 534, 16, PALETTE.muted);
  }

  return {
    draw(state, screen, best, muted = false) {
      ctx.clearRect(0, 0, W, H);
      if (screen === SCREEN_TITLE) {
        drawTitle(state, best);
        return;
      }
      drawBackground(ctx, state);
      drawEntities(ctx, state);
      drawHud(ctx, state, muted);
      if (screen === SCREEN_OVER) {
        drawOver(state, best);
      } else if (screen === SCREEN_PAUSED) {
        ctx.fillStyle = 'rgba(20, 26, 20, 0.55)';
        ctx.fillRect(0, 0, W, H);
        panel(ctx, 440, 260, 400, 200);
        text(ctx, 'PAUSED', 640, 320, 44, PALETTE.text);
        text(ctx, 'P or Space to keep running', 640, 380, 20, PALETTE.muted, 'center', 'normal');
      } else if (screen === SCREEN_PLAY && state.distance < 30) {
        text(ctx, '↑ ↓ change lane   ·   SPACE jump   ·   grab the corn!', 640, 660, 20, PALETTE.text);
      }
    },
  };
}
