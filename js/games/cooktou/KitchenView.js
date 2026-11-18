class KitchenView {
  static DESIGN_H = 640;
  static MIN_SCALE = 0.55;
  static MAX_SCALE = 1.8;
  static CAM_SPEED = 12;
  static PUDDLE = "M6 26c-2-10 8-17 19-16 12 0 20 7 18 16-1 9-10 13-20 12-9 0-16-4-17-12z";
  static SPECKS = [
    [14, 20],
    [24, 15],
    [33, 18],
    [38, 26],
    [28, 24],
    [18, 28],
    [11, 30],
    [24, 33],
    [33, 32],
    [20, 22],
  ];
  static LAYOUT = {
    four: [30, 290],
    friteuse: [340, 200],
    casserole: [560, 220],
    plaque: [800, 270],
    frigo: [1100, 470],
    placards: [1590, 560],
    planche: [2180, 290],
    bol: [2490, 210],
    mixeur: [2720, 170],
    assiette: [2910, 180],
    plateau: [3110, 220],
    machine: [3350, 300],
  };
  constructor(game) {
    this.game = game;
    this.cam = 0;
    this.camTarget = 0;
    this.viewW = 0;
    this.scale = 1;
    this.placard = Catalog.PLACARDS[0];
    this.stockSig = "";
    this.who = Store.read("cooktou_chef") === "femme" ? "femme" : "homme";
    this.area = $("ckArea");
  }

  query(sel) {
    return $("ckWorld").querySelector(sel);
  }

  place(id) {
    const [x, w] = KitchenView.LAYOUT[id];
    return `left:${x}px;width:${w}px`;
  }

  station(id, extra) {
    const def = Catalog.stations[id];
    const button = def.button ? `<button class="ck-heat" data-heat="${id}"><i></i>${def.button}</button>` : "";
    return `<div class="ck-st ck-${id}" data-drop="${id}" style="${this.place(id)}"><div class="ck-surf"><div class="ck-cont" data-from="${id}"></div></div>${button}${extra || ""}<i class="ck-prog"></i><span class="ck-lab">${def.n}</span></div>`;
  }

  tool(id, right) {
    return `<div class="ck-tool" data-tool="${id}" title="${Catalog.tools[id].n}" style="right:${right}px">${Icons.tools[id]}</div>`;
  }

  build() {
    const world = $("ckWorld");
    world.style.width = CooktouGame.WORLD_W + "px";
    world.innerHTML = `
      <div class="ck-band"></div>
      <div class="ck-hood" style="left:690px"></div>
      <div class="ck-clock" style="left:2830px"><i></i><b></b></div>
      <div class="ck-rail" style="left:2900px"><span></span><span></span><span></span></div>
      <div class="ck-chef" id="ckChef" style="left:${CooktouGame.CHEF_X - 105}px">${Avatar.chef(this.who)}</div>
      <div class="ck-pin" id="ckTicket" style="left:${CooktouGame.CHEF_X + 118}px"></div>
      <div class="ck-oven" data-drop="four" style="${this.place("four")}">
        <div class="ov-top"><i class="ov-knob"></i><i class="ov-knob"></i><span class="ov-disp">180°</span><button class="ck-heat" data-heat="four">${Catalog.stations.four.button}</button></div>
        <div class="ck-surf ov-win"><div class="ck-cont" data-from="four"></div></div>
        <div class="ov-handle"></div><i class="ck-prog"></i>
        <div class="ov-drawer"><span class="ck-lab">Four</span></div>
      </div>
      ${this.station("friteuse")}
      ${this.station("casserole")}
      ${this.station("plaque", this.tool("spatula", 10))}
      <div class="ck-fridge" id="ckFridge" style="${this.place("frigo")}">
        <div class="fr-body"><div class="fr-in"><div class="fr-top"><span>Frigo</span><button id="ckDoorClose">Fermer ✕</button></div>
          <div class="ck-shelf five" id="ckShelf-frigo"></div></div></div>
        <button class="fr-door" id="ckDoor" aria-label="Ouvrir le frigo"><i class="fr-handle"></i><i class="fr-note"></i><i class="fr-note b"></i><span>FRIGO</span></button>
      </div>
      <div class="ck-pantry" style="${this.place("placards")}">
        <div class="ck-shelf five" id="ckShelf"></div>
        <div class="ck-tabs">${Catalog.PLACARDS.map((id) => `<button class="ck-tab" data-placard="${id}">${Catalog.storages[id].n}</button>`).join("")}</div>
      </div>
      ${this.station("planche", this.tool("knife", 6) + this.tool("peeler", 40) + this.tool("roller", 74))}
      ${this.station("bol", this.tool("spoon", 6))}
      ${this.station("mixeur")}
      ${this.station("assiette")}
      <div class="ck-st ck-plateau" data-drop="plateau" style="${this.place("plateau")}"><div class="ck-surf"><div class="ck-tray" id="ckTray"></div></div><span class="ck-lab">Plateau</span></div>
      <div class="ck-machine" style="${this.place("machine")}">
        <div class="mc-top">Boissons</div>
        <div class="mc-slot" data-drop="machine"><i class="mc-spout"></i><div class="mc-glass" id="ckGlass"></div></div>
        <div class="mc-buttons">${Catalog.drinks.map((drink) => `<button class="mc-btn" data-drink="${drink.id}"><i style="background:${drink.color}"></i>${drink.name}</button>`).join("")}</div>
        <div class="mc-stack" data-glass="1">${Icons.glass("#fff", 0)}${Icons.glass("#fff", 0)}${Icons.glass("#fff", 0)}<span class="ck-lab">Verres</span></div>
      </div>
      <div class="ck-guide" id="ckGuide"></div>`;
    this.bind();
    this.game.built = true;
  }

  bind() {
    const pointer = this.game.pointer;
    this.area.addEventListener("pointerdown", (event) => pointer.down(event));
    this.area.addEventListener("pointermove", (event) => pointer.move(event));
    this.area.addEventListener("pointerup", (event) => pointer.up(event));
    this.area.addEventListener("pointercancel", (event) => pointer.up(event));
    this.area.addEventListener("pointerleave", () => this.setFridge(false));
    this.area.addEventListener("wheel", (event) => this.wheel(event), { passive: true });
    this.area.addEventListener("click", (event) => this.click(event));
    document.addEventListener("keydown", (event) => this.key(event));
    new ResizeObserver(() => {
      if (!this.game.raf) return;
      this.fit();
      this.applyCam();
      this.game.guide.guideSig = null;
    }).observe(this.area);
    $("ckRestart").addEventListener("click", () => this.game.reset());
    $("ckWho").addEventListener("click", () => this.switchChef());
    $("ckAgain").addEventListener("click", () => this.game.reset());
    $("ckMenu").addEventListener("click", () => app.launcher.backToMenu());
  }

  wheel(event) {
    if (this.game.history.isOpen) return;
    this.camTarget += (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) / this.scale;
    this.clampCam();
  }

  click(event) {
    const target = event.target;
    const client = target.closest("[data-client]");
    const heat = target.closest("[data-heat]");
    const drink = target.closest("[data-drink]");
    const tab = target.closest("[data-placard]");
    if (client) this.game.takeOrder(+client.dataset.client, client);
    else if (heat) this.game.doHeat(heat.dataset.heat, heat.closest("[data-drop]"));
    else if (drink) this.game.doDrink(drink.dataset.drink, drink);
    else if (tab) this.openPlacard(tab.dataset.placard);
    else if (target.closest("#ckDoorClose")) this.setFridge(false);
    else if (target.closest("#ckDoor")) this.setFridge(!$("ckFridge").classList.contains("open"));
    else if (target.closest("#ckLeft")) this.pan(-0.6);
    else if (target.closest("#ckRight")) this.pan(0.6);
  }

  key(event) {
    if (!this.game.raf) return;
    if (this.game.history.isOpen) {
      if (event.key !== "Escape" && event.key !== "Enter") return;
      event.preventDefault();
      this.game.history.hide();
      return;
    }
    if (this.game.over && event.key === "Enter") {
      event.preventDefault();
      this.game.reset();
    } else if (event.key === "ArrowLeft" || event.key === "q" || event.key === "a") this.pan(-0.15);
    else if (event.key === "ArrowRight" || event.key === "d") this.pan(0.15);
  }

  pan(part) {
    this.camTarget += this.viewW * part;
    this.clampCam();
  }

  switchChef() {
    this.who = this.who === "femme" ? "homme" : "femme";
    $("ckChef").innerHTML = Avatar.chef(this.who);
    Sfx.play("click");
    Store.write("cooktou_chef", this.who);
  }

  hud() {
    $("ckScore").textContent = this.game.score;
    let marks = "";
    for (let i = 0; i < CooktouGame.MAX_LOST; i++) marks += `<i class="esc${i < this.game.lost ? " on" : ""}"></i>`;
    $("ckLost").innerHTML = marks;
  }

  clientLabel(client) {
    const mine = client === this.game.active;
    if (!mine) return this.game.active ? "Attend son tour" : "Clique pour prendre la commande";
    return this.game.order().complete() ? "Glisse le plateau ici !" : "Commande en cours…";
  }

  renderClients() {
    let html = "";
    for (let i = 0; i < CooktouGame.SLOTS; i++) {
      const client = this.game.clients[i];
      if (!client) {
        html += `<div class="ck-client empty">place libre</div>`;
        continue;
      }
      const mine = client === this.game.active;
      const serve = mine && this.game.order().complete();
      const icons = client.order.items.map((item) => (item.recipe ? Icons.dish(item.recipe, "dish") : Icons.glass(item.drink.color, 1, "dish"))).join("");
      html += `<button class="ck-client${mine ? " active" : ""}${serve ? " serve" : ""}${!this.game.active ? " ask" : ""}" data-client="${i}">
        <span class="who">${Avatar.client(client)}</span>
        <span class="order"><b>${client.order.title()}</b><span>${this.clientLabel(client)}</span></span>
        <span class="dishes">${icons}</span>
        <i class="pat" data-bar="${i}"></i></button>`;
    }
    $("ckClients").innerHTML = html;
    this.bars();
  }

  bars() {
    for (let i = 0; i < CooktouGame.SLOTS; i++) {
      const client = this.game.clients[i];
      const bar = $("ckClients").querySelector(`[data-bar="${i}"]`);
      if (!client || !bar) continue;
      const ratio = Math.max(0, client.pat / client.max);
      bar.style.width = ratio * 100 + "%";
      bar.classList.toggle("low", ratio < 0.3);
    }
  }

  renderTicket() {
    const pin = $("ckTicket");
    const order = this.game.order();
    if (!order) {
      pin.innerHTML = `<h3>Bon de commande</h3><p>${this.game.clients.some(Boolean) ? "Clique sur un client pour prendre sa commande." : "En attente du prochain client…"}</p>`;
      return;
    }
    const menu = order.items
      .map((item) => {
        const state = item.done ? "done" : item === this.game.dish ? "cur" : "";
        return `<li class="${state}"><i>${item.done ? "✓" : "•"}</i><span><em>${Order.COURSE_NAMES[item.course]}</em> ${order.label(item)}</span></li>`;
      })
      .join("");
    const steps = this.game.dish
      ? this.game.dish.recipe.steps
          .map((step, i) => `<li class="${i < this.game.idx ? "done" : i === this.game.idx ? "cur" : ""}"><i>${i < this.game.idx ? "✓" : i + 1}</i>${step.txt}</li>`)
          .join("")
      : "";
    pin.innerHTML = `<h3>${order.title()}</h3><ul class="ck-menu">${menu}</ul>${steps ? `<ol>${steps}</ol>` : ""}`;
    const current = pin.querySelector("ol .cur");
    if (current) pin.scrollTop = Math.max(0, current.offsetTop - 110);
  }

  stock() {
    const needed = new Set(this.game.clients.filter(Boolean).flatMap((client) => client.order.items.filter((item) => item.recipe).flatMap((item) => item.recipe.steps.filter((step) => step.ing).map((step) => step.ing))));
    const shelves = {};
    for (const at in Catalog.storages) shelves[at] = [];
    const online = this.game.source.online;
    for (const id in Catalog.ingredients) {
      const shown = needed.has(id) || Icons.shapes[id] || (online && !Catalog.isCustom(id));
      if (shown) shelves[Catalog.ingredients[id].at].push(id);
    }
    for (const at in shelves) {
      const extra = shelves[at].length - Catalog.SHELF_SIZE;
      if (extra > 0) shelves[at] = shelves[at].filter((id, i) => needed.has(id) || i >= extra);
    }
    return shelves;
  }

  item(id) {
    return `<div class="ck-item" data-ing="${id}">${Icons.draw(id)}<span>${Catalog.ingredients[id].n}</span></div>`;
  }

  renderStock() {
    const shelves = this.stock();
    const sig = JSON.stringify(shelves) + this.placard;
    if (sig === this.stockSig) return;
    this.stockSig = sig;
    $("ckShelf-frigo").innerHTML = shelves.frigo.map((id) => this.item(id)).join("");
    $("ckShelf").innerHTML = shelves[this.placard].map((id) => this.item(id)).join("");
    for (const tab of this.query(".ck-tabs").children) tab.classList.toggle("open", tab.dataset.placard === this.placard);
  }

  openPlacard(id) {
    if (this.placard === id) return;
    this.placard = id;
    Sfx.play("fridge");
    this.renderStock();
    this.game.guide.hintIn = 0;
  }

  pile(list, id) {
    const sx = id === "planche" ? 1.5 : 1;
    const sy = id === "planche" ? 0.75 : 1;
    const big = list.length > 5 ? 30 : 38;
    return list.map((raw, i) => this.piece(raw, i, sx, sy, big)).join("");
  }

  piece(raw, i, sx, sy, big) {
    const x = raw.replace("~", "");
    const angle = i * 2.4 + 0.6;
    const radius = Math.min(36, 14 * Math.sqrt(i));
    const px = Math.cos(angle) * radius * sx;
    const py = Math.sin(angle) * radius * sy;
    const rot = ((i * 47) % 50) - 25;
    const one = (dx, dy, dr, size, inner, cls) =>
      `<svg class="ic${cls || ""}" viewBox="0 0 48 48" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="left:calc(50% + ${(px + dx).toFixed(1)}px);top:calc(50% + ${(py + dy).toFixed(1)}px);width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;transform:rotate(${rot + dr}deg)">${inner || Icons.shape(x)}</svg>`;
    if (Catalog.isMix(raw)) return one(0, 0, 0, 62, this.mixture(raw), " liq");
    const def = Catalog.ingredients[x];
    if (def.how === "pour" || def.how === "squeeze" || def.how === "crack") return one(0, 0, 0, 54, this.puddle(def), " liq");
    if (def.how === "shake" || def.how === "grate") return one(0, 0, 0, 50, this.specks(x, def));
    return raw !== x ? one(-11, 3, -20, 22) + one(9, -6, 25, 22) + one(2, 9, 70, 22) : one(0, 0, 0, big);
  }

  puddle(def) {
    const yolk = def.how === "crack" ? `<circle cx="25" cy="25" r="7" fill="#f5b52a" stroke="#d9901a"/>` : "";
    const color = def.how === "crack" ? "#fffdf6" : def.color;
    return `<path d="${KitchenView.PUDDLE}" fill="${color}" stroke="rgba(0,0,0,.14)" opacity=".9"/><path d="M13 22q6-7 16-6" stroke="#fff" opacity=".6" fill="none"/>${yolk}`;
  }

  specks(id, def) {
    return `<g stroke="none">${KitchenView.SPECKS.map(([cx, cy], k) => `<circle cx="${cx}" cy="${cy}" r="${def.how === "grate" ? 2.6 : 1.7}" fill="${id === "sel" && k % 2 ? "#3b3b3b" : def.color}" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>`).join("")}</g>`;
  }

  blend(ids) {
    let r = 0;
    let g = 0;
    let b = 0;
    let total = 0;
    for (const id of ids) {
      const weight = Catalog.ingredients[id].how === "shake" ? 0.25 : 1;
      const hex = parseInt(Catalog.tint(id).slice(1), 16);
      r += (hex >> 16) * weight;
      g += ((hex >> 8) & 255) * weight;
      b += (hex & 255) * weight;
      total += weight;
    }
    return `rgb(${Math.round(r / total)},${Math.round(g / total)},${Math.round(b / total)})`;
  }

  mixture(raw) {
    const parts = Catalog.parts(raw);
    const specks = KitchenView.SPECKS.map(([cx, cy], k) => `<circle cx="${cx}" cy="${cy}" r="1.9" fill="${Catalog.tint(parts[k % parts.length])}" stroke="rgba(0,0,0,.2)" stroke-width=".5"/>`).join("");
    return `<path d="${KitchenView.PUDDLE}" fill="${this.blend(parts)}" stroke="rgba(0,0,0,.18)"/><path d="M13 22q6-7 16-6" stroke="#fff" opacity=".5" fill="none"/>${specks}`;
  }

  entryIcon(raw) {
    return Catalog.isMix(raw) ? Icons.svg(this.mixture(raw)) : Icons.draw(raw.replace("~", ""));
  }

  renderStations() {
    for (const id in Catalog.stations) {
      const el = this.query(`[data-from="${id}"]`);
      const flag = this.game.flags[id] || "";
      el.innerHTML = flag === "dish" ? Icons.dish(this.game.dish.recipe, "ck-dish") : this.pile(this.game.cont[id].slice(-9), id);
      el.className = "ck-cont" + (flag === "cooked" ? " cooked" : "") + (this.game.cont[id].length ? " has" : "");
      el.style.transform = id === "bol" ? `rotate(${this.game.stirAcc}rad)` : "";
    }
  }

  renderTray() {
    $("ckTray").innerHTML = this.game.tray.map((item) => (item.recipe ? Icons.dish(item.recipe) : Icons.glass(item.drink.color, 1))).join("");
    $("ckTray").classList.toggle("has", this.game.tray.length > 0);
  }

  renderMachine() {
    const glass = this.game.glass;
    $("ckGlass").innerHTML = glass ? Icons.glass(glass.drink ? glass.drink.color : "#fff", glass.drink ? glass.fill / CooktouGame.DRINK_T : 0) : "";
    $("ckGlass").classList.toggle("full", Boolean(glass && glass.fill >= CooktouGame.DRINK_T));
    this.query(".mc-slot").classList.toggle("pouring", Boolean(glass && glass.drink && glass.fill < CooktouGame.DRINK_T));
  }

  render() {
    this.renderClients();
    this.renderTicket();
    this.renderStations();
    this.renderTray();
    this.renderMachine();
    this.renderStock();
    this.game.guide.renderGuide();
    this.game.guide.hintIn = 0;
  }

  setMood(mood, time) {
    $("ckChef").dataset.mood = mood;
    this.game.mood = time || 0;
  }

  setFridge(open) {
    if ($("ckFridge").classList.contains("open") !== open) Sfx.play("fridge");
    $("ckFridge").classList.toggle("open", open);
    this.game.guide.hintIn = 0;
  }

  ghost(html, on, tool) {
    const ghost = $("ckGhost");
    ghost.innerHTML = html || "";
    ghost.className = "ck-ghost" + (on ? " on" : "") + (tool ? " tool" : "");
  }

  placeGhost() {
    const ghost = $("ckGhost");
    ghost.style.left = this.game.pointer.px + "px";
    ghost.style.top = this.game.pointer.py + "px";
  }

  reset() {
    this.fit();
    this.cam = this.camTarget = CooktouGame.CHEF_X - this.viewW / 2;
    this.clampCam();
    this.cam = this.camTarget;
    this.applyCam();
    this.setMood("", 0);
    this.setFridge(false);
  }

  fit() {
    const height = $("ckWorld").parentNode.clientHeight;
    this.scale = Math.min(KitchenView.MAX_SCALE, Math.max(KitchenView.MIN_SCALE, height / KitchenView.DESIGN_H));
    $("ckWorld").style.height = height / this.scale + "px";
    this.viewW = this.area.clientWidth / this.scale;
    this.clampCam();
  }

  updateCam(dt) {
    if (Math.abs(this.camTarget - this.cam) <= 0.5) return;
    this.cam += (this.camTarget - this.cam) * Math.min(1, dt * KitchenView.CAM_SPEED);
    this.applyCam();
  }

  clampCam() {
    this.camTarget = Math.max(0, Math.min(Math.max(0, CooktouGame.WORLD_W - this.viewW), this.camTarget));
  }

  applyCam() {
    $("ckWorld").style.transform = `translateX(${-Math.round(this.cam * this.scale)}px) scale(${this.scale})`;
  }
}
