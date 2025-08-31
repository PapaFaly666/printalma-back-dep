# 🔔 API Notifications Frontend - PrintAlma

## 🎯 Vue d'Ensemble

Documentation complète de l'API des notifications persistantes pour remplacer le système frontend actuel. Les notifications survivent aux actualisations de page et sont synchronisées entre plusieurs onglets.

## 🔐 Authentification

**Important :** Toutes les requêtes nécessitent une authentification par cookie `auth_token`.

```javascript
// Configuration fetch avec cookies
const fetchConfig = {
  credentials: 'include', // ⭐ ESSENTIEL pour envoyer les cookies
  headers: {
    'Content-Type': 'application/json'
  }
};
```

## 📋 1. Récupérer les Notifications

### 🔗 Endpoint
```
GET http://localhost:3004/notifications
```

### 📝 Paramètres de Requête

```javascript
const params = {
  limit: 50,           // Nombre max de notifications (défaut: 50)
  includeRead: true    // Inclure les notifications lues (défaut: true)
};

// Construction de l'URL
const url = new URL('http://localhost:3004/notifications');
Object.entries(params).forEach(([key, value]) => {
  if (value !== undefined) url.searchParams.append(key, value.toString());
});

const response = await fetch(url, {
  credentials: 'include'
});
```

### ✅ Réponse de Succès (200)

```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "userId": 2,
      "type": "ORDER_NEW",
      "title": "Nouvelle commande reçue",
      "message": "Jean Dupont a passé une commande de 2 articles : T-shirt Design Unique, Hoodie Premium",
      "isRead": false,
      "metadata": {
        "orderId": 123,
        "orderNumber": "CMD20241127001",
        "amount": 89.99,
        "customer": "Jean Dupont",
        "itemsCount": 2
      },
      "createdAt": "2024-11-27T14:30:00.000Z",
      "updatedAt": "2024-11-27T14:30:00.000Z",
      "expiresAt": null,
      "user": {
        "id": 2,
        "firstName": "Admin",
        "lastName": "PrintAlma"
      }
    },
    {
      "id": 14,
      "userId": 2,
      "type": "ORDER_UPDATED",
      "title": "Commande mise à jour",
      "message": "Statut de la commande CMD20241126002 modifié de \"En attente\" vers \"Confirmée\"",
      "isRead": true,
      "metadata": {
        "orderId": 122,
        "orderNumber": "CMD20241126002",
        "amount": 59.99,
        "customer": "Marie Martin",
        "oldStatus": "PENDING",
        "newStatus": "CONFIRMED"
      },
      "createdAt": "2024-11-26T16:45:00.000Z",
      "updatedAt": "2024-11-27T09:15:00.000Z",
      "expiresAt": null,
      "user": {
        "id": 2,
        "firstName": "Admin", 
        "lastName": "PrintAlma"
      }
    },
    {
      "id": 13,
      "userId": 5,
      "type": "ORDER_UPDATED",
      "title": "Mise à jour de votre commande",
      "message": "Votre commande CMD20241126001 est maintenant \"Expédiée\"",
      "isRead": false,
      "metadata": {
        "orderId": 121,
        "orderNumber": "CMD20241126001",
        "amount": 29.99,
        "newStatus": "SHIPPED"
      },
      "createdAt": "2024-11-26T11:20:00.000Z",
      "updatedAt": "2024-11-26T11:20:00.000Z",
      "expiresAt": null,
      "user": {
        "id": 5,
        "firstName": "Jean",
        "lastName": "Dupont"
      }
    }
  ],
  "unreadCount": 2,
  "metadata": {
    "limit": 50,
    "includeRead": true,
    "total": 3
  }
}
```

### 🎭 Types de Notifications

```javascript
const NOTIFICATION_TYPES = {
  'ORDER_NEW': 'Nouvelle commande',
  'ORDER_UPDATED': 'Commande mise à jour',
  'SYSTEM': 'Notification système',
  'SUCCESS': 'Succès',
  'WARNING': 'Avertissement',
  'ERROR': 'Erreur'
};
```

## 📊 2. Compter les Notifications Non Lues

### 🔗 Endpoint
```
GET http://localhost:3004/notifications/unread-count
```

### ✅ Réponse de Succès (200)

```json
{
  "success": true,
  "unreadCount": 5
}
```

