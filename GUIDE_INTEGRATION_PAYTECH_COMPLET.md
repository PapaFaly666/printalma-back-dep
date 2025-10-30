# 📘 Guide Complet d'Intégration PayTech - Backend & Frontend

**Source**: Documentation officielle PayTech uniquement
- https://doc.intech.sn/doc_paytech.php
- https://doc.intech.sn/PayTech%20x%20DOC.postman_collection.json

**Date**: 30 octobre 2025
**Version**: 2.0.0 - Production Ready

---

## 🎯 Statut de Votre Intégration

### ✅ Backend (NestJS) - DÉJÀ IMPLÉMENTÉ

Votre backend possède **DÉJÀ** une intégration PayTech complète et conforme à la documentation officielle:

| Fonctionnalité | Statut | Fichier |
|----------------|--------|---------|
| Service PayTech | ✅ Implémenté | `src/paytech/paytech.service.ts` |
| Controller PayTech | ✅ Implémenté | `src/paytech/paytech.controller.ts` |
| Webhook IPN | ✅ Opérationnel | endpoint `/paytech/ipn-callback` |
| Vérification HMAC | ✅ Conforme doc | HMAC-SHA256 + SHA256 fallback |
| Tracking fonds insuffisants | ✅ Automatique | Table `PaymentAttempt` |
| Retry payment | ✅ Fonctionnel | endpoint `/orders/:orderNumber/retry-payment` |
| Refund | ✅ Disponible | endpoint `/paytech/refund` (admin) |
| Status check | ✅ Opérationnel | endpoint `/paytech/status/:token` |
| Analytics | ✅ Disponible | endpoint `/orders/admin/insufficient-funds` |

### ⚠️ Frontend - À IMPLÉMENTER

Vous **n'avez pas encore** d'application frontend dans ce dépôt. Ci-dessous, vous trouverez les instructions complètes pour intégrer PayTech dans votre frontend.

---

## 📦 PARTIE 1: Backend NestJS (DÉJÀ FAIT)

### 1.1 Architecture Actuelle

Votre backend suit **exactement** l'architecture recommandée par PayTech:

```
src/
├── paytech/
│   ├── paytech.service.ts      # Logique métier PayTech
│   ├── paytech.controller.ts   # Endpoints API
│   ├── dto/
│   │   ├── payment-request.dto.ts
│   │   ├── payment-response.dto.ts
│   │   ├── ipn-callback.dto.ts
│   │   └── refund-request.dto.ts
│   └── paytech.module.ts
├── order/
│   ├── order.service.ts        # Intégration avec commandes
│   └── order.controller.ts     # Endpoints commandes
└── prisma/
    └── schema.prisma           # Schéma DB avec PaymentAttempt
```

### 1.2 Configuration (.env)

**Variables requises** (selon doc PayTech):

```bash
# PayTech API Credentials
PAYTECH_API_KEY=your_api_key_here
PAYTECH_API_SECRET=your_api_secret_here

# Environment: 'test' ou 'prod'
# test = charges aléatoires 100-150 XOF
# prod = charge le montant exact (nécessite activation manuelle)
PAYTECH_ENVIRONMENT=test

# Webhook URLs (HTTPS obligatoire selon doc PayTech)
PAYTECH_IPN_URL=https://yourapi.com/paytech/ipn-callback

# Redirect URLs après paiement
PAYTECH_SUCCESS_URL=https://yoursite.com/payment/success
PAYTECH_CANCEL_URL=https://yoursite.com/payment/cancel

# Frontend URL pour retry links
FRONTEND_URL=https://yoursite.com
```

**Obtenir vos credentials**:
1. Inscription sur https://paytech.sn
2. Dashboard → Settings → API section
3. Copier `API_KEY` et `API_SECRET`

### 1.3 Endpoints Backend Disponibles

#### **Endpoints Publics** (sans authentification)

