# ⚡ Quick Start - Prix Suggéré en 2 Minutes

> **Guide ultra-rapide pour ajouter le prix suggéré à votre formulaire produit**

---

## 🚀 Copy-Paste Ready

### 1. Service API Simple (30 secondes)

```javascript
// utils/priceAPI.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  withCredentials: true
});

export const saveProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
```

### 2. Composant Prix Simple (1 minute)

```jsx
// components/PriceSuggest.jsx
import React, { useState } from 'react';

const PriceSuggest = ({ onPriceChange, initialData = {} }) => {
  const [price, setPrice] = useState(initialData.price || 0);
  const [suggestedPrice, setSuggestedPrice] = useState(initialData.suggestedPrice || null);

  const applySuggestion = () => {
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
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '6px' }}>
      <h4>💰 Prix</h4>
      
      {/* Prix Suggéré */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>
          💡 Prix Suggéré (FCFA)
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="number"
            value={suggestedPrice || ''}
            onChange={(e) => handleSuggestedChange(Number(e.target.value) || null)}
            style={{ flex: 1, padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Ex: 9000 (optionnel)"
          />
          {suggestedPrice > 0 && (
            <button 
              type="button" 
              onClick={applySuggestion}
              style={{ 
                padding: '6px 12px', 
                backgroundColor: '#52c41a', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ✓ Appliquer
            </button>
          )}
        </div>
      </div>
      
      {/* Prix Réel */}
      <div>
        <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', fontWeight: 'bold' }}>
          💳 Prix de Vente (FCFA) *
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
            fontWeight: 'bold',
            backgroundColor: suggestedPrice === price ? '#f6ffed' : '#fff'
          }}
          required
          min="1"
          placeholder="Prix affiché aux clients"
        />
      </div>
      
      {/* Indication */}
      {suggestedPrice && price && suggestedPrice !== price && (
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '6px',
          textAlign: 'center'
        }}>
          📊 Différence: {price - suggestedPrice > 0 ? '+' : ''}{price - suggestedPrice} FCFA 
          ({((price - suggestedPrice) / suggestedPrice * 100).toFixed(1)}%)
        </div>
      )}
      
      {suggestedPrice === price && price > 0 && (
        <div style={{ 
          fontSize: '12px', 
          color: '#52c41a', 
          marginTop: '6px',
          textAlign: 'center'
        }}>
          ✅ Prix suggéré appliqué
        </div>
      )}
    </div>
  );
};

export default PriceSuggest;
```

### 3. Usage dans Formulaire (30 secondes)

```jsx
// Dans votre formulaire produit existant
import PriceSuggest from './components/PriceSuggest';
import { saveProduct } from './utils/priceAPI';

function ProductForm() {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: 0,
    suggestedPrice: null
  });

  // Gérer les changements de prix
  const handlePriceChange = (priceData) => {
    setProductData(prev => ({
      ...prev,
      price: priceData.price,
      suggestedPrice: priceData.suggestedPrice
    }));
  };

  // Sauvegarder
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await saveProduct(productData);
      console.log('Produit sauvé avec prix suggéré:', result.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Vos autres champs... */}
      
      <PriceSuggest 
        onPriceChange={handlePriceChange}
        initialData={productData}
      />
      
      <button type="submit">Sauvegarder</button>
    </form>
  );
}
```

---

## 📱 Version Mobile Ultra-Simple

