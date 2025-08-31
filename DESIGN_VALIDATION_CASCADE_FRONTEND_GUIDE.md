# Guide – Cascade de validation Design → Produits (Frontend)

Lorsque l’admin valide ou rejette un design, le back-end applique automatiquement une mise à jour sur tous les produits vendeur liés.

## 1. Rappel endpoint admin
```
PUT /api/designs/{id}/validate
```
Corps :
```json
{
  "action": "VALIDATE" | "REJECT",
  "rejectionReason?": "…"
}
```

## 2. Effet backend
| Champ produit | Avant | Après *VALIDATE* | Après *REJECT* |
|---------------|-------|------------------|----------------|
| `status` | `PENDING` | `PUBLISHED` ou `DRAFT`* | `DRAFT` |
| `isValidated` | `false` | `true` | `false` |
| `validatedAt` | `null` | Date ISO | Date ISO |

*Le choix *PUBLISHED/DRAFT* dépend du champ `postValidationAction` que le vendeur a défini :
* `AUTO_PUBLISH` → `PUBLISHED`
* `TO_DRAFT` → `DRAFT`

## 3. Flux temps réel conseillé
1. L’admin appelle `PUT /validate`.
2. Le back renvoie l’objet *Design* mis à jour **et** met à jour tous les produits.
3. Pour mettre à jour le tableau des produits vendeur :
   * Option simple : rafraîchir la liste (`GET /vendor/products`) après confirmation.
   * Option temps réel : écouter le Socket
     ```
     vendorProduct.validated
     vendorProduct.rejected
     ```

## 4. Côté Front vendeur
Dans la page *Mes produits* :
* Sur réception de l’événement ou d’un nouveau fetch, filtrer :
  ```ts
  const published = products.filter(p => p.status === 'PUBLISHED');
  const drafts    = products.filter(p => p.status === 'DRAFT' && p.isValidated);
  const pending   = products.filter(p => p.status === 'PENDING');
  ```
* Désactiver le bouton « Modifier design » si le produit est déjà validé.

## 5. Côté Front admin
Après la validation d’un design :
* Rafraîchir la liste des designs en attente (`/api/designs/admin/pending`).
* Optionnel : rafraîchir le tableau de produits vendeur si affiché.

## 6. Résumé UI
* **VALIDATE**
  * Produits passent en `PUBLISHED` (auto) ou `DRAFT` (choix vendeur).
  * Le vendeur peut utiliser le bouton « Publier » sur les brouillons validés.
* **REJECT**
  * Tous les produits passent en `DRAFT`, `isValidated = false`, `rejectionReason` copié.
  * Afficher le motif de rejet dans la fiche produit.

---
Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Lorsque l’admin valide ou rejette un design, le back-end applique automatiquement une mise à jour sur tous les produits vendeur liés.

## 1. Rappel endpoint admin
```
PUT /api/designs/{id}/validate
```
Corps :
```json
{
  "action": "VALIDATE" | "REJECT",
  "rejectionReason?": "…"
}
```

## 2. Effet backend
| Champ produit | Avant | Après *VALIDATE* | Après *REJECT* |
|---------------|-------|------------------|----------------|
| `status` | `PENDING` | `PUBLISHED` ou `DRAFT`* | `DRAFT` |
| `isValidated` | `false` | `true` | `false` |
| `validatedAt` | `null` | Date ISO | Date ISO |

*Le choix *PUBLISHED/DRAFT* dépend du champ `postValidationAction` que le vendeur a défini :
* `AUTO_PUBLISH` → `PUBLISHED`
* `TO_DRAFT` → `DRAFT`

## 3. Flux temps réel conseillé
1. L’admin appelle `PUT /validate`.
2. Le back renvoie l’objet *Design* mis à jour **et** met à jour tous les produits.
3. Pour mettre à jour le tableau des produits vendeur :
   * Option simple : rafraîchir la liste (`GET /vendor/products`) après confirmation.
   * Option temps réel : écouter le Socket
     ```
     vendorProduct.validated
     vendorProduct.rejected
     ```

## 4. Côté Front vendeur
Dans la page *Mes produits* :
* Sur réception de l’événement ou d’un nouveau fetch, filtrer :
  ```ts
  const published = products.filter(p => p.status === 'PUBLISHED');
  const drafts    = products.filter(p => p.status === 'DRAFT' && p.isValidated);
  const pending   = products.filter(p => p.status === 'PENDING');
  ```
* Désactiver le bouton « Modifier design » si le produit est déjà validé.

## 5. Côté Front admin
Après la validation d’un design :
* Rafraîchir la liste des designs en attente (`/api/designs/admin/pending`).
* Optionnel : rafraîchir le tableau de produits vendeur si affiché.

## 6. Résumé UI
* **VALIDATE**
  * Produits passent en `PUBLISHED` (auto) ou `DRAFT` (choix vendeur).
  * Le vendeur peut utiliser le bouton « Publier » sur les brouillons validés.
* **REJECT**
  * Tous les produits passent en `DRAFT`, `isValidated = false`, `rejectionReason` copié.
  * Afficher le motif de rejet dans la fiche produit.

