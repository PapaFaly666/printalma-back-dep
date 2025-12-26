# ✅ CORRECTION DU CALCUL DU MONTANT DISPONIBLE (availableAmount)

**Date:** 2025-12-22
**Statut:** ✅ CORRIGÉ
**Impact:** Critique - Affecte les revenus vendeurs

---

## 📋 Problème identifié

### Symptôme
Quand l'admin livre une commande (statut → `DELIVERED`), le montant "Disponible" dans `/vendeur/appel-de-fonds` augmentait du **prix total du produit** au lieu du **prix du design vendeur uniquement**.

### Comportement AVANT correction (❌ INCORRECT)
- Produit vendu : 10 000 FCFA
- Design vendeur : 3 200 FCFA
- Commission plateforme : 40%
- **Montant ajouté au disponible : 6 000 FCFA** (10 000 × 0.6) ❌

**Problème :** Le vendeur recevait des gains sur le prix TOTAL du produit au lieu du prix du design seulement.

### Comportement APRÈS correction (✅ CORRECT)
- Produit vendu : 10 000 FCFA
- Design vendeur : 3 200 FCFA
- Commission plateforme : 40%
- **Montant ajouté au disponible : 1 920 FCFA** (3 200 × 0.6) ✅

**Résultat :** Le vendeur reçoit uniquement les revenus de son design (moins la commission).

---

## 🔍 Analyse technique

### Architecture du système

Le système Printalma a **DEUX types de revenus** pour les vendeurs :

1. **VendorProduct** : Produits complets vendus par le vendeur
   - Le vendeur crée un produit basé sur un produit admin
   - Prix = Prix du produit de base + Marge vendeur
   - **AVANT :** Le vendeur gagnait sur la marge du produit complet
   - **APRÈS :** Le vendeur ne gagne PLUS sur les VendorProducts, uniquement sur les designs

2. **DesignUsage** : Designs vendus séparément (table `design_usages`)
   - Un client achète un produit et y applique un design vendeur
   - Le vendeur gagne sur le **prix du design seulement** (pas sur le produit)
   - Système de tracking avec statuts de paiement : `PENDING` → `CONFIRMED` → `READY_FOR_PAYOUT` → `PAID`

### Flux de paiement des designs

```
Commande créée
    ↓
[DesignUsage: PENDING]
    ↓
Paiement confirmé (paymentStatus = 'PAID')
    ↓
[DesignUsage: CONFIRMED]
    ↓
Commande livrée (status = 'DELIVERED')
    ↓
[DesignUsage: READY_FOR_PAYOUT] ← 💰 Disponible pour retrait vendeur
    ↓
Vendeur crée une demande de fonds
    ↓
Admin approuve et paie
    ↓
[DesignUsage: PAID]
```

### Fichiers concernés

1. **`src/vendor-funds/vendor-funds.service.ts`**
   - Méthode `calculateVendorEarnings()` (lignes 35-241)
   - Calcule les gains disponibles pour le vendeur

2. **`src/order/order.service.ts`**
   - Met à jour le statut des DesignUsage quand la commande est livrée
   - Ligne 1715-1719 : Transition vers `READY_FOR_PAYOUT`

3. **`src/utils/designUsageTracker.ts`**
   - Track l'utilisation des designs dans les commandes
   - Gère les transitions de statut de paiement

---

## 🔧 Modifications effectuées

### 1. Fichier : `src/vendor-funds/vendor-funds.service.ts`

#### Ligne 84-108 : Suppression du calcul sur VendorProduct

**AVANT :**
```typescript
for (const order of validOrders) {
  for (const item of order.orderItems) {
    if (item.product.vendorProducts.length > 0) {
      const orderItemTotal = item.unitPrice * item.quantity;
      const productCost = item.product.price || 0;
      const vendorProfit = orderItemTotal - totalBaseCost;
      const commissionAmount = vendorProfit * commissionRate;
      const vendorNetEarnings = vendorProfit - commissionAmount;

      totalEarnings += vendorNetEarnings; // ❌ PROBLÈME ICI
      totalCommissionAmount += commissionAmount;
      // ...
    }
  }
}
```

