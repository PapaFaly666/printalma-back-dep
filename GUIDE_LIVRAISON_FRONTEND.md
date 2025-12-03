# 🚚 Guide Frontend - Gestion de la Livraison PrintAlma

> **Guide complet pour l'intégration des fonctionnalités de livraison dans l'application frontend**

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration initiale](#configuration-initiale)
3. [Types de livraison](#types-de-livraison)
4. [Endpoints API](#endpoints-api)
5. [Intégration pas à pas](#intégration-pas-à-pas)
6. [Exemples de code](#exemples-de-code)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Best practices](#best-practices)
9. [Testing](#testing)

---

## 🎯 Vue d'ensemble

Le système de livraison PrintAlma couvre 3 zones géographiques principales :

### 📍 **Zones de Livraison**
- **Dakar et Banlieue** : 27 villes avec tarification différenciée
- **Régions du Sénégal** : 13 régions
- **International** : 6 zones couvrant 29 pays

### 💰 **Structure des tarifs**
- **Dakar Ville** : 0 - 2500 FCFA
- **Banlieue** : 1500 - 2500 FCFA
- **Régions** : 2000 - 5000 FCFA
- **International** : 15000 - 35000 FCFA

---

## ⚙️ Configuration initiale

### 1. **Base URL**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
```

### 2. **Headers requis**
```typescript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`, // Si authentification requise
};
```

### 3. **Types TypeScript**
```typescript
// Types principaux
interface DeliveryCity {
  id: string;
  name: string;
  category: 'Centre' | 'Résidentiel' | 'Populaire' | 'Banlieue';
  zoneType: 'dakar-ville' | 'banlieue';
  price: number;
  status: 'active' | 'inactive';
}

interface DeliveryRegion {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
}

interface InternationalZone {
  id: string;
  name: string;
  price: number;
  countries: string[];
  status: 'active' | 'inactive';
}

interface DeliveryResponse {
  fee: number;
  deliveryTime: string;
}
```

---

## 🗺️ Types de livraison

### 1. **Villes de Dakar et Banlieue**
**Route**: `GET /delivery/cities`

```typescript
// Exemple de response
{
  "data": [
    {
      "id": "city-1",
      "name": "Plateau",
      "category": "Centre",
      "zoneType": "dakar-ville",
      "price": 0,
      "status": "active"
    },
    {
      "id": "city-2",
      "name": "Almadies",
      "category": "Résidentiel",
      "zoneType": "dakar-ville",
      "price": 2500,
      "status": "active"
    }
  ]
}
```

### 2. **Régions du Sénégal**
**Route**: `GET /delivery/regions`

```typescript
// Exemple de response
{
  "data": [
    {
      "id": "region-1",
      "name": "Saint-Louis",
      "price": 2200,
      "status": "active"
    },
    {
      "id": "region-2",
      "name": "Ziguinchor",
      "price": 5000,
      "status": "active"
    }
  ]
}
```

### 3. **Zones Internationales**
**Route**: `GET /delivery/international-zones`

```typescript
// Exemple de response
{
  "data": [
    {
      "id": "zone-intl-1",
      "name": "Afrique de l'Ouest",
      "price": 15000,
      "countries": ["Mali", "Mauritanie", "Guinée", "Côte d'Ivoire"],
      "status": "active"
    }
  ]
}
```

---

## 🔌 Endpoints API

### **1. Récupération des données**
```typescript
// Villes
GET /delivery/cities?zoneType=dakar-ville|banlieue
GET /delivery/cities/:id

// Régions
GET /delivery/regions
GET /delivery/regions/:id

// Zones internationales
GET /delivery/international-zones
GET /delivery/international-zones/:id

// Transporteurs
GET /delivery/transporteurs
GET /delivery/transporteurs/:id
```

### **2. Calcul des frais**
```typescript
// Calcul frais - UN SEUL PARAMÈRE À LA FOIS
GET /delivery/calculate-fee?cityId=:cityId
GET /delivery/calculate-fee?regionId=:regionId
GET /delivery/calculate-fee?internationalZoneId=:zoneId
```

### **3. Format des réponses**
```typescript
// Succès
{
  "success": true,
  "data": [...],
  "message": "Opération réussie"
}

// Erreur
{
  "success": false,
  "message": "Message d'erreur détaillé",
  "error": "ERROR_CODE"
}
```

---

## 📝 Intégration pas à pas

### **Étape 1: Création du service de livraison**

```typescript
// src/services/deliveryService.ts
class DeliveryService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getCities(zoneType?: 'dakar-ville' | 'banlieue'): Promise<DeliveryCity[]> {
    const url = zoneType
      ? `${this.baseUrl}/delivery/cities?zoneType=${zoneType}`
      : `${this.baseUrl}/delivery/cities`;

    const response = await fetch(url, { headers });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  async getRegions(): Promise<DeliveryRegion[]> {
    const response = await fetch(`${this.baseUrl}/delivery/regions`, { headers });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  async getInternationalZones(): Promise<InternationalZone[]> {
    const response = await fetch(`${this.baseUrl}/delivery/international-zones`, { headers });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }

  async calculateDeliveryFee(params: {
    cityId?: string;
    regionId?: string;
    internationalZoneId?: string;
  }): Promise<DeliveryResponse> {
    const queryParams = new URLSearchParams();

    // Un seul paramètre doit être fourni
    if (params.cityId) {
      queryParams.append('cityId', params.cityId);
    } else if (params.regionId) {
      queryParams.append('regionId', params.regionId);
    } else if (params.internationalZoneId) {
      queryParams.append('internationalZoneId', params.internationalZoneId);
    } else {
      throw new Error('Un paramètre de livraison est requis');
    }

    const response = await fetch(
      `${this.baseUrl}/delivery/calculate-fee?${queryParams}`,
      { headers }
    );

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    return result.data;
  }
}

export const deliveryService = new DeliveryService(API_BASE_URL);
```

### **Étape 2: Composant de sélection de livraison**

```typescript
// src/components/DeliverySelector.tsx
import React, { useState, useEffect } from 'react';
import { deliveryService } from '../services/deliveryService';

interface DeliverySelectorProps {
  onDeliveryChange: (deliveryInfo: {
    type: 'city' | 'region' | 'international';
    id: string;
    fee: number;
    deliveryTime: string;
  }) => void;
}

export const DeliverySelector: React.FC<DeliverySelectorProps> = ({
  onDeliveryChange
}) => {
  const [deliveryType, setDeliveryType] = useState<'city' | 'region' | 'international'>('city');
  const [cities, setCities] = useState<DeliveryCity[]>([]);
  const [regions, setRegions] = useState<DeliveryRegion[]>([]);
  const [internationalZones, setInternationalZones] = useState<InternationalZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDeliveryData();
  }, []);

  useEffect(() => {
    if (selectedZone) {
      calculateDeliveryFee();
    }
  }, [selectedZone, deliveryType]);

  const loadDeliveryData = async () => {
    try {
      setLoading(true);
      const [citiesData, regionsData, zonesData] = await Promise.all([
        deliveryService.getCities(),
        deliveryService.getRegions(),
        deliveryService.getInternationalZones()
      ]);

      setCities(citiesData);
      setRegions(regionsData);
      setInternationalZones(zonesData);
    } catch (error) {
      console.error('Erreur chargement données livraison:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDeliveryFee = async () => {
    if (!selectedZone) return;

    try {
      const params =
        deliveryType === 'city' ? { cityId: selectedZone } :
        deliveryType === 'region' ? { regionId: selectedZone } :
        { internationalZoneId: selectedZone };

      const deliveryInfo = await deliveryService.calculateDeliveryFee(params);

      onDeliveryChange({
        type: deliveryType,
        id: selectedZone,
        fee: deliveryInfo.fee,
        deliveryTime: deliveryInfo.deliveryTime
      });
    } catch (error) {
      console.error('Erreur calcul frais livraison:', error);
    }
  };

  const renderZoneOptions = () => {
    if (deliveryType === 'city') {
      const dakarCities = cities.filter(c => c.zoneType === 'dakar-ville');
      const banlieueCities = cities.filter(c => c.zoneType === 'banlieue');

      return (
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Sélectionner une ville...</option>

          <optgroup label="Dakar Ville">
            {dakarCities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name} - {city.price === 0 ? 'Gratuit' : `${city.price} FCFA`}
              </option>
            ))}
          </optgroup>

          <optgroup label="Banlieue">
            {banlieueCities.map(city => (
              <option key={city.id} value={city.id}>
                {city.name} - {city.price} FCFA
              </option>
            ))}
          </optgroup>
        </select>
      );
    }

    if (deliveryType === 'region') {
      return (
        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">Sélectionner une région...</option>
          {regions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name} - {region.price} FCFA
            </option>
          ))}
        </select>
      );
    }

    return (
      <select
        value={selectedZone}
        onChange={(e) => setSelectedZone(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Sélectionner une zone internationale...</option>
        {internationalZones.map(zone => (
          <option key={zone.id} value={zone.id}>
            {zone.name} - {zone.price} FCFA
            <br />
            <small>Pays: {zone.countries.join(', ')}</small>
          </option>
        ))}
      </select>
    );
  };

  if (loading) {
    return <div>Chargement des options de livraison...</div>;
  }

  return (
    <div className="delivery-selector space-y-4">
      <h3 className="text-lg font-semibold">Options de livraison</h3>

      <div className="delivery-type-selector space-x-4">
        <label>
          <input
            type="radio"
            value="city"
            checked={deliveryType === 'city'}
            onChange={(e) => setDeliveryType(e.target.value as any)}
          />
          Dakar et Banlieue
        </label>

        <label>
          <input
            type="radio"
            value="region"
            checked={deliveryType === 'region'}
            onChange={(e) => setDeliveryType(e.target.value as any)}
          />
          Autres régions
        </label>

        <label>
          <input
            type="radio"
            value="international"
            checked={deliveryType === 'international'}
            onChange={(e) => setDeliveryType(e.target.value as any)}
          />
          International
        </label>
      </div>

      <div className="zone-selection">
        {renderZoneOptions()}
      </div>
    </div>
  );
};
```

### **Étape 3: Intégration dans le panier**

```typescript
// src/components/CartSummary.tsx
import React, { useState } from 'react';
import { DeliverySelector } from './DeliverySelector';

export const CartSummary: React.FC = () => {
  const [subtotal, setSubtotal] = useState(10000); // Exemple
  const [deliveryInfo, setDeliveryInfo] = useState<{
    type: 'city' | 'region' | 'international';
    id: string;
    fee: number;
    deliveryTime: string;
  } | null>(null);

  const total = subtotal + (deliveryInfo?.fee || 0);

  const handleDeliveryChange = (delivery: typeof deliveryInfo) => {
    setDeliveryInfo(delivery);
  };

  const handleCheckout = () => {
    if (!deliveryInfo) {
      alert('Veuillez sélectionner une option de livraison');
      return;
    }

    // Envoyer les données au backend pour créer la commande
    createOrder({
      subtotal,
      deliveryFee: deliveryInfo.fee,
      deliveryType: deliveryInfo.type,
      deliveryZoneId: deliveryInfo.id,
      total
    });
  };

  return (
    <div className="cart-summary">
      <h2>Résumé de la commande</h2>

      <div className="cart-items">
        {/* Items du panier */}
        <div>Sous-total: {subtotal} FCFA</div>
      </div>

      <DeliverySelector onDeliveryChange={handleDeliveryChange} />

      {deliveryInfo && (
        <div className="delivery-summary">
          <h4>Livraison sélectionnée:</h4>
          <p>Frais: {deliveryInfo.fee} FCFA</p>
          <p>Délai: {deliveryInfo.deliveryTime}</p>
        </div>
      )}

      <div className="cart-total">
        <h3>Total: {total} FCFA</h3>
      </div>

      <button
        onClick={handleCheckout}
        className="checkout-button"
        disabled={!deliveryInfo}
      >
        Valider la commande
      </button>
    </div>
  );
};
```

---

## 🛠️ Exemples de code avancés

### **Hook personnalisé pour la livraison**

```typescript
// src/hooks/useDelivery.ts
import { useState, useEffect } from 'react';
import { deliveryService } from '../services/deliveryService';

export const useDelivery = () => {
  const [cities, setCities] = useState<DeliveryCity[]>([]);
  const [regions, setRegions] = useState<DeliveryRegion[]>([]);
  const [internationalZones, setInternationalZones] = useState<InternationalZone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [citiesData, regionsData, zonesData] = await Promise.all([
        deliveryService.getCities(),
        deliveryService.getRegions(),
        deliveryService.getInternationalZones()
      ]);

      setCities(citiesData);
      setRegions(regionsData);
      setInternationalZones(zonesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const calculateFee = async (params: {
    cityId?: string;
    regionId?: string;
    internationalZoneId?: string;
  }) => {
    try {
      return await deliveryService.calculateDeliveryFee(params);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de calcul');
      throw err;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    cities,
    regions,
    internationalZones,
    loading,
    error,
    calculateFee,
    refreshData: loadData
  };
};
```

### **Gestion du cache avec localStorage**

```typescript
// src/services/deliveryCacheService.ts
class DeliveryCacheService {
  private readonly CACHE_KEY = 'delivery_data';
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24h

  async getCachedDeliveryData() {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      // Vérifier si le cache est expiré
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  setCacheData(data: any) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch {
      // Ignorer les erreurs de localStorage
    }
  }

  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
  }
}

export const deliveryCache = new DeliveryCacheService();
```

---

## ⚠️ Gestion des erreurs

### **Erreurs courantes**

```typescript
// Validation des erreurs
const handleDeliveryError = (error: any) => {
  switch (error.message) {
    case 'Un seul paramètre de livraison doit être fourni':
      return 'Veuillez sélectionner une seule option de livraison';

    case 'Zone de livraison non trouvée':
      return 'Cette zone de livraison n\'est pas disponible';

    case 'Aucun paramètre de livraison fourni':
      return 'Veuillez choisir une option de livraison';

    default:
      return 'Erreur lors du calcul des frais de livraison';
  }
};
```

### **Composant d'erreur**

```typescript
// src/components/DeliveryError.tsx
interface DeliveryErrorProps {
  error: string;
  onRetry?: () => void;
}

export const DeliveryError: React.FC<DeliveryErrorProps> = ({ error, onRetry }) => (
  <div className="delivery-error bg-red-50 border border-red-200 p-4 rounded">
    <div className="flex items-center">
      <span className="text-red-600 mr-2">⚠️</span>
      <span className="text-red-700">{error}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Réessayer
      </button>
    )}
  </div>
);
```

---

## ✅ Best practices

### **1. Validation côté client**
```typescript
const validateDeliverySelection = (deliveryType: string, selectedZone: string) => {
  if (!selectedZone) {
    throw new Error('Veuillez sélectionner une zone de livraison');
  }

  if (!['city', 'region', 'international'].includes(deliveryType)) {
    throw new Error('Type de livraison invalide');
  }
};
```

### **2. Loading states**
```typescript
// Afficher des états de chargement appropriés
{loading && <div className="loading-spinner">Calcul des frais...</div>}
```

### **3. Accessibilité**
```typescript
// Labels ARIA pour les formulaires
<select
  aria-label="Sélectionner la ville de livraison"
  aria-describedby="delivery-help"
>
```

### **4. Performance**
```typescript
// Utiliser React.memo pour éviter les re-rendus inutiles
export const DeliveryOptions = React.memo<DeliveryOptionsProps>(({ options }) => {
  // Component logic
});
```

---

## 🧪 Testing

### **Tests unitaires (Jest)**

```typescript
// __tests__/deliveryService.test.ts
import { deliveryService } from '../src/services/deliveryService';

describe('DeliveryService', () => {
  test('calculates city delivery fee correctly', async () => {
    const result = await deliveryService.calculateDeliveryFee({
      cityId: 'test-city-id'
    });

    expect(result.fee).toBeGreaterThan(0);
    expect(result.deliveryTime).toBeDefined();
  });

  test('throws error for missing parameters', async () => {
    await expect(deliveryService.calculateDeliveryFee({}))
      .rejects.toThrow('Un paramètre de livraison est requis');
  });
});
```

### **Tests E2E (Cypress)**

```typescript
// cypress/integration/delivery.spec.ts
describe('Delivery Selection', () => {
  it('should calculate delivery fee for Dakar city', () => {
    cy.visit('/cart');

    cy.get('[data-testid="delivery-type-city"]').click();
    cy.get('[data-testid="city-selector"]').select('Plateau');

    cy.get('[data-testid="delivery-fee"]').should('contain', '0 FCFA');
  });

  it('should update total when delivery changes', () => {
    cy.visit('/cart');

    const initialTotal = cy.get('[data-testid="cart-total"]');

    cy.get('[data-testid="delivery-type-region"]').click();
    cy.get('[data-testid="region-selector"]').select('Saint-Louis');

    cy.get('[data-testid="cart-total"]').should('not.equal', initialTotal);
  });
});
```

---

## 🔧 Débogage

### **Console logs utiles**
```typescript
// Pour le débogage en développement
if (process.env.NODE_ENV === 'development') {
  console.log('Delivery calculation params:', params);
  console.log('Delivery response:', result);
}
```

### **Monitoring des performances**
```typescript
// Mesurer le temps de réponse des APIs
const startTime = performance.now();
await deliveryService.calculateDeliveryFee(params);
const endTime = performance.now();

console.log(`API call took ${endTime - startTime} milliseconds`);
```

---

## 📞 Support

Pour toute question ou problème lié à l'intégration de la livraison :

1. **Vérifier la documentation API** : `http://localhost:3004/api-docs`
2. **Consulter les logs** du backend pour les erreurs détaillées
3. **Tester les endpoints** directement avec Postman ou curl

### **Exemple curl pour tester**
```bash
# Test calcul frais livraison
curl "http://localhost:3004/delivery/calculate-fee?cityId=city-1" \
  -H "Content-Type: application/json"
```

---

## 📝 Checklist d'intégration

- [ ] Configuration du service de livraison
- [ ] Types TypeScript définis
- [ ] Gestion des états de chargement
- [ ] Gestion des erreurs
- [ ] Interface utilisateur responsive
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Accessibilité (ARIA labels)
- [ ] Performance optimisée
- [ ] Documentation du code

---

**Fini !** 🎉

Vous avez maintenant tous les éléments nécessaires pour intégrer le système de livraison PrintAlma dans votre application frontend. Ce guide couvre tous les cas d'usage et les bonnes pratiques pour une intégration robuste.