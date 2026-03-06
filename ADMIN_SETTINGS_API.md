# API des Paramètres Administrateur - PrintAlma Backend

Ce document décrit les endpoints backend créés pour la gestion des paramètres administrateur.

## 📋 Vue d'ensemble

Le module **AdminSettings** fournit des endpoints pour permettre aux administrateurs (ADMIN et SUPERADMIN) de gérer leurs paramètres personnels et les paramètres généraux de l'application.

---

## 🔐 Authentification

**Tous les endpoints nécessitent :**
- **Token JWT** (Bearer Token) dans les headers
- **Rôle** : `ADMIN` ou `SUPERADMIN`

```http
Authorization: Bearer <votre_token_jwt>
```

---

## 📍 Endpoints Disponibles

### 1. Changer le mot de passe de l'administrateur

**Endpoint :** `PUT /admin/settings/change-password`

**Description :** Permet à un administrateur connecté de changer son mot de passe.

**Body (JSON) :**
```json
{
  "currentPassword": "motDePasseActuel123",
  "newPassword": "nouveauMotDePasse123",
  "confirmPassword": "nouveauMotDePasse123"
}
```

**Validation :**
- `currentPassword` : requis
- `newPassword` : requis, minimum 8 caractères
- `confirmPassword` : requis, doit correspondre à `newPassword`
- Le nouveau mot de passe doit être différent de l'ancien

