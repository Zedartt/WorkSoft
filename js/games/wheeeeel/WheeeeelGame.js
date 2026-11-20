class WheeeeelGame extends Game {
  static SPIN_TIME = 6.2;
  static MIN_TURNS = 6;
  static MAX_TURNS = 9;
  static WIND_UP = 0.35;
  static CHARGE_TIME = 0.32;
  static FINAL_FROM = 0.68;
  static AUTO_DELAY = 0.8;
  static FLASH_MS = 650;
  static PINS = 40;
  static TICK_GAP = 0.018;
  static MUSIC_STEP = SoundEngine.CASINO.sixteenth * 8;
  static NARROW_QUERY = "(max-width: 720px)";

  constructor() {
    super({
      id: "wheeeeel",
      name: "Wheeeeel",
      tag: "Crée tes propres roues et laisse le hasard décider",
      art: '<svg viewBox="0 0 64 64" style="height:1em"><circle cx="32" cy="34" r="28" fill="#1c2029"/><g stroke="#fff" stroke-width="1.2"><path d="M32 34L32 9A25 25 0 0 1 57 34Z" fill="#e53935"/><path d="M32 34L57 34A25 25 0 0 1 32 59Z" fill="#1e63d6"/><path d="M32 34L32 59A25 25 0 0 1 7 34Z" fill="#fbc02d"/><path d="M32 34L7 34A25 25 0 0 1 32 9Z" fill="#2e9d4a"/></g><circle cx="32" cy="34" r="5" fill="#1c2029" stroke="#fff" stroke-width="1.5"/><path d="M32 15c-3-4-5-6-5-9a5 5 0 0 1 10 0c0 3-2 5-5 9z" fill="#fff" stroke="#1c2029" stroke-width="1.2"/></svg>',
      help: {
        goal: "Crée les roues que tu veux, lance-les et laisse le hasard choisir.",
        controls: [
          ["Lancer, clic sur la roue, Espace", "Fait tourner la roue"],
          ["Entrée", "Relance la roue quand le résultat est affiché"],
          ["Dossier « Mes roues »", "Choisis une de tes roues"],
          ["+ Nouvelle roue", "Crée une roue avec tes propres cases"],
          ["Crayon", "Modifie ou supprime la roue affichée"],
          ["Pastille de couleur", "Choisis la couleur d'une case"],
          ["Entrée dans une case", "Ajoute la case suivante"],
        ],
        rules: [
          "La roue « Vrai ou faux ? » est prête dès le départ et se lance toute seule à l'ouverture.",
          `Une roue a de ${WheelStore.MIN_CELLS} à ${WheelStore.MAX_CELLS} cases, chacune avec le texte que tu veux.`,
          "Toutes les cases ont la même chance de sortir.",
          "Sans choix de ta part, les cases prennent d'abord les couleurs primaires (rouge, bleu, jaune, vert), puis des couleurs de plus en plus variées.",
          "Tes roues sont enregistrées dans ce navigateur.",
        ],
      },
    });
    this.store = new WheelStore();
    this.stage = $("wlStage");
    this.area = $("wlArea");
    this.painter = new WheelPainter($("wlCanvas"));
    this.fx = new WheelFx(this.painter);
    this.editor = new WheelEditor(this.store, (wheel) => this.edited(wheel));
    this.state = "idle";
    this.angle = 0;
    this.spin = null;
    this.speed = 0;
    this.tilt = 0;
    this.tiltVel = 0;
    this.lastIndex = -1;
    this.lastPin = -1;
    this.tickWait = 0;
    this.musicLeft = 0;
    this.musicStep = 0;
    this.winIndex = -1;
    this.chargeLeft = 0;
    this.build = 0;
    this.autoLeft = 0;
    this.clock = 0;
    this.scale = 1;
    this.active = false;
    this.raf = 0;
    this.last = 0;
    this.flashTimer = 0;
    this.bind();
    this.renderList();
    this.showName();
    if (window.matchMedia(WheeeeelGame.NARROW_QUERY).matches) this.area.classList.add("wl-closed");
  }

  bind() {
    $("wlSpin").addEventListener("click", () => this.launch());
    const narrow = window.matchMedia(WheeeeelGame.NARROW_QUERY);
    if (narrow.addEventListener) narrow.addEventListener("change", (e) => this.area.classList.toggle("wl-closed", e.matches));
    $("wlCanvas").addEventListener("click", (e) => {
      if (narrow.matches && !this.area.classList.contains("wl-closed")) {
        this.area.classList.add("wl-closed");
        return;
      }
      const p = this.painter;
      if (Math.hypot(e.offsetX - p.cx, e.offsetY - p.cy) <= p.r * (1 + WheelPainter.RIM)) this.launch();
    });
    $("wlEdit").addEventListener("click", () => this.openEditor(this.store.current()));
    $("wlNew").addEventListener("click", () => this.openEditor(null));
    $("wlAdd").addEventListener("click", () => this.openEditor(null));
    $("wlFolderBtn").addEventListener("click", () => this.area.classList.toggle("wl-closed"));
    $("wlAgain").addEventListener("click", () => this.launch());
    $("wlClose").addEventListener("click", () => this.hideResult());
    $("wlList").addEventListener("click", (e) => {
      const item = e.target.closest("[data-wheel]");
      if (item) this.choose(item.dataset.wheel);
    });
    window.addEventListener("keydown", (e) => this.key(e));
    if (window.ResizeObserver) new ResizeObserver(() => this.active && this.measure()).observe(this.stage);
    else window.addEventListener("resize", () => this.active && this.measure());
  }

  key(e) {
    if (!this.active || !this.raf) return;
    if (this.editor.isOpen()) {
      if (e.key === "Escape") {
        e.preventDefault();
        this.editor.close();
      }
      return;
    }
    if (e.target.closest && e.target.closest("input, textarea, button, a")) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.launch();
    } else if (e.key === "Escape" && this.state === "result") {
      e.preventDefault();
      this.hideResult();
    }
  }

  wheel() {
    return this.store.current();
  }

  renderList() {
    const current = this.store.currentId;
    $("wlList").innerHTML = this.store.wheels
      .map((wheel) => {
        const name = WheeeeelGame.escape(wheel.name);
        const on = wheel.id === current ? " on" : "";
        return `<li><button type="button" class="wl-item${on}" data-wheel="${WheeeeelGame.escape(wheel.id)}"><span class="wl-item-icon"></span><span class="wl-item-text"><b>${name}</b><small>${wheel.cells.length} cases</small></span></button></li>`;
      })
      .join("");
  }

  static escape(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  showName() {
    $("wlName").textContent = this.wheel().name;
  }

  choose(id) {
    if (this.state === "spin" || this.state === "charge") return;
    this.store.select(id);
    this.hideResult();
    this.renderList();
    this.showName();
    this.angle = 0;
    this.winIndex = -1;
    Sfx.play("click");
    if (window.matchMedia(WheeeeelGame.NARROW_QUERY).matches) this.area.classList.add("wl-closed");
  }

  openEditor(wheel) {
    if (this.state === "spin" || this.state === "charge") return;
    this.hideResult();
    this.editor.open(wheel);
  }

  edited(wheel) {
    if (!wheel) return;
    this.renderList();
    this.showName();
    this.angle = 0;
    this.winIndex = -1;
  }

  indexAt(angle, count) {
    const seg = (Math.PI * 2) / count;
    const offset = (((-angle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return Math.min(count - 1, Math.floor(offset / seg));
  }

  launch() {
    if (this.state === "spin" || this.state === "charge" || this.editor.isOpen()) return;
    this.hideResult();
    const cells = this.wheel().cells;
    const count = cells.length;
    const seg = (Math.PI * 2) / count;
    const win = Math.floor(Math.random() * count);
    const inside = 0.15 + Math.random() * 0.7;
    const turns = WheeeeelGame.MIN_TURNS + Math.floor(Math.random() * (WheeeeelGame.MAX_TURNS - WheeeeelGame.MIN_TURNS + 1));
    const goal = -(win + inside) * seg;
    const from = this.angle;
    const delta = (((goal - from) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    this.spin = { from, to: from + turns * Math.PI * 2 + delta, t: 0, time: WheeeeelGame.SPIN_TIME + Math.random() * 1.2 };
    this.winIndex = win;
    this.build = 0;
    this.painter.newShow();
    this.lastIndex = this.indexAt(from, count);
    this.lastPin = this.indexAt(from, WheeeeelGame.PINS);
    this.musicLeft = 0.3;
    this.musicStep = 0;
    this.state = "spin";
    this.autoLeft = 0;
    this.fx.reset();
    this.stage.classList.add("wl-live");
    Sfx.play("wheelStart");
  }

  static ease(t) {
    const w = WheeeeelGame.WIND_UP / WheeeeelGame.SPIN_TIME;
    if (t < w) return -0.012 * Math.sin((t / w) * Math.PI);
    const k = (t - w) / (1 - w);
    return 1 - Math.pow(1 - k, 3);
  }

  colors() {
    const wheel = this.wheel();
    return WheelPainter.colors(wheel.cells.length, wheel.colors);
  }

  update(dt) {
    this.clock += dt;
    const cells = this.wheel().cells;
    if (this.autoLeft > 0 && (this.autoLeft -= dt) <= 0) this.launch();
    if (this.state === "spin") {
      const s = this.spin;
      s.t = Math.min(1, s.t + dt / s.time);
      const before = this.angle;
      this.angle = s.from + (s.to - s.from) * WheeeeelGame.ease(s.t);
      this.speed = Math.abs(this.angle - before) / Math.max(dt, 0.001) / (Math.PI * 2);
      const build = Math.max(0, (s.t - WheeeeelGame.FINAL_FROM) / (1 - WheeeeelGame.FINAL_FROM));
      if (build > 0 && this.build === 0) Sfx.play("wheelCharge", s.time * (1 - s.t));
      this.build = build;
      const index = this.indexAt(this.angle, cells.length);
      if (index !== this.lastIndex) {
        this.lastIndex = index;
        this.tilt = -0.55;
        this.tiltVel = 0;
      }
      const pin = this.indexAt(this.angle, WheeeeelGame.PINS);
      this.tickWait -= dt;
      if (pin !== this.lastPin) {
        this.lastPin = pin;
        if (this.tilt > -0.2) this.tilt = -0.22;
        if (this.tickWait <= 0) {
          this.tickWait = WheeeeelGame.TICK_GAP;
          Sfx.play("wheelTick", Math.min(1, this.speed));
        }
      }
      this.fx.sparks(Math.min(1, this.speed * 0.8) + build * 0.8);
      this.scale = 1 + 0.03 * build * build + 0.006 * Math.sin(this.clock * 50) * build;
      if (s.t >= 1) {
        this.angle = s.to;
        this.speed = 0;
        this.state = "charge";
        this.chargeLeft = WheeeeelGame.CHARGE_TIME;
      }
      this.music(dt, Math.min(1, this.speed * 0.6), build);
    } else if (this.state === "charge") {
      this.music(dt, 1, 1);
      this.chargeLeft -= dt;
      const k = 1 - this.chargeLeft / WheeeeelGame.CHARGE_TIME;
      this.scale = 1.03 + 0.04 * k * k + 0.012 * Math.sin(this.clock * 60);
      this.fx.sparks(1.5);
      if (this.chargeLeft <= 0) this.boom();
    } else {
      this.speed = Math.max(0, this.speed - dt);
      this.build = 0;
      this.scale += (1 - this.scale) * Math.min(1, dt * 8);
      if (this.state === "result") this.fx.rain();
    }
    this.tiltVel += (-this.tilt * 320 - this.tiltVel * 16) * dt;
    this.tilt += this.tiltVel * dt;
    this.fx.update(dt);
  }

  music(dt, energy, build) {
    this.musicLeft -= dt;
    if (this.musicLeft > 0.1) return;
    Sfx.play("wheelBar", { step: this.musicStep++, energy, build, lead: Math.max(0, this.musicLeft) });
    this.musicLeft += WheeeeelGame.MUSIC_STEP;
  }

  boom() {
    const wheel = this.wheel();
    const colors = this.colors();
    const color = colors[this.winIndex];
    this.state = "result";
    this.build = 0;
    this.scale = 1;
    this.fx.boom(color, colors);
    Sfx.play("wheelBoom");
    Sfx.play("wheelWin");
    const result = $("wlResult");
    result.style.setProperty("--wl-win", color);
    $("wlResultWheel").textContent = wheel.name;
    $("wlResultText").textContent = wheel.cells[this.winIndex];
    result.classList.add("show");
    const flash = $("wlFlash");
    flash.style.setProperty("--wl-win", color);
    flash.classList.remove("show");
    void flash.offsetWidth;
    flash.classList.add("show");
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => flash.classList.remove("show"), WheeeeelGame.FLASH_MS);
    this.stage.classList.remove("wl-live");
  }

  hideResult() {
    $("wlResult").classList.remove("show");
    if (this.state === "result") this.state = "idle";
  }

  draw() {
    const p = this.painter;
    if (!p.w) return;
    const cells = this.wheel().cells;
    const colors = this.colors();
    const live = this.state === "spin";
    const charging = this.state === "charge";
    const shown = this.state === "result" || charging;
    const energy = live ? Math.min(1, this.speed * 0.9) : 0;
    const build = live ? this.build : charging ? 1 : 0;
    const wild = Math.max(energy, build);
    p.clear();
    const [ox, oy] = this.fx.offset();
    p.ctx.translate(ox, oy);
    const under = this.indexAt(this.angle, cells.length);
    const accent = colors[shown ? this.winIndex : under];
    const pulse = 0.5 + 0.5 * Math.sin(this.clock * (live ? 18 : 2));
    if (live || charging) {
      p.halo(accent, 0.25 + 0.45 * wild * pulse + 0.3 * build);
      p.beams(this.clock, 0.8 + 1.4 * wild, build * build);
      if (Math.random() < (0.06 * energy + 0.3 * build) * p.show.strobe) p.strobe(0.05 + 0.18 * build, Math.random() < 0.5 ? p.look.flare : accent);
    } else {
      p.halo(accent, shown ? 0.3 : 0.06);
      p.beams(this.clock, shown ? 0.3 : 0, 0);
    }
    this.fx.drawBack(this.clock);
    p.wheel(this.angle, this.scale, cells, colors);
    if (shown && this.winIndex >= 0) p.winner(this.angle, this.scale, this.winIndex, cells.length, charging ? 0.3 + 0.7 * (Math.floor(this.clock * 16) % 2) : 0.25 + 0.15 * pulse);
    const mode = charging ? "win" : live ? (build > 0.35 ? "final" : "spin") : "idle";
    p.leds(this.clock, mode, energy, this.scale, accent);
    p.hub(live || charging ? 0.3 + 0.7 * wild : 0, this.scale, accent);
    p.pointer(this.tilt, live || charging ? 0.3 + 0.7 * Math.max(build, pulse * energy) : 0, accent);
    this.fx.draw();
  }

  frame(time) {
    const dt = Math.min(0.05, (time - this.last) / 1000);
    this.last = time;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  measure() {
    this.painter.resize(this.stage.clientWidth, this.stage.clientHeight);
    this.draw();
  }

  open() {
    this.active = true;
    this.measure();
    this.hideResult();
    this.state = "idle";
    this.fx.reset();
    this.renderList();
    this.showName();
    this.autoLeft = WheeeeelGame.AUTO_DELAY;
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  close() {
    this.active = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    clearTimeout(this.flashTimer);
    $("wlFlash").classList.remove("show");
    if (this.editor.isOpen()) this.editor.veil.classList.remove("show");
    this.hideResult();
    this.state = "idle";
    this.spin = null;
    this.autoLeft = 0;
    this.stage.classList.remove("wl-live");
  }
}
