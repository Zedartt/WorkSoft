class Avatar {
  static SKIN = ["#f6d2b3", "#e9b98f", "#c98d62", "#8d5a3b"];
  static HAIR = ["#2b2b2b", "#6b4423", "#d9b36a", "#8a8f98", "#3a2a5a"];
  static SHIRT = ["#2f9be0", "#e5484d", "#3fae6a", "#f0a53a", "#9a6be0"];
  static chef(who) {
    const f = who === "femme",
      k = f ? "F" : "H";
    const c = f
      ? { h1: "#9a2038", h2: "#5c0f1e", lo: "#3d0a14", hi: "#c4506a", i1: "#a87446", i2: "#4a2c16", brow: "#3a1c14", lid: "#1a1414" }
      : { h1: "#ea6a2e", h2: "#b9441a", lo: "#8f3312", hi: "#ffab6e", i1: "#7dba96", i2: "#3f7a58", brow: "#a8431c", lid: "#6a3a26" };
    const eye = (x) =>
      `<path d="M${x - 9} 92q9-7.500 18 0q-9 5.500-18 0z" fill="#fff"/><circle cx="${x}" cy="91.500" r="4.500" fill="url(#ckIris${k})"/><circle cx="${x}" cy="91.500" r="2" fill="#161616"/><circle cx="${x + 1.6}" cy="89.800" r="1.150" fill="#fff"/><path d="M${x - 9} 92q9-7.500 18 0" fill="none" stroke="${c.lid}" stroke-width="${f ? 2.7 : 1.8}" stroke-linecap="round"/><path d="M${x - 7.5} 93.500q7.500 3.500 15 0" fill="none" stroke="#c9906a" stroke-width="1" opacity=".7"/><path d="M${x - 8} 86.500q8-4 16 0" fill="none" stroke="#d9a47e" stroke-width="1.200" opacity=".8"/>`;
    const hl = (d) => `<path d="${d}" fill="none" stroke="${c.hi}" stroke-width="2.200" stroke-linecap="round" opacity=".78"/>`;
    return `<svg viewBox="0 0 240 300" aria-label="Le personnage">
      <defs>
        <radialGradient id="ckSkin${k}" cx=".5" cy=".4" r=".65"><stop offset="0" stop-color="#fde0c6"/><stop offset=".7" stop-color="#f6ceac"/><stop offset="1" stop-color="#e6b08a"/></radialGradient>
        <linearGradient id="ckHair${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.h1}"/><stop offset="1" stop-color="${c.h2}"/></linearGradient>
        <radialGradient id="ckIris${k}" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="${c.i1}"/><stop offset="1" stop-color="${c.i2}"/></radialGradient>
        <linearGradient id="ckCoat${k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9e0e8"/><stop offset=".2" stop-color="#fbfcfd"/><stop offset=".8" stop-color="#fbfcfd"/><stop offset="1" stop-color="#d9e0e8"/></linearGradient>
      </defs>
      ${f ? `<path d="M76 96C68 56 92 34 120 34s52 22 44 62c4 34 14 64 12 118c-1 30-6 58-8 86H72c-2-28-7-56-8-86c-2-54 8-84 12-118z" fill="${c.h2}"/><path d="M98 150c-4 50-2 100 3 150M142 150c4 50 2 100-3 150M120 160v140" fill="none" stroke="${c.lo}" stroke-width="3" opacity=".45"/>` : ""}
      <g transform="translate(0 ${f ? -17 : -14})">
      <path d="${f ? "M52 320c-3-64-4-108 12-130c10-13 30-17 44-26h24c14 9 34 13 44 26c16 22 15 66 12 130z" : "M34 320c-3-66-5-116 16-138c12-13 36-17 52-26h36c16 9 40 13 52 26c21 22 19 72 16 138z"}" fill="url(#ckCoat${k})" stroke="#b7c0cc" stroke-width="2.500" stroke-linejoin="round"/>
      <path d="M${f ? "72 320c-2-54 0-82 6-104M168 320c2-54 0-82-6-104" : "58 320c-2-56 0-86 7-110M182 320c2-56 0-86-7-110"}" fill="none" stroke="#c6ced8" stroke-width="2" stroke-linecap="round"/>
      <path d="M${f ? "108 160l12 26l12-26l10 4l-22 44l-22-44z" : "104 152l16 30l16-30l12 5l-28 50l-28-50z"}" fill="#f1f4f7" stroke="#b7c0cc" stroke-width="2" stroke-linejoin="round"/>
      <path d="M${f ? "120 208c5 28 5 70 3 112" : "120 207c6 28 6 70 4 113"}" fill="none" stroke="#b7c0cc" stroke-width="2"/>
      <g fill="#a3aebb"><circle cx="${f ? 110 : 107}" cy="232" r="3"/><circle cx="${f ? 136 : 141}" cy="232" r="3"/><circle cx="${f ? 110 : 107}" cy="258" r="3"/><circle cx="${f ? 136 : 141}" cy="258" r="3"/><circle cx="${f ? 110 : 107}" cy="284" r="3"/><circle cx="${f ? 136 : 141}" cy="284" r="3"/></g>
      <text x="${f ? 147 : 162}" y="${f ? 212 : 200}" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" font-style="italic" text-anchor="middle" fill="${f ? "#8c1c30" : "#1f4e8c"}">${f ? "E" : "J"}</text>
      </g>
      <path d="M${f ? "109 120v38q11 9 22 0v-38z" : "105 118v36q15 13 30 0v-36z"}" fill="#e8b792"/>
      <path d="M${f ? "109 128q11 14 22 0v8q-11 11-22 0z" : "105 126q15 18 30 0v10q-15 13-30 0z"}" fill="#c48a64" opacity=".5"/>
      <ellipse cx="80.500" cy="93" rx="5" ry="9" fill="#efc29e"/><ellipse cx="159.500" cy="93" rx="5" ry="9" fill="#efc29e"/>
      <path d="M80 92q1-3.500 3-4.500M160 92q-1-3.500-3-4.500" fill="none" stroke="#c48a64" stroke-width="1.300" stroke-linecap="round"/>
      ${f ? "" : `<path d="M79 96C73 66 88 42 120 40s47 26 41 56c-1-9-3-16-6-22H85c-3 6-5 13-6 22z" fill="${c.lo}"/>`}
      <path d="${f ? "M83 86c0-26 15-40 37-40s37 14 37 40c0 15-5 27-13 35c-8 7-16 11-24 11s-16-4-24-11c-8-8-13-20-13-35z" : "M81 86c0-26 16-40 39-40s39 14 39 40c0 16-5 28-13 36c-8 7-17 11-26 11s-18-4-26-11c-8-8-13-20-13-36z"}" fill="url(#ckSkin${k})"/>
      ${
        f
          ? `<ellipse cx="96" cy="106" rx="8.500" ry="4.800" fill="#e88b8b" opacity=".32"/><ellipse cx="144" cy="106" rx="8.500" ry="4.800" fill="#e88b8b" opacity=".32"/>
        <ellipse cx="104" cy="90" rx="11" ry="6" fill="#4a2a2a" opacity=".15"/><ellipse cx="136" cy="90" rx="11" ry="6" fill="#4a2a2a" opacity=".15"/>`
          : `<g fill="#d99a72" opacity=".7"><circle cx="95" cy="102" r="1.100"/><circle cx="100" cy="105" r="1.100"/><circle cx="91" cy="106" r="1.100"/><circle cx="145" cy="102" r="1.100"/><circle cx="140" cy="105" r="1.100"/><circle cx="149" cy="106" r="1.100"/><circle cx="116" cy="101" r="1"/><circle cx="125" cy="102" r="1"/></g>`
      }
      ${eye(104)}${eye(136)}
      ${
        f
          ? `<path d="M95 92l-6.500-4.300M145 92l6.500-4.300" stroke="${c.lid}" stroke-width="2.700" stroke-linecap="round"/>
        <path d="M93 82.500q10-8.500 22-3.800v2.500q-11-3.300-21 3.200zM147 82.500q-10-8.500-22-3.800v2.500q11-3.300 21 3.200z" fill="${c.brow}"/>`
          : `<path d="M91.500 83q11-8.500 24-3.800v3.300q-12-3.300-23 3.500zM148.500 83q-11-8.500-24-3.800v3.300q12-3.300 23 3.500z" fill="${c.brow}"/>`
      }
      <path d="M117 95q-1.800 7-4.200 10.800q3.400 4.600 7.200 3.200q3.800 1.400 7.200-3.200" fill="none" stroke="#c48a64" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/>
      ${
        f
          ? `<circle cx="113.400" cy="105" r="1.400" fill="#f4f6f9" stroke="#8e98a6" stroke-width=".8"/>
        <g class="m m-normal"><path d="M107 116.500q5.500-3.300 10-1.700q3 1.200 6 0q4.500-1.600 10 1.700q-13 6-26 0z" fill="#a8142a"/><path d="M107 116.500q13 14 26 0q-13 6-26 0z" fill="#d42a40"/><path d="M114.500 123q5.500 2.200 11 0" fill="none" stroke="#fff" stroke-width="1.500" opacity=".45" stroke-linecap="round"/></g>
        <g class="m m-happy"><path d="M106 115q14 18 28 0q-14 3.500-28 0z" fill="#5a1018" stroke="#c81e34" stroke-width="3.200" stroke-linejoin="round"/><path d="M110 117.300q10 2.700 20 0l-1.400 3.200q-8.600 2.300-17.200 0z" fill="#fff"/></g>
        <ellipse class="m m-oops" cx="120" cy="120" rx="4.800" ry="5.600" fill="#5a1018" stroke="#c81e34" stroke-width="3.200"/>`
          : `<g class="m m-normal"><path d="M108.500 117q11.500 6.500 23 0" fill="none" stroke="#9a4a3c" stroke-width="2.500" stroke-linecap="round"/><path d="M113.500 123q6.500 2.300 13 0" fill="none" stroke="#d9a07c" stroke-width="1.700" stroke-linecap="round"/></g>
        <g class="m m-happy"><path d="M107 115q13 16 26 0q-13 3.300-26 0z" fill="#6a2420"/><path d="M110.500 117.200q9.500 2.600 19 0l-1.400 3q-8.100 2.200-16.200 0z" fill="#fff"/></g>
        <ellipse class="m m-oops" cx="120" cy="120" rx="5.200" ry="6" fill="#6a2420"/>`
      }
      ${
        f
          ? `<path d="M106 37C88 39 74 55 75 80c1 20-9 42-13 74c-4 32 5 56 2 86c-2 18 1 36 7 50c13 8 28 2 32-13c-5-19-2-41-4-65c-2-26 4-46 0-72c-2-16-8-30-10-42c-3-18 3-42 17-61z" fill="url(#ckHair${k})"/>
        <path d="M106 37c26-7 56 7 56 36c0 7-1 13-3 19c-7-12-19-20-33-24c-10-3-20-4-29-3c-3-9 1-20 9-28z" fill="url(#ckHair${k})"/>
        <path d="M162 68c6 20 0 40 4 62c3 16 6 30 3 44c-6 5-14 1-16-7c4-14-1-26-1-39c0-14 4-26 2-36c4-6 7-14 8-24z" fill="url(#ckHair${k})"/>
        <path d="M106 38c-5 8-8 17-9 27" fill="none" stroke="${c.lo}" stroke-width="2.200" stroke-linecap="round"/>
        ${hl("M102 44c-13 9-21 24-20 42c1 24-11 48-14 82c-3 30 5 52 3 78c-1 14 1 26 5 36M93 62c-3 10-3 20-1 30c3 22-8 44-11 78c-3 28 5 50 4 74")}${hl("M110 42c20-5 40 5 46 26M114 50c13-2 27 4 35 17M163 84c3 18-2 36 1 56c1 10 3 20 3 28")}`
          : `<path d="M79 71C74 50 94 35 121 35c26 0 44 14 40 34c-1 4-3 7-5 9l-5-13l-6 11l-6-12l-7 11l-7-12l-7 11l-7-11l-7 10l-6-9l-6 12l-4 4c-4-2-7-5-9-9z" fill="url(#ckHair${k})"/>
        ${hl("M117 40c-13 3-23 12-27 26M129 41c-9 5-15 13-17 25M141 45c-6 5-9 12-10 20M105 43c-9 5-15 12-17 22")}
        <path d="M80.500 80l3.500-2l1 16l-4-5zM159.500 80l-3.500-2l-1 16l4-5z" fill="${c.lo}"/>`
      }
    </svg>`;
  }

  static client(c) {
    return `<svg viewBox="0 0 60 60"><path d="M8 60c0-14 10-20 22-20s22 6 22 20z" fill="${c.shirt}"/><circle cx="30" cy="24" r="15" fill="${c.skin}"/><path d="M14 22c0-14 10-18 16-18s16 4 16 18c-6-8-12-10-16-10s-10 2-16 10z" fill="${c.hair}"/><circle cx="24" cy="26" r="2" fill="#2b2b2b"/><circle cx="36" cy="26" r="2" fill="#2b2b2b"/><path d="${c.low ? "M24 34q6-4 12 0" : "M24 32q6 5 12 0"}" fill="none" stroke="#2b2b2b" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
}
