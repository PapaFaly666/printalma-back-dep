# Guide d'Intégration Frontend - Système RBAC et Gestion des Stocks

## Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Authentification](#authentification)
3. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
4. [Gestion des Rôles et Permissions](#gestion-des-rôles-et-permissions)
5. [Gestion des Mouvements de Stock](#gestion-des-mouvements-de-stock)
6. [Gestion des Erreurs](#gestion-des-erreurs)

---

## Vue d'ensemble

### Base URL
```
http://localhost:3004
```

### Headers requis
Tous les endpoints nécessitent un token JWT :
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## Authentification

### Login
**Endpoint:** `POST /auth/login`

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

---

## Gestion des Utilisateurs

### 1. Récupérer tous les utilisateurs (exclut automatiquement les vendeurs)

**Endpoint:** `GET /admin/users`

**Query Parameters:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Nombre d'éléments par page (défaut: 10)
- `search` (optionnel): Recherche dans nom et email
- `status` (optionnel): Filtrer par statut (active, inactive, suspended)
- `roleId` (optionnel): Filtrer par ID de rôle

**Exemple:**
```typescript
const response = await fetch(
  `/admin/users?page=1&limit=10&search=john&status=active`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+33 6 12 34 56 78",
      "status": "ACTIVE",
      "role": {
        "id": 2,
        "name": "Admin",
        "slug": "admin"
      },
      "email_verified": true,
      "created_at": "2024-01-15T10:00:00.000Z",
      "created_by": {
        "id": 1,
        "name": "Super Admin"
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 2. Récupérer un utilisateur par ID

**Endpoint:** `GET /admin/users/:id`

**Exemple:**
```typescript
const response = await fetch(`/admin/users/1`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+33 6 12 34 56 78",
    "status": "ACTIVE",
    "role": {
      "id": 2,
      "name": "Admin",
      "slug": "admin",
      "permissions": [
        {
          "id": 1,
          "name": "Voir utilisateurs",
          "slug": "users.view",
          "module": "users"
        }
      ]
    }
  }
}
```

### 3. Créer un utilisateur

**Endpoint:** `POST /admin/users`

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "SecurePass123!",
  "phone": "+33 6 98 76 54 32",
  "roleId": 3,
  "status": "active"
}
```

**Notes importantes:**
- Le `status` peut être en minuscules (`active`, `inactive`, `suspended`) ou majuscules (`ACTIVE`, `INACTIVE`, `SUSPENDED`)
- Le backend convertit automatiquement en majuscules
- Le `roleId` doit correspondre à un rôle existant (obtenu via `/admin/roles/available-for-users`)
- Le mot de passe doit contenir au moins 8 caractères

**Exemple avec React:**
```typescript
const createUser = async (userData) => {
  try {
    const response = await fetch('/admin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    throw error;
  }
};
```

**Réponse:**
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "id": 15,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "status": "ACTIVE",
    "role": {
      "id": 3,
      "name": "Marketing",
      "slug": "marketing"
    }
  }
}
```

### 4. Mettre à jour un utilisateur

**Endpoint:** `PATCH /admin/users/:id`

**Body (tous les champs optionnels):**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "phone": "+33 6 11 22 33 44",
  "roleId": 4,
  "status": "inactive"
}
```

**Exemple:**
```typescript
const updateUser = async (userId, updates) => {
  const response = await fetch(`/admin/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  return await response.json();
};
```

### 5. Supprimer un utilisateur (soft delete)

**Endpoint:** `DELETE /admin/users/:id`

**Exemple:**
```typescript
const deleteUser = async (userId) => {
  const response = await fetch(`/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  return await response.json();
};
```

**Réponse:**
```json
{
  "success": true,
  "message": "Utilisateur supprimé avec succès"
}
```

### 6. Réinitialiser le mot de passe

**Endpoint:** `POST /admin/users/:id/reset-password`

**Body:**
```json
{
  "newPassword": "NewSecurePass456!"
}
```

### 7. Mettre à jour le statut

**Endpoint:** `PATCH /admin/users/:id/status`

**Body:**
```json
{
  "status": "suspended"
}
```

### 8. Statistiques utilisateurs

**Endpoint:** `GET /admin/users/stats`

**Réponse:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "active": 38,
    "inactive": 5,
    "suspended": 2,
    "byRole": [
      { "role": "Admin", "count": 5 },
      { "role": "Marketing", "count": 12 },
      { "role": "Production", "count": 20 }
    ]
  }
}
```

---

## Gestion des Rôles et Permissions

### 1. Récupérer tous les rôles

**Endpoint:** `GET /admin/roles`

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Super Admin",
      "slug": "superadmin",
      "description": "Accès complet au système",
      "isSystem": true,
      "permissions": [
        {
          "id": 1,
          "name": "Voir utilisateurs",
          "slug": "users.view",
          "module": "users"
        }
      ],
      "_count": {
        "users": 2
      }
    }
  ]
}
```

