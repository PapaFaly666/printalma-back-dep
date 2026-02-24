# Orange Money - API Finale (Endpoints Réels Uniquement)

**Basé sur la documentation officielle PDF**
**Date:** 2026-02-24
**Statut:** ✅ Code nettoyé - Uniquement les endpoints qui existent vraiment

---

## ✅ Endpoints de VOTRE Backend (Qui fonctionnent)

### 1. **GET /orange-money/test-connection**

Teste la connexion OAuth2 avec l'API Orange Money.

**Réponse:**
```json
{
  "success": true,
  "mode": "live",
  "source": "database",
  "tokenObtained": true
}
```

---

### 2. **POST /orange-money/payment**

Génère un QR Code et des deeplinks pour le paiement.

**Appelle l'API Orange Money:** `POST /api/eWallet/v4/qrcode`

**Body:**
```json
{
  "orderId": 123,
  "orderNumber": "ORD-12345",
  "amount": 10000,
  "customerName": "Jean Dupont",
  "customerPhone": "771234567"
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "deepLinks": {
      "MAXIT": "https://sugu.orange-sonatel.com/en/dgjun_KudhPKtfthdzua",
      "OM": "https://orangemoneysn.page.link/rrzuoARuU7tK5uN6"
    },
    "validity": 600,
    "reference": "OM-ORD-12345-1708786543210"
  }
}
```

---

### 3. **POST /orange-money/callback**

Endpoint webhook appelé par Orange Money quand un paiement est effectué.

**⚠️ Important:** Retourne 200 OK immédiatement, traite le callback en arrière-plan.

**Payload reçu d'Orange Money:**
```json
{
  "status": "SUCCESS",
  "transactionId": "TXN_123456789",
  "reference": "OM-ORD-12345-1708786543210",
  "apiKey": "votre_api_key",
  "amount": {
    "unit": "XOF",
    "value": 10000
  },
  "code": "599241",
  "metadata": {
    "orderId": "123",
    "orderNumber": "ORD-12345",
    "customerName": "Jean Dupont"
  }
}
```

**Statuts possibles:**
- `SUCCESS` → Met à jour Order.paymentStatus = PAID
- `FAILED` → Met à jour Order.paymentStatus = FAILED
- `CANCELLED` → Met à jour Order.paymentStatus = CANCELLED

---

### 4. **GET /orange-money/payment-status/:orderNumber**

Vérifie le statut de paiement d'une commande **depuis VOTRE base de données** (pas l'API Orange).

**Utilisé pour le polling côté frontend.**

**Exemple:**
```
GET /orange-money/payment-status/ORD-12345
```

**Réponse (Si payé):**
```json
{
  "success": true,
  "orderNumber": "ORD-12345",
  "paymentStatus": "PAID",
  "transactionId": "OM-ORD-12345-1708786543210",
  "paymentMethod": "ORANGE_MONEY",
  "totalAmount": 10000,
  "orderStatus": "PROCESSING",
  "shouldRedirect": true,
  "redirectUrl": "https://printalma-website-dep.onrender.com/payment/orange-money?orderNumber=ORD-12345&status=success",
  "message": "Cette commande a déjà été payée avec succès"
}
```

**Réponse (Si en attente):**
```json
{
  "success": true,
  "orderNumber": "ORD-12345",
  "paymentStatus": "PENDING",
  "transactionId": "OM-ORD-12345-1708786543210",
  "paymentMethod": "ORANGE_MONEY",
  "totalAmount": 10000,
  "orderStatus": "PENDING"
}
```

---

### 5. **POST /orange-money/register-callback**

Enregistre votre URL de callback auprès d'Orange Money.

**⚠️ À exécuter UNE FOIS lors du déploiement en production.**

**Appelle l'API Orange Money:** `POST /api/notification/v1/merchantcallback`

**Réponse:**
```json
{
  "success": true,
  "message": "Callback URL registered successfully with Orange Money",
  "data": {
    "message": "Merchant callback created"
  }
}
```

---

