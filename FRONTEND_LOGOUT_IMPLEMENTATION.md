# 🚪 Guide Frontend - Déconnexion Vendeur

## 📋 **Vue d'Ensemble**

Ce guide vous aide à implémenter la déconnexion des vendeurs dans votre application frontend React en utilisant l'API PrintAlma.

### 🎯 **Fonctionnalités à Implémenter**
1. 🔓 **Bouton de déconnexion** dans l'interface
2. 🔄 **Appel API** vers l'endpoint de déconnexion
3. 🧹 **Nettoyage de l'état** local (context, localStorage, etc.)
4. 🚀 **Redirection** vers la page de connexion
5. ⚠️ **Gestion d'erreurs** et feedback utilisateur

---

## 🔧 **Endpoint Backend**

### **POST /auth/logout**

#### 📥 **Requête**
```javascript
POST http://localhost:3004/auth/logout
Content-Type: application/json
Credentials: include  // ⭐ OBLIGATOIRE pour les cookies
```

#### 📤 **Réponse Succès**
```json
{
  "message": "Déconnexion réussie",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

#### 📤 **Réponse Erreur**
```json
{
  "message": "Déconnexion effectuée",
  "note": "Cookie supprimé même en cas d'erreur"
}
```

---

## 🛠️ **Service Frontend**

### **AuthService - Méthode de Déconnexion**

```javascript
// services/authService.js

class AuthService {
  constructor() {
    this.baseUrl = 'http://localhost:3004/auth';
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: 'include', // ⭐ OBLIGATOIRE
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Erreur de connexion' 
      }));
      throw new Error(error.message || 'Erreur inconnue');
    }

    // Gérer les réponses vides
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  // === DÉCONNEXION ===
  async logout() {
    try {
      const response = await this.request('/logout', { 
        method: 'POST' 
      });
      
      console.log('✅ Déconnexion réussie:', response?.message);
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      // Ne pas faire échouer la déconnexion côté frontend
      // même si l'API a un problème
      return { 
        message: 'Déconnexion effectuée localement',
        error: error.message 
      };
    }
  }

  // === VÉRIFICATION AUTHENTIFICATION ===
  async checkAuth() {
    try {
      return await this.request('/check');
    } catch (error) {
      throw error;
    }
  }

  // === AUTRES MÉTHODES ===
  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/profile');
  }
}

