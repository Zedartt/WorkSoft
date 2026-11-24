class WordKingGame extends Game {
  static TARGET = 60;
  static ROUND_TIME = 90;
  static COUNT_TIME = 5;
  static GO_TIME = 0.8;
  static START_DELAY = 1;
  static RESTART_DELAY = 0.4;
  static MAX_TYPED = 40;
  static WINS_KEY = "wordking_wins";

  static player() {
    return { index: 0, letters: 0, words: 0, typed: "", bad: false };
  }

  static escape(text) {
    return String(text).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
  }

  static clockText(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  static distance(a, b) {
    let row = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const next = [i];
      for (let j = 1; j <= b.length; j++) next[j] = Math.min(row[j] + 1, next[j - 1] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      row = next;
    }
    return row[b.length];
  }

  static gain(word, typed) {
    const target = WordList.plain(word),
      max = DuelWords.letters(word);
    if (typed === target) return { points: max, max, perfect: true };
    const ratio = Math.max(0, 1 - WordKingGame.distance(target, typed) / Math.max(target.length, typed.length));
    return { points: Math.min(max - 1, Math.round(max * ratio)), max, perfect: false };
  }

  static marks(word, typed) {
    let html = "",
      rest = typed,
      bad = false;
    for (const ch of word) {
      const plain = WordList.plain(ch);
      let cls = "";
      if (rest.length) {
        const part = rest.slice(0, plain.length);
        if (!bad && part === plain.slice(0, part.length)) cls = "ok";
        else {
          bad = true;
          cls = "bad";
        }
        rest = rest.slice(plain.length);
      }
      html += `<span${cls ? ` class="${cls}"` : ""}>${WordKingGame.escape(ch)}</span>`;
    }
    return html;
  }

  constructor() {
    super({
      id: "wordking",
      record: { key: "wordking_wins", label: "Victoires", none: "Aucune victoire pour l'instant", bar: false },
      name: "Word King",
      tag: "Duel de vitesse de frappe en ligne : pousse la barre jusqu'au camp adverse",
      art: '<svg viewBox="0 0 64 52" style="height:1em"><path d="M6 40 3 12l15 12L32 4v36z" fill="#2f8bff"/><path d="M32 4l14 20 15-12-3 28H32z" fill="#ff3048"/><rect x="6" y="43" width="52" height="7" rx="2" fill="currentColor"/></svg>',
      help: {
        goal: "Un duel de frappe en ligne : écris les mots plus vite que ton adversaire pour pousser la barre jusqu'au bout de son camp.",
        controls: [
          ["Créer un salon", "Donne le code de 5 caractères à ton adversaire"],
          ["Rejoindre", "Tape le code reçu puis valide"],
          ["Clavier", "Écris le mot affiché : il part tout seul dès qu'il est juste"],
          ["Entrée", "Valide le mot même avec des fautes (moins de points)"],
          ["Entrée, à la fin", "Revanche"],
        ],
        rules: [
          "Bleu, c'est toi ; rouge, c'est ton adversaire. Tu vois ce qu'il tape en direct.",
          "Chaque mot écrit pousse la barre vers l'autre camp : 1 point par lettre quand il est parfait.",
          "Avec des fautes, Entrée le valide quand même, mais il rapporte moins : seulement la part du mot bien écrite.",
          "Le petit mot à droite est le suivant : prépare-toi à l'écrire.",
          `La barre poussée jusqu'au bout gagne le duel. Au bout de ${WordKingGame.clockText(WordKingGame.ROUND_TIME)}, celui qui a la barre de son côté gagne.`,
          "Vous avez tous les deux les mêmes mots, dans le même ordre.",
          "Accents et majuscules sont facultatifs.",
          "Il faut une connexion Internet. Ça marche sur la même box comme sur deux réseaux différents : en liaison directe quand c'est possible, sinon par un relais.",
          "Pas de pause en ligne : le duel continue derrière cette fiche.",
        ],
      },
    });
    this.canvas = $("wkCanvas");
    this.arena = new DuelArena(this.canvas);
    this.input = $("wkInput");
    this.link = new DuelLink("wordking", {
      open: () => this.connected(),
      message: (data) => this.receive(data),
      closed: (reason) => this.lobby(reason),
      failed: (reason) => this.lobby(reason),
      route: (route) => this.showRoute(route),
    });
    this.raf = 0;
    this.last = 0;
    this.bound = false;
    this.phase = "lobby";
    this.words = null;
    this.me = WordKingGame.player();
    this.foe = WordKingGame.player();
    this.clock = 0;
    this.startIn = 0;
    this.beep = 0;
    this.again = false;
    this.foeAgain = false;
    this.timeText = "";
  }

  view(name) {
    $("wkLobbyCard").dataset.view = name;
  }

  room(code) {
    $("wkRoomCode").textContent = code || "—";
    $("wkLeave").style.visibility = code ? "visible" : "hidden";
  }

  showRoute(route) {
    $("wkRoute").textContent = route === "direct" ? "directe" : route === "relay" ? "relais" : "—";
  }

  wins() {
    return +Store.read(WordKingGame.WINS_KEY, 0) || 0;
  }

  lobby(error = "") {
    this.phase = "lobby";
    this.words = null;
    this.me = WordKingGame.player();
    this.foe = WordKingGame.player();
    this.again = false;
    this.foeAgain = false;
    this.clock = 0;
    this.arena.reset();
    this.arena.energy = 0.35;
    $("wkOver").classList.remove("show");
    $("wkLobby").classList.add("show");
    this.view("home");
    $("wkError").textContent = error;
    if (error) Sfx.play("bad");
    this.room("");
    this.showRoute("");
    this.input.value = "";
    this.input.blur();
    this.render();
  }

  create() {
    const code = this.link.host();
    this.phase = "hosting";
    $("wkCode").textContent = code;
    $("wkCopy").textContent = "Copier le code";
    $("wkError").textContent = "";
    this.view("wait");
    this.room(code);
    Sfx.play("click");
  }

  join() {
    const field = $("wkCodeInput"),
      code = DuelLink.cleanCode(field.value);
    if (code.length !== DuelLink.CODE_LEN) {
      $("wkError").textContent = `Le code fait ${DuelLink.CODE_LEN} caractères.`;
      field.classList.remove("wk-wrong");
      void field.offsetWidth;
      field.classList.add("wk-wrong");
      Sfx.play("bad");
      return;
    }
    this.link.join(code);
    this.phase = "joining";
    $("wkJoinCode").textContent = code;
    $("wkError").textContent = "";
    this.view("join");
    this.room(code);
    Sfx.play("click");
  }

  cancel() {
    this.link.leave();
    this.lobby();
  }

  copy() {
    const code = $("wkCode").textContent,
      button = $("wkCopy"),
      select = () => {
        const range = document.createRange();
        range.selectNodeContents($("wkCode"));
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        button.textContent = "Fais Ctrl+C";
      };
    try {
      navigator.clipboard.writeText(code).then(() => (button.textContent = "Code copié !"), select);
    } catch (error) {
      select();
    }
  }

  connected() {
    $("wkLobby").classList.remove("show");
    this.phase = "ready";
    this.startIn = WordKingGame.START_DELAY;
    this.arena.energy = 0.6;
    this.showRoute(this.link.route);
    Sfx.play("wkJoin");
    this.render();
  }

  begin(seed) {
    this.words = new DuelWords(seed);
    this.me = WordKingGame.player();
    this.foe = WordKingGame.player();
    this.clock = -WordKingGame.COUNT_TIME;
    this.beep = WordKingGame.COUNT_TIME + 1;
    this.phase = "count";
    this.again = false;
    this.foeAgain = false;
    this.arena.reset();
    this.arena.energy = 1;
    $("wkOver").classList.remove("show");
    $("wkLobby").classList.remove("show");
    this.input.value = "";
    $("wkField").classList.remove("wk-typing");
    $("wkMyGain").textContent = "";
    $("wkFoeGain").textContent = "";
    this.input.focus({ preventScroll: true });
    this.render();
  }

  go() {
    this.phase = "duel";
    this.arena.go();
    Sfx.play("wkGo");
    this.input.focus({ preventScroll: true });
  }

  balance() {
    return Math.max(-1, Math.min(1, (this.me.letters - this.foe.letters) / WordKingGame.TARGET));
  }

  score(player) {
    return { words: player.words, letters: player.letters };
  }

  referee() {
    const lead = this.me.letters - this.foe.letters;
    if (Math.abs(lead) < WordKingGame.TARGET && this.clock < WordKingGame.ROUND_TIME) return;
    const result = lead > 0 ? "me" : lead < 0 ? "foe" : "draw";
    this.link.send({ t: "end", win: { me: "host", foe: "guest", draw: "draw" }[result], host: this.score(this.me), guest: this.score(this.foe) });
    this.finish(result);
  }

  finish(result) {
    this.phase = "over";
    this.input.value = "";
    this.input.blur();
    this.me.typed = "";
    this.foe.typed = "";
    this.arena.celebrate(result);
    if (result === "me") Store.write(WordKingGame.WINS_KEY, this.wins() + 1);
    Sfx.play(result === "me" ? "wkWin" : result === "foe" ? "wkLose" : "wkJoin");
    const texts = {
      me: ["Victoire", "Tu es le Word King !"],
      foe: ["Défaite", "Ton adversaire est le Word King."],
      draw: ["Égalité", "Personne n'est couronné cette fois."],
    }[result];
    const card = $("wkOverCard");
    card.classList.remove("win", "lose", "draw");
    card.classList.add({ me: "win", foe: "lose", draw: "draw" }[result]);
    $("wkResultTitle").textContent = texts[0];
    $("wkResult").textContent = texts[1];
    $("wkScoreMe").textContent = this.me.words;
    $("wkScoreFoe").textContent = this.foe.words;
    $("wkWins").textContent = this.wins();
    this.note();
    $("wkOver").classList.add("show");
    this.render();
  }

  rematch() {
    if (this.phase !== "over" || this.again) return;
    this.again = true;
    this.link.send({ t: "again" });
    Sfx.play("click");
    this.note();
    this.maybeRestart();
  }

  maybeRestart() {
    if (!this.link.isHost || !this.again || !this.foeAgain) return;
    this.phase = "ready";
    this.startIn = WordKingGame.RESTART_DELAY;
  }

  note() {
    $("wkAgainNote").textContent =
      this.again && this.foeAgain
        ? "C'est reparti !"
        : this.again
          ? "En attente de ton adversaire…"
          : this.foeAgain
            ? "Ton adversaire veut sa revanche !"
            : "";
    $("wkAgain").disabled = this.again;
  }

  receive(data) {
    if (data.t === "start" && !this.link.isHost && Number.isFinite(data.seed)) this.begin(data.seed >>> 0);
    else if (data.t === "type" && this.words && (this.phase === "duel" || this.phase === "count")) {
      if ((data.i | 0) !== this.foe.index) return;
      this.foe.typed = WordList.plain(String(data.v || "")).slice(0, WordKingGame.MAX_TYPED);
      this.renderFoe(false);
    } else if (data.t === "word" && this.words && (this.phase === "duel" || this.phase === "count")) {
      const max = DuelWords.letters(this.words.at(this.foe.index)),
        points = Number.isInteger(data.n) ? Math.max(0, Math.min(max, data.n)) : max,
        perfect = points === max;
      this.foe.index++;
      this.foe.words++;
      this.foe.letters += points;
      this.foe.typed = "";
      this.arena.hit("foe", points, perfect);
      this.showGain("wkFoeGain", points, max, perfect);
      Sfx.play("wkFoe");
      this.renderFoe(true);
    } else if (data.t === "end" && !this.link.isHost && this.phase !== "over") {
      if (data.guest && data.host) {
        this.me.words = data.guest.words | 0;
        this.me.letters = data.guest.letters | 0;
        this.foe.words = data.host.words | 0;
        this.foe.letters = data.host.letters | 0;
      }
      this.finish(data.win === "guest" ? "me" : data.win === "host" ? "foe" : "draw");
    } else if (data.t === "again" && this.phase === "over") {
      this.foeAgain = true;
      this.note();
      this.maybeRestart();
    }
  }

  typed() {
    if (this.phase !== "duel") {
      this.input.value = "";
      return;
    }
    const word = this.words.at(this.me.index),
      target = WordList.plain(word),
      typed = WordList.plain(this.input.value.replace(/\s+/g, ""));
    const ok = target.startsWith(typed);
    if (!ok && !this.me.bad) this.wrong();
    else if (ok && typed.length > this.me.typed.length) Sfx.play("wkKey");
    this.me.bad = !ok;
    this.me.typed = typed;
    $("wkField").classList.toggle("wk-typing", typed.length > 0);
    if (typed === target) {
      this.complete(word, typed);
      return;
    }
    this.link.send({ t: "type", i: this.me.index, v: typed });
    this.renderMe(false);
  }

  wrong() {
    const field = $("wkField");
    field.classList.remove("wk-wrong");
    void field.offsetWidth;
    field.classList.add("wk-wrong");
    Sfx.play("wkMiss");
  }

  submit() {
    if (this.phase !== "duel") return;
    const typed = WordList.plain(this.input.value.replace(/\s+/g, ""));
    if (typed) this.complete(this.words.at(this.me.index), typed);
  }

  complete(word, typed) {
    const { points, max, perfect } = WordKingGame.gain(word, typed);
    this.me.index++;
    this.me.words++;
    this.me.letters += points;
    this.me.typed = "";
    this.me.bad = false;
    this.input.value = "";
    $("wkField").classList.remove("wk-typing");
    this.link.send({ t: "word", i: this.me.index, n: points });
    this.arena.hit("me", points, perfect);
    this.showGain("wkMyGain", points, max, perfect);
    Sfx.play(perfect ? "wkHit" : "wkPart");
    this.renderMe(true);
  }

  showGain(id, points, max, perfect) {
    const el = $(id);
    el.textContent = perfect ? `+${points} · parfait` : `+${points} sur ${max}`;
    el.classList.toggle("wk-perfect", perfect);
    this.pop(el);
  }

  pop(element) {
    element.classList.remove("wk-pop");
    void element.offsetWidth;
    element.classList.add("wk-pop");
  }

  idleWord() {
    return this.phase === "ready" ? "Prêt ?" : "—";
  }

  renderMe(pop) {
    const word = $("wkMyWord");
    if (!this.words) {
      word.textContent = this.idleWord();
      $("wkMyNext").textContent = "";
      $("wkMyGain").textContent = "";
      return;
    }
    word.innerHTML = WordKingGame.marks(this.words.at(this.me.index), this.me.typed);
    $("wkMyNext").textContent = this.words.at(this.me.index + 1);
    if (pop) this.pop(word);
  }

  renderFoe(pop) {
    const word = $("wkFoeWord");
    $("wkFoeTyped").textContent = this.foe.typed;
    if (!this.words) {
      word.textContent = this.idleWord();
      $("wkFoeNext").textContent = "";
      $("wkFoeGain").textContent = "";
      return;
    }
    word.innerHTML = WordKingGame.marks(this.words.at(this.foe.index), this.foe.typed);
    $("wkFoeNext").textContent = this.words.at(this.foe.index + 1);
    if (pop) this.pop(word);
  }

  render() {
    this.renderMe(false);
    this.renderFoe(false);
    $("wkWins").textContent = this.wins();
    this.timeText = "";
    this.showTime();
  }

  showTime() {
    const left = this.phase === "duel" || this.phase === "over" ? WordKingGame.ROUND_TIME - Math.max(0, this.clock) : WordKingGame.ROUND_TIME,
      text = WordKingGame.clockText(left);
    if (text === this.timeText) return;
    this.timeText = text;
    $("wkTime").textContent = text;
  }

  countView() {
    if (this.phase === "count") {
      const left = -this.clock;
      return { text: String(Math.ceil(left)), k: 1 - (left - Math.floor(left)), big: true };
    }
    if (this.phase === "duel" && this.clock < WordKingGame.GO_TIME) return { text: "DUEL !", k: this.clock / WordKingGame.GO_TIME };
    return null;
  }

  update(dt) {
    if (this.phase === "ready" && this.link.isHost) {
      this.startIn -= dt;
      if (this.startIn <= 0) {
        const seed = crypto.getRandomValues(new Uint32Array(1))[0];
        this.link.send({ t: "start", seed });
        this.begin(seed);
      }
    }
    if (this.phase === "count" || this.phase === "duel") {
      this.clock += dt;
      if (this.phase === "count") {
        const n = Math.ceil(-this.clock);
        if (n < this.beep && n > 0) {
          this.beep = n;
          Sfx.play("wkCount");
        }
        if (this.clock >= 0) this.go();
      } else if (this.link.isHost) this.referee();
    }
    if (this.phase !== "over") this.arena.target = this.balance();
    this.arena.update(dt);
    this.showTime();
  }

  draw() {
    this.arena.draw({
      me: { name: "TOI", words: this.me.words },
      foe: { name: "ADVERSAIRE", words: this.foe.words },
      timer: this.timeText,
      count: this.countView(),
    });
  }

  frame(now) {
    const dt = Math.min(now - this.last, 50) / 1000;
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  bind() {
    this.input.addEventListener("input", () => this.typed());
    this.input.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") event.preventDefault();
      if (event.key === "Enter" && !event.repeat) this.submit();
    });
    this.input.addEventListener("paste", (event) => event.preventDefault());
    this.input.addEventListener("drop", (event) => event.preventDefault());
    const codeInput = $("wkCodeInput");
    codeInput.addEventListener("input", () => {
      const clean = DuelLink.cleanCode(codeInput.value);
      if (codeInput.value !== clean) codeInput.value = clean;
    });
    codeInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      this.join();
    });
    document.addEventListener("keydown", (event) => {
      if (!this.raf || event.key !== "Enter" || event.repeat || this.phase !== "over") return;
      event.preventDefault();
      this.rematch();
    });
    $("wkArea").addEventListener("mousedown", (event) => {
      if ((this.phase !== "duel" && this.phase !== "count") || event.target.closest("button, input")) return;
      event.preventDefault();
      this.input.focus({ preventScroll: true });
    });
    $("wkCreate").addEventListener("click", () => this.create());
    $("wkJoin").addEventListener("click", () => this.join());
    $("wkCopy").addEventListener("click", () => this.copy());
    $("wkCancelHost").addEventListener("click", () => this.cancel());
    $("wkCancelJoin").addEventListener("click", () => this.cancel());
    $("wkLeave").addEventListener("click", () => this.cancel());
    $("wkQuit").addEventListener("click", () => this.cancel());
    $("wkAgain").addEventListener("click", () => this.rematch());
    window.addEventListener("pagehide", () => this.link.leave());
    new ResizeObserver(() => {
      if (this.raf) this.arena.resize();
    }).observe(this.canvas);
    this.bound = true;
  }

  pause() {
    return false;
  }

  resume() {}

  open() {
    if (!this.bound) this.bind();
    this.lobby();
    this.arena.resize();
    this.last = performance.now();
    this.raf = requestAnimationFrame((time) => this.frame(time));
  }

  close() {
    this.link.leave();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.lobby();
  }
}
