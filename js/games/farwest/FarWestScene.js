class FarWestScene {
  static HORIZON = 0.58;
  static GROUND = 0.88;
  static TUMBLE_MIN = 4;
  static TUMBLE_MAX = 10;
  static DUST = 36;
  static TWINKLES = 26;
  static FLIES = 14;
  static RAYS = 9;
  static GUST_MIN = 3;
  static GUST_MAX = 7;
  static METEOR_MIN = 5;
  static METEOR_MAX = 11;
  static COLORS = ["--fw-sky-a", "--fw-sky-b", "--fw-sun", "--fw-mesa-far", "--fw-mesa-near", "--fw-ground-a", "--fw-ground-b", "--fw-wood", "--fw-wood-dark", "--fw-window", "--fw-cactus", "--fw-night"];

  static seeded(seed) {
    let s = seed;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  constructor() {
    this.bg = document.createElement("canvas");
    this.weed = document.createElement("canvas");
    this.key = "";
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.t = 0;
    this.tumbles = [];
    this.tumbleIn = 1.5;
    this.puffs = [];
    this.dust = [];
    this.clouds = [];
    this.twinkles = [];
    this.flies = [];
    this.birds = [];
    this.streaks = [];
    this.gustIn = 2;
    this.meteor = null;
    this.meteorIn = 3;
    this.night = 0;
    this.sun = { x: 0, y: 0, r: 1 };
    this.windows = [];
  }

  resize(W, H, dpr) {
    this.W = W;
    this.H = H;
    this.dpr = dpr;
    this.key = "";
    this.dust = Array.from({ length: FarWestScene.DUST }, () => ({ x: Math.random() * W, y: H * (0.35 + Math.random() * 0.6), s: 0.6 + Math.random() * 1.6, v: 12 + Math.random() * 30, a: 0.15 + Math.random() * 0.35 }));
    this.clouds = Array.from({ length: 3 }, (_, i) => ({ x: W * (0.15 + i * 0.35), y: H * (0.1 + i * 0.07), w: W * (0.16 + Math.random() * 0.1), v: 6 + Math.random() * 8 }));
    const horizon = H * FarWestScene.HORIZON;
    this.twinkles = Array.from({ length: FarWestScene.TWINKLES }, () => ({ x: Math.random() * W, y: Math.random() * horizon * 0.8, r: 0.8 + Math.random() * 1.3, speed: 1.5 + Math.random() * 3, phase: Math.random() * 7 }));
    this.flies = Array.from({ length: FarWestScene.FLIES }, () => ({ x: W * (0.25 + Math.random() * 0.5), y: horizon + Math.random() * H * 0.2, a: Math.random() * 7, speed: 8 + Math.random() * 14, phase: Math.random() * 7 }));
    this.birds = Array.from({ length: 2 }, (_, i) => ({ cx: W * (0.25 + i * 0.4), cy: H * (0.18 + i * 0.06), rx: W * (0.08 + i * 0.03), ry: H * 0.03, a: Math.random() * 7, speed: 0.22 + i * 0.08, size: Math.max(6, H * 0.012) }));
    this.streaks = [];
    this.paintWeed();
  }

  get groundY() {
    return this.H * FarWestScene.GROUND;
  }

  palette() {
    const colors = {};
    for (const name of FarWestScene.COLORS) colors[name.slice(5)] = ThemeSwitch.color(name);
    return colors;
  }

  paintWeed() {
    const r = Math.max(10, this.H * 0.045),
      size = Math.ceil(r * 2 + 4),
      c = this.weed.getContext("2d"),
      rand = FarWestScene.seeded(7);
    this.weedR = r;
    this.weed.width = Math.round(size * this.dpr);
    this.weed.height = Math.round(size * this.dpr);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.translate(size / 2, size / 2);
    c.lineCap = "round";
    for (let i = 0; i < 70; i++) {
      const a = rand() * Math.PI * 2,
        d = r * (0.2 + rand() * 0.8);
      c.strokeStyle = rand() < 0.5 ? "#8a6a3a" : "#b08a52";
      c.lineWidth = 0.8 + rand() * 1.2;
      c.beginPath();
      c.arc(Math.cos(a) * d * 0.3, Math.sin(a) * d * 0.3, d, a, a + 1 + rand() * 2.5);
      c.stroke();
    }
  }

  paint() {
    const W = this.W,
      H = this.H,
      P = this.palette(),
      c = this.bg.getContext("2d"),
      horizon = H * FarWestScene.HORIZON,
      night = parseFloat(P.night) || 0,
      rand = FarWestScene.seeded(42);
    this.key = Object.values(P).join() + W + "x" + H;
    this.bg.width = Math.round(W * this.dpr);
    this.bg.height = Math.round(H * this.dpr);
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    let g = c.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, P["sky-a"]);
    g.addColorStop(1, P["sky-b"]);
    c.fillStyle = g;
    c.fillRect(0, 0, W, horizon + 2);
    if (night > 0) {
      c.fillStyle = "#ffffff";
      for (let i = 0; i < 90; i++) {
        c.globalAlpha = night * (0.3 + rand() * 0.7);
        c.beginPath();
        c.arc(rand() * W, rand() * horizon * 0.85, 0.5 + rand() * 1.2, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
    }
    const sunX = W * 0.72,
      sunY = horizon * (night > 0 ? 0.28 : 0.55),
      sunR = Math.min(W, H) * 0.07;
    this.night = night;
    this.sun = { x: sunX, y: sunY, r: sunR };
    this.windows = [];
    g = c.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * 4);
    g.addColorStop(0, P.sun);
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.globalAlpha = 0.45;
    c.fillStyle = g;
    c.fillRect(0, 0, W, horizon);
    c.globalAlpha = 1;
    c.fillStyle = P.sun;
    c.beginPath();
    c.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    c.fill();
    if (night > 0) {
      c.fillStyle = P["sky-a"];
      c.beginPath();
      c.arc(sunX + sunR * 0.45, sunY - sunR * 0.2, sunR * 0.85, 0, Math.PI * 2);
      c.fill();
    }
    this.mesa(c, P["mesa-far"], horizon, [[0, 0.06], [0.04, 0.2], [0.16, 0.2], [0.2, 0.08], [0.3, 0.06], [0.33, 0.14], [0.42, 0.14], [0.45, 0.03], [0.6, 0.02], [0.64, 0.12], [0.7, 0.13], [0.74, 0.04], [0.86, 0.05], [0.9, 0.18], [1, 0.18]]);
    this.mesa(c, P["mesa-near"], horizon, [[0, 0.1], [0.06, 0.1], [0.09, 0.02], [0.24, 0.0], [0.78, 0.0], [0.84, 0.07], [0.95, 0.08], [1, 0.12]]);
    g = c.createLinearGradient(0, horizon, 0, H);
    g.addColorStop(0, P["ground-a"]);
    g.addColorStop(1, P["ground-b"]);
    c.fillStyle = g;
    c.fillRect(0, horizon, W, H - horizon);
    c.fillStyle = "rgba(0,0,0,0.12)";
    for (let i = 0; i < 160; i++) {
      const y = horizon + Math.pow(rand(), 0.7) * (H - horizon);
      c.fillRect(rand() * W, y, 1 + ((y - horizon) / (H - horizon)) * 3, 1);
    }
    c.fillStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < 80; i++) c.fillRect(rand() * W, horizon + rand() * (H - horizon), 2, 1);
    this.saloon(c, P, horizon, night);
    this.cactus(c, P.cactus, W * 0.07, horizon + H * 0.03, H * 0.16);
    this.cactus(c, P.cactus, W * 0.93, horizon + H * 0.05, H * 0.2);
    this.cactus(c, P.cactus, W * 0.34, horizon + H * 0.01, H * 0.07);
    if (night > 0) {
      g = c.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.max(W, H) * 0.8);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,10,${0.45 * night})`);
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
    }
  }

  mesa(c, color, horizon, points) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, horizon + 1);
    for (const [x, h] of points) c.lineTo(x * this.W, horizon - h * this.H * 0.6);
    c.lineTo(this.W, horizon + 1);
    c.closePath();
    c.fill();
  }

  cactus(c, color, x, base, h) {
    const w = h * 0.16;
    c.fillStyle = color;
    c.beginPath();
    c.roundRect(x - w / 2, base - h, w, h, w / 2);
    c.roundRect(x - w * 1.9, base - h * 0.72, w * 0.8, h * 0.36, w * 0.4);
    c.roundRect(x - w * 1.9, base - h * 0.45, w * 1.6, w * 0.7, w * 0.35);
    c.roundRect(x + w * 1.1, base - h * 0.85, w * 0.8, h * 0.4, w * 0.4);
    c.roundRect(x + w * 0.3, base - h * 0.52, w * 1.6, w * 0.7, w * 0.35);
    c.fill();
  }

  saloon(c, P, horizon, night) {
    const W = this.W,
      H = this.H,
      w = Math.min(W * 0.4, H * 0.62),
      h = w * 0.56,
      x = W / 2 - w / 2,
      base = horizon + H * 0.04,
      top = base - h,
      front = top - h * 0.22;
    c.fillStyle = "rgba(0,0,0,0.18)";
    c.beginPath();
    c.ellipse(W / 2, base + 2, w * 0.6, h * 0.06, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = P.wood;
    c.fillRect(x, top, w, h);
    c.beginPath();
    c.moveTo(x + w * 0.08, top);
    c.lineTo(x + w * 0.08, front + h * 0.06);
    c.lineTo(x + w * 0.22, front);
    c.lineTo(x + w * 0.78, front);
    c.lineTo(x + w * 0.92, front + h * 0.06);
    c.lineTo(x + w * 0.92, top);
    c.closePath();
    c.fill();
    c.strokeStyle = P["wood-dark"];
    c.lineWidth = 1;
    for (let y = front + 6; y < base; y += Math.max(4, h * 0.07)) {
      c.beginPath();
      c.moveTo(y < top ? x + w * 0.08 : x, y);
      c.lineTo(y < top ? x + w * 0.92 : x + w, y);
      c.stroke();
    }
    const signW = w * 0.5,
      signH = h * 0.2,
      signY = front + h * 0.07;
    c.fillStyle = P["wood-dark"];
    c.fillRect(W / 2 - signW / 2, signY, signW, signH);
    c.fillStyle = "#f3d9a4";
    c.font = `900 ${Math.round(signH * 0.62)}px Georgia, "Times New Roman", serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("SALOON", W / 2, signY + signH * 0.55);
    const porchY = top + h * 0.3;
    c.fillStyle = P["wood-dark"];
    c.fillRect(x - w * 0.04, porchY, w * 1.08, h * 0.06);
    for (const k of [0, 0.32, 0.68, 1]) c.fillRect(x + k * w - w * 0.012, porchY, w * 0.024, base - porchY);
    c.fillRect(x - w * 0.04, base - h * 0.05, w * 1.08, h * 0.05);
    const winW = w * 0.17,
      winH = h * 0.24,
      winY = porchY + h * 0.18;
    for (const k of [0.1, 0.73]) {
      const wx = x + k * w;
      this.windows.push({ x: wx, y: winY, w: winW, h: winH });
      if (night > 0) {
        const glow = c.createRadialGradient(wx + winW / 2, winY + winH / 2, 0, wx + winW / 2, winY + winH / 2, winW * 1.6);
        glow.addColorStop(0, `rgba(255,190,90,${0.45 * night})`);
        glow.addColorStop(1, "rgba(255,190,90,0)");
        c.fillStyle = glow;
        c.fillRect(wx - winW, winY - winH, winW * 3, winH * 3);
      }
      c.fillStyle = P.window;
      c.fillRect(wx, winY, winW, winH);
      c.strokeStyle = P["wood-dark"];
      c.lineWidth = 2;
      c.strokeRect(wx, winY, winW, winH);
      c.beginPath();
      c.moveTo(wx + winW / 2, winY);
      c.lineTo(wx + winW / 2, winY + winH);
      c.moveTo(wx, winY + winH / 2);
      c.lineTo(wx + winW, winY + winH / 2);
      c.stroke();
    }
    const doorW = w * 0.2,
      doorX = W / 2 - doorW / 2,
      doorY = porchY + h * 0.14;
    this.windows.push({ x: doorX, y: doorY, w: doorW, h: base - doorY - h * 0.05 });
    c.fillStyle = night > 0 ? P.window : "rgba(0,0,0,0.55)";
    c.fillRect(doorX, doorY, doorW, base - doorY - h * 0.05);
    c.fillStyle = P["wood-dark"];
    c.fillRect(doorX, doorY + h * 0.12, doorW * 0.48, h * 0.24);
    c.fillRect(doorX + doorW * 0.52, doorY + h * 0.12, doorW * 0.48, h * 0.24);
  }

  spawnTumble() {
    const fromLeft = Math.random() < 0.5,
      r = this.weedR * (0.7 + Math.random() * 0.6),
      y = this.H * (0.66 + Math.random() * 0.12);
    this.tumbles.push({ x: fromLeft ? -r * 2 : this.W + r * 2, y: y - r, floor: y, r, vx: (fromLeft ? 1 : -1) * (this.W * 0.12 + Math.random() * this.W * 0.1), vy: 0, rot: 0 });
    Sfx.play("fwWind");
  }

  update(dt) {
    this.t += dt;
    this.tumbleIn -= dt;
    if (this.tumbleIn <= 0) {
      this.tumbleIn = FarWestScene.TUMBLE_MIN + Math.random() * (FarWestScene.TUMBLE_MAX - FarWestScene.TUMBLE_MIN);
      this.spawnTumble();
    }
    for (const w of this.tumbles) {
      w.vy += 900 * dt;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.rot += (w.vx * dt) / w.r;
      if (w.y + w.r > w.floor) {
        w.y = w.floor - w.r;
        w.vy = -(140 + Math.random() * 160);
        for (let i = 0; i < 5; i++) this.puffs.push({ x: w.x + (Math.random() - 0.5) * w.r, y: w.floor, r: w.r * 0.3, vx: -w.vx * 0.1 + (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 20, life: 0.7, max: 0.7 });
      }
    }
    this.tumbles = this.tumbles.filter((w) => w.x > -w.r * 4 && w.x < this.W + w.r * 4);
    for (const p of this.puffs) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.r += 18 * dt;
    }
    this.puffs = this.puffs.filter((p) => p.life > 0);
    for (const d of this.dust) {
      d.x += d.v * dt;
      d.y += Math.sin(this.t * 2 + d.s * 5) * 4 * dt;
      if (d.x > this.W + 4) d.x = -4;
    }
    for (const cl of this.clouds) {
      cl.x += cl.v * dt;
      if (cl.x - cl.w > this.W) cl.x = -cl.w;
    }
    this.gustIn -= dt;
    if (this.gustIn <= 0) {
      this.gustIn = FarWestScene.GUST_MIN + Math.random() * (FarWestScene.GUST_MAX - FarWestScene.GUST_MIN);
      const y = this.H * (0.62 + Math.random() * 0.25);
      for (let i = 0; i < 18; i++) this.streaks.push({ x: -Math.random() * this.W * 0.5, y: y + (Math.random() - 0.5) * this.H * 0.08, len: this.W * (0.03 + Math.random() * 0.05), v: this.W * (0.5 + Math.random() * 0.4), life: 1.6, max: 1.6 });
    }
    for (const st of this.streaks) {
      st.life -= dt;
      st.x += st.v * dt;
    }
    this.streaks = this.streaks.filter((st) => st.life > 0 && st.x < this.W + st.len);
    for (const f of this.flies) {
      f.a += (Math.random() - 0.5) * dt * 3;
      f.x += Math.cos(f.a) * f.speed * dt;
      f.y += Math.sin(f.a) * f.speed * dt * 0.6;
      if (f.x < this.W * 0.15 || f.x > this.W * 0.85) f.a = Math.PI - f.a;
      const horizon = this.H * FarWestScene.HORIZON;
      if (f.y < horizon - this.H * 0.05 || f.y > horizon + this.H * 0.25) f.a = -f.a;
    }
    for (const b of this.birds) b.a += b.speed * dt;
    if (this.night > 0) {
      this.meteorIn -= dt;
      if (this.meteorIn <= 0 && !this.meteor) {
        this.meteorIn = FarWestScene.METEOR_MIN + Math.random() * (FarWestScene.METEOR_MAX - FarWestScene.METEOR_MIN);
        const fromLeft = Math.random() < 0.5;
        this.meteor = { x: this.W * (fromLeft ? 0.1 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3), y: this.H * (0.05 + Math.random() * 0.12), vx: (fromLeft ? 1 : -1) * this.W * 0.55, vy: this.H * 0.28, life: 0.9, max: 0.9 };
      }
      if (this.meteor) {
        const m = this.meteor;
        m.life -= dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.life <= 0) this.meteor = null;
      }
    }
  }

  drawDay(ctx) {
    const day = 1 - this.night,
      { x, y, r } = this.sun,
      horizon = this.H * FarWestScene.HORIZON;
    if (day <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(x, y);
    ctx.rotate(this.t * 0.04);
    const len = Math.max(this.W, this.H) * 0.9;
    for (let i = 0; i < FarWestScene.RAYS; i++) {
      const a = (i / FarWestScene.RAYS) * Math.PI * 2,
        g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, `rgba(255,236,180,${0.09 * day * (0.7 + 0.3 * Math.sin(this.t * 0.8 + i))})`);
      g.addColorStop(1, "rgba(255,236,180,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.07) * len, Math.sin(a - 0.07) * len);
      ctx.lineTo(Math.cos(a + 0.07) * len, Math.sin(a + 0.07) * len);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = `rgba(255,245,220,${0.16 * day})`;
    ctx.lineWidth = 1.5;
    for (let band = 0; band < 3; band++) {
      const by = horizon - this.H * (0.01 + band * 0.012);
      ctx.beginPath();
      for (let px = 0; px <= this.W; px += 12) {
        const py = by + Math.sin(px * 0.03 + this.t * (2 + band) + band) * 1.6;
        if (px) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(40,25,15,${0.75 * day})`;
    ctx.lineWidth = 1.6;
    for (const b of this.birds) {
      const bx = b.cx + Math.cos(b.a) * b.rx,
        by = b.cy + Math.sin(b.a) * b.ry,
        flap = Math.sin(this.t * 3 + b.cx) * b.size * 0.25;
      ctx.beginPath();
      ctx.moveTo(bx - b.size, by - flap);
      ctx.quadraticCurveTo(bx - b.size * 0.4, by - b.size * 0.35, bx, by);
      ctx.quadraticCurveTo(bx + b.size * 0.4, by - b.size * 0.35, bx + b.size, by - flap);
      ctx.stroke();
    }
  }

  drawNight(ctx) {
    const night = this.night;
    if (night <= 0) return;
    const { x, y, r } = this.sun;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(x, y, r, x, y, r * (3.2 + 0.25 * Math.sin(this.t * 0.7)));
    halo.addColorStop(0, `rgba(230,225,255,${0.16 * night})`);
    halo.addColorStop(1, "rgba(230,225,255,0)");
    ctx.fillStyle = halo;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    ctx.fillStyle = "#ffffff";
    for (const s of this.twinkles) {
      ctx.globalAlpha = night * Math.max(0, 0.25 + 0.75 * Math.sin(this.t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (this.meteor) {
      const m = this.meteor,
        k = m.life / m.max,
        tx = m.x - m.vx * 0.18,
        ty = m.y - m.vy * 0.18,
        g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, `rgba(255,255,255,${0.9 * k * night})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
    const flicker = 0.75 + 0.15 * Math.sin(this.t * 9) + 0.1 * Math.sin(this.t * 23);
    for (const w of this.windows) {
      const cx = w.x + w.w / 2,
        cy = w.y + w.h / 2,
        rr = Math.max(w.w, w.h) * 1.4,
        g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, `rgba(255,170,70,${0.22 * night * flicker})`);
      g.addColorStop(1, "rgba(255,170,70,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
    }
    ctx.restore();
  }

  drawLights(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    if (this.night > 0)
      for (const f of this.flies) {
        const glow = Math.max(0, Math.sin(this.t * 2.5 + f.phase)),
          g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 7);
        g.addColorStop(0, `rgba(220,255,140,${0.9 * glow * this.night})`);
        g.addColorStop(1, "rgba(220,255,140,0)");
        ctx.fillStyle = g;
        ctx.fillRect(f.x - 7, f.y - 7, 14, 14);
      }
    ctx.restore();
    ctx.lineCap = "round";
    ctx.lineWidth = 1.2;
    for (const st of this.streaks) {
      ctx.globalAlpha = Math.min(1, st.life / st.max * 2) * (this.night > 0 ? 0.18 : 0.35);
      ctx.strokeStyle = "#f3dfb6";
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.lineTo(st.x - st.len, st.y + st.len * 0.04);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawBack(ctx) {
    if (this.key !== Object.values(this.palette()).join() + this.W + "x" + this.H) this.paint();
    ctx.drawImage(this.bg, 0, 0, this.W, this.H);
    ctx.fillStyle = ThemeSwitch.color("--fw-cloud");
    for (const cl of this.clouds) {
      ctx.beginPath();
      ctx.ellipse(cl.x, cl.y, cl.w / 2, cl.w * 0.09, 0, 0, Math.PI * 2);
      ctx.ellipse(cl.x + cl.w * 0.12, cl.y - cl.w * 0.06, cl.w * 0.22, cl.w * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    this.drawDay(ctx);
    this.drawNight(ctx);
  }

  drawMiddle(ctx) {
    for (const p of this.puffs) {
      ctx.globalAlpha = (p.life / p.max) * 0.35;
      ctx.fillStyle = "#c9a46b";
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const w of this.tumbles) {
      const scale = w.r / this.weedR,
        size = this.weed.width / this.dpr;
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.beginPath();
      ctx.ellipse(w.x, w.floor, w.r * 0.9, w.r * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(w.x, w.y);
      ctx.rotate(w.rot);
      ctx.scale(scale, scale);
      ctx.drawImage(this.weed, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }

  drawFront(ctx) {
    this.drawLights(ctx);
    ctx.fillStyle = "#f3dfb6";
    for (const d of this.dust) {
      ctx.globalAlpha = d.a;
      ctx.fillRect(d.x, d.y, d.s, d.s);
    }
    ctx.globalAlpha = 1;
  }
}
