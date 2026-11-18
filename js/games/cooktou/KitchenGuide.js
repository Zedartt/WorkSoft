class KitchenGuide {
  static ARROW_PAD = 24;
  static HINT_EVERY = 0.25;
  constructor(game) {
    this.game = game;
    this.hintIn = 0;
    this.guideSig = null;
  }

  get view() {
    return this.game.view;
  }

  surf(id) {
    return this.view.query(`[data-drop="${id}"] .ck-surf`);
  }

  chip(pic, label, sub) {
    return `<span class="g-chip">${pic}<span><b>${label}</b>${sub ? `<em>${sub}</em>` : ""}</span></span>`;
  }

  stationChip(id) {
    const name = id === "plateau" ? "Plateau" : Catalog.stations[id].n;
    return this.chip(`<i class="g-st g-${id}"></i>`, name);
  }

  arrow(left, right, sign) {
    return left + `<span class="g-arr">${sign || "➜"}</span>` + right;
  }

  explain(task) {
    const game = this.game;
    if (task.a === "put") {
      const def = Catalog.ingredients[task.ing];
      const gesture = Catalog.gestureOf(task);
      const count = gesture.n || gesture.rub ? ` <b id="ckCount"></b>` : "";
      return [this.arrow(this.chip(Icons.draw(task.ing), def.n, "dans " + Catalog.storages[def.at].le), this.stationChip(task.st)), gesture.how + count];
    }
    if (task.tool) {
      const tool = Catalog.tools[task.tool];
      return [this.arrow(this.chip(Icons.tools[task.tool], tool.n), this.stationChip(tool.st), tool.axis === "x" ? "↔" : "↕"), tool.how + ` <b id="ckCount"></b>`];
    }
    if (task.a === "shape") return [this.arrow(this.chip(`<i class="g-hand">✋</i>`, "À la main"), this.stationChip("planche"), "↓"), `Clique plusieurs fois sur la planche pour façonner. <b id="ckCount"></b>`];
    if (task.a === "heat") {
      const def = Catalog.stations[task.st];
      return [this.chip(`<i class="g-btn">${def.button}</i>`, "Bouton " + def.n.toLowerCase()), game.busy > 0 ? "Ça cuit… patiente quelques secondes." : "Clique sur le bouton, puis attends la fin."];
    }
    if (task.a === "move") return [this.arrow(this.stationChip(task.from), this.stationChip(task.to)), "Attrape ce qu'il y a dedans et fais-le glisser."];
    if (task.a === "serve") return [this.arrow(this.stationChip("assiette"), this.stationChip("plateau")), "Attrape l'assiette et pose-la sur le plateau."];
    if (task.a === "drink") return [this.chip(Icons.glass(task.drink.color, 1), task.drink.name, "machine à boissons"), this.drinkHow()];
    return [this.arrow(this.stationChip("plateau"), this.chip(Avatar.client(game.active), "Le client", "en haut de l'écran")), "Le plateau est complet : fais-le glisser sur le client."];
  }

  drinkHow() {
    const glass = this.game.glass;
    if (!glass) return "Prends un verre et pose-le sous la machine.";
    if (!glass.drink) return "Clique sur la bonne boisson.";
    if (glass.fill < CooktouGame.DRINK_T) return "Le verre se remplit…";
    return "Pose le verre plein sur le plateau.";
  }

  renderGuide() {
    const el = $("ckNow");
    const task = this.game.task();
    if (!task) {
      const some = this.game.clients.some(Boolean);
      const status = this.game.source.online ? "" : `<span class="ck-offline">Recettes en ligne injoignables</span>`;
      el.innerHTML = `<span class="g-step">${some ? "Nouvelle commande" : "Pause"}</span><span class="g-txt">${some ? "Clique sur un client en haut pour prendre sa commande." : "En attente du prochain client…"}</span>${status}`;
      return;
    }
    const [visual, how] = this.explain(task);
    const step = this.game.dish ? `Étape ${this.game.idx + 1} / ${this.game.dish.recipe.steps.length}` : task.a === "drink" ? "Boisson" : "Service";
    el.innerHTML = `<span class="g-step">${step}</span><span class="g-vis">${visual}</span><span class="g-txt"><b>${task.txt || (task.a === "drink" ? "Sers : " + task.drink.name : "Apporte le plateau")}</b><span>${how}</span></span>`;
    this.progress();
  }

  takeMark(id) {
    const def = Catalog.ingredients[id];
    if (def.at === "frigo" && !$("ckFridge").classList.contains("open")) return [this.view.query(".fr-handle"), "① Ouvre le frigo", 1];
    if (def.at !== "frigo" && this.view.placard !== def.at) return [this.view.query(`[data-placard="${def.at}"]`), "① Ouvre ce placard", 1];
    return [this.view.query(`[data-ing="${id}"] .ic`), "① Prends", 1];
  }

  drinkMarks(drink) {
    const glass = this.game.glass;
    const slot = this.view.query(".mc-slot");
    if (!glass) return [[this.view.query(".mc-stack"), "① Prends un verre", 1], [slot, "② Pose-le ici", 2]];
    if (!glass.drink) return [[this.view.query(`[data-drink="${drink.id}"]`), "Clique", 1]];
    if (glass.fill < CooktouGame.DRINK_T) return [[slot, "Ça coule…", 0]];
    return [[slot, "① Attrape le verre", 1], [this.surf("plateau"), "② Pose sur le plateau", 2]];
  }

  marks(task) {
    if (!task || this.game.over) return [];
    if (this.game.busy > 0) return [[this.surf(this.game.busySt), "Ça cuit…", 0]];
    if (task.a === "put") return [this.takeMark(task.ing), [this.surf(task.st), Catalog.gestureOf(task).mark, 2]];
    if (task.tool) return [[this.view.query(`[data-tool="${task.tool}"]`), "① " + Catalog.tools[task.tool].n, 1], [this.surf(Catalog.tools[task.tool].st), Catalog.tools[task.tool].mark, 2]];
    if (task.a === "shape") return [[this.surf("planche"), "Clique ici ✋", 1]];
    if (task.a === "heat") return [[this.view.query(`[data-heat="${task.st}"]`), "Clique", 1]];
    if (task.a === "move") return [[this.surf(task.from), "① Attrape", 1], [this.surf(task.to), "② Pose ici", 2]];
    if (task.a === "serve") return [[this.surf("assiette"), "① Attrape l'assiette", 1], [this.surf("plateau"), "② Pose sur le plateau", 2]];
    if (task.a === "drink") return this.drinkMarks(task.drink);
    return [[this.surf("plateau"), "① Monte le plateau au client", 1]];
  }

  tick(dt) {
    this.hintIn -= dt;
    if (this.hintIn > 0) return;
    this.hintIn = KitchenGuide.HINT_EVERY;
    this.hints();
  }

  hints() {
    const area = this.view.area.getBoundingClientRect();
    const world = $("ckWorld").getBoundingClientRect();
    const points = [];
    let left = false;
    let right = false;
    let html = "";
    let sig = "";
    for (const [el, label, n] of this.marks(this.game.task())) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (rect.right < area.left + 40) left = true;
      if (rect.left > area.right - 40) right = true;
      const x = Math.round((rect.left - world.left + rect.width / 2) / this.view.scale);
      const y = Math.round((rect.top - world.top + Math.min(14, rect.height * 0.2)) / this.view.scale);
      points.push([x, y]);
      html += `<div class="ck-bub b${n}" style="left:${x}px;top:${y}px">${label}</div>`;
      sig += label + x + "," + y + ";";
    }
    if (points.length === 2 && !this.game.pointer.drag) {
      html = this.arrowSvg(points[0], points[1]) + html;
      sig += "arrow";
    }
    $("ckLeft").classList.toggle("call", left);
    $("ckRight").classList.toggle("call", right);
    if (sig === this.guideSig) return;
    this.guideSig = sig;
    $("ckGuide").innerHTML = html;
  }

  arrowSvg([x1, y1], [x2, y2]) {
    const pad = KitchenGuide.ARROW_PAD;
    const dir = x2 > x1 ? 1 : -1;
    const ya = y1 - 34;
    const yb = y2 - 34;
    const boxLeft = Math.min(x1, x2) - pad;
    const boxTop = Math.min(ya, yb) - 46 - pad;
    const width = Math.abs(x2 - x1) + pad * 2;
    const height = Math.abs(yb - ya) + 46 + pad * 2;
    const sx = x1 + dir * 24 - boxLeft;
    const ex = x2 - dir * 24 - boxLeft;
    return `<svg class="ck-arrow" style="left:${boxLeft}px;top:${boxTop}px" width="${width}" height="${height}"><defs><marker id="ckHead" viewBox="0 0 10 10" refX="6" refY="5" markerUnits="userSpaceOnUse" markerWidth="22" markerHeight="22" orient="auto"><path class="ck-arrow-head" d="M0 0l10 5-10 5 2.5-5z"/></marker></defs><path class="ck-arrow-line" d="M${sx} ${ya - boxTop} Q ${(x1 + x2) / 2 - boxLeft} ${Math.min(ya, yb) - 46 - boxTop} ${ex} ${yb - boxTop}" marker-end="url(#ckHead)"/></svg>`;
  }

  dragRatio(step) {
    const drag = this.game.pointer.drag;
    if (!drag || drag.kind !== "ing" || !step || step.a !== "put" || step.ing !== drag.id) return null;
    const gesture = Catalog.gestureOf(step);
    if (gesture.rub) return drag.rub / gesture.rub;
    if (gesture.n) return drag.count / gesture.n;
    return step && Catalog.ingredients[drag.id].how === "pour" ? drag.fill / CooktouGame.POUR_T : null;
  }

  stepRatio(step) {
    if (!step) return 0;
    if (step.a === "stir") return Math.min(1, Math.abs(this.game.stirAcc) / (Math.PI * 2 * step.n));
    if (step.tool || step.a === "shape") return this.game.strokes / step.n;
    return 0;
  }

  progress() {
    const step = this.game.cur();
    const dragged = this.dragRatio(step);
    const worked = step && step.tool ? Catalog.tools[step.tool].st : step && step.a === "shape" ? "planche" : null;
    for (const id in Catalog.stations) {
      const bar = this.view.query(`[data-drop="${id}"] .ck-prog`);
      if (bar.parentNode.classList.contains("cooking")) continue;
      let ratio = id === worked ? this.stepRatio(step) : 0;
      if (dragged !== null && id === step.st) ratio = dragged;
      bar.style.width = Math.min(1, ratio) * 80 + "%";
    }
    this.count(step, dragged);
  }

  count(step, dragged) {
    const el = $("ckCount");
    if (!el || !step) return;
    if (step.a === "stir") el.textContent = `${Math.round(this.stepRatio(step) * 100)} %`;
    else if (step.tool || step.a === "shape") el.textContent = `${this.game.strokes} / ${step.n}`;
    else if (step.a === "put") {
      const gesture = Catalog.gestureOf(step);
      const ratio = dragged || 0;
      el.textContent = gesture.rub ? `${Math.round(Math.min(1, ratio) * 100)} %` : `${Math.round(ratio * gesture.n)} / ${gesture.n} ${gesture.unit}`;
    }
  }

  bump(st) {
    const surf = this.surf(st);
    surf.classList.remove("chop");
    void surf.offsetWidth;
    surf.classList.add("chop");
  }

  wrong(el) {
    if (!el) return;
    el.classList.remove("wrong");
    void el.offsetWidth;
    el.classList.add("wrong");
    setTimeout(() => el.classList.remove("wrong"), 320);
  }
}
