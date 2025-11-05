# 🔄 STRATÉGIE DE MISE À JOUR AUTOMATIQUE DES COMMANDES VIA PAYDUNYA

## 📋 État Actuel de l'Implémentation

### ✅ Ce qui est déjà en place

Votre système est **déjà configuré** pour mettre à jour automatiquement le statut des commandes lors du paiement PayDunya. Voici comment ça fonctionne :

---

## 🔄 Flux Actuel du Paiement

### 1️⃣ Création de la Commande
**Fichier:** `src/order/order.service.ts:27-215`

```typescript
// Lors de la création de commande avec paymentMethod: "PAYDUNYA"
const order = await this.createOrder(userId, createOrderDto);

// Le système initialise automatiquement le paiement
if (createOrderDto.paymentMethod === PaymentMethod.PAYDUNYA &&
    createOrderDto.initiatePayment) {

  // Création de l'invoice PayDunya
  const paymentResponse = await this.paydunyaService.createInvoice({
    invoice: {
      total_amount: order.totalAmount,
      description: `Commande Printalma - ${order.orderNumber}`,
      customer: { name, email, phone }
    },
    custom_data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: userId
    }
  });

  // Retourne l'URL de paiement au client
  return { ...order, payment: paymentData };
}
```

**Statuts initiaux:**
- `status`: `PENDING`
- `paymentStatus`: `PENDING`

---

### 2️⃣ Le Client Effectue le Paiement

Le client est redirigé vers PayDunya avec l'URL :
```
https://app.paydunya.com/sandbox-checkout/invoice/{token}
```

Il effectue le paiement via :
- Orange Money
- Wave
- Carte bancaire
- Free Money
- Etc.

---

### 3️⃣ PayDunya Envoie le Webhook (IPN)

**Endpoint:** `POST /paydunya/webhook`
**Fichier:** `src/paydunya/paydunya.controller.ts:119-263`

PayDunya envoie automatiquement une notification IPN (Instant Payment Notification) à votre serveur :

```json
{
  "invoice_token": "test_XYZ123",
  "status": "completed",  // ← Statut du paiement
  "custom_data": "{\"orderId\":87,\"orderNumber\":\"ORD-123\"}",
  "total_amount": 5000,
  "payment_method": "orange_money",
  "customer_name": "Client Test",
  "customer_email": "client@test.com",
  "customer_phone": "+221775588834"
}
```

**Statuts possibles:**
- `completed` : Paiement réussi ✅
- `cancelled` : Paiement annulé ❌
- `failed` : Paiement échoué ❌

---

### 4️⃣ Traitement Automatique du Webhook

**Fichier:** `src/paydunya/paydunya.controller.ts:124-227`

Le système traite automatiquement le webhook :

```typescript
// 1. Vérification de l'authenticité
const isValid = this.paydunyaService.verifyCallback(callbackData);
if (!isValid) throw new BadRequestException('Invalid IPN data');

// 2. Détermination du succès
const isSuccess = this.paydunyaService.isPaymentSuccessful(callbackData);
// isSuccess = true si status === "completed"

// 3. Extraction des informations de la commande
const customData = JSON.parse(callbackData.custom_data);
const orderNumber = customData.orderNumber;
const orderId = customData.orderId;

// 4. Création du PaymentAttempt
await this.prisma.paymentAttempt.create({
  data: {
    orderId: order.id,
    amount: callbackData.total_amount,
    status: isSuccess ? 'SUCCESS' : 'FAILED',
    paymentMethod: callbackData.payment_method,
    paytechToken: callbackData.invoice_token,
    failureReason: failureDetails?.reason,
    attemptNumber: attemptNumber
  }
});

// 5. ✅ MISE À JOUR AUTOMATIQUE DU STATUT DE LA COMMANDE
await this.orderService.updateOrderPaymentStatus(
  orderNumber,
  isSuccess ? 'PAID' : 'FAILED',
  callbackData.invoice_token,
  failureDetails,
  attemptNumber
);
```

---

### 5️⃣ Mise à Jour dans la Base de Données

**Fichier:** `src/order/order.service.ts:278-373`

La méthode `updateOrderPaymentStatus` met automatiquement à jour :

