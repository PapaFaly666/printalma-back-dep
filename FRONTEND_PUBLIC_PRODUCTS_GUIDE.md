# 🌐 Guide Frontend - Endpoints Publics Produits Vendeurs

## 📋 Vue d'ensemble

Guide complet pour récupérer tous les produits des vendeurs avec designs incorporés, mockups, délimitations et toutes les informations nécessaires pour l'affichage frontend.

## 🎯 Endpoints Publics Disponibles

### 1. **Tous les Produits Vendeurs**

```http
GET /public/vendor-products
```

**Paramètres :**
- `limit` (optionnel) : Nombre de produits (défaut: 20, max: 100)
- `offset` (optionnel) : Pagination (défaut: 0)
- `vendorId` (optionnel) : ID du vendeur spécifique
- `status` (optionnel) : Statut (PUBLISHED, DRAFT, etc.)
- `search` (optionnel) : Recherche textuelle
- `category` (optionnel) : Catégorie de design
- `minPrice` (optionnel) : Prix minimum
- `maxPrice` (optionnel) : Prix maximum
- `bestSeller` (optionnel) : Meilleures ventes seulement

**Exemple d'utilisation :**
```javascript
// Tous les produits
const response = await fetch('/public/vendor-products?limit=20');

// Produits d'un vendeur spécifique
const response = await fetch('/public/vendor-products?vendorId=1&limit=10');

// Recherche avec filtres
const response = await fetch('/public/vendor-products?search=dragon&category=ILLUSTRATION&minPrice=10000&maxPrice=50000');
```

### 2. **Détails d'un Produit Vendeur**

```http
GET /public/vendor-products/:id
```

**Exemple d'utilisation :**
```javascript
const response = await fetch('/public/vendor-products/123');
```

### 3. **Produits d'un Vendeur Spécifique**

```http
GET /public/vendors/:vendorId/products
```

**Exemple d'utilisation :**
```javascript
const response = await fetch('/public/vendors/1/products?limit=15');
```

### 4. **Meilleures Ventes**

```http
GET /public/best-sellers
```

**Exemple d'utilisation :**
```javascript
const response = await fetch('/public/best-sellers?limit=8');
```

### 5. **Recherche Avancée**

```http
GET /public/search?q=terme
```

**Exemple d'utilisation :**
```javascript
const response = await fetch('/public/search?q=dragon&category=ILLUSTRATION&minPrice=15000');
```

## 📊 Structure des Réponses

### Réponse - Tous les Produits

```json
{
  "success": true,
  "message": "Produits vendeurs récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 1,
        "vendorName": "T-shirt Dragon Rouge Premium",
        "price": 25000,
        "status": "PUBLISHED",
        
        // 🏆 MEILLEURES VENTES
        "bestSeller": {
          "isBestSeller": true,
          "salesCount": 85,
          "totalRevenue": 2125000
        },
        
        // 🎨 STRUCTURE ADMIN CONSERVÉE
        "adminProduct": {
          "id": 4,
          "name": "T-shirt Basique",
          "description": "T-shirt en coton 100% de qualité premium",
          "price": 19000,
          "colorVariations": [
            {
              "id": 12,
              "name": "Rouge",
              "colorCode": "#ff0000",
              "images": [
                {
                  "id": 101,
                  "url": "https://res.cloudinary.com/printalma/tshirt-front-red.jpg",
                  "viewType": "FRONT",
                  "delimitations": [
                    {
                      "x": 150,
                      "y": 200,
                      "width": 200,
                      "height": 200,
                      "coordinateType": "PIXEL"
                    }
                  ]
                }
              ]
            }
          ],
          "sizes": [
            { "id": 1, "sizeName": "S" },
            { "id": 2, "sizeName": "M" },
            { "id": 3, "sizeName": "L" }
          ]
        },

        // 🎨 APPLICATION DESIGN
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/printalma/design-dragon.jpg",
          "positioning": "CENTER",
          "scale": 0.6,
          "mode": "PRESERVED"
        },

        // 🎨 INFORMATIONS DESIGN COMPLÈTES
        "design": {
          "id": 42,
          "name": "Dragon Mystique",
          "description": "Design de dragon dans un style mystique",
          "category": "ILLUSTRATION",
          "imageUrl": "https://res.cloudinary.com/printalma/design-dragon.jpg",
          "tags": ["dragon", "mystique", "fantasy"],
          "isValidated": true
        },

        // 🎨 POSITIONNEMENTS DU DESIGN
        "designPositions": [
          {
            "designId": 42,
            "position": {
              "x": 0,
              "y": 0,
              "scale": 0.6,
              "rotation": 0,
              "constraints": {
                "minScale": 0.1,
                "maxScale": 2.0
              },
              "designWidth": 500,
              "designHeight": 500
            }
          }
        ],

        // 👤 INFORMATIONS VENDEUR
        "vendor": {
          "id": 1,
          "fullName": "Jean Dupont",
          "shop_name": "Boutique Créative",
          "profile_photo_url": "https://res.cloudinary.com/printalma/profile-jean.jpg"
        },
        
        // 🖼️ IMAGES ADMIN CONSERVÉES
        "images": {
          "adminReferences": [
            {
              "colorName": "Rouge",
              "colorCode": "#ff0000",
              "adminImageUrl": "https://res.cloudinary.com/printalma/tshirt-front-red.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 1,
          "primaryImageUrl": "https://res.cloudinary.com/printalma/tshirt-front-red.jpg"
        },

        // 📏 SÉLECTIONS VENDEUR
        "selectedSizes": ["S", "M", "L", "XL"],
        "selectedColors": [
          {
            "id": 12,
            "name": "Rouge",
            "colorCode": "#ff0000"
          }
        ],
        "designId": 42
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## 🎨 Intégration Frontend - Affichage des Mockups

### Composant React pour Afficher les Produits

```javascript
import React, { useState, useEffect } from 'react';

