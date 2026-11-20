class WheelPainter {
  static PALETTE = ["#e53935", "#1e63d6", "#fbc02d", "#2e9d4a", "#fb8c00", "#8e24aa", "#00acc1", "#d81b60", "#7cb342", "#5e35b1", "#00897b", "#6d4c41"];
  static RIM = 0.075;
  static HUB = 0.15;
  static MIN_FONT = 10;
  static HUES = 24;
  static LEDS = 40;
  static BEAM_COLORS = ["#ff2bd6", "#2be0ff", "#ffe02b", "#7b2bff", "#2bff8a", "#ff5a2b", "#ffffff", "#2b6bff", "#ff2b5a", "#b6ff2b"];

  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.cx = 0;
    this.cy = 0;
    this.r = 0;
    this.face = null;
    this.faceKey = "";
    this.sprites = {};
    this.theme = "";
    this.look = null;
    this.show = null;
    this.newShow();
  }

  resize(w, h) {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.cx = w / 2;
    this.cy = h / 2 + Math.min(10, h * 0.02);
    this.r = Math.max(40, Math.min(w * 0.42, (h - 60) * 0.44));
    this.faceKey = "";
  }

  static colors(count, custom = []) {
    const list = [];
    const size = WheelPainter.PALETTE.length;
    for (let i = 0; i < count; i++) list.push(custom[i] || WheelPainter.PALETTE[i % size]);
    if (count > 2 && !custom[count - 1]) {
      let k = count;
      while ((list[count - 1] === list[0] || list[count - 1] === list[count - 2]) && k < count + size) list[count - 1] = WheelPainter.PALETTE[++k % size];
    }
    return list;
  }

  static rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }

  static shade(hex, amount) {
    const mix = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
    const [r, g, b] = WheelPainter.rgb(hex);
    return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
  }

  static light(hex) {
    const [r, g, b] = WheelPainter.rgb(hex);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.66;
  }

  static soft(color, alpha = 0.35) {
    if (color[0] === "#") return `rgba(${WheelPainter.rgb(color).join(",")},${alpha})`;
    return color.replace("hsl(", "hsla(").replace(")", `,${alpha})`);
  }

  static hue(h) {
    const step = 360 / WheelPainter.HUES;
    return `hsl(${(Math.round((((h % 360) + 360) % 360) / step) * step) % 360},100%,62%)`;
  }

  buildFace(cells, colors) {
    const key = `${this.r}|${this.dpr}|${cells.join("\u0001")}|${colors.join(",")}`;
    if (key === this.faceKey) return;
    this.faceKey = key;
    const size = Math.ceil(this.r * 2 * this.dpr);
    const face = document.createElement("canvas");
    face.width = size;
    face.height = size;
    const g = face.getContext("2d");
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.translate(this.r, this.r);
    const r = this.r;
    const seg = (Math.PI * 2) / cells.length;
    cells.forEach((text, i) => {
      const a0 = -Math.PI / 2 + i * seg;
      const fill = g.createRadialGradient(0, 0, r * 0.15, 0, 0, r);
      fill.addColorStop(0, WheelPainter.shade(colors[i], 0.12));
      fill.addColorStop(0.75, colors[i]);
      fill.addColorStop(1, WheelPainter.shade(colors[i], -0.18));
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, r, a0, a0 + seg);
      g.closePath();
      g.fillStyle = fill;
      g.fill();
    });
    g.strokeStyle = "rgba(255,255,255,.85)";
    g.lineWidth = Math.max(1.2, r * 0.008);
    cells.forEach((_, i) => {
      const a = -Math.PI / 2 + i * seg;
      g.beginPath();
      g.moveTo(0, 0);
      g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      g.stroke();
    });
    cells.forEach((text, i) => this.label(g, text, -Math.PI / 2 + (i + 0.5) * seg, seg, WheelPainter.light(colors[i]) ? "#1b1f2a" : "#fff"));
    const shine = g.createLinearGradient(0, -r, 0, r);
    shine.addColorStop(0, "rgba(255,255,255,.12)");
    shine.addColorStop(0.5, "rgba(255,255,255,0)");
    shine.addColorStop(1, "rgba(0,0,0,.12)");
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fillStyle = shine;
    g.fill();
    this.face = face;
  }

  label(g, text, angle, seg, ink) {
    const r = this.r;
    const inner = r * (WheelPainter.HUB + 0.06);
    const outer = r * 0.9;
    const room = outer - inner;
    const mid = (inner + outer) / 2;
    const height = Math.sin(Math.min(seg, Math.PI / 2) / 2) * mid * 1.7;
    const top = Math.min(r * 0.12, height * 0.78);
    const font = (s) => `700 ${s}px "Segoe UI", system-ui, sans-serif`;
    const fit = (lines) => {
      let size = Math.min(top, height / (lines.length * 1.1));
      g.font = font(size);
      while (size > WheelPainter.MIN_FONT && Math.max(...lines.map((line) => g.measureText(line).width)) > room) {
        size -= 1;
        g.font = font(size);
      }
      return { lines, size };
    };
    let best = fit([text]);
    const spaces = [...text.matchAll(/ /g)].map((m) => m.index);
    if (spaces.length && best.size < top * 0.75) {
      const cut = spaces.reduce((a, b) => (Math.abs(b - text.length / 2) < Math.abs(a - text.length / 2) ? b : a));
      const two = fit([text.slice(0, cut), text.slice(cut + 1)]);
      if (two.size > best.size) best = two;
    }
    g.save();
    g.rotate(angle);
    g.textAlign = "right";
    g.textBaseline = "middle";
    g.font = font(best.size);
    g.fillStyle = ink;
    g.shadowColor = ink === "#fff" ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.35)";
    g.shadowBlur = best.size * 0.25;
    const step = best.size * 1.05;
    best.lines.forEach((line, i) => {
      let shown = line;
      while (shown.length > 1 && g.measureText(shown).width > room) shown = `${shown.slice(0, -2)}…`;
      g.fillText(shown, outer, (i - (best.lines.length - 1) / 2) * step);
    });
    g.restore();
  }

  static pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  static between(a, b) {
    return a + Math.random() * (b - a);
  }

  newShow() {
    const pool = WheelPainter.BEAM_COLORS.slice().sort(() => Math.random() - 0.5);
    const count = 5 + Math.floor(Math.random() * 5);
    this.show = {
      beams: pool.slice(0, count).map(() => ({
        color: pool[Math.floor(Math.random() * pool.length)],
        speed: WheelPainter.between(0.5, 2.8),
        dir: Math.random() < 0.5 ? -1 : 1,
        phase: Math.random() * Math.PI * 2,
        wobble: WheelPainter.between(0, 1),
        wobbleSpeed: WheelPainter.between(1, 6),
        width: WheelPainter.between(0.04, 0.12),
        flicker: WheelPainter.between(3, 14),
      })),
      led: WheelPainter.pick(["chase", "bounce", "sparkle", "wave", "split"]),
      ledSpeed: WheelPainter.between(0.7, 1.6),
      hueSpeed: WheelPainter.between(200, 700) * (Math.random() < 0.5 ? -1 : 1),
      hueSpread: WheelPainter.between(1, 3),
      final: WheelPainter.pick(["converge", "fan", "sweep"]),
      finalLed: WheelPainter.pick(["race", "pulse", "alternate"]),
      strobe: WheelPainter.between(0.5, 1.6),
    };
  }

  syncTheme() {
    const theme = document.documentElement.dataset.theme || "light";
    if (theme === this.theme) return;
    this.theme = theme;
    this.sprites = {};
    const v = (name) => ThemeSwitch.color(`--wl-${name}`);
    this.look = {
      rim: [v("rim-a"), v("rim-b"), v("rim-c")],
      rimEdge: v("rim-edge"),
      ledOff: v("led-off"),
      ledSocket: v("led-socket"),
      hub: [v("hub-a"), v("hub-b")],
      hubRing: v("hub-ring"),
      pointer: [v("pointer-a"), v("pointer-b")],
      pointerEye: v("pointer-eye"),
      shadow: v("shadow"),
      flare: v("flare"),
      glow: v("glow") || "lighter",
      glowAlpha: parseFloat(v("glow-alpha")) || 1,
      core: v("core") === "white",
    };
  }

  sprite(color) {
    if (this.sprites[color]) return this.sprites[color];
    const size = 64;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, this.look.core ? "rgba(255,255,255,1)" : color);
    grad.addColorStop(0.18, color);
    grad.addColorStop(0.45, WheelPainter.soft(color));
    grad.addColorStop(1, WheelPainter.soft(color, 0));
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    this.sprites[color] = c;
    return c;
  }

  clear() {
    this.syncTheme();
    const g = this.ctx;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
  }

  glowMode(g, alpha) {
    g.globalCompositeOperation = this.look.glow;
    g.globalAlpha = Math.max(0, Math.min(1, alpha * this.look.glowAlpha));
  }

  halo(color, power) {
    if (power <= 0.01) return;
    const g = this.ctx;
    const grad = g.createRadialGradient(this.cx, this.cy, this.r * 0.7, this.cx, this.cy, this.r * 2);
    grad.addColorStop(0, WheelPainter.soft(color, 1));
    grad.addColorStop(1, WheelPainter.soft(color, 0));
    g.save();
    this.glowMode(g, Math.min(1, power));
    g.fillStyle = grad;
    g.fillRect(0, 0, this.w, this.h);
    g.restore();
  }

  static turnTo(from, to, k) {
    const d = ((((to - from) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return from + d * k;
  }

  beams(time, power, focus) {
    if (power <= 0.02 || !this.show) return;
    const g = this.ctx;
    const length = Math.hypot(this.w, this.h);
    const list = this.show.beams;
    const n = list.length;
    g.save();
    g.translate(this.cx, this.cy);
    list.forEach((b, i) => {
      const wild = b.phase + time * b.speed * b.dir + Math.sin(time * b.wobbleSpeed + b.phase) * b.wobble;
      let aim;
      let width = b.width;
      if (this.show.final === "fan") {
        aim = -Math.PI / 2 + (i - (n - 1) / 2) * (Math.PI / (n + 1));
      } else if (this.show.final === "sweep") {
        aim = time * 5 + (i / n) * Math.PI * 2;
      } else {
        aim = -Math.PI / 2 + (i - (n - 1) / 2) * 0.08;
        width *= 1 - focus * 0.5;
      }
      const a = WheelPainter.turnTo(wild, aim, focus);
      const grad = g.createRadialGradient(0, 0, this.r * 0.2, 0, 0, length);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, WheelPainter.soft(b.color, 0));
      this.glowMode(g, power * (0.26 + 0.12 * Math.sin(time * b.flicker + i * 2)));
      g.fillStyle = grad;
      g.beginPath();
      g.moveTo(0, 0);
      g.arc(0, 0, length, a - width, a + width);
      g.closePath();
      g.fill();
    });
    g.restore();
  }

  strobe(power, color) {
    if (power <= 0) return;
    const g = this.ctx;
    g.save();
    this.glowMode(g, power);
    g.fillStyle = this.look.core ? color : WheelPainter.soft(color, 1);
    g.fillRect(0, 0, this.w, this.h);
    g.restore();
  }

  wheel(angle, scale, cells, colors) {
    this.buildFace(cells, colors);
    const g = this.ctx;
    const r = this.r;
    const outer = r * (1 + WheelPainter.RIM);
    const look = this.look;
    g.save();
    g.translate(this.cx, this.cy);
    g.scale(scale, scale);
    g.fillStyle = look.shadow;
    g.beginPath();
    g.arc(0, r * 0.05, outer * 1.03, 0, Math.PI * 2);
    g.fill();
    const rim = g.createLinearGradient(0, -outer, 0, outer);
    rim.addColorStop(0, look.rim[0]);
    rim.addColorStop(0.5, look.rim[1]);
    rim.addColorStop(1, look.rim[2]);
    g.fillStyle = rim;
    g.beginPath();
    g.arc(0, 0, outer, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = look.rimEdge;
    g.lineWidth = 1.5;
    g.stroke();
    g.save();
    g.rotate(angle);
    g.drawImage(this.face, -r, -r, r * 2, r * 2);
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.9)";
    g.lineWidth = Math.max(1.5, r * 0.01);
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }

  winner(angle, scale, index, count, power) {
    if (power <= 0) return;
    const g = this.ctx;
    const seg = (Math.PI * 2) / count;
    const a0 = -Math.PI / 2 + index * seg;
    g.save();
    g.translate(this.cx, this.cy);
    g.scale(scale, scale);
    g.rotate(angle);
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = power;
    const grad = g.createRadialGradient(0, 0, this.r * 0.2, 0, 0, this.r);
    grad.addColorStop(0, "rgba(255,255,255,.05)");
    grad.addColorStop(1, "rgba(255,255,255,.6)");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, this.r, a0, a0 + seg);
    g.closePath();
    g.fill();
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = "#fff";
    g.lineWidth = Math.max(3, this.r * 0.02);
    g.stroke();
    g.restore();
  }

  ledLevel(i, count, time, mode, energy) {
    const show = this.show;
    const speed = show.ledSpeed;
    if (mode === "final") {
      if (show.finalLed === "pulse") return Math.floor(time * 16) % 2 ? 1 : 0.2;
      if (show.finalLed === "alternate") return (i + Math.floor(time * 14)) % 2 ? 1 : 0.15;
      const side = Math.abs(((i + count / 2) % count) - count / 2);
      return ((side - time * 30) % 4 + 4) % 4 < 1.6 ? 1 : 0.2;
    }
    const low = 0.12 + Math.random() * 0.3 * energy;
    if (show.led === "bounce") {
      const at = ((Math.sin(time * speed * 4) + 1) / 2) * (count / 2);
      const side = Math.abs(((i + count / 2) % count) - count / 2);
      return Math.abs(side - at) < 2.5 ? 1 : low;
    }
    if (show.led === "sparkle") return Math.random() < 0.3 + energy * 0.2 ? 1 : low;
    if (show.led === "wave") return Math.max(low, 0.5 + 0.5 * Math.sin(i * 0.7 - time * speed * 14));
    if (show.led === "split") {
      const phase = time * (10 + energy * 25) * speed;
      return ((i - phase) % 8 + 8) % 8 < 2 || ((i + phase) % 8 + 8) % 8 < 2 ? 1 : low;
    }
    const phase = time * (10 + energy * 30) * speed;
    return ((i - phase) % 6 + 6) % 6 < 2 ? 1 : low;
  }

  leds(time, mode, energy, scale, accent) {
    const g = this.ctx;
    const look = this.look;
    const r = this.r * (1 + WheelPainter.RIM / 2);
    const count = WheelPainter.LEDS;
    const size = Math.max(2, this.r * 0.014);
    g.save();
    g.translate(this.cx, this.cy);
    g.scale(scale, scale);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      let on = 0;
      let color = look.flare;
      if (mode === "spin") {
        on = this.ledLevel(i, count, time, mode, energy);
        color = WheelPainter.hue(i * (360 / count) * this.show.hueSpread + time * this.show.hueSpeed);
      } else if (mode === "final") {
        on = this.ledLevel(i, count, time, mode, energy);
        color = Math.floor(time * 16) % 2 ? accent : look.flare;
      } else if (mode === "win") {
        on = Math.floor(time * 14) % 2 ? 1 : 0.2;
        color = i % 2 ? accent : look.flare;
      }
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;
      g.fillStyle = mode === "idle" ? look.ledOff : look.ledSocket;
      g.beginPath();
      g.arc(x, y, size, 0, Math.PI * 2);
      g.fill();
      if (on <= 0) continue;
      this.glowMode(g, on);
      const glow = size * (3 + on * 4);
      g.drawImage(this.sprite(color), x - glow, y - glow, glow * 2, glow * 2);
    }
    g.restore();
  }

  hub(glow, scale, accent) {
    const g = this.ctx;
    const look = this.look;
    const r = this.r * WheelPainter.HUB * scale;
    g.save();
    g.translate(this.cx, this.cy);
    const grad = g.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    grad.addColorStop(0, look.hub[0]);
    grad.addColorStop(1, look.hub[1]);
    g.fillStyle = grad;
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = look.hubRing;
    g.lineWidth = Math.max(1.5, r * 0.07);
    g.stroke();
    g.fillStyle = accent;
    g.beginPath();
    g.arc(0, 0, r * 0.32, 0, Math.PI * 2);
    g.fill();
    if (glow > 0) {
      this.glowMode(g, glow);
      const s = r * 2.4;
      g.drawImage(this.sprite(accent), -s, -s, s * 2, s * 2);
    }
    g.restore();
  }

  pointer(tilt, glow, accent) {
    const g = this.ctx;
    const look = this.look;
    const r = this.r;
    const s = Math.max(12, r * 0.11);
    const y = this.cy - r * (1 + WheelPainter.RIM) - s * 0.35;
    g.save();
    g.translate(this.cx, y);
    if (glow > 0) {
      g.save();
      this.glowMode(g, glow);
      g.drawImage(this.sprite(accent), -s * 2, -s * 1.4, s * 4, s * 4);
      g.restore();
    }
    g.rotate(tilt);
    const shape = () => {
      g.beginPath();
      g.moveTo(0, s * 1.35);
      g.bezierCurveTo(-s * 0.2, s * 0.9, -s * 0.7, s * 0.3, -s * 0.7, -s * 0.05);
      g.arc(0, -s * 0.05, s * 0.7, Math.PI, 0);
      g.bezierCurveTo(s * 0.7, s * 0.3, s * 0.2, s * 0.9, 0, s * 1.35);
      g.closePath();
    };
    g.save();
    g.translate(0, 3);
    g.fillStyle = look.shadow;
    shape();
    g.fill();
    g.restore();
    const grad = g.createLinearGradient(0, -s, 0, s * 1.3);
    grad.addColorStop(0, look.pointer[0]);
    grad.addColorStop(1, look.pointer[1]);
    g.fillStyle = grad;
    shape();
    g.fill();
    g.fillStyle = look.pointerEye;
    g.beginPath();
    g.arc(0, -s * 0.05, s * 0.26, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
}
