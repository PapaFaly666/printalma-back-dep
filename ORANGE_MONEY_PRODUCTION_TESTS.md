# Guide de test PRODUCTION Orange Money

**Date**: 2026-02-24
**Objectif**: Tester l'intégralité du parcours Orange Money en environnement de production/sandbox avec de vraies requêtes API

---

## 📋 Prérequis

### 1. Variables d'environnement configurées

Vérifiez que votre fichier `.env` contient :

```env
# Orange Money Configuration
ORANGE_CLIENT_ID=<votre_client_id_fourni_par_orange>
ORANGE_CLIENT_SECRET=<votre_client_secret_fourni_par_orange>
ORANGE_MERCHANT_CODE=<votre_code_marchand_6_chiffres>
ORANGE_CALLBACK_API_KEY=<votre_api_key>
ORANGE_MODE=sandbox  # ou "production" pour la prod

# URLs
BACKEND_URL=https://printalma-back-dep.onrender.com
FRONTEND_URL=https://printalma-website-dep.onrender.com
```

### 2. Backend démarré

```bash
# Démarrer le backend
npm run start:dev

# Ou en production
npm run start:prod
```

### 3. Base de données accessible

- ✅ PostgreSQL/MySQL est démarré
- ✅ Prisma migrations sont appliquées
- ✅ Au moins une commande de test existe dans la BDD

---

## 🧪 PARCOURS COMPLET DE TEST

Nous allons tester le parcours suivant :

```
1. ✅ Vérification de la configuration
2. ✅ Test de connexion à l'API Orange Money
3. ✅ Enregistrement du callback URL
4. ✅ Vérification du callback URL enregistré
5. ✅ Création d'une commande de test
6. ✅ Génération d'un paiement Orange Money (QR Code)
7. ✅ Simulation du callback (paiement réussi)
8. ✅ Vérification du statut de paiement
9. ✅ Test des endpoints de transactions
10. ✅ Test de vérification de statut de transaction
```

---

## 🚀 ÉTAPE 1 : Vérification de la configuration

### Script de vérification

Créez un fichier `test-orange-config.sh` :

```bash
#!/bin/bash

echo "=========================================="
echo "🔍 VÉRIFICATION CONFIGURATION ORANGE MONEY"
echo "=========================================="
echo ""

BACKEND_URL="http://localhost:3000"  # Changez selon votre environnement

echo "📊 Test de connexion à l'API Orange Money..."
curl -s -X GET "$BACKEND_URL/orange-money/test-connection" | jq '.'

echo ""
echo "✅ Configuration vérifiée !"
```

### Exécution

```bash
chmod +x test-orange-config.sh
./test-orange-config.sh
```

### Résultat attendu

```json
{
  "success": true,
  "mode": "sandbox",
  "source": "database",
  "tokenObtained": true
}
```

**✅ Si success: true → Passez à l'étape suivante**
**❌ Si success: false → Vérifiez vos credentials dans .env**

---

## 🔧 ÉTAPE 2 : Enregistrement du callback URL

### Commande

```bash
curl -X POST "http://localhost:3000/orange-money/register-callback" | jq '.'
```

### Résultat attendu

```json
{
  "success": true,
  "message": "Callback URL registered successfully with Orange Money",
  "data": {}
}
```

**⚠️ IMPORTANT** : Cette étape est à faire **UNE SEULE FOIS** par environnement (sandbox ou production).

---

## 🔍 ÉTAPE 3 : Vérification du callback enregistré

### Commande

```bash
curl -X GET "http://localhost:3000/orange-money/verify-callback" | jq '.'
```

### Résultat attendu

```json
{
  "success": true,
  "data": [
    {
      "apiKey": "PRINTALMA_API_KEY",
      "callbackUrl": "https://printalma-back-dep.onrender.com/orange-money/callback",
      "code": "123456",
      "name": "Printalma B2C Payment Callback"
    }
  ],
  "merchantCode": "123456",
  "mode": "sandbox"
}
```

