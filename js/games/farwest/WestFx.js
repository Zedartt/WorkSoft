class WestFx {
  static MAX_PARTICLES = 500;

  constructor() {
    this.clear();
  }

  clear() {
    this.sparks = [];
    this.smoke = [];
    this.flashes = [];
    this.tracers = [];
    this.rays = [];
    this.screen = { color: "#ffffff", alpha: 0 };
    this.mood = { color: "0,0,0", alpha: 0, target: 0 };
    this.shake = 0;
  }

  burst(x, y, colors, count, speed, life = 0.6, gravity = 300, size = 2.2) {
    for (let i = 0; i < count && this.sparks.length < WestFx.MAX_PARTICLES; i++) {
      const a = Math.random() * Math.PI * 2,
        s = speed * (0.3 + Math.random() * 0.9),
        l = life * (0.6 + Math.random() * 0.6);
      this.sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: l, max: l, color: colors[i % colors.length], size: size * (0.6 + Math.random()), gravity });
    }
  }

  shot(from, to, dir, size) {
    this.flashes.push({ x: from.x, y: from.y, dir, size, life: 0.12, max: 0.12 });
    this.tracers.push({ from, to, life: 0.16, max: 0.16 });
    this.burst(from.x, from.y, ["#fff6c8", "#ffc14d", "#ff8a2a"], 22, 340, 0.35, 120, 2);
    for (let i = 0; i < 6; i++) this.smoke.push({ x: from.x, y: from.y, vx: dir * (20 + Math.random() * 40), vy: -10 - Math.random() * 25, r: size * 0.08, life: 1.2, max: 1.2 });
    this.screen = { color: "#fff3d0", alpha: 0.55 };
    this.shake = Math.max(this.shake, 0.6);
  }

  hit(at, size) {
    this.burst(at.x, at.y, ["#ffffff", "#ffd27a", "#c63b2b"], 26, 260, 0.5, 500, 2.4);
    this.flashes.push({ x: at.x, y: at.y, dir: 0, size: size * 0.7, life: 0.1, max: 0.1 });
  }

  ray(x, color, life = 2.4) {
    this.rays.push({ x, color, life, max: life });
  }

  stars(W, H) {
    for (let i = 0; i < 70 && this.sparks.length < WestFx.MAX_PARTICLES; i++)
      this.sparks.push({ x: Math.random() * W, y: -10 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 120, life: 2.6, max: 2.6, color: ["#ffd23f", "#fff3b0", "#ffb300"][i % 3], size: 3 + Math.random() * 3, gravity: 40, star: Math.random() * 6 });
  }

  setMood(color, target) {
    this.mood.color = color;
    this.mood.target = target;
  }

  update(dt) {
    for (const p of this.sparks) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.vx *= 1 - dt * 1.5;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.star !== undefined) p.star += dt * 4;
    }
    for (const s of this.smoke) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.r += 22 * dt;
    }
    for (const f of this.flashes) f.life -= dt;
    for (const t of this.tracers) t.life -= dt;
    for (const r of this.rays) r.life -= dt;
    this.sparks = this.sparks.filter((p) => p.life > 0);
    this.smoke = this.smoke.filter((s) => s.life > 0);
    this.flashes = this.flashes.filter((f) => f.life > 0);
    this.tracers = this.tracers.filter((t) => t.life > 0);
    this.rays = this.rays.filter((r) => r.life > 0);
    this.screen.alpha = Math.max(0, this.screen.alpha - dt * 3);
    this.mood.alpha += (this.mood.target - this.mood.alpha) * Math.min(1, dt * 3);
    this.shake = Math.max(0, this.shake - dt * 3);
  }

  starPath(ctx, x, y, r, turn) {
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = turn + (i * Math.PI) / 6 - Math.PI / 2,
        d = i % 2 ? r * 0.5 : r;
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
  }

  drawBack(ctx, W, H) {
    ctx.globalCompositeOperation = "lighter";
    for (const r of this.rays) {
      const k = r.life / r.max,
        g = ctx.createLinearGradient(r.x, 0, r.x, H);
      g.addColorStop(0, `rgba(${r.color},${0.5 * k})`);
      g.addColorStop(1, `rgba(${r.color},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(r.x - W * 0.04, 0);
      ctx.lineTo(r.x + W * 0.04, 0);
      ctx.lineTo(r.x + W * 0.16, H);
      ctx.lineTo(r.x - W * 0.16, H);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  }

  drawFront(ctx, W, H) {
    for (const s of this.smoke) {
      ctx.globalAlpha = (s.life / s.max) * 0.35;
      ctx.fillStyle = "#d8d2c8";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "lighter";
    for (const t of this.tracers) {
      ctx.globalAlpha = t.life / t.max;
      ctx.strokeStyle = "#fff0b0";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(t.from.x, t.from.y);
      ctx.lineTo(t.to.x, t.to.y);
      ctx.stroke();
    }
    for (const f of this.flashes) {
      const k = f.life / f.max,
        r = f.size * (0.5 + (1 - k) * 0.6),
        g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      ctx.globalAlpha = k;
      g.addColorStop(0, "rgba(255,255,240,1)");
      g.addColorStop(0.3, "rgba(255,200,80,0.8)");
      g.addColorStop(1, "rgba(255,120,30,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
      if (f.dir) {
        ctx.fillStyle = "rgba(255,240,190,0.9)";
        ctx.beginPath();
        ctx.moveTo(f.x, f.y - r * 0.18);
        ctx.lineTo(f.x + f.dir * r * 1.5, f.y);
        ctx.lineTo(f.x, f.y + r * 0.18);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    for (const p of this.sparks) {
      ctx.globalAlpha = Math.min(1, (p.life / p.max) * 1.5);
      ctx.fillStyle = p.color;
      if (p.star !== undefined) {
        this.starPath(ctx, p.x, p.y, p.size, p.star);
        ctx.fill();
      } else ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (this.mood.alpha > 0.01) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
      g.addColorStop(0, `rgba(${this.mood.color},${this.mood.alpha * 0.25})`);
      g.addColorStop(1, `rgba(${this.mood.color},${this.mood.alpha})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.screen.alpha > 0.01) {
      ctx.globalAlpha = this.screen.alpha;
      ctx.fillStyle = this.screen.color;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }
}
