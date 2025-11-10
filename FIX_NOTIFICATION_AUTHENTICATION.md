# 🔧 Correction du Problème d'Authentification des Notifications

## ❌ Problème Identifié

Le frontend reçoit une erreur **401 (Unauthorized)** en essayant d'accéder aux notifications :
```
GET https://printalma-back-dep.onrender.com/notifications?limit=50&includeRead=true 401 (Unauthorized)
```

## 🔍 Analyse du Problème

Le problème vient de plusieurs causes possibles :

1. **Token JWT manquant ou invalide** dans les requêtes HTTP
2. **Format incorrect du header Authorization**
3. **Token expiré**
4. **Configuration incorrecte du service d'authentification**
5. **Problème de CORS entre le frontend et backend**

---

## ✅ Solution Complète

### 1. Correction du Service d'Authentification

Créez ou modifiez votre service d'authentification :

```typescript
// src/services/auth.service.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

class AuthService {
  private api: AxiosInstance;
  private static instance: AuthService;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
      timeout: 10000,
    });

    // Intercepteur pour ajouter automatiquement le token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs 401
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.warn('Token expiré ou invalide - déconnexion');
          this.logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Obtenir le token depuis plusieurs sources
  getToken(): string | null {
    // 1. Essayer depuis localStorage
    let token = localStorage.getItem('auth_token');

    // 2. Essayer depuis sessionStorage
    if (!token) {
      token = sessionStorage.getItem('auth_token');
    }

    // 3. Essayer depuis les cookies
    if (!token) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_token') {
          token = value;
          break;
        }
      }
    }

    return token;
  }

  // Sauvegarder le token
  saveToken(token: string, rememberMe: boolean = false): void {
    if (rememberMe) {
      localStorage.setItem('auth_token', token);
      sessionStorage.removeItem('auth_token');
    } else {
      sessionStorage.setItem('auth_token', token);
      localStorage.removeItem('auth_token');
    }

    // Aussi sauvegarder dans les cookies
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 jours
    document.cookie = `auth_token=${token}; expires=${expires.toUTCString()}; path=/; secure; samesite=strict`;
  }

  // Supprimer le token
  removeToken(): void {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }

  // Vérifier si le token est valide
  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded: JwtPayload = jwtDecode(token);
      const now = Math.floor(Date.now() / 1000);

      // Token expiré ?
      if (decoded.exp < now) {
        this.removeToken();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur décodage token:', error);
      this.removeToken();
      return false;
    }
  }

  // Obtenir les informations utilisateur depuis le token
  getUserInfo(): JwtPayload | null {
    if (!this.isTokenValid()) return null;

    try {
      const token = this.getToken();
      return jwtDecode(token!);
    } catch (error) {
      console.error('Erreur décodage token:', error);
      return null;
    }
  }

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return this.isTokenValid();
  }

  // Vérifier le rôle de l'utilisateur
  hasRole(role: string): boolean {
    const userInfo = this.getUserInfo();
    return userInfo?.role === role;
  }

  // Déconnexion
  logout(): void {
    this.removeToken();
    // Nettoyer d'autres données utilisateur si nécessaire
    localStorage.removeItem('user_info');
    sessionStorage.removeItem('user_info');
  }

  // Obtenir l'instance Axios configurée
  getApi(): AxiosInstance {
    return this.api;
  }
}

export default AuthService.getInstance();
```

### 2. Correction du Service de Notifications

```typescript
// src/services/notification.service.ts
import api from './auth.service';
import { notificationAPI } from './api.config';

class NotificationService {
  // Récupérer les notifications de l'utilisateur
  async getNotifications(limit: number = 50, includeRead: boolean = true): Promise<any> {
    try {
      const response = await api.get('/notifications', {
        params: {
          limit,
          includeRead: includeRead.toString()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      throw error;
    }
  }

  // Compter les notifications non lues
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.unreadCount;
    } catch (error) {
      console.error('Erreur comptage notifications non lues:', error);
      return 0;
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await api.post(`/notifications/${notificationId}/mark-read`);
    } catch (error) {
      console.error('Erreur marquer notification comme lue:', error);
      throw error;
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/notifications/mark-all-read');
    } catch (error) {
      console.error('Erreur marquer toutes notifications comme lues:', error);
      throw error;
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      throw error;
    }
  }
}

export default new NotificationService();
```

### 3. Correction du Hook useNotifications

