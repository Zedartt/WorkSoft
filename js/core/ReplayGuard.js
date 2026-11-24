class ReplayGuard {
  static LOCK_MS = 2000;

  constructor() {
    this.until = 0;
    this.timer = 0;
    this.current = null;
    const watch = new MutationObserver((changes) => {
      for (const change of changes) {
        const end = change.target,
          shown = end.classList.contains("show");
        if (shown && !end.dataset.shown) this.lock(end);
        end.dataset.shown = shown ? "1" : "";
      }
    });
    for (const end of document.querySelectorAll("[data-end]")) watch.observe(end, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("keydown", (event) => this.block(event), true);
    window.addEventListener("keyup", (event) => this.block(event), true);
    for (const type of ["pointerdown", "mousedown", "click"])
      window.addEventListener(type, (event) => {
        if (this.locked() && event.target.closest && event.target.closest("[data-end]")) this.stop(event);
      }, true);
  }

  locked() {
    return performance.now() < this.until;
  }

  lock(end) {
    this.until = performance.now() + ReplayGuard.LOCK_MS;
    if (this.current) this.current.classList.remove("end-lock");
    this.current = end;
    end.classList.remove("end-lock");
    void end.offsetWidth;
    end.classList.add("end-lock");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => end.classList.remove("end-lock"), ReplayGuard.LOCK_MS);
  }

  block(event) {
    if (!this.locked() || (event.key !== "Enter" && event.key !== " ")) return;
    if (event.target.closest && event.target.closest(".help-veil")) return;
    this.stop(event);
  }

  stop(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}
