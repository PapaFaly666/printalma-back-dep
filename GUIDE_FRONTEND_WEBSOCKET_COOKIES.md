# 🚀 Guide Frontend WebSocket - PrintAlma (Authentification Cookies)

## 🎯 Objectif

Intégrer les notifications temps réel dans votre frontend React pour recevoir instantanément :
- ✅ **Nouvelles commandes** (pour les admins)
- ✅ **Changements de statut** (pour admins et clients)
- ✅ **Notifications navigateur** automatiques

## 🔧 Installation Rapide

```bash
npm install socket.io-client
```

## 📁 Structure des Fichiers

```
src/
├── services/
│   └── WebSocketService.js     ← Service principal
├── hooks/
│   └── useWebSocket.js         ← Hook React
└── components/
    ├── AdminNotifications.jsx  ← Composant admin
    └── ClientNotifications.jsx ← Composant client
```

## 🔌 Service WebSocket (src/services/WebSocketService.js)

**Code prêt à copier-coller :**

```javascript
// src/services/WebSocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
    this.listeners = {
      newOrder: [],
      orderStatusChanged: [],
      myOrderUpdated: []
    };
  }

  // 🔌 Connexion avec cookies automatiques
  connect() {
    console.log('🔌 Connexion WebSocket...');
    
    this.socket = io(`${this.baseURL}/orders`, {
      withCredentials: true, // ⭐ ESSENTIEL: Envoie les cookies automatiquement
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
    return true;
  }

  // 🎧 Configuration des événements
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket déconnecté:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur WebSocket:', error.message);
      
      if (error.message.includes('401')) {
        console.error('🔐 Non authentifié - redirection vers login');
        this.handleAuthError();
      }
    });

    // 🆕 Nouvelles commandes (admins seulement)
    this.socket.on('newOrder', (notification) => {
      console.log('🆕 Nouvelle commande:', notification);
      this.triggerListeners('newOrder', notification);
      this.showBrowserNotification(notification);
    });

    // 📝 Changements de statut (admins)
    this.socket.on('orderStatusChanged', (notification) => {
      console.log('📝 Statut changé:', notification);
      this.triggerListeners('orderStatusChanged', notification);
    });

    // 📦 Mes commandes mises à jour (clients)
    this.socket.on('myOrderUpdated', (notification) => {
      console.log('📦 Ma commande mise à jour:', notification);
      this.triggerListeners('myOrderUpdated', notification);
      this.showBrowserNotification(notification);
    });
  }

  // 🔐 Gestion erreur auth
  handleAuthError() {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // 🔔 Déclencher les callbacks
  triggerListeners(event, data) {
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Erreur listener ${event}:`, error);
      }
    });
  }

  // 📱 Notification navigateur
  async showBrowserNotification(notification) {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    if (Notification.permission === 'granted') {
      const notif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });

      setTimeout(() => notif.close(), 5000);
    }
  }

  // 🎯 Méthodes d'abonnement
  onNewOrder(callback) {
    this.listeners.newOrder.push(callback);
  }

  onOrderStatusChanged(callback) {
    this.listeners.orderStatusChanged.push(callback);
  }

  onMyOrderUpdated(callback) {
    this.listeners.myOrderUpdated.push(callback);
  }

  // 🔌 Déconnexion
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // 📊 État de connexion
  isConnectedToWebSocket() {
    return this.isConnected;
  }

  getSocketId() {
    return this.socket?.id || null;
  }
}

