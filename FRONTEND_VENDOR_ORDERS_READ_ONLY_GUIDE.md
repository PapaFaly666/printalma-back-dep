# 📋 Guide Frontend - Commandes Vendeur en Lecture Seule

## 🎯 Objectif
Les vendeurs ne peuvent plus modifier le statut des commandes. Seuls les **admins** peuvent gérer les états d'avancement. Les vendeurs ont maintenant un accès **lecture seule** pour visualiser leurs commandes.

## 🚫 Changements Backend Effectués

### Endpoints SUPPRIMÉS pour les vendeurs :
- ❌ `PATCH /vendor/orders/:orderId/status` - Mise à jour du statut

### Endpoints CONSERVÉS pour les vendeurs (lecture seule) :
- ✅ `GET /vendor/orders` - Liste des commandes
- ✅ `GET /vendor/orders/:orderId` - Détails d'une commande
- ✅ `GET /vendor/orders/statistics` - Statistiques
- ✅ `GET /vendor/orders/search` - Recherche
- ✅ `GET /vendor/orders/status/:status` - Filtrer par statut
- ✅ `GET /vendor/orders/export/csv` - Export CSV
- ✅ `GET /vendor/orders/notifications` - Notifications
- ✅ `PATCH /vendor/orders/notifications/:id/read` - Marquer notification lue

### Endpoints ADMIN pour la gestion des commandes :
- ✅ `PATCH /orders/:id/status` - Mise à jour du statut (ADMIN/SUPERADMIN uniquement)

## 🛠️ Modifications Frontend Requises

### 1. Interface Vendeur - Suppression des Actions de Modification

#### A. Page de Liste des Commandes (`VendorOrdersList.tsx`)

**AVANT (à supprimer) :**
```tsx
// ❌ Supprimer ces boutons d'action
<Button
  onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
  variant="success"
>
  Confirmer
</Button>

<Button
  onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
  variant="warning"
>
  En traitement
</Button>

<Button
  onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
  variant="info"
>
  Expédier
</Button>
```

**APRÈS (lecture seule) :**
```tsx
// ✅ Remplacer par des badges de statut uniquement
<Badge
  variant={getStatusVariant(order.status)}
  className="status-badge"
>
  {getStatusLabel(order.status)}
</Badge>

// ✅ Fonction helper pour les couleurs
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'PENDING': return 'warning';
    case 'CONFIRMED': return 'info';
    case 'PROCESSING': return 'primary';
    case 'SHIPPED': return 'success';
    case 'DELIVERED': return 'success';
    case 'CANCELLED': return 'danger';
    case 'REJECTED': return 'danger';
    default: return 'secondary';
  }
};

const getStatusLabel = (status: string) => {
  const labels = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    PROCESSING: 'En traitement',
    SHIPPED: 'Expédiée',
    DELIVERED: 'Livrée',
    CANCELLED: 'Annulée',
    REJECTED: 'Rejetée'
  };
  return labels[status] || status;
};
```

#### B. Page de Détails de Commande (`VendorOrderDetails.tsx`)

**AVANT (à supprimer) :**
```tsx
// ❌ Supprimer toute la section d'actions
<div className="order-actions">
  <h4>Actions sur la commande</h4>
  <div className="action-buttons">
    <Button onClick={() => handleStatusUpdate('CONFIRMED')}>
      Confirmer la commande
    </Button>
    <Button onClick={() => handleStatusUpdate('PROCESSING')}>
      Mettre en traitement
    </Button>
    <Button onClick={() => handleStatusUpdate('SHIPPED')}>
      Marquer comme expédiée
    </Button>
  </div>
</div>

// ❌ Supprimer les formulaires de mise à jour
<form onSubmit={handleStatusUpdate}>
  <select name="status" value={selectedStatus}>
    <option value="CONFIRMED">Confirmée</option>
    <option value="PROCESSING">En traitement</option>
    <option value="SHIPPED">Expédiée</option>
  </select>
  <button type="submit">Mettre à jour</button>
</form>
```

