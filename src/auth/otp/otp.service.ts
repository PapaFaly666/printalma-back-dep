import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 10; // 10 minutes
  private readonly MAX_ATTEMPTS = 3;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Génère un code OTP à 6 chiffres
   */
  generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Crée et enregistre un nouveau code OTP pour un utilisateur
   * @param userId - ID de l'utilisateur
   * @param ipAddress - Adresse IP de la requête
   * @param userAgent - User agent du navigateur
   * @returns Le code OTP généré
   */
  async createOTP(
    userId: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    // Invalider tous les anciens OTP non utilisés de cet utilisateur
    await this.invalidateUserOTPs(userId);

    const code = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    await this.prisma.loginOTP.create({
      data: {
        userId,
        code,
        expiresAt,
        ipAddress,
        userAgent,
        verified: false,
        attempts: 0,
      },
    });

    this.logger.log(`OTP créé pour l'utilisateur ${userId}, expire à ${expiresAt.toISOString()}`);
    return code;
  }

  /**
   * Vérifie si un code OTP est valide
   * @param userId - ID de l'utilisateur
   * @param code - Code OTP à vérifier
   * @returns true si le code est valide, sinon lève une exception
   */
  async verifyOTP(userId: number, code: string): Promise<boolean> {
    const otp = await this.prisma.loginOTP.findFirst({
      where: {
        userId,
        code,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otp) {
      this.logger.warn(`Code OTP invalide pour l'utilisateur ${userId}`);
      throw new BadRequestException('Code OTP invalide ou expiré');
    }

    // Vérifier l'expiration
    if (new Date() > otp.expiresAt) {
      this.logger.warn(`Code OTP expiré pour l'utilisateur ${userId}`);
      throw new BadRequestException('Ce code a expiré. Veuillez demander un nouveau code.');
    }

    // Vérifier le nombre de tentatives
    if (otp.attempts >= this.MAX_ATTEMPTS) {
      this.logger.warn(`Trop de tentatives pour l'utilisateur ${userId}`);
      throw new BadRequestException('Trop de tentatives. Veuillez demander un nouveau code.');
    }

    // Incrémenter le compteur de tentatives
    await this.prisma.loginOTP.update({
      where: { id: otp.id },
      data: {
        attempts: otp.attempts + 1,
      },
    });

    // Marquer comme vérifié
    await this.prisma.loginOTP.update({
      where: { id: otp.id },
      data: {
        verified: true,
        usedAt: new Date(),
      },
    });

    this.logger.log(`OTP vérifié avec succès pour l'utilisateur ${userId}`);
    return true;
  }

  /**
   * Invalide tous les OTP non utilisés d'un utilisateur
   * @param userId - ID de l'utilisateur
   */
  async invalidateUserOTPs(userId: number): Promise<void> {
    await this.prisma.loginOTP.updateMany({
      where: {
        userId,
        verified: false,
      },
      data: {
        verified: true, // Marquer comme vérifié pour éviter leur réutilisation
      },
    });

    this.logger.log(`OTP précédents invalidés pour l'utilisateur ${userId}`);
  }

  /**
   * Nettoie les OTP expirés (à exécuter périodiquement via un cron job)
   */
  async cleanExpiredOTPs(): Promise<number> {
    const result = await this.prisma.loginOTP.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    this.logger.log(`${result.count} OTP expirés nettoyés`);
    return result.count;
  }

  /**
   * Vérifie si un utilisateur doit utiliser l'OTP
   * (Admin et Vendeurs uniquement)
   * @param role - Rôle de l'utilisateur
   * @returns true si l'utilisateur doit utiliser l'OTP
   */
  shouldUseOTP(role: string): boolean {
    const rolesRequiringOTP = ['ADMIN', 'SUPERADMIN', 'VENDOR'];
    return rolesRequiringOTP.includes(role);
  }
}
