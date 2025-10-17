# Guide Frontend - Suppression des Éléments de Catégorie

Guide d'intégration complet pour la suppression sécurisée des catégories, sous-catégories et variations dans l'application frontend.

## 🎯 Objectif

Ce guide décrit comment implémenter la suppression des éléments de catégorie (catégories, sous-catégories, variations) en respectant la règle métier : **un élément ne peut être supprimé que s'il n'est associé à aucun produit**.

## 📡 Endpoints Disponibles

### 1. Supprimer une Catégorie Principale
```http
DELETE /categories/{id}
```

**URL complète :** `http://localhost:3004/categories/{id}`

**Réponses possibles :**
- `204 No Content` - Catégorie supprimée avec succès
- `409 Conflict` - Catégorie utilisée par des produits
- `404 Not Found` - Catégorie non trouvée

### 2. Supprimer une Sous-Catégorie ⭐ **NOUVEAU**
```http
DELETE /sub-categories/{id}
```

**URL complète :** `http://localhost:3004/sub-categories/{id}`

**Réponses possibles :**
- `204 No Content` - Sous-catégorie supprimée avec succès
- `409 Conflict` - Sous-catégorie utilisée par des produits
- `404 Not Found` - Sous-catégorie non trouvée

### 3. Supprimer une Variation ⭐ **NOUVEAU**
```http
DELETE /variations/{id}
```

**URL complète :** `http://localhost:3004/variations/{id}`

**Réponses possibles :**
- `204 No Content` - Variation supprimée avec succès
- `409 Conflict` - Variation utilisée par des produits
- `404 Not Found` - Variation non trouvée

## 🚨 Règle Métier Critique

**Seuls les éléments qui ne sont PAS utilisés par des produits peuvent être supprimés.**

Le système vérifie automatiquement si des produits sont associés à l'élément avant d'autoriser la suppression.

## 📥 Réponses API

### ✅ Suppression Réussie (204 No Content)

**Corps :** Vide (pas de contenu)

**En-têtes HTTP :**
```http
HTTP/1.1 204 No Content
X-Powered-By: Express
Vary: Origin
Access-Control-Allow-Credentials: true
Content-Length: 0
```

**Traitement frontend :** Considérer comme succès, rafraîchir la liste des catégories.

### ❌ Erreur 409 - Élément Utilisé par des Produits

**Format de réponse :**
```json
{
  "success": false,
  "error": "CATEGORY_IN_USE" | "SUBCATEGORY_IN_USE" | "VARIATION_IN_USE",
  "message": "L'élément est utilisé par X produit(s). Il ne peut pas être supprimé.",
  "details": {
    "categoryId" | "subCategoryId" | "variationId": number,
    "productsCount": number
  }
}
```

**Exemples concrets :**

#### Catégorie utilisée :
```json
{
  "success": false,
  "error": "CATEGORY_IN_USE",
  "message": "La catégorie est utilisée par 2 produit(s).",
  "details": {
    "categoryId": 4,
    "productsCount": 2
  }
}
```

#### Sous-catégorie utilisée :
```json
{
  "success": false,
  "error": "SUBCATEGORY_IN_USE",
  "message": "La sous-catégorie est utilisée par 1 produit(s). Elle ne peut pas être supprimée.",
  "details": {
    "subCategoryId": 13,
    "productsCount": 1
  }
}
```

#### Variation utilisée :
```json
{
  "success": false,
  "error": "VARIATION_IN_USE",
  "message": "La variation est utilisée par 1 produit(s). Elle ne peut pas être supprimée.",
  "details": {
    "variationId": 28,
    "productsCount": 1
  }
}
```

### ❌ Erreur 404 - Élément Non Trouvé

```json
{
  "message": "Sous-catégorie avec ID 999 non trouvée",
  "error": "Not Found",
  "statusCode": 404
}
```

## 🛠️ Implémentation Frontend

### 1. Fonction Utilitaire de Suppression

