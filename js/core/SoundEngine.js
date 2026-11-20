class SoundEngine {
  static LOOPS = {
    sizzle: {
      f: 4500,
      filter: "highpass",
      vol: 0.07,
    },
    pour: {
      f: 1700,
      q: 0.6,
      vol: 0.1,
    },
    hum: {
      f: 160,
      filter: "lowpass",
      vol: 0.25,
    },
  };
  constructor() {
    this.ctx = null;
    this.master = null;
    this.nbuf = null;
    this.armed = false;
    this.isMuted = false;
    this.loops = {};
    try {
      this.isMuted = localStorage.getItem("worksoft_mute") === "1";
    } catch (e) {}
    window.addEventListener("pointerdown", (...args) => this.arm(...args), true);
    window.addEventListener("keydown", (...args) => this.arm(...args), true);
    this.sounds = {
      hover: () =>
        this.tone(720, 0.04, {
          vol: 0.05,
        }),
      click: () =>
        this.tone(520, 0.05, {
          vol: 0.1,
          type: "triangle",
        }),
      select: () =>
        this.tone(380, 0.28, {
          to: 900,
          vol: 0.16,
          type: "triangle",
        }),
      start: () => this.arp([523, 659, 784, 1047], 0.08),
      back: () =>
        this.tone(520, 0.16, {
          to: 260,
          vol: 0.13,
          type: "triangle",
        }),
      key: () =>
        this.tone(1000 + Math.random() * 250, 0.025, {
          type: "square",
          vol: 0.035,
        }),
      bad: () =>
        this.tone(170, 0.14, {
          type: "sawtooth",
          vol: 0.1,
        }),
      word: () =>
        this.tone(880, 0.07, {
          vol: 0.1,
        }),
      win: () => this.arp([523, 659, 784, 1047, 1319], 0.09),
      lose: () =>
        this.arp([392, 330, 262, 196], 0.16, {
          d: 0.3,
        }),
      pop: () =>
        this.tone(480, 0.08, {
          to: 900,
          vol: 0.14,
        }),
      drop: () => {
        this.tone(300, 0.09, {
          to: 150,
          vol: 0.2,
        });
        this.noise(0.05, {
          f: 700,
          vol: 0.08,
        });
      },
      knock: (v) => {
        this.noise(0.05, {
          f: 900,
          q: 2,
          vol: 0.3 * v,
        });
        this.tone(190, 0.06, {
          vol: 0.25 * v,
          type: "triangle",
        });
      },
      chop: () => {
        this.noise(0.04, {
          f: 2400,
          vol: 0.22,
        });
        this.tone(140, 0.05, {
          vol: 0.22,
          type: "triangle",
        });
      },
      stir: () =>
        this.noise(0.09, {
          f: 500 + Math.random() * 300,
          q: 0.8,
          vol: 0.09,
        }),
      shake: () =>
        this.noise(0.06, {
          f: 5200,
          q: 1.5,
          vol: 0.16,
        }),
      crack: () => {
        this.noise(0.05, { f: 1800, q: 3, vol: 0.28 });
        this.tone(420, 0.04, { to: 200, vol: 0.12, type: "triangle" });
      },
      grate: () => this.noise(0.08, { f: 3800, q: 2.5, vol: 0.14 }),
      squeeze: () => this.noise(0.12, { f: 900, q: 1.2, vol: 0.1 }),
      peel: () => this.noise(0.07, { f: 2800, q: 1.8, vol: 0.13 }),
      roll: () => this.noise(0.14, { f: 300, filter: "lowpass", vol: 0.18 }),
      flip: () => this.tone(360, 0.08, { to: 720, vol: 0.14, type: "triangle" }),
      knead: () => {
        this.noise(0.08, { f: 260, filter: "lowpass", vol: 0.25 });
        this.tone(110, 0.07, { vol: 0.16, type: "triangle" });
      },
      ding: () => {
        this.tone(1568, 0.7, {
          vol: 0.22,
        });
        this.tone(2093, 0.7, {
          vol: 0.08,
        });
      },
      bell: () => {
        this.tone(1319, 0.3, {
          vol: 0.16,
        });
        this.tone(1760, 0.45, {
          vol: 0.16,
          at: 0.13,
        });
      },
      fridge: () => {
        this.tone(105, 0.14, {
          type: "triangle",
          vol: 0.3,
        });
        this.noise(0.09, {
          f: 320,
          vol: 0.14,
        });
      },
      paper: () =>
        this.noise(0.13, {
          f: 3200,
          q: 0.7,
          vol: 0.1,
        }),
      cash: () =>
        this.arp([1047, 1319, 1568, 2093], 0.06, {
          vol: 0.14,
          type: "sine",
        }),
      splat: () => {
        this.noise(0.16, {
          f: 500,
          filter: "lowpass",
          vol: 0.3,
        });
        this.tone(320, 0.16, {
          to: 80,
          vol: 0.2,
        });
      },
      miss: () =>
        this.tone(240, 0.1, {
          to: 190,
          vol: 0.07,
          type: "triangle",
        }),
      whoosh: () =>
        this.noise(0.4, {
          f: 900,
          q: 0.8,
          vol: 0.06,
        }),
      escape: () =>
        this.tone(620, 0.32, {
          to: 140,
          type: "sawtooth",
          vol: 0.09,
        }),
      hoopBounce: (power = 1) => {
        this.tone(95, 0.2, { to: 52, vol: 0.38 * power });
        this.tone(230, 0.12, { to: 190, type: "triangle", vol: 0.07 * power });
        this.noise(0.07, { f: 380, filter: "lowpass", vol: 0.16 * power });
      },
      hoopRim: (power = 1) => {
        [
          [520, 0.55],
          [1310, 0.4],
          [2170, 0.28],
          [3460, 0.16],
        ].forEach(([f, d]) => this.tone(f * (0.98 + Math.random() * 0.04), d, { vol: 0.09 * power }));
        this.noise(0.04, { f: 5000, filter: "highpass", vol: 0.08 * power });
      },
      hoopBoard: (power = 1) => {
        this.tone(150, 0.16, { to: 85, type: "triangle", vol: 0.3 * power });
        this.noise(0.08, { f: 900, vol: 0.18 * power });
      },
      hoopTap: () => {
        this.tone(300, 0.14, { to: 760, type: "triangle", vol: 0.12 });
        this.noise(0.12, { f: 1800, q: 0.7, vol: 0.05 });
      },
      hoopSwish: (power = 1) => {
        this.noise(0.32, { f: 2900, q: 0.6, vol: 0.2 * power });
        this.noise(0.24, { f: 1300, q: 0.9, vol: 0.12 * power, at: 0.05 });
      },
      hoopCheer: (power = 1) => {
        this.noise(1.2 + power, { f: 950, q: 0.45, vol: 0.2 * power, at: 0.08 });
        this.noise(0.9 + power, { f: 1900, q: 0.7, vol: 0.09 * power, at: 0.15 });
        for (let i = 0; i < 6; i++)
          this.tone(320 + Math.random() * 260, 0.5 + Math.random() * 0.5, { to: 520 + Math.random() * 300, type: "sawtooth", vol: 0.012 * power, at: 0.1 + Math.random() * 0.4 });
        if (power > 0.75) this.arp([523, 659, 784, 1047], 0.1, { vol: 0.08 });
      },
      hoopLights: () => this.arp([1568, 2093, 1568, 2093], 0.07, { vol: 0.05, type: "square", d: 0.06 }),
      hoopDunk: () => {
        this.tone(80, 0.7, { to: 32, vol: 0.55 });
        this.noise(0.5, { f: 260, filter: "lowpass", vol: 0.4 });
      },
      hoopGlass: () => {
        this.noise(0.6, { f: 4500, filter: "highpass", vol: 0.22 });
        for (let i = 0; i < 14; i++) this.tone(2200 + Math.random() * 4200, 0.08 + Math.random() * 0.2, { vol: 0.05, at: Math.random() * 0.45 });
      },
      hoopDraw: () => {
        this.tone(140, 0.5, { to: 230, type: "triangle", vol: 0.06 });
        this.noise(0.4, { f: 700, q: 2, vol: 0.03 });
      },
      hoopArc: (power = 1) => {
        this.tone(380 + power * 200, 0.22, { to: 110, type: "sawtooth", vol: 0.08 });
        this.tone(190, 0.3, { to: 150, vol: 0.12 });
        this.noise(0.25, { f: 2400, q: 0.8, vol: 0.08 + power * 0.06 });
      },
      hoopBubbles: () => {
        for (let i = 0; i < 6; i++) this.tone(600 + Math.random() * 900, 0.08, { to: 1400 + Math.random() * 800, vol: 0.05, at: i * 0.06 });
      },
      hoopThunder: () => {
        this.noise(0.12, { f: 3500, filter: "highpass", vol: 0.18 });
        this.noise(1.1, { f: 180, filter: "lowpass", vol: 0.35, at: 0.05 });
        this.tone(55, 0.9, { to: 30, vol: 0.25, at: 0.05 });
      },
      hoopStreak: (count = 2) => {
        const level = Math.min(count, 6);
        const notes = [392, 494, 587, 698, 784, 988, 1175].slice(0, level + 1);
        this.arp(notes, 0.075, { vol: 0.09, type: "square", d: 0.12 });
        if (level >= 6) {
          [130, 196, 262].forEach((f) => this.tone(f, 1.4, { type: "sawtooth", vol: 0.07, at: 0.5 }));
          this.tone(70, 1, { to: 35, vol: 0.4, at: 0.5 });
        }
      },
      hoopFire: () => this.noise(0.8, { f: 420, q: 0.5, vol: 0.22 }),
      hoopLaunch: () => this.noise(0.45, { f: 1600, q: 1.2, vol: 0.06 }),
      hoopFirework: () => {
        this.tone(110, 0.35, { to: 45, vol: 0.3 });
        this.noise(0.3, { f: 600, filter: "lowpass", vol: 0.25 });
        for (let i = 0; i < 8; i++) this.noise(0.03, { f: 5200, filter: "highpass", vol: 0.07, at: 0.15 + Math.random() * 0.5 });
      },
      horseCurry: () => this.noise(0.09, { f: 700, q: 1.5, vol: 0.12 }),
      horseBrush: () => this.noise(0.07, { f: 3200, q: 1.2, vol: 0.12 }),
      horseSoft: () => this.noise(0.12, { f: 1800, q: 0.8, vol: 0.06 }),
      horseComb: () => this.noise(0.06, { f: 4800, q: 3, vol: 0.08 }),
      horseSpray: () => this.noise(0.18, { f: 6000, filter: "highpass", vol: 0.08 }),
      horseLather: () => this.tone(500 + Math.random() * 500, 0.05, { to: 1400, vol: 0.05 }),
      horseScrape: () => this.noise(0.08, { f: 2200, q: 4, vol: 0.12 }),
      horseHammer: () => {
        this.tone(1900, 0.12, { vol: 0.12, type: "triangle" });
        this.noise(0.03, { f: 3000, q: 2, vol: 0.2 });
      },
      horsePet: () => this.noise(0.15, { f: 500, filter: "lowpass", vol: 0.08 }),
      horseCrunch: () => {
        for (let i = 0; i < 4; i++) this.noise(0.05, { f: 1500 + Math.random() * 1500, q: 2, vol: 0.18, at: i * 0.13 });
      },
      horseMunch: () => {
        for (let i = 0; i < 4; i++) this.noise(0.08, { f: 900, q: 1, vol: 0.1, at: i * 0.18 });
      },
      horseDrink: () => {
        for (let i = 0; i < 5; i++) this.tone(220 + Math.random() * 60, 0.09, { to: 140, vol: 0.14, at: i * 0.22 });
      },
      horseStep: () => this.tone(880, 0.1, { to: 1320, vol: 0.08, type: "triangle" }),
      horseNeigh: () => {
        for (let i = 0; i < 14; i++) this.tone(980 - i * 38 + (i % 2 ? 70 : -70), 0.07, { vol: 0.07, type: "triangle", at: i * 0.055 });
        this.noise(0.25, { f: 400, filter: "lowpass", vol: 0.18, at: 0.8 });
      },
      horseSnort: () => this.noise(0.3, { f: 500, q: 0.7, vol: 0.16 }),
      horseHoof: () => {
        this.knockAt(0);
        this.knockAt(0.12);
      },
      horseWalk: () => {
        for (let i = 0; i < 6; i++) this.knockAt(i * 0.17);
      },
      wheelStart: () => {
        this.noise(0.6, { f: 900, q: 0.8, vol: 0.12 });
        this.tone(220, 0.5, { to: 660, vol: 0.1, type: "sawtooth" });
      },
      wheelTick: (power = 1) => {
        this.tone(1500 + power * 700, 0.03, { type: "square", vol: 0.05 + power * 0.04 });
        this.noise(0.02, { f: 3000, q: 2, vol: 0.08 });
      },
      wheelCharge: (length = 2) => {
        const d = Math.max(0.6, Math.min(4, length + 0.3));
        this.tone(160, d, { to: 1600, vol: 0.09, type: "sawtooth" });
        this.tone(240, d, { to: 2400, vol: 0.05, type: "square" });
        this.noise(d, { f: 2500, q: 0.7, vol: 0.06 });
      },
      wheelBoom: () => {
        this.tone(60, 1.4, { to: 22, vol: 0.5 });
        this.noise(0.3, { f: 300, filter: "lowpass", vol: 0.35, at: 0.14 });
        this.noise(0.3, { f: 300, filter: "lowpass", vol: 0.3, at: 0.28 });
        this.tone(90, 0.9, { to: 30, vol: 0.45 });
        this.noise(0.9, { f: 500, filter: "lowpass", vol: 0.4 });
        this.noise(0.25, { f: 4000, filter: "highpass", vol: 0.15 });
        for (let i = 0; i < 10; i++) this.noise(0.03, { f: 5200, filter: "highpass", vol: 0.06, at: 0.2 + Math.random() * 0.7 });
      },
      wheelWin: () => this.arp([523, 659, 784, 1047, 1319, 1568], 0.07, { vol: 0.12, d: 0.35 }),
    };
  }

  knockAt(at) {
    this.noise(0.04, { f: 1100, q: 3, vol: 0.22, at });
    this.tone(240, 0.05, { vol: 0.16, type: "triangle", at });
  }

  arm() {
    this.armed = true;
  }

  ac() {
    if (!this.armed || this.isMuted) return null;
    if (!this.ctx) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      this.ctx = new A();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this.nbuf = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const d = this.nbuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  tone(f, d, o = {}) {
    const c = this.ac();
    if (!c) return;
    const t = c.currentTime + (o.at || 0),
      osc = c.createOscillator(),
      g = c.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + d + 0.03);
  }

  src(o) {
    const s = this.ctx.createBufferSource(),
      f = this.ctx.createBiquadFilter(),
      g = this.ctx.createGain();
    s.buffer = this.nbuf;
    s.loop = true;
    f.type = o.filter || "bandpass";
    f.frequency.value = o.f || 1200;
    f.Q.value = o.q || 1;
    s.connect(f);
    f.connect(g);
    g.connect(this.master);
    return {
      s,
      g,
    };
  }

  noise(d, o = {}) {
    const c = this.ac();
    if (!c) return;
    const t = c.currentTime + (o.at || 0),
      n = this.src(o);
    n.g.gain.setValueAtTime(0.0001, t);
    n.g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + 0.01);
    n.g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    n.s.start(t, Math.random() * 0.9);
    n.s.stop(t + d + 0.03);
  }

  arp(notes, step, o) {
    return notes.forEach((f, i) =>
      this.tone(
        f,
        (o && o.d) || 0.22,
        Object.assign(
          {
            at: i * step,
            vol: 0.16,
            type: "triangle",
          },
          o,
        ),
      ),
    );
  }

  loop(name, on) {
    if (on) {
      if (this.loops[name] || !this.ac()) return;
      const n = this.src(SoundEngine.LOOPS[name]);
      n.g.gain.value = SoundEngine.LOOPS[name].vol;
      n.s.start();
      this.loops[name] = n;
    } else if (this.loops[name]) {
      const n = this.loops[name];
      delete this.loops[name];
      try {
        n.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
        n.s.stop(this.ctx.currentTime + 0.3);
      } catch (e) {}
    }
  }

  stopAll() {
    return Object.keys(this.loops).forEach((k) => this.loop(k, false));
  }

  play(n, a) {
    try {
      this.sounds[n](a);
    } catch (e) {}
  }

  muted() {
    return this.isMuted;
  }

  toggle() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.stopAll();
    try {
      localStorage.setItem("worksoft_mute", this.isMuted ? "1" : "0");
    } catch (e) {}
    return this.isMuted;
  }
}

const Sfx = new SoundEngine();