**Réponse (200 OK) :**
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès",
  "changedAt": "2024-01-15T10:30:00.000Z"
}
```

**Erreurs possibles :**
- `400 Bad Request` : Mots de passe ne correspondent pas ou nouveau mot de passe identique à l'ancien
- `401 Unauthorized` : Mot de passe actuel incorrect
- `404 Not Found` : Utilisateur non trouvé

---

### 2. Récupérer les paramètres de l'application

**Endpoint :** `GET /admin/settings/app`

**Description :** Récupère tous les paramètres généraux de l'application.

**Réponse (200 OK) :**
```json
{
  "appName": "PrintAlma",
  "contactEmail": "contact@printalma.com",
  "supportEmail": "support@printalma.com",
  "contactPhone": "+221 77 123 45 67",
  "companyAddress": "Dakar, Sénégal",
  "websiteUrl": "https://printalma.com",
  "vendorRegistrationEnabled": true,
  "emailNotificationsEnabled": true,
  "defaultVendorCommission": 40,
  "minWithdrawalAmount": 10000,
  "currency": "XOF",
  "maintenanceMode": false,
  "maintenanceMessage": "Le site est en maintenance",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "updatedBy": 1
}
```

**Note :** Les paramètres sont actuellement gérés via les variables d'environnement.

---

### 3. Mettre à jour les paramètres de l'application

**Endpoint :** `PUT /admin/settings/app`

**Description :** Met à jour les paramètres généraux de l'application.

**Body (JSON) :**
```json
{
  "appName": "PrintAlma",
  "contactEmail": "nouveau-contact@printalma.com",
  "supportEmail": "support@printalma.com",
  "contactPhone": "+221 77 123 45 67",
  "companyAddress": "Dakar, Plateau, Sénégal",
  "websiteUrl": "https://printalma.com",
  "vendorRegistrationEnabled": true,
  "emailNotificationsEnabled": true,
  "defaultVendorCommission": 45,
  "minWithdrawalAmount": 15000,
  "currency": "XOF",
  "maintenanceMode": false,
  "maintenanceMessage": "Maintenance programmée ce soir"
}
```

**Tous les champs sont optionnels.**

**Réponse (200 OK) :**
```json
{
  "appName": "PrintAlma",
  "contactEmail": "nouveau-contact@printalma.com",
  "supportEmail": "support@printalma.com",
  "contactPhone": "+221 77 123 45 67",
  "companyAddress": "Dakar, Plateau, Sénégal",
  "websiteUrl": "https://printalma.com",
  "vendorRegistrationEnabled": true,
  "emailNotificationsEnabled": true,
  "defaultVendorCommission": 45,
  "minWithdrawalAmount": 15000,
  "currency": "XOF",
  "maintenanceMode": false,
  "maintenanceMessage": "Maintenance programmée ce soir",
  "updatedAt": "2024-01-15T11:00:00.000Z",
  "updatedBy": 1
}
```

**Note :** Pour le moment, cette fonctionnalité enregistre les modifications mais les paramètres sont toujours gérés via les variables d'environnement. Une implémentation future stockera ces paramètres dans une table dédiée.

---

### 4. Récupérer les statistiques du dashboard admin

**Endpoint :** `GET /admin/settings/stats`

**Description :** Récupère les statistiques générales pour le dashboard administrateur.

**Réponse (200 OK) :**
```json
{
  "totalVendors": 150,
  "activeVendors": 120,
  "inactiveVendors": 30,
  "totalOrders": 5000,
  "pendingOrders": 50,
  "totalRevenue": 50000000,
  "totalProducts": 2000,
  "activeProducts": 1800
}
```

**Description des champs :**
- `totalVendors` : Nombre total de vendeurs (actifs et inactifs, non supprimés)
- `activeVendors` : Nombre de vendeurs avec `status = true`
- `inactiveVendors` : Nombre de vendeurs avec `status = false`
- `totalOrders` : Nombre total de commandes dans le système
- `pendingOrders` : Nombre de commandes en statut PENDING ou PROCESSING
- `totalRevenue` : Chiffre d'affaires total (commandes DELIVERED ou CONFIRMED)
- `totalProducts` : Nombre total de produits (admin + vendeurs, non supprimés)
- `activeProducts` : Nombre de produits validés et actifs

---

### 5. Récupérer le profil de l'administrateur connecté

**Endpoint :** `GET /admin/settings/profile`

**Description :** Récupère les informations détaillées du profil de l'administrateur connecté.

**Réponse (200 OK) :**
```json
{
  "id": 1,
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "admin@printalma.com",
  "role": "SUPERADMIN",
  "profile_photo_url": "https://res.cloudinary.com/...",
  "created_at": "2023-01-01T00:00:00.000Z",
  "last_login_at": "2024-01-15T10:00:00.000Z",
  "customRole": {
    "id": 1,
    "name": "Super Administrateur",
    "slug": "superadmin",
    "description": "Accès complet à toutes les fonctionnalités",
    "permissions": [
      {
        "id": 1,
        "key": "users.create",
        "name": "Créer des utilisateurs",
        "module": "users",
        "description": "Permet de créer de nouveaux utilisateurs"
      },
      {
        "id": 2,
        "key": "users.delete",
        "name": "Supprimer des utilisateurs",
        "module": "users",
        "description": "Permet de supprimer des utilisateurs"
      }
      // ... autres permissions
    ]
  }
}
```

**Note :** Le champ `customRole` sera `null` si l'administrateur n'a pas de rôle personnalisé assigné.

---

## 🧪 Exemples d'utilisation avec Axios (Frontend)

### Changer le mot de passe

```typescript
import axios from 'axios';

