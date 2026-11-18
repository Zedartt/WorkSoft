class Game {
  constructor({ id, name, tag, art, help }) {
    this.id = id;
    this.name = name;
    this.tag = tag;
    this.art = art;
    this.help = help;
  }

  open() {}

  close() {}

  pause() {
    if (!this.raf) return false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    return true;
  }

  resume() {
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }
}
