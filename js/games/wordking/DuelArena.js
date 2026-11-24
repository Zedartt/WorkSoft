class DuelArena {
  static COLORS = {
    me: { deep: "#0a2f78", main: "#2f8bff", hot: "#9fdcff" },
    foe: { deep: "#6e0a18", main: "#ff3048", hot: "#ffc0a0" },
  };
  static FONT = "'Segoe UI', system-ui, sans-serif";
  static PULSE_TIME = 0.2;
  static SPRING = 12;
  static KICK = 0.22;
  static CLASH_RATE = 50;
  static DANGER = 0.7;
  static FIREWORK_EVERY = 0.26;
  static PARTY_TIME = 3.5;
  static BEAMS = [
    { side: "me", x: -0.02, y: 1.05, speed: 0.9, phase: 0 },
    { side: "me", x: 0.1, y: -0.05, speed: 1.3, phase: 2 },
    { side: "foe", x: 1.02, y: 1.05, speed: 1.1, phase: 1 },
    { side: "foe", x: 0.9, y: -0.05, speed: 0.8, phase: 3 },
  ];

  static rgba(hex, alpha) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, alpha))})`;
  }

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.bg = document.createElement("canvas");
    this.bgKey = "";
    this.fx = new DuelFx();
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.energy = 0.35;
    this.reset();
  }

  reset() {
    this.pos = 0;
    this.vel = 0;
    this.target = 0;
    this.t = 0;
    this.pulses = [];
    this.flash = { me: 0, foe: 0 };
    this.shake = 0;
    this.bolts = [];
    this.boltIn = 0;
    this.clashAcc = 0;
    this.winner = null;
    this.party = 0;
    this.fireIn = 0;
    this.fx.clear();
  }

  resize() {
    const width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = width;
    this.H = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.thick = Math.max(16, Math.min(46, height * 0.14, width * 0.05));
    this.x0 = Math.max(18, width * 0.05) + this.thick * 0.4;
    this.x1 = width - this.x0;
    this.y = height * 0.6;
    this.font = Math.max(12, Math.min(26, height * 0.075, width * 0.045));
    this.bgKey = "";
  }

  splitX() {
    return this.x0 + (this.x1 - this.x0) * (0.5 + this.pos / 2);
  }

  hit(side, letters, perfect = true) {
    const power = Math.min(1.6, 0.6 + letters / 10) * (perfect ? 1 : 0.55);
    if (letters > 0) this.pulses.push({ side, t: 0, power });
    this.flash[side] = Math.max(this.flash[side], perfect ? 0.55 : 0.3);
    const sx = this.splitX(),
      x = (side === "me" ? (this.x0 + sx) / 2 : (sx + this.x1) / 2) + (Math.random() - 0.5) * this.thick * 3,
      y = this.y - this.thick * (1.3 + Math.random() * 0.8);
    this.fx.label(x, y, "+" + letters, perfect ? DuelArena.COLORS[side].hot : "#b9c0cc", Math.round(this.font * (perfect ? 1.1 : 0.9)));
  }

  impact(pulse) {
    const C = DuelArena.COLORS[pulse.side],
      dir = pulse.side === "me" ? 1 : -1,
      sx = this.splitX(),
      h = this.thick;
    this.fx.burst(sx, this.y, C.hot, { count: 28 * pulse.power, speed: 420, angle: dir > 0 ? 0 : Math.PI, spread: Math.PI * 1.3, life: 0.65 });
    this.fx.burst(sx, this.y, C.main, { count: 16 * pulse.power, speed: 300, life: 0.8, size: 3 });
    this.fx.burst(sx, this.y, "#ffffff", { count: 10, speed: 260, life: 0.35 });
    this.fx.ring(sx, this.y, C.main, h * 3.2, 0.45, 6);
    this.fx.ring(sx, this.y, "#ffffff", h * 1.8, 0.3, 3);
    this.flash[pulse.side] = 1;
    this.shake = Math.max(this.shake, 0.35 * pulse.power);
    this.vel += dir * DuelArena.KICK * pulse.power;
  }

  go() {
    for (const side of ["me", "foe"]) {
      const x = side === "me" ? this.x0 : this.x1;
      this.flash[side] = 1;
      this.fx.ring(x, this.y, DuelArena.COLORS[side].main, this.thick * 5, 0.7, 8);
      this.fx.burst(x, this.y, DuelArena.COLORS[side].hot, { count: 40, speed: 380, life: 0.8 });
    }
    this.fx.burst(this.splitX(), this.y, "#ffffff", { count: 40, speed: 460, life: 0.7 });
    this.shake = 0.6;
  }

  celebrate(result) {
    this.winner = result;
    this.party = 0;
    this.fireIn = 0;
    if (result === "draw") return;
    this.target = result === "me" ? 1 : -1;
    this.flash[result] = 1;
    this.shake = 1;
    this.fx.burst(this.splitX(), this.y, DuelArena.COLORS[result].hot, { count: 90, speed: 560, life: 1 });
  }

  makeBolt(sx) {
    const up = Math.random() < 0.5 ? -1 : 1,
      length = this.thick * (1.1 + Math.random() * 1.6),
      points = [[sx, this.y]];
    for (let i = 1; i <= 6; i++) points.push([sx + (Math.random() - 0.5) * this.thick * 0.8, this.y + up * (length * i) / 6]);
    const side = Math.random() < 0.5 ? "me" : "foe";
    return { points, life: 0.12, max: 0.12, color: Math.random() < 0.4 ? "#ffffff" : DuelArena.COLORS[side].hot };
  }

  update(dt) {
    this.t += dt;
    const k = DuelArena.SPRING;
    this.vel += ((this.target - this.pos) * k * k - 2 * k * this.vel) * dt;
    this.pos = Math.max(-1, Math.min(1, this.pos + this.vel * dt));
    for (const p of this.pulses) p.t += dt;
    for (const p of this.pulses) if (p.t >= DuelArena.PULSE_TIME) this.impact(p);
    this.pulses = this.pulses.filter((p) => p.t < DuelArena.PULSE_TIME);
    this.flash.me = Math.max(0, this.flash.me - dt * 2.2);
    this.flash.foe = Math.max(0, this.flash.foe - dt * 2.2);
    this.shake = Math.max(0, this.shake - dt * 3);
    const sx = this.splitX();
    this.clashAcc += dt * DuelArena.CLASH_RATE * this.energy;
    while (this.clashAcc >= 1) {
      this.clashAcc--;
      const side = Math.random() < 0.5 ? "me" : "foe";
      this.fx.burst(sx, this.y + (Math.random() - 0.5) * this.thick * 0.6, DuelArena.COLORS[side].hot, {
        count: 1,
        speed: 240,
        angle: -Math.PI / 2 + (side === "me" ? -0.5 : 0.5),
        spread: 2.2,
        life: 0.5,
        size: 2,
        gravity: 320,
      });
    }
    this.boltIn -= dt;
    if (this.boltIn <= 0) {
      this.boltIn = (0.05 + Math.random() * 0.15) / Math.max(0.3, this.energy);
      this.bolts.push(this.makeBolt(sx));
    }
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter((b) => b.life > 0);
    if (this.winner && this.winner !== "draw") this.fireworks(dt);
    this.fx.update(dt);
  }

  fireworks(dt) {
    this.party += dt;
    this.fireIn -= dt;
    if (this.party > DuelArena.PARTY_TIME || this.fireIn > 0) return;
    this.fireIn = DuelArena.FIREWORK_EVERY * (0.6 + Math.random() * 0.8);
    const C = DuelArena.COLORS[this.winner],
      left = this.winner === "me" ? 0.05 : 0.5,
      x = this.W * (left + Math.random() * 0.45),
      y = this.H * (0.12 + Math.random() * 0.3),
      color = [C.main, C.hot, "#ffe27a", "#ffffff"][Math.floor(Math.random() * 4)];
    this.fx.burst(x, y, color, { count: 55, speed: 330, life: 1.1, gravity: 110, drag: 1.5, size: 2.6 });
    this.fx.ring(x, y, color, 60, 0.5, 3);
  }

  paintBackground() {
    const W = this.W,
      H = this.H,
      a = ThemeSwitch.color("--wk-stage-a"),
      b = ThemeSwitch.color("--wk-stage-b");
    this.bgKey = a + b + W + "x" + H;
    this.bg.width = Math.round(W * this.dpr);
    this.bg.height = Math.round(H * this.dpr);
    const c = this.bg.getContext("2d");
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    let g = c.createRadialGradient(W / 2, this.y, 10, W / 2, this.y, Math.max(W, H) * 0.75);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, DuelArena.rgba(DuelArena.COLORS.me.main, 0.22));
    g.addColorStop(0.45, DuelArena.rgba(DuelArena.COLORS.me.main, 0));
    g.addColorStop(0.55, DuelArena.rgba(DuelArena.COLORS.foe.main, 0));
    g.addColorStop(1, DuelArena.rgba(DuelArena.COLORS.foe.main, 0.22));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    const horizon = this.y + this.thick * 1.1,
      vanish = this.y - H * 0.3;
    c.save();
    c.beginPath();
    c.rect(0, horizon, W, H - horizon);
    c.clip();
    c.strokeStyle = "rgba(255,255,255,0.07)";
    c.lineWidth = 1;
    for (let i = -12; i <= 12; i++) {
      c.beginPath();
      c.moveTo(W / 2, vanish);
      c.lineTo(W / 2 + i * W * 0.11, H);
      c.stroke();
    }
    for (let j = 1; j <= 7; j++) {
      const y = horizon + (H - horizon) * Math.pow(j / 7, 1.8);
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(W, y);
      c.stroke();
    }
    c.restore();
  }

  drawGlow() {
    const ctx = this.ctx,
      C = DuelArena.COLORS,
      sx = this.splitX(),
      h = this.thick;
    for (const side of ["me", "foe"]) {
      const x = side === "me" ? 0 : this.W,
        boost = this.winner === side ? 0.3 : 0,
        g = ctx.createRadialGradient(x, this.y, 0, x, this.y, this.W * 0.55);
      g.addColorStop(0, DuelArena.rgba(C[side].main, (0.1 + 0.32 * this.flash[side] + boost) * (0.5 + this.energy / 2)));
      g.addColorStop(1, DuelArena.rgba(C[side].main, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, this.W, this.H);
      const from = side === "me" ? this.x0 : sx,
        to = side === "me" ? sx : this.x1,
        halo = ctx.createLinearGradient(0, this.y - h * 1.7, 0, this.y + h * 1.7);
      halo.addColorStop(0, DuelArena.rgba(C[side].main, 0));
      halo.addColorStop(0.5, DuelArena.rgba(C[side].main, 0.28 + 0.4 * this.flash[side]));
      halo.addColorStop(1, DuelArena.rgba(C[side].main, 0));
      ctx.fillStyle = halo;
      ctx.fillRect(from, this.y - h * 1.7, to - from, h * 3.4);
    }
  }

  drawBeams() {
    const ctx = this.ctx,
      sx = this.splitX();
    for (const b of DuelArena.BEAMS) {
      const C = DuelArena.COLORS[b.side],
        speed = b.speed * (this.winner === b.side ? 2.2 : 1),
        ox = b.x * this.W,
        oy = b.y * this.H,
        tx = sx + Math.sin(this.t * speed + b.phase) * this.W * 0.1,
        ty = this.y + Math.cos(this.t * speed * 1.3 + b.phase) * this.H * 0.2,
        angle = Math.atan2(ty - oy, tx - ox),
        length = Math.hypot(tx - ox, ty - oy) * 1.3,
        spread = 0.05 + 0.035 * this.flash[b.side],
        lose = this.winner && this.winner !== "draw" && this.winner !== b.side,
        alpha = lose ? 0.03 : (0.09 + 0.3 * this.flash[b.side] + (this.winner === b.side ? 0.2 : 0)) * this.energy,
        g = ctx.createLinearGradient(ox, oy, ox + Math.cos(angle) * length, oy + Math.sin(angle) * length);
      g.addColorStop(0, DuelArena.rgba(C.hot, alpha * 1.6));
      g.addColorStop(0.5, DuelArena.rgba(C.main, alpha));
      g.addColorStop(1, DuelArena.rgba(C.main, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + Math.cos(angle - spread) * length, oy + Math.sin(angle - spread) * length);
      ctx.lineTo(ox + Math.cos(angle + spread) * length, oy + Math.sin(angle + spread) * length);
      ctx.closePath();
      ctx.fill();
    }
  }

  stripes(from, to, dir) {
    const ctx = this.ctx,
      h = this.thick,
      r = h / 2,
      gap = h * 1.1,
      width = h * 0.32,
      tip = dir * r * 0.7,
      offset = ((((this.t * h * (1.5 + 2.5 * this.energy) * dir) % gap) + gap) % gap);
    if (to - from < 1) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(from, this.y - r, to - from, h);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.beginPath();
    for (let x = from - gap * 2 + offset; x < to + gap; x += gap) {
      ctx.moveTo(x, this.y - r);
      ctx.lineTo(x + width, this.y - r);
      ctx.lineTo(x + width + tip, this.y);
      ctx.lineTo(x + width, this.y + r);
      ctx.lineTo(x, this.y + r);
      ctx.lineTo(x + tip, this.y);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();
  }

  drawBar() {
    const ctx = this.ctx,
      C = DuelArena.COLORS,
      { x0, x1, y } = this,
      h = this.thick,
      r = h / 2,
      sx = this.splitX();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x0 - 4, y - r - 4, x1 - x0 + 8, h + 8, r + 4);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(x0, y - r, x1 - x0, h, r);
    ctx.clip();
    let g = ctx.createLinearGradient(x0, 0, Math.max(x0 + 1, sx), 0);
    g.addColorStop(0, C.me.deep);
    g.addColorStop(0.7, C.me.main);
    g.addColorStop(1, C.me.hot);
    ctx.fillStyle = g;
    ctx.fillRect(x0, y - r, sx - x0, h);
    g = ctx.createLinearGradient(sx, 0, Math.max(sx + 1, x1), 0);
    g.addColorStop(0, C.foe.hot);
    g.addColorStop(0.3, C.foe.main);
    g.addColorStop(1, C.foe.deep);
    ctx.fillStyle = g;
    ctx.fillRect(sx, y - r, x1 - sx, h);
    this.stripes(x0, sx, 1);
    this.stripes(sx, x1, -1);
    g = ctx.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, "rgba(255,255,255,0.38)");
    g.addColorStop(0.45, "rgba(255,255,255,0.05)");
    g.addColorStop(1, "rgba(0,0,0,0.3)");
    ctx.fillStyle = g;
    ctx.fillRect(x0, y - r, x1 - x0, h);
    ctx.globalCompositeOperation = "lighter";
    for (const p of this.pulses) {
      const k = p.t / DuelArena.PULSE_TIME,
        px = p.side === "me" ? x0 + (sx - x0) * k : x1 - (x1 - sx) * k,
        w = h * 2.4;
      g = ctx.createLinearGradient(px - w, 0, px + w, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(px - w, y - r, w * 2, h);
    }
    ctx.restore();
  }

  drawClash() {
    const ctx = this.ctx,
      sx = this.splitX(),
      h = this.thick,
      y = this.y,
      hot = Math.max(this.flash.me, this.flash.foe),
      R = h * (1.5 + 0.8 * hot) * (1 + 0.08 * Math.sin(this.t * 22)) * (0.7 + 0.3 * this.energy);
    let g = ctx.createRadialGradient(sx, y, 0, sx, y, R);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.25, "rgba(255,240,225,0.6)");
    g.addColorStop(0.6, "rgba(190,150,255,0.18)");
    g.addColorStop(1, "rgba(190,150,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(sx, y, R, 0, Math.PI * 2);
    ctx.fill();
    const tall = h * (2.4 + hot * 1.5);
    g = ctx.createLinearGradient(sx, y - tall, sx, y + tall);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.85)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(sx - 1.5, y - tall, 3, tall * 2);
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    for (const b of this.bolts) {
      ctx.globalAlpha = b.life / b.max;
      ctx.strokeStyle = b.color;
      ctx.beginPath();
      b.points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const danger = (Math.abs(this.pos) - DuelArena.DANGER) / (1 - DuelArena.DANGER);
    if (danger > 0 && !this.winner) {
      const loser = this.pos > 0 ? "foe" : "me",
        x = loser === "foe" ? this.x1 : this.x0;
      g = ctx.createRadialGradient(x, y, 0, x, y, h * 3);
      g.addColorStop(0, DuelArena.rgba(DuelArena.COLORS[loser].main, danger * (0.5 + 0.5 * Math.sin(this.t * 14))));
      g.addColorStop(1, DuelArena.rgba(DuelArena.COLORS[loser].main, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - h * 3, y - h * 3, h * 6, h * 6);
    }
  }

  drawCaps() {
    const ctx = this.ctx,
      r = this.thick * 0.75;
    for (const side of ["me", "foe"]) {
      const C = DuelArena.COLORS[side],
        x = side === "me" ? this.x0 : this.x1,
        g = ctx.createRadialGradient(x - r * 0.3, this.y - r * 0.3, 1, x, this.y, r);
      g.addColorStop(0, C.hot);
      g.addColorStop(0.6, C.main);
      g.addColorStop(1, C.deep);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, this.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.stroke();
    }
  }

  crown(cx, cy, s) {
    const ctx = this.ctx,
      g = ctx.createLinearGradient(0, cy - s, 0, cy + s * 0.5);
    g.addColorStop(0, "#fff3b0");
    g.addColorStop(0.5, "#ffd23f");
    g.addColorStop(1, "#e09a00");
    ctx.fillStyle = g;
    ctx.strokeStyle = "rgba(90,50,0,0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - s, cy + s * 0.5);
    ctx.lineTo(cx - s, cy - s * 0.5);
    ctx.lineTo(cx - s * 0.5, cy);
    ctx.lineTo(cx, cy - s * 0.85);
    ctx.lineTo(cx + s * 0.5, cy);
    ctx.lineTo(cx + s, cy - s * 0.5);
    ctx.lineTo(cx + s, cy + s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#fff8d6";
    for (const [px, py] of [[cx - s, cy - s * 0.5], [cx, cy - s * 0.85], [cx + s, cy - s * 0.5]]) {
      ctx.beginPath();
      ctx.arc(px, py, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawHud(view) {
    const ctx = this.ctx,
      C = DuelArena.COLORS,
      f = this.font,
      top = Math.max(f * 1.1, this.H * 0.1);
    if (this.winner && this.winner !== "draw") {
      const loser = this.winner === "me" ? "foe" : "me";
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(loser === "me" ? 0 : this.W / 2, 0, this.W / 2, this.H);
    }
    ctx.textBaseline = "middle";
    for (const side of ["me", "foe"]) {
      const left = side === "me",
        x = left ? this.x0 - this.thick * 0.4 : this.x1 + this.thick * 0.4;
      ctx.textAlign = left ? "left" : "right";
      ctx.font = `900 ${f}px ${DuelArena.FONT}`;
      ctx.fillStyle = C[side].hot;
      ctx.fillText(view[side].name, x, top);
      ctx.font = `600 ${Math.round(f * 0.7)}px ${DuelArena.FONT}`;
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillText(view[side].words + (view[side].words > 1 ? " mots" : " mot"), x, top + f * 1.05);
      if (this.winner === side) this.crown(left ? this.x0 : this.x1, this.y - this.thick * 1.9 + Math.sin(this.t * 4) * 3, this.thick * 0.7);
    }
    ctx.textAlign = "center";
    ctx.font = `800 ${Math.round(f * 1.15)}px ${DuelArena.FONT}`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(view.timer, this.W / 2, top);
  }

  drawCount(count) {
    if (!count) return;
    const ctx = this.ctx,
      k = Math.max(0, Math.min(1, count.k)),
      grow = 1 - Math.pow(1 - Math.min(1, k * 3), 3),
      scale = 1.8 - 0.8 * grow,
      alpha = 1 - Math.max(0, (k - 0.7) / 0.3),
      size = count.big ? Math.min(this.H * 0.48, this.W * 0.3) : Math.min(this.H * 0.4, this.W * 0.16),
      cy = count.big ? this.H * 0.54 : this.H * 0.4;
    if (count.big) {
      const radius = size * 0.68;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.lineWidth = Math.max(4, size * 0.06);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.arc(this.W / 2, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineCap = "round";
      ctx.strokeStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(this.W / 2, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - k));
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(this.W / 2, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${Math.round(size)}px ${DuelArena.FONT}`;
    ctx.shadowColor = "rgba(160,190,255,0.9)";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(count.text, 0, 0);
    ctx.restore();
  }

  draw(view) {
    if (!this.W) return;
    const ctx = this.ctx;
    if (this.bgKey !== ThemeSwitch.color("--wk-stage-a") + ThemeSwitch.color("--wk-stage-b") + this.W + "x" + this.H) this.paintBackground();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.drawImage(this.bg, 0, 0, this.W, this.H);
    if (this.shake > 0) ctx.translate((Math.random() - 0.5) * this.shake * 12, (Math.random() - 0.5) * this.shake * 9);
    ctx.globalCompositeOperation = "lighter";
    this.drawGlow();
    this.drawBeams();
    ctx.globalCompositeOperation = "source-over";
    this.drawBar();
    this.drawCaps();
    ctx.globalCompositeOperation = "lighter";
    this.drawClash();
    this.fx.draw(ctx);
    ctx.globalCompositeOperation = "source-over";
    this.drawHud(view);
    this.drawCount(view.count);
  }
}
