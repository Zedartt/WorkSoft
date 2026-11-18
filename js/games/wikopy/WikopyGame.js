class WikopyGame extends Game {
  constructor() {
    super({
      id: "wikopy",
      name: "Wikopy-past",
      tag: "Recopie Wikipédia le plus vite possible",
      art: "W<i></i>",
      help: {
        goal: "Recopie le début d'un article Wikipédia tiré au hasard, le plus vite et le plus juste possible.",
        controls: [
          ["Clavier", "Tape le texte affiché"],
          ["Espace", "Valide le mot et passe au suivant (seulement s'il est exact)"],
          ["Échap ou ↻", "Change de page"],
          ["Entrée", "Nouvelle page une fois le texte fini"],
        ],
        rules: [
          "Le chrono démarre à la première lettre tapée.",
          "Tu ne passes au mot suivant que quand le mot en cours est exact.",
          "Majuscules et accents sont facultatifs : « e » vaut aussi « é » ou « É ».",
          "À la fin : mots par minute, précision, erreurs et temps.",
        ],
      },
    });
    this.input = $("hidden");
    this.viewEl = $("text");
    this.textEl = $("tape");
    this.page = null;
    this.words = [];
    this.wi = 0;
    this.started = 0;
    this.ended = 0;
    this.timer = null;
    this.keystrokes = 0;
    this.errors = 0;
    this.lastLen = 0;
    this.composing = false;
    this.active = false;
    this.paused = false;
    this.pausedAt = 0;
    this.loadToken = 0;
    this.input.addEventListener("compositionstart", () => {
      this.composing = true;
    });
    this.input.addEventListener("compositionend", () => {
      this.composing = false;
      this.evaluate();
    });
    this.input.addEventListener("input", (e) => {
      if (this.composing || e.isComposing) {
        this.render();
        return;
      }
      this.evaluate();
    });
    this.input.addEventListener("paste", (e) => e.preventDefault());
    this.input.addEventListener("drop", (e) => e.preventDefault());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Tab" || e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
      if (e.key === "Enter") e.preventDefault();
      requestAnimationFrame((...args) => this.render(...args));
    });
    this.input.addEventListener("blur", () => this.render());
    this.input.addEventListener("focus", () => this.render());
    document.addEventListener("selectionchange", () => {
      if (this.active && document.activeElement === this.input) this.render();
    });
    $("stage").addEventListener("mousedown", (e) => {
      if (!this.active || this.paused || this.ended || e.target.closest("#results")) return;
      e.preventDefault();
      this.input.focus();
    });
    document.addEventListener("keydown", (e) => {
      if (!this.active || this.paused) return;
      if (e.key === "Escape") {
        e.preventDefault();
        this.load();
        return;
      }
      if (this.ended && e.key === "Enter") {
        e.preventDefault();
        this.load();
        return;
      }
      if (!this.ended && this.page && document.activeElement !== this.input && e.key.length === 1 && !e.ctrlKey && !e.metaKey)
        this.input.focus();
    });
    window.addEventListener("resize", () => {
      if (this.active) this.render();
    });
    $("nextBtn").addEventListener("click", (...args) => this.load(...args));
    $("wkNew").addEventListener("click", (...args) => this.load(...args));
    $("retryBtn").addEventListener("click", () => {
      if (this.page) this.startWith(this.page);
    });
    this.source = new WikiSource();
  }

  esc(c) {
    return c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c;
  }

  render() {
    if (!this.page) return;
    const val = this.input.value;
    const caret = document.activeElement === this.input ? (this.input.selectionStart ?? val.length) : -1;
    let html = "";
    this.words.forEach((w, i) => {
      if (i < this.wi) {
        html += `<span class="w done${i < this.wi - 1 ? " gone" : ""}">${[...w].map((...args) => this.esc(...args)).join("")}</span> `;
        return;
      }
      if (i > this.wi) {
        html += `<span class="w">${[...w].map((...args) => this.esc(...args)).join("")}</span> `;
        return;
      }
      let inner = "";
      const n = Math.max(w.length, val.length);
      for (let k = 0; k <= n; k++) {
        if (k === caret) inner += '<span class="caret"></span>';
        if (k === n) break;
        if (k < w.length) {
          const cls = k < val.length ? (TextRules.charOk(val[k], w[k]) ? "ok" : "bad") : "";
          inner += `<span class="l ${cls}">${this.esc(w[k])}</span>`;
        } else {
          inner += `<span class="l extra">${this.esc(val[k])}</span>`;
        }
      }
      html += `<span class="w cur" id="curWord">${inner}</span> `;
    });
    this.textEl.innerHTML = html;
    const cur = $("curWord");
    if (cur) this.textEl.style.transform = `translateX(${Math.round(this.viewEl.clientWidth * 0.3 - cur.offsetLeft)}px)`;
    $("liveErr").textContent = this.errors;
  }

  shake() {
    const el = $("curWord");
    if (el) {
      el.classList.remove("shake");
      void el.offsetWidth;
      el.classList.add("shake");
    }
  }

  evaluate() {
    if (!this.active || !this.page || this.ended) return;
    const word = this.words[this.wi];
    let val = this.input.value;
    if (/\s/.test(val)) {
      let pos = this.input.selectionStart ?? val.length;
      const before = val.slice(0, pos).replace(/\s/g, "").length;
      val = val.replace(/\s/g, "");
      this.input.value = val;
      this.input.setSelectionRange(before, before);
      if (!this.started) {
        this.lastLen = val.length;
        this.render();
        return;
      }
      this.keystrokes++;
      if (TextRules.wordOk(val, word) && this.wi < this.words.length - 1) {
        Sfx.play("word");
        this.nextWord();
        return;
      }
      this.errors++;
      this.lastLen = val.length;
      this.render();
      this.shake();
      Sfx.play("bad");
      return;
    }
    if (val.length > word.length + 6) {
      val = val.slice(0, word.length + 6);
      this.input.value = val;
    }
    if (val.length > this.lastLen) {
      if (!this.started) this.startClock();
      const added = val.length - this.lastLen;
      const end = Math.min(this.input.selectionStart ?? val.length, val.length);
      for (let k = Math.max(0, end - added); k < end; k++) {
        this.keystrokes++;
        if (k >= word.length || !TextRules.charOk(val[k], word[k])) {
          this.errors++;
          Sfx.play("bad");
        } else Sfx.play("key");
      }
    }
    this.lastLen = val.length;
    if (this.wi === this.words.length - 1 && TextRules.wordOk(val, word)) {
      this.wi++;
      this.input.value = "";
      this.render();
      this.finish();
      return;
    }
    this.render();
  }

  nextWord() {
    this.wi++;
    this.input.value = "";
    this.lastLen = 0;
    this.render();
  }

  startClock() {
    this.started = performance.now();
    this.timer = setInterval((...args) => this.updateLive(...args), 100);
  }

  updateLive() {
    const t = ((this.ended || performance.now()) - this.started) / 1000;
    $("liveTime").textContent = t.toFixed(1);
    $("liveWpm").textContent = t > 0.5 ? Math.round(this.wi / (t / 60)) : 0;
  }

  finish() {
    this.ended = performance.now();
    Sfx.play("win");
    clearInterval(this.timer);
    this.updateLive();
    const secs = (this.ended - this.started) / 1000,
      mins = secs / 60;
    const wpm = Math.round(this.words.length / mins);
    const cpm = Math.round(this.page.text.length / mins);
    const acc = this.keystrokes ? Math.max(0, ((this.keystrokes - this.errors) / this.keystrokes) * 100) : 100;
    $("rWpm").textContent = wpm;
    $("rAcc").textContent = acc.toFixed(1).replace(".", ",") + " %";
    $("rErr").textContent = this.errors;
    $("rTime").textContent = secs.toFixed(1).replace(".", ",") + " s";
    $("rCpm").textContent = cpm;
    let best = 0;
    try {
      best = +localStorage.getItem("wikopy_best") || 0;
    } catch (e) {}
    if (wpm > best) {
      try {
        localStorage.setItem("wikopy_best", wpm);
      } catch (e) {}
      $("record").textContent = best ? `Nouveau record ! (ancien : ${best} mots/min)` : "Premier score enregistré.";
    } else {
      $("record").textContent = `Ton record : ${best} mots/min`;
    }
    const link = $("wikiLink");
    if (this.page.url) {
      link.href = this.page.url;
      link.style.display = "";
    } else {
      link.style.display = "none";
    }
    $("results").classList.add("show");
    this.input.blur();
  }

  reset() {
    clearInterval(this.timer);
    this.wi = 0;
    this.started = 0;
    this.ended = 0;
    this.keystrokes = 0;
    this.errors = 0;
    this.lastLen = 0;
    this.composing = false;
    this.input.value = "";
    $("liveTime").textContent = "0.0";
    $("liveWpm").textContent = "0";
    $("liveErr").textContent = "0";
    $("results").classList.remove("show");
  }

  startWith(p) {
    this.page = p;
    this.words = p.text.split(" ").filter(Boolean);
    this.reset();
    $("wikiTitle").textContent = p.title;
    $("hint").innerHTML =
      (p.offline
        ? '<b style="color:var(--bad)">Wikipédia injoignable (' + (p.error || "?").replace(/</g, "&lt;") + ") : texte de secours</b> · "
        : "") + "Le chrono démarre à la première lettre · <kbd>Espace</kbd> valide le mot · <kbd>Échap</kbd> nouvelle page";
    this.input.focus();
    this.render();
  }

  async load() {
    const token = ++this.loadToken;
    this.page = null;
    this.reset();
    $("wikiTitle").textContent = "…";
    this.textEl.style.transform = "none";
    this.textEl.innerHTML = '<span id="status">Recherche d\'une page Wikipédia…</span>';
    const p = await this.source.fetchPage();
    if (token !== this.loadToken || !this.active) return;
    this.startWith(p);
  }

  open() {
    this.active = true;
    this.load();
  }

  pause() {
    if (!this.active) return false;
    this.paused = true;
    if (this.started && !this.ended) {
      this.pausedAt = performance.now();
      clearInterval(this.timer);
    }
    return true;
  }

  resume() {
    this.paused = false;
    if (this.pausedAt) {
      this.started += performance.now() - this.pausedAt;
      this.pausedAt = 0;
      this.timer = setInterval(() => this.updateLive(), 100);
    }
    if (this.page && !this.ended) this.input.focus();
  }

  close() {
    this.active = false;
    this.paused = false;
    this.pausedAt = 0;
    this.paused = false;
    this.pausedAt = 0;
    this.loadToken++;
    clearInterval(this.timer);
    this.input.blur();
  }
}
