/* PANTHOKRATOR - secretos (v1): plataformas ocultas en las partes altas de los
   escenarios (con más oro y armas, solo se descubren ascendiendo) y un acceso
   parcialmente oculto con forma de tronco en el 2.º gran escenario (Jardins de
   Montjuïc) que lleva a LA DIMENSIÓ DEL TRESOR: regalos, armas y mucho oro.
   Se carga la última; no modifica game.js ni el resto de capas: las envuelve. */
(function () {
  'use strict';

  const DIM = 100;                       // stageIdx centinela de la dimensión
  const TRAVERSAL = [0, 1, 3, 4, 6, 7];  // fases de recorrido (sin arenas de jefe)
  const TRUNK = { stage: 3, x: 2750 };   // JARDINS DE MONTJUÏC

  /* ---------- inyección: plataformas secretas altas + cofres con oro y armas ---------- */
  const WROT = ['llanca', 'destral', 'martell', 'falcio', 'ballesta', 'maca'];
  for (const si of TRAVERSAL) {
    const s = STAGES[si]; if (!s || s.boss) continue;
    s.chests = s.chests || [];
    let n = 0;
    for (let x = 430; x < s.length - 380; x += 640, n++) {
      const y = 48 + (n % 3) * 16, w = 110;
      const p = { x, y, w, h: 8, t: 'secret', revealed: 0 };
      s.platforms.push(p);
      const loot = ['coinbig', 'coinbig', 'coin', WROT[(si + n) % WROT.length], 'coin'];
      if (n % 3 === 1) loot.push('heart');
      if (n % 4 === 2) loot.push('weapon');
      s.chests.push({ x: x + w / 2 - 7, y: y - 12, plat: p, loot });
    }
  }
  /* cofre de regalo a pie de suelo en la dimensión y botines sueltos se montan al entrar */

  /* ---------- estado por fase ---------- */
  world.chests = [];                     // cofres activos de la fase actual
  let snap = null;                       // copia del mundo al entrar en la dimensión
  let dimChestsSeed = 0;

  const _loadStageS = loadStage;
  loadStage = function (i) {
    _loadStageS(i);
    const s = STAGES[i];
    world.chests = (s.chests || []).map(c => ({ x: c.x, y: c.y, w: 14, h: 12, loot: c.loot, plat: c.plat || null, opened: false }));
    snap = null;
  };
  loadStage(world.stageIdx);             // rehidrata la fase actual (carga inicial del título)

  /* ---------- LA DIMENSIÓ DEL TRESOR ---------- */
  const DIMENSION = {
    name: 'LA DIMENSIÓ DEL TRESOR', time: 240, length: 1500, mural: 0,
    ground: [{ x: 0, w: 1500 }], lower: [],
    platforms: [
      { x: 210, y: 172, w: 84, h: 8, t: 'bench' }, { x: 360, y: 134, w: 84, h: 8, t: 'bench' },
      { x: 520, y: 96, w: 96, h: 8, t: 'bench' }, { x: 700, y: 140, w: 84, h: 8, t: 'bench' },
      { x: 870, y: 172, w: 84, h: 8, t: 'bench' }, { x: 1040, y: 130, w: 84, h: 8, t: 'bench' },
      { x: 1210, y: 96, w: 96, h: 8, t: 'bench' }
    ],
    chandeliers: [], sages: [], vitrinas: [], enemies: []
  };
  function dimLoot() {
    const out = [];
    // MUCHO ORO: hileras de monedas por el suelo
    for (let x = 240; x < 1420; x += 74) out.push({ x, y: GY - 10, w: 12, h: 10, c: (x % 3 ? 'coin' : 'coinbig'), vy: 0 });
    // ARMAS sueltas para fusionar
    const ws = ['llanca', 'destral', 'martell', 'falcio', 'ballesta', 'maca', 'weapon', 'weapon'];
    ws.forEach((c, i) => out.push({ x: 300 + i * 140, y: GY - 10, w: 12, h: 10, c, vy: 0 }));
    out.push({ x: 700, y: GY - 10, w: 12, h: 10, c: 'heart', vy: 0 });
    out.push({ x: 1150, y: GY - 10, w: 12, h: 10, c: 'time', vy: 0 });
    out.push({ x: 1320, y: GY - 10, w: 12, h: 10, c: 'armor', vy: 0 });
    return out;
  }
  function dimChests() {
    const mix = [
      ['coinbig', 'coinbig', 'coin', 'coin'], ['coinbig', 'heart', 'coin', 'coin'],
      ['llanca', 'coinbig', 'coin'], ['destral', 'coinbig', 'coin'], ['martell', 'coinbig', 'coin'],
      ['falcio', 'coinbig', 'coin'], ['ballesta', 'coinbig', 'coin'], ['maca', 'coinbig', 'coin'],
      ['weapon', 'coinbig', 'coinbig'], ['shield', 'coinbig', 'coin'],
      ['coinbig', 'coinbig', 'coinbig', 'pow'], ['weapon', 'heart', 'coinbig']
    ];
    const spots = [
      { x: 170, y: GY - 12 }, { x: 330, y: GY - 12 }, { x: 470, y: GY - 12 }, { x: 620, y: GY - 12 },
      { x: 770, y: GY - 12 }, { x: 930, y: GY - 12 }, { x: 1090, y: GY - 12 }, { x: 1240, y: GY - 12 },
      { x: 1380, y: GY - 12 }, { x: 540, y: 96 - 12 }, { x: 1230, y: 96 - 12 }, { x: 380, y: 134 - 12 }
    ];
    return spots.map((p, i) => ({ x: p.x, y: p.y, w: 14, h: 12, loot: mix[(i + dimChestsSeed) % mix.length], plat: null, opened: false, gift: true }));
  }

  function enterDimension() {
    dimChestsSeed++;
    snap = {
      idx: world.stageIdx, stage: world.stage,
      enemies: JSON.parse(JSON.stringify(world.enemies)),
      vitrinas: JSON.parse(JSON.stringify(world.vitrinas)),
      sages: JSON.parse(JSON.stringify(world.sages)),
      items: JSON.parse(JSON.stringify(world.items)),
      chests: JSON.parse(JSON.stringify(world.chests)),
      plats: world.stage.platforms.map(p => ({ p, r: p.revealed || 0 })),
      camX: world.camX, camY: world.camY,
      px: player.x, py: player.y, timer: player.timer, score: player.score
    };
    world.stageIdx = DIM;
    world.stage = DIMENSION;
    world.enemies = []; world.vitrinas = []; world.sages = [];
    world.orbs = []; world.parts = []; world.daggers = []; world.boss = null;
    world.items = dimLoot();
    world.chests = dimChests();
    player.x = 100; player.y = GY - player.h; player.vx = 0; player.vy = 0;
    player.state = 'idle'; player.onGround = true; player.hangCh = null;
    player.invuln = 90;
    world.camX = 0; world.camY = 0;
    world.announce = 'LA DIMENSIÓ DEL TRESOR'; world.announceT = 170;
    spawnParts(player.x + 6, player.y + 10, '#f2d78a', 22);
    sfx.clearS();
  }
  function exitDimension(end) {
    if (!snap) return;
    world.stageIdx = snap.idx; world.stage = snap.stage;
    world.enemies = snap.enemies; world.vitrinas = snap.vitrinas; world.sages = snap.sages;
    world.items = snap.items; world.chests = snap.chests;
    for (const r of snap.plats) r.p.revealed = r.r;
    world.orbs = []; world.daggers = []; world.boss = null;
    player.x = end ? snap.px : TRUNK.x - 30; player.y = GY - player.h;
    player.vx = 0; player.vy = 0; player.state = 'idle'; player.onGround = true;
    player.invuln = 90; player.hangCh = null;
    world.camX = clamp(snap.px - VW * 0.42, 0, Math.max(0, world.stage.length - VW)); world.camY = 0;
    world.announce = 'DE TORNADA ALS JARDINS'; world.announceT = 120;
    spawnParts(player.x + 6, player.y + 10, '#f2d78a', 18);
    sfx.clearS();
    snap = null;
  }

  /* ---------- flujo: dentro de la dimensión el final y la muerte devuelven al tronco ---------- */
  const _nextStageS = nextStage;
  nextStage = function () {
    if (world.stageIdx === DIM) { exitDimension(true); return; }
    _nextStageS();
  };
  const _loseLifeS = loseLife;
  loseLife = function () {
    if (world.stageIdx === DIM) { exitDimension(true); }
    _loseLifeS();
  };

  /* ---------- lógica por frame: revelado, cofres y portales ---------- */
  function openChest(ch) {
    ch.opened = true; sfx.smash(); sfx.pickup(); player.score += 50;
    spawnParts(ch.x + 7, ch.y + 4, '#f2d78a', 14);
    ch.loot.forEach((c, i) =>
      world.items.push({ x: ch.x + 1 + (i % 3) * 5, y: ch.y - 8 - i * 3, w: 12, h: 10, c, vy: -2.6 - (i % 3) * 0.5 }));
  }
  const _stepS = step;
  step = function () {
    _stepS();
    if (game.state !== 'play' || player.dead) return;
    const s = world.stage; if (!s) return;

    // plataformas secretas: se revelan al ascender a su altura
    for (const p of s.platforms) {
      if (p.t !== 'secret' || p.revealed) continue;
      const pcx = player.x + player.w / 2, feet = player.y + player.h;
      if (Math.abs(pcx - (p.x + p.w / 2)) < 92 && feet < p.y + 66) {
        p.revealed = 1; sfx.pickup();
        spawnParts(p.x + p.w / 2, p.y, '#ffe9a8', 16);
        world.announce = 'PLATAFORMA SECRETA!'; world.announceT = 100;
        player.score += 100;
      }
    }
    for (const p of s.platforms) if (p.t === 'secret' && p.revealed && p.revealed < 40) p.revealed++;

    // cofres de regalo: se abren al tocarlos o con la espada
    const sb = swordBox();
    for (const ch of world.chests) {
      if (ch.opened) continue;
      if (ch.plat && !ch.plat.revealed) continue;      // invisible hasta revelar su plataforma
      const box = { x: ch.x, y: ch.y, w: ch.w, h: ch.h };
      if (overlap(player, box) || (sb && overlap(sb, box))) openChest(ch);
    }

    // portales del tronco
    if (input.upBuf > 0 && player.onGround) {
      if (world.stageIdx === TRUNK.stage && Math.abs(player.x + player.w / 2 - TRUNK.x) < 30) {
        input.upBuf = 0; enterDimension();
      } else if (world.stageIdx === DIM && player.x < 110) {
        input.upBuf = 0; exitDimension(false);
      }
    }
  };

  /* ---------- render ---------- */
  function drawChest(ch) {
    const x = ch.x, y = ch.y, T = game.frame;
    if (ch.opened) {   // cofre abierto, vacío
      ctx.fillStyle = '#3a2a14'; ctx.fillRect(x, y + 6, 14, 6);
      ctx.fillStyle = '#241a0c'; ctx.fillRect(x, y, 14, 4);
      return;
    }
    const bob = ch.gift ? Math.sin(T / 10 + x) * 1.2 : 0;
    ctx.fillStyle = 'rgba(242,215,138,.16)';           // halo de tesoro
    ctx.beginPath(); ctx.arc(x + 7, y + 6 + bob, 13, 0, Math.PI * 2); ctx.fill();
    if (ch.gift) {   // regalo envuelto con lazo
      ctx.fillStyle = lgrad(x, y + bob, x, y + 12 + bob, '#a8324a', '#5c1626');
      ctx.fillRect(x, y + bob, 14, 12);
      ctx.fillStyle = '#f2d78a'; ctx.fillRect(x + 5.5, y + bob, 3, 12); ctx.fillRect(x, y + 4 + bob, 14, 3);
      ctx.fillStyle = '#ffe9a8';
      ctx.fillRect(x + 4, y - 3 + bob, 2.6, 3); ctx.fillRect(x + 7.4, y - 3 + bob, 2.6, 3);
    } else {         // cofre de madera y oro
      ctx.fillStyle = lgrad(x, y + bob, x, y + 12 + bob, '#7a5a2a', '#3a2a12');
      ctx.fillRect(x, y + 2 + bob, 14, 10);
      ctx.fillStyle = '#8a6a34'; ctx.fillRect(x, y + bob, 14, 4);
      ctx.fillStyle = '#d8a23a'; ctx.fillRect(x + 6, y + 2 + bob, 2, 10); ctx.fillRect(x + 5, y + 6 + bob, 4, 3);
    }
    if (Math.floor(T / 24 + x) % 3 === 0) { ctx.fillStyle = '#fff8e0'; ctx.fillRect(x + 11, y - 2 + bob, 1.6, 1.6); }
  }

  function drawTrunk() {   // tronco hueco, medio oculto tras la vegetación
    const x = TRUNK.x, g = GY, T = game.frame;
    if (x - world.camX < -60 || x - world.camX > VW + 60) return;
    // copa y hojarasca (queda detrás del personaje)
    ctx.fillStyle = '#1e3a1c';
    ctx.beginPath(); ctx.ellipse(x - 12, g - 78, 26, 18, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 14, g - 84, 24, 16, 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a4d24';
    ctx.beginPath(); ctx.ellipse(x, g - 88, 20, 14, 0, 0, Math.PI * 2); ctx.fill();
    speckle(x - 30, g - 100, 60, 30, 'rgba(120,180,90,.25)', 16, x);
    speckle(x - 26, g - 96, 52, 24, 'rgba(8,20,6,.3)', 12, x + 7);
    // tronco con vetas
    ctx.fillStyle = lgrad(x - 16, g - 70, x + 16, g, '#4a3420', '#241708');
    ctx.fillRect(x - 15, g - 72, 30, 72);
    ctx.fillStyle = 'rgba(20,12,4,.5)';
    for (let i = -11; i < 14; i += 6) ctx.fillRect(x + i, g - 68, 1.6, 64);
    ctx.fillStyle = '#5a4128'; ctx.fillRect(x - 15, g - 72, 3, 72);
    // hueco cálido: el acceso (parcialmente tapado por el matojo de delante)
    const near = Math.abs(player.x + player.w / 2 - TRUNK.x) < 46;
    ctx.fillStyle = '#120a04';
    ctx.beginPath(); ctx.ellipse(x, g - 11, 8.5, 12, 0, 0, Math.PI * 2); ctx.fill();
    const gl = 0.22 + 0.1 * Math.sin(T / 14) + (near ? 0.3 : 0);
    ctx.fillStyle = 'rgba(255,190,90,' + gl + ')';
    ctx.beginPath(); ctx.ellipse(x, g - 10, 6, 9, 0, 0, Math.PI * 2); ctx.fill();
    // motas doradas que delatan el secreto
    ctx.fillStyle = 'rgba(255,220,140,' + (near ? '.95' : '.55') + ')';
    for (let m = 0; m < 3; m++) {
      const my = g - 8 - ((T * 0.7 + m * 21) % 30);
      ctx.fillRect(x - 3 + m * 3 + Math.sin(T / 9 + m) * 1.4, my, 1.5, 1.5);
    }
  }
  function drawTrunkFront() {   // matojo delantero: oculta parcialmente la entrada
    const x = TRUNK.x, g = GY;
    if (x - world.camX < -60 || x - world.camX > VW + 60) return;
    ctx.fillStyle = '#24401f';
    ctx.beginPath(); ctx.ellipse(x - 8, g - 4, 13, 7, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 9, g - 3, 12, 6, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#33582a';
    ctx.beginPath(); ctx.ellipse(x + 1, g - 5, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
  }
  function drawExitPortal() {   // portal de regreso dentro de la dimensión
    const x = 60, g = GY, T = game.frame;
    if (x < -70 || x > VW + 70) return;
    ctx.fillStyle = rgrad(x, g - 20, 30, 'rgba(255,210,120,.4)', 'rgba(255,210,120,0)');
    ctx.fillRect(x - 30, g - 60, 60, 62);
    ctx.fillStyle = lgrad(x - 14, g - 44, x + 14, g, '#6a4a22', '#33210c');
    ctx.fillRect(x - 13, g - 44, 26, 44);
    ctx.fillStyle = 'rgba(255,214,130,' + (0.5 + 0.25 * Math.sin(T / 10)) + ')';
    ctx.beginPath(); ctx.ellipse(x, g - 20, 8, 16, 0, 0, Math.PI * 2); ctx.fill();
    drawText('AMUNT: TORNAR', x, g - 58, '#ffe9a8', 7, 'center');
  }

  const _drawBenchS = drawBench;
  drawBench = function (p) {
    if (world.stageIdx === DIM) {          // losas de oro de la dimensión
      ctx.fillStyle = lgrad(p.x, p.y, p.x, p.y + p.h + 4, '#c9a44a', '#5c4218');
      ctx.fillRect(p.x, p.y, p.w, p.h + 4);
      ctx.fillStyle = '#ffe9a8'; ctx.fillRect(p.x, p.y, p.w, 2);
      ctx.fillStyle = 'rgba(90,60,16,.5)';
      for (let i = 6; i < p.w - 4; i += 16) ctx.fillRect(p.x + i, p.y + 3, 1, p.h);
      speckle(p.x, p.y, p.w, p.h + 4, 'rgba(60,40,8,.22)', 7, p.x);
      return;
    }
    if (p.t !== 'secret') { _drawBenchS(p); return; }
    if (!p.revealed) {                     // oculta: solo un destello si te acercas a su altura
      const pcx = player.x + player.w / 2, feet = player.y + player.h;
      if (Math.abs(pcx - (p.x + p.w / 2)) < 150 && feet < p.y + 110 && Math.floor(game.frame / 20 + p.x) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,233,168,.7)';
        ctx.fillRect(p.x + 8 + (p.x % 3) * 14, p.y - 4, 1.6, 1.6);
        ctx.fillRect(p.x + p.w - 20, p.y - 7, 1.4, 1.4);
      }
      return;
    }
    const a = Math.min(1, p.revealed / 40);   // fundido de aparición
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = rgrad(p.x + p.w / 2, p.y + 2, p.w * 0.7, 'rgba(255,220,140,.28)', 'rgba(255,220,140,0)');
    ctx.fillRect(p.x - p.w * 0.4, p.y - 22, p.w * 1.8, 46);
    ctx.fillStyle = lgrad(p.x, p.y, p.x, p.y + p.h + 4, '#d8b45c', '#6a4c1c');
    ctx.fillRect(p.x, p.y, p.w, p.h + 4);
    ctx.fillStyle = '#fff0c0'; ctx.fillRect(p.x, p.y, p.w, 2);
    ctx.fillStyle = 'rgba(120,80,20,.45)';
    for (let i = 5; i < p.w - 4; i += 13) if (hsh(p.x + i, 43) > 0.5) ctx.fillRect(p.x + i, p.y + 3, 1, p.h);
    speckle(p.x, p.y, p.w, p.h + 4, 'rgba(255,240,190,.25)', 5, p.x);
    ctx.restore();
  };

  const _drawFloorS = drawFloor;
  drawFloor = function (x, w, y) {
    if (world.stageIdx !== DIM || y !== GY) { _drawFloorS(x, w, y); return; }
    ctx.fillStyle = lgrad(x, y, x, y + 100, '#8a6a2c', '#241a08');
    ctx.fillRect(x, y, w, 100);
    ctx.fillStyle = '#d8b45c'; ctx.fillRect(x, y, w, 3);
    ctx.fillStyle = 'rgba(60,40,10,.5)';
    for (let i = 0; i < w; i += 26) ctx.fillRect(x + i, y + 3, 1, 40);
    speckle(x, y + 4, w, 40, 'rgba(255,230,160,.12)', 20, x);
    // monedas incrustadas en el suelo
    ctx.fillStyle = 'rgba(255,220,140,.5)';
    for (let i = 9; i < w; i += 53) ctx.fillRect(x + i, y + 12 + (i % 3) * 7, 3, 3);
  };

  const _drawBackgroundS = drawBackground;
  drawBackground = function () {
    if (world.stageIdx !== DIM) { _drawBackgroundS(); return; }
    const T = game.frame, cx = world.camX;
    // caverna dorada: resplandor cálido, pilares de monedas y polvo de oro
    const g = ctx.createRadialGradient(VW / 2, VH * 0.7, 40, VW / 2, VH * 0.7, 320);
    g.addColorStop(0, '#3d2c0e'); g.addColorStop(0.55, '#1c1408'); g.addColorStop(1, '#0a0704');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    for (let c = 0; c < 6; c++) {          // pilares de monedas al fondo (paralaje)
      const bx = ((c * 173 - cx * 0.35) % 560 + 560) % 560 - 40;
      const bh = 60 + (c * 37) % 80;
      ctx.fillStyle = 'rgba(140,100,36,.35)'; ctx.fillRect(bx, GY - bh, 26, bh);
      ctx.fillStyle = 'rgba(255,220,140,.4)';
      for (let k = 0; k < bh; k += 7) ctx.fillRect(bx + 2, GY - bh + k, 22, 2);
    }
    ctx.fillStyle = 'rgba(255,233,168,.7)'; // polvo de oro flotando
    for (let m = 0; m < 22; m++) {
      const mx = (m * 67 + T * 0.3) % 500 - 10, my = (m * 41 + Math.sin(T / 30 + m) * 14 + 200) % VH;
      ctx.fillRect(mx, my, 1.4, 1.4);
    }
  };

  const _drawWorldS = drawWorld;
  drawWorld = function () {
    const cx = Math.round(world.camX), cy = Math.round(world.camY);
    if (world.stageIdx === TRUNK.stage) {   // tronco detrás del mundo
      ctx.save(); ctx.translate(-cx, -cy); drawTrunk(); ctx.restore();
    }
    _drawWorldS();
    ctx.save(); ctx.translate(-cx, -cy);
    if (world.stageIdx === TRUNK.stage) drawTrunkFront();
    if (world.stageIdx === DIM) drawExitPortal();
    for (const ch of world.chests || []) {
      if (ch.plat && !ch.plat.revealed) continue;
      drawChest(ch);
    }
    ctx.restore();
  };

  const _drawHUDS = drawHUD;
  drawHUD = function () {
    _drawHUDS();
    if (world.stageIdx === DIM) {
      ctx.fillStyle = 'rgba(5,6,12,.85)'; ctx.fillRect(VW - 96, 14, 92, 12);
      drawText('TRESOR', VW - 8, 16, '#f2d78a', 9, 'right');
    }
  };

  window.__secrets = 'v1';
})();