```typescript
// Si le paiement est réussi (PAID)
await this.prisma.order.update({
  where: { orderNumber },
  data: {
    paymentStatus: 'PAID',
    status: OrderStatus.CONFIRMED,  // ← CHANGEMENT AUTOMATIQUE !
    transactionId: callbackData.invoice_token,
    paymentAttempts: attemptNumber,
    lastPaymentAttemptAt: new Date(),
    hasInsufficientFunds: false
  }
});

// Si le paiement échoue (FAILED)
await this.prisma.order.update({
  where: { orderNumber },
  data: {
    paymentStatus: 'FAILED',
    status: OrderStatus.PENDING,  // Reste PENDING
    paymentAttempts: attemptNumber,
    lastPaymentAttemptAt: new Date(),
    lastPaymentFailureReason: failureDetails.reason,
    hasInsufficientFunds: failureDetails.category === 'insufficient_funds'
  }
});
```

---

## ✅ Résumé : Le Changement est AUTOMATIQUE

### Flux Complet

```
1. Commande créée
   └─> status: PENDING
   └─> paymentStatus: PENDING

2. Client redirigé vers PayDunya

3. Client paie avec Orange Money/Visa/Wave

4. PayDunya envoie webhook → POST /paydunya/webhook

5. Système traite le webhook automatiquement
   ├─> Vérifie authenticité
   ├─> Extrait orderNumber
   ├─> Crée PaymentAttempt
   └─> Met à jour la commande

6. ✅ Commande mise à jour automatiquement
   └─> status: CONFIRMED
   └─> paymentStatus: PAID
   └─> transactionId: {token}
```

---

## 🔒 Sécurité Actuelle

### Vérifications Implémentées

**Fichier:** `src/paydunya/paydunya.service.ts:304-314`

```typescript
verifyCallback(callbackData: PayDunyaCallbackDto): boolean {
  // Validation basique des champs requis
  if (!callbackData.invoice_token || !callbackData.status) {
    return false;
  }
  return true;
}
```

⚠️ **Note:** La vérification actuelle est basique. Pour la production, il est recommandé d'ajouter :
- Vérification de signature HMAC (si PayDunya le fournit)
- Vérification de l'IP source (liste blanche PayDunya)
- Vérification du montant (correspondance avec la commande)

---

## 🌐 Configuration Requise pour la Production

### 1. URLs de Callback

**Fichier:** `.env`

```env
# ❌ ACTUELLEMENT (localhost - ne fonctionne pas en production)
PAYDUNYA_CALLBACK_URL="http://localhost:3004/paydunya/webhook"

# ✅ À CONFIGURER POUR LA PRODUCTION (HTTPS requis)
PAYDUNYA_CALLBACK_URL="https://api.printalma.com/paydunya/webhook"
PAYDUNYA_RETURN_URL="https://printalma.com/payment/success"
PAYDUNYA_CANCEL_URL="https://printalma.com/payment/cancel"
```

### 2. Endpoint Webhook

**Requis pour la production:**
- ✅ HTTPS obligatoire (PayDunya ne peut pas envoyer sur HTTP)
- ✅ Accessible publiquement
- ✅ Pas d'authentification (endpoint public pour PayDunya)
- ✅ Temps de réponse < 10 secondes

**Endpoint actuel:**
```
POST https://api.printalma.com/paydunya/webhook
```

---

## 🧪 Test en Local

### Problème avec Localhost

PayDunya **NE PEUT PAS** envoyer de webhook à `localhost` car :
- Localhost n'est pas accessible depuis Internet
- PayDunya est sur leurs serveurs, pas sur votre machine

### Solutions pour Tester en Local

#### Option 1: Simuler le Webhook Manuellement ✅

```bash
# Simuler un webhook de succès
curl -X POST http://localhost:3004/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_token": "test_GzRMdpCUqF",
    "status": "completed",
    "custom_data": "{\"orderNumber\":\"ORD-1762366423948\",\"orderId\":87}",
    "total_amount": 5000,
    "payment_method": "orange_money"
  }'
```

#### Option 2: Utiliser ngrok pour Exposer Localhost

```bash
# Installer ngrok
npm install -g ngrok

# Exposer le port 3004
ngrok http 3004

# Ngrok vous donnera une URL publique:
# https://abc123.ngrok.io → localhost:3004

# Mettre à jour .env temporairement
PAYDUNYA_CALLBACK_URL="https://abc123.ngrok.io/paydunya/webhook"
```

#### Option 3: Vérifier Manuellement le Statut

