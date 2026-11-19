class HorseringGame extends Game {
  static TOTAL_KEY = "horsering_total";
  static SMALL_QUERY = "(max-width: 720px), (max-height: 359px), (orientation: portrait) and (pointer: coarse)";
  static POINTS_KEY = "horsering_points";
  static TASK_POINTS = 50;
  static PERFECT_BONUS = 100;
  static UNICORN_FACTOR = 2;
  static TWINKLES = 8;
  static GAIN_MS = 1200;
  static FX_EVERY = 0.07;
  static SOUND_EVERY = 0.16;
  static HINT_AFTER = 260;
  static HINT_HOLD = 1.2;
  static HINT_GAP = 2.5;
  static MOOD_TIME = 1.6;
  static BLISS_TIME = 1.4;
  static TAP_SLACK = 10;
  static CLICKS_BEFORE_HINT = 3;
  static MOUTH = { x: 64, y: 160, r: 60 };
  static IDLE_MIN = 4;
  static IDLE_SPREAD = 4;
  static SWISH_TIME = 1;
  static FINISH_DELAY = 1600;
  static FINISH_SPARKLES = 14;
  static STEP_SPARKLES = 3;
  static LEAVE_MS = 700;
  static CUDDLES = ["hand", "mitt"];
  static SHAPES = ["#hrBody", "#hrNeck", "#hrHead", "#hrCheek"];
  static PRAISE = ["Bravo !", "Super !", "Il adore !", "Parfait !", "Génial !"];
  static MOTION_WORDS = {
    circle: "fais des ronds",
    right: "vers la queue →",
    down: "de haut en bas",
    up: "vers le haut",
    rub: "frotte",
    hold: "garde appuyé",
    tap: "clique dessus",
    feed: "clique sur sa bouche",
  };
  static FED = {
    bucket: "Glou glou !",
    hay: "Miam, du foin !",
    pellets: "Crounch crounch !",
    carrot: "Croc, une carotte !",
    apple: "Miam, une pomme !",
    sugar: "Un bisou tout doux !",
  };

  constructor() {
    super({
      id: "horsering",
      name: "Horsering",
      tag: "Prends soin des chevaux du ranch : pansage, bain, sabots, repas et câlins",
      art: '<svg viewBox="0 0 64 64" style="height:1em"><path d="M14 56C6 44 4 32 8 22C12 12 22 6 32 6s20 6 24 16c4 10 2 22-6 34" fill="none" stroke="#5e3a18" stroke-width="15" stroke-linecap="round"/><path d="M14 56C6 44 4 32 8 22C12 12 22 6 32 6s20 6 24 16c4 10 2 22-6 34" fill="none" stroke="#e0a43a" stroke-width="10" stroke-linecap="round"/><g fill="#5e3a18"><circle cx="10" cy="38" r="1.800"/><circle cx="13" cy="22" r="1.800"/><circle cx="24" cy="11" r="1.800"/><circle cx="40" cy="11" r="1.800"/><circle cx="51" cy="22" r="1.800"/><circle cx="54" cy="38" r="1.800"/></g></svg>',
      help: {
        goal: "Aide Carla, la cow-girl du ranch : un cheval arrive tout sale, soigne-le étape par étape jusqu'à 100 % pour gagner des points.",
        controls: [
          ["Outil entouré de bleu", "C'est l'outil à prendre ; la ligne du haut montre tous les outils du soin dans l'ordre"],
          ["Bulle verte sur le cheval", "Quand l'outil est en main : c'est là qu'il faut l'utiliser"],
          ["Glisser sur le cheval", "Utilise l'outil : ronds, vers la queue, de haut en bas…"],
          ["Garder appuyé", "Jet d'eau et sprays"],
          ["Clic sur un sabot", "Soulève le pied et montre le dessous"],
          ["Clic sur la bouche", "Donne à boire ou à manger"],
        ],
        rules: [
          "Chaque soin se fait dans l'ordre, comme en vrai : étrille, brosse dure puis brosse douce ; bain, rinçage et séchage ; cure-pied du talon vers la pince…",
          "Chaque soin fini rapporte des points, et le cheval soigné à 100 % donne un bonus.",
          "Chaque cheval est différent : robe, crins, saletés. Une licorne très rare peut arriver, et elle rapporte double.",
          "Plus tu soignes de chevaux, plus ils arrivent avec de soucis.",
        ],
      },
    });
    this.models = new HorseModels();
    this.horse = null;
    this.tool = "";
    this.helped = 0;
    this.total = +Store.read(HorseringGame.TOTAL_KEY, 0) || 0;
    this.points = +Store.read(HorseringGame.POINTS_KEY, 0) || 0;
    this.raf = 0;
    this.last = 0;
    this.clock = 0;
    this.fxAt = 0;
    this.soundAt = 0;
    this.hintAt = -HorseringGame.HINT_GAP;
    this.wasted = 0;
    this.moodLeft = 0;
    this.blissLeft = 0;
    this.chewLeft = 0;
    this.idleIn = HorseringGame.IDLE_MIN;
    this.swishLeft = 0;
    this.lifted = -1;
    this.finished = false;
    this.leaving = false;
    this.focused = null;
    this.area = $("hrArea");
    this.stage = new CareSurface($("hrStage"), HorseArt.W, HorseArt.H);
    this.hoof = new CareSurface($("hrHoofStage"), HoofArt.W, HoofArt.H);
    this.pointer = new GroomPointer(this, this.area, $("hrCursor"));
    this.pointer.watch(this.stage);
    this.pointer.watch(this.hoof);
    this.kit = new RanchKit($("hrTabs"), $("hrTools"), (id) => this.pick(id));
    this.book = new CareBook($("hrTasks"), (index) => this.focus(this.horse.tasks[index]));
    this.guide = new CareGuide($("hrGuide"), this.area, (id) => this.pick(id));
    this.held = false;
    this.small = matchMedia(HorseringGame.SMALL_QUERY);
    this.small.addEventListener("change", () => this.fit());
    $("hrSmallMenu").addEventListener("click", () => app.launcher.backToMenu());
    $("hrCowgirl").innerHTML = Cowgirl.svg();
    $("hrSpeaker").textContent = Cowgirl.NAME;
    $("hrLiftClose").addEventListener("click", () => this.lowerHoof());
    $("hrNext").addEventListener("click", () => this.nextHorse());
    $("hrAgain").addEventListener("click", () => this.nextHorse());
    $("hrStay").addEventListener("click", () => this.hideCard());
    this.showCounts();
  }

  open() {
    if (!this.horse) this.newHorse();
    this.fit();
    if (!this.small.matches) this.resume();
  }

  fit() {
    const small = this.small.matches;
    $("horsering").classList.toggle("hr-too-small", small);
    if (small) return this.pause();
    if (!this.raf && $("horsering").classList.contains("active") && app.help.game !== this) this.resume();
  }

  close() {
    this.pause();
  }

  pause() {
    this.pointer.release();
    Sfx.loop("pour", false);
    return super.pause();
  }

  frame(time) {
    const dt = Math.min(0.05, (time - this.last) / 1000);
    this.last = time;
    this.clock += dt;
    this.update(dt);
    this.raf = requestAnimationFrame((next) => this.frame(next));
  }

  update(dt) {
    const active = this.pointer.holding();
    if (active && this.tool) this.hold(active, dt);
    this.tickMoods(dt);
    this.tickIdle(dt);
    this.guide.tick(dt, this.held);
  }

  newHorse() {
    const model = this.models.next();
    this.horse = { model, tasks: CareTasks.build(this.helped), startedAt: this.clock, earned: 0 };
    this.finished = false;
    this.leaving = false;
    this.focused = null;
    this.lowerHoof();
    this.stage.mount("horse", HorseArt.svg(model), true);
    this.horseSvg = this.stage.svg;
    this.ribs = this.horseSvg.querySelector(".hr-ribs");
    this.shapes = HorseringGame.SHAPES.map((selector) => this.horseSvg.querySelector(selector));
    this.stage.show(this.horse.tasks);
    this.book.show(this.horse.tasks, this.readyForFinal());
    this.refreshHorse();
    if (model.unicorn) this.twinkle();
    this.updateGuide();
    $("hrName").textContent = model.name;
    $("hrRare").hidden = !model.unicorn;
    this.walk("hr-arrive");
    this.say(model.unicorn ? `Une licorne ! Voici ${model.name} !` : `Voici ${model.name} !`, "happy");
    Sfx.play(model.unicorn ? "hoopLights" : "horseNeigh");
  }

  twinkle() {
    for (let i = 0; i < HorseringGame.TWINKLES; i++) {
      const star = document.createElement("i");
      star.className = "hr-twinkle";
      star.style.animationDelay = `${(-Math.random() * 2).toFixed(2)}s`;
      this.stage.place(star, 60 + Math.random() * (HorseArt.W - 120), 30 + Math.random() * (HorseArt.H - 120));
      this.stage.fx.append(star);
    }
  }

  nextHorse() {
    if (this.leaving) return;
    this.leaving = true;
    this.hideCard();
    this.walk("hr-leave");
    setTimeout(() => this.newHorse(), HorseringGame.LEAVE_MS);
  }

  walk(kind) {
    const element = this.stage.element;
    element.classList.remove("hr-arrive", "hr-leave");
    void element.offsetWidth;
    element.classList.add(kind);
    Sfx.play("horseWalk");
  }

  pick(id) {
    this.tool = id;
    this.kit.select(id);
    $("hrCursorTool").innerHTML = id ? HorseTools.icon(HorseTools.get(id)) : "";
    this.wasted = 0;
    this.updateGuide();
    Sfx.play(id ? "select" : "click");
  }

  focus(task) {
    this.focused = task;
    this.book.focus(task);
    this.updateGuide();
    if (task.done) return this.say("Déjà fait !", "happy");
    if (task.spec.final && !this.readyForFinal()) return this.say("Ça, c'est pour la fin !");
    this.kit.suggest(task.spec.steps[CareBook.stage(task)].tool);
    this.stage.ring(task.points);
    if (task.spec.hooves && this.lifted < 0) this.showHoofBadges(task);
  }

  readyForFinal() {
    return this.horse.tasks.every((task) => task.done || task.spec.final);
  }

  activeSurface(surface) {
    return surface === this.hoof ? this.lifted >= 0 : this.lifted < 0;
  }

  press(surface, local) {
    if (!this.activeSurface(surface)) return;
    this.area.classList.add("hr-pressing");
    if (!this.tool) {
      this.guide.flash();
      return this.say("Choisis un outil !");
    }
    const tool = HorseTools.get(this.tool);
    if (tool.feed !== undefined) return this.feed(surface, local, tool);
    const result = this.work(surface, local, { tap: 1 });
    if (result.used) return this.effects(surface, local, tool, true);
    if (result.tooEarly || result.wrongTool || result.wrongMotion) this.waste(HorseringGame.HINT_AFTER / HorseringGame.CLICKS_BEFORE_HINT, result);
  }

  stroke(surface, local, amounts) {
    if (!this.activeSurface(surface) || !this.tool) return;
    const tool = HorseTools.get(this.tool);
    if (tool.feed !== undefined) return;
    const result = this.work(surface, local, amounts);
    const cuddle = HorseringGame.CUDDLES.includes(tool.id);
    if (result.used || (cuddle && surface === this.stage && this.onHorse(local))) {
      this.wasted = 0;
      this.effects(surface, local, tool, false);
      if (cuddle) this.cuddle();
      return;
    }
    if (result.tooEarly || result.wrongTool || result.wrongMotion) this.waste(amounts.rub, result);
  }

  onHorse(local) {
    const point = new DOMPoint(local.x, local.y);
    return this.shapes.some((shape) => shape.isPointInFill(point));
  }

  cuddle() {
    const calm = this.blissLeft > 0;
    this.blissLeft = HorseringGame.BLISS_TIME;
    if (!calm) this.refreshHorse();
  }

  hold(active, dt) {
    const surface = active.surface;
    if (!this.activeSurface(surface)) return;
    const tool = HorseTools.get(this.tool);
    if (tool.feed !== undefined) return;
    const result = this.work(surface, active.local, { hold: dt });
    const spray = ["mist", "water", "sparkle"].includes(tool.fx);
    if (spray) {
      if (tool.id === "hose") Sfx.loop("pour", true);
      this.effects(surface, active.local, tool, false);
    }
    if (result.used) this.wasted = 0;
    else if (spray && (result.tooEarly || result.wrongTool || result.wrongMotion)) this.waste(dt * HorseringGame.HINT_AFTER / HorseringGame.HINT_HOLD, result);
  }

  releaseTool() {
    this.area.classList.remove("hr-pressing");
    Sfx.loop("pour", false);
  }

  work(surface, local, amounts) {
    const result = { used: false, wrongTool: null, wrongMotion: null, tooEarly: false };
    const ready = this.readyForFinal();
    for (const task of this.horse.tasks) {
      if (task.done) continue;
      for (const point of task.points) {
        if (point.surface !== surface.key) continue;
        const step = task.spec.steps[point.stage];
        if (!step || !this.reaches(local, point, amounts)) continue;
        const rightTool = [].concat(step.tool).includes(this.tool);
        if (task.spec.final && !ready) {
          result.tooEarly = result.tooEarly || rightTool;
          continue;
        }
        if (!rightTool) {
          result.wrongTool = result.wrongTool || step;
          continue;
        }
        const amount = amounts[step.motion] || 0;
        if (!amount) {
          result.wrongMotion = result.wrongMotion || step;
          continue;
        }
        result.used = true;
        this.advance(surface, task, point, amount / CareTasks.need(step, point));
      }
    }
    return result;
  }

  reaches(local, point, amounts) {
    const reach = point.r + (amounts.tap || amounts.feed ? HorseringGame.TAP_SLACK : HorseTools.get(this.tool).reach);
    const dx = local.x - point.x;
    const dy = local.y - point.y;
    return dx * dx + dy * dy <= reach * reach;
  }

  advance(surface, task, point, delta) {
    point.progress += delta;
    if (point.progress >= 1) {
      point.progress = 0;
      point.stage++;
      surface.burst("sparkle", point.x, point.y, HorseringGame.STEP_SPARKLES);
      Sfx.play("horseStep");
      this.updateGuide();
    }
    surface.refresh(task, point);
    if (task.kind === "thin") this.refreshHorse();
    if (point.stage >= task.spec.steps.length && task.points.every((other) => other.stage >= task.spec.steps.length)) this.complete(task);
    else this.book.update(task, this.readyForFinal());
  }

  complete(task) {
    task.done = true;
    this.earn(HorseringGame.TASK_POINTS, task.points[0]);
    const ready = this.readyForFinal();
    for (const other of this.horse.tasks) this.book.update(other, ready);
    if (this.focused === task) this.stage.ring([]);
    this.refreshHorse();
    Sfx.play("ding");
    if (this.horse.tasks.every((other) => other.done)) return this.finish();
    this.updateGuide();
    if (ready && !task.spec.final) return this.say("Tout est propre ! La touche finale !", "happy");
    this.say(HorseringGame.PRAISE[Math.floor(Math.random() * HorseringGame.PRAISE.length)], "happy");
  }

  waste(amount, result) {
    this.wasted += amount;
    if (this.wasted < HorseringGame.HINT_AFTER || this.clock - this.hintAt < HorseringGame.HINT_GAP) return;
    this.wasted = 0;
    this.guide.flash();
    if (result.tooEarly) return this.say("Ça, c'est pour la fin !", "oops");
    if (result.wrongMotion) return this.say(`Pas comme ça : ${HorseringGame.MOTION_WORDS[result.wrongMotion.motion]} !`, "oops");
    this.say(`Ici, prends : ${HorseTools.get([].concat(result.wrongTool.tool)[0]).name} !`, "oops");
  }

  effects(surface, local, tool, always) {
    if (always || this.clock - this.fxAt > HorseringGame.FX_EVERY) {
      this.fxAt = this.clock;
      surface.burst(tool.fx, local.x, local.y);
    }
    if (tool.id !== "hose" && (always || this.clock - this.soundAt > HorseringGame.SOUND_EVERY)) {
      this.soundAt = this.clock;
      Sfx.play(tool.sound);
    }
  }

  feed(surface, local, tool) {
    const mouth = HorseringGame.MOUTH;
    if (surface !== this.stage || Math.hypot(local.x - mouth.x, local.y - mouth.y) > mouth.r) return this.say("Clique sur sa bouche !");
    if (this.chewLeft > 0) return this.say("Il mâche encore…");
    const thin = this.horse.tasks.find((task) => task.kind === "thin" && !task.done);
    if (thin && thin.points[0].stage === 0 && tool.id !== "bucket" && tool.id !== "sugar") return this.say("D'abord le seau d'eau !", "oops");
    this.work(surface, local, { feed: tool.feed || 0 });
    this.chewLeft = tool.chew;
    if (tool.id === "sugar") this.blissLeft = HorseringGame.BLISS_TIME;
    this.refreshHorse();
    this.effects(surface, mouth, tool, true);
    if (tool.id !== "bucket") surface.burst("chew", mouth.x, mouth.y, 2);
    surface.burst("hearts", mouth.x + mouth.r / 2, mouth.y - mouth.r / 2);
    this.say(HorseringGame.FED[tool.id], "happy");
  }

  liftHoof(index) {
    if (this.lifted >= 0) return;
    this.lifted = index;
    this.stage.ring([]);
    $("hrLiftTitle").textContent = `${HorseArt.LEGS[index].name} de ${this.horse.model.name}`;
    $("hrLift").classList.add("show");
    this.hoof.mount("hoof" + index, HoofArt.svg(this.horse.model), false);
    this.hoof.show(this.horse.tasks);
    if (this.focused) this.hoof.ring(this.focused.points);
    const pending = this.horse.tasks.some((task) => !task.done && task.points.some((point) => point.surface === this.hoof.key));
    this.say(pending ? `${this.horse.model.name} te donne son pied !` : "Ce sabot est propre !");
    this.updateGuide();
    Sfx.play("horseHoof");
  }

  lowerHoof() {
    if (this.lifted < 0) return;
    this.lifted = -1;
    this.pointer.release();
    $("hrLift").classList.remove("show");
    this.refreshHorse();
    if (this.focused) this.stage.ring(this.focused.points);
    this.updateGuide();
    Sfx.play("horseHoof");
  }

  updateGuide() {
    const surface = this.lifted >= 0 ? this.hoof : this.stage;
    const target = this.target();
    this.held = !!target && target.tools.includes(this.tool);
    if (this.guide.show(target, surface, this.held) && target && target.tool && !this.held) this.kit.suggest(target.tool);
  }

  target() {
    if (this.finished) return { tool: "hand", tools: ["hand", "mitt", "sugar"], text: "Bravo ! Un câlin ?", where: "Câlin", x: 200, y: 150 };
    const ready = this.readyForFinal();
    const open = this.horse.tasks.filter((task) => !task.done && (!task.spec.final || ready));
    const tasks = this.focused && open.includes(this.focused) ? [this.focused, ...open] : open;
    const key = this.lifted >= 0 ? "hoof" + this.lifted : "";
    for (const task of tasks) {
      const stage = CareBook.stage(task);
      if (stage >= task.spec.steps.length) continue;
      const point = task.points.find((candidate) => candidate.stage === stage && (!key || candidate.surface === key))
        || (key && task.points.find((candidate) => candidate.surface === key && candidate.stage < task.spec.steps.length));
      if (!point) continue;
      const step = task.spec.steps[point.stage];
      const tools = [].concat(step.tool);
      const chain = task.spec.steps.map((other, index) => ({ tool: [].concat(other.tool)[0], state: index < stage ? "done" : index === stage ? "now" : "next" }));
      const guide = { tool: tools[0], tools, text: tools.map((id) => HorseTools.get(id).name).join(", "), chain };
      if (point.surface === "horse" || point.surface === key) return { ...guide, where: step.motion === "feed" ? "Sa bouche" : "Ici", x: point.x, y: point.y };
      const leg = HorseArt.LEGS[+point.surface.slice(4)];
      return { ...guide, where: "Ce sabot", x: leg.hoofX, y: HorseArt.GROUND - 6 };
    }
    return key ? { tool: "", tools: [], text: "Sabot propre : repose le pied" } : null;
  }

  earn(amount, point) {
    const gained = amount * (this.horse.model.unicorn ? HorseringGame.UNICORN_FACTOR : 1);
    this.horse.earned += gained;
    this.points += gained;
    Store.write(HorseringGame.POINTS_KEY, this.points);
    this.showCounts();
    const surface = point && point.surface === this.hoof.key && this.lifted >= 0 ? this.hoof : this.stage;
    const where = point && point.surface === surface.key ? point : { x: HorseArt.W / 2, y: HorseArt.H / 3 };
    const label = document.createElement("i");
    label.className = "hr-gain";
    label.textContent = `+${gained}`;
    surface.place(label, where.x, where.y);
    surface.fx.append(label);
    setTimeout(() => label.remove(), HorseringGame.GAIN_MS);
  }

  refreshHorse() {
    const svg = this.horseSvg;
    const tasks = this.horse.tasks;
    const open = (kind) => tasks.some((task) => task.kind === kind && !task.done);
    const thin = tasks.find((task) => task.kind === "thin");
    this.ribs.setAttribute("opacity", thin ? (1 - CareBook.fraction(thin)).toFixed(2) : "0");
    svg.classList.toggle("hr-sad", open("sad") && this.blissLeft <= 0);
    svg.classList.toggle("hr-bliss", this.blissLeft > 0);
    svg.classList.toggle("hr-chew", this.chewLeft > 0);
    svg.classList.toggle("hr-happy", this.finished);
    svg.classList.toggle("hr-glossy", tasks.some((task) => task.kind === "shine" && task.done));
    const cleaning = tasks.find((task) => task.kind === "hooves");
    for (const hoof of svg.querySelectorAll(".hr-hoof")) {
      const key = "hoof" + hoof.dataset.hoof;
      const here = (task) => task.points.filter((point) => point.surface === key);
      const mine = cleaning ? here(cleaning) : [];
      hoof.classList.toggle("alert", tasks.some((task) => !task.done && here(task).length > 0));
      hoof.classList.toggle("dirty", mine.some((point) => point.stage === 0));
      hoof.classList.toggle("oiled", mine.some((point) => point.stage >= cleaning.spec.steps.length));
    }
  }

  showHoofBadges(task) {
    const hooves = new Set(task.points.filter((point) => point.stage < task.spec.steps.length).map((point) => point.surface));
    this.stage.ring(
      [...hooves].map((key) => {
        const leg = HorseArt.LEGS[+key.slice(4)];
        return { surface: "horse", x: leg.hoofX, y: HorseArt.GROUND + 6, r: 26 };
      }),
    );
  }

  tickMoods(dt) {
    let changed = false;
    if (this.moodLeft > 0 && (this.moodLeft -= dt) <= 0) $("hrCowgirl").dataset.mood = "";
    if (this.blissLeft > 0 && (this.blissLeft -= dt) <= 0) changed = true;
    if (this.chewLeft > 0 && (this.chewLeft -= dt) <= 0) changed = true;
    if (changed) this.refreshHorse();
  }

  tickIdle(dt) {
    if (this.swishLeft > 0 && (this.swishLeft -= dt) <= 0) this.horseSvg.classList.remove("hr-swish");
    if ((this.idleIn -= dt) > 0) return;
    this.idleIn = HorseringGame.IDLE_MIN + Math.random() * HorseringGame.IDLE_SPREAD;
    this.swishLeft = HorseringGame.SWISH_TIME;
    this.horseSvg.classList.add("hr-swish");
    if (Math.random() < 0.3) Sfx.play("horseSnort");
  }

  say(text, mood = "") {
    this.hintAt = this.clock;
    const bubble = $("hrBubble");
    $("hrSay").textContent = text;
    bubble.classList.remove("pop");
    void bubble.offsetWidth;
    bubble.classList.add("pop");
    $("hrCowgirl").dataset.mood = mood;
    this.moodLeft = mood ? HorseringGame.MOOD_TIME : 0;
  }

  finish() {
    this.finished = true;
    this.pointer.release();
    this.lowerHoof();
    this.helped++;
    this.total++;
    this.earn(HorseringGame.PERFECT_BONUS, null);
    this.updateGuide();
    Store.write(HorseringGame.TOTAL_KEY, this.total);
    this.showCounts();
    this.refreshHorse();
    this.stage.burst("sparkle", HorseArt.W / 2, HorseArt.H / 2, HorseringGame.FINISH_SPARKLES);
    const model = this.horse.model;
    this.say(`${model.name} est ${model.mare ? "parfaite" : "parfait"} : 100 % !`, "happy");
    Sfx.play("win");
    Sfx.play("horseNeigh");
    const seconds = Math.round(this.clock - this.horse.startedAt);
    $("hrCardName").textContent = `${model.name} est ${model.mare ? "toute belle" : "tout beau"} !`;
    $("hrCardTime").textContent = `${Math.floor(seconds / 60)} min ${String(seconds % 60).padStart(2, "0")} s`;
    $("hrCardPoints").textContent = `+${this.horse.earned}`;
    setTimeout(() => {
      if (this.finished && this.horse && $("horsering").classList.contains("active")) $("hrCard").classList.add("show");
    }, HorseringGame.FINISH_DELAY);
  }

  hideCard() {
    $("hrCard").classList.remove("show");
  }

  showCounts() {
    $("hrPoints").textContent = this.points;
    $("hrTotal").textContent = this.total;
  }
}
