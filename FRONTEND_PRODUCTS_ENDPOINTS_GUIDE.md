# 📦 Guide Frontend - Endpoints Produits

Documentation complète des endpoints produits pour l'intégration frontend.

## 🔧 Configuration Base

```javascript
const API_BASE = 'https://localhost:3004';
const CONFIG = {
  credentials: 'include', // Obligatoire pour cookies HTTPS
  headers: {
    'Content-Type': 'application/json'
  }
};
```

---

## 📋 Liste Complète des Endpoints

### **1. GET /products** - Récupérer tous les produits

**URL :** `https://localhost:3004/products`

**Requête :**
```javascript
const response = await fetch(`${API_BASE}/products`, {
  method: 'GET',
  credentials: 'include'
});
const data = await response.json();
```

**Réponse Success (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt Premium Homme",
      "description": "T-shirt en coton bio de qualité supérieure",
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-10T12:30:00.000Z",
      "category": {
        "id": 1,
        "name": "T-shirts",
        "description": "Collection T-shirts"
      },
      "colors": [
        {
          "id": 1,
          "name": "Rouge",
          "hexCode": "#FF0000",
          "imageUrl": "https://res.cloudinary.com/printalma/color-rouge.jpg"
        },
        {
          "id": 2,
          "name": "Bleu",
          "hexCode": "#0000FF",
          "imageUrl": "https://res.cloudinary.com/printalma/color-bleu.jpg"
        }
      ],
      "sizes": [
        {
          "id": 1,
          "name": "S",
          "description": "Small"
        },
        {
          "id": 2,
          "name": "M",
          "description": "Medium"
        },
        {
          "id": 3,
          "name": "L",
          "description": "Large"
        }
      ],
      "images": [
        {
          "id": 45,
          "url": "https://res.cloudinary.com/printalma/tshirt-main.jpg",
          "isMain": true,
          "naturalWidth": 1000,
          "naturalHeight": 800
        },
        {
          "id": 46,
          "url": "https://res.cloudinary.com/printalma/tshirt-dos.jpg",
          "isMain": false,
          "naturalWidth": 1000,
          "naturalHeight": 800
        }
      ]
    },
    {
      "id": 2,
      "name": "Hoodie Unisexe",
      "description": "Sweat à capuche confortable",
      "createdAt": "2025-01-10T11:00:00.000Z",
      "updatedAt": "2025-01-10T11:00:00.000Z",
      "category": {
        "id": 2,
        "name": "Sweats"
      },
      "colors": [
        {
          "id": 3,
          "name": "Noir",
          "hexCode": "#000000",
          "imageUrl": "https://res.cloudinary.com/printalma/color-noir.jpg"
        }
      ],
      "sizes": [
        {
          "id": 1,
          "name": "S"
        },
        {
          "id": 2,
          "name": "M"
        }
      ],
      "images": [
        {
          "id": 47,
          "url": "https://res.cloudinary.com/printalma/hoodie-main.jpg",
          "isMain": true,
          "naturalWidth": 1200,
          "naturalHeight": 900
        }
      ]
    }
  ],
  "count": 2
}
```

**Réponse Error (401) :**
```json
{
  "success": false,
  "message": "Non autorisé",
  "statusCode": 401
}
```

**Exemple d'utilisation :**
```javascript
async function loadProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`, {
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`${result.count} produits trouvés`);
      result.data.forEach(product => {
        console.log(`- ${product.name} (${product.colors.length} couleurs)`);
      });
      return result.data;
    }
  } catch (error) {
    console.error('Erreur chargement produits:', error);
  }
}
```

---

### **2. GET /products/:id** - Récupérer un produit par ID

**URL :** `https://localhost:3004/products/{id}`

**Requête :**
```javascript
const productId = 1;
const response = await fetch(`${API_BASE}/products/${productId}`, {
  method: 'GET',
  credentials: 'include'
});
const data = await response.json();
```

