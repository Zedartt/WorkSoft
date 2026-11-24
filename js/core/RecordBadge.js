class RecordBadge {
  constructor(games) {
    this.badges = [];
    for (const game of games) {
      if (!game.record || game.record.bar === false) continue;
      const stat = document.createElement("div");
      stat.className = "stat record-stat";
      stat.innerHTML = `${game.record.label || "Record"} <b></b>`;
      $(game.id).querySelector(".game-bar").appendChild(stat);
      this.badges.push({ game, value: stat.querySelector("b") });
    }
    const watch = new MutationObserver(() => this.refresh());
    for (const game of games) watch.observe($(game.id), { attributes: true, attributeFilter: ["class"] });
    for (const end of document.querySelectorAll("[data-end]")) watch.observe(end, { attributes: true, attributeFilter: ["class"] });
    this.refresh();
  }

  refresh() {
    for (const { game, value } of this.badges) {
      const text = game.recordValue() ? game.recordValue().toLocaleString("fr-FR") : "—";
      if (value.textContent !== text) value.textContent = text;
    }
  }
}
