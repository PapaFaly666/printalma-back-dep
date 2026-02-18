import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { SecurityLogService } from './security-log.service';

/**
 * Interface de résultat de vérification de retrait
 */
export interface WithdrawalCheckResult {
  allowed: boolean;
  reason?: string;
  phoneNumber?: any;
  remainingHours?: number;
}

/**
 * Service de vérification de sécurité pour les retraits
 * Vérifie que le vendeur a un numéro actif avant d'autoriser un retrait
 */
@Injectable()
export class WithdrawalSecurityService {
  private readonly logger = new Logger(WithdrawalSecurityService.name);

  constructor(
    private prisma: PrismaService,
    private securityLogService: SecurityLogService,
  ) {}

  /**
   * Vérifie si un vendeur peut effectuer un retrait
   * @param vendorId ID du vendeur
   * @param amount Montant du retrait
   * @returns Résultat de la vérification avec détails
   */
  async canWithdraw(vendorId: number, amount: number): Promise<WithdrawalCheckResult> {
    // 1. Récupérer le numéro principal du vendeur
    const primaryPhone = await this.prisma.vendorPhoneNumber.findFirst({
      where: {
        vendorId,
        isPrimary: true,
      },
    });

    if (!primaryPhone) {
      return {
        allowed: false,
        reason: 'Aucun numéro de téléphone principal configuré. Veuillez ajouter un numéro de téléphone.',
      };
    }

    // 2. Vérifier que le numéro est vérifié
    if (!primaryPhone.isVerified) {
      return {
        allowed: false,
        reason: 'Le numéro principal n\'est pas vérifié. Veuillez vérifier votre numéro avec le code OTP.',
        phoneNumber: primaryPhone,
      };
    }

    // 3. Vérifier le statut du numéro
    if (primaryPhone.status === 'SUSPENDED') {
      return {
        allowed: false,
        reason: 'Votre numéro principal est suspendu. Veuillez contacter le support.',
        phoneNumber: primaryPhone,
      };
    }

    if (primaryPhone.status === 'PENDING') {
      // Vérifier si c'est juste en attente de vérification ou en période de sécurité
      if (primaryPhone.securityHoldUntil && new Date() < primaryPhone.securityHoldUntil) {
        const remainingMs = primaryPhone.securityHoldUntil.getTime() - Date.now();
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

        return {
          allowed: false,
          reason: `Numéro en période de sécurité. Utilisable dans ${remainingHours}h pour des raisons de sécurité.`,
          phoneNumber: primaryPhone,
          remainingHours,
        };
      } else {
        // Le numéro est PENDING mais la période de sécurité est terminée
        // Il devrait être activé par le CRON job, mais on peut aussi le faire ici
        await this.activatePhoneNumber(primaryPhone.id, vendorId);

        // Réessayer la vérification après activation
        return this.canWithdraw(vendorId, amount);
      }
    }

    // 4. Vérifications additionnelles (optionnel)
    // - Limite de retrait par jour
    // - Délai minimum entre retraits
    // - Vérification du solde disponible (géré par VendorFundsService)

    // 5. Tout est OK, le retrait est autorisé
    return {
      allowed: true,
      phoneNumber: primaryPhone,
    };
  }

  /**
   * Vérifie et retourne le numéro principal actif d'un vendeur
   * Lève une exception si aucun numéro actif n'est trouvé
   */
  async getActiveWithdrawalPhone(vendorId: number): Promise<any> {
    const checkResult = await this.canWithdraw(vendorId, 0);

    if (!checkResult.allowed) {
      throw new Error(checkResult.reason);
    }

    return checkResult.phoneNumber;
  }

