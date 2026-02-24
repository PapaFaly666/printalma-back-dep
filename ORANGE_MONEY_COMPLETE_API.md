# Orange Money - API Complète (v2)

**Date:** 2026-02-24
**Statut:** ✅ Implémentation complète avec endpoints de transaction
**Version:** 2.0 - Avec API v1 transaction search

---

## ✅ Tous les Endpoints Disponibles (12 endpoints)

### Endpoints de Base (9 endpoints - implémentés précédemment)

1. **GET /orange-money/test-connection** - Test connexion OAuth2
2. **POST /orange-money/register-callback** - Configuration callback
3. **GET /orange-money/verify-callback** - Vérification callback
4. **POST /orange-money/payment** - Génération QR/Deeplinks
5. **POST /orange-money/callback** - Webhook Orange Money
6. **GET /orange-money/payment-status/:orderNumber** - Polling BDD locale
7. **POST /orange-money/test-callback-success** - Test callback SUCCESS
8. **POST /orange-money/test-callback-failed** - Test callback FAILED
9. **POST /orange-money/cancel-payment/:orderNumber** - Annulation manuelle

### Nouveaux Endpoints Transaction Search (3 endpoints - API v1)

10. **GET /orange-money/transactions** - Liste des transactions
11. **GET /orange-money/verify-transaction/:transactionId** - Statut d'une transaction
12. **GET /orange-money/check-payment/:orderNumber** - Vérification + Réconciliation

---

## 🆕 Nouveaux Endpoints (API v1)

### 1. GET /orange-money/transactions

Liste toutes les transactions depuis Orange Money.

**Appelle l'API Orange Money:** `GET /api/eWallet/v1/transactions`

**Query Parameters (tous optionnels):**

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `fromDateTime` | string (ISO 8601) | Date de début | `2026-02-01T00:00:00Z` |
| `toDateTime` | string (ISO 8601) | Date de fin | `2026-02-24T23:59:59Z` |
| `status` | string | SUCCESS, FAILED, PENDING, CANCELLED | `SUCCESS` |
| `type` | string | MERCHANT_PAYMENT, CASHIN | `MERCHANT_PAYMENT` |
| `transactionId` | string | ID de transaction spécifique | `MP260223.0012.B07597` |
| `reference` | string | Référence externe (votre orderNumber) | `OM-ORD-12345-...` |
| `page` | number | Numéro de page (défaut: 0) | `0` |
| `size` | number | Taille de page (défaut: 20, max: 500) | `50` |

**Exemple:**
```bash
GET /orange-money/transactions?status=SUCCESS&size=10
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "transactionId": "MP260223.0012.B07597",
      "status": "SUCCESS",
      "type": "MERCHANT_PAYMENT",
      "amount": {
        "value": 200.0,
        "unit": "XOF"
      },
      "reference": "OM-ORD-1771805528447-1771805532258",
      "metadata": {
        "orderNumber": "ORD-1771805528447",
        "orderId": "214",
        "customerName": "Papa Faly Sidy"
      },
      "partner": {
        "id": "599241",
        "idType": "CODE",
        "walletType": "PRINCIPAL"
      },
      "customer": {
        "id": "775588834",
        "idType": "MSISDN",
        "walletType": "PRINCIPAL"
      },
      "createdAt": "2026-02-23T00:12:33.120Z",
      "updatedAt": "2026-02-23T00:12:39.331Z",
      "channel": "mobileOM"
    }
  ],
  "page": 0,
  "size": 10,
  "total": 1
}
```

**Cas d'usage:**
- Audit des transactions
- Rapports financiers
- Réconciliation comptable
- Recherche d'une transaction spécifique

---

### 2. GET /orange-money/verify-transaction/:transactionId

Vérifie le statut d'une transaction spécifique auprès d'Orange Money.

**Appelle l'API Orange Money:** `GET /api/eWallet/v1/transactions/{transactionId}/status`

**Path Parameter:**
- `transactionId` - ID de la transaction Orange Money (ex: `MP260223.0012.B07597`)

**Exemple:**
```bash
GET /orange-money/verify-transaction/MP260223.0012.B07597
```

**Réponse (SUCCESS):**
```json
{
  "success": true,
  "transactionId": "MP260223.0012.B07597",
  "status": "SUCCESS",
  "data": {
    "status": "SUCCESS"
  }
}
```

**Réponse (FAILED):**
```json
{
  "success": true,
  "transactionId": "MP260223.1555.B64193",
  "status": "FAILED",
  "data": {
    "status": "FAILED"
  }
}
```

**Cas d'usage:**
- Vérifier le statut d'une transaction sans webhook
- Récupération après panne du webhook
- Vérification manuelle par l'admin

---

### 3. GET /orange-money/check-payment/:orderNumber

**⭐ ENDPOINT PRINCIPAL DE RÉCONCILIATION**

Vérifie si une commande a été payée ET réconcilie automatiquement la BDD si nécessaire.

**Fonctionnement:**
1. Lit l'état de la commande dans votre BDD
2. Vérifie le statut réel auprès d'Orange Money (via transactionId)
3. **Réconcilie automatiquement** si les statuts diffèrent
4. Met à jour la BDD si nécessaire

