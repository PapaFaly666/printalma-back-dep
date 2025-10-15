# Guide Frontend - Régénération Automatique des Mockups

## 📋 Vue d'ensemble

Le backend régénère **automatiquement** les mockups des produits lorsque vous modifiez une catégorie, sous-catégorie ou variation. Ce guide vous explique comment utiliser cette fonctionnalité depuis le frontend.

## 🎯 Ce que le Backend Fait Automatiquement

Quand vous modifiez une catégorie/sous-catégorie/variation :
1. ✅ Le backend met à jour l'entité
2. ✅ Le backend trouve tous les mockups liés
3. ✅ Le backend les marque pour régénération
4. ✅ Le backend retourne une réponse de succès

**Vous n'avez rien à faire de spécial côté frontend !** La régénération est transparente.

## 🔧 API Endpoints

### 1. Modifier une Catégorie

**Endpoint :** `PATCH /categories/:id`

**Headers requis :**
```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

**Body (tous les champs sont optionnels) :**
```typescript
{
  name?: string;           // Nouveau nom de la catégorie
  description?: string;    // Nouvelle description
  displayOrder?: number;   // Nouvel ordre d'affichage
  coverImageUrl?: string;  // Nouvelle image de couverture
  coverImagePublicId?: string; // ID Cloudinary de l'image
}
```

**Réponse Succès (200) :**
```json
{
  "success": true,
  "message": "Catégorie mise à jour avec succès (3 produit(s) affecté(s))",
  "data": {
    "id": 5,
    "name": "T-Shirts Premium",
    "slug": "t-shirts-premium",
    "description": "Nouvelle description",
    "displayOrder": 1,
    "coverImageUrl": "https://...",
    "coverImagePublicId": "...",
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T14:30:00Z",
    "subCategories": [...],
    "productCount": 3
  }
}
```

**Note :** Le message indique combien de produits (mockups) sont affectés. La régénération se fait automatiquement en arrière-plan.

#### Exemple de Code Frontend

```typescript
// service/categoryService.ts
import axios from 'axios';

interface UpdateCategoryDto {
  name?: string;
  description?: string;
  displayOrder?: number;
  coverImageUrl?: string;
  coverImagePublicId?: string;
}

