# PayDunya - Guide de démarrage rapide

## Configuration rapide en 5 minutes

### 1. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet (ou modifiez le fichier existant) :

```bash
# PayDunya - Test Mode
PAYDUNYA_MASTER_KEY="1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj"
PAYDUNYA_PRIVATE_KEY="test_private_uImFqxfqokHqbqHI4PXJ24huucO"
PAYDUNYA_PUBLIC_KEY="test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt"
PAYDUNYA_TOKEN="BuVS3uuAKsg9bYyGcT9B"
PAYDUNYA_MODE="test"

# URLs
PAYDUNYA_CALLBACK_URL="https://your-domain.com/paydunya/callback"
PAYDUNYA_RETURN_URL="https://your-frontend.com/payment/success"
PAYDUNYA_CANCEL_URL="https://your-frontend.com/payment/cancel"
FRONTEND_URL="https://your-frontend.com"
```

### 2. Installer les dépendances et démarrer

```bash
npm install
npm run start:dev
```

### 3. Tester la configuration

```bash
curl http://localhost:3000/paydunya/test-config
```

Vous devriez voir :
```json
{
  "success": true,
  "message": "PayDunya service is configured and ready",
  "data": {
    "mode": "test",
    "hasMasterKey": true,
    "hasPrivateKey": true,
    "hasToken": true
  }
}
```

### 4. Effectuer un paiement test

#### Méthode 1 : Via le script de test

```bash
./test-paydunya.sh
```

#### Méthode 2 : Requête manuelle

```bash
curl -X POST http://localhost:3000/paydunya/payment \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": {
      "total_amount": 1000,
      "description": "Test Order #001",
      "customer": {
        "name": "Test User",
        "email": "test@example.com",
        "phone": "+221701234567"
      }
    },
    "store": {
      "name": "Printalma Store"
    },
    "custom_data": {
      "order_number": "TEST-001"
    }
  }'
```

Réponse attendue :
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "token": "abc123def456",
    "redirect_url": "https://app.paydunya.com/sandbox-checkout/abc123def456"
  }
}
```

### 5. Ouvrir l'URL de paiement

Copiez la `redirect_url` et ouvrez-la dans un navigateur pour tester le flux de paiement.

---

## Intégration frontend simple

### Exemple React/Next.js

```typescript
// pages/checkout.tsx
import { useState } from 'react';

export default function Checkout() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/paydunya/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice: {
            total_amount: 5000, // 5000 XOF
            description: `Order #${orderId}`,
            customer: {
              name: user.name,
              email: user.email,
              phone: user.phone
            }
          },
          store: {
            name: 'Printalma Store'
          },
          actions: {
            callback_url: 'https://api.printalma.com/paydunya/callback',
            return_url: `https://printalma.com/orders/${orderId}/success`,
            cancel_url: `https://printalma.com/orders/${orderId}/cancel`
          },
          custom_data: {
            order_number: orderId,
            user_id: user.id
          }
        })
      });

      const { data } = await response.json();

      // Rediriger vers la page de paiement PayDunya
      window.location.href = data.redirect_url;

    } catch (error) {
      console.error('Payment initialization failed:', error);
      alert('Erreur lors de l\'initialisation du paiement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handlePayment} disabled={loading}>
      {loading ? 'Chargement...' : 'Payer avec PayDunya'}
    </button>
  );
}
```

---

## API Endpoints disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/paydunya/test-config` | GET | Tester la configuration |
| `/paydunya/payment` | POST | Initialiser un paiement |
| `/paydunya/callback` | POST | Webhook IPN (PayDunya → Backend) |
| `/paydunya/status/:token` | GET | Vérifier le statut d'un paiement |
| `/paydunya/refund` | POST | Demander un remboursement (Admin) |

---

## Structure de requête complète

