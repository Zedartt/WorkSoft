class Gambler {
  static COLORS = ["#2f9be0", "#e5484d", "#f2b705", "#1fb36b", "#9b5cff", "#ff7a1a", "#ff4fa3", "#16c1d4"];
  static NAMES = ["Bleu", "Rouge", "Or", "Vert", "Violet", "Orange", "Rose", "Turquoise"];
  static LOOKS = [
    { skin: "#f1c7a3", hair: "#5b3a22", style: "short", extra: ["bowtie"] },
    { skin: "#f6d2b8", hair: "#f0c75a", style: "long", extra: ["earrings", "lips"] },
    { skin: "#e2b08c", hair: "#2b2b2b", style: "short", extra: ["tophat", "mustache", "tie"] },
    { skin: "#8a5a3c", hair: "#1c1410", style: "curly", extra: ["glasses", "tie"] },
    { skin: "#f4cfb2", hair: "#b8411f", style: "bun", extra: ["earrings", "lips", "freckles"] },
    { skin: "#c68b62", hair: "#3a2a20", style: "bald", extra: ["beard", "shades", "bowtie"] },
    { skin: "#e9b996", hair: "#2a1d14", style: "spiky", extra: ["cap", "tie"] },
    { skin: "#5f3b28", hair: "#ff7fc4", style: "bob", extra: ["earrings", "lips", "shades"] },
  ];

  static color(seat) {
    return Gambler.COLORS[seat % Gambler.COLORS.length];
  }

  static hairBack(look) {
    if (look.style === "long") return `<path d="M17 28c0-12 7-18 15-18s15 6 15 18v20c-4 3-26 3-30 0z" fill="${look.hair}"/>`;
    if (look.style === "bob") return `<path d="M17 30c0-13 7-19 15-19s15 6 15 19v8c-4 3-26 3-30 0z" fill="${look.hair}"/>`;
    if (look.style === "bun") return `<circle cx="32" cy="10" r="6" fill="${look.hair}"/>`;
    return "";
  }

  static hairFront(look) {
    const h = look.hair;
    if (look.style === "short") return `<path d="M19 27c0-10 6-15 13-15s13 5 13 15c-3-5-7-7-13-7s-10 2-13 7z" fill="${h}"/>`;
    if (look.style === "long") return `<path d="M19 28c1-10 6-15 13-15s12 5 13 15c-5-2-9-7-11-10-3 5-9 9-15 10z" fill="${h}"/>`;
    if (look.style === "curly") return `<g fill="${h}"><circle cx="21" cy="21" r="5"/><circle cx="27" cy="16" r="5.5"/><circle cx="34" cy="15" r="5.5"/><circle cx="41" cy="19" r="5"/><circle cx="44" cy="25" r="3.5"/><circle cx="19" cy="26" r="3.5"/></g>`;
    if (look.style === "bun") return `<path d="M19 28c0-10 6-15 13-15s13 5 13 15c-4-4-8-6-13-6s-9 2-13 6z" fill="${h}"/>`;
    if (look.style === "spiky") return `<path d="M19 26l2-9 3 4 3-8 3 6 4-8 2 7 4-5 1 7 4-2-1 8c-4-3-8-4-13-4s-9 1-12 4z" fill="${h}"/>`;
    if (look.style === "bob") return `<path d="M19 30c0-11 6-16 13-16s13 5 13 16c-2-6-6-8-9-8l-4 4-3-4c-4 0-8 3-10 8z" fill="${h}"/>`;
    return "";
  }

  static extras(look) {
    const parts = [];
    const has = (name) => look.extra.includes(name);
    if (has("freckles")) parts.push('<g fill="#c96f4a" opacity=".6"><circle cx="25" cy="33" r=".8"/><circle cx="27" cy="34.5" r=".8"/><circle cx="37" cy="34.5" r=".8"/><circle cx="39" cy="33" r=".8"/></g>');
    if (has("beard")) parts.push(`<path d="M20 31c1 9 6 13 12 13s11-4 12-13c-3 4-6 5-12 5s-9-1-12-5z" fill="${look.hair}"/>`);
    if (has("mustache")) parts.push(`<path d="M26 36c2-2 4-2 6-1 2-1 4-1 6 1-2 1-4 1-6 0-2 1-4 1-6 0z" fill="${look.hair}"/>`);
    if (has("glasses")) parts.push('<g fill="none" stroke="#1d1d1d" stroke-width="1.4"><circle cx="27" cy="29" r="4"/><circle cx="37" cy="29" r="4"/><path d="M31 29h2"/></g>');
    if (has("shades")) parts.push('<path d="M21 26h22v2l-2 4c-2 1-5 1-6-1l-1-2h-4l-1 2c-1 2-4 2-6 1l-2-4z" fill="#14161b"/><path d="M24 27.5h4M36 27.5h4" stroke="#6fd3ff" stroke-width="1" opacity=".7"/>');
    if (has("earrings")) parts.push('<g fill="#ffd34d"><circle cx="18.5" cy="34" r="1.6"/><circle cx="45.5" cy="34" r="1.6"/></g>');
    if (has("tophat")) parts.push('<path d="M14 18h36v3H14z" fill="#141414"/><path d="M21 3h22v16H21z" fill="#1d1d1d"/><path d="M21 14h22v3H21z" fill="#c0392b"/>');
    if (has("cap")) parts.push('<path d="M18 22c0-8 6-12 14-12s14 4 14 12z" fill="#2b2b2b"/><path d="M38 20h14c0 3-4 4-14 3z" fill="#2b2b2b"/><circle cx="32" cy="10.5" r="1.5" fill="#2b2b2b"/>');
    return parts.join("");
  }

  static face(look, mood) {
    const mouth = mood === "win" ? '<path d="M26 36q6 7 12 0z" fill="#7a1d1d"/>' : mood === "lose" ? '<path d="M27 39q5-4 10 0" fill="none" stroke="#5b2a20" stroke-width="1.6" stroke-linecap="round"/>' : '<path d="M27 36q5 4 10 0" fill="none" stroke="#5b2a20" stroke-width="1.6" stroke-linecap="round"/>';
    const lips = look.extra.includes("lips") && mood !== "win" && mood !== "lose" ? '<path d="M27.5 36q4.5 3.5 9 0q-4.5 1-9 0z" fill="#c43b52"/>' : "";
    return `<circle cx="27" cy="29" r="1.7" fill="#22170f"/><circle cx="37" cy="29" r="1.7" fill="#22170f"/><circle cx="27.6" cy="28.4" r=".5" fill="#fff"/><circle cx="37.6" cy="28.4" r=".5" fill="#fff"/><path d="M31.5 31.5q1 2 2 0" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1"/>${mouth}${lips}`;
  }

  static svg(seat, mood = "") {
    const look = Gambler.LOOKS[seat % Gambler.LOOKS.length],
      suit = Gambler.color(seat),
      has = (name) => look.extra.includes(name);
    const neckwear = has("bowtie") ? '<path d="M26 47l6 3 6-3v6l-6-3-6 3z" fill="#16181d"/>' : has("tie") ? '<path d="M30 47h4l-1 3 2 11h-6l2-11z" fill="#16181d"/>' : '<path d="M28 47l4 5 4-5" fill="none" stroke="#ffd34d" stroke-width="1.3"/>';
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${Gambler.hairBack(look)}<path d="M7 64c0-13 9-20 25-20s25 7 25 20z" fill="${suit}"/><path d="M7 64c0-13 9-20 25-20s25 7 25 20z" fill="rgba(0,0,0,.18)" transform="translate(0 2)" opacity=".5"/><path d="M24 45l8 12 8-12z" fill="#f7f7f7"/><path d="M22 46l10 14-6 4zM42 46 32 60l6 4z" fill="rgba(0,0,0,.22)"/>${neckwear}<rect x="28" y="38" width="8" height="8" rx="2" fill="${look.skin}"/><ellipse cx="19" cy="30" rx="2.5" ry="3.5" fill="${look.skin}"/><ellipse cx="45" cy="30" rx="2.5" ry="3.5" fill="${look.skin}"/><circle cx="32" cy="28" r="13" fill="${look.skin}"/><ellipse cx="25" cy="33" rx="2.4" ry="1.4" fill="#ff8a8a" opacity=".35"/><ellipse cx="39" cy="33" rx="2.4" ry="1.4" fill="#ff8a8a" opacity=".35"/>${Gambler.face(look, mood)}${Gambler.hairFront(look)}${Gambler.extras(look)}</svg>`;
  }
}
