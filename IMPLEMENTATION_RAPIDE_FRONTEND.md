# 🚀 IMPLEMENTATION RAPIDE - SOLUTION 401 NOTIFICATIONS

## 📋 RÉSUMÉ DU PROBLÈME

**Issue** : Le frontend reçoit `401 Unauthorized` sur `/notifications`
**Cause** : Le frontend n'envoie pas le header `Authorization: Bearer <token>`
**Solution** : Implémenter un service d'authentification avec intercepteurs Axios

---

## 🎯 SOLUTION COMPLÈTE COPIER-COLLER

### Étape 1 : Service d'authentification

Créez `src/services/auth.service.ts` :
```typescript
import axios, { AxiosInstance } from 'axios';

interface LoginResponse {
  access_token: string;
  user: any;
}

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
      timeout: 10000,
    });

    // 🔑 INTERCEPTEUR : Ajout automatique du token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Token ajouté à:', config.url);
        } else {
          console.warn('❌ Aucun token pour:', config.url);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 🔄 INTERCEPTEUR : Gestion des erreurs 401
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('🚪 Token expiré - Déconnexion');
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // 🔐 Connexion
  async login(email: string, password: string, rememberMe = false): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${this.api.defaults.baseURL}/auth/login`, {
        email,
        password
      });

      const { access_token, user } = response.data;
      this.saveToken(access_token, rememberMe);

      console.log('✅ Login réussi');
      return { access_token, user };
    } catch (error) {
      console.error('❌ Erreur login:', error.response?.data?.message || error.message);
      throw error;
    }
  }

  // 💾 Sauvegarder le token
  saveToken(token: string, rememberMe = false): void {
    if (rememberMe) {
      localStorage.setItem('auth_token', token);
      sessionStorage.removeItem('auth_token');
    } else {
      sessionStorage.setItem('auth_token', token);
      localStorage.removeItem('auth_token');
    }
  }

  // 🔍 Récupérer le token
  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  // ✅ Vérifier si le token est valide
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // 🚪 Déconnexion
  logout(): void {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    sessionStorage.removeItem('user_info');
  }

  // 📡 Obtenir l'instance Axios configurée
  getApi(): AxiosInstance {
    return this.api;
  }
}

export default new AuthService();
```

### Étape 2 : Service des notifications

Créez `src/services/notification.service.ts` :
```typescript
import authApi from './auth.service';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationResponse {
  data: Notification[];
  unreadCount: number;
  total: number;
}

class NotificationService {
  // 📨 Récupérer les notifications
  async getNotifications(limit = 50, includeRead = true): Promise<NotificationResponse> {
    try {
      console.log('🔔 Récupération notifications...');

      const response = await authApi.get('/notifications', {
        params: {
          limit: limit.toString(),
          includeRead: includeRead.toString()
        }
      });

      console.log('✅ Notifications récupérées:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur notifications:', error.response?.data || error.message);

      if (error.response?.status === 401) {
        throw new Error('Session expirée - Veuillez vous reconnecter');
      }

      throw new Error('Erreur lors du chargement des notifications');
    }
  }

  // 🔢 Compter les notifications non lues
  async getUnreadCount(): Promise<number> {
    try {
      const response = await authApi.get('/notifications/unread-count');
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('❌ Erreur comptage:', error);
      return 0;
    }
  }

  // ✅ Marquer comme lue
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await authApi.post(`/notifications/${notificationId}/mark-read`);
    } catch (error) {
      console.error('❌ Erreur marquer lu:', error);
      throw error;
    }
  }

  // ✅ Tout marquer comme lu
  async markAllAsRead(): Promise<void> {
    try {
      await authApi.post('/notifications/mark-all-read');
    } catch (error) {
      console.error('❌ Erreur tout marquer lu:', error);
      throw error;
    }
  }
}

