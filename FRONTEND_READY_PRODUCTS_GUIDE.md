# Guide Frontend - Produits Prêts (isReadyProduct = true)

## 🎯 **Objectif**

Afficher les produits prêts (isReadyProduct = true) dans le frontend avec la même UI que les produits mockup, mais sans délimitations.

## 📋 **Prérequis**

### 1. Vérifier que le serveur fonctionne
```bash
# Démarrer le serveur backend
npm run start:dev

# Tester l'endpoint ultra-simple
curl -X GET http://localhost:3004/products/ready/ultra-test
```

### 2. Corriger les erreurs TypeScript
Les erreurs TypeScript empêchent le serveur de fonctionner. Corrigez-les d'abord :
```bash
# Régénérer le client Prisma
npx prisma generate

# Redémarrer le serveur
npm run start:dev
```

## 🔧 **Configuration Frontend**

### 1. Configuration API Helper
```javascript
// apiHelpers.ts
const BASE_URL = 'http://localhost:3004'; // ✅ CORRECT (port 3004)

export const apiGet = async (endpoint: string, token?: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
};
```

### 2. Service pour les produits prêts
```javascript
// services/readyProductsService.ts
import { apiGet } from '../helpers/apiHelpers';

export interface ReadyProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  status: 'PUBLISHED' | 'DRAFT';
  isReadyProduct: true;
  categories: Array<{ id: number; name: string }>;
  sizes: Array<{ id: number; name: string }>;
  colorVariations: Array<{
    id: number;
    name: string;
    colorCode: string;
    images: Array<{
      id: number;
      url: string;
      view: string;
    }>;
  }>;
}

export interface ReadyProductsResponse {
  success: boolean;
  products: ReadyProduct[];
  total: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  };
}

export const readyProductsService = {
  // Récupérer tous les produits prêts
  async getReadyProducts(params?: {
    status?: 'published' | 'draft' | 'all';
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<ReadyProductsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `/products/ready${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiGet(endpoint, localStorage.getItem('token'));
  },

  // Récupérer un produit prêt spécifique
  async getReadyProduct(id: number): Promise<ReadyProduct> {
    return apiGet(`/products/ready/${id}`, localStorage.getItem('token'));
  },

  // Test simple pour vérifier la connexion
  async testConnection(): Promise<any> {
    return apiGet('/products/ready/ultra-test');
  }
};
```

## 🎨 **Composants React**

### 1. Page principale des produits prêts
```jsx
// pages/ReadyProductsPage.tsx
import React, { useState, useEffect } from 'react';
import { readyProductsService, ReadyProduct } from '../services/readyProductsService';

const ReadyProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ReadyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all' as 'published' | 'draft' | 'all',
    search: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    fetchReadyProducts();
  }, [filters]);

  const fetchReadyProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await readyProductsService.getReadyProducts({
        status: filters.status,
        search: filters.search,
        limit: filters.limit,
        offset: (filters.page - 1) * filters.limit
      });

      setProducts(response.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status: 'published' | 'draft' | 'all') => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search, page: 1 }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Erreur:</strong> {error}
        <button 
          onClick={fetchReadyProducts}
          className="ml-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Produits Prêts</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Nouveau Produit Prêt
        </button>
      </div>

      {/* Filtres */}
      <div className="mb-6 flex gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleStatusFilter('all')}
            className={`px-3 py-1 rounded ${filters.status === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Tous
          </button>
          <button
            onClick={() => handleStatusFilter('published')}
            className={`px-3 py-1 rounded ${filters.status === 'published' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Publiés
          </button>
          <button
            onClick={() => handleStatusFilter('draft')}
            className={`px-3 py-1 rounded ${filters.status === 'draft' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Brouillons
          </button>
        </div>

        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1"
        />
      </div>

      {/* Liste des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ReadyProductCard key={product.id} product={product} />
        ))}
      </div>

      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun produit prêt trouvé</p>
        </div>
      )}
    </div>
  );
};

export default ReadyProductsPage;
```

### 2. Carte de produit prêt
```jsx
// components/ReadyProductCard.tsx
import React from 'react';
import { ReadyProduct } from '../services/readyProductsService';

interface ReadyProductCardProps {
  product: ReadyProduct;
  onEdit?: (product: ReadyProduct) => void;
  onDelete?: (productId: number) => void;
}

const ReadyProductCard: React.FC<ReadyProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete 
}) => {
  const mainImage = product.colorVariations[0]?.images[0]?.url;
  const statusColor = product.status === 'PUBLISHED' ? 'green' : 'yellow';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image principale */}
      <div className="relative h-48 bg-gray-200">
        {mainImage ? (
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <span>Aucune image</span>
          </div>
        )}
        
        {/* Badge de statut */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white bg-${statusColor}-500`}>
          {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
        </div>
      </div>

      {/* Informations du produit */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {product.description}
        </p>

        <div className="flex justify-between items-center mb-3">
          <span className="text-xl font-bold text-gray-900">
            {(product.price / 100).toFixed(2)} €
          </span>
          <span className="text-sm text-gray-500">
            Stock: {product.stock}
          </span>
        </div>

        {/* Couleurs disponibles */}
        <div className="mb-3">
          <span className="text-sm text-gray-500">Couleurs:</span>
          <div className="flex gap-1 mt-1">
            {product.colorVariations.slice(0, 5).map((color) => (
              <div
                key={color.id}
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color.colorCode }}
                title={color.name}
              />
            ))}
            {product.colorVariations.length > 5 && (
              <span className="text-xs text-gray-400">
                +{product.colorVariations.length - 5}
              </span>
            )}
          </div>
        </div>

        {/* Catégories */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {product.categories.map((category) => (
              <span
                key={category.id}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {category.name}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit?.(product)}
            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
          >
            Modifier
          </button>
          <button
            onClick={() => onDelete?.(product.id)}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReadyProductCard;
```

### 3. Formulaire de création/édition
```jsx
// components/ReadyProductForm.tsx
import React, { useState, useEffect } from 'react';
import { ReadyProduct } from '../services/readyProductsService';

interface ReadyProductFormProps {
  product?: ReadyProduct;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

const ReadyProductForm: React.FC<ReadyProductFormProps> = ({
  product,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ? (product.price / 100).toString() : '',
    stock: product?.stock?.toString() || '0',
    status: product?.status?.toLowerCase() || 'draft',
    categories: product?.categories.map(c => c.name).join(', ') || '',
    sizes: product?.sizes.map(s => s.name).join(', ') || '',
    colorVariations: product?.colorVariations || []
  });

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Données du produit
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) * 100, // Convertir en centimes
        stock: parseInt(formData.stock),
        status: formData.status,
        categories: formData.categories.split(',').map(c => c.trim()).filter(c => c),
        sizes: formData.sizes.split(',').map(s => s.trim()).filter(s => s),
        colorVariations: formData.colorVariations
      };

      formDataToSend.append('productData', JSON.stringify(productData));

      // Fichiers
      files.forEach((file, index) => {
        formDataToSend.append(`file_${index}`, file);
      });

      await onSubmit(formDataToSend);
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nom du produit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du produit *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        {/* Prix */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix (€) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2"
            required
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stock
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2"
          />
        </div>

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
      </div>

      {/* Catégories */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Catégories (séparées par des virgules) *
        </label>
        <input
          type="text"
          value={formData.categories}
          onChange={(e) => setFormData(prev => ({ ...prev, categories: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="T-shirts, Vêtements éco-responsables"
          required
        />
      </div>

      {/* Tailles */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tailles (séparées par des virgules)
        </label>
        <input
          type="text"
          value={formData.sizes}
          onChange={(e) => setFormData(prev => ({ ...prev, sizes: e.target.value }))}
          className="w-full border border-gray-300 rounded px-3 py-2"
          placeholder="S, M, L, XL"
        />
      </div>

      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images du produit *
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="w-full border border-gray-300 rounded px-3 py-2"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Sélectionnez les images pour chaque couleur du produit
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : (product ? 'Modifier' : 'Créer')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default ReadyProductForm;
```

## 🔧 **Configuration des Routes**

```jsx
// App.tsx ou router.tsx
import ReadyProductsPage from './pages/ReadyProductsPage';

// Dans votre configuration de routes
{
  path: '/admin/ready-products',
  element: <ReadyProductsPage />,
  // Assurez-vous que l'utilisateur est admin
  requireAuth: true,
  requireRole: ['ADMIN', 'SUPERADMIN']
}
```

## 🧪 **Tests de Diagnostic**

### 1. Test de connexion
```javascript
// Test simple pour vérifier que l'API fonctionne
const testConnection = async () => {
  try {
    const response = await fetch('http://localhost:3000/products/ready/ultra-test');
    const data = await response.json();
    console.log('✅ Connexion OK:', data);
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
  }
};
```

### 2. Test avec authentification
```javascript
// Test avec token admin
const testWithAuth = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/products/ready/simple-test', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('✅ Test avec auth OK:', data);
  } catch (error) {
    console.error('❌ Erreur avec auth:', error);
  }
};
```

## 🚨 **Problèmes Courants et Solutions**

### 1. Erreur 400 - Validation failed
**Cause :** Le serveur ne démarre pas correctement à cause d'erreurs TypeScript
**Solution :**
```bash
# Régénérer Prisma
npx prisma generate

# Redémarrer le serveur
npm run start:dev
```

### 2. Erreur 401 - Non autorisé
**Cause :** Token invalide ou utilisateur non admin
**Solution :**
- Vérifier que l'utilisateur est connecté en tant qu'admin
- Vérifier que le token est valide
- Tester avec l'endpoint ultra-simple (sans auth)

### 3. Erreur de port
**Cause :** Frontend appelle le mauvais port
**Solution :**
```javascript
// ✅ CORRECT
const BASE_URL = 'http://localhost:3000';

// ❌ INCORRECT
const BASE_URL = 'http://localhost:3004';
```

## 📋 **Checklist d'Implémentation**

- [ ] Corriger les erreurs TypeScript du serveur
- [ ] Vérifier que le serveur démarre sur le port 3000
- [ ] Tester l'endpoint ultra-simple
- [ ] Configurer l'API helper avec le bon port
- [ ] Créer le service readyProductsService
- [ ] Implémenter la page ReadyProductsPage
- [ ] Créer le composant ReadyProductCard
- [ ] Ajouter le formulaire ReadyProductForm
- [ ] Configurer les routes
- [ ] Tester avec un token admin valide

## 🎯 **Prochaines Étapes**

1. **Corriger les erreurs TypeScript** dans le serveur
2. **Tester l'endpoint ultra-simple** pour vérifier la connexion
3. **Implémenter les composants** un par un
4. **Tester avec un token admin** valide
5. **Ajouter les fonctionnalités** de création/édition/suppression

Le guide est prêt ! Commencez par corriger les erreurs TypeScript du serveur, puis testez l'endpoint ultra-simple avant d'implémenter les composants frontend. 🚀 