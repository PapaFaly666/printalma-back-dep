# 🔧 Configuration du compte Retailer Orange Money

## ❌ Erreur actuelle

```
Orange Money retailer credentials not configured for LIVE mode in database
```

## 🎯 Solution

Le système a besoin des **credentials de votre compte retailer** (le compte qui envoie l'argent) pour effectuer les Cash In.

### Configuration requise dans `PaymentConfig.metadata` :

```json
{
  "retailerMsisdn": "221781234567",      // Numéro du compte retailer
  "testRetailerPin": "1234",             // PIN pour SANDBOX
  "liveRetailerPin": "VOTRE_PIN_CRYPTÉ"  // PIN crypté pour PRODUCTION
}
```

---

## 🚀 Configuration rapide (3 options)

### Option 1 : Configuration via SQL (Recommandé)

```sql
-- 1. Vérifier la config actuelle
SELECT id, provider, "activeMode", metadata
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';

-- 2. Ajouter le MSISDN du retailer
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{retailerMsisdn}',
  '"221781234567"'  -- ⚠️ REMPLACER par votre vrai numéro retailer
)
WHERE provider = 'ORANGE_MONEY';

-- 3a. Ajouter le PIN pour SANDBOX (PIN en clair)
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{testRetailerPin}',
  '"1234"'  -- ⚠️ REMPLACER par votre PIN de test
)
WHERE provider = 'ORANGE_MONEY';

-- 3b. Ajouter le PIN pour PRODUCTION (PIN CRYPTÉ avec clé publique RSA)
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{liveRetailerPin}',
  '"Bs39XVxP0sVOTRE_PIN_CRYPTÉ_ICI=="'  -- ⚠️ PIN CRYPTÉ OBLIGATOIRE
)
WHERE provider = 'ORANGE_MONEY';

-- 4. Vérifier que tout est bien configuré
SELECT
  provider,
  "activeMode",
  metadata->>'retailerMsisdn' as retailer_msisdn,
  CASE
    WHEN metadata->>'testRetailerPin' IS NOT NULL THEN '✅ Configuré'
    ELSE '❌ Manquant'
  END as test_pin_status,
  CASE
    WHEN metadata->>'liveRetailerPin' IS NOT NULL THEN '✅ Configuré'
    ELSE '❌ Manquant'
  END as live_pin_status
FROM "PaymentConfig"
WHERE provider = 'ORANGE_MONEY';
```

### Option 2 : Utiliser les variables d'environnement (Fallback)

Si vous ne voulez pas utiliser la DB, ajoutez dans `.env` :

```bash
# Orange Money - Retailer credentials
ORANGE_RETAILER_MSISDN=221781234567
ORANGE_RETAILER_PIN=1234

# En production, cryptez le PIN avec la clé publique RSA !
```

> ⚠️ Le système utilisera d'abord la config DB, puis les variables d'environnement en fallback.

### Option 3 : Utiliser Prisma Studio (Interface graphique)

```bash
# 1. Lancer Prisma Studio
npx prisma studio

# 2. Ouvrir la table PaymentConfig

# 3. Trouver la ligne ORANGE_MONEY

# 4. Modifier le champ metadata (format JSON) :
{
  "retailerMsisdn": "221781234567",
  "testRetailerPin": "1234",
  "liveRetailerPin": "VOTRE_PIN_CRYPTÉ"
}

# 5. Sauvegarder
```

---

## 🔐 IMPORTANT : Cryptage du PIN en PRODUCTION

### ⚠️ Le PIN doit être crypté avec la clé publique RSA d'Orange Money !

### Étape 1 : Récupérer la clé publique

```bash
# Obtenez d'abord un token OAuth2
curl -X POST 'https://api.orange-sonatel.com/oauth/v1/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&grant_type=client_credentials'

# Ensuite récupérez la clé publique
curl -X GET 'https://api.orange-sonatel.com/api/account/v1/publicKeys' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

**Réponse :**
```json
{
  "key": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----",
  "keyId": "12345",
  "keySize": 2048,
  "keyType": "RSA"
}
```

### Étape 2 : Crypter le PIN avec Node.js

Créez un fichier `encrypt-pin.js` :

```javascript
const crypto = require('crypto');

// Récupérez cette clé depuis l'API Orange Money
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

// Votre PIN code (4 chiffres)
const pinCode = '1234';

// Cryptage RSA PKCS1
const buffer = Buffer.from(pinCode, 'utf8');
const encrypted = crypto.publicEncrypt(
  {
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING,
  },
  buffer
);

const encryptedPin = encrypted.toString('base64');

console.log('PIN crypté (à copier dans la DB) :');
console.log(encryptedPin);
```

**Exécuter :**
```bash
node encrypt-pin.js
# Copier le résultat dans PaymentConfig.metadata.liveRetailerPin
```

### Étape 3 : Mettre à jour la DB avec le PIN crypté

```sql
UPDATE "PaymentConfig"
SET metadata = jsonb_set(
  metadata,
  '{liveRetailerPin}',
  '"Bs39XVxP0sVOTRE_PIN_CRYPTÉ_BASE64_ICI=="'
)
WHERE provider = 'ORANGE_MONEY';
```

---

## 🧪 Tester la configuration

### 1. Vérifier la configuration actuelle

```bash
curl http://localhost:3004/orange-money/test-connection
```

### 2. Tester un Cash In en SANDBOX d'abord

```sql
-- Passer en mode TEST
UPDATE "PaymentConfig"
SET "activeMode" = 'test'
WHERE provider = 'ORANGE_MONEY';
```

```bash
# Tester le Cash In
curl -X POST 'http://localhost:3004/orange-money/cashin' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 1000,
    "customerPhone": "221771234567",
    "customerName": "Test User",
    "description": "Test Cash In"
  }'
