# 📡 Guide API : Endpoints & Réponses - Statuts Paiement Admin

---

## 🎯 GET /orders - Liste des commandes

### **Requête :**
```http
GET /orders?page=1&limit=10&paymentStatus=all
Authorization: Bearer {token}
```

### **Réponse :**
```json
{
  "success": 1,
  "message": "Orders retrieved successfully",
  "data": {
    "orders": [
      {
        "id": 1,
        "orderNumber": "CMD-2024-001",
        "totalAmount": 15000,
        "status": "CONFIRMED",
        "paymentStatus": "PAID",
        "paymentMethod": "PAYDUNYA",
        "transactionId": "test_token_123",
        "createdAt": "2024-01-15T10:30:00Z",
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
          "email": "client@email.com",
          "phoneNumber": "+221771234567"
        }
      },
      {
        "id": 2,
        "orderNumber": "CMD-2024-002",
        "totalAmount": 25000,
        "status": "PENDING",
        "paymentStatus": "PENDING",
        "paymentMethod": "PAYDUNYA",
        "transactionId": "pending_token_456",
        "createdAt": "2024-01-15T11:20:00Z",
        "payment_info": {
          "status": "PENDING",
          "status_text": "En attente de paiement",
          "status_icon": "⏳",
          "status_color": "#FFA500",
          "method": "PAYDUNYA",
          "method_text": "PayDunya",
          "transaction_id": "pending_token_456",
          "attempts_count": 1,
          "last_attempt_at": "2024-01-15T11:25:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

## 🔍 GET /orders/{orderNumber} - Détails commande

### **Requête :**
```http
GET /orders/CMD-2024-001
Authorization: Bearer {token}
```

### **Réponse :**
```json
{
  "success": 1,
  "message": "Commande récupérée avec succès",
  "data": {
    "order_info": {
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
      "createdAt": "2024-01-15T10:30:00Z",
      "estimatedDelivery": "2024-01-18T14:00:00Z"
    },
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
    "order_items": [
      {
        "id": 1,
        "product": {
          "id": 101,
          "name": "T-shirt personnalisé",
          "reference": "TS-001"
        },
        "quantity": 2,
        "unitPrice": 7000,
        "totalPrice": 14000,
        "size": "L",
        "color": "Noir"
      }
    ],
    "shipping_info": {
      "name": "Client Name",
      "address": "123 Rue, Dakar, Sénégal",
      "phone": "+221771234567"
    },
    "status_history": [
      {
        "id": 1,
        "status": "CONFIRMED",
        "payment_status": "PAID",
        "timestamp": "2024-01-15T10:35:00Z",
        "updated_by": "paydunya_ipn",
        "comment": "Paiement validé automatiquement"
      }
    ]
  }
}
```

---

## 📊 GET /orders/payment-stats - Statistiques paiements

### **Requête :**
```http
GET /orders/payment-stats
Authorization: Bearer {token}
```

### **Réponse :**
```json
{
  "success": 1,
  "message": "Payment statistics retrieved successfully",
  "data": {
    "total_orders": 150,
    "pending_payments": 12,
    "paid_orders": 130,
    "failed_payments": 5,
    "cancelled_orders": 3,
    "total_revenue": 2500000,
    "revenue_today": 150000,
    "pending_amount": 180000,
    "success_rate": 86.7,
    "by_method": {
      "PAYDUNYA": {
        "total": 100,
        "paid": 85,
        "pending": 10,
        "failed": 3,
        "cancelled": 2
      },
      "PAYTECH": {
        "total": 30,
        "paid": 25,
        "pending": 2,
        "failed": 2,
        "cancelled": 1
      },
      "CASH_ON_DELIVERY": {
        "total": 20,
        "paid": 20,
        "pending": 0,
        "failed": 0,
        "cancelled": 0
      }
    },
    "last_24h": {
      "total_orders": 8,
      "paid_orders": 6,
      "revenue": 95000
    }
  }
}
```

---

## 🔧 GET /orders?paymentStatus={status} - Filtrage

### **Requêtes :**
```http
GET /orders?paymentStatus=PENDING
GET /orders?paymentStatus=PAID
GET /orders?paymentStatus=FAILED
GET /orders?paymentStatus=CANCELLED
GET /orders?paymentMethod=PAYDUNYA
GET /orders?startDate=2024-01-01&endDate=2024-01-31
GET /orders?search=CMD-2024-001
```

### **Réponse :**
```json
{
  "success": 1,
  "message": "Orders filtered successfully",
  "data": {
    "orders": [
      {
        "id": 2,
        "orderNumber": "CMD-2024-002",
        "totalAmount": 25000,
        "status": "PENDING",
        "paymentStatus": "PENDING",
        "paymentMethod": "PAYDUNYA",
        "payment_info": {
          "status": "PENDING",
          "status_text": "En attente de paiement",
          "status_icon": "⏳",
          "status_color": "#FFA500",
          "method_text": "PayDunya"
        }
      }
    ],
    "filters": {
      "paymentStatus": "PENDING",
      "paymentMethod": "PAYDUNYA"
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 12,
      "totalPages": 2
    }
  }
}
```

---

## 📋 GET /admin/dashboard - Tableau de bord admin

### **Requête :**
```http
GET /admin/dashboard
Authorization: Bearer {token}
```

### **Réponse :**
```json
{
  "success": 1,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "stats": {
      "total_orders": 150,
      "pending_payments": 12,
      "paid_orders": 130,
      "failed_payments": 5,
      "cancelled_orders": 3,
      "total_revenue": 2500000,
      "today_orders": 8,
      "today_revenue": 95000,
      "success_rate": 86.7
    },
    "recent_orders": [
      {
        "id": 1,
        "orderNumber": "CMD-2024-001",
        "totalAmount": 15000,
        "customer_email": "client@email.com",
        "payment_info": {
          "status_text": "Payé",
          "status_icon": "✅",
          "status_color": "#28A745",
          "method_text": "PayDunya",
          "transaction_id": "test_token_123"
        },
        "created_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": 2,
        "orderNumber": "CMD-2024-002",
        "totalAmount": 25000,
        "customer_email": "client2@email.com",
        "payment_info": {
          "status_text": "En attente de paiement",
          "status_icon": "⏳",
          "status_color": "#FFA500",
          "method_text": "PayDunya",
          "transaction_id": "pending_token_456"
        },
        "created_at": "2024-01-15T11:20:00Z"
      }
    ],
    "payment_methods_stats": [
      {
        "method": "PAYDUNYA",
        "method_text": "PayDunya",
        "total_orders": 100,
        "paid_orders": 85,
        "success_rate": 85.0
      },
      {
        "method": "PAYTECH",
        "method_text": "PayTech",
        "total_orders": 30,
        "paid_orders": 25,
        "success_rate": 83.3
      }
    ]
  }
}
```

---

## 💰 GET /payment-attempts/{attemptId} - Détails tentative

### **Requête :**
```http
GET /payment-attempts/123
Authorization: Bearer {token}
```

### **Réponse :**
```json
{
  "success": true,
  "message": "Payment attempt details retrieved",
  "data": {
    "id": 123,
    "orderId": 1,
    "orderNumber": "CMD-2024-001",
    "paymentMethod": "paydunya",
    "paytechToken": "test_token_123",
    "amount": 15000,
    "status": "completed",
    "attemptedAt": "2024-01-15T10:35:00Z",
    "errorMessage": null,
    "errorCode": null,
    "metadata": {
      "response_code": "00",
      "response_message": "SUCCESS",
      "transaction_id": "txn_123456",
      "custom_data": {
        "order_id": 1,
        "customer_name": "Client Name"
      }
    },
    "order": {
      "id": 1,
      "order_number": "CMD-2024-001",
      "total_amount": 15000,
      "status": "CONFIRMED",
      "payment_status": "PAID",
      "customer": {
        "id": 101,
        "firstName": "Client",
        "lastName": "Name",
        "email": "client@email.com",
        "phone": "+221771234567"
      }
    }
  }
}
```

---

## ⚠️ Gestion des Erreurs

### **Réponses d'erreur :**
```json
{
  "success": 0,
  "message": "Order not found",
  "error": "ORDER_NOT_FOUND",
  "data": null
}
```

```json
{
  "success": 0,
  "message": "Unauthorized access",
  "error": "UNAUTHORIZED",
  "data": null
}
```

```json
{
  "success": 0,
  "message": "Validation error",
  "error": "VALIDATION_ERROR",
  "data": {
    "details": [
      {
        "field": "orderNumber",
        "message": "Invalid order number format"
      }
    ]
  }
}
```

---

## 🎨 Codes des Statuts de Paiement

| Status | Texte | Icône | Couleur |
|--------|-------|-------|---------|
| `PENDING` | En attente de paiement | ⏳ | #FFA500 |
| `PAID` | Payé | ✅ | #28A745 |
| `FAILED` | Échoué | ❌ | #DC3545 |
| `CANCELLED` | Annulé | 🚫 | #6C757D |
| `REFUNDED` | Remboursé | 💰 | #17A2B8 |
| `PROCESSING` | En traitement | 🔄 | #007BFF |

---

## 🏷️ Codes des Méthodes de Paiement

| Méthode | Texte Affiché |
|---------|---------------|
| `PAYDUNYA` | PayDunya |
| `PAYTECH` | PayTech |
| `CASH_ON_DELIVERY` | Paiement à la livraison |
| `WAVE` | Wave |
| `ORANGE_MONEY` | Orange Money |
| `FREE_MONEY` | Free Money |
| `CARD` | Carte bancaire |
| `OTHER` | Autre |

---

## 🚀 URL Base et Headers

### **URLs :**
- **Développement** : `http://localhost:3004/api`
- **Production** : `https://votre-domaine.com/api`

### **Headers requis :**
```http
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

---

## 📞 Support

Pour toute question sur ces endpoints :
- **Swagger** : `http://localhost:3004/api`
- **Documentation complète** : Voir autres fichiers `.md`
- **Contact backend** : Utiliser le système de tickets

---

*Guide mis à jour le 6 Novembre 2024*