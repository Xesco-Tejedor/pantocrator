/* PANTHOKRATOR - melodia principal nova: més majestuosa i èpica (v1).
   Petició de Francesc (7 nov 2026): «quiero que la melodía sea distinta,
   más majestuosa y épica (similar a la de la recreativa Black Tiger)».

   Composició ORIGINAL amb el caràcter de la recreativa Black Tiger (Capcom,
   1987) — baix incansable per semicorxeres amb octaves i melodia heroica àmplia
   en to menor — sense copiar-ne la melodia ni cap fragment.

   Es carrega l'última; no modifica game.js, audio.js, etapas.js, masa.js,
   sage.js, festival.js ni cinematic.js:
   - Substitueix els temes 'title' i 'stage' (la melodia principal del joc)
     per una marxa heroica nova: frase àmplia amb corxeres amb puntet, salts
     d'octava, pic majestuós agut i cadència èpica sobre el dominant.
   - La resta de temes de festival.js (stage2, stage3, bosses, massa, win)
     es conserven tal qual: la varietat entre fases no es perd.
   - Afegeix un petit rètol de versió a la pantalla de títol perquè es pugui
     veure a simple vista quina versió del joc s'ha carregat. */
(function () {
  'use strict';
  window.__melodia = 1;

  if (typeof sfx !== 'undefined' && sfx.THEMES) {
    /* Pantalla de títol: exposició lenta i solemne de la melodia nova (la menor) */
    sfx.THEMES.title = { bpm: 100,
      bass: [0, null, null, null, 0, null, 12, null, -4, null, null, null, -4, null, 8, null,
             -2, null, null, null, -2, null, 10, null, -5, null, 7, null, 11, null, 7, null],
      mel:  [24, null, null, null, 26, null, 27, null, null, null, null, null, 29, null, 31, null,
             29, null, 27, null, 26, null, null, null, 23, null, 26, null, 24, null, null, null],
      harm: [12, null, null, null, null, null, null, null, 8, null, null, null, null, null, null, null,
             10, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
      arp:  [36, null, 39, null, 43, null, 39, null, 32, null, 36, null, 39, null, 36, null,
             34, null, 38, null, 41, null, 38, null, 31, null, 35, null, 38, null, 40, null],
      perc: [1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4, 0, 2, 0,
             1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 2, 4, 0, 2, 6] };

    /* Tema principal (etapa 1 MNAC): marxa heroica èpica.
       Baix per semicorxeres amb octaves (Am F G Am | Am F Dm E) i melodia
       àmplia: ascens A-B-C, arc D-E, pic agut A5 i cadència al dominant. */
    sfx.THEMES.stage = { bpm: 150, legato: 2.0,
      bass: [0, 12, 0, 12, 0, 12, 0, 12, -4, 8, -4, 8, -4, 8, -4, 8,
             -2, 10, -2, 10, -2, 10, -2, 10, 0, 12, 0, 12, 0, 12, 7, 12,
             0, 12, 0, 12, 0, 12, 0, 12, -4, 8, -4, 8, -4, 8, -4, 8,
             -7, 5, -7, 5, -7, 5, -7, 5, -5, 7, -5, 7, -5, 7, 11, 7],
      mel:  [24, null, null, 26, 27, null, null, null, 29, null, 31, null, 29, 27, 26, null,
             27, null, null, 29, 31, null, null, null, 34, null, 33, null, 31, 29, 27, null,
             31, null, null, 29, 27, null, null, null, 26, null, 24, null, 23, null, 26, null,
             27, null, null, 31, 36, null, null, null, null, null, 34, null, 33, null, 31, null],
      harm: [12, null, null, null, null, null, null, null, 8, null, null, null, null, null, null, null,
             10, null, null, null, null, null, null, null, 12, null, null, null, null, null, null, null,
             12, null, null, null, null, null, null, null, 8, null, null, null, null, null, null, null,
             5, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
      arp:  [36, 39, 43, 39, 36, 39, 43, 39, 32, 36, 39, 36, 32, 36, 39, 36,
             34, 38, 41, 38, 34, 38, 41, 38, 36, 39, 43, 39, 36, 39, 43, 41,
             36, 39, 43, 39, 36, 39, 43, 39, 32, 36, 39, 36, 32, 36, 39, 36,
             29, 32, 36, 32, 29, 32, 36, 32, 31, 35, 38, 35, 31, 35, 38, 40],
      perc: [1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 2,
             1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 2,
             1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 2,
             1, 0, 2, 0, 4, 0, 2, 0, 1, 2, 1, 2, 4, 2, 4, 6] };
  }

  /* rètol de versió discret a la pantalla de títol (ajuda a distingir càrregues noves) */
  if (typeof drawTitle === 'function') {
    const _drawTitleM = drawTitle;
    drawTitle = function () {
      _drawTitleM();
      if (typeof drawText === 'function') {
        drawText('v.07-11', VW - 5, VH - 6, '#6f6a8c', 5, 'right');
      }
    };
  }
})();
