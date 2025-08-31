# Guide Frontend : Modification Complète d’un Produit Admin (Mockup)

Ce guide explique comment intégrer la modification complète d’un produit admin (mockup) côté frontend, en utilisant l’endpoint PATCH `/products/:id`.

---

## 1. Fonctionnalité
- Permet à un administrateur de modifier toutes les informations d’un produit admin :
  - Nom, description, prix, stock, statut
  - Catégories
  - Tailles
  - Variations couleurs, images, délimitations, faces, etc.

---

## 2. Endpoint Backend
- **Méthode :** `PATCH`
- **URL :** `/products/:id`
- **Headers :**
  - `Authorization: Bearer <token>` (si tu utilises un header)
- **Authentification :**
  - Utilise `credentials: 'include'` dans `fetch` pour envoyer les cookies de session si besoin.
- **Body attendu :**
  - Un objet conforme à `UpdateProductDto` (voir ci-dessous)

---

## 3. Exemple de payload (JSON)

```json
{
  "name": "T-shirt Premium",
  "description": "Nouveau modèle amélioré",
  "price": 29.99,
  "stock": 100,
  "status": "PUBLISHED",
  "categories": ["T-shirts", "Nouveautés"],
  "sizes": ["S", "M", "L"],
  "colorVariations": [
    {
      "id": 1,
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      // ... autres champs spécifiques à la variation
    }
  ],
  // ... images, delimitations, etc. selon la structure attendue
}
```

---

## 4. Exemple d’appel API (React, fetch)

```js
async function updateProduct(productId, updateData) {
  const res = await fetch(`/products/${productId}`, {
    method: 'PATCH',
    credentials: 'include', // Important pour l’authentification par cookie
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` // Si tu utilises un token JWT
    },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error('Erreur lors de la modification du produit');
  return await res.json();
}
```

---

## 5. Bonnes pratiques
- Pré-remplis le formulaire avec les données actuelles du produit.
- N’envoie que les champs modifiés si possible.
- Gère les erreurs réseau ou d’autorisation.
- Affiche un message de succès après modification.
- Rafraîchis la fiche produit après modification.

---

**Pour toute question ou exemple détaillé, demande-le !** 
 