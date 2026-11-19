class RanchKit {
  constructor(tabs, tools, onSelect) {
    this.tabs = tabs;
    this.tools = tools;
    this.onSelect = onSelect;
    this.tab = HorseTools.TABS[0].id;
    this.selected = "";
    tabs.innerHTML = HorseTools.TABS.map((tab) => `<button class="hr-tab" type="button" data-tab="${tab.id}">${tab.name}</button>`).join("");
    tools.innerHTML = HorseTools.LIST.map(
      (tool) => `<button class="hr-tool" type="button" data-tool="${tool.id}" data-tab="${tool.tab}" title="${tool.name}">${HorseTools.icon(tool)}<span>${tool.name}</span></button>`,
    ).join("");
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tab]");
      if (!button) return;
      this.showTab(button.dataset.tab);
      Sfx.play("click");
    });
    tools.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tool]");
      if (button) this.onSelect(button.dataset.tool === this.selected ? "" : button.dataset.tool);
    });
    this.showTab(this.tab);
  }

  showTab(id) {
    this.tab = id;
    for (const button of this.tabs.children) button.classList.toggle("on", button.dataset.tab === id);
    for (const button of this.tools.children) button.hidden = button.dataset.tab !== id;
  }

  select(id) {
    this.selected = id;
    for (const button of this.tools.children) button.classList.toggle("on", button.dataset.tool === id);
    if (id) this.showTab(HorseTools.get(id).tab);
  }

  suggest(ids) {
    const wanted = [].concat(ids);
    if (!wanted.length) return;
    this.showTab(HorseTools.get(wanted[0]).tab);
    for (const button of this.tools.children) button.classList.remove("hr-hinted");
    void this.tools.offsetWidth;
    for (const button of this.tools.children) if (wanted.includes(button.dataset.tool)) button.classList.add("hr-hinted");
  }
}