```typescript
{
  "invoice": {
    "items": {},                      // Optionnel : détails des articles
    "taxes": {},                      // Optionnel : détails des taxes
    "customer": {
      "name": "Client Name",          // Requis
      "email": "client@example.com",  // Optionnel
      "phone": "+221701234567"        // Optionnel
    },
    "channels": [                     // Optionnel : limiter les canaux
      "orange-money-senegal",
      "wave-senegal",
      "mtn-benin"
    ],
    "total_amount": 5000,             // Requis : montant en XOF (ou autre devise)
    "description": "Order #123"       // Requis
  },
  "store": {
    "name": "Printalma Store",        // Requis
    "tagline": "Impression",          // Optionnel
    "postal_address": "Dakar",        // Optionnel
    "phone": "+221338234567",         // Optionnel
    "logo_url": "https://...",        // Optionnel
    "website_url": "https://..."      // Optionnel
  },
  "custom_data": {                    // Optionnel mais recommandé
    "order_number": "ORD-123",
    "user_id": "user-456",
    "any_custom_field": "value"
  },
  "actions": {
    "cancel_url": "https://...",      // Optionnel
    "return_url": "https://...",      // Optionnel
    "callback_url": "https://..."     // Optionnel (mais recommandé pour IPN)
  }
}
```

---

## Gestion des callbacks (webhooks)

PayDunya envoie une notification IPN à votre endpoint `/paydunya/callback` quand le paiement est complété, annulé ou échoué.

### Format du callback

```json
{
  "invoice_token": "abc123def456",
  "status": "completed",              // completed | cancelled | failed | pending
  "total_amount": 5000,
  "customer_name": "Client Name",
  "customer_email": "client@example.com",
  "customer_phone": "+221701234567",
  "payment_method": "orange-money-senegal",
  "custom_data": "{\"order_number\":\"ORD-123\"}",
  "cancel_reason": "",                // Si status = failed
  "error_code": ""                    // Si status = failed
}
```

### Traitement automatique

Le backend traite automatiquement :
- ✅ Vérification de l'authenticité du callback
- ✅ Mise à jour du statut de la commande
- ✅ Création d'un `PaymentAttempt` en base de données
- ✅ Gestion des erreurs (fonds insuffisants, timeout, etc.)
- ✅ Messages utilisateur en français

---

## Passer en production

### 1. Changer les clés dans `.env`

```bash
# PayDunya - Production Mode
PAYDUNYA_MASTER_KEY="1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj"
PAYDUNYA_PRIVATE_KEY="live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG"
PAYDUNYA_PUBLIC_KEY="live_public_JzyUBGQTafgpOPqRulSDGDVfHzz"
PAYDUNYA_TOKEN="lt8YNn0GPW6DTIWcCZ8f"
PAYDUNYA_MODE="live"
```

### 2. Configurer l'URL de callback dans PayDunya

1. Connectez-vous à votre dashboard PayDunya
2. Allez dans **Paramètres** > **API**
3. Ajoutez l'URL : `https://your-production-domain.com/paydunya/callback`

### 3. Tester avec un petit montant

```bash
# Test avec 100 XOF
curl -X POST https://your-production-domain.com/paydunya/payment \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": {
      "total_amount": 100,
      "description": "Test Production",
      "customer": {
        "name": "Test Prod",
        "phone": "+221701234567"
      }
    },
    "store": {
      "name": "Printalma Store"
    }
  }'
```

---

## Troubleshooting

### Problème : "PayDunya API credentials missing"

**Solution** : Vérifiez que toutes les variables d'environnement sont définies dans `.env` :
```bash
echo $PAYDUNYA_MASTER_KEY
echo $PAYDUNYA_PRIVATE_KEY
echo $PAYDUNYA_TOKEN
```

### Problème : "Invalid IPN data"

**Solution** : Vérifiez que le webhook PayDunya peut accéder à votre endpoint `/paydunya/callback`. L'endpoint doit être :
- Accessible publiquement (pas de guard d'authentification)
- En HTTPS en production
- Capable de recevoir du POST avec `application/x-www-form-urlencoded`

### Problème : Le paiement est créé mais le statut ne se met pas à jour

**Solution** : Vérifiez les logs du backend :
```bash
# Logs en temps réel
npm run start:dev
# Ou en production
tail -f logs/application.log | grep PaydunyaService
```

### Problème : "response_code" n'est pas "00"

**Solution** : PayDunya a rejeté la requête. Consultez le `response_text` pour plus de détails :
```typescript
{
  "response_code": "01",
  "response_text": "Missing required field: invoice.total_amount"
}
```

---

## Support

### Documentation complète
- **Guide de migration** : `PAYDUNYA_MIGRATION_GUIDE.md`
- **Documentation PayDunya** : https://developers.paydunya.com/doc/FR/introduction
- **Code source** : `src/paydunya/`

### Contact
- **PayDunya Support** : [email protected]
- **Équipe Printalma** : Voir le fichier README.md

---

**Bon développement ! 🚀**
