# 📖 Guide Complet Frontend - PrintAlma API

## 📋 Table des Matières

1. [🔧 Configuration de Base](#-configuration-de-base)
2. [🏗️ Architecture](#️-architecture)
3. [🔐 Authentification](#-authentification)
4. [👑 Administration](#-administration)
5. [👥 Gestion des Vendeurs](#-gestion-des-vendeurs)
6. [🔄 Réinitialisation Mot de Passe](#-réinitialisation-mot-de-passe)
7. [🛡️ Protection des Routes](#️-protection-des-routes)
8. [🎨 Interface Utilisateur](#-interface-utilisateur)
9. [🚨 Gestion d'Erreurs](#-gestion-derreurs)
10. [📱 Types TypeScript](#-types-typescript)

---

## 🔧 Configuration de Base

### ⚡ Points Critiques
```javascript
// ⚠️ OBLIGATOIRE
const API_BASE_URL = 'http://localhost:3004'; // PAS 3000 !
const FRONTEND_URL = 'http://localhost:5174'; // Vite par défaut

// Dans TOUTES les requêtes
credentials: 'include' // Pour les cookies httpOnly
```

### 📦 Dépendances Recommandées
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0",
    "react-query": "^3.39.0", // Optionnel pour cache
    "@types/react": "^18.0.0" // Si TypeScript
  }
}
```

---

## 🏗️ Architecture

### 📁 Structure Recommandée
```
src/
├── services/
│   └── authService.js
├── contexts/
│   └── AuthContext.jsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── ChangePasswordForm.jsx
│   │   └── ForgotPasswordForm.jsx
│   ├── admin/
│   │   ├── ClientsList.jsx
│   │   └── AdminDashboard.jsx
│   └── common/
│       ├── ProtectedRoute.jsx
│       └── Layout.jsx
├── hooks/
│   └── useAuth.js
└── types/
    └── auth.types.ts
```

---

## 🔐 Authentification

### 🛠️ Service d'Authentification Complet

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

    // Gestion automatique de la déconnexion
    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Erreur de connexion' 
      }));
      throw new Error(error.message || 'Erreur inconnue');
    }

    return response.json();
  }

  // === AUTHENTIFICATION ===
  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/logout', { method: 'POST' });
  }

  async checkAuth() {
    return this.request('/check');
  }

  async getProfile() {
    return this.request('/profile');
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return this.request('/change-password', {
      method: 'PUT',
      body: JSON.stringify({ 
        currentPassword, 
        newPassword, 
        confirmPassword 
      }),
    });
  }

  // === RÉINITIALISATION MOT DE PASSE ===
  async forgotPassword(email) {
    return this.request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetToken(token) {
    return this.request('/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resetPassword(token, newPassword, confirmPassword) {
    return this.request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
  }

  // === VENDEURS ===
  async listVendors() {
    return this.request('/vendors');
  }

  async getVendorsStats() {
    return this.request('/vendors/stats');
  }

  // === ADMIN - CLIENTS ===
  async createClient(clientData) {
    return this.request('/admin/create-client', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async listClients(filters = {}) {
    const params = new URLSearchParams(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    );
    return this.request(`/admin/clients?${params}`);
  }

  async toggleClientStatus(clientId) {
    return this.request(`/admin/clients/${clientId}/toggle-status`, {
      method: 'PUT',
    });
  }

  async resetVendorPassword(email) {
    return this.request('/admin/reset-vendor-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async cleanupResetTokens() {
    return this.request('/admin/cleanup-reset-tokens', {
      method: 'POST',
    });
  }
}

export default new AuthService();
```

### 🎯 Context React Avancé

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
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
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
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
    }
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const clearError = () => setError(null);

  const isAdmin = () => {
    return user && ['ADMIN', 'SUPERADMIN'].includes(user.role);
  };

  const isVendor = () => {
    return user && user.role === 'VENDEUR';
  };

  const value = {
    // État
    user,
    isAuthenticated,
    loading,
    error,
    
    // Actions
    login,
    logout,
    checkAuthStatus,
    updateUser,
    clearError,
    
    // Utilitaires
    isAdmin,
    isVendor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 👑 Administration

### 📊 Dashboard Admin

```jsx
// components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';

function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined,
    vendeur_type: '',
    search: ''
  });
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    if (isAdmin()) {
      loadClients();
    }
  }, [filters]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await authService.listClients(filters);
      setClients(response.clients);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (clientId) => {
    try {
      await authService.toggleClientStatus(clientId);
      loadClients(); // Recharger la liste
    } catch (error) {
      console.error('Erreur toggle status:', error);
    }
  };

  const handleResetPassword = async (email) => {
    if (!confirm(`Réinitialiser le mot de passe pour ${email} ?`)) return;
    
    try {
      await authService.resetVendorPassword(email);
      alert('Mot de passe réinitialisé avec succès !');
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  if (!isAdmin()) {
    return <div>Accès refusé - Admin uniquement</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Dashboard Admin</h1>
      
      {/* Filtres */}
      <div className="filters">
        <input
          type="text"
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            search: e.target.value, 
            page: 1 
          }))}
        />
        
        <select
          value={filters.vendeur_type}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            vendeur_type: e.target.value, 
            page: 1 
          }))}
        >
          <option value="">Tous les types</option>
          <option value="DESIGNER">Designer</option>
          <option value="INFLUENCEUR">Influenceur</option>
          <option value="ARTISTE">Artiste</option>
        </select>
        
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ 
            ...prev, 
            status: e.target.value === '' ? undefined : e.target.value === 'true',
            page: 1 
          }))}
        >
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
      </div>

      {/* Liste des clients */}
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="clients-list">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td>{client.firstName} {client.lastName}</td>
                  <td>{client.email}</td>
                  <td>{client.vendeur_type}</td>
                  <td>
                    <span className={`status ${client.status ? 'active' : 'inactive'}`}>
                      {client.status ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td>
                    {client.last_login_at ? 
                      new Date(client.last_login_at).toLocaleString() : 
                      'Jamais'
                    }
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleStatus(client.id)}
                      className={client.status ? 'btn-danger' : 'btn-success'}
                    >
                      {client.status ? 'Désactiver' : 'Activer'}
                    </button>
                    <button 
                      onClick={() => handleResetPassword(client.email)}
                      className="btn-warning"
                    >
                      Reset Password
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                disabled={!pagination.hasPrevious}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  page: prev.page - 1 
                }))}
              >
                Précédent
              </button>
              
              <span>
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              
              <button 
                disabled={!pagination.hasNext}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  page: prev.page + 1 
                }))}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
```

### ➕ Création de Client

```jsx
// components/admin/CreateClientForm.jsx
import React, { useState } from 'react';
import authService from '../../services/authService';

function CreateClientForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    vendeur_type: 'DESIGNER'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.createClient(formData);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        vendeur_type: 'DESIGNER'
      });
      onSuccess?.();
      alert('Client créé avec succès !');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-client-form">
      <h3>Créer un Nouveau Client</h3>
      
      <div className="form-group">
        <label>Prénom *</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Nom *</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Type de Vendeur *</label>
        <select
          value={formData.vendeur_type}
          onChange={(e) => setFormData({...formData, vendeur_type: e.target.value})}
          required
        >
          <option value="DESIGNER">Designer</option>
          <option value="INFLUENCEUR">Influenceur</option>
          <option value="ARTISTE">Artiste</option>
        </select>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer Client'}
      </button>
    </form>
  );
}

export default CreateClientForm;
```

---

## 👥 Gestion des Vendeurs

### 📋 Liste Communauté Vendeurs

```jsx
// components/vendors/VendorsList.jsx
import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';

function VendorsList() {
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVendorsData();
  }, []);

  const loadVendorsData = async () => {
    try {
      setLoading(true);
      const [vendorsResponse, statsResponse] = await Promise.all([
        authService.listVendors(),
        authService.getVendorsStats()
      ]);
      
      setVendors(vendorsResponse.vendors);
      setStats(statsResponse.stats);
    } catch (error) {
      console.error('Erreur chargement vendeurs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="vendors-community">
      <h2>Communauté des Vendeurs</h2>
      
      {/* Statistiques */}
      <div className="stats-grid">
        {stats.map(stat => (
          <div key={stat.type} className="stat-card">
            <div className="stat-icon">{stat.icon}</div>
            <div className="stat-info">
              <h3>{stat.count}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste des vendeurs */}
      <div className="vendors-grid">
        {vendors.map(vendor => (
          <div key={vendor.id} className="vendor-card">
            <div className="vendor-avatar">
              {vendor.firstName[0]}{vendor.lastName[0]}
            </div>
            <h3>{vendor.firstName} {vendor.lastName}</h3>
            <p className="vendor-type">{vendor.vendeur_type}</p>
            <p className="vendor-email">{vendor.email}</p>
            <p className="vendor-joined">
              Membre depuis {new Date(vendor.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VendorsList;
```

---

## 🔄 Réinitialisation Mot de Passe

### 📧 Mot de Passe Oublié

```jsx
// components/auth/ForgotPasswordForm.jsx
import React, { useState } from 'react';
import authService from '../../services/authService';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await authService.forgotPassword(email);
      setMessage(response.message);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-form">
      <h2>Mot de passe oublié</h2>
      <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </form>
      
      <a href="/login">Retour à la connexion</a>
    </div>
  );
}

export default ForgotPasswordForm;
```

### 🔐 Réinitialisation avec Token

```jsx
// components/auth/ResetPasswordForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

function ResetPasswordForm() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await authService.verifyResetToken(token);
      setTokenValid(response.valid);
      setUserInfo({
        email: response.userEmail,
        name: response.userName
      });
    } catch (err) {
      setError(err.message);
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPassword(token, formData.newPassword, formData.confirmPassword);
      alert('Mot de passe réinitialisé avec succès !');
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verifying) return <div>Vérification du token...</div>;

  if (!tokenValid) {
    return (
      <div className="error-page">
        <h2>Lien Invalide</h2>
        <p>{error || 'Ce lien de réinitialisation est invalide ou a expiré.'}</p>
        <a href="/forgot-password">Demander un nouveau lien</a>
      </div>
    );
  }

  return (
    <div className="reset-password-form">
      <h2>Nouveau Mot de Passe</h2>
      {userInfo && (
        <p>Réinitialisation pour: <strong>{userInfo.email}</strong></p>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nouveau mot de passe</label>
          <input
            type="password"
            placeholder="Au moins 8 caractères"
            value={formData.newPassword}
            onChange={(e) => setFormData({
              ...formData, 
              newPassword: e.target.value
            })}
            required
            minLength="8"
          />
        </div>
        
        <div className="form-group">
          <label>Confirmer le mot de passe</label>
          <input
            type="password"
            placeholder="Confirmez votre mot de passe"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({
              ...formData, 
              confirmPassword: e.target.value
            })}
            required
            minLength="8"
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Réinitialisation...' : 'Réinitialiser'}
        </button>
      </form>
    </div>
  );
}

export default ResetPasswordForm;
```

---

## 🛡️ Protection des Routes

### 🔒 Composant ProtectedRoute

```jsx
// components/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ 
  children, 
  adminOnly = false, 
  vendorOnly = false,
  redirectTo = '/login' 
}) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (adminOnly && !['ADMIN', 'SUPERADMIN'].includes(user?.role)) {
    return (
      <div className="access-denied">
        <h2>Accès Refusé</h2>
        <p>Cette page est réservée aux administrateurs.</p>
      </div>
    );
  }

  if (vendorOnly && user?.role !== 'VENDEUR') {
    return (
      <div className="access-denied">
        <h2>Accès Refusé</h2>
        <p>Cette page est réservée aux vendeurs.</p>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
```

### 🎯 Hook useRequireAuth

```jsx
// hooks/useRequireAuth.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function useRequireAuth(adminOnly = false) {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        navigate('/login');
      } else if (adminOnly && !['ADMIN', 'SUPERADMIN'].includes(user?.role)) {
        navigate('/unauthorized');
      }
    }
  }, [isAuthenticated, user, loading, adminOnly, navigate]);

  return { isAuthenticated, user, loading };
}

export default useRequireAuth;
```

---

## 🎨 Interface Utilisateur

### 🎯 Layout Principal

```jsx
// components/common/Layout.jsx
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

function Layout({ children }) {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      await logout();
    }
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <Link to="/" className="logo">
            PrintAlma
          </Link>
          
          {isAuthenticated && (
            <nav className="nav">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/vendors">Vendeurs</Link>
              
              {isAdmin() && (
                <Link to="/admin">Administration</Link>
              )}
              
              <div className="user-menu">
                <span>Bonjour, {user?.firstName}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Déconnexion
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>
      
      <main className="main">
        <div className="container">
          {children}
        </div>
      </main>
      
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 PrintAlma. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
```

### 🎨 CSS de Base

```css
/* styles/main.css */
:root {
  --primary: #007bff;
  --success: #28a745;
  --danger: #dc3545;
  --warning: #ffc107;
  --light: #f8f9fa;
  --dark: #343a40;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary { background: var(--primary); color: white; }
.btn-success { background: var(--success); color: white; }
.btn-danger { background: var(--danger); color: white; }
.btn-warning { background: var(--warning); color: white; }

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 10px;
  border-radius: 4px;
  margin: 10px 0;
}

.loading-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.vendors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.vendor-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.vendor-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  margin: 0 auto 15px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.status.active { color: var(--success); }
.status.inactive { color: var(--danger); }
```

---

## 🚨 Gestion d'Erreurs

### ⚡ Hook useErrorHandler

```jsx
// hooks/useErrorHandler.js
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

function useErrorHandler() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  const handleError = useCallback((error) => {
    console.error('Error:', error);
    
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      logout();
      return;
    }
    
    setError(error.message || 'Une erreur est survenue');
  }, [logout]);

  const executeAsync = useCallback(async (asyncFunction) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      return result;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    loading,
    executeAsync,
    clearError,
    handleError
  };
}

export default useErrorHandler;
```

### 🛠️ Composant ErrorBoundary

```jsx
// components/common/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Oups ! Une erreur est survenue</h2>
          <p>Une erreur inattendue s'est produite. Veuillez rafraîchir la page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## 📱 Types TypeScript

### 🎯 Types d'Authentification

```typescript
// types/auth.types.ts
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'SUPERADMIN' | 'VENDEUR';
  vendeur_type: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
  status: boolean;
  must_change_password: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user?: User;
  mustChangePassword?: boolean;
  userId?: number;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
  isAdmin: () => boolean;
  isVendor: () => boolean;
}

export interface CreateClientDto {
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
}

export interface ListClientsFilters {
  page?: number;
  limit?: number;
  status?: boolean;
  vendeur_type?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ClientsListResponse {
  clients: User[];
  pagination: PaginationInfo;
  filters: ListClientsFilters;
}

export interface VendorStats {
  type: string;
  count: number;
  label: string;
  icon: string;
}

export interface VendorsResponse {
  vendors: User[];
  total: number;
  message: string;
}

export interface VendorsStatsResponse {
  stats: VendorStats[];
  total: number;
  message: string;
}
```

---

## 📈 Points d'API Complets

### 🔓 Endpoints Publics
```typescript
POST /auth/login                     // { email, password }
POST /auth/forgot-password           // { email }
POST /auth/verify-reset-token        // { token }
POST /auth/reset-password            // { token, newPassword, confirmPassword }
```

### 🔒 Endpoints Authentifiés
```typescript
POST /auth/logout
GET  /auth/check
GET  /auth/profile
PUT  /auth/change-password           // { currentPassword, newPassword, confirmPassword }
GET  /auth/vendors                   // Liste communauté vendeurs
GET  /auth/vendors/stats             // Statistiques par type
```

### 👑 Endpoints Admin
```typescript
POST /auth/admin/create-client       // { firstName, lastName, email, vendeur_type }
GET  /auth/admin/clients             // ?page=1&limit=10&status=true&search=...
PUT  /auth/admin/clients/:id/toggle-status
POST /auth/admin/reset-vendor-password // { email }
POST /auth/admin/cleanup-reset-tokens
```

---

## 🎯 Exemple d'App Complete

```jsx
// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import VendorsPage from './pages/VendorsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              
              <Route path="/change-password" element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              } />
              
              <Route path="/vendors" element={
                <ProtectedRoute>
                  <VendorsPage />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminPage />
                </ProtectedRoute>
              } />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
```

---

## 🚀 Checklist de Déploiement

### ✅ Avant Production
- [ ] Changer l'URL API en production
- [ ] Configurer HTTPS pour les cookies sécurisés
- [ ] Tester tous les flows d'authentification
- [ ] Vérifier la gestion d'erreurs
- [ ] Optimiser les performances (React.memo, useMemo)
- [ ] Ajouter les analytics/monitoring
- [ ] Tester la compatibilité navigateurs

### 🔧 Variables d'Environnement
```javascript
// .env
VITE_API_BASE_URL=http://localhost:3004  // Dev
VITE_API_BASE_URL=https://api.printalma.com  // Prod
```

---

## 📞 Support et Documentation

- **Guide Rapide**: `FRONTEND_QUICK_START.md`
- **Réinitialisation**: `PASSWORD_RESET_API_DOCUMENTATION.md`
- **Vendeurs**: `VENDEURS_API_FRONTEND.md`
- **Admin**: `ADMIN_CLIENT_CREATION.md`

**🎯 Avec ce guide, vous avez tout pour créer une interface frontend complète et professionnelle !** ✨ 

# Guide Complet Frontend - Intégration API Products

## 🎯 Vue d'ensemble des responsabilités Frontend

Ce guide explique **TOUT** ce que votre frontend doit faire pour une intégration complète de l'API Products Printalma.

## 📋 Checklist des fonctionnalités à implémenter

### ✅ **1. Gestion des Produits (CRUD)**
- [ ] **Création** de produits avec formulaire complexe
- [ ] **Lecture** (liste + détails)
- [ ] **Mise à jour** (modification)
- [ ] **Suppression** (soft delete)

### ✅ **2. Interface Utilisateur**
- [ ] **Formulaire de création** avec validation temps réel
- [ ] **Liste des produits** avec tri et filtrage
- [ ] **Détails du produit** avec galerie d'images
- [ ] **Pagination** pour les gros volumes
- [ ] **Recherche** et **filtres avancés**

### ✅ **3. Gestion d'État**
- [ ] **Cache des données** produits
- [ ] **État de chargement** (loading states)
- [ ] **Gestion d'erreurs** globale
- [ ] **Synchronisation** avec le backend

### ✅ **4. Upload et Médias**
- [ ] **Upload d'images** avec preview
- [ ] **Gestion des fileId** uniques
- [ ] **Compression d'images** avant upload
- [ ] **Galerie interactive** avec zoom

## 🏗️ Architecture Frontend Recommandée

```
src/
├── components/
│   ├── products/
│   │   ├── ProductForm.jsx          # Création/Édition
│   │   ├── ProductList.jsx          # Liste avec pagination
│   │   ├── ProductCard.jsx          # Carte produit
│   │   ├── ProductDetail.jsx        # Détails complets
│   │   ├── ProductFilters.jsx       # Filtres et recherche
│   │   └── ImageUploader.jsx        # Upload avec preview
│   └── ui/
│       ├── Pagination.jsx           # Composant pagination
│       ├── LoadingSpinner.jsx       # États de chargement
│       └── ErrorBoundary.jsx        # Gestion d'erreurs
├── services/
│   ├── ProductService.js            # API calls
│   ├── ImageService.js              # Gestion images
│   └── CacheService.js              # Cache local
├── hooks/
│   ├── useProducts.js               # Hook produits
│   ├── usePagination.js             # Hook pagination
│   └── useImageUpload.js            # Hook upload
└── utils/
    ├── validation.js                # Validation produits
    └── formatters.js                # Formatage données
```

## 🔄 1. Gestion Complète des Produits

### Service API Complet

```javascript
// services/ProductService.js
class ProductService {
  static baseURL = '/api/products';

  // Pagination et filtres
  static async getProducts(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      category,
      status,
      sortBy,
      sortOrder
    });

    const response = await fetch(`${this.baseURL}?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des produits');
    }

    return response.json();
  }

  // Création avec upload
  static async createProduct(productData, imageFiles) {
    const formData = new FormData();
    
    const product = {
      name: productData.name,
      description: productData.description,
      price: parseFloat(productData.price),
      stock: parseInt(productData.stock),
      status: productData.status || 'draft',
      categories: productData.categories.filter(c => c.trim()),
      sizes: productData.sizes?.filter(s => s.trim()) || [],
      colorVariations: productData.colorVariations.map(cv => ({
        name: cv.name,
        colorCode: cv.colorCode.toUpperCase(),
        images: cv.images.map(img => ({
          fileId: img.fileId,
          view: img.view,
          delimitations: img.delimitations || []
        }))
      }))
    };

    formData.append('productData', JSON.stringify(product));
    
    imageFiles.forEach(fileInfo => {
      formData.append('files', fileInfo.file);
    });

    const response = await fetch(this.baseURL, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création');
    }

    return response.json();
  }

  // Mise à jour
  static async updateProduct(id, productData, imageFiles = []) {
    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    imageFiles.forEach(fileInfo => {
      formData.append('files', fileInfo.file);
    });

    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour');
    }

    return response.json();
  }

  // Suppression
  static async deleteProduct(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression');
    }

    return response.json();
  }

  // Détails d'un produit
  static async getProduct(id) {
    const response = await fetch(`${this.baseURL}/${id}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Produit non trouvé');
    }
    
    return response.json();
  }

  // Recherche
  static async searchProducts(query) {
    const response = await fetch(`${this.baseURL}/search?q=${encodeURIComponent(query)}`, {
      credentials: 'include'
    });

    return response.json();
  }
}
```

## 📄 2. Pagination Avancée

### Hook de Pagination Personnalisé

```javascript
// hooks/usePagination.js
import { useState, useEffect, useMemo } from 'react';

export function usePagination(fetchFunction, options = {}) {
  const {
    initialPage = 1,
    pageSize = 10,
    defaultFilters = {}
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);

  const totalPages = useMemo(() => 
    Math.ceil(totalItems / pageSize), [totalItems, pageSize]
  );

  const fetchData = async (page = currentPage, newFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFunction({
        page,
        limit: pageSize,
        ...newFilters
      });

      setData(result.data || result);
      setTotalItems(result.total || result.length);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchData(page);
    }
  };

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    fetchData(1, { ...filters, ...newFilters });
  };

  const refresh = () => fetchData();

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    filters,
    goToPage,
    updateFilters,
    refresh,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}
```

### Composant Pagination

```javascript
// components/ui/Pagination.jsx
import React from 'react';

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  showInfo = true 
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="pagination-container">
      {showInfo && (
        <div className="pagination-info">
          Page {currentPage} sur {totalPages}
        </div>
      )}
      
      <div className="pagination-controls">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="pagination-btn pagination-prev"
        >
          Précédent
        </button>
        
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...' || page === currentPage}
            className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}
        
        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="pagination-btn pagination-next"
        >
          Suivant
        </button>
      </div>
    </div>
  );
};
```

## 🎨 5. Composant Carte Produit

```javascript
// components/products/ProductCard.jsx
import React, { useState } from 'react';
import { ProductService } from '../../services/ProductService';