export default new AuthService();
```

---

## 🎯 **Context React avec Déconnexion**

### **AuthContext - Gestion de la Déconnexion**

```jsx
// contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérification initiale de l'authentification
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.checkAuth();
      if (response?.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚪 DÉCONNEXION COMPLÈTE
  const logout = async () => {
    try {
      setLoading(true);
      
      // 1. Appeler l'API de déconnexion
      await authService.logout();
      
      // 2. Nettoyer l'état local
      clearLocalState();
      
      // 3. Rediriger vers la page de connexion
      redirectToLogin();
      
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      
      // Même en cas d'erreur, nettoyer l'état local
      clearLocalState();
      redirectToLogin();
    }
  };

  // Nettoyer l'état local
  const clearLocalState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    setLoading(false);
    
    // Nettoyer localStorage si vous l'utilisez
    localStorage.removeItem('user');
    localStorage.removeItem('preferences');
    
    // Nettoyer sessionStorage si vous l'utilisez
    sessionStorage.clear();
  };

  // Redirection vers la page de connexion
  const redirectToLogin = () => {
    // Option 1: Si vous utilisez React Router
    window.location.href = '/login';
    
    // Option 2: Si vous avez accès à navigate (React Router v6)
    // navigate('/login', { replace: true });
    
    // Option 3: Si vous voulez forcer un reload complet
    // window.location.reload();
  };

  // Déconnexion forcée (en cas d'erreur 401 sur d'autres endpoints)
  const forceLogout = useCallback(() => {
    console.log('🚨 Déconnexion forcée (token expiré ou invalide)');
    clearLocalState();
    redirectToLogin();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authService.login(email, password);
      
      if (response.mustChangePassword) {
        return { 
          mustChangePassword: true, 
          userId: response.userId,
          message: response.message 
        };
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true, user: response.user };
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    // État
    user,
    isAuthenticated,
    loading,
    error,
    
    // Actions
    login,
    logout,          // ⭐ Méthode de déconnexion principale
    forceLogout,     // ⭐ Déconnexion forcée
    checkAuthStatus,
    clearLocalState,
    
    // Utilitaires
    isAdmin: () => user && ['ADMIN', 'SUPERADMIN'].includes(user.role),
    isVendor: () => user && user.role === 'VENDEUR',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🔓 **Composants de Déconnexion**

### 1. **LogoutButton - Bouton Simple**

```jsx
// components/common/LogoutButton.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LogoutButton = ({ 
  variant = 'button',     // 'button' | 'link' | 'icon'
  showConfirm = true,     // Afficher confirmation
  className = '',
  children,
  disabled = false
}) => {
  const { logout, user, loading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    // Confirmation utilisateur
    if (showConfirm) {
      const confirmed = window.confirm(
        `Êtes-vous sûr de vouloir vous déconnecter, ${user?.firstName} ?`
      );
      if (!confirmed) return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
      // La redirection est gérée dans le context
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      setIsLoggingOut(false);
    }
  };

  const getContent = () => {
    if (children) return children;
    
    if (isLoggingOut) {
      return variant === 'icon' ? '⏳' : 'Déconnexion...';
    }
    
    switch (variant) {
      case 'icon':
        return '🚪';
      case 'link':
        return 'Se déconnecter';
      default:
        return 'Déconnexion';
    }
  };

  const getClassName = () => {
    const baseClasses = {
      button: 'btn btn-outline-danger',
      link: 'logout-link',
      icon: 'btn-icon logout-icon'
    };
    
    return `${baseClasses[variant]} ${className}`;
  };

  return (
    <button
      onClick={handleLogout}
      disabled={disabled || loading || isLoggingOut}
      className={getClassName()}
      title="Se déconnecter"
    >
      {getContent()}
    </button>
  );
};

export default LogoutButton;
```

### 2. **LogoutModal - Modal de Confirmation**

```jsx
// components/common/LogoutModal.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LogoutModal = ({ isOpen, onClose }) => {
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onClose(); // Fermer le modal
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Confirmation de déconnexion</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          <p>
            Êtes-vous sûr de vouloir vous déconnecter, <strong>{user?.firstName}</strong> ?
          </p>
          <p className="text-muted">
            Vous devrez vous reconnecter pour accéder à votre compte.
          </p>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isLoggingOut}
          >
            Annuler
          </button>
          <button 
            className="btn btn-danger" 
            onClick={handleConfirmLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? '⏳ Déconnexion...' : '🚪 Se déconnecter'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
```

### 3. **UserMenu - Menu Dropdown avec Déconnexion**

```jsx
// components/common/UserMenu.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LogoutButton from './LogoutButton';

const UserMenu = () => {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) return null;

  const getVendorTypeIcon = () => {
    const icons = {
      'DESIGNER': '🎨',
      'INFLUENCEUR': '📱',
      'ARTISTE': '🎭'
    };
    return icons[user?.vendeur_type] || '👤';
  };

  return (
    <div className="user-menu">
      <div 
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="user-avatar">
          <span className="avatar-icon">{getVendorTypeIcon()}</span>
          <span className="avatar-text">
            {user?.firstName[0]}{user?.lastName[0]}
          </span>
        </div>
        
        <div className="user-info">
          <span className="user-name">
            {user?.firstName} {user?.lastName}
          </span>
          <span className="user-type">
            {user?.vendeur_type?.toLowerCase()}
          </span>
        </div>
        
        <span className="dropdown-arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </div>
      
      {isOpen && (
        <div className="user-dropdown">
          <a href="/profile" className="dropdown-item">
            👤 Mon Profil
          </a>
          
          <a href="/settings" className="dropdown-item">
            ⚙️ Paramètres
          </a>
          
          <a href="/change-password" className="dropdown-item">
            🔒 Changer le mot de passe
          </a>
          
          <hr className="dropdown-separator" />
          
          <div className="dropdown-item">
            <LogoutButton 
              variant="link" 
              showConfirm={true}
              className="logout-dropdown"
            >
              🚪 Se déconnecter
            </LogoutButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
```

---

## 🎨 **CSS pour les Composants**

```css
/* styles/logout.css */

/* LogoutButton */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-outline-danger {
  background: transparent;
  border: 1px solid #dc3545;
  color: #dc3545;
}

.btn-outline-danger:hover {
  background: #dc3545;
  color: white;
}

.btn-outline-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logout-link {
  background: none;
  border: none;
  color: #dc3545;
  text-decoration: underline;
  cursor: pointer;
}

.logout-icon {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
}

/* UserMenu */
.user-menu {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-menu-trigger:hover {
  background: #f8f9fa;
}

.user-avatar {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
}

.avatar-icon {
  position: absolute;
  top: -2px;
  right: -2px;
  background: white;
  border-radius: 50%;
  padding: 2px;
  font-size: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.user-type {
  font-size: 12px;
  color: #666;
  text-transform: capitalize;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 8px 0;
  min-width: 200px;
  z-index: 1000;
}

.dropdown-item {
  display: block;
  padding: 12px 16px;
  text-decoration: none;
  color: #333;
  font-size: 14px;
  transition: background 0.2s;
}

.dropdown-item:hover {
  background: #f8f9fa;
}

.dropdown-separator {
  margin: 8px 0;
  border: none;
  border-top: 1px solid #eee;
}

.logout-dropdown {
  width: 100%;
  text-align: left;
  border: none;
  background: none;
  color: #dc3545;
}

/* Responsive */
@media (max-width: 768px) {
  .user-info {
    display: none;
  }
  
  .modal-content {
    margin: 20px;
  }
}
```

---

## 🔄 **Gestion des Erreurs & Interceptors**

### **Interceptor Axios (optionnel)**

```javascript
// utils/axiosInterceptor.js

import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

// Créer une instance axios
const apiClient = axios.create({
  baseURL: 'http://localhost:3004',
  withCredentials: true,
});

// Interceptor pour gérer les erreurs 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      const { forceLogout } = useAuth();
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### **Hook de Déconnexion Automatique**

```jsx
// hooks/useAutoLogout.js

import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useAutoLogout = (inactivityTime = 30 * 60 * 1000) => { // 30 minutes
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log('⏰ Déconnexion automatique pour inactivité');
        logout();
      }, inactivityTime);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    // Démarrer le timer
    resetTimeout();
    
    // Écouter les événements d'activité
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Nettoyage
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }, [isAuthenticated, logout, inactivityTime]);
};

