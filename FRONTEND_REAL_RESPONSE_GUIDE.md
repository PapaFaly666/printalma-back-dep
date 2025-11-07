# 📚 Guide Frontend - RÉPONSE RÉELLE Endpoint `/orders/admin/all`

## 🎯 Basé sur la réponse RÉELLE de l'API

---

## 📡 Endpoint Principal

### **URL**
```bash
GET http://localhost:3004/orders/admin/all?page=1&limit=10&status=PENDING
```

### **Headers**
```http
Authorization: Bearer {jwt_token}
accept: */*
```

---

## 📊 Structure RÉELLE de Réponse

### **Response API COMPLÈTE (basée sur vos données réelles)**

```json
{
  "success": true,
  "message": "Commandes récupérées avec succès",
  "data": {
    "orders": [
      {
        "id": 123,
        "orderNumber": "ORD-1762433156472",
        "userId": 3,
        "status": "PENDING",
        "totalAmount": 6000,

        // 📞 INFORMATIONS CONTACT PRINCIPALES
        "phoneNumber": "775588834",
        "email": "djibymamadou.wade@unchk.edu.sn",

        // 📝 NOTES CLIENT
        "notes": "💳 PAYMENT FAILED (Attempt #1): {\n  \"reason\": \"user_cancelled\",\n  \"category\": \"user_action\",\n  \"message\": \"Payment cancelled - Auto-detected by cron job\",\n  \"timestamp\": \"2025-11-06T12:47:30.034Z\",\n  \"attemptNumber\": 1\n}",

        // 📦 INFORMATIONS DE LIVRAISON COMPLÈTES
        "shippingName": "Papa Faly yo yo yo  Sidy",
        "shippingStreet": "Point E",
        "shippingCity": "Point E",
        "shippingRegion": "Point E",
        "shippingPostalCode": "33222",
        "shippingCountry": "Sénégal",
        "shippingAddressFull": "Point E, Point E, 33222, Sénégal",

        // 💳 INFORMATIONS PAIEMENT
        "paymentMethod": "PAYDUNYA",
        "paymentStatus": "FAILED",
        "transactionId": "test_5w3Nvsjq2n",
        "paymentAttempts": 1,
        "lastPaymentAttemptAt": "2025-11-06T12:47:30.034Z",
        "lastPaymentFailureReason": "user_cancelled",
        "hasInsufficientFunds": false,

        // 📅 DATES
        "createdAt": "2025-11-06T12:45:56.475Z",
        "updatedAt": "2025-11-06T12:47:30.038Z",
        "validatedAt": null,
        "confirmedAt": null,
        "deliveredAt": null,
        "shippedAt": null,

        // 👤 INFORMATIONS UTILISATEUR COMPLÈTES
        "user": {
          "id": 3,
          "firstName": "Papa Faly",
          "lastName": "Sidy",
          "email": "pf.d@zig.univ.sn",
          "phone": "+221774322221",
          "role": "VENDEUR",
          "vendeur_type": "ARTISTE",
          "shop_name": "C'est carré"
        },

        // 🎨 INFORMATIONS ENRICHIES (formatées pour le frontend)
        "payment_info": {
          "status": "FAILED",
          "status_text": "Échoué",
          "status_icon": "❌",
          "status_color": "#DC3545",
          "method": "PAYDUNYA",
          "method_text": "PayDunya",
          "transaction_id": "test_5w3Nvsjq2n",
          "attempts_count": 1,
          "last_attempt_at": "2025-11-06T12:47:30.034Z"
        },

        // 🆕 INFORMATIONS CLIENT ORGANISÉES (formatées pour le frontend)
        "customer_info": {
          "user_id": 3,
          "user_firstname": "Papa Faly",
          "user_lastname": "Sidy",
          "user_email": "pf.d@zig.univ.sn",
          "user_phone": "+221774322221",
          "user_role": "VENDEUR",

          "shipping_name": "Papa Faly yo yo yo  Sidy",
          "shipping_email": "djibymamadou.wade@unchk.edu.sn",
          "shipping_phone": "775588834",

          "email": "djibymamadou.wade@unchk.edu.sn",
          "phone": "775588834",
          "full_name": "Papa Faly yo yo yo  Sidy",

          "shipping_address": null,
          "notes": "💳 PAYMENT FAILED...",
          "created_at": "2025-11-06T12:45:56.475Z",
          "updated_at": "2025-11-06T12:47:30.038Z"
        },

        // 📦 ARTICLES DE LA COMMANDE
        "orderItems": [
          {
            "id": 121,
            "quantity": 1,
            "unitPrice": 6000,
            "size": "X",
            "color": "Blanc",
            "product": {
              "id": 1,
              "name": "Tshirt",
              "description": "C'est carré",
              "price": 6000
            }
          }
        ]
      }
    ],
    "pagination": {
      "total": 83,
      "page": 1,
      "limit": 2,
      "totalPages": 42
    }
  }
}
```

