class WhereWordGame extends Game {
  static ROUND_TIME = 60;
  static FULL_TIME = 5;
  static LATE_TIME = 10;
  static MAX_POINTS = 100;
  static MIN_POINTS = 10;
  static NEXT_DELAY = 1300;
  static REVEAL_DELAY = 2200;

  constructor() {
    super({
      id: "whereword",
      record: { key: "whereword_best", unit: "points" },
      name: "WhereWord",
      tag: "Trouve le mot caché dans une page Wikipédia avant la fin de la minute",
      art: '<svg viewBox="0 0 80 60" style="height:1em" fill="none" stroke-linecap="round"><g stroke="currentColor" stroke-width="4" opacity=".35"><path d="M6 12h46M6 24h30M6 36h42M6 48h24"/></g><rect x="38" y="17" width="26" height="14" rx="4" fill="#ffc83d" opacity=".9"/><circle cx="51" cy="24" r="13" stroke="#2f9be0" stroke-width="5"/><path d="M61 34l13 13" stroke="#2f9be0" stroke-width="7"/></svg>',
      help: {
        goal: "Trouve le mot demandé dans un vrai article Wikipédia, le plus vite possible.",
        controls: [
          ["Clic", "Sur le mot demandé (n'importe laquelle de ses apparitions)"],
          ["Molette", "Fait défiler l'article"],
          ["Entrée", "Rejoue à la fin"],
        ],
        rules: [
          "60 secondes par page ; trouver le mot fait passer à la page suivante.",
          "100 points dans les 5 premières secondes, puis de moins en moins jusqu'à 10.",
          "Le nombre d'apparitions du mot est donné comme indice.",
          "Un mauvais clic ne coûte rien.",
          "La recherche du navigateur (Ctrl+F) est bloquée.",
        ],
      },
    });
    this.source = new ArticleSource();
    this.page = $("wwPage");
    this.articleEl = $("wwArticle");
    this.article = null;
    this.text = null;
    this.target = null;
    this.state = "idle";
    this.score = 0;
    this.found = 0;
    this.elapsed = 0;
    this.shownSecond = -1;
    this.shownWorth = -1;
    this.run = 0;
    this.raf = 0;
    this.last = 0;
    this.timers = [];
    this.bind();
  }

  bind() {
    this.articleEl.addEventListener("click", (e) => {
      const word = e.target.closest(".ww-w");
      if (word) this.pick(word);
    });
    window.addEventListener(
      "keydown",
      (e) => {
        if (!this.raf) return;
        if (e.key === "Escape" || WhereWordGame.isFindKey(e)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        if (e.key !== "Enter" || this.state !== "over") return;
        e.preventDefault();
        this.restart();
      },
      true,
    );
    $("wwRestart").addEventListener("click", () => this.restart());
    $("wwAgain").addEventListener("click", () => this.restart());
    $("wwMenu").addEventListener("click", () => app.launcher.backToMenu());
  }

  static isFindKey(e) {
    const key = (e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && (key === "f" || key === "g")) return true;
    if (e.key === "F3") return true;
    return !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === "/" || e.key === "'");
  }

  later(fn, ms) {
    const run = this.run;
    this.timers.push(
      setTimeout(() => {
        if (run === this.run) fn();
      }, ms),
    );
  }

  stopTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  worth() {
    const { ROUND_TIME, FULL_TIME, MAX_POINTS, MIN_POINTS } = WhereWordGame,
      lateness = Math.max(0, this.elapsed - FULL_TIME) / (ROUND_TIME - FULL_TIME);
    return Math.max(MIN_POINTS, Math.round(MAX_POINTS - (MAX_POINTS - MIN_POINTS) * lateness));
  }

  showWorth() {
    const worth = this.worth();
    if (worth === this.shownWorth) return;
    this.shownWorth = worth;
    $("wwWorth").textContent = `${worth} points`;
  }

  hud() {
    $("wwScore").textContent = this.score;
    $("wwFound").textContent = this.found;
  }

  restart() {
    this.run++;
    this.stopTimers();
    this.score = 0;
    this.found = 0;
    $("wwOver").classList.remove("show");
    this.hud();
    this.loadNext();
  }

  async loadNext() {
    const run = this.run;
    this.state = "loading";
    this.target = null;
    $("wwTarget").textContent = "…";
    $("wwInfo").textContent = "";
    $("wwGain").textContent = "";
    $("wwWorth").classList.remove("on");
    this.showTime(WhereWordGame.ROUND_TIME);
    this.drainBar(false);
    this.articleEl.innerHTML = '<p class="ww-status">Recherche d\'une page Wikipédia…</p>';
    const article = await this.source.next();
    if (run === this.run) this.show(article);
  }

