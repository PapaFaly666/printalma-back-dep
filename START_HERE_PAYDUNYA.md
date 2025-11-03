# 🚀 COMMENCER ICI - Intégration PayDunya

## ✅ Intégration PayDunya COMPLÈTE

L'intégration PayDunya est **100% terminée** et prête à être utilisée. Suivez ce guide pour démarrer en **5 minutes**.

---

## 📋 Étape 1 : Configuration (2 minutes)

### Créer le fichier `.env`

```bash
# Copier la configuration prête à l'emploi
cp .env.paydunya .env
```

OU copiez manuellement cette configuration dans votre fichier `.env` :

```bash
# PayDunya - Mode TEST (pour le développement)
PAYDUNYA_MASTER_KEY="1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj"
PAYDUNYA_PRIVATE_KEY="test_private_uImFqxfqokHqbqHI4PXJ24huucO"
PAYDUNYA_PUBLIC_KEY="test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt"
PAYDUNYA_TOKEN="BuVS3uuAKsg9bYyGcT9B"
PAYDUNYA_MODE="test"

# URLs
PAYDUNYA_CALLBACK_URL="http://localhost:3000/paydunya/callback"
PAYDUNYA_RETURN_URL="http://localhost:3001/payment/success"
PAYDUNYA_CANCEL_URL="http://localhost:3001/payment/cancel"
FRONTEND_URL="http://localhost:3001"

# Ajoutez aussi vos autres variables (DATABASE_URL, JWT_SECRET, etc.)
```

---

## 🔧 Étape 2 : Installation et démarrage (2 minutes)

```bash
# Installer les dépendances
npm install

# Démarrer l'application
npm run start:dev
```

Attendez que l'application démarre. Vous devriez voir :
```
[PaydunyaService] PayDunya service initialized successfully in test mode
```

---

## 🧪 Étape 3 : Tests (1 minute)

### Test rapide de configuration

```bash
curl http://localhost:3000/paydunya/test-config
```

**Résultat attendu** :
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

### Test complet automatisé

```bash
./test-paydunya.sh
```

Ce script teste automatiquement :
- ✅ Configuration
- ✅ Initialisation de paiement
- ✅ Vérification de statut
- ✅ Callback IPN (succès)
- ✅ Callback IPN (échec)

---

## 🎯 Étape 4 : Premier paiement test

### Créer une facture de test

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

**Résultat** :
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

### Ouvrir l'URL de paiement

Copiez la `redirect_url` et ouvrez-la dans votre navigateur pour tester le flux de paiement PayDunya.

---

## 📚 Documentation complète

| Document | Description |
|----------|-------------|
| **[PAYDUNYA_INDEX.md](./PAYDUNYA_INDEX.md)** | 📑 Index et navigation |
| **[PAYDUNYA_QUICKSTART.md](./PAYDUNYA_QUICKSTART.md)** | ⚡ Guide rapide (5 min) |
| **[PAYDUNYA_README.md](./PAYDUNYA_README.md)** | 📖 Vue d'ensemble complète |
| **[PAYDUNYA_IMPLEMENTATION.md](./PAYDUNYA_IMPLEMENTATION.md)** | 🔧 Détails techniques |
| **[PAYDUNYA_MIGRATION_GUIDE.md](./PAYDUNYA_MIGRATION_GUIDE.md)** | 🔄 Migration PayTech → PayDunya |

---

## 🚀 Intégration Frontend

### Exemple React/TypeScript

```typescript
const handlePayment = async () => {
  try {
    const response = await fetch('http://localhost:3000/paydunya/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoice: {
          total_amount: 5000, // 5000 XOF
          description: `Commande #${orderId}`,
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

    // Rediriger vers PayDunya
    window.location.href = data.redirect_url;

  } catch (error) {
    console.error('Payment error:', error);
    alert('Erreur lors de l\'initialisation du paiement');
  }
};

return <button onClick={handlePayment}>Payer avec PayDunya</button>;
```

---

## 📡 Endpoints API disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/paydunya/test-config` | GET | Tester la configuration |
| `/paydunya/payment` | POST | Initialiser un paiement |
| `/paydunya/callback` | POST | Webhook IPN PayDunya |
| `/paydunya/status/:token` | GET | Vérifier le statut |
| `/paydunya/refund` | POST | Demander un remboursement (Admin) |

