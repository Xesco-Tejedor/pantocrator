/* PANTHOKRATOR - melodia principal nova v2: andante maestoso (aprovada per Francesc, 7 nov 2026).
   Petició original: «melodía distinta, más majestuosa y épica (similar a la de la
   recreativa Black Tiger)»; després de sentir la v1: «imagino más andante».

   Composició ORIGINAL amb el caràcter de la recreativa Black Tiger (Capcom,
   1987) — to menor amb sensible, baix per octaves i arc melòdic heroic amb pic
   agut — sense copiar-ne la melodia ni cap fragment.

   v2 (andante): no és la v1 alentida, és una recomposició:
   - Tempo: tema principal 150 -> 100 BPM; títol 100 -> 84 BPM.
   - Baix: pols per negres amb octaves als temps forts (abans semicorxeres).
   - Melodia: frases llargues que respiren (14 notes en 4 compassos), amb
     clímax sostingut al LA agut (A5) sobre el dominant abans de la cadència.
   - Arpegi per corxeres (abans semicorxeres); percussió processional
     (bombo 1 i 3, caixa 2 i 4, accent final de cadència).

   Es carrega l'última; no modifica game.js, audio.js, etapas.js, masa.js,
   sage.js, festival.js ni cinematic.js. La resta de temes de festival.js
   (stage2, stage3, bosses, massa, win) es conserven tal qual. */
(function () {
  'use strict';
  window.__melodia = 2;

  if (typeof sfx !== 'undefined' && sfx.THEMES) {
    /* Pantalla de títol: exposició lenta i solemne (la menor, 84 BPM) */
    sfx.THEMES.title = { bpm: 84, legato: 6.5,
      bass: [0, null, null, null, null, null, null, null, 0, null, null, null, 12, null, null, null,
             -5, null, null, null, null, null, null, null, -5, null, null, null, 7, null, null, null],
      mel:  [24, null, null, null, null, null, 26, null, 27, null, null, null, null, null, null, null,
             24, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
      harm: [12, null, null, null, null, null, null, null, 12, null, null, null, null, null, null, null,
             7, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
      arp:  [24, null, 27, null, 31, null, 27, null, 24, null, 27, null, 31, null, 27, null,
             19, null, 23, null, 26, null, 23, null, 19, null, 23, null, 26, null, 23, null],
      perc: [1, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 2, 0, 0, 0,
             1, 0, 0, 0, 0, 0, 2, 0, 1, 0, 0, 0, 2, 0, 0, 0] };

    /* Tema principal (etapa 1 MNAC): andante maestoso (100 BPM, la menor).
       Harmonia Am | F | G | E; melodia àmplia: A-B-C-E, D-C-A, D-E-G-F,
       E-G#-A (pic sostingut) i tornada. */
    sfx.THEMES.stage = { bpm: 100, legato: 6.5,
      bass: [0, null, null, null, 12, null, null, null, 0, null, null, null, 12, null, 12, null,
             -4, null, null, null, 8, null, null, null, -4, null, null, null, 8, null, 8, null,
             -2, null, null, null, 10, null, null, null, -2, null, null, null, 10, null, 10, null,
             -5, null, null, null, 7, null, null, null, -5, null, null, null, 7, null, 7, null],
      mel:  [24, null, null, null, null, null, 26, null, 27, null, null, null, 31, null, null, null,
             29, null, null, null, null, null, 27, null, 24, null, null, null, null, null, null, null,
             29, null, null, null, 31, null, null, null, 34, null, null, null, null, null, 32, null,
             31, null, null, null, 35, null, null, null, 36, null, null, null, null, null, null, null],
      harm: [12, null, null, null, 12, null, null, null, 12, null, null, null, 12, null, null, null,
             8, null, null, null, 8, null, null, null, 8, null, null, null, 8, null, null, null,
             10, null, null, null, 10, null, null, null, 10, null, null, null, 10, null, null, null,
             7, null, null, null, 7, null, null, null, 7, null, null, null, 7, null, null, null],
      arp:  [24, null, 27, null, 31, null, 27, null, 24, null, 27, null, 31, null, 27, null,
             20, null, 24, null, 29, null, 24, null, 20, null, 24, null, 29, null, 24, null,
             22, null, 26, null, 31, null, 26, null, 22, null, 26, null, 31, null, 26, null,
             19, null, 23, null, 26, null, 23, null, 19, null, 23, null, 26, null, 23, null],
      perc: [1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 0,
             1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 0,
             1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 0,
             1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 5, 0, 6, 0] };
  }

  /* rètol de versió discret a la pantalla de títol (ajuda a distingir càrregues noves) */
  if (typeof drawTitle === 'function') {
    const _drawTitleM = drawTitle;
    drawTitle = function () {
      _drawTitleM();
      if (typeof drawText === 'function') {
        drawText('v.07-11b', VW - 5, VH - 6, '#6f6a8c', 5, 'right');
      }
    };
  }
})();
