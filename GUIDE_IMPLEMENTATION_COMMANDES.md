# 🚀 Guide d'Implémentation - Système de Commandes Frontend

## 🎯 Vue d'Ensemble

Ce guide vous aide à intégrer parfaitement le frontend avec votre backend NestJS pour le système de commandes.

## ✅ État Actuel - Votre Backend

Votre backend NestJS dispose déjà de :
- ✅ **Endpoints complets** : création, récupération, mise à jour des commandes
- ✅ **Authentification JWT** fonctionnelle 
- ✅ **Statistiques avancées** avec 2 formats (complet + frontend)
- ✅ **Gestion des statuts** avec transitions validées
- ✅ **Tests d'authentification** intégrés

## 🔧 Étapes d'Implémentation Frontend

### Étape 1 : Intégrer le Service OrderService

```javascript
// 1. Créer le fichier services/OrderService.js
// Copiez le service depuis FRONTEND_ORDER_SERVICE.md

// 2. Ajuster l'URL de base
const OrderService = {
  baseURL: 'http://localhost:3004', // Votre port NestJS
  // ... reste du service
};
```

### Étape 2 : Composants de Base

#### A. Formulaire de Création de Commande
```jsx
// components/CreateOrder.jsx
import OrderService from '../services/OrderService';

const CreateOrder = () => {
  const handleSubmit = async (orderData) => {
    try {
      const result = await OrderService.createOrder(orderData);
      if (result.success) {
        alert(`✅ Commande créée : ${result.data.orderNumber}`);
      }
    } catch (error) {
      alert(`❌ Erreur : ${error.message}`);
    }
  };
  
  // ... formulaire
};
```

#### B. Liste des Commandes Utilisateur
```jsx
// components/MyOrders.jsx
import { useState, useEffect } from 'react';
import OrderService from '../services/OrderService';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const result = await OrderService.getMyOrders();
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const result = await OrderService.cancelOrder(orderId);
      if (result.success) {
        loadOrders(); // Recharger la liste
        alert('✅ Commande annulée');
      }
    } catch (error) {
      alert(`❌ Erreur : ${error.message}`);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2>📦 Mes Commandes</h2>
      {orders.map(order => {
        const formatted = OrderService.formatOrder(order);
        return (
          <div key={order.id} className="order-card">
            <h3>Commande #{order.orderNumber}</h3>
            <p>Statut: <span style={{color: formatted.statusColor}}>
              {formatted.statusLabel}
            </span></p>
            <p>Montant: {formatted.formattedAmount}</p>
            <p>Date: {formatted.formattedDate}</p>
            
            {order.status === 'PENDING' && (
              <button onClick={() => handleCancelOrder(order.id)}>
                ❌ Annuler
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
```