**✅ Vérifiez que callbackUrl correspond bien à votre BACKEND_URL**

---

## 📝 ÉTAPE 4 : Création d'une commande de test

### Option A : Via un script SQL direct

```sql
-- Insérez une commande de test dans votre BDD
INSERT INTO "Order" (
  "orderNumber",
  "totalAmount",
  "paymentStatus",
  "paymentMethod",
  "status",
  "createdAt",
  "updatedAt"
) VALUES (
  'ORD-TEST-2024-001',
  10000,
  'PENDING',
  NULL,
  'PENDING',
  NOW(),
  NOW()
);
```

### Option B : Via votre API de création de commande

```bash
curl -X POST "http://localhost:3000/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-2024-001",
    "totalAmount": 10000,
    "items": [
      {
        "name": "Produit de test",
        "quantity": 1,
        "price": 10000
      }
    ],
    "customerName": "Client Test",
    "customerPhone": "221771234567",
    "customerEmail": "test@example.com"
  }' | jq '.'
```

### Vérification

```bash
# Vérifiez que la commande existe
curl -X GET "http://localhost:3000/orders/ORD-TEST-2024-001" | jq '.'
```

**Notez l'ID de la commande** (vous en aurez besoin à l'étape suivante)

---

## 💳 ÉTAPE 5 : Génération d'un paiement Orange Money (QR Code)

### Commande

```bash
curl -X POST "http://localhost:3000/orange-money/payment" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "amount": 10000,
    "customerName": "Client Test",
    "customerPhone": "221771234567",
    "orderNumber": "ORD-TEST-2024-001"
  }' | jq '.' > payment-response.json
```

### Résultat attendu

```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "deepLinks": {
      "MAXIT": "maxit://payment?ref=...",
      "OM": "om://payment?ref=..."
    },
    "validity": 600,
    "reference": "OM-ORD-TEST-2024-001-1709024567890"
  }
}
```

**✅ Points à vérifier** :
- ✅ `success: true`
- ✅ `qrCode` présent (image base64)
- ✅ `deepLinks` présents
- ✅ `reference` généré

**📸 QR Code** : Vous pouvez copier le base64 du qrCode et le visualiser dans un navigateur :
1. Créez un fichier HTML : `qr-code-viewer.html`
2. Collez ce code :
```html
<!DOCTYPE html>
<html>
<head><title>QR Code Orange Money</title></head>
<body>
  <h1>QR Code Orange Money</h1>
  <img src="COLLEZ_ICI_LE_BASE64_DU_QRCODE" alt="QR Code">
</body>
</html>
```

**📱 Test réel** : Si vous avez l'application Orange Money installée sur votre téléphone :
1. Ouvrez l'application
2. Scannez le QR Code généré
3. Validez le paiement

⚠️ **IMPORTANT** : En mode sandbox, vous aurez besoin de numéros de test fournis par Orange Money.

---

## 🔔 ÉTAPE 6 : Simulation du callback (paiement réussi)

