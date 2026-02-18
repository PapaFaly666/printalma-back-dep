# 🔌 API Endpoints : Prix par Taille pour Produits Vendeur

**Date:** 31 janvier 2026
**Version:** 1.0

---

## POST /vendor/products

**Description :** Créer un produit vendeur avec prix par taille

### Request Body

```json
{
  "baseProductId": 4,
  "designId": 42,
  "vendorName": "T-Shirt Premium",
  "vendorDescription": "T-shirt de qualité supérieure",
  "vendorPrice": 15000,
  "vendorStock": 100,
  "selectedColors": [
    { "id": 12, "name": "Noir", "colorCode": "#000000" }
  ],
  "selectedSizes": [
    { "id": 1, "sizeName": "S" },
    { "id": 2, "sizeName": "M" },
    { "id": 3, "sizeName": "L" }
  ],
  "productStructure": {
    "adminProduct": { ... },
    "designApplication": { "scale": 0.6 }
  },

  // 🆕 Prix par taille (optionnel)
  "useGlobalPricing": false,
  "globalCostPrice": null,
  "globalSuggestedPrice": null,
  "sizePricing": [
    {
      "size": "S",
      "costPrice": 8000,
      "suggestedPrice": 12000,
      "salePrice": 15000
    },
    {
      "size": "M",
      "costPrice": 8500,
      "suggestedPrice": 13000,
      "salePrice": 16000
    },
    {
      "size": "L",
      "costPrice": 9000,
      "suggestedPrice": 14000,
      "salePrice": 17000
    }
  ]
}
```

### Response 201

```json
{
  "success": true,
  "productId": 789,
  "message": "Produit créé avec design",
  "status": "PUBLISHED",
  "needsValidation": false,
  "imagesProcessed": 0,
  "structure": "admin_product_preserved",
  "designUrl": "https://res.cloudinary.com/.../design.jpg",
  "designId": 42,
  "isDesignReused": true,
  "finalImageUrl": null,
  "timing": {
    "totalColors": 1,
    "estimatedTotalTime": 3000
  }
}
```

> **Note :** Les prix par taille sont créés en base de données mais ne sont pas retournés dans la réponse immédiate (génération asynchrone). Utilisez `GET /vendor/products/:id` pour les récupérer.

---

## GET /vendor/products

**Description :** Lister les produits du vendeur avec prix par taille

### Query Params

| Param | Type | Description |
|-------|------|-------------|
| limit | number | Limite (défaut: 20) |
| offset | number | Décalage (défaut: 0) |
| status | string | `all`, `published`, `draft` |
| search | string | Recherche textuelle |
| genre | string | `HOMME`, `FEMME`, `UNISEXE` |

### Response 200

```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 789,
        "vendorName": "T-Shirt Premium",
        "price": 15000,
        "status": "PUBLISHED",
        "createdAt": "2026-01-31T10:00:00Z",

        // 🆕 Prix par taille
        "priceRange": {
          "min": 15000,
          "max": 17000,
          "display": "De 15000 à 17000 FCFA",
          "hasMultiplePrices": true
        },
        "useGlobalPricing": false,
        "globalCostPrice": null,
        "globalSuggestedPrice": null,
        "sizePrices": [
          {
            "size": "S",
            "costPrice": 8000,
            "suggestedPrice": 12000,
            "salePrice": 15000
          },
          {
            "size": "M",
            "costPrice": 8500,
            "suggestedPrice": 13000,
            "salePrice": 16000
          },
          {
            "size": "L",
            "costPrice": 9000,
            "suggestedPrice": 14000,
            "salePrice": 17000
          }
        ],

        "selectedSizes": [
          { "id": 1, "sizeName": "S", "isActive": true },
          { "id": 2, "sizeName": "M", "isActive": true },
          { "id": 3, "sizeName": "L", "isActive": true }
        ],
        "selectedColors": [...],
        "designId": 42,
        "design": {
          "id": 42,
          "name": "Dragon Design",
          "isValidated": true
        }
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

## GET /vendor/products/:id

**Description :** Détails d'un produit vendeur avec prix par taille

### Response 200

```json
{
  "success": true,
  "data": {
    "id": 789,
    "vendorName": "T-Shirt Premium",
    "description": "T-shirt de qualité supérieure",
    "price": 15000,
    "status": "PUBLISHED",

    // 🆕 Prix par taille
    "priceRange": {
      "min": 15000,
      "max": 17000,
      "display": "De 15000 à 17000 FCFA",
      "hasMultiplePrices": true
    },
    "useGlobalPricing": false,
    "globalCostPrice": null,
    "globalSuggestedPrice": null,
    "sizePrices": [
      {
        "size": "S",
        "costPrice": 8000,
        "suggestedPrice": 12000,
        "salePrice": 15000
      },
      {
        "size": "M",
        "costPrice": 8500,
        "suggestedPrice": 13000,
        "salePrice": 16000
      },
      {
        "size": "L",
        "costPrice": 9000,
        "suggestedPrice": 14000,
        "salePrice": 17000
      }
    ],

    "selectedSizes": [
      { "id": 1, "sizeName": "S", "isActive": true },
      { "id": 2, "sizeName": "M", "isActive": true },
      { "id": 3, "sizeName": "L", "isActive": true }
    ],
    "selectedColors": [...],
    "designId": 42,
    "design": {
      "id": 42,
      "name": "Dragon Design",
      "imageUrl": "https://...",
      "isValidated": true
    },
    "createdAt": "2026-01-31T10:00:00Z",
    "updatedAt": "2026-01-31T10:00:00Z"
  },
  "architecture": "v2_preserved_admin"
}
```

---

## 📦 Structures TypeScript

```typescript
// Prix par taille
interface VendorSizePrice {
  size: string;
  costPrice: number;
  suggestedPrice: number;
  salePrice?: number;
}

// Plage de prix calculée
interface PriceRange {
  min: number;
  max: number;
  display: string;
  hasMultiplePrices: boolean;
}

// Produit vendeur complet
interface VendorProduct {
  id: number;
  vendorName: string;
  price: number;
  status: string;

  // Prix par taille
  priceRange: PriceRange;
  useGlobalPricing: boolean;
  globalCostPrice?: number;
  globalSuggestedPrice?: number;
  sizePrices: VendorSizePrice[];

  selectedSizes: Array<{ id: number; sizeName: string }>;
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;
  designId?: number;
  // ... autres champs
}
```

---

## ⚠️ Comportements Importants

| Cas | Comportement |
|-----|-------------|
| `sizePricing` vide | Copie automatique des prix du produit admin |
| `salePrice` non fourni | Utilise `suggestedPrice` par défaut |
| `useGlobalPricing = true` | `sizePricing` peut être vide, utilise `globalCostPrice` et `globalSuggestedPrice` |
| Produit admin sans prix | Crée `sizePrices` avec `costPrice = 0` |

---

## 🔗 Endpoints Connexes

| Endpoint | Description |
|----------|-------------|
| `GET /vendor/products/:id/images-status` | Statut de génération des images |
| `PATCH /vendor/products/:id/publish` | Publier un produit |
| `DELETE /vendor/products/:id` | Supprimer un produit |

---

**Fin de la documentation API**
