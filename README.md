# GP3R Tirages — Frontend

Interface React (Vite + Tailwind) qui consomme l'API backend.

## Stack

- React 18 + Vite 5
- Tailwind CSS 3
- `lucide-react` pour les icônes
- Communication HTTP avec l'API via `fetch` (JWT en `Authorization: Bearer`)

## Architecture

```
.
├── index.html
├── src/
│   ├── main.jsx           ← point d'entrée
│   ├── App.jsx            ← orchestration auth + nav
│   ├── index.css          ← directives Tailwind
│   ├── lib/
│   │   ├── api.js         ← client HTTP (fetch + JWT)
│   │   └── format.js      ← couleurs, fonts, helpers d'affichage
│   ├── components/
│   │   ├── UI.jsx         ← Btn, Input, Modal, Badge, etc.
│   │   ├── Nav.jsx
│   │   └── RaceCard.jsx
│   └── views/
│       ├── AuthScreen.jsx
│       ├── HomeView.jsx
│       ├── MyRacesView.jsx
│       ├── RaceDetailView.jsx     ← grille de numéros + animation tirage
│       ├── AdminView.jsx          ← liste des courses + modals
│       └── RaceManageModal.jsx    ← gestion d'une course
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
└── .env.example
```

## Démarrage local

```bash
npm install
cp .env.example .env
# Éditer .env : VITE_API_URL pointe sur ton backend (ex: http://localhost:3000)
npm run dev
```

L'app tourne sur `http://localhost:5173`.

> 🧠 **Note** : assure-toi que le **backend tourne** (sur le port défini dans `VITE_API_URL`) et que `ALLOWED_ORIGINS` du backend inclut `http://localhost:5173`.

## Build production

```bash
npm run build
```

Sortie dans `dist/`.

## Déploiement Vercel

1. Push sur GitHub (séparé du backend ou même repo, peu importe)
2. **Add New… → Project**
3. **Framework preset** : `Vite`
4. **Build command** : `npm run build` (auto-détecté)
5. **Output directory** : `dist` (auto-détecté)
6. **Environment Variables** : ajouter `VITE_API_URL` avec l'URL Vercel du backend
7. **Deploy**

> ⚠️ **Important** : après le déploiement, retourne dans les settings du **backend** et ajoute l'URL exacte du frontend (ex: `https://gp3r-tirages.vercel.app`) à la variable `ALLOWED_ORIGINS`. Sans ça, le navigateur bloquera les requêtes par CORS.

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de l'API backend | `https://gp3r-api.vercel.app` |

## Flux d'utilisation

1. **Premier lancement** → écran login / inscription
2. **Inscription** → le premier compte créé devient admin (côté SQL)
3. **Connexion** → le JWT est stocké dans `localStorage` (clé `gp3r_token`)
4. **Navigation** → 3 onglets : *Courses*, *Mes pigés*, *Admin* (si admin)
5. **Cliquer une course** → grille des numéros avec qui a pris quoi
6. **Participer** → confirmation → animation de tirage → numéro assigné

## Sécurité du token

Le JWT est stocké dans `localStorage`. Pour des applications avec des données plus sensibles, considère :
- Stocker le token dans un cookie `httpOnly` (nécessite des changements côté backend)
- Implémenter un refresh token avec rotation
- Ajouter une expiration côté UI (déconnexion auto après inactivité)

Pour ce projet, `localStorage` reste un choix raisonnable étant donné la nature peu sensible des données (résultats de tirage entre amis).
