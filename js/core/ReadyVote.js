class ReadyVote {
  static AUTO_MS = 5000;

  constructor() {
    this.reset();
  }

  reset() {
    this.round = null;
    this.firstAt = 0;
    this.betAt = new Map();
    this.sigs = new Map();
  }

  count(round, list, now) {
    if (round !== this.round) {
      this.reset();
      this.round = round;
    }
    for (const player of list)
      if (this.sigs.get(player.id) !== player.sig) {
        this.sigs.set(player.id, player.sig);
        this.betAt.set(player.id, now);
      }
    const bettors = list.filter((player) => player.bet),
      asked = bettors.some((player) => player.ready);
    if (!asked) this.firstAt = 0;
    else if (!this.firstAt) this.firstAt = now;
    let ready = 0;
    const waits = new Map();
    for (const player of bettors) {
      const autoAt = Math.max(this.firstAt, this.betAt.get(player.id) || now) + ReadyVote.AUTO_MS;
      if (player.ready || (asked && now >= autoAt)) ready++;
      else if (asked) waits.set(player.id, autoAt - now);
    }
    return { ready, needed: bettors.length, go: asked && ready === bettors.length, waits };
  }
}
