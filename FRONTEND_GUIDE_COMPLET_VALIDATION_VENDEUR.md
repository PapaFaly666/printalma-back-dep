# 🎯 FRONTEND — GUIDE COMPLET VALIDATION VENDEUR

> **Guide d'implémentation frontend** pour le système de validation vendeur avec choix de publication

---

## 📋 Vue d'ensemble du système

### Workflow utilisateur :
1. **Vendeur** crée un produit → Choisit action post-validation → Soumet
2. **Admin** voit les produits en attente → Valide/Rejette
3. **Système** applique automatiquement l'action choisie
4. **Vendeur** peut publier manuellement si choix "TO_DRAFT"

### Actions disponibles :
- **`AUTO_PUBLISH`** : Publication automatique après validation ✅
- **`TO_DRAFT`** : Mise en brouillon après validation (publication manuelle) 📝

---

## 🔧 Configuration API - Service de base

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 📝 Types TypeScript

```typescript
// src/types/vendorProduct.ts
export enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  TO_DRAFT = 'TO_DRAFT'
}

export enum VendorProductStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED'
}

export interface VendorProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: VendorProductStatus;
  isValidated: boolean;
  postValidationAction: PostValidationAction;
  validatedAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  // ... autres champs existants
}

export interface ValidationChoice {
  action: PostValidationAction;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface PendingProduct extends VendorProduct {
  vendor: {
    id: number;
    name: string;
    email: string;
  };
  baseProduct: {
    id: number;
    name: string;
    category: string;
  };
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  product?: VendorProduct;
  newStatus?: VendorProductStatus;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

---

## 🛠️ Services API

### Service principal de validation

```typescript
// src/services/vendorValidationService.ts
import api from './api';
import { PostValidationAction, VendorProduct, PendingProduct, ValidationResponse, PaginatedResponse } from '@/types/vendorProduct';

export class VendorValidationService {
  
  /**
   * Soumettre un produit pour validation
   */
  static async submitForValidation(productId: number, postValidationAction: PostValidationAction): Promise<ValidationResponse> {
    const { data } = await api.post(`/vendor-product-validation/submit/${productId}`, {
      postValidationAction
    });
    return data;
  }

  /**
   * Modifier le choix d'action pour un produit en attente
   */
  static async updatePostValidationAction(productId: number, action: PostValidationAction): Promise<ValidationResponse> {
    const { data } = await api.put(`/vendor-product-validation/post-validation-action/${productId}`, {
      action
    });
    return data;
  }

  /**
   * Publier manuellement un produit validé en brouillon
   */
  static async publishValidatedProduct(productId: number): Promise<ValidationResponse> {
    const { data } = await api.post(`/vendor-product-validation/publish/${productId}`);
    return data;
  }

  /**
   * Lister les produits en attente de validation (admin)
   */
  static async getPendingProducts(page = 1, limit = 20): Promise<PaginatedResponse<PendingProduct>> {
    const { data } = await api.get(`/vendor-product-validation/pending?page=${page}&limit=${limit}`);
    return data;
  }

  /**
   * Valider ou rejeter un produit (admin)
   */
  static async validateProduct(productId: number, approved: boolean, rejectionReason?: string): Promise<ValidationResponse> {
    const { data } = await api.post(`/vendor-product-validation/validate/${productId}`, {
      approved,
      rejectionReason
    });
    return data;
  }

  /**
   * Obtenir la liste des produits du vendeur
   */
  static async getVendorProducts(): Promise<{ success: boolean; products: VendorProduct[] }> {
    const { data } = await api.get('/vendor/products');
    return data;
  }

  /**
   * Créer un nouveau produit
   */
  static async createProduct(productData: Partial<VendorProduct>): Promise<ValidationResponse> {
    const { data } = await api.post('/vendor/products', productData);
    return data;
  }

  /**
   * Obtenir les choix de validation disponibles
   */
  static getValidationChoices(): ValidationChoice[] {
    return [
      {
        action: PostValidationAction.AUTO_PUBLISH,
        label: 'Publication automatique',
        description: 'Le produit sera publié immédiatement après validation par l\'admin',
        icon: '🚀',
        color: 'green'
      },
      {
        action: PostValidationAction.TO_DRAFT,
        label: 'Mise en brouillon',
        description: 'Le produit sera mis en brouillon après validation. Vous pourrez le publier quand vous voulez',
        icon: '📝',
        color: 'blue'
      }
    ];
  }
}
```

---

## 🪝 Hooks personnalisés

### Hook principal de validation

```typescript
// src/hooks/useVendorValidation.ts
import { useState, useCallback } from 'react';
import { VendorValidationService } from '@/services/vendorValidationService';
import { PostValidationAction, VendorProduct } from '@/types/vendorProduct';
import { toast } from 'react-hot-toast';

