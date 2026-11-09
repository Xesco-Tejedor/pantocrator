/* PANTHOKRATOR - introduccio cinematica de l'aventura (v1).
   Peticio de Francesc (9 nov 2026): una cinematica molt atractiva que expliqui el
   problema del protagonista i que els ha passat als savis (savis).
   En pulsar COMENCAR al titol, abans de la primera fase, es mostra la cinematica:
     1. els savis custodien la llum del museu,
     2. el Panthokrator es corromp (la gana de la Massa),
     3. el seu esguard els converteix en pedra,
     4. el guerrer arriba i jura alliberar-los.
   Es pot saltar en qualsevol moment (tecla, boto o toc). No modifica game.js ni cap altre
   fitxer: embolcalla startGame(), step() i render() com cinematic.js. No s'activa a ?test=1. */
(function () {
  'use strict';
  window.__intro = 1;

  const DUR = 1780;               // frames a 60 fps (~30 s)
  const BAR = 20;
  const A5 = window.PANTO_ART5 || {};
  const IM = {};
  for (const k in A5) { const im = new Image(); im.src = A5[k]; IM[k] = im; }
  const okIm = (im) => im && im.complete && im.naturalWidth;

  let prevIn = null;
  let skipReq = false;
  let dbgT = null;                // ?intro=N per revisar un fotograma concret

  const SAV_X = [86, 168, 250, 332, 414];     // posicions dels cinc savis
  const FLOOR = 214;

  function snapIn() {
    return { j: input.jumpHeld, a: input.attackHeld, l: input.left, r: input.right, u: input.up, d: input.down };
  }
  function freshPress() {
    const c = snapIn(), p = prevIn || {};
    return (c.j && !p.j) || (c.a && !p.a) || (c.l && !p.l) || (c.r && !p.r) || (c.u && !p.u) || (c.d && !p.d);
  }
  /* toc o tecla addicional (la pantalla tactil no passa per input.*) */
  const askSkip = () => { if (game.state === 'intro' && game.anim > 25) skipReq = true; };
  window.addEventListener('pointerdown', askSkip, true);
  window.addEventListener('keydown', (e) => {
    if (game.state === 'intro' && game.anim > 25 && ['Enter', ' ', 'Escape', 'x', 'X', 'z', 'Z'].indexOf(e.key) >= 0) skipReq = true;
  }, true);

  const _startGame = startGame;
  function beginIntro() {
    game.state = 'intro'; game.anim = 0; skipReq = false;
    prevIn = snapIn();
    input.jump = input.attack = false;
    input.jumpBuf = input.attackBuf = input.upBuf = input.dnBuf = 0;
    if (sfx.playMusic && sfx.track !== 'title') sfx.playMusic('title');
  }
  function endIntro() {
    game.state = 'title';
    prevIn = null; skipReq = false;
    _startGame();
    input.jump = input.attack = false;
    input.jumpBuf = input.attackBuf = input.upBuf = input.dnBuf = 0;
  }
  startGame = function () {
    if ((typeof TEST !== 'undefined' && TEST.active) || /[?&]nointro=1/.test(location.search)) { _startGame(); return; }
    beginIntro();
  };

  /* ------------------------------- helpers ------------------------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  function h2(a, b) { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); }
  function rad(x, y, r, stops) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    return g;
  }
  function wrap(txt, max) {
    const words = txt.split(' '), lines = []; let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > max) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    }
    if (cur) lines.push(cur);
    return lines;
  }
  /* subtitol amb entrada/sortida suau, a la franja inferior */
  function caption(txt, t, t0, t1, col) {
    if (t < t0 || t > t1) return;
    const a = Math.min(1, (t - t0) / 24, (t1 - t) / 24);
    const lines = wrap(txt, 70);
    const h = lines.length * 13 + 8, y0 = VH - BAR - h - 4;
    ctx.globalAlpha = Math.max(0, a) * 0.78;
    ctx.fillStyle = '#05060c'; ctx.fillRect(24, y0, VW - 48, h);
    ctx.globalAlpha = Math.max(0, a);
    ctx.strokeStyle = 'rgba(216,162,58,.7)'; ctx.lineWidth = 1; ctx.strokeRect(24.5, y0 + 0.5, VW - 49, h - 1);
    lines.forEach((l, i) => drawText(l, VW / 2, y0 + 5 + i * 13, col || '#ffe9a8', 9, 'center'));
    ctx.globalAlpha = 1;
  }
  function spr(im, x, feetY, dh, alpha) {
    if (!okIm(im)) return;
    const w = dh * im.width / im.height;
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(im, Math.round(x - w / 2), Math.round(feetY - dh), Math.round(w), Math.round(dh));
    ctx.globalAlpha = 1;
  }

  /* ---------------------------- escenari: l'absis ---------------------------- */
  /* corrupcio 0..1: dorat -> vermell sagnant */
  function drawApse(t, corr) {
    ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, VW, VH);
    const cx = VW / 2;
    /* arc romanic daurat */
    const g = rad(cx, 150, 190, [[0, corr > 0.5 ? '#6a1c1c' : '#7a5c1e'], [0.6, corr > 0.5 ? '#2a0c10' : '#3a2a0c'], [1, '#0a0806']]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, 165, 200, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 200, 165, 400, FLOOR - 165);
    /* mescla de color per corrupcio */
    if (corr > 0) {
      ctx.fillStyle = 'rgba(150,20,28,' + (0.45 * corr).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(cx, 165, 200, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 200, 165, 400, FLOOR - 165);
    }
    /* bandes de mosaic */
    for (const [r, col] of [[188, '#54401e'], [172, '#6b4f22'], [156, '#3f2f14']]) {
      ctx.strokeStyle = corr > 0.6 ? 'rgba(90,30,26,.85)' : col; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(cx, 165, r, Math.PI, 0); ctx.stroke();
    }
    /* columnes */
    for (const px of [cx - 212, cx + 212]) {
      ctx.fillStyle = '#26211b'; ctx.fillRect(px - 12, 0, 24, FLOOR);
      ctx.fillStyle = '#3c352b'; ctx.fillRect(px - 12, 0, 6, FLOOR);
    }
    /* el Panthokrator: la mandorla pintada del propi joc */
    const pulse = 1 + Math.sin(t * 0.08) * 0.04 * corr;
    ctx.save();
    ctx.translate(cx, 92); ctx.scale(pulse, pulse); ctx.translate(-cx, -92);
    drawTitleEmblem(cx, 92);
    ctx.restore();
    if (corr > 0) {
      /* esguard vermell: ulls que s'encenen i esquerdes */
      const e = 0.55 + 0.45 * Math.sin(t * 0.12);
      ctx.fillStyle = rad(cx, 84, 62, [[0, 'rgba(255,40,30,' + (0.55 * corr * e).toFixed(2) + ')'], [1, 'rgba(255,40,30,0)']]);
      ctx.fillRect(cx - 62, 22, 124, 124);
      ctx.fillStyle = 'rgba(255,70,50,' + (corr * (0.7 + 0.3 * e)).toFixed(2) + ')';
      ctx.fillRect(cx - 11, 83, 7, 3); ctx.fillRect(cx + 4, 83, 7, 3);
      ctx.strokeStyle = 'rgba(10,4,6,' + (0.85 * corr).toFixed(2) + ')'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const sx = cx - 40 + i * 16, n = Math.floor(corr * 6);
        if (i >= n) break;
        ctx.beginPath(); ctx.moveTo(sx, 54 + h2(i, 1) * 12);
        for (let k = 1; k < 5; k++) ctx.lineTo(sx + (h2(i, k) - 0.5) * 14, 54 + k * 18);
        ctx.stroke();
      }
    }
    /* terra de pedra */
    ctx.fillStyle = corr > 0.6 ? '#1c1414' : '#2a241c'; ctx.fillRect(0, FLOOR, VW, VH - FLOOR);
    ctx.fillStyle = corr > 0.6 ? '#2e1c1c' : '#463c2c'; ctx.fillRect(0, FLOOR, VW, 2);
  }

  /* llum dels savis: halo daurat que s'apaga amb la petrificacio */
  function drawSavis(t, stoneAt) {
    for (let i = 0; i < 5; i++) {
      const x = SAV_X[i];
      const s = stoneAt ? seg(t, stoneAt[i], stoneAt[i] + 26) : 0;
      if (s < 1) {
        ctx.fillStyle = rad(x, FLOOR - 28, 34, [[0, 'rgba(255,225,140,' + (0.38 * (1 - s)).toFixed(2) + ')'], [1, 'rgba(255,225,140,0)']]);
        ctx.fillRect(x - 34, FLOOR - 64, 68, 64);
      }
      const bob = s < 1 ? Math.sin(t * 0.05 + i) * 1.2 : 0;
      spr(IM.idle, x, FLOOR + bob, 62, 1);
      if (s > 0) spr(IM.stone, x, FLOOR, 62, s);
      /* ressons de l'impacte: flaix blanc i esquerdes */
      if (stoneAt && t >= stoneAt[i] && t < stoneAt[i] + 16) {
        ctx.fillStyle = 'rgba(255,240,230,' + (0.7 * (1 - (t - stoneAt[i]) / 16)).toFixed(2) + ')';
        ctx.fillRect(x - 22, FLOOR - 64, 44, 64);
      }
    }
  }

  /* ---------------------------- escenes ---------------------------- */
  function drawIntro(t) {
    const stoneAt = [905, 945, 985, 1025, 1065];
    let corr = 0;
    if (t >= 420) corr = seg(t, 420, 620);
    if (t >= 1200) corr = 1;
    drawApse(t, corr);

    /* feix vermell que escombra els savis (escena 3) */
    if (t >= 860 && t < 1120) {
      const p = seg(t, 880, 1090);
      const bx = 60 + p * 370;
      ctx.fillStyle = rad(bx, FLOOR - 30, 80, [[0, 'rgba(255,60,40,.55)'], [1, 'rgba(255,60,40,0)']]);
      ctx.fillRect(bx - 80, 60, 160, 170);
      ctx.strokeStyle = 'rgba(255,90,70,.75)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(VW / 2 + 0, 88); ctx.lineTo(bx, FLOOR - 30); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,230,220,.9)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(VW / 2, 88); ctx.lineTo(bx, FLOOR - 30); ctx.stroke();
    }

    /* savis (escenes 1-4) */
    drawSavis(t, t >= 860 ? stoneAt : null);

    /* pols / cendres flotant a partir de la corrupcio */
    if (corr > 0) {
      for (let i = 0; i < 26; i++) {
        const px = (h2(i, 3) * VW + t * (0.2 + h2(i, 5) * 0.4)) % VW;
        const py = (h2(i, 7) * VH - t * (0.3 + h2(i, 9) * 0.5) + VH * 4) % VH;
        ctx.fillStyle = 'rgba(230,110,90,' + (0.45 * corr).toFixed(2) + ')';
        ctx.fillRect(px, py, 1.6, 1.6);
      }
    } else {
      for (let i = 0; i < 18; i++) {
        const px = (h2(i, 3) * VW + Math.sin(t * 0.02 + i) * 6);
        const py = (h2(i, 7) * 180 - t * 0.2 + 1800) % 180 + 20;
        ctx.fillStyle = 'rgba(255,230,150,.55)'; ctx.fillRect(px, py, 1.6, 1.6);
      }
    }

    /* escena 4: el guerrer arriba i s'acosta als savis de pedra */
    if (t >= 1180) {
      const wk = seg(t, 1190, 1400);
      const hx = -20 + wk * 118;
      const moving = wk < 1;
      if (t >= 1400) {
        /* aixeca l'arma: flaix i atac */
        const a = t - 1400;
        drawWarrior(hx, FLOOR + 10, 1, a % 50 < 14 ? 'attack' : 'idle', t, 1);
      } else {
        drawWarrior(hx, FLOOR + 10, 1, moving ? 'run' : 'idle', t, 1);
      }
      /* un parell d'ulls vermells des de l'ombra: l'amenaca roman */
      const eyes = 0.5 + 0.5 * Math.sin(t * 0.1);
      ctx.fillStyle = 'rgba(255,60,40,' + (0.4 + 0.5 * eyes).toFixed(2) + ')';
      ctx.fillRect(VW / 2 - 11, 83, 7, 3); ctx.fillRect(VW / 2 + 4, 83, 7, 3);
    }

    /* vinyeta */
    ctx.fillStyle = rad(VW / 2, VH / 2, VW * 0.62, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.55)']]);
    ctx.fillRect(0, 0, VW, VH);

    /* subtitols (catala, com la resta del joc) */
    caption('Durant segles, els SAVIS van guardar la llum del MNAC. Sota la seva mirada, les pintures dormien en pau.', t, 40, 380);
    caption('Fins que la gana de la Massa, el consum sense fi, va despertar el PANTHOKRATOR... i el seu esguard es va tornar vermell.', t, 430, 800, '#ffb09a');
    caption('Un sol raig d\'aquells ulls, i els savis es van fer PEDRA. Ara resten presos, escampats per les sales, els jardins i la Font.', t, 890, 1180, '#ffb09a');
    caption('Només un guerrer es manté dempeus entre les runes. Allibera els savis: sense ells, el museu no tornarà a obrir els ulls.', t, 1210, 1580);

    /* fosa final i titol */
    if (t >= 1590) {
      const f = seg(t, 1590, 1640);
      ctx.fillStyle = 'rgba(5,6,12,' + (0.92 * f).toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH);
      drawTitleEmblem(VW / 2, 84);
      const T = 'PANTHOKRATOR';
      ctx.globalAlpha = seg(t, 1620, 1670);
      ctx.font = 'bold 34px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#14100c'; ctx.fillText(T, VW / 2 + 2, 146);
      ctx.fillStyle = '#d8a23a'; ctx.fillText(T, VW / 2, 144);
      drawText('Allibera els savis. Apaivaga el Panthokrator.', VW / 2, 190, '#e8e4d8', 9, 'center');
      ctx.globalAlpha = 1;
    }

    /* fosa inicial i entre escenes */
    let black = 0;
    if (t < 60) black = 1 - t / 60;
    for (const c of [400, 850, 1170]) { if (Math.abs(t - c) < 30) black = Math.max(black, 1 - Math.abs(t - c) / 30); }
    if (t > DUR - 30) black = Math.max(black, (t - (DUR - 30)) / 30);
    if (black > 0) { ctx.fillStyle = 'rgba(0,0,0,' + black.toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH); }

    /* franges cinematografiques i ajuda */
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, BAR); ctx.fillRect(0, VH - BAR, VW, BAR);
    if (t > 30 && (t % 60) < 40) drawText('Toca o prem una tecla per saltar >>', VW - 8, VH - BAR + 6, '#8a8a96', 7, 'right');
  }

  /* ------------------------------- embolcalls ------------------------------- */
  const _stepI = step;
  step = function () {
    if (game.state === 'intro') {
      game.frame++;
      if (dbgT !== null) { game.anim = dbgT; return; }
      game.anim++;
      if (game.anim >= DUR || skipReq || (game.anim > 25 && freshPress())) { endIntro(); return; }
      prevIn = snapIn();
      return;
    }
    _stepI.apply(null, arguments);
  };
  const _renderI = render;
  render = function () {
    if (game.state === 'intro') { drawIntro(game.anim); return; }
    _renderI.apply(null, arguments);
  };

  /* ?intro=N: abre directamente la cinematica en el fotograma N (solo revision visual) */
  const m = /[?&]intro=(\d+)/.exec(location.search);
  if (m) {
    dbgT = parseInt(m[1], 10);
    window.addEventListener('load', () => { game.state = 'intro'; game.anim = dbgT; });
  }
})();
