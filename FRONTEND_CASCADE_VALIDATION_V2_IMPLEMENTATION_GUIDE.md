# 🚀 GUIDE IMPLÉMENTATION FRONTEND - CASCADE VALIDATION V2

## 📋 Vue d'ensemble

Ce guide détaille l'implémentation frontend du système de cascade validation V2 qui permet aux vendeurs de choisir ce qui arrive à leurs produits après validation admin des designs.

### 🎯 Fonctionnalités Principales

1. **Choix Post-Validation** : Vendeur choisit `AUTO_PUBLISH` ou `TO_DRAFT`
2. **Cascade Automatique** : Validation admin → Mise à jour automatique des produits
3. **Publication Manuelle** : Vendeur peut publier manuellement les produits en brouillon
4. **Suivi en Temps Réel** : Badges et statuts mis à jour automatiquement

## 🏗️ Architecture Frontend

### 1. Types TypeScript

```typescript
// types/cascade-validation.ts

export enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  TO_DRAFT = 'TO_DRAFT'
}

export enum VendorProductStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT',
  PENDING = 'PENDING'
}

export interface VendorProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  stock: number;
  status: VendorProductStatus;
  postValidationAction: PostValidationAction;
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  designId?: number;
  designCloudinaryUrl?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  baseProduct?: {
    id: number;
    name: string;
  };
  design?: {
    id: number;
    name: string;
    imageUrl: string;
    isValidated: boolean;
  };
}

export interface Design {
  id: number;
  name: string;
  imageUrl: string;
  isValidated: boolean;
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
  validatedAt?: string;
  rejectionReason?: string;
}

export interface CascadeValidationStats {
  totalProducts: number;
  pendingProducts: number;
  publishedProducts: number;
  draftProducts: number;
  autoPublishProducts: number;
  toDraftProducts: number;
}
```

### 2. Service API

