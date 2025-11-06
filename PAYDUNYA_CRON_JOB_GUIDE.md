# 🔄 CRON JOB PAYDUNYA - VÉRIFICATION AUTOMATIQUE DES PAIEMENTS

**Version:** 1.0
**Date:** 05/11/2025

---

## 🎯 Objectif

Ce système de cron job vérifie automatiquement le statut des paiements PayDunya en attente et met à jour les commandes dans la base de données **sans dépendre des webhooks**.

### Pourquoi un cron job ?

**Problèmes résolus:**
1. ✅ Webhooks non reçus (firewall, réseau, etc.)
2. ✅ Localhost non accessible depuis PayDunya
3. ✅ Synchronisation automatique des statuts
4. ✅ Vérification de sécurité supplémentaire
5. ✅ Backup en cas de défaillance du webhook

---

## 🔧 Fonctionnement

### Flux Automatique

```
Toutes les 5 minutes
        ↓
Recherche commandes PENDING (dernières 24h)
        ↓
Pour chaque commande:
  ├─> Récupère le token PayDunya
  ├─> Appelle GET /paydunya/status/{token}
  ├─> Analyse le statut retourné
  └─> Met à jour la commande si statut changé
        ↓
Logs détaillés + statistiques
```

### Statuts gérés

| Statut PayDunya | Action | Résultat DB |
|----------------|--------|-------------|
| `completed` | ✅ Met à jour | `PAID` / `CONFIRMED` |
| `cancelled` | ❌ Met à jour | `FAILED` / `PENDING` |
| `failed` | ❌ Met à jour | `FAILED` / `PENDING` |
| `pending` | ⏳ Ignore | Pas de changement |

---

## 📋 Configuration

### Fréquence du Cron Job

**Par défaut:** Toutes les 5 minutes

**Fichier:** `src/paydunya/paydunya-cron.service.ts`

```typescript
@Cron('0 */5 * * * *', {
  name: 'check-pending-paydunya-payments',
  timeZone: 'Africa/Dakar',
})
```

### Modifier la fréquence

```typescript
// Toutes les minutes
@Cron('0 * * * * *')

// Toutes les 2 minutes
@Cron('0 */2 * * * *')

// Toutes les 10 minutes
@Cron('0 */10 * * * *')

// Toutes les 30 minutes
@Cron('0 */30 * * * *')

// Toutes les heures
@Cron('0 0 * * * *')
```

### Période de vérification

**Par défaut:** Dernières 24 heures

```typescript
const twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
```

**Pour modifier:**
```typescript
// Dernières 48 heures
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 48);

// Dernières 12 heures
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 12);

// Dernière semaine
twentyFourHoursAgo.setDate(twentyFourHoursAgo.getDate() - 7);
```

---

## 🚀 Utilisation

### 1. Démarrage Automatique

Le cron job démarre automatiquement avec le serveur NestJS :

```bash
npm run start:dev
# ou
npm run start:prod
```

**Logs visibles:**
```
[PaydunyaCronService] 🔄 Starting PayDunya payment status check cron job
[PaydunyaCronService] 📊 Found 3 pending PayDunya payment(s) to check
[PaydunyaCronService] 🔍 Checking payment status for order ORD-123...
[PaydunyaCronService] ✅ Order ORD-123: Payment COMPLETED, updating database
[PaydunyaCronService] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[PaydunyaCronService] 📊 PayDunya Cron Job Summary:
[PaydunyaCronService]    Total pending orders: 3
[PaydunyaCronService]    Checked: 3
[PaydunyaCronService]    Updated: 1
[PaydunyaCronService]    Errors: 0
[PaydunyaCronService] ✅ PayDunya payment status check cron job completed
```

### 2. Exécution Manuelle (Admin)

#### A. Vérifier toutes les commandes en attente

**Endpoint:** `POST /paydunya/cron/run`

**Authentification:** Bearer Token (Admin/SuperAdmin requis)

```bash
curl -X POST http://localhost:3004/paydunya/cron/run \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "message": "Cron job executed successfully",
  "timestamp": "2025-11-05T20:30:00.000Z"
}
```

#### B. Vérifier une commande spécifique

**Endpoint:** `POST /paydunya/cron/check/:orderNumber`

```bash
curl -X POST http://localhost:3004/paydunya/cron/check/ORD-1762389766612 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "message": "Order ORD-1762389766612 status updated",
  "data": {
    "orderNumber": "ORD-1762389766612",
    "wasUpdated": true,
    "checkedAt": "2025-11-05T20:30:00.000Z"
  }
}
```

#### C. Obtenir les statistiques

