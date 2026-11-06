/* PANTHOKRATOR - varietat musical i celebració final de savis (v1).
   Petició de Francesc (6 nov 2026): «variedad en la música» i, després de
   guanyar l'últim boss, «un gran número de sabios libres que celebran
   eufóricamente la victoria del jugador».

   Es carrega l'últim; no modifica game.js, audio.js, etapas.js ni masa.js:
   - Afegeix 5 temes nous al seqüenciador FM d'audio.js (composicions
     originals amb caràcter de recreativa Taito, sense copiar Black Tiger)
     i tria tema segons l'etapa: cada fase i cada boss sona diferent.
   - Fanfara de victoria en to major en vèncer la Massa del Consum.
   - A la pantalla de victoria, una multitud de savis alliberats (sprites
     pintats de sage-art.js) salta eufòrica amb els braços amunt, amb
     confeti i espurnes daurades, al voltant del guerrer. */
(function () {
  'use strict';
  window.__festival = 1;

  /* ================= 1. VARIETAT MUSICAL ================= */
  if (typeof sfx !== 'undefined' && sfx.THEMES) {
    /* fase alternativa A: més lluminosa i emprenedora (Jardins, Font) */
    sfx.THEMES.stage2 = { bpm: 160, legato: 1.9,
      bass: [0,12,0,12, 0,12,10,12, 5,17,5,17, 5,17,15,17,
             -4,8,-4,8, -4,8,6,8, -5,7,-5,7, -5,7,10,12],
      mel:  [29,null,null,29, 31,null,29,null, 27,null,29,null, 24,null,null,null,
             26,null,null,26, 27,null,26,null, 24,null,26,null, 27,null,null,null,
             29,null,null,29, 32,null,31,null, 29,null,27,null, 29,null,null,null,
             31,null,32,null, 34,null,31,null, 29,null,27,null, 26,null,null,null],
      harm: [12,null,null,null, null,null,null,null, 17,null,null,null, null,null,null,null,
             8,null,null,null, null,null,null,null, 7,null,null,null, 10,null,null,null],
      arp:  [36,39,43,39, 36,39,43,39, 41,45,48,45, 41,45,48,45,
             32,36,39,36, 32,36,39,36, 31,35,38,35, 31,35,38,35],
      perc: [1,0,2,0, 4,0,2,0, 1,0,2,0, 4,0,2,2,
             1,0,2,0, 4,0,2,0, 1,0,2,2, 4,2,4,6] };

    /* fase alternativa B: lenta i fosca (Aigües, Profunditats) */
    sfx.THEMES.stage3 = { bpm: 138, legato: 2.2,
      bass: [0,null,0,null, 12,null,0,null, -4,null,-4,null, 8,null,-4,null,
             -2,null,-2,null, 10,null,-2,null, -5,null,7,null, 12,null,7,null],
      mel:  [24,null,null,null, 26,null,27,null, null,null,26,null, 24,null,null,null,
             22,null,null,null, 24,null,26,null, null,null,27,null, 26,null,null,null,
             24,null,null,null, 29,null,27,null, null,null,26,null, 27,null,null,null,
             31,null,29,null, 27,null,26,null, 24,null,null,null, null,null,null,null],
      harm: [12,null,null,null, null,null,null,null, 8,null,null,null, null,null,null,null,
             10,null,null,null, null,null,null,null, 7,null,null,null, null,null,null,null],
      arp:  [24,null,27,null, 31,null,27,null, 20,null,24,null, 27,null,24,null,
             22,null,26,null, 29,null,26,null, 19,null,22,null, 26,null,22,null],
      perc: [1,0,0,0, 4,0,0,0, 1,0,0,2, 4,0,0,0,
             1,0,0,0, 4,0,0,0, 1,0,0,2, 4,0,2,0] };

    /* boss alternatiu: amenaça amb tríton (Gos zombi) */
    sfx.THEMES.boss2 = { bpm: 178, legato: 1.5,
      bass: [0,0,12,0, 6,6,12,6, 0,0,12,0, 1,1,13,1,
             0,0,12,0, 6,6,12,6, -1,-1,11,-1, -2,-2,10,11],
      mel:  [24,null,27,26, 27,null,null,null, 30,null,29,27, 26,null,null,null,
             24,null,27,26, 27,null,null,null, 31,null,30,27, 26,null,27,null,
             24,null,27,26, 27,null,null,null, 30,null,29,27, 26,null,null,null,
             27,null,30,null, 31,null,null,null, 27,null,26,24, 23,null,null,null],
      harm: [12,null,null,null, 18,null,null,null, 12,null,null,null, 13,null,null,null,
             12,null,null,null, 18,null,null,null, 11,null,null,null, 10,null,null,null],
      arp:  [36,39,42,39, 36,39,42,39, 37,40,43,40, 37,40,43,40,
             36,39,42,39, 36,39,42,39, 35,38,41,38, 34,37,40,37],
      perc: [1,0,2,1, 4,2,1,2, 1,0,2,1, 4,2,2,2,
             1,0,2,1, 4,2,1,2, 1,2,1,2, 4,2,6,2] };

    /* boss final: frenesí cromàtic (La Massa del Consum) */
    sfx.THEMES.massa = { bpm: 186, legato: 1.3,
      bass: [0,12,0,12, 1,13,1,13, 0,12,0,12, -1,11,-1,11,
             0,12,0,12, 1,13,1,13, 2,14,2,14, 1,13,2,14],
      mel:  [36,null,34,32, 31,null,29,null, 27,null,29,31, 32,null,null,null,
             34,null,32,31, 29,null,27,null, 26,null,27,29, 31,null,null,null,
             36,null,34,32, 31,null,29,null, 27,null,29,31, 32,null,null,null,
             38,null,36,34, 32,null,31,null, 29,null,31,32, 34,null,null,null],
      harm: [12,null,13,null, 12,null,13,null, 12,null,13,null, 11,null,12,null,
             12,null,13,null, 12,null,13,null, 14,null,15,null, 13,null,14,null],
      arp:  [36,40,43,40, 36,40,43,40, 37,41,44,41, 37,41,44,41,
             36,40,43,40, 36,40,43,40, 38,42,45,42, 37,41,44,41],
      perc: [1,2,2,1, 4,2,1,2, 1,2,2,1, 4,2,2,2,
             1,2,2,1, 4,2,1,2, 1,2,1,2, 4,2,6,6] };

    /* victoria: fanfara en to major, alegre i celebrativa */
    sfx.THEMES.win = { bpm: 132, legato: 1.7,
      bass: [0,null,12,null, 0,null,12,null, 5,null,17,null, 5,null,17,null,
             7,null,19,null, 7,null,19,null, 0,null,12,null, 7,null,12,null],
      mel:  [24,null,28,31, 33,null,31,null, 28,null,24,null, 28,null,null,null,
             29,null,31,33, 35,null,33,null, 31,null,29,null, 26,null,null,null,
             24,null,28,31, 33,null,36,null, 33,null,31,28, 31,null,null,null,
             35,null,33,31, 29,null,31,null, 24,null,null,null, null,null,null,null],
      harm: [12,null,null,null, null,null,null,null, 17,null,null,null, null,null,null,null,
             19,null,null,null, null,null,null,null, 12,null,null,null, 12,null,null,null],
      arp:  [36,40,43,40, 36,40,43,40, 41,45,48,45, 41,45,48,45,
             43,47,50,47, 43,47,50,47, 36,40,43,40, 36,40,43,40],
      perc: [1,0,2,2, 4,0,2,0, 1,0,2,2, 4,0,2,2,
             1,0,2,2, 4,0,2,0, 1,2,1,2, 4,2,6,2] };

    /* mapa de temes per etapa: cada fase i cada boss amb el seu aire */
    const STAGE_V = { 0: 'stage', 1: 'stage2', 3: 'stage2', 4: 'stage3', 6: 'stage3', 7: 'stage2' };
    const BOSS_V  = { 2: 'boss', 5: 'boss2', 8: 'boss2', 9: 'massa' };
    const _playMusic = sfx.playMusic;
    sfx.playMusic = function (name) {
      if (typeof world !== 'undefined' && world && world.stageIdx !== undefined) {
        const i = world.stageIdx;
        if (name === 'stage' && STAGE_V[i]) name = STAGE_V[i];
        else if (name === 'boss' && BOSS_V[i]) name = BOSS_V[i];
      }
      return _playMusic.call(this, name);
    };

    /* fanfara de victoria en caure l'últim boss (estat 'win') */
    const _bossDefeatedF = bossDefeated;
    bossDefeated = function () {
      _bossDefeatedF.apply(null, arguments);
      if (typeof game !== 'undefined' && game.state === 'win') {
        setTimeout(function () { if (game.state === 'win') sfx.playMusic('win'); }, 850);
      }
    };
  }

  /* ================= 2. CELEBRACIÓ DE LA MUNTANYA DE SAVIS ================= */
  const SAGE_IMG = {};
  const A5 = window.PANTO_ART5 || {};
  for (const k in A5) { const im = new Image(); im.src = A5[k]; SAGE_IMG[k] = im; }
  function okS(im) { return im && im.complete && im.naturalWidth; }

  /* multitud estable (determinista): dues fileres de savis eufòrics */
  const CROWD = [];
  (function () {
    let seed = 20261106;
    const srnd = function () { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const N = 18;
    for (let i = 0; i < N; i++) {
      const row = i % 2;   // 0 = fons, 1 = davant
      CROWD.push({
        x: 22 + (i / (N - 1)) * (VW - 44) + (row ? 7 : -5),
        row: row,
        sc: row ? 1 : 0.74,
        ph: srnd() * 6.28,
        sp: 0.85 + srnd() * 0.45,
        flip: srnd() < 0.5
      });
    }
  })();
  const CONF_COLS = ['#f2d78a', '#e8e4d8', '#7a5a9a', '#d8a23a', '#b85aa0'];
  const FLOOR_Y = 246, FRONT_FEET = 264, BACK_FEET = 250;

  function drawCrowdSage(sg, anim) {
    const im = SAGE_IMG.joy;
    const H = Math.round(46 * sg.sc), W = Math.round(H * im.naturalWidth / im.naturalHeight);
    /* brincos eufòrics continus, cadascú al seu ritme */
    const hop = Math.abs(Math.sin(anim * 0.115 * sg.sp + sg.ph));
    const wig = Math.sin(anim * 0.07 + sg.ph) * 1.6;
    const feetY = (sg.row ? FRONT_FEET : BACK_FEET);
    const y = feetY - hop * (sg.row ? 11 : 8);
    ctx.save();
    ctx.translate(Math.round(sg.x + wig), Math.round(y));
    if (sg.flip) ctx.scale(-1, 1);
    ctx.drawImage(im, -Math.round(W / 2), -H, W, H);
    ctx.restore();
  }

  function drawConfetti(anim, front) {
    for (let i = front ? 23 : 0; i < (front ? 46 : 23); i++) {
      const x = (i * 83.7 + anim * (0.32 + (i % 3) * 0.21) + Math.sin(anim * 0.05 + i) * 6) % VW;
      const y = (i * 47.3 + anim * (0.55 + (i % 4) * 0.28)) % VH;
      ctx.fillStyle = CONF_COLS[i % CONF_COLS.length];
      ctx.globalAlpha = 0.65 + 0.35 * Math.sin(anim * 0.13 + i * 2.1);
      if (((i + Math.floor(anim / 5)) % 3) === 0) ctx.fillRect(x, y, 2, 2);
      else ctx.fillRect(x, y, 2, 3);
    }
    ctx.globalAlpha = 1;
  }

  function drawSparkles(anim) {
    for (let i = 0; i < 12; i++) {
      const cyc = (anim + i * 13) % 70;
      if (cyc > 22) continue;
      const sx = 30 + ((i * 167) % (VW - 60));
      const sy = FLOOR_Y - 6 - ((i * 61) % 34) - cyc * 0.8;
      ctx.fillStyle = 'rgba(255,233,168,' + (0.85 - cyc * 0.035) + ')';
      ctx.fillRect(sx - 1, sy, 2, 2);
      if (cyc < 10) { ctx.fillRect(sx - 3, sy + 1, 1, 1); ctx.fillRect(sx + 3, sy + 1, 1, 1); }
    }
  }

  const _drawWinF = drawWin;
  drawWin = function () {
    _drawWinF();   // fons atenuat i textos de victoria de masa.js
    const anim = game.anim;
    /* pista de celebració */
    ctx.fillStyle = 'rgba(10,8,16,.78)'; ctx.fillRect(0, FLOOR_Y, VW, VH - FLOOR_Y);
    ctx.fillStyle = '#3e3a36'; ctx.fillRect(0, FLOOR_Y, VW, 2);
    if (okS(SAGE_IMG.joy)) {
      drawConfetti(anim, false);
      for (const sg of CROWD) if (!sg.row) drawCrowdSage(sg, anim);
      /* el guerrer al centre, també botant d'alegria */
      if (typeof drawWarrior === 'function' && typeof player !== 'undefined' && !player.dead) {
        const hhop = Math.abs(Math.sin(anim * 0.09)) * 10;
        drawWarrior(VW / 2, FRONT_FEET - hhop, 1, 'idle', anim, Math.max(1, player.weapon || 1));
      }
      for (const sg of CROWD) if (sg.row) drawCrowdSage(sg, anim);
      drawConfetti(anim, true);
      drawSparkles(anim);
      drawText('ELS SAVIS ALLIBERATS CELEBREN LA TEVA VICTÒRIA!', VW / 2, 160, '#ffe9a8', 9, 'center');
    }
  };
})();
