class HorseModels {
  static NAMES = [
    ["Scotty", false], ["Fuego", false], ["As", false], ["Caramel", false], ["Nuage", false], ["Pépite", true], ["Moka", false], ["Luna", true],
    ["Domino", false], ["Biscotte", true], ["Tornade", true], ["Cannelle", true], ["Zorro", false], ["Praline", true], ["Rodéo", false],
    ["Cookie", false], ["Bella", true], ["Shérif", false], ["Noisette", true], ["Cactus", false], ["Mistral", false], ["Perle", true],
  ];
  static UNICORN_NAMES = [["Paillette", true], ["Arc-en-ciel", false], ["Céleste", true], ["Étincelle", true], ["Prisme", false]];
  static UNICORN_CHANCE = 0.06;
  static FANCY_CHANCE = 0.35;
  static COATS = ["#8a4b25", "#b4471c", "#26211f", "#d9a548", "#aeb4bb", "#4f2c1a", "#f2efe8", "#d2b07a", "#efe0c0", "#9a5b3a", "#6d6a70", "#c98a52"];
  static FANCY_COATS = ["#f4a6c6", "#b9a2e8", "#8cc8f0", "#9fe0c0", "#f2c94c", "#f59a6a", "#7fd1d8", "#e07fa8"];
  static MANES = ["#231713", "#e0662a", "#141010", "#f6ecd2", "#5f6670", "#4c3a2c", "#e7e2d8", "#8a5a2e", "#c9a46a"];
  static FANCY_MANES = ["#e5484d", "#2f9be0", "#9a6be0", "#3fae6a", "#ff7ab8", "#ffd23f"];
  static UNICORN_COATS = ["#fbf8f3", "#fbe1ef", "#e6defb", "#dff1fb"];
  static RAINBOW = ["#ff6b8a", "#ffb347", "#ffe066", "#7be0a0", "#6cc2f5", "#b58cf0"];
  static FACES = ["none", "star", "blaze", "snip"];
  static PATTERNS = [null, null, null, "dapple", "spots", "pinto", "dorsal"];
  static SOCK_HEIGHTS = [0, 0, 28, 44, 70];
  static FEATHER_CHANCE = 0.25;
  static LONG_MANE_CHANCE = 0.3;
  static WHITE_FEATHER_CHANCE = 0.5;
  static FIXED = {
    Scotty: { coat: "#c4806c", mane: "#7a3a1e", pattern: "roan" },
    Fuego: { coat: "#b3b8be", mane: "#5f6670", pattern: "dapple", socks: [112, 112, 124, 124], sockColor: "#4a4f57" },
  };

  constructor() {
    this.lastName = "";
  }

  next() {
    const unicorn = Math.random() < HorseModels.UNICORN_CHANCE;
    const [name, mare] = this.name(unicorn ? HorseModels.UNICORN_NAMES : HorseModels.NAMES);
    return unicorn ? HorseModels.unicorn(name, mare) : HorseModels.horse(name, mare);
  }

  name(list) {
    const picked = HorseModels.pick(list.filter(([name]) => name !== this.lastName));
    this.lastName = picked[0];
    return picked;
  }

  static horse(name, mare) {
    const fixed = HorseModels.FIXED[name];
    const fancy = !fixed && Math.random() < HorseModels.FANCY_CHANCE;
    const mane = fixed ? fixed.mane : HorseModels.pick(fancy ? HorseModels.FANCY_MANES : HorseModels.MANES);
    const coat = fixed ? fixed.coat : HorseModels.pick(fancy ? HorseModels.FANCY_COATS : HorseModels.COATS);
    const model = {
      ...HorseModels.colors(coat, mane),
      name,
      mare,
      unicorn: false,
      rainbow: null,
      face: HorseModels.pick(HorseModels.FACES),
      socks: [0, 1, 2, 3].map(() => HorseModels.pick(HorseModels.SOCK_HEIGHTS)),
      feathers: Math.random() < HorseModels.FEATHER_CHANCE,
      featherColor: Math.random() < HorseModels.WHITE_FEATHER_CHANCE ? "#f4f1ea" : mane,
      longMane: Math.random() < HorseModels.LONG_MANE_CHANCE,
      pattern: HorseModels.pick(HorseModels.PATTERNS),
      patch: HorseArt.darken(mane, 0.6),
      sockColor: HorseArt.SOCK,
    };
    if (fixed) Object.assign(model, { pattern: fixed.pattern }, fixed.socks && { socks: fixed.socks, sockColor: fixed.sockColor });
    return model;
  }

  static unicorn(name, mare) {
    return {
      ...HorseModels.colors(HorseModels.pick(HorseModels.UNICORN_COATS), HorseModels.RAINBOW[4]),
      name,
      mare,
      unicorn: true,
      rainbow: HorseModels.RAINBOW,
      face: "none",
      socks: [0, 0, 0, 0],
      feathers: true,
      featherColor: "#ffffff",
      longMane: true,
      pattern: null,
      patch: "#ffffff",
    };
  }

  static colors(color, mane) {
    return {
      color,
      shade: HorseArt.darken(color, 0.72),
      mane,
      maneShade: HorseArt.darken(mane, 0.65),
      hoof: HorseArt.darken(color, 0.5),
      muzzle: HorseArt.darken(color, 0.45),
    };
  }

  static pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }
}
