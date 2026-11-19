class CareBook {
  constructor(list, onPick) {
    this.list = list;
    this.items = new Map();
    list.addEventListener("click", (event) => {
      const item = event.target.closest("[data-task]");
      if (item) onPick(+item.dataset.task);
    });
  }

  show(tasks, ready) {
    this.items.clear();
    this.list.innerHTML = tasks
      .map(
        (task, index) => `<li class="hr-task" data-task="${index}">
          <button class="hr-task-btn" type="button"><span class="hr-check"></span><span class="hr-task-tool"></span><b>${task.spec.label}</b></button>
          <i class="hr-task-bar"><i></i></i>
        </li>`,
      )
      .join("");
    tasks.forEach((task, index) => {
      const item = this.list.children[index];
      this.items.set(task, { item, tool: item.querySelector(".hr-task-tool"), bar: item.querySelector(".hr-task-bar i"), toolId: null });
      this.update(task, ready);
    });
  }

  update(task, ready) {
    const view = this.items.get(task);
    if (!view) return;
    view.item.classList.toggle("done", task.done);
    view.item.classList.toggle("locked", task.spec.final && !ready);
    view.bar.style.transform = `scaleX(${CareBook.fraction(task).toFixed(3)})`;
    const step = task.done ? null : task.spec.steps[CareBook.stage(task)];
    const toolId = step ? [].concat(step.tool)[0] : "";
    if (toolId === view.toolId) return;
    view.toolId = toolId;
    view.tool.innerHTML = toolId ? HorseTools.icon(HorseTools.get(toolId)) : "";
  }

  static stage(task) {
    return Math.min(...task.points.map((point) => point.stage));
  }

  static fraction(task) {
    const steps = task.spec.steps.length;
    const total = task.points.reduce((sum, point) => sum + Math.min(steps, point.stage + point.progress), 0);
    return total / (task.points.length * steps);
  }

  focus(task) {
    for (const [other, view] of this.items) view.item.classList.toggle("focus", other === task);
  }
}
