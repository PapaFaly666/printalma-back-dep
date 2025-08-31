# Documentation Technique - API Produits

## 🎯 Vue d'ensemble

Cette documentation fournit tous les détails techniques nécessaires pour interagir avec l'API de gestion des produits de Printalma. Elle est destinée aux développeurs frontend.

L'API est conçue pour être **RESTful** et utilise **JSON** pour les échanges de données et l'authentification se fait via des **cookies HTTP-only**.

**URL de base de l'API**: `/api` (par exemple, `/api/products`)

---

## 🔐 Authentification

Toutes les requêtes vers l'API Products nécessitent que l'utilisateur soit authentifié. Le frontend doit s'assurer d'envoyer les cookies d'authentification à chaque appel.

**Configuration clé pour `fetch` ou `axios` :**
```javascript
const config = {
  credentials: 'include' // OBLIGATOIRE pour envoyer les cookies
};
```

---

## 📋 Endpoints de l'API

### 1. Lister les Produits

Récupère la liste complète de tous les produits.

- **Endpoint**: `GET /api/products`
- **Méthode**: `GET`
- **Description**: Retourne un tableau de tous les produits avec leurs relations (catégories, tailles, variations de couleur, images, etc.).

#### ⚠️ **Note sur la Pagination (Future Implémentation)**

Actuellement, cet endpoint retourne **tous les produits**. Une future mise à jour du backend introduira la pagination. Le frontend devra alors passer les paramètres suivants :

| Paramètre   | Type    | Description                               | Défaut |
|-------------|---------|-------------------------------------------|--------|
| `page`      | `number`| Le numéro de la page à récupérer.         | `1`    |
| `limit`     | `number`| Le nombre de produits par page.           | `10`   |
| `search`    | `string`| Terme de recherche (nom, description).    | `''`   |
| `category`  | `string`| Filtrer par nom de catégorie.             | `''`   |
| `status`    | `string`| Filtrer par statut (`published`/`draft`). | `''`   |
| `sortBy`    | `string`| Champ pour le tri (`createdAt`, `price`). | `createdAt` |
| `sortOrder` | `string`| Ordre de tri (`asc` ou `desc`).           | `desc` |

**Exemple de réponse paginée (future) :**
```json
{
  "data": [ /* ... tableau des produits ... */ ],
  "pagination": {
    "totalItems": 150,
    "totalPages": 15,
    "currentPage": 1,
    "limit": 10
  }
}
```

#### Réponse Actuelle (200 OK)
Un tableau `[...]` d'objets `Product`.

---

### 2. Créer un Produit

Crée un nouveau produit avec toutes ses informations et images associées.

- **Endpoint**: `POST /api/products`
- **Méthode**: `POST`
- **Content-Type**: `multipart/form-data`
- **Description**: Cet endpoint est utilisé pour créer un produit complexe. Il accepte des données structurées en JSON ainsi que des fichiers images.

#### Structure du Body (`FormData`)

| Clé           | Type          | Description                                                                                                                              |
|---------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------|
| `productData` | `String (JSON)` | Une chaîne de caractères JSON contenant toutes les informations textuelles du produit (voir `CreateProductDto` ci-dessous).             |
| `file_...`    | `File`        | Les fichiers images. La clé de chaque fichier doit correspondre au `fileId` utilisé dans la structure `productData` (ex: `file_167...`). |

#### Exemple d'implémentation Frontend
```javascript
async function createProduct(productData, files) {
  const formData = new FormData();

  // 1. Ajouter les données JSON
  formData.append('productData', JSON.stringify(productData));

  // 2. Ajouter chaque fichier avec une clé correspondant à son fileId
  files.forEach(fileInfo => {
    // fileInfo est un objet { fileId: '...', file: File }
    formData.append(`file_${fileInfo.fileId}`, fileInfo.file);
  });

  const response = await fetch('/api/products', {
    method: 'POST',
    credentials: 'include',
    body: formData, // Pas de header 'Content-Type', le navigateur le gère
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Erreur lors de la création');
  }

  return response.json();
}
```

#### Réponse (201 Created)
Retourne l'objet `Product` complet nouvellement créé, incluant les URLs des images uploadées sur Cloudinary.

---

### 3. Récupérer un Produit par ID

Récupère les détails complets d'un produit spécifique.

- **Endpoint**: `GET /api/products/:id`
- **Méthode**: `GET`
- **Paramètres d'URL**:
    - `id` (number, requis): L'identifiant unique du produit.

#### Réponse (200 OK)
Retourne l'objet `Product` complet correspondant à l'ID.

