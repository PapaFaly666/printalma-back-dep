# 🧪 Guide de Test Manuel - PayTech Integration

## 📋 Prérequis

- Serveur backend démarré : `npm run start:dev`
- Application accessible sur : `http://localhost:3004`

---

## 🔄 Test 1: Configuration PayTech

### 1. Vérifier la configuration
```bash
curl -X GET "http://localhost:3004/paytech/test-config"
```

**Réponse attendue :**
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

## 🛒 Test 2: Création de Commande avec PayTech

### 2. Créer une commande (mode invité)
```bash
curl -X POST "http://localhost:3004/orders/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "771234567",
    "paymentMethod": "PAYTECH",
    "initiatePayment": true,
    "shippingDetails": {
      "street": "123 Test Street",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "orderItems": [
      {
        "productId": 1,
        "quantity": 1,
        "color": "Bleu",
        "size": "L"
      }
    ]
  }'
```

**Réponse attendue :**
- Commande créée avec statut `PENDING`
- Jeton de paiement généré
- URL de redirection PayTech fournie

---

## 🌐 Test 3: Simulation de Paiement

### 3a. Accéder à la page de paiement
Copiez l'URL `redirect_url` de la réponse et ouvrez-la dans votre navigateur :
```
https://paytech.sn/payment/checkout/[JETON]
```

### 3b. Options de test sur PayTech
- **Test réussi** : Utiliser les coordonnées de test fournies par PayTech
- **Test échec** : Entrer des informations invalides ou annuler

---

## 📡 Test 4: Simulation IPN (Webhook)

### 4a. Simuler un paiement réussi
```bash
curl -X POST "http://localhost:3004/paytech/ipn-callback" \
  -H "Content-Type: application/json" \
  -d '{
    "type_event": "sale_complete",
    "ref_command": "ORD-[NUMERO]",
    "item_price": "200",
    "transaction_id": "SUCCESS_TEST_'$(date +%s)'",
    "success": "1",
    "hmac_compute": "[HMAC_CALCULE]"
  }'
```

### 4b. Simuler un paiement échoué
```bash
curl -X POST "http://localhost:3004/paytech/ipn-callback" \
  -H "Content-Type: application/json" \
  -d '{
    "type_event": "sale_canceled",
    "ref_command": "ORD-[NUMERO]",
    "item_price": "200",
    "transaction_id": "FAILED_TEST_'$(date +%s)'",
    "success": "0",
    "cancel_reason": "insufficient_funds",
    "hmac_compute": "[HMAC_CALCULE]"
  }'
```

---

## 🔍 Test 5: Vérification du Statut

### 5. Vérifier le statut de la commande
```bash
# D'abord, s'authentifier pour obtenir les cookies
curl -X POST "http://localhost:3004/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pfdiagne35@gmail.com",
    "password": "printalmatest123"
  }' -c cookies-test.txt

# Ensuite vérifier la commande
curl -X GET "http://localhost:3004/orders/[ID]" \
  -H "Content-Type: application/json" \
  -b cookies-test.txt
```

**Statuts attendus :**
- ✅ Paiement réussi : `status: "CONFIRMED"`, `paymentStatus: "PAID"`
- ❌ Paiement échoué : `status: "PENDING"`, `paymentStatus: "FAILED"`

---

## 🛠️ Test 6: Diagnostic PayTech

### 6. Tester la connexion API PayTech
```bash
curl -X GET "http://localhost:3004/paytech/diagnose"
```

---

## 📊 Scénarios de Test Complets

| Scénario | Étapes | Résultat Attendu |
|----------|--------|------------------|
| **Paiement réussi** | 1→2→3a→4a→5 | Commande `CONFIRMED`, Paiement `PAID` |
| **Fonds insuffisants** | 1→2→3b→4b→5 | Commande `PENDING`, Paiement `FAILED` |
| **Session expirée** | 1→2→3b→4b→5 | Commande `PENDING`, Paiement `FAILED` |
| **Annulation utilisateur** | 1→2→3b→4b→5 | Commande `PENDING`, Paiement `FAILED` |

---

## 🔧 Calcul HMAC pour IPN

Pour calculer le HMAC-SHA256 manuellement :
```bash
# Message format: amount|ref_command|api_key
MESSAGE="200|ORD-1761824958346|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa"
API_SECRET="70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b"

echo -n "$MESSAGE" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2
```

---

## 🚨 Points de Vigilance

1. **Mode TEST** : PayTech en mode test = pas de débit réel
2. **URL IPN** : Doit être HTTPS en production
3. **Signatures HMAC** : Toutes les requêtes IPN doivent être signées
4. **Timeout** : Le paiement expire après un certain temps
5. **Logs** : Vérifiez les logs du backend pour tracer les erreurs

---

## 🎯 Checklist de Validation

- [ ] Configuration PayTech OK
- [ ] Création commande avec PayTech fonctionne
- [ ] URL de paiement générée
- [ ] IPN réussi met à jour la commande
- [ ] IPN échoué laisse la commande en PENDING
- [ ] HMAC signature vérification fonctionne
- [ ] Logs backend cohérents
- [ ] Interface utilisateur peut réessayer le paiement

---

## 🆘 Dépannage

### Problèmes courants :
- **404 sur endpoints** : Vérifiez que le serveur est sur le bon port (3004)
- **HMAC invalide** : Recalculez la signature avec le bon format
- **Commande non trouvée** : Vérifiez le `orderNumber` dans l'IPN
- **Pas de mise à jour** : Vérifiez les logs backend pour les erreurs

### Commandes utiles :
```bash
# Voir les logs du serveur
tail -f logs/app.log

# Redémarrer le serveur
npm run start:dev

# Vérifier les ports utilisés
ss -tlnp | grep :3004
```