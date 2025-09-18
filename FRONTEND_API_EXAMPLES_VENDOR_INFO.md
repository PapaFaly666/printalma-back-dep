# 🔌 Exemples d'API : Informations Vendeurs Complètes

## 📋 Aperçu

Ce document fournit des exemples concrets d'appels API pour récupérer toutes les informations des vendeurs, y compris la dernière connexion et la date d'inscription.

## 🌐 Endpoints Disponibles

### 1. 🏪 **Produits Publics avec Infos Vendeur Complètes**

#### `GET /api/public/vendor-products`

Récupère les produits publics avec informations vendeur enrichies.

```typescript
// ✅ Appel API
const response = await fetch('/api/public/vendor-products?limit=20');
const data = await response.json();

// 📦 Structure de réponse
interface PublicVendorProductsResponse {
  success: boolean;
  message: string;
  data: {
    products: VendorProductWithEnhancedVendorInfo[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

// 🎯 Produit avec informations vendeur complètes
interface VendorProductWithEnhancedVendorInfo {
  id: number;
  name: string;
  price: number;
  status: 'PUBLISHED' | 'DRAFT' | 'PENDING';

  // 👤 Informations vendeur enrichies
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    shop_name?: string;
    profile_photo_url?: string;
    email: string;

    // 📅 NOUVELLES INFORMATIONS TEMPORELLES
    created_at: string;      // "2023-01-15T10:30:00Z"
    last_login_at?: string;  // "2024-01-15T14:30:00Z"

    // 🎯 INFORMATIONS DE STATUT
    status: boolean;         // true = actif, false = désactivé
    country?: string;        // "France"
    phone?: string;          // "+33 6 12 34 56 78"
    vendeur_type?: 'INDIVIDUEL' | 'ENTREPRISE';
  };

  // 🎨 Autres informations produit...
  baseProduct: AdminProduct;
  designApplication: DesignApplicationInfo;
}
```

#### 💡 **Exemple d'utilisation pratique**

```tsx
const VendorProductsList = () => {
  const [products, setProducts] = useState<VendorProductWithEnhancedVendorInfo[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await fetch('/api/public/vendor-products?limit=50');
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.products);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <div key={product.id} className="bg-white rounded-lg shadow-md p-6">
          {/* 🏷️ Informations produit */}
          <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
          <p className="text-2xl font-bold text-green-600 mb-4">
            {(product.price / 100).toLocaleString('fr-FR')} FCFA
          </p>

          {/* 👤 Informations vendeur avec dates */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-3 mb-3">
              <img
                src={product.vendor.profile_photo_url || '/default-avatar.png'}
                alt={`${product.vendor.firstName} ${product.vendor.lastName}`}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">
                  {product.vendor.shop_name || `${product.vendor.firstName} ${product.vendor.lastName}`}
                </p>
                <VendorStatusBadge status={product.vendor.status} />
              </div>
            </div>

            {/* 📅 AFFICHAGE DES DATES */}
            <div className="space-y-1 text-sm text-gray-600">
              <MemberSince createdAt={product.vendor.created_at} />
              <LastSeen lastLoginAt={product.vendor.last_login_at} />

              {product.vendor.country && (
                <div className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {product.vendor.country}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 2. 🔍 **Détails d'un Produit Spécifique**

#### `GET /api/public/vendor-products/:id`

```typescript
// ✅ Appel API
const fetchProductDetails = async (productId: number) => {
  const response = await fetch(`/api/public/vendor-products/${productId}`);
  const data = await response.json();
  return data.data; // VendorProductWithEnhancedVendorInfo
};

