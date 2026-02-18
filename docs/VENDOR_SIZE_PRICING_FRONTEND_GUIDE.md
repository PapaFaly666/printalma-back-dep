# 🔧 Guide Frontend : Prix par Taille pour Produits Vendeur

**Date:** 31 janvier 2026
**Version:** 1.0

---

## 📋 Vue d'ensemble

Ce guide explique comment implémenter le système de **prix par taille** pour les produits vendeur (VendorProduct) côté frontend, permettant aux vendeurs de définir des prix différents selon les tailles lors de la création de leurs produits.

---

## 🔄 Flux de données Frontend → Backend

```
VendorProductsPage.tsx
  ↓
SizePricingConfig.tsx (saisie des prix)
  ↓
useVendorPublish.ts (hook)
  ↓
POST /vendor/products (backend)
```

---

## 📦 Structures de données

### TypeScript Interfaces

```typescript
// Prix par taille pour un produit vendeur
interface VendorSizePrice {
  size: string;           // Nom de la taille (ex: "S", "M", "L")
  costPrice: number;      // Prix de revient en FCFA
  suggestedPrice: number; // Prix de vente suggéré en FCFA
  salePrice?: number;     // Prix de vente défini par le vendeur (optionnel)
}

// Configuration de prix globale
interface GlobalPricingConfig {
  useGlobalPricing: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
}

// Payload complet pour création produit vendeur
interface VendorProductPayload {
  baseProductId: number;
  designId: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
  selectedColors: SelectedColor[];
  selectedSizes: SelectedSize[];
  productStructure: ProductStructure;
  designPosition?: DesignPosition;

  // 🆕 Prix par taille
  useGlobalPricing?: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  sizePricing?: VendorSizePrice[];
}

// Réponse du backend
interface VendorProductResponse {
  success: boolean;
  productId: number;
  message: string;
  data: {
    id: number;
    vendorName: string;
    price: number;
    status: string;

    // 🆕 Informations prix par taille
    priceRange: {
      min: number;
      max: number;
      display: string;
      hasMultiplePrices: boolean;
    };
    useGlobalPricing: boolean;
    globalCostPrice?: number;
    globalSuggestedPrice?: number;
    sizePrices: VendorSizePrice[];
  };
}
```

---

## 🎨 Composant SizePricingConfig

### Props et State

```typescript
import React, { useState, useEffect } from 'react';

interface SizePricingConfigProps {
  sizes: SelectedSize[];          // Tailles sélectionnées
  baseProductSizePrices?: any[];  // Prix admin du produit de base
  onPricingChange: (pricing: {
    useGlobalPricing: boolean;
    globalCostPrice?: number;
    globalSuggestedPrice?: number;
    sizePricing: VendorSizePrice[];
  }) => void;
  initialPricing?: {
    useGlobalPricing?: boolean;
    globalCostPrice?: number;
    globalSuggestedPrice?: number;
    sizePricing?: VendorSizePrice[];
  };
}

export function SizePricingConfig({
  sizes,
  baseProductSizePrices = [],
  onPricingChange,
  initialPricing
}: SizePricingConfigProps) {
  const [useGlobalPricing, setUseGlobalPricing] = useState(false);
  const [globalCostPrice, setGlobalCostPrice] = useState<number>(0);
  const [globalSuggestedPrice, setGlobalSuggestedPrice] = useState<number>(0);
  const [sizePricing, setSizePricing] = useState<VendorSizePrice[]>([]);

  // Initialisation avec les prix du produit admin ou les valeurs initiales
  useEffect(() => {
    if (initialPricing?.sizePricing && initialPricing.sizePricing.length > 0) {
      setSizePricing(initialPricing.sizePricing);
      setUseGlobalPricing(initialPricing.useGlobalPricing ?? false);
      setGlobalCostPrice(initialPricing.globalCostPrice ?? 0);
      setGlobalSuggestedPrice(initialPricing.globalSuggestedPrice ?? 0);
    } else if (baseProductSizePrices && baseProductSizePrices.length > 0) {
      // Copier les prix admin comme valeurs par défaut
      const defaultPricing = baseProductSizePrices.map(sp => ({
        size: sp.size,
        costPrice: sp.costPrice,
        suggestedPrice: sp.suggestedPrice,
        salePrice: sp.suggestedPrice // Par défaut, prix de vente = prix suggéré
      }));
      setSizePricing(defaultPricing);
    } else {
      // Générer depuis les tailles sélectionnées
      const defaultPricing = sizes.map(size => ({
        size: size.sizeName,
        costPrice: 0,
        suggestedPrice: 0,
        salePrice: 0
      }));
      setSizePricing(defaultPricing);
    }
  }, [sizes, baseProductSizePrices, initialPricing]);

  // Notifier le parent quand les prix changent
  useEffect(() => {
    onPricingChange({
      useGlobalPricing,
      globalCostPrice: useGlobalPricing ? globalCostPrice : undefined,
      globalSuggestedPrice: useGlobalPricing ? globalSuggestedPrice : undefined,
      sizePricing: useGlobalPricing ? [] : sizePricing
    });
  }, [useGlobalPricing, globalCostPrice, globalSuggestedPrice, sizePricing, onPricingChange]);

  // ... suite du composant
}
```

