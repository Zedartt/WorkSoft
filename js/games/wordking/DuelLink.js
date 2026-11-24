class DuelLink {
  static SIGNAL = "https://ntfy.sh/";
  static TOPIC = "worksoft-wordking-";
  static BROKERS = ["wss://broker.emqx.io:8084/mqtt", "wss://test.mosquitto.org:8081/mqtt", "wss://broker.hivemq.com:8884/mqtt"];
  static RELAY_TOPIC = "worksoft/wordking/";
  static ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun.cloudflare.com:3478"] }];
  static ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  static CODE_LEN = 5;
  static GATHER_MS = 2500;
  static AFTER_PUBLIC_MS = 250;
  static SIGNAL_MS = 9000;
  static JOIN_MS = 20000;
  static HELLO_MS = 600;
  static PING_MS = 1000;
  static LOST_MS = 10000;
  static MSG = {
    signal: "Impossible de joindre le service de mise en relation. Vérifie ta connexion Internet.",
    notFound: "Salon introuvable ou déjà complet. Vérifie le code.",
    full: "Ce salon est déjà complet.",
    blocked: "La connexion avec ton adversaire n'a pas marché, ni en direct ni par le relais. Vérifiez vos connexions Internet et réessayez.",
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

  get direct() {
    return Boolean(this.channel && this.channel.readyState === "open");
  }

  reset() {
    this.gen++;
    if (this.source) this.source.close();
    this.closeChannel();
    this.closePeer();
    if (this.relay) this.relay.close();
    clearInterval(this.pinger);
    clearInterval(this.hello);
    clearTimeout(this.timer);
    clearTimeout(this.signalTimer);
    this.id = DuelLink.newCode() + Date.now().toString(36);
    this.role = null;
    this.code = "";
    this.source = null;
    this.peer = null;
    this.answered = false;
    this.relay = null;
    this.relayReady = null;
    this.relayOk = false;
    this.opened = false;
    this.route = "";
    this.seen = 0;
    this.pinger = 0;
    this.hello = 0;
    this.timer = 0;
    this.signalTimer = 0;
  }

  closeChannel() {
    if (this.channel) {
      this.channel.onclose = null;
      this.channel.onmessage = null;
      try {
        this.channel.close();
      } catch (error) {}
    }
    this.channel = null;
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

  topicOf(id) {
    return DuelLink.RELAY_TOPIC + this.code + "/" + id;
  }

  host() {
    this.reset();
    this.role = "host";
    this.code = DuelLink.newCode();
    const gen = this.gen;
    this.relayReady = MqttRelay.connectAny(DuelLink.BROKERS, this.topicOf(this.id), (topic, text) => this.fromRelay(text, gen)).then((relay) => {
      if (gen !== this.gen) {
        if (relay) relay.close();
        return null;
      }
      this.useRelay(relay, gen);
      return relay;
    });
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

  useRelay(relay, gen) {
    if (!relay) return;
    this.relay = relay;
    relay.onClose = () => {
      if (gen !== this.gen) return;
      this.relay = null;
      this.relayOk = false;
      if (this.direct) this.setRoute();
      else if (this.opened) this.lost(DuelLink.MSG.lost);
    };
  }

  signalUrl() {
    return DuelLink.SIGNAL + DuelLink.TOPIC + this.code;
  }

  listen(ready) {
    const gen = this.gen;
    let started = false;
    const source = new EventSource(this.signalUrl() + "/sse");
    this.source = source;
    this.signalTimer = setTimeout(() => this.fail(DuelLink.MSG.signal, gen), DuelLink.SIGNAL_MS);
    source.addEventListener("open", () => {
      if (started || gen !== this.gen) return;
      started = true;
      clearTimeout(this.signalTimer);
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
    fetch(this.signalUrl() + "?cache=no", { method: "POST", body: JSON.stringify(Object.assign({ from: this.id }, data)) })
      .then((response) => {
        if (!response.ok) onError();
      })
      .catch(onError);
  }

  signal(data) {
    if (!data || typeof data.from !== "string" || data.from === this.id || (data.to && data.to !== this.id)) return;
    if (this.role === "host" && data.t === "offer" && typeof data.sdp === "string") {
      if (this.peer && this.peer !== data.from) this.publish({ t: "full", to: data.from }, () => {});
      if (this.peer || this.opened) return;
      this.peer = data.from;
      const gen = this.gen;
      this.relayReady.then(() => this.answer(data.sdp, gen));
    } else if (this.role === "guest" && data.t === "answer" && typeof data.sdp === "string" && this.pc && !this.answered) {
      this.answered = true;
      this.peer = data.from;
      const gen = this.gen;
      this.pc.setRemoteDescription({ type: "answer", sdp: data.sdp }).catch(() => this.closePeer());
      if (DuelLink.BROKERS.includes(data.relay)) this.joinRelay(data.relay, gen);
    } else if (this.role === "guest" && data.t === "full") this.fail(DuelLink.MSG.full);
  }

  joinRelay(url, gen) {
    const relay = new MqttRelay(url, (topic, text) => this.fromRelay(text, gen));
    relay.start(this.topicOf(this.id)).then((ok) => {
      if (!ok || gen !== this.gen) {
        relay.close();
        return;
      }
      this.useRelay(relay, gen);
      this.startHello(gen);
    });
  }

  startHello(gen) {
    clearInterval(this.hello);
    const tick = () => {
      if (gen !== this.gen || this.relayOk || !this.peer) clearInterval(this.hello);
      else this.relaySend({ t: "hi" });
    };
    this.hello = setInterval(tick, DuelLink.HELLO_MS);
    tick();
  }

  relaySend(data) {
    if (!this.relay || !this.peer) return false;
    return this.relay.publish(this.topicOf(this.peer), JSON.stringify({ f: this.id, d: data }));
  }

  fromRelay(text, gen) {
    if (gen !== this.gen) return;
    let packet = null;
    try {
      packet = JSON.parse(text);
    } catch (error) {
      return;
    }
    if (!packet || packet.f !== this.peer || !packet.d) return;
    if (!this.relayOk) {
      this.relayOk = true;
      clearInterval(this.hello);
      this.relaySend({ t: "hi" });
      this.ready();
    }
    this.handle(packet.d);
  }

  makePeer(gen) {
    const pc = new RTCPeerConnection({ iceServers: DuelLink.ICE });
    pc.onconnectionstatechange = () => {
      if (gen === this.gen && pc === this.pc && pc.connectionState === "failed") this.broken();
    };
    return pc;
  }

  broken() {
    this.closeChannel();
    this.closePeer();
    if (!this.opened) return;
    if (this.relayOk) this.setRoute();
    else this.lost(DuelLink.MSG.lost);
  }

  dropPending() {
    if (this.opened) return;
    clearInterval(this.hello);
    this.closeChannel();
    this.closePeer();
    this.peer = null;
    this.relayOk = false;
  }

  async offer(gen) {
    try {
      const pc = this.makePeer(gen);
      this.pc = pc;
      this.wire(pc.createDataChannel("duel"), gen);
      await pc.setLocalDescription(await pc.createOffer());
      await DuelLink.gathered(pc);
      if (gen !== this.gen) return;
      this.publish({ t: "offer", sdp: pc.localDescription.sdp }, () => this.fail(DuelLink.MSG.signal, gen));
    } catch (error) {
      this.fail(DuelLink.MSG.blocked, gen);
    }
  }

  async answer(sdp, gen) {
    if (gen !== this.gen || !this.peer) return;
    const peer = this.peer;
    try {
      const pc = this.makePeer(gen);
      this.pc = pc;
      pc.ondatachannel = (event) => this.wire(event.channel, gen);
      await pc.setRemoteDescription({ type: "offer", sdp });
      await pc.setLocalDescription(await pc.createAnswer());
      await DuelLink.gathered(pc);
      if (gen !== this.gen || this.peer !== peer) return;
      this.publish({ t: "answer", to: peer, sdp: pc.localDescription.sdp, relay: this.relay ? this.relay.url : null }, () => this.dropPending());
    } catch (error) {
      if (gen !== this.gen || this.peer !== peer) return;
      this.closePeer();
      this.publish({ t: "answer", to: peer, sdp: "", relay: this.relay ? this.relay.url : null }, () => this.dropPending());
    }
    if (this.relay) this.startHello(gen);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.dropPending(), DuelLink.JOIN_MS);
  }

  wire(channel, gen) {
    channel.onopen = () => {
      if (gen !== this.gen) return;
      this.channel = channel;
      this.ready();
    };
    channel.onmessage = (event) => {
      if (gen !== this.gen) return;
      let data = null;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        return;
      }
      this.handle(data);
    };
    channel.onclose = () => {
      if (gen !== this.gen || this.channel !== channel) return;
      this.channel = null;
      if (!this.opened) return;
      if (this.relayOk) this.setRoute();
      else this.lost(DuelLink.MSG.left);
    };
  }

  setRoute() {
    const route = this.direct ? "direct" : this.relayOk ? "relay" : "";
    if (route === this.route) return;
    this.route = route;
    if (this.opened && this.events.route) this.events.route(route);
  }

  ready() {
    if (!this.opened) {
      this.opened = true;
      clearTimeout(this.timer);
      if (this.source) this.source.close();
      this.source = null;
      this.seen = performance.now();
      this.pinger = setInterval(() => this.beat(), DuelLink.PING_MS);
      this.events.open();
    }
    this.setRoute();
  }

  handle(data) {
    this.seen = performance.now();
    if (!this.opened || !data || typeof data.t !== "string" || data.t === "ping" || data.t === "hi") return;
    if (data.t === "bye") this.lost(DuelLink.MSG.left);
    else this.events.message(data);
  }

  beat() {
    if (performance.now() - this.seen > DuelLink.LOST_MS) this.lost(DuelLink.MSG.lost);
    else this.send({ t: "ping" });
  }

  send(data) {
    if (this.direct) {
      try {
        this.channel.send(JSON.stringify(data));
        return;
      } catch (error) {}
    }
    if (this.relayOk) this.relaySend(data);
  }

  leave() {
    if (this.opened) this.send({ t: "bye" });
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
