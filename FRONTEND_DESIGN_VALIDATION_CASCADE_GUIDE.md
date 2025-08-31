# 🎯 FRONTEND — GUIDE INTÉGRATION VALIDATION EN CASCADE DESIGN → PRODUITS

> **Objectif :** Expliquer pas à pas comment le frontend doit consommer les nouveaux endpoints backend afin de gérer :
> 1. Le choix de l’action post-validation (`AUTO_PUBLISH` ou `TO_DRAFT`)
> 2. Le déclenchement automatique de cette action sur **tous** les produits quand un admin valide le design
> 3. La mise à jour temps-réel (badges, listes, notifications) de l’UI vendeur & admin.

---

## 1. Panorama fonctionnel 🗺️

```mermaid
graph TD
    subgraph Vendeur
        A1[Créer design] --> A2[Créer produit(s) avec design]
        A2 --> A3[Choisir postValidationAction]
        A3 --> A4[Soumettre produit (STATUS=PENDING)]
        style A4 fill:#ffeaa7
    end

    B1(Admin) -->|Valide design| C1[Backend]

    subgraph Backend
        C1[validateDesign] --> C2[applyValidationActionToProducts]
        C2 -->|AUTO_PUBLISH| D1[Produit → PUBLISHED]
        C2 -->|TO_DRAFT| D2[Produit → DRAFT (validé)]
    end

    D1 --> V1[Notification « Produit publié »]
    D2 --> V2[Notification « Produit validé – brouillon »]
```

---

## 2. Modèles de données 🔢

### 2.1 Enum `PostValidationAction`
```ts
export enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',  // Publication automatique
  TO_DRAFT = 'TO_DRAFT'           // Mise en brouillon après validation
}
```

### 2.2 `VendorProduct` (extrait)
```ts
interface VendorProduct {
  id: number;
  name: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  isValidated: boolean;
  postValidationAction: PostValidationAction;
  validatedAt?: string;
  // … autres champs existants
}
```

### 2.3 `Design` (extrait)
```ts
interface Design {
  id: number;
  imageUrl: string;
  isValidated: boolean;
  isPending: boolean;
  rejectionReason?: string | null;
  // … autres champs
}
```

---

## 3. Nouveaux/Principaux endpoints backend 🔌

| Méthode | URL | Rôle | Auth |
|---------|-----|------|------|
| **POST** | `/designs/:id/submit` | Vendeur soumet un design pour validation | Bearer
| **PUT** | `/designs/:id/validate` | Admin approuve/rejette un design (déclenche la cascade) | Bearer (ADMIN/SUPERADMIN)
| **POST** | `/vendor/publish` | Création produit personnalisé + `postValidationAction` | Bearer (VENDOR)
| **PUT** | `/vendor-product-validation/post-validation-action/:productId` | Modifier l’action post-validation tant que le produit n’est pas validé | Bearer (VENDOR)
| **POST** | `/vendor-product-validation/publish/:productId` | Publier manuellement un produit validé-brouillon | Bearer (VENDOR)
| **GET** | `/vendor/products` | Lister produits vendeur (query `status`) | Bearer (VENDOR)

> ⚠️ Tous les produits créés avec un design **non validé** doivent être envoyés avec `status = 'PENDING'` **et** `postValidationAction`.

### 3.1 Exemple création produit
```http
POST /vendor/publish
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendorName": "T-Shirt Dragon",
  "vendorPrice": 2500,
  "designCloudinaryUrl": "https://res.cloudinary.com/.../design.jpg",
  "postValidationAction": "AUTO_PUBLISH",
  "forcedStatus": "PENDING",
  "productStructure": { /* … */ }
}
```

### 3.2 Exemple cascade après validation
Après qu’un admin exécute :
```http
PUT /designs/42/validate
Body: { "action": "VALIDATE" }
```
Le backend :
* marque le design comme `isValidated=true`
* parcourt tous les `VendorProduct` avec `status = 'PENDING'` **et** le même `designCloudinaryUrl`
* applique :
  * `status = 'PUBLISHED'` si `postValidationAction = AUTO_PUBLISH`
  * `status = 'DRAFT'` + `isValidated = true` si `postValidationAction = TO_DRAFT`
* envoie un email de notification au vendeur
* (optionnel) émet un event WebSocket `vendor-product.updated`

---

## 4. Intégration côté frontend React (exemple) ⚛️

