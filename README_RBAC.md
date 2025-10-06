# 🎯 Système RBAC - Guide Rapide

## 📝 Ce qui a changé

### Avant
- Utilisateurs avec rôles fixes (ADMIN, VENDEUR, SUPERADMIN)
- Pas de personnalisation possible
- Tous les ADMIN avaient les mêmes droits

### Maintenant
- **SUPERADMIN peut créer des rôles personnalisés**
- **Chaque rôle a des permissions CRUD spécifiques**
- **13 modules disponibles** (users, products, orders, etc.)
- **67 permissions au total**

---

## 🚀 Démarrage Rapide

### 1. Exécuter le seed (déjà fait normalement)

```bash
cd c:\Users\HP\Desktop\printalma-perso\printalma-back-dep
npx ts-node prisma/seed-complete-rbac.ts
```

Cela crée :
- ✅ 67 permissions
- ✅ 6 rôles prédéfinis
- ✅ Tout est prêt !

---

### 2. Connexion SUPERADMIN

Connecte-toi avec ton compte SUPERADMIN (lazou@gmail.com).

**Tu as maintenant accès à** :
- `/admin/roles` - Gérer les rôles
- `/admin/permissions` - Voir les permissions
- `/admin/users` - Créer des utilisateurs avec des rôles

---

## 📋 Les 13 Modules Disponibles

| Module | Permissions | Utilisation |
|--------|-------------|-------------|
| `users` | view, create, update, delete, manage-roles, manage-status | Gestion utilisateurs |
| `roles` | view, create, update, delete, manage-permissions | Gestion rôles |
| `products` | view, create, update, delete, manage-images, manage-variants | Produits/Mockups |
| `categories` | view, create, update, delete, manage-hierarchy | Catégories |
| `themes` | view, create, update, delete | Thèmes |
| `designs` | view, view-own, create, update, delete, validate, auto-validate | Designs vendeurs |
| `vendors` | view, create, update, delete, manage-products, validate-products, manage-types | Vendeurs |
| `stocks` | view, update, view-history, manage-alerts | Stocks |
| `funds` | view, view-own, create, process, view-stats | Demandes de fonds |
| `commissions` | view, create, update, delete, view-earnings | Commissions |
| `orders` | view, view-own, update-status, validate, cancel, view-stats | Commandes |
| `notifications` | view, create, delete | Notifications |
| `system` | view-settings, update-settings, view-logs, manage-cloudinary | Système |

---

## 🎯 Exemple Concret

### Scénario : Créer un rôle "Service Client"

**1. En tant que SUPERADMIN, tu vas sur la page de gestion des rôles**

**2. Tu cliques sur "Créer un rôle"**

**3. Tu remplis le formulaire** :
```
Nom: Service Client
Slug: customer-service
Description: Gestion des commandes et support client

Permissions sélectionnées:
✅ orders.view (Voir les commandes)
✅ orders.update-status (Modifier le statut)
✅ notifications.view (Voir les notifications)
✅ notifications.create (Créer des notifications)
```

**4. Le rôle est créé avec 4 permissions**

**5. Tu crées un nouvel utilisateur** :
```
Prénom: Sophie
Nom: Leblanc
Email: sophie@example.com
Rôle: Service Client ← Nouveau rôle créé
```

**6. Sophie Leblanc peut maintenant** :
- ✅ Voir les commandes
- ✅ Changer le statut des commandes
- ✅ Voir et créer des notifications
- ❌ Pas accès aux produits
- ❌ Pas accès aux stocks
- ❌ Pas accès aux finances

---

## 📡 API Endpoints Importants

### Créer un rôle
```http
POST /admin/roles
Content-Type: application/json

{
  "name": "Service Client",
  "slug": "customer-service",
  "description": "Gestion commandes",
  "permissionIds": [51, 52, 63, 64]
}
```

### Liste des permissions disponibles
```http
GET /admin/permissions/by-module
```

Retourne :
```json
{
  "users": [
    { "id": 1, "key": "users.view", "name": "Voir les utilisateurs" },
    { "id": 2, "key": "users.create", "name": "Créer un utilisateur" },
    ...
  ],
  "products": [...],
  "orders": [...]
}
```

### Créer un utilisateur avec un rôle
```http
POST /admin/users
Content-Type: application/json

{
  "firstName": "Sophie",
  "lastName": "Leblanc",
  "email": "sophie@example.com",
  "roleId": 7,  // ID du rôle "Service Client"
  "phone": "+221775551234",
  "country": "Sénégal"
}
```

---

## 🔐 Sécurité

### Qui peut créer des rôles ?
- ✅ SUPERADMIN uniquement
- ❌ Autres utilisateurs non

### Qui peut créer des utilisateurs avec des rôles ?
- ✅ SUPERADMIN
- ✅ Utilisateurs ayant la permission `users.create`

### Comment ça fonctionne ?

```
Requête → JwtAuthGuard → PermissionsGuard → Controller
              ↓              ↓
         Vérifie token   Vérifie permissions
                           ↓
                    Si SUPERADMIN → ✅ Bypass
                    Sinon → Vérifie dans customRole.permissions
```

---

## 📚 Documentation Complète

Pour l'implémentation frontend détaillée, consulte :
- **[FRONTEND_RBAC_COMPLETE_GUIDE.md](FRONTEND_RBAC_COMPLETE_GUIDE.md)** - Guide complet avec code
- **[RBAC_IMPLEMENTATION_SUMMARY.md](RBAC_IMPLEMENTATION_SUMMARY.md)** - Résumé technique
- **[FRONTEND_ROLE_DISPLAY_GUIDE.md](FRONTEND_ROLE_DISPLAY_GUIDE.md)** - Fix affichage rôles

---

## ✅ Checklist

### Backend (Déjà fait)
- [x] Seed RBAC exécuté
- [x] 67 permissions créées
- [x] 6 rôles prédéfinis créés
- [x] Guards appliqués
- [x] Endpoints `/admin/roles` fonctionnels
- [x] Endpoints `/admin/permissions` fonctionnels

### Frontend (À faire)
- [ ] Interfaces TypeScript créées
- [ ] Service RBAC créé
- [ ] Hook `useRBACPermission` créé
- [ ] Composant `PermissionGuard` créé
- [ ] Page gestion des rôles créée
- [ ] Formulaire création rôle créé
- [ ] Formulaire création utilisateur mis à jour

---

## 🎉 Résultat

Tu as maintenant un système RBAC professionnel où :
1. Le SUPERADMIN crée des rôles personnalisés
2. Chaque rôle a des permissions CRUD spécifiques
3. Les utilisateurs créés ont UNIQUEMENT les permissions de leur rôle
4. Le système vérifie les permissions à chaque requête

**C'est exactement ce que tu voulais !** 🚀
