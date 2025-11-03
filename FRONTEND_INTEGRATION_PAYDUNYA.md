# Guide d'Intégration Frontend - Printalma avec PayDunya

**Date**: 3 Novembre 2025
**Version**: 1.0
**API Backend**: `http://localhost:3004` (développement) / `https://api.printalma.com` (production)

---

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration requise](#configuration-requise)
3. [Endpoints API disponibles](#endpoints-api-disponibles)
4. [Flux de paiement complet](#flux-de-paiement-complet)
5. [Intégration étape par étape](#intégration-étape-par-étape)
6. [Exemples de code](#exemples-de-code)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Tests et débogage](#tests-et-débogage)

---

## 🎯 Vue d'ensemble

### Qu'est-ce que PayDunya ?

PayDunya est la passerelle de paiement mobile money qui permet aux utilisateurs de payer avec :
- 🟠 **Orange Money** (Sénégal, Côte d'Ivoire, Mali, etc.)
- 🔵 **Wave** (Sénégal)
- 📱 **MTN Mobile Money**
- 🟢 **Moov Money**

### Architecture du paiement

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend   │─────▶│   PayDunya  │─────▶│   Client    │
│  (React/    │◀─────│  (NestJS)   │◀─────│     API     │◀─────│  (Mobile)   │
│   Next.js)  │      │             │      │             │      │   Money     │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

---

## ⚙️ Configuration Requise

### Variables d'environnement Frontend

Créez un fichier `.env.local` (Next.js) ou `.env` (React) :

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3004
# ou en production :
# NEXT_PUBLIC_API_URL=https://api.printalma.com

# Frontend URL (pour les redirections)
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
# ou en production :
# NEXT_PUBLIC_FRONTEND_URL=https://printalma.com
```

### Installation des dépendances

```bash
# Si vous utilisez axios
npm install axios

# Si vous utilisez React Query (recommandé)
npm install @tanstack/react-query

# Pour TypeScript (types)
npm install -D @types/node
```

---

## 🔌 Endpoints API Disponibles

### Base URL
- **Développement**: `http://localhost:3004`
- **Production**: `https://api.printalma.com`

### 1. Créer une commande

**Endpoint**: `POST /orders`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**:
```json
{
  "items": [
    {
      "designId": "uuid-du-design",
      "quantity": 2,
      "size": "A4",
      "paperType": "glossy",
      "customizations": {
        "color": "full",
        "orientation": "portrait"
      }
    }
  ],
  "shippingAddress": {
    "fullName": "Papa Fallou Diagne",
    "phone": "+221771234567",
    "address": "Rue 10, Dakar",
    "city": "Dakar",
    "postalCode": "12000",
    "country": "Sénégal"
  },
  "notes": "Livraison urgente svp"
}
```

**Réponse succès (201)**:
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20251103-001",
    "totalAmount": 15000,
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "items": [...],
    "shippingAddress": {...},
    "createdAt": "2025-11-03T16:00:00.000Z"
  }
}
```

### 2. Initialiser un paiement PayDunya

**Endpoint**: `POST /paydunya/payment`

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "invoice": {
    "total_amount": 15000,
    "description": "Commande Printalma #ORD-20251103-001",
    "customer": {
      "name": "Papa Fallou Diagne",
      "email": "client@example.com",
      "phone": "+221771234567"
    },
    "channels": ["orange-money-senegal", "wave-senegal"]
  },
  "store": {
    "name": "Printalma Store",
    "tagline": "Impression de qualité professionnelle",
    "phone": "+221338234567",
    "website_url": "https://printalma.com"
  },
  "actions": {
    "callback_url": "https://api.printalma.com/paydunya/callback",
    "return_url": "https://printalma.com/orders/ORD-20251103-001/success",
    "cancel_url": "https://printalma.com/orders/ORD-20251103-001/cancel"
  },
  "custom_data": {
    "order_number": "ORD-20251103-001",
    "user_id": "user-uuid",
    "platform": "web"
  }
}
```

**Réponse succès (200)**:
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "token": "test_abc123def456",
    "redirect_url": "https://app.paydunya.com/sandbox-checkout/invoice/test_abc123def456",
    "payment_url": "https://app.paydunya.com/sandbox-checkout/invoice/test_abc123def456",
    "invoice_description": "Commande Printalma #ORD-20251103-001"
  }
}
```

### 3. Vérifier le statut d'un paiement

**Endpoint**: `GET /paydunya/status/:token`

**Headers**: Aucun (endpoint public)

**Exemple**:
```
GET /paydunya/status/test_abc123def456
```

**Réponse succès (200)**:
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "response_code": "00",
    "response_text": "Transaction Found",
    "invoice": {
      "token": "test_abc123def456",
      "total_amount": 15000,
      "description": "Commande Printalma #ORD-20251103-001"
    },
    "custom_data": {
      "order_number": "ORD-20251103-001",
      "user_id": "user-uuid"
    },
    "status": "completed",
    "mode": "test"
  }
}
```

**Statuts possibles**:
- `pending` - Paiement en attente
- `completed` - Paiement réussi
- `failed` - Paiement échoué
- `cancelled` - Paiement annulé

### 4. Récupérer les détails d'une commande

**Endpoint**: `GET /orders/:orderNumber`

**Headers**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Exemple**:
```
GET /orders/ORD-20251103-001
```

**Réponse succès (200)**:
```json
{
  "success": true,
  "data": {
    "id": "order-uuid",
    "orderNumber": "ORD-20251103-001",
    "totalAmount": 15000,
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "paymentMethod": "PAYDUNYA",
    "paytechToken": "test_abc123def456",
    "items": [...],
    "shippingAddress": {...},
    "createdAt": "2025-11-03T16:00:00.000Z",
    "updatedAt": "2025-11-03T16:05:00.000Z"
  }
}
```

### 5. Tester la configuration PayDunya

**Endpoint**: `GET /paydunya/test-config`

**Headers**: Aucun (endpoint public)

**Réponse succès (200)**:
```json
{
  "success": true,
  "message": "PayDunya service is configured and ready",
  "data": {
    "mode": "test",
    "baseUrl": "https://app.paydunya.com/sandbox-api/v1",
    "hasMasterKey": true,
    "hasPrivateKey": true,
    "hasToken": true
  }
}
```

---

## 🔄 Flux de Paiement Complet

### Diagramme de séquence

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │         │Frontend │         │ Backend │         │PayDunya │
└────┬────┘         └────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │                   │
     │  1. Valider       │                   │                   │
     │  commande         │                   │                   │
     ├──────────────────▶│                   │                   │
     │                   │                   │                   │
     │                   │  2. POST /orders  │                   │
     │                   ├──────────────────▶│                   │
     │                   │                   │                   │
     │                   │  3. Commande créée│                   │
     │                   │◀──────────────────┤                   │
     │                   │                   │                   │
     │                   │  4. POST /paydunya│                   │
     │                   │     /payment      │                   │
     │                   ├──────────────────▶│  5. Create invoice│
     │                   │                   ├──────────────────▶│
     │                   │                   │                   │
     │                   │                   │  6. Payment URL   │
     │                   │  7. redirect_url  │◀──────────────────┤
     │                   │◀──────────────────┤                   │
     │                   │                   │                   │
     │  8. Redirection   │                   │                   │
     │  vers PayDunya    │                   │                   │
     │◀──────────────────┤                   │                   │
     │                   │                   │                   │
     │  9. Effectuer     │                   │                   │
     │  paiement         │                   │                   │
     ├────────────────────────────────────────────────────────────▶│
     │                   │                   │                   │
     │                   │                   │ 10. IPN Callback  │
     │                   │                   │◀──────────────────┤
     │                   │                   │                   │
     │                   │                   │ 11. MAJ commande  │
     │                   │                   │                   │
     │ 12. Redirection   │                   │                   │
     │  success/cancel   │                   │                   │
     │◀──────────────────────────────────────────────────────────┤
     │                   │                   │                   │
     │ 13. Afficher      │                   │                   │
     │  confirmation     │                   │                   │
     │◀──────────────────┤                   │                   │
```

### Étapes détaillées

1. **Client valide sa commande** sur le frontend
2. **Frontend crée la commande** via `POST /orders`
3. **Backend retourne** les détails de la commande avec `orderNumber`
4. **Frontend initialise le paiement** via `POST /paydunya/payment`
5. **Backend contacte PayDunya** pour créer une facture
6. **PayDunya retourne** l'URL de paiement
7. **Backend retourne** l'URL au frontend
8. **Frontend redirige** l'utilisateur vers PayDunya
9. **Client effectue le paiement** sur la page PayDunya (Wave/Orange Money)
10. **PayDunya envoie un IPN** (callback) au backend
11. **Backend met à jour** la commande (statut → PAID)
12. **PayDunya redirige** le client vers `success_url` ou `cancel_url`
13. **Frontend affiche** la confirmation de paiement

---

## 🚀 Intégration Étape par Étape

### Étape 1: Configuration de l'API Client

Créez un fichier `src/lib/api.ts` :

```typescript
// src/lib/api.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Rediriger vers login si non authentifié
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Étape 2: Types TypeScript

Créez un fichier `src/types/payment.ts` :

```typescript
// src/types/payment.ts

export interface PaymentCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface PaymentInvoice {
  total_amount: number;
  description: string;
  customer: PaymentCustomer;
  channels?: string[];
}

export interface PaymentStore {
  name: string;
  tagline?: string;
  phone?: string;
  website_url?: string;
}

export interface PaymentActions {
  callback_url: string;
  return_url: string;
  cancel_url: string;
}

export interface PaymentCustomData {
  order_number: string;
  user_id: string;
  platform?: string;
  [key: string]: any;
}

export interface PayDunyaPaymentRequest {
  invoice: PaymentInvoice;
  store: PaymentStore;
  actions: PaymentActions;
  custom_data: PaymentCustomData;
}

export interface PayDunyaPaymentResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    redirect_url: string;
    payment_url: string;
    invoice_description: string;
  };
}

export interface PaymentStatus {
  success: boolean;
  message: string;
  data: {
    response_code: string;
    response_text: string;
    invoice: {
      token: string;
      total_amount: number;
      description: string;
    };
    custom_data: PaymentCustomData;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    mode: 'test' | 'live';
  };
}
```

### Étape 3: Service de Paiement

Créez un fichier `src/services/payment.service.ts` :

```typescript
// src/services/payment.service.ts
import { apiClient } from '@/lib/api';
import type {
  PayDunyaPaymentRequest,
  PayDunyaPaymentResponse,
  PaymentStatus,
} from '@/types/payment';

export class PaymentService {
  /**
   * Initialiser un paiement PayDunya
   */
  static async initializePayment(
    orderNumber: string,
    amount: number,
    customer: { name: string; email: string; phone: string }
  ): Promise<PayDunyaPaymentResponse> {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3001';
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

    const payload: PayDunyaPaymentRequest = {
      invoice: {
        total_amount: amount,
        description: `Commande Printalma #${orderNumber}`,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
        channels: ['orange-money-senegal', 'wave-senegal'],
      },
      store: {
        name: 'Printalma Store',
        tagline: 'Impression de qualité professionnelle',
        phone: '+221338234567',
        website_url: frontendUrl,
      },
      actions: {
        callback_url: `${backendUrl}/paydunya/callback`,
        return_url: `${frontendUrl}/orders/${orderNumber}/success`,
        cancel_url: `${frontendUrl}/orders/${orderNumber}/cancel`,
      },
      custom_data: {
        order_number: orderNumber,
        user_id: customer.email, // ou l'ID utilisateur si disponible
        platform: 'web',
      },
    };

    const response = await apiClient.post<PayDunyaPaymentResponse>(
      '/paydunya/payment',
      payload
    );

    return response.data;
  }

  /**
   * Vérifier le statut d'un paiement
   */
  static async checkPaymentStatus(token: string): Promise<PaymentStatus> {
    const response = await apiClient.get<PaymentStatus>(`/paydunya/status/${token}`);
    return response.data;
  }

  /**
   * Tester la configuration PayDunya
   */
  static async testConfig(): Promise<any> {
    const response = await apiClient.get('/paydunya/test-config');
    return response.data;
  }
}
```

### Étape 4: Hook React personnalisé

Créez un fichier `src/hooks/usePayment.ts` :

```typescript
// src/hooks/usePayment.ts
import { useState } from 'react';
import { PaymentService } from '@/services/payment.service';
import { toast } from 'react-hot-toast'; // ou votre système de notification

