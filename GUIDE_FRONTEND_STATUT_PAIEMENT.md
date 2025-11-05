# Guide Frontend - Gestion des Statuts de Paiement PayDunya

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Installation du Service de Webhook](#installation-du-service-de-webhook)
3. [Intégration avec les Composants React](#intégration-avec-les-composants-react)
4. [Gestion des Mises à Jour de Statut](#gestion-des-mises-à-jour-de-statut)
5. [Polling Automatique](#polling-automatique)
6. [Gestion des Cas d'Erreur](#gestion-des-cas-derreur)
7. [Exemples Pratiques](#exemples-pratiques)
8. [Tests et Débogage](#tests-et-débogage)

## Vue d'ensemble

Ce guide explique comment intégrer le service de webhook PayDunya pour gérer automatiquement les mises à jour de statut de paiement, en particulier la transition de **PENDING** → **PAID**.

### Architecture

```
Frontend (React)               Backend (NestJS)                PayDunya
     │                               │                            │
     │ 1. Créer commande              │                            │
     ├─────────────────────────────→ │                            │
     │                               │ 2. Générer paiement        │
     │                               ├───────────────────────────→ │
     │                               │                            │
     │ 3. Rediriger vers paiement     │                            │
     │ ←───────────────────────────── │                            │
     │                               │                            │
     │ 4. Webhook reçu               │ 5. Webhook traité          │
     │ ←───────────────────────────── ←─────────────────────────── │
     │                               │                            │
     │ 6. Mise à jour du statut PAID  │                            │
     │                               │                            │
```

## Installation du Service de Webhook

### 1. Importer le service

Dans votre service principal ou un fichier dédié :

```typescript
// src/services/index.ts
import paymentWebhookService from './paymentWebhookService';
import orderService from './orderService';

export {
  paymentWebhookService,
  orderService
};
```

### 2. Initialiser le service

Dans votre composant principal (App.tsx) :

```typescript
import { useEffect } from 'react';
import { paymentWebhookService } from './services';

function App() {
  useEffect(() => {
    // Démarrer l'écoute des webhooks en mode développement
    if (process.env.NODE_ENV === 'development') {
      paymentWebhookService.startWebhookListener();
    }
  }, []);

  return (
    // Votre application
  );
}
```

## Intégration avec les Composants React

### 1. Hook pour le suivi des statuts de paiement

```typescript
// src/hooks/usePaymentStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { paymentWebhookService } from '../services';
import { Order } from '../types/order';

interface UsePaymentStatusReturn {
  order: Order | null;
  isLoading: boolean;
  error: string | null;
  checkStatus: () => Promise<void>;
  forceSuccess: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

export function usePaymentStatus(orderId: number): UsePaymentStatusReturn {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const checkStatus = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await paymentWebhookService.verifyOrderStatus(orderId);

      if (response.success && response.order) {
        setOrder(response.order);

        // Si le statut a changé, arrêter le polling
        if (response.order.paymentStatus === 'PAID' || response.order.paymentStatus === 'FAILED') {
          stopPolling();
        }
      } else {
        setError(response.message || 'Erreur lors de la vérification du statut');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const forceSuccess = useCallback(async () => {
    if (!orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await paymentWebhookService.forcePaymentSuccess(orderId);

      if (response.success && response.order) {
        setOrder(response.order);
        stopPolling();
      } else {
        setError(response.message || 'Erreur lors du forçage du statut');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const startPolling = useCallback(() => {
    // Vérifier immédiatement
    checkStatus();

    // Puis vérifier toutes les 5 secondes
    const interval = setInterval(checkStatus, 5000);
    setPollingInterval(interval);
  }, [checkStatus]);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  // Nettoyer le polling au démontage
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    order,
    isLoading,
    error,
    checkStatus,
    forceSuccess,
    startPolling,
    stopPolling
  };
}
```

### 2. Composant de suivi de paiement

```typescript
// src/components/PaymentStatusTracker.tsx
import React from 'react';
import { usePaymentStatus } from '../hooks/usePaymentStatus';
import { PaymentStatusBadge } from './PaymentStatusBadge';

interface PaymentStatusTrackerProps {
  orderId: number;
  onPaymentComplete?: (order: any) => void;
  onPaymentFailed?: (order: any) => void;
}

export function PaymentStatusTracker({
  orderId,
  onPaymentComplete,
  onPaymentFailed
}: PaymentStatusTrackerProps) {
  const {
    order,
    isLoading,
    error,
    checkStatus,
    forceSuccess,
    startPolling
  } = usePaymentStatus(orderId);

  // Démarrer le polling automatique
  React.useEffect(() => {
    if (orderId && order?.paymentStatus === 'PENDING') {
      startPolling();
    }
  }, [orderId, order?.paymentStatus, startPolling]);

  // Gérer les changements de statut
  React.useEffect(() => {
    if (order) {
      if (order.paymentStatus === 'PAID' && onPaymentComplete) {
        onPaymentComplete(order);
      } else if (order.paymentStatus === 'FAILED' && onPaymentFailed) {
        onPaymentFailed(order);
      }
    }
  }, [order, onPaymentComplete, onPaymentFailed]);

  if (!order) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Statut du Paiement</h3>
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Commande:</span>
          <span className="font-medium">{order.orderNumber}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-600">Montant:</span>
          <span className="font-medium">{order.totalAmount.toLocaleString()} FCFA</span>
        </div>

        {order.transactionId && (
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction:</span>
            <span className="font-medium text-sm">{order.transactionId}</span>
          </div>
        )}

        {order.lastPaymentAttemptAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Dernière tentative:</span>
            <span className="text-sm text-gray-500">
              {new Date(order.lastPaymentAttemptAt).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mt-4 flex items-center text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Vérification du statut...
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Actions pour le développement */}
      {process.env.NODE_ENV === 'development' && order.paymentStatus === 'PENDING' && (
        <div className="mt-4 space-y-2">
          <button
            onClick={checkStatus}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Vérifier le statut
          </button>

          <button
            onClick={forceSuccess}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Forcer le succès (test)
          </button>
        </div>
      )}

      {/* Instructions pour l'utilisateur */}
      {order.paymentStatus === 'PENDING' && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          <p className="font-medium mb-1">💡 Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Effectuez le paiement sur la page PayDunya</li>
            <li>Le statut sera mis à jour automatiquement</li>
            <li>Vous pouvez aussi cliquer sur "Vérifier le statut"</li>
          </ul>
        </div>
      )}
    </div>
  );
}
```

## Gestion des Mises à Jour de Statut

### 1. Après la création de commande

```typescript
// src/components/OrderForm.tsx
import { useState } from 'react';
import { orderService } from '../services';
import { PaymentStatusTracker } from './PaymentStatusTracker';

export function OrderForm() {
  const [createdOrder, setCreatedOrder] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');

  const handleSubmit = async (formData: any) => {
    try {
      const response = await orderService.createGuestOrder(formData);

      if (response.success) {
        setCreatedOrder(response.order);
        setPaymentUrl(response.paymentData.paymentUrl);
      }
    } catch (error) {
      console.error('Erreur lors de la création de commande:', error);
    }
  };

  const handlePaymentComplete = (order: any) => {
    console.log('✅ Paiement réussi!', order);
    // Rediriger vers la page de succès
    window.location.href = `/payment/success?order=${order.id}`;
  };

  const handlePaymentFailed = (order: any) => {
    console.log('❌ Paiement échoué', order);
    // Rediriger vers la page d'échec
    window.location.href = `/payment/failed?order=${order.id}`;
  };

  return (
    <div>
      {/* Formulaire de commande */}
      <form onSubmit={handleSubmit}>
        {/* ... champs du formulaire ... */}
      </form>

      {/* URL de paiement */}
      {paymentUrl && (
        <div className="mt-4">
          <a
            href={paymentUrl}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Payer maintenant
          </a>
        </div>
      )}

      {/* Suivi du statut de paiement */}
      {createdOrder && (
        <PaymentStatusTracker
          orderId={createdOrder.id}
          onPaymentComplete={handlePaymentComplete}
          onPaymentFailed={handlePaymentFailed}
        />
      )}
    </div>
  );
}
```

### 2. Page de succès de paiement

```typescript
// src/pages/PaymentSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService } from '../services';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('order');
    const token = searchParams.get('token');

    if (orderId) {
      // Récupérer les détails de la commande
      orderService.getOrderById(parseInt(orderId))
        .then(response => {
          if (response.success) {
            setOrder(response.order);
          }
        })
        .catch(error => {
          console.error('Erreur:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Paiement réussi !
          </h1>

          <p className="text-gray-600 mb-6">
            Votre paiement a été traité avec succès.
          </p>

          {order && (
            <div className="text-left bg-gray-50 p-4 rounded mb-6">
              <h3 className="font-semibold mb-2">Détails de la commande:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Numéro:</span>
                  <span className="font-medium">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Montant:</span>
                  <span className="font-medium">{order.totalAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span>Statut:</span>
                  <span className="font-medium text-green-600">{order.paymentStatus}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/orders'}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voir mes commandes
            </button>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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

## Polling Automatique

### 1. Service de polling avancé

```typescript
// src/services/paymentPollingService.ts
import { paymentWebhookService } from './paymentWebhookService';

export interface PollingConfig {
  interval: number; // en millisecondes
  maxAttempts: number;
  backoffMultiplier: number;
}

export class PaymentPollingService {
  private static instance: PaymentPollingService;
  private activePollers = new Map<number, NodeJS.Timeout>();

  private constructor() {}

  static getInstance(): PaymentPollingService {
    if (!PaymentPollingService.instance) {
      PaymentPollingService.instance = new PaymentPollingService();
    }
    return PaymentPollingService.instance;
  }

  /**
   * Démarre le polling pour une commande
   */
  startPolling(
    orderId: number,
    onStatusChange: (order: any) => void,
    config: Partial<PollingConfig> = {}
  ): void {
    const defaultConfig: PollingConfig = {
      interval: 3000, // 3 secondes
      maxAttempts: 60, // 3 minutes maximum
      backoffMultiplier: 1.2
    };

    const finalConfig = { ...defaultConfig, ...config };
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const response = await paymentWebhookService.verifyOrderStatus(orderId);

        if (response.success && response.order) {
          onStatusChange(response.order);

          // Arrêter le polling si le paiement est finalisé
          if (['PAID', 'FAILED', 'CANCELLED'].includes(response.order.paymentStatus)) {
            this.stopPolling(orderId);
            return;
          }
        }

        // Arrêter après le nombre maximum de tentatives
        if (attempts >= finalConfig.maxAttempts) {
          console.warn(`Polling arrêté après ${attempts} tentatives pour la commande ${orderId}`);
          this.stopPolling(orderId);
          return;
        }

        // Augmenter l'intervalle (backoff exponentiel)
        const nextInterval = finalConfig.interval * Math.pow(finalConfig.backoffMultiplier, attempts - 1);
        const timeoutId = setTimeout(poll, Math.min(nextInterval, 30000)); // Maximum 30 secondes

        this.activePollers.set(orderId, timeoutId);

      } catch (error) {
        console.error(`Erreur lors du polling pour la commande ${orderId}:`, error);

        // Continuer le polling même en cas d'erreur
        const timeoutId = setTimeout(poll, finalConfig.interval);
        this.activePollers.set(orderId, timeoutId);
      }
    };

    // Démarrer immédiatement
    poll();
  }

  /**
   * Arrête le polling pour une commande
   */
  stopPolling(orderId: number): void {
    const timeoutId = this.activePollers.get(orderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activePollers.delete(orderId);
    }
  }

  /**
   * Arrête tous les pollings actifs
   */
  stopAllPolling(): void {
    this.activePollers.forEach((timeoutId, orderId) => {
      clearTimeout(timeoutId);
    });
    this.activePollers.clear();
  }

  /**
   * Vérifie si une commande est en cours de polling
   */
  isPolling(orderId: number): boolean {
    return this.activePollers.has(orderId);
  }
}

export default PaymentPollingService.getInstance();
```

### 2. Hook React avec polling avancé

```typescript
// src/hooks/useAdvancedPaymentStatus.ts
import { useState, useEffect, useCallback } from 'react';
import { paymentPollingService } from '../services/paymentPollingService';
import { Order } from '../types/order';

export function useAdvancedPaymentStatus(orderId: number) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = useCallback((updatedOrder: Order) => {
    setOrder(updatedOrder);

    // Actions selon le statut
    switch (updatedOrder.paymentStatus) {
      case 'PAID':
        console.log('✅ Paiement confirmé');
        break;
      case 'FAILED':
        console.log('❌ Paiement échoué');
        break;
      case 'CANCELLED':
        console.log('🚫 Paiement annulé');
        break;
      case 'INSUFFICIENT_FUNDS':
        console.log('💰 Fonds insuffisants');
        break;
      default:
        console.log('⏳ Statut en attente:', updatedOrder.paymentStatus);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!orderId || isPolling) return;

    setIsPolling(true);
    setError(null);

    paymentPollingService.startPolling(
      orderId,
      handleStatusChange,
      {
        interval: 2000, // 2 secondes initialement
        maxAttempts: 90, // 3 minutes maximum
        backoffMultiplier: 1.1
      }
    );
  }, [orderId, isPolling, handleStatusChange]);

  const stopPolling = useCallback(() => {
    if (orderId) {
      paymentPollingService.stopPolling(orderId);
      setIsPolling(false);
    }
  }, [orderId]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (orderId) {
        paymentPollingService.stopPolling(orderId);
      }
    };
  }, [orderId]);

  return {
    order,
    isPolling,
    error,
    startPolling,
    stopPolling
  };
}
```

## Gestion des Cas d'Erreur

### 1. Composant d'erreur de paiement

```typescript
// src/components/PaymentError.tsx
import React from 'react';

interface PaymentErrorProps {
  error: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

export function PaymentError({ error, onRetry, onContactSupport }: PaymentErrorProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Erreur de paiement
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
          </div>
          <div className="mt-4 flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm hover:bg-red-200"
              >
                Réessayer
              </button>
            )}
            {onContactSupport && (
              <button
                onClick={onContactSupport}
                className="text-red-700 underline text-sm hover:text-red-800"
              >
                Contacter le support
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 2. Gestionnaire d'erreurs global

```typescript
// src/services/errorHandler.ts
export class PaymentErrorHandler {
  static handle(error: any): string {
    // Erreurs réseau
    if (error.code === 'NETWORK_ERROR') {
      return 'Problème de connexion. Vérifiez votre internet et réessayez.';
    }

    // Erreurs de paiement spécifiques
    if (error.message?.includes('INSUFFICIENT_FUNDS')) {
      return 'Fonds insuffisants. Veuillez utiliser une autre méthode de paiement.';
    }

    if (error.message?.includes('PAYMENT_FAILED')) {
      return 'Le paiement a échoué. Veuillez réessayer.';
    }

    if (error.message?.includes('CANCELLED')) {
      return 'Le paiement a été annulé.';
    }

    // Erreurs génériques
    return error.message || 'Une erreur est survenue. Veuillez réessayer.';
  }

  static getRetryDelay(attemptNumber: number): number {
    // Délai exponentiel: 1s, 2s, 4s, 8s, 16s, 30s (max)
    return Math.min(Math.pow(2, attemptNumber - 1) * 1000, 30000);
  }

  static shouldRetry(error: any, attemptNumber: number): boolean {
    // Ne pas réessayer après 3 tentatives
    if (attemptNumber >= 3) return false;

    // Ne pas réessayer pour certaines erreurs
    const noRetryErrors = ['CANCELLED', 'INSUFFICIENT_FUNDS'];
    return !noRetryErrors.some(err => error.message?.includes(err));
  }
}
```

## Exemples Pratiques

### 1. Page complète de paiement

```typescript
// src/pages/PaymentPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdvancedPaymentStatus } from '../hooks/useAdvancedPaymentStatus';
import { PaymentStatusTracker } from '../components/PaymentStatusTracker';
import { PaymentError } from '../components/PaymentError';
import { orderService } from '../services';

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    order: updatedOrder,
    isPolling,
    error: pollingError,
    startPolling,
    stopPolling
  } = useAdvancedPaymentStatus(parseInt(orderId!));

  useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    // Charger les détails de la commande
    loadOrderDetails();
  }, [orderId]);

  useEffect(() => {
    if (updatedOrder) {
      setOrder(updatedOrder);

      // Rediriger selon le statut
      if (updatedOrder.paymentStatus === 'PAID') {
        navigate('/payment/success', { replace: true });
      } else if (updatedOrder.paymentStatus === 'FAILED') {
        navigate('/payment/failed', { replace: true });
      }
    }
  }, [updatedOrder, navigate]);

  const loadOrderDetails = async () => {
    try {
      const response = await orderService.getOrderById(parseInt(orderId!));

      if (response.success) {
        setOrder(response.order);
        setPaymentUrl(response.order.paymentData?.paymentUrl);

        // Démarrer le polling si le paiement est en attente
        if (response.order.paymentStatus === 'PENDING') {
          startPolling();
        }
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Impossible de charger les détails de la commande');
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    loadOrderDetails();
  };

  const handleContactSupport = () => {
    // Ouvrir un chat ou rediriger vers le support
    window.location.href = 'mailto:support@printalma.sn';
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-6">
          <PaymentError
            error={error}
            onRetry={retryCount < 3 ? handleRetry : undefined}
            onContactSupport={handleContactSupport}
          />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Finaliser le paiement
          </h1>

          {/* Détails de la commande */}
          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h2 className="font-semibold mb-2">Commande #{order.orderNumber}</h2>
            <p className="text-2xl font-bold text-blue-600">
              {order.totalAmount.toLocaleString()} FCFA
            </p>
          </div>

          {/* Bouton de paiement */}
          {paymentUrl && order.paymentStatus === 'PENDING' && (
            <div className="mb-6">
              <a
                href={paymentUrl}
                className="block w-full text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                Payer avec PayDunya
              </a>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Vous serez redirigé vers la page de paiement sécurisée
              </p>
            </div>
          )}

          {/* Suivi du statut */}
          <PaymentStatusTracker
            orderId={order.id}
            onPaymentComplete={(order) => navigate('/payment/success')}
            onPaymentFailed={(order) => navigate('/payment/failed')}
          />

          {/* Indicateur de polling */}
          {isPolling && (
            <div className="mt-4 flex items-center justify-center text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Vérification automatique du statut...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Tests et Débogage

### 1. Outils de test

```typescript
// src/utils/paymentTestUtils.ts
import { paymentWebhookService } from '../services/paymentWebhookService';

export class PaymentTestUtils {
  /**
   * Simule un webhook de succès
   */
  static async simulateSuccessWebhook(orderId: number, token: string) {
    const webhookData = {
      invoice_token: token,
      status: 'completed',
      transaction_id: `TEST_${Date.now()}`,
      amount_paid: 10000,
      response_code: '00'
    };

    return await paymentWebhookService.processPaydunyaWebhook(webhookData);
  }

  /**
   * Simule un webhook d'échec
   */
  static async simulateFailureWebhook(orderId: number, token: string, reason: string) {
    const webhookData = {
      invoice_token: token,
      status: 'failed',
      error_code: '02',
      cancel_reason: reason
    };

    return await paymentWebhookService.processPaydunyaWebhook(webhookData);
  }

  /**
   * Test complet du flux de paiement
   */
  static async runFullPaymentTest(orderId: number, token: string) {
    console.log('🧪 Début du test de paiement...');

    // 1. Vérifier le statut initial
    const initialStatus = await paymentWebhookService.verifyOrderStatus(orderId);
    console.log('📊 Statut initial:', initialStatus.order?.paymentStatus);

    // 2. Simuler le webhook de succès
    const webhookResult = await this.simulateSuccessWebhook(orderId, token);
    console.log('📥 Résultat webhook:', webhookResult);

    // 3. Vérifier le statut final
    const finalStatus = await paymentWebhookService.verifyOrderStatus(orderId);
    console.log('✅ Statut final:', finalStatus.order?.paymentStatus);

    return {
      initialStatus,
      webhookResult,
      finalStatus
    };
  }
}
```

### 2. Page de test (développement uniquement)

```typescript
// src/pages/TestPayment.tsx
import React, { useState } from 'react';
import { PaymentTestUtils } from '../utils/paymentTestUtils';

export function TestPayment() {
  const [orderId, setOrderId] = useState('');
  const [token, setToken] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    if (!orderId || !token) {
      alert('Veuillez entrer un ID de commande et un token');
      return;
    }

    setIsLoading(true);
    try {
      const results = await PaymentTestUtils.runFullPaymentTest(
        parseInt(orderId),
        token
      );
      setTestResults(results);
    } catch (error) {
      console.error('Erreur lors du test:', error);
      alert('Erreur lors du test: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            Page non disponible
          </h1>
          <p>Cette page n'est accessible qu'en mode développement.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test de Paiement</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration du test</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de la commande
              </label>
              <input
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Ex: 123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token PayDunya
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Ex: test_abc123"
              />
            </div>

            <button
              onClick={runTest}
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Test en cours...' : 'Lancer le test'}
            </button>
          </div>
        </div>

        {testResults && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Résultats du test</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700">Statut initial:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(testResults.initialStatus, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Résultat webhook:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(testResults.webhookResult, null, 2)}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-700">Statut final:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(testResults.finalStatus, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Résumé

Ce guide complet vous permet de:

1. **Installer et configurer** le service de webhook PayDunya
2. **Intégrer** facilement le suivi des statuts dans vos composants React
3. **Automatiser** les mises à jour avec polling intelligent
4. **Gérer** tous les cas d'erreur de manière élégante
5. **Tester** le système complet en développement

### Points clés à retenir:

- Le service `PaymentWebhookService` gère automatiquement les mises à jour PENDING → PAID
- Le hook `usePaymentStatus` simplifie l'intégration dans les composants
- Le polling automatique garantit que les changements de statut sont détectés rapidement
- Le système est entièrement testable et débogable

Avec cette configuration, vos paiements passeront automatiquement de PENDING à PAID dès que PayDunya enverra le webhook de confirmation! 🚀