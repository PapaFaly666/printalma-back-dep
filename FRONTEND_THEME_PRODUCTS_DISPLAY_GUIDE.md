# Guide Frontend - Affichage des Produits de Thème

## Vue d'ensemble

Ce guide détaille l'implémentation frontend pour afficher les produits d'un thème en utilisant l'endpoint `GET /api/themes/:id/products`. **Ces endpoints sont publics et ne nécessitent pas d'authentification** car ils affichent du contenu créé par l'admin.

## Endpoints Publics (Sans Authentification)

### 1. Liste des Thèmes
**URL:** `GET /api/themes`

### 2. Détails d'un Thème
**URL:** `GET /api/themes/:id`

### 3. Produits d'un Thème ⭐ **PRINCIPAL**
**URL:** `GET /api/themes/:id/products`

**Description:** Récupère la liste des produits d'un thème avec filtres, tri et pagination.

**⚠️ Important :** Cet endpoint est **PUBLIC** et ne nécessite pas de token d'authentification.

## Endpoints Publics vs Privés

### 🔓 Endpoints Publics (Sans Authentification)
Ces endpoints sont accessibles à tous les utilisateurs pour afficher le contenu :

- `GET /api/themes` - Liste des thèmes
- `GET /api/themes/:id` - Détails d'un thème  
- `GET /api/themes/:id/products` - Produits d'un thème

### 🔒 Endpoints Privés (Avec Authentification)
Ces endpoints nécessitent une authentification admin :

- `POST /api/themes` - Créer un thème
- `PATCH /api/themes/:id` - Modifier un thème
- `DELETE /api/themes/:id` - Supprimer un thème
- `POST /api/themes/:id/products` - Ajouter des produits
- `DELETE /api/themes/:id/products` - Supprimer des produits
- `GET /api/themes/:id/available-products` - Produits disponibles

## Paramètres de Requête

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `status` | string | Non | Filtrer par statut | `READY`, `DRAFT`, `PUBLISHED` |
| `category` | string | Non | Filtrer par catégorie | `tshirt`, `mug`, `poster` |
| `search` | string | Non | Rechercher par nom | `manga`, `anime` |
| `limit` | number | Non | Nombre de produits (défaut: 20) | `10`, `50` |
| `offset` | number | Non | Offset pour pagination (défaut: 0) | `0`, `20`, `40` |
| `sort` | string | Non | Trier par champ (défaut: `createdAt`) | `name`, `price`, `createdAt` |
| `order` | string | Non | Ordre de tri (défaut: `desc`) | `asc`, `desc` |