export const usePayment = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (
    orderNumber: string,
    amount: number,
    customer: { name: string; email: string; phone: string }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await PaymentService.initializePayment(
        orderNumber,
        amount,
        customer
      );

      if (response.success && response.data.redirect_url) {
        // Rediriger vers PayDunya
        window.location.href = response.data.redirect_url;
        return response;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du paiement';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await PaymentService.checkPaymentStatus(token);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la vérification';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    initiatePayment,
    checkStatus,
    isLoading,
    error,
  };
};
```

---

## 💻 Exemples de Code

### Exemple 1: Page de Checkout (Next.js)

```tsx
// pages/checkout/[orderId].tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { usePayment } from '@/hooks/usePayment';
import { apiClient } from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { orderId } = router.query;
  const { initiatePayment, isLoading } = usePayment();

  const [order, setOrder] = useState<any>(null);
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (orderId) {
      // Charger les détails de la commande
      apiClient.get(`/orders/${orderId}`)
        .then(res => {
          setOrder(res.data.data);
          // Pré-remplir les infos client si disponibles
          if (res.data.data.shippingAddress) {
            setCustomer({
              name: res.data.data.shippingAddress.fullName,
              email: res.data.data.user?.email || '',
              phone: res.data.data.shippingAddress.phone,
            });
          }
        })
        .catch(err => console.error(err));
    }
  }, [orderId]);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order || !customer.name || !customer.email || !customer.phone) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      await initiatePayment(
        order.orderNumber,
        order.totalAmount,
        customer
      );
      // La redirection vers PayDunya se fait automatiquement
    } catch (error) {
      console.error('Erreur de paiement:', error);
    }
  };

  if (!order) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Finaliser le paiement</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Résumé de la commande */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Résumé</h2>
          <div className="space-y-2">
            <p><strong>Commande:</strong> {order.orderNumber}</p>
            <p><strong>Montant total:</strong> {order.totalAmount.toLocaleString()} XOF</p>
            <p><strong>Statut:</strong> {order.status}</p>
          </div>
        </div>

        {/* Formulaire de paiement */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Informations de paiement</h2>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom complet
              </label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Téléphone (avec indicatif)
              </label>
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                placeholder="+221771234567"
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Redirection vers PayDunya...
                  </span>
                ) : (
                  'Payer avec Mobile Money'
                )}
              </button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Paiement sécurisé via PayDunya</p>
              <p className="mt-2">Méthodes acceptées:</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded">🟠 Orange Money</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">🔵 Wave</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Exemple 2: Page de Succès

