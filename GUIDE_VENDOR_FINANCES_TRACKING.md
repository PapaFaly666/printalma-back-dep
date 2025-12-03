# Guide : Système de suivi des fonds disponibles pour les appels de fonds

## Vue d'ensemble

Le système a été amélioré pour calculer **en temps réel** le montant disponible pour les appels de fonds d'un vendeur. Cette fonctionnalité garantit un contrôle précis et évite les demandes de retrait excessives.

## Nouvelle structure de réponse de l'endpoint `/orders/my-orders`

### Pour les VENDEURS uniquement

Lorsqu'un vendeur appelle l'endpoint `/orders/my-orders`, la réponse inclut désormais un nouvel objet `vendorFinances` :

```json
{
  "success": true,
  "message": "Vos commandes récupérées avec succès",
  "data": {
    "orders": [...],
    "statistics": {...},
    "vendorFinances": {
      // 💰 Montant total gagné par le vendeur (après déduction de la commission)
      "totalVendorAmount": 19791,

      // 💸 Montant déjà retiré (demandes PAYÉES)
      "withdrawnAmount": 5000,

      // ⏳ Montant en attente de retrait (demandes PENDING ou APPROVED)
      "pendingWithdrawalAmount": 3000,

      // ✅ Montant disponible pour un nouveau retrait
      "availableForWithdrawal": 11791,

      // 📈 Statistiques supplémentaires
      "deliveredOrdersCount": 5,
      "totalCommissionDeducted": 7209,

      // 📊 Résumé des demandes de fonds
      "fundsRequestsSummary": {
        "total": 10,
        "paid": 3,
        "pending": 2,
        "approved": 1,
        "rejected": 4
      },

      // 💬 Message d'information
      "message": "Vous avez 11 791 XOF disponibles pour retrait"
    }
  }
}
```

### Pour les CLIENTS

Les clients ne reçoivent pas l'objet `vendorFinances` dans la réponse.

## Formule de calcul

### `availableForWithdrawal` (Montant disponible pour retrait)

```
availableForWithdrawal = totalVendorAmount - withdrawnAmount - pendingWithdrawalAmount
```

Où :
- **`totalVendorAmount`** : Somme de tous les `vendorAmount` des commandes **LIVRÉES** et **PAYÉES**
- **`withdrawnAmount`** : Somme des montants des demandes de fonds avec statut `PAID`
- **`pendingWithdrawalAmount`** : Somme des montants des demandes de fonds avec statut `PENDING` ou `APPROVED`

## Validation lors de la création d'appel de fonds

Lors de la création d'une demande de fonds via `POST /vendor-funds/request`, le système :

1. ✅ Calcule le `availableForWithdrawal` en temps réel
2. ✅ Vérifie que `amount` demandé ≤ `availableForWithdrawal`
3. ❌ Rejette la demande si le montant est insuffisant avec un message clair :

```json
{
  "statusCode": 400,
  "message": "Solde insuffisant. Disponible: 11 791 FCFA, Demandé: 15 000 FCFA. Vous devez attendre que vos commandes soient livrées ou que vos demandes en attente soient traitées.",
  "error": "Bad Request"
}
```

## Exemple d'utilisation Frontend

### 1. Afficher le solde disponible

```typescript
// Récupérer les commandes et les finances du vendeur
const response = await fetch('/orders/my-orders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

if (data.data.vendorFinances) {
  const { availableForWithdrawal, message } = data.data.vendorFinances;

  // Afficher le solde disponible
  console.log(message); // "Vous avez 11 791 XOF disponibles pour retrait"

  // Afficher dans l'interface
  displayBalance(availableForWithdrawal); // 11791
}
```

### 2. Valider le formulaire d'appel de fonds

```typescript
// Avant de soumettre la demande
const requestedAmount = parseFloat(amountInput.value);
const { availableForWithdrawal } = vendorFinances;

if (requestedAmount > availableForWithdrawal) {
  showError(`Montant insuffisant ! Disponible : ${availableForWithdrawal.toLocaleString('fr-FR')} FCFA`);
  return;
}

// Soumettre la demande
await createFundsRequest(requestedAmount);
```

