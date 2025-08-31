# 🎯 FRONTEND — GUIDE CHOIX DE PUBLICATION APRÈS VALIDATION ADMIN

> **Objectif :** Permettre au vendeur de choisir entre "Publication automatique" ou "Brouillon" après validation admin, avec gestion complète du workflow.

---

## 1. Contexte de la fonctionnalité 🎨

### Workflow actuel vs nouveau :

**AVANT :**
```
Vendeur → Soumet produit → Admin valide → 🔄 Toujours publié automatiquement
```

**APRÈS :**
```
Vendeur → Choisit action → Soumet produit → Admin valide → 🎯 Action choisie appliquée
```

### Actions disponibles :
- **`AUTO_PUBLISH`** : Publication automatique après validation ✅
- **`TO_DRAFT`** : Mise en brouillon après validation (publication manuelle) 📝

---

## 2. Nouveaux endpoints backend 🔌

### Endpoints vendeur :
```typescript
// Définir le choix de publication
PUT /vendor-product-validation/post-validation-action/:productId
Body: { action: 'AUTO_PUBLISH' | 'TO_DRAFT' }

// Publier manuellement un produit validé en brouillon
POST /vendor-product-validation/publish/:productId
```

### Endpoints admin :
```typescript
// Lister les produits en attente avec leur choix de publication
GET /vendor-product-validation/pending

// Valider un produit (applique automatiquement le choix du vendeur)
POST /vendor-product-validation/validate/:productId
Body: { approved: boolean, rejectionReason?: string }
```

---

## 3. Types TypeScript 📝

```typescript
// src/types/vendorProduct.ts
export enum PostValidationAction {
  AUTO_PUBLISH = 'AUTO_PUBLISH',
  TO_DRAFT = 'TO_DRAFT'
}

export interface VendorProduct {
  id: number;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED';
  isValidated: boolean;
  postValidationAction: PostValidationAction;
  validatedAt?: string;
  rejectionReason?: string;
  // ... autres champs
}

export interface ValidationChoice {
  action: PostValidationAction;
  label: string;
  description: string;
  icon: string;
}
```

---

## 4. Service API 🛠️

```typescript
// src/services/vendorValidationService.ts
import api from './api';
import { PostValidationAction } from '@/types/vendorProduct';

export class VendorValidationService {
  
  /**
   * Définir le choix de publication après validation
   */
  static async setPostValidationAction(productId: number, action: PostValidationAction) {
    const { data } = await api.put(`/vendor-product-validation/post-validation-action/${productId}`, {
      action
    });
    return data;
  }

  /**
   * Publier manuellement un produit validé en brouillon
   */
  static async publishValidatedProduct(productId: number) {
    const { data } = await api.post(`/vendor-product-validation/publish/${productId}`);
    return data;
  }

  /**
   * Obtenir les choix disponibles avec labels
   */
  static getValidationChoices(): ValidationChoice[] {
    return [
      {
        action: PostValidationAction.AUTO_PUBLISH,
        label: 'Publication automatique',
        description: 'Le produit sera publié immédiatement après validation par l\'admin',
        icon: '🚀'
      },
      {
        action: PostValidationAction.TO_DRAFT,
        label: 'Mise en brouillon',
        description: 'Le produit sera mis en brouillon après validation. Vous pourrez le publier quand vous voulez',
        icon: '📝'
      }
    ];
  }
}
```

---

## 5. Hook personnalisé 🪝

```typescript
// src/hooks/useVendorValidation.ts
import { useState, useCallback } from 'react';
import { VendorValidationService } from '@/services/vendorValidationService';
import { PostValidationAction } from '@/types/vendorProduct';
import { toast } from 'react-hot-toast';

export function useVendorValidation() {
  const [loading, setLoading] = useState(false);

  const setValidationAction = useCallback(async (productId: number, action: PostValidationAction) => {
    setLoading(true);
    try {
      await VendorValidationService.setPostValidationAction(productId, action);
      
      const actionLabel = action === PostValidationAction.AUTO_PUBLISH 
        ? 'Publication automatique' 
        : 'Mise en brouillon';
        
      toast.success(`Choix de publication mis à jour : ${actionLabel}`);
      return { success: true };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  const publishProduct = useCallback(async (productId: number) => {
    setLoading(true);
    try {
      await VendorValidationService.publishValidatedProduct(productId);
      toast.success('Produit publié avec succès !');
      return { success: true };
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la publication');
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    setValidationAction,
    publishProduct,
    validationChoices: VendorValidationService.getValidationChoices(),
  };
}
```

