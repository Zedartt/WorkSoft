class PointerController {
  static EDGE = 80;
  static EDGE_SPEED = 700;
  static STROKE_PX = 18;
  constructor(game) {
    this.game = game;
    this.drag = null;
    this.pan = null;
    this.px = 0;
    this.py = 0;
  }

  near(el, margins) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const [top, right, bottom, left] = margins;
    return this.px > r.left - left && this.px < r.right + right && this.py > r.top - top && this.py < r.bottom + bottom;
  }

  aimed() {
    const step = this.game.cur();
    if (!this.drag || this.drag.kind !== "ing" || !step || step.a !== "put" || step.ing !== this.drag.id || this.game.busy > 0) return null;
    return this.near(this.game.guide.surf(step.st), [90, 20, 10, 20]) ? step.st : null;
  }

  special(st) {
    const id = this.drag.id;
    this.release();
    this.game.doPut(id, st, this.game.view.query(`[data-drop="${st}"]`));
  }

  closeFridgeWhenLeft() {
    if (!$("ckFridge").classList.contains("open") || this.near($("ckFridge"), [0, 0, 0, 0])) return;
    this.game.view.setFridge(false);
  }

  grab(target) {
    const ing = target.closest("[data-ing]");
    const tool = target.closest("[data-tool]");
    const from = target.closest("[data-from]");
    const game = this.game;
    if (ing) {
      const def = Catalog.ingredients[ing.dataset.ing];
      const stream = def.how === "pour" ? `<i class="ck-stream" style="background:${def.color}"></i>` : "";
      return { kind: "ing", id: ing.dataset.ing, el: ing, html: Icons.draw(ing.dataset.ing) + stream, fill: 0, count: 0, rub: 0 };
    }
    if (tool) return { kind: "tool", id: tool.dataset.tool, el: tool, html: Icons.tools[tool.dataset.tool] };
    if (target.closest("[data-glass]")) return { kind: "glass", el: target.closest("[data-glass]"), html: Icons.glass("#fff", 0) };
    if (target.closest(".mc-slot") && game.glass && game.glass.fill >= CooktouGame.DRINK_T)
      return { kind: "full", el: $("ckGlass"), html: Icons.glass(game.glass.drink.color, 1) };
    if (target.closest("[data-drop='plateau']") && game.tray.length) return { kind: "tray", el: $("ckTray"), html: $("ckTray").innerHTML };
    if (from && game.cont[from.dataset.from].length) {
      const id = from.dataset.from;
      const html = game.flags[id] === "dish" ? Icons.dish(game.dish.recipe) : game.cont[id].slice(-3).map((raw) => game.view.entryIcon(raw)).join("");
      return { kind: "st", id, el: from, html };
    }
    return null;
  }

  down(event) {
    const game = this.game;
    if (game.over || game.history.isOpen || event.button > 0 || this.drag || this.pan) return;
    this.px = event.clientX;
    this.py = event.clientY;
    if (event.target.closest("button")) return;
    const step = game.cur();
    if (step && step.a === "shape" && event.target.closest("[data-drop='planche']")) {
      game.doShape();
      event.preventDefault();
      return;
    }
    this.drag = this.grab(event.target);
    if (this.drag) Object.assign(this.drag, { gx: this.px, gy: this.py, dir: 0, lx: this.px, ly: this.py });
    else this.pan = { x: this.px, cam: game.view.camTarget };
    try {
      game.view.area.setPointerCapture(event.pointerId);
    } catch (error) {}
    event.preventDefault();
    if (!this.drag) return game.view.area.classList.add("panning");
    this.drag.el.classList.add("held");
    game.view.ghost(this.drag.html, true, this.drag.kind === "tool");
    game.view.placeGhost();
    game.guide.hintIn = 0;
    Sfx.play("pop");
  }

  stroke(axis, countDown, countUp) {
    const delta = axis === "x" ? this.px - this.drag.gx : this.py - this.drag.gy;
    if (Math.abs(delta) < PointerController.STROKE_PX) return false;
    const dir = Math.sign(delta);
    this.drag.gx = this.px;
    this.drag.gy = this.py;
    if (dir === this.drag.dir) return false;
    this.drag.dir = dir;
    return (dir > 0 && countDown) || (dir < 0 && countUp);
  }

  travelled() {
    const distance = Math.hypot(this.px - this.drag.lx, this.py - this.drag.ly);
    this.drag.lx = this.px;
    this.drag.ly = this.py;
    return Math.min(60, distance);
  }

  moveIngredient() {
    const step = this.game.cur();
    const st = this.aimed();
    const gesture = step && step.a === "put" && step.ing === this.drag.id ? Catalog.gestureOf(step) : null;
    const travel = this.travelled();
    $("ckGhost").classList.toggle("tilt", Boolean(st && gesture && gesture.n));
    if (!st || !gesture) return;
    if (gesture.rub) {
      this.drag.rub += travel;
      if (Math.floor(this.drag.rub / 150) !== Math.floor((this.drag.rub - travel) / 150)) Sfx.play(gesture.sound);
      if (this.drag.rub >= gesture.rub) return this.special(st);
    } else if (gesture.n && this.stroke(gesture.axis, true, gesture.axis === "x")) {
      this.drag.count++;
      Sfx.play(gesture.sound);
      this.sprinkle();
      if (this.drag.count >= gesture.n) return this.special(st);
    }
    this.game.guide.progress();
  }

  sprinkle() {
    const ghost = $("ckGhost");
    ghost.classList.remove("sprinkle");
    void ghost.offsetWidth;
    ghost.classList.add("sprinkle");
  }

  moveTool() {
    const tool = Catalog.tools[this.drag.id];
    const over = this.near(this.game.guide.surf(tool.st), [80, 40, 40, 40]);
    const travel = this.travelled();
    if (tool.axis) {
      if (this.stroke(tool.axis, !tool.up, tool.up || tool.axis === "x") && over) this.game.doStroke(this.drag.id);
      return;
    }
    if (over) this.game.doStir(travel / 30);
  }

  move(event) {
    this.px = event.clientX;
    this.py = event.clientY;
    this.closeFridgeWhenLeft();
    const view = this.game.view;
    if (this.pan) {
      view.camTarget = this.pan.cam - (this.px - this.pan.x) / view.scale;
      view.clampCam();
      view.cam = view.camTarget;
      view.applyCam();
      return;
    }
    if (!this.drag) return;
    view.placeGhost();
    if (this.drag.kind === "ing") this.moveIngredient();
    else if (this.drag.kind === "tool") this.moveTool();
  }

  release() {
    const drag = this.drag;
    this.drag = null;
    if (drag) drag.el.classList.remove("held");
    this.game.view.ghost("", false);
    this.game.guide.hintIn = 0;
    if (!this.game.glass || !this.game.glass.drink || this.game.glass.fill >= CooktouGame.DRINK_T) Sfx.loop("pour", false);
    return drag;
  }

  cancel() {
    this.release();
    this.pan = null;
    this.game.view.area.classList.remove("panning");
  }

  target(event) {
    for (const el of document.elementsFromPoint(event.clientX, event.clientY)) {
      const client = el.closest("[data-client]");
      if (client) return { client };
      const drop = el.closest("[data-drop]");
      if (drop) return { drop };
    }
    return {};
  }

  up(event) {
    if (this.pan) {
      this.pan = null;
      this.game.view.area.classList.remove("panning");
      return;
    }
    if (!this.drag) return;
    const drag = this.release();
    if (drag.kind === "tool" || this.game.over) return;
    const { client, drop } = this.target(event);
    if (client) return drag.kind === "tray" ? this.game.doServe(+client.dataset.client, client) : this.game.fail(client);
    if (!drop) return;
    this.dropOn(drag, drop.dataset.drop, drop);
  }

  dropOn(drag, where, el) {
    const game = this.game;
    if (drag.kind === "glass") return where === "machine" ? game.doGlassDown(el) : null;
    if (drag.kind === "full") return where === "plateau" ? game.doGlassToTray(el) : null;
    if (drag.kind === "tray") return null;
    if (where === "plateau") return drag.kind === "st" && drag.id === "assiette" ? game.doPlate(el) : game.fail(el);
    if (where === "machine") return game.fail(el);
    if (drag.kind === "st") return game.doMove(drag.id, where, el);
    const step = game.cur();
    const expected = step && step.a === "put" && step.ing === drag.id && step.st === where;
    if (expected && Catalog.gestureOf(step) !== Catalog.gestures.drop) return game.guide.wrong($("ckNow"));
    game.doPut(drag.id, where, el);
  }

  update(dt) {
    const view = this.game.view;
    if (this.drag && !this.game.over) {
      const area = view.area.getBoundingClientRect();
      if (this.px < area.left + PointerController.EDGE) view.camTarget -= PointerController.EDGE_SPEED * dt;
      else if (this.px > area.right - PointerController.EDGE) view.camTarget += PointerController.EDGE_SPEED * dt;
      view.clampCam();
    }
    if (!this.drag || this.drag.kind !== "ing") return;
    const step = this.game.cur();
    const pouring = step && step.a === "put" && step.ing === this.drag.id && Catalog.gestureOf(step) === Catalog.gestures.pour;
    if (!pouring) return;
    const st = this.aimed();
    $("ckGhost").classList.toggle("pouring", Boolean(st));
    Sfx.loop("pour", Boolean(st));
    if (!st) return;
    this.drag.fill += dt;
    if (this.drag.fill >= CooktouGame.POUR_T) this.special(st);
    else this.game.guide.progress();
  }
}
