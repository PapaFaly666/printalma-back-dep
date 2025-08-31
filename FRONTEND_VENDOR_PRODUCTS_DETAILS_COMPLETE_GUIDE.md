# 🔍 GUIDE COMPLET - Détails Produits Vendeur Frontend

## 🎯 NOUVEAU ENDPOINT DISPONIBLE

### **GET /vendor/products/:id**
- ✅ **Fonctionnel** depuis maintenant
- 🔐 **Authentification JWT** requise
- 📊 **Toutes les informations** détaillées
- 🖼️ **Images haute qualité** avec métadonnées
- 💰 **Calculs financiers** automatiques

---

## 📋 INFORMATIONS DISPONIBLES

### **1. Données Produit Complètes**
```javascript
{
  id: 123,
  vendorName: "T-shirt Design Flamme",
  vendorDescription: "Description complète...",
  price: 25000,                    // Prix en centimes
  vendorStock: 50,
  status: "PUBLISHED",
  createdAt: "2024-01-15T10:30:00.000Z",
  updatedAt: "2024-01-15T10:30:00.000Z"
}
```

### **2. Informations Vendeur**
```javascript
{
  vendor: {
    id: 456,
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@example.com",
    vendeurType: "INDIVIDUAL",
    fullName: "Jean Dupont",
    status: true,
    createdAt: "2024-01-01T00:00:00.000Z"
  }
}
```

### **3. Produit de Base**
```javascript
{
  baseProduct: {
    id: 1,
    name: "T-shirt Basique",
    price: 15000,
    status: "PUBLISHED",
    description: "T-shirt de base pour personnalisation",
    categories: [
      { id: 1, name: "T-shirts" }
    ]
  }
}
```

### **4. Images Détaillées**
```javascript
{
  images: {
    total: 2,
    colorImages: [
      {
        id: 789,
        colorName: "Blanc",
        colorCode: "#FFFFFF",
        cloudinaryUrl: "https://res.cloudinary.com/printalma/...",
        width: 1500,
        height: 1500,
        fileSize: 245760,
        format: "webp"
      }
    ],
    primaryImageUrl: "https://...",
    imageUrls: ["https://...", "https://..."]
  }
}
```

### **5. Tailles et Couleurs**
```javascript
{
  selectedSizes: [
    { id: 1, sizeName: "S" },
    { id: 2, sizeName: "M" },
    { id: 3, sizeName: "L" }
  ],
  selectedColors: [
    { id: 1, name: "Blanc", colorCode: "#FFFFFF" },
    { id: 2, name: "Noir", colorCode: "#000000" }
  ]
}
```

### **6. Métadonnées Financières**
```javascript
{
  metadata: {
    profitMargin: 10000,           // Marge en centimes
    profitPercentage: 66.67,       // Pourcentage de marge
    totalValue: 1250000,           // Valeur totale du stock
    averageImageSize: 222096,      // Taille moyenne des images
    designQuality: "HIGH",         // Qualité du design
    lastModified: "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🚀 IMPLÉMENTATION FRONTEND

### **1. Service API**
```javascript
// services/vendorProductService.js
class VendorProductService {
  constructor(baseURL = 'http://localhost:3004', token = null) {
    this.baseURL = baseURL;
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  async getProductDetails(productId) {
    const response = await fetch(`${this.baseURL}/vendor/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Produit introuvable');
      } else if (response.status === 403) {
        throw new Error('Accès refusé');
      } else if (response.status === 401) {
        throw new Error('Non authentifié');
      }
      throw new Error('Erreur serveur');
    }

    return response.json();
  }

  async getAllProducts(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.status) params.append('status', options.status);
    if (options.search) params.append('search', options.search);

    const response = await fetch(`${this.baseURL}/vendor/products?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }
}

export default VendorProductService;
```

### **2. Hook React**
```javascript
// hooks/useVendorProduct.js
import { useState, useEffect } from 'react';
import VendorProductService from '../services/vendorProductService';

export const useVendorProduct = (productId, token) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const service = new VendorProductService('http://localhost:3004', token);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await service.getProductDetails(productId);
        setProduct(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, token]);

