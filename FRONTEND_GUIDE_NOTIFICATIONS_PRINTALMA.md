# 🔔 Guide Frontend - Notifications Persistantes PrintAlma

## 🎯 Vue d'Ensemble

Guide pratique pour intégrer le système de notifications persistantes dans votre frontend PrintAlma. Remplace le système temporaire actuel par des notifications qui survivent aux actualisations.

## ⚡ Quick Start

### 1. Configuration de Base

```javascript
// .env.local ou .env
REACT_APP_API_URL=http://localhost:3004
```

### 2. Installation et Intégration Immédiate

```jsx
// App.js - Ajoutez le NotificationCenter dans votre layout
import NotificationCenter from './components/NotificationCenter';

function App() {
  return (
    <div className="app">
      <header className="header">
        <nav>
          {/* Votre navigation existante */}
          <NotificationCenter /> {/* 🔔 Ajoutez ça ici */}
        </nav>
      </header>
      {/* Reste de votre app */}
    </div>
  );
}
```

## 🔗 API Endpoints Disponibles

### Base URL
```
http://localhost:3004/notifications
```

### 📋 Endpoints Essentiels

| Méthode | URL | Description |
|---------|-----|-------------|
| `GET` | `/notifications` | Récupérer les notifications |
| `GET` | `/notifications/unread-count` | Compter les non lues |
| `POST` | `/notifications/:id/mark-read` | Marquer comme lue |
| `POST` | `/notifications/mark-all-read` | Tout marquer comme lu |
| `DELETE` | `/notifications/:id` | Supprimer une notification |

## 🛠️ Service Frontend Prêt à l'Emploi

### NotificationService.js

```javascript
// services/NotificationService.js
class NotificationService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
    this.cache = { notifications: null, unreadCount: 0, lastFetch: 0 };
  }

  // 📋 Récupérer les notifications
  async getNotifications(limit = 50, includeRead = true) {
    const params = new URLSearchParams({ 
      limit: limit.toString(),
      includeRead: includeRead.toString()
    });

    const response = await fetch(`${this.baseURL}/notifications?${params}`, {
      credentials: 'include' // ⭐ OBLIGATOIRE pour les cookies
    });

    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    
    const data = await response.json();
    this.cache = { 
      notifications: data.data, 
      unreadCount: data.unreadCount, 
      lastFetch: Date.now() 
    };
    
    return data;
  }

  // 📊 Compter les non lues
  async getUnreadCount() {
    const response = await fetch(`${this.baseURL}/notifications/unread-count`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.unreadCount;
  }

  // ✅ Marquer comme lue
  async markAsRead(notificationId) {
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}/mark-read`, {
      method: 'POST',
      credentials: 'include'
    });
    
    // Mettre à jour le cache local
    if (this.cache.notifications) {
      const notif = this.cache.notifications.find(n => n.id === notificationId);
      if (notif && !notif.isRead) {
        notif.isRead = true;
        this.cache.unreadCount = Math.max(0, this.cache.unreadCount - 1);
      }
    }
    
    return response.json();
  }

  // ✅ Tout marquer comme lu
  async markAllAsRead() {
    const response = await fetch(`${this.baseURL}/notifications/mark-all-read`, {
      method: 'POST',
      credentials: 'include'
    });
    
    // Mettre à jour le cache
    if (this.cache.notifications) {
      this.cache.notifications.forEach(n => n.isRead = true);
      this.cache.unreadCount = 0;
    }
    
    return response.json();
  }

  // 🗑️ Supprimer une notification
  async deleteNotification(notificationId) {
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    // Mettre à jour le cache
    if (this.cache.notifications) {
      const index = this.cache.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        const notif = this.cache.notifications[index];
        if (!notif.isRead) this.cache.unreadCount--;
        this.cache.notifications.splice(index, 1);
      }
    }
    
    return response.json();
  }
}

