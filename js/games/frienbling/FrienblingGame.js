class FrienblingGame extends Game {
  static PERIOD = 60000;
  static SOLO_PERIOD = 30000;
  static CLOSE_MS = 1000;
  static SPIN_MS = 7000;
  static LATE_LAND_MS = 3000;
  static SHOW_MS = 3500;
  static RESYNC_MS = 400;
  static MOOD_MS = 6000;
  static IDLE_MS = 7000;
  static START_MONEY = 100;
  static CHIPS = [1, 5, 10, 25, 100, 500];
  static CHIP_COLORS = { 1: "#eef1f5", 5: "#e5484d", 10: "#2f9be0", 25: "#1fb36b", 100: "#2a2d34", 500: "#9b5cff" };
  static NAME_MIN = 2;
  static NAME_MAX = 14;
  static HISTORY = 10;
  static MONEY_KEY = "frienbling_money";
  static NAME_KEY = "frienbling_name";
  static BEST_KEY = "frienbling_best";
  static CHIP_KEY = "frienbling_chip";
  static LAST_KEY = "frienbling_last";
  static SOLO_NAME = "Toi";
  static LEVELS = ["", "Gagné !", "Joli coup !", "Superbe !", "Incroyable !", "JACKPOT !"];
  static TOP = [4, 5, 6, 7];
  static BOTTOM = [1, 0, 2, 3];
  static CROWN = '<svg viewBox="0 0 40 28" aria-hidden="true"><path d="M3 24 1 6l10 8L20 1l9 13 10-8-2 18z" fill="#ffd34d" stroke="#9a6a00" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 24h32v3H4z" fill="#e0a800"/><circle cx="20" cy="15" r="2.6" fill="#e5484d"/><circle cx="10" cy="18" r="1.8" fill="#2f9be0"/><circle cx="30" cy="18" r="1.8" fill="#1fb36b"/></svg>';

  static euros(n) {
    return `${Math.round(n).toLocaleString("fr-FR")} €`;
  }

  static short(n) {
    if (n >= 1e6) return (Math.round(n / 1e5) / 10).toString().replace(".", ",") + "M";
    if (n >= 1e4) return Math.round(n / 1e3) + "k";
    if (n >= 1e3) return (Math.round(n / 100) / 10).toString().replace(".", ",") + "k";
    return String(n);
  }

  static sum(bets) {
    let total = 0;
    for (const amount of bets instanceof Map ? bets.values() : Object.values(bets)) total += amount;
    return total;
  }

  static entries(bets) {
    return bets instanceof Map ? [...bets.entries()] : Object.entries(bets);
  }

  static winnings(bets, n) {
    let total = 0;
    for (const [key, amount] of FrienblingGame.entries(bets)) total += RouletteRules.payout(key, amount, n);
    return total;
  }

  static level(bets, n, balance) {
    let stake = 0,
      rarity = 0;
    for (const [key, amount] of FrienblingGame.entries(bets)) {
      stake += amount;
      if (RouletteRules.payout(key, amount, n)) rarity = Math.max(rarity, RouletteRules.rarity(key));
    }
    const share = stake / Math.max(1, stake + balance),
      power = 0.5 * rarity + 0.5 * share;
    return Math.max(1, Math.min(5, Math.ceil(power * 5)));
  }

  static draw() {
    return crypto.getRandomValues(new Uint32Array(1))[0] % 37;
  }

  static cleanName(text) {
    return String(text)
      .replace(/[^\p{L}\p{N} _.'-]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, FrienblingGame.NAME_MAX);
  }

  constructor() {
    super({
      id: "frienbling",
      name: "Frienbling",
      tag: "Roulette entre amis ou en solo : mise, la bille tourne toutes les minutes",
      art: '<svg viewBox="0 0 64 64" style="height:1em"><circle cx="32" cy="32" r="29" fill="#6b3d1c"/><circle cx="32" cy="32" r="23" fill="#d42a32"/><path d="M32 9a23 23 0 0 1 16.3 6.7L32 32zM48.3 48.3A23 23 0 0 1 32 55L32 32zM9 32a23 23 0 0 1 6.7-16.3L32 32z" fill="#1b1d22"/><path d="M55 32a23 23 0 0 1-6.7 16.3L32 32z" fill="#0c8a4a"/><circle cx="32" cy="32" r="11" fill="#b8862c"/><circle cx="32" cy="32" r="5" fill="#ffe08a"/><circle cx="46" cy="17" r="3.4" fill="#fff"/></svg>',
      record: { key: FrienblingGame.BEST_KEY, label: "Plus grosse fortune", unit: "€", bar: false },
      help: {
        goal: "Une table de roulette : mise tes jetons avec les autres joueurs de la table, ou seul en solo, et fais grossir ta fortune.",
        controls: [
          ["Pseudo puis « Rejoindre une table »", "Tu rejoins une table libre (8 joueurs au plus) ; s'il n'y en a pas, une nouvelle table est créée"],
          ["« Prêt » (en ligne)", "Quand tous les joueurs de la table sont prêts, la roue se lance tout de suite sans attendre la fin de la minute"],
          ["« Jouer en solo »", "Tu joues seul contre la maison, même sans connexion Internet ; « Lancer ! » fait tourner la roue sans attendre"],
          ["Jetons sous le tapis", "Choisis la valeur du jeton : 1, 5, 10, 25, 100 ou 500 €"],
          ["Clic sur une case du tapis", "Pose un jeton sur cette case"],
          ["Clic droit sur une case", "Reprends ta mise de cette case"],
          ["Annuler / Tout retirer / Re-miser", "Retire ton dernier jeton, toutes tes mises, ou rejoue les mises du tour d'avant"],
        ],
        rules: [
          "La roue est lancée toutes les minutes (toutes les 30 secondes en solo). Les mises ferment 1 seconde avant (« Rien ne va plus »).",
          "Un numéro (plein) paie 35 fois la mise ; une douzaine ou une colonne 2 fois ; rouge, noir, pair, impair, 1-18 ou 19-36 paient 1 fois. Le 0 fait perdre toutes les chances simples.",
          "Tu commences avec 100 €. Ton argent, ton pseudo, ton jeton choisi et tes dernières mises sont gardés d'une partie à l'autre, en ligne comme en solo. Si tu n'as plus rien, la maison t'offre 100 €.",
          "Tes jetons sont gros et brillants ; ceux des autres sont plus petits, à la couleur de leur personnage.",
          "Plus ta mise gagnante était rare, et plus tu avais misé de ta fortune, plus la fête est grande.",
          "Le joueur le plus riche de la table porte la couronne.",
          "Un joueur qui n'a rien misé depuis 7 secondes ne compte plus dans le vote « Prêt » : la roue peut partir sans lui.",
          "Pas de pause : la table continue derrière cette fiche.",
        ],
      },
    });
    this.stage = $("fbStage");
    this.board = $("fbBoard");
    this.wheel = new RouletteWheel($("fbWheel"));
    this.wheel.onTick = (k) => Sfx.play("fbTick", k);
    this.fx = new TableFx($("fbFx"));
    this.link = new TableLink({
      seated: (created) => this.seated(created),
      failed: (message) => this.failed(message),
      peers: () => this.touchView(),
      peer: (peer, known) => this.onPeer(peer, known),
      host: (h) => this.onHost(h),
      tick: () => this.advance(),
      state: () => this.myState(),
      canMove: () => !this.spin && !this.bets.size,
      moving: () => this.moving(),
      status: (message) => {
        this.netMsg = message;
      },
    });
    this.nick = FrienblingGame.cleanName(Store.read(FrienblingGame.NAME_KEY, ""));
    this.money = this.loadMoney();
    this.chip = this.loadChip();
    this.bets = new Map();
    this.history = [];
    this.lastBets = this.loadLast();
    this.results = [];
    this.moods = new Map();
    this.arrivals = new Map();
    this.seatedAt = 0;
    this.openAt = 0;
    this.cells = new Map();
    this.slots = [];
    this.netMsg = "";
    this.raf = 0;
    this.last = 0;
    this.view = {};
    this.resetRound();
    this.buildBoard();
    this.buildSeats();
    this.buildChips();
    this.bind();
  }

  clock() {
    return performance.now();
  }

  resetRound() {
    this.readyRound = -1;
    this.arrivals.clear();
    this.synced = false;
    this.round = 0;
    this.spinAt = 0;
    this.spin = null;
    this.lastResult = null;
    this.closedSound = false;
    this.dirty = true;
  }

  loadMoney() {
    const value = Math.floor(Number(Store.read(FrienblingGame.MONEY_KEY, FrienblingGame.START_MONEY)));
    return Number.isFinite(value) && value >= 1 ? value : FrienblingGame.START_MONEY;
  }

  pending() {
    const spin = this.spin;
    if (!spin || spin.landed) return 0;
    return spin.n === null ? FrienblingGame.sum(spin.mine) : FrienblingGame.winnings(spin.mine, spin.n);
  }

  loadChip() {
    const value = Number(Store.read(FrienblingGame.CHIP_KEY, 5));
    return FrienblingGame.CHIPS.includes(value) ? value : 5;
  }

  loadLast() {
    let data = null;
    try {
      data = JSON.parse(Store.read(FrienblingGame.LAST_KEY, "null"));
    } catch (error) {
      return null;
    }
    if (!data || typeof data !== "object") return null;
    const bets = new Map();
    for (const [key, amount] of Object.entries(data)) {
      const value = TableLink.int(amount, 0, 1e12);
      if (value && RouletteRules.bet(key)) bets.set(key, value);
    }
    return bets.size ? bets : null;
  }

  saveLast() {
    Store.write(FrienblingGame.LAST_KEY, JSON.stringify(Object.fromEntries(this.lastBets)));
  }

  period() {
    return this.link.solo ? FrienblingGame.SOLO_PERIOD : FrienblingGame.PERIOD;
  }

  saveMoney() {
    Store.write(FrienblingGame.MONEY_KEY, String(this.money + FrienblingGame.sum(this.bets) + this.pending()));
    this.touchView();
  }

  touchView() {
    this.dirty = true;
  }

  phase() {
    if (!this.link.seated) return "off";
    if (!this.synced) return "sync";
    if (this.spin) return this.spin.landed ? "result" : "spin";
    return this.clock() >= this.spinAt - FrienblingGame.CLOSE_MS ? "closed" : "bet";
  }

  buildBoard() {
    for (const bet of RouletteRules.BETS) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = `fb-cell fb-${bet.key[0] === "n" ? "num" : "out"}${bet.color ? " fb-" + bet.color : ""}`;
      cell.dataset.bet = bet.key;
      const [hc, hr, hcs, hrs] = bet.h,
        [vc, vr, vcs, vrs] = bet.v;
      cell.style.cssText = `--hc:${hc};--hr:${hr};--hcs:${hcs};--hrs:${hrs};--vc:${vc};--vr:${vr};--vcs:${vcs};--vrs:${vrs}`;
      cell.innerHTML = `<span class="fb-label">${bet.diamond ? '<i class="fb-diamond"></i>' : bet.text}</span><span class="fb-stack"></span>`;
      cell.setAttribute("aria-label", bet.label);
      this.board.appendChild(cell);
      this.cells.set(bet.key, { el: cell, stack: cell.querySelector(".fb-stack"), sig: "" });
    }
  }

  buildSeats() {
    const make = (row, order) => {
      for (const visual of order) {
        const el = document.createElement("div");
        el.className = "fb-seat fb-empty";
        el.innerHTML = `<div class="fb-avatar"><span class="fb-crown">${FrienblingGame.CROWN}</span><div class="fb-face"></div><span class="fb-ready-tag">Prêt</span></div><div class="fb-name">Place libre</div><div class="fb-cash"></div><div class="fb-stake"></div>`;
        row.appendChild(el);
        this.slots[visual] = { el, avatar: el.querySelector(".fb-avatar"), face: el.querySelector(".fb-face"), name: el.querySelector(".fb-name"), cash: el.querySelector(".fb-cash"), stake: el.querySelector(".fb-stake"), sig: "", faceSig: "" };
      }
    };
    make($("fbSeatsTop"), FrienblingGame.TOP);
    make($("fbSeatsBottom"), FrienblingGame.BOTTOM);
  }

  buildChips() {
    const row = $("fbChips");
    this.chipButtons = FrienblingGame.CHIPS.map((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "fb-token" + (value === this.chip ? " on" : "");
      button.style.setProperty("--t", FrienblingGame.CHIP_COLORS[value]);
      button.dataset.chip = value;
      button.textContent = value;
      button.setAttribute("aria-label", `Jeton de ${value} €`);
      row.appendChild(button);
      return button;
    });
  }

  bind() {
    this.board.addEventListener("click", (event) => {
      const cell = event.target.closest(".fb-cell");
      if (cell) this.place(cell.dataset.bet, cell);
    });
    this.board.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const cell = event.target.closest(".fb-cell");
      if (cell) this.take(cell.dataset.bet);
    });
    this.board.addEventListener("pointerover", (event) => {
      const cell = event.target.closest(".fb-cell");
      if (cell) this.hint(cell.dataset.bet);
    });
    this.board.addEventListener("pointerleave", () => this.hint(null));
    $("fbChips").addEventListener("click", (event) => {
      const button = event.target.closest(".fb-token");
      if (!button) return;
      this.chip = Number(button.dataset.chip);
      for (const other of this.chipButtons) other.classList.toggle("on", other === button);
      Store.write(FrienblingGame.CHIP_KEY, String(this.chip));
      Sfx.play("fbChip");
    });
    $("fbUndo").addEventListener("click", () => this.undo());
    $("fbClear").addEventListener("click", () => this.clearBets());
    $("fbRepeat").addEventListener("click", () => this.repeat());
    $("fbSpin").addEventListener("click", () => this.launchNow());
    $("fbReady").addEventListener("click", () => this.toggleReady());
    $("fbJoin").addEventListener("click", () => this.play());
    $("fbSolo").addEventListener("click", () => this.playSolo());
    $("fbCancel").addEventListener("click", () => this.leave());
    $("fbLeave").addEventListener("click", () => this.leave());
    const field = $("fbName");
    field.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      this.play();
    });
    window.addEventListener("pagehide", () => {
      if (this.link.table) this.leave();
    });
    new ResizeObserver(() => {
      if (this.raf) this.resize();
    }).observe(this.stage);
  }

  hint(key) {
    const bet = key && RouletteRules.bet(key),
      text = bet ? `${bet.label} : paie ${bet.mult} fois la mise · ${Math.round(RouletteRules.odds(key) * 37)} chance${RouletteRules.odds(key) * 37 > 1 ? "s" : ""} sur 37` : "Clic : poser un jeton · clic droit : reprendre ta mise de la case";
    $("fbHint").textContent = text;
  }

  showLobby(view, error = "") {
    $("fbLobby").classList.add("show");
    $("fbLobbyCard").dataset.view = view;
    $("fbError").textContent = error;
    $("fbPurse").textContent = FrienblingGame.euros(this.money);
    if (error) Sfx.play("bad");
  }

  play() {
    const field = $("fbName"),
      name = FrienblingGame.cleanName(field.value);
    field.value = name;
    if (name.length < FrienblingGame.NAME_MIN) {
      $("fbError").textContent = `Choisis un pseudo d'au moins ${FrienblingGame.NAME_MIN} caractères.`;
      field.classList.remove("lobby-wrong");
      void field.offsetWidth;
      field.classList.add("lobby-wrong");
      field.focus();
      Sfx.play("bad");
      return;
    }
    this.nick = name;
    Store.write(FrienblingGame.NAME_KEY, name);
    this.showLobby("search");
    Sfx.play("click");
    this.link.enter();
  }

  playSolo() {
    const name = FrienblingGame.cleanName($("fbName").value);
    if (name.length >= FrienblingGame.NAME_MIN) {
      this.nick = name;
      Store.write(FrienblingGame.NAME_KEY, name);
    } else if (this.nick.length < FrienblingGame.NAME_MIN) this.nick = FrienblingGame.SOLO_NAME;
    Sfx.play("click");
    this.link.alone();
  }

  launchNow() {
    if (!this.link.solo || this.phase() !== "bet") return;
    if (!this.bets.size) return this.refuse("Pose au moins un jeton avant de lancer la roue.", null);
    this.spinAt = this.clock() + FrienblingGame.CLOSE_MS;
    this.touchView();
  }

  isReady() {
    return this.readyRound === this.round;
  }

  toggleReady() {
    if (this.link.solo || this.phase() !== "bet") return;
    this.readyRound = this.isReady() ? -1 : this.round;
    this.link.touch();
    Sfx.play(this.isReady() ? "fbChip" : "back");
    this.touchView();
  }

  votes() {
    const now = this.clock(),
      list = [{ ready: this.isReady(), bets: FrienblingGame.sum(this.bets), since: this.seatedAt }];
    for (const peer of this.link.peers.values()) {
      const current = peer.br === this.round;
      list.push({ ready: current && peer.rd === this.round, bets: current ? FrienblingGame.sum(peer.bets) : 0, since: this.arrivals.get(peer.id) || 0 });
    }
    let ready = 0,
      needed = 0;
    for (const vote of list) {
      if (vote.ready) {
        ready++;
        needed++;
      } else if (vote.bets || now - Math.max(this.openAt, vote.since) < FrienblingGame.IDLE_MS) needed++;
    }
    return { ready, needed, go: ready > 0 && ready === needed };
  }

  checkReady(now) {
    if (this.link.solo || !this.link.isHost || this.spin || this.spinAt - now <= FrienblingGame.CLOSE_MS) return;
    if (!this.votes().go) return;
    this.spinAt = now + FrienblingGame.CLOSE_MS;
    this.link.touch();
    this.touchView();
  }

  seated(created) {
    $("fbLobby").classList.remove("show");
    this.seatedAt = this.openAt = this.clock();
    if (created) {
      this.synced = true;
      this.round = 1;
      this.spinAt = this.clock() + this.period();
    }
    if (this.money < 1 && !this.bets.size) this.gift();
    this.netMsg = "";
    this.view = {};
    Sfx.play("wkJoin");
    this.touchView();
  }

  moving() {
    this.refundAll();
    this.resetRound();
    this.wheel.stop();
  }

  failed(message) {
    this.refundAll();
    this.resetRound();
    this.wheel.stop();
    Sfx.loop("roll", false);
    this.showLobby("home", message);
  }

  leave() {
    this.refundAll();
    this.link.leave();
    this.resetRound();
    this.wheel.stop();
    this.fx.clear();
    this.moods.clear();
    this.results = [];
    Sfx.loop("roll", false);
    this.showLobby("home");
    this.touchView();
  }

  myState() {
    const spin = this.spin && !this.spin.landed ? this.spin : null,
      state = { name: this.nick, money: this.money, bets: Object.fromEntries(spin ? spin.mine : this.bets), br: spin ? spin.round : this.round, rd: this.isReady() ? this.round : 0 };
    if (this.link.isHost && this.synced) state.h = { round: this.round, left: Math.round(this.spinAt - this.clock()), last: this.lastResult };
    return state;
  }

  onPeer(peer, known) {
    const spin = this.spin;
    if (spin && !spin.landed && peer.br === spin.round) spin.others.set(peer.id, { bets: { ...peer.bets }, money: peer.money });
    if (!known) {
      this.arrivals.set(peer.id, this.clock());
      Sfx.play("fbJoin");
    }
    this.touchView();
  }

  onHost(h) {
    const now = this.clock();
    if (h.last) this.applyResult(h.last, now);
    if (!this.synced) {
      this.synced = true;
      this.openAt = now;
      this.round = h.round;
      this.spinAt = now + h.left;
    } else if (h.round === this.round) {
      const target = now + h.left;
      if (Math.abs(target - this.spinAt) > FrienblingGame.RESYNC_MS) this.spinAt = target;
    } else if (h.round > this.round && !this.spin) {
      this.refundBets();
      this.openAt = now;
      this.round = h.round;
      this.spinAt = now + h.left;
    }
    this.touchView();
  }

  applyResult(last, now) {
    if (this.spin && this.spin.round === last.r && this.spin.n === null) this.setResult(last.n, now);
    else if (this.synced && !this.spin && this.round === last.r) {
      this.startSpin(now);
      if (this.spin.n === null) this.setResult(last.n, now);
    }
  }

  advance() {
    if (!this.link.seated || !this.synced) return;
    const now = this.clock();
    this.checkReady(now);
    if (!this.spin && !this.closedSound && now >= this.spinAt - FrienblingGame.CLOSE_MS) {
      this.closedSound = true;
      Sfx.play("fbClose");
      this.touchView();
    }
    if (!this.spin && now >= this.spinAt) this.startSpin(now);
    const spin = this.spin;
    if (!spin) return;
    if (spin.n === null && this.link.isHost) this.setResult(FrienblingGame.draw(), now);
    if (spin.n !== null && !spin.landed && now >= spin.landAt) this.land(now);
    if (spin.landed && now >= spin.landedAt + FrienblingGame.SHOW_MS) this.endSpin();
  }

  startSpin(now) {
    const mine = new Map(this.bets),
      others = new Map();
    for (const peer of this.link.peers.values()) if (peer.br === this.round && Object.keys(peer.bets).length) others.set(peer.id, { bets: { ...peer.bets }, money: peer.money });
    if (mine.size) {
      this.lastBets = new Map(mine);
      this.saveLast();
    }
    this.bets = new Map();
    this.history = [];
    this.spin = { round: this.round, start: now, n: null, mine, others, balance: this.money, landAt: 0, landed: false, landedAt: 0 };
    this.round++;
    this.spinAt += this.period();
    if (this.link.solo || this.spinAt < now + this.period() / 2) this.spinAt = now + this.period();
    this.closedSound = false;
    this.wheel.launch();
    Sfx.play("fbSpin");
    Sfx.loop("roll", true);
    if (this.link.isHost) this.setResult(FrienblingGame.draw(), now);
    this.link.touch();
    this.touchView();
  }

  setResult(n, now) {
    const spin = this.spin;
    spin.n = n;
    const least = Math.max(FrienblingGame.SPIN_MS - (now - spin.start), FrienblingGame.LATE_LAND_MS) / 1000;
    spin.landAt = now + this.wheel.aim(n, least) * 1000;
    if (this.link.isHost) {
      this.lastResult = { r: spin.round, n };
      this.link.touch();
    }
    this.saveMoney();
  }

  land(now) {
    const spin = this.spin,
      n = spin.n;
    spin.landed = true;
    spin.landedAt = now;
    this.wheel.settle(n);
    Sfx.loop("roll", false);
    Sfx.play("fbLand");
    this.results.unshift(n);
    this.results.length = Math.min(this.results.length, FrienblingGame.HISTORY);
    const won = FrienblingGame.winnings(spin.mine, n);
    this.money += won;
    if (this.money > Number(Store.read(FrienblingGame.BEST_KEY, 0))) Store.write(FrienblingGame.BEST_KEY, String(this.money));
    this.saveMoney();
    this.celebrate(n, spin);
    this.link.touch();
    this.touchView();
  }

  celebrate(n, spin) {
    const players = [{ id: this.link.id, name: this.nick, seat: this.link.seat, bets: spin.mine, balance: spin.balance, me: true }];
    for (const [id, other] of spin.others) {
      const peer = this.link.peers.get(id);
      if (peer) players.push({ id, name: peer.name, seat: peer.seat, bets: other.bets, balance: other.money, me: false });
    }
    let best = 0,
      mineWon = 0,
      mineLevel = 0;
    const until = this.clock() + FrienblingGame.MOOD_MS;
    for (const player of players) {
      if (!FrienblingGame.sum(player.bets)) continue;
      const won = FrienblingGame.winnings(player.bets, n);
      if (!won) {
        this.moods.set(player.id, { mood: "lose", until });
        continue;
      }
      const level = FrienblingGame.level(player.bets, n, player.balance);
      best = Math.max(best, level);
      this.moods.set(player.id, { mood: "win", until, level });
      this.fx.celebrate(this.seatSpot(player.seat), Gambler.color(player.seat), level, won, player.me, player.name);
      if (player.me) {
        mineWon = won;
        mineLevel = level;
      }
    }
    if (mineWon) {
      if (mineLevel < 5) this.fx.text(this.fx.W / 2, this.fx.H * 0.3, FrienblingGame.LEVELS[mineLevel], "#ffe27a", Math.min(34 + mineLevel * 8, this.fx.W * 0.1), 2.6);
      Sfx.play("fbWin", mineLevel);
    } else if (FrienblingGame.sum(spin.mine)) Sfx.play("fbLose");
    else if (best) Sfx.play("fbCoins");
  }

  seatSpot(seat) {
    const visual = (seat - this.link.seat + TableLink.MAX_PLAYERS) % TableLink.MAX_PLAYERS,
      slot = this.slots[visual],
      box = slot.avatar.getBoundingClientRect(),
      base = this.fx.canvas.getBoundingClientRect(),
      zoom = base.width / (this.fx.W || base.width || 1);
    return { x: (box.left + box.width / 2 - base.left) / zoom, y: (box.top + box.height / 2 - base.top) / zoom };
  }

  endSpin() {
    this.spin = null;
    this.openAt = this.clock();
    if (this.money < 1 && !this.bets.size) this.gift();
    this.touchView();
  }

  gift() {
    this.money = FrienblingGame.START_MONEY;
    this.saveMoney();
    this.fx.text(this.fx.W / 2, this.fx.H * 0.5, `La maison t'offre ${FrienblingGame.euros(FrienblingGame.START_MONEY)}`, "#7dff8a", 26, 3);
    Sfx.play("fbGift");
    this.link.touch();
  }

  refuse(text, cell) {
    $("fbHint").textContent = text;
    if (cell) {
      cell.classList.remove("fb-no");
      void cell.offsetWidth;
      cell.classList.add("fb-no");
    }
    Sfx.play("bad");
  }

  place(key, cell) {
    const phase = this.phase();
    if (phase !== "bet") return this.refuse(phase === "sync" || phase === "off" ? "Attends d'être assis à la table." : "Les mises sont fermées : attends le tour suivant.", cell);
    if (this.chip > this.money) return this.refuse(this.money >= 1 ? "Pas assez d'argent pour ce jeton : choisis un jeton plus petit." : "Tu as tout misé !", cell);
    this.bets.set(key, (this.bets.get(key) || 0) + this.chip);
    this.money -= this.chip;
    this.history.push([key, this.chip]);
    this.saveMoney();
    this.link.touch();
    Sfx.play("fbChip");
  }

  remove(key, amount) {
    const left = (this.bets.get(key) || 0) - amount;
    if (left > 0) this.bets.set(key, left);
    else this.bets.delete(key);
    this.money += amount;
  }

  take(key) {
    if (this.phase() !== "bet" || !this.bets.has(key)) return;
    this.remove(key, this.bets.get(key));
    this.history = this.history.filter(([k]) => k !== key);
    this.saveMoney();
    this.link.touch();
    Sfx.play("fbChip");
  }

  undo() {
    if (this.phase() !== "bet" || !this.history.length) return;
    const [key, amount] = this.history.pop();
    this.remove(key, amount);
    this.saveMoney();
    this.link.touch();
    Sfx.play("fbChip");
  }

  clearBets() {
    if (this.phase() !== "bet" || !this.bets.size) return;
    this.refundBets();
    this.link.touch();
    Sfx.play("back");
  }

  repeat() {
    if (this.phase() !== "bet" || !this.lastBets) return;
    const total = FrienblingGame.sum(this.lastBets);
    if (total > this.money) return this.refuse(`Il faut ${FrienblingGame.euros(total)} pour rejouer les mêmes mises.`, null);
    for (const [key, amount] of this.lastBets) {
      this.bets.set(key, (this.bets.get(key) || 0) + amount);
      this.history.push([key, amount]);
    }
    this.money -= total;
    this.saveMoney();
    this.link.touch();
    Sfx.play("fbChip");
  }

  refundBets() {
    this.money += FrienblingGame.sum(this.bets);
    this.bets = new Map();
    this.history = [];
    this.saveMoney();
  }

  refundAll() {
    this.money += FrienblingGame.sum(this.bets) + this.pending();
    this.bets = new Map();
    this.history = [];
    this.spin = null;
    this.saveMoney();
  }

  occupants() {
    const list = [],
      spin = this.spin;
    const stakeOf = (id, live, br) => {
      if (spin && spin.landed) return 0;
      if (spin) return FrienblingGame.sum(id === this.link.id ? spin.mine : (spin.others.get(id) || { bets: {} }).bets);
      return br === this.round ? FrienblingGame.sum(live) : 0;
    };
    list.push({ id: this.link.id, name: this.nick, seat: this.link.seat, money: this.money, stake: stakeOf(this.link.id, this.bets, this.round), me: true, ready: !spin && this.isReady() });
    for (const peer of this.link.peers.values()) list.push({ id: peer.id, name: peer.name, seat: peer.seat, money: peer.money, stake: stakeOf(peer.id, peer.bets, peer.br), me: false, ready: !spin && peer.br === this.round && peer.rd === this.round });
    return list;
  }

  renderSeats() {
    const seated = this.link.seated,
      list = seated ? this.occupants() : [],
      now = this.clock(),
      byVisual = new Map();
    let richest = null;
    for (const person of list) {
      const visual = (person.seat - this.link.seat + TableLink.MAX_PLAYERS) % TableLink.MAX_PLAYERS;
      if (!byVisual.has(visual) || person.me) byVisual.set(visual, person);
      if (!richest || person.money + person.stake > richest.money + richest.stake) richest = person;
    }
    this.slots.forEach((slot, visual) => {
      const person = byVisual.get(visual),
        mood = person && this.moods.get(person.id),
        live = mood && mood.until > now ? mood : null,
        sig = person ? [person.id, person.name, person.money, person.stake, person === richest, live ? live.mood + live.level : "", person.ready && !this.link.solo ? 1 : 0].join("|") : "empty";
      if (sig === slot.sig) return;
      slot.sig = sig;
      const el = slot.el;
      el.classList.toggle("fb-empty", !person);
      el.classList.toggle("fb-me", !!(person && person.me));
      el.classList.toggle("fb-rich", !!person && person === richest);
      el.classList.toggle("fb-won", !!(live && live.mood === "win"));
      el.classList.toggle("fb-is-ready", !!(person && person.ready && !this.link.solo));
      el.dataset.level = live && live.level ? live.level : "";
      if (!person) {
        slot.face.innerHTML = "";
        slot.faceSig = "";
        slot.name.textContent = "Place libre";
        slot.cash.textContent = "";
        slot.stake.textContent = "";
        el.style.removeProperty("--seat");
        return;
      }
      el.style.setProperty("--seat", Gambler.color(person.seat));
      const faceSig = person.seat + (live ? live.mood : "");
      if (faceSig !== slot.faceSig) {
        slot.faceSig = faceSig;
        slot.face.innerHTML = Gambler.svg(person.seat, live ? live.mood : "");
      }
      slot.name.textContent = person.me ? `${person.name} (toi)` : person.name;
      slot.cash.textContent = FrienblingGame.euros(person.money);
      slot.stake.textContent = `Mise : ${FrienblingGame.euros(person.stake)}`;
    });
  }

  renderBoard() {
    const spin = this.spin,
      mine = spin ? spin.mine : this.bets,
      others = new Map(),
      seated = this.link.seated,
      landed = spin && spin.landed;
    if (seated) {
      if (spin) for (const [id, other] of spin.others) others.set(id, other.bets);
      else for (const peer of this.link.peers.values()) if (peer.br === this.round) others.set(peer.id, peer.bets);
    }
    const myColor = Gambler.color(this.link.seat);
    for (const [key, cell] of this.cells) {
      const parts = [],
        hit = landed && RouletteRules.payout(key, 1, spin.n) > 0;
      const amount = seated ? mine.get(key) || 0 : 0;
      for (const [id, bets] of others) {
        const peer = this.link.peers.get(id);
        if (peer && bets[key]) parts.push([peer.seat, bets[key], peer.name]);
      }
      const sig = `${amount}|${parts.join(";")}|${hit ? 1 : 0}|${landed ? 1 : 0}|${myColor}`;
      if (sig === cell.sig) continue;
      cell.sig = sig;
      cell.el.classList.toggle("fb-hit", !!hit);
      cell.stack.classList.toggle("fb-gone", !!landed && !hit);
      let html = "";
      if (parts.length) html += `<span class="fb-others">${parts.map(([seat, value, name]) => `<i class="fb-chip" style="--c:${Gambler.color(seat)}" title="${name} : ${value} €">${FrienblingGame.short(value)}</i>`).join("")}</span>`;
      if (amount) html += `<i class="fb-chip fb-mine" style="--c:${myColor}" title="Ta mise : ${amount} €">${FrienblingGame.short(amount)}</i>`;
      cell.stack.innerHTML = html;
    }
  }

  renderStatus() {
    const phase = this.phase(),
      now = this.clock();
    let text = "",
      clock = "";
    if (this.netMsg) text = this.netMsg;
    else if (phase === "sync") text = "Arrivée à la table…";
    else if (phase === "bet") text = "Faites vos jeux";
    else if (phase === "closed") text = "Rien ne va plus !";
    else if (phase === "spin") text = "La bille roule…";
    else if (phase === "result") text = RouletteRules.name(this.spin.n);
    if (phase === "bet" || phase === "closed") {
      const left = Math.max(0, Math.ceil((this.spinAt - now) / 1000));
      clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
    }
    this.write("fbPhase", text);
    if (!this.link.solo) {
      const votes = phase === "bet" ? this.votes() : null,
        mine = !!votes && this.isReady();
      this.write("fbReady", votes ? `${mine ? "Prêt ✓" : "Prêt"} ${votes.ready}/${Math.max(1, votes.needed)}` : "Prêt");
      if (this.view.readyOn !== mine) {
        this.view.readyOn = mine;
        $("fbReady").classList.toggle("on", mine);
      }
    }
    this.write("fbClock", clock);
    const area = $("fbArea"),
      mode = this.link.solo ? "solo" : "online";
    if (this.stage.dataset.mode !== mode) this.stage.dataset.mode = mode;
    if (area.dataset.phase !== phase) {
      area.dataset.phase = phase;
      this.dirty = true;
    }
    const timerKey = phase === "bet" || phase === "closed" ? `${this.round}:${Math.round(this.spinAt / 250)}` : "";
    if (timerKey !== this.view.timer) {
      this.view.timer = timerKey;
      const bar = $("fbTimer");
      bar.style.animation = "none";
      if (timerKey) {
        void bar.offsetWidth;
        const left = this.spinAt - now;
        bar.style.animation = `fb-drain ${this.period()}ms linear ${Math.round(left - this.period())}ms forwards`;
      }
    }
    const result = this.spin && this.spin.landed ? this.spin.n : null;
    const badgeKey = result === null ? "" : String(result);
    if (badgeKey !== this.view.badge) {
      this.view.badge = badgeKey;
      const badge = $("fbResult");
      badge.className = "fb-result" + (result === null ? "" : " show fb-" + RouletteRules.color(result));
      badge.textContent = badgeKey;
    }
  }

  write(id, text) {
    if (this.view[id] === text) return;
    this.view[id] = text;
    $(id).textContent = text;
  }

  renderBar() {
    this.write("fbMoney", FrienblingGame.euros(this.money));
    this.write("fbTable", this.link.seated ? this.link.table : "—");
    this.write("fbCount", this.link.seated ? (this.link.solo ? "1" : `${this.link.count}/${TableLink.MAX_PLAYERS}`) : "—");
    const historyKey = this.results.join(",");
    if (historyKey !== this.view.history) {
      this.view.history = historyKey;
      $("fbHistory").innerHTML = this.results.map((n) => `<i class="fb-${RouletteRules.color(n)}">${n}</i>`).join("");
    }
    for (const button of this.chipButtons) button.classList.toggle("fb-poor", Number(button.dataset.chip) > this.money);
  }

  render() {
    const now = this.clock();
    for (const [id, mood] of this.moods)
      if (mood.until <= now) {
        this.moods.delete(id);
        this.dirty = true;
      }
    this.renderStatus();
    if (!this.dirty) return;
    this.dirty = false;
    this.renderSeats();
    this.renderBoard();
    this.renderBar();
  }

  frame(time) {
    const dt = Math.min(0.05, (time - this.last) / 1000);
    this.last = time;
    this.advance();
    this.wheel.update(dt);
    this.wheel.draw();
    this.fx.update(dt);
    this.fx.draw();
    const shake = this.fx.offset();
    if (shake !== this.view.shake) {
      this.view.shake = shake;
      this.stage.style.transform = shake;
    }
    this.render();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  resize() {
    this.wheel.resize();
    this.fx.resize();
  }

  open() {
    if (!this.link.table) {
      $("fbName").value = this.nick;
      this.showLobby("home");
    }
    this.view = {};
    this.dirty = true;
    this.hint(null);
    this.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  close() {
    this.leave();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.stage.style.transform = "";
  }

  pause() {
    return false;
  }

  resume() {}
}
