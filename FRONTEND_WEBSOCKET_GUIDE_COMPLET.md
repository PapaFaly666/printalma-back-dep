# 🚀 Guide Complet WebSocket Frontend - PrintAlma

## 🔴 IMPORTANT: Authentification par Cookie

**Votre backend utilise des cookies httpOnly (`auth_token`) pour l'authentification, pas localStorage !**

⚠️ **Problème identifié:** Le service WebSocket standard ne peut pas accéder aux cookies httpOnly depuis JavaScript. Il faut adapter l'approche.

## 🛠️ Solutions pour WebSocket avec Cookies

### 🎯 Solution 1: WebSocket avec Credentials (Recommandée)

Les WebSockets peuvent automatiquement envoyer les cookies si configurés correctement.

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

  // 🔌 Connexion WebSocket avec cookies
  connect() {
    console.log('🔌 Connexion WebSocket avec cookies...');
    
    this.socket = io(`${this.baseURL}/orders`, {
      // ⭐ CONFIGURATION IMPORTANTE POUR COOKIES
      withCredentials: true, // Envoie automatiquement les cookies
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      // ❌ Pas d'auth.token car on utilise les cookies
    });

    this.setupEventListeners();
    return true;
  }

  // 🎧 Configuration des événements
  setupEventListeners() {
    // Connexion réussie
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté:', this.socket.id);
      this.isConnected = true;
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket déconnecté:', reason);
      this.isConnected = false;
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur WebSocket:', error.message);
      
      if (error.message.includes('401')) {
        console.error('🔐 Cookie d\'authentification manquant ou expiré');
        // Optionnel: rediriger vers login
        this.handleAuthError();
      }
    });

    // 🆕 Nouvelles commandes (pour admins)
    this.socket.on('newOrder', (notification) => {
      console.log('🆕 Nouvelle commande:', notification);
      this.triggerListeners('newOrder', notification);
      this.showNotification(notification);
    });

    // 📝 Changements de statut (pour admins)
    this.socket.on('orderStatusChanged', (notification) => {
      console.log('📝 Statut changé:', notification);
      this.triggerListeners('orderStatusChanged', notification);
    });

    // 📦 Mes commandes mises à jour (pour clients)
    this.socket.on('myOrderUpdated', (notification) => {
      console.log('📦 Ma commande mise à jour:', notification);
      this.triggerListeners('myOrderUpdated', notification);
      this.showNotification(notification);
    });
  }

  // 🔐 Gestion erreur d'authentification
  handleAuthError() {
    // Rediriger vers la page de connexion
    if (window.location.pathname !== '/login') {
      console.log('🔄 Redirection vers la page de connexion...');
      window.location.href = '/login';
    }
  }

  // 🔔 Gestion des callbacks
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
  async showNotification(notification) {
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

  // 📊 Statut
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

### 🔧 Solution 2: Récupérer le Token via API (Alternative)

Si la solution 1 ne fonctionne pas, voici une alternative:

```javascript
// src/services/WebSocketService.js (Version alternative)
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
    this.authToken = null;
    this.listeners = {
      newOrder: [],
      orderStatusChanged: [],
      myOrderUpdated: []
    };
  }

  // 🔐 Récupérer le token via l'API
  async getAuthToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/websocket-token`, {
        credentials: 'include', // Envoie les cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.authToken = data.token;
        return data.token;
      } else {
        console.error('❌ Impossible de récupérer le token WebSocket');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
      return null;
    }
  }

  // 🔌 Connexion WebSocket avec token récupéré
  async connect() {
    console.log('🔌 Récupération du token pour WebSocket...');
    
    const token = await this.getAuthToken();
    if (!token) {
      console.error('❌ Impossible de se connecter au WebSocket: pas de token');
      return false;
    }

    console.log('🔌 Connexion WebSocket avec token...');
    
    this.socket = io(`${this.baseURL}/orders`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupEventListeners();
    return true;
  }

  // ... reste du code identique à la solution 1
}
```

### 🛠️ Modification Backend Requise (Solution 2)

Si vous choisissez la solution 2, ajoutez cet endpoint dans votre `auth.controller.ts`:

```typescript
@UseGuards(JwtAuthGuard)
@Get('websocket-token')
async getWebSocketToken(@Req() req: RequestWithUser) {
  // Générer un token temporaire pour WebSocket (valide 1 heure)
  const payload = {
    sub: req.user.sub,
    email: req.user.email,
    role: req.user.role,
    vendeur_type: req.user.vendeur_type,
    type: 'websocket'
  };

  const token = this.jwtService.sign(payload, { expiresIn: '1h' });

  return {
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  };
}
```

## 🧪 Test avec Script Adapté

Modifiez votre script de test `test-websocket-simple.js`:

```javascript
// test-websocket-cookie.js
const { io } = require('socket.io-client');

