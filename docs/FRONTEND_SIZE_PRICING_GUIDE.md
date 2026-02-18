# 📊 Guide Frontend : Intégration du Système de Prix par Taille

**Date:** 31 janvier 2026
**Version:** 1.1
**Endpoints concernés:** `POST /api/products`, `POST /api/products/ready`, `PATCH /api/products/:id`, `PATCH /api/products/ready/:id`, `GET /api/products/*`

---

## 📋 Vue d'ensemble

Le backend prend maintenant en charge les **prix par taille** pour les produits. Chaque taille peut avoir son propre :
- **Prix de revient** (`costPrice`) - Coût de production en FCFA
- **Prix de vente suggéré** (`suggestedPrice`) - Prix recommandé pour la vente en FCFA

Une option "Prix globaux" permet d'appliquer les mêmes valeurs à toutes les tailles.

### 📌 Note sur les endpoints

Il existe deux endpoints de création :

1. **`POST /api/products`** - Pour les produits avec délimitations (mockups admin)
2. **`POST /api/products/ready`** - Pour les produits prêts (sans délimitations)

Les deux endpoints prennent maintenant en charge les prix par taille avec la même structure de données.

---

## 🔧 Structure des Données

### Types TypeScript

```typescript
/**
 * Prix par taille pour un produit
 */
export interface SizePricing {
  size: string;              // Nom de la taille (ex: "S", "M", "L", "XL")
  costPrice: number;         // Prix de revient en FCFA
  suggestedPrice: number;    // Prix de vente suggéré en FCFA (doit être > 0)
}

/**
 * Produit avec prix par taille
 */
export interface ProductWithSizePricing {
  id: number;
  name: string;
  description: string;
  price: number;
  suggestedPrice?: number;
  sizes?: string[];

  // 🆕 Champs pour la tarification par taille
  useGlobalPricing: boolean;     // true = mêmes prix pour toutes tailles
  globalCostPrice: number;        // Prix de revient global en FCFA
  globalSuggestedPrice: number;   // Prix de vente suggéré global en FCFA
  sizePrices: SizePricing[];      // Liste des prix par taille

  // Autres champs existants...
  colorVariations: ColorVariation[];
  genre: string;
  status: string;
}
```

---

## 📤 Création de Produit

### Endpoint : `POST /api/products/ready`

### Corps de la requête

```typescript
{
  // Champs existants...
  "name": "T-shirt Premium",
  "description": "T-shirt de haute qualité",
  "price": 5000,
  "suggestedPrice": 5000,
  "status": "published",
  "categories": ["Vêtements > T-shirts > S", "Vêtements > T-shirts > M"],
  "sizes": ["S", "M", "L"],
  "genre": "UNISEXE",
  "isReadyProduct": true,
  "colorVariations": [...],

  // 🆕 Champs pour la tarification par taille
  "useGlobalPricing": false,  // Optionnel (défaut: false)
  "globalCostPrice": 0,       // Optionnel (requis si useGlobalPricing = true)
  "globalSuggestedPrice": 0,  // Optionnel (requis si useGlobalPricing = true)

  // 🆕 Prix par taille (requis si sizes est défini)
  "sizePricing": [
    {
      "size": "S",
      "costPrice": 2000,
      "suggestedPrice": 5000
    },
    {
      "size": "M",
      "costPrice": 2200,
      "suggestedPrice": 5500
    },
    {
      "size": "L",
      "costPrice": 2400,
      "suggestedPrice": 6000
    }
  ]
}
```

### Exemple 1 : Prix individuels par taille

```json
{
  "name": "T-shirt Premium",
  "description": "T-shirt de haute qualité",
  "price": 5000,
  "suggestedPrice": 5000,
  "status": "published",
  "categories": ["Vêtements > T-shirts"],
  "sizes": ["S", "M", "L"],
  "genre": "UNISEXE",
  "isReadyProduct": true,
  "colorVariations": [
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [...]
    }
  ],
  "useGlobalPricing": false,
  "sizePricing": [
    { "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
    { "size": "M", "costPrice": 2200, "suggestedPrice": 5500 },
    { "size": "L", "costPrice": 2400, "suggestedPrice": 6000 }
  ]
}
```