---

## 🔐 Passer en Production

### 1. Changer les clés dans `.env`

```bash
# PayDunya - Mode PRODUCTION
PAYDUNYA_MASTER_KEY="1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj"
PAYDUNYA_PRIVATE_KEY="live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG"
PAYDUNYA_PUBLIC_KEY="live_public_JzyUBGQTafgpOPqRulSDGDVfHzz"
PAYDUNYA_TOKEN="lt8YNn0GPW6DTIWcCZ8f"
PAYDUNYA_MODE="live"

# URLs de production (HTTPS obligatoire)
PAYDUNYA_CALLBACK_URL="https://api.printalma.com/paydunya/callback"
PAYDUNYA_RETURN_URL="https://printalma.com/payment/success"
PAYDUNYA_CANCEL_URL="https://printalma.com/payment/cancel"
```

### 2. Configurer le webhook dans PayDunya

1. Connectez-vous à votre dashboard PayDunya
2. Allez dans **Paramètres** > **API**
3. Ajoutez l'URL : `https://api.printalma.com/paydunya/callback`

### 3. Tester avec un petit montant

```bash
# Test avec 100 XOF
curl -X POST https://api.printalma.com/paydunya/payment \
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

## ✨ Ce qui a été créé

### Code source
```
src/paydunya/
├── dto/
│   ├── payment-request.dto.ts
│   ├── payment-response.dto.ts
│   └── refund-request.dto.ts
├── paydunya.controller.ts
├── paydunya.service.ts
└── paydunya.module.ts
```

### Documentation (5 fichiers)
- PAYDUNYA_INDEX.md - Navigation
- PAYDUNYA_README.md - Vue d'ensemble
- PAYDUNYA_QUICKSTART.md - Démarrage rapide
- PAYDUNYA_IMPLEMENTATION.md - Détails techniques
- PAYDUNYA_MIGRATION_GUIDE.md - Migration complète

### Tests et configuration
- test-paydunya.sh - Script de test automatisé
- .env.paydunya - Configuration prête à l'emploi
- .env.example - Mis à jour avec PayDunya

---

## 🎯 Fonctionnalités

- ✅ Initialisation de paiement
- ✅ Support de tous les opérateurs (Orange Money, Wave, MTN, Moov)
- ✅ Webhooks IPN automatiques
- ✅ Gestion d'erreurs détaillée avec messages en français
- ✅ Tracking des tentatives de paiement
- ✅ Remboursements (admin)
- ✅ Mode test et production
- ✅ Compatible PayTech (parallèle possible)

---

## ❓ Questions fréquentes

### L'intégration est-elle complète ?
**Oui !** Tous les endpoints sont fonctionnels et testés.

### Dois-je supprimer PayTech ?
**Non.** Les deux systèmes peuvent coexister pendant la transition.

### Combien de temps pour intégrer ?
- Configuration : **2 minutes**
- Tests : **5 minutes**
- Intégration frontend : **30 minutes**

### Où trouver de l'aide ?
- Documentation complète : Consultez **PAYDUNYA_INDEX.md**
- Support PayDunya : [email protected]
- API Docs : https://developers.paydunya.com/doc/FR/introduction

---

## 🆘 Problèmes ?

### Erreur : "PayDunya API credentials missing"
```bash
# Vérifier les variables d'environnement
env | grep PAYDUNYA

# Solution : Ajouter les variables dans .env
```

### Le paiement ne s'initialise pas
```bash
# Vérifier la configuration
curl http://localhost:3000/paydunya/test-config

# Vérifier les logs
npm run start:dev
```

### Le webhook ne fonctionne pas
- Vérifiez que `/paydunya/callback` est accessible
- Utilisez HTTPS en production
- Vérifiez l'URL configurée dans le dashboard PayDunya

---

## 🎉 C'est tout !

Vous êtes maintenant prêt à utiliser PayDunya.

**Prochaines étapes** :
1. ✅ Tests terminés → Intégrer le frontend
2. 📖 Lire la documentation complète dans PAYDUNYA_INDEX.md
3. 🚀 Préparer la mise en production

**Besoin d'aide ?** Consultez [PAYDUNYA_INDEX.md](./PAYDUNYA_INDEX.md) pour naviguer dans la documentation.

---

**Bonne intégration ! 🚀**

_Dernière mise à jour : 2025-01-31_
