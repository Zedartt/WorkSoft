class SpotArt {
  static CLIPPED = new Set(["mud", "dust", "dull", "grime", "wet", "foam", "lather", "rinse", "damp", "wound", "woundClean", "crust"]);

  static UPRIGHT = new Set(["rinse", "knot", "knotWet", "burr", "nail", "oiled", "bow"]);

  static draw(name, point) {
    const builder = SpotArt[name];
    if (!builder) return "";
    const turn = SpotArt.UPRIGHT.has(name) ? 0 : Math.round(point.seed * 360);
    return `<g transform="translate(${point.x} ${point.y}) rotate(${turn})">${builder(point.r, point.seed)}</g>`;
  }

  static MUDS = ["#6b4a26", "#5a3e22", "#7a5a32", "#4e3a24", "#806040"];

  static random(seed) {
    let state = Math.floor(seed * 2147483646) + 1;
    return () => (state = (state * 16807) % 2147483647) / 2147483647;
  }

  static outline(r, seed) {
    const next = SpotArt.random(seed);
    const count = 6 + Math.floor(next() * 5);
    const stretch = 1 + next() * 0.7;
    const corners = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = r * (0.6 + next() * 0.55);
      corners.push([Math.cos(angle) * radius * stretch, Math.sin(angle) * radius]);
    }
    const middle = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const fmt = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
    let d = `M${fmt(middle(corners[count - 1], corners[0]))}`;
    corners.forEach((corner, i) => (d += `Q${fmt(corner)} ${fmt(middle(corner, corners[(i + 1) % count]))}`));
    return `${d}Z`;
  }

  static blobs(r, seed, count, fill, size) {
    const next = SpotArt.random(seed + 0.37);
    let out = "";
    for (let i = 0; i < count; i++) {
      const angle = next() * Math.PI * 2;
      const distance = r * Math.sqrt(next()) * 0.85;
      const radius = size * (0.5 + next() * 0.8);
      out += `<circle cx="${(Math.cos(angle) * distance).toFixed(1)}" cy="${(Math.sin(angle) * distance).toFixed(1)}" r="${radius.toFixed(1)}" fill="${fill}"/>`;
    }
    return out;
  }

  static splashes(r, seed, fill) {
    const next = SpotArt.random(seed + 0.71);
    let out = "";
    const count = 2 + Math.floor(next() * 5);
    for (let i = 0; i < count; i++) {
      const angle = next() * Math.PI * 2;
      const distance = r * (1.05 + next() * 0.7);
      out += `<circle cx="${(Math.cos(angle) * distance).toFixed(1)}" cy="${(Math.sin(angle) * distance).toFixed(1)}" r="${(1.5 + next() * r * 0.14).toFixed(1)}" fill="${fill}"/>`;
    }
    return out;
  }

  static mudColor(seed) {
    return SpotArt.MUDS[Math.floor(seed * SpotArt.MUDS.length)];
  }

  static mud(r, seed) {
    const color = SpotArt.mudColor(seed);
    const light = HorseArt.lighten(color);
    return `<path d="${SpotArt.outline(r, seed)}" fill="${color}"/>${SpotArt.splashes(r, seed, color)}
      ${SpotArt.blobs(r * 0.7, seed, 3 + Math.floor(r / 10), light, r * 0.22)}
      <path d="M${-r * 0.4} ${-r * 0.15}l${r * 0.25} ${r * 0.18}l${r * 0.08} ${r * 0.3}M${r * 0.15} ${-r * 0.35}l${r * 0.18} ${r * 0.25}" stroke="${HorseArt.darken(color, 0.6)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  }

  static dust(r, seed) {
    return `<path d="${SpotArt.outline(r, seed)}" fill="#c9a877" opacity=".5"/>${SpotArt.blobs(r, seed, 4 + Math.floor(r / 5), "#a8875a", 2.2)}`;
  }

  static dull(r, seed) {
    return `<path d="${SpotArt.outline(r, seed)}" fill="#d8c9a8" opacity=".3"/>`;
  }

  static grime(r, seed) {
    return `<path d="${SpotArt.outline(r * 1.15, seed)}" fill="#5c4a30" opacity=".5"/>${SpotArt.blobs(r, seed, 6, "#4a3a22", 2.5)}${SpotArt.splashes(r, seed, "#5c4a30")}`;
  }

  static wet(r, seed) {
    return `<circle r="${r * 1.25}" fill="url(#hrWet)"/>${SpotArt.blobs(r, seed, 6, "#bfe6ff", 2.5)}`;
  }

  static foam(r, seed) {
    return `<circle r="${r * 1.2}" fill="url(#hrWet)"/>${SpotArt.blobs(r * 0.7, seed, 6, "#ffffff", r * 0.22)}`;
  }

  static lather(r, seed) {
    return `${SpotArt.blobs(r * 0.9, seed, 10, "#ffffff", r * 0.3)}${SpotArt.blobs(r * 0.6, seed + 0.3, 6, "#e3f1fb", r * 0.22)}`;
  }

  static rinse(r, seed) {
    return `<circle r="${r * 1.25}" fill="url(#hrWet)"/>${SpotArt.blobs(r * 0.6, seed, 3, "#ffffff", r * 0.16)}<path d="M-10 ${-r * 0.6}v${r}M4 ${-r * 0.4}v${r * 1.1}M16 ${-r * 0.7}v${r * 0.9}" stroke="#bfe6ff" stroke-width="3" stroke-linecap="round"/>`;
  }

  static damp(r, seed) {
    return `<circle r="${r * 1.1}" fill="url(#hrWet)" opacity=".7"/>${SpotArt.blobs(r, seed, 4, "#bfe6ff", 2.5)}`;
  }

  static knot(r) {
    return `<path d="M${-r * 0.7} 0c0-${r * 0.8} ${r * 1.2}-${r * 0.8} ${r * 1.2} 0s-${r * 1.1} ${r * 0.9}-${r * 1.2} 0c0-${r * 0.5} ${r * 0.8}-${r * 0.5} ${r * 0.8} 0" fill="none" stroke="#3a2a1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M${-r * 0.8} ${-r * 0.6}l-4-4M${r * 0.6} ${-r * 0.7}l4-5M${r * 0.7} ${r * 0.5}l5 3" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/>`;
  }

  static knotWet(r) {
    return `${SpotArt.knot(r)}<circle cx="${r * 0.4}" cy="${-r * 0.4}" r="2.5" fill="#bfe6ff"/><circle cx="${-r * 0.4}" cy="${r * 0.3}" r="2" fill="#bfe6ff"/>`;
  }

  static burr(r) {
    return `${SpotArt.knot(r)}<path d="M${-r} ${-r * 0.2}L${r} ${r * 0.3}" stroke="#7a5a30" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${r * 0.3}" cy="${-r * 0.1}" r="${r * 0.35}" fill="#8a6a2a"/>
      <path d="M${r * 0.3} ${-r * 0.6}v-4M${r * 0.75} ${-r * 0.1}h4M${r * 0.3} ${r * 0.4}v4M${-r * 0.15} ${-r * 0.1}h-4M${r * 0.6} ${-r * 0.45}l3-3M0 ${-r * 0.45}l-3-3" stroke="#5a4418" stroke-width="2" stroke-linecap="round"/>`;
  }

  static wound(r) {
    return `<path d="M${-r * 0.7} ${-r * 0.3}L${r * 0.7} ${r * 0.2}M${-r * 0.6} 0L${r * 0.5} ${r * 0.5}" stroke="#c0262f" stroke-width="4" stroke-linecap="round"/><circle r="${r * 0.9}" fill="#e5484d" opacity=".25"/>`;
  }

  static woundClean(r) {
    return `<path d="M${-r * 0.7} ${-r * 0.3}L${r * 0.7} ${r * 0.2}M${-r * 0.6} 0L${r * 0.5} ${r * 0.5}" stroke="#e88b8b" stroke-width="3.500" stroke-linecap="round"/>`;
  }

  static crust(r, seed) {
    return SpotArt.blobs(r * 0.6, seed, 5, "#8a7a5a", 3);
  }

  static packed(r, seed) {
    return `<path d="${SpotArt.outline(r, seed)}" fill="#5c3d1c"/>
      ${SpotArt.blobs(r * 0.8, seed, 6, "#74502a", r * 0.3)}${SpotArt.blobs(r * 0.6, seed + 0.5, 3, "#3a7a2a", 2.5)}`;
  }

  static stone(r) {
    return `<path d="M${-r} 2C${-r} ${-r * 0.7} ${-r * 0.2} ${-r} ${r * 0.5} ${-r * 0.7}C${r} ${-r * 0.3} ${r} ${r * 0.6} ${r * 0.2} ${r * 0.8}C${-r * 0.5} ${r} ${-r} ${r * 0.6} ${-r} 2Z" fill="#8b95a5" stroke="#4a5260" stroke-width="2.500"/>
      <path d="M${-r * 0.4} ${-r * 0.4}q${r * 0.3}-${r * 0.2} ${r * 0.6} 0" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>`;
  }

  static nail() {
    return `<rect x="-7" y="-10" width="14" height="12" rx="3" fill="#c5ccd5" stroke="#4a5260" stroke-width="2"/><rect x="-3" y="2" width="6" height="8" fill="#7d8894"/>`;
  }

  static oiled(r) {
    return `<path d="M${-r * 0.5} ${-r * 0.4}q${r * 0.5}-${r * 0.4} ${r} 0" stroke="#fff" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`;
  }

  static bow() {
    return `<path d="M0 0L-18 -12V12ZM0 0L18 -12V12Z" fill="#e5484d" stroke="#8c1c22" stroke-width="2" stroke-linejoin="round"/><circle r="6" fill="#b8323e" stroke="#8c1c22" stroke-width="2"/><path d="M-3 4l-6 18M3 4l6 18" stroke="#e5484d" stroke-width="4" stroke-linecap="round"/>`;
  }
}
