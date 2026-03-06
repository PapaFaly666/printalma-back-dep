# ⚡ Quick Start - Cash In Orange Money

## 🚀 Étapes rapides pour tester le Cash In

### 1️⃣ Configurer vos credentials (2 minutes)

#### Option A : Via SQL (Recommandé)

```bash
# Se connecter à votre DB PostgreSQL
psql $DATABASE_URL

# Ou avec les credentials
psql -h localhost -U votre_user -d votre_database
```

**Exécuter ces commandes SQL :**

```sql
-- Configurer le MSISDN du retailer
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{retailerMsisdn}',
  '"221781234567"'  -- ⚠️ VOTRE NUMÉRO ICI
)
WHERE provider = 'ORANGE_MONEY';

-- Configurer le PIN (même pour test et live si vous testez)
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  jsonb_set(
    metadata,
    '{testRetailerPin}',
    '"1234"'  -- ⚠️ VOTRE PIN ICI
  ),
  '{liveRetailerPin}',
  '"1234"'  -- ⚠️ VOTRE PIN ICI (crypté en production !)
)
WHERE provider = 'ORANGE_MONEY';

-- Vérifier
SELECT
  "activeMode",
  metadata->>'retailerMsisdn' as msisdn,
  metadata->>'liveRetailerPin' as pin_configured
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';
```

#### Option B : Via variables d'environnement

Ajouter dans `.env` :

```bash
ORANGE_RETAILER_MSISDN=221781234567  # ⚠️ VOTRE NUMÉRO
ORANGE_RETAILER_PIN=1234             # ⚠️ VOTRE PIN
```

Redémarrer le serveur :
```bash
npm run start:dev
```

---

### 2️⃣ Vérifier la connexion (30 secondes)

```bash
curl http://localhost:3004/orange-money/test-connection | jq
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Orange Money API is reachable",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "mode": "live"
}
```

---

### 3️⃣ Tester le Cash In (1 minute)

```bash
curl -X POST 'http://localhost:3004/orange-money/cashin' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 100,
    "customerPhone": "221771234567",
    "customerName": "Test Vendeur",
    "description": "Test Cash In",
    "receiveNotification": true
  }' | jq
```

**Réponse attendue (SUCCESS) :**
```json
{
  "transactionId": "CI240225.1234.A12345",
  "status": "SUCCESS",
  "description": "Transaction successful",
  "reference": "CASHIN-1709123456789",
  "requestId": "1234.5678.91023"
}
```

**Réponse possible (PENDING) :**
```json
{
  "transactionId": "CI240225.1234.A12345",
  "status": "PENDING",
  "description": "Transaction en cours de traitement",
  "reference": "CASHIN-1709123456789"
}
```

> ⏳ Si PENDING, Orange Money enverra un callback quand la transaction sera confirmée (peut prendre jusqu'à 24h mais généralement < 5 min)

---

### 4️⃣ Vérifier le statut d'une transaction

```bash
curl http://localhost:3004/orange-money/verify-transaction/CI240225.1234.A12345 | jq
```

---

## 🔥 Test complet avec appel de fonds

### 1. Créer un appel de fonds (Vendeur)

```bash
curl -X POST 'http://localhost:3004/vendor/funds-requests' \
  -H 'Authorization: Bearer VOTRE_VENDOR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 5000,
    "description": "Test paiement vendeur",
    "paymentMethod": "ORANGE_MONEY",
    "phoneNumber": "221771234567"
  }' | jq
```

**Notez le `id` retourné** (ex: 123)

### 2. Approuver la demande (Admin) - Déclenche le Cash In automatiquement !

```bash
curl -X PATCH 'http://localhost:3004/admin/funds-requests/123' \
  -H 'Authorization: Bearer VOTRE_ADMIN_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": "APPROVED",
    "adminNote": "Test automatique"
  }' | jq
```

**Résultat :**
- ✅ Le Cash In est déclenché automatiquement
- ✅ Le `transactionId` est enregistré dans la demande
- ✅ Le statut passe à `PAID` si SUCCESS immédiat

### 3. Vérifier le statut de la demande

```bash
curl 'http://localhost:3004/vendor/funds-requests/123' \
  -H 'Authorization: Bearer VOTRE_VENDOR_TOKEN' | jq
```

---

## ❌ Dépannage rapide

### Erreur : "retailer credentials not configured"

```bash
# Vérifier la config
psql $DATABASE_URL -c "SELECT metadata FROM \"PaymentConfig\" WHERE provider = 'ORANGE_MONEY';"

# Si vide ou incorrect, relancer le SQL de l'étape 1
```

### Erreur : "Invalid PIN code"

- Vérifiez que le PIN est correct (4 chiffres)
- Vérifiez le numéro MSISDN (format 221XXXXXXXXX)
- En production, le PIN doit être crypté avec la clé publique RSA

### Erreur : "Balance insufficient"

- Le compte retailer n'a pas assez de solde
- Rechargez votre compte Orange Money Retailer

### Erreur : "Customer account does not exist"

- Le numéro `customerPhone` n'existe pas ou est invalide
- Vérifiez le format : 221XXXXXXXXX

---

## 📊 Logs du serveur

Pour suivre l'exécution en temps réel :

```bash
# Dans un terminal séparé
tail -f logs/app.log
# Ou si vous utilisez npm run start:dev
# Les logs s'affichent directement
```

**Logs attendus pour un Cash In :**

```
🍊 Génération paiement Orange Money pour commande...
💰 Exécution Cash In Orange Money vers 221771234567 - Montant: 5000 FCFA
📦 Mode: LIVE
📦 Cash In URL: https://api.orange-sonatel.com/api/eWallet/v1/cashins
📦 Retailer MSISDN: 221781234567
✅ Cash In Orange Money réussi - Transaction ID: CI240225.1234.A12345
📊 Statut: SUCCESS
```

---

## 🎯 Checklist avant production

- [ ] Credentials retailer configurés dans DB
- [ ] Test de connexion réussi
- [ ] Cash In test (petit montant) réussi
- [ ] Callback URL enregistré : `POST /orange-money/register-callback`
- [ ] PIN crypté avec clé publique RSA (PRODUCTION uniquement)
- [ ] Mode `activeMode` = 'live'
- [ ] Solde suffisant sur compte retailer

---

## 🚀 Vous êtes prêt !

Une fois les étapes 1-3 validées, votre système est opérationnel.

**Le Cash In sera automatiquement déclenché** à chaque approbation d'appel de fonds avec `paymentMethod: ORANGE_MONEY` ! 🎉

---

**Documentation complète :** `ORANGE_MONEY_CASH_IN_GUIDE.md`
**Configuration détaillée :** `CONFIGURATION_ORANGE_RETAILER.md`
**Script SQL :** `setup-orange-retailer.sql`
