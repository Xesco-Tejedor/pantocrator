/* audio.js — so nou amb caràcter de màquina recreativa Taito i música original inspirada
   en l'ambient de Black Tiger (Capcom, 1987; sintesi FM tipus YM2203), sense copiar-ne
   cap melodia. Carregat després de game.js: substitueix els mètodes i temes del motor
   bàsic per veus FM de dos operadors, eco de placa i percussió de soroll. */
(function () {
  if (typeof sfx === 'undefined') return;
  Object.assign(sfx, {
  ctx: null, master: null, musicBus: null, leadBus: null, noiseBuf: null,
  muted: false, seqTimer: null, track: null,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.setContext(new AC());
    } catch (e) { this.ctx = null; }
  },
  setContext(ac) {
    this.ctx = ac;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 5;
    comp.attack.value = 0.004; comp.release.value = 0.16;
    this.master = ac.createGain(); this.master.gain.value = this.muted ? 0 : 0.6;
    this.master.connect(comp); comp.connect(ac.destination);
    this.musicBus = ac.createGain(); this.musicBus.gain.value = 0.5;
    this.musicBus.connect(this.master);
    /* eco discret de la melodia, marca de les plaques Taito */
    this.leadBus = ac.createGain(); this.leadBus.gain.value = 1;
    const dly = ac.createDelay(0.5); dly.delayTime.value = 0.19;
    const fb = ac.createGain(); fb.gain.value = 0.26;
    const wet = ac.createGain(); wet.gain.value = 0.3;
    this.leadBus.connect(this.musicBus);
    this.leadBus.connect(dly); dly.connect(fb); fb.connect(dly);
    dly.connect(wet); wet.connect(this.musicBus);
    const len = ac.sampleRate | 0;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); },
  now() { return this.ctx ? this.ctx.currentTime : 0; },
  /* veu FM de dos operadors, estil OPN: el modulador amb envolvent ràpida dóna l'atac metàl·lic */
  fm(f, t, dur, vol, o) {
    if (!this.ctx || this.muted) return;
    o = o || {};
    try {
      const ac = this.ctx;
      const car = ac.createOscillator(); car.type = o.type || 'sine';
      car.frequency.setValueAtTime(f, t);
      if (o.slide) car.frequency.exponentialRampToValueAtTime(Math.max(30, f + o.slide), t + dur);
      const g = ac.createGain();
      const a = o.attack !== undefined ? o.attack : 0.004;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      if (o.ratio) {
        const mod = ac.createOscillator(); mod.type = 'sine';
        mod.frequency.setValueAtTime(f * o.ratio, t);
        const mg = ac.createGain();
        const idx = (o.index !== undefined ? o.index : 3) * f;
        mg.gain.setValueAtTime(idx, t);
        mg.gain.exponentialRampToValueAtTime(Math.max(1, idx * (o.indexEnd !== undefined ? o.indexEnd : 0.06)), t + (o.modDecay || dur * 0.7));
        mod.connect(mg); mg.connect(car.frequency);
        mod.start(t); mod.stop(t + dur + 0.05);
      }
      if (o.vib) {
        const lfo = ac.createOscillator(); lfo.type = 'sine';
        lfo.frequency.setValueAtTime(o.vib.rate, t);
        const lg = ac.createGain();
        lg.gain.setValueAtTime(0.0001, t);
        lg.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.vib.depth), t + (o.vib.delay || 0.07));
        lfo.connect(lg); lg.connect(car.frequency);
        lfo.start(t); lfo.stop(t + dur + 0.05);
      }
      car.connect(g); g.connect(o.bus || this.master);
      car.start(t); car.stop(t + dur + 0.05);
    } catch (e) {}
  },
  /* soroll filtrat per a percussió i cops */
  noise(t, dur, vol, o) {
    if (!this.ctx || this.muted || !this.noiseBuf) return;
    o = o || {};
    try {
      const ac = this.ctx;
      const src = ac.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
      const flt = ac.createBiquadFilter();
      flt.type = o.type || 'highpass';
      flt.frequency.setValueAtTime(o.freq || 6000, t);
      if (o.slideTo) flt.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
      flt.Q.value = o.q || 0.8;
      const g = ac.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(flt); flt.connect(g); g.connect(o.bus || this.master);
      src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.02);
    } catch (e) {}
  },
  kick(t, vol, bus) {
    if (!this.ctx || this.muted) return;
    try {
      const ac = this.ctx;
      const o = ac.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
      const g = ac.createGain();
      g.gain.setValueAtTime(vol || 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      o.connect(g); g.connect(bus || this.master);
      o.start(t); o.stop(t + 0.15);
      this.noise(t, 0.03, 0.1, { type: 'lowpass', freq: 900, bus: bus });
    } catch (e) {}
  },
  hat(t, bus) { this.noise(t, 0.03, 0.045, { type: 'highpass', freq: 8200, bus: bus }); },
  snare(t, bus) {
    this.noise(t, 0.09, 0.13, { type: 'bandpass', freq: 1900, q: 0.9, bus: bus });
    this.fm(185, t, 0.06, 0.09, { ratio: 1.4, index: 2, modDecay: 0.03, bus: bus });
  },
  /* ------- efectes de joc, timbre de recreativa Taito ------- */
  swing()  { const t = this.now(); this.noise(t, 0.09, 0.15, { type: 'bandpass', freq: 2700, slideTo: 700, q: 1.2 }); this.fm(1150, t, 0.06, 0.05, { ratio: 1.5, index: 2.5, modDecay: 0.04, slide: -500 }); },
  hit()    { const t = this.now(); this.fm(520, t, 0.08, 0.22, { ratio: 3.07, index: 5, modDecay: 0.045 }); this.noise(t, 0.05, 0.1, { type: 'highpass', freq: 4200 }); this.fm(135, t, 0.07, 0.15, { ratio: 0.5, index: 1.5, slide: -40 }); },
  smash()  { const t = this.now(); this.kick(t, 0.5); this.noise(t, 0.14, 0.2, { type: 'lowpass', freq: 3200, slideTo: 320 }); },
  pickup() { const t = this.now(); [1318, 1760, 2093, 2637].forEach((f, i) => this.fm(f, t + i * 0.055, 0.09, 0.12, { ratio: 2, index: 1.3, modDecay: 0.04, bus: this.leadBus })); },
  jumpS()  { this.fm(290, this.now(), 0.11, 0.1, { ratio: 1, index: 1.4, modDecay: 0.06, slide: 340 }); },
  grabS()  { const t = this.now(); this.fm(690, t, 0.07, 0.12, { ratio: 2.4, index: 3, modDecay: 0.04 }); this.fm(1040, t + 0.035, 0.06, 0.08, { ratio: 2.4, index: 2, modDecay: 0.03 }); },
  hurtS()  { const t = this.now(); this.fm(330, t, 0.17, 0.2, { ratio: 0.5, index: 2.6, modDecay: 0.1, slide: -190 }); this.noise(t, 0.08, 0.11, { type: 'lowpass', freq: 1300 }); },
  orbS()   { const t = this.now(); this.fm(1567, t, 0.2, 0.1, { ratio: 3, index: 2, modDecay: 0.12, bus: this.leadBus }); this.fm(2093, t + 0.05, 0.16, 0.07, { ratio: 3, index: 1.5, modDecay: 0.1, bus: this.leadBus }); },
  deflect(){ const t = this.now(); this.fm(1975, t, 0.07, 0.15, { ratio: 3.5, index: 6, modDecay: 0.04 }); this.fm(2960, t + 0.05, 0.1, 0.1, { ratio: 3.5, index: 4, modDecay: 0.05 }); },
  deathS() { const t = this.now(); [660, 523, 392, 311, 262].forEach((f, i) => this.fm(f, t + i * 0.13, 0.16, 0.15, { ratio: 1, index: 2.5, modDecay: 0.1, bus: this.leadBus })); this.noise(t + 0.6, 0.25, 0.12, { type: 'lowpass', freq: 800, slideTo: 200 }); },
  clearS() { const t = this.now(); [[523, 0, 0.1], [659, 0.09, 0.1], [784, 0.18, 0.1], [1046, 0.27, 0.1], [784, 0.36, 0.1], [1046, 0.45, 0.1], [1318, 0.54, 0.3]].forEach((s) => this.fm(s[0], t + s[1], s[2], 0.14, { ratio: 2, index: 1.6, modDecay: s[2] * 0.5, bus: this.leadBus })); },
  bossHit(){ const t = this.now(); this.fm(75, t, 0.22, 0.3, { ratio: 0.71, index: 4, modDecay: 0.15, slide: -25 }); this.noise(t, 0.1, 0.15, { type: 'lowpass', freq: 900 }); },
  /* ------- seqüenciador amb lookahead: baix FM + melodia heroica + harmonia + arpegi + percussió -------
     Composicions originals amb caràcter de recreativa Taito i ambient de Black Tiger:
     tonalitat menor, baix per semicorxeres amb octaves, melodia heroica amb vibrato i eco de placa. */
  THEMES: {
    title: { bpm: 96,
      bass: [0, null, null, null, 0, null, 12, null, -4, null, null, null, -4, null, 8, null,
             -7, null, null, null, -7, null, 5, null, -9, null, null, null, -9, null, 3, null],
      mel:  [24, null, null, null, null, null, 26, null, 27, null, null, null, null, null, null, null,
             29, null, null, null, 27, null, null, null, 26, null, 27, null, 24, null, null, null],
      harm: [12, null, null, null, null, null, null, null, 8, null, null, null, null, null, null, null,
             5, null, null, null, null, null, null, null, 7, null, null, null, null, null, null, null],
      arp:  [36, null, 39, null, 43, null, 39, null, 32, null, 36, null, 39, null, 36, null,
             29, null, 32, null, 36, null, 32, null, 31, null, 35, null, 38, null, 35, null],
      perc: [1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 4, 0, 0, 0,
             1, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 2, 4, 0, 2, 0] },
    stage: { bpm: 152, legato: 1.9,
      bass: [0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 10, 12,
             0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 7, 12, 10, 12,
             -4, 8, -4, 8, -4, 8, -4, 8, -4, 8, -4, 8, 3, 8, 5, 8,
             -2, 10, -2, 10, -2, 10, -2, 10, -2, 10, -2, 10, 0, 10, -2, 10],
      mel:  [24, null, null, 24, 27, null, 26, null, 29, null, 27, null, 24, null, null, null,
             31, null, 29, 27, null, null, 26, null, 27, null, 24, null, null, null, null, null,
             29, null, null, 29, 32, null, 31, null, 29, null, 27, null, 29, null, null, null,
             31, null, 32, null, 34, null, 31, null, 29, null, 26, null, 24, null, null, null],
      harm: [12, null, null, null, 12, null, null, null, 12, null, null, null, 12, null, null, null,
             12, null, null, null, 12, null, null, null, 12, null, null, null, 12, null, null, null,
             8, null, null, null, 8, null, null, null, 8, null, null, null, 8, null, null, null,
             10, null, null, null, 10, null, null, null, 10, null, null, null, 10, null, null, null],
      arp:  [36, 39, 43, 39, 36, 39, 43, 39, 36, 39, 43, 39, 36, 39, 43, 41,
             36, 39, 43, 39, 36, 39, 43, 39, 36, 39, 43, 39, 43, 41, 39, 38,
             32, 36, 39, 36, 32, 36, 39, 36, 32, 36, 39, 36, 39, 41, 43, 41,
             34, 38, 41, 38, 34, 38, 41, 38, 34, 38, 41, 38, 36, 38, 41, 43],
      perc: [1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 2,
             1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 2,
             1, 0, 2, 0, 4, 0, 2, 0, 1, 0, 2, 0, 4, 0, 2, 2,
             1, 0, 2, 0, 4, 0, 2, 2, 1, 0, 2, 0, 4, 2, 4, 2] },
    boss:  { bpm: 168, legato: 1.5,
      bass: [0, 0, 12, 0, 11, 11, 12, 11, 0, 0, 12, 0, 8, 8, 10, 11,
             0, 0, 12, 0, 11, 11, 12, 11, 0, 0, 12, 0, 13, 12, 11, 10,
             0, 0, 12, 0, 11, 11, 12, 11, 0, 0, 12, 0, 8, 8, 10, 11,
             0, 0, 12, 0, 11, 11, 12, 11, 0, 0, 12, 0, 13, 12, 11, 10],
      mel:  [24, null, 24, 27, null, 26, 27, null, 29, null, 31, null, 29, 27, 26, null,
             24, null, 24, 27, null, 26, 27, null, 31, null, 29, 27, 26, null, 27, null,
             24, null, 24, 27, null, 26, 27, null, 29, null, 31, null, 29, 27, 26, null,
             34, null, 31, null, 29, null, 27, null, 26, 27, 26, 24, null, null, null, null],
      harm: [12, null, null, null, 11, null, null, null, 12, null, null, null, 8, null, 10, null,
             12, null, null, null, 11, null, null, null, 12, null, null, null, 13, null, 10, null,
             12, null, null, null, 11, null, null, null, 12, null, null, null, 8, null, 10, null,
             19, null, null, null, 17, null, null, null, 15, null, null, null, 14, null, null, null],
      arp:  [36, 39, 43, 39, 35, 38, 43, 38, 36, 39, 43, 39, 32, 36, 41, 36,
             36, 39, 43, 39, 35, 38, 43, 38, 36, 39, 43, 39, 37, 40, 44, 40,
             36, 39, 43, 39, 35, 38, 43, 38, 36, 39, 43, 39, 32, 36, 41, 36,
             36, 39, 43, 39, 35, 38, 43, 38, 39, 43, 46, 43, 38, 41, 46, 41],
      perc: [1, 0, 2, 1, 4, 2, 1, 0, 1, 0, 2, 1, 4, 0, 2, 2,
             1, 0, 2, 1, 4, 2, 1, 0, 1, 0, 2, 1, 4, 0, 2, 2,
             1, 0, 2, 1, 4, 2, 1, 0, 1, 0, 2, 1, 4, 0, 2, 2,
             1, 0, 2, 1, 4, 2, 1, 0, 1, 2, 1, 2, 4, 2, 6, 2] }
  },
  ROOT: 110,
  nfreq(n) { return this.ROOT * Math.pow(2, n / 12); },
  bassNote(f, t, dur) { this.fm(f, t, dur * 0.95, 0.42, { ratio: 0.5, index: 2.2, modDecay: dur * 0.4, attack: 0.003, bus: this.musicBus }); },
  leadNote(f, t, dur) { this.fm(f, t, dur, 0.16, { ratio: 1, index: 3.4, modDecay: dur * 0.55, attack: 0.005, vib: { rate: 5.6, depth: f * 0.011, delay: 0.08 }, bus: this.leadBus }); },
  harmNote(f, t, dur) { this.fm(f, t, dur, 0.055, { ratio: 2, index: 1.6, modDecay: dur * 0.4, bus: this.musicBus }); },
  arpNote(f, t, dur) { this.fm(f, t, dur * 0.6, 0.045, { ratio: 2, index: 1.2, modDecay: dur * 0.3, bus: this.leadBus }); },
  scheduleStep(th, i, t, spb) {
    const pick = (arr) => (arr ? arr[i % arr.length] : null);
    const b = pick(th.bass);
    if (b !== null && b !== undefined) this.bassNote(this.nfreq(b), t, spb);
    const m = pick(th.mel);
    if (m !== null && m !== undefined) this.leadNote(this.nfreq(m), t, spb * (th.legato || 1.9));
    const h = pick(th.harm);
    if (h !== null && h !== undefined) { this.harmNote(this.nfreq(h), t, spb * 1.6); this.harmNote(this.nfreq(h + 7), t, spb * 1.6); }
    const a = pick(th.arp);
    if (a !== null && a !== undefined) this.arpNote(this.nfreq(a), t, spb);
    const p = pick(th.perc);
    if (p) {
      if (p & 1) this.kick(t, 0.42, this.musicBus);
      if (p & 2) this.hat(t, this.musicBus);
      if (p & 4) this.snare(t, this.musicBus);
    }
  },
  playMusic(name) {
    if (!this.ctx) return;
    this.stopMusic();
    this.track = name;
    const th = this.THEMES[name]; if (!th) return;
    let step = 0;
    const spb = 60 / th.bpm / 4; // semicorxeres
    let nextT = this.ctx.currentTime + 0.08;
    const pump = () => {
      if (!this.ctx || this.track !== name) return;
      const horizon = this.ctx.currentTime + 0.2;
      while (nextT < horizon) { this.scheduleStep(th, step, nextT, spb); step++; nextT += spb; }
    };
    pump();
    this.seqTimer = setInterval(pump, 40);
  },
  stopMusic() { if (this.seqTimer) { clearInterval(this.seqTimer); this.seqTimer = null; } this.track = null; },
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
  }
  });
})();
