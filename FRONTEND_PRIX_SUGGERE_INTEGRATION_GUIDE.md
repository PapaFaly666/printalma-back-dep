# 💰 Guide Frontend - Intégration Prix Suggéré

> **Guide complet pour intégrer le système de prix suggéré avec enregistrement automatique**
> 
> Permet aux admins de définir un prix suggéré qui pré-remplit le champ prix réel

---

## 🎯 Objectif

Permettre aux **admins** de :
- Définir un prix suggéré lors de la création/modification d'un produit
- Voir le prix suggéré pré-remplir automatiquement le champ prix
- Enregistrer le prix suggéré en base de données pour référence future
- Avoir un système de fallback et de validation

---

## 🔌 Backend Déjà Disponible

### Endpoints Existants

```http
POST /api/products
PUT /api/products/:id
GET /api/products
GET /api/products/:id
```

**Données acceptées/retournées:**
```json
{
  "name": "T-shirt Premium",
  "description": "Description du produit",
  "price": 8500,
  "suggestedPrice": 9000,
  "stock": 100,
  "categories": ["T-shirts"],
  "colorVariations": [...]
}
```

---

## 🛠️ Implémentation Frontend

### 1. Service API pour Prix Suggéré

```javascript
// services/productPriceService.js

import axios from 'axios';

class ProductPriceService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur d'erreur pour redirection login
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          window.location.href = '/admin/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Créer un produit avec prix suggéré
   */
  async createProduct(productData) {
    try {
      // Validation des prix
      if (productData.suggestedPrice && productData.suggestedPrice < 0) {
        throw new Error('Le prix suggéré doit être positif');
      }

      const response = await this.api.post('/products', productData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création produit:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un produit avec prix suggéré
   */
  async updateProduct(productId, updateData) {
    try {
      const response = await this.api.put(`/products/${productId}`, updateData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur mise à jour produit:', error);
      throw error;
    }
  }

  /**
   * Récupérer un produit avec son prix suggéré
   */
  async getProduct(productId) {
    try {
      const response = await this.api.get(`/products/${productId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Erreur récupération produit:', error);
      throw error;
    }
  }

  /**
   * Calculer un prix suggéré automatique basé sur les coûts
   */
  calculateSuggestedPrice(baseCost, margin = 0.3) {
    if (!baseCost || baseCost <= 0) return 0;
    
    const suggestedPrice = baseCost * (1 + margin);
    return Math.ceil(suggestedPrice / 100) * 100; // Arrondir aux centaines
  }

  /**
   * Valider la cohérence des prix
   */
  validatePrices(price, suggestedPrice) {
    const errors = [];
    
    if (price <= 0) {
      errors.push('Le prix doit être supérieur à 0');
    }
    
    if (suggestedPrice && suggestedPrice < 0) {
      errors.push('Le prix suggéré ne peut pas être négatif');
    }
    
    if (suggestedPrice && price > suggestedPrice * 1.5) {
      errors.push('Le prix semble très éloigné du prix suggéré');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default new ProductPriceService();
```

---

### 2. Composant de Gestion des Prix

```jsx
// components/admin/ProductPriceManager.jsx

import React, { useState, useEffect, useCallback } from 'react';
import ProductPriceService from '../../services/productPriceService';

const ProductPriceManager = ({ 
  initialPrice = 0, 
  initialSuggestedPrice = null, 
  onChange,
  disabled = false,
  showCalculator = true
}) => {
  const [price, setPrice] = useState(initialPrice);
  const [suggestedPrice, setSuggestedPrice] = useState(initialSuggestedPrice);
  const [baseCost, setBaseCost] = useState(0);
  const [errors, setErrors] = useState([]);
  const [useSuggested, setUseSuggested] = useState(false);

  // Validation des prix en temps réel
  const validatePrices = useCallback((currentPrice, currentSuggestedPrice) => {
    const validation = ProductPriceService.validatePrices(currentPrice, currentSuggestedPrice);
    setErrors(validation.errors);
    return validation.isValid;
  }, []);

  // Appliquer le prix suggéré au prix réel
  const applySuggestedPrice = () => {
    if (suggestedPrice && suggestedPrice > 0) {
      setPrice(suggestedPrice);
      setUseSuggested(true);
      
      // Notifier le parent du changement
      if (onChange) {
        onChange({ 
          price: suggestedPrice, 
          suggestedPrice: suggestedPrice,
          usedSuggestion: true
        });
      }
    }
  };

  // Calculer automatiquement le prix suggéré
  const calculateSuggested = () => {
    if (baseCost > 0) {
      const calculated = ProductPriceService.calculateSuggestedPrice(baseCost, 0.4);
      setSuggestedPrice(calculated);
      
      if (onChange) {
        onChange({ 
          price: price, 
          suggestedPrice: calculated,
          autoCalculated: true
        });
      }
    }
  };

  // Gérer le changement de prix
  const handlePriceChange = (newPrice) => {
    setPrice(newPrice);
    setUseSuggested(false);
    validatePrices(newPrice, suggestedPrice);
    
    if (onChange) {
      onChange({ 
        price: newPrice, 
        suggestedPrice: suggestedPrice,
        usedSuggestion: false
      });
    }
  };

  // Gérer le changement de prix suggéré
  const handleSuggestedPriceChange = (newSuggestedPrice) => {
    setSuggestedPrice(newSuggestedPrice);
    validatePrices(price, newSuggestedPrice);
    
    if (onChange) {
      onChange({ 
        price: price, 
        suggestedPrice: newSuggestedPrice,
        manualSuggestion: true
      });
    }
  };

  // Initialisation et mise à jour des valeurs externes
  useEffect(() => {
    setPrice(initialPrice);
    setSuggestedPrice(initialSuggestedPrice);
    validatePrices(initialPrice, initialSuggestedPrice);
  }, [initialPrice, initialSuggestedPrice, validatePrices]);

  return (
    <div style={{ 
      backgroundColor: '#fff', 
      padding: '20px', 
      borderRadius: '8px',
      border: '1px solid #d9d9d9'
    }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#1890ff' }}>
        💰 Gestion des Prix
      </h4>

      {/* Calculateur automatique */}
      {showCalculator && (
        <div style={{ 
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae7ff',
          borderRadius: '6px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
            🔢 Calculateur Prix Suggéré
          </h5>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666' }}>
                Coût de base (FCFA)
              </label>
              <input
                type="number"
                value={baseCost}
                onChange={(e) => setBaseCost(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                placeholder="Ex: 5000"
                disabled={disabled}
              />
            </div>
            
            <button
              type="button"
              onClick={calculateSuggested}
              disabled={disabled || !baseCost}
              style={{
                padding: '6px 12px',
                backgroundColor: disabled || !baseCost ? '#f5f5f5' : '#52c41a',
                color: disabled || !baseCost ? '#999' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabled || !baseCost ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              Calculer
            </button>
          </div>
        </div>
      )}

      {/* Prix Suggéré */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          fontWeight: '500',
          color: '#262626'
        }}>
          💡 Prix Suggéré (FCFA) - Optionnel
        </label>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            value={suggestedPrice || ''}
            onChange={(e) => handleSuggestedPriceChange(Number(e.target.value) || null)}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              fontSize: '14px',
              backgroundColor: disabled ? '#f5f5f5' : '#fff'
            }}
            placeholder="Prix suggéré automatique ou manuel"
            disabled={disabled}
            min="0"
          />
          
          {suggestedPrice && suggestedPrice > 0 && (
            <button
              type="button"
              onClick={applySuggestedPrice}
              disabled={disabled || useSuggested}
              style={{
                padding: '8px 12px',
                backgroundColor: useSuggested ? '#52c41a' : '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              {useSuggested ? '✓ Appliqué' : 'Appliquer'}
            </button>
          )}
        </div>
        
        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
          💡 Ce prix sera sauvegardé comme référence pour l'admin
        </div>
      </div>

      {/* Prix Réel */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '6px', 
          fontWeight: '500',
          color: '#262626'
        }}>
          💰 Prix de Vente (FCFA) - Requis *
        </label>
        
        <input
          type="number"
          value={price}
          onChange={(e) => handlePriceChange(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '10px',
            border: `2px solid ${errors.length > 0 ? '#ff4d4f' : useSuggested ? '#52c41a' : '#d9d9d9'}`,
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
            backgroundColor: disabled ? '#f5f5f5' : useSuggested ? '#f6ffed' : '#fff'
          }}
          placeholder="Prix final du produit"
          disabled={disabled}
          min="1"
          required
        />
        
        <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
          💳 Prix affiché aux clients sur le site
        </div>
      </div>

      {/* Indicateurs visuels */}
      {suggestedPrice && price && (
        <div style={{ 
          backgroundColor: '#fafafa',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '13px', marginBottom: '8px' }}>
            📊 Comparaison des Prix:
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '12px', color: '#666' }}>Suggéré:</span>
              <span style={{ 
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: '#e6f7ff',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {new Intl.NumberFormat('fr-FR').format(suggestedPrice)} FCFA
              </span>
            </div>
            
            <div>
              <span style={{ fontSize: '12px', color: '#666' }}>Réel:</span>
              <span style={{ 
                marginLeft: '8px',
                padding: '2px 8px',
                backgroundColor: useSuggested ? '#f6ffed' : '#fff7e6',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {new Intl.NumberFormat('fr-FR').format(price)} FCFA
              </span>
            </div>
            
            <div>
              <span style={{ 
                fontSize: '11px',
                color: Math.abs(price - suggestedPrice) / suggestedPrice > 0.2 ? '#fa8c16' : '#52c41a'
              }}>
                {price > suggestedPrice ? '+' : ''}{((price - suggestedPrice) / suggestedPrice * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Erreurs de validation */}
      {errors.length > 0 && (
        <div style={{
          backgroundColor: '#fff2f0',
          border: '1px solid #ffccc7',
          borderRadius: '4px',
          padding: '8px',
          marginBottom: '8px'
        }}>
          {errors.map((error, index) => (
            <div key={index} style={{ fontSize: '12px', color: '#ff4d4f' }}>
              ⚠️ {error}
            </div>
          ))}
        </div>
      )}

      {/* Statut de validation */}
      {errors.length === 0 && price > 0 && (
        <div style={{
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '12px',
          color: '#52c41a'
        }}>
          ✅ Prix valides - Prêt pour l'enregistrement
        </div>
      )}
    </div>
  );
};

export default ProductPriceManager;
```

---

### 3. Intégration dans le Formulaire Produit

```jsx
// components/admin/ProductForm.jsx

import React, { useState, useEffect } from 'react';
import ProductPriceManager from './ProductPriceManager';
import ProductPriceService from '../../services/productPriceService';

const ProductForm = ({ productId = null, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    suggestedPrice: null,
    stock: 0,
    categories: [],
    colorVariations: []
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Charger le produit existant si en mode édition
  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const product = await ProductPriceService.getProduct(productId);
      setFormData({
        ...product,
        // S'assurer que les prix sont bien récupérés
        price: product.price || 0,
        suggestedPrice: product.suggestedPrice || null
      });
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      setErrors({ general: 'Erreur lors du chargement du produit' });
    } finally {
      setLoading(false);
    }
  };

  // Gérer les changements de prix depuis le composant PriceManager
  const handlePriceChange = (priceData) => {
    setFormData(prev => ({
      ...prev,
      price: priceData.price,
      suggestedPrice: priceData.suggestedPrice
    }));
    
    // Logger pour débug
    console.log('Prix mis à jour:', priceData);
  };

  // Sauvegarder le produit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setErrors({});
      
      // Validation côté client
      const validation = ProductPriceService.validatePrices(
        formData.price, 
        formData.suggestedPrice
      );
      
      if (!validation.isValid) {
        setErrors({ price: validation.errors.join(', ') });
        return;
      }

      // Préparer les données pour l'API
      const productData = {
        ...formData,
        // S'assurer que les prix sont bien envoyés
        price: Number(formData.price),
        suggestedPrice: formData.suggestedPrice ? Number(formData.suggestedPrice) : null
      };

      let result;
      if (productId) {
        result = await ProductPriceService.updateProduct(productId, productData);
        console.log('Produit mis à jour avec prix:', result);
      } else {
        result = await ProductPriceService.createProduct(productData);
        console.log('Produit créé avec prix:', result);
      }

      // Notifier le parent du succès
      if (onSave) {
        onSave(result);
      }
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      setErrors({ 
        general: error.message || 'Erreur lors de la sauvegarde' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>⏳ Chargement du produit...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gap: '20px' }}>
        
        {/* Erreur générale */}
        {errors.general && (
          <div style={{
            backgroundColor: '#fff2f0',
            border: '1px solid #ffccc7',
            borderRadius: '6px',
            padding: '12px',
            color: '#ff4d4f'
          }}>
            ❌ {errors.general}
          </div>
        )}

        {/* Champs de base */}
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              📝 Nom du Produit *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px'
              }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
              📄 Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                minHeight: '100px'
              }}
              required
            />
          </div>
        </div>

        {/* Gestionnaire de Prix */}
        <ProductPriceManager
          initialPrice={formData.price}
          initialSuggestedPrice={formData.suggestedPrice}
          onChange={handlePriceChange}
          disabled={saving}
          showCalculator={true}
        />
        
        {errors.price && (
          <div style={{ color: '#ff4d4f', fontSize: '12px' }}>
            ⚠️ {errors.price}
          </div>
        )}

        {/* Stock */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>
            📦 Stock
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px'
            }}
            min="0"
          />
        </div>

        {/* Boutons d'action */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end',
          paddingTop: '20px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            Annuler
          </button>
          
          <button
            type="submit"
            disabled={saving || !formData.name || !formData.description || formData.price <= 0}
            style={{
              padding: '10px 20px',
              backgroundColor: saving ? '#f5f5f5' : '#1890ff',
              color: saving ? '#999' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {saving ? '⏳ Sauvegarde...' : (productId ? 'Modifier' : 'Créer')} le Produit
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
```

---

### 4. Hook React pour Prix Suggéré

```jsx
// hooks/useProductPricing.js

import { useState, useCallback, useEffect } from 'react';
import ProductPriceService from '../services/productPriceService';

export const useProductPricing = (initialPrice = 0, initialSuggestedPrice = null) => {
  const [price, setPrice] = useState(initialPrice);
  const [suggestedPrice, setSuggestedPrice] = useState(initialSuggestedPrice);
  const [errors, setErrors] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Validation automatique
  const validatePrices = useCallback((currentPrice, currentSuggestedPrice) => {
    const validation = ProductPriceService.validatePrices(currentPrice, currentSuggestedPrice);
    setErrors(validation.errors);
    return validation.isValid;
  }, []);

  // Mettre à jour le prix
  const updatePrice = useCallback((newPrice) => {
    setPrice(newPrice);
    setHasChanges(true);
    validatePrices(newPrice, suggestedPrice);
  }, [suggestedPrice, validatePrices]);

  // Mettre à jour le prix suggéré
  const updateSuggestedPrice = useCallback((newSuggestedPrice) => {
    setSuggestedPrice(newSuggestedPrice);
    setHasChanges(true);
    validatePrices(price, newSuggestedPrice);
  }, [price, validatePrices]);

  // Appliquer le prix suggéré
  const applySuggestedPrice = useCallback(() => {
    if (suggestedPrice && suggestedPrice > 0) {
      setPrice(suggestedPrice);
      setHasChanges(true);
      validatePrices(suggestedPrice, suggestedPrice);
      return true;
    }
    return false;
  }, [suggestedPrice, validatePrices]);

  // Calculer un prix suggéré automatique
  const calculateSuggestedPrice = useCallback((baseCost, margin = 0.3) => {
    const calculated = ProductPriceService.calculateSuggestedPrice(baseCost, margin);
    setSuggestedPrice(calculated);
    setHasChanges(true);
    validatePrices(price, calculated);
    return calculated;
  }, [price, validatePrices]);

  // Reset des changements
  const resetChanges = useCallback(() => {
    setPrice(initialPrice);
    setSuggestedPrice(initialSuggestedPrice);
    setHasChanges(false);
    setErrors([]);
  }, [initialPrice, initialSuggestedPrice]);

  // Validation initiale
  useEffect(() => {
    validatePrices(initialPrice, initialSuggestedPrice);
  }, [initialPrice, initialSuggestedPrice, validatePrices]);

  return {
    // État
    price,
    suggestedPrice,
    errors,
    hasChanges,
    isValid: errors.length === 0 && price > 0,
    
    // Actions
    updatePrice,
    updateSuggestedPrice,
    applySuggestedPrice,
    calculateSuggestedPrice,
    resetChanges,
    
    // Utilitaires
    getPricingData: () => ({ price, suggestedPrice }),
    getValidationStatus: () => ({ isValid: errors.length === 0, errors }),
    getPriceDifference: () => suggestedPrice ? price - suggestedPrice : 0,
    getPriceDifferencePercent: () => suggestedPrice ? ((price - suggestedPrice) / suggestedPrice * 100) : 0
  };
};

// Usage:
// const pricing = useProductPricing(8500, 9000);
// pricing.updatePrice(8000);
// pricing.applySuggestedPrice();
```

---

### 5. Version Quick-Start Simple

```jsx
// components/SimplePriceSuggestion.jsx

import React, { useState } from 'react';

const SimplePriceSuggestion = ({ onPriceChange, initialPrice = 0, initialSuggested = null }) => {
  const [price, setPrice] = useState(initialPrice);
  const [suggestedPrice, setSuggestedPrice] = useState(initialSuggested);

  const applySuggested = () => {
    if (suggestedPrice > 0) {
      setPrice(suggestedPrice);
      onPriceChange({ price: suggestedPrice, suggestedPrice });
    }
  };

  const handlePriceChange = (newPrice) => {
    setPrice(newPrice);
    onPriceChange({ price: newPrice, suggestedPrice });
  };

  const handleSuggestedChange = (newSuggested) => {
    setSuggestedPrice(newSuggested);
    onPriceChange({ price, suggestedPrice: newSuggested });
  };

  return (
    <div style={{ display: 'grid', gap: '12px', padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h4>💰 Prix du Produit</h4>
      
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
          Prix suggéré (FCFA)
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            value={suggestedPrice || ''}
            onChange={(e) => handleSuggestedChange(Number(e.target.value))}
            style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Optionnel"
          />
          {suggestedPrice > 0 && (
            <button 
              type="button" 
              onClick={applySuggested}
              style={{ padding: '6px 12px', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Appliquer
            </button>
          )}
        </div>
      </div>
      
      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
          Prix de vente (FCFA) *
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => handlePriceChange(Number(e.target.value))}
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '2px solid #1890ff', 
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
          required
          min="1"
        />
      </div>
      
      {suggestedPrice && price && (
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Différence: {price - suggestedPrice > 0 ? '+' : ''}{price - suggestedPrice} FCFA
        </div>
      )}
    </div>
  );
};

export default SimplePriceSuggestion;
```

---

## ✅ Checklist d'Intégration

- [ ] Copier le service ProductPriceService
- [ ] Intégrer ProductPriceManager dans le formulaire produit
- [ ] Tester la création de produit avec prix suggéré
- [ ] Tester la modification de produit existant
- [ ] Vérifier que les données sont bien sauvegardées en base
- [ ] Tester le calculateur automatique de prix
- [ ] Adapter les styles selon votre design
- [ ] Ajouter les validations métier spécifiques

---

## 🔧 Endpoints Utilisés

```
POST /api/products
PUT /api/products/:id
GET /api/products/:id

Données: { price, suggestedPrice, ... }
```

**Le backend est déjà prêt !** Le système peut enregistrer et récupérer les prix suggérés. 🚀