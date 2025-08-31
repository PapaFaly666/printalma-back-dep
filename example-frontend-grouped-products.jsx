import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Composant principal pour afficher les produits groupés
const GroupedProductsPage = () => {
  const [groupedProducts, setGroupedProducts] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    vendorId: null
  });

  // Fonction pour récupérer les produits groupés
  const fetchGroupedProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token'); // Récupérer le token JWT
      const params = new URLSearchParams();
      
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.vendorId) params.append('vendorId', filters.vendorId);

      const response = await axios.get(`/api/vendor/products/grouped?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setGroupedProducts(response.data.data);
        setStatistics(response.data.statistics);
        setError(null);
      } else {
        setError('Erreur lors de la récupération des produits');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant et lors du changement de filtres
  useEffect(() => {
    fetchGroupedProducts();
  }, [filters]);

  // Gestion des filtres
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Composant pour afficher un produit individuel
  const ProductCard = ({ product }) => (
    <div className="product-card bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex">
        {/* Image principale */}
        <div className="w-32 h-32 flex-shrink-0">
          {product.images.primaryImageUrl ? (
            <img 
              src={product.images.primaryImageUrl} 
              alt={product.vendorName}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
              <span className="text-gray-400">Pas d'image</span>
            </div>
          )}
        </div>

        {/* Informations du produit */}
        <div className="ml-4 flex-1">
          <h3 className="font-semibold text-lg text-gray-800 mb-2">
            {product.vendorName}
          </h3>
          
          <div className="mb-2">
            <span className="font-bold text-green-600 text-xl">
              {product.price.toLocaleString()} FCFA
            </span>
          </div>

          {/* Informations du vendeur */}
          <div className="mb-2">
            <span className="text-sm text-gray-600">
              Vendeur: <strong>{product.vendor.fullName}</strong>
              {product.vendor.shop_name && (
                <span className="ml-1 text-blue-600">({product.vendor.shop_name})</span>
              )}
            </span>
          </div>

          {/* Tailles disponibles */}
          <div className="mb-2">
            <span className="text-sm text-gray-600 mr-2">Tailles:</span>
            <div className="inline-flex flex-wrap gap-1">
              {product.selectedSizes.map(size => (
                <span key={size.id} className="px-2 py-1 bg-gray-100 text-xs rounded">
                  {size.sizeName}
                </span>
              ))}
            </div>
          </div>

          {/* Couleurs disponibles */}
          <div className="mb-2">
            <span className="text-sm text-gray-600 mr-2">Couleurs:</span>
            <div className="inline-flex flex-wrap gap-2">
              {product.selectedColors.map(color => (
                <div key={color.id} className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300 mr-1"
                    style={{ backgroundColor: color.colorCode }}
                    title={color.name}
                  ></div>
                  <span className="text-xs text-gray-600">{color.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Images par couleur */}
          <div className="mb-2">
            <span className="text-sm text-gray-600">
              Images: {product.images.total} 
              ({Object.keys(product.images.colorImages).length} couleurs)
            </span>
          </div>

          {/* Statut */}
          <div>
            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
              product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {product.status === 'PUBLISHED' ? 'Publié' : 'Brouillon'}
            </span>
          </div>
        </div>
      </div>

      {/* Aperçu des images par couleur (optionnel) */}
      {Object.keys(product.images.colorImages).length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu par couleur:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(product.images.colorImages).map(([colorName, images]) => (
              <div key={colorName} className="text-center">
                <div className="w-16 h-16 mx-auto mb-1">
                  <img 
                    src={images[0]?.url} 
                    alt={`${product.vendorName} - ${colorName}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
                <span className="text-xs text-gray-600">{colorName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Composant pour afficher un groupe de produits
  const ProductGroup = ({ groupName, products }) => (
    <div className="product-group mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800 capitalize">
          {groupName}s ({products.length})
        </h2>
        <span className="text-sm text-gray-500">
          {products.length} produit{products.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="products-list">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Erreur: </strong>
          <span>{error}</span>
          <button 
            onClick={fetchGroupedProducts}
            className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête avec filtres */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Produits par Catégorie
              </h1>
              {statistics && (
                <p className="mt-1 text-sm text-gray-600">
                  {statistics.totalProducts} produits dans {statistics.totalGroups} catégories
                </p>
              )}
            </div>

            {/* Filtres */}
            <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-4">
              {/* Filtre par statut */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="PUBLISHED">Publiés</option>
                <option value="DRAFT">Brouillons</option>
              </select>

              {/* Recherche */}
              <input
                type="text"
                placeholder="Rechercher..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={fetchGroupedProducts}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      {statistics && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{statistics.totalProducts}</div>
              <div className="text-sm text-gray-600">Total Produits</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{statistics.totalGroups}</div>
              <div className="text-sm text-gray-600">Catégories</div>
            </div>
            {Object.entries(statistics.groupCounts).slice(0, 2).map(([type, count]) => (
              <div key={type} className="bg-white p-4 rounded-lg shadow">
                <div className="text-2xl font-bold text-purple-600">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{type}s</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xl mb-4">Aucun produit trouvé</div>
            <p className="text-gray-500">
              Essayez de modifier vos filtres ou ajoutez des produits.
            </p>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([groupName, products]) => (
            <ProductGroup key={groupName} groupName={groupName} products={products} />
          ))
        )}
      </div>
    </div>
  );
};

// Exemple d'utilisation dans une application
const App = () => {
  return (
    <div className="App">
      <GroupedProductsPage />
    </div>
  );
};

export default App;

// Service pour l'API (utilisation séparée)
export const ProductsAPI = {
  // Récupérer les produits groupés
  async getGroupedProducts(filters = {}) {
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.append(key, value);
      }
    });

    const response = await axios.get(`/api/vendor/products/grouped?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data;
  },

  // Récupérer les produits d'un vendeur spécifique
  async getVendorGroupedProducts(vendorId) {
    return this.getGroupedProducts({ vendorId });
  },

  // Rechercher dans les produits groupés
  async searchGroupedProducts(searchTerm) {
    return this.getGroupedProducts({ search: searchTerm });
  }
};

/* 
EXEMPLE D'UTILISATION DANS UNE PAGE SPÉCIFIQUE:

import React from 'react';
import { ProductsAPI } from './ProductsAPI';

const VendorProductsPage = ({ vendorId }) => {
  const [products, setProducts] = useState({});
  
  useEffect(() => {
    const loadVendorProducts = async () => {
      try {
        const response = await ProductsAPI.getVendorGroupedProducts(vendorId);
        setProducts(response.data);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    
    loadVendorProducts();
  }, [vendorId]);

  return (
    <div>
      {Object.entries(products).map(([category, items]) => (
        <div key={category}>
          <h2>{category}</h2>
          {items.map(product => (
            <div key={product.id}>
              <h3>{product.vendorName}</h3>
              <p>Prix: {product.price} FCFA</p>
              <p>Tailles: {product.selectedSizes.map(s => s.sizeName).join(', ')}</p>
              <p>Couleurs: {product.selectedColors.map(c => c.name).join(', ')}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
*/ 