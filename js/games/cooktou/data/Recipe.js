class Step {
  static put(ing, st, txt) {
    return { a: "put", ing, st, txt };
  }

  static cut(n, txt) {
    return { a: "cut", n, txt };
  }

  static stir(n, txt) {
    return { a: "stir", n, txt };
  }

  static heat(st, wait, txt) {
    return { a: "heat", st, wait, txt: txt || (st === "four" ? "Lance le four" : "Allume le feu et laisse cuire") };
  }

  static move(from, to, txt) {
    return { a: "move", from, to, txt };
  }

  static serve() {
    return { a: "serve", txt: "Apporte l'assiette au client" };
  }
}

class Recipe {
  constructor(id, name, level, steps) {
    this.id = id;
    this.name = name;
    this.level = level;
    this.steps = [...steps, Step.serve()];
  }
}
