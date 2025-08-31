## Notification Frontend — Conversion images à 1200 px (ratio conservé)

Date: {{today}}

### Qu'est-ce qui change ?
- La conversion backend des images produit génère désormais des variantes en **1200 px de large** (au lieu de 500×400).
- Le **ratio est conservé** (pas de hauteur imposée, pas de crop forcé).
- La BDD est mise à jour avec `naturalWidth = 1200` et `naturalHeight` proportionnel si les dimensions originales sont connues.

Fichier concerné côté backend: `src/services/product-image.service.ts` (méthode `convertImage`).

### Impact Frontend
- Les URLs d'image converties pointeront vers une version **plus large** (meilleure qualité visuelle sur écrans HD/retina).
- Si vous fixiez une hauteur statique basée sur 400 px, veuillez **remplacer** par un affichage **responsive** basé sur la largeur (ou conserver le ratio via CSS/attributs).
- Les champs renvoyés côté API peuvent afficher `naturalWidth = 1200` et `naturalHeight` proportionnel.

### Bonnes pratiques d'affichage
- Utiliser `max-width: 100%` et laisser le navigateur gérer la hauteur proportionnelle.
- Si nécessaire, forcer une **boîte ratio** via CSS (ex: `aspect-ratio`) ou wrapper avec un conteneur qui gère le ratio.
- Prévoir `srcset`/`sizes` si vous souhaitez offrir plusieurs résolutions (optionnel pour l'instant).

### Exemple rapide (React)
```jsx
<img
  src={image.url}
  alt={product.name}
  style={{ display: 'block', width: '100%', height: 'auto' }}
  width={image.naturalWidth || 1200}
  height={image.naturalHeight || undefined}
  loading="lazy"
/>
```

### Cache & migrations
- Les nouvelles conversions généreront des URLs Cloudinary différentes (paramètres de transformation), donc pas d'impact de cache négatif attendu.
- Les images déjà converties « 500×400 » ne sont pas modifiées rétroactivement. Si vous souhaitez homogénéiser, relancez `convertImage(productImageId)`.

### Checklist Front
- Vérifier les pages/listings qui supposaient `400px` de hauteur fixe.
- Tester les grilles/masonry pour valider l'alignement avec hauteurs variables.
- Activer `lazy-loading` et `width/height` explicites si possible pour limiter le CLS.

### Contact
Si besoin d'une variante plus légère (ex: 600 px) ou plus lourde (ex: 1500 px, 2000 px), on peut exposer des endpoints/transformations additionnels.



