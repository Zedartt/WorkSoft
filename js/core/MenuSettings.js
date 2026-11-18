class MenuSettings {
  constructor() {
    this.button = $("settingsBtn");
    this.panel = $("settings");
    this.button.addEventListener("click", () => (this.isOpen() ? this.close() : this.open()));
    document.addEventListener("pointerdown", (event) => {
      if (this.isOpen() && !this.panel.contains(event.target) && !this.button.contains(event.target)) this.close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !this.isOpen()) return;
      event.preventDefault();
      this.close();
      this.button.focus();
    });
  }

  isOpen() {
    return !this.panel.hidden;
  }

  open() {
    this.panel.hidden = false;
    this.button.setAttribute("aria-expanded", "true");
    this.button.classList.add("on");
    Sfx.play("select");
  }

  close() {
    if (!this.isOpen()) return;
    this.panel.hidden = true;
    this.button.setAttribute("aria-expanded", "false");
    this.button.classList.remove("on");
  }
}
