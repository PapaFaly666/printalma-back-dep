# Guide Frontend - Mise à Jour de la Hiérarchie des Catégories

## 📋 Vue d'ensemble

Ce guide explique comment utiliser les nouveaux endpoints de mise à jour des **catégories**, **sous-catégories** et **variations**, et comment ces modifications affectent **automatiquement** les produits mockups associés.

## 🎯 Fonctionnalité Clé

**Régénération Automatique des Mockups**

Lorsque vous modifiez une catégorie, sous-catégorie ou variation, **tous les produits mockups liés sont automatiquement régénérés** en arrière-plan. Vous n'avez rien à faire de spécial - le backend s'en occupe automatiquement!

## 📡 Endpoints Disponibles

### 1. Modifier une Catégorie

**Endpoint:** `PATCH /categories/:id`

**Description:** Met à jour une catégorie et régénère automatiquement tous ses produits mockups.

#### Requête

```typescript
// TypeScript/JavaScript
const updateCategory = async (categoryId: number, data: Partial<Category>) => {
  const response = await fetch(`http://localhost:3004/categories/${categoryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Exemple d'utilisation
const updatedCategory = await updateCategory(5, {
  name: "T-Shirts Premium",
  description: "Collection de t-shirts premium",
  displayOrder: 1
});
```

#### Corps de la Requête (Tous les champs sont optionnels)

```json
{
  "name": "T-Shirts Premium",
  "description": "Collection de t-shirts premium",
  "coverImageUrl": "https://cloudinary.com/image.jpg",
  "displayOrder": 1
}
```

#### Réponse Succès (200)

```json
{
  "success": true,
  "message": "Catégorie mise à jour avec succès (3 produit(s) affecté(s))",
  "data": {
    "id": 5,
    "name": "T-Shirts Premium",
    "slug": "t-shirts-premium",
    "description": "Collection de t-shirts premium",
    "coverImageUrl": "https://cloudinary.com/image.jpg",
    "displayOrder": 1,
    "isActive": true,
    "createdAt": "2025-10-14T10:00:00.000Z",
    "updatedAt": "2025-10-14T14:30:00.000Z",
    "subCategories": [
      {
        "id": 1,
        "name": "Col Rond",
        "slug": "col-rond"
      }
    ]
  }
}
```

**Note:** Le message indique combien de produits mockups ont été affectés par cette modification.

---

### 2. Modifier une Sous-Catégorie

**Endpoint:** `PATCH /sub-categories/:id`

**Description:** Met à jour une sous-catégorie et régénère automatiquement tous ses produits mockups.

#### Requête

```typescript
const updateSubCategory = async (subCategoryId: number, data: Partial<SubCategory>) => {
  const response = await fetch(`http://localhost:3004/sub-categories/${subCategoryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Exemple d'utilisation
const updatedSubCategory = await updateSubCategory(2, {
  name: "Col V Premium",
  description: "T-shirts avec col en V",
  displayOrder: 2
});
```

#### Corps de la Requête (Tous les champs sont optionnels)

```json
{
  "name": "Col V Premium",
  "description": "T-shirts avec col en V",
  "categoryId": 5,
  "displayOrder": 2
}
```

#### Réponse Succès (200)

```json
{
  "success": true,
  "message": "Sous-catégorie mise à jour avec succès",
  "data": {
    "id": 2,
    "name": "Col V Premium",
    "slug": "col-v-premium",
    "description": "T-shirts avec col en V",
    "categoryId": 5,
    "displayOrder": 2,
    "isActive": true,
    "createdAt": "2025-10-14T10:00:00.000Z",
    "updatedAt": "2025-10-14T14:35:00.000Z",
    "category": {
      "id": 5,
      "name": "T-Shirts Premium",
      "slug": "t-shirts-premium"
    },
    "variations": [
      {
        "id": 1,
        "name": "Manches Courtes",
        "slug": "manches-courtes"
      }
    ]
  }
}
```

---

### 3. Modifier une Variation

**Endpoint:** `PATCH /variations/:id`

**Description:** Met à jour une variation et régénère automatiquement tous ses produits mockups.

#### Requête

```typescript
const updateVariation = async (variationId: number, data: Partial<Variation>) => {
  const response = await fetch(`http://localhost:3004/variations/${variationId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Exemple d'utilisation
const updatedVariation = await updateVariation(3, {
  name: "Manches Longues Premium",
  description: "Avec manches longues",
  displayOrder: 3
});
```

#### Corps de la Requête (Tous les champs sont optionnels)

```json
{
  "name": "Manches Longues Premium",
  "description": "Avec manches longues",
  "subCategoryId": 2,
  "displayOrder": 3
}
```

#### Réponse Succès (200)

```json
{
  "success": true,
  "message": "Variation mise à jour avec succès",
  "data": {
    "id": 3,
    "name": "Manches Longues Premium",
    "slug": "manches-longues-premium",
    "description": "Avec manches longues",
    "subCategoryId": 2,
    "displayOrder": 3,
    "isActive": true,
    "createdAt": "2025-10-14T10:00:00.000Z",
    "updatedAt": "2025-10-14T14:40:00.000Z",
    "subCategory": {
      "id": 2,
      "name": "Col V Premium",
      "slug": "col-v-premium",
      "category": {
        "id": 5,
        "name": "T-Shirts Premium",
        "slug": "t-shirts-premium"
      }
    }
  }
}
```

---

## 🔄 Régénération Automatique des Mockups

### Comment ça fonctionne ?

Lorsque vous modifiez une catégorie, sous-catégorie ou variation:

1. **Le backend met à jour l'entité** dans la base de données
2. **Le backend trouve tous les produits mockups liés** (`isReadyProduct: false`)
3. **Le backend régénère automatiquement les mockups** en arrière-plan
4. **Vous recevez la réponse de succès** sans attendre la fin de la régénération

### Qu'est-ce qui est régénéré ?

#### Pour une Catégorie

Tous les produits mockups qui ont `categoryId` égal à l'ID de la catégorie modifiée.

**Exemple:**
- Vous modifiez la catégorie "T-Shirts" (ID: 5)
- Le backend régénère automatiquement:
  - T-Shirt Col Rond Blanc (mockup avec categoryId: 5)
  - T-Shirt Col V Noir (mockup avec categoryId: 5)
  - Hoodie Classique (mockup avec categoryId: 5)

#### Pour une Sous-Catégorie

Tous les produits mockups qui ont `subCategoryId` égal à l'ID de la sous-catégorie modifiée.

**Exemple:**
- Vous modifiez la sous-catégorie "Col V" (ID: 2)
- Le backend régénère automatiquement:
  - T-Shirt Col V Noir (mockup avec subCategoryId: 2)
  - T-Shirt Col V Blanc (mockup avec subCategoryId: 2)

#### Pour une Variation

Tous les produits mockups qui ont `variationId` égal à l'ID de la variation modifiée.

**Exemple:**
- Vous modifiez la variation "Manches Longues" (ID: 3)
- Le backend régénère automatiquement:
  - T-Shirt Manches Longues (mockup avec variationId: 3)

---

## 🎨 Exemples d'Intégration Frontend

### Exemple avec React et React Query

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Hook pour mettre à jour une catégorie
export const useCategoryUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      data
    }: {
      categoryId: number;
      data: Partial<Category>
    }) => {
      const response = await fetch(`/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalider le cache pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['mockups'] });

      // Afficher une notification de succès
      toast.success(data.message || 'Catégorie mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });
};

