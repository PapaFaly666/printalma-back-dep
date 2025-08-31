# 🌟 FRONTEND Vue.js - Intégration ColorVariations

## 📋 Vue d'ensemble

Guide spécifique pour intégrer la structure `colorVariations` dans une application Vue.js 3 avec Composition API et TypeScript.

---

## 🛠️ Configuration TypeScript

### **1. Types de données**

```typescript
// types/product.ts
export interface ColorVariation {
  id: number;
  name: string;
  colorCode: string;
  images: ProductImage[];
  _debug?: {
    validatedImages: number;
    filteredOut: number;
  };
}

export interface ProductImage {
  id: number;
  url: string;
  colorName: string;
  colorCode: string;
  validation?: {
    colorId: number;
    vendorProductId: number;
  };
}

export interface VendorProduct {
  id: number;
  vendorName: string;
  baseProduct: {
    name: string;
    type: string;
  };
  colorVariations: ColorVariation[];
  images: {
    validation: {
      hasImageMixing: boolean;
      allImagesValidated: boolean;
      productType: string;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  products?: VendorProduct[];
  message?: string;
  error?: string;
}
```

### **2. Service API avec Composables**

```typescript
// composables/useVendorProducts.ts
import { ref, computed, onMounted } from 'vue';
import type { VendorProduct, ApiResponse } from '@/types/product';

export const useVendorProducts = (vendorId?: number) => {
  const products = ref<VendorProduct[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

  const validationStats = computed(() => {
    const total = products.value.length;
    const valid = products.value.filter(p => 
      p.colorVariations && p.colorVariations.length > 0
    ).length;
    const withMixing = products.value.filter(p => 
      p.images?.validation?.hasImageMixing
    ).length;

    return { total, valid, withMixing };
  });

  const fetchProducts = async () => {
    try {
      loading.value = true;
      error.value = null;

      const url = vendorId 
        ? `${API_BASE_URL}/api/vendor/products/vendor/${vendorId}`
        : `${API_BASE_URL}/api/vendor/products`;

      const token = localStorage.getItem('authToken');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<VendorProduct[]> = await response.json();
      products.value = data.products || data.data || [];

      // Validation des données
      validateProductsStructure();

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('Erreur récupération produits:', err);
    } finally {
      loading.value = false;
    }
  };

  const validateProductsStructure = () => {
    products.value.forEach(product => {
      if (!product.colorVariations || !Array.isArray(product.colorVariations)) {
        console.warn(`Produit ${product.id}: structure colorVariations invalide`);
      }

      product.colorVariations?.forEach(color => {
        if (!color.images || color.images.length === 0) {
          console.warn(`Produit ${product.id}, couleur ${color.name}: aucune image`);
        }
      });
    });
  };

  const refreshProducts = () => {
    fetchProducts();
  };

  // Auto-fetch au montage
  onMounted(() => {
    fetchProducts();
  });

  return {
    products: readonly(products),
    loading: readonly(loading),
    error: readonly(error),
    validationStats,
    fetchProducts,
    refreshProducts
  };
};
```

---

## 🎨 Composants Vue

### **1. Composant ProductCard**

