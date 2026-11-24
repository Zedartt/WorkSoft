class IncscapeGame extends Game {
  static MAX_ESC = 5;
  constructor() {
    super({
      id: "incscape",
      record: { key: "incscape_best", unit: "capturés" },
      name: "Incscape",
      tag: "Entoure les bonhommes d'encre avant qu'ils ne s'enfuient de la feuille",
      art: '<svg viewBox="0 0 80 80" style="height:1em" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><circle cx="40" cy="40" r="34" stroke-dasharray="7 9" stroke="#2f9be0"/><circle cx="40" cy="26" r="6" fill="currentColor" stroke="none"/><path d="M40 32v16M40 48l-8 12M40 48l8 12M40 37l-10-7M40 37l10-7"/></svg>',
      help: {
        goal: "Des bonhommes se promènent sur la feuille : entoure-les d'un trait d'encre pour les capturer avant qu'ils ne s'échappent.",
        controls: [
          ["Glisser", "Trace un trait d'encre"],
          ["Relâcher", "Ferme la forme : chaque bonhomme à l'intérieur est capturé"],
          ["Entrée", "Rejoue à la fin"],
        ],
        rules: [
          "Le trait se referme tout seul si tu le finis près de son début ; une boucle faite en recoupant ton trait marche aussi.",
          "Chaque trait a une réserve d'encre limitée.",
          "Un bonhomme qui sort de la feuille s'échappe : 5 échappés et c'est fini.",
          "Le jeu devient de plus en plus difficile.",
        ],
      },
    });
    this.canvas = $("inkCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.raf = 0;
    this.last = 0;
    this.bound = false;
    this.men = [];
    this.dots = [];
    this.fx = [];
    this.fading = [];
    this.stroke = null;
    this.score = 0;
    this.escaped = 0;
    this.t = 0;
    this.spawnIn = 0;
    this.over = false;
    this.inkMax = 1000;
  }

  hud() {
    $("inkScore").textContent = this.score;
    let h = "";
    for (let i = 0; i < IncscapeGame.MAX_ESC; i++) h += `<i class="esc${i < this.escaped ? " on" : ""}"></i>`;
    $("inkEsc").innerHTML = h;
  }

  reset() {
    this.men = [];
    this.dots = [];
    this.fx = [];
    this.fading = [];
    this.stroke = null;
    this.score = 0;
    this.escaped = 0;
    this.t = 0;
    this.spawnIn = 1;
    this.over = false;
    $("inkOver").classList.remove("show");
    this.hud();
  }

  level() {
    return this.score + this.t / 6;
  }

  spawn() {
    const a = Math.random() * Math.PI * 2;
    this.men.push({
      x: this.W * (0.2 + Math.random() * 0.6),
      y: this.H * (0.22 + Math.random() * 0.56),
      a,
      speed: Math.min(280, 60 + 3.2 * this.level()) * (0.85 + Math.random() * 0.3),
      born: 0,
      phase: Math.random() * 6,
      wob: Math.random() * 6,
      trail: 0,
    });
  }

  end() {
    this.over = true;
    this.stroke = null;
    Sfx.play("lose");
    let best = 0;
    try {
      best = +localStorage.getItem("incscape_best") || 0;
    } catch (e) {}
    $("inkFinal").textContent = this.score;
    if (this.score > best) {
      try {
        localStorage.setItem("incscape_best", this.score);
      } catch (e) {}
      $("inkRecord").textContent = best ? `Nouveau record ! (ancien : ${best})` : "Premier score enregistré.";
    } else $("inkRecord").textContent = `Ton record : ${best}`;
    $("inkOver").classList.add("show");
  }

  update(dt) {
    for (const d of this.dots) d.life -= dt;
    this.dots = this.dots.filter((d) => d.life > 0);
    for (const f of this.fx) f.life -= dt;
    this.fx = this.fx.filter((f) => f.life > 0);
    for (const f of this.fading) f.life -= dt;
    this.fading = this.fading.filter((f) => f.life > 0);
    if (this.over) return;
    this.t += dt;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawn();
      this.spawnIn = Math.max(0.45, 2.4 * Math.pow(0.975, this.level())) * (0.8 + Math.random() * 0.4);
    }
    for (const m of this.men) {
      m.born += dt;
      if (m.born < 0.7) continue;
      const a = m.a + Math.sin(m.wob + m.born * 3) * 0.4;
      m.vx = Math.cos(a);
      m.x += m.vx * m.speed * dt;
      m.y += Math.sin(a) * m.speed * dt;
      m.phase += dt * (6 + m.speed * 0.06);
      if (m.x < -22 || m.x > this.W + 22 || m.y < -22 || m.y > this.H + 26) {
        m.gone = true;
        this.escaped++;
        Sfx.play("escape");
        this.fx.push({
          type: "out",
          x: Math.min(Math.max(m.x, 0), this.W),
          y: Math.min(Math.max(m.y, 0), this.H),
          life: 0.8,
          max: 0.8,
        });
      }
    }
    if (this.men.some((m) => m.gone)) {
      this.men = this.men.filter((m) => !m.gone);
      this.hud();
      if (this.escaped >= IncscapeGame.MAX_ESC) this.end();
    }
  }

  pos(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top,
    };
  }

  finish() {
    if (!this.stroke) return;
    const s = this.stroke;
    this.stroke = null;
    const shapes = Geometry.findShapes(s.pts);
    const caught = this.men.filter((m) => shapes.some((sh) => Geometry.inside(sh, m.x, m.y)));
    if (caught.length) {
      Sfx.play("splat");
      Sfx.play("pop");
      for (const m of caught) {
        m.gone = true;
        this.fx.push({
          type: "splat",
          x: m.x,
          y: m.y,
          life: 0.5,
          max: 0.5,
          seed: Math.random() * 6,
        });
      }
      for (const sh of shapes) {
        if (caught.some((m) => Geometry.inside(sh, m.x, m.y)))
          this.fading.push({
            pts: sh,
            closed: true,
            good: true,
            life: 0.55,
            max: 0.55,
          });
      }
      this.men = this.men.filter((m) => !m.gone);
      this.score += caught.length;
      this.hud();
    } else {
      this.fading.push({
        pts: s.pts,
        closed: !!shapes.auto,
        good: false,
        life: 0.35,
        max: 0.35,
      });
      Sfx.play("miss");
    }
  }

  bind() {
    this.canvas.addEventListener("pointerdown", (e) => {
      if (this.over || e.button > 0) return;
      this.canvas.setPointerCapture(e.pointerId);
      this.stroke = {
        pts: [this.pos(e)],
        len: 0,
      };
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.stroke) return;
      const p = this.pos(e),
        q = this.stroke.pts[this.stroke.pts.length - 1],
        d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < 4) return;
      this.stroke.pts.push(p);
      this.stroke.len += d;
      if (this.stroke.len >= this.inkMax) this.finish();
    });
    this.canvas.addEventListener("pointerup", (...args) => this.finish(...args));
    this.canvas.addEventListener("pointercancel", (...args) => this.finish(...args));
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("resize", () => {
      if (this.raf) this.resize();
    });
    document.addEventListener("keydown", (e) => {
      if (this.raf && this.over && e.key === "Enter") {
        e.preventDefault();
        this.reset();
      }
    });
    $("inkRestart").addEventListener("click", (...args) => this.reset(...args));
    $("inkAgain").addEventListener("click", (...args) => this.reset(...args));
    $("inkMenu").addEventListener("click", () => app.launcher.backToMenu());
    this.bound = true;
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
    this.inkMax = Math.min(this.W, this.H) * 2.1;
  }

  path(pts, closed) {
    this.ctx.beginPath();
    this.ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) this.ctx.lineTo(pts[i].x, pts[i].y);
    if (closed) this.ctx.closePath();
  }

  drawMan(m) {
    const k = Math.min(1, m.born / 0.7),
      run = m.born >= 0.7;
    this.ctx.save();
    this.ctx.translate(m.x, m.y);
    this.ctx.scale(k, k);
    if (run) this.ctx.rotate((m.vx || 0) * 0.22);
    const s = run ? Math.sin(m.phase) : 0,
      c = run ? Math.cos(m.phase) : 0;
    this.ctx.lineWidth = 3.4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -12);
    this.ctx.lineTo(0, 3);
    this.ctx.moveTo(0, 3);
    this.ctx.lineTo(s * 9, 15);
    this.ctx.moveTo(0, 3);
    this.ctx.lineTo(-s * 9, 15);
    this.ctx.moveTo(0, -8);
    this.ctx.lineTo(-9, -15 + c * 4);
    this.ctx.moveTo(0, -8);
    this.ctx.lineTo(9, -15 - c * 4);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(0, -18, 6.5, 0, 7);
    this.ctx.fill();
    this.ctx.restore();
  }

  draw() {
    const ink = ThemeSwitch.color("--ink"),
      accent = ThemeSwitch.color("--accent"),
      bad = ThemeSwitch.color("--bad");
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.W, this.H);
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    if (!this.over && this.score === 0 && this.t < 6) {
      this.ctx.globalAlpha = Math.min(1, (6 - this.t) / 1.5) * 0.55;
      this.ctx.fillStyle = ink;
      const intro = "Entoure les bonhommes d'un trait avant qu'ils ne s'enfuient de la feuille";
      this.ctx.font = "600 18px 'Segoe UI', system-ui, sans-serif";
      const size = Math.min(18, (18 * (this.W - 24)) / this.ctx.measureText(intro).width);
      this.ctx.font = `600 ${size}px 'Segoe UI', system-ui, sans-serif`;
      this.ctx.textAlign = "center";
      this.ctx.fillText(intro, this.W / 2, 34);
      this.ctx.globalAlpha = 1;
    }
    this.ctx.fillStyle = ink;
    this.ctx.strokeStyle = ink;
    for (const d of this.dots) {
      this.ctx.globalAlpha = (0.35 * d.life) / d.max;
      this.ctx.beginPath();
      this.ctx.arc(d.x, d.y, d.r, 0, 7);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    for (const f of this.fading) {
      const k = f.life / f.max;
      this.path(f.pts, f.closed);
      if (f.good) {
        this.ctx.globalAlpha = 0.25 * k;
        this.ctx.fillStyle = accent;
        this.ctx.fill();
        this.ctx.fillStyle = ink;
      }
      this.ctx.globalAlpha = k;
      this.ctx.strokeStyle = f.good ? accent : ink;
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1;
    this.ctx.strokeStyle = ink;
    this.ctx.fillStyle = ink;
    for (const m of this.men) this.drawMan(m);
    if (this.stroke && this.stroke.pts.length > 1) {
      let len = 0;
      const p = this.stroke.pts;
      const shapes = Geometry.findShapes(p);
      if (shapes.length) this.ctx.strokeStyle = accent;
      if (shapes.auto) {
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 8]);
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.moveTo(p[p.length - 1].x, p[p.length - 1].y);
        this.ctx.lineTo(p[0].x, p[0].y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
      }
      for (let i = 1; i < p.length; i++) {
        len += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
        this.ctx.lineWidth = 5.5 - 4 * Math.min(1, len / this.inkMax);
        this.ctx.beginPath();
        this.ctx.moveTo(p[i - 1].x, p[i - 1].y);
        this.ctx.lineTo(p[i].x, p[i].y);
        this.ctx.stroke();
      }
    }
    for (const f of this.fx) {
      const k = 1 - f.life / f.max;
      if (f.type === "splat") {
        this.ctx.fillStyle = ink;
        this.ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 9; i++) {
          const a = f.seed + i * 0.7,
            r = 8 + k * (26 + (i % 3) * 10);
          this.ctx.beginPath();
          this.ctx.arc(f.x + Math.cos(a) * r, f.y + Math.sin(a) * r, 4.5 * (1 - k) + 1, 0, 7);
          this.ctx.fill();
        }
      } else {
        this.ctx.strokeStyle = bad;
        this.ctx.globalAlpha = 1 - k;
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(f.x, f.y, 10 + k * 40, 0, 7);
        this.ctx.stroke();
      }
    }
    this.ctx.globalAlpha = 1;
  }

  frame(now) {
    const dt = Math.min(now - this.last, 50) / 1000;
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame((...args) => this.frame(...args));
  }

  open() {
    if (!this.bound) this.bind();
    this.resize();
    this.reset();
    this.last = performance.now();
    this.raf = requestAnimationFrame((...args) => this.frame(...args));
  }

  close() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.stroke = null;
  }
}
