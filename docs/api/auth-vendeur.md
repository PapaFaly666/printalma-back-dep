# Documentation API - Authentification Vendeur

## 1. Inscription Vendeur (Auto-inscription)

### Request
```http
POST /auth/register-vendeur
Content-Type: application/json

{
  "email": "vendeur@example.com",
  "password": "password123",
  "firstName": "Jean",
  "lastName": "Dupont",
  "vendeur_type": "DESIGNER"
}
```

**Champs obligatoires :**
- `email`: string (email valide, unique)
- `password`: string (minimum 8 caractères)
- `firstName`: string
- `lastName`: string
- `vendeur_type`: "DESIGNER" | "INFLUENCEUR" | "ARTISTE"

### Response Succès
```json
{
  "success": true,
  "message": "Votre compte a été créé. Il sera activé prochainement par le SuperAdmin."
}
```
**Status:** 201 Created

### Response Erreurs
```json
// Email déjà utilisé
{
  "message": "Email déjà utilisé",
  "error": "Bad Request",
  "statusCode": 400
}

// Mot de passe trop court
{
  "message": [
    "password must be longer than or equal to 8 characters",
    "vendeur_type must be one of the following values: DESIGNER, ARTISTE, INFLUENCEUR"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 2. Vérifier Statut d'Activation

### Request
```http
GET /auth/activation-status/{email}
```

### Response
```json
// Compte non activé
{
  "activated": false
}

// Compte activé
{
  "activated": true
}
```

---

## 3. Connexion Vendeur

### Request
```http
POST /auth/login
Content-Type: application/json

{
  "email": "vendeur@example.com",
  "password": "password123"
}
```

### Response Succès
```json
{
  "user": {
    "id": 4,
    "email": "vendeur@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "VENDEUR",
    "roleDisplay": "VENDEUR",
    "customRole": null,
    "vendeur_type": "DESIGNER",
    "status": false,
    "profile_photo_url": null,
    "phone": null,
    "shop_name": null,
    "country": null,
    "address": null
  }
}
```

**Cookie créé:** `auth_token` (httpOnly, 30 jours)

### Response Erreur
```json
{
  "message": "❌ Email ou mot de passe incorrect",
  "error": "Unauthorized",
  "statusCode": 401
}
```

---

## 4. Première Connexion (avec code d'activation)

### Request
```http
POST /auth/first-login
Content-Type: application/json

{
  "email": "vendeur@example.com",
  "activationCode": "123456",
  "newPassword": "nouveaupassword123",
  "confirmPassword": "nouveaupassword123"
}
```

### Response Succès
```json
{
  "message": "Compte activé avec succès",
  "user": {
    "id": 4,
    "email": "vendeur@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "VENDEUR",
    "vendeur_type": "DESIGNER",
    "status": true
  }
}
```

---

## 5. Déconnexion

### Request
```http
POST /auth/logout
```

### Response
```json
{
  "message": "Déconnexion réussie",
  "timestamp": "2024-12-11T10:30:00.000Z"
}
```

---

## 6. Mot de Passe Oublié

### Request
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "vendeur@example.com"
}
```

### Response
```json
{
  "message": "Un email de réinitialisation a été envoyé si l'adresse existe",
  "resetRequested": true
}
```

---

## 7. Réinitialiser Mot de Passe

### Request
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-uuid",
  "newPassword": "nouveaupassword123",
  "confirmPassword": "nouveaupassword123"
}
```

### Response Succès
```json
{
  "message": "Mot de passe réinitialisé avec succès",
  "success": true
}
```

---

## 8. Vérifier Disponibilité Nom de Boutique

### Request
```http
GET /auth/check-shop-name?nom=MaBoutiqueDesign
```

### Response
```json
{
  "available": true
}
```

---

## Notes Importantes pour le Frontend

### Gestion de l'Authentification
- Le token est stocké dans un cookie `httpOnly`
- Pas besoin de gérer le localStorage pour le token
- Le cookie est valide 30 jours

### États du Compte
- `status: false` = Compte créé mais non activé par l'admin
- Le vendeur peut se connecter même avec `status: false`
- Certaines fonctionnalités peuvent être limitées selon le statut

### Types de Vendeur
- `DESIGNER`: Créateur de designs
- `INFLUENCEUR: Influenceur/marketer
- `ARTISTE`: Artiste créateur

### Flow d'Inscription Complet
1. **POST** `/auth/register-vendeur` → Création compte (inactif)
2. **GET** `/auth/activation-status/{email}` → Vérifier statut
3. **POST** `/auth/login` → Connexion (même si inactif)
4. Attendre activation par admin
5. Une fois activé, accès complet à la plateforme

### Messages Clés à Afficher
- Après inscription: "Votre compte a été créé. Il sera activé prochainement par le SuperAdmin."
- Pendant connexion: Si `status: false`, afficher "Compte en attente d'activation"
- À la déconnexion: Message de confirmation