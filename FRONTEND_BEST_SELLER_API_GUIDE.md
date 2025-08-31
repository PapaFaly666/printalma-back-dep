# 🏆 Guide Frontend - API Meilleures Ventes

## 📋 Vue d'ensemble

Guide complet pour intégrer les fonctionnalités de meilleures ventes dans le frontend, avec tous les endpoints, requêtes et réponses nécessaires.

## 🌐 Endpoints API

### 1. **Meilleures Ventes Globales (Public)**

```http
GET /vendor/products/best-sellers
```

**Paramètres :**
- `vendorId` (optionnel) : ID du vendeur spécifique
- `limit` (optionnel) : Nombre de produits (défaut: 10)

**Exemple d'utilisation :**
```javascript
// Toutes les meilleures ventes
const response = await fetch('/vendor/products/best-sellers?limit=12');

// Meilleures ventes d'un vendeur
const response = await fetch('/vendor/products/best-sellers?vendorId=1&limit=6');
```

### 2. **Mes Meilleures Ventes (Vendeur Connecté)**

```http
GET /vendor/products/my-best-sellers
```

**Headers requis :**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 3. **Produits Vendeur avec Meilleures Ventes**

```http
GET /vendor/products
```

**Headers requis :**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 📊 Structure des Réponses

### Réponse - Meilleures Ventes Globales

```json
{
  "success": true,
  "data": {
    "bestSellers": [
      {
        "id": 1,
        "name": "T-shirt Design Dragon Rouge",
        "price": 25000,
        "salesCount": 85,
        "totalRevenue": 2125000,
        "vendor": {
          "id": 1,
          "fullName": "Jean Dupont",
          "shop_name": "Boutique Créative",
          "profile_photo_url": "https://res.cloudinary.com/..."
        },
        "design": {
          "id": 42,
          "name": "Dragon Mystique",
          "imageUrl": "https://res.cloudinary.com/...",
          "category": "ILLUSTRATION"
        },
        "primaryImageUrl": "https://res.cloudinary.com/..."
      }
    ],
    "total": 3
  }
}
```

### Réponse - Produits Vendeur avec Meilleures Ventes

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "vendorName": "T-shirt Design Dragon Rouge",
        "price": 25000,
        "status": "PUBLISHED",
        
        // 🏆 INFORMATIONS MEILLEURES VENTES
        "bestSeller": {
          "isBestSeller": true,
          "salesCount": 85,
          "totalRevenue": 2125000
        },
        
        // 🎨 STRUCTURE ADMIN CONSERVÉE
        "adminProduct": {
          "id": 4,
          "name": "T-shirt Basique",
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
              "x": -44,
              "y": -68,
              "scale": 0.44,
              "rotation": 15,
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
      "total": 15,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## 🎨 Intégration Frontend - Landing Page

### Composant React pour Meilleures Ventes

```javascript
import React, { useState, useEffect } from 'react';

const BestSellersSection = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch('/vendor/products/best-sellers?limit=8');
        const data = await response.json();
        
        if (data.success) {
          setBestSellers(data.data.bestSellers);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <section className="best-sellers-section">
      <div className="container">
        <h2 className="section-title">🏆 Meilleures Ventes</h2>
        <p className="section-subtitle">Découvrez nos produits les plus populaires</p>
        
        <div className="best-sellers-grid">
          {bestSellers.map((product) => (
            <BestSellerCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
```

### Composant Carte Produit avec Badge

```javascript
const BestSellerCard = ({ product }) => {
  const {
    id,
    name,
    price,
    salesCount,
    totalRevenue,
    vendor,
    design,
    primaryImageUrl,
    bestSeller
  } = product;

  return (
    <div className="product-card best-seller-card">
      {/* Badge Meilleure Vente */}
      {bestSeller.isBestSeller && (
        <div className="best-seller-badge">
          <span className="badge-icon">🏆</span>
          <span className="badge-text">Meilleure Vente</span>
        </div>
      )}

      {/* Image du produit */}
      <div className="product-image">
        <img 
          src={primaryImageUrl || design?.imageUrl} 
          alt={name}
          className="product-img"
        />
        
        {/* Design appliqué */}
        {design && (
          <div className="design-overlay">
            <img 
              src={design.imageUrl} 
              alt={design.name}
              className="design-img"
              style={{
                transform: `scale(${product.designApplication?.scale || 0.6})`
              }}
            />
          </div>
        )}
      </div>

      {/* Informations produit */}
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        
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
              <span className="stat-value">{salesCount} unités</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Revenus:</span>
              <span className="stat-value">{totalRevenue.toLocaleString()} FCFA</span>
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

## 🎨 CSS pour les Styles

```css
/* Section Meilleures Ventes */
.best-sellers-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.section-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.2rem;
  text-align: center;
  opacity: 0.9;
  margin-bottom: 3rem;
}

.best-sellers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Carte Produit */
.best-seller-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  position: relative;
}

.best-seller-card:hover {
  transform: translateY(-8px);
}

/* Badge Meilleure Vente */
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

