# 📋 API Documentation - Système de Paiement Printalma

## 🎯 Vue d'ensemble

Cette documentation décrit l'API de gestion des commandes et paiements pour le frontend Printalma.

---

## 🚀 Endpoints Principaux

### 1. Création de Commande avec Paiement

#### ▶️ Pour Utilisateurs Authentifiés
```http
POST /orders
Authorization: Bearer <token_jwt>
```

#### ▶️ Pour Invités (sans authentification)
```http
POST /orders/guest
```

---

## 📝 Format de Requête

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // Seulement pour utilisateurs authentifiés
}
```

### Body (CreateOrderDto)
```json
{
  "shippingDetails": {
    "name": "Client Test",
    "street": "123 Rue Test",
    "city": "Dakar",
    "country": "Sénégal",
    "postalCode": "10000",
    "additionalInfo": "Face au marché, à côté du pharmacie"
  },
  "phoneNumber": "+221771234567",
  "email": "client@test.com",
  "notes": "Instructions spéciales pour la livraison",
  "orderItems": [
    {
      "productId": 1,
      "vendorProductId": 123,
      "quantity": 2,
      "size": "L",
      "color": "Noir",
      "colorId": 5,
      "unitPrice": 5000
    }
  ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true,
  "totalAmount": 10000
}
```

---

## 📋 Réponse API

### ✅ Réponse Succès (Status: 201)
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 123,
    "orderNumber": "CMD-2024-001",
    "totalAmount": 10000,
    "subTotal": 9500,
    "taxAmount": 500,
    "shippingFee": 500,
    "finalAmount": 10500,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "paymentMethod": "PAYDUNYA",
    "transactionId": "paydunya_token_xyz123",
    "hasInsufficientFunds": false,
    "paymentAttempts": 0,
    "lastPaymentAttemptAt": null,

    // 📦 Informations de livraison
    "shippingName": "Client Test",
    "shippingStreet": "123 Rue Test",
    "shippingCity": "Dakar",
    "shippingCountry": "Sénégal",
    "shippingAddressFull": "123 Rue Test, Dakar, Sénégal",

    // 👤 Informations client
    "phoneNumber": "+221771234567",
    "email": "client@test.com",
    "notes": "Instructions spéciales pour la livraison",

    // 📅 Dates
    "createdAt": "2025-11-08T23:42:00.000Z",
    "updatedAt": "2025-11-08T23:42:00.000Z",
    "estimatedDelivery": "2025-11-11T14:00:00Z",

    // 💳 Informations paiement enrichies
    "payment_info": {
      "status": "PENDING",
      "status_text": "En attente",
      "status_icon": "⏳",
      "status_color": "#FFC107",
      "method": "PAYDUNYA",
      "method_text": "PayDunya",
      "transaction_id": "paydunya_token_xyz123",
      "payment_url": "https://app.paydunya.com/sandbox-api/v1/pay/xyz123",
      "attempts_count": 0,
      "last_attempt_at": null
    },

    // 🛍️ Articles de commande
    "order_items": [
      {
        "id": 456,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 5000,
        "totalPrice": 10000,
        "size": "L",
        "color": "Noir",
        "colorId": 5,
        "vendorProductId": 123,
        "product": {
          "id": 1,
          "name": "T-shirt personnalisé",
          "reference": "TS-001",
          "description": "T-shirt de qualité supérieure",
          "orderedColorName": "Noir",
          "orderedColorHexCode": "#000000",
          "orderedColorImageUrl": null
        },
        "vendorProduct": {
          "id": 123,
          "name": "T-shirt Noir - Edition Limitée",
          "reference": "TS-001-BLK",
          "price": 5000
        }
      }
    ]
  }
}
```

---

## 💳 Méthodes de Paiement Disponibles

### 1. PayDunya (Recommandé)
```json
"paymentMethod": "PAYDUNYA"
"initiatePayment": true  // Génère automatiquement l'URL de paiement
```

**Réponse PayDunya :**
```json
{
  "payment_info": {
    "status": "PENDING",
    "payment_url": "https://app.paydunya.com/sandbox-api/v1/pay/xyz123",
    "transaction_id": "paydunya_token_xyz123"
  }
}
```

### 2. PayTech (En dépréciation)
```json
"paymentMethod": "PAYTECH"
"initiatePayment": true
```

### 3. Paiement à la Livraison
```json
"paymentMethod": "CASH_ON_DELIVERY"
"initiatePayment": false  // Pas de génération de paiement automatique
```

---

## 🔄 Workflow de Paiement

### 1. Création Initiale
```mermaid
graph TD
    A[Frontend envoie commande] --> B[Backend crée commande PENDING]
    B --> C{initiatePayment: true?}
    C -->|Oui| D[Générer paiement provider]
    C -->|Non| E[Commande en attente]
    D --> F[Retourner URL paiement]
```

### 2. Processus de Paiement
```mermaid
graph TD
    A[Utilisateur clique Payer] --> B[Redirection vers provider]
    B --> C[Provider traite paiement]
    C --> D{Paiement réussi?}
    D -->|Oui| E[Webhook reçu]
    D -->|Non| F[Page d'échec]
    E --> G[Mise à jour statut PAID]
```

---

## 🔗 Endpoints Complémentaires

### 📊 Statuts de Paiement

#### Obtenir l'historique des tentatives
```http
GET /orders/:orderNumber/payment-attempts
```

#### Relancer un paiement échoué
```http
POST /orders/:orderNumber/retry-payment
Content-Type: application/json

{
  "paymentMethod": "PAYDUNYA"  // Optionnel, utilise la méthode par défaut
}
```

#### Obtenir les commandes d'un utilisateur
```http
GET /orders/my-orders
Authorization: Bearer <token_jwt>
```

#### Obtenir une commande spécifique
```http
GET /orders/:id
Authorization: Bearer <token_jwt>
```

---

## 🎨 Exemples d'Intégration Frontend

### React/JavaScript
```javascript
// 📦 Création de commande avec paiement
const createOrderWithPayment = async (orderData) => {
  try {
    const response = await fetch('http://localhost:3004/orders/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        paymentMethod: 'PAYDUNYA',
        initiatePayment: true
      })
    });

    const result = await response.json();

    if (result.success) {
      const { data } = result;

      // 🔗 Redirection vers le paiement
      if (data.payment_info.payment_url) {
        window.location.href = data.payment_info.payment_url;
      }

      // 📊 Mise à jour du statut en temps réel
      pollOrderStatus(data.orderNumber);

      return data;
    }
  } catch (error) {
    console.error('Erreur de commande:', error);
    throw error;
  }
};

// 📡 Polling du statut de commande
const pollOrderStatus = (orderNumber) => {
  const interval = setInterval(async () => {
    try {
      const response = await fetch(`http://localhost:3004/orders/${orderNumber}/payment-attempts`);
      const { data } = await response.json();

      if (data.payment_info.status === 'PAID') {
        clearInterval(interval);
        // 🎉 Paiement réussi !
        handlePaymentSuccess(data);
      } else if (data.payment_info.status === 'FAILED') {
        clearInterval(interval);
        // ❌ Paiement échoué
        handlePaymentFailure(data);
      }
    } catch (error) {
      console.error('Erreur de polling:', error);
    }
  }, 5000); // Vérifier toutes les 5 secondes
};
```

### Vue.js
```vue
<template>
  <div class="order-form">
    <form @submit.prevent="submitOrder">
      <!-- Formulaire de commande -->
      <div class="payment-methods">
        <label>
          <input
            type="radio"
            v-model="orderData.paymentMethod"
            value="PAYDUNYA"
          >
          PayDunya (Carte/Orange Money)
        </label>

        <label>
          <input
            type="radio"
            v-model="orderData.paymentMethod"
            value="CASH_ON_DELIVERY"
          >
          Paiement à la livraison
        </label>
      </div>

      <button
        type="submit"
        :disabled="isLoading"
        class="btn-primary"
      >
        {{ isLoading ? 'Traitement...' : 'Confirmer la commande' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isLoading: false,
      orderData: {
        shippingDetails: {
          name: '',
          street: '',
          city: '',
          country: ''
        },
        phoneNumber: '',
        email: '',
        orderItems: [],
        paymentMethod: 'PAYDUNYA'
      }
    };
  },

  methods: {
    async submitOrder() {
      this.isLoading = true;

      try {
        const result = await this.$store.dispatch('orders/createOrder', {
          ...this.orderData,
          initiatePayment: this.orderData.paymentMethod !== 'CASH_ON_DELIVERY'
        });

        // Redirection automatique vers le paiement
        if (result.payment_info?.payment_url) {
          window.location.href = result.payment_info.payment_url;
        } else {
          // Paiement à la livraison
          this.$router.push(`/orders/${result.orderNumber}/confirmation`);
        }
      } catch (error) {
        this.$toast.error(error.message);
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>
```

---

## 📋 Types TypeScript

```typescript
// 📦 Interfaces TypeScript
interface ShippingDetailsDto {
  name: string;
  street: string;
  city: string;
  country: string;
  postalCode?: string;
  additionalInfo?: string;
}

interface OrderItemDto {
  productId: number;
  vendorProductId?: number;
  quantity: number;
  size?: string;
  color?: string;
  colorId?: number;
  unitPrice?: number;
}

interface CreateOrderDto {
  shippingDetails: ShippingDetailsDto;
  phoneNumber: string;
  email?: string;
  notes?: string;
  orderItems: OrderItemDto[];
  paymentMethod?: PaymentMethod;
  initiatePayment?: boolean;
  totalAmount?: number;
}

interface PaymentInfo {
  status: string;
  status_text: string;
  status_icon: string;
  status_color: string;
  method: string;
  method_text: string;
  transaction_id: string;
  payment_url?: string;
  attempts_count: number;
  last_attempt_at?: string;
}

interface OrderResponse {
  id: number;
  orderNumber: string;
  totalAmount: number;
  subTotal?: number;
  taxAmount?: number;
  shippingFee?: number;
  finalAmount?: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionId?: string;
  hasInsufficientFunds: boolean;
  paymentAttempts: number;
  lastPaymentAttemptAt?: string;
  shippingName: string;
  shippingStreet: string;
  shippingCity: string;
  shippingCountry: string;
  shippingAddressFull?: string;
  phoneNumber: string;
  email?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  payment_info?: PaymentInfo;
  order_items: OrderItemResponse[];
}

enum PaymentMethod {
  PAYDUNYA = 'PAYDUNYA';
  PAYTECH = 'PAYTECH';
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY';
  OTHER = 'OTHER';
}
```

---

## ⚠️ Gestion des Erreurs

### Erreurs Courantes
```json
{
  "success": false,
  "message": "Validation failed",
  "error": [
    "phoneNumber must be a valid phone number",
    "orderItems should not be empty"
  ]
}
```

### Gestion des Échecs de Paiement
```json
{
  "success": false,
  "message": "Payment processing failed",
  "data": {
    "status": "FAILED",
    "payment_info": {
      "status": "FAILED",
      "status_text": "Échec",
      "status_icon": "❌",
      "status_color": "#DC3545",
      "failure_reason": "insufficient_funds",
      "retry_available": true,
      "next_retry_at": "2025-11-09T01:00:00.000Z"
    }
  }
}
```

---

## 🔧 Configuration Environnement

### Variables d'Environnement Requises
```env
# 🌐 URLs de l'API
API_BASE_URL=http://localhost:3004

# 🔐 Clés PayDunya
PAYDUNYA_MASTER_KEY=your_master_key
PAYDUNYA_PRIVATE_KEY=your_private_key
PAYDUNYA_TOKEN=your_token
PAYDUNYA_MODE=sandbox  # sandbox | production

# 📱 URLs de callback
PAYDUNYA_SUCCESS_URL=http://localhost:3000/payment/success
PAYDUNYA_CANCEL_URL=http://localhost:3000/payment/cancel
PAYDUNYA_NOTIFY_URL=http://localhost:3004/paydunya/webhook
```

---

## 📱 Support WebSocket

### Écoute des mises à jour en temps réel
```javascript
const socket = new WebSocket('ws://localhost:3004');

// 📡 Écoute des mises à jour de commande
socket.on('order_update', (data) => {
  if (data.orderNumber === currentOrderNumber) {
    updateOrderStatus(data);
  }
});

// 📊 Statistiques de paiement
socket.emit('get_payment_stats');
```

---

## 🎯 Bonnes Pratiques

### ✅ Pour le Frontend
1. **Valider les données** avant envoi
2. **Gérer les états de chargement** pendant le traitement
3. **Utiliser le polling** pour suivre le statut de paiement
4. **Afficher des messages clairs** pour chaque statut
5. **Gérer les erreurs gracieusement**

### ⚡ Performance
1. **Mettre en cache** les données utilisateur
2. **Utiliser des requêtes optimisées**
3. **Éviter les pollings excessifs** (max 1 par 5 secondes)
4. **Nettoyer les listeners** WebSocket à la déconnexion

### 🔒 Sécurité
1. **Ne jamais exposer** les clés API dans le frontend
2. **Valider les réponses** serveur
3. **Utiliser HTTPS** en production
4. **Gérer les timeouts** de requêtes

---

## 📞 Support

Pour toute question ou problème technique, contactez l'équipe de développement Printalma.

**Dernière mise à jour :** 8 Novembre 2025
**Version API :** v1.0.0