```typescript
// services/cascade-validation.service.ts

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export class CascadeValidationService {
  private baseURL = `${API_BASE_URL}/vendor-product-validation`;

  /**
   * 🔄 Modifier l'action post-validation d'un produit
   */
  async updatePostValidationAction(
    productId: number, 
    action: PostValidationAction
  ): Promise<VendorProduct> {
    const response = await axios.put(
      `${this.baseURL}/post-validation-action/${productId}`,
      { postValidationAction: action },
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data;
  }

  /**
   * 📦 Publier manuellement un produit validé en brouillon
   */
  async publishValidatedProduct(productId: number): Promise<VendorProduct> {
    const response = await axios.post(
      `${this.baseURL}/publish/${productId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      }
    );
    
    return response.data.data;
  }

  /**
   * 📋 Récupérer les produits en attente de validation (Admin)
   */
  async getPendingProducts(page = 1, limit = 20): Promise<{
    products: VendorProduct[];
    pagination: any;
  }> {
    const response = await axios.get(
      `${this.baseURL}/pending?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      }
    );
    
    return response.data.data;
  }

  /**
   * ✅ Valider un produit spécifique (Admin)
   */
  async validateProduct(productId: number): Promise<VendorProduct> {
    const response = await axios.put(
      `${this.baseURL}/validate/${productId}`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      }
    );
    
    return response.data.data;
  }

  /**
   * 📊 Récupérer les statistiques de validation
   */
  async getValidationStats(): Promise<CascadeValidationStats> {
    const response = await axios.get(
      `${this.baseURL}/stats`,
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`
        }
      }
    );
    
    return response.data.data;
  }

  /**
   * 🎨 Valider un design (Admin)
   */
  async validateDesign(
    designId: number, 
    action: 'VALIDATE' | 'REJECT',
    rejectionReason?: string
  ): Promise<Design> {
    const response = await axios.put(
      `${API_BASE_URL}/designs/${designId}/validate`,
      { 
        action,
        rejectionReason 
      },
      {
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data;
  }

  private getToken(): string {
    return localStorage.getItem('authToken') || '';
  }
}

export const cascadeValidationService = new CascadeValidationService();
```

### 3. Hook React

```typescript
// hooks/useCascadeValidation.ts

import { useState, useEffect } from 'react';
import { cascadeValidationService } from '../services/cascade-validation.service';
import { VendorProduct, PostValidationAction, Design } from '../types/cascade-validation';

export const useCascadeValidation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<CascadeValidationStats | null>(null);

  /**
   * 🔄 Changer l'action post-validation
   */
  const updatePostValidationAction = async (
    productId: number, 
    action: PostValidationAction
  ): Promise<VendorProduct | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedProduct = await cascadeValidationService.updatePostValidationAction(
        productId, 
        action
      );
      
      return updatedProduct;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📦 Publier un produit validé
   */
  const publishValidatedProduct = async (productId: number): Promise<VendorProduct | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const publishedProduct = await cascadeValidationService.publishValidatedProduct(productId);
      
      return publishedProduct;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la publication');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ Valider un design (Admin)
   */
  const validateDesign = async (
    designId: number, 
    action: 'VALIDATE' | 'REJECT',
    rejectionReason?: string
  ): Promise<Design | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const validatedDesign = await cascadeValidationService.validateDesign(
        designId, 
        action,
        rejectionReason
      );
      
      return validatedDesign;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la validation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 📊 Charger les statistiques
   */
  const loadStats = async (): Promise<void> => {
    try {
      const statsData = await cascadeValidationService.getValidationStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Erreur chargement stats:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    loading,
    error,
    stats,
    updatePostValidationAction,
    publishValidatedProduct,
    validateDesign,
    loadStats
  };
};
```

### 4. Composants UI

#### Badge de Statut

```typescript
// components/ProductStatusBadge.tsx

import React from 'react';
import { VendorProductStatus } from '../types/cascade-validation';

interface ProductStatusBadgeProps {
  status: VendorProductStatus;
  isValidated: boolean;
  className?: string;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({
  status,
  isValidated,
  className = ''
}) => {
  const getBadgeConfig = () => {
    if (status === VendorProductStatus.PUBLISHED) {
      return {
        text: 'Publié',
        className: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    
    if (status === VendorProductStatus.DRAFT) {
      if (isValidated) {
        return {
          text: 'Prêt à publier',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      } else {
        return {
          text: 'Brouillon',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      }
    }
    
    if (status === VendorProductStatus.PENDING) {
      return {
        text: 'En attente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      };
    }
    
    return {
      text: 'Inconnu',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const config = getBadgeConfig();

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
      ${config.className} ${className}
    `}>
      {config.text}
    </span>
  );
};
```

#### Sélecteur d'Action Post-Validation

```typescript
// components/PostValidationActionSelector.tsx

import React from 'react';
import { PostValidationAction } from '../types/cascade-validation';

interface PostValidationActionSelectorProps {
  value: PostValidationAction;
  onChange: (action: PostValidationAction) => void;
  disabled?: boolean;
  className?: string;
}

export const PostValidationActionSelector: React.FC<PostValidationActionSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        Après validation du design :
      </label>
      
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.AUTO_PUBLISH}
            checked={value === PostValidationAction.AUTO_PUBLISH}
            onChange={(e) => onChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mr-2"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              📦 Publier automatiquement
            </span>
            <p className="text-xs text-gray-500">
              Le produit sera publié dès que l'admin valide le design
            </p>
          </div>
        </label>
        
        <label className="flex items-center">
          <input
            type="radio"
            name="postValidationAction"
            value={PostValidationAction.TO_DRAFT}
            checked={value === PostValidationAction.TO_DRAFT}
            onChange={(e) => onChange(e.target.value as PostValidationAction)}
            disabled={disabled}
            className="mr-2"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              📝 Mettre en brouillon
            </span>
            <p className="text-xs text-gray-500">
              Je publierai manuellement après validation
            </p>
          </div>
        </label>
      </div>
    </div>
  );
};
```

#### Bouton de Publication

```typescript
// components/PublishButton.tsx

import React from 'react';
import { VendorProduct } from '../types/cascade-validation';

interface PublishButtonProps {
  product: VendorProduct;
  onPublish: (productId: number) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export const PublishButton: React.FC<PublishButtonProps> = ({
  product,
  onPublish,
  loading = false,
  className = ''
}) => {
  const canPublish = product.status === 'DRAFT' && product.isValidated;

  if (!canPublish) {
    return null;
  }

  return (
    <button
      onClick={() => onPublish(product.id)}
      disabled={loading}
      className={`
        inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md
        text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Publication...
        </>
      ) : (
        <>
          📦 Publier
        </>
      )}
    </button>
  );
};
```

### 5. Pages Principales

#### Page Produits Vendeur

```typescript
// pages/VendorProductsPage.tsx

import React, { useState, useEffect } from 'react';
import { VendorProduct, PostValidationAction } from '../types/cascade-validation';
import { useCascadeValidation } from '../hooks/useCascadeValidation';
import { ProductStatusBadge } from '../components/ProductStatusBadge';
import { PostValidationActionSelector } from '../components/PostValidationActionSelector';
import { PublishButton } from '../components/PublishButton';

export const VendorProductsPage: React.FC = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  
  const {
    loading,
    error,
    stats,
    updatePostValidationAction,
    publishValidatedProduct
  } = useCascadeValidation();

  // Charger les produits
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Remplacer par votre service de récupération des produits
      const response = await fetch('/api/vendor/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    }
  };

  const handleUpdateAction = async (productId: number, action: PostValidationAction) => {
    const updatedProduct = await updatePostValidationAction(productId, action);
    if (updatedProduct) {
      setProducts(products.map(p => 
        p.id === productId ? updatedProduct : p
      ));
      setShowActionModal(false);
    }
  };

  const handlePublish = async (productId: number) => {
    const publishedProduct = await publishValidatedProduct(productId);
    if (publishedProduct) {
      setProducts(products.map(p => 
        p.id === productId ? publishedProduct : p
      ));
    }
  };

  const openActionModal = (product: VendorProduct) => {
    setSelectedProduct(product);
    setShowActionModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mes Produits</h1>
        <p className="text-gray-600 mt-2">
          Gérez vos produits et leurs actions post-validation
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
            <div className="text-sm text-gray-500">Total produits</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingProducts}</div>
            <div className="text-sm text-gray-500">En attente</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{stats.publishedProducts}</div>
            <div className="text-sm text-gray-500">Publiés</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats.draftProducts}</div>
            <div className="text-sm text-gray-500">Brouillons</div>
          </div>
        </div>
      )}

      {/* Liste des produits */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {products.map((product) => (
            <li key={product.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-16 w-16">
                    {product.design?.imageUrl && (
                      <img
                        className="h-16 w-16 rounded-lg object-cover"
                        src={product.design.imageUrl}
                        alt={product.name}
                      />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">
                        {product.name}
                      </h3>
                      <ProductStatusBadge
                        status={product.status}
                        isValidated={product.isValidated}
                        className="ml-2"
                      />
                    </div>
                    <p className="text-sm text-gray-500">
                      Prix: {product.price.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-gray-400">
                      Action: {product.postValidationAction === 'AUTO_PUBLISH' ? 'Auto-publication' : 'Brouillon'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openActionModal(product)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    ⚙️ Modifier action
                  </button>
                  
                  <PublishButton
                    product={product}
                    onPublish={handlePublish}
                    loading={loading}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal modification action */}
      {showActionModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Modifier l'action post-validation
              </h3>
              
              <PostValidationActionSelector
                value={selectedProduct.postValidationAction}
                onChange={(action) => handleUpdateAction(selectedProduct.id, action)}
                disabled={loading}
              />
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};
```

#### Page Admin - Validation Designs

```typescript
// pages/AdminDesignValidationPage.tsx

import React, { useState, useEffect } from 'react';
import { Design } from '../types/cascade-validation';
import { useCascadeValidation } from '../hooks/useCascadeValidation';

export const AdminDesignValidationPage: React.FC = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { loading, error, validateDesign } = useCascadeValidation();

  useEffect(() => {
    loadPendingDesigns();
  }, []);

  const loadPendingDesigns = async () => {
    try {
      const response = await fetch('/api/designs/admin/all?status=PENDING', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      setDesigns(data.data.designs);
    } catch (error) {
      console.error('Erreur chargement designs:', error);
    }
  };

  const handleValidateDesign = async (action: 'VALIDATE' | 'REJECT') => {
    if (!selectedDesign) return;

    const validatedDesign = await validateDesign(
      selectedDesign.id,
      action,
      action === 'REJECT' ? rejectionReason : undefined
    );

    if (validatedDesign) {
      setDesigns(designs.filter(d => d.id !== selectedDesign.id));
      setShowValidationModal(false);
      setSelectedDesign(null);
      setRejectionReason('');
    }
  };

  const openValidationModal = (design: Design) => {
    setSelectedDesign(design);
    setShowValidationModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Validation des Designs</h1>
        <p className="text-gray-600 mt-2">
          Validez ou rejetez les designs soumis par les vendeurs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map((design) => (
          <div key={design.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={design.imageUrl}
                alt={design.name}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {design.name}
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  ID: {design.id}
                </span>
                <button
                  onClick={() => openValidationModal(design)}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de validation */}
      {showValidationModal && selectedDesign && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Valider le design: {selectedDesign.name}
              </h3>
              
              <div className="mb-4">
                <img
                  src={selectedDesign.imageUrl}
                  alt={selectedDesign.name}
                  className="w-full h-32 object-cover rounded-md"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du rejet (optionnel)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Expliquez pourquoi ce design est rejeté..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setShowValidationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleValidateDesign('REJECT')}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    ❌ Rejeter
                  </button>
                  <button
                    onClick={() => handleValidateDesign('VALIDATE')}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    ✅ Valider
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};
```

## 🔄 Workflows d'Utilisation

### 1. Workflow Vendeur - Création de Produit

```typescript
// Exemple d'intégration dans un formulaire de création de produit

const CreateProductForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    designId: null,
    postValidationAction: PostValidationAction.AUTO_PUBLISH
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/vendor/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        // Produit créé avec succès
        // Rediriger vers la liste des produits
      }
    } catch (error) {
      console.error('Erreur création produit:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Champs du formulaire */}
      
      <PostValidationActionSelector
        value={formData.postValidationAction}
        onChange={(action) => setFormData({...formData, postValidationAction: action})}
      />
      
      <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md">
        Créer le produit
      </button>
    </form>
  );
};
```

### 2. Workflow Admin - Validation en Lot

```typescript
// Exemple de validation en lot pour les admins

const BatchValidationComponent: React.FC = () => {
  const [selectedDesigns, setSelectedDesigns] = useState<number[]>([]);
  const { validateDesign } = useCascadeValidation();

  const handleBatchValidate = async () => {
    for (const designId of selectedDesigns) {
      try {
        await validateDesign(designId, 'VALIDATE');
      } catch (error) {
        console.error(`Erreur validation design ${designId}:`, error);
      }
    }
    
    // Recharger la liste
    setSelectedDesigns([]);
  };

  return (
    <div>
      <button
        onClick={handleBatchValidate}
        disabled={selectedDesigns.length === 0}
        className="bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
      >
        Valider {selectedDesigns.length} design(s)
      </button>
    </div>
  );
};
```

## 🎯 Points Clés d'Implémentation

### 1. Gestion des États

```typescript
// Logique de gestion des états des produits
const getProductDisplayStatus = (product: VendorProduct) => {
  if (product.status === 'PUBLISHED') {
    return { text: 'Publié', color: 'green' };
  }
  
  if (product.status === 'DRAFT' && product.isValidated) {
    return { text: 'Prêt à publier', color: 'blue' };
  }
  
  if (product.status === 'PENDING') {
    return { text: 'En attente de validation', color: 'yellow' };
  }
  
  return { text: 'Brouillon', color: 'gray' };
};
```

### 2. Notifications en Temps Réel

```typescript
// Utilisation de WebSockets pour les notifications en temps réel
useEffect(() => {
  const socket = new WebSocket('ws://localhost:3000/notifications');
  
  socket.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    
    if (notification.type === 'DESIGN_VALIDATED') {
      // Recharger les produits pour refléter les changements
      loadProducts();
    }
    
    if (notification.type === 'PRODUCT_AUTO_PUBLISHED') {
      // Afficher une notification de succès
      showNotification('Produit publié automatiquement !');
    }
  };
  
  return () => socket.close();
}, []);
```

### 3. Validation Côté Client

```typescript
// Validation des actions avant envoi
const validateAction = (product: VendorProduct, action: PostValidationAction) => {
  if (product.isValidated && action === PostValidationAction.AUTO_PUBLISH) {
    return { valid: false, message: 'Le produit est déjà validé' };
  }
  
  return { valid: true };
};
```

## 🚀 Déploiement et Tests

### 1. Tests Unitaires

```typescript
// __tests__/cascade-validation.test.ts

import { render, screen, fireEvent } from '@testing-library/react';
import { PostValidationActionSelector } from '../components/PostValidationActionSelector';

describe('PostValidationActionSelector', () => {
  test('renders both options', () => {
    render(
      <PostValidationActionSelector 
        value={PostValidationAction.AUTO_PUBLISH}
        onChange={jest.fn()}
      />
    );
    
    expect(screen.getByText('Publier automatiquement')).toBeInTheDocument();
    expect(screen.getByText('Mettre en brouillon')).toBeInTheDocument();
  });
});
```

### 2. Tests d'Intégration

```typescript
// __tests__/vendor-products-flow.test.ts

describe('Vendor Products Flow', () => {
  test('should update post validation action', async () => {
    // Test du workflow complet
    // 1. Créer un produit
    // 2. Modifier l'action post-validation
    // 3. Valider le design (simulation)
    // 4. Vérifier que le produit est mis à jour
  });
});
```

## 📋 Checklist de Déploiement

- [ ] ✅ Types TypeScript implémentés
- [ ] ✅ Service API configuré
- [ ] ✅ Hook React créé
- [ ] ✅ Composants UI développés
- [ ] ✅ Pages principales intégrées
- [ ] ✅ Gestion des erreurs implémentée
- [ ] ✅ Notifications en temps réel configurées
- [ ] ✅ Tests unitaires écrits
- [ ] ✅ Tests d'intégration validés
- [ ] ✅ Documentation utilisateur créée

## 🎯 Résumé

Ce guide fournit une implémentation complète du système de cascade validation V2 pour le frontend. Les vendeurs peuvent maintenant :

1. **Choisir l'action post-validation** lors de la création de produits
2. **Voir les statuts mis à jour automatiquement** après validation admin
3. **Publier manuellement** les produits validés en brouillon
4. **Suivre les statistiques** de validation en temps réel

Les admins peuvent :

1. **Valider les designs** avec cascade automatique
2. **Voir l'impact** de leurs validations sur les produits
3. **Gérer les validations en lot** pour plus d'efficacité

Le système garantit une expérience utilisateur fluide avec des mises à jour en temps réel et une gestion robuste des erreurs. 