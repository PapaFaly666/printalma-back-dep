# 📋 API Documentation - Système de Notifications

## 🎯 Vue d'ensemble

Le système de notifications de Printalma permet une communication en temps réel entre le backend et les utilisateurs via WebSocket et REST API. Il gère les notifications pour les commandes, les mises à jour de statut, et les messages système.

---

## 🔐 Authentification

Tous les endpoints nécessitent :
- **Token JWT** dans le header `Authorization: Bearer <token>`
- **Rôles supportés** : `ADMIN`, `SUPERADMIN`, `VENDEUR`, `CLIENT`

---

## 📊 Types de Notifications Disponibles

```typescript
enum NotificationType {
  ORDER_NEW = 'ORDER_NEW',           // Nouvelle commande (pour admins)
  ORDER_UPDATED = 'ORDER_UPDATED',   // Mise à jour de commande
  ORDER_CANCELLED = 'ORDER_CANCELLED', // Commande annulée
  ORDER_DELIVERED = 'ORDER_DELIVERED', // Commande livrée
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS', // Paiement réussi
  PAYMENT_FAILED = 'PAYMENT_FAILED',   // Paiement échoué
  SYSTEM = 'SYSTEM',                 // Messages système
  INFO = 'INFO'                     // Informations générales
}
```

---

## 🛠️ Endpoints REST API

### 1. Lister les notifications de l'utilisateur

```http
GET /notifications?limit=50&includeRead=true
```

**Paramètres :**
- `limit` (number, optionnel) : Nombre maximum de notifications (défaut: 50)
- `includeRead` (boolean, optionnel) : Inclure les notifications lues (défaut: true)

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "userId": 101,
      "type": "ORDER_NEW",
      "title": "Nouvelle commande reçue",
      "message": "Client Name a passé une commande de 2 articles : T-shirt personnalisé",
      "isRead": false,
      "metadata": {
        "orderId": 123,
        "orderNumber": "CMD-2024-001",
        "amount": 15000,
        "customer": "Client Name",
        "itemsCount": 2
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "expiresAt": "2024-01-22T10:30:00Z"
    }
  ],
  "unreadCount": 3,
  "metadata": {
    "limit": 50,
    "includeRead": true,
    "total": 15
  }
}
```

### 2. Compter les notifications non lues

```http
GET /notifications/unread-count
```

**Réponse :**
```json
{
  "success": true,
  "unreadCount": 5
}
```

### 3. Marquer une notification comme lue

```http
POST /notifications/:id/mark-read
```

**Réponse :**
```json
{
  "success": true,
  "message": "Notification marquée comme lue"
}
```

### 4. Marquer toutes les notifications comme lues

```http
POST /notifications/mark-all-read
```

**Réponse :**
```json
{
  "success": true,
  "message": "12 notification(s) marquée(s) comme lue(s)",
  "updatedCount": 12
}
```

### 5. Supprimer une notification

```http
DELETE /notifications/:id
```

**Réponse :**
```json
{
  "success": true,
  "message": "Notification supprimée"
}
```

### 6. Nettoyer les notifications expirées (Admin)

```http
POST /notifications/admin/clean-expired
```

**Accès requis :** `ADMIN` ou `SUPERADMIN`

**Réponse :**
```json
{
  "success": true,
  "message": "25 notification(s) expirée(s) supprimée(s)",
  "deletedCount": 25
}
```

---

## 🌐 WebSocket - Notifications en Temps Réel

### Configuration du WebSocket

**URL :** `ws://localhost:3004/notifications`
**Namespace :** `/notifications`

### Authentification WebSocket

Le token JWT peut être fourni de plusieurs manières :

```javascript
// 1. Via auth object
const socket = io('http://localhost:3004/notifications', {
  auth: {
    token: 'votre_jwt_token'
  }
});

// 2. Via query params
const socket = io('http://localhost:3004/notifications?token=votre_jwt_token');

// 3. Via headers
const socket = io('http://localhost:3004/notifications', {
  extraHeaders: {
    Authorization: 'Bearer votre_jwt_token'
  }
});

// 4. Via cookies (automatique si le cookie auth_token existe)
```

### Événements WebSocket Disponibles

#### 1. Connexion établie

```javascript
socket.on('connected', (data) => {
  console.log('Connecté:', data);
  // {
  //   message: 'Connecté aux notifications en temps réel',
  //   userId: 101,
  //   role: 'CLIENT',
  //   timestamp: '2024-01-15T10:30:00Z'
  // }
});
```

#### 2. Nouvelle commande (pour admins)

