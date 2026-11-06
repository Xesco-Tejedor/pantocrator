/* PANTHOKRATOR - etapas 2 y 3 (v1): Jardines de Montjuïc (x2 recorrido etapa 1)
   y Fuente Mágica acuática (x2,5) con jefe final de lodo, según hoja de ruta.
   Se carga después de arcade.js; no modifica game.js ni la jugabilidad. */
(function () {
  'use strict';

  /* ---------- construcción de recorridos ---------- */
  function enemies(len, step) {
    const out = []; let i = 0;
    for (let x = 420; x < len - 320; x += step, i++)
      out.push({ x, y: GY, t: (i % 3 === 2) ? 'demon' : 'beast' });
    return out;
  }
  function platforms(len) {
    const out = []; let i = 0;
    for (let x = 300; x < len - 300; x += 360, i++) {
      const y = 105 + (i % 3) * 28;
      out.push(i % 4 === 3
        ? { x, y: 150, w: 72, h: 8, t: 'moving', ax: x, dx: 70, sp: 0.9 + (i % 3) * 0.2 }
        : { x, y, w: 76, h: 8, t: i % 2 ? 'stone' : 'bench' });
    }
    return out;
  }
  function chandeliers(len) {
    const out = [];
    for (let x = 480; x < len - 200; x += 520) out.push({ x, y: 30 + (x % 3) * 4, len: 58 + (x % 5) * 3 });
    return out;
  }
  function vitrinas(len, boss) {
    const C = ['weapon', 'llanca', 'heart', 'destral', 'coinbig', 'time', 'martell', 'weapon', 'falcio', 'heart', 'maca', 'pow', 'shield', 'ballesta', 'armor', 'weapon', 'heart', 'time'];
    const out = []; let i = 0;
    for (let x = 260; x < len - 240; x += Math.floor(len / 14), i++) out.push({ x, y: GY, c: C[i % C.length] });
    if (boss) out.push({ x: 80, y: GY, c: 'heart' }, { x: len - 120, y: GY, c: 'weapon' });
    return out;
  }
  function sages(len) { return [{ x: Math.floor(len * 0.25) }, { x: Math.floor(len * 0.7) }]; }
  function longStage(name, time, len, stepE) {
    return {
      name, time, length: len, mural: 0,
      ground: [{ x: 0, w: len }],
      lower: [],
      platforms: platforms(len),
      chandeliers: chandeliers(len),
      sages: sages(len),
      vitrinas: vitrinas(len),
      enemies: enemies(len, stepE)
    };
  }

  /* etapa 1 MNAC = 2300+2500+700 = 5500 px; etapa 2 = x2 = 11000, etapa 3 = x2,5 = 13750 */
  STAGES.push(
    longStage('JARDINS DE MONTJUÏC', 480, 5500, 230),
    longStage('LA FONT MÀGICA', 480, 5500, 215),
    longStage('AIGÜES DE LA FONT', 540, 6200, 225),
    longStage('LES PROFUNDITATS', 600, 6850, 210),
    {
      name: 'L’AMALGAMA', time: 240, length: 700, mural: 0, boss: true,
      ground: [{ x: 0, w: 700 }],
      lower: [],
      platforms: [{ x: 140, y: 160, w: 88, h: 8, t: 'stone' }, { x: 420, y: 160, w: 88, h: 8, t: 'stone' }],
      chandeliers: [{ x: 340, y: 36, len: 64 }],
      sages: [{ x: 150 }],
      vitrinas: [{ x: 80, y: GY, c: 'weapon' }, { x: 300, y: GY, c: 'heart' }, { x: 420, y: GY, c: 'maca' }, { x: 500, y: GY, c: 'time' }, { x: 580, y: GY, c: 'heart' }],
      enemies: []
    }
  );
  const MUD_STAGE = STAGES.length - 1;   // índice del jefe de lodo
  const PANTO_STAGE = 2;                 // última fase de la etapa 1 MNAC

  // sprites pintados (mismo lenguaje visual que el héroe y el Panthokrator)
  const MUD_IMG = new Image();
  MUD_IMG.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKYAAADcCAMAAADN7yriAAADAFBMVEUAAAAxJhUMCQQlGw4aEwpTRi9HOSZHNhk7MyZpVjQ0LCJzZlA8MRpnWkdFKhRkSi0PCQiKdVNbVEY5AAEnGBATCwhXQxsSCQgZFAyThnEmGBAXFw0YFA1UTENVAAAZFAxcUTkSCwgnGRESCwcaFAwaEwwmGRETCwcZEws7OwMxJRYnGBEnGBGGeWcwJBY8PDsrGRAxJRcwJRcpJgx5YjiGakstJRUuJBVVVQCFaDezp5FIOSl7dWmql3N/AABjRx2mm4hVVVVIGApza2KmiVGSdDtqOyf/AAB/fwB/f3+1l1UtJyWijW1CLSJIOihSRjL///9HOChPRjL//wBJJiZRRjRtKRObk4fVuW/+9ss4KSVIOS2GXEjFqWr35K4iDA0yKSNENypsOhp6cV2IVjiYgl25oW/MuI3ZxJTkyYbv1ZAjDQwkDQskDgktAC01KSc4KyQ0KSM6MiY4MiU4MyNGNhpJOCYPJwYkCw4hDgk4KiM9NSc7MidSRC5QRixXVzR4PDxmS0K8tqru3qz36sX+87kAADIVFSsAfwAkDg45Mxw8MBtDJxlKOjBVRzaOiYGZkXewqqDOxLMAAFUAAH8bJRAtHiA8Mhw3MiRBHRlOKxBHJhtGLhlDKyJFKidROB5INhtYTEBXTEBbUTlmTExiWU9tXlNsZEd/fz+NOiKNSi+HeGqsZkymdVy8oV67sJnLmoPIqFvIuKfc18UAAP8fIRsYJCQAPwAXRQAAVQAAVVUAf38A/wAkGyQ1HSI8HiAxHCQ7NRc4OB8+Qh0+QChEIhFALxpDJSNIJEhPNxtJPxxFMxBIPh5fSBVcRS5TQ0NbTUBdUkd0Hg1mMwBtSCRsQStiSzNsUh9uXihsVUxtZ0dqZ1BrYEx4bmGBblyHcj6DckSTfHCIgXGiNxK0WDyqVVWifz2qqgCqqqrHbkrFcVPNo4nSs1n/f3/m28L54ZX++eAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABGeyMHAAABAHRSTlMA/v7+/v7+/v7+/v7+/v7+Lf7+Bc9v/k5Q/rARL/4Dbv6Pj9CPr1Ct0AXRL3H+jQQTr3EP/v4vTgP//9H//gL//wP//////wECAv4S/vmTiwGu0AEHT/////9Qbf///5ZrT////////////yvP/AUoqs5Rts7XEw9PsJRqlCmtCAT6/////wUMAmxwzzEva/////8DAin8rTQuS2HVjaIRMUfdxQpt2GoE//9z//////////8B0yoECwMDAgEcNG6GK0hF3w+t2AdKbJq4bQsxmqT/BQcvzf+Ehoe9387Ox4bP1///A/8DA/////8C////AAAAAAAAAAAAAAAAAAAAsTCkPwAAO+dJREFUeNrNfYV/XNfR9j330OW7u95daVdaa6UVWWSL7MoQO4YkDTZp0yRl5n7l9i28UHqZmZkZPmZmZmbmP+GbZ+asLKeCKL98zas2BlnSzs45M/PMzDNzo+iEj/c3GouXfuJJ++/+2Wr0iuj358f0U2XPKq1cmd94NP9QdP7Av53/fSNlwyhbNptKKWdr6678o+fJ9spX/j4Q8sz5Za2NKlNrC2vT2lXu9dErt8/h385Fq2+9CEFfZhnvv/9PRpHSWuHMlSq8dU6p4S9E0+3V6MEomqR/yX/h77y8cp7FL4tXbKKcMiaOjVZFN0299lc29FwjurD6bWp20z6z/vqXWZ9vfXLF5ust6zSkJH3anWYzVSpNrXJXtFpRl6ajf5GX3xHd//IJOdcqHSmSTEdU6eluNkuXP2rdkK4qlOyG9pc+a91nXjaLv296pXQ6jrXB/4xRBemyZ32h3M5OTVLupMrazNo8vzL/kalzL5cuV5SK6UPReRv8R1I656z1dOZ7lv5AB58MlbEt/cTPLr5cUm6ofqczIumMdiSvoUMfWroAZU4Wn9resPCeBE/I6xvlHtu48LJIuaoXom/CjTQZGRBJqZTPKRbRBXUFiZYOLd0CpR19ysTkrV4XffXP/Uw0a6JoapnOnETRrEty7hYyqZTOnTwou1ByqQUux8rGZ18WK5peoihJpjO0ZESwI+VykoxuI3l0iEtWRCHJ420UnnT82E8/9DJgkqn5KPoIzrSIFcxd+bTl6Zw1YxBX4PBtSb6exDSk2rJeoaAVveqrLOaF+e9bUJqsROPMWYMOfyOpcBPJl3pHXrRJcjpgEp+6J0KA/arCoqUFevXcaVgIQaQ0XXcwGr+jSGrNkpKgJW5CYfAurP2XPxN9+JEIsf6r9jGB0OigS4pAqhjmzXVPrl3BO8HhKyjWUTgqS1zQxLmht4OPJE/9q49+1QL82cYyXUBrDfw63Uznd/IeDJw9PglIUYkUmhRw91An3lLqyMjc8Eb5ta/8qpw7HdqyNhQESZnGZCYmGEc2YhHdLd0A8uqQEz6Kzh0OQPFltS7P4Uc/Fz3y/B/5qv/6/8MZzeqEXhbnbeKE/p+TvshLGgqPuAIx7Ag3lO/n0BXsllS5Dk9VqPZP70t3ELq+tCJ+c6MNzSg6YkhJnj0m3K4SS8KImOzzOXxCUE9X1tXwAc7mEpnUpejrzzO4h3jnX2ftv/61l1aRfd2m4y0okO82CzpuuKPYZeR1nAbq0Cy3CbcTCrU4efKhFJ68TXH69Gn+WQvtK5vR9vnocyT/+i/+WvS/XjKfvpC59NGUnDi5GKA4BdSubEbRJzFFIZhJ4xeOnzh4eE1yqJ6/R24p4YC/9/rOvNYt97VR9Ho7KJtDO7j4kumyTTkuXgpBx+PEYUOdTcJvuJoksyfhYsF10CSDZcR1uiCkYHgwvqcEV0qKVitRf62zSRe2XO8p+0T0DS+NlDPGJIk2wSkCaCq10D6zSZpVpeXP9kVMCkyxU0FM/qDQxH9M4BDI2myZqWJlBTfW27xsWvvU+ZfGn04RWrPw5+wtnUX2o6PZqM2RkdIhVRXR/DILR/+TG2BwfVmlmgNCkiUlIqiCr1A2EZ+hrpDwL9GpTy8bZJB6tDSi4+Y/qvmoEU2QOZNvx03YiDqdS4ahiOYMSa6vyAlMit+dSxCucBmgYDoia1e0dW95SaDe2WheOxjwRDQba1guaWgipBspXL0iEDQxES0B0pNIiR6LaYDwFfIQxvJK3iMrW+MLEqviJEmmXxJt/gHtEqMnN6NpenELhZk+6lpTfPnodau56Ox2dHaS7ixBUA3vBNGMJMcAz7AilyQIV4yaGQAol+E9Kq9fkkSkgdrG5qemok7M4ZD0ucEu2ig5VPXtXGF4hMWkSI9fKXRKEGB3Sl9HWRyJ12xadg6aY0AMN6DdRuObXwIxZ8lMisnoPkow0oKz3uwS5JrWyH5JzIyMYHuK/HbMuKmAvUNM9qKcytN7Aw7xaenYacm1JXOCyPGVxZciX8L9+ja65g1D0aQA/E0uIC3qE2QvuZC0Rn+jj3nOiqFEksQX4u3h9/lsYURWCzahuJRb2D+QVOay6Wh+4vn4+zWn9Jp0+/WliM5c9WysOAZJ3VBDO7hj7cZD/JX41yXNsmn2niwpva0sNgXcvOJrSg4zz9eH5DlJmRm9d5e1lX5eBvv5K1OnkbJDOjR6LdqOFlRJsZGVQ2+90YZSnBeMLJ4Lhw7/JRF+P3zqTEswgi41SjmpHeb0C1w+QhU7qUtyJKGI++Qb/kr06lOIOTIJRbwZrroqPdwcxSYhMRt8u/AyFgpuSBwgYS5Ei2os51hMhEzNpqW54tT1XSB+giZI9kJq0o7o+keNi387oivVGLjFA2Kf/AGfbeLZCN5Tk4dcgpiUa7CPLkuY6uzIyNdSmjSiW6VNMnaO8hvEMypICTDKAR8owUm+zyF1Dddb63Z741sbj5ftM6cKQbHJYbPbKGHr4hJ5JZ0YltJoQHetlqLZJak1dPCXM9ECQzk+9IBI2IjwN5yIv46T9t3acwVXid0ZCgvLlB10Gp/5yOS8dZ2Dyjx7ogHFuoQHpNcmn7lJ7ilWCbtC+HqX0CsuRmud4GG1miFbW5gfGWPZhJQLYnJdTMo1qTeqm77j9m3O5iWXNlIez4xZXkmy1sCZxsFay4kthwW49IXZeKTdUJvFiA6dz09qcYQezMq5aGKVv/Yh8lGzEHOxYThUwsvHXGMMsBlvz3vAJ4L8zX+S1ixnwVbk0maOwyE/TPFKrx1si5xY2COXnan5Dr2WdbGeo+CN7FyzheCgSOCpu0czR9rcjianowbJn6mxQ4q1eCkYuoFIZOupr8SSNNAooGuSIR0hs8o+bk37gIOaaz/2d5++cIKYZOkzDfHRhiypESOxWF5GMIc+Y3UuujTGYtNa9Bp9P9B9lomz1wKaAZmhTQpGzXe98Vpa8XnDC1DKbEt2ThZAm1Jocr9jS3+kTb41t9Xacf2x+SVCho1ZBpAQ80w0QRmQWTb8qgzPG9HUvkLjcKUuwLqd5a86ICZDa5Vee+97vvieJqcgCKQ645wOhRQupmTsc/vwT2cousAf9GezPxv9gaPFXOqsZSwm+5UJ+r5VOp9YT8QdMmhHMb59TzAIv//BpVkSK1MZi6nDRWUxtW++97kbv/eld6WsTM1ewDHUYrDPkIq0snXuLNRJUaTdb2zN/eCfPhZ3dKaVbkyOcLuWZy8QRriUUNxpR0sNEhOJ7+xBzzExvkKzFOHJdQ3oUsRaUmYWkxRmH/7i/y1/67k3ptAlI2d2oQFFG06lIPMmfl6bUOMWblN2fKxcitqm0Ykz0sscCzSJt75AYs5oVRbGvP8e5U/v/6HBkmUxYHFIj/kCqPo33/Qlf+25Z5vXoU4GIg5B10n6GcyA/j8zMYN3Nrn5w5TQ9I8Vc3IhmjZLs3xwi8E5khdZpCRjhpts8/eiqQNIfJlPOpagiV+14FD78Pue27385ffeTj2rsmLpkiAmhyUSlJLrlmUNZ/Zjs0mydizYm6DoNwo5w6ToF7FuDn9g1DB5D4JG8B9/LEpBbB+CaAZOXvu9Z9/07vf8nzfupeSQ6EPyJcIkBWAp+apm7qD3zFJWhVaD3cwUXYFjQ1EfgYfElMAO26e373SDgShp855EZmL5gJirJCadA15xLCzHdO3v/M6zzz58Z8/vpCymgFAuVbQseaseBSTRKhwB+TWlMg0HdUwoopNuLIsqljhwzSGj+fAsi1kI9Lz7YSbvqeiYif8yEiuX00dETykTrff26vT63m0RUgsMBUymIF/2rr1zd29HYAn9KtVdszA3jptHX1DUOeIRnT+52E363o2LUKLJ6G7dGx0mDkZigjvRVGNe74uJKOv3KJrRgXjbbXYFghrJQQkhkPssy3wnRbeOa/nAieM4u7z5luODOwUhgmYT8N3noo1N8kdb0SMEOQlfqHPHIWozfz6a3BfTMPL05Ihw1q7usqWL30coSjTB+l7JJVxcTJgop4FGyxcl2fxxyTKF9ETFk6MJFvMSvdYGkg5k4f5rj8WqS52J6f1DlzqCZGuC2sX1AM+R5aArz8E9o+CeKcpf6AiRepF8IYZR3H9LdGjQnNpGwZ0CyvIip1VTa+c2CbvS1y4BIvqnjwm1MV2TTsfEYvF0Az0HGlbvPsxEGyEtuQJuVZIiceXabmZxJQ3cruGUGq7UJdnHpw87eII7Z+Ai1cK5i9uwX4KXSHlwE+iW7/3b6JePxi3sVJeC/4SYyD8Y1Gup3kOvJF8+sJa7s4zuxaQMwW/2/rGUSri8a0jbyZEghPCual86D6z2LWvRI/QSjT8+4lPc/TfHtKaWGNXPy6HTi7tgMjEjO7xND4Mm46Eck47dEfYsCnFRCWMBumuokIQISnckSTKbvOUIHzpF77C9vc33lE6+TWh+mm+2rtNj8tQ3M16alKtJxw2wH8CS1G+YLcJND/Y99FEUSTIORwTpyHIZmhmxQbrZlNu7bPHIQiwFyE/Cy7z5a+gwO4ayD3y/9vVfO+oIzkb9OVEqiwWjdaH6reU1pQjaUuFPhbNDiJpYrpqi0s/ZHhfQQtFcE7S37srUYTXRcxR61MraIl56icT8wPJsxN8T6+Xqx44OthOC66YFHuGQOZnjupIat+Ra+ykwmTtlxOSqyvXLrVC/4YxKymd4eyS3I1+VbBymmzPRGv37GkeYD3aQuy+xfzF6blL9yIl532RAIMplWt3NN4xo0YqvknItfSZtkok/07RJ3iJtZuSayK5CUoMTaA0SujyPHHp8KBHMbZG8DfLxF5aNvEOjLkzpk4u9DRMcElfijdjPuEbOWuaDhVflkgjZiy3T1uBqntMvvV7e+62rjAs4k1YWYm4deoZ/Sq3N6k0OSLPRhbYU1+Hlo/7qiWJ+kxmNuLggyTrgJ6fDSHtj/gvTrsjOu2medxk0DdWuG7RaV78r712+fKO37sZdEq0GGXnPlcNfSV2MRigdUe4ws0lZv3Z4EQpBayeLGS2PolhAkDH7R645EGoV6iNGFzZv5mmOFqiOc6ebg0E+IIWWV2/08nV6X6OYrysduk2yDx1u6ovRNKVC0dJsm52vgy30KR7MvYAK/+xIKiHhvEVM8TKC09l1s2MyTnolSRnbyzb/rqutQat3lY4+M0ukKFyUhIw9y7YOiUX34WxXUcb89PSbNVI1Ns9FSsrnX4A2F5bOGYYPsTL71S/pd6CzgTikfGFR12cd4NTXE/PdN6xbv9Ere1eTnE59BCxDcg4ciZlsHmLr90VzBNjg3tsEko3U1oy5APj5AsTUS/MqGHgsgTLhnJwPmy2eDCd3Ny7bDNiNwUizVOXlGy2X99bXe0neG1BImWBTzzK5nA8eYupb24LI4w5XWBBzkcKdfUGHvgCHJ6iRFOq9DvVjW3KVB7SwndSpZi+lsG+7nLyXPZdcXb+ct1qtW1czu97K4rWGvKWEgJLSh0a/iyLmIgwV92ljrkF5m9yGk0u5QmZgT+1S7tkgrgNucMMGvUblerlNC60KnxL+iJPeejIYXP5CmedJK8uulqTOWdYmWmF0GodWay7KZ9+8DBuHwyRIQRD11dHKR08iFROMV+FqxnS6b1fCE0nAvKl9i1sFKskvP2MpADl0ZWFdie1ZN7j6hRu2dSsf6DJvJRJh0adBenQoQN5mHV+4NMMhkjLL7WiGFdx+ge5dPDyyWpTg49irhNRaecTtJDGKlEb/UNsQTulu5G93g8H65Z5r5aVT67YVvLWClPrwQ/8QR6e/9KOz2pp4eQUnfYFtqz15stscp+sK6FzaW9LL4LBDR5/D1nEVEtAxGKIY2+oNBq7ML3/XIMkGJKbN2ENkiUTV6cOi5Z/5kVCK5wObPDRJOzqkd+alr0U4jE8URCZIpiwbUjqUEhLsCfxAjfLSgE59QJEov9Frkf7K0ufcIRckoA8XM/idVa6vtk/VsVmOG5MzfFwcIePQjWFehVFdupHMVpI3IK35hORxZFOJJYX2fvdyK9PJVcqOuKoBBKCMPuSV7o/6iwyEZpQaLem5UzUZludRg5AkkgshughkJSEAWW4bEIjTKqMrqUMDkWBlniTJoHXrxjNX6eKuW5ULeuE6XvtQbo+S4LSg9NL0Pddx8USJJ2dgRBIm4SXzMkEp26J7mdicFJmAWMmZBTIi8Vd0PdQ6MNugJPSxnucD78uS4lYm4GDh0Ndyj5OYqFrr5en5gxh/6QQx76P/LnEpNUTJddIJYd+0BIfNozxsuTfsnGe3SMcPdcfkpko69SQpbd57Js9zZwd5hlI5f8wc+mrqh1ib01D2/ORprub0yDiwzdnck2aeSPei5XTgqSCkUarmwLUrMqeEVRLHTtuc1K0GJZn75WaZ33JJabIAW6YPVUl/TUA6ecyzjVP0vyf6QCrei+n4JHdGMVstA71T+tVjXgjKHY7cVG25l5AY17PZILO2ztNrezkrNBmjq+M6mg9FKxunaiovwMuww2b7ZkKFT0hfhDHcUOyBBc04R3PcEEuc1JCN7pWEhwb0Wde73KOodKt00vw288e96rlo89LJLa+7H2tc4MAvCUMfqQ8MSGMG1TcVh9oMRzZK0elmJkr4IIzBbLMYWJb96vdc3k1dRjFT0qLl45R1PvqJFywmRfoJHc8uc007HpZSLiJpUvrocpCUpFYyXCQYqQq1eE6RTEVwLqX76cpqcCsv67IkL0/Ak79r5lhtIgtuvDAOSae9MGqQc+duUApWIhykKzBnAKad6Fn8PnDxTs3Go8eNd0p16aaWOWj1dNr1jTdgjMaWkvWvNCaOJK4S7vx2KXycbOBraiFa5Q4yDtBqgudDKCoR5oAOygxtFnQFu1J31ybQiMix1phGcBWptCJ8XFtXVa4lpR5dveVoss+PkZiNF0AK6pM4o4lGNE/WIdUVkJYKX1oIaxKpDxgZRTC+vgMulQ6HDt+uTTbQtryRlrcshQI69vUHHnibQ1B1UqhJ0yePINiei7YWX8DdPBvNQCvzswYNCfTSwAYDJYVU4xIjFBspsSEP8DtvfM97rnFKaYTMyHZVqlar1+Rjr1xZ1lX9DtIluQOpz6m6fuJw+uf56DNvfSGjdVMkwYpaXoaIbsdyU1vz+Ma6MGZVqHTxvTXdh9/0ve9+0+3aizMQcg1oYHQjd0v3+QEde2lrQnUIW6TbeBTPG502061Dpbk/2vzoyWISXO8s629dQZOvImyRKwY+JsuSkP2ghoHusVTd1d6zz1278dzD6BNJ0Uf6NJR7OLu7SzLS/xHtUXrKWmVqN6MZXCdf+UP90qvh3l8Ao20q+kOawyNZLbOjSE9IcDnX00G4UJMn+7/z7JebzS//5o7XwlgLVfCqVboq/Xw5KEGpdiHcWmROT0evidq60vqnDhdAPfmCiHd/OJESjIkFVRYcYoYywpNJiqtDH1NVO//zyzeuPffe29dViJ8CqFCHV7vW1Q8gjLaUdJe4jPSzU6+J+lr1+4fH7Ya7ctLgwiOhqRAL0RgVEiViJdoOE3C8kaPZRI4cQdHeft973/O+h/e4TaSEoEFGVuG0a2drcg/051B+JCSvYwC2ZV0tTh2OzyasO0GPX6Mv3fcacuqxsVIX5izL1nvXUnTLcHZc9TX7Z09HXTcffvjh26nd89JaNWMxCcRXdf15OMygTNxp0qhb1Mvabx9hG5PPb6t9xa1cbl/8gWgqsOMUk9WMT9O8efvOde8NZ4Z8rOQckRSjEsfM7m6a3t7j4BTKwzGoJFVdkoWvl4KNuHaY8NHoD0RzK0c5x4bWJxKR5/qbgROrmX2u03Rv9wZFZwtOT6a1RBr+EjpfHUrtPkhppFpO3/4YlImPskSmJOEsNgOLGLRMiUP/SB/ePjFdM8YOksSFaA1ZCWo0mynY5WkNbgx653wrmZoRM0EShCR279wTYHQaVwSqKIgTrC9bIMTwUE1s8gRifgvljxtHiHku2jgJb86gx8Qx2fsCmvGUOxYl6dGlO00ezLK2IEdQjYlUsR6T+qUNpJFsmCAmTsNSEpRzYYmtiO68+hsTBIsX144Q80y0tnW8mFPsGcV0YA2+iz4fWJBjlj4FwZReHLakksBB03HgeXNAFwoY2FhaDAd4nlH1uPGl/tbkhWPjy9racckvQQ4EOp7QGFcqya3nTfqt8M5KdyIlDK4fqFDHTrRBWiEulKkp0uji77aV5HmhFy+1J+bc660OGfm5c0eKsXg8EXBmYQbzeB7lKuZFKQJiJZdhoCPJNJTLhAHgwJcGYZtRpuAJzkbIrhzn8iZQLHOBfHrMZ+L0d7V/pJivO/7QJyYmR6IP4+kOda3dzXNUCrxT+/ri8lxFX1Ra4SDYllMmnPY4nLuQMwsTwwY0oscd76njCkP3R08/fnSwvJ/86uSsRDR9PSWdpJhhtcMhzEZAkc0TSmE9mQfaDL1aetZhNFsMHH/IONN8TN6xlBwZslaaaYycpk8fc/cunWDp0yMB5HTuPJhDaZglK/U8fBuDwkT/xRWwCL2ZPFdBNK2Yti7tYcPpqEhtMqnnsfVUVaUT6Xa1Z/XWi1vX8NFLmJ+XzCbku/hbTveva/OhyykHsiZj2k7teLAwFEMYxNuhZpbgfqtDkBILK/wkXT1Qy9c7ChPV5osSczJ76uckc2WeZp4aEJ+Zq2tA1iNDcnl4E9Wuk/4/jJeLmsKCd2kcDp5hPXBKCcEsG9NNl6d23BTUpywM7vcrDEglJnQrPMgF3e4wzYeceFuM8iQg+YJM+bbcK3br4VbGekCKVok49Bi1VtZnVop+WUw69DStq1jy/Tg+pjA4NXl0+KGDAxdVhjCkf6uG13yOXimmw4cJ04qToaN0qwrarFToCNueRWTA3zPXKlUAUMJIEUcFrq9NA1NhKT6uPnO0mEvSJBUBCxLMF4kj+yGZ0AEi6033uijBWeXz2nPJg3NyaAYZhJIhDtfKyrL61VvSiNNiQEMBcdrX1kur4IMTL+rMJ+ExuZTr+bh9t4tKgIeJM9JwNeVYnisGLq3hP2OeYW+CxoO5Kc2FGXKird23vbZ+g2MHq++GIXhWb4s6pCqrL0rMxRlmnRjuTnlwyCg/KFDtIPuuSG3XgZMgtOFhPAmLWlWX6dZKcysj0W2iB6/99Xe84YGb9Lkk7frxyAS7A0eQlXwSn9v8MfHwwtaR2lxmK0e/MU1xtG+/RactQtFV066ud5FjA2J6FyqJuHVM9ZCxR41icXLz7//Kb//H176Won4GAr/czDAtxxVtjmiZPqasMZ0cDuz/SDQv5TYQtlAKNlxOT5k/ShZrMbzGTHfFQ4Pi/zl8elsbPnY0NbJE36xe+6u//d9/Ja/X6a4kLrUM6EFNj5VwGFD4jnU2d3SkaRw1ejbD1gNtqNjnbJ+Yr005bTCxyxRqa6A3Y1GFqiqIqeHqYxkmBbMG3f0Pkpj6P/y33+iVZQm+obPCDMDpA/xRHLWev2Hl6OHnqbXDIccCerq6kOTcr8NrgAJZMBGZ84ZE3cplPNALo5TBO14vSVrcVwNwM6TMm/rma3/9d3u90iXxuIsI+r0S0jXYdAL8Nk5Ta4XwcWBr4KeSDybEbooUmx9APzbwzeSmHXoW3MMKlEe8OrdY6UZkuqxjx5GexLz5jt97lD5fMXrl7C3mHiIY5yQlBm1Gs7H7jiPlPPTzs5IqwtXU+voenXRKJ+MIKMAhypWn424lGgWavCwYv43FTBLkcWWNW0PQ84O6unmzvvw/bjpbMTUkA/40KUOsFG1qUn9rqRNN6Cv333cabcrhaZ02K8q8dq5rQ7/XKcwEbKgCHpkAUMZjhaQ8VP9kulXSoLo2dR2jzuShTnp7df6Funogk/IiBmawToDMG1OviWq1rP1W0s5jX3+60SehCVUpYHqNeK1UVaN0BFslOemfE4l9mTRGAdjpLkAOpR/YpWyHUrQxdY7O3ZW7uzcrjVqmlnucAk+TIkGPJBRTbNBdmznV1VzgMivFY08h2TcpXhvyn82UiUPdNBHnAxaCE1xuuDugOcbQTa1cXrNmAwlZqZtucPM36re99oEHWJ9kS4zoNUeABK6imDpl+DkbbYX0FfNiKr3mvMY+lx4q/iT2dSu5FieTBDehUS69xQwvKOxot1uxmZhxa+amdjcf2H0H3e5KsiCCpw7D3PS9SY7eJSc7pxp9wqHDFH2KEuGdayRIs2vdNcKGmAzClD0pThkrnVGGy0aqdaJDjQsSeyluCnsPF7R6Qw43x8AYQ4UcKTLQFpRqN+47PepgwAVHRDfzXZdJldd87XrWwofesUq8kME0rcxaFyagFKYWI7Toiv4Xkj2J9Y731gDjozBDsQoHTide5HlCF2Xp9KhjmvuO19+FnQXp917zce+atu4qjpMMmww+Uw4lhBiCYwRuwK4dMNS9XSobsXsD1zUyund0ZSv6xipJnHTmgKZI7B/kVpxtUdinVzq9mBfm6X26nTemqeqllykClU3j7EAaVqgleKeZuqkKdjCEiLhv5QK9FAq1pQ4lVqnEYtoJxXAwV5ATYAh/aJPEthD7nS2fPvUgdgOH45rvajbj1DVTHq2tXCaTi9cup6YqyUEp5nszpuUeryZM6jhTx+2TjqCFGWVciYXq+LaEfk2c5MMWN98J3ZOYT5x2iQUo++RX1i8/msPFIwh6mQrBtFLvso11s9S+MrEkNuSt4FEpNV6XAUYjsXAgjWs17r1h9CUJTZAYS4OS/LsJzSSY3HCD1sVTRvQoukKQK23eyJH25fih3qOkACSimj26g7bHraqEwZAJbap8/UYuHQT64ChQhJY2rC0JM8NcKcEEdEH+8nuu0plDzIXMPnnqnSBcXiubcCtxzp7c49w87lSvSeqlU4f7YTARcy2IYknZy+Vc7xL20e1KBE/i04SQ6FpTWgxYr+he0geCunsqavzkY6c1ofdzllA3ryNMc6pqPIMawoWqRBJeYauGM56xY8I+HGosVJkDIfM+GCA8koysGDQV7sfwzIEAEmQnCYQcFhQxv45e9anvPKU6p1PUMGyz2q+gotIDMZGwO2DalLtrnmsDnNLGWZJZSnYsOqoewy3geDRtZrH8JbVFYcb0V67m0k0mI4cJ0TtRrv9Xz3/u9ae09Uat4mVykPy29X69isXE+CrhnrrHv+/6ON6vxhDiJLTTvA4AQNAegyIMPfPeOkWKQvoZuAAarKVkmF+FR1Loy35dP4pe97rTFmdIhIUFmxpZkxFKp0qCIUQl6JnyojSeaZSSL48GKJ3uGAr8dN4goCFNpkNf71HSV8hekKTE2LUqklb+9lbeAsGftLvcbp96z8aron/s9MbkE7v6bg1ShlXHYhLwqlLm2ofijeSRJK1HgEU26mqVeB4PT5IyHcr6F+A/zMDzkee38iFOC4WbOF7u/+TrolPF9W+Ivs6prUsfreXCh4Jk6LMBn5tHLfq5iodHhBUrCIT+fp2sY/f2DuecgKcqSxJQqLwvKAKpWArZqhgOc7qb6NBJrX420uqPRqcT8/WWEs6L2HfHaG48EqhUoBq+k2BQbaE/VRvmkPOSAMzZkad/57vf/a7UV4EFnzkYO1JS5UyofuIt5MMh81UQK7UZNSjH+NRpg7pbufhTj6Dns9CupIcWh2SLhYLFpznCdOwzBr/K6kD3MfWzX7r8ptu2CoiJoQahaZnJ1pIbE6RpprAfBLeC0qsOWmlrp5Py/ujJH7/wyegKvdD85IoW7jgfbJherPAfARMHUWU8Q0pcqMjtve9/9557o/USmtDbtlIk4nq8lL884SLWpZJWIKHiqGFmTmtFlzbJh32Yvn9ye0WrTEiDanzorFH9ttICOspLO+ElkZX7h9/3bvemZ5tWxkDRY7PyRgWVhEF4krIIS9dUy+qVaHs2PvUWmNW56DXRlq/0VLQS5lH0WMyw60FXack1N/4rdkryFirvb7/vi+WX3nu75koex1EbGv+yqIi1mbKNqSSLMdBKQX5q6gONUyPO8+BN/rAHzbsfWo5G2KR36e5V3ZQpFsxmOBNKoZVKf+dN7/7iwzs27cq6JW3K0E0jxCYnEcvMNb9H8Hmt8lvRi6hpf/Lp6KEo8lX7j0VrekO2OcR2fzmWuHS3m4jLDt0yfPja+L3bb3z4Tm3vXA+ZksBSxnRIL3hHoUy0KTkZl9ZWjeLTa/PnH48ePBttVJvofb1K2I6xFXcybuiROoXbFfrUsierCVzp/fX0zh3e60VnKjMwuAO8mAYXHeNYRkuiZChyFvT3F9MhuMSlpIq+9cyb/8QKE3dkHRbFkdDQIzFrTwfKG5JiqWcrk+7BKfrr/5mkRHNKlMzjfEZWgMTBdfI0DLeLNNd71IVTJsD08fg/BK/mE5v0y9dEffbcsRSzYhXCEXl41dWEcByLibtLzt3UlCrxZLWT9i933WLxaMgqFTc4ZFor/DCmtMSmf+HU6x0X7wOZ6vFPRK8Uai93ybzEIi0L3eL4DeRO4Dplop6ASN1FAq8Ci0uFjbi4vqGMjbSJ8ulW4AXxWL6SjQz0le0XtZfqbPSjP07aPBPNrAiDrBuL+4uZdB/HXC3O+dCNEOHh01FH4Eq3zJEUZWL253WwOtM7g10DY7cxLKSA4yla2LUX1Wj75JVz0tgUK+lywRwbzlJhRVC+iSonoBG3JQwXSkylw5wafi+sGy8p4v5HikWe+IdSuHM2iFnt5vZac/p0KOniOeb0bvw55gbMJdwi9YEZziUgFGirqqYkPudBYL5khS1gKhX065nyR2KEU5e+WqVL7C3TMgplEpsN/yK/A0fQ79Fy6zQI/oyMtJ2P3vo02tVra1eEhu8yzQQelUhEcYqSL9ViVI9LqzhR97LspZaKOqH4fLyaShYUWUZTgQqiYvfPR3GHvjBHDaJ9msLcPmHyO74zOn8mmlu8gotUVDVgV00nm3BzsnoAywdZcByoN4XFIp+aqVwKSZNMYlEiFPr7nAxj8eQ4eae37/9pJ+6MSEwmMWydgpJ9LtoUDsjP83qwlcW/LIjBPYbqsNoDDQ+NpwdQ+wjzeihUexJzJ5c2DHbmMNxQTGDh+8eBVr2txtS/CdMSdFsX4hGTSRZGuv6bpzCis1GnE3jxKEH1J9uaqwApd/50jVTdWV3VUkKshRUFv+n8zqNNB3aA5pZhLPtPudZpW3x1ZN67UoEhoBPLAYOu0sbUvPIvavegt4vR1OZFxaU/0gvPOl6/nMvIZ5U6o8Q/c1WBrAadTPKNlPAYL0fgmyXXPswAHbYYBZHKvaNikjzvYnJJPGrjemxGq1q9gFP/SmfwCatXp1bmkPsXZAy7gDO6utZTGVrSdEuZpcTla2ZU0eeLLgUh3uDEdAEKAHwLyKqd47uZOWQED8AjGAsOTRGP0BhRK1PvX9Ibx4fMX2aC5Pl7Cw/bfev60YYmEIsadPdRz6sv82s7jHo9M9vjwI8ijyWNLErQKH8sXIDAYHty9csyadGFNSaSa5INSvnbDYFuI715ojZXL97Drbr4mWi1Y2s9s0XZBNKuRPVShXFZe/mdKSy1HkrNRehZxlxNPe8Y8d66/YUzYLs6YQ9ILyhMfmNxEZ0AU3fBiie7OsPjtGePsZntX/o5+oFXvvNn7ob/D7nV7bknLfdom2j9tHwz12VeUlqYN4F+Uqm3OXE0St1C949rrN6Fvgp9gnIzzwGVw33mlB6z4WFaSUsWfSDfoBf9wLFx/RGX32hayvIHH75bcHLfNr21kWKZhGs2kQv4tLmrWjfotJvNLsGdRIhzVnjwPM6GtSk8gqwLCfSUg5ZOOtcsjpOyF7v+0tow+Yi9aw6Ic7ZxfH04s83mDvKCMYHq1dGVWs8tpg/XlM3cedST5yjya3Ts3+1Ufbu+bk3BGW7AOATdbqHcUdx1OgJLUU/S5ODD8lbuxxXC8AKfjimHPA9TJnToq9vHePOPgdJc0CuRQscryM9Fc6mLF1zzmtcubdbaXU7T3DerUlXXvU13bapDS5pRHjrsEFMDk4zpe6iNpU7GRyBSlnE904fuOxrhMQRHx8naSdLmhaPnXD4L7kvKvB2UImVs8BXRJbeLreTv3PWqu9v0BIGrnbx5vZXptK7vpLLXjS6b4A7u/Sve0xkWsXLx2mH4kwlKRQpfyRwW6X+BPpCjXMrJnu+mx7Hbz0UXCexxP59jVwFj6E/QqX/jU+ku2BKPkr9Or3XBQ+g+eocOEQNYqQtT9E4L3YDpCFKY5YsQeI/C8sx4rT1vZ8fmYHk6AxoeeN02pQezcxTCPnFcQ+BDiUvdXbI1LnuS6TVk6th8AJYuAd49UFHIQHYVbxnJhPiA6QHeIuqBKzGfs7/1g9RHt7OgZAM+l5tKvotiY4qpDDPep0Tf1l8Ab2aTDmPmKN9+Llpkgp7Rfd1ZmJhRYRAJnOT7oysWbGyf1hUW1bd4o7b1KuWVIjLelbFz9DwqZmygEfODDcD30exBvcR13qECJDywqRp3XZ1dmZhr69XorajRTh8l5SSZGAgl/WjmAp5NMDfeADaNPtbXwSoIWdvY71QEF6rUg6MtJGIpCGmW0nGGQR5StGkDYQ+dKaaY+p2ddIcSDHBsSL3DcDd05t2Vme2+3qZYR75z4wiANL2AEg6lS/uOoI/rr5mhOjX9qStc74Mj9nX1mErqdM/BTAhdMrkNmSLWr/MEqDAjcJyJ8AaU7L0rVHfvndcowjqedjRxxg9kEb6feyqKOqOIh33cUdMCI9lX1b4L3C/ST6efglOH0ArssAprmVJmEhRdPy5uM0eTXFGhREotwDdW+xsqPJY1+a5zeeqeudxLCx+Ksw7NQnH37nHy27N4iFFD6+ziET1pjaahuss2JbAua55jJvz+dd4IWanrKYZ6oapuJd4Sisg1S4n5ACez3jrsuOX1D5jXAQNdZb0UbKacCUMVl2lSFabHk89G0cQS3bBPR7NGXToUecwbykGUXrn7r2exiU02bi8sLExsXq/o6MiCVF3JBgc/rtFQTKf70O0WaEEXDEkz/rcshMnxnnC6ywmeFFDA4vlRJjJ0EDal9KNocY402gf76XOHNYcasfBK7ukjzOhgGzwVwiPRivkU0jLwzH+JbaxSC4YOppMTbmoajO3DTckyBakfhG4Wex7F6245BoSaDTv5qWiNRGx8AAffP+Jq8qJp/boD8GlBhz1wXOHlu8RrtpjEA7vnBZyFGQ7RKvKQE5DD01t2VjacJrxZjJ9i0qWQ7tX+h7ey3F4zL1/KJQ0e+2vQwU+1G4fzEPgK9ecOsPQn5Pu1rGShmBzGJ7hCSAEYpB0GjYC9eFkk7nT49NnMloUe73VhpgfhhKHj7fKhLK5lQ0moRXI/h8TbvijPaYnmtw8dUgsU20tzY22ewcw6myxujuM9oAx54rjLPcsExZdQypbCrwMnSajcbgivZJgKwt9VqOFVupRQqwvJuUoCESD0NBRvNot4HcqFuUOj0CqJNCJrb++zEs+S31wwS1zwYxZM7Mc0Rs8CK6kRaSFs8subQirKBkN1irdjGFl7isaKFQaoMYENotRA9gVJ1RhJ2vZJSdqyMQ081cNM3PVHmm7KvDCXuVglRDT6axdUGcXNdcVQzADkkuZyz/aAkiAXLZ08kgzuPUll99m4VcfqpKhAOXTGq4pItzzG/5+OE3OkSY8LJEbnrph9xFDuopjxBiEhv6U8XmVYTBlN1p4XFJVeyzIkmfHH4ndJg/x6jlH/8dDN/lM3gJKMCoMITm1MhMM8s3okl2cimqeXv2thE1gCHC0yh4RHwPY5enVAPz7G87Gg4q7kQuG5HzG2jnSV2qdJekWxw45n9fbFpBuTl7yHAp9IwKhVK0+85hjieCOmdG5yYaF9T7MlWnz9k45BBzZaF7Fw9OJ0vAwnlqf2Edhnr4pGlDQzZVpIhTIWV4wLf1BMLRVFfnaNTL9JhmFt/ovTrzq6aNgZLRIwooPeN7GpiWjT4ZFDKFGLszTSGChCO9CLAvkpKhhMLnkKk+vTpUVDlxeKuaKQh70oWWgYlukAC5OD5cstVW+Ye0F59eYxtc3ppcnl6WjtHgb/pnuMXXbFzw/jQ2f3ETrqKF/yxu8Cg0OxkQImFz6UbamCyTKEjQpb2h55gjDGvG9FaigrRxTn5k6WORr64sdf8dBx/Pwp2TS1f+oYo3LcDLcymiYTYnEl82IaxA+DdXaYDYiLbmpDl1AejMZu1YGhYNNccfGTh1yMkHoD6RndFuflITEMISj/v3By828s5muiNcF242W67PKk8SscOFXLM1OQKnJOiX6a1It1loxBEuX0aQFUpcYLjvX+MwIIKSZGwPdIzzQavLkosWrjG46fdlg8eOhtp1zg4PLQSM0FbT3Ow5hAg8CMyXQegUdHOxa0ibxNc25k02spxoo08yPJB7hw7Noz54uzN2Mml7cF7fB9//rjy5mEUAKQm567UlqXhQ4VF6UrLgooVLIwzhKrLoARUjTm8pE/daoIZ5qBg6pZyuY6P5ZMFkrqMgld+dgwdHFWJjCnJsZcTG0H6tih/nOYa31IxvqzEiU3YAlBc4kknAiZlCkK3vXcfU5MmFpSUnpDPpthuFfj+QRDezWlX5CDMmPACaaXnfuxDk8ySD42DirLFCRa7tjJpjOM92RIKHErP0SW4Cc2xtUzdCv4LkrIwZgkoChqwRhKki3i8vAMSpwzkrGwLeturSMJta2wrJqftCCbY8PcJj7r3hIeoPX9y0jgnWjrHhb5Kw4Rd07pma0n6G72p+YVPxtFdmFwMY1ZSXFgybKtpNfN/rOnmAdJPoayHvj45OqAUvRChectcISybEW+ClVbbB/C8vFZBGqEBrqc2wfPGOHnHsS0HVwB1v9fwaOj9GhkkiTm5wYyyAbqDGeOZVGKLyEv048LUXLM0dqBtu+xpwe5vJPRYNm9G9Z8jJ+qwMUZJLQAnLPcK3AHXNJ9UWMOsepgp2j1W1jDk6YRz+CZTYwWM8PkNubwKO6pcBlGV3td4DhXK9nKp02gFcruTaxdBXsUND6nM7W/AxGcV8YxcBXSpeTdVx0zs8xPr6nvOfRLVyiCkjk/8RXLjaeno9kVVBcYjVEQT4dO8K6VJ+EwAq98FZfPSF4u/tJKoMIMcFg6UyZZ2MEl9W68vcImNhMWZSyDb0p/PIq+byS1K2CE/SGXV0SLGKTgZfgbh5hTH8sGMn6yC5lIznEolsXIYZsJpMvdVSu0GPaXPgw4chkC6eXgaiLzGOCzCIVOdsahOMKQKSyAdE9jRp8MT6r2d2sz30jfSzh4mR/Z8viF5xsRChmyTp5ePl0XQvO4h8NTYFiq9oyxeSYOFRwJHmcKq8HIUWnbGnDBmoFxOHUhSXXzHsKoIH+KC+rDWJiuuRBGCe43H0CYZmZqcXWtv4ynqvYDKrnv/KteEZ3ZpkQ5dJGl6sfEy3i8ZkKSLfLclp/YaGthmshSfy9fBTO3twYZvlZ6gn4MXVD/KNfXsXPESpyFlclyP5xCf/5ALJwep8KfmkEF6NI9pbqJjFEwKmuOXbaVopCsv4E2fFGs9ywjCQpBOiyJrSpeMUWabWHNlR1g6FdX7HV9JQUx7kqXjgu9KHow3SvjPXOJPMpqcubgyPl4g9j5hViNF6Nd3Pj45uzM2ngJrmdjF38o3OCyh89573N6Jbp+hvx49cGbARgpFLhxGUGGLUteLhUe5FmWFdMZ2LBR9mA6F0yGWZNsBghI86tRY/WgC1+8m69hg+lZcgJbzMpS8uQLkLSGVrLIwOswriwT8Dfc+ve06Euxkw1T1GEZFnnLipvP/Hzm3OLSVBWHH1WXvgprLDQ3YtAggO49cyqsPDjTmK/g6Y1b1t8I45PkYznLLZkb56jWmaRkZ5AA/7iUd1AU2uboObfW00SuXcyFO/aJSCgrHGJeane15eAyedgB6ZxTUs3hp1HyiCN2BkjOjCYB82eO2CMnqESRP30FqfOisv/eZtCmPFsXc76KO9zMHxLjoWue570U5elMmAco7ChePsRlfnb/Kr/RclxMLtj1Z5wcxUKR4xFbHiO3aGRW7Gw5WzaT2DKyeOjAGnYykGrvaxBMnOE2rhqiKF6mOFOd21DXEJoT6dMnORlAK6uZUwZaJPpsoDELCJeSDQ/9Fy4sCM+EpM2No1yFLfFF/gXLdsQbeXFxpymHmDm4/2xyDOr4R0PZDfNxFQalcJ8c80qUTD1Dj8DuWUK+Js/4VqiKcQ76G86lpQ9r7mIpiDlc3CSkxJCp9kbypFqFGW88Nb5ndbK+XkhhKWZS5KdHhx16LEu04qVlnYxHczm2oo2HySpQuMSzQXWUrsrjQQvpA8Wu6Kq6eaOH5rlU4hOmvoW2Ku+KxEAJPxUNktnAWGQcQv6Aoji3YIDBRo2JWXPoNE5nmYuYnIOGshMqFtz2zJh+xznDmERKlz1hxivXEDiTUCpt9oTjyAiSJ2wSTAry5HJoa0nWTHLZQFPlrixaByi2M2aWsDdaOPQpXg0TngyWcCWgzJjVHo+fNBRznYDkKTADjFku6/jAQpaEuFlbXngo9Uqu1dFZOs+LKmLZPABoysX2YaFDK4YftKB9matQYCzg7fXc9j84DLQ3Qh6RcdPYuf01yRTNmzkl2hmXhqTOy12oQAsPAR5Rkp+1zmmoMJEI1WN5vvjzfTERGWq6TIGminYR+k1NOy7rMC320leIKM/2WTKBJ+rkMabyGBmcULOHhYCpGnA/BcVUfjJrGFGTjTxK5hczFBBQcIfzArbDO5JtCVKVI2dueFhIbNLIGCg/sD0lv2SNpNGF3nzrX3jecY/i5ZmZERzNUAJXzKV9EZO8Z11SXA7ETM/PsbMoRTJNNJa1xUYmqtgj6DBwwZSOMMEaED2psbbCO2RENeDwlnJe6Av67trv8/uz53XZgrPg6r1GzRnnXOZOSlJKHqYdRn+Mump5RbKUg8Be3W9O2fC8uVADVPIAVhfScF4R3cUmHXnelPCA2JuiJMOP9tq7RslTa7wvPvnY6oF+y5JI6RI9JrVjd6rlkS5xSyYMPSfc9tFCBbahSxJQUxd5EoWdMec+PA7HwNXI87y0h5hv/96c/yU02KX5z5c3U3Zvh/5x14WzII1ufnJcv1wROxjnDRyzKQYG6IvvGPCEAPBBmu7s8DwA7hJsN5BhQXGUhy+PubzkKoTJ4wgxiwmzCr1Le+uScZhwPTG163k9iE1VnaYCb6QHqVbwwJEFSpdd2PnGD3+Rd2cFIEkercRNoz3RTZvk77petqVo2WrDapKnbSJnSgQn2TKpPC9ucGH1v+AN+rKc0aUeb0dBE1GWdfLwk+XoGgq0JGibTFvr/R3ykj1JZiodlfDsv0SJL4nRxi+d8bUthAMbB8/qSUFZWOAh0KGo84pnmYXlZbiy5DG9JlvmjDbjiWDNe7T1/l/4iQXWipTLS6PZqNOZnZ1dimeXZudnOzMTMzPzZvyEVaM3NleU7CHgh4TwCLpuNm9giZ5sMA0ZN0/U5aJ8SnzWAecS5jvKQ4RYvYSHSzdeaRv2f8ehe+14c+D44T/e7tZlL7Xt+cnp/ty9tv7+Ny8uTs8th+Ki6Vyc3uh35tvwcjjFMHuo7B1rQ3YtEBwuziZZrNNAGAbWwGpLhwl/3lrL9sOH5IIK6SSazoxbGfLUW7W/Lj4Hk8DW6cpG9BXPamtMTHSmJzsd+m2GFMvvYercRFYiMKrJRvTn+ZjrFI+JNPJsWMkcEPfyuy4CPp6pMfIQH16ElsVaZo18uACGzZ8rzQ7FGbrcaS2PQOTnvRBW7PrK2o2T5ug5cZsEIAe83PzYEyt8XyktUwQ/paGjeQ8WtBv2eMRhoCmvGYkvNaZnlxCYsIuKI6jnOkksq+qxn63C5nUR16kw54h3RjlfpSr12NHrcfD5M/TL2sZHlOQosLa+0X0ZanK2tweOFnsXhGvZaCZ9ANlrCKGWOmt0Rp2+TIMiNgUe1xi7ydN7Za+ShDBt5uf7a5NKzU0ubvXbc/3RUueksnbflTaRvZ7znQY/aK7RHljQnZpNArTL7c0JaTeKDtorm1vyXFDObK27hLbOxOrk9OQGHJ2XXZeyUEZWJtBnR0sLs0szvB0IE/hbWNmx8rzHrB1DPsPu10TLIDEeu/jgg3hyHsfLJE1d7riQM4MHC7bbG1urF36ggac+MROmD8srXHtcptr6RM1Aea5BGcx0R4dNttz+uSIoaHoyfKJ/Tg757Lmz0ZmzD54wBbwg5zMakRS6LWygBt3HT69NTm49ZWGNGxc42m5L5Zvu8ZJgj9l++0LUaIR2Hn3jJghiSoeqRadNf15bwwXip4zgUSf801cXZxeWZk+1zpu+a2ai0yHznzzYdg9/niPbJLXu/8QHz+FJkg18TCxO0nccbOBuVXVTYOnGGRaHfi4u3NLMFE6j8+K2Hp3E4j0Tqrariy/kyx+KtnwN6L6yqQ4umj975uwhD688c/bsqUdazry493Hvtz0YkaGvbK1NHVyGfObUP/r/Aba2/qcJuV46AAAAAElFTkSuQmCC';
  const PIXIE_IMG = new Image();
  PIXIE_IMG.src = 'data:image/png;base64,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';
  const EEL_IMG = new Image();
  EEL_IMG.src = 'data:image/png;base64,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';

  /* ---------- flujo: derrotar al Panthokrator abre la etapa 2; el lodo da la victoria ---------- */
  const _bossDefeated = bossDefeated;
  bossDefeated = function () {
    if (world.stageIdx === PANTO_STAGE) {
      world.boss = null;
      sfx.stopMusic(); sfx.clearS();
      player.score += 5000 + Math.floor(player.timer / 60) * 50;
      game.state = 'stageclear'; game.anim = 0;   // stageclear avanza a la fase siguiente
    } else _bossDefeated();
  };

  /* ---------- fondos: jardines nocturnos y fuente acuática ---------- */
  const _drawBackground = drawBackground;
  drawBackground = function () {
    const i = world.stageIdx, T = game.frame;
    if (i < 3) { _drawBackground(); return; }
    const cx = world.camX;
    if (i <= 4) {                       // JARDINES DE MONTJUÏC (noche)
      const g0 = ctx.createLinearGradient(0, 0, 0, VH);
      g0.addColorStop(0, '#060a1c'); g0.addColorStop(0.7, '#12203c'); g0.addColorStop(1, '#1a2a3c');
      ctx.fillStyle = g0; ctx.fillRect(0, 0, VW, VH);
      // estrellas
      ctx.fillStyle = 'rgba(220,230,255,.55)';
      for (let k = 0; k < 40; k++) {
        const sx = (k * 137 + Math.floor(cx * 0.05)) % 500 - 10, sy = (k * 53) % 120 + 6;
        if ((k + Math.floor(T / 30)) % 5) ctx.fillRect(sx, sy, 1, 1);
      }
      // luna con halo
      const mx = 380 - cx * 0.03, my = 42;
      ctx.fillStyle = 'rgba(240,235,200,.16)'; ctx.beginPath(); ctx.arc(mx, my, 26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e8e2c4'; ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c9c3a5'; ctx.beginPath(); ctx.arc(mx - 4, my - 3, 3, 0, Math.PI * 2); ctx.fill();
      // silueta del palacio del MNAC al fondo
      ctx.save(); ctx.translate(-Math.round(cx * 0.12) % 480, 0);
      ctx.fillStyle = '#0a0f22';
      for (let x = -480; x < VW + 480; x += 480) {
        ctx.fillRect(x + 60, 96, 220, 130);
        ctx.fillRect(x + 150, 76, 40, 30);            // cúpula central
        ctx.beginPath(); ctx.arc(x + 170, 76, 20, Math.PI, 0); ctx.fill();
        ctx.fillRect(x + 40, 116, 20, 110); ctx.fillRect(x + 280, 116, 20, 110);  // torres
        ctx.fillStyle = 'rgba(240,200,120,.28)';       // ventanas iluminadas
        for (let w = 0; w < 8; w++) ctx.fillRect(x + 76 + w * 24, 130 + (w % 3) * 18, 5, 8);
        ctx.fillStyle = '#0a0f22';
      }
      ctx.restore();
      // cipreses en plano medio
      ctx.save(); ctx.translate(-Math.round(cx * 0.3) % 200, 0);
      for (let x = -200; x < VW + 200; x += 200) {
        const h = 60 + (x % 3) * 10;
        ctx.fillStyle = '#0c2418';
        ctx.beginPath(); ctx.moveTo(x + 130, 226 - h);
        ctx.quadraticCurveTo(x + 118, 226 - h * 0.5, x + 124, 226);
        ctx.lineTo(x + 136, 226);
        ctx.quadraticCurveTo(x + 142, 226 - h * 0.5, x + 130, 226 - h);
        ctx.fill();
      }
      ctx.restore();
      // setos cercanos
      ctx.save(); ctx.translate(-Math.round(cx * 0.55) % 160, 0);
      ctx.fillStyle = '#102c1c';
      for (let x = -160; x < VW + 160; x += 160) {
        ctx.beginPath(); ctx.ellipse(x + 40, 222, 46, 18, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + 120, 224, 34, 14, 0, Math.PI, 0); ctx.fill();
      }
      ctx.restore();
      // fuente mágica al final del segundo jardín
      if (i === 4) {
        const fx = world.stage.length - 320 - cx;
        if (fx > -160 && fx < VW + 160) {
          const hue = (T * 2) % 360;
          const glow = ctx.createRadialGradient(fx + 46, 195, 4, fx + 46, 195, 60);
          glow.addColorStop(0, 'hsla(' + hue + ',85%,70%,.32)');
          glow.addColorStop(1, 'hsla(' + hue + ',85%,60%,0)');
          ctx.fillStyle = glow; ctx.fillRect(fx - 20, 120, 140, 100);
          ctx.fillStyle = '#1c2c44'; ctx.fillRect(fx - 6, 196, 104, 22);
          ctx.fillStyle = '#3c5a7e'; ctx.fillRect(fx - 6, 196, 104, 5);
          ctx.fillStyle = 'hsla(' + ((hue + 40) % 360) + ',75%,60%,.9)';
          ctx.fillRect(fx, 201, 92, 14);
          for (let d = 0; d < 7; d++) {
            const bx2 = fx + 10 + d * 12;
            const hgt = 34 + 14 * Math.sin(T / 7 + d * 0.9) + (d % 2) * 14;
            ctx.strokeStyle = 'hsla(' + ((hue + d * 24) % 360) + ',90%,78%,.95)';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(bx2, 202);
            ctx.quadraticCurveTo(bx2 + (d - 3) * 5, 202 - 2 * hgt, bx2 + (d - 3) * 10, 202);
            ctx.stroke();
          }
          const ch = 66 + 12 * Math.sin(T / 5);
          ctx.strokeStyle = 'hsla(' + hue + ',95%,85%,.95)'; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.moveTo(fx + 46, 202); ctx.quadraticCurveTo(fx + 46, 202 - ch, fx + 46, 202 - ch); ctx.stroke();
          ctx.fillStyle = 'hsla(' + hue + ',90%,85%,.9)';
          for (let s2 = 0; s2 < 10; s2++) {
            const sx3 = fx + (s2 * 37 + T * 2) % 92, sy3 = 172 + ((s2 * 23 + T) % 26);
            ctx.fillRect(sx3, sy3, 1.6, 1.6);
          }
        }
      }
    } else {                            // FUENTE MÁGICA: interior acuático
      const g1 = ctx.createLinearGradient(0, 0, 0, VH);
      if (i === MUD_STAGE) { g1.addColorStop(0, '#0e1408'); g1.addColorStop(1, '#232a10'); }
      else { g1.addColorStop(0, '#03101f'); g1.addColorStop(0.6, '#07304e'); g1.addColorStop(1, '#0a4066'); }
      ctx.fillStyle = g1; ctx.fillRect(0, 0, VW, VH);
      // rayos de luz
      ctx.fillStyle = i === MUD_STAGE ? 'rgba(180,200,90,.05)' : 'rgba(150,220,255,.07)';
      for (let r = 0; r < 4; r++) {
        const rx = ((r * 170 - cx * 0.1) % 560 + 560) % 560 - 40;
        ctx.beginPath();
        ctx.moveTo(rx, 0); ctx.lineTo(rx + 46, 0); ctx.lineTo(rx + 110, VH); ctx.lineTo(rx + 30, VH);
        ctx.closePath(); ctx.fill();
      }
      // columnas sumergidas
      ctx.save(); ctx.translate(-Math.round(cx * 0.25) % 260, 0);
      ctx.fillStyle = i === MUD_STAGE ? '#161c0c' : '#062035';
      for (let x = -260; x < VW + 260; x += 260) {
        ctx.fillRect(x + 60, 60, 30, 180);
        ctx.fillRect(x + 52, 52, 46, 12); ctx.fillRect(x + 52, 232, 46, 10);
      }
      ctx.restore();
      // burbujas ascendiendo
      ctx.fillStyle = 'rgba(190,230,255,.4)';
      for (let b = 0; b < 14; b++) {
        const bx = (b * 89 + Math.floor(cx * 0.4)) % 500 - 10;
        const by = VH - ((T * (0.4 + (b % 3) * 0.25) + b * 47) % (VH + 30));
        ctx.beginPath(); ctx.arc(bx, by, 1 + (b % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
      }
    }
  };

  /* ---------- jefe de lodo: amalgama viscosa de residuos urbanos ---------- */
  function drawMudBoss(b) {
    const x = Math.round(b.bx), g = GY, f = b.face || -1, T = game.frame;
    const flash = b.hurt > 0, ang = b.hp < 40;
    const warn = b.warn > 0, lunge = b.lunge > 0;
    const wob = Math.sin(T / 14) * 2.2, wob2 = Math.sin(T / 9 + 2) * 1.6;
    const lean = lunge ? (b.lungeDir || f) * 8 : Math.sin(T / 40) * 2;
    const M = c => flash ? '#fff' : c;
    ctx.save();
    ctx.translate(x + lean * 0.4, g);
    // charco base que respira
    ctx.fillStyle = M('#241d0e');
    ctx.beginPath(); ctx.ellipse(0, -2, 44 + wob, 7 + wob2 * 0.4, 0, 0, Math.PI * 2); ctx.fill();
    // sprite pintado de l'Amalgama (mira a la izquierda)
    const im = MUD_IMG;
    const squash = 1 + Math.sin(T / 16) * 0.025;
    ctx.save();
    ctx.translate(lean * 0.5, 0);
    ctx.scale(f < 0 ? 1 : -1, 1);
    ctx.rotate(-f * 0.03);
    ctx.scale(1, squash);
    let flt = 'drop-shadow(0 0 2px rgba(20,14,4,.9))';
    if (flash) flt = 'brightness(2.6) ' + flt;
    else if (ang) flt = 'saturate(1.6) hue-rotate(-25deg) ' + flt;
    ctx.filter = flt;
    if (im && im.complete && im.naturalWidth) {
      const H = 190, W = H * im.naturalWidth / im.naturalHeight;
      ctx.drawImage(im, -W / 2, -H, W, H);
    }
    ctx.filter = 'none';
    ctx.restore();
    // goteo viscoso cayendo
    for (let d = 0; d < 4; d++) {
      const dx = -26 + d * 16, fall = (T * 1.2 + d * 23) % 52;
      ctx.fillStyle = M('#3a2f16');
      ctx.fillRect(dx + Math.sin(d * 7) * 4, -20 + fall * 0.5, 2.4, 4.5);
    }
    // moscas orbitando
    ctx.fillStyle = M('#0a0a06');
    for (let fl2 = 0; fl2 < 3; fl2++) {
      const a2 = T / 16 + fl2 * 2.1;
      ctx.fillRect(Math.cos(a2) * 30 - 1, -92 + Math.sin(a2 * 1.3) * 22, 2, 2);
    }
    // aviso de embestida
    if (warn && Math.floor(T / 3) % 2) {
      ctx.fillStyle = '#ff3030';
      ctx.fillRect(lean - 3, -204, 6, 10); ctx.fillRect(lean - 3, -191, 6, 4);
    }
    ctx.restore();
  }
  const _drawWorldE = drawWorld;
  drawWorld = function () {
    const b = world.boss;
    if (world.stageIdx === MUD_STAGE && b && b.bx !== undefined &&
        (game.state === 'play' || game.state === 'shop' || game.state === 'gameover')) {
      const save = world.boss;
      world.boss = { bx: undefined };       // oculta la figura espectral del Panthokrator
      _drawWorldE();
      world.boss = save;
      ctx.save(); ctx.translate(-Math.round(world.camX), -Math.round(world.camY));
      drawMudBoss(b);
      ctx.restore();
    } else _drawWorldE();
  };
  // nombre del jefe en aviso y barra
  const _updateBossE = updateBoss;
  updateBoss = function () {
    _updateBossE();
    if (world.stageIdx === MUD_STAGE && world.announce === 'ATACA AL PANTHOKRATOR!')
      world.announce = 'ATACA L’AMALGAMA!';
  };
  const _drawBossBarE = drawBossBar;
  drawBossBar = function () {
    const b = world.boss; if (!b || b.bx === undefined) return;
    if (world.stageIdx !== MUD_STAGE) { _drawBossBarE(); return; }
    const w = 200, x = VW / 2 - w / 2, y = 56;
    ctx.fillStyle = 'rgba(5,6,12,.7)'; ctx.fillRect(x - 2, y - 2, w + 4, 11);
    ctx.fillStyle = '#6a7a2a'; ctx.fillRect(x, y, w * Math.max(0, b.hp / b.maxHp), 7);
    ctx.lineWidth = 1; ctx.strokeStyle = '#d8d84a'; ctx.strokeRect(x - 1.5, y - 1.5, w + 3, 10);
    drawText('L’AMALGAMA', VW / 2, y + 11, '#d8d84a', 7, 'center');
  };

  // reskins de enemigos por etapa: pucks/pixies voladores (etapas 2 y 3) y anguilas abisales (etapa 3)
  const _drawDemonE = drawDemon;
  drawDemon = function (e, anim, facingLeft) {
    if (world.stageIdx >= 3 && PIXIE_IMG.complete && PIXIE_IMG.naturalWidth) {
      const bob = Math.sin(game.frame / 6 + e.x) * 1.5;
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2 + bob);
      ctx.scale(facingLeft ? 1 : -1, 1); // el puck mira a la izquierda
      ctx.filter = 'brightness(1.12) drop-shadow(0 0 2.4px rgba(120,255,220,.75))';
      ctx.drawImage(PIXIE_IMG, -20, -15, 40, 37);
      ctx.filter = 'none';
      ctx.restore();
    } else _drawDemonE(e, anim, facingLeft);
  };
  const _drawBeastE = drawBeast;
  drawBeast = function (e, anim) {
    if (world.stageIdx >= 5 && EEL_IMG.complete && EEL_IMG.naturalWidth) {
      const und = Math.sin(game.frame / 7 + e.x * 0.7);
      ctx.save();
      ctx.translate(e.x + e.w / 2, e.y + e.h / 2 + und * 1.2);
      ctx.scale(e.dir < 0 ? 1 : -1, 1); // la anguila mira a la izquierda
      ctx.rotate(und * 0.09);
      ctx.filter = 'drop-shadow(0 0 2px rgba(8,18,28,.85))';
      ctx.drawImage(EEL_IMG, -28, -16, 56, 32);
      ctx.filter = 'none';
      ctx.restore();
    } else _drawBeastE(e, anim);
  };

  window.__etapas = 'v2';
})();
