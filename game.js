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

/* -------------------------------------------- ítems i icones (mapes de píxels) */
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


/* ------------------------------------------- pintors de sprites (art amb volum) */
function lgrad(x0, y0, x1, y1, c0, c1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  return g;
}
function rgrad(cx, cy, r, c0, c1) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  return g;
}
function limb(x1, y1, x2, y2, w, c1, c2) {
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = w + 2.4; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = lgrad(x1, y1, x2, y2, c1, c2); ctx.lineWidth = w; ctx.stroke();
}
function blob(cx, cy, rx, ry, c0, c1) {
  ctx.fillStyle = '#14100c';
  ctx.beginPath(); ctx.ellipse(cx, cy, rx + 1.3, ry + 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = lgrad(cx - rx, cy - ry, cx + rx * 0.6, cy + ry, c0, c1);
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function speckle(x, y, w, h, c, n, seed) {
  ctx.fillStyle = c;
  for (let i = 0; i < n; i++) {
    ctx.fillRect(x + hsh(seed + i, 7) * w, y + hsh(seed + i, 8) * h, 1, 1);
  }
}

/* Guerrer: anatomia arcade amb volum. Peus a (0,0) locals, mira cap a +x. */
function drawWarrior(px, py, dir, st, anim, weapon) {
  ctx.save();
  ctx.translate(px, py); ctx.scale(dir, 1);
  ctx.filter = 'drop-shadow(0 0 1.6px rgba(10,8,6,.85))';
  const SK0 = '#f0c090', SK1 = '#b07a4e';
  const run = st === 'run' ? Math.sin(anim * 0.5) : 0;
  const air = (st === 'air' || st === 'dive');
  const hang = st === 'hang';
  const bob = st === 'idle' ? Math.sin(anim * 0.08) * 0.5 : 0;
  // ---- cames (maluc a -17) ----
  let lA = 0.14 + run * 0.75, rA = -0.14 - run * 0.75;
  let bendL = 0.15, bendR = 0.15;
  if (air) { lA = 0.75; rA = -0.45; bendL = 1.1; bendR = 0.9; }
  if (hang) { lA = 0.06; rA = -0.06; bendL = 0.05; bendR = 0.05; }
  leg(-2.5, -17 + bob, lA, bendL); leg(2.5, -17 + bob, rA, bendR);
  // ---- tors ----
  const lean = air ? 0.28 : st === 'attack' ? -0.22 : run * 0.08;
  ctx.save(); ctx.translate(0, -17 + bob); ctx.rotate(lean * 0.4);
  // malucs/tapall
  ctx.fillStyle = '#14100c'; ctx.fillRect(-6, -3.5, 12, 6);
  ctx.fillStyle = lgrad(0, -4, 0, 3, '#7a5a30', '#453218'); ctx.fillRect(-5, -3, 10, 5);
  // tors: trapeci amb pectoral
  ctx.beginPath();
  ctx.moveTo(-7, -4); ctx.lineTo(7, -4); ctx.lineTo(5, -16); ctx.lineTo(-5, -16); ctx.closePath();
  ctx.fillStyle = '#14100c'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, -4.5); ctx.lineTo(6, -4.5); ctx.lineTo(4.4, -15); ctx.lineTo(-4.4, -15); ctx.closePath();
  ctx.fillStyle = lgrad(-4, -16, 5, -3, SK0, SK1); ctx.fill();
  // pectoral i abdominals en ombra
  ctx.fillStyle = 'rgba(120,70,40,.55)';
  ctx.fillRect(-4, -13, 3.5, 3); ctx.fillRect(0.8, -13, 3.5, 3);
  ctx.fillRect(-3.4, -9, 2.6, 1.4); ctx.fillRect(0.8, -9, 2.6, 1.4);
  // cinturó daurat
  ctx.fillStyle = '#d8a23a'; ctx.fillRect(-5.4, -4.6, 10.8, 1.8);
  // braç esquerre (enrere)
  arm(-4, -14, hang ? 2.6 : (st === 'run' ? -run * 0.9 - 0.5 : -0.5), SK0, SK1);
  ctx.restore();
  // ---- braç dret + espasa ----
  swordArm(st, anim, weapon, bob + lean * -6, SK0, SK1);
  // ---- cap ----
  const hy = -34.5 + bob + lean * -4, hx = lean * 8;
  ctx.fillStyle = '#14100c'; ctx.beginPath(); ctx.arc(hx, hy, 5.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgrad(hx - 1.5, hy - 1.5, 7, SK0, SK1);
  ctx.beginPath(); ctx.arc(hx, hy, 4.7, 0, Math.PI * 2); ctx.fill();
  // mandíbula/ombra i trets
  ctx.fillStyle = 'rgba(120,70,40,.6)'; ctx.fillRect(hx - 1, hy + 1.5, 4.4, 2.6);
  ctx.fillStyle = '#14100c';
  ctx.fillRect(hx + 1.2, hy - 1.8, 1.6, 1.3);       // ull
  ctx.fillRect(hx + 0.6, hy - 2.9, 3.2, 0.8);       // cella
  ctx.fillStyle = '#d88a5a'; ctx.fillRect(hx + 3.6, hy - 0.4, 1.4, 1.2); // nas
  ctx.restore();
}
function leg(hx, hy, ang, bend) {
  const kx = hx + Math.sin(ang) * 8, ky = hy + Math.cos(ang) * 8;
  const fx = kx + Math.sin(ang * 0.5 - bend * 0.35) * 8, fy = ky + Math.cos(ang * 0.5 - bend * 0.35) * 8;
  limb(hx, hy, kx, ky, 5, '#e8b07f', '#b07a4e');      // cuixa
  limb(kx, ky, fx, fy - 1.5, 4.2, '#6b4f2a', '#453218'); // cama/bota
  // bota
  ctx.fillStyle = '#14100c'; ctx.fillRect(fx - 3, fy - 4, 7.5, 5);
  ctx.fillStyle = lgrad(fx - 2, fy - 4, fx + 3, fy, '#5d4526', '#2e1f10');
  ctx.fillRect(fx - 2.4, fy - 3.6, 6.4, 4);
}
function arm(sx, sy, ang, c0, c1) {
  const ex = sx + Math.sin(ang) * 6.5, ey = sy + Math.cos(ang) * 6.5;
  const hx = ex + Math.sin(ang + 0.5) * 5.5, hy = ey + Math.cos(ang + 0.5) * 5.5;
  limb(sx, sy, ex, ey, 4.4, c0, c1);
  limb(ex, ey, hx, hy, 3.8, c0, c1);
  return { hx, hy };
}
function swordArm(st, anim, weapon, bob, SK0, SK1) {
  const S = { x: 4, y: -31 + bob };
  let ang;                       // angle del braç (des de dalt-vertical)
  if (st === 'attack') ang = 1.35 - (anim % 14) * 0.06;
  else if (st === 'dive') ang = 0.15;
  else if (st === 'hang') ang = 2.75;
  else if (st === 'run') ang = 0.6 + Math.sin(anim * 0.5) * 0.35;
  else ang = 0.55;
  const h = arm(S.x, S.y, ang, SK0, SK1);
  // espasa: fulla amb volum
  const len = weapon >= 2 ? 30 : 22;
  let sa;                        // angle de la fulla (0 = horitzontal +x)
  if (st === 'attack') sa = -0.12;
  else if (st === 'dive') sa = Math.PI / 2 - 0.1;
  else if (st === 'hang') sa = -Math.PI / 2 + 0.4;
  else sa = 0.35;
  const gx = h.hx, gy = h.hy;
  const tx = gx + Math.cos(sa) * len, ty = gy + Math.sin(sa) * len;
  // rastre del cop
  if (st === 'attack') {
    ctx.fillStyle = 'rgba(244,248,255,.22)';
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.arc(gx, gy, len + 3, sa - 0.9, sa + 0.35);
    ctx.closePath(); ctx.fill();
  }
  // fulla
  ctx.beginPath();
  ctx.moveTo(gx, gy - 1.4); ctx.lineTo(tx, ty - 0.8); ctx.lineTo(tx, ty + 0.8); ctx.lineTo(gx, gy + 1.4);
  ctx.closePath();
  ctx.fillStyle = '#14100c'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(gx, gy - 0.9); ctx.lineTo(tx - 1.5, ty - 0.4); ctx.lineTo(tx - 1.5, ty + 0.4); ctx.lineTo(gx, gy + 0.9);
  ctx.closePath();
  ctx.fillStyle = lgrad(gx, gy - 1, gx, gy + 1, '#f4f8ff', '#8fa8c8'); ctx.fill();
  // empuñadura
  ctx.strokeStyle = '#d8a23a'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(gx - Math.sin(sa) * 3, gy + Math.cos(sa) * 3);
  ctx.lineTo(gx + Math.sin(sa) * 3, gy - Math.cos(sa) * 3); ctx.stroke();
}

/* Bèstia de capitell: gàrgola alada amb volum. Peus a la base del hitbox. */
function drawBeast(e, anim) {
  const dir = e.dir < 0 ? -1 : 1;
  const cx = e.x + e.w / 2, by = e.y + e.h;
  ctx.save(); ctx.translate(cx, by); ctx.scale(dir, 1);
  ctx.filter = 'drop-shadow(0 0 1.6px rgba(10,8,6,.85))';
  const flap = Math.sin(anim * 0.3);
  // ales (darrere)
  wing(-3, -14, 13, 9 + flap * 4, '#9aa6b8', '#5d6672');
  wing(-7, -12, 9, 6 + flap * 3, '#8a96a8', '#4d5662');
  // cua
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-16, -4 + flap * 2, -17, -10); ctx.stroke();
  ctx.strokeStyle = '#8f9aa8'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-10, -6); ctx.quadraticCurveTo(-16, -4 + flap * 2, -17, -10); ctx.stroke();
  // potes (4, alternes)
  const t = anim * 0.25;
  for (const [lx, ph] of [[-6, 0], [-2, Math.PI], [3, Math.PI], [7, 0]]) {
    const sw = Math.sin(t + ph) * 2;
    limb(lx, -6, lx + sw, -0.5, 3, '#8f9aa8', '#5d6672');
    ctx.fillStyle = '#14100c'; ctx.fillRect(lx + sw - 1.6, -1.5, 4, 2); // urpa
  }
  // cos
  blob(0, -8.5, 10.5, 6.5, '#aab4c4', '#5d6672');
  speckle(-8, -13, 16, 7, 'rgba(40,46,58,.5)', 14, e.x | 0);
  // cap endavant
  blob(11, -11, 5.5, 5, '#aab4c4', '#5d6672');
  // morro
  ctx.fillStyle = '#14100c'; ctx.fillRect(13, -10.5, 6, 4.4);
  ctx.fillStyle = lgrad(13, -10.5, 19, -6, '#9aa6b8', '#5d6672'); ctx.fillRect(13.6, -10, 5, 3.4);
  ctx.fillStyle = '#14100c'; ctx.fillRect(16.5, -8.6, 1.2, 1.2); // narius
  // banyes
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(8, -15); ctx.lineTo(6, -19); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -15.5); ctx.lineTo(12.5, -20); ctx.stroke();
  ctx.strokeStyle = '#c9ced8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(8, -15); ctx.lineTo(6, -19); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -15.5); ctx.lineTo(12.5, -20); ctx.stroke();
  // ull roig
  ctx.fillStyle = '#e05050'; ctx.fillRect(10.5, -12.5, 2.2, 2.2);
  ctx.fillStyle = '#fff'; ctx.fillRect(10.8, -12.3, 0.8, 0.8);
  ctx.restore();
}
function wing(x, y, w, h, c0, c1) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - w * 0.7, y - h * 1.6, x - w * 1.5, y - h * 0.9);
  ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.3, x - w * 1.4, y + h * 0.5);
  ctx.quadraticCurveTo(x - w * 0.6, y + h * 0.2, x, y + h * 0.55);
  ctx.closePath();
  ctx.fillStyle = '#14100c'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 0.5);
  ctx.quadraticCurveTo(x - w * 0.65, y - h * 1.45, x - w * 1.35, y - h * 0.8);
  ctx.quadraticCurveTo(x - w, y - h * 0.25, x - w * 1.25, y + h * 0.4);
  ctx.quadraticCurveTo(x - w * 0.55, y + h * 0.1, x, y + h * 0.4);
  ctx.closePath();
  ctx.fillStyle = lgrad(x, y - h, x - w * 1.4, y + h, c0, c1); ctx.fill();
}

