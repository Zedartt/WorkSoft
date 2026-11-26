class RouletteRules {
  static ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  static REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  static HEX = { red: "#d42a32", black: "#1b1d22", green: "#0c8a4a" };
  static NAMES = { red: "Rouge", black: "Noir", green: "Vert" };
  static BETS = RouletteRules.build();

  static color(n) {
    if (n === 0) return "green";
    return RouletteRules.REDS.has(n) ? "red" : "black";
  }

  static build() {
    const bets = [];
    bets.push({ key: "n0", text: "0", label: "Plein 0", mult: 35, wins: (n) => n === 0, h: [1, 1, 1, 3], v: [3, 1, 3, 1], color: "green" });
    for (let n = 1; n <= 36; n++) {
      const k = Math.ceil(n / 3),
        line = (n - 1) % 3;
      bets.push({ key: "n" + n, text: String(n), label: "Plein " + n, mult: 35, wins: (x) => x === n, h: [k + 1, 3 - line, 1, 1], v: [3 + line, k + 1, 1, 1], color: RouletteRules.color(n) });
    }
    for (let c = 1; c <= 3; c++) bets.push({ key: "c" + c, text: "2:1", label: `Colonne ${c}`, mult: 2, wins: (n) => n > 0 && (n - 1) % 3 === c - 1, h: [14, 4 - c, 1, 1], v: [2 + c, 14, 1, 1] });
    for (let d = 1; d <= 3; d++) bets.push({ key: "d" + d, text: `${d * 12 - 11}-${d * 12}`, label: `${d === 1 ? "1re" : d + "e"} douzaine (${d * 12 - 11} à ${d * 12})`, mult: 2, wins: (n) => n > 0 && Math.ceil(n / 12) === d, h: [2 + (d - 1) * 4, 4, 4, 1], v: [2, 2 + (d - 1) * 4, 1, 4] });
    const outside = [
      { key: "low", text: "1-18", label: "Manque (1 à 18)", wins: (n) => n >= 1 && n <= 18 },
      { key: "even", text: "Pair", label: "Pair", wins: (n) => n > 0 && n % 2 === 0 },
      { key: "red", text: "", label: "Rouge", wins: (n) => RouletteRules.color(n) === "red", color: "red", diamond: true },
      { key: "black", text: "", label: "Noir", wins: (n) => RouletteRules.color(n) === "black", color: "black", diamond: true },
      { key: "odd", text: "Impair", label: "Impair", wins: (n) => n % 2 === 1 },
      { key: "high", text: "19-36", label: "Passe (19 à 36)", wins: (n) => n >= 19 },
    ];
    outside.forEach((bet, i) => bets.push({ ...bet, mult: 1, h: [2 + i * 2, 5, 2, 1], v: [1, 2 + i * 2, 1, 2] }));
    return bets;
  }

  static bet(key) {
    return RouletteRules.BETS.find((bet) => bet.key === key) || null;
  }

  static payout(key, amount, n) {
    const bet = RouletteRules.bet(key);
    return bet && bet.wins(n) ? amount * (bet.mult + 1) : 0;
  }

  static rarity(key) {
    const bet = RouletteRules.bet(key);
    return bet ? Math.log(bet.mult + 1) / Math.log(36) : 0;
  }

  static odds(key) {
    const bet = RouletteRules.bet(key);
    if (!bet) return 0;
    let count = 0;
    for (let n = 0; n <= 36; n++) if (bet.wins(n)) count++;
    return count / 37;
  }

  static name(n) {
    return n === 0 ? "0 Vert" : `${n} ${RouletteRules.NAMES[RouletteRules.color(n)]}`;
  }
}
