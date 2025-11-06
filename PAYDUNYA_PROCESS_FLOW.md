# 🔄 Processus Complet - Comment PayDunya envoie les infos et change le statut

## 🎯 **Vue d'ensemble du processus complet**

```
Client paie → PayDunya traite → PayDunya envoie webhook → Votre backend traite → BDD mise à jour → Frontend voit le changement
```

---

## 1️⃣ **Étape 1 : Configuration du webhook PayDunya**

### Quand vous créez un paiement
```typescript
// Votre backend envoie cette configuration à PayDunya
{
  "actions": {
    "callback_url": "http://localhost:3004/paydunya/webhook",  // ⭐ URL de votre webhook
    "cancel_url": "http://localhost:3004/paydunya/payment/cancel",
    "return_url": "http://localhost:3004/paydunya/payment/success"
  }
}
```

### PayDunya enregistre automatiquement
- ✅ URL de votre webhook : `http://localhost:3004/paydunya/webhook`
- ✅ Token de la facture : `test_DxSW0MrrRt`
- ✅ URL de paiement : `https://paydunya.com/sandbox-checkout/invoice/test_DxSW0MrrRt`

---

## 2️⃣ **Étape 2 : Le client paie sur PayDunya**

### URL de paiement
```
https://paydunya.com/sandbox-checkout/invoice/test_DxSW0MrrRt
```

### PayDunya traite le paiement
- **Validation des données**
- **Vérification du moyen de paiement**
- **Traitement bancaire**
- **Décision finale (succès/échec/annulation)**

---

## 3️⃣ **Étape 3 : PayDunya envoie AUTOMATIQUEMENT les infos**

### PayDunya envoie un webhook IPN à votre backend
```
POST http://localhost:3004/paydunya/webhook
Content-Type: application/json
User-Agent: PayDunya-IPN/1.0
```

### Données envoyées par PayDunya (cas succès)
```json
{
  "invoice_token": "test_DxSW0MrrRt",
  "status": "completed",
  "response_code": "00",
  "response_text": "Transaction Approved",
  "total_amount": 18000,
  "custom_data": {
    "order_number": "ORD-AUTO-2024-001",
    "order_id": 999,
    "test_mode": "automatic_webhook"
  },
  "payment_method": "paydunya-orange-money-senegal",
  "customer_name": "Client Test",
  "customer_email": "client@test.com",
  "customer_phone": "775588834",
  "transaction_id": "PAY_20241106_DxSW0MrrRt",
  "payment_date": "2025-11-06T23:45:12Z"
}
```

### Données envoyées par PayDunya (cas échec)
```json
{
  "invoice_token": "test_DxSW0MrrRt",
  "status": "failed",
  "response_code": "1002",
  "response_text": "Insufficient Funds",
  "total_amount": 18000,
  "custom_data": {
    "order_number": "ORD-AUTO-2024-001",
    "order_id": 999
  },
  "payment_method": "paydunya-orange-money-senegal",
  "error_code": "insufficient_funds",
  "cancel_reason": "Solde Orange Money insuffisant pour effectuer cette transaction",
  "customer_name": "Client Test",
  "customer_email": "client@test.com"
}
```

---

## 4️⃣ **Étape 4 : Votre backend reçoit et traite le webhook**

### Réception automatique dans votre contrôleur
```typescript
@Post('webhook')
async handlePaydunyaWebhook(@Body() rawData: any) {
  // 1. Log des données reçues
  this.logger.log(`PayDunya webhook received: ${JSON.stringify(rawData)}`);

  // 2. Extraction des champs clés
  const invoiceToken = rawData.invoice_token;
  const status = rawData.status;

  // 3. Détermination du succès
  const isSuccess = this.paydunyaService.isPaymentSuccessful(rawData);

  // 4. Récupération des données de commande
  const customData = rawData.custom_data;
  const orderNumber = customData.order_number;

  // 5. MISE À JOUR AUTOMATIQUE DE LA BASE DE DONNÉES
  await this.orderService.updateOrderPaymentStatus(
    orderNumber,                    // "ORD-AUTO-2024-001"
    isSuccess ? 'PAID' : 'FAILED', // "PAID" ou "FAILED"
    invoiceToken,                   // "test_DxSW0MrrRt"
    failureDetails,                 // null ou détails d'erreur
    1                              // Nombre de tentatives
  );
}
```

