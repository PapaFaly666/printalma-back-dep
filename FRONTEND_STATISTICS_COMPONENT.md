# 📊 Composant Statistiques Frontend

## 🎯 Composant React pour Dashboard Statistiques

### Composant principal StatisticsDashboard

```jsx
// components/StatisticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import OrderService from '../services/OrderService';
import './StatisticsDashboard.css';

const StatisticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStatistics = async () => {
    try {
      setError(null);
      const result = await OrderService.getStatistics();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      setError(error.message);
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  if (loading) {
    return (
      <div className="statistics-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-dashboard">
        <div className="error-container">
          <h3>❌ Erreur</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="statistics-dashboard">
        <p>Aucune statistique disponible</p>
      </div>
    );
  }

  return (
    <div className="statistics-dashboard">
      <div className="dashboard-header">
        <h2>📊 Tableau de Bord - Statistiques</h2>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="btn-refresh"
        >
          {refreshing ? '🔄 Actualisation...' : '🔄 Actualiser'}
        </button>
      </div>

      {/* Statistiques générales */}
      <div className="stats-section">
        <h3>📈 Vue d'ensemble</h3>
        <div className="stats-grid">
          <StatCard
            title="Total Commandes"
            value={stats.totalOrders}
            icon="📦"
            color="#007bff"
          />
          <StatCard
            title="En Attente"
            value={stats.pendingOrders}
            icon="⏳"
            color="#ffc107"
          />
          <StatCard
            title="Confirmées"
            value={stats.confirmedOrders}
            icon="✅"
            color="#28a745"
          />
          <StatCard
            title="Livrées"
            value={stats.deliveredOrders}
            icon="🚚"
            color="#17a2b8"
          />
        </div>
      </div>

      {/* Statistiques financières */}
      <div className="stats-section">
        <h3>💰 Finances</h3>
        <div className="stats-grid">
          <StatCard
            title="Chiffre d'Affaires"
            value={`${stats.totalRevenue}€`}
            icon="💵"
            color="#28a745"
          />
          <StatCard
            title="Panier Moyen"
            value={`${stats.averageOrderValue.toFixed(2)}€`}
            icon="🛒"
            color="#6f42c1"
          />
          <StatCard
            title="CA Aujourd'hui"
            value={`${stats.revenueToday}€`}
            icon="📅"
            color="#fd7e14"
          />
          <StatCard
            title="CA Ce Mois"
            value={`${stats.revenueThisMonth}€`}
            icon="📊"
            color="#e83e8c"
          />
        </div>
      </div>

      {/* Statistiques par statut */}
      <div className="stats-section">
        <h3>📋 Répartition par Statut</h3>
        <div className="status-chart">
          <StatusBar
            label="En traitement"
            value={stats.processingOrders}
            total={stats.totalOrders}
            color="#007bff"
          />
          <StatusBar
            label="Expédiées"
            value={stats.shippedOrders}
            total={stats.totalOrders}
            color="#6f42c1"
          />
          <StatusBar
            label="Annulées"
            value={stats.cancelledOrders}
            total={stats.totalOrders}
            color="#dc3545"
          />
          <StatusBar
            label="Rejetées"
            value={stats.rejectedOrders}
            total={stats.totalOrders}
            color="#6c757d"
          />
        </div>
      </div>

      {/* Statistiques temporelles */}
      <div className="stats-section">
        <h3>📅 Évolution Temporelle</h3>
        <div className="temporal-stats">
          <div className="temporal-card">
            <h4>Aujourd'hui</h4>
            <div className="temporal-data">
              <span className="temporal-orders">{stats.ordersToday} commandes</span>
              <span className="temporal-revenue">{stats.revenueToday}€</span>
            </div>
          </div>
          <div className="temporal-card">
            <h4>Cette Semaine</h4>
            <div className="temporal-data">
              <span className="temporal-orders">{stats.ordersThisWeek} commandes</span>
              <span className="temporal-revenue">{stats.revenueThisWeek}€</span>
            </div>
          </div>
          <div className="temporal-card">
            <h4>Ce Mois</h4>
            <div className="temporal-data">
              <span className="temporal-orders">{stats.ordersThisMonth} commandes</span>
              <span className="temporal-revenue">{stats.revenueThisMonth}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top produits */}
      <div className="stats-section">
        <h3>🏆 Top Produits</h3>
        <div className="top-products">
          {stats.topProducts.length > 0 ? (
            stats.topProducts.map((product, index) => (
              <TopProductCard
                key={product.productId}
                rank={index + 1}
                product={product}
              />
            ))
          ) : (
            <p className="no-data">Aucun produit vendu pour le moment</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant pour une carte de statistique
const StatCard = ({ title, value, icon, color }) => (
  <div className="stat-card" style={{ borderLeftColor: color }}>
    <div className="stat-icon" style={{ color }}>
      {icon}
    </div>
    <div className="stat-content">
      <h4>{title}</h4>
      <p className="stat-value">{value}</p>
    </div>
  </div>
);

// Composant pour une barre de statut
const StatusBar = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="status-bar">
      <div className="status-label">
        <span>{label}</span>
        <span>{value} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="status-progress">
        <div 
          className="status-fill" 
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color 
          }}
        ></div>
      </div>
    </div>
  );
};

// Composant pour un produit top
const TopProductCard = ({ rank, product }) => (
  <div className="top-product-card">
    <div className="product-rank">#{rank}</div>
    <div className="product-info">
      <h4>{product.productName}</h4>
      <div className="product-stats">
        <span className="product-quantity">
          📦 {product.totalQuantity} vendus
        </span>
        <span className="product-revenue">
          💰 {product.totalRevenue}€
        </span>
      </div>
    </div>
  </div>
);

export default StatisticsDashboard;
```

