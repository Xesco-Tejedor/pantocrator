/* PANTHOKRATOR - cinemàtica de transició Font Màgica -> Aigües subterrànies (v1).
   En vèncer el Gos Zombi (final de la 2a gran etapa, davant la gran Font),
   una seqüència cinematogràfica mostra el protagonista entrant en un túnel
   de la gran font que condueix a la part aquàtica subterrània de la 3a etapa.

   Es carrega l'última; no modifica game.js, audio.js, etapas.js, masa.js,
   sage.js ni festival.js: embolcalla step() i render() i afegeix l'estat
   'cinema' entre el 'stageclear' del Gos i la targeta de la fase 6.
   Es pot saltar amb una pulsació nova d'ATACAR/SALTAR o qualsevol direcció. */
(function () {
  'use strict';
  window.__cinematic = 1;

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
    if (t > 20 && freshPress()) { endCinema(); return; }   // saltable
    prevIn = snapIn();
    /* el tema aquàtic comença quan el guerrer entra al túnel */
    if (t === 280 && sfx.playMusic && sfx.track !== 'stage3') sfx.playMusic('stage3');
  }

  /* ------------------------------ helpers de pintada ------------------------------ */
  function vg(y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    return g;
  }
  function rad(x, y, r, stops) {
    const g = ctx.createRadialGradient(x, y, 1, x, y, r);
    for (const s of stops) g.addColorStop(s[0], s[1]);
    return g;
  }
  function h2(a, b) { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); }
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

  /* --------------------------- escena exterior: la gran Font --------------------------- */
  const FOUNT_X = 322;            // centre de la gran Font a la plaça
  const PLAZA_Y = 208;            // nivell del terra de l'explanada

  function drawNightSky(t) {
    ctx.fillStyle = vg(0, 190, [[0, '#0a0f22'], [0.62, '#23203e'], [1, '#41304c']]);
    ctx.fillRect(0, 0, VW, 190);
    for (let i = 0; i < 46; i++) {   // estrelles amb parpelleig
      const x = h2(i, 3) * VW, y = h2(i, 7) * 108;
      const tw = 0.35 + 0.6 * Math.abs(Math.sin(t * 0.02 + i * 1.7));
      ctx.fillStyle = 'rgba(232,236,255,' + (tw * 0.8).toFixed(2) + ')';
      ctx.fillRect(x, y, 1.4, 1.4);
    }
    /* silueta del palau de Montjuïc al fons */
    ctx.fillStyle = '#0d0e1e';
    ctx.fillRect(30, 78, 180, 44);
    ctx.fillRect(52, 62, 26, 20); ctx.fillRect(162, 62, 26, 20);   // torres
    ctx.beginPath(); ctx.arc(120, 78, 22, Math.PI, 0); ctx.fill(); // cúpula
    ctx.fillStyle = '#151632';
    for (let i = 0; i < 9; i++) ctx.fillRect(40 + i * 19, 88, 5, 26); // columnes il·luminades tènues
  }

  function drawCascadeTier(cx, topY, w, t) {
    /* graons de la cascada que baixa de la muntanya */
    ctx.fillStyle = '#38302c';
    ctx.fillRect(cx - w / 2, topY, w, 8);
    ctx.fillStyle = '#4a4038';
    ctx.fillRect(cx - w / 2, topY, w, 2.5);
    const n = Math.floor(w / 7);
    for (let i = 0; i < n; i++) {   // fils d'aigua caient pel graó
      const x = cx - w / 2 + 3 + i * 7 + Math.sin(t * 0.11 + i * 2.3) * 1.2;
      ctx.fillStyle = 'rgba(150,220,245,' + (0.35 + 0.3 * h2(i, t >> 3)).toFixed(2) + ')';
      ctx.fillRect(x, topY + 8, 2.2, 14);
    }
    ctx.fillStyle = 'rgba(220,245,255,.55)';
    for (let i = 0; i < n; i += 2) ctx.fillRect(cx - w / 2 + 2 + i * 7, topY + 20 + h2(i, 5) * 2, 3, 1.6);
  }

  function drawMainJet(cx, baseY, t, open) {
    /* gran raig central: s'aprima i s'eixampla quan s'obre el túnel */
    const hJet = 118, wob = Math.sin(t * 0.09) * 2.2;
    const lw = open ? 4 : 13;       // s'apaga una mica en obrir-se el pas
    ctx.fillStyle = 'rgba(170,230,250,.75)';
    ctx.fillRect(cx - lw / 2 + wob * 0.4, baseY - hJet, lw, hJet);
    ctx.fillStyle = 'rgba(240,252,255,.85)';
    ctx.fillRect(cx - lw / 4 + wob * 0.5, baseY - hJet + 6, lw / 2, hJet - 12);
    for (let i = 0; i < 14; i++) {  // espurnes del cim del raig
      const a = i * 0.9 + t * 0.06, r = 4 + h2(i, 9) * 14 + 5 * Math.sin(t * 0.13 + i);
      ctx.fillStyle = 'rgba(225,248,255,' + (0.7 - i * 0.04).toFixed(2) + ')';
      ctx.fillRect(cx + Math.cos(a) * r, baseY - hJet + Math.sin(a) * r * 0.42 - 3, 1.8, 1.8);
    }
    /* escuma a la base */
    for (let i = 0; i < 10; i++) {
      const fx = cx - 20 + i * 4.4 + Math.sin(t * 0.2 + i * 3.1) * 2;
      ctx.fillStyle = 'rgba(215,242,252,' + (0.3 + 0.35 * h2(i, t >> 4)).toFixed(2) + ')';
      ctx.fillRect(fx, baseY - 3 + h2(i, 6) * 2.4, 3.4, 2.2);
    }
  }

  function drawSideArcs(cx, baseY, t) {
    /* arcs parabòlics laterals de la font */
    for (let s = -1; s <= 1; s += 2) {
      for (let k = 1; k <= 2; k++) {
        const R = 34 * k, hgt = 34 + 12 * k;
        for (let i = 0; i <= 16; i++) {
          const p = i / 16, off = (t * 0.045 + h2(k, s + 2)) % 1;
          const pp = (p + off) % 1;
          const x = cx + s * pp * R;
          const y = baseY - 6 - Math.sin(pp * Math.PI) * hgt;
          ctx.fillStyle = 'rgba(160,225,248,' + (0.62 - pp * 0.3).toFixed(2) + ')';
          ctx.fillRect(x, y, 2, 2.6);
        }
      }
    }
  }

  function drawBasin(cx, baseY, t) {
    ctx.fillStyle = '#2c2622'; ctx.fillRect(cx - 88, baseY, 176, 7);       // vora del bassal
    ctx.fillStyle = '#453b32'; ctx.fillRect(cx - 88, baseY, 176, 2);
    ctx.fillStyle = vg(baseY, baseY + 26, [[0, '#17384a'], [1, '#0a1e2c']]);
    ctx.fillRect(cx - 84, baseY + 7, 168, 19);                             // aigua del bassal
    for (let i = 0; i < 12; i++) {                                         // brillantors
      const x = cx - 80 + ((i * 37 + t * 0.7) % 160);
      ctx.fillStyle = 'rgba(150,225,250,' + (0.14 + 0.2 * h2(i, t >> 5)).toFixed(2) + ')';
      ctx.fillRect(x, baseY + 9 + h2(i, 4) * 14, 7, 1.4);
    }
  }

  /* boca del túnel a l'estructura central: tancada per una cortina d'aigua que s'obre */
  function drawTunnelMouth(cx, baseY, t, open) {
    const W = 30, H = 40, x = cx - W / 2, y = baseY - H;
    /* pòrtic de pedra */
    ctx.fillStyle = '#4e4338';
    ctx.fillRect(x - 5, y - 5, W + 10, H + 5);
    ctx.fillStyle = '#685a48';
    ctx.fillRect(x - 5, y - 5, W + 10, 3); ctx.fillRect(x - 5, y - 5, 3, H + 5); ctx.fillRect(x + W + 2, y - 5, 3, H + 5);
    if (open > 0) {
      /* interior fosc amb resplendor blau que creix */
      ctx.fillStyle = '#04101c';
      ctx.beginPath();
      ctx.moveTo(x, y + H); ctx.lineTo(x, y + 12); ctx.arc(cx, y + 12, W / 2, Math.PI, 0); ctx.lineTo(x + W, y + H);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = rad(cx, y + H - 8, 26, [[0, 'rgba(90,205,245,' + (0.5 * open).toFixed(2) + ')'], [1, 'rgba(90,205,245,0)']]);
      ctx.fillRect(x - 6, y - 6, W + 12, H + 6);
      for (let i = 0; i < 4; i++) {   // bombolles que pugen per la boca
        const bt = (t * 0.5 + i * 23) % 40;
        ctx.fillStyle = 'rgba(190,240,255,' + (0.6 * open * (1 - bt / 40)).toFixed(2) + ')';
        ctx.fillRect(cx - 9 + i * 6 + Math.sin(t * 0.1 + i), y + H - bt, 1.8, 1.8);
      }
    }
    if (open < 1) {
      /* cortina d'aigua que cobreix la boca; s'obre en dues fulles */
      const half = (W / 2) * (1 - open);
      for (let s = 0; s < 2; s++) {
        const x0 = s === 0 ? cx - W / 2 : cx + W / 2 - half;
        for (let i = 0; i < half; i += 3) {
          const xx = x0 + i + Math.sin(t * 0.16 + i) * 0.8;
          ctx.fillStyle = 'rgba(165,225,248,.8)';
          ctx.fillRect(xx, y + ((i * 5 + t * 2.2) % 6) - 6, 2, H + 8);
        }
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
    drawNightSky(t);
    /* muntanya i cascades que baixen cap a la Font */
    ctx.fillStyle = '#141322';
    ctx.beginPath(); ctx.moveTo(0, 190); ctx.lineTo(90, 128); ctx.lineTo(210, 122); ctx.lineTo(300, 150); ctx.lineTo(VW, 168); ctx.lineTo(VW, 190); ctx.closePath(); ctx.fill();
    drawCascadeTier(150, 132, 120, t);
    drawCascadeTier(200, 156, 160, t + 40);
    /* plaça */
    ctx.fillStyle = vg(190, VH, [[0, '#241d26'], [1, '#0d0a12']]);
    ctx.fillRect(0, 190, VW, VH - 190);
    for (let i = 0; i < 9; i++) {   // reflexos d'aigua sobre la pedra
      ctx.fillStyle = 'rgba(120,200,235,' + (0.05 + 0.07 * h2(i, t >> 6)).toFixed(2) + ')';
      ctx.fillRect(60 + i * 44 + Math.sin(t * 0.05 + i) * 3, 214 + h2(i, 8) * 40, 16, 1.4);
    }
    /* estructura central i jocs d'aigua */
    ctx.fillStyle = '#3c332c';
    ctx.fillRect(FOUNT_X - 26, PLAZA_Y - 34, 52, 34);                     // pedestal
    ctx.fillStyle = '#52463a';
    ctx.fillRect(FOUNT_X - 26, PLAZA_Y - 34, 52, 3);
    drawMainJet(FOUNT_X, PLAZA_Y - 34, t, open > 0.5);
    drawSideArcs(FOUNT_X, PLAZA_Y - 6, t);
    drawBasin(FOUNT_X, PLAZA_Y, t);
    drawTunnelMouth(FOUNT_X - 2, PLAZA_Y + 2, t, open);
    /* el guerrer */
    if (heroSt) hero(heroX, heroFeet, heroSt, t);
    /* llum màgica ambient */
    ctx.fillStyle = rad(FOUNT_X, PLAZA_Y - 40, 120, [[0, 'rgba(120,210,245,.10)'], [1, 'rgba(120,210,245,0)']]);
    ctx.fillRect(FOUNT_X - 120, PLAZA_Y - 160, 240, 190);
  }

  /* --------------------------- escena interior: el túnel --------------------------- */
  const TUN_CX = 300;             // centre del fons del túnel (punt de fuga)

  function drawTunnel(t, heroX, heroFeet, heroSt) {
    ctx.fillStyle = '#04060c';
    ctx.fillRect(0, 0, VW, VH);
    /* resplendor blau al fons: la part aquàtica */
    const pulse = 0.75 + 0.25 * Math.sin(t * 0.06);
    ctx.fillStyle = rad(TUN_CX + 90, 170, 130, [[0, 'rgba(60,170,225,' + (0.34 * pulse).toFixed(2) + ')'], [1, 'rgba(60,170,225,0)']]);
    ctx.fillRect(0, 0, VW, VH);
    /* arcs concèntrics cap al fons */
    for (let i = 6; i >= 0; i--) {
      const s = 1 - i * 0.125;
      const w = 460 * s, h = 190 * s;
      const cx = TUN_CX + (1 - s) * 90, baseY = 216 - (1 - s) * 26;
      const r_ = Math.round(90 - i * 9), g_ = Math.round(76 - i * 6), b_ = Math.round(58 - i * 3);
      ctx.strokeStyle = 'rgb(' + Math.max(18, r_) + ',' + Math.max(22, g_) + ',' + Math.max(30, b_) + ')';
      ctx.lineWidth = 7 * s + 1;
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, baseY);
      ctx.lineTo(cx - w / 2, baseY - h * 0.55);
      ctx.arc(cx, baseY - h * 0.55, w / 2, Math.PI, 0);
      ctx.lineTo(cx + w / 2, baseY);
      ctx.stroke();
    }
    /* entrada enrere: llum càlida de la Font a l'esquerra */
    ctx.fillStyle = rad(16, 200, 110, [[0, 'rgba(216,162,58,.20)'], [1, 'rgba(216,162,58,0)']]);
    ctx.fillRect(0, 60, 200, VH - 60);
    /* terra del túnel */
    ctx.fillStyle = vg(200, VH, [[0, '#1c1a18'], [1, '#08080c']]);
    ctx.beginPath(); ctx.moveTo(0, 216); ctx.lineTo(VW, 206); ctx.lineTo(VW, VH); ctx.lineTo(0, VH); ctx.closePath(); ctx.fill();
    /* graons que davallen cap a l'aigua */
    ctx.strokeStyle = 'rgba(120,104,84,.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const gy = 200 + i * 7.5, gx = 120 + i * 46;
      ctx.beginPath(); ctx.moveTo(gx - 60, gy); ctx.lineTo(gx + 120, gy - 2); ctx.stroke();
    }
    /* canal d'aigua que duu a les profunditats */
    ctx.fillStyle = vg(214, VH, [[0, '#1b4a62'], [1, '#0a2438']]);
    ctx.beginPath();
    ctx.moveTo(TUN_CX + 40, 210); ctx.lineTo(VW, 216); ctx.lineTo(VW, VH); ctx.lineTo(TUN_CX + 96, VH);
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 9; i++) {   // corrents brillants
      const xx = TUN_CX + 52 + ((i * 29 + t * 1.1) % 130);
      ctx.fillStyle = 'rgba(140,220,250,' + (0.18 + 0.22 * h2(i, t >> 4)).toFixed(2) + ')';
      ctx.fillRect(xx, 216 + h2(i, 2) * 40, 9, 1.5);
    }
    for (let i = 0; i < 10; i++) {  // bombolles
      const bt = (t * 0.8 + i * 31) % 90;
      ctx.fillStyle = 'rgba(190,240,255,' + (0.55 * (1 - bt / 90)).toFixed(2) + ')';
      ctx.fillRect(TUN_CX + 60 + h2(i, 11) * 90 + Math.sin(t * 0.08 + i * 2) * 2.5, 250 - bt * 0.5, 1.8, 1.8);
    }
    for (let i = 0; i < 3; i++) {   // degotes del sostre
      const dt = (t * 1.4 + i * 67) % 80;
      ctx.fillStyle = 'rgba(200,235,250,' + (0.7 - dt * 0.008).toFixed(2) + ')';
      ctx.fillRect(90 + i * 130, 66 + dt * 1.7, 1.2, 4);
    }
    if (heroSt) hero(heroX, heroFeet, heroSt, t);
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
      else              { heroX = 170 + (t - 150) * 0.62; heroSt = 'run'; } // s'hi apropa
      if (heroX > 252) { heroX = 252; heroSt = 'idle'; }
      const open = t < 150 ? 0 : Math.min(1, (t - 150) / 85);             // la cortina s'obre
      drawExterior(t, heroX, PLAZA_Y - 2, heroSt, open);
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
      const heroX = Math.min(300, 96 + k * 1.55);
      const heroFeet = Math.min(224, 190 + k * 0.26);
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
        const hx = 300 + p * 74;
        const hy = 224 - Math.sin(p * Math.PI) * 46 + p * 14;
        hero(hx, hy, 'dive', t);
      } else {        // esquitxada i espiral d'espurnes
        const sp = k - 26;
        for (let i = 0; i < 16; i++) {
          const a = i * 0.7, r = 4 + sp * 2.6 + h2(i, 3) * 8;
          ctx.fillStyle = 'rgba(215,245,255,' + Math.max(0, 0.85 - sp * 0.045).toFixed(2) + ')';
          ctx.fillRect(374 + Math.cos(a) * r, 236 - Math.abs(Math.sin(a)) * r * 0.6 + sp * 1.1, 2, 2);
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