// Export singleton
export default new WebSocketService();
```

## 🪝 Hook React (src/hooks/useWebSocket.js)

```javascript
// src/hooks/useWebSocket.js
import { useEffect, useState } from 'react';
import WebSocketService from '../services/WebSocketService';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Connecter WebSocket
    WebSocketService.connect();

    // Vérifier le statut de connexion
    const checkConnection = () => {
      setIsConnected(WebSocketService.isConnectedToWebSocket());
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    return () => {
      clearInterval(interval);
      WebSocketService.disconnect();
    };
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => [
      { ...notification, id: Date.now() },
      ...prev.slice(0, 9) // Garder 10 max
    ]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    isConnected,
    notifications,
    addNotification,
    clearNotifications,
    webSocketService: WebSocketService
  };
};
```

## 👑 Composant Admin (src/components/AdminNotifications.jsx)

```jsx
// src/components/AdminNotifications.jsx
import React, { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const AdminNotifications = () => {
  const { isConnected, notifications, addNotification, webSocketService } = useWebSocket();

  useEffect(() => {
    // Écouter les nouvelles commandes
    const handleNewOrder = (notification) => {
      addNotification(notification);
      console.log('🆕 Nouvelle commande pour admin:', notification);
      
      // Optionnel: jouer un son
      playNotificationSound();
    };

    // Écouter les changements de statut
    const handleStatusChange = (notification) => {
      addNotification(notification);
      console.log('📝 Changement de statut:', notification);
    };

    // S'abonner aux événements
    webSocketService.onNewOrder(handleNewOrder);
    webSocketService.onOrderStatusChanged(handleStatusChange);

  }, [webSocketService, addNotification]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3'); // Ajoutez ce fichier dans public/
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // Son optionnel
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="admin-notifications">
      {/* Indicateur de connexion */}
      <div className={`websocket-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {isConnected ? '🟢 Temps réel activé' : '🔴 Déconnecté'}
      </div>

      {/* Panel notifications */}
      <div className="notifications-panel">
        <div className="panel-header">
          <h3>🔔 Notifications ({notifications.length})</h3>
          {notifications.length > 0 && (
            <button onClick={clearAllNotifications} className="clear-btn">
              Effacer tout
            </button>
          )}
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="no-notifications">
              <p>🔔 En attente de notifications...</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={`notification-item ${notif.type}`}>
                <div className="notification-header">
                  <strong className="notification-title">{notif.title}</strong>
                  <span className="notification-time">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="notification-message">{notif.message}</div>
                {notif.data && (
                  <div className="notification-details">
                    <span>📦 ID: {notif.data.orderId}</span>
                    {notif.data.customerName && (
                      <span>👤 {notif.data.customerName}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
```

## 👤 Composant Client (src/components/ClientNotifications.jsx)

```jsx
// src/components/ClientNotifications.jsx
import React, { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const ClientNotifications = () => {
  const { isConnected, notifications, addNotification, webSocketService } = useWebSocket();

  useEffect(() => {
    // Écouter les mises à jour de mes commandes
    const handleMyOrderUpdate = (notification) => {
      addNotification(notification);
      console.log('📦 Ma commande mise à jour:', notification);
    };

    webSocketService.onMyOrderUpdated(handleMyOrderUpdate);
  }, [webSocketService, addNotification]);

  return (
    <div className="client-notifications">
      <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Suivi temps réel' : '🔴 Hors ligne'}
      </div>

      {notifications.length > 0 && (
        <div className="my-notifications">
          <h4>📨 Mises à jour récentes</h4>
          {notifications.map(notif => (
            <div key={notif.id} className="notification-card">
              <div className="card-header">
                <strong>{notif.title}</strong>
                <small>{new Date(notif.timestamp).toLocaleTimeString()}</small>
              </div>
              <div className="card-body">{notif.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientNotifications;
```

## 🎨 CSS Styles (src/styles/websocket.css)

```css
/* WebSocket Notifications Styles */
.websocket-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
}

.websocket-status.connected {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.websocket-status.disconnected {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.notifications-panel {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.panel-header h3 {
  margin: 0;
  color: #495057;
}

.clear-btn {
  padding: 4px 8px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.clear-btn:hover {
  background: #5a6268;
}

.notifications-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.no-notifications {
  text-align: center;
  padding: 32px;
  color: #6c757d;
}

.notification-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border-left: 4px solid;
  animation: slideIn 0.3s ease-out;
}

.notification-item.NEW_ORDER {
  background: #e7f3ff;
  border-left-color: #007bff;
}

.notification-item.ORDER_STATUS_CHANGED {
  background: #fff3e0;
  border-left-color: #fd7e14;
}

.notification-item.MY_ORDER_UPDATED {
  background: #e8f5e8;
  border-left-color: #28a745;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.notification-title {
  color: #212529;
  font-size: 14px;
}

.notification-time {
  color: #6c757d;
  font-size: 12px;
}

.notification-message {
  color: #495057;
  font-size: 13px;
  margin-bottom: 6px;
}

.notification-details {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #6c757d;
}

.notification-details span {
  background: rgba(0,0,0,0.05);
  padding: 2px 6px;
  border-radius: 3px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Client notifications */
.client-notifications {
  max-width: 400px;
}

.status-indicator {
  padding: 8px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  margin-bottom: 16px;
}

.status-indicator.connected {
  background: #d4edda;
  color: #155724;
}

.status-indicator.disconnected {
  background: #f8d7da;
  color: #721c24;
}

.notification-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.card-body {
  color: #495057;
  font-size: 14px;
}
```

## 🚀 Utilisation dans votre App

### Pour les Admins

```jsx
// Dans votre AdminDashboard.jsx
import AdminNotifications from './components/AdminNotifications';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1>Dashboard Admin</h1>
      
      {/* Ajouter les notifications WebSocket */}
      <AdminNotifications />
      
      {/* Reste de votre dashboard */}
      <div className="dashboard-content">
        {/* Vos composants existants */}
      </div>
    </div>
  );
};
```

### Pour les Clients

```jsx
// Dans votre ClientDashboard.jsx ou Orders.jsx
import ClientNotifications from './components/ClientNotifications';

const ClientOrders = () => {
  return (
    <div className="client-orders">
      <h1>Mes Commandes</h1>
      
      {/* Ajouter les notifications WebSocket */}
      <ClientNotifications />
      
      {/* Liste des commandes */}
      <div className="orders-list">
        {/* Vos commandes existantes */}
      </div>
    </div>
  );
};
```

## 🧪 Test Rapide

1. **Copiez les fichiers** ci-dessus dans votre projet
2. **Importez les styles** CSS
3. **Connectez-vous** en tant qu'admin sur votre frontend
4. **Ouvrez la console** du navigateur (F12)
5. **Vérifiez** les logs : `✅ WebSocket connecté`
6. **Créez une commande** depuis un autre onglet/client
7. **Vérifiez** que l'admin reçoit la notification

## 🔧 Configuration Environment

Créez/modifiez votre `.env` :

```env
REACT_APP_API_URL=http://localhost:3004
```

## 📞 Support/Debug

Si ça ne marche pas :

1. **Console navigateur** : Vérifiez les erreurs WebSocket
2. **Cookies** : `document.cookie` doit contenir `auth_token`
3. **Backend** : Vérifiez que les logs montrent `🍪 Token trouvé dans les cookies`
4. **Connexion** : L'utilisateur doit être connecté AVANT WebSocket

## ✅ Résumé

1. ✅ **Copiez** le service WebSocketService.js
2. ✅ **Copiez** le hook useWebSocket.js  
3. ✅ **Copiez** les composants AdminNotifications et ClientNotifications
4. ✅ **Ajoutez** les styles CSS
5. ✅ **Intégrez** dans vos pages existantes
6. ✅ **Testez** la connexion et les notifications

**Votre système de notifications temps réel est prêt ! 🎉** 