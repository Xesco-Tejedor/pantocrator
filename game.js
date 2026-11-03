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
  k:'#14100c', s:'#e8b07f', d:'#b07a4e', h:'#3a2415', p:'#6b4f2a', P:'#453218',
  b:'#2e1f10', w:'#b9c4d2', W:'#f4f8ff', g:'#d8a23a', y:'#ffe9a8', r:'#a83232',
  R:'#e05050', m:'#7a5c8f', G:'#8f9aa8', D:'#5d6672', E:'#f2d78a', n:'#2c3e50',
  o:'#c96f2e', v:'#4a6741', c:'#caa86a', C:'#8a6f42', t:'#3f6b4f', l:'#7fd4e8',
  B:'#274b63', u:'#e8e4d8', a:'#6f8296', q:'#c9ced8'
};

/* Guerrer (16x20, dibuixat a escala 2 = 32x40). Estats:
   idle, run1, run2, jump, attack, dive, hang */
const SPR = {
  idle: [
  '......kkkkk.....',
  '.....ksssssk....',
  '....ksssssssk...',
  '....kskssksk....',
  '....ksssdssk....',
  '.....kssddk.....',
  '....kksssskk....',
  '..kksssssssskk..',
  '.kssksssssskssk.',
  '.ksdkssssssdksk.',
  '.kk.kdssssdksk..',
  '....kssddssk.k..',
  '....kgppppgk....',
  '....kppPPppk....',
  '....kpp.kppk....',
  '...kpp...kppk...',
  '...kpPk..kPpk...',
  '...kbk...kbk....',
  '..kbbk...kbbk...',
  '..kkkk...kkkk...'],
  run1: [
  '......kkkkk.....',
  '.....ksssssk....',
  '....ksssssssk...',
  '....kskssksk....',
  '....ksssdssk....',
  '.....kssddk.....',
  '....kksssskk....',
  '..kksssssssskk..',
  '.kssksssssskssk.',
  '.ksdkssssssdksk.',
  '.kk.kdssssdksk..',
  '....kssddssk....',
  '....kgppppgk....',
  '...kpppPPpppk...',
  '..kppk...kppk...',
  '.kPpk.....kpPk..',
  '.kpk.......kpk..',
  '.kbk.......kbk..',
  'kbbk........kbbk',
  'kkkk........kkkk'],
  run2: [
  '......kkkkk.....',
  '.....ksssssk....',
  '....ksssssssk...',
  '....kskssksk....',
  '....ksssdssk....',
  '.....kssddk.....',
  '....kksssskk....',
  '..kksssssssskk..',
  '.kssksssssskssk.',
  '.ksdkssssssdksk.',
  '.kk.kdssssdksk..',
  '....kssddssk....',
  '....kgppppgk....',
  '....kppPPpppk...',
  '.....kppppk.....',
  '....kpp.kppk....',
  '....kPk.kPk.....',
  '....kbk..kbk....',
  '...kbbk..kbbk...',
  '...kkkk..kkkk...'],
  jump: [
  '......kkkkk.....',
  '.....ksssssk....',
  '....ksssssssk...',
  '....kskssksk....',
  '....ksssdssk....',
  '.....kssddk.....',
  '....kksssskk....',
  '.kkksssssssskk..',
  'kssksssssssskssk',
  'ksdksssssssdksk.',
  'kk.kdssssdksk.k.',
  '...kssddssk.....',
  '...kgpppppgk....',
  '...kppPPpppk....',
  '..kppk..kppk....',
  '..kpPk..kPpk....',
  '..kpk....kpk....',
  '..kbk....kbk....',
  '.kbbk....kbbk...',
  '.kkkk....kkkk...'],
  attack: [
  '......kkkkk.....',
  '.....ksssssk....',
  '....ksssssssk...',
  '....kskssksk....',
  '....ksssdssk....',
  '.....kssddk.....',
  '....kksssskk....',
  '..kksssssssskk..',
  '.kssksssssskssk.',
  'kssssssssssdksk.',
  'kkssssssssdksk..',
  '..kkssddssk.k...',
  '....kgppppgk....',
  '....kppPPppk....',
  '...kpppk.kpppk..',
  '..kppk....kppk..',
  '..kPk......kPk..',
  '..kbk......kbk..',
  '.kbbk......kbbk.',
  '.kkkk......kkkk.'],
  dive: [
  '......kkkkk.....',
  '.....ksssssk....',
  '....ksssssssk...',
  '....kskssksk....',
  '....ksssdssk....',
  '.....kssddk.....',
  '....kksssskk....',
  '..kksssssssskk..',
  '.kssksssssskssk.',
  '.ksdkssssssdksk.',
  '.kk.kdssssdk.kk.',
  '....kssddssk....',
  '....kgppppgk....',
  '....kppPPppk....',
  '.....kppppk.....',
  '.....kpppk......',
  '......kgk.......',
  '......kWwk......',
  '......kwwk......',
  '.......kk.......'],
  hang: [
  '....kkk..kkk....',
  '...kssskksssk...',
  '....kssssssk....',
  '....kskssksk....',
  '....ksssdssk....',
  '.....kssddk.....',
  '....kksssskk....',
  '....kssssssk....',
  '....kdssssdk....',
  '....kssddssk....',
  '....kgppppgk....',
  '....kppPPppk....',
  '....kpppppk.....',
  '....kppppk......',
  '....kPpk........',
  '....kpk.........',
  '....kbk.........',
  '....kbbk........',
  '....kkkk........',
  '................']
};

