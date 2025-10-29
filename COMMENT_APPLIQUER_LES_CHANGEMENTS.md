# Comment appliquer les changements PayTech

## ⚠️ IMPORTANT - Sauvegarde

**AVANT TOUTE CHOSE**, sauvegardez votre base de données :

```bash
# Pour PostgreSQL
pg_dump -h votre-host -U votre-user -d votre-database > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📋 Étapes d'application

### Étape 1 : Vérifier les fichiers modifiés

Les fichiers suivants ont été modifiés et sont prêts :

✅ `prisma/schema.prisma`
✅ `src/order/order.service.ts`
✅ `src/paytech/paytech.controller.ts`
✅ `src/paytech/dto/ipn-callback.dto.ts`

**Aucune action requise** - Les changements sont déjà dans les fichiers.

---

### Étape 2 : Appliquer la migration de base de données

Vous avez 2 options :

#### Option A : Migration SQL manuelle (RECOMMANDÉ)

Cette option préserve vos données existantes.

```bash
# Se connecter à votre base de données et exécuter le script
psql -h ep-hidden-river-aduafitn-pooler.c-2.us-east-1.aws.neon.tech \
  -U votre-user \
  -d neondb \
  -f prisma/migrations/manual_payment_status_migration.sql
```

Le script va :
1. ✅ Créer l'enum `PaymentStatus`
2. 🔄 Migrer vos données existantes (String → Enum)
3. ➕ Ajouter les nouvelles colonnes
4. 📊 Créer les index
5. 📝 Afficher un résumé

#### Option B : Prisma db push (RISQUÉ)

⚠️ **ATTENTION** : Cette commande peut causer des pertes de données !

```bash
# Accepter la perte de données potentielle
npx prisma db push --accept-data-loss
```

---

### Étape 3 : Régénérer le client Prisma

```bash
npx prisma generate
```

Vous devriez voir :
```
✔ Generated Prisma Client (v6.7.0) to ./node_modules/.prisma/client
```

---

### Étape 4 : Redémarrer le serveur

```bash
# Si le serveur tourne, arrêtez-le (Ctrl+C) puis :
npm run start:dev
```

---

### Étape 5 : Tester la configuration

#### Test 1 : Vérifier la configuration PayTech

```bash
curl http://localhost:3000/paytech/test-config
```

Résultat attendu :
```json
{
  "success": true,
  "message": "PayTech service is configured and ready",
  "data": {
    "hasApiKey": true,
    "hasApiSecret": true,
    "environment": "prod"
  }
}
```

#### Test 2 : Diagnostic de connectivité

```bash
curl http://localhost:3000/paytech/diagnose
```

Résultat attendu :
```json
{
  "success": true,
  "message": "PayTech API is reachable and responding",
  "data": {
    "token": "...",
    "hasRedirectUrl": true
  }
}
```

---

### Étape 6 : Créer une commande de test

Utilisez Postman ou curl :

```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "orderItems": [
      {
        "productId": 1,
        "quantity": 1,
        "unitPrice": 10000,
        "size": "M",
        "colorId": 1
      }
    ],
    "totalAmount": 10000,
    "phoneNumber": "+221771234567",
    "shippingName": "Test User",
    "shippingCity": "Dakar",
    "shippingCountry": "Senegal",
    "paymentMethod": "PAYTECH",
    "initiatePayment": true
  }'
```

Résultat attendu :
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 123,
    "orderNumber": "ORD-1234567890",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "payment": {
      "token": "abc123xyz789",
      "redirect_url": "https://paytech.sn/payment/checkout/abc123xyz789"
    }
  }
}
```

---

### Étape 7 : Tester le paiement complet

1. **Ouvrir** l'URL `redirect_url` dans un navigateur
2. **Choisir** un mode de paiement (Orange Money, Wave, etc.)
3. **Effectuer** le paiement

En mode **test** :
- Un montant aléatoire entre 100-150 FCFA sera débité
- Le montant de votre commande sera ignoré

4. **Vérifier** dans les logs backend :
```
📬 IPN callback received for command: ORD-1234567890
✅ IPN signature verified for: ORD-1234567890
✅ Paiement complété pour: ORD-1234567890
✅ Order ORD-1234567890 payment status updated to PAID
```

