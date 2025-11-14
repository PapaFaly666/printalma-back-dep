# 🚀 Guide d'implémentation de la sauvegarde en BDD

Ce guide explique comment implémenter la stratégie hybride de sauvegarde des personnalisations (localStorage + Base de données) selon la documentation.

## 📋 Vue d'ensemble

Le backend est **entièrement prêt** avec tous les endpoints nécessaires :
- ✅ Sauvegarde/mise à jour de personnalisations
- ✅ Récupération par ID, utilisateur ou session
- ✅ Migration guest → utilisateur
- ✅ Récupération de drafts par produit
- ✅ Index de performance optimisés

**Ce guide se concentre sur l'implémentation frontend.**

---

## 🎯 Objectifs

1. Sauvegarder en localStorage (immédiat) + BDD (debounced 3s)
2. Restaurer depuis BDD si disponible, sinon localStorage
3. Migrer les données guest lors de la connexion
4. Gérer les sessions guest avec un `sessionId`

---

## 📦 Étape 1 : Créer le service frontend

**Fichier** : `src/services/customizationService.ts` (frontend)

```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

interface DesignElement {
  id: string;
  type: 'text' | 'image';
  // ... autres propriétés
}

interface CustomizationData {
  productId: number;
  colorVariationId: number;
  viewId: number;
  designElements: DesignElement[];
  sizeSelections?: Array<{ size: string; quantity: number }>;
  sessionId?: string;
  previewImageUrl?: string;
}

class CustomizationService {
  /**
   * Génère ou récupère le sessionId pour les guests
   */
  getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('guest-session-id');

    if (!sessionId) {
      sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guest-session-id', sessionId);
    }

    return sessionId;
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth-token');
  }

  /**
   * Récupère le token d'authentification
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('auth-token');
  }

  /**
   * Sauvegarder une personnalisation
   */
  async saveCustomization(data: CustomizationData, customizationId?: number) {
    const token = this.getAuthToken();
    const sessionId = this.getOrCreateSessionId();

    const url = customizationId
      ? `${API_BASE}/customizations?customizationId=${customizationId}`
      : `${API_BASE}/customizations`;

    const payload = {
      ...data,
      sessionId: token ? undefined : sessionId
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(url, payload, { headers });
    return response.data;
  }

  /**
   * Récupérer une personnalisation par ID
   */
  async getCustomization(id: number) {
    const response = await axios.get(`${API_BASE}/customizations/${id}`);
    return response.data;
  }

  /**
   * Récupérer mes personnalisations (utilisateur connecté)
   */
  async getMyCustomizations(status?: string) {
    const token = this.getAuthToken();

    if (!token) {
      throw new Error('User not authenticated');
    }

    const url = status
      ? `${API_BASE}/customizations/user/me?status=${status}`
      : `${API_BASE}/customizations/user/me`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   */
  async getSessionCustomizations(sessionId: string, status?: string) {
    const url = status
      ? `${API_BASE}/customizations/session/${sessionId}?status=${status}`
      : `${API_BASE}/customizations/session/${sessionId}`;

    const response = await axios.get(url);
    return response.data;
  }

  /**
   * Récupérer le draft pour un produit spécifique
   */
  async getDraftForProduct(productId: number) {
    const token = this.getAuthToken();
    const sessionId = this.getOrCreateSessionId();

    const url = token
      ? `${API_BASE}/customizations/product/${productId}/draft`
      : `${API_BASE}/customizations/product/${productId}/draft?sessionId=${sessionId}`;

    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await axios.get(url, { headers });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Migrer les personnalisations guest vers un utilisateur
   */
  async migrateGuestCustomizations() {
    const token = this.getAuthToken();
    const sessionId = localStorage.getItem('guest-session-id');

    if (!token) {
      throw new Error('User not authenticated');
    }

    if (!sessionId) {
      return { migrated: 0, customizations: [] };
    }

    const response = await axios.post(
      `${API_BASE}/customizations/migrate`,
      { sessionId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Nettoyer le sessionId après migration
    localStorage.removeItem('guest-session-id');

    return response.data;
  }

  /**
   * Mettre à jour une personnalisation
   */
  async updateCustomization(id: number, data: Partial<CustomizationData>) {
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.put(
      `${API_BASE}/customizations/${id}`,
      data,
      { headers }
    );

    return response.data;
  }

  /**
   * Supprimer une personnalisation
   */
  async deleteCustomization(id: number) {
    const token = this.getAuthToken();

    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    await axios.delete(`${API_BASE}/customizations/${id}`, { headers });
  }
}

export const customizationService = new CustomizationService();
```