```bash
# 1. Initialiser un paiement
POST /paytech/payment
Content-Type: application/json

{
  "item_name": "Produit Example",
  "item_price": 25000,
  "ref_command": "ORD-1234567890",
  "command_name": "Commande #1234",
  "currency": "XOF",
  "env": "test",
  "success_url": "https://yoursite.com/success",
  "cancel_url": "https://yoursite.com/cancel"
}

# Réponse (selon doc PayTech):
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "token": "40j515fgrkynl56hi",
    "redirect_url": "https://paytech.sn/payment/checkout/40j515fgrkynl56hi",
    "ref_command": "ORD-1234567890"
  }
}
```

```bash
# 2. Vérifier statut d'un paiement
GET /paytech/status/:token

# Réponse:
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "status": "success", // ou "pending", "failed", "canceled"
    "transaction_id": "TXN123456",
    "amount": 25000,
    "payment_method": "Orange Money"
  }
}
```

```bash
# 3. Webhook IPN (appelé automatiquement par PayTech)
POST /paytech/ipn-callback
# PayTech envoie automatiquement:
{
  "type_event": "sale_complete",
  "ref_command": "ORD-1234567890",
  "item_price": 25000,
  "currency": "XOF",
  "payment_method": "Orange Money",
  "transaction_id": "TXN123456",
  "hmac_compute": "a1b2c3d4...",
  "api_key_sha256": "...",
  "api_secret_sha256": "..."
}
```

```bash
# 4. Retry payment (après fonds insuffisants)
POST /orders/:orderNumber/retry-payment
Content-Type: application/json

{
  "paymentMethod": "PAYTECH" // optionnel
}

# Réponse:
{
  "success": true,
  "data": {
    "order": {...},
    "payment": {
      "token": "new_token_here",
      "redirect_url": "https://paytech.sn/payment/checkout/new_token_here"
    }
  }
}
```

```bash
# 5. Historique des tentatives de paiement
GET /orders/:orderNumber/payment-attempts

# Réponse:
{
  "success": true,
  "data": {
    "order_number": "ORD-1234567890",
    "total_attempts": 3,
    "has_insufficient_funds": true,
    "last_attempt_at": "2025-10-30T10:00:00Z",
    "attempts": [
      {
        "id": 1,
        "attempt_number": 1,
        "status": "FAILED",
        "amount": 25000,
        "failure": {
          "category": "insufficient_funds",
          "reason": "insufficient_funds",
          "message": "Fonds insuffisants"
        }
      }
    ]
  }
}
```

#### **Endpoints Admin** (authentification requise)

```bash
# 6. Remboursement (Admin seulement)
POST /paytech/refund
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "ref_command": "ORD-1234567890"
}

# Réponse (selon doc PayTech):
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "success": 1,
    "message": "Remboursement initié avec succès"
  }
}
```

```bash
# 7. Analytics fonds insuffisants (Admin)
GET /orders/admin/insufficient-funds?page=1&limit=10
Authorization: Bearer <admin_jwt_token>

# Réponse:
{
  "success": true,
  "data": {
    "total": 15,
    "orders": [...]
  }
}
```

#### **Endpoints de Debug**

```bash
# 8. Test configuration PayTech
GET /paytech/test-config

# 9. Test connexion API PayTech
GET /paytech/diagnose

# 10. Vérifier webhook sans modifier commande
POST /paytech/webhook-verify
```

---

## 🌐 PARTIE 2: Frontend (À IMPLÉMENTER)

### 2.1 Options d'Intégration Frontend

Selon la **documentation officielle PayTech**, vous avez **3 options**:

#### **Option 1: Web SDK PayTech (Recommandé)**

**Avantages**:
- ✅ Interface PayTech officielle
- ✅ Gestion automatique de tous les modes de paiement
- ✅ 3 modes d'affichage (popup, nouvel onglet, même page)
- ✅ Aucune gestion PCI-DSS côté client

**Installation** (selon doc PayTech):

```html
<!-- Dans votre HTML -->
<link rel="stylesheet" href="https://paytech.sn/cdn/paytech.min.css">
<script src="https://paytech.sn/cdn/paytech.min.js"></script>
```

**Code JavaScript** (extrait doc PayTech):

