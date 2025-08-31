# Guide Frontend : Upload d'image couleur pour produit admin (mockup)

## 1. Endpoint d'upload d'image couleur

- **URL** :
  ```
  POST http://localhost:3004/products/:productId/colors/:colorId/images
  ```
- **Headers** :
  - `Authorization: Bearer <token_admin>`
  - `Content-Type: multipart/form-data`
- **Body** :
  - Champ `image` (type fichier, image PNG/JPG/SVG)

---

## 2. Exemple d'appel fetch pour uploader une image

```js
async function uploadColorImage(productId, colorId, file, token) {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`http://localhost:3004/products/${productId}/colors/${colorId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
      // Ne pas mettre Content-Type, il est géré automatiquement par FormData
    },
    body: formData
  });
  if (!res.ok) throw new Error('Erreur upload image couleur');
  return await res.json(); // { success, url, publicId, width, height }
}
```

---

## 3. Intégration dans le workflow de validation

1. **Avant de PATCH le produit pour validation** :
   - Parcours toutes les images locales (blob) dans le state du produit.
   - Pour chaque image locale, appelle `uploadColorImage` avec le fichier.
   - Récupère l'`url` et le `publicId` Cloudinary retournés.
   - Remplace l'image locale dans le state par l'image Cloudinary (url, publicId, etc.).
2. **Envoie le PATCH final** avec uniquement des images Cloudinary (pas de blob).
3. **Recharge le produit après PATCH** pour synchroniser les ids réels et les images.

---

## 4. Exemple d'intégration (pseudo-code)

```js
for (const color of product.colorVariations) {
  for (const image of color.images) {
    if (image.url.startsWith('blob:')) {
      // Uploader sur Cloudinary
      const uploadResult = await uploadColorImage(product.id, color.id, image.file, token);
      image.url = uploadResult.url;
      image.publicId = uploadResult.publicId;
      delete image.file;
    }
  }
}
// PATCH final
await fetch(`/products/${product.id}`, { ... });
```

---

## 5. Résumé
- Toujours uploader les images locales sur Cloudinary avant de PATCH pour validation.
- Utiliser l'endpoint backend d'upload pour chaque image couleur.
- Après PATCH, recharge le produit pour afficher les images Cloudinary.

**Pour un exemple React complet ou une intégration avancée, demande-le !** 