```typescript
interface DeleteCategoryResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Supprime un élément de catégorie (catégorie, sous-catégorie ou variation)
 * @param type - Type d'élément ('category', 'subcategory', 'variation')
 * @param id - ID de l'élément à supprimer
 * @returns Promise<DeleteCategoryResult>
 */
async function deleteCategoryElement(type: string, id: number): Promise<DeleteCategoryResult> {
  const endpoints = {
    category: `/categories/${id}`,
    subcategory: `/sub-categories/${id}`,
    variation: `/variations/${id}`
  };

  const endpoint = endpoints[type];
  if (!endpoint) {
    throw new Error(`Type d'élément non supporté: ${type}`);
  }

  try {
    const response = await fetch(`http://localhost:3004${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Ajouter les headers d'authentification si nécessaire
        // 'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 204) {
      return { success: true, message: 'Élément supprimé avec succès' };
    }

    const error = await response.json();

    if (response.status === 404) {
      return {
        success: false,
        error: `Élément non trouvé: ${error.message}`,
        message: "L'élément que vous essayez de supprimer n'existe pas."
      };
    }

    if (response.status === 409) {
      return {
        success: false,
        error: error.error,
        message: error.message,
        details: error.details
      };
    }

    return {
      success: false,
      error: `Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`
    };

  } catch (error) {
    console.error(`Erreur lors de la suppression ${type} ${id}:`, error);
    return {
      success: false,
      error: 'Erreur réseau ou serveur indisponible'
    };
  }
}
```

### 2. Hook React avec Gestion d'État

```typescript
import { useState } from 'react';
import { deleteCategoryElement, DeleteCategoryResult } from './api/categoryApi';

interface UseDeleteCategoryReturn {
  deleteElement: (type: string, id: number) => Promise<DeleteCategoryResult>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useDeleteCategoryElement = (): UseDeleteCategoryReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteElement = async (type: string, id: number): Promise<DeleteCategoryResult> => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteCategoryElement(type, id);

      if (!result.success) {
        setError(result.message || result.error || 'Erreur lors de la suppression');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return { deleteElement, loading, error, clearError };
};
```

### 3. Composant de Confirmation Avancé

```typescript
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Package, AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  element: {
    id: number;
    name: string;
    type: 'category' | 'subcategory' | 'variation';
  };
  usageInfo?: {
    productsCount: number;
  };
  loading?: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  element,
  usageInfo,
  loading = false
}) => {
  const canDelete = !usageInfo || usageInfo.productsCount === 0;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'category': return 'Catégorie';
      case 'subcategory': return 'Sous-catégorie';
      case 'variation': return 'Variation';
      default: return 'Élément';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            Confirmer la suppression
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Êtes-vous sûr de vouloir supprimer la {getTypeLabel(element.type)}{' '}
            <span className="font-semibold text-gray-900">"{element.name}"</span> ?
          </p>

          {!canDelete && usageInfo && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-red-800 font-medium text-sm">
                    Suppression impossible
                  </h4>
                  <p className="text-red-700 text-sm mt-1">
                    Cette {getTypeLabel(element.type)} est utilisée par{' '}
                    <span className="font-semibold">{usageInfo.productsCount}</span>
                    {usageInfo.productsCount === 1 ? ' produit' : ' produits'}.
                  </p>
                  <p className="text-red-600 text-xs mt-2">
                    Pour supprimer cet élément, vous devez d'abord supprimer ou déplacer les produits associés.
                  </p>
                </div>
              </div>
            </div>
          )}

          {canDelete && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <p className="text-amber-800 text-sm">
                  Cette action est irréversible. Voulez-vous continuer ?
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              variant={canDelete ? "destructive" : "outline"}
              onClick={handleConfirm}
              disabled={!canDelete || loading}
              className={canDelete ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
```

### 4. Utilisation dans un Composant

```typescript
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useDeleteCategoryElement } from './hooks/useDeleteCategoryElement';
import DeleteConfirmDialog from './components/DeleteConfirmDialog';
import { toast } from 'react-hot-toast';

interface CategoryItemProps {
  category: {
    id: number;
    name: string;
    type: 'category' | 'subcategory' | 'variation';
    // autres propriétés selon votre structure de données
  };
  onDeleteSuccess: () => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, onDeleteSuccess }) => {
  const { deleteElement, loading, error, clearError } = useDeleteCategoryElement();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{ productsCount: number } | undefined>();

  const handleDeleteClick = async () => {
    const result = await deleteElement(category.type, category.id);

    if (result.success) {
      toast.success(`${category.name} a été supprimé avec succès`);
      onDeleteSuccess();
    } else {
      // Si l'erreur est due à des produits associés, afficher la boîte de dialogue
      if (result.details?.productsCount > 0) {
        setUsageInfo(result.details);
        setShowDeleteDialog(true);
      } else {
        toast.error(result.message || result.error || 'Erreur lors de la suppression');
      }
    }
  };

  const handleConfirmDelete = async () => {
    // Cas où on peut supprimer (après vérification)
    const result = await deleteElement(category.type, category.id);
    if (result.success) {
      toast.success(`${category.name} a été supprimé avec succès`);
      onDeleteSuccess();
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
      <div>
        <h3 className="font-medium">{category.name}</h3>
        <p className="text-sm text-gray-500 capitalize">{category.type}</p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={handleDeleteClick}
        disabled={loading}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          clearError();
          setUsageInfo(undefined);
        }}
        onConfirm={handleConfirmDelete}
        element={category}
        usageInfo={usageInfo}
        loading={loading}
      />
    </div>
  );
};

export default CategoryItem;
```

## 🔧 Détermination du Type d'Élément

### Fonction Utilitaire

```typescript
/**
 * Détermine le type d'un élément de catégorie basé sur sa structure
 * @param element - Élément de catégorie
 * @returns Type de l'élément ('category', 'subcategory', 'variation')
 */
export function determineCategoryElementType(element: any): 'category' | 'subcategory' | 'variation' {
  // Vérifier les champs spécifiques à chaque type

  // Catégorie principale : a subCategories et products
  if (element.subCategories !== undefined && element.products !== undefined) {
    return 'category';
  }

  // Sous-catégorie : a variations et category
  if (element.variations !== undefined && element.category !== undefined) {
    return 'subcategory';
  }

  // Variation : a subCategory
  if (element.subCategory !== undefined) {
    return 'variation';
  }

  // Fallback basé sur l'ID et la structure des données
  if (element.categoryId && !element.subCategoryId) {
    return 'subcategory';
  }

  if (element.subCategoryId) {
    return 'variation';
  }

  if (element.subCategories) {
    return 'category';
  }

  // Par défaut, considérer comme catégorie
  return 'category';
}
```

## 🧪 Tests d'Intégration

### Tests avec curl

```bash
# 1. Supprimer une sous-catégorie sans produits (succès)
curl -X DELETE http://localhost:3004/sub-categories/14 -v
# Attendu: 204 No Content

# 2. Essayer de supprimer une sous-catégorie avec produits (échec)
curl -X DELETE http://localhost:3004/sub-categories/13 -v
# Attendu: 409 Conflict avec message d'erreur

# 3. Supprimer une variation sans produits (succès)
curl -X DELETE http://localhost:3004/variations/29 -v
# Attendu: 204 No Content

# 4. Essayer de supprimer une variation avec produits (échec)
curl -X DELETE http://localhost:3004/variations/28 -v
# Attendu: 409 Conflict avec message d'erreur

# 5. Supprimer une catégorie sans produits (succès)
curl -X DELETE http://localhost:3004/categories/7 -v
# Attendu: 204 No Content

# 6. Essayer de supprimer une catégorie avec produits (échec)
curl -X DELETE http://localhost:3004/categories/4 -v
# Attendu: 409 Conflict avec message d'erreur
```

### Tests Frontend

```typescript
// Exemple de test unitaire pour la fonction de suppression
describe('deleteCategoryElement', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('devrait réussir la suppression d une sous-catégorie sans produits', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 204,
      ok: true
    });

    const result = await deleteCategoryElement('subcategory', 14);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Élément supprimé avec succès');
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3004/sub-categories/14',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('devrait échouer si la sous-catégorie a des produits', async () => {
    const mockResponse = {
      success: false,
      error: 'SUBCATEGORY_IN_USE',
      message: 'La sous-catégorie est utilisée par 1 produit(s). Elle ne peut pas être supprimée.',
      details: { subCategoryId: 13, productsCount: 1 }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await deleteCategoryElement('subcategory', 13);

    expect(result.success).toBe(false);
    expect(result.error).toBe('SUBCATEGORY_IN_USE');
    expect(result.message).toBe(mockResponse.message);
    expect(result.details).toEqual(mockResponse.details);
  });
});
```

## 📋 Checklist d'Intégration Frontend

- [ ] Implémenter les appels API vers les nouveaux endpoints
- [ ] Ajouter la logique de détermination du type d'élément
- [ ] Gérer les différentes réponses d'erreur (404, 409)
- [ ] Afficher des messages d'erreur clairs et informatifs à l'utilisateur
- [ ] Ajouter des boîtes de dialogue de confirmation avant suppression
- [ ] Désactiver les boutons de suppression pendant le chargement
- [ ] Rafraîchir l'interface après une suppression réussie
- [ ] Gérer le cas où des produits sont associés (afficher le nombre de produits)
- [ ] Tester tous les scénarios (succès, échec, réseau)
- [ ] Ajouter des logs pour le débogage

## 🚨 Bonnes Pratiques

1. **Toujours confirmer** avant de supprimer un élément
2. **Vérifier l'existence** de produits associés avant suppression
3. **Afficher des messages clairs** expliquant pourquoi la suppression échoue
4. **Gérer les erreurs réseau** avec des messages appropriés
5. **Rafraîchir les données** après une suppression réussie
6. **Désactiver les actions** pendant les appels API pour éviter les doubles clics
7. **Logger les erreurs** pour faciliter le débogage

## 🎯 Exemple de Flux Utilisateur Complet

1. **Utilisateur clique sur le bouton supprimer** d'une sous-catégorie
2. **Frontend détermine le type** (`subcategory`) grâce à `determineCategoryElementType()`
3. **Frontend appelle l'API** `DELETE /sub-categories/13`
4. **Système vérifie** si des produits utilisent cette sous-catégorie
5. **Cas A (0 produit)** → Suppression réussie (204)
6. **Cas B (1+ produits)** → Erreur 409 avec message détaillé
7. **Frontend affiche** le résultat approprié à l'utilisateur
8. **En cas de succès**, rafraîchir la liste des catégories

---

**✅ Les endpoints sont maintenant prêts, sécurisés et testés !** Utilisez ce guide pour intégrer la suppression d'éléments de catégorie dans votre frontend en toute sécurité.