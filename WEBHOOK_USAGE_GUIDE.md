# 📡 Guide d'Utilisation du Webhook PayDunya

## ❌ Erreur normale avec webhook vide

```bash
curl -X POST 'http://localhost:3004/paydunya/webhook' -d ''
# Réponse : {"message": "Empty webhook data", "error": "Bad Request"}
```

**C'est normal !** Le webhook a besoin des données PayDunya.

---

## ✅ Format correct du webhook

### Champs obligatoires
```json
{
  "invoice_token": "test_TOKEN123",      // Token PayDunya
  "status": "completed",                 // completed | failed | cancelled
  "response_code": "00",                 // 00 = succès, autre = échec
  "total_amount": 15000,                 // Montant en FCFA
  "custom_data": "{\"order_id\":123}",   // Données personnalisées
  "payment_method": "paydunya",          // Méthode de paiement
  "customer_name": "Client Nom",         // Nom du client
  "customer_email": "email@domain.com"   // Email du client
}
```

### Exemple de paiement réussi
```bash
curl -X POST "http://localhost:3004/paydunya/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_token": "test_SUCCESS123",
    "status": "completed",
    "response_code": "00",
    "total_amount": 15000,
    "custom_data": "{\"order_number\":\"ORD-123456\",\"order_id\":123}",
    "payment_method": "paydunya",
    "customer_name": "Client Test",
    "customer_email": "test@example.com"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "PayDunya webhook processed successfully",
  "data": {
    "payment_status": "success",
    "status_updated": true,
    "failure_details": null
  }
}
```

### Exemple de paiement échoué
```bash
curl -X POST "http://localhost:3004/paydunya/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_token": "test_FAILED456",
    "status": "failed",
    "response_code": "99",
    "total_amount": 10000,
    "custom_data": "{\"order_number\":\"ORD-FAILED789\",\"order_id\":456}",
    "payment_method": "paydunya",
    "customer_name": "Client Échec",
    "customer_email": "echec@example.com"
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "PayDunya webhook processed successfully",
  "data": {
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

## 🎯 Statuts possibles

| Statut | Code | Signification | Action backend |
|--------|-------|---------------|----------------|
| `completed` | `00` | Paiement réussi | `PAID` ✅ |
| `failed` | `99` | Paiement échoué | `FAILED` ❌ |
| `cancelled` | `01` | Paiement annulé | `CANCELLED` 🚫 |

---

## 🔄 Comment ça fonctionne

1. **PayDunya envoie** le webhook automatiquement après un paiement
2. **Backend reçoit** les données et valide les champs obligatoires
3. **Backend met à jour** automatiquement le statut de la commande
4. **Backend répond** avec confirmation du traitement

**Le frontend n'a rien à faire - tout est automatique !** 🚀