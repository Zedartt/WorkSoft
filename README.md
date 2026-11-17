# Worksoft

Un site de mini-jeux dans l'esprit de neal.fun, avec un menu en grille de chaînes.

| Jeu | Principe |
| --- | --- |
| Wikopy-past | Recopier le plus vite possible l'introduction d'une page Wikipédia tirée au hasard |
| Kaplab | Bac à sable de planchettes en bois soumises à la gravité |
| Incscape | Entourer d'un trait les bonhommes d'encre avant qu'ils ne s'enfuient de la feuille |
| Cooktou | Prendre les commandes et cuisiner de vraies recettes simplifiées, geste par geste |
| WordHunt | Taper les mots lancés dans le ciel avant qu'ils ne sortent de l'écran |

## Lancer en local

Aucune installation : ouvrir `index.html` dans un navigateur (double-clic), ou utiliser l'extension Live Server de VS Code.

Wikopy-past a besoin d'Internet pour joindre Wikipédia ; sans connexion il utilise des textes de secours.

## Mettre en ligne

Le site est 100 % statique (HTML, CSS, JavaScript) : il suffit de publier le dossier tel quel, `index.html` à la racine.

- **GitHub Pages** : pousser le dossier dans un dépôt, puis activer Pages dans les réglages du dépôt.
- **Netlify** ou **Cloudflare Pages** : relier le dépôt, ou glisser-déposer le dossier ; aucune commande de build, dossier de sortie = racine.
- **itch.io** : compresser le dossier en zip et le téléverser comme jeu HTML.

## Structure

Voir `CLAUDE.md` pour l'architecture détaillée et les conventions.
