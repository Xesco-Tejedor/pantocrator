'use strict';
/* =========================================================================
   PANTOCRÀTOR — arcade d'acció i plataformes a les ruïnes del MNAC
   Homenatge jugable a la placa arcade de 1987. Obra 100% original:
   sprites procedurals per píxels, música xip sintetitzada, sense assets
   de tercers.
   ========================================================================= */
const VW = 480, VH = 270;                 // resolució interna (pixel art)
const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
ctx.imageSmoothingEnabled = false;

function fitCanvas() {
  const aw = window.innerWidth, ah = window.innerHeight;
  const s = Math.min(aw / VW, ah / VH);
  cvs.style.width  = Math.floor(VW * s) + 'px';
  cvs.style.height = Math.floor(VH * s) + 'px';
}
window.addEventListener('resize', fitCanvas);
window.addEventListener('orientationchange', () => setTimeout(fitCanvas, 200));
fitCanvas();

/* ---------------------------------------------------------------- helpers */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/* ------------------------------------------------------- sprites per píxels */
function pix(map, pal, x, y, s, flip) {
  const h = map.length, w = map[0].length;
  for (let j = 0; j < h; j++) {
    const row = map[j];
    for (let i = 0; i < w; i++) {
      const c = pal[row[i]];
      if (!c) continue;
      ctx.fillStyle = c;
      const px = flip ? (w - 1 - i) : i;
      ctx.fillRect(Math.round(x + px * s), Math.round(y + j * s), s, s);
    }
  }
}

const PAL = {
  k:'#14100c', s:'#e8b07f', d:'#b07a4e', h:'#3a2415', p:'#6b4f2a', b:'#2e1f10',
  w:'#b9c4d2', W:'#f4f8ff', g:'#d8a23a', r:'#a83232', R:'#e05050', m:'#7a5c8f',
  G:'#8f9aa8', D:'#5d6672', E:'#f2d78a', n:'#2c3e50', o:'#c96f2e', v:'#4a6741',
  c:'#caa86a', C:'#8a6f42', t:'#3f6b4f', l:'#7fd4e8', B:'#274b63', u:'#e8e4d8'
};

/* Guerrer (16x24). Animacions: idle, run x2, jump, attack, dive, hang, hurt */
const SPR = {
  idle: [
  '....kkkk........',
  '...khhhhk.......',
  '...khssk........',
  '...ksssk........',
  '....ksdsk.......',
  '..kksssssk......',
  '.kssksskssk.....',
  '.kskkssksk......',
  '.kk.kppk.k......',
  '....kpppk.......',
  '....kp.kpk......',
  '....kp.kpk......',
  '....kb.kbk......',
  '....kb.kbk......',
  '...kbb.kbbk.....',
  '................'],
  run1: [
  '....kkkk........',
  '...khhhhk.......',
  '...khssk........',
  '...ksssk........',
  '....ksdsk.......',
  '..kksssssk......',
  '.kssksskssk.....',
  '.kskkssksk......',
  '.kk.kppk........',
  '...kpppk........',
  '..kpp.kppk......',
  '.kpk...kpk......',
  '.kb....kbk......',
  'kbb.....kbb.....',
  '................',
  '................'],
  run2: [
  '....kkkk........',
  '...khhhhk.......',
  '...khssk........',
  '...ksssk........',
  '....ksdsk.......',
  '..kksssssk......',
  '.kssksskssk.....',
  '.kskkssksk......',
  '.kk.kppk........',
  '....kpppk.......',
  '....kppk........',
  '...kp..kpk......',
  '...kb...kb......',
  '...kbb..kbbk....',
  '................',
  '................'],
  jump: [
  '....kkkk........',
  '...khhhhk.......',
  '...khssk........',
  '...ksssk........',
  '....ksdsk.......',
  '.kkkssssskk.....',
  'kssskssksssk....',
  '.kk.kppk.kk.....',
  '....kpppk.......',
  '...kppppk.......',
  '...kp..kpk......',
  '..kpk..kpk......',
  '..kb...kbk......',
  '.kbb...kbbk.....',
  '................',
  '................'],
  attack: [
  '....kkkk....kkk.',
  '...khhhhk..kWWwk',
  '...khssk..kWwkk.',
  '...ksssk.kWwk...',
  '....ksdskWwk....',
  '..kksssskgk.....',
  '.kssksskssk.....',
  '.kskkssksk......',
  '.kk.kppk........',
  '....kpppk.......',
  '....kp.kpk......',
  '....kp.kpk......',
  '....kb.kbk......',
  '...kbb.kbbk.....',
  '................',
  '................'],
  dive: [
  '....kkkk........',
  '...khhhhk.......',
  '...khssk........',
  '...ksssk........',
  '....ksdsk.......',
  '.kkksssssk......',
  'kssskssksk......',
  '.kk.kppkkk......',
  '....kpppk.......',
  '....kppk........',
  '....kp.k........',
  '....kgk.........',
  '....kWwk........',
  '....kWwk........',
  '.....kwk........',
  '.....kk.........'],
  hang: [
  '....kkkk........',
  '...kskkks.......',
  '...ksssssk......',
  '....khssk.......',
  '....ksssk.......',
  '....ksdsk.......',
  '....ksssk.......',
  '....kpppk.......',
  '....kppk........',
  '....kppk........',
  '....kpk.........',
  '....kbk.........',
  '....kbk.........',
  '...kbbk.........',
  '................',
  '................']
};
for (const k in SPR) { while (SPR[k].length < 24) SPR[k].push('................'); }

/* Bèstia capitelleSC (16x12) */
const BEAST1 = [
 '..kk........kk..',
 '.kGGk......kGGk.',
 'kGGGGkkkkkkGGGGk',
 'kGkGGGGGGGGGkGk.',
 'kGGGRGGGGGRGGGk.',
 '.kGGGGGGGGGGGGk.',
 '..kGGkkkkkkGGk..',
 '..kGGkDDDDkGGk..',
 '.kGGGGkkkkGGGGk.',
 '.kDkGGGGGGGGkDk.',
 'kDk.kDk..kDk.kDk',
 'kk..kk...kk...kk'];
const BEAST2 = [
 '..kk........kk..',
 '.kGGk......kGGk.',
 'kGGGGkkkkkkGGGGk',
 'kGkGGGGGGGGGkGk',
 'kGGGRGGGGGRGGGk',
 '.kGGGGGGGGGGGGk',
 '..kGGkkkkkkGGk.',
 '..kGGkDDDDkGGk.',
 '..kGGGGkkGGGGk.',
 '..kDkGGGGkDk...',
 '...kDk.kDk.kDk.',
 '...kk..kk...kk.'];

/* Dimoni de Taüll (12x10) */
const DEMON1 = [
 '.kk......kk.',
 'kRRk....kRRk',
 'kRrrkkkkrrRk',
 '.krRRRRRRrk.',
 '.krRkrrkRrk.',
 '..krrrrrrk..',
 '..krkrrkrk..',
 '.kk.kkkk.kk.',
 '.k........k.',
 'k..........k'];
const DEMON2 = [
 '............',
 '.kk......kk.',
 'kRRk....kRRk',
 'kRrrkkkkrrRk',
 '.krRRRRRRrk.',
 '.krRkrrkRrk.',
 '..krrrrrrk..',
 '.kkrkrrkrkk.',
 'k...kkkk...k',
 '............'];

/* Vitrina gòtica (14x22) */
const VITRINA = [
 '.....kkkk.....',
 '...kkCCCckk...',
 '..kCccccccCk..',
 '.kCcllllllcCk.',
 '.kClWWWWlLCk..',
 '.kClWggWlLCk..',
 'kCclWggWlLcck.',
 'kClWggggWlLCk.',
 'kClWggggWlLCk.',
 'kCclWggWlLcck',
 '.kClWggWlLCk..',
 '.kCllllllLCk..',
 '.kCccccccCCk..',
 '.kCCCCCCCCCk..',
 'kCCkCCCCkCCk..',
 'kCk.kCCCk.kCk.',
 'kk..kCCCk..kk.',
 '....kCCCk.....',
 '....kCCCk.....',
 '...kCCCCCk....',
 '...kkkkkkk....',
 '..............'];

/* Espasa icona HUD (10x10) */
const SWORDICON = [
 '....kk....',
 '...kWWk...',
 '...kWwk...',
 '...kWwk...',
 '...kWwk...',
 '..kggggk..',
 '...kggk...',
 '...kggk...',
 '..kkggkk..',
 '....kk....'];

