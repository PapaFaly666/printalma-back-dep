# Guide Frontend : Gestion du Payload des Images de Couleurs pour Produit Admin (Mockup)

Ce guide explique comment construire correctement le payload des images de couleurs lors de la création ou modification d’un produit admin, pour éviter les erreurs côté backend.

---

## 1. Règles fondamentales
- **Chaque image doit avoir un champ `url` et un champ `publicId`** (identifiant Cloudinary)
- **Ne jamais envoyer d’`id` pour une nouvelle image** (seulement pour les images déjà existantes en base)
- **Ne jamais envoyer `publicId: undefined` ou omettre ce champ**
- **Le champ `publicId` n’est pas l’URL, c’est l’identifiant unique Cloudinary** (ex : `printalma/1753365501069-Mug_noir`)

---

## 2. Workflow correct pour l’upload d’une image couleur

1. **Uploader l’image** via l’endpoint dédié :
   ```js
   const { url, publicId } = await uploadColorImage(productId, colorId, file);
   ```
2. **Ajouter l’image** dans le tableau `images` de la couleur, dans le state :
   ```js
   images.push({ url, publicId, view: "Front", delimitations: [...] });
   ```
3. **Avant d’envoyer le PATCH**, vérifier que toutes les images ont bien un `publicId` défini :
   ```js
   const allImagesHavePublicId = colorVariations.every(color =>
     color.images.every(img => !!img.publicId)
   );
   if (!allImagesHavePublicId) {
     alert("Erreur : une ou plusieurs images n'ont pas de publicId !");
     return;
   }
   ```
4. **Envoyer le PATCH** `/products/:id` avec le payload complet.

---

## 3. Structure attendue pour une image dans le payload

- **Image existante (modification)** :
  ```js
  { id: 101, url: "...", publicId: "...", view: "Front", delimitations: [...] }
  ```
- **Nouvelle image (création)** :
  ```js
  { url: "...", publicId: "...", view: "Front", delimitations: [...] }
  ```

---

## 4. Erreurs fréquentes à éviter
- `publicId: undefined` ou champ manquant → **Erreur 400 côté backend**
- `id` temporaire (string, nombre trop grand, identifiant Cloudinary dans `id`) → **Erreur 400 ou INT4**
- Oublier d’uploader l’image avant d’ajouter dans le payload → **Pas de publicId**

---

## 5. Exemple de mapping des images avant envoi

```js
const imagesPayload = images.map(img => ({
  ...(img.id ? { id: img.id } : {}),
  url: img.url,
  publicId: img.publicId, // doit être défini !
  view: img.view,
  delimitations: img.delimitations
}));
```

---

## 6. Résumé du workflow
1. **Upload** chaque image via l’endpoint dédié
2. **Ajoute** l’image dans le state avec `url` et `publicId`
3. **Vérifie** que toutes les images ont un `publicId` avant d’envoyer le PATCH
4. **Envoie** le PATCH `/products/:id` avec le payload complet

---

## 7. Ressources utiles
- [FRONTEND_ADMIN_PRODUCT_UPDATE_ID_GUIDE.md](FRONTEND_ADMIN_PRODUCT_UPDATE_ID_GUIDE.md)
- [FRONTEND_ADMIN_PRODUCT_UPDATE_FULL_GUIDE.md](FRONTEND_ADMIN_PRODUCT_UPDATE_FULL_GUIDE.md)

---

**Pour toute question ou exemple détaillé, demande-le !** 
 