class KitchenView {
  static DESIGN_H = 640;
  static MIN_SCALE = 0.55;
  static MAX_SCALE = 1.8;
  static PUDDLE = "M6 26c-2-10 8-17 19-16 12 0 20 7 18 16-1 9-10 13-20 12-9 0-16-4-17-12z";
  static SPECKS = [
    [14, 20],
    [24, 15],
    [33, 18],
    [38, 26],
    [28, 24],
    [18, 28],
    [11, 30],
    [24, 33],
    [33, 32],
    [20, 22],
  ];
  constructor(game) {
    this.game = game;
    this.cam = 0;
    this.camTarget = 0;
    this.viewW = 0;
    this.scale = 1;
    this.hintIn = 0;
    this.guideSig = null;
    this.who = "homme";
    try {
      if (localStorage.getItem("cooktou_chef") === "femme") this.who = "femme";
    } catch (e) {}
    this.area = $("ckArea");
  }

  query(sel) {
    return $("ckWorld").querySelector(sel);
  }

  build() {
    const item = (id) => `<div class="ck-item" data-ing="${id}">${Icons.draw(id)}<span>${Catalog.ingredients[id].n}</span></div>`;
    const st = (id, x, w, extra) =>
      `<div class="ck-st ck-${id}" data-drop="${id}" style="left:${x}px;width:${w}px"><div class="ck-surf"><div class="ck-cont" data-from="${id}"></div></div>${extra || ""}<i class="ck-prog"></i><span class="ck-lab">${Catalog.stations[id].n}</span></div>`;
    $("ckWorld").innerHTML = `
      <div class="ck-band"></div>
      <div class="ck-clock" style="left:985px"><i></i><b></b></div>
      <div class="ck-rail" style="left:925px"><span></span><span></span><span></span></div>
      <div class="ck-hood" style="left:1590px"></div>
      <div class="ck-chef" id="ckChef" style="left:${CooktouGame.CHEF_X - 105}px">${Avatar.chef(this.who)}</div>
      <div class="ck-pin" id="ckTicket" style="left:${CooktouGame.CHEF_X + 118}px"></div>
      <div class="ck-fridge" id="ckFridge" style="left:50px;width:320px">
        <div class="fr-body"><div class="fr-in"><div class="fr-top"><span>Frigo</span><button id="ckDoorClose">Fermer ✕</button></div>
          <div class="ck-shelf three">${Object.keys(Catalog.ingredients)
            .filter((k) => Catalog.ingredients[k].cold)
            .map(item)
            .join("")}</div></div></div>
        <button class="fr-door" id="ckDoor" aria-label="Ouvrir le frigo"><i class="fr-handle"></i><i class="fr-note"></i><i class="fr-note b"></i><span>FRIGO</span></button>
      </div>
      <div class="ck-pantry" style="left:400px;width:470px">
        <div class="ck-head">Garde-manger</div><div class="ck-shelf four">${Object.keys(Catalog.ingredients)
          .filter((k) => !Catalog.ingredients[k].cold)
          .map(item)
          .join("")}</div></div>
      ${st("planche", 920, 230, `<div class="ck-tool" data-tool="knife" title="Couteau">${Icons.tools.knife}</div>`)}
      ${st("bol", 1170, 210, `<div class="ck-tool" data-tool="spoon" title="Cuillère">${Icons.tools.spoon}</div>`)}
      ${st("assiette", 1400, 180)}
      ${st("plaque", 1600, 270, `<button class="ck-heat" data-heat="plaque"><i></i>Feu</button>`)}
      <div class="ck-oven" data-drop="four" style="left:1910px;width:290px">
        <div class="ov-top"><i class="ov-knob"></i><i class="ov-knob"></i><span class="ov-disp">180°</span><button class="ck-heat" data-heat="four">▶ Lancer</button></div>
        <div class="ck-surf ov-win"><div class="ck-cont" data-from="four"></div></div>
        <div class="ov-handle"></div><i class="ck-prog"></i>
        <div class="ov-drawer"><span class="ck-lab">Four</span></div>
      </div>
      <div class="ck-guide" id="ckGuide"></div>`;
    this.area.addEventListener("pointerdown", (...args) => this.game.pointer.down(...args));
    this.area.addEventListener("pointermove", (...args) => this.game.pointer.move(...args));
    this.area.addEventListener("pointerup", (...args) => this.game.pointer.up(...args));
    this.area.addEventListener("pointercancel", (...args) => this.game.pointer.up(...args));
    this.area.addEventListener("pointerleave", () => this.setFridge(false));
    this.area.addEventListener(
      "wheel",
      (e) => {
        this.camTarget += (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) / this.scale;
        this.clampCam();
      },
      {
        passive: true,
      },
    );
    this.area.addEventListener("click", (e) => {
      const c = e.target.closest("[data-client]");
      if (c) {
        this.game.takeOrder(+c.dataset.client, c);
        return;
      }
      const h = e.target.closest("[data-heat]");
      if (h) {
        this.game.doHeat(h.dataset.heat, h.closest("[data-drop]"));
        return;
      }
      if (e.target.closest("#ckDoorClose")) {
        this.setFridge(false);
        return;
      }
      if (e.target.closest("#ckDoor")) {
        this.setFridge(!$("ckFridge").classList.contains("open"));
        return;
      }
      if (e.target.closest("#ckLeft")) {
        this.camTarget -= this.viewW * 0.6;
        this.clampCam();
      }
      if (e.target.closest("#ckRight")) {
        this.camTarget += this.viewW * 0.6;
        this.clampCam();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (!this.game.raf) return;
      if (this.game.over && e.key === "Enter") {
        e.preventDefault();
        this.game.reset();
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "q" || e.key === "a") {
        this.camTarget -= 220;
        this.clampCam();
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        this.camTarget += 220;
        this.clampCam();
      }
    });
    new ResizeObserver(() => {
      if (!this.game.raf) return;
      this.fit();
      this.applyCam();
      this.guideSig = null;
    }).observe(this.area);
    $("ckRestart").addEventListener("click", (...args) => this.game.reset(...args));
    $("ckWho").addEventListener("click", () => {
      this.who = this.who === "femme" ? "homme" : "femme";
      $("ckChef").innerHTML = Avatar.chef(this.who);
      Sfx.play("click");
      try {
        localStorage.setItem("cooktou_chef", this.who);
      } catch (e) {}
    });
    $("ckAgain").addEventListener("click", (...args) => this.game.reset(...args));
    $("ckMenu").addEventListener("click", () => app.launcher.backToMenu());
    this.game.built = true;
  }

  hud() {
    $("ckScore").textContent = this.game.score;
    let h = "";
    for (let i = 0; i < CooktouGame.MAX_LOST; i++) h += `<i class="esc${i < this.game.lost ? " on" : ""}"></i>`;
    $("ckLost").innerHTML = h;
  }

  renderClients() {
    let h = "";
    for (let i = 0; i < CooktouGame.SLOTS; i++) {
      const c = this.game.clients[i];
      if (!c) {
        h += `<div class="ck-client empty">place libre</div>`;
        continue;
      }
      const mine = c === this.game.active;
      const label = mine
        ? this.game.ready
          ? "Glisse l'assiette ici !"
          : "Commande en cours…"
        : this.game.active
          ? "Attend son tour"
          : "Clique pour prendre la commande";
      h += `<button class="ck-client${mine ? " active" : ""}${mine && this.game.ready ? " serve" : ""}${!this.game.active ? " ask" : ""}" data-client="${i}">
        <span class="who">${Avatar.client(c)}</span>
        <span class="order"><b>${c.recipe.name}</b><span>${label}</span></span>
        ${Icons.draw(c.recipe.id, "dish")}
        <i class="pat" data-bar="${i}"></i></button>`;
    }
    $("ckClients").innerHTML = h;
    this.bars();
  }

  bars() {
    for (let i = 0; i < CooktouGame.SLOTS; i++) {
      const c = this.game.clients[i],
        el = $("ckClients").querySelector(`[data-bar="${i}"]`);
      if (!c || !el) continue;
      const k = Math.max(0, c.pat / c.max);
      el.style.width = k * 100 + "%";
      el.classList.toggle("low", k < 0.3);
    }
  }

  renderTicket() {
    const el = $("ckTicket");
    if (!this.game.active) {
      el.innerHTML = `<h3>Bon de commande</h3><p>${this.game.clients.some(Boolean) ? "Clique sur un client pour prendre sa commande." : "En attente du prochain client…"}</p>`;
      return;
    }
    const st = this.game.active.recipe.steps;
    el.innerHTML =
      `<h3>${this.game.active.recipe.name}</h3><ol>` +
      st
        .map(
          (s, i) =>
            `<li class="${i < this.game.idx ? "done" : i === this.game.idx ? "cur" : ""}"><i>${i < this.game.idx ? "✓" : i + 1}</i>${s.txt}</li>`,
        )
        .join("") +
      "</ol>";
    const c = el.querySelector(".cur");
    if (c) el.scrollTop = Math.max(0, c.offsetTop - 70);
  }

  renderGuide() {
    const el = $("ckNow");
    if (!this.game.active) {
      const some = this.game.clients.some(Boolean);
      el.innerHTML = `<span class="g-step">${some ? "Nouvelle commande" : "Pause"}</span><span class="g-txt">${some ? "Clique sur un client en haut pour prendre sa commande." : "En attente du prochain client…"}</span>`;
      return;
    }
    const st = this.game.active.recipe.steps,
      s = st[this.game.idx];
    const chip = (pic, label, sub) => `<span class="g-chip">${pic}<span><b>${label}</b>${sub ? `<em>${sub}</em>` : ""}</span></span>`;
    const stChip = (id) => chip(`<i class="g-st g-${id}"></i>`, Catalog.stations[id].n);
    let v = "",
      how = "";
    if (s.a === "put") {
      v =
        chip(Icons.draw(s.ing), Catalog.ingredients[s.ing].n, Catalog.ingredients[s.ing].cold ? "dans le frigo" : "dans le garde-manger") +
        `<span class="g-arr">➜</span>` +
        stChip(s.st);
      how = Catalog.ingredients[s.ing].pour
        ? "Attrape-le, tiens-le au-dessus du poste et laisse couler jusqu'au bout."
        : Catalog.ingredients[s.ing].shake
          ? `Attrape-le et secoue-le de haut en bas au-dessus du poste. <b id="ckCount"></b>`
          : "Attrape l'ingrédient et fais-le glisser jusqu'au poste.";
    } else if (s.a === "move") {
      v = stChip(s.from) + `<span class="g-arr">➜</span>` + stChip(s.to);
      how = "Attrape ce qu'il y a dedans et fais-le glisser.";
    } else if (s.a === "cut") {
      v = chip(Icons.tools.knife, "Couteau") + `<span class="g-arr">↕</span>` + stChip("planche");
      how = `Garde le couteau en main et secoue de haut en bas sur la planche. <b id="ckCount"></b>`;
    } else if (s.a === "stir") {
      v = chip(Icons.tools.spoon, "Cuillère") + `<span class="g-arr">⇄</span>` + stChip("bol");
      how = `Garde la cuillère en main et remue vite dans le saladier, dans n'importe quel sens. <b id="ckCount"></b>`;
    } else if (s.a === "heat") {
      v = chip(`<i class="g-btn">${s.st === "four" ? "▶ Lancer" : "Feu"}</i>`, s.st === "four" ? "Bouton du four" : "Bouton de la plaque");
      how = this.game.busy > 0 ? "Ça cuit… patiente quelques secondes." : "Clique sur le bouton, puis attends la fin de la cuisson.";
    } else {
      v =
        stChip("assiette") +
        `<span class="g-arr">➜</span>` +
        chip(Icons.draw(this.game.active.recipe.id), "Le client", "en haut de l'écran");
      how = "Attrape l'assiette et fais-la glisser sur le client.";
    }
    el.innerHTML = `<span class="g-step">Étape ${this.game.idx + 1} / ${st.length}</span><span class="g-vis">${v}</span><span class="g-txt"><b>${s.txt}</b><span>${how}</span></span>`;
    this.progress();
  }

  pile(list, id) {
    const sx = id === "planche" ? 1.5 : 1,
      sy = id === "planche" ? 0.75 : 1,
      big = list.length > 5 ? 30 : 38;
    return list
      .map((raw, i) => {
        const x = raw.replace("~", ""),
          cut = raw !== x,
          g = Catalog.ingredients[x];
        const a = i * 2.4 + 0.6,
          r = Math.min(36, 14 * Math.sqrt(i)),
          px_ = Math.cos(a) * r * sx,
          py_ = Math.sin(a) * r * sy,
          rot = ((i * 47) % 50) - 25;
        const one = (dx, dy, dr, size, inner) =>
          `<svg class="ic" viewBox="0 0 48 48" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" style="left:calc(50% + ${(px_ + dx).toFixed(1)}px);top:calc(50% + ${(py_ + dy).toFixed(1)}px);width:${size}px;height:${size}px;margin:${-size / 2}px 0 0 ${-size / 2}px;transform:rotate(${rot + dr}deg)">${inner || Icons.shapes[x]}</svg>`;
        if (Catalog.isMix(raw)) return one(0, 0, 0, 62, this.mixture(raw)).replace('class="ic"', 'class="ic liq"');
        if (g.pour)
          return one(
            0,
            0,
            0,
            54,
            `<path d="${KitchenView.PUDDLE}" fill="${g.pour}" stroke="rgba(0,0,0,.14)" opacity=".9"/><path d="M13 22q6-7 16-6" stroke="#fff" opacity=".6" fill="none"/>`,
          ).replace('class="ic"', 'class="ic liq"');
        if (g.shake)
          return one(
            0,
            0,
            0,
            50,
            `<g stroke="none">${[
              [10, 14],
              [22, 8],
              [35, 13],
              [41, 26],
              [30, 22],
              [17, 25],
              [8, 33],
              [24, 36],
              [36, 38],
              [15, 41],
            ]
              .map(
                ([cx, cy], k) =>
                  `<circle cx="${cx}" cy="${cy}" r="1.7" fill="${x === "sel" && k % 2 ? "#3b3b3b" : g.shake}" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>`,
              )
              .join("")}</g>`,
          );
        return cut ? one(-11, 3, -20, 22) + one(9, -6, 25, 22) + one(2, 9, 70, 22) : one(0, 0, 0, big);
      })
      .join("");
  }

  blend(ids) {
    let r = 0,
      g = 0,
      b = 0,
      total = 0;
    for (const id of ids) {
      const weight = Catalog.ingredients[id].shake ? 0.25 : 1,
        hex = parseInt(Catalog.tint(id).slice(1), 16);
      r += (hex >> 16) * weight;
      g += ((hex >> 8) & 255) * weight;
      b += (hex & 255) * weight;
      total += weight;
    }
    return `rgb(${Math.round(r / total)},${Math.round(g / total)},${Math.round(b / total)})`;
  }

  mixture(raw) {
    const parts = Catalog.parts(raw);
    const specks = KitchenView.SPECKS.map(
      ([cx, cy], k) => `<circle cx="${cx}" cy="${cy}" r="1.9" fill="${Catalog.tint(parts[k % parts.length])}" stroke="rgba(0,0,0,.2)" stroke-width=".5"/>`,
    ).join("");
    return `<path d="${KitchenView.PUDDLE}" fill="${this.blend(parts)}" stroke="rgba(0,0,0,.18)"/><path d="M13 22q6-7 16-6" stroke="#fff" opacity=".5" fill="none"/>${specks}`;
  }

  entryIcon(raw) {
    return Catalog.isMix(raw)
      ? `<svg class="ic" viewBox="0 0 48 48" stroke-width="2" stroke-linecap="round">${this.mixture(raw)}</svg>`
      : Icons.draw(raw.replace("~", ""));
  }

  renderStations() {
    for (const id in Catalog.stations) {
      const el = this.query(`[data-from="${id}"]`),
        f = this.game.flags[id] || "";
      el.innerHTML = f === "dish" ? Icons.draw(this.game.active.recipe.id, "ck-dish") : this.pile(this.game.cont[id].slice(-9), id);
      el.className = "ck-cont" + (f === "cooked" ? " cooked" : "") + (this.game.cont[id].length ? " has" : "");
      el.style.transform = id === "bol" ? `rotate(${this.game.stirAcc}rad)` : "";
    }
    this.progress();
  }

  progress() {
    const s = this.game.cur(),
      sp =
        this.game.pointer.drag && this.game.pointer.drag.kind === "ing" && s && s.a === "put" && s.ing === this.game.pointer.drag.id
          ? s.st
          : null;
    for (const id in Catalog.stations) {
      const p = this.query(`[data-drop="${id}"] .ck-prog`);
      if (p.parentNode.classList.contains("cooking")) continue;
      let k = 0;
      if (id === "planche" && s && s.a === "cut") k = this.game.chops / s.n;
      else if (id === "bol" && s && s.a === "stir") k = Math.min(1, Math.abs(this.game.stirAcc) / (Math.PI * 2 * s.n));
      if (id === sp)
        k = Catalog.ingredients[this.game.pointer.drag.id].pour
          ? this.game.pointer.drag.fill / CooktouGame.POUR_T
          : this.game.pointer.drag.shakes / CooktouGame.SHAKES;
      p.style.width = Math.min(1, k) * 80 + "%";
    }
    const c = $("ckCount");
    if (!c || !s) return;
    if (s.a === "cut") c.textContent = `${this.game.chops} / ${s.n} coups`;
    else if (s.a === "stir") c.textContent = `${Math.min(100, Math.round((Math.abs(this.game.stirAcc) / (Math.PI * 2 * s.n)) * 100))} %`;
    else if (s.a === "put" && Catalog.ingredients[s.ing].shake)
      c.textContent = `${this.game.pointer.drag && this.game.pointer.drag.id === s.ing ? this.game.pointer.drag.shakes : 0} / ${CooktouGame.SHAKES} secousses`;
  }

  render() {
    this.renderClients();
    this.renderTicket();
    this.renderGuide();
    this.renderStations();
    this.hintIn = 0;
  }

  setMood(m, time) {
    $("ckChef").dataset.mood = m;
    this.game.mood = time || 0;
  }

  setFridge(open) {
    if ($("ckFridge").classList.contains("open") !== open) Sfx.play("fridge");
    $("ckFridge").classList.toggle("open", open);
    this.hintIn = 0;
  }

  wrong(el) {
    if (!el) return;
    el.classList.remove("wrong");
    void el.offsetWidth;
    el.classList.add("wrong");
    setTimeout(() => el.classList.remove("wrong"), 320);
  }

  hints() {
    const g = $("ckGuide"),
      s = this.game.cur();
    let marks = [];
    if (s && !this.game.over) {
      const open = $("ckFridge").classList.contains("open"),
        surf = (id) => this.query(`[data-drop="${id}"] .ck-surf`);
      if (this.game.busy > 0) marks = [[surf(this.game.busySt), "Ça cuit…", 0]];
      else if (s.a === "put")
        marks = [
          Catalog.ingredients[s.ing].cold && !open
            ? [this.query(".fr-handle"), "① Ouvre le frigo", 1]
            : [this.query(`[data-ing="${s.ing}"] .ic`), "① Prends", 1],
          [
            surf(s.st),
            Catalog.ingredients[s.ing].pour ? "② Verse ici" : Catalog.ingredients[s.ing].shake ? "② Secoue ici" : "② Pose ici",
            2,
          ],
        ];
      else if (s.a === "cut")
        marks = [
          [this.query(`[data-tool="knife"]`), "① Couteau", 1],
          [surf("planche"), "② Secoue ici ↕", 2],
        ];
      else if (s.a === "stir")
        marks = [
          [this.query(`[data-tool="spoon"]`), "① Cuillère", 1],
          [surf("bol"), "② Remue ici", 2],
        ];
      else if (s.a === "heat") marks = [[this.query(`[data-heat="${s.st}"]`), "Clique", 1]];
      else if (s.a === "move")
        marks = [
          [surf(s.from), "① Attrape", 1],
          [surf(s.to), "② Pose ici", 2],
        ];
      else marks = [[surf("assiette"), "① Monte l'assiette au client", 1]];
    }
    const a = this.area.getBoundingClientRect(),
      w = $("ckWorld").getBoundingClientRect(),
      pts = [];
    let left = false,
      right = false,
      html = "",
      sig = "";
    for (const [el, label, n] of marks) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.right < a.left + 40) left = true;
      if (r.left > a.right - 40) right = true;
      const x = Math.round((r.left - w.left + r.width / 2) / this.scale),
        y = Math.round((r.top - w.top + Math.min(14, r.height * 0.2)) / this.scale);
      pts.push([x, y]);
      html += `<div class="ck-bub b${n}" style="left:${x}px;top:${y}px">${label}</div>`;
      sig += label + x + "," + y + ";";
    }
    if (pts.length === 2 && !this.game.pointer.drag) {
      const [x1, y1] = pts[0],
        [x2, y2] = pts[1],
        dir = x2 > x1 ? 1 : -1,
        ya = y1 - 34,
        yb = y2 - 34;
      html =
        `<svg class="ck-arrow" width="${CooktouGame.WORLD_W}" height="100%"><defs><marker id="ckHead" viewBox="0 0 10 10" refX="6" refY="5" markerUnits="userSpaceOnUse" markerWidth="22" markerHeight="22" orient="auto"><path class="ck-arrow-head" d="M0 0l10 5-10 5 2.5-5z"/></marker></defs><path class="ck-arrow-line" d="M${x1 + dir * 24} ${ya} Q ${(x1 + x2) / 2} ${Math.min(ya, yb) - 46} ${x2 - dir * 24} ${yb}" marker-end="url(#ckHead)"/></svg>` +
        html;
      sig += "arrow";
    }
    $("ckLeft").classList.toggle("call", left);
    $("ckRight").classList.toggle("call", right);
    if (sig !== this.guideSig) {
      this.guideSig = sig;
      g.innerHTML = html;
    }
  }

  ghost(html, on, tool) {
    const g = $("ckGhost");
    g.innerHTML = html || "";
    g.className = "ck-ghost" + (on ? " on" : "") + (tool ? " tool" : "");
  }

  placeGhost() {
    const g = $("ckGhost");
    g.style.left = this.game.pointer.px + "px";
    g.style.top = this.game.pointer.py + "px";
  }

  fit() {
    const height = $("ckWorld").parentNode.clientHeight;
    this.scale = Math.min(KitchenView.MAX_SCALE, Math.max(KitchenView.MIN_SCALE, height / KitchenView.DESIGN_H));
    $("ckWorld").style.height = height / this.scale + "px";
    this.viewW = this.area.clientWidth / this.scale;
    this.clampCam();
  }

  clampCam() {
    this.camTarget = Math.max(0, Math.min(Math.max(0, CooktouGame.WORLD_W - this.viewW), this.camTarget));
  }

  applyCam() {
    $("ckWorld").style.transform = `translateX(${-Math.round(this.cam * this.scale)}px) scale(${this.scale})`;
  }
}
