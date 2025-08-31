# Guide Frontend – Statuts `VendorProduct`

## 1. Rappel des Statuts

| Statut              | Signification                                    | Transition automatique                                                                 |
|---------------------|--------------------------------------------------|-----------------------------------------------------------------------------------------|
| `DRAFT`             | Brouillon / non soumis                           | • Création initiale (design non soumis ou rejeté)                                       |
| `PENDING`           | En attente de validation du **design**           | • Après `designService.submitForValidation()`
|                     |                                                  | • Création de produit avec un design non validé                                        |
| `PUBLISHED`         | Produit disponible à la vente                    | • Le design associé est **validé** par l'admin (synchronisation automatique)            |

> Remarque : l'ancien statut `VALIDATED` n'est plus utilisé côté `VendorProduct`.

---

## 2. Champ de Validation Complémentaire

Chaque `VendorProduct` possède toujours :

```ts
isValidated: boolean   // true lorsque le design a été approuvé
validatedAt?: string   // ISO date
rejectionReason?: string
submittedForValidationAt?: string
```

Ce champ reste utile pour l'historique mais le **statut** fait foi pour l'UI.

---

## 3. Affichage UI (React – exemple Tailwind)

```tsx
import React from 'react';
import { VendorProduct } from '../types/api';

export function VendorProductStatusBadge({ product }: { product: VendorProduct }) {
  const map = {
    PUBLISHED: {
      label: '✅ Publié',
      color: 'bg-green-100 text-green-800 border-green-300',
    },
    PENDING: {
      label: '⏳ En attente',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    DRAFT: {
      label: '📝 Brouillon',
      color: 'bg-gray-100 text-gray-800 border-gray-300',
    },
  } as const;

  const info = map[product.status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${info.color}`}> 
      {info.label}
    </span>
  );
}
```

---

## 4. Filtrage / Recherche

```ts
// Exemple : filtrer uniquement les produits prêts à la vente
const liveProducts = products.filter((p) => p.status === 'PUBLISHED');
```

Dans la liste des produits du vendeur, proposez un select : **Tous / Brouillons / En attente / Publiés**.

---

## 5. Points Clés de Synchronisation

1. **Soumission du design**
   ```ts
   await designService.submitForValidation(designId);
   // ➜ Tous les produits liés passent en PENDING automatiquement
   ```
2. **Validation du design (admin)**
   ```ts
   await designService.validateDesign(designId, true);
   // ➜ Tous les produits liés passent en PUBLISHED automatiquement
   ```
3. **Rejet du design**
   ```ts
   await designService.validateDesign(designId, false, 'Problème de qualité');
   // ➜ Tous les produits repassent en DRAFT + rejectionReason
   ```

---

## 6. API : Endpoints utiles

| Méthode | Endpoint                                          | Description                                      |
|---------|---------------------------------------------------|--------------------------------------------------|
| POST    | `/api/designs/:id/submit-for-validation`          | Soumettre un design                              |
| POST    | `/api/designs/:id/validate`                       | Admin : valider / rejeter                        |
| GET     | `/api/vendor/products?status=PUBLISHED`           | Récupérer les produits publiés                   |

---

## 7. Checklist Frontend

- [ ] Afficher le badge de statut dans toutes les listes.
- [ ] Filtrer les produits par statut.
- [ ] Mise à jour temps réel via WebSocket *(optionnel)* : écouter `design.validated` ➜ recharger produits.
- [ ] Notification toast quand un produit passe en `PUBLISHED`.

---

> Besoin de plus de détails ? Consulte aussi `GUIDE_FRONTEND_VALIDATION_DESIGN_PRODUITS.md` pour le workflow complet. 