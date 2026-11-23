class DuelWords {
  static AVOID = 10;

  static random(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  static letters(word) {
    return WordList.plain(word).replace(/[^a-z]/g, "").length;
  }

  constructor(seed) {
    this.next = DuelWords.random(seed);
    this.list = [];
  }

  at(index) {
    while (this.list.length <= index) {
      const recent = this.list.slice(-DuelWords.AVOID);
      let word = "";
      do word = WordList.WORDS[Math.floor(this.next() * WordList.WORDS.length)];
      while (recent.includes(word));
      this.list.push(word);
    }
    return this.list[index];
  }
}
