class KaplabGame extends Game {
  static L = 130;
  static T = 14;
  static FLOOR = 40;
  static MAX = 200;
  static TONES = ["#e6bd84", "#deb276", "#ecc690", "#d9aa6c", "#e2b87c"];
  static TURN_SPEED = 2.4;
  constructor() {
    super({
      id: "planks",
      name: "Kaplab",
      tag: "Des planchettes en bois, de la gravité, et tu construis ce que tu veux",
      art: '<svg viewBox="0 0 120 70" style="height:1em"><g fill="#e2b87c" stroke="#a9793f" stroke-width="2"><rect x="10" y="56" width="100" height="10"/><rect x="18" y="14" width="10" height="42"/><rect x="92" y="14" width="10" height="42"/><rect x="8" y="4" width="104" height="10"/></g></svg>',
    });
    this.canvas = $("plkCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.engine = null;
    this.mouse = null;
    this.mc = null;
    this.walls = [];
    this.planks = [];
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.raf = 0;
    this.last = 0;
    this.acc = 0;
    this.inited = false;
    this.dropIn = -1;
    this.pointerIn = false;
    this.handGravity = false;
    this.lastPlank = null;
    this.turn = 0;
  }

  spawn(x, y, angle) {
    if (this.planks.length >= KaplabGame.MAX) return;
    const b = Matter.Bodies.rectangle(x, y, KaplabGame.L, KaplabGame.T, {
      angle,
      friction: 0.8,
      frictionStatic: 1.2,
      restitution: 0.02,
      density: 0.002,
      frictionAir: 0.012,
    });
    b.plugin.tone = KaplabGame.TONES[Math.floor(Math.random() * KaplabGame.TONES.length)];
    this.planks.push(b);
    Matter.Composite.add(this.engine.world, b);
    Sfx.play("pop");
    $("plkCount").textContent = this.planks.length;
    return b;
  }

  demo() {
    this.clearAll();
    const cx = this.W / 2,
      fy = this.H - KaplabGame.FLOOR;
    this.spawn(cx, fy - KaplabGame.T / 2, 0);
    this.spawn(cx - (KaplabGame.L / 2 - KaplabGame.T / 2), fy - KaplabGame.T - KaplabGame.L / 2, Math.PI / 2);
    this.spawn(cx + (KaplabGame.L / 2 - KaplabGame.T / 2), fy - KaplabGame.T - KaplabGame.L / 2, Math.PI / 2);
    this.spawn(cx, fy - KaplabGame.T - KaplabGame.L - KaplabGame.T / 2, 0);
    this.dropIn = 1000;
  }

  dropBreaker() {
    const b = this.spawn(this.W / 2 + 100, 60, -0.8);
    if (b)
      Matter.Body.setVelocity(b, {
        x: -6,
        y: 22,
      });
  }

  rain(n) {
    for (let i = 0; i < n; i++) {
      this.spawn(KaplabGame.L / 2 + 20 + Math.random() * Math.max(10, this.W - KaplabGame.L - 40), 50, (Math.random() - 0.5) * 1.2);
    }
  }

  clearAll() {
    this.planks.forEach((b) => Matter.Composite.remove(this.engine.world, b));
    this.planks = [];
    this.lastPlank = null;
    $("plkCount").textContent = 0;
    this.dropIn = -1;
  }

  buildWalls() {
    this.walls.forEach((b) => Matter.Composite.remove(this.engine.world, b));
    const o = {
        isStatic: true,
        friction: 0.9,
        frictionStatic: 1.2,
      },
      big = 6000;
    this.walls = [
      Matter.Bodies.rectangle(this.W / 2, -150, this.W + 800, 300, o),
      Matter.Bodies.rectangle(this.W / 2, this.H - KaplabGame.FLOOR + 150, this.W + 800, 300, o),
      Matter.Bodies.rectangle(-150, this.H - big / 2, 300, big, o),
      Matter.Bodies.rectangle(this.W + 150, this.H - big / 2, 300, big, o),
    ];
    Matter.Composite.add(this.engine.world, this.walls);
  }

  resize() {
    const r = {
      width: this.canvas.clientWidth,
      height: this.canvas.clientHeight,
    };
    if (!r.width || !r.height) return;
    this.dpr = window.devicePixelRatio || 1;
    this.W = r.width;
    this.H = r.height;
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.mouse.pixelRatio = this.dpr * (this.canvas.width / (this.W * this.dpr));
    this.buildWalls();
    this.planks.forEach((b) => {
      const x = Math.min(Math.max(b.position.x, 20), this.W - 20),
        y = Math.min(Math.max(b.position.y, 20), this.H - KaplabGame.FLOOR - 10);
      if (x !== b.position.x || y !== b.position.y)
        Matter.Body.setPosition(b, {
          x,
          y,
        });
    });
  }

  init() {
    this.engine = Matter.Engine.create({
      positionIterations: 12,
      velocityIterations: 10,
    });
    this.engine.gravity.y = 1;
    this.mouse = Matter.Mouse.create(this.canvas);
    this.mc = Matter.MouseConstraint.create(this.engine, {
      mouse: this.mouse,
      constraint: {
        stiffness: 0.18,
        damping: 0.1,
        render: {
          visible: false,
        },
      },
    });
    Matter.Composite.add(this.engine.world, this.mc);
    Matter.Events.on(this.engine, "beforeUpdate", () => {
      if (this.mc.body && !this.handGravity) Matter.Body.setAngularVelocity(this.mc.body, this.mc.body.angularVelocity * 0.8);
    });
    let lastKnock = 0;
    Matter.Events.on(this.engine, "collisionStart", (ev) => {
      const now = performance.now();
      if (now - lastKnock < 60) return;
      let v = 0;
      for (const p of ev.pairs)
        v = Math.max(v, Math.hypot(p.bodyA.velocity.x - p.bodyB.velocity.x, p.bodyA.velocity.y - p.bodyB.velocity.y));
      if (v > 1.2) {
        lastKnock = now;
        Sfx.play("knock", Math.min(1, v / 14));
      }
    });
    Matter.Events.on(this.mc, "startdrag", (e) => {
      this.lastPlank = e.body;
      Sfx.play("click");
    });
    window.addEventListener("mouseup", (e) => this.mouse.mouseup(e));
    window.addEventListener("mousemove", (e) => {
      if (this.raf && this.mc.body && e.target !== this.canvas) this.mouse.mousemove(e);
    });
    window.addEventListener("resize", () => {
      if (this.raf) this.resize();
    });
    this.canvas.addEventListener("wheel", (e) => {
      if (this.mc.body) this.rotateHeld(e.deltaY > 0 ? 1 : -1);
    });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    document.addEventListener("keydown", (e) => {
      if (!this.raf) return;
      if ((e.key === "g" || e.key === "G") && !e.repeat) {
        this.toggleHandGravity();
        return;
      }
      if (!this.mc.body) return;
      if (e.key === "ArrowLeft" || e.key === "q" || e.key === "a") this.rotateHeld(-1);
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "e") this.rotateHeld(1);
    });
    $("plkAdd").addEventListener("click", () => this.rain(1));
    $("plkGravBtn").addEventListener("click", () => this.toggleHandGravity());
    this.bindTurnButton($("plkTurnLeft"), -1);
    this.bindTurnButton($("plkTurnRight"), 1);
    $("plkReset").addEventListener("click", (...args) => this.demo(...args));
    this.canvas.addEventListener("mouseenter", () => {
      this.pointerIn = true;
    });
    this.canvas.addEventListener("mousemove", () => {
      this.pointerIn = true;
    });
    this.canvas.addEventListener("mouseleave", () => {
      this.pointerIn = false;
    });
    $("plkClear").addEventListener("click", (...args) => this.clearAll(...args));
    this.resize();
    this.demo();
    this.inited = true;
  }

