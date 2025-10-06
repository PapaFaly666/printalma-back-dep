# Guide Frontend - Filtrage des Clients (Vendeurs) par Statut

## Endpoint API

**URL:** `GET http://localhost:3004/auth/admin/clients`

**Authentification:** Bearer Token (Admin/SuperAdmin requis)

---

## Paramètres de requête (Query Parameters)

| Paramètre | Type | Requis | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `page` | number | Non | Numéro de page (défaut: 1) | `1` |
| `limit` | number | Non | Nombre d'éléments par page (défaut: 10, max: 100) | `20` |
| `status` | boolean | Non | Filtrer par statut (true=actif, false=inactif) | `true` |
| `vendeur_type` | string | Non | Type de vendeur (DESIGNER, INFLUENCEUR, ARTISTE) | `DESIGNER` |
| `search` | string | Non | Recherche par nom, prénom ou email | `jean` |

---

## Exemples de requêtes

### 1. Tous les clients actifs

```bash
GET http://localhost:3004/auth/admin/clients?status=true
```

### 2. Tous les clients inactifs

```bash
GET http://localhost:3004/auth/admin/clients?status=false
```

### 3. Clients actifs de type DESIGNER avec pagination

```bash
GET http://localhost:3004/auth/admin/clients?status=true&vendeur_type=DESIGNER&page=1&limit=20
```

### 4. Recherche de clients inactifs contenant "jean"

```bash
GET http://localhost:3004/auth/admin/clients?status=false&search=jean
```

### 5. Tous les clients sans filtre de statut

```bash
GET http://localhost:3004/auth/admin/clients?page=1&limit=10
```

---

## Format de réponse

```typescript
{
  "clients": [
    {
      "id": 1,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@gmail.com",
      "role": "VENDEUR",
      "vendeur_type": "DESIGNER",
      "status": true,  // true = actif, false = inactif
      "must_change_password": false,
      "last_login_at": "2024-01-15T10:30:00.000Z",
      "created_at": "2024-01-01T08:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "login_attempts": 0,
      "locked_until": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  },
  "filters": {
    "status": true,
    "vendeur_type": "DESIGNER",
    "search": ""
  }
}
```

---

## Implémentation Frontend

### Service API

