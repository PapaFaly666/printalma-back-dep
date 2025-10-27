# 📦 Exemples d'intégration Paytech - Frontend

Ce dossier contient des exemples complets pour intégrer Paytech dans votre application frontend.

## 📁 Structure

```
frontend-examples/
├── paytech-service.js     # Service JavaScript/TypeScript réutilisable
├── react-hook.js          # Hook React personnalisé
├── vue-component.vue      # Composant Vue.js complet
├── html-example.html      # Exemple Vanilla JavaScript
├── payment-urls.js        # Configuration des URLs
├── package.json           # Configuration du projet
└── README.md             # Ce fichier
```

## 🚀 Quick Start

### 1. Copier les fichiers dans votre projet
```bash
# Copier le service
cp paytech-service.js src/services/paytech.service.js

# Copier le hook React
cp react-hook.js src/hooks/usePaytech.js

# Copier le composant Vue
cp vue-component.vue src/components/PaytechButton.vue
```

### 2. Adapter la configuration
```javascript
// Dans payment-urls.js ou votre configuration
const config = {
  BACKEND_URL: 'http://localhost:3004', // URL de votre backend
  FRONTEND_URL: 'http://localhost:3000', // URL de votre frontend
};
```

### 3. Utiliser dans votre code

#### React
```jsx
import { usePaytech } from './hooks/usePaytech';

function PaymentButton() {
  const { initiatePayment, loading, error } = usePaytech();

  const handlePayment = async () => {
    await initiatePayment({
      item_name: 'T-Shirt Premium',
      item_price: 5000,
      ref_command: 'ORDER-001',
      command_name: 'Achat T-Shirt Premium'
    });
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Traitement...' : 'Payer 5000 XOF'}
    </button>
  );
}
```

#### Vue.js
```vue
<template>
  <PaytechButton
    :item-name="'T-Shirt Premium'"
    :amount="5000"
    :ref-command="'ORDER-001'"
    @payment-initiated="onPaymentInitiated"
    @payment-success="onPaymentSuccess"
    @payment-error="onPaymentError"
  />
</template>

<script>
import PaytechButton from '@/components/PaytechButton.vue';

export default {
  components: { PaytechButton },
  methods: {
    onPaymentInitiated(data) {
      console.log('Paiement initialisé:', data);
    },
    onPaymentSuccess() {
      console.log('Paiement réussi');
    },
    onPaymentError(error) {
      console.error('Erreur de paiement:', error);
    }
  }
};
</script>
```

#### Vanilla JavaScript
```html
<script src="paytech-service.js"></script>
<script>
const service = new PaytechService('http://localhost:3004');

document.getElementById('pay-button').onclick = async () => {
  try {
    const response = await service.initializePayment({
      item_name: 'T-Shirt Premium',
      item_price: 5000,
      ref_command: 'ORDER-001',
      command_name: 'Achat T-Shirt Premium'
    });

    window.location.href = response.data.redirect_url;
  } catch (error) {
    console.error('Erreur:', error);
  }
};
</script>
```

## ⚙️ Configuration

### Variables d'environnement
```bash
# .env
REACT_APP_API_URL=http://localhost:3004
VUE_APP_API_URL=http://localhost:3004
```

### URLs de redirection
```javascript
const paymentData = {
  item_name: 'Mon produit',
  item_price: 5000,
  ref_command: 'ORDER-001',
  command_name: 'Description de la commande',

  // URLs de retour (important)
  success_url: 'https://monsite.com/payment/success',
  cancel_url: 'https://monsite.com/payment/cancel',
  ipn_url: 'https://monsite.com/api/paytech/ipn-callback'
};
```

## 🧪 Test

### Mode test
```javascript
const testData = {
  env: 'test',
  item_price: 100, // Petit montant pour les tests
  // ... autres champs
};
```

### Tester localement
```bash
# Servir les fichiers localement
python -m http.server 3000
# Ouvrir http://localhost:3000/html-example.html
```

## 📚 Documentation complète

Voir le guide complet : [PAYTECH_FRONTEND_INTEGRATION_GUIDE.md](../PAYTECH_FRONTEND_INTEGRATION_GUIDE.md)

## 🔧 Support

- **Documentation PayTech** : https://doc.intech.sn/doc_paytech.php
- **Support technique** : support@paytech.sn
- **WhatsApp** : +221771255799 / +221772457199

---

**Développé avec ❤️ par l'équipe Printalma**