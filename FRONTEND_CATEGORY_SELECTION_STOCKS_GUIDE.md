# Guide Frontend - Sélection Catégories et Gestion Stocks par Variation

## 📋 Vue d'ensemble

Ce guide explique comment intégrer :
1. **Sélection de catégories** avec hiérarchie Parent → Enfant → Variation
2. **Gestion des stocks** pour chaque variation de couleur et taille

## 🎯 Architecture des données

### Structure Catégorie (3 niveaux)

```typescript
interface Category {
  id: string;
  name: string;
  level: number; // 0 = Parent, 1 = Enfant, 2 = Variation
  parentId: string | null;
  children?: Category[];
}

// Exemple:
// T-shirts (Parent, level 0)
//   ├─ T-shirts manches courtes (Enfant, level 1)
//   │   ├─ Col rond (Variation, level 2)
//   │   └─ Col V (Variation, level 2)
//   └─ T-shirts manches longues (Enfant, level 1)
```

### Structure Stock par Variation

```typescript
interface ColorVariation {
  name: string;              // "Rouge"
  colorCode: string;         // "#FF0000"
  stock: StockBySizeColor;   // Stock par taille
  images: ProductImage[];
}

interface StockBySizeColor {
  [size: string]: number;
  // Exemple: { "S": 10, "M": 15, "L": 20, "XL": 5 }
}

interface ProductFormData {
  name: string;
  description: string;
  price: number;
  categoryIds: string[];     // IDs des catégories sélectionnées
  sizes: string[];           // ["S", "M", "L", "XL"]
  colorVariations: ColorVariation[];
}
```

## 🔌 Services API

### 1. Service Catégories