### Méthodes helper

```typescript
// Calcul de la marge pour une taille
const calculateMargin = (costPrice: number, salePrice: number): number => {
  if (!costPrice || !salePrice) return 0;
  return salePrice - costPrice;
};

// Calcul du pourcentage de marge
const calculateMarginPercent = (costPrice: number, salePrice: number): number => {
  if (!costPrice || costPrice === 0) return 0;
  const margin = salePrice - costPrice;
  return (margin / costPrice) * 100;
};

// Style selon la marge
const getMarginColor = (marginPercent: number): string => {
  if (marginPercent < 20) return 'text-red-600 bg-red-50';
  if (marginPercent < 40) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
};

// Mise à jour du prix pour une taille
const updateSizePrice = (size: string, field: keyof VendorSizePrice, value: number) => {
  setSizePricing(prev =>
    prev.map(sp =>
      sp.size === size ? { ...sp, [field]: value } : sp
    )
  );
};

// Application des prix globaux à toutes les tailles
const applyGlobalPricing = () => {
  const updated = sizePricing.map(sp => ({
    ...sp,
    costPrice: globalCostPrice,
    suggestedPrice: globalSuggestedPrice,
    salePrice: globalSuggestedPrice
  }));
  setSizePricing(updated);
};
```

### Template JSX

```typescript
return (
  <div className="space-y-6 p-4 bg-white rounded-lg shadow">
    <h3 className="text-lg font-semibold">💰 Configuration des Prix</h3>

    {/* Toggle Prix Globaux vs Prix par Taille */}
    <div className="flex items-center space-x-4">
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={useGlobalPricing}
          onChange={(e) => setUseGlobalPricing(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <span>Utiliser le même prix pour toutes les tailles</span>
      </label>
    </div>

    {useGlobalPricing ? (
      /* Configuration Globale */
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium">Prix Globaux</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prix de revient (FCFA)
            </label>
            <input
              type="number"
              value={globalCostPrice}
              onChange={(e) => setGlobalCostPrice(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prix de vente (FCFA)
            </label>
            <input
              type="number"
              value={globalSuggestedPrice}
              onChange={(e) => setGlobalSuggestedPrice(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              min="0"
            />
          </div>
        </div>

        {/* Aperçu de la marge */}
        {globalCostPrice > 0 && globalSuggestedPrice > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm">
              <strong>Marge :</strong> {calculateMargin(globalCostPrice, globalSuggestedPrice).toLocaleString()} FCFA
              ({calculateMarginPercent(globalCostPrice, globalSuggestedPrice).toFixed(1)}%)
            </p>
          </div>
        )}

        <button
          onClick={applyGlobalPricing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Appliquer à toutes les tailles
        </button>
      </div>
    ) : (
      /* Configuration par Taille */
      <div className="space-y-4">
        <h4 className="font-medium">Prix par Taille</h4>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Taille</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Coût (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Suggéré (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Vente (FCFA)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Marge</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">%</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sizePricing.map((sp) => {
                const margin = calculateMargin(sp.costPrice, sp.salePrice || sp.suggestedPrice);
                const marginPercent = calculateMarginPercent(sp.costPrice, sp.salePrice || sp.suggestedPrice);
                const marginColor = getMarginColor(marginPercent);

                return (
                  <tr key={sp.size}>
                    <td className="px-4 py-2 font-medium">{sp.size}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={sp.costPrice}
                        onChange={(e) => updateSizePrice(sp.size, 'costPrice', Number(e.target.value))}
                        className="w-24 rounded border-gray-300"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={sp.suggestedPrice}
                        onChange={(e) => updateSizePrice(sp.size, 'suggestedPrice', Number(e.target.value))}
                        className="w-24 rounded border-gray-300"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={sp.salePrice || sp.suggestedPrice}
                        onChange={(e) => updateSizePrice(sp.size, 'salePrice', Number(e.target.value))}
                        className="w-24 rounded border-gray-300"
                        min="0"
                      />
                    </td>
                    <td className={`px-4 py-2 ${marginColor}`}>
                      {margin.toLocaleString()} FCFA
                    </td>
                    <td className={`px-4 py-2 ${marginColor}`}>
                      {marginPercent.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Prix suggérés admin */}
        {baseProductSizePrices && baseProductSizePrices.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 rounded text-sm">
            <p className="font-medium">💡 Prix suggérés par l'admin :</p>
            <ul className="mt-2 space-y-1">
              {baseProductSizePrices.map(sp => (
                <li key={sp.size}>
                  <strong>{sp.size}</strong> : {sp.suggestedPrice.toLocaleString()} FCFA
                  (coût: {sp.costPrice.toLocaleString()} FCFA)
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )}

    {/* Résumé */}
    <div className="mt-6 p-4 bg-blue-50 rounded">
      <h4 className="font-medium">📊 Résumé</h4>
      {useGlobalPricing ? (
        <p className="text-sm mt-2">
          Prix unique : <strong>{globalSuggestedPrice.toLocaleString()} FCFA</strong>
        </p>
      ) : (
        <p className="text-sm mt-2">
          Prix : de <strong>{Math.min(...sizePricing.map(sp => sp.salePrice || sp.suggestedPrice)).toLocaleString()} FCFA</strong>
          {' '}à <strong>{Math.max(...sizePricing.map(sp => sp.salePrice || sp.suggestedPrice)).toLocaleString()} FCFA</strong>
        </p>
      )}
    </div>
  </div>
);
}
```

