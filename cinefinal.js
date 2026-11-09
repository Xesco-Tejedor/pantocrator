/* PANTHOKRATOR - cinematica previ al cap final LA MASSA DEL CONSUM (v1).
   Peticio de Francesc (9 nov 2026): una cinematica abans de l'enemic final, des del
   POV del protagonista davant l'enemic terrible i atros compost del pitjor turisme
   de masses. Guio aprovat per Francesc (9 nov 2026), 4 escenes en primera persona:
     1. surt de les aigües davant la gran Font (ma a la vora, degotes);
     2. la terra tremola, el cel s'enfosqueix;
     3. la Massa del Consum s'acosta rodant fins omplir la vista;
     4. alça l'espasa i fon a la targeta de la fase final.
   Se situa entre el stageclear de L'AMALGAMA i la targeta de LA MASSA DEL CONSUM.
   Es pot saltar amb toc o tecla. No modifica game.js, masa.js, cinematic.js ni
   intro.js: embolcalla step() i render() amb l'estat propi 'cinefinal'.
   Es carrega l'ultima; no s'activa a ?test=1 ni ?nocinefin=1. */
(function () {
  'use strict';
  window.__cinefinal = 1;

  const MASA = STAGES.length - 1;      // LA MASSA DEL CONSUM (afegida per masa.js)
  const MUD = MASA - 1;                // L'AMALGAMA
  const DUR = 1500;                    // frames a 60 fps (~25 s)
  const BAR = 20;
  const GYF = 200;                     // linia de terra de l'explanada

  let prevIn = null;
  let skipReq = false;
  let dbgT = null;                     // ?cinefin=N per revisar un fotograma concret
  const mdbg = location.search.match(/[?&]cinefin=(\d+)/);
  if (mdbg) dbgT = +mdbg[1];

  function isTransitionPoint() {
    return game.state === 'stageclear' && game.anim > 90 &&
      world.stageIdx === MUD &&
      STAGES[MUD] && STAGES[MUD].name.indexOf('AMALGAMA') >= 0 &&
      STAGES[MASA] && STAGES[MASA].name.indexOf('MASSA') >= 0 &&
      !(typeof TEST !== 'undefined' && TEST.active) &&
      !/[?&]nocinefin=1/.test(location.search);
  }
  function snapIn() {
    return { j: input.jumpHeld, a: input.attackHeld, l: input.left, r: input.right, u: input.up, d: input.down };
  }
  function freshPress() {
    const c = snapIn(), p = prevIn || {};
    return (c.j && !p.j) || (c.a && !p.a) || (c.l && !p.l) || (c.r && !p.r) || (c.u && !p.u) || (c.d && !p.d);
  }
  const askSkip = () => { if (game.state === 'cinefinal' && game.anim > 25) skipReq = true; };
  window.addEventListener('pointerdown', askSkip, true);
  window.addEventListener('keydown', (e) => {
    if (game.state === 'cinefinal' && game.anim > 25 && ['Enter', ' ', 'Escape', 'x', 'X', 'z', 'Z'].indexOf(e.key) >= 0) skipReq = true;
  }, true);

  function showControls(on) {
    for (const id of ['pad', 'btns']) { const e = document.getElementById(id); if (e) e.style.visibility = on ? '' : 'hidden'; }
  }
  function startCine() {
    game.state = 'cinefinal'; game.anim = 0; skipReq = false;
    showControls(false);
    if (sfx.stopMusic) sfx.stopMusic();
    prevIn = snapIn();
    input.jump = input.attack = false;
    input.jumpBuf = input.attackBuf = input.upBuf = input.dnBuf = 0;
  }
  function endCine() {
    loadStage(MASA);
    game.state = 'stagecard'; game.anim = 0;
    showControls(true);
    if (sfx.playMusic && sfx.track !== 'boss') sfx.playMusic(world.stage.boss ? 'boss' : 'stage');
    input.jump = input.attack = false;
    input.jumpBuf = input.attackBuf = input.upBuf = input.dnBuf = 0;
    prevIn = null; skipReq = false;
  }

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
    if (cur.trim()) lines.push(cur);
    return lines;
  }
  function okIm(im) { return im && im.complete && im.naturalWidth; }
  function mkImg(src) { const im = new Image(); if (src) im.src = src; return im; }

  /* subtitol amb el mateix estil que la intro (caixa fosca amb marc daurat) */
  function caption(txt, t, t0, t1) {
    if (t < t0 || t > t1) return;
    const a = Math.min(1, (t - t0) / 10, (t1 - t) / 10);
    const lines = wrap(txt, 70);
    const h = lines.length * 13 + 8, y0 = VH - BAR - h - 4;
    ctx.globalAlpha = Math.max(0, a) * 0.78;
    ctx.fillStyle = '#05060c'; ctx.fillRect(24, y0, VW - 48, h);
    ctx.globalAlpha = Math.max(0, a);
    ctx.strokeStyle = 'rgba(216,162,58,.7)'; ctx.lineWidth = 1; ctx.strokeRect(24.5, y0 + 0.5, VW - 49, h - 1);
    lines.forEach((l, i) => drawText(l, VW / 2, y0 + 5 + i * 13, '#ffe9a8', 9, 'center'));
    ctx.globalAlpha = 1;
  }
  function bars(t) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VW, BAR); ctx.fillRect(0, VH - BAR, VW, BAR);
    if (t > 30 && (t % 60) < 40)
      drawText('Toca o prem una tecla per saltar >>', VW - 8, VH - BAR + 6, '#8a8a96', 7, 'right');
  }

  /* ------------------------- art: fons, guerrer, Massa ------------------------- */
  function gardensImg() { return (window.PANTO_ART || {}).GARDENS; }
  function fountainImg() { return (window.PANTO_ART || {}).FOUNTAIN; }

  let CORE_IMG = null, FIG = null;
  function ensureArt() {
    if (FIG) return;
    const A4 = window.PANTO_ART4 || {};
    CORE_IMG = mkImg(A4.CORE);
    FIG = [mkImg(A4.MAN), mkImg(A4.WOMAN), mkImg(A4.KID), mkImg(A4.ELDER)];
  }
  const NP = 40, PTS = [];
  for (let i = 0; i < NP; i++) {
    const y = 1 - (i / (NP - 1)) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), th = i * 2.399963;
    PTS.push({ x: Math.cos(th) * r, y: y, z: Math.sin(th) * r, a: i % 4, ph: (i * 1.71) % 6.28, fl: i % 2 });
  }
  /* la Massa rodant (mateixa pintada que masa.js: nucli rotant + figures en superficie) */
  function drawMassa(cx, cy, R, rot, t) {
    ensureArt();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(8,6,4,.45)';
    ctx.beginPath(); ctx.ellipse(0, GYF - cy + 2, R * 0.95, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.filter = 'drop-shadow(0 0 4px rgba(20,10,8,.9))';
    if (okIm(CORE_IMG)) {
      ctx.rotate(rot * 0.6);
      ctx.drawImage(CORE_IMG, -R, -R, R * 2, R * 2);
      ctx.rotate(-rot * 0.6);
    } else {
      ctx.fillStyle = '#5a4a3a';
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
    }
    ctx.filter = 'none';
    const cr = Math.cos(rot * 0.8), sr = Math.sin(rot * 0.8);
    const order = [];
    for (let i = 0; i < NP; i++) {
      const p = PTS[i];
      const x3 = p.x * cr - p.z * sr, z3 = p.x * sr + p.z * cr;
      order.push({ i, x: x3, y: p.y, z: z3 });
    }
    order.sort((a, q) => a.z - q.z);
    for (const q of order) {
      const p = PTS[q.i], im = FIG[p.a];
      if (!okIm(im)) continue;
      const jit = Math.sin(t / 2.6 + p.ph) * 1.7;
      const px = q.x * (R - 4) + Math.sin(t / 3.1 + p.ph * 2) * 1.3;
      const py = q.y * (R - 4) + jit;
      const sc = (0.55 + 0.45 * (q.z * 0.5 + 0.5)) * (R / 62);
      const H = 26 * sc, W = H * im.naturalWidth / im.naturalHeight;
      ctx.save();
      ctx.translate(px, py);
      ctx.scale(p.fl ? -1 : 1, 1);
      ctx.rotate(Math.sin(t / 4 + p.ph) * 0.12);
      ctx.globalAlpha = 0.55 + 0.45 * (q.z * 0.5 + 0.5);
      ctx.filter = 'brightness(' + (0.75 + 0.35 * (q.z * 0.5 + 0.5)) + ')';
      ctx.drawImage(im, -W / 2, -H / 2, W, H);
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  /* l'explanada de la gran Font, enfosquida (POV del guerrer) */
  function drawEsplanade(t, dark) {
    const G = gardensImg();
    if (okIm(G)) ctx.drawImage(G, 0, 0, VW, VH);
    else { ctx.fillStyle = '#060a1c'; ctx.fillRect(0, 0, VW, VH); }
    const F = fountainImg();
    if (okIm(F)) {
      const FH = 130, FW = Math.round(FH * F.naturalWidth / F.naturalHeight);
      ctx.globalAlpha = 0.85;
      ctx.drawImage(F, VW / 2 - Math.round(FW / 2), GYF - FH, FW, FH);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(4,7,16,' + dark.toFixed(2) + ')';
    ctx.fillRect(0, 0, VW, VH);
    /* ombra del terra */
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.fillRect(0, GYF, VW, VH - GYF);
  }

  /* ------------------------------- escenes ------------------------------- */
  /* 1: surt de l'aigua; la ma s'aferra a la vora, degotes per la pantalla */
  function drawScene1(t) {
    drawEsplanade(t, 0.35);
    /* nivell d'aigua que baixa mentre s'enfila */
    const yw = 214 - seg(t, 0, 260) * 76;
    /* vora de pedra mullada */
    const rim = ctx.createLinearGradient(0, yw - 10, 0, yw + 2);
    rim.addColorStop(0, '#7a6f60'); rim.addColorStop(0.5, '#4e463c'); rim.addColorStop(1, '#2c2721');
    ctx.fillStyle = rim; ctx.fillRect(0, yw - 10, VW, 12);
    ctx.fillStyle = 'rgba(190,220,235,.25)'; ctx.fillRect(0, yw - 10, VW, 2);
    /* full d'aigua */
    ctx.fillStyle = 'rgba(10,40,64,.92)';
    ctx.beginPath();
    ctx.moveTo(0, yw + Math.sin(t * 0.1) * 2);
    for (let x = 0; x <= VW; x += 16) ctx.lineTo(x, yw + Math.sin(t * 0.1 + x * 0.06) * 2.4);
    ctx.lineTo(VW, VH); ctx.lineTo(0, VH); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 8; i++) {   // corrents brillants
      const xx = (i * 67 + t * 1.3) % VW;
      ctx.fillStyle = 'rgba(140,220,250,' + (0.12 + 0.18 * h2(i, t >> 4)).toFixed(2) + ')';
      ctx.fillRect(xx, yw + 8 + h2(i, 2) * (VH - yw - 16), 11, 1.5);
    }
    /* les mans s'aferren a la vora (retall de les mans del sprite pintat) */
    const im = WARRIOR_IMG.idle;
    if (okIm(im)) {
      const p = seg(t, 60, 170);
      const hy = (yw + 40) - p * 36;
      const sc = 2.8;
      ctx.save();
      ctx.translate(VW / 2, hy);
      ctx.drawImage(im, 45, 46, 40, 24, -20 * sc, 0, 40 * sc, 24 * sc);
      ctx.restore();
    }
    /* degotes que rellisquen per la "lent" */
    const dripA = 1 - seg(t, 120, 340);
    if (dripA > 0) {
      for (let i = 0; i < 7; i++) {
        const dx = 30 + i * 62 + h2(i, 7) * 30;
        const dy = (t * 2.6 + i * 71) % (VH + 30) - 15;
        ctx.fillStyle = 'rgba(180,225,245,' + (0.5 * dripA * (0.4 + h2(i, 3))).toFixed(2) + ')';
        ctx.fillRect(dx, dy, 1.4, 8 + h2(i, 5) * 12);
      }
    }
    caption('Després de travessar les aigües, el Panthokrator planta peus a terra davant la gran Font.', t, 30, 330);
  }

  /* 2: la terra tremola i el cel s'enfosqueix */
  function drawScene2(t) {
    const amp = seg(t, 380, 700) * 3;
    ctx.save();
    ctx.translate(Math.sin(t * 0.9) * amp, Math.cos(t * 1.3) * amp * 0.6);
    drawEsplanade(t, 0.3 + 0.32 * seg(t, 360, 720));
    /* pols i còdols que boten a terra */
    for (let i = 0; i < 14; i++) {
      const px = h2(i, 21) * VW, hop = Math.abs(Math.sin(t * 0.22 + i * 2.2)) * seg(t, 400, 700) * 7;
      ctx.fillStyle = 'rgba(150,138,120,' + (0.5 * seg(t, 400, 700)).toFixed(2) + ')';
      ctx.fillRect(px, GYF - 2 - hop, 2, 2);
    }
    ctx.restore();
    caption('La terra tremola. Alguna cosa terrible s\'acosta.', t, 390, 690);
  }

  /* 3: la Massa del Consum s'acosta rodant fins omplir la vista */
  function drawScene3(t) {
    const amp = 2.6;
    ctx.save();
    ctx.translate(Math.sin(t * 0.9) * amp, Math.cos(t * 1.3) * amp * 0.6);
    drawEsplanade(t, 0.55);
    const k = Math.pow(seg(t, 720, 1140), 1.25);
    const R = 8 + k * 165;
    const cx = VW / 2 + Math.sin(t * 0.045) * 34 * (1 - k);
    const cy = GYF - R * 0.62;
    drawMassa(cx, cy, R, t * 0.05, t);
    ctx.restore();
    /* pols vermell d'amenaca */
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.12);
    ctx.fillStyle = rad(VW / 2, VH / 2, VW * 0.6, [[0, 'rgba(120,20,16,0)'], [1, 'rgba(120,20,16,' + (0.22 + 0.2 * pulse * seg(t, 760, 1140)).toFixed(2) + ')']]);
    ctx.fillRect(0, 0, VW, VH);
    caption('Davant seu s\'alça la Massa del Consum, un monstre atroç fet del pitjor turisme de masses.', t, 750, 1110);
  }

  /* 4: alça l'espasa davant la mole i fon a negre */
  function drawScene4(t) {
    const amp = 2.2;
    ctx.save();
    ctx.translate(Math.sin(t * 0.9) * amp, Math.cos(t * 1.3) * amp * 0.6);
    drawEsplanade(t, 0.55);
    const R = 170 + seg(t, 1140, 1500) * 14;
    drawMassa(VW / 2, GYF - R * 0.62, R, t * 0.05, t);
    ctx.restore();
    /* el guerrer puja dins del quadre: cap i esquena sencers, amb l'espasa alçada (sprite pintat) */
    const im = WARRIOR_IMG.attack;
    if (okIm(im)) {
      const p = seg(t, 1140, 1300), e = 1 - Math.pow(1 - p, 3);
      const sc = 3.2, sw = 106, sh = 46;
      const sx = VW / 2 - 150 + Math.sin(t * 0.5) * 1.2;
      const sy = VH - BAR - sh * sc + 14 + (1 - e) * 120 + Math.cos(t * 0.7) * 1.0;
      ctx.drawImage(im, 14, 22, sw, sh, sx, sy, sw * sc, sh * sc);
    }
    caption('Pels savis, pels béns culturals, per la humanitat: l\'últim combat.', t, 1170, 1440);
    if (t > 1440) {
      ctx.fillStyle = 'rgba(0,0,0,' + seg(t, 1440, 1500).toFixed(2) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  function drawCineFinal() {
    const t = game.anim;
    ctx.clearRect(0, 0, VW, VH);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
    if (t < 360) drawScene1(t);
    else if (t < 720) drawScene2(t);
    else if (t < 1140) drawScene3(t);
    else drawScene4(t);
    bars(t);
    if (t < 30) {   // obre des de negre
      ctx.fillStyle = 'rgba(0,0,0,' + (1 - t / 30).toFixed(2) + ')';
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  /* ------------------------------- embolcalls ------------------------------- */
  const _stepF = step;
  step = function () {
    if (game.state === 'cinefinal') {
      game.frame++;
      if (dbgT !== null) { game.anim = dbgT; return; }
      game.anim++;
      if (game.anim >= DUR || (game.anim > 25 && (skipReq || freshPress()))) { endCine(); return; }
      prevIn = snapIn();
      return;
    }
    if (isTransitionPoint()) { game.frame++; startCine(); return; }
    _stepF.apply(null, arguments);
  };
  const _renderF = render;
  render = function () {
    if (game.state === 'cinefinal') { drawCineFinal(); return; }
    _renderF.apply(null, arguments);
  };
})();