const changeAdminPassword = async (passwords: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => {
  try {
    const response = await axios.put(
      '/admin/settings/change-password',
      passwords,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    console.log('Mot de passe changé:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response?.data);
    throw error;
  }
};
```

### Récupérer les statistiques

```typescript
const getAdminStats = async () => {
  try {
    const response = await axios.get('/admin/settings/stats', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};
```

### Récupérer le profil admin

```typescript
const getAdminProfile = async () => {
  try {
    const response = await axios.get('/admin/settings/profile', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};
```

---

## 🔒 Sécurité

### Protections implémentées :

1. **Vérification du mot de passe actuel** : Le mot de passe actuel doit être correct pour changer le mot de passe
2. **Validation de la complexité** : Minimum 8 caractères pour le nouveau mot de passe
3. **Vérification de la confirmation** : Le nouveau mot de passe et sa confirmation doivent correspondre
4. **Unicité** : Le nouveau mot de passe doit être différent de l'ancien
5. **Hashage bcrypt** : Tous les mots de passe sont hashés avec bcrypt (10 rounds)
6. **Guards NestJS** : JwtAuthGuard et RolesGuard protègent tous les endpoints
7. **Restriction par rôle** : Seuls ADMIN et SUPERADMIN peuvent accéder à ces endpoints

---

## 📝 Notes d'implémentation

### Variables d'environnement utilisées

Les paramètres d'application utilisent les variables d'environnement suivantes :

```env
APP_NAME=PrintAlma
CONTACT_EMAIL=contact@printalma.com
SUPPORT_EMAIL=support@printalma.com
CONTACT_PHONE=+221 77 123 45 67
COMPANY_ADDRESS=Dakar, Sénégal
WEBSITE_URL=https://printalma.com
VENDOR_REGISTRATION_ENABLED=true
EMAIL_NOTIFICATIONS_ENABLED=true
DEFAULT_VENDOR_COMMISSION=40
MIN_WITHDRAWAL_AMOUNT=10000
CURRENCY=XOF
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=Le site est en maintenance
```

### Évolution future

Dans une version future, les paramètres d'application seront stockés dans une table dédiée plutôt que dans les variables d'environnement, permettant une modification en temps réel sans redémarrage du serveur.

---

## 🐛 Gestion des erreurs

Toutes les erreurs sont retournées au format JSON :

```json
{
  "statusCode": 400,
  "message": "Le nouveau mot de passe et la confirmation ne correspondent pas",
  "error": "Bad Request"
}
```

### Codes d'erreur possibles :

- **400** : Bad Request (données invalides)
- **401** : Unauthorized (authentification échouée, mot de passe incorrect)
- **403** : Forbidden (rôle insuffisant)
- **404** : Not Found (ressource non trouvée)
- **500** : Internal Server Error (erreur serveur)

---

## 📚 Swagger/OpenAPI

Tous les endpoints sont documentés avec Swagger. Accédez à la documentation interactive via :

```
http://localhost:3004/api
```

(Remplacez `localhost:3004` par l'URL de votre serveur backend)

---

## ✅ Tests

Pour tester les endpoints, vous pouvez utiliser :

1. **Postman** : Importez la collection depuis Swagger
2. **cURL** : Exemples ci-dessous
3. **Frontend** : Utilisez les exemples Axios fournis ci-dessus

### Exemple cURL :

```bash
# Changer le mot de passe
curl -X PUT http://localhost:3004/admin/settings/change-password \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "ancien123",
    "newPassword": "nouveau123",
    "confirmPassword": "nouveau123"
  }'

# Récupérer les stats
curl -X GET http://localhost:3004/admin/settings/stats \
  -H "Authorization: Bearer VOTRE_TOKEN"

# Récupérer le profil
curl -X GET http://localhost:3004/admin/settings/profile \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

---

## 🎯 Utilisation dans le Frontend

### Page `/admin/settings` recommandée

La page frontend devrait contenir les sections suivantes :

1. **Profil Admin** : Afficher les informations du profil (nom, email, rôle, permissions)
2. **Changement de mot de passe** : Formulaire pour changer le mot de passe
3. **Paramètres de l'application** : Formulaire pour modifier les paramètres généraux
4. **Statistiques** : Dashboard avec les statistiques clés

### Exemple de structure de composants React :

```
/admin/settings
├── AdminProfile.tsx        (Affichage du profil)
├── ChangePassword.tsx      (Formulaire de changement de mot de passe)
├── AppSettings.tsx         (Paramètres de l'application)
└── AdminStats.tsx          (Dashboard des statistiques)
```

---

**Date de création :** 2024-01-15
**Dernière mise à jour :** 2024-01-15
**Auteur :** Claude Code (Assistant IA)
**Version :** 1.0.0
