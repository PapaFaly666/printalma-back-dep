# 🎯 TEST RÉEL PAYDUNYA - Commande 775588834

**Date:** 05/11/2025 18:13 UTC
**Environnement:** TEST/Sandbox PayDunya
**Téléphone client:** +221775588834

---

## ✅ COMMANDE CRÉÉE

### 📦 Informations de la commande

- **ID:** 87
- **Numéro:** ORD-1762366423948
- **Montant:** 5,000 FCFA
- **Client:** Client Test
- **Téléphone:** +221775588834
- **Email:** client@test.com
- **Adresse:** Rue de la Paix, Dakar, 12000, Sénégal
- **Article:** 1x Tshirt Blanc (M) - 5,000 FCFA

### 💳 Informations de paiement

- **Token PayDunya:** test_GzRMdpCUqF
- **Mode:** TEST (Sandbox)
- **Statut initial:** PENDING

---

## 🌐 URL DE PAIEMENT

### ⚠️ URL CORRECTE À UTILISER:

```
https://app.paydunya.com/sandbox-checkout/invoice/test_GzRMdpCUqF
```

**Note:** Le système a généré l'URL avec `paydunya.com` mais la version correcte utilise `app.paydunya.com`

---

## 📋 INSTRUCTIONS POUR LE TEST

### Étape 1: Accéder à la page de paiement

1. **Copiez l'URL ci-dessus** dans votre navigateur
2. Vous serez redirigé vers la page de paiement PayDunya (environnement de test)
3. La page affichera les détails de la commande (montant: 5,000 FCFA)

### Étape 2: Choisir une méthode de paiement de test

PayDunya Sandbox propose plusieurs méthodes de paiement de test :

#### 📱 ORANGE MONEY (Test)
```
Numéro: 221777000000
Code secret: 123456
```
**Résultat:** Paiement réussi ✅

#### 💳 CARTE VISA (Succès)
```
Numéro de carte: 4000000000000002
Date d'expiration: 12/25
CVV: 123
```
**Résultat:** Paiement réussi ✅

#### 💳 CARTE VISA (Échec - pour tester les erreurs)
```
Numéro de carte: 4000000000000010
Date d'expiration: 12/25
CVV: 123
```
**Résultat:** Paiement échoué ❌ (pour tester la gestion des erreurs)

#### 💰 WAVE (Test)
```
Numéro: 221700000000
```
**Résultat:** Paiement réussi ✅

### Étape 3: Effectuer le paiement

1. Sélectionnez une des méthodes ci-dessus
2. Entrez les informations de test
3. Validez le paiement
4. **Attendez la confirmation**

### Étape 4: Vérification automatique

Le système va automatiquement :

1. ✅ Recevoir le webhook de PayDunya sur: `http://localhost:3004/paydunya/webhook`
2. ✅ Vérifier l'authenticité du webhook
3. ✅ Mettre à jour le statut de la commande: PENDING → CONFIRMED
4. ✅ Mettre à jour le statut du paiement: PENDING → PAID
5. ✅ Enregistrer la transaction ID
6. ✅ Rediriger vers la page de confirmation

---

## 🔍 SURVEILLANCE DU PAIEMENT

### Option 1: Surveillance automatique en temps réel

Lancez le script de monitoring dans un terminal :

```bash
node monitor-payment.js
```

Ce script va :
- Vérifier le statut toutes les 5 secondes
- Afficher les changements en temps réel
- S'arrêter automatiquement quand le paiement est confirmé
- Vous notifier immédiatement de tout changement

### Option 2: Vérification manuelle

Vérifiez manuellement le statut avec :

```bash
node check-order-status.js 87
```

Ou directement dans la base de données :

```javascript
const order = await prisma.order.findUnique({
  where: { id: 87 },
  select: {
    orderNumber: true,
    status: true,
    paymentStatus: true,
    transactionId: true,
    paymentAttempts: true
  }
});
```

---

## 🎯 RÉSULTATS ATTENDUS

### Après un paiement réussi:

```json
{
  "id": 87,
  "orderNumber": "ORD-1762366423948",
  "status": "CONFIRMED",  // ← Changé de PENDING
  "paymentStatus": "PAID", // ← Changé de PENDING
  "transactionId": "test_GzRMdpCUqF",
  "paymentAttempts": 1,
  "lastPaymentAttemptAt": "[timestamp]"
}
```

### Après un paiement échoué:

