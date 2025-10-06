# Guide d'Intégration Frontend - Système de Permissions

## 🎯 Vue d'ensemble

Ce guide explique comment intégrer le système de permissions dans votre application frontend (React/Next.js). Le système empêche les utilisateurs d'effectuer des actions pour lesquelles ils n'ont pas les permissions nécessaires.

## 🚀 Installation Backend (Prérequis)

### 1. Exécuter le seed des permissions

```bash
# Générer le client Prisma
npx prisma generate

# Exécuter le seed pour créer toutes les permissions et rôles de base
npx ts-node prisma/seed-permissions.ts
```

Cela créera :
- ✅ **67 permissions** couvrant tous les modules
- ✅ **4 rôles système** : Superadmin, Admin, Manager, Vendor

### 2. Vérifier le guard sur les endpoints

Le guard `PermissionsGuard` est déjà appliqué sur tous les endpoints protégés. Exemple :

```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminUsersController {

  @Get()
  @RequirePermissions('users.view')
  async findAll() { ... }

  @Post()
  @RequirePermissions('users.create')
  async create() { ... }
}
```

## 📋 Structure des Données

### Format des permissions

```typescript
interface Permission {
  id: number;
  key: string;           // Ex: "users.view"
  name: string;          // Ex: "Voir les utilisateurs"
  description: string;   // Description détaillée
  module: string;        // Ex: "users"
}
```

### Format de l'utilisateur connecté

```typescript
interface User {
  id: number;
  email: string;
  name: string;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  permissions: Permission[];
}
```

## 🔧 Intégration Frontend

### 1. Service API pour les permissions

Créez un service pour gérer les appels API :

```typescript
// services/permissionsService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const permissionsService = {
  /**
   * Récupérer toutes les permissions disponibles
   */
  async getAllPermissions() {
    const response = await axios.get(`${API_URL}/admin/permissions`);
    return response.data;
  },

  /**
   * Récupérer les permissions groupées par module
   */
  async getPermissionsByModule() {
    const response = await axios.get(`${API_URL}/admin/permissions/by-module`);
    return response.data;
  },

  /**
   * Récupérer les permissions d'un utilisateur
   */
  async getUserPermissions(userId: number) {
    const response = await axios.get(`${API_URL}/admin/users/${userId}/permissions`);
    return response.data;
  },

  /**
   * Attribuer des permissions à un utilisateur
   */
  async assignPermissions(userId: number, permissionIds: number[]) {
    const response = await axios.post(
      `${API_URL}/admin/users/${userId}/permissions`,
      { permissionIds }
    );
    return response.data;
  },

  /**
   * Réinitialiser les permissions d'un utilisateur
   */
  async resetPermissions(userId: number, roleId: number) {
    const response = await axios.post(
      `${API_URL}/admin/users/${userId}/permissions/reset`,
      { roleId }
    );
    return response.data;
  }
};
```

### 2. Hook personnalisé pour vérifier les permissions

```typescript
// hooks/usePermissions.ts
import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Vérifie si l'utilisateur a au moins une des permissions spécifiées
   */
  const hasPermission = (requiredPermissions: string | string[]): boolean => {
    if (!user || !user.permissions) return false;

    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    const userPermissionKeys = user.permissions.map(p => p.key);

    return permissions.some(permission =>
      userPermissionKeys.includes(permission)
    );
  };

  /**
   * Vérifie si l'utilisateur a TOUTES les permissions spécifiées
   */
  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    if (!user || !user.permissions) return false;

    const userPermissionKeys = user.permissions.map(p => p.key);

    return requiredPermissions.every(permission =>
      userPermissionKeys.includes(permission)
    );
  };

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  const hasRole = (roleSlug: string): boolean => {
    if (!user || !user.role) return false;
    return user.role.slug === roleSlug;
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasRole,
    permissions: user?.permissions || [],
    role: user?.role
  };
}
```

### 3. Composant pour protéger les éléments UI

```typescript
// components/PermissionGuard.tsx
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  permissions?: string | string[];
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Composant pour afficher conditionnellement du contenu basé sur les permissions
 */
export function PermissionGuard({
  permissions,
  role,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasRole } = usePermissions();

  // Vérifier le rôle si spécifié
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  // Vérifier les permissions si spécifiées
  if (permissions && !hasPermission(permissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 4. Context d'authentification avec permissions

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
  role: {
    id: number;
    name: string;
    slug: string;
  };
  permissions: Array<{
    id: number;
    key: string;
    name: string;
    module: string;
  }>;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger l'utilisateur au montage
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Configurer le token pour toutes les requêtes
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Récupérer les infos de l'utilisateur avec ses permissions
      const response = await axios.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post('/auth/login', { email, password });
    const { token, user: userData } = response.data.data;

    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## 💡 Exemples d'utilisation

### Exemple 1 : Masquer un bouton selon les permissions

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

function UserList() {
  return (
    <div>
      <h1>Liste des utilisateurs</h1>

      {/* Ce bouton n'apparaît que si l'utilisateur a la permission users.create */}
      <PermissionGuard permissions="users.create">
        <button onClick={handleCreateUser}>
          Créer un utilisateur
        </button>
      </PermissionGuard>

      {/* Liste des utilisateurs */}
      <UserTable />
    </div>
  );
}
```

