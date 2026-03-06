# 🎭 Guide du Système de Rôles et Permissions - PrintAlma

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Rôles disponibles](#rôles-disponibles)
4. [Permissions](#permissions)
5. [Backend - Utilisation](#backend---utilisation)
6. [Frontend - Intégration](#frontend---intégration)
7. [Exemples d'utilisation](#exemples-dutilisation)
8. [API Endpoints](#api-endpoints)

---

## 🎯 Vue d'ensemble

Le système de rôles et permissions de PrintAlma permet une gestion granulaire des accès utilisateurs dans l'espace administrateur. Il combine:

- **6 rôles prédéfinis** (enum Role)
- **Rôles personnalisés** (CustomRole)
- **36 permissions granulaires** organisées par module
- **Guards et Decorators** pour sécuriser les endpoints

---

## 🏗️ Architecture

### Modèles de données (Prisma)

#### **1. Enum Role**
```prisma
enum Role {
  SUPERADMIN    // Accès total
  ADMIN         // Gestionnaire complet
  MODERATEUR    // Validation & Contenu
  SUPPORT       // Support & Commandes
  COMPTABLE     // Finances uniquement
  VENDEUR       // Espace vendeur
}
```

#### **2. CustomRole** (Rôles personnalisés)
```prisma
model CustomRole {
  id          Int
  name        String            // Ex: "Super Administrateur"
  slug        String @unique    // Ex: "superadmin"
  description String?
  isSystem    Boolean           // Rôles système non supprimables
  permissions RolePermission[]
  users       User[]
}
```

#### **3. Permission**
```prisma
model Permission {
  id          Int
  key         String @unique    // Ex: "products.mockups.view"
  name        String            // Ex: "Voir les mockups"
  description String?
  module      String            // Ex: "products"
  roles       RolePermission[]
}
```

#### **4. RolePermission** (Table pivot)
```prisma
model RolePermission {
  roleId       Int
  permissionId Int
  role         CustomRole
  permission   Permission
}
```

---

## 👥 Rôles disponibles

### 1. SUPERADMIN
**Accès:** Total
**Permissions:** Toutes (36/36)
**Cas d'usage:** Propriétaire de la plateforme

**Peut:**
- ✅ Tout faire
- ✅ Créer/modifier/supprimer des utilisateurs
- ✅ Gérer les rôles et permissions
- ✅ Accéder à tous les modules

### 2. ADMIN
**Accès:** Gestionnaire complet
**Permissions:** 32/36
**Cas d'usage:** Administrateur principal

**Peut:**
- ✅ Gérer produits, commandes, designs
- ✅ Valider les designs
- ✅ Gérer le contenu
- ✅ Traiter les paiements
- ✅ Voir les statistiques
- ❌ Créer/supprimer des utilisateurs admin
- ❌ Modifier les rôles

### 3. MODERATEUR
**Accès:** Validation & Contenu
**Permissions:** 14/36
**Cas d'usage:** Modérateur de contenu

**Peut:**
- ✅ Valider/rejeter les designs
- ✅ Gérer catégories et thèmes
- ✅ Gérer le contenu du site
- ✅ Restaurer depuis la corbeille
- 👁️ Voir produits (lecture seule)
- 👁️ Voir commandes (lecture seule)
- ❌ Modifier produits ou commandes

### 4. SUPPORT
**Accès:** Support client
**Permissions:** 6/36
**Cas d'usage:** Service client

**Peut:**
- ✅ Gérer les commandes (statut, livraison)
- ✅ Voir les informations des vendeurs
- 👁️ Voir les produits (lecture seule)
- ❌ Valider designs
- ❌ Modifier produits

### 5. COMPTABLE
**Accès:** Finances
**Permissions:** 6/36
**Cas d'usage:** Comptabilité

**Peut:**
- ✅ Traiter les demandes de paiement
- ✅ Voir les statistiques financières
- 👁️ Voir commandes (lecture seule)
- 👁️ Voir vendeurs (lecture seule)
- ❌ Modifier commandes
- ❌ Gérer produits

### 6. VENDEUR
**Accès:** Espace vendeur
**Permissions:** Séparées (non admin)
**Cas d'usage:** Vendeurs de la plateforme

---

## 🔐 Permissions

### Matrice complète des permissions

| Module | Permission | SUPERADMIN | ADMIN | MODERATEUR | SUPPORT | COMPTABLE |
|--------|-----------|------------|-------|------------|---------|-----------|
| **Produits - Mockups** |
| `products.mockups.view` | ✅ | ✅ | 👁️ | 👁️ | ❌ |
| `products.mockups.create` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `products.mockups.edit` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `products.mockups.delete` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Produits - Catégories** |
| `products.categories.view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `products.categories.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Produits - Thèmes** |
| `products.themes.view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `products.themes.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Produits - Stock** |
| `products.stock.view` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `products.stock.manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Validation** |
| `validation.designs.view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `validation.designs.validate` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `validation.auto.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Commandes** |
| `orders.view` | ✅ | ✅ | 👁️ | ✅ | 👁️ |
| `orders.manage` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `orders.delivery.view` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `orders.delivery.manage` | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Utilisateurs** |
| `users.admins.view` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `users.admins.create` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users.admins.edit` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users.admins.delete` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users.admins.roles` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users.vendors.view` | ✅ | ✅ | 👁️ | 👁️ | 👁️ |
| `users.vendors.manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Contenu** |
| `content.view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `content.manage` | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Statistiques** |
| `statistics.view` | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Paiements** |
| `payments.requests.view` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `payments.requests.process` | ✅ | ✅ | ❌ | ❌ | ✅ |
| `payments.methods.view` | ✅ | ✅ | ❌ | ❌ | 👁️ |
| `payments.methods.manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Paramètres** |
| `settings.view` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `settings.manage` | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Corbeille** |
| `trash.view` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `trash.restore` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `trash.delete` | ✅ | ✅ | ❌ | ❌ | ❌ |

**Légende:** ✅ = Accès complet | 👁️ = Lecture seule | ❌ = Pas d'accès

---

## 🔧 Backend - Utilisation

### 1. Sécuriser un endpoint avec permissions

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ProductsController {

  // Exiger TOUTES les permissions listées
  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @RequirePermissions('products.mockups.view')
  async getAllProducts() {
    // Seuls les utilisateurs avec la permission peuvent accéder
  }

  // Exiger AU MOINS UNE des permissions
  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @RequireAnyPermission('products.mockups.create', 'products.mockups.edit')
  async createProduct() {
    // Utilisateur doit avoir create OU edit
  }
}
```

### 2. Vérifier une permission programmatiquement

```typescript
import { PermissionsService } from './permissions/permissions.service';

constructor(private permissionsService: PermissionsService) {}

async myMethod(userId: number) {
  // Vérifier une permission
  const canView = await this.permissionsService.userHasPermission(
    userId,
    'products.mockups.view'
  );

  if (!canView) {
    throw new ForbiddenException('Accès refusé');
  }

  // Vérifier plusieurs permissions (toutes requises)
  const hasAll = await this.permissionsService.userHasAllPermissions(
    userId,
    ['products.mockups.view', 'products.mockups.edit']
  );

  // Vérifier plusieurs permissions (au moins une)
  const hasAny = await this.permissionsService.userHasAnyPermission(
    userId,
    ['orders.view', 'orders.manage']
  );
}
```

### 3. Gérer les rôles et permissions

```typescript
// Créer un rôle personnalisé
const role = await permissionsService.createCustomRole({
  name: 'Chef de Projet',
  slug: 'chef-projet',
  description: 'Gère les projets et le contenu',
  permissionIds: [1, 2, 3, 5, 8],
});

// Mettre à jour les permissions d'un rôle
await permissionsService.updateRolePermissions(roleId, [1, 2, 3, 4]);

// Supprimer un rôle (sauf rôles système)
await permissionsService.deleteRole(roleId);
```

---

## 🎨 Frontend - Intégration

### 1. Service API (`rolesService.ts`)

Le service `rolesService.ts` a déjà été créé dans `/src/services/` avec toutes les méthodes:

```typescript
import rolesService from '@/services/rolesService';

// Récupérer toutes les permissions groupées par module
const permissions = await rolesService.getAllPermissions();

// Récupérer tous les rôles
const roles = await rolesService.getAllRoles();

// Récupérer un rôle spécifique
const role = await rolesService.getRoleById(5);

// Récupérer mes permissions
const myPerms = await rolesService.getMyPermissions();

// Créer un rôle
const newRole = await rolesService.createRole({
  name: 'Chef de Projet',
  slug: 'chef-projet',
  description: 'Gère les projets',
  permissionIds: [1, 2, 3],
});

// Mettre à jour les permissions
await rolesService.updateRolePermissions(roleId, [1, 2, 3, 4]);

// Supprimer un rôle
await rolesService.deleteRole(roleId);
```

### 2. Page de gestion des rôles (À créer)

Créez `/src/pages/admin/RolesManagementPage.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import rolesService, { CustomRole, PermissionsGrouped } from '@/services/rolesService';

export const RolesManagementPage = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionsGrouped>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [rolesData, permsData] = await Promise.all([
      rolesService.getAllRoles(),
      rolesService.getAllPermissions(),
    ]);
    setRoles(rolesData);
    setPermissions(permsData);
  };

  return (
    <div>
      <h1>Gestion des Rôles et Permissions</h1>
      {/* Interface de gestion */}
    </div>
  );
};
```

### 3. Mise à jour de la page de création d'utilisateur

Modifiez `/src/pages/admin/AdminUserCreatePage.tsx` pour inclure la sélection du rôle:

```typescript
// Ajouter un sélecteur de rôle
const [selectedRole, setSelectedRole] = useState<number | null>(null);
const [availableRoles, setAvailableRoles] = useState<CustomRole[]>([]);

useEffect(() => {
  loadRoles();
}, []);

const loadRoles = async () => {
  const roles = await rolesService.getAllRoles();
  setAvailableRoles(roles);
};

// Dans le formulaire
<select onChange={(e) => setSelectedRole(Number(e.target.value))}>
  <option value="">Sélectionnez un rôle</option>
  {availableRoles.map(role => (
    <option key={role.id} value={role.id}>
      {role.name} {role.isSystem && '(Système)'}
    </option>
  ))}
</select>
```

---

## 📚 API Endpoints

### Base URL
```
/admin/permissions
```

### Endpoints disponibles

| Méthode | Endpoint | Description | Rôles autorisés |
|---------|----------|-------------|-----------------|
| `GET` | `/all` | Récupère toutes les permissions | SUPERADMIN, ADMIN |
| `GET` | `/roles` | Liste tous les rôles | SUPERADMIN, ADMIN |
| `GET` | `/roles/:id` | Détails d'un rôle | SUPERADMIN, ADMIN |
| `GET` | `/my-permissions` | Mes permissions | Tous (admin) |
| `POST` | `/roles` | Créer un rôle | SUPERADMIN |
| `PUT` | `/roles/:id/permissions` | Modifier les permissions | SUPERADMIN |
| `DELETE` | `/roles/:id` | Supprimer un rôle | SUPERADMIN |

---

## ✅ Checklist d'intégration frontend

- [x] Service API créé (`rolesService.ts`)
- [ ] Page de gestion des rôles
- [ ] Page de gestion des permissions par rôle
- [ ] Mise à jour de la page de création d'utilisateur
- [ ] Mise à jour de la page d'édition d'utilisateur
- [ ] Affichage du rôle dans la liste des utilisateurs
- [ ] Protection des routes frontend selon les rôles

---

## 🔄 Initialisation

Pour (ré)initialiser les permissions et rôles:

```bash
cd /path/to/printalma-back-dep
npx ts-node prisma/seed-roles-permissions.ts
```

Cela créera:
- ✅ 36 permissions
- ✅ 5 rôles système (SUPERADMIN, ADMIN, MODERATEUR, SUPPORT, COMPTABLE)
- ✅ Associations rôles-permissions

---

## 🚀 Prochaines étapes

1. **Créer l'interface de gestion des rôles**
   - Liste des rôles avec nombre d'utilisateurs
   - Création/édition/suppression de rôles personnalisés
   - Attribution des permissions par rôle

2. **Mettre à jour la gestion des utilisateurs**
   - Sélection du rôle lors de la création
   - Modification du rôle d'un utilisateur
   - Affichage des permissions de l'utilisateur

3. **Ajouter des indicateurs visuels**
   - Badge du rôle dans le header
   - Icônes de permissions dans les menus
   - Tooltips explicatifs

4. **Tests**
   - Tester chaque rôle
   - Vérifier les restrictions d'accès
   - Valider les permissions spécifiques

---

## 📞 Support

Pour toute question ou problème:
- Consulter la documentation Prisma
- Vérifier les logs du backend
- Tester les permissions via Postman/Insomnia

---

**Date de création:** 4 mars 2026
**Version:** 1.0.0
**Auteur:** Claude Sonnet 4.5
