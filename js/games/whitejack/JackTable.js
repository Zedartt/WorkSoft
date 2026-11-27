class JackTable {
  static MIN_BET = 1;
  static MAX_BET = 5000;
  static MAX_BONUS = 500;

  constructor() {
    this.shoe = JackRules.shoe();
    this.hole = JackRules.HIDDEN;
    this.holeRound = -1;
    this.mixed = false;
  }

  reshuffle() {
    this.shoe = JackRules.shoe();
    this.mixed = true;
  }

  needsMix() {
    return this.shoe.length < JackRules.size() * JackRules.CUT;
  }

  draw() {
    if (!this.shoe.length) this.reshuffle();
    return this.shoe.pop();
  }

  drawDealer() {
    let card = this.draw();
    while (card === JackRules.BLANK) card = this.draw();
    return card;
  }

  fresh(round) {
    const g = { r: round, ph: "bet", left: -1, d: [], s: [], t: null, ins: {}, mix: this.mixed ? 1 : 0 };
    this.mixed = false;
    return g;
  }

  static clampBet(value, max) {
    const n = Math.floor(Number(value) || 0);
    return Math.max(0, Math.min(max, n));
  }

  deal(g, players, funds) {
    const owners = players.filter((player) => (player.bets[player.seat] || [0])[0] >= JackTable.MIN_BET).sort((a, b) => a.seat - b.seat),
      seats = owners.map((player) => ({ p: player.seat, id: player.id, nm: player.name, h: [{ c: [], s: 0, r: 0, x: 0, p: 0, a: 0 }], f: [], b: {}, w: {} })),
      bySeat = new Map(seats.map((seat) => [seat.p, seat]));
    for (const player of players) {
      let budget = funds(player.id);
      const targets = Object.keys(player.bets)
        .map(Number)
        .sort((a, b) => (b === player.seat) - (a === player.seat) || a - b);
      for (const target of targets) {
        const seat = bySeat.get(target);
        if (!seat || (target === player.seat) !== (seat.id === player.id)) continue;
        const [main, tens, queens] = player.bets[target];
        const m = JackTable.clampBet(main, JackTable.MAX_BET);
        let t = JackTable.clampBet(tens, JackTable.MAX_BONUS),
          q = JackTable.clampBet(queens, JackTable.MAX_BONUS);
        if (m < JackTable.MIN_BET || m > budget) continue;
        budget -= m;
        if (t > budget) t = 0;
        budget -= t;
        if (q > budget) q = 0;
        budget -= q;
        seat.b[player.id] = [m, t, q];
        seat.w[player.id] = [m];
      }
    }
    g.s = seats.filter((seat) => seat.w[seat.id]);
    if (!g.s.length) return 0;
    g.ph = "deal";
    g.d = [];
    g.t = null;
    g.ins = {};
    for (let pass = 0; pass < 2; pass++) {
      for (const seat of g.s) seat.h[0].c.push(this.draw());
      if (pass === 0) g.d.push(this.drawDealer());
      else {
        this.hole = this.drawDealer();
        this.holeRound = g.r;
        g.d.push(JackRules.HIDDEN);
      }
    }
    for (const seat of g.s) {
      seat.f = seat.h[0].c.slice(0, 2);
      if (JackRules.natural(seat.h[0])) seat.h[0].s = 1;
    }
    return g.s.length * 2 + 2;
  }

  holeCard(g) {
    if (this.holeRound !== g.r || this.hole < 0) {
      this.hole = this.drawDealer();
      this.holeRound = g.r;
    }
    return this.hole;
  }

  offersInsurance(g) {
    return JackRules.isAce(g.d[0]);
  }

  insurers(g) {
    const ids = new Set();
    for (const seat of g.s) for (const id of Object.keys(seat.w)) ids.add(id);
    return [...ids];
  }

  insuranceCost(g, id) {
    let main = 0;
    for (const seat of g.s) main += (seat.w[id] || [0])[0] || 0;
    return Math.round(main * 50) / 100;
  }

  insure(g, id, yes, funds) {
    if (g.ph !== "ins" || g.ins[id] !== undefined || !this.insurers(g).includes(id)) return false;
    const cost = this.insuranceCost(g, id);
    g.ins[id] = yes && cost > 0 && funds(id) - JackRules.committed(g, id) >= cost ? cost : 0;
    return true;
  }

  allInsured(g) {
    return this.insurers(g).every((id) => g.ins[id] !== undefined);
  }

  peek(g) {
    const up = g.d[0];
    if (!JackRules.isAce(up) && JackRules.points(up) !== 10) return false;
    const hole = this.holeCard(g);
    if (JackRules.score([up, hole]).total !== 21) return false;
    g.d[1] = hole;
    return true;
  }

  next(g) {
    for (let si = 0; si < g.s.length; si++) {
      const seat = g.s[si];
      for (let hi = 0; hi < seat.h.length; hi++) {
        const hand = seat.h[hi];
        if (hand.s) continue;
        if (hand.c.length === 1) {
          hand.c.push(this.draw());
          if (hand.a) hand.s = 1;
        }
        if (!hand.s && JackRules.score(hand.c).total >= 21) hand.s = 1;
        if (!hand.s) {
          g.t = [si, hi];
          return true;
        }
      }
    }
    g.t = null;
    return false;
  }

  act(g, si, hi, move, funds) {
    const seat = g.s[si],
      hand = seat && seat.h[hi];
    if (!hand || hand.s) return false;
    const owner = seat.id,
      spare = (id, amount) => funds(id) - JackRules.committed(g, id) >= amount;
    if (move === "h") {
      hand.c.push(this.draw());
      if (JackRules.score(hand.c).total >= 21) hand.s = 1;
    } else if (move === "s") hand.s = 1;
    else if (move === "d") {
      const own = (seat.w[owner] || [])[hi] || 0;
      if (!JackRules.canDouble(hand) || !own || !spare(owner, own)) return false;
      for (const [id, stakes] of Object.entries(seat.w)) if (stakes[hi] && (id === owner || spare(id, stakes[hi]))) stakes[hi] *= 2;
      hand.x = 1;
      hand.c.push(this.draw());
      hand.s = 1;
    } else if (move === "p") {
      const own = (seat.w[owner] || [])[hi] || 0;
      if (!JackRules.canSplit(hand, seat.h.length) || !own || !spare(owner, own)) return false;
      const aces = JackRules.isAce(hand.c[0]) ? 1 : 0,
        count = seat.h.length;
      for (const [id, stakes] of Object.entries(seat.w)) {
        while (stakes.length < count) stakes.push(0);
        const base = stakes[hi] || 0,
          follow = base && (id === owner || spare(id, base));
        stakes.splice(hi + 1, 0, follow ? base : 0);
      }
      seat.h.splice(hi + 1, 0, { c: [hand.c.pop()], s: 0, r: 0, x: 0, p: 1, a: aces });
      hand.p = 1;
      hand.a = aces;
      hand.c.push(this.draw());
      if (aces || JackRules.score(hand.c).total >= 21) hand.s = 1;
    } else if (move === "r") {
      if (!JackRules.canSurrender(seat, hand)) return false;
      hand.r = 1;
      hand.s = 1;
    } else return false;
    this.next(g);
    return true;
  }

  live(g) {
    return g.s.some((seat) => seat.h.some((hand) => !hand.r && !JackRules.score(hand.c).bust && !JackRules.natural(hand)));
  }

  dealerStep(g) {
    if (g.d.includes(JackRules.HIDDEN)) {
      g.d[g.d.indexOf(JackRules.HIDDEN)] = this.holeCard(g);
      return true;
    }
    if (this.live(g) && JackRules.dealerHits(g.d)) {
      g.d.push(this.drawDealer());
      return true;
    }
    return false;
  }

  finish(g) {
    const hidden = g.d.indexOf(JackRules.HIDDEN);
    if (hidden >= 0) g.d[hidden] = this.holeCard(g);
    g.ph = "done";
    g.t = null;
  }
}
