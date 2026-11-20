class WheelStore {
  static KEY = "wheeeeel_wheels";
  static CURRENT = "wheeeeel_current";
  static MIN_CELLS = 2;
  static MAX_CELLS = 24;
  static MAX_TEXT = 40;
  static MAX_NAME = 40;
  static DEFAULT = { id: "vrai-faux", name: "Vrai ou faux ?", cells: ["Vrai", "Faux"], colors: [null, null] };

  constructor() {
    this.wheels = this.load();
    const saved = Store.read(WheelStore.CURRENT);
    this.currentId = this.wheels.some((wheel) => wheel.id === saved) ? saved : this.wheels[0].id;
  }

  load() {
    let list = [];
    try {
      const data = JSON.parse(Store.read(WheelStore.KEY, "[]"));
      if (Array.isArray(data)) list = data.map((wheel) => WheelStore.tidy(wheel)).filter(Boolean);
    } catch (error) {}
    return list.length ? list : [WheelStore.copy(WheelStore.DEFAULT)];
  }

  static copy(wheel) {
    return { id: wheel.id, name: wheel.name, cells: wheel.cells.slice(), colors: wheel.colors.slice() };
  }

  static tidy(wheel) {
    if (!wheel || typeof wheel.id !== "string" || !Array.isArray(wheel.cells)) return null;
    const colors = Array.isArray(wheel.colors) ? wheel.colors : [];
    const pairs = wheel.cells
      .map((text, i) => [String(text).trim().slice(0, WheelStore.MAX_TEXT), WheelStore.color(colors[i])])
      .filter((pair) => pair[0])
      .slice(0, WheelStore.MAX_CELLS);
    if (pairs.length < WheelStore.MIN_CELLS) return null;
    const name = String(wheel.name || "").trim().slice(0, WheelStore.MAX_NAME) || "Ma roue";
    return { id: wheel.id, name, cells: pairs.map((pair) => pair[0]), colors: pairs.map((pair) => pair[1]) };
  }

  static color(value) {
    return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : null;
  }

  save() {
    Store.write(WheelStore.KEY, JSON.stringify(this.wheels));
    Store.write(WheelStore.CURRENT, this.currentId);
  }

  current() {
    return this.wheels.find((wheel) => wheel.id === this.currentId) || this.wheels[0];
  }

  select(id) {
    if (!this.wheels.some((wheel) => wheel.id === id)) return;
    this.currentId = id;
    this.save();
  }

  put(draft) {
    const wheel = WheelStore.tidy(draft);
    if (!wheel) return null;
    const index = this.wheels.findIndex((item) => item.id === wheel.id);
    if (index < 0) this.wheels.push(wheel);
    else this.wheels[index] = wheel;
    this.currentId = wheel.id;
    this.save();
    return wheel;
  }

  remove(id) {
    this.wheels = this.wheels.filter((wheel) => wheel.id !== id);
    if (!this.wheels.length) this.wheels.push(WheelStore.copy(WheelStore.DEFAULT));
    if (this.currentId === id) this.currentId = this.wheels[0].id;
    this.save();
  }

  static newId() {
    return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }
}