/* -------------------------------------------------------------- audio xip */
const sfx = {
  ctx: null, master: null, musicBus: null, muted: false, seqTimer: null, track: null,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain(); this.musicBus.gain.value = 0.34;
      this.musicBus.connect(this.master);
    } catch (e) { this.ctx = null; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },
  tone(f, t, dur, type, vol, slide) {
    if (!this.ctx || this.muted) return;
    try {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  swing()  { this.tone(720, this.now(), 0.09, 'square', 0.10, -420); },
  hit()    { this.tone(180, this.now(), 0.10, 'sawtooth', 0.16, -110); },
  smash()  { const t = this.now(); this.tone(320, t, 0.08, 'square', 0.14, -180); this.tone(160, t + 0.05, 0.14, 'triangle', 0.16, -80); },
  pickup() { const t = this.now(); [523, 659, 784, 1046].forEach((f, i) => this.tone(f, t + i * 0.07, 0.1, 'square', 0.11)); },
  jumpS()  { this.tone(280, this.now(), 0.12, 'square', 0.09, 220); },
  grabS()  { this.tone(520, this.now(), 0.08, 'triangle', 0.12, 160); },
  hurtS()  { this.tone(220, this.now(), 0.16, 'sawtooth', 0.16, -140); },
  orbS()   { this.tone(880, this.now(), 0.14, 'sine', 0.10, -300); },
  deflect(){ const t = this.now(); this.tone(1046, t, 0.06, 'square', 0.12); this.tone(1568, t + 0.05, 0.09, 'square', 0.10); },
  deathS() { const t = this.now(); [392, 330, 262, 196].forEach((f, i) => this.tone(f, t + i * 0.13, 0.16, 'triangle', 0.13)); },
  clearS() { const t = this.now(); [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, t + i * 0.09, 0.14, 'square', 0.11)); },
  bossHit(){ this.tone(90, this.now(), 0.2, 'sawtooth', 0.2, -40); },
  /* Seqüenciador senzill: baix + melodia, estil placa 1987 */
  THEMES: {
    title: { bpm: 96, bass: [0, null, 0, null, -2, null, 0, null, 3, null, 2, null, 0, null, -2, null],
             mel:  [7, null, 10, null, 12, null, 10, 7, 8, null, 7, null, 5, 7, null, null] },
    stage: { bpm: 132, bass: [0, 0, null, 0, 0, null, 0, -2, 0, 0, null, 0, 3, null, 2, null],
             mel:  [null, 12, null, 10, null, 7, null, null, 12, null, 14, null, 12, 10, null, 7] },
    boss:  { bpm: 150, bass: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, -2, -2, -1, -1],
             mel:  [13, null, 12, 13, null, 12, null, 8, 13, null, 15, null, 13, 12, 8, null] }
  },
  ROOT: 110,
  nfreq(n) { return this.ROOT * Math.pow(2, n / 12); },
  playMusic(name) {
    if (!this.ctx) return;
    this.stopMusic();
    this.track = name;
    const th = this.THEMES[name]; if (!th) return;
    let step = 0;
    const spb = 60 / th.bpm / 2; // corxeres
    const tick = () => {
      if (!this.ctx || this.muted || this.track !== name) return;
      const t = this.ctx.currentTime;
      const b = th.bass[step % 16], m = th.mel[step % 16];
      if (b !== null && b !== undefined) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'triangle'; o.frequency.value = this.nfreq(b);
        g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.02, t + spb * 0.95);
        o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + spb);
      }
      if (m !== null && m !== undefined) {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'square'; o.frequency.value = this.nfreq(m);
        g.gain.setValueAtTime(0.16, t); g.gain.exponentialRampToValueAtTime(0.01, t + spb * 0.9);
        o.connect(g); g.connect(this.musicBus); o.start(t); o.stop(t + spb);
      }
      step++;
    };
    tick();
    this.seqTimer = setInterval(tick, spb * 1000);
  },
  stopMusic() { if (this.seqTimer) { clearInterval(this.seqTimer); this.seqTimer = null; } this.track = null; },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
  }
};

/* ---------------------------------------------------------------- entrada */
const input = {
  left: false, right: false, up: false, down: false,
  jump: false, attack: false,
  jumpBuf: 0, attackBuf: 0,
  jumpHeld: false, attackHeld: false,
  pressJump()   { this.jump = true; this.jumpBuf = 7; },
  pressAttack() { this.attack = true; this.attackBuf = 7; }
};
const KEYMAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down'
};
window.addEventListener('keydown', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (KEYMAP[k]) { input[KEYMAP[k]] = true; e.preventDefault(); }
  if (k === ' ' || k === 'z' || k === 'Z') { if (!input.jumpHeld) input.pressJump(); input.jumpHeld = true; e.preventDefault(); }
  if (k === 'x' || k === 'X' || k === 'j' || k === 'J') { if (!input.attackHeld) input.pressAttack(); input.attackHeld = true; e.preventDefault(); }
  if (k === 'm' || k === 'M') { sfx.init(); sfx.toggleMute(); }
  if (k === 'Enter') gameStartGesture();
});
window.addEventListener('keyup', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (KEYMAP[k]) input[KEYMAP[k]] = false;
  if (k === ' ' || k === 'z' || k === 'Z') input.jumpHeld = false;
  if (k === 'x' || k === 'X' || k === 'j' || k === 'J') input.attackHeld = false;
});

/* --- joystick virtual octodireccional amb zona morta de 30px --- */
const padEl = document.getElementById('pad');
const DEADZONE = 30;
let padTouchId = null;
function padVector(t) {
  const r = padEl.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const dx = t.clientX - cx, dy = t.clientY - cy;
  if (Math.hypot(dx, dy) < DEADZONE) return { l: 0, r: 0, u: 0, d: 0 };
  const ang = Math.atan2(dy, dx); // octants
  const o = Math.round(ang / (Math.PI / 4));
  return {
    l: (o >= 3 || o <= -3) ? 1 : 0,
    r: (o >= -1 && o <= 1) ? 1 : 0,
    u: (o <= -1 && o >= -3) ? 1 : 0,
    d: (o >= 1 && o <= 3) ? 1 : 0
  };
}
function applyPad(v) { input.left = !!v.l; input.right = !!v.r; input.up = !!v.u; input.down = !!v.d; }
const btnA = document.getElementById('btnAttack');
const btnJ = document.getElementById('btnJump');
function touchHandler(e) {
  e.preventDefault();
  sfx.init(); sfx.resume(); gameStartGesture();
  for (const t of e.changedTouches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (e.type === 'touchstart') {
      if (el === btnA || btnA.contains(el)) {
        if (!input.attackHeld) input.pressAttack();
        input.attackHeld = true; btnA.classList.add('pressed');
      } else if (el === btnJ || btnJ.contains(el)) {
        if (!input.jumpHeld) input.pressJump();
        input.jumpHeld = true; btnJ.classList.add('pressed');
      } else if (padTouchId === null && t.clientX < window.innerWidth * 0.45 && t.clientY > window.innerHeight * 0.35) {
        padTouchId = t.identifier; padEl.classList.add('active');
        applyPad(padVector(t));
      }
    } else if (e.type === 'touchmove') {
      if (t.identifier === padTouchId) applyPad(padVector(t));
    } else { // end / cancel
      if (t.identifier === padTouchId) {
        padTouchId = null; padEl.classList.remove('active');
        applyPad({ l: 0, r: 0, u: 0, d: 0 });
      }
      const el2 = document.elementFromPoint(t.clientX, t.clientY);
      if (el2 !== btnA && !btnA.contains(el2 || btnA)) { input.attackHeld = false; btnA.classList.remove('pressed'); }
      if (el2 !== btnJ && !btnJ.contains(el2 || btnJ)) { input.jumpHeld = false; btnJ.classList.remove('pressed'); }
    }
  }
}
for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel'])
  window.addEventListener(ev, touchHandler, { passive: false });
window.addEventListener('mousedown', () => { sfx.init(); sfx.resume(); gameStartGesture(); });
window.addEventListener('blur', () => {
  input.left = input.right = input.up = input.down = false;
  input.jumpHeld = input.attackHeld = false;
  padTouchId = null;
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { input.left = input.right = input.up = input.down = false; }
});

/* ------------------------------------------------------------------ nivells */
/* Coordenades de món. Terra principal: y=216. Pis inferior sota els forats:
   y=296 (sense mort instantània: caure costa 1 HP i toca pujar de nou). */