const VendorProductsGallery = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/public/vendor-products?limit=20');
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data.products);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="products-gallery">
      {loading ? (
        <div className="loading">Chargement des produits...</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Composant Carte Produit avec Design Incorporé

```javascript
const ProductCard = ({ product }) => {
  const {
    id,
    vendorName,
    price,
    adminProduct,
    design,
    designApplication,
    designPositions,
    vendor,
    images,
    bestSeller
  } = product;

  return (
    <div className="product-card">
      {/* Badge Meilleure Vente */}
      {bestSeller.isBestSeller && (
        <div className="best-seller-badge">
          <span className="badge-icon">🏆</span>
          <span className="badge-text">Meilleure Vente</span>
        </div>
      )}

      {/* Mockup avec Design Incorporé */}
      <div className="product-mockup">
        {adminProduct.colorVariations.map((colorVariation) => (
          <div key={colorVariation.id} className="color-variation">
            <h4>{colorVariation.name}</h4>
            
            {colorVariation.images.map((image) => (
              <div key={image.id} className="mockup-container">
                {/* Image de base (mockup) */}
                <img 
                  src={image.url} 
                  alt={`${colorVariation.name} - ${image.viewType}`}
                  className="base-mockup"
                />
                
                {/* Zones de délimitation */}
                {image.delimitations.map((delimitation, index) => (
                  <div
                    key={index}
                    className="delimitation-zone"
                    style={{
                      position: 'absolute',
                      left: `${delimitation.x}px`,
                      top: `${delimitation.y}px`,
                      width: `${delimitation.width}px`,
                      height: `${delimitation.height}px`,
                      border: '2px dashed #ff6b6b',
                      backgroundColor: 'rgba(255, 107, 107, 0.1)',
                      pointerEvents: 'none'
                    }}
                  >
                    <span className="zone-label">
                      Zone {index + 1}
                    </span>
                  </div>
                ))}
                
                {/* Design incorporé */}
                {design && designApplication.hasDesign && (
                  <div
                    className="incorporated-design"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) scale(${designApplication.scale})`,
                      pointerEvents: 'none'
                    }}
                  >
                    <img 
                      src={design.imageUrl} 
                      alt={design.name}
                      className="design-image"
                      style={{
                        width: designPositions[0]?.position?.designWidth || 500,
                        height: designPositions[0]?.position?.designHeight || 500
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Informations produit */}
      <div className="product-info">
        <h3 className="product-name">{vendorName}</h3>
        
        {/* Vendeur */}
        <div className="vendor-info">
          <img 
            src={vendor.profile_photo_url} 
            alt={vendor.fullName}
            className="vendor-avatar"
          />
          <span className="vendor-name">{vendor.fullName}</span>
          <span className="shop-name">({vendor.shop_name})</span>
        </div>

        {/* Prix */}
        <div className="product-price">
          <span className="price-amount">{price.toLocaleString()} FCFA</span>
        </div>

        {/* Statistiques de vente */}
        {bestSeller.isBestSeller && (
          <div className="sales-stats">
            <div className="stat-item">
              <span className="stat-label">Ventes:</span>
              <span className="stat-value">{bestSeller.salesCount} unités</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Revenus:</span>
              <span className="stat-value">{bestSeller.totalRevenue.toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        {/* Bouton d'action */}
        <button className="view-product-btn">
          Voir le produit
        </button>
      </div>
    </div>
  );
};
```

## 🎨 CSS pour les Mockups

```css
/* Conteneur de mockup */
.mockup-container {
  position: relative;
  display: inline-block;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.base-mockup {
  width: 300px;
  height: 350px;
  object-fit: cover;
  display: block;
}

/* Design incorporé */
.incorporated-design {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.design-image {
  max-width: 60%;
  max-height: 60%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* Zones de délimitation */
.delimitation-zone {
  position: absolute;
  border: 2px dashed #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zone-label {
  background: rgba(255, 107, 107, 0.9);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

/* Carte produit */
.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  position: relative;
}

.product-card:hover {
  transform: translateY(-8px);
}

/* Badge meilleure vente */
.best-seller-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Informations produit */
.product-info {
  padding: 1.5rem;
  color: #333;
}

.product-name {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.vendor-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
}

.vendor-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.vendor-name {
  font-weight: 600;
  color: #3498db;
}

.shop-name {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.product-price {
  margin-bottom: 1rem;
}

.price-amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: #e74c3c;
}

/* Statistiques de vente */
.sales-stats {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-weight: 600;
  color: #6c757d;
}

.stat-value {
  font-weight: bold;
  color: #28a745;
}

/* Bouton d'action */
.view-product-btn {
  width: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.view-product-btn:hover {
  transform: scale(1.02);
}
```

## 🔧 Fonctions Utilitaires

```javascript
// Formatage des prix
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price);
};

// Vérification des meilleures ventes
const isBestSeller = (product) => {
  return product.bestSeller?.isBestSeller || false;
};

// Récupération de l'image principale
const getPrimaryImage = (product) => {
  return product.images?.primaryImageUrl || 
         product.adminProduct?.colorVariations?.[0]?.images?.[0]?.url ||
         '/placeholder-product.jpg';
};

// Récupération de l'image du vendeur
const getVendorImage = (vendor) => {
  return vendor.profile_photo_url || '/placeholder-avatar.jpg';
};

// Construction du nom complet du vendeur
const getVendorFullName = (vendor) => {
  return vendor.fullName || `${vendor.firstName} ${vendor.lastName}`;
};
```

## 📱 Exemple d'Utilisation Complète

```javascript
// Page d'accueil avec tous les produits
const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    bestSeller: false
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.bestSeller) params.append('bestSeller', 'true');
        
        const response = await fetch(`/public/vendor-products?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data.products);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return (
    <div className="home-page">
      {/* Filtres */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="">Toutes les catégories</option>
          <option value="ILLUSTRATION">Illustrations</option>
          <option value="TEXT">Textes</option>
          <option value="LOGO">Logos</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={filters.bestSeller}
            onChange={(e) => setFilters({...filters, bestSeller: e.target.checked})}
          />
          Meilleures ventes seulement
        </label>
      </div>

      {/* Grille de produits */}
      {loading ? (
        <div className="loading">Chargement des produits...</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              onViewProduct={(productId) => {
                window.location.href = `/product/${productId}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

**🎯 Résultat :** Le frontend dispose maintenant de tous les endpoints publics nécessaires pour afficher les produits vendeurs avec leurs designs incorporés, mockups, délimitations et toutes les informations requises ! 🏆 

## 📋 Vue d'ensemble

Guide complet pour récupérer tous les produits des vendeurs avec designs incorporés, mockups, délimitations et toutes les informations nécessaires pour l'affichage frontend.

## 🎯 Endpoints Publics Disponibles

### 1. **Tous les Produits Vendeurs**

```http
GET /public/vendor-products
```

**Paramètres :**
- `limit` (optionnel) : Nombre de produits (défaut: 20, max: 100)
- `offset` (optionnel) : Pagination (défaut: 0)
- `vendorId` (optionnel) : ID du vendeur spécifique
- `status` (optionnel) : Statut (PUBLISHED, DRAFT, etc.)
- `search` (optionnel) : Recherche textuelle
- `category` (optionnel) : Catégorie de design
- `minPrice` (optionnel) : Prix minimum
- `maxPrice` (optionnel) : Prix maximum
- `bestSeller` (optionnel) : Meilleures ventes seulement

**Exemple d'utilisation :**
```javascript
// Tous les produits
const response = await fetch('/public/vendor-products?limit=20');

// Produits d'un vendeur spécifique
const response = await fetch('/public/vendor-products?vendorId=1&limit=10');

// Recherche avec filtres
const response = await fetch('/public/vendor-products?search=dragon&category=ILLUSTRATION&minPrice=10000&maxPrice=50000');
```

### 2. **Détails d'un Produit Vendeur**

```http
GET /public/vendor-products/:id
```

**Exemple d'utilisation :**
```javascript
const response = await fetch('/public/vendor-products/123');
```

### 3. **Produits d'un Vendeur Spécifique**

```http
GET /public/vendors/:vendorId/products
```

**Exemple d'utilisation :**
```javascript
const response = await fetch('/public/vendors/1/products?limit=15');
```

### 4. **Meilleures Ventes**

```http
GET /public/best-sellers
```

**Exemple d'utilisation :**
```javascript
const response = await fetch('/public/best-sellers?limit=8');
```

### 5. **Recherche Avancée**

```http
GET /public/search?q=terme
```

**Exemple d'utilisation :**
```javascript
const response = await fetch('/public/search?q=dragon&category=ILLUSTRATION&minPrice=15000');
```

## 📊 Structure des Réponses

### Réponse - Tous les Produits

```json
{
  "success": true,
  "message": "Produits vendeurs récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 1,
        "vendorName": "T-shirt Dragon Rouge Premium",
        "price": 25000,
        "status": "PUBLISHED",
        
        // 🏆 MEILLEURES VENTES
        "bestSeller": {
          "isBestSeller": true,
          "salesCount": 85,
          "totalRevenue": 2125000
        },
        
        // 🎨 STRUCTURE ADMIN CONSERVÉE
        "adminProduct": {
          "id": 4,
          "name": "T-shirt Basique",
          "description": "T-shirt en coton 100% de qualité premium",
          "price": 19000,
          "colorVariations": [
            {
              "id": 12,
              "name": "Rouge",
              "colorCode": "#ff0000",
              "images": [
                {
                  "id": 101,
                  "url": "https://res.cloudinary.com/printalma/tshirt-front-red.jpg",
                  "viewType": "FRONT",
                  "delimitations": [
                    {
                      "x": 150,
                      "y": 200,
                      "width": 200,
                      "height": 200,
                      "coordinateType": "PIXEL"
                    }
                  ]
                }
              ]
            }
          ],
          "sizes": [
            { "id": 1, "sizeName": "S" },
            { "id": 2, "sizeName": "M" },
            { "id": 3, "sizeName": "L" }
          ]
        },

        // 🎨 APPLICATION DESIGN
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/printalma/design-dragon.jpg",
          "positioning": "CENTER",
          "scale": 0.6,
          "mode": "PRESERVED"
        },

        // 🎨 INFORMATIONS DESIGN COMPLÈTES
        "design": {
          "id": 42,
          "name": "Dragon Mystique",
          "description": "Design de dragon dans un style mystique",
          "category": "ILLUSTRATION",
          "imageUrl": "https://res.cloudinary.com/printalma/design-dragon.jpg",
          "tags": ["dragon", "mystique", "fantasy"],
          "isValidated": true
        },

        // 🎨 POSITIONNEMENTS DU DESIGN
        "designPositions": [
          {
            "designId": 42,
            "position": {
              "x": 0,
              "y": 0,
              "scale": 0.6,
              "rotation": 0,
              "constraints": {
                "minScale": 0.1,
                "maxScale": 2.0
              },
              "designWidth": 500,
              "designHeight": 500
            }
          }
        ],

        // 👤 INFORMATIONS VENDEUR
        "vendor": {
          "id": 1,
          "fullName": "Jean Dupont",
          "shop_name": "Boutique Créative",
          "profile_photo_url": "https://res.cloudinary.com/printalma/profile-jean.jpg"
        },
        
        // 🖼️ IMAGES ADMIN CONSERVÉES
        "images": {
          "adminReferences": [
            {
              "colorName": "Rouge",
              "colorCode": "#ff0000",
              "adminImageUrl": "https://res.cloudinary.com/printalma/tshirt-front-red.jpg",
              "imageType": "admin_reference"
            }
          ],
          "total": 1,
          "primaryImageUrl": "https://res.cloudinary.com/printalma/tshirt-front-red.jpg"
        },

        // 📏 SÉLECTIONS VENDEUR
        "selectedSizes": ["S", "M", "L", "XL"],
        "selectedColors": [
          {
            "id": 12,
            "name": "Rouge",
            "colorCode": "#ff0000"
          }
        ],
        "designId": 42
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

## 🎨 Intégration Frontend - Affichage des Mockups

### Composant React pour Afficher les Produits

```javascript
import React, { useState, useEffect } from 'react';

const VendorProductsGallery = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/public/vendor-products?limit=20');
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data.products);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="products-gallery">
      {loading ? (
        <div className="loading">Chargement des produits...</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Composant Carte Produit avec Design Incorporé

```javascript
const ProductCard = ({ product }) => {
  const {
    id,
    vendorName,
    price,
    adminProduct,
    design,
    designApplication,
    designPositions,
    vendor,
    images,
    bestSeller
  } = product;

  return (
    <div className="product-card">
      {/* Badge Meilleure Vente */}
      {bestSeller.isBestSeller && (
        <div className="best-seller-badge">
          <span className="badge-icon">🏆</span>
          <span className="badge-text">Meilleure Vente</span>
        </div>
      )}

      {/* Mockup avec Design Incorporé */}
      <div className="product-mockup">
        {adminProduct.colorVariations.map((colorVariation) => (
          <div key={colorVariation.id} className="color-variation">
            <h4>{colorVariation.name}</h4>
            
            {colorVariation.images.map((image) => (
              <div key={image.id} className="mockup-container">
                {/* Image de base (mockup) */}
                <img 
                  src={image.url} 
                  alt={`${colorVariation.name} - ${image.viewType}`}
                  className="base-mockup"
                />
                
                {/* Zones de délimitation */}
                {image.delimitations.map((delimitation, index) => (
                  <div
                    key={index}
                    className="delimitation-zone"
                    style={{
                      position: 'absolute',
                      left: `${delimitation.x}px`,
                      top: `${delimitation.y}px`,
                      width: `${delimitation.width}px`,
                      height: `${delimitation.height}px`,
                      border: '2px dashed #ff6b6b',
                      backgroundColor: 'rgba(255, 107, 107, 0.1)',
                      pointerEvents: 'none'
                    }}
                  >
                    <span className="zone-label">
                      Zone {index + 1}
                    </span>
                  </div>
                ))}
                
                {/* Design incorporé */}
                {design && designApplication.hasDesign && (
                  <div
                    className="incorporated-design"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) scale(${designApplication.scale})`,
                      pointerEvents: 'none'
                    }}
                  >
                    <img 
                      src={design.imageUrl} 
                      alt={design.name}
                      className="design-image"
                      style={{
                        width: designPositions[0]?.position?.designWidth || 500,
                        height: designPositions[0]?.position?.designHeight || 500
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Informations produit */}
      <div className="product-info">
        <h3 className="product-name">{vendorName}</h3>
        
        {/* Vendeur */}
        <div className="vendor-info">
          <img 
            src={vendor.profile_photo_url} 
            alt={vendor.fullName}
            className="vendor-avatar"
          />
          <span className="vendor-name">{vendor.fullName}</span>
          <span className="shop-name">({vendor.shop_name})</span>
        </div>

        {/* Prix */}
        <div className="product-price">
          <span className="price-amount">{price.toLocaleString()} FCFA</span>
        </div>

        {/* Statistiques de vente */}
        {bestSeller.isBestSeller && (
          <div className="sales-stats">
            <div className="stat-item">
              <span className="stat-label">Ventes:</span>
              <span className="stat-value">{bestSeller.salesCount} unités</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Revenus:</span>
              <span className="stat-value">{bestSeller.totalRevenue.toLocaleString()} FCFA</span>
            </div>
          </div>
        )}

        {/* Bouton d'action */}
        <button className="view-product-btn">
          Voir le produit
        </button>
      </div>
    </div>
  );
};
```

## 🎨 CSS pour les Mockups

```css
/* Conteneur de mockup */
.mockup-container {
  position: relative;
  display: inline-block;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.base-mockup {
  width: 300px;
  height: 350px;
  object-fit: cover;
  display: block;
}

/* Design incorporé */
.incorporated-design {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.design-image {
  max-width: 60%;
  max-height: 60%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* Zones de délimitation */
.delimitation-zone {
  position: absolute;
  border: 2px dashed #ff6b6b;
  background-color: rgba(255, 107, 107, 0.1);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.zone-label {
  background: rgba(255, 107, 107, 0.9);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

/* Carte produit */
.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  position: relative;
}

.product-card:hover {
  transform: translateY(-8px);
}

/* Badge meilleure vente */
.best-seller-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: linear-gradient(45deg, #ff6b6b, #ff8e53);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Informations produit */
.product-info {
  padding: 1.5rem;
  color: #333;
}

.product-name {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.vendor-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 1rem;
}

.vendor-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.vendor-name {
  font-weight: 600;
  color: #3498db;
}

.shop-name {
  color: #7f8c8d;
  font-size: 0.9rem;
}

.product-price {
  margin-bottom: 1rem;
}

.price-amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: #e74c3c;
}

/* Statistiques de vente */
.sales-stats {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-weight: 600;
  color: #6c757d;
}

.stat-value {
  font-weight: bold;
  color: #28a745;
}

/* Bouton d'action */
.view-product-btn {
  width: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.view-product-btn:hover {
  transform: scale(1.02);
}
```

## 🔧 Fonctions Utilitaires

```javascript
// Formatage des prix
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price);
};

// Vérification des meilleures ventes
const isBestSeller = (product) => {
  return product.bestSeller?.isBestSeller || false;
};

// Récupération de l'image principale
const getPrimaryImage = (product) => {
  return product.images?.primaryImageUrl || 
         product.adminProduct?.colorVariations?.[0]?.images?.[0]?.url ||
         '/placeholder-product.jpg';
};

// Récupération de l'image du vendeur
const getVendorImage = (vendor) => {
  return vendor.profile_photo_url || '/placeholder-avatar.jpg';
};

// Construction du nom complet du vendeur
const getVendorFullName = (vendor) => {
  return vendor.fullName || `${vendor.firstName} ${vendor.lastName}`;
};
```

## 📱 Exemple d'Utilisation Complète

```javascript
// Page d'accueil avec tous les produits
const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    bestSeller: false
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.category) params.append('category', filters.category);
        if (filters.minPrice) params.append('minPrice', filters.minPrice);
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
        if (filters.bestSeller) params.append('bestSeller', 'true');
        
        const response = await fetch(`/public/vendor-products?${params.toString()}`);
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.data.products);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return (
    <div className="home-page">
      {/* Filtres */}
      <div className="filters-section">
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
        >
          <option value="">Toutes les catégories</option>
          <option value="ILLUSTRATION">Illustrations</option>
          <option value="TEXT">Textes</option>
          <option value="LOGO">Logos</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={filters.bestSeller}
            onChange={(e) => setFilters({...filters, bestSeller: e.target.checked})}
          />
          Meilleures ventes seulement
        </label>
      </div>

      {/* Grille de produits */}
      {loading ? (
        <div className="loading">Chargement des produits...</div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product}
              onViewProduct={(productId) => {
                window.location.href = `/product/${productId}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

**🎯 Résultat :** Le frontend dispose maintenant de tous les endpoints publics nécessaires pour afficher les produits vendeurs avec leurs designs incorporés, mockups, délimitations et toutes les informations requises ! 🏆 