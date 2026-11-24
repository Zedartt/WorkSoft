# Worksoft — guide pour Claude Code

Site de mini-jeux statique (HTML + CSS + JavaScript, sans framework ni étape de build). L'interface est en français. Le propriétaire du projet n'est pas développeur de métier : il décrit ce qu'il veut en langage courant et teste en ouvrant `index.html`.

## Lancer et vérifier

- Ouvrir `index.html` par double-clic (protocole `file://`) ou avec Live Server. Il n'y a rien à installer ni à compiler.
- Il n'y a pas de tests automatisés. Après toute modification, ouvrir le site, lancer le jeu touché et jouer une partie ; vérifier la console (aucune erreur attendue).
- Word King se joue à deux, en ligne : pour tester seul, ouvrir le site dans deux navigateurs différents (ou deux fenêtres, chacune au premier plan), créer un salon dans l'un et le rejoindre dans l'autre. Un onglet caché derrière un autre ne fait plus avancer son jeu.
- Wikopy-past appelle l'API de Wikipédia : sans réseau, le bandeau rouge « Wikipédia injoignable » et un texte de secours sont le comportement normal. Cooktou appelle TheMealDB et MyMemory : sans réseau, la pastille « Recettes en ligne injoignables » et quelques recettes de secours sont le comportement normal.

## Règles du projet (à respecter)

