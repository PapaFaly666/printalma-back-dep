# 📋 Guide Frontend : Affichage des Informations Vendeurs

## 🎯 Vue d'ensemble

Ce guide vous aide à implémenter l'affichage complet des informations vendeurs dans le frontend, incluant la dernière connexion, la date d'inscription, et le statut du compte.

## 📊 Données Vendeur Disponibles

### 🔑 Champs Principaux (Base de données)

```typescript
interface VendeurComplet {
  // 👤 Identité de base
  id: number;
  firstName: string;
  lastName: string;
  email: string;

  // 🏪 Informations boutique
  shop_name?: string;
  profile_photo_url?: string;
  phone?: string;
  country?: string;
  address?: string;

  // 📅 Dates importantes
  created_at: string;        // 📅 "Membre depuis"
  updated_at: string;        // 🔄 Dernière modification profil
  last_login_at?: string;    // 🕐 "Dernière connexion"

  // ⚡ Statut et sécurité
  status: boolean;           // ✅ Compte actif/désactivé
  role: 'VENDEUR' | 'ADMIN' | 'SUPERADMIN';
  vendeur_type?: 'INDIVIDUEL' | 'ENTREPRISE';
  login_attempts: number;    // 🔒 Tentatives de connexion
  locked_until?: string;     // 🚫 Verrouillage temporaire

  // 🎨 Compteurs d'activité
  totalProducts?: number;     // 📦 Nombre de produits
  publishedProducts?: number; // 🌐 Produits publiés
  totalDesigns?: number;      // 🎨 Nombre de designs
  totalEarnings?: number;     // 💰 Gains totaux
}
```

## 🌐 APIs Disponibles pour Récupérer les Données

### 1. 🔍 **Liste de Tous les Vendeurs (Admin)**

```typescript
// GET /api/vendor-products/admin/vendors
interface VendorsListResponse {
  success: boolean;
  data: {
    vendors: VendeurComplet[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
    };
    stats: {
      active: number;      // Vendeurs actifs
      inactive: number;    // Vendeurs désactivés
      withProducts: number;
      withoutProducts: number;
    };
  };
}

// ✅ Exemple d'utilisation
const fetchVendors = async (page = 1, search = '') => {
  const response = await fetch(`/api/vendor-products/admin/vendors?page=${page}&search=${search}`);
  const data: VendorsListResponse = await response.json();
  return data.data.vendors;
};
```

### 2. 👤 **Détails d'un Vendeur Spécifique**

```typescript
// GET /api/vendor-products/admin/vendors/:vendorId
interface VendorDetailResponse {
  success: boolean;
  data: VendeurComplet;
}

// ✅ Exemple d'utilisation
const fetchVendorDetails = async (vendorId: number) => {
  const response = await fetch(`/api/vendor-products/admin/vendors/${vendorId}`);
  const data: VendorDetailResponse = await response.json();
  return data.data;
};
```

### 3. 🛍️ **Produits d'un Vendeur avec Infos Vendeur**

```typescript
// GET /api/public/vendors/:vendorId/products
interface VendorProductsResponse {
  success: boolean;
  data: {
    products: VendorProduct[];
    vendor: VendeurComplet;  // ✅ Informations vendeur incluses
    pagination: PaginationInfo;
  };
}
```

## 🎨 Composants Frontend Recommandés

### 1. 📅 **Composant "Membre Depuis"**

```tsx
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MemberSinceProps {
  createdAt: string;
  variant?: 'short' | 'long' | 'exact';
}

const MemberSince: React.FC<MemberSinceProps> = ({ createdAt, variant = 'short' }) => {
  const date = new Date(createdAt);

  const formatDate = () => {
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

  return (
    <span className="text-sm text-gray-600 flex items-center">
      <CalendarIcon className="w-4 h-4 mr-1" />
      {formatDate()}
    </span>
  );
};

// ✅ Exemples d'utilisation
<MemberSince createdAt="2023-01-15T10:30:00Z" variant="short" />
// Affiche: "il y a 1 an"

<MemberSince createdAt="2023-01-15T10:30:00Z" variant="long" />
// Affiche: "Membre depuis 1 an"

<MemberSince createdAt="2023-01-15T10:30:00Z" variant="exact" />
// Affiche: "15 janvier 2023"
```

### 2. 🕐 **Composant "Dernière Connexion"**

