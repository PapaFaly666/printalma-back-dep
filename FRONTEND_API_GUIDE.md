# 🚀 Guide API Frontend - Système de Meilleures Ventes PrintAlma

## 📋 Table des Matières

1. [Configuration de Base](#configuration-de-base)
2. [Endpoints Publics](#endpoints-publics)
3. [Endpoints Administrateur](#endpoints-administrateur)
4. [Codes d'Erreur](#codes-derreur)
5. [Exemples d'Intégration](#exemples-dintégration)
6. [Gestion du Cache](#gestion-du-cache)
7. [Bonnes Pratiques](#bonnes-pratiques)

---

## 🔧 Configuration de Base

### URL de Base
```
https://votre-domaine.com/api
```

### Headers Requis
```javascript
const headers = {
  'Content-Type': 'application/json',
  // Pour les endpoints admin uniquement
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
};
```

### Format de Réponse Standard
Toutes les réponses suivent ce format :
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats?: {
    totalBestSellers: number;
    totalRevenue: number;
    averageOrderValue: number;
    periodAnalyzed: string;
  };
  cacheInfo?: {
    cached: boolean;
    cacheAge: number;
  };
  message?: string;
  error?: string;
}
```

---

## 🌐 Endpoints Publics

### 1. 📊 Meilleures Ventes Principales

**Endpoint:** `GET /best-sellers`

**Description:** Récupère les meilleures ventes avec filtres avancés

**Paramètres de Requête:**
```typescript
interface BestSellersQuery {
  period?: 'day' | 'week' | 'month' | 'all';  // Période d'analyse
  limit?: number;                              // Nombre de résultats (défaut: 10, max: 100)
  offset?: number;                             // Pagination (défaut: 0)
  vendorId?: number;                           // Filtrer par vendeur spécifique
  categoryId?: number;                         // Filtrer par catégorie
  minSales?: number;                           // Ventes minimum requises (défaut: 1)
}
```

**Exemple de Requête:**
```javascript
// Meilleures ventes du mois (top 20)
const response = await fetch('/api/best-sellers?period=month&limit=20');

// Meilleures ventes d'un vendeur spécifique
const response = await fetch('/api/best-sellers?vendorId=123&period=week&limit=15');

// Meilleures ventes avec pagination
const response = await fetch('/api/best-sellers?period=all&limit=10&offset=20');
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "name": "T-Shirt Personnalisé PrintAlma",
      "description": "T-shirt de qualité premium avec impression personnalisée",
      "price": 29.99,
      "totalQuantitySold": 150,
      "totalRevenue": 4498.50,
      "averageUnitPrice": 29.99,
      "uniqueCustomers": 89,
      "firstSaleDate": "2024-01-15T10:30:00Z",
      "lastSaleDate": "2024-03-20T14:45:00Z",
      "rank": 1,
      "vendor": {
        "id": 123,
        "name": "Jean Dupont",
        "shopName": "Boutique Créative",
        "profilePhotoUrl": "https://res.cloudinary.com/.../profile.jpg"
      },
      "baseProduct": {
        "id": 789,
        "name": "T-Shirt Premium",
        "categories": ["Vêtements", "Personnalisation", "Coton Bio"]
      },
      "design": {
        "id": 234,
        "name": "Design Moderne",
        "cloudinaryUrl": "https://res.cloudinary.com/.../design.jpg"
      },
      "mainImage": "https://res.cloudinary.com/.../product.jpg"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "totalBestSellers": 45,
    "totalRevenue": 125000.75,
    "averageOrderValue": 89.50,
    "periodAnalyzed": "30 derniers jours"
  },
  "cacheInfo": {
    "cached": false,
    "cacheAge": 0
  }
}
```

### 2. 📈 Statistiques Rapides

**Endpoint:** `GET /best-sellers/stats`

**Description:** Récupère un aperçu rapide des statistiques des meilleures ventes

**Paramètres:** Aucun

**Exemple de Requête:**
```javascript
const response = await fetch('/api/best-sellers/stats');
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 45,
    "totalRevenue": 125000.75,
    "averageOrderValue": 89.50,
    "topVendors": [
      {
        "id": 123,
        "name": "Jean Dupont",
        "totalSales": 25000.00,
        "productCount": 8
      }
    ],
    "topCategories": [
      {
        "name": "Vêtements",
        "totalSales": 45000.00,
        "productCount": 15
      }
    ],
    "periods": {
      "day": { "totalSales": 1250.00, "productCount": 12 },
      "week": { "totalSales": 8750.00, "productCount": 28 },
      "month": { "totalSales": 125000.75, "productCount": 45 }
    }
  }
}
```

### 3. 🏪 Meilleures Ventes par Vendeur

**Endpoint:** `GET /best-sellers/vendor/:vendorId`

**Description:** Récupère les meilleures ventes d'un vendeur spécifique

**Paramètres de Requête:**
```typescript
interface VendorBestSellersQuery {
  period?: 'day' | 'week' | 'month' | 'all';
  limit?: number;
}
```

**Exemple de Requête:**
```javascript
const response = await fetch('/api/best-sellers/vendor/123?period=month&limit=10');
```

**Réponse:** Même format que l'endpoint principal, mais filtré pour le vendeur spécifique

### 4. 📊 Analyse des Tendances

**Endpoint:** `GET /best-sellers/trends`

**Description:** Fournit une analyse des tendances et des produits émergents

**Paramètres:** Aucun

**Exemple de Requête:**
```javascript
const response = await fetch('/api/best-sellers/trends');
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "risingProducts": [
      {
        "id": 789,
        "name": "Mug Personnalisé",
        "growthRate": 45.2,
        "previousRank": 15,
        "currentRank": 8
      }
    ],
    "consistentSellers": [
      {
        "id": 456,
        "name": "T-Shirt Premium",
        "stabilityScore": 0.95,
        "averageRank": 2.3
      }
    ],
    "emergingTrends": [
      {
        "category": "Accessoires",
        "growthRate": 32.1,
        "productCount": 12
      }
    ],
    "topPerformers": {
      "bestRevenue": { "id": 123, "name": "Produit A", "revenue": 15000.00 },
      "bestVolume": { "id": 456, "name": "Produit B", "quantity": 500 },
      "bestGrowth": { "id": 789, "name": "Produit C", "growth": 67.8 }
    }
  }
}
```

---

## 🔐 Endpoints Administrateur

**⚠️ Attention:** Tous ces endpoints nécessitent un token JWT valide dans le header `Authorization`

### 1. 🎛️ Tableau de Bord Administrateur

**Endpoint:** `GET /admin/best-sellers/dashboard`

**Headers:**
```javascript
{
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

**Exemple de Requête:**
```javascript
const response = await fetch('/api/admin/best-sellers/dashboard', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProducts": 45,
      "totalRevenue": 125000.75,
      "totalOrders": 1500,
      "averageOrderValue": 89.50
    },
    "performance": {
      "topProducts": [...],
      "topVendors": [...],
      "categoryPerformance": [...],
      "recentActivity": [...]
    },
    "systemHealth": {
      "cacheSize": 15,
      "lastUpdate": "2024-03-20T15:30:00Z",
      "recommendations": [
        "Considérer l'ajout d'index sur la table OrderItem",
        "Le cache est bien optimisé"
      ]
    }
  }
}
```

### 2. 🔄 Recalcul des Statistiques

**Endpoint:** `POST /admin/best-sellers/recalculate-all`

**Body:**
```json
{
  "force": false,
  "notifyOnComplete": true
}
```

**Exemple de Requête:**
```javascript
const response = await fetch('/api/admin/best-sellers/recalculate-all', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    force: false,
    notifyOnComplete: true
  })
});
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "message": "Recalcul des statistiques lancé",
    "estimatedDuration": "2-3 minutes",
    "affectedProducts": 45,
    "affectedOrders": 1500
  }
}
```

### 3. 🏷️ Marquage des Meilleurs Vendeurs

**Endpoint:** `POST /admin/best-sellers/mark-best-sellers`

**Body:**
```json
{
  "period": "month",
  "minSales": 5,
  "limit": 50
}
```

**Exemple de Requête:**
```javascript
const response = await fetch('/api/admin/best-sellers/mark-best-sellers', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    period: "month",
    minSales: 5,
    limit: 50
  })
});
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "message": "50 produits marqués comme best-sellers",
    "period": "month",
    "criteria": {
      "minSales": 5,
      "limit": 50
    },
    "results": {
      "markedProducts": 50,
      "topRevenue": 15000.00,
      "topSales": 500
    }
  }
}
```

### 4. 📊 Statistiques du Cache

**Endpoint:** `GET /admin/best-sellers/cache/stats`

**Exemple de Requête:**
```javascript
const response = await fetch('/api/admin/best-sellers/cache/stats', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "cacheSize": 15,
    "keys": [
      "best-sellers:month:10:0:all:all:1",
      "best-sellers:week:20:0:all:all:1"
    ],
    "memoryUsage": "2.3 MB",
    "hitRate": 0.85
  }
}
```

### 5. 🗑️ Nettoyage du Cache

**Endpoint:** `POST /admin/best-sellers/cache/clear`

**Exemple de Requête:**
```javascript
const response = await fetch('/api/admin/best-sellers/cache/clear', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "message": "Cache vidé avec succès",
    "clearedEntries": 15,
    "freedMemory": "2.3 MB"
  }
}
```

### 6. 📋 Rapport de Performance

**Endpoint:** `GET /admin/best-sellers/reports/performance`

**Paramètres de Requête:**
```typescript
interface PerformanceReportQuery {
  period?: 'day' | 'week' | 'month' | 'all';
  vendorId?: number;
}
```

**Exemple de Requête:**
```javascript
const response = await fetch('/api/admin/best-sellers/reports/performance?period=month&vendorId=123', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
});
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "period": "month",
      "totalRevenue": 125000.75,
      "totalOrders": 1500,
      "averageOrderValue": 89.50
    },
    "topPerformers": {
      "products": [...],
      "vendors": [...],
      "categories": [...]
    },
    "trends": {
      "growth": 12.5,
      "seasonality": "stable",
      "predictions": [...]
    },
    "recommendations": [
      "Augmenter la visibilité des produits de la catégorie 'Accessoires'",
      "Considérer des promotions pour les produits en baisse"
    ]
  }
}
```

---

## ❌ Codes d'Erreur

### Codes HTTP Communs

| Code | Signification | Description |
|------|---------------|-------------|
| `200` | OK | Requête réussie |
| `201` | Created | Ressource créée avec succès |
| `400` | Bad Request | Paramètres invalides ou manquants |
| `401` | Unauthorized | Token JWT manquant ou invalide |
| `403` | Forbidden | Accès refusé (droits insuffisants) |
| `404` | Not Found | Endpoint ou ressource introuvable |
| `429` | Too Many Requests | Limite de taux dépassée |
| `500` | Internal Server Error | Erreur serveur interne |

### Messages d'Erreur

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Le paramètre 'period' doit être l'une des valeurs: day, week, month, all",
  "details": {
    "field": "period",
    "value": "invalid_period",
    "allowedValues": ["day", "week", "month", "all"]
  }
}
```

---

## 💻 Exemples d'Intégration

### 1. 🎯 Composant React - Liste des Meilleures Ventes

```jsx
import React, { useState, useEffect } from 'react';

