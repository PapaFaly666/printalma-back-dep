# 🔄 MISE À JOUR FRONTEND – Dimensions de référence des Délimitations

**Date :** 11 juin 2025  
**Version API :** 2.2  
**Modules impactés :** Délimitations (zones de personnalisation)

---

## 🗒️ Contexte
Jusqu'à présent, le frontend s'appuyait sur `naturalWidth` / `naturalHeight` (taille réelle de l'image) pour convertir les pourcentages en pixels.

Cependant :
1. Certaines pages n'ont pas accès à l'image originale (seulement une miniature).  
2. Les délimitations créées sur une image **recadrée ou compressée** peuvent dériver si l'on se base uniquement sur les dimensions réelles.

Pour garantir un rendu _pixel-perfect_, le backend stocke désormais la taille **référence** de l'image utilisée lors de la création de chaque zone.

---

## 🚀 Nouveaux champs
| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `referenceWidth` | number | oui | Largeur (en px) de l'image **référence** au moment où l'admin a dessiné la zone. |
| `referenceHeight` | number | oui | Hauteur (en px) de la même image. |

> Ces champs remplacent l'usage du préfixe `_debug.realImageSize` ou autres workarounds.

### Exemple de réponse **GET /api/delimitations/image/:imageId**
```jsonc
{
  "success": true,
  "imageId": 42,
  "naturalWidth": 2400,
  "naturalHeight": 3200,
  "delimitations": [
    {
      "id": 1,
      "x": 12.5,
      "y": 7,
      "width": 30,
      "height": 20,
      "rotation": 0,
      "name": "Zone poitrine",
      "coordinateType": "PERCENTAGE",
      "referenceWidth": 2400,
      "referenceHeight": 3200
    }
  ],
  "count": 1
}
```

### Exemple de **POST** (création)
```jsonc
{
  "productImageId": 42,
  "delimitation": {
    "x": 15,
    "y": 20,
    "width": 40,
    "height": 25,
    "name": "Zone logo",
    "coordinateType": "PERCENTAGE",
    "referenceWidth": 1200,
    "referenceHeight": 1200
  }
}
```

---

## 👩‍💻 À faire côté Front

1. **Calcul des pixels**
```ts
function toPixels(valuePct: number, ref: number, displayed: number) {
  return (valuePct / 100) * displayed * (ref / displayedImageNaturalWidth);
}

const displayedImageWidth = 400; // largeur de la miniature dans le DOM
const displayedImageHeight = 533;

const rect = delimitation; // issu de l'API
const left = (rect.x / 100) * displayedImageWidth;
const top = (rect.y / 100) * displayedImageHeight;
const width = (rect.width / 100) * displayedImageWidth;
const height = (rect.height / 100) * displayedImageHeight;
```
> Pas besoin de `referenceWidth`/`referenceHeight` **pour l'affichage courant** si vous utilisez la miniature ; ils servent surtout à : logging, exports, comparaison, ou recréation d'un canvas identique.

2. **Création / édition**  
   Envoyez **toujours** :
   * `coordinateType = "PERCENTAGE"`
   * `referenceWidth` / `referenceHeight` = taille (px) de l'image dans le _canvas_ où l'admin dessine la zone.

3. **Validation**  
   Vérifiez côté client :
   * `0 ≤ x, y, width, height ≤ 100`  
   * `x + width ≤ 100` et `y + height ≤ 100`  
   * `referenceWidth` & `referenceHeight` > 0

---

## 📌 Rétro-compatibilité
* Les anciennes zones sans dimensions de référence seront migrées par le backend lors du premier **PUT** ou via les scripts d'admin.
* Les champs `naturalWidth` / `naturalHeight` restent renvoyés pour aider les pages « preview ».

---

## 🗂️ Endpoints concernés
| Méthode | Route | Impact |
|---------|-------|--------|
| `GET` | `/api/delimitations/image/:imageId` | Les objets `delimitations[]` contiennent `referenceWidth/Height`. |
| `POST` | `/api/delimitations` | Champs obligatoires dans le body. |
| `PUT` | `/api/delimitations/:id` | Champs obligatoires si vous modifiez la zone. |

---

**En résumé :**  
Le backend stocke maintenant la taille de référence de chaque délimitation ➜ affichage garanti, même avec miniatures ou recadrages.  
Mettez à jour vos formulaires pour envoyer `referenceWidth` & `referenceHeight` et assurez-vous de rester en **PERCENTAGE**.

---

*Document généré automatiquement – 11/06/2025* 