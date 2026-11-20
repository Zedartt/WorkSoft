class WheelFx {
  static MAX_PARTICLES = 1400;
  static GRAVITY = 520;
  static CONFETTI = ["#e53935", "#1e63d6", "#fbc02d", "#2e9d4a", "#ffffff", "#fb8c00", "#8e24aa"];

  constructor(painter) {
    this.painter = painter;
    this.reset();
  }

  reset() {
    this.parts = [];
    this.rings = [];
    this.later = [];
    this.rays = 0;
    this.core = 0;
    this.rayColor = "#fff";
    this.shake = 0;
  }

  add(part) {
    if (this.parts.length >= WheelFx.MAX_PARTICLES) this.parts.shift();
    this.parts.push(part);
  }

  spark(x, y, angle, speed, life, size, color) {
    this.add({ kind: "spark", x, y, px: x, py: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, age: 0, size, color });
  }

  sparks(energy) {
    const p = this.painter;
    p.syncTheme();
    const count = Math.floor(energy * 5 + Math.random());
    const r = p.r * (1 + WheelPainter.RIM);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const x = p.cx + Math.cos(a) * r;
      const y = p.cy + Math.sin(a) * r;
      this.spark(x, y, a + Math.PI / 2 + (Math.random() - 0.5) * 0.6, 200 + Math.random() * 420 * energy, 0.4 + Math.random() * 0.5, 1.5 + Math.random() * 2.5, WheelPainter.hue(Math.random() * 360));
    }
  }

  burst(color, count, power) {
    const p = this.painter;
    const reach = Math.max(p.w, p.h);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const pick = Math.random();
      this.spark(p.cx, p.cy, a, (0.3 + Math.random()) * reach * 1.4 * power, 0.6 + Math.random() * 0.9, 1.5 + Math.random() * 3.5, pick < 0.45 ? color : pick < 0.75 ? p.look.flare : WheelPainter.hue(Math.random() * 360));
    }
  }

  shards(colors) {
    const p = this.painter;
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * p.r * 0.9;
      const v = 300 + Math.random() * 900;
      this.add({
        kind: "shard",
        x: p.cx + Math.cos(a) * d,
        y: p.cy + Math.sin(a) * d,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 200,
        life: 1.1 + Math.random() * 0.8,
        age: 0,
        size: p.r * (0.05 + Math.random() * 0.09),
        spin: (Math.random() - 0.5) * 18,
        turn: Math.random() * Math.PI,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  boom(color, colors) {
    this.rayColor = color;
    this.rays = 1;
    this.core = 1;
    this.shake = 1.4;
    this.painter.syncTheme();
    const flare = this.painter.look.flare;
    [
      [0, flare, 0.7],
      [0.05, color, 0.9],
      [0.12, flare, 1],
      [0.22, color, 1.2],
      [0.34, flare, 1.4],
    ].forEach(([delay, c, life]) => this.rings.push({ age: -delay, life, color: c }));
    this.burst(color, 420, 1);
    this.shards(colors);
    this.later.push({ at: 0.14, run: () => this.burst(flare, 220, 0.7) });
    this.later.push({ at: 0.28, run: () => this.burst(color, 200, 1.2) });
    this.later.push({ at: 0.1, run: () => this.confetti(260) });
  }

  confetti(count) {
    const p = this.painter;
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.8;
      const v = 300 + Math.random() * 900;
      this.add({
        kind: "paper",
        x: p.cx + (Math.random() - 0.5) * p.r * 0.5,
        y: p.cy,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        life: 3 + Math.random() * 2,
        age: 0,
        size: 5 + Math.random() * 7,
        spin: Math.random() * 12 - 6,
        turn: Math.random() * Math.PI,
        color: WheelFx.CONFETTI[Math.floor(Math.random() * WheelFx.CONFETTI.length)],
      });
    }
  }

  rain() {
    const p = this.painter;
    if (Math.random() > 0.5) return;
    this.add({
      kind: "paper",
      x: Math.random() * p.w,
      y: -10,
      vx: (Math.random() - 0.5) * 60,
      vy: 60 + Math.random() * 80,
      life: 6,
      age: 0,
      size: 5 + Math.random() * 6,
      spin: Math.random() * 10 - 5,
      turn: Math.random() * Math.PI,
      color: WheelFx.CONFETTI[Math.floor(Math.random() * WheelFx.CONFETTI.length)],
    });
  }

  update(dt) {
    this.shake = Math.max(0, this.shake - dt * 1.8);
    this.rays = Math.max(0, this.rays - dt * 0.55);
    this.core = Math.max(0, this.core - dt * 1.6);
    this.later.forEach((item) => (item.at -= dt));
    this.later.filter((item) => item.at <= 0).forEach((item) => item.run());
    this.later = this.later.filter((item) => item.at > 0);
    this.rings.forEach((ring) => (ring.age += dt));
    this.rings = this.rings.filter((ring) => ring.age < ring.life);
    for (const part of this.parts) {
      part.age += dt;
      part.px = part.x;
      part.py = part.y;
      const drag = part.kind === "paper" ? 1.8 : part.kind === "shard" ? 0.8 : 2.2;
      const fall = part.kind === "paper" ? 0.35 : 1;
      part.vx *= 1 - Math.min(1, dt * drag);
      part.vy = part.vy * (1 - Math.min(1, dt * drag)) + WheelFx.GRAVITY * fall * dt;
      if (part.turn !== undefined) part.turn += part.spin * dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
    }
    const h = this.painter.h + 60;
    this.parts = this.parts.filter((part) => part.age < part.life && part.y < h);
  }

  offset() {
    if (this.shake <= 0) return [0, 0];
    const k = Math.min(1, this.shake) ** 2 * this.painter.r * 0.12;
    return [(Math.random() - 0.5) * k, (Math.random() - 0.5) * k];
  }

  drawBack(time) {
    if (this.rays <= 0) return;
    const p = this.painter;
    const g = p.ctx;
    const length = Math.hypot(p.w, p.h);
    g.save();
    g.translate(p.cx, p.cy);
    g.rotate(time * 0.5);
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, length);
      const c = i % 2 ? p.look.flare : this.rayColor;
      grad.addColorStop(0, c);
      grad.addColorStop(1, WheelPainter.soft(c, 0));
      g.fillStyle = grad;
      p.glowMode(g, this.rays * (i % 2 ? 0.4 : 0.7));
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, length, a - 0.05, a + 0.05);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  draw() {
    const p = this.painter;
    const g = p.ctx;
    g.save();
    if (this.core > 0) {
      p.glowMode(g, this.core);
      const s = p.r * (0.6 + (1 - this.core) * 2.4);
      g.drawImage(p.sprite(this.rayColor), p.cx - s, p.cy - s, s * 2, s * 2);
      g.drawImage(p.sprite(p.look.flare), p.cx - s * 0.6, p.cy - s * 0.6, s * 1.2, s * 1.2);
    }
    for (const ring of this.rings) {
      if (ring.age < 0) continue;
      const k = ring.age / ring.life;
      p.glowMode(g, (1 - k) * 0.95);
      g.strokeStyle = ring.color;
      g.lineWidth = Math.max(2, p.r * 0.16 * (1 - k));
      g.beginPath();
      g.arc(p.cx, p.cy, p.r * (0.2 + Math.sqrt(k) * 3.2), 0, Math.PI * 2);
      g.stroke();
    }
    g.lineCap = "round";
    for (const part of this.parts) {
      const fade = 1 - part.age / part.life;
      if (part.kind === "paper") {
        g.globalCompositeOperation = "source-over";
        g.globalAlpha = Math.min(1, fade * 3);
        g.fillStyle = part.color;
        g.save();
        g.translate(part.x, part.y);
        g.rotate(part.turn);
        g.scale(1, Math.cos(part.turn * 1.7));
        g.fillRect(-part.size / 2, -part.size / 4, part.size, part.size / 2);
        g.restore();
      } else if (part.kind === "shard") {
        g.globalCompositeOperation = "source-over";
        g.globalAlpha = Math.min(1, fade * 2);
        g.fillStyle = part.color;
        g.save();
        g.translate(part.x, part.y);
        g.rotate(part.turn);
        g.beginPath();
        g.moveTo(0, -part.size);
        g.lineTo(part.size * 0.8, part.size * 0.6);
        g.lineTo(-part.size * 0.6, part.size * 0.4);
        g.closePath();
        g.fill();
        g.strokeStyle = "rgba(255,255,255,.7)";
        g.lineWidth = 1;
        g.stroke();
        g.restore();
      } else {
        p.glowMode(g, fade);
        g.strokeStyle = part.color;
        g.lineWidth = part.size;
        g.beginPath();
        g.moveTo(part.px - (part.x - part.px) * 2, part.py - (part.y - part.py) * 2);
        g.lineTo(part.x, part.y);
        g.stroke();
        const s = part.size * 2.5;
        g.drawImage(p.sprite(part.color), part.x - s, part.y - s, s * 2, s * 2);
      }
    }
    g.restore();
  }
}
