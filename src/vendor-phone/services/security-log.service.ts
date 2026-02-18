import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

/**
 * Type d'actions de sécurité tracées
 */
export enum SecurityAction {
  PHONE_ADDED = 'PHONE_ADDED',
  PHONE_VERIFIED = 'PHONE_VERIFIED',
  PHONE_DELETED = 'PHONE_DELETED',
  PHONE_ACTIVATED = 'PHONE_ACTIVATED',
  OTP_SENT = 'OTP_SENT',
  OTP_VERIFIED = 'OTP_VERIFIED',
  OTP_FAILED = 'OTP_FAILED',
  WITHDRAWAL_ATTEMPTED = 'WITHDRAWAL_ATTEMPTED',
  WITHDRAWAL_BLOCKED = 'WITHDRAWAL_BLOCKED',
  WITHDRAWAL_SUCCESS = 'WITHDRAWAL_SUCCESS',
}

/**
 * Interface pour les données de log
 */
export interface SecurityLogData {
  vendor_id: number;
  action: SecurityAction | string;
  phone_number?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Service de logging des actions de sécurité
 * Enregistre toutes les actions liées aux numéros de téléphone et retraits
 */
@Injectable()
export class SecurityLogService {
  private readonly logger = new Logger(SecurityLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Enregistre une action de sécurité dans la base de données
   * @param logData Données de l'action à logger
   */
  async log(logData: SecurityLogData): Promise<void> {
    try {
      await this.prisma.securityLog.create({
        data: {
          vendorId: logData.vendor_id,
          action: logData.action,
          phoneNumber: logData.phone_number || null,
          details: logData.details || null,
          ipAddress: logData.ip_address || null,
          userAgent: logData.user_agent || null,
        },
      });

      this.logger.log(
        `🔒 [SECURITY] ${logData.action} - Vendor: ${logData.vendor_id}${logData.phone_number ? ` - Phone: ${logData.phone_number}` : ''}`
      );
    } catch (error) {
      this.logger.error('❌ Erreur lors du logging de sécurité:', error);
      // Ne pas faire échouer l'opération principale si le logging échoue
    }
  }

  /**
   * Enregistre l'envoi d'un code OTP
   */
  async logOTPSent(vendorId: number, phoneNumber: string, ipAddress?: string): Promise<void> {
    await this.log({
      vendor_id: vendorId,
      action: SecurityAction.OTP_SENT,
      phone_number: phoneNumber,
      ip_address: ipAddress,
    });
  }

  /**
   * Enregistre la vérification réussie d'un code OTP
   */
  async logOTPVerified(vendorId: number, phoneNumber: string, ipAddress?: string): Promise<void> {
    await this.log({
      vendor_id: vendorId,
      action: SecurityAction.OTP_VERIFIED,
      phone_number: phoneNumber,
      ip_address: ipAddress,
    });
  }

  /**
   * Enregistre un échec de vérification OTP
   */
  async logOTPFailed(vendorId: number, phoneNumber: string, attempts: number, ipAddress?: string): Promise<void> {
    await this.log({
      vendor_id: vendorId,
      action: SecurityAction.OTP_FAILED,
      phone_number: phoneNumber,
      details: { attempts },
      ip_address: ipAddress,
    });
  }

  /**
   * Enregistre l'ajout d'un nouveau numéro
   */
  async logPhoneAdded(vendorId: number, phoneNumber: string, phoneNumberId: number): Promise<void> {
    await this.log({
      vendor_id: vendorId,
      action: SecurityAction.PHONE_ADDED,
      phone_number: phoneNumber,
      details: { phoneNumberId },
    });
  }

  /**
   * Enregistre l'activation automatique d'un numéro après 48h
   */
  async logPhoneActivated(vendorId: number, phoneNumber: string, phoneNumberId: number): Promise<void> {
    await this.log({
      vendor_id: vendorId,
      action: SecurityAction.PHONE_ACTIVATED,
      phone_number: phoneNumber,
      details: { phoneNumberId },
    });
  }

  /**
   * Enregistre la suppression d'un numéro
   */
  async logPhoneDeleted(vendorId: number, phoneNumber: string, phoneNumberId: number): Promise<void> {
    await this.log({
      vendor_id: vendorId,
      action: SecurityAction.PHONE_DELETED,
      phone_number: phoneNumber,
      details: { phoneNumberId },
    });
  }

  /**
   * Enregistre un retrait bloqué par la sécurité
   */
  async logWithdrawalBlocked(
    vendorId: number,
    phoneNumber: string,
    amount: number,
    reason: string,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      vendor_id: vendorId,
      action: SecurityAction.WITHDRAWAL_BLOCKED,
      phone_number: phoneNumber,
      details: { amount, reason },
      ip_address: ipAddress,
    });
  }

  /**
   * Enregistre un retrait réussi
   */
  async logWithdrawalSuccess(
    vendorId: number,
    phoneNumber: string,
    amount: number,
    ipAddress?: string
  ): Promise<void> {
    await this.log({
      vendor_id: vendorId,
      action: SecurityAction.WITHDRAWAL_SUCCESS,
      phone_number: phoneNumber,
      details: { amount },
      ip_address: ipAddress,
    });
  }

  /**
   * Récupère l'historique de sécurité d'un vendeur
   * @param vendorId ID du vendeur
   * @param limit Nombre maximum de logs à retourner
   */
  async getVendorSecurityHistory(vendorId: number, limit: number = 50) {
    return this.prisma.securityLog.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Récupère les logs suspects (plusieurs tentatives échouées, etc.)
   * @param vendorId ID du vendeur
   */
  async getSuspiciousActivity(vendorId: number) {
    return this.prisma.securityLog.findMany({
      where: {
        vendorId,
        action: {
          in: [SecurityAction.OTP_FAILED, SecurityAction.WITHDRAWAL_BLOCKED],
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
