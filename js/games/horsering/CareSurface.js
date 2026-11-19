class CareSurface {
  static MAX_PARTICLES = 50;
  static FLY_AWAY_MS = 700;
  static SVG_NS = "http://www.w3.org/2000/svg";
  static FX_LIFE = {
    crumbs: 700, dust: 900, shine: 800, hair: 700, mist: 900, sparkle: 1000, water: 700, bubbles: 1100, spark: 450, hearts: 1300, chew: 700,
  };

  constructor(element, width, height) {
    this.element = element;
    this.width = width;
    this.height = height;
    this.key = "";
    this.views = new Map();
    this.particles = 0;
    this.box = null;
  }

  mount(key, svg, clipped) {
    this.key = key;
    this.views.clear();
    this.particles = 0;
    this.element.innerHTML = `${svg}<div class="hr-fx"></div>`;
    this.svg = this.element.querySelector("svg");
    this.fx = this.element.querySelector(".hr-fx");
    this.clipLayer = this.layer(clipped ? "url(#hrClip)" : "");
    this.openLayer = this.layer("");
  }

  layer(clip) {
    const group = document.createElementNS(CareSurface.SVG_NS, "g");
    if (clip) group.setAttribute("clip-path", clip);
    this.svg.append(group);
    return group;
  }

  measure() {
    this.box = this.element.getBoundingClientRect();
  }

  toLocal(clientX, clientY) {
    if (!this.box) this.measure();
    const box = this.box;
    return {
      x: ((clientX - box.left) / box.width) * this.width,
      y: ((clientY - box.top) / box.height) * this.height,
      scale: box.width / this.width,
    };
  }

  show(tasks) {
    for (const task of tasks) for (const point of task.points) if (point.surface === this.key) this.refresh(task, point);
  }

  refresh(task, point) {
    const art = point.stage < task.spec.steps.length ? task.spec.art[point.stage] : task.spec.done;
    let view = this.views.get(point);
    if (!view || view.art !== art) {
      if (view) this.drop(view);
      view = { art, node: this.build(art, point) };
      this.views.set(point, view);
    }
    if (!view.node) return;
    const done = point.stage >= task.spec.steps.length;
    view.node.style.opacity = done ? 1 : (1 - point.progress * 0.65).toFixed(2);
  }

  drop(view) {
    if (!view.node) return;
    if (view.art !== "fly") return view.node.remove();
    view.node.classList.add("hr-gone");
    setTimeout(() => view.node.remove(), CareSurface.FLY_AWAY_MS);
  }

  build(art, point) {
    if (!art) return null;
    if (art === "fly") return this.fly(point);
    const host = SpotArt.CLIPPED.has(art) ? this.clipLayer : this.openLayer;
    const group = document.createElementNS(CareSurface.SVG_NS, "g");
    group.innerHTML = SpotArt.draw(art, point);
    host.append(group);
    return group;
  }

  fly(point) {
    const fly = document.createElement("i");
    fly.className = "hr-fly";
    this.place(fly, point.x, point.y);
    fly.style.animationDelay = `${(-point.seed * 2).toFixed(2)}s`;
    this.fx.append(fly);
    return fly;
  }

  place(element, x, y) {
    element.style.left = `${((x / this.width) * 100).toFixed(2)}%`;
    element.style.top = `${((y / this.height) * 100).toFixed(2)}%`;
  }

  burst(kind, x, y, count = 1) {
    const life = CareSurface.FX_LIFE[kind];
    if (!life) return;
    for (let i = 0; i < count && this.particles < CareSurface.MAX_PARTICLES; i++) {
      const particle = document.createElement("i");
      particle.className = `hr-p hr-p-${kind}`;
      this.place(particle, x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 24);
      particle.style.setProperty("--dx", `${Math.round((Math.random() - 0.5) * 60)}px`);
      particle.style.setProperty("--dy", `${Math.round(-10 - Math.random() * 40)}px`);
      this.fx.append(particle);
      this.particles++;
      setTimeout(() => {
        if (!particle.isConnected) return;
        particle.remove();
        this.particles--;
      }, life);
    }
  }

  ring(points) {
    for (const old of this.fx.querySelectorAll(".hr-ring")) old.remove();
    for (const point of points) {
      if (point.surface !== this.key) continue;
      const ring = document.createElement("i");
      ring.className = "hr-ring";
      this.place(ring, point.x, point.y);
      ring.style.width = `${((point.r * 2.4) / this.width) * 100}%`;
      this.fx.append(ring);
    }
  }
}
