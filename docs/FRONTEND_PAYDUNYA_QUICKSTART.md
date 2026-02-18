# 🚀 Frontend - Paydunya en 5 minutes

## 📌 L'essentiel

**1 seul endpoint à connaître** : `GET /payment-config/paydunya`

Tout est dynamique, **aucune clé en dur** dans votre code !

---

## ⚡ Démarrage ultra-rapide

### JavaScript Vanilla

```javascript
// 1. Récupérer la config
const config = await fetch('https://votre-api.com/payment-config/paydunya')
  .then(r => r.json());

// 2. Vérifier qu'elle est active
if (config.isActive) {
  // 3. Lancer le paiement
  const payment = await fetch('https://votre-api.com/paydunya/payment', {
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
  }).then(r => r.json());

  // 4. Rediriger vers Paydunya
  window.location.href = payment.response_url;
}
```

### React

```jsx
import { useEffect, useState } from 'react';

function CheckoutButton({ amount }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('/api/payment-config/paydunya')
      .then(r => r.json())
      .then(setConfig);
  }, []);

  const handlePayment = async () => {
    const payment = await fetch('/api/paydunya/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency: 'XOF' })
    }).then(r => r.json());

    window.location.href = payment.response_url;
  };

  if (!config?.isActive) return <div>Paiement indisponible</div>;

  return (
    <div>
      {config.mode === 'test' && <span>🧪 Mode Test</span>}
      <button onClick={handlePayment}>Payer {amount} XOF</button>
    </div>
  );
}
```

### Vue.js

```vue
<template>
  <div>
    <div v-if="config?.mode === 'test'">🧪 Mode Test</div>
    <button @click="handlePayment" v-if="config?.isActive">
      Payer {{ amount }} XOF
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps(['amount']);
const config = ref(null);

onMounted(async () => {
  config.value = await fetch('/api/payment-config/paydunya').then(r => r.json());
});

const handlePayment = async () => {
  const payment = await fetch('/api/paydunya/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: props.amount, currency: 'XOF' })
  }).then(r => r.json());

  window.location.href = payment.response_url;
};
</script>
```

---

## 📋 Ce que vous recevez

```json
{
  "provider": "paydunya",
  "isActive": true,
  "mode": "test",
  "publicKey": "test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt",
  "apiUrl": "https://app.paydunya.com/sandbox-api/v1"
}
```

### Propriétés

| Propriété | Type | Description |
|-----------|------|-------------|
| `provider` | string | Toujours "paydunya" |
| `isActive` | boolean | `true` = paiement disponible, `false` = désactivé |
| `mode` | string | `"test"` = sandbox, `"live"` = production |
| `publicKey` | string | Clé publique (pour SDK si besoin) |
| `apiUrl` | string | URL de l'API (auto selon mode) |

---

## 🔄 Flux complet en 4 étapes

```
┌─────────────────────────────────────────────────────────┐
│  1. Récupérer config                                    │
│  GET /payment-config/paydunya                           │
│  → Vérifier config.isActive                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  2. Créer facture                                       │
│  POST /paydunya/payment                                 │
│  → Recevoir response_url                                │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  3. Rediriger client                                    │
│  window.location.href = response_url                    │
│  → Client paye sur Paydunya                             │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  4. Retour client                                       │
│  /payment/success?token=xxx                             │
│  → Vérifier statut via GET /paydunya/status/:token      │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Afficher le mode TEST

```javascript
// Vérifier le mode
if (config.mode === 'test') {
  // Afficher un badge
  showTestBadge();
}