## ✅ 3. Marquer une Notification comme Lue

### 🔗 Endpoint
```
POST http://localhost:3004/notifications/:id/mark-read
```

### 📝 Exemple de Requête

```javascript
const notificationId = 15;
const response = await fetch(`http://localhost:3004/notifications/${notificationId}/mark-read`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### ✅ Réponse de Succès (200)

```json
{
  "success": true,
  "message": "Notification marquée comme lue"
}
```

### ❌ Notification Non Trouvée (404)

```json
{
  "success": false,
  "message": "Notification non trouvée",
  "statusCode": 404
}
```

## ✅ 4. Marquer Toutes les Notifications comme Lues

### 🔗 Endpoint
```
POST http://localhost:3004/notifications/mark-all-read
```

### 📝 Exemple de Requête

```javascript
const response = await fetch('http://localhost:3004/notifications/mark-all-read', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

### ✅ Réponse de Succès (200)

```json
{
  "success": true,
  "message": "5 notification(s) marquée(s) comme lue(s)",
  "updatedCount": 5
}
```

## 🗑️ 5. Supprimer une Notification

### 🔗 Endpoint
```
DELETE http://localhost:3004/notifications/:id
```

### 📝 Exemple de Requête

```javascript
const notificationId = 15;
const response = await fetch(`http://localhost:3004/notifications/${notificationId}`, {
  method: 'DELETE',
  credentials: 'include'
});
```

### ✅ Réponse de Succès (200)

```json
{
  "success": true,
  "message": "Notification supprimée"
}
```

## 🧹 6. Nettoyage des Notifications Expirées (Admin)

### 🔗 Endpoint
```
POST http://localhost:3004/notifications/admin/clean-expired
```

### ✅ Réponse Admin (200)

```json
{
  "success": true,
  "message": "12 notification(s) expirée(s) supprimée(s)",
  "deletedCount": 12
}
```

### ❌ Accès Refusé (403)

```json
{
  "success": false,
  "message": "Accès refusé - droits admin requis"
}
```

## 🎨 7. Service Frontend Complet

### 📝 NotificationService.js

```javascript
// services/NotificationService.js
class NotificationService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
    this.cache = {
      notifications: null,
      unreadCount: 0,
      lastFetch: 0,
      cacheTimeout: 30000 // 30 secondes
    };
  }

  /**
   * Récupérer les notifications
   */
  async getNotifications(limit = 50, includeRead = true, forceRefresh = false) {
    const now = Date.now();
    
    // Utiliser le cache si disponible et récent
    if (!forceRefresh && 
        this.cache.notifications && 
        (now - this.cache.lastFetch) < this.cache.cacheTimeout) {
      return {
        notifications: this.cache.notifications,
        unreadCount: this.cache.unreadCount
      };
    }

    const params = new URLSearchParams({ 
      limit: limit.toString(),
      includeRead: includeRead.toString()
    });

    const response = await fetch(`${this.baseURL}/notifications?${params}`, {
      credentials: 'include'
    });

    const data = await this.handleResponse(response);
    
    // Mettre en cache
    this.cache.notifications = data.data;
    this.cache.unreadCount = data.unreadCount;
    this.cache.lastFetch = now;

    return {
      notifications: data.data,
      unreadCount: data.unreadCount,
      metadata: data.metadata
    };
  }

  /**
   * Compter les notifications non lues
   */
  async getUnreadCount() {
    const response = await fetch(`${this.baseURL}/notifications/unread-count`, {
      credentials: 'include'
    });

    const data = await this.handleResponse(response);
    this.cache.unreadCount = data.unreadCount;
    
    return data.unreadCount;
  }

  /**
   * Marquer comme lue
   */
  async markAsRead(notificationId) {
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}/mark-read`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await this.handleResponse(response);
    
    // Mettre à jour le cache local
    if (this.cache.notifications) {
      const notification = this.cache.notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        this.cache.unreadCount = Math.max(0, this.cache.unreadCount - 1);
      }
    }

    return result.success;
  }

  /**
   * Marquer toutes comme lues
   */
  async markAllAsRead() {
    const response = await fetch(`${this.baseURL}/notifications/mark-all-read`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await this.handleResponse(response);
    
    // Mettre à jour le cache local
    if (this.cache.notifications) {
      this.cache.notifications.forEach(notification => {
        notification.isRead = true;
      });
      this.cache.unreadCount = 0;
    }

    return result.updatedCount;
  }

  /**
   * Supprimer une notification
   */
  async deleteNotification(notificationId) {
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await this.handleResponse(response);
    
    // Mettre à jour le cache local
    if (this.cache.notifications) {
      const index = this.cache.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        const notification = this.cache.notifications[index];
        if (!notification.isRead) {
          this.cache.unreadCount = Math.max(0, this.cache.unreadCount - 1);
        }
        this.cache.notifications.splice(index, 1);
      }
    }

    return result.success;
  }

  /**
   * Gestion des réponses API
   */
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      switch (response.status) {
        case 401:
          // Rediriger vers login
          window.location.href = '/login';
          throw new Error('Non authentifié');
        case 403:
          throw new Error('Accès refusé');
        case 404:
          throw new Error('Notification non trouvée');
        default:
          throw new Error(errorData.message || `Erreur ${response.status}`);
      }
    }
    
    return response.json();
  }

  /**
   * Vider le cache
   */
  clearCache() {
    this.cache.notifications = null;
    this.cache.unreadCount = 0;
    this.cache.lastFetch = 0;
  }

  /**
   * Polling des notifications (optionnel)
   */
  startPolling(intervalMs = 30000) {
    return setInterval(async () => {
      try {
        await this.getNotifications(50, true, true);
      } catch (error) {
        console.error('Erreur lors du polling des notifications:', error);
      }
    }, intervalMs);
  }

  /**
   * Arrêter le polling
   */
  stopPolling(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

export default new NotificationService();
```

