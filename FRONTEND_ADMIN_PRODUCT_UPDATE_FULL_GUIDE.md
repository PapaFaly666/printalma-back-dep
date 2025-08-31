# Guide Frontend : Modification Complète d’un Produit Admin (Mockup)

Ce guide explique comment modifier un produit admin (mockup) en incluant toutes les informations : infos principales, catégories, tailles, variations de couleurs, images, délimitations, etc.

---

## 1. Fonctionnalité
- Permet de modifier **toutes** les infos d’un produit admin : nom, description, prix, stock, catégories, tailles, couleurs, images, délimitations…
- Le payload de modification ressemble à celui de création, mais les éléments existants doivent inclure leur `id`.

---

## 2. Endpoint Backend
- **Méthode** : `PATCH`
- **URL** : `/products/:id`
- **Body** : `UpdateProductDto` (voir ci-dessous)
- **Authentification** : `credentials: 'include'` (cookies) ou header `Authorization`

---

## 3. Structure du Payload de Modification

- **Champs principaux** : `name`, `description`, `price`, `stock`, `categories`, `sizes`
- **Variations de couleurs** : tableau d’objets avec `id` (si existant), `name`, `images`, `delimitations`
- **Images** : tableau d’objets avec `id` (si existant), `url`, `publicId`
- **Délimitations** : tableau d’objets avec `id` (si existant), `x`, `y`, `width`, `height`

### Exemple de payload

```json
{
  "name": "T-shirt Premium Modifié",
  "description": "Nouveau descriptif",
  "price": 21.99,
  "stock": 80,
  "categories": [1, 3],
  "sizes": [1, 2],
  "colorVariations": [
    {
      "id": 10,
      "name": "Blanc",
      "images": [
        {
          "id": 101,
          "url": "https://res.cloudinary.com/xxx/image/upload/v1234567890/mockup1.jpg",
          "publicId": "mockup1"
        },
        {
          "url": "https://res.cloudinary.com/xxx/image/upload/v1234567890/mockup2.jpg",
          "publicId": "mockup2"
        }
      ],
      "delimitations": [
        {
          "id": 201,
          "x": 120,
          "y": 220,
          "width": 420,
          "height": 520
        },
        {
          "x": 200,
          "y": 300,
          "width": 100,
          "height": 100
        }
      ]
    },
    {
      "name": "Noir",
      "images": [
        {
          "url": "https://res.cloudinary.com/xxx/image/upload/v1234567890/mockup3.jpg",
          "publicId": "mockup3"
        }
      ],
      "delimitations": [
        {
          "x": 100,
          "y": 200,
          "width": 400,
          "height": 500
        }
      ]
    }
  ]
}
```

---

## 4. Gestion des IDs
- **Pour modifier** un élément existant : inclure son `id` (récupéré depuis le backend)
- **Pour ajouter** un nouvel élément : ne pas mettre d’`id` (ou `id: null`)
- **Pour supprimer** un élément : ne pas l’inclure dans le payload (le backend supprime tout ce qui n’est pas dans la liste)
- **Ne jamais envoyer d’ID temporaire** (ex : généré côté frontend) pour les nouveaux éléments

---

## 5. Workflow d’Upload d’Image
1. **Uploader** chaque nouvelle image via l’endpoint dédié :
   - `POST /products/:productId/colors/:colorId/images` (multipart)
2. **Récupérer** l’`url` et le `publicId` dans la réponse
3. **Ajouter** ces infos dans le payload de modification (dans le tableau `images` de la couleur concernée)

---

## 6. Exemple d’Appel API (JS/React)

```js
async function updateProduct(productId, payload) {
  const res = await fetch(`/products/${productId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Erreur lors de la modification du produit');
  return await res.json();
}
```

---

## 7. Bonnes pratiques
- Toujours uploader les images avant d’envoyer le PATCH de modification
- Utiliser les IDs du backend pour les éléments existants
- Ne pas envoyer d’ID temporaire pour les nouveaux éléments
- Gérer les erreurs réseau ou d’autorisation
- Afficher un message de succès après modification

---

## 8. Ressources utiles
- [FRONTEND_ADMIN_PRODUCT_UPDATE_ID_GUIDE.md](FRONTEND_ADMIN_PRODUCT_UPDATE_ID_GUIDE.md)
- [FRONTEND_VENDOR_PRODUCT_IMAGE_UPLOAD_GUIDE.md](FRONTEND_VENDOR_PRODUCT_IMAGE_UPLOAD_GUIDE.md)

---

**Pour toute question ou exemple détaillé, demande-le !** 
 