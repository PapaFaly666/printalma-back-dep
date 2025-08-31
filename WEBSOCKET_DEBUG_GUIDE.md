# 🔧 Guide de Débogage WebSocket - PrintAlma

## 🚨 Problème: Les admins ne reçoivent pas les notifications en temps réel

### ✅ Vérifications Backend (Déjà OK)

1. **OrderGateway configuré** ✅
2. **OrderService appelle notifyNewOrder** ✅  
3. **Module correctement configuré** ✅

### 🔍 Points de Débogage à Vérifier

## 1. 🌐 Vérification Serveur WebSocket

### Test 1: Lancer le serveur et vérifier les logs
```bash
cd printalma-back
npm run start
```

**Vérifiez dans les logs:**
- ✅ `[Nest] Application successfully started`
- ✅ Aucune erreur WebSocket au démarrage

### Test 2: Vérifier les dépendances WebSocket
```bash
npm list @nestjs/websockets @nestjs/platform-socket.io socket.io
```

**Si manquantes:**
```bash
npm install @nestjs/websockets@^10.0.0 @nestjs/platform-socket.io@^10.0.0 socket.io --legacy-peer-deps
```

## 2. 🧪 Test de Connexion WebSocket

### Étape 1: Installer le client de test
```bash
npm install socket.io-client
```

### Étape 2: Test avec le script
```bash
node test-websocket-real.js
```

**Résultats attendus:**
```
✅ Admin connecté au WebSocket: xyz123
✅ Pong reçu: { message: 'Connexion WebSocket active', ... }
📈 Statistiques WebSocket:
👑 Admins connectés: 1
```

## 3. 🔐 Problèmes d'Authentification WebSocket

### Vérification Token JWT

**Test avec curl:**
```bash
# Test auth normale
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3004/orders/test-auth

# Test admin
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" http://localhost:3004/orders/test-admin
```

### Configuration Frontend WebSocket

**❌ Configurations incorrectes courantes:**
```javascript
// INCORRECT - token manquant
const socket = io('http://localhost:3004/orders');

// INCORRECT - mauvais format token
const socket = io('http://localhost:3004/orders', {
  query: { authorization: token } // Devrait être 'token'
});

// INCORRECT - namespace manquant
const socket = io('http://localhost:3004'); // Manque /orders
```

