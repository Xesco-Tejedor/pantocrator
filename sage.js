/* PANTHOKRATOR - savis pintats (v1): figures realistes com la resta de
   personatges i celebració d'alliberament (brincos d'alegria amb els braços
   amunt). Petició de Francesc (6 nov 2026).
   Es carrega després de masa.js; substitueix el drawSage vectorial de game.js
   per sprites pintats (mateixa tècnica d'overlay que arcade/etapas/masa).
   No modifica game.js: la lògica d'alliberament, botiga i anim queda intacta. */
(function () {
  'use strict';
  window.__sage = 1;

  const SAGE_IMG = {};
  const A = window.PANTO_ART5 || {};
  for (const k in A) { const im = new Image(); im.src = A[k]; SAGE_IMG[k] = im; }

  const DH = 62;                 // alçada de dibuix (hitbox 30, com el guerrer: art > caixa)
  const CELEB = 132;             // frames de celebració: dos brincos (~2,2 s)
  const HOP = 66;                // durada d'un brinco
  const HOP_H = 24;              // alçada del brinco en px de joc

  function spr(im, x, feetY) {
    const w = DH * im.width / im.height;
    ctx.drawImage(im, Math.round(x - w / 2), Math.round(feetY - DH), Math.round(w), DH);
  }
  function ok(im) { return im && im.complete && im.naturalWidth; }

  const _drawSage = window.drawSage;
  window.drawSage = function (sg) {
    // fins que l'art no ha carregat, manté el vectorial original
    if (!ok(SAGE_IMG.idle) || !ok(SAGE_IMG.joy) || !ok(SAGE_IMG.stone)) { _drawSage(sg); return; }
    const x = sg.x, y = sg.y;

    if (!sg.freed) {
      // pedestal de pedra (com abans)
      ctx.fillStyle = '#14100c'; ctx.fillRect(x - 9, y - 4, 18, 4);
      ctx.fillStyle = lgrad(x, y - 4, x, y, '#6b6560', '#3e3a36'); ctx.fillRect(x - 8, y - 4, 16, 4);
      // estàtua petrificada: el mateix savi pintat en pedra grisa
      spr(SAGE_IMG.stone, x, y - 3);
      return;
    }

    const anim = sg.anim;
    // resplendor càlid (com abans)
    ctx.fillStyle = rgrad(x, y - 24, 22, 'rgba(242,215,138,.25)', 'rgba(242,215,138,0)');
    ctx.fillRect(x - 22, y - 52, 44, 52);

    if (anim < CELEB) {
      // celebració: dos brincos d'alegria amb els braços amunt
      const t = (anim % HOP) / HOP;
      const yOff = -HOP_H * Math.sin(Math.PI * t);
      spr(SAGE_IMG.joy, x, y + yOff);
      // espurnes daurades en cada enlairament
      if (anim % HOP < 14) {
        ctx.fillStyle = 'rgba(255,233,168,' + (0.5 - (anim % HOP) * 0.03) + ')';
        ctx.fillRect(x - 14 + (anim * 7 % 6), y - 34 + yOff, 2, 2);
        ctx.fillRect(x + 12 - (anim * 5 % 5), y - 28 + yOff, 2, 2);
      }
    } else {
      // repos: respiració suaument (com el bob original)
      const bob = Math.sin(anim * 0.05) * 1.2;
      spr(SAGE_IMG.idle, x, y + bob);
    }

    // rètol de botiga (lògica original)
    const near = Math.abs(player.x + player.w / 2 - x) < 60;
    if (near && !player.dead) drawText('BOTIGA: PUJA ↑', x, y - 70, '#ffe9a8', 7, 'center');
  };

  // esclat d'espurnes just en alliberar-se (updateSages de game.js porta l'anim)
  const _updateSages = window.updateSages;
  window.updateSages = function () {
    for (const sg of world.sages) {
      if (sg.freed && sg.anim === 0) {
        spawnParts(sg.x - 6, sg.y - 26, '#ffe9a8', 8);
        spawnParts(sg.x + 6, sg.y - 20, '#f2d78a', 8);
      }
    }
    _updateSages();
  };
})();