const updateCategory = async (
  categoryId: number,
  data: UpdateCategoryDto
): Promise<any> => {
  try {
    const response = await axios.patch(
      `/categories/${categoryId}`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Catégorie mise à jour:', response.data);
    console.log(`📦 ${response.data.data.productCount} mockups affectés`);

    return response.data;
  } catch (error) {
    console.error('❌ Erreur mise à jour catégorie:', error);
    throw error;
  }
};

// Exemple d'utilisation
const handleUpdateCategory = async () => {
  const result = await updateCategory(5, {
    name: 'T-Shirts Premium',
    description: 'Collection premium de t-shirts personnalisables'
  });

  // Les mockups sont automatiquement régénérés côté backend
  // Pas besoin d'appeler un autre endpoint !
};
```

### 2. Modifier une Sous-Catégorie

**Endpoint :** `PATCH /sub-categories/:id`

**Headers requis :**
```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

**Body (tous les champs sont optionnels) :**
```typescript
{
  name?: string;           // Nouveau nom
  description?: string;    // Nouvelle description
  categoryId?: number;     // Nouvelle catégorie parente
  displayOrder?: number;   // Nouvel ordre
}
```

**Réponse Succès (200) :**
```json
{
  "success": true,
  "message": "Sous-catégorie mise à jour avec succès",
  "data": {
    "id": 2,
    "name": "Col V Premium",
    "slug": "col-v-premium",
    "description": "T-shirts à col V",
    "categoryId": 1,
    "displayOrder": 2,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T14:30:00Z",
    "category": {
      "id": 1,
      "name": "T-Shirts",
      "slug": "t-shirts"
    },
    "variations": [...]
  }
}
```

#### Exemple de Code Frontend

```typescript
// service/subCategoryService.ts
interface UpdateSubCategoryDto {
  name?: string;
  description?: string;
  categoryId?: number;
  displayOrder?: number;
}

const updateSubCategory = async (
  subCategoryId: number,
  data: UpdateSubCategoryDto
): Promise<any> => {
  try {
    const response = await axios.patch(
      `/sub-categories/${subCategoryId}`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Sous-catégorie mise à jour:', response.data);

    // Les mockups liés sont automatiquement régénérés
    return response.data;
  } catch (error) {
    console.error('❌ Erreur mise à jour sous-catégorie:', error);
    throw error;
  }
};
```

### 3. Modifier une Variation

**Endpoint :** `PATCH /variations/:id`

**Headers requis :**
```typescript
{
  'Authorization': 'Bearer <JWT_TOKEN>',
  'Content-Type': 'application/json'
}
```

**Body (tous les champs sont optionnels) :**
```typescript
{
  name?: string;           // Nouveau nom
  description?: string;    // Nouvelle description
  subCategoryId?: number;  // Nouvelle sous-catégorie parente
  displayOrder?: number;   // Nouvel ordre
}
```

**Réponse Succès (200) :**
```json
{
  "success": true,
  "message": "Variation mise à jour avec succès",
  "data": {
    "id": 3,
    "name": "Manches Longues Premium",
    "slug": "manches-longues-premium",
    "description": "T-shirts à manches longues",
    "subCategoryId": 1,
    "displayOrder": 3,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T14:30:00Z",
    "subCategory": {
      "id": 1,
      "name": "T-Shirts",
      "slug": "t-shirts",
      "category": {
        "id": 1,
        "name": "Vêtements"
      }
    }
  }
}
```

#### Exemple de Code Frontend

```typescript
// service/variationService.ts
interface UpdateVariationDto {
  name?: string;
  description?: string;
  subCategoryId?: number;
  displayOrder?: number;
}

const updateVariation = async (
  variationId: number,
  data: UpdateVariationDto
): Promise<any> => {
  try {
    const response = await axios.patch(
      `/variations/${variationId}`,
      data,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Variation mise à jour:', response.data);

    // Les mockups liés sont automatiquement régénérés
    return response.data;
  } catch (error) {
    console.error('❌ Erreur mise à jour variation:', error);
    throw error;
  }
};
```

## 🎨 Exemple d'Interface Frontend

### Formulaire de Modification de Catégorie

```typescript
// components/CategoryEditForm.tsx
import React, { useState } from 'react';
import { updateCategory } from '../services/categoryService';

interface CategoryEditFormProps {
  categoryId: number;
  initialData: {
    name: string;
    description: string;
    displayOrder: number;
  };
  onSuccess: () => void;
}

export const CategoryEditForm: React.FC<CategoryEditFormProps> = ({
  categoryId,
  initialData,
  onSuccess
}) => {
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await updateCategory(categoryId, formData);

      // Afficher un message de succès
      console.log('✅ Succès:', result.message);

      // Informer l'utilisateur de la régénération
      if (result.data.productCount > 0) {
        console.log(`📦 ${result.data.productCount} mockups régénérés automatiquement`);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nom de la catégorie</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div>
        <label>Ordre d'affichage</label>
        <input
          type="number"
          value={formData.displayOrder}
          onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
        />
      </div>

      {error && <div className="error">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Mise à jour en cours...' : 'Mettre à jour'}
      </button>

      {loading && (
        <p className="info">
          ℹ️ Les mockups liés seront automatiquement régénérés
        </p>
      )}
    </form>
  );
};
```

### Message de Notification

```typescript
// components/CategoryUpdateNotification.tsx
import React from 'react';

interface NotificationProps {
  message: string;
  mockupsCount?: number;
}

export const CategoryUpdateNotification: React.FC<NotificationProps> = ({
  message,
  mockupsCount
}) => {
  return (
    <div className="notification success">
      <div className="notification-icon">✅</div>
      <div className="notification-content">
        <h4>{message}</h4>
        {mockupsCount && mockupsCount > 0 && (
          <p className="notification-detail">
            📦 {mockupsCount} mockup(s) régénéré(s) automatiquement
          </p>
        )}
      </div>
    </div>
  );
};
```

## 🔔 Notifications Utilisateur

### Message de Succès Recommandé

Quand une modification réussit, affichez :

```
✅ Catégorie mise à jour avec succès
📦 3 mockups régénérés automatiquement
```

### Message pendant le Chargement

```
⏳ Mise à jour en cours...
ℹ️ Les mockups liés seront automatiquement régénérés
```

## ⚠️ Gestion des Erreurs

### Erreurs Possibles

#### 1. Catégorie non trouvée (404)
```json
{
  "statusCode": 404,
  "message": "Catégorie avec ID 999 non trouvée"
}
```

**Affichage frontend :**
```typescript
if (error.response?.status === 404) {
  showError('Catégorie introuvable. Elle a peut-être été supprimée.');
}
```

#### 2. Nom déjà utilisé (409)
```json
{
  "statusCode": 409,
  "message": "Une catégorie avec le nom \"T-Shirts\" existe déjà"
}
```

**Affichage frontend :**
```typescript
if (error.response?.status === 409) {
  showError('Ce nom est déjà utilisé. Veuillez en choisir un autre.');
}
```

#### 3. Non autorisé (401)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Affichage frontend :**
```typescript
if (error.response?.status === 401) {
  showError('Session expirée. Veuillez vous reconnecter.');
  redirectToLogin();
}
```

#### 4. Permissions insuffisantes (403)
```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

**Affichage frontend :**
```typescript
if (error.response?.status === 403) {
  showError('Vous n\'avez pas les permissions pour effectuer cette action.');
}
```

### Exemple Complet de Gestion d'Erreurs

```typescript
const handleUpdateCategory = async (id: number, data: UpdateCategoryDto) => {
  try {
    const result = await updateCategory(id, data);

    // Succès
    showSuccessNotification(
      result.message,
      result.data.productCount
    );

    return result;
  } catch (error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    switch (status) {
      case 401:
        showError('Session expirée. Reconnexion requise.');
        redirectToLogin();
        break;

      case 403:
        showError('Permissions insuffisantes pour cette action.');
        break;

      case 404:
        showError('Catégorie introuvable.');
        break;

      case 409:
        showError(message || 'Ce nom est déjà utilisé.');
        break;

      default:
        showError('Une erreur est survenue. Veuillez réessayer.');
    }

    throw error;
  }
};
```

## 🔄 Rafraîchissement des Données

### Après une Modification Réussie

Vous devriez rafraîchir :

1. **La liste des catégories**
```typescript
await fetchCategories(); // Recharger toutes les catégories
```

2. **Les détails de la catégorie modifiée**
```typescript
await fetchCategoryDetails(categoryId);
```

3. **Les mockups liés (optionnel)**
```typescript
// Si vous affichez les mockups sur la même page
await fetchCategoryMockups(categoryId);
```

### Exemple de Flux Complet

```typescript
const handleUpdate = async () => {
  try {
    // 1. Mettre à jour la catégorie
    const result = await updateCategory(categoryId, formData);

    // 2. Afficher la notification de succès
    showSuccessNotification(
      result.message,
      result.data.productCount
    );

    // 3. Rafraîchir les données
    await Promise.all([
      fetchCategories(),           // Liste des catégories
      fetchCategoryDetails(categoryId), // Détails de cette catégorie
      fetchCategoryMockups(categoryId)  // Mockups liés (si nécessaire)
    ]);

    // 4. Fermer le formulaire ou rediriger
    closeEditModal();
    // ou
    navigate('/categories');

  } catch (error) {
    // Géré par handleUpdateCategory
  }
};
```

## 📊 Indicateurs de Performance

### Temps de Réponse Attendu

| Action | Temps estimé | Note |
|--------|--------------|------|
| Modifier catégorie (0-10 mockups) | < 500ms | Régénération rapide |
| Modifier catégorie (10-50 mockups) | < 1s | Acceptable |
| Modifier catégorie (50-100 mockups) | < 2s | À optimiser |
| Modifier catégorie (100+ mockups) | Variable | Considérer l'asynchrone |

### Indicateur de Chargement

```typescript
// Afficher un spinner ou progress bar pendant la mise à jour
{loading && (
  <div className="loading-indicator">
    <Spinner />
    <p>Mise à jour en cours...</p>
    <p className="text-muted">
      Les mockups liés sont en cours de régénération
    </p>
  </div>
)}
```

## 🧪 Tests Recommandés

### Test 1 : Modification Simple

```typescript
describe('CategoryService', () => {
  it('should update category and regenerate mockups', async () => {
    // Arrange
    const categoryId = 5;
    const updateData = { name: 'T-Shirts Premium' };

    // Act
    const result = await updateCategory(categoryId, updateData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('T-Shirts Premium');
    expect(result.message).toContain('mise à jour avec succès');
  });
});
```

### Test 2 : Gestion d'Erreur

```typescript
describe('CategoryService - Error Handling', () => {
  it('should handle duplicate name error', async () => {
    // Arrange
    const categoryId = 5;
    const updateData = { name: 'Existing Name' };

    // Act & Assert
    await expect(
      updateCategory(categoryId, updateData)
    ).rejects.toThrow();
  });
});
```

## 📝 Checklist d'Implémentation

- [ ] Implémenter le formulaire de modification de catégorie
- [ ] Ajouter la gestion des erreurs (401, 403, 404, 409)
- [ ] Afficher une notification de succès avec le nombre de mockups
- [ ] Rafraîchir les données après modification
- [ ] Ajouter un indicateur de chargement
- [ ] Implémenter le formulaire de modification de sous-catégorie
- [ ] Implémenter le formulaire de modification de variation
- [ ] Tester avec différents nombres de mockups
- [ ] Tester la gestion d'erreurs
- [ ] Documenter pour les autres développeurs

## 🎁 Bonus - Hook React Réutilisable

```typescript
// hooks/useCategoryUpdate.ts
import { useState } from 'react';
import { updateCategory } from '../services/categoryService';

export const useCategoryUpdate = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = async (categoryId: number, data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateCategory(categoryId, data);
      setSuccess(true);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Erreur de mise à jour';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return { update, loading, error, success, reset };
};

// Utilisation dans un composant
const MyComponent = () => {
  const { update, loading, error, success } = useCategoryUpdate();

  const handleSubmit = async (data: any) => {
    await update(categoryId, data);
    // Les mockups sont automatiquement régénérés !
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      {loading && <Spinner />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {success && <SuccessMessage>Mis à jour avec succès !</SuccessMessage>}
    </form>
  );
};
```

## 🔗 Ressources Supplémentaires

### Documentation Backend

- **MOCKUP_AUTO_REGENERATION_GUIDE.md** - Guide technique complet
- **MOCKUP_REGENERATION_SUMMARY.md** - Résumé avec métriques

### Endpoints Relatifs

- `GET /categories` - Liste des catégories
- `GET /categories/:id` - Détails d'une catégorie
- `GET /sub-categories` - Liste des sous-catégories
- `GET /variations` - Liste des variations
- `GET /mockups` - Liste des mockups

## 💡 Conseils Importants

1. **Ne vous inquiétez pas de la régénération** - Elle est automatique et transparente
2. **Utilisez les messages de succès** - Ils indiquent le nombre de mockups affectés
3. **Gérez les erreurs correctement** - Surtout les 409 (doublons) et 401 (auth)
4. **Rafraîchissez les données** - Après chaque modification réussie
5. **Testez avec plusieurs mockups** - Pour valider la performance

---

**Date de création :** 2025-10-14
**Version :** 1.0.0
**Backend compatible :** v1.0.0+
**Status :** ✅ Prêt pour l'intégration frontend