/* Bèstia de capitell amb ales (18x13, escala 2 = 36x26) */
const BEAST1 = [
 '......kk..........',
 '.....kGGk....kk...',
 '....kGGGGk..kGGk..',
 '...kGGGGGGkkGGGGk.',
 '..kGGGkGGGGGGGGGGk',
 '..kGGkGGGGGGGGGGk.',
 '.kGGkGGGGGGGGGGGGk',
 '.kGkkGRGGGGGGGRGGk',
 '.kk.kGGGGGGGGGGGGk',
 '....kGGGkDDDDGGGk.',
 '...kGGk.kGGGGk.GGk',
 '..kDDk..kGGGGk....',
 '..kkk...kDDk.kDDk.',
];
const BEAST2 = [
 '..............kk..',
 '......kk....kGGk..',
 '.....kGGk..kGGGGk.',
 '....kGGGGkkGGGGGGk',
 '..kGGGGGGGGGGGkGGk',
 '..kGGGGGGGGGGGGkGk',
 '.kGGGGGGGGGGGGGGkk',
 '.kGRGGGGGGGRGGGGk.',
 '.kGGGGGGGGGGGGk...',
 'kGGGGkDDDDkGGGGk..',
 'kGGk.kGGGGk.kGGk..',
 'kk...kGGGGk..kDDk.',
 '.....kDDk....kkk..',
];

/* Dimoni de Taüll (14x12, escala 2 = 28x24) */
const DEMON1 = [
 '..kk........kk..',
 '.kRRk......kRRk.',
 '.kRRRkkkkkkRRRk.',
 'kRkRRRRRRRRRRkRk',
 'kRRkrRRRRRRrkRRk',
 'kRkrRRkRRkRRkrRk',
 '.kkrRRRRRRRRrkk.',
 '..kkrRrrrrRkk...',
 '..kRRkkkkkkRRk..',
 '.kRk........kRk.',
 '.kk..........kk.',
 '................'];
const DEMON2 = [
 '................',
 '..kk........kk..',
 '.kRRk......kRRk.',
 '.kRRRkkkkkkRRRk.',
 '.kkRRRRRRRRRRkk.',
 '.kRkrRRRRRRrkRk.',
 'kRkrRRkRRkRRkrRk',
 'kRkrRRRRRRRRkrRk',
 '.kkkrRrrrrRkkk..',
 '..kk.kkkkkk.kk..',
 '................',
 '................'];

/* Vitrina gòtica amb vidre (16x24, escala 2 = 32x48) */
const VITRINA = [
 '......kkkk......',
 '....kkppppkk....',
 '...kppCCCCppk...',
 '..kpCccccccCpk..',
 '..kCc......cCk..',
 '.kCc........cCk.',
 '.kClW.......lCk.',
 '.kClW.......lCk.',
 '.kCl........lCk.',
 '.kCl........lCk.',
 '.kCl........lCk.',
 '.kCl........lCk.',
 '.kCl........lCk.',
 '.kCllllllllllCk.',
 '.kCccccccccccCk.',
 '..kCCppppppCCk..',
 '..kpk.kCCCk.kpk.',
 '..kpk.kCCCk.kpk.',
 '..kpk.kCCCk.kpk.',
 '..kpkkCCCCCkkpk.',
 '...kCCCCCCCCk...',
 '...kkkkkkkkkk...',
 '................',
 '................'];

/* Ítems de millora (8x8, escala 2 = 16x16) */
const ITEM_SWORD = [
 '..kkkk..',
 '.kWWwwk.',
 '.kWwwk..',
 '.kWwk...',
 'kggWk...',
 '.kggk...',
 '..kkk...',
 '........'];
const ITEM_ARMOR = [
 '.kkkkkk.',
 'kggggggk',
 'kgkggkgk',
 'kggggggk',
 '.kggggk.',
 '.kgGGgk.',
 '.kkkkkk.',
 '........'];