```typescript
// services/clientService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  vendeur_type: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
  status: boolean;  // true = actif, false = inactif
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  login_attempts: number;
  locked_until: string | null;
}

export interface ClientFilters {
  page?: number;
  limit?: number;
  status?: boolean;  // true = actifs, false = inactifs, undefined = tous
  vendeur_type?: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
  search?: string;
}

export interface ClientsResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    status?: boolean;
    vendeur_type?: string;
    search?: string;
  };
}

export const clientService = {
  /**
   * Récupérer les clients avec filtres
   */
  async getClients(filters: ClientFilters, token: string): Promise<ClientsResponse> {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status !== undefined) params.append('status', filters.status.toString());
    if (filters.vendeur_type) params.append('vendeur_type', filters.vendeur_type);
    if (filters.search) params.append('search', filters.search);

    const response = await axios.get(
      `${API_URL}/auth/admin/clients?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return response.data;
  },

  /**
   * Récupérer uniquement les clients actifs
   */
  async getActiveClients(page = 1, limit = 10, token: string): Promise<ClientsResponse> {
    return this.getClients({ page, limit, status: true }, token);
  },

  /**
   * Récupérer uniquement les clients inactifs
   */
  async getInactiveClients(page = 1, limit = 10, token: string): Promise<ClientsResponse> {
    return this.getClients({ page, limit, status: false }, token);
  },

  /**
   * Basculer le statut d'un client (activer/désactiver)
   */
  async toggleClientStatus(clientId: number, token: string): Promise<void> {
    await axios.put(
      `${API_URL}/auth/admin/clients/${clientId}/toggle-status`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
};
```

---

### Composant React avec filtres

```tsx
// components/AdminClientList.tsx
'use client';

import { useState, useEffect } from 'react';
import { clientService, Client, ClientFilters } from '@/services/clientService';

type StatusFilter = 'all' | 'active' | 'inactive';

export default function AdminClientList() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [vendeurTypeFilter, setVendeurTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, [statusFilter, vendeurTypeFilter, searchTerm, pagination.page]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Non authentifié');

      const filters: ClientFilters = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Ajouter le filtre de statut
      if (statusFilter === 'active') {
        filters.status = true;
      } else if (statusFilter === 'inactive') {
        filters.status = false;
      }
      // Si 'all', on ne passe pas le paramètre status

      // Ajouter le filtre de type de vendeur
      if (vendeurTypeFilter !== 'all') {
        filters.vendeur_type = vendeurTypeFilter as any;
      }

      // Ajouter la recherche
      if (searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const response = await clientService.getClients(filters, token);
      setClients(response.clients);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
      alert('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const confirmMessage = client.status
      ? 'Voulez-vous vraiment désactiver ce client ?'
      : 'Voulez-vous vraiment activer ce client ?';

    if (!confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Non authentifié');

      await clientService.toggleClientStatus(clientId, token);
      loadClients(); // Recharger la liste
    } catch (error) {
      console.error('Erreur basculement statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Actif
      </span>
    ) : (
      <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        Inactif
      </span>
    );
  };

  const getVendeurTypeLabel = (type: string) => {
    const labels = {
      DESIGNER: '🎨 Designer',
      INFLUENCEUR: '⭐ Influenceur',
      ARTISTE: '🖌️ Artiste'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Total clients</div>
          <div className="text-3xl font-bold text-gray-900">{pagination.total}</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <div className="text-sm text-green-600 font-medium">Clients actifs</div>
          <div className="text-3xl font-bold text-green-700">
            {clients.filter(c => c.status).length}
          </div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow">
          <div className="text-sm text-red-600 font-medium">Clients inactifs</div>
          <div className="text-3xl font-bold text-red-700">
            {clients.filter(c => !c.status).length}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rechercher
            </label>
            <input
              type="text"
              placeholder="Nom, prénom, email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtre par statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as StatusFilter);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs uniquement</option>
              <option value="inactive">Inactifs uniquement</option>
            </select>
          </div>

          {/* Filtre par type de vendeur */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de vendeur
            </label>
            <select
              value={vendeurTypeFilter}
              onChange={(e) => {
                setVendeurTypeFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les types</option>
              <option value="DESIGNER">Designers</option>
              <option value="INFLUENCEUR">Influenceurs</option>
              <option value="ARTISTE">Artistes</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          {loading ? 'Chargement...' : `${pagination.total} client(s) trouvé(s)`}
        </div>
      </div>

      {/* Tableau des clients */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière connexion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">
                    {client.firstName} {client.lastName}
                  </div>
                  <div className="text-sm text-gray-500">ID: {client.id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getVendeurTypeLabel(client.vendeur_type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(client.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.last_login_at
                    ? new Date(client.last_login_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Jamais connecté'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleToggleStatus(client.id)}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${
                      client.status
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {client.status ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {clients.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">Aucun client trouvé</p>
            <p className="text-sm mt-2">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow">
          <div className="text-sm text-gray-700">
            Page <span className="font-medium">{pagination.page}</span> sur{' '}
            <span className="font-medium">{pagination.totalPages}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={!pagination.hasPrevious}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={!pagination.hasNext}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Exemples d'utilisation rapide

### 1. Récupérer tous les clients actifs (page 1)

```typescript
const response = await clientService.getActiveClients(1, 20, token);
console.log(`${response.pagination.total} clients actifs trouvés`);
```

### 2. Récupérer tous les clients inactifs

```typescript
const response = await clientService.getInactiveClients(1, 20, token);
console.log(`${response.pagination.total} clients inactifs trouvés`);
```

### 3. Rechercher des designers inactifs

```typescript
const response = await clientService.getClients({
  status: false,
  vendeur_type: 'DESIGNER',
  search: 'jean'
}, token);
```

### 4. Activer/Désactiver un client

```typescript
await clientService.toggleClientStatus(clientId, token);
```

---

## Points clés à retenir

✅ **Paramètre `status`:**
- `true` = clients actifs uniquement
- `false` = clients inactifs uniquement
- Omis = tous les clients (actifs + inactifs)

✅ **Pagination:** Toujours incluse dans la réponse avec `hasNext` et `hasPrevious`

✅ **Filtres multiples:** Combinables (statut + type + recherche)

✅ **Toggle status:** Endpoint dédié `/auth/admin/clients/:id/toggle-status`

✅ **Authentification:** Token Bearer requis (rôle ADMIN ou SUPERADMIN)

---

## Codes d'erreur possibles

| Code | Description |
|------|-------------|
| 401 | Non authentifié (token manquant/invalide) |
| 403 | Accès interdit (rôle insuffisant) |
| 400 | Paramètres invalides |
| 404 | Client non trouvé (pour toggle-status) |

---

## Support

Pour toute question, consultez la documentation API complète ou contactez l'équipe backend.
