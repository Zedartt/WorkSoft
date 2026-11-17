class TextRules {
  static MAX_LEN = 450;
  static MIN_LEN = 100;
  static ALLOWED = /^[A-Za-z0-9àâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜ .,;:!?'"()\-%\/+&]*$/;
  static TRANSLIT = {
    ß: "ss",
    ø: "o",
    Ø: "O",
    ł: "l",
    Ł: "L",
    đ: "d",
    Đ: "D",
    ð: "d",
    þ: "th",
    ı: "i",
    "×": "x",
    "·": "-",
  };
  static clean(raw) {
    let t = (raw || "")
      .normalize("NFC")
      .replace(/[    ]/g, " ")
      .replace(/[’‘ʼ]/g, "'")
      .replace(/«\s*/g, '"')
      .replace(/\s*»/g, '"')
      .replace(/[“”„]/g, '"')
      .replace(/[–—−]/g, "-")
      .replace(/…/g, "...")
      .replace(/œ/g, "oe")
      .replace(/Œ/g, "Oe")
      .replace(/æ/g, "ae")
      .replace(/Æ/g, "Ae");
    t = [...t]
      .map((ch) => {
        if (TextRules.ALLOWED.test(ch)) return ch;
        if (TextRules.TRANSLIT[ch]) return TextRules.TRANSLIT[ch];
        const base = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return base && TextRules.ALLOWED.test(base) ? base : ch;
      })
      .join("");
    t = t.replace(/\s*\([^)]*\)/g, (m) => (TextRules.ALLOWED.test(m) ? m : ""));
    t = t
      .replace(/\s+/g, " ")
      .replace(/ ([,.])/g, "$1")
      .trim();
    const sentences = t.match(/[^.!?]+[.!?]+(?=\s|$)/g) || [t];
    let out = "";
    for (const s of sentences) {
      if (!TextRules.ALLOWED.test(s)) break;
      if (out && (out + s).length > TextRules.MAX_LEN) break;
      out += s;
    }
    out = out.trim();
    if (out.length > TextRules.MAX_LEN) out = out.slice(0, out.lastIndexOf(" ", TextRules.MAX_LEN));
    return out;
  }

  static fold(ch) {
    return ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  static charOk(typed, expected) {
    return typed === expected || TextRules.fold(typed) === TextRules.fold(expected);
  }

  static wordOk(val, word) {
    if (val.length !== word.length) return false;
    for (let i = 0; i < word.length; i++) if (!TextRules.charOk(val[i], word[i])) return false;
    return true;
  }
}
