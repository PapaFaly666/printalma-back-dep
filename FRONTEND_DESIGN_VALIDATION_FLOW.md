# Front-end Guide : Affichage et suivi du cycle de vie d'un design

Ce document synthétise tout ce qu'il faut connaître côté front pour :
1. lister les designs d'un vendeur ;
2. mettre à jour l'interface en temps réel après validation admin ;
3. gérer la création, la soumission et la consultation des statuts.

---

## 1. Modèle de données côté front

```ts
export interface Design {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  price: number;
  category: 'logo' | 'pattern' | 'illustration' | 'typography' | 'abstract';
  tags: string[];

  /* Statuts back */
  isDraft: boolean;
  isPending: boolean;
  isPublished: boolean;
  isValidated: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  rejectionReason?: string;
  submittedForValidationAt?: string; // ISO-date
  validatedAt?: string;              // ISO-date
}
```

> Le champ `validationStatus` est déjà fourni par l'API et peut être utilisé directement pour le rendu (badge de couleur, etc.).

---

## 2. Endpoints disponibles

| Action | Méthode & URL | Headers | Body | Réponse (succès) |
|--------|---------------|---------|------|------------------|
| Créer un design | `POST /api/designs` | `Authorization: Bearer <token>` – `Content-Type: multipart/form-data` | champs `file`, `name`, `price`, `category`, … | `{ success, data: Design }` |
| Lister mes designs | `GET /api/designs` | Auth | Query params `page`, `limit`, `category`, `status`, `search` | `{ success, data: { designs: Design[], pagination } }` |
| Soumettre à validation | `POST /api/designs/{id}/submit-for-validation` | Auth | – | `{ success, message, data: Design }` |
| Obtenir status léger | `GET /api/designs/{id}/validation-status` | Auth | – | `{ success, data: { id, validationStatus, … } }` |
| (Admin) Lister en attente | `GET /api/designs/admin/pending` | Auth admin | Query `page`, `limit`, `search` | idem | 
| (Admin) Valider / rejeter | `PUT /api/designs/{id}/validate` | Auth admin – `Content-Type: application/json` | `{ action: 'VALIDATE' }` ou `{ action: 'REJECT', rejectionReason: '…' }` | `{ success, data: Design }` |

---

## 3. Workflow recommandé côté vendeur

1. **Création** : upload via `POST /api/designs` → la réponse contient `isDraft = true`.
2. **Edition éventuelle puis soumission** : `POST /api/designs/{id}/submit-for-validation` ;
3. **Polling (ou WebSocket)** : appeler périodiquement `GET /api/designs/{id}/validation-status` (ou rafraîchir la liste) pour afficher le badge `PENDING`, `VALIDATED`, `REJECTED`.
4. **Après validation** : le champ `isPublished` passe à `true` si l'admin a validé *et* le vendeur avait choisi une action d'auto-publication. Sinon le design reste validé mais non publié.

### Exemple React :

```ts
const fetchVendorDesigns = async (status: string = 'ALL') => {
  const { data } = await axios.get('/api/designs', {
    headers: { Authorization: `Bearer ${token}` },
    params: { status, page: 1, limit: 20 }
  });
  return data.data.designs as Design[];
};
```

---

## 4. Workflow côté admin

1. Table "Designs en attente" : `GET /api/designs/admin/pending`.
2. Clique sur **Valider** ⇒ `PUT /api/designs/{id}/validate` avec `{ action: 'VALIDATE' }`.
3. Clique sur **Rejeter** ⇒ même endpoint avec `{ action: 'REJECT', rejectionReason: '…' }`.
4. Le backend applique automatiquement la cascade sur les produits liés.

---

## 5. Rendu UI suggéré

| Statut | Couleur badge | Icône | Commentaire |
|--------|---------------|-------|-------------|
| DRAFT | gris | ✏️ | Visible uniquement au vendeur ; bouton "Soumettre" |
| PENDING | orange | ⏳ | Attente admin |
| VALIDATED | vert | ✅ | Affiché aux vendeurs & admins |
| REJECTED | rouge | ❌ | Tooltip/Modal montrant `rejectionReason` |

---

## 6. Gestion temps réel

* Option **simple** : refresh manuel ou polling.
* Option **avancée** : écoute WebSocket `designs.<vendorId>.validated` & `designs.<vendorId>.rejected` (événements émis dans `DesignService.notifyVendorDesignApproved/Rejected`).

