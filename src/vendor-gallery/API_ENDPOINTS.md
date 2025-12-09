# API Endpoints - Système de Galerie Vendeur

## Base URL
```
http://localhost:3004
```

---

## 🔐 Endpoints Vendeur (Authentification requise)

Tous ces endpoints nécessitent l'en-tête:
```
Authorization: Bearer {JWT_TOKEN}
```

### 1. Créer une galerie

**Endpoint:**
```
POST /vendor/galleries
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Body (FormData):**
```
title: string (3-100 caractères, requis)
description: string (max 500 caractères, optionnel)
captions: JSON string (optionnel)
images: File[] (exactement 5 fichiers requis)
```

**Exemple de captions:**
```json
[
  {"caption": "Design floral"},
  {"caption": "Motif abstrait"},
  {"caption": "Style minimaliste"},
  {"caption": "Couleurs vives"},
  {"caption": "Géométrie moderne"}
]
```

**Réponse (201 Created):**
```json
{
  "success": true,
  "message": "Galerie créée avec succès",
  "data": {
    "id": 1,
    "vendorId": 5,
    "title": "Ma Collection",
    "description": "Description...",
    "status": "DRAFT",
    "isPublished": false,
    "images": [...],
    "createdAt": "2024-12-07T10:00:00.000Z",
    "updatedAt": "2024-12-07T10:00:00.000Z"
  }
}
```

---

### 2. Récupérer ses galeries

**Endpoint:**
```
GET /vendor/galleries
```

**Query Parameters:**
```
page: number (optionnel, défaut: 1)
limit: number (optionnel, défaut: 10)
status: "DRAFT" | "PUBLISHED" | "ARCHIVED" (optionnel)
```

**Exemples d'URL:**
```
GET /vendor/galleries
GET /vendor/galleries?page=1&limit=10
GET /vendor/galleries?status=PUBLISHED
GET /vendor/galleries?page=2&limit=20&status=DRAFT
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "galleries": [
      {
        "id": 1,
        "vendorId": 5,
        "title": "Ma Collection",
        "status": "PUBLISHED",
        "isPublished": true,
        "images_count": 5,
        "images": [...],
        "createdAt": "2024-12-07T10:00:00.000Z",
        "updatedAt": "2024-12-07T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### 3. Récupérer une galerie spécifique

**Endpoint:**
```
GET /vendor/galleries/:id
```

**Exemple:**
```
GET /vendor/galleries/1
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "vendorId": 5,
    "title": "Ma Collection",
    "description": "Description...",
    "status": "PUBLISHED",
    "isPublished": true,
    "images": [
      {
        "id": 1,
        "imageUrl": "https://res.cloudinary.com/.../image1.webp",
        "publicId": "galleries/vendor_5/gallery-123.webp",
        "caption": "Design floral",
        "orderPosition": 1,
        "fileSize": 245678,
        "mimeType": "image/webp",
        "width": 1200,
        "height": 800,
        "createdAt": "2024-12-07T10:00:00.000Z"
      }
    ],
    "images_count": 5,
    "createdAt": "2024-12-07T10:00:00.000Z",
    "updatedAt": "2024-12-07T10:00:00.000Z"
  }
}
```

**Erreur (404 Not Found):**
```json
{
  "success": false,
  "message": "Galerie non trouvée",
  "statusCode": 404,
  "error": "Not Found"
}
```

---

### 4. Mettre à jour une galerie

**Endpoint:**
```
PUT /vendor/galleries/:id
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "title": "Nouveau titre",
  "description": "Nouvelle description",
  "status": "PUBLISHED"
}
```

**Champs disponibles:**
- `title`: string (3-100 caractères, optionnel)
- `description`: string (max 500 caractères, optionnel)
- `status`: "DRAFT" | "PUBLISHED" | "ARCHIVED" (optionnel)
- `is_published`: boolean (optionnel)

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Galerie mise à jour avec succès",
  "data": {
    "id": 1,
    "title": "Nouveau titre",
    "description": "Nouvelle description",
    "status": "PUBLISHED",
    ...
  }
}
```

---

### 5. Supprimer une galerie

**Endpoint:**
```
DELETE /vendor/galleries/:id
```

**Exemple:**
```
DELETE /vendor/galleries/1
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Galerie supprimée avec succès"
}
```

**Note:** Supprime également toutes les images associées sur Cloudinary.

---

### 6. Publier/Dépublier une galerie

**Endpoint:**
```
PATCH /vendor/galleries/:id/publish
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "is_published": true
}
```

**Exemples:**

Publier:
```json
{"is_published": true}
```

Dépublier:
```json
{"is_published": false}
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "message": "Galerie publiée"
}
```

**Erreur (400 Bad Request):**
```json
{
  "success": false,
  "message": "Une galerie doit avoir exactement 5 images pour être publiée",
  "statusCode": 400,
  "error": "Bad Request"
}
```

---

## 🌍 Endpoints Publics (Sans authentification)

Ces endpoints ne nécessitent PAS d'authentification.

### 1. Récupérer les galeries publiées

**Endpoint:**
```
GET /public/galleries
```

**Query Parameters:**
```
page: number (optionnel, défaut: 1)
limit: number (optionnel, défaut: 12)
vendorId: number (optionnel, pour filtrer par vendeur)
```

**Exemples d'URL:**
```
GET /public/galleries
GET /public/galleries?page=1&limit=12
GET /public/galleries?vendorId=5
GET /public/galleries?page=2&limit=20&vendorId=5
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "galleries": [
      {
        "id": 1,
        "vendorId": 5,
        "title": "Ma Collection",
        "description": "Description...",
        "status": "PUBLISHED",
        "isPublished": true,
        "images": [...],
        "vendor": {
          "id": 5,
          "firstName": "John",
          "lastName": "Doe",
          "shop_name": "JohnDesigns",
          "avatar": "https://..."
        },
        "createdAt": "2024-12-07T10:00:00.000Z",
        "updatedAt": "2024-12-07T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 2. Récupérer une galerie publiée

**Endpoint:**
```
GET /public/galleries/:id
```

**Exemple:**
```
GET /public/galleries/1
```

**Réponse (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "vendorId": 5,
    "title": "Ma Collection",
    "description": "Description...",
    "status": "PUBLISHED",
    "isPublished": true,
    "images": [...],
    "images_count": 5,
    "createdAt": "2024-12-07T10:00:00.000Z",
    "updatedAt": "2024-12-07T10:00:00.000Z"
  }
}
```

**Erreur si non publiée:**
```json
{
  "success": false,
  "message": "Cette galerie n'est pas publiée"
}
```

---

## 🚨 Codes d'erreur HTTP

| Code | Signification | Quand |
|------|---------------|-------|
| 200 | OK | Requête réussie |
| 201 | Created | Galerie créée avec succès |
| 400 | Bad Request | Validation échouée (nb images, format, taille) |
| 401 | Unauthorized | Token JWT manquant ou invalide |
| 403 | Forbidden | Pas le rôle VENDEUR ou pas propriétaire |
| 404 | Not Found | Galerie non trouvée |
| 500 | Internal Server Error | Erreur serveur (upload, DB) |

---

## 📋 Exemples cURL complets

### Créer une galerie
```bash
curl -X POST http://localhost:3000/vendor/galleries \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Ma Collection Printemps 2024" \
  -F "description=Collection inspirée par les couleurs du printemps" \
  -F "captions=[{\"caption\":\"Design floral\"},{\"caption\":\"Motif abstrait\"},{\"caption\":\"Style minimaliste\"},{\"caption\":\"Couleurs vives\"},{\"caption\":\"Géométrie moderne\"}]" \
  -F "images=@./image1.jpg" \
  -F "images=@./image2.jpg" \
  -F "images=@./image3.jpg" \
  -F "images=@./image4.jpg" \
  -F "images=@./image5.jpg"
```

### Récupérer ses galeries
```bash
curl -X GET "http://localhost:3000/vendor/galleries?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Mettre à jour une galerie
```bash
curl -X PUT http://localhost:3000/vendor/galleries/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nouveau titre",
    "description": "Nouvelle description",
    "status": "PUBLISHED"
  }'
```

### Publier une galerie
```bash
curl -X PATCH http://localhost:3000/vendor/galleries/1/publish \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"is_published": true}'
```

### Supprimer une galerie
```bash
curl -X DELETE http://localhost:3000/vendor/galleries/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Récupérer les galeries publiques (sans auth)
```bash
curl -X GET "http://localhost:3000/public/galleries?page=1&limit=12"
```

---

## 🧪 Tester avec Postman

### 1. Configuration de l'environnement

Créer un environnement Postman avec:
```
baseUrl: http://localhost:3000
vendorToken: YOUR_JWT_TOKEN_HERE
```

### 2. Collection d'endpoints

Importer les requêtes suivantes:

**Créer une galerie:**
- Method: POST
- URL: `{{baseUrl}}/vendor/galleries`
- Headers: `Authorization: Bearer {{vendorToken}}`
- Body: form-data
  - title: Text
  - description: Text
  - captions: Text (JSON)
  - images: File (×5)

**Lister les galeries:**
- Method: GET
- URL: `{{baseUrl}}/vendor/galleries?page=1&limit=10`
- Headers: `Authorization: Bearer {{vendorToken}}`

**Voir une galerie:**
- Method: GET
- URL: `{{baseUrl}}/vendor/galleries/1`
- Headers: `Authorization: Bearer {{vendorToken}}`

**Modifier une galerie:**
- Method: PUT
- URL: `{{baseUrl}}/vendor/galleries/1`
- Headers: `Authorization: Bearer {{vendorToken}}`
- Body: raw JSON

**Supprimer une galerie:**
- Method: DELETE
- URL: `{{baseUrl}}/vendor/galleries/1`
- Headers: `Authorization: Bearer {{vendorToken}}`

**Publier une galerie:**
- Method: PATCH
- URL: `{{baseUrl}}/vendor/galleries/1/publish`
- Headers: `Authorization: Bearer {{vendorToken}}`
- Body: raw JSON `{"is_published": true}`

---

## 📚 Documentation Swagger

Accédez à la documentation interactive Swagger:

```
http://localhost:3000/api
```

La documentation Swagger inclut:
- ✅ Description de chaque endpoint
- ✅ Schémas de requête/réponse
- ✅ Possibilité de tester directement
- ✅ Exemples de données
- ✅ Codes d'erreur

---

## ⚠️ Notes importantes

### Contraintes strictes
- **5 images exactement** (pas moins, pas plus)
- **Formats**: JPEG, JPG, PNG, WebP uniquement
- **Taille max**: 5MB par image
- **Titre**: 3-100 caractères
- **Description**: max 500 caractères
- **Légende**: max 200 caractères par image

### Optimisation automatique
- Les images sont converties en WebP
- Optimisation via Cloudinary
- Métadonnées extraites (width, height, size)

### Sécurité
- Token JWT requis pour endpoints vendeur
- Vérification de propriété
- Validation stricte des fichiers
- Nettoyage automatique en cas d'erreur

---

**Auteur**: PrintAlma Dev Team
**Date**: 2024-12-07
**Version**: 1.0.0