export function useVendorValidation() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitForValidation = useCallback(async (productId: number, action: PostValidationAction) => {
    setSubmitting(true);
    try {
      const response = await VendorValidationService.submitForValidation(productId, action);
      
      if (response.success) {
        toast.success('Produit soumis pour validation avec succès !');
        return { success: true, product: response.product };
      } else {
        toast.error(response.message || 'Erreur lors de la soumission');
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la soumission';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const updateValidationAction = useCallback(async (productId: number, action: PostValidationAction) => {
    setLoading(true);
    try {
      const response = await VendorValidationService.updatePostValidationAction(productId, action);
      
      if (response.success) {
        const actionLabel = action === PostValidationAction.AUTO_PUBLISH 
          ? 'Publication automatique' 
          : 'Mise en brouillon';
        toast.success(`Choix mis à jour : ${actionLabel}`);
        return { success: true, product: response.product };
      } else {
        toast.error(response.message || 'Erreur lors de la mise à jour');
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la mise à jour';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const publishProduct = useCallback(async (productId: number) => {
    setLoading(true);
    try {
      const response = await VendorValidationService.publishValidatedProduct(productId);
      
      if (response.success) {
        toast.success('Produit publié avec succès !');
        return { success: true, product: response.product };
      } else {
        toast.error(response.message || 'Erreur lors de la publication');
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Erreur lors de la publication';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    submitting,
    submitForValidation,
    updateValidationAction,
    publishProduct,
    validationChoices: VendorValidationService.getValidationChoices(),
  };
}
```

### Hook pour la liste des produits

```typescript
// src/hooks/useVendorProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { VendorValidationService } from '@/services/vendorValidationService';
import { VendorProduct } from '@/types/vendorProduct';

export function useVendorProducts() {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await VendorValidationService.getVendorProducts();
      if (response.success) {
        setProducts(response.products);
      } else {
        setError('Erreur lors du chargement des produits');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProduct = useCallback((productId: number, updates: Partial<VendorProduct>) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, ...updates }
          : p
      )
    );
  }, []);

  const removeProduct = useCallback((productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    updateProduct,
    removeProduct,
  };
}
```

---

## 🎨 Composants UI

### 1. Sélecteur de choix de validation

```tsx
// src/components/ValidationActionSelector.tsx
import React from 'react';
import { PostValidationAction } from '@/types/vendorProduct';
import { useVendorValidation } from '@/hooks/useVendorValidation';

interface ValidationActionSelectorProps {
  productId: number;
  currentAction: PostValidationAction;
  disabled?: boolean;
  isPending?: boolean;
  onActionChange?: (action: PostValidationAction) => void;
}

export const ValidationActionSelector: React.FC<ValidationActionSelectorProps> = ({
  productId,
  currentAction,
  disabled = false,
  isPending = false,
  onActionChange
}) => {
  const { validationChoices, updateValidationAction, loading } = useVendorValidation();

  const handleActionChange = async (action: PostValidationAction) => {
    if (disabled || loading) return;

    if (isPending) {
      // Produit en attente - utiliser l'endpoint de modification
      const result = await updateValidationAction(productId, action);
      if (result.success && onActionChange) {
        onActionChange(action);
      }
    } else {
      // Produit en brouillon - juste notifier le parent
      if (onActionChange) {
        onActionChange(action);
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Que faire après validation admin ?
      </h3>
      
      <div className="space-y-3">
        {validationChoices.map((choice) => (
          <label
            key={choice.action}
            className={`
              flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200
              ${currentAction === choice.action 
                ? `border-${choice.color}-500 bg-${choice.color}-50` 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name={`validationAction-${productId}`}
              value={choice.action}
              checked={currentAction === choice.action}
              onChange={() => handleActionChange(choice.action)}
              disabled={disabled || loading}
              className="mt-1 mr-4 text-blue-600"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{choice.icon}</span>
                <span className="font-semibold text-gray-900">{choice.label}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {choice.description}
              </p>
            </div>
          </label>
        ))}
      </div>
      
      {loading && (
        <div className="text-sm text-blue-600 flex items-center gap-2 mt-3">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Mise à jour en cours...
        </div>
      )}
    </div>
  );
};
```

### 2. Bouton de soumission pour validation

```tsx
// src/components/SubmitForValidationButton.tsx
import React from 'react';
import { PostValidationAction } from '@/types/vendorProduct';
import { useVendorValidation } from '@/hooks/useVendorValidation';

interface SubmitForValidationButtonProps {
  productId: number;
  productName: string;
  postValidationAction: PostValidationAction;
  onSubmitted?: () => void;
  disabled?: boolean;
}

export const SubmitForValidationButton: React.FC<SubmitForValidationButtonProps> = ({
  productId,
  productName,
  postValidationAction,
  onSubmitted,
  disabled = false
}) => {
  const { submitForValidation, submitting } = useVendorValidation();

  const handleSubmit = async () => {
    const actionLabel = postValidationAction === PostValidationAction.AUTO_PUBLISH 
      ? 'publication automatique' 
      : 'mise en brouillon';

    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir soumettre "${productName}" pour validation ?\n\n` +
      `Action après validation : ${actionLabel}`
    );

    if (!confirmed) return;

    const result = await submitForValidation(productId, postValidationAction);
    if (result.success && onSubmitted) {
      onSubmitted();
    }
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={disabled || submitting}
      className="
        inline-flex items-center gap-2 px-6 py-3
        bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
        text-white font-medium rounded-lg transition-colors
        disabled:cursor-not-allowed
      "
    >
      {submitting ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Soumission...
        </>
      ) : (
        <>
          📤 Soumettre pour validation
        </>
      )}
    </button>
  );
};
```

### 3. Bouton de publication manuelle

```tsx
// src/components/PublishValidatedProductButton.tsx
import React from 'react';
import { useVendorValidation } from '@/hooks/useVendorValidation';

interface PublishValidatedProductButtonProps {
  productId: number;
  productName: string;
  onPublished?: () => void;
}

export const PublishValidatedProductButton: React.FC<PublishValidatedProductButtonProps> = ({
  productId,
  productName,
  onPublished
}) => {
  const { publishProduct, loading } = useVendorValidation();

  const handlePublish = async () => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir publier "${productName}" ?\n\n` +
      'Le produit sera visible par tous les clients.'
    );

    if (!confirmed) return;

    const result = await publishProduct(productId);
    if (result.success && onPublished) {
      onPublished();
    }
  };

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="
        inline-flex items-center gap-2 px-4 py-2 
        bg-green-600 hover:bg-green-700 disabled:bg-gray-400
        text-white font-medium rounded-lg transition-colors
        disabled:cursor-not-allowed
      "
    >
      {loading ? (
        <>
          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
          Publication...
        </>
      ) : (
        <>
          🚀 Publier maintenant
        </>
      )}
    </button>
  );
};
```

### 4. Badge de statut intelligent

```tsx
// src/components/ProductStatusBadge.tsx
import React from 'react';
import { VendorProduct, PostValidationAction, VendorProductStatus } from '@/types/vendorProduct';

interface ProductStatusBadgeProps {
  product: VendorProduct;
  showAction?: boolean;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ 
  product, 
  showAction = true 
}) => {
  const getStatusInfo = () => {
    switch (product.status) {
      case VendorProductStatus.PUBLISHED:
        return { 
          text: 'Publié', 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: '✅' 
        };
      
      case VendorProductStatus.PENDING:
        const actionText = showAction 
          ? (product.postValidationAction === PostValidationAction.AUTO_PUBLISH
              ? ' → Publication auto'
              : ' → Brouillon')
          : '';
        return { 
          text: `En attente${actionText}`, 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
          icon: '⏳' 
        };
      
      case VendorProductStatus.DRAFT:
        if (product.isValidated) {
          return { 
            text: 'Validé - Prêt à publier', 
            color: 'bg-blue-100 text-blue-800 border-blue-200', 
            icon: '📝' 
          };
        }
        if (product.rejectionReason) {
          return { 
            text: 'Rejeté', 
            color: 'bg-red-100 text-red-800 border-red-200', 
            icon: '❌' 
          };
        }
        return { 
          text: 'Brouillon', 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: '📝' 
        };
      
      default:
        return { 
          text: 'Inconnu', 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: '❓' 
        };
    }
  };

  const { text, color, icon } = getStatusInfo();

  return (
    <div className="flex flex-col gap-1">
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
        <span>{icon}</span>
        {text}
      </span>
      
      {product.rejectionReason && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
          <strong>Raison :</strong> {product.rejectionReason}
        </div>
      )}
    </div>
  );
};
```

---

## 📄 Pages principales

### 1. Page de création/édition de produit

```tsx
// src/pages/VendorProductForm.tsx
import React, { useState } from 'react';
import { ValidationActionSelector } from '@/components/ValidationActionSelector';
import { SubmitForValidationButton } from '@/components/SubmitForValidationButton';
import { PostValidationAction, VendorProductStatus } from '@/types/vendorProduct';
import { VendorValidationService } from '@/services/vendorValidationService';
import { toast } from 'react-hot-toast';

interface VendorProductFormProps {
  productId?: number; // Si édition
  onSaved?: () => void;
}

export const VendorProductForm: React.FC<VendorProductFormProps> = ({
  productId,
  onSaved
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    postValidationAction: PostValidationAction.AUTO_PUBLISH
  });
  const [saving, setSaving] = useState(false);
  const [savedProduct, setSavedProduct] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await VendorValidationService.createProduct(formData);
      
      if (response.success) {
        toast.success('Produit créé avec succès !');
        setSavedProduct(response.product);
        if (onSaved) onSaved();
      } else {
        toast.error(response.message || 'Erreur lors de la création');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const handleValidationActionChange = (action: PostValidationAction) => {
    setFormData(prev => ({ ...prev, postValidationAction: action }));
  };

  const handleProductSubmitted = () => {
    // Actualiser les données ou rediriger
    if (onSaved) onSaved();
  };

  const canSubmitForValidation = savedProduct && 
    savedProduct.status === VendorProductStatus.DRAFT && 
    !savedProduct.isValidated;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {productId ? 'Modifier le produit' : 'Créer un nouveau produit'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Champs du formulaire existants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du produit
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prix (en centimes)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Sélecteur de choix de validation */}
        <div className="border-t pt-6">
          <ValidationActionSelector
            productId={savedProduct?.id || 0}
            currentAction={formData.postValidationAction}
            disabled={saving}
            onActionChange={handleValidationActionChange}
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={saving}
            className="
              px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
              text-white font-medium rounded-lg transition-colors
            "
          >
            {saving ? 'Sauvegarde...' : (productId ? 'Mettre à jour' : 'Créer le produit')}
          </button>

          {canSubmitForValidation && (
            <SubmitForValidationButton
              productId={savedProduct.id}
              productName={savedProduct.name}
              postValidationAction={formData.postValidationAction}
              onSubmitted={handleProductSubmitted}
            />
          )}
        </div>
      </form>
    </div>
  );
};
```

### 2. Liste des produits vendeur

```tsx
// src/pages/VendorProductsList.tsx
import React from 'react';
import { ProductStatusBadge } from '@/components/ProductStatusBadge';
import { PublishValidatedProductButton } from '@/components/PublishValidatedProductButton';
import { SubmitForValidationButton } from '@/components/SubmitForValidationButton';
import { ValidationActionSelector } from '@/components/ValidationActionSelector';
import { useVendorProducts } from '@/hooks/useVendorProducts';
import { VendorProductStatus, PostValidationAction } from '@/types/vendorProduct';

export const VendorProductsList: React.FC = () => {
  const { products, loading, error, updateProduct, fetchProducts } = useVendorProducts();

  const handleProductPublished = (productId: number) => {
    updateProduct(productId, { status: VendorProductStatus.PUBLISHED });
  };

  const handleProductSubmitted = (productId: number) => {
    updateProduct(productId, { status: VendorProductStatus.PENDING });
  };

  const handleValidationActionChange = (productId: number, action: PostValidationAction) => {
    updateProduct(productId, { postValidationAction: action });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchProducts}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes produits</h1>
        <button
          onClick={() => window.location.href = '/vendor/products/new'}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Nouveau produit
        </button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">Aucun produit trouvé</p>
          <button
            onClick={() => window.location.href = '/vendor/products/new'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Créer votre premier produit
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {products.map(product => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mb-3">{product.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Prix: {(product.price / 100).toFixed(2)}€</span>
                    <span>Stock: {product.stock}</span>
                    <span>Créé: {new Date(product.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                  <ProductStatusBadge product={product} />
                  
                  <div className="flex gap-2">
                    {/* Bouton publier si validé et en brouillon */}
                    {product.isValidated && product.status === VendorProductStatus.DRAFT && (
                      <PublishValidatedProductButton
                        productId={product.id}
                        productName={product.name}
                        onPublished={() => handleProductPublished(product.id)}
                      />
                    )}
                    
                    {/* Bouton soumettre si brouillon non validé */}
                    {product.status === VendorProductStatus.DRAFT && !product.isValidated && !product.rejectionReason && (
                      <SubmitForValidationButton
                        productId={product.id}
                        productName={product.name}
                        postValidationAction={product.postValidationAction}
                        onSubmitted={() => handleProductSubmitted(product.id)}
                      />
                    )}
                    
                    <button
                      onClick={() => window.location.href = `/vendor/products/${product.id}/edit`}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              </div>

              {/* Sélecteur d'action si produit en attente */}
              {product.status === VendorProductStatus.PENDING && (
                <div className="border-t pt-4 mt-4">
                  <ValidationActionSelector
                    productId={product.id}
                    currentAction={product.postValidationAction}
                    isPending={true}
                    onActionChange={(action) => handleValidationActionChange(product.id, action)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 🔔 Système de notifications

```typescript
// src/utils/notifications.ts
import { toast } from 'react-hot-toast';
import { PostValidationAction } from '@/types/vendorProduct';

export const showValidationNotifications = {
  productSubmitted: (action: PostValidationAction) => {
    const message = action === PostValidationAction.AUTO_PUBLISH
      ? '📤 Produit soumis ! Il sera publié automatiquement après validation.'
      : '📤 Produit soumis ! Il sera mis en brouillon après validation.';
    toast.success(message, { duration: 5000 });
  },

  actionUpdated: (action: PostValidationAction) => {
    const message = action === PostValidationAction.AUTO_PUBLISH
      ? '🚀 Choix mis à jour : Publication automatique'
      : '📝 Choix mis à jour : Mise en brouillon';
    toast.success(message, { duration: 4000 });
  },

  productValidated: (isAutoPublish: boolean) => {
    if (isAutoPublish) {
      toast.success('🎉 Votre produit a été validé et publié !', { duration: 6000 });
    } else {
      toast.success('✅ Votre produit a été validé ! Vous pouvez maintenant le publier.', { duration: 6000 });
    }
  },

  productRejected: (reason: string) => {
    toast.error(`❌ Produit rejeté : ${reason}`, { duration: 8000 });
  },

  productPublished: () => {
    toast.success('🚀 Produit publié avec succès !', { duration: 5000 });
  },

  error: (message: string) => {
    toast.error(`❌ ${message}`, { duration: 6000 });
  }
};
```

---

## 🧪 Tests d'intégration

```typescript
// src/__tests__/vendorValidation.test.ts
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VendorProductsList } from '@/pages/VendorProductsList';
import { ValidationActionSelector } from '@/components/ValidationActionSelector';
import { PostValidationAction } from '@/types/vendorProduct';

describe('Système de validation vendeur', () => {
  test('Affiche correctement les choix de validation', () => {
    render(
      <ValidationActionSelector
        productId={1}
        currentAction={PostValidationAction.AUTO_PUBLISH}
      />
    );

    expect(screen.getByText('Publication automatique')).toBeInTheDocument();
    expect(screen.getByText('Mise en brouillon')).toBeInTheDocument();
  });

  test('Permet de changer le choix de validation', async () => {
    const onActionChange = jest.fn();
    
    render(
      <ValidationActionSelector
        productId={1}
        currentAction={PostValidationAction.AUTO_PUBLISH}
        onActionChange={onActionChange}
      />
    );

    const draftOption = screen.getByLabelText(/Mise en brouillon/);
    fireEvent.click(draftOption);

    await waitFor(() => {
      expect(onActionChange).toHaveBeenCalledWith(PostValidationAction.TO_DRAFT);
    });
  });
});
```

---

## 📋 Checklist d'implémentation

### Configuration de base ✅
- [ ] Service API configuré avec intercepteurs
- [ ] Types TypeScript définis
- [ ] Hooks personnalisés créés

### Composants UI ✅
- [ ] `ValidationActionSelector` implémenté
- [ ] `SubmitForValidationButton` implémenté
- [ ] `PublishValidatedProductButton` implémenté
- [ ] `ProductStatusBadge` implémenté

### Pages principales ✅
- [ ] Page de création/édition de produit
- [ ] Liste des produits vendeur
- [ ] Intégration des composants dans les pages

### Fonctionnalités ✅
- [ ] Soumission pour validation
- [ ] Modification du choix en attente
- [ ] Publication manuelle
- [ ] Notifications utilisateur

### Tests ✅
- [ ] Tests unitaires des composants
- [ ] Tests d'intégration du workflow
- [ ] Tests des hooks personnalisés

---

## 🚀 Déploiement

### Variables d'environnement

```env
# .env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_ENV=production
```

### Build et déploiement

```bash
# Installation des dépendances
npm install react-hot-toast

# Build de production
npm run build

# Test en local
npm start
```

---

**🎉 Avec cette implémentation, le frontend du système de validation vendeur sera entièrement fonctionnel !**

Le système offre une expérience utilisateur fluide avec :
- ✅ Choix intuitif de l'action post-validation
- ✅ Feedback visuel en temps réel
- ✅ Notifications appropriées à chaque étape
- ✅ Interface responsive et moderne
- ✅ Gestion d'erreurs robuste
</rewritten_file> 
 