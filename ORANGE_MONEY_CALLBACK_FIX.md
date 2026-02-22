# Corrections du Callback Orange Money

## Problèmes identifiés

1. ❌ **Pas de `transactionId` dans Order** lors de la création du paiement
2. ❌ **Pas de redirection** si le client a déjà payé
3. ❌ **URLs de callback frontend uniquement** - pas de webhook backend

## Solutions implémentées

### 1. Sauvegarde du transactionId dès la génération du QR Code

**Fichier:** `src/orange-money/orange-money.service.ts`

**Modification dans `generatePayment()`:**
```typescript
// 🆕 Sauvegarder la référence dans transactionId pour la traçabilité (comme PayDunya)
await this.prisma.order.update({
  where: { id: dto.orderId },
  data: {
    transactionId: reference,
    paymentMethod: 'ORANGE_MONEY'
  }
});
```

**Résultat:**
- ✅ La référence `OM-{orderNumber}-{timestamp}` est maintenant sauvegardée dans `Order.transactionId`
- ✅ Permet la traçabilité et la synchronisation comme avec PayDunya
- ✅ La méthode de paiement est enregistrée dès la création

---

### 2. URL de notification webhook backend

**Fichier:** `src/orange-money/orange-money.service.ts`

**Modification dans le payload QR Code:**
```typescript
const payload = {
  amount: { unit: 'XOF', value: dto.amount },
  // URLs de redirection pour l'utilisateur (frontend)
  callbackCancelUrl: `${FRONTEND_URL}/order-confirmation?orderNumber=${dto.orderNumber}&status=cancelled&paymentMethod=orange-money`,
  callbackSuccessUrl: `${FRONTEND_URL}/order-confirmation?orderNumber=${dto.orderNumber}&status=success&paymentMethod=orange-money`,
  // 🆕 URL de notification pour le webhook backend
  notificationUrl: `${BACKEND_URL}/orange-money/callback`,
  code: merchantCode,
  metadata: {
    orderId: dto.orderId.toString(),
    orderNumber: dto.orderNumber,
    customerName: dto.customerName,
  },
  name: 'Printalma B2C',
  reference,
  validity: 600,
};
```

**Résultat:**
- ✅ `callbackSuccessUrl` et `callbackCancelUrl`: redirections frontend pour l'utilisateur
- ✅ `notificationUrl`: webhook backend pour mettre à jour la commande
- ✅ Orange Money enverra la notification au backend même si l'utilisateur ferme l'app

---

### 3. Détection et redirection automatique si déjà payé

**Fichier:** `src/orange-money/orange-money.service.ts`

**Modification dans `getPaymentStatus()`:**
```typescript
// 🆕 Si le paiement est déjà effectué, indiquer qu'une redirection est nécessaire
if (order.paymentStatus === 'PAID') {
  const FRONTEND_URL = this.configService.get<string>('FRONTEND_URL') || 'https://printalma-website-dep.onrender.com';

  this.logger.log(`💰 Commande ${orderNumber} déjà payée - Redirection nécessaire`);

  response.shouldRedirect = true;
  response.redirectUrl = `${FRONTEND_URL}/order-confirmation?orderNumber=${orderNumber}&status=success&paymentMethod=orange-money`;
  response.message = 'Cette commande a déjà été payée avec succès';
}
```

**Résultat:**
- ✅ L'endpoint `/orange-money/payment-status/:orderNumber` retourne `shouldRedirect: true` si déjà payé
- ✅ Inclut l'URL de redirection dans la réponse
- ✅ Le frontend peut rediriger automatiquement l'utilisateur vers la page de confirmation

---

### 4. Logs améliorés pour le débogage

**Fichier:** `src/orange-money/orange-money.service.ts`

**Amélioration dans `handleCallback()`:**
- Extraction intelligente du `orderNumber` depuis plusieurs sources
- Logs détaillés à chaque étape
- Détection d'idempotence avec logs explicites
- Messages clairs pour chaque statut (SUCCESS, FAILED, CANCELLED)
- Logs d'erreur avec contexte complet

**Exemple de logs:**
```
========== TRAITEMENT CALLBACK ORANGE MONEY ==========
📦 Payload reçu: {...}
🔍 Données extraites du callback:
   - Status: SUCCESS
   - TransactionId: TXN_123456
   - Reference: OM-ORD-12345-1234567890
   - Code marchand: PRINTALMA001
   - Amount: 10000 XOF
   - Metadata: {"orderNumber":"ORD-12345"}
🔎 Recherche de la commande: ORD-12345
✅ Commande trouvée:
   - ID: 123
   - Numéro: ORD-12345
   - Statut paiement actuel: PENDING
   - Transaction ID actuel: OM-ORD-12345-1234567890
   - Méthode de paiement: ORANGE_MONEY
   - Montant total: 10000 FCFA
💰 PAIEMENT RÉUSSI - Mise à jour de la commande en PAYÉE...
✅✅✅ SUCCÈS: Commande ORD-12345 marquée comme PAYÉE
   - Nouveau statut: PAID
   - Transaction ID enregistrée: TXN_123456
   - Montant payé: 10000 XOF
   - Code marchand: PRINTALMA001
   - Timestamp: 2025-01-15T10:30:45.123Z
========== FIN TRAITEMENT CALLBACK ==========
```

