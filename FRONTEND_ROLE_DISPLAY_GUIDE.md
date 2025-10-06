# 🎭 Guide Frontend - Affichage Correct des Rôles RBAC

## 📋 Problème Résolu

**Avant** : Tous les utilisateurs avec un rôle custom (Finances, Production, Marketing) affichaient "ADMIN"

**Maintenant** : Chaque utilisateur affiche son vrai nom de rôle (Super Administrateur, Finances, etc.)

---

## 🔧 Changements Backend

Le backend retourne maintenant **2 champs** pour le rôle :

```typescript
{
  user: {
    role: "ADMIN",              // ⚙️ Pour la logique backend (guards)
    roleDisplay: "Finances",    // 🎨 Pour l'affichage frontend
    customRole: {               // 📦 Objet complet du rôle avec permissions
      id: 2,
      name: "Finances",
      slug: "finance",
      description: "...",
      permissions: [...]
    }
  }
}
```

---

## 📱 Modifications Frontend Requises

### 1️⃣ Interface TypeScript - Ajouter `roleDisplay`

**Fichier** : `src/types/auth.types.ts` (ou équivalent)

```typescript
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;                    // ⚙️ Role enum (SUPERADMIN, ADMIN, VENDEUR)
  roleDisplay?: string;            // 🆕 Nom affiché du rôle
  customRole?: CustomRole | null;  // 📦 Objet rôle RBAC
  vendeur_type?: string | null;
  status: boolean;
  profile_photo_url?: string | null;
  phone?: string | null;
  shop_name?: string | null;
  country?: string | null;
  address?: string | null;
}

export interface CustomRole {
  id: number;
  name: string;              // Ex: "Super Administrateur", "Finances"
  slug: string;              // Ex: "superadmin", "finance"
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  slug: string;              // Ex: "users.view", "finances.manage"
  name: string;              // Ex: "Voir les utilisateurs"
  module: string;            // Ex: "users", "finances"
  description?: string;
}
```

---

### 2️⃣ Service Auth - Gérer `roleDisplay`

**Fichier** : `src/services/auth.service.ts`

```typescript
// Lors du traitement de la réponse login
const processLoginResponse = (data: any) => {
  const user: User = {
    id: data.user.id,
    email: data.user.email,
    firstName: data.user.firstName,
    lastName: data.user.lastName,
    role: data.user.role,                    // ⚙️ Role logique
    roleDisplay: data.user.roleDisplay,      // 🆕 Role affiché
    customRole: data.user.customRole,        // 📦 Objet complet
    vendeur_type: data.user.vendeur_type,
    status: data.user.status,
    profile_photo_url: data.user.profile_photo_url,
    phone: data.user.phone,
    shop_name: data.user.shop_name,
    country: data.user.country,
    address: data.user.address,
  };

  return {
    user,
    token: data.access_token
  };
};
```

---

### 3️⃣ Affichage du Rôle - Utiliser `roleDisplay`

**Avant** ❌ :
```tsx
<div className="user-role">
  {user.role} {/* Affichait toujours "ADMIN" */}
</div>
```

**Après** ✅ :
```tsx
<div className="user-role">
  {user.roleDisplay || user.customRole?.name || user.role}
</div>
```

**Explication** :
1. **`roleDisplay`** : Nom du rôle fourni par le backend (priorité 1)
2. **`customRole?.name`** : Nom depuis l'objet customRole (backup)
3. **`role`** : Role enum si pas de customRole (fallback)

---

### 4️⃣ Exemples d'Affichage

#### 🎯 Badge de Rôle

