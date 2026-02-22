# Guide de Test - Orange Money Callback

## 📋 Résumé des modifications

### 1. Nouveaux endpoints ajoutés au backend

- **POST `/orange-money/test-callback-success`** : Simule un callback SUCCESS d'Orange Money
- **POST `/orange-money/test-callback-failed`** : Simule un callback FAILED d'Orange Money
- **POST `/orange-money/callback`** : Endpoint réel pour recevoir les callbacks Orange Money (avec logs détaillés)
- **GET `/orange-money/payment-status/:orderNumber`** : Vérifie le statut de paiement d'une commande (pour polling)

### 2. Améliorations de sécurité et fiabilité

✅ **Vérification de l'apiKey** : Le callback vérifie maintenant l'apiKey envoyée par Orange Money pour éviter les callbacks frauduleux

✅ **Idempotence** : Le système détecte et ignore les callbacks en double (si une commande est déjà PAID)

✅ **Réponse immédiate** : Le callback retourne 200 immédiatement, puis traite le paiement en arrière-plan (évite les retentatives d'Orange)

✅ **Gestion des erreurs HTTP** : Messages d'erreur détaillés selon les codes HTTP (400, 401, 500)

✅ **Polling du statut** : Nouvel endpoint GET pour vérifier le statut de paiement côté frontend

### 3. Logs améliorés

Le backend affiche maintenant des logs très détaillés pour chaque callback :
- Payload complet reçu
- Vérification de l'apiKey
- Données extraites (status, transactionId, reference, metadata, amount)
- Recherche de la commande
- Vérification d'idempotence
- Mise à jour du statut
- Confirmation de l'enregistrement en base de données

### 4. Script de test créé

Le fichier `test-orange-callback.sh` permet de tester facilement les callbacks.

---

## 🧪 Comment tester le callback Orange Money

### Méthode 1 : Avec une commande existante

1. **Trouver un `orderNumber` existant dans votre base de données**

   Connectez-vous à votre base de données et récupérez un `orderNumber` :
   ```sql
   SELECT "orderNumber", "paymentStatus", "transactionId"
   FROM "Order"
   LIMIT 5;
   ```

2. **Tester avec le script bash**
   ```bash
   cd /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep
   ./test-orange-callback.sh [VOTRE_ORDER_NUMBER]
   ```

   Exemple :
   ```bash
   ./test-orange-callback.sh CMD-67B7234E0F2D0
   ```

3. **Vérifier les logs du backend**

   Le backend affiche des logs détaillés :
   ```
   ========== TRAITEMENT CALLBACK ORANGE MONEY ==========
   📦 Payload reçu: { ... }
   🔍 Données extraites:
      - Status: SUCCESS
      - TransactionId: TXN-TEST-1234567890
      - Reference: OM-CMD-67B7234E0F2D0-1234567890
      - Metadata: {"orderId":"1","orderNumber":"CMD-67B7234E0F2D0","customerName":"Test Client"}
   🔎 Recherche de la commande: CMD-67B7234E0F2D0
   ✅ Commande trouvée:
      - ID: 123
      - Numéro: CMD-67B7234E0F2D0
      - Statut paiement actuel: PENDING
      - Transaction ID actuel: null
   💰 Mise à jour de la commande en PAYÉE...
   ✅✅✅ SUCCÈS: Commande CMD-67B7234E0F2D0 marquée comme PAYÉE
      - Nouveau statut: PAID
      - Transaction ID enregistrée: TXN-TEST-1234567890
   ========== FIN TRAITEMENT CALLBACK ==========
   ```

4. **Vérifier dans la base de données**
   ```sql
   SELECT "orderNumber", "paymentStatus", "transactionId"
   FROM "Order"
   WHERE "orderNumber" = 'CMD-67B7234E0F2D0';
   ```

   Vous devriez voir :
   - `paymentStatus` = `'PAID'`
   - `transactionId` = `'TXN-TEST-...'`

### Méthode 2 : Test avec curl directement

```bash
# Test SUCCESS
curl -X POST http://localhost:3004/orange-money/test-callback-success \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "CMD-67B7234E0F2D0",
    "transactionId": "TXN-MANUAL-TEST-001"
  }'

# Test FAILED
curl -X POST http://localhost:3004/orange-money/test-callback-failed \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "CMD-67B7234E0F2D0"
  }'

# Test du callback réel (comme si Orange Money envoyait le callback)
curl -X POST http://localhost:3004/orange-money/callback \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUCCESS",
    "transactionId": "TXN-REAL-TEST-001",
    "amount": {
      "unit": "XOF",
      "value": 10000
    },
    "code": "PRINTALMA001",
    "reference": "OM-CMD-67B7234E0F2D0-1234567890",
    "metadata": {
      "orderId": "1",
      "orderNumber": "CMD-67B7234E0F2D0",
      "customerName": "Test Client"
    }
  }'
```

### Méthode 3 : Vérification du statut de paiement (Polling)

Le nouvel endpoint GET permet au frontend de vérifier régulièrement le statut d'une commande :

```bash
# Vérifier le statut d'une commande
curl http://localhost:3004/orange-money/payment-status/CMD-67B7234E0F2D0
```

Réponse attendue :
```json
{
  "success": true,
  "orderNumber": "CMD-67B7234E0F2D0",
  "paymentStatus": "PAID",
  "transactionId": "TXN-123456789",
  "paymentMethod": "ORANGE_MONEY",
  "totalAmount": 10000,
  "orderStatus": "PENDING"
}
```

#### Exemple de polling côté frontend (JavaScript)

```javascript
async function pollPaymentStatus(orderNumber, maxAttempts = 36) {
  // Polling toutes les 5 secondes pendant max 3 minutes
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, 5000));

    const resp = await fetch(`http://localhost:3004/orange-money/payment-status/${orderNumber}`);
    const data = await resp.json();

    if (data.paymentStatus === 'PAID') {
      console.log('✅ Paiement confirmé !');
      return 'SUCCESS';
    }

    if (data.paymentStatus === 'FAILED') {
      console.log('❌ Paiement échoué');
      return 'FAILED';
    }

    console.log(`⏳ En attente... (tentative ${i + 1}/${maxAttempts})`);
  }

  console.log('⚠️ Timeout - Le paiement n\'a pas été confirmé');
  return 'TIMEOUT';
}

