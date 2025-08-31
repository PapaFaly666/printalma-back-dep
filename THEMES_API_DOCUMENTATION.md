# 🎨 API Documentation - Endpoints des Thèmes

## 📋 **Vue d'ensemble**

Les endpoints des thèmes permettent aux administrateurs de gérer les thèmes de produits sur la plateforme Printalma. Un thème est une collection de produits organisés autour d'un concept commun (ex: Manga, Sport, etc.).

## 🔐 **Authentification**

Tous les endpoints nécessitent une authentification JWT avec un rôle `ADMIN` ou `SUPERADMIN`.

```http
Authorization: Bearer <your_jwt_token>
```

## 📊 **Structure de données**

### **Thème**
```json
{
  "id": 1,
  "name": "Manga Collection",
  "description": "Thème dédié aux mangas et animes populaires",
  "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover.jpg",
  "productCount": 15,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:45:00.000Z",
  "status": "active",
  "category": "anime",
  "featured": true
}
```

## 🚀 **Endpoints**

### **1. GET /themes - Liste des thèmes**

**Description :** Récupère la liste des thèmes avec pagination et filtres.

**URL :** `GET http://localhost:3004/themes`

**Query Parameters :**
- `status` (optionnel) : `'active' | 'inactive' | 'all'` - Filtre par statut
- `category` (optionnel) : `string` - Filtre par catégorie
- `search` (optionnel) : `string` - Recherche dans le nom et la description
- `limit` (optionnel) : `number` - Nombre d'éléments par page (défaut: 20)
- `offset` (optionnel) : `number` - Offset pour la pagination (défaut: 0)
- `featured` (optionnel) : `boolean` - Filtre les thèmes mis en avant

**Headers :**
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Exemple de requête :**
```bash
curl -X GET "http://localhost:3004/themes?status=active&category=anime&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Manga Collection",
      "description": "Thème dédié aux mangas et animes populaires",
      "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover.jpg",
      "productCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z",
      "status": "active",
      "category": "anime",
      "featured": true
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Réponse (404) :**
```json
{
  "success": false,
  "error": "Aucun thème trouvé",
  "statusCode": 404
}
```

### **2. POST /themes - Créer un thème**

**Description :** Crée un nouveau thème avec upload d'image de couverture.

**URL :** `POST http://localhost:3004/themes`

**Headers :**
```http
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (FormData) :**
```javascript
{
  name: "Nouveau Thème",
  description: "Description du thème",
  category: "entertainment",
  status: "active", // optionnel, défaut: "active"
  featured: "false", // optionnel, défaut: false
  coverImage: File // Image de couverture (optionnel)
}
```

**Exemple de requête :**
```bash
curl -X POST "http://localhost:3004/themes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Manga Collection" \
  -F "description=Thème dédié aux mangas et animes" \
  -F "category=anime" \
  -F "status=active" \
  -F "featured=false" \
  -F "coverImage=@/path/to/image.jpg"
```

**Réponse (201) :**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Manga Collection",
    "description": "Thème dédié aux mangas et animes",
    "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover.jpg",
    "productCount": 0,
    "createdAt": "2024-01-25T12:00:00.000Z",
    "updatedAt": "2024-01-25T12:00:00.000Z",
    "status": "active",
    "category": "anime",
    "featured": false
  },
  "message": "Thème créé avec succès"
}
```

**Réponse (400) :**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "Le nom du thème est requis",
    "La description est requise",
    "La catégorie est requise"
  ],
  "statusCode": 400
}
```

### **3. GET /themes/:id - Détails d'un thème**

**Description :** Récupère les détails complets d'un thème avec ses produits associés.

**URL :** `GET http://localhost:3004/themes/:id`

**Headers :**
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Exemple de requête :**
```bash
curl -X GET "http://localhost:3004/themes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Manga Collection",
    "description": "Thème dédié aux mangas et animes populaires",
    "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover.jpg",
    "productCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z",
    "status": "active",
    "category": "anime",
    "featured": true,
    "products": [
      {
        "id": 101,
        "name": "T-Shirt Naruto",
        "price": 2500,
        "status": "published"
      }
    ]
  }
}
```

