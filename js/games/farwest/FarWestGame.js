class FarWestGame extends Game {
  static TARGET = 3;
  static LEAD = 2;
  static MAX_STARS = 5;
  static INTRO_TIME = 1.6;
  static MIN_DELAY = 1.5;
  static MAX_DELAY = 4;
  static GRACE = 0.5;
  static NO_SHOT = 5;
  static RESULT_TIME = 3;
  static START_DELAY = 1.2;
  static RESTART_DELAY = 0.5;
  static BEAT = 0.75;
  static BEST_KEY = "farwest_best";
  static WINS_KEY = "farwest_wins";
  static KEYS = { q: "me", m: "foe" };
  static PLAYERS = { me: "Joueur 1", foe: "Joueur 2" };

  static seconds(r) {
    return r.toFixed(3).replace(".", ",") + " s";
  }

  constructor() {
    super({
      id: "farwest",
      name: "FarWest",
      tag: "Duel de cowboys en ligne : dégaine le plus vite au signal",
      art: '<svg viewBox="0 0 64 52" style="height:1em"><path d="M4 30c8 3 48 3 56 0-6 6-50 6-56 0z" fill="#a8743f"/><path d="M18 30c0-14 4-22 8-22 3 0 4 3 6 3s3-3 6-3c4 0 8 8 8 22z" fill="#c88a4a"/><path d="M18 26h28v4H18z" fill="#e5484d"/><path d="M22 40h26v5H22zM16 38h10v10l-6 2z" fill="currentColor"/></svg>',
      record: { key: FarWestGame.BEST_KEY, label: "Meilleur réflexe", short: "Réflexe", unit: "ms" },
      help: {
        goal: "Un duel de cowboys en ligne : au signal « FEU ! », dégaine et tire avant ton adversaire.",
        controls: [
          ["Créer un salon", "Donne le code de 5 caractères à ton adversaire"],
          ["Rejoindre", "Tape le code reçu puis valide"],
          ["Espace, clic ou toucher l'écran", "Tirer (en ligne)"],
          ["Jouer à deux sur ce PC", "Joueur de gauche : touche Q, joueur de droite : touche M"],
        ],
        rules: [
          "Après « Attends… », le signal tombe au hasard, entre 1,5 et 4 secondes.",
          "Tirer avant le signal fait perdre la manche.",
          "Après le signal, le plus rapide gagne la manche. Ton temps de réaction est mesuré sur ton écran : la connexion ne te désavantage pas.",
          `Pour gagner le duel, il faut au moins ${FarWestGame.TARGET} manches et ${FarWestGame.LEAD} manches d'avance : tant que l'écart n'est pas de ${FarWestGame.LEAD}, le duel continue.`,
          "Chaque manche gagnée ajoute une étoile ; quand il y en a trop, la dernière étoile affiche le total.",
          "Bleu, c'est toi à gauche ; rouge, c'est ton adversaire à droite. À deux sur le même PC, la touche de chacun est affichée au-dessus de son cowboy.",
          "Ton meilleur réflexe est gardé en record.",
          "Pas de pause en ligne : le duel continue derrière cette fiche.",
        ],
      },
    });
    this.canvas = $("fwCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.scene = new FarWestScene();
    this.fx = new WestFx();
    this.hud = new WestHud();
    this.cowboys = { me: new Cowboy("me"), foe: new Cowboy("foe") };
    this.link = new DuelLink("farwest", {
      open: () => this.connected(),
      message: (data) => this.receive(data),
      closed: (reason) => this.toLobby(reason),
      failed: (reason) => this.toLobby(reason),
      route: (route) => this.lobby.route(route),
    });
    this.lobby = new DuelLobby("fw", this.link, () => this.leave());
    this.local = false;
    this.raf = 0;
    this.last = 0;
    this.bound = false;
    this.W = 0;
    this.H = 0;
    this.dpr = 1;
    this.t = 0;
    this.reset();
  }

  reset() {
    this.phase = "lobby";
    this.wins = { me: 0, foe: 0 };
    this.round = 0;
    this.roundId = 0;
    this.delay = 0;
    this.phaseT = 0;
    this.waitStart = 0;
    this.signalAt = 0;
    this.shots = { me: null, foe: null };
    this.decided = false;
    this.resultDone = false;
    this.judgeAt = 0;
    this.startIn = 0;
    this.beatIn = 0;
    this.banner = null;
    this.marks = [];
    this.best = null;
    this.again = false;
    this.foeAgain = false;
    for (const cowboy of Object.values(this.cowboys)) cowboy.reset();
    this.fx.clear();
  }

  get isHost() {
    return this.local || this.link.isHost;
  }

  startLocal() {
    this.link.leave();
    this.reset();
    this.local = true;
    this.lobby.hide();
    this.lobby.room("Local");
    this.phase = "ready";
    this.startIn = FarWestGame.START_DELAY;
    this.setBanner(null, "Duel !", "#f3dfb6");
    Sfx.play("wkJoin");
  }

  toLobby(error = "") {
    this.local = false;
    this.reset();
    $("fwOver").classList.remove("show");
    this.lobby.show(error);
  }

  leave() {
    this.link.leave();
    this.toLobby();
  }

  connected() {
    this.lobby.hide();
    this.phase = "ready";
    this.startIn = FarWestGame.START_DELAY;
    this.setBanner(null, "Duel !", "#f3dfb6");
    Sfx.play("wkJoin");
  }

  setBanner(icon, text, color, big = false) {
    this.banner = { icon, text, color, big, at: this.t };
  }

  newRound(fresh) {
    this.roundId++;
    const delay = FarWestGame.MIN_DELAY + Math.random() * (FarWestGame.MAX_DELAY - FarWestGame.MIN_DELAY);
    this.link.send({ t: "round", id: this.roundId, delay, fresh });
    this.begin(this.roundId, delay, fresh);
  }

  begin(id, delay, fresh) {
    if (fresh) {
      this.wins = { me: 0, foe: 0 };
      this.best = null;
      this.again = false;
      this.foeAgain = false;
      $("fwOver").classList.remove("show");
    }
    this.roundId = id;
    this.round = this.wins.me + this.wins.foe + 1;
    this.delay = delay;
    this.phase = "intro";
    this.phaseT = 0;
    this.shots = { me: null, foe: null };
    this.decided = false;
    this.resultDone = false;
    this.judgeAt = 0;
    this.marks = [];
    for (const cowboy of Object.values(this.cowboys)) cowboy.reset();
    this.fx.clear();
    this.setBanner(null, `Manche ${this.round}`, "#f3dfb6");
    if (document.activeElement && document.activeElement.closest("#farwest")) document.activeElement.blur();
    Sfx.play("fwRound");
  }

  startWait() {
    this.phase = "wait";
    this.phaseT = 0;
    this.waitStart = performance.now();
    this.beatIn = 0;
    this.cowboys.me.tense = true;
    this.cowboys.foe.tense = true;
    this.setBanner("wait", "Attends…", "#f3dfb6");
  }

  signal() {
    this.phase = "fire";
    this.phaseT = 0;
    this.signalAt = performance.now();
    this.cowboys.me.tense = false;
    this.cowboys.foe.tense = false;
    this.setBanner("fire", "FEU !", "#ff4d3a", true);
    this.fx.screen = { color: "#ff6a3a", alpha: 0.35 };
    Sfx.play("fwSignal");
  }

  layout() {
    const h = Math.min(this.H * 0.42, this.W * (this.H > this.W ? 0.36 : 0.26)),
      y = this.scene.groundY;
    return { h, y, me: this.W * 0.2, foe: this.W * 0.8 };
  }

  fireFx(side, early) {
    const L = this.layout(),
      shooter = this.cowboys[side],
      other = side === "me" ? "foe" : "me",
      from = shooter.tip(L[side], L.y, L.h),
      to = early ? { x: from.x + shooter.dir * this.W * 0.3, y: from.y - this.H * 0.3 } : this.cowboys[other].chest(L[other], L.y, L.h);
    shooter.fire();
    this.fx.shot(from, to, shooter.dir, L.h * 0.5);
    Sfx.play("fwBang");
  }

  shoot(side = "me") {
    if ((this.phase !== "wait" && this.phase !== "fire") || this.shots[side] !== null) return;
    const now = performance.now(),
      r = this.phase === "wait" ? (now - this.waitStart) / 1000 - this.delay : (now - this.signalAt) / 1000;
    this.shots[side] = r;
    this.fireFx(side, r < 0);
    if (!this.local) this.link.send({ t: "shot", id: this.roundId, r });
    if (this.isHost) this.judge();
  }

  judge() {
    if (this.decided) return;
    const me = this.shots.me,
      foe = this.shots.foe,
      earlyMe = me !== null && me < 0,
      earlyFoe = foe !== null && foe < 0;
    if (earlyMe && earlyFoe) this.resolve(null, "both");
    else if (earlyMe) this.resolve("foe", "early");
    else if (earlyFoe) this.resolve("me", "early");
    else if (me !== null && foe !== null) this.resolve(me < foe ? "me" : foe < me ? "foe" : null, me === foe ? "tie" : "fast");
    else if (this.local && (me !== null || foe !== null)) this.resolve(me !== null ? "me" : "foe", "fast");
    else if ((me !== null || foe !== null) && !this.judgeAt) this.judgeAt = performance.now() + FarWestGame.GRACE * 1000;
  }

  resolve(winner, why) {
    this.decided = true;
    const names = { me: "host", foe: "guest" };
    this.link.send({ t: "result", id: this.roundId, win: winner ? names[winner] : "none", why, rh: this.shots.me, rg: this.shots.foe });
    this.apply(winner, why, this.shots.me, this.shots.foe);
  }

  apply(winner, why, rMe, rFoe) {
    this.phase = "result";
    this.phaseT = 0;
    this.decided = true;
    this.judgeAt = 0;
    this.cowboys.me.tense = false;
    this.cowboys.foe.tense = false;
    const L = this.layout(),
      head = (side) => ({ x: L[side], y: L.y - L.h * 1.12 });
    if (rMe !== null && rMe >= 0) this.saveBest(rMe);
    if (this.local && rFoe !== null && rFoe >= 0) this.saveBest(rFoe);
    if (!winner) {
      const texts = { both: "Trop tôt tous les deux !", tie: "Égalité parfaite !", slow: "Personne n'a tiré" };
      this.setBanner(why === "both" ? "early" : "wait", texts[why] || "Manche rejouée", "#f3dfb6");
      if (why === "both") for (const side of ["me", "foe"]) this.marks.push({ ...head(side), icon: "early", text: "Trop tôt", color: "#ff5a4a" });
      Sfx.play("fwEarly");
      return;
    }
    const loser = winner === "me" ? "foe" : "me",
      rWin = winner === "me" ? rMe : rFoe;
    this.wins[winner]++;
    if (this.shots[winner] === null || this.shots[winner] < 0) this.fireFx(winner, false);
    this.cowboys[loser].die(L[loser], L.y, L.h);
    this.fx.hit(this.cowboys[loser].chest(L[loser], L.y, L.h), L.h * 0.5);
    this.fx.ray(L[winner], winner === "me" ? "255,215,110" : "255,120,100");
    this.marks.push({ ...head(winner), icon: "star", text: why === "fast" && rWin !== null ? FarWestGame.seconds(rWin) : "", color: WestHud.GOLD });
    if (why === "early") this.marks.push({ ...head(loser), icon: "early", text: "Trop tôt", color: "#ff5a4a" });
    if (this.local) this.setBanner("star", `${FarWestGame.PLAYERS[winner]} gagne la manche`, WestHud.GOLD);
    else this.setBanner(winner === "me" ? "star" : "skull", winner === "me" ? "Manche gagnée" : "Manche perdue", winner === "me" ? WestHud.GOLD : "#ff6b5a");
    Sfx.play("fwHit");
    Sfx.play(winner === "me" || this.local ? "fwRoundWin" : "fwRoundLose");
  }

  matchWinner() {
    const { me, foe } = this.wins;
    if (Math.max(me, foe) < FarWestGame.TARGET || Math.abs(me - foe) < FarWestGame.LEAD) return null;
    return me > foe ? "me" : "foe";
  }

  need(side) {
    const other = side === "me" ? "foe" : "me";
    return Math.max(0, Math.max(FarWestGame.TARGET, this.wins[other] + FarWestGame.LEAD) - this.wins[side]);
  }

  saveBest(r) {
    const ms = Math.round(r * 1000);
    if (this.best === null || ms < this.best) this.best = ms;
    const record = +Store.read(FarWestGame.BEST_KEY, 0) || 0;
    if (!record || ms < record) Store.write(FarWestGame.BEST_KEY, ms);
  }

  finish() {
    this.phase = "over";
    const winner = this.matchWinner(),
      won = this.local || winner === "me";
    if (winner === "me" && !this.local) Store.write(FarWestGame.WINS_KEY, (+Store.read(FarWestGame.WINS_KEY, 0) || 0) + 1);
    if (won) {
      this.fx.stars(this.W, this.H);
      this.fx.ray(this.W * 0.2, "255,215,110", 4);
      this.fx.ray(this.W * 0.5, "255,215,110", 4);
      this.fx.setMood("255,190,80", 0.18);
    } else this.fx.setMood("90,0,0", 0.55);
    this.setBanner(won ? "star" : "skull", won ? "VICTOIRE" : "DÉFAITE", won ? WestHud.GOLD : "#ff6b5a", true);
    Sfx.play(won ? "fwWin" : "fwLose");
    const card = $("fwOverCard");
    card.classList.toggle("win", won);
    card.classList.toggle("lose", !won);
    $("fwResultTitle").textContent = this.local ? `${FarWestGame.PLAYERS[winner]} gagne` : won ? "Victoire" : "Défaite";
    $("fwNameMe").textContent = this.local ? FarWestGame.PLAYERS.me : "Toi";
    $("fwNameFoe").textContent = this.local ? FarWestGame.PLAYERS.foe : "Adversaire";
    $("fwBestLabel").textContent = this.local ? "Meilleur réflexe :" : "Ton meilleur réflexe :";
    $("fwQuit").textContent = this.local ? "Quitter" : "Quitter le salon";
    $("fwScoreMe").textContent = this.wins.me;
    $("fwScoreFoe").textContent = this.wins.foe;
    $("fwBest").textContent = this.best === null ? "—" : `${this.best} ms`;
    this.note();
    $("fwOver").classList.add("show");
  }

  rematch() {
    if (this.phase !== "over" || this.again) return;
    this.again = true;
    if (this.local) this.foeAgain = true;
    this.link.send({ t: "again" });
    Sfx.play("click");
    this.note();
    this.maybeRestart();
  }

  maybeRestart() {
    if (!this.isHost || !this.again || !this.foeAgain) return;
    this.phase = "ready";
    this.startIn = FarWestGame.RESTART_DELAY;
  }

  note() {
    $("fwAgainNote").textContent =
      this.again && this.foeAgain ? "C'est reparti !" : this.again ? "En attente de ton adversaire…" : this.foeAgain ? "Ton adversaire veut sa revanche !" : "";
    $("fwAgain").disabled = this.again;
  }

  receive(data) {
    if (data.t === "round" && !this.link.isHost && Number.isFinite(data.delay)) {
      this.begin(data.id | 0, Math.max(FarWestGame.MIN_DELAY, Math.min(FarWestGame.MAX_DELAY, data.delay)), Boolean(data.fresh));
    } else if (data.t === "shot" && (data.id | 0) === this.roundId && this.shots.foe === null && Number.isFinite(data.r) && this.phase !== "result" && this.phase !== "over") {
      this.shots.foe = data.r;
      this.fireFx("foe", data.r < 0);
      if (this.link.isHost) this.judge();
    } else if (data.t === "result" && !this.link.isHost && (data.id | 0) === this.roundId && !this.decided) {
      const map = { host: "foe", guest: "me", none: null },
        num = (v) => (Number.isFinite(v) ? v : null);
      if (num(data.rh) !== null && this.shots.foe === null) this.shots.foe = data.rh;
      this.apply(map[data.win] === undefined ? null : map[data.win], String(data.why || ""), num(data.rg), num(data.rh));
    } else if (data.t === "again" && this.phase === "over") {
      this.foeAgain = true;
      this.note();
      this.maybeRestart();
    }
  }

  update(dt) {
    this.t += dt;
    this.phaseT += dt;
    const host = this.isHost,
      now = performance.now();
    if (this.phase === "ready" && host) {
      this.startIn -= dt;
      if (this.startIn <= 0) this.newRound(true);
    }
    if (this.phase === "intro" && this.phaseT >= FarWestGame.INTRO_TIME) this.startWait();
    if (this.phase === "wait") {
      this.beatIn -= dt;
      if (this.beatIn <= 0) {
        this.beatIn = FarWestGame.BEAT;
        Sfx.play("fwBeat");
      }
      if ((now - this.waitStart) / 1000 >= this.delay) this.signal();
    }
    if (host && (this.phase === "wait" || this.phase === "fire")) {
      if (this.judgeAt && now >= this.judgeAt) this.resolve(this.shots.me !== null && this.shots.me >= 0 ? "me" : "foe", "fast");
      else if (this.phase === "fire" && !this.judgeAt && this.phaseT > FarWestGame.NO_SHOT && this.shots.me === null && this.shots.foe === null) this.resolve(null, "slow");
    }
    if (this.phase === "result" && this.phaseT >= FarWestGame.RESULT_TIME && !this.resultDone) {
      this.resultDone = true;
      if (this.matchWinner()) this.finish();
      else if (host) this.newRound(false);
    }
    const floor = this.scene.groundY;
    for (const cowboy of Object.values(this.cowboys)) cowboy.update(dt, floor);
    this.scene.update(dt);
    this.fx.update(dt);
  }

  draw() {
    const ctx = this.ctx,
      W = this.W,
      H = this.H;
    if (!W) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.fx.shake > 0) ctx.translate((Math.random() - 0.5) * this.fx.shake * 14, (Math.random() - 0.5) * this.fx.shake * 10);
    this.scene.drawBack(ctx);
    this.fx.drawBack(ctx, W, H);
    const L = this.layout();
    this.scene.drawMiddle(ctx);
    for (const side of ["me", "foe"]) this.cowboys[side].render(ctx, L[side], L.y, L.h);
    this.scene.drawFront(ctx);
    this.fx.drawFront(ctx, W, H);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const showRound = ["intro", "wait", "fire", "result"].includes(this.phase),
      keys = [];
    if (this.local && ["ready", "intro", "wait", "fire"].includes(this.phase))
      for (const [letter, side] of Object.entries(FarWestGame.KEYS)) if (this.shots[side] === null) keys.push({ x: L[side], y: L.y - L.h * 1.12, letter: letter.toUpperCase(), color: WestHud.COLORS[side], hot: this.phase === "fire" });
    this.hud.draw(ctx, W, H, {
      me: { name: this.local ? "JOUEUR 1" : "TOI", wins: this.wins.me, need: this.phase === "over" ? 0 : this.need("me") },
      foe: { name: this.local ? "JOUEUR 2" : "ADVERSAIRE", wins: this.wins.foe, need: this.phase === "over" ? 0 : this.need("foe") },
      keys,
      target: FarWestGame.TARGET,
      maxStars: FarWestGame.MAX_STARS,
      round: showRound ? this.round : 0,
      marks: this.marks,
      banner: this.phase === "lobby" || this.phase === "over" ? null : this.banner && { ...this.banner, k: this.t - this.banner.at },
      t: this.t,
    });
  }

  frame(now) {
    const dt = Math.min(now - this.last, 50) / 1000;
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  resize() {
    const width = this.canvas.clientWidth,
      height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = width;
    this.H = height;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(height * this.dpr);
    this.scene.resize(width, height, this.dpr);
  }

  bind() {
    $("fwStage").addEventListener("pointerdown", (event) => {
      if (this.local || event.target.closest("button, input, .overlay.show")) return;
      if (event.button !== undefined && event.button > 0) return;
      event.preventDefault();
      this.shoot();
    });
    document.addEventListener("keydown", (event) => {
      if (!this.raf || event.repeat) return;
      if (this.local && FarWestGame.KEYS[event.key.toLowerCase()] && !event.ctrlKey && !event.altKey && !event.metaKey) {
        event.preventDefault();
        this.shoot(FarWestGame.KEYS[event.key.toLowerCase()]);
        return;
      }
      if (this.local && event.key === " ") {
        event.preventDefault();
        return;
      }
      const playing = ["intro", "wait", "fire", "result"].includes(this.phase);
      if (event.key === " " && (playing || !event.target.closest("input, button"))) {
        event.preventDefault();
        this.shoot();
      } else if (event.key === "Enter" && this.phase === "over") {
        event.preventDefault();
        this.rematch();
      }
    });
    $("fwAgain").addEventListener("click", () => this.rematch());
    $("fwLocal").addEventListener("click", () => this.startLocal());
    $("fwQuit").addEventListener("click", () => this.leave());
    window.addEventListener("pagehide", () => this.link.leave());
    new ResizeObserver(() => {
      if (this.raf) this.resize();
    }).observe(this.canvas);
    this.bound = true;
  }

  pause() {
    return false;
  }

  resume() {}

  open() {
    if (!this.bound) this.bind();
    this.toLobby();
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  close() {
    this.link.leave();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.toLobby();
  }
}
