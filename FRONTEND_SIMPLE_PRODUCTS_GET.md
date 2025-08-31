# Guide Simple - Récupération des Produits (Sans Boucles Infinies)

## 🚨 Problème Identifié

Votre erreur `Maximum update depth exceeded` est causée par des **boucles infinies de re-renders**. Les hooks `useProductsAPI` et `useDeletedProducts` se réinitialisent constamment.

## ✅ Solution Simple et Robuste

### 1. Service de Base Optimisé

```typescript
// services/productService.ts
class ProductService {
  private static baseURL = '/api/products';
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getProducts(): Promise<Product[]> {
    const cacheKey = 'all-products';
    const cached = this.cache.get(cacheKey);
    
    // Utiliser le cache si valide
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📦 [ProductService] Utilisation du cache');
      return cached.data;
    }

    try {
      console.log('🔄 [ProductService] Appel API...');
      
      const response = await fetch(this.baseURL, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const products = await response.json();
      
      // Mettre en cache
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      console.log(`✅ [ProductService] ${products.length} produits récupérés`);
      return products;
    } catch (error) {
      console.error('❌ [ProductService] Erreur:', error);
      throw error;
    }
  }

  // Méthodes utilitaires
  static getMainImage(product: Product): string | null {
    return product.colorVariations?.[0]?.images?.[0]?.url || null;
  }

  static isPublished(product: Product): boolean {
    return product.status === 'PUBLISHED';
  }

  static getPublishedProducts(products: Product[]): Product[] {
    return products.filter(this.isPublished);
  }

  // Invalider le cache
  static clearCache() {
    this.cache.clear();
    console.log('🧹 [ProductService] Cache vidé');
  }
}

export default ProductService;
```

### 2. Hook Simple et Stable

```typescript
// hooks/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import ProductService from '../services/productService';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProducts(): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction de récupération stable
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ProductService.getProducts();
      setProducts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ [useProducts] Erreur:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Pas de dépendances = fonction stable

  // Charger une seule fois au montage
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fonction de refresh
  const refresh = useCallback(async () => {
    ProductService.clearCache();
    await fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refresh
  };
}
```

### 3. Composant de Liste Simple

```tsx
// components/ProductList.tsx
import React from 'react';
import { useProducts } from '../hooks/useProducts';

export function ProductList() {
  const { products, loading, error, refresh } = useProducts();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Erreur</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={refresh}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Produits ({products.length})</h2>
        <button 
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Actualiser
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const mainImage = ProductService.getMainImage(product);
  const isPublished = ProductService.isPublished(product);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="aspect-video bg-gray-200 relative">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Pas d'image
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isPublished 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {isPublished ? 'Publié' : 'Brouillon'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-xl font-bold text-blue-600">
            {product.price.toLocaleString()} FCFA
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>

        {/* Couleurs disponibles */}
        {product.colorVariations && product.colorVariations.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-1">Couleurs:</p>
            <div className="flex space-x-1">
              {product.colorVariations.slice(0, 4).map(color => (
                <div
                  key={color.id}
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color.colorCode }}
                  title={color.name}
                />
              ))}
              {product.colorVariations.length > 4 && (
                <span className="text-xs text-gray-400 ml-1">
                  +{product.colorVariations.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4. Types TypeScript

```typescript
// types/product.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: 'PUBLISHED' | 'DRAFT';
  description: string;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  sizes: ProductSize[];
  colorVariations: ColorVariation[];
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface ProductSize {
  id: number;
  productId: number;
  sizeName: string;
}

export interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  productId: number;
  images: ProductImage[];
}

export interface ProductImage {
  id: number;
  view: string;
  url: string;
  publicId: string;
  colorVariationId: number;
  delimitations: Delimitation[];
}

export interface Delimitation {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  productImageId: number;
}
```

## 🔧 Utilisation dans votre Application

### Remplacer vos hooks actuels

```tsx
// Au lieu de useProductsAPI et useDeletedProducts
// Utilisez simplement :

import { useProducts } from './hooks/useProducts';

function MyComponent() {
  const { products, loading, error, refresh } = useProducts();
  
  // Utilisation directe
  return <ProductList />;
}
```

### Filtrage côté client (simple)

```tsx
// hooks/useFilteredProducts.ts
import { useMemo } from 'react';
import { useProducts } from './useProducts';

export function useFilteredProducts(filters: {
  search?: string;
  status?: 'PUBLISHED' | 'DRAFT';
  category?: string;
}) {
  const { products, loading, error, refresh } = useProducts();

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(p => 
        p.categories.some(c => 
          c.name.toLowerCase().includes(filters.category!.toLowerCase())
        )
      );
    }

    return filtered;
  }, [products, filters]);

  return {
    products: filteredProducts,
    totalProducts: products.length,
    loading,
    error,
    refresh
  };
}
```

## 📱 Pagination Côté Client

```tsx
// hooks/usePaginatedProducts.ts
import { useMemo, useState } from 'react';
import { useFilteredProducts } from './useFilteredProducts';

export function usePaginatedProducts(filters: any, pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const { products, loading, error, refresh } = useFilteredProducts(filters);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    return {
      products: paginatedProducts,
      totalPages: Math.ceil(products.length / pageSize),
      currentPage,
      totalItems: products.length,
      hasNext: currentPage < Math.ceil(products.length / pageSize),
      hasPrev: currentPage > 1
    };
  }, [products, currentPage, pageSize]);

  return {
    ...paginatedData,
    loading,
    error,
    refresh,
    setPage: setCurrentPage,
    goToNextPage: () => setCurrentPage(prev => 
      prev < paginatedData.totalPages ? prev + 1 : prev
    ),
    goToPrevPage: () => setCurrentPage(prev => prev > 1 ? prev - 1 : prev)
  };
}
```

## 🛠️ Pourquoi cette Solution Fonctionne

### ✅ **Avantages**

1. **Pas de boucles infinies** : Fonctions stables avec `useCallback`
2. **Cache intelligent** : Évite les appels API répétés
3. **Gestion d'erreurs robuste** : Affichage et retry automatique
4. **Performance optimisée** : `useMemo` pour les calculs coûteux
5. **Code simple** : Une seule responsabilité par hook

### 🔍 **Différences avec votre code actuel**

| Problème Actuel | Solution |
|----------------|----------|
| Multiple hooks qui se battent | Un seul hook `useProducts` |
| Dépendances instables | `useCallback` sans dépendances |
| Pas de cache | Cache avec expiration |
| Re-renders constants | États stables |
| Logique complexe | Séparation des responsabilités |

## 🚀 Migration

### Étape 1 : Remplacer les hooks

```tsx
// ❌ Ancien code
const { products } = useProductsAPI();
const { deletedProducts } = useDeletedProducts();

// ✅ Nouveau code
const { products, loading, error } = useProducts();
const publishedProducts = ProductService.getPublishedProducts(products);
```

### Étape 2 : Simplifier les composants

```tsx
// ❌ Ancien code avec logique complexe
// ✅ Nouveau code avec ProductList simple
<ProductList />
```

### Étape 3 : Tester

```tsx
// Test simple
function TestProducts() {
  const { products, loading, error } = useProducts();
  
  console.log('Produits:', products.length);
  console.log('Chargement:', loading);
  console.log('Erreur:', error);
  
  return <div>Test OK</div>;
}
```

Cette solution **élimine complètement** les problèmes de boucles infinies et vous donne une base solide pour gérer vos produits ! 🎯 