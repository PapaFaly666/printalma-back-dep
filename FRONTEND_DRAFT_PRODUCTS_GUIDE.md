# 📝 Frontend Guide – Produits « Brouillon » après Validation Design

> Version : Juin 2025   |   Auteur : Backend Team

---

## 1. Pourquoi ce guide ?
Certaines boutiques veulent préparer leurs produits puis **les publier manuellement** après l'approbation du design par l'admin. C'est le rôle du couple :
* `status`            → indique l'état de publication du produit (`DRAFT` | `PENDING` | `PUBLISHED`)
* `forcedStatus`   → intention initiale du vendeur lors de la création (`"DRAFT"` ou `"PENDING"`)

Lorsque `forcedStatus === "DRAFT"`, **le backend ne publie pas automatiquement** le produit après validation du design ; il passe seulement les indicateurs de validation à `true`.

---

## 2. Cycle de vie attendu
| Étape | status | forcedStatus | isValidated | designValidationStatus |
|-------|--------|--------------|-------------|------------------------|
| Création | `DRAFT` | `DRAFT` | `false` | `PENDING` |
| Design validé | `DRAFT` | `DRAFT` | `true` | `VALIDATED` |
| Publication manuelle | `PUBLISHED` | `DRAFT` | _inchangé_ | `VALIDATED` |

---

## 3. Affichage dans l'UI
1. **Badge validation** : 
   * `PENDING` → gris/orange
   * `VALIDATED` → vert
2. **Bouton « Publier » visible si :**
```ts
product.status === 'DRAFT' && product.isValidated === true
```
3. **Statut produit** :
   * `DRAFT` → « Brouillon »
   * `PUBLISHED` → « Publié »

---

## 4. Exemple React (TypeScript + SWR)
```tsx
interface VendorProduct {
  id: number;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  forcedStatus: 'DRAFT' | 'PENDING';
  isValidated: boolean;
  designValidationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
}

function DraftCard({ p }: { p: VendorProduct }) {
  const publish = async () => {
    await fetch(`/api/vendor/products/${p.id}/publish`, { method: 'PUT' });
    mutate('/api/vendor/products'); // SWR
  };

  return (
    <div className="card">
      <h3>Produit #{p.id}</h3>
      <p>Statut : {p.status}</p>
      <p>Validation design : {p.designValidationStatus}</p>

      {p.status === 'DRAFT' && p.isValidated && (
        <button onClick={publish}>🚀 Publier maintenant</button>
      )}
    </div>
  );
}
```

---

## 5. Checklist développeur
- [ ] Mettre à jour l'interface `VendorProduct` côté front avec `forcedStatus`, `isValidated`, `designValidationStatus`.
- [ ] Dans la liste : si `isValidated === true && status === 'DRAFT'` → afficher un badge « Prêt à publier ».
- [ ] Dans le détail : afficher le bouton « Publier maintenant » dans le même cas.
- [ ] Après clic, appeler `PUT /api/vendor/products/:id/publish`, puis actualiser la liste.
- [ ] Tester :
  * Design validé ➜ produit passe `isValidated = true` sans changer `status`.
  * Publication ➜ `status = PUBLISHED`.

---

## 6. Ressources API utiles
* Validation design : `PUT /api/designs/:id/validate`
* Liste produits : `GET /api/vendor/products`
* Publication produit : `PUT /api/vendor/products/:id/publish`

---

🎉 Vous avez maintenant toutes les clés pour gérer correctement les brouillons prêts à publier ! 