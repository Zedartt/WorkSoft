class WestHud {
  static FONT = 'Georgia, "Times New Roman", serif';
  static GOLD = "#ffd23f";
  static COLORS = { me: "#4c9dff", foe: "#ff4d60" };

  static star(ctx, x, y, r, filled, color) {
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6 - Math.PI / 2,
        d = i % 2 ? r * 0.52 : r;
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
    ctx.lineWidth = Math.max(1.5, r * 0.14);
    ctx.lineJoin = "round";
    if (filled) {
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(90,50,0,0.7)";
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.stroke();
    }
  }

  static hourglass(ctx, x, y, s, color, turn = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(turn);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = s * 0.09;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, -s * 0.5);
    ctx.lineTo(s * 0.42, -s * 0.5);
    ctx.moveTo(-s * 0.42, s * 0.5);
    ctx.lineTo(s * 0.42, s * 0.5);
    ctx.moveTo(-s * 0.32, -s * 0.5);
    ctx.lineTo(-s * 0.32, -s * 0.3);
    ctx.lineTo(0, 0);
    ctx.lineTo(-s * 0.32, s * 0.3);
    ctx.lineTo(-s * 0.32, s * 0.5);
    ctx.moveTo(s * 0.32, -s * 0.5);
    ctx.lineTo(s * 0.32, -s * 0.3);
    ctx.lineTo(0, 0);
    ctx.lineTo(s * 0.32, s * 0.3);
    ctx.lineTo(s * 0.32, s * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, s * 0.44);
    ctx.lineTo(s * 0.22, s * 0.44);
    ctx.lineTo(0, s * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  static revolver(ctx, x, y, s, color) {
    ctx.save();
    ctx.translate(x - s * 0.1, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-s * 0.1, -s * 0.2, s * 0.62, s * 0.14, s * 0.03);
    ctx.roundRect(-s * 0.18, -s * 0.24, s * 0.32, s * 0.26, s * 0.06);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.16, -s * 0.02);
    ctx.lineTo(-s * 0.5, s * 0.36);
    ctx.lineTo(-s * 0.3, s * 0.44);
    ctx.lineTo(-s * 0.02, s * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = s * 0.05;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(-s * 0.02, s * 0.06, s * 0.1, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.24);
    ctx.lineTo(-s * 0.3, -s * 0.34);
    ctx.stroke();
    ctx.restore();
  }

  static cross(ctx, x, y, s, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.18;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - s * 0.35, y - s * 0.35);
    ctx.lineTo(x + s * 0.35, y + s * 0.35);
    ctx.moveTo(x + s * 0.35, y - s * 0.35);
    ctx.lineTo(x - s * 0.35, y + s * 0.35);
    ctx.stroke();
  }

  static skull(ctx, x, y, s, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y - s * 0.08, s * 0.4, Math.PI * 0.85, Math.PI * 2.15);
    ctx.lineTo(x + s * 0.22, y + s * 0.42);
    ctx.lineTo(x - s * 0.22, y + s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    for (const dx of [-0.16, 0.16]) {
      ctx.beginPath();
      ctx.arc(x + dx * s, y - s * 0.05, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.1);
    ctx.lineTo(x - s * 0.06, y + s * 0.2);
    ctx.lineTo(x + s * 0.06, y + s * 0.2);
    ctx.fill();
  }

  static stopwatch(ctx, x, y, s, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = s * 0.12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(x, y + s * 0.06, s * 0.38, 0, Math.PI * 2);
    ctx.moveTo(x, y - s * 0.32);
    ctx.lineTo(x, y - s * 0.46);
    ctx.moveTo(x, y + s * 0.06);
    ctx.lineTo(x + s * 0.16, y - s * 0.1);
    ctx.stroke();
  }

  static keycap(ctx, x, y, s, letter, color, glow) {
    ctx.save();
    if (glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = s * 0.6;
    }
    ctx.fillStyle = "#6b5a44";
    ctx.beginPath();
    ctx.roundRect(x - s / 2, y - s / 2 + s * 0.1, s, s, s * 0.18);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#f6ecd6";
    ctx.beginPath();
    ctx.roundRect(x - s / 2, y - s / 2, s, s * 0.9, s * 0.18);
    ctx.fill();
    ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.fillStyle = "#2a1c10";
    ctx.font = `900 ${Math.round(s * 0.58)}px ${WestHud.FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, x, y - s * 0.03);
    ctx.restore();
  }

  static icon(ctx, name, x, y, s, color, t = 0) {
    if (name === "star") WestHud.star(ctx, x, y, s * 0.5, true, color);
    else if (name === "wait") WestHud.hourglass(ctx, x, y, s, color, Math.sin(t * 3) * 0.15);
    else if (name === "fire") WestHud.revolver(ctx, x, y, s, color);
    else if (name === "early") WestHud.cross(ctx, x, y, s, color);
    else if (name === "skull") WestHud.skull(ctx, x, y, s, color);
    else if (name === "time") WestHud.stopwatch(ctx, x, y, s, color);
  }

  static text(ctx, text, x, y, size, color, align = "center") {
    ctx.font = `900 ${Math.round(size)}px ${WestHud.FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(20,10,0,0.75)";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  draw(ctx, W, H, view) {
    const f = Math.max(12, Math.min(24, H * 0.05, W * 0.04)),
      top = Math.max(f * 1.2, H * 0.07);
    for (const side of ["me", "foe"]) {
      const left = side === "me",
        x = left ? W * 0.04 : W * 0.96;
      WestHud.text(ctx, view[side].name, x, top, f, WestHud.COLORS[side], left ? "left" : "right");
      const wins = view[side].wins,
        need = Math.min(view[side].need, view.maxStars - 1),
        filled = Math.min(wins, view.maxStars - need),
        shown = filled + need,
        gap = f * 1.7,
        start = left ? x + f * 0.75 : x - f * 0.75 - (shown - 1) * gap;
      for (let i = 0; i < shown; i++) {
        const stacked = wins > filled && i === filled - 1,
          sx = start + i * gap,
          sy = top + f * 1.55;
        WestHud.star(ctx, sx, sy, f * (stacked ? 0.85 : 0.7), i < filled, WestHud.GOLD);
        if (!stacked) continue;
        ctx.font = `900 ${Math.round(f * 0.72)}px ${WestHud.FONT}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#3a2200";
        ctx.fillText(String(wins), sx, sy + f * 0.04);
      }
    }
    if (view.round) {
      ctx.font = `700 ${Math.round(f * 0.8)}px ${WestHud.FONT}`;
      const label = `MANCHE ${view.round}`,
        w = ctx.measureText(label).width + f * 1.4;
      ctx.fillStyle = "rgba(30,15,5,0.55)";
      ctx.beginPath();
      ctx.roundRect(W / 2 - w / 2, top - f * 0.75, w, f * 1.5, f * 0.75);
      ctx.fill();
      WestHud.text(ctx, label, W / 2, top, f * 0.8, "#f3dfb6");
    }
    for (const key of view.keys || []) {
      const s = f * 2.1 * (key.hot ? 1 + 0.08 * Math.sin(view.t * 14) : 1);
      WestHud.keycap(ctx, key.x, key.y - s * 0.4 + Math.sin(view.t * 3) * 2, s, key.letter, key.color, key.hot);
    }
    for (const mark of view.marks) {
      const s = f * 1.6,
        bob = Math.sin(view.t * 4) * 3;
      WestHud.icon(ctx, mark.icon, mark.x, mark.y - s * 0.5 + bob, s, mark.color, view.t);
      if (mark.text) WestHud.text(ctx, mark.text, mark.x, mark.y + s * 0.45 + bob, f * 0.85, mark.color);
    }
    const b = view.banner;
    if (!b) return;
    const k = Math.min(1, b.k * 4),
      scale = 1.5 - 0.5 * (1 - Math.pow(1 - k, 3)),
      size = b.big ? Math.min(H * 0.16, W * 0.12) : Math.min(H * 0.08, W * 0.06),
      cy = H * 0.34;
    ctx.save();
    ctx.globalAlpha = Math.min(1, b.k * 6) * 0.55;
    const band = ctx.createLinearGradient(0, 0, W, 0);
    band.addColorStop(0, "rgba(20,10,0,0)");
    band.addColorStop(0.25, "rgba(20,10,0,0.85)");
    band.addColorStop(0.75, "rgba(20,10,0,0.85)");
    band.addColorStop(1, "rgba(20,10,0,0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, cy - size * 2.1, W, size * 3.2);
    ctx.translate(W / 2, cy);
    ctx.scale(scale, scale);
    ctx.globalAlpha = Math.min(1, b.k * 6);
    if (b.icon) WestHud.icon(ctx, b.icon, 0, -size * 0.95, size * 1.1, b.color, view.t);
    WestHud.text(ctx, b.text, 0, size * 0.35, size, b.color);
    ctx.restore();
  }
}
