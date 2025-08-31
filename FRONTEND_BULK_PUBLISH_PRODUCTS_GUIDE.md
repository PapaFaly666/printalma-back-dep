# Guide Frontend : Publication en Masse des Produits d’un Design

> Version : Décembre 2024   |   Auteur : Backend Team

---

## 1️⃣ Contexte

Depuis la mise à jour **Design-Validation v2**, les produits créés avec un design validé sont placés par défaut en **DRAFT**. Le vendeur peut désormais :

1. Publier **un produit** à la fois → `PUT /api/vendor-publish/products/:id/publish` (existant)
2. **Publier tous** les produits DRAFT liés à un design validé → **🆕 endpoint** `PUT /api/vendor/designs/:designId/publish-products`

Ce guide explique le deuxième cas (publication en masse).

---

## 2️⃣ Endpoint Backend

| Méthode | URL | Auth | Corps | Réponse |
|---------|-----|------|-------|---------|
| `PUT` | `/api/vendor/designs/:designId/publish-products` | JWT (cookie ou header) + rôle VENDEUR | _(aucun)_ | `{ success, publishedCount, skippedCount, message }` |

### Conditions :

1. Le **design** doit être `VALIDATED` par un admin.
2. Les produits liés doivent appartenir au **vendeur connecté**.
3. Seuls les produits en statut `DRAFT` sont concernés.

### Exemple de réponse
```json
{
  "success": true,
  "publishedCount": 5,
  "skippedCount": 0,
  "message": "5 produits publiés avec succès pour le design Logo Futuriste"
}
```

---

## 3️⃣ Intégration Frontend (React + SWR)

### a. Appel API
```ts
export const publishProductsForDesign = async (
  designId: number,
  token: string // ou laisser vide si cookie httpOnly
) => {
  const res = await fetch(`/api/vendor/designs/${designId}/publish-products`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}` // facultatif si cookie
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erreur publication en masse');
  }

  return res.json();
};
```

### b. Bouton d’action
```tsx
const BulkPublishButton = ({ designId, draftCount }: { designId: number; draftCount: number }) => {
  const [loading, setLoading] = useState(false);

  // Masquer si aucun brouillon
  if (draftCount === 0) return null;

  const handleClick = async () => {
    if (!confirm(`Publier ${draftCount} produit(s) ?`)) return;

    setLoading(true);
    try {
      const result = await publishProductsForDesign(designId, token);
      toast.success(result.message);
      // ⚡️ Recharger listes designs & produits
      mutate(keyDraftProducts);
      mutate(keyPublishedProducts);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn btn-success" disabled={loading} onClick={handleClick}>
      {loading ? '⏳ Publication…' : `🚀 Publier ${draftCount} produit(s)`}
    </button>
  );
};
```

### c. Position dans l’UI
- **Page Design Details** : sous la miniature du design lorsque `validationStatus === 'VALIDATED'`.
- **Tableau de bord** : badge « X produits prêts à publier » avec lien rapide.

---

## 4️⃣ Mise à jour de la liste des produits

Après publication en masse :
1. Les produits passent de `DRAFT` à `PUBLISHED`.
2. Rafraîchir caches (`mutate`) ou requêtes GraphQL.
3. Mettre à jour les stats vendeur (publier → augmente `publishedProducts`, diminue `draftProducts`).

---

## 5️⃣ Messages Utilisateur

| Cas | Message |
|-----|---------|
| Succès | ✅ "5 produits publiés avec succès pour le design X" |
| Aucune action | ⚠️ "Aucun produit en brouillon à publier pour ce design" |
| Erreur design pas validé | ❌ "Ce design n'est pas validé et ne peut pas être publié" |

---

## 6️⃣ Styles CSS suggérés

```css
.btn-success {
  background: #059669;
  color: #fff;
  padding: 8px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-success:hover { background: #047857; }
```

---

## 7️⃣ Checklist d’Implémentation Frontend

- [ ] Afficher le **bouton de publication en masse** sur chaque design validé.
- [ ] Mettre à jour les listes et statistiques après succès.
- [ ] Gérer les cas d’erreur (design non validé, aucun brouillon).
- [ ] Ajouter un toast de confirmation avant appel API.
- [ ] Tester sur design avec 0, 1 et plusieurs produits brouillons.

---

Le vendeur dispose maintenant d’un **super-bouton "Publier tout"** pour accélérer la mise en ligne de ses produits ! 🚀 