// Hook pour mettre à jour une sous-catégorie
export const useSubCategoryUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      subCategoryId,
      data
    }: {
      subCategoryId: number;
      data: Partial<SubCategory>
    }) => {
      const response = await fetch(`/sub-categories/${subCategoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sub-categories'] });
      queryClient.invalidateQueries({ queryKey: ['mockups'] });

      toast.success('Sous-catégorie mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });
};

// Hook pour mettre à jour une variation
export const useVariationUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variationId,
      data
    }: {
      variationId: number;
      data: Partial<Variation>
    }) => {
      const response = await fetch(`/variations/${variationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['variations'] });
      queryClient.invalidateQueries({ queryKey: ['mockups'] });

      toast.success('Variation mise à jour avec succès');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  });
};
```

### Exemple de Composant React

```tsx
import React, { useState } from 'react';
import { useCategoryUpdate } from './hooks/useCategoryUpdate';

interface CategoryEditFormProps {
  category: Category;
  onClose: () => void;
}

const CategoryEditForm: React.FC<CategoryEditFormProps> = ({ category, onClose }) => {
  const [formData, setFormData] = useState({
    name: category.name,
    description: category.description || '',
    displayOrder: category.displayOrder || 0
  });

  const { mutate: updateCategory, isPending } = useCategoryUpdate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateCategory(
      {
        categoryId: category.id,
        data: formData
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nom de la catégorie
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <div>
        <label htmlFor="displayOrder" className="block text-sm font-medium">
          Ordre d'affichage
        </label>
        <input
          type="number"
          id="displayOrder"
          name="displayOrder"
          value={formData.displayOrder}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isPending ? 'Mise à jour...' : 'Mettre à jour'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
        >
          Annuler
        </button>
      </div>

      {isPending && (
        <p className="text-sm text-gray-500">
          Mise à jour en cours... Les mockups seront régénérés automatiquement.
        </p>
      )}
    </form>
  );
};

export default CategoryEditForm;
```

---

## 🚨 Gestion des Erreurs

### Codes d'Erreur HTTP

#### 400 - Bad Request

```json
{
  "statusCode": 400,
  "message": ["Le nom est requis", "Le nom doit contenir au moins 2 caractères"],
  "error": "Bad Request"
}
```

**Cause:** Données de validation invalides.

**Solution Frontend:**
```typescript
if (response.status === 400) {
  const errorData = await response.json();
  const messages = Array.isArray(errorData.message)
    ? errorData.message.join(', ')
    : errorData.message;
  toast.error(`Validation échouée: ${messages}`);
}
```

---

#### 401 - Unauthorized

```json
{
  "statusCode": 401,
  "message": "Non autorisé"
}
```

**Cause:** Token d'authentification manquant ou invalide.

**Solution Frontend:**
```typescript
if (response.status === 401) {
  // Rediriger vers la page de connexion
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

---

#### 403 - Forbidden

```json
{
  "statusCode": 403,
  "message": "Accès interdit"
}
```

**Cause:** Utilisateur non autorisé (pas admin).

**Solution Frontend:**
```typescript
if (response.status === 403) {
  toast.error('Vous n\'avez pas les permissions nécessaires');
}
```

---

#### 404 - Not Found

```json
{
  "statusCode": 404,
  "message": "Catégorie avec ID 999 non trouvée"
}
```

**Cause:** L'entité n'existe pas dans la base de données.

**Solution Frontend:**
```typescript
if (response.status === 404) {
  const errorData = await response.json();
  toast.error(errorData.message);
  // Rafraîchir la liste des catégories
  queryClient.invalidateQueries({ queryKey: ['categories'] });
}
```

---

#### 409 - Conflict

```json
{
  "statusCode": 409,
  "message": "La catégorie \"T-Shirts\" existe déjà"
}
```

**Cause:** Une entité avec le même nom existe déjà.

**Solution Frontend:**
```typescript
if (response.status === 409) {
  const errorData = await response.json();
  toast.error(errorData.message);
  // Mettre en évidence le champ de nom pour l'utilisateur
  setFieldError('name', errorData.message);
}
```

---

#### 500 - Internal Server Error

```json
{
  "statusCode": 500,
  "message": "Une erreur interne s'est produite"
}
```

**Cause:** Erreur serveur inattendue.

**Solution Frontend:**
```typescript
if (response.status === 500) {
  toast.error('Erreur serveur. Veuillez réessayer plus tard.');
  // Logger l'erreur pour le debugging
  console.error('Server error:', await response.text());
}
```

---

## 📊 Exemple de Gestion Complète des Erreurs

```typescript
const handleUpdateCategory = async (categoryId: number, data: Partial<Category>) => {
  try {
    const response = await fetch(`/categories/${categoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    // Gestion des erreurs HTTP
    if (!response.ok) {
      const errorData = await response.json();

      switch (response.status) {
        case 400:
          const messages = Array.isArray(errorData.message)
            ? errorData.message.join(', ')
            : errorData.message;
          throw new Error(`Validation échouée: ${messages}`);

        case 401:
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Session expirée. Veuillez vous reconnecter.');

        case 403:
          throw new Error('Vous n\'avez pas les permissions nécessaires');

        case 404:
          throw new Error(errorData.message || 'Catégorie non trouvée');

        case 409:
          throw new Error(errorData.message || 'Cette catégorie existe déjà');

        case 500:
          throw new Error('Erreur serveur. Veuillez réessayer plus tard.');

        default:
          throw new Error(errorData.message || 'Une erreur est survenue');
      }
    }

    // Succès
    const result = await response.json();
    toast.success(result.message || 'Catégorie mise à jour avec succès');
    return result;

  } catch (error) {
    // Gestion des erreurs réseau
    if (error instanceof TypeError) {
      toast.error('Erreur de connexion. Vérifiez votre réseau.');
      console.error('Network error:', error);
    } else {
      toast.error(error.message);
      console.error('Update error:', error);
    }
    throw error;
  }
};
```

---

## 📈 Indicateurs de Performance

### Afficher le Nombre de Mockups Régénérés

Le message de succès inclut le nombre de produits affectés:

```typescript
const { mutate: updateCategory } = useCategoryUpdate();

updateCategory(
  { categoryId: 5, data: { name: "Nouvelle Catégorie" } },
  {
    onSuccess: (data) => {
      // data.message contient: "Catégorie mise à jour avec succès (3 produit(s) affecté(s))"
      console.log(data.message);

      // Afficher une notification avec le nombre de mockups régénérés
      const mockupsCount = extractMockupsCount(data.message); // Fonction helper
      toast.success(`Catégorie mise à jour! ${mockupsCount} mockups régénérés.`);
    }
  }
);

// Fonction helper pour extraire le nombre
const extractMockupsCount = (message: string): number => {
  const match = message.match(/(\d+)\s+produit\(s\)\s+affecté\(s\)/);
  return match ? parseInt(match[1], 10) : 0;
};
```

---

## 🧪 Tests Recommandés

### Test 1: Modification d'une Catégorie

```typescript
describe('Category Update', () => {
  it('should update category and regenerate mockups', async () => {
    const categoryId = 5;
    const updateData = {
      name: "T-Shirts Premium",
      description: "Nouvelle description"
    };

    const response = await fetch(`/categories/${categoryId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(updateData)
    });

    expect(response.status).toBe(200);

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.name).toBe("T-Shirts Premium");
    expect(result.message).toContain("produit(s) affecté(s)");
  });
});
```

### Test 2: Gestion d'Erreur 409 (Conflit)

```typescript
it('should handle duplicate category name error', async () => {
  const categoryId = 5;
  const duplicateName = {
    name: "T-Shirts" // Nom qui existe déjà
  };

  const response = await fetch(`/categories/${categoryId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify(duplicateName)
  });

  expect(response.status).toBe(409);

  const error = await response.json();
  expect(error.message).toContain("existe déjà");
});
```

---

## ✅ Checklist d'Intégration

### Backend

- [x] Endpoint `PATCH /categories/:id` disponible
- [x] Endpoint `PATCH /sub-categories/:id` disponible
- [x] Endpoint `PATCH /variations/:id` disponible
- [x] Régénération automatique des mockups implémentée
- [x] Gestion des erreurs robuste
- [x] Logging détaillé pour monitoring

### Frontend

- [ ] Créer les hooks React Query (`useCategoryUpdate`, `useSubCategoryUpdate`, `useVariationUpdate`)
- [ ] Implémenter les formulaires de modification
- [ ] Ajouter la gestion des erreurs HTTP (400, 401, 403, 404, 409, 500)
- [ ] Afficher les notifications de succès/erreur
- [ ] Invalider les caches après modification
- [ ] Ajouter des indicateurs de chargement
- [ ] Afficher le nombre de mockups régénérés
- [ ] Tester les endpoints avec différents scénarios

---

## 🔗 Ressources Additionnelles

### Documentation Backend

- **MOCKUP_AUTO_REGENERATION_GUIDE.md** - Guide technique backend complet
- **MOCKUP_REGENERATION_SUMMARY.md** - Résumé avec tests et métriques

### Endpoints API

- `GET /categories` - Lister toutes les catégories
- `GET /categories/:id` - Récupérer une catégorie
- `POST /categories` - Créer une catégorie
- `PATCH /categories/:id` - Mettre à jour une catégorie
- `GET /sub-categories` - Lister toutes les sous-catégories
- `GET /sub-categories/:id` - Récupérer une sous-catégorie
- `POST /sub-categories` - Créer une sous-catégorie
- `PATCH /sub-categories/:id` - Mettre à jour une sous-catégorie
- `GET /variations` - Lister toutes les variations
- `GET /variations/:id` - Récupérer une variation
- `POST /variations` - Créer une variation
- `PATCH /variations/:id` - Mettre à jour une variation

---

## 🎉 Résultat Final

Les endpoints `PATCH` pour les catégories, sous-catégories et variations sont maintenant **entièrement fonctionnels** et déclenchent automatiquement la régénération des mockups associés.

**Aucune action spéciale requise côté frontend** - utilisez simplement les endpoints normalement et le backend s'occupe de tout!

---

**Date de création:** 2025-10-14
**Version:** 1.0.0
**Status:** ✅ Complet et Opérationnel
**Build:** ✅ Succès
