# API Produits - Documentation Complète

## 🎯 Vue d'Ensemble

Cette documentation couvre **tous les endpoints** de l'API des produits avec exemples complets et structures de données.

---

## 🔐 Authentification Globale

**Toutes les requêtes nécessitent une authentification** via cookies HTTP-only.

```javascript
// Pour toutes les requêtes
fetch('/api/products', {
  credentials: 'include', // OBLIGATOIRE
  headers: {
    'Content-Type': 'application/json'
  }
});
```

---

## 📋 Liste des Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/products` | Créer un nouveau produit |
| `GET` | `/products` | Lister tous les produits |
| `GET` | `/products/deleted` | Lister les produits supprimés |
| `GET` | `/products/:id` | Obtenir un produit par ID |
| `POST` | `/products/:productId/colors/:colorId/images` | Ajouter des images à une couleur |

---

## 🚀 POST /products - Créer un Produit

### **URL**: `/api/products`
### **Méthode**: `POST`
### **Content-Type**: `multipart/form-data`

### **Structure de la Requête**

```javascript
const formData = new FormData();

// 1. Données du produit (JSON string)
const productData = {
  name: "T-Shirt Premium Bio",
  description: "Un t-shirt doux et résistant",
  price: 8500,
  stock: 150,
  status: "published", // ou "draft"
  categories: ["T-shirts", "Coton Bio"],
  sizes: ["S", "M", "L", "XL"],
  colorVariations: [
    {
      name: "Rouge Vif",
      colorCode: "#FF0000",
      images: [
        {
          fileId: "unique-id-1",
          view: "Front",
          delimitations: [
            {
              x: 150.5,
              y: 100.0,
              width: 200.0,
              height: 250.0,
              rotation: 0.0
            }
          ]
        },
        {
          fileId: "unique-id-2",
          view: "Back",
          delimitations: []
        }
      ]
    }
  ]
};

formData.append('productData', JSON.stringify(productData));

// 2. Fichiers images (avec fileId comme fieldname)
formData.append('file_unique-id-1', imageFile1);
formData.append('file_unique-id-2', imageFile2);

// 3. Envoi de la requête
const response = await fetch('/api/products', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
```

### **Structure productData Détaillée**

```typescript
interface CreateProductDto {
  name: string;                    // Nom du produit
  description: string;             // Description détaillée
  price: number;                   // Prix en FCFA
  stock: number;                   // Quantité en stock
  status: "published" | "draft";   // Statut de publication
  categories: string[];            // Noms des catégories
  sizes: string[];                 // Noms des tailles
  colorVariations: ColorVariation[];
}

interface ColorVariation {
  name: string;                    // Nom de la couleur
  colorCode: string;               // Code hexadécimal (#FF0000)
  images: ImageData[];
}

interface ImageData {
  fileId: string;                  // ID unique pour associer au fichier
  view: string;                    // Vue de l'image
  delimitations: Delimitation[];   // Zones d'impression
}

interface Delimitation {
  x: number;                       // Position X en pixels
  y: number;                       // Position Y en pixels
  width: number;                   // Largeur en pixels
  height: number;                  // Hauteur en pixels
  rotation?: number;               // Rotation en degrés (optionnel)
}
```

### **Valeurs Possibles**

- **status**: `"published"` | `"draft"`
- **view**: `"Front"` | `"Back"` | `"Left"` | `"Right"` | `"Top"` | `"Bottom"` | `"Detail"`
- **colorCode**: Code hexadécimal valide (ex: `"#FF0000"`, `"#00FF00"`)

### **Exemple Complet**

```javascript
async function createProduct() {
  const formData = new FormData();
  
  const productData = {
    name: "T-Shirt Premium Bio",
    description: "Un t-shirt doux et résistant en coton bio",
    price: 8500,
    stock: 150,
    status: "published",
    categories: ["T-shirts", "Coton Bio"],
    sizes: ["S", "M", "L", "XL"],
    colorVariations: [
      {
        name: "Rouge Vif",
        colorCode: "#FF0000",
        images: [
          {
            fileId: "red-front-123",
            view: "Front",
            delimitations: [
              {
                x: 150.5,
                y: 100.0,
                width: 200.0,
                height: 250.0,
                rotation: 0.0
              }
            ]
          },
          {
            fileId: "red-back-124",
            view: "Back",
            delimitations: []
          }
        ]
      },
      {
        name: "Bleu Marine",
        colorCode: "#000080",
        images: [
          {
            fileId: "blue-front-125",
            view: "Front",
            delimitations: [
              {
                x: 150.5,
                y: 100.0,
                width: 200.0,
                height: 250.0,
                rotation: 0.0
              }
            ]
          }
        ]
      }
    ]
  };

  formData.append('productData', JSON.stringify(productData));
  formData.append('file_red-front-123', redFrontImage);
  formData.append('file_red-back-124', redBackImage);
  formData.append('file_blue-front-125', blueFrontImage);

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const createdProduct = await response.json();
    console.log('Produit créé:', createdProduct);
    return createdProduct;
  } catch (error) {
    console.error('Erreur création produit:', error);
    throw error;
  }
}
```

