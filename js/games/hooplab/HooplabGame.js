class HooplabGame extends Game {
  static GRAVITY = 170;
  static IMPULSE = 75;
  static SUBSTEPS = 8;
  static HOLD_PULL = 22;
  static MAX_SPEED = 260;
  static DRAG_PX = 6;
  static KICK_BUTTON = 2;
  static GRAB_SLACK = 2.5;
  static GRAB_TRAIL = 4;
  static CEILING = -70;
  static BOUNCE = { floor: 0.72, rim: 0.5, board: 0.62, wall: 0.6 };
  static ROLLING = 1.2;
  static NET_DRAG = 0.965;
  static SOUND_GAP = 0.07;
  static SLOW_MOTION = 0.18;
  static SLOW_EASE = 10;
  static PATH_EVERY = 0.04;
  static PATH_MAX = 50;
  static SPAWN_KEY = "r";
  static SPAWN_HOLD = 1.5;
  static SPAWN_SHOW = 0.2;
  static SPAWN_Y = 55;

  constructor() {
    super({
      id: "hooplab",
      record: { key: "hooplab_best", label: "Meilleur combo", bar: false },
      name: "Hooplab",
      tag: "Lance le ballon où tu veux et marque des paniers spectaculaires",
      art: '<svg viewBox="3 2 60 57" style="height:1em"><rect x="56" y="4" width="5" height="34" rx="1.5" fill="#cfd8e3" stroke="#8c99a8" stroke-width="1.5"/><path d="M36 22h20" stroke="#e8492b" stroke-width="3.5" stroke-linecap="round"/><path d="M37 23l4 12h10l4-12M41 23l5 12 5-12" fill="none" stroke="#9aa6b5" stroke-width="1.4"/><circle cx="18" cy="44" r="13" fill="#f0741f" stroke="#7a2e08" stroke-width="2"/><path d="M5 44h26M18 31v26M9 34q7 10 0 20M27 34q-7 10 0 20" fill="none" stroke="#7a2e08" stroke-width="1.6"/></svg>',
      help: {
        goal: "Un terrain de basket en bac à sable : lance le ballon et marque les paniers les plus spectaculaires.",
        controls: [
          ["Glisser le ballon", "L'attrape ; relâche pour le lancer avec l'élan de ton geste"],
          ["Clic droit n'importe où", "Fait rebondir le ballon vers le haut ; une fois, puis il doit toucher le sol"],
          ["En l'air : appuyer ailleurs et tirer en arrière", "Tir en arc au ralenti, une fois par lancer ; la petite ligne montre la direction"],
          ["Traverser le cercle en tenant le ballon", "Dunk"],
          ["Boutons gauche / droite", "Changent le côté du panier"],
          ["↻", "Replace le ballon au point de réapparition"],
          ["R (un appui)", "Téléporte le ballon au point de réapparition et remet le combo à zéro"],
          ["R (maintenu 1,5 s)", "Place le point de réapparition sous la souris"],
        ],
        rules: [
          "Swish 3, dunk 3, planche 2, cercle 2, après un rebond au sol 1.",
          "Bonus selon l'endroit du lancer : mi-distance +1, loin +3, très loin +6 (lignes au sol).",
          "Tir pur (sans tir en arc) +2 ; chaque rebond au clic droit +2 ; lancer + rebond + tir en arc = combo total +3.",
          "Marque le panier suivant en moins de 20 s pour faire monter le combo : Double, Triple… jusqu'à MONSTRUEUX, points multipliés jusqu'à ×4.",
          "Le record est ton meilleur combo.",
        ],
      },
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
    this.kickReady = true;
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
    this.spawn = null;
    this.hover = null;
    this.spawnHold = null;
    this.bind();
    this.showStats();
  }

  bind() {
    this.canvas.addEventListener("pointerdown", (event) => this.down(event));
    this.canvas.addEventListener("pointermove", (event) => this.move(event));
    this.canvas.addEventListener("pointerup", (event) => this.up(event));
    this.canvas.addEventListener("pointercancel", () => this.drop());
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    this.canvas.addEventListener("mousedown", (event) => {
      if (event.button === HooplabGame.KICK_BUTTON) this.kick();
    });
    document.querySelectorAll("[data-hl-side]").forEach((button) => button.addEventListener("click", () => this.setSide(button.dataset.hlSide)));
    $("hlReset").addEventListener("click", () => this.resetBall());
    this.canvas.addEventListener("pointerleave", () => (this.hover = null));
    document.addEventListener("keydown", (event) => this.spawnKey(event, true));
    document.addEventListener("keyup", (event) => this.spawnKey(event, false));
    window.addEventListener("blur", () => (this.spawnHold = null));
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

  nearBall(at) {
    const reach = HoopBall.RADIUS * HooplabGame.GRAB_SLACK;
    const spots = [this.ball, ...this.ball.trail.slice(0, HooplabGame.GRAB_TRAIL)];
    return spots.some((spot) => Math.hypot(at.x - spot.x, at.y - spot.y) <= reach);
  }

  down(event) {
    if (event.button === HooplabGame.KICK_BUTTON) return;
    const at = this.world(event);
    const onBall = this.nearBall(at);
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
    this.hover = this.world(event);
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
    }
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
    if (!this.kickReady || this.held) return;
    this.kickReady = false;
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
    this.spawn = null;
    Sfx.play("select");
    this.layout();
    this.resetBall();
  }

  spawnPoint() {
    if (this.spawn) return this.spawn;
    return { x: this.side === "right" ? this.court.width * 0.22 : this.court.width * 0.78, y: HooplabGame.SPAWN_Y };
  }

  resetBall() {
    this.drop();
    this.fx.reset();
    const { x, y } = this.spawnPoint();
    this.ball.place(x, y);
    this.flight = this.newFlight(x, false);
  }

  spawnKey(event, down) {
    if (!this.raf || event.key.toLowerCase() !== HooplabGame.SPAWN_KEY || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest && event.target.closest("input, textarea")) return;
    event.preventDefault();
    if (down) {
      if (!event.repeat && !this.spawnHold) this.spawnHold = { t: 0, done: false };
      return;
    }
    const hold = this.spawnHold;
    this.spawnHold = null;
    if (hold && !hold.done) this.respawn();
  }

  respawn() {
    this.resetBall();
    this.rules.combo = 0;
    this.rules.comboLeft = 0;
    $("hlTimer").classList.remove("run");
    this.showStats();
    const { x, y } = this.spawnPoint();
    this.fx.tap(x, y);
    Sfx.play("pop");
  }

  spawnTarget() {
    const r = HoopBall.RADIUS,
      at = this.hover || this.ball;
    return { x: Math.max(r, Math.min(this.court.width - r, at.x)), y: Math.max(HooplabGame.CEILING + r, Math.min(HoopCourt.FLOOR_Y - r, at.y)) };
  }

  holdSpawn(dt) {
    const hold = this.spawnHold;
    if (!hold || hold.done) return;
    hold.t += dt;
    if (hold.t < HooplabGame.SPAWN_HOLD) return;
    hold.done = true;
    this.spawn = this.spawnTarget();
    this.fx.tap(this.spawn.x, this.spawn.y);
    this.fx.popup("Point de réapparition", "appuie sur R pour y revenir", "#4cc3ff", this.spawn.x, Math.max(10, this.spawn.y - 10), 4);
    Sfx.play("select");
  }

  drawSpawn(ctx) {
    const r = HoopBall.RADIUS,
      spot = this.spawnPoint(),
      hold = this.spawnHold;
    ctx.save();
    ctx.lineWidth = 0.35;
    ctx.setLineDash([0.9, 0.7]);
    ctx.strokeStyle = "rgba(76,195,255,0.55)";
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (hold && !hold.done && hold.t > HooplabGame.SPAWN_SHOW) {
      const at = this.spawnTarget(),
        share = Math.min(1, hold.t / HooplabGame.SPAWN_HOLD);
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(at.x, at.y, r + 1.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#4cc3ff";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(at.x, at.y, r + 1.4, -Math.PI / 2, -Math.PI / 2 + share * Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
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
    if (this.spawn && before) this.spawn.x = Math.min(this.spawn.x * (this.court.width / before), this.court.width - HoopBall.RADIUS);
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
      this.kickReady = true;
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
    this.holdSpawn(realDt);
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
    this.drawSpawn(ctx);
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
    this.spawnHold = null;
    this.timeScale = 1;
    $("hooplab").classList.add("hl-paused");
  }
}
