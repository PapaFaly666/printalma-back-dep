# 🏆 Guide Frontend - Meilleures Ventes (Données Réelles)

## 📋 Vue d'ensemble

Ce guide explique comment intégrer et afficher les **vraies meilleures ventes** basées sur les données réelles de commande dans votre application frontend. Cette approche analyse les commandes livrées pour calculer les produits les plus vendus.

## 🚀 Nouveau Endpoint Principal

```
GET /public/real-best-sellers
```

**URL de base :** `http://localhost:3004/public/real-best-sellers`

## 🔧 Paramètres de Requête

| Paramètre | Type | Requis | Description | Défaut | Exemple |
|-----------|------|--------|-------------|---------|---------|
| `period` | string | ❌ | Période d'analyse | `all` | `month` |
| `limit` | number | ❌ | Nombre de produits à récupérer | `10` | `20` |
| `offset` | number | ❌ | Décalage pour pagination | `0` | `10` |
| `vendorId` | number | ❌ | Filtrer par vendeur spécifique | - | `5` |
| `categoryId` | number | ❌ | Filtrer par catégorie | - | `2` |
| `minSales` | number | ❌ | Ventes minimum requises | `1` | `5` |

### Périodes Supportées
- `day` : Dernières 24 heures
- `week` : 7 derniers jours
- `month` : 30 derniers jours  
- `year` : 365 derniers jours
- `all` : Depuis le début (défaut)

## 📊 Structure de la Réponse

### Réponse Succès (200)
```json
{
  "success": true,
  "message": "Meilleures ventes récupérées (période: month)",
  "data": {
    "bestSellers": [
      {
        "id": 1,
        "vendorProductId": 1,
        "productName": "T-shirt Design Unique",
        "vendorName": "John Doe",
        "businessName": "Boutique John",
        "totalQuantitySold": 45,
        "totalRevenue": 112500,
        "averageUnitPrice": 2500,
        "firstSaleDate": "2024-01-15T10:30:00Z",
        "lastSaleDate": "2024-02-10T14:22:00Z",
        "uniqueCustomers": 32,
        "productImage": "https://example.com/product1.jpg",
        "category": "Vêtements, T-shirts",
        "vendorId": 5,
        "baseProductId": 2,
        "rank": 1
      },
      {
        "id": 2,
        "vendorProductId": 2,
        "productName": "Mug Personnalisé",
        "vendorName": "Marie Martin",
        "businessName": "Créations Marie",
        "totalQuantitySold": 38,
        "totalRevenue": 57000,
        "averageUnitPrice": 1500,
        "firstSaleDate": "2024-01-20T09:15:00Z",
        "lastSaleDate": "2024-02-09T16:45:00Z",
        "uniqueCustomers": 28,
        "productImage": "https://example.com/product2.jpg",
        "category": "Accessoires, Mugs",
        "vendorId": 8,
        "baseProductId": 3,
        "rank": 2
      }
    ],
    "pagination": {
      "total": 25,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    },
    "stats": {
      "totalProducts": 25,
      "totalRevenue": 1250000,
      "totalQuantitySold": 500,
      "period": "month",
      "dateRange": {
        "from": "2024-01-10T00:00:00Z",
        "to": "2024-02-10T23:59:59Z"
      }
    }
  },
  "meta": {
    "executionTime": "45ms",
    "queryOptions": {
      "period": "month",
      "limit": 10,
      "offset": 0,
      "minSales": 1
    }
  }
}
```

## 🎯 Cas d'Usage Frontend

### 1. Récupération Simple
```typescript
interface RealBestSellerProduct {
  id: number;
  vendorProductId: number;
  productName: string;
  vendorName: string;
  businessName?: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  firstSaleDate: string;
  lastSaleDate: string;
  uniqueCustomers: number;
  productImage?: string;
  category: string;
  vendorId: number;
  baseProductId: number;
  rank: number;
}

interface BestSellersResponse {
  success: boolean;
  message: string;
  data: {
    bestSellers: RealBestSellerProduct[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    stats: {
      totalProducts: number;
      totalRevenue: number;
      totalQuantitySold: number;
      period: string;
      dateRange: {
        from: string;
        to: string;
      };
    };
  };
  meta: {
    executionTime: string;
    queryOptions: any;
  };
}

// Fonction de base
const fetchRealBestSellers = async (
  period: 'day' | 'week' | 'month' | 'year' | 'all' = 'all'
): Promise<RealBestSellerProduct[]> => {
  try {
    const response = await fetch(
      `http://localhost:3004/public/real-best-sellers?period=${period}`
    );
    const data: BestSellersResponse = await response.json();
    
    if (data.success) {
      return data.data.bestSellers;
    }
    throw new Error(data.message);
  } catch (error) {
    console.error('Erreur récupération meilleures ventes:', error);
    return [];
  }
};
```

### 2. Avec Filtres Avancés
```typescript
interface BestSellersFilters {
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: number;
  offset?: number;
  vendorId?: number;
  categoryId?: number;
  minSales?: number;
}

