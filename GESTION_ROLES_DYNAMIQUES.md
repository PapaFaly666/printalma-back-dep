# 🎭 Système de Gestion Dynamique des Rôles - Guide Complet

## ✅ Problème résolu

**Avant:** Lors de la création d'un utilisateur, il recevait automatiquement le rôle `VENDEUR` à cause de l'ancien enum.

**Maintenant:** L'admin peut créer des utilisateurs et leur attribuer dynamiquement n'importe quel rôle disponible (sauf vendor).

---

## 🔑 Changements apportés

### 1. Schema Prisma modifié

```prisma
model User {
  // AVANT
  role   Role   @default(VENDEUR)  // ❌ Forçait VENDEUR par défaut

  // MAINTENANT
  role   Role?                      // ✅ Optionnel, pas de défaut
  roleId Int?   @map("role_id")    // ✅ Utilise CustomRole à la place
}
```

### 2. Nouvel endpoint créé

**Endpoint:** `GET /admin/roles/available-for-users`

**Description:** Récupère tous les rôles disponibles pour créer des utilisateurs, **SAUF** le rôle "vendor"

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Super Administrateur",
      "slug": "superadmin",
      "description": "Accès complet à toutes les fonctionnalités",
      "isSystem": true
    },
    {
      "id": 2,
      "name": "Administrateur",
      "slug": "admin",
      "description": "Gestion quotidienne de la plateforme",
      "isSystem": true
    },
    {
      "id": 3,
      "name": "Finance",
      "slug": "finance",
      "description": "Accès aux données financières et paiements",
      "isSystem": false
    },
    {
      "id": 4,
      "name": "Production",
      "slug": "production",
      "description": "Gestion des stocks et de la production",
      "isSystem": false
    },
    {
      "id": 5,
      "name": "Marketing",
      "slug": "marketing",
      "description": "Gestion du marketing et des promotions",
      "isSystem": false
    }
    // ⚠️ Le rôle "vendor" (id: 6) N'EST PAS inclus
  ]
}
```

---

## 📡 Endpoints disponibles pour la gestion des rôles

### Pour créer/gérer des utilisateurs

| Endpoint | Description |
|----------|-------------|
| `GET /admin/roles/available-for-users` | ✅ Liste des rôles pour créer des utilisateurs (sans vendor) |
| `POST /admin/users` | Créer un utilisateur avec un `roleId` spécifique |
| `PATCH /admin/users/:id` | Changer le rôle d'un utilisateur existant |

### Pour gérer les rôles eux-mêmes

| Endpoint | Description |
|----------|-------------|
| `GET /admin/roles` | Liste de TOUS les rôles (y compris vendor) |
| `GET /admin/roles/:id` | Détails d'un rôle spécifique |
| `POST /admin/roles` | Créer un nouveau rôle personnalisé |
| `PATCH /admin/roles/:id` | Modifier un rôle (sauf rôles système) |
| `DELETE /admin/roles/:id` | Supprimer un rôle (sauf rôles système) |

### Pour gérer les permissions

| Endpoint | Description |
|----------|-------------|
| `GET /admin/permissions` | Liste de toutes les permissions |
| `GET /admin/permissions/by-module` | Permissions groupées par module |

---

## 🎯 Workflow pour le Frontend

### 1. Récupérer les rôles disponibles

```typescript
// Lors du chargement du formulaire de création d'utilisateur
const response = await fetch('/admin/roles/available-for-users', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { data: availableRoles } = await response.json();

// Afficher dans un <select>
availableRoles.map(role => (
  <option value={role.id}>{role.name}</option>
));
```

### 2. Créer un utilisateur avec un rôle

```typescript
const newUser = {
  name: "Jean Dupont",
  email: "jean.dupont@example.com",
  password: "SecurePass123!",
  roleId: 3, // ID du rôle sélectionné (ex: Finance)
  status: "active"
};

await fetch('/admin/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newUser)
});
```

### 3. Changer le rôle d'un utilisateur existant

```typescript
await fetch(`/admin/users/${userId}`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roleId: 4 // Nouveau rôle (ex: Production)
  })
});
```

---

## 🔐 Rôles système vs Rôles personnalisés

### Rôles système (`isSystem: true`)

Ces rôles **NE PEUVENT PAS** être modifiés ou supprimés :

- **Super Administrateur** (`superadmin`) - Accès total
- **Administrateur** (`admin`) - Gestion quotidienne
- **Vendeur** (`vendor`) - Compte vendeur (non visible dans available-for-users)

### Rôles personnalisés (`isSystem: false`)

Ces rôles **PEUVENT** être modifiés et supprimés :

- **Finance** - Gestion financière
- **Production** - Gestion stocks/production
- **Marketing** - Campagnes marketing
- **+ Tout rôle créé par l'admin**

---

## 🆕 Créer un nouveau rôle personnalisé

### Étape 1 : Récupérer les permissions disponibles

```bash
GET /admin/permissions/by-module
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "users": [
      { "id": 1, "key": "users.view", "name": "Voir les utilisateurs" },
      { "id": 2, "key": "users.create", "name": "Créer des utilisateurs" },
      ...
    ],
    "products": [...],
    "stock": [...],
    ...
  }
}
```

### Étape 2 : Créer le rôle avec les permissions sélectionnées

```bash
POST /admin/roles
{
  "name": "Responsable SAV",
  "slug": "support-manager",
  "description": "Gestion du service après-vente",
  "permissionIds": [1, 5, 10, 15, 20]
}
```

### Étape 3 : Le nouveau rôle est immédiatement disponible

Il apparaîtra dans `GET /admin/roles/available-for-users` et pourra être assigné aux utilisateurs.

---

## ⚠️ Important : Différence entre les endpoints

### `/admin/roles` (TOUS les rôles)

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Super Administrateur", ... },
    { "id": 2, "name": "Administrateur", ... },
    { "id": 3, "name": "Finance", ... },
    { "id": 4, "name": "Production", ... },
    { "id": 5, "name": "Marketing", ... },
    { "id": 6, "name": "Vendeur", ... }  // ✅ Inclus
  ]
}
```

