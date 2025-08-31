# Guide Front-end Admin – Designs (v2 API)

Ce document sert de mémo rapide pour adapter votre front-office d’administration aux nouveaux endpoints de gestion des designs.

---

## 1. Base path unique

Tous les appels passent désormais par :
```
/api/designs
```
(Le préfixe historique `/admin/designs` n’existe plus.)

---

## 2. Endpoints disponibles (admin)

| Finalité | Méthode & URL | Query params | Corps | Réponse | Remplace l’ancien |
|----------|---------------|-------------|-------|---------|-------------------|
| **Lister les designs en attente** | `GET /api/designs/admin/pending` | `page`, `limit`, `search` | – | `{ success, data: { designs, pagination } }` | `GET /admin/designs?status=pending_validation` |
| **Lister TOUS les designs** | `GET /api/designs/admin/all` | `page`, `limit`, `search`, `status=PENDING|VALIDATED|REJECTED|ALL` | – | Même structure que ci-dessus | `GET /admin/designs/all` |
| **Valider / rejeter** | `PUT /api/designs/{id}/validate` | – | `{ action: 'VALIDATE' }` ou `{ action: 'REJECT', rejectionReason: '...' }` | `{ success, data: Design }` | `PUT /admin/designs/{id}/validate` (reste identique mais le préfixe change) |
| **Statistiques globales** | _Non fourni séparément_ : calculer à partir de la liste obtenue par `/api/designs/admin/all` | – | – | – | `GET /admin/designs/stats`, `/validation-stats` |

---

## 3. Champs utiles dans la réponse `Design`

```json5
{
  "id": 12,
  "name": "Logo Sport",
  "imageUrl": "https://…",
  "isPending": true,
  "isValidated": false,
  "validationStatus": "PENDING", // PENDING | VALIDATED | REJECTED
  "rejectionReason": null,
  "vendor": {
    "id": 4,
    "fullName": "John Doe",
    "shop_name": "DoePrint"
  },
  "linkedProducts": [ { /* … */ } ],
  "autoPublishCount": 3,
  "toDraftCount": 1
}
```

Vous pouvez ainsi construire :
* compteur **En attente** = `designs.filter(d => d.validationStatus === 'PENDING').length`
* compteur **Validés** = idem `VALIDATED`
* compteur **Rejetés** = idem `REJECTED`

---

## 4. Migration rapide de votre `designService.ts`

```diff
- const ADMIN_PREFIX = '/admin/designs';
+ const ADMIN_PREFIX = '/api/designs/admin';

// GET en attente
- axios.get(`${ADMIN_PREFIX}`, { params: { status: 'pending_validation', page, limit } })
+ axios.get(`${ADMIN_PREFIX}/pending`, { params: { page, limit, search } });

// GET tous
- axios.get(`${ADMIN_PREFIX}/all`, { params: { page, limit, status, sortBy, sortOrder } })
+ axios.get(`${ADMIN_PREFIX}/all`, { params: { page, limit, status, sortBy, sortOrder } });

// Stats  (supprimer l'appel réseau)
- axios.get(`${ADMIN_PREFIX}/stats`);
+ // Calculez localement après l'appel précédent.
```

---

## 5. Mapping des statuts

| Back-end | UI précédente | Remarque |
|----------|---------------|----------|
| `PENDING` | `pending_validation` | À convertir. |
| `VALIDATED` | `validated` | Identique. |
| `REJECTED` | `rejected` | Identique. |

---

## 6. Exemple React (admin)