## Structure de Réponse

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-Shirt Manga Collection",
      "price": 25.99,
      "status": "READY",
      "isReadyProduct": true,
      "description": "T-shirt en coton avec design manga",
      "categories": ["tshirt", "manga"],
      "mainImage": "https://res.cloudinary.com/...",
      "addedToThemeAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "colorVariations": [
        {
          "id": 1,
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "images": [
            {
              "url": "https://res.cloudinary.com/...",
              "view": "Front",
              "publicId": "products/tshirt-white-front"
            },
            {
              "url": "https://res.cloudinary.com/...",
              "view": "Back",
              "publicId": "products/tshirt-white-back"
            }
          ]
        },
        {
          "id": 2,
          "name": "Noir",
          "colorCode": "#000000",
          "images": [
            {
              "url": "https://res.cloudinary.com/...",
              "view": "Front",
              "publicId": "products/tshirt-black-front"
            }
          ]
        }
      ]
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "theme": {
    "id": 4,
    "name": "Manga Collection",
    "description": "Thème dédié aux mangas et animes",
    "coverImage": "https://res.cloudinary.com/...",
    "category": "anime",
    "status": "active",
    "featured": false
  }
}
```

## Implémentations Frontend

### 1. React avec Hooks

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ThemeProductsDisplay = ({ themeId }) => {
  const [products, setProducts] = useState([]);
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'READY',
    limit: 12,
    offset: 0,
    sort: 'name',
    order: 'asc'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    hasMore: false
  });

  const fetchThemeProducts = async (newFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        ...filters,
        ...newFilters
      });
      
      // ⚠️ Pas besoin d'authentification pour cet endpoint public
      const response = await axios.get(`/api/themes/${themeId}/products?${params}`);
      
      if (response.data.success) {
        setProducts(response.data.data);
        setTheme(response.data.theme);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const newOffset = filters.offset + filters.limit;
    fetchThemeProducts({ offset: newOffset });
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
    fetchThemeProducts({ ...newFilters, offset: 0 });
  };

  const handleSort = (sort, order) => {
    handleFilterChange({ sort, order });
  };

  useEffect(() => {
    fetchThemeProducts();
  }, [themeId]);

  if (loading && products.length === 0) {
    return <div className="loading">Chargement des produits...</div>;
  }

  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  return (
    <div className="theme-products">
      {/* En-tête du thème */}
      {theme && (
        <div className="theme-header">
          <div className="theme-info">
            <h1>{theme.name}</h1>
            <p>{theme.description}</p>
            {theme.coverImage && (
              <img src={theme.coverImage} alt={theme.name} className="theme-cover" />
            )}
          </div>
        </div>
      )}

      {/* Filtres et tri */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Statut:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange({ status: e.target.value })}
          >
            <option value="">Tous</option>
            <option value="READY">Prêts</option>
            <option value="DRAFT">Brouillons</option>
            <option value="PUBLISHED">Publiés</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Tri:</label>
          <select 
            value={filters.sort} 
            onChange={(e) => handleSort(e.target.value, filters.order)}
          >
            <option value="name">Nom</option>
            <option value="price">Prix</option>
            <option value="createdAt">Date de création</option>
          </select>
          <button 
            onClick={() => handleSort(filters.sort, filters.order === 'asc' ? 'desc' : 'asc')}
            className="sort-toggle"
          >
            {filters.order === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            className="search-input"
          />
        </div>
      </div>

      {/* Grille de produits */}
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-image-container">
              {/* Carrousel d'images de couleurs */}
              {product.colorVariations && product.colorVariations.length > 0 ? (
                <div className="color-images-carousel">
                  {product.colorVariations.map(colorVar => (
                    <div key={colorVar.id} className="color-variation">
                      <div className="color-header">
                        <span 
                          className="color-indicator" 
                          style={{ backgroundColor: colorVar.colorCode }}
                          title={colorVar.name}
                        ></span>
                        <span className="color-name">{colorVar.name}</span>
                      </div>
                      <div className="color-images">
                        {colorVar.images.map((image, imgIndex) => (
                          <div key={imgIndex} className="product-image-item">
                            <img 
                              src={image.url} 
                              alt={`${product.name} - ${colorVar.name} - ${image.view}`}
                              className="product-image"
                            />
                            <span className="image-view">{image.view}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="product-image">
                  {product.mainImage ? (
                    <img src={product.mainImage} alt={product.name} />
                  ) : (
                    <div className="no-image">Aucune image</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="product-info">
              <h3>{product.name}</h3>
              <p className="price">{product.price}€</p>
              <p className="description">{product.description}</p>
              
              <div className="product-meta">
                <span className={`status status-${product.status.toLowerCase()}`}>
                  {product.status}
                </span>
                {product.isReadyProduct && (
                  <span className="ready-badge">Prêt</span>
                )}
              </div>
              
              <div className="categories">
                {product.categories.map(cat => (
                  <span key={cat} className="category-tag">{cat}</span>
                ))}
              </div>

              {/* Aperçu des couleurs disponibles */}
              {product.colorVariations && product.colorVariations.length > 0 && (
                <div className="color-preview">
                  <span className="color-preview-label">Couleurs disponibles:</span>
                  <div className="color-dots">
                    {product.colorVariations.map(colorVar => (
                      <span 
                        key={colorVar.id}
                        className="color-dot"
                        style={{ backgroundColor: colorVar.colorCode }}
                        title={colorVar.name}
                      ></span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.hasMore && (
        <div className="load-more">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="load-more-btn"
          >
            {loading ? 'Chargement...' : 'Charger plus'}
          </button>
          <span className="pagination-info">
            {products.length} sur {pagination.total} produits
          </span>
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="no-products">
          <p>Aucun produit trouvé dans ce thème</p>
        </div>
      )}
    </div>
  );
};

export default ThemeProductsDisplay;
```

### 2. Vue.js 3 avec Composition API