### **Réponse Succès (201)**

```json
{
  "id": 1,
  "name": "T-Shirt Premium Bio",
  "price": 8500,
  "stock": 150,
  "status": "PUBLISHED",
  "description": "Un t-shirt doux et résistant en coton bio",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "categories": [...],
  "sizes": [...],
  "colorVariations": [...]
}
```

### **Erreurs Possibles**

- **400 Bad Request**: Données invalides, fichiers manquants
- **401 Unauthorized**: Authentification requise
- **500 Internal Server Error**: Erreur serveur

---

## 📖 GET /products - Lister Tous les Produits

### **URL**: `/api/products`
### **Méthode**: `GET`

### **Exemple de Requête**

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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const products = await response.json();
    console.log(`${products.length} produits récupérés`);
    return products;
  } catch (error) {
    console.error('Erreur récupération produits:', error);
    throw error;
  }
}
```

### **Réponse Succès (200)**

```json
[
  {
    "id": 1,
    "name": "T-Shirt Premium Bio",
    "price": 8500,
    "stock": 150,
    "status": "PUBLISHED",
    "description": "Un t-shirt doux et résistant en coton bio",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "categories": [
      {
        "id": 1,
        "name": "T-shirts",
        "description": "Collection de t-shirts"
      }
    ],
    "sizes": [
      {
        "id": 1,
        "productId": 1,
        "sizeName": "S"
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
          }
        ]
      }
    ]
  }
]
```

### **Caractéristiques**

- ✅ **Pas de pagination** - Tous les produits retournés
- ✅ **Relations complètes** - Catégories, tailles, couleurs, images, délimitations
- ✅ **Ordre par défaut** - Triés par date de création décroissante
- ✅ **URLs Cloudinary** - Images prêtes à utiliser

---

## 🗑️ GET /products/deleted - Produits Supprimés

### **URL**: `/api/products/deleted`
### **Méthode**: `GET`

### **Exemple de Requête**

```javascript
async function getDeletedProducts() {
  const response = await fetch('/api/products/deleted', {
    credentials: 'include'
  });
  
  const deletedProducts = await response.json();
  return deletedProducts; // Actuellement retourne []
}
```

### **Réponse Actuelle**

```json
[]
```

**Note**: Actuellement retourne un tableau vide car le soft delete n'est pas implémenté dans le schema.

---

## 🔍 GET /products/:id - Produit par ID

### **URL**: `/api/products/:id`
### **Méthode**: `GET`

### **Exemple de Requête**

```javascript
async function getProductById(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Produit non trouvé');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const product = await response.json();
    return product;
  } catch (error) {
    console.error(`Erreur récupération produit ${productId}:`, error);
    throw error;
  }
}
```

### **Réponse Succès (200)**

Structure identique à GET /products mais pour un seul produit.

### **Erreurs**

- **404 Not Found**: Produit inexistant
- **401 Unauthorized**: Authentification requise

---

## 🖼️ POST /products/:productId/colors/:colorId/images - Ajouter Images

### **URL**: `/api/products/:productId/colors/:colorId/images`
### **Méthode**: `POST`
### **Content-Type**: `multipart/form-data`

### **Exemple de Requête**

```javascript
async function addColorImages(productId, colorId, imageFiles) {
  const formData = new FormData();
  
  // Ajouter les fichiers images
  imageFiles.forEach((file, index) => {
    formData.append('images', file);
  });

  try {
    const response = await fetch(`/api/products/${productId}/colors/${colorId}/images`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Note: Cet endpoint redirige actuellement vers /colors/:colorId/images
    return response.json();
  } catch (error) {
    console.error('Erreur ajout images:', error);
    throw error;
  }
}
```

### **Paramètres**

- `productId`: ID du produit (integer)
- `colorId`: ID de la variation de couleur (integer)
- `images`: Fichiers image (multipart)

---

## 🛠️ Méthodes Utilitaires JavaScript

### **Service Produit Complet**

```javascript
class ProductService {
  static baseURL = '/api/products';

  // Créer un produit
  static async create(productData, imageFiles) {
    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    // Ajouter les fichiers avec leurs fileIds
    Object.entries(imageFiles).forEach(([fileId, file]) => {
      formData.append(`file_${fileId}`, file);
    });

    const response = await fetch(this.baseURL, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erreur création: ${response.status}`);
    }

    return response.json();
  }

  // Lister tous les produits
  static async getAll() {
    const response = await fetch(this.baseURL, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erreur récupération: ${response.status}`);
    }

    return response.json();
  }

  // Obtenir un produit par ID
  static async getById(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Produit non trouvé');
      }
      throw new Error(`Erreur récupération: ${response.status}`);
    }

    return response.json();
  }

  // Obtenir les produits supprimés
  static async getDeleted() {
    const response = await fetch(`${this.baseURL}/deleted`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Erreur récupération: ${response.status}`);
    }

    return response.json();
  }

  // Ajouter des images à une couleur
  static async addColorImages(productId, colorId, imageFiles) {
    const formData = new FormData();
    
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    const response = await fetch(`${this.baseURL}/${productId}/colors/${colorId}/images`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erreur ajout images: ${response.status}`);
    }

    return response.json();
  }

  // Méthodes utilitaires
  static getMainImage(product) {
    return product.colorVariations?.[0]?.images?.[0]?.url || null;
  }

  static isPublished(product) {
    return product.status === 'PUBLISHED';
  }

  static getAvailableColors(product) {
    return product.colorVariations?.map(cv => ({
      id: cv.id,
      name: cv.name,
      code: cv.colorCode
    })) || [];
  }

  static getAvailableSizes(product) {
    return product.sizes?.map(s => ({
      id: s.id,
      name: s.sizeName
    })) || [];
  }

  static getProductCategories(product) {
    return product.categories?.map(c => c.name) || [];
  }
}
```

### **Exemples d'Utilisation**

```javascript
// Créer un produit
const productData = {
  name: "Nouveau T-Shirt",
  description: "Description du produit",
  price: 5000,
  stock: 100,
  status: "published",
  categories: ["T-shirts"],
  sizes: ["S", "M", "L"],
  colorVariations: [
    {
      name: "Rouge",
      colorCode: "#FF0000",
      images: [
        {
          fileId: "red-front",
          view: "Front",
          delimitations: []
        }
      ]
    }
  ]
};