**Réponse Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "T-shirt Premium Homme",
    "description": "T-shirt en coton bio de qualité supérieure avec impression haute définition",
    "createdAt": "2025-01-10T10:00:00.000Z",
    "updatedAt": "2025-01-10T12:30:00.000Z",
    "category": {
      "id": 1,
      "name": "T-shirts",
      "description": "Collection complète de T-shirts pour tous styles"
    },
    "colors": [
      {
        "id": 1,
        "name": "Rouge",
        "hexCode": "#FF0000",
        "imageUrl": "https://res.cloudinary.com/printalma/color-rouge.jpg"
      },
      {
        "id": 2,
        "name": "Bleu",
        "hexCode": "#0000FF",
        "imageUrl": "https://res.cloudinary.com/printalma/color-bleu.jpg"
      },
      {
        "id": 3,
        "name": "Vert",
        "hexCode": "#00FF00",
        "imageUrl": "https://res.cloudinary.com/printalma/color-vert.jpg"
      }
    ],
    "sizes": [
      {
        "id": 1,
        "name": "S",
        "description": "Small - Tour de poitrine 90-95cm"
      },
      {
        "id": 2,
        "name": "M",
        "description": "Medium - Tour de poitrine 96-101cm"
      },
      {
        "id": 3,
        "name": "L",
        "description": "Large - Tour de poitrine 102-107cm"
      },
      {
        "id": 4,
        "name": "XL",
        "description": "Extra Large - Tour de poitrine 108-113cm"
      }
    ],
    "images": [
      {
        "id": 45,
        "url": "https://res.cloudinary.com/printalma/tshirt-face.jpg",
        "isMain": true,
        "naturalWidth": 1000,
        "naturalHeight": 800,
        "delimitations": [
          {
            "id": 15,
            "x": 25.5,
            "y": 35.0,
            "width": 35.0,
            "height": 20.0,
            "rotation": 0,
            "name": "Zone Logo Poitrine",
            "coordinateType": "PERCENTAGE",
            "createdAt": "2025-01-10T11:15:00.000Z",
            "updatedAt": "2025-01-10T11:15:00.000Z"
          },
          {
            "id": 16,
            "x": 15.0,
            "y": 60.0,
            "width": 70.0,
            "height": 25.0,
            "rotation": 0,
            "name": "Zone Texte Central",
            "coordinateType": "PERCENTAGE",
            "createdAt": "2025-01-10T11:20:00.000Z",
            "updatedAt": "2025-01-10T11:20:00.000Z"
          }
        ]
      },
      {
        "id": 46,
        "url": "https://res.cloudinary.com/printalma/tshirt-dos.jpg",
        "isMain": false,
        "naturalWidth": 1000,
        "naturalHeight": 800,
        "delimitations": [
          {
            "id": 17,
            "x": 20.0,
            "y": 25.0,
            "width": 60.0,
            "height": 50.0,
            "rotation": 0,
            "name": "Zone Grande Impression Dos",
            "coordinateType": "PERCENTAGE",
            "createdAt": "2025-01-10T11:25:00.000Z",
            "updatedAt": "2025-01-10T11:25:00.000Z"
          }
        ]
      },
      {
        "id": 48,
        "url": "https://res.cloudinary.com/printalma/tshirt-manche.jpg",
        "isMain": false,
        "naturalWidth": 800,
        "naturalHeight": 600,
        "delimitations": []
      }
    ]
  }
}
```

**Réponse Error (404) :**
```json
{
  "success": false,
  "message": "Produit non trouvé",
  "statusCode": 404
}
```

**Exemple d'utilisation :**
```javascript
async function loadProductDetails(productId) {
  try {
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      const product = result.data;
      console.log(`Produit: ${product.name}`);
      console.log(`Couleurs disponibles: ${product.colors.length}`);
      console.log(`Tailles disponibles: ${product.sizes.length}`);
      console.log(`Images: ${product.images.length}`);
      
      // Compter les délimitations
      const totalDelimitations = product.images.reduce((total, img) => 
        total + img.delimitations.length, 0
      );
      console.log(`Total délimitations: ${totalDelimitations}`);
      
      return product;
    }
  } catch (error) {
    console.error('Erreur chargement produit:', error);
  }
}
```

---

### **3. POST /products** - Créer un nouveau produit

**URL :** `https://localhost:3004/products`

**⚠️ CRITICAL - FORMAT EXACT REQUIS :**