```bash
# Après avoir payé, vérifier le statut avec l'API PayDunya
curl -X GET http://localhost:3004/paydunya/status/test_GzRMdpCUqF

# Puis mettre à jour manuellement si nécessaire
node check-order-status.js 87
```

---

## 📊 Monitoring et Vérification

### Vérifier si le Webhook a été Reçu

```bash
# Voir les logs du serveur
tail -f server.log | grep -E "webhook|IPN|PayDunya"

# Vérifier la commande dans la DB
node check-order-status.js 87

# Surveillance en temps réel
node monitor-payment.js
```

### Structure de la Réponse Webhook

```json
{
  "success": true,
  "message": "PayDunya webhook processed successfully",
  "data": {
    "invoice_token": "test_GzRMdpCUqF",
    "order_number": "ORD-1762366423948",
    "payment_status": "success",
    "status_updated": true,
    "failure_details": null
  }
}
```

---

## 🚀 Recommandations pour la Production

### 1. Ajouter la Vérification de Signature

```typescript
// src/paydunya/paydunya.service.ts
verifyCallback(callbackData: PayDunyaCallbackDto): boolean {
  // TODO: Implémenter la vérification HMAC si disponible

  // Vérification du montant
  const order = await this.prisma.order.findFirst({
    where: { orderNumber: customData.orderNumber }
  });

  if (order.totalAmount !== callbackData.total_amount) {
    this.logger.error('Amount mismatch in webhook');
    return false;
  }

  // Vérification de l'IP source (si PayDunya fournit une liste)
  const allowedIPs = ['IP1', 'IP2']; // Liste PayDunya
  if (!allowedIPs.includes(requestIP)) {
    return false;
  }

  return true;
}
```

### 2. Ajouter des Logs de Webhook

```typescript
// Sauvegarder tous les webhooks reçus
await this.prisma.webhookLog.create({
  data: {
    provider: 'paydunya',
    event: 'payment_notification',
    payload: callbackData,
    ipAddress: req.ip,
    receivedAt: new Date(),
    processed: true,
    orderId: order.id
  }
});
```

### 3. Gérer les Webhooks Dupliqués

```typescript
// Vérifier si ce webhook a déjà été traité
const existingAttempt = await this.prisma.paymentAttempt.findFirst({
  where: {
    orderId: order.id,
    paytechToken: callbackData.invoice_token
  }
});

if (existingAttempt) {
  this.logger.warn('Duplicate webhook received, ignoring');
  return { success: true, message: 'Already processed' };
}
```

### 4. Configurer un Système de Retry

Si le webhook échoue, PayDunya peut réessayer. Préparez-vous à :
- Recevoir le même webhook plusieurs fois
- Avoir une logique idempotente (pas de double-update)
- Logger tous les webhooks reçus

---

## ✅ Conclusion

### Votre système est DÉJÀ CONFIGURÉ pour :

1. ✅ Recevoir les webhooks PayDunya
2. ✅ Vérifier l'authenticité (basique)
3. ✅ Extraire les informations de commande
4. ✅ Créer un PaymentAttempt
5. ✅ **Mettre à jour automatiquement le statut de la commande**
6. ✅ Gérer les échecs de paiement
7. ✅ Tracker les tentatives multiples
8. ✅ Détecter les fonds insuffisants

### Ce qu'il faut faire pour la Production :

1. ⚠️ Configurer une URL HTTPS publique pour le webhook
2. ⚠️ Ajouter une vérification de signature plus robuste
3. ⚠️ Logger tous les webhooks reçus
4. ⚠️ Gérer les webhooks dupliqués
5. ⚠️ Tester avec ngrok en local

### Pour Tester Maintenant :

**Option A - Simuler le webhook (recommandé en local):**
```bash
./test-paydunya-webhook.sh
```

**Option B - Test réel avec ngrok:**
```bash
ngrok http 3004
# Mettre à jour PAYDUNYA_CALLBACK_URL avec l'URL ngrok
# Effectuer un vrai paiement
```

**Option C - Vérifier manuellement:**
```bash
# Payer sur PayDunya
# Puis vérifier :
node check-order-status.js 87
```

---

## 🔗 Références

- **PayDunya Docs:** https://developers.paydunya.com/doc/FR/introduction
- **Dashboard:** https://app.paydunya.com/dashboard
- **Support:** support@paydunya.com

---

**Créé le:** 05/11/2025
**Version:** 1.0
**Statut:** ✅ Système fonctionnel, prêt pour tests en production
