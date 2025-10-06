# 🔐 Implémentation RBAC - Système de Gestion des Utilisateurs et Permissions

## ✅ Statut de l'implémentation

L'implémentation complète du système RBAC (Role-Based Access Control) est **terminée** et **fonctionnelle**.

## 📦 Composants implémentés

### 1. Modèles Prisma

- ✅ `CustomRole` - Rôles personnalisables
- ✅ `Permission` - Permissions granulaires
- ✅ `RolePermission` - Table pivot pour les permissions des rôles
- ✅ `AuditLog` - Logs d'audit pour traçabilité
- ✅ Extension du modèle `User` avec support RBAC

### 2. DTOs

#### Gestion des utilisateurs
- ✅ `CreateUserDto` - Création d'utilisateur
- ✅ `UpdateUserDto` - Mise à jour d'utilisateur
- ✅ `ListUsersQueryDto` - Filtres et pagination
- ✅ `ResetPasswordDto` - Réinitialisation de mot de passe
- ✅ `UpdateStatusDto` - Changement de statut

#### Gestion des rôles
- ✅ `CreateRoleDto` - Création de rôle
- ✅ `UpdateRoleDto` - Mise à jour de rôle

### 3. Services

- ✅ `AdminUsersService` - Gestion complète des utilisateurs
- ✅ `RolesService` - Gestion des rôles et permissions

### 4. Controllers

- ✅ `AdminUsersController` - 8 endpoints pour les utilisateurs
- ✅ `RolesController` - 5 endpoints pour les rôles
- ✅ `PermissionsController` - 2 endpoints pour les permissions

### 5. Guards & Middleware

- ✅ `PermissionsGuard` - Vérification des permissions
- ✅ `RequirePermissions` decorator - Décorateur pour protéger les routes

### 6. Seed & Initialisation

- ✅ 37 permissions créées (users, products, stock, orders, finance, vendors, etc.)
- ✅ 6 rôles système créés (superadmin, admin, finance, production, marketing, vendor)

## 📡 API Endpoints

### Gestion des utilisateurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/admin/users` | Liste des utilisateurs avec filtres et pagination |
| GET | `/admin/users/stats` | Statistiques des utilisateurs |
| GET | `/admin/users/:id` | Détails d'un utilisateur |
| POST | `/admin/users` | Créer un utilisateur |
| PATCH | `/admin/users/:id` | Mettre à jour un utilisateur |
| DELETE | `/admin/users/:id` | Supprimer un utilisateur (soft delete) |
| POST | `/admin/users/:id/reset-password` | Réinitialiser le mot de passe |
| PATCH | `/admin/users/:id/status` | Changer le statut (active/inactive/suspended) |

### Gestion des rôles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/admin/roles` | Liste des rôles avec permissions |
| GET | `/admin/roles/:id` | Détails d'un rôle |
| POST | `/admin/roles` | Créer un rôle |
| PATCH | `/admin/roles/:id` | Mettre à jour un rôle |
| DELETE | `/admin/roles/:id` | Supprimer un rôle |

### Gestion des permissions

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/admin/permissions` | Liste de toutes les permissions |
| GET | `/admin/permissions/by-module` | Permissions groupées par module |

## 🔒 Utilisation du système de permissions

### Protéger une route avec des permissions

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../guards/permissions.guard';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {

  @Get()
  @RequirePermissions('products.view')
  async findAll() {
    // Seuls les utilisateurs avec la permission 'products.view' peuvent accéder
  }

  @Post()
  @RequirePermissions('products.create')
  async create() {
    // Seuls les utilisateurs avec la permission 'products.create' peuvent accéder
  }

  @Delete(':id')
  @RequirePermissions('products.delete')
  async remove() {
    // Seuls les utilisateurs avec la permission 'products.delete' peuvent accéder
  }
}
```

### Permissions multiples (OR logic)

```typescript
@Get('admin/dashboard')
@RequirePermissions('users.manage', 'settings.manage')
async adminDashboard() {
  // L'utilisateur doit avoir AU MOINS UNE des permissions listées
}
```

## 📊 Modules et Permissions

### Modules disponibles

