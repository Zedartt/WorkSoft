class HoopCourt {
  static FLOOR_Y = 90;
  static RIM_Y = 42;
  static RIM_WIDTH = 15;
  static RIM_DEPTH = 1.8;
  static RIM_TUBE = 0.75;
  static BOARD_EDGE = 9;
  static BOARD_GAP = 2.6;
  static BOARD_THICK = 1.4;
  static BOARD_ABOVE = 17;
  static BOARD_BELOW = 4;
  static GLASS_DEPTH = 5;
  static GLASS_RISE = 3;
  static POLE_GAP = 5.5;
  static POLE_HALF = 1.1;
  static ZONES = [
    { id: "near", name: "Sous le panier", share: 0, min: 0, bonus: 0 },
    { id: "mid", name: "Mi-distance", share: 0.14, min: 14, bonus: 1 },
    { id: "long", name: "Longue distance", share: 0.32, min: 26, bonus: 3 },
    { id: "far", name: "Bout du terrain", share: 0.58, min: 40, bonus: 6 },
  ];
  static LABEL_GAP = 16;
  static ZONE_LABELS = { mid: "MI-DISTANCE", long: "LOIN", far: "TRÈS LOIN" };
  static PAINT_LENGTH = 24;
  static LAMPS = 5;

  constructor() {
    this.layout(160, "right");
  }

  layout(width, side) {
    const dir = side === "right" ? 1 : -1;
    this.width = width;
    this.side = side;
    this.dir = dir;
    this.boardX = side === "right" ? width - HoopCourt.BOARD_EDGE : HoopCourt.BOARD_EDGE;
    this.back = { x: this.boardX - dir * HoopCourt.BOARD_GAP, y: HoopCourt.RIM_Y };
    this.front = { x: this.back.x - dir * HoopCourt.RIM_WIDTH, y: HoopCourt.RIM_Y };
    this.center = (this.back.x + this.front.x) / 2;
    const left = Math.min(this.boardX, this.boardX + dir * HoopCourt.BOARD_THICK);
    this.board = { left, right: left + HoopCourt.BOARD_THICK, top: HoopCourt.RIM_Y - HoopCourt.BOARD_ABOVE, bottom: HoopCourt.RIM_Y + HoopCourt.BOARD_BELOW };
    this.poleX = this.boardX + dir * HoopCourt.POLE_GAP;
    this.pole = { left: this.poleX - HoopCourt.POLE_HALF, right: this.poleX + HoopCourt.POLE_HALF, top: this.board.top + 4, bottom: HoopCourt.FLOOR_Y };
    const reach = side === "right" ? this.center : width - this.center;
    this.zoneStarts = HoopCourt.ZONES.map((zone) => Math.min(reach - 4, Math.max(zone.min, zone.share * reach)));
  }

  zoneOf(x) {
    const distance = Math.abs(x - this.center);
    let found = HoopCourt.ZONES[0];
    HoopCourt.ZONES.forEach((zone, i) => {
      if (distance >= this.zoneStarts[i]) found = zone;
    });
    return found;
  }

  insideRim(x) {
    const half = HoopCourt.RIM_WIDTH / 2 - HoopCourt.RIM_TUBE;
    return Math.abs(x - this.center) < half;
  }

  glassPath(ctx) {
    const { board, dir, boardX } = this;
    const far = boardX + dir * HoopCourt.GLASS_DEPTH;
    ctx.beginPath();
    ctx.moveTo(boardX, board.top);
    ctx.lineTo(far, board.top - HoopCourt.GLASS_RISE);
    ctx.lineTo(far, board.bottom - HoopCourt.GLASS_RISE);
    ctx.lineTo(boardX, board.bottom);
    ctx.closePath();
  }

  drawBackdrop(ctx) {
    const width = this.width;
    const floor = HoopCourt.FLOOR_Y;
    const wall = ctx.createLinearGradient(0, 0, 0, floor);
    wall.addColorStop(0, ThemeSwitch.color("--hl-wall-a"));
    wall.addColorStop(1, ThemeSwitch.color("--hl-wall-b"));
    ctx.fillStyle = wall;
    ctx.fillRect(-10, -120, width + 20, floor + 120);
    for (let i = 0; i < HoopCourt.LAMPS; i++) {
      const x = ((i + 0.5) * width) / HoopCourt.LAMPS;
      const glow = ctx.createRadialGradient(x, 0, 0, x, 0, 22);
      glow.addColorStop(0, ThemeSwitch.color("--hl-lamp"));
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(x - 22, 0, 44, 22);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(x - 3, 0, 6, 0.8);
    }
    ctx.fillStyle = ThemeSwitch.color("--hl-band");
    ctx.fillRect(-10, floor - 7, width + 20, 7);
    ctx.fillStyle = ThemeSwitch.color("--hl-band-light");
    ctx.fillRect(-10, floor - 7, width + 20, 0.5);
    this.drawFloor(ctx);
  }

  drawFloor(ctx) {
    const { width, dir, boardX, center } = this;
    const floor = HoopCourt.FLOOR_Y;
    const wood = ctx.createLinearGradient(0, floor, 0, 100);
    wood.addColorStop(0, ThemeSwitch.color("--hl-floor-a"));
    wood.addColorStop(1, ThemeSwitch.color("--hl-floor-b"));
    ctx.fillStyle = wood;
    ctx.fillRect(-10, floor, width + 20, 60);
    ctx.strokeStyle = "rgba(60,30,10,0.18)";
    ctx.lineWidth = 0.15;
    ctx.beginPath();
    for (let k = 1; k <= 6; k++) {
      const y = floor + (100 - floor) * (k / 6) ** 1.5;
      ctx.moveTo(-10, y);
      ctx.lineTo(width + 10, y);
    }
    ctx.stroke();
    const paintFar = center - dir * HoopCourt.PAINT_LENGTH;
    ctx.fillStyle = ThemeSwitch.color("--hl-paint");
    ctx.beginPath();
    ctx.moveTo(paintFar, floor + 0.5);
    ctx.lineTo(boardX, floor + 0.5);
    ctx.lineTo(boardX + dir * 3, 100);
    ctx.lineTo(paintFar - dir * 3, 100);
    ctx.fill();
    ctx.font = "800 2.2px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = dir > 0 ? "right" : "left";
    let lastLabel = -Infinity;
    HoopCourt.ZONES.forEach((zone, i) => {
      if (!i) return;
      const x = center - dir * this.zoneStarts[i];
      ctx.strokeStyle = `rgba(255,255,255,${0.45 + i * 0.15})`;
      ctx.lineWidth = 0.3 + i * 0.12;
      ctx.beginPath();
      ctx.moveTo(x, floor + 0.5);
      ctx.lineTo(x - dir * 3, 100);
      ctx.stroke();
      if (this.zoneStarts[i] - lastLabel < HoopCourt.LABEL_GAP) return;
      lastLabel = this.zoneStarts[i];
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(HoopCourt.ZONE_LABELS[zone.id], x - dir * 2.5, floor + 5);
    });
  }

  drawHoopBack(ctx, fx, time) {
    const { board, dir, boardX, poleX, center } = this;
    const rimY = HoopCourt.RIM_Y;
    const floor = HoopCourt.FLOOR_Y;
    const metal = ctx.createLinearGradient(poleX - 1.2, 0, poleX + 1.2, 0);
    metal.addColorStop(0, "#2b313b");
    metal.addColorStop(0.45, "#8a95a6");
    metal.addColorStop(1, "#262b33");
    ctx.fillStyle = metal;
    ctx.fillRect(this.pole.left, this.pole.top, HoopCourt.POLE_HALF * 2, floor - this.pole.top);
    ctx.fillStyle = "#1f4f8f";
    ctx.beginPath();
    ctx.roundRect(poleX - 2.6, floor - 5, 5.2, 5, 1);
    ctx.fill();
    ctx.fillStyle = "#3a4250";
    ctx.fillRect(Math.min(poleX, boardX), board.top + 4, Math.abs(poleX - boardX), 1.4);
    ctx.strokeStyle = "#3a4250";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(poleX, board.top + 12);
    ctx.lineTo(boardX + dir * 1.4, board.top + 5);
    ctx.stroke();
    const glassAlpha = fx.glassAlpha();
    if (glassAlpha > 0) this.drawGlass(ctx, fx, time, glassAlpha);
    ctx.fillStyle = "#4a5260";
    ctx.fillRect(Math.min(this.back.x, boardX), rimY - 0.4, Math.abs(boardX - this.back.x), 1.6);
    this.drawRimHalf(ctx, Math.PI, Math.PI * 2);
    if (fx.rimGlow > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const glow = ctx.createRadialGradient(center, rimY, 0, center, rimY, 16);
      glow.addColorStop(0, `rgba(255,160,60,${0.75 * fx.rimGlow})`);
      glow.addColorStop(1, "rgba(255,90,20,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(center - 16, rimY - 16, 32, 32);
      ctx.restore();
    }
  }

  drawGlass(ctx, fx, time, alpha) {
    const { board, dir, boardX } = this;
    ctx.save();
    ctx.globalAlpha = alpha;
    this.glassPath(ctx);
    const glass = ctx.createLinearGradient(boardX, board.top, boardX + dir * HoopCourt.GLASS_DEPTH, board.bottom);
    glass.addColorStop(0, "rgba(220,240,255,0.55)");
    glass.addColorStop(0.5, "rgba(170,210,240,0.25)");
    glass.addColorStop(1, "rgba(230,245,255,0.5)");
    ctx.fillStyle = glass;
    ctx.fill();
    ctx.strokeStyle = "#f4f7fb";
    ctx.lineWidth = 0.6;
    ctx.stroke();
    const far = boardX + dir * HoopCourt.GLASS_DEPTH * 0.7;
    ctx.strokeStyle = "#e8492b";
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    ctx.moveTo(boardX + dir * 1.2, HoopCourt.RIM_Y - 7);
    ctx.lineTo(far, HoopCourt.RIM_Y - 7 - HoopCourt.GLASS_RISE * 0.7);
    ctx.lineTo(far, HoopCourt.RIM_Y - HoopCourt.GLASS_RISE * 0.7);
    ctx.lineTo(boardX + dir * 1.2, HoopCourt.RIM_Y);
    ctx.stroke();
    if (fx.boardGlow > 0) {
      ctx.globalCompositeOperation = "lighter";
      const hue = (time * 400) % 360;
      for (const [width, strength] of [[2.6, 0.25], [1.2, 0.6], [0.5, 1]]) {
        ctx.strokeStyle = `hsla(${hue},100%,65%,${strength * fx.boardGlow})`;
        ctx.lineWidth = width;
        this.glassPath(ctx);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.fillStyle = "#e9eef5";
    ctx.fillRect(board.left, board.top, HoopCourt.BOARD_THICK, board.bottom - board.top);
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(board.left + 0.3, board.top + 1, 0.3, board.bottom - board.top - 2);
    ctx.restore();
  }

  drawRimHalf(ctx, from, to) {
    const rx = HoopCourt.RIM_WIDTH / 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#b52d10";
    ctx.lineWidth = HoopCourt.RIM_TUBE * 2;
    ctx.beginPath();
    ctx.ellipse(this.center, HoopCourt.RIM_Y, rx, HoopCourt.RIM_DEPTH, 0, from, to);
    ctx.stroke();
    ctx.strokeStyle = "#ff6a2b";
    ctx.lineWidth = HoopCourt.RIM_TUBE;
    ctx.beginPath();
    ctx.ellipse(this.center, HoopCourt.RIM_Y - 0.3, rx, HoopCourt.RIM_DEPTH, 0, from, to);
    ctx.stroke();
  }

  drawRimFront(ctx) {
    this.drawRimHalf(ctx, 0, Math.PI);
  }
}
