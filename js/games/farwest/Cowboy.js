class Cowboy {
  static LOOK = {
    me: { hat: "#d9bf8c", hatDark: "#a88a55", band: "#2f8bff", bandana: "#2f8bff", shirt: "#eee3cc", cuff: "#cfc2a6", glove: "#8a5a32", vest: "#6b4a2b", pants: "#3c4d70", boots: "#5a3a22", skin: "#e0ad82", hair: "#5a3a22" },
    foe: { hat: "#2b2624", hatDark: "#141110", band: "#ff3048", bandana: "#ff3048", shirt: "#cbb594", cuff: "#a8936f", glove: "#2a2220", vest: "#2f2a28", pants: "#4d3d33", boots: "#2a1c14", skin: "#c98f63", hair: "#1c1410" },
  };
  static SHOULDER = [5, -71];
  static UPPER = 14;
  static FORE = 13;
  static DRAW_SPEED = 14;
  static FALL_TIME = 0.55;

  constructor(side) {
    this.side = side;
    this.dir = side === "me" ? 1 : -1;
    this.look = Cowboy.LOOK[side];
    this.reset();
  }

  reset() {
    this.aim = 0;
    this.aimTarget = 0;
    this.recoil = 0;
    this.fall = 0;
    this.dead = false;
    this.tense = false;
    this.hat = null;
    this.t = Math.random() * 10;
  }

  draw() {
    this.aimTarget = 1;
  }

  holster() {
    this.aimTarget = 0;
    this.recoil = 0;
  }

  fire() {
    this.aimTarget = 1;
    this.aim = Math.max(this.aim, 0.85);
    this.recoil = 1;
  }

  die(x, y, h) {
    if (this.dead) return;
    this.dead = true;
    const k = h / 100;
    this.hat = { x: x - this.dir * k * 1, y: y - k * 90, vx: -this.dir * (80 + Math.random() * 60), vy: -(260 + Math.random() * 120), rot: 0, vr: -this.dir * (6 + Math.random() * 6), floor: y - k * 2, k };
  }

  update(dt, floor) {
    this.t += dt;
    this.aim += (this.aimTarget - this.aim) * Math.min(1, dt * Cowboy.DRAW_SPEED);
    this.recoil = Math.max(0, this.recoil - dt * 5);
    if (this.dead) this.fall = Math.min(1, this.fall + dt / Cowboy.FALL_TIME);
    if (this.hat && this.hat.vy !== null) {
      const h = this.hat;
      h.vy += 900 * dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.rot += h.vr * dt;
      if (h.y >= h.floor) {
        h.y = h.floor;
        h.vy = null;
        h.rot = 0;
      }
    }
  }

  arm() {
    const a = this.aim,
      tense = this.tense && a < 0.1 ? Math.sin(this.t * 11) * 0.06 : 0,
      d = this.dead ? this.fall : 0,
      a1 = (1.3 * (1 - a) - 0.04 * a - this.recoil * 0.25 + tense) * (1 - d) - 2.3 * d,
      a2 = (1.55 * (1 - a) - this.recoil * 0.55 + tense) * (1 - d) - 2.6 * d,
      [sx, sy] = Cowboy.SHOULDER,
      ex = sx + Math.cos(a1) * Cowboy.UPPER,
      ey = sy + Math.sin(a1) * Cowboy.UPPER,
      hx = ex + Math.cos(a2) * Cowboy.FORE,
      hy = ey + Math.sin(a2) * Cowboy.FORE;
    return { sx, sy, ex, ey, hx, hy, a2 };
  }

  tip(x, y, h) {
    const k = h / 100,
      { hx, hy, a2 } = this.arm();
    return { x: x + this.dir * k * (hx + Math.cos(a2) * 12), y: y + k * (hy + Math.sin(a2) * 12) };
  }

  chest(x, y, h) {
    return { x: x + this.dir * (h / 100) * 1, y: y - (h / 100) * 60 };
  }

  capsule(ctx, x1, y1, r1, x2, y2, r2, color) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(30,18,8,0.45)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(x1, y1, r1, a + Math.PI / 2, a - Math.PI / 2);
    ctx.arc(x2, y2, r2, a - Math.PI / 2, a + Math.PI / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  hand(ctx, x, y, angle, fist) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = this.look.glove;
    ctx.strokeStyle = "rgba(20,10,4,0.5)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.roundRect(-2.4, -2.5, 4.8, fist ? 4.6 : 5, 1.8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(1.6, -2.2, 1.5, 1, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  armShape(ctx, sx, sy, ex, ey, hx, hy) {
    const L = this.look,
      cx = ex + (hx - ex) * 0.78,
      cy = ey + (hy - ey) * 0.78;
    this.capsule(ctx, sx, sy, 3.5, ex, ey, 2.8, L.shirt);
    this.capsule(ctx, ex, ey, 2.8, hx, hy, 2.2, L.shirt);
    this.capsule(ctx, cx, cy, 2.5, hx, hy, 2.4, L.cuff);
    ctx.strokeStyle = "rgba(30,18,8,0.25)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(ex, ey, 1.6, Math.atan2(hy - ey, hx - ex) + 0.6, Math.atan2(hy - ey, hx - ex) + 2.2);
    ctx.stroke();
  }

  limb(ctx, points, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  }

  gun(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = "#6b3e22";
    ctx.beginPath();
    ctx.moveTo(-1, 1);
    ctx.lineTo(-4.5, 7);
    ctx.lineTo(-1.5, 8);
    ctx.lineTo(1.5, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3a3d44";
    ctx.fillRect(-1.5, -2.2, 5.5, 4.2);
    ctx.fillRect(3, -1.3, 9, 2.4);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(3, -1.3, 9, 0.7);
    ctx.restore();
  }

  hatShape(ctx) {
    const L = this.look;
    ctx.fillStyle = L.hat;
    ctx.beginPath();
    ctx.moveTo(-7, -86);
    ctx.bezierCurveTo(-7.5, -93, -6, -97.5, -2, -96);
    ctx.quadraticCurveTo(0, -94.5, 2, -96);
    ctx.bezierCurveTo(6, -97.5, 7.5, -93, 7, -86);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = L.band;
    ctx.fillRect(-7.2, -89, 14.4, 2.6);
    ctx.fillStyle = L.hatDark;
    ctx.beginPath();
    ctx.ellipse(0, -86, 15, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = L.hat;
    ctx.beginPath();
    ctx.ellipse(0, -86.6, 14, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  render(ctx, x, y, h) {
    const k = h / 100,
      L = this.look,
      ease = this.fall * this.fall,
      bob = this.dead ? 0 : Math.sin(this.t * 2.2) * 0.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(-this.dir * ease * h * 0.45, 0, h * (0.16 + ease * 0.32), h * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.scale(this.dir * k, k);
    ctx.rotate(-ease * 1.45);
    ctx.translate(0, bob);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const arm = this.arm();
    const back = this.dead ? this.fall : 0,
      bex = -7.5 - back * 2,
      bey = -58 - back * 22,
      bhx = -7 - back * 6,
      bhy = -47 - back * 34;
    this.armShape(ctx, -4, -70.5, bex, bey, bhx, bhy);
    this.hand(ctx, bhx, bhy + 1, Math.atan2(bhy - bey, bhx - bex) - Math.PI / 2, true);
    this.limb(ctx, [[-3, -44], [-5, -23], [-8, -5]], L.pants, 6.4);
    this.limb(ctx, [[3, -44], [5, -23], [7, -5]], L.pants, 6.4);
    ctx.fillStyle = L.boots;
    for (const fx of [-8, 7]) {
      ctx.beginPath();
      ctx.moveTo(fx - 3.5, -9);
      ctx.lineTo(fx + 3, -9);
      ctx.lineTo(fx + 3.5, -2.5);
      ctx.lineTo(fx + 8, -1.5);
      ctx.lineTo(fx + 8, 0);
      ctx.lineTo(fx - 4, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = L.shirt;
    ctx.beginPath();
    ctx.moveTo(-8, -44);
    ctx.lineTo(8, -44);
    ctx.lineTo(9, -71);
    ctx.quadraticCurveTo(0, -75, -9, -71);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = L.vest;
    ctx.beginPath();
    ctx.moveTo(-8.4, -44);
    ctx.lineTo(-2, -44);
    ctx.lineTo(-1, -66);
    ctx.lineTo(-4, -72);
    ctx.lineTo(-9, -71);
    ctx.closePath();
    ctx.moveTo(8.4, -44);
    ctx.lineTo(3, -44);
    ctx.lineTo(2.5, -64);
    ctx.lineTo(5, -72.5);
    ctx.lineTo(9, -71);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3a2615";
    ctx.fillRect(-8.6, -47, 17.2, 3.6);
    ctx.fillStyle = "#e8c35a";
    ctx.fillRect(-1.6, -47.2, 3.4, 4);
    ctx.fillStyle = "#4a2e18";
    ctx.beginPath();
    ctx.roundRect(5.5, -46, 5, 10, 2);
    ctx.fill();
    ctx.fillStyle = L.bandana;
    ctx.beginPath();
    ctx.moveTo(-5.5, -73.5);
    ctx.lineTo(5.5, -73.5);
    ctx.lineTo(1, -65);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = L.skin;
    ctx.fillRect(-2.2, -76.5, 4.6, 4);
    ctx.beginPath();
    ctx.arc(1, -80.5, 6.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(7, -82);
    ctx.lineTo(9.2, -79.5);
    ctx.lineTo(7, -78.6);
    ctx.fill();
    ctx.fillStyle = L.hair;
    ctx.beginPath();
    ctx.moveTo(3, -76.8);
    ctx.quadraticCurveTo(6, -78.3, 8.6, -76.6);
    ctx.quadraticCurveTo(6, -76.4, 3, -76.8);
    ctx.fill();
    ctx.fillRect(-5.4, -84, 3, 6);
    ctx.fillStyle = "#1a1210";
    if (this.dead) {
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "#1a1210";
      ctx.beginPath();
      ctx.moveTo(3.2, -83);
      ctx.lineTo(5.6, -80.6);
      ctx.moveTo(5.6, -83);
      ctx.lineTo(3.2, -80.6);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(4.6, -81.6, 0.9, this.tense ? 0.5 : 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(3, -84.4, 3.4, 0.8);
    }
    if (!this.hat) this.hatShape(ctx);
    this.gun(ctx, arm.hx, arm.hy, arm.a2);
    this.armShape(ctx, arm.sx, arm.sy, arm.ex, arm.ey, arm.hx, arm.hy);
    ctx.fillStyle = L.vest;
    ctx.strokeStyle = "rgba(30,18,8,0.45)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(arm.sx - 0.6, arm.sy - 0.4, 3.9, 3.1, 0.3, Math.PI * 0.95, Math.PI * 2.05);
    ctx.fill();
    ctx.stroke();
    this.hand(ctx, arm.hx, arm.hy, arm.a2, false);
    ctx.restore();
    if (this.hat) {
      const hat = this.hat;
      ctx.save();
      ctx.translate(hat.x, hat.y);
      ctx.rotate(hat.rot);
      ctx.scale(this.dir * hat.k, hat.k);
      ctx.translate(0, 86);
      this.hatShape(ctx);
      ctx.restore();
    }
  }
}
