class Croupier {
  static SKIN = "#f0c39d";
  static SKIN_DARK = "#d9a37b";
  static HAIR = "#3a2618";

  static svg() {
    const skin = Croupier.SKIN,
      arm = (side) => {
        const s = side;
        return `<g class="wj-arm wj-arm-${s > 0 ? "r" : "l"}"><path d="M${30 * s} -2C${34 * s} -16 ${28 * s} -30 ${17 * s} -40" fill="none" stroke="#f6f6f6" stroke-width="13" stroke-linecap="round"/><path d="M${33 * s} -14l${-1 * s} -6" stroke="#c8252d" stroke-width="13" stroke-linecap="butt" opacity=".9"/><path d="M${21 * s} -36l${-4 * s} -4" stroke="#1b1d22" stroke-width="13" stroke-linecap="butt"/><circle cx="${15 * s}" cy="-45" r="7" fill="${skin}"/><path d="M${10 * s} -49q${4 * s} -5 ${9 * s} -1" stroke="${Croupier.SKIN_DARK}" stroke-width="1.6" fill="none"/></g>`;
      };
    return `<svg viewBox="-60 -62 120 112" aria-hidden="true"><ellipse cx="0" cy="8" rx="48" ry="30" fill="rgba(0,0,0,.28)"/><ellipse cx="0" cy="4" rx="41" ry="21" fill="#1b1d22"/><ellipse cx="0" cy="1" rx="35" ry="15" fill="#2c3038"/><path d="M-11 -15 0 -4 11 -15z" fill="#fff"/><path d="M-8 -17l8 3.5 8-3.5v7l-8-3.5-8 3.5z" fill="#c8252d" stroke="#7d1218" stroke-width="1"/>${arm(-1)}${arm(1)}<ellipse cx="-17.5" cy="3" rx="3.4" ry="5.5" fill="${Croupier.SKIN_DARK}"/><ellipse cx="17.5" cy="3" rx="3.4" ry="5.5" fill="${Croupier.SKIN_DARK}"/><circle cx="0" cy="2" r="17" fill="${skin}"/><circle cx="0" cy="5.5" r="15.5" fill="${Croupier.HAIR}"/><path d="M-12 8q12 8 24 0" stroke="rgba(255,255,255,.12)" stroke-width="2" fill="none"/><ellipse cx="0" cy="-15.5" rx="3.4" ry="2.6" fill="${Croupier.SKIN_DARK}"/><path d="M-18 -3a18 18 0 0 1 36 0l5-6a25 25 0 0 0-46 0z" fill="rgba(40,205,120,.82)" stroke="#0f6b3d" stroke-width="1.2"/><circle cx="0" cy="2" r="17.5" fill="none" stroke="#0f6b3d" stroke-width="2.4"/></svg>`;
  }

  constructor(el) {
    this.el = el;
    this.angle = 0;
    el.innerHTML = Croupier.svg();
  }

  face(deg) {
    const delta = ((((deg - this.angle) % 360) + 540) % 360) - 180;
    if (Math.abs(delta) < 0.5) return;
    this.angle += delta;
    this.el.style.setProperty("--turn", `${this.angle.toFixed(1)}deg`);
  }

  deal() {
    this.el.classList.remove("wj-dealing");
    void this.el.offsetWidth;
    this.el.classList.add("wj-dealing");
  }
}