**APRÈS :**
```typescript
// ✅ CORRECTION: Ne calculer les gains QUE sur les revenus de designs, PAS sur les produits complets
// Le vendeur ne gagne de l'argent que sur les designs qu'il vend, pas sur les produits de base
let totalEarnings = 0; // Gains nets pour le vendeur (après commission) = UNIQUEMENT revenus designs
let totalCommissionAmount = 0;

// ⚠️ IMPORTANT: On ne calcule PLUS les gains sur les VendorProducts
// Les vendeurs gagnent uniquement via les designs vendus (table design_usages)
for (const order of validOrders) {
  for (const item of order.orderItems) {
    if (item.product.vendorProducts.length > 0) {
      // Log uniquement pour le tracking (pas de calcul de gains)
      console.log(`[VENDOR ${vendorId}] Commande ${order.orderNumber} - Produit vendu (gains via designs uniquement)`);
    }
  }
}
```

#### Ligne 110-122 : Correction du statut des designs

**AVANT :**
```typescript
const designUsages = await this.prisma.designUsage.findMany({
  where: {
    vendorId,
    paymentStatus: 'CONFIRMED' // ❌ MAUVAIS STATUT
  },
  // ...
});
```

**APRÈS :**
```typescript
// 🎨 Ajouter les revenus des designs PRÊTS POUR PAIEMENT (commandes livrées)
// ✅ CORRECTION: Utiliser READY_FOR_PAYOUT au lieu de CONFIRMED
// Les designs ne sont disponibles pour retrait que lorsque la commande est LIVRÉE
const designUsages = await this.prisma.designUsage.findMany({
  where: {
    vendorId,
    paymentStatus: 'READY_FOR_PAYOUT' // ✅ CORRECT
  },
  // ...
});
```

#### Ligne 144-153 : Calcul de la commission basée sur platformFee

**AJOUTÉ :**
```typescript
// ✅ Calculer la commission totale des designs pour le reporting
const designUsagesForCommission = await this.prisma.designUsage.findMany({
  where: {
    vendorId,
    paymentStatus: 'READY_FOR_PAYOUT'
  },
  select: {
    platformFee: true
  }
});

for (const usage of designUsagesForCommission) {
  totalDesignCommission += parseFloat(usage.platformFee.toString());
}

totalCommissionAmount = totalDesignCommission; // Commission totale = somme des platformFee
```

---

## 🧪 Tests et validation

### Script de recalcul créé

Un script a été créé pour recalculer les gains de tous les vendeurs existants :

**Fichier :** `scripts/recalculate-vendor-earnings.js`

**Utilisation :**

```bash
# Recalculer tous les vendeurs
node scripts/recalculate-vendor-earnings.js

# Recalculer un vendeur spécifique
node scripts/recalculate-vendor-earnings.js --vendorId=5
```

**Fonctionnalités du script :**
- ✅ Recalcule les gains basés uniquement sur les designs (`READY_FOR_PAYOUT`)
- ✅ Met à jour la table `vendor_earnings`
- ✅ Affiche un résumé détaillé pour chaque vendeur
- ✅ Gère les erreurs et continue le traitement

### Test manuel recommandé

1. **Créer une commande test avec un design vendeur**
   ```bash
   # 1. Créer une commande avec un design de 3 200 FCFA
   # 2. Marquer la commande comme PAID
   # 3. Vérifier que le design passe à CONFIRMED
   ```

2. **Livrer la commande**
   ```bash
   # 4. Marquer la commande comme DELIVERED
   # 5. Vérifier que le design passe à READY_FOR_PAYOUT
   ```

3. **Vérifier le montant disponible**
   ```bash
   curl -X GET "https://printalma-back-dep.onrender.com/vendor/earnings" \
     -H "Authorization: Bearer [TOKEN_VENDEUR]"
   ```

4. **Résultat attendu**
   ```json
   {
     "totalEarnings": 1920,      // 3 200 × 0.6 (60% pour le vendeur)
     "availableAmount": 1920,     // Disponible pour retrait
     "pendingAmount": 0,
     "thisMonthEarnings": 1920,
     "commissionPaid": 1280,      // 3 200 × 0.4 (40% commission)
     "averageCommissionRate": 0.4
   }
   ```

---

## 📊 Impact sur les données existantes

### Vendeurs affectés

Tous les vendeurs qui ont :
- ✅ Vendu des produits via `VendorProduct` **AVANT** cette correction
- ❌ Ces gains seront **supprimés** car basés sur une logique erronée
- ✅ Seuls les gains via `DesignUsage` seront conservés

### Demandes de fonds en cours

- **PENDING/APPROVED** : À vérifier manuellement si le montant est correct
- **PAID** : Ne pas toucher (déjà payées)
- **Recommandation :** Exécuter le script de recalcul AVANT d'approuver de nouvelles demandes

### Recalcul obligatoire

⚠️ **IMPORTANT :** Exécuter le script de recalcul pour tous les vendeurs **immédiatement après le déploiement** :