**✅ Configuration correcte:**
```javascript
const socket = io('http://localhost:3004/orders', {
  auth: {
    token: localStorage.getItem('authToken') // Récupère le token stocké
  },
  transports: ['websocket', 'polling'], // Fallback
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

## 4. 🎯 Service Frontend WebSocket Complet

```javascript
// services/WebSocketService.js
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {
      newOrder: [],
      orderStatusChanged: [],
      myOrderUpdated: []
    };
  }

  connect() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.error('❌ Pas de token pour WebSocket');
      return;
    }

    console.log('🔌 Connexion WebSocket...');
    
    this.socket = io('http://localhost:3004/orders', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté:', this.socket.id);
      this.isConnected = true;
      this.testConnection();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket déconnecté:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion WebSocket:', error.message);
      
      // Diagnostics
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.error('🔐 Problème d\'authentification - vérifiez votre token');
      }
    });

    // Écouter les nouvelles commandes (admins)
    this.socket.on('newOrder', (notification) => {
      console.log('🆕 NOUVELLE COMMANDE:', notification);
      this.triggerListeners('newOrder', notification);
      this.showBrowserNotification(notification);
    });

    // Écouter les changements de statut (admins)
    this.socket.on('orderStatusChanged', (notification) => {
      console.log('📝 STATUT CHANGÉ:', notification);
      this.triggerListeners('orderStatusChanged', notification);
    });

    // Écouter les mises à jour de mes commandes (clients)
    this.socket.on('myOrderUpdated', (notification) => {
      console.log('📦 MA COMMANDE MISE À JOUR:', notification);
      this.triggerListeners('myOrderUpdated', notification);
      this.showBrowserNotification(notification);
    });

    this.socket.on('pong', (data) => {
      console.log('🏓 Pong reçu:', data);
    });
  }

  testConnection() {
    if (this.socket && this.isConnected) {
      console.log('🏓 Test ping...');
      this.socket.emit('ping', { timestamp: new Date().toISOString() });
    }
  }

  triggerListeners(event, data) {
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Erreur listener ${event}:`, error);
      }
    });
  }

  // Abonnement aux événements
  onNewOrder(callback) {
    this.listeners.newOrder.push(callback);
  }

  onOrderStatusChanged(callback) {
    this.listeners.orderStatusChanged.push(callback);
  }

  onMyOrderUpdated(callback) {
    this.listeners.myOrderUpdated.push(callback);
  }

  // Notifications navigateur
  async showBrowserNotification(notification) {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket déconnecté');
    }
  }

  // Getters
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }
}

// Export singleton
const webSocketService = new WebSocketService();
export default webSocketService;
```

## 5. 🎯 Intégration React Admin Dashboard

```jsx
// components/AdminNotifications.jsx
import React, { useEffect, useState } from 'react';
import webSocketService from '../services/WebSocketService';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(false);

  useEffect(() => {
    // Connecter WebSocket
    webSocketService.connect();

    // Écouter les nouvelles commandes
    webSocketService.onNewOrder((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Garder 10 max
      
      // Jouer un son
      playNotificationSound();
    });

    // Écouter les changements de statut
    webSocketService.onOrderStatusChanged((notification) => {
      setNotifications(prev => [notification, ...prev.slice(0, 9)]);
    });

    // Vérifier le statut de connexion
    const interval = setInterval(() => {
      const status = webSocketService.getConnectionStatus();
      setConnectionStatus(status.connected);
    }, 1000);

    return () => {
      clearInterval(interval);
      webSocketService.disconnect();
    };
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3'); // Ajoutez un fichier son
      audio.play().catch(e => console.log('Son désactivé'));
    } catch (error) {
      console.log('Pas de son disponible');
    }
  };

  return (
    <div className="admin-notifications">
      {/* Indicateur de connexion */}
      <div className={`connection-status ${connectionStatus ? 'connected' : 'disconnected'}`}>
        <span>{connectionStatus ? '🟢 WebSocket Connecté' : '🔴 WebSocket Déconnecté'}</span>
      </div>

      {/* Liste des notifications */}
      <div className="notifications-list">
        <h3>📨 Notifications Temps Réel</h3>
        {notifications.length === 0 ? (
          <p>Aucune notification récente</p>
        ) : (
          notifications.map((notif, index) => (
            <div key={index} className={`notification notification-${notif.type}`}>
              <div className="notification-header">
                <strong>{notif.title}</strong>
                <small>{new Date(notif.timestamp).toLocaleTimeString()}</small>
              </div>
              <div className="notification-message">
                {notif.message}
              </div>
              {notif.data && (
                <div className="notification-data">
                  <small>ID: {notif.data.orderId} | {notif.data.customerName}</small>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
```

## 6. 🎨 CSS pour les Notifications

```css
/* styles/notifications.css */
.admin-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  max-height: 500px;
  overflow-y: auto;
  z-index: 1000;
}

.connection-status {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-weight: bold;
}

.connection-status.connected {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.connection-status.disconnected {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.notifications-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.notification {
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  border-left: 4px solid;
  animation: slideIn 0.3s ease-out;
}

.notification-NEW_ORDER {
  background: #e7f3ff;
  border-left-color: #2196f3;
}

.notification-ORDER_STATUS_CHANGED {
  background: #fff3e0;
  border-left-color: #ff9800;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}

.notification-message {
  font-size: 14px;
  margin-bottom: 5px;
}

.notification-data {
  font-size: 12px;
  color: #666;
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
```

## 7. 🚀 Checklist de Débogage

### ✅ Backend
- [ ] Serveur démarré sans erreur
- [ ] Dépendances WebSocket installées
- [ ] Logs de connexion visibles
- [ ] `test-websocket-real.js` fonctionne

### ✅ Frontend
- [ ] Token JWT valide et stocké
- [ ] WebSocket se connecte (voir console)
- [ ] Événements écoutés correctement
- [ ] Notifications affichées

### ✅ Test Complet
- [ ] Admin connecté via WebSocket
- [ ] Client crée une commande
- [ ] Admin reçoit notification instantanée
- [ ] Changement de statut notifié

## 🛠️ Script de Test Rapide

```bash
# 1. Installer les dépendances
npm install socket.io-client

# 2. Tester la connexion
node test-websocket-real.js

# 3. Vérifier les stats WebSocket
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     http://localhost:3004/orders/admin/websocket-stats
```

## 📞 Si ça ne marche toujours pas

1. **Vérifiez les logs serveur** pendant le test
2. **Vérifiez la console navigateur** pour les erreurs
3. **Testez avec Postman** les endpoints REST
4. **Vérifiez le pare-feu** (port 3004)
5. **Testez en local** d'abord avant déploiement

Cette configuration devrait résoudre tous les problèmes WebSocket ! 🚀 