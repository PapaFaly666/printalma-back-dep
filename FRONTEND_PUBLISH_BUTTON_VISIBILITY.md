# Règles d’affichage du bouton « Publier » (produits vendeurs)

L’objectif est de garantir que le bouton **Publier** ne s’affiche que lorsque l’action est réellement possible côté back-end.

## 1. Modèle de données minimal
Le composant reçoit (par API `/vendor-product-validation/…` ou `/api/designs/admin/all`) un objet `VendorProduct` similaire :
```ts
interface VendorProduct {
  id: number;
  status: 'PENDING' | 'PUBLISHED' | 'DRAFT';
  isValidated: boolean; // validé par l’admin
  // … autres champs
}
```

## 2. Conditions à réunir
1. `status === 'DRAFT'`  
2. `isValidated === true`

→ Si l’une de ces conditions n’est pas remplie, masquer ou désactiver le bouton.

## 3. Exemple React (TSX)
```tsx
const canPublish = product.status === 'DRAFT' && product.isValidated;

{canPublish && (
  <Button onClick={() => publish(product.id)}>Publier</Button>
)}
```

## 4. UX : états du bouton
| Cas | Affichage | Action | Tooltip/Message |
|-----|-----------|--------|-----------------|
| Brouillon **et** validé | Bouton « Publier » actif | Appelle `POST /vendor-product-validation/publish/{id}` | – |
| Brouillon **mais non** validé | Bouton grisé ou absent | Aucune | « En attente de validation admin » |
| Déjà publié | Bouton absent | – | – |
| En attente (`PENDING`) | Bouton absent | – | – |

## 5. Rappel backend
Endpoint : `POST /vendor-product-validation/publish/{productId}`  
Réponse : `{ success, message, newStatus: 'PUBLISHED' }`

Le backend renvoie **400** si :
* le produit n’est pas **DRAFT**,
* OU pas `isValidated`.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

L’objectif est de garantir que le bouton **Publier** ne s’affiche que lorsque l’action est réellement possible côté back-end.

## 1. Modèle de données minimal
Le composant reçoit (par API `/vendor-product-validation/…` ou `/api/designs/admin/all`) un objet `VendorProduct` similaire :
```ts
interface VendorProduct {
  id: number;
  status: 'PENDING' | 'PUBLISHED' | 'DRAFT';
  isValidated: boolean; // validé par l’admin
  // … autres champs
}
```

## 2. Conditions à réunir
1. `status === 'DRAFT'`  
2. `isValidated === true`

→ Si l’une de ces conditions n’est pas remplie, masquer ou désactiver le bouton.

## 3. Exemple React (TSX)
```tsx
const canPublish = product.status === 'DRAFT' && product.isValidated;

{canPublish && (
  <Button onClick={() => publish(product.id)}>Publier</Button>
)}
```

## 4. UX : états du bouton
| Cas | Affichage | Action | Tooltip/Message |
|-----|-----------|--------|-----------------|
| Brouillon **et** validé | Bouton « Publier » actif | Appelle `POST /vendor-product-validation/publish/{id}` | – |
| Brouillon **mais non** validé | Bouton grisé ou absent | Aucune | « En attente de validation admin » |
| Déjà publié | Bouton absent | – | – |
| En attente (`PENDING`) | Bouton absent | – | – |

## 5. Rappel backend
Endpoint : `POST /vendor-product-validation/publish/{productId}`  
Réponse : `{ success, message, newStatus: 'PUBLISHED' }`

Le backend renvoie **400** si :
* le produit n’est pas **DRAFT**,
* OU pas `isValidated`.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

L’objectif est de garantir que le bouton **Publier** ne s’affiche que lorsque l’action est réellement possible côté back-end.

## 1. Modèle de données minimal
Le composant reçoit (par API `/vendor-product-validation/…` ou `/api/designs/admin/all`) un objet `VendorProduct` similaire :
```ts
interface VendorProduct {
  id: number;
  status: 'PENDING' | 'PUBLISHED' | 'DRAFT';
  isValidated: boolean; // validé par l’admin
  // … autres champs
}
```

## 2. Conditions à réunir
1. `status === 'DRAFT'`  
2. `isValidated === true`

→ Si l’une de ces conditions n’est pas remplie, masquer ou désactiver le bouton.

## 3. Exemple React (TSX)
```tsx
const canPublish = product.status === 'DRAFT' && product.isValidated;

{canPublish && (
  <Button onClick={() => publish(product.id)}>Publier</Button>
)}
```

## 4. UX : états du bouton
| Cas | Affichage | Action | Tooltip/Message |
|-----|-----------|--------|-----------------|
| Brouillon **et** validé | Bouton « Publier » actif | Appelle `POST /vendor-product-validation/publish/{id}` | – |
| Brouillon **mais non** validé | Bouton grisé ou absent | Aucune | « En attente de validation admin » |
| Déjà publié | Bouton absent | – | – |
| En attente (`PENDING`) | Bouton absent | – | – |

## 5. Rappel backend
Endpoint : `POST /vendor-product-validation/publish/{productId}`  
Réponse : `{ success, message, newStatus: 'PUBLISHED' }`

Le backend renvoie **400** si :
* le produit n’est pas **DRAFT**,
* OU pas `isValidated`.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 

L’objectif est de garantir que le bouton **Publier** ne s’affiche que lorsque l’action est réellement possible côté back-end.

## 1. Modèle de données minimal
Le composant reçoit (par API `/vendor-product-validation/…` ou `/api/designs/admin/all`) un objet `VendorProduct` similaire :
```ts
interface VendorProduct {
  id: number;
  status: 'PENDING' | 'PUBLISHED' | 'DRAFT';
  isValidated: boolean; // validé par l’admin
  // … autres champs
}
```

## 2. Conditions à réunir
1. `status === 'DRAFT'`  
2. `isValidated === true`

→ Si l’une de ces conditions n’est pas remplie, masquer ou désactiver le bouton.

## 3. Exemple React (TSX)
```tsx
const canPublish = product.status === 'DRAFT' && product.isValidated;

{canPublish && (
  <Button onClick={() => publish(product.id)}>Publier</Button>
)}
```

## 4. UX : états du bouton
| Cas | Affichage | Action | Tooltip/Message |
|-----|-----------|--------|-----------------|
| Brouillon **et** validé | Bouton « Publier » actif | Appelle `POST /vendor-product-validation/publish/{id}` | – |
| Brouillon **mais non** validé | Bouton grisé ou absent | Aucune | « En attente de validation admin » |
| Déjà publié | Bouton absent | – | – |
| En attente (`PENDING`) | Bouton absent | – | – |

## 5. Rappel backend
Endpoint : `POST /vendor-product-validation/publish/{productId}`  
Réponse : `{ success, message, newStatus: 'PUBLISHED' }`

Le backend renvoie **400** si :
* le produit n’est pas **DRAFT**,
* OU pas `isValidated`.

---

Dernière mise à jour : 2025-07-05 
 
 
 
 
 