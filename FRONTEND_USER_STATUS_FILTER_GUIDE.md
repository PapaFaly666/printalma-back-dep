# Guide Frontend - Filtrage des Utilisateurs par Statut (Actifs/Inactifs)

## Vue d'ensemble

Ce guide explique comment filtrer les utilisateurs (clients/vendeurs) selon leur statut actif ou inactif dans l'interface frontend.

## Champ de statut dans la base de données

Le modèle `User` contient un champ `status` de type booléen :

```prisma
model User {
  id       Int     @id @default(autoincrement())
  email    String  @unique
  status   Boolean @default(true)  // true = actif, false = inactif
  // ... autres champs
}
```

**Valeurs possibles :**
- `true` = Utilisateur actif
- `false` = Utilisateur inactif/désactivé

---

## Endpoints API disponibles

### 1. Récupérer tous les utilisateurs

**Endpoint:** `GET /api/users`

**Headers requis:**
```http
Authorization: Bearer <votre_token_jwt>
```

**Réponse exemple:**
```json
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "VENDEUR",
    "status": true,
    "vendorTypeId": 1,
    "shop_name": "John's Shop",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": 2,
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "role": "VENDEUR",
    "status": false,
    "vendorTypeId": 2,
    "shop_name": "Jane's Store",
    "created_at": "2024-01-20T14:20:00.000Z"
  }
]
```

---

## Implémentation Frontend

### Option 1 : Filtrage côté client (recommandé pour petites listes)

```typescript
// services/userService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'SUPERADMIN' | 'VENDEUR';
  status: boolean;
  vendorTypeId?: number;
  shop_name?: string;
  created_at: string;
}

export const userService = {
  /**
   * Récupérer tous les utilisateurs
   */
  async getAllUsers(token: string): Promise<User[]> {
    const response = await axios.get(`${API_URL}/api/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  /**
   * Filtrer les utilisateurs actifs
   */
  filterActiveUsers(users: User[]): User[] {
    return users.filter(user => user.status === true);
  },

  /**
   * Filtrer les utilisateurs inactifs
   */
  filterInactiveUsers(users: User[]): User[] {
    return users.filter(user => user.status === false);
  },

  /**
   * Filtrer par statut et rôle
   */
  filterUsers(users: User[], filters: {
    status?: boolean;
    role?: string;
    vendorTypeId?: number;
  }): User[] {
    return users.filter(user => {
      if (filters.status !== undefined && user.status !== filters.status) {
        return false;
      }
      if (filters.role && user.role !== filters.role) {
        return false;
      }
      if (filters.vendorTypeId && user.vendorTypeId !== filters.vendorTypeId) {
        return false;
      }
      return true;
    });
  }
};
```

### Option 2 : Composant React avec filtres

```tsx
// components/UserList.tsx
'use client';

import { useState, useEffect } from 'react';
import { userService, User } from '@/services/userService';

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Non authentifié');

      const data = await userService.getAllUsers(token);
      setUsers(data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (statusFilter === 'active') {
      filtered = userService.filterActiveUsers(filtered);
    } else if (statusFilter === 'inactive') {
      filtered = userService.filterInactiveUsers(filtered);
    }

    setFilteredUsers(filtered);
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        Actif
      </span>
    ) : (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        Inactif
      </span>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow">
        <label className="font-semibold">Filtrer par statut:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tous ({users.length})</option>
          <option value="active">
            Actifs ({userService.filterActiveUsers(users).length})
          </option>
          <option value="inactive">
            Inactifs ({userService.filterInactiveUsers(users).length})
          </option>
        </select>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Boutique
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(user.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.shop_name || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun utilisateur trouvé
          </div>
        )}
      </div>
    </div>
  );
}
```

### Option 3 : Version avec recherche et filtres multiples

```tsx
// components/AdvancedUserList.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { userService, User } from '@/services/userService';

type StatusFilter = 'all' | 'active' | 'inactive';
type RoleFilter = 'all' | 'ADMIN' | 'SUPERADMIN' | 'VENDEUR';

