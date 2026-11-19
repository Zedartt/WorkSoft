class CareGuide {
  static REFRESH = 0.25;

  constructor(bar, area, onTool) {
    this.bar = bar;
    this.area = area;
    this.toolButton = bar.querySelector(".hr-guide-tool");
    this.chain = bar.querySelector(".hr-guide-steps");
    this.text = bar.querySelector(".hr-guide-text");
    this.key = "";
    this.wanted = null;
    this.toolId = "";
    this.spot = null;
    this.refreshIn = 0;
    this.toolButton.addEventListener("click", () => {
      if (this.toolId) onTool(this.toolId);
    });
  }

  show(target, surface, held) {
    const key = target ? JSON.stringify([target, surface.key, held]) : "";
    if (key === this.key && (!this.spot || this.spot.isConnected)) return false;
    this.key = key;
    this.toolId = target ? target.tool : "";
    const tool = this.toolId && HorseTools.get(this.toolId);
    const chained = !!target && !!target.chain && target.chain.length > 1;
    this.toolButton.innerHTML = tool && !chained ? HorseTools.icon(tool) : "";
    this.toolButton.hidden = !tool || chained;
    this.text.textContent = target ? target.text : "";
    this.chain.innerHTML = chained ? CareGuide.steps(target.chain) : "";
    this.bar.classList.toggle("empty", !target);
    this.mark(target, surface, held);
    this.refreshIn = 0;
    return true;
  }

  static steps(chain) {
    return chain
      .map(({ tool, state }) => `<span class="hr-step ${state}">${HorseTools.icon(HorseTools.get(tool))}</span>`)
      .join('<i class="hr-step-arrow"></i>');
  }

  mark(target, surface, held) {
    if (this.spot) this.spot.remove();
    this.spot = null;
    if (!target || target.x === undefined || (target.tool && !held)) return;
    const spot = document.createElement("i");
    spot.className = "hr-bub b2";
    spot.textContent = target.where;
    surface.place(spot, target.x, target.y);
    surface.fx.append(spot);
    this.spot = spot;
  }

  tick(dt, held) {
    if ((this.refreshIn -= dt) > 0) return;
    this.refreshIn = CareGuide.REFRESH;
    this.take(held);
  }

  take(held) {
    const button = this.toolId && !held ? this.button() : null;
    if (button === this.wanted) return;
    if (this.wanted) this.wanted.classList.remove("hr-wanted");
    this.wanted = button;
    if (button) button.classList.add("hr-wanted");
  }

  button() {
    const tool = this.area.querySelector(`.hr-tool[data-tool="${this.toolId}"]`);
    if (tool && !tool.hidden) return tool;
    return this.area.querySelector(`.hr-tab[data-tab="${HorseTools.get(this.toolId).tab}"]`);
  }

  flash() {
    this.bar.classList.remove("hr-flash");
    void this.bar.offsetWidth;
    this.bar.classList.add("hr-flash");
  }
}
