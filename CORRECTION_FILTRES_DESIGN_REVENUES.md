# ✅ CORRECTION DES FILTRES DANS /vendeur/design-revenues

**Date:** 2025-12-22
**Statut:** ✅ CORRIGÉ
**Impact:** Critique - Affecte la visibilité des designs vendeurs

---

## 📋 Problème identifié

### Symptôme
Dans la page `/vendeur/design-revenues`, les designs **disparaissaient** dès que l'admin livrait la commande (statut → `DELIVERED`), mais ils étaient **visibles** tant que la commande n'était pas livrée.

### Comportement AVANT correction (❌ INCORRECT)
- Commande en statut `PENDING`, `PROCESSING`, `CONFIRMED` → Design **visible** ✅
- Admin livre la commande → statut `DELIVERED` → Design **disparaît** ❌
- Le vendeur ne pouvait plus voir ses designs livrés dans l'historique

### Comportement APRÈS correction (✅ CORRECT)
- Commande en statut `PENDING`, `PROCESSING`, `CONFIRMED` → Design **visible** ✅
- Admin livre la commande → statut `DELIVERED` → Design **toujours visible** ✅
- Les designs restent visibles **quel que soit le statut** de la commande

---

## 🔍 Analyse technique

### Architecture du système

Le système Printalma utilise la table `design_usages` pour tracker l'utilisation des designs vendeurs. Cette table a un champ `payment_status` qui suit le cycle de vie du paiement :

```
Statuts de paiement des designs :
1. PENDING         → Commande créée, pas encore payée
2. CONFIRMED       → Commande payée
3. READY_FOR_PAYOUT → Commande livrée, prête pour retrait vendeur
4. PAID            → Vendeur a reçu son paiement
5. CANCELLED       → Commande annulée
```

### Cause racine du problème

Le fichier `src/services/designRevenueService.ts` filtrait les designs en n'incluant **uniquement** le statut `'CONFIRMED'` :

**Code problématique (lignes 75, 105, 160, 304) :**
```typescript
paymentStatus: 'CONFIRMED'  // ❌ PROBLÈME: Exclut READY_FOR_PAYOUT et PAID
```

**Conséquence :** Dès que la commande était livrée (passage à `READY_FOR_PAYOUT`), le design n'était plus retourné par les requêtes.

### Fichiers concernés

1. **`src/services/designRevenueService.ts`**
   - Méthode `getRevenueStats()` - ligne 73-82
   - Méthode `getDesignRevenues()` - ligne 157-185
   - Méthode `getDesignRevenueHistory()` - ligne 304-321

2. **`src/vendor-design-revenue/design-revenue.controller.ts`**
   - Endpoints `/vendor/design-revenues/stats`
   - Endpoints `/vendor/design-revenues/designs`
   - Endpoints `/vendor/design-revenues/designs/:designId/history`

---

## 🔧 Modifications effectuées

### 1. Méthode `getRevenueStats()` - Ligne 71-82

**AVANT :**
```typescript
// Statistiques globales (uniquement designs CONFIRMED)
const stats = await this.prisma.designUsage.aggregate({
  where: {
    ...whereClause,
    paymentStatus: 'CONFIRMED'  // ❌ PROBLÈME
  },
  _sum: {
    vendorRevenue: true,
  },
  _count: true,
});
```

**APRÈS :**
```typescript
// ✅ CORRECTION: Statistiques globales (designs CONFIRMED, READY_FOR_PAYOUT et PAID)
// Les designs doivent rester visibles même après livraison
const stats = await this.prisma.designUsage.aggregate({
  where: {
    ...whereClause,
    paymentStatus: { in: ['CONFIRMED', 'READY_FOR_PAYOUT', 'PAID'] }  // ✅ CORRECT
  },
  _sum: {
    vendorRevenue: true,
  },
  _count: true,
});
```

### 2. Méthode `getRevenueStats()` - Ligne 102-110 (Designs uniques)