```vue
<!-- components/ProductCard.vue -->
<template>
  <div class="product-card">
    <!-- En-tête avec validation -->
    <div class="product-header">
      <h3>{{ product.vendorName }}</h3>
      <span class="product-type">{{ product.baseProduct.name }}</span>
      
      <!-- Indicateurs de validation -->
      <div class="validation-indicators">
        <div 
          v-if="product.images.validation.hasImageMixing" 
          class="validation-warning"
          title="Images filtrées détectées"
        >
          ⚠️ Images filtrées
        </div>
        <div 
          v-if="product.images.validation.allImagesValidated" 
          class="validation-success"
          title="Toutes les images sont validées"
        >
          ✅ Validé
        </div>
      </div>
    </div>

    <!-- Image principale -->
    <div class="product-image">
      <img 
        v-if="primaryImage"
        :src="primaryImage.url"
        :alt="`${product.vendorName} - ${selectedColor?.name}`"
        loading="lazy"
        @error="handleImageError"
      />
      <div v-else class="no-image">
        <span>Aucune image</span>
      </div>
    </div>

    <!-- Sélecteur de couleurs -->
    <div class="color-selector">
      <h4>Couleurs disponibles ({{ product.colorVariations.length }}):</h4>
      <div class="color-options">
        <ColorOption
          v-for="color in product.colorVariations"
          :key="color.id"
          :color="color"
          :is-selected="color.id === selectedColorId"
          @select="handleColorSelect(color.id)"
        />
      </div>
    </div>

    <!-- Galerie d'images de la couleur sélectionnée -->
    <div v-if="selectedColor" class="image-gallery">
      <div class="gallery-header">
        <span>{{ selectedColor.name }} ({{ selectedColor.images.length }} images)</span>
      </div>
      <div class="gallery-grid">
        <img
          v-for="(image, index) in selectedColor.images"
          :key="image.id"
          :src="image.url"
          :alt="`${product.vendorName} - ${selectedColor.name} - ${index + 1}`"
          class="gallery-image"
          loading="lazy"
          @click="openImageModal(image)"
        />
      </div>
    </div>

    <!-- Debug info (développement) -->
    <div 
      v-if="isDevelopment && selectedColor?._debug" 
      class="debug-info"
    >
      <small>
        Debug: {{ selectedColor._debug.validatedImages }} validées, 
        {{ selectedColor._debug.filteredOut }} filtrées
      </small>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { VendorProduct, ColorVariation, ProductImage } from '@/types/product';
import ColorOption from './ColorOption.vue';

interface Props {
  product: VendorProduct;
}

interface Emits {
  (e: 'colorChange', colorId: number): void;
  (e: 'imageClick', image: ProductImage): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// État local
const selectedColorId = ref<number>(props.product.colorVariations[0]?.id || 0);

// Computed
const selectedColor = computed(() => 
  props.product.colorVariations.find(color => color.id === selectedColorId.value) 
  || props.product.colorVariations[0]
);

const primaryImage = computed(() => selectedColor.value?.images[0]);

const isDevelopment = computed(() => 
  import.meta.env.MODE === 'development'
);

// Méthodes
const handleColorSelect = (colorId: number) => {
  selectedColorId.value = colorId;
  emit('colorChange', colorId);
};

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement;
  console.warn(`Erreur chargement image: ${img.src}`);
  // Optionnel: remplacer par une image par défaut
  // img.src = '/images/placeholder.png';
};

const openImageModal = (image: ProductImage) => {
  emit('imageClick', image);
};

// Watchers
watch(() => props.product.id, () => {
  // Réinitialiser la couleur sélectionnée quand le produit change
  selectedColorId.value = props.product.colorVariations[0]?.id || 0;
});
</script>

<style scoped>
.product-card {
  border: 1px solid #e1e1e1;
  border-radius: 12px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 12px;
}

.product-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  line-height: 1.3;
}

.product-type {
  background: #f3f4f6;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  white-space: nowrap;
}

.validation-indicators {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.validation-warning {
  background: #fef3c7;
  color: #92400e;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.validation-success {
  background: #d1fae5;
  color: #065f46;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
}

.product-image {
  width: 100%;
  height: 250px;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
  position: relative;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-image:hover img {
  transform: scale(1.05);
}

.no-image {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  font-size: 0.875rem;
}

.color-selector h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.image-gallery {
  margin-top: 16px;
}

.gallery-header {
  margin-bottom: 8px;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.gallery-image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gallery-image:hover {
  border-color: #3b82f6;
  transform: scale(1.05);
}

.debug-info {
  margin-top: 12px;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.75rem;
  color: #6b7280;
}
</style>
```

### **2. Composant ColorOption**

```vue
<!-- components/ColorOption.vue -->
<template>
  <div 
    class="color-option"
    :class="{ 
      'selected': isSelected,
      'has-issues': hasIssues
    }"
    @click="$emit('select')"
    :title="tooltipText"
  >
    <!-- Pastille de couleur -->
    <div 
      class="color-circle"
      :style="{ backgroundColor: color.colorCode }"
    />
    
    <!-- Nom de la couleur -->
    <span class="color-name">{{ color.name }}</span>
    
    <!-- Nombre d'images -->
    <span class="image-count">
      {{ color.images.length }}
    </span>
    
    <!-- Indicateur de problèmes (développement) -->
    <span 
      v-if="isDevelopment && hasIssues" 
      class="filtered-warning"
      :title="`${color._debug?.filteredOut} images filtrées`"
    >
      ⚠️
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ColorVariation } from '@/types/product';

interface Props {
  color: ColorVariation;
  isSelected: boolean;
}

interface Emits {
  (e: 'select'): void;
}

const props = defineProps<Props>();
defineEmits<Emits>();

const isDevelopment = computed(() => 
  import.meta.env.MODE === 'development'
);

const hasIssues = computed(() => 
  props.color._debug && props.color._debug.filteredOut > 0
);

const tooltipText = computed(() => {
  let text = `${props.color.name} (${props.color.images.length} images)`;
  
  if (hasIssues.value) {
    text += ` - ${props.color._debug?.filteredOut} images filtrées`;
  }
  
  return text;
});
</script>

<style scoped>
.color-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  background: white;
  user-select: none;
}

.color-option:hover {
  border-color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-1px);
}

.color-option.selected {
  border-color: #3b82f6;
  background: #3b82f6;
  color: white;
}

.color-option.has-issues {
  border-color: #f59e0b;
}

.color-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.color-name {
  font-weight: 500;
}

.image-count {
  font-size: 0.75rem;
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.color-option.selected .image-count {
  background: rgba(255, 255, 255, 0.2);
}

.filtered-warning {
  font-size: 0.75rem;
  color: #f59e0b;
}
</style>
```

