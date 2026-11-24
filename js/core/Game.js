class Game {
  constructor({ id, name, tag, art, help, record = null }) {
    this.id = id;
    this.name = name;
    this.tag = tag;
    this.art = art;
    this.help = help;
    this.record = record;
  }

  recordValue() {
    return this.record ? +Store.read(this.record.key, 0) || 0 : 0;
  }

  recordText() {
    if (!this.record) return "";
    const value = this.recordValue(),
      label = this.record.label || "Record";
    if (!value) return this.record.none || "Pas encore de record";
    return `${label} : ${value.toLocaleString("fr-FR")}${this.record.unit ? " " + this.record.unit : ""}`;
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
