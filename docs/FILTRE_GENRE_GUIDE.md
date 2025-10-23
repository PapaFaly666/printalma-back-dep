# Guide Frontend - Filtre par Genre des Produits

## Vue d'ensemble

Le filtre par genre permet d'afficher les produits vendeurs selon leur public cible (Homme, Femme, Bébé, Unisexe). Ce guide explique comment utiliser ce filtre dans votre frontend.

---

## Valeurs de Genre Disponibles

```typescript
enum ProductGenre {
  HOMME = "HOMME",
  FEMME = "FEMME",
  BEBE = "BEBE",
  UNISEXE = "UNISEXE"
}
```

---

## Endpoint Principal

### GET `/public/vendor-products`

**Endpoint public** pour récupérer les produits vendeurs avec filtre par genre.

#### URL de base
```
http://localhost:3004/public/vendor-products
```

#### Paramètres Query

| Paramètre | Type | Requis | Valeurs possibles | Description |
|-----------|------|--------|-------------------|-------------|
| `genre` | string | Non | HOMME, FEMME, BEBE, UNISEXE | Filtrer par genre |
| `limit` | number | Non | 1-100 | Nombre de produits (défaut: 20) |
| `offset` | number | Non | ≥0 | Pagination (défaut: 0) |
| `status` | string | Non | PUBLISHED, DRAFT, etc. | Statut des produits |
| `search` | string | Non | - | Recherche textuelle |
| `category` | string | Non | - | Catégorie de design |
| `minPrice` | number | Non | ≥0 | Prix minimum |
| `maxPrice` | number | Non | ≥0 | Prix maximum |
| `vendorId` | number | Non | - | ID vendeur spécifique |
| `allProducts` | boolean | Non | true/false | Afficher tous les produits (pas seulement best-sellers) |

---

## Exemples de Requêtes

### 1. Filtrer les produits pour HOMME

```bash
curl -X 'GET' \
  'http://localhost:3004/public/vendor-products?genre=HOMME' \
  -H 'accept: */*'
```

**Avec fetch (JavaScript)**
```javascript
const response = await fetch('http://localhost:3004/public/vendor-products?genre=HOMME');
const data = await response.json();
```

**Avec axios (JavaScript)**
```javascript
const { data } = await axios.get('http://localhost:3004/public/vendor-products', {
  params: { genre: 'HOMME' }
});
```

### 2. Filtrer les produits pour FEMME avec pagination

```bash
curl -X 'GET' \
  'http://localhost:3004/public/vendor-products?genre=FEMME&limit=12&offset=0' \
  -H 'accept: */*'
```

**Avec fetch**
```javascript
const response = await fetch('http://localhost:3004/public/vendor-products?genre=FEMME&limit=12&offset=0');
const data = await response.json();
```

### 3. Filtrer les produits BEBE avec recherche

```bash
curl -X 'GET' \
  'http://localhost:3004/public/vendor-products?genre=BEBE&search=body' \
  -H 'accept: */*'
```

**Avec axios**
```javascript
const { data } = await axios.get('http://localhost:3004/public/vendor-products', {
  params: {
    genre: 'BEBE',
    search: 'body'
  }
});
```

### 4. Filtrer UNISEXE avec prix minimum et maximum

```bash
curl -X 'GET' \
  'http://localhost:3004/public/vendor-products?genre=UNISEXE&minPrice=10000&maxPrice=50000' \
  -H 'accept: */*'
```

**Avec fetch**
```javascript
const params = new URLSearchParams({
  genre: 'UNISEXE',
  minPrice: '10000',
  maxPrice: '50000'
});

const response = await fetch(`http://localhost:3004/public/vendor-products?${params}`);
const data = await response.json();
```

### 5. Tous les produits avec plusieurs filtres

```bash
curl -X 'GET' \
  'http://localhost:3004/public/vendor-products?genre=HOMME&allProducts=true&limit=20&offset=0&category=T-SHIRT' \
  -H 'accept: */*'
