class TableFx {
  static MAX_PARTICLES = 900;
  static GOLD = ["#ffd34d", "#fff2a8", "#ffb800", "#ffffff"];
  static RAINBOW = ["#ff4d6d", "#ffd447", "#4cc3ff", "#7dff8a", "#c58bff", "#ff9a3c"];

  static rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  }

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.t = 0;
    this.clear();
  }

  clear() {
    this.parts = [];
    this.rings = [];
    this.beams = [];
    this.rays = [];
    this.flashes = [];
    this.texts = [];
    this.later = [];
    this.shake = 0;
    this.drawn = true;
  }

  resize() {
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = w;
    this.H = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.drawn = true;
  }

  busy() {
    return this.parts.length || this.rings.length || this.beams.length || this.rays.length || this.flashes.length || this.texts.length || this.later.length;
  }

  add(p) {
    if (this.parts.length < TableFx.MAX_PARTICLES) this.parts.push(p);
  }

  burst(x, y, count, o = {}) {
    const colors = o.colors || TableFx.GOLD;
    for (let i = 0; i < count; i++) {
      const a = (o.angle ?? 0) + (o.spread ? (Math.random() - 0.5) * o.spread : Math.random() * Math.PI * 2),
        v = (o.speed || 260) * (0.3 + Math.random() * 0.7),
        life = (o.life || 1) * (0.6 + Math.random() * 0.6);
      this.add({ kind: o.kind || "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.gravity ?? 300, life, max: life, size: (o.size || 3) * (0.6 + Math.random() * 0.8), color: colors[(Math.random() * colors.length) | 0], spin: Math.random() * 6, rot: Math.random() * 6 });
    }
  }

  ring(x, y, color, o = {}) {
    this.rings.push({ x, y, r: o.r || 10, grow: o.grow || 320, life: o.life || 0.8, max: o.life || 0.8, rgb: TableFx.rgb(color), width: o.width || 4 });
  }

  text(x, y, text, color, size, life = 2.4) {
    this.texts.push({ x, y, text, color, size, life, max: life });
  }

  schedule(delay, fn) {
    this.later.push({ at: this.t + delay, fn });
  }

  celebrate(spot, color, level, amount, mine, name) {
    const { x, y } = spot,
      rgb = TableFx.rgb(color),
      colors = [color, ...TableFx.GOLD];
    for (let i = 0; i <= level; i++) this.schedule(i * 0.12, () => this.ring(x, y, i % 2 ? "#ffd34d" : color, { grow: 220 + level * 70, width: 3 + level }));
    this.burst(x, y, 24 + level * 22, { colors, speed: 200 + level * 60, life: 0.9 });
    this.text(x, y - 60, `+${amount.toLocaleString("fr-FR")} €`, "#ffe27a", 20 + level * 4 + (mine ? 6 : 0), 2.6);
    this.beams.push({ fx: x, fy: -40, x, y, rgb: "255,236,170", life: 1.8 + level * 0.6, max: 1.8 + level * 0.6, width: 70 + level * 10, sway: 0 });
    if (level >= 2)
      for (let i = 0; i < level * 8; i++)
        this.schedule(i * 0.05, () => this.add({ kind: "coin", x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 260, vy: -280 - Math.random() * 260, g: 620, life: 1.8, max: 1.8, size: 7 + Math.random() * 3, color: "#ffd34d", spin: 8 + Math.random() * 8, rot: Math.random() * 6 }));
    if (level >= 3) {
      [0.08, 0.5, 0.92].forEach((at, i) => this.beams.push({ fx: this.W * at, fy: -40, x, y, rgb: TableFx.rgb(TableFx.RAINBOW[(i + level) % TableFx.RAINBOW.length]), life: 3.5, max: 3.5, width: 55, sway: 1 + i }));
      this.burst(x, y - 20, 90, { kind: "confetti", colors: TableFx.RAINBOW, speed: 420, angle: -Math.PI / 2, spread: 2.2, gravity: 340, life: 2.4, size: 5 });
    }
    if (level >= 4) {
      this.rays.push({ x, y, rgb, life: 4.5, max: 4.5, count: 14 });
      this.flashes.push({ rgb, life: 0.35, max: 0.35, alpha: 0.35 });
      for (let i = 0; i < (level - 3) * 4; i++) this.schedule(0.3 + i * 0.35, () => this.firework(x + (Math.random() - 0.5) * this.W * 0.5, Math.max(40, y - 140 - Math.random() * 160)));
      this.shake = Math.max(this.shake, 0.3);
    }
    if (level >= 5) {
      if (mine) this.text(this.W / 2, this.H * 0.4, "JACKPOT !", "#ffd34d", Math.min(110, this.W * 0.12), 3.2);
      else this.text(this.W / 2, this.H * 0.55, `JACKPOT pour ${name} !`, "#ffd34d", Math.min(64, this.W * 0.07), 3.2);
      this.shake = 0.7;
      for (let i = 0; i < 6; i++) this.schedule(i * 0.16, () => this.flashes.push({ rgb: i % 2 ? "255,255,255" : rgb, life: 0.12, max: 0.12, alpha: 0.4 }));
      for (let i = 0; i < 160; i++) this.schedule(Math.random() * 2.5, () => this.add({ kind: Math.random() < 0.5 ? "coin" : "confetti", x: Math.random() * this.W, y: -20, vx: (Math.random() - 0.5) * 60, vy: 60 + Math.random() * 120, g: 260, life: 3.5, max: 3.5, size: 6 + Math.random() * 4, color: Math.random() < 0.5 ? "#ffd34d" : TableFx.RAINBOW[(Math.random() * 6) | 0], spin: 6 + Math.random() * 6, rot: Math.random() * 6 }));
      this.rays.push({ x: this.W / 2, y: this.H * 0.4, rgb: "255,211,77", life: 4, max: 4, count: 20 });
    }
  }

  firework(x, y) {
    const colors = [TableFx.RAINBOW[(Math.random() * 6) | 0], "#ffffff", TableFx.RAINBOW[(Math.random() * 6) | 0]];
    this.burst(x, y, 60, { colors, speed: 240, gravity: 120, life: 1.3, size: 2.6 });
    this.ring(x, y, colors[0], { grow: 200, width: 2, life: 0.5 });
  }

  update(dt) {
    this.t += dt;
    this.shake = Math.max(0, this.shake - dt);
    for (let i = this.later.length - 1; i >= 0; i--)
      if (this.later[i].at <= this.t) {
        const job = this.later[i];
        this.later.splice(i, 1);
        job.fn();
      }
    for (const p of this.parts) {
      p.life -= dt;
      p.vy += p.g * dt;
      p.vx *= 1 - 0.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    this.parts = this.parts.filter((p) => p.life > 0 && p.y < this.H + 40);
    for (const list of [this.rings, this.beams, this.rays, this.flashes, this.texts]) for (const item of list) item.life -= dt;
    for (const ring of this.rings) ring.r += ring.grow * dt;
    this.rings = this.rings.filter((item) => item.life > 0);
    this.beams = this.beams.filter((item) => item.life > 0);
    this.rays = this.rays.filter((item) => item.life > 0);
    this.flashes = this.flashes.filter((item) => item.life > 0);
    this.texts = this.texts.filter((item) => item.life > 0);
  }

  offset() {
    if (!this.shake) return "";
    const k = this.shake * 10;
    return `translate(${((Math.random() - 0.5) * k).toFixed(1)}px, ${((Math.random() - 0.5) * k).toFixed(1)}px)`;
  }

  draw() {
    const ctx = this.ctx;
    if (!this.busy()) {
      if (this.drawn) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawn = false;
      }
      return;
    }
    this.drawn = true;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.globalCompositeOperation = "lighter";
    for (const flash of this.flashes) {
      ctx.fillStyle = `rgba(${flash.rgb},${flash.alpha * (flash.life / flash.max)})`;
      ctx.fillRect(0, 0, this.W, this.H);
    }
    for (const beam of this.beams) this.drawBeam(ctx, beam);
    for (const ray of this.rays) this.drawRays(ctx, ray);
    for (const ring of this.rings) {
      ctx.strokeStyle = `rgba(${ring.rgb},${ring.life / ring.max})`;
      ctx.lineWidth = ring.width;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const p of this.parts) if (p.kind === "spark") this.drawSpark(ctx, p);
    ctx.globalCompositeOperation = "source-over";
    for (const p of this.parts) if (p.kind !== "spark") this.drawPiece(ctx, p);
    for (const text of this.texts) this.drawText(ctx, text);
  }

  drawBeam(ctx, beam) {
    const k = beam.life / beam.max,
      fade = Math.min(1, k * 3) * Math.min(1, (1 - k) * 6),
      sway = beam.sway ? Math.sin(this.t * beam.sway * 1.3) * 40 * k : 0,
      tx = beam.x + sway,
      ty = beam.y;
    const grad = ctx.createLinearGradient(beam.fx, beam.fy, tx, ty);
    grad.addColorStop(0, `rgba(${beam.rgb},${0.45 * fade})`);
    grad.addColorStop(1, `rgba(${beam.rgb},${0.08 * fade})`);
    const a = Math.atan2(ty - beam.fy, tx - beam.fx) + Math.PI / 2,
      w = beam.width;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(beam.fx - Math.cos(a) * 6, beam.fy - Math.sin(a) * 6);
    ctx.lineTo(beam.fx + Math.cos(a) * 6, beam.fy + Math.sin(a) * 6);
    ctx.lineTo(tx + Math.cos(a) * w, ty + Math.sin(a) * w);
    ctx.lineTo(tx - Math.cos(a) * w, ty - Math.sin(a) * w);
    ctx.closePath();
    ctx.fill();
    const pool = ctx.createRadialGradient(tx, ty, 2, tx, ty, w * 1.2);
    pool.addColorStop(0, `rgba(${beam.rgb},${0.35 * fade})`);
    pool.addColorStop(1, `rgba(${beam.rgb},0)`);
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.arc(tx, ty, w * 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRays(ctx, ray) {
    const k = ray.life / ray.max,
      fade = Math.min(1, k * 3) * Math.min(1, (1 - k) * 5),
      len = Math.max(this.W, this.H) * 0.6;
    ctx.save();
    ctx.translate(ray.x, ray.y);
    ctx.rotate(this.t * 0.6);
    for (let i = 0; i < ray.count; i++) {
      ctx.rotate((Math.PI * 2) / ray.count);
      const grad = ctx.createLinearGradient(0, 0, len, 0);
      grad.addColorStop(0, `rgba(${ray.rgb},${0.3 * fade})`);
      grad.addColorStop(1, `rgba(${ray.rgb},0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(len, -len * 0.06);
      ctx.lineTo(len, len * 0.06);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawSpark(ctx, p) {
    const k = Math.max(0, p.life / p.max);
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = k;
    ctx.lineWidth = p.size * k + 0.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawPiece(ctx, p) {
    const k = Math.max(0, Math.min(1, (p.life / p.max) * 3));
    ctx.globalAlpha = k;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.kind === "coin") {
      const squash = Math.abs(Math.cos(p.rot));
      ctx.scale(Math.max(0.15, squash), 1);
      ctx.fillStyle = "#c98a00";
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd34d";
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.78, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff6c8";
      ctx.fillRect(-p.size * 0.15, -p.size * 0.5, p.size * 0.3, p.size);
    } else {
      ctx.rotate(p.rot);
      ctx.scale(1, Math.abs(Math.cos(p.rot * 1.3)) + 0.2);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawText(ctx, text) {
    const k = text.life / text.max,
      rise = (1 - k) * 40,
      pop = Math.min(1, (1 - k) * 8),
      alpha = Math.min(1, k * 4);
    ctx.save();
    ctx.translate(text.x, text.y - rise);
    ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
    ctx.globalAlpha = alpha;
    ctx.font = `900 ${text.size}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(3, text.size / 7);
    ctx.strokeStyle = "rgba(20,12,0,.85)";
    ctx.strokeText(text.text, 0, 0);
    ctx.shadowColor = text.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, 0, 0);
    ctx.restore();
  }
}
