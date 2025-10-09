## Guide Frontend — Création et listing des Admins/Superadmins

Ce guide explique comment:
- Créer des utilisateurs `admin`/`superadmin` (restriction: seul un superadmin peut créer ces rôles)
- Lister uniquement les utilisateurs `admin` et `superadmin` (exclut les vendeurs)

### Base et auth
- Base URL: `http://localhost:3004`
- Pas de préfixe `/api`
- Auth: JWT (header `Authorization: Bearer <token>`) et permissions `users.view` / `users.create`

### Endpoints
- `GET /admin/roles/available-for-users` — Rôles disponibles pour la création
- `POST /admin/users` — Créer un utilisateur (cf. règle superadmin-only pour `admin`/`superadmin`)
- `GET /admin/users/admins-only` — Lister uniquement les admins/superadmins (pagination + recherche)

### Intégration (Axios)

```ts
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3004', withCredentials: true });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Charger les rôles disponibles (pour le formulaire de création)
export async function fetchAvailableRolesForUsers() {
  const { data } = await api.get('/admin/roles/available-for-users');
  return data; // { success, data: Role[] }
}

// Créer un admin/superadmin (seulement si connecté en superadmin)
export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleId: number; // id du rôle (admin/superadmin)
  status?: 'active' | 'inactive' | 'suspended';
}

export async function createUser(payload: CreateUserPayload) {
  try {
    const { data } = await api.post('/admin/users', payload);
    return data;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      throw new Error('Seul un superadmin peut créer un compte admin/superadmin.');
    }
    if (err?.response?.status === 409) {
      throw new Error('Cet email est déjà utilisé.');
    }
    if (err?.response?.status === 404) {
      throw new Error('Rôle sélectionné introuvable.');
    }
    throw new Error("Erreur lors de la création de l’utilisateur.");
  }
}

// Lister uniquement admins et superadmins (exclut vendeurs)
export interface AdminsListFilters {
  page?: number; // défaut 1
  limit?: number; // défaut 20
  search?: string; // nom ou email
}

export async function listAdminsOnly(filters: AdminsListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.search) params.append('search', filters.search);
  const qs = params.toString();
  const url = qs ? `/admin/users/admins-only?${qs}` : '/admin/users/admins-only';
  const { data } = await api.get(url);
  return data; // { success, data: { users, total, page, limit } }
}
```

### UI/UX
- Dans le sélecteur de rôles, si l’utilisateur courant n’est pas `superadmin`, masquer/désactiver les options `admin` et `superadmin`.
- Sur la page de liste des admins, utiliser `GET /admin/users/admins-only` et proposer recherche/pagination.

### Messages d’erreur
- 403: « Seul un superadmin peut créer ce type de compte. »
- 409: « Cet email est déjà utilisé. »
- 404: « Rôle sélectionné introuvable. »
- Autres: « Erreur lors de la création de l’utilisateur. »