Le backend attend:
- `productData`: un string JSON avec la structure complète
- Fichiers images avec des fileId correspondants

**Structure JSON obligatoire pour productData :**
```javascript
const productData = {
  name: "Nom du produit",                    // OBLIGATOIRE
  description: "Description du produit",     // OBLIGATOIRE  
  price: 25.99,                             // OBLIGATOIRE (number)
  stock: 100,                               // OBLIGATOIRE (number >= 0)
  status: "published",                       // OPTIONNEL: "published" ou "draft"
  categories: ["T-shirts", "Vêtements"],    // OBLIGATOIRE (array de strings)
  sizes: ["S", "M", "L"],                   // OPTIONNEL (array de strings)
  colorVariations: [                        // OBLIGATOIRE (au moins 1)
    {
      name: "Rouge",                        // OBLIGATOIRE
      colorCode: "#FF0000",                 // OBLIGATOIRE (format #RRGGBB)
      images: [                             // OBLIGATOIRE (au moins 1)
        {
          fileId: "image1",                 // OBLIGATOIRE (doit correspondre au fichier)
          view: "Front",                    // OBLIGATOIRE ("Front", "Back", "Left", "Right", "Top", "Bottom", "Detail")
          delimitations: [                  // OPTIONNEL
            {
              x: 25.0,                      // Coordonnées en pourcentage (0-100)
              y: 30.0,
              width: 40.0,
              height: 20.0,
              rotation: 0,                  // OPTIONNEL
              name: "Zone Logo",            // OPTIONNEL
              coordinateType: "PERCENTAGE"  // OPTIONNEL (défaut: "PERCENTAGE")
            }
          ]
        }
      ]
    }
  ]
};
```

**Code d'exemple complet qui FONCTIONNE :**
```javascript
async function createProductCorrect() {
  try {
    // 1. Préparer les données
    const productData = {
      name: "T-shirt Test API",
      description: "T-shirt de test pour vérifier l'API",
      price: 25.00,
      stock: 50,
      status: "draft",
      categories: ["T-shirts"],
      sizes: ["S", "M", "L"],
      colorVariations: [
        {
          name: "Rouge",
          colorCode: "#FF0000",
          images: [
            {
              fileId: "image1",
              view: "Front",
              delimitations: []
            }
          ]
        }
      ]
    };

    // 2. Récupérer les fichiers
    const fileInput = document.getElementById('imageInput');
    const imageFile = fileInput.files[0];
    
    if (!imageFile) {
      throw new Error('Sélectionnez au moins une image');
    }

    // 3. Créer FormData
    const formData = new FormData();
    
    // CRITIQUE: productData doit être un string JSON
    formData.append('productData', JSON.stringify(productData));
    
    // CRITIQUE: Le nom du fichier doit correspondre au fileId
    formData.append('file_image1', imageFile); // "file_" + fileId

    console.log('🚀 Envoi de la requête...');

    // 4. Envoyer la requête
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      credentials: 'include',
      // PAS de Content-Type avec FormData
      body: formData
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erreur:', result);
      throw new Error(result.message || `Erreur ${response.status}`);
    }

    console.log('✅ Produit créé:', result);
    return result;

  } catch (error) {
    console.error('❌ Erreur création:', error);
    throw error;
  }
}
```

**Points CRITIQUES :**

1. **productData** doit être un **string JSON**, pas un objet
2. **Fichiers** doivent être nommés `file_${fileId}` (ex: `file_image1`)
3. **categories** est un **array obligatoire** de strings
4. **colorVariations** est un **array obligatoire** avec au moins 1 élément
5. **fileId** dans le JSON doit correspondre au nom du fichier uploadé

