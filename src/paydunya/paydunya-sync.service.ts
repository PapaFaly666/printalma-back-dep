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
    paydunyaData?: any;
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

      this.logger.log(`PayDunya status for order ${orderId}: ${paydunyaStatus.status} → ${newStatus}`);

      // 5. Mettre à jour si nécessaire
      if (oldStatus !== newStatus) {
        await this.updateOrderWithPaydunyaData(order, paydunyaStatus, newStatus);

        this.logger.log(`Order ${orderId} synchronized: ${oldStatus} → ${newStatus}`);

        return {
          success: true,
          oldStatus,
          newStatus,
          message: `Status updated from ${oldStatus} to ${newStatus}`,
          paydunyaData: paydunyaStatus
        };
      }

      return {
        success: true,
        oldStatus,
        newStatus,
        message: `Status already up to date: ${newStatus}`,
        paydunyaData: paydunyaStatus
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
   * Met à jour la commande avec les informations PayDunya complètes
   */
  private async updateOrderWithPaydunyaData(order: any, paydunyaStatus: any, newStatus: string) {
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
        message: paydunyaStatus.response_text,
        category: 'paydunya_error',
        timestamp: new Date().toISOString()
      };
    } else {
      updateData.lastPaymentFailureReason = null;
      updateData.failureDetails = null;
    }

    // Ajouter des métadonnées PayDunya
    updateData.paydunyaMetadata = {
      responseCode: paydunyaStatus.response_code,
      responseText: paydunyaStatus.response_text,
      mode: paydunyaStatus.mode,
      receiptUrl: paydunyaStatus.receipt_url,
      customData: paydunyaStatus.custom_data,
      syncedAt: new Date().toISOString()
    };

    await this.prisma.order.update({
      where: { id: order.id },
      data: updateData
    });

    this.logger.log(`Order ${order.id} updated with PayDunya data: ${JSON.stringify({
      status: newStatus,
      responseCode: paydunyaStatus.response_code,
      amount: paydunyaStatus.invoice?.total_amount
    })}`);
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
        transactionId: { not: null }
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

  /**
   * Synchronise une commande spécifique par son numéro
   */
  async syncOrderByNumber(orderNumber: string): Promise<{
    success: boolean;
    oldStatus: string;
    newStatus: string;
    message: string;
    orderId: number;
    paydunyaData?: any;
  }> {
    // Récupérer la commande par son numéro
    const order = await this.prisma.order.findFirst({
      where: { orderNumber }
    });

    if (!order) {
      throw new Error(`Order ${orderNumber} not found`);
    }

    const result = await this.syncOrderWithPaydunyaStatus(order.id);

    return {
      ...result,
      orderId: order.id,
      paydunyaData: result.paydunyaData
    };
  }
}