function showTestBadge() {
  const badge = document.createElement('div');
  badge.innerHTML = '🧪 Mode Test - Paiements sandbox';
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
  `;
  document.body.appendChild(badge);
}
```

---

## 📱 Page de succès

```javascript
// pages/payment/success.html
async function handleSuccess() {
  // 1. Récupérer le token depuis l'URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  // 2. Vérifier le statut
  const status = await fetch(`/api/paydunya/status/${token}`)
    .then(r => r.json());

  // 3. Afficher confirmation
  if (status.status === 'completed') {
    showSuccess('Paiement réussi !');
  } else {
    showError('Paiement non complété');
  }
}

document.addEventListener('DOMContentLoaded', handleSuccess);
```

---

## 📱 Page d'annulation

```javascript
// pages/payment/cancel.html
function handleCancel() {
  const params = new URLSearchParams(window.location.search);
  const reason = params.get('reason') || 'Paiement annulé';

  showMessage(`Paiement annulé : ${reason}`);

  // Bouton pour réessayer
  document.getElementById('retry').addEventListener('click', () => {
    window.location.href = '/checkout';
  });
}

document.addEventListener('DOMContentLoaded', handleCancel);
```

---

## 🎯 Checklist

- [ ] Endpoint `/payment-config/paydunya` configuré dans le code
- [ ] Vérification de `config.isActive` avant affichage du paiement
- [ ] Badge "Mode Test" affiché si `config.mode === 'test'`
- [ ] Appel à `/paydunya/payment` pour créer la facture
- [ ] Redirection vers `response_url`
- [ ] Page `/payment/success` créée
- [ ] Page `/payment/cancel` créée
- [ ] Vérification du statut via `/paydunya/status/:token`
- [ ] Gestion des erreurs
- [ ] Tests en mode TEST effectués

---

## 🛠️ Exemples complets

### Hook React réutilisable

```javascript
// hooks/usePaymentConfig.js
import { useState, useEffect } from 'react';

export function usePaymentConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payment-config/paydunya')
      .then(r => r.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return {
    config,
    loading,
    isActive: config?.isActive || false,
    isTest: config?.mode === 'test',
    isLive: config?.mode === 'live'
  };
}
```

**Utilisation :**

```jsx
function MyComponent() {
  const { config, loading, isActive, isTest } = usePaymentConfig();

  if (loading) return <div>Chargement...</div>;
  if (!isActive) return <div>Paiement indisponible</div>;

  return (
    <div>
      {isTest && <TestBadge />}
      <PaymentButton />
    </div>
  );
}
```

### Context Provider React

```jsx
// contexts/PaymentConfigContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const PaymentConfigContext = createContext(null);

export function PaymentConfigProvider({ children }) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('/api/payment-config/paydunya')
      .then(r => r.json())
      .then(setConfig);
  }, []);

  return (
    <PaymentConfigContext.Provider value={config}>
      {children}
    </PaymentConfigContext.Provider>
  );
}

export const usePaymentConfig = () => useContext(PaymentConfigContext);
```

**App.jsx :**

```jsx
import { PaymentConfigProvider } from './contexts/PaymentConfigContext';

function App() {
  return (
    <PaymentConfigProvider>
      <YourApp />
    </PaymentConfigProvider>
  );
}
```

---

## 🔥 Tips

### 1. Cache la config
```javascript
// Éviter de charger à chaque fois
let cachedConfig = null;

async function getPaymentConfig() {
  if (cachedConfig) return cachedConfig;

  cachedConfig = await fetch('/api/payment-config/paydunya')
    .then(r => r.json());

  return cachedConfig;
}
```

### 2. Gestion d'erreur simple
```javascript
try {
  const payment = await createPayment();
  window.location.href = payment.response_url;
} catch (error) {
  alert('Erreur lors du paiement. Veuillez réessayer.');
  console.error(error);
}
```

### 3. Loading state
```jsx
const [processing, setProcessing] = useState(false);

const handlePayment = async () => {
  setProcessing(true);
  try {
    // ... paiement
  } finally {
    setProcessing(false);
  }
};

return (
  <button disabled={processing}>
    {processing ? 'Traitement...' : 'Payer'}
  </button>
);
```

---

## 🆘 Problèmes courants

### Config ne se charge pas
```javascript
// Vérifier l'URL
console.log('Calling:', '/api/payment-config/paydunya');

// Vérifier CORS
// Assurez-vous que votre backend accepte les requêtes depuis votre frontend
```

### Badge ne s'affiche pas
```javascript
// Debug
console.log('Mode:', config.mode);
console.log('Should show badge:', config.mode === 'test');
```

### Redirection ne fonctionne pas
```javascript
// Vérifier response_url
console.log('Response URL:', payment.response_url);

// S'assurer qu'elle existe
if (payment.response_url) {
  window.location.href = payment.response_url;
} else {
  console.error('response_url manquante:', payment);
}
```

---

## 📚 Documentation complète

Pour plus de détails, consultez :

- **Guide complet Frontend** : `docs/FRONTEND_PAYDUNYA_INTEGRATION.md`
- **Guide Backend** : `docs/CONFIGURATION_PAIEMENT_DYNAMIQUE.md`
- **Quick Start général** : `PAYDUNYA_QUICK_START.md`

---

## 🎯 Résumé en 30 secondes

```javascript
// 1. Récupérer config
const config = await fetch('/payment-config/paydunya').then(r => r.json());

// 2. Vérifier active
if (!config.isActive) return;

// 3. Afficher badge test
if (config.mode === 'test') showTestBadge();

// 4. Créer paiement
const payment = await fetch('/paydunya/payment', {
  method: 'POST',
  body: JSON.stringify({ amount: 10000, currency: 'XOF' })
}).then(r => r.json());

// 5. Rediriger
window.location.href = payment.response_url;
```

**C'est tout !** 🎉

---

**Version** : 1.0.0
**Date** : 12 Février 2026
**Support** : docs/FRONTEND_PAYDUNYA_INTEGRATION.md
