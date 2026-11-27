class WhiteJackGame extends Game {
  static ROOT = "worksoft/whitejack/v1/";
  static SEATS = 10;
  static BET_MS = 60000;
  static CLOSE_MS = 1000;
  static CARD_MS = 420;
  static CARD_GAP = 380;
  static FAST_GAP = 120;
  static DEAL_PAUSE = 900;
  static BONUS_PAUSE = 1600;
  static INSURE_MS = 10000;
  static TURN_MS = 20000;
  static GONE_MS = 1500;
  static DEALER_MS = 950;
  static SHOW_MS = 5500;
  static SOLO_DEAL_MS = 250;
  static RESYNC_MS = 400;
  static MOVE_WAIT_MS = 2500;
  static MOOD_MS = 6000;
  static NOTICE_MS = 2600;
  static START_MONEY = 100;
  static CHIPS = [1, 5, 10, 25, 100, 500];
  static CHIP_COLORS = { 1: "#eef1f5", 5: "#e5484d", 10: "#2f9be0", 25: "#1fb36b", 100: "#2a2d34", 500: "#9b5cff" };
  static HEAT = [1, 25, 100, 500];
  static NAME_MIN = 2;
  static NAME_MAX = 14;
  static SOLO_NAME = "Toi";
  static MONEY_KEY = "whitejack_money";
  static NAME_KEY = "whitejack_name";
  static BEST_KEY = "whitejack_best";
  static CHIP_KEY = "whitejack_chip";
  static LAST_KEY = "whitejack_last";
  static SLOT_NAMES = ["Mise", "Deux 10", "Deux Dames"];
  static LEVELS = ["", "Gagné !", "Joli coup !", "Superbe !", "Incroyable !", "JACKPOT !"];

  static euros(n) {
    const value = Math.round(n * 100) / 100;
    return `${value.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })} €`;
  }

  static short(n) {
    if (n >= 1e4) return Math.round(n / 1e3) + "k";
    if (n >= 1e3) return (Math.round(n / 100) / 10).toString().replace(".", ",") + "k";
    return String(Math.round(n * 100) / 100).replace(".", ",");
  }

  static total(bets) {
    let sum = 0;
    for (const bet of bets instanceof Map ? bets.values() : Object.values(bets)) sum += bet[0] + bet[1] + bet[2];
    return sum;
  }

  static clone(g) {
    return JSON.parse(JSON.stringify(g));
  }

  static cleanName(text) {
    return String(text)
      .replace(/[^\p{L}\p{N} _.'-]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, WhiteJackGame.NAME_MAX);
  }

  static cleanPeer(data, out) {
    const int = TableLink.int;
    out.br = int(data.br, 0, 1e9) || 0;
    out.bets = {};
    if (data.bets && typeof data.bets === "object")
      for (const [key, value] of Object.entries(data.bets).slice(0, WhiteJackGame.SEATS)) {
        const seat = int(key, 0, WhiteJackGame.SEATS - 1);
        if (seat === null || !Array.isArray(value)) continue;
        const bet = [0, 1, 2].map((i) => int(value[i], 0, JackTable.MAX_BET) || 0);
        if (bet.some(Boolean)) out.bets[seat] = bet;
      }
    out.a = null;
    const a = data.a;
    if (Array.isArray(a) && a.length === 6 && typeof a[5] === "string" && a[5].length === 1 && "hsdpr".includes(a[5])) {
      const act = { r: int(a[0], 0, 1e9), q: int(a[1], 0, 1e12), si: int(a[2], 0, 9), hi: int(a[3], 0, JackRules.MAX_HANDS - 1), k: int(a[4], 0, 30), m: a[5] };
      if (Object.values(act).every((value) => value !== null)) out.a = act;
    }
    out.iq = null;
    if (Array.isArray(data.iq)) {
      const r = int(data.iq[0], 0, 1e9);
      if (r !== null) out.iq = { r, yes: !!data.iq[1] };
    }
    out.h = data.h ? JackRules.cleanTable(data.h) : null;
    return true;
  }

  constructor() {
    super({
      id: "whitejack",
      name: "White-Jack",
      tag: "Blackjack entre amis ou en solo, avec la Carte Blanche et des paris bonus",
      art: '<svg viewBox="0 0 64 64" style="height:1em"><rect x="8" y="12" width="30" height="42" rx="5" fill="#fff" stroke="#1b1d22" stroke-width="2.5" transform="rotate(-14 23 33)"/><text x="17" y="34" font-size="15" font-weight="900" fill="#d42a32" transform="rotate(-14 23 33)" font-family="Arial">A♥</text><rect x="26" y="10" width="30" height="42" rx="5" fill="#f6f1ff" stroke="#1b1d22" stroke-width="2.5" transform="rotate(12 41 31)"/><text x="34" y="40" font-size="22" fill="#b98a00" transform="rotate(12 41 31)" font-family="Arial">★</text></svg>',
      record: { key: WhiteJackGame.BEST_KEY, label: "Plus grosse fortune", unit: "€", bar: false },
      help: {
        goal: "Un blackjack contre le croupier, seul ou avec tes amis autour d'une table ronde : fais une main plus proche de 21 que la sienne, sans dépasser 21.",
        controls: [
          ["Pseudo puis « Rejoindre une table »", "Tu rejoins une table libre (10 joueurs au plus) ; s'il n'y en a pas, une nouvelle table est créée"],
          ["« Jouer en solo »", "Tu joues seul contre le croupier, même sans connexion ; « Distribuer » lance la manche"],
          ["Clic sur ton cercle", "Pose un jeton sur ta main ; les deux petits cercles à côté sont les paris bonus « Deux 10 » et « Deux Dames »"],
          ["Clic sur le cercle d'un autre joueur", "Mise derrière sa main : il décide, tu gagnes ou perds comme lui"],
          ["Clic droit sur un cercle", "Reprends ta mise de ce cercle"],
          ["Tirer / Rester / Doubler / Séparer / Abandonner", "Tes choix quand c'est ton tour ; le conseil en dessous te dit ce qui est le plus sûr"],
          ["« Prêt » (en ligne)", "Quand tous ceux qui ont misé sont prêts, la distribution commence sans attendre la fin de la minute"],
          ["Bouton bulle de la bande (en ligne)", "Ouvre le chat de la table"],
        ],
        rules: [
          "Cartes de 2 à 9 : leur valeur. 10, Valet, Dame, Roi : 10. As : 1 ou 11, au mieux. Plus de 21 : tu as sauté et tu perds.",
          "La Carte Blanche (6 dans le sabot) prend toute seule la valeur de 1 à 11 qui donne le meilleur total. Le croupier n'en reçoit jamais.",
          "Blackjack (21 avec tes 2 premières cartes) : payé 3 pour 2. Victoire : payé 1 pour 1. Égalité : mise rendue.",
          "Doubler : mise doublée, une seule carte de plus. Séparer deux cartes de même valeur : 4 mains au plus, une seule carte par As séparé. Abandonner sur tes 2 premières cartes rend la moitié de la mise.",
          "Si le croupier montre un As, tu peux t'assurer (la moitié de ta mise) : payé 2 pour 1 s'il a blackjack.",
          "Le croupier tire jusqu'à 16 et reste dès 17. S'il dépasse 21, tous les joueurs encore en jeu gagnent.",
          "Deux 10 : tes 2 premières cartes sont des 10 (pas Valet, Dame ni Roi), payé 50 fois. Deux Dames de la même couleur : payé 250 fois.",
          "60 secondes pour miser, puis on joue chacun son tour. Seuls ceux qui ont misé votent « Prêt » ; dès qu'un joueur est prêt, les autres qui ont misé le deviennent tout seuls au bout de 5 secondes.",
          "Tu as 20 secondes pour jouer ; sinon tu restes. Si un joueur quitte la table, sa main reste et ceux qui misent derrière gardent leur mise.",
          "Tu commences avec 100 €. Si tu n'as plus rien, la maison t'offre 100 €. Le chat n'est jamais enregistré.",
        ],
      },
    });
    this.stage = $("wjStage");
    this.layer = $("wjCards");
    this.badges = $("wjBadges");
    this.tray = $("wjTray");
    this.table = $("wjTable");
    this.croupier = new Croupier($("wjDealer"));
    this.fx = new TableFx($("wjFx"));
    this.engine = new JackTable();
    this.vote = new ReadyVote();
    this.chat = new TableChat("wj", (text) => this.say(text));
    this.link = new TableLink(
      {
        seated: (created) => this.seated(created),
        failed: (message) => this.failed(message),
        peers: () => this.touch(),
        peer: (peer, known) => this.onPeer(peer, known),
        host: (h) => this.onHost(h),
        tick: () => this.advance(),
        state: () => this.myState(),
        canMove: () => !this.g || (this.g.ph === "bet" && !this.bets.size),
        moving: () => this.resetTable(),
        status: (message) => {
          this.netMsg = message;
        },
        chat: (peer, text) => this.chat.add(peer.name, Gambler.color(peer.seat), text, false),
      },
      { root: WhiteJackGame.ROOT, max: WhiteJackGame.SEATS, clean: WhiteJackGame.cleanPeer },
    );
    this.nick = WhiteJackGame.cleanName(Store.read(WhiteJackGame.NAME_KEY, "") || Store.read("frienbling_name", ""));
    this.bank = this.loadMoney();
    this.chip = this.loadChip();
    this.lastBets = this.loadLast();
    this.seq = 0;
    this.moods = new Map();
    this.cards = new Map();
    this.queue = [];
    this.dying = [];
    this.want = new Map();
    this.slots = [];
    this.geo = null;
    this.netMsg = "";
    this.notice = null;
    this.view = {};
    this.raf = 0;
    this.last = 0;
    this.resetTable();
    this.buildSeats();
    this.buildChips();
    this.bind();
  }

  clock() {
    return performance.now();
  }

  resetTable() {
    this.g = null;
    this.hg = null;
    this.gSig = "";
    this.deadline = 0;
    this.bets = new Map();
    this.betRound = -1;
    this.history = [];
    this.readyRound = -1;
    this.act = null;
    this.iq = null;
    this.processed = new Map();
    this.settled = -1;
    this.bonusShown = -1;
    this.endFx = null;
    this.turnKey = "";
    this.pendingMove = "";
    this.closedRound = -1;
    this.vote.reset();
    this.clearCards();
    this.dirty = true;
  }

  clearCards() {
    for (const item of this.cards.values()) item.el.remove();
    for (const item of this.dying || []) item.el.remove();
    this.cards = new Map();
    this.queue = [];
    this.dying = [];
    this.want = new Map();
    this.nextLaunch = 0;
  }

  loadMoney() {
    const value = Number(Store.read(WhiteJackGame.MONEY_KEY, WhiteJackGame.START_MONEY));
    return Number.isFinite(value) && value >= 1 ? Math.round(value * 100) / 100 : WhiteJackGame.START_MONEY;
  }

  saveMoney() {
    Store.write(WhiteJackGame.MONEY_KEY, String(this.bank));
    if (this.bank > Number(Store.read(WhiteJackGame.BEST_KEY, 0))) Store.write(WhiteJackGame.BEST_KEY, String(Math.floor(this.bank)));
    this.touch();
  }

  loadChip() {
    const value = Number(Store.read(WhiteJackGame.CHIP_KEY, 5));
    return WhiteJackGame.CHIPS.includes(value) ? value : 5;
  }

  loadLast() {
    try {
      const data = JSON.parse(Store.read(WhiteJackGame.LAST_KEY, "null"));
      if (Array.isArray(data) && data.length === 3 && data.every((n) => Number.isInteger(n) && n >= 0) && data[0] > 0) return data;
    } catch (error) {}
    return null;
  }

  touch() {
    this.dirty = true;
  }

  get me() {
    return this.link.id;
  }

  buildSeats() {
    const seats = $("wjSeats"),
      spots = $("wjSpots");
    for (let v = 0; v < WhiteJackGame.SEATS; v++) {
      const seat = document.createElement("div");
      seat.className = "wj-seat wj-empty";
      seat.innerHTML = '<div class="wj-avatar"><div class="wj-head"></div><span class="wj-ready-tag">Prêt</span></div><div class="wj-plate"><div class="wj-name"></div><div class="wj-cash"></div></div>';
      seats.appendChild(seat);
      const spot = document.createElement("div");
      spot.className = "wj-spot";
      spot.innerHTML = [0, 1, 2]
        .map((slot) => `<button type="button" class="wj-ring${slot ? " wj-mini" : ""}" data-v="${v}" data-slot="${slot}" aria-label="${WhiteJackGame.SLOT_NAMES[slot]}">${slot === 1 ? '<span class="wj-tag">10·10</span>' : slot === 2 ? '<span class="wj-tag">D·D</span>' : ""}<span class="wj-stack"></span></button>`)
        .join("");
      spots.appendChild(spot);
      const rings = [...spot.querySelectorAll(".wj-ring")];
      this.slots.push({ seat, spot, rings, stacks: rings.map((ring) => ring.querySelector(".wj-stack")), face: seat.querySelector(".wj-head"), name: seat.querySelector(".wj-name"), cash: seat.querySelector(".wj-cash"), sig: "", faceSig: "", spotSig: "" });
    }
  }

  buildChips() {
    const row = $("wjChips");
    this.chipButtons = WhiteJackGame.CHIPS.map((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "wj-token" + (value === this.chip ? " on" : "");
      button.style.setProperty("--t", WhiteJackGame.CHIP_COLORS[value]);
      button.dataset.chip = value;
      button.textContent = value;
      button.setAttribute("aria-label", `Jeton de ${value} €`);
      row.appendChild(button);
      return button;
    });
  }

  bind() {
    const spots = $("wjSpots");
    spots.addEventListener("click", (event) => {
      const ring = event.target.closest(".wj-ring");
      if (ring) this.place(this.seatOf(Number(ring.dataset.v)), Number(ring.dataset.slot), ring);
    });
    spots.addEventListener("contextmenu", (event) => {
      const ring = event.target.closest(".wj-ring");
      if (!ring) return;
      event.preventDefault();
      this.take(this.seatOf(Number(ring.dataset.v)), Number(ring.dataset.slot));
    });
    $("wjChips").addEventListener("click", (event) => {
      const button = event.target.closest(".wj-token");
      if (!button) return;
      this.chip = Number(button.dataset.chip);
      for (const other of this.chipButtons) other.classList.toggle("on", other === button);
      Store.write(WhiteJackGame.CHIP_KEY, String(this.chip));
      Sfx.play("fbChip");
    });
    $("wjUndo").addEventListener("click", () => this.undo());
    $("wjClear").addEventListener("click", () => this.clearBets());
    $("wjRepeat").addEventListener("click", () => this.repeat());
    $("wjReady").addEventListener("click", () => this.toggleReady());
    $("wjDeal").addEventListener("click", () => this.dealNow());
    for (const move of Object.keys(JackRules.MOVES)) $("wjMove-" + move).addEventListener("click", () => this.move(move));
    $("wjInsYes").addEventListener("click", () => this.insure(true));
    $("wjInsNo").addEventListener("click", () => this.insure(false));
    $("wjJoin").addEventListener("click", () => this.play());
    $("wjSolo").addEventListener("click", () => this.playSolo());
    $("wjCancel").addEventListener("click", () => this.leave());
    $("wjLeave").addEventListener("click", () => this.leave());
    $("wjName").addEventListener("keydown", (event) => {
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

  seatOf(v) {
    return (v + this.link.seat) % WhiteJackGame.SEATS;
  }

  visualOf(seat) {
    return (seat - this.link.seat + WhiteJackGame.SEATS) % WhiteJackGame.SEATS;
  }

  people() {
    const map = new Map();
    if (!this.link.seated) return map;
    for (const peer of this.link.peers.values()) map.set(peer.seat, { id: peer.id, name: peer.name, seat: peer.seat, money: peer.money, peer, me: false });
    map.set(this.link.seat, { id: this.me, name: this.nick, seat: this.link.seat, money: this.bank, peer: null, me: true });
    return map;
  }

  funds(id) {
    if (id === this.me) return this.bank;
    const peer = this.link.peers.get(id);
    return peer ? peer.money : 0;
  }

  present(id) {
    return id === this.me || this.link.peers.has(id);
  }

  cashOf(id, money, liveBets) {
    const g = this.g;
    let cash = money - WhiteJackGame.total(liveBets);
    if (g && g.ph !== "bet" && !(id === this.me && this.settled === g.r) && !(id !== this.me && g.ph === "done")) {
      cash -= JackRules.committed(g, id);
      if (g.ph !== "deal") {
        const line = JackRules.bonuses(g).get(id);
        if (line) cash += line.back;
      }
    }
    return Math.max(0, Math.round(cash * 100) / 100);
  }

  cash() {
    return this.cashOf(this.me, this.bank, this.bets);
  }

  liveBetsOf(peer) {
    return this.g && this.g.ph === "bet" && peer.br === this.g.r ? peer.bets : {};
  }

  phase() {
    if (!this.link.seated) return "off";
    if (!this.g) return "sync";
    if (this.g.ph === "bet") return this.deadline && this.clock() >= this.deadline - WhiteJackGame.CLOSE_MS ? "closed" : "bet";
    return this.g.ph;
  }

  showLobby(view, error = "") {
    $("wjLobby").classList.add("show");
    $("wjLobbyCard").dataset.view = view;
    $("wjError").textContent = error;
    $("wjPurse").textContent = WhiteJackGame.euros(this.bank);
    if (error) Sfx.play("bad");
  }

  play() {
    const field = $("wjName"),
      name = WhiteJackGame.cleanName(field.value);
    field.value = name;
    if (name.length < WhiteJackGame.NAME_MIN) {
      $("wjError").textContent = `Choisis un pseudo d'au moins ${WhiteJackGame.NAME_MIN} caractères.`;
      field.classList.remove("lobby-wrong");
      void field.offsetWidth;
      field.classList.add("lobby-wrong");
      field.focus();
      Sfx.play("bad");
      return;
    }
    this.nick = name;
    Store.write(WhiteJackGame.NAME_KEY, name);
    this.showLobby("search");
    Sfx.play("click");
    this.link.enter();
  }

  playSolo() {
    const name = WhiteJackGame.cleanName($("wjName").value);
    if (name.length >= WhiteJackGame.NAME_MIN) {
      this.nick = name;
      Store.write(WhiteJackGame.NAME_KEY, name);
    } else if (this.nick.length < WhiteJackGame.NAME_MIN) this.nick = WhiteJackGame.SOLO_NAME;
    Sfx.play("click");
    this.link.alone();
  }

  seated(created) {
    $("wjLobby").classList.remove("show");
    this.resetTable();
    this.chat.enable(!this.link.solo);
    this.stage.parentElement.dataset.mode = this.link.solo ? "solo" : "online";
    if (created) this.hostRound(1);
    if (this.bank < 1) this.gift();
    this.netMsg = "";
    this.view = {};
    this.resize();
    Sfx.play("wkJoin");
  }

  failed(message) {
    this.resetTable();
    this.chat.enable(false);
    this.showLobby("home", message);
  }

  leave() {
    this.link.leave();
    this.resetTable();
    this.fx.clear();
    this.moods.clear();
    this.chat.enable(false);
    this.showLobby("home");
  }

  say(text) {
    const sent = this.link.say(text);
    if (sent) this.chat.add(this.nick, Gambler.color(this.link.seat), sent, true);
    return sent;
  }

  gift() {
    this.bank = WhiteJackGame.START_MONEY;
    this.saveMoney();
    if (this.fx.W) this.fx.text(this.fx.W / 2, this.fx.H * 0.5, `La maison t'offre ${WhiteJackGame.euros(WhiteJackGame.START_MONEY)}`, "#7dff8a", 26, 3);
    Sfx.play("fbGift");
    this.link.touch();
  }

  refuse(text, el) {
    this.notice = { text, until: this.clock() + WhiteJackGame.NOTICE_MS, bad: true };
    if (el) {
      el.classList.remove("wj-no");
      void el.offsetWidth;
      el.classList.add("wj-no");
    }
    Sfx.play("bad");
  }

  place(seat, slot, el) {
    const phase = this.phase();
    if (phase !== "bet") return this.refuse(phase === "closed" ? "Les jeux sont faits : attends la manche suivante." : "On ne mise pas pendant la manche.", el);
    const person = this.people().get(seat);
    if (!person) return;
    const bet = (this.bets.get(seat) || [0, 0, 0]).slice();
    if (slot && !bet[0]) return this.refuse("Pose d'abord une mise sur cette main, puis le pari bonus.", el);
    const cap = slot ? JackTable.MAX_BONUS : JackTable.MAX_BET;
    if (bet[slot] + this.chip > cap) return this.refuse(`Mise maximum : ${WhiteJackGame.euros(cap)}.`, el);
    if (this.chip > this.cash()) return this.refuse(this.cash() >= 1 ? "Pas assez d'argent pour ce jeton : choisis un jeton plus petit." : "Tu as tout misé !", el);
    bet[slot] += this.chip;
    this.bets.set(seat, bet);
    this.history.push([seat, slot, this.chip]);
    this.link.touch();
    this.touch();
    Sfx.play("fbChip");
  }

  drop(seat, slot, amount) {
    const bet = this.bets.get(seat);
    if (!bet) return;
    bet[slot] = Math.max(0, bet[slot] - amount);
    if (!bet[0]) bet[1] = bet[2] = 0;
    if (!bet.some(Boolean)) this.bets.delete(seat);
  }

  take(seat, slot) {
    if (this.phase() !== "bet" || !this.bets.has(seat)) return;
    const bet = this.bets.get(seat);
    if (slot) bet[slot] = 0;
    else this.bets.delete(seat);
    if (bet && !bet.some(Boolean)) this.bets.delete(seat);
    this.history = this.history.filter(([s, k]) => s !== seat || (slot && k !== slot));
    this.link.touch();
    this.touch();
    Sfx.play("fbChip");
  }

  undo() {
    if (this.phase() !== "bet" || !this.history.length) return;
    const [seat, slot, amount] = this.history.pop();
    this.drop(seat, slot, amount);
    this.history = this.history.filter(([s]) => this.bets.has(s));
    this.link.touch();
    this.touch();
    Sfx.play("fbChip");
  }

  clearBets() {
    if (this.phase() !== "bet" || !this.bets.size) return;
    this.bets = new Map();
    this.history = [];
    this.link.touch();
    this.touch();
    Sfx.play("back");
  }

  repeat() {
    if (this.phase() !== "bet" || !this.lastBets) return;
    const need = this.lastBets[0] + this.lastBets[1] + this.lastBets[2];
    if (need > this.cash()) return this.refuse(`Il faut ${WhiteJackGame.euros(need)} pour rejouer la même mise.`, null);
    const seat = this.link.seat,
      bet = (this.bets.get(seat) || [0, 0, 0]).slice();
    this.lastBets.forEach((amount, slot) => {
      bet[slot] = Math.min(slot ? JackTable.MAX_BONUS : JackTable.MAX_BET, bet[slot] + amount);
      if (amount) this.history.push([seat, slot, amount]);
    });
    this.bets.set(seat, bet);
    this.link.touch();
    this.touch();
    Sfx.play("fbChip");
  }

  isReady() {
    return !!this.g && this.readyRound === this.g.r;
  }

  toggleReady() {
    if (this.link.solo || this.phase() !== "bet") return;
    if (!this.isReady() && !this.bets.size) return this.refuse("Mise d'abord : seuls ceux qui ont misé votent.", null);
    this.readyRound = this.isReady() ? -1 : this.g.r;
    this.link.touch();
    Sfx.play(this.isReady() ? "fbChip" : "back");
    this.touch();
  }

  dealNow() {
    if (!this.link.solo || this.phase() !== "bet" || !this.hg) return;
    const own = this.bets.get(this.link.seat);
    if (!own || !own[0]) return this.refuse("Pose au moins un jeton sur ton cercle.", null);
    this.deadline = this.clock() + WhiteJackGame.SOLO_DEAL_MS;
    Sfx.play("click");
  }

  votes() {
    const g = this.g,
      list = [{ id: this.me, ready: this.isReady(), bet: this.bets.size > 0, sig: JSON.stringify([...this.bets]) }];
    for (const peer of this.link.peers.values()) {
      const current = peer.br === g.r;
      list.push({ id: peer.id, ready: current && peer.rd === g.r, bet: current && Object.keys(peer.bets).length > 0, sig: current ? JSON.stringify(peer.bets) : "" });
    }
    return this.vote.count(g.r, list, this.clock());
  }

  myTurn() {
    const g = this.g;
    if (!g || g.ph !== "play" || !g.t) return null;
    const [si, hi] = g.t,
      seat = g.s[si];
    return seat && seat.id === this.me ? { seat, hand: seat.h[hi], si, hi } : null;
  }

  moveKey() {
    const turn = this.myTurn();
    return turn ? `${this.g.r}:${turn.si}:${turn.hi}:${turn.seat.h.map((hand) => hand.c.join(".") + (hand.s ? "s" : "")).join("|")}` : "";
  }

  allowed(turn) {
    const stake = (turn.seat.w[this.me] || [])[turn.hi] || 0,
      spare = this.cash() >= stake;
    return {
      h: true,
      s: true,
      d: JackRules.canDouble(turn.hand) && spare,
      p: JackRules.canSplit(turn.hand, turn.seat.h.length) && spare,
      r: JackRules.canSurrender(turn.seat, turn.hand),
    };
  }

  handReady(turn) {
    return turn.hand.c.every((card, ci) => this.cards.has(`s${turn.seat.p}_${turn.hi}_${ci}`));
  }

  move(m) {
    const turn = this.myTurn();
    if (!turn || this.waiting() || !this.handReady(turn) || !this.allowed(turn)[m]) return;
    this.pendingMove = this.moveKey();
    this.pendingAt = this.clock();
    this.act = { r: this.g.r, q: ++this.seq, si: turn.si, hi: turn.hi, k: turn.hand.c.length, m };
    Sfx.play(m === "s" ? "back" : "click");
    if (this.link.isHost) this.hostAct(this.me, this.act);
    else this.link.touch();
    this.touch();
  }

  waiting() {
    if (!this.pendingMove) return false;
    if (this.pendingMove !== this.moveKey() || this.clock() - this.pendingAt > WhiteJackGame.MOVE_WAIT_MS) {
      this.pendingMove = "";
      return false;
    }
    return true;
  }

  insure(yes) {
    const g = this.g;
    if (!g || g.ph !== "ins") return;
    this.iq = { r: g.r, yes };
    Sfx.play(yes ? "fbChip" : "back");
    if (this.link.isHost && this.hg && this.engine.insure(this.hg, this.me, yes, (id) => this.funds(id))) this.publish();
    else this.link.touch();
    this.touch();
  }

  myState() {
    const state = { name: this.nick, money: this.bank, br: Math.max(0, this.betRound), bets: Object.fromEntries(this.bets), rd: this.isReady() ? this.g.r : 0 };
    const a = this.act;
    if (a) state.a = [a.r, a.q, a.si, a.hi, a.k, a.m];
    if (this.iq) state.iq = [this.iq.r, this.iq.yes ? 1 : 0];
    if (this.link.isHost && this.hg) state.h = { ...this.hg, left: this.deadline ? Math.max(0, Math.round(this.deadline - this.clock())) : -1 };
    return state;
  }

  onPeer(peer, known) {
    if (!known) Sfx.play("fbJoin");
    if (this.link.isHost && this.hg) {
      if (peer.a) this.hostAct(peer.id, peer.a);
      if (peer.iq && this.hg.ph === "ins" && peer.iq.r === this.hg.r && this.engine.insure(this.hg, peer.id, peer.iq.yes, (id) => this.funds(id))) this.publish();
    }
    this.touch();
  }

  onHost(g) {
    if (this.link.isHost) return;
    this.hg = null;
    const now = this.clock();
    if (g.left < 0) this.deadline = 0;
    else {
      const target = now + g.left;
      if (!this.deadline || Math.abs(target - this.deadline) > WhiteJackGame.RESYNC_MS) this.deadline = target;
    }
    const sig = JSON.stringify({ ...g, left: 0 });
    if (sig === this.gSig) return;
    this.gSig = sig;
    this.setTable(g);
  }

  publish() {
    this.setTable(WhiteJackGame.clone(this.hg));
    this.link.touch();
  }

  hostRound(round) {
    if (this.engine.needsMix()) this.engine.reshuffle();
    this.hg = this.engine.fresh(round);
    this.deadline = this.link.solo ? 0 : this.clock() + WhiteJackGame.BET_MS;
    this.publish();
  }

  hostAct(id, a) {
    const g = this.hg;
    if (!g || g.ph !== "play" || !g.t || a.r !== g.r || (this.processed.get(id) || 0) >= a.q) return;
    const [si, hi] = g.t,
      seat = g.s[si];
    if (a.si !== si || a.hi !== hi || seat.id !== id || seat.h[hi].c.length !== a.k) return;
    this.processed.set(id, a.q);
    if (!this.engine.act(g, si, hi, a.m, (who) => this.funds(who))) return;
    this.deadline = this.clock() + WhiteJackGame.TURN_MS;
    if (!g.t) this.startDealer();
    this.publish();
  }

  startDeal(now) {
    const g = this.hg,
      players = [{ id: this.me, name: this.nick, seat: this.link.seat, bets: Object.fromEntries(this.bets) }];
    for (const peer of this.link.peers.values()) if (peer.br === g.r) players.push({ id: peer.id, name: peer.name, seat: peer.seat, bets: peer.bets });
    const count = this.engine.deal(g, players, (id) => this.funds(id));
    if (!count) {
      this.deadline = this.link.solo ? 0 : now + WhiteJackGame.BET_MS;
      this.publish();
      return;
    }
    const bonus = g.s.some((seat) => Object.values(seat.b).some((bet) => bet[1] || bet[2]));
    this.deadline = now + count * WhiteJackGame.CARD_MS + WhiteJackGame.DEAL_PAUSE + (bonus ? WhiteJackGame.BONUS_PAUSE : 0);
    this.publish();
  }

  afterDeal(now) {
    const g = this.hg;
    if (this.engine.offersInsurance(g)) {
      g.ph = "ins";
      this.deadline = this.link.solo ? 0 : now + WhiteJackGame.INSURE_MS;
      this.publish();
      return;
    }
    this.afterInsurance(now);
  }

  afterInsurance(now) {
    const g = this.hg;
    for (const id of this.engine.insurers(g)) if (g.ins[id] === undefined) g.ins[id] = 0;
    if (this.engine.peek(g)) {
      this.endRound(now);
      return;
    }
    g.ph = "play";
    this.engine.next(g);
    if (!g.t) this.startDealer();
    else this.deadline = now + WhiteJackGame.TURN_MS;
    this.publish();
  }

  startDealer() {
    const g = this.hg;
    g.ph = "dealer";
    g.t = null;
    this.deadline = this.clock() + WhiteJackGame.DEALER_MS;
  }

  endRound(now) {
    this.engine.finish(this.hg);
    this.deadline = now + WhiteJackGame.SHOW_MS;
    this.publish();
  }

  drive(now) {
    if (!this.link.isHost) return;
    if (!this.hg) {
      if (!this.g) return this.hostRound(1);
      this.hg = WhiteJackGame.clone(this.g);
      if (this.hg.ph === "bet" && !this.deadline && !this.link.solo) this.deadline = now + WhiteJackGame.BET_MS;
    }
    const g = this.hg,
      timeUp = this.deadline && now >= this.deadline;
    if (g.ph === "bet") {
      if (!this.link.solo && this.deadline - now > WhiteJackGame.CLOSE_MS && this.votes().go) {
        this.deadline = now + WhiteJackGame.CLOSE_MS;
        this.link.touch();
      }
      if (timeUp) this.startDeal(now);
    } else if (g.ph === "deal") {
      if (timeUp) this.afterDeal(now);
    } else if (g.ph === "ins") {
      if (timeUp || this.engine.allInsured(g)) this.afterInsurance(now);
    } else if (g.ph === "play") {
      if (!g.t) {
        this.startDealer();
        this.publish();
        return;
      }
      const [si, hi] = g.t,
        seat = g.s[si],
        gone = !this.present(seat.id) && now >= (this.goneSince || (this.goneSince = now)) + WhiteJackGame.GONE_MS;
      if (this.present(seat.id)) this.goneSince = 0;
      if (gone || (!this.link.solo && timeUp)) {
        this.goneSince = 0;
        this.engine.act(g, si, hi, "s", (who) => this.funds(who));
        this.deadline = now + WhiteJackGame.TURN_MS;
        if (!g.t) this.startDealer();
        this.publish();
      }
    } else if (g.ph === "dealer") {
      if (!timeUp) return;
      if (this.engine.dealerStep(g)) {
        this.deadline = now + WhiteJackGame.DEALER_MS;
        this.publish();
      } else this.endRound(now);
    } else if (g.ph === "done" && timeUp) this.hostRound(g.r + 1);
  }

  advance() {
    if (!this.link.seated) return;
    const now = this.clock();
    this.drive(now);
    const g = this.g;
    if (!g) return;
    if (g.ph === "bet") {
      for (const seat of [...this.bets.keys()])
        if (!this.people().has(seat)) {
          this.bets.delete(seat);
          this.link.touch();
          this.touch();
        }
      if (this.phase() === "closed" && this.closedRound !== g.r && !this.link.solo) {
        this.closedRound = g.r;
        Sfx.play("fbClose");
      }
    }
  }

  setTable(g) {
    const prev = this.g;
    this.g = g;
    const fresh = !prev || prev.r !== g.r;
    if (g.ph === "bet") {
      if (this.betRound !== g.r) {
        this.bets = new Map();
        this.history = [];
        this.betRound = g.r;
        this.readyRound = -1;
      }
      if (fresh && g.mix) {
        this.notice = { text: "Le sabot est remélangé", until: this.clock() + WhiteJackGame.NOTICE_MS };
        Sfx.play("wjShuffle");
      }
      if (this.bank < 1 && fresh) this.gift();
    } else if (this.betRound === g.r && this.bets.size) {
      const own = this.bets.get(this.link.seat);
      if (own && own[0]) {
        this.lastBets = own.slice();
        Store.write(WhiteJackGame.LAST_KEY, JSON.stringify(this.lastBets));
      }
      this.bets = new Map();
      this.history = [];
    }
    if (g.ph === "ins" && (!prev || prev.ph !== "ins") && this.engine.insurers(g).includes(this.me)) Sfx.play("fbClose");
    if (g.ph === "done" && this.settled !== g.r) this.settle(g);
    const turnKey = g.t ? `${g.r}:${g.t.join(":")}` : "";
    if (turnKey !== this.turnKey) {
      this.turnKey = turnKey;
      if (this.myTurn()) Sfx.play("wjTurn");
    }
    if (this.pendingMove && this.pendingMove !== this.moveKey()) this.pendingMove = "";
    this.layoutCards();
    this.touch();
  }

  settle(g) {
    this.settled = g.r;
    const results = JackRules.results(g),
      mine = results.get(this.me);
    if (mine) {
      this.bank = Math.max(0, Math.round((this.bank + mine.net) * 100) / 100);
      this.saveMoney();
      this.link.touch();
    }
    this.endFx = { r: g.r, results };
  }

  spotOf(id, g) {
    let seat = id === this.me ? this.link.seat : this.link.peers.has(id) ? this.link.peers.get(id).seat : null;
    if (seat === null) {
      const owned = g.s.find((entry) => entry.id === id);
      if (!owned) return null;
      seat = owned.p;
    }
    return { seat, ...this.avatarSpot(this.visualOf(seat)) };
  }

  level(line, funds) {
    const share = line.staked / Math.max(1, line.staked + funds),
      power = 0.5 * line.rarity + 0.5 * Math.min(1, share * 2);
    return Math.max(1, Math.min(5, Math.ceil(power * 5)));
  }

  celebrate(g, results, bonus) {
    const until = this.clock() + WhiteJackGame.MOOD_MS;
    let mine = null;
    for (const [id, line] of results) {
      const spot = this.spotOf(id, g);
      if (!spot) continue;
      if (line.net <= 0) {
        if (!bonus && line.net < 0) this.moods.set(id, { mood: "lose", until });
        if (id === this.me) mine = { line, level: 0 };
        continue;
      }
      const level = this.level(line, this.funds(id)),
        name = id === this.me ? this.nick : (this.link.peers.get(id) || { name: "?" }).name;
      this.moods.set(id, { mood: "win", until, level });
      this.fx.celebrate(spot, Gambler.color(spot.seat), level, Math.round(line.net * 100) / 100, id === this.me, name);
      if (id === this.me) mine = { line, level };
    }
    if (bonus) {
      for (const seat of g.s) {
        const p = this.avatarSpot(this.visualOf(seat.p));
        if (JackRules.queens(seat.f)) this.fx.text(p.x, p.y - 95, "Deux Dames !", "#ff9ad5", 26, 2.8);
        else if (JackRules.tens(seat.f)) this.fx.text(p.x, p.y - 95, "Deux 10 !", "#9fe0ff", 24, 2.6);
      }
      if (mine && mine.level) Sfx.play("fbWin", mine.level);
      return;
    }
    if (mine && mine.level) {
      if (mine.level < 5) this.fx.text(this.fx.W / 2, this.fx.H * 0.3, WhiteJackGame.LEVELS[mine.level], "#ffe27a", Math.min(34 + mine.level * 8, this.fx.W * 0.1), 2.6);
      Sfx.play("fbWin", mine.level);
    } else if (mine && mine.line.net < 0) Sfx.play("fbLose");
    else if (mine) Sfx.play("fbChip");
    else if ([...results.values()].some((line) => line.net > 0)) Sfx.play("fbCoins");
  }

  resize() {
    const W = this.stage.clientWidth,
      H = this.stage.clientHeight;
    if (!W || !H) return;
    const av = Math.max(34, Math.min(62, Math.min(W, H) * 0.085)),
      top = av * 0.62 + 6,
      bottom = av * 0.62 + 40,
      side = av * 0.62 + 10,
      ry = Math.max(70, (H - top - bottom) / 2),
      rx = Math.max(70, Math.min((W - 2 * side) / 2, ry * 1.85)),
      cx = W / 2,
      cy = top + ry,
      cw = Math.max(22, Math.min(60, Math.min(rx, ry) * 0.135)),
      rim = Math.max(10, av * 0.36);
    this.geo = { W, H, av, rx, ry, cx, cy, cw, rim };
    this.stage.style.setProperty("--wj-cw", `${cw.toFixed(1)}px`);
    this.stage.style.setProperty("--wj-av", `${av.toFixed(1)}px`);
    Object.assign(this.table.style, { left: `${cx - rx - rim}px`, top: `${cy - ry - rim}px`, width: `${2 * (rx + rim)}px`, height: `${2 * (ry + rim)}px`, borderWidth: `${rim}px` });
    const pit = $("wjPit");
    Object.assign(pit.style, { left: `${cx - rx * 0.36}px`, top: `${cy - ry * 0.42}px`, width: `${rx * 0.72}px`, height: `${ry * 0.84}px` });
    const dealer = this.dealerPos(),
      size = Math.min(rx, ry) * 0.5;
    Object.assign($("wjDealer").style, { left: `${dealer.x}px`, top: `${dealer.y}px`, width: `${size}px`, height: `${size * 0.93}px` });
    const shoe = this.shoeSpot();
    Object.assign($("wjShoe").style, { left: `${shoe.x}px`, top: `${shoe.y}px` });
    this.slots.forEach((slot, v) => {
      const a = this.avatarSpot(v),
        s = this.point(0.79, this.angle(v)),
        t = this.tangent(this.angle(v)),
        sp = cw * 1.15,
        mini = sp * 0.62,
        gap = sp / 2 + mini / 2 + 3;
      slot.seat.style.left = `${Math.max(56, Math.min(W - 56, a.x))}px`;
      slot.seat.style.top = `${a.y}px`;
      slot.seat.classList.toggle("wj-high", Math.sin(this.angle(v)) < -0.5);
      slot.spot.style.left = `${s.x}px`;
      slot.spot.style.top = `${s.y}px`;
      slot.rings[0].style.cssText = `width:${sp}px;height:${sp}px;left:${-sp / 2}px;top:${-sp / 2}px`;
      [-1, 1].forEach((k, i) => {
        slot.rings[i + 1].style.cssText = `width:${mini}px;height:${mini}px;left:${t.x * gap * k - mini / 2}px;top:${t.y * gap * k - mini / 2}px`;
      });
    });
    this.fx.resize();
    this.layoutCards();
    this.view = { ...this.view, badgeSig: "" };
    this.touch();
  }

  angle(v) {
    return Math.PI / 2 + (v * 2 * Math.PI) / WhiteJackGame.SEATS;
  }

  point(f, a) {
    const g = this.geo;
    return { x: g.cx + g.rx * f * Math.cos(a), y: g.cy + g.ry * f * Math.sin(a) };
  }

  tangent(a) {
    const g = this.geo,
      x = -g.rx * Math.sin(a),
      y = g.ry * Math.cos(a),
      n = Math.hypot(x, y) || 1;
    return { x: x / n, y: y / n };
  }

  avatarSpot(v) {
    const g = this.geo,
      a = this.angle(v),
      grow = g.rim * 0.4;
    return { x: g.cx + (g.rx + grow) * Math.cos(a), y: g.cy + (g.ry + grow) * Math.sin(a) };
  }

  dealerPos() {
    const g = this.geo;
    return { x: g.cx, y: g.cy - g.ry * 0.1 };
  }

  shoeSpot() {
    const g = this.geo;
    return { x: g.cx + g.rx * 0.22, y: g.cy - g.ry * 0.2, rot: 20, scale: 0.6, z: 50 };
  }

  discardSpot() {
    const g = this.geo;
    return { x: g.cx - g.rx * 0.22, y: g.cy - g.ry * 0.2, rot: -25, scale: 0.55, z: 1 };
  }

  faceTo(x, y) {
    const d = this.dealerPos();
    return (Math.atan2(y - d.y, x - d.x) * 180) / Math.PI + 90;
  }

  handBase(v, hi, count) {
    const a = this.angle(v),
      scale = (v === 0 ? 1.2 : 1) * (count > 2 ? 0.78 : count > 1 ? 0.88 : 1),
      base = this.point(0.56, a),
      t = this.tangent(a),
      off = ((count - 1) / 2 - hi) * this.geo.cw * scale * 2.3;
    return { x: base.x + t.x * off, y: base.y + t.y * off, scale, a };
  }

  cardSpot(v, hi, count, ci, size) {
    const base = this.handBase(v, hi, count),
      cw = this.geo.cw * base.scale,
      x = base.x + (ci - (size - 1) / 2) * cw * 0.42,
      y = base.y - ci * cw * 0.05;
    return { x, y, rot: -Math.cos(base.a) * 10 + (((ci * 37) % 7) - 3) * 0.7, scale: base.scale, z: 10 + ci, face: this.faceTo(x, y) };
  }

  dealerCardSpot(ci, size) {
    const g = this.geo,
      x = g.cx + (ci - (size - 1) / 2) * g.cw * 0.62,
      y = g.cy + g.ry * 0.17;
    return { x, y, rot: (((ci * 29) % 5) - 2) * 0.8, scale: 1.1, z: 10 + ci, face: this.faceTo(x, y) };
  }

  layoutCards() {
    if (!this.geo) return;
    const want = new Map(),
      g = this.g;
    if (g) {
      g.s.forEach((seat, si) => {
        const v = this.visualOf(seat.p);
        seat.h.forEach((hand, hi) => hand.c.forEach((card, ci) => want.set(`s${seat.p}_${hi}_${ci}`, { card, ...this.cardSpot(v, hi, seat.h.length, ci, hand.c.length), order: ci * 100 + si })));
      });
      g.d.forEach((card, ci) => want.set(`d${ci}`, { card, ...this.dealerCardSpot(ci, g.d.length), order: ci * 100 + 99 }));
    }
    this.want = want;
    const orphans = [];
    for (const [key, item] of this.cards) {
      const target = want.get(key);
      if (!target || (target.card !== item.card && item.card !== JackRules.HIDDEN)) {
        orphans.push(item);
        this.cards.delete(key);
        continue;
      }
      if (target.card !== item.card) {
        item.card = target.card;
        CardArt.paint(item.el, target.card);
        Sfx.play("wjFlip");
      }
      this.put(item.el, target);
    }
    const queued = new Set(this.queue),
      fresh = [...want.entries()].filter(([key]) => !this.cards.has(key) && !queued.has(key)).sort((a, b) => a[1].order - b[1].order);
    for (const [key, target] of fresh) {
      const i = g ? orphans.findIndex((item) => item.card === target.card && item.round === g.r) : -1;
      if (i >= 0) {
        const item = orphans.splice(i, 1)[0];
        this.cards.set(key, item);
        this.put(item.el, target);
      } else this.queue.push(key);
    }
    for (const item of orphans) this.discard(item);
  }

  put(el, t) {
    const cw = this.geo.cw,
      ch = cw * 1.4;
    el.style.transform = `translate(${(t.x - cw / 2).toFixed(1)}px, ${(t.y - ch / 2).toFixed(1)}px) rotate(${t.rot.toFixed(1)}deg) scale(${t.scale})`;
    el.style.zIndex = t.z;
  }

  discard(item) {
    item.el.classList.add("wj-gone");
    this.put(item.el, this.discardSpot());
    this.dying.push({ el: item.el, at: this.clock() + 600 });
  }

  pump(now) {
    for (let i = this.dying.length - 1; i >= 0; i--)
      if (now >= this.dying[i].at) {
        this.dying[i].el.remove();
        this.dying.splice(i, 1);
      }
    while (this.queue.length && now >= this.nextLaunch) {
      const key = this.queue.shift(),
        target = this.want.get(key);
      if (!target || this.cards.has(key)) continue;
      const el = CardArt.make(target.card);
      el.style.transition = "none";
      this.put(el, this.shoeSpot());
      this.layer.appendChild(el);
      void el.offsetWidth;
      el.style.transition = "";
      this.put(el, target);
      this.cards.set(key, { el, card: target.card, round: this.g ? this.g.r : -1 });
      this.croupier.face(target.face);
      this.croupier.deal();
      Sfx.play("wjCard");
      this.nextLaunch = now + (this.queue.length > 5 ? WhiteJackGame.FAST_GAP : WhiteJackGame.CARD_GAP);
      this.lookUntil = now + WhiteJackGame.CARD_GAP + 250;
      this.touch();
    }
  }

  shown(prefix, cards) {
    const list = [];
    cards.forEach((card, ci) => {
      const item = this.cards.get(prefix + ci);
      if (item) list.push(item.card);
    });
    return list;
  }

  handLabel(cards, hand, mine = true) {
    const score = JackRules.score(cards);
    if (score.bust) return { text: "Sauté", cls: "wj-bust" };
    if (hand && hand.r) return { text: "Abandon", cls: "wj-push" };
    if (hand && cards.length === 2 && JackRules.natural(hand)) return { text: mine ? "Black Jack" : "BJ !", cls: "wj-bj" };
    if (hand && !hand.s && score.soft && score.total < 21) return { text: `${score.low}/${score.total}`, cls: "" };
    return { text: String(score.total), cls: "" };
  }

  renderBadges() {
    const g = this.g,
      parts = [];
    if (g && this.geo) {
      const settledView = g.ph === "done" && !this.queue.length;
      g.s.forEach((seat, si) => {
        const v = this.visualOf(seat.p);
        seat.h.forEach((hand, hi) => {
          const cards = this.shown(`s${seat.p}_${hi}_`, hand.c);
          if (!cards.length) return;
          const base = this.handBase(v, hi, seat.h.length),
            ch = this.geo.cw * base.scale * 1.4,
            dx = this.geo.cx - base.x,
            dy = this.geo.cy - base.y,
            n = Math.hypot(dx, dy) || 1,
            x = base.x + (dx / n) * (ch * 0.5 + 12),
            y = base.y + (dy / n) * (ch * 0.5 + 12),
            label = this.handLabel(cards, cards.length === hand.c.length ? hand : null, seat.id === this.me);
          let cls = label.cls,
            text = label.text;
          if (settledView && cards.length === hand.c.length) {
            const k = JackRules.outcome(hand, g.d);
            cls += k > 0 ? " wj-win" : k < 0 ? " wj-lose" : " wj-tie";
            if (!label.cls) text += k > 0 ? " · Gagné" : k < 0 ? " · Perdu" : " · Égalité";
          }
          if (g.t && g.t[0] === si && g.t[1] === hi) cls += " wj-now";
          if (seat.id === this.me) cls += " wj-own";
          if (hand.x) text += " ×2";
          parts.push(`<span class="wj-badge ${cls}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${text}</span>`);
        });
      });
      const dealerCards = this.shown("d", g.d).filter((card) => card !== JackRules.HIDDEN);
      if (dealerCards.length) {
        const spot = this.dealerCardSpot(g.d.length - 1, g.d.length),
          label = this.handLabel(dealerCards, null),
          natural = g.d.length === 2 && dealerCards.length === 2 && JackRules.dealerNatural(g.d);
        parts.push(`<span class="wj-badge wj-house ${natural ? "wj-bj" : label.cls}" style="left:${(spot.x + this.geo.cw * 1.15).toFixed(1)}px;top:${spot.y.toFixed(1)}px">${natural ? "BJ !" : label.text}</span>`);
      }
    }
    const focus = $("wjFocus");
    let focusCss = "";
    if (g && this.geo && g.ph === "play" && g.t && g.s[g.t[0]]) {
      const seat = g.s[g.t[0]],
        base = this.handBase(this.visualOf(seat.p), g.t[1], seat.h.length),
        cw = this.geo.cw * base.scale,
        size = cw * (2.6 + 0.42 * Math.max(1, seat.h[g.t[1]].c.length - 1)),
        high = cw * 2.9;
      focusCss = `left:${(base.x - size / 2).toFixed(1)}px;top:${(base.y - high / 2).toFixed(1)}px;width:${size.toFixed(1)}px;height:${high.toFixed(1)}px`;
    }
    if (focusCss !== this.view.focus) {
      this.view.focus = focusCss;
      focus.style.cssText = focusCss;
      focus.classList.toggle("on", !!focusCss);
    }
    const html = parts.join("");
    if (html === this.view.badgeSig) return;
    this.view.badgeSig = html;
    this.badges.innerHTML = html;
  }

  heat(amount) {
    let level = 0;
    for (const step of WhiteJackGame.HEAT) if (amount >= step) level++;
    return level;
  }

  stakesOn(seat) {
    const g = this.g,
      out = new Map();
    if (!g) return out;
    if (g.ph === "bet") {
      const mine = this.bets.get(seat);
      if (mine) out.set(this.me, mine.slice());
      for (const peer of this.link.peers.values()) if (peer.br === g.r && peer.bets[seat]) out.set(peer.id, peer.bets[seat].slice());
      return out;
    }
    const entry = g.s.find((item) => item.p === seat);
    if (!entry) return out;
    for (const [id, bet] of Object.entries(entry.b)) {
      const main = (entry.w[id] || []).reduce((sum, value) => sum + value, 0);
      out.set(id, [main, bet[1], bet[2]]);
    }
    return out;
  }

  renderSeats() {
    const people = this.people(),
      now = this.clock(),
      g = this.g,
      turnSeat = g && g.ph === "play" && g.t ? g.s[g.t[0]].p : -1,
      votes = g && g.ph === "bet" && !this.link.solo && this.link.seated ? this.votes() : null;
    this.slots.forEach((slot, v) => {
      const seat = this.link.seated ? this.seatOf(v) : -1,
        person = people.get(seat),
        mood = person && this.moods.get(person.id),
        live = mood && mood.until > now ? mood : null,
        ready = !!(person && votes && (person.me ? this.isReady() : person.peer.br === g.r && person.peer.rd === g.r) && (person.me ? this.bets.size : Object.keys(this.liveBetsOf(person.peer)).length)),
        cash = person ? this.cashOf(person.id, person.money, person.me ? this.bets : this.liveBetsOf(person.peer)) : 0,
        sig = person ? [person.id, person.name, cash, live ? live.mood + live.level : "", ready ? 1 : 0, seat === turnSeat ? 1 : 0].join("|") : "empty";
      if (sig !== slot.sig) {
        slot.sig = sig;
        const el = slot.seat;
        el.classList.toggle("wj-empty", !person);
        el.classList.toggle("wj-me", !!(person && person.me));
        el.classList.toggle("wj-won", !!(live && live.mood === "win"));
        el.classList.toggle("wj-is-ready", ready);
        el.classList.toggle("wj-turn", !!person && seat === turnSeat);
        if (!person) {
          slot.face.innerHTML = "";
          slot.faceSig = "";
          slot.name.textContent = "";
          slot.cash.textContent = "";
          el.style.removeProperty("--seat");
        } else {
          el.style.setProperty("--seat", Gambler.color(seat));
          const faceSig = seat + (live ? live.mood : "");
          if (faceSig !== slot.faceSig) {
            slot.faceSig = faceSig;
            slot.face.innerHTML = Gambler.svg(seat, live ? live.mood : "");
          }
          slot.name.textContent = person.me && person.name !== WhiteJackGame.SOLO_NAME ? `${person.name} (toi)` : person.name;
          slot.cash.textContent = WhiteJackGame.euros(cash);
        }
      }
      this.renderSpot(slot, seat, person);
    });
  }

  renderSpot(slot, seat, person) {
    const stakes = person ? this.stakesOn(seat) : new Map(),
      betting = this.phase() === "bet",
      mine = stakes.get(this.me),
      bonusShown = person && ((person.me && betting) || (mine && mine[0] && betting) || [...stakes.values()].some((bet) => bet[1] || bet[2])),
      parts = [0, 1, 2].map((slotIndex) => {
        const others = [];
        for (const [id, bet] of stakes) if (id !== this.me && bet[slotIndex]) others.push([id, bet[slotIndex]]);
        return { mine: mine ? mine[slotIndex] : 0, others };
      }),
      total = [...stakes.values()].reduce((sum, bet) => sum + bet[0], 0),
      sig = person ? JSON.stringify([seat, parts, bonusShown, betting, total]) : "none";
    if (sig === slot.spotSig) return;
    slot.spotSig = sig;
    slot.spot.classList.toggle("wj-open", !!person);
    slot.spot.classList.toggle("wj-bonus", !!bonusShown);
    slot.spot.classList.toggle("wj-live", betting);
    slot.spot.classList.toggle("wj-own", !!person && person.me);
    slot.spot.style.setProperty("--seat", person ? Gambler.color(seat) : "transparent");
    slot.rings[0].dataset.heat = this.heat(total);
    const myColor = Gambler.color(this.link.seat);
    parts.forEach((part, i) => {
      let html = "";
      if (part.others.length)
        html += `<span class="wj-others">${part.others
          .map(([id, value]) => {
            const peer = this.link.peers.get(id),
              color = peer ? Gambler.color(peer.seat) : "#888";
            return `<i class="wj-chip" style="--c:${color}">${WhiteJackGame.short(value)}</i>`;
          })
          .join("")}</span>`;
      if (part.mine) html += `<i class="wj-chip wj-mine" style="--c:${myColor}">${WhiteJackGame.short(part.mine)}</i>`;
      slot.stacks[i].innerHTML = html;
    });
  }

  write(id, text) {
    if (this.view[id] === text) return;
    this.view[id] = text;
    $(id).textContent = text;
  }

  phaseText(phase) {
    const g = this.g,
      now = this.clock();
    if (this.netMsg) return this.netMsg;
    if (this.notice && this.notice.until > now) return this.notice.text;
    if (phase === "sync") return "Arrivée à la table…";
    if (phase === "bet") return this.link.solo ? "Mise, puis « Distribuer »" : "Faites vos jeux";
    if (phase === "closed") return "Les jeux sont faits";
    if (phase === "deal") return "Distribution…";
    if (phase === "ins") return "Assurance ?";
    if (phase === "play") {
      if (this.myTurn()) return "À toi de jouer !";
      const seat = g.t && g.s[g.t[0]];
      return seat ? `Au tour de ${this.link.peers.has(seat.id) ? this.link.peers.get(seat.id).name : seat.nm}` : "";
    }
    if (phase === "dealer") return "Le croupier joue";
    if (phase === "done") {
      if (this.queue.length) return "Le croupier joue";
      const line = this.endFx && this.endFx.r === g.r ? this.endFx.results.get(this.me) : null;
      if (!line) return "Fin de la manche";
      if (line.net > 0) return `Tu gagnes ${WhiteJackGame.euros(line.net)} !`;
      if (line.net < 0) return `Tu perds ${WhiteJackGame.euros(-line.net)}`;
      return "Égalité : mise rendue";
    }
    return "";
  }

  timerLength(phase) {
    if (this.link.solo || !this.deadline) return 0;
    if (phase === "bet" || phase === "closed") return WhiteJackGame.BET_MS;
    if (phase === "ins") return WhiteJackGame.INSURE_MS;
    if (phase === "play") return WhiteJackGame.TURN_MS;
    return 0;
  }

  renderStatus() {
    const phase = this.phase(),
      now = this.clock(),
      g = this.g;
    this.write("wjPhase", this.phaseText(phase));
    const length = this.timerLength(phase),
      left = length ? Math.max(0, this.deadline - now) : 0;
    let clock = "";
    if (length && (phase === "bet" || phase === "closed")) {
      const s = Math.ceil(left / 1000);
      clock = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    } else if (length) clock = `${Math.ceil(left / 1000)} s`;
    this.write("wjClock", clock);
    const timerKey = length ? `${g.r}:${phase === "closed" ? "bet" : phase}:${g.t}:${Math.round(this.deadline / 250)}` : "";
    if (timerKey !== this.view.timer) {
      this.view.timer = timerKey;
      const bar = $("wjTimer");
      bar.style.animation = "none";
      if (timerKey) {
        void bar.offsetWidth;
        bar.style.animation = `wj-drain ${length}ms linear ${Math.round(left - length)}ms forwards`;
      }
    }
    if (this.tray.dataset.phase !== phase) this.tray.dataset.phase = phase;
    this.renderControls(phase);
  }

  insurancePending() {
    const g = this.g;
    return !!g && g.ph === "ins" && this.engine.insurers(g).includes(this.me) && g.ins[this.me] === undefined && !(this.iq && this.iq.r === g.r);
  }

  renderControls(phase) {
    const turn = this.myTurn(),
      g = this.g;
    let ui = "wait",
      hint = "";
    if (phase === "bet" || phase === "closed") {
      ui = "bet";
      hint = "Clic sur ton cercle : miser · sur celui d'un autre : miser derrière sa main · petits cercles : paris bonus · clic droit : reprendre";
    } else if (this.insurancePending()) {
      ui = "insure";
      const cost = this.engine.insuranceCost(g, this.me);
      hint = `Le croupier montre un As. T'assurer coûte ${WhiteJackGame.euros(cost)} et paie 2 pour 1 s'il a blackjack.`;
      this.setButton("wjInsYes", `Assurer (${WhiteJackGame.euros(cost)})`, cost <= this.cash(), false);
    } else if (turn) {
      ui = "moves";
      const can = this.allowed(turn),
        busy = this.waiting() || !this.handReady(turn),
        advice = JackRules.advice(turn.hand, g.d[0], { double: can.d, split: can.p, surrender: can.r }),
        score = JackRules.score(turn.hand.c),
        mine = score.soft && score.total < 21 ? `${score.low} ou ${score.total}` : String(score.total);
      for (const move of Object.keys(JackRules.MOVES)) this.setButton("wjMove-" + move, JackRules.MOVES[move], can[move] && !busy, move === advice);
      const count = this.g.s[turn.si].h.length;
      hint = `${count > 1 ? `Main ${turn.hi + 1} : ` : "Ta main : "}${mine} contre ${JackRules.RANKS[g.d[0] % 13]} · Conseil : ${JackRules.MOVES[advice]}`;
    }
    if (this.tray.dataset.ui !== ui) this.tray.dataset.ui = ui;
    this.write("wjHint", hint);
    if (ui === "bet") {
      if (this.link.solo) this.setButton("wjDeal", "Distribuer", phase === "bet", false);
      else {
        const votes = phase === "bet" ? this.votes() : null,
          wait = votes && votes.waits.get(this.me),
          on = !!votes && (this.isReady() || (this.bets.size > 0 && votes.go));
        let label = "Prêt";
        if (votes && wait) label = `Prêt dans ${Math.ceil(wait / 1000)} s`;
        else if (votes) label = `${on ? "Prêt ✓" : "Prêt"} ${votes.ready}/${Math.max(1, votes.needed)}`;
        this.write("wjReady", label);
        if (this.view.readyOn !== on) {
          this.view.readyOn = on;
          $("wjReady").classList.toggle("on", on);
        }
      }
      for (const button of this.chipButtons) button.classList.toggle("wj-poor", Number(button.dataset.chip) > this.cash());
    }
  }

  setButton(id, text, enabled, advised) {
    const key = `${text}|${enabled}|${advised}`;
    if (this.view["b" + id] === key) return;
    this.view["b" + id] = key;
    const button = $(id);
    button.textContent = text;
    button.disabled = !enabled;
    button.classList.toggle("wj-advised", advised);
  }

  renderBar() {
    this.write("wjMoney", WhiteJackGame.euros(this.cash()));
    this.write("wjTableCode", this.link.seated ? this.link.table : "—");
    this.write("wjCount", this.link.seated ? (this.link.solo ? "1" : `${this.link.count}/${WhiteJackGame.SEATS}`) : "—");
  }

  lookAround(now) {
    if (now < (this.lookUntil || 0) || !this.geo) return;
    const g = this.g;
    let face = 180;
    if (g && g.ph === "play" && g.t) {
      const seat = g.s[g.t[0]],
        base = this.handBase(this.visualOf(seat.p), g.t[1], seat.h.length);
      face = this.faceTo(base.x, base.y);
    } else if (g && (g.ph === "ins" || g.ph === "deal") && g.s.length) face = 180;
    this.croupier.face(face);
  }

  effects() {
    const g = this.g;
    if (!g || this.queue.length || !this.fx.W) return;
    if (g.ph !== "bet" && this.bonusShown !== g.r && g.s.length && g.s.every((seat) => seat.f.length === 2)) {
      this.bonusShown = g.r;
      const bonus = new Map([...JackRules.bonuses(g)].filter(([, line]) => line.net > 0));
      if (bonus.size) this.celebrate(g, bonus, true);
    }
    if (this.endFx && this.endFx.r === g.r && !this.endFx.shown) {
      this.endFx.shown = true;
      const results = new Map([...this.endFx.results].map(([id, line]) => [id, this.withoutBonus(g, id, line)]));
      this.celebrate(g, results, false);
      this.touch();
    }
  }

  withoutBonus(g, id, line) {
    const bonus = JackRules.bonuses(g).get(id);
    if (!bonus) return line;
    return { ...line, net: Math.round((line.net - bonus.net) * 100) / 100, staked: line.staked - bonus.staked, rarity: line.rarity > JackRules.RARITY.blackjack ? JackRules.RARITY.blackjack : line.rarity };
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
    this.renderBadges();
    this.renderBar();
  }

  frame(time) {
    const dt = Math.min(0.05, (time - this.last) / 1000);
    this.last = time;
    const now = this.clock();
    this.advance();
    this.pump(now);
    this.effects();
    this.lookAround(now);
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

  open() {
    if (!this.link.table) {
      $("wjName").value = this.nick;
      this.showLobby("home");
    }
    this.view = {};
    this.dirty = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
    this.resize();
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
