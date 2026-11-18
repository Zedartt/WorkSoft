class HoopAim {
  static POWER = 9;
  static MAX_PULL = 26;
  static MIN_PULL = 2;
  static LINE_MIN = 5;
  static LINE_MAX = 14;

  constructor() {
    this.active = false;
  }

  start(at) {
    this.active = true;
    this.fromX = at.x;
    this.fromY = at.y;
    this.toX = at.x;
    this.toY = at.y;
  }

  move(at) {
    this.toX = at.x;
    this.toY = at.y;
  }

  stop() {
    this.active = false;
  }

  pull() {
    const dx = this.fromX - this.toX;
    const dy = this.fromY - this.toY;
    const length = Math.hypot(dx, dy);
    const strength = Math.min(length, HoopAim.MAX_PULL);
    return { ready: length >= HoopAim.MIN_PULL, nx: length ? dx / length : 0, ny: length ? dy / length : 0, share: strength / HoopAim.MAX_PULL, speed: strength * HoopAim.POWER };
  }

  draw(ctx, ball) {
    const aim = this.pull();
    if (!aim.ready) return;
    const reach = HoopBall.RADIUS + HoopAim.LINE_MIN + (HoopAim.LINE_MAX - HoopAim.LINE_MIN) * aim.share;
    const startX = ball.x + aim.nx * (HoopBall.RADIUS + 0.6);
    const startY = ball.y + aim.ny * (HoopBall.RADIUS + 0.6);
    const line = ctx.createLinearGradient(startX, startY, ball.x + aim.nx * reach, ball.y + aim.ny * reach);
    line.addColorStop(0, "rgba(255,255,255,0.55)");
    line.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.strokeStyle = line;
    ctx.lineWidth = 0.22;
    ctx.lineCap = "round";
    ctx.setLineDash([0.9, 0.7]);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(ball.x + aim.nx * reach, ball.y + aim.ny * reach);
    ctx.stroke();
    ctx.restore();
  }
}
