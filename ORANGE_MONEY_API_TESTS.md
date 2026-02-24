# Guide de Test - API Orange Money (Améliorations)

**Date:** 2026-02-23
**Documentation:** https://developer.orange-sonatel.com/documentation

---

## Nouveaux Endpoints Ajoutés

### 1. **GET /orange-money/transactions** - Récupérer toutes les transactions

Récupère la liste complète des transactions Orange Money avec filtres optionnels.

**Endpoint:** `GET /orange-money/transactions`

**Query Parameters (optionnels):**
```
startDate: Date de début (format ISO 8601, ex: 2026-01-01)
endDate: Date de fin (format ISO 8601, ex: 2026-12-31)
status: Statut des transactions (SUCCESS | FAILED | PENDING | CANCELLED)
limit: Nombre maximum de résultats (ex: 50)
offset: Nombre de résultats à sauter pour la pagination (ex: 0)
```

**Exemples de requêtes:**

```bash
# Récupérer toutes les transactions
GET http://localhost:3004/orange-money/transactions

# Filtrer par statut
GET http://localhost:3004/orange-money/transactions?status=SUCCESS

# Filtrer par date
GET http://localhost:3004/orange-money/transactions?startDate=2026-02-01&endDate=2026-02-28

# Pagination
GET http://localhost:3004/orange-money/transactions?limit=10&offset=0
```

**Réponse attendue (SUCCESS):**
```json
{
  "success": true,
  "total": 25,
  "transactions": [
    {
      "transactionId": "TXN-123456",
      "reference": "OM-ORDER-123-1234567890",
      "status": "SUCCESS",
      "amount": {
        "unit": "XOF",
        "value": 10000
      },
      "timestamp": "2026-02-23T10:30:00Z",
      "code": "599241"
    },
    // ... autres transactions
  ],
  "message": "Retrieved 25 transactions successfully"
}
```

---

### 2. **GET /orange-money/verify-transaction/:transactionId** - Vérifier le statut d'une transaction (AMÉLIORÉ)

Vérifie le statut d'une transaction auprès d'Orange Money en utilisant l'endpoint officiel.

**Endpoint:** `GET /orange-money/verify-transaction/:transactionId`

**Paramètres:**
- `transactionId`: ID de la transaction OU la référence (ex: `TXN-123456` ou `OM-ORDER-123-1234567890`)

**Exemple de requête:**

```bash
GET http://localhost:3004/orange-money/verify-transaction/OM-ORDER-123-1234567890
```

**Réponse attendue (Paiement réussi):**
```json
{
  "success": true,
  "transactionId": "OM-ORDER-123-1234567890",
  "status": "SUCCESS",
  "amount": 10000,
  "reference": "OM-ORDER-123-1234567890",
  "timestamp": "2026-02-23T10:30:45Z",
  "isPaid": true,
  "message": "Transaction paid successfully"
}
```

**Réponse attendue (Paiement échoué):**
```json
{
  "success": true,
  "transactionId": "OM-ORDER-123-1234567890",
  "status": "FAILED",
  "amount": 10000,
  "reference": "OM-ORDER-123-1234567890",
  "timestamp": "2026-02-23T10:35:00Z",
  "isPaid": false,
  "message": "Transaction status: FAILED"
}
```

**Réponse attendue (Transaction introuvable):**
```json
{
  "success": false,
  "transactionId": "INVALID-123",
  "error": "Transaction not found",
  "message": "Failed to verify transaction status"
}
```

---

### 3. **GET /orange-money/check-payment/:orderNumber** - Vérifier si une commande est payée (NOUVEAU)

Vérifie si une commande a été payée avec succès en interrogeant Orange Money.
**Met à jour automatiquement la base de données** si le statut a changé.

**Endpoint:** `GET /orange-money/check-payment/:orderNumber`

**Paramètres:**
- `orderNumber`: Numéro de la commande (ex: `ORD-12345`)

**Exemple de requête:**