---

## Comparaison avec PayDunya

| Fonctionnalité | PayDunya | Orange Money (avant) | Orange Money (après) |
|----------------|----------|---------------------|---------------------|
| TransactionId sauvegardé à la création | ✅ Oui | ❌ Non | ✅ Oui |
| Webhook backend | ✅ Oui | ❌ Non (frontend seulement) | ✅ Oui |
| Redirection si déjà payé | ✅ Oui | ❌ Non | ✅ Oui |
| Logs détaillés | ✅ Oui | ⚠️ Basique | ✅ Oui |
| Idempotence | ✅ Oui | ✅ Oui | ✅ Oui |
| PaymentAttempt | ✅ Oui | ❌ Non | ⚠️ À ajouter (futur) |

---

## Variables d'environnement requises

Ajoutez ces variables à votre `.env`:

```env
# Orange Money Configuration
ORANGE_CLIENT_ID=votre_client_id
ORANGE_CLIENT_SECRET=votre_client_secret
ORANGE_MERCHANT_CODE=PRINTALMA001
ORANGE_MODE=test  # ou production
ORANGE_CALLBACK_API_KEY=votre_api_key_secrete  # Pour valider les callbacks

# URLs (si non définies, utilise les valeurs par défaut)
BACKEND_URL=https://printalma-back-dep.onrender.com
FRONTEND_URL=https://printalma-website-dep.onrender.com
```

---

## Guide de test

### 1. Test manuel avec les scripts

Utilisez le script de test fourni:

```bash
# Tester un callback SUCCESS
bash test-orange-callback.sh ORD-12345 SUCCESS

# Tester un callback FAILED
bash test-orange-callback.sh ORD-12345 FAILED
```

### 2. Test via les endpoints de test

#### a) Tester un callback SUCCESS
```bash
POST http://localhost:3000/orange-money/test-callback-success
Content-Type: application/json

{
  "orderNumber": "ORD-12345",
  "transactionId": "TXN-TEST-123456"
}
```

#### b) Tester un callback FAILED
```bash
POST http://localhost:3000/orange-money/test-callback-failed
Content-Type: application/json

{
  "orderNumber": "ORD-12345"
}
```

### 3. Vérifier le statut de paiement

```bash
GET http://localhost:3000/orange-money/payment-status/ORD-12345
```

**Réponse si déjà payé:**
```json
{
  "success": true,
  "orderNumber": "ORD-12345",
  "paymentStatus": "PAID",
  "transactionId": "TXN-123456",
  "paymentMethod": "ORANGE_MONEY",
  "totalAmount": 10000,
  "orderStatus": "PENDING",
  "shouldRedirect": true,
  "redirectUrl": "https://printalma-website-dep.onrender.com/order-confirmation?orderNumber=ORD-12345&status=success&paymentMethod=orange-money",
  "message": "Cette commande a déjà été payée avec succès"
}
```

---

## Flux de paiement complet

### 1. Création d'une commande avec Orange Money

```
Frontend → POST /orders (paymentMethod: ORANGE_MONEY)
  ↓
Backend génère QR Code + Deeplinks
  ↓
Backend sauvegarde reference dans transactionId ✅ NOUVEAU
  ↓
Frontend affiche QR Code / Deeplinks
```

### 2. Paiement par l'utilisateur

```
Client scanne QR Code ou clique sur Deeplink
  ↓
Application Orange Money / MAX IT s'ouvre
  ↓
Client confirme le paiement
  ↓
Orange Money envoie notification → BACKEND webhook ✅ NOUVEAU
  ↓
Backend met à jour Order.paymentStatus = PAID
Backend enregistre transactionId Orange Money
  ↓
Orange Money redirige client → FRONTEND callback URL
```

### 3. Frontend vérifie le statut (polling)

```
Frontend → GET /orange-money/payment-status/:orderNumber
  ↓
Si shouldRedirect = true ✅ NOUVEAU
  ↓
Frontend redirige vers redirectUrl
  ↓
Page de confirmation affichée
```

---

## Prochaines améliorations

1. **PaymentAttempt** - Créer un enregistrement PaymentAttempt comme PayDunya pour la traçabilité
2. **Email de confirmation** - Envoyer un email au client après paiement réussi
3. **Email d'échec** - Notifier le client en cas d'échec de paiement
4. **Synchronisation** - Service cron pour vérifier les paiements en attente
5. **Dashboard admin** - Interface pour visualiser les paiements Orange Money

---

## Support

Pour toute question sur Orange Money:
- Documentation API: https://developer.orange-sonatel.com/
- Collection Postman: https://developer.orange-sonatel.com/qr-code

Pour les bugs ou suggestions:
- Créer une issue sur GitHub
- Vérifier les logs dans `logs/orange-money.log`