Exemple (Socket.io) :
```ts
socket.on('design.validated', (design: Design) => {
  toast.success(`${design.name} a été validé !`);
  queryClient.invalidateQueries(['designs']);
});
```

---

## 7. Cas d'erreur fréquents

| Message backend | Explication | Correction côté front |
|-----------------|------------|-----------------------|
| `Le design n'est pas en brouillon` | Vous tentez de soumettre un design déjà en attente ou validé | Désactiver le bouton "Soumettre" si `!isDraft` |
| `Catégorie invalide` | Valeur hors énum | Utiliser l'énum listée dans le formulaire |
| `Une raison de rejet est obligatoire…` | L'admin a choisi **REJECT** sans motif | Valider le textarea côté UI |

---

## 8. Checklist UI

- [ ] Formulaire de création avec champs obligatoires (name, price, category, file).
- [ ] Listing filtrable (status, category, search).
- [ ] Badge de statut & couleur.
- [ ] Bouton "Soumettre" visible seulement si `isDraft`.
- [ ] Affichage de `rejectionReason` si présent.
- [ ] Notifications temps réel ou polling.

---

© PrintAlma – Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Ce document synthétise tout ce qu'il faut connaître côté front pour :
1. lister les designs d'un vendeur ;
2. mettre à jour l'interface en temps réel après validation admin ;
3. gérer la création, la soumission et la consultation des statuts.

---

## 1. Modèle de données côté front

```ts
export interface Design {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  price: number;
  category: 'logo' | 'pattern' | 'illustration' | 'typography' | 'abstract';
  tags: string[];

  /* Statuts back */
  isDraft: boolean;
  isPending: boolean;
  isPublished: boolean;
  isValidated: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  rejectionReason?: string;
  submittedForValidationAt?: string; // ISO-date
  validatedAt?: string;              // ISO-date
}
```

> Le champ `validationStatus` est déjà fourni par l'API et peut être utilisé directement pour le rendu (badge de couleur, etc.).

---

## 2. Endpoints disponibles

| Action | Méthode & URL | Headers | Body | Réponse (succès) |
|--------|---------------|---------|------|------------------|
| Créer un design | `POST /api/designs` | `Authorization: Bearer <token>` – `Content-Type: multipart/form-data` | champs `file`, `name`, `price`, `category`, … | `{ success, data: Design }` |
| Lister mes designs | `GET /api/designs` | Auth | Query params `page`, `limit`, `category`, `status`, `search` | `{ success, data: { designs: Design[], pagination } }` |
| Soumettre à validation | `POST /api/designs/{id}/submit-for-validation` | Auth | – | `{ success, message, data: Design }` |
| Obtenir status léger | `GET /api/designs/{id}/validation-status` | Auth | – | `{ success, data: { id, validationStatus, … } }` |
| (Admin) Lister en attente | `GET /api/designs/admin/pending` | Auth admin | Query `page`, `limit`, `search` | idem | 
| (Admin) Valider / rejeter | `PUT /api/designs/{id}/validate` | Auth admin – `Content-Type: application/json` | `{ action: 'VALIDATE' }` ou `{ action: 'REJECT', rejectionReason: '…' }` | `{ success, data: Design }` |

---

## 3. Workflow recommandé côté vendeur

1. **Création** : upload via `POST /api/designs` → la réponse contient `isDraft = true`.
2. **Edition éventuelle puis soumission** : `POST /api/designs/{id}/submit-for-validation` ;
3. **Polling (ou WebSocket)** : appeler périodiquement `GET /api/designs/{id}/validation-status` (ou rafraîchir la liste) pour afficher le badge `PENDING`, `VALIDATED`, `REJECTED`.
4. **Après validation** : le champ `isPublished` passe à `true` si l'admin a validé *et* le vendeur avait choisi une action d'auto-publication. Sinon le design reste validé mais non publié.

### Exemple React :

```ts
const fetchVendorDesigns = async (status: string = 'ALL') => {
  const { data } = await axios.get('/api/designs', {
    headers: { Authorization: `Bearer ${token}` },
    params: { status, page: 1, limit: 20 }
  });
  return data.data.designs as Design[];
};
```

---

## 4. Workflow côté admin