**Réponse (404) :**
```json
{
  "success": false,
  "error": "Thème non trouvé",
  "statusCode": 404
}
```

### **4. PATCH /themes/:id - Modifier un thème**

**Description :** Met à jour un thème existant avec possibilité de changer l'image de couverture.

**URL :** `PATCH http://localhost:3004/themes/:id`

**Headers :**
```http
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**Body (FormData) :**
```javascript
{
  name: "Manga Collection Updated", // optionnel
  description: "Description mise à jour", // optionnel
  category: "anime", // optionnel
  status: "active", // optionnel
  featured: "true", // optionnel
  coverImage: File // Nouvelle image de couverture (optionnel)
}
```

**Exemple de requête :**
```bash
curl -X PATCH "http://localhost:3004/themes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Manga Collection Updated" \
  -F "description=Description mise à jour" \
  -F "featured=true" \
  -F "coverImage=@/path/to/new-image.jpg"
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Manga Collection Updated",
    "description": "Description mise à jour",
    "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover-updated.jpg",
    "productCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-25T15:30:00.000Z",
    "status": "active",
    "category": "anime",
    "featured": true
  },
  "message": "Thème modifié avec succès"
}
```

### **5. DELETE /themes/:id - Supprimer un thème**

**Description :** Supprime définitivement un thème et son image de couverture.

**URL :** `DELETE http://localhost:3004/themes/:id`

**Headers :**
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Exemple de requête :**
```bash
curl -X DELETE "http://localhost:3004/themes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Réponse (204) :**
```http
HTTP/1.1 204 No Content
```

**Réponse (404) :**
```json
{
  "success": false,
  "error": "Thème non trouvé",
  "statusCode": 404
}
```

## 🧪 **Tests**

### **Script de test automatique**

Utilisez le script `test-themes.js` pour tester tous les endpoints :

```bash
# 1. Remplacez YOUR_ADMIN_TOKEN_HERE par un vrai token admin
# 2. Assurez-vous que le serveur est démarré sur http://localhost:3004
# 3. Exécutez le test

node test-themes.js
```

### **Tests manuels avec cURL**

```bash
# 1. Lister les thèmes
curl -X GET "http://localhost:3004/themes" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Créer un thème
curl -X POST "http://localhost:3004/themes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Test Theme" \
  -F "description=Description du thème" \
  -F "category=test" \
  -F "coverImage=@/path/to/image.jpg"

# 3. Récupérer un thème
curl -X GET "http://localhost:3004/themes/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Modifier un thème
curl -X PATCH "http://localhost:3004/themes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Updated Theme" \
  -F "featured=true"

# 5. Supprimer un thème
curl -X DELETE "http://localhost:3004/themes/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 **Configuration**

### **Variables d'environnement requises**

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# Cloudinary (pour les images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_jwt_secret

# Frontend URL (pour les liens dans les emails)
FRONTEND_URL=http://localhost:5174
```

### **Limites et contraintes**

- **Taille d'image maximale :** 5MB
- **Formats d'image supportés :** JPG, PNG, WebP
- **Limite de pagination par défaut :** 20 éléments
- **Durée de vie des tokens JWT :** 24h
- **Authentification requise :** ADMIN ou SUPERADMIN

## 🚨 **Codes d'erreur**

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 204 | Supprimé avec succès |
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 500 | Erreur serveur |

## 📝 **Notes importantes**

1. **Images :** Les images sont automatiquement uploadées vers Cloudinary dans le dossier `themes/`
2. **Suppression :** La suppression d'un thème supprime aussi automatiquement l'image de couverture de Cloudinary
3. **Relations :** Les relations avec les produits sont gérées via la table `theme_products`
4. **Soft delete :** Non implémenté - la suppression est définitive
5. **Validation :** Tous les champs obligatoires sont validés côté serveur

## 🎯 **Prochaines étapes**

- [ ] Ajouter la gestion des relations thème-produits
- [ ] Implémenter le soft delete
- [ ] Ajouter des métadonnées supplémentaires
- [ ] Créer des endpoints pour la gestion des produits par thème
- [ ] Ajouter des statistiques par thème

---

**✅ Les endpoints des thèmes sont maintenant opérationnels !** 