### CSS pour le composant

```css
/* StatisticsDashboard.css */
.statistics-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-header h2 {
  margin: 0;
  color: #333;
}

.btn-refresh {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.btn-refresh:hover:not(:disabled) {
  background: #0056b3;
}

.btn-refresh:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.loading-container, .error-container {
  text-align: center;
  padding: 50px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.stats-section {
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stats-section h3 {
  margin: 0 0 20px 0;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.stat-icon {
  font-size: 2.5em;
  margin-right: 15px;
}

.stat-content h4 {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  margin: 0;
  font-size: 2em;
  font-weight: bold;
  color: #333;
}

.status-chart {
  space-y: 15px;
}

.status-bar {
  margin-bottom: 15px;
}

.status-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
  color: #666;
}

.status-progress {
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.temporal-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.temporal-card {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  text-align: center;
}

.temporal-card h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  opacity: 0.9;
}

.temporal-data {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.temporal-orders {
  font-size: 18px;
  font-weight: bold;
}

.temporal-revenue {
  font-size: 16px;
  opacity: 0.9;
}

.top-products {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.top-product-card {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: transform 0.2s;
}

.top-product-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.product-rank {
  width: 40px;
  height: 40px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
}

.product-info h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.product-stats {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.no-data {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-primary:hover {
  background: #0056b3;
}

/* Responsive */
@media (max-width: 768px) {
  .statistics-dashboard {
    padding: 10px;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .temporal-stats {
    grid-template-columns: 1fr;
  }
  
  .top-products {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
```

### Hook personnalisé pour les statistiques

```jsx
// hooks/useStatistics.js
import { useState, useEffect, useCallback } from 'react';
import OrderService from '../services/OrderService';

export const useStatistics = (autoRefresh = false, refreshInterval = 30000) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatistics = useCallback(async () => {
    try {
      setError(null);
      const result = await OrderService.getStatistics();
      
      if (result.success) {
        setStats(result.data);
        setLastUpdated(new Date());
      } else {
        throw new Error(result.message || 'Erreur lors du chargement des statistiques');
      }
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement statistiques:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    return fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchStatistics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchStatistics]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh
  };
};
```

### Composant de statistiques simplifié

```jsx
// components/SimpleStats.jsx
import React from 'react';
import { useStatistics } from '../hooks/useStatistics';

const SimpleStats = () => {
  const { stats, loading, error, refresh } = useStatistics();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!stats) return <div>Aucune donnée</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>📊 Statistiques</h2>
        <button onClick={refresh}>🔄 Actualiser</button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Total Commandes</h3>
          <p style={{ fontSize: '2em', margin: 0 }}>{stats.totalOrders}</p>
        </div>
        
        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>En Attente</h3>
          <p style={{ fontSize: '2em', margin: 0, color: '#ffc107' }}>{stats.pendingOrders}</p>
        </div>
        
        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Chiffre d'Affaires</h3>
          <p style={{ fontSize: '2em', margin: 0, color: '#28a745' }}>{stats.totalRevenue}€</p>
        </div>
        
        <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
          <h3>Panier Moyen</h3>
          <p style={{ fontSize: '2em', margin: 0, color: '#007bff' }}>{stats.averageOrderValue.toFixed(2)}€</p>
        </div>
      </div>
    </div>
  );
};

export default SimpleStats;
```

### Utilisation dans l'application

```jsx
// pages/AdminDashboard.jsx
import React from 'react';
import StatisticsDashboard from '../components/StatisticsDashboard';
import { useAuth } from '../contexts/AuthContext';

const AdminDashboard = () => {
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return <div>Accès refusé</div>;
  }

  return (
    <div>
      <StatisticsDashboard />
    </div>
  );
};

export default AdminDashboard;
```

### Test rapide des statistiques

```javascript
// Test dans la console du navigateur
(async function testStats() {
  try {
    const response = await fetch('/api/orders/admin/statistics', {
      credentials: 'include'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('📊 Statistiques:', result.data);
      console.table([
        { Métrique: 'Total commandes', Valeur: result.data.totalOrders },
        { Métrique: 'En attente', Valeur: result.data.pendingOrders },
        { Métrique: 'Chiffre d\'affaires', Valeur: result.data.totalRevenue + '€' },
        { Métrique: 'Panier moyen', Valeur: result.data.averageOrderValue.toFixed(2) + '€' }
      ]);
    } else {
      console.error('❌ Erreur:', result.message);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
  }
})();
```

## 🚀 Intégration

1. **Copier les composants** dans votre projet React
2. **Ajouter le CSS** ou adapter à votre design system
3. **Utiliser le hook useStatistics** pour une gestion d'état simplifiée
4. **Tester l'accès** avec les endpoints de diagnostic

Le composant est entièrement responsive et prêt pour la production ! 📱💻 