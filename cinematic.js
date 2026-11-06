/* PANTHOKRATOR - cinemàtica de transició Font Màgica -> Aigües subterrànies (v2).
   En vèncer el Gos Zombi (final de la 2a gran etapa, davant la gran Font),
   una seqüència cinematogràfica mostra el protagonista entrant en un túnel
   de la gran font que condueix a la part aquàtica subterrània de la 3a etapa.

   v2: escenaris amb l'art pintat del propi joc (PANTO_ART.GARDENS,
   PANTO_ART.FOUNTAIN i BGIMGS.hall), en lloc de formes geomètriques.

   Es carrega l'última; no modifica game.js, audio.js, etapas.js, masa.js,
   sage.js ni festival.js: embolcalla step() i render() i afegeix l'estat
   'cinema' entre el 'stageclear' del Gos i la targeta de la fase 6.
   Es pot saltar amb una pulsació nova d'ATACAR/SALTAR o qualsevol direcció. */
(function () {
  'use strict';
  window.__cinematic = 2;

  const DOG_IDX = 5;              // EL GOS ZOMBI (arena davant la gran Font)
  const WATER_IDX = 6;            // AIGÜES DE LA FONT (primera fase subterrània)
  const DUR = 470;                // durada total (frames a 60 fps)
  const BAR = 20;                 // franges cinematogràfiques

  let prevIn = null;              // per detectar pulsacions noves (saltar cinemàtica)

  function isTransitionPoint() {
    return game.state === 'stageclear' && game.anim > 130 &&
      world.stageIdx === DOG_IDX &&
      STAGES[DOG_IDX] && STAGES[DOG_IDX].name === 'EL GOS ZOMBI' &&
      STAGES[WATER_IDX] && STAGES[WATER_IDX].name === 'AIGÜES DE LA FONT' &&
      !(typeof TEST !== 'undefined' && TEST.active);
  }

  function startCinema() {
    game.state = 'cinema'; game.anim = 0;
    if (sfx.stopMusic) sfx.stopMusic();
    prevIn = snapIn();
  }

  function endCinema() {
    loadStage(WATER_IDX);
    game.state = 'stagecard'; game.anim = 0;
    if (sfx.track !== 'stage3') sfx.playMusic(world.stage.boss ? 'boss' : 'stage');
    /* consumir entrada residual perquè no salti ni ataci en començar la fase */
    input.jump = input.attack = false;
    input.jumpBuf = input.attackBuf = input.upBuf = input.dnBuf = 0;
    prevIn = null;
  }

  function snapIn() {
    return {
      j: input.jumpHeld, a: input.attackHeld,
      l: input.left, r: input.right, u: input.up, d: input.down
    };
  }
  function freshPress() {
    const c = snapIn();
    const p = prevIn || {};
    return (c.j && !p.j) || (c.a && !p.a) || (c.l && !p.l) || (c.r && !p.r) ||
           (c.u && !p.u) || (c.d && !p.d);
  }

  function updateCinema() {
    game.anim++;
    const t = game.anim;
    if (t >= DUR) { endCinema(); return; }
    if (freshPress()) { endCinema(); return; }   // saltable des del primer frame
    prevIn = snapIn();
    /* el tema aquàtic comença quan el guerrer entra al túnel */
    if (t === 280 && sfx.playMusic && sfx.track !== 'stage3') sfx.playMusic('stage3');
  }

  /* ------------------------------ helpers de pintada ------------------------------ */
  function rad(x, y, r, stops) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    return g;
  }
  function h2(a, b) { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); }
  function okIm(im) { return im && im.complete && im.naturalWidth; }
  function hero(x, feetY, st, anim) {
    drawWarrior(x, feetY, 1, st, anim, Math.max(1, (typeof player !== 'undefined' && player.weapon) || 1));
  }
  function bars(t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VW, BAR); ctx.fillRect(0, VH - BAR, VW, BAR);
    if (t > 40 && (t % 60) < 40)
      drawText('Prem ATACAR o SALTAR per continuar >>', VW - 8, VH - BAR + 6, '#8a8a96', 7, 'right');
  }
  function caption(txt, t, t0, t1) {
    if (t < t0 || t > t1) return;
    const a = Math.min(1, (t - t0) / 18, (t1 - t) / 18);
    ctx.globalAlpha = Math.max(0, a);
    drawText(txt, VW / 2, BAR + 6, '#ffe9a8', 9, 'center');
    ctx.globalAlpha = 1;
  }
  function vignette(strength) {
    ctx.fillStyle = rad(VW / 2, VH / 2, VW * 0.62, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,' + strength + ')']]);
    ctx.fillRect(0, 0, VW, VH);
  }

  /* art pintat del propi joc */
  function gardensImg() { return (window.PANTO_ART || {}).GARDENS; }
  function fountainImg() { return (window.PANTO_ART || {}).FOUNTAIN; }
  function hallImg() { return (typeof BGIMGS !== 'undefined' && BGIMGS.hall) || null; }

  /* --------------------------- escena exterior: la gran Font --------------------------- */
  const FOUNT_X = 332;            // centre de la gran Font
  const GY_C = 216;               // nivell del terra (mateix GY del joc)

  function drawMagicSparkles(t, cx, top, w, h) {
    const hue = (t * 2) % 360;
    ctx.fillStyle = 'hsla(' + hue + ',90%,85%,.85)';
    for (let s = 0; s < 12; s++) {
      const sx = cx - w / 2 + (s * 37 + t * 2) % w, sy = top + ((s * 23 + t) % h);
      ctx.fillRect(sx, sy, 1.6, 1.6);
    }
  }

  function drawWaterStreaks(x0, x1, y, h, t, alpha) {
    /* cortina d'aigua animada sobre la boca del túnel */
    for (let i = 0; i < x1 - x0; i += 3) {
      const xx = x0 + i + Math.sin(t * 0.16 + i) * 0.8;
      ctx.fillStyle = 'rgba(165,225,248,' + (0.8 * alpha).toFixed(2) + ')';
      ctx.fillRect(xx, y + ((i * 5 + t * 2.2) % 6) - 6, 2, h + 8);
    }
  }

  /* boca del túnel: obertura en la base de la Font amb pedra pintada (tall de BGIMGS.hall) */
  function drawTunnelMouth(cx, baseY, t, open) {
    const W = 36, H = 46, x = cx - W / 2, y = baseY - H;
    const hall = hallImg();
    ctx.save();
    /* marc de pedra pintada: retallem un tros de la sala romànica */
    ctx.beginPath();
    ctx.moveTo(x - 8, baseY); ctx.lineTo(x - 8, y + 8);
    ctx.arc(cx, y + 8, W / 2 + 8, Math.PI, 0);
    ctx.lineTo(x + W + 8, baseY); ctx.closePath();
    ctx.clip();
    if (okIm(hall)) {
      ctx.drawImage(hall, 90, 30, 220, 160, x - 8, y - 8, W + 16, H + 10);
      ctx.fillStyle = 'rgba(10,8,16,.30)'; ctx.fillRect(x - 8, y - 8, W + 16, H + 10);
    } else {
      ctx.fillStyle = '#4e4338'; ctx.fillRect(x - 8, y - 8, W + 16, H + 10);
    }
    ctx.restore();
    if (open > 0) {
      /* interior fosc amb resplendor blau creixent */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, baseY); ctx.lineTo(x, y + 10);
      ctx.arc(cx, y + 10, W / 2, Math.PI, 0);
      ctx.lineTo(x + W, baseY); ctx.closePath();
      ctx.clip();
      ctx.fillStyle = '#04101c'; ctx.fillRect(x, y, W, H);
      ctx.fillStyle = rad(cx, baseY - 10, 30, [[0, 'rgba(90,205,245,' + (0.55 * open).toFixed(2) + ')'], [1, 'rgba(90,205,245,0)']]);
      ctx.fillRect(x, y, W, H);
      ctx.restore();
      for (let i = 0; i < 4; i++) {   // bombolles que pugen per la boca
        const bt = (t * 0.5 + i * 23) % 40;
        ctx.fillStyle = 'rgba(190,240,255,' + (0.6 * open * (1 - bt / 40)).toFixed(2) + ')';
        ctx.fillRect(cx - 9 + i * 6 + Math.sin(t * 0.1 + i), baseY - bt, 1.8, 1.8);
      }
    }
    if (open < 1) {
      /* cortina d'aigua que s'obre en dues fulles */
      const half = (W / 2 + 6) * (1 - open);
      if (half > 0.5) {
        drawWaterStreaks(x - 6, cx - (W / 2 + 6) + half + (W / 2 + 6) * 0 + 0, y, H, t, 1);   // fulla esquerra
        drawWaterStreaks(cx + (W / 2 + 6) - half, x + W + 6, y, H, t, 1);                     // fulla dreta
      }
      /* esprai a la línia d'obertura */
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = 'rgba(230,250,255,.7)';
        ctx.fillRect(cx - half - 2 + h2(i, t >> 2) * 4, y + 6 + i * 6, 1.6, 1.6);
        ctx.fillRect(cx + half - 2 + h2(i + 9, t >> 2) * 4, y + 4 + i * 6, 1.6, 1.6);
      }
    }
  }

  function drawExterior(t, heroX, heroFeet, heroSt, open) {
    const G = gardensImg();
    if (okIm(G)) ctx.drawImage(G, 0, 0, VW, VH);
    else { ctx.fillStyle = '#060a1c'; ctx.fillRect(0, 0, VW, VH); }
    /* la gran Font pintada, amb la mateixa llum canvia-color del joc */
    const F = fountainImg();
    if (okIm(F)) {
      const FH = 168, FW = Math.round(FH * F.naturalWidth / F.naturalHeight);
      const fx = FOUNT_X - Math.round(FW / 2), fy = GY_C - FH;
      const hue = (t * 2) % 360;
      ctx.fillStyle = rad(FOUNT_X, fy + FH * 0.45, 120, [[0, 'hsla(' + hue + ',85%,72%,.34)'], [1, 'hsla(' + hue + ',85%,60%,0)']]);
      ctx.fillRect(fx - 40, fy - 40, FW + 80, FH + 60);
      ctx.drawImage(F, fx, fy, FW, FH);
      drawMagicSparkles(t, FOUNT_X, fy + 26, FW, 40);
      /* bassa il·luminada als peus */
      ctx.fillStyle = 'rgba(90,180,225,.16)';
      ctx.fillRect(fx + 12, GY_C - 2, FW - 24, 8);
    }
    /* boca del túnel a la base de la Font */
    drawTunnelMouth(FOUNT_X, GY_C + 8, t, open);
    if (heroSt) hero(heroX, heroFeet, heroSt, t);
    vignette(0.42);
  }

  /* --------------------------- escena interior: el túnel --------------------------- */
  function drawTunnel(t, heroX, heroFeet, heroSt) {
    const hall = hallImg();
    if (okIm(hall)) {
      ctx.drawImage(hall, 0, 0, VW, VH);
      /* ambient subterrani: foscor blavosa sobre la pedra pintada */
      ctx.fillStyle = 'rgba(4,10,24,.62)'; ctx.fillRect(0, 0, VW, VH);
    } else {
      ctx.fillStyle = '#04060c'; ctx.fillRect(0, 0, VW, VH);
    }
    /* llum càlida de la Font quedant enrere (esquerra) */
    ctx.fillStyle = rad(10, 190, 130, [[0, 'rgba(216,162,58,.22)'], [1, 'rgba(216,162,58,0)']]);
    ctx.fillRect(0, 40, 220, VH - 40);
    /* resplendor blau de les aigües endavant (dreta), palpitant */
    const pulse = 0.75 + 0.25 * Math.sin(t * 0.06);
    ctx.fillStyle = rad(430, 180, 150, [[0, 'rgba(60,170,225,' + (0.36 * pulse).toFixed(2) + ')'], [1, 'rgba(60,170,225,0)']]);
    ctx.fillRect(180, 20, VW - 180, VH - 20);
    /* feixos de llum aquàtica que travessen la volta */
    ctx.fillStyle = 'rgba(160,225,255,.05)';
    for (let r = 0; r < 3; r++) {
      const rx = 250 + ((r * 90 + t * 0.35) % 260);
      ctx.beginPath();
      ctx.moveTo(rx, 0); ctx.lineTo(rx + 30, 0); ctx.lineTo(rx + 80, VH); ctx.lineTo(rx + 20, VH);
      ctx.closePath(); ctx.fill();
    }
    /* canal d'aigua que s'endinsa cap a les profunditats */
    ctx.fillStyle = 'rgba(14,52,76,.88)';
    ctx.beginPath();
    ctx.moveTo(330, 212); ctx.lineTo(VW, 216); ctx.lineTo(VW, VH); ctx.lineTo(392, VH);
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 9; i++) {   // corrents brillants
      const xx = 336 + ((i * 29 + t * 1.1) % 130);
      ctx.fillStyle = 'rgba(140,220,250,' + (0.18 + 0.22 * h2(i, t >> 4)).toFixed(2) + ')';
      ctx.fillRect(xx, 216 + h2(i, 2) * 40, 9, 1.5);
    }
    for (let i = 0; i < 10; i++) {  // bombolles
      const bt = (t * 0.8 + i * 31) % 90;
      ctx.fillStyle = 'rgba(190,240,255,' + (0.55 * (1 - bt / 90)).toFixed(2) + ')';
      ctx.fillRect(345 + h2(i, 11) * 90 + Math.sin(t * 0.08 + i * 2) * 2.5, 250 - bt * 0.5, 1.8, 1.8);
    }
    for (let i = 0; i < 3; i++) {   // degotes de la volta
      const dt = (t * 1.4 + i * 67) % 80;
      ctx.fillStyle = 'rgba(200,235,250,' + (0.7 - dt * 0.008).toFixed(2) + ')';
      ctx.fillRect(90 + i * 130, 66 + dt * 1.7, 1.2, 4);
    }
    /* ombra del terra per asseure el guerrer */
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(0, 222, VW, VH - 222);
    if (heroSt) hero(heroX, heroFeet, heroSt, t);
    vignette(0.5);
  }

  /* ------------------------------- seqüència ------------------------------- */
  function drawCinema() {
    const t = game.anim;
    ctx.clearRect(0, 0, VW, VH);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);

    if (t < 255) {
      /* EXTERIOR: arribada i obertura del pas */
      let heroX, heroSt = 'run';
      if (t < 100)      { heroX = -20 + t * 1.9; }                        // entra corrent
      else if (t < 150) { heroX = 170; heroSt = 'idle'; }                 // s'atura davant la Font
      else              { heroX = 170 + (t - 150) * 1.3; heroSt = "run"; }   // s'hi apropa
      if (heroX > 304) { heroX = 304; heroSt = "idle"; }
      const open = t < 150 ? 0 : Math.min(1, (t - 150) / 85);             // la cortina s'obre
      drawExterior(t, heroX, GY_C - 2, heroSt, open);
      caption('LA FONT MÀGICA', t, 14, 130);
      caption('LA CORTINA D\'AIGUA S\'OBRE...', t, 168, 246);
      /* foscor de transició cap a l'interior */
      if (t > 238) {
        ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, (t - 238) / 17).toFixed(2) + ')';
        ctx.fillRect(0, 0, VW, VH);
      }
    } else if (t < 400) {
      /* INTERIOR: davallada pel túnel */
      const k = t - 255;
      const heroX = Math.min(296, 96 + k * 1.55);
      const heroFeet = Math.min(222, 192 + k * 0.23);
      drawTunnel(t, heroX, heroFeet, 'run');
      caption('UN TÚNEL SOTA LA FONT', t, 268, 350);
      if (k < 16) {   // s'aclareix des del negre
        ctx.fillStyle = 'rgba(0,0,0,' + (1 - k / 16).toFixed(2) + ')';
        ctx.fillRect(0, 0, VW, VH);
      }
    } else if (t < 452) {
      /* CAPBUSSADA al canal */
      const k = t - 400;
      drawTunnel(t, 0, 0, null);
      if (k < 26) {   // arc de capbussada
        const p = k / 26;
        const hx = 296 + p * 76;
        const hy = 222 - Math.sin(p * Math.PI) * 46 + p * 16;
        hero(hx, hy, 'dive', t);
      } else {        // esquitxada i espurnes
        const sp = k - 26;
        for (let i = 0; i < 16; i++) {
          const a = i * 0.7, r = 4 + sp * 2.6 + h2(i, 3) * 8;
          ctx.fillStyle = 'rgba(215,245,255,' + Math.max(0, 0.85 - sp * 0.045).toFixed(2) + ')';
          ctx.fillRect(372 + Math.cos(a) * r, 236 - Math.abs(Math.sin(a)) * r * 0.6 + sp * 1.1, 2, 2);
        }
      }
      /* la llum blava ho inunda tot */
      const flood = Math.max(0, (t - 416) / 36);
      ctx.fillStyle = 'rgba(70,180,230,' + (flood * 0.85).toFixed(2) + ')';
      ctx.fillRect(0, 0, VW, VH);
      caption('CAP A LES AIGÜES SUBTERRÀNIES', t, 398, 448);
    } else {
      /* flaix blanc i pas a la targeta de fase */
      drawTunnel(t, 0, 0, null);
      const w = Math.min(1, (t - 452) / 14);
      ctx.fillStyle = 'rgba(240,252,255,' + w.toFixed(2) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
    bars(t);
  }

  /* ------------------------------- embolcalls ------------------------------- */
  const _stepC = step;
  step = function () {
    if (game.state === 'cinema') { game.frame++; updateCinema(); return; }
    if (isTransitionPoint()) { game.frame++; startCinema(); return; }
    _stepC.apply(null, arguments);
  };
  const _renderC = render;
  render = function () {
    if (game.state === 'cinema') { drawCinema(); return; }
    _renderC.apply(null, arguments);
  };
})();
