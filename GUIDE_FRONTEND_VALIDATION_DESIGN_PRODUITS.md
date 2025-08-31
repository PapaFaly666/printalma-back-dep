# Guide Frontend - Système de Validation Design → VendorProduct

## 🎯 Objectif

Ce guide explique comment intégrer dans votre frontend React le nouveau système de validation où les statuts des produits vendeur reflètent directement l'état de validation du design associé.

## 📋 Résumé du Système Backend

### Nouveaux Statuts
```typescript
type ProductStatus = 'DRAFT' | 'PENDING' | 'VALIDATED' | 'PUBLISHED';
```

### Workflow Automatique
1. **Design créé** → `isDraft: true`
2. **Design soumis** → `isPending: true` + **VendorProducts → `PENDING`**
3. **Admin valide** → `isValidated: true` + **VendorProducts → `VALIDATED`**
4. **Admin rejette** → VendorProducts → `DRAFT`

---

## 🔧 1. Types TypeScript

Créez ces interfaces dans votre projet :

```typescript
// types/api.ts

export interface Design {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl: string;
  thumbnailUrl?: string;
  
  // Statuts
  isDraft: boolean;
  isPending: boolean;
  isValidated: boolean;
  isPublished: boolean;
  
  // Validation
  validatedAt?: string;
  validatorName?: string;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  
  // Métadonnées
  tags: string[];
  usageCount: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorProduct {
  id: number;
  vendorId: number;
  baseProductId: number;
  designId?: number;          // 🆕 Lien vers le design
  price: number;
  status: 'DRAFT' | 'PENDING' | 'VALIDATED' | 'PUBLISHED';  // 🆕 Nouveaux statuts
  
  // Métadonnées
  vendorName: string;
  vendorDescription?: string;
  vendorStock: number;
  designUrl: string;
  mockupUrl?: string;
  
  // Validation
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  
  // Relations
  design?: Design;            // 🆕 Design associé
  selectedSizes: any[];
  selectedColors: any[];
  images: {
    total: number;
    colorImages: any[];
    primaryImageUrl?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}
```

---

## 🌐 2. Services API

### Service Design

```typescript
// services/designService.ts

class DesignService {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

  // Créer un design
  async createDesign(designData: FormData): Promise<Design> {
    const response = await fetch(`${this.baseURL}/api/designs`, {
      method: 'POST',
      credentials: 'include',
      body: designData,
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la création du design');
    }
    
    return response.json();
  }

  // Soumettre pour validation (🆕 NOUVEAU)
  async submitForValidation(designId: number): Promise<Design> {
    const response = await fetch(`${this.baseURL}/api/designs/${designId}/submit-for-validation`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la soumission pour validation');
    }
    
    return response.json();
  }

  // Récupérer les designs du vendeur
  async getVendorDesigns(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{ designs: Design[], pagination: any, stats: any }> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await fetch(`${this.baseURL}/api/designs?${queryString}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des designs');
    }
    
    return response.json();
  }

  // Admin: Récupérer designs en attente
  async getPendingDesigns(params?: any): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseURL}/api/designs/admin/pending?${queryString}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des designs en attente');
    }
    
    return response.json();
  }

  // Admin: Valider un design (🆕 NOUVEAU)
  async validateDesign(designId: number, approved: boolean, rejectionReason?: string): Promise<Design> {
    const response = await fetch(`${this.baseURL}/api/designs/${designId}/validate`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved, rejectionReason }),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la validation du design');
    }
    
    return response.json();
  }
}

export const designService = new DesignService();
```

### Service VendorProduct

```typescript
// services/vendorProductService.ts

class VendorProductService {
  private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

  // Créer un produit vendeur
  async publishProduct(productData: any): Promise<any> {
    const response = await fetch(`${this.baseURL}/api/vendor/publish`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la création du produit');
    }
    
    return response.json();
  }

  // Récupérer les produits du vendeur
  async getVendorProducts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }): Promise<{ data: { products: VendorProduct[], pagination: any } }> {
    const queryString = new URLSearchParams(params as any).toString();
    const response = await fetch(`${this.baseURL}/api/vendor/products?${queryString}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des produits');
    }
    
    return response.json();
  }

  // Récupérer un produit spécifique
  async getVendorProduct(productId: number): Promise<{ data: VendorProduct }> {
    const response = await fetch(`${this.baseURL}/api/vendor/products/${productId}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du produit');
    }
    
    return response.json();
  }
}

