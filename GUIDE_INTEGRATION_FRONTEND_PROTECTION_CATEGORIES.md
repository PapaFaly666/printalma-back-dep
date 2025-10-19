# Guide d'Intégration Frontend - Système de Protection de Suppression des Catégories

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Endpoints API disponibles](#endpoints-api-disponibles)
3. [Intégration dans le Frontend](#intégration-dans-le-frontend)
4. [Exemples de Code](#exemples-de-code)
5. [Gestion des Erreurs](#gestion-des-erreurs)
6. [Composants UI Recommandés](#composants-ui-recommandés)
7. [Workflow Complet](#workflow-complet)

---

## 📖 Vue d'ensemble

Le système de protection empêche la suppression accidentelle de catégories, sous-catégories et variations qui sont utilisées par des produits. Il fournit :

- ✅ Vérification avant suppression via endpoints `can-delete`
- ✅ Messages d'erreur clairs avec suggestions d'action
- ✅ Blocage automatique des suppressions dangereuses
- ✅ Support de la migration de produits

---

## 🔌 Endpoints API Disponibles

### Base URL
```
http://localhost:3004
```

### 1. Vérification de Suppression

#### Vérifier si une catégorie peut être supprimée
```http
GET /categories/:id/can-delete
```

**Réponse (succès) :**
```json
{
  "success": true,
  "data": {
    "canDelete": false,
    "categoryId": 1,
    "categoryName": "Vêtements",
    "blockers": {
      "directProducts": 5,
      "subCategoryProducts": 12,
      "variationProducts": 8,
      "total": 25
    },
    "message": "Cette catégorie ne peut pas être supprimée car 25 produit(s) l'utilise(nt)"
  }
}
```

#### Vérifier si une sous-catégorie peut être supprimée
```http
GET /categories/subcategory/:id/can-delete
```

**Réponse (succès) :**
```json
{
  "success": true,
  "data": {
    "canDelete": false,
    "subCategoryId": 3,
    "subCategoryName": "T-Shirts",
    "categoryName": "Vêtements",
    "blockers": {
      "directProducts": 10,
      "variationProducts": 5,
      "total": 15
    },
    "message": "Cette sous-catégorie ne peut pas être supprimée car 15 produit(s) l'utilise(nt)"
  }
}
```

#### Vérifier si une variation peut être supprimée
```http
GET /categories/variation/:id/can-delete
```

**Réponse (succès) :**
```json
{
  "success": true,
  "data": {
    "canDelete": false,
    "variationId": 7,
    "variationName": "Col V",
    "subCategoryName": "T-Shirts",
    "categoryName": "Vêtements",
    "blockers": {
      "productsCount": 8
    },
    "message": "Cette variation ne peut pas être supprimée car 8 produit(s) l'utilise(nt)"
  }
}
```

### 2. Suppression Protégée

#### Supprimer une catégorie
```http
DELETE /categories/:id
```

**Réponse (erreur - produits existants) :**
```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette catégorie car 25 produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre catégorie.",
  "error": "Conflict",
  "code": "CategoryInUse",
  "details": {
    "categoryId": 1,
    "categoryName": "Vêtements",
    "directProductsCount": 25,
    "suggestedAction": "Déplacez les produits vers une autre catégorie avant de supprimer celle-ci."
  }
}
```

**Réponse (succès - aucun produit) :**
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès"
}
```

#### Supprimer une sous-catégorie
```http
DELETE /categories/subcategory/:id
```

**Réponse (erreur - produits existants) :**
```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette sous-catégorie car 15 produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre sous-catégorie.",
  "error": "Conflict",
  "code": "SubCategoryInUse",
  "details": {
    "subCategoryId": 3,
    "subCategoryName": "T-Shirts",
    "categoryName": "Vêtements",
    "directProductsCount": 15,
    "suggestedAction": "Déplacez les produits vers une autre sous-catégorie avant de la supprimer."
  }
}
```

#### Supprimer une variation
```http
DELETE /categories/variation/:id
```

**Réponse (erreur - produits existants) :**
```json
{
  "statusCode": 409,
  "message": "Impossible de supprimer cette variation car 8 produit(s) l'utilise(nt). Veuillez d'abord déplacer les produits vers une autre variation.",
  "error": "Conflict",
  "code": "VariationInUse",
  "details": {
    "variationId": 7,
    "variationName": "Col V",
    "subCategoryName": "T-Shirts",
    "categoryName": "Vêtements",
    "productsCount": 8,
    "suggestedAction": "Déplacez les produits vers une autre variation avant de la supprimer."
  }
}
```

---

## 💻 Intégration dans le Frontend

### Service API (TypeScript)

Créez un service pour gérer les appels API :

```typescript
// services/categoryProtectionService.ts

const API_BASE_URL = 'http://localhost:3004';

export interface CanDeleteResponse {
  success: boolean;
  data: {
    canDelete: boolean;
    categoryId?: number;
    subCategoryId?: number;
    variationId?: number;
    categoryName?: string;
    subCategoryName?: string;
    variationName?: string;
    blockers: {
      directProducts?: number;
      subCategoryProducts?: number;
      variationProducts?: number;
      productsCount?: number;
      total?: number;
    };
    message: string;
  };
}

export interface DeletionError {
  statusCode: number;
  message: string;
  error: string;
  code: 'CategoryInUse' | 'SubCategoryInUse' | 'VariationInUse';
  details: {
    categoryId?: number;
    subCategoryId?: number;
    variationId?: number;
    categoryName?: string;
    subCategoryName?: string;
    variationName?: string;
    directProductsCount?: number;
    subCategoryProductsCount?: number;
    variationProductsCount?: number;
    productsCount?: number;
    suggestedAction: string;
  };
}

class CategoryProtectionService {

  // Vérifier si une catégorie peut être supprimée
  async canDeleteCategory(categoryId: number): Promise<CanDeleteResponse> {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}/can-delete`);
    return await response.json();
  }

  // Vérifier si une sous-catégorie peut être supprimée
  async canDeleteSubCategory(subCategoryId: number): Promise<CanDeleteResponse> {
    const response = await fetch(`${API_BASE_URL}/categories/subcategory/${subCategoryId}/can-delete`);
    return await response.json();
  }

  // Vérifier si une variation peut être supprimée
  async canDeleteVariation(variationId: number): Promise<CanDeleteResponse> {
    const response = await fetch(`${API_BASE_URL}/categories/variation/${variationId}/can-delete`);
    return await response.json();
  }

  // Supprimer une catégorie
  async deleteCategory(categoryId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error: DeletionError = await response.json();
      throw error;
    }

    return await response.json();
  }

  // Supprimer une sous-catégorie
  async deleteSubCategory(subCategoryId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/categories/subcategory/${subCategoryId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error: DeletionError = await response.json();
      throw error;
    }

    return await response.json();
  }

  // Supprimer une variation
  async deleteVariation(variationId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/categories/variation/${variationId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error: DeletionError = await response.json();
      throw error;
    }

    return await response.json();
  }
}

export const categoryProtectionService = new CategoryProtectionService();
```

---

## 🎨 Exemples de Code

### React Hook Personnalisé

```typescript
// hooks/useCategoryDeletion.ts

import { useState } from 'react';
import { categoryProtectionService, DeletionError } from '../services/categoryProtectionService';

export const useCategoryDeletion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCategory = async (categoryId: number) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Vérifier si la suppression est possible
      const canDelete = await categoryProtectionService.canDeleteCategory(categoryId);

      if (!canDelete.data.canDelete) {
        // Afficher un message à l'utilisateur
        const { blockers, message } = canDelete.data;
        throw new Error(
          `Impossible de supprimer : ${blockers.total} produit(s) utilise(nt) cette catégorie. ${message}`
        );
      }

      // 2. Demander confirmation
      const confirmed = window.confirm(
        'Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.'
      );

      if (!confirmed) {
        setLoading(false);
        return { success: false, cancelled: true };
      }

      // 3. Procéder à la suppression
      const result = await categoryProtectionService.deleteCategory(categoryId);

      setLoading(false);
      return { success: true, message: result.message };

    } catch (err) {
      setLoading(false);

      if ((err as DeletionError).code) {
        const deletionError = err as DeletionError;
        setError(deletionError.message);
        return {
          success: false,
          error: deletionError.message,
          suggestedAction: deletionError.details.suggestedAction
        };
      }

      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteSubCategory = async (subCategoryId: number) => {
    setLoading(true);
    setError(null);

    try {
      const canDelete = await categoryProtectionService.canDeleteSubCategory(subCategoryId);

      if (!canDelete.data.canDelete) {
        throw new Error(canDelete.data.message);
      }

      const confirmed = window.confirm(
        'Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?'
      );

      if (!confirmed) {
        setLoading(false);
        return { success: false, cancelled: true };
      }

      const result = await categoryProtectionService.deleteSubCategory(subCategoryId);

      setLoading(false);
      return { success: true, message: result.message };

    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const deleteVariation = async (variationId: number) => {
    setLoading(true);
    setError(null);

    try {
      const canDelete = await categoryProtectionService.canDeleteVariation(variationId);

      if (!canDelete.data.canDelete) {
        throw new Error(canDelete.data.message);
      }

      const confirmed = window.confirm(
        'Êtes-vous sûr de vouloir supprimer cette variation ?'
      );

      if (!confirmed) {
        setLoading(false);
        return { success: false, cancelled: true };
      }

      const result = await categoryProtectionService.deleteVariation(variationId);

      setLoading(false);
      return { success: true, message: result.message };

    } catch (err) {
      setLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    deleteCategory,
    deleteSubCategory,
    deleteVariation,
    loading,
    error
  };
};
```

### Composant React - Bouton de Suppression avec Protection

```typescript
// components/DeleteCategoryButton.tsx

import React, { useState } from 'react';
import { useCategoryDeletion } from '../hooks/useCategoryDeletion';

interface DeleteCategoryButtonProps {
  categoryId: number;
  categoryName: string;
  onDeleteSuccess?: () => void;
}

export const DeleteCategoryButton: React.FC<DeleteCategoryButtonProps> = ({
  categoryId,
  categoryName,
  onDeleteSuccess
}) => {
  const { deleteCategory, loading, error } = useCategoryDeletion();
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [blockerInfo, setBlockerInfo] = useState<any>(null);

  const handleDelete = async () => {
    const result = await deleteCategory(categoryId);

    if (result.success) {
      // Succès - actualiser la liste
      alert(`Catégorie "${categoryName}" supprimée avec succès !`);
      onDeleteSuccess?.();
    } else if (result.suggestedAction) {
      // Suppression bloquée - proposer la migration
      setBlockerInfo(result);
      setShowMigrationDialog(true);
    } else if (!result.cancelled) {
      // Erreur
      alert(`Erreur : ${result.error}`);
    }
  };

  return (
    <>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="btn btn-danger"
      >
        {loading ? 'Suppression...' : 'Supprimer'}
      </button>

      {error && (
        <div className="alert alert-danger mt-2">
          {error}
        </div>
      )}

      {showMigrationDialog && blockerInfo && (
        <MigrationDialog
          categoryId={categoryId}
          categoryName={categoryName}
          blockerInfo={blockerInfo}
          onClose={() => setShowMigrationDialog(false)}
          onMigrationComplete={onDeleteSuccess}
        />
      )}
    </>
  );
};
```

### Composant Vue.js - Bouton de Suppression

```vue
<!-- components/DeleteCategoryButton.vue -->

<template>
  <div>
    <button
      @click="handleDelete"
      :disabled="loading"
      class="btn btn-danger"
    >
      {{ loading ? 'Suppression...' : 'Supprimer' }}
    </button>

    <div v-if="error" class="alert alert-danger mt-2">
      {{ error }}
    </div>

    <MigrationDialog
      v-if="showMigrationDialog"
      :category-id="categoryId"
      :category-name="categoryName"
      :blocker-info="blockerInfo"
      @close="showMigrationDialog = false"
      @migration-complete="handleMigrationComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { categoryProtectionService } from '../services/categoryProtectionService';
import MigrationDialog from './MigrationDialog.vue';

interface Props {
  categoryId: number;
  categoryName: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['delete-success']);

const loading = ref(false);
const error = ref<string | null>(null);
const showMigrationDialog = ref(false);
const blockerInfo = ref<any>(null);

const handleDelete = async () => {
  loading.value = true;
  error.value = null;

  try {
    // 1. Vérifier si la suppression est possible
    const canDelete = await categoryProtectionService.canDeleteCategory(props.categoryId);

    if (!canDelete.data.canDelete) {
      // Afficher le dialogue de migration
      blockerInfo.value = canDelete.data;
      showMigrationDialog.value = true;
      loading.value = false;
      return;
    }

    // 2. Demander confirmation
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer la catégorie "${props.categoryName}" ?`
    );

    if (!confirmed) {
      loading.value = false;
      return;
    }

    // 3. Procéder à la suppression
    const result = await categoryProtectionService.deleteCategory(props.categoryId);

    alert(result.message);
    emit('delete-success');

  } catch (err: any) {
    if (err.code) {
      error.value = err.message;
      blockerInfo.value = err.details;
      showMigrationDialog.value = true;
    } else {
      error.value = err.message || 'Une erreur est survenue';
    }
  } finally {
    loading.value = false;
  }
};

const handleMigrationComplete = () => {
  showMigrationDialog.value = false;
  emit('delete-success');
};
</script>
```

---

## 🚨 Gestion des Erreurs

### Types d'erreurs possibles

```typescript
// types/errors.ts

export enum DeletionErrorCode {
  CATEGORY_IN_USE = 'CategoryInUse',
  SUBCATEGORY_IN_USE = 'SubCategoryInUse',
  VARIATION_IN_USE = 'VariationInUse'
}

export interface DeletionErrorDetails {
  categoryId?: number;
  subCategoryId?: number;
  variationId?: number;
  categoryName?: string;
  subCategoryName?: string;
  variationName?: string;
  directProductsCount?: number;
  subCategoryProductsCount?: number;
  variationProductsCount?: number;
  productsCount?: number;
  suggestedAction: string;
}
```

### Gestionnaire d'erreurs centralisé

```typescript
// utils/errorHandler.ts

import { DeletionError, DeletionErrorCode } from '../types/errors';

export const handleDeletionError = (error: DeletionError) => {
  switch (error.code) {
    case DeletionErrorCode.CATEGORY_IN_USE:
      return {
        title: 'Catégorie utilisée',
        message: error.message,
        action: error.details.suggestedAction,
        severity: 'warning',
        showMigrationOption: true,
        productsCount: error.details.directProductsCount
      };

    case DeletionErrorCode.SUBCATEGORY_IN_USE:
      return {
        title: 'Sous-catégorie utilisée',
        message: error.message,
        action: error.details.suggestedAction,
        severity: 'warning',
        showMigrationOption: true,
        productsCount: error.details.directProductsCount
      };

    case DeletionErrorCode.VARIATION_IN_USE:
      return {
        title: 'Variation utilisée',
        message: error.message,
        action: error.details.suggestedAction,
        severity: 'warning',
        showMigrationOption: true,
        productsCount: error.details.productsCount
      };

    default:
      return {
        title: 'Erreur',
        message: 'Une erreur est survenue lors de la suppression',
        severity: 'error',
        showMigrationOption: false
      };
  }
};
```

---

## 🎯 Composants UI Recommandés

### 1. Dialogue de Migration de Produits

```typescript
// components/MigrationDialog.tsx

import React, { useState, useEffect } from 'react';

interface MigrationDialogProps {
  categoryId: number;
  categoryName: string;
  blockerInfo: {
    blockers: {
      total: number;
      directProducts?: number;
      subCategoryProducts?: number;
      variationProducts?: number;
    };
    message: string;
  };
  onClose: () => void;
  onMigrationComplete: () => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  categoryId,
  categoryName,
  blockerInfo,
  onClose,
  onMigrationComplete
}) => {
  const [targetCategoryId, setTargetCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Charger les catégories disponibles
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const response = await fetch('http://localhost:3004/categories');
    const data = await response.json();
    // Filtrer la catégorie actuelle
    setCategories(data.filter((cat: any) => cat.id !== categoryId));
  };

  const handleMigrate = async () => {
    if (!targetCategoryId) {
      alert('Veuillez sélectionner une catégorie de destination');
      return;
    }

    setLoading(true);

    try {
      // Appeler l'API pour migrer les produits
      const response = await fetch(`http://localhost:3004/products/migrate-category`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCategoryId: categoryId,
          toCategoryId: targetCategoryId
        })
      });

      if (response.ok) {
        alert('Migration réussie ! Vous pouvez maintenant supprimer la catégorie.');
        onMigrationComplete();
      } else {
        alert('Erreur lors de la migration');
      }
    } catch (error) {
      alert('Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Migration des Produits Requise</h3>

        <div className="alert alert-warning">
          <p><strong>{blockerInfo.message}</strong></p>
          <ul>
            {blockerInfo.blockers.directProducts > 0 && (
              <li>{blockerInfo.blockers.directProducts} produit(s) directement lié(s)</li>
            )}
            {blockerInfo.blockers.subCategoryProducts > 0 && (
              <li>{blockerInfo.blockers.subCategoryProducts} produit(s) dans les sous-catégories</li>
            )}
            {blockerInfo.blockers.variationProducts > 0 && (
              <li>{blockerInfo.blockers.variationProducts} produit(s) dans les variations</li>
            )}
          </ul>
        </div>

        <div className="form-group">
          <label>Déplacer les produits vers :</label>
          <select
            value={targetCategoryId || ''}
            onChange={(e) => setTargetCategoryId(Number(e.target.value))}
            className="form-control"
          >
            <option value="">-- Sélectionner une catégorie --</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="modal-actions">
          <button
            onClick={handleMigrate}
            disabled={loading || !targetCategoryId}
            className="btn btn-primary"
          >
            {loading ? 'Migration...' : 'Migrer les Produits'}
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 2. Indicateur de Produits Liés

```typescript
// components/ProductCountBadge.tsx

import React, { useEffect, useState } from 'react';
import { categoryProtectionService } from '../services/categoryProtectionService';

interface ProductCountBadgeProps {
  categoryId: number;
  type: 'category' | 'subcategory' | 'variation';
}

export const ProductCountBadge: React.FC<ProductCountBadgeProps> = ({
  categoryId,
  type
}) => {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductCount();
  }, [categoryId, type]);

  const fetchProductCount = async () => {
    setLoading(true);
    try {
      let response;

      switch (type) {
        case 'category':
          response = await categoryProtectionService.canDeleteCategory(categoryId);
          setCount(response.data.blockers.total || 0);
          break;
        case 'subcategory':
          response = await categoryProtectionService.canDeleteSubCategory(categoryId);
          setCount(response.data.blockers.total || 0);
          break;
        case 'variation':
          response = await categoryProtectionService.canDeleteVariation(categoryId);
          setCount(response.data.blockers.productsCount || 0);
          break;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du nombre de produits', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="badge badge-secondary">...</span>;
  }

  if (count === 0) {
    return <span className="badge badge-success">Aucun produit</span>;
  }

  return (
    <span className="badge badge-warning" title={`${count} produit(s) lié(s)`}>
      {count} produit{count > 1 ? 's' : ''}
    </span>
  );
};
```

---

## 🔄 Workflow Complet

### Diagramme de Flux

```
┌─────────────────────────────────────┐
│  Utilisateur clique sur "Supprimer" │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Frontend appelle /can-delete       │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │             │
     canDelete    canDelete
      = true       = false
        │             │
        ▼             ▼
┌───────────┐   ┌──────────────────────┐
│ Confirmer │   │ Afficher dialogue de │
│ suppression│   │ migration de produits│
└─────┬─────┘   └──────────┬───────────┘
      │                    │
      │ Confirmé           │ Migrer produits
      ▼                    ▼
┌───────────────┐   ┌──────────────────┐
│ DELETE        │   │ POST /migrate    │
│ /categories/:id│   │ puis DELETE     │
└──────┬────────┘   └────────┬─────────┘
       │                     │
       ▼                     ▼
┌──────────────────────────────────────┐
│       Suppression réussie            │
│    Actualiser la liste des catégories│
└──────────────────────────────────────┘
```

### Pseudo-code du Workflow

```javascript
async function deleteCategoryWorkflow(categoryId) {
  // Étape 1: Vérifier si la suppression est possible
  const canDelete = await api.canDeleteCategory(categoryId);

  if (!canDelete.data.canDelete) {
    // Étape 2a: Afficher le dialogue de migration
    const migrated = await showMigrationDialog({
      categoryId,
      blockers: canDelete.data.blockers
    });

    if (!migrated) {
      return; // Utilisateur a annulé
    }
  }

  // Étape 3: Demander confirmation finale
  const confirmed = await confirm('Confirmer la suppression ?');

  if (!confirmed) {
    return;
  }

  // Étape 4: Supprimer la catégorie
  try {
    await api.deleteCategory(categoryId);
    showSuccess('Catégorie supprimée avec succès');
    refreshCategoriesList();
  } catch (error) {
    if (error.code === 'CategoryInUse') {
      showError('Des produits utilisent encore cette catégorie');
    } else {
      showError('Erreur lors de la suppression');
    }
  }
}
```

---

## 📱 Exemples d'Interfaces Utilisateur

### Interface de Gestion des Catégories

```tsx
// pages/CategoriesManagement.tsx

import React, { useState, useEffect } from 'react';
import { DeleteCategoryButton } from '../components/DeleteCategoryButton';
import { ProductCountBadge } from '../components/ProductCountBadge';

interface Category {
  id: number;
  name: string;
  description: string;
  subCategories: SubCategory[];
}

export const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const response = await fetch('http://localhost:3004/categories');
    const data = await response.json();
    setCategories(data);
  };

  return (
    <div className="container">
      <h1>Gestion des Catégories</h1>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Description</th>
            <th>Produits Liés</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.id}</td>
              <td>{category.name}</td>
              <td>{category.description}</td>
              <td>
                <ProductCountBadge
                  categoryId={category.id}
                  type="category"
                />
              </td>
              <td>
                <button className="btn btn-sm btn-primary me-2">
                  Modifier
                </button>
                <DeleteCategoryButton
                  categoryId={category.id}
                  categoryName={category.name}
                  onDeleteSuccess={fetchCategories}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

---

## 🎨 Styles CSS Recommandés

```css
/* styles/categoryDeletion.css */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.alert-warning {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
}

.alert-warning ul {
  margin: 0.5rem 0 0 1.5rem;
}

.form-group {
  margin: 1rem 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 3px;
}

.badge-success {
  background-color: #28a745;
  color: white;
}

.badge-warning {
  background-color: #ffc107;
  color: #212529;
}

.badge-secondary {
  background-color: #6c757d;
  color: white;
}
```

---

## ✅ Checklist d'Intégration

- [ ] Installer et configurer le service API
- [ ] Créer les types TypeScript pour les réponses API
- [ ] Implémenter le hook `useCategoryDeletion`
- [ ] Créer le composant `DeleteCategoryButton`
- [ ] Créer le composant `MigrationDialog`
- [ ] Créer le composant `ProductCountBadge`
- [ ] Ajouter la gestion centralisée des erreurs
- [ ] Implémenter les styles CSS
- [ ] Tester le workflow complet
- [ ] Ajouter les notifications/toasts de succès/erreur
- [ ] Documenter le code pour l'équipe

---

## 🧪 Tests Frontend Recommandés

```typescript
// tests/categoryDeletion.test.ts

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteCategoryButton } from '../components/DeleteCategoryButton';
import { categoryProtectionService } from '../services/categoryProtectionService';

describe('DeleteCategoryButton', () => {
  it('affiche le dialogue de migration si la catégorie est utilisée', async () => {
    // Mock de l'API
    vi.spyOn(categoryProtectionService, 'canDeleteCategory').mockResolvedValue({
      success: true,
      data: {
        canDelete: false,
        categoryId: 1,
        categoryName: 'Test',
        blockers: { total: 5, directProducts: 5 },
        message: 'Cette catégorie ne peut pas être supprimée'
      }
    });

    render(
      <DeleteCategoryButton
        categoryId={1}
        categoryName="Test"
      />
    );

    const deleteBtn = screen.getByText('Supprimer');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/Migration des Produits Requise/i)).toBeInTheDocument();
    });
  });

  it('supprime directement si aucun produit n\'utilise la catégorie', async () => {
    vi.spyOn(categoryProtectionService, 'canDeleteCategory').mockResolvedValue({
      success: true,
      data: {
        canDelete: true,
        categoryId: 1,
        categoryName: 'Test',
        blockers: { total: 0 },
        message: 'Cette catégorie peut être supprimée'
      }
    });

    vi.spyOn(categoryProtectionService, 'deleteCategory').mockResolvedValue({
      success: true,
      message: 'Catégorie supprimée'
    });

    window.confirm = vi.fn(() => true);

    const onSuccess = vi.fn();
    render(
      <DeleteCategoryButton
        categoryId={1}
        categoryName="Test"
        onDeleteSuccess={onSuccess}
      />
    );

    const deleteBtn = screen.getByText('Supprimer');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

---

## 📞 Support et Questions

Pour toute question sur l'intégration :

1. Consultez la documentation technique : `CATEGORY_DELETION_PROTECTION.md`
2. Consultez les tests manuels : `TESTS_MANUELS_PROTECTION_CATEGORIES.md`
3. Vérifiez les logs du serveur backend
4. Testez les endpoints directement avec Postman/Thunder Client

---

## 🚀 Prochaines Étapes

1. **Implémenter le service API** dans votre projet frontend
2. **Créer les composants UI** selon vos besoins
3. **Tester le workflow complet** en environnement de développement
4. **Ajouter des notifications** pour améliorer l'UX
5. **Documenter** les composants pour votre équipe

Bon courage avec l'intégration ! 🎉