1. Table "Designs en attente" : `GET /api/designs/admin/pending`.
2. Clique sur **Valider** ⇒ `PUT /api/designs/{id}/validate` avec `{ action: 'VALIDATE' }`.
3. Clique sur **Rejeter** ⇒ même endpoint avec `{ action: 'REJECT', rejectionReason: '…' }`.
4. Le backend applique automatiquement la cascade sur les produits liés.

---

## 5. Rendu UI suggéré

| Statut | Couleur badge | Icône | Commentaire |
|--------|---------------|-------|-------------|
| DRAFT | gris | ✏️ | Visible uniquement au vendeur ; bouton "Soumettre" |
| PENDING | orange | ⏳ | Attente admin |
| VALIDATED | vert | ✅ | Affiché aux vendeurs & admins |
| REJECTED | rouge | ❌ | Tooltip/Modal montrant `rejectionReason` |

---

## 6. Gestion temps réel

* Option **simple** : refresh manuel ou polling.
* Option **avancée** : écoute WebSocket `designs.<vendorId>.validated` & `designs.<vendorId>.rejected` (événements émis dans `DesignService.notifyVendorDesignApproved/Rejected`).

Exemple (Socket.io) :
```ts
socket.on('design.validated', (design: Design) => {
  toast.success(`${design.name} a été validé !`);
  queryClient.invalidateQueries(['designs']);
});
```

---

## 7. Cas d'erreur fréquents

| Message backend | Explication | Correction côté front |
|-----------------|------------|-----------------------|
| `Le design n'est pas en brouillon` | Vous tentez de soumettre un design déjà en attente ou validé | Désactiver le bouton "Soumettre" si `!isDraft` |
| `Catégorie invalide` | Valeur hors énum | Utiliser l'énum listée dans le formulaire |
| `Une raison de rejet est obligatoire…` | L'admin a choisi **REJECT** sans motif | Valider le textarea côté UI |

---

## 8. Checklist UI

- [ ] Formulaire de création avec champs obligatoires (name, price, category, file).
- [ ] Listing filtrable (status, category, search).
- [ ] Badge de statut & couleur.
- [ ] Bouton "Soumettre" visible seulement si `isDraft`.
- [ ] Affichage de `rejectionReason` si présent.
- [ ] Notifications temps réel ou polling.

---

© PrintAlma – Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Ce document synthétise tout ce qu'il faut connaître côté front pour :
1. lister les designs d'un vendeur ;
2. mettre à jour l'interface en temps réel après validation admin ;
3. gérer la création, la soumission et la consultation des statuts.

---

## 1. Modèle de données côté front

```ts
export interface Design {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  price: number;
  category: 'logo' | 'pattern' | 'illustration' | 'typography' | 'abstract';
  tags: string[];

  /* Statuts back */
  isDraft: boolean;
  isPending: boolean;
  isPublished: boolean;
  isValidated: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  rejectionReason?: string;
  submittedForValidationAt?: string; // ISO-date
  validatedAt?: string;              // ISO-date
}
```

> Le champ `validationStatus` est déjà fourni par l'API et peut être utilisé directement pour le rendu (badge de couleur, etc.).

---

## 2. Endpoints disponibles

| Action | Méthode & URL | Headers | Body | Réponse (succès) |
|--------|---------------|---------|------|------------------|
| Créer un design | `POST /api/designs` | `Authorization: Bearer <token>` – `Content-Type: multipart/form-data` | champs `file`, `name`, `price`, `category`, … | `{ success, data: Design }` |
| Lister mes designs | `GET /api/designs` | Auth | Query params `page`, `limit`, `category`, `status`, `search` | `{ success, data: { designs: Design[], pagination } }` |
| Soumettre à validation | `POST /api/designs/{id}/submit-for-validation` | Auth | – | `{ success, message, data: Design }` |
| Obtenir status léger | `GET /api/designs/{id}/validation-status` | Auth | – | `{ success, data: { id, validationStatus, … } }` |
| (Admin) Lister en attente | `GET /api/designs/admin/pending` | Auth admin | Query `page`, `limit`, `search` | idem | 
| (Admin) Valider / rejeter | `PUT /api/designs/{id}/validate` | Auth admin – `Content-Type: application/json` | `{ action: 'VALIDATE' }` ou `{ action: 'REJECT', rejectionReason: '…' }` | `{ success, data: Design }` |

---

## 3. Workflow recommandé côté vendeur

