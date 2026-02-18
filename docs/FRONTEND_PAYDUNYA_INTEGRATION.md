# 🎨 Guide Frontend - Intégration Paydunya Dynamique

## 📋 Vue d'ensemble

Ce guide explique comment intégrer Paydunya côté frontend avec la configuration dynamique. **Aucune clé API en dur**, tout est récupéré automatiquement depuis le backend.

---

## 🚀 Démarrage rapide

### 1. Récupérer la configuration Paydunya

```javascript
// Une seule ligne pour tout récupérer !
const config = await fetch('https://votre-api.com/payment-config/paydunya')
  .then(response => response.json());

console.log(config);
// {
//   "provider": "paydunya",
//   "isActive": true,
//   "mode": "test",
//   "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
//   "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
// }
```

### 2. Utiliser la configuration

```javascript
if (config.isActive) {
  // Afficher un badge si en mode test
  if (config.mode === 'test') {
    showTestModeBadge(); // "🧪 Mode Test - Paiements sandbox uniquement"
  }

  // Initialiser Paydunya avec la config dynamique
  initializePaydunya(config);
}
```

---

## 📱 Implémentation par Framework

### Vanilla JavaScript

```javascript
// ============================================
// Configuration globale
// ============================================
let paymentConfig = null;

async function loadPaymentConfig() {
  try {
    const response = await fetch('https://votre-api.com/payment-config/paydunya');

    if (!response.ok) {
      throw new Error('Erreur lors du chargement de la configuration');
    }

    paymentConfig = await response.json();

    // Afficher le mode actuel
    if (paymentConfig.mode === 'test') {
      console.log('🧪 Mode TEST activé - Paiements sandbox');
      showTestBadge();
    } else {
      console.log('🚀 Mode LIVE activé - Paiements réels');
    }

    return paymentConfig;
  } catch (error) {
    console.error('Erreur configuration paiement:', error);
    return null;
  }
}

// ============================================
// Initialiser au chargement de la page
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadPaymentConfig();

  if (!paymentConfig?.isActive) {
    document.getElementById('payment-section').innerHTML = `
      <div class="alert alert-warning">
        Le paiement est temporairement indisponible. Veuillez réessayer plus tard.
      </div>
    `;
  }
});

// ============================================
// Fonction de paiement
// ============================================
async function processPayment(amount, orderData) {
  if (!paymentConfig?.isActive) {
    alert('Service de paiement indisponible');
    return;
  }

  try {
    // Appeler votre backend pour créer la facture Paydunya
    const response = await fetch('https://votre-api.com/paydunya/payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'XOF',
        description: 'Commande #' + orderData.orderNumber,
        customer: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          phone: orderData.customerPhone
        },
        return_url: 'https://votre-site.com/payment/success',
        cancel_url: 'https://votre-site.com/payment/cancel'
      })
    });

    const paymentData = await response.json();

    if (paymentData.response_url) {
      // Rediriger vers la page de paiement Paydunya
      window.location.href = paymentData.response_url;
    } else {
      alert('Erreur lors de l\'initialisation du paiement');
    }
  } catch (error) {
    console.error('Erreur paiement:', error);
    alert('Une erreur est survenue. Veuillez réessayer.');
  }
}

// ============================================
// Afficher le badge mode test
// ============================================
function showTestBadge() {
  const badge = document.createElement('div');
  badge.className = 'test-mode-badge';
  badge.innerHTML = '🧪 Mode Test - Paiements sandbox uniquement';
  badge.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ffc107;
    color: #000;
    padding: 10px 20px;
    border-radius: 5px;
    font-weight: bold;
    z-index: 9999;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(badge);
}
```

---

### React / Next.js

#### Méthode 1 : Hook personnalisé (Recommandé)

```javascript
// hooks/usePaymentConfig.js
import { useState, useEffect } from 'react';

export function usePaymentConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/payment-config/paydunya');

        if (!response.ok) {
          throw new Error('Erreur lors du chargement de la configuration');
        }

        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err.message);
        console.error('Erreur configuration paiement:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  return { config, loading, error };
}
```

**Utilisation :**

