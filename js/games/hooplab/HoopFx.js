class HoopFx {
  static MAX_PARTICLES = 900;
  static BROKEN_TIME = 2.8;
  static GLASS_RETURN = 0.6;
  static FLAMES = ["#fff6c2", "#ffd166", "#ff8a2a", "#e8401c", "#8f1d0e"];
  static FIREWORKS = ["#ffd447", "#ff4d6d", "#4cc3ff", "#7dff8a", "#c78bff", "#ffffff"];
  static STREAKS = [
    { text: "DOUBLE PANIER", color: "#4cc3ff", rgb: "76,195,255" },
    { text: "TRIPLE PANIER", color: "#ff9a3c", rgb: "255,154,60" },
    { text: "QUADRUPLE PANIER", color: "#7df9ff", rgb: "125,249,255" },
    { text: "QUINTUPLE PANIER", color: "#c78bff", rgb: "199,139,255" },
    { text: "MONSTRUEUX", color: "#ff3b3b", rgb: "255,59,59" },
  ];
  static RAINBOW = ["255,77,109", "255,154,60", "255,212,71", "125,255,138", "76,195,255", "199,139,255"];
  static SPOTS = [-34, 34];
  static SPOT_IDLE = 0.05;

  constructor() {
    this.reset();
  }

  reset() {
    this.particles = [];
    this.popups = [];
    this.rings = [];
    this.shards = [];
    this.rockets = [];
    this.rays = 0;
    this.flash = 0;
    this.shake = 0;
    this.rimGlow = 0;
    this.boardGlow = 0;
    this.spot = 0;
    this.broken = 0;
    this.flashColor = "255,255,255";
    this.bolts = [];
  }

  glassAlpha() {
    if (this.broken <= 0) return 1;
    return this.broken > HoopFx.GLASS_RETURN ? 0 : 1 - this.broken / HoopFx.GLASS_RETURN;
  }

  glassSolid() {
    return this.broken <= 0.15;
  }

  add(particle) {
    if (this.particles.length < HoopFx.MAX_PARTICLES) this.particles.push(particle);
  }

  burst(x, y, count, o) {
    for (let i = 0; i < count; i++) {
      const angle = o.angle !== undefined ? o.angle + (Math.random() - 0.5) * o.spread : Math.random() * Math.PI * 2;
      const speed = o.speed * (0.35 + Math.random() * 0.65);
      const life = o.life * (0.6 + Math.random() * 0.4);
      this.add({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        max: life,
        size: o.size * (0.6 + Math.random() * 0.6),
        color: o.colors[Math.floor(Math.random() * o.colors.length)],
        gravity: o.gravity || 0,
        drag: o.drag || 0,
        shape: o.shape || "spark",
        glow: o.glow !== false,
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 12,
        under: Boolean(o.under),
      });
    }
  }

  flames(ball, dt) {
    const count = Math.ceil(dt * 90);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spot = Math.random() * HoopBall.RADIUS * 0.9;
      const life = 0.35 + Math.random() * 0.3;
      this.add({
        x: ball.x + Math.cos(angle) * spot,
        y: ball.y + Math.sin(angle) * spot,
        vx: -ball.vx * 0.15 + (Math.random() - 0.5) * 8,
        vy: -ball.vy * 0.15 - 14 - Math.random() * 12,
        life,
        max: life,
        size: 1.6 + Math.random() * 1.6,
        color: null,
        gravity: 0,
        drag: 1.5,
        shape: "flame",
        glow: true,
        rot: 0,
        spin: 0,
        under: true,
      });
    }
  }

  tap(x, y) {
    this.rings.push({ x, y, r: HoopBall.RADIUS, grow: 40, life: 0.35, max: 0.35, color: "255,255,255", width: 0.5 });
    this.burst(x, y + HoopBall.RADIUS, 10, { speed: 30, life: 0.35, size: 0.5, colors: ["#ffffff", "#bfe6ff"], angle: Math.PI / 2, spread: 1.6 });
  }

  popup(text, sub, color, x, y, size = 8, pulse = false) {
    this.popups.push({ text, sub, color, x, y, size, pulse, t: 0, life: pulse ? 2.8 : 2 });
  }

  celebrate(shot, court) {
    const x = court.center;
    const y = HoopCourt.RIM_Y;
    this.popup(shot.label, shot.detail, shot.color, x - court.dir * 4, y - 14);
    this.rimGlow = 1;
    this.spot = 1;
    this.rings.push({ x, y, r: 4, grow: 70, life: 0.7, max: 0.7, color: shot.rgb, width: 1 });
    this.burst(x, y, 45, { speed: 55, life: 0.9, size: 0.6, colors: [shot.color, "#ffffff"], gravity: 60, drag: 1.2 });
    if (shot.kind === "swish") this.swish(x, y);
    if (shot.kind === "board") this.bank(court);
    if (shot.kind === "rim") this.burst(x, y, 40, { speed: 45, life: 0.7, size: 0.55, colors: ["#ff9a3c", "#ffd166"], gravity: 90 });
    if (shot.kind === "bounce") this.confetti(x, 26, 60);
    if (shot.kind === "dunk") this.shatter(court);
  }

  zone(id, court) {
    if (id === "mid") {
      this.confetti(1, HoopCourt.FLOOR_Y, 45, -1.05);
      this.confetti(court.width - 1, HoopCourt.FLOOR_Y, 45, -2.1);
    }
    if (id === "long") this.fireworks(court.width, 4);
    if (id === "far") {
      this.fireworks(court.width, 7);
      this.swish(court.center, HoopCourt.RIM_Y);
      this.flash = Math.max(this.flash, 0.45);
      this.flashColor = "255,215,120";
    }
  }

  tricks(trick, ball, path) {
    if (trick.pure) {
      this.rings.push({ x: ball.x, y: ball.y, r: HoopBall.RADIUS, grow: 30, life: 0.8, max: 0.8, color: "255,255,255", width: 1.4 });
      this.burst(ball.x, ball.y, 24, { speed: 30, life: 0.9, size: 0.45, colors: ["#ffffff", "#e8f6ff"], drag: 2 });
    }
    if (trick.kicks) this.burst(ball.x, ball.y, Math.min(60, 18 * trick.kicks), { speed: 14, life: 1.6, size: 0.9, colors: ["#7df9ff", "#bfe6ff", "#ffffff"], shape: "bubble", gravity: -18, drag: 0.6 });
    if (trick.arc)
      path.forEach((point, i) => this.burst(point.x, point.y, 2, { speed: 6, life: 0.5 + i * 0.02, size: 0.5, colors: ["#ffd447", "#fff4c4"], drag: 1 }));
    if (trick.total)
      HoopFx.RAINBOW.forEach((color, i) => this.rings.push({ x: ball.x, y: ball.y, r: 2 + i * 2.5, grow: 45 + i * 6, life: 1.1, max: 1.1, color, width: 0.9 }));
  }

  streak(count, court) {
    if (count < 2) return;
    const level = Math.min(count, HoopFx.STREAKS.length + 1) - 2;
    const spec = HoopFx.STREAKS[level];
    const x = court.center;
    const y = HoopCourt.RIM_Y;
    const monster = level === HoopFx.STREAKS.length - 1;
    this.popup(spec.text, monster && count > 6 ? `${count} paniers d'affilée` : "", spec.color, court.width / 2, 16, monster ? 12 : 10, monster);
    for (let i = 0; i <= level + 1; i++) this.rings.push({ x, y, r: 3 + i * 5, grow: 60 + i * 15, life: 0.9 + i * 0.1, max: 0.9 + i * 0.1, color: spec.rgb, width: 1.1 });
    if (level >= 1) this.burst(x, y, 50 + level * 20, { speed: 75, life: 1, size: 1.6, colors: HoopFx.FLAMES, shape: "flame", drag: 1.5, gravity: -20 });
    if (level >= 2) this.lightning(court, 2 + level);
    if (level >= 3) this.meteors(court.width, 18 + level * 6);
    if (monster) {
      this.fireworks(court.width, 5);
      this.shake = Math.max(this.shake, 1.8);
      this.flash = Math.max(this.flash, 0.55);
      this.flashColor = "255,70,50";
    }
  }

  lightning(court, count) {
    for (let i = 0; i < count; i++) {
      const points = [];
      const startX = court.center + (Math.random() - 0.5) * 70;
      const steps = 14;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const jitter = k === 0 || k === steps ? 0 : (Math.random() - 0.5) * 7;
        points.push({ x: startX + (court.center - startX) * t + jitter, y: -8 + (HoopCourt.RIM_Y + 8) * t });
      }
      this.bolts.push({ points, delay: i * 0.12, life: 0.4, max: 0.4 });
    }
  }

  meteors(width, count) {
    for (let i = 0; i < count; i++)
      this.burst(Math.random() * width - 30, -10 - Math.random() * 30, 1, { speed: 120, life: 1.4, size: 0.7, colors: ["#e0c8ff", "#ffffff", "#c78bff"], angle: 1.05, spread: 0.15 });
  }

  swish(x, y) {
    this.rays = 1;
    this.rings.push({ x, y, r: 8, grow: 110, life: 1.1, max: 1.1, color: "255,215,90", width: 0.8 });
    for (let i = 0; i < 90; i++) {
      const life = 1.6 + Math.random() * 1.2;
      this.add({
        x: x + (Math.random() - 0.5) * 70,
        y: -5 - Math.random() * 25,
        vx: (Math.random() - 0.5) * 6,
        vy: 14 + Math.random() * 18,
        life,
        max: life,
        size: 0.9 + Math.random() * 0.7,
        color: Math.random() < 0.7 ? "#ffd447" : "#fff4c4",
        gravity: 6,
        drag: 0.2,
        shape: "confetti",
        glow: true,
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 14,
        under: false,
      });
    }
  }

  bank(court) {
    this.boardGlow = 1;
    const y = (court.board.top + court.board.bottom) / 2;
    this.burst(court.boardX, y, 50, { speed: 60, life: 0.8, size: 0.6, colors: ["#4cc3ff", "#bff0ff", "#ffffff"], angle: court.dir > 0 ? Math.PI : 0, spread: 2.2, drag: 1 });
  }

  confetti(x, y, count, angle) {
    const aimed = angle === undefined ? {} : { angle, spread: 0.5 };
    this.burst(x, y, count, { speed: angle === undefined ? 50 : 110, life: 2.2, size: 1, colors: HoopFx.FIREWORKS, shape: "confetti", gravity: 30, drag: 1.4, glow: false, ...aimed });
  }

  shatter(court) {
    const { board, boardX, dir } = court;
    this.broken = HoopFx.BROKEN_TIME;
    this.flash = 0.9;
    this.shake = 2.4;
    this.rings.push({ x: court.center, y: HoopCourt.RIM_Y, r: 6, grow: 110, life: 0.9, max: 0.9, color: "255,255,255", width: 2 });
    for (let i = 0; i < 34; i++) {
      const life = 1.8 + Math.random();
      this.shards.push({
        x: boardX + dir * Math.random() * HoopCourt.GLASS_DEPTH,
        y: board.top + Math.random() * (board.bottom - board.top),
        vx: -dir * (10 + Math.random() * 45) + (Math.random() - 0.5) * 20,
        vy: -25 - Math.random() * 40,
        rot: Math.random() * 6,
        spin: (Math.random() - 0.5) * 16,
        size: 0.8 + Math.random() * 2.2,
        shape: [Math.random(), Math.random(), Math.random()],
        life,
        max: life,
      });
    }
    this.burst(court.center, HoopCourt.RIM_Y, 90, { speed: 90, life: 1, size: 0.7, colors: ["#ffffff", "#bfe6ff", "#ffd447"], gravity: 50, drag: 1 });
  }

  fireworks(width, count) {
    for (let i = 0; i < count; i++)
      this.rockets.push({
        x: width * (0.15 + Math.random() * 0.7),
        y: HoopCourt.FLOOR_Y,
        vx: (Math.random() - 0.5) * 12,
        vy: -95 - Math.random() * 25,
        delay: i * 0.22,
        color: HoopFx.FIREWORKS[Math.floor(Math.random() * HoopFx.FIREWORKS.length)],
      });
  }

  update(dt) {
    const fade = (value, speed) => Math.max(0, value - dt * speed);
    this.rays = fade(this.rays, 0.55);
    this.flash = fade(this.flash, 2.2);
    this.shake = fade(this.shake, 4);
    this.rimGlow = fade(this.rimGlow, 1.2);
    this.boardGlow = fade(this.boardGlow, 0.7);
    this.spot = fade(this.spot, 0.45);
    this.broken = fade(this.broken, 1);
    if (!this.flash) this.flashColor = "255,255,255";
    for (const bolt of this.bolts) {
      if (bolt.delay > 0) {
        bolt.delay -= dt;
        if (bolt.delay <= 0) Sfx.play("hoopThunder");
      } else bolt.life -= dt;
    }
    this.bolts = this.bolts.filter((bolt) => bolt.life > 0);
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += p.gravity * dt;
      p.vx *= 1 - p.drag * dt;
      p.vy *= 1 - p.drag * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const ring of this.rings) {
      ring.life -= dt;
      ring.r += ring.grow * dt;
    }
    this.rings = this.rings.filter((ring) => ring.life > 0);
    for (const popup of this.popups) popup.t += dt;
    this.popups = this.popups.filter((popup) => popup.t < popup.life);
    this.updateShards(dt);
    this.updateRockets(dt);
  }

  updateShards(dt) {
    for (const s of this.shards) {
      s.life -= dt;
      s.vy += 120 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.rot += s.spin * dt;
      if (s.y > HoopCourt.FLOOR_Y && s.vy > 0) {
        s.y = HoopCourt.FLOOR_Y;
        s.vy *= -0.3;
        s.vx *= 0.5;
        s.spin *= 0.5;
      }
    }
    this.shards = this.shards.filter((s) => s.life > 0);
  }

  updateRockets(dt) {
    for (const rocket of this.rockets) {
      if (rocket.delay > 0) {
        rocket.delay -= dt;
        if (rocket.delay <= 0) Sfx.play("hoopLaunch");
        continue;
      }
      rocket.vy += 45 * dt;
      rocket.x += rocket.vx * dt;
      rocket.y += rocket.vy * dt;
      this.burst(rocket.x, rocket.y, 1, { speed: 6, life: 0.4, size: 0.4, colors: ["#ffd9a0"], gravity: 20 });
      if (rocket.vy > -15) {
        rocket.done = true;
        this.burst(rocket.x, rocket.y, 80, { speed: 48, life: 1.4, size: 0.55, colors: [rocket.color, rocket.color, "#ffffff"], gravity: 22, drag: 1.1 });
        this.rings.push({ x: rocket.x, y: rocket.y, r: 1, grow: 50, life: 0.4, max: 0.4, color: "255,255,255", width: 0.6 });
        Sfx.play("hoopFirework");
      }
    }
    this.rockets = this.rockets.filter((rocket) => !rocket.done);
  }

  offset() {
    if (!this.shake) return { x: 0, y: 0 };
    return { x: (Math.random() - 0.5) * this.shake, y: (Math.random() - 0.5) * this.shake };
  }

  drawBack(ctx, court, time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const strength = HoopFx.SPOT_IDLE + 0.6 * this.spot;
    for (const offset of HoopFx.SPOTS) {
      const sway = Math.sin(time * 0.6 + offset) * 14 * (1 - this.spot);
      this.spotlight(ctx, court.center + offset, court.center + sway, strength);
    }
    if (this.rays > 0) this.drawRays(ctx, court.center, HoopCourt.RIM_Y, time);
    ctx.restore();
  }

  spotlight(ctx, sx, tx, strength) {
    const sy = -6;
    const ty = HoopCourt.FLOOR_Y;
    const cone = ctx.createLinearGradient(sx, sy, tx, ty);
    cone.addColorStop(0, `rgba(255,248,225,${0.32 * strength})`);
    cone.addColorStop(1, `rgba(255,248,225,${0.04 * strength})`);
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(sx - 1.5, sy);
    ctx.lineTo(sx + 1.5, sy);
    ctx.lineTo(tx + 13, ty);
    ctx.lineTo(tx - 13, ty);
    ctx.fill();
    const pool = ctx.createRadialGradient(tx, ty + 2, 0, tx, ty + 2, 16);
    pool.addColorStop(0, `rgba(255,245,215,${0.35 * strength})`);
    pool.addColorStop(1, "rgba(255,245,215,0)");
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(tx, ty + 2, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRays(ctx, x, y, time) {
    const length = 70;
    const light = ctx.createRadialGradient(x, y, 0, x, y, length);
    light.addColorStop(0, `rgba(255,220,110,${0.6 * this.rays})`);
    light.addColorStop(1, "rgba(255,200,80,0)");
    ctx.fillStyle = light;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const angle = time * 0.5 + (i * Math.PI * 2) / 16;
      ctx.moveTo(x, y);
      ctx.arc(x, y, length, angle - 0.06, angle + 0.06);
      ctx.closePath();
    }
    ctx.fill();
  }

  drawUnder(ctx) {
    this.drawParticles(ctx, true);
  }

  drawFront(ctx, width) {
    this.drawShards(ctx);
    this.drawParticles(ctx, false);
    this.drawRings(ctx);
    this.drawPopups(ctx, width);
    this.drawBolts(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(${this.flashColor},${Math.min(1, this.flash) * 0.8})`;
      ctx.fillRect(-10, -130, width + 20, 260);
    }
  }

  drawParticles(ctx, under) {
    ctx.save();
    for (const p of this.particles) {
      if (p.under !== under) continue;
      const alpha = p.life / p.max;
      ctx.globalCompositeOperation = p.glow ? "lighter" : "source-over";
      ctx.globalAlpha = Math.min(1, alpha * 1.4);
      if (p.shape === "flame") {
        ctx.globalAlpha = alpha * 0.55;
        ctx.fillStyle = HoopFx.FLAMES[Math.min(HoopFx.FLAMES.length - 1, Math.floor((1 - alpha) * HoopFx.FLAMES.length))];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.3 + 0.7 * alpha), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === "bubble") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.18;
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(p.rot) * 0.6, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === "confetti") {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, (p.size / 2) * Math.abs(Math.cos(p.rot * 1.7)) + 0.1);
        ctx.restore();
      } else {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawBolts(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineJoin = "round";
    for (const bolt of this.bolts) {
      if (bolt.delay > 0) continue;
      const alpha = bolt.life / bolt.max;
      for (const [width, color] of [[2.4, `rgba(120,180,255,${0.25 * alpha})`], [0.9, `rgba(190,225,255,${0.7 * alpha})`], [0.3, `rgba(255,255,255,${alpha})`]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        bolt.points.forEach((point, i) => (i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y)));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawShards(ctx) {
    ctx.save();
    ctx.lineWidth = 0.12;
    for (const s of this.shards) {
      ctx.globalAlpha = Math.min(1, s.life / s.max * 2);
      const glint = Math.sin(s.rot * 2.3) > 0.75;
      ctx.fillStyle = glint ? "rgba(255,255,255,0.95)" : "rgba(200,232,255,0.55)";
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.beginPath();
      ctx.moveTo(-s.size, -s.size * s.shape[0]);
      ctx.lineTo(s.size * s.shape[1], -s.size * 0.6);
      ctx.lineTo(s.size * 0.3, s.size * (0.5 + s.shape[2]));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  drawRings(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const ring of this.rings) {
      ctx.strokeStyle = `rgba(${ring.color},${(ring.life / ring.max) * 0.8})`;
      ctx.lineWidth = ring.width * (0.4 + ring.life / ring.max);
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPopups(ctx, width) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    for (const popup of this.popups) {
      const enter = Math.min(1, popup.t / 0.18);
      const beat = popup.pulse ? 0.09 * Math.abs(Math.sin(popup.t * 7)) : 0.03 * Math.sin(popup.t * 9);
      const scale = enter < 1 ? 0.4 + 0.8 * enter - 0.2 * enter * enter : 1 + beat;
      const alpha = Math.min(1, (popup.life - popup.t) / 0.5);
      ctx.font = "800 3.4px 'Segoe UI', system-ui, sans-serif";
      const subWidth = popup.sub ? ctx.measureText(popup.sub).width * (8 / popup.size) : 0;
      ctx.font = `900 ${popup.size}px 'Segoe UI', system-ui, sans-serif`;
      const textWidth = Math.max(ctx.measureText(popup.text).width, subWidth);
      const fit = Math.min(1, (width - 4) / textWidth);
      const half = (textWidth * fit) / 2 + 2;
      const x = Math.max(half, Math.min(width - half, popup.x));
      ctx.save();
      ctx.translate(x, popup.y - popup.t * 3);
      ctx.scale(scale * fit, scale * fit);
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = "lighter";
      for (const [stroke, strength] of [[3.2, 0.18], [1.6, 0.35]]) {
        ctx.strokeStyle = popup.color;
        ctx.globalAlpha = alpha * strength;
        ctx.lineWidth = stroke;
        ctx.strokeText(popup.text, 0, 0);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = "rgba(20,10,30,0.85)";
      ctx.lineWidth = 0.9;
      ctx.strokeText(popup.text, 0, 0);
      const fill = ctx.createLinearGradient(0, -popup.size / 2, 0, popup.size / 2);
      fill.addColorStop(0, "#ffffff");
      fill.addColorStop(1, popup.color);
      ctx.fillStyle = fill;
      ctx.fillText(popup.text, 0, 0);
      if (popup.sub) {
        ctx.font = "800 3.4px 'Segoe UI', system-ui, sans-serif";
        ctx.lineWidth = 0.6;
        ctx.strokeText(popup.sub, 0, popup.size * 0.85);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(popup.sub, 0, popup.size * 0.85);
      }
      ctx.restore();
    }
    ctx.restore();
  }
}
