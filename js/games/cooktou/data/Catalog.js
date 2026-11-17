class Catalog {
  static ingredients = {
    oeufs: { n: "Œufs", cold: 1, color: "#f5c64a" },
    lait: { n: "Lait", cold: 1, pour: "#ffffff" },
    beurre: { n: "Beurre", cold: 1, color: "#f7e08a" },
    fromage: { n: "Fromage", cold: 1, color: "#f5c84a" },
    creme: { n: "Crème", cold: 1, pour: "#fff3d6" },
    jambon: { n: "Jambon", cold: 1, color: "#f2a3a8" },
    lardons: { n: "Lardons", cold: 1, color: "#d9776e" },
    steak: { n: "Steak", cold: 1, color: "#9b3b2e" },
    boeuf: { n: "Bœuf haché", cold: 1, color: "#a8473a" },
    saumon: { n: "Saumon", cold: 1, color: "#f59a6e" },
    raclette: { n: "Raclette", cold: 1, color: "#f3d27a" },
    feuilletee: { n: "Pâte feuilletée", cold: 1, color: "#f0d6a0" },
    framboises: { n: "Framboises", cold: 1, color: "#d6305a" },
    farine: { n: "Farine", pour: "#f4ecdc" },
    sucre: { n: "Sucre", shake: "#ffffff" },
    sel: { n: "Sel & poivre", shake: "#ffffff" },
    pates: { n: "Pâtes", color: "#f3d58a" },
    pain: { n: "Pain", color: "#e7b874" },
    tomate: { n: "Tomate", color: "#e5412f" },
    oignon: { n: "Oignon", color: "#efe3d0" },
    patate: { n: "Pomme de terre", color: "#e9c97a" },
    chocolat: { n: "Chocolat noir", color: "#5a3320" },
    chocblanc: { n: "Chocolat blanc", color: "#f7efd9" },
    huile: { n: "Huile d'olive", pour: "#c9d24a" },
    pate: { n: "Pâte brisée", color: "#ecca8c" },
    maizena: { n: "Maïzena", pour: "#ffffff" },
    vanille: { n: "Vanille", color: "#3b2a1e" },
    riz: { n: "Riz", color: "#f8f5ec" },
    vinaigre: { n: "Vinaigre de riz", pour: "#f3ecd2" },
    nori: { n: "Algue nori", color: "#24402c" },
    raisins: { n: "Raisins secs", color: "#6b3a2a" },
    levure: { n: "Levure", pour: "#f4ecdc" },
    cannelle: { n: "Cannelle", shake: "#8a4b1c" },
  };
  static MIX = "mix:";
  static stations = {
    planche: { n: "Planche", le: "la planche" },
    bol: { n: "Saladier", le: "le saladier" },
    plaque: { n: "Poêle", le: "la poêle" },
    four: { n: "Four", le: "le four" },
    assiette: { n: "Assiette", le: "l'assiette" },
  };

  static tint(id) {
    const g = Catalog.ingredients[id];
    return g.color || g.pour || g.shake;
  }

  static isMix(raw) {
    return raw.startsWith(Catalog.MIX);
  }

  static parts(raw) {
    return raw.slice(Catalog.MIX.length).split(",");
  }

  static mixOf(list) {
    return Catalog.MIX + list.flatMap((raw) => (Catalog.isMix(raw) ? Catalog.parts(raw) : [raw.replace("~", "")])).join(",");
  }
}