```jsx
// pages/checkout.jsx
import { usePaymentConfig } from '../hooks/usePaymentConfig';

function CheckoutPage() {
  const { config, loading, error } = usePaymentConfig();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!config?.isActive) {
      alert('Service de paiement indisponible');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/paydunya/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 10000,
          currency: 'XOF',
          description: 'Commande #12345',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+221771234567'
          }
        })
      });

      const data = await response.json();

      if (data.response_url) {
        window.location.href = data.response_url;
      }
    } catch (error) {
      console.error('Erreur paiement:', error);
      alert('Erreur lors du paiement');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (error) {
    return <div className="error">Erreur: {error}</div>;
  }

  if (!config?.isActive) {
    return (
      <div className="alert alert-warning">
        Service de paiement temporairement indisponible
      </div>
    );
  }

  return (
    <div className="checkout-page">
      {config.mode === 'test' && (
        <div className="test-mode-badge">
          🧪 Mode Test - Paiements sandbox uniquement
        </div>
      )}

      <h2>Paiement</h2>
      <button
        onClick={handlePayment}
        disabled={processing}
        className="btn btn-primary"
      >
        {processing ? 'Traitement...' : 'Payer maintenant'}
      </button>
    </div>
  );
}

export default CheckoutPage;
```

#### Méthode 2 : Context API (Pour app complète)

```javascript
// contexts/PaymentConfigContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const PaymentConfigContext = createContext(null);

export function PaymentConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/payment-config/paydunya')
      .then(response => {
        if (!response.ok) throw new Error('Configuration error');
        return response.json();
      })
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const value = {
    config,
    loading,
    error,
    isActive: config?.isActive || false,
    isTestMode: config?.mode === 'test',
    isLiveMode: config?.mode === 'live',
  };

  return (
    <PaymentConfigContext.Provider value={value}>
      {children}
    </PaymentConfigContext.Provider>
  );
}

export function usePaymentConfig() {
  const context = useContext(PaymentConfigContext);
  if (!context) {
    throw new Error('usePaymentConfig must be used within PaymentConfigProvider');
  }
  return context;
}
```

**Configuration du Provider :**

```jsx
// _app.jsx (Next.js)
import { PaymentConfigProvider } from '../contexts/PaymentConfigContext';

function MyApp({ Component, pageProps }) {
  return (
    <PaymentConfigProvider>
      <Component {...pageProps} />
    </PaymentConfigProvider>
  );
}

export default MyApp;
```

**Utilisation dans les composants :**

```jsx
// components/CheckoutButton.jsx
import { usePaymentConfig } from '../contexts/PaymentConfigContext';

function CheckoutButton({ amount, orderData }) {
  const { config, loading, isActive, isTestMode } = usePaymentConfig();
  const [processing, setProcessing] = useState(false);

  if (loading) return <button disabled>Chargement...</button>;
  if (!isActive) return <div>Paiement indisponible</div>;

  const handleClick = async () => {
    setProcessing(true);
    // ... logique de paiement
  };

  return (
    <div>
      {isTestMode && (
        <span className="badge badge-warning">Mode Test</span>
      )}
      <button onClick={handleClick} disabled={processing}>
        Payer {amount} XOF
      </button>
    </div>
  );
}
```

---

### Vue.js

#### Composable (Vue 3 Composition API)

```javascript
// composables/usePaymentConfig.js
import { ref, onMounted } from 'vue';

export function usePaymentConfig() {
  const config = ref(null);
  const loading = ref(true);
  const error = ref(null);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/payment-config/paydunya');

      if (!response.ok) {
        throw new Error('Erreur configuration');
      }

      config.value = await response.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    loadConfig();
  });

  return {
    config,
    loading,
    error,
    isActive: () => config.value?.isActive || false,
    isTestMode: () => config.value?.mode === 'test',
  };
}
```

**Utilisation :**

```vue
<template>
  <div class="checkout">
    <div v-if="loading">Chargement...</div>

    <div v-else-if="!isActive()">
      Service de paiement indisponible
    </div>

    <div v-else>
      <div v-if="isTestMode()" class="test-badge">
        🧪 Mode Test
      </div>

      <button @click="handlePayment" :disabled="processing">
        Payer maintenant
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePaymentConfig } from '../composables/usePaymentConfig';

const { config, loading, isActive, isTestMode } = usePaymentConfig();
const processing = ref(false);

const handlePayment = async () => {
  processing.value = true;

  try {
    const response = await fetch('/api/paydunya/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 10000,
        currency: 'XOF',
        description: 'Commande #12345'
      })
    });

    const data = await response.json();

    if (data.response_url) {
      window.location.href = data.response_url;
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    processing.value = false;
  }
};
</script>
```

---

## 🔄 Flux de paiement complet

### 1. Page de checkout

