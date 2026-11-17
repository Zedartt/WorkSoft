class FlyingWord {
  static EFFECTS = ["sway", "spin", "shake", "flip", "wave", "pulse"];
  static RAINBOW = [0, 32, 55, 130, 205, 275];
  static TRAIL_MAX = 26;
  static TRAIL_STEP = 5;
  static TOP_MARGIN = 0.14;

  constructor(text, width, area, duration, effectChance) {
    this.text = text;
    this.plain = WordList.plain(text);
    this.width = width;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    const margin = width / 2 + 30;
    this.startX = this.dir > 0 ? -margin : area.w + margin;
    this.distance = area.w + margin * 2;
    this.startY = area.h * (0.45 + Math.random() * 0.35);
    this.endY = area.h * (0.45 + Math.random() * 0.35);
    const highest = Math.min(this.startY, this.endY) - area.h * FlyingWord.TOP_MARGIN;
    this.lift = Math.random() < 0.2 ? 0 : Math.min(highest, area.h * (0.12 + Math.random() * 0.25));
    this.duration = duration;
    this.age = 0;
    this.effect = Math.random() < effectChance ? FlyingWord.EFFECTS[Math.floor(Math.random() * FlyingWord.EFFECTS.length)] : "calm";
    this.spinDir = Math.random() < 0.5 ? 1 : -1;
    this.trailKind = Math.random() < 0.5 ? "rainbow" : "comet";
    this.trail = [];
    this.letters = null;
    this.x = this.startX;
    this.y = this.startY;
  }

  get progress() {
    return this.age / this.duration;
  }

  get gone() {
    return this.age >= this.duration;
  }

  update(dt) {
    this.age += dt;
    const p = Math.min(1, this.progress);
    this.x = this.startX + this.dir * this.distance * p;
    this.y = this.startY + (this.endY - this.startY) * p - this.lift * 4 * p * (1 - p);
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(this.x - last.x, this.y - last.y) >= FlyingWord.TRAIL_STEP) {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > FlyingWord.TRAIL_MAX) this.trail.shift();
    }
  }

  pose() {
    const a = this.age;
    if (this.effect === "sway") return { rot: Math.sin(a * 2.2) * 0.25, scale: 1, dx: 0, dy: 0 };
    if (this.effect === "spin") return { rot: a * 1.1 * this.spinDir, scale: 1, dx: 0, dy: 0 };
    if (this.effect === "shake") return { rot: 0, scale: 1, dx: Math.sin(a * 41) * 1.6, dy: Math.cos(a * 33) * 1.6 };
    if (this.effect === "flip") return { rot: Math.PI, scale: 1, dx: 0, dy: 0 };
    if (this.effect === "pulse") return { rot: 0, scale: 1 + Math.sin(a * 4) * 0.09, dx: 0, dy: 0 };
    return { rot: 0, scale: 1, dx: 0, dy: 0 };
  }

  drawTrail(ctx) {
    if (this.trail.length < 2) return;
    const tail = this.trail[0];
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (this.trailKind === "rainbow") {
      FlyingWord.RAINBOW.forEach((hue, i) => {
        const shift = (i - 2.5) * 4.5,
          gradient = ctx.createLinearGradient(tail.x, tail.y, this.x, this.y);
        gradient.addColorStop(0, `hsla(${hue},85%,62%,0)`);
        gradient.addColorStop(1, `hsla(${hue},85%,62%,.7)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 5;
        this.tracePath(ctx, shift);
        ctx.stroke();
      });
      return;
    }
    const glow = ctx.createLinearGradient(tail.x, tail.y, this.x, this.y);
    glow.addColorStop(0, "rgba(255,200,70,0)");
    glow.addColorStop(1, "rgba(255,214,90,.75)");
    ctx.strokeStyle = glow;
    ctx.lineWidth = 8;
    this.tracePath(ctx, 0);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffd65a";
    for (let i = 1; i < this.trail.length; i += 3) {
      const k = i / this.trail.length,
        twinkle = 0.5 + 0.5 * Math.sin(this.age * 12 + i);
      ctx.globalAlpha = k * twinkle;
      ctx.beginPath();
      ctx.arc(this.trail[i].x + Math.sin(i * 2.3) * 7, this.trail[i].y + Math.cos(i * 1.7) * 7, 1.8, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  tracePath(ctx, shift) {
    ctx.beginPath();
    ctx.moveTo(this.trail[0].x, this.trail[0].y + shift);
    for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y + shift);
  }

  drawText(ctx, fill, outline) {
    const { rot, scale, dx, dy } = this.pose();
    ctx.save();
    ctx.translate(this.x + dx, this.y + dy);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.lineWidth = 6;
    ctx.strokeStyle = outline;
    ctx.fillStyle = fill;
    if (this.effect === "wave") this.drawWave(ctx);
    else {
      ctx.strokeText(this.text, 0, 0);
      ctx.fillText(this.text, 0, 0);
    }
    ctx.restore();
  }

  drawWave(ctx) {
    if (!this.letters) {
      let left = -this.width / 2;
      this.letters = [...this.text].map((letter) => {
        const w = ctx.measureText(letter).width,
          center = left + w / 2;
        left += w;
        return { letter, center };
      });
    }
    this.letters.forEach(({ letter, center }, i) => {
      const lift = Math.sin(this.age * 5 + i * 0.7) * 4;
      ctx.strokeText(letter, center, lift);
      ctx.fillText(letter, center, lift);
    });
  }
}