### 6. **GET /orange-money/verify-callback**

Vérifie l'URL de callback enregistrée chez Orange Money.

**Appelle l'API Orange Money:** `GET /api/notification/v1/merchantcallback?code={merchantCode}`

**Réponse:**
```json
{
  "success": true,
  "data": {
    "code": "599241",
    "name": "Printalma B2C Payment Callback",
    "callbackUrl": "https://printalma-back-dep.onrender.com/orange-money/callback"
  },
  "merchantCode": "599241",
  "mode": "production"
}
```

---

### 7. **POST /orange-money/cancel-payment/:orderNumber**

Annule manuellement une commande en attente.

**Exemple:**
```
POST /orange-money/cancel-payment/ORD-12345
```

**Réponse:**
```json
{
  "success": true,
  "message": "Paiement annulé avec succès",
  "orderNumber": "ORD-12345"
}
```

---

### 8. **POST /orange-money/test-callback-success**

**Endpoint de TEST** - Simule un callback SUCCESS.

**Body:**
```json
{
  "orderNumber": "ORD-12345",
  "transactionId": "TXN-TEST-123456"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Callback SUCCESS simulé avec succès",
  "payload": {
    "status": "SUCCESS",
    "transactionId": "TXN-TEST-123456",
    "amount": {
      "unit": "XOF",
      "value": 10000
    },
    "code": "PRINTALMA001",
    "reference": "OM-ORD-12345-1708786543210",
    "metadata": {
      "orderId": "1",
      "orderNumber": "ORD-12345",
      "customerName": "Test Client"
    }
  }
}
```

---

### 9. **POST /orange-money/test-callback-failed**

**Endpoint de TEST** - Simule un callback FAILED.

**Body:**
```json
{
  "orderNumber": "ORD-12345"
}
```

---

## 🚫 Endpoints SUPPRIMÉS (N'existaient pas dans l'API Orange)

| Endpoint | Raison |
|----------|--------|
| ❌ `GET /orange-money/transactions` | L'API Orange Money ne propose pas de liste des transactions |
| ❌ `GET /orange-money/verify-transaction/:id` | L'API Orange Money ne propose pas de vérification du statut |
| ❌ `GET /orange-money/check-payment/:orderNumber` | Dépendait de verify-transaction qui n'existe pas |

---

## 📊 API Orange Money (Endpoints Réels)

### 1. **POST /oauth/token**

Authentification OAuth2.

**URL Sandbox:** `https://api.sandbox.orange-sonatel.com/oauth/token`
**URL Production:** `https://api.orange-sonatel.com/oauth/token`

**Body (form-urlencoded):**
```
grant_type=client_credentials
client_id={votre_client_id}
client_secret={votre_client_secret}
```

**Réponse:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

---

### 2. **POST /api/eWallet/v4/qrcode**

Génération QR Code + Deeplinks.