- **users** - Gestion des utilisateurs
- **products** - Gestion des produits
- **stock** - Gestion des stocks
- **orders** - Gestion des commandes
- **finance** - Finances et paiements
- **vendors** - Gestion des vendeurs
- **categories** - Gestion des catégories
- **marketing** - Marketing et promotions
- **settings** - Paramètres système
- **reports** - Rapports et analytics
- **designs** - Gestion des designs

### Structure des permissions

Format: `module.action`

Exemples:
- `users.view` - Voir les utilisateurs
- `products.create` - Créer des produits
- `stock.manage` - Gérer les stocks
- `finance.reports` - Générer des rapports financiers

## 🎭 Rôles système prédéfinis

### 1. Super Administrateur (`superadmin`)
- ✅ Accès complet à TOUTES les permissions
- 🔒 Rôle système (ne peut pas être supprimé)

### 2. Administrateur (`admin`)
- ✅ Accès à la plupart des permissions
- ❌ Sauf `settings.manage` (paramètres critiques)
- 🔒 Rôle système

### 3. Finance (`finance`)
- ✅ Permissions: `finance.*`, `orders.*`, `vendors.*`, `reports.*`
- 🔓 Rôle personnalisable

### 4. Production (`production`)
- ✅ Permissions: `stock.*`, `products.*`, `orders.*`
- 🔓 Rôle personnalisable

### 5. Marketing (`marketing`)
- ✅ Permissions: `marketing.*`, `products.*`, `reports.*`, `designs.*`
- 🔓 Rôle personnalisable

### 6. Vendeur (`vendor`)
- ✅ Permissions limitées: `products.view`, `designs.create`, `orders.view`, etc.
- 🔒 Rôle système

## 🧪 Tests

### Tester la création d'utilisateur

```bash
POST http://localhost:3000/admin/users
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "SecurePass123!",
  "roleId": 3,
  "status": "ACTIVE"
}
```

### Tester la récupération des utilisateurs

```bash
GET http://localhost:3000/admin/users?search=test&page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

### Tester la création d'un rôle

```bash
POST http://localhost:3000/admin/roles
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Responsable SAV",
  "slug": "support-manager",
  "description": "Gestion du service après-vente",
  "permissionIds": [1, 5, 10, 15, 20]
}
```

## 🔄 Réinitialiser les permissions et rôles

Si vous devez réinitialiser les permissions et rôles par défaut:

```bash
npx ts-node prisma/seed-rbac.ts
```

## 📚 Documentation API

La documentation complète de l'API est disponible via Swagger:

```
http://localhost:3000/api
```

Naviguez vers les sections:
- **Admin - Users Management**
- **Admin - Roles & Permissions**

## 🚀 Prochaines étapes

Pour utiliser pleinement le système RBAC:

1. **Migrer les utilisateurs existants** vers le nouveau système de rôles
2. **Protéger toutes les routes sensibles** avec `@RequirePermissions()`
3. **Créer des rôles personnalisés** selon vos besoins métier
4. **Implémenter l'audit log** pour tracer les actions importantes
5. **Tester les permissions** pour chaque rôle

## 💡 Bonnes pratiques

1. ✅ Toujours utiliser `JwtAuthGuard` ET `PermissionsGuard` ensemble
2. ✅ Ne jamais exposer les mots de passe dans les réponses API
3. ✅ Valider les permissions côté backend (ne pas faire confiance au frontend)
4. ✅ Logger toutes les actions sensibles (création/suppression utilisateur)
5. ✅ Utiliser des transactions pour les opérations critiques

## 🐛 Dépannage

### Erreur "Permission refusée"

Vérifiez que:
1. L'utilisateur est bien authentifié (JWT valide)
2. L'utilisateur a un `roleId` assigné
3. Le rôle de l'utilisateur contient la permission requise

### Erreur "Rôle système non modifiable"

Les rôles avec `isSystem: true` ne peuvent pas être modifiés ou supprimés. Créez un nouveau rôle personnalisé à la place.

## 📞 Support

Pour toute question sur l'implémentation, consultez:
- [admin-users.service.ts](src/admin-users/admin-users.service.ts) - Service de gestion des utilisateurs
- [roles.service.ts](src/roles/roles.service.ts) - Service de gestion des rôles
- [permissions.guard.ts](src/guards/permissions.guard.ts) - Guard de permissions