### Exemple 2 : Prix globaux (même prix pour toutes tailles)

```json
{
  "name": "T-shirt Basic",
  "description": "T-shirt basique",
  "price": 4000,
  "suggestedPrice": 4000,
  "status": "published",
  "categories": ["Vêtements > T-shirts"],
  "sizes": ["S", "M", "L", "XL"],
  "genre": "UNISEXE",
  "isReadyProduct": true,
  "colorVariations": [
    {
      "name": "Noir",
      "colorCode": "#000000",
      "images": [...]
    }
  ],
  "useGlobalPricing": true,
  "globalCostPrice": 1500,
  "globalSuggestedPrice": 4000,
  "sizePricing": [
    { "size": "S", "costPrice": 1500, "suggestedPrice": 4000 },
    { "size": "M", "costPrice": 1500, "suggestedPrice": 4000 },
    { "size": "L", "costPrice": 1500, "suggestedPrice": 4000 },
    { "size": "XL", "costPrice": 1500, "suggestedPrice": 4000 }
  ]
}
```

---

## 📥 Réponse API

### Structure de réponse lors de la création ou de la récupération

```json
{
  "id": 123,
  "name": "T-shirt Premium",
  "description": "T-shirt de haute qualité",
  "price": 5000,
  "suggestedPrice": 5000,
  "status": "PUBLISHED",
  "sizes": ["S", "M", "L"],
  "genre": "UNISEXE",
  "isReadyProduct": true,

  // 🆕 Champs de tarification par taille
  "useGlobalPricing": false,
  "globalCostPrice": 0,
  "globalSuggestedPrice": 0,
  "sizePrices": [
    {
      "id": 1,
      "size": "S",
      "costPrice": 2000,
      "suggestedPrice": 5000,
      "createdAt": "2026-01-31T10:00:00.000Z",
      "updatedAt": "2026-01-31T10:00:00.000Z"
    },
    {
      "id": 2,
      "size": "M",
      "costPrice": 2200,
      "suggestedPrice": 5500,
      "createdAt": "2026-01-31T10:00:00.000Z",
      "updatedAt": "2026-01-31T10:00:00.000Z"
    },
    {
      "id": 3,
      "size": "L",
      "costPrice": 2400,
      "suggestedPrice": 6000,
      "createdAt": "2026-01-31T10:00:00.000Z",
      "updatedAt": "2026-01-31T10:00:00.000Z"
    }
  ],

  "colorVariations": [...],
  "createdAt": "2026-01-31T10:00:00.000Z",
  "updatedAt": "2026-01-31T10:00:00.000Z"
}
```

---

## 🔄 Mise à jour de Produit

### Endpoint : `PATCH /api/products/:id`

### Corps de la requête (mise à jour partielle)

```json
{
  // Mise à jour des prix par taille
  "useGlobalPricing": false,
  "sizePricing": [
    { "size": "S", "costPrice": 2500, "suggestedPrice": 5500 },
    { "size": "M", "costPrice": 2700, "suggestedPrice": 6000 },
    { "size": "L", "costPrice": 2900, "suggestedPrice": 6500 }
  ]
}
```

**Note :** Lors de la mise à jour de `sizePricing`, tous les anciens prix par taille sont supprimés et remplacés par les nouveaux.

---

## ⚠️ Validations Backend

### Règles de validation

1. **Prix par taille requis**
   - Si `sizes` est défini, `sizePricing` doit être fourni
   - Chaque taille doit avoir un prix de vente suggéré > 0

2. **Prix globaux cohérents**
   - Si `useGlobalPricing = true`, alors `globalCostPrice` et `globalSuggestedPrice` sont requis
   - Tous les prix dans `sizePricing` doivent correspondre aux prix globaux

3. **Codes d'erreur**
   - `400 Bad Request` : "Les prix par taille sont requis quand des tailles sont définies"
   - `400 Bad Request` : "Prix de vente suggéré manquant pour les tailles: S, M"
   - `400 Bad Request` : "Prix de revient global requis"
   - `400 Bad Request` : "Les prix par taille doivent correspondre aux prix globaux quand useGlobalPricing est true"

---

