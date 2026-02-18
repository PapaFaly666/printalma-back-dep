# 🔌 API Reference : Prix par Taille

---

## 📤 POST /api/products

**Description :** Créer un produit avec prix par taille (mockups avec délimitations)

### Request Body

```json
{
  "name": "T-shirt Premium",
  "description": "Description...",
  "price": 5000,
  "suggestedPrice": 5000,
  "categories": ["Vêtements > T-shirts"],
  "sizes": ["S", "M", "L"],
  "genre": "UNISEXE",
  "colorVariations": [...],

  // 🆕 Prix par taille (optionnel - auto-généré si vide)
  "useGlobalPricing": false,
  "globalCostPrice": 0,
  "globalSuggestedPrice": 0,
  "sizePricing": [
    { "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
    { "size": "M", "costPrice": 2200, "suggestedPrice": 5500 },
    { "size": "L", "costPrice": 2400, "suggestedPrice": 6000 }
  ]
}
```

### Response 201

```json
{
  "id": 123,
  "name": "T-shirt Premium",
  "suggestedPrice": 5000,
  "sizes": ["S", "M", "L"],
  "useGlobalPricing": false,
  "globalCostPrice": 0,
  "globalSuggestedPrice": 0,
  "sizePrices": [
    { "id": 1, "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
    { "id": 2, "size": "M", "costPrice": 2200, "suggestedPrice": 5500 },
    { "id": 3, "size": "L", "costPrice": 2400, "suggestedPrice": 6000 }
  ]
}
```

---

## 📤 POST /api/products/ready

**Description :** Créer un produit prêt avec prix par taille (sans délimitations)

### Request Body

```json
{
  "name": "T-shirt Premium",
  "description": "Description...",
  "price": 5000,
  "suggestedPrice": 5000,
  "categories": ["Vêtements > T-shirts"],
  "sizes": ["S", "M", "L"],
  "genre": "UNISEXE",
  "isReadyProduct": true,
  "colorVariations": [...],

  // 🆕 Prix par taille
  "useGlobalPricing": true,
  "globalCostPrice": 2000,
  "globalSuggestedPrice": 5000,
  "sizePricing": [
    { "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
    { "size": "M", "costPrice": 2000, "suggestedPrice": 5000 },
    { "size": "L", "costPrice": 2000, "suggestedPrice": 5000 }
  ]
}
```

### Response 201

```json
{
  "id": 124,
  "name": "T-shirt Premium",
  "suggestedPrice": 5000,
  "sizes": ["S", "M", "L"],
  "useGlobalPricing": true,
  "globalCostPrice": 2000,
  "globalSuggestedPrice": 5000,
  "sizePrices": [
    { "id": 4, "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
    { "id": 5, "size": "M", "costPrice": 2000, "suggestedPrice": 5000 },
    { "id": 6, "size": "L", "costPrice": 2000, "suggestedPrice": 5000 }
  ]
}
```

---

## 📥 GET /api/products/:id

**Description :** Récupérer un produit avec ses prix par taille

### Response 200

```json
{
  "id": 123,
  "name": "T-shirt Premium",
  "description": "Description...",
  "price": 5000,
  "suggestedPrice": 5000,
  "sizes": ["S", "M", "L"],
  "useGlobalPricing": false,
  "globalCostPrice": 0,
  "globalSuggestedPrice": 0,
  "sizePrices": [
    { "id": 1, "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
    { "id": 2, "size": "M", "costPrice": 2200, "suggestedPrice": 5500 },
    { "id": 3, "size": "L", "costPrice": 2400, "suggestedPrice": 6000 }
  ],
  "colorVariations": [...]
}
```

---

## 📥 GET /api/products/ready/:id

**Description :** Récupérer un produit prêt avec ses prix par taille

### Response 200

```json
{
  "id": 124,
  "name": "T-shirt Premium",
  "suggestedPrice": 5000,
  "sizes": ["S", "M", "L"],
  "useGlobalPricing": true,
  "globalCostPrice": 2000,
  "globalSuggestedPrice": 5000,
  "sizePrices": [
    { "id": 4, "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
    { "id": 5, "size": "M", "costPrice": 2000, "suggestedPrice": 5000 },
    { "id": 6, "size": "L", "costPrice": 2000, "suggestedPrice": 5000 }
  ]
}
```

---

## 🔧 PATCH /api/products/:id

**Description :** Mettre à jour un produit avec prix par taille

### Request Body