**Exemple avec multiple images :**
```javascript
const productData = {
  name: "Hoodie Premium",
  description: "Sweat-shirt de qualité premium",
  price: 45.00,
  stock: 30,
  status: "published",
  categories: ["Sweats", "Hiver"],
  sizes: ["S", "M", "L", "XL"],
  colorVariations: [
    {
      name: "Noir",
      colorCode: "#000000",
      images: [
        {
          fileId: "hoodie_front",
          view: "Front",
          delimitations: [
            {
              x: 30.0,
              y: 40.0,
              width: 40.0,
              height: 20.0,
              name: "Zone Logo Poitrine"
            }
          ]
        },
        {
          fileId: "hoodie_back",
          view: "Back",
          delimitations: [
            {
              x: 20.0,
              y: 30.0,
              width: 60.0,
              height: 40.0,
              name: "Zone Impression Dos"
            }
          ]
        }
      ]
    },
    {
      name: "Blanc",
      colorCode: "#FFFFFF",
      images: [
        {
          fileId: "hoodie_white_front",
          view: "Front",
          delimitations: []
        }
      ]
    }
  ]
};

const formData = new FormData();
formData.append('productData', JSON.stringify(productData));

// Ajouter les fichiers correspondants
formData.append('file_hoodie_front', frontImageFile);
formData.append('file_hoodie_back', backImageFile);
formData.append('file_hoodie_white_front', whiteFrontImageFile);
```

**Réponse Success (201) :**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "name": "T-shirt Test API",
    "description": "T-shirt de test pour vérifier l'API",
    "price": 25,
    "stock": 50,
    "status": "DRAFT",
    "createdAt": "2025-01-10T14:00:00.000Z",
    "updatedAt": "2025-01-10T14:00:00.000Z",
    "categories": [
      {
        "id": 1,
        "name": "T-shirts"
      }
    ],
    "sizes": [
      {
        "id": 15,
        "productId": 15,
        "sizeName": "S"
      },
      {
        "id": 16,
        "productId": 15,
        "sizeName": "M"
      },
      {
        "id": 17,
        "productId": 15,
        "sizeName": "L"
      }
    ],
    "colorVariations": [
      {
        "id": 12,
        "name": "Rouge",
        "colorCode": "#FF0000",
        "productId": 15,
        "images": [
          {
            "id": 45,
            "view": "Front",
            "url": "https://res.cloudinary.com/your-cloud/image/upload/v1699123456/product_image.jpg",
            "publicId": "product_image",
            "naturalWidth": 1200,
            "naturalHeight": 800,
            "colorVariationId": 12,
            "delimitations": []
          }
        ]
      }
    ]
  }
}
```

**Validation automatique :**

Le backend valide automatiquement :
- `name` : 2-255 caractères
- `description` : 10-5000 caractères  
- `price` : > 0
- `stock` : >= 0
- `categories` : au moins 1 élément
- `colorVariations` : au moins 1 élément
- `colorCode` : format #RRGGBB
- `view` : valeurs autorisées seulement
- Fichiers : correspondance avec fileId

**Erreurs communes corrigées :**
```javascript
// ❌ FAUX - Erreur 500
formData.append('productData', productData); // Objet au lieu de string

// ❌ FAUX - Fichier non trouvé
formData.append('image', file); // Nom incorrect

// ❌ FAUX - Propriété manquante
categories: undefined // Provoque l'erreur ".map()"

// ✅ CORRECT
formData.append('productData', JSON.stringify(productData));
formData.append('file_image1', file);
categories: ["T-shirts"]
```

---

### **4. PUT /products/:id** - Modifier un produit

**URL :** `https://localhost:3004/products/{id}`

**Requête :**
```javascript
const productId = 1;
const updateData = {
  name: "T-shirt Premium Modifié",
  description: "Nouvelle description mise à jour",
  colors: [1, 2, 4], // Nouveaux IDs couleurs
  sizes: [1, 2, 3, 4, 5] // Nouveaux IDs tailles
};

const response = await fetch(`${API_BASE}/products/${productId}`, {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});

const data = await response.json();
```

**Exemple complet :**
```javascript
async function updateProduct(productId, updateData) {
  try {
    console.log(`🔄 Modification du produit ${productId}...`);
    
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `Erreur ${response.status}`);
    }
    
    console.log('✅ Produit modifié:', result.data);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur modification:', error);
    throw error;
  }
}
```

