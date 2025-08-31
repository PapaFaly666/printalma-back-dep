# 🔥 Service WebSocket Frontend - PrintAlma (Version Améliorée)

## 🚀 Vue d'Ensemble

Service WebSocket complet pour recevoir les notifications temps réel des commandes. Cette version inclut une gestion d'erreur améliorée et des outils de débogage.

## 📱 Service WebSocket Principal

```javascript
// services/WebSocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.baseURL = 'http://localhost:3004'; // Ajustez selon votre config
    this.listeners = {
      newOrder: [],
      orderStatusChanged: [],
      myOrderUpdated: []
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  // 🔌 Connexion WebSocket
  connect() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      console.error('❌ Pas de token JWT pour WebSocket');
      return false;
    }

    console.log('🔌 Connexion WebSocket à', `${this.baseURL}/orders`);
    
    this.socket = io(`${this.baseURL}/orders`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000
    });

    this.setupEventListeners();
    return true;
  }

  // 🎧 Configuration des écouteurs d'événements
  setupEventListeners() {
    if (!this.socket) return;

    // Connexion réussie
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Test de la connexion
      this.testConnection();
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket déconnecté:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Déconnexion côté serveur - tentative de reconnexion
        console.log('🔄 Tentative de reconnexion...');
        setTimeout(() => this.socket?.connect(), 1000);
      }
    });

    // Erreur de connexion
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur connexion WebSocket:', error.message);
      this.isConnected = false;
      this.reconnectAttempts++;
      
      // Diagnostics spécifiques
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        console.error('🔐 Problème d\'authentification - Token expiré ou invalide');
        this.handleAuthError();
      } else if (error.message.includes('timeout')) {
        console.error('⏱️ Timeout de connexion');
      } else if (error.message.includes('CORS')) {
        console.error('🌐 Problème CORS');
      }

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('🚫 Nombre maximum de tentatives de reconnexion atteint');
        this.disconnect();
      }
    });

    // 🆕 Écouter les nouvelles commandes (pour admins)
    this.socket.on('newOrder', (notification) => {
      console.log('🆕 NOUVELLE COMMANDE REÇUE:', notification);
      this.triggerListeners('newOrder', notification);
      this.showBrowserNotification(notification);
      this.playNotificationSound();
    });

    // 📝 Écouter les changements de statut (pour admins)
    this.socket.on('orderStatusChanged', (notification) => {
      console.log('📝 STATUT DE COMMANDE CHANGÉ:', notification);
      this.triggerListeners('orderStatusChanged', notification);
    });

    // 📦 Écouter les mises à jour de mes commandes (pour clients)
    this.socket.on('myOrderUpdated', (notification) => {
      console.log('📦 MA COMMANDE MISE À JOUR:', notification);
      this.triggerListeners('myOrderUpdated', notification);
      this.showBrowserNotification(notification);
    });

    // 🏓 Réponse au ping
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong reçu:', data);
    });

    // Erreur générique
    this.socket.on('error', (error) => {
      console.error('❌ Erreur WebSocket:', error);
    });
  }

  // 🏓 Test de connexion
  testConnection() {
    if (this.socket && this.isConnected) {
      console.log('🏓 Test ping WebSocket...');
      this.socket.emit('ping', { 
        timestamp: new Date().toISOString(),
        test: true 
      });
    }
  }

  // 🔐 Gestion erreur d'authentification
  handleAuthError() {
    // Token probablement expiré
    localStorage.removeItem('authToken');
    
    // Rediriger vers la page de login ou afficher un message
    if (window.location.pathname !== '/login') {
      console.log('🔄 Redirection vers la page de connexion...');
      // window.location.href = '/login';
    }
  }

  // 🎯 Déclencher les callbacks
  triggerListeners(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Erreur dans listener ${event}:`, error);
      }
    });
  }

  // 🔔 Abonnements aux événements
  onNewOrder(callback) {
    if (typeof callback === 'function') {
      this.listeners.newOrder.push(callback);
    }
  }

  onOrderStatusChanged(callback) {
    if (typeof callback === 'function') {
      this.listeners.orderStatusChanged.push(callback);
    }
  }

  onMyOrderUpdated(callback) {
    if (typeof callback === 'function') {
      this.listeners.myOrderUpdated.push(callback);
    }
  }

  // 🔕 Désabonnement
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }

  // 🌐 Notifications navigateur
  async showBrowserNotification(notification) {
    if (!('Notification' in window)) {
      console.log('🚫 Notifications navigateur non supportées');
      return;
    }

    // Demander permission si nécessaire
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('🔔 Permission notifications:', permission);
    }
    
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'printalma-order',
          requireInteraction: false,
          silent: false
        });

        // Auto-fermer après 5 secondes
        setTimeout(() => notif.close(), 5000);

        notif.onclick = () => {
          window.focus();
          notif.close();
          // Optionnel: naviguer vers la commande
          if (notification.data?.orderId) {
            console.log('🔗 Navigation vers commande:', notification.data.orderId);
          }
        };
      } catch (error) {
        console.error('❌ Erreur notification navigateur:', error);
      }
    }
  }

  // 🔊 Son de notification
  playNotificationSound() {
    try {
      // Vous pouvez ajouter un fichier son dans /public/sounds/
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('🔇 Son de notification désactivé:', error.message);
      });
    } catch (error) {
      console.log('🔇 Pas de son de notification disponible');
    }
  }

  // 🔌 Déconnexion
  disconnect() {
    if (this.socket) {
      console.log('🔌 Déconnexion WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners = {
        newOrder: [],
        orderStatusChanged: [],
        myOrderUpdated: []
      };
    }
  }

  // 📊 Statut de connexion
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // 🔄 Reconnexion manuelle
  reconnect() {
    if (this.socket) {
      this.disconnect();
    }
    setTimeout(() => this.connect(), 1000);
  }

  // 🧪 Méthode de test
  sendTestMessage() {
    if (this.socket && this.isConnected) {
      this.socket.emit('ping', { 
        test: true, 
        timestamp: new Date().toISOString() 
      });
    } else {
      console.error('❌ WebSocket non connecté');
    }
  }
}