```vue
<template>
  <div class="theme-products">
    <!-- En-tête du thème -->
    <div v-if="theme" class="theme-header">
      <div class="theme-info">
        <h1>{{ theme.name }}</h1>
        <p>{{ theme.description }}</p>
        <img 
          v-if="theme.coverImage" 
          :src="theme.coverImage" 
          :alt="theme.name" 
          class="theme-cover" 
        />
      </div>
    </div>

    <!-- Filtres et tri -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Statut:</label>
        <select v-model="filters.status" @change="handleFilterChange">
          <option value="">Tous</option>
          <option value="READY">Prêts</option>
          <option value="DRAFT">Brouillons</option>
          <option value="PUBLISHED">Publiés</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Tri:</label>
        <select v-model="filters.sort" @change="handleSortChange">
          <option value="name">Nom</option>
          <option value="price">Prix</option>
          <option value="createdAt">Date de création</option>
        </select>
        <button @click="toggleSortOrder" class="sort-toggle">
          {{ filters.order === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <div class="search-group">
        <input
          v-model="filters.search"
          type="text"
          placeholder="Rechercher un produit..."
          @input="handleSearch"
          class="search-input"
        />
      </div>
    </div>

    <!-- Grille de produits -->
    <div class="products-grid">
      <div 
        v-for="product in products" 
        :key="product.id" 
        class="product-card"
      >
        <div class="product-image-container">
          <!-- Carrousel d'images de couleurs -->
          <div v-if="product.colorVariations && product.colorVariations.length > 0" class="color-images-carousel">
            <div 
              v-for="colorVar in product.colorVariations" 
              :key="colorVar.id" 
              class="color-variation"
            >
              <div class="color-header">
                <span 
                  class="color-indicator"
                  :style="{ backgroundColor: colorVar.colorCode }"
                  :title="colorVar.name"
                ></span>
                <span class="color-name">{{ colorVar.name }}</span>
              </div>
              <div class="color-images">
                <div 
                  v-for="(image, imgIndex) in colorVar.images" 
                  :key="imgIndex"
                  class="product-image-item"
                >
                  <img 
                    :src="image.url" 
                    :alt="`${product.name} - ${colorVar.name} - ${image.view}`"
                    class="product-image"
                  />
                  <span class="image-view">{{ image.view }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="product-image">
            <img 
              v-if="product.mainImage" 
              :src="product.mainImage" 
              :alt="product.name" 
            />
            <div v-else class="no-image">Aucune image</div>
          </div>
        </div>
        
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="price">{{ product.price }}€</p>
          <p class="description">{{ product.description }}</p>
          
          <div class="product-meta">
            <span :class="`status status-${product.status.toLowerCase()}`">
              {{ product.status }}
            </span>
            <span v-if="product.isReadyProduct" class="ready-badge">
              Prêt
            </span>
          </div>
          
          <div class="categories">
            <span 
              v-for="cat in product.categories" 
              :key="cat" 
              class="category-tag"
            >
              {{ cat }}
            </span>
          </div>

          <!-- Aperçu des couleurs disponibles -->
          <div v-if="product.colorVariations && product.colorVariations.length > 0" class="color-preview">
            <span class="color-preview-label">Couleurs disponibles:</span>
            <div class="color-dots">
              <span 
                v-for="colorVar in product.colorVariations" 
                :key="colorVar.id"
                class="color-dot"
                :style="{ backgroundColor: colorVar.colorCode }"
                :title="colorVar.name"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.hasMore" class="load-more">
      <button 
        @click="loadMore"
        :disabled="loading"
        class="load-more-btn"
      >
        {{ loading ? 'Chargement...' : 'Charger plus' }}
      </button>
      <span class="pagination-info">
        {{ products.length }} sur {{ pagination.total }} produits
      </span>
    </div>

    <div v-if="products.length === 0 && !loading" class="no-products">
      <p>Aucun produit trouvé dans ce thème</p>
    </div>

    <!-- Loading -->
    <div v-if="loading && products.length === 0" class="loading">
      Chargement des produits...
    </div>

    <!-- Error -->
    <div v-if="error" class="error">
      Erreur: {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  themeId: {
    type: Number,
    required: true
  }
});

const products = ref([]);
const theme = ref(null);
const loading = ref(false);
const error = ref(null);
const pagination = ref({
  total: 0,
  hasMore: false
});

const filters = reactive({
  status: 'READY',
  search: '',
  limit: 12,
  offset: 0,
  sort: 'name',
  order: 'asc'
});

const fetchThemeProducts = async (newFilters = {}) => {
  loading.value = true;
  error.value = null;
  
  try {
    const params = new URLSearchParams({
      ...filters,
      ...newFilters
    });
    
    const response = await axios.get(`/api/themes/${props.themeId}/products?${params}`);
    
    if (response.data.success) {
      products.value = response.data.data;
      theme.value = response.data.theme;
      pagination.value = response.data.pagination;
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors du chargement';
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  const newOffset = filters.offset + filters.limit;
  fetchThemeProducts({ offset: newOffset });
  filters.offset = newOffset;
};

const handleFilterChange = () => {
  filters.offset = 0;
  fetchThemeProducts({ offset: 0 });
};

const handleSortChange = () => {
  handleFilterChange();
};

const toggleSortOrder = () => {
  filters.order = filters.order === 'asc' ? 'desc' : 'asc';
  handleFilterChange();
};

const handleSearch = () => {
  // Debounce pour éviter trop d'appels API
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    handleFilterChange();
  }, 300);
};

let searchTimeout;

onMounted(() => {
  fetchThemeProducts();
});

// Réagir aux changements de themeId
watch(() => props.themeId, () => {
  filters.offset = 0;
  fetchThemeProducts();
});
</script>

<style scoped>
.theme-products {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.theme-header {
  margin-bottom: 30px;
  text-align: center;
}

.theme-cover {
  max-width: 200px;
  height: auto;
  border-radius: 8px;
}

.filters-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.product-image {
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: #999;
  font-style: italic;
}

/* Styles pour les images de couleurs */
.product-image-container {
  position: relative;
}

.color-images-carousel {
  height: 200px;
  overflow: hidden;
  position: relative;
}

.color-variation {
  margin-bottom: 10px;
}

.color-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(0,0,0,0.05);
  border-bottom: 1px solid #eee;
}

.color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.color-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.color-images {
  display: flex;
  gap: 8px;
  padding: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.color-images::-webkit-scrollbar {
  height: 4px;
}

.color-images::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.color-images::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.product-image-item {
  position: relative;
  min-width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #eee;
}

.product-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-view {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
}

.color-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.color-preview-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.color-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.color-dot:hover {
  transform: scale(1.2);
}

.product-info {
  padding: 16px;
}

.product-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.price {
  font-size: 20px;
  font-weight: bold;
  color: #2c5aa0;
  margin: 8px 0;
}

.description {
  color: #666;
  font-size: 14px;
  margin: 8px 0;
  line-height: 1.4;
}

.product-meta {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-ready {
  background: #d4edda;
  color: #155724;
}

.status-draft {
  background: #fff3cd;
  color: #856404;
}

.status-published {
  background: #cce5ff;
  color: #004085;
}

.ready-badge {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 12px;
}

.category-tag {
  background: #e9ecef;
  color: #495057;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 11px;
}

.load-more {
  text-align: center;
  margin-top: 30px;
}

.load-more-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.load-more-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.pagination-info {
  display: block;
  margin-top: 12px;
  color: #666;
  font-size: 14px;
}

.loading, .error, .no-products {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  color: #dc3545;
}
</style>
```

