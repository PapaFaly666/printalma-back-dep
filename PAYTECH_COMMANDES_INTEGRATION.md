# Intégration PayTech - Gestion Automatique des Fonds Insuffisants dans les Commandes

> **Sources officielles uniquement:**
> - https://doc.intech.sn/doc_paytech.php
> - https://doc.intech.sn/PayTech%20x%20DOC.postman_collection.json

## 📋 Vue d'ensemble

Cette intégration permet de **gérer automatiquement les cas de fonds insuffisants** directement dans le système de commandes avec un tracking complet de toutes les tentatives de paiement.

### ✨ Fonctionnalités

- ✅ **Tracking automatique** de toutes les tentatives de paiement
- ✅ **Détection automatique** des fonds insuffisants
- ✅ **Historique complet** des tentatives avec détails d'échec
- ✅ **Compteur de tentatives** intégré dans les commandes
- ✅ **Analytics** sur les échecs de paiement
- ✅ **Retry automatique** avec génération de nouveau token PayTech

---

## 🗄️ Modifications de la base de données

### 1. Nouveaux champs dans Order

```prisma
model Order {
  // ... champs existants ...

  // 🆕 Champs pour gestion des fonds insuffisants
  paymentAttempts        Int       @default(0) // Nombre total de tentatives
  lastPaymentAttemptAt   DateTime? // Date de la dernière tentative
  lastPaymentFailureReason String? // Dernière raison d'échec
  hasInsufficientFunds   Boolean   @default(false) // Flag fonds insuffisants

  // 🆕 Relation avec historique des tentatives
  paymentAttemptsHistory PaymentAttempt[]

  // Index pour requêtes rapides
  @@index([hasInsufficientFunds])
  @@index([lastPaymentAttemptAt])
}
```

### 2. Nouvelle table PaymentAttempt

```prisma
model PaymentAttempt {
  id                   Int                  @id @default(autoincrement())
  orderId              Int
  orderNumber          String
  amount               Float
  currency             String               @default("XOF")
  paymentMethod        String?
  status               PaymentAttemptStatus @default(PENDING)

  // Informations PayTech
  paytechToken         String?
  paytechTransactionId String?

  // Détails d'échec
  failureReason        String?
  failureCategory      String? // insufficient_funds, timeout, etc.
  failureCode          String?
  failureMessage       String?
  processorResponse    String?

  // Métadonnées
  ipnData              Json? // Données IPN complètes pour debug
  isRetry              Boolean @default(false)
  attemptNumber        Int     @default(1)

  // Horodatage
  attemptedAt          DateTime  @default(now())
  completedAt          DateTime?
  failedAt             DateTime?

  order                Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@index([orderNumber])
  @@index([status])
  @@index([failureCategory])
  @@index([attemptedAt(sort: Desc)])
  @@index([paytechToken])
  @@map("payment_attempts")
}

enum PaymentAttemptStatus {
  PENDING
  PROCESSING
  SUCCESS
  FAILED
  CANCELLED
  EXPIRED
}
```

---

## 🚀 Installation et Migration

### Étape 1: Générer la migration Prisma

```bash
# Générer la migration
npx prisma migrate dev --name add_payment_attempts_tracking

# OU pour production
npx prisma migrate deploy
```

### Étape 2: Vérifier la migration

```bash
# Vérifier le schéma
npx prisma format

# Générer le client Prisma
npx prisma generate
```

### Étape 3: Rebuild l'application

```bash
npm run build
```

---

## 📡 Nouveaux Endpoints API

### 1. Webhook IPN Principal (Amélioré)

**Endpoint:** `POST /paytech/ipn-callback`

**Nouveautés:**
- Crée automatiquement un `PaymentAttempt` pour chaque webhook
- Met à jour les compteurs et flags dans `Order`
- Détecte automatiquement les fonds insuffisants

**Réponse avec fonds insuffisants:**