const imageFiles = {
  "red-front": redFrontImageFile
};

const newProduct = await ProductService.create(productData, imageFiles);

// Lister tous les produits
const allProducts = await ProductService.getAll();

// Obtenir un produit spécifique
const product = await ProductService.getById(1);

// Vérifier si publié
if (ProductService.isPublished(product)) {
  console.log('Produit publié');
}

// Obtenir l'image principale
const mainImageUrl = ProductService.getMainImage(product);
```

---

## 📊 Codes de Réponse HTTP

| Code | Statut | Description |
|------|--------|-------------|
| `200` | OK | Requête réussie |
| `201` | Created | Produit créé avec succès |
| `400` | Bad Request | Données invalides |
| `401` | Unauthorized | Authentification requise |
| `404` | Not Found | Produit non trouvé |
| `500` | Internal Server Error | Erreur serveur |

---

## ⚠️ Points Importants

1. **Authentification obligatoire** pour tous les endpoints
2. **multipart/form-data** pour la création de produits
3. **fileId** pour associer images et données
4. **Pas de pagination** sur GET /products
5. **URLs Cloudinary** prêtes à utiliser
6. **Soft delete** pas encore implémenté
7. **Relations complètes** incluses dans les réponses

---

## 🚀 Checklist d'Intégration

### Frontend
- [ ] Implémenter l'authentification avec cookies
- [ ] Créer le service ProductService
- [ ] Gérer les uploads d'images avec FormData
- [ ] Implémenter la gestion d'erreurs
- [ ] Créer les interfaces TypeScript
- [ ] Tester tous les endpoints

### Développement
- [ ] Vérifier l'authentification
- [ ] Tester la création de produits
- [ ] Valider les uploads d'images
- [ ] Tester les réponses d'erreur
- [ ] Optimiser les performances

Cette documentation couvre **100%** de l'API des produits avec tous les détails nécessaires pour une intégration réussie ! 🎯 