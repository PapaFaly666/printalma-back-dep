# Guide Frontend : Suppression (Soft Delete) des Produits Admin (Mockups)

Ce guide explique comment intégrer la suppression douce (soft delete) des produits admin (mockups) côté frontend, en utilisant le champ `isDelete` et l'endpoint dédié.

---

## 1. Fonctionnalité
- Un produit admin n’est jamais supprimé physiquement, mais marqué comme supprimé (`isDelete: true`).
- Les produits supprimés ne sont plus affichés dans les listes, recherches, etc.
- Seuls les administrateurs peuvent supprimer un produit admin.

---

## 2. Endpoint Backend
- **Méthode :** `PATCH`
- **URL :** `/products/:id/soft-delete`
- **Headers :**
  - `Authorization: Bearer <token>` (si tu utilises un header, sinon voir ci-dessous)
- **Authentification :**
  - Utilise `credentials: 'include'` dans `fetch` pour envoyer les cookies de session si tu es en mode cookie (ex : login via session).
- **Réponse (succès) :**
```json
{
  "success": true,
  "message": "Produit admin supprimé (soft delete)"
}
```

---

## 3. Exemple d'appel API (React, fetch)

```js
async function softDeleteProduct(productId) {
  const res = await fetch(`/products/${productId}/soft-delete`, {
    method: 'PATCH',
    credentials: 'include', // Important pour envoyer les cookies d'authentification
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` // Si tu utilises un token JWT
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur lors de la suppression');
  return data;
}
```

---

## 4. Intégration UI
- Ajoute un bouton "Supprimer" (ou "Archiver") sur chaque produit admin dans la liste.
- Au clic, appelle la fonction `softDeleteProduct` avec l'ID du produit.
- Après succès, retire le produit de la liste affichée (ou recharge la liste).
- Affiche un message de confirmation ou d'erreur selon la réponse.

---

## 5. Filtrage côté frontend
- Les endpoints de listing (`GET /products`) **n'incluent plus** les produits supprimés (`isDelete: true`).
- Si jamais tu reçois un produit avec `isDelete: true`, ne l'affiche pas dans la liste.

---

## 6. Bonnes pratiques
- Demande une confirmation à l'utilisateur avant de supprimer.
- Gère les erreurs réseau ou d'autorisation (ex : non admin).
- Affiche un message de succès après suppression.

---

**Pour toute question ou exemple détaillé, demande-le !** 
 