const fetchRealBestSellersAdvanced = async (
  filters: BestSellersFilters = {}
): Promise<BestSellersResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters.period) params.append('period', filters.period);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.vendorId) params.append('vendorId', filters.vendorId.toString());
    if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters.minSales) params.append('minSales', filters.minSales.toString());

    const url = `http://localhost:3004/public/real-best-sellers?${params.toString()}`;
    const response = await fetch(url);
    const data: BestSellersResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }
    
    return data;
  } catch (error) {
    console.error('Erreur récupération meilleures ventes avancée:', error);
    throw error;
  }
};
```

### 3. Hook React Personnalisé
```typescript
import { useState, useEffect } from 'react';

interface UseBestSellersOptions extends BestSellersFilters {
  autoRefresh?: boolean;
  refreshInterval?: number; // en millisecondes
}

export const useRealBestSellers = (options: UseBestSellersOptions = {}) => {
  const [data, setData] = useState<BestSellersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchRealBestSellersAdvanced(options);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh si activé
    if (options.autoRefresh && options.refreshInterval) {
      const interval = setInterval(fetchData, options.refreshInterval);
      return () => clearInterval(interval);
    }
  }, [
    options.period,
    options.vendorId,
    options.categoryId,
    options.limit,
    options.offset,
    options.minSales
  ]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    bestSellers: data?.data.bestSellers || [],
    stats: data?.data.stats,
    pagination: data?.data.pagination
  };
};
```

## 🎨 Composants React Recommandés

### 1. Composant Principal avec Filtres
```tsx
import React, { useState } from 'react';
import { useRealBestSellers } from './hooks/useRealBestSellers';

