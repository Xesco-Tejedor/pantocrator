/* PANTHOKRATOR - capa arcade (v22): progresión de armas rápida y devastadora,
   efectos arcade y jefe final visible, atacable y con figura espectral terrorífica.
   Se carga después de game.js y audio.js; no modifica los controles. */
(function () {
  'use strict';
  const BOSS_HP = 80;
  const bossBox = b => ({ x: b.bx - 30, y: GY - 108, w: 60, h: 108 });
  const bodyBox = b => ({ x: b.bx - 20, y: GY - 96, w: 40, h: 96 });

  /* ---------- sonido: explosiones, power-up, impactos grandes ---------- */
  Object.assign(sfx, {
    boom() {
      const t = this.now(); if (!this.ctx) return;
      this.kick(t, 0.8);
      this.noise(t, 0.45, 0.3, { type: 'lowpass', freq: 5200, slideTo: 140 });
      this.fm(120, t, 0.4, 0.3, { ratio: 0.5, index: 5, modDecay: 0.25, slide: -80 });
    },
    zap() {
      const t = this.now(); if (!this.ctx) return;
      this.fm(420, t, 0.16, 0.13, { ratio: 2, index: 5, modDecay: 0.1, slide: 1500 });
      this.noise(t, 0.08, 0.1, { type: 'highpass', freq: 5000 });
    },
    powerUp() {
      const t = this.now(); if (!this.ctx) return;
      [523, 659, 784, 1046, 1318, 1568, 2093, 2637].forEach((f, i) =>
        this.fm(f, t + i * 0.045, 0.12, 0.13, { ratio: 2, index: 1.6, modDecay: 0.06, bus: this.leadBus }));
      this.kick(t, 0.5);
    },
    megaHit() {
      const t = this.now(); if (!this.ctx) return;
      this.kick(t, 0.75);
      this.fm(95, t, 0.3, 0.35, { ratio: 0.71, index: 5, modDecay: 0.2, slide: -35 });
      this.noise(t, 0.2, 0.25, { type: 'lowpass', freq: 4200, slideTo: 200 });
      this.fm(1480, t, 0.1, 0.12, { ratio: 3.5, index: 6, modDecay: 0.05 });
    },
    bossDie() {
      const t = this.now(); if (!this.ctx) return;
      for (let i = 0; i < 7; i++) {
        this.kick(t + i * 0.16, 0.6);
        this.noise(t + i * 0.16, 0.3, 0.25, { type: 'lowpass', freq: 5000, slideTo: 120 });
        this.fm(900 - i * 100, t + i * 0.16, 0.2, 0.1, { ratio: 3.5, index: 5, modDecay: 0.1, slide: -400 });
      }
    },
    lungeS() {
      const t = this.now(); if (!this.ctx) return;
      this.fm(180, t, 0.45, 0.18, { ratio: 0.5, index: 4, modDecay: 0.3, slide: 520 });
    }
  });

  /* ---------- helpers de espectáculo ---------- */
  function burst(x, y, big) {
    spawnParts(x, y, '#fff8e0', big ? 18 : 8);
    spawnParts(x, y, '#e8783c', big ? 16 : 8);
    spawnParts(x, y, '#f2d78a', big ? 14 : 6);
    world.shake = Math.max(world.shake, big ? 7 : 3);
  }
  function trackKills(fn) {
    const alive = world.enemies.filter(e => e.hp > 0);
    fn();
    let n = 0;
    for (const e of alive) if (e.hp <= 0) { burst(e.x + e.w / 2, e.y + e.h / 2, true); n++; }
    if (n) { sfx.boom(); player.score += 25 * n; }
  }
  const mult = () => 2 * (1 + 0.8 * comboN());
  const swingDmg = () => Math.round(((curW().dmg[player.weapon - 1] || 1) + comboN()) * mult());

  /* ---------- progresión más rápida ---------- */
  const _items = updateItems;
  updateItems = function () {
    const w0 = player.weapon, f0 = player.fused.length;
    _items();
    let up = false;
    if (player.weapon > w0 && player.weapon < 5) { player.weapon++; up = true; }
    if (player.fused.length > f0 && player.weapon < 5) { player.weapon++; up = true; }
    if (up || player.weapon > w0 || player.fused.length > f0) {
      sfx.powerUp();
      burst(player.x + 6, player.y + 8, true);
      world.announce = comboN() ? 'ARMA ' + (TIER_NAMES[comboN()] || 'DIVINA') + '  NIVEL ' + player.weapon : 'ARMA NIVEL ' + player.weapon;
      world.announceT = 150;
    }
  };
  const _loot = dropLoot;
  dropLoot = function (e) {
    _loot(e);
    if (Math.random() < 0.5)
      world.items.push({ x: e.x + e.w / 2 - 18, y: e.y - 8, w: 12, h: 10, c: Math.random() < 0.55 ? 'weapon' : WTYPES[Math.floor(Math.random() * WTYPES.length)], vy: -2.6 });
  };

  /* ---------- daño devastador ---------- */
  const _throw = throwDaggers;
  throwDaggers = function () {
    const n0 = world.daggers.length;
    _throw();
    const m = mult();
    for (let i = n0; i < world.daggers.length; i++) world.daggers[i].dmg = Math.round((world.daggers[i].dmg || 1) * m);
    sfx.zap();
  };
  let lastWave = -99;
  const _swordHits = swordHits;
  swordHits = function () {
    const sb = swordBox();
    trackKills(_swordHits);
    if (!sb) return;
    const b = world.boss;
    if (b && b.hitCd <= 0 && overlap(sb, bossBox(b))) {
      hurtBoss(swingDmg(), sb.x + sb.w / 2, player.y + 8);
      b.hitCd = 9;
    }
    // onda de choque de las armas fusionadas: arrasa en línea
    if (comboN() >= 1 && game.frame - lastWave > 22) {
      lastWave = game.frame;
      const x = player.x + player.w / 2 + player.dir * 12, y = player.y + 12;
      world.daggers.push({ x, y, vx: player.dir * 4.4, vy: 0, life: 85, k: 'wave', pierce: true, dmg: 4 + 5 * comboN(), ph: 0 });
      if (comboN() >= 2) world.daggers.push({ x, y: y + 8, vx: player.dir * 4.0, vy: 0, life: 80, k: 'wave', pierce: true, dmg: 3 + 4 * comboN(), ph: 1 });
      sfx.megaHit();
      world.shake = Math.max(world.shake, 2 + comboN());
    }
  };
  const _ud = updateDaggers;
  updateDaggers = function () {
    const b = world.boss;
    if (b && b.bx !== undefined) {
      for (const d of world.daggers) {
        if (d.dead || (d.hits && d.hits.has('boss'))) continue;
        if (overlap({ x: d.x - 4, y: d.y - 3, w: 8, h: 6 }, bossBox(b))) {
          hurtBoss(Math.max(1, d.dmg || 1), d.x, d.y);
          if (d.pierce) (d.hits = d.hits || new Set()).add('boss'); else d.dead = true;
        }
      }
    }
    trackKills(_ud);
  };

  /* ---------- jefe final: cuerpo visible y atacable ---------- */
  function hurtBoss(n, x, y) {
    const b = world.boss; if (!b) return;
    b.hp -= n; b.flash = 8; b.hurt = 10;
    player.score += 20 + n * 5;
    burst(x, y, n >= 12);
    if (n >= 12) sfx.megaHit(); else sfx.bossHit();
    if (b.hp <= 0) {
      for (let i = 0; i < 5; i++) burst(b.bx + rnd(-26, 26), GY - rnd(10, 100), true);
      sfx.bossDie(); world.shake = 14;
      bossDefeated();
    }
  }
  const _ub = updateBoss;
  updateBoss = function () {
    const b = world.boss; if (!b) return;
    if (b.bx === undefined) {
      b.bx = 440; b.maxHp = BOSS_HP; b.hp = BOSS_HP; b.hitCd = 0; b.hurt = 0; b.face = -1;
      b.lungeT = 300; b.lunge = 0; b.warn = 0; b.hp0 = b.hp;
      world.announce = 'ATACA AL PANTHOKRATOR!'; world.announceT = 170;
    }
    if (b.hitCd > 0) b.hitCd--;
    if (b.hurt > 0) b.hurt--;
    const pcx = player.x + player.w / 2;
    if (!player.dead) {
      const dx = pcx - b.bx; b.face = dx < 0 ? -1 : 1;
      if (b.warn > 0) { b.warn--; if (b.warn === 0) { b.lunge = 55; b.lungeDir = b.face; sfx.lungeS(); } }
      else if (b.lunge > 0) { b.lunge--; b.bx += b.lungeDir * 3.2; world.shake = Math.max(world.shake, 2); if (b.lunge === 0) b.lungeT = b.hp < BOSS_HP / 2 ? 150 : 230; }
      else {
        if (Math.abs(dx) > 46) b.bx += b.face * (b.hp < BOSS_HP / 2 ? 0.7 : 0.45);
        b.lungeT--;
        if (b.lungeT <= 0) { b.warn = 32; }
      }
      b.bx = clamp(b.bx, 120, world.stage.length - 50);
      // contacto con el cuerpo del jefe
      if (player.invuln <= 0 && overlap(player, bodyBox(b))) playerDamage(b.lunge > 0 ? 3 : 2, b.bx);
    }
    b.x = b.bx;                       // los orbes salen y vuelven al cuerpo visible
    const hp0 = b.hp;
    _ub();
    const bb = world.boss;
    if (bb && bb.hp < hp0) {          // orbe devuelto: golpe enorme
      const extra = 11;
      bb.hp -= extra; burst(bb.bx, GY - 70, true); sfx.megaHit();
      if (bb.hp <= 0) { sfx.bossDie(); world.shake = 14; bossDefeated(); }
    }
  };

  /* dibujo del jefe: figura espectral corrupta, organica e inquietante (v22) */
  function drawBossBody(b) {
    const x = Math.round(b.bx), g = GY, f = b.face || -1, T = game.frame;
    const flash = b.hurt > 0, ang = b.hp < BOSS_HP / 2;
    const warn = b.warn > 0, lunge = b.lunge > 0;
    const breath = Math.sin(T / 40) * 1.6;          // respiracion lenta
    const sway = Math.sin(T / 55) * 2.2;            // balanceo inquietante
    const lean = lunge ? (b.lungeDir || f) * 7 : 0;

    ctx.save();
    ctx.translate(x + lean * 0.4, g);

    // niebla espectral que lo envuelve
    const pulse = 0.5 + 0.5 * Math.sin(T / 9);
    const mA = flash ? 0.12 : 0.30 + 0.12 * pulse + (warn ? 0.18 : 0) + (ang ? 0.08 : 0);
    const mg = ctx.createRadialGradient(0, -50, 8, 0, -50, 80);
    mg.addColorStop(0, 'rgba(46,28,68,' + mA + ')');
    mg.addColorStop(0.6, 'rgba(26,14,42,' + (mA * 0.55) + ')');
    mg.addColorStop(1, 'rgba(8,4,16,0)');
    ctx.fillStyle = mg;
    ctx.beginPath(); ctx.ellipse(0, -50, 76, 82, 0, 0, Math.PI * 2); ctx.fill();

    // halo roto, torcido y apagado
    ctx.save();
    ctx.translate(sway * 0.6, -107 + breath * 0.4);
    ctx.rotate(-0.30 + Math.sin(T / 70) * 0.06);
    ctx.lineCap = 'round';
    ctx.strokeStyle = flash ? '#fff' : '#6e5626'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 21, -2.7, 0.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 21, 0.9, 2.1); ctx.stroke();
    ctx.strokeStyle = flash ? '#fff' : '#3a2c10'; ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(0, 0, 23.5, -2.5, 0.2); ctx.stroke();
    ctx.fillStyle = flash ? '#fff' : '#6e5626';
    ctx.fillRect(16, -15, 3, 2); ctx.fillRect(-24, 6, 2, 3); ctx.fillRect(9, 20, 2, 2);
    ctx.restore();

    // zarcillos de sombra que reptan por el suelo
    ctx.strokeStyle = flash ? 'rgba(255,255,255,.45)' : 'rgba(22,12,34,.85)';
    ctx.lineWidth = 2.6; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const dir0 = i < 3 ? -1 : 1, k = i % 3;
      const bx0 = dir0 * (8 + k * 7);
      const wx = Math.sin(T / 9 + i * 1.7) * 6;
      ctx.beginPath();
      ctx.moveTo(bx0 * 0.6, -3);
      ctx.quadraticCurveTo(bx0 + dir0 * 6, 1, bx0 + dir0 * 12 + wx, -1 - k);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // manto harapiento con borde desgarrado
    const rg = ctx.createLinearGradient(0, -86, 0, 0);
    rg.addColorStop(0, flash ? '#ffffff' : '#2c2136');
    rg.addColorStop(0.55, flash ? '#f2f2f2' : '#1a1224');
    rg.addColorStop(1, flash ? '#e0e0e0' : '#0d0812');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.moveTo(-14 + sway * 0.3, -80 + breath * 0.5);
    ctx.bezierCurveTo(-27 + sway * 0.5, -64, -31, -38, -28, -12);
    const teeth = 7;
    for (let i = 1; i <= teeth; i++) {
      const hx2 = -28 + (56 / teeth) * i;
      ctx.lineTo(hx2 - 4, -2 - ((i * 3) % 4));
      ctx.lineTo(hx2, -11 - ((i * 5) % 6) + Math.sin(T / 11 + i * 2) * 1.6);
    }
    ctx.lineTo(28, -12);
    ctx.bezierCurveTo(31, -38, 27 + sway * 0.5, -64, 14 + sway * 0.3, -80 + breath * 0.5);
    ctx.quadraticCurveTo(0, -87 + breath * 0.6, -14 + sway * 0.3, -80 + breath * 0.5);
    ctx.closePath(); ctx.fill();

    // pliegues del manto
    ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 1.6;
    for (const o of [-16, -5, 7, 17]) {
      ctx.beginPath();
      ctx.moveTo(o * 0.7 + sway * 0.3, -72 + breath * 0.4);
      ctx.quadraticCurveTo(o * 1.25, -40, o + Math.sin(T / 13 + o) * 2, -8);
      ctx.stroke();
    }
    // luz enfermiza en el borde izquierdo
    ctx.strokeStyle = flash ? '#fff' : 'rgba(160,200,140,.16)'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-14 + sway * 0.3, -78);
    ctx.quadraticCurveTo(-28, -50, -26, -18); ctx.stroke();

    // tiras de tela colgando y ondeando
    ctx.strokeStyle = flash ? 'rgba(255,255,255,.8)' : '#171020';
    ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const sx0 = -18 + i * 12, sw2 = Math.sin(T / 8 + i * 2.3) * 4;
      ctx.beginPath();
      ctx.moveTo(sx0, -66 + breath * 0.4);
      ctx.quadraticCurveTo(sx0 + sw2, -48, sx0 + sw2 * 1.8, -30 - (i % 2) * 8);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // desgarro del pecho con costillas
    ctx.fillStyle = flash ? '#fff' : '#04020a';
    ctx.beginPath();
    ctx.moveTo(-7 + sway * 0.4, -62);
    ctx.quadraticCurveTo(-11, -48, -4 + sway * 0.3, -34);
    ctx.quadraticCurveTo(3, -42, 4 + sway * 0.3, -58);
    ctx.quadraticCurveTo(-1, -64, -7 + sway * 0.4, -62);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = flash ? '#fff' : '#b9b09a'; ctx.lineWidth = 1.3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-6, -57 + i * 7);
      ctx.quadraticCurveTo(-1, -55 + i * 7, 3, -58 + i * 7);
      ctx.stroke();
    }

    // brazos esqueleticos con garras
    const bone = flash ? '#fff' : '#c9c0a8', boneD = flash ? '#eee' : '#8a8069';
    const aw = Math.sin(T / 12) * 3 + (warn ? -10 : 0) + (lunge ? 7 : 0);
    for (const side of [-1, 1]) {
      const shX = side * 14 + sway * 0.4, shY = -76 + breath * 0.5;
      const elX = side * (27 + (warn ? 3 : 0)), elY = -62 + aw * 0.6;
      const haX = side * (32 + (lunge ? 6 : 0)), haY = -44 + aw;
      ctx.strokeStyle = bone; ctx.lineCap = 'round';
      ctx.lineWidth = 4.0;
      ctx.beginPath(); ctx.moveTo(shX, shY);
      ctx.quadraticCurveTo(side * 22, shY + 2, elX, elY); ctx.stroke();
      ctx.lineWidth = 2.7;
      ctx.beginPath(); ctx.moveTo(elX, elY);
      ctx.quadraticCurveTo(side * 36, elY + 6, haX, haY); ctx.stroke();
      // garra de tres dedos
      ctx.strokeStyle = boneD; ctx.lineWidth = 1.7;
      for (let d = -1; d <= 1; d++) {
        ctx.beginPath(); ctx.moveTo(haX, haY);
        ctx.quadraticCurveTo(haX + side * (4 + d), haY + 6, haX + side * (7 + d * 3), haY + 12 + Math.abs(d) * 1.5);
        ctx.stroke();
      }
    }
    ctx.lineCap = 'butt';

    // cuello y craneo alargado
    const hx = sway, hy = -92 + breath;
    ctx.fillStyle = flash ? '#fff' : '#8f8772';
    ctx.fillRect(hx - 3, hy + 2, 6, 12);
    const skull = flash ? '#fff' : '#d3cab4', skullD = flash ? '#f0f0f0' : '#9a917c';
    ctx.fillStyle = skull;
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy - 4);
    ctx.bezierCurveTo(hx - 12, hy - 14, hx - 7, hy - 25, hx, hy - 26);
    ctx.bezierCurveTo(hx + 7, hy - 25, hx + 12, hy - 14, hx + 8, hy - 4);
    ctx.quadraticCurveTo(hx + 6, hy + 6, hx, hy + 9);
    ctx.quadraticCurveTo(hx - 6, hy + 6, hx - 8, hy - 4);
    ctx.closePath(); ctx.fill();
    // pomulos hundidos
    ctx.fillStyle = skullD;
    ctx.beginPath(); ctx.ellipse(hx - 5, hy - 3, 2.6, 3.4, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + 5, hy - 3, 2.6, 3.4, -0.3, 0, Math.PI * 2); ctx.fill();
    // grietas en el craneo
    ctx.strokeStyle = 'rgba(42,34,24,.65)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx - 4, hy - 23); ctx.lineTo(hx - 1, hy - 15); ctx.lineTo(hx - 4, hy - 9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 5, hy - 20); ctx.lineTo(hx + 3, hy - 12); ctx.stroke();

    // mechones de pelo ralo ondeando
    ctx.strokeStyle = flash ? '#fff' : '#16101c'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1, k = i % 4;
      const sx = hx + side * (6 + k * 1.4), sy = hy - 18 + k * 3;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + side * 5 + Math.sin(T / 10 + i) * 2, sy + 12,
        sx + side * 3 + Math.sin(T / 8 + i * 2) * 3, sy + 22 + k * 3);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';

    // ojos hundidos con brillo enfermizo
    ctx.fillStyle = flash ? '#fff' : '#070408';
    ctx.beginPath(); ctx.ellipse(hx - 4.5 + f, hy - 12, 3.5, 4.3, 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hx + 4.5 + f, hy - 12, 3.5, 4.3, -0.22, 0, Math.PI * 2); ctx.fill();
    // cejas torvas
    ctx.strokeStyle = flash ? '#fff' : '#4a4033'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(hx - 8.5 + f, hy - 18.5); ctx.lineTo(hx - 1.5 + f, hy - 15.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hx + 8.5 + f, hy - 18.5); ctx.lineTo(hx + 1.5 + f, hy - 15.5); ctx.stroke();
    const flick = 0.55 + 0.45 * Math.sin(T / (ang ? 3 : 7) + 1);
    ctx.fillStyle = flash ? '#fff' : (ang || warn ? '#ff2a1a' : '#cfe89a');
    ctx.globalAlpha = flick;
    ctx.beginPath(); ctx.arc(hx - 4.5 + f * 1.7, hy - 12, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hx + 4.5 + f * 1.7, hy - 12, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // boca: grito oscuro
    ctx.fillStyle = flash ? '#fff' : '#070408';
    ctx.beginPath(); ctx.ellipse(hx + f, hy - 3, 2.3, 3.2 + (warn ? 2.2 : 0), 0, 0, Math.PI * 2); ctx.fill();

    // aviso de embestida
    if (warn && Math.floor(T / 3) % 2) {
      ctx.fillStyle = '#ff3030';
      ctx.fillRect(lean - 3, -128, 6, 10); ctx.fillRect(lean - 3, -115, 6, 4);
    }
    ctx.restore();
  }
  const _dw = drawWorld;
  drawWorld = function () {
    _dw();
    const b = world.boss;
    if (b && b.bx !== undefined && (game.state === 'play' || game.state === 'shop' || game.state === 'gameover')) {
      ctx.save(); ctx.translate(-Math.round(world.camX), -Math.round(world.camY));
      drawBossBody(b);
      ctx.restore();
    }
  };
  // barra de vida del jefe: más abajo para no tapar los avisos
  drawBossBar = function () {
    const b = world.boss; if (!b || b.bx === undefined) return;
    const w = 200, x = VW / 2 - w / 2, y = 56;
    ctx.fillStyle = 'rgba(5,6,12,.7)'; ctx.fillRect(x - 2, y - 2, w + 4, 11);
    ctx.fillStyle = '#a83232'; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.maxHp), 7);
    ctx.lineWidth = 1; ctx.strokeStyle = '#f2d78a'; ctx.strokeRect(x - 1.5, y - 1.5, w + 3, 10);
    drawText('PANTHOKRATOR', VW / 2, y + 11, '#f2d78a', 7, 'center');
  };

  /* game over: continuar en la misma etapa en vez de volver al título.
     Antes cualquier toque en GAME OVER llevaba al título y la partida empezaba
     desde la etapa 1; con el jefe a la vista parecía que "desaparece y se reinicia". */
  gameStartGesture = function () {
    if (game.state === 'title') { startGame(); }
    else if (game.state === 'win') { game.state = 'title'; sfx.playMusic('title'); }
    else if (game.state === 'gameover') {
      player.hp = player.maxHp; player.dead = false; player.lives = 3; player.invuln = 90;
      loadStage(world.stageIdx);
      game.state = 'stagecard'; game.anim = 0;
      sfx.playMusic(world.stage.boss ? 'boss' : 'stage');
    }
  };
  const _dgo = drawGameOver;
  drawGameOver = function () {
    _dgo();
    if (game.frame % 90 < 60) drawText('PARA CONTINUAR', VW / 2, 182, '#8f9aa8', 9, 'center');
  };
  window.__arcadeLayer = 'v22';
})();
