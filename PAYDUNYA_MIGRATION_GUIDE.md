# Guide de Migration PayTech vers PayDunya

## Vue d'ensemble

Ce document décrit la migration complète du système de paiement de **PayTech** vers **PayDunya**. PayDunya offre une meilleure couverture régionale et supporte plusieurs opérateurs de Mobile Money en Afrique de l'Ouest.

## Table des matières

1. [Pourquoi PayDunya ?](#pourquoi-paydunya)
2. [Différences clés entre PayTech et PayDunya](#différences-clés)
3. [Configuration](#configuration)
4. [Structure de l'API](#structure-de-lapi)
5. [Migration étape par étape](#migration-étape-par-étape)
6. [Tests](#tests)
7. [Mise en production](#mise-en-production)

---

## Pourquoi PayDunya ?

### Avantages de PayDunya

- **Couverture régionale étendue** : Supporte Orange Money, Wave, MTN, Moov dans plusieurs pays (Sénégal, Bénin, Côte d'Ivoire, Togo, Mali, Burkina Faso)
- **Documentation complète** : API bien documentée avec exemples
- **Support multi-devises** : XOF, USD, EUR
- **Webhooks fiables** : IPN (Instant Payment Notification) robuste
- **Mode test complet** : Environnement sandbox avec données de test

---

## Différences clés entre PayTech et PayDunya

### Authentification

**PayTech** :
```bash
Headers:
  API_KEY: xxxxx
  API_SECRET: xxxxx
```

**PayDunya** :
```bash
Headers:
  PAYDUNYA-MASTER-KEY: xxxxx
  PAYDUNYA-PRIVATE-KEY: test_private_xxxxx (ou live_private_xxxxx)
  PAYDUNYA-TOKEN: xxxxx
  PAYDUNYA-MODE: test (ou live)
```

### Structure de requête

**PayTech** :
```json
{
  "item_name": "Produit",
  "item_price": 5000,
  "ref_command": "ORD-123",
  "command_name": "Commande 123",
  "currency": "XOF",
  "env": "test"
}
```

**PayDunya** :
```json
{
  "invoice": {
    "total_amount": 5000,
    "description": "Commande ORD-123",
    "customer": {
      "name": "Client Name",
      "email": "client@example.com",
      "phone": "+221701234567"
    }
  },
  "store": {
    "name": "Printalma Store"
  },
  "actions": {
    "callback_url": "https://your-domain.com/paydunya/callback",
    "return_url": "https://your-frontend.com/payment/success",
    "cancel_url": "https://your-frontend.com/payment/cancel"
  },
  "custom_data": {
    "order_number": "ORD-123"
  }
}
```

### Endpoints

**PayTech** :
- Initialiser paiement : `POST https://paytech.sn/api/payment/request-payment`
- Vérifier statut : `GET https://paytech.sn/api/payment/get-status?token_payment={token}`

**PayDunya** :
- **Sandbox** : `POST https://app.paydunya.com/sandbox-api/v1/checkout-invoice/create`
- **Production** : `POST https://app.paydunya.com/api/v1/checkout-invoice/create`
- Vérifier statut : `GET https://app.paydunya.com/[sandbox-]api/v1/checkout-invoice/confirm/{token}`

### Codes de réponse

**PayTech** :
- `success: 1` = Succès
- `success: 0` = Échec

**PayDunya** :
- `response_code: "00"` = Succès
- Autres codes = Échec

### Statuts de paiement

**PayTech** :
- `sale_complete` = Paiement réussi
- `sale_canceled` = Paiement annulé

**PayDunya** :
- `completed` = Paiement réussi
- `cancelled` = Paiement annulé
- `failed` = Paiement échoué
- `pending` = En attente

---

## Configuration

### 1. Variables d'environnement

Créez ou modifiez votre fichier `.env` avec les clés PayDunya fournies :

```bash
# PayDunya Payment Gateway Configuration
PAYDUNYA_MASTER_KEY="1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj"

# Test Mode (pour le développement)
PAYDUNYA_PRIVATE_KEY="test_private_uImFqxfqokHqbqHI4PXJ24huucO"
PAYDUNYA_PUBLIC_KEY="test_public_kvxlzRxFxoS2gFO3FhSxtF3Owwt"
PAYDUNYA_TOKEN="BuVS3uuAKsg9bYyGcT9B"
PAYDUNYA_MODE="test"

# Production Mode (pour la production)
# PAYDUNYA_PRIVATE_KEY="live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG"
# PAYDUNYA_PUBLIC_KEY="live_public_JzyUBGQTafgpOPqRulSDGDVfHzz"
# PAYDUNYA_TOKEN="lt8YNn0GPW6DTIWcCZ8f"
# PAYDUNYA_MODE="live"

# URLs
PAYDUNYA_CALLBACK_URL="https://your-domain.com/paydunya/callback"
PAYDUNYA_RETURN_URL="https://your-frontend.com/payment/success"
PAYDUNYA_CANCEL_URL="https://your-frontend.com/payment/cancel"
FRONTEND_URL="https://your-frontend.com"
```

### 2. Installation des dépendances

```bash
npm install
```

### 3. Vérification de la configuration

```bash
# Test de la configuration PayDunya
curl http://localhost:3000/paydunya/test-config
```

---

## Structure de l'API

### Nouveaux endpoints disponibles

| Endpoint | Méthode | Description | Auth |
|----------|---------|-------------|------|
| `/paydunya/payment` | POST | Initialiser un paiement | Public |
| `/paydunya/callback` | POST | Webhook IPN de PayDunya | Public |
| `/paydunya/status/:token` | GET | Vérifier le statut d'un paiement | Public |
| `/paydunya/refund` | POST | Demander un remboursement | Admin |
| `/paydunya/test-config` | GET | Tester la configuration | Public |

### Architecture des modules

```
src/
├── paydunya/
│   ├── dto/
│   │   ├── payment-request.dto.ts    # DTOs pour les requêtes
│   │   ├── payment-response.dto.ts   # DTOs pour les réponses
│   │   └── refund-request.dto.ts     # DTOs pour les remboursements
│   ├── paydunya.controller.ts        # Contrôleur des endpoints
│   ├── paydunya.service.ts           # Logique métier PayDunya
│   └── paydunya.module.ts            # Module NestJS
```

---

## Migration étape par étape

### Étape 1 : Garder PayTech en parallèle (Recommandé)

Pour une transition en douceur, conservez PayTech actif en parallèle avec PayDunya :

```typescript
// Les deux modules sont actifs dans app.module.ts
imports: [
  // ...
  PaytechModule,  // Ancien système (toujours actif)
  PaydunyaModule  // Nouveau système
]
```

### Étape 2 : Migrer progressivement les commandes

#### Option A : Feature Flag

Ajoutez un feature flag dans la base de données :

```typescript
// Dans votre service de commande
async createOrder(orderData) {
  const usePayDunya = await this.configService.get('USE_PAYDUNYA');

  if (usePayDunya) {
    return this.paydunyaService.createInvoice(orderData);
  } else {
    return this.paytechService.requestPayment(orderData);
  }
}
```

#### Option B : Migration par pourcentage

Migrez progressivement un pourcentage des utilisateurs :

```typescript
const random = Math.random();
const usePayDunya = random < 0.1; // 10% des utilisateurs
```

### Étape 3 : Adapter le frontend

#### Ancien code (PayTech) :

```typescript
// Frontend - Initialisation PayTech
const response = await fetch('/paytech/payment', {
  method: 'POST',
  body: JSON.stringify({
    item_name: 'Produit',
    item_price: 5000,
    ref_command: orderNumber,
    command_name: `Commande ${orderNumber}`,
    currency: 'XOF'
  })
});

const { data } = await response.json();
window.location.href = data.redirect_url;
```

#### Nouveau code (PayDunya) :

```typescript
// Frontend - Initialisation PayDunya
const response = await fetch('/paydunya/payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoice: {
      total_amount: 5000,
      description: `Commande ${orderNumber}`,
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
      return_url: `https://printalma.com/orders/${orderNumber}/success`,
      cancel_url: `https://printalma.com/orders/${orderNumber}/cancel`
    },
    custom_data: {
      order_number: orderNumber,
      user_id: user.id
    }
  })
});

const { data } = await response.json();
window.location.href = data.redirect_url;
```

### Étape 4 : Gestion des webhooks

PayDunya envoie les notifications IPN au endpoint `/paydunya/callback`. Assurez-vous que :

1. Ce endpoint est **accessible publiquement** (pas de guard d'authentification)
2. Le endpoint est en **HTTPS** en production
3. L'URL est configurée dans le dashboard PayDunya

#### Configurer l'URL IPN dans PayDunya :

1. Connectez-vous à votre compte PayDunya
2. Allez dans **Paramètres** > **API**
3. Ajoutez l'URL de callback : `https://your-domain.com/paydunya/callback`

---

## Tests

### 1. Test de configuration

```bash
# Vérifier que les clés sont correctement configurées
curl http://localhost:3000/paydunya/test-config
```

Réponse attendue :
```json
{
  "success": true,
  "message": "PayDunya service is configured and ready",
  "data": {
    "mode": "test",
    "baseUrl": "https://app.paydunya.com/sandbox-api/v1",
    "hasMasterKey": true,
    "hasPrivateKey": true,
    "hasToken": true
  }
}
```

### 2. Test d'initialisation de paiement

```bash
curl -X POST http://localhost:3000/paydunya/payment \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": {
      "total_amount": 1000,
      "description": "Test Order #TEST-001",
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

### 3. Test du webhook (callback IPN)

```bash
curl -X POST http://localhost:3000/paydunya/callback \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'invoice_token=abc123def456&status=completed&total_amount=1000&custom_data={"order_number":"TEST-001"}'
```

### 4. Test de vérification de statut

```bash
curl http://localhost:3000/paydunya/status/abc123def456
```

---

## Mise en production

### Checklist avant la production

- [ ] Tester tous les flux de paiement en mode sandbox
- [ ] Vérifier que les webhooks fonctionnent correctement
- [ ] Configurer les clés de production dans `.env`
- [ ] Changer `PAYDUNYA_MODE="live"`
- [ ] Mettre à jour l'URL de callback dans le dashboard PayDunya
- [ ] Tester un paiement réel avec un petit montant (100 XOF)
- [ ] Vérifier que les commandes sont correctement mises à jour
- [ ] Surveiller les logs pour détecter les erreurs
- [ ] Configurer des alertes pour les paiements échoués

### Passage en production

1. **Mettez à jour les variables d'environnement** :

```bash
# .env (Production)
PAYDUNYA_MASTER_KEY="1nMjPuqy-oa01-tJIO-g8J2-u1wfqxtUDnlj"
PAYDUNYA_PRIVATE_KEY="live_private_qOMBJy26LHbUJr2JNDQ2OJRfoTG"
PAYDUNYA_PUBLIC_KEY="live_public_JzyUBGQTafgpOPqRulSDGDVfHzz"
PAYDUNYA_TOKEN="lt8YNn0GPW6DTIWcCZ8f"
PAYDUNYA_MODE="live"
```

2. **Redémarrez l'application** :

```bash
npm run build
npm run start:prod
```

3. **Testez avec un paiement réel** :

Effectuez une vraie transaction avec un petit montant pour vérifier que tout fonctionne.

4. **Monitorer les logs** :

```bash
# Surveiller les logs en temps réel
tail -f logs/application.log
```

---

## Gestion des erreurs

### Catégories d'erreurs PayDunya

Le service PayDunya gère les erreurs suivantes :

| Catégorie | Description | Action recommandée |
|-----------|-------------|-------------------|
| `insufficient_funds` | Fonds insuffisants | Proposer une autre méthode de paiement |
| `timeout` | Session expirée | Réessayer le paiement |
| `user_action` | Annulé par l'utilisateur | Permettre de réessayer |
| `fraud` | Transaction suspecte | Contacter le support |
| `technical_error` | Erreur technique | Réessayer plus tard |
| `other` | Erreur inconnue | Contacter le support |

### Messages utilisateur

Le service fournit automatiquement des messages user-friendly en français :

```typescript
const failureDetails = paydunyaService.getPaymentFailureReason(callbackData);
const userMessage = paydunyaService.getFailureUserMessage(failureDetails);
// Exemple : "Fonds insuffisants. Veuillez vérifier votre solde..."
```

---

## Support et documentation

### Documentation officielle PayDunya

- **Site web** : https://paydunya.com
- **Documentation API** : https://developers.paydunya.com/doc/FR/introduction
- **Support** : [email protected]

### Documentation du projet

- `src/paydunya/paydunya.service.ts` : Service principal
- `src/paydunya/paydunya.controller.ts` : Endpoints API
- `src/paydunya/dto/` : Définitions des types

### Logs et debugging

Les logs sont disponibles dans la console avec le préfixe `[PaydunyaService]` :

```
[PaydunyaService] PayDunya service initialized successfully in test mode
[PaydunyaService] Creating PayDunya invoice: Order #ORD-123
[PaydunyaService] Invoice created successfully: abc123def456
[PaydunyaService] IPN callback received for invoice: abc123def456
[PaydunyaService] Payment status: completed
```

---

## FAQ

### Q: Puis-je garder PayTech et PayDunya en parallèle ?

**R:** Oui, c'est recommandé pour une transition en douceur. Les deux modules peuvent coexister dans l'application.

### Q: Comment tester sans dépenser d'argent réel ?

**R:** Utilisez le mode `test` avec les clés préfixées par `test_`. PayDunya fournit un environnement sandbox complet.

### Q: Que se passe-t-il si un paiement échoue ?

**R:** Le système crée automatiquement un `PaymentAttempt` avec les détails de l'échec et met à jour la commande. L'utilisateur reçoit un message explicite selon la catégorie d'erreur.

### Q: Les commandes existantes (PayTech) sont-elles affectées ?

**R:** Non, les commandes PayTech existantes continuent de fonctionner normalement. La migration est transparente.

### Q: Comment gérer les remboursements ?

**R:** Utilisez l'endpoint `/paydunya/refund` (nécessite les droits admin) :

```bash
curl -X POST http://localhost:3000/paydunya/refund \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_token": "abc123def456",
    "reason": "Annulation demandée par le client"
  }'
```

---

## Conclusion

La migration vers PayDunya offre une expérience de paiement améliorée avec une meilleure couverture régionale et des fonctionnalités plus robustes.

**Prochaines étapes** :

1. Tester en mode sandbox
2. Valider tous les flux de paiement
3. Migrer progressivement en production
4. Surveiller et optimiser

**Besoin d'aide ?** Contactez l'équipe de développement ou consultez la documentation PayDunya.

---

**Date de création** : 2025-01-31
**Version** : 1.0.0
**Auteur** : Équipe Printalma
