class Launcher {
  static SLOTS = 12;

  constructor(games) {
    this.games = games;
    this.current = null;
    this.preview = null;
    this.busy = false;
    this.panel = $("launch");
    this.flash = $("flash");
    this.buildGrid();
    this.tickClock();
    setInterval(() => this.tickClock(), 5000);
    $("launchBack").addEventListener("click", () => this.closePreview());
    $("launchStart").addEventListener("click", () => this.start());
    document.querySelectorAll(".back").forEach((button) => button.addEventListener("click", () => this.backToMenu()));
    document.addEventListener("keydown", (event) => {
      if (!this.preview || this.busy || event.key !== "Escape") return;
      event.preventDefault();
      this.closePreview();
    });
  }

  wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  buildGrid() {
    const grid = $("grid");
    for (let slot = 0; slot < Launcher.SLOTS; slot++) {
      const game = this.games[slot];
      const tile = document.createElement(game ? "button" : "div");
      if (game) {
        tile.className = "tile game";
        tile.innerHTML = `<div class="art">${game.art}</div><div class="name">${game.name}</div>`;
        tile.addEventListener("click", () => this.openPreview(game, tile));
        tile.addEventListener("mouseenter", () => Sfx.play("hover"));
      } else {
        tile.className = "tile empty";
        tile.textContent = "Bientôt";
      }
      grid.appendChild(tile);
    }
  }

  show(id) {
    document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id));
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
    this.preview = { game, tile };
    Sfx.play("select");
    $("launchArt").innerHTML = game.art;
    $("launchName").textContent = game.name;
    $("launchTag").textContent = game.tag;
    this.setBox(tile.getBoundingClientRect());
    this.panel.style.display = "flex";
    void this.panel.offsetWidth;
    this.panel.classList.add("open");
    this.setBox({ left: 0, top: 0, width: innerWidth, height: innerHeight });
    await this.wait(480);
    this.panel.style.width = "100vw";
    this.panel.style.height = "100vh";
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
