class MqttRelay {
  static CONNECT_MS = 4000;
  static KEEPALIVE = 30;
  static PING_MS = 20000;

  static async connectAny(urls, topic, onMessage) {
    for (const url of urls) {
      const relay = new MqttRelay(url, onMessage);
      if (await relay.start(topic)) return relay;
      relay.close();
    }
    return null;
  }

  static utf(text) {
    const bytes = new TextEncoder().encode(text);
    return [bytes.length >> 8, bytes.length & 255, ...bytes];
  }

  static packet(head, body) {
    const length = [];
    let n = body.length;
    do {
      let digit = n % 128;
      n = Math.floor(n / 128);
      if (n > 0) digit |= 128;
      length.push(digit);
    } while (n > 0);
    const out = new Uint8Array(1 + length.length + body.length);
    out[0] = head;
    out.set(length, 1);
    out.set(body, 1 + length.length);
    return out;
  }

  constructor(url, onMessage) {
    this.url = url;
    this.onMessage = onMessage;
    this.onClose = null;
    this.ws = null;
    this.buffer = new Uint8Array(0);
    this.ready = false;
    this.closed = false;
    this.pinger = 0;
  }

  start(topic) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), MqttRelay.CONNECT_MS);
      try {
        this.ws = new WebSocket(this.url, "mqtt");
      } catch (error) {
        finish(false);
        return;
      }
      this.ws.binaryType = "arraybuffer";
      this.ws.onopen = () => {
        const id = "wk" + Math.random().toString(36).slice(2, 12);
        this.ws.send(MqttRelay.packet(0x10, [...MqttRelay.utf("MQTT"), 4, 2, 0, MqttRelay.KEEPALIVE, ...MqttRelay.utf(id)]));
      };
      this.ws.onmessage = (event) => this.feed(new Uint8Array(event.data), topic, finish);
      this.ws.onerror = () => finish(false);
      this.ws.onclose = () => {
        const was = this.ready;
        this.ready = false;
        clearInterval(this.pinger);
        finish(false);
        if (was && !this.closed && this.onClose) this.onClose();
      };
    });
  }

  feed(chunk, topic, finish) {
    const merged = new Uint8Array(this.buffer.length + chunk.length);
    merged.set(this.buffer);
    merged.set(chunk, this.buffer.length);
    this.buffer = merged;
    while (this.buffer.length >= 2) {
      let length = 0,
        factor = 1,
        pos = 1,
        byte = 0;
      do {
        if (pos >= this.buffer.length) return;
        byte = this.buffer[pos++];
        length += (byte & 127) * factor;
        factor *= 128;
      } while (byte & 128 && pos < 5);
      if (this.buffer.length < pos + length) return;
      const head = this.buffer[0],
        body = this.buffer.slice(pos, pos + length);
      this.buffer = this.buffer.slice(pos + length);
      this.handle(head, body, topic, finish);
    }
  }

  handle(head, body, topic, finish) {
    const type = head >> 4;
    if (type === 2) {
      if (body[1] === 0) this.ws.send(MqttRelay.packet(0x82, [0, 1, ...MqttRelay.utf(topic), 0]));
      else finish(false);
    } else if (type === 9) {
      if (body[2] === 0x80) {
        finish(false);
        return;
      }
      this.ready = true;
      this.pinger = setInterval(() => this.send(MqttRelay.packet(0xc0, [])), MqttRelay.PING_MS);
      finish(true);
    } else if (type === 3) {
      const size = (body[0] << 8) | body[1],
        qos = (head >> 1) & 3,
        start = 2 + size + (qos ? 2 : 0),
        name = new TextDecoder().decode(body.slice(2, 2 + size)),
        text = new TextDecoder().decode(body.slice(start));
      this.onMessage(name, text);
    }
  }

  send(bytes) {
    if (!this.ws || this.ws.readyState !== 1) return false;
    try {
      this.ws.send(bytes);
      return true;
    } catch (error) {
      return false;
    }
  }

  publish(topic, text) {
    if (!this.ready) return false;
    return this.send(MqttRelay.packet(0x30, [...MqttRelay.utf(topic), ...new TextEncoder().encode(text)]));
  }

  close() {
    this.closed = true;
    this.ready = false;
    clearInterval(this.pinger);
    if (!this.ws) return;
    this.send(new Uint8Array([0xe0, 0]));
    this.ws.onclose = null;
    this.ws.onmessage = null;
    try {
      this.ws.close();
    } catch (error) {}
  }
}