const GY = 216, LY = 296;
const STAGES = [
  {
    name: 'VESTÍBUL EN RUÏNES', time: 200, length: 2300, mural: 0,
    ground: [{ x: 0, w: 560 }, { x: 660, w: 460 }, { x: 1220, w: 480 }, { x: 1800, w: 500 }],
    lower: [{ x: 540, w: 160 }, { x: 1100, w: 160 }, { x: 1680, w: 160 }],
    platforms: [
      { x: 300, y: 150, w: 88, h: 8, t: 'bench' }, { x: 700, y: 168, w: 88, h: 8, t: 'bench' },
      { x: 980, y: 120, w: 72, h: 8, t: 'bench' }, { x: 1300, y: 150, w: 96, h: 8, t: 'bench' },
      { x: 1560, y: 110, w: 72, h: 8, t: 'bench' }, { x: 1150, y: 250, w: 60, h: 8, t: 'stone' },
      { x: 1730, y: 250, w: 60, h: 8, t: 'stone' }, { x: 1950, y: 160, w: 88, h: 8, t: 'bench' }
    ],
    chandeliers: [{ x: 880, y: 40, len: 60 }, { x: 1500, y: 30, len: 66 }],
    vitrinas: [{ x: 420, y: GY, c: 'sword' }, { x: 1400, y: GY, c: 'shield' }],
    enemies: [
      { x: 480, y: GY, t: 'beast' }, { x: 760, y: GY, t: 'beast' }, { x: 1050, y: GY, t: 'demon' },
      { x: 1350, y: GY, t: 'beast' }, { x: 1650, y: GY, t: 'demon' }, { x: 2000, y: GY, t: 'beast' },
      { x: 600, y: LY, t: 'beast' }, { x: 1160, y: LY, t: 'beast' }, { x: 1740, y: LY, t: 'beast' }
    ]
  },
  {
    name: 'SALA ROMÀNICA', time: 190, length: 2500, mural: 1,
    ground: [{ x: 0, w: 420 }, { x: 540, w: 380 }, { x: 1020, w: 420 }, { x: 1560, w: 340 }, { x: 2000, w: 500 }],
    lower: [{ x: 400, w: 180 }, { x: 900, w: 180 }, { x: 1420, w: 180 }, { x: 1880, w: 160 }],
    platforms: [
      { x: 200, y: 150, w: 80, h: 8, t: 'bench' }, { x: 600, y: 120, w: 72, h: 8, t: 'bench' },
      { x: 820, y: 160, w: 80, h: 8, t: 'bench' }, { x: 1100, y: 130, w: 64, h: 8, t: 'moving', ax: 1100, dx: 90, sp: 0.9 },
      { x: 1350, y: 100, w: 80, h: 8, t: 'bench' }, { x: 1650, y: 150, w: 72, h: 8, t: 'moving', ax: 1650, dx: 70, sp: 1.2 },
      { x: 450, y: 250, w: 56, h: 8, t: 'stone' }, { x: 1470, y: 250, w: 56, h: 8, t: 'stone' },
      { x: 2100, y: 140, w: 88, h: 8, t: 'bench' }, { x: 2300, y: 100, w: 72, h: 8, t: 'bench' }
    ],
    chandeliers: [{ x: 480, y: 36, len: 62 }, { x: 1000, y: 30, len: 70 }, { x: 1560, y: 34, len: 60 }, { x: 2050, y: 40, len: 56 }],
    vitrinas: [{ x: 250, y: GY, c: 'armor' }, { x: 1200, y: GY, c: 'sword' }, { x: 2150, y: GY, c: 'shield' }],
    enemies: [
      { x: 320, y: GY, t: 'beast' }, { x: 620, y: GY, t: 'demon' }, { x: 800, y: GY, t: 'beast' },
      { x: 1150, y: GY, t: 'beast' }, { x: 1300, y: GY, t: 'demon' }, { x: 1700, y: GY, t: 'beast' },
      { x: 1950, y: GY, t: 'demon' }, { x: 2200, y: GY, t: 'beast' }, { x: 2400, y: GY, t: 'beast' },
      { x: 470, y: LY, t: 'beast' }, { x: 960, y: LY, t: 'beast' }, { x: 1480, y: LY, t: 'beast' }, { x: 1920, y: LY, t: 'beast' }
    ]
  },
  {
    name: 'EL PANTOCRÀTOR', time: 240, length: 700, mural: 2, boss: true,
    ground: [{ x: 0, w: 700 }],
    lower: [],
    platforms: [{ x: 140, y: 160, w: 88, h: 8, t: 'bench' }, { x: 420, y: 160, w: 88, h: 8, t: 'bench' }],
    chandeliers: [{ x: 340, y: 36, len: 64 }],
    vitrinas: [{ x: 80, y: GY, c: 'sword' }],
    enemies: []
  }
];

/* ------------------------------------------------------------------- món */
const world = {
  stageIdx: 0, stage: null, enemies: [], vitrinas: [], orbs: [], parts: [], items: [],
  camX: 0, camY: 0, shake: 0, boss: null
};

function loadStage(i) {
  world.stageIdx = i;
  const s = STAGES[i];
  world.stage = s;
  world.enemies = s.enemies.map(e => makeEnemy(e.t, e.x, e.y));
  world.vitrinas = s.vitrinas.map(v => ({ x: v.x, y: v.y, w: 14, h: 22, c: v.c, broken: false }));
  world.orbs = []; world.parts = []; world.items = [];
  world.boss = s.boss ? {
    x: 560, y: 40, hp: 8, maxHp: 8, phase: 0, t: 0, shootT: 90, pillarT: 260,
    pillarX: -1, pillarWarn: 0, pillarAct: 0, flash: 0
  } : null;
  player.x = 40; player.y = GY - player.h; player.vx = 0; player.vy = 0;
  player.state = 'idle'; player.timer = s.time * 60; player.invuln = 90;
  player.onLower = false; player.hangCh = null; player.fellFromY = null;
  world.camX = 0; world.camY = 0; world.shake = 0;
}

function makeEnemy(t, x, y) {
  if (t === 'beast') return { t, x, y: y - 12, w: 15, h: 12, vx: 0.5, hp: 2, dir: Math.random() < 0.5 ? -1 : 1, anim: 0, baseY: y - 12, hit: 0 };
  return { t, x, y: y - 60, w: 12, h: 10, hp: 1, anim: 0, baseY: y - 60, ph: rnd(0, 6), diveT: rnd(120, 300), diving: 0, hit: 0 };
}

/* ------------------------------------------------------------------ jugador */
const JUMP_TOLERANCE = 8;    // coyote time (frames), segons el disseny
const MAGNETIC_RADIUS = 48;  // ancoratge magnètic als elements penjants
const player = {
  x: 40, y: 100, w: 11, h: 20, vx: 0, vy: 0, dir: 1,
  state: 'idle', anim: 0, coyote: 0, invuln: 0, timer: 0,
  hp: 12, maxHp: 12, lives: 3, score: 0, weapon: 1, armor: 0, shield: 0,
  onGround: false, onLower: false, hangCh: null, hangSwing: 0, fellFromY: null,
  attackT: 0, dead: false
};

function playerDamage(n, fromX) {
  if (player.invuln > 0 || player.dead) return;
  if (player.shield > 0) { player.shield--; sfx.smash(); player.invuln = 60; spawnParts(player.x + 6, player.y + 8, '#7fd4e8', 8); return; }
  const dmg = player.armor > 0 ? Math.max(1, Math.floor(n / 2)) : n;
  player.hp -= dmg;
  player.invuln = 70;
  sfx.hurtS();
  spawnParts(player.x + 6, player.y + 8, '#e05050', 6);
  world.shake = 6;
  if (!player.onGround) {
    /* SENSE RETROCÉS AERI: l'impacte descompta vida però respecta la
       trajectòria parabòlica del salt. */
  } else {
    player.vx = (player.x + player.w / 2 < fromX ? -1 : 1) * 1.6;
  }
  if (player.hp <= 0) killPlayer();
}

function killPlayer() {
  if (player.dead) return;
  player.dead = true; player.state = 'dead'; player.anim = 0;
  sfx.deathS(); sfx.stopMusic();
}

function spawnParts(x, y, color, n) {
  for (let i = 0; i < n; i++)
    world.parts.push({ x, y, vx: rnd(-1.6, 1.6), vy: rnd(-2.4, -0.4), life: rnd(20, 40), color });
}

/* ------------------------------------------------------------- física jugador */
const GRAV = 0.32, RUN = 1.55, JUMPV = -6.3;

function floorsAt(x, w) {
  // retorna llista de superfícies sòlides: segments de terra, pis inferior i plataformes
  const s = world.stage, out = [];
  for (const g of s.ground) out.push({ x: g.x, y: GY, w: g.w, h: 200 });
  for (const g of s.lower) out.push({ x: g.x, y: LY, w: g.w, h: 200 });
  for (const p of s.platforms) out.push({ x: p.x, y: p.y, w: p.w, h: p.h, oneway: true, mv: p });
  return out;
}