```json
{
  "id": 87,
  "orderNumber": "ORD-1762366423948",
  "status": "PENDING",
  "paymentStatus": "FAILED",  // ← Changé à FAILED
  "transactionId": null,
  "paymentAttempts": 1,
  "lastPaymentFailureReason": "[reason]",
  "hasInsufficientFunds": false // ou true selon la raison
}
```

---

## 🔄 REDIRECTIONS

### Succès:
```
http://localhost:3004/paydunya/payment/success?token=test_GzRMdpCUqF
```
Affiche une page HTML de confirmation avec les détails du paiement

### Annulation:
```
http://localhost:3004/paydunya/payment/cancel?token=test_GzRMdpCUqF
```
Affiche une page HTML d'annulation

---

## 📊 WEBHOOK REÇU

Le webhook PayDunya sera envoyé automatiquement à:
```
POST http://localhost:3004/paydunya/webhook
```

### Contenu du webhook (succès):

```json
{
  "invoice_token": "test_GzRMdpCUqF",
  "status": "completed",
  "custom_data": {
    "orderNumber": "ORD-1762366423948",
    "orderId": 87
  },
  "total_amount": 5000,
  "payment_method": "orange_money",
  "customer_name": "Client Test",
  "customer_email": "client@test.com",
  "customer_phone": "+221775588834"
}
```

### Réponse du webhook:

```json
{
  "success": true,
  "message": "PayDunya webhook processed successfully",
  "data": {
    "invoice_token": "test_GzRMdpCUqF",
    "order_number": "ORD-1762366423948",
    "payment_status": "success",
    "status_updated": true,
    "failure_details": null
  }
}
```

---

## 🛠️ COMMANDES UTILES

### Démarrer la surveillance
```bash
node monitor-payment.js
```

### Vérifier le statut
```bash
node check-order-status.js 87
```

### Simuler un webhook (pour tester sans payer)
```bash
curl -X POST http://localhost:3004/paydunya/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "invoice_token": "test_GzRMdpCUqF",
    "status": "completed",
    "custom_data": "{\"orderNumber\":\"ORD-1762366423948\",\"orderId\":87}",
    "total_amount": 5000,
    "payment_method": "orange_money"
  }'
```

### Voir les logs du serveur
```bash
tail -f server.log | grep -E "PayDunya|webhook|ORD-1762366423948"
```

---

## ✅ CHECKLIST DE TEST

- [ ] URL de paiement copiée et ouverte dans le navigateur
- [ ] Page PayDunya chargée correctement
- [ ] Méthode de paiement sélectionnée (Orange Money / Visa / Wave)
- [ ] Informations de test saisies
- [ ] Paiement validé
- [ ] Redirection vers page de confirmation
- [ ] Webhook reçu (vérifier logs)
- [ ] Statut commande mis à jour (PENDING → CONFIRMED)
- [ ] Statut paiement mis à jour (PENDING → PAID)
- [ ] Transaction ID enregistré
- [ ] Compteur de tentatives incrémenté

---

## 🚨 DÉPANNAGE

### Le webhook n'est pas reçu

**Causes possibles:**
1. Le serveur n'est pas accessible publiquement (localhost)
2. PayDunya Sandbox ne peut pas atteindre localhost

**Solutions:**
- Utiliser ngrok pour exposer localhost: `ngrok http 3004`
- Simuler manuellement le webhook (voir commandes ci-dessus)
- Vérifier les logs PayDunya dans le dashboard

### Le statut ne change pas

**Vérifications:**
1. Serveur est démarré: `ps aux | grep node`
2. Base de données accessible
3. Webhook endpoint fonctionnel: `curl http://localhost:3004/paydunya/test-config`
4. Logs du serveur: `tail -f server.log`

### Erreur de paiement

**Informations de test correctes:**
- Orange Money: 221777000000 / 123456
- Visa succès: 4000000000000002
- Dates et CVV corrects

---

## 📚 DOCUMENTATION

- **PayDunya Docs:** https://developers.paydunya.com/doc/FR/introduction
- **Dashboard Test:** https://app.paydunya.com/dashboard
- **API Reference:** https://developers.paydunya.com/doc/FR/api-reference

---

## 📝 NOTES

1. **Mode TEST:** Tous les paiements sont simulés, aucun argent réel n'est débité
2. **Données de test:** Utilisez uniquement les numéros/cartes de test fournis
3. **Webhook local:** En local, le webhook peut nécessiter une simulation manuelle
4. **Production:** En production, configurez des URLs HTTPS publiques

---

**Test créé le:** 05/11/2025 18:13
**Commande:** ORD-1762366423948
**Token:** test_GzRMdpCUqF
**Montant:** 5,000 FCFA
**Client:** +221775588834
