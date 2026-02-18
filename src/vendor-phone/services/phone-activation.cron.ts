import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma.service';
import { SecurityLogService } from './security-log.service';

/**
 * Service CRON pour l'activation automatique des numéros de téléphone
 * S'exécute toutes les heures pour activer les numéros dont la période de sécurité (48h) est terminée
 */
@Injectable()
export class PhoneActivationCron {
  private readonly logger = new Logger(PhoneActivationCron.name);

  constructor(
    private prisma: PrismaService,
    private securityLogService: SecurityLogService,
  ) {}

  /**
   * CRON Job: Activation des numéros en attente
   * S'exécute toutes les heures (à la minute 0)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async activatePendingPhones(): Promise<void> {
    this.logger.log('🔄 Démarrage du CRON d\'activation des numéros de téléphone...');

    const now = new Date();

    try {
      // Récupérer tous les numéros en statut PENDING dont la période de sécurité est terminée
      const phonesToActivate = await this.prisma.vendorPhoneNumber.findMany({
        where: {
          status: 'PENDING',
          isVerified: true,
          securityHoldUntil: {
            lte: now, // Période de sécurité expirée
          },
        },
      });

      if (phonesToActivate.length === 0) {
        this.logger.log('✅ Aucun numéro à activer');
        return;
      }

      this.logger.log(`📋 ${phonesToActivate.length} numéro(s) à activer`);

      // Activer chaque numéro
      for (const phone of phonesToActivate) {
        try {
          await this.prisma.vendorPhoneNumber.update({
            where: { id: phone.id },
            data: {
              status: 'ACTIVE',
              securityHoldUntil: null, // Supprimer la date de hold
            },
          });

          // Logger l'activation
          await this.securityLogService.logPhoneActivated(
            phone.vendorId,
            phone.phoneNumber,
            phone.id
          );

          this.logger.log(
            `✅ Numéro ${phone.phoneNumber} activé pour vendeur ${phone.vendorId} (ID: ${phone.id})`
          );
        } catch (error) {
          this.logger.error(
            `❌ Erreur lors de l'activation du numéro ${phone.id}:`,
            error
          );
        }
      }

      this.logger.log(`✅ ${phonesToActivate.length} numéro(s) activé(s) avec succès`);
    } catch (error) {
      this.logger.error('❌ Erreur lors du CRON d\'activation:', error);
    }
  }

  /**
   * CRON Job: Nettoyage des codes OTP expirés
   * S'exécute tous les jours à 2h du matin
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredOTPs(): Promise<void> {
    this.logger.log('🧹 Démarrage du nettoyage des codes OTP expirés...');

    const now = new Date();

    try {
      // Supprimer les codes expirés de plus de 24h (pour garder un historique minimal)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const result = await this.prisma.phoneOTPCode.deleteMany({
        where: {
          expiresAt: {
            lt: oneDayAgo,
          },
        },
      });

      this.logger.log(`✅ ${result.count} code(s) OTP expiré(s) supprimé(s)`);
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage des OTP:', error);
    }
  }

  /**
   * CRON Job: Détection d'activité suspecte
   * S'exécute toutes les 6 heures
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async detectSuspiciousActivity(): Promise<void> {
    this.logger.log('🔍 Démarrage de la détection d\'activité suspecte...');

    try {
      // Récupérer les vendeurs avec beaucoup d'échecs OTP récents
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const suspiciousVendors = await this.prisma.securityLog.groupBy({
        by: ['vendorId'],
        where: {
          action: 'OTP_FAILED',
          createdAt: {
            gte: last24Hours,
          },
        },
        _count: {
          id: true,
        },
        having: {
          id: {
            _count: {
              gte: 10, // Plus de 10 échecs en 24h
            },
          },
        },
      });

      if (suspiciousVendors.length > 0) {
        this.logger.warn(
          `⚠️ ${suspiciousVendors.length} vendeur(s) avec activité suspecte détectée`
        );

        for (const vendor of suspiciousVendors) {
          this.logger.warn(
            `⚠️ Vendeur ${vendor.vendorId}: ${vendor._count.id} échecs OTP en 24h`
          );

          // Optionnel: Envoyer une notification aux admins
          // ou suspendre automatiquement le compte
        }
      } else {
        this.logger.log('✅ Aucune activité suspecte détectée');
      }
    } catch (error) {
      this.logger.error('❌ Erreur lors de la détection d\'activité suspecte:', error);
    }
  }
}