```tsx
const RoleBadge = ({ user }: { user: User }) => {
  const displayRole = user.roleDisplay || user.customRole?.name || user.role;

  // Couleurs selon le rôle
  const getRoleColor = (role: string) => {
    const slug = user.customRole?.slug || user.role?.toLowerCase();
    switch (slug) {
      case 'superadmin':
        return 'bg-red-500 text-white';
      case 'admin':
        return 'bg-blue-500 text-white';
      case 'finance':
        return 'bg-green-500 text-white';
      case 'production':
        return 'bg-purple-500 text-white';
      case 'marketing':
        return 'bg-orange-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(displayRole)}`}>
      {displayRole}
    </span>
  );
};
```

#### 👤 Profil Utilisateur

```tsx
const UserProfile = ({ user }: { user: User }) => {
  return (
    <div className="user-profile">
      <h2>{user.firstName} {user.lastName}</h2>
      <p className="role">
        Rôle : {user.roleDisplay || user.customRole?.name || user.role}
      </p>

      {user.customRole && (
        <div className="permissions">
          <h3>Permissions ({user.customRole.permissions.length})</h3>
          <ul>
            {user.customRole.permissions.map(perm => (
              <li key={perm.id}>
                <strong>{perm.module}</strong>: {perm.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

#### 📊 Liste des Utilisateurs

```tsx
const UsersList = ({ users }: { users: User[] }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Nom</th>
          <th>Email</th>
          <th>Rôle</th>
          <th>Statut</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>{user.firstName} {user.lastName}</td>
            <td>{user.email}</td>
            <td>
              <RoleBadge user={user} />
            </td>
            <td>
              <span className={user.status ? 'text-green-600' : 'text-red-600'}>
                {user.status ? 'Actif' : 'Inactif'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

### 5️⃣ Vérification des Permissions

**Utiliser le hook `usePermissions` existant** :

```tsx
import { usePermissions } from '@/hooks/usePermissions';

const FinancesPage = () => {
  const { hasPermission } = usePermissions();

  if (!hasPermission('finances.view')) {
    return <div>Accès refusé. Vous n'avez pas la permission finances.view</div>;
  }

  return (
    <div>
      <h1>Page Finances</h1>
      {hasPermission('finances.manage') && (
        <button>Gérer les finances</button>
      )}
    </div>
  );
};
```

---

## 🎨 Mapping des Rôles vers Couleurs/Icons

```typescript
export const ROLE_CONFIG = {
  superadmin: {
    color: 'red',
    icon: '👑',
    bgClass: 'bg-red-500',
    textClass: 'text-red-600',
    label: 'Super Admin'
  },
  admin: {
    color: 'blue',
    icon: '⚡',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-600',
    label: 'Administrateur'
  },
  finance: {
    color: 'green',
    icon: '💰',
    bgClass: 'bg-green-500',
    textClass: 'text-green-600',
    label: 'Finances'
  },
  production: {
    color: 'purple',
    icon: '🏭',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-600',
    label: 'Production'
  },
  marketing: {
    color: 'orange',
    icon: '📢',
    bgClass: 'bg-orange-500',
    textClass: 'text-orange-600',
    label: 'Marketing'
  },
  vendor: {
    color: 'yellow',
    icon: '🛍️',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-600',
    label: 'Vendeur'
  }
};

// Fonction helper
export const getRoleConfig = (user: User) => {
  const slug = user.customRole?.slug || user.role?.toLowerCase() || 'admin';
  return ROLE_CONFIG[slug] || ROLE_CONFIG.admin;
};
```

---

## 🔒 Logique de Permissions (Rappel)

### Hiérarchie des Permissions

1. **`role === 'SUPERADMIN'`** → Accès total (bypass toutes permissions)
2. **`customRole?.slug === 'superadmin'`** → Accès total (nouveau système)
3. **Permissions spécifiques** → Vérifier `customRole.permissions`

```typescript
// Hook usePermissions
export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // SUPERADMIN bypass (ancien + nouveau système)
    if (user.role === 'SUPERADMIN' || user.customRole?.slug === 'superadmin') {
      return true;
    }

    // Vérifier dans les permissions custom
    if (user.customRole?.permissions) {
      return user.customRole.permissions.some(p => p.slug === permission);
    }

    return false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(perm => hasPermission(perm));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(perm => hasPermission(perm));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
};
```

---

## ✅ Checklist Frontend

- [ ] Ajouter `roleDisplay?: string` dans l'interface `User`
- [ ] Mettre à jour le service auth pour capturer `roleDisplay`
- [ ] Remplacer tous les affichages `{user.role}` par `{user.roleDisplay || user.customRole?.name || user.role}`
- [ ] Créer un composant `RoleBadge` réutilisable
- [ ] Configurer les couleurs/icônes pour chaque rôle
- [ ] Tester avec différents rôles (superadmin, finance, production, marketing)
- [ ] Vérifier que les permissions fonctionnent correctement
- [ ] Vérifier le localStorage (doit contenir `roleDisplay`)

---

## 🧪 Tests

### Test 1 : Connexion avec différents rôles

```typescript
// Super Admin
{
  role: "SUPERADMIN",
  roleDisplay: "Super Administrateur",
  customRole: { name: "Super Administrateur", slug: "superadmin", ... }
}

// Finance
{
  role: "ADMIN",
  roleDisplay: "Finances",
  customRole: { name: "Finances", slug: "finance", ... }
}

// Production
{
  role: "ADMIN",
  roleDisplay: "Production",
  customRole: { name: "Production", slug: "production", ... }
}

// Admin classique (sans customRole)
{
  role: "ADMIN",
  roleDisplay: "ADMIN",  // ou null
  customRole: null
}
```

### Test 2 : Affichage

Console du navigateur :
```javascript
// Récupérer l'utilisateur
const user = JSON.parse(localStorage.getItem('auth_session')).user;

// Vérifier roleDisplay
console.log('Role affiché:', user.roleDisplay || user.customRole?.name || user.role);

// Vérifier permissions
console.log('Permissions:', user.customRole?.permissions.map(p => p.slug));
```

---

## 🐛 Debugging

Si le rôle ne s'affiche toujours pas correctement :

1. **Vérifier le localStorage** :
```javascript
const session = JSON.parse(localStorage.getItem('auth_session'));
console.log('User data:', session.user);
console.log('roleDisplay:', session.user.roleDisplay);
console.log('customRole:', session.user.customRole);
```

2. **Vérifier la réponse API** :
```javascript
// Dans auth.service.ts, après le login
console.log('🔍 Réponse login:', response.data);
console.log('🔍 Role:', response.data.user.role);
console.log('🔍 RoleDisplay:', response.data.user.roleDisplay);
```

3. **Vérifier le rendu** :
```tsx
<div>
  Debug: role={user.role}, roleDisplay={user.roleDisplay}, customRole={user.customRole?.name}
</div>
```

---

## 📞 Support

Si vous avez des questions :
1. Vérifier que le backend retourne bien `roleDisplay`
2. Vérifier que le frontend capture bien `roleDisplay` dans le service auth
3. Vérifier que l'affichage utilise `roleDisplay` en priorité

**Exemple complet d'affichage** :
```tsx
{user.roleDisplay || user.customRole?.name || user.role || 'Utilisateur'}
```

Cette cascade garantit qu'on affiche toujours quelque chose de cohérent ! 🎯