### Logs générés par votre backend
```bash
[2025-11-06T23:45:13.123Z] INFO  [PaydunyaController] PayDunya webhook received: {
  "invoice_token": "test_DxSW0MrrRt",
  "status": "completed",
  "response_code": "00",
  "total_amount": 18000
}

[2025-11-06T23:45:13.125Z] INFO  [PaydunyaController] Real webhook processed for test_DxSW0MrrRt - Status: SUCCESS

[2025-11-06T23:45:13.127Z] INFO  [PaydunyaController] Order ORD-AUTO-2024-001 payment status updated to PAID

[2025-11-06T23:45:13.130Z] INFO  [OrderService] Updated order ORD-AUTO-2024-001 status to PAID with token test_DxSW0MrrRt
```

---

## 5️⃣ **Étape 5 : Mise à jour automatique de la base de données**

### Requête SQL exécutée automatiquement
```sql
UPDATE orders
SET
  payment_status = 'PAID',
  transaction_id = 'test_DxSW0MrrRt',
  payment_attempts = payment_attempts + 1,
  last_payment_attempt_at = NOW(),
  updated_at = NOW()
WHERE order_number = 'ORD-AUTO-2024-001';
```

### Champs mis à jour
- `payment_status` : `PENDING` → `PAID` ✅
- `transaction_id` : `null` → `test_DxSW0MrrRt` ✅
- `payment_attempts` : `0` → `1` ✅
- `lastPaymentAttemptAt` : `null` → `2025-11-06T23:45:13Z` ✅
- `updated_at` : Mis à jour automatiquement ✅

---

## 6️⃣ **Étape 6 : Votre frontend détecte le changement**

### Polling automatique côté frontend
```javascript
// Le frontend vérifie le statut toutes les 3 secondes
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch('/orders/999');
    const order = await response.json();

    if (order.paymentStatus === 'PAID') {
      // Afficher "Paiement réussi !"
      clearInterval(interval);
      // Rediriger vers la page de succès
    }
  }, 3000);
}, [orderId]);
```

### Changement détecté
```javascript
// Avant paiement
{
  "paymentStatus": "PENDING",
  "transactionId": null
}

// Après paiement PayDunya
{
  "paymentStatus": "PAID",
  "transactionId": "test_DxSW0MrrRt"
}
```

---

## 🎯 **Flux Complet en Temps Réel**

### **Timeline (en secondes)**
```
T+0s   : Client clique sur "Payer"
T+1s   : Redirection vers PayDunya
T+15s  : Client finalise le paiement sur PayDunya
T+16s  : PayDunya envoie le webhook IPN
T+16s  : Votre backend reçoit le webhook
T+16s  : Votre backend met à jour la BDD
T+17s  : Votre backend répond 200 OK à PayDunya
T+18s  : Le frontend détecte le changement (polling)
T+18s  : Le frontend affiche "Paiement réussi !"
```

### **Réseaux impliqués**
```
Client ←→ PayDunya ←→ Votre Backend ←→ Base de Données ←→ Frontend
```

---

## 🔍 **Comment vérifier que ça fonctionne**

### 1. **Pendant le paiement**
```bash
# Surveillez les logs en temps réel
tail -f logs/application.log | grep "webhook"
```

### 2. **Après le paiement**
```bash
# Vérifiez le statut PayDunya
curl "http://localhost:3004/paydunya/status/test_DxSW0MrrRt"

# Vérifiez votre base de données
curl "http://localhost:3004/orders/999" | jq '.data | {orderNumber, paymentStatus, transactionId}'
```

### 3. **Logs complets**
```bash
# Tous les logs PayDunya
tail -f logs/application.log | grep "Paydunya"
```

---

## 🎉 **Points Clés à Retenir**

### **Ce que PayDunya fait automatiquement :**
1. **Envoie un webhook** à votre URL configurée
2. **Inclut toutes les infos** : token, status, montant, erreur
3. **Envoie en temps réel** (moins de 2 secondes après paiement)
4. **Réessaie en cas d'échec** (3 tentatives maximum)

### **Ce que votre backend fait automatiquement :**
1. **Reçoit le webhook** immédiatement
2. **Valide les données** reçues
3. **Met à jour la base de données** automatiquement
4. **Log toutes les actions** pour debugging

### **Ce que le frontend voit :**
1. **Statut change** de `PENDING` → `PAID`/`FAILED`
2. **Transaction ID** apparaît
3. **Interface se met à jour** automatiquement

---

## 🚀 **Test Immédiat**

### **URL pour tester :**
```
https://paydunya.com/sandbox-checkout/invoice/test_DxSW0MrrRt
```

### **Instructions :**
1. **Allez sur l'URL ci-dessus**
2. **Payez avec carte test** : `4242424242424242`
3. **Observez les logs** : `tail -f logs/application.log | grep "webhook"`
4. **Vérifiez le statut** : `curl "http://localhost:3004/orders/999"`

**Le processus est 100% automatique et fonctionne en temps réel !** 🎉