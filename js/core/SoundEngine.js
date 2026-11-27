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
    roll: {
      f: 2400,
      q: 0.7,
      vol: 0.045,
    },
  };
  constructor() {
    this.ctx = null;
    this.master = null;
    this.nbuf = null;
    this.armed = false;
    this.isMuted = false;
    this.loops = {};
    this.music = null;
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
        this.noise(0.05, { f: 600, filter: "lowpass", vol: 0.3 });
        this.tone(120, 0.08, { to: 60, vol: 0.25 });
        this.tone(1976, 0.18, { type: "triangle", vol: 0.08, at: 0.05 });
        this.tone(2637, 0.3, { type: "triangle", vol: 0.08, at: 0.12 });
        [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => this.tone(f, 0.1, { type: "square", vol: 0.04, at: 0.2 + i * 0.035 }));
        this.noise(0.5, { f: 1400, q: 0.7, vol: 0.07, at: 0.15 });
      },
      wheelTick: (power = 1) => {
        this.noise(0.014, { f: 4200, q: 3, vol: 0.07 + power * 0.06 });
        this.tone(3000 + Math.random() * 700, 0.014, { type: "triangle", vol: 0.025 + power * 0.02 });
      },
      wheelBar: (o) => this.casinoBar(o),
      wheelCharge: (length = 2) => {
        const d = Math.max(0.6, Math.min(4, length + 0.3));
        this.tone(160, d, { to: 1600, vol: 0.05, type: "sawtooth", bus: true });
        this.noise(d, { f: 2500, q: 0.7, vol: 0.04, bus: true });
      },
      wheelBoom: () => {
        this.cutMusic();
        this.tone(60, 1.4, { to: 22, vol: 0.5 });
        this.noise(0.3, { f: 300, filter: "lowpass", vol: 0.35, at: 0.14 });
        this.noise(0.3, { f: 300, filter: "lowpass", vol: 0.3, at: 0.28 });
        this.tone(90, 0.9, { to: 30, vol: 0.45 });
        this.noise(0.9, { f: 500, filter: "lowpass", vol: 0.4 });
        this.noise(0.25, { f: 4000, filter: "highpass", vol: 0.15 });
      },
      wheelWin: () => {
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, { type: "square", vol: 0.07, at: 0.05 + i * 0.06 }));
        [523, 659, 784, 1047, 1319].forEach((f) => {
          this.tone(f, 1.3, { type: "triangle", vol: 0.06, at: 0.3 });
          this.tone(f * 1.003, 1.1, { type: "square", vol: 0.018, at: 0.3 });
        });
        for (let i = 0; i < 24; i++) this.tone(i % 2 ? 1568 : 2093, 0.05, { type: "triangle", vol: 0.035, at: 0.3 + i * 0.05 });
        for (let i = 0; i < 26; i++) this.tone(1800 + Math.random() * 1800, 0.08, { type: "triangle", vol: 0.035, at: 0.2 + Math.random() * 1.5 });
      },
      wkKey: () => this.tone(1300 + Math.random() * 300, 0.03, { type: "triangle", vol: 0.03 }),
      wkMiss: () => this.tone(170, 0.1, { type: "square", vol: 0.05 }),
      wkHit: () => {
        this.tone(260, 0.16, { to: 1040, type: "sawtooth", vol: 0.04 });
        this.noise(0.16, { f: 3200, q: 0.7, vol: 0.1 });
        this.tone(110, 0.28, { to: 45, vol: 0.32, at: 0.06 });
        this.tone(1319, 0.18, { type: "triangle", vol: 0.06, at: 0.06 });
        this.tone(1976, 0.14, { type: "triangle", vol: 0.035, at: 0.1 });
      },
      fwBang: () => {
        this.noise(0.35, { f: 900, q: 0.4, vol: 0.5 });
        this.noise(0.08, { f: 4500, filter: "highpass", vol: 0.35 });
        this.tone(140, 0.4, { to: 40, vol: 0.45 });
      },
      fwHit: () => {
        this.tone(90, 0.3, { to: 45, vol: 0.4, at: 0.05 });
        this.noise(0.2, { f: 300, filter: "lowpass", vol: 0.25, at: 0.05 });
      },
      fwSignal: () => {
        [1568, 2093, 3136].forEach((f, i) => this.tone(f, 0.9 - i * 0.2, { type: "triangle", vol: 0.12 / (i + 1) }));
        this.tone(784, 0.6, { type: "square", vol: 0.03 });
      },
      fwBeat: () => {
        this.tone(70, 0.12, { to: 50, vol: 0.28 });
        this.tone(65, 0.12, { to: 45, vol: 0.2, at: 0.16 });
      },
      fwWind: () => this.noise(2.2, { f: 700, q: 0.4, vol: 0.05 }),
      fwRound: () => this.arp([165, 247, 330, 392], 0.07, { vol: 0.1, d: 0.5 }),
      fwEarly: () => {
        this.tone(220, 0.25, { to: 110, type: "square", vol: 0.07 });
        this.tone(233, 0.25, { to: 116, type: "square", vol: 0.05 });
      },
      fwRoundWin: () => [392, 494, 587, 784].forEach((f, i) => this.tone(f, 0.35, { type: "triangle", vol: 0.12, at: 0.25 + i * 0.08 })),
      fwRoundLose: () => [392, 330, 262].forEach((f, i) => this.tone(f, 0.4, { type: "square", vol: 0.06, at: 0.25 + i * 0.12 })),
      fwWin: () => {
        this.arp([392, 523, 659, 784], 0.13, { type: "sawtooth", vol: 0.06, d: 0.35 });
        [523, 659, 784, 1047].forEach((f) => this.tone(f, 1.4, { type: "sawtooth", vol: 0.03, at: 0.6 }));
        this.tone(2093, 1.2, { type: "triangle", vol: 0.06, at: 0.6 });
      },
      fwLose: () => {
        [392, 370, 349, 294].forEach((f, i) => this.tone(f, i === 3 ? 1 : 0.4, { to: f * 0.94, type: "square", vol: 0.06, at: i * 0.42 }));
      },
      fbChip: () => {
        this.noise(0.03, { f: 3800, q: 2, vol: 0.18 });
        this.noise(0.03, { f: 3200, q: 2, vol: 0.12, at: 0.05 });
        this.tone(1900, 0.03, { type: "triangle", vol: 0.04 });
      },
      fbTick: (k = 1) => this.noise(0.02, { f: 2600 + Math.random() * 600, q: 3, vol: 0.05 + 0.1 * k }),
      fbClose: () => {
        [988, 1319].forEach((f, i) => this.tone(f, 0.7, { type: "triangle", vol: 0.1, at: i * 0.14 }));
        this.tone(659, 0.9, { type: "sine", vol: 0.06, at: 0.28 });
      },
      fbSpin: () => {
        this.noise(0.5, { f: 1800, q: 0.5, vol: 0.1 });
        this.tone(220, 0.4, { to: 660, type: "triangle", vol: 0.05 });
      },
      fbLand: () => {
        this.noise(0.05, { f: 3000, q: 1.5, vol: 0.25 });
        this.noise(0.04, { f: 2600, q: 2, vol: 0.12, at: 0.09 });
        this.noise(0.03, { f: 2400, q: 2, vol: 0.06, at: 0.16 });
      },
      fbJoin: () => this.arp([659, 880], 0.08, { vol: 0.07, d: 0.2 }),
      wjCard: () => {
        this.noise(0.09, { f: 2200, q: 0.8, vol: 0.12 });
        this.noise(0.03, { f: 3600, q: 2, vol: 0.08, at: 0.08 });
      },
      wjFlip: () => {
        this.noise(0.05, { f: 3000, q: 1.2, vol: 0.12 });
        this.tone(900, 0.05, { to: 1300, type: "triangle", vol: 0.03 });
      },
      wjShuffle: () => {
        for (let i = 0; i < 14; i++) this.noise(0.03, { f: 2400 + Math.random() * 1600, q: 1.5, vol: 0.07, at: i * 0.045 });
      },
      wjTurn: () => this.arp([784, 1047, 1319], 0.07, { vol: 0.08, d: 0.25 }),
      chatPing: () => this.arp([1175, 1568], 0.06, { vol: 0.05, d: 0.15 }),
      fbGift: () => this.arp([523, 659, 784, 1047, 1319], 0.07, { vol: 0.1 }),
      fbCoins: () => {
        for (let i = 0; i < 8; i++) this.tone(1800 + Math.random() * 1500, 0.08, { type: "triangle", vol: 0.03, at: i * 0.06 });
      },
      fbLose: () => this.arp([392, 349, 294], 0.13, { vol: 0.07, d: 0.3, type: "square" }),
      fbWin: (level = 1) => {
        const notes = [523, 659, 784, 1047, 1319, 1568, 2093].slice(0, 3 + level);
        this.arp(notes, 0.08, { vol: 0.12, d: 0.3 });
        const at = notes.length * 0.08;
        if (level >= 2) [523, 659, 784, 1047].forEach((f) => this.tone(f, 0.6 + level * 0.25, { type: "sawtooth", vol: 0.02 + level * 0.004, at }));
        for (let i = 0; i < 6 + level * 8; i++) this.tone(1700 + Math.random() * 1900, 0.08, { type: "triangle", vol: 0.03, at: at + Math.random() * (0.5 + level * 0.35) });
        if (level >= 4) {
          this.tone(80, 0.8, { to: 40, vol: 0.35, at });
          this.noise(0.8, { f: 2400, q: 0.5, vol: 0.14, at });
        }
        if (level >= 5) for (let i = 0; i < 4; i++) this.noise(0.3, { f: 5000, filter: "highpass", vol: 0.1, at: at + 0.4 + i * 0.35 });
      },
      wkPart: () => {
        this.tone(260, 0.12, { to: 520, type: "sawtooth", vol: 0.03 });
        this.tone(110, 0.2, { to: 55, vol: 0.2, at: 0.04 });
        this.tone(880, 0.12, { type: "triangle", vol: 0.04, at: 0.04 });
      },
      wkFoe: () => {
        this.noise(0.14, { f: 1300, q: 0.8, vol: 0.08 });
        this.tone(140, 0.26, { to: 50, vol: 0.24, at: 0.05 });
        this.tone(330, 0.14, { type: "square", vol: 0.022, at: 0.05 });
      },
      wkCount: () => {
        this.tone(660, 0.18, { type: "square", vol: 0.05 });
        this.tone(80, 0.25, { to: 40, vol: 0.25 });
      },
      wkGo: () => {
        [392, 523, 659, 784].forEach((f) => this.tone(f, 0.7, { type: "sawtooth", vol: 0.035 }));
        this.tone(1568, 0.5, { type: "triangle", vol: 0.06 });
        this.noise(0.6, { f: 2400, q: 0.5, vol: 0.12 });
        this.tone(120, 0.5, { to: 35, vol: 0.38 });
      },
      wkJoin: () => this.arp([523, 659, 784, 1047], 0.08, { vol: 0.1 }),
      wkWin: () => {
        this.arp([523, 659, 784, 1047, 1319], 0.1, { vol: 0.12, d: 0.3 });
        [523, 659, 784, 1047].forEach((f) => this.tone(f, 1.4, { type: "sawtooth", vol: 0.025, at: 0.55 }));
        this.tone(2093, 1, { type: "triangle", vol: 0.05, at: 0.55 });
        for (let i = 0; i < 16; i++) this.noise(0.08, { f: 4000 + Math.random() * 3000, q: 2, vol: 0.05, at: 0.6 + Math.random() * 1.2 });
      },
      wkLose: () => {
        this.arp([392, 349, 311, 262], 0.16, { vol: 0.1, d: 0.35, type: "square" });
        this.tone(98, 0.9, { to: 55, vol: 0.2, at: 0.5 });
      },
    };
  }

  static CASINO = {
    sixteenth: 60 / 168 / 4,
    roots: [48, 45, 41, 43],
    shapes: [[0, 4, 7], [0, 3, 7], [0, 4, 7], [0, 4, 7]],
  };

  static midi(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  casinoBar({ step = 0, energy = 1, build = 0, lead = 0 } = {}) {
    if (!this.ac()) return;
    const C = SoundEngine.CASINO;
    const s = C.sixteenth;
    const chord = Math.floor(step / 2) % C.roots.length;
    const root = C.roots[chord];
    const tones = C.shapes[chord];
    const at = (k) => lead + k * s;
    const bus = true;
    [0, 4].forEach((k) => this.tone(160, 0.14, { to: 40, vol: 0.3, at: at(k), bus }));
    this.noise(0.09, { f: 1600, q: 0.9, vol: 0.1, at: at(4), bus });
    for (let k = 0; k < 8; k++) this.noise(k % 2 ? 0.02 : 0.05, { f: 7500, filter: "highpass", vol: k % 2 ? 0.02 : 0.05, at: at(k), bus });
    [0, 2, 4, 6].forEach((k, i) => this.tone(SoundEngine.midi(root + (i % 2 ? 24 : 12)), 0.1, { type: "triangle", vol: 0.16, at: at(k), bus }));
    [2, 6].forEach((k) => tones.forEach((t) => this.tone(SoundEngine.midi(root + 24 + t), 0.07, { type: "square", vol: 0.022, at: at(k), bus })));
    const bells = energy > 0.6 ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 3, 5];
    bells.forEach((k) => {
      if (Math.random() > 0.35 + energy * 0.5) return;
      const t = tones[Math.floor(Math.random() * 3)] + 12 * (Math.random() < 0.5 ? 3 : 4);
      this.tone(SoundEngine.midi(root + t), 0.16, { type: "triangle", vol: 0.04, at: at(k), bus });
    });
    if (build > 0) {
      const hits = build > 0.6 ? 16 : 8;
      for (let k = 0; k < hits; k++) this.noise(0.04, { f: 2200, q: 0.8, vol: 0.03 + 0.1 * build * (k / hits), at: lead + (k * 8 * s) / hits, bus });
    }
  }

  out(o) {
    if (!o.bus) return this.master;
    if (!this.music) {
      this.music = this.ctx.createGain();
      this.music.gain.value = 1;
      this.music.connect(this.master);
    }
    return this.music;
  }

  cutMusic() {
    if (!this.music || !this.ctx) return;
    const bus = this.music;
    this.music = null;
    bus.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    setTimeout(() => bus.disconnect(), 400);
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
    g.connect(this.out(o));
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
    g.connect(this.out(o));
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
    this.cutMusic();
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