const ITEM_SHIELD = [
 'kkkkkkkk',
 'kllllllk',
 'kllWWllk',
 'kllWWllk',
 '.kllllk.',
 '..kllk..',
 '...kk...',
 '........'];

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
    x: 400, y: 40, hp: 8, maxHp: 8, phase: 0, t: 0, shootT: 90, pillarT: 260,
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
    const sx = b.x + rnd(-30, 30), sy = 118;
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
      o.x += (b.x - o.x) * 0.08; o.y += (118 - o.y) * 0.08;
      if (Math.hypot(b.x - o.x, 118 - o.y) < 14) {
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

/* ------------------------------------------------------------ fons i murals */
function hsh(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

const BG_PAL = [
  { sky0:'#1a2033', sky1:'#3c4258', far:'#2e3652', farD:'#242b44', col:'#8a7a5c', colD:'#6b5c42', arc:'#9a8a68', glow:'#f2d78a' },
  { sky0:'#241a12', sky1:'#4a3520', far:'#3a2c1c', farD:'#2c2013', col:'#9a7f4e', colD:'#7a6238', arc:'#aa8f58', glow:'#f2d78a' },
  { sky0:'#2a1c10', sky1:'#54381a', far:'#3a2814', farD:'#2c1e0e', col:'#9a7f4e', colD:'#7a6238', arc:'#b8935a', glow:'#ffe9a8' }
];

function drawBackground() {
  const s = world.stage, cx = world.camX, cy = world.camY;
  const P = BG_PAL[world.stageIdx] || BG_PAL[0];

  // cel / paret fonda
  const grad = ctx.createLinearGradient(0, 0, 0, VH);
  grad.addColorStop(0, P.sky0); grad.addColorStop(1, P.sky1);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, VW, VH);

  // capa llunyana: silueta de murs enrunats amb finestres (parallax .18)
  ctx.save(); ctx.translate(-Math.round(cx * 0.18) % 240, 0);
  const fy = Math.round(-cy * 0.18);
  for (let x = -240; x < VW + 240; x += 240) {
    for (let k = 0; k < 4; k++) {
      const seg = Math.floor((x + 10000) / 240) * 4 + k;
      const bx = x + k * 62, bh = 60 + hsh(seg, 1) * 70, bw = 44 + hsh(seg, 2) * 18;
      ctx.fillStyle = P.far;
      ctx.fillRect(bx, 196 - bh + fy, bw, bh + 90);
      ctx.fillStyle = P.farD; // cim trencat
      ctx.fillRect(bx, 196 - bh + fy, bw, 3);
      for (let j = 0; j < bw; j += 6)
        if (hsh(seg * 7 + j, 3) > 0.5) ctx.fillRect(bx + j, 196 - bh + fy - 2 - hsh(j, seg) * 5, 5, 4);
      // finestra apuntada
      if (hsh(seg, 4) > 0.35) {
        ctx.fillStyle = P.sky0;
        const wx = bx + bw / 2 - 5, wy = 196 - bh + 16 + fy;
        ctx.fillRect(wx, wy, 10, 22);
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 5, wy - 7); ctx.lineTo(wx + 10, wy); ctx.fill();
      }
    }
  }
  ctx.restore();

  // fresc de fons (parallax .35)
  if (s.mural === 2) drawPantocratorMural();
  else {
    ctx.save(); ctx.translate(-Math.round(cx * 0.35) % 560, 0);
    const my = Math.round(-cy * 0.35);
    for (let x = -560; x < VW + 560; x += 560) {
      drawFrescoPanel(x + 60, 46 + my, world.stageIdx === 1);
      drawFrescoPanel(x + 330, 52 + my, false);
    }
    ctx.restore();
  }

  // capa mitjana: arcades de pedra amb capitells (parallax .55)
  ctx.save(); ctx.translate(-Math.round(cx * 0.55) % 230, 0);
  const ay = Math.round(-cy * 0.55);
  for (let x = -230; x < VW + 230; x += 230) {
    const seg = Math.floor((x + 20000) / 230);
    const broken = hsh(seg, 9) > 0.72;
    // arc entre columnes
    ctx.strokeStyle = P.arc; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(x + 115, 178 + ay, 104, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = P.colD; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x + 115, 178 + ay, 98, Math.PI, 0); ctx.stroke();
    // columna
    const colH = broken ? 90 + hsh(seg, 5) * 40 : 190;
    ctx.fillStyle = P.col; ctx.fillRect(x + 4, 40 + ay, 24, colH);
    ctx.fillStyle = P.colD;
    for (let yy = 52; yy < 40 + colH; yy += 22) ctx.fillRect(x + 4, yy + ay, 24, 2);
    ctx.fillStyle = P.arc; ctx.fillRect(x, 40 + ay, 32, 9);           // capitell
    ctx.fillStyle = P.colD; ctx.fillRect(x + 2, 47 + ay, 28, 2);
    ctx.fillStyle = P.arc; ctx.fillRect(x - 2, 40 + colH - 4 + ay, 34, 7); // basa
    if (broken) { // cim esqueixat
      ctx.fillStyle = P.sky0;
      for (let j = 0; j < 24; j += 4)
        if (hsh(seg + j, 6) > 0.4) ctx.fillRect(x + 4 + j, 36 + ay, 4, 5);
    }
    // heura penjant del capitell
    if (hsh(seg, 7) > 0.4) {
      ctx.fillStyle = '#3f6b4f';
      const iv = 3 + Math.floor(hsh(seg, 8) * 4);
      for (let v = 0; v < iv; v++) {
        const vx = x + 2 + Math.floor(hsh(seg + v, 10) * 28), vl = 8 + hsh(v, seg) * 22;
        ctx.fillRect(vx, 49 + ay, 2, vl);
        ctx.fillStyle = v % 2 ? '#4a6741' : '#3f6b4f';
        ctx.fillRect(vx - 1, 49 + ay + vl - 4, 4, 4);
      }
    }
  }
  ctx.restore();

  // làmpares llunyanes (parallax .55)
  ctx.save(); ctx.translate(-Math.round(cx * 0.55) % 300, 0);
  const ly = Math.round(-cy * 0.55);
  for (let x = -300; x < VW + 300; x += 300) {
    ctx.fillStyle = '#4a3f22'; ctx.fillRect(x + 149, 0, 1, 40 + ly);
    ctx.fillStyle = '#6b5a2a';
    ctx.beginPath(); ctx.arc(x + 150, 46 + ly, 7, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f2d78a';
    ctx.fillRect(x + 145, 40 + ly, 2, 2); ctx.fillRect(x + 153, 40 + ly, 2, 2);
  }
  ctx.restore();

  // raigs de llum i pols en suspensió
  ctx.save();
  ctx.globalAlpha = 0.07; ctx.fillStyle = P.glow;
  for (let i = 0; i < 3; i++) {
    const sx = ((i * 220 - cx * 0.7) % (VW + 260) + VW + 260) % (VW + 260) - 130;
    ctx.beginPath();
    ctx.moveTo(sx, 0); ctx.lineTo(sx + 46, 0); ctx.lineTo(sx - 40, VH); ctx.lineTo(sx - 86, VH);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 36; i++) {
    const dx = hsh(i, 21) * VW, dy = (hsh(i, 22) * VH + game.frame * (0.12 + hsh(i, 23) * 0.2)) % VH;
    ctx.fillStyle = 'rgba(242,215,138,' + (0.08 + hsh(i, 24) * 0.14) + ')';
    ctx.fillRect(dx, VH - dy, 1, 1);
  }
  ctx.restore();
}

function drawFrescoPanel(x, y, intact) {
  // panell de fresc romànic: arcs cecs amb sants, esquerdats i deslluit
  ctx.fillStyle = '#4a3820'; ctx.fillRect(x, y, 190, 96);
  ctx.fillStyle = '#6b4f22'; ctx.fillRect(x + 3, y + 3, 184, 90);
  ctx.fillStyle = '#54401e'; ctx.fillRect(x + 3, y + 3, 184, 5);
  ctx.fillStyle = '#7a5c1e';
  for (let i = 0; i < 46; i++) if (hsh(i, x) > 0.5) ctx.fillRect(x + 5 + i * 4, y + 4, 2, 3); // mosaic
  for (let i = 0; i < 3; i++) {
    const fx = x + 16 + i * 60;
    // arc cec
    ctx.strokeStyle = '#3a2c18'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(fx + 18, y + 42, 20, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = intact ? '#8a5a2a' : '#5d4020';
    ctx.fillRect(fx, y + 42, 37, 48);
    ctx.beginPath(); ctx.arc(fx + 18, y + 42, 17, Math.PI, 0); ctx.fill();
    // sant: mantell, cap i nimbe
    const robe = i % 2 ? '#8a3f2a' : '#2a4a6b';
    ctx.fillStyle = intact ? robe : '#4a3a28';
    ctx.fillRect(fx + 9, y + 48, 19, 38);
    ctx.beginPath(); ctx.arc(fx + 18, y + 46, 10, Math.PI, 0); ctx.fill();
    ctx.fillStyle = intact ? '#c9a06a' : '#6b5638';
    ctx.fillRect(fx + 13, y + 36, 10, 12);
    if (intact) {
      ctx.fillStyle = '#d8a23a';
      ctx.beginPath(); ctx.arc(fx + 18, y + 40, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9a06a'; ctx.fillRect(fx + 13, y + 36, 10, 12);
      ctx.fillStyle = '#14100c'; ctx.fillRect(fx + 15, y + 40, 2, 2); ctx.fillRect(fx + 20, y + 40, 2, 2);
      ctx.fillStyle = '#3a2415'; ctx.fillRect(fx + 13, y + 46, 10, 3); // barba
    }
  }
  // esquerdes i zones caigudes
  ctx.fillStyle = 'rgba(20,16,12,.55)';
  for (let i = 0; i < 5; i++) {
    const cxx = x + hsh(i, x + 3) * 180, cyy = y + hsh(i, x + 5) * 90;
    if (hsh(i, x) > (intact ? 0.8 : 0.45)) ctx.fillRect(cxx, cyy, 8 + hsh(i, 7) * 22, 5 + hsh(i, 11) * 16);
  }
  ctx.strokeStyle = 'rgba(20,16,12,.6)'; ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const cxx = x + hsh(i, x + 13) * 170, cyy = y + 6;
    ctx.beginPath(); ctx.moveTo(cxx, cyy);
    ctx.lineTo(cxx + 6 - hsh(i, 17) * 12, cyy + 30 + hsh(i, 19) * 50); ctx.stroke();
  }
}

function drawPantocratorMural() {
  const b = world.boss;
  const mx = 400 - Math.round(world.camX * 0.35), my = 6 - Math.round(world.camY * 0.35);
  const flash = b && b.flash > 0;

  // absis: bandes concèntriques de mosaic
  const bands = ['#33240f', '#4a3416', '#54401e', '#6b4f22'];
  for (let i = 0; i < bands.length; i++) {
    ctx.fillStyle = bands[i];
    ctx.beginPath(); ctx.arc(mx, my + 150, 152 - i * 12, Math.PI, 0); ctx.fill();
    ctx.fillRect(mx - 152 + i * 12, my + 150, (152 - i * 12) * 2, 84);
  }
  // punts de mosaic a la banda exterior
  ctx.fillStyle = '#7a5c1e';
  for (let a = 0; a < 40; a++) {
    const ang = Math.PI + (a / 39) * Math.PI;
    ctx.fillRect(mx + Math.cos(ang) * 145 - 1, my + 150 + Math.sin(ang) * 145 - 1, 2, 2);
  }
  // ziga-zaga decorativa
  ctx.fillStyle = '#8a6f2a';
  for (let a = 0; a < 26; a++) {
    const ang = Math.PI + (a / 25) * Math.PI;
    const r = 126 + (a % 2) * 5;
    ctx.fillRect(mx + Math.cos(ang) * r - 2, my + 150 + Math.sin(ang) * r - 2, 4, 4);
  }

  // màndorla
  ctx.fillStyle = flash ? '#fff3c8' : '#7a5c1e';
  ctx.beginPath(); ctx.ellipse(mx, my + 118, 64, 92, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = flash ? '#fff8e0' : '#96742a';
  ctx.beginPath(); ctx.ellipse(mx, my + 118, 57, 85, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = flash ? '#fffdf0' : '#b8933a';
  ctx.beginPath(); ctx.ellipse(mx, my + 118, 50, 78, 0, 0, Math.PI * 2); ctx.fill();

  // tron i coixí
  ctx.fillStyle = '#5d3a1e'; ctx.fillRect(mx - 34, my + 148, 68, 34);
  ctx.fillStyle = '#7a4a26'; ctx.fillRect(mx - 30, my + 144, 60, 10);
  ctx.fillStyle = '#8a3f2a'; ctx.fillRect(mx - 26, my + 146, 52, 5);

  // mantell blau amb plecs
  ctx.fillStyle = '#274b63';
  ctx.beginPath(); ctx.ellipse(mx, my + 148, 33, 40, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(mx - 33, my + 128, 66, 40);
  ctx.fillStyle = '#1d3a4e';
  ctx.fillRect(mx - 26, my + 130, 3, 48); ctx.fillRect(mx - 10, my + 132, 3, 50);
  ctx.fillRect(mx + 6, my + 132, 3, 50); ctx.fillRect(mx + 22, my + 130, 3, 48);
  // genolls i peus
  ctx.fillStyle = '#1d3a4e';
  ctx.beginPath(); ctx.ellipse(mx - 16, my + 176, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(mx + 16, my + 176, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a06a';
  ctx.fillRect(mx - 20, my + 182, 10, 5); ctx.fillRect(mx + 12, my + 182, 10, 5);

  // pit: túnica vermella i llibre obert
  ctx.fillStyle = '#8a3f2a'; ctx.fillRect(mx - 14, my + 96, 30, 40);
  ctx.fillStyle = '#a83232'; ctx.fillRect(mx - 12, my + 98, 26, 12);
  ctx.fillStyle = '#274b63'; ctx.fillRect(mx - 26, my + 96, 12, 40); // braç esquerre al llibre
  ctx.fillStyle = '#c9a06a'; ctx.fillRect(mx - 27, my + 132, 11, 8);  // mà esquerra
  ctx.fillStyle = '#a83232'; ctx.fillRect(mx - 26, my + 118, 22, 24); // coberta del llibre
  ctx.fillStyle = '#e8e4d8'; ctx.fillRect(mx - 24, my + 120, 9, 20);
  ctx.fillRect(mx - 13, my + 120, 9, 20);
  ctx.fillStyle = '#5d6672';
  for (let ln = 0; ln < 4; ln++) { ctx.fillRect(mx - 22, my + 123 + ln * 4, 5, 1); ctx.fillRect(mx - 11, my + 123 + ln * 4, 5, 1); }

  // braç dret alçat en gest de llei
  ctx.fillStyle = '#274b63'; ctx.fillRect(mx + 16, my + 88, 12, 34);
  ctx.fillStyle = '#1d3a4e'; ctx.fillRect(mx + 22, my + 76, 9, 16);
  ctx.fillStyle = '#c9a06a'; ctx.fillRect(mx + 23, my + 62, 8, 15);   // mà
  ctx.fillRect(mx + 24, my + 58, 2, 5); ctx.fillRect(mx + 27, my + 56, 2, 7); ctx.fillRect(mx + 30, my + 58, 2, 5); // dits

  // cap, nimbe crucífer
  ctx.fillStyle = flash ? '#fff3c8' : '#d8a23a';
  ctx.beginPath(); ctx.arc(mx, my + 52, 21, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a83232';
  ctx.fillRect(mx - 1, my + 36, 3, 32); ctx.fillRect(mx - 14, my + 48, 29, 3);
  ctx.fillStyle = '#c9a06a';
  ctx.beginPath(); ctx.arc(mx, my + 52, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b07f'; ctx.fillRect(mx - 6, my + 48, 12, 8);
  ctx.fillStyle = '#3a2415';
  ctx.fillRect(mx - 12, my + 42, 24, 6);          // cabell
  ctx.fillRect(mx - 13, my + 48, 3, 14); ctx.fillRect(mx + 10, my + 48, 3, 14); // bandes laterals
  ctx.fillRect(mx - 8, my + 57, 16, 9);           // barba
  ctx.fillStyle = '#14100c';
  ctx.fillRect(mx - 6, my + 50, 3, 2); ctx.fillRect(mx + 3, my + 50, 3, 2); // ulls
  ctx.fillRect(mx - 1, my + 55, 2, 1);            // nas

  // alfa i omega
  drawText('A', mx - 52, my + 44, '#f2d78a', 13, 'center');
  drawText('Ω', mx + 52, my + 44, '#f2d78a', 13, 'center');

  // àngels laterals amb ales
  for (const sx of [-92, 92]) {
    const ax = mx + sx, ay = my + 92;
    ctx.fillStyle = '#8f9aa8'; // ales
    ctx.beginPath(); ctx.ellipse(ax - (sx < 0 ? -10 : 10), ay + 8, 9, 22, sx < 0 ? -0.5 : 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5d3a4a'; // túnica
    ctx.fillRect(ax - 8, ay, 16, 52);
    ctx.fillStyle = '#4a2c3a'; ctx.fillRect(ax - 8, ay + 18, 16, 3); ctx.fillRect(ax - 8, ay + 34, 16, 3);
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(ax - 5, ay - 10, 10, 11); // cap
    ctx.fillStyle = '#d8a23a'; ctx.beginPath(); ctx.arc(ax, ay - 6, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(ax - 5, ay - 10, 10, 11);
    ctx.fillStyle = '#3a2415'; ctx.fillRect(ax - 5, ay - 11, 10, 3);
    ctx.fillStyle = '#5d3a4a'; // braços en oració
    ctx.fillRect(ax - 12, ay + 8, 6, 14); ctx.fillRect(ax + 6, ay + 8, 6, 14);
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(ax - 3, ay + 12, 6, 6);
  }

  // banda d'apòstols sota l'absis
  for (let i = 0; i < 6; i++) {
    const px2 = mx - 100 + i * 40, py = my + 244;
    ctx.strokeStyle = '#3a2c18'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px2, py, 15, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = i % 2 ? '#8a3f2a' : '#2a4a6b';
    ctx.fillRect(px2 - 8, py - 2, 16, 26);
    ctx.beginPath(); ctx.arc(px2, py - 2, 8, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(px2 - 4, py - 10, 8, 8);
    ctx.fillStyle = '#d8a23a'; ctx.fillRect(px2 - 6, py - 12, 12, 2);
  }

  // barra de vida del cap
  if (b) {
    ctx.fillStyle = 'rgba(5,6,12,.6)'; ctx.fillRect(VW / 2 - 62, 32, 124, 11);
    ctx.strokeStyle = '#8a6f42'; ctx.strokeRect(VW / 2 - 61.5, 32.5, 123, 10);
    ctx.fillStyle = '#a83232'; ctx.fillRect(VW / 2 - 59, 35, 118 * (b.hp / b.maxHp), 5);
    drawText('PANTOCRÀTOR', VW / 2, 45, '#f2d78a', 7, 'center');
  }
}

/* Emblema del Pantocràtor per a la pantalla de títol (centrat, escala fixa) */
function drawTitleEmblem(cx, cy) {
  ctx.fillStyle = '#7a5c1e';
  ctx.beginPath(); ctx.ellipse(cx, cy, 30, 44, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b8933a';
  ctx.beginPath(); ctx.ellipse(cx, cy, 25, 39, 0, 0, Math.PI * 2); ctx.fill();
  // mantell blau
  ctx.fillStyle = '#274b63';
  ctx.beginPath(); ctx.ellipse(cx, cy + 14, 14, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 14, cy + 8, 28, 18);
  ctx.fillStyle = '#1d3a4e'; ctx.fillRect(cx - 8, cy + 8, 2, 24); ctx.fillRect(cx + 6, cy + 8, 2, 24);
  // túnica i llibre
  ctx.fillStyle = '#8a3f2a'; ctx.fillRect(cx - 6, cy, 13, 14);
  ctx.fillStyle = '#a83232'; ctx.fillRect(cx - 12, cy + 8, 10, 11);
  ctx.fillStyle = '#e8e4d8'; ctx.fillRect(cx - 11, cy + 9, 4, 9); ctx.fillRect(cx - 6, cy + 9, 4, 9);
  // braç dret alçat
  ctx.fillStyle = '#274b63'; ctx.fillRect(cx + 8, cy - 6, 5, 14);
  ctx.fillStyle = '#c9a06a'; ctx.fillRect(cx + 9, cy - 13, 4, 8);
  // nimbe i cap
  ctx.fillStyle = '#d8a23a'; ctx.beginPath(); ctx.arc(cx, cy - 16, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a83232'; ctx.fillRect(cx - 1, cy - 24, 2, 16); ctx.fillRect(cx - 7, cy - 17, 14, 2);
  ctx.fillStyle = '#c9a06a'; ctx.beginPath(); ctx.arc(cx, cy - 16, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2415'; ctx.fillRect(cx - 6, cy - 21, 12, 3); ctx.fillRect(cx - 4, cy - 13, 8, 4);
  ctx.fillStyle = '#14100c'; ctx.fillRect(cx - 3, cy - 17, 2, 1); ctx.fillRect(cx + 2, cy - 17, 2, 1);
}

function drawWorld() {
  const s = world.stage, cx = Math.round(world.camX), cy = Math.round(world.camY);
  ctx.save();
  ctx.translate(-cx + (world.shake ? rnd(-world.shake, world.shake) : 0), -cy + (world.shake ? rnd(-world.shake, world.shake) : 0));
  if (world.shake > 0) world.shake *= 0.85;

  // terra: marbre escairat / pis inferior fosc
  for (const g of s.ground) drawFloor(g.x, g.w, GY, ['#b3a586', '#9a8b6a', '#8a7a58'], false);
  for (const g of s.lower) drawFloor(g.x, g.w, LY, ['#4a4a56', '#3a3a46', '#2e2e38'], true);

  // vores trencades dels forats
  ctx.fillStyle = '#6b5c42';
  for (let i = 0; i < s.ground.length - 1; i++) {
    const gx = s.ground[i].x + s.ground[i].w;
    for (let j = 0; j < 5; j++) if (hsh(gx + j, 31) > 0.4) ctx.fillRect(gx - 4 + j * 2, GY - 2 - hsh(j, gx) * 5, 3, 4);
    const gx2 = s.ground[i + 1].x;
    for (let j = 0; j < 5; j++) if (hsh(gx2 - j, 32) > 0.4) ctx.fillRect(gx2 + j * 2, GY - 2 - hsh(j, gx2) * 5, 3, 4);
  }
  // enderrocs als fons dels forats i al pis inferior
  for (let i = 0; i < s.ground.length - 1; i++) {
    const gx = s.ground[i].x + s.ground[i].w;
    drawRubble(gx + 12, LY, 46);
  }

  // plataformes: bancs modernistes (trencadís) i pedra
  for (const p of s.platforms) {
    if (p.t === 'stone') {
      ctx.fillStyle = '#5d5142'; ctx.fillRect(p.x, p.y, p.w, p.h + 4);
      ctx.fillStyle = '#8a7a5c'; ctx.fillRect(p.x, p.y, p.w, 3);
      ctx.fillStyle = '#3a3226';
      for (let i = 4; i < p.w - 4; i += 14) if (hsh(p.x + i, 41) > 0.5) ctx.fillRect(p.x + i, p.y + 3, 1, p.h);
    } else {
      // banc Gaudí: respaldo de trencadís, seient de fusta, potes de ferro
      const trenc = ['#7fb3d8', '#e8e4d8', '#4a90b8', '#d8a23a', '#8fb8d8', '#c9ced8'];
      for (let tx = 0; tx < p.w - 8; tx += 4)
        for (let ty = 0; ty < 8; ty += 4) {
          ctx.fillStyle = trenc[Math.floor(hsh(p.x + tx, ty * 7) * trenc.length)];
          ctx.fillRect(p.x + 4 + tx, p.y - 11 + ty, 3, 3);
        }
      ctx.strokeStyle = '#4a3a20'; ctx.lineWidth = 1;
      ctx.strokeRect(p.x + 3.5, p.y - 11.5, p.w - 7, 10);
      ctx.fillStyle = '#4a3a20';
      ctx.fillRect(p.x + 2, p.y - 13, 3, 13); ctx.fillRect(p.x + p.w - 5, p.y - 13, 3, 13);
      // seient
      ctx.fillStyle = '#8a6f42'; ctx.fillRect(p.x, p.y - 1, p.w, 6);
      ctx.fillStyle = '#caa86a'; ctx.fillRect(p.x, p.y - 1, p.w, 1);
      ctx.fillStyle = '#6b4f2a';
      for (let i = 6; i < p.w; i += 10) ctx.fillRect(p.x + i, p.y, 1, 5);
      // potes de ferro forjat
      ctx.fillStyle = '#2c2620';
      ctx.fillRect(p.x + 6, p.y + 5, 3, 10); ctx.fillRect(p.x + p.w - 9, p.y + 5, 3, 10);
      ctx.fillRect(p.x + 5, p.y + 13, 5, 2); ctx.fillRect(p.x + p.w - 10, p.y + 13, 5, 2);
      if (p.t === 'moving') {
        ctx.fillStyle = 'rgba(242,215,138,' + (0.12 + 0.1 * Math.sin(game.frame / 20)) + ')';
        ctx.fillRect(p.x - 2, p.y - 14, p.w + 4, 30);
      }
    }
  }

  // làmpares interactives (penjants magnètics)
  for (const ch of s.chandeliers) {
    const swing = (player.hangCh === ch) ? player.hangSwing : Math.sin(game.frame / 90 + ch.x) * 0.08;
    const hx = ch.x + Math.sin(swing) * ch.len, hy = ch.y + Math.cos(swing) * ch.len;
    // cadena d'anelles
    ctx.fillStyle = '#6b5a2a';
    const links = Math.floor(ch.len / 5);
    for (let i = 0; i <= links; i++) {
      const t = i / links;
      ctx.fillRect(ch.x + (hx - ch.x) * t - 1, ch.y + (hy - ch.y) * t - 1, 2 + (i % 2), 2);
    }
    // corona amb espelmes
    ctx.fillStyle = 'rgba(242,215,138,.10)';
    ctx.beginPath(); ctx.arc(hx, hy, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a6f2a';
    ctx.beginPath(); ctx.arc(hx, hy + 3, 10, 0, Math.PI); ctx.fill();
    ctx.fillRect(hx - 10, hy + 2, 20, 2);
    ctx.fillStyle = '#6b5a2a'; ctx.fillRect(hx - 1, hy - 6, 2, 8);
    for (let i = -2; i <= 2; i++) {
      const cxx = hx + i * 5;
      ctx.fillStyle = '#e8e4d8'; ctx.fillRect(cxx - 1, hy - 3, 2, 6);
      ctx.fillStyle = (game.frame + i * 7) % 12 < 8 ? '#f2d78a' : '#e0a050';
      ctx.fillRect(cxx - 1, hy - 6, 2, 3);
    }
    // vidres penjants
    ctx.fillStyle = '#7fd4e8';
    ctx.fillRect(hx - 7, hy + 6, 1, 3); ctx.fillRect(hx + 6, hy + 6, 1, 3); ctx.fillRect(hx, hy + 7, 1, 3);
  }

  // vitrines gòtiques
  for (const v of world.vitrinas) {
    if (v.broken) {
      drawRubble(v.x - 14, v.y, 30);
      ctx.fillStyle = '#7fd4e8';
      ctx.fillRect(v.x - 9, v.y - 3, 2, 2); ctx.fillRect(v.x + 5, v.y - 2, 2, 2);
      continue;
    }
    const im = v.c === 'sword' ? ITEM_SWORD : v.c === 'armor' ? ITEM_ARMOR : ITEM_SHIELD;
    ctx.fillStyle = 'rgba(242,215,138,.28)';
    ctx.beginPath(); ctx.arc(v.x, v.y - 28, 11, 0, Math.PI * 2); ctx.fill();
    pix(im, PAL, v.x - 8, v.y - 36, 2, false);
    pix(VITRINA, PAL, v.x - 16, v.y - 48, 2, false);
  }

  // ítems
  for (const it of world.items) {
    const bob = Math.sin(game.frame / 14) * 2;
    const map = it.c === 'sword' ? ITEM_SWORD : it.c === 'armor' ? ITEM_ARMOR : ITEM_SHIELD;
    ctx.fillStyle = 'rgba(242,215,138,.18)';
    ctx.beginPath(); ctx.arc(it.x + 6, it.y + bob + 5, 12, 0, Math.PI * 2); ctx.fill();
    pix(map, PAL, it.x - 2, it.y + bob - 3, 2, false);
  }

  // enemics
  for (const e of world.enemies) {
    if (e.hit > 0 && (e.hit % 4 < 2)) continue;
    if (e.t === 'beast') {
      pix((e.anim % 30 < 15) ? BEAST1 : BEAST2, PAL, e.x + e.w / 2 - 18, e.y + e.h - 26, 2, e.dir < 0);
    } else {
      pix((e.anim % 24 < 12) ? DEMON1 : DEMON2, PAL, e.x + e.w / 2 - 16, e.y + e.h - 24, 2, player.x < e.x);
    }
  }

  // orbes de llum
  for (const o of world.orbs) {
    ctx.fillStyle = o.returning ? 'rgba(255,248,224,.3)' : 'rgba(242,215,138,.25)';
    ctx.beginPath(); ctx.arc(o.x, o.y, o.returning ? 8 : 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = o.returning ? '#fff8e0' : '#f2d78a';
    ctx.beginPath(); ctx.arc(o.x, o.y, o.returning ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(o.x - 1, o.y - 1, 2, 2);
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
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#fff8e0';
      ctx.fillRect(b.pillarX - 16 + hsh(i, game.frame % 8) * 32, GY - 4 - hsh(i, 3) * 10, 2, 2);
    }
  }

  drawPlayer();

  // partícules
  for (const p of world.parts) { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 2, 2); }

  ctx.restore();
}

function drawRubble(x, y, w) {
  ctx.fillStyle = '#3a3226';
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= w; i += 6) ctx.lineTo(x + i, y - 3 - hsh(x + i, 51) * 8);
  ctx.lineTo(x + w, y); ctx.fill();
  ctx.fillStyle = '#5d5142';
  for (let i = 2; i < w - 2; i += 7) if (hsh(x + i, 52) > 0.4) ctx.fillRect(x + i, y - 4 - hsh(i, x) * 5, 3, 2);
}

function drawFloor(x, w, y, tones, dark) {
  // llosana de marbre escairat amb rajoles trencades
  ctx.fillStyle = tones[2]; ctx.fillRect(x, y, w, 130);
  const T = 16;
  for (let i = 0; i < w; i += T) {
    for (let yy = 0; yy < 64; yy += T) {
      const v = hsh(x + i, y + yy);
      const even = ((i + yy) / T) % 2 === 0;
      ctx.fillStyle = even ? tones[0] : tones[1];
      ctx.fillRect(x + i, y + yy, T - 1, T - 1);
      if (v > 0.86) { ctx.fillStyle = tones[2]; ctx.fillRect(x + i + 2, y + yy + 2, T - 5, T - 5); }       // rajola caiguda
      else if (v > 0.7) { ctx.fillStyle = tones[2]; ctx.fillRect(x + i + 3, y + yy + 5, T - 6, 1); ctx.fillRect(x + i + 7, y + yy + 5, 1, 7); } // esquerda
    }
  }
  const fg = ctx.createLinearGradient(0, y + 30, 0, y + 110);
  fg.addColorStop(0, 'rgba(10,8,6,0)'); fg.addColorStop(1, 'rgba(10,8,6,.62)');
  ctx.fillStyle = fg; ctx.fillRect(x, y + 30, w, 100);
  ctx.fillStyle = dark ? '#5a5a68' : '#d8cbb0'; ctx.fillRect(x, y, w, 2); // cantell il·luminat
  // herba rústega a la vora
  ctx.fillStyle = '#3f6b4f';
  for (let i = 10; i < w - 4; i += 34) {
    if (hsh(x + i, 61) > 0.45) {
      ctx.fillRect(x + i, y - 3, 2, 3); ctx.fillRect(x + i + 3, y - 5, 2, 5); ctx.fillRect(x + i + 6, y - 2, 2, 2);
    }
  }
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
  const px = player.x + player.w / 2 - 16, py = player.y + player.h - 40;
  pix(map, PAL, px, py, 2, flip);

  // espasa en mà (idle/run/aire): fulla curta cap endavant
  if (player.state === 'idle' || player.state === 'run' || player.state === 'air') {
    const sx = flip ? px + 2 : px + 22;
    ctx.fillStyle = '#d8a23a'; ctx.fillRect(sx, py + 19, 3, 3);
    ctx.fillStyle = '#f4f8ff'; ctx.fillRect(flip ? sx - 10 : sx + 3, py + 19, 10, 2);
    ctx.fillStyle = '#b9c4d2'; ctx.fillRect(flip ? sx - 10 : sx + 3, py + 21, 10, 1);
  }
  // espasa d'atac: llargària segons arma, amb arc del cop
  if (player.state === 'attack' || player.state === 'dive') {
    const long = player.weapon >= 2;
    const len = long ? 30 : 22;
    ctx.fillStyle = '#f4f8ff';
    if (player.state === 'dive') {
      ctx.fillRect(player.x + 3, player.y + player.h - 2, 5, long ? 18 : 12);
      ctx.fillStyle = 'rgba(244,248,255,.3)';
      ctx.fillRect(player.x + 1, player.y + player.h - 2, 9, long ? 18 : 12);
    } else {
      const sx = flip ? px + 6 - len : px + 26;
      ctx.fillRect(sx, py + 14, len, 3);
      ctx.fillStyle = '#b9c4d2'; ctx.fillRect(sx, py + 17, len, 1);
      ctx.fillStyle = 'rgba(244,248,255,.25)';
      ctx.fillRect(sx, py + 9, len, 13);
    }
  }
  // escut actiu
  if (player.shield > 0) {
    ctx.strokeStyle = 'rgba(127,212,232,.7)'; ctx.lineWidth = 1;
    ctx.strokeRect(player.x - 6, player.y - 8, player.w + 12, player.h + 12);
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
  ctx.fillStyle = 'rgba(5,6,12,.5)'; ctx.fillRect(0, 0, VW, VH);
  drawTitleEmblem(VW / 2, 88);
  const T = 'PANTOCRÀTOR';
  ctx.font = 'bold 34px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#14100c'; ctx.fillText(T, VW / 2 + 2, 150);
  ctx.fillStyle = '#d8a23a'; ctx.fillText(T, VW / 2, 148);
  drawText('Ruïnes del MNAC · homenatge a l\'arcade de 1987', VW / 2, 188, '#caa86a', 9, 'center');
  if (game.frame % 90 < 60) drawText('PULSA ENTER O TOCA LA PANTALLA', VW / 2, 210, '#e8e4d8', 10, 'center');
  drawText('MOU: creueta/fletxes · SALTAR: espai · ATACAR: X', VW / 2, 230, '#8f9aa8', 8, 'center');
  drawText('Avall+atacar en l\'aire: atac descendent · Penja\'t dels llamps', VW / 2, 240, '#8f9aa8', 8, 'center');
  drawText('Trenca vitrines · Desvia els orbes amb l\'espasa · M: silenci', VW / 2, 250, '#8f9aa8', 8, 'center');
  drawText('Obra original: sprites i música procedurals, sense assets de tercers', VW / 2, 262, '#5d6672', 7, 'center');
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
