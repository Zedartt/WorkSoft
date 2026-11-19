class Catalog {
  static storages = {
    frigo: { n: "Frigo", le: "le frigo" },
    legumes: { n: "Légumes", le: "le placard Légumes" },
    fruits: { n: "Fruits & herbes", le: "le placard Fruits & herbes" },
    epicerie: { n: "Épicerie", le: "le placard Épicerie" },
    patisserie: { n: "Pâtisserie", le: "le placard Pâtisserie" },
    epices: { n: "Épices & sauces", le: "le placard Épices & sauces" },
  };
  static PLACARDS = ["legumes", "fruits", "epicerie", "patisserie", "epices"];
  static SHELF_SIZE = 35;
  static IMAGE_URL = "https://www.themealdb.com/images/ingredients/";
  static PICTURES = {
    steak: "Sirloin steak",
    saucisse: "Sausages",
    crevettes: "Prawns",
    pate: "Shortcrust Pastry",
    poivron: "Red Pepper",
    pousses: "Bean Sprouts",
    piment: "Red Chilli",
    fraises: "Strawberries",
    framboises: "Raspberries",
    noixcoco: "Desiccated Coconut",
    pates: "Spaghetti",
    nouilles: "Noodles",
    lasagne: "Lasagne Sheets",
    galette: "Rice Paper Sheets",
    olives: "Black Olives",
    bouillon: "Chicken Stock",
    gelatine: "Gelatine Leafs",
    biscuits: "Digestive Biscuits",
    ketchup: "Tomato Ketchup",
    pastecurry: "Thai Green Curry Paste",
    sesame: "Sesame Seed",
  };
  static gestures = {
    drop: { mark: "Pose ici", how: "Attrape l'ingrédient et fais-le glisser jusqu'au poste." },
    pour: { mark: "Verse ici", how: "Attrape-le, tiens-le au-dessus du poste et laisse couler jusqu'au bout." },
    shake: { axis: "y", n: 4, sound: "shake", unit: "secousses", mark: "Secoue ici", how: "Attrape-le et secoue-le de haut en bas au-dessus du poste." },
    crack: { axis: "y", n: 2, sound: "crack", unit: "coups", mark: "Casse ici", how: "Tape l'œuf deux fois vers le bas au-dessus du poste pour le casser." },
    grate: { axis: "x", n: 6, sound: "grate", unit: "passages", mark: "Râpe ici", how: "Frotte de gauche à droite au-dessus du poste pour râper." },
    squeeze: { rub: 900, sound: "squeeze", unit: "%", mark: "Presse ici", how: "Fais des ronds au-dessus du poste pour presser le jus." },
  };
  static ingredients = {
    oeufs: { n: "Œufs", at: "frigo", color: "#f5c64a", how: "crack", en: "eggs?|egg yolks?|egg whites?" },
    lait: { n: "Lait", at: "frigo", color: "#ffffff", how: "pour", en: "milk|buttermilk" },
    beurre: { n: "Beurre", at: "frigo", color: "#f7e08a", role: "fat", en: "butter|ghee|lard|shortening|margarine" },
    fromage: { n: "Fromage", at: "frigo", color: "#f5c84a", how: "grate", en: "cheese|cheddar|gruy[eè]re|emmental|gouda|monterey jack|comt[eé]" },
    parmesan: { n: "Parmesan", at: "frigo", color: "#f3e3a6", how: "grate", en: "parmesan|parmigiano|pecorino|grana padano" },
    creme: { n: "Crème", at: "frigo", color: "#fff3d6", how: "pour", en: "cream|cr[eè]me fra[iî]che|sour cream|custard" },
    yaourt: { n: "Yaourt", at: "frigo", color: "#fbfbf3", how: "pour", en: "yogh?o?urt" },
    chantilly: { n: "Chantilly", at: "frigo", color: "#ffffff", how: "pour", en: "whipped cream|whipped topping" },
    jambon: { n: "Jambon", at: "frigo", color: "#f2a3a8", en: "ham|prosciutto|parma ham" },
    lardons: { n: "Lardons", at: "frigo", color: "#d9776e", en: "bacon|pancetta|lardons?" },
    chorizo: { n: "Chorizo", at: "frigo", color: "#c4442e", en: "chorizo|salami|pepperoni" },
    steak: { n: "Steak", at: "frigo", color: "#9b3b2e", en: "steaks?|sirloin|ribeye|rib eye|fillet steak|rump" },
    boeuf: { n: "Bœuf haché", at: "frigo", color: "#a8473a", en: "minced beef|ground beef|beef mince|minced meat|ground meat" },
    paleron: { n: "Bœuf", at: "frigo", color: "#a63f33", en: "beef|brisket|stewing|chuck|oxtail|veal" },
    agneau: { n: "Agneau", at: "frigo", color: "#b5574a", en: "lamb|mutton|goat" },
    poulet: { n: "Poulet", at: "frigo", color: "#f3c9a0", en: "chicken|turkey|duck" },
    porc: { n: "Porc", at: "frigo", color: "#f0b2a4", en: "pork|minced pork|ground pork|ribs" },
    saucisse: { n: "Saucisses", at: "frigo", color: "#c96a4a", en: "sausages?|frankfurters?|hot dogs?|merguez|black pudding" },
    saumon: { n: "Saumon", at: "frigo", color: "#f59a6e", en: "salmon|trout" },
    poisson: { n: "Poisson", at: "frigo", color: "#eef0f2", en: "fish|cod|haddock|tilapia|sea bass|mackerel|sardines?|monkfish|hake|white fish|anchov(y|ies)" },
    crevettes: { n: "Crevettes", at: "frigo", color: "#ff8f6b", en: "prawns?|shrimps?|king prawns|lobster|crab" },
    moules: { n: "Fruits de mer", at: "frigo", color: "#2b3242", en: "mussels|clams|squid|calamari|octopus|scallops|oysters" },
    mozzarella: { n: "Mozzarella", at: "frigo", color: "#ffffff", en: "mozzarella|burrata|halloumi|paneer|ricotta" },
    feta: { n: "Feta", at: "frigo", color: "#fbfaf2", en: "feta|goats? cheese|blue cheese|brie|camembert|stilton" },
    mascarpone: { n: "Mascarpone", at: "frigo", color: "#fffbea", en: "mascarpone|cream cheese|quark|cottage cheese" },
    tofu: { n: "Tofu", at: "frigo", color: "#f6f1df", en: "tofu" },
    feuilletee: { n: "Pâte feuilletée", at: "frigo", color: "#f0d6a0", role: "dough", en: "puff pastry|filo|phyllo" },
    pate: { n: "Pâte brisée", at: "frigo", color: "#ecca8c", role: "dough", en: "pastry|shortcrust|pie crust|pizza dough" },
    glace: { n: "Glace", at: "frigo", color: "#fff4cf", role: "side", en: "ice cream|sorbet|gelato" },
    tomate: { n: "Tomate", at: "legumes", color: "#e5412f", en: "tomato(e?s)?|cherry tomatoes" },
    oignon: { n: "Oignon", at: "legumes", color: "#efe3d0", role: "peel", en: "onions?|shallots?|challots" },
    ail: { n: "Ail", at: "legumes", color: "#f6f0e2", en: "garlic( cloves?)?" },
    patate: { n: "Pomme de terre", at: "legumes", color: "#e9c97a", role: "peel", en: "potato(e?s)?|sweet potato(es)?" },
    carotte: { n: "Carotte", at: "legumes", color: "#f08a24", role: "peel", en: "carrots?|parsnips?|turnips?|swede" },
    courgette: { n: "Courgette", at: "legumes", color: "#3f8f3a", en: "courgettes?|zucchini|squash" },
    aubergine: { n: "Aubergine", at: "legumes", color: "#5b2d6e", en: "aubergines?|egg ?plants?" },
    poivron: { n: "Poivron", at: "legumes", color: "#e23b2e", en: "(red|green|yellow|orange|bell) peppers?|capsicum" },
    concombre: { n: "Concombre", at: "legumes", color: "#4c9a45", en: "cucumbers?|gherkins?|pickles?" },
    champignons: { n: "Champignons", at: "legumes", color: "#c9b59a", en: "mushrooms?|shiitake|porcini|chestnut mushrooms" },
    avocat: { n: "Avocat", at: "legumes", color: "#9cc35a", en: "avocados?" },
    laitue: { n: "Salade verte", at: "legumes", color: "#7cc46a", en: "lettuce|rocket|arugula|kale|watercress|salad leaves|spring greens|chard" },
    potiron: { n: "Potiron", at: "legumes", color: "#f08a24", role: "peel", en: "pumpkin|butternut|butternut squash" },
    epinards: { n: "Épinards", at: "legumes", color: "#2f7a3a", en: "spinach" },
    chou: { n: "Chou", at: "legumes", color: "#a9d58f", en: "cabbage|sauerkraut|chinese leaf|cauliflower|broccoli|brussels sprouts|bok choy|pak choi" },
    betterave: { n: "Betterave", at: "legumes", color: "#9c1f4a", role: "peel", en: "beetroots?|beets?|radish(es)?" },
    haricotsverts: { n: "Haricots verts", at: "legumes", color: "#5fa84a", en: "green beans|runner beans|asparagus|okra|mangetout|edamame|broad beans" },
    poireau: { n: "Poireau", at: "legumes", color: "#9fcf6a", en: "leeks?|celery|fennel|celeriac" },
    pousses: { n: "Pousses de soja", at: "legumes", color: "#f4f1dc", en: "bean ?sprouts|beansprouts" },
    petitspois: { n: "Petits pois", at: "legumes", color: "#6fbf4a", en: "peas|petit pois|frozen peas" },
    mais: { n: "Maïs", at: "legumes", color: "#f6cf3a", en: "sweetcorn|corn on the cob|corn kernels|sweet corn" },
    piment: { n: "Piment", at: "legumes", color: "#d6261c", en: "chill?i(es)?|chiles?|jalape[nñ]os?|scotch bonnet|bird'?s eye" },
    citron: { n: "Citron", at: "fruits", color: "#f7e04a", how: "squeeze", en: "lemons?( juice)?" },
    citronvert: { n: "Citron vert", at: "fruits", color: "#8cc63f", how: "squeeze", en: "limes?( juice)?" },
    orange: { n: "Orange", at: "fruits", color: "#f7941d", how: "squeeze", en: "oranges?( juice)?|clementines?|mandarins?" },
    pomme: { n: "Pomme", at: "fruits", color: "#d93a2e", role: "peel", en: "apples?|pears?|quince" },
    banane: { n: "Banane", at: "fruits", color: "#f7d54a", role: "peel", en: "bananas?|plantains?" },
    cerises: { n: "Cerises", at: "fruits", color: "#b0122c", en: "cherr(y|ies)|plums?|apricots?|peach(es)?|nectarines?|figs?|dates|prunes" },
    mangue: { n: "Mangue", at: "fruits", color: "#f7b52c", role: "peel", en: "mangos?(es)?|pineapple|papaya|passion fruit|kiwi" },
    fraises: { n: "Fraises", at: "fruits", color: "#e5304a", en: "strawberr(y|ies)|rhubarb" },
    framboises: { n: "Fruits rouges", at: "fruits", color: "#d6305a", en: "raspberr(y|ies)|blueberr(y|ies)|blackberr(y|ies)|cranberr(y|ies)|redcurrants?|berries|grapes" },
    noixcoco: { n: "Noix de coco", at: "fruits", color: "#f6f1e6", en: "coconut|desiccated coconut|shredded coconut" },
    persil: { n: "Persil", at: "fruits", color: "#3f9a3a", role: "herb", en: "parsley" },
    coriandre: { n: "Coriandre", at: "fruits", color: "#4caf50", role: "herb", en: "coriander( leaves)?|cilantro" },
    basilic: { n: "Basilic", at: "fruits", color: "#2e8b3a", role: "herb", en: "basil( leaves)?" },
    menthe: { n: "Menthe", at: "fruits", color: "#5cc46a", role: "herb", en: "mint( leaves)?" },
    aneth: { n: "Aneth", at: "fruits", color: "#7cbf5a", role: "herb", en: "dill|tarragon|chervil" },
    ciboule: { n: "Ciboule", at: "fruits", color: "#5aa83a", role: "herb", en: "spring onions?|scallions?|chives|green onions?" },
    gingembre: { n: "Gingembre", at: "fruits", color: "#d9b26a", how: "grate", en: "ginger|galangal|lemongrass( stalks?)?" },
    pates: { n: "Pâtes", at: "epicerie", color: "#f3d58a", role: "starch", en: "pasta|spaghetti|penne|macaroni|tagliatelle|linguine|fettuccine|rigatoni|fusilli|farfalle|orzo|conchiglie|gnocchi" },
    pain: { n: "Pain", at: "epicerie", color: "#e7b874", role: "side", en: "bread|baguette|pitta?( bread)?|naan|brioche|ciabatta|buns?|rolls|toast|bagels?|english muffins?|crumpets?" },
    chapelure: { n: "Chapelure", at: "epicerie", color: "#d9a35c", how: "shake", en: "breadcrumbs|panko|bread crumbs" },
    riz: { n: "Riz", at: "epicerie", color: "#f8f5ec", role: "starch", en: "rice|basmati( rice)?|jasmine rice|arborio( rice)?|risotto rice|sushi rice|paella rice" },
    semoule: { n: "Semoule", at: "epicerie", color: "#f2dc9a", role: "starch", en: "couscous|bulgur|semolina|polenta|quinoa|oats|porridge oats" },
    nouilles: { n: "Nouilles", at: "epicerie", color: "#f2d48a", role: "starch", en: "noodles?|egg noodles|udon|ramen|soba" },
    vermicelles: { n: "Vermicelles de riz", at: "epicerie", color: "#f7f4ea", role: "starch", en: "rice noodles|vermicelli|rice sticks|glass noodles" },
    lasagne: { n: "Feuilles de lasagne", at: "epicerie", color: "#f2d48a", role: "starch", en: "lasagne sheets?|lasagna( sheets?)?|cannelloni" },
    galette: { n: "Galettes de riz", at: "epicerie", color: "#f7f1e1", en: "rice paper|spring roll wrappers?|wonton wrappers?|dumpling wrappers?" },
    galettemais: { n: "Tortillas", at: "epicerie", color: "#efd08a", role: "side", en: "tortillas?|flour tortillas?|corn tortillas?|wraps|taco shells?" },
    nachos: { n: "Chips", at: "epicerie", color: "#f2c24a", role: "side", en: "tortilla chips|nachos|crisps|chips" },
    nori: { n: "Algue nori", at: "epicerie", color: "#24402c", en: "nori|seaweed|wakame|kombu" },
    poischiches: { n: "Pois chiches", at: "epicerie", color: "#e3c48a", en: "chick ?peas|garbanzo|lentils|split peas" },
    haricots: { n: "Haricots rouges", at: "epicerie", color: "#8e2a2a", en: "kidney beans|red beans|baked beans|pinto beans|borlotti" },
    haricotsnoirs: { n: "Haricots secs", at: "epicerie", color: "#2b2326", en: "black beans|cannellini( beans)?|butter beans|white beans|haricot beans|beans" },
    thon: { n: "Thon", at: "epicerie", color: "#c9a08a", en: "tuna|tinned tuna" },
    olives: { n: "Olives", at: "epicerie", color: "#3b3b2a", en: "olives|capers" },
    coulis: { n: "Sauce tomate", at: "epicerie", color: "#c9301f", how: "pour", en: "tomato (puree|paste|sauce)|passata|chopped tomatoes|tinned tomato(e?s)?|canned tomato(e?s)?|plum tomatoes" },
    laitcoco: { n: "Lait de coco", at: "epicerie", color: "#fbfaf4", how: "pour", en: "coconut (milk|cream)" },
    bouillon: { n: "Bouillon", at: "epicerie", color: "#d9a441", how: "pour", en: "stock( cubes?)?|broth|bouillon|stock pot" },
    eau: { n: "Eau", at: "epicerie", color: "#bfe3f7", how: "pour", en: "water|ice" },
    beurrecacahuete: { n: "Beurre de cacahuète", at: "epicerie", color: "#b9773a", en: "peanut butter|almond butter" },
    farine: { n: "Farine", at: "patisserie", color: "#f4ecdc", how: "pour", en: "flour|plain flour|self-?raising flour|all.purpose flour|bread flour" },
    sucre: { n: "Sucre", at: "patisserie", color: "#ffffff", how: "shake", en: "sugar|caster sugar|icing sugar|brown sugar|muscovado|demerara|powdered sugar|granulated sugar" },
    maizena: { n: "Maïzena", at: "patisserie", color: "#ffffff", how: "pour", en: "corn ?starch|corn ?flour|arrowroot|potato starch" },
    levure: { n: "Levure", at: "patisserie", color: "#f4ecdc", how: "pour", en: "yeast|baking powder|bicarbonate( of soda)?|baking soda|cream of tartar" },
    gelatine: { n: "Gélatine", at: "patisserie", color: "#f3e7c9", en: "gelatine?|agar" },
    chocolat: { n: "Chocolat noir", at: "patisserie", color: "#5a3320", en: "chocolate|dark chocolate|milk chocolate|chocolate chips" },
    chocblanc: { n: "Chocolat blanc", at: "patisserie", color: "#f7efd9", en: "white chocolate" },
    cacao: { n: "Cacao", at: "patisserie", color: "#6b3a1e", how: "shake", en: "cocoa( powder)?|cacao" },
    vanille: { n: "Vanille", at: "patisserie", color: "#3b2a1e", en: "vanilla( extract| pod| bean| essence)?|almond extract" },
    biscuits: { n: "Biscuits", at: "patisserie", color: "#e6b25e", en: "biscuits|digestive biscuits|graham crackers|sponge fingers|ladyfingers|savoiardi|oreos?|cookies" },
    laitconcentre: { n: "Lait concentré", at: "patisserie", color: "#fbf1d6", how: "pour", en: "condensed milk|evaporated milk|dulce de leche" },
    cafe: { n: "Café", at: "patisserie", color: "#4a2a18", how: "pour", en: "coffee|espresso" },
    miel: { n: "Miel", at: "patisserie", color: "#f2a81d", how: "pour", en: "honey|jam|marmalade|golden syrup|maple syrup|treacle|molasses|agave|syrup" },
    raisins: { n: "Raisins secs", at: "patisserie", color: "#6b3a2a", en: "raisins|sultanas|currants|dried fruit|mixed peel|candied" },
    noix: { n: "Noix", at: "patisserie", color: "#b98549", en: "walnuts|pecans?|hazelnuts|almonds?|ground almonds|flaked almonds|cashews?|pine nuts|pistachios?|macadamia|nuts" },
    cacahuetes: { n: "Cacahuètes", at: "patisserie", color: "#d9a35c", en: "peanuts" },
    sel: { n: "Sel & poivre", at: "epices", color: "#ffffff", how: "shake", en: "salt|black pepper|white pepper|pepper|peppercorns?|sea salt|kosher salt" },
    huile: { n: "Huile", at: "epices", color: "#c9d24a", how: "pour", role: "fat", en: "oil|olive oil|vegetable oil|sunflower oil|rapeseed oil|groundnut oil|sesame (seed )?oil|cooking spray" },
    vinaigre: { n: "Vinaigre", at: "epices", color: "#f3ecd2", how: "pour", en: "vinegar|balsamic|mirin" },
    soja: { n: "Sauce soja", at: "epices", color: "#3a2416", how: "pour", en: "soy sauce|soya sauce|tamari|dark soy|light soy|kecap manis" },
    nuocmam: { n: "Sauce asiatique", at: "epices", color: "#b8742a", how: "pour", en: "fish sauce|oyster sauce|hoisin( sauce)?|teriyaki|black bean sauce|tamarind( paste)?|shaoxing" },
    moutarde: { n: "Moutarde", at: "epices", color: "#e8c21c", how: "pour", en: "mustard|dijon( mustard)?|english mustard" },
    ketchup: { n: "Ketchup", at: "epices", color: "#d6261c", how: "pour", en: "ketchup|tomato ketchup|barbecue sauce|bbq sauce|brown sauce" },
    mayonnaise: { n: "Mayonnaise", at: "epices", color: "#fbf3c4", how: "pour", en: "mayonnaise|mayo|salad cream|aioli" },
    saucepiment: { n: "Sauce pimentée", at: "epices", color: "#e8401c", how: "pour", en: "hot ?sauce|sriracha|tabasco|sweet chilli sauce|chilli sauce|gochujang|worcestershire( sauce)?" },
    tahini: { n: "Tahini", at: "epices", color: "#d9b47a", how: "pour", en: "tahini|sesame paste" },
    vinrouge: { n: "Vin rouge", at: "epices", color: "#7a1530", how: "pour", en: "red wine|port|beer|stout|ale|cider" },
    vinblanc: { n: "Vin blanc", at: "epices", color: "#f3e6a0", how: "pour", en: "white wine|dry white wine|sherry|brandy|rum|marsala|cognac|vodka|liqueur|kirsch|sake" },
    miso: { n: "Pâte miso", at: "epices", color: "#c98a3a", en: "miso( paste)?" },
    pastecurry: { n: "Pâte de curry", at: "epices", color: "#5f9a3a", en: "curry paste|thai (red|green|yellow) curry paste|harissa( paste)?|pesto|chipotle paste" },
    cannelle: { n: "Cannelle", at: "epices", color: "#8a4b1c", how: "shake", en: "cinnamon( sticks?)?|ground cinnamon" },
    curry: { n: "Curry", at: "epices", color: "#e0a420", how: "shake", en: "curry powder|curry leaves|madras" },
    cumin: { n: "Cumin", at: "epices", color: "#a8722a", how: "shake", en: "cumin( seeds)?|ground cumin|caraway" },
    paprika: { n: "Paprika", at: "epices", color: "#c9351c", how: "shake", en: "paprika|smoked paprika" },
    pimentpoudre: { n: "Piment en poudre", at: "epices", color: "#b8261c", how: "shake", en: "chill?i powder|chill?i flakes|red pepper flakes|cayenne( pepper)?|chipotle" },
    safran: { n: "Safran", at: "epices", color: "#f2a20c", how: "shake", en: "saffron" },
    curcuma: { n: "Curcuma", at: "epices", color: "#f2b705", how: "shake", en: "turmeric" },
    garam: { n: "Garam masala", at: "epices", color: "#8a5a2a", how: "shake", en: "garam masala|tandoori|masala" },
    epicesmix: { n: "Épices moulues", at: "epices", color: "#9a5a2a", how: "shake", en: "allspice|nutmeg|cloves?|ground coriander|coriander seeds|mixed spice|five spice|cajun|jerk|ras el hanout|baharat|za.?atar|sumac|fenugreek|star anise|mustard seeds?|garlic powder|onion powder|ground ginger|spice" },
    herbes: { n: "Herbes séchées", at: "epices", color: "#5f7a3a", how: "shake", en: "thyme|rosemary|oregano|bay leaf|bay leaves|sage|herbs|marjoram|mixed herbs|dried oregano|italian seasoning|herbes de provence|bouquet garni" },
    sesame: { n: "Sésame", at: "epices", color: "#f3e3b8", how: "shake", en: "sesame( seeds?)?|poppy seeds|chia|flax|sunflower seeds|pumpkin seeds" },
    cardamome: { n: "Cardamome", at: "epices", color: "#8fae5a", how: "shake", en: "cardamom( pods)?|saffron threads|rose ?water|orange blossom( water)?" },
  };
  static drinks = [
    { id: "eau", name: "Eau", color: "#cfeaf9" },
    { id: "cola", name: "Cola", color: "#4a2414" },
    { id: "limonade", name: "Limonade", color: "#eef3c4" },
    { id: "orange", name: "Jus d'orange", color: "#f7941d" },
    { id: "pomme", name: "Jus de pomme", color: "#f2c94c" },
    { id: "theglace", name: "Thé glacé", color: "#b5651d" },
    { id: "grenadine", name: "Grenadine", color: "#e0245e" },
    { id: "menthe", name: "Sirop de menthe", color: "#2fbf71" },
  ];
  static MIX = "mix:";
  static stations = {
    planche: { n: "Planche", le: "la planche" },
    bol: { n: "Saladier", le: "le saladier" },
    mixeur: { n: "Mixeur", le: "le mixeur", button: "Mixer", run: "Mixe le tout", sound: "hum" },
    assiette: { n: "Assiette", le: "l'assiette" },
    plaque: { n: "Poêle", le: "la poêle", button: "Feu", run: "Allume le feu et fais cuire", sound: "sizzle" },
    casserole: { n: "Casserole", le: "la casserole", button: "Feu", run: "Allume le feu et laisse mijoter", sound: "sizzle" },
    friteuse: { n: "Friteuse", le: "la friteuse", button: "Frire", run: "Fais frire jusqu'à ce que ce soit doré", sound: "sizzle" },
    four: { n: "Four", le: "le four", button: "▶ Lancer", run: "Enfourne et fais cuire", sound: "hum" },
  };
  static tools = {
    knife: { n: "Couteau", st: "planche", axis: "y", sound: "chop", mark: "Coupe ici ↕", how: "Garde le couteau en main et tape de haut en bas sur la planche." },
    peeler: { n: "Économe", st: "planche", axis: "y", sound: "peel", mark: "Épluche ici ↕", how: "Garde l'économe en main et glisse-le de haut en bas sur la planche." },
    roller: { n: "Rouleau", st: "planche", axis: "x", sound: "roll", mark: "Étale ici ↔", how: "Garde le rouleau en main et fais des allers-retours de gauche à droite sur la planche." },
    spoon: { n: "Cuillère", st: "bol", mark: "Remue ici", how: "Garde la cuillère en main et remue vite dans le saladier, dans n'importe quel sens." },
    spatula: { n: "Spatule", st: "plaque", axis: "y", up: true, sound: "flip", mark: "Retourne ici ↑", how: "Garde la spatule en main et donne des petits coups vers le haut au-dessus de la poêle." },
  };
  static patterns = Object.entries(Catalog.ingredients).map(([id, def]) => [id, new RegExp(`\\b(${def.en})\\b`, "g")]);

  static safe(text) {
    return String(text || "").replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  }

  static safeUrl(url) {
    return /^https:\/\/[^\s"'<>]+$/.test(url || "") ? url : "";
  }

  static isCustom(id) {
    return id.startsWith("x-");
  }

  static picture(id) {
    const def = Catalog.ingredients[id];
    if (def.img) return def.img;
    const name = Catalog.PICTURES[id] || def.en.split("|")[0].replace(/\([^)]*\)\?/g, "").replace(/.\?/g, "").replace(/[\\()?.\[\]]/g, "");
    return Catalog.IMAGE_URL + encodeURIComponent(name) + "-small.png";
  }

  static gestureOf(step) {
    return Catalog.gestures[step.how || Catalog.ingredients[step.ing].how || "drop"];
  }

  static roleOf(id) {
    const def = Catalog.ingredients[id];
    if (def.role) return def.role;
    if (def.how && def.how !== "drop") return def.how;
    return ["frigo", "legumes", "fruits"].includes(def.at) ? "cut" : "dry";
  }

  static match(englishName) {
    const name = englishName.toLowerCase().trim();
    let best = null;
    for (const [id, pattern] of Catalog.patterns) {
      for (const found of name.matchAll(pattern)) {
        const end = found.index + found[0].length;
        if (!best || end > best.end || (end === best.end && found[0].length > best.length)) best = { id, end, length: found[0].length };
      }
    }
    return best ? best.id : null;
  }

  static guessStorage(name) {
    if (/sauce|paste|vinegar|spice|seasoning|powder|ground|seeds?|dried|extract/.test(name)) return "epices";
    if (/sugar|chocolate|cake|biscuit|syrup|jam|marzipan|sprinkles|nuts?/.test(name)) return "patisserie";
    if (/meat|fillet|breast|thigh|mince|cheese|cream|butter|egg|fish|liver|kidney|bone/.test(name)) return "frigo";
    if (/leaves|leaf|fruit|berr|melon/.test(name)) return "fruits";
    if (/root|bulb|stalk|bean|pea|greens|marrow|vegetable/.test(name)) return "legumes";
    return "epicerie";
  }

  static guessGesture(name) {
    if (/powder|ground|flakes|seasoning|salt|spice|seeds/.test(name)) return "shake";
    if (/sauce|oil|vinegar|milk|juice|syrup|wine|water|liqueur|cream|extract|stock/.test(name)) return "pour";
    return "drop";
  }

  static register(englishName) {
    const known = Catalog.match(englishName);
    if (known) return known;
    const image = Catalog.IMAGE_URL + encodeURIComponent(englishName.trim()).replace(/'/g, "%27") + "-small.png";
    const name = englishName.toLowerCase().trim();
    const id = "x-" + name.replace(/[^a-z0-9]+/g, "-");
    if (!Catalog.ingredients[id])
      Catalog.ingredients[id] = {
        n: Catalog.safe(englishName.trim().replace(/^./, (letter) => letter.toUpperCase())),
        at: Catalog.guessStorage(name),
        how: Catalog.guessGesture(name),
        color: "#d9b47a",
        img: image,
        raw: englishName.trim(),
      };
    return id;
  }

  static tint(id) {
    return Catalog.ingredients[id].color;
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