## 🎯 Cas d'Utilisation Frontend

### Cas 1 : Formulaire de création avec prix par taille

```typescript
interface ProductFormData {
  name: string;
  description: string;
  price: number;
  suggestedPrice: number;
  sizes: string[];
  useGlobalPricing: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  sizePricing: SizePricing[];
  colorVariations: ColorVariation[];
}

// Lorsque l'utilisateur active "Prix globaux"
function onGlobalPricingChange(enabled: boolean) {
  if (enabled) {
    // Appliquer les mêmes prix à toutes les tailles
    const globalCost = form.globalCostPrice || 0;
    const globalSuggested = form.globalSuggestedPrice || 0;

    form.sizePricing = form.sizes.map(size => ({
      size,
      costPrice: globalCost,
      suggestedPrice: globalSuggested
    }));
  }
}

// Lorsque l'utilisateur modifie un prix global
function onGlobalPriceChange(field: 'costPrice' | 'suggestedPrice', value: number) {
  if (form.useGlobalPricing) {
    // Mettre à jour toutes les tailles
    form.sizePricing = form.sizePricing.map(sp => ({
      ...sp,
      [field]: value
    }));
  }
}
```

### Cas 2 : Affichage des prix par taille

```typescript
interface ProductDisplayProps {
  product: ProductWithSizePricing;
}

function ProductDisplay({ product }: ProductDisplayProps) {
  const getPriceForSize = (size: string): SizePricing | undefined => {
    return product.sizePrices.find(sp => sp.size === size);
  };

  return (
    <div>
      <h2>{product.name}</h2>

      {product.useGlobalPricing ? (
        <div className="price-info">
          <p>Prix unique : {product.globalSuggestedPrice} FCFA</p>
        </div>
      ) : (
        <div className="price-info">
          <h3>Prix par taille :</h3>
          {product.sizes?.map(size => {
            const pricing = getPriceForSize(size);
            if (!pricing) return null;

            const margin = pricing.suggestedPrice - pricing.costPrice;
            const marginPercent = (margin / pricing.costPrice) * 100;

            return (
              <div key={size} className="size-price">
                <span>Taille {size} :</span>
                <span>Prix : {pricing.suggestedPrice} FCFA</span>
                {isAdmin && (
                  <>
                    <span>Coût : {pricing.costPrice} FCFA</span>
                    <span>Marge : {marginPercent.toFixed(1)}%</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### Cas 3 : Calcul de la marge pour l'admin

```typescript
function SizePricingRow({ pricing }: { pricing: SizePricing }) {
  const margin = pricing.suggestedPrice - pricing.costPrice;
  const marginPercent = (margin / pricing.costPrice) * 100;

  return (
    <tr className={marginPercent < 20 ? 'low-margin' : ''}>
      <td>{pricing.size}</td>
      <td>{pricing.costPrice} FCFA</td>
      <td>{pricing.suggestedPrice} FCFA</td>
      <td>{margin} FCFA</td>
      <td>{marginPercent.toFixed(2)}%</td>
    </tr>
  );
}
```

---

## 📦 Champs à inclure dans les requêtes

### Champs obligatoires quand `sizes` est défini :

- `sizePricing[]` - Tableau des prix par taille
  - Chaque élément doit avoir : `size`, `costPrice`, `suggestedPrice`
  - `suggestedPrice` doit être > 0

### Champs optionnels :

- `useGlobalPricing` (boolean, défaut: false)
- `globalCostPrice` (number, requis si useGlobalPricing = true)
- `globalSuggestedPrice` (number, requis si useGlobalPricing = true)

---

## 🔍 Points d'Attention

### 1. Affichage admin vs client
- **Admin** : Afficher `costPrice` ET `suggestedPrice`
- **Client** : Afficher SEULEMENT `suggestedPrice` (le prix de vente)

### 2. Prix globaux vs individuels
- Quand `useGlobalPricing = true`, synchroniser automatiquement tous les prix
- Désactiver l'édition individuelle des prix par taille dans ce mode

### 3. Validation frontend
- Vérifier que `suggestedPrice > 0` avant envoi
- Vérifier que toutes les tailles ont un prix si `sizes` est défini
- Vérifier la cohérence si `useGlobalPricing = true`

### 4. Backward compatibility
- Les produits sans `sizePricing` utilisent le champ `suggestedPrice` global du produit
- Toujours vérifier si `sizePrices` existe avant de l'utiliser

---

## 📝 Exemple de Formulaire React

```typescript
import { useState, useEffect } from 'react';

