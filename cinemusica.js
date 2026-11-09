/* PANTHOKRATOR - musica epica de la cinematica previa a LA MASSA DEL CONSUM.
   Peticio de Francesc (9 nov 2026): «falta musica epica en esa cinematica».
   Composicio ORIGINAL, mateix caracter andante i epic que la primera etapa (la menor,
   76 BPM): 8 compassos (~25 s, igual que la cinematica) amb creixement cap al
   cim del compas 7, que coincideix amb el flaix de l'escena 4 (t=1140).
   Truons de recreativa a l'inici de l'escena 2 i del flaix. Reutilitza les veus de
   audio.js. Es carrega l'ultima: no toca cap altre fitxer. En sortir de la cinematica
   el motor arrenca la musica de cap (playMusic atura el tema anterior: sense superposicio). */
(function () {
  'use strict';
  if (typeof sfx === 'undefined' || !sfx.THEMES) return;
  window.__cinemusica = 1;
  const N = null;
  const bars = [
    /* 1 Am */ { r: 0,  p: 12, arp: [24, 27, 31, 27], m: { 0: 24, 6: 26, 8: 27, 12: 31 } },
    /* 2 F  */ { r: -4, p: 8,  arp: [20, 24, 27, 24], m: { 0: 32, 6: 31, 8: 27, 12: 24 } },
    /* 3 G  */ { r: -2, p: 10, arp: [22, 26, 29, 26], m: { 0: 34, 6: 29, 8: 31, 12: 34 } },
    /* 4 E  */ { r: -5, p: 7,  arp: [19, 23, 26, 23], m: { 0: 35, 6: 31, 8: 32, 12: 35 } },
    /* 5 Dm */ { r: -7, p: 5,  arp: [17, 20, 24, 20], m: { 0: 29, 4: 32, 8: 36, 12: 34 } },
    /* 6 E  */ { r: -5, p: 7,  arp: [19, 23, 26, 23], m: { 0: 35, 4: 38, 8: 39, 10: 38, 12: 35 } },
    /* 7 Am */ { r: 0,  p: 12, arp: [24, 27, 31, 36], m: { 0: 36, 8: 39, 10: 38, 12: 36 }, hot: 1 },
    /* 8 F-G-E */ { r: -4, p: 8, arp: [20, 24, 27, 24], m: { 0: 36, 8: 34, 12: 35 }, last: 1 }
  ];
  const th = { bpm: 76, legato: 6.5, bass: [], mel: [], harm: [], arp: [], perc: [] };
  bars.forEach(function (b, bi) {
    for (let s = 0; s < 16; s++) {
      let bs = N;
      if (b.hot) bs = (s % 2 === 0) ? (s % 4 === 0 ? b.r : b.r + 12) : N;
      else if (s === 0 || s === 8) bs = b.r;
      else if (s === 4 || s === 12 || s === 14) bs = b.r + 12;
      if (b.last) { const rr = s < 8 ? -4 : s < 12 ? -2 : -5; if (bs !== N) bs = rr + (s % 8 === 0 ? 0 : 12); else if (s === 8 || s === 12) bs = rr; }
      th.bass.push(bs);
      th.mel.push(b.m[s] !== undefined ? b.m[s] : N);
      th.harm.push(s % 4 === 0 ? (b.hot ? b.p + 12 : b.p) : N);
      th.arp.push(s % 2 === 0 ? b.arp[(s >> 1) % 4] : N);
      let p = 0;
      if (b.hot) p = s % 4 === 0 ? 3 : (s % 4 === 2 ? 2 : 0);
      else if (s === 0 || s === 8) p = 1;
      else if (s === 4 || s === 12) p = 4;
      else if (s % 4 === 2) p = 2;
      if (bi === 0 && s < 8) p = (s === 0) ? 1 : 0;           /* obertura: nomes bombo */
      if (bi === 5 && s >= 8) p = (s % 2 === 0) ? 5 : 4;       /* redoble de caixa cap al cim */
      if (bi === 6 && s === 0) p = 7;                           /* impacte del cim */
      if (bi === 7 && s === 14) p = 6;
      th.perc.push(p);
    }
  });
  sfx.THEMES.cinefinal = th;

  function thunder(big) {
    if (!sfx.ctx || sfx.muted) return;
    const t = sfx.now() + 0.02;
    sfx.noise(t, big ? 1.6 : 1.1, big ? 0.5 : 0.32, { type: 'lowpass', freq: big ? 2600 : 900, slideTo: 90 });
    sfx.fm(55, t, big ? 1.3 : 1.0, big ? 0.5 : 0.3, { ratio: 0.5, index: 2, modDecay: 0.5, slide: -25 });
    if (big) sfx.noise(t, 0.2, 0.3, { type: 'highpass', freq: 3000 });
  }

  const _step = step;
  let lastT = -1;
  step = function () {
    const was = game.state === 'cinefinal';
    _step.apply(null, arguments);
    if (game.state === 'cinefinal') {
      const t = game.anim;
      if (!was || (t <= 3 && sfx.track !== 'cinefinal' && lastT > 3) || (t <= 3 && lastT < 0)) {
        if (sfx.track !== 'cinefinal') sfx.playMusic('cinefinal');
      }
      if (lastT < 360 && t >= 360 && t < 370) thunder(false);
      if (lastT < 1138 && t >= 1138 && t < 1148) thunder(true);
      lastT = t;
    } else {
      if (was && sfx.track === 'cinefinal') sfx.stopMusic();
      lastT = -1;
    }
  };
})();