// Export singleton
const webSocketService = new WebSocketService();
export default webSocketService;
```

## 🎯 Composant React pour Admin

```jsx
// components/AdminWebSocketNotifications.jsx
import React, { useEffect, useState } from 'react';
import webSocketService from '../services/WebSocketService';

const AdminWebSocketNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    socketId: null
  });

  useEffect(() => {
    // Démarrer la connexion WebSocket
    const connected = webSocketService.connect();
    
    if (!connected) {
      console.error('❌ Impossible de démarrer WebSocket - Token manquant');
      return;
    }

    // Écouter les nouvelles commandes
    const handleNewOrder = (notification) => {
      console.log('🆕 Nouvelle commande dans le composant:', notification);
      setNotifications(prev => [
        { ...notification, id: Date.now() },
        ...prev.slice(0, 9) // Garder les 10 dernières
      ]);
    };

    // Écouter les changements de statut
    const handleStatusChange = (notification) => {
      console.log('📝 Changement de statut dans le composant:', notification);
      setNotifications(prev => [
        { ...notification, id: Date.now() + 1 },
        ...prev.slice(0, 9)
      ]);
    };

    // S'abonner aux événements
    webSocketService.onNewOrder(handleNewOrder);
    webSocketService.onOrderStatusChanged(handleStatusChange);

    // Vérifier le statut de connexion périodiquement
    const statusInterval = setInterval(() => {
      const status = webSocketService.getConnectionStatus();
      setConnectionStatus(status);
    }, 1000);

    // Nettoyage
    return () => {
      clearInterval(statusInterval);
      webSocketService.off('newOrder', handleNewOrder);
      webSocketService.off('orderStatusChanged', handleStatusChange);
      webSocketService.disconnect();
    };
  }, []);

  const handleTestConnection = () => {
    webSocketService.sendTestMessage();
  };

  const handleReconnect = () => {
    webSocketService.reconnect();
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <div className="admin-websocket-notifications">
      {/* Indicateur de statut */}
      <div className="connection-panel">
        <div className={`status-indicator ${connectionStatus.connected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot"></span>
          <span className="status-text">
            {connectionStatus.connected 
              ? `🟢 WebSocket Connecté (${connectionStatus.socketId?.substring(0, 8)}...)` 
              : '🔴 WebSocket Déconnecté'
            }
          </span>
        </div>
        
        <div className="connection-actions">
          <button onClick={handleTestConnection} disabled={!connectionStatus.connected}>
            🏓 Test Ping
          </button>
          <button onClick={handleReconnect}>
            🔄 Reconnecter
          </button>
          <button onClick={clearNotifications}>
            🗑️ Effacer
          </button>
        </div>
      </div>

      {/* Panneau de notifications */}
      <div className="notifications-panel">
        <h3>📨 Notifications Temps Réel ({notifications.length})</h3>
        
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>🔔 En attente de notifications...</p>
            <small>Les nouvelles commandes apparaîtront ici instantanément</small>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notif) => (
              <div key={notif.id} className={`notification ${notif.type}`}>
                <div className="notification-header">
                  <span className="notification-icon">
                    {notif.type === 'NEW_ORDER' ? '🆕' : '📝'}
                  </span>
                  <strong className="notification-title">{notif.title}</strong>
                  <span className="notification-time">
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="notification-message">
                  {notif.message}
                </div>
                
                {notif.data && (
                  <div className="notification-details">
                    <span className="detail-item">
                      📦 ID: {notif.data.orderId}
                    </span>
                    {notif.data.customerName && (
                      <span className="detail-item">
                        👤 {notif.data.customerName}
                      </span>
                    )}
                    {notif.data.totalAmount && (
                      <span className="detail-item">
                        💰 {notif.data.totalAmount}€
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWebSocketNotifications;
```

## 🎨 Styles CSS

```css
/* styles/websocket-notifications.css */
.admin-websocket-notifications {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 400px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid #e1e5e9;
  z-index: 1000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.connection-panel {
  padding: 16px;
  border-bottom: 1px solid #e1e5e9;
  background: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.connected .status-dot {
  background: #28a745;
}

.status-indicator.disconnected .status-dot {
  background: #dc3545;
}

.status-text {
  font-weight: 500;
  font-size: 14px;
}

.connection-actions {
  display: flex;
  gap: 8px;
}

.connection-actions button {
  padding: 6px 12px;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.connection-actions button:hover:not(:disabled) {
  background: #e9ecef;
}

.connection-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notifications-panel {
  padding: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.notifications-panel h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #495057;
}

.no-notifications {
  text-align: center;
  padding: 32px 16px;
  color: #6c757d;
}

.no-notifications p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.no-notifications small {
  font-size: 12px;
  opacity: 0.7;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification {
  padding: 12px;
  border-radius: 8px;
  border-left: 4px solid;
  animation: slideInRight 0.3s ease-out;
  transition: all 0.2s;
}

.notification:hover {
  transform: translateX(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.notification.NEW_ORDER {
  background: #e7f3ff;
  border-left-color: #007bff;
}

.notification.ORDER_STATUS_CHANGED {
  background: #fff3e0;
  border-left-color: #fd7e14;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.notification-icon {
  font-size: 16px;
}

.notification-title {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #212529;
}

.notification-time {
  font-size: 11px;
  color: #6c757d;
}

.notification-message {
  font-size: 13px;
  color: #495057;
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-item {
  font-size: 11px;
  color: #6c757d;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .admin-websocket-notifications {
    width: 90vw;
    right: 5vw;
    top: 10px;
  }
}
```

## 🚀 Utilisation Rapide

1. **Importer le service:**
```javascript
import webSocketService from './services/WebSocketService';
```

2. **Connecter dans votre app admin:**
```javascript
// Dans votre composant admin principal
useEffect(() => {
  webSocketService.connect();
  return () => webSocketService.disconnect();
}, []);
```

3. **Écouter les nouvelles commandes:**
```javascript
webSocketService.onNewOrder((notification) => {
  console.log('🆕 Nouvelle commande:', notification);
  // Mettre à jour votre interface
});
```

Cette version améliorée inclut une gestion d'erreur robuste, des diagnostics détaillés et une interface utilisateur moderne ! 🎉 