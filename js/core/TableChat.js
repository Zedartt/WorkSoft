class TableChat {
  static KEEP = 60;
  static WIDE_QUERY = "(min-width: 1180px) and (min-height: 560px)";

  constructor(prefix, send) {
    this.send = send;
    this.box = $(prefix + "Chat");
    this.button = $(prefix + "ChatBtn");
    this.box.innerHTML = '<div class="chat-head"><b>Chat de la table</b><button type="button" class="chat-close" aria-label="Fermer le chat">✕</button></div><div class="chat-list" aria-live="polite"></div><form class="chat-form"><input class="chat-input" type="text" maxlength="160" placeholder="Écris un message…" autocomplete="off" aria-label="Message" /><button type="submit" class="chat-send">Envoyer</button></form><p class="chat-note">Rien n\'est gardé : tout s\'efface quand tu quittes la table.</p>';
    this.list = this.box.querySelector(".chat-list");
    this.input = this.box.querySelector(".chat-input");
    this.badge = document.createElement("span");
    this.badge.className = "chat-badge";
    this.button.appendChild(this.badge);
    this.unread = 0;
    this.open = window.matchMedia(TableChat.WIDE_QUERY).matches;
    this.enabled = false;
    this.button.addEventListener("click", () => this.toggle(!this.open));
    this.box.querySelector(".chat-close").addEventListener("click", () => this.toggle(false));
    this.box.querySelector(".chat-form").addEventListener("submit", (event) => {
      event.preventDefault();
      this.submit();
    });
    this.input.addEventListener("keydown", (event) => event.stopPropagation());
    this.sync();
  }

  enable(on) {
    if (this.enabled === on) return;
    this.enabled = on;
    if (!on) this.clear();
    this.sync();
  }

  toggle(open) {
    this.open = open;
    if (open) {
      this.unread = 0;
      this.list.scrollTop = this.list.scrollHeight;
    }
    this.sync();
    if (open && this.enabled && window.matchMedia("(hover: hover)").matches) this.input.focus();
  }

  sync() {
    this.box.classList.toggle("chat-shown", this.enabled && this.open);
    this.button.hidden = !this.enabled;
    this.button.classList.toggle("on", this.open);
    this.badge.textContent = this.unread ? String(Math.min(this.unread, 99)) : "";
  }

  submit() {
    const sent = this.send(this.input.value);
    if (!sent) return;
    this.input.value = "";
  }

  add(name, color, text, mine) {
    const line = document.createElement("p");
    line.className = "chat-line" + (mine ? " chat-mine" : "");
    const who = document.createElement("b");
    who.textContent = name;
    who.style.setProperty("--who", color);
    const body = document.createElement("span");
    body.textContent = text;
    line.append(who, body);
    const atEnd = this.list.scrollHeight - this.list.scrollTop - this.list.clientHeight < 30;
    this.list.appendChild(line);
    while (this.list.children.length > TableChat.KEEP) this.list.firstChild.remove();
    if (atEnd || mine) this.list.scrollTop = this.list.scrollHeight;
    if (!mine && !(this.open && this.box.offsetParent)) {
      this.unread++;
      Sfx.play("chatPing");
    }
    this.sync();
  }

  clear() {
    this.list.textContent = "";
    this.input.value = "";
    this.unread = 0;
  }
}
