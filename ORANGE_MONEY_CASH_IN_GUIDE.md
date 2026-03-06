# 💰 Guide d'implémentation Cash In Orange Money

## 📋 Table des matières
1. [Vue d'ensemble](#vue-densemble)
2. [Configuration requise](#configuration-requise)
3. [Flow complet](#flow-complet)
4. [Configuration de la base de données](#configuration-de-la-base-de-données)
5. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
6. [Utilisation du système](#utilisation-du-système)
7. [Webhooks et callbacks](#webhooks-et-callbacks)
8. [Tests](#tests)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Vue d'ensemble

Le **Cash In Orange Money** permet d'envoyer de l'argent depuis le wallet de la plateforme (compte retailer) vers le wallet Orange Money d'un vendeur ou client.

### Cas d'usage principaux :
- ✅ **Paiement des vendeurs** lors de l'approbation d'appels de fonds
- ✅ **Remboursements clients**
- ✅ **Cashback et promotions**

### Architecture du système :

```
┌─────────────────────────────────────────────────────────────┐
│                   FLOW APPEL DE FONDS                        │
└─────────────────────────────────────────────────────────────┘

1. Vendeur crée un appel de fonds
   ├─ POST /vendor/funds-requests
   ├─ Montant: 50 000 FCFA
   ├─ Méthode: ORANGE_MONEY
   └─ Numéro: 221771234567

2. Admin approuve la demande
   ├─ PATCH /admin/funds-requests/:id
   ├─ Status: APPROVED ou PAID
   └─ 🔥 Déclenche automatiquement le Cash In !

3. Système exécute le Cash In
   ├─ POST /api/eWallet/v1/cashins (API Orange Money)
   ├─ Envoie 50 000 FCFA vers 221771234567
   └─ Reçoit transactionId: CI1234.5678.91023

4. Orange Money envoie un callback
   ├─ POST /orange-money/cashin-callback
   ├─ Status: SUCCESS / FAILED / PENDING
   └─ Met à jour VendorFundsRequest.status → PAID

5. Vendeur reçoit son argent
   └─ Notification SMS Orange Money
```

---

## ⚙️ Configuration requise

### 1. Compte Orange Money Retailer

Vous devez avoir un **compte Orange Money Retailer** (compte marchand) avec :
- ✅ Un **MSISDN** (numéro de téléphone au format international)
- ✅ Un **code PIN** (à crypter avec la clé publique Orange)
- ✅ Un solde suffisant pour effectuer les paiements

### 2. Accès API Orange Money

- ✅ Client ID (testPublicKey / livePublicKey)
- ✅ Client Secret (testPrivateKey / livePrivateKey)
- ✅ Merchant Code (testToken / liveToken) - 6 chiffres

### 3. Endpoints Orange Money

| Environnement | OAuth Token | Cash In |
|---------------|-------------|---------|
| **Sandbox** | `https://api.sandbox.orange-sonatel.com/oauth/v1/token` | `https://api.sandbox.orange-sonatel.com/api/eWallet/v1/cashins` |
| **Production** | `https://api.orange-sonatel.com/oauth/v1/token` | `https://api.orange-sonatel.com/api/eWallet/v1/cashins` |

---

## 🗄️ Configuration de la base de données

### Mettre à jour la table `PaymentConfig`

```sql
-- 1. Créer/Mettre à jour la config Orange Money
UPDATE "PaymentConfig"
SET
  "metadata" = jsonb_set(
    COALESCE("metadata", '{}'::jsonb),
    '{retailerMsisdn}',
    '"221781234567"'
  ),
  "metadata" = jsonb_set(
    "metadata",
    '{testRetailerPin}',
    '"1234"'  -- PIN en clair pour SANDBOX uniquement
  ),
  "metadata" = jsonb_set(
    "metadata",
    '{liveRetailerPin}',
    '"VOTRE_PIN_CRYPTÉ"'  -- PIN crypté avec clé publique en PRODUCTION
  )
WHERE "provider" = 'ORANGE_MONEY';
```

### Structure de `metadata` :

```json
{
  "retailerMsisdn": "221781234567",
  "testRetailerPin": "1234",
  "liveRetailerPin": "VOTRE_PIN_CRYPTÉ"
}
```

> ⚠️ **IMPORTANT** : En production, le PIN doit être crypté avec la clé publique RSA d'Orange Money !

---

## 🔐 Configuration des variables d'environnement

### Fallback (si pas de config DB)

Ajouter dans votre `.env` :

```bash
# Orange Money - Retailer (pour Cash In)
ORANGE_RETAILER_MSISDN=221781234567
ORANGE_RETAILER_PIN=1234

# Orange Money - API Credentials
ORANGE_CLIENT_ID=your_client_id
ORANGE_CLIENT_SECRET=your_client_secret
ORANGE_MERCHANT_CODE=123456

# Mode (sandbox ou production)
ORANGE_MODE=sandbox

# Callback URL
BACKEND_URL=https://printalma-back-dep.onrender.com
```

---

## 🚀 Utilisation du système

### 1️⃣ Paiement automatique lors de l'approbation d'un appel de fonds

**Workflow standard :**

```bash
# Le vendeur crée un appel de fonds
POST /vendor/funds-requests
{
  "amount": 50000,
  "description": "Paiement ventes du mois",
  "paymentMethod": "ORANGE_MONEY",
  "phoneNumber": "221771234567"
}

# L'admin approuve la demande
PATCH /admin/funds-requests/:id
{
  "status": "APPROVED",
  "adminNote": "Demande validée"
}

# 🔥 Le système déclenche automatiquement le Cash In !
# Aucune action manuelle requise
```

### 2️⃣ Paiement manuel via l'API

```bash
POST /orange-money/cashin
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json

{
  "amount": 50000,
  "customerPhone": "221771234567",
  "customerName": "Mamadou Diallo",
  "description": "Paiement vendeur",
  "reference": "FUNDS-REQ-12345",
  "fundsRequestId": 123,
  "receiveNotification": true
}
```

**Réponse :**

```json
{
  "transactionId": "CI1234.5678.91023",
  "status": "SUCCESS",
  "description": "Transaction successful",
  "reference": "FUNDS-REQ-12345",
  "requestId": "1234.5678.91023"
}
```

### 3️⃣ Vérifier le statut d'une transaction

```bash
GET /orange-money/verify-transaction/CI1234.5678.91023
```

---

## 🔔 Webhooks et callbacks

### Configuration du webhook

**1. Enregistrer l'URL de callback (UNE FOIS en production) :**

```bash
POST /orange-money/register-callback
```

Cela enregistre automatiquement :
```
https://printalma-back-dep.onrender.com/orange-money/cashin-callback
```

**2. Vérifier le callback enregistré :**

```bash
GET /orange-money/verify-callback
```

### Traitement du callback

Orange Money envoie un callback avec cette structure :

```json
{
  "transactionId": "CI1234.5678.91023",
  "status": "SUCCESS",
  "amount": {
    "value": 50000,
    "unit": "XOF"
  },
  "customer": {
    "id": "221771234567",
    "idType": "MSISDN"
  },
  "partner": {
    "id": "221781234567",
    "idType": "MSISDN"
  },
  "reference": "CASHIN-1234567890",
  "metadata": {
    "fundsRequestId": "123",
    "customerName": "Mamadou Diallo",
    "description": "Paiement vendeur"
  },
  "type": "CASHIN",
  "channel": "API"
}
```

**Le système met automatiquement à jour :**
- `VendorFundsRequest.status` → `PAID`
- `VendorFundsRequest.transactionId` → Transaction ID Orange
- `VendorFundsRequest.processedAt` → Date de traitement

---

## 🧪 Tests

### Test en sandbox

**1. Simuler un callback Cash In :**

```bash
POST /orange-money/test-cashin-callback
{
  "fundsRequestId": 123,
  "status": "SUCCESS"
}
```

**2. Tester la connexion API :**

```bash
GET /orange-money/test-connection
```

**3. Flow complet de test :**

```bash
# 1. Créer un appel de fonds
POST /vendor/funds-requests
{
  "amount": 1000,
  "description": "Test Cash In",
  "paymentMethod": "ORANGE_MONEY",
  "phoneNumber": "221771234567"
}

# 2. Approuver la demande (déclenche le Cash In automatiquement)
PATCH /admin/funds-requests/123
{
  "status": "APPROVED",
  "adminNote": "Test"
}

# 3. Vérifier le statut
GET /vendor/funds-requests/123

# 4. Simuler le callback
POST /orange-money/test-cashin-callback
{
  "fundsRequestId": 123,
  "status": "SUCCESS"
}
```

---

## 🛠️ Troubleshooting

### Erreur : "Orange Money retailer credentials not configured"

**Solution :**
- Vérifier que `PaymentConfig.metadata.retailerMsisdn` existe
- Vérifier que `PaymentConfig.metadata.testRetailerPin` ou `liveRetailerPin` existe
- OU configurer `ORANGE_RETAILER_MSISDN` et `ORANGE_RETAILER_PIN` dans `.env`

### Erreur : "Invalid PIN code, account is blocked"

**Solution :**
- Le PIN est incorrect
- Le compte retailer est bloqué (trop de tentatives)
- Contacter Orange Money pour débloquer le compte

### Erreur : "Balance insufficient"

**Solution :**
- Le compte retailer n'a pas assez de solde
- Recharger le compte Orange Money Retailer

### Le callback n'est jamais reçu

**Solutions :**
1. Vérifier que le callback URL est bien enregistré :
   ```bash
   GET /orange-money/verify-callback
   ```

2. Réenregistrer le callback :
   ```bash
   POST /orange-money/register-callback
   ```

3. Vérifier les logs du serveur pour voir si Orange Money appelle bien le webhook

4. S'assurer que l'URL est accessible publiquement (HTTPS obligatoire en production)

### Le Cash In reste en statut PENDING

**Solution :**
- C'est normal, Orange Money peut mettre jusqu'à 24h pour confirmer
- Le callback mettra à jour le statut automatiquement
- Vous pouvez vérifier manuellement :
  ```bash
  GET /orange-money/verify-transaction/CI1234.5678.91023
  ```

---

## 📊 Codes d'erreur Orange Money

| Code | Description | Action |
|------|-------------|--------|
| `2000` | Le compte client n'existe pas | Vérifier le MSISDN |
| `2001` | MSISDN invalide | Corriger le format (221XXXXXXXXX) |
| `2011` | PIN invalide, 2 tentatives restantes | Vérifier le PIN |
| `2013` | Compte bloqué (PIN incorrect) | Contacter Orange Money |
| `2020` | Solde insuffisant | Recharger le compte retailer |
| `2041` | Transaction non autorisée | Vérifier les permissions du compte |
| `4003` | Clé publique révoquée | Récupérer une nouvelle clé publique |

---

## 🔒 Sécurité - Cryptage du PIN en production

En production, le PIN doit être crypté avec la clé publique RSA d'Orange Money.

### 1. Récupérer la clé publique

```bash
GET /api/account/v1/publicKeys
Authorization: Bearer <ACCESS_TOKEN>
```

**Réponse :**
```json
{
  "key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----",
  "keyId": "12345",
  "keySize": 2048,
  "keyType": "RSA"
}
```

### 2. Crypter le PIN avec la clé publique (Node.js)

```javascript
import crypto from 'crypto';

function encryptPinCode(pinCode: string, publicKey: string): string {
  const buffer = Buffer.from(pinCode, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );
  return encrypted.toString('base64');
}

const publicKey = '-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----';
const pinCode = '1234';
const encryptedPin = encryptPinCode(pinCode, publicKey);
console.log(encryptedPin);
// → "Bs39XVxP0s[..]A=="
```

### 3. Mettre à jour la config

```sql
UPDATE "PaymentConfig"
SET "metadata" = jsonb_set(
  "metadata",
  '{liveRetailerPin}',
  '"Bs39XVxP0s[..]A=="'
)
WHERE "provider" = 'ORANGE_MONEY';
```

---

## 🎉 Résumé

Vous avez maintenant un système complet de **Cash In Orange Money** qui :

✅ Paie automatiquement les vendeurs lors de l'approbation d'appels de fonds
✅ Gère les callbacks asynchrones d'Orange Money
✅ Met à jour automatiquement le statut des demandes
✅ Envoie des notifications SMS aux bénéficiaires
✅ Supporte les modes sandbox et production

**Prochaines étapes :**

1. Configurer vos credentials Orange Money dans `PaymentConfig`
2. Tester en sandbox avec l'endpoint de test
3. Enregistrer votre callback URL en production
4. Crypter le PIN avec la clé publique RSA
5. Déployer en production ! 🚀

---

**Questions ?** Consultez la documentation officielle : https://developer.orange-sonatel.com/documentation
