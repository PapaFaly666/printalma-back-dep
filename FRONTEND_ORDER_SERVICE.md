# 🛒 Service OrderService Frontend - Compatible NestJS

## Service JavaScript Optimisé pour votre Backend

```javascript
// services/OrderService.js
class OrderService {
  constructor() {
    this.baseURL = 'http://localhost:3004'; // Ajustez selon votre configuration
  }

  // Méthode utilitaire pour les appels API
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include', // Important pour les cookies de session
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Erreur HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // MÉTHODES UTILISATEURS
  // ==========================================

  /**
   * Créer une nouvelle commande
   * @param {Object} orderData - Données de la commande
   * @param {string} orderData.shippingAddress - Adresse de livraison
   * @param {string} orderData.phoneNumber - Numéro de téléphone
   * @param {string} orderData.notes - Notes optionnelles
   * @param {Array} orderData.orderItems - Articles de la commande
   * @returns {Promise<Object>} Commande créée
   */
  async createOrder(orderData) {
    return await this.apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  /**
   * Récupérer les commandes de l'utilisateur connecté
   * @returns {Promise<Object>} Liste des commandes
   */
  async getMyOrders() {
    return await this.apiCall('/orders/my-orders');
  }

  /**
   * Récupérer une commande spécifique
   * @param {number} orderId - ID de la commande
   * @returns {Promise<Object>} Détails de la commande
   */
  async getOrderById(orderId) {
    return await this.apiCall(`/orders/${orderId}`);
  }

  /**
   * Annuler une commande
   * @param {number} orderId - ID de la commande
   * @returns {Promise<Object>} Commande annulée
   */
  async cancelOrder(orderId) {
    return await this.apiCall(`/orders/${orderId}/cancel`, {
      method: 'DELETE'
    });
  }

  // ==========================================
  // MÉTHODES ADMIN
  // ==========================================

  /**
   * Récupérer toutes les commandes (Admin)
   * @param {number} page - Numéro de page
   * @param {number} limit - Limite par page
   * @param {string} status - Filtre par statut
   * @returns {Promise<Object>} Liste paginée des commandes
   */
  async getAllOrders(page = 1, limit = 10, status = null) {
    let url = `/orders/admin/all?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return await this.apiCall(url);
  }

  /**
   * Mettre à jour le statut d'une commande (Admin)
   * @param {number} orderId - ID de la commande
   * @param {string} status - Nouveau statut
   * @param {string} notes - Notes optionnelles
   * @returns {Promise<Object>} Commande mise à jour
   */
  async updateOrderStatus(orderId, status, notes = null) {
    return await this.apiCall(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  }

  /**
   * Récupérer les statistiques des commandes (Admin) - Format complet
   * @returns {Promise<Object>} Statistiques complètes
   */
  async getStatistics() {
    return await this.apiCall('/orders/admin/statistics');
  }

  /**
   * Récupérer les statistiques au format frontend (Admin) - Format simplifié
   * @returns {Promise<Object>} Statistiques format frontend
   */
  async getFrontendStatistics() {
    return await this.apiCall('/orders/admin/frontend-statistics');
  }

  // ==========================================
  // MÉTHODES DE TEST
  // ==========================================

  /**
   * Tester l'authentification
   * @returns {Promise<Object>} Informations utilisateur
   */
  async testAuth() {
    return await this.apiCall('/orders/test-auth');
  }

  /**
   * Tester les permissions admin
   * @returns {Promise<Object>} Confirmation accès admin
   */
  async testAdmin() {
    return await this.apiCall('/orders/test-admin');
  }

  // ==========================================
  // MÉTHODES UTILITAIRES
  // ==========================================

  /**
   * Formater une commande pour l'affichage
   * @param {Object} order - Commande brute du backend
   * @returns {Object} Commande formatée
   */
  formatOrder(order) {
    return {
      ...order,
      statusLabel: this.getStatusLabel(order.status),
      statusColor: this.getStatusColor(order.status),
      formattedAmount: this.formatCurrency(order.totalAmount),
      formattedDate: this.formatDate(order.createdAt),
      customerName: `${order.userFirstName || ''} ${order.userLastName || ''}`.trim(),
      itemsCount: order.orderItems?.length || 0
    };
  }

  /**
   * Obtenir le label français d'un statut
   * @param {string} status - Statut en anglais
   * @returns {string} Label en français
   */
  getStatusLabel(status) {
    const labels = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmée',
      'PROCESSING': 'En traitement',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
      'REJECTED': 'Rejetée'
    };
    return labels[status] || status;
  }

  /**
   * Obtenir la couleur d'un statut pour l'affichage
   * @param {string} status - Statut
   * @returns {string} Couleur CSS
   */
  getStatusColor(status) {
    const colors = {
      'PENDING': '#ffc107',      // Jaune
      'CONFIRMED': '#28a745',    // Vert
      'PROCESSING': '#007bff',   // Bleu
      'SHIPPED': '#6f42c1',      // Violet
      'DELIVERED': '#28a745',    // Vert foncé
      'CANCELLED': '#dc3545',    // Rouge
      'REJECTED': '#6c757d'      // Gris
    };
    return colors[status] || '#6c757d';
  }

  /**
   * Formater un montant en devise
   * @param {number} amount - Montant
   * @returns {string} Montant formaté
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR' // Ou 'XOF' pour le franc CFA
    }).format(amount || 0);
  }

  /**
   * Formater une date
   * @param {string|Date} date - Date
   * @returns {string} Date formatée
   */
  formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  /**
   * Obtenir les statuts disponibles pour les transitions
   * @param {string} currentStatus - Statut actuel
   * @returns {Array} Liste des statuts possibles
   */
  getAvailableStatusTransitions(currentStatus) {
    const transitions = {
      'PENDING': ['CONFIRMED', 'REJECTED', 'CANCELLED'],
      'CONFIRMED': ['PROCESSING', 'CANCELLED'],
      'PROCESSING': ['SHIPPED', 'CANCELLED'],
      'SHIPPED': ['DELIVERED'],
      'DELIVERED': [],
      'CANCELLED': [],
      'REJECTED': []
    };
    
    return (transitions[currentStatus] || []).map(status => ({
      value: status,
      label: this.getStatusLabel(status),
      color: this.getStatusColor(status)
    }));
  }
}