```javascript
socket.on('newOrderNotification', (data) => {
  console.log('Nouvelle commande:', data);
  // {
  //   type: 'NEW_ORDER_NOTIFICATION',
  //   notification: { ... },
  //   orderData: {
  //     orderId: 123,
  //     orderNumber: 'CMD-2024-001',
  //     totalAmount: 15000,
  //     customer: 'Client Name',
  //     itemsCount: 2
  //   },
  //   timestamp: '2024-01-15T10:30:00Z'
  // }
});
```

#### 3. Mise à jour de commande

```javascript
socket.on('orderUpdateNotification', (data) => {
  console.log('Mise à jour commande:', data);
  // {
  //   type: 'ORDER_UPDATE_NOTIFICATION',
  //   notification: { ... },
  //   orderData: {
  //     orderId: 123,
  //     orderNumber: 'CMD-2024-001',
  //     oldStatus: 'PROCESSING',
  //     newStatus: 'SHIPPED'
  //   }
  // }
});
```

#### 4. Notification système

```javascript
socket.on('systemNotification', (data) => {
  console.log('Notification système:', data);
  // {
  //   type: 'SYSTEM_NOTIFICATION',
  //   notification: { ... },
  //   timestamp: '2024-01-15T10:30:00Z'
  // }
});
```

#### 5. Notification générale

```javascript
socket.on('notification', (data) => {
  console.log('Notification:', data);
});
```

### Messages WebSocket (Client → Serveur)

#### 1. Obtenir les statistiques

```javascript
socket.emit('getStats');

socket.on('stats', (data) => {
  console.log('Statistiques:', data);
  // {
  //   connectedAdmins: 2,
  //   connectedUsers: 15,
  //   yourRole: 'ADMIN',
  //   timestamp: '2024-01-15T10:30:00Z'
  // }
});
```

#### 2. Test de connexion (Ping/Pong)

```javascript
socket.emit('ping', { test: 'message' });

socket.on('pong', (data) => {
  console.log('Pong reçu:', data);
  // {
  //   message: 'Connexion WebSocket notifications active',
  //   timestamp: '2024-01-15T10:30:00Z',
  //   service: 'notifications'
  // }
});
```

---

## 🎨 Composants Frontend Suggérés

### 1. Hook React pour les notifications

```typescript
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

interface NotificationHookReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

export const useNotifications = (): NotificationHookReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { token } = useAuth();

  // Connexion WebSocket
  useEffect(() => {
    if (token) {
      const newSocket = io('http://localhost:3004/notifications', {
        auth: { token }
      });

      newSocket.on('connected', (data) => {
        console.log('Connecté aux notifications:', data);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('newOrderNotification', (data) => {
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        // Afficher une notification toast/browser
        showNotificationToast(data);
      });

      newSocket.on('orderUpdateNotification', (data) => {
        setNotifications(prev => [data.notification, ...prev]);
        showNotificationToast(data);
      });

      newSocket.on('systemNotification', (data) => {
        setNotifications(prev => [data.notification, ...prev]);
        showNotificationToast(data);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [token]);

  // Récupérer les notifications initiales
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
    }
  }, [token]);

  // Marquer comme lue
  const markAsRead = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
    }
  }, [token]);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erreur marquer toutes comme lues:', error);
    }
  }, [token]);

  // Supprimer une notification
  const deleteNotification = useCallback(async (id: number) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (!notifications.find(n => n.id === id)?.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  }, [token, notifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications
  };
};

// Helper pour afficher les notifications toast
const showNotificationToast = (data: any) => {
  // Implémenter avec votre librairie de toast préférée
  // Exemple avec react-toastify:
  // toast.info(data.notification.title, {
  //   description: data.notification.message,
  //   duration: 5000
  // });
};
```

### 2. Composant de liste de notifications

