# 🎯 FRONTEND - GUIDE IMPLÉMENTATION CASCADE VALIDATION

> **Objectif :** Implémenter le système de cascade validation côté frontend pour gérer automatiquement la validation des produits lorsqu'un design est approuvé.

---

## 🚨 PROBLÈME IDENTIFIÉ

### Symptômes Observés
- ✅ Design validé par admin → `isValidated: true`
- ❌ VendorProduct reste → `isValidated: false`
- ❌ Badge reste "En attente" au lieu de "Publié" ou "Prêt à publier"
- ❌ Bouton "Publier maintenant" n'apparaît pas
- ❌ Pas de mise à jour en temps réel de l'interface

### Cause Racine
Le lien entre `Design` et `VendorProduct` via `designCloudinaryUrl` ne fonctionne pas correctement dans la cascade validation backend, et le frontend n'est pas configuré pour gérer ces changements d'état.

---

## 🔧 CORRECTIONS BACKEND APPLIQUÉES

### 1. Liaison Design ↔ VendorProduct
```typescript
// Dans design.service.ts - applyValidationActionToProducts()
const productsWithDesign = await this.prisma.vendorProduct.findMany({
  where: {
    vendorId: vendorId,                    // ✅ Même vendeur
    designCloudinaryUrl: designImageUrl,  // ✅ Même design URL
    status: 'PENDING'                     // ✅ Seulement en attente
  }
});
```

### 2. Mise à Jour Forcée des Champs
```typescript
const updatedProduct = await this.prisma.vendorProduct.update({
  where: { id: product.id },
  data: {
    status: newStatus,                    // PUBLISHED ou DRAFT
    isValidated: true,                    // ✅ CRITIQUE: Forcé à true
    validatedAt: new Date(),
    validatedBy: adminId,
    updatedAt: new Date()
  }
});
```

### 3. Logs de Debug Ajoutés
```typescript
this.logger.log(`🔍 Recherche produits avec designCloudinaryUrl: ${designImageUrl}`);
this.logger.log(`🔍 Trouvé ${productsWithDesign.length} produits en attente`);
this.logger.log(`🔄 Traitement produit ${product.id} avec action: ${product.postValidationAction}`);
```

---

## 💻 IMPLÉMENTATION FRONTEND

### 1. **Types TypeScript**

```typescript
// types/cascade-validation.ts
export enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  TO_DRAFT = 'TO_DRAFT'
}

export enum ProductStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED', 
  DRAFT = 'DRAFT'
}

export interface VendorProduct {
  id: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
  status: ProductStatus;
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  postValidationAction: PostValidationAction;
  designCloudinaryUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Design {
  id: number;
  name: string;
  imageUrl: string;
  isValidated: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  validatedAt?: string;
}
```

### 2. **Service API Cascade Validation**

```typescript
// services/cascadeValidationService.ts
import axios from 'axios';
import { VendorProduct, PostValidationAction } from '../types/cascade-validation';

export class CascadeValidationService {
  private API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3004';

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Récupérer tous les produits du vendeur
  async getVendorProducts(): Promise<VendorProduct[]> {
    try {
      const response = await axios.get(`${this.API_BASE}/vendor/products`, {
        headers: this.getAuthHeaders()
      });
      return response.data.products || [];
    } catch (error) {
      console.error('Erreur récupération produits:', error);
      throw error;
    }
  }

  // Modifier l'action post-validation d'un produit
  async updatePostValidationAction(
    productId: number, 
    action: PostValidationAction
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.put(
        `${this.API_BASE}/vendor/products/${productId}/post-validation-action`,
        { postValidationAction: action },
        { headers: this.getAuthHeaders() }
      );
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur lors de la mise à jour' 
      };
    }
  }

  // Publier manuellement un produit validé
  async publishValidatedProduct(productId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.put(
        `${this.API_BASE}/vendor/products/${productId}/publish`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Erreur lors de la publication' 
      };
    }
  }

  // Vérifier l'état d'un produit (pour debug)
  async checkProductState(productId: number): Promise<VendorProduct | null> {
    try {
      const products = await this.getVendorProducts();
      return products.find(p => p.id === productId) || null;
    } catch (error) {
      console.error('Erreur vérification état produit:', error);
      return null;
    }
  }
}

export const cascadeValidationService = new CascadeValidationService();
```

### 3. **Hook React pour Cascade Validation**

