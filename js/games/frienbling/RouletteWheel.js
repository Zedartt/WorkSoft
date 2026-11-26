class RouletteWheel {
  static IDLE_SPEED = 0.22;
  static SPIN_SPEED = 1.5;
  static BALL_SPEED = -11;
  static BALL_MIN = -4.5;
  static BALL_DECAY = 3.2;
  static DROP_FROM = 0.6;
  static STEP = (Math.PI * 2) / 37;

  static wrap(angle) {
    const full = Math.PI * 2;
    return ((angle % full) + full) % full;
  }

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.face = document.createElement("canvas");
    this.size = 0;
    this.dpr = 1;
    this.angle = 0;
    this.speed = RouletteWheel.IDLE_SPEED;
    this.ball = null;
    this.result = null;
    this.glow = 0;
    this.onTick = null;
    this.lastPocket = -1;
    this.pending = null;
  }

  resize() {
    const size = Math.min(this.canvas.clientWidth, this.canvas.clientHeight);
    if (!size) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.size = size;
    this.canvas.width = Math.round(size * this.dpr);
    this.canvas.height = Math.round(size * this.dpr);
    this.paintFace();
  }

  radii() {
    const R = this.size / 2;
    return { rim: R * 0.98, track: R * 0.84, outer: R * 0.76, inner: R * 0.56, cone: R * 0.48, hub: R * 0.16, pocket: R * 0.62 };
  }

  paintFace() {
    const px = Math.round(this.size * this.dpr),
      face = this.face;
    face.width = px;
    face.height = px;
    const ctx = face.getContext("2d"),
      r = this.radii(),
      step = RouletteWheel.STEP;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, px / 2, px / 2);
    ctx.font = `700 ${Math.max(7, this.size * 0.045)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    RouletteRules.ORDER.forEach((n, i) => {
      const a = i * step;
      ctx.beginPath();
      ctx.arc(0, 0, r.outer, a - step / 2, a + step / 2);
      ctx.arc(0, 0, r.inner, a + step / 2, a - step / 2, true);
      ctx.closePath();
      ctx.fillStyle = RouletteRules.HEX[RouletteRules.color(n)];
      ctx.fill();
      ctx.save();
      ctx.rotate(a);
      ctx.translate((r.outer + r.pocket) / 2 + (r.outer - r.pocket) * 0.12, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = "#fff";
      ctx.fillText(String(n), 0, 0);
      ctx.restore();
    });
    ctx.strokeStyle = "#d9b35a";
    ctx.lineWidth = Math.max(1, this.size * 0.006);
    RouletteRules.ORDER.forEach((n, i) => {
      const a = i * step + step / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r.inner, Math.sin(a) * r.inner);
      ctx.lineTo(Math.cos(a) * r.outer, Math.sin(a) * r.outer);
      ctx.stroke();
    });
    for (const radius of [r.outer, r.pocket, r.inner]) {
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    const cone = ctx.createRadialGradient(-r.cone * 0.3, -r.cone * 0.3, r.hub * 0.3, 0, 0, r.cone);
    cone.addColorStop(0, "#9b6a3c");
    cone.addColorStop(1, "#4a2d16");
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.arc(0, 0, r.inner, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#e6c06a";
    for (let k = 0; k < 4; k++) {
      ctx.save();
      ctx.rotate((k * Math.PI) / 2);
      ctx.lineWidth = Math.max(2, this.size * 0.018);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(r.hub * 0.6, 0);
      ctx.lineTo(r.cone * 0.82, 0);
      ctx.stroke();
      ctx.fillStyle = "#ffe08a";
      ctx.beginPath();
      ctx.arc(r.cone * 0.85, 0, Math.max(2, this.size * 0.017), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const hub = ctx.createRadialGradient(-r.hub * 0.3, -r.hub * 0.3, 1, 0, 0, r.hub);
    hub.addColorStop(0, "#fff3c4");
    hub.addColorStop(1, "#b8862c");
    ctx.fillStyle = hub;
    ctx.beginPath();
    ctx.arc(0, 0, r.hub, 0, Math.PI * 2);
    ctx.fill();
  }

  launch() {
    this.speed = RouletteWheel.SPIN_SPEED;
    this.result = null;
    this.glow = 0;
    this.ball = { rel: Math.random() * Math.PI * 2, v: RouletteWheel.BALL_SPEED, t: 0, seg: null, landed: false, radius: 1 };
  }

  aim(n, minSeconds) {
    const ball = this.ball;
    if (!ball || ball.seg) return minSeconds;
    const target = RouletteRules.ORDER.indexOf(n) * RouletteWheel.STEP,
      speed = Math.abs(ball.v),
      natural = (speed * minSeconds) / 2;
    let d = -RouletteWheel.wrap(ball.rel - target);
    while (-d < natural) d -= Math.PI * 2;
    ball.seg = { p0: ball.rel, v0: ball.v, p1: ball.rel + d, T: minSeconds, s: 0 };
    this.pending = n;
    return minSeconds;
  }

  settle(n) {
    const ball = this.ball || { v: 0, t: 0, seg: null, radius: 0 };
    ball.rel = RouletteRules.ORDER.indexOf(n) * RouletteWheel.STEP;
    ball.landed = true;
    ball.radius = 0;
    this.ball = ball;
    this.result = n;
    this.glow = 1;
  }

  stop() {
    this.ball = null;
    this.result = null;
    this.glow = 0;
  }

  update(dt) {
    this.speed += (RouletteWheel.IDLE_SPEED - this.speed) * Math.min(1, dt * 0.25);
    this.angle += this.speed * dt;
    this.glow = Math.max(0, this.glow - dt * 0.15);
    const ball = this.ball;
    if (!ball || ball.landed) return;
    ball.t += dt;
    if (!ball.seg) {
      ball.v = RouletteWheel.BALL_MIN + (RouletteWheel.BALL_SPEED - RouletteWheel.BALL_MIN) * Math.exp(-ball.t / RouletteWheel.BALL_DECAY);
      ball.rel += ball.v * dt;
      return;
    }
    const seg = ball.seg;
    seg.s = Math.min(1, seg.s + dt / seg.T);
    const s = seg.s,
      h00 = 2 * s ** 3 - 3 * s ** 2 + 1,
      h10 = s ** 3 - 2 * s ** 2 + s,
      h01 = -2 * s ** 3 + 3 * s ** 2;
    ball.rel = h00 * seg.p0 + h10 * seg.T * seg.v0 + h01 * seg.p1;
    const drop = Math.max(0, (s - RouletteWheel.DROP_FROM) / (1 - RouletteWheel.DROP_FROM));
    ball.radius = 1 - RouletteWheel.bounce(drop);
    if (drop > 0 && this.onTick) {
      const pocket = Math.floor(RouletteWheel.wrap(ball.rel + RouletteWheel.STEP / 2) / RouletteWheel.STEP);
      if (pocket !== this.lastPocket) {
        this.lastPocket = pocket;
        this.onTick(1 - drop);
      }
    }
    if (s >= 1) {
      ball.landed = true;
      ball.radius = 0;
      this.result = this.pending;
      this.glow = 1;
    }
  }

  static bounce(x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    const n = 7.5625,
      d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75;
    if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375;
    return n * (x -= 2.625 / d) * x + 0.984375;
  }

  draw() {
    if (!this.size) return;
    const ctx = this.ctx,
      r = this.radii(),
      half = this.size / 2;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, half * this.dpr, half * this.dpr);
    ctx.clearRect(-half, -half, this.size, this.size);
    const wood = ctx.createRadialGradient(0, 0, r.track, 0, 0, r.rim);
    wood.addColorStop(0, "#6b3d1c");
    wood.addColorStop(0.5, "#8f5527");
    wood.addColorStop(1, "#3d210d");
    ctx.fillStyle = wood;
    ctx.beginPath();
    ctx.arc(0, 0, r.rim, 0, Math.PI * 2);
    ctx.fill();
    const track = ctx.createRadialGradient(0, 0, r.outer, 0, 0, r.track);
    track.addColorStop(0, "#1a1410");
    track.addColorStop(1, "#5a4636");
    ctx.fillStyle = track;
    ctx.beginPath();
    ctx.arc(0, 0, r.track, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.rotate(this.angle);
    ctx.drawImage(this.face, -half, -half, this.size, this.size);
    if (this.result !== null && this.glow > 0) this.drawGlow(ctx, r);
    ctx.restore();
    this.drawBall(ctx, r);
    ctx.strokeStyle = "rgba(255,220,140,.5)";
    ctx.lineWidth = Math.max(1, this.size * 0.008);
    ctx.beginPath();
    ctx.arc(0, 0, r.track, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawGlow(ctx, r) {
    const index = RouletteRules.ORDER.indexOf(this.result),
      a = index * RouletteWheel.STEP,
      pulse = 0.55 + 0.45 * Math.sin(performance.now() / 120);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255,230,140,${0.55 * pulse * Math.min(1, this.glow * 3)})`;
    ctx.beginPath();
    ctx.arc(0, 0, r.outer + 3, a - RouletteWheel.STEP / 2, a + RouletteWheel.STEP / 2);
    ctx.arc(0, 0, r.inner - 3, a + RouletteWheel.STEP / 2, a - RouletteWheel.STEP / 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawBall(ctx, r) {
    const ball = this.ball;
    if (!ball) return;
    const a = this.angle + ball.rel,
      radius = r.pocket + (r.track - r.pocket - this.size * 0.03) * ball.radius,
      x = Math.cos(a) * radius,
      y = Math.sin(a) * radius,
      size = Math.max(3, this.size * 0.026);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y + size * 0.4, size, 0, Math.PI * 2);
    ctx.fill();
    const shine = ctx.createRadialGradient(x - size * 0.35, y - size * 0.35, size * 0.1, x, y, size);
    shine.addColorStop(0, "#ffffff");
    shine.addColorStop(1, "#b9c2cc");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}
