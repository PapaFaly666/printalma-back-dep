import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { PaydunyaService } from './paydunya.service';
import { OrderService } from '../order/order.service';

/**
 * Service de vérification automatique des paiements PayDunya
 *
 * Ce service utilise un cron job pour vérifier périodiquement
 * le statut des paiements en attente et mettre à jour automatiquement
 * les commandes dans la base de données.
 *
 * Cas d'usage:
 * - Webhooks non reçus (problème réseau, firewall, etc.)
 * - Vérification de sécurité supplémentaire
 * - Synchronisation automatique des statuts
 */
@Injectable()
export class PaydunyaCronService implements OnModuleInit {
  private readonly logger = new Logger(PaydunyaCronService.name);
  private isRunning = false;

  constructor(
    private prisma: PrismaService,
    private paydunyaService: PaydunyaService,
    private orderService: OrderService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.logger.log('🚀 PaydunyaCronService initialized - cron job should start automatically');
  }

  onModuleInit() {
    this.logger.log('🔧 Module initialized - starting automatic payment check every 15 seconds');

    // Utiliser directement setInterval comme solution fiable
    this.logger.log('🔄 Starting payment check interval (every 15 seconds)...');

    setInterval(() => {
      this.logger.log('⏰ AUTOMATIC PAYMENT CHECK - ' + new Date().toISOString());
      this.checkPendingPayments();
    }, 15000); // 15 secondes

    this.logger.log('✅ Automatic payment checker started successfully');
  }