**Path Parameter:**
- `orderNumber` - Numéro de commande (ex: `ORD-12345`)

**Exemple:**
```bash
GET /orange-money/check-payment/ORD-1771805528447
```

**Réponse (Déjà synchronisé):**
```json
{
  "success": true,
  "orderNumber": "ORD-1771805528447",
  "paymentStatus": "PAID",
  "transactionId": "OM-ORD-1771805528447-1771805532258",
  "orangeMoneyStatus": "SUCCESS",
  "reconciled": false,
  "message": "Status synchronized"
}
```

**Réponse (Réconciliation effectuée):**
```json
{
  "success": true,
  "orderNumber": "ORD-1771805528447",
  "paymentStatus": "PAID",
  "transactionId": "OM-ORD-1771805528447-1771805532258",
  "orangeMoneyStatus": "SUCCESS",
  "reconciled": true,
  "message": "Payment status reconciled: Orange Money reported SUCCESS"
}
```

**Cas d'usage:**
- **Réconciliation après panne webhook**
- Synchronisation manuelle par l'admin
- Vérification après timeout de polling
- Récupération de paiements "perdus"
- Audit de cohérence BDD ↔ Orange Money

**Scénarios de réconciliation:**

| BDD Status | Orange Status | Action | Résultat BDD |
|------------|---------------|--------|--------------|
| PENDING | SUCCESS | ✅ Réconciliation | PAID |
| PENDING | FAILED | ✅ Réconciliation | FAILED |
| PAID | SUCCESS | ⚪ Aucune action | PAID |
| FAILED | FAILED | ⚪ Aucune action | FAILED |

---

## 🔄 Flux de Paiement Complet (avec réconciliation)

```
1. Client demande à payer
   ↓
2. Backend génère QR + Deeplinks (POST /orange-money/payment)
   → Sauvegarde transactionId = "OM-ORD-12345-..."
   ↓
3. Client paie via MAX IT ou Orange Money app
   ↓
4a. FLUX NORMAL (webhook reçu)
   Orange Money → POST /orange-money/callback
   → Backend met à jour Order.paymentStatus = PAID
   → Frontend détecte via polling (GET /payment-status/:orderNumber)
   ↓
4b. FLUX DE SECOURS (webhook manquant)
   Frontend timeout après 5 minutes
   → Admin exécute: GET /orange-money/check-payment/:orderNumber
   → Backend vérifie auprès d'Orange Money
   → Réconciliation automatique si payé
   ↓
5. Redirection vers page de confirmation
```

---

## 📊 API Orange Money (Endpoints Réels)

### Endpoints v4 (QR Code et Callback)

1. **POST /oauth/token** - Authentification OAuth2
2. **POST /api/eWallet/v4/qrcode** - Génération QR + Deeplinks
3. **POST /api/notification/v1/merchantcallback** - Configuration callback
4. **GET /api/notification/v1/merchantcallback?code={code}** - Vérification callback

### Endpoints v1 (Transaction Search)

5. **GET /api/eWallet/v1/transactions** - Liste des transactions
6. **GET /api/eWallet/v1/transactions/{transactionId}/status** - Statut d'une transaction

---

## 🔧 Configuration

### Variables d'environnement

```env
# Credentials Orange Money
ORANGE_CLIENT_ID=b0c8057b-a23d-4284-886c-7508590e1f63
ORANGE_CLIENT_SECRET=7041e608-a3ab-45f3-b797-1b0330a52b66
ORANGE_MERCHANT_CODE=599241
ORANGE_MODE=production  # ou sandbox

# URLs
BACKEND_URL=https://printalma-back-dep.onrender.com
FRONTEND_URL=https://printalma-website-dep.onrender.com

# Callback API Key (optionnel)
ORANGE_CALLBACK_API_KEY=votre_cle_secrete
```

---

## 🧪 Tests

### Script de test automatique

```bash
# Tester tous les nouveaux endpoints
bash test-om-new-endpoints.sh
```

### Tests manuels

**1. Liste des transactions SUCCESS:**
```bash
curl "http://localhost:3000/orange-money/transactions?status=SUCCESS&size=5"
```

**2. Vérifier une transaction:**
```bash
curl "http://localhost:3000/orange-money/verify-transaction/MP260223.0012.B07597"
```

**3. Réconcilier une commande:**
```bash
curl "http://localhost:3000/orange-money/check-payment/ORD-1771805528447"
```

**4. Filtrer par période:**
```bash
curl "http://localhost:3000/orange-money/transactions?fromDateTime=2026-02-23T00:00:00Z&toDateTime=2026-02-24T23:59:59Z"
```

**5. Rechercher par référence:**
```bash
curl "http://localhost:3000/orange-money/transactions?reference=OM-ORD-12345"
```

---

## 📝 Différences API v1 vs v4

| Fonctionnalité | Version | Endpoint |
|----------------|---------|----------|
| Génération QR/Deeplinks | v4 | POST /api/eWallet/v4/qrcode |
| Configuration callback | v1 | POST /api/notification/v1/merchantcallback |
| Liste des transactions | v1 | GET /api/eWallet/v1/transactions |
| Statut transaction | v1 | GET /api/eWallet/v1/transactions/{id}/status |

