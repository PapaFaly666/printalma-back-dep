import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MailService } from '../../core/mail/mail.service';
import { OTPService } from './otp.service';
import { SMSService } from './sms.service';
import { SecurityLogService } from './security-log.service';
import {
  SendOTPDto,
  VerifyOTPDto,
  SendOTPResponseDto,
  VerifyOTPResponseDto,
  PhoneNumberDto,
  ListPhoneNumbersResponseDto,
} from '../dto/phone-security.dto';

/**
 * Service principal de gestion des numéros de téléphone vendeur
 * Implémente le système de sécurité OTP + Email + Période de sécurité 48h
 */
@Injectable()
export class VendorPhoneService {
  private readonly logger = new Logger(VendorPhoneService.name);
  private readonly SECURITY_HOLD_HOURS = 48;
  private readonly OTP_EXPIRATION_MINUTES = 5;
  private readonly MAX_OTP_ATTEMPTS = 5;
  private readonly MAX_OTP_PER_HOUR = 3;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private otpService: OTPService,
    private smsService: SMSService,
    private securityLogService: SecurityLogService,
  ) {}

  /**
   * Envoie un code OTP pour vérifier un nouveau numéro
   */
  async sendOTP(
    vendorId: number,
    sendOTPDto: SendOTPDto,
    ipAddress?: string,
  ): Promise<SendOTPResponseDto> {
    const { phoneNumber } = sendOTPDto;

    // 1. Valider le format du numéro
    if (!this.smsService.isValidSenegalPhone(phoneNumber)) {
      throw new BadRequestException(
        'Format de numéro invalide. Utilisez le format: 77 123 45 67 ou +221771234567'
      );
    }

    // 2. Vérifier que le numéro n'est pas déjà utilisé par ce vendeur
    const existing = await this.prisma.vendorPhoneNumber.findFirst({
      where: {
        vendorId,
        phoneNumber,
      },
    });

    if (existing) {
      throw new BadRequestException('Ce numéro est déjà associé à votre compte');
    }

    // 3. Vérifier rate limiting (max 3 codes par heure)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCodes = await this.prisma.phoneOTPCode.count({
      where: {
        vendorId,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentCodes >= this.MAX_OTP_PER_HOUR) {
      throw new HttpException(
        `Trop de tentatives. Vous pouvez demander maximum ${this.MAX_OTP_PER_HOUR} codes par heure. Réessayez dans 1 heure.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // 4. Générer le code OTP
    const code = this.otpService.generateCode();
    const codeHash = await this.otpService.hashCode(code);
    const expiresAt = this.otpService.getExpirationDate(this.OTP_EXPIRATION_MINUTES);

    // 5. Sauvegarder en BDD
    const otp = await this.prisma.phoneOTPCode.create({
      data: {
        vendorId,
        phoneNumber,
        code, // Optionnel: on peut ne stocker que le hash pour plus de sécurité
        codeHash,
        expiresAt,
        ipAddress: ipAddress || null,
      },
    });

    // 6. Envoyer le SMS
    try {
      await this.smsService.sendOTP(phoneNumber, code);
    } catch (error) {
      this.logger.error(`Erreur envoi SMS à ${phoneNumber}:`, error);
      // Supprimer le code OTP si l'envoi échoue
      await this.prisma.phoneOTPCode.delete({ where: { id: otp.id } });
      throw new BadRequestException(
        'Impossible d\'envoyer le code SMS. Vérifiez le numéro et réessayez.'
      );
    }

    // 7. Logger l'action
    await this.securityLogService.logOTPSent(vendorId, phoneNumber, ipAddress);

    return {
      success: true,
      otpId: otp.id.toString(),
      expiresAt: expiresAt.getTime(),
      message: 'Code envoyé avec succès. Valide pendant 5 minutes.',
    };
  }

  /**
   * Vérifie le code OTP et ajoute le numéro avec période de sécurité
   */
  async verifyOTP(
    vendorId: number,
    verifyOTPDto: VerifyOTPDto,
    ipAddress?: string,
    userEmail?: string,
  ): Promise<VerifyOTPResponseDto> {
    const { otpId, code } = verifyOTPDto;

    // 1. Récupérer le code OTP
    const otp = await this.prisma.phoneOTPCode.findFirst({
      where: {
        id: parseInt(otpId),
        vendorId,
        isUsed: false,
      },
    });

    if (!otp) {
      throw new NotFoundException('Code introuvable ou déjà utilisé');
    }

    // 2. Vérifier l'expiration
    if (this.otpService.isExpired(otp.expiresAt)) {
      throw new BadRequestException('Code expiré. Demandez un nouveau code.');
    }

    // 3. Vérifier les tentatives
    if (otp.attempts >= this.MAX_OTP_ATTEMPTS) {
      throw new BadRequestException(
        'Trop de tentatives échouées. Demandez un nouveau code.'
      );
    }

    // 4. Vérifier le code
    const isValid = await this.otpService.verifyCode(code, otp.codeHash);

    if (!isValid) {
      // Incrémenter les tentatives
      await this.prisma.phoneOTPCode.update({
        where: { id: otp.id },
        data: { attempts: otp.attempts + 1 },
      });

      await this.securityLogService.logOTPFailed(
        vendorId,
        otp.phoneNumber,
        otp.attempts + 1,
        ipAddress
      );

      throw new BadRequestException(
        `Code invalide. ${this.MAX_OTP_ATTEMPTS - otp.attempts - 1} tentative(s) restante(s).`
      );
    }

    // 5. Marquer le code comme utilisé
    await this.prisma.phoneOTPCode.update({
      where: { id: otp.id },
      data: {
        isUsed: true,
        verifiedAt: new Date(),
      },
    });

    // 6. Créer le numéro de téléphone avec période de sécurité de 48h
    const securityHoldUntil = new Date(
      Date.now() + this.SECURITY_HOLD_HOURS * 60 * 60 * 1000
    );

    // Vérifier si c'est le premier numéro (sera principal)
    const existingPhones = await this.prisma.vendorPhoneNumber.count({
      where: { vendorId },
    });

    const phoneNumber = await this.prisma.vendorPhoneNumber.create({
      data: {
        vendorId,
        countryCode: '+221',
        phoneNumber: otp.phoneNumber,
        isPrimary: existingPhones === 0, // Premier numéro = principal
        isVerified: true,
        verifiedAt: new Date(),
        status: 'PENDING', // En période de sécurité
        securityHoldUntil,
      },
    });

    // 7. Logger l'action
    await this.securityLogService.logOTPVerified(vendorId, otp.phoneNumber, ipAddress);
    await this.securityLogService.logPhoneAdded(vendorId, otp.phoneNumber, phoneNumber.id);

    // 8. Envoyer l'email de confirmation
    if (userEmail) {
      try {
        // Récupérer les infos du vendeur pour l'email
        const vendor = await this.prisma.user.findUnique({
          where: { id: vendorId },
          select: { firstName: true, lastName: true },
        });

        if (vendor) {
          await this.mailService.sendPhoneAddedNotification({
            to: userEmail,
            vendorName: `${vendor.firstName} ${vendor.lastName}`,
            phoneNumber: otp.phoneNumber,
            activationDate: securityHoldUntil,
          });
        }
      } catch (emailError) {
        this.logger.warn(`Erreur envoi email de notification: ${emailError.message}`);
        // Ne pas bloquer l'opération pour un problème d'email
      }
    }

    return {
      success: true,
      phoneNumber: this.formatPhoneNumberDto(phoneNumber),
      message: `Numéro vérifié avec succès. Utilisable pour les retraits dans ${this.SECURITY_HOLD_HOURS} heures.`,
    };
  }

  /**
   * Récupère la liste des numéros du vendeur
   */
  async listPhoneNumbers(vendorId: number): Promise<ListPhoneNumbersResponseDto> {
    const phones = await this.prisma.vendorPhoneNumber.findMany({
      where: { vendorId },
      orderBy: [{ isPrimary: 'desc' }, { addedAt: 'desc' }],
    });

    const phoneNumbers = phones.map((phone) => this.formatPhoneNumberDto(phone));

    return {
      success: true,
      phoneNumbers,
    };
  }

  /**
   * Supprime un numéro de téléphone
   */
  async deletePhoneNumber(
    vendorId: number,
    phoneNumberId: number,
  ): Promise<{ success: boolean; message: string }> {
    const phoneNumber = await this.prisma.vendorPhoneNumber.findFirst({
      where: {
        id: phoneNumberId,
        vendorId,
      },
    });

    if (!phoneNumber) {
      throw new NotFoundException('Numéro de téléphone non trouvé');
    }

    // Ne pas permettre la suppression du numéro principal s'il y en a d'autres
    if (phoneNumber.isPrimary) {
      const otherPhones = await this.prisma.vendorPhoneNumber.count({
        where: {
          vendorId,
          id: { not: phoneNumberId },
        },
      });

      if (otherPhones > 0) {
        throw new BadRequestException(
          'Vous ne pouvez pas supprimer votre numéro principal. Définissez d\'abord un autre numéro comme principal.'
        );
      }
    }

    await this.prisma.vendorPhoneNumber.delete({
      where: { id: phoneNumberId },
    });

    await this.securityLogService.logPhoneDeleted(
      vendorId,
      phoneNumber.phoneNumber,
      phoneNumberId
    );

    return {
      success: true,
      message: 'Numéro supprimé avec succès',
    };
  }

  /**
   * Définir un numéro comme principal
   */
  async setPrimaryPhone(
    vendorId: number,
    phoneNumberId: number,
  ): Promise<{ success: boolean; message: string }> {
    const phoneNumber = await this.prisma.vendorPhoneNumber.findFirst({
      where: {
        id: phoneNumberId,
        vendorId,
      },
    });

    if (!phoneNumber) {
      throw new NotFoundException('Numéro de téléphone non trouvé');
    }

    // Le numéro doit être actif pour être défini comme principal
    if (phoneNumber.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Ce numéro ne peut pas être défini comme principal car il n\'est pas encore actif.'
      );
    }

    // Retirer le statut principal des autres numéros
    await this.prisma.vendorPhoneNumber.updateMany({
      where: {
        vendorId,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });

    // Définir ce numéro comme principal
    await this.prisma.vendorPhoneNumber.update({
      where: { id: phoneNumberId },
      data: {
        isPrimary: true,
      },
    });

    return {
      success: true,
      message: 'Numéro principal mis à jour',
    };
  }

  /**
   * Formate un VendorPhoneNumber en PhoneNumberDto
   */
  private formatPhoneNumberDto(phone: any): PhoneNumberDto {
    const now = new Date();
    let canUse = phone.isVerified && phone.status === 'ACTIVE';

    // Vérifier si la période de sécurité est terminée
    if (phone.securityHoldUntil && phone.securityHoldUntil > now) {
      canUse = false;
    }

    return {
      id: phone.id,
      number: phone.phoneNumber,
      countryCode: phone.countryCode,
      isPrimary: phone.isPrimary,
      isVerified: phone.isVerified,
      verifiedAt: phone.verifiedAt?.toISOString() || null,
      status: phone.status,
      securityHoldUntil: phone.securityHoldUntil?.toISOString() || null,
      addedAt: phone.addedAt.toISOString(),
      canBeUsedForWithdrawal: canUse,
    };
  }
}
