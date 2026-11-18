class Step {
  static put(ing, st, txt, how) {
    return { a: "put", ing, st, txt, how };
  }

  static cut(n, txt) {
    return { a: "cut", tool: "knife", n, txt };
  }

  static peel(n, txt) {
    return { a: "peel", tool: "peeler", n, txt };
  }

  static roll(n, txt) {
    return { a: "roll", tool: "roller", n, txt };
  }

  static flip(n, txt) {
    return { a: "flip", tool: "spatula", n, txt };
  }

  static stir(n, txt) {
    return { a: "stir", tool: "spoon", n, txt };
  }

  static shape(n, txt) {
    return { a: "shape", n, txt };
  }

  static heat(st, wait, txt) {
    return { a: "heat", st, wait, txt: txt || Catalog.stations[st].run };
  }

  static move(from, to, txt) {
    return { a: "move", from, to, txt };
  }

  static serve() {
    return { a: "serve", txt: "Pose l'assiette sur le plateau" };
  }
}

class Recipe {
  static SEARCH_URL = "https://www.marmiton.org/recettes/recherche.aspx?aqt=";
  static PLANCHE_ACTIONS = ["cut", "peel", "roll", "shape"];
  constructor(id, name, course, steps, extra = {}) {
    this.id = id;
    this.name = name;
    this.course = course;
    this.steps = [...steps, Step.serve()];
    this.img = extra.img || "";
    this.url = extra.url || "";
    this.origin = extra.origin || "";
    this.original = extra.original || "";
  }

  link() {
    return this.url || Recipe.SEARCH_URL + encodeURIComponent(this.name);
  }

  problems() {
    const content = {};
    for (const id in Catalog.stations) content[id] = 0;
    const issues = [];
    this.steps.forEach((step, index) => {
      const fail = (message) => issues.push(`${index + 1}: ${message}`);
      if (step.a === "put") {
        if (!Catalog.ingredients[step.ing]) fail("ingrédient inconnu " + step.ing);
        content[step.st]++;
      } else if (step.a === "move") {
        if (!content[step.from]) fail("déplacement à vide depuis " + step.from);
        content[step.to] += content[step.from];
        content[step.from] = 0;
      } else if (Recipe.PLANCHE_ACTIONS.includes(step.a) && !content.planche) fail(step.a + " sur une planche vide");
      else if (step.a === "stir" && !content.bol) fail("saladier vide");
      else if (step.a === "flip" && !content.plaque) fail("poêle vide");
      else if (step.a === "heat" && !content[step.st]) fail("cuisson à vide " + step.st);
    });
    const left = Object.keys(content).filter((id) => id !== "assiette" && content[id]);
    if (left.length) issues.push("reste dans " + left.join(", "));
    if (!content.assiette) issues.push("assiette vide");
    return issues;
  }
}
