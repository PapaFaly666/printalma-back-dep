# 📖 Guide d'Utilisation du Webhook PayDunya dans Swagger

## 🎯 **Problème résolu !**

Avant, l'endpoint webhook dans Swagger n'affichait pas les champs car il n'avait pas de DTO défini.
Maintenant, vous pouvez tester le webhook directement dans Swagger avec des exemples prédéfinis !

---

## 🚀 **Comment utiliser le webhook dans Swagger**

### 1. **Accéder à Swagger**
```
http://localhost:3004/api
```

### 2. **Trouver l'endpoint**
```
POST /paydunya/webhook
```

### 3. **Cliquer sur "Try it out"**

### 4. **Utiliser les exemples prédéfinis**

#### ✅ **Exemple de paiement réussi**
```json
{
  "invoice_token": "test_success_123",
  "status": "completed",
  "response_code": "00",
  "total_amount": 15000,
  "custom_data": {
    "order_number": "ORD-123456",
    "order_id": 123
  },
  "payment_method": "paydunya",
  "customer_name": "Client Test",
  "customer_email": "client@example.com",
  "customer_phone": "775588834"
}
```

#### ❌ **Exemple de paiement échoué**
```json
{
  "invoice_token": "test_failed_456",
  "status": "failed",
  "response_code": "99",
  "total_amount": 10000,
  "custom_data": {
    "order_number": "ORD-FAILED789",
    "order_id": 456
  },
  "payment_method": "paydunya",
  "customer_name": "Client Échec",
  "customer_email": "echec@example.com",
  "error_code": "insufficient_funds",
  "cancel_reason": "Payment failed due to insufficient funds"
}
```

---

## 📋 **Champs disponibles dans Swagger**

### 🔴 **Champs obligatoires**
- **`invoice_token`** (string) : Token PayDunya - *Requis*
- **`status`** (string) : Statut du paiement - *Requis*

### 🔵 **Champs optionnels recommandés**
- **`response_code`** (string) : Code réponse PayDunya (`"00"` = succès)
- **`total_amount`** (number) : Montant du paiement
- **`custom_data`** (object) : Données de la commande
- **`payment_method`** (string) : Méthode de paiement (défaut: `"paydunya"`)
- **`customer_name`** (string) : Nom du client
- **`customer_email`** (string) : Email du client
- **`customer_phone`** (string) : Téléphone du client
- **`error_code`** (string) : Code d'erreur si échec
- **`cancel_reason`** (string) : Raison d'annulation

---

## 🎯 **Exemples d'utilisation dans Swagger**

### **Test 1 : Paiement réussi**
1. Copiez l'exemple "success"
2. Collez dans le champ "Request body"
3. Modifiez `invoice_token` avec votre token
4. Cliquez sur "Execute"

**Réponse attendue** :
```json
{
  "success": true,
  "message": "PayDunya webhook processed successfully",
  "data": {
    "invoice_token": "votre_token",
    "order_number": "ORD-123456",
    "payment_status": "success",
    "status_updated": true,
    "failure_details": null
  }
}
```

### **Test 2 : Paiement échoué**
1. Copiez l'exemple "failure"
2. Collez dans le champ "Request body"
3. Changez `status` en `"failed"`
4. Cliquez sur "Execute"

**Réponse attendue** :
```json
{
  "success": true,
  "message": "PayDunya webhook processed successfully",
  "data": {
    "invoice_token": "votre_token",
    "order_number": "ORD-FAILED789",
    "payment_status": "failed",
    "status_updated": true,
    "failure_details": {
      "reason": "technical_error",
      "message": "Erreur technique lors du paiement"
    }
  }
}
```

---

## ⚠️ **Erreurs possibles**

### **400 Bad Request**
- `"Empty webhook data"` → Corps de la requête vide
- `"Missing required fields: invoice_token and status"` → Champs obligatoires manquants

### **Solution**
Assurez-vous d'avoir au minimum :
```json
{
  "invoice_token": "votre_token",
  "status": "completed"
}
```

---

## 🔧 **Ce qui a été ajouté**

1. **DTO Swagger** : `PaydunyaWebhookDto` avec tous les champs documentés
2. **Exemples prédéfinis** : Succès et échec avec valeurs réelles
3. **Validation des champs** : Types et descriptions pour chaque champ
4. **Documentation complète** : Chaque champ a une description et un exemple

---

## 🎉 **Résultat**

Maintenant dans Swagger, vous pouvez :
- ✅ Voir tous les champs disponibles
- ✅ Utiliser les exemples prédéfinis
- ✅ Tester le webhook facilement
- ✅ Comprendre la structure attendue
- ✅ Copier-coller des exemples fonctionnels

**Le webhook est maintenant entièrement utilisable dans Swagger !** 🚀