# 🚨 CORRECTION URGENTE - Design Transforms 403 + Boucle Infinie

## Problème identifié
```
🚀 API Request: GET /vendor/design-transforms/39 undefined
❌ API Error: 403 "Accès refusé à ce produit"
```

**Causes :**
1. URL malformée avec `undefined` 
2. Boucle infinie sur erreur 403
3. Mauvais IDs utilisés (admin product au lieu de vendor product)

---

## 🔧 CORRECTIONS IMMÉDIATES

### 1. **Corrige le service designTransforms.ts**

```typescript
// services/designTransforms.ts
import api from './api';

export async function loadDesignTransforms(vendorProductId: number, designUrl?: string) {
  // VALIDATION CRITIQUE
  if (!vendorProductId || vendorProductId === undefined || vendorProductId === null) {
    console.error('❌ loadDesignTransforms: vendorProductId invalide:', vendorProductId);
    throw new Error('ID produit vendeur requis');
  }

  // URL propre sans undefined
  const url = `/vendor/design-transforms/${vendorProductId}`;
  const params = designUrl ? { designUrl } : {};
  
  console.log('🚀 API Request:', url, params);
  
  try {
    const response = await api.get(url, { params });
    console.log('✅ API Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
}

export async function saveDesignTransforms(vendorProductId: number, transforms: any, designUrl?: string) {
  if (!vendorProductId || vendorProductId === undefined || vendorProductId === null) {
    console.error('❌ saveDesignTransforms: vendorProductId invalide:', vendorProductId);
    throw new Error('ID produit vendeur requis');
  }

  const url = `/vendor/design-transforms/${vendorProductId}`;
  const payload = { transforms, designUrl };
  
  console.log('🚀 API Request POST:', url, payload);
  
  try {
    const response = await api.post(url, payload);
    console.log('✅ API Success POST:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error POST:', error.response?.status, error.response?.data);
    throw error;
  }
}
```

### 2. **Corrige le hook useDesignTransforms.ts**

```typescript
// hooks/useDesignTransforms.ts
import { useState, useEffect, useCallback } from 'react';
import { loadDesignTransforms, saveDesignTransforms } from '@/services/designTransforms';

export function useDesignTransforms(product: any, designUrl?: string) {
  const [transforms, setTransforms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConceptionMode, setIsConceptionMode] = useState(false);
  const [hasTriedLoading, setHasTriedLoading] = useState(false); // ANTI-BOUCLE

  // Déterminer l'ID à utiliser
  const getVendorProductId = useCallback(() => {
    if (!product) return null;
    
    // Priorité : vendorProduct.id > vendorProductId > id (si c'est un vendor product)
    if (product.vendorProduct?.id) return product.vendorProduct.id;
    if (product.vendorProductId) return product.vendorProductId;
    if (product.id && product.status && ['DRAFT', 'PENDING', 'PUBLISHED'].includes(product.status)) {
      return product.id; // C'est déjà un vendor product
    }
    
    return null; // Admin product, pas de vendor product associé
  }, [product]);

  // Charger les transformations
  const loadSavedTransforms = useCallback(async () => {
    const vendorProductId = getVendorProductId();
    
    // VALIDATION CRITIQUE - Éviter la boucle infinie
    if (hasTriedLoading) {
      console.log('⚠️ Chargement déjà tenté, éviter la boucle');
      return;
    }
    
    if (!vendorProductId) {
      console.log('🔄 Mode conception admin product - pas de vendor product');
      setIsConceptionMode(true);
      setIsLoading(false);
      setHasTriedLoading(true);
      
      // Charger depuis localStorage
      const localKey = `design-transforms-${product?.id || 'unknown'}`;
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        try {
          setTransforms(JSON.parse(savedLocal));
          console.log('📦 Transformations chargées depuis localStorage');
        } catch (e) {
          console.error('❌ Erreur parsing localStorage:', e);
        }
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const backendData = await loadDesignTransforms(vendorProductId, designUrl);
      setTransforms(backendData.transforms || []);
      setIsConceptionMode(false);
      
      console.log('✅ Transformations chargées depuis backend');
      
    } catch (err) {
      console.error('⚠️ Échec chargement backend:', err.message);
      
      if (err.response?.status === 403) {
        console.log('🔄 Erreur 403 détectée - Mode conception admin product');
        setIsConceptionMode(true);
        setError(null); // Pas d'erreur, c'est normal
        
        // Charger depuis localStorage en fallback
        const localKey = `design-transforms-${vendorProductId}`;
        const savedLocal = localStorage.getItem(localKey);
        if (savedLocal) {
          try {
            setTransforms(JSON.parse(savedLocal));
            console.log('📦 Transformations chargées depuis localStorage (fallback 403)');
          } catch (e) {
            console.error('❌ Erreur parsing localStorage fallback:', e);
          }
        } else {
          console.log('ℹ️ Aucune transformation sauvegardée trouvée, initialisation vide (mode 403)');
        }
      } else {
        setError(err.message);
        setIsConceptionMode(false);
      }
    } finally {
      setIsLoading(false);
      setHasTriedLoading(true); // MARQUER COMME TENTÉ
    }
  }, [product, designUrl, getVendorProductId, hasTriedLoading]);

  // Sauvegarder les transformations
  const saveTransforms = useCallback(async (newTransforms: any[]) => {
    const vendorProductId = getVendorProductId();
    
    // Toujours sauvegarder en localStorage (offline-first)
    const localKey = `design-transforms-${vendorProductId || product?.id || 'unknown'}`;
    localStorage.setItem(localKey, JSON.stringify(newTransforms));
    setTransforms(newTransforms);
    
    console.log('💾 Transformations sauvegardées en localStorage');
    
    // Tenter la sauvegarde backend si possible
    if (vendorProductId && !isConceptionMode) {
      try {
        await saveDesignTransforms(vendorProductId, newTransforms, designUrl);
        console.log('✅ Transformations synchronisées avec backend');
      } catch (err) {
        console.error('⚠️ Échec sync backend (localStorage OK):', err.message);
        // Pas d'erreur critique, localStorage est OK
      }
    }
  }, [getVendorProductId, product, designUrl, isConceptionMode]);

  // Charger au montage - UNE SEULE FOIS
  useEffect(() => {
    if (product && !hasTriedLoading) {
      loadSavedTransforms();
    }
  }, [product, loadSavedTransforms, hasTriedLoading]);

  // Reset si le produit change
  useEffect(() => {
    setHasTriedLoading(false);
    setIsConceptionMode(false);
    setError(null);
  }, [product?.id]);

  return {
    transforms,
    isLoading,
    error,
    isConceptionMode,
    saveTransforms,
    reloadTransforms: () => {
      setHasTriedLoading(false);
      loadSavedTransforms();
    }
  };
}
```