export const ProductCard = ({ product, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  
  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    setLoading(true);
    try {
      await ProductService.deleteProduct(product.id);
      onUpdate();
    } catch (error) {
      alert('Erreur lors de la suppression: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = product.status === 'published' ? 'draft' : 'published';
    
    setLoading(true);
    try {
      await ProductService.updateProduct(product.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      alert('Erreur lors de la mise à jour: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const mainImage = product.colorVariations?.[0]?.images?.[0]?.url;

  return (
    <div className="product-card">
      <div className="product-image">
        {mainImage ? (
          <img src={mainImage} alt={product.name} />
        ) : (
          <div className="no-image">Pas d'image</div>
        )}
        
        <div className="product-status">
          <span className={`status-badge ${product.status}`}>
            {product.status === 'published' ? 'Publié' : 'Brouillon'}
          </span>
        </div>
      </div>
      
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="product-price">{product.price} FCFA</p>
        <p className="product-stock">Stock: {product.stock}</p>
        
        <div className="product-colors">
          {product.colorVariations?.slice(0, 3).map((color, index) => (
            <div 
              key={index}
              className="color-dot"
              style={{ backgroundColor: color.colorCode }}
              title={color.name}
            />
          ))}
          {product.colorVariations?.length > 3 && (
            <span className="more-colors">+{product.colorVariations.length - 3}</span>
          )}
        </div>
      </div>
      
      <div className="product-actions">
        <button 
          onClick={() => window.location.href = `/products/${product.id}`}
          className="btn-primary"
        >
          Voir détails
        </button>
        
        <button 
          onClick={handleStatusToggle}
          disabled={loading}
          className="btn-secondary"
        >
          {product.status === 'published' ? 'Dépublier' : 'Publier'}
        </button>
        
        <button 
          onClick={handleDelete}
          disabled={loading}
          className="btn-danger"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
};
```

## 🖼️ 6. Gestion Avancée des Images

```javascript
// services/ImageService.js
class ImageService {
  static async compressImage(file, maxWidth = 1920, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  static generateFileId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      throw new Error('Format d\'image non supporté. Utilisez JPG, PNG ou WebP.');
    }
    
    if (file.size > maxSize) {
      throw new Error('L\'image est trop volumineuse. Maximum 5MB.');
    }
    
    return true;
  }
}
```

## 💾 7. Cache et Performance

```javascript
// services/CacheService.js
class CacheService {
  static cache = new Map();
  static cacheTimeout = 5 * 60 * 1000; // 5 minutes

  static set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  static get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clear() {
    this.cache.clear();
  }

  static invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## 🔧 8. Hook Produits avec Cache

```javascript
// hooks/useProducts.js
import { useState, useEffect } from 'react';
import { ProductService } from '../services/ProductService';
import { CacheService } from '../services/CacheService';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProducts = async (options = {}) => {
    const cacheKey = `products_${JSON.stringify(options)}`;
    const cached = CacheService.get(cacheKey);
    
    if (cached) {
      setProducts(cached);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await ProductService.getProducts(options);
      setProducts(result);
      CacheService.set(cacheKey, result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData, files) => {
    try {
      const result = await ProductService.createProduct(productData, files);
      CacheService.invalidatePattern('products_');
      await fetchProducts();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProduct = async (id, data, files) => {
    try {
      const result = await ProductService.updateProduct(id, data, files);
      CacheService.invalidatePattern('products_');
      await fetchProducts();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    refresh: () => fetchProducts()
  };
}
```

## 📚 9. Récapitulatif des Responsabilités

### **Le Frontend DOIT gérer :**

1. **Interface Utilisateur** 🎨
   - Formulaires complexes avec validation
   - Listes avec pagination et filtres
   - Galeries d'images interactives
   - États de chargement et erreurs

2. **Gestion des Données** 💾
   - Cache local pour les performances
   - Synchronisation avec l'API
   - Validation côté client
   - Formatage des données

3. **Upload de Fichiers** 📁
   - Compression d'images
   - Validation des formats
   - Progress bars
   - Gestion des erreurs d'upload

4. **Navigation et UX** 🧭
   - Pagination intelligente
   - Recherche en temps réel
   - Filtres avancés
   - URLs avec état (query params)

5. **Performance** ⚡
   - Lazy loading des images
   - Cache intelligent
   - Optimisation des re-renders
   - Compression des requêtes

### **Ce que l'API Backend fournit :**
- Endpoints CRUD complets
- Validation des données
- Upload vers Cloudinary
- Authentification par cookies
- Gestion des erreurs HTTP

Ce guide vous donne TOUT ce qu'il faut pour une intégration frontend complète ! 🚀 