```json
{
  "sizePricing": [
    { "size": "S", "costPrice": 2500, "suggestedPrice": 5500 },
    { "size": "M", "costPrice": 2700, "suggestedPrice": 6000 },
    { "size": "L", "costPrice": 2900, "suggestedPrice": 6500 }
  ]
}
```

### Response 200

```json
{
  "id": 123,
  "sizePrices": [
    { "id": 1, "size": "S", "costPrice": 2500, "suggestedPrice": 5500 },
    { "id": 2, "size": "M", "costPrice": 2700, "suggestedPrice": 6000 },
    { "id": 3, "size": "L", "costPrice": 2900, "suggestedPrice": 6500 }
  ]
}
```

---

## 🔧 PATCH /api/products/ready/:id

**Description :** Mettre à jour un produit prêt avec prix par taille

### Request Body

```json
{
  "useGlobalPricing": true,
  "globalCostPrice": 2500,
  "globalSuggestedPrice": 5500,
  "sizePricing": [
    { "size": "S", "costPrice": 2500, "suggestedPrice": 5500 },
    { "size": "M", "costPrice": 2500, "suggestedPrice": 5500 },
    { "size": "L", "costPrice": 2500, "suggestedPrice": 5500 }
  ]
}
```

### Response 200

```json
{
  "id": 124,
  "useGlobalPricing": true,
  "globalCostPrice": 2500,
  "globalSuggestedPrice": 5500,
  "sizePrices": [
    { "id": 4, "size": "S", "costPrice": 2500, "suggestedPrice": 5500 },
    { "id": 5, "size": "M", "costPrice": 2500, "suggestedPrice": 5500 },
    { "id": 6, "size": "L", "costPrice": 2500, "suggestedPrice": 5500 }
  ]
}
```

---

## 📥 GET /api/products

**Query Params :** `isReadyProduct=true|false`, `status=published|draft`, `limit=20`, `offset=0`

### Response 200

```json
{
  "data": [
    {
      "id": 123,
      "name": "T-shirt Premium",
      "sizes": ["S", "M", "L"],
      "useGlobalPricing": false,
      "sizePrices": [
        { "id": 1, "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
        { "id": 2, "size": "M", "costPrice": 2200, "suggestedPrice": 5500 }
      ]
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

## 📥 GET /api/products/ready

**Query Params :** `status=published|draft`, `limit=20`, `offset=0`, `search=term`

### Response 200

```json
{
  "data": [
    {
      "id": 124,
      "name": "T-shirt Premium",
      "sizes": ["S", "M", "L"],
      "useGlobalPricing": true,
      "globalCostPrice": 2000,
      "globalSuggestedPrice": 5000,
      "sizePrices": [
        { "id": 4, "size": "S", "costPrice": 2000, "suggestedPrice": 5000 },
        { "id": 5, "size": "M", "costPrice": 2000, "suggestedPrice": 5000 }
      ]
    }
  ],
  "total": 1
}
```

---

## 📦 Structure SizePrice

```typescript
interface SizePrice {
  id: number;              // ID de l'entrée
  size: string;           // Taille (ex: "S", "M", "L")
  costPrice: number;      // Prix de revient en FCFA
  suggestedPrice: number; // Prix de vente en FCFA
}
```

---

## 📦 Structure Produit

```typescript
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  suggestedPrice?: number;
  sizes?: string[];

  // 🆕 Prix par taille
  useGlobalPricing: boolean;
  globalCostPrice: number;
  globalSuggestedPrice: number;
  sizePrices: SizePrice[];

  // ... autres champs
  colorVariations: ColorVariation[];
  genre: string;
  status: string;
}
```

---

## ⚠️ Erreurs

| Code | Message |
|------|---------|
| 400 | `Prix de vente suggéré manquant pour les tailles: S, M` |
| 400 | `Prix de revient global requis` |
| 400 | `Les prix par taille doivent correspondre aux prix globaux quand useGlobalPricing est true` |

---

## 💡 Comportement Auto

Si `sizePricing` est **vide** ou **non fourni** → Auto-génération avec `suggestedPrice` du produit :

```json
// Request
{
  "sizes": ["S", "M", "L"],
  "suggestedPrice": 5000,
  "sizePricing": []
}

// → Auto-généré
{
  "sizePrices": [
    { "size": "S", "suggestedPrice": 5000, "costPrice": 0 },
    { "size": "M", "suggestedPrice": 5000, "costPrice": 0 },
    { "size": "L", "suggestedPrice": 5000, "costPrice": 0 }
  ]
}
```