1. **Création** : upload via `POST /api/designs` → la réponse contient `isDraft = true`.
2. **Edition éventuelle puis soumission** : `POST /api/designs/{id}/submit-for-validation` ;
3. **Polling (ou WebSocket)** : appeler périodiquement `GET /api/designs/{id}/validation-status` (ou rafraîchir la liste) pour afficher le badge `PENDING`, `VALIDATED`, `REJECTED`.
4. **Après validation** : le champ `isPublished` passe à `true` si l'admin a validé *et* le vendeur avait choisi une action d'auto-publication. Sinon le design reste validé mais non publié.

### Exemple React :

```ts
const fetchVendorDesigns = async (status: string = 'ALL') => {
  const { data } = await axios.get('/api/designs', {
    headers: { Authorization: `Bearer ${token}` },
    params: { status, page: 1, limit: 20 }
  });
  return data.data.designs as Design[];
};
```

---

## 4. Workflow côté admin

1. Table "Designs en attente" : `GET /api/designs/admin/pending`.
2. Clique sur **Valider** ⇒ `PUT /api/designs/{id}/validate` avec `{ action: 'VALIDATE' }`.
3. Clique sur **Rejeter** ⇒ même endpoint avec `{ action: 'REJECT', rejectionReason: '…' }`.
4. Le backend applique automatiquement la cascade sur les produits liés.

---

## 5. Rendu UI suggéré

| Statut | Couleur badge | Icône | Commentaire |
|--------|---------------|-------|-------------|
| DRAFT | gris | ✏️ | Visible uniquement au vendeur ; bouton "Soumettre" |
| PENDING | orange | ⏳ | Attente admin |
| VALIDATED | vert | ✅ | Affiché aux vendeurs & admins |
| REJECTED | rouge | ❌ | Tooltip/Modal montrant `rejectionReason` |

---

## 6. Gestion temps réel

* Option **simple** : refresh manuel ou polling.
* Option **avancée** : écoute WebSocket `designs.<vendorId>.validated` & `designs.<vendorId>.rejected` (événements émis dans `DesignService.notifyVendorDesignApproved/Rejected`).

Exemple (Socket.io) :
```ts
socket.on('design.validated', (design: Design) => {
  toast.success(`${design.name} a été validé !`);
  queryClient.invalidateQueries(['designs']);
});
```

---

## 7. Cas d'erreur fréquents

| Message backend | Explication | Correction côté front |
|-----------------|------------|-----------------------|
| `Le design n'est pas en brouillon` | Vous tentez de soumettre un design déjà en attente ou validé | Désactiver le bouton "Soumettre" si `!isDraft` |
| `Catégorie invalide` | Valeur hors énum | Utiliser l'énum listée dans le formulaire |
| `Une raison de rejet est obligatoire…` | L'admin a choisi **REJECT** sans motif | Valider le textarea côté UI |

---

## 8. Checklist UI

- [ ] Formulaire de création avec champs obligatoires (name, price, category, file).
- [ ] Listing filtrable (status, category, search).
- [ ] Badge de statut & couleur.
- [ ] Bouton "Soumettre" visible seulement si `isDraft`.
- [ ] Affichage de `rejectionReason` si présent.
- [ ] Notifications temps réel ou polling.

---

© PrintAlma – Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Ce document synthétise tout ce qu'il faut connaître côté front pour :
1. lister les designs d'un vendeur ;
2. mettre à jour l'interface en temps réel après validation admin ;
3. gérer la création, la soumission et la consultation des statuts.

---

## 1. Modèle de données côté front

```ts
export interface Design {
  id: number;
  name: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  price: number;
  category: 'logo' | 'pattern' | 'illustration' | 'typography' | 'abstract';
  tags: string[];

  /* Statuts back */
  isDraft: boolean;
  isPending: boolean;
  isPublished: boolean;
  isValidated: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  rejectionReason?: string;
  submittedForValidationAt?: string; // ISO-date
  validatedAt?: string;              // ISO-date
}
```

> Le champ `validationStatus` est déjà fourni par l'API et peut être utilisé directement pour le rendu (badge de couleur, etc.).

---

## 2. Endpoints disponibles