**APRÈS (lecture seule) :**
```tsx
// ✅ Remplacer par un timeline de suivi
<div className="order-timeline">
  <h4>Suivi de la commande</h4>
  <div className="timeline">
    <div className={`timeline-item ${isStatusReached('PENDING') ? 'completed' : ''}`}>
      <div className="timeline-marker"></div>
      <div className="timeline-content">
        <h5>Commande reçue</h5>
        <p>{order.createdAt}</p>
      </div>
    </div>

    <div className={`timeline-item ${isStatusReached('CONFIRMED') ? 'completed' : ''}`}>
      <div className="timeline-marker"></div>
      <div className="timeline-content">
        <h5>Commande confirmée</h5>
        <p>{order.confirmedAt || 'En attente de confirmation par l\'admin'}</p>
      </div>
    </div>

    <div className={`timeline-item ${isStatusReached('PROCESSING') ? 'completed' : ''}`}>
      <div className="timeline-marker"></div>
      <div className="timeline-content">
        <h5>En traitement</h5>
        <p>{order.processingAt || 'Non démarré'}</p>
      </div>
    </div>

    <div className={`timeline-item ${isStatusReached('SHIPPED') ? 'completed' : ''}`}>
      <div className="timeline-marker"></div>
      <div className="timeline-content">
        <h5>Expédiée</h5>
        <p>{order.shippedAt || 'Non expédiée'}</p>
      </div>
    </div>

    <div className={`timeline-item ${isStatusReached('DELIVERED') ? 'completed' : ''}`}>
      <div className="timeline-marker"></div>
      <div className="timeline-content">
        <h5>Livrée</h5>
        <p>{order.deliveredAt || 'Non livrée'}</p>
      </div>
    </div>
  </div>
</div>

// ✅ Fonction helper pour vérifier si un statut est atteint
const isStatusReached = (targetStatus: string): boolean => {
  const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentIndex = statusOrder.indexOf(order.status);
  const targetIndex = statusOrder.indexOf(targetStatus);
  return currentIndex >= targetIndex;
};
```

### 2. Services Frontend - Nettoyage des Méthodes

#### A. VendorOrderService (`vendorOrderService.ts`)

**AVANT (à supprimer) :**
```typescript
// ❌ Supprimer cette méthode
export const updateOrderStatus = async (orderId: number, status: string, notes?: string) => {
  try {
    const response = await api.patch(`/vendor/orders/${orderId}/status`, {
      status,
      notes
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour');
  }
};

// ❌ Supprimer ces méthodes aussi
export const confirmOrder = async (orderId: number) => {
  return updateOrderStatus(orderId, 'CONFIRMED');
};

export const startProcessing = async (orderId: number) => {
  return updateOrderStatus(orderId, 'PROCESSING');
};

export const shipOrder = async (orderId: number) => {
  return updateOrderStatus(orderId, 'SHIPPED');
};
```

**APRÈS (conserver uniquement la lecture) :**
```typescript
// ✅ Conserver ces méthodes de lecture
export const getVendorOrders = async (filters?: VendorOrderFilters) => {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/vendor/orders?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération');
  }
};

export const getOrderDetails = async (orderId: number) => {
  try {
    const response = await api.get(`/vendor/orders/${orderId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération');
  }
};

export const getVendorStatistics = async () => {
  try {
    const response = await api.get('/vendor/orders/statistics');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération');
  }
};

export const exportOrdersCSV = async (filters?: VendorOrderFilters) => {
  try {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/vendor/orders/export/csv?${params.toString()}`, {
      responseType: 'blob'
    });

    // Télécharger le fichier
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vendor-orders.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de l\'export');
  }
};
```

### 3. Interface Admin - Gestion des Commandes

#### A. AdminOrderDetails (`AdminOrderDetails.tsx`)

```tsx
// ✅ Interface admin pour gérer les statuts
import React, { useState } from 'react';
import { updateOrderStatusAdmin } from '../services/adminOrderService';

const AdminOrderDetails = ({ orderId }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateOrderStatusAdmin(orderId, {
        status: selectedStatus,
        adminNote: adminNote
      });

      // Rafraîchir les données
      window.location.reload(); // ou utiliser un state management

      toast.success('Statut mis à jour avec succès');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-order-management">
      <h4>Gestion de la commande (Admin)</h4>

      <form onSubmit={handleStatusUpdate} className="status-update-form">
        <div className="form-group">
          <label>Nouveau statut :</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            required
          >
            <option value="">Sélectionner un statut</option>
            <option value="PENDING">En attente</option>
            <option value="CONFIRMED">Confirmée</option>
            <option value="PROCESSING">En traitement</option>
            <option value="SHIPPED">Expédiée</option>
            <option value="DELIVERED">Livrée</option>
            <option value="CANCELLED">Annulée</option>
            <option value="REJECTED">Rejetée</option>
          </select>
        </div>

        <div className="form-group">
          <label>Note admin (optionnel) :</label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Ajouter une note..."
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={!selectedStatus || loading}
          className="btn btn-primary"
        >
          {loading ? 'Mise à jour...' : 'Mettre à jour le statut'}
        </button>
      </form>
    </div>
  );
};
```

#### B. AdminOrderService (`adminOrderService.ts`)

```typescript
// ✅ Service admin pour gérer les commandes
import api from './api';

export const updateOrderStatusAdmin = async (orderId: number, updateData: {
  status: string;
  adminNote?: string;
}) => {
  try {
    const response = await api.patch(`/orders/${orderId}/status`, updateData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour');
  }
};

export const getAllOrders = async (filters?: {
  page?: number;
  limit?: number;
  status?: string;
  vendorId?: number;
}) => {
  try {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vendorId) params.append('vendorId', filters.vendorId.toString());

    const response = await api.get(`/orders/admin/all?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erreur lors de la récupération');
  }
};
```

## 🎨 CSS pour l'Interface de Suivi

```css
/* ✅ Styles pour le timeline de suivi */
.order-timeline {
  margin: 20px 0;
}

