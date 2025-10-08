# Guide Frontend - Implémentation Gestion Stocks Mockup

## 📋 Vue d'ensemble

Ce guide explique comment implémenter la création de produits mockup avec gestion complète des stocks par **variation de sous-catégorie** et **couleur**.

## 🎯 Architecture Backend Existante

Le backend accepte le format suivant :

```json
{
  "name": "T-shirt Premium Personnalisable",
  "description": "T-shirt de qualité",
  "price": 2500,
  "categoryIds": ["parent-id", "child-id", "variation-1-id", "variation-2-id"],
  "sizes": ["S", "M", "L", "XL"],

  "categoryVariations": [
    {
      "categoryId": "variation-1-id",
      "categoryName": "Col Rond",
      "colorVariations": [
        {
          "name": "Bleu Marine",
          "colorCode": "#001F3F",
          "stockBySize": {
            "S": 10,
            "M": 15,
            "L": 20,
            "XL": 5
          },
          "images": [
            {
              "fileId": "1678886400001",
              "view": "Front",
              "delimitations": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

**Points clés** :
- ✅ `stockBySize` est un **objet** : `{ "S": 10, "M": 15 }`
- ✅ Stocks organisés par : Variation catégorie → Couleur → Taille
- ✅ Endpoint : `POST /products/mockup`

## 🔌 Services API Frontend

### Service Catégories

```typescript
// services/categoryService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

export interface Category {
  id: string;
  name: string;
  level: number; // 0 = Parent, 1 = Enfant, 2 = Variation
  parentId: string | null;
  children?: Category[];
}

export class CategoryService {
  static async getHierarchy(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories/hierarchy`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des catégories');
    }

    return await response.json();
  }

  static async getCategoriesByLevel(level: number): Promise<Category[]> {
    const response = await fetch(
      `${API_BASE_URL}/categories?level=${level}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération');
    }

    return await response.json();
  }

  static async getChildren(parentId: string): Promise<Category[]> {
    const response = await fetch(
      `${API_BASE_URL}/categories/${parentId}/children`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des enfants');
    }

    return await response.json();
  }
}
```

### Service Produits Mockup

```typescript
// services/mockupProductService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004/api';

export interface StockBySize {
  [size: string]: number;
}

export interface ColorVariation {
  name: string;
  colorCode: string;
  stockBySize: StockBySize;
  images: ProductImage[];
}

export interface CategoryVariation {
  categoryId: string;
  categoryName: string;
  colorVariations: ColorVariation[];
}

export interface ProductImage {
  fileId: string;
  view: string;
  delimitations?: Delimitation[];
  file?: File;
}

export interface Delimitation {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  name?: string;
  coordinateType?: 'PERCENTAGE' | 'ABSOLUTE';
}

export interface CreateMockupProductDto {
  name: string;
  description: string;
  price: number;
  suggestedPrice?: number;
  categoryIds: string[];
  sizes: string[];
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
  categoryVariations: CategoryVariation[];
}

export class MockupProductService {
  static async createMockupProduct(
    productData: CreateMockupProductDto,
    files: { fileId: string; file: File }[]
  ): Promise<any> {
    try {
      const formData = new FormData();

      // Préparer les données pour le backend
      const backendData = {
        ...productData,
        categoryVariations: productData.categoryVariations.map(catVar => ({
          categoryId: catVar.categoryId,
          categoryName: catVar.categoryName,
          colorVariations: catVar.colorVariations.map(colorVar => ({
            name: colorVar.name,
            colorCode: colorVar.colorCode.toUpperCase(),
            stockBySize: colorVar.stockBySize, // ✅ Objet directement
            images: colorVar.images.map(img => ({
              fileId: img.fileId,
              view: img.view,
              delimitations: img.delimitations || []
            }))
          }))
        }))
      };

      formData.append('productData', JSON.stringify(backendData));

      // Ajouter les fichiers avec le bon format
      files.forEach(({ fileId, file }) => {
        formData.append(`file_${fileId}`, file);
      });

      const response = await fetch(`${API_BASE_URL}/products/mockup`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }

      return await response.json();
    } catch (error) {
      console.error('MockupProductService.createMockupProduct:', error);
      throw error;
    }
  }

