# 📅 Guide Frontend - Affichage des Dates Demandes de Fonds

## 📋 Nouvelles Dates Disponibles

✅ **requestedAt** - Date de demande par le vendeur
✅ **validatedAt** - Date de validation par l'admin
✅ **processedAt** - Date de traitement (existant)

## 🔧 Corrections Backend Appliquées

### 1. **Schéma Prisma mis à jour**
```prisma
model VendorFundsRequest {
  // ... autres champs
  requestedAt      DateTime   @default(now()) @map("requested_at") // Date de demande
  validatedAt      DateTime?  @map("validated_at") // Date de validation admin
  processedAt      DateTime?  @map("processed_at") // Date de traitement
  // ... autres champs
}
```

### 2. **Service backend enrichi**
```typescript
// Dans vendor-funds.service.ts
formatFundsRequest(request: any): FundsRequestData {
  return {
    // ... autres champs
    requestedAt: request.requestedAt?.toISOString(),
    validatedAt: request.validatedAt?.toISOString(),
    processedAt: request.processedAt?.toISOString(),
    // ... autres champs
  };
}
```

## 🎯 Structure de Réponse API

### Demande de Fonds Complète
```json
{
  "id": 45,
  "vendorId": 7,
  "vendor": {
    "id": 7,
    "firstName": "John",
    "lastName": "Vendor",
    "email": "john@vendor.com",
    "shopName": "Ma Boutique"
  },
  "amount": 50000,
  "requestedAmount": 50000,
  "description": "Retrait des gains de septembre",
  "paymentMethod": "WAVE",
  "phoneNumber": "+221701234567",
  "status": "APPROVED",
  "adminNote": "Demande validée - vendeur fiable",
  "processedBy": 1,
  "processedByUser": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "Principal"
  },
  // ✅ Nouvelles dates disponibles
  "requestedAt": "2024-09-15T10:30:00.000Z", // Date demande vendeur
  "validatedAt": "2024-09-15T14:20:00.000Z", // Date validation admin
  "processedAt": "2024-09-15T14:20:00.000Z", // Date traitement
  "availableBalance": 75000,
  "commissionRate": 0.10,
  "createdAt": "2024-09-15T10:30:00.000Z",
  "updatedAt": "2024-09-15T14:20:00.000Z"
}
```

## 🎨 Guide d'Implémentation Frontend

### 1. **Types TypeScript**

```typescript
interface FundsRequest {
  id: number;
  vendorId: number;
  vendor?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    shopName?: string;
  };
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  description: string;
  paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER';
  phoneNumber: string;
  adminNote?: string;
  processedBy?: number;
  processedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  // ✅ Nouvelles dates
  requestedAt?: string; // Date de demande
  validatedAt?: string; // Date de validation admin
  processedAt?: string; // Date de traitement
  availableBalance: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
}
```

### 2. **Utilitaires de Formatage des Dates**

```typescript
// utils/dateUtils.ts
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Non définie';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatDateShort = (dateString?: string): string => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const calculateDuration = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return '-';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j ${diffHours % 24}h`;
  }

  return diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`;
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'PENDING': return '⏳';
    case 'APPROVED': return '✅';
    case 'REJECTED': return '❌';
    case 'PAID': return '💰';
    default: return '📋';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING': return 'text-yellow-600 bg-yellow-100';
    case 'APPROVED': return 'text-green-600 bg-green-100';
    case 'REJECTED': return 'text-red-600 bg-red-100';
    case 'PAID': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};
```

### 3. **Composant Card de Demande (Vue Vendeur)**

```tsx
// components/FundsRequestCard.tsx
import React from 'react';
import { formatDate, formatDateShort, calculateDuration, getStatusIcon, getStatusColor } from '../utils/dateUtils';

interface FundsRequestCardProps {
  request: FundsRequest;
  onViewDetails?: (id: number) => void;
}

const FundsRequestCard: React.FC<FundsRequestCardProps> = ({ request, onViewDetails }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header avec statut */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {request.amount.toLocaleString()} FCFA
          </h3>
          <p className="text-gray-500 text-sm">#{request.id}</p>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
          {getStatusIcon(request.status)} {request.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 line-clamp-2">{request.description}</p>

      {/* ✅ Dates importantes */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">📅 Demandé le:</span>
          <span className="font-medium">{formatDateShort(request.requestedAt)}</span>
        </div>

        {request.validatedAt && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">✅ Validé le:</span>
            <span className="font-medium text-green-600">{formatDateShort(request.validatedAt)}</span>
          </div>
        )}

        {request.processedAt && request.status === 'PAID' && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">💰 Payé le:</span>
            <span className="font-medium text-blue-600">{formatDateShort(request.processedAt)}</span>
          </div>
        )}
      </div>

      {/* ✅ Temps de traitement */}
      {request.requestedAt && request.validatedAt && (
        <div className="text-xs text-gray-500 mb-4">
          ⚡ Traité en: {calculateDuration(request.requestedAt, request.validatedAt)}
        </div>
      )}

      {/* Méthode de paiement */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-2">💳</span>
          {request.paymentMethod}
        </div>

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(request.id)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Voir détails →
          </button>
        )}
      </div>
    </div>
  );
};

export default FundsRequestCard;
```

