class ThemeSwitch {
  static KEY = "worksoft_theme";
  static colors = new Map();

  static color(name) {
    if (!ThemeSwitch.colors.has(name))
      ThemeSwitch.colors.set(name, getComputedStyle(document.documentElement).getPropertyValue(name).trim());
    return ThemeSwitch.colors.get(name);
  }

  constructor(buttons) {
    this.buttons = buttons;
    const saved = Store.read(ThemeSwitch.KEY);
    const preferred = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    this.apply(saved === "dark" || saved === "light" ? saved : preferred);
    for (const button of buttons) {
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => this.toggle());
    }
  }

  get current() {
    return document.documentElement.dataset.theme;
  }

  apply(theme) {
    document.documentElement.dataset.theme = theme;
    ThemeSwitch.colors.clear();
    const label = theme === "dark" ? "Mode clair" : "Mode sombre";
    for (const button of this.buttons) {
      button.querySelector(".theme-icon").textContent = theme === "dark" ? "☀" : "☾";
      button.querySelector(".theme-label").textContent = label;
      button.setAttribute("aria-label", label);
    }
  }

  toggle() {
    const next = this.current === "dark" ? "light" : "dark";
    this.apply(next);
    Store.write(ThemeSwitch.KEY, next);
    Sfx.play("click");
  }
}

class SoundSwitch {
  constructor(buttons) {
    this.buttons = buttons;
    this.refresh();
    for (const button of buttons) {
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        Sfx.toggle();
        this.refresh();
        Sfx.play("click");
      });
    }
  }

  refresh() {
    for (const button of this.buttons) {
      button.classList.toggle("off", Sfx.muted());
      button.title = Sfx.muted() ? "Activer le son" : "Couper le son";
    }
  }
}
