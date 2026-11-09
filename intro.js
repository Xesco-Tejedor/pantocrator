/* PANTHOKRATOR - introduccio cinematica de l'aventura (v1).
   Peticio de Francesc (9 nov 2026): una cinematica molt atractiva que expliqui el
   problema del protagonista i que els ha passat als savis (savis).
   Guio aprovat per Francesc (9 nov 2026): els savis animaven la humanitat; un mal amorf,
   terrible i poderos amenaca de devorar els bens culturals; per fer-los callar, els ha
   convertit en pedra; nomes un heroi (el guerrer PANTHOKRATOR) pot capgirar la situacio.
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
    const g = rad(cx, 150, 190, [[0, corr > 0.5 ? '#2c1d3a' : '#7a5c1e'], [0.6, corr > 0.5 ? '#120a1c' : '#3a2a0c'], [1, '#0a0806']]);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, 165, 200, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 200, 165, 400, FLOOR - 165);
    /* mescla de color per corrupcio */
    if (corr > 0) {
      ctx.fillStyle = 'rgba(20,8,34,' + (0.38 * corr).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(cx, 165, 200, Math.PI, 0); ctx.fill();
      ctx.fillRect(cx - 200, 165, 400, FLOOR - 165);
    }
    /* bandes de mosaic */
    for (const [r, col] of [[188, '#54401e'], [172, '#6b4f22'], [156, '#3f2f14']]) {
      ctx.strokeStyle = corr > 0.6 ? 'rgba(48,30,70,.85)' : col; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(cx, 165, r, Math.PI, 0); ctx.stroke();
    }
    /* columnes */
    for (const px of [cx - 212, cx + 212]) {
      ctx.fillStyle = '#26211b'; ctx.fillRect(px - 12, 0, 24, FLOOR);
      ctx.fillStyle = '#3c352b'; ctx.fillRect(px - 12, 0, 6, FLOOR);
    }
    /* el Panthokrator: la mandorla pintada del propi joc */
    const pulse = 1;
    ctx.save();
    ctx.translate(cx, 92); ctx.scale(pulse, pulse); ctx.translate(-cx, -92);
    drawTitleEmblem(cx, 92);
    ctx.restore();
    /* terra de pedra */
    ctx.fillStyle = corr > 0.6 ? '#171320' : '#2a241c'; ctx.fillRect(0, FLOOR, VW, VH - FLOOR);
    ctx.fillStyle = corr > 0.6 ? '#2a2038' : '#463c2c'; ctx.fillRect(0, FLOOR, VW, 2);
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
        ctx.fillStyle = 'rgba(190,160,230,' + (0.6 * (1 - (t - stoneAt[i]) / 16)).toFixed(2) + ')';
        ctx.fillRect(x - 22, FLOOR - 64, 44, 64);
      }
    }
  }

  /* ---------------------------- el mal amorf ---------------------------- */
  /* massa fosca sense forma: bulk (0..1) creix des de dalt a la dreta; tip = x de la punta del tentacle */
  function drawMass(t, bulk, tipX, hide) {
    if (bulk <= 0) return;
    const R = 70 + bulk * 170;
    for (let i = 0; i < 9; i++) {
      const a = t * 0.02 + i * 1.7;
      const bx = 500 - bulk * 120 + Math.cos(a) * 30 - i * 6, by = 40 + Math.sin(a * 1.3) * 26 + i * 8 * bulk;
      const r = R * (0.5 + 0.5 * h2(i, 2)) + Math.sin(t * 0.05 + i) * 6;
      ctx.fillStyle = rad(bx, by, r, [[0, 'rgba(16,7,30,.96)'], [0.6, 'rgba(38,16,66,.88)'], [0.84, 'rgba(125,75,200,.38)'], [1, 'rgba(125,75,200,0)']]);
      ctx.fillRect(bx - r, by - r, r * 2, r * 2);
    }
    /* tentacle al terra: de la massa fins a la punta */
    if (tipX !== null && tipX < 520) {
      const x0 = 500, len = x0 - tipX;
      ctx.fillStyle = 'rgba(20,9,38,.97)'; ctx.strokeStyle = 'rgba(150,100,220,.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x0, FLOOR - 70 * bulk);
      for (let k = 0; k <= 24; k++) {
        const u = k / 24, x = x0 - u * len;
        const y = FLOOR - 6 - (1 - u) * 30 - Math.sin(t * 0.1 + u * 9) * 3 * (1 - u * 0.5);
        ctx.lineTo(x, y - (1 - u * 0.85) * 12);
      }
      for (let k = 24; k >= 0; k--) {
        const u = k / 24, x = x0 - u * len;
        ctx.lineTo(x, FLOOR + 1);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rad(tipX, FLOOR - 8, 22, [[0, 'rgba(120,70,170,.45)'], [1, 'rgba(120,70,170,0)']]);
      ctx.fillRect(tipX - 22, FLOOR - 30, 44, 34);
    }
    /* mirades/espurnes dins la massa */
    for (let i = 0; i < 14; i++) {
      const px = 380 + h2(i, 11) * 100 + Math.sin(t * 0.03 + i) * 6, py = 10 + h2(i, 12) * 110;
      ctx.fillStyle = 'rgba(150,100,200,' + (0.25 * bulk * (0.5 + 0.5 * Math.sin(t * 0.1 + i))).toFixed(2) + ')';
      ctx.fillRect(px, py, 2, 2);
    }
  }

  /* ---------------------------- escenes ---------------------------- */
  function drawIntro(t) {
    /* escena 1: 0-380 | 2: 380-800 | 3: 800-1130 | 4: 1130-1450 | 5: 1450-1780 */
    const bulk = t < 380 ? 0 : (t < 800 ? seg(t, 400, 760) * 0.75 : (t < 1130 ? 0.75 + 0.25 * seg(t, 800, 900) : 1 - 0.15 * seg(t, 1130, 1250)));
    const tipX = (t >= 830 && t < 1130) ? 470 - seg(t, 830, 1090) * 440 : (t >= 1130 ? Math.max(-9999, 30 - seg(t, 1130, 1230) * 200) : null);
    const stoneAt = SAV_X.map(x => 830 + (470 - x) / 440 * 260 + 6);   // la punta petrifica cada savi en passar
    const corr = seg(t, 400, 800);
    drawApse(t, corr);

    /* l'emblema/mural es va engolint durant l'escena 2 */
    if (t >= 520) {
      const e = seg(t, 520, 800);
      ctx.fillStyle = rad(VW / 2, 92, 70, [[0, 'rgba(16,7,30,' + (0.9 * e).toFixed(2) + ')'], [1, 'rgba(16,7,30,0)']]);
      ctx.fillRect(VW / 2 - 70, 22, 140, 140);
    }

    drawMass(t, bulk, tipX, false);
    drawSavis(t, t >= 830 ? stoneAt : null);

    /* particules: espurnes daurades en calma, cendra fosca amb el mal */
    for (let i = 0; i < 20; i++) {
      const px = (h2(i, 3) * VW + Math.sin(t * 0.02 + i) * 6) % VW;
      const py = (h2(i, 7) * 180 - t * 0.2 + 1800) % 180 + 20;
      ctx.fillStyle = corr < 0.5 ? 'rgba(255,230,150,.55)' : 'rgba(150,110,200,' + (0.35 * corr).toFixed(2) + ')';
      ctx.fillRect(px, py, 1.6, 1.6);
    }

    /* escenes 4-5: el guerrer Panthokrator */
    if (t >= 1150) {
      const arrive = seg(t, 1160, 1330);
      const hx = -20 + arrive * 110 + (t > 1460 ? seg(t, 1460, 1650) * 230 : 0);
      const moving = arrive < 1 || (t > 1460 && t < 1650);
      /* llum a l'arma quan comença a avançar */
      if (t > 1400) {
        ctx.fillStyle = rad(hx + 12, FLOOR - 22, 36, [[0, 'rgba(255,225,150,' + (0.4 * seg(t, 1400, 1480)).toFixed(2) + ')'], [1, 'rgba(255,225,150,0)']]);
        ctx.fillRect(hx - 24, FLOOR - 58, 72, 72);
      }
      drawWarrior(hx, FLOOR + 10, 1, moving ? 'run' : 'idle', t, 1);
    }

    ctx.fillStyle = rad(VW / 2, VH / 2, VW * 0.62, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.55)']]);
    ctx.fillRect(0, 0, VW, VH);

    /* subtitols aprovats (catala, com la resta del joc) */
    caption('Els savis, filòsofs i mags del bé comú, animaven la humanitat a ser reflexiva, culta, bona, bella i amable.', t, 40, 370);
    caption('Però un mal amorf, terrible i poderós amenaça de devorar els béns culturals que alimenten l\'esperit de la humanitat.', t, 430, 790, '#d8c4f0');
    caption('Per fer-los callar, els ha convertit en pedra.', t, 860, 1110, '#d8c4f0');
    caption('Només un heroi pot capgirar aquesta situació.', t, 1200, 1500);

    /* final: titol */
    if (t >= 1600) {
      const f = seg(t, 1600, 1650);
      ctx.fillStyle = 'rgba(5,6,12,' + (0.92 * f).toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH);
      drawTitleEmblem(VW / 2, 84);
      const T = 'PANTHOKRATOR';
      ctx.globalAlpha = seg(t, 1630, 1680);
      ctx.font = 'bold 34px "Courier New", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillStyle = '#14100c'; ctx.fillText(T, VW / 2 + 2, 146);
      ctx.fillStyle = '#d8a23a'; ctx.fillText(T, VW / 2, 144);
      ctx.globalAlpha = 1;
    }

    let black = 0;
    if (t < 60) black = 1 - t / 60;
    for (const c of [400, 850, 1180]) { if (Math.abs(t - c) < 20) black = Math.max(black, 0.6 * (1 - Math.abs(t - c) / 20)); }
    if (t > DUR - 30) black = Math.max(black, (t - (DUR - 30)) / 30);
    if (black > 0) { ctx.fillStyle = 'rgba(0,0,0,' + black.toFixed(2) + ')'; ctx.fillRect(0, 0, VW, VH); }

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