console.log('🧪 Test WebSocket avec Cookies - PrintAlma\n');

// Configuration pour les cookies
const socket = io('http://localhost:3004/orders', {
  withCredentials: true, // ⭐ IMPORTANT: Envoie les cookies
  transports: ['websocket', 'polling'],
  timeout: 10000
});

// Gestion des événements
socket.on('connect', () => {
  console.log('✅ SUCCÈS: WebSocket connecté avec cookies !');
  console.log('Socket ID:', socket.id);
  
  // Test ping immédiat
  console.log('\n🏓 Test ping...');
  socket.emit('ping', { test: true, timestamp: new Date().toISOString() });
});

socket.on('connect_error', (error) => {
  console.error('❌ ERREUR de connexion:', error.message);
  
  if (error.message.includes('401') || error.message.includes('unauthorized')) {
    console.log(`
🔐 PROBLÈME D'AUTHENTIFICATION:
- Assurez-vous d'être connecté dans votre navigateur
- Le cookie 'auth_token' doit être présent
- Essayez de vous reconnecter sur votre frontend
    `);
  }
  
  socket.disconnect();
  process.exit(1);
});

// ... reste du code identique
```

## 📋 Vue d'Ensemble

Ce guide vous aide à intégrer les notifications temps réel WebSocket dans votre frontend PrintAlma. Votre backend est **déjà configuré** et fonctionnel - il vous suffit de connecter votre frontend.

## 🎯 Fonctionnalités

- ✅ **Notifications instantanées** de nouvelles commandes pour les admins
- ✅ **Notifications de changement de statut** pour les admins et clients
- ✅ **Reconnexion automatique** en cas de déconnexion
- ✅ **Notifications navigateur** avec son (optionnel)
- ✅ **Interface temps réel** sans rafraîchissement de page

## 🔧 Installation

### 1. Installer socket.io-client

```bash
npm install socket.io-client
# ou
yarn add socket.io-client
```

### 2. ⚠️ Choisir Votre Solution

- **Solution 1 (Recommandée):** Utiliser `withCredentials: true` 
- **Solution 2:** Créer un endpoint pour récupérer le token

**→ Commencez par la Solution 1, c'est plus simple !**

## 🎯 Intégration React

### 1. Hook personnalisé pour WebSocket

Créez `src/hooks/useWebSocket.js`:

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

    // Vérifier le statut
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

### 2. Composant Admin Dashboard

```jsx
// src/components/AdminDashboard.jsx
import React, { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const AdminDashboard = () => {
  const { isConnected, notifications, addNotification, webSocketService } = useWebSocket();

  useEffect(() => {
    // Écouter les nouvelles commandes
    const handleNewOrder = (notification) => {
      addNotification(notification);
      
      // Actions spécifiques aux nouvelles commandes
      console.log('🆕 Nouvelle commande admin:', notification);
      
      // Optionnel: jouer un son
      playNotificationSound();
      
      // Optionnel: rafraîchir la liste des commandes
      // refreshOrdersList();
    };

    // Écouter les changements de statut
    const handleStatusChange = (notification) => {
      addNotification(notification);
      console.log('📝 Changement de statut:', notification);
    };

    // S'abonner aux événements
    webSocketService.onNewOrder(handleNewOrder);
    webSocketService.onOrderStatusChanged(handleStatusChange);

    // Pas de nettoyage nécessaire car c'est un singleton
  }, [webSocketService, addNotification]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (error) {
      // Son optionnel
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Indicateur de connexion */}
      <div className={`websocket-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Temps réel activé' : '🔴 Déconnecté'}
      </div>

      {/* Notifications récentes */}
      <div className="recent-notifications">
        <h3>🔔 Notifications récentes</h3>
        {notifications.length === 0 ? (
          <p>Aucune notification</p>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="notification-item">
              <strong>{notif.title}</strong>
              <p>{notif.message}</p>
              <small>{new Date(notif.timestamp).toLocaleTimeString()}</small>
            </div>
          ))
        )}
      </div>

      {/* Reste de votre dashboard */}
      <div className="dashboard-content">
        {/* Vos composants existants */}
      </div>
    </div>
  );
};

export default AdminDashboard;
```

### 3. Composant Client (pour notifications de ses commandes)

```jsx
// src/components/ClientOrders.jsx
import React, { useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const ClientOrders = () => {
  const { isConnected, notifications, addNotification, webSocketService } = useWebSocket();

  useEffect(() => {
    // Écouter les mises à jour de mes commandes
    const handleMyOrderUpdate = (notification) => {
      addNotification(notification);
      
      console.log('📦 Ma commande mise à jour:', notification);
      
      // Rafraîchir la liste des commandes du client
      // refreshMyOrders();
    };

    webSocketService.onMyOrderUpdated(handleMyOrderUpdate);
  }, [webSocketService, addNotification]);

  return (
    <div className="client-orders">
      <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Suivi temps réel' : '🔴 Hors ligne'}
      </div>

      {/* Notifications de mes commandes */}
      {notifications.length > 0 && (
        <div className="my-notifications">
          <h4>📨 Mises à jour récentes</h4>
          {notifications.map(notif => (
            <div key={notif.id} className="notification">
              <strong>{notif.title}</strong>
              <p>{notif.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste des commandes */}
      <div className="orders-list">
        {/* Vos commandes existantes */}
      </div>
    </div>
  );
};

export default ClientOrders;
```

## 🎨 Styles CSS

```css
/* src/styles/websocket.css */
.websocket-status {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: bold;
  display: inline-block;
  margin-bottom: 20px;
}

.websocket-status.connected {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.websocket-status.disconnected {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.recent-notifications {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.notification-item {
  padding: 12px;
  border-left: 4px solid #007bff;
  background: #f8f9fa;
  margin-bottom: 10px;
  border-radius: 4px;
}

.notification-item strong {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.notification-item p {
  margin: 0 0 5px 0;
  color: #666;
}

.notification-item small {
  color: #999;
  font-size: 12px;
}
```

## 🔧 Configuration avancée

### Variables d'environnement

Créez `.env` dans votre frontend:

```env
# .env
REACT_APP_API_URL=http://localhost:3004
REACT_APP_WEBSOCKET_ENABLED=true
```

### Service avec configuration avancée

```javascript
// src/services/WebSocketService.js (version avancée)
class WebSocketService {
  constructor() {
    this.config = {
      enabled: process.env.REACT_APP_WEBSOCKET_ENABLED === 'true',
      url: process.env.REACT_APP_API_URL || 'http://localhost:3004',
      reconnectAttempts: 5,
      reconnectDelay: 1000
    };
  }

  connect() {
    if (!this.config.enabled) {
      console.log('WebSocket désactivé par configuration');
      return false;
    }

    // Reste du code...
  }
}
```

## 🧪 Test et Débogage

### 1. Test de connexion

```javascript
// Dans la console de votre navigateur
// ❌ Ne fonctionne plus: console.log('Token:', localStorage.getItem('authToken'));
// ✅ Nouveau test:
document.cookie.includes('auth_token') 
  ? console.log('✅ Cookie auth_token présent') 
  : console.log('❌ Cookie auth_token absent');
```

### 2. Test avec script backend

Créez `test-websocket-cookie.js`:
```bash
# Terminal - depuis votre dossier backend
node test-websocket-cookie.js
```

### 3. Vérifier les événements

```javascript
// Ajouter dans votre composant pour déboguer
useEffect(() => {
  const originalConsole = console.log;
  console.log = (...args) => {
    if (args[0]?.includes('WebSocket') || args[0]?.includes('🆕')) {
      // Afficher dans l'interface pour debug
      originalConsole(...args);
    }
  };
}, []);
```

## ⚡ Optimisations

### 1. Limitation des notifications

```javascript
const MAX_NOTIFICATIONS = 10;
const NOTIFICATION_TIMEOUT = 30000; // 30 secondes

// Dans votre hook
const addNotification = (notification) => {
  const notificationWithTimeout = {
    ...notification,
    id: Date.now(),
    expiresAt: Date.now() + NOTIFICATION_TIMEOUT
  };

  setNotifications(prev => {
    const filtered = prev.filter(n => n.expiresAt > Date.now());
    return [notificationWithTimeout, ...filtered.slice(0, MAX_NOTIFICATIONS - 1)];
  });
};
```

### 2. Connexion conditionnelle

```javascript
// Connecter seulement pour les admins
useEffect(() => {
  // Vérifier le rôle via l'API
  fetch('/api/auth/check', { credentials: 'include' })
    .then(res => res.json())
    .then(data => {
      if (data.user?.role === 'ADMIN' || data.user?.role === 'SUPER_ADMIN') {
        WebSocketService.connect();
      }
    });
}, []);
```

## 🚀 Déploiement

### Production

```javascript
// Mettre à jour l'URL pour la production
const WebSocketService = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://votre-api.com' 
    : 'http://localhost:3004'
};
```

## 📞 Support

Si vous rencontrez des problèmes:

1. **Vérifiez les cookies** dans les Dev Tools (Application > Cookies)
2. **Testez avec le script** `test-websocket-cookie.js`
3. **Vérifiez que vous êtes connecté** sur votre frontend
4. **Confirmez que le backend** fonctionne sur port 3004

## 🎯 Résumé

1. **Utilisez** `withCredentials: true` dans la configuration WebSocket
2. **Supprimez** toute référence à localStorage pour l'auth
3. **Testez** la connexion avec les cookies
4. **Vérifiez** que l'utilisateur est connecté avant WebSocket
5. **Implémentez** le service dans vos composants React

Votre système de notifications temps réel est maintenant prêt avec authentification par cookies ! 🎉 