// Utilisation
pollPaymentStatus('CMD-67B7234E0F2D0').then(status => {
  if (status === 'SUCCESS') {
    // Afficher page de confirmation
  } else if (status === 'FAILED') {
    // Proposer de réessayer
  } else {
    // Afficher "en cours de vérification"
  }
});
```

---

## 🔍 Vérification complète

### 1. Vérifier que le backend est démarré
```bash
curl http://localhost:3004/
```

Si vous obtenez une réponse, le backend fonctionne.

### 2. Vérifier les routes Orange Money
```bash
curl http://localhost:3004/orange-money/test-connection
```

Réponse attendue :
```json
{
  "success": true,
  "mode": "live",
  "source": "database",
  "tokenObtained": true
}
```

### 3. Tester le callback avec une commande test

Si vous n'avez pas de commande réelle, créez-en une via le frontend ou directement en base :

```sql
INSERT INTO "Order" (
  "orderNumber",
  "totalAmount",
  "paymentStatus",
  "paymentMethod",
  "createdAt",
  "updatedAt"
) VALUES (
  'TEST-ORDER-CALLBACK-001',
  10000,
  'PENDING',
  'ORANGE_MONEY',
  NOW(),
  NOW()
);
```

Puis testez :
```bash
curl -X POST http://localhost:3004/orange-money/test-callback-success \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "TEST-ORDER-CALLBACK-001",
    "transactionId": "TXN-TEST-SUCCESS-123"
  }'
```

---

## 🔐 Configuration de sécurité

### Variable d'environnement ORANGE_CALLBACK_API_KEY

Pour sécuriser les callbacks, ajoutez cette variable dans votre fichier `.env` :

```bash
ORANGE_CALLBACK_API_KEY=votre_cle_secrete_ici
```

⚠️ **Important** : Cette clé doit être la même que celle configurée dans votre compte Orange Money pour les callbacks.

Si cette variable n'est pas définie, la vérification de l'apiKey sera ignorée (mode développement).

### Tester avec l'apiKey

```bash
# Callback avec apiKey correcte
curl -X POST http://localhost:3004/orange-money/callback \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUCCESS",
    "transactionId": "TXN-001",
    "apiKey": "votre_cle_secrete_ici",
    "reference": "OM-CMD-67B7234E0F2D0-1234567890",
    "metadata": {
      "orderNumber": "CMD-67B7234E0F2D0"
    }
  }'

# Callback avec apiKey incorrecte (sera rejeté)
curl -X POST http://localhost:3004/orange-money/callback \
  -H "Content-Type: application/json" \
  -d '{
    "status": "SUCCESS",
    "transactionId": "TXN-001",
    "apiKey": "mauvaise_cle",
    "reference": "OM-CMD-67B7234E0F2D0-1234567890",
    "metadata": {
      "orderNumber": "CMD-67B7234E0F2D0"
    }
  }'
