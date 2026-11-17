class Geometry {
  static MIN_AREA = 500;
  static segHit(a, b, c, d) {
    const rx = b.x - a.x,
      ry = b.y - a.y,
      sx = d.x - c.x,
      sy = d.y - c.y;
    const den = rx * sy - ry * sx;
    if (Math.abs(den) < 1e-9) return null;
    const u = ((c.x - a.x) * sy - (c.y - a.y) * sx) / den,
      v = ((c.x - a.x) * ry - (c.y - a.y) * rx) / den;
    return u >= 0 && u <= 1 && v >= 0 && v <= 1
      ? {
          x: a.x + u * rx,
          y: a.y + u * ry,
        }
      : null;
  }

  static area(p) {
    let s = 0;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += (p[j].x + p[i].x) * (p[j].y - p[i].y);
    return Math.abs(s / 2);
  }

  static inside(p, x, y) {
    let w = 0;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      const a = p[j],
        b = p[i],
        side = (b.x - a.x) * (y - a.y) - (x - a.x) * (b.y - a.y);
      if (a.y <= y) {
        if (b.y > y && side > 0) w++;
      } else if (b.y <= y && side < 0) w--;
    }
    return w !== 0;
  }

  static findShapes(pts) {
    const n = pts.length,
      out = [];
    if (n < 6) return out;
    let minX = 1e9,
      minY = 1e9,
      maxX = -1e9,
      maxY = -1e9;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const diag = Math.hypot(maxX - minX, maxY - minY);
    const gap = Math.hypot(pts[0].x - pts[n - 1].x, pts[0].y - pts[n - 1].y);
    if (gap <= Math.max(70, diag * 0.6) && Geometry.area(pts) >= Geometry.MIN_AREA) {
      out.push(pts);
      out.auto = true;
    }
    let count = 0;
    for (let j = 2; j < n - 1; j++) {
      for (let i = 0; i < j - 1; i++) {
        const x = Geometry.segHit(pts[i], pts[i + 1], pts[j], pts[j + 1]);
        if (!x) continue;
        const loop = [x, ...pts.slice(i + 1, j + 1)];
        if (Geometry.area(loop) >= Geometry.MIN_AREA) out.push(loop);
        if (++count > 40) return out;
      }
    }
    return out;
  }
}