const RealBestSellersList: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  const [limit, setLimit] = useState(10);
  const [minSales, setMinSales] = useState(1);

  const { bestSellers, loading, error, stats, refresh } = useRealBestSellers({
    period,
    limit,
    minSales,
    autoRefresh: true,
    refreshInterval: 5 * 60 * 1000 // 5 minutes
  });

  if (loading) return <BestSellersLoading />;
  if (error) return <BestSellersError error={error} onRetry={refresh} />;

  return (
    <div className="real-best-sellers-container">
      {/* Filtres */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="period">Période d'analyse</label>
          <select 
            id="period" 
            value={period} 
            onChange={(e) => setPeriod(e.target.value as any)}
            className="period-select"
          >
            <option value="day">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="all">Tout le temps</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="limit">Nombre de résultats</label>
          <select 
            id="limit" 
            value={limit} 
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="limit-select"
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="minSales">Ventes minimum</label>
          <input 
            id="minSales"
            type="number" 
            value={minSales} 
            onChange={(e) => setMinSales(parseInt(e.target.value) || 1)}
            min="1"
            className="min-sales-input"
          />
        </div>

        <button onClick={refresh} className="refresh-btn">
          🔄 Actualiser
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-number">{stats.totalProducts}</div>
            <div className="stat-label">Produits vendus</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalQuantitySold}</div>
            <div className="stat-label">Unités vendues</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalRevenue.toLocaleString()} FCFA</div>
            <div className="stat-label">Chiffre d'affaires</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{period}</div>
            <div className="stat-label">Période</div>
          </div>
        </div>
      )}

      {/* Liste des meilleures ventes */}
      <div className="best-sellers-header">
        <h2>🏆 Top {bestSellers.length} des Meilleures Ventes</h2>
        <p className="subtitle">Basé sur les commandes réellement livrées</p>
      </div>

      <div className="best-sellers-grid">
        {bestSellers.map((product) => (
          <RealBestSellerCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};
```

### 2. Carte de Produit Améliorée
```tsx
const RealBestSellerCard: React.FC<{ product: RealBestSellerProduct }> = ({ product }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  };

  return (
    <div className="real-best-seller-card">
      {/* Badge de rang */}
      <div className={`rank-badge ${getRankBadgeClass(product.rank)}`}>
        #{product.rank}
      </div>
      
      {/* Image du produit */}
      <div className="product-image">
        {product.productImage ? (
          <img 
            src={product.productImage} 
            alt={product.productName}
            className="product-img"
            loading="lazy"
          />
        ) : (
          <div className="no-image-placeholder">
            <span>📦</span>
            <p>Pas d'image</p>
          </div>
        )}
      </div>
      
      {/* Informations principales */}
      <div className="product-info">
        <h3 className="product-name">{product.productName}</h3>
        <p className="product-category">{product.category}</p>
        
        {/* Statistiques de vente détaillées */}
        <div className="sales-metrics">
          <div className="metric">
            <span className="metric-value">{product.totalQuantitySold}</span>
            <span className="metric-label">unités vendues</span>
          </div>
          <div className="metric">
            <span className="metric-value">{product.totalRevenue.toLocaleString()}</span>
            <span className="metric-label">FCFA de revenus</span>
          </div>
          <div className="metric">
            <span className="metric-value">{product.uniqueCustomers}</span>
            <span className="metric-label">clients uniques</span>
          </div>
        </div>

        {/* Prix moyen */}
        <div className="price-info">
          <span className="average-price">
            Prix moyen: {product.averageUnitPrice.toLocaleString()} FCFA
          </span>
        </div>

        {/* Période de vente */}
        <div className="sales-period">
          <span className="period-label">Période de vente:</span>
          <span className="period-dates">
            {formatDate(product.firstSaleDate)} - {formatDate(product.lastSaleDate)}
          </span>
        </div>
        
        {/* Informations vendeur */}
        <div className="vendor-info">
          <div className="vendor-name">{product.vendorName}</div>
          {product.businessName && (
            <div className="business-name">{product.businessName}</div>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 3. Composants de Support
```tsx
const BestSellersLoading: React.FC = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Analyse des meilleures ventes en cours...</p>
  </div>
);

const BestSellersError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="error-container">
    <div className="error-icon">⚠️</div>
    <h3>Erreur de chargement</h3>
    <p>{error}</p>
    <button onClick={onRetry} className="retry-btn">
      Réessayer
    </button>
  </div>
);
```

## 🎨 Styles CSS Améliorés

```css
/* Container principal */
.real-best-sellers-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Section des filtres */
.filters-section {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.period-select, .limit-select, .min-sales-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  min-width: 120px;
}

.refresh-btn {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease;
}

.refresh-btn:hover {
  transform: translateY(-1px);
}

/* Section des statistiques */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 1px solid #e2e8f0;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* En-tête */
.best-sellers-header {
  text-align: center;
  margin-bottom: 2rem;
}

.best-sellers-header h2 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  color: #6b7280;
  font-size: 1.1rem;
}

/* Grille des produits */
.best-sellers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
}

/* Carte de produit */
.real-best-seller-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.real-best-seller-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Badge de rang */
.rank-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 0.9rem;
  z-index: 10;
  color: white;
}

.rank-gold { background: linear-gradient(135deg, #ffd700, #ffb347); }
.rank-silver { background: linear-gradient(135deg, #c0c0c0, #a8a8a8); }
.rank-bronze { background: linear-gradient(135deg, #cd7f32, #b8860b); }
.rank-default { background: linear-gradient(135deg, #6366f1, #4f46e5); }

/* Image du produit */
.product-image {
  height: 250px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image-placeholder {
  text-align: center;
  color: #9ca3af;
}

.no-image-placeholder span {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

/* Informations du produit */
.product-info {
  padding: 1.5rem;
}

.product-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.product-category {
  color: #64748b;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

/* Métriques de vente */
.sales-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric {
  text-align: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.metric-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.metric-label {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  display: block;
}

/* Prix et période */
.price-info {
  margin-bottom: 1rem;
  text-align: center;
}

.average-price {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
}

.sales-period {
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
}

.period-label {
  color: #6b7280;
  display: block;
  margin-bottom: 0.25rem;
}

.period-dates {
  color: #374151;
  font-weight: 500;
}

/* Informations vendeur */
.vendor-info {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  text-align: center;
}

.vendor-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.business-name {
  font-size: 0.875rem;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .real-best-sellers-container {
    padding: 1rem;
  }
  
  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }
  
  .best-sellers-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .sales-metrics {
    grid-template-columns: 1fr;
  }
}

/* États de chargement et erreur */
.loading-container, .error-container {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  margin-top: 1rem;
}
```

## 🔧 Avantages de cette Approche

### ✅ Données Réelles
- Basé sur les vraies commandes livrées
- Calculs précis des quantités vendues
- Revenus exacts par produit

### ✅ Flexibilité Temporelle  
- Analyse par période (jour, semaine, mois, année)
- Comparaisons temporelles faciles
- Tendances identifiables

### ✅ Filtrage Avancé
- Par vendeur spécifique
- Par catégorie de produit
- Seuil minimum de ventes

### ✅ Statistiques Complètes
- Nombre de clients uniques
- Prix moyen de vente
- Période de vente active
- Chiffre d'affaires total

### ✅ Performance Optimisée
- Requêtes SQL optimisées avec agrégations
- Support de la pagination
- Cache intégré pour les performances

## 🚀 Intégration Recommandée

1. **Remplacez l'ancien endpoint** `/public/best-sellers` par `/public/real-best-sellers`
2. **Utilisez les nouveaux types TypeScript** fournis dans ce guide
3. **Implémentez le filtrage par période** pour des analyses temporelles
4. **Ajoutez un système de cache** côté frontend pour les performances
5. **Configurez un rafraîchissement automatique** toutes les 5-10 minutes

## 📈 Cas d'Usage Métier

- **Tableau de bord vendeur** : Voir ses propres meilleures ventes
- **Page d'accueil** : Afficher les tendances du moment
- **Analyses marketing** : Identifier les produits populaires par période
- **Recommandations** : Suggérer des produits basés sur les vraies ventes

---

**🎯 Cette approche garantit des données fiables et actuelles pour prendre de meilleures décisions commerciales !** 