**Usage:** Pour gérer les rôles (CRUD), voir tous les rôles existants

---

### `/admin/roles/available-for-users` (Sans vendor)

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Super Administrateur", ... },
    { "id": 2, "name": "Administrateur", ... },
    { "id": 3, "name": "Finance", ... },
    { "id": 4, "name": "Production", ... },
    { "id": 5, "name": "Marketing", ... }
    // ❌ Pas de "Vendeur"
  ]
}
```

**Usage:** Pour afficher les rôles dans le formulaire de création/modification d'utilisateur

---

## 🧪 Tests

### Test 1 : Récupérer les rôles disponibles

```bash
GET /admin/roles/available-for-users
Authorization: Bearer YOUR_TOKEN
```

**Résultat attendu:** ✅ 5 rôles (sans vendor)

---

### Test 2 : Créer un utilisateur avec rôle Finance

```bash
POST /admin/users
{
  "name": "Marie Martin",
  "email": "marie@example.com",
  "password": "SecurePass123!",
  "roleId": 3,
  "status": "active"
}
```

**Résultat attendu:**
- ✅ Utilisateur créé
- ✅ `role` (enum) = `null`
- ✅ `roleId` = 3
- ✅ `customRole.name` = "Finance"

---

### Test 3 : Créer un rôle personnalisé

```bash
POST /admin/roles
{
  "name": "Chef de Projet",
  "slug": "project-manager",
  "description": "Gestion de projets et équipes",
  "permissionIds": [1, 6, 11, 16, 26]
}
```

**Résultat attendu:**
- ✅ Rôle créé avec succès
- ✅ Apparaît dans `/admin/roles/available-for-users`
- ✅ Peut être assigné aux utilisateurs

---

### Test 4 : Lister les utilisateurs (sans vendeurs)

```bash
GET /admin/users?page=1&limit=20
```

**Résultat attendu:**
- ✅ Aucun utilisateur avec `customRole.slug = "vendor"`
- ✅ Tous les utilisateurs ont un `role` (customRole)
- ✅ Aucune erreur `Cannot read properties of null`

---

## 📊 Résumé des changements

| Aspect | Avant | Maintenant |
|--------|-------|-----------|
| **Rôle par défaut** | VENDEUR (enum) | Aucun (null) |
| **Attribution rôle** | Automatique | Dynamique via `roleId` |
| **Gestion rôles** | Fixe (enum) | Dynamique (base de données) |
| **Création rôles** | ❌ Impossible | ✅ Possible via API |
| **Permissions** | ❌ Non gérées | ✅ Granulaires |
| **Exclusion vendors** | ❌ Non géré | ✅ Automatique |

---

## ✅ Checklist Frontend

Pour que le système fonctionne correctement, le frontend doit :

- [ ] Utiliser `GET /admin/roles/available-for-users` pour le formulaire de création d'utilisateur
- [ ] Envoyer `roleId` (number) lors de la création d'utilisateur
- [ ] Vérifier `user.role !== null` avant d'accéder à `user.role.name`
- [ ] Afficher `user.role.name` (pas l'ancien enum `role`)
- [ ] Permettre de créer des rôles personnalisés via l'interface admin
- [ ] Permettre d'assigner des permissions lors de la création de rôle

---

## 🚀 Résultat final

✅ **L'admin peut maintenant:**

1. Créer des utilisateurs avec des rôles **dynamiques**
2. Créer ses propres rôles **personnalisés**
3. Assigner des **permissions granulaires** à chaque rôle
4. Gérer les utilisateurs **sans voir les vendeurs**
5. Changer le rôle d'un utilisateur **à tout moment**

✅ **Plus de problème de rôle VENDEUR** assigné automatiquement !

---

## 📞 Support

Pour toute question :
- Voir [roles.service.ts](src/roles/roles.service.ts) - Méthode `getAvailableRolesForUsers()`
- Voir [roles.controller.ts](src/roles/roles.controller.ts) - Endpoint `GET /admin/roles/available-for-users`
- Voir [RBAC_IMPLEMENTATION.md](RBAC_IMPLEMENTATION.md) - Documentation complète RBAC
