class HoopNet {
  static COLUMNS = 7;
  static ROWS = 6;
  static LENGTH = 12;
  static NARROW = 0.38;
  static GRAVITY = 45;
  static DAMPING = 0.985;
  static ITERATIONS = 4;
  static PADDING = 0.25;

  constructor() {
    this.points = [];
    this.links = [];
  }

  build(court) {
    const width = HoopCourt.RIM_WIDTH;
    this.points = [];
    this.links = [];
    for (let row = 0; row < HoopNet.ROWS; row++) {
      const span = width * (1 - (HoopNet.NARROW * row) / (HoopNet.ROWS - 1));
      for (let col = 0; col < HoopNet.COLUMNS; col++) {
        const x = court.center + (col / (HoopNet.COLUMNS - 1) - 0.5) * span;
        const y = HoopCourt.RIM_Y + (row * HoopNet.LENGTH) / (HoopNet.ROWS - 1);
        this.points.push({ x, y, px: x, py: y, pinned: row === 0 });
      }
    }
    for (let row = 0; row < HoopNet.ROWS; row++)
      for (let col = 0; col < HoopNet.COLUMNS; col++) {
        if (col + 1 < HoopNet.COLUMNS) this.link(col, row, col + 1, row);
        if (row + 1 < HoopNet.ROWS) {
          this.link(col, row, col, row + 1);
          if (col + 1 < HoopNet.COLUMNS) this.link(col, row, col + 1, row + 1);
          if (col > 0) this.link(col, row, col - 1, row + 1);
        }
      }
  }

  at(col, row) {
    return this.points[row * HoopNet.COLUMNS + col];
  }

  link(c1, r1, c2, r2) {
    const a = this.at(c1, r1);
    const b = this.at(c2, r2);
    this.links.push({ a, b, rest: Math.hypot(a.x - b.x, a.y - b.y), diagonal: c1 !== c2 && r1 !== r2 });
  }

  step(dt, ball) {
    for (const p of this.points) {
      if (p.pinned) continue;
      const vx = (p.x - p.px) * HoopNet.DAMPING;
      const vy = (p.y - p.py) * HoopNet.DAMPING;
      p.px = p.x;
      p.py = p.y;
      p.x += vx;
      p.y += vy + HoopNet.GRAVITY * dt * dt;
    }
    let touched = 0;
    const reach = HoopBall.RADIUS + HoopNet.PADDING;
    for (const p of this.points) {
      if (p.pinned) continue;
      const dx = p.x - ball.x;
      const dy = p.y - ball.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= reach || dist === 0) continue;
      p.x = ball.x + (dx / dist) * reach;
      p.y = ball.y + (dy / dist) * reach;
      touched++;
    }
    for (let k = 0; k < HoopNet.ITERATIONS; k++)
      for (const { a, b, rest } of this.links) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist <= rest) continue;
        const pull = (dist - rest) / dist;
        const share = a.pinned || b.pinned ? 1 : 0.5;
        if (!a.pinned) {
          a.x += dx * pull * share;
          a.y += dy * pull * share;
        }
        if (!b.pinned) {
          b.x -= dx * pull * share;
          b.y -= dy * pull * share;
        }
      }
    return touched;
  }

  draw(ctx) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(250,250,252,0.92)";
    ctx.lineWidth = 0.32;
    ctx.beginPath();
    for (const { a, b, diagonal } of this.links) {
      if (!diagonal) continue;
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    const last = HoopNet.ROWS - 1;
    for (let col = 0; col + 1 < HoopNet.COLUMNS; col++) {
      ctx.moveTo(this.at(col, last).x, this.at(col, last).y);
      ctx.lineTo(this.at(col + 1, last).x, this.at(col + 1, last).y);
    }
    ctx.stroke();
    ctx.restore();
  }
}
