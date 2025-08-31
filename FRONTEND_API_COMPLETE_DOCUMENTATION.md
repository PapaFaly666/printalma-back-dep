# 🚀 Documentation Frontend Complète - Produits et Délimitations

Ce document contient tout ce dont un développeur frontend a besoin pour intégrer les modules de produits et de délimitations.

## 📚 Table des matières
1.  [**Configuration de Base**](#-configuration-de-base)
2.  [**Guide d'Intégration Rapide**](#-guide-dintégration-rapide)
    -   [Fonctions API Essentielles](#fonctions-api-essentielles)
    -   [Affichage et Création Interactive](#affichage-et-création-interactive-de-délimitations)
    -   [Exemple d'Intégration HTML](#-exemple-dintégration-complète)
3.  [**Référence API Détaillée**](#-référence-api-détaillée)
    -   [Endpoints Produits](#-endpoints-produits)
    -   [Endpoints Délimitations](#-endpoints-délimitations)
    -   [Codes d'Erreur Communs](#-codes-derreur-communs)
    -   [Contraintes de Validation](#-contraintes-de-validation)
4.  [**Points Clés à Retenir**](#-points-clés-à-retenir)

---

## 🔧 Configuration de Base

-   **URL API :** `https://localhost:3004/api`
-   **Authentification :** Cookies HTTPS (automatique)
-   **Headers requis :** `Content-Type: application/json`
-   **Credentials :** `include` (obligatoire pour les cookies)

```javascript
const API_BASE = 'https://localhost:3004/api';

// Configuration fetch de base pour tous les appels
async function safeApiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include', // Important pour les cookies HTTPS
      headers: {
        'Content-Type': 'application/json'
      },
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`Erreur API [${options.method || 'GET'} ${endpoint}]:`, error);
    // Afficher l'erreur à l'utilisateur
    showErrorMessage(error.message);
    throw error;
  }
}
```

---

## ⚡ Guide d'Intégration Rapide

### Fonctions API Essentielles

```javascript
// RÉCUPÉRER tous les produits
async function getProducts() {
  return await safeApiCall('/products');
}

// RÉCUPÉRER un produit par ID
async function getProduct(productId) {
  return await safeApiCall(`/products/${productId}`);
}

// CRÉER un produit AVEC UPLOAD D'IMAGES
async function createProduct(productData, imageFiles) {
  // Utiliser FormData pour l'upload de fichiers
  const formData = new FormData();
  
  // Ajouter les données du produit
  formData.append('name', productData.name);
  formData.append('description', productData.description || '');
  formData.append('categoryId', productData.categoryId.toString());
  
  // Ajouter les couleurs et tailles
  if (productData.colors && productData.colors.length > 0) {
    productData.colors.forEach(colorId => {
      formData.append('colors[]', colorId.toString());
    });
  }
  
  if (productData.sizes && productData.sizes.length > 0) {
    productData.sizes.forEach(sizeId => {
      formData.append('sizes[]', sizeId.toString());
    });
  }
  
  // Ajouter les fichiers images (OBLIGATOIRE)
  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach((file, index) => {
      formData.append('images', file);
      // Marquer la première image comme principale
      if (index === 0) {
        formData.append('mainImageIndex', '0');
      }
    });
  } else {
    throw new Error('Au moins une image est requise');
  }
  
  // Appel API avec FormData (pas de Content-Type JSON)
  return await fetch(`${API_BASE}/products`, {
    method: 'POST',
    credentials: 'include',
    // PAS de Content-Type header - FormData le gère automatiquement
    body: formData
  }).then(async response => {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Erreur HTTP ${response.status}`);
    }
    return data;
  });
}

// RÉCUPÉRER les délimitations d'une image
async function getImageDelimitations(imageId) {
  return await safeApiCall(`/delimitations/image/${imageId}`);
}

// CRÉER une délimitation (toujours en pourcentages)
async function createDelimitation(imageId, delimitation) {
  return await safeApiCall('/delimitations', {
    method: 'POST',
    body: JSON.stringify({
      productImageId: imageId,
      delimitation: {
        x: delimitation.x,      // 0-100%
        y: delimitation.y,      // 0-100%
        width: delimitation.width, // 0-100%
        height: delimitation.height, // 0-100%
        name: delimitation.name
        // coordinateType est géré automatiquement par le backend
      }
    })
  });
}

// SUPPRIMER une délimitation
async function deleteDelimitation(delimitationId) {
  return await safeApiCall(`/delimitations/${delimitationId}`, {
    method: 'DELETE'
  });
}
```

### 📸 Gestion Complète d'Upload d'Images

```javascript
// Composant HTML pour la sélection d'images
function createImageUploader() {
  return `
    <div class="image-uploader">
      <input type="file" id="imageFiles" multiple accept="image/*" required>
      <div id="imagePreview"></div>
      <p class="help-text">Sélectionnez au moins une image (formats: JPG, PNG, WEBP)</p>
    </div>
  `;
}

// Prévisualisation des images sélectionnées
function previewImages(inputElement) {
  const previewContainer = document.getElementById('imagePreview');
  previewContainer.innerHTML = '';
  
  const files = Array.from(inputElement.files);
  
  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.createElement('div');
      preview.className = 'image-preview-item';
      preview.innerHTML = `
        <img src="${e.target.result}" alt="Preview ${index + 1}" style="width: 100px; height: 100px; object-fit: cover;">
        <span class="image-label">${index === 0 ? 'Image principale' : `Image ${index + 1}`}</span>
      `;
      previewContainer.appendChild(preview);
    };
    reader.readAsDataURL(file);
  });
}

// Validation des fichiers images
function validateImageFiles(files) {
  const errors = [];
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!files || files.length === 0) {
    errors.push('Au moins une image est requise');
    return errors;
  }
  
  Array.from(files).forEach((file, index) => {
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Image ${index + 1}: Format non supporté (utilisez JPG, PNG ou WEBP)`);
    }
    
    if (file.size > maxSize) {
      errors.push(`Image ${index + 1}: Taille trop grande (max 5MB)`);
    }
  });
  
  return errors;
}

// Exemple d'utilisation complète
async function handleProductSubmit(formData, imageFiles) {
  try {
    // 1. Valider les images
    const imageErrors = validateImageFiles(imageFiles);
    if (imageErrors.length > 0) {
      alert('Erreurs images:\n' + imageErrors.join('\n'));
      return;
    }
    
    // 2. Valider les données du produit
    if (!formData.name || !formData.categoryId) {
      alert('Nom et catégorie sont requis');
      return;
    }
    
    // 3. Créer le produit
    console.log('🚀 Création du produit...');
    const result = await createProduct(formData, imageFiles);
    
    console.log('✅ Produit créé avec succès:', result.data);
    alert(`Produit "${result.data.name}" créé avec succès !`);
    
    // 4. Rediriger ou rafraîchir
    window.location.href = `/products/${result.data.id}`;
    
  } catch (error) {
    console.error('❌ Erreur création produit:', error);
    alert(`Erreur: ${error.message}`);
  }
}
```

### Affichage et Création Interactive de Délimitations

```javascript
// AFFICHER une délimitation sur une image
function displayDelimitation(delimitation, imageElement) {
  const { x, y, width, height, name, id } = delimitation;
  
  const delimitationDiv = document.createElement('div');
  delimitationDiv.className = 'delimitation-zone';
  delimitationDiv.dataset.id = id;
  
  Object.assign(delimitationDiv.style, {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    width: `${width}%`,
    height: `${height}%`,
    border: '2px dashed #007bff',
    cursor: 'pointer'
  });
  
  if (name) delimitationDiv.title = name;
  
  imageElement.parentElement.appendChild(delimitationDiv);
}

// ACTIVER la création de délimitation à la souris
function enableDelimitationDrawing(imageContainer, imageId) {
  // ... (code de la fonction enableDelimitationDrawing)
  // [Le code complet se trouve dans le guide précédent, il est long mais fonctionnel]
}
```

### 📱 Exemple d'Intégration Complète

```html
<!DOCTYPE html>
<html>
<head>
  <title>Produits et Délimitations</title>
  <style>
    .image-container { position: relative; display: inline-block; }
    .image-container img { width: 100%; height: auto; display: block; }
    .delimitation-zone { border: 2px dashed #007bff; background: rgba(0,123,255,0.1); }
  </style>
</head>
<body>
  <select id="product-select"></select>
  <div id="image-container">
    <img id="product-image">
  </div>
  <button id="create-delim-btn">Créer Délimitation</button>

  <script>
    // ... fonctions safeApiCall, getProducts, etc.
    
    window.addEventListener('load', async () => {
      const productsResult = await getProducts();
      // ... remplir le select
    });
    
    // ... logique pour charger un produit et ses délimitations
  </script>
</body>
</html>
```

---

## 📡 Référence API Détaillée

### 📦 Endpoints Produits

#### **1. `GET /api/products`** - Récupérer tous les produits
-   **Réponse (200)** :
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "name": "T-shirt Premium",
          "category": { "id": 1, "name": "T-shirts" },
          "images": [ { "id": 45, "url": "...", "isMain": true } ]
        }
      ]
    }
    ```

#### **2. `GET /api/products/:id`** - Récupérer un produit
-   **Réponse (200)** :
    ```json
    {
      "success": true,
      "data": {
        "id": 1,
        "name": "T-shirt Premium",
        // ... autres champs
        "images": [
          {
            "id": 45,
            "url": "...",
            "naturalWidth": 1000,
            "naturalHeight": 800,
            "delimitations": [
              {
                "id": 15,
                "x": 25.5,
                "y": 30.0,
                "width": 40.0,
                "height": 25.0,
                "coordinateType": "PERCENTAGE"
              }
            ]
          }
        ]
      }
    }
    ```

#### **3. `POST /api/products`** - Créer un produit
**⚠️ Important:** Utilisez FormData avec des fichiers images, pas JSON.
-   **Requête FormData** :
    ```javascript
    const formData = new FormData();
    formData.append('name', 'Nouveau Produit');
    formData.append('categoryId', '1');
    formData.append('colors[]', '1');
    formData.append('colors[]', '2');
    formData.append('images', fileInput.files[0]); // Fichier image
    ```
-   **Réponse (201)** : Renvoie l'objet produit complet nouvellement créé.

---

### 🎯 Endpoints Délimitations

#### **1. `GET /api/delimitations/image/:imageId`**
-   **Réponse (200)** :
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 15,
          "x": 25.5,
          "y": 30.0,
          "width": 40.0,
          "height": 25.0,
          "name": "Zone Logo",
          "coordinateType": "PERCENTAGE"
        }
      ]
    }
    ```

#### **2. `POST /api/delimitations`**
-   **Important** : Le backend définit `coordinateType: "PERCENTAGE"` automatiquement.
-   **Requête `body`** :
    ```json
    {
      "productImageId": 45,
      "delimitation": {
        "x": 25.5, "y": 30.0, "width": 40.0, "height": 25.0, "name": "Zone Logo"
      }
    }
    ```
-   **Réponse (201)** : Renvoie l'objet délimitation complet nouvellement créé.

#### **3. `PUT /api/delimitations/:id`**
-   **Requête `body`** :
    ```json
    {
      "x": 30.0, "y": 35.0, "name": "Nouveau Nom"
    }
    ```
-   **Réponse (200)** : Renvoie l'objet délimitation mis à jour.

#### **4. `DELETE /api/delimitations/:id`**
-   **Réponse (200)** :
    ```json
    {
      "success": true,
      "message": "Délimitation supprimée avec succès"
    }
    ```
    
*(Les endpoints de migration et de conversion sont également disponibles mais moins courants pour l'usage quotidien)*

---

### 🚨 Codes d'Erreur Communs
-   **400 (Bad Request)** : Données invalides (ex: `x > 100`).
-   **401 (Unauthorized)** : Cookie de session manquant ou invalide.
-   **404 (Not Found)** : Produit ou délimitation non trouvé.
-   **500 (Internal Server Error)** : Erreur côté serveur.

### 📋 Contraintes de Validation
-   **Produit** : `name`, `categoryId` requis.
-   **Délimitation** : Coordonnées `x`, `y` entre 0-100. `width`, `height` entre 0.1-100. La zone ne doit pas déborder (`x + width <= 100`).

---

## ✨ Points Clés à Retenir

1.  **✅ `credentials: 'include'`** est **obligatoire** pour tous les appels `fetch`.
2.  **✅ Port 3004** : `https://localhost:3004/api`.
3.  **✅ Pourcentages Uniquement** : Les nouvelles délimitations sont **toujours** créées avec des coordonnées en pourcentages (0-100%).
4.  **✅ Validation Client** : Validez les coordonnées avant l'envoi pour une meilleure UX.
5.  **✅ Gestion d'Erreurs** : Utilisez un wrapper `safeApiCall` pour gérer les erreurs de manière centralisée.
6.  **✅ Simplicité** : Pas besoin d'envoyer `coordinateType` lors de la création d'une délimitation.

**🚀 Cette documentation fusionne tout ce qu'il faut pour une intégration frontend réussie !** 

# 📚 DOCUMENTATION COMPLÈTE API FRONTEND
## Endpoints Produits et Délimitations

**Version :** 2.0 - Résolution erreur 500  
**Date :** 10 juin 2025  
**Équipe :** Frontend Development  
**Backend :** NestJS + Prisma

---

## 🔧 CONFIGURATION BASE

```javascript
// Configuration API principale
const API_BASE = 'https://localhost:3004';
const CONFIG = {
  credentials: 'include', // OBLIGATOIRE pour cookies HTTPS
  headers: {
    'Content-Type': 'application/json'
  }
};

// Note: Pas de Content-Type avec FormData
```

### **Points Critiques Configuration :**
- ✅ **Port :** 3004 (HTTPS)
- ✅ **Cookies :** `credentials: 'include'` obligatoire
- ✅ **Produits :** URL directe sans `/api` (`/products`)
- ✅ **Délimitations :** URL avec `/api` (`/api/delimitations`)

---

## 📦 ENDPOINTS PRODUITS

### **1. GET /products** - Récupérer tous les produits

**URL :** `https://localhost:3004/products`

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
      "price": 29.99,
      "stock": 100,
      "status": "PUBLISHED",
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-10T12:30:00.000Z",
      "categories": [
        {
          "id": 1,
          "name": "T-shirts",
          "description": "Collection T-shirts"
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
        }
      ],
      "colorVariations": [
        {
          "id": 1,
          "name": "Rouge",
          "colorCode": "#FF0000",
          "productId": 1,
          "images": [
            {
              "id": 45,
              "view": "Front",
              "url": "https://res.cloudinary.com/printalma/tshirt-main.jpg",
              "publicId": "tshirt-main",
              "naturalWidth": 1000,
              "naturalHeight": 800,
              "colorVariationId": 1,
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
                  "productImageId": 45
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "count": 1
}
```

---

### **2. GET /products/:id** - Récupérer un produit par ID

**URL :** `https://localhost:3004/products/{id}`

```javascript
const productId = 1;
const response = await fetch(`${API_BASE}/products/${productId}`, {
  method: 'GET',
  credentials: 'include'
});
const data = await response.json();
```

**Utilisation :**
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
      console.log(`Couleurs: ${product.colorVariations.length}`);
      
      // Compter délimitations
      const totalDelimitations = product.colorVariations
        .flatMap(cv => cv.images)
        .reduce((total, img) => total + img.delimitations.length, 0);
      
      console.log(`Total délimitations: ${totalDelimitations}`);
      return product;
    }
  } catch (error) {
    console.error('Erreur chargement produit:', error);
  }
}
```

---

### **3. POST /products** - Créer un nouveau produit ⚠️ SOLUTION ERREUR 500

**URL :** `https://localhost:3004/products`

**🚨 FORMAT EXACT REQUIS (Résolution erreur 500) :**

```javascript
async function createProduct(productInfo, imageFiles) {
  try {
    // Validation obligatoire
    if (!productInfo.categories || productInfo.categories.length === 0) {
      throw new Error('Au moins une catégorie est requise');
    }
    
    if (!imageFiles || imageFiles.length === 0) {
      throw new Error('Au moins une image est requise');
    }

    // Structure EXACTE attendue par le backend
    const productData = {
      name: productInfo.name,                           // OBLIGATOIRE
      description: productInfo.description,             // OBLIGATOIRE
      price: parseFloat(productInfo.price),             // OBLIGATOIRE (number)
      stock: parseInt(productInfo.stock),               // OBLIGATOIRE (number >= 0)
      status: productInfo.status || "draft",            // OPTIONNEL
      categories: productInfo.categories,               // OBLIGATOIRE (array strings)
      sizes: productInfo.sizes || [],                   // OPTIONNEL
      colorVariations: [                                // OBLIGATOIRE (≥1)
        {
          name: productInfo.colorName || "Couleur par défaut",
          colorCode: productInfo.colorCode || "#000000", // Format #RRGGBB
          images: [                                      // OBLIGATOIRE (≥1)
            {
              fileId: "main_image",                      // CORRESPOND au fichier
              view: "Front",                             // Valeurs autorisées
              delimitations: productInfo.delimitations || []
            }
          ]
        }
      ]
    };

    // Créer FormData avec format EXACT
    const formData = new FormData();
    
    // CRITIQUE: productData DOIT être un STRING JSON
    formData.append('productData', JSON.stringify(productData));
    
    // CRITIQUE: Fichiers avec préfixe "file_"
    formData.append('file_main_image', imageFiles[0]);

    // Envoi
    const response = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      credentials: 'include',
      // PAS de Content-Type avec FormData
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Erreur ${response.status}`);
    }

    console.log('✅ Produit créé:', result.data);
    return result;

  } catch (error) {
    console.error('❌ Erreur création:', error);
    throw error;
  }
}
```

**Exemple d'utilisation :**
```javascript
// Produit simple
const productInfo = {
  name: "T-shirt Cotton Bio",
  description: "T-shirt en coton biologique premium",
  price: 29.99,
  stock: 50,
  categories: ["T-shirts"],
  sizes: ["S", "M", "L", "XL"],
  colorName: "Bleu Marine",
  colorCode: "#001f3f"
};