### 3. **Validation dans le composant**

```typescript
// Dans ton composant qui utilise le hook
const ProductDesignEditor = ({ product }) => {
  const { transforms, isLoading, error, isConceptionMode, saveTransforms } = useDesignTransforms(product);

  // Debug les IDs
  useEffect(() => {
    console.log('🔍 Product debug:', {
      id: product?.id,
      vendorProductId: product?.vendorProductId,
      vendorProduct: product?.vendorProduct,
      status: product?.status,
      name: product?.name
    });
  }, [product]);

  if (isLoading) {
    return <div>Chargement des transformations...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  if (isConceptionMode) {
    return (
      <div>
        <div className="bg-blue-100 p-2 mb-4 rounded">
          ℹ️ Mode conception - Modifications sauvegardées localement
        </div>
        {/* Ton éditeur de design */}
      </div>
    );
  }

  return (
    <div>
      {/* Ton éditeur de design normal */}
    </div>
  );
};
```

---

## 🚀 ACTIONS IMMÉDIATES

### 1. **Applique ces corrections**
- [ ] Remplace le service `designTransforms.ts`
- [ ] Remplace le hook `useDesignTransforms.ts`
- [ ] Ajoute la validation dans ton composant

### 2. **Teste immédiatement**
```bash
# Ouvre la console et vérifie :
# - Plus de "undefined" dans les URLs
# - Plus de boucle infinie
# - Messages de debug clairs
```

### 3. **Vérification backend**
```bash
# Assure-toi que les IDs 39, 43, 47 sont bien des vendor products
# Si ce sont des admin products, c'est normal qu'ils donnent 403
```

---

## 🔧 DEBUG SUPPLÉMENTAIRE

### Si le problème persiste :

1. **Ajoute plus de logs** dans ton composant :
```typescript
console.log('Product reçu:', product);
console.log('Type de product:', typeof product?.id, product?.id);
console.log('Vendor product ID:', product?.vendorProductId);
```

2. **Vérifie la structure des données** :
```typescript
// Les produits doivent avoir cette structure :
// Admin Product: { id: 39, name: "...", vendorProductId: 384 }
// Vendor Product: { id: 384, name: "...", status: "DRAFT" }
```

3. **Force le mode conception** si nécessaire :
```typescript
// Temporairement, force le mode conception
const isConceptionMode = true; // Force pour tester
```

---

## ✅ RÉSULTAT ATTENDU

Après ces corrections :
- ✅ Plus de boucle infinie
- ✅ URLs propres sans `undefined`
- ✅ Mode conception pour admin products
- ✅ Sauvegarde localStorage fonctionnelle
- ✅ Messages d'erreur clairs 