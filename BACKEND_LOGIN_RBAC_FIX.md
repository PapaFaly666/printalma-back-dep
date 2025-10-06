# Fix Login RBAC - Utilisateurs CustomRole

## Problème Identifié

Les utilisateurs créés via le système RBAC (`/admin/users`) ne pouvaient pas se connecter car le backend ne retournait pas le `customRole` avec les permissions. Le champ `role` était `null` pour ces utilisateurs, rendant impossible l'accès aux pages frontend.

## Solution Implémentée

### 1. Modification du Service Login (`auth.service.ts`)

**Changements dans `login()`:**

```typescript
// Récupérer l'utilisateur avec son customRole et permissions
const user = await this.prisma.user.findUnique({
    where: { email },
    include: {
        customRole: {
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        }
    }
});

// Mapper customRole vers role string pour compatibilité
let roleString = user.role;
let customRoleData = null;

if (user.customRole) {
    const permissions = user.customRole.permissions.map(rp => ({
        id: rp.permission.id,
        slug: rp.permission.key, // Le champ s'appelle 'key' dans la DB
        name: rp.permission.name,
        module: rp.permission.module,
        description: rp.permission.description
    }));

    customRoleData = {
        id: user.customRole.id,
        name: user.customRole.name,
        slug: user.customRole.slug,
        description: user.customRole.description,
        permissions
    };

    // Mapper le slug vers le role string pour compatibilité
    const slugUpper = user.customRole.slug.toUpperCase();
    if (slugUpper === 'SUPERADMIN') {
        roleString = Role.SUPERADMIN;
    } else if (slugUpper === 'ADMIN') {
        roleString = Role.ADMIN;
    } else if (slugUpper === 'VENDOR') {
        roleString = Role.VENDEUR;
    } else {
        // Autres rôles custom (finance, production, marketing) → ADMIN
        roleString = Role.ADMIN;
    }
}

// Retourner les données utilisateur
return {
    access_token,
    user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: roleString,           // ✅ Jamais null maintenant
        customRole: customRoleData, // ✅ Objet avec permissions ou null
        vendeur_type: user.vendeur_type,
        status: user.status,
        // ... autres champs
    }
};
```

### 2. Modification du Endpoint `/auth/profile`

**Changements dans `getUserProfile()`:**

```typescript
async getUserProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            roleId: true, // ✅ Ajouter roleId
            // ... autres champs
        }
    });

    if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
    }

    // Récupérer le customRole avec permissions si disponible
    let customRoleData = null;
    let roleString = user.role;

    if (user.roleId) {
        const customRoleWithPermissions = await this.prisma.customRole.findUnique({
            where: { id: user.roleId },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });

        if (customRoleWithPermissions) {
            const permissions = customRoleWithPermissions.permissions.map(rp => ({
                id: rp.permission.id,
                slug: rp.permission.key,
                name: rp.permission.name,
                module: rp.permission.module,
                description: rp.permission.description
            }));

            customRoleData = {
                id: customRoleWithPermissions.id,
                name: customRoleWithPermissions.name,
                slug: customRoleWithPermissions.slug,
                description: customRoleWithPermissions.description,
                permissions
            };

            // Mapper le slug vers le role string
            const slugUpper = customRoleWithPermissions.slug.toUpperCase();
            if (slugUpper === 'SUPERADMIN') {
                roleString = Role.SUPERADMIN;
            } else if (slugUpper === 'ADMIN') {
                roleString = Role.ADMIN;
            } else if (slugUpper === 'VENDOR') {
                roleString = Role.VENDEUR;
            } else {
                roleString = Role.ADMIN;
            }
        }
    }

    return {
        ...user,
        role: roleString,      // ✅ Role string mappé
        customRole: customRoleData // ✅ CustomRole avec permissions
    };
}
```

### 3. Modification du Controller `/auth/check`

**Changements dans `checkAuth()`:**

```typescript
@UseGuards(JwtAuthGuard)
@Get('check')
async checkAuth(@Req() req: RequestWithUser) {
    // Récupérer le profil complet avec customRole
    const profile = await this.authService.getUserProfile(req.user.sub);

    return {
        isAuthenticated: true,
        user: {
            id: profile.id,
            email: profile.email,
            firstName: profile.firstName,
            lastName: profile.lastName,
            role: profile.role,              // ✅ Role string mappé
            customRole: profile.customRole,  // ✅ CustomRole avec permissions
            vendeur_type: profile.vendeur_type,
            status: profile.status,
            profile_photo_url: profile.profile_photo_url
        }
    };
}
```

## Format de Réponse