const imageFile = document.getElementById('imageInput').files[0];
await createProduct(productInfo, [imageFile]);
```

**Points CRITIQUES pour éviter l'erreur 500 :**
1. **productData** = STRING JSON (jamais un objet)
2. **categories** = Array non vide (jamais undefined)
3. **colorVariations** = Au moins 1 élément
4. **Fichiers** = Préfixe "file_" + fileId

---

### **4. PUT /products/:id** - Modifier un produit

**URL :** `https://localhost:3004/products/{id}`

```javascript
async function updateProduct(productId, updateData) {
  const response = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  
  return await response.json();
}

// Exemple d'utilisation
const updateData = {
  name: "T-shirt Premium Modifié",
  description: "Nouvelle description",
  price: 35.99,
  stock: 75
};

await updateProduct(1, updateData);
```

---

### **5. DELETE /products/:id** - Supprimer un produit

**URL :** `https://localhost:3004/products/{id}`

```javascript
async function deleteProduct(productId) {
  const response = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  return await response.json();
}
```

---

## 🎯 ENDPOINTS DÉLIMITATIONS

### **1. GET /api/delimitations** - Récupérer toutes les délimitations

**URL :** `https://localhost:3004/api/delimitations`

```javascript
const response = await fetch(`${API_BASE}/api/delimitations`, {
  method: 'GET',
  credentials: 'include'
});
const data = await response.json();
```

