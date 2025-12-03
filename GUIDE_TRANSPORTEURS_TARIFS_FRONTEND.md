# Guide Frontend - Gestion des Transporteurs et Tarifs

Ce guide explique comment intégrer la gestion des transporteurs et des tarifs de livraison dans votre application frontend.

## 📋 Table des Matières

1. [Vue d'ensemble du système](#vue-densemble)
2. [Modèles de données](#modèles-de-données)
3. [API Endpoints](#api-endpoints)
4. [Structure des requêtes/réponses](#structure-des-requêtesréponses)
5. [Cas d'usage pratiques](#cas-dusage-pratiques)
6. [Best practices](#best-practices)
7. [Exemples de code](#exemples-de-code)

## 🎯 Vue d'ensemble

Le système de livraison gère 3 types de zones :
- **Local (Dakar)** : Villes avec tarifs variables (0-2500 XOF)
- **Régional (Sénégal)** : 13 régions avec tarifs fixes (2000-5000 XOF)
- **International** : 6 zones mondiales (15000-35000 XOF)

Chaque transporteur peut opérer sur plusieurs zones avec des tarifs personnalisés.

## 📊 Modèles de Données

### Transporteur (DeliveryTransporteur)
```typescript
interface Transporteur {
  id: string;              // UUID
  name: string;            // Nom du transporteur
  logoUrl?: string;        // URL du logo
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  zones?: DeliveryTransporteurZone[];  // Zones couvertes
  tarifs?: DeliveryZoneTarif[];        // Tarifs associés
}
```

### Tarif de Zone (DeliveryZoneTarif)
```typescript
interface ZoneTarif {
  id: string;
  zoneId: string;                        // Référence à la zone
  zoneName: string;                      // Nom lisible de la zone
  zoneType: 'city' | 'region' | 'international';
  transporteurId: string;
  transporteurName: string;
  prixTransporteur: number;              // Prix de ce transporteur
  prixStandardInternational: number;      // Prix de référence
  delaiLivraisonMin: number;             // Délai minimum (jours)
  delaiLivraisonMax: number;             // Délai maximum (jours)
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
```

### Types de Zones
```typescript
// Ville (Dakar & Banlieue)
interface DeliveryCity {
  id: string;
  name: string;
  category: 'Centre' | 'Résidentiel' | 'Populaire' | 'Banlieue';
  type: 'dakar-ville' | 'banlieue';
  price: number;        // 0-2500 XOF
  deliveryTime: string; // "24-48h", "48-72h"
}

// Région (Sénégal)
interface DeliveryRegion {
  id: string;
  name: string;
  capitalCity: string;
  price: number;        // 2000-5000 XOF
  deliveryDays: number; // 1-7 jours
}

// Zone Internationale
interface DeliveryInternationalZone {
  id: string;
  name: string;
  countries: string[];
  price: number;        // 15000-35000 XOF
  deliveryDays: number; // 5-20 jours
}
```

## 🚀 API Endpoints

### Transporteurs
Base URL: `/api/delivery/transporteurs`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Récupérer tous les transporteurs avec leurs zones |
| GET | `/:id` | Récupérer un transporteur par ID |
| POST | `/` | Créer un nouveau transporteur |
| PUT | `/:id` | Mettre à jour un transporteur |
| DELETE | `/:id` | Supprimer un transporteur |
| PATCH | `/:id/toggle-status` | Activer/Désactiver un transporteur |

### Tarifs de Zone
Base URL: `/api/delivery/zone-tarifs`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Récupérer tous les tarifs |
| GET | `/:id` | Récupérer un tarif par ID |
| POST | `/` | Créer un nouveau tarif |
| PUT | `/:id` | Mettre à jour un tarif |
| DELETE | `/:id` | Supprimer un tarif |
| PATCH | `/:id/toggle-status` | Activer/Désactiver un tarif |

### Calcul de Frais
Base URL: `/api/delivery/calculate-fee`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Calculer les frais de livraison pour une zone |

## 📝 Structure des Requêtes/Réponses

### Créer un Transporteur
```typescript
// POST /api/delivery/transporteurs
const createTransporteur = {
  name: "DHL Express Sénégal",
  logoUrl: "https://example.com/logo.png",
  deliveryZones: ["zone-uuid-1", "zone-uuid-2"], // Optionnel
  status: "active" // Optionnel, défaut: "active"
};

// Réponse
const transporteurResponse = {
  id: "transporteur-uuid",
  name: "DHL Express Sénégal",
  logoUrl: "https://example.com/logo.png",
  status: "active",
  createdAt: "2025-11-26T10:00:00Z",
  updatedAt: "2025-11-26T10:00:00Z"
};
```

### Créer un Tarif de Zone
```typescript
// POST /api/delivery/zone-tarifs
const createTarif = {
  zoneId: "zone-uuid",
  zoneName: "Dakar - Plateau",
  zoneType: "city",
  transporteurId: "transporteur-uuid",
  transporteurName: "DHL Express Sénégal",
  prixTransporteur: 3500,
  prixStandardInternational: 5000,
  delaiLivraisonMin: 1,
  delaiLivraisonMax: 2,
  status: "active" // Optionnel, défaut: "active"
};

// Réponse
const tarifResponse = {
  id: "tarif-uuid",
  zoneId: "zone-uuid",
  zoneName: "Dakar - Plateau",
  zoneType: "city",
  transporteurId: "transporteur-uuid",
  transporteurName: "DHL Express Sénégal",
  prixTransporteur: 3500,
  prixStandardInternational: 5000,
  delaiLivraisonMin: 1,
  delaiLivraisonMax: 2,
  status: "active",
  createdAt: "2025-11-26T10:00:00Z",
  updatedAt: "2025-11-26T10:00:00Z"
};
```

### Calculer les Frais de Livraison
```typescript
// GET /api/delivery/calculate-fee?cityId=uuid OU regionId=uuid OU internationalZoneId=uuid
const feeResponse = {
  fee: 2500,                    // Montant en XOF
  deliveryTime: "24-48 heures", // Délai formaté
  zoneName: "Dakar - Plateau",
  zoneType: "city"
};
```

### Récupérer les Transporteurs avec Zones
```typescript
// GET /api/delivery/transporteurs
const transporteursResponse = {
  data: [
    {
      id: "transporteur-uuid-1",
      name: "DHL Express Sénégal",
      logoUrl: "...",
      status: "active",
      zones: [
        {
          id: "zone-uuid-1",
          name: "Dakar - Plateau",
          type: "city",
          prix: 3500,
          delaiMin: 1,
          delaiMax: 2
        }
      ]
    },
    // ...
  ],
  total: 10,
  page: 1,
  limit: 20
};
```

## 🎯 Cas d'Usage Pratiques

### 1. Page de Configuration des Transporteurs
```typescript
// React Hook pour gérer les transporteurs
const useTransporteurs = () => {
  const [transporteurs, setTransporteurs] = useState<Transporteur[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransporteurs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/delivery/transporteurs');
      const data = await response.json();
      setTransporteurs(data.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTransporteur = async (transporteurData: CreateTransporteurDto) => {
    const response = await fetch('/api/delivery/transporteurs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transporteurData)
    });
    return response.json();
  };

  const toggleStatus = async (id: string) => {
    await fetch(`/api/delivery/transporteurs/${id}/toggle-status`, {
      method: 'PATCH'
    });
    fetchTransporteurs(); // Refresh
  };

  return { transporteurs, loading, fetchTransporteurs, createTransporteur, toggleStatus };
};
```

### 2. Sélecteur de Transporteurs dans le Panier
```typescript
// Component pour choisir le transporteur
const TransporteurSelector = ({ zoneId, onTransporteurSelect }) => {
  const [tarifs, setTarifs] = useState<ZoneTarif[]>([]);

  useEffect(() => {
    // Récupérer les tarifs pour cette zone
    const fetchTarifs = async () => {
      const response = await fetch(`/api/delivery/zone-tarifs?zoneId=${zoneId}`);
      const data = await response.json();
      setTarifs(data.data.filter(t => t.status === 'active'));
    };
    fetchTarifs();
  }, [zoneId]);

  return (
    <div className="transporteur-selector">
      <h3>Choisissez votre transporteur</h3>
      {tarifs.map(tarif => (
        <div key={tarif.id} className="transporteur-option">
          <img src={tarif.transporteurLogo} alt={tarif.transporteurName} />
          <h4>{tarif.transporteurName}</h4>
          <p>{tarif.prixTransporteur} XOF</p>
          <p>Livraison: {tarif.delaiLivraisonMin}-{tarif.delaiLivraisonMax} jours</p>
          <button onClick={() => onTransporteurSelect(tarif)}>
            Sélectionner
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 3. Calcul Dynamique des Frais
```typescript
// Service de calcul des frais de livraison
class DeliveryService {
  static async calculateShippingFee(address: AddressData): Promise<ShippingInfo> {
    // Détecter le type de zone et récupérer l'ID
    let zoneParam = '';

    if (address.isDakarCity) {
      // Rechercher dans les villes
      const cities = await this.fetchCities();
      const city = cities.find(c => c.name.toLowerCase() === address.city.toLowerCase());
      zoneParam = `cityId=${city?.id}`;
    } else if (address.isSenegalRegion) {
      // Rechercher dans les régions
      const regions = await this.fetchRegions();
      const region = regions.find(r => r.name.toLowerCase() === address.region.toLowerCase());
      zoneParam = `regionId=${region?.id}`;
    } else {
      // Zone internationale
      const zones = await this.fetchInternationalZones();
      const zone = zones.find(z => z.countries.includes(address.country));
      zoneParam = `internationalZoneId=${zone?.id}`;
    }

    // Appeler l'API de calcul
    const response = await fetch(`/api/delivery/calculate-fee?${zoneParam}`);
    return response.json();
  }

  private static async fetchCities() {
    const response = await fetch('/api/delivery/cities');
    return response.json();
  }

  private static async fetchRegions() {
    const response = await fetch('/api/delivery/regions');
    return response.json();
  }

  private static async fetchInternationalZones() {
    const response = await fetch('/api/delivery/international-zones');
    return response.json();
  }
}
```

### 4. Interface d'Administration des Tarifs
```typescript
// Tableau de bord pour gérer les tarifs
const TarifManagement = () => {
  const [tarifs, setTarifs] = useState<ZoneTarif[]>([]);
  const [selectedTransporteur, setSelectedTransporteur] = useState<string>('');

  const updateTarif = async (id: string, updates: Partial<ZoneTarif>) => {
    const response = await fetch(`/api/delivery/zone-tarifs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (response.ok) {
      setTarifs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  const columns = [
    { header: 'Transporteur', accessor: 'transporteurName' },
    { header: 'Zone', accessor: 'zoneName' },
    { header: 'Prix (XOF)', accessor: 'prixTransporteur' },
    { header: 'Délai (jours)', accessor: 'delaiLivraisonMin' },
    { header: 'Statut', accessor: 'status' },
    { header: 'Actions', accessor: 'actions' }
  ];

  return (
    <div>
      <h2>Gestion des Tarifs</h2>

      {/* Filtres */}
      <div className="filters">
        <select
          value={selectedTransporteur}
          onChange={(e) => setSelectedTransporteur(e.target.value)}
        >
          <option value="">Tous les transporteurs</option>
          {/* Options des transporteurs */}
        </select>
      </div>

      {/* Tableau des tarifs */}
      <Table
        columns={columns}
        data={tarifs}
        onEdit={updateTarif}
        onToggleStatus={toggleTarifStatus}
      />
    </div>
  );
};
```

## ✅ Best Practices

### 1. Gestion des Erreurs
```typescript
const handleApiCall = async (apiCall: () => Promise<any>) => {
  try {
    const response = await apiCall();
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur API');
    }
    return response.json();
  } catch (error) {
    // Gestion centralisée des erreurs
    console.error('API Error:', error);
    // Afficher une notification à l'utilisateur
    showNotification(error.message, 'error');
    throw error;
  }
};
```

### 2. Validation Côté Client
```typescript
const validateTransporteurForm = (data: CreateTransporteurDto): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('Le nom du transporteur est requis');
  }

  if (data.name?.length > 100) {
    errors.push('Le nom ne doit pas dépasser 100 caractères');
  }

  if (data.logoUrl && !isValidUrl(data.logoUrl)) {
    errors.push('L\'URL du logo est invalide');
  }

  return errors;
};
```

### 3. Optimisation des Performances
```typescript
// Utilisation de React Query pour le cache
const useTransporteurs = () => {
  return useQuery({
    queryKey: ['transporteurs'],
    queryFn: async () => {
      const response = await fetch('/api/delivery/transporteurs');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000  // 10 minutes
  });
};

// Débouncing pour la recherche
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
```

### 4. Types TypeScript Sécurisés
```typescript
// Types forts pour éviter les erreurs
type ZoneType = 'city' | 'region' | 'international';
type TransporteurStatus = 'active' | 'inactive';

interface ApiError {
  message: string;
  statusCode: number;
  error: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Utilisation des types génériques
const apiCall = async <T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  const response = await fetch(url, options);
  return response.json();
};
```

### 5. États de Chargement
```typescript
const useAsyncOperation = <T>() => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (operation: () => Promise<T>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
};
```

## 🔧 Configuration Requise

### Variables d'Environnement Frontend
```env
# API Backend URL
REACT_APP_API_URL=http://localhost:3000/api

# Configuration du transporteur par défaut
REACT_APP_DEFAULT_TRANSPORTEUR_UUID=transporteur-uuid

# Limite de résultats par page
REACT_APP_PAGINATION_LIMIT=20

# Timeout des requêtes (ms)
REACT_APP_API_TIMEOUT=10000
```

### Axios Configuration
```typescript
// api/axiosInstance.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour le token d'authentification
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Rediriger vers la page de connexion
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 📚 Ressources Additionnelles

### Documentation API Swagger
- URL: `http://localhost:3000/api-docs`
- Consultez la documentation interactive pour tester les endpoints

### Tests Postman Collection
- Importez la collection `/docs/postman/delivery-api.postman_collection.json`
- Tests complets pour tous les endpoints

### Support
- Pour toute question technique : équipe backend
- Pour les bugs : créer une issue dans le repository du projet

---

*Mis à jour le 26 novembre 2025*