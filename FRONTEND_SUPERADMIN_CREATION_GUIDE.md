## Guide Frontend — Création d’utilisateurs Admin/Superadmin (restriction superadmin)

Objectif: guider le frontend pour respecter la règle métier: **seuls les superadmin** peuvent créer des comptes **admin** ou **superadmin**. Les admins ne peuvent pas créer ces rôles.

### Base et auth
- Base URL: `http://localhost:3004`
- Pas de préfixe global `/api`
- Auth: JWT (header `Authorization: Bearer <token>`) avec session valide

### Endpoints utiles
- `GET /admin/roles/available-for-users` — Rôles disponibles pour création d’utilisateurs (sans vendor)
- `POST /admin/users` — Créer un utilisateur avec `roleId`

### Règle d’accès (backend)
- Si le rôle choisi a un `slug` égal à `admin` ou `superadmin`, alors le créateur doit être `superadmin`. Sinon, le backend renvoie `403 Forbidden`.

### Recommandations UI/UX
- Si l’utilisateur connecté n’est pas `superadmin`, masquer/désactiver les options `Admin` et `Super Administrateur` dans le sélecteur de rôles.
- Afficher une alerte claire si le backend renvoie 403 (ex: « Seul un superadmin peut créer ce type de compte. »).
- Préremplir et valider le formulaire (email unique, mot de passe ≥ 8 chars, etc.).

### Exemple d’intégration (Axios)

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

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  roleId: number; // ID du rôle sélectionné
  status?: 'active' | 'inactive' | 'suspended';
}

// 1) Charger les rôles disponibles
export async function fetchAvailableRolesForUsers() {
  const { data } = await api.get('/admin/roles/available-for-users');
  return data; // { success, data: Role[] }
}

// 2) Créer un utilisateur
export async function createUser(payload: CreateUserPayload) {
  try {
    const { data } = await api.post('/admin/users', payload);
    return data; // { success, message, data: {...} }
  } catch (err: any) {
    // Gestion des erreurs
    if (err?.response?.status === 403) {
      throw new Error('Seul un superadmin peut créer un compte admin/superadmin.');
    }
    if (err?.response?.status === 409) {
      throw new Error("Cet email est déjà utilisé.");
    }
    if (err?.response?.status === 404) {
      throw new Error('Rôle sélectionné introuvable.');
    }
    throw new Error('Erreur lors de la création de l’utilisateur.');
  }
}
```

### Contrôle côté frontend (facultatif mais recommandé)
- Récupérer le rôle de l’utilisateur connecté (ex: via un endpoint `me` ou le token décodé).
- Si le rôle courant n’est pas `superadmin`, filtrer la liste de rôles pour exclure ceux dont `slug` ∈ { `admin`, `superadmin` }.

Exemple de filtrage:

```ts
function filterRolesForCreator(roles: { id: number; name: string; slug: string }[], currentRoleSlug?: string) {
  if (currentRoleSlug !== 'superadmin') {
    return roles.filter((r) => r.slug !== 'admin' && r.slug !== 'superadmin');
  }
  return roles;
}
```

### Messages d’erreur utilisateur
- **403**: « Seul un superadmin peut créer ce type de compte. »
- **409**: « Cet email est déjà utilisé. »
- **404**: « Rôle sélectionné introuvable. »
- **Autres**: « Une erreur est survenue lors de la création de l’utilisateur. Veuillez réessayer. »


