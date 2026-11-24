class Cowboy {
  static LOOK = {
    me: { hat: "#d9bf8c", hatDark: "#a88a55", band: "#2f8bff", bandana: "#2f8bff", shirt: "#eee3cc", shirtDark: "#c9bc9f", cuff: "#cfc2a6", glove: "#8a5a32", vest: "#6b4a2b", vestDark: "#4f361f", pants: "#3c4d70", pantsDark: "#2c3955", boots: "#5a3a22", bootsDark: "#3f2817", skin: "#e0ad82", skinDark: "#c08a62", hair: "#5a3a22" },
    foe: { hat: "#2b2624", hatDark: "#141110", band: "#ff3048", bandana: "#ff3048", shirt: "#cbb594", shirtDark: "#a89474", cuff: "#a8936f", glove: "#2a2220", vest: "#2f2a28", vestDark: "#1d1a19", pants: "#4d3d33", pantsDark: "#382c25", boots: "#2a1c14", bootsDark: "#1a110c", skin: "#c98f63", skinDark: "#a87150", hair: "#1c1410" },
  };
  static SHOULDER = [1, -69.5];
  static UPPER = 13.5;
  static FORE = 13;
  static DOWN = [1.45, 1.25];
  static AIM = [-0.06, -0.02];
  static FALLEN = [-2.4, -2.7];
  static DRAW_SPEED = 14;
  static FALL_TIME = 0.55;
  static SLIDE = 30;
  static GRIP = [2.2, -3.6];
  static BARREL = 12;

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
    this.hat = { x: x + this.dir * k * 1.8, y: y - k * 87, vx: -this.dir * (80 + Math.random() * 60), vy: -(260 + Math.random() * 120), rot: 0, vr: -this.dir * (6 + Math.random() * 6), floor: y - k * 2, k };
  }

  update(dt) {
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
      d = this.dead ? this.fall : 0,
      tense = this.tense && a < 0.1 ? Math.sin(this.t * 11) * 0.05 : 0,
      mix = (i) => (Cowboy.DOWN[i] * (1 - a) + Cowboy.AIM[i] * a + tense) * (1 - d) + Cowboy.FALLEN[i] * d,
      a1 = mix(0) - this.recoil * 0.22,
      a2 = mix(1) - this.recoil * 0.5,
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
    const [gx, gy] = Cowboy.GRIP,
      lx = gx + Cowboy.BARREL,
      ly = gy + 0.2,
      px = hx + Math.cos(a2) * lx - Math.sin(a2) * ly,
      py = hy + Math.sin(a2) * lx + Math.cos(a2) * ly;
    return { x: x + this.dir * k * px, y: y + k * py };
  }

  chest(x, y, h) {
    return { x: x + this.dir * (h / 100) * 3, y: y - (h / 100) * 61 };
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

  shape(ctx, points, fill, line = true) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    if (!line) return;
    ctx.strokeStyle = "rgba(30,18,8,0.45)";
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }

  hand(ctx, x, y, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = "rgba(20,10,4,0.5)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.roundRect(-1.2, -2.4, 4.4, 4.8, 1.8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(1.4, -2.3, 1.6, 1, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  armShape(ctx, sx, sy, ex, ey, hx, hy, shirt, cuff) {
    const cx = ex + (hx - ex) * 0.75,
      cy = ey + (hy - ey) * 0.75;
    this.capsule(ctx, sx, sy, 3.3, ex, ey, 2.7, shirt);
    this.capsule(ctx, ex, ey, 2.7, hx, hy, 2.1, shirt);
    this.capsule(ctx, cx, cy, 2.4, hx, hy, 2.3, cuff);
  }

  leg(ctx, hip, knee, ankle, color) {
    this.capsule(ctx, hip[0], hip[1], 3.7, knee[0], knee[1], 2.9, color);
    this.capsule(ctx, knee[0], knee[1], 2.9, ankle[0], ankle[1], 2.4, color);
  }

  boot(ctx, ax, color) {
    this.shape(ctx, [[ax - 2.8, -13], [ax + 2.6, -13], [ax + 2.6, -4.2], [ax + 6.6, -3], [ax + 7.4, -1.2], [ax + 7, 0], [ax - 3.2, 0], [ax - 3.2, -1.6]], color);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(ax - 3.2, -1.3, 2.6, 1.3);
  }

  gun(ctx, x, y, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(Cowboy.GRIP[0], Cowboy.GRIP[1]);
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
    ctx.moveTo(-5.2, -86);
    ctx.bezierCurveTo(-5.7, -93, -4.2, -97.5, -0.2, -96);
    ctx.quadraticCurveTo(1.8, -94.5, 3.8, -96);
    ctx.bezierCurveTo(7.8, -97.5, 9.3, -93, 8.8, -86);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = L.band;
    ctx.fillRect(-5.4, -89, 14.4, 2.6);
    ctx.fillStyle = L.hatDark;
    ctx.beginPath();
    ctx.ellipse(1.8, -86, 14.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = L.hat;
    ctx.beginPath();
    ctx.ellipse(1.8, -86.6, 13.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  head(ctx) {
    const L = this.look;
    this.shape(ctx, [[-0.6, -76], [3.2, -76], [3.4, -71], [-0.8, -71]], L.skin, false);
    ctx.fillStyle = L.skin;
    ctx.strokeStyle = "rgba(30,18,8,0.4)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(2.2, -81, 6.2, 0, Math.PI * 2);
    ctx.ellipse(4.6, -77.6, 3.2, 2.2, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, -82.2);
    ctx.lineTo(9.6, -79.6);
    ctx.lineTo(7.8, -79);
    ctx.fill();
    ctx.fillStyle = L.skinDark;
    ctx.beginPath();
    ctx.ellipse(-0.4, -80.4, 1.4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = L.hair;
    ctx.beginPath();
    ctx.moveTo(-4, -85);
    ctx.lineTo(1, -85);
    ctx.lineTo(-1.2, -82.5);
    ctx.lineTo(-2.2, -77.5);
    ctx.lineTo(-4.2, -78.5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -78.4);
    ctx.quadraticCurveTo(7.4, -79.6, 9, -77.8);
    ctx.quadraticCurveTo(7, -77.6, 5, -78.4);
    ctx.fill();
    ctx.fillStyle = "#1a1210";
    ctx.strokeStyle = "#1a1210";
    if (this.dead) {
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(4.6, -83.2);
      ctx.lineTo(6.8, -81);
      ctx.moveTo(6.8, -83.2);
      ctx.lineTo(4.6, -81);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(5.8, -82, 0.85, this.tense ? 0.45 : 1.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(4.4, -84.6, 3.2, 0.8);
    }
  }

  render(ctx, x, y, h) {
    const k = h / 100,
      L = this.look,
      ease = this.fall * this.fall,
      bob = this.dead ? 0 : Math.sin(this.t * 2.2) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.ellipse(-this.dir * ease * h * 0.15, 0, h * (0.17 + ease * 0.32), h * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.scale(this.dir * k, k);
    ctx.translate(ease * Cowboy.SLIDE, 0);
    ctx.rotate(-ease * 1.45);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const arm = this.arm(),
      d = this.dead ? this.fall : 0;
    this.leg(ctx, [-1.6, -47], [-4.4, -25], [-8.5, -5], L.pantsDark);
    this.boot(ctx, -8.5, L.bootsDark);
    ctx.translate(0, bob);
    const be = [-1.8 - d * 3, -57 - d * 20],
      bh = [0.2 - d * 9, -46.5 - d * 30];
    this.armShape(ctx, 0.2, -70, be[0], be[1], bh[0], bh[1], L.shirtDark, L.shirtDark);
    this.hand(ctx, bh[0], bh[1], Math.atan2(bh[1] - be[1], bh[0] - be[0]), L.glove);
    ctx.translate(0, -bob);
    this.leg(ctx, [1.6, -47], [5.8, -25], [8.5, -5], L.pants);
    this.boot(ctx, 8.5, L.boots);
    ctx.translate(0, bob);
    this.capsule(ctx, -2, -47.5, 5, 2.4, -47.5, 5, L.pants);
    this.shape(ctx, [[-5.6, -48], [-6, -60], [-5, -68.5], [-1, -72.6], [3, -72.2], [6.4, -66.5], [7, -60], [5.8, -52], [5.2, -48]], L.shirt);
    this.shape(ctx, [[-5.6, -48], [-6, -60], [-5, -68.5], [-1, -72.6], [2.4, -72.4], [3.6, -64], [4.2, -48]], L.vest);
    this.shape(ctx, [[-5.6, -48], [-6, -60], [-5, -68.5], [-3.2, -70.6], [-3.4, -60], [-3, -48]], L.vestDark, false);
    this.shape(ctx, [[-5.9, -50.4], [5.6, -50.8], [5.4, -46.8], [-5.9, -46.6]], "#3a2615");
    ctx.fillStyle = "#e8c35a";
    ctx.fillRect(3.4, -51, 2.6, 4.4);
    this.shape(ctx, [[-0.4, -48], [4.8, -48], [5.4, -35.5], [3.8, -33.5], [0.8, -34.5]], "#4a2e18");
    this.head(ctx);
    this.shape(ctx, [[-1, -73.4], [5.2, -73.6], [5.6, -70.8], [4.6, -66.8], [1, -70.4]], L.bandana);
    if (!this.hat) this.hatShape(ctx);
    this.gun(ctx, arm.hx, arm.hy, arm.a2);
    this.armShape(ctx, arm.sx, arm.sy, arm.ex, arm.ey, arm.hx, arm.hy, L.shirt, L.cuff);
    ctx.fillStyle = L.vest;
    ctx.strokeStyle = "rgba(30,18,8,0.45)";
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(arm.sx - 0.4, arm.sy - 0.6, 3.7, 3, 0, Math.PI * 0.92, Math.PI * 2.08);
    ctx.fill();
    ctx.stroke();
    this.hand(ctx, arm.hx, arm.hy, arm.a2, L.glove);
    ctx.restore();
    if (this.hat) {
      const hat = this.hat;
      ctx.save();
      ctx.translate(hat.x, hat.y);
      ctx.rotate(hat.rot);
      ctx.scale(this.dir * hat.k, hat.k);
      ctx.translate(-1.8, 86);
      this.hatShape(ctx);
      ctx.restore();
    }
  }
}