  const refreshProduct = async () => {
    if (!productId || !token) return;
    
    try {
      setLoading(true);
      const result = await service.getProductDetails(productId);
      setProduct(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    product,
    loading,
    error,
    refreshProduct
  };
};
```

### **3. Composant Liste avec Détails**
```javascript
// components/VendorProductsList.jsx
import React, { useState } from 'react';
import { useVendorProduct } from '../hooks/useVendorProduct';
import ProductDetailsModal from './ProductDetailsModal';

const VendorProductsList = ({ products, token }) => {
  const [selectedProductId, setSelectedProductId] = useState(null);

  const openDetails = (productId) => {
    setSelectedProductId(productId);
  };

  const closeDetails = () => {
    setSelectedProductId(null);
  };

  return (
    <div className="products-list">
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <img 
              src={product.images?.primaryImageUrl || product.designUrl} 
              alt={product.vendorName}
              className="product-image"
            />
            <div className="product-info">
              <h3>{product.vendorName}</h3>
              <p className="price">{product.price / 100} €</p>
              <p className="stock">Stock: {product.vendorStock}</p>
              <span className={`status ${product.status.toLowerCase()}`}>
                {product.status}
              </span>
            </div>
            <div className="product-actions">
              <button 
                onClick={() => openDetails(product.id)}
                className="btn-details"
              >
                🔍 Voir Détails
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProductId && (
        <ProductDetailsModal
          productId={selectedProductId}
          token={token}
          onClose={closeDetails}
        />
      )}
    </div>
  );
};

export default VendorProductsList;
```

### **4. Composant Détails Complet**
```javascript
// components/ProductDetailsModal.jsx
import React from 'react';
import { useVendorProduct } from '../hooks/useVendorProduct';
import './ProductDetailsModal.css';

const ProductDetailsModal = ({ productId, token, onClose }) => {
  const { product, loading, error } = useVendorProduct(productId, token);

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content loading">
          <div className="spinner"></div>
          <p>Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content error">
          <h2>❌ Erreur</h2>
          <p>{error}</p>
          <button onClick={onClose} className="btn-close">Fermer</button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product.vendorName}</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>

