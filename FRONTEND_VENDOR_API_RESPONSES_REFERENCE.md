# 📋 RÉFÉRENCE API VENDEUR - Réponses Backend PrintAlma

## 🎯 ENDPOINTS DISPONIBLES

### **Publication de Produits**
- `POST /vendor/products` - Créer un produit vendeur (nouveau)
- `POST /vendor/publish` - Publier un produit vendeur (original)

### **Gestion des Produits**
- `GET /vendor/products` - Lister les produits du vendeur
- `GET /vendor/stats` - Statistiques du vendeur

### **Maintenance (Admin)**
- `POST /vendor/maintenance/fix-all` - Corrections automatiques

---

## 🚀 POST /vendor/products (PRINCIPAL)

### **Payload Requis**
```json
{
  "baseProductId": 1,
  "vendorName": "Nom du produit",
  "vendorDescription": "Description du produit",
  "vendorPrice": 25000,
  "basePriceAdmin": 15000,
  "vendorStock": 10,
  
  "designUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "designFile": {
    "name": "design.png",
    "size": 245760,
    "type": "image/png"
  },
  
  "finalImagesBase64": {
    "design": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "Blanc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "Noir": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "Rouge": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  },
  
  "finalImages": {
    "colorImages": {
      "Blanc": {
        "colorInfo": { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
        "imageUrl": "blob:http://localhost:5173/blanc-mockup",
        "imageKey": "Blanc"
      },
      "Noir": {
        "colorInfo": { "id": 2, "name": "Noir", "colorCode": "#000000" },
        "imageUrl": "blob:http://localhost:5173/noir-mockup", 
        "imageKey": "Noir"
      }
    },
    "statistics": {
      "totalColorImages": 2,
      "hasDefaultImage": false,
      "availableColors": ["Blanc", "Noir"],
      "totalImagesGenerated": 3
    }
  },
  
  "selectedColors": [
    { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
    { "id": 2, "name": "Noir", "colorCode": "#000000" }
  ],
  
  "selectedSizes": [
    { "id": 1, "sizeName": "S" },
    { "id": 2, "sizeName": "M" },
    { "id": 3, "sizeName": "L" }
  ],
  
  "previewView": {
    "viewType": "FRONT",
    "url": "https://example.com/preview",
    "delimitations": []
  },
  
  "publishedAt": "2024-01-15T10:30:00.000Z"
}
```

### **✅ SUCCÈS (201 Created)**
```json
{
  "success": true,
  "productId": 123,
  "message": "Produit publié avec succès",
  "imagesProcessed": 3,
  "imageDetails": {
    "totalImages": 3,
    "colorImages": 2,
    "defaultImage": 0,
    "uploadedToCloudinary": 3
  }
}
```

### **❌ ERREUR VALIDATION (400 Bad Request)**
```json
{
  "statusCode": 400,
  "message": "Données invalides",
  "errors": [
    "Prix vendeur (10000) inférieur au prix minimum (12000)",
    "Au moins une couleur doit être sélectionnée"
  ]
}
```

### **❌ ERREUR DESIGN MANQUANT (400 Bad Request)**
```json
{
  "statusCode": 400,
  "error": "Design original manquant",
  "details": "Le design doit être fourni dans finalImagesBase64[\"design\"] ou designUrl en base64",
  "guidance": {
    "recommended": "Ajouter clé \"design\" dans finalImagesBase64",
    "alternative": "Envoyer designUrl en base64 (au lieu de blob)",
    "note": "Les mockups restent dans les autres clés (blanc, noir, etc.)"
  },
  "received": {
    "finalImagesBase64Keys": ["Blanc", "Noir"],
    "designUrlFormat": "blob/autre"
  }
}
```

### **🔐 ERREUR AUTHENTIFICATION (401 Unauthorized)**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### **🚫 ERREUR PERMISSIONS (403 Forbidden)**
```json
{
  "statusCode": 403,
  "message": "Accès refusé - Rôle vendeur requis"
}
```

---

## 📋 GET /vendor/products

### **Paramètres Query**
- `limit` (optionnel) : Nombre de produits par page (défaut: 20, max: 100)
- `offset` (optionnel) : Décalage pour pagination (défaut: 0)
- `status` (optionnel) : Filtrer par statut (`all`, `published`, `draft`)
- `search` (optionnel) : Recherche textuelle dans nom et description