  static async getMockupProducts(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/products/mockup`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des produits');
    }

    const result = await response.json();
    return result.data || [];
  }
}
```

## 🎨 Composants React/TypeScript

### 1. Sélecteur de Catégories avec Variations

```tsx
// components/CategorySelectorWithVariations.tsx
import React, { useState, useEffect } from 'react';
import { CategoryService, Category } from '../services/categoryService';

interface CategorySelectorWithVariationsProps {
  selectedCategoryIds: string[];
  onCategoriesChange: (categoryIds: string[]) => void;
  onVariationsDetected: (variations: Category[]) => void;
}

export const CategorySelectorWithVariations: React.FC<CategorySelectorWithVariationsProps> = ({
  selectedCategoryIds,
  onCategoriesChange,
  onVariationsDetected
}) => {
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [variationCategories, setVariationCategories] = useState<Category[]>([]);

  const [selectedParent, setSelectedParent] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadParentCategories();
  }, []);

  const loadParentCategories = async () => {
    setLoading(true);
    try {
      const categories = await CategoryService.getCategoriesByLevel(0);
      setParentCategories(categories);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleParentChange = async (parentId: string) => {
    setSelectedParent(parentId);
    setSelectedChild('');
    setSelectedVariations([]);
    setChildCategories([]);
    setVariationCategories([]);

    if (!parentId) {
      onCategoriesChange([]);
      onVariationsDetected([]);
      return;
    }

    try {
      const children = await CategoryService.getChildren(parentId);
      setChildCategories(children);
    } catch (err) {
      setError('Erreur lors du chargement des sous-catégories');
    }
  };

  const handleChildChange = async (childId: string) => {
    setSelectedChild(childId);
    setSelectedVariations([]);
    setVariationCategories([]);

    if (!childId) {
      onCategoriesChange(selectedParent ? [selectedParent] : []);
      onVariationsDetected([]);
      return;
    }

    try {
      const variations = await CategoryService.getChildren(childId);
      setVariationCategories(variations);

      // Mettre à jour les catégories sélectionnées
      onCategoriesChange([selectedParent, childId]);
      onVariationsDetected([]);
    } catch (err) {
      setError('Erreur lors du chargement des variations');
    }
  };

  const handleVariationToggle = (variationId: string, variationName: string) => {
    const newSelected = selectedVariations.includes(variationId)
      ? selectedVariations.filter(id => id !== variationId)
      : [...selectedVariations, variationId];

    setSelectedVariations(newSelected);

    // Construire la liste complète
    const fullSelection = [selectedParent, selectedChild, ...newSelected].filter(Boolean);
    onCategoriesChange(fullSelection);

    // Notifier les variations sélectionnées pour créer les structures de stock
    const selectedVariationObjects = variationCategories.filter(v =>
      newSelected.includes(v.id)
    );
    onVariationsDetected(selectedVariationObjects);
  };

  return (
    <div className="category-selector-with-variations">
      <h3>📁 Sélection des Catégories</h3>

      {error && <div className="error-message">{error}</div>}

      {/* Parent */}
      <div className="form-group">
        <label>Catégorie Principale *</label>
        <select
          value={selectedParent}
          onChange={(e) => handleParentChange(e.target.value)}
          disabled={loading}
        >
          <option value="">-- Sélectionnez --</option>
          {parentCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Enfant */}
      {selectedParent && childCategories.length > 0 && (
        <div className="form-group">
          <label>Sous-catégorie *</label>
          <select
            value={selectedChild}
            onChange={(e) => handleChildChange(e.target.value)}
          >
            <option value="">-- Sélectionnez --</option>
            {childCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Variations (checkboxes multiples) */}
      {selectedChild && variationCategories.length > 0 && (
        <div className="form-group">
          <label>Variations de Produit * (sélection multiple)</label>
          <div className="variation-checkboxes">
            {variationCategories.map(cat => (
              <label key={cat.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedVariations.includes(cat.id)}
                  onChange={() => handleVariationToggle(cat.id, cat.name)}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
          <small className="help-text">
            Sélectionnez les variations pour lesquelles vous voulez définir des stocks
            (ex: Col Rond, Col V, Manches Longues)
          </small>
        </div>
      )}

      {/* Résumé */}
      {selectedVariations.length > 0 && (
        <div className="selection-summary">
          <strong>✅ Variations sélectionnées:</strong>
          <ul>
            {selectedVariations.map(varId => {
              const variation = variationCategories.find(v => v.id === varId);
              return <li key={varId}>{variation?.name}</li>;
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### 2. Gestionnaire de Stocks par Variation

```tsx
// components/StockByVariationManager.tsx
import React, { useEffect } from 'react';

export interface StockBySize {
  [size: string]: number;
}

export interface ColorVariation {
  name: string;
  colorCode: string;
  stockBySize: StockBySize;
  images: any[];
}

export interface CategoryVariation {
  categoryId: string;
  categoryName: string;
  colorVariations: ColorVariation[];
}

interface StockByVariationManagerProps {
  sizes: string[];
  categoryVariations: CategoryVariation[];
  onStockChange: (catIndex: number, colorIndex: number, stockBySize: StockBySize) => void;
}

export const StockByVariationManager: React.FC<StockByVariationManagerProps> = ({
  sizes,
  categoryVariations,
  onStockChange
}) => {
  // Initialiser les stocks à 0
  useEffect(() => {
    categoryVariations.forEach((catVar, catIdx) => {
      catVar.colorVariations.forEach((colorVar, colorIdx) => {
        if (!colorVar.stockBySize || Object.keys(colorVar.stockBySize).length === 0) {
          const initialStock: StockBySize = {};
          sizes.forEach(size => {
            initialStock[size] = 0;
          });
          onStockChange(catIdx, colorIdx, initialStock);
        }
      });
    });
  }, [sizes]);

  const handleStockChange = (
    catIndex: number,
    colorIndex: number,
    size: string,
    value: number
  ) => {
    const currentStock = categoryVariations[catIndex].colorVariations[colorIndex].stockBySize || {};
    const newStock = {
      ...currentStock,
      [size]: Math.max(0, value)
    };
    onStockChange(catIndex, colorIndex, newStock);
  };

  const fillAllStocks = (catIndex: number, colorIndex: number, defaultValue: number) => {
    const newStock: StockBySize = {};
    sizes.forEach(size => {
      newStock[size] = defaultValue;
    });
    onStockChange(catIndex, colorIndex, newStock);
  };

  const getTotalForColor = (stockBySize: StockBySize): number => {
    return Object.values(stockBySize).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalForVariation = (catVar: CategoryVariation): number => {
    return catVar.colorVariations.reduce(
      (sum, colorVar) => sum + getTotalForColor(colorVar.stockBySize || {}),
      0
    );
  };

  if (sizes.length === 0) {
    return (
      <div className="stock-manager-empty">
        ⚠️ Veuillez d'abord définir les tailles disponibles
      </div>
    );
  }

  if (categoryVariations.length === 0) {
    return (
      <div className="stock-manager-empty">
        ⚠️ Veuillez d'abord sélectionner des variations de catégorie
      </div>
    );
  }

  return (
    <div className="stock-by-variation-manager">
      <h3>📦 Gestion des Stocks par Variation</h3>

      {categoryVariations.map((catVar, catIndex) => (
        <div key={catIndex} className="variation-section">
          {/* En-tête de variation */}
          <div className="variation-header">
            <div className="variation-title">
              <span className="badge-variation">Variation {catIndex + 1}</span>
              <h4>{catVar.categoryName}</h4>
            </div>
            <div className="variation-total">
              Total: {getTotalForVariation(catVar)} unités
            </div>
          </div>

          {/* Couleurs pour cette variation */}
          {catVar.colorVariations.map((colorVar, colorIndex) => (
            <div key={colorIndex} className="color-section">
              <div className="color-header">
                <div className="color-info">
                  <span
                    className="color-preview"
                    style={{ backgroundColor: colorVar.colorCode }}
                  />
                  <span className="color-name">
                    {colorVar.name || `Couleur ${colorIndex + 1}`}
                  </span>
                </div>
                <div className="color-total">
                  {getTotalForColor(colorVar.stockBySize || {})} unités
                </div>
              </div>

              {/* Grille de stocks par taille */}
              <div className="stock-grid">
                <div className="stock-grid-header">
                  <span>Taille</span>
                  <span>Quantité en stock</span>
                </div>

                {sizes.filter(s => s.trim()).map((size, sizeIdx) => (
                  <div key={sizeIdx} className="stock-grid-row">
                    <label className="size-label">
                      <span className="size-badge">{size}</span>
                    </label>
                    <div className="stock-input-wrapper">
                      <input
                        type="number"
                        min="0"
                        value={colorVar.stockBySize?.[size] || 0}
                        onChange={(e) => handleStockChange(
                          catIndex,
                          colorIndex,
                          size,
                          parseInt(e.target.value) || 0
                        )}
                        className="stock-input"
                      />
                      <span className="unit">unités</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions rapides */}
              <div className="quick-actions">
                <button
                  type="button"
                  onClick={() => fillAllStocks(catIndex, colorIndex, 10)}
                  className="btn-quick"
                >
                  📦 10/taille
                </button>
                <button
                  type="button"
                  onClick={() => fillAllStocks(catIndex, colorIndex, 20)}
                  className="btn-quick"
                >
                  📦 20/taille
                </button>
                <button
                  type="button"
                  onClick={() => fillAllStocks(catIndex, colorIndex, 0)}
                  className="btn-clear"
                >
                  🗑️ Reset
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Tableau récapitulatif global */}
      <div className="global-summary">
        <h4>📊 Récapitulatif Global</h4>

        {categoryVariations.map((catVar, catIdx) => (
          <div key={catIdx} className="summary-block">
            <h5>{catVar.categoryName}</h5>

            <table className="summary-table">
              <thead>
                <tr>
                  <th>Couleur</th>
                  {sizes.filter(s => s.trim()).map((size, idx) => (
                    <th key={idx}>{size}</th>
                  ))}
                  <th className="total-col">Total</th>
                </tr>
              </thead>
              <tbody>
                {catVar.colorVariations.map((colorVar, colorIdx) => (
                  <tr key={colorIdx}>
                    <td>
                      <span
                        className="color-dot"
                        style={{ backgroundColor: colorVar.colorCode }}
                      />
                      {colorVar.name}
                    </td>
                    {sizes.filter(s => s.trim()).map((size, sIdx) => (
                      <td key={sIdx}>{colorVar.stockBySize?.[size] || 0}</td>
                    ))}
                    <td className="total-cell">
                      {getTotalForColor(colorVar.stockBySize || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="subtotal-row">
                  <td>Sous-total</td>
                  {sizes.filter(s => s.trim()).map((size, idx) => (
                    <td key={idx}>
                      {catVar.colorVariations.reduce(
                        (sum, cv) => sum + (cv.stockBySize?.[size] || 0),
                        0
                      )}
                    </td>
                  ))}
                  <td className="total-cell">
                    {getTotalForVariation(catVar)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}

        {/* Grand total */}
        <div className="grand-total">
          <span>Total général de tous les stocks:</span>
          <strong>
            {categoryVariations.reduce(
              (sum, catVar) => sum + getTotalForVariation(catVar),
              0
            )} unités
          </strong>
        </div>
      </div>
    </div>
  );
};
```

### 3. Formulaire Complet de Création Mockup

```tsx
// components/CreateMockupForm.tsx
import React, { useState } from 'react';
import { CategorySelectorWithVariations } from './CategorySelectorWithVariations';
import { StockByVariationManager } from './StockByVariationManager';
import { MockupProductService } from '../services/mockupProductService';
import type { Category } from '../services/categoryService';
import type { CategoryVariation, ColorVariation } from './StockByVariationManager';

const PREDEFINED_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export const CreateMockupForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    suggestedPrice: '',
    categoryIds: [] as string[],
    sizes: ['S', 'M', 'L', 'XL'],
    genre: 'UNISEXE' as 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE'
  });

  const [categoryVariations, setCategoryVariations] = useState<CategoryVariation[]>([]);
  const [loading, setLoading] = useState(false);

  // Quand les variations sont détectées, créer les structures
  const handleVariationsDetected = (variations: Category[]) => {
    const newCategoryVariations: CategoryVariation[] = variations.map(variation => {
      // Vérifier si cette variation existe déjà
      const existing = categoryVariations.find(cv => cv.categoryId === variation.id);
      if (existing) return existing;

      return {
        categoryId: variation.id,
        categoryName: variation.name,
        colorVariations: []
      };
    });

    setCategoryVariations(newCategoryVariations);
  };

  // Gérer les tailles
  const handleSizeChange = (index: number, value: string) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const addSize = () => {
    setFormData(prev => ({ ...prev, sizes: [...prev.sizes, ''] }));
  };

  const removeSize = (index: number) => {
    if (formData.sizes.length > 1) {
      setFormData(prev => ({
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index)
      }));
    }
  };

  // Gérer les couleurs
  const addColorToVariation = (catIndex: number) => {
    const newVariations = [...categoryVariations];
    newVariations[catIndex].colorVariations.push({
      name: '',
      colorCode: '#000000',
      stockBySize: {},
      images: []
    });
    setCategoryVariations(newVariations);
  };

  const removeColorFromVariation = (catIndex: number, colorIndex: number) => {
    const newVariations = [...categoryVariations];
    if (newVariations[catIndex].colorVariations.length > 1) {
      newVariations[catIndex].colorVariations.splice(colorIndex, 1);
      setCategoryVariations(newVariations);
    }
  };

  const handleColorChange = (
    catIndex: number,
    colorIndex: number,
    field: string,
    value: any
  ) => {
    const newVariations = [...categoryVariations];
    newVariations[catIndex].colorVariations[colorIndex] = {
      ...newVariations[catIndex].colorVariations[colorIndex],
      [field]: value
    };
    setCategoryVariations(newVariations);
  };

  const handleStockChange = (
    catIndex: number,
    colorIndex: number,
    stockBySize: Record<string, number>
  ) => {
    const newVariations = [...categoryVariations];
    newVariations[catIndex].colorVariations[colorIndex].stockBySize = stockBySize;
    setCategoryVariations(newVariations);
  };

  const handleImageUpload = (
    catIndex: number,
    colorIndex: number,
    files: FileList
  ) => {
    const newVariations = [...categoryVariations];
    const newImages = Array.from(files).map((file, idx) => ({
      fileId: `${Date.now()}_${catIndex}_${colorIndex}_${idx}`,
      file,
      view: 'Front',
      delimitations: []
    }));

    newVariations[catIndex].colorVariations[colorIndex].images = [
      ...newVariations[catIndex].colorVariations[colorIndex].images,
      ...newImages
    ];

    setCategoryVariations(newVariations);
  };

  // Validation
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim() || formData.name.length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Le prix doit être supérieur à 0');
    }

    if (formData.categoryIds.length === 0) {
      errors.push('Veuillez sélectionner au moins une catégorie');
    }

    const validSizes = formData.sizes.filter(s => s.trim() !== '');
    if (validSizes.length === 0) {
      errors.push('Au moins une taille est requise');
    }

    if (categoryVariations.length === 0) {
      errors.push('Veuillez sélectionner au moins une variation de catégorie');
    }

    categoryVariations.forEach((catVar, catIdx) => {
      if (catVar.colorVariations.length === 0) {
        errors.push(`Aucune couleur définie pour "${catVar.categoryName}"`);
      }

      catVar.colorVariations.forEach((colorVar, colorIdx) => {
        if (!colorVar.name.trim()) {
          errors.push(`Couleur ${colorIdx + 1} de "${catVar.categoryName}" sans nom`);
        }

        const totalStock = Object.values(colorVar.stockBySize).reduce((sum, qty) => sum + qty, 0);
        if (totalStock === 0) {
          errors.push(`"${colorVar.name}" dans "${catVar.categoryName}" n'a aucun stock`);
        }

        if (colorVar.images.length === 0) {
          errors.push(`"${colorVar.name}" dans "${catVar.categoryName}" sans image`);
        }
      });
    });

    return errors;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      alert('Erreurs de validation:\n\n' + errors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const validSizes = formData.sizes.filter(s => s.trim() !== '');

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        suggestedPrice: formData.suggestedPrice ? parseFloat(formData.suggestedPrice) : undefined,
        categoryIds: formData.categoryIds,
        sizes: validSizes,
        genre: formData.genre,
        categoryVariations
      };

      const files = categoryVariations.flatMap(catVar =>
        catVar.colorVariations.flatMap(colorVar =>
          colorVar.images.map(img => ({
            fileId: img.fileId,
            file: img.file
          }))
        )
      );

      const result = await MockupProductService.createMockupProduct(productData, files);

      alert(`Produit mockup "${result.data.name}" créé avec succès !`);
      window.location.reload();

    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-mockup-form">
      <h2>🎨 Créer un Produit Mockup</h2>

      {/* Informations de base */}
      <section className="form-section">
        <h3>Informations générales</h3>

        <div className="form-group">
          <label>Nom du produit *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: T-shirt Premium Personnalisable"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            placeholder="Description du produit mockup..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Prix de base (FCFA) *</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              step="0.01"
              min="0"
              placeholder="2500"
              required
            />
          </div>

          <div className="form-group">
            <label>Prix suggéré (FCFA)</label>
            <input
              type="number"
              value={formData.suggestedPrice}
              onChange={(e) => setFormData(prev => ({ ...prev, suggestedPrice: e.target.value }))}
              step="0.01"
              min="0"
              placeholder="3000"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Genre</label>
          <select
            value={formData.genre}
            onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value as any }))}
          >
            <option value="UNISEXE">Unisexe</option>
            <option value="HOMME">Homme</option>
            <option value="FEMME">Femme</option>
            <option value="BEBE">Bébé</option>
          </select>
        </div>
      </section>

      {/* Catégories */}
      <section className="form-section">
        <CategorySelectorWithVariations
          selectedCategoryIds={formData.categoryIds}
          onCategoriesChange={(ids) => setFormData(prev => ({ ...prev, categoryIds: ids }))}
          onVariationsDetected={handleVariationsDetected}
        />
      </section>

      {/* Tailles */}
      <section className="form-section">
        <h3>Tailles disponibles *</h3>
        {formData.sizes.map((size, index) => (
          <div key={index} className="form-row">
            <input
              type="text"
              value={size}
              onChange={(e) => handleSizeChange(index, e.target.value)}
              placeholder="Ex: M, Large..."
              list="predefined-sizes"
            />
            {formData.sizes.length > 1 && (
              <button
                type="button"
                onClick={() => removeSize(index)}
                className="btn-remove"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addSize} className="btn-add">
          + Ajouter une taille
        </button>

        <datalist id="predefined-sizes">
          {PREDEFINED_SIZES.map(size => (
            <option key={size} value={size} />
          ))}
        </datalist>
      </section>

      {/* Couleurs par variation */}
      {categoryVariations.length > 0 && (
        <section className="form-section">
          <h3>Couleurs par Variation</h3>

          {categoryVariations.map((catVar, catIndex) => (
            <div key={catIndex} className="variation-block">
              <h4>📁 {catVar.categoryName}</h4>

              {catVar.colorVariations.map((colorVar, colorIndex) => (
                <div key={colorIndex} className="color-item">
                  <div className="color-item-header">
                    <span>Couleur {colorIndex + 1}</span>
                    {catVar.colorVariations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColorFromVariation(catIndex, colorIndex)}
                        className="btn-remove-small"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Nom *</label>
                      <input
                        type="text"
                        value={colorVar.name}
                        onChange={(e) => handleColorChange(catIndex, colorIndex, 'name', e.target.value)}
                        placeholder="Ex: Bleu Marine"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Code *</label>
                      <input
                        type="color"
                        value={colorVar.colorCode}
                        onChange={(e) => handleColorChange(catIndex, colorIndex, 'colorCode', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Images *</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(catIndex, colorIndex, e.target.files)}
                    />
                    <small>{colorVar.images.length} image(s)</small>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addColorToVariation(catIndex)}
                className="btn-add-color"
              >
                + Ajouter une couleur pour {catVar.categoryName}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Gestion des stocks */}
      {categoryVariations.length > 0 && (
        <section className="form-section">
          <StockByVariationManager
            sizes={formData.sizes.filter(s => s.trim() !== '')}
            categoryVariations={categoryVariations}
            onStockChange={handleStockChange}
          />
        </section>
      )}

      {/* Bouton submit */}
      <div className="form-actions">
        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? '⏳ Création en cours...' : '✅ Créer le produit mockup'}
        </button>
      </div>
    </form>
  );
};
```

## 🎨 Styles CSS

```css
/* styles/CreateMockupForm.css */

.create-mockup-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.form-section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.form-row {
  display: flex;
  gap: 15px;
  align-items: flex-end;
}

.flex-1 {
  flex: 1;
}

/* Category selector */
.category-selector-with-variations {
  padding: 15px;
}

.variation-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.selection-summary {
  margin-top: 15px;
  padding: 10px;
  background: #e8f4f8;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

/* Stock manager */
.stock-by-variation-manager {
  padding: 15px;
}

.variation-section {
  background: #f8f9fa;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.variation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 3px solid #007bff;
}

.variation-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.badge-variation {
  background: #007bff;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.variation-total {
  background: #e8f4f8;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: bold;
  color: #007bff;
}

.color-section {
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.color-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ddd;
}

.color-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-preview {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 3px solid #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.color-name {
  font-weight: bold;
  font-size: 16px;
}

.color-total {
  background: #fff3cd;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  color: #856404;
}

.stock-grid {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  margin-bottom: 15px;
}

.stock-grid-header {
  display: contents;
}

.stock-grid-header span {
  padding: 10px;
  background: #495057;
  color: white;
  font-weight: bold;
  border-radius: 4px;
  text-align: center;
}

.stock-grid-row {
  display: contents;
}

.size-label {
  padding: 10px;
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.size-badge {
  background: #6c757d;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
}

.stock-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 5px 10px;
}

.stock-input {
  flex: 1;
  border: none;
  padding: 5px;
  font-size: 16px;
  font-weight: bold;
}

.stock-input:focus {
  outline: none;
}

.unit {
  color: #6c757d;
  font-size: 12px;
}

.quick-actions {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed #dee2e6;
}

.btn-quick,
.btn-clear {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-quick {
  background: #28a745;
  color: white;
}

.btn-quick:hover {
  background: #218838;
}

.btn-clear {
  background: #6c757d;
  color: white;
}

.btn-clear:hover {
  background: #5a6268;
}

/* Tableau récapitulatif */
.global-summary {
  margin-top: 30px;
  padding: 20px;
  background: white;
  border: 3px solid #28a745;
  border-radius: 8px;
}

.global-summary h4 {
  margin-top: 0;
  color: #28a745;
  border-bottom: 2px solid #28a745;
  padding-bottom: 10px;
}

.summary-block {
  margin-bottom: 25px;
}

.summary-block h5 {
  background: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.summary-table th,
.summary-table td {
  padding: 10px;
  text-align: center;
  border: 1px solid #dee2e6;
}

.summary-table thead th {
  background: #495057;
  color: white;
  font-weight: bold;
}

.summary-table tbody tr:nth-child(even) {
  background: #f8f9fa;
}

.summary-table tbody tr:hover {
  background: #e9ecef;
}

.total-col {
  background: #fff3cd;
}

.total-cell {
  background: #fff3cd !important;
  font-weight: bold;
  font-size: 15px;
}

.subtotal-row {
  background: #d1ecf1 !important;
  font-weight: bold;
}

.color-dot {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #333;
  margin-right: 8px;
  vertical-align: middle;
}

.grand-total {
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  font-size: 18px;
}

.grand-total strong {
  font-size: 24px;
}

/* Variation blocks */
.variation-block {
  background: #e8f4f8;
  border: 1px solid #bee5eb;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.color-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
}

.color-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}

/* Buttons */
.btn-add,
.btn-add-color,
.btn-submit {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-add:hover,
.btn-add-color:hover,
.btn-submit:hover {
  background: #0056b3;
}

.btn-add-color {
  background: #17a2b8;
  width: 100%;
}

.btn-add-color:hover {
  background: #138496;
}

.btn-remove,
.btn-remove-small {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.form-actions {
  text-align: center;
  margin-top: 20px;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border: 1px solid #f5c6cb;
}

.stock-manager-empty {
  padding: 20px;
  text-align: center;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  color: #856404;
}

.help-text {
  color: #6c757d;
  font-size: 13px;
  margin-top: 5px;
  display: block;
}
```

## ✅ Checklist d'intégration

- [ ] Installer les dépendances si nécessaire
- [ ] Créer CategoryService
- [ ] Créer MockupProductService
- [ ] Implémenter CategorySelectorWithVariations
- [ ] Implémenter StockByVariationManager
- [ ] Créer CreateMockupForm
- [ ] Ajouter les styles CSS
- [ ] Tester la sélection de variations
- [ ] Tester l'ajout de couleurs par variation
- [ ] Tester la gestion des stocks
- [ ] Vérifier le tableau récapitulatif
- [ ] Tester la soumission complète
- [ ] Valider avec le backend

## 🎯 Points clés

1. **Format backend** : `stockBySize: { "S": 10, "M": 15 }`
2. **3 niveaux** : Catégorie parent → Enfant → Variations
3. **Stocks par** : Variation catégorie → Couleur → Taille
4. **Validation** : Tous les stocks doivent être > 0
5. **Upload** : Fichiers avec `file_${fileId}`
6. **Endpoint** : `POST /products/mockup`

Votre frontend est maintenant prêt pour créer des mockups avec gestion complète des stocks ! 🚀
