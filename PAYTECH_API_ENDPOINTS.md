# 📡 PayTech - Référence Complète des Endpoints API

> Basé exclusivement sur la documentation officielle PayTech
> - https://doc.intech.sn/doc_paytech.php
> - https://doc.intech.sn/PayTech%20x%20DOC.postman_collection.json

---

## 🔐 Endpoints Publics (Sans Authentification)

### 1. Initialiser un paiement

```http
POST /paytech/payment
Content-Type: application/json
```

**Corps de la requête:**
```json
{
  "item_name": "Order ORD-123",
  "item_price": 25000,
  "ref_command": "ORD-123",
  "command_name": "Printalma Order",
  "currency": "XOF",
  "env": "test",
  "ipn_url": "https://yourapi.com/paytech/ipn-callback",
  "success_url": "https://yoursite.com/payment/success",
  "cancel_url": "https://yoursite.com/payment/cancel"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "token": "payment_token_xxx",
    "redirect_url": "https://paytech.sn/payment/checkout/xxx",
    "ref_command": "ORD-123"
  }
}
```

---

### 2. Webhook IPN (Standard) ⭐ AMÉLIORÉ

```http
POST /paytech/ipn-callback
Content-Type: application/json
```

**⚠️ Cet endpoint est appelé automatiquement par PayTech**

**Corps de la requête (envoyé par PayTech):**
```json
{
  "type_event": "sale_canceled",
  "success": 0,
  "ref_command": "ORD-123",
  "item_price": 25000,
  "currency": "XOF",
  "payment_method": "Orange Money",
  "transaction_id": "TXN123",
  "cancel_reason": "insufficient_funds",
  "error_code": "INS_001",
  "error_message": "Fonds insuffisants",
  "hmac_compute": "calculated_hmac",
  "api_key_sha256": "hash",
  "api_secret_sha256": "hash"
}
```

**🆕 Ce qui se passe automatiquement:**
- ✅ Vérifie HMAC signature
- ✅ Crée PaymentAttempt dans la base
- ✅ Met à jour Order.paymentAttempts
- ✅ Détecte et flag fonds insuffisants
- ✅ Retourne retry_url si applicable

**Réponse:**
```json
{
  "success": true,
  "message": "IPN processed successfully",
  "data": {
    "ref_command": "ORD-123",
    "payment_status": "failed",
    "verified": true,
    "payment_attempt_id": 1,
    "attempt_number": 1,
    "insufficient_funds_detected": true,
    "retry_url": "https://yoursite.com/orders/ORD-123/retry-payment",
    "failure_details": {
      "category": "insufficient_funds",
      "reason": "insufficient_funds",
      "code": "INS_001",
      "user_message": "❌ Fonds insuffisants. Veuillez vérifier votre solde...",
      "support_message": "Catégorie: insufficient_funds | Message: Fonds insuffisants..."
    }
  }
}
```

---

### 3. Webhook IPN Spécialisé Fonds Insuffisants

```http
POST /paytech/ipn-insufficient-funds
Content-Type: application/json
```

**Usage:** Endpoint dédié pour les cas de fonds insuffisants avec fonctionnalités supplémentaires

**Réponse enrichie:**
```json
{
  "success": true,
  "message": "Insufficient funds webhook processed successfully",
  "data": {
    "order_id": 123,
    "order_number": "ORD-123",
    "payment_status": "FAILED",
    "failure_category": "insufficient_funds",
    "customer_notification": {
      "customerEmail": "client@example.com",
      "customerPhone": "+221771234567",
      "message": "❌ Fonds insuffisants...",
      "retryPaymentUrl": "https://yoursite.com/orders/ORD-123/retry-payment"
    },
    "actions": {
      "retry_payment": {
        "available": true,
        "url": "...",
        "method": "POST"
      },
      "alternative_payment": {
        "available": true,
        "methods": ["cash_on_delivery", "bank_transfer"]
      }
    },
    "next_steps": [
      "Send SMS/Email notification to customer",
      "Customer can retry payment via retry URL"
    ]
  }
}
```

---

### 4. Vérifier le statut d'un paiement

```http
GET /paytech/status/:token
```

**Exemple:**
```bash
GET /paytech/status/payment_token_xxx
```

