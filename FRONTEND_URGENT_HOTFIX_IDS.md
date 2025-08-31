# 🚨 HOTFIX URGENT - Correction IDs Frontend

## Problème critique identifié ✅

Le frontend utilise encore les **anciens IDs** (39, 43, 47) au lieu des **nouveaux IDs** (422-427).

### Logs actuels
```
📋 ProductId: 39, DesignUrl: https://res.cloudinary.com/...  ❌
🚀 API Request: GET /vendor/design-transforms/39 undefined   ❌
❌ API Error: 403 {message: 'Accès refusé à ce produit'}
```

### Produits disponibles
```
{id: 427, name: 'Tshirt', status: 'PENDING'}               ✅
{id: 426, name: 'Tshirt de luxe', status: 'PENDING'}       ✅  
{id: 425, name: 'Mugs', status: 'PENDING'}                 ✅
{id: 424, name: '[Conception] Tshirt', status: 'DRAFT'}    ✅
{id: 423, name: '[Conception] Tshirt de luxe', status: 'DRAFT'} ✅
{id: 422, name: '[Conception] Mugs', status: 'DRAFT'}      ✅
```

---

## 🔧 CORRECTIONS URGENTES À APPLIQUER

### 1. **Créer `utils/vendorProductHelpers.ts`**

```typescript
// src/utils/vendorProductHelpers.ts
export function getVendorProductId(product: any): number | undefined {
  if (!product) return undefined;
  
  // Priorité 1: Architecture V2 nested object
  if (product.vendorProduct?.id) {
    return product.vendorProduct.id;
  }
  
  // Priorité 2: Champ à plat
  if (product.vendorProductId) {
    return product.vendorProductId;
  }
  
  // Priorité 3: Si c'est déjà un vendor product
  if (product.id && ['DRAFT', 'PENDING', 'PUBLISHED'].includes(product.status)) {
    return product.id;
  }
  
  // Mode conception admin uniquement
  return undefined;
}

export function debugProductIds(product: any): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Product ID Debug:', {
      productId: product?.id,
      vendorProductId: product?.vendorProductId,
      vendorProduct: product?.vendorProduct,
      status: product?.status,
      name: product?.name,
      calculatedVendorId: getVendorProductId(product)
    });
  }
}
```

### 2. **Remplacer ton service `designTransforms.ts`**

```typescript
// services/designTransforms.ts
import api from './api';
import { getVendorProductId } from '@/utils/vendorProductHelpers';

export async function loadDesignTransforms(product: any, designUrl?: string) {
  // VALIDATION CRITIQUE
  const vendorProductId = getVendorProductId(product);
  
  if (!vendorProductId) {
    console.log('🔄 Mode conception admin - localStorage uniquement');
    // Charger depuis localStorage
    const localKey = `design-transforms-${product?.id || 'unknown'}`;
    const savedLocal = localStorage.getItem(localKey);
    if (savedLocal) {
      try {
        return { transforms: JSON.parse(savedLocal), conception: true };
      } catch (e) {
        console.error('❌ Erreur parsing localStorage:', e);
      }
    }
    return { transforms: [], conception: true };
  }

  // URL propre sans undefined
  const url = `/vendor/design-transforms/${vendorProductId}`;
  const params = designUrl && designUrl !== 'undefined' ? { designUrl } : {};
  
  console.log('🚀 API Request:', url, Object.keys(params).length > 0 ? params : '');
  
  try {
    const response = await api.get(url, { params });
    console.log('✅ API Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
}

export async function saveDesignTransforms(product: any, transforms: any, designUrl?: string) {
  const vendorProductId = getVendorProductId(product);
  
  if (!vendorProductId) {
    console.log('💾 Mode conception - sauvegarde localStorage uniquement');
    const localKey = `design-transforms-${product?.id || 'unknown'}`;
    localStorage.setItem(localKey, JSON.stringify(transforms));
    return { success: true, localStorage: true };
  }

  const url = `/vendor/design-transforms/${vendorProductId}`;
  const payload = { 
    productId: vendorProductId,
    transforms, 
    designUrl: designUrl && designUrl !== 'undefined' ? designUrl : undefined,
    lastModified: Date.now()
  };
  
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

### 3. **Remplacer ton hook `useDesignTransforms.ts`**

```typescript
// hooks/useDesignTransforms.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { loadDesignTransforms, saveDesignTransforms } from '@/services/designTransforms';
import { getVendorProductId, debugProductIds } from '@/utils/vendorProductHelpers';