/* Dimoni de Taüll: ratapinyada vermella amb ales grans. */
function drawDemon(e, anim, facingLeft) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(facingLeft ? -1 : 1, 1);
  ctx.filter = 'drop-shadow(0 0 1.6px rgba(10,8,6,.85))';
  const flap = Math.sin(anim * 0.5);
  // ales
  for (const s of [-1, 1]) {
    ctx.save(); ctx.scale(s, 1);
    ctx.beginPath();
    ctx.moveTo(2, -2);
    ctx.quadraticCurveTo(8, -8 - flap * 4, 14, -5 - flap * 5);
    ctx.quadraticCurveTo(11, -1, 12, 3 + flap * 2);
    ctx.quadraticCurveTo(7, 2, 2, 2);
    ctx.closePath();
    ctx.fillStyle = '#14100c'; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2.5, -1.8);
    ctx.quadraticCurveTo(7.5, -7 - flap * 3.6, 12.8, -4.6 - flap * 4.4);
    ctx.quadraticCurveTo(10, -1, 10.8, 2.4 + flap * 1.8);
    ctx.quadraticCurveTo(6.8, 1.5, 2.5, 1.6);
    ctx.closePath();
    ctx.fillStyle = lgrad(2, -8, 13, 3, '#e05050', '#7a1f24'); ctx.fill();
    ctx.restore();
  }
  // cos
  blob(0, 0, 6.5, 6, '#e05050', '#8a2028');
  speckle(-5, -4, 10, 8, 'rgba(60,10,14,.6)', 10, (e.x | 0) + 5);
  // banyes
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(-5, -10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -5); ctx.lineTo(5, -10); ctx.stroke();
  ctx.strokeStyle = '#f2d78a'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-3, -5); ctx.lineTo(-5, -10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(3, -5); ctx.lineTo(5, -10); ctx.stroke();
  // ulls
  ctx.fillStyle = '#f2d78a'; ctx.fillRect(-3.4, -2.5, 2.4, 2.4); ctx.fillRect(1, -2.5, 2.4, 2.4);
  ctx.fillStyle = '#14100c'; ctx.fillRect(-2.6, -1.9, 1.1, 1.1); ctx.fillRect(1.8, -1.9, 1.1, 1.1);
  // cua petita
  ctx.strokeStyle = '#8a2028'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, 5); ctx.quadraticCurveTo(-3, 8 + flap, -5, 7); ctx.stroke();
  ctx.restore();
}


