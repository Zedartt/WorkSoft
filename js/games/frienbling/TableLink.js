class TableLink {
  static ROOT = "worksoft/frienbling/v1/";
  static MAX_PLAYERS = 8;
  static LISTEN_MS = 2500;
  static JOIN_MS = 1600;
  static TICK_MS = 250;
  static BEAT_MS = 2000;
  static SEND_GAP = 250;
  static ANNOUNCE_MS = 2000;
  static LOST_MS = 7000;
  static TABLE_TTL = 6000;
  static RECONNECT_MS = 1500;
  static RECONNECT_TRIES = 4;
  static ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  static MSG = {
    offline: "Impossible de joindre le serveur de jeu. Vérifie ta connexion Internet, ou joue en solo.",
    lost: "Connexion perdue avec la table. Tu peux continuer en solo.",
  };

  static newId(length) {
    let id = "";
    for (const value of crypto.getRandomValues(new Uint32Array(length))) id += TableLink.ALPHABET[value % TableLink.ALPHABET.length];
    return id;
  }

  static wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static int(value, min, max) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
  }

  static clean(data) {
    if (!data || typeof data !== "object" || typeof data.id !== "string" || data.id.length > 20) return null;
    const out = {
      id: data.id,
      name: String(data.name || "?")
        .replace(/[\u0000-\u001f<>]/g, "")
        .slice(0, 16),
      seat: TableLink.int(data.seat, 0, TableLink.MAX_PLAYERS - 1),
      rank: TableLink.int(data.rank, 0, 1e9),
      money: TableLink.int(data.money, 0, 1e12),
      br: TableLink.int(data.br, 0, 1e9),
      rd: TableLink.int(data.rd, 0, 1e9) || 0,
      bets: {},
      h: null,
    };
    if (out.seat === null || out.rank === null || out.money === null || out.br === null) return null;
    if (data.bets && typeof data.bets === "object")
      for (const [key, amount] of Object.entries(data.bets)) {
        const value = TableLink.int(amount, 0, 1e12);
        if (value && RouletteRules.bet(key)) out.bets[key] = value;
      }
    const h = data.h;
    if (h && typeof h === "object") {
      const round = TableLink.int(h.round, 0, 1e9),
        left = TableLink.int(h.left, -600000, 600000);
      if (round !== null && left !== null) {
        out.h = { round, left, last: null };
        if (h.last && typeof h.last === "object") {
          const r = TableLink.int(h.last.r, 0, 1e9),
            n = TableLink.int(h.last.n, 0, 36);
          if (r !== null && n !== null) out.h.last = { r, n };
        }
      }
    }
    return out;
  }

  constructor(events) {
    this.events = events;
    this.id = TableLink.newId(10);
    this.relay = null;
    this.gen = 0;
    this.table = null;
    this.seat = 0;
    this.rank = 0;
    this.seated = false;
    this.peers = new Map();
    this.tables = new Map();
    this.timer = 0;
    this.lastSend = 0;
    this.lastAnnounce = 0;
    this.dirty = false;
    this.moving = false;
    this.solo = false;
  }

  topic(table) {
    return TableLink.ROOT + "t/" + table;
  }

  publish(topic, data) {
    if (this.relay) this.relay.publish(topic, JSON.stringify(data));
  }

  async connect(gen) {
    const relay = await MqttRelay.connectAny(DuelLink.BROKERS, TableLink.ROOT + "#", (topic, text) => this.receive(topic, text, gen));
    if (gen !== this.gen) {
      if (relay) relay.close();
      return false;
    }
    if (!relay) return false;
    this.relay = relay;
    relay.onClose = () => this.dropped(gen);
    return true;
  }

  async enter() {
    this.leave();
    const gen = ++this.gen;
    if (!(await this.connect(gen))) {
      if (gen === this.gen) this.events.failed(TableLink.MSG.offline);
      return;
    }
    await TableLink.wait(TableLink.LISTEN_MS);
    if (gen !== this.gen) return;
    await this.findSeat(gen, null);
  }

  freshTables(skip) {
    const now = Date.now();
    return [...this.tables.entries()]
      .filter(([table, info]) => table !== skip && now - info.seen < TableLink.TABLE_TTL && info.n > 0 && info.n < TableLink.MAX_PLAYERS)
      .sort((a, b) => b[1].n - a[1].n || (a[0] < b[0] ? -1 : 1))
      .map(([table]) => table);
  }

  async findSeat(gen, skip) {
    for (const table of this.freshTables(skip)) {
      if (await this.tryJoin(table, gen)) return;
      if (gen !== this.gen) return;
    }
    this.create();
  }

  async tryJoin(table, gen) {
    this.table = table;
    this.seated = false;
    this.peers.clear();
    this.publish(this.topic(table), { t: "hi", id: this.id });
    await TableLink.wait(TableLink.JOIN_MS);
    if (gen !== this.gen) return false;
    this.prune();
    if (!this.peers.size || this.peers.size >= TableLink.MAX_PLAYERS) {
      this.tables.delete(table);
      this.table = null;
      return false;
    }
    this.rank = Math.max(...[...this.peers.values()].map((peer) => peer.rank)) + 1;
    this.seat = this.freeSeat();
    this.sit(false);
    return true;
  }

  alone() {
    this.leave();
    this.gen++;
    this.solo = true;
    this.create();
  }

  create() {
    this.table = this.solo ? "Solo" : TableLink.newId(6);
    this.peers.clear();
    this.rank = 0;
    this.seat = 0;
    this.sit(true);
  }

  sit(created) {
    this.seated = true;
    this.moving = false;
    this.dirty = true;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), TableLink.TICK_MS);
    this.events.seated(created);
    this.tick();
  }

  freeSeat() {
    const taken = new Set([...this.peers.values()].map((peer) => peer.seat));
    for (let seat = 0; seat < TableLink.MAX_PLAYERS; seat++) if (!taken.has(seat)) return seat;
    return 0;
  }

  get count() {
    return this.peers.size + (this.seated ? 1 : 0);
  }

  get hostId() {
    let best = this.seated ? { id: this.id, rank: this.rank } : null;
    for (const peer of this.peers.values()) if (!best || peer.rank < best.rank || (peer.rank === best.rank && peer.id < best.id)) best = peer;
    return best ? best.id : null;
  }

  get isHost() {
    return this.seated && this.hostId === this.id;
  }

  receive(topic, text, gen) {
    if (gen !== this.gen) return;
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      return;
    }
    if (!data || data.id === this.id) return;
    if (topic === TableLink.ROOT + "lobby") {
      if (data.t === "tbl" && typeof data.table === "string" && data.table.length <= 8) {
        const n = TableLink.int(data.n, 0, 99);
        if (n !== null) this.tables.set(data.table, { n, seen: Date.now() });
      }
      return;
    }
    if (!this.table || topic !== this.topic(this.table)) return;
    if (data.t === "hi") {
      if (this.seated) this.dirty = true;
    } else if (data.t === "bye") {
      if (this.peers.delete(data.id)) this.events.peers();
    } else if (data.t === "p") {
      const peer = TableLink.clean(data);
      if (!peer) return;
      peer.seen = Date.now();
      const known = this.peers.has(peer.id);
      this.peers.set(peer.id, peer);
      if (!this.seated) return;
      this.events.peer(peer, known);
      if (peer.h && peer.id === this.hostId) this.events.host(peer.h);
    }
  }

  prune() {
    const now = Date.now();
    let changed = false;
    for (const [id, peer] of this.peers)
      if (now - peer.seen > TableLink.LOST_MS) {
        this.peers.delete(id);
        changed = true;
      }
    return changed;
  }

  fixSeat() {
    for (const peer of this.peers.values()) {
      if (peer.seat !== this.seat) continue;
      if (peer.rank < this.rank || (peer.rank === this.rank && peer.id < this.id)) {
        this.seat = this.freeSeat();
        this.dirty = true;
        return true;
      }
    }
    return false;
  }

  tick() {
    if (!this.seated) return;
    const now = Date.now();
    if (this.prune() | this.fixSeat()) this.events.peers();
    this.events.tick();
    if ((this.dirty && now - this.lastSend >= TableLink.SEND_GAP) || now - this.lastSend >= TableLink.BEAT_MS) this.sendState();
    if (this.isHost && now - this.lastAnnounce >= TableLink.ANNOUNCE_MS) {
      this.lastAnnounce = now;
      this.publish(TableLink.ROOT + "lobby", { t: "tbl", id: this.id, table: this.table, n: this.count });
    }
    this.mergeCheck();
  }

  sendState() {
    this.dirty = false;
    this.lastSend = Date.now();
    const state = this.events.state();
    this.publish(this.topic(this.table), { t: "p", id: this.id, seat: this.seat, rank: this.rank, ...state });
  }

  touch() {
    this.dirty = true;
  }

  mergeCheck() {
    if (this.solo || this.moving || !this.isHost || this.peers.size || !this.events.canMove()) return;
    const target = this.freshTables(this.table).find((table) => {
      const info = this.tables.get(table);
      return info.n > 1 || table < this.table;
    });
    if (!target) return;
    this.moving = true;
    const gen = this.gen;
    this.bye();
    clearInterval(this.timer);
    this.events.moving();
    this.tryJoin(target, gen).then((ok) => {
      if (gen !== this.gen) return;
      if (!ok) this.create();
    });
  }

  bye() {
    if (this.table && this.seated) this.publish(this.topic(this.table), { t: "bye", id: this.id });
    this.seated = false;
  }

  async dropped(gen) {
    if (gen !== this.gen) return;
    this.relay = null;
    this.events.status(TableLink.MSG.lost);
    for (let i = 0; i < TableLink.RECONNECT_TRIES; i++) {
      await TableLink.wait(TableLink.RECONNECT_MS);
      if (gen !== this.gen) return;
      if (await this.connect(gen)) {
        this.dirty = true;
        this.events.status("");
        return;
      }
    }
    if (gen === this.gen) {
      this.leave();
      this.events.failed(TableLink.MSG.lost);
    }
  }

  leave() {
    this.gen++;
    this.bye();
    clearInterval(this.timer);
    this.timer = 0;
    if (this.relay) this.relay.close();
    this.relay = null;
    this.table = null;
    this.peers.clear();
    this.moving = false;
    this.solo = false;
  }
}
