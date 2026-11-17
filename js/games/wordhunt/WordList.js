class WordList {
  static WORDS = [
    "chat", "chien", "maison", "soleil", "lune", "étoile", "nuage", "pluie", "neige", "arbre",
    "fleur", "jardin", "rivière", "montagne", "forêt", "plage", "océan", "vague", "sable", "île",
    "bateau", "avion", "train", "vélo", "voiture", "route", "pont", "ville", "village", "château",
    "porte", "fenêtre", "table", "chaise", "lampe", "livre", "cahier", "crayon", "stylo", "école",
    "élève", "ami", "famille", "frère", "sœur", "enfant", "bébé", "grand", "petit", "rapide",
    "lent", "chaud", "froid", "rouge", "bleu", "vert", "jaune", "orange", "violet", "rose",
    "blanc", "noir", "gris", "doré", "argent", "pomme", "poire", "banane", "cerise", "fraise",
    "citron", "raisin", "melon", "pêche", "abricot", "carotte", "tomate", "salade", "pain", "fromage",
    "beurre", "gâteau", "biscuit", "bonbon", "chocolat", "café", "thé", "lait", "eau", "jus",
    "soupe", "pizza", "crêpe", "omelette", "musique", "guitare", "piano", "tambour", "chanson", "danse",
    "fête", "cadeau", "bougie", "ballon", "jouet", "puzzle", "dessin", "couleur", "peinture", "photo",
    "cinéma", "théâtre", "histoire", "conte", "dragon", "princesse", "chevalier", "sorcière", "fantôme", "pirate",
    "trésor", "carte", "boussole", "voyage", "valise", "billet", "tunnel", "fusée", "planète", "comète",
    "galaxie", "univers", "ciel", "orage", "éclair", "tonnerre", "vent", "brume", "glace", "flocon",
    "été", "hiver", "automne", "printemps", "matin", "midi", "soir", "nuit", "minuit", "aurore",
    "lapin", "renard", "loup", "ours", "tigre", "lion", "girafe", "zèbre", "éléphant", "singe",
    "dauphin", "baleine", "requin", "tortue", "grenouille", "papillon", "abeille", "fourmi", "oiseau", "hibou",
    "aigle", "pingouin", "koala", "panda", "cheval", "mouton", "cochon", "vache", "poule", "canard",
    "souris", "écureuil", "hérisson", "escargot", "chenille", "araignée", "méduse", "crabe", "poisson", "perroquet",
    "tête", "main", "pied", "bras", "jambe", "cœur", "œil", "oreille", "bouche", "nez",
    "sourire", "rire", "joie", "calme", "courage", "rêve", "espoir", "magie", "mystère", "secret",
    "aventure", "héros", "énigme", "victoire", "défi", "record", "équipe", "match", "but", "sport",
    "football", "tennis", "natation", "course", "saut", "skate", "ski", "judo", "boxe", "golf",
    "robot", "écran", "clavier", "tablette", "internet", "message", "téléphone", "ordinateur", "console", "manette",
    "horloge", "minute", "seconde", "heure", "journée", "semaine", "année", "siècle", "futur", "passé",
    "miroir", "fauteuil", "canapé", "cuisine", "salon", "chambre", "grenier", "cave", "toit", "escalier",
    "parapluie", "chapeau", "écharpe", "manteau", "chaussure", "botte", "lunettes", "montre", "bague", "collier",
    "marteau", "échelle", "pinceau", "ciseaux", "aiguille", "bouton", "ruban", "panier", "bouteille", "verre",
    "assiette", "fourchette", "couteau", "cuillère", "casserole", "poêle", "four", "frigo", "tasse", "bol",
    "arc-en-ciel", "météore", "volcan", "désert", "cascade", "lagon", "falaise", "colline", "prairie", "jungle",
  ];

  static plain(text) {
    return text
      .toLowerCase()
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  static pick(avoid) {
    let word = WordList.WORDS[Math.floor(Math.random() * WordList.WORDS.length)];
    for (let tries = 0; avoid.has(word) && tries < 8; tries++) word = WordList.WORDS[Math.floor(Math.random() * WordList.WORDS.length)];
    return word;
  }
}
