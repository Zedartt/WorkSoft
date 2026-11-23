class DuelLink {
  static RELAY = "https://ntfy.sh/";
  static TOPIC = "worksoft-wordking-";
  static ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
  static ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  static CODE_LEN = 5;
  static GATHER_MS = 2500;
  static AFTER_PUBLIC_MS = 250;
  static RELAY_MS = 9000;
  static JOIN_MS = 20000;
  static PING_MS = 1000;
  static LOST_MS = 10000;
  static MSG = {
    relay: "Impossible de joindre le service de mise en relation. Vérifie ta connexion Internet.",
    notFound: "Salon introuvable ou déjà complet. Vérifie le code.",
    full: "Ce salon est déjà complet.",
    blocked:
      "La connexion directe avec ton adversaire n'a pas marché : un des deux réseaux la bloque (souvent au travail ou à l'école). Essayez avec un autre réseau, par exemple le partage de connexion d'un téléphone.",
    left: "Ton adversaire a quitté le salon.",
    lost: "Connexion perdue avec ton adversaire.",
  };

  static newCode() {
    let code = "";
    for (const value of crypto.getRandomValues(new Uint32Array(DuelLink.CODE_LEN))) code += DuelLink.ALPHABET[value % DuelLink.ALPHABET.length];
    return code;
  }

  static cleanCode(text) {
    return String(text)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, DuelLink.CODE_LEN);
  }

  static gathered(pc) {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      let timer = setTimeout(resolve, DuelLink.GATHER_MS);
      pc.addEventListener("icegatheringstatechange", () => {
        if (pc.iceGatheringState !== "complete") return;
        clearTimeout(timer);
        resolve();
      });
      pc.addEventListener("icecandidate", (event) => {
        if (!event.candidate || event.candidate.type !== "srflx") return;
        clearTimeout(timer);
        timer = setTimeout(resolve, DuelLink.AFTER_PUBLIC_MS);
      });
    });
  }

  constructor(events) {
    this.events = events;
    this.gen = 0;
    this.reset();
  }

  get isHost() {
    return this.role === "host";
  }

  get open() {
    return Boolean(this.channel && this.channel.readyState === "open");
  }

  reset() {
    this.gen++;
    if (this.source) this.source.close();
    if (this.channel) {
      this.channel.onclose = null;
      this.channel.onmessage = null;
      try {
        this.channel.close();
      } catch (error) {}
    }
    this.closePeer();
    clearInterval(this.pinger);
    clearTimeout(this.timer);
    clearTimeout(this.relayTimer);
    this.id = DuelLink.newCode() + Date.now().toString(36);
    this.role = null;
    this.code = "";
    this.source = null;
    this.channel = null;
    this.peer = null;
    this.answered = false;
    this.seen = 0;
    this.pinger = 0;
    this.timer = 0;
    this.relayTimer = 0;
  }

  closePeer() {
    if (this.pc) {
      this.pc.onconnectionstatechange = null;
      try {
        this.pc.close();
      } catch (error) {}
    }
    this.pc = null;
  }

  host() {
    this.reset();
    this.role = "host";
    this.code = DuelLink.newCode();
    this.listen(() => {});
    return this.code;
  }

  join(code) {
    this.reset();
    this.role = "guest";
    this.code = code;
    const gen = this.gen;
    this.listen(() => this.offer(gen));
    this.timer = setTimeout(() => this.fail(this.answered ? DuelLink.MSG.blocked : DuelLink.MSG.notFound, gen), DuelLink.JOIN_MS);
  }

  url() {
    return DuelLink.RELAY + DuelLink.TOPIC + this.code;
  }

  listen(ready) {
    const gen = this.gen;
    let started = false;
    const source = new EventSource(this.url() + "/sse");
    this.source = source;
    this.relayTimer = setTimeout(() => this.fail(DuelLink.MSG.relay, gen), DuelLink.RELAY_MS);
    source.addEventListener("open", () => {
      if (started || gen !== this.gen) return;
      started = true;
      clearTimeout(this.relayTimer);
      ready();
    });
    source.onmessage = (event) => {
      if (gen !== this.gen) return;
      try {
        const note = JSON.parse(event.data);
        if (note.event === "message") this.signal(JSON.parse(note.message));
      } catch (error) {}
    };
  }

  publish(data, onError) {
    fetch(this.url() + "?cache=no", { method: "POST", body: JSON.stringify(Object.assign({ from: this.id }, data)) })
      .then((response) => {
        if (!response.ok) onError();
      })
      .catch(onError);
  }

  signal(data) {
    if (!data || data.from === this.id || (data.to && data.to !== this.id)) return;
    if (this.role === "host" && data.t === "offer" && typeof data.sdp === "string") {
      if (this.peer && this.peer !== data.from) this.publish({ t: "full", to: data.from }, () => {});
      if (this.peer) return;
      this.peer = data.from;
      this.answer(data.sdp, this.gen);
    } else if (this.role === "guest" && data.t === "answer" && typeof data.sdp === "string" && this.pc && !this.answered) {
      this.answered = true;
      this.peer = data.from;
      const gen = this.gen;
      this.pc.setRemoteDescription({ type: "answer", sdp: data.sdp }).catch(() => this.fail(DuelLink.MSG.blocked, gen));
    } else if (this.role === "guest" && data.t === "full") this.fail(DuelLink.MSG.full);
  }

  makePeer(gen) {
    const pc = new RTCPeerConnection({ iceServers: DuelLink.ICE });
    pc.onconnectionstatechange = () => {
      if (gen === this.gen && pc === this.pc && pc.connectionState === "failed") this.broken();
    };
    return pc;
  }

  broken() {
    if (this.channel) this.lost(DuelLink.MSG.lost);
    else if (this.role === "guest") this.fail(DuelLink.MSG.blocked);
    else this.dropPending();
  }

  dropPending() {
    if (this.channel) return;
    this.closePeer();
    this.peer = null;
  }

  async offer(gen) {
    try {
      const pc = this.makePeer(gen);
      this.pc = pc;
      this.wire(pc.createDataChannel("duel"), gen);
      await pc.setLocalDescription(await pc.createOffer());
      await DuelLink.gathered(pc);
      if (gen !== this.gen) return;
      this.publish({ t: "offer", sdp: pc.localDescription.sdp }, () => this.fail(DuelLink.MSG.relay, gen));
    } catch (error) {
      this.fail(DuelLink.MSG.blocked, gen);
    }
  }

  async answer(sdp, gen) {
    try {
      const pc = this.makePeer(gen);
      this.pc = pc;
      pc.ondatachannel = (event) => this.wire(event.channel, gen);
      await pc.setRemoteDescription({ type: "offer", sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await DuelLink.gathered(pc);
      if (gen !== this.gen || pc !== this.pc) return;
      this.publish({ t: "answer", to: this.peer, sdp: pc.localDescription.sdp }, () => this.dropPending());
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.dropPending(), DuelLink.JOIN_MS);
    } catch (error) {
      if (gen === this.gen) this.dropPending();
    }
  }

  wire(channel, gen) {
    channel.onopen = () => {
      if (gen !== this.gen || this.channel) return;
      this.channel = channel;
      clearTimeout(this.timer);
      if (this.source) this.source.close();
      this.source = null;
      this.seen = performance.now();
      this.pinger = setInterval(() => this.beat(), DuelLink.PING_MS);
      this.events.open();
    };
    channel.onmessage = (event) => {
      if (gen !== this.gen) return;
      this.seen = performance.now();
      let data = null;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        return;
      }
      if (!data || typeof data.t !== "string" || data.t === "ping") return;
      if (data.t === "bye") this.lost(DuelLink.MSG.left);
      else this.events.message(data);
    };
    channel.onclose = () => {
      if (gen === this.gen && this.channel === channel) this.lost(DuelLink.MSG.left);
    };
  }

  beat() {
    if (performance.now() - this.seen > DuelLink.LOST_MS) this.lost(DuelLink.MSG.lost);
    else this.send({ t: "ping" });
  }

  send(data) {
    if (!this.open) return;
    try {
      this.channel.send(JSON.stringify(data));
    } catch (error) {}
  }

  leave() {
    this.send({ t: "bye" });
    this.reset();
  }

  lost(reason) {
    if (!this.role) return;
    this.reset();
    this.events.closed(reason);
  }

  fail(reason, gen = this.gen) {
    if (gen !== this.gen || !this.role) return;
    this.reset();
    this.events.failed(reason);
  }
}
