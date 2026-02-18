# 🎨 Guide Frontend : Affichage des Prix par Taille

**Date:** 31 janvier 2026
**Version:** 1.0

---

## 📋 Vue d'ensemble

Ce guide explique comment afficher les prix par taille dans l'interface frontend, en distinguant l'affichage **admin** (avec prix de revient et marges) de l'affichage **client** (prix de vente uniquement).

---

## 🔄 Récupération des données

### Structure de réponse API

```typescript
interface ProductSizePrice {
  id: number;
  size: string;
  costPrice: number;
  suggestedPrice: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  suggestedPrice?: number;
  sizes?: string[];

  // 🆕 Champs de tarification par taille
  useGlobalPricing: boolean;
  globalCostPrice: number;
  globalSuggestedPrice: number;
  sizePrices: ProductSizePrice[];

  // ... autres champs
  colorVariations: ColorVariation[];
}
```

---

## 🎯 Scénarios d'Affichage

### Scénario 1 : Affichage Client (Boutique)

```typescript
import React from 'react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Fonction pour récupérer le prix d'une taille spécifique
  const getPriceForSize = (size: string): number => {
    const sizePrice = product.sizePrices?.find(sp => sp.size === size);
    return sizePrice?.suggestedPrice || product.suggestedPrice || 0;
  };

  // Fonction pour récupérer le prix minimum du produit
  const getMinPrice = (): number => {
    if (product.sizePrices && product.sizePrices.length > 0) {
      return Math.min(...product.sizePrices.map(sp => sp.suggestedPrice));
    }
    return product.suggestedPrice || 0;
  };

  const minPrice = getMinPrice();
  const hasMultiplePrices = product.sizePrices && product.sizePrices.length > 1;

  return (
    <div className="product-card">
      <h3>{product.name}</h3>

      {/* Affichage du prix */}
      <div className="price">
        {hasMultiplePrices ? (
          <span>À partir de {minPrice.toLocaleString()} FCFA</span>
        ) : (
          <span>{minPrice.toLocaleString()} FCFA</span>
        )}
      </div>

      {/* Sélecteur de taille avec prix */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="size-selector">
          <label>Taille :</label>
          <div className="sizes">
            {product.sizes.map(size => (
              <button key={size} className="size-btn">
                {size} - {getPriceForSize(size).toLocaleString()} FCFA
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Scénario 2 : Affichage Admin (avec marges)

```typescript
import React from 'react';

interface AdminProductPriceTableProps {
  product: Product;
}