const BestSellersList = () => {
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [page, setPage] = useState(1);

  const fetchBestSellers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/best-sellers?period=${period}&limit=10&offset=${(page - 1) * 10}`
      );
      const data = await response.json();
      
      if (data.success) {
        setBestSellers(data.data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBestSellers();
  }, [period, page]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setPage(1);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="best-sellers">
      <div className="filters">
        <select value={period} onChange={(e) => handlePeriodChange(e.target.value)}>
          <option value="day">Dernières 24h</option>
          <option value="week">7 derniers jours</option>
          <option value="month">30 derniers jours</option>
          <option value="all">Tout le temps</option>
        </select>
      </div>

      <div className="products-grid">
        {bestSellers.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.mainImage} alt={product.name} />
            <h3>{product.name}</h3>
            <p className="vendor">{product.vendor.name}</p>
            <p className="price">{product.price}€</p>
            <p className="sales">Vendus: {product.totalQuantitySold}</p>
            <p className="rank">#{product.rank}</p>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button 
          disabled={page === 1} 
          onClick={() => setPage(page - 1)}
        >
          Précédent
        </button>
        <span>Page {page}</span>
        <button 
          onClick={() => setPage(page + 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default BestSellersList;
```

### 2. 📊 Composant Vue.js - Statistiques

```vue
<template>
  <div class="stats-dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Revenus Totaux</h3>
        <p class="value">{{ formatCurrency(stats.totalRevenue) }}</p>
        <p class="period">{{ stats.periodAnalyzed }}</p>
      </div>
      
      <div class="stat-card">
        <h3>Produits</h3>
        <p class="value">{{ stats.totalBestSellers }}</p>
        <p class="label">Meilleurs vendeurs</p>
      </div>
      
      <div class="stat-card">
        <h3>Panier Moyen</h3>
        <p class="value">{{ formatCurrency(stats.averageOrderValue) }}</p>
        <p class="label">Par commande</p>
      </div>
    </div>

    <div class="trends-section">
      <h3>Tendances</h3>
      <div class="trends-grid">
        <div 
          v-for="trend in trends" 
          :key="trend.category"
          class="trend-item"
        >
          <span class="category">{{ trend.category }}</span>
          <span class="growth" :class="trend.growthRate > 0 ? 'positive' : 'negative'">
            {{ trend.growthRate > 0 ? '+' : '' }}{{ trend.growthRate }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      stats: {},
      trends: [],
      loading: true
    };
  },
  
  async mounted() {
    await this.fetchStats();
    await this.fetchTrends();
  },
  
  methods: {
    async fetchStats() {
      try {
        const response = await fetch('/api/best-sellers/stats');
        const data = await response.json();
        if (data.success) {
          this.stats = data.data;
        }
      } catch (error) {
        console.error('Erreur stats:', error);
      }
    },
    
    async fetchTrends() {
      try {
        const response = await fetch('/api/best-sellers/trends');
        const data = await response.json();
        if (data.success) {
          this.trends = data.data.emergingTrends;
        }
      } catch (error) {
        console.error('Erreur tendances:', error);
      } finally {
        this.loading = false;
      }
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    }
  }
};
</script>
```

### 3. 🎨 Composant Angular - Filtres Avancés

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Component({
  selector: 'app-best-sellers-filters',
  template: `
    <div class="filters-container">
      <div class="filter-group">
        <label>Période:</label>
        <select [(ngModel)]="filters.period" (change)="applyFilters()">
          <option value="day">Dernières 24h</option>
          <option value="week">7 derniers jours</option>
          <option value="month">30 derniers jours</option>
          <option value="all">Tout le temps</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Vendeur:</label>
        <select [(ngModel)]="filters.vendorId" (change)="applyFilters()">
          <option value="">Tous les vendeurs</option>
          <option *ngFor="let vendor of vendors" [value]="vendor.id">
            {{ vendor.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Catégorie:</label>
        <select [(ngModel)]="filters.categoryId" (change)="applyFilters()">
          <option value="">Toutes les catégories</option>
          <option *ngFor="let category of categories" [value]="category.id">
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Ventes minimum:</label>
        <input 
          type="number" 
          [(ngModel)]="filters.minSales" 
          (change)="applyFilters()"
          min="1"
        />
      </div>

      <div class="filter-group">
        <label>Résultats par page:</label>
        <select [(ngModel)]="filters.limit" (change)="applyFilters()">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </div>
    </div>
  `
})
export class BestSellersFiltersComponent implements OnInit {
  filters = {
    period: 'month',
    vendorId: null,
    categoryId: null,
    minSales: 1,
    limit: 10
  };

  vendors = [];
  categories = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadVendors();
    this.loadCategories();
  }

  async loadVendors() {
    try {
      const response = await this.http.get('/api/vendors').toPromise();
      this.vendors = response['data'] || [];
    } catch (error) {
      console.error('Erreur chargement vendeurs:', error);
    }
  }

  async loadCategories() {
    try {
      const response = await this.http.get('/api/categories').toPromise();
      this.categories = response['data'] || [];
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    }
  }

  applyFilters() {
    // Émettre un événement pour notifier le composant parent
    this.filtersChange.emit(this.filters);
  }
}
```

---

## 🗄️ Gestion du Cache

### Informations de Cache

Chaque réponse inclut des informations sur le cache :

```json
{
  "cacheInfo": {
    "cached": true,
    "cacheAge": 300000  // Âge en millisecondes
  }
}
```

### Stratégies de Cache

1. **Cache Automatique** : Le serveur met en cache automatiquement les résultats
2. **Invalidation Intelligente** : Le cache est invalidé lors des mises à jour
3. **Durée de Vie** : 10 minutes par défaut
4. **Limite de Taille** : Maximum 100 entrées

### Optimisations Frontend

```javascript
// Vérifier si les données sont en cache
if (response.cacheInfo?.cached) {
  console.log(`Données en cache depuis ${response.cacheInfo.cacheAge}ms`);
}