### 3. Hook Personnalisé React

```javascript
// hooks/useThemeProducts.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const useThemeProducts = (themeId) => {
  const [state, setState] = useState({
    products: [],
    theme: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      hasMore: false
    }
  });

  const [filters, setFilters] = useState({
    status: 'READY',
    search: '',
    limit: 12,
    offset: 0,
    sort: 'name',
    order: 'asc'
  });

  const fetchProducts = useCallback(async (newFilters = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const params = new URLSearchParams({
        ...filters,
        ...newFilters
      });
      
      const response = await axios.get(`/api/themes/${themeId}/products?${params}`);
      
      if (response.data.success) {
        setState(prev => ({
          ...prev,
          products: response.data.data,
          theme: response.data.theme,
          pagination: response.data.pagination,
          loading: false
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err.response?.data?.message || 'Erreur lors du chargement',
        loading: false
      }));
    }
  }, [themeId, filters]);

  const loadMore = useCallback(() => {
    const newOffset = filters.offset + filters.limit;
    setFilters(prev => ({ ...prev, offset: newOffset }));
    fetchProducts({ offset: newOffset });
  }, [filters.offset, filters.limit, fetchProducts]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
    fetchProducts({ ...newFilters, offset: 0 });
  }, [fetchProducts]);

  const handleSort = useCallback((sort, order) => {
    updateFilters({ sort, order });
  }, [updateFilters]);

  useEffect(() => {
    if (themeId) {
      fetchProducts();
    }
  }, [themeId, fetchProducts]);

  return {
    ...state,
    filters,
    loadMore,
    updateFilters,
    handleSort,
    refetch: () => fetchProducts()
  };
};
```

