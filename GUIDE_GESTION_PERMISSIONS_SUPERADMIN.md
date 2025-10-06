# Guide - Gestion des Permissions par le Superadmin

## Vue d'ensemble

Le système permet au **superadmin** d'attribuer des **permissions personnalisées** à n'importe quel utilisateur de manière granulaire et professionnelle. Cette fonctionnalité offre une flexibilité maximale dans la gestion des droits d'accès.

## Architecture

### Principe de fonctionnement

1. **Rôles standards** : Les utilisateurs peuvent avoir des rôles prédéfinis (admin, manager, etc.)
2. **Permissions personnalisées** : Le superadmin peut créer un rôle personnalisé unique pour un utilisateur spécifique
3. **Gestion automatique** : Les anciens rôles personnalisés sont automatiquement supprimés s'ils ne sont plus utilisés

### Schéma de base de données

```prisma
model User {
  id          Int         @id
  email       String
  roleId      Int?        // Référence au rôle (standard ou personnalisé)
  customRole  CustomRole? @relation(...)
}

model CustomRole {
  id          Int              @id
  name        String
  slug        String           @unique
  isSystem    Boolean          // true pour les rôles standards
  permissions RolePermission[]
  users       User[]
}

model Permission {
  id          Int              @id
  key         String           @unique
  name        String
  module      String          // Groupement par module
  roles       RolePermission[]
}

model RolePermission {
  roleId       Int
  permissionId Int
  role         CustomRole
  permission   Permission
}
```

## Endpoints disponibles

### 1. Récupérer toutes les permissions disponibles

**GET** `/admin/permissions`

Retourne toutes les permissions disponibles dans le système.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "users.view",
      "name": "Voir les utilisateurs",
      "description": "Permet de consulter la liste des utilisateurs",
      "module": "users"
    },
    {
      "id": 2,
      "key": "users.create",
      "name": "Créer des utilisateurs",
      "module": "users"
    }
  ]
}
```

### 2. Récupérer les permissions groupées par module

**GET** `/admin/permissions/by-module`

Retourne les permissions organisées par module (pratique pour l'interface).

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "key": "users.view",
        "name": "Voir les utilisateurs",
        "module": "users"
      }
    ],
    "products": [
      {
        "id": 10,
        "key": "products.view",
        "name": "Voir les produits",
        "module": "products"
      }
    ]
  }
}
```

### 3. Récupérer les permissions d'un utilisateur

**GET** `/admin/users/:id/permissions`

