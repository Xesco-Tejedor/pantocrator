/* PANTHOKRATOR - capa arcade (v21): progresión de armas más rápida y devastadora,
   efectos de sonido espectaculares y jefe final visible y atacable.
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

  /* dibujo del jefe: figura grande dorada y azul, de pie en la arena */
  function drawBossBody(b) {
    const x = Math.round(b.bx), g = GY, f = b.face || -1, T = game.frame;
    const flash = b.hurt > 0, ang = b.hp < BOSS_HP / 2;
    const robe = flash ? '#ffffff' : '#2f5f93', robeD = flash ? '#f0e6c8' : '#13293d';
    const gold = flash ? '#ffffff' : '#e8c25a', goldD = flash ? '#f2e2a0' : '#8a6420';
    // aura
    const pulse = 0.5 + 0.5 * Math.sin(T / 9);
    ctx.fillStyle = 'rgba(242,215,138,' + (0.18 + 0.1 * pulse + (b.warn > 0 ? 0.25 : 0)) + ')';
    ctx.beginPath(); ctx.ellipse(x, g - 62, 54, 70, 0, 0, Math.PI * 2); ctx.fill();
    // halo
    ctx.strokeStyle = gold; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, g - 94, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = goldD; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, g - 94, 22, 0, Math.PI * 2); ctx.stroke();
    // manto
    ctx.fillStyle = robe;
    ctx.beginPath(); ctx.moveTo(x - 17, g - 80); ctx.lineTo(x + 17, g - 80); ctx.lineTo(x + 34, g); ctx.lineTo(x - 34, g); ctx.closePath(); ctx.fill();
    ctx.fillStyle = robeD;
    for (const o of [-20, -8, 8, 20]) ctx.fillRect(x + o - 1, g - 62, 2, 62);
    ctx.fillStyle = gold; ctx.fillRect(x - 3, g - 80, 6, 80);
    ctx.fillStyle = goldD; ctx.fillRect(x - 28, g - 8, 56, 3);
    // hombreras
    ctx.fillStyle = gold; ctx.fillRect(x - 25, g - 84, 14, 9); ctx.fillRect(x + 11, g - 84, 14, 9);
    ctx.fillStyle = goldD; ctx.fillRect(x - 25, g - 77, 14, 2); ctx.fillRect(x + 11, g - 77, 14, 2);
    // brazos alzados
    const sw = Math.sin(T / 12) * 3 + (b.warn > 0 ? -10 : 0);
    ctx.strokeStyle = robe; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 20, g - 78); ctx.lineTo(x - 36, g - 66 + sw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 20, g - 78); ctx.lineTo(x + 36, g - 66 - sw); ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.fillStyle = flash ? '#fff' : '#e0b890';
    ctx.fillRect(x - 40, g - 69 + sw, 7, 7); ctx.fillRect(x + 33, g - 69 - sw, 7, 7);
    // libro dorado en la mano izquierda
    ctx.fillStyle = gold; ctx.fillRect(x - 50, g - 76 + sw, 12, 15);
    ctx.fillStyle = goldD; ctx.fillRect(x - 48, g - 74 + sw, 8, 11);
    // cabeza
    ctx.fillStyle = flash ? '#fff' : '#e0b890'; ctx.fillRect(x - 9, g - 104, 18, 21);
    ctx.fillStyle = flash ? '#f0e6c8' : '#3a2415'; ctx.fillRect(x - 10, g - 104, 20, 5); ctx.fillRect(x - 8, g - 88, 16, 8);
    ctx.fillStyle = ang || b.warn > 0 ? '#ff3030' : '#14100c';
    ctx.fillRect(x - 6 + f * 1, g - 98, 4, 3); ctx.fillRect(x + 2 + f * 1, g - 98, 4, 3);
    ctx.fillStyle = gold; ctx.fillRect(x - 11, g - 108, 22, 4);
    ctx.fillStyle = goldD; for (let i = -9; i <= 7; i += 8) ctx.fillRect(x + i, g - 112, 4, 4);
    // aviso de embestida
    if (b.warn > 0 && Math.floor(T / 3) % 2) {
      ctx.fillStyle = '#ff3030'; ctx.fillRect(x - 3, g - 126, 6, 10); ctx.fillRect(x - 3, g - 113, 6, 4);
    }
  }
  const _dw = drawWorld;
  drawWorld = function () {
    _dw();
    const b = world.boss;
    if (b && b.bx !== undefined && (game.state === 'play' || game.state === 'shop')) {
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
  window.__arcadeLayer = 'v21';
})();
