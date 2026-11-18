class Order {
  static MENUS = [
    ["plat"],
    ["plat", "boisson"],
    ["entree", "plat"],
    ["plat", "dessert"],
    ["dessert", "boisson"],
    ["entree", "boisson"],
    ["entree", "plat", "boisson"],
    ["plat", "dessert", "boisson"],
    ["entree", "plat", "dessert"],
    ["plat", "plat", "boisson"],
    ["plat", "plat", "dessert"],
    ["entree", "plat", "dessert", "boisson"],
  ];
  static COURSE_NAMES = { entree: "Entrée", plat: "Plat", dessert: "Dessert", boisson: "Boisson" };
  static DISH_POINTS = 10;
  static DRINK_POINTS = 4;
  static FIRST_SIZE = 2;
  static SIZE_STEP = 3;

  constructor(items) {
    this.items = items;
  }

  static courses(served) {
    const size = Math.min(4, Order.FIRST_SIZE + Math.floor(served / Order.SIZE_STEP));
    const menus = Order.MENUS.filter((menu) => menu.length <= size);
    return menus[Math.floor(Math.random() * menus.length)];
  }

  static create(courses, source, avoid) {
    const items = courses.map((course) => {
      if (course === "boisson") return { course, drink: Catalog.drinks[Math.floor(Math.random() * Catalog.drinks.length)], done: false };
      const recipe = source.take(course, avoid);
      avoid.push(recipe.id);
      return { course, recipe, done: false };
    });
    return new Order(items);
  }

  dish() {
    return this.items.find((item) => item.recipe && !item.done) || null;
  }

  drinksLeft() {
    return this.items.filter((item) => item.drink && !item.done);
  }

  needs(drinkId) {
    return this.drinksLeft().some((item) => item.drink.id === drinkId);
  }

  deliverDrink(drinkId) {
    const item = this.drinksLeft().find((left) => left.drink.id === drinkId);
    if (item) item.done = true;
    return Boolean(item);
  }

  complete() {
    return this.items.every((item) => item.done);
  }

  steps() {
    return this.items.reduce((total, item) => total + (item.recipe ? item.recipe.steps.length : 3), 0);
  }

  title() {
    if (this.items.length === 1) return this.items[0].recipe ? this.items[0].recipe.name : this.items[0].drink.name;
    return "Menu " + this.items.map((item) => Order.COURSE_NAMES[item.course].toLowerCase()).join(" + ");
  }

  label(item) {
    return item.recipe ? item.recipe.name : item.drink.name;
  }

  points(patienceRatio) {
    const base = this.items.reduce((sum, item) => sum + (item.recipe ? Order.DISH_POINTS : Order.DRINK_POINTS), 0);
    return Math.round(base * (1 + Math.max(0, patienceRatio)));
  }
}
