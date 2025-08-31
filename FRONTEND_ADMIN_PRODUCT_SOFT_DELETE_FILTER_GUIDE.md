# Guide Frontend : Affichage des Produits Admin Supprimés (Soft Delete)

Ce guide explique comment intégrer l'affichage des produits admin supprimés (soft delete) côté frontend, en utilisant l'endpoint dédié et le champ `isDelete`.

---

## 1. Fonctionnalité
- Les produits supprimés (soft delete) ont `isDelete: true`.
- Ils ne sont plus affichés dans la liste principale, mais peuvent être listés dans une "corbeille" ou un onglet d'archives.

---

## 2. Endpoint Backend
- **Méthode :** `GET`
- **URL :** `/products/deleted`
- **Headers :**
  - `Authorization: Bearer <token>` (si tu utilises un header)
- **Authentification :**
  - Utilise `credentials: 'include'` dans `fetch` pour envoyer les cookies de session si besoin.
- **Réponse (succès) :**
```json
[
  {
    "id": 123,
    "name": "T-shirt Basic",
    "isDelete": true,
    ...
  },
  ...
]
```

---

## 3. Exemple d'appel API (React, fetch)

```js
async function fetchDeletedProducts() {
  const res = await fetch('/products/deleted', {
    method: 'GET',
    credentials: 'include', // Important pour envoyer les cookies d'authentification
    headers: {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` // Si tu utilises un token JWT
    },
  });
  if (!res.ok) throw new Error('Erreur lors de la récupération des produits supprimés');
  return await res.json();
}
```

---

## 4. Intégration UI (corbeille)
- Ajoute un onglet ou une page "Corbeille" dans l'interface admin.
- Affiche la liste des produits retournés par `/products/deleted`.
- Permets éventuellement la restauration ou la suppression définitive (si le backend le permet).
- Affiche clairement que ces produits sont archivés/supprimés.

---

## 5. Bonnes pratiques
- Ne mélange jamais les produits actifs et supprimés dans la même liste.
- Affiche un message si la corbeille est vide.
- Gère les erreurs réseau ou d'autorisation.

---

**Pour toute question ou exemple détaillé, demande-le !** 
 