### **3. Composant principal ProductList**

```vue
<!-- components/ProductList.vue -->
<template>
  <div class="product-list">
    <!-- En-tête avec statistiques -->
    <div class="list-header">
      <h2>
        {{ title }}
        <span v-if="!loading" class="product-count">
          ({{ validationStats.total }})
        </span>
      </h2>
      
      <div class="stats">
        <div class="stat valid">
          ✅ {{ validationStats.valid }} validés
        </div>
        <div 
          v-if="validationStats.withMixing > 0" 
          class="stat warning"
        >
          ⚠️ {{ validationStats.withMixing }} avec mélanges
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <button 
        @click="refreshProducts" 
        :disabled="loading"
        class="refresh-btn"
      >
        <span v-if="loading">🔄 Chargement...</span>
        <span v-else>🔄 Actualiser</span>
      </button>
    </div>

    <!-- États de chargement et d'erreur -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement des produits...</p>
    </div>

    <div v-else-if="error" class="error">
      <h3>❌ Erreur de chargement</h3>
      <p>{{ error }}</p>
      <button @click="refreshProducts" class="retry-btn">
        Réessayer
      </button>
    </div>

    <!-- Liste des produits -->
    <div v-else-if="products.length > 0" class="products-grid">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :product="product"
        @color-change="handleColorChange"
        @image-click="handleImageClick"
      />
    </div>

    <!-- Aucun produit -->
    <div v-else class="no-products">
      <div class="empty-state">
        <span class="empty-icon">📦</span>
        <h3>Aucun produit trouvé</h3>
        <p>{{ vendorId ? 'Ce vendeur n\'a pas encore de produits.' : 'Aucun produit disponible.' }}</p>
      </div>
    </div>

    <!-- Modal d'image (optionnel) -->
    <ImageModal
      v-if="selectedImage"
      :image="selectedImage"
      @close="selectedImage = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useVendorProducts } from '@/composables/useVendorProducts';
import type { ProductImage } from '@/types/product';
import ProductCard from './ProductCard.vue';
import ImageModal from './ImageModal.vue';

interface Props {
  vendorId?: number;
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Produits'
});

// Composables
const { products, loading, error, validationStats, refreshProducts } = useVendorProducts(props.vendorId);

// État local
const selectedImage = ref<ProductImage | null>(null);

// Gestionnaires d'événements
const handleColorChange = (colorId: number) => {
  console.log(`Couleur sélectionnée: ${colorId}`);
};

const handleImageClick = (image: ProductImage) => {
  selectedImage.value = image;
};
</script>

<style scoped>
.product-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.list-header h2 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: #1a1a1a;
}

.product-count {
  font-size: 1.25rem;
  font-weight: 400;
  color: #6b7280;
}

.stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.stat.valid {
  background: #d1fae5;
  color: #065f46;
}

.stat.warning {
  background: #fef3c7;
  color: #92400e;
}

.actions {
  margin-bottom: 24px;
}

.refresh-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #2563eb;
}

.refresh-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 40px 20px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.error h3 {
  color: #dc2626;
  margin-bottom: 8px;
}

.error p {
  color: #7f1d1d;
  margin-bottom: 16px;
}

.retry-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.no-products {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.empty-state {
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.25rem;
  margin-bottom: 8px;
  color: #374151;
}

.empty-state p {
  font-size: 0.875rem;
}
</style>
```

---

## 🚀 Utilisation dans l'application

### **1. Page principale (Vue Router)**

```vue
<!-- views/VendorProducts.vue -->
<template>
  <div class="vendor-products-page">
    <ProductList 
      :vendor-id="vendorId" 
      :title="pageTitle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ProductList from '@/components/ProductList.vue';

const route = useRoute();

const vendorId = computed(() => {
  const id = route.params.vendorId;
  return id ? Number(id) : undefined;
});

const pageTitle = computed(() => 
  vendorId.value ? `Produits du vendeur ${vendorId.value}` : 'Tous les produits'
);
</script>
```

### **2. Configuration du router**

```typescript
// router/index.ts
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/vendor/:vendorId/products',
    name: 'VendorProducts',
    component: () => import('@/views/VendorProducts.vue'),
    props: true
  },
  {
    path: '/products',
    name: 'AllProducts',
    component: () => import('@/views/VendorProducts.vue')
  }
];

export default createRouter({
  history: createWebHistory(),
  routes
});
```

---

## 🧪 Test de l'intégration

Testons maintenant l'intégration avec notre script :

<function_calls>
<invoke name="run_terminal_cmd">
<parameter name="command">node test-frontend-integration.js 