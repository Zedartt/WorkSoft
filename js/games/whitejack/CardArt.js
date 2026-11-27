class CardArt {
  static face(card) {
    if (card === JackRules.HIDDEN) return "";
    if (card === JackRules.BLANK) return '<span class="wj-blank"><b>★</b><span>Carte<br />Blanche</span></span>';
    const rank = JackRules.RANKS[card % 13],
      suit = JackRules.SUITS[JackRules.suit(card)],
      court = card % 13 >= 10;
    return `<span class="wj-corner">${rank}<i>${suit}</i></span><span class="wj-pip${court ? " wj-court" : ""}">${court ? `${rank}<i>${suit}</i>` : suit}</span>`;
  }

  static make(card) {
    const el = document.createElement("div");
    el.className = "wj-card";
    el.innerHTML = '<div class="wj-card-in"><div class="wj-face"></div><div class="wj-back"><b>WJ</b></div></div>';
    CardArt.paint(el, card);
    return el;
  }

  static paint(el, card) {
    const suit = card >= 0 && card !== JackRules.BLANK ? JackRules.suit(card) : -1;
    el.classList.toggle("wj-red", suit === 1 || suit === 2);
    el.classList.toggle("wj-white", card === JackRules.BLANK);
    el.classList.toggle("wj-down", card === JackRules.HIDDEN);
    el.querySelector(".wj-face").innerHTML = CardArt.face(card);
    el.setAttribute("aria-label", card === JackRules.HIDDEN ? "Carte cachée" : JackRules.name(card));
  }
}