**Endpoint:** `GET /paydunya/cron/stats`

```bash
curl -X GET http://localhost:3004/paydunya/cron/stats \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

**Réponse:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "totalPending": 5,
    "recentPending": 3,
    "completedLast24h": 12,
    "failedLast24h": 2,
    "lastCheck": "2025-11-05T20:30:00.000Z"
  }
}
```

---

## 🔍 Exemple de Vérification

### Cas d'usage réel

1. **Client crée une commande**
   - Statut: `PENDING / PENDING`
   - Token PayDunya: `test_LUjsrjenXW`

2. **Client paie sur PayDunya**
   - Paiement effectué
   - Statut PayDunya: `completed`

3. **Webhook pas reçu** (localhost, firewall, etc.)
   - Statut DB: Toujours `PENDING / PENDING` ❌

4. **Cron job s'exécute (5 min après)**
   - Appelle: `GET /paydunya/status/test_LUjsrjenXW`
   - Reçoit: `{ status: "completed", response_code: "00" }`
   - Met à jour: `PAID / CONFIRMED` ✅

5. **Client vérifie sa commande**
   - Statut à jour ! ✅

---

## 📊 Logs et Monitoring

### Logs automatiques

Le cron job génère des logs détaillés :

```bash
# Voir les logs en temps réel
tail -f logs/app.log | grep PaydunyaCronService

# Voir les logs du jour
grep "PaydunyaCronService" logs/app.log | grep "$(date +%Y-%m-%d)"

# Compter les mises à jour
grep "successfully updated to PAID" logs/app.log | wc -l
```

### Informations loguées

- ✅ Nombre de commandes vérifiées
- ✅ Nombre de mises à jour effectuées
- ✅ Erreurs rencontrées
- ✅ Temps d'exécution
- ✅ Détails de chaque commande

---

## 🧪 Test du Cron Job

### Test 1: Vérification automatique

```bash
# 1. Créer une commande test
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "phoneNumber": "+221775588834",
    "shippingDetails": {...},
    "orderItems": [{...}],
    "totalAmount": 5000,
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }'

# Sauvegarder le orderNumber et le token

# 2. Payer sur PayDunya (avec carte de test)
# https://app.paydunya.com/sandbox-checkout/invoice/{token}

# 3. Attendre 5 minutes OU forcer l'exécution manuelle
curl -X POST http://localhost:3004/paydunya/cron/run \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 4. Vérifier le statut de la commande
node check-order-status.js {orderId}
```

### Test 2: Vérification manuelle d'une commande

```bash
# Vérifier immédiatement une commande spécifique
curl -X POST http://localhost:3004/paydunya/cron/check/ORD-1762389766612 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Test 3: Simulation complète

```bash
# Utiliser le script de test complet
./test-paydunya-cron-integration.sh
```

---

## ⚡ Performance et Optimisation

### Mécanismes de sécurité

1. **Prévention des exécutions simultanées**
   ```typescript
   if (this.isRunning) {
     this.logger.warn('Previous cron job still running, skipping');
     return;
   }
   ```

2. **Limitation de la période**
   - Seules les commandes des dernières 24h sont vérifiées
   - Réduit la charge sur l'API PayDunya

3. **Gestion des erreurs**
   - Une erreur sur une commande n'arrête pas le traitement des autres
   - Logs détaillés pour debugging

### Charge estimée

**Avec 100 commandes PENDING par jour:**
- Requêtes API PayDunya: ~20 par exécution (toutes les 5 min)
- Total quotidien: ~5,760 requêtes
- Temps d'exécution: ~5-10 secondes par exécution

**Recommandations:**
- Pour > 500 commandes/jour: Augmenter l'intervalle à 10-15 minutes
- Pour < 50 commandes/jour: Peut rester à 5 minutes
- En production: Monitorer les logs de performance

---

## 🔒 Sécurité

### Endpoints Admin Protégés

Tous les endpoints manuels nécessitent :
- ✅ JWT Token valide
- ✅ Rôle ADMIN ou SUPERADMIN
- ✅ Guards NestJS activés

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(['ADMIN', 'SUPERADMIN'])
```

### Protection contre les abus

- ❌ Pas d'exécution publique
- ❌ Pas d'accès sans authentification
- ✅ Logs de toutes les exécutions manuelles

---

## 🐛 Debugging et Dépannage

### Problème 1: Le cron ne s'exécute pas