// 💡 Exemple d'usage
const ProductDetailPage = ({ productId }: { productId: number }) => {
  const [product, setProduct] = useState<VendorProductWithEnhancedVendorInfo | null>(null);

  useEffect(() => {
    fetchProductDetails(productId).then(setProduct);
  }, [productId]);

  if (!product) return <div>Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 📦 Détails du produit */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-4xl font-bold text-green-600 mb-6">
          {(product.price / 100).toLocaleString('fr-FR')} FCFA
        </p>

        {/* 👤 Profil vendeur détaillé */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">À propos du vendeur</h2>

          <div className="flex items-start space-x-4">
            <img
              src={product.vendor.profile_photo_url || '/default-avatar.png'}
              alt={`${product.vendor.firstName} ${product.vendor.lastName}`}
              className="w-16 h-16 rounded-full"
            />

            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold">
                  {product.vendor.shop_name || `${product.vendor.firstName} ${product.vendor.lastName}`}
                </h3>
                <VendorStatusBadge status={product.vendor.status} />
                {product.vendor.vendeur_type && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {product.vendor.vendeur_type}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Membre depuis</p>
                  <MemberSince createdAt={product.vendor.created_at} variant="exact" />
                </div>

                <div>
                  <p className="text-gray-600">Dernière activité</p>
                  <LastSeen lastLoginAt={product.vendor.last_login_at} />
                </div>

                {product.vendor.country && (
                  <div>
                    <p className="text-gray-600">Localisation</p>
                    <div className="flex items-center">
                      <MapPinIcon className="w-4 h-4 mr-1" />
                      {product.vendor.country}
                    </div>
                  </div>
                )}

                {product.vendor.phone && (
                  <div>
                    <p className="text-gray-600">Contact</p>
                    <div className="flex items-center">
                      <PhoneIcon className="w-4 h-4 mr-1" />
                      {product.vendor.phone}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 3. 🏪 **Produits d'un Vendeur Spécifique**

#### `GET /api/public/vendors/:vendorId/products`

```typescript
// ✅ Appel API
const fetchVendorProducts = async (vendorId: number, options?: {
  limit?: number;
  offset?: number;
  status?: string;
}) => {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());
  if (options?.status) params.set('status', options.status);

  const response = await fetch(`/api/public/vendors/${vendorId}/products?${params}`);
  const data = await response.json();
  return data.data;
};

// 📦 Structure de réponse
interface VendorProductsResponse {
  products: VendorProductWithEnhancedVendorInfo[];
  vendor: EnhancedVendorInfo;  // Infos du vendeur avec dates
  pagination: PaginationInfo;
}

// 💡 Exemple d'usage - Page boutique vendeur
const VendorShopPage = ({ vendorId }: { vendorId: number }) => {
  const [shopData, setShopData] = useState<VendorProductsResponse | null>(null);

  useEffect(() => {
    fetchVendorProducts(vendorId, { limit: 20 }).then(setShopData);
  }, [vendorId]);

  if (!shopData) return <div>Chargement de la boutique...</div>;

  const vendor = shopData.vendor;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 🎭 En-tête de la boutique */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8 mb-8">
        <div className="flex items-center space-x-6">
          <img
            src={vendor.profile_photo_url || '/default-avatar.png'}
            alt={`${vendor.firstName} ${vendor.lastName}`}
            className="w-24 h-24 rounded-full border-4 border-white"
          />

          <div>
            <h1 className="text-4xl font-bold mb-2">
              {vendor.shop_name || `Boutique de ${vendor.firstName}`}
            </h1>
            <p className="text-purple-100 mb-4">
              {vendor.firstName} {vendor.lastName}
            </p>

            <div className="flex items-center space-x-6 text-sm">
              <MemberSince createdAt={vendor.created_at} variant="long" />
              <LastSeen lastLoginAt={vendor.last_login_at} />
              {vendor.country && (
                <span className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {vendor.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 📊 Statistiques de la boutique */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-blue-600">{shopData.products.length}</p>
          <p className="text-gray-600">Produits disponibles</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-green-600">
            {shopData.products.filter(p => p.status === 'PUBLISHED').length}
          </p>
          <p className="text-gray-600">Produits publiés</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-purple-600">
            {formatDistanceToNow(new Date(vendor.created_at), { locale: fr })}
          </p>
          <p className="text-gray-600">d'expérience</p>
        </div>
      </div>

      {/* 🛍️ Produits de la boutique */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shopData.products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
```

### 4. 🔍 **Recherche de Produits avec Infos Vendeur**

#### `GET /api/public/search`

```typescript
// ✅ Appel API de recherche
const searchProducts = async (query: string, filters?: {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  vendorId?: number;
}) => {
  const params = new URLSearchParams();
  params.set('q', query);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.minPrice) params.set('minPrice', filters.minPrice.toString());
  if (filters?.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
  if (filters?.vendorId) params.set('vendorId', filters.vendorId.toString());

  const response = await fetch(`/api/public/search?${params}`);
  const data = await response.json();
  return data.data;
};

// 💡 Exemple d'usage - Page de recherche
const SearchResultsPage = ({ searchQuery }: { searchQuery: string }) => {
  const [results, setResults] = useState<VendorProductWithEnhancedVendorInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const searchResults = await searchProducts(searchQuery);
        setResults(searchResults.products || []);
      } finally {
        setLoading(false);
      }
    };

    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery]);

  if (loading) return <div>Recherche en cours...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Résultats pour "{searchQuery}" ({results.length} produits)
      </h1>

      <div className="space-y-6">
        {results.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-md p-6 flex space-x-6">
            {/* 🖼️ Image produit */}
            <div className="w-32 h-32 bg-gray-200 rounded-lg flex-shrink-0">
              {/* Image du produit */}
            </div>

            <div className="flex-1">
              {/* 📦 Infos produit */}
              <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
              <p className="text-2xl font-bold text-green-600 mb-4">
                {(product.price / 100).toLocaleString('fr-FR')} FCFA
              </p>

              {/* 👤 Infos vendeur dans les résultats */}
              <div className="flex items-center space-x-3">
                <img
                  src={product.vendor.profile_photo_url || '/default-avatar.png'}
                  alt={`${product.vendor.firstName} ${product.vendor.lastName}`}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="font-medium text-sm">
                    {product.vendor.shop_name || `${product.vendor.firstName} ${product.vendor.lastName}`}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <MemberSince createdAt={product.vendor.created_at} variant="short" />
                    {product.vendor.country && (
                      <span className="flex items-center">
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        {product.vendor.country}
                      </span>
                    )}
                    <VendorStatusBadge status={product.vendor.status} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎨 Composants Utilitaires

### 📅 **Hook Personnalisé pour Dates**

```typescript
import { formatDistanceToNow, format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export const useDateFormatting = () => {
  const formatMemberSince = (dateString: string, variant: 'short' | 'long' | 'exact' = 'short') => {
    const date = new Date(dateString);
    if (!isValid(date)) return 'Date invalide';

    switch (variant) {
      case 'short':
        return formatDistanceToNow(date, { addSuffix: true, locale: fr });
      case 'long':
        return `Membre depuis ${formatDistanceToNow(date, { locale: fr })}`;
      case 'exact':
        return format(date, 'dd MMMM yyyy', { locale: fr });
      default:
        return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    }
  };

  const formatLastSeen = (dateString?: string) => {
    if (!dateString) return 'Jamais connecté';

    const date = new Date(dateString);
    if (!isValid(date)) return 'Date invalide';

    return `Vu ${formatDistanceToNow(date, { addSuffix: true, locale: fr })}`;
  };

  return {
    formatMemberSince,
    formatLastSeen
  };
};

// ✅ Utilisation dans un composant
const VendorInfoDisplay = ({ vendor }: { vendor: EnhancedVendorInfo }) => {
  const { formatMemberSince, formatLastSeen } = useDateFormatting();

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600">
        📅 {formatMemberSince(vendor.created_at, 'long')}
      </p>
      <p className="text-sm text-gray-500">
        🕐 {formatLastSeen(vendor.last_login_at)}
      </p>
    </div>
  );
};
```

### 🎯 **Hook pour Récupération de Données Vendeur**

```typescript
import { useState, useEffect } from 'react';

interface UseVendorDataOptions {
  includeProducts?: boolean;
  includeStats?: boolean;
}

export const useVendorData = (vendorId: number, options: UseVendorDataOptions = {}) => {
  const [vendor, setVendor] = useState<EnhancedVendorInfo | null>(null);
  const [products, setProducts] = useState<VendorProductWithEnhancedVendorInfo[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les données de base du vendeur
        const vendorResponse = await fetch(`/api/public/vendors/${vendorId}/products?limit=1`);
        const vendorData = await vendorResponse.json();

        if (vendorData.success && vendorData.data.vendor) {
          setVendor(vendorData.data.vendor);

          // Récupérer les produits si demandé
          if (options.includeProducts) {
            const productsResponse = await fetch(`/api/public/vendors/${vendorId}/products`);
            const productsData = await productsResponse.json();
            if (productsData.success) {
              setProducts(productsData.data.products);
            }
          }

          // Récupérer les stats si demandé
          if (options.includeStats) {
            // Calculer les stats à partir des produits ou d'un endpoint dédié
            const statsData = {
              totalProducts: vendorData.data.products?.length || 0,
              publishedProducts: vendorData.data.products?.filter(p => p.status === 'PUBLISHED').length || 0,
              memberSinceMonths: Math.floor(
                (Date.now() - new Date(vendorData.data.vendor.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
              )
            };
            setStats(statsData);
          }
        } else {
          setError('Vendeur non trouvé');
        }
      } catch (err) {
        setError('Erreur lors de la récupération des données');
        console.error('Erreur useVendorData:', err);
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId, options.includeProducts, options.includeStats]);

  return {
    vendor,
    products,
    stats,
    loading,
    error,
    refetch: () => {
      if (vendorId) {
        // Re-déclencher le useEffect
      }
    }
  };
};

// ✅ Utilisation dans un composant
const VendorProfilePage = ({ vendorId }: { vendorId: number }) => {
  const {
    vendor,
    products,
    stats,
    loading,
    error
  } = useVendorData(vendorId, {
    includeProducts: true,
    includeStats: true
  });

  if (loading) return <VendorProfileSkeleton />;
  if (error) return <ErrorDisplay message={error} />;
  if (!vendor) return <NotFoundDisplay />;

  return (
    <div>
      <VendorProfileHeader vendor={vendor} stats={stats} />
      <VendorProductsGrid products={products} />
    </div>
  );
};
```

## 🚀 Améliorations Futures

### 1. 🔄 **Temps Réel**

```typescript
// WebSocket pour statut en ligne
const useVendorOnlineStatus = (vendorId: number) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Connexion WebSocket pour statut temps réel
    const ws = new WebSocket(`ws://localhost:3000/vendor-status/${vendorId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setIsOnline(data.isOnline);
    };

    return () => ws.close();
  }, [vendorId]);

  return isOnline;
};
```

### 2. 📊 **Analytics Avancées**

```typescript
// Endpoint futur pour analytics vendeur
interface VendorAnalytics {
  viewsLastMonth: number;
  salesLastMonth: number;
  avgResponseTime: number;
  customerSatisfaction: number;
  topProducts: ProductSummary[];
}

const useVendorAnalytics = (vendorId: number) => {
  // Implementation future
};
```

---

✅ **Ce guide vous donne tous les outils nécessaires pour implémenter un affichage riche et informatif des vendeurs dans votre frontend !**