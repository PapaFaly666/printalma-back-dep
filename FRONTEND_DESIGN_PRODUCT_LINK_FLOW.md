# Guide Frontend – Synchronisation Design ↔ Produits

> À partir de la version « Design Validation 2.0 », chaque produit vendeur peut être lié à un design (champ `designId`). Quand le design est approuvé par l'admin :
>
> • le design passe à `isValidated = true`
> • TOUS les produits qui le référencent (`designId`) sont automatiquement mis :
>   – `status = PUBLISHED`
>   – `isValidated = true`
>   – `submittedForValidationAt = null`
>
> Ce guide explique comment refléter ces changements dans votre UI React / Vue / Angular.

---

## 1. Structure de Données

```ts
interface VendorProduct {
  id: number;
  designId?: number;        // ← nouveau champ
  status: 'PUBLISHED' | 'DRAFT';
  isValidated: boolean;
  submittedForValidationAt?: string | null;
  rejectionReason?: string | null;
  // … autres champs
}

interface Design {
  id: number;
  isValidated: boolean;
  isPending: boolean;
  // … autres champs
}
```

---

## 2. Workflow Côté Client

1. **Création produit** : le backend renvoie `status = 'DRAFT'`, `needsValidation = true` si le design n'est pas encore validé.
2. **Dashboard produits** : pièce de code pour afficher le statut (voir § 4).
3. **Attente validation** : deux stratégies :
   - Poller l'endpoint `GET /api/designs/:id` et/ou `GET /api/vendor/products?status=pending` toutes les 30 s.
   - Ou écouter l'event WebSocket `design.validated` (recommandé).
4. **Dès qu'un design est validé** ⇒ les produits liés seront automatiquement renvoyés comme `status = 'PUBLISHED'` dans la prochaine requête / via WebSocket.

---

## 3. Service TypeScript Exemple

```ts
class DesignService {
  async getDesign(id: number) {
    return fetch(`/api/designs/${id}`, { credentials: 'include' }).then(r => r.json());
  }
}

class VendorProductService {
  async getVendorProducts(params?: { status?: string }) {
    const qs = new URLSearchParams(params as any).toString();
    return fetch(`/api/vendor/products?${qs}`, { credentials: 'include' })
      .then(r => r.json());
  }
}
```

---

## 4. Composant Statut Produit

```tsx
function ProductStatusBadge({ p }: { p: VendorProduct }) {
  if (p.status === 'PUBLISHED' && p.isValidated) {
    return <Badge color="green">✅ Publié</Badge>;
  }
  if (p.submittedForValidationAt && !p.isValidated) {
    return <Badge color="yellow">⏳ En attente validation design</Badge>;
  }
  if (p.rejectionReason) {
    return <Badge color="red" title={p.rejectionReason}>❌ Rejeté</Badge>;
  }
  return <Badge color="gray">📝 Brouillon</Badge>;
}
```

---

## 5. Hook de Suivi du Design et Produits

```ts
import { useEffect } from 'react';
import useSWR from 'swr';

export const useDesignProductSync = (designId?: number) => {
  const { data: design, mutate: refetchDesign } = useSWR(() =>
    designId ? `/api/designs/${designId}` : null,
    (url) => fetch(url, { credentials: 'include' }).then(r => r.json()),
    { refreshInterval: 30000 } // 30 secondes de polling
  );

  // Si le design vient d'être validé, on peut rafraîchir la liste des produits
  useEffect(() => {
    if (design?.isValidated) {
      // déclencher un refetch global des produits (ex: SWR mutate key)
      mutate('/api/vendor/products?status=pending');
      mutate('/api/vendor/products?status=published');
    }
  }, [design?.isValidated]);

  return { design, refetchDesign };
};
```

---

## 6. Gestion WebSocket (optionnel mais recommandé)

```ts
socket.on('design.validated', (payload) => {
  if (payload.designId) {
    // Rafraîchir la liste des produits et du design
    mutate(`/api/designs/${payload.designId}`);
    mutate('/api/vendor/products?status=pending');
    mutate('/api/vendor/products?status=published');
  }
});
```

---

## 7. UX Recommandée

1. **Tableau « Produits en attente »** listant tous les produits `status=DRAFT` + `submittedForValidationAt≠null`.
2. **Toast / Notification** lorsqu'un produit passe à « Publié ».
3. **Lien vers le design** dans la fiche produit pour que le vendeur suive la validation.

---

## 8. Points d'Intégration Rapides

- Toujours sauvegarder `designId` dans votre store global (Zustand/Redux) après la création du produit.
- Afficher un badge « En attente de validation design » tant que `isValidated` est `false`.
- Rafraîchir la page ou utiliser WebSocket une fois l'event `design.validated` reçu.

---

## 9. TL;DR

• Ajoutez `designId` aux modèles côté client.  
• Polling ou WebSocket pour détecter la validation du design.  
• Dès validation → rafraîchir produits ; le backend les repasse automatiquement en `PUBLISHED`.

🎉 Votre interface est maintenant 100 % synchronisée avec le workflow design ↔ produits ! 