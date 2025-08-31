# 🔍 Guide Endpoint Détail Produit Vendeur

## 📋 Vue d'ensemble

Guide complet pour l'endpoint de détail qui récupère les informations complètes d'un produit vendeur spécifique avec design incorporé, mockups, délimitations et vraies positions.

## 🎯 Endpoint de Détail

### **URL de Base**
```http
GET /public/vendor-products/:id
```

### **Paramètres**
- `id` (requis) : ID du produit vendeur

### **Exemple d'utilisation**
```javascript
// Récupérer les détails d'un produit spécifique
const productId = 52;
const response = await fetch(`/public/vendor-products/${productId}`);
const data = await response.json();

if (data.success) {
  console.log('Détails produit:', data.data);
}
```

## 📊 Structure de Réponse

### **Réponse Succès (200)**
```json
{
  "success": true,
  "message": "Détails produit récupérés avec succès",
  "data": {
    "id": 52,
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

    // 🎨 POSITIONNEMENTS DU DESIGN (VRAIES VALEURS)
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
}
```

### **Réponse Erreur (404)**
```json
{
  "success": false,
  "message": "Produit 999 introuvable ou non publié",
  "statusCode": 404
}
```

## 📱 Intégration Frontend

### **Composant React pour Détails Produit**

```javascript
import React, { useState, useEffect } from 'react';

const ProductDetailPage = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/public/vendor-products/${productId}`);
        const data = await response.json();
        
        if (data.success) {
          setProduct(data.data);
        } else {
          setError(data.message);
        }
      } catch (error) {
        setError('Erreur lors du chargement du produit');
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [productId]);

  if (loading) {
    return <div className="loading">Chargement des détails...</div>;
  }

  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  if (!product) {
    return <div className="not-found">Produit non trouvé</div>;
  }

  return (
    <div className="product-detail-page">
      <ProductDetailCard product={product} />
    </div>
  );
};
```

### **Composant Carte Détail avec Design Incorporé**

```javascript
const ProductDetailCard = ({ product }) => {
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
    bestSeller,
    selectedSizes,
    selectedColors
  } = product;

  return (
    <div className="product-detail-card">
      {/* Header avec badge meilleure vente */}
      <div className="product-header">
        <h1 className="product-title">{vendorName}</h1>
        {bestSeller.isBestSeller && (
          <div className="best-seller-badge">
            <span className="badge-icon">🏆</span>
            <span className="badge-text">Meilleure Vente</span>
          </div>
        )}
      </div>

      {/* Section Mockups avec Design */}
      <div className="product-mockups">
        <h2>Mockups avec Design Incorporé</h2>
        
        {adminProduct.colorVariations.map((colorVariation) => (
          <div key={colorVariation.id} className="color-variation-section">
            <h3>{colorVariation.name}</h3>
            
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
                
                {/* Design incorporé avec vraies positions */}
                {design && designApplication.hasDesign && designPositions.length > 0 && (
                  designPositions.map((designPos) => (
                    <div
                      key={designPos.designId}
                      className="incorporated-design"
                      style={{
                        position: 'absolute',
                        left: `${designPos.position.x}px`,
                        top: `${designPos.position.y}px`,
                        transform: `scale(${designPos.position.scale}) rotate(${designPos.position.rotation}deg)`,
                        pointerEvents: 'none'
                      }}
                    >
                      <img 
                        src={design.imageUrl} 
                        alt={design.name}
                        className="design-image"
                        style={{
                          width: `${designPos.position.designWidth}px`,
                          height: `${designPos.position.designHeight}px`
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Informations produit */}
      <div className="product-info">
        <div className="vendor-info">
          <img 
            src={vendor.profile_photo_url} 
            alt={vendor.fullName}
            className="vendor-avatar"
          />
          <div className="vendor-details">
            <h3 className="vendor-name">{vendor.fullName}</h3>
            <p className="shop-name">{vendor.shop_name}</p>
          </div>
        </div>

        <div className="product-price">
          <span className="price-amount">{price.toLocaleString()} FCFA</span>
        </div>

        {/* Tailles et couleurs sélectionnées */}
        <div className="product-options">
          <div className="sizes-section">
            <h4>Tailles disponibles:</h4>
            <div className="sizes-list">
              {selectedSizes.map((size) => (
                <span key={size} className="size-tag">{size}</span>
              ))}
            </div>
          </div>

          <div className="colors-section">
            <h4>Couleurs disponibles:</h4>
            <div className="colors-list">
              {selectedColors.map((color) => (
                <div key={color.id} className="color-item">
                  <div 
                    className="color-swatch" 
                    style={{ backgroundColor: color.colorCode }}
                  ></div>
                  <span className="color-name">{color.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Statistiques de vente */}
        {bestSeller.isBestSeller && (
          <div className="sales-stats">
            <h4>Statistiques de vente</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Ventes:</span>
                <span className="stat-value">{bestSeller.salesCount} unités</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Revenus:</span>
                <span className="stat-value">{bestSeller.totalRevenue.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="product-actions">
          <button className="add-to-cart-btn">
            Ajouter au panier
          </button>
          <button className="contact-vendor-btn">
            Contacter le vendeur
          </button>
        </div>
      </div>
    </div>
  );
};
```

## 🎨 CSS pour la Page de Détail

```css
/* Page de détail */
.product-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.product-detail-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Header */
.product-header {
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
}

.product-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0;
}

.best-seller-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Section Mockups */
.product-mockups {
  padding: 2rem;
}

.color-variation-section {
  margin-bottom: 2rem;
}

.color-variation-section h3 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.mockup-container {
  position: relative;
  display: inline-block;
  margin: 1rem;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.base-mockup {
  width: 400px;
  height: 500px;
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
  pointer-events: none;
}

.design-image {
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* Informations produit */
.product-info {
  padding: 2rem;
  background: #f8f9fa;
}

.vendor-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
}

.vendor-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.vendor-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #3498db;
  margin: 0;
}

.shop-name {
  color: #7f8c8d;
  margin: 0;
}

.product-price {
  margin-bottom: 2rem;
}

.price-amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #e74c3c;
}

/* Options produit */
.product-options {
  margin-bottom: 2rem;
}

.sizes-list, .colors-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

.size-tag {
  background: #3498db;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ddd;
}

/* Statistiques */
.sales-stats {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.stat-label {
  font-weight: 600;
  color: #6c757d;
}

.stat-value {
  font-weight: bold;
  color: #28a745;
}

/* Actions */
.product-actions {
  display: flex;
  gap: 1rem;
}

.add-to-cart-btn, .contact-vendor-btn {
  flex: 1;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.add-to-cart-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.contact-vendor-btn {
  background: white;
  color: #3498db;
  border: 2px solid #3498db;
}

.add-to-cart-btn:hover, .contact-vendor-btn:hover {
  transform: scale(1.02);
}
```

## 🔧 Fonctions Utilitaires

```javascript
// Récupération des détails produit
const fetchProductDetail = async (productId) => {
  try {
    const response = await fetch(`/public/vendor-products/${productId}`);
    const data = await response.json();
    
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Erreur récupération détails:', error);
    throw error;
  }
};

// Application des vraies positions
const applyDesignPosition = (designPos) => {
  const { position } = designPos;
  
  return {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `scale(${position.scale}) rotate(${position.rotation}deg)`,
    width: `${position.designWidth}px`,
    height: `${position.designHeight}px`
  };
};

// Vérification des contraintes
const validateDesignConstraints = (position, constraints) => {
  const { minScale, maxScale } = constraints;
  
  return {
    ...position,
    scale: Math.max(minScale, Math.min(maxScale, position.scale))
  };
};

// Formatage des prix
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price);
};
```

## 📱 Exemple d'Utilisation Complète

```javascript
// Page de détail produit
const ProductDetailPage = () => {
  const { id } = useParams(); // React Router
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await fetchProductDetail(id);
        setProduct(productData);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!product) {
    return <NotFound />;
  }

  return (
    <div className="product-detail-page">
      <ProductDetailCard product={product} />
    </div>
  );
};
```

## 🚀 Avantages de l'Endpoint de Détail

1. **Données Complètes** : Toutes les informations nécessaires en une seule requête
2. **Vraies Positions** : Design incorporé avec positions exactes
3. **Mockups Multiples** : Toutes les variations de couleur
4. **Délimitations** : Zones d'application du design
5. **Statistiques** : Informations de vente et revenus
6. **Informations Vendeur** : Profil et boutique
7. **Performance** : Requête optimisée avec toutes les relations

---

**🎯 Résultat :** L'endpoint de détail fournit toutes les informations nécessaires pour afficher un produit vendeur avec son design incorporé exactement comme défini ! 🏆 