---

## 🔄 Étape 2 : Hook de debounce pour la sauvegarde

**Fichier** : `src/hooks/useDebouncedSave.ts`

```typescript
import { useRef, useCallback } from 'react';

export const useDebouncedSave = (
  saveFunction: () => void | Promise<void>,
  delay: number = 3000
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      saveFunction();
    }, delay);
  }, [saveFunction, delay]);
};
```

---

## 🎨 Étape 3 : Implémenter dans la page de personnalisation

**Fichier** : `src/pages/CustomerProductCustomizationPage.tsx` (ou votre équivalent)

### 3.1 Ajouter les states nécessaires

```typescript
import { customizationService } from '@/services/customizationService';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';

const [customizationId, setCustomizationId] = useState<number | null>(null);
const [isSaving, setIsSaving] = useState(false);
const isRestoringRef = useRef(false);
const hasRestoredRef = useRef(false);
```

### 3.2 Fonction de sauvegarde en BDD

```typescript
/**
 * Sauvegarder en base de données
 */
const saveToDatabase = async () => {
  if (!product || isRestoringRef.current) return;

  try {
    setIsSaving(true);

    const customizationData = {
      productId: product.id,
      colorVariationId: selectedColorVariation?.id || 0,
      viewId: selectedView?.id || 0,
      designElements: designElements,
      sessionId: customizationService.getOrCreateSessionId(),
    };

    const result = await customizationService.saveCustomization(
      customizationData,
      customizationId || undefined
    );

    // Mettre à jour l'ID si c'est une nouvelle personnalisation
    if (!customizationId && result.id) {
      setCustomizationId(result.id);

      // Sauvegarder l'ID dans localStorage pour la prochaine fois
      const storageKey = `design-data-product-${product.id}`;
      const currentData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      currentData.customizationId = result.id;
      localStorage.setItem(storageKey, JSON.stringify(currentData));
    }

    console.log('✅ Sauvegarde BDD réussie:', result);

    return result;
  } catch (error) {
    console.error('❌ Erreur sauvegarde BDD:', error);

    // Afficher un toast d'erreur (optionnel)
    // toast.error('Erreur de sauvegarde sur le serveur');
  } finally {
    setIsSaving(false);
  }
};
```

### 3.3 Sauvegarde debounced

```typescript
// Hook de debounce
const debouncedSaveToDatabase = useDebouncedSave(saveToDatabase, 3000);

// Auto-sauvegarde à chaque modification
useEffect(() => {
  if (!product || isRestoringRef.current || !hasRestoredRef.current) return;

  // 1. Sauvegarde immédiate dans localStorage
  const storageKey = `design-data-product-${product.id}`;
  const dataToSave = {
    elements: designElements,
    colorVariationId: selectedColorVariation?.id,
    viewId: selectedView?.id,
    customizationId: customizationId,
    timestamp: Date.now()
  };

  localStorage.setItem(storageKey, JSON.stringify(dataToSave));
  console.log('💾 Auto-sauvegarde localStorage');

  // 2. Sauvegarde différée en BDD (après 3s d'inactivité)
  debouncedSaveToDatabase();

}, [designElements, selectedColorVariation, selectedView, product, customizationId]);
```

### 3.4 Restauration depuis BDD