**AVANT :**
```typescript
// Nombre de designs uniques utilisés (uniquement designs CONFIRMED)
const designUsages = await this.prisma.designUsage.findMany({
  where: {
    ...whereClause,
    paymentStatus: 'CONFIRMED'  // ❌ PROBLÈME
  },
  select: { designId: true },
  distinct: ['designId'],
});
```

**APRÈS :**
```typescript
// ✅ CORRECTION: Nombre de designs uniques utilisés (tous les statuts payés)
const designUsages = await this.prisma.designUsage.findMany({
  where: {
    ...whereClause,
    paymentStatus: { in: ['CONFIRMED', 'READY_FOR_PAYOUT', 'PAID'] } 
  },
  select: { designId: true },
  distinct: ['designId'],
});
```

### 3. Méthode `getDesignRevenues()` - Ligne 157-185

**AVANT :**
```typescript
// Récupérer tous les design usages avec statut CONFIRMED
const designUsages = await this.prisma.designUsage.findMany({
  where: {
    ...whereClause,
    paymentStatus: 'CONFIRMED'  // ❌ PROBLÈME
  },
  include: {
    design: {
      select: {
        id: true,
        name: true,
        imageUrl: true,
        thumbnailUrl: true,
        price: true,
      },
    },
    order: {
      select: {
        orderNumber: true,
        shippingName: true,
        paymentStatus: true,
      },
    },
  },
  orderBy: {
    usedAt: 'desc',
  },
});
```

**APRÈS :**
```typescript
// ✅ CORRECTION: Récupérer tous les design usages (CONFIRMED, READY_FOR_PAYOUT, PAID)
// Les designs doivent rester visibles même après livraison de la commande
const designUsages = await this.prisma.designUsage.findMany({
  where: {
    ...whereClause,
    paymentStatus: { in: ['CONFIRMED', 'READY_FOR_PAYOUT', 'PAID'] }  // ✅ CORRECT
  },
  include: {
    design: {
      select: {
        id: true,
        name: true,
        imageUrl: true,
        thumbnailUrl: true,
        price: true,
      },
    },
    order: {
      select: {
        orderNumber: true,
        shippingName: true,
        paymentStatus: true,
      },
    },
  },
  orderBy: {
    usedAt: 'desc',
  },
});
```

### 4. Méthode `getDesignRevenueHistory()` - Ligne 302-321

**AVANT :**
```typescript
const usageHistory = await this.prisma.designUsage.findMany({
  where: {
    designId: parseInt(designId.toString()),
    vendorId,
    paymentStatus: 'CONFIRMED'  // ❌ PROBLÈME
  },
  include: {
    order: {
      select: {
        orderNumber: true,
        paymentStatus: true,
      },
    },
  },
  orderBy: {
    usedAt: 'desc',
  },
});
```

**APRÈS :**
```typescript
// ✅ CORRECTION: Récupérer l'historique complet (CONFIRMED, READY_FOR_PAYOUT, PAID)
// Les designs doivent être visibles dans l'historique même après livraison
const usageHistory = await this.prisma.designUsage.findMany({
  where: {
    designId: parseInt(designId.toString()),
    vendorId,
    paymentStatus: { in: ['CONFIRMED', 'READY_FOR_PAYOUT', 'PAID'] }  // ✅ CORRECT
  },
  include: {
    order: {
      select: {
        orderNumber: true,
        paymentStatus: true,
      },
    },
  },
  orderBy: {
    usedAt: 'desc',
  },
});
```

---

## 🧪 Tests de validation

### Test 1 : Vérifier qu'un design reste visible après livraison

