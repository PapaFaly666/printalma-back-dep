# 🚀 GUIDE FRONTEND – CASCADE VALIDATION V3 (Correctif Urgent)

Ce document explique la logique métier, les endpoints et les exemples de requêtes/réponses pour intégrer le **système de cascade validation V3** côté frontend. Toutes les requêtes utilisent **`credentials: 'include'`** afin que les cookies d'authentification (JWT en HttpOnly) soient automatiquement envoyés.

---

## 1. 🎯 Rappel Fonctionnel

1. Un vendeur crée un produit et choisit l'action post-validation :
   * `AUTO_PUBLISH` → publication automatique après validation admin.
   * `TO_DRAFT` → produit reste en brouillon validé, le vendeur publie plus tard.
2. L'admin valide ou rejette un design.
3. Tous les produits liés à ce design sont mis à jour :
   * `isValidated` → `true`.
   * `status` → `PUBLISHED` ou `DRAFT` selon l'action.
   * Les notifications email sont envoyées.

---

## 2. 🛣️ Endpoints Backend

| Rôle | Méthode | URL | Corps | Réponse principale |
|------|---------|-----|-------|--------------------|
| Vendeur | `POST` | `/api/vendor/products` | `VendorPublishDto` (détails ci-dessous) | `VendorPublishResponseDto` |
| Vendeur | `PUT`  | `/api/vendor-product-validation/post-validation-action/:productId` | `{ postValidationAction: 'AUTO_PUBLISH' \| 'TO_DRAFT' }` | `{ success, message, product }` |
| Vendeur | `POST` | `/api/vendor-product-validation/publish/:productId` | _vide_ | `{ success, message, product }` |
| Admin   | `PUT`  | `/api/designs/:id/validate` | `{ action: 'VALIDATE' \| 'REJECT', rejectionReason? }` | `{ success, message, data: Design }` |
| Admin   | `GET`  | `/api/vendor-product-validation/pending` | query params `page`, `limit` | `{ success, data: { products, pagination } }` |
| Admin   | `GET`  | `/api/vendor-product-validation/stats` | _none_ | `{ success, data: CascadeValidationStats }` |

> Toutes les réponses incluent la propriété `success` (booléen) et un `message` descriptif.

### 2.1 DTO côté Frontend (TypeScript)

```ts
export type PostValidationAction = 'AUTO_PUBLISH' | 'TO_DRAFT';
export type VendorProductStatus  = 'PENDING' | 'DRAFT' | 'PUBLISHED';

export interface VendorPublishDto {
  baseProductId: number;
  productStructure: ProductStructureDto; // voir doc précédente
  vendorPrice: number;
  vendorName: string;
  vendorDescription: string;
  vendorStock: number;
  selectedColors: SelectedColorDto[];
  selectedSizes: SelectedSizeDto[];
  finalImagesBase64: { design: string };
  // optionnels
  forcedStatus?: 'PENDING' | 'DRAFT';
  postValidationAction?: PostValidationAction; // 🆕
}

export interface VendorPublishResponseDto {
  success: boolean;
  productId: number;
  message: string;
  status: VendorProductStatus;
  needsValidation: boolean;
  imagesProcessed: number;
  structure: 'admin_product_preserved';
  designUrl?: string; // Cloudinary
  designId?: number;  // 🆕 ID du design créé / utilisé
}
```

---

## 3. 🔗 Exemples de Requêtes

### 3.1 Création Produit (vendeur)

```ts
await fetch('/api/vendor/products', {
  method: 'POST',
  credentials: 'include', // IMPORTANT
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    baseProductId: 4,
    productStructure: { /* … */ },
    vendorPrice: 25000,
    vendorName: 'T-shirt Dragon Premium',
    vendorDescription: 'Edition limitée',
    vendorStock: 100,
    selectedColors: [...],
    selectedSizes:  [...],
    finalImagesBase64: { design: dataURL },
    postValidationAction: 'AUTO_PUBLISH' // ou 'TO_DRAFT'
  })
});
```

### 3.2 Modifier l'action post-validation

```ts
await fetch(`/api/vendor-product-validation/post-validation-action/${productId}`, {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ postValidationAction: 'TO_DRAFT' })
});
```

### 3.3 Publier manuellement un produit validé (vendeur)

```ts
await fetch(`/api/vendor-product-validation/publish/${productId}`, {
  method: 'POST',
  credentials: 'include'
});
```

### 3.4 Validation design (admin)

```ts
await fetch(`/api/designs/${designId}/validate`, {
  method: 'PUT',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'VALIDATE' })
});
```

---

## 4. ⚛️ Service API (extrait)

```ts
export class CascadeValidationService {
  private base = '/api/vendor-product-validation';

  // Toujours credentials: 'include'
  private options(method: string, body?: any): RequestInit {
    return {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    };
  }

  updatePostValidationAction(id: number, action: PostValidationAction) {
    return fetch(`${this.base}/post-validation-action/${id}`, this.options('PUT', { postValidationAction: action }));
  }

  publishValidatedProduct(id: number) {
    return fetch(`${this.base}/publish/${id}`, this.options('POST'));
  }

  getPendingProducts(page = 1, limit = 20) {
    return fetch(`${this.base}/pending?page=${page}&limit=${limit}`, this.options('GET'));
  }

  getStats() {
    return fetch(`${this.base}/stats`, this.options('GET'));
  }
}
```

---

## 5. 🖥️ Composants / UI (rappel)

* `ProductStatusBadge` → affiche `PUBLISHED` / `DRAFT` / `PENDING`.
* `PostValidationActionSelector` → radio-buttons pour `AUTO_PUBLISH` ou `TO_DRAFT`.
* `PublishButton` → visible uniquement si `status==='DRAFT' && isValidated`.

> Les exemples complets se trouvent déjà dans `FRONTEND_CASCADE_VALIDATION_V2_IMPLEMENTATION_GUIDE.md`. Seule la gestion de l'option `credentials: 'include'` et l'ajout du champ `postValidationAction` changent.

---

## 6. 🧪 Tests Frontend Rapides

1. Créer un produit en choisissant `AUTO_PUBLISH` → après validation admin, le badge doit passer à « Publié ».
2. Créer un produit en `TO_DRAFT` → après validation, badge « Prêt à publier » + bouton « Publier ».
3. Changer l'action post-validation avant validation admin et vérifier le résultat.

---

## 7. 🚦 Bonnes Pratiques

* Toujours `credentials: 'include'` (cookies).
* Vérifier la propriété `needsValidation` dans la réponse de création pour afficher un indicateur.
* Écouter les WebSockets/notifications pour rafraîchir la liste en temps réel.
* Gérer les erreurs (`status 403/401`) en redirigeant vers le login si besoin.

---

## 8. 📜 Changelog V3 vs V2

| Élément | V2 | V3 |
|---------|----|----|
| Champ `postValidationAction` (request) | manquant | **ajouté** |
| Champ `designId` (response) | absent | **ajouté** |
| Auth | `Authorization: Bearer` | **cookies + `credentials: 'include'`** |
| Cascade | V2 (liens améliorés) | **V3 triple-fallback + fixes** |

---

🎉 **Intégration prête !**  Le frontend peut maintenant consommer les endpoints corrigés avec la configuration `credentials: 'include'` et la nouvelle propriété `postValidationAction`. 