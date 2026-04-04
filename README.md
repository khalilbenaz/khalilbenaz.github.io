# khalilbenaz.github.io

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen?logo=github)](https://khalilbenaz.github.io)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

CV & Blog de **Khalil Benazzouz** — Senior Software Engineer & Team Leader .NET, specialise Fintech & Payments.

**[Voir en ligne → khalilbenaz.github.io](https://khalilbenaz.github.io)**

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| **CV** | [`/`](https://khalilbenaz.github.io) | Parcours, competences, formation |
| **Blog** | [`/blog.html`](https://khalilbenaz.github.io/blog.html) | Articles et retours d'experience |
| **Admin** | [`/admin.html`](https://khalilbenaz.github.io/admin.html) | Interface privee pour publier des articles |

---

## Fonctionnalites

- **Theme light/dark** — Bascule automatique selon l'heure (6h-18h), toggle manuel, partage entre les 3 pages
- **Design editorial** — Layout single-column, timeline d'experience, skill cards par categorie
- **Responsive** — Mobile, tablette et desktop
- **Blog avec admin** — Publie des articles depuis le navigateur via l'API GitHub (zero backend)
- **Zero dependance** — HTML/CSS/JS pur, pas de framework

---

## Blog : comment publier

1. Aller sur [`/admin.html`](https://khalilbenaz.github.io/admin.html)
2. Se connecter avec un [GitHub Personal Access Token](https://github.com/settings/tokens/new?scopes=repo&description=Blog+Admin) (permission `repo`)
3. Remplir le formulaire : titre, lien LinkedIn, extrait, tags
4. Cliquer **Publier** — le fichier `posts.json` est mis a jour directement dans le repo

Le token est stocke en `sessionStorage` (efface a la fermeture du navigateur).

---

## Stack

| Techno | Usage |
|--------|-------|
| HTML5 | Structure semantique |
| CSS3 | Variables CSS, responsive, transitions |
| JavaScript | Theme auto, blog CMS, GitHub API |
| Google Fonts | Inter + JetBrains Mono |
| GitHub Pages | Hebergement |
| GitHub API | Backend du blog (commits via Content API) |

---

## Lancer en local

```bash
git clone https://github.com/khalilbenaz/khalilbenaz.github.io.git
cd khalilbenaz.github.io
python3 -m http.server 8000
# → http://localhost:8000
```

---

## Structure

```
index.html    # CV
blog.html     # Blog (public)
admin.html    # Admin blog (prive)
posts.json    # Donnees des articles
photo.jpg     # Photo de profil
```

---

## License

MIT