// Afficher l'âge des données
const cacheAgeMinutes = Math.floor(response.cacheInfo?.cacheAge / 60000);
if (cacheAgeMinutes > 0) {
  console.log(`Données mises à jour il y a ${cacheAgeMinutes} minutes`);
}
```

---

## ✅ Bonnes Pratiques

### 1. 🚀 Performance

- **Pagination** : Utilisez toujours la pagination pour les grandes listes
- **Limites** : Respectez les limites de requête (max 100 par page)
- **Cache** : Exploitez les informations de cache pour optimiser l'UX
- **Lazy Loading** : Chargez les données à la demande

### 2. 🔄 Gestion d'État

- **État Local** : Gardez les filtres et la pagination en état local
- **Synchronisation** : Synchronisez l'état avec l'URL pour la navigation
- **Persistance** : Sauvegardez les préférences utilisateur

### 3. 🎨 Interface Utilisateur

- **Chargement** : Affichez des indicateurs de chargement
- **Erreurs** : Gérez gracieusement les erreurs avec des messages clairs
- **Vide** : Affichez des états vides appropriés
- **Responsive** : Adaptez l'interface aux différentes tailles d'écran

### 4. 🔒 Sécurité

- **Validation** : Validez les paramètres côté client
- **Sanitisation** : Échappez les données affichées
- **Rate Limiting** : Respectez les limites de taux
- **Authentification** : Utilisez les tokens JWT pour les endpoints admin

### 5. 📱 Accessibilité

- **ARIA** : Utilisez les attributs ARIA appropriés
- **Navigation** : Supportez la navigation au clavier
- **Contraste** : Assurez un bon contraste des couleurs
- **Lecteurs d'écran** : Testez avec des lecteurs d'écran

---

## 🧪 Tests et Développement

### Endpoint de Test

```javascript
// Vérifier la santé de l'API
const healthCheck = async () => {
  try {
    const response = await fetch('/api/best-sellers/stats');
    if (response.ok) {
      console.log('✅ API opérationnelle');
    } else {
      console.log('❌ API en erreur:', response.status);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error);
  }
};
```

### Mode Développement

```javascript
// Activer les logs détaillés en développement
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Mode développement activé');
  console.log('📊 Filtres appliqués:', filters);
  console.log('📦 Données reçues:', response);
}
```

---

## 📞 Support et Contact

Pour toute question ou problème avec l'API :

- **Documentation Technique** : Consultez ce guide
- **Tests d'Intégration** : Utilisez le script `test-best-sellers-implementation.js`
- **Support Développeur** : Contactez l'équipe backend
- **Issues** : Reportez les bugs via le système de tickets

---

**🎉 Félicitations !** Vous êtes maintenant prêt à intégrer le système de meilleures ventes PrintAlma dans votre application frontend.

N'hésitez pas à consulter les exemples de code et à adapter les composants selon vos besoins spécifiques. L'API est conçue pour être flexible et performante ! 🚀

---

## 🛍️ Endpoint Produits Vendeurs (Vendor Products)

### GET `/public/vendor-products`

**Description :** Récupère la liste complète des produits vendeurs avec filtres avancés, y compris le nouveau filtre par nom de produit admin.

#### Paramètres de Requête

| Paramètre | Type | Description | Exemple | Requis |
|-----------|------|-------------|---------|---------|
| `limit` | number | Nombre max de produits (max 100) | `20` | Non |
| `offset` | number | Pagination - produits à sauter | `0` | Non |
| `search` | string | Recherche textuelle globale | `"chemise"` | Non |
| `vendorId` | number | ID du vendeur spécifique | `123` | Non |
| `category` | string | Nom de la catégorie | `"Vêtements"` | Non |
| `adminProductName` | string | **NOUVEAU** - Nom du produit admin (mockup) | `"Tshirt"` | Non |
| `minPrice` | number | Prix minimum | `10.00` | Non |
| `maxPrice` | number | Prix maximum | `100.00` | Non |
| `allProducts` | boolean | `false` = uniquement les best-sellers | `true` | Non |

#### 🆕 Filtre `adminProductName`

Ce filtre permet de rechercher des produits en se basant sur le nom du produit de base (mockup/admin) associé.

**Caractéristiques :**
- **Recherche insensible à la casse**
- **Recherche partielle (contient)**
- **Filtre sur le champ `adminProduct.name`**

**Exemples d'utilisation :**
```javascript
// Rechercher tous les Tshirts
const tshirts = await fetch('/public/vendor-products?adminProductName=Tshirt');