#### C. Dashboard Admin avec Statistiques
```jsx
// components/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import OrderService from '../services/OrderService';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordersResult, statsResult] = await Promise.all([
        OrderService.getAllOrders(1, 20),
        OrderService.getFrontendStatistics() // Format simplifié
      ]);

      if (ordersResult.success) setOrders(ordersResult.data.orders);
      if (statsResult.success) setStats(statsResult.data);
    } catch (error) {
      console.error('Erreur chargement données admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus, notes = '') => {
    try {
      const result = await OrderService.updateOrderStatus(orderId, newStatus, notes);
      if (result.success) {
        loadData(); // Recharger les données
        alert(`✅ Statut mis à jour vers: ${OrderService.getStatusLabel(newStatus)}`);
      }
    } catch (error) {
      alert(`❌ Erreur : ${error.message}`);
    }
  };

  if (loading) return <div>Chargement du dashboard...</div>;

  return (
    <div className="admin-dashboard">
      {/* Statistiques */}
      {stats && (
        <div className="stats-section">
          <h2>📊 Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Commandes</h3>
              <p>{stats.totalOrders}</p>
            </div>
            <div className="stat-card">
              <h3>CA Total</h3>
              <p>{stats.revenue.total.toLocaleString()}€</p>
            </div>
            <div className="stat-card">
              <h3>En Attente</h3>
              <p>{stats.ordersByStatus.pending}</p>
            </div>
            <div className="stat-card">
              <h3>Aujourd'hui</h3>
              <p>{stats.ordersCount.today}</p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des commandes */}
      <div className="orders-section">
        <h2>📋 Commandes Récentes</h2>
        {orders.map(order => {
          const formatted = OrderService.formatOrder(order);
          const availableStatuses = OrderService.getAvailableStatusTransitions(order.status);
          
          return (
            <div key={order.id} className="admin-order-card">
              <div className="order-header">
                <h3>#{order.orderNumber}</h3>
                <span style={{color: formatted.statusColor}}>
                  {formatted.statusLabel}
                </span>
              </div>
              
              <div className="order-details">
                <p>Client: {formatted.customerName} ({order.userEmail})</p>
                <p>Montant: {formatted.formattedAmount}</p>
                <p>Articles: {formatted.itemsCount}</p>
                <p>Date: {formatted.formattedDate}</p>
              </div>

              {/* Actions admin */}
              {availableStatuses.length > 0 && (
                <div className="order-actions">
                  <h4>Changer le statut :</h4>
                  {availableStatuses.map(status => (
                    <button
                      key={status.value}
                      onClick={() => handleStatusChange(order.id, status.value)}
                      style={{ backgroundColor: status.color, color: 'white' }}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### Étape 3 : Tests de Validation

#### A. Test de Connexion API
```javascript
// Copiez dans la console du navigateur
(async function testConnection() {
  try {
    // Test authentification
    const auth = await fetch('/orders/test-auth', { 
      credentials: 'include' 
    }).then(r => r.json());
    console.log('✅ Authentification:', auth);

    // Test création commande
    const orderData = {
      shippingAddress: "123 Rue Test, Paris",
      phoneNumber: "+33123456789",
      orderItems: [
        { productId: 1, quantity: 1, size: "M", color: "Rouge" }
      ]
    };

    const order = await fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderData)
    }).then(r => r.json());
    
    console.log('✅ Nouvelle commande:', order);

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
})();
```

#### B. Test Admin (si vous avez les permissions)
```javascript
// Test des fonctionnalités admin
(async function testAdmin() {
  try {
    // Test accès admin
    const adminAccess = await fetch('/orders/test-admin', { 
      credentials: 'include' 
    }).then(r => r.json());
    console.log('✅ Accès admin:', adminAccess);

    // Test statistiques
    const stats = await fetch('/orders/admin/frontend-statistics', { 
      credentials: 'include' 
    }).then(r => r.json());
    console.log('✅ Statistiques:', stats);

    // Test liste commandes
    const orders = await fetch('/orders/admin/all?page=1&limit=5', { 
      credentials: 'include' 
    }).then(r => r.json());
    console.log('✅ Commandes admin:', orders);

  } catch (error) {
    console.error('❌ Erreur test admin:', error);
  }
})();
```

## 🎨 CSS de Base

```css
/* styles/orders.css */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-card h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 14px;
}

.stat-card p {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.order-card, .admin-order-card {
  background: white;
  padding: 20px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.order-actions {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.order-actions button {
  margin-right: 10px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
```

## 🔧 Configuration d'Environnement

```javascript
// config/api.js
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  withCredentials: true
};

export default API_CONFIG;
```

## 📋 Checklist d'Implémentation

### Phase 1 : Base ✅
- [ ] Copier le service OrderService
- [ ] Ajuster l'URL de base de l'API
- [ ] Tester la connexion avec `/orders/test-auth`
- [ ] Créer le composant de création de commande

### Phase 2 : Interface Utilisateur ✅
- [ ] Composant liste des commandes utilisateur
- [ ] Fonction d'annulation de commande
- [ ] Affichage des statuts avec couleurs
- [ ] Tests de création de commande

### Phase 3 : Interface Admin ✅
- [ ] Dashboard avec statistiques
- [ ] Liste des commandes admin
- [ ] Changement de statut des commandes
- [ ] Tests des permissions admin

### Phase 4 : Optimisations 🚀
- [ ] Gestion d'erreurs améliorée
- [ ] Loading states
- [ ] Pagination des commandes
- [ ] Filtres et recherche

## 🎯 Résultat Attendu

Une fois terminé, vous aurez :

1. **✅ Formulaire de commande** fonctionnel
2. **📋 Interface utilisateur** pour voir et gérer ses commandes
3. **🔧 Dashboard admin** avec statistiques temps réel
4. **📊 Gestion des statuts** avec transitions visuelles
5. **🛡️ Sécurité** préservée avec authentification

Votre système de commandes sera **complètement opérationnel** ! 🚀

## ❓ Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs de la console navigateur
2. Testez les endpoints avec les scripts fournis
3. Vérifiez que votre serveur NestJS est démarré
4. Assurez-vous d'être authentifié

**Votre backend est prêt, il ne reste plus qu'à connecter le frontend !** ✨ 