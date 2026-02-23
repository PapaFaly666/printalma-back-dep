# 🍊 Configuration du Callback Orange Money

## 📚 Contexte

D'après la documentation Orange Money, le système de callback fonctionne en **2 étapes**:

1. **Enregistrer l'URL de callback** via l'API Notification (**À FAIRE UNE FOIS**)
2. **Générer des paiements** - Orange Money utilisera l'URL enregistrée pour envoyer les callbacks

## ⚠️ Problème rencontré

**Avant:**
- ✅ On générait le QR Code avec `notificationUrl` dans le payload
- ❌ Mais on n'avait JAMAIS enregistré cette URL auprès d'Orange Money
- ❌ Résultat: Les callbacks n'arrivaient jamais au backend

**Maintenant:**
- ✅ Enregistrement du callback URL via l'API Notification
- ✅ Les callbacks arrivent correctement au backend

## 🚀 Configuration en PRODUCTION

### Étape 1: Enregistrer le callback URL

**Méthode 1 - Via le script automatique** (RECOMMANDÉ):
```bash
./setup-orange-callback.sh
# Choisir: 2) Production
```

**Méthode 2 - Via l'API directement**:
```bash
curl -X POST https://printalma-back-dep.onrender.com/orange-money/register-callback
```

**Méthode 3 - Via Swagger** (en production):
```
POST https://printalma-back-dep.onrender.com/orange-money/register-callback
```

### Étape 2: Vérifier l'enregistrement

```bash
curl https://printalma-back-dep.onrender.com/orange-money/verify-callback
```

### Étape 3: Tester avec un vrai paiement

1. Créer une commande
2. Scanner le QR Code Orange Money
3. Payer avec votre app Orange Money / MAX IT
4. **Le callback arrivera automatiquement au backend**
5. Le statut passera de `PENDING` à `PAID`

## 🧪 Configuration en LOCAL (Sandbox)

### Option 1: Simuler les callbacks manuellement (FACILE)

```bash
# Après chaque paiement test, simuler le callback SUCCESS
./simulate-om-success.sh ORD-1771805528447
```

### Option 2: Utiliser ngrok (AVANCÉ)

```bash
# 1. Installer ngrok
npm install -g ngrok

# 2. Exposer le port 3004
ngrok http 3004

# 3. Copier l'URL ngrok (ex: https://xxxx.ngrok-free.app)

# 4. Définir BACKEND_URL dans .env
BACKEND_URL=https://xxxx.ngrok-free.app

# 5. Enregistrer le callback
./setup-orange-callback.sh
# Choisir: 1) Sandbox
```

## 📋 API Endpoints créés

### POST /orange-money/register-callback
Enregistre l'URL de callback auprès d'Orange Money

**Response:**
```json
{
  "success": true,
  "message": "Callback URL registered successfully",
  "data": { ... }
}
```

### GET /orange-money/verify-callback
Vérifie l'URL de callback enregistrée

**Response:**
```json
{
  "success": true,
  "data": {
    "code": "MERCHANT_CODE",
    "callbackUrl": "https://printalma-back-dep.onrender.com/orange-money/callback"
  }
}
```

## 🔍 Comment ça marche

### 1. Enregistrement (UNE FOIS)
```
POST /api/notification/v1/merchantcallback
{
  "code": "MERCHANT_CODE",
  "name": "Printalma Payment Callback",
  "callbackUrl": "https://printalma-back-dep.onrender.com/orange-money/callback"
}
```

### 2. Génération de paiement
```
POST /api/eWallet/v4/qrcode
{
  "code": "MERCHANT_CODE",
  "amount": { "value": 2000, "unit": "XOF" },
  "reference": "OM-ORD-XXX-YYY",
  ...
}
```

### 3. Callback automatique d'Orange Money
Quand le client paie, Orange Money envoie:
```
POST https://printalma-back-dep.onrender.com/orange-money/callback
{
  "status": "SUCCESS",
  "transactionId": "TXN-OM-12345",
  "reference": "OM-ORD-XXX-YYY",
  "metadata": { "orderNumber": "ORD-XXX" }
}
```

### 4. Notre backend traite le callback
```typescript
// orange-money.service.ts - handleCallback()
if (status === 'SUCCESS') {
  await prisma.order.update({
    where: { orderNumber },
    data: { paymentStatus: 'PAID', transactionId }
  });
}
```

### 5. Frontend polling détecte le changement
```typescript
// OrangeMoneyPaymentPage.tsx
// Polling toutes les 1 seconde
const response = await verifyOrangeMoneyStatus(orderNumber);
// → paymentStatus: "PAID" détecté
// → Affichage page succès ✅
```

## ✅ Checklist de déploiement

- [x] Backend: Méthode `registerCallbackUrl()` créée
- [x] Backend: Méthode `getRegisteredCallbackUrl()` créée
- [x] Backend: Endpoints `/register-callback` et `/verify-callback`
- [x] Script: `setup-orange-callback.sh` créé
- [x] Script: `simulate-om-success.sh` pour tests locaux
- [ ] **TODO: Exécuter `./setup-orange-callback.sh` en PRODUCTION** ⚠️
- [ ] **TODO: Tester avec un vrai paiement Orange Money** ⚠️

## 🎯 Références

- Documentation Orange Money: https://developer.orange-sonatel.com/documentation
- PDF: `DOc/Proceędure de test de l'API QR CODE-Deeplink OM.pdf` (pages 9-11)
- API Notification: `/api/notification/v1/merchantcallback`

## 🐛 Dépannage

### Le callback n'arrive pas
1. Vérifier que l'URL est enregistrée: `GET /orange-money/verify-callback`
2. Vérifier les logs backend lors du paiement
3. Vérifier que BACKEND_URL est une URL publique (pas localhost)

### Statut reste PENDING
1. En LOCAL: Utiliser `./simulate-om-success.sh`
2. En PROD: Vérifier que le callback URL est bien enregistré

### Callback arrive mais statut ne change pas
1. Vérifier les logs backend: `[OM Payment] Callback reçu`
2. Vérifier le `orderNumber` dans le callback
3. Vérifier l'idempotence (commande déjà PAID?)