5. **Vérifier** dans la base de données :
```sql
SELECT
  "orderNumber",
  status,
  "paymentStatus",
  "transactionId",
  "paymentToken",
  "paymentDate",
  "paymentDetails"
FROM "Order"
WHERE "orderNumber" = 'ORD-1234567890';
```

Résultat attendu :
```
 orderNumber    | status    | paymentStatus | transactionId | paymentToken | paymentDate         | paymentDetails
----------------+-----------+---------------+---------------+--------------+---------------------+----------------
 ORD-1234567890 | CONFIRMED | PAID          | TXN_123       | abc123xyz   | 2025-01-29 14:30:00 | {"method": "Orange Money", ...}
```

---

## 🔍 Vérifications de santé

### Vérifier l'enum PaymentStatus

```sql
SELECT enum_range(NULL::\"PaymentStatus\");
```

Résultat attendu :
```
{PENDING,PAID,FAILED,REJECTED,CANCELLED}
```

### Vérifier les colonnes Order

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'Order'
AND column_name IN ('paymentStatus', 'paymentToken', 'paymentDate', 'paymentDetails');
```

Résultat attendu :
```
 column_name   | data_type
---------------+-----------
 paymentStatus | USER-DEFINED
 paymentToken  | text
 paymentDate   | timestamp(3) without time zone
 paymentDetails| jsonb
```

---

## 🐛 Troubleshooting

### Problème 1 : "Enum PaymentStatus déjà existe"

```sql
-- Vérifier si l'enum existe
SELECT typname FROM pg_type WHERE typname = 'PaymentStatus';

-- Si oui, passer à l'étape suivante
```

### Problème 2 : "Column paymentStatus already exists"

```sql
-- Vérifier le type de la colonne
SELECT data_type FROM information_schema.columns
WHERE table_name = 'Order' AND column_name = 'paymentStatus';

-- Si c'est 'text', exécuter seulement la partie migration du script
```

### Problème 3 : Serveur ne démarre pas

```bash
# Vérifier les erreurs
npm run start:dev

# Si erreur Prisma, régénérer :
npx prisma generate

# Si erreur TypeScript, recompiler :
npm run build
```

### Problème 4 : IPN non reçus

1. Vérifier que l'URL IPN est accessible :
```bash
curl -X POST http://localhost:3000/paytech/ipn-callback \
  -H "Content-Type: application/json" \
  -d '{"type_event":"test"}'
```

2. En développement, utiliser ngrok :
```bash
ngrok http 3000
# Utiliser l'URL HTTPS fournie comme IPN_URL
```

---

## 📊 Statut des migrations

Après application, votre système supportera :

| Statut | Description | Fonctionnel |
|--------|-------------|-------------|
| ✅ PENDING | Paiement en attente | Oui |
| ✅ PAID | Paiement réussi | Oui |
| ✅ FAILED | Paiement échoué | Oui |
| ✅ REJECTED | Paiement rejeté | Oui |
| ✅ CANCELLED | Paiement annulé | Oui |

---

## 📞 Besoin d'aide ?

1. Consultez `PAYTECH_INTEGRATION_GUIDE.md` pour la documentation complète
2. Consultez `PAYTECH_IMPLEMENTATION_SUMMARY.md` pour un résumé technique
3. Vérifiez les logs serveur : `npm run start:dev`
4. Testez avec Postman en utilisant la collection PayTech

---

## ✅ Checklist finale

Avant de passer en production :

- [ ] Base de données sauvegardée
- [ ] Migration appliquée avec succès
- [ ] Serveur redémarré
- [ ] Tests de configuration réussis
- [ ] Commande de test créée
- [ ] Paiement de test effectué
- [ ] IPN callback reçu et traité
- [ ] Commande passée en CONFIRMED
- [ ] Variables d'environnement configurées pour production
- [ ] URL IPN en HTTPS
- [ ] PayTech contacté pour activation compte production

---

**Date** : 29 Janvier 2025
**Version** : 1.0.0
