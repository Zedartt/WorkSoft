class HoopRules {
  static SHOTS = {
    dunk: { label: "DUNK !", points: 3, color: "#ff4d6d", rgb: "255,77,109", cheer: 1 },
    swish: { label: "SWISH !", points: 3, color: "#ffd447", rgb: "255,212,71", cheer: 0.9 },
    board: { label: "PLANCHE !", points: 2, color: "#4cc3ff", rgb: "76,195,255", cheer: 0.7 },
    rim: { label: "DEDANS !", points: 2, color: "#ff9a3c", rgb: "255,154,60", cheer: 0.6 },
    bounce: { label: "REBOND CHANCEUX", points: 1, color: "#b49bff", rgb: "180,155,255", cheer: 0.5 },
  };
  static PURE_BONUS = 2;
  static KICK_BONUS = 2;
  static TOTAL_BONUS = 3;
  static COMBO_TIME = 20;
  static MULTIPLIERS = [1, 1.5, 2, 2.5, 3, 4];
  static FIRE_COMBO = 3;
  static BEST_KEY = "hooplab_best";

  constructor() {
    this.score = 0;
    this.combo = 0;
    this.comboLeft = 0;
    this.best = Number(Store.read(HoopRules.BEST_KEY, 0)) || 0;
  }

  onFire() {
    return this.combo >= HoopRules.FIRE_COMBO && this.comboLeft > 0;
  }

  tick(dt) {
    if (this.comboLeft <= 0) return 0;
    this.comboLeft -= dt;
    if (this.comboLeft > 0) return 0;
    const ended = this.combo;
    this.combo = 0;
    return ended;
  }

  kind(flight, held) {
    if (held) return "dunk";
    if (flight.floor > 0) return "bounce";
    if (!flight.rim && !flight.board) return "swish";
    return flight.board ? "board" : "rim";
  }

  shot(flight, held, court) {
    const kind = this.kind(flight, held);
    const spec = HoopRules.SHOTS[kind];
    const zone = kind === "dunk" ? HoopCourt.ZONES[0] : court.zoneOf(flight.fromX);
    const trick = {
      pure: flight.thrown && !flight.arc && kind !== "dunk",
      kicks: flight.kicks,
      arc: flight.arc,
      total: flight.thrown && flight.kicks > 0 && flight.arc,
    };
    const names = [];
    let bonus = zone.bonus;
    if (trick.pure) {
      names.push("tir pur");
      bonus += HoopRules.PURE_BONUS;
    }
    if (trick.kicks) {
      names.push(trick.kicks > 1 ? `jongle ×${trick.kicks}` : "jongle");
      bonus += HoopRules.KICK_BONUS * trick.kicks;
    }
    if (trick.arc) names.push("tir en arc");
    if (trick.total) {
      names.push("COMBO TOTAL");
      bonus += HoopRules.TOTAL_BONUS;
    }
    this.combo = this.comboLeft > 0 ? this.combo + 1 : 1;
    this.comboLeft = HoopRules.COMBO_TIME;
    const multiplier = HoopRules.MULTIPLIERS[Math.min(this.combo, HoopRules.MULTIPLIERS.length) - 1];
    const points = Math.round((spec.points + bonus) * multiplier);
    this.score += points;
    if (this.combo > this.best) {
      this.best = this.combo;
      Store.write(HoopRules.BEST_KEY, this.best);
    }
    const detail = [`+${points}`];
    if (zone.bonus) detail.push(zone.name.toLowerCase());
    detail.push(...names);
    if (this.combo > 1) detail.push(`combo ×${String(multiplier).replace(".", ",")}`);
    return { ...spec, kind, zone, trick, points, combo: this.combo, detail: detail.join(" · ") };
  }
}
