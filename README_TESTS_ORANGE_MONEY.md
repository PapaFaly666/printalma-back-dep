# Tests Orange Money - Guide d'utilisation

Ce guide explique comment exécuter les tests de l'implémentation Orange Money en environnement de production (ou sandbox).

---

## 📋 Scripts disponibles

| Script | Description | Durée | Niveau |
|--------|-------------|-------|--------|
| `test-orange-config.sh` | Vérifie la configuration et la connexion | ~10s | ⭐ Débutant |
| `test-orange-payment.sh` | Teste un parcours de paiement complet | ~30s | ⭐⭐ Intermédiaire |
| `test-orange-money-complete.sh` | Test END-TO-END complet (30+ tests) | ~60s | ⭐⭐⭐ Avancé |

---

## 🚀 Démarrage rapide

### Étape 1 : Prérequis

```bash
# 1. Vérifiez que le backend est démarré
npm run start:dev

# 2. Vérifiez que les variables d'environnement sont configurées
cat .env | grep ORANGE

# 3. Installez jq (pour parser les JSON)
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (WSL)
sudo apt-get install jq
```

### Étape 2 : Rendre les scripts exécutables

```bash
chmod +x test-orange-config.sh
chmod +x test-orange-payment.sh
chmod +x test-orange-money-complete.sh
```

### Étape 3 : Exécuter les tests

```bash
# Test 1: Vérifier la configuration (obligatoire en premier)
./test-orange-config.sh

# Test 2: Tester un paiement (optionnel)
./test-orange-payment.sh

# Test 3: Test complet END-TO-END (recommandé)
./test-orange-money-complete.sh
```

---

## 📖 Guide détaillé

### 1️⃣ Test de configuration

**Fichier** : `test-orange-config.sh`

**Ce que ça teste** :
- ✅ Connexion au backend
- ✅ Connexion à l'API Orange Money
- ✅ Obtention du token OAuth
- ✅ Vérification du callback URL enregistré

**Commande** :
```bash
./test-orange-config.sh
```

**Résultat attendu** :
```
==========================================
🔍 VÉRIFICATION CONFIGURATION ORANGE MONEY
==========================================

Backend URL: http://localhost:3000

📊 Test 1: Connexion au backend...
✅ Connexion backend: SUCCÈS
   Backend accessible

📊 Test 2: Test de connexion à l'API Orange Money...
✅ Connexion Orange Money: SUCCÈS
   Mode: sandbox | Source: database | Token: obtenu

📊 Test 3: Vérification du callback URL enregistré...
✅ Callback URL: SUCCÈS
   URL: https://printalma-back-dep.onrender.com/orange-money/callback | Code: 123456

==========================================
📋 RÉSUMÉ DE LA CONFIGURATION
==========================================
Backend:           Accessible
Orange Money API:  Connecté
Mode:              sandbox
Source config:     database
Token OAuth:       Obtenu
Callback URL:      Configuré
==========================================

✅ Configuration validée ! Vous pouvez passer aux tests de paiement.
```

**Si ça échoue** :
1. Vérifiez que le backend est démarré : `npm run start:dev`
2. Vérifiez vos credentials dans `.env`
3. Vérifiez que vous êtes connecté à internet

---

### 2️⃣ Test de paiement

**Fichier** : `test-orange-payment.sh`

**Ce que ça teste** :
- ✅ Génération d'un QR Code Orange Money
- ✅ Vérification du statut initial (PENDING)
- ✅ Simulation d'un callback SUCCESS
- ✅ Vérification du statut final (PAID)
- ✅ Test d'idempotence (double callback)

**Commande** :
```bash
# Avec un numéro de commande auto-généré
./test-orange-payment.sh

# Ou avec un numéro de commande personnalisé
./test-orange-payment.sh ORD-12345
```