```javascript
// Page où l'utilisateur initie le paiement
async function initiatePayment(orderData) {
  // 1. Vérifier que Paydunya est actif
  const config = await fetch('/api/payment-config/paydunya').then(r => r.json());

  if (!config.isActive) {
    showError('Service de paiement indisponible');
    return;
  }

  // 2. Créer la facture via votre backend
  const response = await fetch('/api/paydunya/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: orderData.totalAmount,
      currency: 'XOF',
      description: `Commande #${orderData.orderNumber}`,
      customer: {
        name: orderData.customerName,
        email: orderData.customerEmail,
        phone: orderData.customerPhone
      },
      return_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/payment/cancel`
    })
  });

  const paymentData = await response.json();

  // 3. Rediriger vers Paydunya
  if (paymentData.response_url) {
    // Sauvegarder l'ID de commande avant redirection
    sessionStorage.setItem('pendingOrderId', orderData.orderId);

    // Redirection vers Paydunya
    window.location.href = paymentData.response_url;
  } else {
    showError('Erreur lors de la création du paiement');
  }
}
```

### 2. Page de succès

```javascript
// pages/payment/success.html
async function handlePaymentSuccess() {
  // Récupérer le token depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    showError('Token de paiement manquant');
    return;
  }

  // Afficher un loader
  showLoader('Vérification du paiement...');

  try {
    // Vérifier le statut du paiement via votre backend
    const response = await fetch(`/api/paydunya/status/${token}`);
    const paymentStatus = await response.json();

    if (paymentStatus.status === 'completed') {
      // Paiement réussi !
      const orderId = sessionStorage.getItem('pendingOrderId');

      // Afficher la page de confirmation
      showSuccessPage({
        orderNumber: paymentStatus.custom_data?.orderNumber,
        amount: paymentStatus.invoice.total_amount,
        transactionId: paymentStatus.receipt_url
      });

      // Nettoyer
      sessionStorage.removeItem('pendingOrderId');
    } else {
      // Paiement échoué ou en attente
      showError('Le paiement n\'a pas été complété');
    }
  } catch (error) {
    console.error('Erreur vérification paiement:', error);
    showError('Erreur lors de la vérification du paiement');
  }
}

// Appeler au chargement de la page
document.addEventListener('DOMContentLoaded', handlePaymentSuccess);
```

### 3. Page d'annulation

```javascript
// pages/payment/cancel.html
function handlePaymentCancel() {
  const urlParams = new URLSearchParams(window.location.search);
  const reason = urlParams.get('reason') || 'Paiement annulé';

  // Récupérer l'ID de commande
  const orderId = sessionStorage.getItem('pendingOrderId');

  // Afficher le message d'annulation
  showCancelPage({
    reason: reason,
    message: 'Votre paiement a été annulé. Vous pouvez réessayer.',
    orderNumber: orderId
  });

  // Proposer de réessayer
  document.getElementById('retry-button').addEventListener('click', () => {
    window.location.href = `/checkout?orderId=${orderId}`;
  });
}

document.addEventListener('DOMContentLoaded', handlePaymentCancel);
```

---

## 🎨 Composants UI réutilisables

### Badge Mode Test

```jsx
// components/TestModeBadge.jsx
export function TestModeBadge({ show }) {
  if (!show) return null;

  return (
    <div className="test-mode-badge" style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: '#ffc107',
      color: '#000',
      padding: '10px 20px',
      borderRadius: '5px',
      fontWeight: 'bold',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span>🧪</span>
      <span>Mode Test - Paiements sandbox</span>
    </div>
  );
}
```

### Bouton de paiement

```jsx
// components/PaymentButton.jsx
import { useState } from 'react';
import { usePaymentConfig } from '../hooks/usePaymentConfig';

export function PaymentButton({ amount, orderData, onSuccess, onError }) {
  const { config, isActive } = usePaymentConfig();
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    if (!isActive) {
      onError?.('Service de paiement indisponible');
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch('/api/paydunya/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'XOF',
          ...orderData
        })
      });

      const data = await response.json();

      if (data.response_url) {
        window.location.href = data.response_url;
      } else {
        onError?.('Erreur lors de l\'initialisation du paiement');
      }
    } catch (error) {
      onError?.(error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={!isActive || processing}
      className={`payment-button ${processing ? 'processing' : ''}`}
      style={{
        padding: '15px 30px',
        fontSize: '16px',
        fontWeight: 'bold',
        backgroundColor: isActive ? '#28a745' : '#6c757d',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: isActive && !processing ? 'pointer' : 'not-allowed',
        opacity: processing ? 0.7 : 1
      }}
    >
      {processing ? (
        <>
          <span className="spinner"></span>
          Traitement...
        </>
      ) : (
        `Payer ${amount.toLocaleString('fr-FR')} XOF`
      )}
    </button>
  );
}
```

