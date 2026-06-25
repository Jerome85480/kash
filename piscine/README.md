# Piscine Avenue — Visualiseur de piscine

Outil web pour **Piscine Avenue** : importer la photo du terrain d'un client et y projeter,
de façon **photoréaliste**, une piscine coque du catalogue **Génération Piscine**, avec choix
de la couleur de coque/eau, des margelles et de la terrasse.

## Fonctionnement
- Frontend statique (`index.html`) — aucun framework.
- Catalogue : `data/models.json` (59 modèles Génération Piscine, scrapés depuis generationpiscine.com).
- Rendu IA : fonction serverless `api/render.js` qui appelle **Google Gemini 2.5 Flash Image**
  (« nano-banana »). La clé reste côté serveur.

## Déploiement (Vercel)
1. Déployer ce dossier `piscine/` comme racine du projet Vercel.
2. Définir la variable d'environnement **`GEMINI_API_KEY`** (clé Google AI Studio).
   - https://aistudio.google.com/apikey
3. C'est tout : l'app est accessible publiquement (pas de connexion requise).

## Variables d'environnement
| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Clé API Google AI Studio, avec accès au modèle `gemini-2.5-flash-image`. |

## Notes
- Les rendus sont générés par IA, à titre indicatif (non contractuels).
- Les vignettes du catalogue sont les plans techniques officiels Génération Piscine.
