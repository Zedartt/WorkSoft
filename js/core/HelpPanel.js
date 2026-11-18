class HelpPanel {
  constructor(games) {
    this.games = games;
    this.game = null;
    this.wasRunning = false;
    this.panel = $("help");
    for (const game of games) this.addButton(game);
    $("helpClose").addEventListener("click", () => this.hide());
    this.panel.addEventListener("click", (event) => {
      if (event.target === this.panel) this.hide();
    });
    window.addEventListener(
      "keydown",
      (event) => {
        if (!this.game || (event.key !== "Escape" && event.key !== "Enter")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        this.hide();
      },
      true,
    );
  }

  addButton(game) {
    const back = $(game.id).querySelector(".game-top .back");
    const left = document.createElement("div");
    left.className = "top-left";
    back.replaceWith(left);
    const info = document.createElement("button");
    info.className = "info-btn";
    info.textContent = "i";
    info.title = "Comment jouer";
    info.setAttribute("aria-label", "Comment jouer à " + game.name);
    info.addEventListener("mousedown", (event) => event.preventDefault());
    info.addEventListener("click", () => this.show(game));
    left.append(back, info);
  }

  render(game) {
    const help = game.help;
    const controls = help.controls.map(([input, action]) => `<dt>${input}</dt><dd>${action}</dd>`).join("");
    const rules = help.rules.map((rule) => `<li>${rule}</li>`).join("");
    return `<h2>Comment jouer à ${game.name}</h2>
      <p class="help-goal">${help.goal}</p>
      <h3>Commandes</h3><dl class="help-keys">${controls}</dl>
      <h3>Comment ça marche</h3><ul class="help-rules">${rules}</ul>`;
  }

  show(game) {
    if (this.game) return;
    this.game = game;
    $("helpBody").innerHTML = this.render(game);
    if (document.activeElement) document.activeElement.blur();
    this.wasRunning = game.pause();
    $(game.id).classList.add("game-paused");
    this.panel.classList.add("show");
    $("helpClose").focus({ preventScroll: true });
    this.panel.scrollTop = 0;
    Sfx.play("paper");
  }

  hide() {
    if (!this.game) return;
    const game = this.game;
    this.game = null;
    this.panel.classList.remove("show");
    $(game.id).classList.remove("game-paused");
    if (this.wasRunning) game.resume();
    Sfx.play("click");
  }
}