```tsx
// pages/orders/[orderNumber]/success.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { usePayment } from '@/hooks/usePayment';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { orderNumber, token } = router.query;
  const { checkStatus } = usePayment();

  const [order, setOrder] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('verification');
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (orderNumber && token) {
      verifyPayment();
    }
  }, [orderNumber, token]);

  const verifyPayment = async () => {
    setIsVerifying(true);

    try {
      // Vérifier le statut du paiement
      const statusResponse = await checkStatus(token as string);

      if (statusResponse.data.status === 'completed') {
        setPaymentStatus('success');

        // Charger les détails de la commande
        const orderResponse = await apiClient.get(`/orders/${orderNumber}`);
        setOrder(orderResponse.data.data);
      } else if (statusResponse.data.status === 'pending') {
        setPaymentStatus('pending');
        // Réessayer dans 3 secondes
        setTimeout(verifyPayment, 3000);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Erreur de vérification:', error);
      setPaymentStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying && paymentStatus === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg">Vérification du paiement en cours...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-6xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">Paiement en attente</h1>
          <p className="text-gray-600">Votre paiement est en cours de traitement...</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed' || paymentStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Paiement échoué</h1>
          <p className="text-gray-600 mb-4">Une erreur s'est produite lors du paiement</p>
          <Link href={`/checkout/${orderNumber}`}>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">
              Réessayer
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">✅</div>

        <h1 className="text-3xl font-bold text-green-600 mb-2">
          Paiement réussi !
        </h1>

        <p className="text-gray-600 mb-6">
          Votre commande a été confirmée et payée avec succès
        </p>

        {order && (
          <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
            <h2 className="font-semibold mb-2">Détails de la commande</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Numéro:</strong> {order.orderNumber}</p>
              <p><strong>Montant:</strong> {order.totalAmount.toLocaleString()} XOF</p>
              <p><strong>Statut:</strong> <span className="text-green-600">{order.paymentStatus}</span></p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Link href={`/orders/${orderNumber}`}>
            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
              Voir ma commande
            </button>
          </Link>

          <Link href="/orders">
            <button className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300">
              Mes commandes
            </button>
          </Link>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Un email de confirmation vous a été envoyé
        </p>
      </div>
    </div>
  );
}
```

