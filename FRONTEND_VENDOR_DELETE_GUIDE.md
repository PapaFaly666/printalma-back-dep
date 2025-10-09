## Guide Frontend — Suppression vendeur (Soft delete) et suppression définitive

Ce guide explique comment intégrer côté frontend la suppression logique (soft delete), la restauration et la corbeille des vendeurs. Il précise aussi l'état de la suppression définitive (hard delete).

### Base et auth
- Base URL: `http://localhost:3004`
- Pas de préfixe global `/api`
- Auth requise: JWT (header `Authorization: Bearer <token>`) et permissions admin

### Endpoints disponibles (backend actuel)
- `PUT /auth/admin/vendors/:id/soft-delete` — Marquer un vendeur comme supprimé (soft delete)
- `PUT /auth/admin/vendors/:id/restore` — Restaurer un vendeur supprimé
- `GET /auth/admin/vendors/trash` — Lister les vendeurs en corbeille (paginé et filtrable)

Note: Aucune route de suppression définitive de vendeur n'est actuellement exposée dans le backend. Voir section « Suppression définitive (proposition) » ci-dessous si vous souhaitez l'ajouter.

---

### Recommandations UI/UX
- Afficher un état « supprimé » (badge) sur les vendeurs ayant `is_deleted = true`
- Désactiver les actions sensibles (connexion, publication, etc.) quand un vendeur est supprimé
- Fournir un bouton « Restaurer » depuis la liste corbeille et la fiche vendeur supprimé
- Avant soft delete, demander une confirmation explicite (« Cette action désactive le compte »)

---

### Exemples d'intégration (Axios)

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3004',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// 1) Soft delete d'un vendeur
export async function softDeleteVendor(vendorId: number) {
  const { data } = await api.put(`/auth/admin/vendors/${vendorId}/soft-delete`);
  return data; // { success, message, vendor: { is_deleted: true, ... } }
}

// 2) Restaurer un vendeur supprimé
export async function restoreVendor(vendorId: number) {
  const { data } = await api.put(`/auth/admin/vendors/${vendorId}/restore`);
  return data; // { success, message, vendor: { is_deleted: false, ... } }
}

// 3) Lister la corbeille des vendeurs (pagination / filtres)
export interface VendorsTrashFilters {
  page?: number; // défaut: 1
  limit?: number; // défaut: 10
  search?: string; // nom, email, shop_name
  vendeur_type?: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
}

export async function listVendorsTrash(filters: VendorsTrashFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.search) params.append('search', filters.search);
  if (filters.vendeur_type) params.append('vendeur_type', filters.vendeur_type);
  const qs = params.toString();
  const url = qs ? `/auth/admin/vendors/trash?${qs}` : '/auth/admin/vendors/trash';
  const { data } = await api.get(url);
  return data; // { vendors: [...], pageInfo: {...} } (selon backend)
}
```

---

### Gestion d'état côté frontend
- Un vendeur supprimé aura typiquement: `is_deleted: true`, `deleted_at` non nul, `status: false`
- Pour filtrer les listes actives, exclure `is_deleted = true`
- Pour la corbeille, n'afficher que `is_deleted = true`

Exemple d'affichage conditionnel:

```ts
function formatVendorStatus(vendor: { is_deleted?: boolean; status?: boolean }) {
  if (vendor.is_deleted) return 'Supprimé (désactivé)';
  return vendor.status ? 'Actif' : 'Inactif';
}
```

---

### Suppression définitive (hard delete) — Proposition

Le backend ne fournit pas de route de suppression définitive de vendeur au moment de la rédaction. Si vous désirez l'ajouter, recommandations:

- Méthode et route proposées: `DELETE /auth/admin/vendors/:id` (protégée par permissions élevées)
- Comportement: purge irréversible des données du vendeur (ou anonymisation RGPD), vérifications strictes (ex: vendeur déjà soft deleté, pas d'ordres impayés, export/audit préalable, logs)
- Confirmation frontend: double confirmation + saisie du nom/email du vendeur
- Journalisation: tracer l'admin initiateur et l'horodatage

Exemple d'appel frontend (si la route est ajoutée):

```ts
// ATTENTION: À n'utiliser que si l'API de suppression définitive est implémentée côté backend
export async function hardDeleteVendor(vendorId: number) {
  const { data } = await api.delete(`/auth/admin/vendors/${vendorId}`);
  return data;
}
```

---

### Erreurs courantes et résolutions
- 404: Vérifier qu'il n'y a pas de `/api` en préfixe d'URL et que le port est `3004`
- 401/403: Token manquant/expiré ou permissions insuffisantes
- 400: Vendeur déjà supprimé (pour soft delete) ou données invalides

---

### Récap endpoints (backend actuel)
- `PUT /auth/admin/vendors/:id/soft-delete`
- `PUT /auth/admin/vendors/:id/restore`
- `GET /auth/admin/vendors/trash`