Si vous ne pouvez pas scanner le QR Code (pas d'app Orange Money, pas de numéros de test), vous pouvez simuler le callback :

### Commande

```bash
curl -X POST "http://localhost:3000/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-2024-001",
    "transactionId": "MP20240224.1234.TEST001"
  }' | jq '.'
```

### Résultat attendu

```json
{
  "success": true,
  "message": "Callback SUCCESS (format complet) simulé avec succès",
  "payload": {
    "amount": { "unit": "XOF", "value": 10000 },
    "partner": { "idType": "CODE", "id": "123456" },
    "customer": { "idType": "MSISDN", "id": "221771234567" },
    "reference": "uuid-...",
    "type": "MERCHANT_PAYMENT",
    "channel": "API",
    "transactionId": "MP20240224.1234.TEST001",
    "paymentMethod": "QRCODE",
    "status": "SUCCESS",
    "metadata": {
      "orderId": "1",
      "orderNumber": "ORD-TEST-2024-001",
      "customerName": "Test Client"
    }
  }
}
```

### Vérification dans les logs du backend

Vous devriez voir dans les logs :

```
========== TRAITEMENT CALLBACK ORANGE MONEY ==========
📦 Payload reçu: { ... }
🔍 Format du callback: COMPLET (avec metadata)
🔍 Données extraites du callback:
   - Status: SUCCESS
   - TransactionId: MP20240224.1234.TEST001
   - Reference: uuid-...
   - Type: MERCHANT_PAYMENT
   - Amount: 10000 XOF
🔎 Recherche de la commande via metadata.orderNumber: ORD-TEST-2024-001
✅ Commande trouvée:
   - ID: 1
   - Numéro: ORD-TEST-2024-001
   - Statut paiement actuel: PENDING
   - Transaction ID actuel: OM-ORD-TEST-2024-001-1709024567890
   - Méthode de paiement: ORANGE_MONEY
   - Montant total: 10000 FCFA
💰 PAIEMENT RÉUSSI - Mise à jour de la commande en PAYÉE...
✅✅✅ SUCCÈS: Commande ORD-TEST-2024-001 marquée comme PAYÉE
   - Nouveau statut: PAID
   - Transaction ID enregistrée: MP20240224.1234.TEST001
   - Montant payé: 10000 XOF
   - Code marchand: 123456
   - Client: 221771234567
   - Timestamp: 2024-02-24T10:30:45.123Z
========== FIN TRAITEMENT CALLBACK ==========
```

---

## ✅ ÉTAPE 7 : Vérification du statut de paiement

### Commande

```bash
curl -X GET "http://localhost:3000/orange-money/payment-status/ORD-TEST-2024-001" | jq '.'
```

### Résultat attendu

```json
{
  "success": true,
  "orderNumber": "ORD-TEST-2024-001",
  "paymentStatus": "PAID",
  "transactionId": "MP20240224.1234.TEST001",
  "paymentMethod": "ORANGE_MONEY",
  "totalAmount": 10000,
  "orderStatus": "PENDING",
  "shouldRedirect": true,
  "redirectUrl": "https://printalma-website-dep.onrender.com/payment/orange-money?orderNumber=ORD-TEST-2024-001&status=success",
  "message": "Cette commande a déjà été payée avec succès"
}
```

**✅ Points critiques à vérifier** :
- ✅ `paymentStatus: "PAID"`
- ✅ `transactionId` correspond au callback
- ✅ `paymentMethod: "ORANGE_MONEY"`
- ✅ `shouldRedirect: true`

---

## 📊 ÉTAPE 8 : Test des endpoints de transactions

### Test 1 : Récupérer toutes les transactions

```bash
curl -X GET "http://localhost:3000/orange-money/transactions" | jq '.'
```

### Test 2 : Filtrage par status

```bash
curl -X GET "http://localhost:3000/orange-money/transactions?status=SUCCESS" | jq '.'
```

### Test 3 : Filtrage par type

```bash
curl -X GET "http://localhost:3000/orange-money/transactions?type=MERCHANT_PAYMENT" | jq '.'
```

### Test 4 : Filtrage par date

```bash
# Transactions des 7 derniers jours
FROM_DATE=$(date -u -d '7 days ago' +"%Y-%m-%dT%H:%M:%SZ")
TO_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X GET "http://localhost:3000/orange-money/transactions?fromDateTime=$FROM_DATE&toDateTime=$TO_DATE" | jq '.'
```

### Test 5 : Pagination

```bash
# Page 0, 10 résultats
curl -X GET "http://localhost:3000/orange-money/transactions?page=0&size=10" | jq '.'

# Page 1, 10 résultats
curl -X GET "http://localhost:3000/orange-money/transactions?page=1&size=10" | jq '.'
```

### Résultat attendu

```json
{
  "success": true,
  "data": [
    {
      "amount": { "unit": "XOF", "value": 10000 },
      "channel": "API",
      "createdAt": "2024-02-24T10:30:45Z",
      "customer": {
        "id": "221771234567",
        "idType": "MSISDN",
        "walletType": "PRINCIPAL"
      },
      "metadata": {
        "orderNumber": "ORD-TEST-2024-001"
      },
      "partner": {
        "id": "123456",
        "idType": "CODE"
      },
      "reference": "uuid-...",
      "status": "SUCCESS",
      "transactionId": "MP20240224.1234.TEST001",
      "type": "MERCHANT_PAYMENT",
      "updatedAt": "2024-02-24T10:30:46Z"
    }
  ],
  "page": 0,
  "size": 20,
  "total": 1
}
```

---

## 🔍 ÉTAPE 9 : Vérification d'une transaction spécifique

### Commande

```bash
# Utilisez le transactionId obtenu précédemment
curl -X GET "http://localhost:3000/orange-money/verify-transaction/MP20240224.1234.TEST001" | jq '.'
```

### Résultat attendu

```json
{
  "success": true,
  "transactionId": "MP20240224.1234.TEST001",
  "status": "SUCCESS",
  "data": {
    "status": "SUCCESS"
  }
}
```

---

## 🧪 ÉTAPE 10 : Test de réconciliation

Ce test vérifie que si le callback a échoué, on peut réconcilier manuellement en interrogeant Orange Money.

### Commande

```bash
curl -X GET "http://localhost:3000/orange-money/check-payment/ORD-TEST-2024-001" | jq '.'
```

### Résultat attendu (si déjà payé)

```json
{
  "success": true,
  "orderNumber": "ORD-TEST-2024-001",
  "paymentStatus": "PAID",
  "transactionId": "MP20240224.1234.TEST001",
  "orangeMoneyStatus": "SUCCESS",
  "reconciled": false,
  "message": "Status synchronized"
}
```

### Résultat attendu (si besoin de réconciliation)

```json
{
  "success": true,
  "orderNumber": "ORD-TEST-2024-001",
  "paymentStatus": "PAID",
  "transactionId": "MP20240224.1234.TEST001",
  "orangeMoneyStatus": "SUCCESS",
  "reconciled": true,
  "message": "Payment status reconciled: Orange Money reported SUCCESS"
}
```

---

## 🔄 ÉTAPE 11 : Test du parcours complet avec un paiement échoué

### 1. Créer une nouvelle commande

```bash
curl -X POST "http://localhost:3000/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-2024-002",
    "totalAmount": 5000,
    "customerName": "Client Test Échec",
    "customerPhone": "221771234567",
    "customerEmail": "test-fail@example.com"
  }' | jq '.'
```

### 2. Générer le paiement

```bash
curl -X POST "http://localhost:3000/orange-money/payment" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 2,
    "amount": 5000,
    "customerName": "Client Test Échec",
    "customerPhone": "221771234567",
    "orderNumber": "ORD-TEST-2024-002"
  }' | jq '.'
```

### 3. Simuler un callback FAILED

```bash
curl -X POST "http://localhost:3000/orange-money/test-callback-failed" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-2024-002"
  }' | jq '.'
```

### 4. Vérifier le statut

```bash
curl -X GET "http://localhost:3000/orange-money/payment-status/ORD-TEST-2024-002" | jq '.'
```

### Résultat attendu

```json
{
  "success": true,
  "orderNumber": "ORD-TEST-2024-002",
  "paymentStatus": "FAILED",
  "transactionId": "MP...",
  "paymentMethod": "ORANGE_MONEY",
  "totalAmount": 5000,
  "orderStatus": "PENDING",
  "shouldRedirect": true,
  "redirectUrl": "https://printalma-website-dep.onrender.com/payment/orange-money?orderNumber=ORD-TEST-2024-002&status=failed",
  "message": "Le paiement de cette commande a échoué"
}
```

---

## 🔒 ÉTAPE 12 : Test d'idempotence

Vérifiez que le double traitement d'un callback est bien évité.

### 1. Simuler un premier callback SUCCESS

```bash
curl -X POST "http://localhost:3000/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-2024-001",
    "transactionId": "MP20240224.1234.DUPLICATE"
  }' | jq '.'
```

### 2. Simuler un second callback identique

```bash
curl -X POST "http://localhost:3000/orange-money/test-callback-success" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "ORD-TEST-2024-001",
    "transactionId": "MP20240224.1234.DUPLICATE2"
  }' | jq '.'
```

### Vérification dans les logs

Vous devriez voir :

```
⚠️ IDEMPOTENCE: Callback déjà traité pour cette commande
   Commande ORD-TEST-2024-001 est déjà marquée comme PAYÉE
   Transaction ID existante: MP20240224.1234.TEST001
   Callback actuel - TransactionId: MP20240224.1234.DUPLICATE2
   → Ignorer ce callback pour éviter le double traitement
```

**✅ Le second callback est bien ignoré (idempotence)**

---

## 📊 RÉSULTATS ATTENDUS - CHECKLIST

À la fin de tous les tests, vous devez avoir :

### Configuration
- [x] Test de connexion : `success: true`
- [x] Callback URL enregistré chez Orange Money
- [x] Callback URL vérifié et correct

### Parcours de paiement réussi
- [x] Commande créée : `ORD-TEST-2024-001`
- [x] QR Code généré avec succès
- [x] Callback SUCCESS traité
- [x] Statut de paiement : `PAID`
- [x] TransactionId Orange Money enregistré

### Parcours de paiement échoué
- [x] Commande créée : `ORD-TEST-2024-002`
- [x] QR Code généré avec succès
- [x] Callback FAILED traité
- [x] Statut de paiement : `FAILED`

### Endpoints de transactions
- [x] GET /transactions fonctionne
- [x] Filtrage par status fonctionne
- [x] Filtrage par type fonctionne
- [x] Filtrage par date fonctionne
- [x] Pagination fonctionne
- [x] GET /verify-transaction/:id fonctionne

### Robustesse
- [x] Idempotence fonctionne (double callback ignoré)
- [x] Réconciliation fonctionne
- [x] Logs détaillés affichés

---

## 🐛 TROUBLESHOOTING

### Erreur : "Invalid credentials"

```json
{
  "success": false,
  "error": "Orange Money authentication failed: Invalid credentials"
}
```

**Solution** :
1. Vérifiez `ORANGE_CLIENT_ID` et `ORANGE_CLIENT_SECRET` dans `.env`
2. Vérifiez que vous utilisez les bonnes credentials (sandbox vs production)
3. Contactez Orange Money pour vérifier vos credentials

---

### Erreur : "Merchant code not configured"

```json
{
  "success": false,
  "error": "Orange Money merchant code not configured for SANDBOX mode"
}
```

**Solution** :
1. Vérifiez `ORANGE_MERCHANT_CODE` dans `.env`
2. Le code doit être exactement 6 chiffres
3. Vérifiez que le code correspond au mode (sandbox/production)

---

### Erreur : "Order not found" dans le callback

```
❌ ERREUR: Commande ORD-TEST-2024-001 introuvable dans la base de données
```

**Solution** :
1. Vérifiez que la commande existe dans la BDD
2. Vérifiez que l'orderNumber est exact (respect de la casse)
3. Vérifiez que la table s'appelle bien `Order` (avec majuscule)

---

### Le callback ne met pas à jour la commande

**Solution** :
1. Vérifiez les logs du backend (recherchez "TRAITEMENT CALLBACK")
2. Vérifiez que le statut est bien "SUCCESS" (et pas "ACCEPTED" ou autre)
3. Vérifiez l'idempotence : la commande n'est peut-être déjà payée

---

## 📝 SCRIPT DE TEST COMPLET

Fichier : `test-orange-money-complete.sh` (créé à l'étape suivante)

---

**Félicitations !** 🎉

Si tous les tests passent, votre implémentation Orange Money est **100% fonctionnelle** et **production-ready** !