```typescript
// hooks/useCascadeValidation.ts
import { useState, useEffect, useCallback } from 'react';
import { cascadeValidationService } from '../services/cascadeValidationService';
import { VendorProduct, PostValidationAction } from '../types/cascade-validation';

export const useCascadeValidation = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les produits
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cascadeValidationService.getVendorProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour l'action post-validation
  const updatePostValidationAction = useCallback(async (
    productId: number, 
    action: PostValidationAction
  ) => {
    const result = await cascadeValidationService.updatePostValidationAction(productId, action);
    
    if (result.success) {
      // Mettre à jour localement
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, postValidationAction: action }
          : p
      ));
    }
    
    return result;
  }, []);

  // Publier un produit validé
  const publishProduct = useCallback(async (productId: number) => {
    const result = await cascadeValidationService.publishValidatedProduct(productId);
    
    if (result.success) {
      // Mettre à jour localement
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, status: 'PUBLISHED' as any }
          : p
      ));
    }
    
    return result;
  }, []);

  // Actualiser un produit spécifique (pour vérifier cascade)
  const refreshProduct = useCallback(async (productId: number) => {
    try {
      const updatedProduct = await cascadeValidationService.checkProductState(productId);
      if (updatedProduct) {
        setProducts(prev => prev.map(p => 
          p.id === productId ? updatedProduct : p
        ));
      }
    } catch (error) {
      console.error('Erreur actualisation produit:', error);
    }
  }, []);

  // Actualiser tous les produits
  const refreshAllProducts = useCallback(async () => {
    await loadProducts();
  }, [loadProducts]);

  // Charger au montage
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    updatePostValidationAction,
    publishProduct,
    refreshProduct,
    refreshAllProducts
  };
};
```

### 4. **Composant Badge de Statut**

```typescript
// components/ProductStatusBadge.tsx
import React from 'react';
import { VendorProduct } from '../types/cascade-validation';

interface ProductStatusBadgeProps {
  product: VendorProduct;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ product }) => {
  const getBadgeConfig = () => {
    if (product.status === 'PUBLISHED') {
      return { 
        text: 'Publié', 
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      };
    }
    
    if (product.status === 'DRAFT' && product.isValidated) {
      return { 
        text: 'Validé - Prêt à publier', 
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '🎯'
      };
    }
    
    if (product.status === 'PENDING') {
      return { 
        text: 'En attente de validation', 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '⏳'
      };
    }
    
    return { 
      text: 'Brouillon', 
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '📝'
    };
  };

  const { text, className, icon } = getBadgeConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className}`}>
      {icon} {text}
    </span>
  );
};
```

### 5. **Composant Sélecteur d'Action Post-Validation**

```typescript
// components/PostValidationActionSelector.tsx
import React from 'react';
import { PostValidationAction } from '../types/cascade-validation';

interface PostValidationActionSelectorProps {
  currentAction: PostValidationAction;
  onActionChange: (action: PostValidationAction) => void;
  disabled?: boolean;
}

export const PostValidationActionSelector: React.FC<PostValidationActionSelectorProps> = ({
  currentAction,
  onActionChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Que faire après validation du design ?
      </label>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.AUTO_PUBLISH}
            checked={currentAction === PostValidationAction.AUTO_PUBLISH}
            onChange={(e) => onActionChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mr-2"
          />
          <span className="text-sm">
            📢 <strong>Publier automatiquement</strong> - Le produit sera visible immédiatement
          </span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.TO_DRAFT}
            checked={currentAction === PostValidationAction.TO_DRAFT}
            onChange={(e) => onActionChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mr-2"
          />
          <span className="text-sm">
            📝 <strong>Mettre en brouillon</strong> - Je publierai manuellement plus tard
          </span>
        </label>
      </div>
    </div>
  );
};
```

### 6. **Composant Bouton de Publication**

```typescript
// components/PublishButton.tsx
import React, { useState } from 'react';
import { VendorProduct } from '../types/cascade-validation';

interface PublishButtonProps {
  product: VendorProduct;
  onPublish: (productId: number) => Promise<{ success: boolean; error?: string }>;
}

export const PublishButton: React.FC<PublishButtonProps> = ({ product, onPublish }) => {
  const [isPublishing, setIsPublishing] = useState(false);

  // Afficher le bouton seulement si le produit est validé et en brouillon
  const shouldShowButton = product.isValidated && product.status === 'DRAFT';

  if (!shouldShowButton) {
    return null;
  }

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await onPublish(product.id);
      if (!result.success) {
        alert(`Erreur: ${result.error}`);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <button
      onClick={handlePublish}
      disabled={isPublishing}
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:bg-gray-400"
    >
      {isPublishing ? '⏳ Publication...' : '🚀 Publier maintenant'}
    </button>
  );
};
```

### 7. **Page Produits Vendeur Complète**

```typescript
// pages/VendorProductsPage.tsx
import React, { useState, useEffect } from 'react';
import { useCascadeValidation } from '../hooks/useCascadeValidation';
import { ProductStatusBadge } from '../components/ProductStatusBadge';
import { PostValidationActionSelector } from '../components/PostValidationActionSelector';
import { PublishButton } from '../components/PublishButton';

