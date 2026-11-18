# Worksoft — guide pour Claude Code

Site de mini-jeux statique (HTML + CSS + JavaScript, sans framework ni étape de build). L'interface est en français. Le propriétaire du projet n'est pas développeur de métier : il décrit ce qu'il veut en langage courant et teste en ouvrant `index.html`.

## Lancer et vérifier

- Ouvrir `index.html` par double-clic (protocole `file://`) ou avec Live Server. Il n'y a rien à installer ni à compiler.
- Il n'y a pas de tests automatisés. Après toute modification, ouvrir le site, lancer le jeu touché et jouer une partie ; vérifier la console (aucune erreur attendue).
- Wikopy-past appelle l'API de Wikipédia : sans réseau, le bandeau rouge « Wikipédia injoignable » et un texte de secours sont le comportement normal. Cooktou appelle TheMealDB et MyMemory : sans réseau, la pastille « Recettes en ligne injoignables » et quelques recettes de secours sont le comportement normal.

## Règles du projet (à respecter)

1. **Scripts classiques, pas de modules ES.** Le site doit fonctionner en `file://`, où `type="module"` est bloqué. Chaque fichier déclare une classe globale ; l'ordre des balises `<script>` dans `index.html` fait office d'imports. Toute nouvelle classe doit être ajoutée dans `index.html` avant celles qui l'utilisent ; `js/core/App.js` reste en dernier.
2. **Une classe par fichier**, fichier nommé comme la classe (PascalCase). Exceptions assumées : `Recipe.js` (classes `Step` et `Recipe`), `ThemeSwitch.js` (`ThemeSwitch` et `SoundSwitch`), `Dom.js` (`$` et `Store`).
3. **Pas de commentaires dans le code.** Le code doit se lire seul ; la documentation vit dans ce fichier.
4. **Programmation orientée objet** : état dans des champs d'instance, réglages dans des champs `static` en MAJUSCULES, pas de variables globales en dehors de `$`, `Store`, `Sfx` et `app`.
5. **Aucune dépendance externe** hormis `js/vendor/matter.min.js` (Matter.js 0.20.0, licence MIT, l'en-tête de licence doit rester). Pas de CDN, pas de npm à l'exécution.
6. **Textes de l'interface en français**, tutoiement.
7. **Classes CSS préfixées par jeu** (`ck-` Cooktou, `plk-` Kaplab, `ink-` Incscape, `wh-` WordHunt, `ww-` WhereWord). Une classe générique a déjà provoqué une collision (`.hint` de Wikopy contre un repère de Cooktou).
8. **Thème clair/sombre** : n'utiliser que les variables CSS de `css/base.css` (`--bg`, `--panel`, `--ink`, `--muted`, `--line`, `--accent`, `--bad`…) pour tout ce qui doit changer avec le thème. Le thème est porté par `data-theme` sur `<html>`.
9. **En-tête identique pour tous les jeux** : `.game-top` (bouton « ← Menu », titre centré) puis `.game-bar` (bande de hauteur fixe pour ce qui est propre au jeu, boutons `.icon-btn`).

## Arborescence

```
index.html                     structure des écrans (menu, lancement, une <section class="screen"> par jeu) et ordre de chargement
css/
  base.css                     variables, thèmes, boutons de thème et de son, animations communes
  components.css               en-tête de jeu, bande de jeu, boutons, carte de résultat, pastilles
  menu.css                     grille des chaînes, horloge, écran de lancement, fondu
  wikopy.css  kaplab.css  incscape.css  cooktou.css  wordhunt.css  whereword.css
js/
  core/
    Dom.js                     $(id) et Store (lecture/écriture localStorage protégée)
    Viewport.js                cale les écrans sur la zone réellement visible (clavier iPhone) via --app-height et --app-top
    SoundEngine.js             sons synthétisés (Web Audio) ; instance globale Sfx
    Game.js                    classe de base des jeux : id, name, tag, art, open(), close()
    ThemeSwitch.js             bascule de thème et bouton de son
    Launcher.js                grille du menu, zoom de lancement, fondu, retour au menu, horloge
    App.js                     crée les jeux et le Launcher ; instance globale app
  games/
    wikopy/    TextRules.js (nettoyage et comparaison de texte), WikiSource.js (API Wikipédia, réutilisée par WhereWord), WikopyGame.js
    kaplab/    KaplabGame.js
    incscape/  Geometry.js (formes fermées), IncscapeGame.js
    cooktou/
      data/    Catalog.js (dictionnaire des ingrédients anglais → français, placards, gestes, postes, outils, boissons), Recipe.js (Step, Recipe),
               RecipeSource.js (recettes en ligne TheMealDB + traduction), RecipeWriter.js (transforme une vraie recette en étapes jouables), OfflineRecipes.js (secours hors ligne)
      art/     Icons.js (dessins SVG 48×48, outils, verre, photos), Avatar.js (cuisiniers et clients)
      Order.js                 menu d'un client (entrée, plat(s), dessert, boisson), points
      KitchenView.js           construction de la cuisine, placards, affichage des postes, plateau, machine, caméra
      KitchenGuide.js          bandeau d'aide, bulles ①/②, flèche, barres de progression
      PointerController.js     glisser-déposer et tous les gestes (verser, secouer, casser, râper, presser, couper, éplucher, étaler, retourner, façonner)
      ServiceHistory.js        historique des plats servis pendant la session, ticket de caisse
      CooktouGame.js           état de la partie, règles, difficulté, boucle
    wordhunt/  WordList.js (mots, comparaison sans accents ni majuscules), FlyingWord.js (trajectoire, effets, traînée), WordHuntGame.js
    whereword/ ArticleSource.js (article Wikipédia complet découpé en blocs), HuntText.js (découpage en mots, comptage, choix du mot), WhereWordGame.js
  vendor/matter.min.js
```

## Cycle de vie d'un jeu

`App` instancie chaque jeu une seule fois au chargement. `Launcher` affiche la `<section id="{game.id}">` puis appelle `game.open()` ; au retour au menu il appelle `game.close()` et `Sfx.stopAll()`. `open()` doit (re)mesurer l'écran et démarrer la boucle ; `close()` doit arrêter `requestAnimationFrame`, les minuteries et les sons en boucle.

Mesurer les zones de jeu avec `clientWidth` / `clientHeight`, jamais `getBoundingClientRect()` dans `open()` : l'écran s'ouvre avec une animation de zoom qui fausse le rectangle.

## Écrans, zoom et mobile

- Écran de lancement : en portrait sur téléphone, les boutons sont empilés et remontés au-dessus de la barre de Safari ; le panneau prend `--app-height` (jamais `100vh`, qui passe sous la barre sur iPhone).
- Référence mobile : iPhone 16 (393 × 852 en portrait, 852 × 393 en paysage). Tester aussi un grand écran dézoomé (par exemple 2560 × 1300).
- Les boutons son et thème sont dans `.corner` (coin haut droit), avec un `z-index` (100) supérieur à tout le reste (écran de lancement `#launch` à 50, fondu `#flash` à 60) : sinon ils restent visibles mais ne reçoivent plus les clics. `--corner-w` réserve leur place à droite de `.game-top` et `.menu-top` pour que le titre ne passe jamais dessous. Sous 720 px de large, le bouton de thème n'affiche que son icône.
- Deux paliers CSS communs : `max-width: 720px` (écran étroit) et `max-height: 500px` (téléphone en paysage : en-têtes et bandes plus fins, horloge du menu masquée).
- `.screen` respecte les zones sûres de l'iPhone (`env(safe-area-inset-*)`, `viewport-fit=cover`).
- Un écran trop petit (fort zoom, fenêtre réduite) ne doit jamais couper un bouton : `.screen` défile verticalement si son contenu dépasse, les zones de jeu gardent une hauteur minimale (`.wh-sky`, `.ww-area`), et les cartes de fin (`.overlay`, `#results`) défilent à l'intérieur au lieu de déborder sur l'en-tête (carte centrée par `margin: auto`, jamais `align-items: center` seul).
- Les requêtes Wikipédia ont un délai maximum (`WikiSource.TIMEOUT`) : sans réponse, on passe à la méthode suivante puis aux textes de secours, sans rester bloqué sur « Recherche… ».
- Vérification utilisée : pour chaque écran et beaucoup de tailles (1600×900 à 320×260, zoom ×3, dézoom ×0,5), `document.elementFromPoint` au centre de chaque bouton doit renvoyer le bouton lui-même.
- Les champs de saisie font au moins 16 px de police, sinon l'iPhone zoome tout seul au focus.
- Cooktou : la cuisine est mise à l'échelle de la hauteur visible (`KitchenView.fit()`, `DESIGN_H`, bornée par `MIN_SCALE` / `MAX_SCALE`) ; la caméra reste en pixels du monde et `applyCam()` applique l'échelle. Sur téléphone (`CooktouGame.PHONE_QUERY` : écran tactile étroit ou peu haut), le jeu ne démarre pas et `.ck-desktop-only` invite à jouer sur ordinateur, choix du propriétaire.
- Kaplab : boutons pour tourner (tenus appuyés, `TURN_SPEED`, agissent sur la planchette tenue ou la dernière touchée) et bouton « Gravité en main », pour jouer au doigt.

## Performance (zoom, petites machines)

- Couleurs du thème dans un canvas : `ThemeSwitch.color("--nom")` (valeur mise en cache, vidée au changement de thème), jamais `getComputedStyle` à chaque image.
- Animations en boucle : n'animer que `transform` et `opacity` (calculés par la carte graphique). Pas d'animation infinie de `box-shadow`, `margin`, `width`, `top`… ni d'élément qui porte un `filter` (le halo est redessiné à chaque image). Pour un halo qui pulse, mettre l'ombre fixe sur un `::before` et animer son `opacity` (voir `.ck-client.ask::before`).
- Pas de transition sur `box-shadow` pour les survols répétés (tuiles du menu).
- Un SVG animé doit être aussi petit que son dessin (flèche guide de Cooktou cadrée sur la flèche, `KitchenGuide.ARROW_PAD`) : sinon toute sa surface est redessinée à chaque image.
- Dans une boucle `requestAnimationFrame`, n'écrire dans la page que quand la valeur affichée change (chrono de WhereWord) ; une barre qui se vide régulièrement est une animation CSS (`ww-drain`).
- Vérification utilisée : Chrome sans interface piloté par le protocole DevTools, trace de 3 s en bougeant la souris, en 1600×900, en zoom 300 % et en dézoom 33 %, somme des temps de rendu (raster, paint, layout, style, js).

### Ajouter un jeu

1. Créer `js/games/<nom>/<Nom>Game.js` avec `class <Nom>Game extends Game` ; appeler `super({ id, name, tag, art })` (`art` = petit SVG ou HTML affiché sur la tuile et l'écran de lancement).
2. Ajouter dans `index.html` une `<section id="<id>" class="screen">` contenant `.game-top`, `.game-bar` puis la zone de jeu, et la balise `<script>` avant `App.js`.
3. Créer `css/<nom>.css` et le lier dans `index.html`.
4. Ajouter `new <Nom>Game()` dans `App` (la grille a 12 emplacements, `Launcher.SLOTS`).
5. Jouer les sons via `Sfx.play("nom")` ; en ajouter dans `SoundEngine` (objet `sounds`) si besoin.

## Les jeux

### Wikopy-past

- `WikiSource.fetchPage()` demande 20 articles au hasard à l'API MediaWiki de fr.wikipedia.org (`origin=*`), bascule sur JSONP si `fetch` échoue, puis sur `WikiSource.FALLBACK`. Les pages utilisables sont mises en file d'attente.
- `TextRules.clean()` normalise le texte (guillemets, tirets, lettres étrangères ramenées à la lettre de base), ne garde que les premières phrases entièrement tapables (`TextRules.ALLOWED`) entre `MIN_LEN` et `MAX_LEN` caractères.
- La saisie passe par un `<input>` caché qui ne contient que le mot en cours : on ne peut pas passer au mot suivant tant qu'il n'est pas exact. Les majuscules et les accents sont facultatifs : « e », « E », « é » et « É » valent tous « É » (`TextRules.fold`, `TextRules.charOk`).
- Affichage en bande horizontale : dernier mot validé, mot en cours, mots suivants. Pendant la partie seul le chrono est visible ; mots par minute, précision et erreurs n'apparaissent qu'à la fin.

### Kaplab

- Physique Matter.js à pas fixe de 1/120 s. Zone fermée (sol, murs, plafond).
- Au démarrage : 4 planchettes en carré, puis une 5e tombe après 1 s et casse la structure (`demo`, `dropBreaker`).
- Molette ou ← → : rotation de 1° de la planchette tenue ; boutons ⟲ ⟳ de la bande : rotation continue tant qu'ils sont appuyés. Touche G ou bouton « Gravité en main » : la planchette pend au lieu de rester droite. Contour blanc sur la planchette survolée.

### Incscape

- Le joueur trace un trait ; au relâchement `Geometry.findShapes()` renvoie les formes fermées (trait refermé automatiquement si la fin est proche du début, ou boucles créées par recoupement). Tout bonhomme à l'intérieur est capturé.
- Réserve d'encre par trait (`inkMax`), difficulté croissante avec `level()`, fin de partie à `IncscapeGame.MAX_ESC` évadés.
- Choix du propriétaire : pas de traînée derrière les bonhommes, pas de tache d'apparition.

### Cooktou

- **Recettes en ligne** (`RecipeSource`) : aucune recette n'est écrite dans le code. Les recettes viennent de l'API gratuite TheMealDB (`themealdb.com`, clé de test publique `1`, environ 800 recettes de très nombreux pays, catégories Starter/Side = entrée, Dessert = dessert, le reste = plat). Une file de `QUEUE` recettes par type est préchargée ; délai maximum `TIMEOUT` ; après un échec, nouvel essai au bout de `RETRY_MS`. Le nom du plat, le pays et les ingrédients inconnus sont traduits en français par l'API MyMemory (gratuite, quota quotidien ; sans traduction, le nom anglais reste). Sans réseau : recettes de `OfflineRecipes` et pastille rouge « Recettes en ligne injoignables ». Tout texte reçu passe par `Catalog.safe()` (échappement HTML) et les liens par `Catalog.safeUrl()` avant d'être affichés.
- **De la vraie recette au jeu** (`RecipeWriter`) : chaque ingrédient anglais est reconnu par `Catalog.match()` (expressions `en` du dictionnaire ; la correspondance qui finit le plus tard dans le nom gagne, puis la plus longue, pour que « chicken stock » donne du bouillon). Un ingrédient inconnu reçoit un placard et un geste devinés (`guessStorage`, `guessGesture`) et la photo TheMealDB. Les méthodes du texte (four, friture, poêle, casserole, mixeur) choisissent les postes ; le rôle de chaque ingrédient (`Catalog.roleOf` : à couper, à éplucher, matière grasse, féculent, pâte, herbe, accompagnement…) choisit les étapes. Au plus `MAX_INGREDIENTS` ingrédients, l'eau est ignorée. Une recette dont les étapes ne passent pas `Recipe.problems()` est écartée. Le lien « Voir la vraie recette » mène à la source d'origine (ou à la page TheMealDB).
- **Modèle** : étapes créées avec `Step` : `put(ingrédient, poste, texte, geste?)`, `cut`, `peel`, `roll`, `flip`, `stir`, `shape`, `heat(poste, secondes)`, `move(de, vers)` ; `Recipe` ajoute l'étape finale `serve` (poser l'assiette sur le plateau). Postes (`Catalog.stations`) : `planche`, `bol`, `mixeur`, `assiette`, `plaque` (poêle), `casserole`, `friteuse`, `four`. Règles vérifiées par `Recipe.problems()` : on ne coupe/épluche/étale/façonne que sur la planche pleine, on ne remue que le saladier plein, on ne retourne que dans la poêle pleine, on ne cuit jamais à vide, on ne déplace jamais depuis un poste vide, tout finit dans l'assiette.
- **Menus** (`Order`) : chaque client commande un menu tiré dans `Order.MENUS` (plat seul, plat + boisson, entrée + plat, plat + plat + dessert, entrée + plat + dessert + boisson…) ; la taille maximale grandit avec les clients servis (`FIRST_SIZE`, `SIZE_STEP`). Les plats se cuisinent l'un après l'autre ; chaque assiette finie se pose sur le plateau ; les boissons se font à la machine ; le plateau complet se glisse sur le client. Points : `DISH_POINTS` par plat et `DRINK_POINTS` par boisson, augmentés selon la patience restante.
- **Boissons** : prendre un verre (pile sous la machine), le poser sous le bec, cliquer la bonne boisson (`Catalog.drinks`), attendre `CooktouGame.DRINK_T` secondes, poser le verre plein sur le plateau.
- **Gestes des ingrédients** (`Catalog.gestures`, champ `how`) : `drop` glisser, `pour` tenir au-dessus `POUR_T` s, `shake` secouer de haut en bas, `crack` taper deux fois (œufs), `grate` frotter de gauche à droite (fromages), `squeeze` faire des ronds (agrumes). Une étape peut imposer un autre geste (œufs entiers plongés dans l'eau).
- **Outils** (`Catalog.tools`) : couteau, économe (coups de haut en bas), rouleau (gauche-droite) sur la planche ; cuillère (remuer) dans le saladier ; spatule (petits coups vers le haut) dans la poêle. `shape` = cliquer plusieurs fois sur la planche (pétrir, rouler, former des boulettes).
- **Placards** : le frigo (porte à ouvrir) et un meuble à onglets (Légumes, Fruits & herbes, Épicerie, Pâtisserie, Épices & sauces). Ils montrent tous les ingrédients du dictionnaire (photos TheMealDB, dessins SVG pour les ingrédients de base) plus les ingrédients inconnus des commandes en cours, au plus `Catalog.SHELF_SIZE` par placard. Hors ligne, seuls les ingrédients dessinés restent.
- **Règles** (`CooktouGame`) : une seule commande à la fois ; chaque geste est comparé à l'étape en cours ; un mauvais geste coûte de la patience ; 3 clients perdus = fin. Patience `max(55, 180 − 9 × servis) + 5 × étapes` ; client suivant après `(max(18, 42 − 2,5 × servis) + 1,2 × étapes)` secondes environ. Le premier client attend jusqu'à `MAX_WAIT` s que les recettes en ligne arrivent.
- **Vue** : monde de `CooktouGame.WORLD_W` px, positions dans `KitchenView.LAYOUT` (four, friteuse, casserole, poêle, frigo, placards, planche, saladier, mixeur, assiette, plateau, machine) ; `pile()` dessine les aliments en tas (un `~` marque un aliment coupé, un liquide devient une flaque, un œuf cassé une flaque avec jaune, un assaisonnement ou un râpé des grains).
- **Historique** (`ServiceHistory`) : chaque menu servi est noté (heure, points, numéro de partie) pour toute la session (jusqu'au rechargement, rien en localStorage). Le bouton ticket (pastille = nombre de plats) et « Voir le ticket » en fin de partie ouvrent un ticket de caisse : pour chaque plat, son pays, les étapes faites et « Voir la vraie recette ». Ticket ouvert = jeu en pause ; Échap ou Entrée le ferme.
- **Personnages** (`Avatar.chef`) : homme roux (lettre J) ou femme aux longs cheveux rouge foncé (lettre E), choix mémorisé.

#### Améliorer la reconnaissance des ingrédients

Ajouter un mot anglais dans le champ `en` de l'ingrédient voulu (`Catalog.ingredients`), ou un nouvel ingrédient (`n`, `at`, `color`, `how` éventuel, `role` éventuel, `en`). Si la photo TheMealDB ne s'affiche pas, donner son nom exact dans `Catalog.PICTURES`.

Script de contrôle à coller dans la console après avoir lancé Cooktou (doit afficher un tableau vide) : il joue automatiquement une commande du premier client.

```js
(() => {
  const g = app.game("cooktou"), i = g.clients.findIndex(Boolean), ko = [];
  if (i < 0) return "attends un client";
  for (const item of g.clients[i].order.items) if (item.recipe && item.recipe.problems().length) ko.push([item.recipe.name, item.recipe.problems()]);
  g.takeOrder(i, null);
  let guard = 0;
  while (g.task() && guard++ < 800) {
    const t = g.task();
    if (g.busy > 0) { g.update(0.5); continue; }
    if (t.a === "put") g.doPut(t.ing, t.st, null);
    else if (t.a === "move") g.doMove(t.from, t.to, null);
    else if (t.a === "stir") g.doStir(1);
    else if (t.tool) g.doStroke(t.tool);
    else if (t.a === "shape") g.doShape();
    else if (t.a === "heat") g.doHeat(t.st, document.querySelector(`[data-drop="${t.st}"]`));
    else if (t.a === "serve") g.doPlate(null);
    else if (t.a === "drink") { if (!g.glass) g.doGlassDown(null); else if (!g.glass.drink) g.doDrink(t.drink.id, null); else g.update(0.5); if (g.glass && g.glass.fill >= CooktouGame.DRINK_T) g.doGlassToTray(null); }
    else { g.doServe(i, null); break; }
  }
  if (g.active) ko.push("commande non terminée");
  return ko;
})();
```

### WordHunt

- Des mots tirés de `WordList.WORDS` sont lancés d'un bord du ciel à l'autre en arc (`FlyingWord`). Le joueur tape un mot dans le champ du bas puis appuie sur Entrée : s'il est à l'écran, il éclate et rapporte `POINTS_PER_LETTER` points par lettre. Un mot qui sort de l'autre côté est raté ; `MAX_MISSES` (3) ratés = fin.
- `WordList.plain()` ignore accents et majuscules (`œ` = `oe`) ; si le même mot est deux fois à l'écran, c'est le plus avancé qui part. Les mots qui commencent par ce qui est tapé sont surlignés légèrement (fond arrondi couleur d'accent, `HIGHLIGHT_ALPHA`), sans changer la couleur des lettres. Une erreur ne coûte rien (le champ tremble).
- Chaque mot a une traînée arc-en-ciel ou étoile filante, et parfois un effet doux : balancement, rotation lente, tremblement, à l'envers, vague, pulsation. La part de mots avec effet passe de 20 % à 75 % en `EFFECTS_RAMP` secondes.
- Peinture du mot (`FlyingWord.PAINTS`, tirage pondéré, indépendant de l'effet) : normal, couleur fixe, deux couleurs alternées, dégradé, lueur qui pulse, fondu qui change de teinte, arc-en-ciel animé lettre par lettre. Environ 55 % des mots sont colorés. La clarté des couleurs suit le thème (`--word-lightness`).
- Bonus de points : un effet de mouvement ajoute `EFFECT_BONUS` (+50 %), chaque peinture ajoute son `bonus` (+25 % ou +50 %) ; jusqu'à ×2. Le gain affiché montre le multiplicateur (« +123 ×1,75 »).
- Difficulté (selon le temps de jeu) : écart entre deux mots de `FIRST_GAP` à `MIN_GAP` secondes, traversée de `FIRST_CROSS` à `MIN_CROSS` secondes (plus `LETTER_TIME` par lettre), nombre de mots à l'écran de 2 à 8 (+1 toutes les `MORE_EVERY` secondes).

### WhereWord

- `ArticleSource` tire une page Wikipédia au hasard avec son texte complet (via `WikiSource`, qui accepte une autre adresse d'API), s'arrête aux sections « Notes », « Références », « Voir aussi »… et garde au plus `MAX_CHARS` caractères. Une page trop courte (`MIN_CHARS`) est retirée jusqu'à `TRIES` fois ; la page suivante est préchargée pendant la partie. Sans réseau : textes de secours de `WikiSource.FALLBACK` et bandeau rouge.
- `HuntText` découpe le texte en mots cliquables (comparés sans accents ni majuscules avec `TextRules.fold`), compte chaque mot et en choisit un : au moins `MIN_LETTERS` lettres, pas un nombre, pas un mot trop courant (`COMMON`). Une fois sur deux le tirage favorise les mots fréquents, pour varier la difficulté.
- Règles (`WhereWordGame`) : `ROUND_TIME` (60 s) par page ; un clic sur n'importe quelle occurrence du mot le valide et passe à la page suivante. Valeur selon le temps (`worth()`, affichée en direct dans le badge `#wwWorth`) : `MAX_POINTS` (100) pendant les `FULL_TIME` (5) premières secondes, puis baisse régulière jusqu'à `MIN_POINTS` (10) à la fin de la minute. Le nombre d'apparitions du mot est affiché à titre d'indice mais ne change plus les points (choix du propriétaire). La barre de temps devient rouge à `LATE_TIME` secondes de la fin. Un mauvais clic ne coûte rien (le mot clignote en rouge). Temps écoulé = fin de partie : les occurrences sont surlignées, puis la carte de résultat s'affiche. Le chrono ne tourne pas pendant le chargement d'une page.
- Anti-triche, choix du propriétaire : les mots de l'article (et son titre) sont affichés par CSS (`::before { content: attr(data-t) }`), donc introuvables par la recherche du navigateur, même ouverte par son menu. Pendant la partie, `WhereWordGame.isFindKey` bloque Ctrl/Cmd+F, Ctrl/Cmd+G, F3 et la recherche rapide de Firefox (`/`, `'`), et la touche Échap ne fait rien (écouteur en phase de capture sur `window`).

## Sons

`SoundEngine` synthétise tout avec Web Audio (oscillateurs et bruit filtré), sans fichier audio. Le contexte audio n'est créé qu'après un premier geste de l'utilisateur. `Sfx.play(nom)` pour un son ponctuel, `Sfx.loop(nom, true|false)` pour `sizzle`, `pour`, `hum`. `whoosh` accompagne le lancer d'un mot dans WordHunt. Le bouton haut-parleur coupe le son (mémorisé).

## Données mémorisées (localStorage)

`worksoft_theme`, `worksoft_mute`, `wikopy_best`, `incscape_best`, `cooktou_best`, `wordhunt_best`, `whereword_best`, `cooktou_chef`. Toujours protéger l'accès par `try/catch` ou passer par `Store`.

## Hébergement

Site statique : publier le dossier tel quel (GitHub Pages, Netlify, Cloudflare Pages, itch.io…). Aucune variable d'environnement, aucun serveur.

## Façon de travailler attendue

- Faire les changements demandés sans réécrire ce qui marche ; garder tous les jeux fonctionnels à chaque étape.
- Vérifier dans un navigateur avant d'annoncer qu'une modification fonctionne, et dire clairement ce qui n'a pas pu être vérifié.
- Expliquer les changements en français simple, sans jargon.
