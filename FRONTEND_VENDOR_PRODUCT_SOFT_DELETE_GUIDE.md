# Guide Frontend : Suppression (Soft Delete) des Produits Vendeurs avec Design

Ce guide explique comment intégrer la suppression (soft delete) d’un produit vendeur (VendorProduct) côté frontend, en utilisant le nouveau champ `isDelete` et l’endpoint dédié.

---

## 1. Fonctionnalité
- Un produit n’est jamais supprimé physiquement, mais marqué comme supprimé (`isDelete: true`).
- Les produits supprimés ne sont plus affichés dans les listes, recherches, etc.
- Seul le vendeur propriétaire ou un admin peut supprimer un produit.

---

## 2. Endpoint Backend
- **Méthode :** `DELETE`
- **URL :** `/vendor/products/:id`
- **Headers :**
  - `Authorization: Bearer <token>`
- **Réponse (succès) :**
```json
{
  "success": true,
  "message": "Produit supprimé (soft delete)"
}
```
- **Réponse (erreur) :**
  - 404 : Produit introuvable
  - 403 : Non autorisé

---

## 3. Exemple d’intégration (React)

### a) Bouton de suppression
```jsx
<button onClick={() => handleDelete(product.id)}>Supprimer</button>
```

### b) Fonction de suppression
```js
const handleDelete = async (productId) => {
  if (!window.confirm('Confirmer la suppression de ce produit ?')) return;
  const res = await fetch(`/vendor/products/${productId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (res.ok) {
    alert('Produit supprimé !');
    // Rafraîchir la liste des produits
  } else {
    const data = await res.json();
    alert('Erreur : ' + (data.message || 'Suppression impossible'));
  }
};
```

---

## 4. Gestion UI
- **Après suppression**, retire le produit de la liste affichée (pas besoin de recharger toute la page).
- Affiche un message de confirmation ou d’erreur.
- Désactive le bouton si le produit est déjà supprimé.

---

## 5. Bonnes pratiques
- Demander une confirmation avant suppression.
- Ne jamais afficher les produits avec `isDelete: true`.
- Gérer les erreurs d’API (non autorisé, produit introuvable).
- Afficher un message clair à l’utilisateur.

---

**Pour toute question ou exemple détaillé, demande-le !** 
 