### 2. Récupérer les rôles disponibles pour créer des utilisateurs (exclut vendor)

**Endpoint:** `GET /admin/roles/available-for-users`

**Important:** Utilisez cet endpoint pour alimenter le dropdown de sélection de rôle lors de la création d'utilisateur.

**Exemple avec React:**
```typescript
const [availableRoles, setAvailableRoles] = useState([]);

useEffect(() => {
  const fetchRoles = async () => {
    const response = await fetch('/admin/roles/available-for-users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setAvailableRoles(data.data);
  };

  fetchRoles();
}, []);

// Dans le formulaire
<select name="roleId">
  {availableRoles.map(role => (
    <option key={role.id} value={role.id}>
      {role.name}
    </option>
  ))}
</select>
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Super Admin",
      "slug": "superadmin",
      "description": "Accès complet au système"
    },
    {
      "id": 2,
      "name": "Admin",
      "slug": "admin",
      "description": "Gestion complète sauf configuration système"
    }
  ]
}
```

### 3. Récupérer un rôle par ID

**Endpoint:** `GET /admin/roles/:id`

### 4. Récupérer toutes les permissions

**Endpoint:** `GET /admin/permissions`

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Voir utilisateurs",
      "slug": "users.view",
      "module": "users",
      "description": "Voir la liste des utilisateurs"
    }
  ]
}
```

### 5. Récupérer les permissions groupées par module

**Endpoint:** `GET /admin/permissions/by-module`

**Réponse:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Voir utilisateurs",
        "slug": "users.view"
      },
      {
        "id": 2,
        "name": "Créer utilisateurs",
        "slug": "users.create"
      }
    ],
    "products": [
      {
        "id": 10,
        "name": "Voir produits",
        "slug": "products.view"
      }
    ]
  }
}
```

### 6. Créer un rôle personnalisé

**Endpoint:** `POST /admin/roles`

**Body:**
```json
{
  "name": "Chef de Production",
  "slug": "production-manager",
  "description": "Gestion de la production et des stocks",
  "permissionIds": [10, 11, 12, 20, 21]
}
```

**Exemple complet:**
```typescript
const createRole = async (roleData) => {
  const response = await fetch('/admin/roles', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: roleData.name,
      slug: roleData.slug,
      description: roleData.description,
      permissionIds: roleData.selectedPermissions // Array of permission IDs
    })
  });

  return await response.json();
};
```

### 7. Mettre à jour un rôle

**Endpoint:** `PATCH /admin/roles/:id`

**Body:**
```json
{
  "name": "Chef de Production Senior",
  "description": "Gestion avancée de la production",
  "permissionIds": [10, 11, 12, 13, 20, 21, 22]
}
```

**Note:** Les rôles système (isSystem: true) ne peuvent pas être modifiés.

### 8. Supprimer un rôle

**Endpoint:** `DELETE /admin/roles/:id`

**Note:** Un rôle ne peut pas être supprimé s'il est assigné à des utilisateurs.

---

## Gestion des Mouvements de Stock

### 1. Créer un mouvement de stock (entrée ou sortie)

**Endpoint:** `POST /products/:id/stocks/movement`

**Body pour entrée de stock:**
```json
{
  "type": "IN",
  "colorId": 5,
  "sizeName": "M",
  "quantity": 50,
  "reason": "Réapprovisionnement fournisseur"
}
```

