class CooktouGame extends Game {
  static MAX_LOST = 3;
  static SLOTS = 3;
  static WORLD_W = 3680;
  static CHEF_X = 2400;
  static POUR_T = 1.1;
  static DRINK_T = 1.6;
  static MAX_WAIT = 6;
  static RECENT = 15;
  static PHONE_QUERY = "(pointer: coarse) and (max-width: 600px), (pointer: coarse) and (max-height: 500px)";
  constructor() {
    super({
      id: "cooktou",
      name: "Cooktou",
      tag: "Prends les commandes et cuisine de vraies recettes du monde entier, étape par étape",
      art: '<svg viewBox="0 0 90 60" style="height:1em"><circle cx="32" cy="30" r="24" fill="#4a515b" stroke="#14171c" stroke-width="4"/><rect x="54" y="25" width="34" height="10" rx="5" fill="#3b2a20"/><ellipse cx="32" cy="30" rx="15" ry="13" fill="#fff"/><circle cx="34" cy="31" r="6" fill="#ffc83d"/></svg>',
    });
    this.source = new RecipeSource();
    this.recent = [];
    this.raf = 0;
    this.last = 0;
    this.built = false;
    this.clearRun();
    this.view = new KitchenView(this);
    this.guide = new KitchenGuide(this);
    this.pointer = new PointerController(this);
    this.history = new ServiceHistory();
    $("ckPhoneMenu").addEventListener("click", () => app.launcher.backToMenu());
  }

  clearRun() {
    this.clients = [];
    this.score = 0;
    this.lost = 0;
    this.served = 0;
    this.spawnIn = 1;
    this.waited = 0;
    this.over = false;
    this.mood = 0;
    this.clearOrder();
  }

  clearOrder() {
    this.active = null;
    this.dish = null;
    this.tray = [];
    this.glass = null;
    this.clearStations();
  }

  clearStations() {
    this.idx = 0;
    this.ready = false;
    this.cont = this.empty();
    this.flags = {};
    this.strokes = 0;
    this.stirAcc = 0;
    this.busy = 0;
    this.busySt = null;
  }

  pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  empty() {
    const content = {};
    for (const id in Catalog.stations) content[id] = [];
    return content;
  }

  order() {
    return this.active ? this.active.order : null;
  }

  cur() {
    return this.dish ? this.dish.recipe.steps[this.idx] : null;
  }

  task() {
    if (!this.active) return null;
    if (this.dish) return this.cur();
    return this.order().drinksLeft().length ? { a: "drink", drink: this.order().drinksLeft()[0].drink } : { a: "deliver" };
  }

  fail(el) {
    if (this.active) this.active.pat -= 2;
    this.view.setMood("oops", 0.7);
    this.guide.wrong(el);
    Sfx.play("bad");
  }

  complete() {
    this.idx++;
    this.strokes = 0;
    this.stirAcc = 0;
    if (this.cur().a === "serve") {
      this.ready = true;
      this.cont.assiette = ["dish"];
      this.flags.assiette = "dish";
    }
    this.view.render();
  }

  takeOrder(i, el) {
    const client = this.clients[i];
    if (this.over || !client) return;
    if (this.active) {
      if (this.active !== client) this.guide.wrong(el);
      return;
    }
    this.clearOrder();
    this.active = client;
    this.startDish();
    Sfx.play("paper");
  }

  startDish() {
    this.stopBusy();
    this.clearStations();
    this.dish = this.order().dish();
    this.view.render();
  }

  doPut(ing, st, el) {
    const step = this.cur();
    if (!step || this.busy > 0) {
      if (!step) this.guide.wrong($("ckNow"));
      return;
    }
    if (step.a !== "put" || step.ing !== ing || step.st !== st) return this.fail(el);
    this.cont[st].push(ing);
    Sfx.play("drop");
    this.complete();
  }

  doMove(from, to, el) {
    const step = this.cur();
    if (!step || this.busy > 0 || from === to) return;
    if (step.a !== "move" || step.from !== from || step.to !== to) return this.fail(el);
    this.cont[to].push(...this.cont[from]);
    this.cont[from] = [];
    this.flags[from] = "";
    Sfx.play("drop");
    this.complete();
  }

  doStroke(tool) {
    const step = this.cur();
    if (!step || step.tool !== tool || this.busy > 0) return;
    this.strokes++;
    Sfx.play(Catalog.tools[tool].sound);
    this.guide.bump(Catalog.tools[tool].st);
    if (this.strokes < step.n) return this.guide.progress();
    if (step.a === "cut") this.cont.planche = this.cont.planche.map((raw) => (Catalog.isMix(raw) ? raw : raw.replace("~", "") + "~"));
    this.complete();
  }