### Exemple 2 : Afficher un message si pas de permission

```tsx
<PermissionGuard
  permissions="users.delete"
  fallback={<p className="text-gray-500">Vous n'avez pas la permission de supprimer</p>}
>
  <button onClick={handleDelete} className="btn-danger">
    Supprimer
  </button>
</PermissionGuard>
```

### Exemple 3 : Vérifier plusieurs permissions (OR)

```tsx
{/* L'utilisateur doit avoir AU MOINS une de ces permissions */}
<PermissionGuard permissions={['users.create', 'users.update']}>
  <EditUserForm />
</PermissionGuard>
```

### Exemple 4 : Utiliser le hook directement

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function ProductActions() {
  const { hasPermission } = usePermissions();

  const handleEdit = () => {
    if (!hasPermission('products.update')) {
      alert('Vous n\'avez pas la permission de modifier ce produit');
      return;
    }
    // Logique d'édition
  };

  return (
    <div>
      <button onClick={handleEdit}>
        Modifier
      </button>
    </div>
  );
}
```

### Exemple 5 : Protéger une page entière

```tsx
// pages/admin/users.tsx
import { PermissionGuard } from '@/components/PermissionGuard';
import { useRouter } from 'next/router';

export default function AdminUsersPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      permissions="users.view"
      fallback={
        <div className="text-center p-8">
          <h2>Accès refusé</h2>
          <p>Vous n'avez pas la permission d'accéder à cette page</p>
          <button onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </button>
        </div>
      }
    >
      <div>
        <h1>Gestion des utilisateurs</h1>
        {/* Contenu de la page */}
      </div>
    </PermissionGuard>
  );
}
```

### Exemple 6 : Interface de gestion des permissions

```tsx
// components/UserPermissionsManager.tsx
import { useState, useEffect } from 'react';
import { permissionsService } from '@/services/permissionsService';

interface Props {
  userId: number;
  onSave?: () => void;
}

