# Guide d'Intégration Frontend - Paiements PayTech

Ce guide explique comment intégrer les paiements PayTech dans votre application frontend (React, Vue, Angular, etc.).

**Basé exclusivement sur:**
- Documentation PayTech: https://doc.intech.sn/doc_paytech.php
- API Backend: http://localhost:3004

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration](#configuration)
3. [Créer une commande avec paiement](#créer-une-commande-avec-paiement)
4. [Afficher les statuts de paiement](#afficher-les-statuts-de-paiement)
5. [Pages de redirection](#pages-de-redirection)
6. [Composants React prêts à l'emploi](#composants-react-prêts-à-lemploi)
7. [Exemples pour Vue.js](#exemples-pour-vuejs)
8. [Exemples pour Angular](#exemples-pour-angular)
9. [Gestion des erreurs](#gestion-des-erreurs)
10. [Tests](#tests)

---

## Vue d'ensemble

### Workflow complet du paiement

```
┌─────────────┐
│   CLIENT    │
│  (Frontend) │
└──────┬──────┘
       │
       │ 1. POST /orders (paymentMethod: "PAYTECH", initiatePayment: true)
       ▼
┌─────────────┐
│   BACKEND   │
│   (NestJS)  │◄─── 5. IPN Callback
└──────┬──────┘     (PayTech → Backend)
       │
       │ 2. Retourne: {token, redirect_url}
       ▼
┌─────────────┐
│   CLIENT    │
│  Redirige   │
└──────┬──────┘
       │
       │ 3. Ouvre redirect_url dans navigateur
       ▼
┌─────────────┐
│   PAYTECH   │
│   (Orange   │
│   Money,    │
│   Wave...)  │
└──────┬──────┘
       │
       │ 4. Utilisateur paie
       │
       ├──► 6a. Succès → success_url
       └──► 6b. Annulation → cancel_url
```

---

## Configuration

### 1. Variables d'environnement

Créez un fichier `.env` dans votre frontend:

```env
# API Backend
VITE_API_URL=http://localhost:3004
# ou pour Create React App:
REACT_APP_API_URL=http://localhost:3004
# ou pour Next.js:
NEXT_PUBLIC_API_URL=http://localhost:3004

# URLs de redirection (correspond à votre frontend)
VITE_PAYMENT_SUCCESS_URL=http://localhost:5174/payment/success
VITE_PAYMENT_CANCEL_URL=http://localhost:5174/payment/cancel
```

### 2. Configuration Axios

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
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
      // Token expiré, rediriger vers login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Créer une commande avec paiement

### Méthode 1: Lors de la création de commande (RECOMMANDÉ)

```typescript
// src/services/orderService.ts
import apiClient from './api';

interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  size?: string;
  colorId?: number;
}

interface CreateOrderData {
  orderItems: OrderItem[];
  totalAmount: number;
  phoneNumber: string;
  shippingName: string;
  shippingStreet?: string;
  shippingCity: string;
  shippingRegion?: string;
  shippingPostalCode?: string;
  shippingCountry: string;
  notes?: string;
  paymentMethod: 'PAYTECH' | 'CASH_ON_DELIVERY';
  initiatePayment: boolean; // IMPORTANT: true pour PayTech
}

interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    orderNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus?: string;
    payment?: {
      token: string;
      redirect_url: string;
    };
  };
}

export async function createOrderWithPayment(
  orderData: CreateOrderData
): Promise<PaymentResponse> {
  try {
    const response = await apiClient.post<PaymentResponse>('/orders', {
      ...orderData,
      paymentMethod: 'PAYTECH',
      initiatePayment: true, // ⭐ Crucial pour initialiser PayTech
    });

    return response.data;
  } catch (error: any) {
    console.error('Erreur création commande:', error);
    throw new Error(
      error.response?.data?.message || 'Erreur lors de la création de la commande'
    );
  }
}
```

### Utilisation dans un composant

```typescript
// src/components/Checkout.tsx
import React, { useState } from 'react';
import { createOrderWithPayment } from '../services/orderService';

export function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Préparer les données de commande
      const orderData = {
        orderItems: [
          {
            productId: 1,
            quantity: 2,
            unitPrice: 15000,
            size: 'L',
            colorId: 5,
          },
        ],
        totalAmount: 30000,
        phoneNumber: '+221771234567',
        shippingName: 'Jean Dupont',
        shippingCity: 'Dakar',
        shippingCountry: 'Sénégal',
        paymentMethod: 'PAYTECH',
        initiatePayment: true,
      };

      // Créer la commande et initialiser le paiement
      const response = await createOrderWithPayment(orderData);

      if (response.success && response.data.payment) {
        // ✅ Paiement initialisé, rediriger vers PayTech
        console.log('Commande créée:', response.data.orderNumber);
        console.log('Redirection vers PayTech...');

        // Redirection automatique vers PayTech
        window.location.href = response.data.payment.redirect_url;
      } else {
        setError('Le paiement n\'a pas pu être initialisé');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Finaliser la commande</h1>

      {/* Votre formulaire de checkout ici */}

      <button
        onClick={handlePayment}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? 'Traitement...' : 'Payer avec PayTech'}
      </button>

      {error && (
        <div className="alert alert-danger mt-3">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
```

---

## Afficher les statuts de paiement

### Types TypeScript

```typescript
// src/types/order.ts
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REJECTED' | 'CANCELLED';

export interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  paymentToken?: string;
  paymentDate?: string;
  paymentDetails?: {
    method?: string;
    phone?: string;
    amount?: number;
    currency?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Badge de statut

```typescript
// src/components/PaymentStatusBadge.tsx
import React from 'react';
import type { PaymentStatus } from '../types/order';

interface StatusConfig {
  label: string;
  className: string;
  icon: string;
  description: string;
}

const STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  PENDING: {
    label: 'En attente',
    className: 'badge bg-warning text-dark',
    icon: '⏳',
    description: 'Le paiement est en cours de traitement',
  },
  PAID: {
    label: 'Payé',
    className: 'badge bg-success',
    icon: '✅',
    description: 'Le paiement a été confirmé avec succès',
  },
  FAILED: {
    label: 'Échoué',
    className: 'badge bg-danger',
    icon: '❌',
    description: 'La transaction a été refusée',
  },
  REJECTED: {
    label: 'Rejeté',
    className: 'badge bg-danger',
    icon: '🚫',
    description: 'Le paiement a été rejeté par l\'utilisateur',
  },
  CANCELLED: {
    label: 'Annulé',
    className: 'badge bg-secondary',
    icon: '⛔',
    description: 'Le paiement a été annulé',
  },
};

interface Props {
  status?: PaymentStatus;
  showDescription?: boolean;
}

export function PaymentStatusBadge({ status, showDescription = false }: Props) {
  if (!status) {
    return <span className="badge bg-secondary">Non payé</span>;
  }

  const config = STATUS_CONFIG[status];

  return (
    <div className="payment-status">
      <span className={config.className}>
        {config.icon} {config.label}
      </span>
      {showDescription && (
        <small className="text-muted d-block mt-1">
          {config.description}
        </small>
      )}
    </div>
  );
}
```

### Composant détails de commande

```typescript
// src/components/OrderDetails.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import type { Order } from '../types/order';

interface Props {
  orderId: number;
}

export function OrderDetails({ orderId }: Props) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();

    // Polling toutes les 5 secondes si le paiement est PENDING
    const interval = setInterval(() => {
      if (order?.paymentStatus === 'PENDING') {
        fetchOrder();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [orderId, order?.paymentStatus]);

  const fetchOrder = async () => {
    try {
      const response = await apiClient.get(`/orders/${orderId}`);
      if (response.data.success) {
        setOrder(response.data.data);
      }
    } catch (error) {
      console.error('Erreur chargement commande:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!order) {
    return <div>Commande introuvable</div>;
  }

  return (
    <div className="order-details card">
      <div className="card-header">
        <h3>Commande #{order.orderNumber}</h3>
      </div>

      <div className="card-body">
        {/* Statut de la commande */}
        <div className="mb-3">
          <strong>Statut de la commande:</strong> {order.status}
        </div>

        {/* Statut du paiement */}
        <div className="mb-3">
          <strong>Statut du paiement:</strong>
          <br />
          <PaymentStatusBadge status={order.paymentStatus} showDescription />
        </div>

        {/* Montant */}
        <div className="mb-3">
          <strong>Montant:</strong> {order.totalAmount.toLocaleString('fr-FR')} FCFA
        </div>

        {/* Détails du paiement si disponibles */}
        {order.paymentDetails && (
          <div className="mb-3">
            <strong>Détails du paiement:</strong>
            <ul className="list-unstyled mt-2">
              {order.paymentDetails.method && (
                <li>Méthode: {order.paymentDetails.method}</li>
              )}
              {order.paymentDetails.phone && (
                <li>Téléphone: {order.paymentDetails.phone}</li>
              )}
              {order.transactionId && (
                <li>ID Transaction: {order.transactionId}</li>
              )}
              {order.paymentDate && (
                <li>
                  Date: {new Date(order.paymentDate).toLocaleString('fr-FR')}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Bouton réessayer si paiement échoué */}
        {(order.paymentStatus === 'FAILED' ||
          order.paymentStatus === 'REJECTED' ||
          order.paymentStatus === 'CANCELLED') && (
          <button
            onClick={() => window.location.href = `/checkout?orderId=${order.id}`}
            className="btn btn-warning"
          >
            Réessayer le paiement
          </button>
        )}

        {/* Message si paiement en attente */}
        {order.paymentStatus === 'PENDING' && (
          <div className="alert alert-info">
            ⏳ Votre paiement est en cours de traitement.
            Cette page se mettra à jour automatiquement.
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Pages de redirection

### Page de succès

```typescript
// src/pages/PaymentSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    // PayTech peut renvoyer ref_command dans les params
    const refCommand = searchParams.get('ref_command') ||
                      searchParams.get('orderNumber');

    if (refCommand) {
      setOrderNumber(refCommand);
      verifyPayment(refCommand);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const verifyPayment = async (orderNum: string) => {
    try {
      // Optionnel: Vérifier le statut côté backend
      const response = await apiClient.get(`/orders?orderNumber=${orderNum}`);

      if (response.data.success) {
        const order = response.data.data[0];
        if (order.paymentStatus === 'PAID') {
          console.log('✅ Paiement confirmé!');
        }
      }
    } catch (error) {
      console.error('Erreur vérification:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Vérification...</span>
        </div>
        <p className="mt-3">Vérification du paiement en cours...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card text-center shadow-lg">
        <div className="card-body p-5">
          <div className="mb-4">
            <div
              className="rounded-circle bg-success d-inline-flex align-items-center justify-content-center"
              style={{ width: '100px', height: '100px' }}
            >
              <span style={{ fontSize: '3rem' }}>✅</span>
            </div>
          </div>

          <h1 className="card-title text-success mb-3">
            Paiement réussi !
          </h1>

          <p className="card-text text-muted mb-4">
            Votre paiement a été effectué avec succès.
            {orderNumber && (
              <>
                <br />
                <strong>Commande: {orderNumber}</strong>
              </>
            )}
          </p>

          <div className="d-flex gap-3 justify-content-center">
            <button
              onClick={() => navigate('/orders')}
              className="btn btn-success"
            >
              Voir mes commandes
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn btn-outline-secondary"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Page d'annulation

```typescript
// src/pages/PaymentCancel.tsx
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('ref_command') ||
                      searchParams.get('orderNumber');

  return (
    <div className="container mt-5">
      <div className="card text-center shadow-lg">
        <div className="card-body p-5">
          <div className="mb-4">
            <div
              className="rounded-circle bg-warning d-inline-flex align-items-center justify-content-center"
              style={{ width: '100px', height: '100px' }}
            >
              <span style={{ fontSize: '3rem' }}>⚠️</span>
            </div>
          </div>

          <h1 className="card-title text-warning mb-3">
            Paiement annulé
          </h1>

          <p className="card-text text-muted mb-4">
            Vous avez annulé le paiement.
            {orderNumber && (
              <>
                <br />
                Votre commande <strong>{orderNumber}</strong> est toujours en attente.
              </>
            )}
          </p>

          <div className="d-flex gap-3 justify-content-center">
            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-warning"
            >
              Réessayer le paiement
            </button>
            <button
              onClick={() => navigate('/orders')}
              className="btn btn-outline-secondary"
            >
              Voir mes commandes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Configuration des routes (React Router)

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PaymentSuccessPage } from './pages/PaymentSuccess';
import { PaymentCancelPage } from './pages/PaymentCancel';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Autres routes */}
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Composants React prêts à l'emploi

Un composant React complet est disponible dans:
```
frontend-examples/paytech-payment-status-component.tsx
```

### Utilisation

```typescript
import { PayTechPaymentComponent } from './components/PayTechPaymentComponent';

function MyOrderPage() {
  const order = {
    id: 123,
    orderNumber: 'ORD-1234567890',
    totalAmount: 50000,
    status: 'PENDING',
    paymentStatus: 'PENDING',
  };

  return (
    <PayTechPaymentComponent
      order={order}
      apiBaseUrl="http://localhost:3004"
      authToken={localStorage.getItem('access_token')}
    />
  );
}
```

---

## Exemples pour Vue.js

### Service de paiement

```typescript
// src/services/paymentService.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export interface PaymentInitResponse {
  success: boolean;
  data: {
    token: string;
    redirect_url: string;
    orderNumber: string;
  };
}

export async function createOrderWithPayment(orderData: any): Promise<PaymentInitResponse> {
  const token = localStorage.getItem('access_token');

  const response = await apiClient.post('/orders', {
    ...orderData,
    paymentMethod: 'PAYTECH',
    initiatePayment: true,
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}
```

### Composant Vue

```vue
<!-- src/components/PaymentButton.vue -->
<template>
  <div>
    <button
      @click="handlePayment"
      :disabled="loading"
      class="btn btn-primary"
    >
      {{ loading ? 'Traitement...' : 'Payer avec PayTech' }}
    </button>

    <div v-if="error" class="alert alert-danger mt-3">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { createOrderWithPayment } from '@/services/paymentService';

const props = defineProps<{
  orderData: any;
}>();

const loading = ref(false);
const error = ref<string | null>(null);

async function handlePayment() {
  loading.value = true;
  error.value = null;

  try {
    const response = await createOrderWithPayment(props.orderData);

    if (response.success && response.data.redirect_url) {
      // Rediriger vers PayTech
      window.location.href = response.data.redirect_url;
    }
  } catch (err: any) {
    error.value = err.message || 'Erreur lors du paiement';
  } finally {
    loading.value = false;
  }
}
</script>
```

---

## Exemples pour Angular

### Service

```typescript
// src/app/services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface PaymentResponse {
  success: boolean;
  data: {
    token: string;
    redirect_url: string;
    orderNumber: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createOrderWithPayment(orderData: any): Observable<PaymentResponse> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<PaymentResponse>(`${this.apiUrl}/orders`, {
      ...orderData,
      paymentMethod: 'PAYTECH',
      initiatePayment: true
    }, { headers });
  }
}
```

### Composant

```typescript
// src/app/components/payment/payment.component.ts
import { Component } from '@angular/core';
import { PaymentService } from '../../services/payment.service';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent {
  loading = false;
  error: string | null = null;

  constructor(private paymentService: PaymentService) {}

  handlePayment(orderData: any) {
    this.loading = true;
    this.error = null;

    this.paymentService.createOrderWithPayment(orderData).subscribe({
      next: (response) => {
        if (response.success && response.data.redirect_url) {
          // Rediriger vers PayTech
          window.location.href = response.data.redirect_url;
        }
      },
      error: (err) => {
        this.error = err.message || 'Erreur lors du paiement';
        this.loading = false;
      }
    });
  }
}
```

---

## Gestion des erreurs

### Types d'erreurs possibles

```typescript
interface PaymentError {
  type: 'NETWORK' | 'VALIDATION' | 'PAYMENT_FAILED' | 'UNAUTHORIZED';
  message: string;
  details?: any;
}

function handlePaymentError(error: any): PaymentError {
  // Erreur réseau
  if (!error.response) {
    return {
      type: 'NETWORK',
      message: 'Impossible de se connecter au serveur. Vérifiez votre connexion.',
    };
  }

  // Erreur d'authentification
  if (error.response.status === 401) {
    return {
      type: 'UNAUTHORIZED',
      message: 'Votre session a expiré. Veuillez vous reconnecter.',
    };
  }

  // Erreur de validation
  if (error.response.status === 400) {
    return {
      type: 'VALIDATION',
      message: error.response.data.message || 'Données invalides',
      details: error.response.data,
    };
  }

  // Erreur de paiement
  if (error.response.status >= 500) {
    return {
      type: 'PAYMENT_FAILED',
      message: 'Une erreur est survenue lors du paiement. Veuillez réessayer.',
    };
  }

  return {
    type: 'PAYMENT_FAILED',
    message: error.response.data.message || 'Erreur inconnue',
  };
}
```

### Composant d'erreur

```typescript
// src/components/PaymentError.tsx
import React from 'react';

interface Props {
  error: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function PaymentError({ error, onRetry, onCancel }: Props) {
  if (!error) return null;

  return (
    <div className="alert alert-danger" role="alert">
      <h4 className="alert-heading">Erreur de paiement</h4>
      <p>{error}</p>
      <hr />
      <div className="d-flex gap-2">
        {onRetry && (
          <button onClick={onRetry} className="btn btn-sm btn-outline-danger">
            Réessayer
          </button>
        )}
        {onCancel && (
          <button onClick={onCancel} className="btn btn-sm btn-outline-secondary">
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Tests

### Test manuel avec curl

```bash
# 1. Créer une commande avec paiement
curl -X POST http://localhost:3004/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderItems": [{"productId": 1, "quantity": 1, "unitPrice": 10000}],
    "totalAmount": 10000,
    "phoneNumber": "+221771234567",
    "shippingName": "Test",
    "shippingCity": "Dakar",
    "shippingCountry": "Sénégal",
    "paymentMethod": "PAYTECH",
    "initiatePayment": true
  }'

# Réponse attendue:
# {
#   "success": true,
#   "data": {
#     "payment": {
#       "token": "abc123",
#       "redirect_url": "https://paytech.sn/payment/checkout/abc123"
#     }
#   }
# }

# 2. Vérifier le statut d'une commande
curl -X GET http://localhost:3004/orders/123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Tests automatisés (Jest)

```typescript
// src/services/__tests__/paymentService.test.ts
import { createOrderWithPayment } from '../orderService';
import apiClient from '../api';

jest.mock('../api');

describe('Payment Service', () => {
  it('should create order with payment', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          orderNumber: 'ORD-123',
          payment: {
            token: 'test-token',
            redirect_url: 'https://paytech.sn/payment/checkout/test-token',
          },
        },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await createOrderWithPayment({
      orderItems: [],
      totalAmount: 10000,
      paymentMethod: 'PAYTECH',
      initiatePayment: true,
    });

    expect(result.success).toBe(true);
    expect(result.data.payment).toBeDefined();
    expect(result.data.payment.redirect_url).toContain('paytech.sn');
  });
});
```

---

## Checklist d'intégration

### Configuration
- [ ] Variables d'environnement configurées
- [ ] Axios/Fetch configuré avec intercepteurs
- [ ] Token JWT géré correctement

### Création de commande
- [ ] Fonction `createOrderWithPayment` implémentée
- [ ] `paymentMethod: "PAYTECH"` défini
- [ ] `initiatePayment: true` défini
- [ ] Redirection automatique vers `redirect_url`

### Pages de redirection
- [ ] Page `/payment/success` créée
- [ ] Page `/payment/cancel` créée
- [ ] Routes configurées dans le router

### Affichage des statuts
- [ ] Badge de statut implémenté
- [ ] 5 statuts gérés (PENDING, PAID, FAILED, REJECTED, CANCELLED)
- [ ] Polling automatique pour PENDING

### Gestion des erreurs
- [ ] Erreurs réseau gérées
- [ ] Erreurs d'authentification gérées
- [ ] Messages utilisateur clairs
- [ ] Boutons de réessai présents

### Tests
- [ ] Test de création de commande
- [ ] Test de redirection PayTech
- [ ] Test des pages success/cancel
- [ ] Test du polling de statut

---

## Support

Pour toute question:
1. Consultez la documentation backend: `PAYTECH_INTEGRATION_GUIDE.md`
2. Vérifiez les exemples dans `frontend-examples/`
3. Testez les endpoints avec Postman ou curl

---

## Ressources

- **Backend API**: http://localhost:3004
- **Documentation PayTech**: https://doc.intech.sn/doc_paytech.php
- **Composant React**: `frontend-examples/paytech-payment-status-component.tsx`
- **Guide backend**: `PAYTECH_INTEGRATION_GUIDE.md`

---

**Version**: 1.0.0
**Date**: 29 Janvier 2025
**Auteur**: Printalma Backend Team