```bash
GET http://localhost:3004/orange-money/check-payment/ORD-12345
```

**Réponse attendue (Commande payée):**
```json
{
  "success": true,
  "orderNumber": "ORD-12345",
  "isPaid": true,
  "transactionStatus": "SUCCESS",
  "transactionId": "TXN-123456",
  "amount": 10000,
  "message": "Order ORD-12345 has been paid successfully"
}
```

**Réponse attendue (Commande non payée):**
```json
{
  "success": true,
  "orderNumber": "ORD-12345",
  "isPaid": false,
  "transactionStatus": "PENDING",
  "transactionId": "TXN-123456",
  "amount": 10000,
  "message": "Order ORD-12345 payment is PENDING"
}
```

**Réponse attendue (Commande introuvable):**
```json
{
  "success": false,
  "orderNumber": "INVALID-ORDER",
  "isPaid": false,
  "error": "Order INVALID-ORDER not found"
}
```

---

## Scénarios de Test Complets

### Scénario 1: Vérifier si une commande a été payée

**Objectif:** Vérifier si le client a bien payé sa commande avec Orange Money.

**Étapes:**

1. **Créer une commande de test:**
```bash
POST http://localhost:3004/orders
Content-Type: application/json

{
  "items": [
    {
      "name": "Test Product",
      "quantity": 1,
      "price": 10000
    }
  ],
  "totalAmount": 10000,
  "paymentMethod": "ORANGE_MONEY",
  "customerInfo": {
    "name": "Jean Dupont",
    "phone": "771234567",
    "email": "jean@example.com"
  }
}
```

**Réponse:** Note le `orderNumber` (ex: `ORD-12345`) et le `reference` (ex: `OM-ORD-12345-1234567890`)

2. **Simuler un paiement réussi (mode test):**
```bash
POST http://localhost:3004/orange-money/test-callback-success
Content-Type: application/json

{
  "orderNumber": "ORD-12345",
  "transactionId": "TXN-TEST-SUCCESS-123"
}
```

3. **Vérifier si la commande est payée:**
```bash
GET http://localhost:3004/orange-money/check-payment/ORD-12345
```

**Résultat attendu:**
```json
{
  "success": true,
  "orderNumber": "ORD-12345",
  "isPaid": true,
  "transactionStatus": "SUCCESS",
  "message": "Order ORD-12345 has been paid successfully"
}
```

---

### Scénario 2: Réconciliation automatique (callback manquant)

**Objectif:** Récupérer le statut d'une transaction quand le callback n'a pas été reçu.

**Contexte:**
- Le client a payé avec Orange Money
- Le callback webhook n'a jamais atteint votre serveur
- La commande est toujours en statut PENDING dans votre DB

**Étapes:**

1. **Vérifier le statut de la transaction directement auprès d'Orange Money:**
```bash
GET http://localhost:3004/orange-money/verify-transaction/OM-ORD-12345-1234567890
```

2. **Si le statut est SUCCESS, la méthode va automatiquement mettre à jour la BDD**

3. **Confirmer que la commande a été mise à jour:**
```bash
GET http://localhost:3004/orange-money/check-payment/ORD-12345
```

---

### Scénario 3: Consulter l'historique des transactions

**Objectif:** Voir toutes les transactions Orange Money du dernier mois.

**Étapes:**

1. **Récupérer toutes les transactions réussies:**
```bash
GET http://localhost:3004/orange-money/transactions?status=SUCCESS&limit=50
```

2. **Filtrer par période:**
```bash
GET http://localhost:3004/orange-money/transactions?startDate=2026-02-01&endDate=2026-02-28
```

3. **Pagination:**
```bash
# Page 1 (résultats 0-9)
GET http://localhost:3004/orange-money/transactions?limit=10&offset=0

# Page 2 (résultats 10-19)
GET http://localhost:3004/orange-money/transactions?limit=10&offset=10
```

---

## Endpoints Existants (Inchangés)

Les endpoints suivants restent disponibles :