Retourne les permissions actuelles d'un utilisateur.

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "role": {
      "id": 2,
      "name": "Admin",
      "slug": "admin"
    },
    "permissions": [
      {
        "id": 1,
        "key": "users.view",
        "name": "Voir les utilisateurs",
        "module": "users"
      }
    ]
  }
}
```

### 4. Attribuer des permissions personnalisées à un utilisateur

**POST** `/admin/users/:id/permissions`

Crée un rôle personnalisé unique pour l'utilisateur avec les permissions spécifiées.

**Body:**
```json
{
  "permissionIds": [1, 2, 5, 10, 15]
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Permissions attribuées avec succès",
  "data": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "role": {
      "id": 42,
      "name": "Rôle personnalisé - John Doe",
      "slug": "custom-user-5-1234567890"
    },
    "permissions": [
      {
        "id": 1,
        "key": "users.view",
        "name": "Voir les utilisateurs",
        "module": "users"
      },
      {
        "id": 2,
        "key": "users.create",
        "name": "Créer des utilisateurs",
        "module": "users"
      }
    ]
  }
}
```

**Comportement:**
- Crée automatiquement un nouveau rôle personnalisé
- Si l'utilisateur avait déjà un rôle personnalisé, il est remplacé
- L'ancien rôle personnalisé est supprimé s'il n'est utilisé par personne d'autre
- Les rôles système (isSystem: true) ne sont jamais supprimés

### 5. Réinitialiser les permissions d'un utilisateur

**POST** `/admin/users/:id/permissions/reset`

Réinitialise l'utilisateur à un rôle standard.

**Body:**
```json
{
  "roleId": 2
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Permissions réinitialisées avec succès",
  "data": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "role": {
      "id": 2,
      "name": "Admin",
      "slug": "admin"
    },
    "permissions": [...]
  }
}
```

**Comportement:**
- Remplace le rôle personnalisé par le rôle standard spécifié
- Supprime l'ancien rôle personnalisé s'il n'est plus utilisé

### 6. Récupérer tous les rôles disponibles

**GET** `/admin/roles`

Retourne tous les rôles (standards et personnalisés) avec leurs permissions.

### 7. Récupérer les rôles disponibles pour créer des utilisateurs

**GET** `/admin/roles/available-for-users`

Retourne uniquement les rôles standards (exclut le rôle "vendor" et les rôles personnalisés).

## Flux d'utilisation recommandé

### Scénario 1 : Créer un utilisateur avec des permissions personnalisées

1. **Créer l'utilisateur** avec un rôle de base
   ```
   POST /admin/users
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "...",
     "roleId": 2,  // Rôle Admin de base
     "status": "ACTIVE"
   }
   ```

2. **Récupérer toutes les permissions disponibles**
   ```
   GET /admin/permissions/by-module
   ```

3. **Attribuer les permissions personnalisées**
   ```
   POST /admin/users/5/permissions
   {
     "permissionIds": [1, 2, 3, 5, 8, 10]
   }
   ```

### Scénario 2 : Modifier les permissions d'un utilisateur existant

1. **Voir les permissions actuelles**
   ```
   GET /admin/users/5/permissions
   ```

2. **Attribuer de nouvelles permissions** (remplace les anciennes)
   ```
   POST /admin/users/5/permissions
   {
     "permissionIds": [1, 2, 5, 10, 15, 20]
   }
   ```

### Scénario 3 : Réinitialiser un utilisateur à un rôle standard

1. **Récupérer les rôles disponibles**
   ```
   GET /admin/roles/available-for-users
   ```

2. **Réinitialiser l'utilisateur**
   ```
   POST /admin/users/5/permissions/reset
   {
     "roleId": 2
   }
   ```

## Modules de permissions disponibles

Basé sur l'analyse des endpoints du backend, voici les modules principaux :

### 1. **users** - Gestion des utilisateurs
- `users.view` - Voir les utilisateurs
- `users.create` - Créer des utilisateurs
- `users.update` - Modifier des utilisateurs
- `users.delete` - Supprimer des utilisateurs
- `users.reset_password` - Réinitialiser les mots de passe
- `users.update_status` - Changer le statut des utilisateurs

### 2. **roles** - Gestion des rôles et permissions
- `roles.view` - Voir les rôles
- `roles.create` - Créer des rôles
- `roles.update` - Modifier des rôles
- `roles.delete` - Supprimer des rôles
- `permissions.view` - Voir les permissions

### 3. **products** - Gestion des produits
- `products.view` - Voir les produits
- `products.create` - Créer des produits
- `products.update` - Modifier des produits
- `products.delete` - Supprimer des produits
- `products.validate` - Valider des produits
- `products.manage_stock` - Gérer les stocks

### 4. **categories** - Gestion des catégories
- `categories.view` - Voir les catégories
- `categories.create` - Créer des catégories
- `categories.update` - Modifier des catégories
- `categories.delete` - Supprimer des catégories

### 5. **designs** - Gestion des designs
- `designs.view` - Voir les designs
- `designs.create` - Créer des designs
- `designs.update` - Modifier des designs
- `designs.delete` - Supprimer des designs
- `designs.validate` - Valider des designs
- `designs.auto_validate` - Validation automatique

### 6. **orders** - Gestion des commandes
- `orders.view` - Voir les commandes
- `orders.update` - Modifier des commandes
- `orders.validate` - Valider des commandes
- `orders.cancel` - Annuler des commandes

### 7. **vendors** - Gestion des vendeurs
- `vendors.view` - Voir les vendeurs
- `vendors.products.view` - Voir les produits des vendeurs
- `vendors.products.validate` - Valider les produits des vendeurs
- `vendors.commissions.view` - Voir les commissions
- `vendors.commissions.update` - Modifier les commissions
- `vendors.funds.view` - Voir les appels de fonds
- `vendors.funds.process` - Traiter les appels de fonds

### 8. **themes** - Gestion des thèmes
- `themes.view` - Voir les thèmes
- `themes.create` - Créer des thèmes
- `themes.update` - Modifier des thèmes
- `themes.delete` - Supprimer des thèmes

### 9. **notifications** - Gestion des notifications
- `notifications.view` - Voir les notifications
- `notifications.send` - Envoyer des notifications

### 10. **vendor-types** - Types de vendeurs
- `vendor_types.view` - Voir les types de vendeurs
- `vendor_types.create` - Créer des types de vendeurs
- `vendor_types.update` - Modifier des types de vendeurs
- `vendor_types.delete` - Supprimer des types de vendeurs

## Avantages de cette approche

### ✅ Flexibilité maximale
- Le superadmin peut créer des combinaisons de permissions uniques pour chaque utilisateur
- Pas besoin de créer des rôles prédéfinis pour chaque cas d'usage

### ✅ Gestion automatique
- Les rôles personnalisés inutilisés sont automatiquement supprimés
- Pas de pollution de la base de données avec des rôles orphelins

### ✅ Sécurité
- Les rôles système ne peuvent jamais être modifiés ou supprimés
- Traçabilité complète des changements de permissions

### ✅ Scalabilité
- Système basé sur le RBAC (Role-Based Access Control) standard
- Facilement extensible avec de nouvelles permissions

### ✅ Interface utilisateur simple
- API REST claire et bien documentée
- Réponses structurées et cohérentes
- Messages d'erreur explicites

## Points d'attention

⚠️ **Rôles personnalisés uniques**
- Chaque attribution de permissions crée un nouveau rôle unique
- Si deux utilisateurs doivent avoir les mêmes permissions, créez plutôt un rôle standard réutilisable

⚠️ **Performance**
- Les rôles personnalisés sont automatiquement nettoyés
- Utilisez les rôles standards pour les configurations communes

⚠️ **Autorisation**
- Seul le superadmin peut attribuer des permissions
- Ajoutez des guards appropriés sur les endpoints sensibles

## Exemple d'implémentation frontend (React)

```typescript
// Composant pour gérer les permissions d'un utilisateur
function UserPermissionsManager({ userId }) {
  const [permissions, setPermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Charger toutes les permissions disponibles
  useEffect(() => {
    fetch('/admin/permissions/by-module')
      .then(res => res.json())
      .then(data => setPermissions(data.data));
  }, []);

  // Charger les permissions actuelles de l'utilisateur
  useEffect(() => {
    fetch(`/admin/users/${userId}/permissions`)
      .then(res => res.json())
      .then(data => setSelectedPermissions(data.data.permissions.map(p => p.id)));
  }, [userId]);

  // Sauvegarder les nouvelles permissions
  const handleSave = async () => {
    await fetch(`/admin/users/${userId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionIds: selectedPermissions })
    });
  };

  return (
    <div>
      {Object.entries(permissions).map(([module, perms]) => (
        <div key={module}>
          <h3>{module}</h3>
          {perms.map(perm => (
            <label key={perm.id}>
              <input
                type="checkbox"
                checked={selectedPermissions.includes(perm.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedPermissions([...selectedPermissions, perm.id]);
                  } else {
                    setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id));
                  }
                }}
              />
              {perm.name}
            </label>
          ))}
        </div>
      ))}
      <button onClick={handleSave}>Sauvegarder</button>
    </div>
  );
}
```

## Tests recommandés

1. **Test d'attribution de permissions**
   ```bash
   # Récupérer les permissions disponibles
   curl -X GET http://localhost:3000/admin/permissions/by-module

   # Attribuer des permissions à l'utilisateur ID 5
   curl -X POST http://localhost:3000/admin/users/5/permissions \
     -H "Content-Type: application/json" \
     -d '{"permissionIds": [1, 2, 3, 5]}'

   # Vérifier les permissions attribuées
   curl -X GET http://localhost:3000/admin/users/5/permissions
   ```

2. **Test de réinitialisation**
   ```bash
   # Réinitialiser l'utilisateur au rôle Admin (ID 2)
   curl -X POST http://localhost:3000/admin/users/5/permissions/reset \
     -H "Content-Type: application/json" \
     -d '{"roleId": 2}'
   ```

## Prochaines étapes recommandées

1. **Créer les permissions initiales** via un seed
2. **Ajouter des guards** pour vérifier les permissions sur chaque endpoint
3. **Créer une interface** frontend pour gérer facilement les permissions
4. **Implémenter l'audit log** pour tracer les changements de permissions
5. **Ajouter des tests unitaires** pour les nouvelles fonctionnalités