function updatePlayer() {
  if (player.dead) { player.anim++; if (player.anim > 110) loseLife(); return; }

  player.timer--;
  if (player.timer <= 0) { killPlayer(); return; }
  if (player.invuln > 0) player.invuln--;
  if (input.jumpBuf > 0) input.jumpBuf--;
  if (input.attackBuf > 0) input.attackBuf--;
  if (player.coyote > 0) player.coyote--;

  /* ---------- penjat d'un element penjant (làmpara) ---------- */
  if (player.state === 'hang') {
    const ch = player.hangCh;
    if (input.left) player.hangSwing -= 0.045;
    if (input.right) player.hangSwing += 0.045;
    player.hangSwing *= 0.985;
    player.hangSwing = clamp(player.hangSwing, -1.1, 1.1);
    const hx = ch.x + Math.sin(player.hangSwing) * ch.len;
    const hy = ch.y + Math.cos(player.hangSwing) * ch.len;
    player.x = hx - player.w / 2; player.y = hy;
    player.vx = Math.cos(player.hangSwing) * player.hangSwing * ch.len * 0.14;
    player.vy = 0;
    if (input.jumpBuf > 0) {
      input.jumpBuf = 0;
      player.state = 'air';
      player.vy = JUMPV * 0.92;
      player.vx += Math.cos(player.hangSwing) * player.hangSwing * 3.2;
      player.hangCh = null; sfx.jumpS();
    } else if (input.down) {
      player.state = 'air'; player.hangCh = null; player.vy = 1;
    }
    player.anim++;
    swordHits();
    return;
  }

  /* ---------- moviment horitzontal ---------- */
  const locked = (player.state === 'attack' && player.onGround) || player.state === 'dive';
  if (!locked) {
    if (input.left)  { player.vx = -RUN; player.dir = -1; }
    else if (input.right) { player.vx = RUN; player.dir = 1; }
    else player.vx = 0;
  } else if (player.onGround) player.vx = 0;

  /* ---------- gravetat i salt amb coyote time ---------- */
  player.vy += GRAV;
  if (player.vy > 7) player.vy = 7;
  if (player.onGround) player.coyote = JUMP_TOLERANCE;
  if (input.jumpBuf > 0 && player.coyote > 0) {
    input.jumpBuf = 0; player.coyote = 0;
    player.vy = JUMPV; player.onGround = false; player.state = 'air';
    sfx.jumpS();
  }
  if (!input.jumpHeld && player.vy < -2.2) player.vy = -2.2; // salt variable

  /* ---------- atac ---------- */
  if (input.attackBuf > 0 && player.state !== 'attack' && player.state !== 'dive') {
    input.attackBuf = 0;
    if (!player.onGround && input.down) {
      /* ATAC DESCENDENT: buffer d'entrada, animació fixada en caiguda fins
         a colpejar enemic o tocar terra. */
      player.state = 'dive';
    } else {
      player.state = 'attack'; player.attackT = 0; sfx.swing();
    }
  }
  if (player.state === 'attack') {
    player.attackT++;
    if (player.attackT > 14) player.state = player.onGround ? 'idle' : 'air';
  }

  /* ---------- integració ---------- */
  const prevY = player.y, prevX = player.x;
  player.x += player.vx;
  player.x = clamp(player.x, 4, world.stage.length - player.w - 4);
  player.y += player.vy;

  /* ---------- col·lisions amb superfícies ---------- */
  player.onGround = false;
  const fl = floorsAt(player.x, player.w);
  for (const f of fl) {
    if (f.oneway) {
      // plataforma unidireccional: aterra només caient des de dalt
      if (player.vy >= 0 && prevY + player.h <= f.y + 2 &&
          player.x + player.w > f.x + 1 && player.x < f.x + f.w - 1 &&
          player.y + player.h >= f.y && player.y + player.h <= f.y + f.h + 10) {
        player.y = f.y - player.h; landOn(f);
      }
    } else {
      if (player.x + player.w > f.x && player.x < f.x + f.w &&
          player.y + player.h > f.y && player.y + player.h <= f.y + 30 && player.vy >= 0 &&
          prevY + player.h <= f.y + 12) {
        player.y = f.y - player.h; landOn(f);
      }
    }
  }
  function landOn(f) {
    if (player.state === 'dive') { spawnParts(player.x + 6, player.y + player.h, '#8a6f42', 5); sfx.smash(); }
    /* caiguda des de zona alta al pis inferior: dany lleu d'impacte, no mort */
    if (player.fellFromY !== null && player.y - player.fellFromY > 70) {
      if (player.invuln <= 0) { player.hp -= 1; player.invuln = 60; sfx.hurtS(); if (player.hp <= 0) { killPlayer(); return; } }
    }
    player.fellFromY = null;
    player.vy = 0; player.onGround = true;
    player.onLower = (f.y === LY);
    if (player.state === 'air' || player.state === 'dive') player.state = 'idle';
    if (f.mv && f.mv.t === 'moving') player.x += f.mv._vx || 0;
  }
  if (!player.onGround && player.vy > 1 && player.fellFromY === null) player.fellFromY = player.y;
  if (player.onGround && player.fellFromY !== null && player.y <= player.fellFromY) player.fellFromY = null;

  /* seguritat: mai fora del món per baix */
  if (player.y > 340) { player.y = GY - player.h; player.vy = 0; }

  /* ---------- ancoratge magnètic a làmpares ---------- */
  if (!player.onGround && player.vy > -1 && player.state !== 'dive') {
    for (const ch of world.stage.chandeliers) {
      const hx = ch.x, hy = ch.y + ch.len;
      const d = Math.hypot(player.x + player.w / 2 - hx, player.y - hy);
      if (d < MAGNETIC_RADIUS) {
        player.state = 'hang'; player.hangCh = ch;
        player.hangSwing = clamp(Math.atan2(player.x + player.w / 2 - ch.x, ch.len), -1, 1);
        sfx.grabS(); break;
      }
    }
  }

  /* ---------- estat/animació ---------- */
  if (player.state !== 'attack' && player.state !== 'dive' && player.state !== 'hang') {
    if (!player.onGround) player.state = 'air';
    else if (player.vx !== 0) player.state = 'run';
    else player.state = 'idle';
  }
  player.anim++;

  /* ---------- fi de fase ---------- */
  if (player.x > world.stage.length - 50 && !world.stage.boss) nextStage();

  swordHits();
}

function swordBox() {
  const reach = player.weapon >= 2 ? 22 : 15;
  if (player.state === 'dive') return { x: player.x - 2, y: player.y + player.h - 4, w: player.w + 4, h: 14 };
  if (player.state === 'attack' || (player.state === 'air' && false)) {}
  if (player.state !== 'attack' && player.state !== 'hang') return null;
  return player.dir === 1
    ? { x: player.x + player.w, y: player.y + 2, w: reach, h: 12 }
    : { x: player.x - reach, y: player.y + 2, w: reach, h: 12 };
}

function swordHits() {
  const sb = swordBox();
  if (!sb) return;
  // enemics
  for (const e of world.enemies) {
    if (e.hp <= 0) continue;
    if (overlap(sb, e)) {
      e.hp--; e.hit = 8; sfx.hit();
      spawnParts(e.x + e.w / 2, e.y + e.h / 2, '#c9ced8', 5);
      if (player.state === 'dive') { player.vy = -4.2; player.state = 'air'; } // rebot
      player.score += 10;
      if (e.hp <= 0) {
        player.score += e.t === 'demon' ? 150 : 100;
        spawnParts(e.x + e.w / 2, e.y + e.h / 2, '#8f9aa8', 10);
      }
    }
  }
  // vitrines
  for (const v of world.vitrinas) {
    if (v.broken) continue;
    if (overlap(sb, { x: v.x - 7, y: v.y - 22, w: 14, h: 22 })) {
      v.broken = true; sfx.smash(); player.score += 50;
      spawnParts(v.x, v.y - 12, '#7fd4e8', 10);
      world.items.push({ x: v.x - 6, y: v.y - 26, w: 12, h: 10, c: v.c, vy: -2.2 });
    }
  }
  // orbes del cap: desviar amb l'espasa
  for (const o of world.orbs) {
    if (o.dead || o.returning) continue;
    if (overlap(sb, { x: o.x - 4, y: o.y - 4, w: 8, h: 8 })) {
      o.returning = true; sfx.deflect();
    }
  }
}

/* ---------------------------------------------------------------- enemics */
function updateEnemies() {
  for (const e of world.enemies) {
    if (e.hp <= 0) continue;
    e.anim++;
    if (e.hit > 0) e.hit--;
    const pcx = player.x + player.w / 2;
    if (e.t === 'beast') {
      const near = Math.abs(pcx - (e.x + e.w / 2)) < 90 && Math.abs(player.y - e.y) < 40;
      const sp = near ? 0.95 : 0.45;
      e.dir = near ? (pcx > e.x ? 1 : -1) : e.dir;
      e.x += sp * e.dir;
      // no caure de la seva superfície
      const onSeg = (seg, y) => e.x > seg.x - 4 && e.x + e.w < seg.x + seg.w + 4 && Math.abs(e.baseY - (y - 12)) < 2;
      const inG = world.stage.ground.some(g => onSeg(g, GY)), inL = world.stage.lower.some(g => onSeg(g, LY));
      if (!inG && !inL) { e.dir *= -1; e.x += sp * e.dir * 2; }
      if (!player.dead && player.invuln <= 0 && overlap(player, e)) playerDamage(1, e.x + e.w / 2);
    } else {
      // dimoni: ondula i s'abraona
      e.ph += 0.05;
      if (e.diving > 0) {
        e.diving--;
        e.x += (pcx - e.x) * 0.03;
        e.y += 1.4;
        if (e.diving === 1) { e.baseY = e.y - 70; }
      } else {
        e.y = e.baseY + Math.sin(e.ph) * 8;
        e.x += Math.sin(e.ph * 0.6) * 0.5;
        e.diveT--;
        if (e.diveT <= 0 && Math.abs(pcx - e.x) < 110) { e.diving = 55; e.diveT = rnd(180, 320); }
        if (e.y > e.baseY + 30) e.baseY = e.y - 20;
      }
      if (e.y > 300) { e.y = e.baseY = 120; }
      if (!player.dead && player.invuln <= 0 && overlap(player, e)) playerDamage(1, e.x + e.w / 2);
    }
  }
  world.enemies = world.enemies.filter(e => e.hp > 0);
}