```javascript
// Initialiser PayTech après avoir reçu le token de votre backend
PayTech.init({
  token: 'token_recu_du_backend',
  mode: PayTech.OPEN_IN_POPUP, // ou OPEN_IN_NEW_TAB, OPEN_IN_SAME_TAB
  onSuccess: function(response) {
    console.log('Paiement réussi:', response);
    // Rediriger vers page de confirmation
    window.location.href = '/payment/success?order=' + orderNumber;
  },
  onCancel: function() {
    console.log('Paiement annulé');
    window.location.href = '/payment/cancel';
  },
  onError: function(error) {
    console.error('Erreur paiement:', error);
    alert('Erreur lors du paiement: ' + error.message);
  }
});
```

#### **Option 2: Redirection Simple**

**Plus simple** mais moins intégré:

```javascript
// 1. Appeler votre backend pour initialiser le paiement
const response = await fetch('/api/paytech/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    item_name: 'Produit',
    item_price: 25000,
    ref_command: orderNumber,
    command_name: 'Commande #' + orderNumber,
    currency: 'XOF',
    env: 'test'
  })
});

const data = await response.json();

// 2. Rediriger directement vers PayTech
if (data.success) {
  window.location.href = data.data.redirect_url;
}
```

#### **Option 3: Mobile Apps (Flutter/React Native)**

Selon **doc PayTech**, pour les apps mobiles:

```javascript
// Utiliser des URLs mobiles spécifiques
const success_url = 'https://paytech.sn/mobile/success';
const cancel_url = 'https://paytech.sn/mobile/cancel';

// Le reste est identique
```

---

### 2.2 Exemple Complet: React/Next.js avec TypeScript

#### **2.2.1 Interface TypeScript**

```typescript
// types/payment.ts
export interface PaymentRequest {
  item_name: string;
  item_price: number;
  ref_command: string;
  command_name: string;
  currency?: 'XOF' | 'EUR' | 'USD' | 'CAD' | 'GBP' | 'MAD';
  env?: 'test' | 'prod';
  success_url?: string;
  cancel_url?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    redirect_url: string;
    ref_command: string;
  };
}

export interface PaymentAttempt {
  id: number;
  attempt_number: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
  payment_method?: string;
  failure?: {
    category: string;
    reason: string;
    message: string;
    user_message: string;
  };
  attempted_at: string;
}
```

#### **2.2.2 Service API Frontend**

```typescript
// services/paytech.service.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class PaytechService {

  /**
   * Initialiser un paiement
   */
  static async initializePayment(data: PaymentRequest): Promise<PaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/paytech/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment initialization failed');
    }

    return response.json();
  }

  /**
   * Vérifier le statut d'un paiement
   */
  static async checkPaymentStatus(token: string) {
    const response = await fetch(`${API_BASE_URL}/paytech/status/${token}`);
    return response.json();
  }

  /**
   * Récupérer l'historique des tentatives de paiement
   */
  static async getPaymentAttempts(orderNumber: string) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/payment-attempts`);
    return response.json();
  }

  /**
   * Retry payment après échec
   */
  static async retryPayment(orderNumber: string, paymentMethod?: string) {
    const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}/retry-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod })
    });
    return response.json();
  }
}
```

#### **2.2.3 Composant Bouton de Paiement**

```tsx
// components/PaymentButton.tsx
import React, { useState } from 'react';
import { PaytechService } from '@/services/paytech.service';

interface PaymentButtonProps {
  orderNumber: string;
  amount: number;
  itemName: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  orderNumber,
  amount,
  itemName,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Initialiser le paiement via backend
      const response = await PaytechService.initializePayment({
        item_name: itemName,
        item_price: amount,
        ref_command: orderNumber,
        command_name: `Commande ${orderNumber}`,
        currency: 'XOF',
        env: process.env.NODE_ENV === 'production' ? 'prod' : 'test',
        success_url: `${window.location.origin}/payment/success?order=${orderNumber}`,
        cancel_url: `${window.location.origin}/payment/cancel?order=${orderNumber}`
      });

