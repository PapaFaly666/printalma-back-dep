import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../notification.service';

@Injectable()
export class NotificationCleanupTask {
  private readonly logger = new Logger(NotificationCleanupTask.name);

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Nettoie les notifications expirées manuellement
   * Appelez cette méthode depuis un cron job système ou manuellement
   */
  async cleanExpiredNotifications(): Promise<{ count: number }> {
    this.logger.log('Démarrage du nettoyage des notifications expirées...');
    
    try {
      const result = await this.notificationService.cleanExpired();
      this.logger.log(`${result.count} notification(s) expirée(s) supprimée(s)`);
      return result;
    } catch (error) {
      this.logger.error('Erreur lors du nettoyage des notifications:', error);
      throw error;
    }
  }

  /**
   * Méthode pour nettoyer manuellement via un endpoint admin
   */
  async manualCleanup(): Promise<{ count: number }> {
    return this.cleanExpiredNotifications();
  }
} 