**Réponse Success :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "x": 25.5,
      "y": 35.0,
      "width": 35.0,
      "height": 20.0,
      "rotation": 0,
      "name": "Zone Logo",
      "coordinateType": "PERCENTAGE",
      "productImageId": 45,
      "createdAt": "2025-01-10T11:15:00.000Z",
      "updatedAt": "2025-01-10T11:15:00.000Z",
      "productImage": {
        "id": 45,
        "view": "Front",
        "url": "https://res.cloudinary.com/printalma/image.jpg",
        "naturalWidth": 1000,
        "naturalHeight": 800
      }
    }
  ],
  "count": 1
}
```

---

### **2. GET /api/delimitations/:id** - Récupérer une délimitation

**URL :** `https://localhost:3004/api/delimitations/{id}`

```javascript
async function getDelimitation(delimitationId) {
  const response = await fetch(`${API_BASE}/api/delimitations/${delimitationId}`, {
    credentials: 'include'
  });
  return await response.json();
}
```

---

### **3. POST /api/delimitations** - Créer une délimitation

**URL :** `https://localhost:3004/api/delimitations`

```javascript
async function createDelimitation(delimitationData) {
  const response = await fetch(`${API_BASE}/api/delimitations`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(delimitationData)
  });
  
  return await response.json();
}

// Structure délimitation
const delimitationData = {
  x: 30.0,                          // Pourcentage (0-100)
  y: 40.0,                          // Pourcentage (0-100)
  width: 35.0,                      // Pourcentage (0-100)
  height: 20.0,                     // Pourcentage (0-100)
  rotation: 0,                      // Degrés (-180 à 180)
  name: "Zone Personnalisation",    // Nom de la zone
  coordinateType: "PERCENTAGE",     // Par défaut
  productImageId: 45                // ID de l'image
};

await createDelimitation(delimitationData);
```

