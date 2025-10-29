# Guide d'Intégration Frontend - PrintAlma 🚀 (Authentification par Cookies)

## 📦 Installation et Setup

### 1. Fichiers à copier dans votre projet

1. **Types TypeScript** : Copiez `types/frontend-types.ts` dans votre projet
2. **Documentation API** : Consultez `FRONTEND_API_DOCUMENTATION.md` pour référence

### 2. Configuration de base

```typescript
// config/api.ts
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json'
  }
};
```

---

## 🔐 Authentification avec Cookies - Intégration Simplifiée

### 1. Service d'API (Simplifié - Plus de gestion de token !)

```typescript
// services/authService.ts
import { API_CONFIG } from '../config/api';
import { 
  LoginRequest, 
  LoginResponse, 
  ChangePasswordRequest,
  UserProfile,
  AuthCheckResponse,
  LogoutResponse,
  isLoginSuccess,
  isPasswordChangeRequired 
} from '../types/frontend-types';

class AuthService {
  
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      credentials: 'include', // Important : inclut les cookies
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur de connexion');
    }

    const data = await response.json();
    // Les cookies sont automatiquement définis par le navigateur
    return data;
  }

  async logout(): Promise<LogoutResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      credentials: 'include' // Important : inclut les cookies
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la déconnexion');
    }

    return response.json();
  }

  async changePassword(passwordData: ChangePasswordRequest): Promise<void> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: API_CONFIG.HEADERS,
      credentials: 'include', // Les cookies sont automatiquement envoyés
      body: JSON.stringify(passwordData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur changement mot de passe');
    }
  }

  async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: API_CONFIG.HEADERS,
      credentials: 'include' // Les cookies sont automatiquement envoyés
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expiré ou invalide - redirection automatique
        window.location.href = '/login';
      }
      throw new Error('Erreur récupération profil');
    }

    return response.json();
  }

  async checkAuth(): Promise<AuthCheckResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/check`, {
      method: 'GET',
      headers: API_CONFIG.HEADERS,
      credentials: 'include' // Les cookies sont automatiquement envoyés
    });

    if (!response.ok) {
      return { isAuthenticated: false, user: null };
    }

    return response.json();
  }
}

export const authService = new AuthService();
```

### 2. Hook React d'authentification (Simplifié !)

```typescript
// hooks/useAuth.ts
import { useState, useEffect, useContext, createContext } from 'react';
import { authService } from '../services/authService';
import { UserProfile, LoginRequest, ChangePasswordRequest } from '../types/frontend-types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<{ mustChangePassword?: boolean; userId?: number }>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  isAuthenticated: boolean;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      const authCheck = await authService.checkAuth();
      if (authCheck.isAuthenticated) {
        const profile = await authService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      console.error('Erreur vérification authentification:', error);
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    
    if ('mustChangePassword' in response) {
      return { mustChangePassword: true, userId: response.userId };
    }
    
    // Mettre à jour l'état utilisateur
    setUser(response.user);
    return {};
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
    setUser(null);
    window.location.href = '/login';
  };

  const changePassword = async (data: ChangePasswordRequest) => {
    await authService.changePassword(data);
    // Recharger le profil après changement de mot de passe
    await checkAuthStatus();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      changePassword,
      isAuthenticated: !!user,
      checkAuth: checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
};
```

---

## 🚀 Avantages de l'Authentification par Cookies

### ✅ Sécurité renforcée
- **Cookies httpOnly** : Inaccessibles via JavaScript (protection XSS)
- **Cookies Secure** : Transmission uniquement en HTTPS (production)
- **SameSite Strict** : Protection contre les attaques CSRF
- **Expiration automatique** : Gestion côté serveur

### ✅ Simplicité côté frontend
- **Plus de gestion de token** : Tout est automatique
- **Moins de code** : Plus besoin de localStorage/sessionStorage
- **Requests automatiques** : Les cookies sont envoyés automatiquement
- **Meilleure UX** : Reconnexion automatique après fermeture navigateur

---

## 👥 Gestion des Clients (Admin)

### 1. Service de gestion des clients

```typescript
// services/clientService.ts
import { API_CONFIG } from '../config/api';
import { 
  CreateClientRequest, 
  CreateClientResponse,
  ListClientsQuery,
  ListClientsResponse,
  ToggleClientStatusResponse 
} from '../types/frontend-types';

class ClientService {
  private baseUrl = `${API_CONFIG.BASE_URL}/auth/admin`;