1. **Scripts classiques, pas de modules ES.** Le site doit fonctionner en `file://`, où `type="module"` est bloqué. Chaque fichier déclare une classe globale ; l'ordre des balises `<script>` dans `index.html` fait office d'imports. Toute nouvelle classe doit être ajoutée dans `index.html` avant celles qui l'utilisent ; `js/core/App.js` reste en dernier.
2. **Une classe par fichier**, fichier nommé comme la classe (PascalCase). Exceptions assumées : `Recipe.js` (classes `Step` et `Recipe`), `ThemeSwitch.js` (`ThemeSwitch` et `SoundSwitch`), `Dom.js` (`$` et `Store`).
3. **Pas de commentaires dans le code.** Le code doit se lire seul ; la documentation vit dans ce fichier.
4. **Programmation orientée objet** : état dans des champs d'instance, réglages dans des champs `static` en MAJUSCULES, pas de variables globales en dehors de `$`, `Store`, `Sfx` et `app`.
5. **Aucune dépendance externe** hormis `js/vendor/matter.min.js` (Matter.js 0.20.0, licence MIT, l'en-tête de licence doit rester). Pas de CDN, pas de npm à l'exécution.
6. **Textes de l'interface en français**, tutoiement.
7. **Classes CSS préfixées par jeu** (`ck-` Cooktou, `hl-` Hooplab, `plk-` Kaplab, `ink-` Incscape, `wh-` WordHunt, `ww-` WhereWord, `hr-` Horsering, `wl-` Wheeeeel, `wk-` Word King, `fw-` FarWest ; `lobby-` pour l'écran de salon partagé des jeux en ligne). Une classe générique a déjà provoqué une collision (`.hint` de Wikopy contre un repère de Cooktou).
8. **Thème clair/sombre** : n'utiliser que les variables CSS de `css/base.css` (`--bg`, `--panel`, `--ink`, `--muted`, `--line`, `--accent`, `--bad`…) pour tout ce qui doit changer avec le thème. Le thème est porté par `data-theme` sur `<html>`.
9. **En-tête identique pour tous les jeux** : `.game-top` (bouton « ← Menu », titre centré) puis `.game-bar` (bande de hauteur fixe pour ce qui est propre au jeu, boutons `.icon-btn`).

## Arborescence

```
index.html                     structure des écrans (menu, lancement, une <section class="screen"> par jeu) et ordre de chargement
css/
  base.css                     variables, thèmes, boutons de thème et de son, animations communes
  components.css               en-tête de jeu, bande de jeu, boutons, carte de résultat, pastilles
  menu.css                     grille des chaînes, horloge, écran de lancement, fondu
  wikopy.css  kaplab.css  incscape.css  cooktou.css  wordhunt.css  whereword.css  hooplab.css  horsering.css  wheeeeel.css  wordking.css  farwest.css
js/
  core/
    Dom.js                     $(id) et Store (lecture/écriture localStorage protégée)
    Viewport.js                cale les écrans sur la zone réellement visible (clavier iPhone) via --app-height et --app-top
    SoundEngine.js             sons synthétisés (Web Audio) ; instance globale Sfx
    Game.js                    classe de base des jeux : id, name, tag, art, help, record, open(), close(), pause(), resume()
    RecordBadge.js             record du jeu dans sa bande (`.record-stat`), mis à jour à l'ouverture et à chaque carte de fin
    ReplayGuard.js             bloque 2 s les boutons et Entrée/Espace quand une carte de fin s'affiche
    MqttRelay.js               petit client MQTT sur WebSocket pour le relais des jeux en ligne
    DuelLink.js                salon en ligne à deux : code, mise en relation, liaison directe ou par relais (partagé par Word King et FarWest)
    DuelLobby.js               écran de salon (créer, rejoindre, copier le code, annuler, liaison) à partir d'un préfixe d'identifiants
    HelpPanel.js               bouton « i » de chaque jeu et fiche « Comment jouer » (le jeu est en pause tant qu'elle est ouverte)
    ThemeSwitch.js             bascule de thème et bouton de son (chacun peut piloter plusieurs boutons)
    MenuSettings.js            panneau « Paramètres » du rouage de l'accueil (son, thème)
    Launcher.js                accueil façon Wii (pages de 4×4 qui défilent, tuiles qui s'inclinent), zoom de lancement, fondu, retour au menu, horloge
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
      KitchenGuide.js          bandeau d'aide, bulles bleue (prendre) et verte (poser), flèche, barres de progression
      PointerController.js     glisser-déposer et tous les gestes (verser, secouer, casser, râper, presser, couper, éplucher, étaler, retourner, façonner)
      ServiceHistory.js        historique des plats servis pendant la session, ticket de caisse
      CooktouGame.js           état de la partie, règles, difficulté, boucle
    wordhunt/  WordList.js (mots, comparaison sans accents ni majuscules), FlyingWord.js (trajectoire, effets, traînée), WordHuntGame.js
    hooplab/   HoopCourt.js (terrain, panier, dessins du décor), HoopBall.js (ballon, rebonds, ombre et reflet), HoopNet.js (filet souple),
               HoopFx.js (lumières, particules, éclats de verre, feux d'artifice, éclairs, textes),
               HoopRules.js (points, zones, figures, combo), HoopAim.js (tir en arc), HooplabGame.js
    horsering/
      data/    HorseModels.js (tirage au hasard du nom, de la robe, des crins, des marques ; licorne rare), HorseTools.js (onglets et outils, dessins 64×64),
               CareTasks.js (problèmes possibles, placement aléatoire des taches, étapes outil + geste, tirage selon le nombre de chevaux soignés)
      art/     HorseArt.js (cheval de profil, viewBox 600×440), HoofArt.js (dessous du sabot, 300×340), SpotArt.js (boue, mousse, nœuds, mouches…),
               Cowgirl.js (Carla, la cavalière au blason « C », couleurs dans Cowgirl.LOOK)
      CareSurface.js           une zone soignable (cheval ou sabot) : coordonnées, taches, particules, cercles d'aide
      GroomPointer.js          pointeur : clic, appui long, ronds, coups vers la droite / le bas / le haut, curseur outil
      CareBook.js              liste des soins (icône de l'outil en cours, barre de progression)
      CareGuide.js             guide : outils du soin en haut, outil à prendre entouré de bleu, bulle verte sur le cheval
      RanchKit.js              boîte à outils à onglets
      HorseringGame.js         règles, repas, câlins, sabot soulevé, arrivée/départ des chevaux, fin
    whereword/ ArticleSource.js (article Wikipédia complet découpé en blocs), HuntText.js (découpage en mots, comptage, choix du mot), WhereWordGame.js
    wheeeeel/  WheelStore.js (roues enregistrées, roue par défaut), WheelPainter.js (dessin de la roue, ampoules, flèche, projecteurs),
               WheelFx.js (étincelles, explosion, ondes, confettis), WheelEditor.js (fenêtre de création et de modification), WheeeeelGame.js
    wordking/  DuelWords.js (suite de mots tirée d'une graine commune),
               DuelFx.js (étincelles, ondes, « +n »), DuelArena.js (scène, barre de duel, projecteurs, point de choc, compte à rebours, couronne), WordKingGame.js
    farwest/   FarWestScene.js (désert, saloon, mesas, cactus, nuages, poussière, boules de broussaille), Cowboy.js (cowboy dessiné, deux positions, chute, chapeau),
               WestFx.js (éclair du canon, trace de balle, fumée, étincelles, rayons, voile de victoire ou de défaite), WestHud.js (icônes : étoile, sablier, revolver, croix, crâne, chrono), FarWestGame.js
  vendor/matter.min.js
```

## Cycle de vie d'un jeu

`App` instancie chaque jeu une seule fois au chargement. `Launcher` affiche la `<section id="{game.id}">` puis appelle `game.open()` ; au retour au menu il appelle `game.close()` et `Sfx.stopAll()`. `open()` doit (re)mesurer l'écran et démarrer la boucle ; `close()` doit arrêter `requestAnimationFrame`, les minuteries et les sons en boucle.

Mesurer les zones de jeu avec `clientWidth` / `clientHeight`, jamais `getBoundingClientRect()` dans `open()` : l'écran s'ouvre avec une animation de zoom qui fausse le rectangle.

## Écrans, zoom et mobile

- Écran de lancement : en portrait sur téléphone, les boutons sont empilés et remontés au-dessus de la barre de Safari ; le panneau prend `--app-height` (jamais `100vh`, qui passe sous la barre sur iPhone).
- Référence mobile : iPhone 16 (393 × 852 en portrait, 852 × 393 en paysage). Tester aussi un grand écran dézoomé (par exemple 2560 × 1300).
- Accueil façon Wii (choix du propriétaire) : tuiles en pages de 4 × 4 (`Launcher.PER_PAGE`, au moins `Launcher.PAGES` pages) qui défilent de gauche à droite (flèches sur les côtés, points, molette, ← →, glissé du doigt) ; les pages cachées sont `inert`. Au survol, une tuile se lève et se tourne légèrement vers la souris (`Launcher.TILT_DEG`, variables `--rx` / `--ry`). Barre du bas : logo à gauche, heure et date au milieu, rouage à droite qui ouvre le panneau Paramètres (son, thème). Sur téléphone, 2 colonnes et la page défile verticalement.
- Dans les jeux, les boutons son et thème sont dans `.corner` (coin haut droit), masqué sur l'accueil (`body.on-menu`), avec un `z-index` (100) supérieur à tout le reste (écran de lancement `#launch` à 50, fondu `#flash` à 60) : sinon ils restent visibles mais ne reçoivent plus les clics. `--corner-w` réserve leur place à droite de `.game-top` pour que le titre ne passe jamais dessous. Sous 720 px de large, le bouton de thème n'affiche que son icône. Les styles sont portés par les classes `.sound-btn` et `.theme-btn` (partagées avec le panneau Paramètres).
- Curseur : main bleue « 1 » façon manette (SVG en `data:` dans `--cur-hand`, poing fermé `--cur-grab` pendant un glisser), utilisée partout à la place des curseurs flèche, main et `grab`. Seuls le trait d'Incscape (`crosshair`) et la zone de frappe de Wikopy (`text`) gardent leur curseur. Pour un nouvel élément cliquable, écrire `cursor: var(--cur-hand)`.
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

1. Créer `js/games/<nom>/<Nom>Game.js` avec `class <Nom>Game extends Game` ; appeler `super({ id, name, tag, art, help })` (`art` = petit SVG ou HTML affiché sur la tuile et l'écran de lancement ; `help` = fiche du bouton « i » : `goal` (but du jeu), `controls` (liste de paires [commande, effet]), `rules` (liste de phrases)). Si le jeu a un record mémorisé, ajouter `record: { key, unit, label?, none?, bar? }` (clé localStorage, unité affichée, libellé « Record » par défaut, texte quand il n'y a rien, `bar: false` si la bande l'affiche déjà) : il apparaît sur l'écran de lancement et dans la bande du jeu. Si la boucle n'utilise pas `this.raf`, `this.last` et `this.frame(time)`, redéfinir `pause()` (renvoie `true` si le jeu tournait) et `resume()` (voir `WikopyGame`, qui décale son chrono).
2. Ajouter dans `index.html` une `<section id="<id>" class="screen">` contenant `.game-top`, `.game-bar` puis la zone de jeu, et la balise `<script>` avant `App.js`.
3. Créer `css/<nom>.css` et le lier dans `index.html`.
4. Ajouter `new <Nom>Game()` dans `App` (il prend la première case libre ; une page de 16 cases s'ajoute toute seule au-delà de 32 jeux).
5. Jouer les sons via `Sfx.play("nom")` ; en ajouter dans `SoundEngine` (objet `sounds`) si besoin.

### FarWest

- Duel de réflexes en ligne à deux (choix du propriétaire), même salon que Word King (`DuelLink("farwest")`, `DuelLobby("fw")`). Moi en bleu à gauche (chapeau clair), l'adversaire en rouge à droite (chapeau noir), sur les deux écrans.
- **À deux sur le même PC** (choix du propriétaire) : bouton « Jouer à deux sur ce PC » de l'écran de salon (`#fwLocal`, caché sur les écrans tactiles sans clavier). `local` vrai : pas de réseau, le jeu fait l'hôte (`isHost`), touche Q pour le joueur de gauche (bleu, « JOUEUR 1 ») et M pour celui de droite (rouge, « JOUEUR 2 ») (`FarWestGame.KEYS`, lettres lues avec `event.key`, donc celles écrites sur un clavier français) ; Espace et clic ne tirent pas. Une touche de clavier dessinée (`WestHud.keycap`) flotte au-dessus de chaque cowboy tant qu'il n'a pas tiré, lumineuse au signal. Les deux tirs étant mesurés sur la même horloge, le premier tir valide gagne tout de suite (pas de `GRACE`). Fin : « Joueur n gagne », pas de victoire comptée ; le meilleur réflexe des deux joueurs peut devenir le record ; revanche immédiate.
- **Manches** (choix du propriétaire) : il faut au moins `TARGET` (3) manches gagnées et `LEAD` (2) manches d'avance (`matchWinner`) ; à égalité ou avec 1 seule manche d'avance, le duel continue. Chaque manche : « Manche n » (`INTRO_TIME`), puis « Attends… » avec battement de cœur (`BEAT`) pendant un délai tiré par l'hôte entre `MIN_DELAY` (1,5 s) et `MAX_DELAY` (4 s), puis signal « FEU ! » (icône revolver, flash, cloche). Tir : Espace, clic ou toucher sur la scène. Pendant une manche, Espace tire toujours, même si un bouton a gardé le focus (le focus est retiré au début de chaque manche, sinon Espace « recliquait » sur le bouton).
- **Équité** : chaque navigateur lance son propre signal et mesure son propre temps de réaction `r` (négatif = trop tôt) ; il l'envoie (`shot`). L'hôte arbitre (`judge`) : un tir trop tôt perd la manche tout de suite ; deux tirs valides, le plus petit `r` gagne ; un seul tir valide, on attend `GRACE` (0,5 s) l'autre puis il gagne ; personne en `NO_SHOT` s ou deux trop tôt reçus ensemble = manche rejouée. Verdict `result` envoyé à l'invité ; les deux comptent les manches de la même façon et affichent la fin du match. Revanche quand les deux ont cliqué (ou Entrée).
- **Cowboys** (`Cowboy`) : dessin en unités (hauteur 100), deux positions (bras le long du corps revolver vers le sol, bras tendu vers l'adversaire), passage animé (`DRAW_SPEED`), bras en volumes arrondis (`capsule` : manche, coude, revers `cuff`, gant `glove`, épaulette de gilet), recul au tir, main qui tremble pendant l'attente, chute en arrière (`FALL_TIME`), yeux en croix, chapeau qui s'envole.
- **Décor** (`FarWestScene`, choix du propriétaire) : ciel, soleil (jour) ou lune et étoiles (nuit), mesas, saloon avec enseigne, porche et portes battantes (fenêtres éclairées la nuit), cactus, sol de sable, tous dessinés une fois dans un canvas caché ; nuages, poussière (devant, `drawFront`) et boules de broussaille qui roulent et rebondissent derrière les cowboys (`drawMiddle`, choix du propriétaire) (toutes les `TUMBLE_MIN` à `TUMBLE_MAX` s, son de vent). Couleurs dans les variables `--fw-*` de `css/farwest.css` (jour en thème clair, nuit en thème sombre).
- **Effets** (`WestFx`) : au tir, éclair au bout du canon, trace de balle, étincelles, fumée, flash de l'écran et secousse ; touché, gerbe d'étincelles ; manche gagnée, rayon de lumière sur le gagnant et étoile de shérif avec son temps au-dessus de sa tête ; trop tôt, croix rouge « Trop tôt » ; match gagné, pluie d'étoiles et rayons dorés ; match perdu, voile rouge sombre.
- **Affichage** (`WestHud`, choix du propriétaire : icônes plutôt que texte) : en haut, « TOI » et « ADVERSAIRE » avec leurs étoiles de shérif alignées de gauche à droite, affichées tout le long (choix du propriétaire) : une pleine par manche gagnée, puis une vide par manche encore nécessaire pour gagner (`need` : au moins `TARGET`, et `LEAD` d'avance sur l'autre) ; au-delà de `MAX_STARS` étoiles, les pleines se regroupent et la dernière pleine, plus grosse, affiche le total, les vides restent après, « MANCHE n » au centre ; au milieu, un message court avec son icône sur un bandeau sombre.
- Record : meilleur temps de réaction en ms (`farwest_best`, « Réflexe » dans la bande) ; victoires dans `farwest_wins`.

## Records et fin de partie

- Écran de lancement : sous la description, pastille « Record : 1 234 points » (`Game.recordText()`), ou « Pas encore de record ». Jeux concernés : Wikopy-past (mots/min), Incscape (capturés), Cooktou, WordHunt, WhereWord (points), Hooplab (meilleur combo, déjà dans sa bande), Word King (victoires, déjà dans sa bande), FarWest (meilleur réflexe en ms, « Réflexe » dans la bande grâce à `short`). Kaplab, Horsering et Wheeeeel n'ont pas de record.
- Toute carte de fin porte l'attribut `data-end` (`#results`, `#inkOver`, `#ckOver`, `#whOver`, `#wwOver`, `#hrCard`, `#wlResult`, `#wkOver`, `#fwOver`). Quand elle s'affiche, `ReplayGuard` bloque pendant `LOCK_MS` (2 s) les clics sur ses boutons et les touches Entrée et Espace (écouteurs en capture sur `window`, créés avant ceux des jeux), et une fine barre se remplit au-dessus des boutons (`.end-lock`) : choix du propriétaire, pour ne pas relancer sans le vouloir. Une nouvelle carte de fin doit porter `data-end`.

## Aide « i »

`HelpPanel` ajoute un bouton « i » juste à droite de « ← Menu » dans l'en-tête de chaque jeu (même place partout) et ouvre la fiche « Comment jouer » écrite dans le champ `help` du jeu. Pendant que la fiche est ouverte : le jeu est en pause (`game.pause()` / `game.resume()`), toutes ses animations CSS sont figées (classe `.game-paused` sur la section), Échap ou Entrée ferment la fiche sans atteindre le jeu (écouteur en capture sur `window`). Quand une commande ou une règle change dans un jeu, mettre sa fiche à jour.

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

### Hooplab

- Bac à sable de basket dessiné dans un canvas. Toutes les mesures sont en unités de terrain : la hauteur du canvas vaut 100 unités (`scale` = pixels par unité), la largeur dépend de l'écran. Physique maison (pas Matter.js) en `SUBSTEPS` sous-pas par image : gravité, rebonds sur le sol, les murs, la planche, le poteau et les deux bords du cercle (`HoopBall.hitPoint`, `hitBox`, `reflect`).
- Boutons « Panier à gauche / à droite » (`data-hl-side`) : le terrain est recalculé (`HoopCourt.layout`) et le ballon replacé de l'autre côté.
- Souris : on attrape le ballon jusqu'à `GRAB_SLACK` fois son rayon autour de lui, ou de l'une de ses `GRAB_TRAIL` dernières positions (ballon rapide). Glisser le ballon le tient (il suit le pointeur par un ressort, `HOLD_PULL`, vitesse bornée par `MAX_SPEED`) et le lâcher le lance avec sa vitesse. Un clic gauche sur le ballon sans le bouger (moins de `DRAG_PX`) ne fait rien. Le clic droit, n'importe où sur le terrain (`KICK_BUTTON`), fait rebondir le ballon : `IMPULSE` vers le haut sans toucher à sa vitesse horizontale ni à sa montée ; une seule fois, puis il faut que le ballon touche le sol pour pouvoir recommencer (`kickReady`).
- Tir en arc (`HoopAim`) : seulement après un vrai lancer à la souris, une fois par lancer, ballon en l'air. On appuie ailleurs que sur le ballon et on tire en arrière comme un arc : le temps ralentit (`SLOW_MOTION`) tant que le bouton est tenu, une ligne fine et courte montre la direction ; au relâchement, la vitesse du ballon est remplacée (force selon la longueur tirée, `MAX_PULL`, `POWER`).
- Panier = le centre du ballon traverse la ligne du cercle vers le bas entre les deux bords. Calcul des points dans `HoopRules.shot()` : type (`SHOTS` : dunk, rebond chanceux, swish, planche, cercle) + bonus de zone (`HoopCourt.ZONES`, mesurée depuis l'endroit du lancer, lignes MI-DISTANCE / LOIN / TRÈS LOIN au sol) + figures : tir pur (lancé sans tir en arc, `PURE_BONUS`), jongle (chaque rebond au clic droit, `KICK_BONUS`), tir en arc, combo total (lancer + jongle + arc, `TOTAL_BONUS`). Le tout est multiplié selon le combo (`MULTIPLIERS`, ×4 au maximum à partir de 6).
- Combo : chaque panier marqué moins de `COMBO_TIME` (20 s) après le précédent augmente le combo (barre qui se vide dans la bande, animation CSS `hl-drain`). Un raté ne casse pas le combo, seul le temps écoulé l'arrête. Record = meilleur combo.
- Effets (`HoopFx`) : texte lumineux, onde de choc, étincelles, projecteurs braqués sur le panier ; swish = rayons dorés et paillettes ; planche = contour de la vitre qui clignote en couleurs ; dunk = vitre qui éclate (`BROKEN_TIME`, la planche ne bloque plus pendant ce temps), flash blanc, secousse. Zones : mi-distance = canons à confettis, loin = feux d'artifice, très loin = grands feux d'artifice, rayons et flash doré. Figures : tir pur = halo blanc, jongle = bulles de lumière, tir en arc = la trajectoire s'allume, combo total = anneaux arc-en-ciel. Combo (`HoopFx.STREAKS`) : DOUBLE PANIER, TRIPLE (flammes, ballon en feu dès 3), QUADRUPLE (éclairs), QUINTUPLE (pluie de météores), MONSTRUEUX à 6 et plus (tout à la fois, feux d'artifice, flash rouge, secousse). Les lumières utilisent le mélange additif (`lighter`) ; les particules sont limitées à `MAX_PARTICLES`.
- Le filet est une grille de points reliés (Verlet) que le ballon repousse ; il freine le ballon qui le traverse (`NET_DRAG`).
- Couleurs du décor selon le thème : variables `--hl-*` de `css/hooplab.css`, lues avec `ThemeSwitch.color`. Sons `hoop*` dans `SoundEngine` (rebond, cercle, planche, filet, foule, dunk, vitre, feux d'artifice, arc, tonnerre, montée de combo, bulles).

### Horsering

- Chaque cheval est tiré au hasard (`HorseModels.next()`) : nom, robe (`COATS`, ou couleurs fantaisie `FANCY_COATS` dans `FANCY_CHANCE` des cas), crins, liste/étoile, balzanes, fanons, motif (pommelé, taches, pie, raie de mulet), crinière longue. Les teintes d'ombre, de sabot et de bout du nez sont calculées (`HorseArt.darken`). Robes imposées par le propriétaire (`HorseModels.FIXED`) : Scotty aubère (motif `roan`), Fuego gris pommelé aux jambes gris foncé (`sockColor`). Licorne rare (`UNICORN_CHANCE`) : robe pastel, crins arc-en-ciel, corne, étoiles qui scintillent, points ×`UNICORN_FACTOR`.
- Problèmes tirés par `CareTasks.build()` : de `FIRST_COUNT` à `MAX_COUNT` (+1 tous les `MORE_EVERY` chevaux), puis toujours `shine` (lustrant) et `ribbon` (ruban), verrouillés tant que le reste n'est pas fini.
- Saletés aléatoires : chaque point est placé au hasard dans des zones du cheval (`HorseArt.ZONES` : corps, ventre, croupe, encolure, tête, jambes ; `HoofArt.ZONES` pour la sole), le long d'une ligne (crinière, queue) ou parmi des places fixes (`spots` : œil, bouche, clous). Nombre (`count`) et taille (`r`, plutôt petits, parfois gros) tirés au hasard. `SpotArt.outline()` dessine un contour irrégulier à partir de la graine du point (même forme d'une étape à l'autre), avec éclaboussures et teintes de boue variées. Une grosse tache demande un peu plus de travail (`CareTasks.need`).
- Étapes `{ tool, motion, need, short }` ; chaque point avance seul. Gestes (`GroomPointer`) : `circle`, `right` (vers la queue), `down`, `up` (cure-pied du talon vers la pince), `rub`, `hold` (appui long), `tap`, `feed` (clic sur la bouche, `HorseringGame.MOUTH`).
- Guide façon Cooktou (`CareGuide`) : en haut de l'enclos, les outils du soin en cours dans l'ordre (fait / en cours / à venir) et le nom de l'outil, sans explication du geste. Tant que l'outil n'est pas en main, son bouton (ou son onglet s'il est caché) est entouré de bleu ; une fois l'outil en main, une bulle verte « Ici » / « Sa bouche » / « Ce sabot » montre où l'utiliser (cachée pendant l'appui). Quand l'étape change, l'onglet de la boîte à outils bascule tout seul. Le guide suit le soin choisi dans la liste, sinon le premier soin en cours. Pas de pastilles numérotées (① ②) dans les guides de Cooktou et de Horsering : choix du propriétaire.
- Pas de jeu sur un écran trop petit (`HorseringGame.SMALL_QUERY` : moins de 721 px de large, moins de 360 px de haut, ou téléphone en portrait, ce qui couvre aussi un fort zoom) : la carte `.hr-small` invite à tourner le téléphone ou à dézoomer, le jeu est en pause et reprend tout seul quand la place revient. Choix du propriétaire.
- Outils (`HorseTools`, dessins 64×64 avec ombres et reflets, sans dégradé à identifiant) : tenus par leur bout utile sous le pointeur (`#hrCursorTool`), avec une ombre au sol ; ils penchent selon le mouvement (`GroomPointer.MAX_TILT`) et s'écrasent un peu à l'appui.
- Dessin du cheval (`HorseArt.muscles`) : épaule, avant-bras, hanche, grasset, flanc, joue et articulations, reflets sur l'encolure et la croupe ; œil avec iris et reflets, naseau, crinière et queue à mèches.
- Interface volontairement légère : liste « Soins » = icône de l'outil en cours + nom court + barre ; bulles de la cow-girl très courtes. Mauvais outil ou mauvais geste : bulle courte et la ligne d'aide clignote.
- Points : `TASK_POINTS` par soin fini, `PERFECT_BONUS` quand le cheval est à 100 %, carte de fin avec les points gagnés. `horsering_points` (points cumulés) et `horsering_total` (chevaux soignés) sont mémorisés.
- La cavalière s'appelle Carla (`Cowgirl.NAME`, affiché au-dessus de ses bulles) : femme sans chapeau, longs cheveux lisses brun très foncé avec raie au milieu, peau mate, sourcils épais et arqués, yeux en amande couleur miel ambré (doré autour de la pupille, marron chaud, contour foncé) avec eye-liner et cils, lèvres pleines. Tenue de concours d'équitation : veste bleu marine à revers et boutons dorés, col blanc montant avec épingle dorée, blason en forme d'écu avec la lettre C sur la veste. Couleurs dans `Cowgirl.LOOK`. Choix du propriétaire.

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

### Wheeeeel

- Roue du hasard personnalisable. Les roues sont dans `WheelStore` (localStorage `wheeeeel_wheels`, roue affichée `wheeeeel_current`) : `{ id, name, cells, colors }`, `colors[i]` vaut une couleur `#rrggbb` choisie par le joueur ou `null` (couleur automatique). S'il n'y a aucune roue, la roue par défaut « Vrai ou faux ? » (`WheelStore.DEFAULT`) est recréée. Une roue a de `MIN_CELLS` (2) à `MAX_CELLS` (24) cases de texte libre (`MAX_TEXT` caractères) ; `WheelStore.tidy()` nettoie tout ce qui est lu ou enregistré, et les noms passent par `WheeeeelGame.escape()` avant d'être affichés.
- Couleurs automatiques (`WheelPainter.PALETTE`, choix du propriétaire) : d'abord les primaires rouge, bleu, jaune, vert, puis orange, violet, cyan, rose, vert clair, indigo, sarcelle, brun ; jamais deux cases voisines pareilles. Le texte d'une case claire est foncé (`WheelPainter.light`).
- Dossier « Mes roues » à gauche (`.wl-folder`) : liste des roues, roue affichée en surbrillance, « + Nouvelle roue ». Bouton dossier de la bande pour le cacher ; sous 720 px de large il est fermé par défaut, s'ouvre par-dessus la roue et se referme quand on choisit une roue ou qu'on touche la roue.
- Éditeur (`WheelEditor`) : nom, une ligne par case (pastille de couleur cliquable qui ouvre le sélecteur de couleur du navigateur, ✕ pour retirer la case), Entrée dans une case ajoute la suivante, « Supprimer la roue » demande un second clic. Échap ferme l'éditeur.
- Lancer (bouton, clic sur la roue, Espace ou Entrée) : la case gagnante est tirée au hasard d'abord (toutes les cases ont la même chance), puis la roue tourne de `MIN_TURNS` à `MAX_TURNS` tours en `SPIN_TIME` s environ, avec un petit recul au départ (`WIND_UP`) et un ralentissement doux. À l'ouverture du jeu, la roue se lance toute seule après `AUTO_DELAY` s.
- Style sobre et moderne, choix du propriétaire (pas de cadre doré ni d'ampoules de foire), avec un modèle par thème : en sombre, scène noire bleutée, cadre anthracite, flèche blanche, lumières en mélange additif (`lighter`) ; en clair, scène blanche, cadre argenté, flèche anthracite, lumières peintes par-dessus (`source-over`, cœur coloré, éclats dorés au lieu de blancs). Tout passe par les variables `--wl-*` de `css/wheeeeel.css` (cadre, LED, moyeu, flèche, ombre, `--wl-flare`, `--wl-glow`, `--wl-glow-alpha`, `--wl-core`, carte du résultat), lues par `WheelPainter.syncTheme()` à chaque changement de thème. Moyeu avec un point de la couleur sous la flèche, flèche en goutte.
- Jeu de lumière tiré au hasard à chaque lancement (`WheelPainter.newShow()`), choix du propriétaire : nombre, couleurs, vitesses, sens et balancement des projecteurs, motif des LED pendant la rotation (`chase`, `bounce`, `sparkle`, `wave`, `split`), vitesse de l'arc-en-ciel, fréquence des éclairs, forme du final (`converge` vers la flèche, `fan` en éventail, `sweep` qui tourne) et motif des LED du final (`race`, `pulse`, `alternate`).
- Lumières en trois temps, choix du propriétaire : au repos presque rien (léger halo) ; pendant la rotation c'est la folie (projecteurs de couleur qui balaient, LED arc-en-ciel en chenille, éclairs stroboscopiques, étincelles) ; à partir de `FINAL_FROM` (fin de la rotation) le jeu de lumière monte encore : projecteurs qui se regroupent selon le final tiré, LED qui clignotent, roue qui gonfle, son de montée (`wheelCharge`). À l'arrêt, `CHARGE_TIME` (court) de clignotement de la case gagnante, puis explosion : boule de lumière, cinq ondes, trois gerbes d'étincelles en traînées, éclats de roue colorés, rayons, secousse, confettis, flash de la couleur gagnante (`.wl-flash`). La carte du résultat s'affiche dans l'explosion, sans attendre. Les lumières utilisent le mélange additif (`lighter`) ; particules limitées à `WheelFx.MAX_PARTICLES`. Pas de minuterie : tout avance dans la boucle (les gerbes décalées sont dans `WheelFx.later`), donc la fiche « i » met bien tout en pause.
- Sons façon casino, choix du propriétaire : départ = levier de machine à sous, pièces et glissando de clochettes (`wheelStart`) ; pendant la rotation, musique entraînante à 168 BPM (`SoundEngine.casinoBar`, `SoundEngine.CASINO` : grosse caisse, clap, charleston, basse en octaves, accords en contretemps, clochettes au hasard, suite C–Am–F–G) jouée par demi-mesure (`WheeeeelGame.MUSIC_STEP`, programmée un peu à l'avance) et plus fournie quand la roue va vite ; au final, roulement de caisse claire qui accélère et son de montée (`wheelCharge`) ; à l'explosion, la musique est coupée net (`SoundEngine.cutMusic`, piste `bus` séparée, aussi coupée par `stopAll`) puis jackpot (`wheelWin` : fanfare, accord tenu, sonnette et cascade de pièces). Tics de bille rapides : un tic par picot du cadre (`WheeeeelGame.PINS`), quel que soit le nombre de cases, au plus un tous les `TICK_GAP` s.
- La face de la roue (cases et textes) est dessinée une seule fois dans un canvas caché et seulement tournée à chaque image. Un texte trop long passe sur deux lignes, puis se termine par « … » sur la roue (il reste entier dans le résultat).

### Word King

- Duel de frappe en ligne à deux. Bleu = moi (toujours à gauche), rouge = l'adversaire (toujours à droite), sur les deux écrans. Couleurs du duel dans `DuelArena.COLORS` (canvas) et `--wk-me` / `--wk-foe` (pages).
- **Salon** (`DuelLink`) : le site n'a pas de serveur. « Créer un salon » tire un code de `CODE_LEN` (5) caractères dans `ALPHABET` (sans I, O, 0, 1). Les deux navigateurs se retrouvent par le service gratuit ntfy.sh (`SIGNAL`, sujet `TOPIC` + code, réception en direct par `EventSource`, envoi par `fetch` avec `?cache=no` pour que rien ne reste stocké). Celui qui rejoint envoie une offre WebRTC, l'hôte répond en donnant aussi l'adresse de son relais ; un seul adversaire est accepté (les autres reçoivent « full »).
- **Deux voies en même temps**, pour jouer sur la même box comme sur deux réseaux différents (choix du propriétaire) : la liaison directe WebRTC (serveurs STUN publics dans `ICE`) et un relais MQTT public (`BROKERS` : test.mosquitto.org, broker.emqx.io, broker.hivemq.com ; l'hôte prend le premier qui répond, l'invité n'accepte qu'une adresse de cette liste). Chacun s'abonne au sujet `RELAY_TOPIC` + code + son identifiant et envoie des « hi » toutes les `HELLO_MS` jusqu'à recevoir ceux de l'autre. Le duel s'ouvre dès que l'une des deux voies marche ; les messages passent en direct quand c'est possible, sinon par le relais, et basculent tout seuls si la liaison directe tombe. La bande du jeu affiche « Liaison directe » ou « relais ». Sans aucune des deux au bout de `JOIN_MS` : « Salon introuvable » (pas de réponse) ou `MSG.blocked`. Battement toutes les `PING_MS` par la voie en cours, adversaire perdu après `LOST_MS` sans nouvelle ; « bye » envoyé au retour au menu et à la fermeture de la page.
- **Relais fiable** : les serveurs publics jettent les messages envoyés trop vite (broker.emqx.io au-delà d'environ 10 par seconde, mesuré). Sur le relais, chaque message est donc numéroté et mis en file (`queue`), envoyé par paquets au plus toutes les `FLUSH_MS` (125 ms), renvoyé toutes les `RESEND_MS` tant que l'autre n'a pas confirmé le numéro reçu (`a` = dernier numéro reçu dans l'ordre), et l'autre ne traite que le numéro suivant attendu : aucun mot, fin de duel ou revanche ne se perd, et l'ordre est respecté. La liaison directe WebRTC est déjà fiable et ordonnée.
- `MqttRelay` : MQTT 3.1.1 sur WebSocket (sous-protocole `mqtt`), écrit à la main pour rester sans dépendance : CONNECT, SUBSCRIBE, PUBLISH en QoS 0, PINGREQ toutes les `PING_MS`, découpage des paquets reçus.
- **Messages du duel** : `start` (graine des mots, envoyé par l'hôte), `type` (ce que l'adversaire est en train d'écrire, affiché en direct), `word` (mot terminé : chacun recalcule les lettres à partir de sa propre liste, rien n'est cru sur parole), `end` (verdict de l'hôte), `again` (revanche), `ping`, `bye`.
- **Règles** (`WordKingGame`) : les deux joueurs ont les mêmes mots dans le même ordre (`DuelWords`, graine commune, mots de `WordList`). Le mot part tout seul dès qu'il est parfait (accents et majuscules facultatifs, `WordList.plain`) et rapporte 1 point par lettre. Avec des fautes, Entrée le valide quand même (choix du propriétaire) : points = lettres × part du mot bien écrite (`gain`, distance d'édition `distance`), toujours moins que le maximum ; le message `word` envoie ces points (`n`), plafonnés par celui qui les reçoit. Espace, coller et glisser sont bloqués dans le champ. Une faute fait trembler le champ une fois. Affichage minimal (choix du propriétaire) : mot en cours, mot suivant en petit et plus sombre à sa droite (`.wk-after`), champ (pastille « Entrée » dès qu'on écrit), puis gain du dernier mot (« +6 · parfait » ou « +3 sur 5 »). Barre = (mes points − ses points) / `TARGET` (60) : arrivée au bout = victoire ; sinon au bout de `ROUND_TIME` (90 s) celui qui a la barre de son côté gagne, égalité possible. L'hôte est l'arbitre (`referee`) et envoie le verdict avec les scores. Compte à rebours de `COUNT_TIME` (5) s, en très grand au centre de la scène assombrie avec un anneau qui se vide, puis « DUEL ! ». Revanche quand les deux ont cliqué (ou Entrée). Victoires mémorisées.
- Pas de pause en ligne : `pause()` renvoie `false`, le duel continue derrière la fiche « i ». L'hôte ne lance le duel que quand son onglet est affiché (la boucle `requestAnimationFrame` s'arrête dans un onglet caché).
- **Lumières** (`DuelArena`, choix du propriétaire « comme un grand duel ») : scène toujours sombre (variables `--wk-stage-a` / `--wk-stage-b`, fond dessiné une fois dans un canvas caché), sol en perspective, projecteurs bleus à gauche et rouges à droite braqués sur le point de choc, barre en verre avec chevrons qui avancent vers le centre, point de choc blanc avec éclairs et étincelles permanentes. À chaque mot : onde lumineuse qui court le long de la barre depuis le bout du joueur, puis à l'arrivée gerbe d'étincelles, anneaux, flash du camp, petite secousse et coup de ressort de la barre (`SPRING`, `KICK`), « +n » lettres. Bout de barre qui pulse quand un joueur est en danger (`DANGER`). Fin : la barre se remplit de la couleur du gagnant, couronne au-dessus de son bout, feux d'artifice de son côté pendant `PARTY_TIME`, camp perdant assombri. Mélange additif (`lighter`), particules limitées à `DuelFx.MAX_PARTICLES`.
- Le salon (`DuelLink`, `DuelLobby`) est dans `js/core` : `new DuelLink(nom, événements)`, le nom du jeu sépare les salons (sujets `worksoft-<nom>-<code>` et `worksoft/<nom>/…`). Word King garde son propre écran de salon (`wk-`) ; un nouveau jeu en ligne utilise `DuelLobby` avec des identifiants `<préfixe>Lobby`, `<préfixe>LobbyCard`, `<préfixe>Create`, `<préfixe>CodeInput`, `<préfixe>Join`, `<préfixe>Code`, `<préfixe>Copy`, `<préfixe>CancelHost`, `<préfixe>JoinCode`, `<préfixe>CancelJoin`, `<préfixe>Error`, `<préfixe>RoomCode`, `<préfixe>Leave`, `<préfixe>Route` et les classes `lobby-*` de `components.css` (voir FarWest).
- Données envoyées à des services publics : à ntfy.sh seulement l'offre et la réponse de connexion (elles contiennent les adresses réseau des joueurs) ; au relais MQTT les messages du duel (mots, frappe) quand la liaison directe ne marche pas, sur un sujet qui contient le code du salon et un identifiant tiré au hasard.

## Sons

`SoundEngine` synthétise tout avec Web Audio (oscillateurs et bruit filtré), sans fichier audio. Le contexte audio n'est créé qu'après un premier geste de l'utilisateur. `Sfx.play(nom)` pour un son ponctuel, `Sfx.loop(nom, true|false)` pour `sizzle`, `pour`, `hum`. `whoosh` accompagne le lancer d'un mot dans WordHunt. Les sons `horse*` (brosses, sprays, croque, boit, hennit, sabots) servent à Horsering ; le jet d'eau réutilise la boucle `pour`. Les sons `wheel*` (départ, tic de la bille, musique de casino `wheelBar`, montée, explosion, jackpot) servent à Wheeeeel ; la musique passe par une piste séparée (`bus: true`) que `cutMusic()` coupe net. Les sons `fw*` (coup de feu, touché, cloche du signal, battement de cœur, vent, manche, trop tôt, victoire, défaite) servent à FarWest. Les sons `wk*` (frappe, faute, mot envoyé, mot adverse, compte à rebours, départ, connexion, victoire, défaite) servent à Word King. Le bouton haut-parleur coupe le son (mémorisé).

## Données mémorisées (localStorage)

`worksoft_theme`, `worksoft_mute`, `wikopy_best`, `incscape_best`, `cooktou_best`, `wordhunt_best`, `whereword_best`, `hooplab_best` (meilleur combo), `horsering_total` (chevaux soignés au total), `horsering_points` (points cumulés), `cooktou_chef`, `wheeeeel_wheels` (roues créées), `wheeeeel_current` (roue affichée), `wordking_wins` (duels gagnés), `farwest_best` (meilleur réflexe en ms), `farwest_wins` (duels gagnés). Toujours protéger l'accès par `try/catch` ou passer par `Store`.

## Hébergement

Site statique : publier le dossier tel quel (Word King n'a pas besoin de serveur non plus, il passe par ntfy.sh, une liaison directe entre navigateurs et un relais MQTT public) (GitHub Pages, Netlify, Cloudflare Pages, itch.io…). Aucune variable d'environnement, aucun serveur.

## Façon de travailler attendue

- Faire les changements demandés sans réécrire ce qui marche ; garder tous les jeux fonctionnels à chaque étape.
- Vérifier dans un navigateur avant d'annoncer qu'une modification fonctionne, et dire clairement ce qui n'a pas pu être vérifié.
- Expliquer les changements en français simple, sans jargon.