---

## 🔌 Intégration avec useVendorPublish

```typescript
// Dans useVendorPublish.ts ou le hook équivalent

interface UseVendorPublishOptions {
  baseProductId: number;
  designId: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
  selectedColors: SelectedColor[];
  selectedSizes: SelectedSize[];
  productStructure: ProductStructure;
  designPosition?: DesignPosition;

  // 🆕 Prix par taille
  useGlobalPricing?: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  sizePricing?: VendorSizePrice[];
}

export function useVendorPublish() {
  const publishProduct = async (options: UseVendorPublishOptions) => {
    const payload = {
      baseProductId: options.baseProductId,
      designId: options.designId,
      vendorName: options.vendorName,
      vendorDescription: options.vendorDescription,
      vendorPrice: options.vendorPrice,
      vendorStock: options.vendorStock,
      selectedColors: options.selectedColors,
      selectedSizes: options.selectedSizes,
      productStructure: options.productStructure,
      designPosition: options.designPosition,

      // 🆕 Prix par taille
      useGlobalPricing: options.useGlobalPricing ?? false,
      globalCostPrice: options.globalCostPrice,
      globalSuggestedPrice: options.globalSuggestedPrice,
      sizePricing: options.sizePricing || []
    };

    const response = await fetch('/vendor/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la publication du produit');
    }

    return response.json();
  };

  return { publishProduct };
}
```

---

## 📱 Affichage des produits vendeur avec prix par taille

### Dans VendorProductsPage (liste des produits)