**Note importante :** Les coordonnées sont automatiquement en pourcentages (0-100%) pour toutes les nouvelles délimitations.

---

### **4. PUT /api/delimitations/:id** - Modifier une délimitation

**URL :** `https://localhost:3004/api/delimitations/{id}`

```javascript
async function updateDelimitation(delimitationId, updateData) {
  const response = await fetch(`${API_BASE}/api/delimitations/${delimitationId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  
  return await response.json();
}

// Exemple modification
const updateData = {
  x: 25.0,
  y: 30.0,
  width: 40.0,
  height: 25.0,
  name: "Zone Logo Modifiée"
};

await updateDelimitation(1, updateData);
```

---

### **5. DELETE /api/delimitations/:id** - Supprimer une délimitation

**URL :** `https://localhost:3004/api/delimitations/{id}`

```javascript
async function deleteDelimitation(delimitationId) {
  const response = await fetch(`${API_BASE}/api/delimitations/${delimitationId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  
  return await response.json();
}
```

---

## 🚨 GESTION DES ERREURS

### **Codes d'erreur courants :**

| Code | Type | Cause | Solution |
|------|------|--------|----------|
| 400 | Bad Request | Données invalides | Vérifier format et validation |
| 401 | Unauthorized | Pas de cookies | Ajouter `credentials: 'include'` |
| 404 | Not Found | Ressource inexistante | Vérifier ID |
| 500 | Server Error | Erreur backend | Vérifier format exact |

### **Wrapper pour gestion d'erreurs :**

```javascript
async function safeApiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include',
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (data.errors && Array.isArray(data.errors)) {
        throw new Error(`Erreurs: ${data.errors.join(', ')}`);
      }
      throw new Error(data.message || `Erreur HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Erreur API ${endpoint}:`, error);
    showErrorNotification(error.message);
    throw error;
  }
}

function showErrorNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 1000;
    background: #dc3545; color: white; padding: 15px;
    border-radius: 5px; max-width: 300px;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}
```

---

## ✅ CONTRAINTES DE VALIDATION

### **Produits :**
- `name` : 2-255 caractères
- `description` : 10-5000 caractères
- `price` : > 0 (number)
- `stock` : >= 0 (number)
- `categories` : array non vide de strings
- `colorVariations` : au moins 1 élément
- `colorCode` : format #RRGGBB strict
- `view` : "Front", "Back", "Left", "Right", "Top", "Bottom", "Detail"

### **Délimitations :**
- `x`, `y`, `width`, `height` : 0-100 (pourcentages)
- `rotation` : -180 à 180 (degrés)
- `name` : optionnel, max 255 caractères
- `productImageId` : doit exister

### **Images :**
- Formats : JPG, PNG, WEBP
- Taille max : 5MB par fichier
- Minimum : 1 image par produit

---

## 🔧 EXEMPLES COMPLETS

### **Création produit avec délimitations :**

```javascript
async function createProductWithDelimitations() {
  // 1. Créer le produit
  const productInfo = {
    name: "T-shirt Personnalisable",
    description: "T-shirt avec zones de personnalisation prédéfinies",
    price: 35.99,
    stock: 100,
    categories: ["T-shirts", "Personnalisable"],
    sizes: ["S", "M", "L", "XL"],
    colorName: "Blanc",
    colorCode: "#FFFFFF",
    delimitations: [
      {
        x: 30.0,
        y: 40.0,
        width: 40.0,
        height: 25.0,
        name: "Zone Logo Poitrine"
      }
    ]
  };

  const imageFile = document.getElementById('imageInput').files[0];
  const productResult = await createProduct(productInfo, [imageFile]);
  
  console.log('✅ Produit créé avec délimitations:', productResult.data);
  
  // 2. Ajouter délimitations supplémentaires si nécessaire
  const productImageId = productResult.data.colorVariations[0].images[0].id;
  
  const additionalDelimitation = {
    x: 20.0,
    y: 70.0,
    width: 60.0,
    height: 15.0,
    name: "Zone Texte Bas",
    productImageId: productImageId
  };
  
  const delimitationResult = await createDelimitation(additionalDelimitation);
  console.log('✅ Délimitation ajoutée:', delimitationResult.data);
}
```

### **Interface complète produits + délimitations :**

```javascript
class ProductDelimitationManager {
  constructor() {
    this.apiBase = 'https://localhost:3004';
  }