interface SizePricingFormProps {
  sizes: string[];
  initialPricing?: SizePricing[];
  useGlobalPricing: boolean;
  onChange: (pricing: SizePricing[]) => void;
}

function SizePricingForm({
  sizes,
  initialPricing,
  useGlobalPricing,
  onChange
}: SizePricingFormProps) {
  const [pricing, setPricing] = useState<SizePricing[]>([]);
  const [globalCost, setGlobalCost] = useState(0);
  const [globalSuggested, setGlobalSuggested] = useState(0);

  useEffect(() => {
    // Initialiser avec les prix existants ou des valeurs par défaut
    if (initialPricing) {
      setPricing(initialPricing);
    } else {
      setPricing(sizes.map(size => ({ size, costPrice: 0, suggestedPrice: 0 })));
    }
  }, [sizes, initialPricing]);

  const handleGlobalCostChange = (value: number) => {
    setGlobalCost(value);
    if (useGlobalPricing) {
      const updated = pricing.map(p => ({ ...p, costPrice: value }));
      setPricing(updated);
      onChange(updated);
    }
  };

  const handleGlobalSuggestedChange = (value: number) => {
    setGlobalSuggested(value);
    if (useGlobalPricing) {
      const updated = pricing.map(p => ({ ...p, suggestedPrice: value }));
      setPricing(updated);
      onChange(updated);
    }
  };

  const handleIndividualPriceChange = (
    size: string,
    field: 'costPrice' | 'suggestedPrice',
    value: number
  ) => {
    const updated = pricing.map(p =>
      p.size === size ? { ...p, [field]: value } : p
    );
    setPricing(updated);
    onChange(updated);
  };

  return (
    <div className="size-pricing-form">
      {useGlobalPricing ? (
        <div className="global-pricing">
          <h3>Prix Globaux</h3>
          <div className="form-group">
            <label>Prix de revient (FCFA)</label>
            <input
              type="number"
              value={globalCost}
              onChange={(e) => handleGlobalCostChange(Number(e.target.value))}
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Prix de vente suggéré (FCFA)</label>
            <input
              type="number"
              value={globalSuggested}
              onChange={(e) => handleGlobalSuggestedChange(Number(e.target.value))}
              min="0"
            />
          </div>
        </div>
      ) : (
        <div className="individual-pricing">
          <h3>Prix par Taille</h3>
          {pricing.map((p) => {
            const margin = p.suggestedPrice - p.costPrice;
            const marginPercent = p.costPrice > 0 ? (margin / p.costPrice) * 100 : 0;

            return (
              <div key={p.size} className="size-row">
                <h4>Taille {p.size}</h4>
                <div className="form-group">
                  <label>Prix de revient (FCFA)</label>
                  <input
                    type="number"
                    value={p.costPrice}
                    onChange={(e) => handleIndividualPriceChange(p.size, 'costPrice', Number(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Prix de vente (FCFA)</label>
                  <input
                    type="number"
                    value={p.suggestedPrice}
                    onChange={(e) => handleIndividualPriceChange(p.size, 'suggestedPrice', Number(e.target.value))}
                    min="0"
                  />
                </div>
                <div className="margin-info">
                  <span>Marge : {margin} FCFA ({marginPercent.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Tests de Validation

### Scénario 1 : Prix individuels valides

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "description": "Test",
    "price": 5000,
    "suggestedPrice": 5000,
    "sizes": ["S", "M"],
    "useGlobalPricing": false,
    "sizePricing": [
      {"size": "S", "costPrice": 2000, "suggestedPrice": 5000},
      {"size": "M", "costPrice": 2200, "suggestedPrice": 5500}
    ],
    "genre": "UNISEXE",
    "isReadyProduct": true,
    "colorVariations": [...]
  }'
```

**Résultat attendu :** `201 Created` ✅

### Scénario 2 : Prix globaux valides

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "description": "Test",
    "price": 4000,
    "suggestedPrice": 4000,
    "sizes": ["S", "M"],
    "useGlobalPricing": true,
    "globalCostPrice": 1500,
    "globalSuggestedPrice": 4000,
    "sizePricing": [
      {"size": "S", "costPrice": 1500, "suggestedPrice": 4000},
      {"size": "M", "costPrice": 1500, "suggestedPrice": 4000}
    ],
    "genre": "UNISEXE",
    "isReadyProduct": true,
    "colorVariations": [...]
  }'
```

**Résultat attendu :** `201 Created` ✅

### Scénario 3 : Erreur - Prix manquant

```bash
curl -X POST http://localhost:3004/api/products/ready \
  -H "Content-Type: application/json" \
  -d '{
    "name": "T-shirt Test",
    "sizes": ["S", "M"],
    "sizePricing": [
      {"size": "S", "costPrice": 2000, "suggestedPrice": 0}
    ]
  }'
```

**Résultat attendu :** `400 Bad Request`
```json
{
  "statusCode": 400,
  "message": "Prix de vente suggéré manquant pour les tailles: M"
}
```

---

## 📚 Résumé des Champs

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `useGlobalPricing` | boolean | Non | Active les prix globaux pour toutes les tailles |
| `globalCostPrice` | number | Condition | Prix de revient global (requis si useGlobalPricing = true) |
| `globalSuggestedPrice` | number | Condition | Prix de vente suggéré global (requis si useGlobalPricing = true) |
| `sizePricing[]` | array | Condition | Liste des prix par taille (requis si sizes est défini) |
| `sizePricing[].size` | string | Oui | Nom de la taille |
| `sizePricing[].costPrice` | number | Oui | Prix de revient pour cette taille |
| `sizePricing[].suggestedPrice` | number | Oui | Prix de vente suggéré (doit être > 0) |

---

## 🛒 PARTIE 2 : Produits Vendeur (Frontend Public)

**Endpoint concerné:** `GET /public/vendor-products`

Cette section s'adresse au frontend public pour afficher les produits vendeur avec leurs tailles et prix.

---

## 📡 Endpoint Public

### GET /public/vendor-products

Retourne la liste des produits vendeur avec les tailles et leurs prix.

### Structure de `sizesWithPrices`

Chaque produit contient maintenant un tableau `sizesWithPrices` :

```typescript
interface SizeWithPrice {
  id: number;           // ID de la taille (ProductSize.id)
  sizeName: string;     // Nom de la taille (ex: "S", "M", "L", "XL")
  costPrice: number;    // Prix de revient (à utiliser seulement pour l'admin)
  suggestedPrice: number; // Prix suggéré par l'admin
  salePrice: number | null; // Prix de vente (à afficher aux clients)
}
```

### Exemple de réponse

```json
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 16,
        "vendorName": "T-Shirt Premium",
        "price": 12000,
        "status": "PUBLISHED",

        "sizesWithPrices": [
          {
            "id": 7,
            "sizeName": "L",
            "costPrice": 8000,
            "suggestedPrice": 12000,
            "salePrice": 12000
          },
          {
            "id": 8,
            "sizeName": "XL",
            "costPrice": 3000,
            "suggestedPrice": 4000,
            "salePrice": 4000
          }
        ],

        "selectedSizes": [...],
        "selectedColors": [...]
      }
    ]
  }
}
```

---

## 💡 Cas d'Usage Frontend Public

### 1. Sélecteur de taille avec prix (React)

```typescript
interface ProductSizeSelectorProps {
  sizesWithPrices: SizeWithPrice[];
  onSizeSelect: (size: SizeWithPrice) => void;
}

function ProductSizeSelector({ sizesWithPrices, onSizeSelect }: ProductSizeSelectorProps) {
  const [selectedSize, setSelectedSize] = useState<SizeWithPrice | null>(null);

  const handleSelect = (size: SizeWithPrice) => {
    setSelectedSize(size);
    onSizeSelect(size);
  };

  return (
    <div className="size-selector">
      <h3>Choisir une taille</h3>
      <div className="sizes-grid">
        {sizesWithPrices.map((size) => (
          <button
            key={size.id}
            className={`size-option ${selectedSize?.id === size.id ? 'selected' : ''}`}
            onClick={() => handleSelect(size)}
          >
            <span className="size-name">{size.sizeName}</span>
            <span className="size-price">{formatPrice(size.salePrice)} F</span>
          </button>
        ))}
      </div>

      {selectedSize && (
        <div className="selected-price">
          Prix: {formatPrice(selectedSize.salePrice)} FCFA
        </div>
      )}
    </div>
  );
}
```

### 2. Affichage "À partir de" (prix minimum)

```typescript
// Pour afficher "À partir de X FCFA" sur les cartes produits
function getProductDisplayPrice(product: VendorProduct): string {
  if (!product.sizesWithPrices || product.sizesWithPrices.length === 0) {
    return formatPrice(product.price);
  }

  const prices = product.sizesWithPrices
    .map(s => s.salePrice)
    .filter(p => p != null);

  if (prices.length === 0) {
    return formatPrice(product.price);
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return formatPrice(minPrice);
  }

  return `À partir de ${formatPrice(minPrice)} FCFA`;
}

// Utilisation dans une carte produit
function ProductCard({ product }: { product: VendorProduct }) {
  return (
    <div className="product-card">
      <img src={product.finalImages[0]?.finalImageUrl} alt={product.vendorName} />
      <h3>{product.vendorName}</h3>
      <p className="price">{getProductDisplayPrice(product)}</p>
    </div>
  );
}
```

### 3. Filtre par plage de prix

```typescript
// Filtrer les produits par plage de prix
function filterProductsByPriceRange(
  products: VendorProduct[],
  minPrice: number,
  maxPrice: number
): VendorProduct[] {
  return products.filter(product => {
    if (!product.sizesWithPrices || product.sizesWithPrices.length === 0) {
      return product.price >= minPrice && product.price <= maxPrice;
    }

    return product.sizesWithPrices.some(size =>
      size.salePrice && size.salePrice >= minPrice && size.salePrice <= maxPrice
    );
  });
}

// Utilisation
const affordableProducts = filterProductsByPriceRange(allProducts, 5000, 15000);
```

### 4. Composant complet avec sélection (Vue.js)

```vue
<template>
  <div class="product-size-pricing">
    <div class="price-range" v-if="hasPriceVariation">
      À partir de {{ formatPrice(minPrice) }} FCFA
    </div>

    <div class="size-selector">
      <button
        v-for="size in sizesWithPrices"
        :key="size.id"
        :class="['size-button', { selected: selectedSizeId === size.id }]"
        @click="selectSize(size)"
      >
        <span class="size-label">{{ size.sizeName }}</span>
        <span class="size-price">{{ formatPrice(size.salePrice) }} F</span>
      </button>
    </div>

    <div class="selected-info" v-if="selectedSize">
      <p>Taille: {{ selectedSize.sizeName }}</p>
      <p>Prix: {{ formatPrice(selectedSize.salePrice) }} FCFA</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface SizeWithPrice {
  id: number;
  sizeName: string;
  salePrice: number;
}

const props = defineProps<{
  sizesWithPrices: SizeWithPrice[];
  basePrice?: number;
}>();

const emit = defineEmits<{
  sizeSelected: [size: SizeWithPrice];
}>();

const selectedSizeId = ref<number | null>(null);

const selectedSize = computed(() => {
  return props.sizesWithPrices.find(s => s.id === selectedSizeId.value) || null;
});

const prices = computed(() => {
  return props.sizesWithPrices.map(s => s.salePrice).filter(p => p != null);
});

const minPrice = computed(() => {
  return prices.value.length > 0 ? Math.min(...prices.value) : props.basePrice;
});

const maxPrice = computed(() => {
  return prices.value.length > 0 ? Math.max(...prices.value) : props.basePrice;
});

const hasPriceVariation = computed(() => {
  return minPrice.value !== maxPrice.value;
});

const selectSize = (size: SizeWithPrice) => {
  selectedSizeId.value = size.id;
  emit('sizeSelected', size);
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr-FR').format(price);
};
</script>
```

### 5. Gestion du panier avec prix par taille

```typescript
interface CartItem {
  productId: number;
  sizeId: number;
  sizeName: string;
  price: number; // Prix spécifique à la taille
  quantity: number;
}

function addToCart(
  product: VendorProduct,
  selectedSize: SizeWithPrice,
  quantity: number
): CartItem {
  return {
    productId: product.id,
    sizeId: selectedSize.id,
    sizeName: selectedSize.sizeName,
    price: selectedSize.salePrice, // Prix spécifique à la taille
    quantity
  };
}

// Calculer le total du panier
function calculateCartTotal(cartItems: CartItem[]): number {
  return cartItems.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}
```

---

## ⚠️ Points d'Attention

### 1. Fallback si `sizesWithPrices` est absent

```typescript
function safeGetSizesWithPrices(product: VendorProduct): SizeWithPrice[] {
  if (!product.sizesWithPrices || product.sizesWithPrices.length === 0) {
    // Fallback vers selectedSizes
    if (product.selectedSizes && product.selectedSizes.length > 0) {
      return product.selectedSizes.map(size => ({
        id: size.id,
        sizeName: size.sizeName,
        costPrice: 0,
        suggestedPrice: product.price,
        salePrice: product.price
      }));
    }
    return [];
  }
  return product.sizesWithPrices;
}
```

### 2. Gestion du `salePrice` null

```typescript
function getDisplayPrice(size: SizeWithPrice, fallbackPrice: number): number {
  return size.salePrice || size.suggestedPrice || fallbackPrice;
}
```

### 3. UX - Sélection de taille obligatoire

```typescript
function AddToCartButton({ product, selectedSize }: {
  product: VendorProduct;
  selectedSize: SizeWithPrice | null;
}) {
  const canAddToCart = selectedSize !== null;

  return (
    <button
      className="add-to-cart"
      disabled={!canAddToCart}
      onClick={() => addToCart(product, selectedSize!)}
    >
      {!canAddToCart
        ? 'Sélectionnez une taille'
        : `Ajouter au panier - ${formatPrice(selectedSize!.salePrice)} FCFA`
      }
    </button>
  );
}
```

---

## 📱 UX Recommandations

### Affichage par défaut

| Situation | Affichage recommandé |
|-----------|---------------------|
| Tous les prix identiques | Afficher uniquement le prix (pas besoin de montrer "À partir de") |
| Prix variés | Afficher "À partir de X FCFA" |
| Aucun prix par taille | Utiliser `product.price` |

### Sélecteur de taille

- Toujours afficher le prix à côté de la taille
- Mettre en surbrillance la taille sélectionnée
- Mettre à jour le prix total en temps réel
- Sur mobile, utiliser une liste verticale avec le prix en évidence

---

## 📋 Checklist Frontend

- [ ] Utiliser `sizesWithPrices` au lieu de `selectedSizes` pour afficher les prix
- [ ] Afficher "À partir de X FCFA" si les prix varient
- [ ] Rendre la sélection de taille obligatoire avant ajout au panier
- [ ] Mettre à jour le prix affiché quand la taille change
- [ ] Gérer le cas où `sizesWithPrices` est absent (fallback)
- [ ] Tester l'affichage sur mobile

---

## 🔗 Types TypeScript Complets

```typescript
/**
 * Produit vendeur avec tailles et prix (frontend public)
 */
export interface VendorProduct {
  id: number;
  vendorName: string;
  price: number;
  status: string;

  // 🆕 Tailles avec prix
  sizesWithPrices: SizeWithPrice[];

  // Ancien format (fallback)
  selectedSizes: Array<{ id: number; sizeName: string }>;
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;

  // Autres champs...
  adminProduct: any;
  vendor: any;
  finalImages: Array<{
    id: number;
    colorId: number;
    colorName: string;
    finalImageUrl: string;
  }>;
}

/**
 * Taille avec prix pour affichage frontend
 */
export interface SizeWithPrice {
  id: number;
  sizeName: string;
  costPrice: number;       // Caché pour les clients
  suggestedPrice: number;  // Prix suggéré admin
  salePrice: number | null; // Prix à afficher
}
```

---

**Fin du guide**
