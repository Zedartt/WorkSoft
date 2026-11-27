class JackRules {
  static DECKS = 6;
  static BLANKS_PER_DECK = 1;
  static CUT = 0.25;
  static BLANK = 52;
  static HIDDEN = -1;
  static BLACKJACK_PAY = 1.5;
  static INSURANCE_PAY = 2;
  static TENS_PAY = 50;
  static QUEENS_PAY = 250;
  static MAX_HANDS = 4;
  static DEALER_STANDS = 17;
  static RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "V", "D", "R"];
  static SUITS = ["♠", "♥", "♦", "♣"];
  static PHASES = ["bet", "deal", "ins", "play", "dealer", "done"];
  static MOVES = { h: "Tirer", s: "Rester", d: "Doubler", p: "Séparer", r: "Abandonner" };
  static RARITY = { win: 0.25, blackjack: 0.55, insurance: 0.4, tens: 0.85, queens: 1 };

  static size() {
    return JackRules.DECKS * (52 + JackRules.BLANKS_PER_DECK);
  }

  static shoe() {
    const cards = [];
    for (let deck = 0; deck < JackRules.DECKS; deck++) {
      for (let card = 0; card < 52; card++) cards.push(card);
      for (let i = 0; i < JackRules.BLANKS_PER_DECK; i++) cards.push(JackRules.BLANK);
    }
    const random = crypto.getRandomValues(new Uint32Array(cards.length));
    for (let i = cards.length - 1; i > 0; i--) {
      const j = random[i] % (i + 1);
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }

  static rank(card) {
    return card % 13;
  }

  static suit(card) {
    return Math.floor(card / 13);
  }

  static points(card) {
    if (card === JackRules.BLANK) return 0;
    const rank = card % 13;
    return rank === 0 ? 1 : Math.min(10, rank + 1);
  }

  static isAce(card) {
    return card >= 0 && card !== JackRules.BLANK && card % 13 === 0;
  }

  static name(card) {
    if (card === JackRules.BLANK) return "Carte Blanche";
    return JackRules.RANKS[card % 13] + JackRules.SUITS[JackRules.suit(card)];
  }

  static score(cards) {
    let base = 0,
      aces = 0,
      blanks = 0;
    for (const card of cards) {
      if (card < 0) continue;
      if (card === JackRules.BLANK) blanks++;
      else {
        base += JackRules.points(card);
        if (JackRules.isAce(card)) aces++;
      }
    }
    base += blanks;
    let total = base;
    if (base <= 21) {
      const slack = 21 - base;
      if (blanks) total += Math.min(slack, 10 * blanks + (aces ? 10 : 0));
      else if (aces && slack >= 10) total += 10;
    }
    return { total, low: base, soft: total > base && total <= 21, bust: total > 21 };
  }

  static natural(hand) {
    return hand.c.length === 2 && !hand.p && JackRules.score(hand.c).total === 21;
  }

  static dealerNatural(cards) {
    return cards.length === 2 && !cards.includes(JackRules.HIDDEN) && JackRules.score(cards).total === 21;
  }

  static dealerHits(cards) {
    return JackRules.score(cards).total < JackRules.DEALER_STANDS;
  }

  static canDouble(hand) {
    return !hand.s && hand.c.length === 2 && !hand.a;
  }

  static canSplit(hand, count) {
    const [a, b] = hand.c;
    return !hand.s && hand.c.length === 2 && !hand.a && count < JackRules.MAX_HANDS && a !== JackRules.BLANK && b !== JackRules.BLANK && JackRules.points(a) === JackRules.points(b);
  }

  static canSurrender(seat, hand) {
    return !hand.s && seat.h.length === 1 && hand.c.length === 2 && !hand.p;
  }

  static outcome(hand, dealer) {
    if (hand.r) return -0.5;
    const mine = JackRules.score(hand.c);
    if (mine.bust) return -1;
    const natural = JackRules.natural(hand);
    if (JackRules.dealerNatural(dealer)) return natural ? 0 : -1;
    if (natural) return JackRules.BLACKJACK_PAY;
    const house = JackRules.score(dealer);
    if (house.bust || mine.total > house.total) return 1;
    return mine.total === house.total ? 0 : -1;
  }

  static tens(first) {
    return first.length === 2 && first.every((card) => card !== JackRules.BLANK && card % 13 === 9);
  }

  static queens(first) {
    return first.length === 2 && first[0] === first[1] && first[0] !== JackRules.BLANK && first[0] % 13 === 11;
  }

  static committed(g, id) {
    let total = g.ins[id] || 0;
    for (const seat of g.s) {
      for (const stake of seat.w[id] || []) total += stake;
      const bet = seat.b[id];
      if (bet) total += bet[1] + bet[2];
    }
    return total;
  }

  static entry(map, id) {
    if (!map.has(id)) map.set(id, { net: 0, back: 0, rarity: 0, staked: 0 });
    return map.get(id);
  }

  static bonuses(g) {
    const out = new Map();
    for (const seat of g.s)
      for (const [id, bet] of Object.entries(seat.b)) {
        const [, tens, queens] = bet;
        if (!tens && !queens) continue;
        const line = JackRules.entry(out, id);
        if (tens) {
          line.staked += tens;
          if (JackRules.tens(seat.f)) {
            line.net += tens * JackRules.TENS_PAY;
            line.back += tens * (JackRules.TENS_PAY + 1);
            line.rarity = Math.max(line.rarity, JackRules.RARITY.tens);
          } else line.net -= tens;
        }
        if (queens) {
          line.staked += queens;
          if (JackRules.queens(seat.f)) {
            line.net += queens * JackRules.QUEENS_PAY;
            line.back += queens * (JackRules.QUEENS_PAY + 1);
            line.rarity = Math.max(line.rarity, JackRules.RARITY.queens);
          } else line.net -= queens;
        }
      }
    return out;
  }

  static results(g) {
    const out = JackRules.bonuses(g),
      houseNatural = JackRules.dealerNatural(g.d);
    for (const seat of g.s)
      for (const [id, stakes] of Object.entries(seat.w))
        stakes.forEach((stake, i) => {
          const hand = seat.h[i];
          if (!stake || !hand) return;
          const k = JackRules.outcome(hand, g.d),
            line = JackRules.entry(out, id);
          line.staked += stake;
          line.net += stake * k;
          if (k >= 0) line.back += stake * (1 + k);
          if (k > 0) line.rarity = Math.max(line.rarity, k === JackRules.BLACKJACK_PAY ? JackRules.RARITY.blackjack : JackRules.RARITY.win);
        });
    for (const [id, amount] of Object.entries(g.ins)) {
      if (!amount) continue;
      const line = JackRules.entry(out, id);
      line.staked += amount;
      if (houseNatural) {
        line.net += amount * JackRules.INSURANCE_PAY;
        line.back += amount * (JackRules.INSURANCE_PAY + 1);
        line.rarity = Math.max(line.rarity, JackRules.RARITY.insurance);
      } else line.net -= amount;
    }
    for (const line of out.values()) line.net = Math.round(line.net * 100) / 100;
    return out;
  }

  static upValue(card) {
    return JackRules.isAce(card) ? 11 : JackRules.points(card);
  }

  static advice(hand, up, can) {
    const u = JackRules.upValue(up),
      score = JackRules.score(hand.c),
      t = score.total,
      doubleOr = (other) => (can.double ? "d" : other);
    if (can.split) {
      const p = JackRules.points(hand.c[0]);
      if (p === 1 || p === 8) return "p";
      if (p === 9 && u !== 7 && u < 10) return "p";
      if ((p === 2 || p === 3 || p === 7) && u <= 7) return "p";
      if (p === 6 && u <= 6) return "p";
      if (p === 4 && (u === 5 || u === 6)) return "p";
    }
    if (can.surrender && !score.soft && ((t === 16 && u >= 9) || (t === 15 && u === 10))) return "r";
    if (score.soft) {
      if (t >= 19) return "s";
      if (t === 18) return u >= 3 && u <= 6 ? doubleOr("s") : u >= 9 ? "h" : "s";
      if (t === 17) return u >= 3 && u <= 6 ? doubleOr("h") : "h";
      if (t >= 15) return u >= 4 && u <= 6 ? doubleOr("h") : "h";
      if (t >= 13) return u >= 5 && u <= 6 ? doubleOr("h") : "h";
      return "h";
    }
    if (t >= 17) return "s";
    if (t >= 13) return u <= 6 ? "s" : "h";
    if (t === 12) return u >= 4 && u <= 6 ? "s" : "h";
    if (t === 11) return u <= 10 ? doubleOr("h") : "h";
    if (t === 10) return u <= 9 ? doubleOr("h") : "h";
    if (t === 9) return u >= 3 && u <= 6 ? doubleOr("h") : "h";
    return "h";
  }

  static cleanTable(h) {
    if (!h || typeof h !== "object") return null;
    const int = TableLink.int,
      num = TableLink.num,
      r = int(h.r, 0, 1e9),
      left = int(h.left, -1, 600000);
    if (r === null || left === null || !JackRules.PHASES.includes(h.ph)) return null;
    const id = (value) => (typeof value === "string" && value.length > 0 && value.length <= 20 ? value : null),
      cards = (list, max) => (Array.isArray(list) ? list.slice(0, max).map((card) => int(card, -1, 52)).filter((card) => card !== null) : []),
      amounts = (list, max) => (Array.isArray(list) ? list.slice(0, max).map((value) => num(value, 0, 1e9) || 0) : []),
      table = (object, read) => {
        const out = {};
        if (object && typeof object === "object" && !Array.isArray(object))
          for (const [key, value] of Object.entries(object).slice(0, 12)) if (id(key)) out[key] = read(value);
        return out;
      },
      flag = (value) => (value ? 1 : 0);
    const g = { r, ph: h.ph, left, d: cards(h.d, 14), s: [], t: null, ins: table(h.ins, (value) => num(value, 0, 1e9) || 0), mix: flag(h.mix) };
    if (Array.isArray(h.s))
      for (const seat of h.s.slice(0, 10)) {
        if (!seat || typeof seat !== "object") continue;
        const p = int(seat.p, 0, 9),
          owner = id(seat.id);
        if (p === null || !owner || !Array.isArray(seat.h)) continue;
        const hands = seat.h.slice(0, JackRules.MAX_HANDS).map((hand) => {
          const ok = hand && typeof hand === "object";
          return { c: cards(ok && hand.c, 14), s: flag(ok && hand.s), r: flag(ok && hand.r), x: flag(ok && hand.x), p: flag(ok && hand.p), a: flag(ok && hand.a) };
        });
        if (!hands.length) continue;
        const bets = table(seat.b, (value) => {
          const list = amounts(value, 3);
          return [list[0] || 0, list[1] || 0, list[2] || 0];
        });
        g.s.push({ p, id: owner, nm: TableLink.text(seat.nm, 16) || "?", h: hands, f: cards(seat.f, 2), b: bets, w: table(seat.w, (value) => amounts(value, JackRules.MAX_HANDS)) });
      }
    if (Array.isArray(h.t)) {
      const si = int(h.t[0], 0, 9),
        hi = int(h.t[1], 0, JackRules.MAX_HANDS - 1);
      if (si !== null && hi !== null && g.s[si] && g.s[si].h[hi]) g.t = [si, hi];
    }
    return g;
  }
}
