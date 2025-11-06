# 🔄 Service de Synchronisation Automatique PayDunya

## 🎯 **Objectif**

Créer un service qui fait appel à l'endpoint `GET /paydunya/status/{token}` pour synchroniser automatiquement les statuts PayDunya avec votre base de données.

---

## 📊 **Analyse de la réponse PayDunya**

### Structure complète des données reçues
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "response_code": "00",                    // "00" = succès
    "response_text": "Transaction Found",     // Message de PayDunya
    "hash": "cc70f234f8ff6e43cdb5dd8f9d6c49de07b7f15c73fa41bb2cca97cc8b2d42184137bca6397d8de80f3f4e655218b51eb34302da5d17ae553d72fa49409bbafe",
    "invoice": {
      "token": "test_LUjsrjenXW",          // Token PayDunya
      "items": {},
      "taxes": {},
      "total_amount": 6000,                // Montant en FCFA
      "description": "Commande Printalma - ORD-1762389766612"
    },
    "custom_data": {                         // 🎯 VOS DONNÉES PERSONNALISÉES
      "orderId": 113,
      "orderNumber": "ORD-1762389766612",
      "userId": 3
    },
    "actions": {
      "cancel_url": "http://localhost:3004/payment/cancel",
      "callback_url": "",
      "return_url": ""
    },
    "mode": "test",                         // Mode test/production
    "status": "completed",                    // 🎯 STATUT ACTUEL
    "customer": {
      "name": "Papa Faly Diagne",
      "phone": "775588834",
      "email": "pfdiagne35@gmail.com"
    },
    "receipt_url": "https://paydunya.com/sandbox-checkout/receipt/pdf/test_LUjsrjenXW.pdf"
  }
}
```

---

## 🔄 **Mapping Statuts PayDunya → Base de Données**

| Statut PayDunya | Statut Base de Données | Action |
|------------------|------------------------|---------|
| `"completed"` | `"PAID"` | ✅ Paiement réussi |
| `"pending"` | `"PENDING"` | ⏳ En attente |
| `"cancelled"` | `"CANCELLED"` | 🚫 Annulé |
| `"failed"` | `"FAILED"` | ❌ Échec |
| `"refunded"` | `"REFUNDED"` | 💰 Remboursé |

---

## 🛠️ **Service de Synchronisation**

### 1. Création du service
```typescript
// src/paydunya/paydunya-sync.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PaydunyaService } from './paydunya.service';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PaydunyaSyncService {
  private readonly logger = new Logger(PaydunyaSyncService.name);

  constructor(
    private readonly paydunyaService: PaydunyaService,
    private readonly orderService: OrderService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Synchronise une commande avec le statut PayDunya
   */
  async syncOrderWithPaydunyaStatus(orderId: number): Promise<{
    success: boolean;
    oldStatus: string;
    newStatus: string;
    message: string;
  }> {
    try {
      // 1. Récupérer la commande
      const order = await this.prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // 2. Extraire le token PayDunya
      const paydunyaToken = this.extractPaydunyaToken(order);
      if (!paydunyaToken) {
        throw new Error(`No PayDunya token found for order ${orderId}`);
      }

      // 3. Appeler l'endpoint statut PayDunya
      const paydunyaStatus = await this.paydunyaService.confirmPayment(paydunyaToken);

      // 4. Déterminer le nouveau statut
      const newStatus = this.mapPaydunyaStatusToOrderStatus(paydunyaStatus);
      const oldStatus = order.paymentStatus;

      // 5. Mettre à jour si nécessaire
      if (oldStatus !== newStatus) {
        await this.updateOrderStatus(order, paydunyaStatus, newStatus);

        this.logger.log(`Order ${orderId} synchronized: ${oldStatus} → ${newStatus}`);

        return {
          success: true,
          oldStatus,
          newStatus,
          message: `Status updated from ${oldStatus} to ${newStatus}`
        };
      }

      return {
        success: true,
        oldStatus,
        newStatus,
        message: `Status already up to date: ${newStatus}`
      };

    } catch (error) {
      this.logger.error(`Failed to sync order ${orderId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extrait le token PayDunya depuis les données de la commande
   */
  private extractPaydunyaToken(order: any): string | null {
    // Essayer plusieurs sources pour trouver le token
    return order.transactionId ||
           order.paydunyaToken ||
           order.paymentToken ||
           null;
  }

  /**
   * Map le statut PayDunya vers le statut de commande
   */
  private mapPaydunyaStatusToOrderStatus(paydunyaStatus: any): string {
    const status = paydunyaStatus.status?.toLowerCase();

    switch (status) {
      case 'completed':
      case 'success':
        return 'PAID';

      case 'pending':
        return 'PENDING';

      case 'cancelled':
      case 'canceled':
        return 'CANCELLED';

      case 'failed':
      case 'error':
      case 'declined':
        return 'FAILED';

      case 'refunded':
        return 'REFUNDED';

      default:
        return 'PENDING';
    }
  }

  /**
   * Met à jour la commande avec les informations PayDunya
   */
  private async updateOrderStatus(order: any, paydunyaStatus: any, newStatus: string) {
    const updateData: any = {
      paymentStatus: newStatus,
      updatedAt: new Date(),
      lastPaymentAttemptAt: new Date(),
      paymentAttempts: (order.paymentAttempts || 0) + 1
    };

    // Ajouter les informations PayDunya
    if (paydunyaStatus.hash) {
      updateData.paydunyaHash = paydunyaStatus.hash;
    }

    if (paydunyaStatus.invoice?.total_amount) {
      updateData.totalAmount = paydunyaStatus.invoice.total_amount;
    }

    if (paydunyaStatus.receipt_url) {
      updateData.receiptUrl = paydunyaStatus.receipt_url;
    }

    // Mettre à jour les infos client si disponibles
    if (paydunyaStatus.customer) {
      updateData.customerName = paydunyaStatus.customer.name;
      updateData.customerPhone = paydunyaStatus.customer.phone;
      updateData.customerEmail = paydunyaStatus.customer.email;
    }

    // Gérer les détails d'échec
    if (newStatus === 'FAILED') {
      updateData.lastPaymentFailureReason = paydunyaStatus.response_text;
      updateData.failureDetails = {
        reason: paydunyaStatus.response_text,
        code: paydunyaStatus.response_code,
        timestamp: new Date().toISOString()
      };
    } else {
      updateData.lastPaymentFailureReason = null;
      updateData.failureDetails = null;
    }

    await this.prisma.order.update({
      where: { id: order.id },
      data: updateData
    });
  }

  /**
   * Synchronise toutes les commandes en attente
   */
  async syncAllPendingOrders(): Promise<{
    total: number;
    updated: number;
    errors: number;
    details: Array<{
      orderId: number;
      orderNumber: string;
      success: boolean;
      oldStatus: string;
      newStatus: string;
      message: string;
    }>;
  }> {
    // Récupérer toutes les commandes avec un statut PENDING
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        paymentStatus: 'PENDING',
        transactionId: { not: null } // Seulement celles avec un token PayDunya
      }
    });

    const results = [];
    let updated = 0;
    let errors = 0;

    for (const order of pendingOrders) {
      try {
        const result = await this.syncOrderWithPaydunyaStatus(order.id);
        if (result.oldStatus !== result.newStatus) {
          updated++;
        }
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: true,
          oldStatus: result.oldStatus,
          newStatus: result.newStatus,
          message: result.message
        });
      } catch (error) {
        errors++;
        results.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          oldStatus: order.paymentStatus,
          newStatus: order.paymentStatus,
          message: error.message
        });
      }
    }

    this.logger.log(`Sync completed: ${pendingOrders.length} pending orders, ${updated} updated, ${errors} errors`);

    return {
      total: pendingOrders.length,
      updated,
      errors,
      details: results
    };
  }
}
```

---

## 🎮 **Endpoint de synchronisation**

### Ajouter au contrôleur PayDunya
```typescript
// src/paydunya/paydunya.controller.ts

@Get('sync/:orderId')
@ApiOperation({ summary: 'Synchronize order with PayDunya status' })
@ApiResponse({ status: 200, description: 'Order synchronized successfully' })
async syncOrderStatus(
  @Param('orderId') orderId: string,
) {
  try {
    const orderIdNum = parseInt(orderId);
    const result = await this.paydunyaSyncService.syncOrderWithPaydunyaStatus(orderIdNum);

    return {
      success: true,
      message: result.message,
      data: {
        orderId: orderIdNum,
        oldStatus: result.oldStatus,
        newStatus: result.newStatus
      }
    };
  } catch (error) {
    throw new BadRequestException(error.message);
  }
}

@Post('sync-all')
@ApiOperation({ summary: 'Synchronize all pending orders with PayDunya' })
@ApiResponse({ status: 200, description: 'All orders synchronized' })
async syncAllPendingOrders() {
  const result = await this.paydunyaSyncService.syncAllPendingOrders();

  return {
    success: true,
    message: `Synchronization completed: ${result.updated}/${result.total} orders updated`,
    data: result
  };
}
```

---

## 🧪 **Utilisation**

### 1. Synchroniser une commande spécifique
```bash
curl -X GET "http://localhost:3004/paydunya/sync/113"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Status updated from PENDING to PAID",
  "data": {
    "orderId": 113,
    "oldStatus": "PENDING",
    "newStatus": "PAID"
  }
}
```

### 2. Synchroniser toutes les commandes en attente
```bash
curl -X POST "http://localhost:3004/paydunya/sync-all"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Synchronization completed: 3/5 orders updated",
  "data": {
    "total": 5,
    "updated": 3,
    "errors": 0,
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

### 3. Synchronisation automatique toutes les 5 minutes
```typescript
// src/paydunya/paydunya-sync.scheduler.ts
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PaydunyaSyncService } from './paydunya-sync.service';

@Injectable()
export class PaydunyaSyncScheduler {
  constructor(private readonly syncService: PaydunyaSyncService) {}

  @Cron('0 */5 * * * *') // Toutes les 5 minutes
  async syncPendingOrders() {
    console.log('⏰ Starting automatic PayDunya sync...');

    try {
      const result = await this.syncService.syncAllPendingOrders();
      console.log(`✅ Sync completed: ${result.updated}/${result.total} orders updated`);
    } catch (error) {
      console.error('❌ Sync failed:', error.message);
    }
  }
}
```

---

## 🎯 **Avantages du système**

### ✅ **Synchronisation automatique**
- Plus besoin d'attendre les webhooks
- Mise à jour proactive des statuts
- Correction des statuts manqués

### ✅ **Récupération automatique**
- Les commandes "coincées" sont corrigées
- Les paiements en attente sont suivis
- Les erreurs de synchronisation sont gérées

### ✅ **Informations complètes**
- Tous les détails PayDunya sont conservés
- URL de reçus PDF sauvegardées
- Informations client mises à jour

### ✅ **Monitoring facile**
- Logs détaillés de chaque synchronisation
- Statistiques de synchronisation
- Rapports d'erreurs

---

## 🚀 **Intégration complète**

### 1. Ajouter le service à votre module
```typescript
// src/paydunya/paydunya.module.ts
import { PaydunyaSyncService } from './paydunya-sync.service';
import { PaydunyaSyncScheduler } from './paydunya-sync.scheduler';

@Module({
  providers: [
    PaydunyaService,
    PaydunyaSyncService,
    PaydunyaSyncScheduler,
    // ... autres providers
  ],
})
export class PaydunyaModule {}
```

### 2. Mettre à jour la base de données
```sql
-- Ajouter les champs nécessaires
ALTER TABLE orders ADD COLUMN paydunya_hash VARCHAR(255);
ALTER TABLE orders ADD COLUMN receipt_url TEXT;
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN customer_phone VARCHAR(50);
ALTER TABLE orders ADD COLUMN customer_email VARCHAR(255);
```

### 3. Utiliser dans votre frontend
```javascript
// Appel de synchronisation manuelle depuis le frontend
const syncOrder = async (orderId) => {
  try {
    const response = await fetch(`/paydunya/sync/${orderId}`);
    const result = await response.json();

    if (result.success) {
      // Rafraîchir les données de la commande
      await fetchOrder(orderId);
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
```

---

## 🎉 **Résultat final**

Avec ce système, vous pouvez :
- ✅ **Synchroniser manuellement** une commande avec `GET /paydunya/sync/{id}`
- ✅ **Synchroniser automatiquement** toutes les commandes en attente
- ✅ **Corriger les statuts manqués** lors des pannes de webhooks
- ✅ **Conserver toutes les infos PayDunya** (reçus, clients, etc.)
- ✅ **Surveiller** facilement les synchronisations

**Le système fonctionne en complément des webhooks pour une fiabilité 100% !** 🚀