| Action | Méthode & URL | Headers | Body | Réponse (succès) |
|--------|---------------|---------|------|------------------|
| Créer un design | `POST /api/designs` | `Authorization: Bearer <token>` – `Content-Type: multipart/form-data` | champs `file`, `name`, `price`, `category`, … | `{ success, data: Design }` |
| Lister mes designs | `GET /api/designs` | Auth | Query params `page`, `limit`, `category`, `status`, `search` | `{ success, data: { designs: Design[], pagination } }` |
| Soumettre à validation | `POST /api/designs/{id}/submit-for-validation` | Auth | – | `{ success, message, data: Design }` |
| Obtenir status léger | `GET /api/designs/{id}/validation-status` | Auth | – | `{ success, data: { id, validationStatus, … } }` |
| (Admin) Lister en attente | `GET /api/designs/admin/pending` | Auth admin | Query `page`, `limit`, `search` | idem | 
| (Admin) Valider / rejeter | `PUT /api/designs/{id}/validate` | Auth admin – `Content-Type: application/json` | `{ action: 'VALIDATE' }` ou `{ action: 'REJECT', rejectionReason: '…' }` | `{ success, data: Design }` |

---

## 3. Workflow recommandé côté vendeur

1. **Création** : upload via `POST /api/designs` → la réponse contient `isDraft = true`.
2. **Edition éventuelle puis soumission** : `POST /api/designs/{id}/submit-for-validation` ;
3. **Polling (ou WebSocket)** : appeler périodiquement `GET /api/designs/{id}/validation-status` (ou rafraîchir la liste) pour afficher le badge `PENDING`, `VALIDATED`, `REJECTED`.
4. **Après validation** : le champ `isPublished` passe à `true` si l'admin a validé *et* le vendeur avait choisi une action d'auto-publication. Sinon le design reste validé mais non publié.

### Exemple React :

```ts
const fetchVendorDesigns = async (status: string = 'ALL') => {
  const { data } = await axios.get('/api/designs', {
    headers: { Authorization: `Bearer ${token}` },
    params: { status, page: 1, limit: 20 }
  });
  return data.data.designs as Design[];
};
```

---

## 4. Workflow côté admin

1. Table "Designs en attente" : `GET /api/designs/admin/pending`.
2. Clique sur **Valider** ⇒ `PUT /api/designs/{id}/validate` avec `{ action: 'VALIDATE' }`.
3. Clique sur **Rejeter** ⇒ même endpoint avec `{ action: 'REJECT', rejectionReason: '…' }`.
4. Le backend applique automatiquement la cascade sur les produits liés.

---

## 5. Rendu UI suggéré

| Statut | Couleur badge | Icône | Commentaire |
|--------|---------------|-------|-------------|
| DRAFT | gris | ✏️ | Visible uniquement au vendeur ; bouton "Soumettre" |
| PENDING | orange | ⏳ | Attente admin |
| VALIDATED | vert | ✅ | Affiché aux vendeurs & admins |
| REJECTED | rouge | ❌ | Tooltip/Modal montrant `rejectionReason` |

---

## 6. Gestion temps réel

* Option **simple** : refresh manuel ou polling.
* Option **avancée** : écoute WebSocket `designs.<vendorId>.validated` & `designs.<vendorId>.rejected` (événements émis dans `DesignService.notifyVendorDesignApproved/Rejected`).

Exemple (Socket.io) :
```ts
socket.on('design.validated', (design: Design) => {
  toast.success(`${design.name} a été validé !`);
  queryClient.invalidateQueries(['designs']);
});
```

---

## 7. Cas d'erreur fréquents

| Message backend | Explication | Correction côté front |
|-----------------|------------|-----------------------|
| `Le design n'est pas en brouillon` | Vous tentez de soumettre un design déjà en attente ou validé | Désactiver le bouton "Soumettre" si `!isDraft` |
| `Catégorie invalide` | Valeur hors énum | Utiliser l'énum listée dans le formulaire |
| `Une raison de rejet est obligatoire…` | L'admin a choisi **REJECT** sans motif | Valider le textarea côté UI |

---

## 8. Checklist UI

- [ ] Formulaire de création avec champs obligatoires (name, price, category, file).
- [ ] Listing filtrable (status, category, search).
- [ ] Badge de statut & couleur.
- [ ] Bouton "Soumettre" visible seulement si `isDraft`.
- [ ] Affichage de `rejectionReason` si présent.
- [ ] Notifications temps réel ou polling.

---

© PrintAlma – Dernière mise à jour : 2025-07-05 
 
 
 
 
 