```ts
// lister tout
const getAllDesigns = async (status = 'ALL') => {
  const { data } = await axios.get('/api/designs/admin/all', {
    params: { status, page: 1, limit: 20 },
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  return data.data.designs;
};

// valider
await axios.put(`/api/designs/${id}/validate`, { action: 'VALIDATE' }, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

---

## 7. Checklist de mise à jour

- [ ] Remplacer tous les préfixes d'URL (`/admin/designs…`) par `/api/designs/admin`.
- [ ] Mettre à jour la valeur de `status` envoyée (`PENDING`, pas `pending_validation`).
- [ ] Supprimer les appels à `/validation-stats` ou `/stats`, calculer côté front.
- [ ] Tester les endpoints en local (`localhost:<port>/api/designs/...`).

---

### Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Ce document sert de mémo rapide pour adapter votre front-office d’administration aux nouveaux endpoints de gestion des designs.

---

## 1. Base path unique

Tous les appels passent désormais par :
```
/api/designs
```
(Le préfixe historique `/admin/designs` n’existe plus.)

---

## 2. Endpoints disponibles (admin)

| Finalité | Méthode & URL | Query params | Corps | Réponse | Remplace l’ancien |
|----------|---------------|-------------|-------|---------|-------------------|
| **Lister les designs en attente** | `GET /api/designs/admin/pending` | `page`, `limit`, `search` | – | `{ success, data: { designs, pagination } }` | `GET /admin/designs?status=pending_validation` |
| **Lister TOUS les designs** | `GET /api/designs/admin/all` | `page`, `limit`, `search`, `status=PENDING|VALIDATED|REJECTED|ALL` | – | Même structure que ci-dessus | `GET /admin/designs/all` |
| **Valider / rejeter** | `PUT /api/designs/{id}/validate` | – | `{ action: 'VALIDATE' }` ou `{ action: 'REJECT', rejectionReason: '...' }` | `{ success, data: Design }` | `PUT /admin/designs/{id}/validate` (reste identique mais le préfixe change) |
| **Statistiques globales** | _Non fourni séparément_ : calculer à partir de la liste obtenue par `/api/designs/admin/all` | – | – | – | `GET /admin/designs/stats`, `/validation-stats` |

---

## 3. Champs utiles dans la réponse `Design`

```json5
{
  "id": 12,
  "name": "Logo Sport",
  "imageUrl": "https://…",
  "isPending": true,
  "isValidated": false,
  "validationStatus": "PENDING", // PENDING | VALIDATED | REJECTED
  "rejectionReason": null,
  "vendor": {
    "id": 4,
    "fullName": "John Doe",
    "shop_name": "DoePrint"
  },
  "linkedProducts": [ { /* … */ } ],
  "autoPublishCount": 3,
  "toDraftCount": 1
}
```

Vous pouvez ainsi construire :
* compteur **En attente** = `designs.filter(d => d.validationStatus === 'PENDING').length`
* compteur **Validés** = idem `VALIDATED`
* compteur **Rejetés** = idem `REJECTED`

---

## 4. Migration rapide de votre `designService.ts`

```diff
- const ADMIN_PREFIX = '/admin/designs';
+ const ADMIN_PREFIX = '/api/designs/admin';

// GET en attente
- axios.get(`${ADMIN_PREFIX}`, { params: { status: 'pending_validation', page, limit } })
+ axios.get(`${ADMIN_PREFIX}/pending`, { params: { page, limit, search } });

// GET tous
- axios.get(`${ADMIN_PREFIX}/all`, { params: { page, limit, status, sortBy, sortOrder } })
+ axios.get(`${ADMIN_PREFIX}/all`, { params: { page, limit, status, sortBy, sortOrder } });

