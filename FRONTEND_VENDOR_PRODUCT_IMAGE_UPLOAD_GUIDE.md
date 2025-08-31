# Guide Frontend : Upload d’Image pour Produit Vendeur (VendorProduct)

Ce guide explique comment uploader une image pour un produit vendeur via l’endpoint `/vendor/design-product/upload-design`.

---

## 1. Fonctionnalité
- Permet à un vendeur (ou admin) d’uploader une image pour un produit vendeur (VendorProduct).
- L’image est uploadée sur Cloudinary et les infos nécessaires sont retournées pour l’intégration dans le produit.

---

## 2. Endpoint Backend
- **Méthode :** `POST`
- **URL :** `/vendor/design-product/upload-design`
- **Headers :**
  - `Authorization: Bearer <token>` (si tu utilises un header)
- **Authentification :**
  - Utilise `credentials: 'include'` dans `fetch` pour envoyer les cookies de session si besoin.
- **Body attendu :**
  - `vendorProductId` (obligatoire)
  - `colorId` (optionnel)
  - `image` (fichier, multipart)

---

## 3. Exemple d’appel API (JS/React, FormData)

```js
async function uploadVendorProductImage(vendorProductId, file, colorId) {
  const formData = new FormData();
  formData.append('vendorProductId', vendorProductId);
  if (colorId) formData.append('colorId', colorId);
  formData.append('image', file);

  const res = await fetch('/vendor/design-product/upload-design', {
    method: 'POST',
    credentials: 'include',
    body: formData,
    // Pas besoin de Content-Type, il est géré automatiquement par FormData
  });
  if (!res.ok) throw new Error('Erreur lors de l’upload de l’image');
  return await res.json();
}
```

---

## 4. Exemple de réponse backend (succès)

```json
{
  "success": true,
  "url": "https://res.cloudinary.com/xxx/image/upload/v1234567890/abc.jpg",
  "publicId": "vendor_123_abc",
  "width": 1200,
  "height": 1200
}
```

---

## 5. Bonnes pratiques
- Toujours uploader l’image avant de l’ajouter dans le PATCH de modification du produit.
- Utilise l’`url` et le `publicId` retournés dans le payload de modification.
- Gère les erreurs réseau ou d’autorisation.
- Affiche un message de succès après upload.

---

**Pour toute question ou exemple détaillé, demande-le !** 
 