- `GET /orange-money/test-connection` - Tester la connexion
- `POST /orange-money/register-callback` - Enregistrer l'URL de callback
- `GET /orange-money/verify-callback` - Vérifier l'URL de callback enregistrée
- `POST /orange-money/payment` - Générer un paiement (QR + deeplinks)
- `POST /orange-money/callback` - Webhook pour recevoir les notifications
- `GET /orange-money/payment-status/:orderNumber` - Statut depuis la BDD
- `POST /orange-money/test-callback-success` - Simuler un callback SUCCESS
- `POST /orange-money/test-callback-failed` - Simuler un callback FAILED
- `POST /orange-money/cancel-payment/:orderNumber` - Annuler un paiement

---

## Tableau Récapitulatif des Statuts Orange Money

| Statut      | Description                                        | isPaid | Action à prendre                       |
|-------------|----------------------------------------------------|--------|----------------------------------------|
| `SUCCESS`   | Paiement réussi                                   | ✅ true | Marquer la commande comme PAID         |
| `FAILED`    | Paiement échoué (fonds insuffisants, etc.)        | ❌ false | Marquer comme FAILED, notifier client  |
| `PENDING`   | En attente de confirmation du client              | ❌ false | Attendre ou vérifier périodiquement    |
| `CANCELLED` | Annulé par le client ou timeout                   | ❌ false | Marquer comme CANCELLED                |

---

## Tests en Production

### ⚠️ Avant de tester en production:

1. **Vérifier la configuration:**
```bash
GET http://localhost:3004/orange-money/test-connection
```

Réponse attendue:
```json
{
  "success": true,
  "mode": "production",
  "source": "environment",
  "tokenObtained": true
}
```

2. **Vérifier que le callback est enregistré:**
```bash
GET http://localhost:3004/orange-money/verify-callback
```

Réponse attendue:
```json
{
  "success": true,
  "data": {
    "code": "599241",
    "name": "Printalma B2C Payment Callback",
    "callbackUrl": "https://printalma-back-dep.onrender.com/orange-money/callback"
  },
  "merchantCode": "599241",
  "mode": "production"
}
```

---

## Logs à Surveiller

Pour chaque requête, surveiller les logs backend :

```bash
# Logs de vérification de transaction
🔍 Vérification du statut de la transaction: OM-ORDER-123-...
   Mode: PRODUCTION
   URL: https://api.orange-sonatel.com/api/eWallet/v4/transactions/.../status
✅ Statut de la transaction récupéré:
   {"status":"SUCCESS","amount":{"value":10000,"unit":"XOF"},...}

# Logs de vérification de paiement
💰 Vérification du paiement pour la commande: ORD-12345
   Statut BDD actuel: PENDING
   Transaction ID: OM-ORD-12345-1234567890
🔄 Vérification du statut auprès d'Orange Money...
   Statut Orange Money: SUCCESS
   Payé: OUI ✅
🔄 Mise à jour du statut en base de données...
✅ Commande ORD-12345 mise à jour → PAID
```

---

## Dépannage

### Problème: "Transaction not found"

**Causes possibles:**
- Transaction ID invalide
- Transaction trop ancienne (hors de la fenêtre de rétention Orange Money)
- Mauvais environnement (test vs production)

**Solution:**
- Vérifier que le transactionId existe dans la BDD
- Vérifier le mode (test/production) dans les variables d'environnement

### Problème: "Transaction verification API not available"

**Cause:** L'API de vérification peut ne pas être disponible selon votre contrat.

**Solution:**
- Contacter le support Orange Money: partenaires.orangemoney@orange-sonatel.com
- Utiliser uniquement les callbacks webhook

---

## Support

**Documentation Orange Money:**
- https://developer.orange-sonatel.com/documentation

**Support technique:**
- Email: partenaires.orangemoney@orange-sonatel.com

**Votre backend:**
- Backend URL: https://printalma-back-dep.onrender.com
- Frontend URL: https://printalma-website-dep.onrender.com
