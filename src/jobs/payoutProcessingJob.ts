import { Logger } from '@nestjs/common';
import { DesignRevenueService } from '../services/designRevenueService';
import { Cron } from '@nestjs/schedule';

export class PayoutProcessingJob {
  private readonly logger = new Logger(PayoutProcessingJob.name);

  /**
   * Job qui s'exécute tous les jours à minuit pour traiter les paiements en attente
   */
  @Cron('0 0 * * *') // Tous les jours à minuit
  async processDailyPayouts() {
    this.logger.log('🚀 [PAYOUT_JOB] Starting daily payout processing...');

    try {
      await DesignRevenueService.processPendingPayouts();
      this.logger.log('✅ [PAYOUT_JOB] Daily payout processing completed successfully');
    } catch (error) {
      this.logger.error('❌ [PAYOUT_JOB] Error during daily payout processing:', error);
    }
  }

  /**
   * Job qui s'exécute toutes les heures pour vérifier les paiements en attente
   */
  @Cron('0 * * * *') // Toutes les heures
  async checkPendingPayouts() {
    this.logger.log('🔍 [PAYOUT_JOB] Checking pending payouts...');

    try {
      // Initialiser les paramètres de revenus si nécessaire
      await DesignRevenueService.initializeRevenueSettings();
      this.logger.log('✅ [PAYOUT_JOB] Revenue settings checked/initialized');
    } catch (error) {
      this.logger.error('❌ [PAYOUT_JOB] Error checking revenue settings:', error);
    }
  }
}

// Exporter une instance pour pouvoir l'utiliser dans le module principal
export const payoutProcessingJob = new PayoutProcessingJob();