**Note:** Les versions sont gérées automatiquement par le service.

---

## ⚠️ Notes Importantes

### 1. Idempotence

Les méthodes de réconciliation sont idempotentes:
- Appeler plusieurs fois `checkIfOrderIsPaid()` est sûr
- La BDD est mise à jour uniquement si nécessaire

### 2. Sécurité

- Tous les endpoints nécessitent l'authentification OAuth2
- Le token est automatiquement rafraîchi avant expiration
- Les erreurs ne révèlent pas d'informations sensibles

### 3. Performance

- `getAllTransactions()` peut retourner jusqu'à 500 transactions par page
- Utilisez les filtres pour limiter les résultats
- Le token est mis en cache (5 minutes)

### 4. Limites Rate Limiting

**Sandbox:** 60 requêtes/minute
**Production:** Voir votre contrat Orange Money

---

## 🎯 Cas d'Usage Avancés

### 1. Réconciliation Nocturne Automatique

```typescript
// Cron job qui réconcilie toutes les commandes PENDING
async reconcileAllPendingOrders() {
  const pendingOrders = await this.prisma.order.findMany({
    where: {
      paymentStatus: 'PENDING',
      paymentMethod: 'ORANGE_MONEY',
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // > 24h
    }
  });

  for (const order of pendingOrders) {
    await this.orangeMoneyService.checkIfOrderIsPaid(order.orderNumber);
  }
}
```

### 2. Rapport Financier Quotidien

```typescript
// Récupère toutes les transactions SUCCESS du jour
async getDailyReport() {
  const today = new Date().toISOString().split('T')[0];

  return await this.orangeMoneyService.getAllTransactions({
    fromDateTime: `${today}T00:00:00Z`,
    toDateTime: `${today}T23:59:59Z`,
    status: 'SUCCESS',
    size: 500
  });
}
```

### 3. Recherche de Transaction par Commande

```typescript
// Trouve la transaction Orange Money pour une commande
async findTransactionByOrder(orderNumber: string) {
  return await this.orangeMoneyService.getAllTransactions({
    reference: `OM-${orderNumber}`,
    size: 1
  });
}
```

---

## 📚 Résumé des Fichiers

### Code Source

- `src/orange-money/orange-money.service.ts` - 3 nouvelles méthodes ajoutées
- `src/orange-money/orange-money.controller.ts` - 3 nouveaux endpoints ajoutés

### Documentation

- `ORANGE_MONEY_COMPLETE_API.md` ⭐ - Ce fichier (documentation complète)
- `TRANSACTION_ENDPOINTS_TEST_RESULTS.md` - Résultats des tests v1
- `ORANGE_MONEY_FINAL.md` - Documentation v1 (9 endpoints de base)
- `ORANGE_MONEY_DEEPLINK_CALLBACK_GUIDE.md` - Guide deeplinks + callbacks
- `ORANGE_MONEY_API_INVESTIGATION.md` - Investigation et découverte v1 vs v4
- `CHANGELOG_ORANGE_MONEY.md` - Historique des changements

### Tests

- `test-om-new-endpoints.sh` - Script de test des 3 nouveaux endpoints
- `test-om-quick.sh` - Script de test rapide (9 endpoints de base)

---

## ✅ Validation Finale

### Endpoints Backend: 12 ✅

**Base (9):**
- ✅ Test connexion
- ✅ Register callback
- ✅ Verify callback
- ✅ Generate payment
- ✅ Receive callback webhook
- ✅ Get payment status (DB)
- ✅ Test callback success
- ✅ Test callback failed
- ✅ Cancel payment (DB)

**Transaction Search (3):**
- ✅ Get all transactions
- ✅ Verify transaction status
- ✅ Check payment + reconciliation

### Endpoints Orange Money: 6 ✅

**v4:**
- ✅ POST /oauth/token
- ✅ POST /api/eWallet/v4/qrcode
- ✅ POST /api/notification/v1/merchantcallback
- ✅ GET /api/notification/v1/merchantcallback?code={code}

**v1:**
- ✅ GET /api/eWallet/v1/transactions
- ✅ GET /api/eWallet/v1/transactions/{transactionId}/status

---

## 🚀 Prochaines Étapes

1. ✅ **Démarrer le serveur:**
   ```bash
   npm run start:dev
   ```

2. ✅ **Tester les nouveaux endpoints:**
   ```bash
   bash test-om-new-endpoints.sh
   ```

3. ✅ **Implémenter la réconciliation automatique (optionnel):**
   - Cron job quotidien
   - Réconciliation des commandes > 24h

4. ✅ **Configurer les rapports financiers (optionnel):**
   - Export CSV des transactions
   - Dashboard admin avec statistiques

---

## 📞 Support

**Email:** partenaires.orangemoney@orange-sonatel.com
**Documentation:** https://developer.orange-sonatel.com/documentation
**Portail:** https://developer.orange-sonatel.com/

---

**✅ API COMPLÈTE - 12 ENDPOINTS - PRÊT POUR LA PRODUCTION**
