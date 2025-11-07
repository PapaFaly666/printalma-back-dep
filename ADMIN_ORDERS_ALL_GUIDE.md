# 📋 Guide API : Endpoint `/orders/admin/all`

---

## 🎯 Endpoint Principal - Commandes Admin

### **URL**
```
GET http://localhost:3004/orders/admin/all
```

### **Authentification Requise**
```http
Authorization: Bearer {jwt_token}
Roles: ADMIN ou SUPERADMIN
```

---

## 🔧 Paramètres de Requête

### **Query Parameters**
| Paramètre | Type | Défaut | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `page` | number | 1 | Numéro de page (pagination) | `?page=2` |
| `limit` | number | 10 | Nombre d'éléments par page (1-100) | `?limit=25` |
| `status` | string | tous | Filtrer par statut de commande | `?status=CONFIRMED` |

### **Statuts de Commande Possibles**
- `PENDING` - En attente
- `CONFIRMED` - Confirmée
- `PROCESSING` - En traitement
- `SHIPPED` - Expédiée
- `DELIVERED` - Livrée
- `CANCELLED` - Annulée
- `REFUNDED` - Remboursée

---

## 📊 Structure de Réponse

### **Response Complète**
```json
{
  "success": true,
  "message": "Commandes récupérées avec succès",
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "CMD-2024-001",
        "totalAmount": 15000,
        "subTotal": 14000,
        "taxAmount": 1000,
        "shippingFee": 500,
        "finalAmount": 15000,
        "status": "CONFIRMED",
        "paymentStatus": "PAID",
        "paymentMethod": "PAYDUNYA",
        "transactionId": "test_token_123",
        "itemsCount": 2,
        "email": "client@email.com",
        "phoneNumber": "+221771234567",
        "notes": "Instructions spéciales",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:35:00Z",
        "estimatedDelivery": "2024-01-18T14:00:00Z",

        "payment_info": {
          "status": "PAID",
          "status_text": "Payé",
          "status_icon": "✅",
          "status_color": "#28A745",
          "method": "PAYDUNYA",
          "method_text": "PayDunya",
          "transaction_id": "test_token_123",
          "attempts_count": 1,
          "last_attempt_at": "2024-01-15T10:35:00Z"
        },

        "customer_info": {
          // Informations utilisateur si disponible
          "user_id": 101,
          "user_firstname": "Client",
          "user_lastname": "Name",
          "user_email": "client@email.com",
          "user_phone": "+221771234567",
          "user_role": "CLIENT",

          // Informations de livraison de la commande
          "shipping_name": "Client Name",
          "shipping_email": "client@email.com",
          "shipping_phone": "+221771234567",

          // Informations de contact principales
          "email": "client@email.com",
          "phone": "+221771234567",

          // Nom complet pour affichage
          "full_name": "Client Name",

          // Détails de livraison
          "shipping_address": {
            "address": "123 Rue, Dakar, Sénégal",
            "city": "Dakar",
            "postal_code": "10000",
            "country": "Sénégal",
            "additional_info": "Face au marché"
          },

          // Notes client
          "notes": "Instructions spéciales pour la livraison",

          // Dates importantes
          "created_at": "2024-01-15T10:30:00Z",
          "updated_at": "2024-01-15T10:35:00Z"
        },

        "order_items": [
          {
            "id": 1,
            "quantity": 2,
            "unitPrice": 7000,
            "totalPrice": 14000,
            "size": "L",
            "color": "Noir",
            "product": {
              "id": 101,
              "name": "T-shirt personnalisé",
              "reference": "TS-001",
              "description": "T-shirt de qualité"
            }
          }
        ],

        "payment_attempts_history": [
          {
            "id": 123,
            "status": "completed",
            "amount": 15000,
            "paymentMethod": "paydunya",
            "paytechToken": "test_token_123",
            "attemptedAt": "2024-01-15T10:35:00Z"
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
    },
    "stats": {
      "totalOrders": 25,
      "pendingOrders": 5,
      "paidOrders": 18,
      "cancelledOrders": 2,
      "totalRevenue": 375000
    }
  }
}
```

