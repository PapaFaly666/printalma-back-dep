# 💳 GUIDE D'INTÉGRATION PAYTECH - FRONTEND

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration](#configuration)
3. [API Endpoints](#api-endpoints)
4. [Schémas de données](#schémas-de-données)
5. [Flux de paiement](#flux-de-paiement)
6. [Exemples de code](#exemples-de-code)
7. [Gestion des erreurs](#gestion-des-erreurs)
8. [Bonnes pratiques](#bonnes-pratiques)
9. [Test et débogage](#test-et-débogage)

---

## 🎯 **VUE D'ENSEMBLE**

### **Architecture**
```
Frontend → API Backend → PayTech Service → PayTech API
    ↓           ↓              ↓             ↓
  UI/UX   →  HTTP/REST   →  Traitement  →  Paiement
```

### **Composants principaux**
- **Frontend** : Interface utilisateur
- **Backend API** : Votre serveur NestJS sur `http://localhost:3004`
- **PayTech Service** : Service de gestion des paiements
- **PayTech API** : Service externe de paiement

---

## ⚙️ **CONFIGURATION**

### **URLs de base**
```javascript
const config = {
  // Environnement de développement
  API_BASE_URL: 'http://localhost:3004',
  PAYTECH_BASE_URL: 'https://paytech.sn',

  // Environnement de production
  // API_BASE_URL: 'https://votre-api.com',

  // Endpoints Paytech
  ENDPOINTS: {
    PAYMENT: '/paytech/payment',
    STATUS: '/paytech/status',
    CONFIG: '/paytech/test-config'
  }
};
```

### **Configuration CORS**
Le backend accepte les requêtes de votre frontend. Assurez-vous que l'URL de votre frontend est autorisée.

---

## 🔌 **API ENDPOINTS**

### **1. Initialiser un paiement**
```http
POST http://localhost:3004/paytech/payment
Content-Type: application/json
```

**Réponse :**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "token": "405gzopmh97qu08",
    "redirect_url": "https://paytech.sn/payment/checkout/405gzopmh97qu08",
    "ref_command": "TEST-001"
  }
}
```

### **2. Vérifier le statut d'un paiement**
```http
GET http://localhost:3004/paytech/status/{token}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "token": "405gzopmh97qu08",
    "status": "PENDING",
    "amount": 5000,
    "currency": "XOF"
  }
}
```

### **3. Tester la configuration**
```http
GET http://localhost:3004/paytech/test-config
```

**Réponse :**
```json
{
  "success": true,
  "message": "PayTech service is configured and ready",
  "data": {
    "baseUrl": "https://paytech.sn/api",
    "hasApiKey": true,
    "hasApiSecret": true,
    "environment": "prod"
  }
}
```

---

## 📊 **SCHÉMAS DE DONNÉES**

### **PaymentRequest**
```typescript
interface PaymentRequest {
  // Champs obligatoires
  item_name: string;        // Nom du produit/service
  item_price: number;       // Montant (en centimes pour XOF)
  ref_command: string;      // Référence unique de la commande
  command_name: string;     // Description de la commande

  // Champs optionnels
  currency?: 'XOF' | 'EUR' | 'USD' | 'CAD' | 'GBP' | 'MAD'; // Par défaut: XOF
  env?: 'test' | 'prod';   // Par défaut: prod
  ipn_url?: string;         // URL de callback (doit être HTTPS en prod)
  success_url?: string;     // URL de redirection après succès
  cancel_url?: string;      // URL de redirection après annulation
  custom_field?: string;    // Données additionnelles (JSON string)
  target_payment?: string;  // Méthode de paiement spécifique
}
```

### **PaymentResponse**
```typescript
interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;           // Token unique du paiement
    redirect_url: string;    // URL de redirection Paytech
    ref_command: string;     // Référence de commande
  };
  error?: string;
}
```

### **PaymentStatus**
```typescript
interface PaymentStatus {
  success: boolean;
  message: string;
  data?: {
    token: string;
    status: 'PENDING' | 'PAID' | 'FAILED';
    amount: number;
    currency: string;
    created_at?: string;
    updated_at?: string;
  };
}
```

---

## 🔄 **FLUX DE PAIEMENT**

### **Étape 1 : Initialisation**
```typescript
// Frontend initie le paiement
const paymentData = {
  item_name: "T-Shirt Premium",
  item_price: 5000,  // 5000 XOF
  ref_command: "ORDER-2024-001",
  command_name: "Achat T-Shirt Premium",
  currency: "XOF",
  env: "test",
  success_url: `${window.location.origin}/payment/success`,
  cancel_url: `${window.location.origin}/payment/cancel`,
  custom_field: JSON.stringify({
    userId: 123,
    productId: 456,
    quantity: 1
  })
};

const response = await fetch('/paytech/payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(paymentData)
});
```

### **Étape 2 : Redirection**
```typescript
if (response.success) {
  // Rediriger vers Paytech
  window.location.href = response.data.redirect_url;
} else {
  // Gérer l'erreur
  console.error('Erreur:', response.error);
}
```

### **Étape 3 : Callbacks**
```typescript
// Page de succès
// URL : /payment/success?token=xxx&ref_command=xxx

// Page d'annulation
// URL : /payment/cancel?token=xxx&ref_command=xxx

// IPN Callback (backend)
// POST /paytech/ipn-callback
```

---

## 💻 **EXEMPLES DE CODE**

### **1. Service d'intégration (JavaScript/TypeScript)**
```typescript
// services/paytech.service.ts
export class PaytechService {
  private baseUrl = 'http://localhost:3004';

  async initializePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/paytech/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'initialisation');
      }

      return result;
    } catch (error) {
      console.error('PaytechService Error:', error);
      throw error;
    }
  }

  async checkPaymentStatus(token: string): Promise<PaymentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/paytech/status/${token}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la vérification');
      }

      return result;
    } catch (error) {
      console.error('PaytechService Error:', error);
      throw error;
    }
  }

  async testConfiguration(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/paytech/test-config`);
      return await response.json();
    } catch (error) {
      console.error('PaytechService Error:', error);
      throw error;
    }
  }
}
```

### **2. Hook React**
```typescript
// hooks/usePaytech.ts
import { useState, useCallback } from 'react';
import { PaytechService } from '../services/paytech.service';

export const usePaytech = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paytechService = new PaytechService();

  const initiatePayment = useCallback(async (paymentData: PaymentRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await paytechService.initializePayment(paymentData);

      // Rediriger vers Paytech
      window.location.href = response.data!.redirect_url;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(false);
    }
  }, [paytechService]);

  const checkStatus = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const status = await paytechService.checkPaymentStatus(token);
      setLoading(false);
      return status;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setLoading(false);
      throw err;
    }
  }, [paytechService]);

  return {
    initiatePayment,
    checkStatus,
    loading,
    error
  };
};
```

### **3. Composant React**
```typescript
// components/PaytechButton.tsx
import React from 'react';
import { usePaytech } from '../hooks/usePaytech';

interface PaytechButtonProps {
  product: {
    name: string;
    price: number;
    id: string;
  };
  user: {
    id: number;
    email: string;
  };
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const PaytechButton: React.FC<PaytechButtonProps> = ({
  product,
  user,
  onSuccess,
  onError
}) => {
  const { initiatePayment, loading, error } = usePaytech();

  const handlePayment = async () => {
    try {
      const paymentData = {
        item_name: product.name,
        item_price: product.price,
        ref_command: `ORDER-${Date.now()}-${product.id}`,
        command_name: `Achat de ${product.name}`,
        currency: 'XOF' as const,
        env: 'test' as const, // Utiliser 'prod' en production
        success_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
        custom_field: JSON.stringify({
          userId: user.id,
          productId: product.id,
          userEmail: user.email
        })
      };

      await initiatePayment(paymentData);
      onSuccess?.();

    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Erreur de paiement');
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Traitement...' : `Payer ${product.price} XOF`}
      </button>

      {error && (
        <div className="text-red-600 mt-2 text-sm">
          Erreur : {error}
        </div>
      )}
    </div>
  );
};
```

### **4. Page de traitement du retour**
```typescript
// pages/PaymentReturn.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePaytech } from '../hooks/usePaytech';

export const PaymentReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { checkStatus } = usePaytech();

  const token = searchParams.get('token');
  const refCommand = searchParams.get('ref_command');
  const isSuccess = window.location.pathname.includes('/success');

  useEffect(() => {
    const handlePaymentReturn = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token de paiement manquant');
        return;
      }

      try {
        const paymentStatus = await checkStatus(token);

        if (paymentStatus.data?.status === 'PAID') {
          setStatus('success');
          setMessage('Paiement effectué avec succès !');
        } else if (paymentStatus.data?.status === 'PENDING') {
          setStatus('loading');
          setMessage('Paiement en cours de traitement...');
          // Vérifier à nouveau après quelques secondes
          setTimeout(() => window.location.reload(), 3000);
        } else {
          setStatus('error');
          setMessage('Le paiement a échoué');
        }

      } catch (error) {
        setStatus('error');
        setMessage('Erreur lors de la vérification du paiement');
      }
    };

    handlePaymentReturn();
  }, [token, checkStatus]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        {status === 'loading' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Traitement en cours...</h2>
            <p className="text-gray-600 mt-2">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-600">Paiement réussi !</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <p className="text-sm text-gray-500 mt-4">
              Commande : {refCommand}
            </p>
            <button
              onClick={() => window.location.href = '/orders'}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Voir mes commandes
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-red-600">Échec du paiement</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <button
              onClick={() => window.history.back()}
              className="mt-6 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
            >
              Retour
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

## ⚠️ **GESTION DES ERREURS**

### **Codes d'erreur courants**
```typescript
const PAYTECH_ERRORS = {
  INVALID_REQUEST: 'Format de requête invalide',
  INVALID_CREDENTIALS: 'Identifiants Paytech invalides',
  INSUFFICIENT_FUNDS: 'Fonds insuffisants',
  INVALID_AMOUNT: 'Montant invalide',
  TIMEOUT: 'Délai d\'attente dépassé',
  NETWORK_ERROR: 'Erreur réseau',
  PAYMENT_FAILED: 'Le paiement a échoué',
  PAYMENT_CANCELLED: 'Paiement annulé'
};
```

### **Gestion des erreurs**
```typescript
const handlePaymentError = (error: any) => {
  if (error.response) {
    // Erreur du serveur
    switch (error.response.status) {
      case 400:
        console.error('Requête invalide:', error.response.data);
        break;
      case 401:
        console.error('Non autorisé:', error.response.data);
        break;
      case 500:
        console.error('Erreur serveur:', error.response.data);
        break;
      default:
        console.error('Erreur inconnue:', error.response.data);
    }
  } else if (error.request) {
    // Erreur réseau
    console.error('Erreur réseau:', error.message);
  } else {
    // Erreur autre
    console.error('Erreur:', error.message);
  }
};
```

---

## ✅ **BONNES PRATIQUES**

### **1. Sécurité**
```typescript
// Toujours utiliser HTTPS en production
const config = {
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://votre-api.com'
    : 'http://localhost:3004',

  // Ne jamais exposer les clés API dans le frontend
  // Les clés Paytech doivent rester côté serveur
};
```

### **2. Validation**
```typescript
const validatePaymentData = (data: PaymentRequest): boolean => {
  if (!data.item_name || data.item_name.trim().length === 0) {
    throw new Error('Nom du produit requis');
  }

  if (!data.item_price || data.item_price <= 0) {
    throw new Error('Montant invalide');
  }

  if (!data.ref_command || data.ref_command.trim().length === 0) {
    throw new Error('Référence de commande requise');
  }

  return true;
};
```

### **3. Expérience utilisateur**
```typescript
// Afficher un indicateur de chargement
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2">Traitement en cours...</span>
  </div>
);