**Body pour sortie de stock:**
```json
{
  "type": "OUT",
  "colorId": 5,
  "sizeName": "M",
  "quantity": 10,
  "reason": "Commande client #1234"
}
```

**Exemple avec React:**
```typescript
const addStockMovement = async (productId, movementData) => {
  try {
    const response = await fetch(`/products/${productId}/stocks/movement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(movementData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur mouvement stock:', error);
    throw error;
  }
};

// Utilisation
await addStockMovement(123, {
  type: 'IN',
  colorId: 5,
  sizeName: 'M',
  quantity: 50,
  reason: 'Réapprovisionnement'
});
```

**Réponse:**
```json
{
  "success": true,
  "message": "Mouvement de stock enregistré",
  "data": {
    "movement": {
      "id": 456,
      "productId": 123,
      "colorId": 5,
      "sizeName": "M",
      "type": "IN",
      "quantity": 50,
      "reason": "Réapprovisionnement fournisseur",
      "createdAt": "2024-01-20T14:30:00.000Z",
      "createdBy": 1
    },
    "currentStock": 150
  }
}
```

### 2. Récupérer l'historique des mouvements

**Endpoint:** `GET /products/:id/stocks/history`

**Query Parameters:**
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Nombre d'éléments par page (défaut: 20)
- `type` (optionnel): Filtrer par type (IN ou OUT)
- `colorId` (optionnel): Filtrer par couleur
- `sizeName` (optionnel): Filtrer par taille
- `startDate` (optionnel): Date de début (ISO format)
- `endDate` (optionnel): Date de fin (ISO format)

**Exemple:**
```typescript
const getStockHistory = async (productId, filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 20,
    ...(filters.type && { type: filters.type }),
    ...(filters.colorId && { colorId: filters.colorId }),
    ...(filters.sizeName && { sizeName: filters.sizeName }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate })
  });

  const response = await fetch(
    `/products/${productId}/stocks/history?${params}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  return await response.json();
};

// Utilisation
const history = await getStockHistory(123, {
  type: 'IN',
  colorId: 5,
  startDate: '2024-01-01T00:00:00.000Z'
});
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "productId": 123,
      "type": "IN",
      "quantity": 50,
      "reason": "Réapprovisionnement fournisseur",
      "createdAt": "2024-01-20T14:30:00.000Z",
      "color": {
        "id": 5,
        "name": "Bleu Marine",
        "hex": "#001f3f"
      },
      "sizeName": "M",
      "createdBy": {
        "id": 1,
        "name": "Admin User"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## Gestion des Erreurs

### Codes d'erreur HTTP communs

| Code | Signification | Action recommandée |
|------|---------------|-------------------|
| 400 | Données invalides | Vérifier les validations du formulaire |
| 401 | Non authentifié | Rediriger vers la page de login |
| 403 | Permission refusée | Afficher un message d'erreur approprié |
| 404 | Ressource non trouvée | Vérifier l'ID de la ressource |
| 409 | Conflit (ex: email déjà utilisé) | Afficher un message d'erreur spécifique |
| 500 | Erreur serveur | Afficher un message d'erreur générique |

### Format de réponse d'erreur

```json
{
  "success": false,
  "message": "Email déjà utilisé",
  "error": "Conflict",
  "statusCode": 409
}
```

### Gestion des erreurs avec React

```typescript
const handleApiError = (error) => {
  if (error.response) {
    // Erreur avec réponse du serveur
    const { status, data } = error.response;

    switch (status) {
      case 400:
        toast.error(data.message || 'Données invalides');
        break;
      case 401:
        localStorage.removeItem('token');
        navigate('/login');
        break;
      case 403:
        toast.error('Vous n\'avez pas la permission pour cette action');
        break;
      case 404:
        toast.error('Ressource non trouvée');
        break;
      case 409:
        toast.error(data.message || 'Conflit de données');
        break;
      default:
        toast.error('Une erreur est survenue');
    }
  } else {
    // Erreur réseau
    toast.error('Erreur de connexion au serveur');
  }
};

// Utilisation
try {
  await createUser(userData);
  toast.success('Utilisateur créé avec succès');
} catch (error) {
  handleApiError(error);
}
```

---

## Exemples Complets

### Composant React - Liste des Utilisateurs

```typescript
import React, { useState, useEffect } from 'react';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    roleId: ''
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.roleId && { roleId: filters.roleId })
      });

      const response = await fetch(`/admin/users?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setTotalPages(data.meta.totalPages);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const response = await fetch(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchUsers(); // Refresh list
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div>
      <h1>Gestion des Utilisateurs</h1>

      {/* Filtres */}
      <div className="filters">
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />

        <select
          value={filters.status}
          onChange={(e) => setFilters({...filters, status: e.target.value})}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role?.name || 'N/A'}</td>
                <td>{user.status}</td>
                <td>
                  <button onClick={() => handleStatusChange(user.id, 'suspended')}>
                    Suspendre
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Précédent
        </button>
        <span>Page {page} sur {totalPages}</span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default UsersPage;
```

### Composant React - Formulaire de Création d'Utilisateur

```typescript
import React, { useState, useEffect } from 'react';

const CreateUserForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
    status: 'active'
  });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAvailableRoles();
  }, []);

  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch('/admin/roles/available-for-users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setAvailableRoles(data.data);
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await fetch('/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          roleId: parseInt(formData.roleId)
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Utilisateur créé avec succès');
        onSuccess?.();
      } else {
        setErrors({ general: data.message });
      }
    } catch (error) {
      setErrors({ general: 'Erreur lors de la création' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Créer un Utilisateur</h2>

      {errors.general && (
        <div className="error">{errors.general}</div>
      )}

      <div>
        <label>Nom complet *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>

      <div>
        <label>Mot de passe * (min 8 caractères)</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          minLength={8}
          required
        />
      </div>

      <div>
        <label>Téléphone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
      </div>

      <div>
        <label>Rôle *</label>
        <select
          value={formData.roleId}
          onChange={(e) => setFormData({...formData, roleId: e.target.value})}
          required
        >
          <option value="">Sélectionnez un rôle</option>
          {availableRoles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Statut *</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer l\'utilisateur'}
      </button>
    </form>
  );
};

export default CreateUserForm;
```

---

## Points Importants à Retenir

### ✅ À FAIRE
- Toujours utiliser `/admin/roles/available-for-users` pour le dropdown de sélection de rôle
- Accepter les statuts en minuscules ou majuscules (le backend les convertit)
- Gérer les erreurs 401 en redirigeant vers la page de login
- Utiliser la pagination pour les listes longues
- Vérifier que `user.role` n'est pas null avant d'accéder à `user.role.name`

### ❌ À NE PAS FAIRE
- Ne jamais utiliser `/admin/roles` pour le formulaire de création d'utilisateur (inclut le rôle vendor)
- Ne pas envoyer le statut sans la transformation en majuscules côté frontend si vous gérez manuellement
- Ne pas oublier le token JWT dans les headers
- Ne pas supposer que tous les utilisateurs ont un rôle (vérifier null)

### 🔐 Permissions
Pour implémenter la gestion des permissions côté frontend, vérifiez les permissions retournées lors du login et stockez-les :

```typescript
// Après login
const permissions = response.user.role.permissions.map(p => p.slug);
localStorage.setItem('permissions', JSON.stringify(permissions));

// Vérifier une permission
const hasPermission = (slug) => {
  const permissions = JSON.parse(localStorage.getItem('permissions') || '[]');
  return permissions.includes(slug);
};

// Utilisation
{hasPermission('users.create') && (
  <button onClick={openCreateForm}>Créer un utilisateur</button>
)}
```

---

## Support

Pour toute question ou problème, référez-vous aux fichiers de documentation techniques :
- `RBAC_IMPLEMENTATION.md` - Détails techniques du système RBAC
- `GESTION_ROLES_DYNAMIQUES.md` - Explication du système de rôles dynamiques
- `CORRECTIONS_ADMIN_USERS.md` - Corrections appliquées au système

---

**Version:** 1.0
**Dernière mise à jour:** 2024-01-20