---

## 🎨 Codes Statuts de Paiement (Payment Info)

| Statut | Texte | Icône | Couleur | Utilisation |
|--------|-------|-------|---------|-------------|
| `PENDING` | En attente de paiement | ⏳ | #FFA500 | Orange pour attente |
| `PAID` | Payé | ✅ | #28A745 | Vert pour succès |
| `FAILED` | Échoué | ❌ | #DC3545 | Rouge pour échec |
| `CANCELLED` | Annulé | 🚫 | #6C757D | Gris pour annulation |
| `REFUNDED` | Remboursé | 💰 | #17A2B8 | Cyan pour remboursement |

### **Méthodes de Paiement**
| Méthode | Texte Affiché |
|---------|---------------|
| `PAYDUNYA` | PayDunya |
| `PAYTECH` | PayTech |
| `CASH_ON_DELIVERY` | Paiement à la livraison |
| `WAVE` | Wave |
| `ORANGE_MONEY` | Orange Money |

---

## 💡 Exemples d'Utilisation

### **1. Obtenir toutes les commandes (page 1)**
```bash
curl -X GET "http://localhost:3004/orders/admin/all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Paginer les résultats**
```bash
curl -X GET "http://localhost:3004/orders/admin/all?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. Filtrer par statut**
```bash
curl -X GET "http://localhost:3004/orders/admin/all?status=PENDING" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **4. Commandes payées uniquement**
```bash
curl -X GET "http://localhost:3004/orders/admin/all?status=CONFIRMED&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## ⚠️ Gestion des Erreurs

### **401 - Non autorisé**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

### **403 - Permissions insuffisantes**
```json
{
  "message": "Access denied - insufficient permissions",
  "statusCode": 403
}
```

### **400 - Paramètres invalides**
```json
{
  "message": "La page doit être supérieure à 0",
  "statusCode": 400
}
```

---

## 🛠️ Intégration Frontend