  /**
   * Méthode de vérification des paiements PayDunya
   * Appelée automatiquement toutes les 15 secondes
   */
  async checkPendingPayments() {
    // LOG IMMÉDIAT pour vérifier que le cron s'exécute
    this.logger.log('⏰ CRON JOB EXÉCUTÉ - ' + new Date().toISOString());

    // Éviter les exécutions simultanées
    if (this.isRunning) {
      this.logger.warn('Previous cron job still running, skipping this execution');
      return;
    }

    this.isRunning = true;

    try {
      this.logger.log('🔄 Starting PayDunya payment status check cron job');

      // Récupérer toutes les commandes PayDunya en attente
      // avec une date de création récente (dernières 24h par défaut)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const pendingOrders = await this.prisma.order.findMany({
        where: {
          paymentMethod: 'PAYDUNYA',
          paymentStatus: 'PENDING',
          status: 'PENDING',
          createdAt: {
            gte: twentyFourHoursAgo, // Seulement les commandes récentes
          },
        },
        select: {
          id: true,
          orderNumber: true,
          transactionId: true,
          totalAmount: true,
          createdAt: true,
          email: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (pendingOrders.length === 0) {
        this.logger.log('✅ No pending PayDunya payments found');
        return;
      }

      this.logger.log(`📊 Found ${pendingOrders.length} pending PayDunya payment(s) to check`);

      let checkedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      // Vérifier chaque commande
      for (const order of pendingOrders) {
        try {
          // Chercher le token PayDunya dans les PaymentAttempt
          const paymentAttempt = await this.prisma.paymentAttempt.findFirst({
            where: {
              orderId: order.id,
              paymentMethod: 'paydunya',
            },
            orderBy: {
              attemptedAt: 'desc',
            },
            select: {
              paytechToken: true,
            },
          });

          // Si pas de token trouvé, utiliser transactionId de la commande
          const token = paymentAttempt?.paytechToken || order.transactionId;

          if (!token) {
            this.logger.warn(
              `⚠️  Order ${order.orderNumber}: No PayDunya token found, skipping`,
            );
            continue;
          }

          // Vérifier le statut auprès de PayDunya
          this.logger.log(`🔍 Checking payment status for order ${order.orderNumber} (token: ${token})`);

          let paymentStatus;
          try {
            paymentStatus = await this.paydunyaService.confirmPayment(token);
          } catch (networkError) {
            // En cas d'erreur réseau, on log et on continue avec les autres commandes
            this.logger.warn(
              `⚠️  Network error while checking ${order.orderNumber}, will retry on next cron execution: ${networkError.message}`,
            );
            errorCount++;
            continue; // Passer à la commande suivante
          }

          checkedCount++;

          // Vérifier si le statut a changé
          if (paymentStatus.status === 'completed' && paymentStatus.response_code === '00') {
            // Paiement réussi !
            this.logger.log(
              `✅ Order ${order.orderNumber}: Payment COMPLETED, updating database`,
            );

            await this.orderService.updateOrderPaymentStatus(
              order.orderNumber,
              'PAID',
              token,
              null,
              1,
            );

            updatedCount++;

            this.logger.log(
              `✅ Order ${order.orderNumber}: Successfully updated to PAID/CONFIRMED`,
            );
          } else if (paymentStatus.status === 'cancelled' || paymentStatus.status === 'failed') {
            // Paiement échoué ou annulé
            this.logger.log(
              `❌ Order ${order.orderNumber}: Payment ${paymentStatus.status.toUpperCase()}, updating database`,
            );

            await this.orderService.updateOrderPaymentStatus(
              order.orderNumber,
              'FAILED',
              token,
              {
                reason: paymentStatus.status === 'cancelled' ? 'user_cancelled' : 'payment_failed',
                category: paymentStatus.status === 'cancelled' ? 'user_action' : 'technical_error',
                message: `Payment ${paymentStatus.status} - Auto-detected by cron job`,
              },
              1,
            );

            updatedCount++;

            this.logger.log(
              `✅ Order ${order.orderNumber}: Successfully updated to FAILED`,
            );
          } else {
            // Toujours en attente
            this.logger.log(
              `⏳ Order ${order.orderNumber}: Still pending (status: ${paymentStatus.status})`,
            );
          }
        } catch (error) {
          errorCount++;
          this.logger.error(
            `❌ Error checking order ${order.orderNumber}: ${error.message}`,
            error.stack,
          );
        }
      }

      // Résumé de l'exécution
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log('📊 PayDunya Cron Job Summary:');
      this.logger.log(`   Total pending orders: ${pendingOrders.length}`);
      this.logger.log(`   Checked: ${checkedCount}`);
      this.logger.log(`   Updated: ${updatedCount}`);
      this.logger.log(`   Errors: ${errorCount}`);
      this.logger.log(`   Skipped: ${pendingOrders.length - checkedCount}`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
      this.logger.error('❌ Fatal error in PayDunya cron job:', error.message, error.stack);
    } finally {
      this.isRunning = false;
      this.logger.log('✅ PayDunya payment status check cron job completed');
    }
  }

  /**
   * Méthode manuelle pour forcer la vérification
   * Utile pour les tests ou les appels manuels
   */
  async forceCheckAllPendingPayments() {
    this.logger.log('🔧 Manual check triggered');
    await this.checkPendingPayments();
  }

  /**
   * Vérifier une commande spécifique
   *
   * @param orderNumber Numéro de la commande
   * @returns true si mise à jour effectuée
   */
  async checkSpecificOrder(orderNumber: string): Promise<boolean> {
    try {
      this.logger.log(`🔍 Manual check for order: ${orderNumber}`);

      const order = await this.prisma.order.findFirst({
        where: { orderNumber },
        select: {
          id: true,
          orderNumber: true,
          paymentStatus: true,
          paymentMethod: true,
          transactionId: true,
        },
      });

      if (!order) {
        throw new Error(`Order ${orderNumber} not found`);
      }

      if (order.paymentMethod !== 'PAYDUNYA') {
        throw new Error(`Order ${orderNumber} is not a PayDunya payment`);
      }

      if (order.paymentStatus !== 'PENDING') {
        this.logger.log(`Order ${orderNumber} is already ${order.paymentStatus}`);
        return false;
      }

      // Chercher le token
      const paymentAttempt = await this.prisma.paymentAttempt.findFirst({
        where: { orderId: order.id },
        orderBy: { attemptedAt: 'desc' },
        select: { paytechToken: true },
      });

      const token = paymentAttempt?.paytechToken || order.transactionId;

      if (!token) {
        throw new Error(`No PayDunya token found for order ${orderNumber}`);
      }

      // Vérifier le statut
      const paymentStatus = await this.paydunyaService.confirmPayment(token);

      if (paymentStatus.status === 'completed' && paymentStatus.response_code === '00') {
        await this.orderService.updateOrderPaymentStatus(
          orderNumber,
          'PAID',
          token,
          null,
          1,
        );

        this.logger.log(`✅ Order ${orderNumber} updated to PAID`);
        return true;
      } else if (paymentStatus.status === 'cancelled' || paymentStatus.status === 'failed') {
        await this.orderService.updateOrderPaymentStatus(
          orderNumber,
          'FAILED',
          token,
          {
            reason: paymentStatus.status === 'cancelled' ? 'user_cancelled' : 'payment_failed',
            category: paymentStatus.status === 'cancelled' ? 'user_action' : 'technical_error',
            message: `Payment ${paymentStatus.status}`,
          },
          1,
        );

        this.logger.log(`✅ Order ${orderNumber} updated to FAILED`);
        return true;
      }

      this.logger.log(`Order ${orderNumber} still pending`);
      return false;
    } catch (error) {
      this.logger.error(`Error checking order ${orderNumber}:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques du cron job
   */
  async getStatistics() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalPending, recentPending, completedLast24h, failedLast24h] = await Promise.all([
      // Total des commandes en attente
      this.prisma.order.count({
        where: {
          paymentMethod: 'PAYDUNYA',
          paymentStatus: 'PENDING',
        },
      }),

      // Commandes en attente récentes (dernières 24h)
      this.prisma.order.count({
        where: {
          paymentMethod: 'PAYDUNYA',
          paymentStatus: 'PENDING',
          createdAt: { gte: twentyFourHoursAgo },
        },
      }),

      // Commandes complétées dans les dernières 24h
      this.prisma.order.count({
        where: {
          paymentMethod: 'PAYDUNYA',
          paymentStatus: 'PAID',
          updatedAt: { gte: twentyFourHoursAgo },
        },
      }),

      // Commandes échouées dans les dernières 24h
      this.prisma.order.count({
        where: {
          paymentMethod: 'PAYDUNYA',
          paymentStatus: 'FAILED',
          updatedAt: { gte: twentyFourHoursAgo },
        },
      }),
    ]);

    return {
      totalPending,
      recentPending,
      completedLast24h,
      failedLast24h,
      lastCheck: now,
    };
  }
}