  async createClient(clientData: CreateClientRequest): Promise<CreateClientResponse> {
    const response = await fetch(`${this.baseUrl}/create-client`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      credentials: 'include',
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async listClients(filters: ListClientsQuery = {}): Promise<ListClientsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/clients?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async toggleClientStatus(clientId: number): Promise<ToggleClientStatusResponse> {
    const response = await fetch(`${this.baseUrl}/clients/${clientId}/toggle-status`, {
      method: 'PUT',
      headers: API_CONFIG.HEADERS,
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }
}

export const clientService = new ClientService();
```

### 2. Hook pour la gestion des clients

```typescript
// hooks/useClients.ts
import { useState, useEffect } from 'react';
import { clientService } from '../services/clientService';
import { 
  ListClientsQuery, 
  ClientInfo, 
  PaginationInfo,
  ClientStatusFilter,
  VendeurType 
} from '../types/frontend-types';

export const useClients = (initialFilters: ListClientsQuery = {}) => {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListClientsQuery>(initialFilters);

  const loadClients = async (newFilters?: ListClientsQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = newFilters || filters;
      const response = await clientService.listClients(filtersToUse);
      
      setClients(response.clients);
      setPagination(response.pagination);
      setFilters(filtersToUse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleClientStatus = async (clientId: number) => {
    try {
      const result = await clientService.toggleClientStatus(clientId);
      // Recharger la liste après modification
      await loadClients();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateFilters = (newFilters: Partial<ListClientsQuery>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset à la page 1
    loadClients(updatedFilters);
  };

  const goToPage = (page: number) => {
    loadClients({ ...filters, page });
  };

  const resetFilters = () => {
    const resetFilters = { page: 1, limit: 10 };
    loadClients(resetFilters);
  };

  useEffect(() => {
    loadClients();
  }, []);

  return {
    clients,
    pagination,
    loading,
    error,
    filters,
    loadClients,
    toggleClientStatus,
    updateFilters,
    goToPage,
    resetFilters
  };
};
```

### 3. Composant de tableau des clients

```typescript
// components/ClientsTable.tsx
import React from 'react';
import { 
  ClientInfo, 
  getSellerTypeIcon, 
  getSellerTypeLabel, 
  formatLastLoginDate,
  getClientStatusColor 
} from '../types/frontend-types';

interface ClientsTableProps {
  clients: ClientInfo[];
  loading: boolean;
  onToggleStatus: (clientId: number, currentStatus: boolean) => Promise<void>;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  loading,
  onToggleStatus
}) => {
  const handleToggleStatus = async (client: ClientInfo) => {
    const action = client.status ? 'désactiver' : 'activer';
    const confirmMessage = `Êtes-vous sûr de vouloir ${action} le compte de ${client.firstName} ${client.lastName} ?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await onToggleStatus(client.id, client.status);
      } catch (error) {
        alert(`Erreur lors de la ${action === 'activer' ? 'activation' : 'désactivation'} : ${error.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div>Chargement des clients...</div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="no-clients">
        <p>Aucun client trouvé avec ces critères.</p>
      </div>
    );
  }

  return (
    <div className="clients-table-container">
      <table className="clients-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Type</th>
            <th>Email</th>
            <th>Statut</th>
            <th>Dernière connexion</th>
            <th>Créé le</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id} className={!client.status ? 'client-inactive' : ''}>
              <td>
                <div className="client-info">
                  <div className="client-name">
                    <strong>{client.firstName} {client.lastName}</strong>
                  </div>
                  <div className="client-badges">
                    {client.must_change_password && (
                      <span className="badge badge-warning">
                        🔑 Doit changer son mot de passe
                      </span>
                    )}
                    {client.locked_until && new Date(client.locked_until) > new Date() && (
                      <span className="badge badge-danger">
                        🔒 Compte verrouillé
                      </span>
                    )}
                    {client.login_attempts > 0 && (
                      <span className="badge badge-info">
                        ⚠️ {client.login_attempts} tentatives échouées
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <div className="seller-type">
                  <span className="type-icon">{getSellerTypeIcon(client.vendeur_type)}</span>
                  <span className="type-label">{getSellerTypeLabel(client.vendeur_type)}</span>
                </div>
              </td>
              <td>
                <a href={`mailto:${client.email}`} className="email-link">
                  {client.email}
                </a>
              </td>
              <td>
                <span 
                  className={`status-badge status-${getClientStatusColor(client.status)}`}
                >
                  {client.status ? '✅ Actif' : '❌ Inactif'}
                </span>
              </td>
              <td>
                <span className="last-login">
                  {formatLastLoginDate(client.last_login_at)}
                </span>
              </td>
              <td>
                <span className="created-date">
                  {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </span>
              </td>
              <td>
                <button
                  onClick={() => handleToggleStatus(client)}
                  className={`btn btn-sm ${client.status ? 'btn-danger' : 'btn-success'}`}
                  title={client.status ? 'Désactiver le client' : 'Activer le client'}
                >
                  {client.status ? '🚫 Désactiver' : '✅ Activer'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 4. Composant de filtres

```typescript
// components/ClientsFilters.tsx
import React from 'react';
import { 
  ListClientsQuery, 
  VendeurType, 
  ClientStatusFilter,
  SELLER_TYPE_CONFIG 
} from '../types/frontend-types';

interface ClientsFiltersProps {
  filters: ListClientsQuery;
  onFiltersChange: (filters: Partial<ListClientsQuery>) => void;
  onReset: () => void;
}

export const ClientsFilters: React.FC<ClientsFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ search: search || undefined });
  };

  const handleStatusChange = (status: ClientStatusFilter) => {
    const statusValue = status === 'all' ? undefined : status === 'active';
    onFiltersChange({ status: statusValue });
  };

  const handleTypeChange = (vendeur_type: string) => {
    onFiltersChange({ 
      vendeur_type: vendeur_type === 'all' ? undefined : vendeur_type as VendeurType 
    });
  };

  const currentStatusFilter: ClientStatusFilter = 
    filters.status === undefined ? 'all' : 
    filters.status ? 'active' : 'inactive';

  return (
    <div className="clients-filters">
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="search">Recherche</label>
          <input
            id="search"
            type="text"
            placeholder="Nom, prénom ou email..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="status">Statut</label>
          <select
            id="status"
            value={currentStatusFilter}
            onChange={(e) => handleStatusChange(e.target.value as ClientStatusFilter)}
            className="filter-select"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">✅ Actifs uniquement</option>
            <option value="inactive">❌ Inactifs uniquement</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type">Type de vendeur</label>
          <select
            id="type"
            value={filters.vendeur_type || 'all'}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tous les types</option>
            {Object.values(SELLER_TYPE_CONFIG).map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="limit">Par page</label>
          <select
            id="limit"
            value={filters.limit || 10}
            onChange={(e) => onFiltersChange({ limit: parseInt(e.target.value) })}
            className="filter-select"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="filter-actions">
          <button
            onClick={onReset}
            className="btn btn-secondary"
            title="Réinitialiser tous les filtres"
          >
            🔄 Reset
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 5. Page complète de gestion des clients

```typescript
// pages/ClientsManagement.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useClients } from '../hooks/useClients';
import { ClientsFilters } from '../components/ClientsFilters';
import { ClientsTable } from '../components/ClientsTable';
import { isAdmin } from '../types/frontend-types';

export const ClientsManagement: React.FC = () => {
  const { user } = useAuth();
  const {
    clients,
    pagination,
    loading,
    error,
    filters,
    toggleClientStatus,
    updateFilters,
    goToPage,
    resetFilters
  } = useClients();

  // Vérifier les permissions admin
  if (!user || !isAdmin(user)) {
    return (
      <div className="access-denied">
        <h2>Accès refusé</h2>
        <p>Vous devez être administrateur pour accéder à cette page.</p>
      </div>
    );
  }

  const handleToggleStatus = async (clientId: number, currentStatus: boolean) => {
    const result = await toggleClientStatus(clientId);
    
    // Afficher un message de succès
    const action = currentStatus ? 'désactivé' : 'activé';
    alert(`Client ${action} avec succès !`);
    
    return result;
  };

  return (
    <div className="clients-management">
      <div className="page-header">
        <h1>Gestion des Clients</h1>
        <div className="page-stats">
          {pagination && (
            <span className="stats-text">
              {pagination.total} client{pagination.total > 1 ? 's' : ''} au total
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <strong>Erreur :</strong> {error}
        </div>
      )}

      <ClientsFilters
        filters={filters}
        onFiltersChange={updateFilters}
        onReset={resetFilters}
      />

      <ClientsTable
        clients={clients}
        loading={loading}
        onToggleStatus={handleToggleStatus}
      />

      {pagination && pagination.totalPages > 1 && (
        <div className="pagination">
          <div className="pagination-info">
            Page {pagination.page} sur {pagination.totalPages}
          </div>
          
          <div className="pagination-controls">
            <button
              disabled={!pagination.hasPrevious}
              onClick={() => goToPage(pagination.page - 1)}
              className="btn btn-secondary"
            >
              ← Précédent
            </button>
            
            <span className="page-numbers">
              {/* Affichage des numéros de pages */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === pagination.totalPages || 
                  Math.abs(page - pagination.page) <= 2
                )
                .map(page => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`btn ${page === pagination.page ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {page}
                  </button>
                ))
              }
            </span>
            
            <button
              disabled={!pagination.hasNext}
              onClick={() => goToPage(pagination.page + 1)}
              className="btn btn-secondary"
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 📝 Formulaires et Validation (Mis à jour)

### 1. Formulaire de connexion (Plus simple !)

```typescript
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { validateEmail } from '../types/frontend-types';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Email requis';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await login(formData);
      
      if (result.mustChangePassword) {
        // Rediriger vers page changement mot de passe
        window.location.href = `/change-password?userId=${result.userId}`;
      } else {
        // Rediriger vers dashboard - l'authentification est automatique !
        window.location.href = '/dashboard';
      }
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.general}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={`mt-1 block w-full border rounded-md px-3 py-2 ${
            errors.email ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
        />
        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className={`mt-1 block w-full border rounded-md px-3 py-2 ${
            errors.password ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={loading}
        />
        {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  );
};
```

### 2. Service API pour créer des clients (Simplifié)

```typescript
// services/clientService.ts
import { API_CONFIG } from '../config/api';
import { CreateClientRequest, CreateClientResponse } from '../types/frontend-types';

class ClientService {
  async createClient(clientData: CreateClientRequest): Promise<CreateClientResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/auth/admin/create-client`, {
      method: 'POST',
      headers: API_CONFIG.HEADERS,
      credentials: 'include', // Les cookies sont automatiquement envoyés
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }
}

export const clientService = new ClientService();
```

---

## 🛡️ Protection des Routes (Simplifié)

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  if (adminOnly && !['ADMIN', 'SUPERADMIN'].includes(user.role)) {
    return <div>Accès refusé</div>;
  }

  return <>{children}</>;
};
```

---

## 🔧 Configuration Axios (Optionnelle)

Si vous utilisez Axios au lieu de fetch :

```typescript
// config/axios.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  withCredentials: true, // Important : inclut automatiquement les cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour gérer les erreurs 401
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expiré - redirection automatique
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 🔄 Flux d'Authentification Simplifié

```
1. Page de connexion
   ↓
2. POST /auth/login (cookies définis automatiquement)
   ↓
3a. Si mustChangePassword: true
   → Page changement mot de passe → PUT /auth/change-password
   ↓
3b. Si connexion normale
   → Redirection dashboard (authentification automatique)
   ↓
4. Toutes les requêtes incluent automatiquement les cookies
   ↓
5. Déconnexion : POST /auth/logout (cookies supprimés automatiquement)
```

---

## ✅ Checklist d'Intégration Cookie

- [ ] ✅ Copier les types TypeScript mis à jour
- [ ] ✅ Configurer `credentials: 'include'` dans toutes les requêtes
- [ ] ✅ Supprimer tout le code localStorage/sessionStorage
- [ ] ✅ Implémenter le service d'authentification simplifié
- [ ] ✅ Utiliser le hook useAuth mis à jour
- [ ] ✅ Implémenter la gestion des clients avec pagination
- [ ] ✅ Créer les composants de filtres et tableaux
- [ ] ✅ Tester la reconnexion automatique après fermeture navigateur
- [ ] ✅ Vérifier la sécurité des cookies en mode production

---

## 🆚 Comparaison : LocalStorage vs Cookies

| Aspect | LocalStorage (Ancien) | Cookies httpOnly (Nouveau) |
|--------|----------------------|----------------------------|
| **Sécurité XSS** | ❌ Vulnérable | ✅ Protégé |
| **Gestion Frontend** | 😰 Complexe | 😊 Automatique |
| **Expiration** | 😰 Manuelle | 😊 Automatique |
| **Requêtes** | 😰 Headers manuels | 😊 Inclusion automatique |
| **Code nécessaire** | 😰 Beaucoup | 😊 Minimal |
| **UX Reconnexion** | 😰 Gestion manuelle | 😊 Automatique |

---

**Votre authentification par cookies est maintenant prête ! 🎉**

**Avantages clés :**
- 🔒 **Plus sécurisé** : Cookies httpOnly + protection CSRF
- 🚀 **Plus simple** : Plus de gestion de token côté frontend
- ⚡ **Plus rapide** : Moins de code, requêtes automatiques
- 💡 **Meilleure UX** : Reconnexion automatique
- 👥 **Gestion complète** : Listing, filtres, pagination des clients

La migration vers les cookies réduit drastiquement la complexité côté frontend tout en améliorant la sécurité ! 

---

## 👤 Listing des Vendeurs (Authentifié)

### 1. Service de listing des vendeurs

```typescript
// services/vendorService.ts
import { API_CONFIG } from '../config/api';
import { 
  ListVendorsResponse,
  VendorsStatsResponse 
} from '../types/frontend-types';

class VendorService {
  private baseUrl = `${API_CONFIG.BASE_URL}/auth`;

  async listVendors(): Promise<ListVendorsResponse> {
    const response = await fetch(`${this.baseUrl}/vendors`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async getVendorsStats(): Promise<VendorsStatsResponse> {
    const response = await fetch(`${this.baseUrl}/vendors/stats`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }
}

export const vendorService = new VendorService();
```

### 2. Hook pour la gestion des vendeurs

```typescript
// hooks/useVendors.ts
import { useState, useEffect } from 'react';
import { vendorService } from '../services/vendorService';
import { 
  VendorInfo, 
  VendorStats 
} from '../types/frontend-types';

export const useVendors = () => {
  const [vendors, setVendors] = useState<VendorInfo[]>([]);
  const [stats, setStats] = useState<VendorStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadVendors = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await vendorService.listVendors();
      setVendors(response.vendors);
      setTotal(response.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await vendorService.getVendorsStats();
      setStats(response.stats);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadVendors();
    loadStats();
  }, []);

  return {
    vendors,
    stats,
    loading,
    error,
    total,
    loadVendors,
    loadStats
  };
};
```

### 3. Composant de liste des vendeurs

```typescript
// components/VendorsList.tsx
import React from 'react';
import { useVendors } from '../hooks/useVendors';
import { 
  getSellerTypeIcon, 
  getSellerTypeLabel, 
  formatLastLoginDate 
} from '../types/frontend-types';

export const VendorsList: React.FC = () => {
  const { vendors, stats, loading, error, total } = useVendors();

  if (loading) return <div>Chargement des vendeurs...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="vendors-list">
      <div className="page-header">
        <h2>Communauté des Vendeurs</h2>
        <p>{total} vendeur{total > 1 ? 's' : ''} actif{total > 1 ? 's' : ''}</p>
      </div>

      {/* Statistiques par type */}
      <div className="vendor-stats">
        <h3>Répartition par type</h3>
        <div className="stats-grid">
          {stats.map(stat => (
            <div key={stat.type} className="stat-card">
              <span className="stat-icon">{stat.icon}</span>
              <div className="stat-info">
                <span className="stat-count">{stat.count}</span>
                <span className="stat-label">{stat.label}{stat.count > 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des vendeurs */}
      <div className="vendors-grid">
        {vendors.map(vendor => (
          <div key={vendor.id} className="vendor-card">
            <div className="vendor-header">
              <h4>{vendor.firstName} {vendor.lastName}</h4>
              <span className="vendor-type">
                {getSellerTypeIcon(vendor.vendeur_type)} {getSellerTypeLabel(vendor.vendeur_type)}
              </span>
            </div>
            
            <div className="vendor-info">
              <p className="vendor-email">{vendor.email}</p>
              <p className="vendor-joined">
                Membre depuis {new Date(vendor.created_at).toLocaleDateString('fr-FR')}
              </p>
              <p className="vendor-last-login">
                {formatLastLoginDate(vendor.last_login_at)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {vendors.length === 0 && (
        <div className="no-vendors">
          <p>Aucun autre vendeur dans la communauté pour le moment.</p>
        </div>
      )}
    </div>
  );
};
```

### 4. CSS pour le style

```css
/* styles/vendors.css */
.vendors-list {
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.vendor-stats {
  margin-bottom: 40px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.stat-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #007bff;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.vendors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.vendor-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
}

.vendor-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.vendor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.vendor-header h4 {
  margin: 0;
  color: #333;
}

.vendor-type {
  font-size: 0.9rem;
  background: #e9ecef;
  padding: 4px 8px;
  border-radius: 4px;
}

.vendor-info p {
  margin: 5px 0;
  font-size: 0.9rem;
}

.vendor-email {
  color: #007bff;
}

.vendor-joined, .vendor-last-login {
  color: #6c757d;
}

.no-vendors {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}
```

---

## 👥 Gestion des Clients (Admin) 