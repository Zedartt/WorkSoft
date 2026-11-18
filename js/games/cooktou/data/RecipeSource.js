class RecipeSource {
  static API = "https://www.themealdb.com/api/json/v1/1/";
  static TRANSLATE = "https://api.mymemory.translated.net/get";
  static TIMEOUT = 7000;
  static QUEUE = 3;
  static RETRY_MS = 20000;
  static CATEGORIES = {
    entree: ["Starter", "Side", "Side"],
    plat: ["Beef", "Chicken", "Lamb", "Pasta", "Pork", "Seafood", "Vegan", "Vegetarian", "Goat", "Miscellaneous", "Breakfast"],
    dessert: ["Dessert"],
  };
  constructor() {
    this.lists = {};
    this.queues = { entree: [], plat: [], dessert: [] };
    this.loading = { entree: false, plat: false, dessert: false };
    this.seen = new Set();
    this.failedAt = 0;
    this.online = true;
  }

  pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  async json(url) {
    const control = new AbortController();
    const timer = setTimeout(() => control.abort(), RecipeSource.TIMEOUT);
    try {
      const response = await fetch(url, { signal: control.signal });
      if (!response.ok) throw new Error(response.status);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async list(category) {
    if (!this.lists[category]) {
      const data = await this.json(`${RecipeSource.API}filter.php?c=${encodeURIComponent(category)}`);
      this.lists[category] = (data.meals || []).map((meal) => meal.idMeal);
    }
    return this.lists[category];
  }

  async translate(lines) {
    try {
      const query = new URLSearchParams({ q: lines.join("\n"), langpair: "en|fr" });
      const data = await this.json(`${RecipeSource.TRANSLATE}?${query}`);
      const result = String((data.responseData && data.responseData.translatedText) || "").split("\n");
      return data.quotaFinished || result.length !== lines.length ? lines : result.map((line, i) => line.trim() || lines[i]);
    } catch (error) {
      return lines;
    }
  }

  async fetchOne(course) {
    const ids = (await this.list(this.pick(RecipeSource.CATEGORIES[course]))).filter((id) => !this.seen.has(id));
    if (!ids.length) return;
    const id = this.pick(ids);
    this.seen.add(id);
    const data = await this.json(`${RecipeSource.API}lookup.php?i=${id}`);
    const meal = data.meals && data.meals[0];
    if (!meal) return;
    const recipe = RecipeWriter.write(meal, meal.strMeal);
    if (!recipe) return;
    await this.localize(recipe);
    this.queues[recipe.course].push(recipe);
  }

  async localize(recipe) {
    const unknown = [...new Set(recipe.steps.filter((step) => step.ing && step.ing.startsWith("x-")).map((step) => step.ing))];
    const lines = [recipe.original, recipe.origin || "-", ...unknown.map((id) => Catalog.ingredients[id].raw)];
    const translated = (await this.translate(lines)).map((line) => Catalog.safe(line));
    const [name, origin, ...names] = translated;
    const calm = name === name.toUpperCase() ? name.toLowerCase() : name;
    recipe.name = calm.replace(/^./, (letter) => letter.toUpperCase());
    if (recipe.origin) recipe.origin = origin;
    unknown.forEach((id, i) => {
      const before = Catalog.ingredients[id].n;
      Catalog.ingredients[id].n = names[i];
      for (const step of recipe.steps) step.txt = step.txt.split(before.toLowerCase()).join(names[i].toLowerCase());
    });
  }

  fill() {
    if (Date.now() - this.failedAt < RecipeSource.RETRY_MS) return;
    for (const course in this.queues) {
      if (this.loading[course] || this.queues[course].length >= RecipeSource.QUEUE) continue;
      this.loading[course] = true;
      this.fetchOne(course)
        .then(() => (this.online = true))
        .catch(() => {
          this.online = false;
          this.failedAt = Date.now();
        })
        .finally(() => {
          this.loading[course] = false;
          if (this.online) this.fill();
        });
    }
  }

  waiting(courses) {
    return this.online && courses.some((course) => !this.queues[course].length && this.loading[course]);
  }

  take(course, avoid) {
    const queued = this.queues[course].findIndex((recipe) => !avoid.includes(recipe.id));
    const recipe = queued >= 0 ? this.queues[course].splice(queued, 1)[0] : this.offline(course, avoid);
    this.fill();
    return recipe;
  }

  offline(course, avoid) {
    const pool = OfflineRecipes.all.filter((recipe) => recipe.course === course);
    const fresh = pool.filter((recipe) => !avoid.includes(recipe.id));
    return this.pick(fresh.length ? fresh : pool);
  }
}
