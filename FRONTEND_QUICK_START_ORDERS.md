# ⚡ Démarrage Rapide Frontend - Système de Commandes

## 🎯 En 5 minutes, intégrez le système de commandes !

### 📋 Checklist de démarrage

- [ ] ✅ Backend démarré sur `http://localhost:3000`
- [ ] ✅ Utilisateur connecté avec rôle SUPERADMIN
- [ ] ✅ Tests de diagnostic passés
- [ ] ✅ Service OrderService intégré
- [ ] ✅ Premier appel API réussi

---

## 🚀 Étape 1 : Test de connexion (2 minutes)

### Copier-coller ce script dans la console du navigateur :

```javascript
// 🔍 TEST RAPIDE - Copier dans la console
(async function testConnection() {
  console.log('🚀 TEST DE CONNEXION RAPIDE');
  console.log('============================');
  
  try {
    // Test auth
    const authResponse = await fetch('/api/orders/test-auth', { credentials: 'include' });
    const authResult = await authResponse.json();
    console.log('✅ Authentification:', authResponse.status === 200 ? 'OK' : 'ÉCHEC');
    console.log('   Utilisateur:', authResult.data?.user?.email);
    console.log('   Rôle:', authResult.data?.userRole);
    
    // Test admin
    const adminResponse = await fetch('/api/orders/test-admin', { credentials: 'include' });
    const adminResult = await adminResponse.json();
    console.log('✅ Accès Admin:', adminResponse.status === 200 ? 'OK' : 'ÉCHEC');
    
    if (authResponse.status === 200 && adminResponse.status === 200) {
      console.log('🎉 TOUT FONCTIONNE ! Vous pouvez continuer.');
    } else {
      console.log('❌ PROBLÈME DÉTECTÉ. Vérifiez votre connexion.');
    }
    
  } catch (error) {
    console.log('❌ ERREUR:', error.message);
  }
  
  console.log('============================');
})();
```

**Si ça marche :** Continuez à l'étape 2 ✅  
**Si ça ne marche pas :** Consultez `FRONTEND_ACCESS_TROUBLESHOOTING.md` ⚠️

---

## 🛠️ Étape 2 : Intégrer le Service (2 minutes)

### Créer le fichier `services/OrderService.js` :

```javascript
// services/OrderService.js
class OrderService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || window.location.origin;
  }

  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      return result;
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  // === UTILISATEUR ===
  async createOrder(orderData) {
    return this.apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  async getMyOrders() {
    return this.apiCall('/orders/my-orders');
  }

  async getOrderById(orderId) {
    return this.apiCall(`/orders/${orderId}`);
  }

  async cancelOrder(orderId) {
    return this.apiCall(`/orders/${orderId}/cancel`, { method: 'DELETE' });
  }

  // === ADMIN ===
  async getAllOrders(page = 1, limit = 10, status = null) {
    let endpoint = `/orders/admin/all?page=${page}&limit=${limit}`;
    if (status) endpoint += `&status=${status}`;
    return this.apiCall(endpoint);
  }

  async updateOrderStatus(orderId, status, notes = '') {
    return this.apiCall(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  }

  async getStatistics() {
    return this.apiCall('/orders/admin/statistics');
  }

  // === TESTS ===
  async testAuth() {
    return this.apiCall('/orders/test-auth');
  }

  async testAdmin() {
    return this.apiCall('/orders/test-admin');
  }
}

export default new OrderService();
```

### Tester le service :

```javascript
// Dans la console
import OrderService from './services/OrderService';

// Test rapide
OrderService.testAuth().then(console.log);
OrderService.getMyOrders().then(console.log);
```

---

## 🎨 Étape 3 : Premier composant (1 minute)

### Composant simple pour lister les commandes :

```jsx
// components/MyOrders.jsx
import React, { useState, useEffect } from 'react';
import OrderService from '../services/OrderService';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const result = await OrderService.getMyOrders();
        setOrders(result.data || []);
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur chargement commandes: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Mes Commandes ({orders.length})</h2>
      
      {orders.length === 0 ? (
        <p>Aucune commande trouvée</p>
      ) : (
        orders.map(order => (
          <div key={order.id} style={{
            border: '1px solid #ddd',
            padding: '15px',
            margin: '10px 0',
            borderRadius: '5px'
          }}>
            <h3>Commande #{order.orderNumber}</h3>
            <p><strong>Statut:</strong> {order.status}</p>
            <p><strong>Total:</strong> {order.totalAmount}€</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Articles:</strong> {order.orderItems?.length || 0}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;
```

### Utiliser le composant :

```jsx
// Dans votre App.js ou page
import MyOrders from './components/MyOrders';

function App() {
  return (
    <div>
      <MyOrders />
    </div>
  );
}
```

---

## 🔥 Tests Rapides

### Test 1 : Créer une commande de test

```javascript
// Dans la console
const testOrder = {
  shippingAddress: "123 Rue Test, 75001 Paris",
  phoneNumber: "+33123456789",
  notes: "Commande de test",
  orderItems: [
    {
      productId: 1,
      quantity: 2,
      size: "M",
      color: "Bleu"
    }
  ]
};

OrderService.createOrder(testOrder)
  .then(result => {
    console.log('✅ Commande créée:', result.data);
    alert(`Commande créée ! Numéro: ${result.data.orderNumber}`);
  })
  .catch(error => {
    console.error('❌ Erreur:', error);
    alert('Erreur: ' + error.message);
  });
```

