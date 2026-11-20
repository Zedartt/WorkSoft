class Cowgirl {
  static NAME = "Carla";
  static LOOK = {
    hair: "#2e1a10",
    hairShade: "#170c06",
    hairLight: "#6a3d24",
    skin: "#f1cba6",
    skinMid: "#e2ad85",
    skinEdge: "#c98e66",
    skinLine: "#a96f4c",
    irisGlow: "#d9a04a",
    iris: "#b06a2c",
    irisShade: "#5a3216",
    irisRing: "#3a1e0c",
    brow: "#1e120b",
    lid: "#140d0a",
    lips: "#b45a5e",
    lipsLight: "#d0807e",
    jacket: "#22304f",
    jacketShade: "#131c33",
    stock: "#f6f3ec",
    stockShade: "#cfc8bb",
    gold: "#e2b54a",
    letter: "#f2c14e",
  };

  static svg() {
    const c = Cowgirl.LOOK;
    const eye = (x, side) => {
      const inner = x - 9 * side;
      const outer = x + 10.5 * side;
      const shape = `M${inner} 93Q${x} 82.5 ${outer} 89Q${x + 2 * side} 99.5 ${inner} 93Z`;
      const clip = side < 0 ? "hrCgEyeL" : "hrCgEyeR";
      return `<clipPath id="${clip}"><path d="${shape}"/></clipPath><path d="${shape}" fill="#fff"/>
        <g clip-path="url(#${clip})"><circle cx="${x}" cy="91.4" r="4.7" fill="url(#hrCgIris)" stroke="${c.irisRing}" stroke-width=".8"/>
        <path d="M${x} 88.6v-1.6M${x + 2.3} 89.2l1-1.1M${x + 2.6} 92.6l1.2.6M${x - 2.4} 92.8l-1.1.8M${x - 2.4} 89.3l-1-1" stroke="${c.irisGlow}" stroke-width=".7" stroke-linecap="round" opacity=".9"/>
        <circle cx="${x}" cy="91.4" r="2" fill="#0e0807"/></g><circle cx="${x + 1.6}" cy="89.8" r="1.2" fill="#fff"/>
        <path d="M${inner} 93Q${x} 82.5 ${outer} 89l${4.5 * side}-3.6" fill="none" stroke="${c.lid}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M${x + 4 * side} 84.6l${1 * side}-3M${x + 7.5 * side} 85.8l${2 * side}-2.8M${outer + 2 * side} 87.4l${3 * side}-1.6" stroke="${c.lid}" stroke-width="1.4" stroke-linecap="round"/>
        <path d="M${inner + side} 94.5Q${x + side} 98 ${outer - 1.5 * side} 91" fill="none" stroke="${c.skinLine}" stroke-width="1" opacity=".7"/>`;
    };
    const shine = (d) => `<path d="${d}" fill="none" stroke="${c.hairLight}" stroke-width="2" stroke-linecap="round" opacity=".65"/>`;
    const curtain = "M120 44C100 50 86 66 84 96C82 122 79 142 75 172C71 202 69 232 73 264C80 272 93 270 97 261C93 233 97 207 95 181C93 151 91 124 93 100C95 76 104 58 120 44Z";
    return `<svg viewBox="0 0 240 300" aria-label="${Cowgirl.NAME}">
      <defs>
        <radialGradient id="hrCgSkin" cx=".5" cy=".4" r=".65"><stop offset="0" stop-color="${c.skin}"/><stop offset=".7" stop-color="${c.skinMid}"/><stop offset="1" stop-color="${c.skinEdge}"/></radialGradient>
        <linearGradient id="hrCgHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.hair}"/><stop offset=".6" stop-color="${c.hairShade}"/><stop offset="1" stop-color="${c.hair}"/></linearGradient>
        <radialGradient id="hrCgIris" cx=".5" cy=".5" r=".5"><stop offset=".35" stop-color="${c.irisGlow}"/><stop offset=".7" stop-color="${c.iris}"/><stop offset="1" stop-color="${c.irisShade}"/></radialGradient>
        <linearGradient id="hrCgCoat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.jacket}"/><stop offset="1" stop-color="${c.jacketShade}"/></linearGradient>
      </defs>
      <path d="M74 100C64 60 88 30 120 30S176 60 166 100C176 140 184 190 182 230C181 250 178 268 176 280H64C62 268 59 250 58 230C56 190 64 140 74 100Z" fill="${c.hairShade}"/>
      <g transform="translate(0 -17)">
        <path d="M52 320c-3-64-4-108 12-130c10-13 30-17 44-26h24c14 9 34 13 44 26c16 22 15 66 12 130z" fill="url(#hrCgCoat)" stroke="${c.jacketShade}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M108 164L120 236L132 164z" fill="${c.stock}"/>
        <path d="M108 164L120 236L100 216L90 188L102 172zM132 164L120 236L140 216L150 188L138 172z" fill="${c.jacketShade}" stroke="#0b1122" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M120 236v84" stroke="#0b1122" stroke-width="1.6"/>
        <g fill="${c.gold}" stroke="#a07a24" stroke-width="1"><circle cx="120" cy="252" r="3"/><circle cx="120" cy="276" r="3"/></g>
        <path d="M66 282l30 4M174 282l-30 4" stroke="#0b1122" stroke-width="2" stroke-linecap="round"/>
        <path d="M64 196c-8 30-10 70-10 124M176 196c8 30 10 70 10 124" fill="none" stroke="#0b1122" stroke-width="1.4" opacity=".6"/>
        <path d="M125 208h20v11c0 8-5 13-10 16c-5-3-10-8-10-16z" fill="${c.jacketShade}" stroke="${c.letter}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M127.5 211h15" stroke="${c.letter}" stroke-width="1" opacity=".6"/>
        <text x="135" y="227" font-family="Georgia, 'Times New Roman', serif" font-size="14" font-weight="700" font-style="italic" text-anchor="middle" fill="${c.letter}">C</text>
      </g>
      <path d="M109 120v38q11 9 22 0v-38z" fill="${c.skinMid}"/>
      <path d="M109 128q11 14 22 0v8q-11 11-22 0z" fill="${c.skinLine}" opacity=".45"/>
      <path d="M105 145q15 10 30 0l3 14q-18 11-36 0z" fill="${c.stock}" stroke="${c.stockShade}" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M114 156q6 12 12 0" fill="none" stroke="${c.stockShade}" stroke-width="1.2"/>
      <rect x="112" y="161" width="16" height="3.4" rx="1.7" fill="${c.gold}" stroke="#a07a24" stroke-width=".8"/>
      <path d="M83 86c0-26 15-40 37-40s37 14 37 40c0 15-5 27-13 35c-8 7-16 11-24 11s-16-4-24-11c-8-8-13-20-13-35z" fill="url(#hrCgSkin)"/>
      <ellipse cx="96" cy="106" rx="8.5" ry="4.8" fill="#d9756a" opacity=".3"/><ellipse cx="144" cy="106" rx="8.5" ry="4.8" fill="#d9756a" opacity=".3"/>
      ${eye(104, -1)}${eye(136, 1)}
      <path d="M90 84q10-11 25-6l-.6 3.8q-12-4.2-22.4 4.6zM150 84q-10-11-25-6l.6 3.8q12-4.2 22.4 4.6z" fill="${c.brow}"/>
      <path d="M117 95q-1.8 7-4.2 10.8q3.4 4.6 7.2 3.2q3.8 1.4 7.2-3.2" fill="none" stroke="${c.skinLine}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M119 97v8" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".35"/>
      <g class="m m-normal"><path d="M106 116.5q6-4.2 11-2q3 1.2 6 0q5-2.2 11 2q-14 6-28 0z" fill="${c.lips}"/><path d="M106 116.5q14 16 28 0q-14 6-28 0z" fill="${c.lipsLight}"/><path d="M115 121.5q5 1.6 10 0" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".45"/></g>
      <g class="m m-happy"><path d="M106 115q14 18 28 0q-14 3.5-28 0z" fill="#5a1018" stroke="${c.lips}" stroke-width="3.4" stroke-linejoin="round"/><path d="M110 117.3q10 2.7 20 0l-1.4 3.2q-8.6 2.3-17.2 0z" fill="#fff"/></g>
      <ellipse class="m m-oops" cx="120" cy="120" rx="4.8" ry="5.6" fill="#5a1018" stroke="${c.lips}" stroke-width="3.4"/>
      <path d="M74 108C66 60 88 30 120 30S174 60 166 108L156 96C154 72 140 52 120 44C100 52 86 72 84 96Z" fill="url(#hrCgHair)"/>
      <path d="${curtain}" fill="url(#hrCgHair)"/>
      <path transform="matrix(-1 0 0 1 240 0)" d="${curtain}" fill="url(#hrCgHair)"/>
      <path d="M120 31v13" stroke="${c.skinMid}" stroke-width="1.6" stroke-linecap="round"/>
      ${shine("M112 38C98 46 88 62 86 92M128 38C142 46 152 62 154 92M84 140c-4 36-8 80-6 116M156 140c4 36 8 80 6 116M90 120c-2 30 0 60-2 100M150 120c2 30 0 60 2 100")}
    </svg>`;
  }
}