  doShape() {
    const step = this.cur();
    if (!step || step.a !== "shape" || this.busy > 0) return;
    this.strokes++;
    Sfx.play("knead");
    this.guide.bump("planche");
    if (this.strokes >= step.n) this.complete();
    else this.guide.progress();
  }

  doStir(distance) {
    const step = this.cur();
    if (!step || step.a !== "stir" || this.busy > 0) return;
    if (Math.floor(Math.abs(this.stirAcc + distance) / 1.6) !== Math.floor(Math.abs(this.stirAcc) / 1.6)) Sfx.play("stir");
    this.stirAcc += distance;
    if (Math.abs(this.stirAcc) >= Math.PI * 2 * step.n) {
      this.cont.bol = [Catalog.mixOf(this.cont.bol)];
      this.complete();
    } else {
      this.view.query(`[data-from="bol"]`).style.transform = `rotate(${this.stirAcc}rad)`;
      this.guide.progress();
    }
  }

  doHeat(st, el) {
    const step = this.cur();
    if (this.over || this.busy > 0) return;
    if (!step || step.a !== "heat" || step.st !== st) return this.guide.wrong(el);
    this.busy = step.wait;
    this.busySt = st;
    Sfx.play("click");
    Sfx.loop(Catalog.stations[st].sound, true);
    if (el) {
      el.style.setProperty("--d", step.wait + "s");
      el.querySelector(".ck-prog").style.width = "";
      el.classList.add("cooking");
    }
    this.guide.renderGuide();
    this.guide.hintIn = 0;
  }

  stopBusy() {
    this.busy = 0;
    Sfx.loop("hum", false);
    Sfx.loop("sizzle", false);
    if (this.busySt) {
      const el = this.view.query(`[data-drop="${this.busySt}"]`);
      if (el) el.classList.remove("cooking");
    }
    this.busySt = null;
  }

  finishHeat() {
    const st = this.busySt;
    this.stopBusy();
    if (st === "mixeur") this.cont.mixeur = [Catalog.mixOf(this.cont.mixeur)];
    else this.flags[st] = "cooked";
    Sfx.play("ding");
    this.complete();
  }

  doPlate(el) {
    if (!this.ready || !this.dish) return this.fail(el);
    this.dish.done = true;
    this.tray.push({ recipe: this.dish.recipe });
    Sfx.play("drop");
    if (this.order().dish()) return this.startDish();
    this.stopBusy();
    this.clearStations();
    this.dish = null;
    this.view.render();
  }

  doGlassDown(el) {
    if (this.glass) return this.guide.wrong(el);
    if (!this.active || !this.order().drinksLeft().length) return this.fail(el);
    this.glass = { drink: null, fill: 0 };
    Sfx.play("drop");
    this.view.renderMachine();
    this.guide.renderGuide();
  }

  doDrink(drinkId, el) {
    if (!this.glass || this.glass.drink) return this.guide.wrong(el);
    if (!this.order().needs(drinkId)) return this.fail(el);
    this.glass.drink = Catalog.drinks.find((drink) => drink.id === drinkId);
    Sfx.play("click");
    Sfx.loop("pour", true);
    this.view.renderMachine();
    this.guide.renderGuide();
  }

  doGlassToTray(el) {
    if (!this.glass || this.glass.fill < CooktouGame.DRINK_T) return this.guide.wrong(el);
    this.order().deliverDrink(this.glass.drink.id);
    this.tray.push({ drink: this.glass.drink });
    this.glass = null;
    Sfx.play("drop");
    this.view.render();
  }

  fillGlass(dt) {
    if (!this.glass || !this.glass.drink || this.glass.fill >= CooktouGame.DRINK_T) return;
    this.glass.fill = Math.min(CooktouGame.DRINK_T, this.glass.fill + dt);
    this.view.renderMachine();
    if (this.glass.fill < CooktouGame.DRINK_T) return;
    Sfx.loop("pour", false);
    Sfx.play("ding");
    this.view.renderMachine();
    this.guide.renderGuide();
  }

  doServe(i, el) {
    const client = this.clients[i];
    if (!client || client !== this.active || !this.order().complete()) return this.fail(el);
    const points = this.order().points(client.pat / client.max);
    this.score += points;
    this.served++;
    this.history.add(this.order(), points);
    this.clients[i] = null;
    this.clearOrder();
    this.view.setMood("happy", 1.2);
    Sfx.play("cash");
    this.view.hud();
    this.view.render();
  }