/* ----------------------------------------- pintors d'entorn (volum i textura) */
let NOISE = null;
function noiseCanvas() {
  if (NOISE) return NOISE;
  NOISE = document.createElement('canvas'); NOISE.width = NOISE.height = 96;
  const n = NOISE.getContext('2d');
  for (let i = 0; i < 900; i++) {
    const v = hsh(i, 91) > 0.5 ? 255 : 0;
    n.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.05 + hsh(i, 92) * 0.08) + ')';
    n.fillRect(hsh(i, 93) * 96, hsh(i, 94) * 96, 1.5, 1.5);
  }
  return NOISE;
}
function noiseOverlay(alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  for (let x = 0; x < VW; x += 96) for (let y = 0; y < VH; y += 96) ctx.drawImage(noiseCanvas(), x, y);
  ctx.restore();
}

/* Tires de terra pre-renderitzades (textura de marbre) */
function floorStrip(tones, dark) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 130;
  const g = c.getContext('2d');
  // cara frontal: pedra fosca que es perd en la foscor (sensació de llosana prima)
  const fg0 = g.createLinearGradient(0, 14, 0, 130);
  fg0.addColorStop(0, tones[2]); fg0.addColorStop(0.3, dark ? '#20202a' : '#362e22'); fg0.addColorStop(1, '#0a0806');
  g.fillStyle = fg0; g.fillRect(0, 14, 256, 116);
  // esquerdes verticals tènues a la cara
  g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1;
  for (let i = 0; i < 256; i += 17) {
    const v = hsh(i, 91 + (dark ? 40 : 0));
    if (v > 0.55) { g.beginPath(); g.moveTo(i + v * 8, 17); g.lineTo(i + v * 8 + 3 - v * 6, 18 + 10 + v * 24); g.stroke(); }
  }
  speckleOn(g, 0, 20, 256, 100, 'rgba(255,240,210,.05)', 24, dark ? 5 : 9);
  // llosana: filada única de lloses irregulars de marbre
  let i = 0;
  while (i < 256) {
    const v = hsh(i, 7 + (dark ? 9 : 0));
    const w = Math.min(18 + Math.floor(v * 16), 256 - i);
    const tone = v < 0.33 ? tones[0] : v < 0.66 ? tones[1] : tones[2];
    const lg = g.createLinearGradient(i, 0, i, 14);
    lg.addColorStop(0, tone); lg.addColorStop(1, tones[2]);
    g.fillStyle = lg; g.fillRect(i, 0, w - 1, 14);
    if (v > 0.55) {
      g.strokeStyle = 'rgba(60,50,36,.3)';
      g.beginPath(); g.moveTo(i + 3, 3 + v * 4); g.quadraticCurveTo(i + w / 2, 6 + v * 5, i + w - 4, 4 + (1 - v) * 6); g.stroke();
    }
    g.fillStyle = 'rgba(255,250,235,.16)'; g.fillRect(i, 0, w - 1, 2);
    i += w;
  }
  // cantell il·luminat i ombra sota la llosana
  g.fillStyle = dark ? '#5a5a68' : '#d8cbb0'; g.fillRect(0, 0, 256, 2);
  g.fillStyle = 'rgba(10,8,6,.45)'; g.fillRect(0, 14, 256, 3);
  // herba rústega a la vora
  g.fillStyle = '#3f6b4f';
  for (let x = 10; x < 250; x += 34) {
    if (hsh(x, 61) > 0.45) { g.fillRect(x, 0, 2, 3); g.fillRect(x + 3, 0, 2, 5); g.fillRect(x + 6, 1, 2, 2); }
  }
  return c;
}
function speckleOn(g, x, y, w, h, c, n, seed) {
  g.fillStyle = c;
  for (let k = 0; k < n; k++) g.fillRect(x + hsh(k, seed) * w, y + hsh(k, seed + 1) * h, 1.4, 1.4);
}
function ensureFloorStrips() {
  if (world._strips) return;
  world._strips = {
    main: floorStrip(['#b3a586', '#9a8b6a', '#7a6c4e'], false),
    lower: floorStrip(['#4a4a56', '#3a3a46', '#26262e'], true)
  };
}
function drawFloor(x, w, y) {
  ensureFloorStrips();
  const strip = (y === LY) ? world._strips.lower : world._strips.main;
  for (let i = 0; i < w; i += 256) ctx.drawImage(strip, x + i, y);
}

/* Vitrina gòtica amb vidre i volum */
function drawVitrina(v) {
  const x = v.x, y = v.y;
  // resplendor interior
  ctx.fillStyle = rgrad(x, y - 26, 16, 'rgba(242,215,138,.3)', 'rgba(242,215,138,0)');
  ctx.fillRect(x - 16, y - 46, 32, 48);
  // ítem dins
  const im = v.c === 'sword' ? ITEM_SWORD : v.c === 'armor' ? ITEM_ARMOR : ITEM_SHIELD;
  pix(im, PAL, x - 8, y - 36, 2, false);
  // vidre: pa vertical amb degradat i reflexes
  ctx.fillStyle = lgrad(x, y - 44, x, y - 6, 'rgba(191,238,248,.34)', 'rgba(42,74,107,.42)');
  ctx.beginPath();
  ctx.moveTo(x - 11, y - 6); ctx.lineTo(x - 11, y - 34); ctx.quadraticCurveTo(x, y - 48, x + 11, y - 34);
  ctx.lineTo(x + 11, y - 6); ctx.closePath(); ctx.fill();
  // reflex diagonal
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 7, y - 14); ctx.lineTo(x - 2, y - 32); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 3, y - 16); ctx.lineTo(x + 6, y - 28); ctx.stroke();
  // marc de fusta amb volum
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 5.4; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 5); ctx.lineTo(x - 12, y - 34); ctx.quadraticCurveTo(x, y - 50, x + 12, y - 34);
  ctx.lineTo(x + 12, y - 5); ctx.stroke();
  ctx.strokeStyle = lgrad(x - 12, y - 48, x + 12, y - 6, '#8a6f42', '#453218'); ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 5); ctx.lineTo(x - 12, y - 34); ctx.quadraticCurveTo(x, y - 50, x + 12, y - 34);
  ctx.lineTo(x + 12, y - 5); ctx.stroke();
  // pinacle
  ctx.fillStyle = '#d8a23a'; ctx.fillRect(x - 1, y - 52, 2, 5);
  // base
  ctx.fillStyle = '#14100c'; ctx.fillRect(x - 14, y - 6, 28, 7);
  ctx.fillStyle = lgrad(x, y - 6, x, y, '#6b5330', '#3a2c18'); ctx.fillRect(x - 13, y - 5.4, 26, 5.6);
  ctx.fillStyle = '#8a6f42'; ctx.fillRect(x - 13, y - 5.4, 26, 1.2);
}

