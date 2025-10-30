# 🚀 Guide de Test PayTech via Swagger

## 📍 Accès à Swagger

**URL**: http://localhost:3004/api

---

## 📋 Étape 1: Vérifier la Configuration PayTech

### 1. Accéder à l'endpoint de configuration
- **Endpoint**: `GET /paytech/test-config`
- **Méthode**: `GET`
- **Pas d'authentification requise**

**Résultat attendu**:
```json
{
  "success": true,
  "message": "PayTech service is configured and ready",
  "data": {
    "hasApiKey": true,
    "hasApiSecret": true,
    "environment": "test"
  }
}
```

---

## 📋 Étape 2: Créer une Commande avec PayTech

### 2. Créer une commande invité
- **Endpoint**: `POST /orders/guest`
- **Méthode**: `POST`
- **Pas d'authentification requise**

**Corps de la requête**:
```json
{
  "phoneNumber": "771234567",
  "paymentMethod": "PAYTECH",
  "initiatePayment": true,
  "shippingDetails": {
    "street": "123 Swagger Test Street",
    "city": "Dakar",
    "country": "Sénégal"
  },
  "orderItems": [
    {
      "productId": 1,
      "quantity": 1,
      "color": "Bleu Swagger",
      "size": "M"
    }
  ]
}
```

**Résultat attendu**:
```json
{
  "success": true,
  "message": "Commande invité créée avec succès",
  "data": {
    "id": 18,
    "orderNumber": "ORD-1761827000000",
    "status": "PENDING",
    "payment": {
      "token": "abcd1234efgh5678",
      "redirect_url": "https://paytech.sn/payment/checkout/abcd1234efgh5678"
    }
  }
}
```

**Notez le `orderNumber` et le `token` pour l'étape suivante !**

---

## 📋 Étape 3: Tester les Webhooks PayTech

### 3a. Webhook de Paiement Réussi
- **Endpoint**: `POST /paytech/ipn-callback`
- **Méthode**: `POST`
- **Pas d'authentification requise**

**Corps de la requête** (remplacez `ORD-XXXXX` par votre numéro de commande):
```json
{
  "type_event": "sale_complete",
  "ref_command": "ORD-1761827000000",
  "item_price": "200",
  "transaction_id": "SUCCESS_SWAGGER_TEST",
  "success": "1",
  "hmac_compute": "VOTRE_HMAC_ICI"
}
```

### 3b. Webhook d'Échec - Fonds Insuffisants
```json
{
  "type_event": "sale_canceled",
  "ref_command": "ORD-1761827000000",
  "item_price": "200",
  "transaction_id": "FAILED_SWAGGER_FUNDS",
  "success": "0",
  "cancel_reason": "insufficient_funds",
  "error_code": "INSUFFICIENT_FUNDS",
  "error_message": "Solde insuffisant sur le compte",
  "processor_response": "Bank declined: insufficient funds",
  "hmac_compute": "VOTRE_HMAC_ICI"
}
```

### 3c. Webhook d'Échec - Session Expirée
```json
{
  "type_event": "sale_canceled",
  "ref_command": "ORD-1761827000000",
  "item_price": "200",
  "transaction_id": "FAILED_SWAGGER_EXPIRED",
  "success": "0",
  "cancel_reason": "session_expired",
  "error_code": "SESSION_TIMEOUT",
  "error_message": "La session de paiement a expiré",
  "hmac_compute": "VOTRE_HMAC_ICI"
}
```

### 3d. Webhook d'Échec - Carte Refusée
```json
{
  "type_event": "sale_canceled",
  "ref_command": "ORD-1761827000000",
  "item_price": "200",
  "transaction_id": "FAILED_SWAGGER_DECLINED",
  "success": "0",
  "cancel_reason": "card_declined",
  "error_code": "CARD_DECLINED",
  "error_message": "La carte bancaire a été refusée",
  "processor_response": "Declined - Do not honor",
  "hmac_compute": "VOTRE_HMAC_ICI"
}
```

---

## 🔧 Comment Calculer le HMAC pour Swagger