```typescript
// Restauration au chargement de la page
useEffect(() => {
  if (!product || hasRestoredRef.current) return;

  const restoreData = async () => {
    try {
      isRestoringRef.current = true;
      let dataToRestore = null;

      // 1. Charger depuis localStorage
      const storageKey = `design-data-product-${product.id}`;
      const saved = localStorage.getItem(storageKey);
      let localData = null;

      if (saved) {
        localData = JSON.parse(saved);
      }

      // 2. Charger depuis la BDD si un ID existe ou chercher un draft
      try {
        let dbData = null;

        if (localData?.customizationId) {
          // Charger par ID
          console.log('🔍 Chargement depuis BDD par ID:', localData.customizationId);
          dbData = await customizationService.getCustomization(localData.customizationId);
        } else {
          // Chercher un draft pour ce produit
          console.log('🔍 Recherche draft pour produit:', product.id);
          dbData = await customizationService.getDraftForProduct(product.id);
        }

        if (dbData) {
          dataToRestore = {
            elements: dbData.designElements,
            colorVariationId: dbData.colorVariationId,
            viewId: dbData.viewId,
            customizationId: dbData.id
          };

          setCustomizationId(dbData.id);
          console.log('✅ Données chargées depuis BDD');
        } else if (localData) {
          // Fallback sur localStorage
          dataToRestore = localData;
          console.log('✅ Données chargées depuis localStorage');
        }
      } catch (error) {
        console.warn('⚠️ BDD non disponible, utilisation localStorage');
        dataToRestore = localData;
      }

      // 3. Restaurer les données
      if (dataToRestore) {
        // Restaurer couleur et vue
        if (dataToRestore.colorVariationId && product.colorVariations) {
          const savedColor = product.colorVariations.find(
            c => c.id === dataToRestore.colorVariationId
          );

          if (savedColor) {
            setSelectedColorVariation(savedColor);

            if (dataToRestore.viewId && savedColor.images) {
              const savedView = savedColor.images.find(
                img => img.id === dataToRestore.viewId
              );

              if (savedView) {
                setSelectedView(savedView);
              }
            }
          }
        }

        // Restaurer les éléments de design
        if (dataToRestore.elements && dataToRestore.elements.length > 0) {
          setDesignElements(dataToRestore.elements);
        }

        if (dataToRestore.customizationId) {
          setCustomizationId(dataToRestore.customizationId);
        }
      }

      hasRestoredRef.current = true;
    } catch (error) {
      console.error('❌ Erreur restauration:', error);
    } finally {
      isRestoringRef.current = false;
    }
  };

  restoreData();
}, [product]);
```

### 3.5 Sauvegarde immédiate lors de l'ajout au panier

```typescript
const handleAddToCart = async (selections: Array<{ size: string; quantity: number }>) => {
  try {
    // 1. Sauvegarder IMMÉDIATEMENT en BDD (pas de debounce)
    const result = await saveToDatabase();

    if (!result) {
      toast.error('Erreur de sauvegarde. Veuillez réessayer.');
      return;
    }

    // 2. Ajouter au panier avec l'ID de personnalisation
    const cartItem = {
      productId: product.id,
      customizationId: result.id,
      sizeSelections: selections,
      // ... autres données
    };

    await addToCart(cartItem);

    toast.success('Ajouté au panier !');
    navigate('/cart');
  } catch (error) {
    console.error('Erreur ajout au panier:', error);
    toast.error('Erreur lors de l\'ajout au panier');
  }
};
```

### 3.6 Sauvegarde avant de quitter la page

```typescript
useEffect(() => {
  const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
    if (designElements.length > 0 && customizationId) {
      // Sauvegarder avant de quitter
      e.preventDefault();
      await saveToDatabase();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [designElements, customizationId]);
```

---

## 🔐 Étape 4 : Migration lors de la connexion

**Fichier** : `src/pages/LoginPage.tsx` (ou votre équivalent)

```typescript
import { customizationService } from '@/services/customizationService';

const handleSuccessfulLogin = async (token: string) => {
  // 1. Sauvegarder le token
  localStorage.setItem('auth-token', token);

  // 2. Migrer les personnalisations guest
  try {
    const result = await customizationService.migrateGuestCustomizations();

    if (result.migrated > 0) {
      console.log(`✅ ${result.migrated} personnalisation(s) migrée(s)`);
      toast.success(`${result.migrated} personnalisation(s) transférée(s) vers votre compte`);
    }
  } catch (error) {
    console.error('Erreur migration:', error);
    // Non bloquant, l'utilisateur peut continuer
  }

  // 3. Rediriger
  navigate('/dashboard');
};
```

