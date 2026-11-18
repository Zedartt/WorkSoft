class RecipeWriter {
  static MAX_INGREDIENTS = 8;
  static MAX_CUT_BATCH = 3;
  static SKIPPED = ["eau"];
  static COURSES = { Starter: "entree", Side: "entree", Dessert: "dessert" };
  static SWEET = /\b(cake|cookies?|brownies?|pudding|dessert|ice cream|pie|tart|muffins?|biscuits?|cupcakes?|fudge|sweet)\b/;
  static METHODS = {
    friteuse: /deep[- ]?fr|deep[- ]fat|fryer|until golden and crisp/,
    four: /\boven\b|\bbake|\broast|\bgratin/,
    plaque: /\bfry|frying pan|skillet|saut[eé]|\bwok\b|\bsear|\bbrown|griddle|\bpan\b/,
    casserole: /\bboil|simmer|\bstew|\bsoup|broth|poach|saucepan|\bpot\b|steam/,
    mixeur: /blend|food processor|liquidi[sz]e|whizz|smooth paste/,
  };

  constructor(meal) {
    this.meal = meal;
    this.text = (meal.strInstructions || "").toLowerCase();
    this.course = RecipeWriter.COURSES[meal.strCategory] || (RecipeWriter.SWEET.test(String(meal.strMeal).toLowerCase()) ? "dessert" : "plat");
    this.steps = [];
    this.used = new Set();
    this.items = this.collect();
  }

  static write(meal, name) {
    const writer = new RecipeWriter(meal);
    if (writer.items.length < 2) return null;
    writer.compose();
    if (!writer.steps.length) return null;
    const id = String(meal.idMeal).replace(/\D/g, "");
    const source = Catalog.safeUrl(meal.strSource) || `https://www.themealdb.com/meal/${id}`;
    const thumb = Catalog.safeUrl(meal.strMealThumb);
    const recipe = new Recipe("meal" + id, Catalog.safe(name || meal.strMeal), writer.course, writer.steps, {
      img: thumb ? thumb + "/small" : "",
      url: source,
      origin: String(meal.strCountry || meal.strArea || ""),
      original: String(meal.strMeal || ""),
    });
    return recipe.problems().length ? null : recipe;
  }

  collect() {
    const ids = [];
    for (let i = 1; i <= 20; i++) {
      const raw = (this.meal["strIngredient" + i] || "").trim();
      if (!raw) continue;
      const id = Catalog.register(raw);
      if (!ids.includes(id) && !RecipeWriter.SKIPPED.includes(id)) ids.push(id);
    }
    return ids.slice(0, RecipeWriter.MAX_INGREDIENTS);
  }

  uses(method) {
    return RecipeWriter.METHODS[method].test(this.text);
  }

  take(...roles) {
    const found = this.items.filter((id) => !this.used.has(id) && roles.includes(Catalog.roleOf(id)));
    found.forEach((id) => this.used.add(id));
    return found;
  }

  name(id) {
    return Catalog.ingredients[id].n.toLowerCase();
  }

  list(ids) {
    return ids.map((id) => this.name(id)).join(", ");
  }

  put(id, st) {
    const role = Catalog.roleOf(id);
    const gesture = Catalog.ingredients[id].how;
    const label = this.name(id);
    const where = Catalog.stations[st].le;
    const verbs = {
      pour: `Verse dans ${where} : ${label}`,
      shake: `Saupoudre dans ${where} : ${label}`,
      crack: `Casse les œufs dans ${where}`,
      grate: `Râpe dans ${where} : ${label}`,
      squeeze: `Presse au-dessus de ${where} : ${label}`,
    };
    const text = st === "planche" ? `Pose sur la planche : ${label}` : verbs[gesture] || (role === "herb" ? `Décore avec : ${label}` : `Ajoute dans ${where} : ${label}`);
    this.steps.push(Step.put(id, st, text));
  }

  putAll(ids, st) {
    ids.forEach((id) => this.put(id, st));
  }

  chop(target) {
    const pieces = this.take("cut", "peel");
    for (let start = 0; start < pieces.length; start += RecipeWriter.MAX_CUT_BATCH) {
      const batch = pieces.slice(start, start + RecipeWriter.MAX_CUT_BATCH);
      this.putAll(batch, "planche");
      const peeled = batch.filter((id) => Catalog.roleOf(id) === "peel");
      if (peeled.length) this.steps.push(Step.peel(2, `Épluche : ${this.list(peeled)}`));
      this.steps.push(Step.cut(3 + batch.length, `Coupe en morceaux : ${this.list(batch)}`));
      this.steps.push(Step.move("planche", target, `Mets-les dans ${Catalog.stations[target].le}`));
    }
    return pieces.length > 0;
  }

  heat(st, wait, text) {
    this.steps.push(Step.heat(st, wait, text));
  }

  serve(from) {
    this.steps.push(Step.move(from, "assiette", "Dresse dans l'assiette"));
  }

  mainStation() {
    if (this.uses("friteuse")) return "friteuse";
    if (this.uses("four") && (this.course === "dessert" || !this.uses("plaque"))) return "four";
    if (this.uses("plaque")) return "plaque";
    if (this.uses("casserole")) return "casserole";
    if (this.uses("four")) return "four";
    if (this.uses("mixeur")) return "mixeur";
    return null;
  }

  compose() {
    const main = this.mainStation();
    const kneaded = this.items.includes("farine") && (this.items.includes("levure") || /\bknead|\bdough\b/.test(this.text));
    if (kneaded) return this.knead(main);
    this.cook(main);
  }

  knead(main) {
    if (main !== "casserole") this.cookStarch();
    this.putAll(this.take("pour", "shake", "crack", "fat"), "bol");
    this.steps.push(Step.stir(2, "Mélange la pâte"));
    this.steps.push(Step.move("bol", "planche", "Verse la pâte sur la planche"));
    this.steps.push(Step.shape(4, "Pétris la pâte à la main"));
    if (/\broll/.test(this.text)) this.steps.push(Step.roll(3, "Étale la pâte au rouleau"));
    const oven = ["plaque", "friteuse", "casserole"].includes(main) ? main : "four";
    this.putAll(this.take("dry", "grate", "squeeze"), "planche");
    this.steps.push(Step.move("planche", oven, `Mets la pâte dans ${Catalog.stations[oven].le}`));
    this.chop(oven);
    this.heat(oven, oven === "four" ? 3.5 : 2.5);
    if (oven === "plaque") {
      this.steps.push(Step.flip(2, "Retourne pour cuire l'autre face"));
      this.heat("plaque", 1.5, "Termine la cuisson");
    }
    this.serve(oven);
    this.garnish();
  }

  cook(main) {
    const batter = this.items.some((id) => ["oeufs", "farine", "sucre"].includes(id)) && (main === "four" || main === "friteuse" || this.course === "dessert");
    if (main !== "casserole") this.cookStarch();
    if (batter) this.mixBatter();
    if (main === "plaque" || main === "casserole") this.stovetop(main, batter);
    else if (main === "four") this.bake(batter);
    else if (main === "friteuse") this.deepFry(batter);
    else this.raw(main === "mixeur" ? "mixeur" : "bol");
    this.garnish();
  }

  cookStarch() {
    const starch = this.take("starch");
    if (!starch.length) return;
    this.putAll(starch, "casserole");
    this.heat("casserole", 2.5, `Fais cuire dans l'eau bouillante : ${this.list(starch)}`);
    this.serve("casserole");
  }

  mixBatter() {
    const parts = this.take("crack", "pour", "shake", "fat").filter((id) => !["huile", "sel"].includes(id));
    if (!parts.length) return;
    this.putAll(parts, "bol");
    this.steps.push(Step.stir(3, "Mélange la pâte"));
  }

  stovetop(main, batter) {
    this.putAll(this.take("fat"), main);
    this.chop(main);
    if (batter && this.hasBowl()) this.steps.push(Step.move("bol", main, `Verse la pâte dans ${Catalog.stations[main].le}`));
    const oven = this.uses("four");
    this.putAll(this.take(...["crack", "shake", "pour", "dry", "starch"], ...(oven ? [] : ["dough", "grate"])), main);
    if (!this.filled(main)) this.putAll(this.take("squeeze", "side"), main);
    this.heat(main, 2.5);
    if (main === "plaque" && this.items.some((id) => Catalog.ingredients[id].at === "frigo")) {
      this.steps.push(Step.flip(2, "Retourne pour cuire l'autre face"));
      this.heat("plaque", 1.5, "Termine la cuisson");
    }
    let current = main;
    if (this.uses("mixeur")) {
      this.steps.push(Step.move(current, "mixeur", "Verse le tout dans le mixeur"));
      this.heat("mixeur", 2);
      current = "mixeur";
    }
    if (this.uses("four") && current !== "four") {
      this.steps.push(Step.move(current, "four", "Mets le tout dans un plat, au four"));
      this.putAll(this.take("dough", "grate"), "four");
      this.heat("four", 3);
      current = "four";
    }
    this.serve(current);
  }

  bake(batter) {
    const dough = this.take("dough");
    if (dough.length) {
      this.putAll(dough, "planche");
      this.steps.push(Step.roll(3, "Étale la pâte au rouleau"));
      this.steps.push(Step.move("planche", "four", "Fonce le moule avec la pâte"));
    }
    if (batter && this.hasBowl()) {
      this.putAll(this.take("dry"), "bol");
      if (this.chop("bol")) this.steps.push(Step.stir(2, "Mélange délicatement"));
      this.steps.push(Step.move("bol", "four", "Verse dans le plat, au four"));
    } else {
      this.putAll(this.take("fat"), "four");
      this.chop("four");
    }
    this.putAll(this.take("pour", "shake", "dry", "crack", "grate", "starch"), "four");
    if (!this.filled("four")) this.putAll(this.take("side", "squeeze"), "four");
    this.heat("four", 3.5);
    this.serve("four");
  }

  deepFry(batter) {
    if (batter && this.hasBowl()) {
      this.chop("bol");
      this.steps.push(Step.stir(2, "Enrobe de pâte"));
      this.steps.push(Step.move("bol", "friteuse", "Plonge dans l'huile bien chaude"));
    } else if (!this.chop("friteuse")) {
      this.putAll(this.take("dry", "dough", "starch", "side"), "friteuse");
    }
    if (!this.filled("friteuse")) this.putAll(this.take("dry", "dough"), "friteuse");
    if (!this.filled("friteuse")) return this.raw("bol");
    this.take("fat");
    this.heat("friteuse", 2.5);
    this.serve("friteuse");
    this.putAll(this.take("shake", "pour", "grate", "dry"), "assiette");
  }

  raw(station) {
    this.chop(station);
    this.putAll(this.take("fat", "pour", "shake", "squeeze", "crack", "grate", "dry", "dough", "starch"), station);
    if (!this.filled(station)) this.putAll(this.take("side", "herb"), station);
    if (!this.filled(station)) return;
    if (station === "mixeur") this.heat("mixeur", 2);
    else this.steps.push(Step.stir(2, "Mélange le tout"));
    this.serve(station);
  }

  garnish() {
    this.putAll(this.take("herb", "squeeze", "side", "grate", "shake", "pour"), "assiette");
  }

  hasBowl() {
    return this.filled("bol");
  }

  filled(st) {
    const content = {};
    for (const step of this.steps) {
      if (step.a === "put") content[step.st] = true;
      if (step.a === "move") {
        if (content[step.from]) content[step.to] = true;
        content[step.from] = false;
      }
    }
    return Boolean(content[st]);
  }
}