export function UserPermissionsManager({ userId, onSave }: Props) {
  const [allPermissions, setAllPermissions] = useState<Record<string, any[]>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      // Charger toutes les permissions groupées par module
      const permsResponse = await permissionsService.getPermissionsByModule();
      setAllPermissions(permsResponse.data);

      // Charger les permissions actuelles de l'utilisateur
      const userPermsResponse = await permissionsService.getUserPermissions(userId);
      const currentPermissionIds = userPermsResponse.data.permissions.map(
        (p: any) => p.id
      );
      setSelectedPermissions(currentPermissionIds);
    } catch (error) {
      console.error('Erreur lors du chargement des permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleModule = (permissions: any[]) => {
    const modulePermissionIds = permissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id =>
      selectedPermissions.includes(id)
    );

    if (allSelected) {
      // Désélectionner tout le module
      setSelectedPermissions(prev =>
        prev.filter(id => !modulePermissionIds.includes(id))
      );
    } else {
      // Sélectionner tout le module
      setSelectedPermissions(prev => [
        ...new Set([...prev, ...modulePermissionIds])
      ]);
    }
  };

  const handleSave = async () => {
    try {
      await permissionsService.assignPermissions(userId, selectedPermissions);
      alert('Permissions mises à jour avec succès');
      onSave?.();
    } catch (error: any) {
      alert('Erreur: ' + (error.response?.data?.message || 'Erreur inconnue'));
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Gérer les permissions</h2>

      {Object.entries(allPermissions).map(([module, permissions]) => {
        const modulePermissionIds = permissions.map(p => p.id);
        const allSelected = modulePermissionIds.every(id =>
          selectedPermissions.includes(id)
        );
        const someSelected = modulePermissionIds.some(id =>
          selectedPermissions.includes(id)
        );

        return (
          <div key={module} className="mb-6 border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={() => toggleModule(permissions)}
                className="mr-2"
              />
              <h3 className="text-lg font-semibold capitalize">{module}</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 ml-6">
              {permissions.map((permission: any) => (
                <label
                  key={permission.id}
                  className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission.id)}
                    onChange={() => togglePermission(permission.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{permission.name}</div>
                    {permission.description && (
                      <div className="text-sm text-gray-500">
                        {permission.description}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">{permission.key}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex gap-2 mt-6">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Sauvegarder les permissions
        </button>
        <button
          onClick={() => setSelectedPermissions([])}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Tout désélectionner
        </button>
      </div>
    </div>
  );
}
```

## 🔒 Gestion des erreurs 403

### Intercepteur Axios pour gérer les erreurs de permissions

```typescript
// services/axiosConfig.ts
import axios from 'axios';
import { toast } from 'react-hot-toast';

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      const message = error.response.data.message ||
        'Vous n\'avez pas la permission d\'effectuer cette action';

      toast.error(message, {
        duration: 5000,
        position: 'top-right',
      });
    }
    return Promise.reject(error);
  }
);
```

## 📊 Tableau récapitulatif des permissions

| Module | Permissions disponibles |
|--------|------------------------|
| **users** | view, create, update, delete, reset_password, update_status, manage_permissions |
| **roles** | view, create, update, delete |
| **permissions** | view |
| **products** | view, create, update, delete, validate, manage_stock |
| **categories** | view, create, update, delete |
| **designs** | view, create, update, delete, validate, auto_validate |
| **orders** | view, update, validate, cancel |
| **vendors** | view, products.view, products.validate, commissions.view, commissions.update, funds.view, funds.process |
| **themes** | view, create, update, delete |
| **notifications** | view, send |
| **vendor_types** | view, create, update, delete |
| **design_categories** | view, create, update, delete |

## 🎨 Exemple complet d'une page protégée

```tsx
// pages/admin/users/index.tsx
import { useState } from 'react';
import { PermissionGuard } from '@/components/PermissionGuard';
import { usePermissions } from '@/hooks/usePermissions';
import { UserPermissionsManager } from '@/components/UserPermissionsManager';

export default function UsersPage() {
  const { hasPermission } = usePermissions();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  return (
    <PermissionGuard permissions="users.view">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>

          <PermissionGuard permissions="users.create">
            <button className="btn-primary">
              Créer un utilisateur
            </button>
          </PermissionGuard>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Lignes du tableau */}
              <tr>
                <td>John Doe</td>
                <td>john@example.com</td>
                <td>Admin</td>
                <td className="flex gap-2">
                  <PermissionGuard permissions="users.update">
                    <button className="btn-sm">Modifier</button>
                  </PermissionGuard>

                  <PermissionGuard permissions="users.manage_permissions">
                    <button
                      className="btn-sm"
                      onClick={() => setSelectedUserId(1)}
                    >
                      Permissions
                    </button>
                  </PermissionGuard>

                  <PermissionGuard permissions="users.delete">
                    <button className="btn-sm btn-danger">Supprimer</button>
                  </PermissionGuard>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Modal de gestion des permissions */}
        {selectedUserId && (
          <PermissionGuard permissions="users.manage_permissions">
            <UserPermissionsManager
              userId={selectedUserId}
              onSave={() => setSelectedUserId(null)}
            />
          </PermissionGuard>
        )}
      </div>
    </PermissionGuard>
  );
}
```

## ✅ Checklist d'intégration

- [ ] Exécuter le seed des permissions (`npx ts-node prisma/seed-permissions.ts`)
- [ ] Créer le service API pour les permissions
- [ ] Créer le hook `usePermissions`
- [ ] Créer le composant `PermissionGuard`
- [ ] Mettre à jour le contexte d'authentification pour charger les permissions
- [ ] Configurer l'intercepteur Axios pour gérer les erreurs 403
- [ ] Protéger les pages sensibles avec `PermissionGuard`
- [ ] Masquer les boutons d'actions selon les permissions
- [ ] Tester avec différents rôles (superadmin, admin, manager, vendor)

## 🚨 Points importants

1. **Toujours vérifier côté backend** : Les vérifications frontend sont pour l'UX, la sécurité réelle est côté backend
2. **Gérer les cas "pas de permissions"** : Toujours prévoir un fallback UI approprié
3. **Recharger les permissions** : Après attribution de nouvelles permissions, rafraîchir les données utilisateur
4. **Messages d'erreur clairs** : Indiquer à l'utilisateur pourquoi il ne peut pas effectuer une action

## 📞 Support

En cas de problème avec les permissions :
1. Vérifier que le seed a bien été exécuté
2. Vérifier que l'utilisateur a bien un rôle assigné
3. Vérifier les logs côté backend pour voir les permissions manquantes
4. Utiliser le endpoint `GET /admin/users/:id/permissions` pour déboguer
