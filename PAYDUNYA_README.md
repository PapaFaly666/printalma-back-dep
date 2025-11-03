# 💳 Intégration PayDunya - Printalma Backend

## 🎯 Vue d'ensemble

Ce projet intègre maintenant **PayDunya** comme solution de paiement, remplaçant progressivement PayTech. PayDunya offre une meilleure couverture régionale en Afrique de l'Ouest avec support de plusieurs opérateurs Mobile Money (Orange Money, Wave, MTN, Moov) dans 7 pays.

---

## 📚 Documentation disponible

| Document | Description | Pour qui ? |
|----------|-------------|------------|
| **[PAYDUNYA_QUICKSTART.md](./PAYDUNYA_QUICKSTART.md)** | Démarrage rapide (5 min) | Développeurs pressés |
| **[PAYDUNYA_IMPLEMENTATION.md](./PAYDUNYA_IMPLEMENTATION.md)** | Résumé de l'implémentation | Chefs de projet, Développeurs |
| **[PAYDUNYA_MIGRATION_GUIDE.md](./PAYDUNYA_MIGRATION_GUIDE.md)** | Guide complet de migration | Équipe technique |
| **[test-paydunya.sh](./test-paydunya.sh)** | Script de test automatisé | QA, Développeurs |

---

## ⚡ Démarrage rapide

### 1. Configuration (2 minutes)

Créez ou modifiez votre fichier `.env` :

```bash
# PayDunya Test Configuration
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
```

### 2. Installation et démarrage

```bash
npm install
npm run start:dev
```

### 3. Test rapide

```bash
# Test de configuration
curl http://localhost:3000/paydunya/test-config

# Test complet
./test-paydunya.sh
```

**✅ C'est tout !** Votre intégration PayDunya est prête.

---

## 🔑 Clés API

### Mode Test (Sandbox)

```bash
Master Key:     1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj
Private Key:    test_private_uImFqxfqokHqbqHI4PXJ24huucO
Public Key:     test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt
Token:          BuVS3uuAKsg9bYyGcT9B
```

### Mode Production (Live)

```bash
Master Key:     1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj
Private Key:    live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG
Public Key:     live_public_JzyUBGQTafgpOPqRulSDGDVfHzz
Token:          lt8YNn0GPW6DTIWcCZ8f
```

---

## 🛠️ Endpoints API

### Base URL
- **Test** : `http://localhost:3000/paydunya`
- **Production** : `https://your-domain.com/paydunya`

### Endpoints disponibles

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/test-config` | GET | Tester la configuration | Public |
| `/payment` | POST | Initialiser un paiement | Public |
| `/callback` | POST | Webhook IPN PayDunya | Public |
| `/status/:token` | GET | Vérifier statut paiement | Public |
| `/refund` | POST | Demander remboursement | Admin |

---

## 💡 Exemple d'utilisation

### Backend : Initialiser un paiement

```typescript
// POST /paydunya/payment
const response = await fetch('http://localhost:3000/paydunya/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoice: {
      total_amount: 5000,              // 5000 XOF
      description: 'Order #ORD-123',
      customer: {
        name: 'Amadou Diallo',
        email: 'amadou@example.com',
        phone: '+221701234567'
      }
    },
    store: {
      name: 'Printalma Store',
      tagline: 'Impression de qualité'
    },
    custom_data: {
      order_number: 'ORD-123',
      user_id: 'user-456'
    }
  })
});

const { data } = await response.json();
// Rediriger vers : data.redirect_url
```

### Frontend : Bouton de paiement

```typescript
const handlePayment = async () => {
  const response = await fetch('http://localhost:3000/paydunya/payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData)
  });

  const { data } = await response.json();
  window.location.href = data.redirect_url; // Redirection PayDunya
};

return <button onClick={handlePayment}>Payer avec PayDunya</button>;
```

### Webhook : Réception automatique

PayDunya envoie automatiquement une notification à `/paydunya/callback` après chaque paiement :

```json
{
  "invoice_token": "abc123def456",
  "status": "completed",
  "total_amount": 5000,
  "payment_method": "orange-money-senegal",
  "custom_data": "{\"order_number\":\"ORD-123\"}"
}
```

Le backend traite automatiquement :
- ✅ Vérification de l'authenticité
- ✅ Mise à jour du statut de la commande
- ✅ Création d'un PaymentAttempt
- ✅ Gestion des erreurs

---

## 🧪 Tests

### Test 1 : Configuration

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

### Test 2 : Paiement

```bash
curl -X POST http://localhost:3000/paydunya/payment \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": {
      "total_amount": 1000,
      "description": "Test Order",
      "customer": { "name": "Test User" }
    },
    "store": { "name": "Printalma Store" }
  }'