export const vendorProductService = new VendorProductService();
```

---

## 🎨 3. Composants UI

### Badge de Statut Produit

```tsx
// components/ProductStatusBadge.tsx

interface ProductStatusBadgeProps {
  product: VendorProduct;
  design?: Design;
}

export function ProductStatusBadge({ product, design }: ProductStatusBadgeProps) {
  const getStatusInfo = () => {
    switch (product.status) {
      case 'VALIDATED':
        return {
          label: '✅ Validé',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Produit validé et disponible à la vente'
        };
      
      case 'PENDING':
        return {
          label: '⏳ En attente',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: design 
            ? `En attente de validation du design "${design.name}"`
            : 'En attente de validation du design'
        };
      
      case 'DRAFT':
        return {
          label: '📝 Brouillon',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: product.rejectionReason 
            ? `Rejeté: ${product.rejectionReason}`
            : 'Produit en cours d\'édition'
        };
      
      case 'PUBLISHED':
        return {
          label: '🔄 Publié (ancien)',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Statut publié (ancien système)'
        };
      
      default:
        return {
          label: '❓ Inconnu',
          color: 'bg-gray-100 text-gray-600 border-gray-200',
          description: 'Statut inconnu'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="group relative">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
      
      {/* Tooltip */}
      <div className="invisible group-hover:visible absolute z-10 w-64 p-2 mt-2 text-sm bg-gray-900 text-white rounded-md shadow-lg">
        {statusInfo.description}
        {product.submittedForValidationAt && (
          <div className="mt-1 text-xs text-gray-300">
            Soumis le {new Date(product.submittedForValidationAt).toLocaleDateString('fr-FR')}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Badge de Statut Design

```tsx
// components/DesignStatusBadge.tsx

interface DesignStatusBadgeProps {
  design: Design;
  showActions?: boolean;
  onSubmitForValidation?: () => void;
}

export function DesignStatusBadge({ design, showActions, onSubmitForValidation }: DesignStatusBadgeProps) {
  const getStatusInfo = () => {
    if (design.isValidated) {
      return {
        label: '✅ Validé',
        color: 'bg-green-100 text-green-800',
        canSubmit: false
      };
    }
    
    if (design.isPending) {
      return {
        label: '⏳ En attente',
        color: 'bg-yellow-100 text-yellow-800',
        canSubmit: false
      };
    }
    
    if (design.rejectionReason) {
      return {
        label: '❌ Rejeté',
        color: 'bg-red-100 text-red-800',
        canSubmit: true,
        reason: design.rejectionReason
      };
    }
    
    if (design.isDraft) {
      return {
        label: '📝 Brouillon',
        color: 'bg-gray-100 text-gray-800',
        canSubmit: true
      };
    }
    
    return {
      label: '❓ Inconnu',
      color: 'bg-gray-100 text-gray-600',
      canSubmit: false
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
      
      {showActions && statusInfo.canSubmit && onSubmitForValidation && (
        <button
          onClick={onSubmitForValidation}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
        >
          Soumettre pour validation
        </button>
      )}
      
      {statusInfo.reason && (
        <div className="text-xs text-red-600 max-w-xs truncate" title={statusInfo.reason}>
          Raison: {statusInfo.reason}
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 4. Hooks de Synchronisation

### Hook de Suivi des Designs

```tsx
// hooks/useDesignSync.ts

import { useEffect, useState } from 'react';
import { designService } from '../services/designService';
import { Design } from '../types/api';

export function useDesignSync(designId?: number) {
  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchDesign = async () => {
    if (!designId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Récupérer le design mis à jour
      const designs = await designService.getVendorDesigns();
      const updatedDesign = designs.designs.find(d => d.id === designId);
      setDesign(updatedDesign || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const submitForValidation = async () => {
    if (!designId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const updatedDesign = await designService.submitForValidation(designId);
      setDesign(updatedDesign);
      return updatedDesign;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchDesign();
  }, [designId]);

  return {
    design,
    loading,
    error,
    refetchDesign,
    submitForValidation
  };
}
```

### Hook de Suivi des Produits

```tsx
// hooks/useProductsSync.ts

import { useEffect, useState } from 'react';
import { vendorProductService } from '../services/vendorProductService';
import { VendorProduct } from '../types/api';

export function useProductsSync(filters?: { status?: string; designId?: number }) {
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await vendorProductService.getVendorProducts({
        status: filters?.status,
        limit: 100  // Récupérer tous les produits
      });
      
      let filteredProducts = response.data.products;
      
      // Filtrer par design si spécifié
      if (filters?.designId) {
        filteredProducts = filteredProducts.filter(p => p.designId === filters.designId);
      }
      
      setProducts(filteredProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchProducts();
  }, [filters?.status, filters?.designId]);

  return {
    products,
    loading,
    error,
    refetchProducts
  };
}
```

---

## 📱 5. Pages et Composants

### Page Designs du Vendeur

```tsx
// pages/vendor/designs.tsx

import { useState } from 'react';
import { useDesignSync } from '../../hooks/useDesignSync';
import { useProductsSync } from '../../hooks/useProductsSync';
import { DesignStatusBadge } from '../../components/DesignStatusBadge';
import { ProductStatusBadge } from '../../components/ProductStatusBadge';

export default function VendorDesignsPage() {
  const [selectedDesign, setSelectedDesign] = useState<number | null>(null);
  const { products, refetchProducts } = useProductsSync({ 
    designId: selectedDesign || undefined 
  });

  const handleSubmitForValidation = async (designId: number) => {
    try {
      await designService.submitForValidation(designId);
      
      // Rafraîchir les produits liés (ils passent en PENDING automatiquement)
      await refetchProducts();
      
      // Notification de succès
      alert('Design soumis pour validation ! Vos produits associés sont maintenant en attente.');
    } catch (error) {
      alert('Erreur lors de la soumission');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mes Designs</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des designs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Designs</h2>
          
          {designs.map(design => (
            <div 
              key={design.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedDesign === design.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedDesign(design.id)}
            >
              <div className="flex items-center gap-3">
                <img 
                  src={design.thumbnailUrl || design.imageUrl} 
                  alt={design.name}
                  className="w-16 h-16 object-cover rounded"
                />
                
                <div className="flex-1">
                  <h3 className="font-medium">{design.name}</h3>
                  <p className="text-sm text-gray-600">{design.description}</p>
                  
                  <div className="mt-2">
                    <DesignStatusBadge 
                      design={design}
                      showActions
                      onSubmitForValidation={() => handleSubmitForValidation(design.id)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Produits associés au design sélectionné */}
        {selectedDesign && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              Produits utilisant ce design ({products.length})
            </h2>
            
            {products.length === 0 ? (
              <p className="text-gray-500">Aucun produit créé avec ce design</p>
            ) : (
              products.map(product => (
                <div key={product.id} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src={product.images.primaryImageUrl || product.designUrl} 
                      alt={product.vendorName}
                      className="w-16 h-16 object-cover rounded"
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-medium">{product.vendorName}</h3>
                      <p className="text-sm text-gray-600">{product.price}€</p>
                      
                      <div className="mt-2">
                        <ProductStatusBadge product={product} />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Page Dashboard Admin

```tsx
// pages/admin/designs-validation.tsx

import { useState, useEffect } from 'react';
import { designService } from '../../services/designService';
import { Design } from '../../types/api';

export default function AdminDesignsValidationPage() {
  const [pendingDesigns, setPendingDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPendingDesigns = async () => {
    setLoading(true);
    try {
      const response = await designService.getPendingDesigns();
      setPendingDesigns(response.designs);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateDesign = async (designId: number, approved: boolean, reason?: string) => {
    try {
      await designService.validateDesign(designId, approved, reason);
      
      // Rafraîchir la liste
      await loadPendingDesigns();
      
      const message = approved 
        ? '✅ Design validé ! Tous les produits associés sont maintenant disponibles.'
        : '❌ Design rejeté. Les produits associés sont repassés en brouillon.';
      
      alert(message);
    } catch (error) {
      alert('Erreur lors de la validation');
    }
  };

  useEffect(() => {
    loadPendingDesigns();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Validation des Designs</h1>
      
      {loading ? (
        <div>Chargement...</div>
      ) : pendingDesigns.length === 0 ? (
        <div className="text-gray-500">Aucun design en attente de validation</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingDesigns.map(design => (
            <div key={design.id} className="border rounded-lg p-4">
              <img 
                src={design.imageUrl} 
                alt={design.name}
                className="w-full h-48 object-cover rounded mb-4"
              />
              
              <h3 className="font-semibold text-lg mb-2">{design.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{design.description}</p>
              <p className="text-blue-600 font-medium mb-4">{design.price}€</p>
              
              <div className="text-xs text-gray-500 mb-4">
                Soumis le {new Date(design.submittedForValidationAt!).toLocaleDateString('fr-FR')}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleValidateDesign(design.id, true)}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                >
                  ✅ Approuver
                </button>
                
                <button
                  onClick={() => {
                    const reason = prompt('Raison du rejet (optionnel):');
                    if (reason !== null) {
                      handleValidateDesign(design.id, false, reason);
                    }
                  }}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                >
                  ❌ Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🔔 6. Notifications en Temps Réel (Optionnel)

### WebSocket Hook

```tsx
// hooks/useWebSocket.ts

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(onDesignValidated?: (payload: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connexion WebSocket
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004', {
      withCredentials: true
    });

    // Écouter les événements de validation
    if (onDesignValidated) {
      socketRef.current.on('design.validated', onDesignValidated);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [onDesignValidated]);

  return socketRef.current;
}
```

### Utilisation des Notifications

```tsx
// Dans votre composant principal

export function VendorDashboard() {
  const { refetchProducts } = useProductsSync();
  const { refetchDesigns } = useDesignSync();

  // Écouter les notifications de validation
  useWebSocket((payload) => {
    console.log('Design validé:', payload);
    
    // Rafraîchir automatiquement les données
    refetchDesigns();
    refetchProducts();
    
    // Afficher une notification
    toast.success(
      payload.approved 
        ? '🎉 Votre design a été validé ! Vos produits sont maintenant disponibles.'
        : '⚠️ Votre design a été rejeté. Veuillez le modifier.'
    );
  });

  return (
    // Votre interface...
  );
}
```

---

## 🎯 7. Points Clés d'Intégration

### ✅ Actions Importantes

1. **Après création d'un design** → Proposer de le soumettre pour validation
2. **Après soumission** → Afficher que les produits associés sont en `PENDING`
3. **Après validation** → Montrer que les produits passent en `VALIDATED`
4. **Filtrage** → Permettre de filtrer les produits par statut
5. **Notifications** → Alerter l'utilisateur des changements d'état

### 🔄 Synchronisation

```tsx
// Exemple de synchronisation après validation
const handleDesignSubmission = async (designId: number) => {
  try {
    // 1. Soumettre le design
    await designService.submitForValidation(designId);
    
    // 2. Rafraîchir les designs
    await refetchDesigns();
    
    // 3. Rafraîchir les produits (ils passent en PENDING automatiquement)
    await refetchProducts();
    
    // 4. Notification utilisateur
    toast.info('Design soumis ! Vos produits sont en attente de validation.');
    
  } catch (error) {
    toast.error('Erreur lors de la soumission');
  }
};
```

---

## 📋 8. Checklist d'Implémentation

### Backend (✅ Fait)
- [x] Enum `PublicationStatus` étendu
- [x] Synchronisation automatique Design → VendorProduct
- [x] Endpoints de validation admin
- [x] Système de notifications email
- [x] Logique de création de produits mise à jour

### Frontend (À faire)
- [ ] Types TypeScript créés
- [ ] Services API implémentés
- [ ] Composants de badges de statut
- [ ] Hooks de synchronisation
- [ ] Pages vendeur mises à jour
- [ ] Interface admin de validation
- [ ] Notifications en temps réel (optionnel)
- [ ] Tests d'intégration

### Tests
- [ ] Créer un design → vérifier statut `DRAFT`
- [ ] Soumettre design → vérifier produits passent en `PENDING`
- [ ] Admin valide → vérifier produits passent en `VALIDATED`
- [ ] Admin rejette → vérifier produits repassent en `DRAFT`
- [ ] Créer produit avec design validé → vérifier statut `VALIDATED`

---

## 🎉 Résultat Final

Avec cette implémentation, votre frontend aura :

✅ **Synchronisation automatique** entre designs et produits  
✅ **Interface claire** pour les vendeurs et admins  
✅ **Workflow transparent** de validation  
✅ **Notifications** en temps réel  
✅ **UX optimisée** avec statuts visuels  

Le vendeur voit immédiatement l'impact de la validation d'un design sur tous ses produits associés, et l'admin peut valider efficacement avec un effet automatique sur tous les produits liés ! 🚀