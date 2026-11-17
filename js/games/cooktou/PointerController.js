class PointerController {
  constructor(game) {
    this.game = game;
    this.drag = null;
    this.pan = null;
    this.px = 0;
    this.py = 0;
  }

  aimed() {
    const s = this.game.cur();
    if (!this.drag || this.drag.kind !== "ing" || !s || s.a !== "put" || s.ing !== this.drag.id || this.game.busy > 0) return null;
    const r = this.game.view.query(`[data-drop="${s.st}"] .ck-surf`).getBoundingClientRect();
    return this.px > r.left - 20 && this.px < r.right + 20 && this.py > r.top - 90 && this.py < r.bottom + 10 ? s.st : null;
  }

  special(st) {
    const d = this.drag;
    this.drag = null;
    d.el.classList.remove("held");
    this.game.view.ghost("", false);
    Sfx.loop("pour", false);
    this.game.doPut(d.id, st, this.game.view.query(`[data-drop="${st}"]`));
  }

  closeFridgeWhenLeft() {
    const fridge = $("ckFridge");
    if (!fridge.classList.contains("open")) return;
    const r = fridge.getBoundingClientRect();
    if (this.px >= r.left && this.px <= r.right && this.py >= r.top && this.py <= r.bottom) return;
    this.game.view.setFridge(false);
  }

  down(e) {
    if (this.game.over || e.button > 0 || this.drag || this.pan) return;
    this.px = e.clientX;
    this.py = e.clientY;
    if (e.target.closest("button")) return;
    const ing = e.target.closest("[data-ing]"),
      tool = e.target.closest("[data-tool]"),
      from = e.target.closest("[data-from]");
    if (ing) {
      const id = ing.dataset.ing;
      this.drag = {
        kind: "ing",
        id,
        el: ing,
        html:
          Icons.draw(id) +
          (Catalog.ingredients[id].pour ? `<i class="ck-stream" style="background:${Catalog.ingredients[id].pour}"></i>` : ""),
        fill: 0,
        shakes: 0,
        gy: this.py,
        dir: 0,
      };
    } else if (tool)
      this.drag = {
        kind: "tool",
        id: tool.dataset.tool,
        el: tool,
        html: Icons.tools[tool.dataset.tool],
        gy: this.py,
        dir: 0,
        ang: null,
      };
    else if (from && this.game.cont[from.dataset.from].length) {
      const id = from.dataset.from;
      this.drag = {
        kind: "st",
        id,
        el: from,
        html:
          this.game.flags[id] === "dish"
            ? Icons.draw(this.game.active.recipe.id)
            : this.game.cont[id]
                .slice(-3)
                .map((x) => this.game.view.entryIcon(x))
                .join(""),
      };
    } else
      this.pan = {
        x: this.px,
        cam: this.game.view.camTarget,
      };
    try {
      this.game.view.area.setPointerCapture(e.pointerId);
    } catch (err) {}
    e.preventDefault();
    if (this.drag) {
      this.drag.el.classList.add("held");
      this.game.view.ghost(this.drag.html, true, this.drag.kind === "tool");
      this.game.view.placeGhost();
      this.game.view.hintIn = 0;
      Sfx.play("pop");
    } else this.game.view.area.classList.add("panning");
  }

  move(e) {
    this.px = e.clientX;
    this.py = e.clientY;
    this.closeFridgeWhenLeft();
    if (this.pan) {
      this.game.view.camTarget = this.pan.cam - (this.px - this.pan.x) / this.game.view.scale;
      this.game.view.clampCam();
      this.game.view.cam = this.game.view.camTarget;
      this.game.view.applyCam();
      return;
    }
    if (!this.drag) return;
    this.game.view.placeGhost();
    if (this.drag.kind === "ing" && Catalog.ingredients[this.drag.id].shake) {
      const st = this.aimed(),
        g = $("ckGhost");
      g.classList.toggle("tilt", !!st);
      if (Math.abs(this.py - this.drag.gy) >= 14) {
        const dir = Math.sign(this.py - this.drag.gy);
        if (dir !== this.drag.dir) {
          this.drag.dir = dir;
          if (dir > 0 && st) {
            this.drag.shakes++;
            Sfx.play("shake");
            g.classList.remove("sprinkle");
            void g.offsetWidth;
            g.classList.add("sprinkle");
            if (this.drag.shakes >= CooktouGame.SHAKES) {
              this.special(st);
              return;
            }
            this.game.view.progress();
          }
        }
        this.drag.gy = this.py;
      }
    }
    if (this.drag.kind !== "tool") return;
    if (this.drag.id === "knife") {
      const r = this.game.view.query(`[data-drop="planche"]`).getBoundingClientRect();
      const over_ = this.px > r.left - 30 && this.px < r.right + 30 && this.py > r.top - 80 && this.py < r.bottom + 40;
      if (Math.abs(this.py - this.drag.gy) >= 20) {
        const dir = Math.sign(this.py - this.drag.gy);
        if (dir !== this.drag.dir) {
          if (dir > 0 && over_) this.game.doChop();
          this.drag.dir = dir;
        }
        this.drag.gy = this.py;
      }
    } else {
      const r = this.game.view.query(`[data-drop="bol"] .ck-surf`).getBoundingClientRect();
      const inside = Math.hypot(this.px - (r.left + r.right) / 2, this.py - (r.top + r.bottom) / 2) < r.width * 0.8;
      if (inside && this.drag.lx !== undefined)
        this.game.doStir(Math.min(60, Math.hypot(this.px - this.drag.lx, this.py - this.drag.ly)) / 30);
      this.drag.lx = this.px;
      this.drag.ly = this.py;
    }
  }

  up(e) {
    if (this.pan) {
      this.pan = null;
      this.game.view.area.classList.remove("panning");
      return;
    }
    if (!this.drag) return;
    const d = this.drag;
    this.drag = null;
    d.el.classList.remove("held");
    this.game.view.ghost("", false);
    this.game.view.hintIn = 0;
    Sfx.loop("pour", false);
    if (d.kind === "tool" || this.game.over) return;
    let target = null,
      client = null;
    for (const el of document.elementsFromPoint(e.clientX, e.clientY)) {
      client = el.closest("[data-client]");
      if (client) break;
      target = el.closest("[data-drop]");
      if (target) break;
    }
    if (client) {
      if (d.kind === "st" && d.id === "assiette") this.game.doServe(+client.dataset.client, client);
      else this.game.fail(client);
    } else if (target) {
      const s = this.game.cur(),
        slow = d.kind === "ing" && (Catalog.ingredients[d.id].pour || Catalog.ingredients[d.id].shake);
      if (slow && s && s.a === "put" && s.ing === d.id && s.st === target.dataset.drop) {
        this.game.view.wrong($("ckNow"));
        this.game.view.progress();
      } else if (d.kind === "ing") this.game.doPut(d.id, target.dataset.drop, target);
      else this.game.doMove(d.id, target.dataset.drop, target);
    }
  }
}