```

### Test 3 : Script complet

```bash
./test-paydunya.sh
```

Ce script teste automatiquement :
- Configuration
- Initialisation de paiement
- Vérification de statut
- Callback IPN (succès)
- Callback IPN (échec)

---

## 🎯 Fonctionnalités

### ✅ Implémenté

- [x] Initialisation de paiement
- [x] Webhooks IPN
- [x] Vérification de statut
- [x] Remboursements (admin)
- [x] Gestion des erreurs détaillée
- [x] Messages utilisateur en français
- [x] Tracking des tentatives de paiement
- [x] Support de tous les canaux Mobile Money
- [x] Mode test et production
- [x] Documentation complète

### 📊 Gestion des erreurs

Le système gère automatiquement :

| Catégorie | Message utilisateur |
|-----------|---------------------|
| `insufficient_funds` | "Fonds insuffisants. Veuillez vérifier votre solde..." |
| `timeout` | "Session expirée. Veuillez réessayer le paiement." |
| `user_action` | "Paiement annulé. Vous pouvez réessayer..." |
| `fraud` | "Paiement bloqué pour des raisons de sécurité..." |
| `technical_error` | "Erreur technique. Veuillez réessayer..." |

---

## 🚀 Migration depuis PayTech

### Option 1 : Parallèle (Recommandé)

Gardez PayTech et PayDunya actifs en même temps pour une transition en douceur.

### Option 2 : Progressive

Migrez un pourcentage d'utilisateurs vers PayDunya (ex: 10%, puis 50%, puis 100%).

### Option 3 : Directe

Basculez complètement de PayTech vers PayDunya.

**Voir [PAYDUNYA_MIGRATION_GUIDE.md](./PAYDUNYA_MIGRATION_GUIDE.md) pour les détails.**

---

## 📦 Structure du code

```
src/paydunya/
├── dto/
│   ├── payment-request.dto.ts     # Structure des requêtes
│   ├── payment-response.dto.ts    # Structure des réponses
│   └── refund-request.dto.ts      # Structure des remboursements
├── paydunya.controller.ts          # Endpoints API
├── paydunya.service.ts             # Logique métier
└── paydunya.module.ts              # Module NestJS
```

---

## 🔧 Troubleshooting

### Problème : "PayDunya API credentials missing"

**Solution** : Vérifiez `.env` et assurez-vous que toutes les variables sont définies :
```bash
echo $PAYDUNYA_MASTER_KEY
echo $PAYDUNYA_PRIVATE_KEY
echo $PAYDUNYA_TOKEN
```

### Problème : Webhook ne fonctionne pas

**Solution** :
1. Vérifiez que `/paydunya/callback` est accessible publiquement
2. Utilisez HTTPS en production
3. Vérifiez l'URL dans le dashboard PayDunya
4. Consultez les logs : `tail -f logs/application.log | grep Paydunya`

### Problème : Payment initialization échoue

**Solution** : Vérifiez le `response_text` dans la réponse :
```json
{
  "response_code": "01",
  "response_text": "Missing required field: invoice.total_amount"
}
```

---

## 📖 Ressources

### Documentation du projet

- **Démarrage rapide** : [PAYDUNYA_QUICKSTART.md](./PAYDUNYA_QUICKSTART.md)
- **Implémentation** : [PAYDUNYA_IMPLEMENTATION.md](./PAYDUNYA_IMPLEMENTATION.md)
- **Migration** : [PAYDUNYA_MIGRATION_GUIDE.md](./PAYDUNYA_MIGRATION_GUIDE.md)

### Documentation PayDunya

- **Site officiel** : https://paydunya.com
- **API Documentation** : https://developers.paydunya.com/doc/FR/introduction
- **Support** : [email protected]

### Code source

- Service : `src/paydunya/paydunya.service.ts`
- Controller : `src/paydunya/paydunya.controller.ts`
- DTOs : `src/paydunya/dto/`

---

## 🎓 Prochaines étapes

### Pour démarrer maintenant

1. **Configurer** : Copiez les clés dans `.env`
2. **Démarrer** : `npm run start:dev`
3. **Tester** : `./test-paydunya.sh`
4. **Intégrer** : Suivez les exemples ci-dessus

### Pour aller plus loin

1. **Lire** : [PAYDUNYA_QUICKSTART.md](./PAYDUNYA_QUICKSTART.md) (5 min)
2. **Comprendre** : [PAYDUNYA_IMPLEMENTATION.md](./PAYDUNYA_IMPLEMENTATION.md)
3. **Migrer** : [PAYDUNYA_MIGRATION_GUIDE.md](./PAYDUNYA_MIGRATION_GUIDE.md)

---

## ✨ Résumé

**PayDunya est maintenant intégré et prêt à l'emploi !**

- ✅ Configuration simple (2 minutes)
- ✅ API complète et documentée
- ✅ Tests automatisés inclus
- ✅ Gestion d'erreurs robuste
- ✅ Mode test et production
- ✅ Migration progressive possible

**Questions ?** Consultez la documentation ou contactez l'équipe technique.

---

**Date** : 2025-01-31
**Version** : 1.0.0
**Statut** : ✅ Production Ready
