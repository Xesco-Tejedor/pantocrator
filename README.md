# PANTHOKRATOR

Arcade d'acció i plataformes 2D a les ruïnes postapocalíptiques del MNAC (Museu Nacional d'Art de Catalunya). Homenatge jugable a la placa arcade de 1987: baixa resolució, desplaçament lateral i art pintat original.

**▶ Demo en línia:** https://xesco-tejedor.github.io/pantocrator/

Funciona al navegador (mòbil i escriptori), sense instal·lació. Al mòbil, millor en horitzontal.

## Com es juga

- **Mou:** cruceta virtual octodireccional (zona morta de 30 px) o fletxes/WASD.
- **Saltar:** botó SALTAR o espai/Z. Amb *coyote time*: pots saltar uns mil·lisegons després de deixar la vora.
- **Atacar:** botó ATACAR o X/J.
- **Agafar-se:** mantén avall a la cruceta (o fletxa/S) a terra; el personatge s'ajup i no es mou.
- **Cop baix:** agafat, prem atacar per fer una estocada rasament visible que trenque vitrines i enemics baixos.
- **Atac descendent:** diagonal avall + atacar mentre caus; l'animació queda fixada fins a colpejar o tocar terra.
- **Làmpares de aranya:** salta a prop d'una làmpara i t'hi enganxaràs automàticament (ancoratge magnètic de 48 px); balanceja't amb esquerra/dreta i salta per enlairar-te.
- **Fosos:** no hi ha mort instantània ni dany per caiguda. Saltar i caure no resta mai vida: caure des de zones altes et porta a rutes inferiors amb més enemics terrestres; hauràs de tornar a pujar.
- **Vitrines gòtiques:** trenca-les per aconseguir espasa llarga, armadura, escut i bonus.
- **Set armes trobables**, cadascuna amb 4 nivells de poder i joc propi:
  - **ESPASA:** equilibrada; al nivell 3 llenca dagues (2 al nivell 4) que també desvien orbes.
  - **LLANÇA:** l'abast més llarg i cop ràpid, dany més baix; al nivell 3 llenca un dard que forada enemics.
  - **DESTRAL:** lenta i contundent; al nivell 3 llenca una destral en arc que fa el doble de dany.
  - **MARTELL:** curt i molt lent, però el cop més fort del joc i empenta els enemics.
  - **FALCIÓ:** fulla corba ràpida amb esmolada ampla; llenca una onada tallant que travessa enemics.
  - **BALLESTA:** curt de cos a cos, però **dispara virotons des del nivell 1** (ràpids i precisos; al nivell 3 foraden, al 4 en llenca dos).
  - **MAÇA:** molt lenta i devastadora: el dany més alt del joc i una empenta brutal amb tremolor de pantalla.
  Troba-les a les vitrines i al botí dels enemics; tornar a agafar la mateixa arma en puja el nivell.
- **Fusió d'armes:** agafar una arma de tipus DIFERENT la **brandes** i l'anterior es **fusiona**: no en perds cap. Cada fusió suma +1 de dany, +4 d'abast, +2 de retrocés i els projectils de totes les armes combinades. Nivells de fusió: **DUAL** (2 armes), **TRIPLE** (3), **LLEGENDÀRIA** (4), **MÍTICA** (5), **ÈPICA** (6) i **ARMA DIVINA** (7), amb aura de color pròpia.
- **Botí i bonus:** els enemics deixen monedes d'or (+50 i +150 punts); a les vitrines també hi ha cors (+2 HP), rellotges de sorra (+30 s) i el POW, que escombra tots els enemics de la pantalla.
- **Enemics:** bèsties dels capitells romànics, dimonis dels frescos de Sant Climent de Taüll i, al final, el Panthokrator: dispara projectils de llum des del fons cap al pla d'acció. **Desvia els orbes amb l'espasa** per fer-li mal i esquiva el pilar de llum telegrafia't.
- **M:** silencia la música.

## Fases

1. Vestíbul en ruïnes
2. Sala romànica
3. El Panthokrator (arena de cap)

## Tècnica

- Tres fitxers separats: `index.html`, `styles.css`, `game.js` (els fons pintats van incrustats dins `game.js`).
- Canvas intern de 480×270 amb escalat enter i `image-rendering: pixelated`.
- Personatges, mobiliari i efectes dibuixats amb pintura procedural al codi (degradats, corbes i soroll; cap sprite de tercers).
- Fons pintats generats amb IA per a aquest projecte, incrustats dins el codi; si no es carreguen, el joc usa un fons procedural de reserva amb paral·laxi.
- Música i efectes xip sintetitzats amb WebAudio (temes de títol, fase i cap).
- HUD: vida, temporitzador, puntuació, fase i nivell d'arma (pips daurats).

Obra original creada com a homenatge; els noms d'obres del MNAC s'usen com a referència cultural. Tot l'art del joc és original i s'ha creat per a aquest projecte (els fons, amb assistència d'IA).
