class DuelFx {
  static MAX_PARTICLES = 700;
  static FONT = "'Segoe UI', system-ui, sans-serif";

  constructor() {
    this.clear();
  }

  clear() {
    this.parts = [];
    this.rings = [];
    this.labels = [];
  }

  burst(x, y, color, options = {}) {
    const count = Math.round(options.count || 20),
      spread = options.spread === undefined ? Math.PI * 2 : options.spread,
      angle = options.angle || 0,
      speed = options.speed || 200,
      life = options.life || 0.6,
      size = options.size || 2.4;
    for (let i = 0; i < count && this.parts.length < DuelFx.MAX_PARTICLES; i++) {
      const a = angle + (Math.random() - 0.5) * spread,
        s = speed * (0.35 + Math.random() * 0.85),
        l = life * (0.6 + Math.random() * 0.6);
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: l,
        max: l,
        color,
        size: size * (0.6 + Math.random() * 0.8),
        gravity: options.gravity === undefined ? 260 : options.gravity,
        drag: options.drag === undefined ? 2 : options.drag,
      });
    }
  }

  ring(x, y, color, size, life = 0.5, width = 4) {
    this.rings.push({ x, y, color, size, life, max: life, width });
  }

  label(x, y, text, color, size) {
    this.labels.push({ x, y, text, color, size, life: 0.9, max: 0.9 });
  }

  update(dt) {
    for (const p of this.parts) {
      p.life -= dt;
      p.vx -= p.vx * p.drag * dt;
      p.vy -= p.vy * p.drag * dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (const r of this.rings) r.life -= dt;
    for (const l of this.labels) {
      l.life -= dt;
      l.y -= 46 * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0);
    this.rings = this.rings.filter((r) => r.life > 0);
    this.labels = this.labels.filter((l) => l.life > 0);
  }

  draw(ctx) {
    ctx.lineCap = "round";
    for (const p of this.parts) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.4);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 0.035, p.y - p.vy * 0.035);
      ctx.stroke();
    }
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = (1 - k) * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * (1 - k) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 6 + k * r.size, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const l of this.labels) {
      ctx.globalAlpha = Math.min(1, (l.life / l.max) * 2);
      ctx.font = `900 ${l.size}px ${DuelFx.FONT}`;
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, l.x, l.y);
    }
    ctx.globalAlpha = 1;
  }
}
