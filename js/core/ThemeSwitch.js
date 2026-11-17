class ThemeSwitch {
  static KEY = "worksoft_theme";

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
    this.button.textContent = theme === "dark" ? "☀ Mode clair" : "☾ Mode sombre";
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