### Test 2 : Dashboard admin simple

```jsx
// components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import OrderService from '../services/OrderService';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const result = await OrderService.getAllOrders(1, 10);
        setOrders(result.data?.orders || []);
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await OrderService.updateOrderStatus(orderId, newStatus);
      alert('Statut mis à jour !');
      // Recharger la liste
      window.location.reload();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Dashboard Admin ({orders.length} commandes)</h2>
      
      {orders.map(order => (
        <div key={order.id} style={{
          border: '1px solid #ddd',
          padding: '15px',
          margin: '10px 0',
          borderRadius: '5px'
        }}>
          <h3>#{order.orderNumber}</h3>
          <p><strong>Client:</strong> {order.user?.email}</p>
          <p><strong>Statut:</strong> {order.status}</p>
          <p><strong>Total:</strong> {order.totalAmount}€</p>
          
          <div style={{ marginTop: '10px' }}>
            {order.status === 'PENDING' && (
              <>
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'CONFIRMED')}
                  style={{ marginRight: '10px', background: 'green', color: 'white', padding: '5px 10px' }}
                >
                  Confirmer
                </button>
                <button 
                  onClick={() => handleStatusUpdate(order.id, 'REJECTED')}
                  style={{ background: 'red', color: 'white', padding: '5px 10px' }}
                >
                  Rejeter
                </button>
              </>
            )}
            
            {order.status === 'CONFIRMED' && (
              <button 
                onClick={() => handleStatusUpdate(order.id, 'PROCESSING')}
                style={{ background: 'blue', color: 'white', padding: '5px 10px' }}
              >
                Mettre en traitement
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminDashboard;
```

---

## 📱 Exemples d'utilisation immédiate

### Bouton "Créer une commande" simple :

```jsx
const CreateOrderButton = () => {
  const handleCreate = async () => {
    const orderData = {
      shippingAddress: prompt('Adresse de livraison:'),
      phoneNumber: prompt('Téléphone:'),
      notes: prompt('Notes (optionnel):') || '',
      orderItems: [
        {
          productId: parseInt(prompt('ID du produit:')),
          quantity: parseInt(prompt('Quantité:')) || 1,
          size: prompt('Taille:') || 'M',
          color: prompt('Couleur:') || 'Bleu'
        }
      ]
    };

    try {
      const result = await OrderService.createOrder(orderData);
      alert(`Commande créée ! Numéro: ${result.data.orderNumber}`);
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <button onClick={handleCreate} style={{
      background: '#007bff',
      color: 'white',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    }}>
      Créer une commande
    </button>
  );
};
```

### Affichage du statut en temps réel :

```jsx
const OrderStatus = ({ orderId }) => {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const result = await OrderService.getOrderById(orderId);
        setOrder(result.data);
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    loadOrder();
  }, [orderId]);

  if (!order) return <div>Chargement...</div>;

  const statusColors = {
    PENDING: '#ffa500',
    CONFIRMED: '#28a745',
    PROCESSING: '#007bff',
    SHIPPED: '#6f42c1',
    DELIVERED: '#28a745',
    CANCELLED: '#dc3545',
    REJECTED: '#dc3545'
  };

  return (
    <span style={{
      background: statusColors[order.status] || '#6c757d',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px'
    }}>
      {order.status}
    </span>
  );
};
```

---

## 🔧 Configuration rapide

### Variables d'environnement (.env) :

```bash
# .env
REACT_APP_API_URL=http://localhost:3000
```

### Import global (optionnel) :

```javascript
// utils/api.js
import OrderService from '../services/OrderService';

// Rendre disponible globalement pour les tests
window.OrderService = OrderService;

export default OrderService;
```

---

## 🚨 Dépannage Express

### Problème : Erreur 403 "Forbidden"

```javascript
// Solution rapide - Tester dans la console
fetch('/api/orders/test-auth', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);

// Si ça ne marche pas, vérifier les cookies
console.log('Cookies:', document.cookie);
```

### Problème : CORS

```javascript
// Vérifier l'URL de l'API
console.log('API URL:', process.env.REACT_APP_API_URL || window.location.origin);

// Tester avec l'URL complète
fetch('http://localhost:3000/orders/test-auth', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

### Problème : Token expiré

```javascript
// Forcer la reconnexion
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

---

## 📚 Ressources complètes

- **Guide complet :** `FRONTEND_COMPLETE_INTEGRATION_GUIDE.md`
- **Dépannage :** `FRONTEND_ACCESS_TROUBLESHOOTING.md`
- **Script de diagnostic :** `test-frontend-access.js`
- **Documentation API :** `ORDER_SYSTEM_DOCUMENTATION.md`

---

## ✅ Checklist finale

- [ ] Service OrderService intégré
- [ ] Premier composant fonctionnel
- [ ] Tests de base passés
- [ ] Gestion d'erreurs basique
- [ ] Prêt pour l'intégration complète

**🎉 Félicitations ! Votre système de commandes est opérationnel !**

Pour aller plus loin, consultez le guide complet d'intégration avec tous les composants avancés, la gestion d'erreurs sophistiquée, et les exemples de production. 