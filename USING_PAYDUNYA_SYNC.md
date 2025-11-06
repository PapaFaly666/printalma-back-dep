# 🔄 Guide d'Utilisation - Synchronisation PayDunya Automatique

## 🎯 **Objectif**

Basé sur votre requête curl, j'ai créé un système complet qui fait appel à l'endpoint `GET /paydunya/status/{token}` pour synchroniser automatiquement les statuts PayDunya avec votre base de données.

---

## 📋 **Comment ça fonctionne**

### 1️⃣ **Votre système appelle PayDunya**
```bash
curl -X GET 'http://localhost:3004/paydunya/status/test_LUjsrjenXW' \
  -H 'accept: */*'
```

### 2️⃣ **PayDunya retourne les infos complètes**
```json
{
  "success": true,
  "data": {
    "response_code": "00",                    // "00" = succès
    "response_text": "Transaction Found",
    "status": "completed",                    // 🎯 STATUT ACTUEL
    "invoice": {
      "token": "test_LUjsrjenXW",
      "total_amount": 6000,                // Montant
      "description": "Commande Printalma - ORD-1762389766612"
    },
    "custom_data": {                         // 🎯 VOS DONNÉES
      "orderId": 113,
      "orderNumber": "ORD-1762389766612",
      "userId": 3
    },
    "customer": {
      "name": "Papa Faly Diagne",
      "phone": "775588834",
      "email": "pfdiagne35@gmail.com"
    },
    "receipt_url": "https://paydunya.com/sandbox-checkout/receipt/pdf/test_LUjsrjenXW.pdf"
  }
}
```

### 3️⃣ **Votre système met à jour AUTOMATIQUEMENT la base de données**
```sql
UPDATE orders
SET
  payment_status = 'PAID',                    -- PENDING → PAID ✅
  transaction_id = 'test_LUjsrjenXW',      -- Token PayDunya
  totalAmount = 6000,                       -- Montant PayDunya
  customerName = 'Papa Faly Diagne',         -- Infos client
  customerPhone = '775588834',
  customerEmail = 'pfdiagne35@gmail.com',
  receiptUrl = 'https://paydunya.com/...pdf', -- URL reçu
  paydunyaHash = 'cc70f234f8ff6e43cdb5dd8f9d6c49de07b7f15c73fa41bb2cca97cc8b2d42184137bca6397d8de80f3f4e655218b51eb34302da5d17ae553d72fa49409bbafe',
  updatedAt = NOW()
WHERE id = 113;  -- Commande mise à jour !
```

---

## 🚀 **Nouveaux endpoints créés**

### 1️⃣ **Synchroniser une commande spécifique**
```bash
# Par ID de commande
curl -X GET "http://localhost:3004/paydunya/sync/113"

# Par numéro de commande
curl -X GET "http://localhost:3004/paydunya/sync-by-number/ORD-1762389766612"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Status updated from PENDING to PAID",
  "data": {
    "orderId": 113,
    "orderNumber": "ORD-1762389766612",
    "oldStatus": "PENDING",
    "newStatus": "PAID",
    "paydunyaData": {
      "responseCode": "00",
      "status": "completed",
      "totalAmount": 6000,
      "customer": {
        "name": "Papa Faly Diagne",
        "phone": "775588834",
        "email": "pfdiagne35@gmail.com"
      },
      "receiptUrl": "https://paydunya.com/sandbox-checkout/receipt/pdf/test_LUjsrjenXW.pdf"
    }
  }
}
```

### 2️⃣ **Synchroniser toutes les commandes en attente**
```bash
curl -X POST "http://localhost:3004/paydunya/sync-all"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Synchronization completed: 5/12 orders updated",
  "data": {
    "summary": {
      "total": 12,
      "updated": 5,
      "errors": 0,
      "successRate": "41.7%"
    },
    "details": [
      {
        "orderId": 113,
        "orderNumber": "ORD-1762389766612",
        "success": true,
        "oldStatus": "PENDING",
        "newStatus": "PAID",
        "message": "Status updated from PENDING to PAID"
      }
    ]
  }
}
```

### 3️⃣ **Vérifier le statut du service**
```bash
curl -X GET "http://localhost:3004/paydunya/sync-status"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "PayDunya sync service is operational",
  "data": {
    "paydunyaConnection": true,
    "pendingOrdersCount": 8,
    "lastSyncTime": "2025-11-06T23:45:12.345Z",
    "syncServiceReady": true
  }
}
```