        <div className="modal-body">
          {/* Section Images */}
          <div className="section images-section">
            <h3>🖼️ Images ({product.images.total})</h3>
            <div className="images-grid">
              {product.images.colorImages.map(img => (
                <div key={img.id} className="image-item">
                  <img src={img.cloudinaryUrl} alt={img.colorName} />
                  <div className="image-info">
                    <span className="color-name">{img.colorName}</span>
                    <span className="image-size">
                      {Math.round(img.fileSize / 1024)} KB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Financière */}
          <div className="section financial-section">
            <h3>💰 Informations Financières</h3>
            <div className="financial-grid">
              <div className="financial-item">
                <label>Prix de vente:</label>
                <span className="price">{product.price / 100} €</span>
              </div>
              <div className="financial-item">
                <label>Prix de base:</label>
                <span>{product.basePriceAdmin / 100} €</span>
              </div>
              <div className="financial-item">
                <label>Marge:</label>
                <span className="profit">
                  {product.metadata.profitMargin / 100} € 
                  ({product.metadata.profitPercentage}%)
                </span>
              </div>
              <div className="financial-item">
                <label>Valeur totale:</label>
                <span className="total-value">
                  {product.metadata.totalValue / 100} €
                </span>
              </div>
            </div>
          </div>

          {/* Section Stock */}
          <div className="section stock-section">
            <h3>📦 Stock et Disponibilité</h3>
            <div className="stock-info">
              <div className="stock-item">
                <label>Stock:</label>
                <span className="stock-quantity">{product.vendorStock} unités</span>
              </div>
              <div className="stock-item">
                <label>Statut:</label>
                <span className={`status ${product.status.toLowerCase()}`}>
                  {product.status}
                </span>
              </div>
            </div>
          </div>

          {/* Section Variantes */}
          <div className="section variants-section">
            <h3>🎨 Variantes Disponibles</h3>
            <div className="variants-info">
              <div className="variant-group">
                <label>Tailles:</label>
                <div className="sizes">
                  {product.selectedSizes.map(size => (
                    <span key={size.id} className="size-badge">
                      {size.sizeName}
                    </span>
                  ))}
                </div>
              </div>
              <div className="variant-group">
                <label>Couleurs:</label>
                <div className="colors">
                  {product.selectedColors.map(color => (
                    <span 
                      key={color.id} 
                      className="color-badge"
                      style={{ backgroundColor: color.colorCode }}
                      title={color.name}
                    >
                      {color.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section Métadonnées */}
          <div className="section metadata-section">
            <h3>📊 Métadonnées</h3>
            <div className="metadata-grid">
              <div className="metadata-item">
                <label>Qualité design:</label>
                <span className={`quality ${product.metadata.designQuality.toLowerCase()}`}>
                  {product.metadata.designQuality}
                </span>
              </div>
              <div className="metadata-item">
                <label>Taille moyenne images:</label>
                <span>{Math.round(product.metadata.averageImageSize / 1024)} KB</span>
              </div>
              <div className="metadata-item">
                <label>Dernière modification:</label>
                <span>{new Date(product.metadata.lastModified).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Section Vendeur */}
          <div className="section vendor-section">
            <h3>👤 Vendeur</h3>
            <div className="vendor-info">
              <p><strong>Nom:</strong> {product.vendor.fullName}</p>
              <p><strong>Email:</strong> {product.vendor.email}</p>
              <p><strong>Type:</strong> {product.vendor.vendeurType}</p>
              <p><strong>Membre depuis:</strong> {new Date(product.vendor.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Section Produit Base */}
          <div className="section base-product-section">
            <h3>📋 Produit de Base</h3>
            <div className="base-product-info">
              <p><strong>Nom:</strong> {product.baseProduct.name}</p>
              <p><strong>Description:</strong> {product.baseProduct.description}</p>
              <p><strong>Prix de base:</strong> {product.baseProduct.price / 100} €</p>
              <p><strong>Catégories:</strong> {product.baseProduct.categories.map(c => c.name).join(', ')}</p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="action-buttons">
            <a 
              href={product.designUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-action primary"
            >
              🎨 Voir Design Original
            </a>
            {product.mockupUrl && (
              <a 
                href={product.mockupUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-action secondary"
              >
                🖼️ Voir Mockup
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
```

### **5. CSS pour le Modal**
```css
/* ProductDetailsModal.css */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  width: 800px;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.section:last-child {
  border-bottom: none;
}

.section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.2rem;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.image-item {
  text-align: center;
}

.image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #eee;
}

.image-info {
  margin-top: 8px;
  font-size: 0.9rem;
}

.color-name {
  display: block;
  font-weight: bold;
  color: #333;
}

.image-size {
  color: #666;
}

.financial-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.financial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
}

.financial-item label {
  font-weight: bold;
  color: #555;
}

.price {
  color: #2196F3;
  font-weight: bold;
  font-size: 1.1rem;
}

.profit {
  color: #4CAF50;
  font-weight: bold;
}

.total-value {
  color: #FF9800;
  font-weight: bold;
}

.stock-info {
  display: flex;
  gap: 30px;
  align-items: center;
}

.stock-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stock-quantity {
  font-weight: bold;
  color: #4CAF50;
}

.status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status.published {
  background: #E8F5E8;
  color: #4CAF50;
}

.status.draft {
  background: #FFF3E0;
  color: #FF9800;
}

.variant-group {
  margin-bottom: 15px;
}

.variant-group label {
  display: block;
  font-weight: bold;
  color: #555;
  margin-bottom: 8px;
}

.sizes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.size-badge {
  padding: 6px 12px;
  background: #E3F2FD;
  color: #1976D2;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: bold;
}

.colors {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-badge {
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
  border: 2px solid #ddd;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.metadata-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 6px;
}

.quality.high {
  color: #4CAF50;
  font-weight: bold;
}

.quality.medium {
  color: #FF9800;
  font-weight: bold;
}

.quality.low {
  color: #F44336;
  font-weight: bold;
}

.vendor-info p,
.base-product-info p {
  margin: 8px 0;
  line-height: 1.5;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  background: #f9f9f9;
}

.action-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.btn-action {
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-action.primary {
  background: #2196F3;
  color: white;
}

.btn-action.primary:hover {
  background: #1976D2;
}

.btn-action.secondary {
  background: #4CAF50;
  color: white;
}

.btn-action.secondary:hover {
  background: #388E3C;
}

.loading {
  text-align: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 40px;
  color: #F44336;
}
```

---

## 🎉 RÉSUMÉ

### **Endpoints Disponibles**
1. ✅ `POST /vendor/products` - Créer un produit
2. ✅ `GET /vendor/products` - Lister les produits
3. ✅ `GET /vendor/products/:id` - **NOUVEAU** Détails complets
4. ✅ `GET /vendor/stats` - Statistiques

### **Informations Détaillées Disponibles**
- 📊 **Données complètes** du produit
- 👤 **Informations vendeur** enrichies
- 📋 **Produit de base** avec catégories
- 🖼️ **Images haute qualité** avec métadonnées
- 💰 **Calculs financiers** automatiques
- 📦 **Stock et variantes** détaillés
- 🎨 **Qualité design** évaluée

### **Composants Frontend Prêts**
- 🔧 **Service API** complet
- ⚛️ **Hook React** optimisé
- 🎨 **Modal détails** avec CSS
- 📱 **Interface responsive**

---

**🚀 Le système de détails produits vendeur est maintenant 100% fonctionnel !** 