// Stats  (supprimer l'appel réseau)
- axios.get(`${ADMIN_PREFIX}/stats`);
+ // Calculez localement après l'appel précédent.
```

---

## 5. Mapping des statuts

| Back-end | UI précédente | Remarque |
|----------|---------------|----------|
| `PENDING` | `pending_validation` | À convertir. |
| `VALIDATED` | `validated` | Identique. |
| `REJECTED` | `rejected` | Identique. |

---

## 6. Exemple React (admin)

```ts
// lister tout
const getAllDesigns = async (status = 'ALL') => {
  const { data } = await axios.get('/api/designs/admin/all', {
    params: { status, page: 1, limit: 20 },
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  return data.data.designs;
};

// valider
await axios.put(`/api/designs/${id}/validate`, { action: 'VALIDATE' }, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

---

## 7. Checklist de mise à jour

- [ ] Remplacer tous les préfixes d'URL (`/admin/designs…`) par `/api/designs/admin`.
- [ ] Mettre à jour la valeur de `status` envoyée (`PENDING`, pas `pending_validation`).
- [ ] Supprimer les appels à `/validation-stats` ou `/stats`, calculer côté front.
- [ ] Tester les endpoints en local (`localhost:<port>/api/designs/...`).

---

### Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Ce document sert de mémo rapide pour adapter votre front-office d’administration aux nouveaux endpoints de gestion des designs.

---

## 1. Base path unique

Tous les appels passent désormais par :
```
/api/designs
```
(Le préfixe historique `/admin/designs` n’existe plus.)

---

## 2. Endpoints disponibles (admin)

| Finalité | Méthode & URL | Query params | Corps | Réponse | Remplace l’ancien |
|----------|---------------|-------------|-------|---------|-------------------|
| **Lister les designs en attente** | `GET /api/designs/admin/pending` | `page`, `limit`, `search` | – | `{ success, data: { designs, pagination } }` | `GET /admin/designs?status=pending_validation` |
| **Lister TOUS les designs** | `GET /api/designs/admin/all` | `page`, `limit`, `search`, `status=PENDING|VALIDATED|REJECTED|ALL` | – | Même structure que ci-dessus | `GET /admin/designs/all` |
| **Valider / rejeter** | `PUT /api/designs/{id}/validate` | – | `{ action: 'VALIDATE' }` ou `{ action: 'REJECT', rejectionReason: '...' }` | `{ success, data: Design }` | `PUT /admin/designs/{id}/validate` (reste identique mais le préfixe change) |
| **Statistiques globales** | _Non fourni séparément_ : calculer à partir de la liste obtenue par `/api/designs/admin/all` | – | – | – | `GET /admin/designs/stats`, `/validation-stats` |

---

## 3. Champs utiles dans la réponse `Design`

```json5
{
  "id": 12,
  "name": "Logo Sport",
  "imageUrl": "https://…",
  "isPending": true,
  "isValidated": false,
  "validationStatus": "PENDING", // PENDING | VALIDATED | REJECTED
  "rejectionReason": null,
  "vendor": {
    "id": 4,
    "fullName": "John Doe",
    "shop_name": "DoePrint"
  },
  "linkedProducts": [ { /* … */ } ],
  "autoPublishCount": 3,
  "toDraftCount": 1
}
```

Vous pouvez ainsi construire :
* compteur **En attente** = `designs.filter(d => d.validationStatus === 'PENDING').length`
* compteur **Validés** = idem `VALIDATED`
* compteur **Rejetés** = idem `REJECTED`

---

## 4. Migration rapide de votre `designService.ts`

```diff
- const ADMIN_PREFIX = '/admin/designs';
+ const ADMIN_PREFIX = '/api/designs/admin';

// GET en attente
- axios.get(`${ADMIN_PREFIX}`, { params: { status: 'pending_validation', page, limit } })
+ axios.get(`${ADMIN_PREFIX}/pending`, { params: { page, limit, search } });

// GET tous
- axios.get(`${ADMIN_PREFIX}/all`, { params: { page, limit, status, sortBy, sortOrder } })
+ axios.get(`${ADMIN_PREFIX}/all`, { params: { page, limit, status, sortBy, sortOrder } });

// Stats  (supprimer l'appel réseau)
- axios.get(`${ADMIN_PREFIX}/stats`);
+ // Calculez localement après l'appel précédent.
```

---

## 5. Mapping des statuts

| Back-end | UI précédente | Remarque |
|----------|---------------|----------|
| `PENDING` | `pending_validation` | À convertir. |
| `VALIDATED` | `validated` | Identique. |
| `REJECTED` | `rejected` | Identique. |

---

## 6. Exemple React (admin)

```ts
// lister tout
const getAllDesigns = async (status = 'ALL') => {
  const { data } = await axios.get('/api/designs/admin/all', {
    params: { status, page: 1, limit: 20 },
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  return data.data.designs;
};

// valider
await axios.put(`/api/designs/${id}/validate`, { action: 'VALIDATE' }, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

---

## 7. Checklist de mise à jour

- [ ] Remplacer tous les préfixes d'URL (`/admin/designs…`) par `/api/designs/admin`.
- [ ] Mettre à jour la valeur de `status` envoyée (`PENDING`, pas `pending_validation`).
- [ ] Supprimer les appels à `/validation-stats` ou `/stats`, calculer côté front.
- [ ] Tester les endpoints en local (`localhost:<port>/api/designs/...`).

---

### Dernière mise à jour : 2025-07-05 
 
 
 
 
 

Ce document sert de mémo rapide pour adapter votre front-office d’administration aux nouveaux endpoints de gestion des designs.

---

## 1. Base path unique

Tous les appels passent désormais par :
```
/api/designs
```
(Le préfixe historique `/admin/designs` n’existe plus.)

---

## 2. Endpoints disponibles (admin)

| Finalité | Méthode & URL | Query params | Corps | Réponse | Remplace l’ancien |
|----------|---------------|-------------|-------|---------|-------------------|
| **Lister les designs en attente** | `GET /api/designs/admin/pending` | `page`, `limit`, `search` | – | `{ success, data: { designs, pagination } }` | `GET /admin/designs?status=pending_validation` |
| **Lister TOUS les designs** | `GET /api/designs/admin/all` | `page`, `limit`, `search`, `status=PENDING|VALIDATED|REJECTED|ALL` | – | Même structure que ci-dessus | `GET /admin/designs/all` |
| **Valider / rejeter** | `PUT /api/designs/{id}/validate` | – | `{ action: 'VALIDATE' }` ou `{ action: 'REJECT', rejectionReason: '...' }` | `{ success, data: Design }` | `PUT /admin/designs/{id}/validate` (reste identique mais le préfixe change) |
| **Statistiques globales** | _Non fourni séparément_ : calculer à partir de la liste obtenue par `/api/designs/admin/all` | – | – | – | `GET /admin/designs/stats`, `/validation-stats` |

---

## 3. Champs utiles dans la réponse `Design`

```json5
{
  "id": 12,
  "name": "Logo Sport",
  "imageUrl": "https://…",
  "isPending": true,
  "isValidated": false,
  "validationStatus": "PENDING", // PENDING | VALIDATED | REJECTED
  "rejectionReason": null,
  "vendor": {
    "id": 4,
    "fullName": "John Doe",
    "shop_name": "DoePrint"
  },
  "linkedProducts": [ { /* … */ } ],
  "autoPublishCount": 3,
  "toDraftCount": 1
}
```

Vous pouvez ainsi construire :
* compteur **En attente** = `designs.filter(d => d.validationStatus === 'PENDING').length`
* compteur **Validés** = idem `VALIDATED`
* compteur **Rejetés** = idem `REJECTED`

---

## 4. Migration rapide de votre `designService.ts`

```diff
- const ADMIN_PREFIX = '/admin/designs';
+ const ADMIN_PREFIX = '/api/designs/admin';

// GET en attente
- axios.get(`${ADMIN_PREFIX}`, { params: { status: 'pending_validation', page, limit } })
+ axios.get(`${ADMIN_PREFIX}/pending`, { params: { page, limit, search } });

// GET tous
- axios.get(`${ADMIN_PREFIX}/all`, { params: { page, limit, status, sortBy, sortOrder } })
+ axios.get(`${ADMIN_PREFIX}/all`, { params: { page, limit, status, sortBy, sortOrder } });

// Stats  (supprimer l'appel réseau)
- axios.get(`${ADMIN_PREFIX}/stats`);
+ // Calculez localement après l'appel précédent.
```

---

## 5. Mapping des statuts

| Back-end | UI précédente | Remarque |
|----------|---------------|----------|
| `PENDING` | `pending_validation` | À convertir. |
| `VALIDATED` | `validated` | Identique. |
| `REJECTED` | `rejected` | Identique. |

---

## 6. Exemple React (admin)

```ts
// lister tout
const getAllDesigns = async (status = 'ALL') => {
  const { data } = await axios.get('/api/designs/admin/all', {
    params: { status, page: 1, limit: 20 },
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  return data.data.designs;
};

// valider
await axios.put(`/api/designs/${id}/validate`, { action: 'VALIDATE' }, {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

---

## 7. Checklist de mise à jour

- [ ] Remplacer tous les préfixes d'URL (`/admin/designs…`) par `/api/designs/admin`.
- [ ] Mettre à jour la valeur de `status` envoyée (`PENDING`, pas `pending_validation`).
- [ ] Supprimer les appels à `/validation-stats` ou `/stats`, calculer côté front.
- [ ] Tester les endpoints en local (`localhost:<port>/api/designs/...`).

---

### Dernière mise à jour : 2025-07-05 
 
 
 
 
 