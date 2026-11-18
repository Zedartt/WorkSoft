class HoopBall {
  static RADIUS = 3.4;
  static GRIP = 0.88;
  static TRAIL = 9;

  constructor() {
    this.trail = [];
    this.place(30, 60);
  }

  place(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;
    this.spin = 0;
    this.trail.length = 0;
  }

  speed() {
    return Math.hypot(this.vx, this.vy);
  }

  hitPoint(px, py, radius, bounce) {
    const dx = this.x - px;
    const dy = this.y - py;
    const dist = Math.hypot(dx, dy);
    const min = HoopBall.RADIUS + radius;
    if (dist >= min || dist === 0) return 0;
    this.x = px + (dx / dist) * min;
    this.y = py + (dy / dist) * min;
    return this.reflect(dx / dist, dy / dist, bounce);
  }

  hitBox(box, bounce) {
    const cx = Math.max(box.left, Math.min(box.right, this.x));
    const cy = Math.max(box.top, Math.min(box.bottom, this.y));
    if (cx !== this.x || cy !== this.y) return this.hitPoint(cx, cy, 0, bounce);
    const exits = [
      [this.x - box.left, -1, 0],
      [box.right - this.x, 1, 0],
      [this.y - box.top, 0, -1],
      [box.bottom - this.y, 0, 1],
    ].sort((a, b) => a[0] - b[0]);
    const [depth, nx, ny] = exits[0];
    this.x += nx * (depth + HoopBall.RADIUS);
    this.y += ny * (depth + HoopBall.RADIUS);
    return this.reflect(nx, ny, bounce);
  }

  reflect(nx, ny, bounce) {
    const normal = this.vx * nx + this.vy * ny;
    if (normal >= 0) return 0;
    const tx = -ny;
    const ty = nx;
    const along = (this.vx * tx + this.vy * ty) * HoopBall.GRIP;
    this.vx = tx * along - nx * normal * bounce;
    this.vy = ty * along - ny * normal * bounce;
    this.spin = this.spin * 0.4 + (along / HoopBall.RADIUS) * 0.6;
    return -normal;
  }

  remember() {
    this.trail.unshift({ x: this.x, y: this.y });
    if (this.trail.length > HoopBall.TRAIL) this.trail.pop();
  }

  drawTrail(ctx) {
    if (this.speed() < 120) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    this.trail.forEach((point, i) => {
      const fade = 1 - i / HoopBall.TRAIL;
      ctx.fillStyle = `rgba(255,140,60,${0.16 * fade})`;
      ctx.beginPath();
      ctx.arc(point.x, point.y, HoopBall.RADIUS * (0.4 + 0.6 * fade), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  draw(ctx) {
    const r = HoopBall.RADIUS;
    ctx.save();
    ctx.translate(this.x, this.y);
    const body = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    body.addColorStop(0, "#ffb874");
    body.addColorStop(0.55, "#f0741f");
    body.addColorStop(1, "#a3400c");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.rotate(this.angle);
    ctx.strokeStyle = "rgba(45,18,6,0.85)";
    ctx.lineWidth = 0.26;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.moveTo(-r * 0.62, -r);
    ctx.quadraticCurveTo(-r * 0.1, 0, -r * 0.62, r);
    ctx.moveTo(r * 0.62, -r);
    ctx.quadraticCurveTo(r * 0.1, 0, r * 0.62, r);
    ctx.stroke();
    ctx.restore();
    const shade = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.5, 0, 0, r * 1.02);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(30,8,0,0.45)");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    const shine = ctx.createRadialGradient(-r * 0.4, -r * 0.45, 0, -r * 0.4, -r * 0.45, r * 0.55);
    shine.addColorStop(0, "rgba(255,255,255,0.55)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(-r * 0.4, -r * 0.45, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawGround(ctx, floorY) {
    const r = HoopBall.RADIUS;
    const height = Math.max(0, floorY - this.y - r);
    const near = Math.max(0, 1 - height / 45);
    ctx.fillStyle = `rgba(0,0,0,${0.32 * near})`;
    ctx.beginPath();
    ctx.ellipse(this.x, floorY + 0.6, r * (1.3 - 0.5 * near), r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    if (height > 18) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x - r * 2, floorY, r * 4, r * 3);
    ctx.clip();
    ctx.globalAlpha = 0.22 * (1 - height / 18);
    ctx.translate(0, floorY * 2);
    ctx.scale(1, -1);
    this.draw(ctx);
    ctx.restore();
  }
}