### Ancien Format (PROBLÉMATIQUE)
```json
{
  "user": {
    "id": 21,
    "email": "pfd.d@zig.univ.sn",
    "firstName": "Papa",
    "lastName": "Faly",
    "role": null,  // ❌ NULL pour utilisateurs RBAC
    "status": true
  }
}
```

### Nouveau Format (CORRECT)

**Pour un utilisateur RBAC (ex: SUPERADMIN):**
```json
{
  "user": {
    "id": 21,
    "email": "pfd.d@zig.univ.sn",
    "firstName": "Papa",
    "lastName": "Faly",
    "role": "SUPERADMIN",  // ✅ Mappé depuis customRole.slug
    "customRole": {         // ✅ Objet complet avec permissions
      "id": 1,
      "name": "Super Admin",
      "slug": "superadmin",
      "description": "Accès complet au système",
      "permissions": [
        {
          "id": 1,
          "slug": "users.view",
          "name": "Voir utilisateurs",
          "module": "users",
          "description": "Voir la liste des utilisateurs"
        },
        // ... autres permissions
      ]
    },
    "vendeur_type": null,
    "status": true
  }
}
```

**Pour un ancien utilisateur (sans customRole):**
```json
{
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",       // ✅ De la colonne 'role' enum
    "customRole": null,    // ✅ Null car pas de roleId
    "vendeur_type": null,
    "status": true
  }
}
```

## Mapping Role String ↔ CustomRole Slug

| CustomRole Slug | Role String (Enum) | Description |
|-----------------|-------------------|-------------|
| `superadmin` | `SUPERADMIN` | Accès total système |
| `admin` | `ADMIN` | Gestion complète |
| `vendor` | `VENDEUR` | Vendeur |
| `finance` | `ADMIN` | Finance (mappé vers ADMIN) |
| `production` | `ADMIN` | Production (mappé vers ADMIN) |
| `marketing` | `ADMIN` | Marketing (mappé vers ADMIN) |

**Raison du mapping:** Le frontend utilise actuellement le champ `role` (string enum) pour déterminer les accès. Les rôles custom non-standards sont mappés vers `ADMIN` pour compatibilité.

## Endpoints Affectés

Les modifications impactent **3 endpoints principaux** :

1. ✅ **`POST /auth/login`** - Login initial
2. ✅ **`GET /auth/profile`** - Récupération du profil
3. ✅ **`GET /auth/check`** - Vérification d'authentification

## Tests à Effectuer

### Test 1 : Login utilisateur RBAC
```bash
POST http://localhost:3004/auth/login
Content-Type: application/json

{
  "email": "pfd.d@zig.univ.sn",
  "password": "printalmatest123"
}
```

**Réponse attendue:**
- ✅ `role` = `"SUPERADMIN"` (pas null)
- ✅ `customRole` = objet complet avec permissions
- ✅ `customRole.slug` = `"superadmin"`
- ✅ `customRole.permissions` = array de permissions

### Test 2 : Vérification d'auth
```bash
GET http://localhost:3004/auth/check
Authorization: Bearer <token>
```

**Réponse attendue:**
- ✅ Même format que login
- ✅ `role` et `customRole` présents

### Test 3 : Profil utilisateur
```bash
GET http://localhost:3004/auth/profile
Authorization: Bearer <token>
```

**Réponse attendue:**
- ✅ Tous les champs utilisateur + `customRole`

## Compatibilité Frontend

Le frontend est déjà prêt à gérer ce format grâce à la fonction `hasPermission()` :

```typescript
hasPermission(user: User | null, requiredRoles: string[]): boolean {
  if (!user) return false;

  // 1️⃣ Vérifier le système RBAC (nouveau) via customRole.slug
  if (user.customRole) {
    const slug = user.customRole.slug.toUpperCase();
    return requiredRoles.some(role => slug === role.toUpperCase());
  }

  // 2️⃣ Fallback vers l'ancien système (role string)
  return requiredRoles.includes(user.role);
}
```

## Notes Importantes

1. **Double système** : Les deux systèmes (ancien enum `role` et nouveau `customRole`) fonctionnent en parallèle
2. **Rétrocompatibilité** : Les anciens utilisateurs (sans `roleId`) continuent de fonctionner
3. **Mapping automatique** : Le `role` string est toujours renseigné, même pour les utilisateurs RBAC
4. **Permissions disponibles** : Le frontend peut maintenant vérifier les permissions granulaires via `user.customRole.permissions`

## Prochaines Étapes

1. ✅ Backend modifié et compilé sans erreur
2. ⏳ Tester le login avec un utilisateur RBAC
3. ⏳ Vérifier que le frontend peut accéder aux pages
4. ⏳ Implémenter la vérification des permissions granulaires côté frontend (optionnel)

---

**Date:** 2025-10-03
**Auteur:** Backend Team
**Version:** 1.0
