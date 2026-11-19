class Cowgirl {
  static NAME = "Carla";
  static LOOK = {
    hair: "#3d2314",
    hairShade: "#22130a",
    hairLight: "#6e4a30",
    iris: "#c8955a",
    irisShade: "#8a5a2a",
    brow: "#2a170d",
    lid: "#1a1414",
    hat: "#b07a45",
    hatShade: "#7a4f26",
    hatBand: "#4a2a14",
    shirt: "#4f86c6",
    shirtShade: "#30609a",
    vest: "#8a5a2e",
    vestShade: "#5e3a18",
    bandana: "#d43a3a",
    letter: "#f2c14e",
  };

  static svg() {
    const c = Cowgirl.LOOK;
    const eye = (x, side) => {
      const inner = x - 9 * side;
      const outer = x + 10 * side;
      return `<path d="M${inner} 93Q${x} 83 ${outer} 89Q${x + 2 * side} 99 ${inner} 93Z" fill="#fff"/>
        <circle cx="${x}" cy="91.6" r="4.4" fill="url(#hrCgIris)"/><circle cx="${x}" cy="91.6" r="1.9" fill="#161616"/><circle cx="${x + 1.5}" cy="90" r="1.1" fill="#fff"/>
        <path d="M${inner} 93Q${x} 83 ${outer} 89l${3 * side}-3" fill="none" stroke="${c.lid}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M${inner + side} 94.5Q${x + side} 97.5 ${outer - 2 * side} 91" fill="none" stroke="#c9906a" stroke-width="1" opacity=".7"/>`;
    };
    const shine = (d) => `<path d="${d}" fill="none" stroke="${c.hairLight}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`;
    return `<svg viewBox="0 0 240 300" aria-label="${Cowgirl.NAME}">
      <defs>
        <radialGradient id="hrCgSkin" cx=".5" cy=".4" r=".65"><stop offset="0" stop-color="#fde0c6"/><stop offset=".7" stop-color="#f6ceac"/><stop offset="1" stop-color="#e6b08a"/></radialGradient>
        <linearGradient id="hrCgHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.hair}"/><stop offset="1" stop-color="${c.hairShade}"/></linearGradient>
        <radialGradient id="hrCgIris" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${c.iris}"/><stop offset="1" stop-color="${c.irisShade}"/></radialGradient>
        <linearGradient id="hrCgHat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.hat}"/><stop offset="1" stop-color="${c.hatShade}"/></linearGradient>
      </defs>
      <path d="M76 96C68 56 92 34 120 34s52 22 44 62c4 34 14 64 12 118c-1 30-6 58-8 86H72c-2-28-7-56-8-86c-2-54 8-84 12-118z" fill="${c.hairShade}"/>
      <g transform="translate(0 -17)">
        <path d="M52 320c-3-64-4-108 12-130c10-13 30-17 44-26h24c14 9 34 13 44 26c16 22 15 66 12 130z" fill="${c.shirt}" stroke="${c.shirtShade}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M120 186v134" stroke="${c.shirtShade}" stroke-width="2"/>
        <g fill="#f4f1ea"><circle cx="120" cy="214" r="2.4"/><circle cx="120" cy="240" r="2.4"/><circle cx="120" cy="266" r="2.4"/><circle cx="120" cy="292" r="2.4"/></g>
        <path d="M64 196c10-12 28-18 42-24l4 148H54c-2-50-2-98 10-124zM176 196c-10-12-28-18-42-24l-4 148h56c2-50 2-98-10-124z" fill="${c.vest}" stroke="${c.vestShade}" stroke-width="2.5" stroke-linejoin="round"/>
        <path d="M70 250h34M136 250h34" stroke="${c.vestShade}" stroke-width="2" stroke-dasharray="4 4"/>
        <path d="M98 166l22 34l22-34l8 6l-30 44l-30-44z" fill="${c.bandana}" stroke="#9c2222" stroke-width="2" stroke-linejoin="round"/>
        <g fill="#fff" opacity=".8"><circle cx="110" cy="182" r="1.8"/><circle cx="130" cy="182" r="1.8"/><circle cx="120" cy="196" r="1.8"/></g>
        <path d="M132 207h28v13c0 11-7 18-14 21c-7-3-14-10-14-21z" fill="${c.vestShade}" stroke="${c.letter}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M135 210h22" stroke="${c.letter}" stroke-width="1" opacity=".6"/>
        <text x="146" y="231" font-family="Georgia, 'Times New Roman', serif" font-size="19" font-weight="700" font-style="italic" text-anchor="middle" fill="${c.letter}">C</text>
      </g>
      <path d="M109 120v38q11 9 22 0v-38z" fill="#e8b792"/>
      <path d="M109 128q11 14 22 0v8q-11 11-22 0z" fill="#c48a64" opacity=".5"/>
      <ellipse cx="80.5" cy="93" rx="5" ry="9" fill="#efc29e"/><ellipse cx="159.5" cy="93" rx="5" ry="9" fill="#efc29e"/>
      <path d="M83 86c0-26 15-40 37-40s37 14 37 40c0 15-5 27-13 35c-8 7-16 11-24 11s-16-4-24-11c-8-8-13-20-13-35z" fill="url(#hrCgSkin)"/>
      <ellipse cx="96" cy="106" rx="8.5" ry="4.8" fill="#e88b8b" opacity=".35"/><ellipse cx="144" cy="106" rx="8.5" ry="4.8" fill="#e88b8b" opacity=".35"/>
      <g fill="#c98a5e" opacity=".6"><circle cx="95" cy="101" r="1"/><circle cx="100" cy="104" r="1"/><circle cx="145" cy="101" r="1"/><circle cx="140" cy="104" r="1"/></g>
      ${eye(104, -1)}${eye(136, 1)}
      <path d="M93 82.5q10-8.5 22-3.8v2.5q-11-3.3-21 3.2zM147 82.5q-10-8.5-22-3.8v2.5q11-3.3 21 3.2z" fill="${c.brow}"/>
      <path d="M117 95q-1.8 7-4.2 10.8q3.4 4.6 7.2 3.2q3.8 1.4 7.2-3.2" fill="none" stroke="#c48a64" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="m m-normal"><path d="M107 116.5q5.5-3.3 10-1.7q3 1.2 6 0q4.5-1.6 10 1.7q-13 6-26 0z" fill="#b8323e"/><path d="M107 116.5q13 14 26 0q-13 6-26 0z" fill="#d6505a"/></g>
      <g class="m m-happy"><path d="M106 115q14 18 28 0q-14 3.5-28 0z" fill="#5a1018" stroke="#c43a46" stroke-width="3.2" stroke-linejoin="round"/><path d="M110 117.3q10 2.7 20 0l-1.4 3.2q-8.6 2.3-17.2 0z" fill="#fff"/></g>
      <ellipse class="m m-oops" cx="120" cy="120" rx="4.8" ry="5.6" fill="#5a1018" stroke="#c43a46" stroke-width="3.2"/>
      <path transform="translate(-8 0)" d="M84 60C76 74 76 90 78 100C70 130 60 160 62 200C64 230 72 250 70 268c8 6 20 4 24-6c-4-26 2-52-2-82c-4-30 0-56 4-80c2-14 0-28-4-40z" fill="url(#hrCgHair)"/>
      <path transform="translate(8 0)" d="M156 60c8 14 8 30 6 40c8 30 18 60 16 100c-2 30-10 50-8 68c-8 6-20 4-24-6c4-26-2-52 2-82c4-30 0-56-4-80c-2-14 0-28 4-40z" fill="url(#hrCgHair)"/>
      <path d="M86 62c10 6 22 8 34 8s24-2 34-8c-2 10-14 18-34 18s-32-8-34-18z" fill="url(#hrCgHair)"/>
      ${shine("M72 100c-4 40-6 90-4 160M168 100c4 40 6 90 4 160M100 72c8 3 16 4 26 3")}
      <path d="M88 52C88 20 102 8 120 16C138 8 152 20 152 52Z" fill="url(#hrCgHat)" stroke="${c.hatBand}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M120 18c-4 10-4 22-2 32" fill="none" stroke="${c.hatShade}" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M88 44h64v9H88z" fill="${c.hatBand}"/>
      <circle cx="138" cy="48.5" r="3" fill="${c.letter}"/>
      <path d="M30 56C44 40 70 50 120 50S196 40 210 56C200 70 170 66 120 66S40 70 30 56Z" fill="url(#hrCgHat)" stroke="${c.hatBand}" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M44 58c20 6 48 4 76 4s56 2 76-4" fill="none" stroke="${c.hatShade}" stroke-width="2" opacity=".7"/>
    </svg>`;
  }
}