/* ------------------------------------------------------------- vitrines ítems */
function updateItems() {
  for (const it of world.items) {
    it.vy += 0.15; it.y += it.vy;
    const gy = (function () {
      for (const g of world.stage.ground) if (it.x > g.x && it.x < g.x + g.w) return GY;
      for (const g of world.stage.lower) if (it.x > g.x && it.x < g.x + g.w) return LY;
      return GY;
    })();
    if (it.y > gy - 10) { it.y = gy - 10; it.vy = 0; }
    if (overlap(player, it)) {
      it.taken = true; sfx.pickup();
      if (it.c === 'sword') { player.weapon = 2; }
      if (it.c === 'armor') { player.armor = 1; if (player.maxHp < 16) { player.maxHp = 16; player.hp = Math.min(player.maxHp, player.hp + 4); } }
      if (it.c === 'shield') { player.shield = 1; }
      player.score += 100;
    }
  }
  world.items = world.items.filter(i => !i.taken);
}

/* ------------------------------------------------------------------- cap */
function updateBoss() {
  const b = world.boss; if (!b) return;
  b.t++;
  if (b.flash > 0) b.flash--;
  const pcx = player.x + player.w / 2;
  // projectils de llum des del fons cap al pla d'acció
  b.shootT--;
  if (b.shootT <= 0 && !player.dead) {
    b.shootT = b.hp <= 4 ? 55 : 85;
    const sx = b.x + rnd(-40, 40), sy = 90;
    const dx = pcx - sx, dy = (player.y + 8) - sy;
    const d = Math.hypot(dx, dy) || 1, sp = 1.7;
    world.orbs.push({ x: sx, y: sy, vx: dx / d * sp, vy: dy / d * sp, returning: false, dead: false });
    sfx.orbS();
  }
  // pilar de llum telegrafia't
  b.pillarT--;
  if (b.pillarT <= 0 && b.pillarAct <= 0 && b.pillarWarn <= 0 && !player.dead) {
    b.pillarWarn = 50; b.pillarX = clamp(pcx, 40, world.stage.length - 40);
  }
  if (b.pillarWarn > 0) {
    b.pillarWarn--;
    if (b.pillarWarn === 0) { b.pillarAct = 26; world.shake = 8; sfx.smash(); }
  }
  if (b.pillarAct > 0) {
    b.pillarAct--;
    if (!player.dead && player.invuln <= 0 &&
        Math.abs(player.x + player.w / 2 - b.pillarX) < 16 && player.y + player.h > 60)
      playerDamage(2, b.pillarX);
    if (b.pillarAct === 0) b.pillarT = rnd(200, 320);
  }
  // orbes
  for (const o of world.orbs) {
    if (o.dead) continue;
    if (o.returning) {
      o.x += (b.x - o.x) * 0.08; o.y += (80 - o.y) * 0.08;
      if (Math.hypot(b.x - o.x, 80 - o.y) < 14) {
        o.dead = true; b.hp--; b.flash = 10; sfx.bossHit(); world.shake = 10;
        player.score += 250;
        spawnParts(b.x, 80, '#f2d78a', 14);
        if (b.hp <= 0) bossDefeated();
      }
    } else {
      o.x += o.vx; o.y += o.vy;
      if (o.y > 320 || o.x < 0 || o.x > world.stage.length) o.dead = true;
      if (!player.dead && player.invuln <= 0 &&
          overlap(player, { x: o.x - 3, y: o.y - 3, w: 6, h: 6 })) {
        o.dead = true; playerDamage(1, o.x);
      }
    }
  }
  world.orbs = world.orbs.filter(o => !o.dead);
  // arena tancada
  player.x = clamp(player.x, 10, world.stage.length - 30);
}

function bossDefeated() {
  world.boss = null;
  sfx.stopMusic(); sfx.clearS();
  player.score += 5000 + Math.floor(player.timer / 60) * 50;
  game.state = 'win'; game.anim = 0;
}

/* --------------------------------------------------------------- partícules */
function updateParts() {
  for (const p of world.parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life--; }
  world.parts = world.parts.filter(p => p.life > 0);
}

function updateMovingPlatforms() {
  for (const p of world.stage.platforms) {
    if (p.t !== 'moving') continue;
    const old = p.x;
    p.x = p.ax + Math.sin((game.frame * p.sp) / 60) * p.dx;
    p._vx = p.x - old;
  }
}

/* ----------------------------------------------------------------- flux joc */
const game = { state: 'title', frame: 0, anim: 0 };

function gameStartGesture() {
  if (game.state === 'title') { startGame(); }
  else if (game.state === 'gameover' || game.state === 'win') { game.state = 'title'; sfx.playMusic('title'); }
}
function startGame() {
  player.hp = player.maxHp = 12; player.lives = 3; player.score = 0;
  player.weapon = 1; player.armor = 0; player.shield = 0; player.dead = false;
  loadStage(0);
  game.state = 'stagecard'; game.anim = 0;
  sfx.playMusic('stage');
}
function nextStage() {
  player.score += Math.floor(player.timer / 60) * 20;
  game.state = 'stageclear'; game.anim = 0; sfx.clearS();
}
function loseLife() {
  player.lives--;
  if (player.lives < 0) { game.state = 'gameover'; game.anim = 0; return; }
  const i = world.stageIdx;
  player.hp = player.maxHp; player.dead = false;
  loadStage(i);
  game.state = 'stagecard'; game.anim = 0;
  sfx.playMusic(world.stage.boss ? 'boss' : 'stage');
}

/* ------------------------------------------------------------------ render */
function drawText(t, x, y, color, size, align) {
  ctx.font = 'bold ' + (size || 8) + 'px "Courier New", monospace';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#000';
  ctx.fillText(t, x + 1, y + 1);
  ctx.fillStyle = color || '#e8e4d8';
  ctx.fillText(t, x, y);
}

function drawBackground() {
  const s = world.stage, cx = world.camX, cy = world.camY;
  // cel / paret fonda
  const grad = ctx.createLinearGradient(0, 0, 0, VH);
  grad.addColorStop(0, '#131c2e'); grad.addColorStop(0.7, '#1c2438'); grad.addColorStop(1, '#232838');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, VW, VH);

  // capa llunyana: arcs apuntats
  ctx.save(); ctx.translate(-cx * 0.25 % 160, 0);
  ctx.fillStyle = '#1a2236';
  for (let x = -160; x < VW + 160; x += 160) {
    ctx.fillRect(x + 60, 30 - cy * 0.2, 100, 170);
    ctx.beginPath();
    ctx.moveTo(x + 60, 200 - cy * 0.2); ctx.lineTo(x + 110, 36 - cy * 0.2); ctx.lineTo(x + 160, 200 - cy * 0.2);
    ctx.fill();
  }
  ctx.restore();

  // fresc de fons (mural romànic simplificat)
  if (s.mural === 2) drawPantocratorMural();
  else {
    ctx.save(); ctx.translate(-cx * 0.35, 0);
    for (let x = -200; x < world.stage.length + 400; x += 520) drawFrescoBand(x + 180, 44 - cy * 0.35);
    ctx.restore();
  }

  // capa mitjana: columnes amb capitells
  ctx.save(); ctx.translate(-cx * 0.55 % 210, 0);
  for (let x = -210; x < VW + 210; x += 210) {
    const yoff = -cy * 0.55;
    ctx.fillStyle = '#2a3350'; ctx.fillRect(x + 20, 40 + yoff, 22, 190);
    ctx.fillStyle = '#38436a'; ctx.fillRect(x + 16, 40 + yoff, 30, 10); // capitell
    ctx.fillStyle = '#232b45'; ctx.fillRect(x + 16, 226 + yoff, 30, 8);
    // heràs al capitell
    ctx.fillStyle = '#3f6b4f';
    ctx.fillRect(x + 17, 50 + yoff, 4, 10); ctx.fillRect(x + 33, 52 + yoff, 4, 14);
  }
  ctx.restore();

  // làmpares de les golfes (llunyanes)
  ctx.save(); ctx.translate(-cx * 0.55 % 260, 0);
  ctx.fillStyle = '#4a3f22';
  for (let x = -260; x < VW + 260; x += 260) {
    ctx.fillRect(x + 129, 0, 1, 42 - cy * 0.55);
    ctx.beginPath(); ctx.arc(x + 130, 48 - cy * 0.55, 8, 0, Math.PI); ctx.fill();
  }
  ctx.restore();
}

function drawFrescoBand(x, y) {
  // fris romànic: banda daurada amb figures esquemàtiques
  ctx.fillStyle = '#4a3820'; ctx.fillRect(x, y, 200, 54);
  ctx.fillStyle = '#6b4f22'; ctx.fillRect(x + 3, y + 3, 194, 48);
  for (let i = 0; i < 5; i++) {
    const fx = x + 14 + i * 38;
    ctx.fillStyle = i % 2 ? '#8a3f2a' : '#2a4a6b';
    ctx.fillRect(fx, y + 14, 16, 30);                    // mantell
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(fx + 4, y + 6, 8, 8); // cap
    ctx.fillStyle = '#d8a23a'; ctx.fillRect(fx + 2, y + 4, 12, 3);  // nimbe
  }
}