export default new NotificationService();
```

### Étape 3 : Hook React pour les notifications

Créez `src/hooks/useNotifications.ts` :
```typescript
import { useState, useEffect, useCallback } from 'react';
import NotificationService from '../services/notification.service';
import AuthService from '../services/auth.service';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 Charger les notifications
  const fetchNotifications = useCallback(async () => {
    // Vérifier l'authentification
    if (!AuthService.isTokenValid()) {
      console.log('❌ Token invalide ou absent');
      setError('Veuillez vous connecter pour voir les notifications');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await NotificationService.getNotifications(20, true);
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
      console.log('✅ Notifications chargées:', data.data?.length || 0);
    } catch (error: any) {
      console.error('❌ Erreur complète:', error);
      setError(error.message || 'Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ Marquer comme lue
  const markAsRead = useCallback(async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Erreur marquer comme lu:', error);
    }
  }, []);

  // ✅ Tout marquer comme lu
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Erreur tout marquer comme lu:', error);
    }
  }, []);

  // 🚀 Charger au montage du composant
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead
  };
};
```

### Étape 4 : Composant de notifications

Créez `src/components/NotificationsDropdown.tsx` :
```typescript
import React from 'react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationsDropdown: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  if (error) {
    return (
      <div className="notifications-dropdown">
        <div className="notification-error">
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <h3>🔔 Notifications</h3>
        {unreadCount > 0 && (
          <span className="unread-count">{unreadCount}</span>
        )}
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="mark-all-read"
          >
            Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="notifications-list">
        {isLoading ? (
          <div className="loading">⏳ Chargement...</div>
        ) : notifications.length === 0 ? (
          <div className="empty">✅ Aucune notification</div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="notification-title">
                {notification.title}
              </div>
              <div className="notification-message">
                {notification.message}
              </div>
              <div className="notification-date">
                {new Date(notification.createdAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsDropdown;
```

### Étape 5 : CSS pour le composant

Créez `src/components/NotificationsDropdown.css` :
```css
.notifications-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 350px;
  max-height: 400px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
}

.notifications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.notifications-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.unread-count {
  background: #dc3545;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.mark-all-read {
  background: none;
  border: 1px solid #007bff;
  color: #007bff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.mark-all-read:hover {
  background: #007bff;
  color: white;
}

.notifications-list {
  max-height: 350px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
}

.notification-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.notification-message {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.notification-date {
  color: #999;
  font-size: 12px;
}

.loading, .empty, .notification-error {
  padding: 20px;
  text-align: center;
  color: #666;
}

.notification-error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}
```

### Étape 6 : Intégration dans l'app principale

Modifiez votre `App.tsx` :
```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthService from './services/auth.service';

// Composants
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotificationsDropdown from './components/NotificationsDropdown';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // Vérifier l'authentification au chargement
    if (AuthService.isTokenValid()) {
      setIsAuthenticated(true);
      // Charger les infos utilisateur si nécessaire
    }
  }, []);

  const handleLogin = async (email: string, password: string, rememberMe = false) => {
    try {
      const { access_token, user: userData } = await AuthService.login(email, password, rememberMe);
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route
            path="/login"
            element={<Login onLogin={handleLogin} />}
          />
          <Route
            path="/*"
            element={
              isAuthenticated ? (
                <Dashboard user={user} onLogout={handleLogout}>
                  <NotificationsDropdown />
                </Dashboard>
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```

### Étape 7 : Variables d'environnement

Créez `.env` dans le frontend :
```bash
# Development
REACT_APP_API_URL=http://localhost:3004
REACT_APP_WS_URL=http://localhost:3004

# Production
# REACT_APP_API_URL=https://printalma-back-dep.onrender.com
# REACT_APP_WS_URL=https://printalma-back-dep.onrender.com
```

---

## 🧪 TEST DE L'IMPLÉMENTATION

### 1. Test du login
```typescript
// Dans votre composant de login
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await AuthService.login(email, password, rememberMe);
    // Rediriger vers le dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    setError('Email ou mot de passe incorrect');
  }
};
```

### 2. Test des notifications
```typescript
// Dans la console du navigateur après login
// Testez que le service fonctionne
import NotificationService from './services/notification.service';

NotificationService.getNotifications()
  .then(data => console.log('✅ Notifications:', data))
  .catch(error => console.error('❌ Erreur:', error));
```

### 3. Vérification dans le Network Tab
1. Ouvrez F12 → Network
2. Faites une action qui déclenche les notifications
3. Vérifiez que les requêtes ont le header `Authorization`

---

## 🔧 DÉBOGAGE SI PROBLÈME PERSISTE

### Vérifier le token
```javascript
// Dans la console du navigateur
console.log('Token:', localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
console.log('Token valide:', AuthService.isTokenValid());
```

### Tester l'API manuellement
```bash
# Avec curl
curl -X GET "http://localhost:3004/notifications?limit=10" \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Logs détaillés
```typescript
// Ajoutez ces logs dans votre service
console.log('🔍 Requête vers:', config.url);
console.log('🔑 Token présent:', !!token);
console.log('📤 Headers envoyés:', config.headers);
```

---

## ✅ CHECKLIST FINALE

- [ ] Service d'authentification créé avec intercepteurs
- [ ] Service de notifications utilise l'API authentifiée
- [ ] Hook React gère l'état des notifications
- [ ] Composant UI affiche les notifications
- [ ] Token sauvegardé après login
- [ ] Header Authorization ajouté automatiquement
- [ ] Erreurs 401 gérées avec redirection
- [ ] Variables d'environnement configurées

**Cette solution complète devrait résoudre 100% des erreurs 401 sur les notifications.**