```typescript
interface VendorProductCardProps {
  product: {
    id: number;
    vendorName: string;
    price: number;
    status: string;
    // 🆕 Prix par taille
    priceRange: {
      min: number;
      max: number;
      display: string;
      hasMultiplePrices: boolean;
    };
    useGlobalPricing: boolean;
    sizePrices: VendorSizePrice[];
    // ... autres champs
  };
}

export function VendorProductCard({ product }: VendorProductCardProps) {
  return (
    <div className="product-card">
      <h3>{product.vendorName}</h3>

      {/* Affichage du prix */}
      <div className="price">
        {product.priceRange.hasMultiplePrices ? (
          <span className="price-range">
            {product.priceRange.display}
          </span>
        ) : (
          <span className="price-single">
            {product.priceRange.min.toLocaleString()} FCFA
          </span>
        )}
      </div>

      {/* Indicateur de type de prix */}
      {product.useGlobalPricing && (
        <span className="badge badge-global">Prix global</span>
      )}

      {/* Liste des tailles avec prix */}
      {product.sizePrices && product.sizePrices.length > 0 && (
        <div className="size-prices">
          <h4>Tarifs par taille :</h4>
          <div className="size-list">
            {product.sizePrices.map(sp => (
              <div key={sp.size} className="size-price-item">
                <span className="size">{sp.size}</span>
                <span className="price">
                  {(sp.salePrice || sp.suggestedPrice).toLocaleString()} FCFA
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Page Détail Produit Vendeur

```typescript
export function VendorProductDetail({ productId }: { productId: number }) {
  const [product, setProduct] = useState<any>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/vendor/products/${productId}`)
      .then(res => res.json())
      .then(data => setProduct(data.data));
  }, [productId]);

  if (!product) return <div>Chargement...</div>;

  const getPriceForSize = (size: string): number => {
    const sizePrice = product.sizePrices?.find((sp: any) => sp.size === size);
    return sizePrice?.salePrice || sizePrice?.suggestedPrice || product.price;
  };

  return (
    <div className="product-detail">
      <h1>{product.vendorName}</h1>

      {/* Section Prix */}
      <div className="pricing-section">
        {product.useGlobalPricing ? (
          <div className="global-pricing">
            <h2>{product.globalSuggestedPrice?.toLocaleString()} FCFA</h2>
            <p>Prix unique pour toutes les tailles</p>
          </div>
        ) : product.priceRange.hasMultiplePrices ? (
          <div className="range-pricing">
            <h2>À partir de {product.priceRange.min.toLocaleString()} FCFA</h2>
            <p>Sélectionnez une taille pour voir le prix</p>
          </div>
        ) : (
          <div className="single-pricing">
            <h2>{product.priceRange.min.toLocaleString()} FCFA</h2>
          </div>
        )}
      </div>

      {/* Sélecteur de taille avec prix */}
      {product.selectedSizes && product.selectedSizes.length > 0 && (
        <div className="size-selector">
          <h3>Tailles disponibles</h3>
          <div className="sizes-grid">
            {product.selectedSizes.map((size: any) => (
              <button
                key={size.sizeName}
                onClick={() => setSelectedSize(size.sizeName)}
                className={`size-btn ${selectedSize === size.sizeName ? 'active' : ''}`}
              >
                <span className="size-name">{size.sizeName}</span>
                <span className="size-price">
                  {getPriceForSize(size.sizeName).toLocaleString()} FCFA
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tableau détaillé des prix (optionnel) */}
      {product.sizePrices && product.sizePrices.length > 0 && (
        <details className="price-details">
          <summary>Voir le détail des prix</summary>
          <table className="price-table">
            <thead>
              <tr>
                <th>Taille</th>
                <th>Coût</th>
                <th>Suggéré</th>
                <th>Vente</th>
                <th>Marge</th>
              </tr>
            </thead>
            <tbody>
              {product.sizePrices.map((sp: any) => (
                <tr key={sp.size}>
                  <td>{sp.size}</td>
                  <td>{sp.costPrice.toLocaleString()} FCFA</td>
                  <td>{sp.suggestedPrice.toLocaleString()} FCFA</td>
                  <td>{(sp.salePrice || sp.suggestedPrice).toLocaleString()} FCFA</td>
                  <td>
                    {((sp.salePrice || sp.suggestedPrice) - sp.costPrice).toLocaleString()} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </div>
  );
}
```

---

## 🧪 Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { SizePricingConfig } from './SizePricingConfig';

describe('SizePricingConfig', () => {
  const mockSizes = [
    { id: 1, sizeName: 'S', isActive: true },
    { id: 2, sizeName: 'M', isActive: true },
    { id: 3, sizeName: 'L', isActive: true }
  ];

  const mockOnChange = jest.fn();

  it('affiche les prix par défaut pour chaque taille', () => {
    render(
      <SizePricingConfig
        sizes={mockSizes}
        onPricingChange={mockOnChange}
      />
    );

    expect(screen.getByText('S')).toBeInTheDocument();
    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('permet de passer en mode prix global', () => {
    render(
      <SizePricingConfig
        sizes={mockSizes}
        onPricingChange={mockOnChange}
      />
    );

    const toggle = screen.getByLabelText(/Utiliser le même prix/);
    fireEvent.click(toggle);

    expect(screen.getByText('Prix Globaux')).toBeInTheDocument();
  });

  it('met à jour les prix quand on modifie une taille', () => {
    render(
      <SizePricingConfig
        sizes={mockSizes}
        onPricingChange={mockOnChange}
      />
    );

    const costInput = screen.getAllByPlaceholderText(/Coût/)[0];
    fireEvent.change(costInput, { target: { value: '5000' } });

    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        sizePricing: expect.arrayContaining([
          expect.objectContaining({
            size: 'S',
            costPrice: 5000
          })
        ])
      })
    );
  });
});
```

---

## 📝 Checklist d'implémentation

- [ ] Créer le composant `SizePricingConfig.tsx`
- [ ] Ajouter les interfaces TypeScript dans `types/product.ts`
- [ ] Mettre à jour `useVendorPublish` pour inclure les prix par taille
- [ ] Mettre à jour `VendorProductsPage` pour intégrer `SizePricingConfig`
- [ ] Mettre à jour l'affichage des produits dans la liste
- [ ] Mettre à jour la page détail produit
- [ ] Tester avec différents scénarios (prix global, prix par taille)
- [ ] Vérifier les calculs de marge
- [ ] Tester la validation des formulaires

---

**Fin du guide**
