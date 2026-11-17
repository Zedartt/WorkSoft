class ThemeSwitch {
  static KEY = "worksoft_theme";
  static colors = new Map();

  static color(name) {
    if (!ThemeSwitch.colors.has(name))
      ThemeSwitch.colors.set(name, getComputedStyle(document.documentElement).getPropertyValue(name).trim());
    return ThemeSwitch.colors.get(name);
  }

  constructor(button) {
    this.button = button;
    const saved = Store.read(ThemeSwitch.KEY);
    const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    this.apply(saved === "dark" || saved === "light" ? saved : preferred);
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => this.toggle());
  }

  get current() {
    return document.documentElement.dataset.theme;
  }

  apply(theme) {
    document.documentElement.dataset.theme = theme;
    ThemeSwitch.colors.clear();
    const label = theme === "dark" ? "Mode clair" : "Mode sombre";
    this.button.querySelector(".theme-icon").textContent = theme === "dark" ? "☀" : "☾";
    this.button.querySelector(".theme-label").textContent = label;
    this.button.setAttribute("aria-label", label);
  }

  toggle() {
    const next = this.current === "dark" ? "light" : "dark";
    this.apply(next);
    Store.write(ThemeSwitch.KEY, next);
    Sfx.play("click");
  }
}

class SoundSwitch {
  constructor(button) {
    this.button = button;
    this.refresh();
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      Sfx.toggle();
      this.refresh();
      Sfx.play("click");
    });
  }

  refresh() {
    this.button.classList.toggle("off", Sfx.muted());
    this.button.title = Sfx.muted() ? "Activer le son" : "Couper le son";
  }
}
