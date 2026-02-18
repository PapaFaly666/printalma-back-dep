import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Service d'envoi de SMS
 * Supporte plusieurs providers: Twilio, Africa's Talking, Orange SMS API
 *
 * Configuration requise dans .env:
 * - SMS_PROVIDER=twilio (ou africas_talking, orange)
 * - TWILIO_ACCOUNT_SID=xxx
 * - TWILIO_AUTH_TOKEN=xxx
 * - TWILIO_PHONE_NUMBER=xxx
 */
@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);
  private twilioClient: any;
  private smsProvider: string;

  constructor(private configService: ConfigService) {
    this.smsProvider = this.configService.get<string>('SMS_PROVIDER', 'twilio');
    this.initializeSMSProvider();
  }

  /**
   * Initialise le provider SMS (Twilio, Africa's Talking, etc.)
   */
  private initializeSMSProvider() {
    if (this.smsProvider === 'twilio') {
      try {
        // Import dynamique de Twilio (à installer: npm install twilio)
        const twilio = require('twilio');
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

        if (accountSid && authToken) {
          this.twilioClient = twilio(accountSid, authToken);
          this.logger.log('✅ Twilio SMS service initialized');
        } else {
          this.logger.warn('⚠️ Twilio credentials not configured. SMS will be logged only.');
        }
      } catch (error) {
        this.logger.error('❌ Failed to initialize Twilio:', error.message);
        this.logger.warn('⚠️ SMS will be logged to console only');
      }
    }
    // TODO: Ajouter support pour Africa's Talking et Orange SMS API
  }

  /**
   * Envoie un code OTP par SMS
   * @param phoneNumber Numéro de téléphone au format international (+221...)
   * @param code Code OTP à 6 chiffres
   */
  async sendOTP(phoneNumber: string, code: string): Promise<void> {
    const message = `Votre code de vérification PrintAlma: ${code}. Valide pendant 5 minutes. Ne partagez ce code avec personne.`;

    try {
      // Formater le numéro au format international
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      if (this.twilioClient) {
        await this.sendViaTwilio(formattedPhone, message);
      } else {
        // Mode développement: log le code au lieu de l'envoyer
        this.logger.warn(`📱 [DEV MODE] SMS non envoyé - Code OTP pour ${formattedPhone}: ${code}`);
        this.logger.warn(`📨 Message: ${message}`);
      }
    } catch (error) {
      this.logger.error(`❌ Erreur envoi SMS à ${phoneNumber}:`, error);
      throw new Error('Impossible d\'envoyer le code SMS. Veuillez réessayer.');
    }
  }

  /**
   * Envoie un SMS via Twilio
   */
  private async sendViaTwilio(phoneNumber: string, message: string): Promise<void> {
    try {
      const twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER');

      const result = await this.twilioClient.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: phoneNumber
      });

      this.logger.log(`✅ SMS envoyé via Twilio à ${phoneNumber} (SID: ${result.sid})`);
    } catch (error) {
      this.logger.error('❌ Erreur Twilio:', error);
      throw error;
    }
  }

  /**
   * Formate un numéro de téléphone au format international
   * @param phoneNumber Numéro brut (ex: "77 123 45 67" ou "+221771234567")
   * @returns Numéro formaté avec indicatif pays (ex: "+221771234567")
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Nettoyer le numéro (supprimer espaces, tirets, etc.)
    let cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Ajouter l'indicatif pays si manquant
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('221')) {
        cleaned = '+' + cleaned;
      } else if (cleaned.startsWith('77') || cleaned.startsWith('78') || cleaned.startsWith('70')) {
        // Numéros sénégalais commençant par 77, 78, 70, etc.
        cleaned = '+221' + cleaned;
      } else {
        throw new Error('Format de numéro invalide');
      }
    }

    return cleaned;
  }

  /**
   * Valide qu'un numéro de téléphone est au format sénégalais valide
   * @param phoneNumber Numéro à valider
   * @returns true si valide, false sinon
   */
  isValidSenegalPhone(phoneNumber: string): boolean {
    try {
      const formatted = this.formatPhoneNumber(phoneNumber);
      // Numéro sénégalais: +221 suivi de 9 chiffres commençant par 7
      const regex = /^\+221(7[0-8])\d{7}$/;
      return regex.test(formatted);
    } catch {
      return false;
    }
  }
}