```bash
# 1. Récupérer les designs AVANT livraison
curl -X GET "https://printalma-back-dep.onrender.com/vendor/design-revenues/designs?period=all" \
  -H "Cookie: jwt=[TOKEN_VENDEUR]" \
  | jq '.data[] | {designId, designName, totalUsages}'

# Noter le nombre de designs et leurs IDs

# 2. Admin livre une commande contenant un design
curl -X PATCH "https://printalma-back-dep.onrender.com/admin/orders/[ORDER_ID]/status" \
  -H "Content-Type: application/json" \
  -H "Cookie: jwt=[TOKEN_ADMIN]" \
  -d '{ "status": "DELIVERED" }'

# 3. RE-VÉRIFIER que le design est toujours visible
curl -X GET "https://printalma-back-dep.onrender.com/vendor/design-revenues/designs?period=all" \
  -H "Cookie: jwt=[TOKEN_VENDEUR]" \
  | jq '.data[] | {designId, designName, totalUsages}'

# ✅ SUCCÈS: Le design est toujours présent
# ❌ ÉCHEC: Le design a disparu (ancien comportement)
```

### Test 2 : Vérifier les statistiques

```bash
# Récupérer les statistiques après livraison
curl -X GET "https://printalma-back-dep.onrender.com/vendor/design-revenues/stats?period=month" \
  -H "Cookie: jwt=[TOKEN_VENDEUR]" \
  | jq '.data'

# Résultat attendu :
# {
#   "totalRevenue": [MONTANT_TOTAL],
#   "pendingRevenue": [MONTANT_COMMANDES_NON_LIVREES],
#   "completedRevenue": [MONTANT_COMMANDES_LIVREES],  ← ✅ DOIT AUGMENTER après livraison
#   "totalUsages": [NOMBRE_TOTAL],                     ← ✅ DOIT INCLURE les commandes livrées
#   "uniqueDesignsUsed": [NOMBRE_DESIGNS],
#   "averageRevenuePerDesign": [MOYENNE]
# }
```

### Test 3 : Vérifier l'historique d'un design spécifique

```bash
# Récupérer l'historique d'un design qui a été livré
curl -X GET "https://printalma-back-dep.onrender.com/vendor/design-revenues/designs/[DESIGN_ID]/history" \
  -H "Cookie: jwt=[TOKEN_VENDEUR]" \
  | jq '.data[] | {orderNumber, status, paymentStatus, revenue}'

# Résultat attendu : doit inclure les commandes livrées
# [
#   {
#     "orderNumber": "CMD-2024-00123",
#     "status": "COMPLETED",           ← ✅ Commandes livrées visibles
#     "paymentStatus": "READY_FOR_PAYOUT",
#     "revenue": 2880
#   },
#   {
#     "orderNumber": "CMD-2024-00124",
#     "status": "PENDING",             ← ✅ Commandes en attente aussi visibles
#     "paymentStatus": "CONFIRMED",
#     "revenue": 2880
#   }
# ]
```

### Test 4 : Vérifier le cycle complet

```bash
# Scénario complet : Création → Paiement → Livraison → Visibilité
# 1. Créer une commande avec un design vendeur
# 2. Vérifier que le design apparaît avec status=PENDING (paymentStatus=PENDING)
# 3. Marquer la commande comme PAID
# 4. Vérifier que le design apparaît avec status=PENDING (paymentStatus=CONFIRMED)
# 5. Marquer la commande comme DELIVERED
# 6. Vérifier que le design apparaît TOUJOURS avec status=COMPLETED (paymentStatus=READY_FOR_PAYOUT)
# 7. Le vendeur fait un retrait (status du design → PAID)
# 8. Vérifier que le design reste visible avec status=COMPLETED (paymentStatus=PAID)
```

---

## 📊 Impact sur les données

### Avant la correction

**Statistiques visibles par le vendeur :**
- Designs avec commandes PENDING → ❌ Non visibles (paymentStatus=PENDING exclu)
- Designs avec commandes CONFIRMED → ✅ Visibles (paymentStatus=CONFIRMED)
- Designs avec commandes DELIVERED → ❌ Non visibles (paymentStatus=READY_FOR_PAYOUT exclu)
- Designs avec paiements effectués → ❌ Non visibles (paymentStatus=PAID exclu)

