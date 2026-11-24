class DuelLobby {
  constructor(prefix, link, onLeave) {
    this.prefix = prefix;
    this.link = link;
    this.onLeave = onLeave;
    this.el("Create").addEventListener("click", () => this.create());
    this.el("Join").addEventListener("click", () => this.join());
    this.el("Copy").addEventListener("click", () => this.copy());
    this.el("CancelHost").addEventListener("click", () => this.onLeave());
    this.el("CancelJoin").addEventListener("click", () => this.onLeave());
    this.el("Leave").addEventListener("click", () => this.onLeave());
    const field = this.el("CodeInput");
    field.addEventListener("input", () => {
      const clean = DuelLink.cleanCode(field.value);
      if (field.value !== clean) field.value = clean;
    });
    field.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      this.join();
    });
  }

  el(name) {
    return $(this.prefix + name);
  }

  view(name) {
    this.el("LobbyCard").dataset.view = name;
  }

  room(code) {
    this.el("RoomCode").textContent = code || "—";
    this.el("Leave").style.visibility = code ? "visible" : "hidden";
  }

  route(route) {
    this.el("Route").textContent = route === "direct" ? "directe" : route === "relay" ? "relais" : "—";
  }

  show(error = "") {
    this.el("Lobby").classList.add("show");
    this.view("home");
    this.el("Error").textContent = error;
    if (error) Sfx.play("bad");
    this.room("");
    this.route("");
  }

  hide() {
    this.el("Lobby").classList.remove("show");
    this.route(this.link.route);
  }

  create() {
    const code = this.link.host();
    this.el("Code").textContent = code;
    this.el("Copy").textContent = "Copier le code";
    this.el("Error").textContent = "";
    this.view("wait");
    this.room(code);
    Sfx.play("click");
  }

  join() {
    const field = this.el("CodeInput"),
      code = DuelLink.cleanCode(field.value);
    if (code.length !== DuelLink.CODE_LEN) {
      this.el("Error").textContent = `Le code fait ${DuelLink.CODE_LEN} caractères.`;
      field.classList.remove("lobby-wrong");
      void field.offsetWidth;
      field.classList.add("lobby-wrong");
      Sfx.play("bad");
      return;
    }
    this.link.join(code);
    this.el("JoinCode").textContent = code;
    this.el("Error").textContent = "";
    this.view("join");
    this.room(code);
    Sfx.play("click");
  }

  copy() {
    const code = this.el("Code").textContent,
      button = this.el("Copy"),
      select = () => {
        const range = document.createRange();
        range.selectNodeContents(this.el("Code"));
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = "Fais Ctrl+C";
      };
    try {
      navigator.clipboard.writeText(code).then(() => (button.textContent = "Code copié !"), select);
    } catch (error) {
      select();
    }
  }
}
