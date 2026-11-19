class HoofArt {
  static W = 300;
  static H = 340;
  static ZONES = {
    sole: { x: 150, y: 172, rx: 62, ry: 88, weight: 1 },
  };
  static NAILS = [[56, 150], [52, 200], [60, 250], [244, 150], [248, 200], [240, 250]];

  static svg(model) {
    const nails = HoofArt.NAILS.map(([x, y]) => `<rect x="${x - 4}" y="${y - 3}" width="8" height="6" rx="1.500" fill="#5a6473"/>`).join("");
    return `<svg class="hr-hoof-svg" viewBox="0 0 ${HoofArt.W} ${HoofArt.H}" aria-label="Dessous du sabot">
      <defs>
        <radialGradient id="hrSole" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#f1e2c4"/><stop offset="1" stop-color="#d6bd92"/></radialGradient>
        <linearGradient id="hrShoe" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d5dbe2"/><stop offset="1" stop-color="#7d8894"/></linearGradient>
      </defs>
      <ellipse cx="150" cy="324" rx="120" ry="12" fill="rgba(40,24,10,.2)"/>
      <path d="M150 26C224 26 268 92 266 172C264 238 246 286 220 314C206 326 188 320 182 306L150 254L118 306C112 320 94 326 80 314C54 286 36 238 34 172C32 92 76 26 150 26Z" fill="${model.hoof}" stroke="${HorseArt.OUTLINE}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M150 64C202 64 230 106 232 164C234 216 222 258 202 286L150 232L98 286C78 258 66 216 68 164C70 106 98 64 150 64Z" fill="url(#hrSole)"/>
      <path d="M78 300C52 252 46 202 50 160C56 92 100 46 150 46C200 46 244 92 250 160C254 202 248 252 222 300" fill="none" stroke="#3d4650" stroke-width="27" stroke-linecap="round"/>
      <path d="M78 300C52 252 46 202 50 160C56 92 100 46 150 46C200 46 244 92 250 160C254 202 248 252 222 300" fill="none" stroke="url(#hrShoe)" stroke-width="21" stroke-linecap="round"/>
      ${nails}
      <path d="M150 128C162 158 178 220 198 290C182 302 166 294 150 264C134 294 118 302 102 290C122 220 138 158 150 128Z" fill="#c9a77a" stroke="#8c6a44" stroke-width="3" stroke-linejoin="round"/>
      <path d="M150 168V258" stroke="#8c6a44" stroke-width="3" stroke-linecap="round"/>
      <path d="M112 214C120 190 132 164 142 146M188 214C180 190 168 164 158 146" fill="none" stroke="#a9875a" stroke-width="2.500" stroke-linecap="round"/>
      <text x="150" y="20" text-anchor="middle" font-size="13" font-weight="700" fill="#8b95a5" font-family="system-ui, sans-serif">PINCE</text>
      <text x="150" y="338" text-anchor="middle" font-size="13" font-weight="700" fill="#8b95a5" font-family="system-ui, sans-serif">TALONS</text>
    </svg>`;
  }
}