  spawn() {
    const free = [];
    for (let i = 0; i < CooktouGame.SLOTS; i++) if (!this.clients[i]) free.push(i);
    if (!free.length) return false;
    const courses = Order.courses(this.served);
    if (this.source.waiting(courses.filter((course) => course !== "boisson")) && this.waited < CooktouGame.MAX_WAIT) return false;
    this.waited = 0;
    const avoid = [...this.recent, ...this.clients.filter(Boolean).flatMap((client) => client.order.items.filter((item) => item.recipe).map((item) => item.recipe.id))];
    const order = Order.create(courses, this.source, avoid);
    order.items.forEach((item) => item.recipe && this.recent.push(item.recipe.id));
    this.recent = this.recent.slice(-CooktouGame.RECENT);
    const max = Math.max(55, 180 - this.served * 9) + order.steps() * 5;
    Sfx.play("bell");
    this.clients[this.pick(free)] = { order, pat: max, max, skin: this.pick(Avatar.SKIN), hair: this.pick(Avatar.HAIR), shirt: this.pick(Avatar.SHIRT), low: false };
    this.spawnIn = (Math.max(18, 42 - this.served * 2.5) + order.steps() * 1.2) * (0.85 + Math.random() * 0.3);
    return true;
  }

  end() {
    this.over = true;
    this.stopBusy();
    Sfx.stopAll();
    Sfx.play("lose");
    this.pointer.cancel();
    const best = +Store.read("cooktou_best", 0) || 0;
    $("ckFinal").textContent = this.score;
    $("ckServed").textContent = this.served + (this.served > 1 ? " clients servis" : " client servi");
    if (this.score > best) {
      Store.write("cooktou_best", this.score);
      $("ckRecord").textContent = best ? `Nouveau record ! (ancien : ${best})` : "Premier score enregistré.";
    } else $("ckRecord").textContent = `Ton record : ${best}`;
    $("ckOver").classList.add("show");
  }

  reset() {
    this.history.hide();
    this.history.newRound();
    this.stopBusy();
    Sfx.stopAll();
    this.clearRun();
    this.source.fill();
    $("ckOver").classList.remove("show");
    this.view.reset();
    this.guide.guideSig = null;
    this.view.hud();
    this.view.render();
  }

  updateClients(dt) {
    let changed = false;
    for (let i = 0; i < CooktouGame.SLOTS; i++) {
      const client = this.clients[i];
      if (!client) continue;
      client.pat -= dt;
      const low = client.pat < client.max * 0.3;
      if (low !== client.low) {
        client.low = low;
        changed = true;
      }
      if (client.pat > 0) continue;
      if (this.active === client) {
        this.stopBusy();
        Sfx.loop("pour", false);
        this.clearOrder();
      }
      this.clients[i] = null;
      this.lost++;
      changed = true;
      this.view.setMood("oops", 1);
      Sfx.play("escape");
    }
    if (!changed) return this.view.bars();
    this.view.hud();
    this.view.render();
    if (this.lost >= CooktouGame.MAX_LOST) this.end();
  }

  updateSpawn(dt) {
    this.spawnIn -= dt;
    if (!this.clients.some(Boolean) && this.spawnIn > 1.5) this.spawnIn = 1.5;
    if (this.spawnIn > 0) return;
    if (this.spawn()) this.view.render();
    else {
      this.waited += 0.5;
      this.spawnIn = 0.5;
    }
  }

  update(dt) {
    this.pointer.update(dt);
    this.view.updateCam(dt);
    this.guide.tick(dt);
    if (this.over) return;
    if (this.mood > 0) {
      this.mood -= dt;
      if (this.mood <= 0) this.view.setMood("", 0);
    }
    if (this.busy > 0) {
      this.busy -= dt;
      if (this.busy <= 0) this.finishHeat();
    }
    this.fillGlass(dt);
    this.updateSpawn(dt);
    this.updateClients(dt);
  }

  frame(now) {
    const dt = Math.min(now - this.last, 100) / 1000;
    this.last = now;
    if (!this.history.isOpen) this.update(dt);
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  open() {
    const phone = matchMedia(CooktouGame.PHONE_QUERY).matches;
    $("cooktou").classList.toggle("ck-phone", phone);
    if (phone) return;
    if (!this.built) this.view.build();
    this.reset();
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  close() {
    this.history.hide();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    Sfx.stopAll();
    this.pointer.cancel();
  }
}
