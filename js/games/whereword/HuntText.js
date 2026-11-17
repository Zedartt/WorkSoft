class HuntText {
  static WORD = /[\p{L}\p{N}]+/gu;
  static MIN_LETTERS = 4;
  static FREQUENT_CHANCE = 0.5;
  static COMMON = new Set(
    (
      "avec dans pour par sur sous entre vers chez sans mais donc puis ainsi aussi alors encore toujours " +
      "elle elles ils eux leur leurs nous vous cette ces celui celle ceux celles dont tout tous toute toutes " +
      "être etre avoir sont était etait étaient etaient fait faire peut plus moins très tres comme selon " +
      "après apres avant depuis pendant lors quand lequel laquelle lesquels autre autres même meme"
    )
      .split(" ")
      .map((word) => TextRules.fold(word)),
  );

  constructor(blocks) {
    this.counts = new Map();
    this.forms = new Map();
    this.blocks = blocks.map((block) => ({ heading: block.heading, parts: this.split(block.text) }));
  }

  split(text) {
    const parts = [];
    let last = 0;
    for (const match of text.matchAll(HuntText.WORD)) {
      if (match.index > last) parts.push({ text: text.slice(last, match.index), key: null });
      const key = TextRules.fold(match[0]);
      parts.push({ text: match[0], key });
      this.counts.set(key, (this.counts.get(key) || 0) + 1);
      const form = this.forms.get(key);
      if (!form || (form !== form.toLowerCase() && match[0] === match[0].toLowerCase())) this.forms.set(key, match[0]);
      last = match.index + match[0].length;
    }
    if (last < text.length) parts.push({ text: text.slice(last), key: null });
    return parts;
  }

  eligible(key) {
    return key.length >= HuntText.MIN_LETTERS && !/^\d+$/.test(key) && !HuntText.COMMON.has(key);
  }

  pickTarget() {
    let keys = [...this.counts.keys()].filter((key) => this.eligible(key));
    if (!keys.length) keys = [...this.counts.keys()];
    if (Math.random() < HuntText.FREQUENT_CHANCE) keys = keys.flatMap((key) => Array(this.counts.get(key)).fill(key));
    const key = keys[Math.floor(Math.random() * keys.length)];
    return { key, label: this.forms.get(key), count: this.counts.get(key) };
  }
}