```

---

## 🐛 Résolution des problèmes

### Problème : "Commande introuvable"

**Symptôme :**
```
❌ ERREUR: Commande CMD-XXX introuvable dans la base de données
```

**Solution :**
- Vérifiez que le `orderNumber` existe exactement comme ça dans la base (sensible à la casse)
- Utilisez la requête SQL pour lister les commandes :
  ```sql
  SELECT "orderNumber" FROM "Order" ORDER BY "createdAt" DESC LIMIT 10;
  ```

### Problème : Logs ne s'affichent pas

**Solution :**
- Vérifiez que vous regardez les logs du bon processus backend
- Les logs sont affichés dans la console où `npm run start` a été lancé

### Problème : transactionId non enregistré

**Vérification :**
1. Regardez les logs détaillés du backend
2. Vérifiez que le callback indique "✅✅✅ SUCCÈS"
3. Vérifiez en base de données :
   ```sql
   SELECT "orderNumber", "paymentStatus", "transactionId"
   FROM "Order"
   WHERE "orderNumber" = 'VOTRE_ORDER_NUMBER';
   ```

### Problème : "Invalid API key"

**Symptôme :**
```
🚨 SÉCURITÉ: apiKey invalide dans le callback Orange Money
```

**Solution :**
1. Vérifiez que la variable `ORANGE_CALLBACK_API_KEY` est définie dans `.env`
2. Vérifiez que l'apiKey envoyée dans le callback correspond exactement
3. Si vous testez en local, utilisez la même clé dans votre requête curl

### Problème : "Callback déjà traité" (Idempotence)

**Symptôme :**
```
⚠️ IDEMPOTENCE: Callback déjà traité pour cette commande
Commande XXX est déjà marquée comme PAYÉE
```

**Explication :**
Ce n'est pas une erreur ! C'est une protection qui évite de traiter deux fois le même paiement.
Orange Money peut parfois renvoyer le même callback plusieurs fois. Le système l'ignore automatiquement.

**Solution :**
Aucune action nécessaire. Le système fonctionne correctement.

### Problème : Erreur 401 lors de la génération du QR Code

**Symptôme :**
```
Orange Money authentication expired. Please retry - a new token will be obtained automatically.
```

**Explication :**
Le token OAuth2 a expiré. Le système va automatiquement en obtenir un nouveau.

**Solution :**
Réessayez immédiatement la requête. Un nouveau token sera automatiquement généré.

### Problème : Erreur 400 lors de la génération du QR Code

**Symptôme :**
```
Orange Money payment creation failed: ... Please check amount, merchant code, and validity.
```

**Solutions possibles :**
1. Vérifiez que le montant est supérieur à 0
2. Vérifiez que le merchant code est correct dans la configuration
3. Vérifiez que la validity est entre 60 et 3600 secondes

---

## 📊 Format du callback Orange Money réel

Quand Orange Money envoie un callback réel, voici le format attendu :

```json
{
  "status": "SUCCESS",          // ou "FAILED" ou "CANCELLED"
  "transactionId": "TXN_123456",
  "apiKey": "CLE_SECRETE",       // ⚠️ Clé de sécurité (vérifiée par le backend)
  "amount": {
    "unit": "XOF",
    "value": 10000
  },
  "code": "PRINTALMA001",       // Votre code marchand
  "reference": "OM-CMD-XXX-...", // La référence générée lors de la création du QR
  "metadata": {
    "orderId": "123",
    "orderNumber": "CMD-XXX",
    "customerName": "Client"
  }
}
```

### Statuts possibles

| Statut | Description | Action backend |
|--------|-------------|----------------|
| `SUCCESS` | Paiement réussi | Commande marquée `PAID` |
| `FAILED` | Paiement échoué (solde insuffisant, erreur technique) | Commande marquée `FAILED` |
| `CANCELLED` | Utilisateur a annulé le paiement | Commande marquée `FAILED` |

---

## ✅ Checklist complète

### Configuration
- [ ] Backend démarré sur le port 3004
- [ ] Variable `ORANGE_CALLBACK_API_KEY` configurée dans `.env` (optionnel pour dev)
- [ ] Endpoints Orange Money accessibles

### Tests du callback
- [ ] Une commande avec un `orderNumber` valide existe en base de données
- [ ] Test du callback SUCCESS exécuté avec succès
- [ ] Test du callback FAILED exécuté avec succès
- [ ] Logs du backend affichent "✅✅✅ SUCCÈS" ou "❌ Commande marquée comme ÉCHOUÉE"
- [ ] Base de données mise à jour correctement (`paymentStatus` et `transactionId`)

### Tests de sécurité
- [ ] Callback avec apiKey incorrecte est rejeté
- [ ] Callback en double est ignoré (idempotence)
- [ ] Callback retourne 200 immédiatement

### Tests du polling
- [ ] Endpoint GET `/orange-money/payment-status/:orderNumber` retourne le statut correct
- [ ] Polling côté frontend détecte les changements de statut
- [ ] Frontend affiche "Paiement réussi !" quand le statut devient PAID
- [ ] Frontend propose de réessayer quand le statut est FAILED

### Tests des erreurs
- [ ] Token expiré (401) est géré avec renouvellement automatique
- [ ] Paramètres invalides (400) affichent un message d'erreur clair
- [ ] Erreur serveur Orange (500) affiche un message approprié

---

## 🎯 Conclusion

Le système est maintenant complètement instrumenté pour déboguer les callbacks Orange Money. Suivez les étapes ci-dessus pour tester et vérifier que tout fonctionne correctement.

En production, Orange Money enverra automatiquement un callback à `https://votre-domaine.com/orange-money/callback` après chaque paiement, et le système mettra à jour la commande automatiquement.
