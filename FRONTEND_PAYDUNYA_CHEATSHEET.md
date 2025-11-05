# 🚀 PAYDUNYA FRONTEND - CHEAT SHEET

Guide de référence rapide pour l'intégration PayDunya

---

## 📝 Création de commande avec paiement

### Endpoint
```
POST /orders/guest
```

### Code minimal
```javascript
const response = await fetch('http://localhost:3004/orders/guest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: "client@test.com",
    phoneNumber: "+221775588834",
    shippingDetails: {
      firstName: "Jean",
      lastName: "Dupont",
      street: "123 Rue Test",
      city: "Dakar",
      country: "Sénégal"
    },
    orderItems: [{
      productId: 1,
      quantity: 2,
      unitPrice: 5000
    }],
    totalAmount: 10000,
    paymentMethod: "PAYDUNYA",
    initiatePayment: true  // ← IMPORTANT !
  })
});

const { data } = await response.json();

// Sauvegarder
localStorage.setItem('pendingOrderId', data.id);
localStorage.setItem('pendingOrderNumber', data.orderNumber);

// Rediriger
window.location.href = data.payment.redirect_url;
```

---

## 🔀 Pages de redirection

### Page de succès : `/payment/success`

```jsx
function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = localStorage.getItem('pendingOrderId');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    async function checkOrder() {
      const res = await fetch(`/orders/${orderId}`);
      const { data } = await res.json();

      if (data.paymentStatus === 'PAID') {
        setOrder(data);
        localStorage.removeItem('pendingOrderId');
      } else {
        // Réessayer après 2s
        setTimeout(checkOrder, 2000);
      }
    }
    checkOrder();
  }, []);

  if (!order) return <div>Vérification...</div>;

  return (
    <div>
      <h1>✅ Paiement confirmé !</h1>
      <p>Commande: {order.orderNumber}</p>
      <p>Montant: {order.totalAmount} FCFA</p>
    </div>
  );
}
```

### Page d'annulation : `/payment/cancel`

```jsx
function PaymentCancel() {
  return (
    <div>
      <h1>❌ Paiement annulé</h1>
      <button onClick={() => navigate('/checkout')}>
        Réessayer
      </button>
    </div>
  );
}
```

---

## 🔍 Vérifier le statut

### Endpoint
```
GET /orders/{orderId}
```

### Code
```javascript
async function checkPaymentStatus(orderId) {
  const response = await fetch(`/orders/${orderId}`);
  const { data } = await response.json();

  return {
    status: data.status,           // PENDING, CONFIRMED, etc.
    paymentStatus: data.paymentStatus,  // PENDING, PAID, FAILED
    transactionId: data.transactionId
  };
}
```

---

## ⚡ Polling automatique

```javascript
function usePaymentPolling(orderId, maxAttempts = 10) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let attempts = 0;

    const interval = setInterval(async () => {
      const { paymentStatus } = await checkPaymentStatus(orderId);

      if (paymentStatus === 'PAID') {
        setStatus('paid');
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        setStatus('timeout');
        clearInterval(interval);
      }

      attempts++;
    }, 3000); // Vérifier toutes les 3s

    return () => clearInterval(interval);
  }, [orderId]);

  return status;
}
```

---

## 📊 Statuts possibles

### Statut de commande (`status`)
- `PENDING` - En attente
- `CONFIRMED` - Confirmée (paiement reçu)
- `SHIPPED` - Expédiée
- `DELIVERED` - Livrée
- `CANCELLED` - Annulée

### Statut de paiement (`paymentStatus`)
- `PENDING` - En attente de paiement
- `PAID` - Payé ✅
- `FAILED` - Échoué ❌

---

## ⚠️ Gestion d'erreurs

```javascript
try {
  const response = await createOrder(orderData);
  window.location.href = response.payment.redirect_url;
} catch (error) {
  if (error.response?.status === 400) {
    alert('Données invalides');
  } else if (error.response?.status === 500) {
    alert('Erreur serveur');
  } else {
    alert('Problème de connexion');
  }
}
```

---

## 🔑 Données requises minimum

```javascript
{
  email: "client@test.com",           // Requis
  phoneNumber: "+221775588834",       // Requis (format international)
  shippingDetails: {
    firstName: "Jean",                // Requis
    lastName: "Dupont",               // Requis
    street: "123 Rue",                // Requis
    city: "Dakar",                    // Requis
    country: "Sénégal"                // Requis
  },
  orderItems: [{                      // Requis (min 1 item)
    productId: 1,                     // Requis
    quantity: 2,                      // Requis
    unitPrice: 5000                   // Requis
  }],
  totalAmount: 10000,                 // Requis
  paymentMethod: "PAYDUNYA",          // Requis
  initiatePayment: true               // Requis pour PayDunya
}
```

---

## 📱 Méthodes de paiement disponibles

En mode TEST (Sandbox):

### Orange Money
```
Numéro: 221777000000
Code: 123456
```

### Visa (Succès)
```
Carte: 4000000000000002
Date: 12/25
CVV: 123
```

### Wave
```
Numéro: 221700000000
```

---

## 🔧 Configuration .env

```env
REACT_APP_API_URL=http://localhost:3004
# Production: https://api.printalma.com

REACT_APP_PAYMENT_SUCCESS_URL=/payment/success
REACT_APP_PAYMENT_CANCEL_URL=/payment/cancel
```

---

## 🐛 Debugging

### Vérifier la réponse de création
```javascript
console.log('Order created:', data);
console.log('Payment URL:', data.payment?.redirect_url);
console.log('Order ID:', data.id);
```

### Vérifier le localStorage
```javascript
console.log('Pending Order ID:', localStorage.getItem('pendingOrderId'));
console.log('Payment Token:', localStorage.getItem('pendingPaymentToken'));
```

### Logs réseau
- Ouvrir DevTools → Network
- Filtrer par "orders" ou "payment"
- Vérifier le statut HTTP et la réponse

---

## ✅ Checklist rapide

- [ ] Formulaire de checkout créé
- [ ] Validation des données
- [ ] Appel API avec `initiatePayment: true`
- [ ] Sauvegarde dans localStorage
- [ ] Redirection vers `payment.redirect_url`
- [ ] Page `/payment/success` créée
- [ ] Page `/payment/cancel` créée
- [ ] Vérification du statut après retour
- [ ] Gestion des erreurs
- [ ] Test en mode sandbox

---

## 🆘 Problèmes courants

### 1. "payment" est undefined
→ Vérifier que `initiatePayment: true`

### 2. CORS error
→ Vérifier la config CORS backend

### 3. Le statut ne change pas
→ En local, simuler le webhook: `./test-paydunya-webhook.sh`

### 4. Redirection ne fonctionne pas
→ Vérifier `data.payment.redirect_url` existe

---

## 📞 Support

- **Guide complet:** `GUIDE_FRONTEND_INTEGRATION_PAYDUNYA.md`
- **Backend:** `STRATEGIE_PAYDUNYA_WEBHOOK.md`
- **Test:** `./test-paydunya-webhook.sh`

---

**Version:** 1.0 | **Créé le:** 05/11/2025