```json
{
  "success": true,
  "message": "IPN processed successfully",
  "data": {
    "ref_command": "ORD-1234567890",
    "payment_status": "failed",
    "verified": true,
    "payment_attempt_id": 45,
    "attempt_number": 2,
    "insufficient_funds_detected": true,
    "retry_url": "https://votresite.com/orders/ORD-1234567890/retry-payment",
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

### 2. Historique des tentatives de paiement

**Endpoint:** `GET /orders/:orderNumber/payment-attempts`

**Authentification:** Public (accès avec numéro de commande)

**Exemple de requête:**

```bash
curl GET https://votreapi.com/orders/ORD-1234567890/payment-attempts
```

**Réponse:**

```json
{
  "success": true,
  "message": "Payment attempts retrieved successfully",
  "data": {
    "order_id": 123,
    "order_number": "ORD-1234567890",
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
        "id": 47,
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
          "message": "Fonds insuffisants dans le compte",
          "processor_response": null
        },
        "attempted_at": "2025-10-30T14:30:00Z",
        "completed_at": null,
        "failed_at": "2025-10-30T14:30:15Z",
        "paytech_token": "token_xyz_retry2",
        "paytech_transaction_id": "TXN789"
      },
      {
        "id": 46,
        "attempt_number": 2,
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
        "attempted_at": "2025-10-30T12:00:00Z",
        "failed_at": "2025-10-30T12:00:10Z"
      },
      {
        "id": 45,
        "attempt_number": 1,
        "status": "FAILED",
        "amount": 25000,
        "currency": "XOF",
        "payment_method": "Orange Money",
        "is_retry": false,
        "failure": {
          "category": "insufficient_funds",
          "reason": "insufficient_funds"
        },
        "attempted_at": "2025-10-30T10:00:00Z",
        "failed_at": "2025-10-30T10:00:12Z"
      }
    ]
  }
}
```

### 3. Détails d'une tentative (Admin)

**Endpoint:** `GET /orders/admin/payment-attempt/:attemptId`

**Authentification:** Admin/SuperAdmin uniquement

**Exemple:**

```bash
curl -H "Authorization: Bearer <token>" \
  GET https://votreapi.com/orders/admin/payment-attempt/45