### **✅ SUCCÈS (200 OK)**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 123,
        "vendorId": 456,
        "baseProductId": 1,
        "price": 25000,
        "status": "PUBLISHED",
        "vendorName": "T-shirt Design Flamme",
        "vendorDescription": "Magnifique t-shirt personnalisé",
        "vendorStock": 50,
        "basePriceAdmin": 15000,
        "designUrl": "https://res.cloudinary.com/printalma/image/upload/v123/designs-originals/design_123.png",
        "mockupUrl": "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/mockup_123.webp",
        "originalDesignUrl": "https://res.cloudinary.com/printalma/image/upload/v123/designs-originals/design_123.png",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "baseProduct": {
          "id": 1,
          "name": "T-shirt Basique",
          "price": 15000,
          "status": "PUBLISHED",
          "description": "T-shirt de base pour personnalisation",
          "categories": [
            { "id": 1, "name": "T-shirts" }
          ]
        },
        "vendor": {
          "id": 456,
          "firstName": "Jean",
          "lastName": "Dupont",
          "email": "jean.dupont@example.com",
          "vendeurType": "INDIVIDUAL",
          "fullName": "Jean Dupont"
        },
        "selectedSizes": [
          { "id": 1, "sizeName": "S" },
          { "id": 2, "sizeName": "M" },
          { "id": 3, "sizeName": "L" }
        ],
        "selectedColors": [
          { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
          { "id": 2, "name": "Noir", "colorCode": "#000000" }
        ],
        "images": {
          "total": 2,
          "colorImages": [
            {
              "id": 789,
              "vendorProductId": 123,
              "colorId": 1,
              "colorName": "Blanc",
              "colorCode": "#FFFFFF",
              "imageType": "color",
              "cloudinaryUrl": "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp",
              "cloudinaryPublicId": "vendor-products/blanc_123",
              "originalImageKey": "Blanc",
              "width": null,
              "height": null,
              "fileSize": 245760,
              "format": "webp",
              "uploadedAt": "2024-01-15T10:30:00.000Z"
            }
          ],
          "defaultImages": [],
          "primaryImageUrl": "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp",
          "imageUrls": [
            "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp",
            "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/noir_123.webp"
          ]
        }
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "page": 1,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 📊 GET /vendor/stats

### **✅ SUCCÈS (200 OK)**
```json
{
  "success": true,
  "stats": {
    "totalProducts": 45,
    "publishedProducts": 42,
    "draftProducts": 3,
    "totalImages": 0,
    "totalRevenue": 1125000,
    "averagePrice": 25000,
    "totalStock": 0
  },
  "calculatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

## 🔧 POST /vendor/maintenance/fix-all (Admin)

### **✅ SUCCÈS (200 OK)**
```json
{
  "success": true,
  "message": "Toutes les corrections appliquées avec succès",
  "fixes": [
    "URLs design corrigées (blob -> Cloudinary)",
    "MockupUrl générés quand possible",
    "Formats JSON sizes/colors enrichis"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🏥 GET /vendor/health

### **✅ SUCCÈS (200 OK)**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "services": {
    "database": "connected",
    "cloudinary": "connected",
    "imageProcessing": "operational"
  }
}
```

---

## 🚨 ERREURS COMMUNES

### **Payload Trop Volumineux (413)**
```json
{
  "statusCode": 413,
  "message": "Payload too large"
}
```

### **Erreur Serveur (500)**
```json
{
  "statusCode": 500,
  "message": "Erreur serveur lors de la publication"
}
```

### **Produit Base Introuvable (400)**
```json
{
  "statusCode": 400,
  "message": "Données invalides",
  "errors": ["Produit de base introuvable"]
}
```

### **Vendeur Inactif (400)**
```json
{
  "statusCode": 400,
  "message": "Données invalides", 
  "errors": ["Vendeur non autorisé ou inactif"]
}
```

---

## 🎯 POINTS CLÉS POUR LE FRONTEND

### **1. Structure Payload Obligatoire**
```javascript
// ✅ OBLIGATOIRE
finalImagesBase64: {
  'design': 'data:image/png;base64,...',  // ← CRUCIAL
  'Blanc': 'data:image/png;base64,...',   // ← Mockups
  'Noir': 'data:image/png;base64,...'     // ← Mockups
}
```

### **2. Gestion des Erreurs**
```javascript
try {
  const response = await fetch('/vendor/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  
  if (response.ok) {
    // Succès (201)
    console.log('Produit créé:', result.productId);
    console.log('Images uploadées:', result.imagesProcessed);
  } else {
    // Erreur (400, 401, 403, 500)
    console.error('Erreur:', result.message);
    if (result.errors) {
      result.errors.forEach(error => console.error('- ' + error));
    }
    if (result.guidance) {
      console.log('Guidance:', result.guidance);
    }
  }
} catch (error) {
  console.error('Erreur réseau:', error);
}
```

### **3. Conversion Blob vers Base64**
```javascript
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Utilisation
const designBase64 = await convertFileToBase64(designFile);
const mockupBlancBase64 = await convertFileToBase64(mockupBlancFile);

const payload = {
  // ... autres champs ...
  finalImagesBase64: {
    'design': designBase64,
    'Blanc': mockupBlancBase64
  }
};
```

### **4. Pagination des Produits**
```javascript
const fetchProducts = async (page = 1, limit = 20, status = 'all') => {
  const offset = (page - 1) * limit;
  const response = await fetch(
    `/vendor/products?limit=${limit}&offset=${offset}&status=${status}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const result = await response.json();
  
  return {
    products: result.data.products,
    pagination: result.data.pagination,
    hasNext: result.data.pagination.hasNext,
    hasPrev: result.data.pagination.hasPrev
  };
};
```

### **5. Affichage des Images**
```javascript
// Utiliser les URLs Cloudinary directement
const ProductCard = ({ product }) => (
  <div className="product-card">
    <img 
      src={product.images.primaryImageUrl} 
      alt={product.vendorName}
      onError={(e) => {
        e.target.src = product.designUrl; // Fallback vers design
      }}
    />
    <h3>{product.vendorName}</h3>
    <p>{product.price / 100} €</p>
    <span className={`status ${product.status.toLowerCase()}`}>
      {product.status}
    </span>
  </div>
);
```

### **6. Récupération Détails Produit**
```javascript
const fetchProductDetails = async (productId, token) => {
  try {
    const response = await fetch(`/vendor/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Produit introuvable');
      } else if (response.status === 403) {
        throw new Error('Accès refusé - Vous ne pouvez voir que vos propres produits');
      }
      throw new Error('Erreur lors de la récupération');
    }
    
    const result = await response.json();
    
    return {
      product: result.data,
      metadata: result.data.metadata,
      images: result.data.images,
      vendor: result.data.vendor,
      baseProduct: result.data.baseProduct
    };
  } catch (error) {
    console.error('Erreur récupération détails:', error);
    throw error;
  }
};

