# PayDunya API - Référence Rapide Frontend

Guide ultra-rapide pour intégrer PayDunya dans le frontend Printalma.

---

## 🚀 Démarrage Ultra-Rapide (5 minutes)

### 1. Variables d'environnement

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3004
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001
```

### 2. Installation

```bash
npm install axios
```

### 3. Code minimal

```typescript
// Initialiser un paiement
const response = await fetch('http://localhost:3004/paydunya/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoice: {
      total_amount: 15000,
      description: "Commande #ORD-001",
      customer: {
        name: "Papa Fallou",
        email: "test@example.com",
        phone: "+221775588834"
      },
      channels: ["orange-money-senegal", "wave-senegal"]
    },
    store: {
      name: "Printalma Store"
    },
    actions: {
      callback_url: "http://localhost:3004/paydunya/callback",
      return_url: "http://localhost:3001/orders/ORD-001/success",
      cancel_url: "http://localhost:3001/orders/ORD-001/cancel"
    },
    custom_data: {
      order_number: "ORD-001"
    }
  })
});

const data = await response.json();

// Rediriger vers PayDunya
window.location.href = data.data.redirect_url;
```

---

## 📡 Endpoints API

### Base URL
- Dev: `http://localhost:3004`
- Prod: `https://api.printalma.com`

### Liste des endpoints

| Méthode | Endpoint | Auth | Description |
|---------|----------|------|-------------|
| POST | `/paydunya/payment` | Non | Initialiser un paiement |
| GET | `/paydunya/status/:token` | Non | Vérifier statut |
| GET | `/paydunya/test-config` | Non | Tester la config |
| POST | `/orders` | JWT | Créer une commande |
| GET | `/orders/:orderNumber` | JWT | Détails commande |

---

## 💳 Initialiser un Paiement

### Request

```typescript
POST /paydunya/payment
Content-Type: application/json

{
  "invoice": {
    "total_amount": 15000,              // Montant en XOF
    "description": "Commande #ORD-001",
    "customer": {
      "name": "Papa Fallou Diagne",
      "email": "client@example.com",
      "phone": "+221771234567"          // Format international
    },
    "channels": [                        // Optionnel
      "orange-money-senegal",
      "wave-senegal"
    ]
  },
  "store": {
    "name": "Printalma Store",
    "tagline": "Impression pro",          // Optionnel
    "phone": "+221338234567",             // Optionnel
    "website_url": "https://printalma.com"// Optionnel
  },
  "actions": {
    "callback_url": "https://api.printalma.com/paydunya/callback",
    "return_url": "https://printalma.com/orders/ORD-001/success",
    "cancel_url": "https://printalma.com/orders/ORD-001/cancel"
  },
  "custom_data": {
    "order_number": "ORD-001",
    "user_id": "user-uuid",
    // Ajoutez d'autres données personnalisées
  }
}
```

### Response

```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "token": "test_abc123def456",
    "redirect_url": "https://app.paydunya.com/sandbox-checkout/invoice/test_abc123",
    "payment_url": "https://app.paydunya.com/sandbox-checkout/invoice/test_abc123",
    "invoice_description": "Commande #ORD-001"
  }
}
```

### Action suivante

```typescript
// Rediriger l'utilisateur
window.location.href = data.data.redirect_url;
```

---

## 🔍 Vérifier le Statut

### Request

```typescript
GET /paydunya/status/:token
```

### Response

```json
{
  "success": true,
  "data": {
    "status": "completed",  // pending | completed | failed | cancelled
    "invoice": {
      "token": "test_abc123",
      "total_amount": 15000
    },
    "custom_data": {
      "order_number": "ORD-001"
    }
  }
}
```

---

## 🎨 Exemple Complet React