## 🪝 8. Hook React useNotifications

```javascript
// hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import NotificationService from '../services/NotificationService';

export const useNotifications = (options = {}) => {
  const {
    limit = 50,
    includeRead = true,
    enablePolling = true,
    pollingInterval = 30000
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les notifications
  const loadNotifications = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await NotificationService.getNotifications(
        limit, 
        includeRead, 
        forceRefresh
      );
      
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      setError(err.message);
      console.error('Erreur chargement notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [limit, includeRead]);

  // Marquer comme lue
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      // Mettre à jour l'état local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Rafraîchir
  const refresh = useCallback(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  // Polling automatique
  useEffect(() => {
    let intervalId;
    
    if (enablePolling) {
      intervalId = NotificationService.startPolling(pollingInterval);
    }
    
    return () => {
      if (intervalId) {
        NotificationService.stopPolling(intervalId);
      }
    };
  }, [enablePolling, pollingInterval]);

  // Chargement initial
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    clearError: () => setError(null)
  };
};
```

## 💻 9. Composant NotificationCenter

```jsx
// components/NotificationCenter.jsx
import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh
  } = useNotifications({
    limit: 20,
    includeRead: true,
    enablePolling: true
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'ORDER_NEW': '🆕',
      'ORDER_UPDATED': '📝',
      'SYSTEM': '⚙️',
      'SUCCESS': '✅',
      'WARNING': '⚠️',
      'ERROR': '❌'
    };
    return icons[type] || '📢';
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Redirection conditionnelle selon le type
    if (notification.metadata?.orderId) {
      window.location.href = `/admin/orders/${notification.metadata.orderId}`;
    }
  };

  return (
    <div className="notification-center">
      {/* Bouton notification */}
      <button 
        className="notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${unreadCount} notifications non lues`}
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {/* Panel notifications */}
      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>🔔 Notifications</h3>
            <div className="notification-actions">
              <button onClick={refresh} className="btn-refresh" title="Actualiser">
                🔄
              </button>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="btn-mark-all">
                  Tout marquer comme lu
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="btn-close">
                ✖️
              </button>
            </div>
          </div>

          <div className="notification-content">
            {loading && (
              <div className="notification-loading">
                ⏳ Chargement des notifications...
              </div>
            )}

            {error && (
              <div className="notification-error">
                ❌ Erreur: {error}
                <button onClick={refresh} className="btn-retry">Réessayer</button>
              </div>
            )}

            {!loading && !error && notifications.length === 0 && (
              <div className="notification-empty">
                📭 Aucune notification
              </div>
            )}

            {!loading && !error && notifications.length > 0 && (
              <div className="notification-list">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-body">
                      <div className="notification-title">
                        {notification.title}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {formatDate(notification.createdAt)}
                      </div>
                    </div>

                    <div className="notification-controls">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="btn-mark-read"
                          title="Marquer comme lu"
                        >
                          👁️
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="btn-delete"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
```

## 🎨 10. CSS NotificationCenter

```css
/* NotificationCenter.css */
.notification-center {
  position: relative;
  display: inline-block;
}

.notification-trigger {
  position: relative;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.notification-trigger:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-panel {
  position: absolute;
  top: 100%;
  right: 0;
  width: 400px;
  max-width: 90vw;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e8ed;
  z-index: 1000;
  max-height: 500px;
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e1e8ed;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
}

.notification-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.notification-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-refresh, .btn-close {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.btn-refresh:hover, .btn-close:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.btn-mark-all {
  background: #007bff;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-mark-all:hover {
  background: #0056b3;
}

.notification-content {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.notification-loading,
.notification-error,
.notification-empty {
  padding: 32px;
  text-align: center;
  color: #666;
}

.notification-error {
  color: #dc3545;
}

.btn-retry {
  margin-left: 8px;
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.notification-list {
  padding: 0;
}

.notification-item {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s ease;
  align-items: flex-start;
  gap: 12px;
}

.notification-item:hover {
  background-color: #f8f9fa;
}

.notification-item.unread {
  background-color: #e7f3ff;
  border-left: 3px solid #007bff;
}

.notification-item:last-child {
  border-bottom: none;
  border-radius: 0 0 8px 8px;
}

.notification-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.notification-body {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.notification-message {
  color: #666;
  font-size: 0.85rem;
  line-height: 1.4;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-time {
  color: #999;
  font-size: 0.75rem;
}

.notification-controls {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.notification-item:hover .notification-controls {
  opacity: 1;
}

.btn-mark-read,
.btn-delete {
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.btn-mark-read:hover {
  background-color: #28a745;
  color: white;
}

.btn-delete:hover {
  background-color: #dc3545;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .notification-panel {
    width: 350px;
    max-height: 70vh;
  }
  
  .notification-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  .notification-item {
    padding: 10px 12px;
  }
}

@media (max-width: 480px) {
  .notification-panel {
    width: 300px;
    right: -50px;
  }
}
```

## 📞 11. Support et Debugging

### 🐛 Points de Vérification

1. **Cookies** : `document.cookie` doit contenir `auth_token`
2. **WebSocket** : Les notifications temps réel continuent de fonctionner
3. **Cache** : Le cache frontend évite les requêtes inutiles
4. **Polling** : Les notifications se mettent à jour automatiquement
5. **Persistance** : Les notifications survivent aux actualisations

### 🔍 Debug Console

```javascript
// Test rapide des notifications
NotificationService.getNotifications()
  .then(data => console.log('📔 Notifications:', data))
  .catch(err => console.error('❌ Erreur notifications:', err));

// Vérifier le cache
console.log('Cache notifications:', NotificationService.cache);

// Forcer le rafraîchissement
NotificationService.getNotifications(50, true, true);
```

## ✅ 12. Checklist d'Intégration

- [ ] ✅ Migration Prisma exécutée
- [ ] ✅ NotificationService backend créé
- [ ] ✅ NotificationController endpoints testés
- [ ] ✅ OrderService modifié avec notifications
- [ ] ✅ Service frontend NotificationService implémenté
- [ ] ✅ Hook useNotifications créé
- [ ] ✅ Composant NotificationCenter intégré
- [ ] ✅ CSS appliqué et responsive
- [ ] ✅ Tâches cron de nettoyage configurées
- [ ] ✅ Tests avec WebSocket + notifications persistantes

**Votre système de notifications persistant est prêt ! 🔔🚀**

## 📋 13. Avantages du Système

- ✅ **Persistance** : Les notifications survivent aux actualisations
- ✅ **Performance** : Cache intelligent et polling optimisé
- ✅ **Temps réel** : Combiné avec WebSocket pour l'instantané
- ✅ **Scalabilité** : Base de données indexée et nettoyage automatique
- ✅ **UX** : Interface intuitive avec compteur et actions
- ✅ **Responsive** : Adapté mobile et desktop
- ✅ **Maintenance** : Nettoyage automatique des notifications expirées 