### 4.1 Service API
```ts
// src/services/vendorProductService.ts
import api from './api';
import { PostValidationAction, VendorProduct } from '@/types/vendorProduct';

export class VendorProductService {
  static async createProduct(payload: Omit<VendorProduct, 'id' | 'status' | 'isValidated'> & {
    designCloudinaryUrl: string;
    postValidationAction: PostValidationAction;
  }) {
    return api.post('/vendor/publish', payload).then(r => r.data);
  }

  static async updatePostValidationAction(productId: number, action: PostValidationAction) {
    return api.put(`/vendor-product-validation/post-validation-action/${productId}`, { action })
             .then(r => r.data);
  }

  static async publishValidatedDraft(productId: number) {
    return api.post(`/vendor-product-validation/publish/${productId}`).then(r => r.data);
  }

  static async listVendorProducts(params?: { status?: string }) {
    return api.get('/vendor/products', { params }).then(r => r.data);
  }
}
```

### 4.2 Hook de validation
```ts
// src/hooks/useVendorValidation.ts
import { useState, useCallback } from 'react';
import { VendorProductService } from '@/services/vendorProductService';
import { PostValidationAction } from '@/types/vendorProduct';
import { toast } from 'react-hot-toast';

export const useVendorValidation = () => {
  const [loading, setLoading] = useState(false);

  const setAction = useCallback(async (productId: number, action: PostValidationAction) => {
    setLoading(true);
    try {
      await VendorProductService.updatePostValidationAction(productId, action);
      toast.success('Action post-validation mise à jour');
    } finally {
      setLoading(false);
    }
  }, []);

  const publish = useCallback(async (productId: number) => {
    setLoading(true);
    try {
      await VendorProductService.publishValidatedDraft(productId);
      toast.success('Produit publié avec succès');
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, setAction, publish };
};
```

### 4.3 Badge statut produit
```tsx
// src/components/ProductStatusBadge.tsx
import { VendorProduct, PostValidationAction } from '@/types/vendorProduct';

export function ProductStatusBadge({ p }: { p: VendorProduct }) {
  if (p.status === 'PUBLISHED') return <Badge color="green">✅ Publié</Badge>;
  if (p.status === 'PENDING') return <Badge color="yellow">⏳ En attente admin</Badge>;
  if (p.isValidated && p.status === 'DRAFT') return <Badge color="blue">📝 Brouillon validé</Badge>;
  if (p.rejectionReason) return <Badge color="red" title={p.rejectionReason}>❌ Rejeté</Badge>;
  return <Badge color="gray">Brouillon</Badge>;
}
```

### 4.4 Réception de la cascade (polling ou WebSocket)
```ts
// Polling (SWR)
const { data } = useSWR('/vendor/products', fetcher, { refreshInterval: 30000 });

// WebSocket (socket.io)
socket.on('vendor-product.updated', (payload) => {
  mutate('/vendor/products'); // rafraîchir cache SWR/Zustand/etc.
});
```

---

## 5. UX recommandée 🎨

1. **Sélecteur d’action** (`ValidationActionSelector`) dans la fiche produit avant soumission.
2. **Toast** confirmant le choix (`🚀 Publication automatique` ou `📝 Mise en brouillon`).
3. **Tableau « Produits en attente admin »** filtré par `status = PENDING`.
4. Badge dynamique mis à jour après cascade (voir § 4.3).
5. Bouton « Publier maintenant » visible uniquement si `isValidated=true` **et** `status=DRAFT`.

---

## 6. Checklist d’intégration ✅

- [ ] Ajouter `PostValidationAction` à vos types & forms
- [ ] Passer `postValidationAction` lors de la création produit
- [ ] Permettre la modification tant que `status = PENDING`
- [ ] Mettre à jour UI après l’event cascade (polling/WebSocket)
- [ ] Gérer les notifications toast & e-mails

---

## 7. FAQ 🤔

**Q : Puis-je changer le `postValidationAction` après soumission du design ?**
> Oui, tant que le produit est `status=PENDING`, utilisez le PUT `/vendor-product-validation/post-validation-action/:id`.

**Q : Comment savoir qu’un produit a été mis en brouillon mais validé ?**
> `isValidated = true` ET `status = DRAFT`.

**Q : Dois-je gérer le champ `validatedAt` côté client ?**
> Optionnel pour l’UI, utile pour afficher la date dans les détails produit.

---

🎉 **Votre frontend est désormais prêt à 100 % pour la validation en cascade !** 
 