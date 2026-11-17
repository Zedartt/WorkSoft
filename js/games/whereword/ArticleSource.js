class ArticleSource {
  static API =
    "https://fr.wikipedia.org/w/api.php?action=query&format=json" +
    "&generator=random&grnnamespace=0&grnfilterredir=nonredirects&grnlimit=1" +
    "&prop=extracts%7Cinfo%7Cpageprops&explaintext=1&exsectionformat=wiki&inprop=url&ppprop=disambiguation";
  static TRIES = 6;
  static MIN_CHARS = 700;
  static MAX_CHARS = 2600;
  static STOP_SECTIONS = /^(notes|références|notes et références|voir aussi|liens externes|bibliographie|articles connexes|annexes|sources)/i;
  static HEADING = /^=+\s*(.*?)\s*=+$/;

  constructor() {
    this.wiki = new WikiSource(ArticleSource.API);
    this.pending = null;
  }

  next() {
    const article = this.pending || this.fetchArticle();
    this.pending = this.fetchArticle();
    return article;
  }

  async fetchArticle() {
    let error = "",
      best = null;
    for (let i = 0; i < ArticleSource.TRIES; i++) {
      try {
        const reply = await this.wiki.getBatch();
        if (reply.error) throw new Error("API : " + (reply.error.info || reply.error.code));
        const page = Object.values((reply.query && reply.query.pages) || {})[0];
        if (!page || (page.pageprops && "disambiguation" in page.pageprops)) continue;
        const blocks = ArticleSource.shape(page.extract || ""),
          length = blocks.reduce((sum, block) => sum + block.text.length, 0),
          article = { title: page.title, blocks, url: page.fullurl || null, offline: false, length };
        if (length >= ArticleSource.MIN_CHARS) return article;
        if (!best || length > best.length) best = article;
      } catch (err) {
        error = err.message;
        break;
      }
    }
    return best && best.length ? best : ArticleSource.fallback(error || "aucune page utilisable");
  }

  static fallback(error) {
    return {
      title: "Textes de secours",
      blocks: WikiSource.FALLBACK.flatMap((page) => [
        { heading: true, text: page.title },
        { heading: false, text: page.text },
      ]),
      url: null,
      offline: true,
      error,
    };
  }

  static shape(extract) {
    const blocks = [];
    let length = 0,
      heading = null;
    for (const raw of extract.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const title = line.match(ArticleSource.HEADING);
      if (title) {
        if (ArticleSource.STOP_SECTIONS.test(title[1])) break;
        heading = { heading: true, text: title[1] };
        continue;
      }
      if (heading) blocks.push(heading);
      heading = null;
      const room = ArticleSource.MAX_CHARS - length;
      const text = line.length <= room ? line : ArticleSource.cut(line, room);
      if (!text) break;
      blocks.push({ heading: false, text });
      length += text.length;
      if (length >= ArticleSource.MAX_CHARS || text !== line) break;
    }
    return blocks;
  }

  static cut(line, room) {
    const end = line.slice(0, room).search(/[.!?][^.!?]*$/);
    return end > 0 ? line.slice(0, end + 1) : "";
  }
}