export default function AdvancedUserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Non authentifié');

      const data = await userService.getAllUsers(token);
      setUsers(data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage optimisé avec useMemo
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Filtre par statut
    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.status === true);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => u.status === false);
    }

    // Filtre par rôle
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Recherche textuelle
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.shop_name?.toLowerCase().includes(search))
      );
    }

    return filtered;
  }, [users, statusFilter, roleFilter, searchTerm]);

  // Statistiques
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === true).length,
    inactive: users.filter(u => u.status === false).length,
    vendors: users.filter(u => u.role === 'VENDEUR').length,
  }), [users]);

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-3xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <div className="text-sm text-green-600">Actifs</div>
          <div className="text-3xl font-bold text-green-700">{stats.active}</div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow">
          <div className="text-sm text-red-600">Inactifs</div>
          <div className="text-3xl font-bold text-red-700">{stats.inactive}</div>
        </div>
        <div className="bg-blue-50 p-6 rounded-lg shadow">
          <div className="text-sm text-blue-600">Vendeurs</div>
          <div className="text-3xl font-bold text-blue-700">{stats.vendors}</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <input
            type="text"
            placeholder="Rechercher par nom, email, boutique..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filtre statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs uniquement</option>
            <option value="inactive">Inactifs uniquement</option>
          </select>

          {/* Filtre rôle */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les rôles</option>
            <option value="VENDEUR">Vendeurs</option>
            <option value="ADMIN">Admins</option>
            <option value="SUPERADMIN">Super Admins</option>
          </select>
        </div>

        <div className="text-sm text-gray-500">
          {filteredUsers.length} utilisateur(s) trouvé(s)
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Boutique
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date création
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.status ? (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ✓ Actif
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      ✗ Inactif
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.shop_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun utilisateur trouvé</p>
            <p className="text-sm mt-2">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Gestion du statut utilisateur

### Activer/Désactiver un utilisateur

```typescript
// services/userService.ts (suite)

export const userService = {
  // ... autres méthodes

  /**
   * Activer un utilisateur
   */
  async activateUser(userId: number, token: string): Promise<void> {
    await axios.patch(
      `${API_URL}/api/users/${userId}`,
      { status: true },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  },

  /**
   * Désactiver un utilisateur
   */
  async deactivateUser(userId: number, token: string): Promise<void> {
    await axios.patch(
      `${API_URL}/api/users/${userId}`,
      { status: false },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  },

  /**
   * Basculer le statut d'un utilisateur
   */
  async toggleUserStatus(userId: number, currentStatus: boolean, token: string): Promise<void> {
    await axios.patch(
      `${API_URL}/api/users/${userId}`,
      { status: !currentStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
};
```

### Composant de basculement de statut

```tsx
// components/UserStatusToggle.tsx
'use client';

import { useState } from 'react';
import { userService } from '@/services/userService';

interface UserStatusToggleProps {
  userId: number;
  currentStatus: boolean;
  onStatusChanged: () => void;
}

export default function UserStatusToggle({
  userId,
  currentStatus,
  onStatusChanged
}: UserStatusToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!confirm(`Voulez-vous vraiment ${currentStatus ? 'désactiver' : 'activer'} cet utilisateur ?`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Non authentifié');

      await userService.toggleUserStatus(userId, currentStatus, token);
      onStatusChanged();
    } catch (error) {
      console.error('Erreur changement statut:', error);
      alert('Erreur lors du changement de statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`
        px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${currentStatus
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-green-100 text-green-700 hover:bg-green-200'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? 'Traitement...' : currentStatus ? 'Désactiver' : 'Activer'}
    </button>
  );
}
```

---

## Résumé des points clés

✅ **Champ de statut:** `status: boolean` (true = actif, false = inactif)

✅ **Filtrage côté client:** Simple et efficace pour petites listes (<1000 utilisateurs)

✅ **Composants réutilisables:** Créer des services et composants génériques

✅ **Optimisation avec useMemo:** Éviter les recalculs inutiles des filtres

✅ **Feedback visuel:** Badges de couleur pour identifier rapidement le statut

✅ **Gestion d'état:** Utiliser useState et useEffect pour la réactivité

---

## Support et questions

Pour toute question concernant l'implémentation, consultez la documentation API ou contactez l'équipe backend.
