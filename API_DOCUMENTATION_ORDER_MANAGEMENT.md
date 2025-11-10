# 📋 API Documentation - Gestion des Statuts de Commandes (Admin)

## 🎯 Vue d'ensemble

Cette documentation décrit l'API permettant aux administrateurs de gérer les statuts des commandes dans l'application Printalma.

---

## 🔐 Authentification

Tous les endpoints admin nécessitent :
- **Token JWT** dans le header `Authorization: Bearer <token>`
- **Rôle requis** : `ADMIN` ou `SUPERADMIN`

---

## 📊 Statuts Disponibles

| Statut | Code | Description | Étape dans le processus |
|--------|------|-------------|-----------------------|
| En attente | `PENDING` | Commande créée, en attente de validation | ⏳ Début |
| Confirmée | `CONFIRMED` | Commande confirmée et payée | ✅ Validation |
| En traitement | `PROCESSING` | Commande en cours de préparation | 🔄 Préparation |
| Expédiée | `SHIPPED` | Commande expédiée au client | 📦 Expédition |
| Livrée | `DELIVERED` | Commande livrée au client | ✅ Fin |
| Annulée | `CANCELLED` | Commande annulée | ❌ Annulation |
| Rejetée | `REJECTED` | Commande rejetée | ❌ Rejet |

---

## 🛠️ Endpoints

### 1. Lister toutes les commandes

```http
GET /orders/admin/all?page=1&limit=10&status=CONFIRMED
```

**Paramètres :**
- `page` (number) : Page actuelle (défaut: 1)
- `limit` (number) : Nombre de commandes par page (défaut: 10, max: 100)
- `status` (string, optionnel) : Filtrer par statut