```

### 3. Passer en LIVE une fois les tests OK

```sql
UPDATE "PaymentConfig"
SET "activeMode" = 'live'
WHERE provider = 'ORANGE_MONEY';
```

---

## 📋 Checklist avant production

- [ ] Compte Orange Money Retailer créé
- [ ] MSISDN du retailer récupéré
- [ ] PIN code du compte retailer récupéré
- [ ] Clé publique RSA d'Orange Money récupérée
- [ ] PIN crypté avec la clé publique
- [ ] `PaymentConfig.metadata.retailerMsisdn` configuré
- [ ] `PaymentConfig.metadata.liveRetailerPin` configuré (PIN CRYPTÉ)
- [ ] Tests réussis en SANDBOX
- [ ] Callback URL enregistré auprès d'Orange Money
- [ ] Mode passé à 'live'

---

## 🆘 Besoin d'aide ?

### Le PIN est-il crypté ou en clair ?

| Mode | PIN accepté |
|------|-------------|
| **SANDBOX** | PIN en clair (ex: "1234") |
| **PRODUCTION** | PIN crypté RSA obligatoire (ex: "Bs39XVxP0s...==") |

### Obtenir un compte retailer Orange Money

Contactez Orange Money Business :
- Email : partenaires.orangemoney@orange-sonatel.com
- Demandez un **compte retailer** (pas un compte client)

---

## 🚀 Script rapide de configuration

```bash
#!/bin/bash
# configure-orange-retailer.sh

echo "🔧 Configuration du compte Retailer Orange Money"
echo ""

read -p "Entrez le MSISDN du retailer (ex: 221781234567): " MSISDN
read -s -p "Entrez le PIN du retailer: " PIN
echo ""

# Pour SANDBOX - PIN en clair
psql $DATABASE_URL -c "
UPDATE \"PaymentConfig\"
SET metadata = jsonb_set(
  jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{retailerMsisdn}',
    '\"$MSISDN\"'
  ),
  '{testRetailerPin}',
  '\"$PIN\"'
)
WHERE provider = 'ORANGE_MONEY';
"

echo "✅ Configuration SANDBOX terminée"
echo "⚠️  Pour la PRODUCTION, cryptez le PIN avec la clé publique RSA !"
echo "📚 Voir : ORANGE_MONEY_CASH_IN_GUIDE.md"
```

---

**Prochaine étape :** Configurez vos credentials retailer avec l'une des options ci-dessus, puis réessayez votre requête Cash In ! 🚀