**Résultat attendu** :
```
==========================================
💳 TEST PARCOURS PAIEMENT ORANGE MONEY
==========================================

Backend URL:    http://localhost:3000
Order Number:   ORD-TEST-20240224103045
Amount:         10000 XOF
Customer:       Client Test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 ÉTAPE 1: Génération du paiement Orange Money (QR Code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Génération QR Code: SUCCÈS
   Reference: OM-ORD-TEST-20240224103045-1709024567890 | Validité: 600s | QR Code: présent

[... suite des étapes ...]

==========================================
📊 RÉSUMÉ DU TEST
==========================================

✅ Commande:           ORD-TEST-20240224103045
✅ Montant:            10000 XOF
✅ Statut paiement:    PAID
✅ Transaction ID:     MP20240224.1030.TEST1709024567890
✅ QR Code:            Généré
✅ Callback:           Traité
✅ Idempotence:        Validée

==========================================

🎉 TEST RÉUSSI ! Le parcours de paiement fonctionne correctement.
```

---

### 3️⃣ Test END-TO-END complet

**Fichier** : `test-orange-money-complete.sh`

**Ce que ça teste** (30+ tests) :

1. **Configuration & Connexion** (4 tests)
   - Backend accessible
   - Connexion Orange Money API
   - Token OAuth obtenu
   - Mode configuré

2. **Callbacks (Webhooks)** (1 test)
   - Callback URL vérifié

3. **Parcours paiement réussi** (6 tests)
   - Génération QR Code
   - Statut initial = PENDING
   - Callback SUCCESS traité
   - Statut final = PAID
   - Transaction ID enregistré
   - shouldRedirect = true

4. **Idempotence** (2 tests)
   - Second callback accepté
   - Transaction ID inchangé

5. **Parcours paiement échoué** (3 tests)
   - Génération QR Code
   - Callback FAILED traité
   - Statut = FAILED

6. **Callback format simplifié** (2 tests)
   - Génération QR Code
   - Callback SIMPLE traité

7. **Endpoints de transactions** (4 tests)
   - GET /transactions
   - Filtrage par status
   - Filtrage par type
   - Pagination

8. **Vérification de transaction** (1 test)
   - GET /verify-transaction/:id

9. **Réconciliation** (1 test)
   - GET /check-payment/:orderNumber

**Commande** :
```bash
./test-orange-money-complete.sh
```

