class Viewport {
  constructor() {
    this.view = window.visualViewport;
    if (!this.view) return;
    this.view.addEventListener("resize", () => this.update());
    this.view.addEventListener("scroll", () => this.update());
    this.update();
  }

  update() {
    if (Math.abs(this.view.scale - 1) > 0.01) return;
    const root = document.documentElement.style;
    root.setProperty("--app-height", this.view.height + "px");
    root.setProperty("--app-top", this.view.offsetTop + "px");
  }
}
