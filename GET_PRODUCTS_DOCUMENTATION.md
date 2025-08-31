# Documentation - Endpoint GET /products

## 🎯 Vue d'ensemble

Cette documentation détaille l'endpoint `GET /api/products` qui permet de récupérer la liste de tous les produits avec leurs informations complètes.

---

## 📋 Informations de Base

- **URL**: `/api/products`
- **Méthode**: `GET`
- **Authentification**: Requise (cookies HTTP-only)
- **Content-Type**: `application/json`

---

## 🔐 Authentification

L'endpoint nécessite une authentification valide. Assurez-vous d'inclure les cookies dans votre requête :

```javascript
const response = await fetch('/api/products', {
  method: 'GET',
  credentials: 'include', // OBLIGATOIRE pour les cookies
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## 📄 Paramètres de Requête

### ⚠️ **État Actuel : Pas de Pagination**

Actuellement, cet endpoint **ne prend aucun paramètre** et retourne **tous les produits** en une seule fois.

Il n'y a **pas de pagination, filtrage, ou tri** implémenté côté backend pour le moment.

### 🔮 **Paramètres Futurs (Quand la Pagination sera Ajoutée)**

Voici les paramètres qui seront probablement supportés dans une future version :

| Paramètre | Type | Description | Valeur par défaut |
|-----------|------|-------------|-------------------|
| `page` | `number` | Numéro de la page (commence à 1) | `1` |
| `limit` | `number` | Nombre de produits par page | `10` |
| `search` | `string` | Recherche dans nom/description | `""` |
| `category` | `string` | Filtrer par nom de catégorie | `""` |
| `status` | `string` | Filtrer par statut (`published`, `draft`) | `""` |
| `sortBy` | `string` | Champ de tri (`createdAt`, `name`, `price`) | `"createdAt"` |
| `sortOrder` | `string` | Ordre de tri (`asc`, `desc`) | `"desc"` |

**Exemple d'URL future :**
```
GET /api/products?page=1&limit=10&search=t-shirt&category=vêtements&status=published&sortBy=price&sortOrder=asc
```

---

## 📊 Réponse de l'API

### ✅ **Succès (200 OK)**

L'endpoint retourne un **tableau JSON** contenant tous les produits avec leurs relations complètes.

#### Structure de la Réponse Actuelle

```json
[
  {
    "id": 1,
    "name": "T-Shirt Premium Bio",
    "price": 8500,
    "stock": 150,
    "status": "PUBLISHED",
    "description": "Un t-shirt doux et résistant en coton bio, parfait pour l'impression personnalisée",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "categories": [
      {
        "id": 1,
        "name": "T-shirts",
        "description": "Collection de t-shirts pour tous les goûts"
      },
      {
        "id": 2,
        "name": "Coton Bio",
        "description": "Produits en coton biologique"
      }
    ],
    "sizes": [
      {
        "id": 1,
        "productId": 1,
        "sizeName": "S"
      },
      {
        "id": 2,
        "productId": 1,
        "sizeName": "M"
      },
      {
        "id": 3,
        "productId": 1,
        "sizeName": "L"
      }
    ],
    "colorVariations": [
      {
        "id": 1,
        "name": "Rouge Vif",
        "colorCode": "#FF0000",
        "productId": 1,
        "images": [
          {
            "id": 1,
            "view": "Front",
            "url": "https://res.cloudinary.com/printalma/image/upload/v1642253400/products/red_front.jpg",
            "publicId": "products/red_front",
            "colorVariationId": 1,
            "delimitations": [
              {
                "id": 1,
                "x": 150.5,
                "y": 100.0,
                "width": 200.0,
                "height": 250.0,
                "rotation": 0.0,
                "productImageId": 1
              }
            ]
          },
          {
            "id": 2,
            "view": "Back",
            "url": "https://res.cloudinary.com/printalma/image/upload/v1642253401/products/red_back.jpg",
            "publicId": "products/red_back",
            "colorVariationId": 1,
            "delimitations": []
          }
        ]
      },
      {
        "id": 2,
        "name": "Bleu Marine",
        "colorCode": "#000080",
        "productId": 1,
        "images": [
          {
            "id": 3,
            "view": "Front",
            "url": "https://res.cloudinary.com/printalma/image/upload/v1642253402/products/blue_front.jpg",
            "publicId": "products/blue_front",
            "colorVariationId": 2,
            "delimitations": [
              {
                "id": 2,
                "x": 150.5,
                "y": 100.0,
                "width": 200.0,
                "height": 250.0,
                "rotation": 0.0,
                "productImageId": 3
              }
            ]
          }
        ]
      }
    ]
  }
  // ... autres produits
]
```

### 🔮 **Structure de Réponse Future (Avec Pagination)**

Une fois la pagination implémentée, la réponse pourrait ressembler à ceci :

```json
{
  "data": [
    // ... tableau des produits (même structure qu'actuellement)
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 147,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "meta": {
    "filters": {
      "search": "t-shirt",
      "category": "vêtements",
      "status": "published"
    },
    "sorting": {
      "field": "createdAt",
      "order": "desc"
    }
  }
}
```

---

## 📝 Détail des Champs de Réponse

### **Produit Principal**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | Identifiant unique du produit |
| `name` | `string` | Nom du produit |
| `price` | `number` | Prix en FCFA (float) |
| `stock` | `number` | Quantité en stock (integer) |
| `status` | `string` | Statut de publication (`"PUBLISHED"` ou `"DRAFT"`) |
| `description` | `string` | Description détaillée du produit |
| `createdAt` | `string` | Date de création (format ISO 8601) |
| `updatedAt` | `string` | Date de dernière modification (format ISO 8601) |

### **Catégories (`categories[]`)**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | Identifiant unique de la catégorie |
| `name` | `string` | Nom de la catégorie |
| `description` | `string` \| `null` | Description optionnelle de la catégorie |

### **Tailles (`sizes[]`)**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | Identifiant unique de la taille |
| `productId` | `number` | ID du produit associé |
| `sizeName` | `string` | Nom de la taille (ex: "S", "M", "L") |

### **Variations de Couleur (`colorVariations[]`)**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | Identifiant unique de la variation |
| `name` | `string` | Nom de la couleur (ex: "Rouge Vif") |
| `colorCode` | `string` | Code hexadécimal de la couleur (ex: "#FF0000") |
| `productId` | `number` | ID du produit associé |

### **Images (`colorVariations[].images[]`)**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | Identifiant unique de l'image |
| `view` | `string` | Vue de l'image (`"Front"`, `"Back"`, `"Left"`, `"Right"`, `"Top"`, `"Bottom"`, `"Detail"`) |
| `url` | `string` | URL complète de l'image sur Cloudinary |
| `publicId` | `string` | Identifiant public Cloudinary pour manipulations |
| `colorVariationId` | `number` | ID de la variation de couleur associée |

### **Délimitations (`images[].delimitations[]`)**

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | Identifiant unique de la délimitation |
| `x` | `number` | Position X en pixels (float) |
| `y` | `number` | Position Y en pixels (float) |
| `width` | `number` | Largeur en pixels (float) |
| `height` | `number` | Hauteur en pixels (float) |
| `rotation` | `number` | Angle de rotation en degrés (float) |
| `productImageId` | `number` | ID de l'image associée |

---

## ❌ Réponses d'Erreur

### **401 Unauthorized**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```
**Cause** : Cookie d'authentification manquant, invalide ou expiré.

### **500 Internal Server Error**
```json
{
  "message": "Internal server error",
  "statusCode": 500
}
```
**Cause** : Erreur côté serveur (problème de base de données, etc.).

---

## 💡 Exemple d'Utilisation Frontend

### **JavaScript Vanilla / Fetch**

```javascript
async function getAllProducts() {
  try {
    const response = await fetch('/api/products', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const products = await response.json();
    console.log(`Récupéré ${products.length} produits`);
    return products;
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    throw error;
  }
}

// Utilisation
getAllProducts()
  .then(products => {
    products.forEach(product => {
      console.log(`${product.name} - ${product.price} FCFA`);
    });
  })
  .catch(error => {
    console.error('Erreur:', error.message);
  });
```

### **React avec useState/useEffect**

```jsx
import React, { useState, useEffect } from 'react';

function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des produits');
        }

        const productsData = await response.json();
        setProducts(productsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Chargement des produits...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      <h2>Liste des Produits ({products.length})</h2>
      {products.map(product => (
        <div key={product.id} className="product-card">
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <p><strong>{product.price} FCFA</strong></p>
          <p>Stock: {product.stock}</p>
          <p>Statut: {product.status}</p>
          
          {/* Affichage des catégories */}
          <div>
            <strong>Catégories:</strong>
            {product.categories.map(cat => (
              <span key={cat.id} className="category-tag">
                {cat.name}
              </span>
            ))}
          </div>
          
          {/* Affichage des tailles */}
          {product.sizes.length > 0 && (
            <div>
              <strong>Tailles:</strong>
              {product.sizes.map(size => (
                <span key={size.id} className="size-tag">
                  {size.sizeName}
                </span>
              ))}
            </div>
          )}
          
          {/* Affichage des couleurs */}
          <div>
            <strong>Couleurs disponibles:</strong>
            {product.colorVariations.map(color => (
              <div key={color.id} className="color-variation">
                <span 
                  className="color-dot" 
                  style={{ backgroundColor: color.colorCode }}
                  title={color.name}
                ></span>
                <span>{color.name}</span>
                <span>({color.images.length} image(s))</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProductsList;
```

### **Service Class (Recommandé)**

```javascript
class ProductService {
  static baseURL = '/api/products';

  static async getAll() {
    const response = await fetch(this.baseURL, {
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Méthodes utilitaires pour traiter les données
  static getMainImage(product) {
    return product.colorVariations?.[0]?.images?.[0]?.url || null;
  }

  static getAvailableColors(product) {
    return product.colorVariations?.map(cv => ({
      name: cv.name,
      code: cv.colorCode
    })) || [];
  }

  static getAvailableSizes(product) {
    return product.sizes?.map(s => s.sizeName) || [];
  }

  static isPublished(product) {
    return product.status === 'PUBLISHED';
  }
}

// Utilisation du service
try {
  const products = await ProductService.getAll();
  const publishedProducts = products.filter(ProductService.isPublished);
  console.log(`${publishedProducts.length} produits publiés sur ${products.length} total`);
} catch (error) {
  console.error('Erreur:', error.message);
}
```

---

## ⚡ Points d'Attention Performance

### **Problèmes Actuels**

1. **Pas de pagination** : Tous les produits sont chargés d'un coup
2. **Relations complètes** : Toutes les données liées sont incluses (peut être lourd)
3. **Pas de cache** : Chaque requête va en base de données

### **Recommandations Frontend**

1. **Implémenter un cache local** :
```javascript
// Cache simple avec expiration
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedProducts() {
  const cached = cache.get('products');
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const products = await ProductService.getAll();
  cache.set('products', {
    data: products,
    timestamp: Date.now()
  });
  
  return products;
}
```

2. **Pagination côté client** (temporaire) :
```javascript
function paginateProducts(products, page = 1, limit = 10) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: products.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(products.length / limit),
      totalItems: products.length,
      itemsPerPage: limit
    }
  };
}
```

3. **Filtrage côté client** :
```javascript
function filterProducts(products, filters = {}) {
  return products.filter(product => {
    // Recherche par nom/description
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchName = product.name.toLowerCase().includes(searchTerm);
      const matchDesc = product.description.toLowerCase().includes(searchTerm);
      if (!matchName && !matchDesc) return false;
    }

    // Filtrage par statut
    if (filters.status && product.status !== filters.status.toUpperCase()) {
      return false;
    }

    // Filtrage par catégorie
    if (filters.category) {
      const hasCategory = product.categories.some(cat => 
        cat.name.toLowerCase().includes(filters.category.toLowerCase())
      );
      if (!hasCategory) return false;
    }

    return true;
  });
}
```

---

## 🔄 Migration Future (Pagination Backend)

Quand la pagination sera implémentée côté backend, voici comment adapter votre code :

### **Avant (Actuel)**
```javascript
const products = await fetch('/api/products', { credentials: 'include' });
// Retourne: Product[]
```

### **Après (Futur)**
```javascript
const response = await fetch('/api/products?page=1&limit=10', { 
  credentials: 'include' 
});
// Retournera: { data: Product[], pagination: {...}, meta: {...} }

const products = response.data; // Pour garder la compatibilité
```

---

## 📚 Ressources Complémentaires

- **Documentation générale API** : `FRONTEND_API_PRODUCTS_DOCUMENTATION.md`
- **Guide d'intégration frontend** : `FRONTEND_COMPLETE_GUIDE.md`
- **Création de produits** : `FRONTEND_PRODUCT_CREATION_GUIDE_FIXED.md`

Cette documentation couvre tous les aspects techniques de l'endpoint `GET /products` pour faciliter l'intégration frontend ! 🚀 