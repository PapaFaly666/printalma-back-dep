# Mise à jour backend – Redimensionnement automatique des images

_Date : {{date}}_

## Contexte
Le backend redimensionnait précédemment toutes les images reçues à **500 × 500 px** avec un recadrage forcé, ce qui entraînait :
1. Une déformation ou un crop indésirable des visuels.
2. Un décalage des délimitations (bounds) stockées en pourcentage.

## Nouveau comportement (à partir du commit _« resize-500-ratio »_)
| Ancien | Nouveau |
|--------|---------|
| 500 × 500 (crop) | 500 × _hauteur proportionnelle_ |
| Crop & fill | AUCUN crop / fill |
| Qualité auto | Qualité = **90 %** |
| Format inchangé | `fetch_format=auto` (JPEG / WebP selon navigateur) |

### Détails techniques
```js
// Transformation Cloudinary appliquée côté backend
{
  width: 500,        // largeur maximale
  crop: 'limit',     // conserve le ratio, pas d'agrandissement >500 px
  quality: 90,       // qualité fixe
  fetch_format: 'auto' // Cloudinary choisit JPEG ou WebP
}
```

## Impact pour le frontend
1. **Plus de déformation** : les aperçus côté front correspondent désormais à l'image enregistrée.
2. **Compression intégrée** : inutile de compresser en amont si vous livrez déjà ≤500 px de large.
3. **Upscale bloqué** : si vous envoyez une image <500 px de large, elle sera conservée telle quelle (pas d'agrandissement).
4. Les délimitations envoyées en pourcentage restent cohérentes.

### Recommandations
- Continuer à **redimensionner en 500 px de large** côté front pour limiter la bande passante (optionnel mais recommandé).
- Vérifier la prévisualisation : elle doit maintenant correspondre pixel-perfect à l'image stockée.
- Aucun changement requis dans les appels API (`multipart/form-data` inchangé).

## Plan de déploiement
1. Backend déployé avec le nouveau commit.
2. Frontend : tester un upload (exemple : 1000×800 ➜ 500×400).
3. Valider le rendu et la position des délimitations.

## Historique
- 2025-06-17 : Implémentation du resize proportionnel.

---
Pour toute question, ping _backend @ printalma_. 