---
Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Lorsque l’admin valide ou rejette un design, le back-end applique automatiquement une mise à jour sur tous les produits vendeur liés.

## 1. Rappel endpoint admin
```
PUT /api/designs/{id}/validate
```
Corps :
```json
{
  "action": "VALIDATE" | "REJECT",
  "rejectionReason?": "…"
}
```

## 2. Effet backend
| Champ produit | Avant | Après *VALIDATE* | Après *REJECT* |
|---------------|-------|------------------|----------------|
| `status` | `PENDING` | `PUBLISHED` ou `DRAFT`* | `DRAFT` |
| `isValidated` | `false` | `true` | `false` |
| `validatedAt` | `null` | Date ISO | Date ISO |

*Le choix *PUBLISHED/DRAFT* dépend du champ `postValidationAction` que le vendeur a défini :
* `AUTO_PUBLISH` → `PUBLISHED`
* `TO_DRAFT` → `DRAFT`

## 3. Flux temps réel conseillé
1. L’admin appelle `PUT /validate`.
2. Le back renvoie l’objet *Design* mis à jour **et** met à jour tous les produits.
3. Pour mettre à jour le tableau des produits vendeur :
   * Option simple : rafraîchir la liste (`GET /vendor/products`) après confirmation.
   * Option temps réel : écouter le Socket
     ```
     vendorProduct.validated
     vendorProduct.rejected
     ```

## 4. Côté Front vendeur
Dans la page *Mes produits* :
* Sur réception de l’événement ou d’un nouveau fetch, filtrer :
  ```ts
  const published = products.filter(p => p.status === 'PUBLISHED');
  const drafts    = products.filter(p => p.status === 'DRAFT' && p.isValidated);
  const pending   = products.filter(p => p.status === 'PENDING');
  ```
* Désactiver le bouton « Modifier design » si le produit est déjà validé.

## 5. Côté Front admin
Après la validation d’un design :
* Rafraîchir la liste des designs en attente (`/api/designs/admin/pending`).
* Optionnel : rafraîchir le tableau de produits vendeur si affiché.

## 6. Résumé UI
* **VALIDATE**
  * Produits passent en `PUBLISHED` (auto) ou `DRAFT` (choix vendeur).
  * Le vendeur peut utiliser le bouton « Publier » sur les brouillons validés.
* **REJECT**
  * Tous les produits passent en `DRAFT`, `isValidated = false`, `rejectionReason` copié.
  * Afficher le motif de rejet dans la fiche produit.

---
Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Lorsque l’admin valide ou rejette un design, le back-end applique automatiquement une mise à jour sur tous les produits vendeur liés.

## 1. Rappel endpoint admin
```
PUT /api/designs/{id}/validate
```
Corps :
```json
{
  "action": "VALIDATE" | "REJECT",
  "rejectionReason?": "…"
}
```

## 2. Effet backend
| Champ produit | Avant | Après *VALIDATE* | Après *REJECT* |
|---------------|-------|------------------|----------------|
| `status` | `PENDING` | `PUBLISHED` ou `DRAFT`* | `DRAFT` |
| `isValidated` | `false` | `true` | `false` |
| `validatedAt` | `null` | Date ISO | Date ISO |

*Le choix *PUBLISHED/DRAFT* dépend du champ `postValidationAction` que le vendeur a défini :
* `AUTO_PUBLISH` → `PUBLISHED`
* `TO_DRAFT` → `DRAFT`

## 3. Flux temps réel conseillé
1. L’admin appelle `PUT /validate`.
2. Le back renvoie l’objet *Design* mis à jour **et** met à jour tous les produits.
3. Pour mettre à jour le tableau des produits vendeur :
   * Option simple : rafraîchir la liste (`GET /vendor/products`) après confirmation.
   * Option temps réel : écouter le Socket
     ```
     vendorProduct.validated
     vendorProduct.rejected
     ```

## 4. Côté Front vendeur
Dans la page *Mes produits* :
* Sur réception de l’événement ou d’un nouveau fetch, filtrer :
  ```ts
  const published = products.filter(p => p.status === 'PUBLISHED');
  const drafts    = products.filter(p => p.status === 'DRAFT' && p.isValidated);
  const pending   = products.filter(p => p.status === 'PENDING');
  ```
* Désactiver le bouton « Modifier design » si le produit est déjà validé.

## 5. Côté Front admin
Après la validation d’un design :
* Rafraîchir la liste des designs en attente (`/api/designs/admin/pending`).
* Optionnel : rafraîchir le tableau de produits vendeur si affiché.

## 6. Résumé UI
* **VALIDATE**
  * Produits passent en `PUBLISHED` (auto) ou `DRAFT` (choix vendeur).
  * Le vendeur peut utiliser le bouton « Publier » sur les brouillons validés.
* **REJECT**
  * Tous les produits passent en `DRAFT`, `isValidated = false`, `rejectionReason` copié.
  * Afficher le motif de rejet dans la fiche produit.

---
Dernière mise à jour : 2025-07-05 
 
 
 
 
 