  rotateHeld(dir) {
    this.rotate(this.mc.body, (dir * Math.PI) / 180);
  }

  rotate(body, angle) {
    Matter.Body.setAngle(body, body.angle + angle);
    Matter.Body.setAngularVelocity(body, 0);
    Matter.Sleeping.set(body, false);
  }

  bindTurnButton(button, dir) {
    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.turn = dir;
    });
    for (const type of ["pointerup", "pointerleave", "pointercancel"])
      button.addEventListener(type, () => {
        if (this.turn === dir) this.turn = 0;
      });
  }

  toggleHandGravity() {
    this.handGravity = !this.handGravity;
    this.mc.constraint.angularStiffness = this.handGravity ? 0 : 1;
    $("plkGrav").textContent = this.handGravity ? "oui" : "non";
  }

  turnTarget(dt) {
    const body = this.mc.body || this.lastPlank;
    if (!this.turn || !body) return;
    this.rotate(body, this.turn * KaplabGame.TURN_SPEED * dt);
  }

  draw() {
    const dark = document.documentElement.dataset.theme === "dark";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.ctx.fillStyle = ThemeSwitch.color("--bar");
    this.ctx.fillRect(0, this.H - KaplabGame.FLOOR, this.W, KaplabGame.FLOOR);
    this.ctx.fillStyle = ThemeSwitch.color("--line");
    this.ctx.fillRect(0, this.H - KaplabGame.FLOOR, this.W, 2);
    const accent = ThemeSwitch.color("--accent");
    const hover = !this.mc.body && this.pointerIn ? Matter.Query.point(this.planks, this.mouse.position)[0] : null;
    for (const b of this.planks) {
      this.ctx.save();
      this.ctx.translate(b.position.x, b.position.y);
      this.ctx.rotate(b.angle);
      this.ctx.globalAlpha = dark ? 0.92 : 1;
      this.ctx.fillStyle = b.plugin.tone;
      this.ctx.fillRect(-KaplabGame.L / 2, -KaplabGame.T / 2, KaplabGame.L, KaplabGame.T);
      this.ctx.strokeStyle = "rgba(120,80,30,.35)";
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(-KaplabGame.L / 2 + 6, -KaplabGame.T / 6);
      this.ctx.lineTo(KaplabGame.L / 2 - 10, -KaplabGame.T / 6);
      this.ctx.moveTo(-KaplabGame.L / 2 + 14, KaplabGame.T / 5);
      this.ctx.lineTo(KaplabGame.L / 2 - 5, KaplabGame.T / 5);
      this.ctx.stroke();
      this.ctx.globalAlpha = 1;
      if (b === this.mc.body) {
        this.ctx.strokeStyle = accent;
        this.ctx.lineWidth = 3;
      } else {
        this.ctx.strokeStyle = "#a9793f";
        this.ctx.lineWidth = 1.5;
      }
      this.ctx.strokeRect(-KaplabGame.L / 2, -KaplabGame.T / 2, KaplabGame.L, KaplabGame.T);
      if (b === hover) {
        this.ctx.strokeStyle = "#fff";
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(-KaplabGame.L / 2 + 1.75, -KaplabGame.T / 2 + 1.75, KaplabGame.L - 3.5, KaplabGame.T - 3.5);
      }
      this.ctx.restore();
    }
    this.canvas.style.cursor = this.mc.body ? "grabbing" : hover ? "grab" : "default";
  }

  frame(now) {
    const dt = Math.min(now - this.last, 50);
    this.last = now;
    this.acc += dt;
    if (this.dropIn >= 0) {
      this.dropIn -= dt;
      if (this.dropIn < 0) this.dropBreaker();
    }
    this.turnTarget(dt / 1000);
    const step = 1000 / 120;
    while (this.acc >= step) {
      Matter.Engine.update(this.engine, step);
      this.acc -= step;
    }
    for (const b of this.planks) {
      if (b.position.y > this.H + 400 || b.position.y < -400 || b.position.x < -400 || b.position.x > this.W + 400) {
        Matter.Body.setPosition(b, {
          x: this.W / 2,
          y: 60,
        });
        Matter.Body.setVelocity(b, {
          x: 0,
          y: 0,
        });
      }
    }
    this.draw();
    this.raf = requestAnimationFrame((...args) => this.frame(...args));
  }

  open() {
    if (!this.inited) this.init();
    else this.resize();
    this.last = performance.now();
    this.acc = 0;
    this.raf = requestAnimationFrame((...args) => this.frame(...args));
  }

  close() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
