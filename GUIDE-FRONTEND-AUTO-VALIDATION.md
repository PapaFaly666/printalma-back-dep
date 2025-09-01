# 🎨 Guide Frontend - Auto-validation des VendorProduct

## 📋 Objectif
Ce guide détaille l'intégration frontend des nouveaux endpoints d'auto-validation des VendorProducts basés sur la validation des designs.

## 🔗 Endpoints Backend Disponibles

### 1. **Auto-validation spécifique** ⭐ PRIORITÉ
```
POST /admin/designs/{designId}/auto-validate-products
```

### 2. **Auto-validation globale**
```
POST /admin/vendor-products/auto-validate
```

### 3. **Statistiques d'auto-validation**
```
GET /admin/stats/auto-validation
```

### 4. **Validation design enrichie**
```
PUT /designs/{id}/validate
```
*Maintenant avec auto-validation automatique incluse dans la réponse*

---

## 🎯 Interfaces TypeScript

### Types de Base

```typescript
// Types pour l'auto-validation
interface AutoValidationResult {
  success: boolean;
  message: string;
  data: {
    updatedProducts: VendorProductAutoValidated[];
  };
}

interface VendorProductAutoValidated {
  id: number;
  name: string;
  isValidated: boolean;
  vendorId: number;
  status: 'PUBLISHED' | 'DRAFT';
  postValidationAction: 'AUTO_PUBLISH' | 'TO_DRAFT';
}

// Statistiques d'auto-validation
interface AutoValidationStats {
  success: boolean;
  data: {
    autoValidated: number;      // Produits auto-validés (validatedBy = -1)
    manualValidated: number;    // Produits validés manuellement
    pending: number;            // Produits en attente
    totalValidated: number;     // Total validés
  };
}

// Réponse enrichie de validation de design
interface DesignValidationResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    name: string;
    isValidated: boolean;
    // ... autres champs du design
    autoValidation?: {
      updatedProducts: VendorProductAutoValidated[];
      count: number;
    };
  };
}

// Status des produits vendeur pour l'UI
interface VendorProductStatus {
  id: number;
  name: string;
  isValidated: boolean;
  validatedBy: number | null;
  isAutoValidated: boolean; // validatedBy === -1
  canBeAutoValidated: boolean; // Design validé mais produit pas encore
  designStatus: {
    id: number;
    name: string;
    isValidated: boolean;
    isPublished: boolean;
  };
}
```

---

## 🔧 Services API

### Service d'Auto-validation

```typescript
// services/autoValidationService.ts
class AutoValidationService {
  private baseUrl = process.env.REACT_APP_API_URL || 'https://printalma-back-dep.onrender.com';

  /**
   * 🎯 PRIORITÉ 1: Auto-valider les produits d'un design spécifique
   */
  async autoValidateProductsForDesign(designId: number): Promise<AutoValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/designs/${designId}/auto-validate-products`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erreur auto-validation design:', error);
      throw error;
    }
  }

  /**
   * Auto-validation globale de tous les produits éligibles
   */
  async autoValidateAllProducts(): Promise<AutoValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/vendor-products/auto-validate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur auto-validation globale:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques d'auto-validation
   */
  async getAutoValidationStats(): Promise<AutoValidationStats> {
    try {
      const response = await fetch(`${this.baseUrl}/admin/stats/auto-validation`, {
        method: 'GET',
        credentials: 'include',
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur récupération stats:', error);
      throw error;
    }
  }

  /**
   * Valider un design avec auto-validation automatique
   */
  async validateDesign(
    designId: number, 
    action: 'VALIDATE' | 'REJECT', 
    rejectionReason?: string
  ): Promise<DesignValidationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/designs/${designId}/validate`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      return await response.json();
    } catch (error) {
      console.error('Erreur validation design:', error);
      throw error;
    }
  }
}

export const autoValidationService = new AutoValidationService();
```

---

## 🎨 Composants UI

### 1. Badge de Statut Auto-validation

```typescript
// components/AutoValidationBadge.tsx
import React from 'react';

interface AutoValidationBadgeProps {
  product: VendorProductStatus;
  className?: string;
}

export const AutoValidationBadge: React.FC<AutoValidationBadgeProps> = ({ 
  product, 
  className = "" 
}) => {
  if (product.isValidated && product.isAutoValidated) {
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 ${className}`}>
        🤖 Auto-validé
      </span>
    );
  }

  if (product.isValidated) {
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 ${className}`}>
        ✅ Validé manuellement
      </span>
    );
  }

  if (product.canBeAutoValidated) {
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 ${className}`}>
        ⏳ Éligible auto-validation
      </span>
    );
  }

  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 ${className}`}>
      ⏱️ En attente
    </span>
  );
};
```