// Combiner avec d'autres filtres
const polosChers = await fetch('/public/vendor-products?adminProductName=Polos&minPrice=50');

// Recherche avancée
const chemisesBleues = await fetch('/public/vendor-products?adminProductName=Chemise&search=bleu');
```

#### Structure de la réponse

```json
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": [
    {
      "id": 1,
      "vendorId": 123,
      "baseProductId": 456,
      "price": 29.99,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "vendor": {
        "id": 123,
        "name": "Jean Dupont",
        "email": "jean@example.com",
        "shopName": "Boutique Créative"
      },
      "adminProduct": {
        "id": 456,
        "name": "Tshirt Premium",
        "slug": "tshirt-premium",
        "description": "T-shirt de haute qualité",
        "imageUrls": ["url1.jpg", "url2.jpg"],
        "category": {
          "id": 1,
          "name": "Vêtements",
          "slug": "vetements"
        },
        "subCategory": {
          "id": 2,
          "name": "Tshirts",
          "slug": "tshirts"
        },
        "variation": {
          "id": 3,
          "name": "Col V",
          "slug": "col-v"
        }
      },
      "_count": {
        "reviews": 15,
        "orders": 42
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true,
    "totalPages": 8,
    "currentPage": 1
  }
}
```

#### 📁 Affichage des Catégories Disponibles

Pour afficher les catégories disponibles dans le frontend :

**Approche 1 : Extraire des produits existants**
```javascript
async function getAvailableCategories() {
  const response = await fetch('/public/vendor-products?limit=100');
  const data = await response.json();

  if (!data.success) return [];

  // Extraire les catégories uniques
  const categories = [...new Set(
    data.data
      .map(product => product.adminProduct?.category?.name)
      .filter(Boolean)
  )];

  return categories;
}
```

**Approche 2 : Filtrer par catégorie spécifique**
```javascript
async function getProductsByCategory(categoryName) {
  const response = await fetch(
    `/public/vendor-products?category=${encodeURIComponent(categoryName)}`
  );
  return await response.json();
}