// Confirmer avant de rediriger
const confirmPayment = (amount: number) => {
  return window.confirm(`Confirmer le paiement de ${amount} XOF ?`);
};
```

### **4. Gestion des états**
```typescript
interface PaymentState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
  token?: string;
  redirectUrl?: string;
}

const usePaymentState = () => {
  const [state, setState] = useState<PaymentState>({
    status: 'idle'
  });

  const setProcessing = () => setState({ status: 'processing' });
  const setSuccess = (token: string, redirectUrl: string) =>
    setState({ status: 'success', token, redirectUrl });
  const setError = (message: string) =>
    setState({ status: 'error', message });
  const reset = () => setState({ status: 'idle' });

  return { state, setProcessing, setSuccess, setError, reset };
};
```

---

## 🧪 **TEST ET DÉBOGAGE**

### **1. Mode test**
```typescript
const isTestMode = process.env.NODE_ENV === 'development';

const paymentConfig = {
  env: isTestMode ? 'test' : 'prod',
  // Utiliser des montants de test en développement
  item_price: isTestMode ? 100 : 5000
};
```

### **2. Journalisation**
```typescript
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Paytech] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[Paytech ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Paytech WARN] ${message}`, data);
  }
};
```

### **3. Tests manuels**
```javascript
// Dans la console du navigateur
// Test d'initialisation
fetch('/paytech/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    item_name: 'Test',
    item_price: 100,
    ref_command: 'TEST-001',
    command_name: 'Test payment',
    env: 'test'
  })
}).then(r => r.json()).then(console.log);

// Test de statut
fetch('/paytech/status/TOKEN-ICI')
  .then(r => r.json())
  .then(console.log);
```

