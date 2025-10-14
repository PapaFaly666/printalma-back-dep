# 🎨 Guide Frontend - Intégration du Système de Catégories à 3 Niveaux dans ProductForm

**Date**: 2025-10-13
**Basé sur**: `coore.md` + Implémentation backend
**Statut**: 📋 Guide d'implémentation

---

## 📖 Table des matières

1. [Vue d'ensemble du problème](#vue-densemble-du-problème)
2. [Architecture de la solution](#architecture-de-la-solution)
3. [Étape 1: Retirer l'ancien CategorySelector](#étape-1-retirer-lancien-categoryselector)
4. [Étape 2: Fonction extractCategoryIds](#étape-2-fonction-extractcategoryids)
5. [Étape 3: Mise à jour du handleSubmit](#étape-3-mise-à-jour-du-handlesubmit)
6. [Étape 4: Tests](#étape-4-tests)
7. [Code complet](#code-complet)

---

## 🔍 Vue d'ensemble du problème

### Problème actuel

D'après les logs console dans `rep.md`, il y a un **conflit** entre deux systèmes de catégories:

1. ✅ **CategoriesAndSizesPanel.tsx** - Utilise le nouveau système à 3 niveaux
   ```javascript
   ✅ Tailles chargées depuis les noms de variations: ['fef', 'fefe', 'fzfz']
   ✅ Nouvelle sous-catégorie sélectionnée: Vêtements > Tshirt
   ✅ Variation ajoutée: fef
   ```

2. ❌ **CategorySelector.tsx** - Utilise l'ancien système
   ```javascript
   ❌ [CategorySelector] Rendering category: {
     id: 1,
     name: 'Catégorie par défaut',
     level: 0
   }
   ```

### Solution

**Supprimer** `CategorySelector` et utiliser **uniquement** `CategoriesAndSizesPanel` qui retourne des chaînes au format:

```typescript
categories: [
  "Vêtements > Tshirt > fef",
  "Vêtements > Tshirt > fefe"
]
```

Puis **extraire les IDs** (categoryId, subCategoryId, variationId) depuis ces chaînes avant d'envoyer au backend.

---

## 🏗️ Architecture de la solution

```
┌─────────────────────────────────────────────────────────────┐
│                     ProductFormMain.tsx                      │
│                                                              │
│  1. Utilisateur sélectionne dans CategoriesAndSizesPanel    │
│     → categories: ["Vêtements > Tshirt > fef"]             │
│                                                              │
│  2. handleSubmit appelé                                      │
│     → extractCategoryIds(categories)                         │
│     → Cherche les IDs via API                                │
│     → { categoryId: 1, subCategoryId: 1, variationId: 1 }   │
│                                                              │
│  3. Envoi au backend                                         │
│     → POST /products avec categoryId, subCategoryId,         │
│       variationId                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Étape 1: Retirer l'ancien CategorySelector

### Fichier: `src/components/product-form/ProductFormMain.tsx`

#### 1.1. Supprimer l'import

```typescript
// ❌ À RETIRER
import { CategorySelector } from '../admin/CategorySelector';
```

#### 1.2. Supprimer le composant du JSX

Cherchez et **commentez ou supprimez** ce bloc:

```tsx
{/* ❌ À RETIRER OU COMMENTER */}
<CategorySelector
  categories={allCategories}
  value={formData.categoryId}
  onChange={(categoryId) => updateFormData('categoryId', categoryId)}
  level={0}
  parentId={undefined}
/>
```

#### 1.3. Vérifier que CategoriesAndSizesPanel est utilisé

Assurez-vous que ce composant est présent:

```tsx
{/* ✅ Utiliser uniquement CategoriesAndSizesPanel */}
<CategoriesAndSizesPanel
  categories={formData.categories || []}
  sizes={formData.sizes || []}
  onCategoriesUpdate={(cats) => updateFormData('categories', cats)}
  onSizesUpdate={(sizes) => updateFormData('sizes', sizes)}
/>
```

---

## 🔧 Étape 2: Fonction extractCategoryIds

### Fichier: `src/components/product-form/ProductFormMain.tsx`

Ajoutez cette fonction **avant** le composant `ProductFormMain`:

```typescript
import categoryRealApi from '../../services/categoryRealApi';

/**
 * Convertir les catégories UI ["Parent > Child > Variation"]
 * en IDs séparés pour le backend
 *
 * @param categories - Tableau de chaînes au format "Category > SubCategory > Variation"
 * @returns { categoryId, subCategoryId, variationId }
 */
const extractCategoryIds = async (categories: string[]) => {
  // Si aucune catégorie sélectionnée
  if (categories.length === 0) {
    return { categoryId: null, subCategoryId: null, variationId: null };
  }

  // Prendre la première catégorie (normalement il n'y en a qu'une)
  const categoryString = categories[0];

  // Extraire les noms depuis le format "Parent > Child > Variation"
  const parts = categoryString.split(' > ').map(p => p.trim());

  if (parts.length !== 3) {
    console.warn('⚠️ Format de catégorie invalide:', categoryString);
    console.warn('   Format attendu: "Category > SubCategory > Variation"');
    return { categoryId: null, subCategoryId: null, variationId: null };
  }

  const [categoryName, subCategoryName, variationName] = parts;

  try {
    console.log('🔍 Extraction des IDs depuis:', { categoryName, subCategoryName, variationName });

    // 1. Trouver la catégorie par nom
    const allCategories = await categoryRealApi.getCategories();
    const category = allCategories.find(c => c.name === categoryName);

    if (!category) {
      console.error('❌ Catégorie introuvable:', categoryName);
      return { categoryId: null, subCategoryId: null, variationId: null };
    }

    console.log('✅ Catégorie trouvée:', { id: category.id, name: category.name });

    // 2. Trouver la sous-catégorie par nom
    const allSubCategories = await categoryRealApi.getSubCategories(category.id);
    const subCategory = allSubCategories.find(sc => sc.name === subCategoryName);

    if (!subCategory) {
      console.error('❌ Sous-catégorie introuvable:', subCategoryName);
      return { categoryId: category.id, subCategoryId: null, variationId: null };
    }

    console.log('✅ Sous-catégorie trouvée:', { id: subCategory.id, name: subCategory.name });

    // 3. Trouver la variation par nom
    const allVariations = await categoryRealApi.getVariations(subCategory.id);
    const variation = allVariations.find(v => v.name === variationName);

    if (!variation) {
      console.error('❌ Variation introuvable:', variationName);
      return { categoryId: category.id, subCategoryId: subCategory.id, variationId: null };
    }

    console.log('✅ Variation trouvée:', { id: variation.id, name: variation.name });

    const result = {
      categoryId: category.id,
      subCategoryId: subCategory.id,
      variationId: variation.id
    };

    console.log('✅ IDs extraits avec succès:', result);

    return result;

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction des IDs:', error);
    return { categoryId: null, subCategoryId: null, variationId: null };
  }
};
```

### Vérifier que categoryRealApi existe

Si `categoryRealApi` n'existe pas, créez-le:

```typescript
// src/services/categoryRealApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004'; // Adapter selon votre config

class CategoryRealApi {
  async getCategories() {
    const response = await axios.get(`${API_BASE_URL}/categories`);
    return response.data.data || response.data;
  }

  async getSubCategories(categoryId: number) {
    const response = await axios.get(`${API_BASE_URL}/sub-categories?categoryId=${categoryId}`);
    return response.data.data || response.data;
  }

  async getVariations(subCategoryId: number) {
    const response = await axios.get(`${API_BASE_URL}/variations?subCategoryId=${subCategoryId}`);
    return response.data.data || response.data;
  }
}

export default new CategoryRealApi();
```

---

## 📤 Étape 3: Mise à jour du handleSubmit

### Dans `ProductFormMain.tsx`, mettre à jour la fonction handleSubmit

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // ✅ ÉTAPE 1: Extraire les IDs depuis les catégories UI
    console.log('📋 Catégories sélectionnées:', formData.categories);

    const { categoryId, subCategoryId, variationId } =
      await extractCategoryIds(formData.categories || []);

    console.log('📋 IDs extraits:', { categoryId, subCategoryId, variationId });

    // ✅ ÉTAPE 2: Préparer le FormData pour l'upload
    const formDataToSend = new FormData();

    // Données de base
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('price', formData.price.toString());
    formDataToSend.append('stock', formData.stock?.toString() || '0');
    formDataToSend.append('status', formData.status || 'draft');

    // ✅ ÉTAPE 3: Ajouter les IDs de hiérarchie (si disponibles)
    if (categoryId) {
      formDataToSend.append('categoryId', categoryId.toString());
    }
    if (subCategoryId) {
      formDataToSend.append('subCategoryId', subCategoryId.toString());
    }
    if (variationId) {
      formDataToSend.append('variationId', variationId.toString());
    }

    // Catégories (format ancien conservé pour compatibilité)
    formData.categories?.forEach((cat, index) => {
      formDataToSend.append(`categories[${index}]`, cat);
    });

    // Tailles
    formData.sizes?.forEach((size, index) => {
      formDataToSend.append(`sizes[${index}]`, size);
    });

    // Genre et autres champs
    if (formData.genre) {
      formDataToSend.append('genre', formData.genre);
    }
    if (formData.suggestedPrice !== undefined) {
      formDataToSend.append('suggestedPrice', formData.suggestedPrice.toString());
    }
    if (formData.isReadyProduct !== undefined) {
      formDataToSend.append('isReadyProduct', formData.isReadyProduct.toString());
    }

    // ColorVariations (structure JSON)
    formDataToSend.append('colorVariations', JSON.stringify(formData.colorVariations));

    // Fichiers images
    formData.colorVariations?.forEach((colorVar, colorIndex) => {
      colorVar.images?.forEach((image, imageIndex) => {
        if (image.file) {
          formDataToSend.append(`file_${image.fileId}`, image.file);
        }
      });
    });

    console.log('📤 Envoi des données au backend...');

    // ✅ ÉTAPE 4: Envoyer au backend
    const response = await axios.post(
      'http://localhost:3004/products',
      formDataToSend,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: true
      }
    );

    console.log('✅ Produit créé avec succès:', response.data);

    // Afficher un message de succès
    alert('✅ Produit créé avec succès !');

    // Rediriger vers la liste des produits
    // navigate('/admin/products');

  } catch (error: any) {
    console.error('❌ Erreur lors de la création du produit:', error);

    if (error.response?.data?.message) {
      alert(`❌ Erreur: ${error.response.data.message}`);
    } else {
      alert('❌ Erreur lors de la création du produit');
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 🧪 Étape 4: Tests

### Test 1: Vérifier les logs console

1. Ouvrir les DevTools (F12)
2. Sélectionner une catégorie dans `CategoriesAndSizesPanel`
   - Ex: "Vêtements > T-Shirts > Col V"
3. Cliquer sur "Créer le produit"
4. Vérifier les logs:

```javascript
📋 Catégories sélectionnées: ["Vêtements > T-Shirts > Col V"]
🔍 Extraction des IDs depuis: { categoryName: "Vêtements", subCategoryName: "T-Shirts", variationName: "Col V" }
✅ Catégorie trouvée: { id: 1, name: "Vêtements" }
✅ Sous-catégorie trouvée: { id: 1, name: "T-Shirts" }
✅ Variation trouvée: { id: 1, name: "Col V" }
✅ IDs extraits avec succès: { categoryId: 1, subCategoryId: 1, variationId: 1 }
📤 Envoi des données au backend...
✅ Produit créé avec succès
```

### Test 2: Vérifier la requête réseau

1. Onglet "Network" des DevTools
2. Créer un produit
3. Cliquer sur la requête `POST /products`
4. Vérifier le payload (Form Data):

```
name: T-shirt Premium
price: 2500
categoryId: 1          ✅ Nouveau
subCategoryId: 1       ✅ Nouveau
variationId: 1         ✅ Nouveau
categories[0]: T-Shirts
sizes[0]: S
sizes[1]: M
...
```

### Test 3: Vérifier la réponse backend

La réponse devrait contenir:

```json
{
  "id": 123,
  "name": "T-shirt Premium",
  "categoryId": 1,
  "subCategoryId": 1,
  "variationId": 1,
  "category": {
    "id": 1,
    "name": "Vêtements"
  },
  "subCategory": {
    "id": 1,
    "name": "T-Shirts"
  },
  "variation": {
    "id": 1,
    "name": "Col V"
  }
}
```

---

## 📦 Code complet

### Fichier: `src/components/product-form/ProductFormMain.tsx`

```typescript
import React, { useState } from 'react';
import axios from 'axios';
import categoryRealApi from '../../services/categoryRealApi';
import { CategoriesAndSizesPanel } from './CategoriesAndSizesPanel';

/**
 * Convertir les catégories UI ["Parent > Child > Variation"]
 * en IDs séparés pour le backend
 */
const extractCategoryIds = async (categories: string[]) => {
  if (categories.length === 0) {
    return { categoryId: null, subCategoryId: null, variationId: null };
  }

  const categoryString = categories[0];
  const parts = categoryString.split(' > ').map(p => p.trim());

  if (parts.length !== 3) {
    console.warn('⚠️ Format de catégorie invalide:', categoryString);
    return { categoryId: null, subCategoryId: null, variationId: null };
  }

  const [categoryName, subCategoryName, variationName] = parts;

  try {
    console.log('🔍 Extraction des IDs depuis:', { categoryName, subCategoryName, variationName });

    // 1. Trouver la catégorie
    const allCategories = await categoryRealApi.getCategories();
    const category = allCategories.find(c => c.name === categoryName);
    if (!category) {
      console.error('❌ Catégorie introuvable:', categoryName);
      return { categoryId: null, subCategoryId: null, variationId: null };
    }

    // 2. Trouver la sous-catégorie
    const allSubCategories = await categoryRealApi.getSubCategories(category.id);
    const subCategory = allSubCategories.find(sc => sc.name === subCategoryName);
    if (!subCategory) {
      console.error('❌ Sous-catégorie introuvable:', subCategoryName);
      return { categoryId: category.id, subCategoryId: null, variationId: null };
    }

    // 3. Trouver la variation
    const allVariations = await categoryRealApi.getVariations(subCategory.id);
    const variation = allVariations.find(v => v.name === variationName);
    if (!variation) {
      console.error('❌ Variation introuvable:', variationName);
      return { categoryId: category.id, subCategoryId: subCategory.id, variationId: null };
    }

    const result = {
      categoryId: category.id,
      subCategoryId: subCategory.id,
      variationId: variation.id
    };

    console.log('✅ IDs extraits avec succès:', result);
    return result;

  } catch (error) {
    console.error('❌ Erreur lors de l\'extraction des IDs:', error);
    return { categoryId: null, subCategoryId: null, variationId: null };
  }
};

export const ProductFormMain: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    status: 'draft',
    categories: [] as string[],
    sizes: [] as string[],
    genre: 'UNISEXE',
    suggestedPrice: 0,
    isReadyProduct: false,
    colorVariations: []
  });

  const [loading, setLoading] = useState(false);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Extraire les IDs depuis les catégories UI
      console.log('📋 Catégories sélectionnées:', formData.categories);

      const { categoryId, subCategoryId, variationId } =
        await extractCategoryIds(formData.categories || []);

      console.log('📋 IDs extraits:', { categoryId, subCategoryId, variationId });

      // ✅ Préparer le FormData
      const formDataToSend = new FormData();

      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price.toString());
      formDataToSend.append('stock', formData.stock?.toString() || '0');
      formDataToSend.append('status', formData.status || 'draft');

      // ✅ Ajouter les IDs de hiérarchie
      if (categoryId) formDataToSend.append('categoryId', categoryId.toString());
      if (subCategoryId) formDataToSend.append('subCategoryId', subCategoryId.toString());
      if (variationId) formDataToSend.append('variationId', variationId.toString());

      // Catégories (ancien format)
      formData.categories?.forEach((cat, index) => {
        formDataToSend.append(`categories[${index}]`, cat);
      });

      // Tailles
      formData.sizes?.forEach((size, index) => {
        formDataToSend.append(`sizes[${index}]`, size);
      });

      // Autres champs
      if (formData.genre) formDataToSend.append('genre', formData.genre);
      if (formData.suggestedPrice !== undefined) {
        formDataToSend.append('suggestedPrice', formData.suggestedPrice.toString());
      }
      if (formData.isReadyProduct !== undefined) {
        formDataToSend.append('isReadyProduct', formData.isReadyProduct.toString());
      }

      // ColorVariations
      formDataToSend.append('colorVariations', JSON.stringify(formData.colorVariations));

      console.log('📤 Envoi des données au backend...');

      // ✅ Envoyer au backend
      const response = await axios.post(
        'http://localhost:3004/products',
        formDataToSend,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        }
      );

      console.log('✅ Produit créé avec succès:', response.data);
      alert('✅ Produit créé avec succès !');

    } catch (error: any) {
      console.error('❌ Erreur lors de la création du produit:', error);

      if (error.response?.data?.message) {
        alert(`❌ Erreur: ${error.response.data.message}`);
      } else {
        alert('❌ Erreur lors de la création du produit');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className="text-2xl font-bold">Créer un produit</h1>

      {/* Champs de base */}
      <div>
        <label>Nom du produit</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          required
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData('description', e.target.value)}
          required
        />
      </div>

      <div>
        <label>Prix (en centimes)</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => updateFormData('price', parseInt(e.target.value))}
          required
        />
      </div>

      {/* ✅ Utiliser uniquement CategoriesAndSizesPanel */}
      <CategoriesAndSizesPanel
        categories={formData.categories || []}
        sizes={formData.sizes || []}
        onCategoriesUpdate={(cats) => updateFormData('categories', cats)}
        onSizesUpdate={(sizes) => updateFormData('sizes', sizes)}
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Création en cours...' : 'Créer le produit'}
      </button>
    </form>
  );
};
```

---

## 🚨 Erreurs Fréquentes et Solutions

### Erreur 1: "categoryId must be a number"

**Cause**: Le backend reçoit une chaîne au lieu d'un nombre

**Solution**: Utiliser `.toString()` lors de l'ajout au FormData:
```typescript
formDataToSend.append('categoryId', categoryId.toString());
```

### Erreur 2: "La variation X n'appartient pas à la sous-catégorie Y"

**Cause**: Incohérence dans la sélection (hiérarchie brisée)

**Solution**: Vérifier que `CategoriesAndSizesPanel` réinitialise les variations quand la sous-catégorie change

### Erreur 3: "Catégorie introuvable"

**Cause**: Le nom de la catégorie ne correspond pas exactement à celui en base

**Solution**:
- Vérifier les espaces en début/fin avec `.trim()`
- Vérifier la casse (majuscules/minuscules)
- Utiliser un `console.log` pour comparer les noms

### Erreur 4: Format invalide "Category > SubCategory > Variation"

**Cause**: `CategoriesAndSizesPanel` retourne un format différent

**Solution**: Adapter le parsing dans `extractCategoryIds`:
```typescript
// Vérifier le séparateur utilisé
const parts = categoryString.split(' > '); // ou ' / ' ou autre
```

---

## 📋 Checklist d'Implémentation

- [ ] Retirer l'import de `CategorySelector`
- [ ] Supprimer/commenter le composant `<CategorySelector />` du JSX
- [ ] Vérifier que `<CategoriesAndSizesPanel />` est présent
- [ ] Créer le fichier `src/services/categoryRealApi.ts`
- [ ] Ajouter la fonction `extractCategoryIds` avant le composant
- [ ] Mettre à jour `handleSubmit` pour extraire les IDs
- [ ] Ajouter les champs `categoryId`, `subCategoryId`, `variationId` au FormData
- [ ] Tester la sélection de catégories
- [ ] Vérifier les logs console
- [ ] Vérifier la requête réseau (DevTools)
- [ ] Vérifier que le produit est créé avec les bons IDs en base

---

## 🔗 Ressources

- **Backend Implementation**: `BACKEND_CATEGORY_HIERARCHY_IMPLEMENTATION.md`
- **Frontend API Guide**: `FRONTEND_CATEGORY_API_GUIDE.md`
- **Guide de résolution**: `coore.md`
- **Logs de debug**: `rep.md`

---

**Créé par**: Claude Code
**Date**: 2025-10-13
**Version**: 1.0