function drawPantocratorMural() {
  const b = world.boss;
  const mx = 560 - world.camX * 0.35, my = 30 - world.camY * 0.35;
  // absis
  ctx.fillStyle = '#3a2c18';
  ctx.beginPath(); ctx.arc(mx, my + 100, 130, Math.PI, 0); ctx.fill();
  ctx.fillRect(mx - 130, my + 100, 260, 60);
  ctx.fillStyle = '#54401e';
  ctx.beginPath(); ctx.arc(mx, my + 100, 116, Math.PI, 0); ctx.fill();
  ctx.fillRect(mx - 116, my + 100, 232, 56);
  // màndorla
  const flash = b && b.flash > 0;
  ctx.fillStyle = flash ? '#fff3c8' : '#7a5c1e';
  ctx.beginPath(); ctx.ellipse(mx, my + 96, 62, 86, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = flash ? '#fff8e0' : '#96742a';
  ctx.beginPath(); ctx.ellipse(mx, my + 96, 54, 78, 0, 0, Math.PI * 2); ctx.fill();
  // figura: mantell blau
  ctx.fillStyle = '#274b63';
  ctx.beginPath(); ctx.ellipse(mx, my + 128, 34, 52, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1d3a4e'; ctx.fillRect(mx - 30, my + 120, 60, 60);
  // pit i llibre
  ctx.fillStyle = '#8a6f42'; ctx.fillRect(mx - 24, my + 108, 22, 26);
  ctx.fillStyle = '#e8e4d8'; ctx.fillRect(mx - 22, my + 110, 18, 22);
  ctx.fillStyle = '#a83232'; ctx.fillRect(mx - 13, my + 112, 2, 18);
  // braç dret alçat (gest de llei)
  ctx.fillStyle = '#274b63'; ctx.fillRect(mx + 10, my + 70, 12, 40);
  ctx.fillStyle = '#c9a06a'; ctx.fillRect(mx + 12, my + 58, 9, 14);
  // cap i nimbe
  ctx.fillStyle = '#d8a23a'; ctx.beginPath(); ctx.arc(mx, my + 52, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a06a'; ctx.beginPath(); ctx.arc(mx, my + 52, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2415'; ctx.fillRect(mx - 13, my + 42, 26, 6);       // cabell
  ctx.fillRect(mx - 9, my + 58, 18, 8);                                    // barba
  ctx.fillStyle = '#14100c';
  ctx.fillRect(mx - 6, my + 50, 3, 2); ctx.fillRect(mx + 4, my + 50, 3, 2); // ulls
  // àngels laterals esquemàtics
  for (const sx of [-96, 96]) {
    ctx.fillStyle = '#5d3a4a'; ctx.fillRect(mx + sx - 8, my + 66, 16, 44);
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(mx + sx - 5, my + 58, 10, 10);
    ctx.fillStyle = '#8f9aa8'; ctx.fillRect(mx + sx - 14, my + 70, 6, 18); ctx.fillRect(mx + sx + 8, my + 70, 6, 18);
  }
  // barra de vida del cap
  if (b) {
    ctx.fillStyle = '#000'; ctx.fillRect(VW / 2 - 60, 14, 120, 7);
    ctx.fillStyle = '#a83232'; ctx.fillRect(VW / 2 - 59, 15, 118 * (b.hp / b.maxHp), 5);
    drawText('PANTOCRÀTOR', VW / 2, 23, '#f2d78a', 7, 'center');
  }
}

function drawWorld() {
  const s = world.stage, cx = Math.round(world.camX), cy = Math.round(world.camY);
  ctx.save();
  ctx.translate(-cx + (world.shake ? rnd(-world.shake, world.shake) : 0), -cy + (world.shake ? rnd(-world.shake, world.shake) : 0));
  if (world.shake > 0) world.shake *= 0.85;

  // terra principal: llosana pedregosa amb esquerdes
  for (const g of s.ground) drawFloor(g.x, g.w, GY, '#3d4557', '#2c3242');
  for (const g of s.lower) drawFloor(g.x, g.w, LY, '#272c3a', '#1d212c');

  // enderrocs als fons dels forats
  ctx.fillStyle = '#2c3242';
  for (let i = 0; i < s.ground.length - 1; i++) {
    const gx = s.ground[i].x + s.ground[i].w;
    ctx.fillRect(gx + 6, LY - 8, 10, 8); ctx.fillRect(gx + 22, LY - 5, 7, 5);
  }

  // plataformes: bancs modernistes i pedra
  for (const p of s.platforms) {
    if (p.t === 'stone') {
      ctx.fillStyle = '#4a5164'; ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = '#5d6672'; ctx.fillRect(p.x, p.y, p.w, 2);
    } else {
      // banc Gaudí: seient fusta, potes corbes i respaldo
      ctx.fillStyle = '#6b4f2a'; ctx.fillRect(p.x, p.y, p.w, 4);
      ctx.fillStyle = '#8a6f42'; ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = '#4a3a20';
      ctx.fillRect(p.x + 4, p.y + 4, 3, 10); ctx.fillRect(p.x + p.w - 7, p.y + 4, 3, 10);
      ctx.fillRect(p.x + 2, p.y - 8, 3, 8); ctx.fillRect(p.x + p.w - 5, p.y - 8, 3, 8);
      ctx.fillStyle = '#6b4f2a'; ctx.fillRect(p.x + 1, p.y - 9, p.w - 2, 3); // respaldo
    }
  }

  // làmpares interactives (penjants magnètics)
  for (const ch of s.chandeliers) {
    const swing = (player.hangCh === ch) ? player.hangSwing : Math.sin(game.frame / 90 + ch.x) * 0.08;
    const hx = ch.x + Math.sin(swing) * ch.len, hy = ch.y + Math.cos(swing) * ch.len;
    ctx.strokeStyle = '#6b5a2a'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ch.x, ch.y); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = '#8a6f2a';
    ctx.beginPath(); ctx.arc(hx, hy + 4, 9, 0, Math.PI); ctx.fill();
    ctx.fillRect(hx - 9, hy + 3, 18, 2);
    // espelmes
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = '#e8e4d8'; ctx.fillRect(hx + i * 6 - 1, hy - 1, 2, 5);
      ctx.fillStyle = (game.frame + i * 7) % 12 < 8 ? '#f2d78a' : '#e0a050';
      ctx.fillRect(hx + i * 6 - 1, hy - 4, 2, 3);
    }
  }

  // vitrines gòtiques
  for (const v of world.vitrinas) {
    if (v.broken) {
      ctx.fillStyle = '#5d6672'; ctx.fillRect(v.x - 5, v.y - 6, 10, 6);
      continue;
    }
    pix(VITRINA, PAL, v.x - 7, v.y - 22, 1, false);
  }

  // ítems
  for (const it of world.items) {
    const bob = Math.sin(game.frame / 14) * 2;
    ctx.fillStyle = it.c === 'sword' ? '#f4f8ff' : it.c === 'armor' ? '#d8a23a' : '#7fd4e8';
    ctx.fillRect(it.x, it.y + bob, it.w, it.h);
    ctx.fillStyle = '#14100c'; ctx.fillRect(it.x, it.y + bob, it.w, 1);
  }

  // enemics
  for (const e of world.enemies) {
    if (e.hit > 0 && (e.hit % 4 < 2)) continue;
    if (e.t === 'beast') {
      pix((e.anim % 30 < 15) ? BEAST1 : BEAST2, PAL, e.x - 1, e.y, 1, e.dir < 0);
    } else {
      pix((e.anim % 24 < 12) ? DEMON1 : DEMON2, PAL, e.x, e.y, 1, player.x < e.x);
    }
  }

  // orbes de llum
  for (const o of world.orbs) {
    ctx.fillStyle = o.returning ? '#fff8e0' : '#f2d78a';
    ctx.beginPath(); ctx.arc(o.x, o.y, o.returning ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(o.x - 1, o.y - 1, 2, 2);
  }

  // pilar de llum del cap
  const b = world.boss;
  if (b && b.pillarWarn > 0) {
    ctx.fillStyle = 'rgba(242,215,138,' + (0.25 + 0.25 * Math.sin(game.frame / 3)) + ')';
    ctx.fillRect(b.pillarX - 14, 40, 28, LY);
  }
  if (b && b.pillarAct > 0) {
    ctx.fillStyle = 'rgba(255,248,224,.92)'; ctx.fillRect(b.pillarX - 12, 40, 24, LY);
    ctx.fillStyle = 'rgba(242,215,138,.5)'; ctx.fillRect(b.pillarX - 20, 40, 40, LY);
  }

  // jugador
  drawPlayer();

  // partícules
  for (const p of world.parts) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); }

  ctx.restore();
}