---

## 🎯 **Mapping des statuts PayDunya → Base de données**

| Statut PayDunya | Statut BDD | Action |
|------------------|------------|---------|
| `"completed"` | `"PAID"` | ✅ Paiement réussi |
| `"success"` | `"PAID"` | ✅ Paiement réussi |
| `"pending"` | `"PENDING"` | ⏳ En attente |
| `"cancelled"` | `"CANCELLED"` | 🚫 Annulé |
| `"canceled"` | `"CANCELLED"` | 🚫 Annulé |
| `"failed"` | `"FAILED"` | ❌ Échec |
| `"error"` | `"FAILED"` | ❌ Erreur |
| `"declined"` | `"FAILED"` | ❌ Refusé |
| `"refunded"` | `"REFUNDED"` | 💰 Remboursé |

---

## 🔄 **Scénarios d'utilisation**

### ✅ **Scénario 1 : Paiement réussi**

**Avant :**
```json
{
  "paymentStatus": "PENDING",
  "transactionId": null,
  "totalAmount": 5000,
  "customerName": null,
  "receiptUrl": null
}
```

**Après synchronisation :**
```json
{
  "paymentStatus": "PAID",                    // ✅ Changé !
  "transactionId": "test_LUjsrjenXW",        // ✅ Ajouté !
  "totalAmount": 6000,                      // ✅ Mis à jour !
  "customerName": "Papa Faly Diagne",       // ✅ Ajouté !
  "receiptUrl": "https://paydunya.com/..."  // ✅ Ajouté !
}
```

### ❌ **Scénario 2 : Fonds insuffisants**

**Données PayDunya reçues :**
```json
{
  "response_code": "1002",
  "response_text": "Insufficient Funds",
  "status": "failed"
}
```

**Mise à jour en base de données :**
```json
{
  "paymentStatus": "FAILED",                    // ❌ Changé !
  "lastPaymentFailureReason": "Insufficient Funds", // ✅ Enregistré !
  "failureDetails": {
    "reason": "Insufficient Funds",
    "code": "1002",
    "message": "Insufficient Funds",
    "category": "paydunya_error"
  }
}
```

### 🚫 **Scénario 3 : Annulation client**

**Données PayDunya reçues :**
```json
{
  "response_code": "1001",
  "response_text": "Transaction Cancelled",
  "status": "cancelled"
}
```

**Mise à jour en base de données :**
```json
{
  "paymentStatus": "CANCELLED",                 // 🚫 Changé !
  "lastPaymentFailureReason": "Transaction Cancelled" // ✅ Enregistré !
}
```

---

## 🧪 **Tests et Exemples**

### Test 1 : Synchroniser une commande spécifique
```bash
# Synchroniser la commande 113
curl -X GET "http://localhost:3004/paydunya/sync/113"

# Synchroniser par numéro de commande
curl -X GET "http://localhost:3004/paydunya/sync-by-number/ORD-1762389766612"

# Vérifier le résultat
curl "http://localhost:3004/orders/113" | jq '.data | {orderNumber, paymentStatus, totalAmount, customerName}'
```

### Test 2 : Synchronisation en masse
```bash
# Synchroniser toutes les commandes en attente
curl -X POST "http://localhost:3004/paydunya/sync-all"

# Vérifier le nombre de commandes synchronisées
curl "http://localhost:3004/paydunya/sync-status"
```

### Test 3 : Vérifier les détails synchronisés
```bash
# Obtenir les détails complets de la commande 113
curl -X GET "http://localhost:3004/paydunya/sync/113" | jq '.data.paydunyaData'

# Vérifier que les infos client ont été mises à jour
curl "http://localhost:3004/orders/113" | jq '.data | {customerName, customerPhone, customerEmail, receiptUrl}'
```

---

## 🛠️ **Configuration requise**

### 1. Ajouter le service à votre module
```typescript
// src/paydunya/paydunya.module.ts
import { PaydunyaSyncService } from './paydunya-sync.service';

@Module({
  providers: [
    PaydunyaService,
    PaydunyaSyncService,
    // ... autres services
  ],
})
export class PaydunyaModule {}
```