### 4. Composable Vue.js

```javascript
// composables/useThemeProducts.js
import { ref, reactive, computed } from 'vue';
import axios from 'axios';

export const useThemeProducts = (themeId) => {
  const products = ref([]);
  const theme = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const pagination = ref({
    total: 0,
    hasMore: false
  });

  const filters = reactive({
    status: 'READY',
    search: '',
    limit: 12,
    offset: 0,
    sort: 'name',
    order: 'asc'
  });

  const fetchProducts = async (newFilters = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const params = new URLSearchParams({
        ...filters,
        ...newFilters
      });
      
      const response = await axios.get(`/api/themes/${themeId}/products?${params}`);
      
      if (response.data.success) {
        products.value = response.data.data;
        theme.value = response.data.theme;
        pagination.value = response.data.pagination;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Erreur lors du chargement';
    } finally {
      loading.value = false;
    }
  };

  const loadMore = () => {
    const newOffset = filters.offset + filters.limit;
    filters.offset = newOffset;
    fetchProducts({ offset: newOffset });
  };

  const updateFilters = (newFilters) => {
    Object.assign(filters, { ...newFilters, offset: 0 });
    fetchProducts({ ...newFilters, offset: 0 });
  };

  const handleSort = (sort, order) => {
    updateFilters({ sort, order });
  };

  const hasProducts = computed(() => products.value.length > 0);
  const isEmpty = computed(() => !loading.value && products.value.length === 0);

  return {
    // State
    products: readonly(products),
    theme: readonly(theme),
    loading: readonly(loading),
    error: readonly(error),
    pagination: readonly(pagination),
    filters: readonly(filters),
    
    // Computed
    hasProducts,
    isEmpty,
    
    // Methods
    fetchProducts,
    loadMore,
    updateFilters,
    handleSort
  };
};
```

## Exemples d'Utilisation

### 1. Affichage Simple (Public)