.timeline {
  position: relative;
  padding-left: 30px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e9ecef;
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;
}

.timeline-marker {
  position: absolute;
  left: -23px;
  top: 5px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #e9ecef;
  border: 2px solid #fff;
  box-shadow: 0 0 0 2px #e9ecef;
}

.timeline-item.completed .timeline-marker {
  background: #28a745;
  box-shadow: 0 0 0 2px #28a745;
}

.timeline-content h5 {
  margin: 0 0 5px 0;
  font-weight: 600;
}

.timeline-content p {
  margin: 0;
  color: #6c757d;
  font-size: 14px;
}

.timeline-item.completed .timeline-content h5 {
  color: #28a745;
}

/* ✅ Styles pour les badges de statut */
.status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

/* ✅ Styles pour l'interface admin */
.admin-order-management {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
  border-left: 4px solid #007bff;
}

.status-update-form .form-group {
  margin-bottom: 15px;
}

.status-update-form label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
}

.status-update-form select,
.status-update-form textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
```

## 📝 Messages d'Information pour les Vendeurs

```tsx
// ✅ Ajouter un message informatif pour les vendeurs
const VendorOrderInfo = () => (
  <div className="alert alert-info" role="alert">
    <h5>📋 Information importante</h5>
    <p>
      Vous pouvez maintenant <strong>consulter</strong> vos commandes et suivre leur progression,
      mais seuls les <strong>administrateurs</strong> peuvent modifier les statuts des commandes.
    </p>
    <p className="mb-0">
      Pour toute question sur le statut d'une commande, contactez l'équipe administrative.
    </p>
  </div>
);
```

## 🔧 Checklist de Migration

### À Faire :

- [ ] Supprimer tous les boutons de modification de statut dans l'interface vendeur
- [ ] Remplacer par des badges de statut en lecture seule
- [ ] Implémenter le timeline de suivi des commandes
- [ ] Supprimer les méthodes `updateOrderStatus` du service vendeur
- [ ] Créer l'interface admin pour la gestion des statuts
- [ ] Implémenter le service admin pour les mises à jour
- [ ] Ajouter les messages informatifs pour les vendeurs
- [ ] Tester que les vendeurs ne peuvent plus modifier les statuts
- [ ] Tester que les admins peuvent modifier les statuts
- [ ] Mettre à jour les tests frontend

### Points d'Attention :

1. **Gestion d'erreurs** : Assurez-vous que l'interface gère correctement les erreurs 403 (Forbidden)
2. **Cache** : Videz le cache des données de commandes après la migration
3. **Notifications** : Les vendeurs doivent être notifiés des changements de statut par les admins
4. **Responsive** : Assurez-vous que le nouveau timeline fonctionne sur mobile

## 🚀 Résultat Final

- ✅ **Vendeurs** : Interface claire de suivi en lecture seule
- ✅ **Admins** : Contrôle total sur la gestion des commandes
- ✅ **UX améliorée** : Timeline visuel pour le suivi des commandes
- ✅ **Sécurité** : Permissions strictement appliquées

Cette migration améliore la séparation des responsabilités et donne un meilleur contrôle administratif sur le processus de commande.