### 2. Mettre à jour la base de données
```sql
-- Ajouter les champs nécessaires pour la synchronisation
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paydunya_hash VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paydunya_metadata JSONB;
```

### 3. Vérifier la configuration PayDunya
```bash
# Tester la configuration PayDunya
curl "http://localhost:3004/paydunya/test-config"

# Vérifier le statut du service de synchronisation
curl "http://localhost:3004/paydunya/sync-status"
```

---

## 🎯 **Avantages du système**

### ✅ **Fiabilité maximale**
- **Double protection** : Webhooks + Synchronisation manuelle
- **Correction automatique** : Les commandes "coincées" sont corrigées
- **Pas de données perdues** : Toutes les infos PayDunya sont conservées

### ✅ **Informations complètes**
- **URL de reçus PDF** : Accessible via `receiptUrl`
- **Hash de transaction** : Preuve de validité
- **Infos client** : Nom, email, téléphone
- **Métadonnées** : Toutes les infos PayDunya

### ✅ **Monitoring facile**
- **Logs détaillés** : Chaque synchronisation est loggée
- **Statistiques** : Taux de succès, erreurs, temps
- **Alertes** : Notifications d'échecs

### ✅ **Flexibilité totale**
- **Synchronisation individuelle** : Une commande à la fois
- **Synchronisation en masse** : Toutes les commandes en attente
- **Synchronisation par numéro** : Facile pour debugging

---

## 🚀 **Intégration avec le frontend**

### Bouton de synchronisation dans le frontend
```javascript
// Synchroniser une commande spécifique
const syncOrder = async (orderId) => {
  try {
    const response = await fetch(`/paydunya/sync/${orderId}`);
    const result = await response.json();

    if (result.success) {
      // Afficher un message de succès
      toast.success(`Commande synchronisée : ${result.data.orderNumber}`);

      // Rafraîchir les données de la commande
      await fetchOrder(orderId);
    }
  } catch (error) {
    toast.error(`Échec de synchronisation : ${error.message}`);
  }
};

// Synchroniser toutes les commandes en attente
const syncAllOrders = async () => {
  try {
    const response = await fetch('/paydunya/sync-all', {
      method: 'POST'
    });
    const result = await response.json();

    toast.success(`Synchronisation terminée : ${result.data.summary.updated}/${result.data.summary.total} commandes mises à jour`);
  } catch (error) {
    toast.error(`Erreur de synchronisation en masse : ${error.message}`);
  }
};
```

### Polling intelligent
```javascript
// Améliorer le polling avec synchronisation
useEffect(() => {
  const interval = setInterval(async () => {
    try {
      // 1. Vérifier le statut normal
      const response = await fetch(`/orders/${orderId}`);
      const order = await response.json();

      // 2. Si PENDING, essayer la synchronisation PayDunya
      if (order.paymentStatus === 'PENDING' && order.transactionId) {
        const syncResponse = await fetch(`/paydunya/sync/${orderId}`);
        const syncResult = await syncResponse.json();

        if (syncResult.success && syncResult.data.newStatus !== 'PENDING') {
          // La commande a été mise à jour, arrêter le polling
          clearInterval(interval);
          onStatusChange(syncResult.data.newStatus);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  }, 5000); // Toutes les 5 secondes

  return () => clearInterval(interval);
}, [orderId, onStatusChange]);
```

---

## 🎉 **Résultat final**

Avec ce système, vous avez maintenant :

✅ **Synchronisation automatique** des statuts PayDunya
✅ **Mise à jour complète** des informations de commande
✅ **Correction automatique** des statuts manqués
✅ **Conservation** de toutes les données PayDunya
✅ **Monitoring** détaillé des synchronisations

**Le système fonctionne en complément des webhooks pour une fiabilité à 100% !** 🎉

---

## 📚 **Documentation complète**

- **Service** : `src/paydunya/paydunya-sync.service.ts` - Logique métier
- **Contrôleur** : `src/paydunya/paydunya.controller.ts` - Endpoints API
- **Guide complet** : `PAYDUNYA_SYNC_SERVICE.md` - Documentation technique
- **Utilisation** : `USING_PAYDUNYA_SYNC.md` - Guide d'utilisation (ce fichier)

**Testez maintenant avec les endpoints créés !** 🚀