```typescript
import React from 'react';
import { useNotifications } from './useNotifications';

const NotificationList: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications
  } = useNotifications();

  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ORDER_NEW': return '📦';
      case 'ORDER_UPDATED': return '🔄';
      case 'ORDER_DELIVERED': return '✅';
      case 'PAYMENT_SUCCESS': return '💳';
      case 'PAYMENT_FAILED': return '❌';
      case 'SYSTEM': return '⚙️';
      default: return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ORDER_NEW': return '#007bff';
      case 'ORDER_UPDATED': return '#28a745';
      case 'ORDER_DELIVERED': return '#6c757d';
      case 'PAYMENT_SUCCESS': return '#28a745';
      case 'PAYMENT_FAILED': return '#dc3545';
      case 'SYSTEM': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div className="notification-panel">
      {/* Header */}
      <div className="notification-header">
        <div className="notification-title">
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="mark-all-read-btn">
              Tout marquer comme lu
            </button>
          )}
          <button onClick={fetchNotifications} className="refresh-btn">
            🔄
          </button>
        </div>
      </div>

      {/* Indicateur de connexion */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <span className="status-dot"></span>
        {isConnected ? 'Connecté' : 'Déconnecté'}
      </div>

      {/* Liste des notifications */}
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>Aucune notification</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              style={{ borderLeftColor: getNotificationColor(notification.type) }}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification.type)}
              </div>

              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  <span className="notification-time">
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                <p className="notification-message">{notification.message}</p>

                {notification.metadata && (
                  <div className="notification-metadata">
                    {notification.metadata.orderNumber && (
                      <span className="metadata-item">
                        Commande: #{notification.metadata.orderNumber}
                      </span>
                    )}
                    {notification.metadata.amount && (
                      <span className="metadata-item">
                        Montant: {notification.metadata.amount}€
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="notification-actions">
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="mark-read-btn"
                    title="Marquer comme lu"
                  >
                    ✓
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="delete-btn"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Helper function
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)} h`;
  return `Il y a ${Math.floor(diffInMinutes / 1440)} jours`;
};
```

### 3. Hook pour les badges de notification

```typescript
import { useNotifications } from './useNotifications';

export const NotificationBadge: React.FC = () => {
  const { unreadCount, isConnected } = useNotifications();

  return (
    <div className="notification-badge">
      <button className="notification-icon">
        🔔
        {unreadCount > 0 && (
          <span className="badge-count">{unreadCount}</span>
        )}
        <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
      </button>
    </div>
  );
};
```

---

## 🎨 Styles CSS Suggérés

```css
/* Notification Panel */
.notification-panel {
  width: 380px;
  max-height: 600px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  overflow: hidden;
}

.notification-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.unread-badge {
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.notification-actions {
  display: flex;
  gap: 8px;
}

.mark-all-read-btn,
.refresh-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #f8f9fa;
  color: #495057;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.mark-all-read-btn:hover,
.refresh-btn:hover {
  background: #e9ecef;
}

.connection-status {
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6c757d;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #dc3545;
}

.connection-status.connected .status-dot {
  background: #28a745;
}

/* Notification Items */
.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f8f9fa;
  display: flex;
  gap: 12px;
  border-left: 4px solid #6c757d;
  transition: background-color 0.2s;
}

.notification-item.unread {
  background: #f8f9fa;
}

.notification-item:hover {
  background: #e9ecef;
}

.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.notification-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  line-height: 1.3;
}

.notification-time {
  font-size: 11px;
  color: #6c757d;
  white-space: nowrap;
}

.notification-message {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #495057;
  line-height: 1.4;
}

.notification-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.metadata-item {
  font-size: 11px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.notification-item-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.mark-read-btn,
.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: #f8f9fa;
  color: #6c757d;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.mark-read-btn:hover {
  background: #d4edda;
  color: #155724;
}

.delete-btn:hover {
  background: #f8d7da;
  color: #721c24;
}

/* Notification Badge */
.notification-badge {
  position: relative;
}

.notification-icon {
  position: relative;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
}

.badge-count {
  position: absolute;
  top: 0;
  right: 0;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border: 2px solid white;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid white;
}

.status-indicator.online {
  background: #28a745;
}

.status-indicator.offline {
  background: #dc3545;
}

/* No Notifications */
.no-notifications {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.no-notifications p {
  margin: 0;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 480px) {
  .notification-panel {
    width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }

  .notification-item {
    padding: 12px 16px;
  }
}
```

---

## ⚡ Bonnes Pratiques

1. **Gestion des erreurs** : Toujours inclure une gestion d'erreur robuste pour les appels API
2. **Reconnexion automatique** : Implémenter une reconnexion automatique pour les WebSocket
3. **Optimisation** : Limiter le nombre de notifications affichées et utiliser la pagination
4. **Accessibilité** : Ajouter des attributs ARIA pour les lecteurs d'écran
5. **Performance** : Utiliser `useMemo` et `useCallback` pour optimiser les rendus
6. **UX** : Afficher des indicateurs de chargement et de connexion

---

## 🚀 Intégration Rapide

1. **Installer les dépendances** : `npm install socket.io-client react-toastify`
2. **Configurer l'authentification** : Gérer les tokens JWT
3. **Intégrer le hook** : Utiliser `useNotifications` dans vos composants
4. **Styliser** : Utiliser les CSS fournis ou adapter à votre design system
5. **Tester** : Vérifier la connexion WebSocket et les endpoints REST

---

*Pour toute question ou problème d'implémentation, contactez l'équipe de développement backend.* 🚀