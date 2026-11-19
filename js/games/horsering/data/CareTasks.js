class CareTasks {
  static KINDS = {
    mud: {
      label: "Boue",
      zones: ["body", "belly", "rump", "neck", "head", "front", "hind"],
      count: [5, 12],
      r: [10, 44],
      art: ["mud", "dust", "dull"],
      steps: [
        { tool: "curry", motion: "circle", need: 260 },
        { tool: "dandy", motion: "right", need: 220 },
        { tool: "body", motion: "right", need: 220 },
      ],
    },
    bath: {
      label: "Bain",
      zones: ["body", "rump", "neck", "belly"],
      count: [7, 11],
      r: [30, 50],
      art: ["grime", "wet", "foam", "lather", "rinse", "damp"],
      steps: [
        { tool: "hose", motion: "hold", need: 0.4 },
        { tool: "shampoo", motion: "circle", need: 200 },
        { tool: "sponge", motion: "rub", need: 220 },
        { tool: "hose", motion: "hold", need: 0.4 },
        { tool: "scraper", motion: "right", need: 200 },
        { tool: "towel", motion: "rub", need: 200 },
      ],
    },
    mane: {
      label: "Crinière",
      line: [[162, 80], [238, 160]],
      count: [2, 5],
      r: [14, 20],
      art: ["knot", "knotWet"],
      steps: [
        { tool: "detangler", motion: "hold", need: 0.35 },
        { tool: "maneBrush", motion: "down", need: 180 },
      ],
    },
    tail: {
      label: "Queue",
      line: [[502, 190], [524, 310]],
      count: [2, 4],
      r: [18, 24],
      art: ["burr", "knot", "knotWet"],
      steps: [
        { tool: "hand", motion: "tap", need: 1 },
        { tool: "detangler", motion: "hold", need: 0.35 },
        { tool: "maneBrush", motion: "down", need: 200 },
      ],
    },
    flies: {
      label: "Mouches",
      zones: ["body", "rump", "neck"],
      count: [3, 6],
      r: [28, 32],
      art: ["fly"],
      steps: [{ tool: "flySpray", motion: "hold", need: 0.45 }],
    },
    wound: {
      label: "Égratignure",
      zones: ["front", "hind", "body", "neck"],
      count: [1, 2],
      r: [16, 24],
      art: ["wound", "woundClean"],
      steps: [
        { tool: "disinfect", motion: "hold", need: 0.6 },
        { tool: "ointment", motion: "rub", need: 160 },
      ],
    },
    face: {
      label: "Yeux et naseaux",
      spots: [[104, 100], [62, 146]],
      count: [1, 2],
      r: [18, 22],
      art: ["crust"],
      steps: [{ tool: "sponge", motion: "rub", need: 150 }],
    },
    thin: {
      label: "Faim et soif",
      spots: [[64, 160]],
      count: [1, 1],
      r: [34, 34],
      art: [null, null],
      steps: [
        { tool: "bucket", motion: "feed", need: 1 },
        { tool: ["hay", "pellets", "carrot", "apple"], motion: "feed", need: 100 },
      ],
    },
    sad: {
      label: "Câlins",
      zones: ["neck"],
      count: [2, 3],
      r: [30, 34],
      art: [null, null],
      steps: [
        { tool: "hand", motion: "rub", need: 240 },
        { tool: "mitt", motion: "circle", need: 200 },
      ],
    },
    hooves: {
      label: "Sabots",
      hooves: [1, 4],
      zones: ["sole"],
      count: [3, 6],
      r: [18, 36],
      art: ["packed", "dust", "dull"],
      done: "oiled",
      steps: [
        { tool: "hoofpick", motion: "up", need: 170 },
        { tool: "hoofBrush", motion: "rub", need: 150 },
        { tool: "hoofOil", motion: "rub", need: 130 },
      ],
    },
    stone: {
      label: "Caillou",
      hooves: [1, 1],
      spots: [[120, 214], [180, 214], [150, 100]],
      count: [1, 1],
      r: [16, 22],
      art: ["stone"],
      steps: [{ tool: "hoofpick", motion: "tap", need: 3 }],
    },
    shoe: {
      label: "Fer",
      hooves: [1, 1],
      spots: HoofArt.NAILS,
      count: [2, 4],
      r: [14, 14],
      art: ["nail"],
      steps: [{ tool: "hammer", motion: "tap", need: 2 }],
    },
    shine: {
      label: "Lustrant",
      final: true,
      spots: [[240, 200], [330, 190], [420, 190], [300, 250], [190, 140]],
      count: [5, 5],
      r: [46, 46],
      art: [null],
      steps: [{ tool: "shine", motion: "hold", need: 0.3 }],
    },
    ribbon: {
      label: "Ruban",
      final: true,
      line: [[176, 96], [228, 150]],
      count: [1, 1],
      r: [22, 22],
      art: [null],
      done: "bow",
      steps: [{ tool: "ribbon", motion: "tap", need: 1 }],
    },
  };

  static POOL = ["mud", "bath", "mane", "tail", "flies", "wound", "face", "thin", "sad", "hooves", "stone", "shoe"];
  static FINAL = ["shine", "ribbon"];
  static FIRST_COUNT = 3;
  static MAX_COUNT = 6;
  static MORE_EVERY = 2;
  static BASE_R = 26;

  static count(horsesDone) {
    return Math.min(CareTasks.MAX_COUNT, CareTasks.FIRST_COUNT + Math.floor(horsesDone / CareTasks.MORE_EVERY));
  }

  static build(horsesDone) {
    const kinds = CareTasks.sample(CareTasks.POOL, CareTasks.count(horsesDone));
    const ordered = CareTasks.POOL.filter((kind) => kinds.includes(kind));
    return [...ordered, ...CareTasks.FINAL].map((kind) => CareTasks.task(kind));
  }

  static task(kind) {
    const spec = CareTasks.KINDS[kind];
    const surfaces = spec.hooves ? CareTasks.sample([0, 1, 2, 3], CareTasks.between(spec.hooves)).map((hoof) => "hoof" + hoof) : ["horse"];
    const points = [];
    for (const surface of surfaces) {
      for (const [x, y] of CareTasks.places(spec, surface)) {
        const r = spec.r[0] + Math.random() ** 1.6 * (spec.r[1] - spec.r[0]);
        points.push({ x: Math.round(x), y: Math.round(y), r: Math.round(r), surface, stage: 0, progress: 0, seed: Math.random() });
      }
    }
    return { kind, spec, points, done: false };
  }

  static places(spec, surface) {
    const count = CareTasks.between(spec.count);
    if (spec.spots) return CareTasks.sample(spec.spots, count);
    const result = [];
    for (let i = 0; i < count; i++) result.push(spec.line ? CareTasks.onLine(spec.line) : CareTasks.inZone(spec.zones, surface === "horse" ? HorseArt.ZONES : HoofArt.ZONES));
    return result;
  }

  static onLine([[x1, y1], [x2, y2]]) {
    const t = Math.random();
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
  }

  static inZone(names, zones) {
    const choices = names.map((name) => zones[name]);
    let roll = Math.random() * choices.reduce((sum, zone) => sum + zone.weight, 0);
    const zone = choices.find((candidate) => (roll -= candidate.weight) <= 0) || choices[0];
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.sqrt(Math.random());
    return [zone.x + Math.cos(angle) * distance * zone.rx, zone.y + Math.sin(angle) * distance * zone.ry];
  }

  static need(step, point) {
    return step.motion === "tap" || step.motion === "feed" ? step.need : step.need * Math.sqrt(point.r / CareTasks.BASE_R);
  }

  static between([low, high]) {
    return low + Math.floor(Math.random() * (high - low + 1));
  }

  static sample(list, count) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, count);
  }
}