**Réponse :**
```json
{
  "success": true,
  "message": "Commandes récupérées avec succès",
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "CMD-2024-001",
        "status": "CONFIRMED",
        "totalAmount": 15000,
        "paymentStatus": "PAID",
        "paymentMethod": "PAYDUNYA",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:35:00Z",
        "customer_info": {
          "user_id": 101,
          "full_name": "Client Name",
          "email": "client@email.com",
          "phone": "+221771234567",
          "shipping_address": {
            "address": "123 Rue, Dakar, Sénégal",
            "city": "Dakar",
            "postal_code": "10000",
            "country": "Sénégal"
          },
          "notes": "Instructions spéciales pour la livraison"
        },
        "payment_info": {
          "status": "PAID",
          "status_text": "Payé",
          "status_icon": "✅",
          "status_color": "#28A745",
          "method": "PAYDUNYA",
          "method_text": "PayDunya",
          "transaction_id": "test_token_123"
        },
        "order_items": [
          {
            "id": 1,
            "quantity": 2,
            "unitPrice": 7000,
            "totalPrice": 14000,
            "product": {
              "id": 101,
              "name": "T-shirt personnalisé",
              "reference": "TS-001"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

---

### 2. Mettre à jour le statut d'une commande ⭐

```http
PATCH /orders/{id}/status
```

**Paramètres URL :**
- `id` (number) : ID de la commande

**Corps de la requête :**
```json
{
  "status": "PROCESSING",
  "notes": "Commande en préparation"
}
```

**Champs possibles :**
- `status` (obligatoire) : Nouveau statut parmi les valeurs disponibles
- `notes` (optionnel) : Notes administratives sur le changement

**Réponse :**
```json
{
  "success": true,
  "message": "Statut de la commande mis à jour avec succès",
  "data": {
    "id": 1,
    "orderNumber": "CMD-2024-001",
    "status": "PROCESSING",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

---

### 3. Obtenir les détails d'une commande

```http
GET /orders/{id}
```

**Réponse :** Même structure qu'une commande individuelle dans la liste

---

## 🔄 Workflow Recommencé (Exemple)

### Étape 1: Commande confirmée → En traitement
```bash
PATCH /orders/1/status
{
  "status": "PROCESSING",
  "notes": "Commande reçue, début de la préparation"
}
```

### Étape 2: En traitement → Expédiée
```bash
PATCH /orders/1/status
{
  "status": "SHIPPED",
  "notes": "Expédié via Transporteur XYZ - N° suivi: XYZ123456SN"
}
```

### Étape 3: Expédiée → Livrée
```bash
PATCH /orders/1/status
{
  "status": "DELIVERED",
  "notes": "Client confirmé avoir reçu la commande"
}
```

---

## 🎨 Composants Frontend Suggérés

### 1. Boutons d'action par statut

```typescript
interface StatusButton {
  label: string;
  status: OrderStatus;
  color: string;
  icon: string;
  disabled?: boolean;
}

const getStatusButtons = (currentStatus: string): StatusButton[] => {
  const buttons: StatusButton[] = [];

  switch (currentStatus) {
    case 'PENDING':
      buttons.push(
        { label: 'Confirmer', status: 'CONFIRMED', color: 'success', icon: 'check' },
        { label: 'Rejeter', status: 'REJECTED', color: 'danger', icon: 'x' }
      );
      break;
    case 'CONFIRMED':
      buttons.push(
        { label: 'En préparation', status: 'PROCESSING', color: 'primary', icon: 'clock' },
        { label: 'Annuler', status: 'CANCELLED', color: 'danger', icon: 'x' }
      );
      break;
    case 'PROCESSING':
      buttons.push(
        { label: 'Expédier', status: 'SHIPPED', color: 'info', icon: 'truck' },
        { label: 'Annuler', status: 'CANCELLED', color: 'danger', icon: 'x' }
      );
      break;
    case 'SHIPPED':
      buttons.push(
        { label: 'Marquer livrée', status: 'DELIVERED', color: 'success', icon: 'check-circle' }
      );
      break;
  }

  return buttons;
};
```

### 2. Modal de mise à jour

```typescript
interface UpdateStatusModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: OrderStatus, notes?: string) => void;
}

const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>('');
  const [notes, setNotes] = useState('');

  const availableStatuses = getNextStatuses(order.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h3>Mettre à jour le statut</h3>
      <p>Commande: {order.orderNumber}</p>

      <div className="status-options">
        {availableStatuses.map(status => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={selectedStatus === status ? 'selected' : ''}
          >
            {getStatusDisplay(status)}
          </button>
        ))}
      </div>

      <textarea
        placeholder="Notes (optionnel)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="modal-actions">
        <button onClick={onClose}>Annuler</button>
        <button
          onClick={() => onConfirm(selectedStatus, notes)}
          disabled={!selectedStatus}
        >
          Confirmer
        </button>
      </div>
    </Modal>
  );
};
```

### 3. Hook API

```typescript
interface UseOrderManagementReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  updateOrderStatus: (orderId: number, status: OrderStatus, notes?: string) => Promise<void>;
  fetchOrders: (page?: number, status?: string) => Promise<void>;
}

export const useOrderManagement = (): UseOrderManagementReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchOrders = async (page = 1, status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (status) params.append('status', status);

      const response = await fetch(`/api/orders/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: OrderStatus, notes?: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status, notes })
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour la commande dans la liste
        setOrders(prev => prev.map(order =>
          order.id === orderId
            ? { ...order, ...data.data }
            : order
        ));

        // Afficher une notification de succès
        showNotification('Statut mis à jour avec succès', 'success');
      } else {
        showNotification(data.message, 'error');
      }
    } catch (err) {
      showNotification('Erreur lors de la mise à jour du statut', 'error');
    }
  };

  return {
    orders,
    loading,
    error,
    pagination,
    updateOrderStatus,
    fetchOrders
  };
};
```

---

## 🔧 Configuration des couleurs par statut

```typescript
const STATUS_CONFIG = {
  PENDING: {
    color: '#FFA500',
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    icon: '⏳',
    text: 'En attente'
  },
  CONFIRMED: {
    color: '#28A745',
    backgroundColor: '#D4EDDA',
    borderColor: '#C3E6CB',
    icon: '✅',
    text: 'Confirmée'
  },
  PROCESSING: {
    color: '#17A2B8',
    backgroundColor: '#D1ECF1',
    borderColor: '#BEE5EB',
    icon: '🔄',
    text: 'En traitement'
  },
  SHIPPED: {
    color: '#007BFF',
    backgroundColor: '#CCE5FF',
    borderColor: '#B3D9FF',
    icon: '📦',
    text: 'Expédiée'
  },
  DELIVERED: {
    color: '#6C757D',
    backgroundColor: '#E2E3E5',
    borderColor: '#D6D8DB',
    icon: '✅',
    text: 'Livrée'
  },
  CANCELLED: {
    color: '#DC3545',
    backgroundColor: '#F8D7DA',
    borderColor: '#F5C6CB',
    icon: '❌',
    text: 'Annulée'
  },
  REJECTED: {
    color: '#6F42C1',
    backgroundColor: '#E2D9F3',
    borderColor: '#D4C9F1',
    icon: '❌',
    text: 'Rejetée'
  }
};
```

---

## 📱 Exemple d'interface utilisateur

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Liste des Commandes                                    │
├─────────────────────────────────────────────────────────────┤
│ Filtre: [CONFIRMED ▼] [Rafraîchir]                        │
├─────────────────────────────────────────────────────────────┤
│ ┌─ CMD-2024-001 - 15 000 FCFA ─────────────────────────┐   │
│ │ Client: Client Name (client@email.com)               │   │
│ │ 📞 +221771234567                                    │   │
│ │ 📍 123 Rue, Dakar, Sénégal                          │   │
│ │                                                     │   │
│ │ 💳 Payé ✅ (PayDunya) - #test_token_123             │   │
│ │                                                     │   │
│ │ 📊 Articles: 2 T-shirt personnalisé                  │   │
│ │                                                     │   │
│ │ 🕒 15/01/2024 10:30                                 │   │
│ │                                                     │   │
│ │ [🔄 En préparation] [📦 Expédier] [❌ Annuler]       │   │
│ └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Bonnes Pratiques

1. **Validation côté client** : Vérifier que le statut est valide avant l'envoi
2. **Feedback utilisateur** : Afficher des notifications pour les succès/erreurs
3. **Optimisme** : Mettre à jour l'interface immédiatement puis corriger si erreur
4. **Chargement** : Afficher des indicateurs pendant les appels API
5. **Pagination** : Gérer correctement la pagination pour grandes quantités
6. **Rafraîchissement** : Proposer un bouton pour recharger les données
7. **Filtres** : Permettre de filtrer par statut et autres critères

---

## 🚀 Démarrage Rapide

1. **Installer les dépendances** : `npm install axios react-toastify`
2. **Configurer l'authentification** : Gérer les tokens JWT
3. **Créer les composants** : Utiliser les exemples ci-dessus
4. **Intégrer l'API** : Appeler les endpoints avec les bons headers
5. **Tester** : Vérifier tous les workflows de statuts

---

*Pour toute question ou problème d'implémentation, contactez l'équipe de développement backend.* 🚀