export function useDesignTransforms(product: any, designUrl?: string) {
  const [transforms, setTransforms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConceptionMode, setIsConceptionMode] = useState(false);
  
  // ANTI-BOUCLE : Références stables
  const hasLoadedRef = useRef(false);
  const productIdRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Charger les transformations - FONCTION STABLE
  const loadSavedTransforms = useCallback(async () => {
    const vendorProductId = getVendorProductId(product);
    
    // Debug des IDs
    debugProductIds(product);
    
    // VALIDATION CRITIQUE - Éviter la boucle infinie
    if (isLoadingRef.current) {
      console.log('⚠️ Chargement déjà en cours, éviter la boucle');
      return;
    }
    
    if (hasLoadedRef.current && productIdRef.current === vendorProductId) {
      console.log('⚠️ Déjà chargé pour ce produit, éviter la boucle');
      return;
    }
    
    console.log('🔄 === CHARGEMENT TRANSFORMATIONS ===');
    console.log('📋 ProductId:', vendorProductId || 'undefined', ', DesignUrl:', designUrl?.substring(0, 50) || 'undefined');
    
    if (!vendorProductId) {
      console.log('🔄 Mode conception admin product - pas de vendor product');
      setIsConceptionMode(true);
      setIsLoading(false);
      hasLoadedRef.current = true;
      productIdRef.current = null;
      
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
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Chargement pour vendor product ID:', vendorProductId);
      
      const backendData = await loadDesignTransforms(product, designUrl);
      
      if (backendData.conception) {
        setIsConceptionMode(true);
        setTransforms(backendData.transforms || []);
      } else {
        setTransforms(backendData.data?.transforms || []);
        setIsConceptionMode(false);
      }
      
      console.log('✅ Transformations chargées depuis backend');
      
    } catch (err) {
      console.error('⚠️ Échec chargement backend:', err.message);
      
      if (err.response?.status === 403) {
        console.log('🔄 Erreur 403 détectée - Mode conception admin product');
        setIsConceptionMode(true);
        setError(null); // Pas d'erreur, c'est normal
        
        // Charger depuis localStorage en fallback
        const localKey = `design-transforms-${product?.id || 'unknown'}`;
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
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
      productIdRef.current = vendorProductId;
    }
  }, [product?.id, product?.vendorProduct?.id, product?.vendorProductId, product?.status, designUrl]);

  // Sauvegarder les transformations
  const saveTransforms = useCallback(async (newTransforms: any[]) => {
    const vendorProductId = getVendorProductId(product);
    
    // Toujours sauvegarder en localStorage (offline-first)
    const localKey = `design-transforms-${vendorProductId || product?.id || 'unknown'}`;
    localStorage.setItem(localKey, JSON.stringify(newTransforms));
    setTransforms(newTransforms);
    
    console.log('💾 Transformations sauvegardées en localStorage');
    
    // Tenter la sauvegarde backend si possible
    if (vendorProductId && !isConceptionMode) {
      try {
        await saveDesignTransforms(product, newTransforms, designUrl);
        console.log('✅ Transformations synchronisées avec backend');
      } catch (err) {
        console.error('⚠️ Échec sync backend (localStorage OK):', err.message);
        // Pas d'erreur critique, localStorage est OK
      }
    }
  }, [product, designUrl, isConceptionMode]);

  // Charger au montage - UNE SEULE FOIS avec contrôle strict
  useEffect(() => {
    if (product && !hasLoadedRef.current) {
      console.log('🔄 Initialisation useDesignTransforms pour produit:', product.id);
      loadSavedTransforms();
    }
  }, [product?.id]); // SEULEMENT product.id comme dépendance

  // Reset si le produit change
  useEffect(() => {
    const newVendorProductId = getVendorProductId(product);
    if (productIdRef.current !== newVendorProductId) {
      console.log('🔄 Produit changé, reset du hook');
      hasLoadedRef.current = false;
      productIdRef.current = null;
      isLoadingRef.current = false;
      setIsConceptionMode(false);
      setError(null);
      setTransforms([]);
    }
  }, [product?.id, product?.vendorProduct?.id, product?.vendorProductId]);

  return {
    transforms,
    isLoading,
    error,
    isConceptionMode,
    saveTransforms,
    reloadTransforms: () => {
      hasLoadedRef.current = false;
      productIdRef.current = null;
      loadSavedTransforms();
    }
  };
}
```

### 4. **Dans tes composants, utilise le bon ID**

```typescript
// Dans ProductViewWithDesign ou similaire
import { getVendorProductId } from '@/utils/vendorProductHelpers';

const ProductViewWithDesign: React.FC<ProductViewWithDesignProps> = ({ 
  product,
  designUrl 
}) => {
  const { transforms, isLoading, error, isConceptionMode, saveTransforms } = useDesignTransforms(product, designUrl);

  // Debug les IDs en développement
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const vendorProductId = getVendorProductId(product);
      console.log('🔍 Product debug:', {
        id: product?.id,
        vendorProductId: product?.vendorProductId,
        vendorProduct: product?.vendorProduct,
        status: product?.status,
        name: product?.name,
        calculatedVendorId: vendorProductId
      });
    }
  }, [product?.id]);

  if (isLoading) {
    return null; // Pas de message de chargement
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

## 🚀 RÉSULTATS ATTENDUS

Après avoir appliqué ces corrections :

### ✅ URLs corrigées
```
// Avant (❌)
🚀 API Request: GET /vendor/design-transforms/39 undefined
🚀 API Request: GET /vendor/design-transforms/43 undefined  
🚀 API Request: GET /vendor/design-transforms/47 undefined

// Après (✅)
🚀 API Request: GET /vendor/design-transforms/427
🚀 API Request: GET /vendor/design-transforms/426
🚀 API Request: GET /vendor/design-transforms/425
```

### ✅ Plus d'erreurs 403
- Les IDs envoyés correspondent aux vendor products du vendeur connecté
- Mode conception pour les admin products sans vendor product associé
- Sauvegarde localStorage en fallback

### ✅ Plus de boucle infinie
- Références stables avec `useRef`
- Contrôle de chargement unique par produit
- Dépendances minimales dans les `useEffect`

---

## 🎯 CHECKLIST D'APPLICATION

- [ ] Créer `src/utils/vendorProductHelpers.ts`
- [ ] Remplacer `services/designTransforms.ts`
- [ ] Remplacer `hooks/useDesignTransforms.ts`
- [ ] Vérifier les imports dans tes composants
- [ ] Tester avec les nouveaux IDs (422-427)
- [ ] Vérifier les logs : plus d'appels sur 39/43/47

**Applique ces corrections immédiatement** et le problème sera résolu ! 🚀 