---

## 6. Composants UI 🎨

### 6.1 Sélecteur de choix de validation

```tsx
// src/components/ValidationActionSelector.tsx
import React from 'react';
import { PostValidationAction } from '@/types/vendorProduct';
import { useVendorValidation } from '@/hooks/useVendorValidation';

interface ValidationActionSelectorProps {
  productId: number;
  currentAction: PostValidationAction;
  disabled?: boolean;
  onActionChange?: (action: PostValidationAction) => void;
}

export const ValidationActionSelector: React.FC<ValidationActionSelectorProps> = ({
  productId,
  currentAction,
  disabled = false,
  onActionChange
}) => {
  const { validationChoices, setValidationAction, loading } = useVendorValidation();

  const handleActionChange = async (action: PostValidationAction) => {
    const result = await setValidationAction(productId, action);
    if (result.success && onActionChange) {
      onActionChange(action);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">
        Que faire après validation admin ?
      </h3>
      
      <div className="space-y-2">
        {validationChoices.map((choice) => (
          <label
            key={choice.action}
            className={`
              flex items-start p-4 border rounded-lg cursor-pointer transition-all
              ${currentAction === choice.action 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="radio"
              name="validationAction"
              value={choice.action}
              checked={currentAction === choice.action}
              onChange={() => !disabled && handleActionChange(choice.action)}
              disabled={disabled || loading}
              className="mt-1 mr-3"
            />
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{choice.icon}</span>
                <span className="font-medium text-gray-900">{choice.label}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{choice.description}</p>
            </div>
          </label>
        ))}
      </div>
      
      {loading && (
        <div className="text-sm text-blue-600 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Mise à jour en cours...
        </div>
      )}
    </div>
  );
};
```

### 6.2 Bouton de publication manuelle

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
    if (window.confirm(`Êtes-vous sûr de vouloir publier "${productName}" ?`)) {
      const result = await publishProduct(productId);
      if (result.success && onPublished) {
        onPublished();
      }
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

### 6.3 Badge de statut avec action

```tsx
// src/components/ProductStatusBadge.tsx
import React from 'react';
import { VendorProduct, PostValidationAction } from '@/types/vendorProduct';

interface ProductStatusBadgeProps {
  product: VendorProduct;
}

export const ProductStatusBadge: React.FC<ProductStatusBadgeProps> = ({ product }) => {
  const getStatusInfo = () => {
    if (product.status === 'PUBLISHED') {
      return { text: 'Publié', color: 'bg-green-100 text-green-800', icon: '✅' };
    }
    
    if (product.status === 'PENDING') {
      const actionText = product.postValidationAction === PostValidationAction.AUTO_PUBLISH
        ? 'Publication auto après validation'
        : 'Brouillon après validation';
      return { text: `En attente - ${actionText}`, color: 'bg-yellow-100 text-yellow-800', icon: '⏳' };
    }
    
    if (product.status === 'DRAFT') {
      if (product.isValidated) {
        return { text: 'Validé - Prêt à publier', color: 'bg-blue-100 text-blue-800', icon: '📝' };
      }
      return { text: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: '📝' };
    }
    
    return { text: 'Inconnu', color: 'bg-gray-100 text-gray-800', icon: '❓' };
  };

  const { text, color, icon } = getStatusInfo();

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      <span>{icon}</span>
      {text}
    </span>
  );
};
```

---

## 7. Intégration dans les pages existantes 📄

### 7.1 Page de création/édition de produit

```tsx
// src/pages/VendorProductForm.tsx
import React, { useState } from 'react';
import { ValidationActionSelector } from '@/components/ValidationActionSelector';
import { PostValidationAction } from '@/types/vendorProduct';