**Réponse Success (200) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "T-shirt Premium Modifié",
    "description": "Nouvelle description mise à jour",
    "updatedAt": "2025-01-10T15:30:00.000Z",
    "category": {
      "id": 1,
      "name": "T-shirts"
    },
    "colors": [
      {
        "id": 1,
        "name": "Rouge",
        "hexCode": "#FF0000"
      },
      {
        "id": 2,
        "name": "Bleu",
        "hexCode": "#0000FF"
      },
      {
        "id": 4,
        "name": "Jaune",
        "hexCode": "#FFFF00"
      }
    ],
    "sizes": [
      {
        "id": 1,
        "name": "S"
      },
      {
        "id": 2,
        "name": "M"
      },
      {
        "id": 3,
        "name": "L"
      },
      {
        "id": 4,
        "name": "XL"
      },
      {
        "id": 5,
        "name": "XXL"
      }
    ]
  },
  "message": "Produit modifié avec succès"
}
```

---

### **5. DELETE /products/:id** - Supprimer un produit

**URL :** `https://localhost:3004/products/{id}`

**Requête :**
```javascript
const productId = 1;
const response = await fetch(`${API_BASE}/products/${productId}`, {
  method: 'DELETE',
  credentials: 'include'
});

const data = await response.json();
```

**Exemple complet :**
```javascript
async function deleteProduct(productId) {
  try {
    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer ce produit ?');
    if (!confirmed) return false;
    
    console.log(`🗑️ Suppression du produit ${productId}...`);
    
    const response = await fetch(`${API_BASE}/products/${productId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || `Erreur ${response.status}`);
    }
    
    console.log('✅ Produit supprimé');
    return result;
    
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    throw error;
  }
}
```

**Réponse Success (200) :**
```json
{
  "success": true,
  "message": "Produit supprimé avec succès"
}
```

**Réponse Error (404) :**
```json
{
  "success": false,
  "message": "Produit non trouvé",
  "statusCode": 404
}
```

---

## 🚨 Gestion des Erreurs

### Codes d'erreur courants :

**400 - Bad Request :**
```json
{
  "success": false,
  "message": "Validation échouée",
  "errors": [
    "Le nom est requis",
    "La catégorie doit exister",
    "Au moins une image est requise"
  ],
  "statusCode": 400
}
```

**401 - Unauthorized :**
```json
{
  "success": false,
  "message": "Accès non autorisé",
  "statusCode": 401
}
```

**404 - Not Found :**
```json
{
  "success": false,
  "message": "Produit non trouvé",
  "statusCode": 404
}
```

**500 - Internal Server Error :**
```json
{
  "success": false,
  "message": "Erreur interne du serveur",
  "statusCode": 500
}
```

### Wrapper pour gestion d'erreurs :

```javascript
async function safeProductApiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        throw new Error(`Erreurs de validation:\n${data.errors.join('\n')}`);
      }
      throw new Error(data.message || `Erreur HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Erreur API ${endpoint}:`, error);
    
    // Afficher notification utilisateur
    showErrorNotification(error.message);
    
    throw error;
  }
}

function showErrorNotification(message) {
  // Créer notification d'erreur
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 1000;
    background: #dc3545; color: white; padding: 15px;
    border-radius: 5px; max-width: 300px;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Supprimer après 5 secondes
  setTimeout(() => notification.remove(), 5000);
}
```

---

## ✅ Contraintes de Validation

### **Produit :**
- `name` : obligatoire, 1-255 caractères
- `description` : optionnel, max 1000 caractères  
- `categoryId` : obligatoire, doit exister en base
- `colors` : array d'IDs existants (optionnel)
- `sizes` : array d'IDs existants (optionnel)
- `images` : au moins 1 fichier requis pour création

### **Images :**
- Formats acceptés : JPG, PNG, WEBP
- Taille max : 5MB par fichier
- Minimum : 1 image obligatoire
- Maximum : 10 images par produit

---

## 🎯 Points Clés à Retenir

1. **✅ `credentials: 'include'`** obligatoire pour tous les appels
2. **✅ Port 3004** : `https://localhost:3004`
3. **✅ FormData** pour création avec images (pas JSON)
4. **✅ Validation** côté client avant envoi
5. **✅ Gestion d'erreurs** avec codes appropriés
6. **✅ Au moins 1 image** requise pour création

**🚀 Cette documentation contient tous les détails pour intégrer les endpoints produits !** 