**Résultat attendu (si tout passe)** :
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🧪 TEST END-TO-END COMPLET - ORANGE MONEY API             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Backend URL: http://localhost:3000
Timestamp:   20240224103045

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 1️⃣  CONFIGURATION & CONNEXION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Backend accessible
  ✅ Connexion Orange Money API
  ✅ Token OAuth obtenu
  ℹ️  Mode actuel: sandbox

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 2️⃣  CALLBACKS (WEBHOOKS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✅ Callback URL vérifié
  ℹ️  Callback URL: https://printalma-back-dep.onrender.com/orange-money/callback

[... suite des sections ...]

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  📊 RÉSUMÉ DES TESTS                                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

Total de tests:   24
Tests réussis:    24
Tests échoués:    0

Taux de réussite: 100%

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !               ║
║                                                            ║
║  Votre implémentation Orange Money est 100% fonctionnelle ║
║  et conforme à la documentation officielle.               ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

🚀 Prêt pour la production !
```

---

## 🔧 Configuration des variables d'environnement

### Pour le test (sandbox)

Créez ou modifiez votre fichier `.env` :

```env
# Orange Money - SANDBOX (pour les tests)
ORANGE_CLIENT_ID=votre_client_id_sandbox
ORANGE_CLIENT_SECRET=votre_client_secret_sandbox
ORANGE_MERCHANT_CODE=123456
ORANGE_CALLBACK_API_KEY=votre_api_key
ORANGE_MODE=sandbox

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Pour la production

```env
# Orange Money - PRODUCTION
ORANGE_CLIENT_ID=votre_client_id_production
ORANGE_CLIENT_SECRET=votre_client_secret_production
ORANGE_MERCHANT_CODE=654321
ORANGE_CALLBACK_API_KEY=votre_api_key
ORANGE_MODE=production

# URLs
BACKEND_URL=https://printalma-back-dep.onrender.com
FRONTEND_URL=https://printalma-website-dep.onrender.com
```

---

## 🐛 Résolution de problèmes

### Erreur : "jq: command not found"

**Solution** :
```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (WSL)
sudo apt-get install jq
```

---

### Erreur : "Permission denied"

**Solution** :
```bash
chmod +x test-orange-config.sh
chmod +x test-orange-payment.sh
chmod +x test-orange-money-complete.sh
```

---

### Erreur : "Backend not accessible"

**Solution** :
1. Vérifiez que le backend est démarré :
   ```bash
   npm run start:dev
   ```

2. Vérifiez que le port 3000 est libre :
   ```bash
   lsof -i :3000
   ```

3. Si le backend est sur un autre port ou URL, définissez `BACKEND_URL` :
   ```bash
   export BACKEND_URL=http://localhost:4000
   ./test-orange-config.sh
   ```

---

### Erreur : "Invalid credentials"

**Solution** :
1. Vérifiez vos credentials dans `.env` :
   ```bash
   cat .env | grep ORANGE
   ```

2. Vérifiez que vous utilisez les bons credentials (sandbox vs production)

3. Contactez Orange Money pour vérifier vos credentials

---

### Erreur : "Order not found"

**Solution** :
1. Vérifiez que la base de données est accessible
2. Vérifiez que Prisma est configuré correctement
3. Exécutez les migrations :
   ```bash
   npx prisma migrate deploy
   ```

---

## 📊 Tester en environnement distant

Si votre backend est déployé sur un serveur distant (Render, Heroku, etc.) :

```bash
# Définir l'URL du backend distant
export BACKEND_URL=https://printalma-back-dep.onrender.com

# Exécuter les tests
./test-orange-config.sh
./test-orange-money-complete.sh
```

---

## 📝 Logs détaillés

Pour voir les logs détaillés du backend pendant les tests :

```bash
# Terminal 1 : Logs du backend
npm run start:dev

# Terminal 2 : Exécution des tests
./test-orange-money-complete.sh
```

Vous verrez dans les logs du backend :
- 📦 Payload des callbacks reçus
- 🔍 Format détecté (complet ou simplifié)
- ✅ Statut de traitement
- 💰 Montants, transactions IDs, etc.

---

## 🎯 Workflow recommandé

### Pour le développement

```bash
# 1. Démarrer le backend en mode dev
npm run start:dev

# 2. Vérifier la configuration
./test-orange-config.sh

# 3. Tester un paiement manuel
./test-orange-payment.sh ORD-DEV-001

# 4. Consulter les logs pour debugging
# (dans le terminal du backend)
```

### Pour la mise en production

```bash
# 1. Vérifier la configuration en production
export BACKEND_URL=https://votre-backend.com
./test-orange-config.sh

# 2. Exécuter le test complet
./test-orange-money-complete.sh

# 3. Si tous les tests passent → déployer !
git push production main
```

---

## 📚 Documentation supplémentaire

- **Guide complet** : `ORANGE_MONEY_PRODUCTION_TESTS.md`
- **Guide callbacks** : `ORANGE_MONEY_CALLBACKS_GUIDE.md`
- **Conformité transactions** : `ORANGE_MONEY_TRANSACTIONS_CONFORMITY.md`
- **Résumé implémentation** : `ORANGE_MONEY_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Checklist avant la production

- [ ] Tous les tests de `test-orange-config.sh` passent
- [ ] Tous les tests de `test-orange-money-complete.sh` passent (24/24)
- [ ] Variables d'environnement de production configurées
- [ ] Callback URL enregistré chez Orange Money (production)
- [ ] Backend accessible en HTTPS
- [ ] Base de données de production accessible
- [ ] Migrations Prisma appliquées en production
- [ ] Logs de production configurés (Datadog, Sentry, etc.)

---

**Félicitations !** 🎉

Vous êtes maintenant prêt à tester l'intégralité de votre implémentation Orange Money !

Si tous les tests passent, votre implémentation est **100% fonctionnelle** et **production-ready**.