```

---

## Structure de la Réponse

### Réponse Réussie (200 OK)

```json
{
  "success": true,
  "message": "Meilleures ventes récupérées avec succès",
  "data": {
    "products": [
      {
        "id": 52,
        "vendorName": "T-shirt Dragon Rouge Premium",
        "vendorDescription": "T-shirt avec design dragon exclusif",
        "price": 25000,
        "stock": 100,
        "status": "PUBLISHED",
        "isBestSeller": true,
        "salesCount": 85,
        "totalRevenue": 2125000,
        "baseProduct": {
          "id": 4,
          "name": "T-shirt Basique Homme",
          "genre": "HOMME",
          "description": "T-shirt en coton 100% de qualité premium",
          "price": 19000,
          "colorVariations": [
            {
              "id": 12,
              "name": "Rouge",
              "colorCode": "#ff0000",
              "images": [
                {
                  "id": 101,
                  "url": "https://res.cloudinary.com/printalma/tshirt-front-red.jpg",
                  "viewType": "FRONT",
                  "naturalWidth": 800,
                  "naturalHeight": 600,
                  "delimitations": [
                    {
                      "id": 201,
                      "x": 150,
                      "y": 200,
                      "width": 200,
                      "height": 200,
                      "coordinateType": "PIXEL"
                    }
                  ]
                }
              ]
            }
          ]
        },
        "design": {
          "id": 42,
          "name": "Dragon Mystique",
          "imageUrl": "https://res.cloudinary.com/printalma/design-42.png",
          "category": "ILLUSTRATION",
          "isValidated": true
        },
        "designPositions": [
          {
            "designId": 42,
            "position": {
              "x": 0,
              "y": 0,
              "scale": 0.6,
              "rotation": 0,
              "designWidth": 1200,
              "designHeight": 1200
            }
          }
        ],
        "vendor": {
          "id": 123,
          "fullName": "John Doe",
          "shop_name": "Dragon Designs",
          "profile_photo_url": "https://res.cloudinary.com/printalma/vendor-123.jpg"
        },
        "selectedSizes": [
          { "id": 1, "sizeName": "S" },
          { "id": 2, "sizeName": "M" },
          { "id": 3, "sizeName": "L" },
          { "id": 4, "sizeName": "XL" }
        ],
        "selectedColors": [
          { "id": 12, "name": "Rouge", "colorCode": "#ff0000" },
          { "id": 13, "name": "Noir", "colorCode": "#000000" }
        ]
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    },
    "type": "best_sellers"
  }
}
```

### Réponse Vide (Aucun produit trouvé)

```json
{
  "success": true,
  "message": "Meilleures ventes récupérées avec succès",
  "data": {
    "products": [],
    "pagination": {
      "total": 0,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    },
    "type": "best_sellers"
  }
}
```

### Réponse d'Erreur

```json
{
  "success": false,
  "message": "Erreur lors de la récupération des produits",
  "error": "Message d'erreur détaillé"
}
```

---

## Implémentation Frontend

### React/TypeScript - Hook personnalisé

```typescript
// useProductsByGenre.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

interface UseProductsByGenreOptions {
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
  limit?: number;
  offset?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  category?: string;
  allProducts?: boolean;
}

export const useProductsByGenre = (options: UseProductsByGenreOptions) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await axios.get(
          'http://localhost:3004/public/vendor-products',
          { params: options }
        );

        if (data.success) {
          setProducts(data.data.products);
          setPagination(data.data.pagination);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [options.genre, options.limit, options.offset, options.search]);

  return { products, loading, error, pagination };
};
```

### Utilisation du Hook

```typescript
// ProductsList.tsx
import React from 'react';
import { useProductsByGenre } from './hooks/useProductsByGenre';

const ProductsList: React.FC = () => {
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);

  const { products, loading, error, pagination } = useProductsByGenre({
    genre: selectedGenre || undefined,
    limit: 12,
    offset: currentPage * 12,
    allProducts: true
  });

  return (
    <div>
      {/* Filtres Genre */}
      <div className="genre-filters">
        <button onClick={() => setSelectedGenre('')}>Tous</button>
        <button onClick={() => setSelectedGenre('HOMME')}>Homme</button>
        <button onClick={() => setSelectedGenre('FEMME')}>Femme</button>
        <button onClick={() => setSelectedGenre('BEBE')}>Bébé</button>
        <button onClick={() => setSelectedGenre('UNISEXE')}>Unisexe</button>
      </div>

      {/* Liste des Produits */}
      {loading && <div>Chargement...</div>}
      {error && <div>Erreur: {error}</div>}

      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.hasMore && (
        <button onClick={() => setCurrentPage(prev => prev + 1)}>
          Charger plus
        </button>
      )}
    </div>
  );
};
```

### Vue.js 3 - Composition API

```typescript
// useProductsByGenre.ts
import { ref, watch } from 'vue';
import axios from 'axios';

export const useProductsByGenre = (options: any) => {
  const products = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref(null);

  const fetchProducts = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { data } = await axios.get(
        'http://localhost:3004/public/vendor-products',
        { params: options.value }
      );

      if (data.success) {
        products.value = data.data.products;
        pagination.value = data.data.pagination;
      } else {
        error.value = data.message;
      }
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  watch(options, fetchProducts, { deep: true, immediate: true });

  return { products, loading, error, pagination, refetch: fetchProducts };
};
```

### Service API TypeScript

```typescript
// api/products.service.ts
import axios, { AxiosInstance } from 'axios';

export class ProductsService {
  private api: AxiosInstance;

  constructor(baseURL: string = 'http://localhost:3004') {
    this.api = axios.create({ baseURL });
  }

  async getProductsByGenre(params: {
    genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
    limit?: number;
    offset?: number;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    allProducts?: boolean;
  }) {
    try {
      const { data } = await this.api.get('/public/vendor-products', { params });
      return data;
    } catch (error) {
      throw new Error(`Erreur récupération produits: ${error.message}`);
    }
  }