  /**
   * Active un numéro dont la période de sécurité est terminée
   * @param phoneNumberId ID du numéro à activer
   * @param vendorId ID du vendeur (pour logging)
   */
  private async activatePhoneNumber(phoneNumberId: number, vendorId: number): Promise<void> {
    const phoneNumber = await this.prisma.vendorPhoneNumber.update({
      where: { id: phoneNumberId },
      data: {
        status: 'ACTIVE',
        securityHoldUntil: null,
      },
    });

    await this.securityLogService.logPhoneActivated(
      vendorId,
      phoneNumber.phoneNumber,
      phoneNumberId
    );

    this.logger.log(
      `✅ Numéro ${phoneNumber.phoneNumber} activé pour vendeur ${vendorId}`
    );
  }

  /**
   * Enregistre une tentative de retrait (succès ou échec)
   * @param vendorId ID du vendeur
   * @param phoneNumber Numéro utilisé
   * @param amount Montant
   * @param success Si le retrait a réussi
   * @param blockReason Raison du blocage si échec
   * @param ipAddress Adresse IP de la demande
   */
  async logWithdrawalAttempt(
    vendorId: number,
    phoneNumber: string,
    amount: number,
    success: boolean,
    blockReason?: string,
    ipAddress?: string,
  ): Promise<void> {
    if (success) {
      await this.securityLogService.logWithdrawalSuccess(
        vendorId,
        phoneNumber,
        amount,
        ipAddress
      );

      // Mettre à jour la date de dernière utilisation du numéro
      await this.prisma.vendorPhoneNumber.updateMany({
        where: {
          vendorId,
          phoneNumber,
        },
        data: {
          lastUsedForWithdrawal: new Date(),
        },
      });
    } else {
      await this.securityLogService.logWithdrawalBlocked(
        vendorId,
        phoneNumber,
        amount,
        blockReason || 'Raison inconnue',
        ipAddress
      );
    }
  }

  /**
   * Vérifie si un vendeur a des activités suspectes récentes
   * @param vendorId ID du vendeur
   * @returns true si activité suspecte détectée
   */
  async hasSuspiciousActivity(vendorId: number): Promise<boolean> {
    const suspiciousLogs = await this.securityLogService.getSuspiciousActivity(vendorId);

    // Seuil: Plus de 5 tentatives échouées dans les dernières 24h
    const OTP_FAILURE_THRESHOLD = 5;
    const otpFailures = suspiciousLogs.filter((log) => log.action === 'OTP_FAILED').length;

    if (otpFailures >= OTP_FAILURE_THRESHOLD) {
      this.logger.warn(
        `⚠️ Activité suspecte détectée pour vendeur ${vendorId}: ${otpFailures} échecs OTP`
      );
      return true;
    }

    const WITHDRAWAL_BLOCK_THRESHOLD = 3;
    const withdrawalBlocks = suspiciousLogs.filter(
      (log) => log.action === 'WITHDRAWAL_BLOCKED'
    ).length;

    if (withdrawalBlocks >= WITHDRAWAL_BLOCK_THRESHOLD) {
      this.logger.warn(
        `⚠️ Activité suspecte détectée pour vendeur ${vendorId}: ${withdrawalBlocks} retraits bloqués`
      );
      return true;
    }

    return false;
  }

  /**
   * Suspend un numéro de téléphone pour comportement suspect
   * @param phoneNumberId ID du numéro à suspendre
   * @param reason Raison de la suspension
   */
  async suspendPhoneNumber(phoneNumberId: number, reason: string): Promise<void> {
    const phoneNumber = await this.prisma.vendorPhoneNumber.update({
      where: { id: phoneNumberId },
      data: {
        status: 'SUSPENDED',
      },
    });

    await this.securityLogService.log({
      vendor_id: phoneNumber.vendorId,
      action: 'PHONE_SUSPENDED',
      phone_number: phoneNumber.phoneNumber,
      details: { reason },
    });

    this.logger.warn(
      `🚫 Numéro ${phoneNumber.phoneNumber} suspendu pour vendeur ${phoneNumber.vendorId}: ${reason}`
    );
  }
}
