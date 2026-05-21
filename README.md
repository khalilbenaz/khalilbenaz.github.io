# khalilbenaz.github.io

CV / portfolio + blog statique, hébergé sur GitHub Pages.
**Le blog est branché sur les Issues GitHub** : pas de toolchain, pas de Markdown sur disque, pas de re-déploiement.

## Structure

| Fichier | Rôle |
|---|---|
| `index.html` | CV / portfolio |
| `blog.html` | Liste des articles (fetch en live depuis l'API GitHub) |
| `post.html` | Vue article (rendu Markdown + TOC + commentaires) |
| `styles.css` · `article.css` | Design system (light/dark, accent émeraude) |
| `shared.js` | Toggle thème / langue (FR / EN), localStorage |
| `blog.js` | Fetch + cache + helpers pour les articles |
| `post.js` | Rendu d'un article + commentaires + scroll-spy |
| `photo.jpg` | Votre photo (à déposer à la racine) |

## Comment écrire un article

1. Aller sur **github.com/khalilbenaz/khalilbenaz.github.io/issues/new**
2. Cocher le label **`blog`**
3. **Titre** = titre de l'article
4. **Corps** = contenu en Markdown
   - `## Heading 2` et `### Heading 3` apparaissent dans le sommaire
   - Drag-drop d'images directement dans l'éditeur GitHub (hébergées par GitHub)
   - Blocs ```code``` colorés automatiquement (highlight.js)
   - Tableaux, listes, blockquotes, etc. — tout ce que GitHub supporte
5. (Optionnel) Ajouter d'autres labels comme tags : `dotnet`, `fintech`, `payments`, `architecture`, `tutorial`, `ai`, `leadership`, `open-source`
6. (Optionnel) Front-matter en tête du corps pour personnaliser le chapô :
   ```
   ---
   lede: Une phrase qui s'affiche sous le titre, à la place de l'extrait auto.
   ---
   ```
7. Cliquer **Submit new issue** → l'article apparaît sur le blog dans les 5 minutes (cache).

### Brouillons

Pour cacher un article publié : ajouter le label **`draft`**.
Pour le republier : retirer `draft`.

### Modifier un article

Aller sur l'issue → bouton ✏️ à côté du titre/corps. C'est édité.
Les **commentaires** de l'issue deviennent automatiquement les commentaires de l'article.

### Cache & limite API

L'API GitHub est limitée à 60 requêtes/heure par IP (non authentifié).
On cache les réponses pendant 5 min en `sessionStorage` côté client. Largement suffisant.
Si vous voulez plus de marge, on peut passer en `static.json` pré-généré (workflow GitHub Actions optionnel).

## Lancer en local

Aucune dépendance. Servez le dossier :

```bash
python -m http.server 8000
# puis http://localhost:8000
```

Ou ouvrez `index.html` directement, mais le blog nécessite `http://` pour que l'API GitHub réponde (CORS).

## Déploiement

C'est déjà un site statique → push sur la branche `main` du repo `khalilbenaz.github.io` → GitHub Pages publie automatiquement. Aucune action à configurer.

## Fonctionnalités prêtes

**CV (`index.html`)**
- ✅ Bilingue FR / EN avec toggle (persisté localStorage)
- ✅ Light / Dark avec toggle (suit `prefers-color-scheme` par défaut)
- ✅ Hero avec photo, stats, citation
- ✅ Expériences (timeline), projets (RIVORA, MDAN, QRLIB, Mocka, Claude Skills), compétences, formation, certifs, langues, contact

**Blog (`blog.html`)**
- ✅ Liste live depuis Issues GitHub
- ✅ Recherche (`⌘K`)
- ✅ Filtres par tag (générés depuis les labels)
- ✅ Temps de lecture estimé
- ✅ Bouton "+ écrire un article" qui ouvre une nouvelle issue préremplie
- ✅ États vides / d'erreur / rate-limit gérés

**Article (`post.html?id=N`)**
- ✅ Markdown rendu (marked.js), syntax highlighting (highlight.js)
- ✅ Sommaire sticky avec scroll-spy
- ✅ Barre de progression de lecture
- ✅ Articles liés (même tag)
- ✅ Commentaires affichés inline (fetched depuis les commentaires de l'issue)
- ✅ Bouton "Commenter sur GitHub" pour réagir

## État

- ✅ `photo.jpg` déposée à la racine.
- ✅ Labels `blog` (émeraude `#059669`) et `draft` (gris) créés sur le repo.
- ✅ Site déployé sur https://khalilbenaz.github.io

## TODO

- Vérifier l'URL LinkedIn (`linkedin.com/in/khalilbenazzouz` — à confirmer).
- Activer Discussions sur le repo si vous voulez aller plus loin que les commentaires d'issues.
- (Optionnel) Workflow GitHub Actions qui pré-génère `articles.json` au push d'une issue → suppression totale de la limite API.
