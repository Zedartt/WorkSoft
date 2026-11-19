class HorseTools {
  static TABS = [
    { id: "groom", name: "Pansage" },
    { id: "bath", name: "Bain" },
    { id: "hoof", name: "Sabots" },
    { id: "care", name: "Soins" },
    { id: "love", name: "Câlins" },
    { id: "food", name: "Repas" },
  ];

  static LIST = [
    {
      id: "curry", tab: "groom", name: "Étrille", reach: 34, fx: "crumbs", sound: "horseCurry",
      icon: '<path d="M18 22q14-14 28 0" fill="none" stroke="#2b2b2b" stroke-width="5" stroke-linecap="round"/><ellipse cx="32" cy="40" rx="24" ry="16" fill="#c4262e" stroke="#2b1d14" stroke-width="2.5"/><ellipse cx="32" cy="38" rx="20" ry="12" fill="#e5484d"/><ellipse cx="32" cy="40" rx="16" ry="9" fill="none" stroke="#8c1c22" stroke-width="2.5" stroke-dasharray="2.5 2.5"/><ellipse cx="32" cy="40" rx="9" ry="5" fill="none" stroke="#8c1c22" stroke-width="2.5" stroke-dasharray="2.5 2.5"/><path d="M14 34q6-6 14-7" stroke="#fff" stroke-width="2.5" fill="none" opacity=".5" stroke-linecap="round"/><path d="M10 46q22 10 44 0" stroke="#8c1c22" stroke-width="3" fill="none" stroke-dasharray="2 2.5"/>',
    },
    {
      id: "dandy", tab: "groom", name: "Brosse dure", reach: 36, fx: "dust", sound: "horseBrush",
      icon: '<path d="M8 40v14M12 40v16M16 40v15M20 40v16M24 40v15M28 40v16M32 40v15M36 40v16M40 40v15M44 40v16M48 40v15M52 40v16M56 40v14" stroke="#d9b36a" stroke-width="2.6" stroke-linecap="round"/><path d="M10 40v12M18 40v13M26 40v13M34 40v13M42 40v13M50 40v12" stroke="#a8823a" stroke-width="1.4"/><rect x="5" y="24" width="54" height="18" rx="8" fill="#a8693a" stroke="#2b1d14" stroke-width="2.5"/><path d="M10 30q12-3 24 0t22 0M12 36q14-2 26 1" stroke="#7a4520" stroke-width="1.5" fill="none" opacity=".7"/><path d="M12 28q18-4 38 0" stroke="#fff" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/><path d="M14 24q18-10 36 0" fill="none" stroke="#5a3a1a" stroke-width="4"/>',
    },
    {
      id: "body", tab: "groom", name: "Brosse douce", reach: 38, fx: "shine", sound: "horseSoft",
      icon: '<path d="M8 40q24 22 48 0v6q-24 18-48 0z" fill="#1e1e1e"/><path d="M12 44q20 14 40 0" stroke="#555" stroke-width="1.5" fill="none"/><ellipse cx="32" cy="34" rx="25" ry="12" fill="#2a4e86" stroke="#2b1d14" stroke-width="2.5"/><ellipse cx="32" cy="32" rx="21" ry="8" fill="#3f6fb5"/><path d="M14 33q18-8 36 0" stroke="#f4f1ea" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M18 28q10-4 18-3" stroke="#fff" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/>',
    },
    {
      id: "maneBrush", tab: "groom", name: "Brosse à crins", reach: 30, fx: "hair", sound: "horseComb",
      icon: '<rect x="26" y="4" width="12" height="26" rx="6" fill="#7a4cc0" stroke="#2b1d14" stroke-width="2.5"/><path d="M30 8v18" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/><rect x="8" y="28" width="48" height="14" rx="6" fill="#9a6be0" stroke="#2b1d14" stroke-width="2.5"/><path d="M14 42v12M21 42v13M28 42v12M35 42v13M42 42v12M49 42v13" stroke="#6b737d" stroke-width="2"/><g fill="#2b2b2b"><circle cx="14" cy="55" r="2"/><circle cx="21" cy="56" r="2"/><circle cx="28" cy="55" r="2"/><circle cx="35" cy="56" r="2"/><circle cx="42" cy="55" r="2"/><circle cx="49" cy="56" r="2"/></g>',
    },
    {
      id: "detangler", tab: "groom", name: "Démêlant", reach: 52, fx: "mist", sound: "horseSpray",
      icon: '<path d="M20 26h22l2 30q0 4-4 4H22q-4 0-4-4z" fill="#f0a53a" stroke="#2b1d14" stroke-width="2.5"/><path d="M22 30h4v24h-3z" fill="#fff" opacity=".35"/><rect x="22" y="36" width="18" height="12" rx="2" fill="#fff6e6"/><path d="M26 42h10" stroke="#f0a53a" stroke-width="2.5"/><path d="M24 26v-8h14v8z" fill="#e8e8e8" stroke="#2b1d14" stroke-width="2.5"/><path d="M26 18l-2-8h22v6h-8z" fill="#d0d4da" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M38 18v10l-4 2" fill="none" stroke="#2b1d14" stroke-width="2.5" stroke-linecap="round"/><path d="M50 10l6-3M50 13h7M50 16l6 3" stroke="#9fd3f2" stroke-width="2" stroke-linecap="round"/>',
    },
    {
      id: "shine", tab: "groom", name: "Lustrant", reach: 60, fx: "sparkle", sound: "horseSpray",
      icon: '<path d="M20 26h22l2 30q0 4-4 4H22q-4 0-4-4z" fill="#d36bd0" stroke="#2b1d14" stroke-width="2.5"/><path d="M22 30h4v24h-3z" fill="#fff" opacity=".35"/><path d="M31 36l2.5 5l5.5 1l-5.5 1.5L31 49l-2.5-5.5L23 42l5.5-1z" fill="#fff6b0"/><path d="M24 26v-8h14v8z" fill="#e8e8e8" stroke="#2b1d14" stroke-width="2.5"/><path d="M26 18l-2-8h22v6h-8z" fill="#d0d4da" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M38 18v10l-4 2" fill="none" stroke="#2b1d14" stroke-width="2.5" stroke-linecap="round"/><path d="M53 6l1.5 3l3 1l-3 1l-1.5 3l-1.5-3l-3-1l3-1z" fill="#ffd23f"/>',
    },
    {
      id: "hose", tab: "bath", name: "Jet d'eau", reach: 64, fx: "water", sound: "horseHose",
      icon: '<path d="M4 58q4-20 18-24t16-14" fill="none" stroke="#2b1d14" stroke-width="10" stroke-linecap="round"/><path d="M4 58q4-20 18-24t16-14" fill="none" stroke="#3fae6a" stroke-width="6" stroke-linecap="round"/><path d="M6 52q4-14 14-18" fill="none" stroke="#9fe0b8" stroke-width="2" stroke-linecap="round"/><path d="M30 26l8-10l10 8l-8 10z" fill="#e5484d" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M42 20l8-8l6 5l-7 9z" fill="#b9c2cc" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M36 32q-2 6 2 10" fill="none" stroke="#2b1d14" stroke-width="2.5" stroke-linecap="round"/><path d="M56 12l6-6M57 16h6M56 20l6 4" stroke="#6cc2f5" stroke-width="2.5" stroke-linecap="round"/>',
    },
    {
      id: "shampoo", tab: "bath", name: "Shampoing", reach: 40, fx: "bubbles", sound: "horseLather",
      icon: '<path d="M18 22q0-6 6-6h16q6 0 6 6v32q0 6-6 6H24q-6 0-6-6z" fill="#4cb0f0" stroke="#2b1d14" stroke-width="2.5"/><path d="M22 24v28" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/><rect x="24" y="30" width="18" height="18" rx="3" fill="#fff"/><circle cx="30" cy="38" r="3.5" fill="#bfe6ff" stroke="#4cb0f0"/><circle cx="36" cy="43" r="2.5" fill="#bfe6ff" stroke="#4cb0f0"/><rect x="26" y="6" width="12" height="11" rx="2" fill="#2a6fb0" stroke="#2b1d14" stroke-width="2.5"/><circle cx="48" cy="12" r="3" fill="#fff" stroke="#9fd3f2"/><circle cx="54" cy="6" r="2" fill="#fff" stroke="#9fd3f2"/>',
    },
    {
      id: "sponge", tab: "bath", name: "Éponge", reach: 40, fx: "bubbles", sound: "horseLather",
      icon: '<path d="M8 26q0-6 6-6h36q6 0 6 6v22q0 6-6 6H14q-6 0-6-6z" fill="#f6d55c" stroke="#2b1d14" stroke-width="2.5"/><path d="M8 46h48v2q0 6-6 6H14q-6 0-6-6z" fill="#3fae6a"/><g fill="#c9a227"><circle cx="16" cy="28" r="2.5"/><circle cx="26" cy="26" r="1.8"/><circle cx="38" cy="29" r="2.6"/><circle cx="48" cy="26" r="1.8"/><circle cx="20" cy="37" r="1.8"/><circle cx="32" cy="36" r="2.6"/><circle cx="44" cy="38" r="2"/></g><path d="M14 23q10-2 20 0" stroke="#fff" stroke-width="2" opacity=".5" fill="none" stroke-linecap="round"/>',
    },
    {
      id: "scraper", tab: "bath", name: "Couteau de chaleur", reach: 40, fx: "water", sound: "horseScrape",
      icon: '<rect x="27" y="4" width="10" height="22" rx="4" fill="#c4262e" stroke="#2b1d14" stroke-width="2.5"/><path d="M30 8v14" stroke="#fff" stroke-width="2" opacity=".4" stroke-linecap="round"/><path d="M6 52q26-34 52 0" fill="none" stroke="#2b1d14" stroke-width="9" stroke-linecap="round"/><path d="M6 52q26-34 52 0" fill="none" stroke="#c5ccd5" stroke-width="5" stroke-linecap="round"/><path d="M12 46q20-22 40 0" fill="none" stroke="#fff" stroke-width="1.5" opacity=".7"/><path d="M32 26v8" stroke="#2b1d14" stroke-width="3"/><path d="M14 58v4M24 56v5M40 56v5M50 58v4" stroke="#6cc2f5" stroke-width="2" stroke-linecap="round"/>',
    },
    {
      id: "towel", tab: "bath", name: "Serviette", reach: 46, fx: "none", sound: "horseSoft",
      icon: '<path d="M8 16q24-6 48 0v34q-24 8-48 0z" fill="#f08a8a" stroke="#2b1d14" stroke-width="2.5"/><path d="M8 40q24 6 48 0M8 45q24 6 48 0" stroke="#fff" stroke-width="2.5" fill="none"/><path d="M8 16q24 8 48 0" fill="none" stroke="#c45a5a" stroke-width="2"/><path d="M14 22v14M22 22v14M30 23v14M38 23v14M46 22v14" stroke="#e57070" stroke-width="1.2" opacity=".6"/><path d="M10 50v4M18 52v4M26 53v4M34 53v4M42 52v4M50 51v4" stroke="#f08a8a" stroke-width="2" stroke-linecap="round"/>',
    },
    {
      id: "hoofpick", tab: "hoof", name: "Cure-pied", reach: 26, fx: "crumbs", sound: "horseScrape",
      icon: '<rect x="22" y="4" width="16" height="32" rx="7" fill="#c4262e" stroke="#2b1d14" stroke-width="2.5"/><path d="M26 8v24" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/><path d="M38 12h4M38 18h5M38 24h4M38 30h5" stroke="#2b1d14" stroke-width="2" stroke-linecap="round"/><path d="M30 36v12q0 8-8 8h-4" fill="none" stroke="#2b1d14" stroke-width="7" stroke-linecap="round"/><path d="M30 36v12q0 8-8 8h-4" fill="none" stroke="#c5ccd5" stroke-width="3.5" stroke-linecap="round"/>',
    },
    {
      id: "hoofBrush", tab: "hoof", name: "Brosse à sabot", reach: 30, fx: "dust", sound: "horseBrush",
      icon: '<rect x="26" y="4" width="12" height="22" rx="5" fill="#2f8a52" stroke="#2b1d14" stroke-width="2.5"/><path d="M29 8v14" stroke="#fff" stroke-width="2" opacity=".4" stroke-linecap="round"/><rect x="12" y="24" width="40" height="14" rx="5" fill="#3fae6a" stroke="#2b1d14" stroke-width="2.5"/><path d="M16 38v18M21 38v19M26 38v18M31 38v19M36 38v18M41 38v19M46 38v18" stroke="#1e1e1e" stroke-width="2.6" stroke-linecap="round"/>',
    },
    {
      id: "hammer", tab: "hoof", name: "Marteau", reach: 18, fx: "spark", sound: "horseHammer",
      icon: '<rect x="28" y="4" width="8" height="40" rx="3" fill="#a8693a" stroke="#2b1d14" stroke-width="2.5"/><path d="M31 8v32" stroke="#d9a06a" stroke-width="2" stroke-linecap="round"/><path d="M10 44h44v10q0 4-4 4H14q-4 0-4-4z" fill="#6b737d" stroke="#2b1d14" stroke-width="2.5"/><path d="M14 48h36" stroke="#c5ccd5" stroke-width="2.5" stroke-linecap="round"/><path d="M10 54h8M46 54h8" stroke="#3d4650" stroke-width="2"/>',
    },
    {
      id: "hoofOil", tab: "hoof", name: "Graisse à sabot", reach: 34, fx: "shine", sound: "horseSoft",
      icon: '<path d="M38 4l-8 30" stroke="#2b1d14" stroke-width="7" stroke-linecap="round"/><path d="M38 4l-8 30" stroke="#a8693a" stroke-width="3.5" stroke-linecap="round"/><path d="M10 34h44v20q0 6-6 6H16q-6 0-6-6z" fill="#2b2b2b" stroke="#2b1d14" stroke-width="2.5"/><ellipse cx="32" cy="34" rx="22" ry="5" fill="#f0a53a" stroke="#2b1d14" stroke-width="2.5"/><ellipse cx="30" cy="35" rx="6" ry="2" fill="#ffd27a"/><rect x="14" y="42" width="36" height="10" rx="2" fill="#f0a53a"/><path d="M18 47h28" stroke="#2b1d14" stroke-width="1.5"/>',
    },
    {
      id: "flySpray", tab: "care", name: "Anti-mouches", reach: 60, fx: "mist", sound: "horseSpray",
      icon: '<path d="M20 26h22l2 30q0 4-4 4H22q-4 0-4-4z" fill="#3fae6a" stroke="#2b1d14" stroke-width="2.5"/><path d="M22 30h4v24h-3z" fill="#fff" opacity=".35"/><circle cx="31" cy="43" r="7" fill="#fff"/><ellipse cx="31" cy="44" rx="2.5" ry="3.5" fill="#2b2b2b"/><path d="M28 41l-3-2M34 41l3-2" stroke="#2b2b2b" stroke-width="1.5"/><path d="M25 37l12 12" stroke="#e5484d" stroke-width="2.5"/><path d="M24 26v-8h14v8z" fill="#e8e8e8" stroke="#2b1d14" stroke-width="2.5"/><path d="M26 18l-2-8h22v6h-8z" fill="#d0d4da" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M38 18v10l-4 2" fill="none" stroke="#2b1d14" stroke-width="2.5" stroke-linecap="round"/>',
    },
    {
      id: "disinfect", tab: "care", name: "Désinfectant", reach: 40, fx: "mist", sound: "horseSpray",
      icon: '<path d="M18 24h28v32q0 4-4 4H22q-4 0-4-4z" fill="#f4f6f9" stroke="#2b1d14" stroke-width="2.5"/><path d="M22 28v26" stroke="#c9d1db" stroke-width="3" stroke-linecap="round"/><path d="M28 36h8v-6h4v6h8" fill="none"/><path d="M32 32v18M23 41h18" stroke="#e5484d" stroke-width="6"/><path d="M24 24v-8h16v8z" fill="#e5484d" stroke="#2b1d14" stroke-width="2.5"/><path d="M28 16v-8h8v8" fill="#f4f6f9" stroke="#2b1d14" stroke-width="2.5"/>',
    },
    {
      id: "ointment", tab: "care", name: "Pommade", reach: 34, fx: "shine", sound: "horseSoft",
      icon: '<path d="M14 6h36l-6 40H20z" fill="#f4f6f9" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 6h36" stroke="#9aa3ad" stroke-width="5"/><path d="M19 16h26l-2 14H21z" fill="#3fae6a"/><path d="M28 23h8M32 19v8" stroke="#fff" stroke-width="2.5"/><rect x="24" y="46" width="16" height="10" rx="2" fill="#2f9be0" stroke="#2b1d14" stroke-width="2.5"/><path d="M28 56q4 6 8 0" fill="#fff" stroke="#c9d1db" stroke-width="1.5"/>',
    },
    {
      id: "ribbon", tab: "care", name: "Ruban", reach: 30, fx: "sparkle", sound: "ding",
      icon: '<path d="M32 30L8 16q-4 14 0 28z" fill="#e5484d" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M32 30l24-14q4 14 0 28z" fill="#e5484d" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 22q8 4 14 7M52 22q-8 4-14 7" stroke="#ff8a90" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M28 34l-8 24l6-3l3 5l5-24M36 34l6 24l-6-3l-3 5l-3-24" fill="#c4262e" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="32" cy="30" rx="7" ry="8" fill="#c4262e" stroke="#2b1d14" stroke-width="2.5"/>',
    },
    {
      id: "hand", tab: "love", name: "Caresse", reach: 36, fx: "hearts", sound: "horsePet",
      icon: '<path d="M18 58V30q0-4 4-4t4 4v8V14q0-4 4-4t4 4v22V12q0-4 4-4t4 4v24V18q0-4 4-4t4 4v26q0 14-14 14h-6q-8 0-14-8l-8-11q-2-4 2-6t6 2z" fill="#f6ceac" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M30 14v12M38 12v12M46 18v10" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/><path d="M26 38v4M34 36v4M42 36v4" stroke="#c48a64" stroke-width="1.6" stroke-linecap="round"/><path d="M48 6l2 3.5l4 .5l-3 2.5l1 4l-4-2l-4 2l1-4l-3-2.5l4-.5z" fill="#ff5a7a"/>',
    },
    {
      id: "mitt", tab: "love", name: "Gant de massage", reach: 40, fx: "hearts", sound: "horseCurry",
      icon: '<path d="M14 58V22q0-12 12-12h8q12 0 12 12v8l6-4q6 0 4 6l-10 12v14z" fill="#9a6be0" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 50h32" stroke="#5a3a9a" stroke-width="3"/><g fill="#d9c6f5" stroke="#5a3a9a" stroke-width="1"><circle cx="22" cy="20" r="3"/><circle cx="32" cy="18" r="3"/><circle cx="40" cy="24" r="3"/><circle cx="24" cy="30" r="3"/><circle cx="34" cy="29" r="3"/><circle cx="22" cy="40" r="3"/><circle cx="32" cy="40" r="3"/><circle cx="42" cy="38" r="3"/></g>',
    },
    {
      id: "sugar", tab: "love", name: "Sucre", reach: 30, fx: "hearts", sound: "horseCrunch", feed: 0, chew: 0.8,
      icon: '<path d="M8 34l14-8l14 8v16l-14 8l-14-8z" fill="#fff" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M8 34l14 8l14-8M22 42v16" fill="none" stroke="#c9ccd2" stroke-width="2"/><path d="M28 20l14-8l14 8v16l-14 8l-14-8z" fill="#fff" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M28 20l14 8l14-8M42 28v16" fill="none" stroke="#c9ccd2" stroke-width="2"/><g fill="#d5dbe4"><circle cx="16" cy="46" r="1"/><circle cx="30" cy="48" r="1"/><circle cx="36" cy="32" r="1"/><circle cx="50" cy="34" r="1"/><circle cx="42" cy="18" r="1"/></g>',
    },
    {
      id: "bucket", tab: "food", name: "Seau d'eau", reach: 34, fx: "water", sound: "horseDrink", feed: 1, chew: 1.8,
      icon: '<path d="M8 24q24-26 48 0" fill="none" stroke="#2b1d14" stroke-width="3"/><path d="M10 24h44l-6 34H16z" fill="#9aa3ad" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 30h36M15 40h34M16 50h32" stroke="#7d8894" stroke-width="2"/><path d="M16 28l4 28" stroke="#fff" stroke-width="3" opacity=".4" stroke-linecap="round"/><ellipse cx="32" cy="25" rx="22" ry="5" fill="#4cb0f0" stroke="#2b1d14" stroke-width="2.5"/><path d="M22 25q6-2 12 0" stroke="#bfe6ff" stroke-width="2" fill="none" stroke-linecap="round"/>',
    },
    {
      id: "hay", tab: "food", name: "Foin", reach: 34, fx: "crumbs", sound: "horseMunch", feed: 30, chew: 1.6,
      icon: '<path d="M6 56q6-30 26-40q20 10 26 40z" fill="#e6c35c" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 54q6-20 18-32M22 56q4-18 10-30M32 56V20M42 56q-4-18-10-30M52 54q-6-20-18-32" stroke="#b8902a" stroke-width="1.8" fill="none"/><path d="M14 40q18 6 36 0" stroke="#c4262e" stroke-width="4" fill="none"/><path d="M26 12l6 6l6-8" stroke="#e6c35c" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    },
    {
      id: "pellets", tab: "food", name: "Granulés", reach: 34, fx: "crumbs", sound: "horseCrunch", feed: 20, chew: 1.2,
      icon: '<path d="M6 30h40l-4 26H10z" fill="#2f9be0" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M46 36h10q4 0 4 4v4q0 4-4 4h-12" fill="none" stroke="#2b1d14" stroke-width="5" stroke-linecap="round"/><path d="M10 34l2 18" stroke="#fff" stroke-width="2.5" opacity=".4" stroke-linecap="round"/><g fill="#a87446" stroke="#5e3a18" stroke-width="1"><rect x="10" y="24" width="5" height="8" rx="2.5" transform="rotate(-20 12 28)"/><rect x="18" y="20" width="5" height="8" rx="2.5" transform="rotate(15 20 24)"/><rect x="26" y="22" width="5" height="8" rx="2.5" transform="rotate(-35 28 26)"/><rect x="34" y="21" width="5" height="8" rx="2.5" transform="rotate(25 36 25)"/><rect x="22" y="15" width="5" height="8" rx="2.5" transform="rotate(60 24 19)"/></g>',
    },
    {
      id: "carrot", tab: "food", name: "Carotte", reach: 34, fx: "crumbs", sound: "horseCrunch", feed: 15, chew: 1,
      icon: '<path d="M8 58L40 20q10 0 10 10z" fill="#f0741f" stroke="#2b1d14" stroke-width="2.5" stroke-linejoin="round"/><path d="M16 50l5 2M24 40l5 2M32 31l4 2M20 46l-2-4M30 36l-2-4" stroke="#b9441a" stroke-width="1.8" stroke-linecap="round"/><path d="M34 26q2 4 8 2" stroke="#ffab6e" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M42 22q0-14 8-18M45 24q10-8 16-4M42 22q-6-10-2-18M46 26q12 0 14 8" fill="none" stroke="#2f8a52" stroke-width="3.5" stroke-linecap="round"/>',
    },
    {
      id: "apple", tab: "food", name: "Pomme", reach: 34, fx: "crumbs", sound: "horseCrunch", feed: 15, chew: 1,
      icon: '<path d="M32 22q-14-8-21 4q-6 14 4 26q8 10 17 4q9 6 17-4q10-12 4-26q-7-12-21-4z" fill="#d42a40" stroke="#2b1d14" stroke-width="2.5"/><path d="M36 24q10-4 14 6" stroke="#ff7a8a" stroke-width="2" fill="none" opacity=".7"/><ellipse cx="20" cy="32" rx="3.5" ry="7" fill="#fff" opacity=".45" transform="rotate(20 20 32)"/><path d="M32 22q0-8 4-14" stroke="#5e3a18" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M35 12q8-6 14 0q-6 6-14 0z" fill="#3fae6a" stroke="#2b1d14" stroke-width="2"/>',
    },
  ];

  static get(id) {
    return HorseTools.LIST.find((tool) => tool.id === id);
  }

  static icon(tool) {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${tool.icon}</svg>`;
  }
}