export function AdminProductPriceTable({ product }: AdminProductPriceTableProps) {
  // Calcul de la marge
  const calculateMargin = (costPrice: number, suggestedPrice: number) => {
    return suggestedPrice - costPrice;
  };

  // Calcul du pourcentage de marge
  const calculateMarginPercent = (costPrice: number, suggestedPrice: number) => {
    if (costPrice === 0) return 0;
    const margin = suggestedPrice - costPrice;
    return (margin / costPrice) * 100;
  };

  // Style selon la marge
  const getMarginClass = (percent: number): string => {
    if (percent < 20) return 'margin-low';      // Rouge
    if (percent < 40) return 'margin-medium';   // Orange
    return 'margin-good';                        // Vert
  };

  // Affichage global si useGlobalPricing = true
  if (product.useGlobalPricing) {
    const margin = calculateMargin(product.globalCostPrice, product.globalSuggestedPrice);
    const marginPercent = calculateMarginPercent(product.globalCostPrice, product.globalSuggestedPrice);

    return (
      <div className="admin-pricing-global">
        <h4>🌍 Prix Globaux</h4>
        <table className="pricing-table">
          <tbody>
            <tr>
              <td>Prix de revient</td>
              <td>{product.globalCostPrice.toLocaleString()} FCFA</td>
            </tr>
            <tr>
              <td>Prix de vente</td>
              <td>{product.globalSuggestedPrice.toLocaleString()} FCFA</td>
            </tr>
            <tr className={getMarginClass(marginPercent)}>
              <td>Marge</td>
              <td>
                {margin.toLocaleString()} FCFA ({marginPercent.toFixed(1)}%)
              </td>
            </tr>
          </tbody>
        </table>

        <div className="sizes-list">
          <p>Appliqué aux tailles : {product.sizes?.join(', ')}</p>
        </div>
      </div>
    );
  }

  // Affichage individuel par taille
  return (
    <div className="admin-pricing-individual">
      <h4>📊 Prix par Taille</h4>
      <table className="pricing-table">
        <thead>
          <tr>
            <th>Taille</th>
            <th>Coût</th>
            <th>Vente</th>
            <th>Marge</th>
            <th>% Marge</th>
          </tr>
        </thead>
        <tbody>
          {product.sizePrices?.map((sp) => {
            const margin = calculateMargin(sp.costPrice, sp.suggestedPrice);
            const marginPercent = calculateMarginPercent(sp.costPrice, sp.suggestedPrice);

            return (
              <tr key={sp.id} className={getMarginClass(marginPercent)}>
                <td><strong>{sp.size}</strong></td>
                <td>{sp.costPrice.toLocaleString()} FCFA</td>
                <td>{sp.suggestedPrice.toLocaleString()} FCFA</td>
                <td>{margin.toLocaleString()} FCFA</td>
                <td>{marginPercent.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Scénario 3 : Sélecteur de taille avec prix dynamique

```typescript
import React, { useState } from 'react';

interface SizeSelectorWithPriceProps {
  product: Product;
  onSizeSelect: (size: string, price: number) => void;
}

export function SizeSelectorWithPrice({ product, onSizeSelect }: SizeSelectorWithPriceProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const getPriceForSize = (size: string): number => {
    const sizePrice = product.sizePrices?.find(sp => sp.size === size);
    return sizePrice?.suggestedPrice || product.suggestedPrice || 0;
  };

  const handleSizeClick = (size: string) => {
    setSelectedSize(size);
    const price = getPriceForSize(size);
    onSizeSelect(size, price);
  };

  const getButtonStyle = (size: string) => {
    const isSelected = selectedSize === size;
    return {
      backgroundColor: isSelected ? '#3b82f6' : '#f3f4f6',
      color: isSelected ? '#ffffff' : '#1f2937',
      border: isSelected ? '2px solid #3b82f6' : '1px solid #d1d5db',
    };
  };

  return (
    <div className="size-selector-container">
      <div className="size-selector">
        <label className="selector-label">Sélectionnez une taille :</label>
        <div className="sizes-grid">
          {product.sizes?.map((size) => {
            const price = getPriceForSize(size);
            return (
              <button
                key={size}
                onClick={() => handleSizeClick(size)}
                style={getButtonStyle(size)}
                className="size-button"
              >
                <span className="size-name">{size}</span>
                <span className="size-price">{price.toLocaleString()} FCFA</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prix affiché dynamiquement */}
      {selectedSize && (
        <div className="selected-price">
          <span className="price-label">Prix : </span>
          <span className="price-value">
            {getPriceForSize(selectedSize).toLocaleString()} FCFA
          </span>
        </div>
      )}
    </div>
  );
}
```

---

### Scénario 4 : Liste des produits avec prix par taille

```typescript
import React from 'react';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="product-list">
      {products.map((product) => {
        // Prix minimum et maximum
        const prices = product.sizePrices?.map(sp => sp.suggestedPrice) || [product.suggestedPrice || 0];
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const hasPriceRange = minPrice !== maxPrice;

        return (
          <div key={product.id} className="product-item">
            {/* Image et nom */}
            <div className="product-info">
              <img src={product.image} alt={product.name} />
              <div>
                <h4>{product.name}</h4>
                <p className="product-description">{product.description}</p>
              </div>
            </div>

            {/* Prix */}
            <div className="product-price">
              {hasPriceRange ? (
                <span className="price-range">
                  {minPrice.toLocaleString()} - {maxPrice.toLocaleString()} FCFA
                </span>
              ) : (
                <span className="price-single">
                  {minPrice.toLocaleString()} FCFA
                </span>
              )}
            </div>

            {/* Badge nombre de tailles */}
            {product.sizes && product.sizes.length > 0 && (
              <span className="size-count-badge">
                {product.sizes.length} tailles
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

---

### Scénario 5 : Détails produit avec grille de prix

```typescript
import React from 'react';

interface ProductDetailProps {
  product: Product;
}

export function ProductDetail({ product }: ProductDetailProps) {
  const hasSizePricing = product.sizePrices && product.sizePrices.length > 0;
  const useGlobalPricing = product.useGlobalPricing;

  return (
    <div className="product-detail">
      <h1>{product.name}</h1>
      <p>{product.description}</p>

      {/* Section Prix */}
      <div className="pricing-section">
        {useGlobalPricing ? (
          // Prix globaux
          <div className="global-pricing">
            <h3>Prix : {product.globalSuggestedPrice.toLocaleString()} FCFA</h3>
            <p className="text-sm text-gray-500">
              Ce prix s'applique à toutes les tailles : {product.sizes?.join(', ')}
            </p>
          </div>
        ) : hasSizePricing ? (
          // Prix par taille
          <div className="size-pricing">
            <h3>Tarifs par taille :</h3>
            <div className="price-grid">
              {product.sizePrices.map((sp) => (
                <div key={sp.id} className="price-card">
                  <span className="size-label">{sp.size}</span>
                  <span className="price-amount">
                    {sp.suggestedPrice.toLocaleString()} FCFA
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Prix standard
          <div className="standard-pricing">
            <h3>Prix : {(product.suggestedPrice || product.price).toLocaleString()} FCFA</h3>
          </div>
        )}
      </div>

      {/* Sélecteur de taille */}
      {product.sizes && product.sizes.length > 0 && (
        <div className="size-selection">
          <h4>Tailles disponibles</h4>
          <div className="size-chips">
            {product.sizes.map((size) => (
              <button key={size} className="size-chip">
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 CSS Recommandé

```css
/* Table des prix admin */
.pricing-table {
  width: 100%;
  border-collapse: collapse;
}

.pricing-table th,
.pricing-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.margin-low {
  background-color: #fef2f2;
  color: #dc2626;
}

.margin-medium {
  background-color: #fffbeb;
  color: #d97706;
}

.margin-good {
  background-color: #f0fdf4;
  color: #16a34a;
}

/* Grille des prix */
.price-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.price-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.size-label {
  font-weight: 600;
  color: #6b7280;
}

.price-amount {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
}

/* Sélecteur de taille */
.sizes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.size-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.size-button:hover {
  transform: scale(1.05);
}

.size-name {
  font-weight: 600;
  margin-bottom: 4px;
}

.size-price {
  font-size: 0.875rem;
  color: #6b7280;
}
```

---

## 📡 Hooks personnalisés

### Hook pour récupérer les prix par taille

```typescript
import { useMemo } from 'react';

export function useSizePricing(product: Product) {
  const getPriceForSize = useMemo(() => {
    return (size: string): number => {
      const sizePrice = product.sizePrices?.find(sp => sp.size === size);
      return sizePrice?.suggestedPrice || product.suggestedPrice || 0;
    };
  }, [product.sizePrices, product.suggestedPrice]);

  const getAllPrices = useMemo(() => {
    if (product.sizePrices && product.sizePrices.length > 0) {
      return product.sizePrices.map(sp => ({
        size: sp.size,
        price: sp.suggestedPrice,
        costPrice: sp.costPrice,
      }));
    }
    return [];
  }, [product.sizePrices]);

  const getPriceRange = useMemo(() => {
    if (getAllPrices.length === 0) {
      const price = product.suggestedPrice || 0;
      return { min: price, max: price, hasRange: false };
    }
    const prices = getAllPrices.map(p => p.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      hasRange: Math.min(...prices) !== Math.max(...prices),
    };
  }, [getAllPrices, product.suggestedPrice]);

  const getSortedSizes = useMemo(() => {
    if (!product.sizes) return [];
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    return product.sizes.sort((a, b) => {
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [product.sizes]);

  return {
    getPriceForSize,
    getAllPrices,
    getPriceRange,
    getSortedSizes,
    hasSizePricing: getAllPrices.length > 0,
    useGlobalPricing: product.useGlobalPricing,
  };
}
```

### Utilisation du hook

```typescript
import { useSizePricing } from './hooks/useSizePricing';

function ProductDisplay({ product }: { product: Product }) {
  const {
    getPriceForSize,
    getPriceRange,
    getSortedSizes,
    hasSizePricing,
    useGlobalPricing,
  } = useSizePricing(product);

  const { min, max, hasRange } = getPriceRange;

  return (
    <div>
      {useGlobalPricing ? (
        <p>Prix unique : {min.toLocaleString()} FCFA</p>
      ) : hasRange ? (
        <p>À partir de {min.toLocaleString()} FCFA</p>
      ) : (
        <p>Prix : {min.toLocaleString()} FCFA</p>
      )}

      {hasSizePricing && (
        <div>
          {getSortedSizes().map(size => (
            <div key={size}>
              {size} : {getPriceForSize(size).toLocaleString()} FCFA
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Tests de rendu

```typescript
import { render, screen } from '@testing-library/react';
import { ProductCard } from './ProductCard';

describe('ProductCard - Affichage des prix', () => {
  const mockProduct = {
    id: 1,
    name: 'T-shirt Premium',
    suggestedPrice: 5000,
    sizes: ['S', 'M', 'L'],
    useGlobalPricing: false,
    globalCostPrice: 0,
    globalSuggestedPrice: 0,
    sizePrices: [
      { id: 1, size: 'S', costPrice: 2000, suggestedPrice: 5000 },
      { id: 2, size: 'M', costPrice: 2200, suggestedPrice: 5500 },
      { id: 3, size: 'L', costPrice: 2400, suggestedPrice: 6000 },
    ],
  };

  it('affiche "À partir de" quand il y a plusieurs prix', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/À partir de 5000/)).toBeInTheDocument();
  });

  it('affiche le prix individuel par taille', () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/S.*5000/)).toBeInTheDocument();
    expect(screen.getByText(/M.*5500/)).toBeInTheDocument();
    expect(screen.getByText(/L.*6000/)).toBeInTheDocument();
  });
});
```

---

## 📝 Résumé

| Composant | Usage | Affiche |
|-----------|-------|---------|
| `ProductCard` | Client boutique | Prix avec "À partir de" si plusieurs prix |
| `AdminProductPriceTable` | Admin | Coût + Vente + Marge + % |
| `SizeSelectorWithPrice` | Sélection taille | Prix dynamique selon taille |
| `ProductList` | Liste produits | Plage de prix ou prix unique |
| `ProductDetail` | Page détail | Grille des prix par taille |

---

**Fin du guide**