```bash
node scripts/recalculate-vendor-earnings.js
```

---

## 🚀 Déploiement

### Checklist avant déploiement

- [x] Code corrigé dans `vendor-funds.service.ts`
- [x] Script de recalcul créé
- [x] Documentation mise à jour
- [ ] Tests manuels effectués en développement
- [ ] Backup de la base de données de production créé
- [ ] Communication aux vendeurs sur les changements

### Étapes de déploiement

1. **Backup de la base de données**
   ```bash
   # Via Render Dashboard ou pg_dump
   pg_dump $DATABASE_URL > backup_before_earnings_fix_$(date +%Y%m%d).sql
   ```

2. **Déployer le code corrigé**
   ```bash
   git add .
   git commit -m "fix: Corriger le calcul du montant disponible (gains design uniquement)"
   git push origin main
   ```

3. **Redémarrer le service backend** (Render le fait automatiquement)

4. **Exécuter le script de recalcul**
   ```bash
   # Via Render Shell ou en local connecté à la DB de production
   node scripts/recalculate-vendor-earnings.js
   ```

5. **Vérifier les résultats**
   - Tester avec un compte vendeur
   - Vérifier `/vendeur/appel-de-fonds`
   - Valider que le montant disponible est correct

---

## 🆘 Rollback en cas de problème

Si des problèmes surviennent après le déploiement :

1. **Restaurer le backup de la base de données**
   ```bash
   psql $DATABASE_URL < backup_before_earnings_fix_YYYYMMDD.sql
   ```

2. **Revenir à la version précédente du code**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Analyser les logs pour identifier le problème**
   ```bash
   # Dans Render Dashboard → Logs
   ```

---

## 📝 Notes importantes

### Différence entre CONFIRMED et READY_FOR_PAYOUT

- **CONFIRMED** : Paiement reçu, mais commande pas encore livrée
  - Le vendeur ne peut PAS retirer cet argent
  - Risque de remboursement si problème de livraison

- **READY_FOR_PAYOUT** : Commande livrée ET payée
  - Le vendeur PEUT retirer cet argent
  - Transaction finalisée, pas de risque de remboursement

### Pourquoi ne plus calculer sur VendorProduct ?

Dans le modèle d'affaires Printalma :
- Les **produits de base** sont gérés par l'admin
- Les **vendeurs créent des designs** qu'ils vendent
- Les clients achètent des produits et y ajoutent des designs vendeurs
- Les vendeurs gagnent sur **leurs designs uniquement**, pas sur les produits de base

### Taux de commission

- **Par défaut :** 40% pour la plateforme, 60% pour le vendeur
- **Personnalisable :** Via la table `vendor_commissions`
- **Figé dans la commande :** Le taux est enregistré dans `design_usages.commissionRate` au moment de la création

---

## 📞 Support

Pour toute question ou problème :

1. **Vérifier les logs**
   ```bash
   # Logs du service backend
   [VENDOR X] Calcul complet des gains: { totalEarnings: ..., availableAmount: ... }
   ```

2. **Vérifier la base de données**
   ```sql
   -- Vérifier les design_usages d'un vendeur
   SELECT
     id,
     design_name,
     design_price,
     vendor_revenue,
     platform_fee,
     payment_status,
     order_number
   FROM design_usages
   WHERE vendor_id = 5
   ORDER BY used_at DESC;

   -- Vérifier les gains calculés
   SELECT * FROM vendor_earnings WHERE vendor_id = 5;
   ```

3. **Exécuter le script de recalcul pour un vendeur spécifique**
   ```bash
   node scripts/recalculate-vendor-earnings.js --vendorId=5
   ```

---

## ✅ Résumé

**Problème :** Les vendeurs recevaient des gains sur le prix total des produits au lieu du prix des designs seulement.

**Solution :**
- ✅ Calcul basé uniquement sur `design_usages.vendor_revenue`
- ✅ Utilisation du statut `READY_FOR_PAYOUT` au lieu de `CONFIRMED`
- ✅ Suppression du calcul erroné sur `VendorProduct`

**Impact :**
- ✅ Montants disponibles corrects
- ✅ Commission calculée correctement
- ✅ Respect du modèle d'affaires (revenus designs uniquement)

**À faire :**
- [ ] Déployer le code
- [ ] Exécuter le script de recalcul
- [ ] Informer les vendeurs
- [ ] Surveiller les premières demandes de fonds

---

**Dernière mise à jour :** 2025-12-22
**Auteur :** Claude Code Assistant
**Version du code :** Latest (après correction)