### 3. Afficher les statistiques détaillées

```typescript
const {
  totalVendorAmount,
  withdrawnAmount,
  pendingWithdrawalAmount,
  availableForWithdrawal,
  deliveredOrdersCount,
  totalCommissionDeducted,
  fundsRequestsSummary
} = data.data.vendorFinances;

// Afficher un dashboard des finances
const dashboard = {
  "Gains totaux (net)": `${totalVendorAmount.toLocaleString('fr-FR')} XOF`,
  "Déjà retiré": `${withdrawnAmount.toLocaleString('fr-FR')} XOF`,
  "En attente de retrait": `${pendingWithdrawalAmount.toLocaleString('fr-FR')} XOF`,
  "Disponible maintenant": `${availableForWithdrawal.toLocaleString('fr-FR')} XOF`,
  "Commandes livrées": deliveredOrdersCount,
  "Commission totale déduite": `${totalCommissionDeducted.toLocaleString('fr-FR')} XOF`,
  "Demandes de fonds": {
    "Total": fundsRequestsSummary.total,
    "Payées": fundsRequestsSummary.paid,
    "En attente": fundsRequestsSummary.pending,
    "Approuvées": fundsRequestsSummary.approved,
    "Rejetées": fundsRequestsSummary.rejected
  }
};
```

## Notes importantes

### 🔒 Sécurité et cohérence

1. **Calcul en temps réel** : Le montant disponible est recalculé à chaque appel de l'API pour garantir la cohérence
2. **Protection contre les retraits excessifs** : Le système empêche automatiquement les demandes de fonds supérieures au solde disponible
3. **Traçabilité complète** : Tous les calculs sont loggés pour audit

### ⚠️ Conditions pour qu'un montant soit disponible

Un `vendorAmount` est comptabilisé UNIQUEMENT si :
- ✅ La commande est **DELIVERED** (livrée)
- ✅ La commande est **PAID** (payée)
- ✅ Le champ `vendorAmount` n'est pas `null`

### 🔄 Cycle de vie d'un appel de fonds

1. **PENDING** : Demande créée, montant bloqué dans `pendingWithdrawalAmount`
2. **APPROVED** : Demande approuvée par l'admin, montant toujours bloqué
3. **PAID** : Argent transféré, montant déplacé vers `withdrawnAmount`
4. **REJECTED** : Demande rejetée, montant libéré et redevient disponible

## Exemple de scénario complet

### Scénario : Vendeur "Papa Faly"

#### État initial
- 5 commandes livrées et payées
- `totalVendorAmount` = 19 791 XOF
- Aucune demande de fonds encore

```json
{
  "totalVendorAmount": 19791,
  "withdrawnAmount": 0,
  "pendingWithdrawalAmount": 0,
  "availableForWithdrawal": 19791
}
```

#### Étape 1 : Première demande de fonds de 5000 XOF

```json
{
  "totalVendorAmount": 19791,
  "withdrawnAmount": 0,
  "pendingWithdrawalAmount": 5000,  // Bloqué
  "availableForWithdrawal": 14791   // Réduit
}
```

#### Étape 2 : Admin approuve et paie la demande

```json
{
  "totalVendorAmount": 19791,
  "withdrawnAmount": 5000,          // Transféré
  "pendingWithdrawalAmount": 0,     // Libéré
  "availableForWithdrawal": 14791   // Reste identique
}
```

#### Étape 3 : Nouvelle commande livrée (+ 6300 XOF de vendorAmount)

```json
{
  "totalVendorAmount": 26091,       // Augmenté
  "withdrawnAmount": 5000,
  "pendingWithdrawalAmount": 0,
  "availableForWithdrawal": 21091   // Augmenté
}
```

## Support et questions

Pour toute question ou problème :
- Consulter les logs avec le tag `[VENDOR {id}]`
- Vérifier la cohérence des données dans la table `vendor_funds_request`
- Contacter l'équipe backend pour assistance

---

**Date de création** : 02/12/2025
**Version** : 1.0
**Auteur** : Claude Code Assistant