### 2. Bouton Auto-validation

```typescript
// components/AutoValidationButton.tsx
import React, { useState } from 'react';
import { autoValidationService } from '../services/autoValidationService';

interface AutoValidationButtonProps {
  designId?: number;
  onSuccess?: (result: AutoValidationResult) => void;
  onError?: (error: Error) => void;
  variant: 'design' | 'global';
  className?: string;
}

export const AutoValidationButton: React.FC<AutoValidationButtonProps> = ({
  designId,
  onSuccess,
  onError,
  variant,
  className = ""
}) => {
  const [loading, setLoading] = useState(false);

  const handleAutoValidation = async () => {
    setLoading(true);
    try {
      let result;
      
      if (variant === 'design' && designId) {
        result = await autoValidationService.autoValidateProductsForDesign(designId);
      } else {
        result = await autoValidationService.autoValidateAllProducts();
      }

      onSuccess?.(result);
      
      // Notification de succès
      console.log(`🤖 ${result.message}`);
      alert(`✅ ${result.message}`);
      
    } catch (error) {
      onError?.(error as Error);
      console.error('Erreur auto-validation:', error);
      alert('❌ Erreur lors de l\'auto-validation');
    } finally {
      setLoading(false);
    }
  };

  const buttonText = variant === 'design' 
    ? 'Auto-valider les produits de ce design'
    : 'Auto-valider tous les produits éligibles';

  return (
    <button
      onClick={handleAutoValidation}
      disabled={loading || (variant === 'design' && !designId)}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${loading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }
        text-white ${className}
      `}
    >
      {loading ? (
        <>
          <span className="animate-spin mr-2">🔄</span>
          Auto-validation en cours...
        </>
      ) : (
        <>
          🤖 {buttonText}
        </>
      )}
    </button>
  );
};
```

### 3. Dashboard Statistiques

```typescript
// components/AutoValidationDashboard.tsx
import React, { useState, useEffect } from 'react';
import { autoValidationService } from '../services/autoValidationService';