### Méthode 1: Via ligne de commande
```bash
# Remplacez ORD-1761827000000 par votre numéro de commande réel
echo -n "200|ORD-1761827000000|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa" | openssl dgst -sha256 -hmac "70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b" | cut -d' ' -f2
```

### Méthode 2: Via outil en ligne
1. Allez sur https://www.freeformatter.com/hmac-generator.html
2. **String**: `200|VOTRE_ORDER_NUMBER|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa`
3. **Secret Key**: `70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b`
4. **Algorithm**: `SHA256`
5. Copiez le HMAC généré

---

## 📋 Étape 4: Vérifier le Statut de la Commande

### 4. Se connecter pour obtenir les cookies
- **Endpoint**: `POST /auth/login`
- **Méthode**: `POST`

**Corps de la requête**:
```json
{
  "email": "pfdiagne35@gmail.com",
  "password": "printalmatest123"
}
```

### 5. Vérifier la commande
- **Endpoint**: `GET /orders/{id}`
- **Méthode**: `GET`
- **Authentification requise** (utiliser les cookies de l'étape 4)

**Paramètre**: `id` = ID de votre commande (ex: 18)

**Résultat attendu après succès**:
```json
{
  "success": true,
  "data": {
    "status": "CONFIRMED",
    "paymentStatus": "PAID",
    "transactionId": "SUCCESS_SWAGGER_TEST"
  }
}
```

**Résultat attendu après échec**:
```json
{
  "success": true,
  "data": {
    "status": "PENDING",
    "paymentStatus": "FAILED",
    "transactionId": "FAILED_SWAGGER_FUNDS",
    "notes": "💳 PAYMENT FAILED: {\"reason\": \"insufficient_funds\", \"category\": \"insufficient_funds\"...}"
  }
}
```

---

## 📋 Étape 5: Tests Additionnels

### Diagnostic PayTech
- **Endpoint**: `GET /paytech/diagnose`
- **Vérifie la connectivité avec l'API PayTech**

### Statut du Paiement
- **Endpoint**: `GET /paytech/status/{token}`
- **Paramètre**: `token` = jeton de paiement obtenu à l'étape 2

---

## 🎯 Scénarios de Test Complets via Swagger

### Scénario 1: Paiement Réussi
1. `POST /orders/guest` → Créer commande PayTech
2. `POST /paytech/ipn-callback` → Envoyer webhook `sale_complete`
3. `POST /auth/login` → S'authentifier
4. `GET /orders/{id}` → Vérifier statut `CONFIRMED`/`PAID`

### Scénario 2: Échec par Fonds Insuffisants
1. `POST /orders/guest` → Créer commande PayTech
2. `POST /paytech/ipn-callback` → Envoyer webhook `sale_canceled` + `insufficient_funds`
3. `POST /auth/login` → S'authentifier
4. `GET /orders/{id}` → Vérifier statut `PENDING`/`FAILED`

### Scénario 3: Session Expirée
1. `POST /orders/guest` → Créer commande PayTech
2. `POST /paytech/ipn-callback` → Envoyer webhook `sale_canceled` + `session_expired`
3. `POST /auth/login` → S'authentifier
4. `GET /orders/{id}` → Vérifier statut `PENDING`/`FAILED`

---

## 🚨 Points Importants pour Swagger

1. **Pas d'authentification** pour les endpoints PayTech (`/paytech/*`)
2. **Calculer le HMAC** manuellement pour chaque test IPN
3. **Utiliser des numéros de commande uniques** pour chaque test
4. **Vérifier les réponses** avec les `failure_details` pour les échecs
5. **Les cookies** sont nécessaires pour vérifier les commandes

---

## 🎯 Avantages de Swagger pour les Tests

✅ **Interface visuelle** facile à utiliser
✅ **Documentation intégrée** des endpoints
✅ **Validation automatique** des requêtes
✅ **Tests rapides** sans ligne de commande
✅ **Formatage JSON** automatique
✅ **Historique des requêtes** dans le navigateur

**Swagger est parfait pour tester rapidement toutes les fonctionnalités PayTech !** 🚀