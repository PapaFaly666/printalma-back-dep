# 🎯 Champs Requis pour le Webhook PayDunya

## 📡 Endpoint : `POST /paydunya/webhook`

### ❌ Champs OBLIGATOIRES (minimum 2 champs)

L'endpoint retourne `400 Bad Request` si ces 2 champs manquent :

#### 1. `invoice_token` (Obligatoire)
- **Description** : Token unique du paiement PayDunya
- **Alternatives** : `token` (accepté aussi)
- **Exemple** : `"test_TOKEN123"`

#### 2. `status` (Obligatoire)
- **Description** : Statut du paiement
- **Alternatives** : `payment_status` (accepté aussi)
- **Valeurs possibles** : `"completed"`, `"failed"`, `"cancelled"`
- **Exemple** : `"completed"`

### ✅ Exemple MINIMAL qui fonctionne
```bash
curl -X POST "http://localhost:3004/paydunya/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_token": "test_minimal123",
    "status": "completed"
  }'
```

**Réponse** : `{"success": true, "message": "PayDunya webhook processed successfully"}`

---

## 🔧 Champs OPTIONNELS (recommandés)

Pour un traitement optimal, ajoutez ces champs :

### 3. `response_code` (Recommandé)
- **Description** : Code de réponse PayDunya
- **Valeurs** : `"00"` (succès), autre code (échec)
- **Exemple** : `"00"`

### 4. `total_amount` (Recommandé)
- **Description** : Montant du paiement
- **Alternatives** : `amount` (accepté aussi)
- **Exemple** : `15000`

### 5. `custom_data` (Recommandé)
- **Description** : Données personnalisées pour retrouver la commande
- **Format** : JSON string ou objet
- **Exemple** : `"{\"order_number\":\"ORD-123\",\"order_id\":123}"`

### 6. `payment_method` (Optionnel)
- **Description** : Méthode de paiement
- **Valeur par défaut** : `"paydunya"`
- **Exemple** : `"paydunya"`

### 7. Informations client (Optionnel)
- `customer_name` ou `customer.name`
- `customer_email` ou `customer.email`
- `customer_phone` ou `customer.phone`

---

## 📋 Exemples complets

### ✅ Paiement réussi complet
```json
{
  "invoice_token": "test_SUCCESS123",
  "status": "completed",
  "response_code": "00",
  "total_amount": 15000,
  "custom_data": "{\"order_number\":\"ORD-123456\",\"order_id\":123}",
  "payment_method": "paydunya",
  "customer_name": "Client Test",
  "customer_email": "test@example.com",
  "customer_phone": "775588834"
}
```

### ❌ Paiement échoué
```json
{
  "invoice_token": "test_FAILED456",
  "status": "failed",
  "response_code": "99",
  "total_amount": 10000,
  "custom_data": "{\"order_number\":\"ORD-FAILED789\",\"order_id\":456}",
  "payment_method": "paydunya",
  "customer_name": "Client Échec",
  "customer_email": "echec@example.com"
}
```

### ⚠️ Cas d'erreur
```json
{
  "invoice_token": "test_ERROR789",
  "status": "failed",
  "response_code": "901",
  "total_amount": 5000,
  "custom_data": "{\"order_number\":\"ORD-ERROR789\",\"order_id\":789}",
  "error_code": "insufficient_funds",
  "customer_name": "Client Erreur",
  "customer_email": "erreur@example.com"
}
```

---

## 🔄 Validation côté backend

Le webhook valide dans cet ordre :

1. **Vérifie que les données ne sont pas vides**
   ```typescript
   if (Object.keys(webhookData).length === 0) {
     throw new BadRequestException('Empty webhook data');
   }
   ```

2. **Vérifie les champs obligatoires**
   ```typescript
   const invoiceToken = webhookData.invoice_token || webhookData.token;
   const status = webhookData.status || webhookData.payment_status;

   if (!invoiceToken || !status) {
     throw new BadRequestException('Missing required fields: invoice_token and status');
   }
   ```

3. **Mappe les champs avec flexibilité**
   ```typescript
   const callbackData = {
     invoice_token: invoiceToken,
     status: status,
     custom_data: webhookData.custom_data || webhookData.customData,
     total_amount: webhookData.total_amount || webhookData.amount,
     customer_name: webhookData.customer_name || webhookData.customer?.name,
     // ... etc
   };
   ```

---

## 🎯 Résumé

**MINIMUM REQUIS (2 champs)** :
- ✅ `invoice_token` ou `token`
- ✅ `status` ou `payment_status`

**OPTIMAL RECOMMANDÉ (5+ champs)** :
- ✅ `invoice_token`
- ✅ `status`
- ✅ `response_code`
- ✅ `total_amount`
- ✅ `custom_data`

**AVEC ces champs, le webhook fonctionne parfaitement et met à jour automatiquement la base de données !** 🚀