**URL Sandbox:** `https://api.sandbox.orange-sonatel.com/api/eWallet/v4/qrcode`
**URL Production:** `https://api.orange-sonatel.com/api/eWallet/v4/qrcode`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "code": "599241",
  "name": "Printalma B2C",
  "amount": {
    "unit": "XOF",
    "value": 10000
  },
  "reference": "OM-ORD-12345-1708786543210",
  "metadata": {
    "orderId": "123",
    "orderNumber": "ORD-12345",
    "customerName": "Jean Dupont"
  },
  "callbackSuccessUrl": "https://printalma-website-dep.onrender.com/payment/orange-money?orderNumber=ORD-12345&status=success",
  "callbackCancelUrl": "https://printalma-website-dep.onrender.com/payment/orange-money?orderNumber=ORD-12345&status=cancelled",
  "notificationUrl": "https://printalma-back-dep.onrender.com/orange-money/callback",
  "validity": 600
}
```

**Réponse:**
```json
{
  "deepLinks": {
    "MAXIT": "https://sugu.orange-sonatel.com/en/dgjun_KudhPKtfthdzua",
    "OM": "https://orangemoneysn.page.link/rrzuoARuU7tK5uN6"
  },
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "validity": 600
}
```

---

### 3. **POST /api/notification/v1/merchantcallback**

Configuration du callback URL.

**URL Sandbox:** `https://api.sandbox.orange-sonatel.com/api/notification/v1/merchantcallback`
**URL Production:** `https://api.orange-sonatel.com/api/notification/v1/merchantcallback`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "apiKey": "PRINTALMA_API_KEY",
  "code": "599241",
  "name": "Printalma B2C Payment Callback",
  "callbackUrl": "https://printalma-back-dep.onrender.com/orange-money/callback"
}
```

**Réponse (Code 201):**
```json
{
  "message": "Merchant callback created"
}
```

---

### 4. **GET /api/notification/v1/merchantcallback?code={code}**

Vérification du callback URL enregistré.

**URL Sandbox:** `https://api.sandbox.orange-sonatel.com/api/notification/v1/merchantcallback?code=599241`
**URL Production:** `https://api.orange-sonatel.com/api/notification/v1/merchantcallback?code=599241`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Réponse:**
```json
{
  "code": "599241",
  "name": "Printalma B2C Payment Callback",
  "callbackUrl": "https://printalma-back-dep.onrender.com/orange-money/callback"
}
```

---

## 🔄 Flux Complet de Paiement

```
1. Client demande à payer
   ↓
2. Backend appelle POST /orange-money/payment
   → Appelle POST /api/eWallet/v4/qrcode (Orange Money API)
   → Retourne {qrCode, deepLinks}
   ↓
3. Frontend affiche les boutons "Payer avec MAX IT" et "Payer avec OM"
   ↓
4. Client clique sur un deeplink → Ouvre l'app MAX IT ou Orange Money
   ↓
5. Client confirme le paiement dans l'app (code PIN)
   ↓
6. Orange Money exécute le paiement
   ↓
7. Orange Money envoie POST /orange-money/callback
   → {status: "SUCCESS", transactionId: "...", ...}
   ↓
8. Backend met à jour Order.paymentStatus = PAID
   → Retourne 200 OK immédiatement
   ↓
9. Frontend fait du polling: GET /orange-money/payment-status/:orderNumber
   → Lit le statut depuis la BDD
   ↓
10. Frontend détecte paymentStatus = PAID
   → Redirige le client vers la page de confirmation
```

---

## 🎯 Comment Vérifier si un Paiement est Effectué ?

**❌ CE QUI NE MARCHE PAS:**
```typescript
// L'API n'existe pas !
const status = await orangeMoneyAPI.getTransactionStatus(transactionId);
```

**✅ LA SEULE MÉTHODE QUI MARCHE:**

**1. Via le callback webhook (méthode principale)**
```
Orange Money → POST /orange-money/callback
→ Votre backend met à jour Order.paymentStatus = PAID
```

**2. Via polling sur VOTRE base de données**
```
Frontend → GET /orange-money/payment-status/:orderNumber
→ Lit Order.paymentStatus depuis votre BDD
```

---

## ✅ Résumé

| Fonctionnalité | Endpoint | Source |
|----------------|----------|--------|
| Générer paiement | POST /orange-money/payment | API Orange Money ✅ |
| Recevoir callback | POST /orange-money/callback | Appelé par Orange ✅ |
| Vérifier statut | GET /orange-money/payment-status/:orderNumber | Votre BDD ✅ |
| Configurer callback | POST /orange-money/register-callback | API Orange Money ✅ |
| Vérifier callback | GET /orange-money/verify-callback | API Orange Money ✅ |
| Lister transactions | ❌ N'EXISTE PAS | - |
| Vérifier transaction | ❌ N'EXISTE PAS | - |

---

## 📞 Support

**Email:** partenaires.orangemoney@orange-sonatel.com
**Documentation:** https://developer.orange-sonatel.com/documentation
**Portail:** https://developer.orange-sonatel.com/

---

**✅ CODE NETTOYÉ - Prêt pour la production**