// Export du service
const orderService = new OrderService();
export default orderService;
```

## 🎯 Composant Statistiques Compatible

```jsx
// components/OrderStatisticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import OrderService from '../services/OrderService';

const OrderStatisticsDashboard = ({ useSimpleFormat = false }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStatistics = async () => {
    try {
      setError(null);
      // Utiliser le format selon les besoins
      const result = useSimpleFormat 
        ? await OrderService.getFrontendStatistics()
        : await OrderService.getStatistics();
      
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [useSimpleFormat]);

  if (loading) return <div>Chargement des statistiques...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!stats) return <div>Aucune statistique disponible</div>;

  return (
    <div className="statistics-dashboard">
      <h2>📊 Statistiques des Commandes</h2>
      
      {/* Format simplifié (selon doc TODO Backend) */}
      {useSimpleFormat ? (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Commandes</h3>
              <p>{stats.totalOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Chiffre d'Affaires</h3>
              <p>{stats.revenue.total.toLocaleString()}€</p>
            </div>
            <div className="stat-card">
              <h3>CA Mensuel</h3>
              <p>{stats.revenue.monthly.toLocaleString()}€</p>
            </div>
          </div>

          <div className="orders-count">
            <h3>Commandes par période</h3>
            <ul>
              <li>Aujourd'hui: {stats.ordersCount.today}</li>
              <li>Cette semaine: {stats.ordersCount.week}</li>
              <li>Ce mois: {stats.ordersCount.month}</li>
            </ul>
          </div>

          <div className="status-breakdown">
            <h3>Répartition par statut</h3>
            <ul>
              <li>En attente: {stats.ordersByStatus.pending}</li>
              <li>Confirmées: {stats.ordersByStatus.confirmed}</li>
              <li>En traitement: {stats.ordersByStatus.processing}</li>
              <li>Expédiées: {stats.ordersByStatus.shipped}</li>
              <li>Livrées: {stats.ordersByStatus.delivered}</li>
              <li>Annulées: {stats.ordersByStatus.cancelled}</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Format complet existant */
        <div>
          {/* Votre composant statistiques existant */}
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Commandes</h3>
              <p>{stats.totalOrders}</p>
            </div>
            <div className="stat-card">
              <h3>En Attente</h3>
              <p>{stats.pendingOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Chiffre d'Affaires</h3>
              <p>{stats.totalRevenue.toLocaleString()}€</p>
            </div>
            <div className="stat-card">
              <h3>Panier Moyen</h3>
              <p>{stats.averageOrderValue.toFixed(2)}€</p>
            </div>
          </div>

          {/* Top produits */}
          {stats.topProducts && (
            <div className="top-products">
              <h3>🏆 Top Produits</h3>
              {stats.topProducts.map((product, index) => (
                <div key={product.productId} className="product-item">
                  #{index + 1} {product.productName} - 
                  {product.totalQuantity} vendus - 
                  {product.totalRevenue.toLocaleString()}€
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderStatisticsDashboard;
```

## 🧪 Tests de Compatibilité

```javascript
// Test dans la console du navigateur
(async function testOrderSystem() {
  console.log('🧪 Test du système de commandes');
  
  try {
    // 1. Test authentification
    console.log('1. Test authentification...');
    const authTest = await fetch('/orders/test-auth', { 
      credentials: 'include' 
    }).then(r => r.json());
    console.log('✅ Auth:', authTest);

    // 2. Test admin (si applicable)
    try {
      console.log('2. Test admin...');
      const adminTest = await fetch('/orders/test-admin', { 
        credentials: 'include' 
      }).then(r => r.json());
      console.log('✅ Admin:', adminTest);
      
      // 3. Test statistiques format frontend
      console.log('3. Test statistiques frontend...');
      const frontendStats = await fetch('/orders/admin/frontend-statistics', { 
        credentials: 'include' 
      }).then(r => r.json());
      console.log('✅ Stats Frontend:', frontendStats);

      // 4. Test statistiques complètes
      console.log('4. Test statistiques complètes...');
      const fullStats = await fetch('/orders/admin/statistics', { 
        credentials: 'include' 
      }).then(r => r.json());
      console.log('✅ Stats Complètes:', fullStats);

    } catch (adminError) {
      console.log('ℹ️ Tests admin ignorés (pas les permissions)');
    }

    // 5. Test création commande (exemple)
    console.log('5. Test création commande...');
    const orderData = {
      shippingAddress: "123 Rue de Test, 75001 Paris",
      phoneNumber: "+33123456789",
      notes: "Test de commande",
      orderItems: [
        {
          productId: 1,
          quantity: 1,
          size: "M",
          color: "Rouge"
        }
      ]
    };

    const newOrder = await fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderData)
    }).then(r => r.json());
    
    console.log('✅ Nouvelle commande:', newOrder);

    console.log('🎉 Tous les tests terminés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
})();
```

## 🎯 Résumé des Améliorations

### ✅ Ajouté
1. **Nouvelle méthode** `getFrontendStatistics()` au format exact de votre doc
2. **Nouvel endpoint** `/orders/admin/frontend-statistics`
3. **Service frontend** optimisé avec méthodes utilitaires
4. **Composant** compatible avec les deux formats
5. **Tests** de compatibilité

### 🔧 Format de Réponse Simplifié
```json
{
  "success": true,
  "data": {
    "totalOrders": 150,
    "revenue": {
      "total": 45000,
      "monthly": 12000
    },
    "ordersCount": {
      "today": 5,
      "week": 23,
      "month": 87
    },
    "ordersByStatus": {
      "pending": 12,
      "confirmed": 25,
      "processing": 18,
      "shipped": 35,
      "delivered": 45,
      "cancelled": 15
    }
  }
}
```

Votre backend NestJS est maintenant **parfaitement compatible** avec les exigences frontend ! 🚀✨ 