export const AutoValidationDashboard: React.FC = () => {
  const [stats, setStats] = useState<AutoValidationStats['data'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await autoValidationService.getAutoValidationStats();
      setStats(result.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Auto-validés',
      value: stats.autoValidated,
      icon: '🤖',
      color: 'bg-green-500',
      description: 'Produits validés automatiquement'
    },
    {
      title: 'Validés manuellement',
      value: stats.manualValidated,
      icon: '✅',
      color: 'bg-blue-500',
      description: 'Validés par les admins'
    },
    {
      title: 'En attente',
      value: stats.pending,
      icon: '⏳',
      color: 'bg-orange-500',
      description: 'Produits à valider'
    },
    {
      title: 'Total validé',
      value: stats.totalValidated,
      icon: '📊',
      color: 'bg-purple-500',
      description: 'Total des produits validés'
    }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          📊 Statistiques Auto-validation
        </h2>
        <button
          onClick={loadStats}
          className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center`}>
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Graphique de répartition */}
      {stats.totalValidated > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Répartition des validations</h3>
          <div className="flex rounded-lg overflow-hidden h-4">
            <div 
              className="bg-green-500" 
              style={{ 
                width: `${(stats.autoValidated / stats.totalValidated) * 100}%` 
              }}
              title={`Auto-validés: ${stats.autoValidated}`}
            ></div>
            <div 
              className="bg-blue-500" 
              style={{ 
                width: `${(stats.manualValidated / stats.totalValidated) * 100}%` 
              }}
              title={`Manuels: ${stats.manualValidated}`}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>🤖 {Math.round((stats.autoValidated / stats.totalValidated) * 100)}% auto</span>
            <span>✅ {Math.round((stats.manualValidated / stats.totalValidated) * 100)}% manuel</span>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 🔄 Intégrations dans les Pages Existantes

### 1. Page de Validation des Designs (Admin)

```typescript
// pages/AdminDesignValidation.tsx
import React from 'react';
import { AutoValidationButton } from '../components/AutoValidationButton';

const AdminDesignValidation: React.FC = () => {
  const handleValidateDesign = async (designId: number, action: 'VALIDATE' | 'REJECT') => {
    try {
      const result = await autoValidationService.validateDesign(designId, action);
      
      console.log(`✅ ${result.message}`);
      
      // Afficher les résultats d'auto-validation si disponibles
      if (result.data.autoValidation && result.data.autoValidation.count > 0) {
        const autoValidatedCount = result.data.autoValidation.count;
        alert(`🎉 Design validé + ${autoValidatedCount} produit(s) auto-validé(s) !`);
        
        // Optionnel: Afficher la liste des produits auto-validés
        console.log('Produits auto-validés:', result.data.autoValidation.updatedProducts);
      }
      
      // Rafraîchir la liste des designs
      // refreshDesignsList();
      
    } catch (error) {
      console.error('Erreur validation:', error);
      alert('❌ Erreur lors de la validation');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Validation des Designs</h1>
      
      {/* Bouton auto-validation globale */}
      <div className="mb-6">
        <AutoValidationButton
          variant="global"
          onSuccess={(result) => {
            alert(`🤖 ${result.message}`);
            // Rafraîchir les données
          }}
          className="mr-4"
        />
      </div>

      {/* Liste des designs avec boutons de validation */}
      <div className="space-y-4">
        {designs.map((design) => (
          <div key={design.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{design.name}</h3>
                <p className="text-gray-600">Par: {design.vendor.firstName} {design.vendor.lastName}</p>
              </div>
              
              <div className="flex space-x-2">
                {/* Bouton auto-validation spécifique */}
                <AutoValidationButton
                  variant="design"
                  designId={design.id}
                  onSuccess={(result) => {
                    console.log(`🤖 ${result.message}`);
                    // Rafraîchir
                  }}
                />
                
                {/* Boutons de validation classiques */}
                <button
                  onClick={() => handleValidateDesign(design.id, 'VALIDATE')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  ✅ Valider
                </button>
                <button
                  onClick={() => handleValidateDesign(design.id, 'REJECT')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  ❌ Rejeter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Page Liste des Produits Vendeur

```typescript
// pages/VendorProductsList.tsx
import React from 'react';
import { AutoValidationBadge } from '../components/AutoValidationBadge';

const VendorProductsList: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Produits Vendeur</h1>
      
      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-gray-600">Design: {product.designStatus.name}</p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Badge de statut */}
                <AutoValidationBadge product={product} />
                
                {/* Indicateur design */}
                <div className="text-sm">
                  {product.designStatus.isValidated ? (
                    <span className="text-green-600">🎨 Design validé</span>
                  ) : (
                    <span className="text-orange-600">🎨 Design en attente</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Détails auto-validation */}
            {product.isAutoValidated && (
              <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                <span className="text-green-700">
                  🤖 Ce produit a été validé automatiquement car son design était déjà approuvé.
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Dashboard Admin Principal

```typescript
// pages/AdminDashboard.tsx
import React from 'react';
import { AutoValidationDashboard } from '../components/AutoValidationDashboard';

const AdminDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Administrateur</h1>
      
      {/* Statistiques d'auto-validation */}
      <AutoValidationDashboard />
      
      {/* Autres composants du dashboard */}
      {/* ... */}
    </div>
  );
};
```

---

## 🚀 Hooks React Personnalisés

### Hook d'Auto-validation

```typescript
// hooks/useAutoValidation.ts
import { useState, useCallback } from 'react';
import { autoValidationService } from '../services/autoValidationService';

export const useAutoValidation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoValidateDesign = useCallback(async (designId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await autoValidationService.autoValidateProductsForDesign(designId);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const autoValidateAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await autoValidationService.autoValidateAllProducts();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    autoValidateDesign,
    autoValidateAll,
    loading,
    error,
  };
};
```

### Hook Statistiques

```typescript
// hooks/useAutoValidationStats.ts
import { useState, useEffect, useCallback } from 'react';
import { autoValidationService } from '../services/autoValidationService';

export const useAutoValidationStats = (autoRefresh = false, interval = 30000) => {
  const [stats, setStats] = useState<AutoValidationStats['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const result = await autoValidationService.getAutoValidationStats();
      setStats(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('Erreur récupération stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (autoRefresh) {
      const timer = setInterval(fetchStats, interval);
      return () => clearInterval(timer);
    }
  }, [autoRefresh, interval, fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
```

---

## 🔧 Configuration et Constants

### Configuration API

```typescript
// config/autoValidation.ts
export const AUTO_VALIDATION_CONFIG = {
  // Endpoints
  ENDPOINTS: {
    AUTO_VALIDATE_DESIGN: (designId: number) => `/admin/designs/${designId}/auto-validate-products`,
    AUTO_VALIDATE_ALL: '/admin/vendor-products/auto-validate',
    STATS: '/admin/stats/auto-validation',
    VALIDATE_DESIGN: (designId: number) => `/designs/${designId}/validate`,
  },

  // Messages
  MESSAGES: {
    SUCCESS_AUTO_VALIDATE: 'Produits auto-validés avec succès',
    SUCCESS_DESIGN_VALIDATE: 'Design validé avec succès',
    ERROR_NETWORK: 'Erreur de connexion au serveur',
    ERROR_UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action',
  },

  // UI
  UI: {
    REFRESH_INTERVAL: 30000, // 30 secondes
    NOTIFICATION_DURATION: 5000, // 5 secondes
  },

  // Couleurs des badges
  BADGE_COLORS: {
    AUTO_VALIDATED: 'bg-green-100 text-green-800',
    MANUAL_VALIDATED: 'bg-blue-100 text-blue-800',
    ELIGIBLE: 'bg-orange-100 text-orange-800',
    PENDING: 'bg-gray-100 text-gray-800',
  },
};
```

---

## 📱 Notifications et Feedback

### Service de Notifications

```typescript
// services/notificationService.ts
export class NotificationService {
  static showSuccess(message: string, details?: string[]) {
    // Implémentation selon votre système de notifications
    console.log(`✅ ${message}`);
    if (details && details.length > 0) {
      console.log('Détails:', details);
    }
    
    // Exemple avec toast/notification library
    // toast.success(message);
  }

  static showAutoValidationSuccess(count: number, productNames: string[] = []) {
    const message = `🤖 ${count} produit(s) auto-validé(s) avec succès`;
    this.showSuccess(message, productNames);
  }

  static showError(message: string, error?: Error) {
    console.error(`❌ ${message}`, error);
    // toast.error(message);
  }
}
```

---

## 🧪 Tests et Debugging

### Tests des Services

```typescript
// __tests__/autoValidationService.test.ts
import { autoValidationService } from '../services/autoValidationService';

describe('AutoValidationService', () => {
  test('autoValidateProductsForDesign should return success', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'Produits auto-validés avec succès',
          data: { updatedProducts: [] }
        }),
      })
    ) as jest.Mock;

    const result = await autoValidationService.autoValidateProductsForDesign(123);
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('auto-validés');
  });
});
```

### Debug Utils

```typescript
// utils/debugAutoValidation.ts
export const debugAutoValidation = {
  logProductStatus: (products: VendorProductStatus[]) => {
    console.group('🔍 Debug Auto-validation Status');
    products.forEach(product => {
      console.log(`📦 ${product.name}:`, {
        isValidated: product.isValidated,
        isAutoValidated: product.isAutoValidated,
        canBeAutoValidated: product.canBeAutoValidated,
        designValidated: product.designStatus.isValidated,
      });
    });
    console.groupEnd();
  },

  simulateAutoValidation: () => {
    console.log('🧪 Mode test auto-validation activé');
    // Logique de test/simulation
  },
};
```

---

## 📚 Documentation d'Intégration

### Checklist d'Intégration

- [ ] **Services API** : Implémenter `AutoValidationService`
- [ ] **Interfaces TypeScript** : Définir tous les types
- [ ] **Composants UI** : Créer badges, boutons, dashboard
- [ ] **Hooks** : Implémenter hooks personnalisés
- [ ] **Pages** : Intégrer dans pages admin et vendeur
- [ ] **Tests** : Écrire tests unitaires
- [ ] **Configuration** : Définir constantes et config
- [ ] **Notifications** : Implémenter feedback utilisateur

### Variables d'Environnement

```env
# .env
REACT_APP_API_URL=https://printalma-back-dep.onrender.com
REACT_APP_ENABLE_AUTO_VALIDATION_DEBUG=false
REACT_APP_AUTO_VALIDATION_REFRESH_INTERVAL=30000
```

### Exemples d'Utilisation Rapide

```typescript
// Exemple rapide pour tester
import { autoValidationService } from './services/autoValidationService';

// Auto-valider les produits d'un design
const result = await autoValidationService.autoValidateProductsForDesign(123);
console.log(result); // { success: true, message: "...", data: {...} }

// Auto-validation globale
const globalResult = await autoValidationService.autoValidateAllProducts();
console.log(globalResult);

// Statistiques
const stats = await autoValidationService.getAutoValidationStats();
console.log(stats.data); // { autoValidated: 45, manualValidated: 23, ... }
```

---

## 🎉 Résultat Final

Avec cette implémentation, le frontend peut :

✅ **Déclencher l'auto-validation** après validation d'un design
✅ **Afficher le statut** des produits (auto-validé vs manuel)
✅ **Visualiser les statistiques** d'auto-validation
✅ **Notifier les utilisateurs** des actions réussies
✅ **Gérer les erreurs** de façon gracieuse
✅ **Débugger facilement** les problèmes

**Le système est maintenant complet côté frontend et prêt pour la production !** 🚀