// Utilisation
const productDetails = await fetchProductDetails(123, userToken);
console.log('Produit:', productDetails.product.vendorName);
console.log('Marge:', productDetails.metadata.profitMargin / 100, '€');
console.log('Images:', productDetails.images.total);
```

### **7. Composant Détails Produit**
```javascript
// components/ProductDetailsModal.jsx
import React, { useState, useEffect } from 'react';

const ProductDetailsModal = ({ productId, token, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/vendor/products/${productId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`Erreur ${response.status}`);
        }
        
        const result = await response.json();
        setDetails(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadDetails();
    }
  }, [productId, token]);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;
  if (!details) return null;

  return (
    <div className="product-details-modal">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>{details.vendorName}</h2>
        <p>{details.vendorDescription}</p>
        
        <div className="product-info">
          <div className="info-section">
            <h3>💰 Informations Financières</h3>
            <p>Prix de vente: {details.price / 100} €</p>
            <p>Prix de base: {details.basePriceAdmin / 100} €</p>
            <p>Marge: {details.metadata.profitMargin / 100} € ({details.metadata.profitPercentage}%)</p>
            <p>Valeur totale stock: {details.metadata.totalValue / 100} €</p>
          </div>
          
          <div className="info-section">
            <h3>📦 Stock et Disponibilité</h3>
            <p>Stock: {details.vendorStock} unités</p>
            <p>Statut: {details.status}</p>
            <p>Tailles: {details.selectedSizes.map(s => s.sizeName).join(', ')}</p>
            <p>Couleurs: {details.selectedColors.map(c => c.name).join(', ')}</p>
          </div>
          
          <div className="info-section">
            <h3>🖼️ Images</h3>
            <p>Total: {details.images.total} images</p>
            <p>Qualité design: {details.metadata.designQuality}</p>
            <p>Taille moyenne: {Math.round(details.metadata.averageImageSize / 1024)} KB</p>
            
            <div className="image-gallery">
              {details.images.colorImages.map(img => (
                <div key={img.id} className="image-item">
                  <img src={img.cloudinaryUrl} alt={img.colorName} />
                  <span>{img.colorName}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="info-section">
            <h3>👤 Vendeur</h3>
            <p>Nom: {details.vendor.fullName}</p>
            <p>Email: {details.vendor.email}</p>
            <p>Type: {details.vendor.vendeurType}</p>
            <p>Membre depuis: {new Date(details.vendor.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div className="info-section">
            <h3>📋 Produit de Base</h3>
            <p>Nom: {details.baseProduct.name}</p>
            <p>Description: {details.baseProduct.description}</p>
            <p>Catégories: {details.baseProduct.categories.map(c => c.name).join(', ')}</p>
          </div>
        </div>
        
        <div className="action-buttons">
          <a href={details.designUrl} target="_blank" rel="noopener noreferrer">
            🎨 Voir Design Original
          </a>
          {details.mockupUrl && (
            <a href={details.mockupUrl} target="_blank" rel="noopener noreferrer">
              🖼️ Voir Mockup
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
```

---

## 🎉 RÉSUMÉ

### **Endpoints Fonctionnels**
- ✅ `POST /vendor/products` - Création de produits
- ✅ `POST /vendor/publish` - Publication (alias)
- ✅ `GET /vendor/products` - Liste des produits
- ✅ `GET /vendor/stats` - Statistiques

### **Authentification**
- 🔐 JWT Bearer Token requis
- 👤 Rôle VENDEUR obligatoire

### **Limites**
- 📦 Payload max: 100MB
- 🖼️ Image max: 15MB chacune
- 📄 Produits par page: 100 max

### **Qualité Images**
- 🎨 Design original: 100% qualité PNG
- 🖼️ Mockups: Qualité optimisée WebP 1500px

---

**🚀 Le backend est prêt ! Le frontend peut maintenant publier des produits vendeur avec succès !**

---

## 🔍 GET /vendor/products/:id (DÉTAILS COMPLETS)

### **URL**
```
GET /vendor/products/{id}
```

### **Paramètres**
- `id` (path, requis) : ID du produit vendeur (number)

### **✅ SUCCÈS (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "vendorId": 456,
    "baseProductId": 1,
    "price": 25000,
    "status": "PUBLISHED",
    "vendorName": "T-shirt Design Flamme",
    "vendorDescription": "Magnifique t-shirt personnalisé avec design flamme",
    "vendorStock": 50,
    "basePriceAdmin": 15000,
    "designUrl": "https://res.cloudinary.com/printalma/image/upload/v123/designs-originals/design_123.png",
    "mockupUrl": "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/mockup_123.webp",
    "originalDesignUrl": "https://res.cloudinary.com/printalma/image/upload/v123/designs-originals/design_123.png",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    
    "baseProduct": {
      "id": 1,
      "name": "T-shirt Basique",
      "price": 15000,
      "status": "PUBLISHED",
      "description": "T-shirt de base pour personnalisation",
      "categories": [
        { "id": 1, "name": "T-shirts" }
      ]
    },
    
    "vendor": {
      "id": 456,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com",
      "vendeurType": "INDIVIDUAL",
      "fullName": "Jean Dupont",
      "status": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    
    "selectedSizes": [
      { "id": 1, "sizeName": "S" },
      { "id": 2, "sizeName": "M" },
      { "id": 3, "sizeName": "L" }
    ],
    
    "selectedColors": [
      { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
      { "id": 2, "name": "Noir", "colorCode": "#000000" }
    ],
    
    "images": {
      "total": 2,
      "colorImages": [
        {
          "id": 789,
          "vendorProductId": 123,
          "colorId": 1,
          "colorName": "Blanc",
          "colorCode": "#FFFFFF",
          "imageType": "color",
          "cloudinaryUrl": "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp",
          "cloudinaryPublicId": "vendor-products/blanc_123",
          "originalImageKey": "Blanc",
          "width": 1500,
          "height": 1500,
          "fileSize": 245760,
          "format": "webp",
          "uploadedAt": "2024-01-15T10:30:00.000Z",
          "createdAt": "2024-01-15T10:30:00.000Z",
          "updatedAt": "2024-01-15T10:30:00.000Z"
        },
        {
          "id": 790,
          "vendorProductId": 123,
          "colorId": 2,
          "colorName": "Noir",
          "colorCode": "#000000",
          "imageType": "color",
          "cloudinaryUrl": "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/noir_123.webp",
          "cloudinaryPublicId": "vendor-products/noir_123",
          "originalImageKey": "Noir",
          "width": 1500,
          "height": 1500,
          "fileSize": 198432,
          "format": "webp",
          "uploadedAt": "2024-01-15T10:30:00.000Z",
          "createdAt": "2024-01-15T10:30:00.000Z",
          "updatedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "defaultImages": [],
      "primaryImageUrl": "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp",
      "imageUrls": [
        "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp",
        "https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/noir_123.webp"
      ]
    },
    
    "metadata": {
      "profitMargin": 10000,
      "profitPercentage": 66.67,
      "totalValue": 1250000,
      "averageImageSize": 222096,
      "designQuality": "HIGH",
      "lastModified": "2024-01-15T10:30:00.000Z"
    }
  },
  "retrievedAt": "2024-01-15T10:30:00.000Z"
}
```

### **❌ ERREUR PRODUIT INTROUVABLE (404 Not Found)**
```json
{
  "statusCode": 404,
  "message": "Produit 123 introuvable"
}
```

### **🔐 ERREUR AUTHENTIFICATION (401 Unauthorized)**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### **🚫 ERREUR ACCÈS REFUSÉ (403 Forbidden)**
```json
{
  "statusCode": 403,
  "message": "Accès refusé - Vous ne pouvez voir que vos propres produits"
}
```

--- 