export const VendorProductForm = () => {
  const [product, setProduct] = useState({
    // ... autres champs
    postValidationAction: PostValidationAction.AUTO_PUBLISH
  });

  const handleValidationActionChange = (action: PostValidationAction) => {
    setProduct(prev => ({ ...prev, postValidationAction: action }));
  };

  return (
    <form>
      {/* ... autres champs du formulaire */}
      
      <div className="border-t pt-6 mt-6">
        <ValidationActionSelector
          productId={product.id}
          currentAction={product.postValidationAction}
          disabled={product.status === 'PENDING' || product.isValidated}
          onActionChange={handleValidationActionChange}
        />
      </div>
      
      {/* ... boutons de soumission */}
    </form>
  );
};
```

### 7.2 Liste des produits vendeur

```tsx
// src/pages/VendorProductsList.tsx
import React from 'react';
import { ProductStatusBadge } from '@/components/ProductStatusBadge';
import { PublishValidatedProductButton } from '@/components/PublishValidatedProductButton';

export const VendorProductsList = () => {
  const [products, setProducts] = useState<VendorProduct[]>([]);

  const handleProductPublished = (productId: number) => {
    setProducts(prev => 
      prev.map(p => 
        p.id === productId 
          ? { ...p, status: 'PUBLISHED' }
          : p
      )
    );
  };

  return (
    <div className="space-y-4">
      {products.map(product => (
        <div key={product.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <ProductStatusBadge product={product} />
            </div>
            
            <div className="flex gap-2">
              {/* Bouton publier si validé et en brouillon */}
              {product.isValidated && product.status === 'DRAFT' && (
                <PublishValidatedProductButton
                  productId={product.id}
                  productName={product.name}
                  onPublished={() => handleProductPublished(product.id)}
                />
              )}
              
              {/* Autres boutons d'action */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 8. Notifications et feedback utilisateur 🔔

```typescript
// src/utils/validationNotifications.ts
import { toast } from 'react-hot-toast';
import { PostValidationAction } from '@/types/vendorProduct';

export const showValidationNotifications = {
  actionUpdated: (action: PostValidationAction) => {
    const message = action === PostValidationAction.AUTO_PUBLISH
      ? '🚀 Votre produit sera publié automatiquement après validation'
      : '📝 Votre produit sera mis en brouillon après validation';
    toast.success(message, { duration: 4000 });
  },

  productValidated: (isAutoPublish: boolean) => {
    if (isAutoPublish) {
      toast.success('🎉 Votre produit a été validé et publié !', { duration: 5000 });
    } else {
      toast.success('✅ Votre produit a été validé ! Vous pouvez maintenant le publier.', { duration: 5000 });
    }
  },

  productRejected: (reason: string) => {
    toast.error(`❌ Produit rejeté : ${reason}`, { duration: 6000 });
  },

  productPublished: () => {
    toast.success('🚀 Produit publié avec succès !', { duration: 4000 });
  }
};
```

---

## 9. Tests et validation ✅

### Checklist de test :

- [ ] **Création produit** : Le choix par défaut est "Publication automatique"
- [ ] **Modification choix** : Possible avant soumission pour validation
- [ ] **Soumission** : Le choix est sauvegardé et affiché côté admin
- [ ] **Validation admin** : L'action choisie est appliquée automatiquement
- [ ] **Publication manuelle** : Fonctionne pour les produits validés en brouillon
- [ ] **Notifications** : L'utilisateur est informé à chaque étape
- [ ] **UI/UX** : Les badges et statuts reflètent l'état réel

### Scénarios de test :

1. **Auto-publish** : Créer → Choisir auto → Soumettre → Admin valide → Vérifie publié
2. **To-draft** : Créer → Choisir brouillon → Soumettre → Admin valide → Vérifie brouillon → Publier manuellement
3. **Rejet** : Créer → Soumettre → Admin rejette → Vérifie statut et notification

---

**Avec cette implémentation, les vendeurs ont un contrôle total sur le timing de publication de leurs produits !** 🎯 
 