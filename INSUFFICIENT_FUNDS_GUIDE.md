# 💰 Guide Complet - Gestion des Fonds Insuffisants PayDunya

## 🚨 **Scénario : Fonds insuffisants dans PayDunya**

Quand vous testez un paiement et obtenez le message :
> *"Vous n'avez pas assez de fonds pour effectuer cette opération. Veuillez créditer votre compte test."*

Le statut doit changer automatiquement dans votre base de données.

---

## 🔄 **Comment ça fonctionne en pratique**

### 1. **Client tente un paiement**
- URL : `https://paydunya.com/sandbox-checkout/invoice/test_uYsoKCWa9g`
- PayDunya détecte les fonds insuffisants
- **PayDunya envoie automatiquement un webhook** à votre backend

### 2. **Webhook reçu par votre backend**
```json
{
  "invoice_token": "test_uYsoKCWa9g",
  "status": "failed",
  "response_code": "1001",
  "error_code": "insufficient_funds",
  "cancel_reason": "Fonds insuffisants - Veuillez créditer votre compte test"
}
```

### 3. **Backend met à jour la base de données**
- `payment_status` → `FAILED`
- `failure_details` → Enregistre la raison "fonds insuffisants"
- `payment_attempts` → Incrémenté
- `lastPaymentFailureReason` → Message d'erreur

---

## 🧪 **Test manuel du scénario (si webhook automatique ne marche pas)**

### **Simuler le webhook fonds insuffisants**

```bash
curl -X POST "http://localhost:3004/paydunya/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_token": "test_uYsoKCWa9g",
    "status": "failed",
    "response_code": "1001",
    "total_amount": 10000,
    "custom_data": {
      "order_number": "ORD-1762378811837",
      "order_id": 100
    },
    "payment_method": "paydunya",
    "customer_name": "Client Fonds Insuffisants",
    "customer_email": "funds.test@example.com",
    "error_code": "insufficient_funds",
    "cancel_reason": "Fonds insuffisants - Veuillez créditer votre compte test"
  }'
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "PayDunya webhook processed successfully",
  "data": {
    "invoice_token": "test_uYsoKCWa9g",
    "order_number": "ORD-1762378811837",
    "payment_status": "failed",
    "status_updated": true,
    "failure_details": {
      "reason": "fonds insuffisants - veuillez créditer votre compte test",
      "code": "insufficient_funds",
      "message": "Fonds insuffisants - Veuillez créditer votre compte test",
      "category": "technical_error"
    }
  }
}
```

---

## 📊 **Vérification après traitement**

### **Vérifier le statut PayDunya**
```bash
curl "http://localhost:3004/paydunya/status/test_uYsoKCWa9g"
```

### **Vérifier les détails de la commande**
```bash
curl "http://localhost:3004/orders/100" | jq '.data | {orderNumber, paymentStatus, paymentInfo, failure_details}'
```

---

## 🎯 **Codes d'erreur PayDunya pour fonds insuffisants**

| Code d'erreur | Description | Action recommandée |
|---------------|-------------|-------------------|
| `1001` | Fonds insuffisants | Inviter à créditer le compte |
| `1002` | Solde invalide | Vérifier les données client |
| `9001` | Transaction refusée | Contacter le support PayDunya |

---

## 🔄 **Processus complet de récupération**

### **1. Échec du paiement**
```
Client paie → PayDunya: "Fonds insuffisants" → Webhook: failed → BDD: FAILED
```

### **2. Notification au client**
- Frontend détecte `paymentStatus: FAILED`
- Affiche le message : "Fonds insuffisants"
- Propose de réessayer après avoir crédité le compte

### **3. Client crédite son compte**
- Va dans son dashboard PayDunya test
- Ajoute des fonds au compte de test
- Revient sur votre site

### **4. Nouvelle tentative de paiement**
```
Client paie → PayDunya: Succès → Webhook: completed → BDD: PAID
```

---

## 🛠️ **Comment déboguer si ça ne marche pas**

### **1. Vérifier que le webhook est bien reçu**
```bash
# Logs du backend (cherchez "webhook received")
tail -f logs/application.log
```

### **2. Tester le webhook manuellement**
Utilisez le script ci-dessus pour simuler le webhook

### **3. Vérifier la mise à jour en base**
```sql
SELECT * FROM orders WHERE order_number = 'ORD-1762378811837';
```

### **4. Vérifier les champs d'échec**
```sql
SELECT payment_status, failure_details, payment_attempts
FROM orders
WHERE order_number = 'ORD-1762378811837';
```

---

## 🎨 **Exemple de traitement côté Frontend**

```jsx
const PaymentStatus = ({ paymentStatus, failureDetails }) => {
  if (paymentStatus === 'FAILED' && failureDetails?.code === 'insufficient_funds') {
    return (
      <div className="payment-failed">
        <h3>💰 Fonds insuffisants</h3>
        <p>{failureDetails.message}</p>
        <div className="actions">
          <button onClick={handleRetry}>Réessayer le paiement</button>
          <a href="https://paydunya.com/sandbox-test-account" target="_blank">
            Créditer mon compte test
          </a>
        </div>
      </div>
    );
  }
  // ... autres cas
};
```

---

## 🚀 **Solutions pour créditer le compte test PayDunya**

### **Option 1 : Dashboard PayDunya**
1. Aller sur : https://paydunya.com/sandbox
2. Se connecter avec vos identifiants test
3. Naviguer vers "Test Account" ou "Solde"
4. Ajouter des fonds virtuels

### **Option 2 : API PayDunya**
```bash
curl -X POST "https://app.paydunya.com/sandbox-api/v1/test-account/fund" \
  -H "PAYDUNYA-MASTER-KEY: votre_master_key" \
  -H "PAYDUNYA-PRIVATE-KEY: votre_private_key" \
  -H "PAYDUNYA-TOKEN: votre_token" \
  -d '{
    "amount": 50000,
    "reason": "Approvisionnement compte test"
  }'
```

---

## ✅ **Résumé du processus**

1. **Client paie** → Fonds insuffisants
2. **PayDunya** → Envoie webhook automatique
3. **Votre backend** → Met à jour `paymentStatus: FAILED`
4. **Frontend** → Affiche message d'erreur spécifique
5. **Client** → Crédite son compte et réessaie
6. **Nouveau paiement** → Succès cette fois

**Les fonds insuffisants sont gérés automatiquement !** 🎉