/* Banc Gaudí: respaldo serpentí de trencadís, seient corbat, potes orgàniques */
function drawBench(p) {
  const trenc = ['#7fb3d8', '#e8e4d8', '#4a90b8', '#d8a23a', '#8fb8d8', '#c9ced8'];
  const x0 = p.x, x1 = p.x + p.w, ym = p.y;
  // pedestals de pedra corbats
  for (const lx of [x0 + 8, x1 - 8]) {
    ctx.fillStyle = lgrad(lx - 3, ym, lx + 3, ym + 12, '#8a7a5c', '#453a2a');
    ctx.beginPath();
    ctx.moveTo(lx - 3, ym + 2); ctx.quadraticCurveTo(lx - 5, ym + 8, lx - 4, ym + 12);
    ctx.lineTo(lx + 4, ym + 12); ctx.quadraticCurveTo(lx + 5, ym + 8, lx + 3, ym + 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,16,12,.7)'; ctx.lineWidth = 1; ctx.stroke();
  }
  // seient: llosana gruixuda amb cantó frontal arrodonit
  ctx.beginPath();
  ctx.moveTo(x0, ym); ctx.lineTo(x1, ym); ctx.lineTo(x1, ym + 4);
  ctx.quadraticCurveTo(x0 + p.w / 2, ym + 8, x0, ym + 4);
  ctx.closePath();
  ctx.fillStyle = '#14100c'; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x0 + 0.5, ym + 0.5); ctx.lineTo(x1 - 0.5, ym + 0.5); ctx.lineTo(x1 - 0.5, ym + 3.4);
  ctx.quadraticCurveTo(x0 + p.w / 2, ym + 6.8, x0 + 0.5, ym + 3.4);
  ctx.closePath();
  ctx.fillStyle = lgrad(x0, ym, x0, ym + 7, '#c9a86a', '#7a5f3a'); ctx.fill();
  ctx.strokeStyle = 'rgba(255,235,200,.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x0 + 2, ym + 1.2); ctx.lineTo(x1 - 2, ym + 1.2); ctx.stroke();
  // trencadís a la vora del seient
  for (let tx = x0 + 1; tx < x1 - 2; tx += 3) {
    ctx.fillStyle = trenc[Math.floor(hsh(tx, p.y) * trenc.length)];
    ctx.fillRect(tx, ym - 0.5, 2.6, 2.2);
  }
  // respaldo baix i ondulat de mosaic
  for (let tx = x0 + 2; tx < x1 - 2; tx += 3) {
    const by = ym - 4 - Math.sin((tx - x0) / p.w * Math.PI) * 2;
    ctx.fillStyle = trenc[Math.floor(hsh(tx, 77) * trenc.length)];
    ctx.fillRect(tx, by, 2.6, 3.6);
  }
  ctx.strokeStyle = 'rgba(20,16,12,.55)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(x0 + 2, ym - 3);
  ctx.quadraticCurveTo(x0 + p.w / 2, ym - 6.6, x1 - 2, ym - 3); ctx.stroke();
  if (p.t === 'moving') {
    ctx.fillStyle = 'rgba(242,215,138,' + (0.10 + 0.08 * Math.sin(game.frame / 20)) + ')';
    ctx.fillRect(x0 - 2, ym - 8, p.w + 4, 22);
  }
}

/* Làmpara de aranya amb volum */
function drawChandelier(hx, hy) {
  ctx.fillStyle = rgrad(hx, hy, 22, 'rgba(242,215,138,.22)', 'rgba(242,215,138,0)');
  ctx.fillRect(hx - 22, hy - 22, 44, 44);
  // corona
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 4.6;
  ctx.beginPath(); ctx.ellipse(hx, hy + 3, 10, 4, 0, 0, Math.PI); ctx.stroke();
  ctx.strokeStyle = lgrad(hx - 10, hy, hx + 10, hy + 7, '#d8a23a', '#6b5a2a'); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(hx, hy + 3, 10, 4, 0, 0, Math.PI); ctx.stroke();
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(hx, hy - 7); ctx.lineTo(hx, hy + 3); ctx.stroke();
  // espelmes i flames
  for (let i = -2; i <= 2; i++) {
    const cxx = hx + i * 5, cyy = hy + 2 - Math.abs(i) * 1.2;
    ctx.fillStyle = '#14100c'; ctx.fillRect(cxx - 1.4, cyy - 5, 2.8, 6);
    ctx.fillStyle = '#e8e4d8'; ctx.fillRect(cxx - 0.9, cyy - 4.6, 1.8, 5.2);
    const fl = (game.frame + i * 7) % 12 < 8;
    ctx.fillStyle = rgrad(cxx, cyy - 6, 3.4, fl ? '#fff3c8' : '#e0a050', 'rgba(224,160,80,0)');
    ctx.beginPath(); ctx.arc(cxx, cyy - 6, 3.2, 0, Math.PI * 2); ctx.fill();
  }
  // vidres penjants
  ctx.fillStyle = 'rgba(191,238,248,.8)';
  for (const dx of [-7, 0, 7]) { ctx.fillRect(hx + dx - 0.7, hy + 6, 1.4, 3); }
}


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

/* Fons pintats generats per a aquest joc (assets/). Si falten, es fa servir el fons procedural. */
const BG_SRC = {
  hall: 'data:image/jpeg;base64,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',
  apse: 'data:image/jpeg;base64,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'
};
const BGIMGS = {};
for (const k of ['hall', 'apse']) { const im = new Image(); im.src = BG_SRC[k]; BGIMGS[k] = im; }

