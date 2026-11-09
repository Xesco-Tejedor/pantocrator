/* PANTHOKRATOR - jefe final adicional (v1): LA MASSA DEL CONSUM.
   Esfera rodante de miles de zombis turistas grotescos que pierde tamaño
   visible al desprenderse de ellos como ataques. Combate final tras
   L'Amalgama, según diseño de Francesc (6 nov 2026).
   Se carga después de etapas.js; no modifica game.js, arcade.js ni etapas.js. */
(function () {
  'use strict';

  /* ---------- ubicación: arena nueva al final, tras L'Amalgama ---------- */
  const MASA_STAGE = STAGES.length;      // 9 con la estructura actual (0-8)
  const MUD_STAGE = MASA_STAGE - 1;      // L'Amalgama
  const DOG_STAGE = MASA_STAGE - 4;      // arena de la gran Font (mismo fondo)

  STAGES.push({
    name: 'LA MASSA DEL CONSUM', time: 300, length: 700, mural: 0, boss: true,
    ground: [{ x: 0, w: 700 }],
    lower: [],
    platforms: [{ x: 140, y: 160, w: 88, h: 8, t: 'bench' }, { x: 420, y: 160, w: 88, h: 8, t: 'bench' }],
    chandeliers: [{ x: 340, y: 36, len: 64 }],
    sages: [{ x: 150 }],
    vitrinas: [{ x: 80, y: GY, c: 'weapon' }, { x: 300, y: GY, c: 'heart' }, { x: 420, y: GY, c: 'destral' }, { x: 500, y: GY, c: 'time' }, { x: 580, y: GY, c: 'heart' }],
    enemies: []
  });

  /* ---------- sprites pintados (masa-art.js) ---------- */
  function mkImg(src) { const im = new Image(); if (src) im.src = src; return im; }
  let CORE_IMG = null, FIG = null;
  function ensureArt() {   // perezoso: aunque masa-art.js cargue después, la primera pintada lo recoge
    if (FIG) return;
    const A4 = window.PANTO_ART4 || {};
    CORE_IMG = mkImg(A4.CORE);
    FIG = [mkImg(A4.MAN), mkImg(A4.WOMAN), mkImg(A4.KID), mkImg(A4.ELDER)];
  }
  function imgOk(im) { return im && im.complete && im.naturalWidth; }

  const MASA_HP = 360;            // más resistente que Panthokrator y gos (280)
  const SELF_FLOOR = 40;          // los desprendimientos nunca la autodestruyen
  const NP = 40;                  // figuras visibles componiendo la esfera
  const PTS = [];
  for (let i = 0; i < NP; i++) {
    const y = 1 - (i / (NP - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399963;
    PTS.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, a: i % 4, ph: (i * 1.71) % 6.28, fl: i % 2 });
  }
  const PHASE_NAMES = ['', 'MACROMASSA', 'MASSA COMPACTA', 'NUCLI FRENÈTIC'];
  let masaAnn = '';

  /* ---------- flujo: L'Amalgama ya no da la victoria; abre la arena final ---------- */
  const _bossDefeatedM = bossDefeated;
  bossDefeated = function () {
    if (world.stageIdx === MUD_STAGE) {
      world.boss = null;
      sfx.stopMusic(); sfx.clearS();
      player.score += 5000 + Math.floor(player.timer / 60) * 50;
      game.state = 'stageclear'; game.anim = 0;   // stageclear carga LA MASSA
    } else _bossDefeatedM();
  };

  /* ---------- fondo y suelo de la explanada de la gran Font (como el gos) ---------- */
  function swapStage(fn) {
    return function () {
      if (world.stageIdx !== MASA_STAGE) return fn.apply(null, arguments);
      world.stageIdx = DOG_STAGE;
      try { return fn.apply(null, arguments); } finally { world.stageIdx = MASA_STAGE; }
    };
  }
  drawBackground = swapStage(drawBackground);
  drawFloor = swapStage(drawFloor);
  drawBench = swapStage(drawBench);
  drawChandelier = swapStage(drawChandelier);
  drawVitrina = swapStage(drawVitrina);

  /* ---------- zombis de la horda (a pie, frenéticos) ---------- */
  const _drawBeastM = drawBeast;
  drawBeast = function (e, anim) {
    if (world.stageIdx !== MASA_STAGE || !e.masa) { _drawBeastM(e, anim); return; }
    ensureArt();
    const im = FIG[e.seed || 0];
    ctx.save();
    const run = Math.abs(Math.sin(game.frame / 3.5 + e.x));
    ctx.translate(e.x + e.w / 2, e.y + e.h);
    ctx.scale(e.dir < 0 ? 1 : -1, 1);
    ctx.translate(0, -run * 2.4);
    ctx.rotate(Math.sin(game.frame / 4 + e.x) * 0.08);   // carrera desesperada
    ctx.filter = 'drop-shadow(0 0 2px rgba(10,8,4,.85))' + (e.hit > 0 ? ' brightness(2.4)' : '');
    if (imgOk(im)) {
      const H = 30, W = H * im.naturalWidth / im.naturalHeight;
      ctx.drawImage(im, -W / 2, -H, W, H);
    } else {
      ctx.fillStyle = '#7a8a5a'; ctx.fillRect(-6, -24, 12, 24);
    }
    ctx.filter = 'none';
    ctx.restore();
  };

  /* ---------- inicialización ---------- */
  function initMasa(b) {
    ensureArt();
    b.tuned = true;                       // tope de 14 por impacto (arsenal fusionado)
    b.bx = 440; b.x = 440;
    b.maxHp = MASA_HP; b.hp = MASA_HP; b.hp0 = MASA_HP;
    b.hitCd = 0; b.hurt = 0; b.flash = 0; b.face = -1;
    b.ghostT = 0; b.dmgAcc = 0; b.spectralOk = false;
    b.warn = 0; b.lunge = 0;
    b.shootT = 99999; b.pillarT = 99999; b.pillarWarn = 0; b.pillarAct = 0;   // sin orbes/pilar del Panthokrator
    b.rot = 0; b.mvx = -1; b.mvy = 0; b.by = 0;
    b.mode = 'roll'; b.modeT = 0; b.dashDir = -1;
    b.kidT = 150; b.dashT = 260; b.vomitT = 300;
    b.phase = 1; b.t = 0;
    b.hitW = 120; b.hitH = 128;
    world.announce = 'ATACA LA MASSA DEL CONSUM!'; world.announceT = 170;
    sfx.playMusic('boss');
  }

  function radius(b) { return 20 + 44 * Math.max(0, b.hp / b.maxHp); }
  function shedParts(b, n) {
    const cy = b.by || (GY - radius(b));
    for (let i = 0; i < n; i++)
      spawnParts(b.bx + rnd(-20, 20), cy + rnd(-24, 24), i % 2 ? '#c8a884' : '#a84838', 4);
  }

  function launchKid(b) {
    const cy = b.by || (GY - radius(b));
    world.orbs.push({
      x: b.bx + b.face * 10, y: cy - radius(b) * 0.4,
      vx: b.face * 1.1, vy: -2.7, kid: true, life: 400,
      returning: false, dead: false
    });
    b.hp = Math.max(SELF_FLOOR, b.hp - Math.round(MASA_HP * 0.05));   // -5% de tamaño
    shedParts(b, 2); sfx.orbS();
  }
  function hordeVomit(b) {
    const cy = b.by || (GY - radius(b));
    b.hp = Math.max(SELF_FLOOR, b.hp - Math.round(MASA_HP * 0.20));   // -20% de tamaño
    shedParts(b, 6); sfx.smash(); world.shake = 9;
    let alive = 0;   // hombres y mujeres zombis a pie
    for (const e of world.enemies) if (e.masa && e.hp > 0) alive++;
    for (let i = 0; i < 3 && alive < 7; i++, alive++) {
      const e = makeEnemy('beast', clamp(b.bx + rnd(-30, 30), 30, 670), GY);
      e.masa = 1; e.seed = i % 2; e.vx = 1.5 + i * 0.2; e.hp = 2;
      world.enemies.push(e);
    }
    for (let k = 0; k < 8; k++) {   // ancianos histéricos como metralla circular
      const a = (k / 8) * Math.PI * 2 + rnd(-10, 10) / 40;
      world.orbs.push({
        x: b.bx, y: cy, vx: Math.cos(a) * 2.7, vy: Math.sin(a) * 2.7 - 0.6,
        elder: true, life: 300, returning: false, dead: false
      });
    }
    sfx.orbS();
    world.announce = 'VÒMIT D’HORDA!'; world.announceT = 90;
  }

  /* ---------- mecánica por fases ---------- */
  function stepMasa(b) {
    b.t++;
    if (b.hitCd > 0) b.hitCd--;
    if (b.hurt > 0) b.hurt--;
    if (b.flash > 0) b.flash--;
    const pcx = player.x + player.w / 2;
    b.face = pcx < b.bx ? -1 : 1;
    const R = radius(b), sz = b.hp / b.maxHp;
    const floorY = GY - R;
    if (!b.by) b.by = floorY;
    b.hitW = Math.round(R * 1.85); b.hitH = Math.round(R * 2.02);

    const ph = sz > 0.70 ? 1 : sz > 0.40 ? 2 : 3;   // 100-70 / 69-40 / <40
    if (ph !== b.phase) {
      b.phase = ph;
      b.mode = ph === 3 ? 'tele' : 'roll'; b.modeT = ph === 3 ? 50 : 0;
      if (ph === 2) { b.mvy = -6; b.mvx = b.face * 2; }
      world.announce = PHASE_NAMES[ph] + '!'; world.announceT = 120;
      sfx.zap(); world.shake = 10; shedParts(b, 5);
    }

    if (!player.dead) {
      if (b.phase === 1) {
        // MACROMASSA: lenta y destructiva, rueda y aplasta
        if (b.mode === 'roll') {
          b.by += (floorY - b.by) * 0.2;
          if (Math.abs(pcx - b.bx) > R * 0.7) b.bx += b.face * 1.05;
          b.dashT--;
          if (b.dashT <= 0) { b.mode = 'warn'; b.modeT = 44; }
        } else if (b.mode === 'warn') {
          b.modeT--;
          if (b.modeT === 0) { b.mode = 'dash'; b.modeT = 52; b.dashDir = b.face; sfx.lungeS(); }
        } else if (b.mode === 'dash') {
          b.bx += b.dashDir * 4.6; world.shake = Math.max(world.shake, 3);
          b.modeT--;
          if (b.bx < R + 8 || b.bx > world.stage.length - R - 8 || b.modeT === 0) {
            b.mode = 'roll'; b.dashT = rnd(230, 330); world.shake = 8; sfx.smash();
          }
        }
        b.bx = clamp(b.bx, R + 6, world.stage.length - R - 6);
        b.by = clamp(b.by, 40, floorY);
        b.rot += (b.mode === 'dash' ? b.dashDir * 4.6 : b.face * 1.05) / Math.max(18, R);
        b.kidT--;   // Niños Chillones teledirigidos (-5% tamaño cada uno)
        if (b.kidT <= 0) {
          if (b.hp - Math.round(MASA_HP * 0.05) >= SELF_FLOOR) launchKid(b);
          b.kidT = rnd(190, 250);
        }
      } else if (b.phase === 2) {
        // MASSA COMPACTA: movimiento errático a botes
        b.mvy += 0.34;
        b.by += b.mvy; b.bx += b.mvx;
        b.rot += b.mvx / Math.max(16, R);
        if (b.by >= floorY) {
          b.by = floorY; b.mvy = -(5.2 + rnd(0, 18) / 10);
          b.mvx = clamp(b.face * (1.4 + rnd(0, 14) / 10) + rnd(-8, 8) / 10, -3, 3);
          world.shake = Math.max(world.shake, 3); sfx.smash(); shedParts(b, 1);
        }
        if (b.bx < R + 6) { b.bx = R + 6; b.mvx = Math.abs(b.mvx); }
        if (b.bx > world.stage.length - R - 6) { b.bx = world.stage.length - R - 6; b.mvx = -Math.abs(b.mvx); }
        b.vomitT--;   // Vómito de Horda (-20% tamaño) + ancianos de metralla
        if (b.vomitT <= 0) {
          if (b.hp - Math.round(MASA_HP * 0.20) >= SELF_FLOOR) hordeVomit(b);
          b.vomitT = rnd(300, 380);
        }
      } else {
        // NUCLI FRENÈTIC: bola pequeña y compacta, velocidad endiablada
        if (b.mode === 'tele') {
          b.modeT--;
          b.by += (floorY - b.by) * 0.3;
          world.shake = Math.max(world.shake, 1.5);
          if (b.modeT === 0) {
            b.mode = 'charge'; b.modeT = 100;
            const dx = pcx - b.bx, dy = (player.y + 6) - b.by, d = Math.hypot(dx, dy) || 1;
            b.mvx = dx / d * 6.8; b.mvy = clamp(dy / d * 6.8, -2.5, 3.5);   // bala de cañón en línea recta
            sfx.lungeS();
          }
        } else {
          b.bx += b.mvx; b.by += b.mvy;
          b.rot += b.mvx / Math.max(10, R);
          b.modeT--;
          spawnParts(b.bx, b.by, '#a84838', 1);
          let hitWall = false;
          if (b.bx < R + 4) { b.bx = R + 4; b.mvx = Math.abs(b.mvx); hitWall = true; }
          if (b.bx > world.stage.length - R - 4) { b.bx = world.stage.length - R - 4; b.mvx = -Math.abs(b.mvx); hitWall = true; }
          if (b.by > floorY) { b.by = floorY; b.mvy = -Math.abs(b.mvy) * 0.6; hitWall = true; }
          if (b.by < 46) { b.by = 46; b.mvy = Math.abs(b.mvy) * 0.6; hitWall = true; }
          if (hitWall) { world.shake = 9; sfx.smash(); shedParts(b, 2); }
          if (b.modeT === 0) { b.mode = 'tele'; b.modeT = rnd(38, 60); b.mvx = 0; b.mvy = 0; }
        }
        b.bx = clamp(b.bx, R + 4, world.stage.length - R - 4);
      }
      // aplastamiento: contacto con la esfera
      const dd = Math.hypot(player.x + player.w / 2 - b.bx, player.y + player.h / 2 - b.by);
      if (player.invuln <= 0 && dd < R + 9)
        playerDamage(b.mode === 'dash' || b.mode === 'charge' ? 3 : 2, b.bx);
    }
    b.x = b.bx;

    // horda a pie: prisa frenética hacia el héroe
    for (const e of world.enemies) {
      if (!e.masa || e.hp <= 0) continue;
      e.dir = pcx < e.x ? -1 : 1;
      e.x += e.dir * (e.vx || 1.5);
      e.anim++;
    }

    // proyectiles desprendidos (niños teledirigidos y ancianos de metralla)
    const cy = b.by;
    for (const o of world.orbs) {
      if (o.dead) continue;
      if (o.returning) {
        o.x += (b.bx - o.x) * 0.09; o.y += (cy - o.y) * 0.09;
        if (Math.hypot(b.bx - o.x, cy - o.y) < Math.max(14, R * 0.7)) {
          o.dead = true; b.hp -= 12; b.flash = 10; sfx.megaHit(); world.shake = 10;
          player.score += 250; shedParts(b, 3);
          if (b.hp <= 0) { sfx.bossDie(); world.shake = 14; bossDefeated(); return; }
        }
        continue;
      }
      o.life--;
      if (o.kid) {   // teledirigido: gira hacia el héroe
        const dx = pcx - o.x, dy = (player.y + 8) - o.y, d = Math.hypot(dx, dy) || 1;
        o.vx += (dx / d * 2.3 - o.vx) * 0.055; o.vy += (dy / d * 2.3 - o.vy) * 0.055;
      } else if (o.elder) o.vy += 0.05;
      o.x += o.vx; o.y += o.vy;
      if (o.y > GY + 6 || o.x < -20 || o.x > world.stage.length + 20 || o.life <= 0) {
        o.dead = true; spawnParts(o.x, Math.min(o.y, GY), '#8a7a5a', 3); continue;
      }
      if (!player.dead && player.invuln <= 0 &&
          overlap(player, { x: o.x - 5, y: o.y - 6, w: 10, h: 12 })) {
        o.dead = true; playerDamage(1, o.x);
      }
    }
    world.orbs = world.orbs.filter(o => !o.dead);
    player.x = clamp(player.x, 10, world.stage.length - 30);   // arena tancada
  }

  /* ---------- enganche del motor: combate propio, sin tocar los otros jefes ---------- */
  const _updateBossM = updateBoss;
  updateBoss = function () {
    const b = world.boss;
    if (world.stageIdx !== MASA_STAGE) { _updateBossM(); return; }
    if (!b) return;
    if (b.bx === undefined) initMasa(b);
    if (world.announceT > 0 && world.announce) { masaAnn = world.announce; world.announce = ''; }
    stepMasa(b);
  };

  /* ---------- dibujo: la esfera de turistas ---------- */
  function drawMasa(b) {
    ensureArt();
    const T = game.frame, R = radius(b), cy = b.by || (GY - R);
    const flash = b.hurt > 0, ang = b.hp < b.maxHp * 0.4;
    const M = c => flash ? '#fff' : c;
    ctx.save();
    ctx.translate(b.bx, cy);
    // sombra en el suelo
    ctx.fillStyle = 'rgba(8,6,4,.4)';
    ctx.beginPath(); ctx.ellipse(0, GY - cy + 2, R * 0.95, 5, 0, 0, Math.PI * 2); ctx.fill();
    // núcleo pintado rotando
    ctx.save();
    let flt = 'drop-shadow(0 0 4px rgba(20,10,8,.9))';
    if (flash) flt = 'brightness(2.6) ' + flt;
    else if (ang) flt = 'saturate(1.5) hue-rotate(-18deg) ' + flt;
    ctx.filter = flt;
    if (imgOk(CORE_IMG)) {
      ctx.rotate(b.rot * 0.6);
      ctx.drawImage(CORE_IMG, -R, -R, R * 2, R * 2);
      ctx.rotate(-b.rot * 0.6);
    } else {
      ctx.fillStyle = M('#5a4a3a');
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.filter = 'none';
    // figuras de la superficie: prisa frenética (vibración), rotación con la bola
    const cr = Math.cos(b.rot * 0.8), sr = Math.sin(b.rot * 0.8);
    const vis = Math.round(12 + (NP - 12) * Math.max(0, b.hp / b.maxHp));
    const order = [];
    for (let i = 0; i < vis; i++) {
      const p = PTS[i];
      const x3 = p.x * cr - p.z * sr, z3 = p.x * sr + p.z * cr;
      order.push({ i, x: x3, y: p.y, z: z3 });
    }
    order.sort((a, q) => a.z - q.z);
    for (const q of order) {
      const p = PTS[q.i], im = FIG[p.a];
      if (!imgOk(im)) continue;
      const jit = Math.sin(T / 2.6 + p.ph) * 1.7;      // frenesí
      const px = q.x * (R - 4) + Math.sin(T / 3.1 + p.ph * 2) * 1.3;
      const py = q.y * (R - 4) + jit;
      const sc = (0.55 + 0.45 * (q.z * 0.5 + 0.5)) * (R / 62);
      const H = 26 * sc, W = H * im.naturalWidth / im.naturalHeight;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(p.fl ? -1 : 1, 1);
      ctx.rotate(Math.sin(T / 4 + p.ph) * 0.12);
      ctx.globalAlpha = 0.55 + 0.45 * (q.z * 0.5 + 0.5);
      ctx.filter = 'brightness(' + (0.75 + 0.35 * (q.z * 0.5 + 0.5)) + ')' + (flash ? ' brightness(2)' : '');
      ctx.drawImage(im, -W / 2, -H / 2, W, H);
      ctx.restore();
    }
    ctx.restore();
    // aviso telegrafiado
    if ((b.mode === 'warn' || b.mode === 'tele') && Math.floor(T / 3) % 2) {
      ctx.fillStyle = '#ff3030';
      ctx.fillRect(-3, -R - 22, 6, 10); ctx.fillRect(-3, -R - 9, 6, 4);
    }
    ctx.restore();
  }
  function drawKid(o) {
    ensureArt();
    const im = FIG[2];
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(Math.sin(game.frame / 3 + o.x) * 0.3);
    ctx.scale(o.vx < 0 ? -1 : 1, 1);
    ctx.filter = 'drop-shadow(0 0 2px rgba(20,10,8,.9))' + (o.returning ? ' brightness(2)' : '');
    if (imgOk(im)) { const H = 20, W = H * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, -W / 2, -H / 2, W, H); }
    else { ctx.fillStyle = '#b84838'; ctx.fillRect(-4, -6, 8, 12); }
    ctx.filter = 'none';
    ctx.restore();
  }
  function drawElder(o) {
    ensureArt();
    const im = FIG[3];
    ctx.save();
    ctx.translate(o.x, o.y);
    ctx.rotate(Math.atan2(o.vy, o.vx) * 0.4);
    ctx.filter = 'drop-shadow(0 0 2px rgba(20,10,8,.9))' + (o.returning ? ' brightness(2)' : '');
    if (imgOk(im)) { const H = 18, W = H * im.naturalWidth / im.naturalHeight; ctx.drawImage(im, -W / 2, -H / 2, W, H); }
    else { ctx.fillStyle = '#c8b898'; ctx.fillRect(-4, -5, 8, 10); }
    ctx.filter = 'none';
    ctx.restore();
  }

  const _drawWorldM = drawWorld;
  drawWorld = function () {
    const b = world.boss;
    if (world.stageIdx !== MASA_STAGE || !b || b.bx === undefined ||
        (game.state !== 'play' && game.state !== 'shop' && game.state !== 'gameover')) {
      _drawWorldM(); return;
    }
    const save = world.boss, saveOrbs = world.orbs;
    world.boss = { bx: undefined };       // oculta la figura espectral del Panthokrator
    world.orbs = [];                      // niños y ancianos se dibujan aparte
    _drawWorldM();
    world.boss = save; world.orbs = saveOrbs;
    ctx.save(); ctx.translate(-Math.round(world.camX), -Math.round(world.camY));
    for (const o of world.orbs) { if (o.kid) drawKid(o); else drawElder(o); }
    drawMasa(b);
    ctx.restore();
  };

  const _drawBossBarM = drawBossBar;
  drawBossBar = function () {
    const b = world.boss;
    if (world.stageIdx !== MASA_STAGE || !b || b.bx === undefined) { _drawBossBarM(); return; }
    const w = 200, x = VW / 2 - w / 2, y = 238;
    ctx.fillStyle = 'rgba(5,6,12,.7)'; ctx.fillRect(x - 2, y - 2, w + 4, 11);
    ctx.fillStyle = '#a8334a'; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.maxHp), 7);
    ctx.lineWidth = 1; ctx.strokeStyle = '#e89a7a'; ctx.strokeRect(x - 1.5, y - 1.5, w + 3, 10);
    drawText('LA MASSA DEL CONSUM', VW / 2, y + 11, '#e89a7a', 7, 'center');
    if (world.announceT > 0 && masaAnn)
      drawText(masaAnn, VW / 2, y - 20, '#e89a7a', 12, 'center');
  };

  window.__masa = 'v1';
})();