**Réponse:**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "status": "pending",
    "ref_command": "ORD-123",
    "amount": 25000
  }
}
```

---

### 5. Réessayer un paiement 🆕

```http
POST /orders/:orderNumber/retry-payment
Content-Type: application/json
```

**Corps de la requête (optionnel):**
```json
{
  "paymentMethod": "Wave"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Payment retry initialized successfully",
  "data": {
    "order_id": 123,
    "order_number": "ORD-123",
    "amount": 25000,
    "currency": "XOF",
    "payment": {
      "token": "new_token_xxx",
      "redirect_url": "https://paytech.sn/payment/checkout/new_token",
      "is_retry": true
    }
  }
}
```

---

### 6. Historique des tentatives de paiement 🆕

```http
GET /orders/:orderNumber/payment-attempts
```

**Exemple:**
```bash
GET /orders/ORD-123/payment-attempts
```

**Réponse:**
```json
{
  "success": true,
  "message": "Payment attempts retrieved successfully",
  "data": {
    "order_id": 123,
    "order_number": "ORD-123",
    "total_amount": 25000,
    "payment_status": "FAILED",
    "total_attempts": 3,
    "has_insufficient_funds": true,
    "last_payment_attempt": "2025-10-30T14:30:00Z",
    "last_failure_reason": "insufficient_funds",
    "customer": {
      "id": 5,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com"
    },
    "attempts": [
      {
        "id": 3,
        "attempt_number": 3,
        "status": "FAILED",
        "amount": 25000,
        "currency": "XOF",
        "payment_method": "Orange Money",
        "is_retry": true,
        "failure": {
          "category": "insufficient_funds",
          "reason": "insufficient_funds",
          "code": "INS_001",
          "message": "Fonds insuffisants dans le compte"
        },
        "attempted_at": "2025-10-30T14:30:00Z",
        "failed_at": "2025-10-30T14:30:15Z",
        "paytech_token": "token_retry2"
      },
      {
        "id": 2,
        "attempt_number": 2,
        "status": "FAILED",
        "is_retry": true
      },
      {
        "id": 1,
        "attempt_number": 1,
        "status": "FAILED",
        "is_retry": false
      }
    ]
  }
}
```

---

### 7. Configuration PayTech (Debug)

```http
GET /paytech/test-config
```

**Réponse:**
```json
{
  "success": true,
  "message": "PayTech service is configured and ready",
  "data": {
    "baseUrl": "https://paytech.sn/api",
    "hasApiKey": true,
    "hasApiSecret": true,
    "apiKeyLength": 32,
    "apiSecretLength": 64,
    "environment": "test",
    "ipnUrl": "https://yourapi.com/paytech/ipn-callback"
  }
}
```

---

### 8. Diagnostique API PayTech

```http
GET /paytech/diagnose
```

**Réponse:**
```json
{
  "success": true,
  "message": "PayTech API is reachable and responding",
  "data": {
    "token": "test_token...",
    "hasRedirectUrl": true
  }
}
```

---

### 9. Vérification Webhook (Test)

```http
POST /paytech/webhook-verify
Content-Type: application/json
```

**Usage:** Tester le traitement des webhooks sans affecter les vraies commandes

**Corps:**
```json
{
  "type_event": "sale_canceled",
  "ref_command": "TEST-ORDER",
  "item_price": 1000,
  "cancel_reason": "insufficient_funds",
  "hmac_compute": "your_hmac"
}
```

**Réponse détaillée:**
```json
{
  "success": true,
  "message": "Webhook verification completed",
  "data": {
    "verification_results": {
      "signature_valid": true,
      "payment_success": false,
      "order_lookup_status": "✅ Order found"
    },
    "hmac_calculation": {
      "expected_hmac": "xxx",
      "received_hmac": "xxx",
      "matches": true
    },
    "failure_analysis": {
      "category": "insufficient_funds",
      "reason": "insufficient_funds"
    },
    "recommendations": [
      "✅ Webhook processing looks good!"
    ]
  }
}
```

---

## 🔐 Endpoints Admin (Authentification Requise)

**Headers requis:**
```http
Authorization: Bearer <your_jwt_token>
```

**Roles autorisés:** ADMIN, SUPERADMIN

---

### 1. Remboursement de paiement

```http
POST /paytech/refund
Authorization: Bearer <token>
Content-Type: application/json
```

**Corps:**
```json
{
  "ref_command": "ORD-123"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "ref_command": "ORD-123",
    "status": "refunded"
  }
}
```

---

### 2. Analytics Fonds Insuffisants 🆕

```http
GET /orders/admin/insufficient-funds?page=1&limit=10
Authorization: Bearer <token>
```

**Paramètres query:**
- `page` (défaut: 1)
- `limit` (défaut: 10, max: 100)

**Réponse:**
```json
{
  "success": true,
  "message": "Commandes avec fonds insuffisants récupérées",
  "data": {
    "orders": [
      {
        "id": 123,
        "orderNumber": "ORD-123",
        "totalAmount": 25000,
        "status": "PENDING",
        "paymentStatus": "FAILED",
        "payment_attempts_count": 3,
        "last_payment_attempt": "2025-10-30T14:30:00Z",
        "last_failure_reason": "insufficient_funds",
        "recent_attempts": [
          {
            "id": 3,
            "attempt_number": 3,
            "status": "FAILED",
            "failureCategory": "insufficient_funds"
          }
        ]
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### 3. Détails d'une tentative de paiement 🆕

```http
GET /orders/admin/payment-attempt/:attemptId
Authorization: Bearer <token>
```

**Exemple:**
```bash
GET /orders/admin/payment-attempt/1
```

**Réponse:**
```json
{
  "success": true,
  "message": "Payment attempt details retrieved",
  "data": {
    "id": 1,
    "orderId": 123,
    "orderNumber": "ORD-123",
    "amount": 25000,
    "currency": "XOF",
    "status": "FAILED",
    "failureCategory": "insufficient_funds",
    "failureReason": "insufficient_funds",
    "failureCode": "INS_001",
    "failureMessage": "Fonds insuffisants dans le compte",
    "attemptNumber": 1,
    "isRetry": false,
    "ipnData": {
      "type_event": "sale_canceled",
      "ref_command": "ORD-123",
      "cancel_reason": "insufficient_funds"
    },
    "order": {
      "id": 123,
      "order_number": "ORD-123",
      "total_amount": 25000,
      "status": "PENDING",
      "payment_status": "FAILED",
      "customer": {
        "id": 5,
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com",
        "phone": "+221771234567"
      }
    }
  }
}
```

---

### 4. Toutes les commandes (Admin)

```http
GET /orders/admin/all?page=1&limit=10&status=PENDING
Authorization: Bearer <token>
```

**Paramètres query:**
- `page` - Numéro de page (défaut: 1)
- `limit` - Résultats par page (défaut: 10, max: 100)
- `status` - Filtrer par statut (optionnel)

---

### 5. Statistiques commandes (Admin)

```http
GET /orders/admin/statistics
Authorization: Bearer <token>
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 1000,
    "pendingOrders": 50,
    "confirmedOrders": 800,
    "shippedOrders": 100,
    "cancelledOrders": 50,
    "totalRevenue": 25000000
  }
}
```

---

## 🎯 Cas d'Usage Complets

### Cas 1: Flux de paiement normal avec retry

```bash
# 1. Créer commande et initialiser paiement
POST /paytech/payment
{
  "item_name": "Order ORD-123",
  "item_price": 25000,
  "ref_command": "ORD-123",
  "command_name": "Printalma Order"
}

# 2. Client redirigé vers PayTech
# → https://paytech.sn/payment/checkout/token_xxx

# 3. Paiement échoue (fonds insuffisants)
# → PayTech envoie webhook à /paytech/ipn-callback

# 4. Vérifier l'historique
GET /orders/ORD-123/payment-attempts
# → has_insufficient_funds: true

# 5. Client reçoit notification et clique sur retry
POST /orders/ORD-123/retry-payment
# → Nouveau token généré

# 6. Paiement réussit
# → PayTech envoie webhook SUCCESS
# → has_insufficient_funds reset automatiquement
```

---

### Cas 2: Support client - Investigation

```bash
# 1. Admin consulte les commandes à problème
GET /orders/admin/insufficient-funds
Authorization: Bearer <admin_token>

# 2. Admin voit commande ORD-123 avec 3 tentatives

# 3. Admin examine les détails de chaque tentative
GET /orders/admin/payment-attempt/1
GET /orders/admin/payment-attempt/2
GET /orders/admin/payment-attempt/3

# 4. Admin voit les données IPN complètes pour debugging

# 5. Si nécessaire, admin initie remboursement
POST /paytech/refund
{
  "ref_command": "ORD-123"
}
```

---

## 🔒 Sécurité

### Calcul HMAC (Recommandé par PayTech)

**Message:**
```
amount|ref_command|api_key
Exemple: 25000|ORD-123|votre_api_key
```

**HMAC:**
```bash
echo -n "25000|ORD-123|votre_api_key" | \
  openssl dgst -sha256 -hmac "votre_api_secret"
```

**En Node.js:**
```javascript
const crypto = require('crypto');

const message = `${amount}|${ref_command}|${api_key}`;
const hmac = crypto
  .createHmac('sha256', api_secret)
  .update(message)
  .digest('hex');
```

---

## 📊 Codes de Statut

### PaymentAttemptStatus

- `PENDING` - En attente
- `PROCESSING` - En cours
- `SUCCESS` - Succès
- `FAILED` - Échec
- `CANCELLED` - Annulé
- `EXPIRED` - Expiré

### Catégories d'échec

- `insufficient_funds` - Fonds insuffisants
- `timeout` - Session expirée
- `user_action` - Annulé par utilisateur
- `fraud` - Bloqué pour fraude
- `technical_error` - Erreur technique
- `other` - Autre

---

## 📚 Ressources

- **Guide rapide:** `QUICK_START_INSUFFICIENT_FUNDS.md`
- **Guide complet:** `PAYTECH_COMMANDES_INTEGRATION.md`
- **Guide webhook:** `PAYTECH_INSUFFICIENT_FUNDS_GUIDE.md`
- **Doc PayTech:** https://doc.intech.sn/doc_paytech.php
- **Postman:** https://doc.intech.sn/PayTech%20x%20DOC.postman_collection.json

---

**Version:** 1.0.0
**Date:** 30 octobre 2025
**Basé sur:** Documentation officielle PayTech uniquement
