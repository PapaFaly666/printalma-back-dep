# Guide Frontend : Filtrage des Produits Vendeurs selon `isDelete`

Ce guide explique comment le frontend doit filtrer les produits vendeurs pour n’afficher que ceux qui ne sont pas supprimés (`isDelete: false`).

---

## 1. Fonctionnalité
- Les produits supprimés (soft delete) ont `isDelete: true`.
- Le backend **n’inclut plus** ces produits dans les réponses par défaut.
- Le frontend doit s’assurer de **ne jamais afficher** un produit avec `isDelete: true` (si jamais il reçoit ce champ).

---

## 2. Endpoint Backend (exemple)
- **Méthode :** `GET`
- **URL :** `/vendor/products`
- **Headers :**
  - `Authorization: Bearer <token>`
- **Réponse (succès) :**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 123,
        "name": "T-shirt Dragon",
        "isDelete": false,
        ...
      },
      {
        "id": 124,
        "name": "T-shirt supprimé",
        "isDelete": true,
        ...
      }
    ]
  }
}
```

---

## 3. Exemple de filtrage côté frontend (JS/React)
```js
const filteredProducts = products.filter(p => !p.isDelete);
```

---

## 4. Bonnes pratiques UI
- **N’affiche jamais** les produits avec `isDelete: true` dans les listes, recherches, etc.
- Si tu reçois un produit avec `isDelete: true` (cas rare), masque-le côté UI.
- Si tu veux afficher une corbeille ou un historique, tu peux filtrer sur `isDelete: true`.

---

## 5. Exemple complet (React)
```js
useEffect(() => {
  fetch('/vendor/products', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => res.json())
    .then(data => {
      // Filtrer côté frontend par sécurité
      setProducts(data.data.products.filter(p => !p.isDelete));
    });
}, []);
```

---

## 6. Pour aller plus loin
- Pour afficher une corbeille, filtre avec `p.isDelete === true`.
- Pour restaurer un produit, il faudra un endpoint dédié (non inclus ici).

---

**Pour toute question ou exemple détaillé, demande-le !** 
 