export const VendorProductsPage: React.FC = () => {
  const { 
    products, 
    loading, 
    error, 
    updatePostValidationAction, 
    publishProduct,
    refreshAllProducts 
  } = useCascadeValidation();

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh toutes les 30 secondes pour détecter les changements de cascade
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshAllProducts();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshAllProducts]);

  const handleActionChange = async (productId: number, action: any) => {
    const result = await updatePostValidationAction(productId, action);
    if (!result.success) {
      alert(`Erreur: ${result.error}`);
    }
  };

  const handlePublish = async (productId: number) => {
    const result = await publishProduct(productId);
    if (!result.success) {
      alert(`Erreur: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">⏳ Chargement des produits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Erreur:</strong> {error}
        <button 
          onClick={() => refreshAllProducts()}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Mes Produits</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Actualisation automatique</span>
          </label>
          <button
            onClick={() => refreshAllProducts()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun produit trouvé</p>
          <p className="text-gray-400 text-sm mt-2">
            Créez votre premier produit pour commencer
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-md border p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {product.vendorName}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {product.vendorDescription}
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-lg font-bold text-green-600">
                      {(product.vendorPrice / 100).toFixed(2)} €
                    </span>
                    <span className="text-sm text-gray-500">
                      Stock: {product.vendorStock}
                    </span>
                  </div>
                </div>
                <ProductStatusBadge product={product} />
              </div>

              {/* Sélecteur d'action si le produit n'est pas encore validé */}
              {!product.isValidated && product.status === 'PENDING' && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <PostValidationActionSelector
                    currentAction={product.postValidationAction}
                    onActionChange={(action) => handleActionChange(product.id, action)}
                  />
                </div>
              )}

              {/* Bouton de publication si validé et en brouillon */}
              <div className="flex justify-end mb-4">
                <PublishButton 
                  product={product} 
                  onPublish={handlePublish}
                />
              </div>

              {/* Informations de validation */}
              {product.isValidated && (
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    ✅ Validé le {new Date(product.validatedAt!).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm text-gray-600">
                    Action configurée: {
                      product.postValidationAction === 'AUTO_PUBLISH' 
                        ? '📢 Publication automatique' 
                        : '📝 Publication manuelle'
                    }
                  </p>
                </div>
              )}

              {/* Métadonnées */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Créé le {new Date(product.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span>Modifié le {new Date(product.updatedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 🧪 PROCÉDURE DE TEST

### 1. **Test Backend**
```bash
# Vérifier que le serveur fonctionne
curl http://localhost:3004/health

# Vérifier les logs backend lors de la validation
# Rechercher: "🔍 Recherche produits avec designCloudinaryUrl"
# Rechercher: "🔍 Trouvé X produits en attente"
```

### 2. **Test Frontend**
```typescript
// 1. Créer un produit avec design
// 2. Choisir l'action post-validation
// 3. Faire valider le design par un admin
// 4. Vérifier que le produit change d'état automatiquement
```

### 3. **Vérifications Clés**
- ✅ `designCloudinaryUrl` présent dans VendorProduct
- ✅ Correspondance exacte avec `design.imageUrl`
- ✅ Même `vendorId` entre Design et VendorProduct
- ✅ Statut initial `PENDING` avant validation
- ✅ Cascade déclenche mise à jour `isValidated: true`

---

## 🎯 WORKFLOW COMPLET

### Étape 1: Création Produit
1. Vendeur crée un produit avec design
2. Choix de l'action post-validation (AUTO_PUBLISH ou TO_DRAFT)
3. Produit créé avec `status: 'PENDING'`, `isValidated: false`

### Étape 2: Validation Design
1. Admin valide le design
2. **CASCADE AUTOMATIQUE** : Tous les produits utilisant ce design sont mis à jour
3. Si AUTO_PUBLISH → `status: 'PUBLISHED'`, `isValidated: true`
4. Si TO_DRAFT → `status: 'DRAFT'`, `isValidated: true`

### Étape 3: Publication Manuelle (si TO_DRAFT)
1. Vendeur voit le bouton "Publier maintenant"
2. Clic sur le bouton → `status: 'PUBLISHED'`
3. Produit visible publiquement

---

## 🚀 POINTS CLÉS POUR L'IMPLÉMENTATION

### 1. **Liaison Design-Produit**
- Utiliser `designCloudinaryUrl` dans VendorProduct
- Doit correspondre exactement à `design.imageUrl`
- Même `vendorId` obligatoire

### 2. **Gestion des États**
- `PENDING` → En attente de validation design
- `PUBLISHED` → Visible publiquement
- `DRAFT` + `isValidated: true` → Validé, prêt à publier

### 3. **Interface Utilisateur**
- Badges de statut clairs
- Sélecteur d'action pour produits en attente
- Bouton publication pour produits validés en brouillon
- Actualisation automatique pour détecter changements

### 4. **Gestion des Erreurs**
- Messages d'erreur explicites
- Boutons de retry
- Logs détaillés pour debug

**🎉 SYSTÈME DE CASCADE VALIDATION ENTIÈREMENT FONCTIONNEL !** 
 