### 4. **Composant Timeline de Statut**

```tsx
// components/FundsRequestTimeline.tsx
import React from 'react';
import { formatDate } from '../utils/dateUtils';

interface FundsRequestTimelineProps {
  request: FundsRequest;
}

const FundsRequestTimeline: React.FC<FundsRequestTimelineProps> = ({ request }) => {
  const timelineSteps = [
    {
      label: 'Demande créée',
      date: request.requestedAt,
      icon: '📝',
      completed: true,
      color: 'blue'
    },
    {
      label: 'En attente de validation',
      date: request.requestedAt,
      icon: '⏳',
      completed: true,
      color: 'yellow'
    },
    {
      label: 'Validée par admin',
      date: request.validatedAt,
      icon: '✅',
      completed: request.status !== 'PENDING',
      color: 'green'
    },
    {
      label: 'Paiement effectué',
      date: request.status === 'PAID' ? request.processedAt : undefined,
      icon: '💰',
      completed: request.status === 'PAID',
      color: 'blue'
    }
  ];

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {timelineSteps.map((step, index) => (
          <li key={index}>
            <div className="relative pb-8">
              {index !== timelineSteps.length - 1 && (
                <span
                  className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                    step.completed ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              )}

              <div className="relative flex space-x-3">
                <div>
                  <span
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                      step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.icon}
                  </span>
                </div>

                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className={`text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-xs text-gray-500">
                        {formatDate(step.date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FundsRequestTimeline;
```

### 5. **Table Admin avec Dates**

```tsx
// components/AdminFundsRequestsTable.tsx
import React from 'react';
import { formatDate, calculateDuration, getStatusIcon, getStatusColor } from '../utils/dateUtils';

interface AdminFundsRequestsTableProps {
  requests: FundsRequest[];
  onProcessRequest?: (id: number) => void;
}

const AdminFundsRequestsTable: React.FC<AdminFundsRequestsTableProps> = ({
  requests,
  onProcessRequest
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vendeur
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Montant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Statut
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Demande
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date Validation
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Temps Traitement
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {request.vendor?.firstName} {request.vendor?.lastName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {request.vendor?.shopName || request.vendor?.email}
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {request.amount.toLocaleString()} FCFA
                </div>
                <div className="text-xs text-gray-500">#{request.id}</div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)} {request.status}
                </span>
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(request.requestedAt)}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.validatedAt ? (
                  <div>
                    <div>{formatDate(request.validatedAt)}</div>
                    {request.processedByUser && (
                      <div className="text-xs text-gray-500">
                        par {request.processedByUser.firstName}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">En attente</span>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {request.requestedAt && request.validatedAt ? (
                  <span className="text-blue-600 font-medium">
                    {calculateDuration(request.requestedAt, request.validatedAt)}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                {request.status === 'PENDING' && onProcessRequest && (
                  <button
                    onClick={() => onProcessRequest(request.id)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Traiter
                  </button>
                )}
                {request.status === 'APPROVED' && (
                  <span className="text-green-600">✅ Validée</span>
                )}
                {request.status === 'PAID' && (
                  <span className="text-blue-600">💰 Payée</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminFundsRequestsTable;
```

### 6. **Hook de Données**

```typescript
// hooks/useFundsRequests.ts
import { useState, useEffect } from 'react';
import { FundsRequest } from '../types/funds';

interface UseFundsRequestsProps {
  vendorId?: number;
  isAdmin?: boolean;
  filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

export const useFundsRequests = ({ vendorId, isAdmin, filters }: UseFundsRequestsProps) => {
  const [requests, setRequests] = useState<FundsRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);

        const baseUrl = isAdmin ? '/api/admin/funds-requests' : '/api/vendor/funds-requests';
        const queryParams = new URLSearchParams();

        if (vendorId && !isAdmin) queryParams.append('vendorId', vendorId.toString());
        if (filters?.status) queryParams.append('status', filters.status);
        if (filters?.startDate) queryParams.append('startDate', filters.startDate);
        if (filters?.endDate) queryParams.append('endDate', filters.endDate);

        const response = await fetch(`${baseUrl}?${queryParams}`);
        const data = await response.json();

        if (data.success) {
          setRequests(data.data.requests || data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Erreur lors du chargement des demandes');
        console.error('Error fetching funds requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [vendorId, isAdmin, filters]);

  const processRequest = async (requestId: number, status: string, adminNote?: string) => {
    try {
      const response = await fetch(`/api/admin/funds-requests/${requestId}/process`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNote })
      });

      const data = await response.json();

      if (data.success) {
        setRequests(prev =>
          prev.map(req =>
            req.id === requestId
              ? { ...req, ...data.data, validatedAt: new Date().toISOString() }
              : req
          )
        );
        return data.data;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      console.error('Error processing request:', err);
      throw err;
    }
  };

  return {
    requests,
    loading,
    error,
    processRequest,
    refetch: () => window.location.reload() // Simple refetch
  };
};
```

## 🎯 Pages d'Utilisation

### 1. **Page Vendeur - Mes Demandes**

```tsx
// pages/VendorFundsRequests.tsx
import React, { useState } from 'react';
import FundsRequestCard from '../components/FundsRequestCard';
import { useFundsRequests } from '../hooks/useFundsRequests';

const VendorFundsRequests: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { requests, loading, error } = useFundsRequests({
    vendorId: getCurrentVendorId(),
    filters: { status: statusFilter }
  });

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">Erreur: {error}</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mes Demandes de Fonds</h1>

        {/* Filtres */}
        <div className="mt-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvées</option>
            <option value="PAID">Payées</option>
          </select>
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {requests.map((request) => (
          <FundsRequestCard
            key={request.id}
            request={request}
            onViewDetails={(id) => window.location.href = `/vendor/funds-requests/${id}`}
          />
        ))}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune demande de fonds trouvée
        </div>
      )}
    </div>
  );
};
```

### 2. **Page Admin - Gestion des Demandes**

```tsx
// pages/AdminFundsRequests.tsx
import React, { useState } from 'react';
import AdminFundsRequestsTable from '../components/AdminFundsRequestsTable';
import { useFundsRequests } from '../hooks/useFundsRequests';

const AdminFundsRequests: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });

  const { requests, loading, error, processRequest } = useFundsRequests({
    isAdmin: true,
    filters
  });

  const handleProcessRequest = async (requestId: number) => {
    try {
      await processRequest(requestId, 'APPROVED', 'Demande validée automatiquement');
      alert('Demande approuvée avec succès');
    } catch (err) {
      alert('Erreur lors du traitement');
    }
  };

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">Erreur: {error}</div>;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Demandes de Fonds</h1>

        {/* Filtres */}
        <div className="mt-4 flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="APPROVED">Approuvées</option>
            <option value="PAID">Payées</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Date début"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Date fin"
          />
        </div>
      </div>

      {/* Table des demandes */}
      <AdminFundsRequestsTable
        requests={requests}
        onProcessRequest={handleProcessRequest}
      />

      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune demande trouvée avec ces filtres
        </div>
      )}
    </div>
  );
};
```

## 📱 Styles CSS Recommandés

```css
/* Styles pour les composants */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.timeline-step {
  transition: all 0.3s ease;
}

.timeline-step.completed {
  transform: scale(1.05);
}

.funds-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

.status-badge {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Responsive design */
@media (max-width: 768px) {
  .admin-table {
    font-size: 14px;
  }

  .timeline-step {
    padding: 12px;
  }
}
```

## 🎯 Résultat Final

Avec cette implémentation, vous aurez :

1. **Affichage clair des dates** :
   - Date de demande par le vendeur
   - Date de validation par l'admin
   - Temps de traitement calculé

2. **Interface intuitive** :
   - Timeline visuelle du statut
   - Cards informationnelles
   - Tableaux détaillés pour admin

3. **Données fiables** :
   - Timestamps précis
   - Traçabilité complète
   - Informations sur l'admin qui a traité

4. **UX optimisée** :
   - Formatage automatique des dates
   - Calcul des durées
   - Statuts visuels clairs

## 🧪 Tests Recommandés

1. **Vérifier l'affichage des dates** dans les différents composants
2. **Tester le calcul des durées** entre demande et validation
3. **Valider la timeline** pour chaque statut de demande
4. **Contrôler les filtres par date** côté admin