```jsx
// components/MobilePriceSuggest.jsx
import React, { useState } from 'react';

const MobilePriceSuggest = ({ onPriceChange, initialPrice = 0, initialSuggested = null }) => {
  const [price, setPrice] = useState(initialPrice);
  const [suggestedPrice, setSuggestedPrice] = useState(initialSuggested);

  return (
    <div style={{ padding: '12px' }}>
      <h4 style={{ marginBottom: '16px' }}>💰 Prix</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <input
          type="number"
          value={suggestedPrice || ''}
          onChange={(e) => {
            const val = Number(e.target.value) || null;
            setSuggestedPrice(val);
            onPriceChange({ price, suggestedPrice: val });
          }}
          style={{ 
            width: '100%', 
            padding: '10px', 
            border: '1px solid #ddd', 
            borderRadius: '6px',
            marginBottom: '6px'
          }}
          placeholder="💡 Prix suggéré (optionnel)"
        />
        
        {suggestedPrice > 0 && (
          <button 
            type="button"
            onClick={() => {
              setPrice(suggestedPrice);
              onPriceChange({ price: suggestedPrice, suggestedPrice });
            }}
            style={{ 
              width: '100%',
              padding: '8px', 
              backgroundColor: '#52c41a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px'
            }}
          >
            ✓ Utiliser comme prix de vente
          </button>
        )}
      </div>
      
      <input
        type="number"
        value={price}
        onChange={(e) => {
          const val = Number(e.target.value);
          setPrice(val);
          onPriceChange({ price: val, suggestedPrice });
        }}
        style={{ 
          width: '100%', 
          padding: '12px', 
          border: '2px solid #1890ff', 
          borderRadius: '6px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}
        placeholder="💳 Prix de vente (requis)"
        required
      />
    </div>
  );
};

export default MobilePriceSuggest;
```

---

## ⚡ Hook Ultra-Simple

```jsx
// hooks/usePriceSuggest.js
import { useState } from 'react';

export const usePriceSuggest = (initialPrice = 0, initialSuggested = null) => {
  const [price, setPrice] = useState(initialPrice);
  const [suggestedPrice, setSuggestedPrice] = useState(initialSuggested);

  const applySuggestion = () => {
    if (suggestedPrice > 0) {
      setPrice(suggestedPrice);
      return true;
    }
    return false;
  };

  const getPricingData = () => ({
    price: Number(price),
    suggestedPrice: suggestedPrice ? Number(suggestedPrice) : null
  });

  return {
    price,
    suggestedPrice,
    setPrice,
    setSuggestedPrice,
    applySuggestion,
    getPricingData,
    hasSuggestion: suggestedPrice > 0,
    usingSuggestion: price === suggestedPrice && suggestedPrice > 0
  };
};

// Usage:
// const pricing = usePriceSuggest(8500, 9000);
```

---

## 🎯 Calculateur Express

```jsx
// components/QuickCalculator.jsx
import React, { useState } from 'react';

const QuickCalculator = ({ onCalculated }) => {
  const [baseCost, setBaseCost] = useState(0);
  const [margin, setMargin] = useState(40); // 40% par défaut

  const calculate = () => {
    if (baseCost > 0) {
      const suggested = Math.ceil(baseCost * (1 + margin / 100) / 100) * 100;
      onCalculated(suggested);
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#f0f9ff', 
      padding: '12px', 
      borderRadius: '6px',
      marginBottom: '12px'
    }}>
      <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>🔢 Calculateur Express</h5>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
        <div style={{ flex: 1 }}>
          <input
            type="number"
            value={baseCost}
            onChange={(e) => setBaseCost(Number(e.target.value))}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            placeholder="Coût de base"
          />
        </div>
        
        <div style={{ width: '80px' }}>
          <select
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value={30}>+30%</option>
            <option value={40}>+40%</option>
            <option value={50}>+50%</option>
            <option value={60}>+60%</option>
          </select>
        </div>
        
        <button 
          type="button"
          onClick={calculate}
          disabled={!baseCost}
          style={{
            padding: '6px 12px',
            backgroundColor: baseCost ? '#1890ff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: baseCost ? 'pointer' : 'not-allowed'
          }}
        >
          =
        </button>
      </div>
      
      {baseCost > 0 && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
          💡 Prix suggéré: {Math.ceil(baseCost * (1 + margin / 100) / 100) * 100} FCFA
        </div>
      )}
    </div>
  );
};

export default QuickCalculator;
```

---

## ✅ Checklist 2 Minutes

- [ ] Copier le composant PriceSuggest (30 sec)
- [ ] L'ajouter à votre formulaire (30 sec)
- [ ] Connecter au service API (30 sec)
- [ ] Tester création produit (30 sec)

**Total : 2 minutes pour le prix suggéré !** ⚡

---

## 🔧 Backend Ready

```
POST /api/products
PUT /api/products/:id

Payload: { 
  name, description, 
  price: 8500, 
  suggestedPrice: 9000 
}
```

**Prêt à utiliser !** Le backend sauvegarde automatiquement les deux prix. 🚀