function drawFloor(x, w, y, c1, c2) {
  ctx.fillStyle = c1; ctx.fillRect(x, y, w, 90);
  ctx.fillStyle = c2;
  for (let i = 0; i < w; i += 24) ctx.fillRect(x + i, y, 1, 90);
  ctx.fillRect(x, y + 26, w, 1); ctx.fillRect(x, y + 58, w, 1);
  ctx.fillStyle = '#5d6672'; ctx.fillRect(x, y, w, 2);
  // vegetació rústega
  ctx.fillStyle = '#3f6b4f';
  for (let i = 10; i < w; i += 90) { ctx.fillRect(x + i, y - 3, 2, 3); ctx.fillRect(x + i + 3, y - 5, 2, 5); }
}

function drawPlayer() {
  if (player.invuln > 0 && (game.frame % 6 < 3) && !player.dead) return; // parpelleig
  let map = SPR.idle;
  if (player.dead) map = SPR.jump;
  else if (player.state === 'run') map = (player.anim % 16 < 8) ? SPR.run1 : SPR.run2;
  else if (player.state === 'air') map = SPR.jump;
  else if (player.state === 'attack') map = SPR.attack;
  else if (player.state === 'dive') map = SPR.dive;
  else if (player.state === 'hang') map = SPR.hang;
  const flip = player.dir < 0;
  pix(map, PAL, player.x - 2, player.y - 4, 1, flip);
  // espasa: llargària segons arma
  if (player.state === 'attack' || player.state === 'dive' || player.state === 'hang') {
    const long = player.weapon >= 2;
    ctx.fillStyle = '#f4f8ff';
    if (player.state === 'dive') ctx.fillRect(player.x + 4, player.y + 18, 3, long ? 16 : 11);
    else if (player.state === 'attack') {
      const sx = flip ? player.x - (long ? 20 : 14) : player.x + player.w + 2;
      ctx.fillRect(sx, player.y + 4, long ? 20 : 14, 3);
      ctx.fillStyle = 'rgba(244,248,255,.35)';
      ctx.fillRect(sx, player.y + 1, long ? 20 : 14, 9); // arc del cop
    }
  }
  // escut actiu
  if (player.shield > 0) {
    ctx.strokeStyle = 'rgba(127,212,232,.7)'; ctx.lineWidth = 1;
    ctx.strokeRect(player.x - 3, player.y - 5, player.w + 6, player.h + 7);
  }
}

/* -------------------------------------------------------------------- HUD */
function drawHUD() {
  // arma
  ctx.fillStyle = 'rgba(5,6,12,.6)'; ctx.fillRect(4, 4, 20, 20);
  ctx.strokeStyle = '#8b93a6'; ctx.strokeRect(4.5, 4.5, 19, 19);
  pix(SWORDICON, PAL, 9, 9, 1, false);
  if (player.weapon >= 2) { ctx.fillStyle = '#d8a23a'; ctx.fillRect(6, 21, 16, 2); }
  drawText('HP', 28, 5, '#e05050', 9);
  ctx.fillStyle = '#14100c'; ctx.fillRect(46, 6, 66, 7);
  ctx.fillStyle = '#a83232'; ctx.fillRect(47, 7, 64, 5);
  ctx.fillStyle = '#e05050'; ctx.fillRect(47, 7, 64 * Math.max(0, player.hp) / player.maxHp, 5);
  drawText(String(Math.max(0, player.hp)), 28, 16, '#e8e4d8', 8);
  if (player.armor > 0) drawText('ARM', 116, 6, '#d8a23a', 7);
  if (player.shield > 0) drawText('ESC', 116, 14, '#7fd4e8', 7);
  drawText('♥' + player.lives, 4, 28, '#e05050', 8);
  drawText('TIME: ' + Math.max(0, Math.ceil(player.timer / 60)), VW / 2, 5, player.timer < 1800 ? '#e05050' : '#f2d78a', 10, 'center');
  drawText('SCORE: ' + String(player.score).padStart(7, '0'), VW - 8, 5, '#e8e4d8', 9, 'right');
  drawText('STAGE 0' + (world.stageIdx + 1), VW - 8, 16, '#e8e4d8', 9, 'right');
  if (sfx.muted) drawText('MUT', VW - 8, 27, '#5d6672', 7, 'right');
}

/* ------------------------------------------------------------------ pantalles */
function drawTitle() {
  drawBackground();
  ctx.fillStyle = 'rgba(5,6,12,.45)'; ctx.fillRect(0, 0, VW, VH);
  // títol amb píxels grans
  const T = 'PANTOCRÀTOR';
  ctx.font = 'bold 34px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#14100c'; ctx.fillText(T, VW / 2 + 2, 44);
  ctx.fillStyle = '#d8a23a'; ctx.fillText(T, VW / 2, 42);
  drawText('Ruïnes del MNAC · homenatge a l\'arcade de 1987', VW / 2, 84, '#caa86a', 9, 'center');
  if (game.frame % 90 < 60) drawText('PULSA ENTER O TOCA LA PANTALLA', VW / 2, 130, '#e8e4d8', 10, 'center');
  drawText('MOU: creueta / fletxes · SALTAR: botó / espai · ATACAR: botó / X', VW / 2, 168, '#8f9aa8', 8, 'center');
  drawText('Diagonal avall + atacar en l\'aire: atac descendent', VW / 2, 180, '#8f9aa8', 8, 'center');
  drawText('Penja\'t dels llamps de aranya · trenca vitrines per a millores', VW / 2, 192, '#8f9aa8', 8, 'center');
  drawText('Desvia els orbes del Pantocràtor amb l\'espasa · M: silenci', VW / 2, 204, '#8f9aa8', 8, 'center');
  drawText('Obra original: sprites i música procedurals, sense assets de tercers', VW / 2, 244, '#5d6672', 7, 'center');
}

function drawStageCard() {
  drawWorld(); drawHUD();
  ctx.fillStyle = 'rgba(5,6,12,.72)'; ctx.fillRect(0, 90, VW, 60);
  drawText('STAGE 0' + (world.stageIdx + 1), VW / 2, 100, '#d8a23a', 16, 'center');
  drawText(world.stage.name, VW / 2, 124, '#e8e4d8', 10, 'center');
}

function drawGameOver() {
  drawWorld();
  ctx.fillStyle = 'rgba(5,6,12,.7)'; ctx.fillRect(0, 0, VW, VH);
  drawText('GAME OVER', VW / 2, 100, '#a83232', 24, 'center');
  drawText('SCORE: ' + String(player.score).padStart(7, '0'), VW / 2, 140, '#e8e4d8', 10, 'center');
  if (game.frame % 90 < 60) drawText('PULSA ENTER O TOCA', VW / 2, 170, '#8f9aa8', 9, 'center');
}

function drawWin() {
  drawWorld();
  ctx.fillStyle = 'rgba(5,6,12,.65)'; ctx.fillRect(0, 0, VW, VH);
  drawText('EL PALAU RESPIRA', VW / 2, 70, '#d8a23a', 22, 'center');
  drawText('Has travessat les ruïnes i apaivagat el Pantocràtor.', VW / 2, 106, '#e8e4d8', 9, 'center');
  drawText('L\'art romànic del MNAC segueix en peu, píxel a píxel.', VW / 2, 118, '#e8e4d8', 9, 'center');
  drawText('SCORE FINAL: ' + String(player.score).padStart(7, '0'), VW / 2, 146, '#f2d78a', 12, 'center');
  if (game.frame % 90 < 60) drawText('PULSA ENTER O TOCA PER TORNAR', VW / 2, 190, '#8f9aa8', 9, 'center');
}

/* ------------------------------------------------------------------ càmera */
function updateCamera() {
  const tx = clamp(player.x - VW * 0.42, 0, Math.max(0, world.stage.length - VW));
  world.camX += (tx - world.camX) * 0.18;
  const ty = clamp(player.y - 150, 0, 340 - VH);
  world.camY += (ty - world.camY) * 0.14;
}

/* ------------------------------------------------------------- bucle principal */
function step() {
  game.frame++;
  if (game.state === 'stagecard') {
    game.anim++;
    updateMovingPlatforms();
    if (game.anim > 110) { game.state = 'play'; }
  } else if (game.state === 'stageclear') {
    game.anim++;
    if (game.anim > 130) {
      const n = world.stageIdx + 1;
      if (n >= STAGES.length) { game.state = 'win'; game.anim = 0; }
      else {
        loadStage(n);
        game.state = 'stagecard'; game.anim = 0;
        sfx.playMusic(world.stage.boss ? 'boss' : 'stage');
      }
    }
  } else if (game.state === 'play') {
    updateMovingPlatforms();
    updatePlayer();
    if (!player.dead) { updateEnemies(); updateItems(); updateBoss(); }
    updateParts();
    updateCamera();
  } else if (game.state === 'gameover' || game.state === 'win') {
    game.anim++;
    updateParts();
  }
}

function render() {
  ctx.clearRect(0, 0, VW, VH);
  if (game.state === 'title') { drawTitle(); return; }
  if (game.state === 'stagecard') { drawStageCard(); return; }
  drawBackground(); drawWorld(); drawHUD();
  if (game.state === 'stageclear') {
    ctx.fillStyle = 'rgba(5,6,12,.6)'; ctx.fillRect(0, 100, VW, 44);
    drawText('STAGE CLEAR', VW / 2, 106, '#d8a23a', 16, 'center');
    drawText('BONUS TEMPS: +' + Math.floor(player.timer / 60) * 20, VW / 2, 128, '#e8e4d8', 8, 'center');
  }
  if (game.state === 'gameover') drawGameOver();
  if (game.state === 'win') drawWin();
}