```typescript
// src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import AuthService from '../services/auth.service';
import NotificationService from '../services/notification.service';

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
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  refresh: () => void;
}

export const useNotifications = (): NotificationHookReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Récupérer les notifications initiales
  const fetchNotifications = useCallback(async () => {
    if (!AuthService.isAuthenticated()) {
      console.log('Utilisateur non authentifié');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await NotificationService.getNotifications(20, true);
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error: any) {
      console.error('Erreur récupération notifications:', error);

      if (error.response?.status === 401) {
        setError('Non authentifié');
        AuthService.logout();
        window.location.href = '/login';
      } else {
        setError('Erreur lors du chargement des notifications');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connexion WebSocket
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      console.log('Pas de token - pas de connexion WebSocket');
      return;
    }

    const token = AuthService.getToken();
    if (!token) return;

    const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3004/notifications', {
      auth: { token },
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('Connecté aux notifications WebSocket');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Déconnecté des notifications WebSocket:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur connexion WebSocket:', error);
      setIsConnected(false);
      setError('Erreur de connexion aux notifications');
    });

    // Écouter les événements de notification
    newSocket.on('newOrderNotification', (data) => {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
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
  }, []);

  // Initialiser les notifications au montage
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Rafraîchir les notifications périodiquement
  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        fetchNotifications();
      }, 30000); // Rafraîchir toutes les 30 secondes si WebSocket déconnecté

      return () => clearInterval(interval);
    }
  }, [isConnected, fetchNotifications]);

  // Marquer comme lue
  const markAsRead = useCallback(async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquer comme lu:', error);
      setError('Erreur lors de la mise à jour');
    }
  }, []);

  // Marquer toutes comme lues
  const markAllAsRead = useCallback(async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur marquer toutes comme lues:', error);
      setError('Erreur lors de la mise à jour');
    }
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback(async (id: number) => {
    try {
      await NotificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const notificationToDelete = notifications.find(n => n.id === id);
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erreur suppression notification:', error);
      setError('Erreur lors de la suppression');
    }
  }, [notifications]);

  // Rafraîchir manuellement
  const refresh = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    refresh
  };
};

// Helper pour afficher les notifications toast
const showNotificationToast = (data: any) => {
  // Implémenter avec votre librairie de toast préférée
  if ('Notification' in window && 'permission' in Notification) {
    if (Notification.permission === 'granted') {
      new Notification(data.notification.title, {
        body: data.notification.message,
        icon: '/favicon.ico',
        tag: `notification-${data.notification.id}`,
      });
    }
  }

  // Ou utiliser react-toastify, material-ui alerts, etc.
  // Example avec react-toastify:
  // toast.info(data.notification.title, {
  //   description: data.notification.message,
  //   duration: 5000,
  //   action: {
  //     label: 'Voir',
  //     onClick: () => { /* naviguer vers les notifications */ }
  //   }
  // });
};
```

### 4. Configuration de l'API

```typescript
// src/services/api.config.ts
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
export const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3004';

// Configuration Axios globale
export const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Endpoints
export const notificationAPI = {
  getNotifications: '/notifications',
  getUnreadCount: '/notifications/unread-count',
  markAsRead: (id: number) => `/notifications/${id}/mark-read`,
  markAllAsRead: '/notifications/mark-all-read',
  delete: (id: number) => `/notifications/${id}`,
};
```

### 5. Configuration des Variables d'Environnement

Créez un fichier `.env` dans le frontend :

```bash
# Development
REACT_APP_API_URL=http://localhost:3004
REACT_APP_WS_URL=http://localhost:3004

# Production
# REACT_APP_API_URL=https://printalma-back-dep.onrender.com
# REACT_APP_WS_URL=https://printalma-back-dep.onrender.com
```

### 6. Composant d'Initialisation

```typescript
// src/components/NotificationInitializer.tsx
import React, { useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationInitializer: React.FC = () => {
  const { error, isConnected } = useNotifications();

  useEffect(() => {
    if (error) {
      console.error('Erreur notifications:', error);
      // Gérer l'erreur (afficher un message, redirection, etc.)
    }
  }, [error]);

  useEffect(() => {
    if (isConnected) {
      console.log('🔔 Notifications connectées avec succès');
    }
  }, [isConnected]);

  return null; // Ce composant ne rend rien, il initialise juste les notifications
};
```

### 7. Intégration dans l'App Principale

```typescript
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationInitializer } from './components/NotificationInitializer';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationInitializer />
        <Routes>
          {/* Vos routes */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

---

## 🔧 Vérification pas à pas

### 1. Vérifier l'authentification

```typescript
// Dans votre composant login ou auth
import AuthService from './services/auth.service';

// Après une connexion réussie
const handleLoginSuccess = (token: string, rememberMe = false) => {
  AuthService.saveToken(token, rememberMe);

  // Vérifier que le token est bien sauvegardé
  console.log('Token sauvegardé:', AuthService.getToken());
  console.log('User authentifié:', AuthService.isAuthenticated());
  console.log('User info:', AuthService.getUserInfo());

  // Rediriger vers la page principale
  window.location.href = '/dashboard';
};
```

### 2. Tester les endpoints

```bash
# Tester manuellement l'endpoint avec curl
curl -X GET "http://localhost:3004/notifications?limit=10" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### 3. Vérifier la console du navigateur

Ouvrez les outils de développement du navigateur (F12) et vérifiez :
- Onglet **Network** : Vérifiez que les requêtes API incluent bien le header `Authorization`
- Onglet **Console** : Vérifiez les logs de connexion WebSocket
- Onglet **Application** : Vérifiez que le token est bien stocké dans localStorage/cookies

---

## 🚀 Checklist de Déploiement

- [ ] Token JWT correctement sauvegardé côté frontend
- [ ] Header `Authorization: Bearer <token>` inclus dans toutes les requêtes
- [ ] Token expiré géré automatiquement
- [ ] Redirection vers login pour les erreurs 401
- [ ] Variables d'environnement configurées
- [ ] CORS correctement configuré côté backend
- [ ] WebSocket utilisant le même token d'authentification

Cette solution complète devrait résoudre le problème d'authentification 401 et permettre un fonctionnement fluide des notifications en temps réel !