.badge-icon {
  font-size: 1rem;
}

/* Image du produit */
.product-image {
  position: relative;
  height: 250px;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.design-overlay {
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

.design-img {
  max-width: 60%;
  max-height: 60%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
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

/* Responsive */
@media (max-width: 768px) {
  .best-sellers-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
}
```

## 🎯 Utilisation des Délimitations

### Affichage des Zones de Design

```javascript
const DesignPreview = ({ product }) => {
  const { adminProduct, designApplication, design } = product;

  return (
    <div className="design-preview">
      {adminProduct.colorVariations.map((colorVariation) => (
        <div key={colorVariation.id} className="color-variation">
          <h4>{colorVariation.name}</h4>
          
          {colorVariation.images.map((image) => (
            <div key={image.id} className="image-container">
              <img 
                src={image.url} 
                alt={`${colorVariation.name} - ${image.viewType}`}
                className="base-image"
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
              
              {/* Design appliqué */}
              {design && designApplication.hasDesign && (
                <div
                  className="applied-design"
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
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
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

// Gestion des images
const getProductImage = (product) => {
  return product.primaryImageUrl || 
         product.design?.imageUrl || 
         product.images?.adminReferences?.[0]?.adminImageUrl ||
         '/placeholder-product.jpg';
};

const getVendorImage = (vendor) => {
  return vendor.profile_photo_url || '/placeholder-avatar.jpg';
};
```

## 📱 Exemple d'Utilisation Complète

```javascript
// Landing Page avec Meilleures Ventes
const LandingPage = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch('/vendor/products/best-sellers?limit=8');
        const data = await response.json();
        
        if (data.success) {
          setBestSellers(data.data.bestSellers);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1>Découvrez nos Meilleures Ventes</h1>
          <p>Produits populaires sélectionnés par nos vendeurs</p>
        </div>
      </section>

      {/* Meilleures Ventes Section */}
      <section className="best-sellers-section">
        <div className="container">
          <h2 className="section-title">🏆 Meilleures Ventes</h2>
          <p className="section-subtitle">
            Les produits les plus populaires de notre communauté
          </p>
          
          {loading ? (
            <div className="loading">Chargement des meilleures ventes...</div>
          ) : (
            <div className="best-sellers-grid">
              {bestSellers.map((product) => (
                <BestSellerCard 
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
      </section>
    </div>
  );
};
```

---

**🎯 Résultat :** Le frontend dispose maintenant de tous les outils nécessaires pour afficher les meilleures ventes avec leurs badges, statistiques, designs et délimitations sur la landing page ! 🏆 

## 📋 Vue d'ensemble

Guide complet pour intégrer les fonctionnalités de meilleures ventes dans le frontend, avec tous les endpoints, requêtes et réponses nécessaires.

## 🌐 Endpoints API

### 1. **Meilleures Ventes Globales (Public)**

```http
GET /vendor/products/best-sellers
```

**Paramètres :**
- `vendorId` (optionnel) : ID du vendeur spécifique
- `limit` (optionnel) : Nombre de produits (défaut: 10)

**Exemple d'utilisation :**
```javascript
// Toutes les meilleures ventes
const response = await fetch('/vendor/products/best-sellers?limit=12');

// Meilleures ventes d'un vendeur
const response = await fetch('/vendor/products/best-sellers?vendorId=1&limit=6');
```

### 2. **Mes Meilleures Ventes (Vendeur Connecté)**

```http
GET /vendor/products/my-best-sellers
```

**Headers requis :**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 3. **Produits Vendeur avec Meilleures Ventes**

```http
GET /vendor/products
```

**Headers requis :**
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

## 📊 Structure des Réponses

### Réponse - Meilleures Ventes Globales

```json
{
  "success": true,
  "data": {
    "bestSellers": [
      {
        "id": 1,
        "name": "T-shirt Design Dragon Rouge",
        "price": 25000,
        "salesCount": 85,
        "totalRevenue": 2125000,
        "vendor": {
          "id": 1,
          "fullName": "Jean Dupont",
          "shop_name": "Boutique Créative",
          "profile_photo_url": "https://res.cloudinary.com/..."
        },
        "design": {
          "id": 42,
          "name": "Dragon Mystique",
          "imageUrl": "https://res.cloudinary.com/...",
          "category": "ILLUSTRATION"
        },
        "primaryImageUrl": "https://res.cloudinary.com/..."
      }
    ],
    "total": 3
  }
}
```

### Réponse - Produits Vendeur avec Meilleures Ventes

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 1,
        "vendorName": "T-shirt Design Dragon Rouge",
        "price": 25000,
        "status": "PUBLISHED",
        
        // 🏆 INFORMATIONS MEILLEURES VENTES
        "bestSeller": {
          "isBestSeller": true,
          "salesCount": 85,
          "totalRevenue": 2125000
        },
        
        // 🎨 STRUCTURE ADMIN CONSERVÉE
        "adminProduct": {
          "id": 4,
          "name": "T-shirt Basique",
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
              "x": -44,
              "y": -68,
              "scale": 0.44,
              "rotation": 15,
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
      "total": 15,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## 🎨 Intégration Frontend - Landing Page

### Composant React pour Meilleures Ventes

```javascript
import React, { useState, useEffect } from 'react';

const BestSellersSection = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch('/vendor/products/best-sellers?limit=8');
        const data = await response.json();
        
        if (data.success) {
          setBestSellers(data.data.bestSellers);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <section className="best-sellers-section">
      <div className="container">
        <h2 className="section-title">🏆 Meilleures Ventes</h2>
        <p className="section-subtitle">Découvrez nos produits les plus populaires</p>
        
        <div className="best-sellers-grid">
          {bestSellers.map((product) => (
            <BestSellerCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};
```

### Composant Carte Produit avec Badge

```javascript
const BestSellerCard = ({ product }) => {
  const {
    id,
    name,
    price,
    salesCount,
    totalRevenue,
    vendor,
    design,
    primaryImageUrl,
    bestSeller
  } = product;

  return (
    <div className="product-card best-seller-card">
      {/* Badge Meilleure Vente */}
      {bestSeller.isBestSeller && (
        <div className="best-seller-badge">
          <span className="badge-icon">🏆</span>
          <span className="badge-text">Meilleure Vente</span>
        </div>
      )}

      {/* Image du produit */}
      <div className="product-image">
        <img 
          src={primaryImageUrl || design?.imageUrl} 
          alt={name}
          className="product-img"
        />
        
        {/* Design appliqué */}
        {design && (
          <div className="design-overlay">
            <img 
              src={design.imageUrl} 
              alt={design.name}
              className="design-img"
              style={{
                transform: `scale(${product.designApplication?.scale || 0.6})`
              }}
            />
          </div>
        )}
      </div>

      {/* Informations produit */}
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        
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
              <span className="stat-value">{salesCount} unités</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Revenus:</span>
              <span className="stat-value">{totalRevenue.toLocaleString()} FCFA</span>
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

## 🎨 CSS pour les Styles

```css
/* Section Meilleures Ventes */
.best-sellers-section {
  padding: 4rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.section-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.2rem;
  text-align: center;
  opacity: 0.9;
  margin-bottom: 3rem;
}

.best-sellers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Carte Produit */
.best-seller-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
  position: relative;
}

.best-seller-card:hover {
  transform: translateY(-8px);
}

/* Badge Meilleure Vente */
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

.badge-icon {
  font-size: 1rem;
}

/* Image du produit */
.product-image {
  position: relative;
  height: 250px;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.design-overlay {
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

.design-img {
  max-width: 60%;
  max-height: 60%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
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

/* Responsive */
@media (max-width: 768px) {
  .best-sellers-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
}
```

## 🎯 Utilisation des Délimitations

### Affichage des Zones de Design

```javascript
const DesignPreview = ({ product }) => {
  const { adminProduct, designApplication, design } = product;

  return (
    <div className="design-preview">
      {adminProduct.colorVariations.map((colorVariation) => (
        <div key={colorVariation.id} className="color-variation">
          <h4>{colorVariation.name}</h4>
          
          {colorVariation.images.map((image) => (
            <div key={image.id} className="image-container">
              <img 
                src={image.url} 
                alt={`${colorVariation.name} - ${image.viewType}`}
                className="base-image"
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
              
              {/* Design appliqué */}
              {design && designApplication.hasDesign && (
                <div
                  className="applied-design"
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
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
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

// Gestion des images
const getProductImage = (product) => {
  return product.primaryImageUrl || 
         product.design?.imageUrl || 
         product.images?.adminReferences?.[0]?.adminImageUrl ||
         '/placeholder-product.jpg';
};

const getVendorImage = (vendor) => {
  return vendor.profile_photo_url || '/placeholder-avatar.jpg';
};
```

## 📱 Exemple d'Utilisation Complète

```javascript
// Landing Page avec Meilleures Ventes
const LandingPage = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await fetch('/vendor/products/best-sellers?limit=8');
        const data = await response.json();
        
        if (data.success) {
          setBestSellers(data.data.bestSellers);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellers();
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <h1>Découvrez nos Meilleures Ventes</h1>
          <p>Produits populaires sélectionnés par nos vendeurs</p>
        </div>
      </section>

      {/* Meilleures Ventes Section */}
      <section className="best-sellers-section">
        <div className="container">
          <h2 className="section-title">🏆 Meilleures Ventes</h2>
          <p className="section-subtitle">
            Les produits les plus populaires de notre communauté
          </p>
          
          {loading ? (
            <div className="loading">Chargement des meilleures ventes...</div>
          ) : (
            <div className="best-sellers-grid">
              {bestSellers.map((product) => (
                <BestSellerCard 
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
      </section>
    </div>
  );
};
```

---

**🎯 Résultat :** Le frontend dispose maintenant de tous les outils nécessaires pour afficher les meilleures ventes avec leurs badges, statistiques, designs et délimitations sur la landing page ! 🏆 