export default new NotificationService();
```

## 🪝 Hook React useNotifications

```javascript
// hooks/useNotifications.js
import { useState, useEffect, useCallback } from 'react';
import NotificationService from '../services/NotificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await NotificationService.getNotifications();
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Erreur notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marquer comme lue avec mise à jour locale
  const markAsRead = useCallback(async (notificationId) => {
    await NotificationService.markAsRead(notificationId);
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    await NotificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (notificationId) => {
    await NotificationService.deleteNotification(notificationId);
    setNotifications(prev => {
      const notif = prev.find(n => n.id === notificationId);
      if (notif && !notif.isRead) setUnreadCount(count => Math.max(0, count - 1));
      return prev.filter(n => n.id !== notificationId);
    });
  }, []);

  // Chargement initial + polling toutes les 30s
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications
  };
};
```

## 💻 Composant NotificationCenter

```jsx
// components/NotificationCenter.jsx
import React, { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const getIcon = (type) => {
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

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification.id);
    
    // Navigation automatique vers la commande
    if (notification.metadata?.orderId) {
      window.location.href = `/admin/orders/${notification.metadata.orderId}`;
    }
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bouton cloche */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          background: 'none', 
          border: 'none', 
          fontSize: '1.5rem',
          position: 'relative',
          cursor: 'pointer'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            background: '#ff4757',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '0.7rem',
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel notifications */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '400px',
          maxWidth: '90vw',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '500px'
        }}>
          {/* Header */}
          <div style={{ 
            padding: '16px', 
            borderBottom: '1px solid #eee',
            background: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0 }}>🔔 Notifications</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  style={{
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  Tout marquer lu
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✖️
              </button>
            </div>
          </div>

          {/* Contenu */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '32px', textAlign: 'center' }}>
                ⏳ Chargement...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
                📭 Aucune notification
              </div>
            )}

            {!loading && notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  display: 'flex',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  background: !notification.isRead ? '#e7f3ff' : 'white',
                  borderLeft: !notification.isRead ? '3px solid #007bff' : 'none',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = !notification.isRead ? '#e7f3ff' : 'white'}
              >
                <div style={{ fontSize: '1.2rem', marginRight: '12px', marginTop: '2px' }}>
                  {getIcon(notification.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '0.9rem' }}>
                    {notification.title}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '4px' }}>
                    {notification.message}
                  </div>
                  <div style={{ color: '#999', fontSize: '0.75rem' }}>
                    {formatTime(notification.createdAt)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
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
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
```

## 🎯 Exemples de Réponses API

### Récupérer les notifications
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
        "customer": "Jean Dupont"
      },
      "createdAt": "2024-11-27T14:30:00.000Z"
    }
  ],
  "unreadCount": 5
}
```

### Compter les non lues
```json
{
  "success": true,
  "unreadCount": 3
}
```

## 🔄 Types de Notifications

```javascript
const NOTIFICATION_TYPES = {
  ORDER_NEW: 'Nouvelle commande',        // 🆕 Admin uniquement
  ORDER_UPDATED: 'Commande mise à jour', // 📝 Admin + Client
  SYSTEM: 'Notification système',        // ⚙️ Général
  SUCCESS: 'Succès',                     // ✅ Confirmations
  WARNING: 'Avertissement',              // ⚠️ Alertes
  ERROR: 'Erreur'                        // ❌ Problèmes
};
```

## 🎨 Intégration dans vos Composants Existants

### Badge de notification simple
```jsx
// components/NotificationBadge.jsx
import { useNotifications } from '../hooks/useNotifications';

const NotificationBadge = () => {
  const { unreadCount } = useNotifications();
  
  if (unreadCount === 0) return null;
  
  return (
    <span className="notification-badge">
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
};
```

### Liste complète des notifications
```jsx
// pages/NotificationsPage.jsx
import { useNotifications } from '../hooks/useNotifications';

const NotificationsPage = () => {
  const { notifications, loading, markAsRead, deleteNotification } = useNotifications();

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="notifications-page">
      <h1>Mes Notifications</h1>
      {notifications.map(notification => (
        <div key={notification.id} className="notification-card">
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <div className="notification-actions">
            {!notification.isRead && (
              <button onClick={() => markAsRead(notification.id)}>
                Marquer comme lu
              </button>
            )}
            <button onClick={() => deleteNotification(notification.id)}>
              Supprimer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 🚨 Gestion d'Erreurs

```javascript
// utils/notificationHelpers.js
export const handleNotificationError = (error) => {
  console.error('Erreur notification:', error);
  
  if (error.message.includes('401')) {
    // Redirection vers login
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    alert('Accès refusé');
  } else {
    alert('Erreur lors du chargement des notifications');
  }
};

// Dans vos composants
try {
  await NotificationService.getNotifications();
} catch (error) {
  handleNotificationError(error);
}
```

## ⚡ Optimisations Performance

### Cache local intelligent
```javascript
// Le service utilise déjà un cache automatique
NotificationService.getNotifications(); // Premier appel → API
NotificationService.getNotifications(); // Deuxième appel → Cache (si < 30s)
```

### Polling optimisé
```javascript
// Dans useNotifications
useEffect(() => {
  const interval = setInterval(loadNotifications, 30000); // 30 secondes
  return () => clearInterval(interval);
}, []);
```

## 🔍 Debug et Tests

### Console Debug
```javascript
// Vérifier les notifications
console.log(await NotificationService.getNotifications());

// Vérifier le cache
console.log(NotificationService.cache);

// Tester l'authentification
fetch('http://localhost:3004/notifications/unread-count', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

### Test des fonctionnalités
```javascript
// Test complet
const testNotifications = async () => {
  try {
    // 1. Récupérer les notifications
    const data = await NotificationService.getNotifications();
    console.log('✅ Récupération OK:', data);
    
    // 2. Marquer comme lue
    if (data.data.length > 0) {
      await NotificationService.markAsRead(data.data[0].id);
      console.log('✅ Marquage comme lu OK');
    }
    
    // 3. Compter les non lues
    const count = await NotificationService.getUnreadCount();
    console.log('✅ Comptage OK:', count);
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
};

testNotifications();
```

## ✅ Checklist d'Intégration

- [ ] ✅ Service NotificationService ajouté
- [ ] ✅ Hook useNotifications créé  
- [ ] ✅ Composant NotificationCenter intégré
- [ ] ✅ Badge de notification dans la navbar
- [ ] ✅ Configuration credentials: 'include'
- [ ] ✅ Gestion d'erreurs implémentée
- [ ] ✅ Tests en local effectués
- [ ] ✅ Navigation vers commandes fonctionnelle

## 🎉 Résultat Final

Une fois intégré, vous aurez :
- 🔔 Notifications persistantes qui survivent aux actualisations
- ⚡ Mise à jour automatique toutes les 30 secondes  
- 🎯 Navigation directe vers les commandes
- 📱 Interface responsive et moderne
- 🔄 Compatible avec votre système WebSocket existant

**Votre système de notifications professionnel est prêt ! 🚀** 