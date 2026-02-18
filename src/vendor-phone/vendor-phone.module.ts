import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { VendorPhoneController } from './vendor-phone.controller';
import { VendorPhoneService } from './services/vendor-phone.service';
import { OTPService } from './services/otp.service';
import { SMSService } from './services/sms.service';
import { SecurityLogService } from './services/security-log.service';
import { WithdrawalSecurityService } from './services/withdrawal-security.service';
import { PhoneActivationCron } from './services/phone-activation.cron';
import { PrismaService } from '../prisma.service';
import { MailModule } from '../core/mail/mail.module';

/**
 * Module de gestion sécurisée des numéros de téléphone vendeur
 * Implémente le système OTP + Email + Période de sécurité 48h
 */
@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(), // Activer les CRON jobs
    MailModule, // Pour l'envoi d'emails
  ],
  controllers: [VendorPhoneController],
  providers: [
    VendorPhoneService,
    OTPService,
    SMSService,
    SecurityLogService,
    WithdrawalSecurityService,
    PhoneActivationCron,
    PrismaService,
  ],
  exports: [
    VendorPhoneService,
    SecurityLogService,
    WithdrawalSecurityService, // Exporté pour utilisation dans VendorFundsService
  ],
})
export class VendorPhoneModule {}