// --- v2: correcciones de cierre (pantalla de victoria y HUD de etapa) ---
// El HUD dibuja 'STAGE 0'+n -> 'STAGE 010' en la etapa 10; se normaliza a 2 dígitos.
(function(){
  const origDrawText = drawText;
  drawText = function(t, x, y, c, s, a){
    if (typeof t === 'string' && t.indexOf('STAGE 0') === 0) t = 'STAGE ' + t.slice(7).slice(-2);
    return origDrawText.call(this, t, x, y, c, s, a);
  };
  // La victoria ya no llega tras el Panthokrator sino tras la Massa del Consum.
  drawWin = function(){
    drawWorld();
    ctx.fillStyle = 'rgba(5,6,12,.65)'; ctx.fillRect(0, 0, VW, VH);
    drawText('EL PALAU RESPIRA', VW / 2, 70, '#d8a23a', 22, 'center');
    drawText('Has apaivagat el mal amorf i desfet la Massa del Consum.', VW / 2, 106, '#e8e4d8', 9, 'center');
    drawText('L\'art romànic del MNAC segueix en peu, píxel a píxel.', VW / 2, 118, '#e8e4d8', 9, 'center');
    drawText('SCORE FINAL: ' + String(player.score).padStart(7, '0'), VW / 2, 146, '#f2d78a', 12, 'center');
    if (game.frame % 90 < 60) drawText('PULSA ENTER O TOCA PER TORNAR', VW / 2, 190, '#8f9aa8', 9, 'center');
  };
})();
window.__masa = 'v2';