---

## 🎯 Étape 5 : Indicateur visuel de sauvegarde

```typescript
// Dans le composant
{isSaving && (
  <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Sauvegarde en cours...</span>
  </div>
)}
```

---

## ✅ Checklist d'implémentation

- [ ] Créer `src/services/customizationService.ts`
- [ ] Créer `src/hooks/useDebouncedSave.ts`
- [ ] Ajouter le state `customizationId` dans le composant
- [ ] Implémenter `saveToDatabase()`
- [ ] Ajouter la sauvegarde debounced avec `useEffect`
- [ ] Modifier la restauration pour charger depuis BDD
- [ ] Ajouter la sauvegarde immédiate dans `handleAddToCart`
- [ ] Implémenter `beforeunload` pour sauvegarder avant de quitter
- [ ] Ajouter la migration dans le flow de connexion
- [ ] Ajouter un indicateur visuel de sauvegarde
- [ ] Tester le flow complet (guest → connexion → cross-device)

---

## 🧪 Tests recommandés

### Test 1 : Guest crée une personnalisation
1. Ouvrir en navigation privée
2. Personnaliser un produit
3. Vérifier localStorage + BDD (Swagger ou base directe)
4. Recharger la page
5. Vérifier que la personnalisation est restaurée

### Test 2 : Migration après connexion
1. En guest, créer plusieurs personnalisations
2. Se connecter
3. Vérifier que toutes les personnalisations sont migrées
4. Vérifier que `guest-session-id` est supprimé du localStorage

### Test 3 : Cross-device
1. Sur device 1 : Se connecter et personnaliser un produit
2. Sur device 2 : Se connecter avec le même compte
3. Ouvrir la page de personnalisation du même produit
4. Vérifier que le draft est restauré

### Test 4 : Debounce
1. Modifier rapidement le design (texte, position, etc.)
2. Observer la console : localStorage se met à jour instantanément
3. Attendre 3s → BDD se met à jour
4. Modifier à nouveau → le timer de 3s reset

---

## 🔧 Dépannage

### Problème : Sauvegarde BDD ne fonctionne pas

**Solution** :
```bash
# Vérifier que le backend tourne
curl http://localhost:3004/customizations

# Vérifier les logs backend
npm run start:dev

# Vérifier la console frontend pour les erreurs
```

### Problème : Migration ne se déclenche pas

**Vérification** :
```typescript
// Avant connexion
console.log('SessionId:', localStorage.getItem('guest-session-id'));

// Après connexion
console.log('Token:', localStorage.getItem('auth-token'));
console.log('SessionId supprimé:', !localStorage.getItem('guest-session-id'));
```

### Problème : Données non restaurées

**Débug** :
```typescript
// Ajouter des logs dans la restauration
useEffect(() => {
  const restoreData = async () => {
    console.log('🔍 Début restauration');
    console.log('Product:', product);
    console.log('localStorage:', localStorage.getItem(`design-data-product-${product.id}`));

    // ... reste du code
  };
}, [product]);
```

---

## 📚 Ressources

- **API Documentation** : `CUSTOMIZATION_API.md`
- **Backend Service** : `src/customization/customization.service.ts`
- **Backend Controller** : `src/customization/customization.controller.ts`
- **Guide original** : Documentation fournie par l'utilisateur

---

## 🎉 Résultat final

Une fois implémenté, vous aurez :

✅ **Sauvegarde ultra-rapide** : localStorage immédiat
✅ **Persistance garantie** : BDD debounced (3s)
✅ **Cross-device** : Accès depuis n'importe où
✅ **Migration automatique** : Guest → Utilisateur
✅ **Performance optimale** : Index BDD optimisés
✅ **UX fluide** : Pas de latence perceptible

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-01-13