  async getProductDetail(productId: number) {
    try {
      const { data } = await this.api.get(`/public/vendor-products/${productId}`);
      return data;
    } catch (error) {
      throw new Error(`Erreur récupération détails: ${error.message}`);
    }
  }
}

// Utilisation
const productsService = new ProductsService();
const hommeProducts = await productsService.getProductsByGenre({ genre: 'HOMME' });
```

---

## Cas d'Usage Typiques

### 1. Page "Homme"

```typescript
const hommeProducts = await fetch(
  'http://localhost:3004/public/vendor-products?genre=HOMME&allProducts=true&limit=24'
);
```

### 2. Page "Femme" avec recherche

```typescript
const femmeProducts = await fetch(
  'http://localhost:3004/public/vendor-products?genre=FEMME&search=robe&limit=20'
);
```

### 3. Boutique Bébé avec filtre prix

```typescript
const babyProducts = await fetch(
  'http://localhost:3004/public/vendor-products?genre=BEBE&minPrice=5000&maxPrice=20000'
);
```

### 4. Section Unisexe avec catégorie

```typescript
const unisexProducts = await fetch(
  'http://localhost:3004/public/vendor-products?genre=UNISEXE&category=T-SHIRT'
);
```

### 5. Meilleures ventes par genre

```typescript
// Par défaut, allProducts=false donc retourne seulement les best-sellers
const bestSellerHomme = await fetch(
  'http://localhost:3004/public/vendor-products?genre=HOMME&limit=10'
);
```

---

## Notes Importantes

### Comportement du Filtre

1. **Produits de Base**: Le filtre genre se base sur le champ `genre` des produits admin (baseProduct)
2. **Plusieurs Produits**: Un même produit de base peut avoir plusieurs variations vendeurs
3. **Cascade**: Le filtre s'applique d'abord au baseProduct, puis retourne tous les vendorProducts associés

### Performance

- **Limite recommandée**: 12-24 produits par page pour de bonnes performances
- **Pagination**: Utilisez offset/limit pour charger progressivement
- **Cache**: Considérez un cache côté client pour les requêtes fréquentes

### Bonnes Pratiques

1. **Validation**: Validez les valeurs de genre côté frontend avant l'envoi
2. **Debounce**: Pour les champs de recherche, ajoutez un debounce (300-500ms)
3. **Loading**: Affichez toujours un état de chargement
4. **Erreurs**: Gérez les erreurs avec des messages utilisateur clairs
5. **Fallback**: Prévoyez un affichage si aucun produit n'est trouvé

---

## Interface TypeScript Complète

```typescript
// types/product.types.ts

export enum ProductGenre {
  HOMME = 'HOMME',
  FEMME = 'FEMME',
  BEBE = 'BEBE',
  UNISEXE = 'UNISEXE'
}

export interface VendorProduct {
  id: number;
  vendorName: string;
  vendorDescription: string;
  price: number;
  stock: number;
  status: string;
  isBestSeller: boolean;
  salesCount: number;
  totalRevenue: number;
  baseProduct: BaseProduct;
  design: Design;
  designPositions: DesignPosition[];
  vendor: Vendor;
  selectedSizes: Size[];
  selectedColors: Color[];
}

export interface BaseProduct {
  id: number;
  name: string;
  genre: ProductGenre;
  description: string;
  price: number;
  colorVariations: ColorVariation[];
}

export interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  images: ProductImage[];
}

export interface ProductImage {
  id: number;
  url: string;
  viewType: string;
  naturalWidth: number;
  naturalHeight: number;
  delimitations: Delimitation[];
}

export interface Delimitation {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  coordinateType: string;
}

export interface Design {
  id: number;
  name: string;
  imageUrl: string;
  category: string;
  isValidated: boolean;
}

export interface DesignPosition {
  designId: number;
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    designWidth: number;
    designHeight: number;
  };
}

export interface Vendor {
  id: number;
  fullName: string;
  shop_name: string;
  profile_photo_url: string;
}

export interface Size {
  id: number;
  sizeName: string;
}

export interface Color {
  id: number;
  name: string;
  colorCode: string;
}

export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: VendorProduct[];
    pagination: Pagination;
    type: 'best_sellers' | 'all_products';
  };
}
```

---

## Testing avec cURL

```bash
# Test basique
curl -X GET "http://localhost:3004/public/vendor-products?genre=HOMME"

# Test avec tous les paramètres
curl -X GET "http://localhost:3004/public/vendor-products?genre=FEMME&limit=10&offset=0&minPrice=10000&maxPrice=50000&search=robe&allProducts=true"

# Test format JSON
curl -X GET "http://localhost:3004/public/vendor-products?genre=BEBE" \
  -H "Accept: application/json" | jq
```

---

## Support et Documentation

- **Swagger UI**: `http://localhost:3004/api` - Documentation interactive complète
- **Backend repo**: `/docs` - Documentation technique supplémentaire
- **Questions**: Contactez l'équipe backend pour toute question

---

**Version**: 1.0.0
**Dernière mise à jour**: 2025-01-23
**Auteur**: Équipe Backend Printalma