  async loadProducts() {
    return await safeApiCall('/products');
  }

  async loadProductWithDelimitations(productId) {
    const product = await safeApiCall(`/products/${productId}`);
    
    // Les délimitations sont déjà incluses dans la réponse produit
    return product;
  }

  async createProductWithZones(productData, imageFiles, zones = []) {
    // Ajouter zones aux colorVariations
    if (zones.length > 0) {
      productData.colorVariations[0].images[0].delimitations = zones;
    }

    return await createProduct(productData, imageFiles);
  }

  async updateDelimitationPosition(delimitationId, newPosition) {
    return await safeApiCall(`/api/delimitations/${delimitationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPosition)
    });
  }

  async deleteDelimitation(delimitationId) {
    return await safeApiCall(`/api/delimitations/${delimitationId}`, {
      method: 'DELETE'
    });
  }
}

// Utilisation
const manager = new ProductDelimitationManager();

// Charger produits
const products = await manager.loadProducts();
console.log('Produits chargés:', products.count);

// Charger produit avec délimitations
const productDetails = await manager.loadProductWithDelimitations(1);
console.log('Délimitations:', productDetails.data.colorVariations[0].images[0].delimitations);
```

---

## 📊 SYSTÈME DE COORDONNÉES

### **Délimitations en pourcentages (nouveau système) :**

```javascript
// Coordonnées relatives (0-100%)
const delimitation = {
  x: 25.0,        // 25% de la largeur de l'image
  y: 30.0,        // 30% de la hauteur de l'image  
  width: 40.0,    // 40% de la largeur de l'image
  height: 20.0,   // 20% de la hauteur de l'image
  coordinateType: "PERCENTAGE"  // Automatique pour nouvelles délimitations
};

// Conversion pour affichage (si image = 1000x800px)
const absoluteCoords = {
  x: (delimitation.x / 100) * 1000,      // 250px
  y: (delimitation.y / 100) * 800,       // 240px
  width: (delimitation.width / 100) * 1000,   // 400px
  height: (delimitation.height / 100) * 800   // 160px
};
```

---

## 🎯 CHECKLIST INTÉGRATION

### **Avant de commencer :**
- [ ] Serveur démarré sur port 3004
- [ ] Cookies HTTPS configurés
- [ ] `credentials: 'include'` ajouté partout

### **Pour les produits :**
- [ ] Format FormData avec `productData` en string JSON
- [ ] Fichiers nommés `file_${fileId}`
- [ ] `categories` toujours en array
- [ ] `colorVariations` avec au moins 1 élément
- [ ] Validation côté client

### **Pour les délimitations :**
- [ ] Coordonnées en pourcentages (0-100)
- [ ] `productImageId` valide
- [ ] `coordinateType` défini si nécessaire

### **Tests :**
- [ ] Interface HTML de test utilisée
- [ ] Création produit validée
- [ ] Délimitations testées
- [ ] Gestion d'erreurs fonctionnelle

---

## 📁 FICHIERS DE RÉFÉRENCE

### **Documentation :**
- `URGENT_SOLUTION_ERREUR_500_CREATION_PRODUITS.md` - Solution détaillée erreur 500
- `FRONTEND_PRODUCTS_ENDPOINTS_GUIDE.md` - Guide complet endpoints produits
- `RESUME_SOLUTION_FRONTEND.md` - Résumé rapide

### **Tests :**
- `test-creation-produit-frontend.html` - Interface de test complète
- `test-product-creation-fix.js` - Script de test Node.js

### **Ce document :**
- `FRONTEND_API_COMPLETE_DOCUMENTATION.md` - Documentation complète actuelle

---

## ✅ STATUT FINAL

**🎉 INTÉGRATION COMPLÈTE PRÊTE**

- ✅ **Endpoints produits** : Tous documentés et testés
- ✅ **Endpoints délimitations** : Tous documentés avec nouveau système
- ✅ **Erreur 500** : Résolue avec format exact
- ✅ **Exemples** : Code prêt à utiliser
- ✅ **Tests** : Interface complète disponible
- ✅ **Configuration** : HTTPS + cookies validés

**Votre équipe frontend a maintenant TOUT le nécessaire pour intégrer les fonctionnalités produits et délimitations !**

---

*Documentation complète créée le 10/06/2025 - Version finale* 