---

## 📚 **RÉFÉRENCES**

### **Liens utiles**
- **Documentation PayTech** : https://doc.intech.sn/doc_paytech.php
- **Site PayTech** : https://paytech.sn
- **Support PayTech** : support@paytech.sn
- **WhatsApp Support** : +221771255799 / +221772457199

### **Endpoints de test**
- **API Backend** : `http://localhost:3004`
- **Configuration test** : `GET /paytech/test-config`
- **Diagnostic** : `GET /paytech/diagnose`

---

## 🚀 **DÉPLOIEMENT**

### **Production**
1. Changer `env: 'test'` en `env: 'prod'`
2. Utiliser des URLs HTTPS pour `success_url` et `cancel_url`
3. Configurer l'URL IPN (doit être HTTPS)
4. Tester avec de petits montants d'abord

### **Checklist avant déploiement**
- ✅ Configuration HTTPS
- ✅ URLs de redirection configurées
- ✅ IPN callback configuré
- ✅ Gestion des erreurs
- ✅ Tests avec différents scénarios
- ✅ Documentation mise à jour

---

## 💡 **CONCLUSION**

Ce guide fournit tous les éléments nécessaires pour intégrer Paytech dans votre frontend :

1. **Configuration simple** avec des URLs claires
2. **API REST complète** avec schémas de données
3. **Exemples de code** réutilisables
4. **Gestion robuste des erreurs**
5. **Bonnes pratiques** de sécurité
6. **Outils de test** et de débogage

Pour toute question supplémentaire, consultez la documentation officielle PayTech ou contactez leur support technique.

**Bon développement !** 🎉