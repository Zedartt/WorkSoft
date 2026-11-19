class GroomPointer {
  static TAP_PX = 8;
  static TAP_MS = 450;
  static MIN_STEP = 1.5;
  static MAX_TURN = 1.2;
  static TURN_WEIGHT = 40;
  static MAX_TILT = 24;
  static TILT_PER_PX = 1.6;
  static TILT_EASE = 0.3;

  constructor(game, area, cursor) {
    this.game = game;
    this.area = area;
    this.cursor = cursor;
    this.active = null;
    this.box = null;
    this.tilt = 0;
    this.lastX = 0;
  }

  measure(surface) {
    this.box = this.area.getBoundingClientRect();
    surface.measure();
  }

  watch(surface) {
    const element = surface.element;
    element.addEventListener("pointerdown", (event) => this.down(event, surface));
    element.addEventListener("pointermove", (event) => this.move(event, surface));
    element.addEventListener("pointerup", (event) => this.up(event));
    element.addEventListener("pointerenter", () => this.measure(surface));
    element.addEventListener("pointercancel", () => this.release());
    element.addEventListener("pointerleave", () => this.hideCursor());
    element.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  down(event, surface) {
    if (event.button > 0 || this.active) return;
    event.preventDefault();
    this.measure(surface);
    surface.element.setPointerCapture(event.pointerId);
    const local = surface.toLocal(event.clientX, event.clientY);
    this.active = {
      id: event.pointerId,
      surface,
      local,
      startX: event.clientX,
      startY: event.clientY,
      startAt: performance.now(),
      travel: 0,
      angle: null,
      hoof: event.target.closest("[data-hoof]"),
    };
    this.showCursor(event, true);
    this.game.press(surface, local);
  }

  move(event, surface) {
    this.showCursor(event, !!this.active);
    const active = this.active;
    if (!active || active.id !== event.pointerId) return;
    const local = surface.toLocal(event.clientX, event.clientY);
    const dx = local.x - active.local.x;
    const dy = local.y - active.local.y;
    const length = Math.hypot(dx, dy);
    if (length < GroomPointer.MIN_STEP) return;
    active.travel += length * local.scale;
    active.local = local;
    this.game.stroke(surface, local, this.amounts(active, dx, dy, length));
  }

  amounts(active, dx, dy, length) {
    const angle = Math.atan2(dy, dx);
    let turn = 0;
    if (active.angle !== null) {
      turn = angle - active.angle;
      if (turn > Math.PI) turn -= Math.PI * 2;
      if (turn < -Math.PI) turn += Math.PI * 2;
      turn = Math.min(Math.abs(turn), GroomPointer.MAX_TURN);
    }
    active.angle = angle;
    return {
      rub: length,
      right: Math.max(0, dx),
      down: Math.max(0, dy),
      up: Math.max(0, -dy),
      circle: turn * GroomPointer.TURN_WEIGHT,
    };
  }

  up(event) {
    const active = this.active;
    if (!active || active.id !== event.pointerId) return;
    const quick = performance.now() - active.startAt < GroomPointer.TAP_MS;
    const still = Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < GroomPointer.TAP_PX;
    this.release();
    if (quick && still && active.hoof) this.game.liftHoof(+active.hoof.dataset.hoof);
    if (event.pointerType !== "mouse") this.hideCursor();
    else this.showCursor(event, false);
  }

  release() {
    if (!this.active) return;
    this.active = null;
    this.game.releaseTool();
  }

  holding() {
    return this.active;
  }

  showCursor(event, pressed) {
    if (!this.game.tool || !this.box) return this.hideCursor();
    const box = this.box;
    const lean = Math.max(-GroomPointer.MAX_TILT, Math.min(GroomPointer.MAX_TILT, (event.clientX - this.lastX) * GroomPointer.TILT_PER_PX));
    this.lastX = event.clientX;
    this.tilt += (lean - this.tilt) * GroomPointer.TILT_EASE;
    this.cursor.style.transform = `translate(${Math.round(event.clientX - box.left)}px, ${Math.round(event.clientY - box.top)}px)`;
    this.cursor.style.setProperty("--tilt", `${this.tilt.toFixed(1)}deg`);
    this.cursor.classList.add("show");
    this.cursor.classList.toggle("pressed", pressed);
  }

  hideCursor() {
    this.cursor.classList.remove("show", "pressed");
  }
}