// Exemple d'utilisation
const vetementsProducts = await getProductsByCategory('Vêtements');
```

#### 🎯 Exemples d'Intégration Frontend

**React Hook personnalisé :**
```javascript
function useVendorProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  const fetchProducts = async (newFilters = {}) => {
    setLoading(true);

    const params = new URLSearchParams({
      limit: '20',
      offset: '0',
      ...filters,
      ...newFilters
    });

    try {
      const response = await fetch(`/public/vendor-products?${params}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, pagination, fetchProducts };
}

// Utilisation dans un composant
function ProductList() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productNameFilter, setProductNameFilter] = useState('');
  const { products, loading, fetchProducts } = useVendorProducts();

  useEffect(() => {
    fetchProducts({
      category: selectedCategory,
      adminProductName: productNameFilter
    });
  }, [selectedCategory, productNameFilter]);

  return (
    <div>
      {/* Filtres */}
      <select onChange={(e) => setSelectedCategory(e.target.value)}>
        <option value="">Toutes les catégories</option>
        <option value="Vêtements">Vêtements</option>
        <option value="Accessoires">Accessoires</option>
      </select>

      <input
        type="text"
        placeholder="Rechercher par nom de produit..."
        value={productNameFilter}
        onChange={(e) => setProductNameFilter(e.target.value)}
      />

      {/* Liste des produits */}
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Tests avec curl :**
```bash
# Test du filtre adminProductName
curl "http://localhost:3000/public/vendor-products?adminProductName=Tshirt"

# Test combiné avec recherche
curl "http://localhost:3000/public/vendor-products?adminProductName=Polos&search=bleu"

# Test avec filtre de prix
curl "http://localhost:3000/public/vendor-products?adminProductName=Chemise&minPrice=20&maxPrice=100"
```

#### 🎨 Composant Vue.js pour les filtres

```vue
<template>
  <div class="product-filters">
    <div class="filter-group">
      <label>Nom du produit admin:</label>
      <input
        v-model="filters.adminProductName"
        @input="applyFilters"
        placeholder="Ex: Tshirt, Polo, Chemise..."
      />
    </div>

    <div class="filter-group">
      <label>Catégorie:</label>
      <select v-model="filters.category" @change="applyFilters">
        <option value="">Toutes les catégories</option>
        <option v-for="category in categories" :key="category" :value="category">
          {{ category }}
        </option>
      </select>
    </div>

    <div class="filter-group">
      <label>Prix:</label>
      <div class="price-range">
        <input
          type="number"
          v-model="filters.minPrice"
          @change="applyFilters"
          placeholder="Min"
        />
        <span>-</span>
        <input
          type="number"
          v-model="filters.maxPrice"
          @change="applyFilters"
          placeholder="Max"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      filters: {
        adminProductName: '',
        category: '',
        minPrice: null,
        maxPrice: null
      },
      categories: []
    };
  },

  async mounted() {
    await this.loadCategories();
  },

  methods: {
    async loadCategories() {
      try {
        const response = await fetch('/public/vendor-products?limit=100');
        const data = await response.json();

        if (data.success) {
          this.categories = [...new Set(
            data.data
              .map(product => product.adminProduct?.category?.name)
              .filter(Boolean)
          )];
        }
      } catch (error) {
        console.error('Erreur chargement catégories:', error);
      }
    },

    applyFilters() {
      this.$emit('filters-changed', this.filters);
    }
  }
};
</script>
```

Cette nouvelle section complète parfaitement la documentation existante pour aider les développeurs frontend à intégrer l'endpoint des produits vendeurs avec le nouveau filtre `adminProductName`. 