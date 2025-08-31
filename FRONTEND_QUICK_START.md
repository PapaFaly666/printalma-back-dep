# 🚀 Guide Frontend Rapide - PrintAlma API

## 📋 Essentiel à Retenir

**⚠️ IMPORTANT** 
- **API URL**: `http://localhost:3004` (PAS 3000 !)
- **Obligatoire**: `credentials: 'include'` dans TOUTES les requêtes
- **Authentification**: Cookies httpOnly automatiques (plus de tokens à gérer)

---

## 🔧 Service de Base

```javascript
// authService.js
class AuthService {
  constructor() {
    this.baseUrl = 'http://localhost:3004/auth';
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: 'include', // ⭐ OBLIGATOIRE
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });

    if (response.status === 401) {
      window.location.href = '/login'; // Redirection auto
      return;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  // Authentification
  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async logout() {
    return this.request('/logout', { method: 'POST' });
  }

  async checkAuth() {
    return this.request('/check');
  }

  async changePassword(currentPassword, newPassword, confirmPassword) {
    return this.request('/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
  }

  // Réinitialisation mot de passe
  async forgotPassword(email) {
    return this.request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, newPassword, confirmPassword) {
    return this.request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, confirmPassword })
    });
  }

  // Vendeurs (utilisateur connecté)
  async listVendors() {
    return this.request('/vendors');
  }

  // Admin - Clients
  async listClients(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/admin/clients?${params}`);
  }

  async toggleClientStatus(clientId) {
    return this.request(`/admin/clients/${clientId}/toggle-status`, {
      method: 'PUT'
    });
  }

  async resetVendorPassword(email) {
    return this.request('/admin/reset-vendor-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
}

export default new AuthService();
```

---

## 🎨 React Context

```jsx
// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authService.checkAuth();
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    
    if (response.mustChangePassword) {
      return { mustChangePassword: true, userId: response.userId };
    }
    
    setUser(response.user);
    setIsAuthenticated(true);
    return { success: true };
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, loading, login, logout, checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🔐 Composant Login

```jsx
// LoginForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.mustChangePassword) {
        navigate('/change-password');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Mot de passe"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
      <a href="/forgot-password">Mot de passe oublié ?</a>
    </form>
  );
}

export default LoginForm;
```

---

## 📱 Tous les Endpoints

### 🔓 Public
```javascript
POST /auth/login                    // { email, password }
POST /auth/forgot-password          // { email }
POST /auth/verify-reset-token       // { token }
POST /auth/reset-password           // { token, newPassword, confirmPassword }
```

### 🔒 Authentifié
```javascript
POST /auth/logout
GET  /auth/check
GET  /auth/profile
PUT  /auth/change-password          // { currentPassword, newPassword, confirmPassword }
GET  /auth/vendors                  // Liste vendeurs
GET  /auth/vendors/stats            // Statistiques vendeurs
```

### 👑 Admin uniquement
```javascript
POST /auth/admin/create-client      // { firstName, lastName, email, vendeur_type }
GET  /auth/admin/clients            // ?page=1&limit=10&status=true&search=...
PUT  /auth/admin/clients/:id/toggle-status
POST /auth/admin/reset-vendor-password // { email }
POST /auth/admin/cleanup-reset-tokens
```

---

## 🚨 Erreurs Courantes

### ❌ Ne marche PAS
```javascript
// Port incorrect
fetch('http://localhost:3000/auth/login')

// Pas de credentials
fetch('http://localhost:3004/auth/login', { method: 'POST' })

// Headers Authorization (obsolète)
headers: { 'Authorization': 'Bearer ' + token }
```

### ✅ Marche
```javascript
// Port correct + credentials
fetch('http://localhost:3004/auth/login', {
  method: 'POST',
  credentials: 'include', // OBLIGATOIRE
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

---

## 🛡️ Protection Routes

```jsx
// ProtectedRoute.jsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && !['ADMIN', 'SUPERADMIN'].includes(user?.role)) {
    return <div>Accès refusé</div>;
  }

  return children;
}

export default ProtectedRoute;
```

---

## 🎯 Types de Vendeur

```javascript
const VENDOR_TYPES = {
  DESIGNER: { label: 'Designer', icon: '🎨' },
  INFLUENCEUR: { label: 'Influenceur', icon: '📱' },
  ARTISTE: { label: 'Artiste', icon: '🎭' }
};
```

---

## ⚡ Setup Rapide

1. **Copier `authService.js`** avec le bon port (3004)
2. **Ajouter `AuthContext.jsx`** 
3. **Wrap App** avec `<AuthProvider>`
4. **Utiliser `useAuth()`** dans les composants
5. **Toujours** `credentials: 'include'`

---

## 📞 Support

- **Types TypeScript**: `types/frontend-types.ts`
- **Doc complète**: `FRONTEND_COMPLETE_GUIDE.md`
- **Réinitialisation**: `PASSWORD_RESET_API_DOCUMENTATION.md`
- **Vendeurs**: `VENDEURS_API_FRONTEND.md`

**🎯 C'est parti ! Cookies automatiques = Frontend simplifié** ✨ 