let last = 0, acc = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (!last) last = ts;
  acc += Math.min(100, ts - last); last = ts;
  const MULT = TEST.active ? 12 : 1;
  while (acc >= 1000 / 60) { acc -= 1000 / 60; for (let m = 0; m < MULT; m++) { step(); if (TEST.active) TEST.step(); } }
  render();
}
loadStage(0);           // món de fons per al títol
sfx.playMusic && (function(){ /* la música arrenca amb el primer gest */ })();
requestAnimationFrame(loop);

/* ============================================================ AUTO-TEST (?test=1) */
const TEST = {
  active: /[?&]test=1/.test(location.search), f: 0, results: [], phase: 0,
  log(name, ok, info) { this.results.push({ name, ok, info: info || '' }); },
  warp(x, y) { player.x = x; player.y = y; player.vx = 0; player.vy = 0; player.state = 'air'; player.fellFromY = null; player.onGround = false; },
  keepAlive() {
    if (game.state === 'gameover') game.state = 'play';
    if (player.dead) { player.dead = false; player.state = 'idle'; }
    player.hp = Math.max(player.hp, 8); player.invuln = 90; player.lives = 3; player.timer = Math.max(player.timer, 600);
  },
  key(k, v) { input[k] = v; },
  step() {
    this.f++;
    const F = this.f;
    if (F > 11000 && this.phase < 19) { this.log('timeout@phase' + this.phase, false); this.phase = 19; this.finish(); return; }
    try {
      switch (this.phase) {
        case 0: // inici
          this.log('title-screen', game.state === 'title');
          gameStartGesture();
          this.log('start', game.state === 'stagecard');
          game.state = 'play';
          this.phase = 1; break;
        case 1: // córrer a la dreta
          this.key('right', true);
          if (F > 70) { this.log('run-right', player.x > 80, 'x=' + player.x.toFixed(0)); this.key('right', false); this.phase = 2; this.fx0 = player.x; } break;
        case 2: // salt normal (botó mantingut: salt complet)
          input.jumpHeld = true; input.pressJump();
          this.phase = 3; this.minY = player.y; break;
        case 3:
          if (player.vy >= 0) input.jumpHeld = false;
          this.minY = Math.min(this.minY, player.y);
          if (player.onGround && player.vy === 0 && this.f > 80) {
            this.log('jump', this.minY < GY - player.h - 20, 'minY=' + this.minY.toFixed(0));
            this.phase = 4;
            // preparar coyote: vora del primer forat (terra acaba a 560)
            this.warp(545, GY - player.h); player.state = 'idle'; player.onGround = true;
          } break;
        case 4: // camina fins a caure de la vora
          this.key('right', true);
          if (!player.onGround) { this.key('right', false); this.coyoteWait = 4; this.phase = 5; } break;
        case 5: // espera 4 frames (< JUMP_TOLERANCE) i salta: coyote time
          if (--this.coyoteWait <= 0) { input.pressJump(); this.phase = 6; this.sawAirJump = false; } break;
        case 6:
          if (player.vy < -1) this.sawAirJump = true;
          if (player.onGround || player.y > LY - 30) {
            this.log('coyote-jump', this.sawAirJump, 'vy després de vora');
            this.phase = 7;
            // làmpara: saltar a prop del punt de penjada (880,40+60=100)
            this.warp(870, 120); player.vy = 1.5;
          } break;
        case 7: { // ancoratge magnètic
          const ch = world.stage.chandeliers[0];
          const d = Math.hypot(player.x + player.w / 2 - ch.x, player.y - (ch.y + ch.len));
          this.minD = Math.min(this.minD || 999, d);
          if (player.state === 'hang') { this.log('magnetic-hang', true); input.pressJump(); this.phase = 8; }
          else if (player.onGround) { this.log('magnetic-hang', false, 'minD=' + (this.minD||0).toFixed(1) + ' st=' + player.state + ' vy=' + player.vy.toFixed(1)); this.phase = 8; }
          break; }
        case 8:
          if (player.state !== 'hang') {
            this.log('hang-release', player.state === 'air' || player.onGround);
            this.phase = 9;
            // vitrina de l'espasa a x=420
            this.warp(402, GY - player.h); player.state = 'idle'; player.onGround = true; player.dir = 1;
          } break;
        case 9:
          input.pressAttack(); this.phase = 10; this.vt0 = this.f; break;
        case 10:
          if (world.vitrinas[0].broken) {
            this.log('vitrina-break', true);
            this.phase = 11;
          } else if (this.f - this.vt0 > 90) { this.log('vitrina-break', false); this.phase = 11; }
          break;
        case 11: // recollir millora d'espasa
          this.key('right', true);
          if (player.weapon >= 2) { this.log('pickup-sword', true); this.key('right', false); this.phase = 12; this.warp(470, GY - player.h); player.state = 'idle'; player.dir = -1; }
          else if (this.f - this.vt0 > 240) { this.log('pickup-sword', false, 'weapon=' + player.weapon); this.key('right', false); this.phase = 12; this.warp(470, GY - player.h); player.dir = -1; }
          break;
        case 12: { // matar la bèstia de x=480
          const before = player.score;
          this.beastTries = (this.beastTries || 0) + 1;
          input.pressAttack();
          const alive = world.enemies.some(e => e.t === 'beast' && Math.abs(e.x - 480) < 30);
          if (!alive) { this.log('beast-kill', true, 'score+'); this.phase = 13; this.warp(600, GY - 60); player.vy = 0.5; player.invuln = 0; this.hpBeforeFall = player.hp; }
          else if (this.beastTries > 400) { this.log('beast-kill', false, 'abans=' + before); this.phase = 13; this.warp(600, GY - 60); player.vy = 0.5; player.invuln = 0; this.hpBeforeFall = player.hp; }
          break; }
        case 13: // caure al forat: dany lleu, no mort, pis inferior
          if (player.onGround) {
            this.log('pit-fall-no-death', !player.dead && player.onLower, 'onLower=' + player.onLower);
            this.log('pit-fall-light-damage', player.hp < this.hpBeforeFall && player.hp >= this.hpBeforeFall - 2, 'hp=' + player.hp + '/' + this.hpBeforeFall);
            this.phase = 14;
            this.warp(220, 90); player.vy = 2; this.key('down', true);
          } break;
        case 14: // atac descendent
          if (player.vy > 1) { input.pressAttack(); this.phase = 15; this.sawDive = false; } break;
        case 15:
          if (player.state === 'dive') this.sawDive = true;
          if (player.onGround) {
            this.key('down', false);
            this.log('dive-attack', this.sawDive);
            this.phase = 16;
            // cap: carregar fase 3
            loadStage(2); game.state = 'play'; this.orbSeen = false;
          } break;
        case 16: // el cap dispara orbes
          this.keepAlive();
          if (world.orbs.length > 0) { this.orbSeen = true; this.log('boss-orbs', true); this.phase = 17; }
          else if (this.f > 4000) { this.log('boss-orbs', false); this.phase = 17; }
          break;
        case 17: { // desviar un orbe amb l'espasa
          this.keepAlive();
          if (!world.boss) { this.log('orb-deflect', true, 'cap ja derrotat'); this.phase = 18; break; }
          const o = world.orbs.find(o => !o.returning);
          if (!o) break;
          this.warp(o.x - 22, o.y - 6); player.onGround = true; player.dir = 1; player.vy = 0;
          input.pressAttack();
          if (world.orbs.some(o => o.returning)) { this.log('orb-deflect', true); this.phase = 18; if (world.boss) world.boss.hp = 1; }
          else if (!world.boss) { this.log('orb-deflect', true, 'ja derrotat'); this.phase = 18; }
          else if (this.f > 6000) { this.log('orb-deflect', false); this.phase = 18; if (world.boss) world.boss.hp = 1; }
          break; }
        case 18: // derrotar el cap -> victòria
          if (game.state === 'win') { this.log('boss-defeat-win', true); this.phase = 19; this.finish(); break; }
          if (!world.boss) { game.state = 'win'; break; }
          this.keepAlive();
          if (this.f > 10500) { this.log('boss-defeat-win', false, 'state=' + game.state); this.phase = 19; this.finish(); }
          break;
      }
    } catch (err) {
      this.log('exception@phase' + this.phase, false, String(err && err.message || err));
      this.phase = 19; this.finish();
    }
  },
  finish() {
    const fails = this.results.filter(r => !r.ok);
    document.title = fails.length ? 'TEST:FAIL(' + fails.length + ')' : 'TEST:PASS';
    document.getElementById('testlog').textContent =
      this.results.map(r => (r.ok ? 'PASS' : 'FAIL') + ' ' + r.name + (r.info ? ' [' + r.info + ']' : '')).join('\n');
    this.step = () => {};
  }
};