```typescript
// services/categoryService.ts
const API_BASE_URL = 'http://localhost:3004/api';

export interface Category {
  id: string;
  name: string;
  level: number;
  parentId: string | null;
  children?: Category[];
}

export class CategoryService {
  // Récupérer toutes les catégories avec hiérarchie
  static async getHierarchy(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/hierarchy`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des catégories');
      }

      return await response.json();
    } catch (error) {
      console.error('CategoryService.getHierarchy:', error);
      throw error;
    }
  }

  // Récupérer les catégories par niveau
  static async getCategoriesByLevel(level: number): Promise<Category[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/categories?level=${level}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des catégories');
      }

      return await response.json();
    } catch (error) {
      console.error('CategoryService.getCategoriesByLevel:', error);
      throw error;
    }
  }

  // Récupérer les enfants d'une catégorie
  static async getChildren(parentId: string): Promise<Category[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/categories/${parentId}/children`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des enfants');
      }

      return await response.json();
    } catch (error) {
      console.error('CategoryService.getChildren:', error);
      throw error;
    }
  }
}
```

### 2. Service Produits avec Stocks

```typescript
// services/productService.ts
export interface StockBySizeColor {
  [size: string]: number;
}

export interface ColorVariationDto {
  name: string;
  colorCode: string;
  stock: StockBySizeColor;
  images: ProductImageDto[];
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  categoryIds: string[];
  sizes: string[];
  colorVariations: ColorVariationDto[];
}

export class ProductService {
  static async createProduct(
    productData: CreateProductDto,
    files: { fileId: string; file: File }[]
  ): Promise<any> {
    try {
      const formData = new FormData();

      // Ajouter les données du produit
      formData.append('productData', JSON.stringify(productData));

      // Ajouter les fichiers
      files.forEach(({ fileId, file }) => {
        formData.append(`file_${fileId}`, file);
      });

      const response = await fetch(`${API_BASE_URL}/products`, {
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
      console.error('ProductService.createProduct:', error);
      throw error;
    }
  }
}
```

## 🎨 Composants React

### 1. Sélecteur de Catégories en Cascade

```tsx
// components/CategorySelector.tsx
import React, { useState, useEffect } from 'react';
import { CategoryService, Category } from '../services/categoryService';

interface CategorySelectorProps {
  selectedCategoryIds: string[];
  onCategoriesChange: (categoryIds: string[]) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryIds,
  onCategoriesChange
}) => {
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [childCategories, setChildCategories] = useState<Category[]>([]);
  const [variationCategories, setVariationCategories] = useState<Category[]>([]);

  const [selectedParent, setSelectedParent] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedVariations, setSelectedVariations] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les catégories parentes au montage
  useEffect(() => {
    loadParentCategories();
  }, []);

  const loadParentCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const categories = await CategoryService.getCategoriesByLevel(0);
      setParentCategories(categories);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les enfants quand un parent est sélectionné
  const handleParentChange = async (parentId: string) => {
    setSelectedParent(parentId);
    setSelectedChild('');
    setSelectedVariations([]);
    setChildCategories([]);
    setVariationCategories([]);

    if (!parentId) {
      onCategoriesChange([]);
      return;
    }

    try {
      const children = await CategoryService.getChildren(parentId);
      setChildCategories(children);
    } catch (err) {
      setError('Erreur lors du chargement des sous-catégories');
      console.error(err);
    }
  };

  // Charger les variations quand un enfant est sélectionné
  const handleChildChange = async (childId: string) => {
    setSelectedChild(childId);
    setSelectedVariations([]);
    setVariationCategories([]);

    if (!childId) {
      onCategoriesChange(selectedParent ? [selectedParent] : []);
      return;
    }

    try {
      const variations = await CategoryService.getChildren(childId);
      setVariationCategories(variations);

      // Mettre à jour avec parent + enfant
      onCategoriesChange([selectedParent, childId]);
    } catch (err) {
      setError('Erreur lors du chargement des variations');
      console.error(err);
    }
  };

  // Gérer la sélection multiple des variations
  const handleVariationToggle = (variationId: string) => {
    const newSelected = selectedVariations.includes(variationId)
      ? selectedVariations.filter(id => id !== variationId)
      : [...selectedVariations, variationId];

    setSelectedVariations(newSelected);

    // Construire la liste complète: parent + enfant + variations
    const fullSelection = [
      selectedParent,
      selectedChild,
      ...newSelected
    ].filter(Boolean);

    onCategoriesChange(fullSelection);
  };

  if (loading && parentCategories.length === 0) {
    return <div className="category-selector-loading">Chargement...</div>;
  }

  return (
    <div className="category-selector">
      <h3>Sélection des catégories</h3>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Niveau 1: Parent */}
      <div className="category-level">
        <label htmlFor="parent-category">Catégorie principale *</label>
        <select
          id="parent-category"
          value={selectedParent}
          onChange={(e) => handleParentChange(e.target.value)}
          required
        >
          <option value="">-- Sélectionnez une catégorie --</option>
          {parentCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Niveau 2: Enfant */}
      {selectedParent && childCategories.length > 0 && (
        <div className="category-level">
          <label htmlFor="child-category">Sous-catégorie</label>
          <select
            id="child-category"
            value={selectedChild}
            onChange={(e) => handleChildChange(e.target.value)}
          >
            <option value="">-- Sélectionnez une sous-catégorie --</option>
            {childCategories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Niveau 3: Variations (sélection multiple) */}
      {selectedChild && variationCategories.length > 0 && (
        <div className="category-level">
          <label>Variations (optionnel - sélection multiple)</label>
          <div className="variation-checkboxes">
            {variationCategories.map(cat => (
              <label key={cat.id} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedVariations.includes(cat.id)}
                  onChange={() => handleVariationToggle(cat.id)}
                />
                {cat.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Résumé de la sélection */}
      {selectedCategoryIds.length > 0 && (
        <div className="category-summary">
          <strong>Catégories sélectionnées:</strong>
          <ul>
            {selectedParent && (
              <li>{parentCategories.find(c => c.id === selectedParent)?.name}</li>
            )}
            {selectedChild && (
              <li>└─ {childCategories.find(c => c.id === selectedChild)?.name}</li>
            )}
            {selectedVariations.map(varId => (
              <li key={varId}>
                &nbsp;&nbsp;&nbsp;└─ {variationCategories.find(c => c.id === varId)?.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### 2. Gestionnaire de Stocks par Taille et Couleur

```tsx
// components/StockManager.tsx
import React, { useState, useEffect } from 'react';

interface StockBySizeColor {
  [size: string]: number;
}

interface ColorVariation {
  name: string;
  colorCode: string;
  stock: StockBySizeColor;
}

interface StockManagerProps {
  sizes: string[];
  colorVariations: ColorVariation[];
  onStockChange: (colorIndex: number, stock: StockBySizeColor) => void;
}

export const StockManager: React.FC<StockManagerProps> = ({
  sizes,
  colorVariations,
  onStockChange
}) => {
  // Initialiser les stocks pour chaque couleur/taille
  useEffect(() => {
    colorVariations.forEach((variation, index) => {
      if (!variation.stock || Object.keys(variation.stock).length === 0) {
        const initialStock: StockBySizeColor = {};
        sizes.forEach(size => {
          initialStock[size] = 0;
        });
        onStockChange(index, initialStock);
      }
    });
  }, [sizes, colorVariations.length]);

  const handleStockChange = (
    colorIndex: number,
    size: string,
    quantity: number
  ) => {
    const newStock = {
      ...colorVariations[colorIndex].stock,
      [size]: Math.max(0, quantity) // Ne pas permettre de valeurs négatives
    };
    onStockChange(colorIndex, newStock);
  };

  // Calcul du stock total pour une couleur
  const getTotalStockForColor = (stock: StockBySizeColor): number => {
    return Object.values(stock).reduce((sum, qty) => sum + qty, 0);
  };

  if (sizes.length === 0) {
    return (
      <div className="stock-manager-empty">
        <p>⚠️ Veuillez d'abord définir les tailles disponibles</p>
      </div>
    );
  }

  return (
    <div className="stock-manager">
      <h3>Gestion des stocks par taille et couleur</h3>

      {colorVariations.map((variation, colorIndex) => (
        <div key={colorIndex} className="stock-color-section">
          <div className="stock-color-header">
            <div className="color-indicator">
              <span
                className="color-preview"
                style={{ backgroundColor: variation.colorCode }}
              />
              <span className="color-name">{variation.name || `Couleur ${colorIndex + 1}`}</span>
            </div>
            <div className="total-stock">
              Total: {getTotalStockForColor(variation.stock || {})} unités
            </div>
          </div>

          <div className="stock-grid">
            <div className="stock-grid-header">
              <span>Taille</span>
              <span>Quantité</span>
            </div>

            {sizes.filter(size => size.trim() !== '').map((size, sizeIndex) => (
              <div key={sizeIndex} className="stock-grid-row">
                <label htmlFor={`stock-${colorIndex}-${sizeIndex}`}>
                  {size}
                </label>
                <input
                  id={`stock-${colorIndex}-${sizeIndex}`}
                  type="number"
                  min="0"
                  value={variation.stock?.[size] || 0}
                  onChange={(e) => handleStockChange(
                    colorIndex,
                    size,
                    parseInt(e.target.value) || 0
                  )}
                  placeholder="0"
                />
              </div>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="stock-quick-actions">
            <button
              type="button"
              onClick={() => {
                const newStock: StockBySizeColor = {};
                sizes.forEach(size => {
                  newStock[size] = 10;
                });
                onStockChange(colorIndex, newStock);
              }}
              className="btn-quick-fill"
            >
              Remplir avec 10 unités par taille
            </button>

            <button
              type="button"
              onClick={() => {
                const newStock: StockBySizeColor = {};
                sizes.forEach(size => {
                  newStock[size] = 0;
                });
                onStockChange(colorIndex, newStock);
              }}
              className="btn-clear-stock"
            >
              Réinitialiser les stocks
            </button>
          </div>
        </div>
      ))}

      {/* Récapitulatif global */}
      <div className="stock-summary">
        <h4>Récapitulatif global</h4>
        <table className="stock-summary-table">
          <thead>
            <tr>
              <th>Couleur</th>
              {sizes.filter(s => s.trim()).map((size, idx) => (
                <th key={idx}>{size}</th>
              ))}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {colorVariations.map((variation, idx) => (
              <tr key={idx}>
                <td>
                  <span
                    className="color-dot"
                    style={{ backgroundColor: variation.colorCode }}
                  />
                  {variation.name}
                </td>
                {sizes.filter(s => s.trim()).map((size, sIdx) => (
                  <td key={sIdx}>{variation.stock?.[size] || 0}</td>
                ))}
                <td className="total-cell">
                  {getTotalStockForColor(variation.stock || {})}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="grand-total">
              <td>Total général</td>
              {sizes.filter(s => s.trim()).map((size, idx) => (
                <td key={idx}>
                  {colorVariations.reduce(
                    (sum, v) => sum + (v.stock?.[size] || 0),
                    0
                  )}
                </td>
              ))}
              <td className="total-cell">
                {colorVariations.reduce(
                  (sum, v) => sum + getTotalStockForColor(v.stock || {}),
                  0
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
```

### 3. Formulaire Complet Intégré

```tsx
// components/ProductFormComplete.tsx
import React, { useState } from 'react';
import { CategorySelector } from './CategorySelector';
import { StockManager } from './StockManager';
import { ProductService } from '../services/productService';

interface ColorVariation {
  name: string;
  colorCode: string;
  stock: { [size: string]: number };
  images: any[];
}

export const ProductFormComplete: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryIds: [] as string[],
    sizes: ['S', 'M', 'L', 'XL']
  });

  const [colorVariations, setColorVariations] = useState<ColorVariation[]>([
    {
      name: '',
      colorCode: '#000000',
      stock: {},
      images: []
    }
  ]);

  const [loading, setLoading] = useState(false);

  // Gérer les tailles
  const handleSizeChange = (index: number, value: string) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const addSize = () => {
    setFormData(prev => ({
      ...prev,
      sizes: [...prev.sizes, '']
    }));
  };

  const removeSize = (index: number) => {
    if (formData.sizes.length > 1) {
      const newSizes = formData.sizes.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, sizes: newSizes }));
    }
  };

  // Gérer les variations de couleur
  const addColorVariation = () => {
    setColorVariations(prev => [
      ...prev,
      {
        name: '',
        colorCode: '#000000',
        stock: {},
        images: []
      }
    ]);
  };

  const removeColorVariation = (index: number) => {
    if (colorVariations.length > 1) {
      setColorVariations(colorVariations.filter((_, i) => i !== index));
    }
  };

  const handleColorChange = (index: number, field: string, value: any) => {
    const newVariations = [...colorVariations];
    newVariations[index] = {
      ...newVariations[index],
      [field]: value
    };
    setColorVariations(newVariations);
  };

  const handleStockChange = (colorIndex: number, stock: { [size: string]: number }) => {
    const newVariations = [...colorVariations];
    newVariations[colorIndex].stock = stock;
    setColorVariations(newVariations);
  };

  // Gérer les images
  const handleImageUpload = (colorIndex: number, files: FileList) => {
    const newVariations = [...colorVariations];
    const newImages = Array.from(files).map((file, idx) => ({
      fileId: `${Date.now()}_${colorIndex}_${idx}`,
      file: file,
      view: 'Front',
      delimitations: []
    }));

    newVariations[colorIndex].images = [
      ...newVariations[colorIndex].images,
      ...newImages
    ];

    setColorVariations(newVariations);
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

    colorVariations.forEach((variation, idx) => {
      if (!variation.name.trim()) {
        errors.push(`Le nom de la couleur ${idx + 1} est requis`);
      }

      const totalStock = Object.values(variation.stock).reduce((sum, qty) => sum + qty, 0);
      if (totalStock === 0) {
        errors.push(`La couleur "${variation.name}" n'a aucun stock défini`);
      }

      if (variation.images.length === 0) {
        errors.push(`Au moins une image est requise pour "${variation.name}"`);
      }
    });

    return errors;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const validSizes = formData.sizes.filter(s => s.trim() !== '');

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryIds: formData.categoryIds,
        sizes: validSizes,
        colorVariations: colorVariations.map(v => ({
          name: v.name,
          colorCode: v.colorCode.toUpperCase(),
          stock: v.stock,
          images: v.images.map(img => ({
            fileId: img.fileId,
            view: img.view,
            delimitations: img.delimitations
          }))
        }))
      };

      const files = colorVariations.flatMap(v =>
        v.images.map(img => ({
          fileId: img.fileId,
          file: img.file
        }))
      );

      const result = await ProductService.createProduct(productData, files);

      alert(`Produit "${result.name}" créé avec succès !`);

      // Reset du formulaire
      window.location.reload();

    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="product-form-complete">
      <h2>Créer un Produit Mockup</h2>

      {/* Informations de base */}
      <section className="form-section">
        <h3>Informations générales</h3>

        <div className="form-group">
          <label htmlFor="name">Nom du produit *</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: T-shirt Premium Col Rond"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            placeholder="Description détaillée du produit..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Prix unitaire (FCFA) *</label>
          <input
            type="number"
            id="price"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            step="0.01"
            min="0"
            placeholder="2500"
            required
          />
        </div>
      </section>

      {/* Sélection des catégories */}
      <section className="form-section">
        <CategorySelector
          selectedCategoryIds={formData.categoryIds}
          onCategoriesChange={(ids) => setFormData(prev => ({ ...prev, categoryIds: ids }))}
        />
      </section>

      {/* Tailles disponibles */}
      <section className="form-section">
        <h3>Tailles disponibles *</h3>
        {formData.sizes.map((size, index) => (
          <div key={index} className="form-row">
            <input
              type="text"
              value={size}
              onChange={(e) => handleSizeChange(index, e.target.value)}
              placeholder="Ex: M, Large, 42..."
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
          <option value="XS" />
          <option value="S" />
          <option value="M" />
          <option value="L" />
          <option value="XL" />
          <option value="XXL" />
        </datalist>
      </section>

      {/* Variations de couleur */}
      <section className="form-section">
        <h3>Variations de couleur *</h3>

        {colorVariations.map((variation, index) => (
          <div key={index} className="color-variation-card">
            <div className="color-header">
              <h4>Couleur {index + 1}</h4>
              {colorVariations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeColorVariation(index)}
                  className="btn-remove"
                >
                  Supprimer
                </button>
              )}
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>Nom de la couleur *</label>
                <input
                  type="text"
                  value={variation.name}
                  onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                  placeholder="Ex: Bleu Marine"
                  required
                />
              </div>

              <div className="form-group">
                <label>Code couleur *</label>
                <input
                  type="color"
                  value={variation.colorCode}
                  onChange={(e) => handleColorChange(index, 'colorCode', e.target.value)}
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
                onChange={(e) => e.target.files && handleImageUpload(index, e.target.files)}
              />
              <small>{variation.images.length} image(s) ajoutée(s)</small>
            </div>
          </div>
        ))}

        <button type="button" onClick={addColorVariation} className="btn-add">
          + Ajouter une couleur
        </button>
      </section>

      {/* Gestion des stocks */}
      <section className="form-section">
        <StockManager
          sizes={formData.sizes.filter(s => s.trim() !== '')}
          colorVariations={colorVariations}
          onStockChange={handleStockChange}
        />
      </section>

      {/* Bouton de soumission */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
        >
          {loading ? 'Création en cours...' : 'Créer le produit'}
        </button>
      </div>
    </form>
  );
};
```

## 🎨 Styles CSS

```css
/* styles/ProductFormComplete.css */

.product-form-complete {
  max-width: 1000px;
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

/* Category Selector */
.category-selector {
  padding: 15px;
}

.category-level {
  margin-bottom: 15px;
}

.category-level label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
}

.category-level select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
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
  cursor: pointer;
}

.category-summary {
  margin-top: 15px;
  padding: 10px;
  background: #e8f4f8;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.category-summary ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

/* Stock Manager */
.stock-manager {
  padding: 15px;
}

.stock-color-section {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.stock-color-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ddd;
}

.color-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-preview {
  display: inline-block;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #333;
}

.color-name {
  font-weight: bold;
  font-size: 16px;
}

.total-stock {
  font-weight: bold;
  color: #007bff;
  font-size: 14px;
}

.stock-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;
  margin-bottom: 15px;
}

.stock-grid-header {
  display: contents;
  font-weight: bold;
}

.stock-grid-header span {
  padding: 8px;
  background: #007bff;
  color: white;
  border-radius: 4px;
}

.stock-grid-row {
  display: contents;
}

.stock-grid-row label {
  padding: 8px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.stock-grid-row input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.stock-quick-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.btn-quick-fill,
.btn-clear-stock {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-quick-fill {
  background: #28a745;
  color: white;
}

.btn-clear-stock {
  background: #6c757d;
  color: white;
}

.stock-summary {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border: 2px solid #007bff;
  border-radius: 6px;
}

.stock-summary-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.stock-summary-table th,
.stock-summary-table td {
  padding: 10px;
  text-align: center;
  border: 1px solid #ddd;
}

.stock-summary-table thead th {
  background: #007bff;
  color: white;
  font-weight: bold;
}

.stock-summary-table tbody tr:nth-child(even) {
  background: #f9f9f9;
}

.stock-summary-table tfoot {
  background: #e8f4f8;
  font-weight: bold;
}

.color-dot {
  display: inline-block;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 1px solid #333;
  margin-right: 8px;
  vertical-align: middle;
}

.total-cell {
  background: #fff3cd !important;
  font-weight: bold;
}

/* Color variations */
.color-variation-card {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.color-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

/* Buttons */
.btn-add,
.btn-submit {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-add:hover,
.btn-submit:hover {
  background: #0056b3;
}

.btn-remove {
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
```

## 📊 Exemple de données envoyées

```json
{
  "name": "T-shirt Premium Col Rond",
  "description": "T-shirt en coton bio de haute qualité",
  "price": 2500,
  "categoryIds": [
    "cat-parent-123",
    "cat-child-456",
    "cat-variation-789"
  ],
  "sizes": ["S", "M", "L", "XL"],
  "colorVariations": [
    {
      "name": "Bleu Marine",
      "colorCode": "#001F3F",
      "stock": {
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
    },
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "stock": {
        "S": 8,
        "M": 12,
        "L": 18,
        "XL": 7
      },
      "images": [...]
    }
  ]
}
```

## ✅ Checklist d'intégration

- [ ] Installer les dépendances TypeScript si nécessaire
- [ ] Créer les services API (CategoryService, ProductService)
- [ ] Implémenter le composant CategorySelector
- [ ] Implémenter le composant StockManager
- [ ] Créer le formulaire complet ProductFormComplete
- [ ] Ajouter les styles CSS
- [ ] Tester la sélection de catégories en cascade
- [ ] Tester la gestion des stocks par taille/couleur
- [ ] Vérifier le récapitulatif des stocks
- [ ] Tester la soumission avec FormData
- [ ] Gérer les erreurs de validation
- [ ] Tester avec différents navigateurs

## 🔍 Points importants

1. **Catégories**: Toujours envoyer les IDs, pas les noms
2. **Stocks**: Un objet `{ [taille]: quantité }` pour chaque couleur
3. **Validation**: Vérifier que toutes les couleurs ont du stock
4. **FormData**: Les fichiers sont envoyés séparément des données JSON
5. **Cookies**: Toujours utiliser `credentials: 'include'`

Votre frontend est maintenant prêt pour créer des produits avec sélection de catégories hiérarchiques et gestion complète des stocks par variation ! 🚀