```

**Réponse:**

```json
{
  "success": true,
  "message": "Payment attempt details retrieved",
  "data": {
    "id": 45,
    "orderId": 123,
    "orderNumber": "ORD-1234567890",
    "amount": 25000,
    "currency": "XOF",
    "status": "FAILED",
    "failureCategory": "insufficient_funds",
    "failureReason": "insufficient_funds",
    "attemptNumber": 1,
    "ipnData": {
      "type_event": "sale_canceled",
      "ref_command": "ORD-1234567890",
      "item_price": 25000,
      "cancel_reason": "insufficient_funds"
    },
    "order": {
      "id": 123,
      "order_number": "ORD-1234567890",
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

### 4. Analytics fonds insuffisants (Admin)

**Endpoint:** `GET /orders/admin/insufficient-funds?page=1&limit=10`

**Authentification:** Admin/SuperAdmin uniquement

**Réponse:**

```json
{
  "success": true,
  "message": "Commandes avec fonds insuffisants récupérées",
  "data": {
    "orders": [
      {
        "id": 123,
        "orderNumber": "ORD-1234567890",
        "totalAmount": 25000,
        "status": "PENDING",
        "paymentStatus": "FAILED",
        "payment_attempts_count": 3,
        "last_payment_attempt": "2025-10-30T14:30:00Z",
        "last_failure_reason": "insufficient_funds",
        "recent_attempts": [
          // ... dernières tentatives
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

### 5. Retry payment (Inchangé)

**Endpoint:** `POST /orders/:orderNumber/retry-payment`

**Corps de requête (optionnel):**

```json
{
  "paymentMethod": "Wave"
}
```

---

## 🔄 Flux automatique

### Flux complet d'un paiement avec fonds insuffisants

```
1. Client crée une commande
   └─> Order créé avec paymentAttempts = 0

2. Client clique sur "Payer"
   └─> PayTech génère un token
   └─> Redirection vers PayTech

3. Client essaie de payer mais solde insuffisant
   └─> PayTech envoie webhook IPN à /paytech/ipn-callback

4. Webhook IPN reçu
   ├─> Vérifie HMAC signature ✓
   ├─> Détecte payment failed
   ├─> Analyse raison: insufficient_funds
   │
   ├─> ÉTAPE 1: Créer PaymentAttempt
   │   └─> PaymentAttempt {
   │         orderId: 123,
   │         attemptNumber: 1,
   │         status: FAILED,
   │         failureCategory: "insufficient_funds",
   │         ipnData: {...} // Données complètes
   │       }
   │
   └─> ÉTAPE 2: Mettre à jour Order
       └─> Order {
             paymentAttempts: 1,
             hasInsufficientFunds: true,
             lastPaymentAttemptAt: now(),
             lastPaymentFailureReason: "insufficient_funds",
             paymentStatus: "FAILED"
           }

5. Réponse webhook contient:
   ├─> insufficient_funds_detected: true
   └─> retry_url: "/orders/ORD-123/retry-payment"

6. Client reçoit notification (email/SMS)
   └─> "Fonds insuffisants, réessayez ici: [lien]"

7. Client clique sur retry_url
   └─> POST /orders/ORD-123/retry-payment
   └─> Nouveau token PayTech généré
   └─> PaymentAttempt n°2 sera créé au prochain IPN

8. Si paiement réussit:
   └─> PaymentAttempt {
         attemptNumber: 2,
         status: SUCCESS,
         completedAt: now()
       }
   └─> Order {
         paymentStatus: PAID,
         status: CONFIRMED,
         hasInsufficientFunds: false, // Reset!
         lastPaymentFailureReason: null
       }
```

---

## 📊 Requêtes Analytics

### 1. Taux de fonds insuffisants

```typescript
// Dans votre service analytics
async getInsufficientFundsRate() {
  const [totalOrders, insufficientFundsOrders] = await Promise.all([
    this.prisma.order.count(),
    this.prisma.order.count({
      where: { hasInsufficientFunds: true }
    })
  ]);

  const rate = (insufficientFundsOrders / totalOrders) * 100;

  return {
    total_orders: totalOrders,
    insufficient_funds_orders: insufficientFundsOrders,
    rate_percentage: rate.toFixed(2)
  };
}
```

### 2. Taux de succès des retries

```typescript
async getRetrySuccessRate() {
  const retryAttempts = await this.prisma.paymentAttempt.findMany({
    where: { isRetry: true }
  });

  const successful = retryAttempts.filter(a => a.status === 'SUCCESS').length;
  const rate = (successful / retryAttempts.length) * 100;

  return {
    total_retries: retryAttempts.length,
    successful_retries: successful,
    success_rate: rate.toFixed(2)
  };
}
```

### 3. Commandes à relancer (marketing)

```typescript
async getOrdersNeedingRetry() {
  // Commandes avec fonds insuffisants et aucune tentative depuis 24h
  return await this.prisma.order.findMany({
    where: {
      hasInsufficientFunds: true,
      paymentStatus: 'FAILED',
      lastPaymentAttemptAt: {
        lt: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    include: {
      user: true,
      paymentAttemptsHistory: {
        orderBy: { attemptedAt: 'desc' },
        take: 1
      }
    }
  });
}
```

---

## 🎨 Exemple Frontend (React)

### Component: OrderPaymentStatus

```typescript
import { useEffect, useState } from 'react';
import axios from 'axios';

interface PaymentAttempt {
  id: number;
  attempt_number: number;
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  failure?: {
    category: string;
    reason: string;
    message: string;
  };
  attempted_at: string;
}

export default function OrderPaymentStatus({ orderNumber }: { orderNumber: string }) {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    fetchPaymentAttempts();
  }, [orderNumber]);

  const fetchPaymentAttempts = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderNumber}/payment-attempts`
      );
      setOrderData(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderNumber}/retry-payment`
      );

      // Rediriger vers PayTech
      window.location.href = response.data.data.payment.redirect_url;
    } catch (error) {
      console.error('Retry error:', error);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="payment-status-container">
      <div className="order-summary">
        <h2>Commande {orderData.order_number}</h2>
        <p>Montant: {orderData.total_amount} {orderData.attempts[0]?.currency || 'XOF'}</p>
        <p>Statut paiement: <span className="badge">{orderData.payment_status}</span></p>
        <p>Tentatives: {orderData.total_attempts}</p>
      </div>

      {orderData.has_insufficient_funds && (
        <div className="alert alert-warning">
          <h3>💰 Fonds insuffisants détectés</h3>
          <p>Votre dernier paiement a échoué en raison de fonds insuffisants.</p>
          <button onClick={handleRetryPayment} className="btn btn-primary">
            🔄 Réessayer le paiement
          </button>
        </div>
      )}

      <div className="payment-history">
        <h3>Historique des tentatives</h3>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Méthode</th>
              <th>Statut</th>
              <th>Raison d'échec</th>
            </tr>
          </thead>
          <tbody>
            {orderData.attempts.map((attempt: PaymentAttempt) => (
              <tr key={attempt.id}>
                <td>Tentative #{attempt.attempt_number}</td>
                <td>{new Date(attempt.attempted_at).toLocaleString()}</td>
                <td>{attempt.payment_method || 'N/A'}</td>
                <td>
                  <span className={`badge ${attempt.status === 'SUCCESS' ? 'success' : 'danger'}`}>
                    {attempt.status}
                  </span>
                </td>
                <td>
                  {attempt.failure ? (
                    <span title={attempt.failure.message}>
                      {attempt.failure.category}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 🧪 Tests

### Test manuel complet

```bash
# 1. Créer une commande de test
curl -X POST http://localhost:3000/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "orderItems": [{"productId": 1, "quantity": 1, "unitPrice": 25000}],
    "totalAmount": 25000,
    "phoneNumber": "771234567",
    "paymentMethod": "PAYTECH",
    "initiatePayment": true
  }'

# 2. Simuler webhook IPN avec fonds insuffisants
curl -X POST http://localhost:3000/paytech/ipn-callback \
  -H "Content-Type: application/json" \
  -d '{
    "type_event": "sale_canceled",
    "ref_command": "ORD-1234567890",
    "item_price": 25000,
    "currency": "XOF",
    "cancel_reason": "insufficient_funds",
    "error_code": "INS_001",
    "error_message": "Fonds insuffisants",
    "payment_method": "Orange Money",
    "api_key_sha256": "VOTRE_HASH",
    "api_secret_sha256": "VOTRE_HASH",
    "hmac_compute": "VOTRE_HMAC"
  }'

# 3. Vérifier l'historique des tentatives
curl http://localhost:3000/orders/ORD-1234567890/payment-attempts

# 4. Réessayer le paiement
curl -X POST http://localhost:3000/orders/ORD-1234567890/retry-payment

# 5. Simuler succès du retry
curl -X POST http://localhost:3000/paytech/ipn-callback \
  -H "Content-Type: application/json" \
  -d '{
    "type_event": "sale_complete",
    "success": 1,
    "ref_command": "ORD-1234567890",
    "item_price": 25000,
    "transaction_id": "TXN123",
    "api_key_sha256": "VOTRE_HASH",
    "api_secret_sha256": "VOTRE_HASH",
    "hmac_compute": "VOTRE_HMAC"
  }'

# 6. Vérifier que le flag a été reset
curl http://localhost:3000/orders/ORD-1234567890/payment-attempts
# Devrait montrer has_insufficient_funds: false
```

---

## 📈 Monitoring et KPIs

### Métriques clés à suivre

1. **Taux de fonds insuffisants**: `(Commandes avec fonds insuffisants / Total commandes) * 100`
2. **Taux de succès des retries**: `(Retries réussis / Total retries) * 100`
3. **Temps moyen entre échec et retry réussi**
4. **Nombre moyen de tentatives avant succès**
5. **Montant total perdu à cause de fonds insuffisants**

### Dashboard SQL

```sql
-- Taux de fonds insuffisants ce mois
SELECT
  COUNT(*) FILTER (WHERE has_insufficient_funds) as insufficient_funds_count,
  COUNT(*) as total_orders,
  ROUND(COUNT(*) FILTER (WHERE has_insufficient_funds) * 100.0 / COUNT(*), 2) as rate_percentage
FROM orders
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);

-- Top 5 heures avec le plus de fonds insuffisants
SELECT
  EXTRACT(HOUR FROM attempted_at) as hour,
  COUNT(*) as failed_attempts
FROM payment_attempts
WHERE failure_category = 'insufficient_funds'
GROUP BY hour
ORDER BY failed_attempts DESC
LIMIT 5;
```

---

## ✅ Checklist de déploiement

- [ ] Exécuter la migration Prisma
- [ ] Vérifier les index créés en base de données
- [ ] Tester le webhook IPN avec cas de fonds insuffisants
- [ ] Tester le retry payment
- [ ] Vérifier que les PaymentAttempt sont créés correctement
- [ ] Vérifier que hasInsufficientFunds est mis à jour
- [ ] Tester la réinitialisation du flag après succès
- [ ] Mettre en place les notifications client (email/SMS)
- [ ] Configurer le monitoring des KPIs
- [ ] Documenter pour l'équipe support

---

## 🆘 Dépannage

### Problème: PaymentAttempt non créé

**Solution:**
- Vérifier que la migration a été exécutée
- Vérifier les logs du webhook IPN
- S'assurer que l'order existe avant le webhook

### Problème: hasInsufficientFunds reste à true

**Solution:**
- Vérifier que le webhook de succès est bien reçu
- Vérifier la logique dans `updateOrderPaymentStatus`
- Vérifier manuellement en base: `UPDATE orders SET has_insufficient_funds = false WHERE order_number = 'ORD-XXX'`

### Problème: Nombre de tentatives incorrect

**Solution:**
- Le compteur est basé sur les PaymentAttempt créés
- Vérifier qu'un PaymentAttempt est créé à chaque IPN
- Si nécessaire, recalculer:
```sql
UPDATE orders o
SET payment_attempts = (
  SELECT COUNT(*) FROM payment_attempts WHERE order_id = o.id
);
```

---

## 📚 Ressources

- [Documentation PayTech officielle](https://doc.intech.sn/doc_paytech.php)
- [Collection Postman PayTech](https://doc.intech.sn/PayTech%20x%20DOC.postman_collection.json)
- [Guide webhook fonds insuffisants](./PAYTECH_INSUFFICIENT_FUNDS_GUIDE.md)

---

**Date de création:** 30 octobre 2025
**Version:** 1.0.0
**Basé sur:** Documentation officielle PayTech uniquement