export default useAutoLogout;
```

---

## 🧪 **Tests Frontend**

### **Test du Service de Déconnexion**

```javascript
// tests/authService.test.js

import authService from '../services/authService';

describe('AuthService - Logout', () => {
  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();
  });

  test('should call logout endpoint', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ message: 'Déconnexion réussie' })
    });

    const result = await authService.logout();
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3004/auth/logout',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include'
      })
    );
    
    expect(result.message).toBe('Déconnexion réussie');
  });

  test('should handle logout errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await authService.logout();
    
    expect(result.message).toBe('Déconnexion effectuée localement');
    expect(result.error).toBe('Network error');
  });
});
```

### **Test du Composant LogoutButton**

```jsx
// tests/LogoutButton.test.jsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import LogoutButton from '../components/common/LogoutButton';

const MockAuthProvider = ({ children, mockLogout = jest.fn() }) => {
  const mockValue = {
    logout: mockLogout,
    user: { firstName: 'Jean' },
    loading: false
  };

  return (
    <AuthProvider value={mockValue}>
      {children}
    </AuthProvider>
  );
};

describe('LogoutButton', () => {
  test('should render logout button', () => {
    render(
      <MockAuthProvider>
        <LogoutButton />
      </MockAuthProvider>
    );

    expect(screen.getByText('Déconnexion')).toBeInTheDocument();
  });

  test('should call logout when clicked', async () => {
    const mockLogout = jest.fn();
    
    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(
      <MockAuthProvider mockLogout={mockLogout}>
        <LogoutButton />
      </MockAuthProvider>
    );

    fireEvent.click(screen.getByText('Déconnexion'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  test('should show confirmation dialog', () => {
    window.confirm = jest.fn(() => false);

    render(
      <MockAuthProvider>
        <LogoutButton />
      </MockAuthProvider>
    );

    fireEvent.click(screen.getByText('Déconnexion'));

    expect(window.confirm).toHaveBeenCalledWith(
      'Êtes-vous sûr de vouloir vous déconnecter, Jean ?'
    );
  });
});
```

---

## 🚀 **Intégration dans votre App**

### **App.jsx - Exemple Complet**

```jsx
// App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/layout/Header';
import ProtectedRoute from './components/common/ProtectedRoute';
import useAutoLogout from './hooks/useAutoLogout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  // Déconnexion automatique après 30 minutes d'inactivité
  useAutoLogout(30 * 60 * 1000);

  return (
    <Router>
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

### **Header avec Déconnexion**

```jsx
// components/layout/Header.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserMenu from '../common/UserMenu';
import LogoutButton from '../common/LogoutButton';

const Header = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">
          PrintAlma
        </Link>
        
        {isAuthenticated && (
          <nav className="nav">
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/vendors" className="nav-link">
              Communauté
            </Link>
          </nav>
        )}
        
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <UserMenu />
              {/* OU un bouton simple */}
              {/* <LogoutButton variant="button" /> */}
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
```

---

## 🔧 **Configuration et Variables**

### **Configuration de l'Environnement**

```javascript
// config/api.js

const config = {
  development: {
    API_BASE_URL: 'http://localhost:3004',
    AUTO_LOGOUT_TIME: 30 * 60 * 1000, // 30 minutes
  },
  production: {
    API_BASE_URL: 'https://api.printalma.com',
    AUTO_LOGOUT_TIME: 15 * 60 * 1000, // 15 minutes
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

---

## 📋 **Checklist d'Implémentation**

### ✅ **Backend - Déjà Fait**
- [x] Endpoint `POST /auth/logout` opérationnel
- [x] Suppression des cookies httpOnly
- [x] Gestion d'erreurs robuste
- [x] Logging des déconnexions

### ✅ **Frontend - À Implémenter**

1. **[ ] Service AuthService**
   - [ ] Méthode `logout()` avec gestion d'erreurs
   - [ ] Configuration avec `credentials: 'include'`

2. **[ ] Context AuthContext**
   - [ ] Méthode `logout()` complète
   - [ ] Nettoyage de l'état local
   - [ ] Redirection automatique

3. **[ ] Composants**
   - [ ] `LogoutButton` simple
   - [ ] `LogoutModal` avec confirmation
   - [ ] `UserMenu` avec dropdown

4. **[ ] Tests**
   - [ ] Tests unitaires du service
   - [ ] Tests des composants
   - [ ] Tests d'intégration

5. **[ ] UX/UI**
   - [ ] Confirmation avant déconnexion
   - [ ] Feedback visuel (loading, etc.)
   - [ ] Déconnexion automatique pour inactivité

---

## 🎯 **Points Clés à Retenir**

1. **✅ Toujours utiliser `credentials: 'include'`** dans les requêtes
2. **✅ Nettoyer l'état local** même en cas d'erreur API
3. **✅ Rediriger vers /login** après déconnexion
4. **✅ Demander confirmation** avant déconnexion
5. **✅ Gérer la déconnexion automatique** en cas d'erreur 401

---

## 🚨 **Dépannage Courant**

### **Problème : Cookie non supprimé**
```javascript
// ❌ Mauvais
fetch('/auth/logout', { method: 'POST' });

// ✅ Correct
fetch('/auth/logout', { 
  method: 'POST',
  credentials: 'include'  // ⭐ OBLIGATOIRE
});
```

### **Problème : Utilisateur reste connecté après logout**
```javascript
// Vérifiez que vous nettoyez bien l'état local
const logout = async () => {
  await authService.logout();
  
  // ⭐ Important: Nettoyer l'état
  setUser(null);
  setIsAuthenticated(false);
  localStorage.clear();
  
  // ⭐ Important: Rediriger
  window.location.href = '/login';
};
```

**🎯 Avec cette documentation, votre équipe frontend peut implémenter une déconnexion complète et robuste !** ✨ 