### Exemple 3: Page d'Annulation

```tsx
// pages/orders/[orderNumber]/cancel.tsx
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function PaymentCancelPage() {
  const router = useRouter();
  const { orderNumber } = router.query;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🚫</div>

        <h1 className="text-3xl font-bold text-orange-600 mb-2">
          Paiement annulé
        </h1>

        <p className="text-gray-600 mb-6">
          Vous avez annulé le paiement. Votre commande est toujours en attente.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>Commande #{orderNumber}</strong> n'a pas été payée.
            Vous pouvez réessayer à tout moment.
          </p>
        </div>

        <div className="space-y-3">
          <Link href={`/checkout/${orderNumber}`}>
            <button className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
              Réessayer le paiement
            </button>
          </Link>

          <Link href="/orders">
            <button className="w-full bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300">
              Voir mes commandes
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Exemple 4: Composant Bouton de Paiement Réutilisable

```tsx
// components/PaymentButton.tsx
import { useState } from 'react';
import { usePayment } from '@/hooks/usePayment';

interface PaymentButtonProps {
  orderNumber: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  className?: string;
  children?: React.ReactNode;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  orderNumber,
  amount,
  customer,
  className = '',
  children,
}) => {
  const { initiatePayment, isLoading, error } = usePayment();

  const handleClick = async () => {
    try {
      await initiatePayment(orderNumber, amount, customer);
    } catch (err) {
      console.error('Payment error:', err);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`${className} ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Chargement...
          </span>
        ) : (
          children || 'Payer maintenant'
        )}
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};
```

---

## ⚠️ Gestion des Erreurs

### Codes d'erreur courants

| Code HTTP | Message | Solution |
|-----------|---------|----------|
| 400 | Invalid payment data | Vérifier les données envoyées (montant, email, téléphone) |
| 401 | Unauthorized | Token JWT expiré ou invalide, redemander la connexion |
| 404 | Order not found | Numéro de commande invalide |
| 500 | Internal server error | Erreur serveur, contacter le support |
| 503 | Service unavailable | PayDunya indisponible, réessayer plus tard |

### Exemple de gestion d'erreur

```typescript
try {
  await initiatePayment(orderNumber, amount, customer);
} catch (error: any) {
  if (error.response) {
    // Erreur retournée par le serveur
    switch (error.response.status) {
      case 400:
        toast.error('Données de paiement invalides. Vérifiez vos informations.');
        break;
      case 401:
        toast.error('Session expirée. Veuillez vous reconnecter.');
        router.push('/login');
        break;
      case 404:
        toast.error('Commande introuvable.');
        break;
      case 500:
        toast.error('Erreur serveur. Veuillez réessayer.');
        break;
      default:
        toast.error('Une erreur est survenue.');
    }
  } else if (error.request) {
    // Pas de réponse du serveur
    toast.error('Impossible de contacter le serveur. Vérifiez votre connexion.');
  } else {
    // Erreur lors de la configuration de la requête
    toast.error('Erreur: ' + error.message);
  }
}
```

---

## 🧪 Tests et Débogage

### 1. Tester la configuration

```typescript
// Test dans la console ou un composant
import { PaymentService } from '@/services/payment.service';

// Tester la config PayDunya
const testConfig = async () => {
  try {
    const config = await PaymentService.testConfig();
    console.log('Config PayDunya:', config);
  } catch (error) {
    console.error('Erreur config:', error);
  }
};
```

### 2. Numéro de test officiel

Pour tester les paiements en mode sandbox, utilisez :

```
Téléphone de test: +221 775 588 834
```

### 3. Tester un paiement complet

```bash
# Étape 1: Créer une commande
curl -X POST http://localhost:3004/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"designId": "design-uuid", "quantity": 1}],
    "shippingAddress": {
      "fullName": "Test User",
      "phone": "+221775588834",
      "address": "Test Address",
      "city": "Dakar"
    }
  }'

# Étape 2: Noter le orderNumber retourné

# Étape 3: Initialiser le paiement
curl -X POST http://localhost:3004/paydunya/payment \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": {
      "total_amount": 5000,
      "description": "Test",
      "customer": {
        "name": "Test",
        "email": "test@test.com",
        "phone": "+221775588834"
      }
    },
    "store": {"name": "Printalma"},
    "actions": {
      "callback_url": "http://localhost:3004/paydunya/callback",
      "return_url": "http://localhost:3001/success",
      "cancel_url": "http://localhost:3001/cancel"
    },
    "custom_data": {"order_number": "ORD-XXX"}
  }'

# Étape 4: Ouvrir l'URL redirect_url dans un navigateur
```

### 4. Activer les logs de débogage

```typescript
// src/lib/api.ts
apiClient.interceptors.request.use((config) => {
  console.log('API Request:', {
    method: config.method,
    url: config.url,
    data: config.data,
  });
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  }
);
```

### 5. Simuler les différents statuts de paiement

```typescript
// Pour tester les différentes pages
// Success
router.push('/orders/ORD-TEST-001/success?token=test_abc123');

// Cancel
router.push('/orders/ORD-TEST-001/cancel');

// Pending (pour tester le polling)
// Modifier temporairement le service pour retourner 'pending'
```

---

## 📱 Responsive Design

N'oubliez pas de rendre votre interface responsive :

```tsx
// Exemple de design responsive pour le checkout
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="max-w-7xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Résumé commande - colonne gauche sur desktop */}
      <div className="order-2 lg:order-1">
        {/* Contenu */}
      </div>

      {/* Formulaire paiement - colonne droite sur desktop */}
      <div className="order-1 lg:order-2">
        {/* Formulaire */}
      </div>
    </div>
  </div>
</div>
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Ne jamais exposer les clés API PayDunya côté frontend**
   - Toutes les requêtes PayDunya passent par le backend

2. **Valider les données utilisateur**
   ```typescript
   // Validation du téléphone
   const isValidPhone = (phone: string) => {
     const phoneRegex = /^\+221[0-9]{9}$/;
     return phoneRegex.test(phone);
   };

   // Validation de l'email
   const isValidEmail = (email: string) => {
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     return emailRegex.test(email);
   };
   ```

3. **Toujours vérifier le statut du paiement côté backend**
   - Ne jamais faire confiance uniquement aux paramètres d'URL

4. **Protéger les routes sensibles**
   ```typescript
   // Middleware d'authentification
   export const withAuth = (handler: any) => {
     return async (req: NextApiRequest, res: NextApiResponse) => {
       const token = req.headers.authorization?.split(' ')[1];

       if (!token) {
         return res.status(401).json({ error: 'Non authentifié' });
       }

       // Vérifier le token...
       return handler(req, res);
     };
   };
   ```

---

## 📞 Support

### En cas de problème

1. **Vérifier les logs du backend**
   ```bash
   # Logs en temps réel
   tail -f logs/application.log | grep PayDunya
   ```

2. **Tester la config PayDunya**
   ```bash
   curl http://localhost:3004/paydunya/test-config
   ```

3. **Contacter le support**
   - **Email**: [email protected]
   - **Documentation API**: https://developers.paydunya.com/doc/FR/introduction
   - **Issues GitHub**: (votre repo)

---

## 📚 Ressources Supplémentaires

- [Documentation PayDunya officielle](https://developers.paydunya.com/doc/FR/introduction)
- [Guide de migration PayTech → PayDunya](./PAYDUNYA_MIGRATION_GUIDE.md)
- [Quickstart PayDunya](./PAYDUNYA_QUICKSTART.md)
- [Résultats des tests](./PAYDUNYA_TEST_RESULTS.md)

---

## ✅ Checklist d'intégration

- [ ] Configuration des variables d'environnement
- [ ] Installation des dépendances (axios, react-query, etc.)
- [ ] Création du client API avec intercepteurs
- [ ] Définition des types TypeScript
- [ ] Implémentation du service de paiement
- [ ] Création du hook usePayment
- [ ] Page de checkout fonctionnelle
- [ ] Page de succès avec vérification du statut
- [ ] Page d'annulation
- [ ] Gestion des erreurs complète
- [ ] Tests en mode sandbox avec le numéro +221 775 588 834
- [ ] Responsive design sur mobile
- [ ] Validation des données utilisateur
- [ ] Messages d'erreur clairs pour l'utilisateur
- [ ] Loading states pendant les requêtes
- [ ] Documentation interne pour l'équipe

---

**Version**: 1.0
**Dernière mise à jour**: 3 Novembre 2025
**Auteur**: Claude Code - Printalma Backend Team

