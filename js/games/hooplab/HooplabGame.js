class HooplabGame extends Game {
  static GRAVITY = 170;
  static IMPULSE = 75;
  static SUBSTEPS = 8;
  static HOLD_PULL = 22;
  static MAX_SPEED = 260;
  static DRAG_PX = 6;
  static GRAB_SLACK = 1.8;
  static CEILING = -70;
  static BOUNCE = { floor: 0.72, rim: 0.5, board: 0.62, wall: 0.6 };
  static ROLLING = 1.2;
  static NET_DRAG = 0.965;
  static SOUND_GAP = 0.07;
  static SLOW_MOTION = 0.18;
  static SLOW_EASE = 10;
  static PATH_EVERY = 0.04;
  static PATH_MAX = 50;

  constructor() {
    super({
      id: "hooplab",
      name: "Hooplab",
      tag: "Lance le ballon où tu veux et marque des paniers spectaculaires",
      art: '<svg viewBox="3 2 60 57" style="height:1em"><rect x="56" y="4" width="5" height="34" rx="1.5" fill="#cfd8e3" stroke="#8c99a8" stroke-width="1.5"/><path d="M36 22h20" stroke="#e8492b" stroke-width="3.5" stroke-linecap="round"/><path d="M37 23l4 12h10l4-12M41 23l5 12 5-12" fill="none" stroke="#9aa6b5" stroke-width="1.4"/><circle cx="18" cy="44" r="13" fill="#f0741f" stroke="#7a2e08" stroke-width="2"/><path d="M5 44h26M18 31v26M9 34q7 10 0 20M27 34q-7 10 0 20" fill="none" stroke="#7a2e08" stroke-width="1.6"/></svg>',
    });
    this.canvas = $("hlCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.court = new HoopCourt();
    this.ball = new HoopBall();
    this.net = new HoopNet();
    this.fx = new HoopFx();
    this.rules = new HoopRules();
    this.aim = new HoopAim();
    this.side = "right";
    this.pointer = null;
    this.timeScale = 1;
    this.pathClock = 0;
    this.held = false;
    this.flight = this.newFlight(0, false);
    this.soundAt = {};
    this.scale = 1;
    this.dpr = 1;
    this.time = 0;
    this.raf = 0;
    this.last = 0;
    this.started = false;
    this.bind();
    this.showStats();
  }

  bind() {
    this.canvas.addEventListener("pointerdown", (event) => this.down(event));
    this.canvas.addEventListener("pointermove", (event) => this.move(event));
    this.canvas.addEventListener("pointerup", (event) => this.up(event));
    this.canvas.addEventListener("pointercancel", () => this.drop());
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    document.querySelectorAll("[data-hl-side]").forEach((button) => button.addEventListener("click", () => this.setSide(button.dataset.hlSide)));
    $("hlReset").addEventListener("click", () => this.resetBall());
    window.addEventListener("resize", () => {
      if (this.raf) this.resize();
    });
  }

  newFlight(fromX, thrown, kicks = 0) {
    return { fromX, thrown, kicks, arc: false, rim: false, board: false, floor: 0, scored: false, path: [] };
  }

  airborne() {
    return this.ball.y + HoopBall.RADIUS < HoopCourt.FLOOR_Y - 1;
  }

  canArc() {
    const flight = this.flight;
    return flight.thrown && !flight.arc && !flight.scored && !this.held && this.airborne();
  }

  world(event) {
    return { x: event.offsetX / this.scale, y: event.offsetY / this.scale, px: event.offsetX, py: event.offsetY };
  }

  down(event) {
    const at = this.world(event);
    const onBall = Math.hypot(at.x - this.ball.x, at.y - this.ball.y) <= HoopBall.RADIUS * HooplabGame.GRAB_SLACK;
    if (!onBall && !this.canArc()) return;
    this.canvas.setPointerCapture(event.pointerId);
    if (onBall) {
      this.pointer = { ...at, startX: at.px, startY: at.py };
      return;
    }
    this.aim.start(at);
    this.canvas.style.cursor = "var(--cur-grab)";
    Sfx.play("hoopDraw");
  }

  move(event) {
    if (this.aim.active) {
      this.aim.move(this.world(event));
      return;
    }
    if (!this.pointer) return;
    Object.assign(this.pointer, this.world(event));
    if (this.held || Math.hypot(this.pointer.px - this.pointer.startX, this.pointer.py - this.pointer.startY) < HooplabGame.DRAG_PX) return;
    this.held = true;
    this.flight = this.newFlight(this.ball.x, false);
    this.canvas.style.cursor = "var(--cur-grab)";
    Sfx.play("click");
  }

  up() {
    if (this.aim.active) {
      this.shootArc();
      this.drop();
      return;
    }
    if (!this.pointer) return;
    if (this.held) {
      this.flight = this.newFlight(this.ball.x, true);
      Sfx.play("whoosh");
    } else this.kick();
    this.drop();
  }

  drop() {
    this.pointer = null;
    this.held = false;
    this.aim.stop();
    this.canvas.style.cursor = "";
  }

  shootArc() {
    const pull = this.aim.pull();
    if (!pull.ready || !this.canArc()) return;
    const ball = this.ball;
    ball.vx = pull.nx * pull.speed;
    ball.vy = pull.ny * pull.speed;
    this.flight.arc = true;
    this.fx.tap(ball.x, ball.y);
    Sfx.play("hoopArc", pull.share);
  }

  kick() {
    const ball = this.ball;
    ball.vy = Math.min(ball.vy, 0) - HooplabGame.IMPULSE;
    if (this.flight.scored || !this.airborne()) this.flight = this.newFlight(ball.x, false, 1);
    else this.flight.kicks++;
    this.fx.tap(ball.x, ball.y);
    Sfx.play("hoopTap");
  }

  setSide(side) {
    if (side === this.side) return;
    this.side = side;
    Sfx.play("select");
    this.layout();
    this.resetBall();
  }

  resetBall() {
    this.drop();
    this.fx.reset();
    const x = this.side === "right" ? this.court.width * 0.22 : this.court.width * 0.78;
    this.ball.place(x, 55);
    this.flight = this.newFlight(x, false);
  }

  layout() {
    this.court.layout(this.canvas.clientWidth / this.scale, this.side);
    this.net.build(this.court);
    document.querySelectorAll("[data-hl-side]").forEach((button) => button.classList.toggle("on", button.dataset.hlSide === this.side));
  }

  resize() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    const before = this.court.width;
    this.dpr = window.devicePixelRatio || 1;
    this.scale = height / 100;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.layout();
    this.ball.x = Math.min(this.ball.x * (this.court.width / before), this.court.width - HoopBall.RADIUS);
  }

  sound(name, impact, threshold) {
    if (impact < threshold || this.time - (this.soundAt[name] || -1) < HooplabGame.SOUND_GAP) return;
    this.soundAt[name] = this.time;
    Sfx.play(name, Math.min(1, impact / 140));
  }

  stepBall(h) {
    const ball = this.ball;
    if (this.held) {
      ball.vx = (this.pointer.x - ball.x) * HooplabGame.HOLD_PULL;
      ball.vy = (this.pointer.y - ball.y) * HooplabGame.HOLD_PULL;
      const speed = ball.speed();
      if (speed > HooplabGame.MAX_SPEED) {
        ball.vx *= HooplabGame.MAX_SPEED / speed;
        ball.vy *= HooplabGame.MAX_SPEED / speed;
      }
      ball.spin *= 0.9;
    } else ball.vy += HooplabGame.GRAVITY * h;
    const prevY = ball.y;
    ball.x += ball.vx * h;
    ball.y += ball.vy * h;
    this.collide(h);
    if (prevY < HoopCourt.RIM_Y && ball.y >= HoopCourt.RIM_Y && ball.vy > 0 && this.court.insideRim(ball.x) && !this.flight.scored) this.scored();
  }

  collide(h) {
    const { ball, court, flight } = this;
    const bounce = HooplabGame.BOUNCE;
    for (const point of [court.front, court.back]) {
      const impact = ball.hitPoint(point.x, point.y, HoopCourt.RIM_TUBE, bounce.rim);
      if (impact) {
        flight.rim = true;
        this.fx.rimGlow = Math.max(this.fx.rimGlow, Math.min(0.5, impact / 200));
        this.sound("hoopRim", impact, 8);
      }
    }
    if (this.fx.glassSolid()) {
      const impact = ball.hitBox(court.board, bounce.board);
      if (impact) {
        flight.board = true;
        this.sound("hoopBoard", impact, 6);
      }
    }
    this.sound("hoopBoard", ball.hitBox(court.pole, bounce.board), 6);
    if (ball.y + HoopBall.RADIUS > HoopCourt.FLOOR_Y) {
      ball.y = HoopCourt.FLOOR_Y - HoopBall.RADIUS;
      const impact = ball.reflect(0, -1, bounce.floor);
      if (Math.abs(ball.vy) < 6) ball.vy = 0;
      ball.vx *= 1 - HooplabGame.ROLLING * h;
      ball.spin = ball.vx / HoopBall.RADIUS;
      if (impact > 10) this.landed(impact);
    }
    if (ball.x < HoopBall.RADIUS) {
      ball.x = HoopBall.RADIUS;
      this.sound("hoopBoard", ball.reflect(1, 0, bounce.wall), 10);
    }
    if (ball.x > court.width - HoopBall.RADIUS) {
      ball.x = court.width - HoopBall.RADIUS;
      this.sound("hoopBoard", ball.reflect(-1, 0, bounce.wall), 10);
    }
    if (ball.y < HooplabGame.CEILING + HoopBall.RADIUS) {
      ball.y = HooplabGame.CEILING + HoopBall.RADIUS;
      ball.reflect(0, 1, bounce.wall);
    }
  }

  landed(impact) {
    this.sound("hoopBounce", impact, 10);
    if (!this.held) this.flight.floor++;
  }

  scored() {
    this.flight.scored = true;
    const shot = this.rules.shot(this.flight, this.held, this.court);
    this.fx.celebrate(shot, this.court);
    this.fx.zone(shot.zone.id, this.court);
    this.fx.tricks(shot.trick, this.ball, this.flight.path);
    this.fx.streak(shot.combo, this.court);
    this.playShot(shot);
    this.showStats();
    this.restartTimer();
  }

  playShot(shot) {
    Sfx.play("hoopSwish", shot.kind === "swish" ? 1 : 0.6);
    if (shot.kind === "dunk") {
      Sfx.play("hoopDunk");
      Sfx.play("hoopGlass");
    }
    if (shot.kind === "board") Sfx.play("hoopLights");
    if (shot.trick.kicks) Sfx.play("hoopBubbles");
    if (shot.combo >= 2) Sfx.play("hoopStreak", shot.combo);
    if (this.rules.onFire()) Sfx.play("hoopFire");
    Sfx.play("hoopCheer", Math.min(1, shot.cheer + shot.zone.bonus * 0.05 + shot.combo * 0.05));
  }

  restartTimer() {
    const bar = $("hlTimer");
    bar.classList.remove("run");
    bar.style.animationDuration = HoopRules.COMBO_TIME + "s";
    void bar.offsetWidth;
    bar.classList.add("run");
  }

  showStats() {
    $("hlScore").textContent = this.rules.score;
    $("hlCombo").textContent = this.rules.combo;
    $("hlBest").textContent = this.rules.best;
    $("hlArea").classList.toggle("hl-fire", this.rules.onFire());
  }

  comboEnded(count) {
    $("hlTimer").classList.remove("run");
    if (count >= 2) this.fx.popup("Combo terminé", `${count} paniers d'affilée`, "#9aa5b5", this.court.width / 2, 18, 6);
    this.showStats();
  }

  update(realDt) {
    const target = this.aim.active ? HooplabGame.SLOW_MOTION : 1;
    this.timeScale += (target - this.timeScale) * Math.min(1, realDt * HooplabGame.SLOW_EASE);
    if (this.aim.active && !this.canArc()) this.drop();
    const dt = realDt * this.timeScale;
    this.time += dt;
    const ended = this.rules.tick(realDt);
    if (ended) this.comboEnded(ended);
    const h = dt / HooplabGame.SUBSTEPS;
    for (let i = 0; i < HooplabGame.SUBSTEPS; i++) {
      this.stepBall(h);
      if (this.net.step(h, this.ball) && !this.held) {
        this.ball.vx *= HooplabGame.NET_DRAG;
        this.ball.vy *= 0.99;
      }
    }
    if (!this.held && this.ball.y + HoopBall.RADIUS < HoopCourt.FLOOR_Y) this.ball.spin *= 1 - 0.3 * dt;
    this.ball.angle += this.ball.spin * dt;
    this.ball.remember();
    this.recordPath(dt);
    if (this.rules.onFire()) this.fx.flames(this.ball, dt);
    this.fx.update(dt);
  }

  recordPath(dt) {
    this.pathClock += dt;
    const path = this.flight.path;
    if (this.pathClock < HooplabGame.PATH_EVERY || this.flight.scored || !this.airborne() || path.length >= HooplabGame.PATH_MAX) return;
    this.pathClock = 0;
    path.push({ x: this.ball.x, y: this.ball.y });
  }

  draw() {
    const ctx = this.ctx;
    const shake = this.fx.offset();
    const unit = this.scale * this.dpr;
    ctx.setTransform(unit, 0, 0, unit, shake.x * unit, shake.y * unit);
    this.court.drawBackdrop(ctx);
    this.fx.drawBack(ctx, this.court, this.time);
    this.ball.drawGround(ctx, HoopCourt.FLOOR_Y);
    this.court.drawHoopBack(ctx, this.fx, this.time);
    this.fx.drawUnder(ctx);
    this.ball.drawTrail(ctx);
    this.ball.draw(ctx);
    this.net.draw(ctx);
    this.court.drawRimFront(ctx);
    this.fx.drawFront(ctx, this.court.width);
    if (this.timeScale < 0.98) this.drawSlowMotion(ctx);
    if (this.ball.y + HoopBall.RADIUS < 0) this.drawMarker(ctx);
  }

  drawSlowMotion(ctx) {
    const strength = (1 - this.timeScale) / (1 - HooplabGame.SLOW_MOTION);
    const glow = ctx.createRadialGradient(this.ball.x, this.ball.y, 8, this.ball.x, this.ball.y, 90);
    glow.addColorStop(0, "rgba(8,14,30,0)");
    glow.addColorStop(1, `rgba(8,14,30,${0.45 * strength})`);
    ctx.fillStyle = glow;
    ctx.fillRect(-10, -130, this.court.width + 20, 260);
    this.ball.draw(ctx);
    if (this.aim.active) this.aim.draw(ctx, this.ball);
  }

  drawMarker(ctx) {
    const x = Math.max(2, Math.min(this.court.width - 2, this.ball.x));
    ctx.fillStyle = "#f0741f";
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(x, 0.8);
    ctx.lineTo(x - 1.6, 3.6);
    ctx.lineTo(x + 1.6, 3.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  frame(now) {
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  open() {
    this.resize();
    if (!this.started) {
      this.started = true;
      this.resetBall();
    }
    $("hooplab").classList.remove("hl-paused");
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  close() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.drop();
    this.timeScale = 1;
    $("hooplab").classList.add("hl-paused");
  }
}