```tsx
import { useState } from 'react';

export default function CheckoutButton({ orderNumber, amount, customer }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3004/paydunya/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: {
            total_amount: amount,
            description: `Commande #${orderNumber}`,
            customer: customer,
            channels: ["orange-money-senegal", "wave-senegal"]
          },
          store: {
            name: "Printalma Store"
          },
          actions: {
            callback_url: "http://localhost:3004/paydunya/callback",
            return_url: `http://localhost:3001/orders/${orderNumber}/success`,
            cancel_url: `http://localhost:3001/orders/${orderNumber}/cancel`
          },
          custom_data: {
            order_number: orderNumber
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        // Rediriger vers PayDunya
        window.location.href = data.data.redirect_url;
      } else {
        alert('Erreur: ' + data.message);
      }
    } catch (error) {
      alert('Erreur lors du paiement');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg"
    >
      {loading ? 'Chargement...' : 'Payer avec Mobile Money'}
    </button>
  );
}
```

---

## 📱 Channels disponibles

```typescript
// Liste des channels PayDunya
const channels = [
  "orange-money-senegal",
  "wave-senegal",
  "mtn-benin",
  "moov-benin",
  "orange-ci",
  "mtn-ci",
  "moov-ci",
  // etc.
];
```

---

## ✅ Page de Succès

```tsx
// pages/orders/[orderNumber]/success.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Success() {
  const router = useRouter();
  const { orderNumber, token } = router.query;
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (token) {
      // Vérifier le statut
      fetch(`http://localhost:3004/paydunya/status/${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.data.status === 'completed') {
            setStatus('success');
          } else {
            setStatus('pending');
          }
        })
        .catch(() => setStatus('error'));
    }
  }, [token]);

  if (status === 'loading') {
    return <div>Vérification du paiement...</div>;
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600">✅ Paiement réussi !</h1>
        <p>Commande #{orderNumber}</p>
        <button onClick={() => router.push('/orders')}>
          Voir mes commandes
        </button>
      </div>
    );
  }

  return <div>Vérification en cours...</div>;
}
```

---

## 🚫 Page d'Annulation

```tsx
// pages/orders/[orderNumber]/cancel.tsx
import { useRouter } from 'next/router';

export default function Cancel() {
  const router = useRouter();
  const { orderNumber } = router.query;

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-orange-600">🚫 Paiement annulé</h1>
      <p>Commande #{orderNumber} n'a pas été payée</p>
      <button onClick={() => router.push(`/checkout/${orderNumber}`)}>
        Réessayer
      </button>
    </div>
  );
}
```

---

## ⚠️ Gestion des Erreurs

```typescript
try {
  const response = await fetch('/paydunya/payment', {...});
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erreur de paiement');
  }

  window.location.href = data.data.redirect_url;

} catch (error) {
  // Afficher un message d'erreur
  alert('Erreur: ' + error.message);
}
```

---

## 🔒 Sécurité

### ✅ À FAIRE
- Valider les données utilisateur côté frontend
- Toujours passer par le backend pour PayDunya
- Vérifier le statut côté backend après paiement
- Utiliser HTTPS en production

### ❌ NE PAS FAIRE
- Ne jamais exposer les clés PayDunya côté frontend
- Ne pas faire confiance uniquement aux paramètres d'URL
- Ne pas stocker les clés dans le code source

---

## 🧪 Tests

### Numéro de test

```
Téléphone: +221 775 588 834
```

### Tester rapidement

```bash
# 1. Créer un paiement
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
    "custom_data": {"order_number": "TEST-001"}
  }'

# 2. Copier le redirect_url et l'ouvrir dans un navigateur
```

---

## 📊 Statuts de Paiement

| Statut | Description | Action |
|--------|-------------|--------|
| `pending` | En attente | Afficher "Traitement..." |
| `completed` | Réussi | Afficher succès ✅ |
| `failed` | Échoué | Proposer de réessayer |
| `cancelled` | Annulé | Proposer de réessayer |

---

## 🔗 URLs Importantes

- **Doc complète**: `FRONTEND_INTEGRATION_PAYDUNYA.md`
- **Migration guide**: `PAYDUNYA_MIGRATION_GUIDE.md`
- **Tests results**: `PAYDUNYA_TEST_RESULTS.md`
- **API PayDunya**: https://developers.paydunya.com/doc/FR/introduction

---

## 💡 Conseils Pro

1. **Toujours vérifier le statut** après redirection
2. **Implémenter un polling** si le statut est `pending`
3. **Afficher des loading states** pendant les requêtes
4. **Prévoir des fallbacks** en cas d'erreur réseau
5. **Logger les erreurs** pour faciliter le debug
6. **Tester sur mobile** (responsive)

---

## 🆘 Support Rapide

### Backend ne répond pas
```bash
# Vérifier que le backend tourne
curl http://localhost:3004/paydunya/test-config
```

### Erreur 401 (Unauthorized)
```typescript
// Ajouter le token JWT
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Erreur 400 (Bad Request)
- Vérifier le format du téléphone : `+221XXXXXXXXX`
- Vérifier que tous les champs obligatoires sont présents
- Vérifier le montant (doit être > 0)

---

**Pour plus de détails**: Voir `FRONTEND_INTEGRATION_PAYDUNYA.md`

**Version**: 1.0 | **Date**: 3 Novembre 2025
