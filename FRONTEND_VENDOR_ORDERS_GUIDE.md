# Guide Frontend - Intégration des Commandes Vendeur

Ce guide détaille comment intégrer les endpoints de gestion des commandes vendeur dans le frontend PrintAlma.

## 📋 Table des matières

1. [Authentification](#authentification)
2. [Endpoints disponibles](#endpoints-disponibles)
3. [Structures de données](#structures-de-données)
4. [Exemples de requêtes](#exemples-de-requêtes)
5. [Gestion des erreurs](#gestion-des-erreurs)
6. [Interface utilisateur suggérée](#interface-utilisateur-suggérée)
7. [Données de test disponibles](#données-de-test-disponibles)

## 🔐 Authentification

Tous les endpoints nécessitent une authentification JWT avec le rôle `VENDEUR`.

### Headers requis
```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Vendeur de test disponible
- **Email**: `pf.d@zig.univ.sn`
- **ID**: 7
- **Rôle**: VENDEUR

## 🔗 Endpoints disponibles

### 1. Liste des commandes avec pagination et filtres
```
GET /vendor/orders
```

**Paramètres de requête (optionnels):**
```javascript
const params = {
  page: 1,                    // Page (défaut: 1)
  limit: 10,                  // Éléments par page (défaut: 10, max: 100)
  status: 'PROCESSING',       // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REJECTED
  search: 'client.test',      // Recherche par nom/email client ou numéro commande
  startDate: '2024-01-01',    // Date de début (ISO string)
  endDate: '2024-12-31',      // Date de fin (ISO string)
  minAmount: 10000,           // Montant minimum
  maxAmount: 100000,          // Montant maximum
  sortBy: 'createdAt',        // createdAt, updatedAt, totalAmount, orderNumber
  sortOrder: 'desc'           // asc, desc
}
```

**Exemple d'appel:**
```javascript
const response = await fetch(`/vendor/orders?page=1&limit=10&status=PROCESSING`, {
  headers
});
```

### 2. Détails d'une commande spécifique
```
GET /vendor/orders/:orderId
```

### 3. Mise à jour du statut d'une commande
```
PATCH /vendor/orders/:orderId/status
```

**Body:**
```javascript
{
  "status": "CONFIRMED",           // Nouveau statut
  "notes": "Commande confirmée"    // Notes optionnelles
}
```

**Transitions autorisées pour les vendeurs:**
- `PENDING` → `CONFIRMED`
- `CONFIRMED` → `PROCESSING`
- `PROCESSING` → `SHIPPED`

### 4. Statistiques du vendeur
```
GET /vendor/orders/statistics
```

### 5. Recherche de commandes
```
GET /vendor/orders/search?q=terme_recherche
```

### 6. Commandes par statut
```
GET /vendor/orders/status/:status
```

### 7. Export CSV
```
GET /vendor/orders/export/csv
```

**Headers spéciaux:**
```javascript
{
  'Accept': 'text/csv',
  'Authorization': `Bearer ${token}`
}
```

### 8. Notifications du vendeur
```
GET /vendor/orders/notifications
```

### 9. Marquer notification comme lue
```
PATCH /vendor/orders/notifications/:notificationId/read
```

## 📊 Structures de données

### Réponse standard
Toutes les réponses suivent cette structure :
```javascript
{
  "success": boolean,
  "message": "Message descriptif",
  "data": any,              // Données spécifiques à l'endpoint
  "statusCode"?: number     // Code de statut optionnel
}
```

### Structure d'une commande
```javascript
{
  "id": 123,
  "orderNumber": "CMD-TEST-1758102961137-001",
  "userId": 8,
  "user": {
    "id": 8,
    "firstName": "Client",
    "lastName": "Test",
    "email": "client.test@email.com",
    "role": "VENDEUR",
    "photo_profil": null
  },
  "status": "PROCESSING",
  "totalAmount": 35000,
  "subtotal": 31500,
  "taxAmount": 0,
  "shippingAmount": 3500,
  "paymentMethod": "MOBILE_MONEY",
  "shippingAddress": {
    "name": "Client Test",
    "firstName": "Client",
    "lastName": "Test",
    "street": "123 Rue Test",
    "city": "Dakar",
    "region": "Dakar",
    "country": "Sénégal",
    "fullFormatted": "123 Rue Test, Dakar, Sénégal",
    "phone": "+221 77 123 45 67"
  },
  "phoneNumber": "+221 77 123 45 67",
  "notes": "Commande de test - Livraison urgente",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:20:00.000Z",
  "confirmedAt": "2024-01-15T11:00:00.000Z",
  "shippedAt": null,
  "deliveredAt": null,
  "orderItems": [
    {
      "id": 1,
      "quantity": 2,
      "unitPrice": 17500,
      "totalPrice": 35000,
      "size": "M",
      "color": "Noir",
      "colorId": 5,
      "productId": 1,
      "productName": "T-shirt Design Afrique",
      "productImage": "https://cloudinary.com/product1.jpg",
      "product": {
        "id": 1,
        "name": "T-shirt Design Afrique",
        "description": "T-shirt avec design africain authentique",
        "price": 17500,
        "designName": "Design Placeholder",
        "designDescription": "Description du design",
        "designImageUrl": "https://cloudinary.com/design-placeholder.jpg",
        "categoryId": 1,
        "categoryName": "Vêtements"
      }
    }
  ]
}
```

### Structure des statistiques
```javascript
{
  "totalOrders": 25,
  "totalRevenue": 875000,
  "averageOrderValue": 35000,
  "monthlyGrowth": 15.2,
  "pendingOrders": 3,
  "processingOrders": 5,
  "shippedOrders": 8,
  "deliveredOrders": 7,
  "cancelledOrders": 2,
  "revenueThisMonth": 245000,
  "ordersThisMonth": 8,
  "revenueLastMonth": 210000,
  "ordersLastMonth": 6
}
```

### Structure d'une notification
```javascript
{
  "id": 1,
  "type": "NEW_ORDER",
  "title": "Nouvelle commande",
  "message": "Vous avez reçu une nouvelle commande #CMD-TEST-...",
  "orderId": 123,
  "isRead": false,
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## 🔧 Exemples de requêtes

### Récupérer les commandes paginées
```javascript
async function fetchVendorOrders(page = 1, status = null) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '10'
    });

    if (status) {
      params.append('status', status);
    }

    const response = await fetch(`/vendor/orders?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      return {
        orders: data.data.orders,
        pagination: {
          total: data.data.total,
          page: data.data.page,
          totalPages: data.data.totalPages,
          hasNext: data.data.hasNext,
          hasPrevious: data.data.hasPrevious
        }
      };
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    throw error;
  }
}
```

### Mettre à jour le statut d'une commande
```javascript
async function updateOrderStatus(orderId, newStatus, notes = '') {
  try {
    const response = await fetch(`/vendor/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus,
        notes: notes
      })
    });

    const data = await response.json();

    if (data.success) {
      return data.data; // Commande mise à jour
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
}
```

### Récupérer les statistiques
```javascript
async function fetchVendorStatistics() {
  try {
    const response = await fetch('/vendor/orders/statistics', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    return null;
  }
}
```

## ⚠️ Gestion des erreurs

### Codes d'erreur courants
- **401**: Token JWT invalide ou expiré
- **403**: Accès interdit (pas le bon rôle ou pas propriétaire de la commande)
- **404**: Commande non trouvée
- **400**: Données invalides (transition de statut non autorisée, paramètres incorrects)
- **500**: Erreur serveur

### Exemple de gestion d'erreurs
```javascript
async function handleApiCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.response?.status === 401) {
      // Token expiré - rediriger vers login
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Accès interdit
      showNotification('Accès non autorisé', 'error');
    } else {
      // Autre erreur
      showNotification(error.message || 'Une erreur est survenue', 'error');
    }
  }
}
```

## 🎨 Interface utilisateur suggérée

### Page principale des commandes
```jsx
function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1
  });

  // Interface suggérée :
  return (
    <div className="vendor-orders-page">
      {/* Statistiques en haut */}
      <StatisticsCards />

      {/* Filtres */}
      <FilterBar
        onStatusChange={(status) => setFilters({...filters, status})}
        onSearchChange={(search) => setFilters({...filters, search})}
      />

      {/* Liste des commandes */}
      <OrdersList
        orders={orders}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Pagination */}
      <Pagination
        current={pagination.page}
        total={pagination.totalPages}
        onChange={(page) => setFilters({...filters, page})}
      />
    </div>
  );
}
```

### Composant carte de commande
```jsx
function OrderCard({ order, onStatusUpdate }) {
  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'orange',
      'CONFIRMED': 'blue',
      'PROCESSING': 'purple',
      'SHIPPED': 'green',
      'DELIVERED': 'success',
      'CANCELLED': 'red',
      'REJECTED': 'red'
    };
    return colors[status] || 'gray';
  };

  return (
    <div className="order-card">
      <div className="order-header">
        <h3>{order.orderNumber}</h3>
        <Badge color={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </div>

      <div className="order-client">
        <strong>{order.user.firstName} {order.user.lastName}</strong>
        <span>{order.user.email}</span>
      </div>

      <div className="order-details">
        <div>Montant: {order.totalAmount.toLocaleString()} FCFA</div>
        <div>Date: {new Date(order.createdAt).toLocaleDateString()}</div>
        <div>Articles: {order.orderItems.length}</div>
      </div>

      {/* Boutons d'action selon le statut */}
      <OrderActions
        order={order}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  );
}
```

## 🗃️ Données de test disponibles

Le vendeur `pf.d@zig.univ.sn` (ID: 7) a maintenant les données suivantes :

### Commandes créées
- **CMD-TEST-...-001**: Status PROCESSING, 35,000 FCFA
- **CMD-TEST-...-002**: Status PENDING, 17,500 FCFA
- **CMD-TEST-...-003**: Status DELIVERED, 52,500 FCFA

### Client de test
- **Email**: client.test@email.com
- **Nom**: Client Test
- **Adresse**: 123 Rue Test, Dakar, Sénégal

### Transitions possibles pour les tests
1. Commande PENDING → CONFIRMED
2. Commande CONFIRMED → PROCESSING
3. Commande PROCESSING → SHIPPED

### Exemples de requêtes de test
```bash
# Liste toutes les commandes
GET /vendor/orders?page=1&limit=10

# Commandes en attente seulement
GET /vendor/orders?status=PENDING

# Recherche par client
GET /vendor/orders?search=client.test

# Statistiques
GET /vendor/orders/statistics

# Export CSV
GET /vendor/orders/export/csv
```

## 🚀 Démarrage rapide

1. **Authentifie-toi** avec `pf.d@zig.univ.sn`
2. **Récupère le token JWT** de la réponse de login
3. **Teste l'endpoint** `/vendor/orders` pour voir les 3 commandes
4. **Teste la mise à jour** de statut sur la commande PENDING
5. **Vérifie les statistiques** avec `/vendor/orders/statistics`

Le système est entièrement fonctionnel et prêt pour l'intégration frontend !