**Vérifications:**
```bash
# 1. Vérifier que ScheduleModule est importé
grep "ScheduleModule" src/app.module.ts

# 2. Vérifier les logs au démarrage
npm run start:dev | grep "PaydunyaCronService"

# 3. Forcer l'exécution manuelle
curl -X POST http://localhost:3004/paydunya/cron/run \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Problème 2: Pas de mise à jour des commandes

**Causes possibles:**
1. Pas de token PayDunya dans la DB
2. Token invalide ou expiré
3. Problème de connexion à l'API PayDunya

**Debug:**
```bash
# Vérifier les logs du cron
tail -f logs/app.log | grep "PaydunyaCronService"

# Vérifier manuellement le statut PayDunya
curl http://localhost:3004/paydunya/status/{token}

# Vérifier les PaymentAttempt dans la DB
node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.paymentAttempt.findMany({
    where: { orderId: YOUR_ORDER_ID }
  }).then(console.log);
"
```

### Problème 3: Trop de requêtes API

**Solution:**
```typescript
// Augmenter l'intervalle dans paydunya-cron.service.ts
@Cron('0 */10 * * * *')  // Toutes les 10 minutes au lieu de 5

// Ou réduire la période de vérification
const twelveHoursAgo = new Date();
twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
```

---

## 📈 Statistiques et Monitoring

### Dashboard recommandé

Créer un dashboard admin pour visualiser :
- 📊 Nombre de commandes en attente
- ✅ Taux de succès des vérifications
- ⏱️  Temps moyen de mise à jour
- 📈 Évolution des paiements

### Requête SQL pour stats

```sql
-- Commandes mises à jour par le cron (dernières 24h)
SELECT
  COUNT(*) as updated_count,
  AVG(EXTRACT(EPOCH FROM (updatedAt - createdAt))/60) as avg_minutes
FROM "Order"
WHERE
  paymentMethod = 'PAYDUNYA'
  AND paymentStatus = 'PAID'
  AND updatedAt > NOW() - INTERVAL '24 hours'
  AND notes LIKE '%Auto-detected by cron job%';
```

---

## 🚀 Déploiement en Production

### Checklist

- [ ] ScheduleModule activé dans app.module.ts
- [ ] Fréquence du cron adaptée au volume
- [ ] Logs configurés et rotationnés
- [ ] Monitoring en place
- [ ] Alerts configurées (email, Slack, etc.)
- [ ] Tests de charge effectués
- [ ] Documentation partagée avec l'équipe

### Variables d'environnement

```env
# Pas de variable spécifique requise
# Le cron utilise les mêmes clés PayDunya que le reste
PAYDUNYA_MASTER_KEY=...
PAYDUNYA_PRIVATE_KEY=...
PAYDUNYA_TOKEN=...
PAYDUNYA_MODE=live  # En production
```

---

## 🎉 Avantages du Système

### Pour le Backend

✅ **Fiabilité:** Fonctionne même si les webhooks échouent
✅ **Simplicité:** Pas besoin de ngrok ou d'URLs publiques en dev
✅ **Autonomie:** Synchronisation automatique sans intervention
✅ **Traçabilité:** Logs détaillés de toutes les vérifications
✅ **Sécurité:** Double vérification des paiements

### Pour le Frontend

✅ **Cohérence:** Statuts toujours à jour
✅ **Performance:** Polling moins nécessaire
✅ **UX:** Utilisateurs voient le bon statut rapidement
✅ **Fiabilité:** Moins d'erreurs "paiement non détecté"

### Pour l'Équipe

✅ **Maintenance:** Moins d'interventions manuelles
✅ **Monitoring:** Vue claire des paiements
✅ **Debugging:** Logs détaillés pour troubleshooting
✅ **Scalabilité:** Gère automatiquement le volume

---

## 📞 Support

### Fichiers liés

- **Service:** `src/paydunya/paydunya-cron.service.ts`
- **Controller:** `src/paydunya/paydunya-cron.controller.ts`
- **Module:** `src/paydunya/paydunya.module.ts`
- **Tests:** `test-paydunya-cron-integration.sh`

### Documentation

- **Backend:** `STRATEGIE_PAYDUNYA_WEBHOOK.md`
- **Frontend:** `GUIDE_FRONTEND_INTEGRATION_PAYDUNYA.md`
- **Tests:** `TEST_REEL_PAYDUNYA.md`

---

**Créé le:** 05/11/2025
**Version:** 1.0
**Auteur:** Équipe Backend Printalma

---

## ✨ Conclusion

Le cron job PayDunya est une **solution robuste et automatique** qui garantit que tous les paiements sont correctement détectés et mis à jour dans la base de données, **même sans webhooks fonctionnels**.

C'est particulièrement utile en développement (localhost) et ajoute une couche de sécurité supplémentaire en production ! 🚀
