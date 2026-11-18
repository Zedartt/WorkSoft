class ServiceHistory {
  constructor() {
    this.orders = [];
    this.round = 1;
    this.isOpen = false;
    $("ckHistory").addEventListener("click", () => this.show());
    $("ckOverReceipt").addEventListener("click", () => this.show());
    $("ckReceiptClose").addEventListener("click", () => this.hide());
    $("ckReceipt").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) this.hide();
    });
  }

  add(order, points) {
    this.orders.push({ order, points, round: this.round, time: new Date() });
    $("ckHistoryCount").textContent = this.dishCount();
  }

  dishCount() {
    return this.orders.reduce((sum, entry) => sum + entry.order.items.filter((item) => item.recipe).length, 0);
  }

  newRound() {
    if (this.orders.some((entry) => entry.round === this.round)) this.round++;
  }

  show() {
    $("ckReceiptBody").innerHTML = this.render();
    $("ckReceipt").classList.add("show");
    $("ckReceipt").scrollTop = 0;
    $("cooktou").classList.add("ck-paused");
    this.isOpen = true;
    Sfx.play("paper");
  }

  hide() {
    if (!this.isOpen) return;
    $("ckReceipt").classList.remove("show");
    $("cooktou").classList.remove("ck-paused");
    this.isOpen = false;
  }

  clock(date) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }

  render() {
    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const head = `<div class="ck-rc-head"><b>COOKTOU</b><span>Ticket de la session</span><span>${today}</span></div>`;
    if (!this.orders.length) return head + `<p class="ck-rc-empty">Aucun plat servi pour l'instant.<br />Sers un client pour remplir le ticket !</p>`;
    let body = "";
    let round = 0;
    for (const entry of this.orders) {
      if (entry.round !== round) {
        round = entry.round;
        body += `<div class="ck-rc-round">Partie ${round}</div>`;
      }
      body += this.renderOrder(entry);
    }
    const total = this.orders.reduce((sum, entry) => sum + entry.points, 0);
    const dishes = this.dishCount();
    const count = dishes + (dishes > 1 ? " plats servis" : " plat servi");
    return head + body + `<div class="ck-rc-total"><span>${count}</span><b>${total} pts</b></div><div class="ck-rc-thanks">Merci et à bientôt !</div>`;
  }

  renderOrder(entry) {
    const items = entry.order.items.map((item) => (item.recipe ? this.renderDish(item) : `<div class="ck-rc-drink">Boisson · ${item.drink.name}</div>`)).join("");
    return `<div class="ck-rc-dish">
      <div class="ck-rc-line"><span>${this.clock(entry.time)}</span><b>${entry.order.title()}</b><span>+${entry.points}</span></div>
      ${items}
    </div>`;
  }

  renderDish(item) {
    const recipe = item.recipe;
    const steps = recipe.steps
      .filter((step) => step.a !== "serve")
      .map((step) => `<li>${step.txt}</li>`)
      .join("");
    const origin = recipe.origin ? ` <em>(${recipe.origin})</em>` : "";
    return `<div class="ck-rc-item"><div class="ck-rc-course">${Order.COURSE_NAMES[item.course]} · ${recipe.name}${origin}</div>
      <ol>${steps}</ol>
      <a class="btn ck-rc-link" href="${recipe.link()}" target="_blank" rel="noopener noreferrer">Voir la vraie recette ↗</a></div>`;
  }
}