```tsx
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface LastSeenProps {
  lastLoginAt?: string;
  isOnline?: boolean;
}

const LastSeen: React.FC<LastSeenProps> = ({ lastLoginAt, isOnline }) => {
  if (isOnline) {
    return (
      <span className="text-sm text-green-600 flex items-center">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        En ligne
      </span>
    );
  }

  if (!lastLoginAt) {
    return (
      <span className="text-sm text-gray-400">
        Jamais connecté
      </span>
    );
  }

  const lastLogin = new Date(lastLoginAt);
  const timeAgo = formatDistanceToNow(lastLogin, { addSuffix: true, locale: fr });

  return (
    <span className="text-sm text-gray-500 flex items-center">
      <ClockIcon className="w-4 h-4 mr-1" />
      Vu {timeAgo}
    </span>
  );
};

// ✅ Exemples d'utilisation
<LastSeen lastLoginAt="2024-01-15T14:30:00Z" />
// Affiche: "Vu il y a 3 heures"

<LastSeen isOnline={true} />
// Affiche: "🟢 En ligne"

<LastSeen lastLoginAt={null} />
// Affiche: "Jamais connecté"
```

### 3. 🏪 **Carte Vendeur Complète**

```tsx
interface VendorCardProps {
  vendor: VendeurComplet;
  showStats?: boolean;
  showContactInfo?: boolean;
}

const VendorCard: React.FC<VendorCardProps> = ({
  vendor,
  showStats = true,
  showContactInfo = false
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      {/* 👤 En-tête vendeur */}
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={vendor.profile_photo_url || '/default-avatar.png'}
          alt={`${vendor.firstName} ${vendor.lastName}`}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">
              {vendor.firstName} {vendor.lastName}
            </h3>
            <VendorStatusBadge status={vendor.status} />
          </div>

          {vendor.shop_name && (
            <p className="text-sm text-gray-600">🏪 {vendor.shop_name}</p>
          )}

          <div className="flex items-center space-x-4 mt-2">
            <MemberSince createdAt={vendor.created_at} variant="short" />
            <LastSeen lastLoginAt={vendor.last_login_at} />
          </div>
        </div>
      </div>

      {/* 📍 Informations de localisation */}
      {vendor.country && (
        <div className="flex items-center space-x-2 mb-3">
          <MapPinIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{vendor.country}</span>
        </div>
      )}

      {/* 📊 Statistiques d'activité */}
      {showStats && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{vendor.totalProducts || 0}</p>
            <p className="text-xs text-gray-500">Produits</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{vendor.totalDesigns || 0}</p>
            <p className="text-xs text-gray-500">Designs</p>
          </div>
        </div>
      )}

      {/* 📞 Informations de contact (Admin seulement) */}
      {showContactInfo && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center space-x-2">
            <EnvelopeIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{vendor.email}</span>
          </div>
          {vendor.phone && (
            <div className="flex items-center space-x-2">
              <PhoneIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{vendor.phone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 4. 🎯 **Badge de Statut Vendeur**

```tsx
interface VendorStatusBadgeProps {
  status: boolean;
  locked_until?: string;
}

const VendorStatusBadge: React.FC<VendorStatusBadgeProps> = ({ status, locked_until }) => {
  const isLocked = locked_until && new Date(locked_until) > new Date();

  if (isLocked) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        🔒 Verrouillé
      </span>
    );
  }

  if (status) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✅ Actif
      </span>
    );
  } else {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        ❌ Désactivé
      </span>
    );
  }
};
```

## 💡 Conseils d'Implémentation

### 1. 🎨 **Design Patterns Recommandés**

```tsx
// ✅ Utiliser des interfaces TypeScript strictes
interface VendorDisplayData {
  vendor: VendeurComplet;
  context: 'admin' | 'public' | 'profile';
  permissions: UserPermissions;
}

// ✅ Composants modulaires et réutilisables
const VendorInfoSections = {
  BasicInfo: VendorBasicInfo,
  ContactInfo: VendorContactInfo,
  ActivityStats: VendorActivityStats,
  TimeInfo: VendorTimeInfo,
  StatusInfo: VendorStatusInfo,
};

// ✅ Hooks personnalisés pour la logique
const useVendorData = (vendorId: number) => {
  const [vendor, setVendor] = useState<VendeurComplet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorDetails(vendorId)
      .then(setVendor)
      .finally(() => setLoading(false));
  }, [vendorId]);

  return { vendor, loading };
};
```

### 2. 🔄 **Gestion des États**

```tsx
// ✅ État de chargement avec skeleton
const VendorSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-300 rounded w-32"></div>
        <div className="h-3 bg-gray-300 rounded w-24"></div>
      </div>
    </div>
  </div>
);