function drawFrescoPanel(x, y, intact) {
  // panell de fresc romànic amb volum: arcs cecs amb sants ombrejats
  ctx.fillStyle = lgrad(x, y, x, y + 96, '#54401e', '#33240f');
  ctx.fillRect(x, y, 190, 96);
  ctx.fillStyle = lgrad(x, y, x, y + 90, '#6b4f22', '#4a3416');
  ctx.fillRect(x + 3, y + 3, 184, 90);
  // sanefa de mosaic
  ctx.fillStyle = '#7a5c1e';
  for (let i = 0; i < 46; i++) if (hsh(i, x) > 0.5) ctx.fillRect(x + 5 + i * 4, y + 4, 2, 3);
  ctx.fillStyle = 'rgba(20,14,8,.4)'; ctx.fillRect(x + 3, y + 8, 184, 2);
  for (let i = 0; i < 3; i++) {
    const fx = x + 16 + i * 60;
    // arc cec amb ombra interior
    ctx.strokeStyle = '#2a1e0e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(fx + 18, y + 42, 20, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = lgrad(fx, y + 25, fx, y + 90, intact ? '#8a5a2a' : '#5d4020', intact ? '#4a3016' : '#33240f');
    ctx.fillRect(fx, y + 42, 37, 48);
    ctx.beginPath(); ctx.arc(fx + 18, y + 42, 17, Math.PI, 0); ctx.fill();
    // sant: mantell amb plecs
    const robe = i % 2 ? ['#a8503a', '#5d241a'] : ['#3a6a9b', '#1d3a4e'];
    const fade = intact ? 1 : 0.45;
    ctx.fillStyle = intact ? lgrad(fx + 9, y + 44, fx + 28, y + 90, robe[0], robe[1]) : 'rgba(74,58,40,.8)';
    ctx.beginPath();
    ctx.moveTo(fx + 12, y + 48); ctx.quadraticCurveTo(fx + 9, y + 68, fx + 10, y + 88);
    ctx.lineTo(fx + 27, y + 88); ctx.quadraticCurveTo(fx + 28, y + 68, fx + 25, y + 48);
    ctx.closePath(); ctx.fill();
    if (intact) {
      // plecs
      ctx.strokeStyle = 'rgba(20,14,8,.45)'; ctx.lineWidth = 1;
      for (const off of [14, 18, 22]) {
        ctx.beginPath(); ctx.moveTo(fx + off, y + 52); ctx.quadraticCurveTo(fx + off - 1, y + 70, fx + off, y + 86); ctx.stroke();
      }
      // llibre o rotlle
      ctx.fillStyle = '#e8e4d8'; ctx.fillRect(fx + 14, y + 62, 9, 7);
      ctx.fillStyle = '#a83232'; ctx.fillRect(fx + 14, y + 62, 2, 7);
    }
    // nimbe amb resplendor
    ctx.fillStyle = rgrad(fx + 18, y + 40, 12, intact ? 'rgba(242,215,138,.9)' : 'rgba(150,116,42,.5)', 'rgba(150,116,42,0)');
    ctx.beginPath(); ctx.arc(fx + 18, y + 40, 12, 0, Math.PI * 2); ctx.fill();
    // cap amb ombra
    ctx.fillStyle = intact ? lgrad(fx + 13, y + 34, fx + 23, y + 48, '#d8b07f', '#8a5a3a') : '#6b5638';
    ctx.beginPath(); ctx.arc(fx + 18, y + 41, 5.5, 0, Math.PI * 2); ctx.fill();
    if (intact) {
      ctx.fillStyle = '#3a2415'; ctx.fillRect(fx + 13.5, y + 43.5, 9, 3.4); // barba
      ctx.fillStyle = '#14100c';
      ctx.fillRect(fx + 15.4, y + 39.5, 1.4, 1.4); ctx.fillRect(fx + 19.4, y + 39.5, 1.4, 1.4);
      ctx.fillStyle = '#3a2415'; ctx.fillRect(fx + 13, y + 35.5, 10, 2.4); // cabell
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
  // textura granular
  speckle(x + 4, y + 4, 182, 88, 'rgba(20,14,8,.25)', 60, x | 0);
  speckle(x + 4, y + 4, 182, 88, 'rgba(242,215,138,.12)', 30, (x | 0) + 7);
}

function drawBackground() {
  const s = world.stage, cx = world.camX, cy = world.camY;
  const P = BG_PAL[world.stageIdx] || BG_PAL[0];

  const grad = ctx.createLinearGradient(0, 0, 0, VH);
  grad.addColorStop(0, P.sky0); grad.addColorStop(1, P.sky1);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, VW, VH);

  const bgim = (world.stageIdx === 2) ? BGIMGS.apse : BGIMGS.hall;
  if (bgim.complete && bgim.naturalWidth) {
    const slack = bgim.naturalWidth - VW;
    const off = slack > 0 ? -Math.min(slack, Math.round(cx * 0.12)) : 0;
    ctx.drawImage(bgim, off, Math.round(-cy * 0.05));
    if (world.stageIdx === 1) { ctx.fillStyle = 'rgba(30,20,50,.16)'; ctx.fillRect(0, 0, VW, VH); }
    if (world.stageIdx === 2 && world.boss && world.boss.flash > 0) { ctx.fillStyle = 'rgba(255,248,224,.25)'; ctx.fillRect(0, 0, VW, VH); }
  } else {
  // capa llunyana: murs enrunats
  ctx.save(); ctx.translate(-Math.round(cx * 0.18) % 240, 0);
  const fy = Math.round(-cy * 0.18);
  for (let x = -240; x < VW + 240; x += 240) {
    for (let k = 0; k < 4; k++) {
      const seg = Math.floor((x + 10000) / 240) * 4 + k;
      const bx = x + k * 62, bh = 60 + hsh(seg, 1) * 70, bw = 44 + hsh(seg, 2) * 18;
      ctx.fillStyle = lgrad(bx, 196 - bh + fy, bx, 286 + fy, P.far, P.farD);
      ctx.fillRect(bx, 196 - bh + fy, bw, bh + 90);
      ctx.fillStyle = P.farD;
      ctx.fillRect(bx, 196 - bh + fy, bw, 3);
      for (let j = 0; j < bw; j += 6)
        if (hsh(seg * 7 + j, 3) > 0.5) ctx.fillRect(bx + j, 196 - bh + fy - 2 - hsh(j, seg) * 5, 5, 4);
      if (hsh(seg, 4) > 0.35) {
        ctx.fillStyle = P.sky0;
        const wx = bx + bw / 2 - 5, wy = 196 - bh + 16 + fy;
        ctx.fillRect(wx, wy, 10, 22);
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + 5, wy - 7); ctx.lineTo(wx + 10, wy); ctx.fill();
      }
      // vore il·luminada
      ctx.fillStyle = 'rgba(255,240,210,.08)'; ctx.fillRect(bx, 196 - bh + fy, 2, bh + 90);
    }
  }
  ctx.restore();

  // fresc de fons
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

  // columnata de fons: arcs prims al terç superior, darrere del joc
  ctx.save(); ctx.translate(-Math.round(cx * 0.5) % 170, 0);
  const ay = Math.round(-cy * 0.5);
  for (let x = -170; x < VW + 170; x += 170) {
    const seg = Math.floor((x + 20000) / 170);
    const broken = hsh(seg, 9) > 0.72;
    // arc de mig punt prim
    const ag = ctx.createLinearGradient(0, 30 + ay, 0, 112 + ay);
    ag.addColorStop(0, P.arc); ag.addColorStop(1, P.colD);
    ctx.strokeStyle = '#241c10'; ctx.lineWidth = 7.4;
    ctx.beginPath(); ctx.arc(x + 85, 108 + ay, 56, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = ag; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(x + 85, 108 + ay, 56, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,240,210,.25)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x + 85, 108 + ay, 52.5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.strokeStyle = 'rgba(20,14,8,.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x + 85, 108 + ay, 50, Math.PI, 0); ctx.stroke();
    // columna prima amb volum
    const colH = broken ? 60 + hsh(seg, 5) * 26 : 116;
    ctx.fillStyle = lgrad(x + 4, 0, x + 16, 0, P.col, P.colD);
    ctx.fillRect(x + 4, 52 + ay, 12, colH);
    ctx.fillStyle = 'rgba(255,240,210,.2)'; ctx.fillRect(x + 5, 52 + ay, 2, colH);
    ctx.fillStyle = 'rgba(20,14,8,.3)';
    for (let yy = 62; yy < 52 + colH; yy += 18) ctx.fillRect(x + 4, yy + ay, 12, 1.4);
    // capitell esculpit
    ctx.fillStyle = lgrad(x + 1, 44 + ay, x + 1, 53 + ay, P.arc, P.colD);
    ctx.fillRect(x + 1, 44 + ay, 18, 8);
    ctx.fillStyle = 'rgba(20,14,8,.5)'; ctx.fillRect(x + 3, 49 + ay, 14, 1.4);
    for (let j = 0; j < 3; j++) ctx.fillRect(x + 3 + j * 5, 45.5 + ay, 1.6, 4);
    ctx.fillStyle = 'rgba(255,240,210,.28)'; ctx.fillRect(x + 1, 44 + ay, 18, 1.6);
    // basa
    ctx.fillStyle = lgrad(x, 52 + colH - 3 + ay, x, 60 + colH + ay, P.arc, P.colD);
    ctx.fillRect(x, 52 + colH - 3 + ay, 20, 6);
    if (broken) {
      ctx.fillStyle = P.sky0;
      for (let j = 0; j < 12; j += 4)
        if (hsh(seg + j, 6) > 0.4) ctx.fillRect(x + 4 + j, 40 + ay, 4, 5);
    }
    // heura
    if (hsh(seg, 7) > 0.45) {
      const iv = 2 + Math.floor(hsh(seg, 8) * 3);
      for (let v = 0; v < iv; v++) {
        const vx = x + 2 + Math.floor(hsh(seg + v, 10) * 16), vl = 6 + hsh(v, seg) * 16;
        ctx.strokeStyle = v % 2 ? '#4a6741' : '#3f6b4f'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(vx, 52 + ay);
        ctx.quadraticCurveTo(vx + 2, 52 + ay + vl / 2, vx - 1, 52 + ay + vl); ctx.stroke();
      }
    }
  }
  ctx.restore();

  // làmpares llunyanes
  ctx.save(); ctx.translate(-Math.round(cx * 0.55) % 300, 0);
  const ly = Math.round(-cy * 0.55);
  for (let x = -300; x < VW + 300; x += 300) {
    ctx.fillStyle = '#4a3f22'; ctx.fillRect(x + 149, 0, 1, 40 + ly);
    ctx.fillStyle = rgrad(x + 150, 46 + ly, 12, 'rgba(242,215,138,.35)', 'rgba(242,215,138,0)');
    ctx.fillRect(x + 138, 34 + ly, 24, 24);
    ctx.fillStyle = '#6b5a2a';
    ctx.beginPath(); ctx.arc(x + 150, 46 + ly, 7, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#f2d78a';
    ctx.fillRect(x + 145, 40 + ly, 2, 2); ctx.fillRect(x + 153, 40 + ly, 2, 2);
  }
  ctx.restore();

  }

  // raigs de llum i pols
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
  noiseOverlay(0.05);
}


function drawPantocratorMural() {
  const b = world.boss;
  const mx = 400 - Math.round(world.camX * 0.35), my = 6 - Math.round(world.camY * 0.35);
  const flash = b && b.flash > 0;

  // absis amb degradat radial daurat
  ctx.fillStyle = rgrad(mx, my + 150, 160, '#6b4f22', '#241806');
  ctx.beginPath(); ctx.arc(mx, my + 150, 152, Math.PI, 0); ctx.fill();
  ctx.fillRect(mx - 152, my + 150, 304, 84);
  // bandes de mosaic
  for (const [r, col] of [[138, '#54401e'], [126, '#6b4f22']]) {
    ctx.strokeStyle = col; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.arc(mx, my + 150, r, Math.PI, 0); ctx.stroke();
  }
  ctx.fillStyle = '#7a5c1e';
  for (let a = 0; a < 40; a++) {
    const ang = Math.PI + (a / 39) * Math.PI;
    ctx.fillRect(mx + Math.cos(ang) * 145 - 1, my + 150 + Math.sin(ang) * 145 - 1, 2, 2);
  }
  ctx.fillStyle = '#8a6f2a';
  for (let a = 0; a < 26; a++) {
    const ang = Math.PI + (a / 25) * Math.PI;
    const r = 126 + (a % 2) * 5;
    ctx.fillRect(mx + Math.cos(ang) * r - 2, my + 150 + Math.sin(ang) * r - 2, 4, 4);
  }

  // màndorla amb resplendor
  ctx.fillStyle = rgrad(mx, my + 118, 95, flash ? '#fff8e0' : '#b8933a', flash ? '#fff3c8' : '#54401e');
  ctx.beginPath(); ctx.ellipse(mx, my + 118, 64, 92, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#7a5c1e'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.ellipse(mx, my + 118, 56, 84, 0, 0, Math.PI * 2); ctx.stroke();

  // tron
  ctx.fillStyle = lgrad(mx - 34, my + 144, mx + 34, my + 184, '#7a4a26', '#3a2412');
  ctx.fillRect(mx - 34, my + 148, 68, 34);
  ctx.fillStyle = '#8a3f2a'; ctx.fillRect(mx - 30, my + 144, 60, 10);
  ctx.fillStyle = 'rgba(255,220,170,.25)'; ctx.fillRect(mx - 30, my + 144, 60, 2);

  // mantell blau amb plecs corbats
  ctx.fillStyle = lgrad(mx - 33, my + 100, mx + 33, my + 190, '#3a6a9b', '#142c3e');
  ctx.beginPath();
  ctx.moveTo(mx - 14, my + 96);
  ctx.quadraticCurveTo(mx - 34, my + 120, mx - 33, my + 168);
  ctx.quadraticCurveTo(mx - 30, my + 186, mx - 18, my + 186);
  ctx.lineTo(mx + 18, my + 186);
  ctx.quadraticCurveTo(mx + 30, my + 186, mx + 33, my + 168);
  ctx.quadraticCurveTo(mx + 34, my + 120, mx + 14, my + 96);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(10,20,30,.5)'; ctx.lineWidth = 1.6;
  for (const off of [-22, -8, 8, 22]) {
    ctx.beginPath();
    ctx.moveTo(mx + off, my + 116);
    ctx.quadraticCurveTo(mx + off * 1.2, my + 150, mx + off * 1.1, my + 182);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(160,200,235,.3)'; ctx.lineWidth = 1.2;
  for (const off of [-15, 1, 15]) {
    ctx.beginPath();
    ctx.moveTo(mx + off, my + 114);
    ctx.quadraticCurveTo(mx + off * 1.2, my + 148, mx + off * 1.1, my + 180);
    ctx.stroke();
  }
  // genolls i peus
  ctx.fillStyle = lgrad(mx - 26, my + 168, mx - 6, my + 186, '#2a4a63', '#142c3e');
  ctx.beginPath(); ctx.ellipse(mx - 16, my + 176, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = lgrad(mx + 6, my + 168, mx + 26, my + 186, '#2a4a63', '#142c3e');
  ctx.beginPath(); ctx.ellipse(mx + 16, my + 176, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c9a06a';
  ctx.fillRect(mx - 20, my + 182, 10, 5); ctx.fillRect(mx + 12, my + 182, 10, 5);

  // pit: túnica vermella amb plecs
  ctx.fillStyle = lgrad(mx - 14, my + 96, mx + 16, my + 140, '#c0503a', '#5d1e14');
  ctx.beginPath();
  ctx.moveTo(mx - 12, my + 96); ctx.lineTo(mx + 14, my + 96);
  ctx.quadraticCurveTo(mx + 18, my + 118, mx + 14, my + 138);
  ctx.lineTo(mx - 10, my + 138); ctx.quadraticCurveTo(mx - 14, my + 118, mx - 12, my + 96);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(40,10,8,.5)'; ctx.lineWidth = 1.2;
  for (const off of [-6, 0, 6]) {
    ctx.beginPath(); ctx.moveTo(mx + off, my + 100); ctx.quadraticCurveTo(mx + off + 2, my + 118, mx + off, my + 134); ctx.stroke();
  }
  // llibre obert
  ctx.fillStyle = '#a83232'; ctx.fillRect(mx - 27, my + 117, 24, 26);
  ctx.fillStyle = lgrad(mx - 25, my + 119, mx - 3, my + 139, '#f4efe0', '#c9bfa8');
  ctx.fillRect(mx - 25, my + 119, 10, 22); ctx.fillRect(mx - 13, my + 119, 10, 22);
  ctx.fillStyle = '#5d6672';
  for (let ln = 0; ln < 4; ln++) { ctx.fillRect(mx - 23, my + 122 + ln * 4, 6, 1); ctx.fillRect(mx - 11, my + 122 + ln * 4, 6, 1); }
  ctx.fillStyle = '#a83232'; ctx.fillRect(mx - 15, my + 117, 2, 26);
  // mà esquerra sobre el llibre
  ctx.fillStyle = '#c9a06a'; ctx.fillRect(mx - 28, my + 132, 9, 8);

  // braç dret alçat
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(mx + 14, my + 104); ctx.quadraticCurveTo(mx + 26, my + 92, mx + 26, my + 78); ctx.stroke();
  ctx.strokeStyle = lgrad(mx + 14, my + 104, mx + 26, my + 78, '#3a6a9b', '#1d3a4e'); ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(mx + 14, my + 104); ctx.quadraticCurveTo(mx + 26, my + 92, mx + 26, my + 78); ctx.stroke();
  // mà beneint
  ctx.fillStyle = lgrad(mx + 22, my + 58, mx + 31, my + 78, '#d8b07f', '#a07040');
  ctx.fillRect(mx + 22, my + 60, 9, 18);
  ctx.fillStyle = '#d8b07f';
  ctx.fillRect(mx + 23, my + 54, 2.2, 8); ctx.fillRect(mx + 26, my + 52, 2.2, 10); ctx.fillRect(mx + 29, my + 54, 2.2, 8);
  ctx.fillStyle = '#14100c'; ctx.fillRect(mx + 22, my + 59, 9, 1.4);

  // cap amb nimbe crucífer
  ctx.fillStyle = rgrad(mx, my + 52, 26, flash ? '#fff3c8' : '#f2d78a', 'rgba(150,116,42,.25)');
  ctx.beginPath(); ctx.arc(mx, my + 52, 24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a83232';
  ctx.fillRect(mx - 1, my + 36, 3, 32); ctx.fillRect(mx - 14, my + 48, 29, 3);
  // cara
  ctx.fillStyle = rgrad(mx - 3, my + 48, 16, '#e0b886', '#8a5a3a');
  ctx.beginPath(); ctx.arc(mx, my + 52, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2415';
  ctx.fillRect(mx - 12, my + 42, 24, 6);
  ctx.fillRect(mx - 13, my + 48, 3, 14); ctx.fillRect(mx + 10, my + 48, 3, 14);
  // barba amb volum
  ctx.fillStyle = lgrad(mx - 8, my + 57, mx + 8, my + 68, '#4a3018', '#241606');
  ctx.beginPath();
  ctx.moveTo(mx - 8, my + 57); ctx.quadraticCurveTo(mx, my + 72, mx + 8, my + 57);
  ctx.lineTo(mx + 8, my + 62); ctx.quadraticCurveTo(mx, my + 74, mx - 8, my + 62);
  ctx.closePath(); ctx.fill();
  // trets
  ctx.fillStyle = '#14100c';
  ctx.fillRect(mx - 6, my + 50, 3, 2); ctx.fillRect(mx + 3, my + 50, 3, 2);
  ctx.fillStyle = '#a07040'; ctx.fillRect(mx - 1, my + 52, 2, 4); // nas
  // celles
  ctx.fillStyle = '#3a2415'; ctx.fillRect(mx - 7, my + 48, 4, 1.4); ctx.fillRect(mx + 3, my + 48, 4, 1.4);

  drawText('A', mx - 52, my + 44, '#f2d78a', 13, 'center');
  drawText('Ω', mx + 52, my + 44, '#f2d78a', 13, 'center');

  // àngels amb robes amb volum
  for (const sx of [-92, 92]) {
    const ax = mx + sx, ay = my + 92;
    ctx.fillStyle = lgrad(ax - 12, ay - 10, ax + 4, ay + 30, '#b8c4d4', '#5d6672');
    ctx.beginPath();
    ctx.moveTo(ax - 4, ay - 4);
    ctx.quadraticCurveTo(ax - (sx < 0 ? -18 : 18), ay - 6, ax - (sx < 0 ? -16 : 16), ay + 26);
    ctx.quadraticCurveTo(ax - (sx < 0 ? -6 : 6), ay + 18, ax - 4, ay + 12);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = lgrad(ax - 8, ay, ax + 8, ay + 52, '#7a4a5e', '#3a2230');
    ctx.beginPath();
    ctx.moveTo(ax - 8, ay + 2); ctx.quadraticCurveTo(ax - 10, ay + 28, ax - 7, ay + 52);
    ctx.lineTo(ax + 7, ay + 52); ctx.quadraticCurveTo(ax + 10, ay + 28, ax + 8, ay + 2);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(20,10,16,.5)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ax - 3, ay + 6); ctx.quadraticCurveTo(ax - 4, ay + 28, ax - 3, ay + 48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ax + 3, ay + 6); ctx.quadraticCurveTo(ax + 4, ay + 28, ax + 3, ay + 48); ctx.stroke();
    // cap i nimbe
    ctx.fillStyle = rgrad(ax, ay - 6, 11, 'rgba(242,215,138,.8)', 'rgba(150,116,42,0)');
    ctx.beginPath(); ctx.arc(ax, ay - 6, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lgrad(ax - 5, ay - 11, ax + 5, ay, '#d8b07f', '#8a5a3a');
    ctx.beginPath(); ctx.arc(ax, ay - 5, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2415'; ctx.fillRect(ax - 5, ay - 10, 10, 3);
    // mans en oració
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(ax - 3, ay + 12, 6, 7);
  }

  // apòstols sota l'absis
  for (let i = 0; i < 6; i++) {
    const px2 = mx - 100 + i * 40, py = my + 244;
    ctx.strokeStyle = '#2a1e0e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px2, py, 15, Math.PI, 0); ctx.stroke();
    const rc = i % 2 ? ['#a8503a', '#5d241a'] : ['#3a6a9b', '#1d3a4e'];
    ctx.fillStyle = lgrad(px2 - 8, py - 12, px2 + 8, py + 24, rc[0], rc[1]);
    ctx.beginPath();
    ctx.moveTo(px2 - 6, py - 2); ctx.quadraticCurveTo(px2 - 9, py + 10, px2 - 7, py + 24);
    ctx.lineTo(px2 + 7, py + 24); ctx.quadraticCurveTo(px2 + 9, py + 10, px2 + 6, py - 2);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9a06a'; ctx.fillRect(px2 - 4, py - 10, 8, 8);
    ctx.fillStyle = '#d8a23a'; ctx.fillRect(px2 - 6, py - 12, 12, 2);
  }

}

/* Barra del cap: es dibuixa al HUD, sempre per davant de l'escenari */
function drawBossBar() {
  const b = world.boss;
  if (!b) return;
  ctx.fillStyle = 'rgba(5,6,12,.6)'; ctx.fillRect(VW / 2 - 62, 32, 124, 11);
  ctx.strokeStyle = '#8a6f42'; ctx.strokeRect(VW / 2 - 61.5, 32.5, 123, 10);
  ctx.fillStyle = '#a83232'; ctx.fillRect(VW / 2 - 59, 35, 118 * (b.hp / b.maxHp), 5);
  drawText('PANTOCRÀTOR', VW / 2, 45, '#f2d78a', 7, 'center');
}

/* Emblema del Pantocràtor per a la pantalla de títol (pintat, coherent amb el mural) */
function drawTitleEmblem(cx, cy) {
  ctx.fillStyle = rgrad(cx, cy, 52, 'rgba(242,215,138,.5)', 'rgba(242,215,138,0)');
  ctx.fillRect(cx - 52, cy - 52, 104, 104);
  // màndorla daurada
  ctx.fillStyle = lgrad(cx - 26, cy - 40, cx + 26, cy + 40, '#e8c25a', '#7a5c1e');
  ctx.beginPath(); ctx.ellipse(cx, cy, 26, 40, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#54401e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(cx, cy, 21.5, 35, 0, 0, Math.PI * 2); ctx.stroke();
  // mantell blau amb plecs
  ctx.fillStyle = lgrad(cx - 12, cy - 4, cx + 12, cy + 30, '#3a6a9b', '#142c3e');
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 4); ctx.quadraticCurveTo(cx - 13, cy + 12, cx - 11, cy + 30);
  ctx.lineTo(cx + 11, cy + 30); ctx.quadraticCurveTo(cx + 13, cy + 12, cx + 7, cy - 4);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(10,20,30,.5)'; ctx.lineWidth = 1;
  for (const off of [-6, 0, 6]) { ctx.beginPath(); ctx.moveTo(cx + off, cy + 2); ctx.quadraticCurveTo(cx + off - 1, cy + 16, cx + off, cy + 28); ctx.stroke(); }
  // túnica vermella
  ctx.fillStyle = lgrad(cx - 4, cy - 2, cx + 5, cy + 14, '#a8503a', '#5d241a');
  ctx.fillRect(cx - 4, cy - 2, 9, 15);
  // llibre
  ctx.fillStyle = '#e8e4d8'; ctx.fillRect(cx - 11, cy + 6, 8, 6);
  ctx.fillStyle = '#a83232'; ctx.fillRect(cx - 11, cy + 6, 2, 6);
  ctx.strokeStyle = '#14100c'; ctx.lineWidth = 0.7; ctx.strokeRect(cx - 11, cy + 6, 8, 6);
  // braç dret alçat
  ctx.strokeStyle = '#142c3e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx + 7, cy + 2); ctx.lineTo(cx + 13, cy - 8); ctx.stroke();
  ctx.fillStyle = '#d8b07f'; ctx.beginPath(); ctx.arc(cx + 13.5, cy - 10, 2.6, 0, Math.PI * 2); ctx.fill();
  // nimbe crucífer i cap
  ctx.fillStyle = rgrad(cx, cy - 14, 11, '#f2d78a', 'rgba(216,162,58,0)');
  ctx.beginPath(); ctx.arc(cx, cy - 14, 11, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8a23a'; ctx.beginPath(); ctx.arc(cx, cy - 14, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a83232'; ctx.fillRect(cx - 1, cy - 21, 2, 14); ctx.fillRect(cx - 6, cy - 15, 12, 2);
  ctx.fillStyle = lgrad(cx - 5, cy - 19, cx + 5, cy - 9, '#e0b887', '#8a5a3a');
  ctx.beginPath(); ctx.arc(cx, cy - 14, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3a2415'; ctx.fillRect(cx - 5, cy - 18.5, 10, 2.4); ctx.fillRect(cx - 3.4, cy - 11, 6.8, 3.2);
  ctx.fillStyle = '#14100c'; ctx.fillRect(cx - 2.6, cy - 15, 1.2, 1.2); ctx.fillRect(cx + 1.6, cy - 15, 1.2, 1.2);
}


/* -------------------------------------------------------------- món (pintura) */
function drawWorld() {
  const s = world.stage, cx = Math.round(world.camX), cy = Math.round(world.camY);
  ctx.save();
  ctx.translate(-cx + (world.shake ? rnd(-world.shake, world.shake) : 0), -cy + (world.shake ? rnd(-world.shake, world.shake) : 0));
  if (world.shake > 0) world.shake *= 0.85;

  // terra: marbre pre-rendejat amb vetes i clapes
  for (const g of s.ground) drawFloor(g.x, g.w, GY);
  for (const g of s.lower) drawFloor(g.x, g.w, LY);

  // vores trencades dels forats
  ctx.fillStyle = '#6b5c42';
  for (let i = 0; i < s.ground.length - 1; i++) {
    const gx = s.ground[i].x + s.ground[i].w;
    for (let j = 0; j < 5; j++) if (hsh(gx + j, 31) > 0.4) ctx.fillRect(gx - 4 + j * 2, GY - 2 - hsh(j, gx) * 5, 3, 4);
    const gx2 = s.ground[i + 1].x;
    for (let j = 0; j < 5; j++) if (hsh(gx2 - j, 32) > 0.4) ctx.fillRect(gx2 + j * 2, GY - 2 - hsh(j, gx2) * 5, 3, 4);
  }
  // enderrocs als fons dels forats
  for (let i = 0; i < s.ground.length - 1; i++) {
    const gx = s.ground[i].x + s.ground[i].w;
    drawRubble(gx + 12, LY, 46);
  }

  // plataformes: pedra amb volum / bancs serpentins de trencadís
  for (const p of s.platforms) {
    if (p.t === 'stone') {
      ctx.fillStyle = lgrad(p.x, p.y, p.x, p.y + p.h + 4, '#7a6b52', '#3a3226');
      ctx.fillRect(p.x, p.y, p.w, p.h + 4);
      ctx.fillStyle = '#9a8a68'; ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = 'rgba(20,16,12,.5)';
      for (let i = 4; i < p.w - 4; i += 14) if (hsh(p.x + i, 41) > 0.5) ctx.fillRect(p.x + i, p.y + 3, 1, p.h);
      speckle(p.x, p.y, p.w, p.h + 4, 'rgba(0,0,0,.18)', 8, p.x);
    } else {
      drawBench(p);
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
    drawChandelier(hx, hy);
  }

  // vitrines gòtiques
  for (const v of world.vitrinas) {
    if (v.broken) {
      drawRubble(v.x - 14, v.y, 30);
      ctx.fillStyle = '#7fd4e8';
      ctx.fillRect(v.x - 9, v.y - 3, 2, 2); ctx.fillRect(v.x + 5, v.y - 2, 2, 2);
      continue;
    }
    drawVitrina(v);
  }

  // ítems
  for (const it of world.items) {
    const bob = Math.sin(game.frame / 14) * 2;
    const map = it.c === 'sword' ? ITEM_SWORD : it.c === 'armor' ? ITEM_ARMOR : ITEM_SHIELD;
    ctx.fillStyle = 'rgba(242,215,138,.18)';
    ctx.beginPath(); ctx.arc(it.x + 6, it.y + bob + 5, 12, 0, Math.PI * 2); ctx.fill();
    pix(map, PAL, it.x - 2, it.y + bob - 3, 2, false);
  }

  // enemics (pintats: gàrgola alada / esperit)
  for (const e of world.enemies) {
    if (e.hit > 0 && (e.hit % 4 < 2)) continue;
    ctx.fillStyle = 'rgba(8,6,4,.3)';
    ctx.beginPath(); ctx.ellipse(e.x + e.w / 2, e.y + e.h - 1, e.w * 0.55, 2.6, 0, 0, Math.PI * 2); ctx.fill();
    if (e.t === 'beast') drawBeast(e, e.anim);
    else drawDemon(e, e.anim, player.x < e.x);
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

  if (!player.dead) {
    ctx.fillStyle = 'rgba(8,6,4,.3)';
    ctx.beginPath(); ctx.ellipse(player.x + player.w / 2, player.y + player.h - 1, player.w * 0.7, 2.8, 0, 0, Math.PI * 2); ctx.fill();
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

function drawPlayer() {
  if (player.invuln > 0 && (game.frame % 6 < 3) && !player.dead) return; // parpelleig
  let st = player.state;
  if (player.dead) st = 'air';
  if (st !== 'run' && st !== 'air' && st !== 'attack' && st !== 'dive' && st !== 'hang') st = 'idle';
  const anim = st === 'attack' ? player.attackT : player.anim;
  const hangDrop = st === 'hang' ? 12 : 0;
  drawWarrior(player.x + player.w / 2, player.y + player.h + hangDrop, player.dir, st, anim, player.weapon);
  // escut actiu
  if (player.shield > 0) {
    ctx.strokeStyle = 'rgba(127,212,232,.7)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(player.x + player.w / 2, player.y + player.h / 2 - 2, player.w / 2 + 8, player.h / 2 + 9, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/* -------------------------------------------------------------------- HUD */
function drawHUD() {
  ctx.fillStyle = 'rgba(5,6,12,.28)'; ctx.fillRect(0, 0, VW, 34); // banda de contrast
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
  drawBossBar();
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
  drawText('Sprites i música procedurals · fons pintats generats per a aquest joc', VW / 2, 262, '#5d6672', 7, 'center');
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