```jsx
// React - Endpoint public, pas d'authentification nécessaire
const SimpleThemeDisplay = ({ themeId }) => {
  const { products, theme, loading, error } = useThemeProducts(themeId);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      <h1>{theme?.name}</h1>
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id}>
            <img src={product.mainImage} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.price}€</p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Avec Filtres Avancés (Public)

```jsx
// React avec filtres - Endpoint public
const FilteredThemeDisplay = ({ themeId }) => {
  const { 
    products, 
    theme, 
    loading, 
    filters, 
    updateFilters, 
    handleSort 
  } = useThemeProducts(themeId);

  return (
    <div>
      <div className="filters">
        <select 
          value={filters.status} 
          onChange={(e) => updateFilters({ status: e.target.value })}
        >
          <option value="">Tous</option>
          <option value="READY">Prêts</option>
          <option value="DRAFT">Brouillons</option>
        </select>
        
        <select 
          value={filters.sort} 
          onChange={(e) => handleSort(e.target.value, filters.order)}
        >
          <option value="name">Nom</option>
          <option value="price">Prix</option>
        </select>
      </div>
      
      {/* Affichage des produits */}
    </div>
  );
};
```

### 3. Utilisation Directe (Public)

```javascript
// Utilisation directe sans authentification
const fetchThemeProducts = async (themeId, filters = {}) => {
  try {
    const params = new URLSearchParams(filters);
    const response = await fetch(`/api/themes/${themeId}/products?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
};

// Exemple d'utilisation
const themeProducts = await fetchThemeProducts(4, {
  status: 'READY',
  limit: 12,
  sort: 'name',
  order: 'asc'
});
```

## CSS Recommandé

```css
/* styles/theme-products.css */
.theme-products {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.product-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* Styles pour les images de couleurs */
.product-image-container {
  position: relative;
}

.color-images-carousel {
  height: 200px;
  overflow: hidden;
  position: relative;
}

.color-variation {
  margin-bottom: 10px;
}

.color-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(0,0,0,0.05);
  border-bottom: 1px solid #eee;
}

.color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.color-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.color-images {
  display: flex;
  gap: 8px;
  padding: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.color-images::-webkit-scrollbar {
  height: 4px;
}

.color-images::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.color-images::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.product-image-item {
  position: relative;
  min-width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #eee;
}

.product-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-view {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 500;
}

.color-preview {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.color-preview-label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}

.color-dots {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.color-dot:hover {
  transform: scale(1.2);
}

.filters-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  align-items: center;
}

.load-more-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.load-more-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-ready { background: #d4edda; color: #155724; }
.status-draft { background: #fff3cd; color: #856404; }
.status-published { background: #cce5ff; color: #004085; }
```

## Composant Carrousel Amélioré (React)

```jsx
// components/ColorImagesCarousel.jsx
import React, { useState } from 'react';

const ColorImagesCarousel = ({ colorVariations, productName }) => {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!colorVariations || colorVariations.length === 0) {
    return null;
  }

  const currentColor = colorVariations[selectedColor];
  const currentImage = currentColor.images[selectedImage];

  return (
    <div className="color-carousel">
      {/* Sélecteur de couleurs */}
      <div className="color-selector">
        {colorVariations.map((colorVar, index) => (
          <button
            key={colorVar.id}
            className={`color-btn ${selectedColor === index ? 'active' : ''}`}
            onClick={() => {
              setSelectedColor(index);
              setSelectedImage(0);
            }}
            title={colorVar.name}
          >
            <span 
              className="color-indicator" 
              style={{ backgroundColor: colorVar.colorCode }}
            ></span>
            <span className="color-name">{colorVar.name}</span>
          </button>
        ))}
      </div>

      {/* Image principale */}
      <div className="main-image-container">
        {currentImage && (
          <img 
            src={currentImage.url} 
            alt={`${productName} - ${currentColor.name} - ${currentImage.view}`}
            className="main-image"
          />
        )}
        <div className="image-info">
          <span className="color-name">{currentColor.name}</span>
          <span className="image-view">{currentImage?.view}</span>
        </div>
      </div>

      {/* Miniatures des images */}
      {currentColor.images.length > 1 && (
        <div className="image-thumbnails">
          {currentColor.images.map((image, index) => (
            <button
              key={index}
              className={`thumbnail-btn ${selectedImage === index ? 'active' : ''}`}
              onClick={() => setSelectedImage(index)}
            >
              <img 
                src={image.url} 
                alt={`${productName} - ${currentColor.name} - ${image.view}`}
                className="thumbnail"
              />
              <span className="thumbnail-view">{image.view}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorImagesCarousel;
```

## Styles pour le Carrousel

```css
/* styles/color-carousel.css */
.color-carousel {
  height: 250px;
  display: flex;
  flex-direction: column;
}

.color-selector {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: rgba(0,0,0,0.05);
  border-bottom: 1px solid #eee;
  overflow-x: auto;
}

.color-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.color-btn:hover {
  background: rgba(0,0,0,0.1);
}

.color-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
}

.color-btn.active .color-indicator {
  border-color: white;
}

.main-image-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-info {
  position: absolute;
  bottom: 8px;
  left: 8px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  gap: 8px;
}

.image-thumbnails {
  display: flex;
  gap: 4px;
  padding: 8px;
  overflow-x: auto;
  background: rgba(0,0,0,0.05);
}

.thumbnail-btn {
  position: relative;
  min-width: 60px;
  height: 60px;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s;
}

.thumbnail-btn:hover {
  border-color: #007bff;
}

.thumbnail-btn.active {
  border-color: #007bff;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-view {
  position: absolute;
  bottom: 2px;
  left: 2px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 8px;
}
```

## Gestion des Erreurs

```javascript
// Gestion des erreurs communes
const handleApiError = (error) => {
  if (error.response?.status === 404) {
    return 'Thème non trouvé';
  }
  if (error.response?.status === 400) {
    return 'Paramètres invalides';
  }
  if (error.response?.status >= 500) {
    return 'Erreur serveur, veuillez réessayer';
  }
  return 'Erreur de connexion';
};
```

## Performance

### Optimisations Recommandées

1. **Debounce pour la recherche**
2. **Virtualisation pour de grandes listes**
3. **Lazy loading des images**
4. **Mise en cache des données**

```javascript
// Exemple de debounce pour la recherche
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

Ce guide fournit une implémentation complète pour afficher les produits d'un thème avec filtres, tri, pagination et images de couleurs dans vos applications frontend ! 🎉
 