      if (response.success) {
        // 2. Rediriger vers PayTech (option simple)
        window.location.href = response.data.redirect_url;

        // OU utiliser le SDK PayTech (option avancée):
        /*
        if (typeof PayTech !== 'undefined') {
          PayTech.init({
            token: response.data.token,
            mode: PayTech.OPEN_IN_POPUP,
            onSuccess: () => {
              window.location.href = `/payment/success?order=${orderNumber}`;
            },
            onCancel: () => {
              window.location.href = `/payment/cancel?order=${orderNumber}`;
            },
            onError: (error) => {
              console.error('Payment error:', error);
              onError?.(new Error(error.message));
            }
          });
        }
        */
      } else {
        throw new Error(response.message || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error as Error);
      alert('Erreur lors de l\'initialisation du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50"
    >
      {loading ? 'Initialisation...' : `Payer ${amount.toLocaleString()} XOF`}
    </button>
  );
};
```

#### **2.2.4 Page de Succès**

```tsx
// pages/payment/success.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { PaytechService } from '@/services/paytech.service';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { order: orderNumber } = router.query;
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderNumber) return;

    // Vérifier que le paiement est bien confirmé côté backend
    // (le webhook IPN a déjà été traité)
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (data.success && data.data.paymentStatus === 'PAID') {
          setVerified(true);
        } else {
          // Attendre quelques secondes et réessayer
          // (le webhook peut prendre du temps)
          setTimeout(() => verifyPayment(), 2000);
        }
      } catch (error) {
        console.error('Verification error:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification du paiement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="text-green-600 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Paiement Réussi!</h1>
        <p className="text-gray-600 mb-6">
          Votre commande <strong>{orderNumber}</strong> a été confirmée.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/orders/${orderNumber}`)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Voir ma commande
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### **2.2.5 Composant Gestion Fonds Insuffisants**

```tsx
// components/InsufficientFundsAlert.tsx
import React, { useState } from 'react';
import { PaytechService } from '@/services/paytech.service';

interface InsufficientFundsAlertProps {
  orderNumber: string;
  amount: number;
  lastFailureReason?: string;
}

export const InsufficientFundsAlert: React.FC<InsufficientFundsAlertProps> = ({
  orderNumber,
  amount,
  lastFailureReason
}) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetryPayment = async () => {
    setRetrying(true);

    try {
      const response = await PaytechService.retryPayment(orderNumber);

      if (response.success && response.data.payment) {
        // Rediriger vers PayTech
        window.location.href = response.data.payment.redirect_url;
      } else {
        alert('Erreur lors du retry');
      }
    } catch (error) {
      console.error('Retry error:', error);
      alert('Erreur lors du retry');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-2xl">💰</span>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Fonds insuffisants
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Le paiement de <strong>{amount.toLocaleString()} XOF</strong> a échoué
              en raison de fonds insuffisants.
            </p>
            {lastFailureReason && (
              <p className="mt-1 text-xs">Raison: {lastFailureReason}</p>
            )}
          </div>
          <div className="mt-4">
            <button
              onClick={handleRetryPayment}
              disabled={retrying}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {retrying ? 'Réessayer...' : '🔄 Réessayer le paiement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### **2.2.6 Page Historique Paiements**

```tsx
// components/PaymentHistory.tsx
import React, { useEffect, useState } from 'react';
import { PaytechService } from '@/services/paytech.service';
import { PaymentAttempt } from '@/types/payment';

interface PaymentHistoryProps {
  orderNumber: string;
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ orderNumber }) => {
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await PaytechService.getPaymentAttempts(orderNumber);
        if (response.success) {
          setAttempts(response.data.attempts || []);
        }
      } catch (error) {
        console.error('Error fetching payment attempts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [orderNumber]);

  if (loading) {
    return <div>Chargement de l'historique...</div>;
  }

  if (attempts.length === 0) {
    return <div className="text-gray-500">Aucune tentative de paiement</div>;
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      SUCCESS: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Historique des Paiements</h3>
      <div className="space-y-3">
        {attempts.map((attempt) => (
          <div key={attempt.id} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-semibold">Tentative #{attempt.attempt_number}</span>
                {getStatusBadge(attempt.status)}
              </div>
              <span className="text-sm text-gray-500">
                {new Date(attempt.attempted_at).toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <p>Montant: {attempt.amount.toLocaleString()} {attempt.currency}</p>
              {attempt.payment_method && (
                <p>Méthode: {attempt.payment_method}</p>
              )}
              {attempt.failure && (
                <div className="mt-2 bg-red-50 p-2 rounded">
                  <p className="text-red-700 font-medium">
                    {attempt.failure.user_message}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Catégorie: {attempt.failure.category} | Raison: {attempt.failure.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 2.3 Exemple Vue.js/Nuxt.js

#### **Composable PayTech**

```typescript
// composables/usePaytech.ts
import { ref } from 'vue';

export const usePaytech = () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const initializePayment = async (orderData: {
    orderNumber: string;
    amount: number;
    itemName: string;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch('/api/paytech/payment', {
        method: 'POST',
        body: {
          item_name: orderData.itemName,
          item_price: orderData.amount,
          ref_command: orderData.orderNumber,
          command_name: `Commande ${orderData.orderNumber}`,
          currency: 'XOF',
          env: process.env.NODE_ENV === 'production' ? 'prod' : 'test'
        }
      });

      if (response.success) {
        // Rediriger vers PayTech
        window.location.href = response.data.redirect_url;
      } else {
        throw new Error(response.message);
      }
    } catch (e: any) {
      error.value = e.message || 'Erreur de paiement';
      console.error('Payment error:', e);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    initializePayment
  };
};
```

#### **Composant Bouton**

```vue
<!-- components/PaymentButton.vue -->
<template>
  <button
    @click="handlePayment"
    :disabled="loading"
    class="btn btn-primary"
  >
    {{ loading ? 'Initialisation...' : `Payer ${amount.toLocaleString()} XOF` }}
  </button>
</template>

<script setup lang="ts">
import { usePaytech } from '@/composables/usePaytech';

const props = defineProps<{
  orderNumber: string;
  amount: number;
  itemName: string;
}>();

const { loading, error, initializePayment } = usePaytech();

const handlePayment = () => {
  initializePayment({
    orderNumber: props.orderNumber,
    amount: props.amount,
    itemName: props.itemName
  });
};
</script>
```

---

## 🔐 PARTIE 3: Sécurité (Conforme Documentation PayTech)

### 3.1 Vérification HMAC (Déjà Implémenté Backend)

Votre backend implémente **exactement** la vérification HMAC recommandée par PayTech:

```typescript
// Extrait de votre paytech.service.ts (DÉJÀ FAIT)
verifyIpnHmac(ipnData: IpnCallbackDto): boolean {
  // Construction du message selon doc PayTech: amount|ref_command|api_key
  const message = `${ipnData.item_price}|${ipnData.ref_command}|${this.apiKey}`;

  // Calcul HMAC-SHA256
  const expectedHmac = crypto
    .createHmac('sha256', this.apiSecret)
    .update(message)
    .digest('hex');

  // Comparaison
  return expectedHmac === ipnData.hmac_compute;
}
```

### 3.2 Bonnes Pratiques Sécurité

✅ **Ce que votre backend fait déjà correctement**:
- Headers `API_KEY` et `API_SECRET` envoyés à PayTech
- Vérification HMAC-SHA256 sur tous les webhooks IPN
- Fallback SHA256 si HMAC non disponible
- Logs détaillés en cas d'échec de vérification
- Endpoints admin protégés par JWT + RoleGuard

⚠️ **À faire côté frontend**:
- **JAMAIS** exposer `API_KEY` ou `API_SECRET` dans le code frontend
- Toujours passer par votre backend pour initialiser les paiements
- Utiliser HTTPS en production
- Vérifier côté client que le paiement est confirmé (via API backend)

### 3.3 URLs Webhook Configuration

**Dans le dashboard PayTech** (https://paytech.sn):

1. Login → Settings → API Configuration
2. IPN URL: `https://yourapi.com/paytech/ipn-callback`
3. Success URL: `https://yoursite.com/payment/success`
4. Cancel URL: `https://yoursite.com/payment/cancel`

⚠️ **IMPORTANT** (selon doc PayTech):
- URLs webhook **DOIVENT** être en HTTPS
- URLs doivent être accessibles publiquement
- PayTech envoie des POST requests

---

## 📊 PARTIE 4: Modes de Paiement (Selon Doc PayTech)

### 4.1 Méthodes Disponibles

Selon la documentation officielle, PayTech supporte:

| Méthode | Pays | Code |
|---------|------|------|
| Orange Money | Sénégal | `Orange Money` |
| Orange Money | Côte d'Ivoire | `Orange Money CI` |
| Orange Money | Mali | `Orange Money ML` |
| MTN Money | Côte d'Ivoire | `Mtn Money CI` |
| MTN Money | Bénin | `Mtn Money BJ` |
| Moov Money | Côte d'Ivoire | `Moov Money CI` |
| Moov Money | Mali | `Moov Money ML` |
| Moov Money | Bénin | `Moov Money BJ` |
| Wave | Sénégal | `Wave` |
| Wave | Côte d'Ivoire | `Wave CI` |
| Wizall | Sénégal | `Wizall` |
| Free Money | Sénégal | `Free Money` |
| Tigo Cash | - | `Tigo Cash` |
| Carte Bancaire | International | `Carte Bancaire` |
| Emoney | - | `Emoney` |

### 4.2 Pré-remplissage Formulaire

Selon **doc PayTech**, vous pouvez pré-remplir le formulaire de paiement:

```javascript
// Ajouter des paramètres à l'URL de redirection
const redirectUrl = `${paymentResponse.redirect_url}?pn=+221777777777&nn=777777777&fn=John%20Smith&tp=Orange%20Money&nac=1`;

// Paramètres:
// pn = phone avec indicatif pays (+221777777777)
// nn = phone format national (777777777)
// fn = nom complet du client (John Smith)
// tp = type de paiement (Orange Money, Wave, etc.)
// nac = auto-submit (0=manuel, 1=automatique)
//       IMPORTANT: Toujours utiliser 0 pour les cartes bancaires

window.location.href = redirectUrl;
```

⚠️ **Attention** (doc PayTech):
- `nac=1` (auto-submit) ne fonctionne PAS avec les cartes bancaires
- Toujours utiliser `nac=0` si `tp=Carte Bancaire`

### 4.3 Ciblage Méthode Unique

Pour proposer **une seule méthode** de paiement:

```typescript
// Backend: lors de l'initialisation
const response = await paytechService.requestPayment({
  // ... autres champs
  target_payment: 'Orange Money' // Une seule méthode
});

// Frontend: pré-remplir automatiquement
const redirectUrl = `${response.data.redirect_url}?tp=Orange%20Money&nac=1`;
window.location.href = redirectUrl;
```

Pour plusieurs méthodes spécifiques:

```typescript
target_payment: 'Orange Money,Wave,Carte Bancaire' // Séparé par virgules
```

---

## 🧪 PARTIE 5: Tests (Conforme Doc PayTech)

### 5.1 Mode Test

**Selon doc PayTech**:
- Environment `test` débite un montant aléatoire entre **100-150 XOF**
- Utilisez `env: 'test'` dans vos requêtes
- Aucune activation nécessaire

```bash
# Test backend
curl -X POST http://localhost:3000/paytech/payment \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Product",
    "item_price": 25000,
    "ref_command": "TEST-'$(date +%s)'",
    "command_name": "Test Order",
    "currency": "XOF",
    "env": "test"
  }'
```

### 5.2 Tests Frontend

```typescript
// test/paytech.test.ts (Jest + React Testing Library)
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentButton } from '@/components/PaymentButton';

describe('PaymentButton', () => {
  it('should initialize payment and redirect', async () => {
    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: {
            token: 'test_token',
            redirect_url: 'https://paytech.sn/checkout/test_token'
          }
        })
      })
    ) as jest.Mock;

    // Mock window.location
    delete window.location;
    window.location = { href: '' } as any;

    render(
      <PaymentButton
        orderNumber="ORD-123"
        amount={25000}
        itemName="Test Product"
      />
    );

    const button = screen.getByText(/Payer 25,000 XOF/i);
    fireEvent.click(button);

    await waitFor(() => {
      expect(window.location.href).toContain('paytech.sn/checkout');
    });
  });
});
```

### 5.3 Test Webhook Localement

Utilisez **ngrok** pour exposer votre localhost:

```bash
# 1. Installer ngrok
npm install -g ngrok

# 2. Exposer localhost:3000
ngrok http 3000

# 3. Copier l'URL HTTPS (ex: https://abc123.ngrok.io)
# 4. Configurer dans PayTech dashboard:
#    IPN URL: https://abc123.ngrok.io/paytech/ipn-callback
```

Ou utilisez l'endpoint de test de votre backend:

```bash
# Test sans modifier la base de données
curl -X POST http://localhost:3000/paytech/webhook-verify \
  -H "Content-Type: application/json" \
  -d @test-webhook.json
```

---

## 🚀 PARTIE 6: Passage en Production

### 6.1 Activation Compte Production

**Selon doc PayTech**, pour utiliser `env: 'prod'`:

1. **Envoyer un email à** `contact@paytech.sn`
2. **Objet**: "Activation Compte PayTech"
3. **Documents requis**:
   - NINEA (Numéro d'Identification National des Entreprises)
   - Pièce d'identité du gérant
   - Registre de commerce
   - Attestation de situation fiscale
   - Justificatif de domicile
   - Description de l'activité

4. **Contact support**: `+221 77 125 57 99`

### 6.2 Checklist Production

- [ ] Compte PayTech activé en production
- [ ] `PAYTECH_ENVIRONMENT=prod` dans `.env`
- [ ] URLs webhook configurées en HTTPS
- [ ] Certificat SSL valide sur votre API
- [ ] Logs et monitoring en place
- [ ] Tests de bout en bout effectués
- [ ] Gestion d'erreurs robuste
- [ ] Notifications clients configurées (email/SMS)
- [ ] Dashboard analytics fonctionnel
- [ ] Procédure de remboursement documentée
- [ ] Support client formé

### 6.3 Variables d'Environnement Production

```bash
# .env.production
PAYTECH_API_KEY=prod_api_key_here
PAYTECH_API_SECRET=prod_api_secret_here
PAYTECH_ENVIRONMENT=prod
PAYTECH_IPN_URL=https://api.yoursite.com/paytech/ipn-callback
PAYTECH_SUCCESS_URL=https://yoursite.com/payment/success
PAYTECH_CANCEL_URL=https://yoursite.com/payment/cancel
FRONTEND_URL=https://yoursite.com
```

---

## 📞 Support et Ressources

### Documentation Officielle PayTech
- **Docs**: https://doc.intech.sn/doc_paytech.php
- **Postman**: https://doc.intech.sn/PayTech%20x%20DOC.postman_collection.json
- **Dashboard**: https://paytech.sn
- **Email**: contact@paytech.sn
- **Téléphone**: +221 77 125 57 99

### Documentation Votre Projet
- `START_HERE.md` - Guide démarrage rapide
- `QUICK_START_INSUFFICIENT_FUNDS.md` - Test fonds insuffisants
- `PAYTECH_COMMANDES_INTEGRATION.md` - Intégration commandes
- `PAYTECH_API_ENDPOINTS.md` - Référence API complète
- `README_PAYTECH_INTEGRATION.md` - Vue d'ensemble

---

## ✅ Résumé

### Backend (NestJS) - ✅ COMPLET
Votre backend est **100% opérationnel** et conforme à la documentation PayTech:
- ✅ Initialisation paiements
- ✅ Webhooks IPN avec HMAC
- ✅ Gestion fonds insuffisants
- ✅ Retry payment
- ✅ Refund (admin)
- ✅ Analytics

### Frontend - ⚠️ À IMPLÉMENTER
Utilisez les exemples ci-dessus pour:
1. Intégrer le SDK PayTech (recommandé)
2. Créer les composants de paiement
3. Gérer les redirections et callbacks
4. Afficher l'historique des tentatives
5. Gérer les cas de fonds insuffisants

### Prochaines Étapes
1. **Tester votre backend**: Utilisez les endpoints de test
2. **Implémenter le frontend**: Suivez les exemples React/Vue
3. **Tester en mode test**: Vérifiez le flux complet
4. **Activer la production**: Contactez PayTech
5. **Déployer**: Configurez les webhooks HTTPS

---

**Version**: 2.0.0
**Date**: 30 octobre 2025
**Basé sur**: Documentation officielle PayTech uniquement
**Statut**: ✅ Production Ready (backend) | ⚠️ À implémenter (frontend)