#### Réponse d'Erreur (404 Not Found)
```json
{
  "message": "Product with ID 123 not found.",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### 4. Lister les Produits Supprimés

Récupère la liste des produits qui ont été "soft-deleted".

- **Endpoint**: `GET /api/products/deleted`
- **Méthode**: `GET`
- **Description**: **Actuellement non implémenté.** Le schéma de données ne contient pas de champ `deletedAt`. Cet endpoint retourne un tableau vide pour le moment.

---

## 📦 Modèles de Données (DTOs)

### `CreateProductDto` (Envoyé dans `productData`)

| Champ             | Type                        | Requis | Validation                                           | Exemple                                                |
|-------------------|-----------------------------|:------:|------------------------------------------------------|--------------------------------------------------------|
| `name`            | `string`                    |   ✅   | Min 2, Max 255 caractères                          | `"T-Shirt Premium"`                                    |
| `description`     | `string`                    |   ✅   | Min 10, Max 5000 caractères                        | `"Un t-shirt doux et résistant..."`                     |
| `price`           | `number`                    |   ✅   | Doit être un nombre positif                        | `8500`                                                 |
| `stock`           | `number`                    |   ✅   | Doit être un entier >= 0                           | `150`                                                  |
| `status`          | `'published'` \| `'draft'`    |   ❌   | Doit être l'une des deux valeurs. Défaut: `'draft'` | `'published'`                                          |
| `categories`      | `string[]`                  |   ✅   | Tableau de noms de catégories, au moins 1.       | `["T-shirts", "Coton Bio"]`                            |
| `sizes`           | `string[]`                  |   ❌   | Tableau de noms de tailles.                        | `["S", "M", "L"]`                                      |
| `colorVariations` | `ColorVariationDto[]`       |   ✅   | Au moins une variation de couleur.                 | `[{...}]`                                              |

### `ColorVariationDto`

| Champ       | Type                | Requis | Validation                                 | Exemple                                    |
|-------------|---------------------|:------:|--------------------------------------------|--------------------------------------------|
| `name`      | `string`            |   ✅   | Min 1, Max 100 caractères                | `"Rouge Vif"`                              |
| `colorCode` | `string`            |   ✅   | Format hexadécimal `#RRGGBB`               | `"#FF0000"`                                |
| `images`    | `ProductImageDto[]` |   ✅   | Au moins une image par variation de couleur. | `[{...}]`                                  |

### `ProductImageDto`

| Champ           | Type                 | Requis | Validation                                              | Exemple                                            |
|-----------------|----------------------|:------:|---------------------------------------------------------|----------------------------------------------------|
| `fileId`        | `string`             |   ✅   | Identifiant unique généré par le frontend.              | `"1678886400000_0_0"`                              |
| `view`          | `string`             |   ✅   | `Front`, `Back`, `Left`, `Right`, `Top`, `Bottom`, `Detail` | `'Front'`                                          |
| `delimitations` | `DelimitationDto[]`  |   ❌   | Zones d'impression sur l'image.                         | `[{ "x": 50, "y": 50, "width": 100, ... }]`         |

### `DelimitationDto`

| Champ      | Type     | Requis | Validation              | Exemple   |
|------------|----------|:------:|-------------------------|-----------|
| `x`        | `number` |   ✅   | Position en pixels, >= 0 | `50`      |
| `y`        | `number` |   ✅   | Position en pixels, >= 0 | `50`      |
| `width`    | `number` |   ✅   | Largeur en pixels, > 0  | `100`     |
| `height`   | `number` |   ✅   | Hauteur en pixels, > 0  | `100`     |
| `rotation` | `number` |   ❌   | Angle en degrés, défaut 0 | `0`       |

---

## 💡 Flux de Travail Frontend Recommandé (Création Produit)

1.  **Générer l'État Local**: L'utilisateur remplit le formulaire. Le frontend maintient l'état complet du produit (y compris les variations de couleurs, images, etc.).
2.  **Gestion des Fichiers**: Quand un utilisateur ajoute une image, le frontend doit :
    a. Générer un `fileId` unique (ex: `Date.now() + '_...'`).
    b. Stocker le `File` objet et son `fileId` dans un état séparé (ex: `useState([])`).
    c. Ajouter une `ProductImageDto` correspondante dans l'état principal du produit, en utilisant ce même `fileId`.
3.  **Préparation de la Requête**: Au moment de la soumission :
    a. Créer une instance de `FormData`.
    b. Convertir l'état du produit en chaîne JSON et l'ajouter à `formData` avec la clé `productData`.
    c. Parcourir l'état des fichiers et ajouter chaque `File` à `formData` avec une clé préfixée (ex: `file_UNIQUE_ID`).
4.  **Envoi de la Requête**: Envoyer la requête `POST` avec le `formData`. Le navigateur définira automatiquement le header `Content-Type` correct.
5.  **Gestion de la Réponse**:
    - Si **succès (201)**, réinitialiser le formulaire et afficher une notification de succès.
    - Si **erreur (400, 500)**, afficher le message d'erreur retourné par l'API.

---

## 🚨 Codes d'Erreur Courants

| Code HTTP | Signification               | Cause probable                                                         |
|-----------|-----------------------------|------------------------------------------------------------------------|
| `400 Bad Request`   | Requête incorrecte          | - `productData` manquant ou JSON invalide.                           |
|           |                             | - Fichier image manquant pour un `fileId` donné.                       |
|           |                             | - Données ne respectant pas les règles de validation (DTOs).           |
| `401 Unauthorized`  | Non authentifié             | Cookie de session manquant, invalide ou expiré.                        |
| `404 Not Found`     | Ressource non trouvée       | L'ID du produit demandé n'existe pas.                                  |
| `500 Internal Server Error` | Erreur serveur              | Un problème est survenu côté backend (ex: échec de la transaction). |

Ce document devrait fournir à votre équipe frontend une base solide pour l'intégration. Il est crucial de noter l'absence actuelle de pagination pour la gestion de l'affichage des listes de produits. 