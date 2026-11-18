class Launcher {
  static PER_PAGE = 16;
  static PAGES = 2;
  static TILT_DEG = 5;
  static WHEEL_PAUSE_MS = 450;
  static SWIPE_PX = 50;

  constructor(games) {
    this.games = games;
    this.current = null;
    this.preview = null;
    this.busy = false;
    this.page = 0;
    this.wheelAt = 0;
    this.panel = $("launch");
    this.flash = $("flash");
    this.track = $("grid");
    this.settings = new MenuSettings();
    this.pageCount = Math.max(Launcher.PAGES, Math.ceil(games.length / Launcher.PER_PAGE));
    this.buildGrid();
    this.bindPaging();
    this.goTo(0);
    this.show("menu");
    this.tickClock();
    setInterval(() => this.tickClock(), 5000);
    $("launchBack").addEventListener("click", () => this.closePreview());
    $("launchStart").addEventListener("click", () => this.start());
    document.querySelectorAll(".back").forEach((button) => button.addEventListener("click", () => this.backToMenu()));
    document.addEventListener("keydown", (event) => this.key(event));
  }

  onMenu() {
    return Boolean($("menu").classList.contains("active") && !this.preview && !this.busy);
  }

  key(event) {
    if (this.preview && !this.busy && event.key === "Escape") {
      event.preventDefault();
      this.closePreview();
      return;
    }
    if (!this.onMenu() || this.settings.isOpen()) return;
    if (event.key === "ArrowRight" || event.key === "PageDown") this.turn(1);
    else if (event.key === "ArrowLeft" || event.key === "PageUp") this.turn(-1);
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  buildGrid() {
    this.pageEls = [];
    for (let index = 0; index < this.pageCount; index++) {
      const page = document.createElement("div");
      page.className = "page";
      for (let slot = 0; slot < Launcher.PER_PAGE; slot++) page.appendChild(this.tile(this.games[index * Launcher.PER_PAGE + slot]));
      this.track.appendChild(page);
      this.pageEls.push(page);
      const dot = document.createElement("i");
      $("pageDots").appendChild(dot);
    }
  }

  tile(game) {
    const tile = document.createElement(game ? "button" : "div");
    if (!game) {
      tile.className = "tile empty";
      tile.textContent = "Bientôt";
      return tile;
    }
    tile.className = "tile game";
    tile.innerHTML = `<div class="art">${game.art}</div><div class="name">${game.name}</div>`;
    tile.addEventListener("click", () => this.openPreview(game, tile));
    tile.addEventListener("mouseenter", () => Sfx.play("hover"));
    tile.addEventListener("mousemove", (event) => this.tilt(tile, event));
    tile.addEventListener("mouseleave", () => this.tilt(tile, null));
    return tile;
  }

  tilt(tile, event) {
    if (!event) {
      tile.style.removeProperty("--rx");
      tile.style.removeProperty("--ry");
      return;
    }
    const x = Math.max(-1, Math.min(1, (event.offsetX / tile.offsetWidth) * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.offsetY / tile.offsetHeight) * 2 - 1));
    tile.style.setProperty("--ry", (x * Launcher.TILT_DEG).toFixed(2) + "deg");
    tile.style.setProperty("--rx", (-y * Launcher.TILT_DEG).toFixed(2) + "deg");
  }

  bindPaging() {
    $("pagePrev").addEventListener("click", () => this.turn(-1));
    $("pageNext").addEventListener("click", () => this.turn(1));
    $("pages").addEventListener("wheel", (event) => this.wheel(event), { passive: true });
    $("pages").addEventListener("touchstart", (event) => (this.touchX = event.touches[0].clientX), { passive: true });
    $("pages").addEventListener("touchend", (event) => {
      const dx = event.changedTouches[0].clientX - this.touchX;
      if (Math.abs(dx) > Launcher.SWIPE_PX) this.turn(dx < 0 ? 1 : -1);
    });
    $("pageDots").addEventListener("click", (event) => {
      const index = [...$("pageDots").children].indexOf(event.target);
      if (index >= 0 && index !== this.page) {
        Sfx.play("whoosh");
        this.goTo(index);
      }
    });
  }

  wheel(event) {
    const page = this.pageEls[this.page];
    const sideways = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    if (!sideways && page.scrollHeight > page.clientHeight + 1) return;
    const delta = sideways ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 4 || performance.now() - this.wheelAt < Launcher.WHEEL_PAUSE_MS) return;
    this.wheelAt = performance.now();
    this.turn(delta > 0 ? 1 : -1);
  }

  turn(step) {
    const next = this.page + step;
    if (next < 0 || next >= this.pageCount || this.preview) return;
    Sfx.play("whoosh");
    this.goTo(next);
  }

  goTo(index) {
    this.page = index;
    this.track.style.transform = `translateX(${-index * 100}%)`;
    this.pageEls.forEach((page, i) => (page.inert = i !== index));
    [...$("pageDots").children].forEach((dot, i) => dot.classList.toggle("on", i === index));
    $("pagePrev").hidden = index === 0;
    $("pageNext").hidden = index === this.pageCount - 1;
  }

  show(id) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id));
    document.body.classList.toggle("on-menu", id === "menu");
    if (id !== "menu") this.settings.close();
  }

  setBox(rect) {
    this.panel.style.left = rect.left + "px";
    this.panel.style.top = rect.top + "px";
    this.panel.style.width = rect.width + "px";
    this.panel.style.height = rect.height + "px";
  }

  async openPreview(game, tile) {
    if (this.busy || this.preview) return;
    this.busy = true;
    this.settings.close();
    this.tilt(tile, null);
    this.preview = { game, tile };
    Sfx.play("select");
    $("launchArt").innerHTML = game.art;
    $("launchName").textContent = game.name;
    $("launchTag").textContent = game.tag;
    this.setBox(tile.getBoundingClientRect());
    this.panel.style.display = "flex";
    void this.panel.offsetWidth;
    this.panel.classList.add("open");
    const visible = window.visualViewport;
    this.setBox({ left: 0, top: visible ? visible.offsetTop : 0, width: innerWidth, height: visible ? visible.height : innerHeight });
    await this.wait(480);
    this.panel.style.top = "var(--app-top, 0px)";
    this.panel.style.width = "100vw";
    this.panel.style.height = "var(--app-height, 100dvh)";
    this.panel.classList.add("ready");
    $("launchStart").focus();
    this.busy = false;
  }

  async closePreview() {
    if (this.busy || !this.preview) return;
    this.busy = true;
    Sfx.play("back");
    this.panel.classList.remove("ready");
    await this.wait(200);
    this.panel.classList.remove("open");
    this.setBox(this.preview.tile.getBoundingClientRect());
    await this.wait(500);
    this.panel.style.display = "none";
    this.preview.tile.focus();
    this.preview = null;
    this.busy = false;
  }

  async start() {
    if (this.busy || !this.preview) return;
    this.busy = true;
    const game = this.preview.game;
    Sfx.play("start");
    this.flash.classList.add("on");
    await this.wait(480);
    this.panel.style.display = "none";
    this.panel.classList.remove("open", "ready");
    this.preview = null;
    this.current = game;
    this.show(game.id);
    game.open();
    await this.wait(150);
    this.flash.classList.remove("on");
    this.busy = false;
  }

  async backToMenu() {
    if (this.busy) return;
    this.busy = true;
    Sfx.play("back");
    Sfx.stopAll();
    this.flash.classList.add("on");
    await this.wait(400);
    if (this.current) this.current.close();
    this.current = null;
    this.show("menu");
    this.flash.classList.remove("on");
    this.busy = false;
  }

  tickClock() {
    const now = new Date();
    $("clock").textContent = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    $("date").textContent = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  }
}