// ✅ Gestion des erreurs
const VendorError = ({ error }: { error: string }) => (
  <div className="text-red-600 p-4 border border-red-200 rounded">
    ❌ Erreur: {error}
  </div>
);
```

### 3. 📱 **Responsive Design**

```tsx
// ✅ Affichage adaptatif selon la taille d'écran
const ResponsiveVendorCard = ({ vendor }: { vendor: VendeurComplet }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      {/* Mobile: Stack vertical */}
      <div className="md:flex md:items-center md:space-x-4">
        <img
          className="w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto md:mx-0 mb-3 md:mb-0"
          src={vendor.profile_photo_url || '/default-avatar.png'}
          alt={`${vendor.firstName} ${vendor.lastName}`}
        />

        <div className="text-center md:text-left flex-1">
          <h3 className="font-semibold text-sm md:text-lg">
            {vendor.firstName} {vendor.lastName}
          </h3>

          {/* Desktop: Horizontal, Mobile: Vertical */}
          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mt-2 space-y-1 md:space-y-0">
            <MemberSince createdAt={vendor.created_at} variant="short" />
            <LastSeen lastLoginAt={vendor.last_login_at} />
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 🌟 Exemples d'Usage Complets

### 1. 📋 **Page Liste des Vendeurs (Admin)**

```tsx
const VendorsListPage = () => {
  const [vendors, setVendors] = useState<VendeurComplet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchVendors(1, '')
      .then(setVendors)
      .finally(() => setLoading(false));
  }, [filter]);

  const filteredVendors = vendors.filter(vendor => {
    if (filter === 'active') return vendor.status;
    if (filter === 'inactive') return !vendor.status;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 🎛️ Filtres */}
      <div className="flex space-x-4">
        {['all', 'active', 'inactive'].map(filterOption => (
          <button
            key={filterOption}
            className={`px-4 py-2 rounded ${filter === filterOption ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setFilter(filterOption as any)}
          >
            {filterOption === 'all' ? 'Tous' : filterOption === 'active' ? 'Actifs' : 'Désactivés'}
          </button>
        ))}
      </div>

      {/* 📋 Liste des vendeurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <VendorSkeleton key={i} />)
        ) : (
          filteredVendors.map(vendor => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              showStats={true}
              showContactInfo={true}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

### 2. 🏪 **Profil Vendeur Public**

```tsx
const PublicVendorProfile = ({ vendorId }: { vendorId: number }) => {
  const { vendor, loading } = useVendorData(vendorId);

  if (loading) return <VendorSkeleton />;
  if (!vendor) return <VendorError error="Vendeur introuvable" />;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 🎭 En-tête du profil */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg">
        <div className="flex items-center space-x-6">
          <img
            src={vendor.profile_photo_url || '/default-avatar.png'}
            alt={`${vendor.firstName} ${vendor.lastName}`}
            className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
          />
          <div>
            <h1 className="text-3xl font-bold">{vendor.shop_name || `${vendor.firstName} ${vendor.lastName}`}</h1>
            <p className="text-blue-100 mt-2">
              {vendor.firstName} {vendor.lastName}
            </p>

            <div className="flex items-center space-x-6 mt-4">
              <MemberSince createdAt={vendor.created_at} variant="long" />
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

      {/* 📊 Statistiques publiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-blue-600">{vendor.totalProducts || 0}</p>
          <p className="text-gray-600">Produits disponibles</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-green-600">{vendor.publishedProducts || 0}</p>
          <p className="text-gray-600">Produits publiés</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-3xl font-bold text-purple-600">{vendor.totalDesigns || 0}</p>
          <p className="text-gray-600">Designs créés</p>
        </div>
      </div>

      {/* 🛍️ Produits du vendeur */}
      <VendorProductsGrid vendorId={vendorId} />
    </div>
  );
};
```

## 🚀 Prochaines Étapes

1. **Intégrer les composants** dans vos pages existantes
2. **Tester l'affichage** avec différents types de vendeurs
3. **Adapter les styles** à votre design system
4. **Ajouter des animations** pour améliorer l'UX
5. **Implémenter la recherche** et les filtres avancés

## 🔗 APIs Complémentaires

Pour des informations encore plus détaillées, vous pouvez aussi utiliser :

- `GET /api/vendor-products/vendor/stats` - Statistiques détaillées vendeur
- `GET /api/designs/vendor/by-status` - Designs par statut de validation
- `GET /api/vendor-funds/vendor/stats` - Informations financières vendeur

---

**💡 Conseil :** Gardez toujours à l'esprit que les vendeurs désactivés peuvent encore avoir leurs produits et designs visibles publiquement grâce à la modification récente !