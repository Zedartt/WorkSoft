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
      escape: () =>
        this.tone(620, 0.32, {
          to: 140,
          type: "sawtooth",
          vol: 0.09,
        }),
    };
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
