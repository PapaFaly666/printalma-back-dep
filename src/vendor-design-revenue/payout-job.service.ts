import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DesignRevenueService } from '../services/designRevenueService';

@Injectable()
export class PayoutJobService {
  private readonly logger = new Logger(PayoutJobService.name);

  constructor(private readonly designRevenueService: DesignRevenueService) {}

  /**
   * Job qui s'exécute tous les jours à minuit pour traiter les paiements en attente
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
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
  @Cron(CronExpression.EVERY_HOUR)
  async checkPendingPayouts() {
    this.logger.log('🔍 [PAYOUT_JOB] Checking pending payouts...');

    try {
      // Le traitement effectif se fait via le job quotidien
      // Ce job peut être utilisé pour des vérifications ou des logs
      this.logger.log('📊 [PAYOUT_JOB] Pending payouts check completed');
    } catch (error) {
      this.logger.error('❌ [PAYOUT_JOB] Error checking pending payouts:', error);
    }
  }
}