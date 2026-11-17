class WordHuntGame extends Game {
  static MAX_MISSES = 3;
  static POINTS_PER_LETTER = 10;
  static FIRST_GAP = 2.8;
  static MIN_GAP = 0.9;
  static GAP_DROP = 0.018;
  static FIRST_CROSS = 9.5;
  static MIN_CROSS = 4.2;
  static CROSS_DROP = 0.035;
  static LETTER_TIME = 0.18;
  static FIRST_ON_SCREEN = 2;
  static MAX_ON_SCREEN = 8;
  static MORE_EVERY = 20;
  static FIRST_EFFECTS = 0.2;
  static MAX_EFFECTS = 0.75;
  static EFFECTS_RAMP = 180;
  static SPARKS = 18;

  constructor() {
    super({
      id: "wordhunt",
      name: "WordHunt",
      tag: "Tape les mots lancés dans le ciel avant qu'ils ne s'envolent",
      art: '<svg viewBox="34 0 60 60" style="height:1em" fill="none" stroke-linecap="round"><text x="64" y="39" text-anchor="middle" font-size="25" font-weight="800" fill="currentColor">A</text><g stroke="#e5484d" stroke-width="4"><circle cx="64" cy="30" r="19"/><path d="M64 4v9M64 47v9M38 30h9M81 30h9"/></g></svg>',
    });
    this.canvas = $("whCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.input = $("whInput");
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.font = "";
    this.raf = 0;
    this.last = 0;
    this.bound = false;
    this.words = [];
    this.sparks = [];
    this.labels = [];
    this.rings = [];
    this.typed = "";
    this.score = 0;
    this.misses = 0;
    this.t = 0;
    this.spawnIn = 0;
    this.over = false;
  }

  hud() {
    $("whScore").textContent = this.score;
    let h = "";
    for (let i = 0; i < WordHuntGame.MAX_MISSES; i++) h += `<i class="esc${i < this.misses ? " on" : ""}"></i>`;
    $("whMiss").innerHTML = h;
  }

  reset() {
    this.words = [];
    this.sparks = [];
    this.labels = [];
    this.rings = [];
    this.typed = "";
    this.input.value = "";
    this.score = 0;
    this.misses = 0;
    this.t = 0;
    this.spawnIn = 0.8;
    this.over = false;
    $("whOver").classList.remove("show");
    this.hud();
    this.input.focus();
  }

  spawn() {
    const text = WordList.pick(new Set(this.words.map((w) => w.text)));
    this.ctx.font = this.font;
    const width = this.ctx.measureText(text).width,
      cross = Math.max(WordHuntGame.MIN_CROSS, WordHuntGame.FIRST_CROSS - this.t * WordHuntGame.CROSS_DROP),
      duration = (cross + text.length * WordHuntGame.LETTER_TIME) * (0.9 + Math.random() * 0.2),
      effectChance = Math.min(WordHuntGame.MAX_EFFECTS, WordHuntGame.FIRST_EFFECTS + this.t / WordHuntGame.EFFECTS_RAMP);
    this.words.push(new FlyingWord(text, width, { w: this.W, h: this.H }, duration, effectChance));
    Sfx.play("whoosh");
  }

  onScreenLimit() {
    return Math.min(WordHuntGame.MAX_ON_SCREEN, WordHuntGame.FIRST_ON_SCREEN + Math.floor(this.t / WordHuntGame.MORE_EVERY));
  }

  submit() {
    const typed = WordList.plain(this.input.value.trim());
    if (!typed) return;
    const target = this.words.filter((w) => w.plain === typed).reduce((best, w) => (!best || w.progress > best.progress ? w : best), null);
    if (!target) {
      this.wrong();
      return;
    }
    const bonus = target.bonus,
      points = Math.round(target.plain.length * WordHuntGame.POINTS_PER_LETTER * bonus);
    this.words = this.words.filter((w) => w !== target);
    this.score += points;
    this.burst(target, bonus > 1 ? `+${points} ×${String(bonus).replace(".", ",")}` : `+${points}`);
    this.input.value = "";
    this.typed = "";
    Sfx.play("pop");
    Sfx.play("word");
    this.hud();
  }

  wrong() {
    const field = this.input.parentNode;
    field.classList.remove("wh-wrong");
    void field.offsetWidth;
    field.classList.add("wh-wrong");
    this.input.select();
    Sfx.play("bad");
  }

  burst(word, label) {
    for (let i = 0; i < WordHuntGame.SPARKS; i++) {
      const angle = (i / WordHuntGame.SPARKS) * Math.PI * 2,
        speed = 90 + Math.random() * 140;
      this.sparks.push({
        x: word.x,
        y: word.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hue: FlyingWord.RAINBOW[i % FlyingWord.RAINBOW.length],
        life: 0.7,
        max: 0.7,
      });
    }
    this.labels.push({ x: word.x, y: word.y, text: label, life: 0.9, max: 0.9 });
  }

  miss(word) {
    this.misses++;
    this.rings.push({
      x: Math.min(Math.max(word.x, 0), this.W),
      y: Math.min(Math.max(word.y, 0), this.H),
      life: 0.8,
      max: 0.8,
    });
    Sfx.play("escape");
  }

  end() {
    this.over = true;
    Sfx.play("lose");
    const best = +Store.read("wordhunt_best", 0) || 0;
    $("whFinal").textContent = this.score;
    if (this.score > best) {
      Store.write("wordhunt_best", this.score);
      $("whRecord").textContent = best ? `Nouveau record ! (ancien : ${best})` : "Premier score enregistré.";
    } else $("whRecord").textContent = `Ton record : ${best}`;
    $("whOver").classList.add("show");
  }

  updateEffects(dt) {
    for (const s of this.sparks) {
      s.life -= dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 260 * dt;
    }
    for (const l of this.labels) {
      l.life -= dt;
      l.y -= 40 * dt;
    }
    for (const r of this.rings) r.life -= dt;
    this.sparks = this.sparks.filter((s) => s.life > 0);
    this.labels = this.labels.filter((l) => l.life > 0);
    this.rings = this.rings.filter((r) => r.life > 0);
  }

  update(dt) {
    this.updateEffects(dt);
    if (this.over) return;
    this.t += dt;
    this.spawnIn -= dt;
    if (!this.words.length && this.spawnIn > 0.6) this.spawnIn = 0.6;
    if (this.spawnIn <= 0 && this.words.length < this.onScreenLimit()) {
      this.spawn();
      const gap = Math.max(WordHuntGame.MIN_GAP, WordHuntGame.FIRST_GAP - this.t * WordHuntGame.GAP_DROP);
      this.spawnIn = gap * (0.8 + Math.random() * 0.4);
    }
    for (const w of this.words) {
      w.update(dt);
      if (w.gone) this.miss(w);
    }
    if (!this.words.some((w) => w.gone)) return;
    this.words = this.words.filter((w) => !w.gone);
    this.hud();
    if (this.misses >= WordHuntGame.MAX_MISSES) this.end();
  }

  bind() {
    this.input.addEventListener("input", () => {
      this.typed = WordList.plain(this.input.value.trim());
    });
    document.addEventListener("keydown", (e) => {
      if (!this.raf || e.key !== "Enter") return;
      e.preventDefault();
      if (this.over) this.reset();
      else this.submit();
    });
    $("whArea").addEventListener("mousedown", (e) => {
      if (e.target.closest("button") || e.target === this.input) return;
      e.preventDefault();
      this.input.focus();
    });
    new ResizeObserver(() => {
      if (this.raf) this.resize();
    }).observe(this.canvas);
    $("whRestart").addEventListener("click", () => this.reset());
    $("whAgain").addEventListener("click", () => this.reset());
    $("whMenu").addEventListener("click", () => app.launcher.backToMenu());
    this.bound = true;
  }

  resize() {
    const width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.dpr = window.devicePixelRatio || 1;
    this.W = width;
    this.H = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.font = `800 ${Math.round(Math.max(20, Math.min(34, height / 16, width / 14)))}px 'Segoe UI', system-ui, sans-serif`;
  }

  drawIntro(ink) {
    if (this.over || this.score > 0 || this.t > 6) return;
    this.ctx.globalAlpha = Math.min(1, (6 - this.t) / 1.5) * 0.6;
    this.ctx.fillStyle = ink;
    const intro = "Tape le mot qui traverse le ciel puis appuie sur Entrée";
    this.ctx.font = "600 18px 'Segoe UI', system-ui, sans-serif";
    const size = Math.min(18, (18 * (this.W - 24)) / this.ctx.measureText(intro).width);
    this.ctx.font = `600 ${size}px 'Segoe UI', system-ui, sans-serif`;
    this.ctx.fillText(intro, this.W / 2, 34);
    this.ctx.globalAlpha = 1;
  }

  drawEffects(bad) {
    const ctx = this.ctx;
    for (const s of this.sparks) {
      ctx.globalAlpha = s.life / s.max;
      ctx.fillStyle = `hsl(${s.hue},85%,60%)`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 4, 0, 7);
      ctx.fill();
    }
    ctx.font = "800 24px 'Segoe UI', system-ui, sans-serif";
    ctx.fillStyle = "#ffb020";
    for (const l of this.labels) {
      ctx.globalAlpha = l.life / l.max;
      ctx.fillText(l.text, l.x, l.y);
    }
    ctx.strokeStyle = bad;
    ctx.lineWidth = 4;
    for (const r of this.rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = 1 - k;
      ctx.beginPath();
      ctx.arc(r.x, r.y, 10 + k * 40, 0, 7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  draw() {
    const colors = {
        ink: ThemeSwitch.color("--ink"),
        outline: ThemeSwitch.color("--panel"),
        accent: ThemeSwitch.color("--accent"),
        lightness: parseFloat(ThemeSwitch.color("--word-lightness")),
      },
      bad = ThemeSwitch.color("--bad"),
      ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.drawIntro(colors.ink);
    for (const w of this.words) w.drawTrail(ctx);
    ctx.font = this.font;
    for (const w of this.words) w.drawText(ctx, colors, !!this.typed && w.plain.startsWith(this.typed));
    this.drawEffects(bad);
  }

  frame(now) {
    const dt = Math.min(now - this.last, 50) / 1000;
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  open() {
    if (!this.bound) this.bind();
    this.resize();
    this.reset();
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  close() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.input.blur();
  }
}
