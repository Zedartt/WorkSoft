class HorseArt {
  static W = 600;
  static H = 440;
  static OUTLINE = "#2a1a12";
  static BODY = "M196 168C222 146 286 160 336 158C384 156 428 136 470 150C504 162 508 214 494 246C480 276 440 288 404 286C350 292 290 294 250 284C214 276 190 252 188 216C187 196 189 180 196 168Z";
  static NECK = "M252 176C238 136 200 96 168 66C156 56 136 58 128 72C118 96 118 124 138 154C156 186 176 226 196 254C226 246 252 216 252 176Z";
  static HEAD = "M166 70C154 46 126 42 108 56C88 76 68 106 50 130C38 146 42 168 60 172C78 176 94 168 108 156C124 142 146 130 156 112C166 96 172 84 166 70Z";
  static FRONT = "M186 238C180 274 188 302 190 322C192 344 190 364 192 378C193 386 196 392 198 396H226C226 388 224 380 222 372C220 350 220 330 224 314C232 290 240 266 234 240Z";
  static HIND = "M412 210C404 256 422 284 438 304C446 316 448 334 448 354C448 372 450 386 452 396H480C478 384 476 372 476 358C476 336 480 322 486 306C498 278 504 236 490 200Z";
  static CHEEK = "M114 116a30 27 0 1 0 60 0a30 27 0 1 0-60 0Z";
  static EAR = "M150 58L156 20C166 30 170 46 164 64Z";
  static TAIL = "M478 158C520 140 546 170 544 212C542 252 554 292 570 336C562 346 548 344 540 338C536 348 520 348 512 336C502 298 496 256 492 220C490 198 486 180 478 158Z";
  static MANE = "M150 54C176 68 202 98 224 126C236 142 246 156 256 172C244 176 238 166 230 162C232 172 224 176 218 168C208 152 196 142 190 130C190 140 180 142 176 134C168 118 160 104 150 92C150 100 142 100 138 92C138 78 140 64 150 54Z";
  static MANE_LONG = "M150 54C176 68 202 98 224 126C236 142 246 156 256 172C250 196 240 196 232 186C230 200 218 200 212 188C202 172 190 162 184 150C182 164 170 164 166 152C160 138 152 124 144 112C142 124 134 124 130 112C132 90 138 66 150 54Z";
  static FORELOCK = "M152 54C142 58 134 68 130 80C136 78 140 74 144 70C144 76 148 80 154 78C156 70 158 60 152 54Z";
  static LEGS = [
    { path: "FRONT", dx: 0, far: false, hoofX: 212, name: "Antérieur gauche" },
    { path: "FRONT", dx: 34, far: true, hoofX: 246, name: "Antérieur droit" },
    { path: "HIND", dx: 0, far: false, hoofX: 466, name: "Postérieur gauche" },
    { path: "HIND", dx: -36, far: true, hoofX: 430, name: "Postérieur droit" },
  ];
  static GROUND = 396;
  static SOCK = "#f4f1ea";
  static ROAN_FLECKS = 380;
  static ZONES = {
    body: { x: 340, y: 212, rx: 130, ry: 48, weight: 5 },
    belly: { x: 340, y: 262, rx: 100, ry: 16, weight: 2 },
    rump: { x: 458, y: 200, rx: 32, ry: 42, weight: 2 },
    neck: { x: 200, y: 160, rx: 28, ry: 52, weight: 2 },
    head: { x: 112, y: 120, rx: 26, ry: 18, weight: 1 },
    front: { x: 208, y: 330, rx: 12, ry: 46, weight: 1.5 },
    hind: { x: 460, y: 320, rx: 14, ry: 56, weight: 1.5 },
  };
  static HOOF_H = 20;

  static svg(model) {
    const c = model;
    return `<svg class="hr-horse" viewBox="0 0 ${HorseArt.W} ${HorseArt.H}" aria-label="${c.name}">
      ${HorseArt.defs(c)}
      <ellipse cx="330" cy="416" rx="230" ry="16" fill="rgba(40,24,10,.22)"/>
      <g class="hr-legs-far">${HorseArt.legs(c, true)}</g>
      <g class="hr-tail" style="transform-origin:482px 168px">
        <use href="#hrTail" fill="none" stroke="${HorseArt.OUTLINE}" stroke-width="6"/>
        <use href="#hrTail" fill="url(#hrManeFill)"/>
        <path d="M494 190C500 240 506 290 520 330M506 186C514 236 518 280 534 330M488 200C490 250 496 290 508 326M516 196C524 240 528 290 540 332" fill="none" stroke="${c.maneShade}" stroke-width="3" opacity=".55" stroke-linecap="round"/>
        <path d="M500 180C508 220 512 260 524 300" fill="none" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
      </g>
      <use href="#hrEar" class="hr-ear-far" transform="translate(-14 4)" fill="${c.shade}" stroke="${HorseArt.OUTLINE}" stroke-width="5"/>
      <use href="#hrSilhouette" fill="none" stroke="${HorseArt.OUTLINE}" stroke-width="7" stroke-linejoin="round"/>
      <use href="#hrSilhouette" fill="url(#hrCoat)"/>
      <g clip-path="url(#hrClip)">
        ${HorseArt.pattern(c)}
        ${HorseArt.socks(c)}
        <g clip-path="url(#hrClipBody)">
        <path d="M190 240C250 266 300 272 360 268C410 266 450 256 500 228V300H190Z" fill="${c.shade}" opacity=".35"/>
        <path d="M262 168C300 172 360 170 420 152" fill="none" stroke="#fff" stroke-width="14" opacity=".14" stroke-linecap="round"/>
        <g class="hr-gloss"><path d="M250 178C300 184 370 180 440 162M270 200C320 204 380 200 430 186" fill="none" stroke="#fff" stroke-width="7" opacity=".35" stroke-linecap="round"/><path d="M462 176c10 6 16 18 14 30" fill="none" stroke="#fff" stroke-width="6" opacity=".35" stroke-linecap="round"/></g>
        <g class="hr-ribs" opacity="0">
          <path d="M296 196C290 220 292 246 300 266M318 194C312 220 314 246 322 268M340 192C334 220 336 246 344 268M362 192C356 218 358 244 366 266" fill="none" stroke="${c.shade}" stroke-width="5" stroke-linecap="round" opacity=".75"/>
          <path d="M420 168C430 158 448 158 456 168" fill="none" stroke="${c.shade}" stroke-width="5" stroke-linecap="round"/>
          <path d="M260 284C300 262 380 262 440 280" fill="${c.shade}" opacity=".35"/>
        </g>
        </g>
        ${HorseArt.muscles(c)}
        ${HorseArt.face(c)}
        <path d="M44 150C52 170 76 176 94 166L100 180H30Z" fill="${c.muzzle}" opacity=".85"/>
        <path d="M52 140c4-6 12-8 18-4" fill="none" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>
      </g>
      <use href="#hrEar" class="hr-ear" fill="url(#hrCoat)" stroke="${HorseArt.OUTLINE}" stroke-width="5" stroke-linejoin="round"/>
      <path class="hr-ear-in" d="M156 30C162 38 163 48 160 58C156 48 155 38 156 30Z" fill="${HorseArt.darken(c.color, 0.6)}" opacity=".7"/>
      ${HorseArt.horn(c)}
      <g class="hr-mane">
        <use href="#hrMane" fill="none" stroke="${HorseArt.OUTLINE}" stroke-width="5" stroke-linejoin="round"/>
        <use href="#hrMane" fill="url(#hrManeFill)"/>
        <path d="M160 70C176 86 196 110 212 134M172 74C188 94 206 118 226 146M154 80C166 96 180 114 192 128M182 82C200 104 220 130 240 160" fill="none" stroke="${c.maneShade}" stroke-width="2.500" opacity=".6" stroke-linecap="round"/>
        <path d="M164 64C186 82 208 108 230 138" fill="none" stroke="#fff" stroke-width="3" opacity=".3" stroke-linecap="round"/>
        <use href="#hrForelock" fill="url(#hrManeFill)" stroke="${HorseArt.OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
      </g>
      <g class="hr-eye">
        <g class="hr-eye-open">
          <ellipse cx="110" cy="94" rx="10" ry="11" fill="#fff" opacity=".9"/>
          <ellipse cx="110" cy="95" rx="8.500" ry="9.500" fill="#4a2a18"/>
          <ellipse cx="110" cy="98" rx="6" ry="5" fill="#7a4a28" opacity=".8"/>
          <ellipse cx="110" cy="95" rx="5" ry="6" fill="#120c0a"/>
          <circle cx="113.500" cy="90.500" r="3.200" fill="#fff"/>
          <circle cx="106.500" cy="99" r="1.500" fill="#fff" opacity=".8"/>
          <path d="M98 89C103 81 117 81 122 89" fill="none" stroke="${HorseArt.OUTLINE}" stroke-width="3.200" stroke-linecap="round"/>
          <path d="M100 84C106 78 116 78 121 83" fill="none" stroke="${c.shade}" stroke-width="2" opacity=".7" stroke-linecap="round"/>
          <path d="M100 86L95 81M105 84L102 78M111 83L110 76M117 84L119 78" stroke="${HorseArt.OUTLINE}" stroke-width="2" stroke-linecap="round"/>
        </g>
        <path class="hr-eye-shut" d="M100 94C105 100 115 100 120 94" fill="none" stroke="${HorseArt.OUTLINE}" stroke-width="3.500" stroke-linecap="round"/>
        <path class="hr-eye-sad" d="M98 88L122 92" stroke="${HorseArt.OUTLINE}" stroke-width="3" stroke-linecap="round"/>
      </g>
      <path d="M54 140C62 136 70 142 68 152C66 158 58 158 56 152C60 152 62 148 60 144C58 142 55 142 54 140Z" fill="#120c0a"/>
      <path d="M52 138C60 132 72 136 74 148" fill="none" stroke="${HorseArt.OUTLINE}" stroke-width="2.500" stroke-linecap="round" opacity=".7"/>
      <path d="M50 170C58 176 70 176 80 170" fill="none" stroke="${HorseArt.OUTLINE}" stroke-width="2" opacity=".5" stroke-linecap="round"/>
      <path class="hr-mouth" d="M46 164C56 168 68 168 78 164" fill="none" stroke="#120c0a" stroke-width="3" stroke-linecap="round"/>
      <g class="hr-hooves">${HorseArt.hooves(c, false)}</g>
    </svg>`;
  }

  static defs(c) {
    const leg = (index) => {
      const spec = HorseArt.LEGS[index];
      return `<use href="#hr${spec.path === "FRONT" ? "Front" : "Hind"}" transform="translate(${spec.dx} 0)"/>`;
    };
    return `<defs>
      <path id="hrBody" d="${HorseArt.BODY}"/>
      <path id="hrNeck" d="${HorseArt.NECK}"/>
      <path id="hrHead" d="${HorseArt.HEAD}"/>
      <path id="hrFront" d="${HorseArt.FRONT}"/>
      <path id="hrHind" d="${HorseArt.HIND}"/>
      <path id="hrEar" d="${HorseArt.EAR}"/>
      <path id="hrTail" d="${HorseArt.TAIL}"/>
      <path id="hrMane" d="${c.longMane ? HorseArt.MANE_LONG : HorseArt.MANE}"/>
      <path id="hrForelock" d="${HorseArt.FORELOCK}"/>
      <path id="hrCheek" d="${HorseArt.CHEEK}"/>
      <g id="hrSilhouette"><use href="#hrBody"/><use href="#hrNeck"/><use href="#hrHead"/><use href="#hrCheek"/>${leg(0)}${leg(2)}</g>
      <clipPath id="hrClip"><use href="#hrBody"/><use href="#hrNeck"/><use href="#hrHead"/><use href="#hrCheek"/>${leg(0)}${leg(2)}</clipPath>
      <clipPath id="hrClipBody"><use href="#hrBody"/></clipPath>
      <clipPath id="hrClipFront"><use href="#hrFront"/></clipPath>
      <clipPath id="hrClipHind"><use href="#hrHind"/></clipPath>
      <radialGradient id="hrCoat" gradientUnits="userSpaceOnUse" cx="270" cy="140" r="330"><stop offset="0" stop-color="${HorseArt.lighten(c.color)}"/><stop offset=".6" stop-color="${c.color}"/><stop offset="1" stop-color="${c.shade}"/></radialGradient>
      ${HorseArt.maneFill(c)}
      <radialGradient id="hrWet" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#0c3a66" stop-opacity=".3"/><stop offset="1" stop-color="#0c3a66" stop-opacity="0"/></radialGradient>
    </defs>`;
  }

  static muscles(c) {
    const line = HorseArt.darken(c.color, 0.62);
    return `<g fill="none" stroke="${line}" stroke-width="3" stroke-linecap="round" opacity=".55">
        <path d="M212 176C236 200 246 232 236 262"/>
        <path d="M226 268C230 286 230 300 226 314"/>
        <path d="M438 172C418 200 418 234 438 262"/>
        <path d="M456 264C470 284 474 302 468 320"/>
        <path d="M390 200C404 222 406 246 398 268"/>
        <path d="M118 108C134 98 156 104 164 120C168 136 158 150 140 152"/>
        <path d="M194 322c6 4 18 4 26 0M196 372c8 4 18 4 26 0M450 334c8 2 18 0 24-6M452 374c8 4 18 4 24 0"/>
      </g>
      <g fill="#fff" opacity=".13">
        <ellipse cx="226" cy="206" rx="22" ry="34" transform="rotate(-20 226 206)"/>
        <ellipse cx="456" cy="196" rx="26" ry="32"/>
        <ellipse cx="150" cy="118" rx="14" ry="10"/>
      </g>
      <path d="M200 166C230 150 290 162 340 160C390 158 432 140 470 152M136 72C160 92 196 128 236 160" fill="none" stroke="#fff" stroke-width="5" opacity=".22" stroke-linecap="round"/>`;
  }

  static maneFill(c) {
    const colors = c.rainbow || [c.mane, c.maneShade];
    const stops = colors.map((color, index) => `<stop offset="${(index / (colors.length - 1)).toFixed(2)}" stop-color="${color}"/>`).join("");
    return `<linearGradient id="hrManeFill" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>`;
  }

  static horn(c) {
    if (!c.unicorn) return "";
    return `<g class="hr-horn"><path d="M131 62L112 6L148 54Z" fill="#ffe28a" stroke="${HorseArt.OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M118 22l12 4M123 36l15 3M127 48l14 2" stroke="#e0a43a" stroke-width="3" stroke-linecap="round"/>
      <path d="M118 14l3 9" stroke="#fff" stroke-width="2.500" stroke-linecap="round" opacity=".8"/></g>`;
  }

  static lighten(hex) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (v) => Math.round(v + (255 - v) * 0.22);
    return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
  }

  static legs(c, far) {
    return HorseArt.LEGS.filter((leg) => leg.far === far)
      .map((leg) => {
        const id = leg.path === "FRONT" ? "hrFront" : "hrHind";
        return `<g transform="translate(${leg.dx} -4)">
          <use href="#${id}" fill="none" stroke="${HorseArt.OUTLINE}" stroke-width="7"/>
          <use href="#${id}" fill="${c.shade}"/>
          ${HorseArt.sock(c, leg)}
        </g>${HorseArt.hooves(c, true, leg)}`;
      })
      .join("");
  }

  static socks(c) {
    return HorseArt.LEGS.filter((leg) => !leg.far)
      .map((leg) => HorseArt.sock(c, leg))
      .join("");
  }

  static sock(c, leg) {
    const height = c.socks[HorseArt.LEGS.indexOf(leg)];
    if (!height) return "";
    const x = leg.hoofX - leg.dx;
    const clip = leg.path === "FRONT" ? "hrClipFront" : "hrClipHind";
    const color = c.sockColor || HorseArt.SOCK;
    const fill = leg.far ? HorseArt.darken(color, 0.88) : color;
    return `<path clip-path="url(#${clip})" d="M${x - 40} ${HorseArt.GROUND}V${HorseArt.GROUND - height + 6}q20-10 40-2q20 8 40-2V${HorseArt.GROUND}Z" fill="${fill}"/>`;
  }

  static hooves(c, far, only) {
    const list = only ? [only] : HorseArt.LEGS.filter((leg) => leg.far === far);
    return list
      .map((leg) => {
        const index = HorseArt.LEGS.indexOf(leg);
        const x = leg.hoofX;
        const top = HorseArt.GROUND - (leg.far ? 4 : 0);
        const feathers = c.feathers
          ? `<path d="M${x - 20} ${top + 2}c-6-14 2-26 6-34c2 10 6 12 8 4c2 10 6 10 8 2c2 10 6 10 8 2c2 10 6 12 8 2c4 8 12 20 6 34z" fill="${c.featherColor}" stroke="${HorseArt.OUTLINE}" stroke-width="2.500" stroke-linejoin="round" opacity="${leg.far ? 0.8 : 1}"/>`
          : "";
        return `<g class="hr-hoof${leg.far ? " far" : ""}" data-hoof="${index}">
          <path d="M${x - 16} ${top}H${x + 16}L${x + 21} ${top + HorseArt.HOOF_H}H${x - 21}Z" fill="${leg.far ? HorseArt.darken(c.hoof) : c.hoof}" stroke="${HorseArt.OUTLINE}" stroke-width="4" stroke-linejoin="round"/>
          <path class="hr-hoof-mud" d="M${x - 20} ${top + 8}q10-6 20 0q10-7 20 0l2 12h-44z" fill="#6b4a26"/>
          <path d="M${x - 16} ${top + 3}H${x + 16}" stroke="${HorseArt.OUTLINE}" stroke-width="2" opacity=".5"/>
          <path class="hr-hoof-shine" d="M${x - 10} ${top + 5}l-2 10" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/>
          ${feathers}
          <g class="hr-hoof-alert"><circle cx="${x}" cy="${HorseArt.GROUND + 30}" r="10" fill="#e5484d" stroke="#fff" stroke-width="2.500"/><path d="M${x} ${HorseArt.GROUND + 24}v7M${x} ${HorseArt.GROUND + 35}v.5" stroke="#fff" stroke-width="3" stroke-linecap="round"/></g>
          <rect class="hr-hoof-hit" x="${x - 30}" y="${top - 22}" width="60" height="${HorseArt.HOOF_H + 46}" fill="transparent"/>
        </g>`;
      })
      .join("");
  }

  static darken(hex, factor = 0.78) {
    const n = parseInt(hex.slice(1), 16);
    const mix = (v) => Math.round(v * factor);
    return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
  }

  static face(c) {
    if (c.face === "blaze") return `<path d="M128 60C134 60 136 70 130 84C122 104 98 128 76 150C70 154 62 150 66 144C86 120 108 92 118 70C121 63 124 60 128 60Z" fill="#f6f2ea"/>`;
    if (c.face === "star") return `<path d="M128 64l5 8l9 1l-7 6l2 9l-9-5l-8 4l2-9l-6-6l9-1z" fill="#f6f2ea"/>`;
    if (c.face === "snip") return `<ellipse cx="66" cy="140" rx="10" ry="6" transform="rotate(-30 66 140)" fill="#f6f2ea"/>`;
    return "";
  }

  static pattern(c) {
    if (c.pattern === "roan") {
      const next = SpotArt.random(0.4242);
      let dots = "";
      for (let i = 0; i < HorseArt.ROAN_FLECKS; i++) {
        const x = 40 + next() * 470;
        const y = 40 + next() * 300;
        dots += `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.2 + next() * 1.8).toFixed(1)}" fill="#fbeee8" opacity=".75"/>`;
      }
      return dots;
    }
    if (c.pattern === "dapple") {
      const rings = [
        [270, 196], [312, 220], [356, 194], [398, 222], [440, 190], [300, 252], [380, 256], [460, 236], [230, 208], [210, 150], [342, 236], [420, 168],
      ];
      return rings.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="${HorseArt.lighten(c.color)}" stroke-width="7" opacity=".8"/>`).join("");
    }
    if (c.pattern === "spots") {
      const spots = [
        [300, 200, 7], [330, 230, 9], [360, 190, 6], [390, 214, 10], [420, 180, 8], [450, 210, 9], [470, 180, 6], [440, 250, 7], [400, 256, 6], [350, 260, 8], [270, 230, 6], [230, 200, 5], [200, 150, 5], [180, 120, 4],
      ];
      return spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${HorseArt.darken(c.color, 0.4)}"/>`).join("");
    }
    if (c.pattern === "pinto") {
      return `<path d="M290 156C330 150 360 168 372 196C382 224 360 250 330 250C300 250 280 232 274 206C270 186 276 164 290 156Z" fill="${c.patch}"/>
        <path d="M420 146C452 140 486 150 498 180C504 206 490 228 466 228C442 226 424 210 418 190C414 172 412 154 420 146Z" fill="${c.patch}"/>
        <path d="M150 50C180 70 220 110 240 150C230 176 206 178 190 160C170 136 150 110 136 84Z" fill="${c.patch}"/>`;
    }
    if (c.pattern === "dorsal") {
      return `<path d="M232 158C290 166 360 164 420 150C450 144 470 146 486 156" fill="none" stroke="#3a2c20" stroke-width="5" stroke-linecap="round" opacity=".75"/>
        <path d="M196 330h30M198 342h28M440 330h34M442 342h32" stroke="#3a2c20" stroke-width="3" opacity=".45"/>`;
    }
    return "";
  }
}
