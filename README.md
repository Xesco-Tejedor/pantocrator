# PANTOCRÀTOR

Arcade d'acció i plataformes 2D a les ruïnes postapocalíptiques del MNAC (Museu Nacional d'Art de Catalunya). Homenatge jugable a la placa arcade de 1987: pixel art estricte, baixa resolució i desplaçament lateral.

**▶ Demo en línia:** https://xesco-tejedor.github.io/pantocrator/

Funciona al navegador (mòbil i escriptori), sense instal·lació. Al mòbil, millor en horitzontal.

## Com es juga

- **Mou:** cruceta virtual octodireccional (zona morta de 30 px) o fletxes/WASD.
- **Saltar:** botó SALTAR o espai/Z. Amb *coyote time*: pots saltar uns mil·lisegons després de deixar la vora.
- **Atacar:** botó ATACAR o X/J.
- **Atac descendent:** diagonal avall + atacar mentre caus; l'animació queda fixada fins a colpejar o tocar terra.
- **Làmpares de aranya:** salta a prop d'una làmpara i t'hi enganxaràs automàticament (ancoratge magnètic de 48 px); balanceja't amb esquerra/dreta i salta per enlairar-te.
- **Fosos:** no hi ha mort instantània. Caure des de zones altes et porta a rutes inferiors amb dany lleu i més enemics terrestres; hauràs de tornar a pujar.
- **Vitrines gòtiques:** trenca-les per aconseguir espasa llarga, armadura o escut.
- **Enemics:** bèsties dels capitells romànics, dimonis dels frescos de Sant Climent de Taüll i, al final, el Pantocràtor: dispara projectils de llum des del fons cap al pla d'acció. **Desvia els orbes amb l'espasa** per fer-li mal i esquiva el pilar de llum telegrafia't.
- **M:** silencia la música.

## Fases

1. Vestíbul en ruïnes
2. Sala romànica
3. El Pantocràtor (arena de cap)

## Tècnica

- Tres fitxers separats: `index.html`, `styles.css`, `game.js`.
- Canvas intern de 480×270 amb escalat enter i `image-rendering: pixelated`.
- Sprites definits píxel a píxel al codi; fons amb paral·laxi de tres capes; sense cap asset de tercers.
- Música i efectes xip sintetitzats amb WebAudio (temes de títol, fase i cap).
- HUD: vida, temporitzador, puntuació, fase i arma en ús.

Obra original creada com a homenatge; els noms d'obres del MNAC s'usen com a referència cultural.