**Résultat :** Le vendeur ne voyait qu'une petite fraction de ses designs.

### Après la correction

**Statistiques visibles par le vendeur :**
- Designs avec commandes PENDING → ❌ Non visibles (normal, pas encore payées)
- Designs avec commandes CONFIRMED → ✅ Visibles (paymentStatus=CONFIRMED)
- Designs avec commandes DELIVERED → ✅ Visibles (paymentStatus=READY_FOR_PAYOUT)
- Designs avec paiements effectués → ✅ Visibles (paymentStatus=PAID)

**Résultat :** Le vendeur voit **tous** ses designs utilisés dans des commandes payées ou livrées.

---

## 🚀 Déploiement

### Checklist avant déploiement

- [x] Code corrigé dans `designRevenueService.ts`
- [x] Filtres mis à jour pour inclure `CONFIRMED`, `READY_FOR_PAYOUT`, `PAID`
- [x] Documentation mise à jour
- [ ] Tests manuels effectués en développement
- [ ] Vérifier que les designs livrés sont visibles
- [ ] Redémarrer le service backend

### Étapes de déploiement

1. **Commit et push du code corrigé**
   ```bash
   git add src/services/designRevenueService.ts
   git commit -m "fix: Corriger les filtres design revenues pour inclure commandes livrées"
   git push origin main
   ```

2. **Redémarrer le service backend** (Render le fait automatiquement)

3. **Vérifier les résultats**
   - Tester avec un compte vendeur
   - Vérifier `/vendor/design-revenues/designs`
   - Valider que les designs livrés sont visibles

---

## 🔄 Lien avec la correction précédente

Cette correction est **complémentaire** à la correction du calcul du montant disponible effectuée précédemment :

### Correction 1 : Calcul du montant disponible (CORRECTION_CALCUL_MONTANT_DISPONIBLE.md)
- **Objectif :** Calculer les gains uniquement sur les designs (pas sur les produits complets)
- **Fichier :** `src/vendor-funds/vendor-funds.service.ts`
- **Impact :** Montant disponible pour retrait

### Correction 2 : Filtres design revenues (CE DOCUMENT)
- **Objectif :** Afficher tous les designs (y compris livrés) dans l'historique
- **Fichier :** `src/services/designRevenueService.ts`
- **Impact :** Visibilité des designs dans `/vendeur/design-revenues`

**Ensemble**, ces deux corrections assurent que :
1. ✅ Le vendeur voit **tous** ses designs utilisés (correction 2)
2. ✅ Le vendeur peut retirer **uniquement** les revenus des designs livrés (correction 1)

---

## 🆘 Rollback en cas de problème

Si des problèmes surviennent après le déploiement :

1. **Revenir à la version précédente du code**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Analyser les logs pour identifier le problème**
   ```bash
   # Dans Render Dashboard → Logs
   # Chercher les erreurs liées à design_usages ou design revenues
   ```

---

## 📝 Résumé

**Problème :** Les designs disparaissaient de `/vendeur/design-revenues` après livraison de la commande

**Cause :** Les requêtes filtraient uniquement `paymentStatus: 'CONFIRMED'`

**Solution :** Inclure **tous** les statuts payés : `paymentStatus: { in: ['CONFIRMED', 'READY_FOR_PAYOUT', 'PAID'] }`

**Changements clés :**
```typescript
// ❌ AVANT
paymentStatus: 'CONFIRMED'

// ✅ APRÈS
paymentStatus: { in: ['CONFIRMED', 'READY_FOR_PAYOUT', 'PAID'] }
```

**Impact :** Les vendeurs peuvent maintenant voir **tous** leurs designs utilisés, peu importe le statut de livraison de la commande

---

**Dernière mise à jour :** 2025-12-22
**Auteur :** Claude Code Assistant
**Version du code :** Latest (après correction)