---

## 💻 Component React RÉEL (basé sur vos données)

```tsx
import React, { useState, useEffect } from 'react';

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: string;
  totalAmount: number;

  // 📞 Contact principal
  phoneNumber: string;
  email: string;
  notes: string;

  // 📦 Adresse de livraison
  shippingName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
  shippingAddressFull: string;

  // 💳 Paiement
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  paymentAttempts: number;
  lastPaymentAttemptAt: string;
  lastPaymentFailureReason: string;
  hasInsufficientFunds: boolean;

  // 📅 Dates
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  confirmedAt: string | null;
  deliveredAt: string | null;
  shippedAt: string | null;

  // 👤 Utilisateur
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    vendeur_type: string;
    shop_name: string;
  };

  // 🎨 Infos enrichies
  payment_info: {
    status_text: string;
    status_icon: string;
    status_color: string;
    method_text: string;
    transaction_id: string;
    attempts_count: number;
  };

  // 🆕 Infos client organisées
  customer_info: {
    user_id: number;
    user_firstname: string;
    user_lastname: string;
    user_email: string;
    user_phone: string;
    user_role: string;
    shipping_name: string;
    shipping_email: string;
    shipping_phone: string;
    email: string;
    phone: string;
    full_name: string;
    notes: string;
    created_at: string;
    updated_at: string;
  };

  // 📦 Articles
  orderItems: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    size: string;
    color: string;
    product: {
      id: number;
      name: string;
      description: string;
      price: number;
    };
  }>;
}

const RealOrdersList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (page = 1, limit = 10, status?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status })
      });

      const response = await fetch(`/orders/admin/all?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'accept': '*/*'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.data.orders);
      } else {
        throw new Error(data.message || 'Erreur lors de la récupération des commandes');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="orders-container">
      <h1>📋 Commandes Admin</h1>

      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
};

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
  // 🎨 Extraire les erreurs de paiement des notes
  const parsePaymentError = (notes: string) => {
    try {
      if (notes.includes('💳 PAYMENT FAILED')) {
        const match = notes.match(/\{[^}]+\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const paymentError = parsePaymentError(order.notes);

  return (
    <div className="order-card">
      {/* En-tête avec statut */}
      <div className="order-header">
        <div className="order-title">
          <h3>📦 {order.orderNumber}</h3>
          <span className="order-id">ID: {order.id}</span>
        </div>
        <div className="order-statuses">
          <span
            className="status-badge status-order"
            style={{
              backgroundColor: order.status === 'PENDING' ? '#fff3cd' : '#d4edda',
              color: order.status === 'PENDING' ? '#856404' : '#155724',
              border: `1px solid ${order.status === 'PENDING' ? '#ffeaa7' : '#c3e6cb'}`
            }}
          >
            {order.status}
          </span>
          <span
            className="status-badge status-payment"
            style={{
              backgroundColor: order.payment_info.status_color + '20',
              color: order.payment_info.status_color,
              border: `1px solid ${order.payment_info.status_color}`
            }}
          >
            {order.payment_info.status_icon} {order.payment_info.status_text}
          </span>
        </div>
      </div>

      {/* 👤 INFORMATIONS CLIENT COMPLÈTES */}
      <div className="customer-section">
        <h4>👤 Informations Client</h4>

        <div className="customer-grid">
          {/* Contact principal */}
          <div className="info-block">
            <h5>📞 Contact Principal</h5>
            <p><strong>Email:</strong> {order.email}</p>
            <p><strong>Téléphone:</strong> {order.phoneNumber}</p>
            <p><strong>Nom complet:</strong> {order.customer_info.full_name}</p>
          </div>

          {/* Utilisateur (si différent) */}
          {(order.user.email !== order.email || order.user.phone !== order.phoneNumber) && (
            <div className="info-block">
              <h5>👤 Informations Utilisateur</h5>
              <p><strong>ID:</strong> {order.user.id}</p>
              <p><strong>Nom:</strong> {order.user.firstName} {order.user.lastName}</p>
              <p><strong>Email:</strong> {order.user.email}</p>
              <p><strong>Téléphone:</strong> {order.user.phone}</p>
              <p><strong>Rôle:</strong> {order.user.role}</p>
              <p><strong>Type vendeur:</strong> {order.user.vendeur_type}</p>
              {order.user.shop_name && (
                <p><strong>Boutique:</strong> {order.user.shop_name}</p>
              )}
            </div>
          )}

          {/* Contact livraison */}
          {(order.shippingName || order.shippingEmail || order.shippingPhone !== order.phoneNumber) && (
            <div className="info-block">
              <h5>📦 Contact Livraison</h5>
              <p><strong>Nom livraison:</strong> {order.shippingName}</p>
              {order.shippingEmail && order.shippingEmail !== order.email && (
                <p><strong>Email livraison:</strong> {order.shippingEmail}</p>
              )}
              {order.shippingPhone && order.shippingPhone !== order.phoneNumber && (
                <p><strong>Téléphone livraison:</strong> {order.shippingPhone}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 🏠 ADRESSE DE LIVRAISON COMPLÈTE */}
      <div className="shipping-section">
        <h4>🏠 Adresse de Livraison</h4>
        <div className="address-display">
          <p><strong>Nom:</strong> {order.shippingName}</p>
          {order.shippingStreet && (
            <p><strong>Rue:</strong> {order.shippingStreet}</p>
          )}
          <p><strong>Ville:</strong> {order.shippingCity}</p>
          {order.shippingRegion && (
            <p><strong>Région:</strong> {order.shippingRegion}</p>
          )}
          {order.shippingPostalCode && (
            <p><strong>Code Postal:</strong> {order.shippingPostalCode}</p>
          )}
          <p><strong>Pays:</strong> {order.shippingCountry}</p>
          {order.shippingAddressFull && (
            <p><strong>Adresse complète:</strong> {order.shippingAddressFull}</p>
          )}
        </div>
      </div>

      {/* 💳 INFORMATIONS PAIEMENT COMPLÈTES */}
      <div className="payment-section">
        <h4>💳 Paiement</h4>
        <div className="payment-details">
          <div className="payment-row">
            <span><strong>Montant:</strong> {order.totalAmount.toLocaleString()} FCFA</span>
            <span><strong>Méthode:</strong> {order.payment_info.method_text}</span>
          </div>
          <div className="payment-row">
            <span><strong>Statut:</strong>
              <span style={{ color: order.payment_info.status_color, marginLeft: '5px' }}>
                {order.payment_info.status_icon} {order.payment_info.status_text}
              </span>
            </span>
            <span><strong>Tentatives:</strong> {order.paymentAttempts}</span>
          </div>
          {order.transactionId && (
            <div className="payment-row">
              <span><strong>Transaction ID:</strong> {order.transactionId}</span>
            </div>
          )}
          {order.lastPaymentAttemptAt && (
            <div className="payment-row">
              <span><strong>Dernière tentative:</strong> {new Date(order.lastPaymentAttemptAt).toLocaleString('fr-FR')}</span>
            </div>
          )}
          {order.lastPaymentFailureReason && (
            <div className="payment-error">
              <span><strong>Raison échec:</strong> {order.lastPaymentFailureReason}</span>
            </div>
          )}
          {order.hasInsufficientFunds && (
            <div className="payment-warning">
              <span>⚠️ Fonds insuffisants détectés</span>
            </div>
          )}
        </div>
      </div>

      {/* 📝 NOTES CLIENT */}
      {order.notes && (
        <div className="notes-section">
          <h4>📝 Notes & Détails</h4>
          <div className="notes-display">
            <p><strong>Notes originales:</strong></p>
            <pre className="notes-content">{order.notes}</pre>

            {paymentError && (
              <div className="payment-error-details">
                <h5>💳 Détails de l'erreur de paiement:</h5>
                <p><strong>Raison:</strong> {paymentError.reason}</p>
                <p><strong>Catégorie:</strong> {paymentError.category}</p>
                <p><strong>Message:</strong> {paymentError.message}</p>
                <p><strong>Date:</strong> {new Date(paymentError.timestamp).toLocaleString('fr-FR')}</p>
                <p><strong>Tentative #:</strong> {paymentError.attemptNumber}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📦 ARTICLES DE LA COMMANDE */}
      {order.orderItems.length > 0 && (
        <div className="items-section">
          <h4>📦 Articles de la Commande</h4>
          <div className="items-list">
            {order.orderItems.map((item) => (
              <div key={item.id} className="item-card">
                <div className="item-header">
                  <span><strong>{item.product.name}</strong></span>
                  <span>{item.unitPrice.toLocaleString()} FCFA</span>
                </div>
                <div className="item-details">
                  <p><strong>Référence:</strong> {item.product.description}</p>
                  <p><strong>Quantité:</strong> {item.quantity}</p>
                  <p><strong>Total:</strong> {(item.unitPrice * item.quantity).toLocaleString()} FCFA</p>
                  {item.size && <p><strong>Taille:</strong> {item.size}</p>}
                  {item.color && <p><strong>Couleur:</strong> {item.color}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📅 DATES COMPLÈTES */}
      <div className="timestamps-section">
        <h4>📅 Dates importantes</h4>
        <div className="dates-grid">
          <p><strong>Créée le:</strong> {new Date(order.createdAt).toLocaleString('fr-FR')}</p>
          <p><strong>Modifiée le:</strong> {new Date(order.updatedAt).toLocaleString('fr-FR')}</p>
          {order.validatedAt && (
            <p><strong>Validée le:</strong> {new Date(order.validatedAt).toLocaleString('fr-FR')}</p>
          )}
          {order.confirmedAt && (
            <p><strong>Confirmée le:</strong> {new Date(order.confirmedAt).toLocaleString('fr-FR')}</p>
          )}
          {order.shippedAt && (
            <p><strong>Expédiée le:</strong> {new Date(order.shippedAt).toLocaleString('fr-FR')}</p>
          )}
          {order.deliveredAt && (
            <p><strong>Livrée le:</strong> {new Date(order.deliveredAt).toLocaleString('fr-FR')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealOrdersList;
```

---

## 🎨 CSS Complet

```css
/* 📋 Conteneur principal */
.orders-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.orders-container h1 {
  color: #2c3e50;
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 3px solid #3498db;
}

/* 📦 Carte commande */
.order-card {
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  margin-bottom: 25px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.order-title h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.order-id {
  font-size: 12px;
  opacity: 0.8;
  display: block;
  margin-top: 2px;
}

.order-statuses {
  display: flex;
  gap: 10px;
}

.status-badge {
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 📑 Sections */
.customer-section, .shipping-section,
.payment-section, .notes-section,
.items-section, .timestamps-section {
  padding: 20px 25px;
  border-bottom: 1px solid #ecf0f1;
}

.customer-section:last-child,
.shipping-section:last-child,
.payment-section:last-child,
.notes-section:last-child,
.items-section:last-child,
.timestamps-section:last-child {
  border-bottom: none;
}

.customer-section h4,
.shipping-section h4,
.payment-section h4,
.notes-section h4,
.items-section h4,
.timestamps-section h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 👤 Informations client */
.customer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 10px;
}

.info-block {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.info-block h5 {
  margin: 0 0 10px 0;
  color: #3498db;
  font-size: 14px;
  font-weight: 600;
}

.info-block p {
  margin: 6px 0;
  font-size: 13px;
  line-height: 1.4;
  color: #495057;
}

.info-block strong {
  color: #2c3e50;
  min-width: 100px;
  display: inline-block;
}

/* 🏠 Adresse */
.address-display {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

.address-display p {
  margin: 8px 0;
  font-size: 14px;
  color: #1565c0;
}

/* 💳 Paiement */
.payment-details {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #28a745;
}

.payment-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 5px 0;
}

.payment-row strong {
  color: #495057;
}

.payment-error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  border-left: 4px solid #dc3545;
}

.payment-warning {
  background: #fff3cd;
  color: #856404;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  border-left: 4px solid #ffc107;
}

/* 📝 Notes */
.notes-display {
  background: #fff3cd;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.notes-content {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 10px 0;
  color: #495057;
  max-height: 200px;
  overflow-y: auto;
}

.payment-error-details {
  background: #f8d7da;
  padding: 12px;
  border-radius: 6px;
  margin-top: 15px;
  border-left: 4px solid #dc3545;
}

.payment-error-details h5 {
  margin: 0 0 10px 0;
  color: #721c24;
}

.payment-error-details p {
  margin: 5px 0;
  font-size: 13px;
  color: #721c24;
}

/* 📦 Articles */
.items-list {
  display: grid;
  gap: 15px;
}

.item-card {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #6f42c1;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
  color: #2c3e50;
}

.item-details p {
  margin: 5px 0;
  font-size: 13px;
  color: #495057;
}

.item-details strong {
  color: #2c3e50;
}

/* 📅 Dates */
.dates-grid {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #6c757d;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
}

.dates-grid p {
  margin: 5px 0;
  font-size: 13px;
  color: #495057;
}

.dates-grid strong {
  color: #2c3e50;
}

/* 📱 Responsive */
@media (max-width: 768px) {
  .orders-container {
    padding: 10px;
  }

  .order-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .customer-grid {
    grid-template-columns: 1fr;
  }

  .payment-row {
    flex-direction: column;
    gap: 5px;
  }

  .dates-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 🚀 Exemple d'Appel API

```javascript
// Récupérer toutes les commandes pending
const fetchPendingOrders = async () => {
  try {
    const response = await fetch('http://localhost:3004/orders/admin/all?page=1&limit=10&status=PENDING', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'accept': '*/*'
      }
    });

    const data = await response.json();

    if (data.success) {
      console.log('Commandes récupérées:', data.data.orders);
      return data.data.orders;
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};

// Filtrer par statut de paiement
const fetchFailedPayments = async () => {
  const response = await fetch('http://localhost:3004/orders/admin/all?status=FAILED', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'accept': '*/*'
    }
  });

  return await response.json();
};
```

---

## ✅ CHECKLIST - Ce que vous avez MAINTENANT

### **📞 INFORMATIONS CONTACT**
- ✅ `phoneNumber` - Téléphone principal
- ✅ `email` - Email principal
- ✅ `shippingName` - Nom de livraison
- ✅ `customer_info.full_name` - Nom complet
- ✅ `customer_info.shipping_phone` - Téléphone livraison
- ✅ `customer_info.shipping_email` - Email livraison

### **🏠 ADRESSE COMPLÈTE**
- ✅ `shippingStreet` - Rue
- ✅ `shippingCity` - Ville
- ✅ `shippingRegion` - Région
- ✅ `shippingPostalCode` - Code postal
- ✅ `shippingCountry` - Pays
- ✅ `shippingAddressFull` - Adresse formatée

### **💳 INFORMATIONS PAIEMENT**
- ✅ `paymentMethod` - Méthode
- ✅ `paymentStatus` - Statut
- ✅ `transactionId` - Transaction ID
- ✅ `lastPaymentAttemptAt` - Dernière tentative
- ✅ `lastPaymentFailureReason` - Raison échec
- ✅ `hasInsufficientFunds` - Fonds insuffisants
- ✅ `paymentAttempts` - Nombre tentatives

### **👤 UTILISATEUR**
- ✅ `user.firstName`, `user.lastName` - Nom complet
- ✅ `user.email`, `user.phone` - Contact
- ✅ `user.role` - Rôle
- ✅ `user.vendeur_type` - Type vendeur
- ✅ `user.shop_name` - Nom boutique

### **🎨 STATUTS VISUELS**
- ✅ `payment_info.status_text` - "Échoué", "Payé", etc.
- ✅ `payment_info.status_icon` - "❌", "✅", etc.
- ✅ `payment_info.status_color` - Code couleur

### **📝 NOTES & DÉTAILS**
- ✅ `notes` - Notes complètes (avec erreurs paiement)
- ✅ Dates de création, modification, validation, etc.

**TOUTES les informations sont disponibles dans l'API !** 🎉

---

*Guide basé sur la réponse RÉELLE de l'API - 6 Novembre 2024*