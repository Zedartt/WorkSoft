class WikiSource {
  static API =
    "https://fr.wikipedia.org/w/api.php?action=query&format=json" +
    "&generator=random&grnnamespace=0&grnfilterredir=nonredirects&grnlimit=20" +
    "&prop=extracts%7Cinfo%7Cpageprops&exintro=1&explaintext=1&exlimit=20&inprop=url&ppprop=disambiguation";
  static FALLBACK = [
    {
      title: "Machine à écrire",
      text: "La machine à écrire est un appareil mécanique qui imprime des caractères sur une feuille de papier quand on appuie sur ses touches. Elle a longtemps équipé les bureaux avant l'arrivée de l'ordinateur.",
    },
    {
      title: "Clavier AZERTY",
      text: "Le clavier AZERTY est une disposition des touches utilisée surtout en France et en Belgique. Son nom vient des six premières lettres de la rangée du haut.",
    },
    {
      title: "Encyclopédie",
      text: "Une encyclopédie est un ouvrage qui cherche à rassembler les connaissances sur de nombreux sujets. Les articles y sont classés par thème ou par ordre alphabétique.",
    },
    {
      title: "Chronomètre",
      text: "Un chronomètre est un instrument qui mesure une durée avec précision. On le déclenche au début d'une épreuve et on l'arrête à la fin pour connaître le temps écoulé.",
    },
    {
      title: "Dactylographie",
      text: "La dactylographie est l'art de taper un texte au clavier. Avec de l'entraînement, on apprend à écrire vite sans regarder ses doigts et en faisant peu de fautes.",
    },
  ];
  constructor() {
    this.queue = [];
    this.lastError = "";
  }

  jsonp(url) {
    return new Promise((resolve, reject) => {
      const cb = "wk_cb_" + Date.now() + "_" + Math.floor(Math.random() * 1e6);
      const sc = document.createElement("script");
      const done = (fn, v) => {
        clearTimeout(to);
        delete window[cb];
        sc.remove();
        fn(v);
      };
      const to = setTimeout(() => done(reject, new Error("délai dépassé")), 8000);
      window[cb] = (data) => done(resolve, data);
      sc.onerror = () => done(reject, new Error("script bloqué"));
      sc.src = url + "&callback=" + cb;
      document.head.appendChild(sc);
    });
  }

  async getBatch() {
    try {
      const r = await fetch(WikiSource.API + "&origin=*", {
        cache: "no-store",
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (e1) {
      try {
        return await this.jsonp(WikiSource.API);
      } catch (e2) {
        throw new Error("fetch : " + e1.message + " / script : " + e2.message);
      }
    }
  }

  async fetchPage() {
    this.lastError = "";
    for (let i = 0; i < 4 && !this.queue.length; i++) {
      try {
        const j = await this.getBatch();
        if (j.error) throw new Error("API : " + (j.error.info || j.error.code));
        const pages = Object.values((j.query && j.query.pages) || {});
        for (const p of pages) {
          if (p.pageprops && "disambiguation" in p.pageprops) continue;
          const text = TextRules.clean(p.extract);
          if (text.length < TextRules.MIN_LEN) continue;
          this.queue.push({
            title: p.title,
            text,
            url: p.fullurl || null,
            offline: false,
          });
        }
        this.queue.sort(() => Math.random() - 0.5);
        if (!this.queue.length) this.lastError = "aucune page utilisable sur " + pages.length;
      } catch (e) {
        this.lastError = e.message;
        break;
      }
    }
    if (this.queue.length) return this.queue.pop();
    const f = WikiSource.FALLBACK[Math.floor(Math.random() * WikiSource.FALLBACK.length)];
    return {
      title: f.title,
      text: f.text,
      url: null,
      offline: true,
      error: this.lastError,
    };
  }
}
