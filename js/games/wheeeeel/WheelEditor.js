class WheelEditor {
  constructor(store, onDone) {
    this.store = store;
    this.onDone = onDone;
    this.veil = $("wlEditor");
    this.cellsEl = $("wlCells");
    this.draftId = null;
    this.armedDelete = false;
    this.bind();
  }

  bind() {
    $("wlAddCell").addEventListener("click", () => this.addCell("", true));
    $("wlSave").addEventListener("click", () => this.save());
    $("wlCancel").addEventListener("click", () => this.close());
    $("wlDelete").addEventListener("click", () => this.remove());
    this.cellsEl.addEventListener("click", (e) => {
      const button = e.target.closest(".wl-cell-del");
      if (!button) return;
      const rows = this.rows();
      if (rows.length <= WheelStore.MIN_CELLS) return this.error(`Il faut au moins ${WheelStore.MIN_CELLS} cases.`);
      button.closest(".wl-cell").remove();
      this.refresh();
    });
    this.cellsEl.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || !e.target.matches("input[type=text]")) return;
      e.preventDefault();
      const row = e.target.closest(".wl-cell");
      if (this.rows().length >= WheelStore.MAX_CELLS) return this.save();
      const fresh = this.addCell("", false);
      row.after(fresh);
      this.refresh();
      fresh.querySelector("input[type=text]").focus();
    });
    this.cellsEl.addEventListener("input", (e) => {
      this.error("");
      if (!e.target.matches(".wl-cell-color input")) return;
      e.target.closest(".wl-cell").dataset.custom = "1";
      this.refresh();
    });
    $("wlEditName").addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const first = this.cellsEl.querySelector("input[type=text]");
      if (first) first.focus();
    });
  }

  isOpen() {
    return this.veil.classList.contains("show");
  }

  open(wheel) {
    this.draftId = wheel ? wheel.id : null;
    this.armedDelete = false;
    $("wlEditTitle").textContent = wheel ? "Modifier la roue" : "Nouvelle roue";
    $("wlEditName").value = wheel ? wheel.name : "";
    $("wlDelete").hidden = !wheel;
    $("wlDelete").textContent = "Supprimer la roue";
    this.cellsEl.innerHTML = "";
    const cells = wheel ? wheel.cells : ["", ""];
    cells.forEach((text, i) => this.addCell(text, false, wheel ? wheel.colors[i] : null));
    this.refresh();
    this.error("");
    this.veil.classList.add("show");
    this.veil.scrollTop = 0;
    $("wlEditName").focus();
  }

  close() {
    this.veil.classList.remove("show");
    this.onDone(null);
  }

  rows() {
    return [...this.cellsEl.querySelectorAll(".wl-cell")];
  }

  addCell(text, focus, color = null) {
    if (this.rows().length >= WheelStore.MAX_CELLS) {
      this.error(`${WheelStore.MAX_CELLS} cases au maximum.`);
      return null;
    }
    const row = document.createElement("div");
    row.className = "wl-cell";
    row.innerHTML = `<label class="wl-cell-color" title="Choisir la couleur"><input type="color" aria-label="Couleur de la case" /></label><input type="text" maxlength="${WheelStore.MAX_TEXT}" placeholder="Texte de la case" aria-label="Texte de la case" /><button type="button" class="wl-cell-del" title="Retirer cette case" aria-label="Retirer cette case">✕</button>`;
    row.querySelector("input[type=text]").value = text;
    if (color) {
      row.dataset.custom = "1";
      row.querySelector("input[type=color]").value = color;
    }
    this.cellsEl.appendChild(row);
    this.refresh();
    if (focus) row.querySelector("input[type=text]").focus();
    return row;
  }

  refresh() {
    const rows = this.rows();
    const colors = WheelPainter.colors(rows.length, this.customColors());
    rows.forEach((row, i) => {
      const picker = row.querySelector("input[type=color]");
      if (!row.dataset.custom) picker.value = colors[i];
      row.querySelector(".wl-cell-color").style.background = picker.value;
      row.querySelector(".wl-cell-del").disabled = rows.length <= WheelStore.MIN_CELLS;
    });
    $("wlAddCell").disabled = rows.length >= WheelStore.MAX_CELLS;
    $("wlCount").textContent = `${rows.length} case${rows.length > 1 ? "s" : ""}`;
  }

  customColors() {
    return this.rows().map((row) => (row.dataset.custom ? row.querySelector("input[type=color]").value : null));
  }

  error(text) {
    $("wlError").textContent = text;
  }

  save() {
    const rows = this.rows();
    const cells = rows.map((row) => row.querySelector("input[type=text]").value.trim());
    if (cells.filter(Boolean).length < WheelStore.MIN_CELLS) return this.error(`Écris au moins ${WheelStore.MIN_CELLS} cases.`);
    const name = $("wlEditName").value.trim() || "Ma roue";
    const wheel = this.store.put({ id: this.draftId || WheelStore.newId(), name, cells, colors: this.customColors() });
    if (!wheel) return this.error("Impossible d'enregistrer cette roue.");
    Sfx.play("select");
    this.veil.classList.remove("show");
    this.onDone(wheel);
  }

  remove() {
    if (!this.draftId) return;
    if (!this.armedDelete) {
      this.armedDelete = true;
      $("wlDelete").textContent = "Sûr ? Clique encore";
      return;
    }
    this.store.remove(this.draftId);
    Sfx.play("back");
    this.veil.classList.remove("show");
    this.onDone(this.store.current());
  }
}