  show(article) {
    this.article = article;
    this.text = new HuntText(article.blocks);
    this.target = this.text.pickTarget();
    this.articleEl.innerHTML = this.articleHtml();
    this.page.scrollTop = 0;
    this.elapsed = 0;
    this.state = "hunt";
    this.drainBar(true);
    $("wwTarget").textContent = this.target.label;
    $("wwInfo").textContent = `${this.target.count} fois dans la page`;
    this.shownWorth = -1;
    this.showWorth();
    $("wwWorth").classList.add("on");
    Sfx.play("paper");
  }

  articleHtml() {
    const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const notice = this.article.offline
      ? `<p class="ww-offline">Wikipédia injoignable (${escape(this.article.error)}) : textes de secours</p>`
      : "";
    const body = this.text.blocks
      .map((block) => {
        const inner = block.parts.map((part) => (part.key ? `<span class="ww-w" data-k="${part.key}" data-t="${escape(part.text)}"></span>` : escape(part.text))).join("");
        return block.heading ? `<h3>${inner}</h3>` : `<p>${inner}</p>`;
      })
      .join("");
    return `${notice}<h2 class="ww-title" data-t="${escape(this.article.title)}"></h2>${body}`;
  }

  pick(word) {
    if (this.state !== "hunt") return;
    if (word.dataset.k === this.target.key) this.win(word);
    else this.miss(word);
  }

  win(word) {
    this.state = "won";
    const gain = this.worth();
    this.score += gain;
    this.found++;
    word.classList.add("ww-found");
    $("wwBar").style.animationPlayState = "paused";
    $("wwGain").textContent = `+${gain}`;
    $("wwWorth").classList.remove("on");
    Sfx.play(gain === WhereWordGame.MAX_POINTS ? "win" : "ding");
    this.hud();
    this.later(() => this.loadNext(), WhereWordGame.NEXT_DELAY);
  }

  miss(word) {
    word.classList.remove("ww-miss");
    void word.offsetWidth;
    word.classList.add("ww-miss");
    Sfx.play("bad");
  }

  timeUp() {
    this.state = "over";
    $("wwWorth").classList.remove("on");
    const spots = this.articleEl.querySelectorAll(`[data-k="${this.target.key}"]`);
    spots.forEach((spot) => spot.classList.add("ww-reveal"));
    if (spots[0]) spots[0].scrollIntoView({ block: "center", behavior: "smooth" });
    Sfx.play("lose");
    this.later(() => this.end(), WhereWordGame.REVEAL_DELAY);
  }

  end() {
    const best = +Store.read("whereword_best", 0) || 0;
    $("wwFinal").textContent = this.score;
    $("wwAnswer").textContent = `Le mot était « ${this.target.label} » · ${this.found} page${this.found > 1 ? "s" : ""} trouvée${this.found > 1 ? "s" : ""}`;
    if (this.score > best) {
      Store.write("whereword_best", this.score);
      $("wwRecord").textContent = best ? `Nouveau record ! (ancien : ${best})` : "Premier score enregistré.";
    } else $("wwRecord").textContent = `Ton record : ${best}`;
    const link = $("wwLink");
    link.hidden = !this.article.url;
    if (this.article.url) link.href = this.article.url;
    $("wwOver").classList.add("show");
  }

  showTime(left) {
    const second = Math.ceil(left);
    if (second === this.shownSecond) return;
    this.shownSecond = second;
    $("wwTime").textContent = second;
    $("wwBar").classList.toggle("ww-late", second <= WhereWordGame.LATE_TIME);
  }

  drainBar(running) {
    const bar = $("wwBar");
    bar.classList.remove("ww-run");
    bar.style.animationPlayState = "";
    if (!running) return;
    void bar.offsetWidth;
    bar.style.animationDuration = WhereWordGame.ROUND_TIME + "s";
    bar.classList.add("ww-run");
  }

  frame(now) {
    const dt = Math.min(now - this.last, 100) / 1000;
    this.last = now;
    if (this.state === "hunt") {
      this.elapsed += dt;
      this.showTime(Math.max(0, WhereWordGame.ROUND_TIME - this.elapsed));
      this.showWorth();
      if (this.elapsed >= WhereWordGame.ROUND_TIME) this.timeUp();
    }
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  open() {
    this.restart();
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  close() {
    this.run++;
    this.stopTimers();
    this.state = "idle";
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
}
