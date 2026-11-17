class CooktouGame extends Game {
  static MAX_LOST = 3;
  static SLOTS = 3;
  static WORLD_W = 2280;
  static CHEF_X = 1235;
  static POUR_T = 1.1;
  static PHONE_QUERY = "(pointer: coarse) and (max-width: 600px), (pointer: coarse) and (max-height: 500px)";
  static SHAKES = 4;
  constructor() {
    super({
      id: "cooktou",
      name: "Cooktou",
      tag: "Prends les commandes et cuisine de vraies recettes, étape par étape",
      art: '<svg viewBox="0 0 90 60" style="height:1em"><circle cx="32" cy="30" r="24" fill="#4a515b" stroke="#14171c" stroke-width="4"/><rect x="54" y="25" width="34" height="10" rx="5" fill="#3b2a20"/><ellipse cx="32" cy="30" rx="15" ry="13" fill="#fff"/><circle cx="34" cy="31" r="6" fill="#ffc83d"/></svg>',
    });
    this.clients = [];
    this.active = null;
    this.idx = 0;
    this.ready = false;
    this.cont = this.empty();
    this.flags = {};
    this.chops = 0;
    this.stirAcc = 0;
    this.busy = 0;
    this.busySt = null;
    this.score = 0;
    this.lost = 0;
    this.served = 0;
    this.spawnIn = 0;
    this.over = false;
    this.mood = 0;
    this.lastRecipe = null;
    this.raf = 0;
    this.last = 0;
    this.built = false;
    this.view = new KitchenView(this);
    this.pointer = new PointerController(this);
    $("ckPhoneMenu").addEventListener("click", () => app.launcher.backToMenu());
  }

  pick(a) {
    return a[Math.floor(Math.random() * a.length)];
  }

  empty() {
    return {
      planche: [],
      bol: [],
      plaque: [],
      four: [],
      assiette: [],
    };
  }

  cur() {
    return this.active ? this.active.recipe.steps[this.idx] : null;
  }

  fail(el) {
    if (this.active) this.active.pat -= 2;
    this.view.setMood("oops", 0.7);
    this.view.wrong(el);
    Sfx.play("bad");
  }

  complete() {
    this.idx++;
    this.chops = 0;
    this.stirAcc = 0;
    if (this.cur().a === "serve") {
      this.ready = true;
      this.cont.assiette = ["dish"];
      this.flags.assiette = "dish";
    }
    this.view.render();
  }

  takeOrder(i, el) {
    const c = this.clients[i];
    if (this.over || !c) return;
    if (this.active) {
      if (this.active !== c) this.view.wrong(el);
      return;
    }
    this.active = c;
    this.idx = 0;
    this.ready = false;
    this.cont = this.empty();
    this.flags = {};
    this.chops = 0;
    this.stirAcc = 0;
    Sfx.play("paper");
    this.view.render();
  }

  doPut(ing, st, el) {
    const s = this.cur();
    if (!s) {
      this.view.wrong($("ckNow"));
      return;
    }
    if (this.busy > 0) return;
    if (s.a === "put" && s.ing === ing && s.st === st) {
      this.cont[st].push(ing);
      Sfx.play("drop");
      this.complete();
    } else this.fail(el);
  }

  doMove(from, to, el) {
    const s = this.cur();
    if (!s || this.busy > 0 || from === to) return;
    if (s.a === "move" && s.from === from && s.to === to) {
      this.cont[to].push(...this.cont[from]);
      this.cont[from] = [];
      this.flags[from] = "";
      Sfx.play("drop");
      this.complete();
    } else this.fail(el);
  }

  doServe(i, el) {
    const c = this.clients[i];
    if (!this.ready || !c || c !== this.active) {
      this.fail(el);
      return;
    }
    this.score += 10 + Math.round(10 * Math.max(0, c.pat / c.max));
    this.served++;
    this.clients[i] = null;
    this.active = null;
    this.ready = false;
    this.cont = this.empty();
    this.flags = {};
    this.view.setMood("happy", 1.2);
    Sfx.play("cash");
    this.view.hud();
    this.view.render();
  }

  doChop() {
    const s = this.cur();
    if (!s || s.a !== "cut" || this.busy > 0) return;
    this.chops++;
    Sfx.play("chop");
    const c = this.view.query(`[data-drop="planche"] .ck-surf`);
    c.classList.remove("chop");
    void c.offsetWidth;
    c.classList.add("chop");
    if (this.chops >= s.n) {
      this.cont.planche = this.cont.planche.map((x) => (Catalog.isMix(x) ? x : x.replace("~", "") + "~"));
      this.complete();
    } else this.view.progress();
  }

  doStir(d) {
    const s = this.cur();
    if (!s || s.a !== "stir" || this.busy > 0) return;
    if (Math.floor(Math.abs(this.stirAcc + d) / 1.6) !== Math.floor(Math.abs(this.stirAcc) / 1.6)) Sfx.play("stir");
    this.stirAcc += d;
    if (Math.abs(this.stirAcc) >= Math.PI * 2 * s.n) {
      this.cont.bol = [Catalog.mixOf(this.cont.bol)];
      this.complete();
    } else {
      this.view.query(`[data-from="bol"]`).style.transform = `rotate(${this.stirAcc}rad)`;
      this.view.progress();
    }
  }

  doHeat(st, el) {
    const s = this.cur();
    if (this.over || this.busy > 0) return;
    if (!s || s.a !== "heat" || s.st !== st) {
      this.view.wrong(el);
      return;
    }
    this.busy = s.wait;
    this.busySt = st;
    Sfx.play("click");
    Sfx.loop(st === "four" ? "hum" : "sizzle", true);
    if (el) {
      el.style.setProperty("--d", s.wait + "s");
      el.querySelector(".ck-prog").style.width = "";
      el.classList.add("cooking");
    }
    this.view.renderGuide();
    this.view.hintIn = 0;
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

  spawn() {
    const free = [];
    for (let i = 0; i < CooktouGame.SLOTS; i++) if (!this.clients[i]) free.push(i);
    if (!free.length) return false;
    const taken = this.clients.filter(Boolean).map((c) => c.recipe);
    let pool = RecipeBook.all.filter((r) => r !== this.lastRecipe && !taken.includes(r));
    if (!pool.length) pool = RecipeBook.all;
    const recipe = (this.lastRecipe = this.pick(pool));
    const max = Math.max(55, 180 - this.served * 9) + recipe.steps.length * 6;
    Sfx.play("bell");
    this.clients[this.pick(free)] = {
      recipe,
      pat: max,
      max,
      skin: this.pick(Avatar.SKIN),
      hair: this.pick(Avatar.HAIR),
      shirt: this.pick(Avatar.SHIRT),
      low: false,
    };
    return true;
  }

  end() {
    this.over = true;
    this.stopBusy();
    Sfx.stopAll();
    Sfx.play("lose");
    if (this.pointer.drag) {
      this.pointer.drag.el.classList.remove("held");
      this.pointer.drag = null;
      this.view.ghost("", false);
    }
    let best = 0;
    try {
      best = +localStorage.getItem("cooktou_best") || 0;
    } catch (e) {}
    $("ckFinal").textContent = this.score;
    $("ckServed").textContent = this.served + (this.served > 1 ? " clients servis" : " client servi");
    if (this.score > best) {
      try {
        localStorage.setItem("cooktou_best", this.score);
      } catch (e) {}
      $("ckRecord").textContent = best ? `Nouveau record ! (ancien : ${best})` : "Premier score enregistré.";
    } else $("ckRecord").textContent = `Ton record : ${best}`;
    $("ckOver").classList.add("show");
  }

  reset() {
    this.stopBusy();
    this.clients = [];
    this.active = null;
    this.idx = 0;
    this.ready = false;
    this.cont = this.empty();
    this.flags = {};
    this.chops = 0;
    this.stirAcc = 0;
    this.score = 0;
    this.lost = 0;
    this.served = 0;
    this.spawnIn = 1;
    this.over = false;
    this.lastRecipe = null;
    this.view.guideSig = null;
    $("ckOver").classList.remove("show");
    this.view.fit();
    this.view.cam = this.view.camTarget = CooktouGame.CHEF_X - this.view.viewW / 2;
    this.view.clampCam();
    this.view.cam = this.view.camTarget;
    this.view.applyCam();
    this.view.setMood("", 0);
    this.view.setFridge(false);
    this.view.hud();
    this.view.render();
  }

  update(dt) {
    if (this.pointer.drag && !this.over) {
      const a = this.view.area.getBoundingClientRect();
      if (this.pointer.px < a.left + 80) this.view.camTarget -= 700 * dt;
      else if (this.pointer.px > a.right - 80) this.view.camTarget += 700 * dt;
      this.view.clampCam();
    }
    if (this.pointer.drag && this.pointer.drag.kind === "ing" && Catalog.ingredients[this.pointer.drag.id].pour) {
      const st = this.pointer.aimed();
      $("ckGhost").classList.toggle("pouring", !!st);
      Sfx.loop("pour", !!st);
      if (st) {
        this.pointer.drag.fill += dt;
        if (this.pointer.drag.fill >= CooktouGame.POUR_T) this.pointer.special(st);
        else this.view.progress();
      }
    }
    if (Math.abs(this.view.camTarget - this.view.cam) > 0.5) {
      this.view.cam += (this.view.camTarget - this.view.cam) * Math.min(1, dt * 12);
      this.view.applyCam();
    }
    this.view.hintIn -= dt;
    if (this.view.hintIn <= 0) {
      this.view.hintIn = 0.25;
      this.view.hints();
    }
    if (this.over) return;
    if (this.mood > 0) {
      this.mood -= dt;
      if (this.mood <= 0) this.view.setMood("", 0);
    }
    if (this.busy > 0) {
      this.busy -= dt;
      if (this.busy <= 0) {
        const st = this.busySt;
        this.stopBusy();
        this.flags[st] = "cooked";
        Sfx.play("ding");
        this.complete();
      }
    }
    this.spawnIn -= dt;
    if (!this.clients.some(Boolean) && this.spawnIn > 1.5) this.spawnIn = 1.5;
    if (this.spawnIn <= 0) {
      if (this.spawn()) {
        this.spawnIn = Math.max(15, 42 - this.served * 2.5) * (0.85 + Math.random() * 0.3);
        this.view.render();
      } else this.spawnIn = 3;
    }
    let changed = false;
    for (let i = 0; i < CooktouGame.SLOTS; i++) {
      const c = this.clients[i];
      if (!c) continue;
      c.pat -= dt;
      const low = c.pat < c.max * 0.3;
      if (low !== c.low) {
        c.low = low;
        changed = true;
      }
      if (c.pat <= 0) {
        if (this.active === c) {
          this.active = null;
          this.ready = false;
          this.cont = this.empty();
          this.flags = {};
          this.chops = 0;
          this.stirAcc = 0;
          this.stopBusy();
        }
        this.clients[i] = null;
        this.lost++;
        changed = true;
        this.view.setMood("oops", 1);
        Sfx.play("escape");
      }
    }
    if (changed) {
      this.view.hud();
      this.view.render();
      if (this.lost >= CooktouGame.MAX_LOST) this.end();
    } else this.view.bars();
  }

  frame(now) {
    const dt = Math.min(now - this.last, 100) / 1000;
    this.last = now;
    this.update(dt);
    this.raf = requestAnimationFrame((...args) => this.frame(...args));
  }

  open() {
    const phone = matchMedia(CooktouGame.PHONE_QUERY).matches;
    $("cooktou").classList.toggle("ck-phone", phone);
    if (phone) return;
    if (!this.built) this.view.build();
    this.reset();
    this.last = performance.now();
    this.raf = requestAnimationFrame((...args) => this.frame(...args));
  }

  close() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    Sfx.stopAll();
    if (this.pointer.drag) {
      this.pointer.drag.el.classList.remove("held");
      this.pointer.drag = null;
      this.view.ghost("", false);
    }
    this.pointer.pan = null;
  }
}