---

## 🔍 Gestion des erreurs

```javascript
// utils/paymentErrors.js
export function handlePaymentError(error) {
  const errorMessages = {
    'insufficient_funds': 'Fonds insuffisants. Veuillez vérifier votre solde.',
    'timeout': 'Session expirée. Veuillez réessayer.',
    'user_cancelled': 'Paiement annulé.',
    'fraud': 'Paiement bloqué pour des raisons de sécurité. Contactez le support.',
    'technical_error': 'Erreur technique. Veuillez réessayer dans quelques instants.',
    'default': 'Une erreur est survenue. Veuillez réessayer.'
  };

  const message = errorMessages[error.category] || errorMessages.default;

  return {
    userMessage: message,
    technicalMessage: error.message || 'Erreur inconnue',
    category: error.category || 'unknown',
    code: error.code
  };
}

// Utilisation
try {
  // ... paiement
} catch (error) {
  const errorInfo = handlePaymentError(error);
  alert(errorInfo.userMessage);
  console.error('Erreur technique:', errorInfo.technicalMessage);
}
```

---

## 📊 Monitoring et Analytics

```javascript
// utils/paymentAnalytics.js
export function trackPaymentEvent(eventName, data) {
  // Google Analytics
  if (window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'Payment',
      ...data
    });
  }

  // Mixpanel
  if (window.mixpanel) {
    window.mixpanel.track(eventName, data);
  }

  // Console pour debug
  console.log(`[Analytics] ${eventName}`, data);
}

// Exemples d'utilisation
trackPaymentEvent('payment_initiated', {
  amount: 10000,
  currency: 'XOF',
  mode: config.mode
});

trackPaymentEvent('payment_success', {
  amount: 10000,
  transaction_id: 'txn_123',
  mode: config.mode
});

trackPaymentEvent('payment_failed', {
  amount: 10000,
  reason: 'insufficient_funds',
  mode: config.mode
});
```

---

## ✅ Checklist d'intégration

- [ ] Récupérer la configuration Paydunya depuis `/payment-config/paydunya`
- [ ] Vérifier que `config.isActive` est `true` avant d'afficher le paiement
- [ ] Afficher un badge "Mode Test" si `config.mode === 'test'`
- [ ] Implémenter l'appel à `/api/paydunya/payment` pour créer la facture
- [ ] Rediriger vers `paymentData.response_url` après création de la facture
- [ ] Créer une page `/payment/success` pour gérer les paiements réussis
- [ ] Créer une page `/payment/cancel` pour gérer les annulations
- [ ] Vérifier le statut du paiement via `/api/paydunya/status/:token`
- [ ] Gérer les erreurs avec des messages utilisateur clairs
- [ ] Ajouter du tracking analytics
- [ ] Tester en mode TEST avant de passer en LIVE

---

## 🆘 Troubleshooting

### La configuration ne se charge pas

```javascript
// Vérifier que l'endpoint est correct
fetch('https://votre-api.com/payment-config/paydunya')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// Vérifier les CORS
// L'API doit autoriser votre domaine frontend
```

### Le paiement ne se lance pas

```javascript
// Vérifier que la config est active
if (!config?.isActive) {
  console.error('Paydunya est désactivé');
}

// Vérifier la réponse du backend
const response = await fetch('/api/paydunya/payment', {...});
const data = await response.json();
console.log('Response:', data);
```

### Le badge "Mode Test" ne s'affiche pas

```javascript
// Vérifier le mode
console.log('Mode actuel:', config.mode); // 'test' ou 'live'

// Force l'affichage pour debug
if (config.mode === 'test') {
  console.log('Badge devrait être affiché');
}
```

---

## 📚 Ressources

- **API Reference** : `/docs/CONFIGURATION_PAIEMENT_DYNAMIQUE.md`
- **Quick Start** : `/PAYDUNYA_QUICK_START.md`
- **Backend Guide** : `/docs/CONFIGURATION_PAIEMENT_DYNAMIQUE.md`
- **Paydunya Docs** : https://developers.paydunya.com

---

**Dernière mise à jour** : 12 Février 2026
**Version** : 1.0.0

**Questions ?** Consultez la documentation complète ou testez avec `npx ts-node scripts/test-payment-config.ts`