### **React Component Example**
```tsx
import React, { useState, useEffect } from 'react';

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  payment_info: {
    status_text: string;
    status_icon: string;
    status_color: string;
    method_text: string;
    transaction_id?: string;
    attempts_count: number;
  };
  customer_info: {
    // Informations utilisateur
    user_id: number;
    user_firstname: string;
    user_lastname: string;
    user_email: string;
    user_phone: string;
    user_role: string;

    // Informations de livraison
    shipping_name: string;
    shipping_email: string;
    shipping_phone: string;

    // Contact principal
    email: string;
    phone: string;
    full_name: string;

    // Adresse de livraison
    shipping_address: {
      address: string;
      city: string;
      postal_code: string;
      country: string;
      additional_info: string;
    };

    // Notes et dates
    notes: string;
    created_at: string;
    updated_at: string;
  };
  createdAt: string;
}

const AdminOrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const fetchOrders = async (page = 1, limit = 10, status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status })
      });

      const response = await fetch(`/orders/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      setOrders(data.data.orders);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-orders">
      <h1>Liste des Commandes</h1>

      {orders.map((order) => (
        <div key={order.id} className="order-card">
          <div className="order-header">
            <h3>{order.orderNumber}</h3>
            <span
              className="payment-status"
              style={{
                backgroundColor: order.payment_info.status_color + '20',
                color: order.payment_info.status_color,
                border: `1px solid ${order.payment_info.status_color}`
              }}
            >
              {order.payment_info.status_icon} {order.payment_info.status_text}
            </span>
          </div>

          <div className="order-details">
            <h4>👤 Informations Client</h4>
            <p><strong>Nom complet:</strong> {order.customer_info.full_name}</p>
            <p><strong>Email:</strong> {order.customer_info.email}</p>
            <p><strong>Téléphone:</strong> {order.customer_info.phone}</p>

            {order.customer_info.user_id && (
              <p><strong>ID Utilisateur:</strong> {order.customer_info.user_id}</p>
            )}

            {order.customer_info.user_role && (
              <p><strong>Rôle:</strong> {order.customer_info.user_role}</p>
            )}

            <h4>📦 Adresse de Livraison</h4>
            {order.customer_info.shipping_address ? (
              <div className="shipping-address">
                <p><strong>Adresse:</strong> {order.customer_info.shipping_address.address}</p>
                <p><strong>Ville:</strong> {order.customer_info.shipping_address.city}</p>
                {order.customer_info.shipping_address.postal_code && (
                  <p><strong>Code Postal:</strong> {order.customer_info.shipping_address.postal_code}</p>
                )}
                <p><strong>Pays:</strong> {order.customer_info.shipping_address.country}</p>
                {order.customer_info.shipping_address.additional_info && (
                  <p><strong>Infos complémentaires:</strong> {order.customer_info.shipping_address.additional_info}</p>
                )}
              </div>
            ) : (
              <p>Aucune adresse de livraison spécifiée</p>
            )}

            {order.customer_info.notes && (
              <div className="customer-notes">
                <h4>📝 Notes Client</h4>
                <p>{order.customer_info.notes}</p>
              </div>
            )}

            <h4>💳 Paiement</h4>
            <p><strong>Montant:</strong> {order.totalAmount} FCFA</p>
            <p><strong>Méthode:</strong> {order.payment_info.method_text}</p>
            {order.payment_info.transaction_id && (
              <p><strong>Token:</strong> {order.payment_info.transaction_id}</p>
            )}

            <h4>📅 Dates</h4>
            <p><strong>Créée le:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Modifiée le:</strong> {new Date(order.customer_info.updated_at).toLocaleString()}</p>
          </div>
        </div>
      ))}

      <div className="pagination">
        <button
          onClick={() => fetchOrders(pagination.page - 1)}
          disabled={!pagination.hasPrevious}
        >
          Précédent
        </button>
        <span>Page {pagination.page} / {pagination.totalPages}</span>
        <button
          onClick={() => fetchOrders(pagination.page + 1)}
          disabled={!pagination.hasNext}
        >
          Suivant
        </button>
      </div>
    </div>
  );
};

export default AdminOrdersList;
```

### **CSS Styles**
```css
.admin-orders {
  padding: 20px;
}

.order-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  background: white;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.payment-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.order-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.order-details h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 4px;
}

.order-details p {
  margin: 4px 0;
  font-size: 13px;
  line-height: 1.4;
}

.order-details strong {
  color: #555;
  font-weight: 600;
}

.shipping-address {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

.customer-notes {
  background: #fff3cd;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #ffc107;
}

.customer-notes h4 {
  border-bottom-color: #ffc107;
  color: #856404;
}

.customer-notes p {
  color: #856404;
  font-style: italic;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 📊 Pour le Tableau de Bord Admin

### **Statistiques Incluses**
```json
{
  "stats": {
    "totalOrders": 25,
    "pendingOrders": 5,
    "paidOrders": 18,
    "cancelledOrders": 2,
    "totalRevenue": 375000
  }
}
```

### **Filtres Utiles**
- Par statut de commande
- Par statut de paiement (via `payment_info.status`)
- Par méthode de paiement (via `payment_info.method`)
- Par date (utiliser `createdAt` et `updatedAt`)

---

## 🚀 Performance Tips

1. **Pagination** : Utilisez `limit` entre 10-50 pour de meilleures performances
2. **Filtrage** : Filtrez par statut pour réduire les résultats
3. **Mise en cache** : Cachez les résultats pour les pages fréquemment consultées
4. **Loading states** : Affichez un indicateur de chargement pendant les appels API

---

## 🆘 Support

Pour toute question sur cet endpoint :
- **Documentation Swagger** : `http://localhost:3004/api`
- **Logs** : Vérifiez les logs du backend pour plus de détails
- **Contact** : Équipe backend pour questions techniques

---

*Guide mis à jour le 6 Novembre 2024*