import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';

// Définition temporaire jusqu'à ce que Prisma génère l'enum
export enum VendeurType {
  DESIGNER = 'DESIGNER',
  INFLUENCEUR = 'INFLUENCEUR',
  ARTISTE = 'ARTISTE'
}

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Génère un mot de passe aléatoire
   */
  generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Génère un code d'activation à 6 chiffres
   */
  generateActivationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Convertit une URL relative en URL absolue pour l'affichage dans les emails
   * Les emails ne peuvent pas afficher des images avec des chemins relatifs
   */
  private toAbsoluteUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Si l'URL est déjà absolue (commence par http:// ou https://), la retourner telle quelle
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Si c'est un chemin relatif, construire l'URL absolue
    // Vous devez configurer votre domaine frontend ici
    const frontendUrl = process.env.FRONTEND_URL || 'https://printalma.com';

    // Supprimer le slash initial si présent pour éviter les doubles slashes
    const cleanPath = url.startsWith('/') ? url : `/${url}`;

    return `${frontendUrl}${cleanPath}`;
  }

  /**
   * Envoie un code OTP de connexion par email
   */
  async sendLoginOTP(to: string, firstName: string, code: string): Promise<void> {
    const subject = 'Code de vérification PrintAlma';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Code de vérification PrintAlma</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; padding: 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #14689a 0%, #0d4a6f 100%); color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { padding: 30px 20px; }
          .otp-box { background: #f8f9fa; border: 3px solid #14689a; border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #14689a; letter-spacing: 8px; margin: 10px 0; }
          .info-box { background: #e7f3ff; border-left: 4px solid #14689a; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 13px; color: #666; border-top: 1px solid #ddd; }
          .footer a { color: #14689a; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Code de Vérification</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName},</h2>
            <p>Une tentative de connexion à votre compte PrintAlma a été détectée.</p>

            <p>Pour compléter votre connexion, veuillez saisir le code de vérification ci-dessous :</p>

            <div class="otp-box">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Votre code de vérification :</p>
              <div class="otp-code">${code}</div>
              <p style="margin: 10px 0 0 0; color: #666; font-size: 13px;">Ce code expire dans 10 minutes</p>
            </div>

            <div class="info-box">
              <strong>📍 Pourquoi ce code ?</strong><br>
              Pour votre sécurité, nous vérifions toutes les connexions aux comptes administrateurs et vendeurs avec un code de vérification à usage unique.
            </div>

            <div class="warning-box">
              <strong>⚠️ Attention :</strong><br>
              Si vous n'avez pas tenté de vous connecter, veuillez ignorer cet email et <strong>changer votre mot de passe immédiatement</strong>.
              <br>Ne partagez jamais ce code avec qui que ce soit, même avec le support PrintAlma.
            </div>

            <p style="margin-top: 25px; font-size: 14px; color: #666;">
              Si vous avez des questions, n'hésitez pas à contacter notre support.
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} PrintAlma - Plateforme de vente en ligne</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.mailerService.sendMail({
      to,
      subject,
      html,
    });

    console.log(`✅ Email OTP envoyé à ${to}`);
  }

  /**
   * Formate le type de vendeur pour l'affichage
   */
  private formatVendeurType(vendeurType: VendeurType): string {
    const types = {
      [VendeurType.DESIGNER]: 'Designer',
      [VendeurType.INFLUENCEUR]: 'Influenceur',
      [VendeurType.ARTISTE]: 'Artiste'
    };
    return types[vendeurType] || vendeurType;
  }

  /**
   * Envoie un email avec le mot de passe temporaire et le type de vendeur
   */
  async sendPasswordEmailWithType(to: string, firstName: string, lastName: string, temporaryPassword: string, vendeurType: VendeurType): Promise<void> {
    const subject = 'Votre compte PrintAlma a été créé';
    const formattedVendeurType = this.formatVendeurType(vendeurType);
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Activation de votre compte PrintAlma</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .password-box { background: #fff; border: 2px dashed #007bff; padding: 15px; margin: 15px 0; text-align: center; }
          .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #007bff; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; border-radius: 4px; }
          .seller-type { background: #e7f3ff; border: 1px solid #007bff; padding: 10px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur PrintAlma</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName} ${lastName},</h2>
            <p>Votre compte PrintAlma a été créé par un administrateur. Vous avez été enregistré en tant que <strong>${formattedVendeurType}</strong>.</p>
            
            <div class="seller-type">
              <h3>🎨 Votre profil vendeur :</h3>
              <p><strong>Type :</strong> ${formattedVendeurType}</p>
              <p>En tant que ${formattedVendeurType.toLowerCase()}, vous aurez accès à des fonctionnalités spécialisées adaptées à votre domaine d'expertise.</p>
            </div>
            
            <p>Pour activer votre compte, vous devez vous connecter avec le mot de passe temporaire ci-dessous et le changer lors de votre première connexion.</p>
            
            <div class="password-box">
              <p><strong>Votre mot de passe temporaire :</strong></p>
              <div class="password">${temporaryPassword}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong> Ce mot de passe est temporaire. Vous devrez le changer lors de votre première connexion pour des raisons de sécurité.
            </div>
            
            <p><strong>Vos informations de connexion :</strong></p>
            <ul>
              <li><strong>Email :</strong> ${to}</li>
              <li><strong>Type de compte :</strong> ${formattedVendeurType}</li>
              <li><strong>Mot de passe temporaire :</strong> (voir ci-dessus)</li>
            </ul>
            
            <p>Pour vous connecter, rendez-vous sur notre plateforme et utilisez ces identifiants. Vous serez invité à changer votre mot de passe immédiatement.</p>
            
            <p>Si vous rencontrez des problèmes, n'hésitez pas à contacter notre support.</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      console.log(`Email envoyé avec succès à ${to} (${formattedVendeurType})`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new Error('Impossible d\'envoyer l\'email');
    }
  }

  /**
   * Envoie un email avec le mot de passe temporaire (version simple)
   */
  async sendPasswordEmail(to: string, firstName: string, lastName: string, temporaryPassword: string): Promise<void> {
    const subject = 'Votre compte PrintAlma a été créé';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Activation de votre compte PrintAlma</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .password-box { background: #fff; border: 2px dashed #007bff; padding: 15px; margin: 15px 0; text-align: center; }
          .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #007bff; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur PrintAlma</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName} ${lastName},</h2>
            <p>Votre compte PrintAlma a été créé par un administrateur. Pour activer votre compte, vous devez vous connecter avec le mot de passe temporaire ci-dessous et le changer lors de votre première connexion.</p>
            
            <div class="password-box">
              <p><strong>Votre mot de passe temporaire :</strong></p>
              <div class="password">${temporaryPassword}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong> Ce mot de passe est temporaire. Vous devrez le changer lors de votre première connexion pour des raisons de sécurité.
            </div>
            
            <p><strong>Vos informations de connexion :</strong></p>
            <ul>
              <li><strong>Email :</strong> ${to}</li>
              <li><strong>Mot de passe temporaire :</strong> (voir ci-dessus)</li>
            </ul>
            
            <p>Pour vous connecter, rendez-vous sur notre plateforme et utilisez ces identifiants. Vous serez invité à changer votre mot de passe immédiatement.</p>
            
            <p>Si vous rencontrez des problèmes, n'hésitez pas à contacter notre support.</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      console.log(`Email envoyé avec succès à ${to}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new Error('Impossible d\'envoyer l\'email');
    }
  }

  /**
   * Envoie un email de notification générique
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    template: string;
    context: any;
  }): Promise<void> {
    try {
      let html = '';
      
      // Génération du HTML selon le template
      switch (options.template) {
        case 'design-submission':
          html = this.generateDesignSubmissionTemplate(options.context);
          break;
        case 'design-approved':
          html = this.generateDesignApprovedTemplate(options.context);
          break;
        case 'design-rejected':
          html = this.generateDesignRejectedTemplate(options.context);
          break;
        case 'product-submission':
          html = this.generateProductSubmissionTemplate(options.context);
          break;
        case 'product-approved':
          html = this.generateProductApprovedTemplate(options.context);
          break;
        case 'product-rejected':
          html = this.generateProductRejectedTemplate(options.context);
          break;
        case 'vendor-product-submission':
          html = this.generateVendorProductSubmissionTemplate(options.context);
          break;
        case 'vendor-product-approved':
          html = this.generateVendorProductApprovedTemplate(options.context);
          break;
        case 'vendor-product-rejected':
          html = this.generateVendorProductRejectedTemplate(options.context);
          break;
        case 'design-creation-notification':
          html = this.generateDesignCreationNotificationTemplate(options.context);
          break;
        case 'vendor-product-auto-published':
          html = this.generateVendorProductAutoPublishedTemplate(options.context);
          break;
        case 'vendor-product-validated-draft':
          html = this.generateVendorProductValidatedDraftTemplate(options.context);
          break;
        default:
          // Template générique
          html = this.generateGenericTemplate(options.context);
      }

      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        html,
      });
      
      console.log(`Email envoyé avec succès à ${options.to} (template: ${options.template})`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new Error('Impossible d\'envoyer l\'email');
    }
  }

  /**
   * Template pour notification de soumission de design aux admins
   */
  private generateDesignSubmissionTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nouveau design à valider</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .design-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 Nouveau design à valider</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${context.adminName},</h2>
            <p>Un nouveau design a été soumis pour validation sur la plateforme PrintAlma.</p>
            
            <div class="design-info">
              <h3>Détails du design :</h3>
              <p><strong>Nom :</strong> ${context.designName}</p>
              <p><strong>Catégorie :</strong> ${context.designCategory}</p>
              <p><strong>Vendeur :</strong> ${context.vendorName}</p>
              <p><strong>Date de soumission :</strong> ${context.submissionDate}</p>
            </div>
            
            <p>Vous pouvez maintenant examiner ce design et décider de l'approuver ou de le rejeter.</p>
            
            <a href="${context.validationUrl}" class="action-button">Voir les designs en attente</a>
            
            <p>Merci de traiter cette demande dans les plus brefs délais.</p>
            
            <p>Cordialement,<br>Système PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour notification d'approbation de design au vendeur
   */
  private generateDesignApprovedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Design approuvé</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .design-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Design approuvé !</h1>
          </div>
          <div class="content">
            <h2>Félicitations ${context.vendorName} !</h2>
            
            <div class="success-box">
              <h3>🎉 Bonne nouvelle !</h3>
              <p>Votre design a été approuvé par notre équipe et est maintenant publié sur la plateforme.</p>
            </div>
            
            <div class="design-info">
              <h3>Détails du design approuvé :</h3>
              <p><strong>Nom :</strong> ${context.designName}</p>
              <p><strong>Date d'approbation :</strong> ${context.approvalDate}</p>
              <p><strong>Validé par :</strong> ${context.validatorName}</p>
            </div>
            
            <p>Votre design est maintenant visible par tous les utilisateurs de la plateforme et peut commencer à générer des ventes.</p>
            
            <a href="${context.dashboardUrl}" class="action-button">Voir mes designs</a>
            
            <p>Continuez à créer des designs de qualité pour développer votre activité sur PrintAlma !</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour notification de rejet de design au vendeur
   */
  private generateDesignRejectedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Design nécessite des modifications</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .warning-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .reason-box { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .design-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Design nécessite des modifications</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${context.vendorName},</h2>
            
            <div class="warning-box">
              <h3>⚠️ Design non approuvé</h3>
              <p>Votre design a été examiné par notre équipe mais nécessite des modifications avant d'être publié.</p>
            </div>
            
            <div class="design-info">
              <h3>Détails du design :</h3>
              <p><strong>Nom :</strong> ${context.designName}</p>
              <p><strong>Date d'examen :</strong> ${context.rejectionDate}</p>
              <p><strong>Examiné par :</strong> ${context.validatorName}</p>
            </div>
            
            <div class="reason-box">
              <h3>💬 Raison du rejet :</h3>
              <p><em>"${context.rejectionReason}"</em></p>
            </div>
            
            <p>Ne vous découragez pas ! Vous pouvez modifier votre design selon ces recommandations et le soumettre à nouveau pour validation.</p>
            
            <h3>Prochaines étapes :</h3>
            <ol>
              <li>Accédez à votre tableau de bord</li>
              <li>Modifiez votre design selon les recommandations</li>
              <li>Soumettez-le à nouveau pour validation</li>
            </ol>
            
            <a href="${context.dashboardUrl}" class="action-button">Modifier mon design</a>
            
            <p>Notre équipe est là pour vous aider à créer des designs de qualité. N'hésitez pas à nous contacter si vous avez des questions.</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template générique
   */
  private generateGenericTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Notification PrintAlma</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PrintAlma</h1>
          </div>
          <div class="content">
            ${context.content || `<p>${context.message || 'Notification système'}</p>`}
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour notification de soumission de produit aux admins
   */
  private generateProductSubmissionTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nouveau produit à valider</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ff9800; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .product-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📦 Nouveau produit à valider</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${context.adminName},</h2>
            <p>Un nouveau produit a été soumis pour validation sur la plateforme PrintAlma.</p>
            
            <div class="product-info">
              <h3>Détails du produit :</h3>
              <p><strong>Nom :</strong> ${context.productName}</p>
              <p><strong>Prix :</strong> ${context.productPrice} FCFA</p>
              <p><strong>Catégories :</strong> ${context.productCategories}</p>
              <p><strong>Nombre d'images :</strong> ${context.productImagesCount}</p>
              <p><strong>Date de soumission :</strong> ${context.submissionDate}</p>
            </div>
            
            <p>Vous pouvez maintenant examiner ce produit et décider de l'approuver ou de le rejeter.</p>
            
            <a href="${context.validationUrl}" class="action-button">Voir les produits en attente</a>
            
            <p>Merci de traiter cette demande dans les plus brefs délais.</p>
            
            <p>Cordialement,<br>Système PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour notification d'approbation de produit au vendeur
   */
  private generateProductApprovedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Produit approuvé</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4caf50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .product-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Produit approuvé !</h1>
          </div>
          <div class="content">
            <h2>Félicitations ${context.vendorName} !</h2>
            
            <div class="success-box">
              <h3>🎉 Bonne nouvelle !</h3>
              <p>Votre produit a été approuvé par notre équipe et est maintenant publié sur la plateforme.</p>
            </div>
            
            <div class="product-info">
              <h3>Détails du produit approuvé :</h3>
              <p><strong>Nom :</strong> ${context.productName}</p>
              <p><strong>Date d'approbation :</strong> ${context.approvalDate}</p>
              <p><strong>Validé par :</strong> ${context.validatorName}</p>
            </div>
            
            <p>Votre produit est maintenant visible par tous les utilisateurs de la plateforme et peut commencer à générer des ventes.</p>
            
            <a href="${context.dashboardUrl}" class="action-button">Voir mes produits</a>
            
            <p>Continuez à créer des produits de qualité pour développer votre activité sur PrintAlma !</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour notification de rejet de produit au vendeur
   */
  private generateProductRejectedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Produit nécessite des modifications</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f44336; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .warning-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .reason-box { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .product-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Produit nécessite des modifications</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${context.vendorName},</h2>
            
            <div class="warning-box">
              <h3>⚠️ Produit non approuvé</h3>
              <p>Votre produit a été examiné par notre équipe mais nécessite des modifications avant d'être publié.</p>
            </div>
            
            <div class="product-info">
              <h3>Détails du produit :</h3>
              <p><strong>Nom :</strong> ${context.productName}</p>
              <p><strong>Date d'examen :</strong> ${context.rejectionDate}</p>
              <p><strong>Examiné par :</strong> ${context.validatorName}</p>
            </div>
            
            <div class="reason-box">
              <h3>💬 Raison du rejet :</h3>
              <p><em>"${context.rejectionReason}"</em></p>
            </div>
            
            <p>Ne vous découragez pas ! Vous pouvez modifier votre produit selon ces recommandations et le soumettre à nouveau pour validation.</p>
            
            <h3>Prochaines étapes :</h3>
            <ol>
              <li>Accédez à votre tableau de bord</li>
              <li>Modifiez votre produit selon les recommandations</li>
              <li>Soumettez-le à nouveau pour validation</li>
            </ol>
            
            <a href="${context.dashboardUrl}" class="action-button">Modifier mon produit</a>
            
            <p>Notre équipe est là pour vous aider à créer des produits de qualité. N'hésitez pas à nous contacter si vous avez des questions.</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * MÉTHODES POUR LA RÉINITIALISATION DE MOT DE PASSE
   */

  /**
   * Envoie un email de réinitialisation de mot de passe avec un lien contenant le token
   */
  async sendPasswordResetEmail(to: string, firstName: string, lastName: string, resetToken: string): Promise<void> {
    const subject = 'Réinitialisation de votre mot de passe PrintAlma';
    
    // URL de réinitialisation - Configuration directe
    const frontendUrl = 'http://localhost:5174';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .reset-box { background: #fff; border: 2px solid #007bff; padding: 20px; margin: 20px 0; text-align: center; border-radius: 8px; }
          .reset-button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 10px 0; }
          .reset-button:hover { background: #0056b3; }
          .token-box { background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .token { font-family: 'Courier New', monospace; font-size: 14px; word-break: break-all; color: #495057; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .security-notice { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Réinitialisation de mot de passe</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName} ${lastName},</h2>
            <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte PrintAlma.</p>
            
            <div class="reset-box">
              <h3>Réinitialisez votre mot de passe</h3>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <a href="${resetUrl}" class="reset-button">Réinitialiser mon mot de passe</a>
              <p style="margin-top: 15px; font-size: 12px; color: #666;">
                Ce lien est valide pendant 1 heure.
              </p>
            </div>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Ce lien expire dans <strong>1 heure</strong></li>
                <li>Le lien ne peut être utilisé qu'<strong>une seule fois</strong></li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              </ul>
            </div>

            <div class="security-notice">
              <h4>🛡️ Pour votre sécurité :</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Choisissez un mot de passe fort (minimum 8 caractères)</li>
                <li>Utilisez une combinaison de lettres, chiffres et symboles</li>
                <li>N'utilisez pas le même mot de passe que d'autres services</li>
              </ul>
            </div>
            
            <h4>Le lien ne fonctionne pas ?</h4>
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <div class="token-box">
              <div class="token">${resetUrl}</div>
            </div>
            
            <p>Ou utilisez directement ce token de réinitialisation :</p>
            <div class="token-box">
              <div class="token">${resetToken}</div>
            </div>
            
            <p>Si vous rencontrez des problèmes, contactez notre support technique.</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email en toute sécurité.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      console.log(`Email de réinitialisation envoyé avec succès à ${to}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
      throw new Error('Impossible d\'envoyer l\'email de réinitialisation');
    }
  }

  /**
   * Envoie un email de confirmation après réinitialisation réussie
   */
  async sendPasswordResetConfirmationEmail(to: string, firstName: string, lastName: string): Promise<void> {
    const subject = 'Mot de passe réinitialisé avec succès - PrintAlma';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mot de passe réinitialisé</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .security-tips { background: #e2e3e5; border: 1px solid #c6c8ca; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Mot de passe réinitialisé</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${firstName} ${lastName},</h2>
            
            <div class="success-box">
              <h3>🎉 Réinitialisation réussie !</h3>
              <p>Votre mot de passe a été modifié avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            </div>
            
            <p>Cette confirmation vous informe que votre mot de passe PrintAlma a été changé le <strong>${new Date().toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</strong>.</p>
            
            <div class="security-tips">
              <h4>🛡️ Conseils de sécurité :</h4>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Gardez votre mot de passe confidentiel</li>
                <li>Ne le partagez avec personne</li>
                <li>Déconnectez-vous toujours après utilisation sur un ordinateur partagé</li>
                <li>Contactez-nous immédiatement si vous remarquez une activité suspecte</li>
              </ul>
            </div>
            
            <p><strong>Vous n'avez pas demandé cette modification ?</strong></p>
            <p>Si vous n'avez pas initié cette réinitialisation, contactez immédiatement notre support technique. Votre compte pourrait être compromis.</p>
            
            <p>Vous pouvez maintenant vous connecter normalement avec votre nouveau mot de passe.</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement pour confirmer la modification de votre mot de passe.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      console.log(`Email de confirmation de réinitialisation envoyé à ${to}`);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
      throw new Error('Impossible d\'envoyer l\'email de confirmation');
    }
  }

  /**
   * Envoie un email de notification simple (version originale conservée)
   */
  async sendNotificationEmail(to: string, subject: string, content: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PrintAlma</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new Error('Impossible d\'envoyer l\'email');
    }
  }

  /**
   * Template pour notification de soumission de produit vendeur aux admins
   */
  private generateVendorProductSubmissionTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nouveau produit vendeur à valider</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #9c27b0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .product-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .vendor-info { background: #e8f5e8; border: 1px solid #4caf50; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛍️ Nouveau produit vendeur à valider</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${context.adminName},</h2>
            <p>Un vendeur a soumis un nouveau produit personnalisé pour validation sur la plateforme PrintAlma.</p>
            
            <div class="vendor-info">
              <h3>👤 Informations vendeur :</h3>
              <p><strong>Vendeur :</strong> ${context.vendorName}</p>
            </div>
            
            <div class="product-info">
              <h3>📦 Détails du produit :</h3>
              <p><strong>Nom du produit :</strong> ${context.productName}</p>
              <p><strong>Prix vendeur :</strong> ${context.productPrice} FCFA</p>
              <p><strong>Produit de base :</strong> ${context.baseProductName}</p>
              <p><strong>Catégories :</strong> ${context.productCategories}</p>
              <p><strong>Nombre d'images :</strong> ${context.productImagesCount}</p>
              <p><strong>Date de soumission :</strong> ${context.submissionDate}</p>
            </div>
            
            <p>Ce produit contient un design personnalisé et nécessite votre validation avant d'être publié sur la plateforme.</p>
            
            <a href="${context.validationUrl}" class="action-button">Voir les produits vendeur en attente</a>
            
            <p>Merci de traiter cette demande dans les plus brefs délais pour permettre au vendeur de commencer ses ventes.</p>
            
            <p>Cordialement,<br>Système PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour notification d'approbation de produit vendeur
   */
  private generateVendorProductApprovedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Produit approuvé - Félicitations !</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4caf50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .product-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .next-steps { background: #e7f3ff; border: 1px solid #007bff; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Produit approuvé !</h1>
          </div>
          <div class="content">
            <h2>Félicitations ${context.vendorName} !</h2>
            
            <div class="success-box">
              <h3>🎉 Excellente nouvelle !</h3>
              <p>Votre produit personnalisé a été approuvé par notre équipe et est maintenant publié sur la plateforme PrintAlma.</p>
            </div>
            
            <div class="product-info">
              <h3>📦 Détails du produit approuvé :</h3>
              <p><strong>Nom :</strong> ${context.productName}</p>
              <p><strong>Date d'approbation :</strong> ${context.approvalDate}</p>
              <p><strong>Validé par :</strong> ${context.validatorName}</p>
            </div>
            
            <div class="next-steps">
              <h3>🚀 Prochaines étapes :</h3>
              <ul>
                <li>Votre produit est maintenant visible par tous les clients</li>
                <li>Vous pouvez commencer à recevoir des commandes</li>
                <li>Suivez vos ventes depuis votre tableau de bord</li>
                <li>Assurez-vous d'avoir du stock disponible</li>
              </ul>
            </div>
            
            <a href="${context.productUrl}" class="action-button">Voir mon produit</a>
            <a href="${context.dashboardUrl}" class="action-button">Tableau de bord</a>
            
            <p>Continuez à créer des designs uniques pour développer votre boutique sur PrintAlma !</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Template pour notification de rejet de produit vendeur
   */
  private generateVendorProductRejectedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Produit Vendeur Rejeté - PrintAlma</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: #dc3545; color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .product-info { background: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; margin: 20px 0; }
          .rejection-reason { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; background: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Produit Rejeté</h1>
            <p>Votre produit nécessite des modifications</p>
          </div>
          <div class="content">
            <h2>Bonjour ${context.vendorName},</h2>
            <p>Nous avons examiné votre produit vendeur et nous devons vous informer qu'il a été rejeté.</p>
            
            <div class="product-info">
              <h3>📋 Informations du produit :</h3>
              <p><strong>Nom :</strong> ${context.productName}</p>
              <p><strong>Prix :</strong> ${context.productPrice} FCFA</p>
              <p><strong>Date de soumission :</strong> ${context.submissionDate}</p>
              <p><strong>Examiné par :</strong> ${context.validatorName}</p>
              <p><strong>Date d'examen :</strong> ${context.rejectionDate}</p>
            </div>
            
            <div class="rejection-reason">
              <h3>📝 Motif du rejet :</h3>
              <p>${context.rejectionReason}</p>
            </div>
            
            <p>Nous vous encourageons à apporter les modifications nécessaires et à soumettre à nouveau votre produit.</p>
            
            <p>Pour modifier votre produit :</p>
            <ol>
              <li>Connectez-vous à votre tableau de bord vendeur</li>
              <li>Modifiez votre produit selon les commentaires fournis</li>
              <li>Soumettez à nouveau votre produit pour validation</li>
            </ol>
            
            <a href="${context.dashboardUrl}" class="button">Accéder au tableau de bord</a>
            
            <p>Si vous avez des questions concernant ce rejet, n'hésitez pas à contacter notre équipe de support.</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
          </div>
          <div class="footer">
            <p>© 2024 PrintAlma. Tous droits réservés.</p>
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 🆕 Génère le template pour la notification de création de design aux admins
   */
  private generateDesignCreationNotificationTemplate(context: any): string {
    const { designName, vendorName, vendorEmail, designUrl, productName } = context;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nouveau design créé - ${designName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .design-box { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .vendor-info { background: #e8f5e8; border: 1px solid #4CAF50; padding: 10px; margin: 15px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .design-image { max-width: 100%; height: auto; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎨 Nouveau Design Créé</h1>
          </div>
          <div class="content">
            <h2>Un nouveau design a été créé sur PrintAlma</h2>
            
            <div class="vendor-info">
              <h3>👤 Informations Vendeur :</h3>
              <p><strong>Nom :</strong> ${vendorName}</p>
              <p><strong>Email :</strong> ${vendorEmail}</p>
            </div>
            
            <div class="design-box">
              <h3>🎨 Détails du Design :</h3>
              <p><strong>Nom du design :</strong> ${designName}</p>
              <p><strong>Produit associé :</strong> ${productName}</p>
              ${designUrl ? `<p><strong>Aperçu :</strong></p><img src="${designUrl}" alt="Design" class="design-image">` : ''}
            </div>
            
            <p>Ce design est maintenant disponible dans le système et peut être utilisé pour créer des produits personnalisés.</p>
            
            <p>Consultez le tableau de bord administrateur pour plus de détails ou pour effectuer des actions sur ce design.</p>
            
            <p>Cordialement,<br>L'équipe PrintAlma</p>
            </div>
          <div class="footer">
            <p>Notification automatique - PrintAlma © 2024</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 🆕 Template pour notification de produit auto-publié après validation design
   */
  private generateVendorProductAutoPublishedTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Produit publié automatiquement</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .product-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .action-button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Produit publié automatiquement !</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${context.vendorName},</h2>
            
            <div class="success-box">
              <h3 style="color: #059669; margin: 0 0 10px 0;">🚀 Excellente nouvelle !</h3>
              <p>Votre design a été validé par notre équipe et votre produit a été <strong>publié automatiquement</strong> comme vous l'aviez demandé.</p>
            </div>
            
            <div class="product-info">
              <h3>📦 Détails du produit</h3>
              <p><strong>Nom :</strong> ${context.productName}</p>
              <p><strong>Prix :</strong> ${context.productPrice}€</p>
              <p><strong>Statut :</strong> <span style="color: #10b981; font-weight: bold;">PUBLIÉ</span></p>
            </div>
            
            <p>Votre produit est maintenant <strong>visible par tous les clients</strong> sur la plateforme Printalma et peut commencer à générer des ventes !</p>
            
            <a href="${context.dashboardUrl}" class="action-button">Gérer mes produits</a>
            
            <p>Continuez à créer des produits de qualité pour développer votre activité.</p>
            
            <p>Merci de votre confiance,<br>L'équipe Printalma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 🆕 Template pour notification de produit validé et mis en brouillon
   */
  private generateVendorProductValidatedDraftTemplate(context: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Produit validé - Prêt à publier</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .info-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .product-info { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .tip-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .action-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Produit validé et prêt à publier !</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${context.vendorName},</h2>
            
            <div class="info-box">
              <h3 style="color: #1d4ed8; margin: 0 0 10px 0;">🎯 Bonne nouvelle !</h3>
              <p>Votre design a été validé par notre équipe et votre produit a été <strong>mis en brouillon</strong> comme vous l'aviez demandé.</p>
            </div>
            
            <div class="product-info">
              <h3>📦 Détails du produit</h3>
              <p><strong>Nom :</strong> ${context.productName}</p>
              <p><strong>Prix :</strong> ${context.productPrice}€</p>
              <p><strong>Statut :</strong> <span style="color: #3b82f6; font-weight: bold;">VALIDÉ - PRÊT À PUBLIER</span></p>
            </div>
            
            <p>Votre produit est maintenant <strong>prêt à être publié</strong> ! Vous pouvez le publier quand vous le souhaitez depuis votre espace vendeur.</p>
            
            <div class="tip-box">
              <p style="margin: 0;"><strong>💡 Astuce :</strong> Une fois publié, votre produit sera visible par tous les clients sur la plateforme et pourra générer des ventes.</p>
            </div>
            
            <a href="${context.dashboardUrl}" class="action-button">Publier maintenant</a>
            
            <p>Prenez le temps de vérifier tous les détails avant de publier votre produit.</p>
            
            <p>Merci de votre confiance,<br>L'équipe Printalma</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 🆕 Envoie un email de bienvenue pour un vendeur avec profil étendu
   */
  async sendVendorWelcomeEmail(vendorData: {
    email: string;
    firstName: string;
    lastName: string;
    tempPassword: string;
    shopName: string;
    vendeur_type?: string;
  }): Promise<void> {
    const { email, firstName, lastName, tempPassword, shopName, vendeur_type } = vendorData;
    
    const subject = `Bienvenue sur PrintAlma - Votre boutique "${shopName}" est prête !`;
    const formattedVendeurType = vendeur_type ? this.formatVendeurType(vendeur_type as VendeurType) : 'Vendeur';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Bienvenue sur PrintAlma</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; background: #f9f9f9; }
          .shop-info { background: #fff; border: 2px solid #000; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .password-box { background: #fff; border: 2px dashed #000; padding: 15px; margin: 15px 0; text-align: center; border-radius: 8px; }
          .password { font-family: 'Courier New', monospace; font-size: 18px; font-weight: bold; color: #000; background: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 6px; }
          .login-button { background: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
          .shop-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue sur PrintAlma !</h1>
            </div>
          <div class="content">
            <h2>Bonjour <strong>${firstName} ${lastName}</strong>,</h2>
            
            <p>Félicitations ! Votre compte vendeur a été créé avec succès sur la plateforme PrintAlma.</p>
            
            <div class="shop-info">
              <h3>🏪 Informations de votre boutique :</h3>
              <div class="shop-badge">${formattedVendeurType}</div>
              <ul style="list-style: none; padding: 0;">
                <li><strong>🏷️ Nom de la boutique :</strong> ${shopName}</li>
                <li><strong>📧 Email de connexion :</strong> ${email}</li>
                <li><strong>🎯 Type de vendeur :</strong> ${formattedVendeurType}</li>
              </ul>
            </div>
            
            <div class="password-box">
              <p><strong>🔑 Votre mot de passe temporaire :</strong></p>
              <div class="password">${tempPassword}</div>
            </div>
            
            <div class="warning">
              <p><strong>⚠️ Important :</strong> Pour des raisons de sécurité, vous devrez changer ce mot de passe lors de votre première connexion.</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://printalma.com'}/login" class="login-button">
                🚀 Se connecter à PrintAlma
              </a>
            </div>
            
            <h3>🌟 Prochaines étapes :</h3>
            <ol>
              <li>Connectez-vous avec vos identifiants</li>
              <li>Changez votre mot de passe temporaire</li>
              <li>Complétez votre profil vendeur</li>
              <li>Commencez à créer et vendre vos designs !</li>
            </ol>
            
            <p>En tant que <strong>${formattedVendeurType.toLowerCase()}</strong>, vous avez accès à des fonctionnalités spécialisées pour développer votre activité sur PrintAlma.</p>
            
            <p>Si vous avez des questions ou besoin d'aide, notre équipe support est là pour vous accompagner.</p>
            
            <p>Bienvenue dans la communauté PrintAlma ! 🎨</p>
            
            <p>Cordialement,<br><strong>L'équipe PrintAlma</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 PrintAlma - Plateforme de création et vente de designs</p>
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre directement.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject,
        html,
      });
      console.log(`✅ Email de bienvenue envoyé à ${firstName} ${lastName} (${email}) - Boutique: ${shopName}`);
    } catch (error) {
      console.error('❌ Erreur envoi email bienvenue vendeur:', error);
      throw new Error('Impossible d\'envoyer l\'email de bienvenue');
    }
  }

  /**
   * Envoie un email avec le code d'activation (version optimisée et rapide)
   */
  async sendActivationCode(to: string, firstName: string, lastName: string, activationCode: string, vendeurType: VendeurType): Promise<void> {
    const subject = '🔑 Votre code d\'activation PrintAlma';
    const formattedVendeurType = this.formatVendeurType(vendeurType);
    
    // Email simple et optimisé pour la vitesse
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #007bff; text-align: center;">PrintAlma - Code d'Activation</h2>
        
        <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
        
        <p>Votre compte <strong>${formattedVendeurType}</strong> a été créé par un administrateur.</p>
        
        <div style="background: #f0f8ff; border: 2px solid #007bff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0; color: #007bff;">Votre code d'activation</h3>
          <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 4px; margin: 10px 0;">${activationCode}</div>
        </div>
        
        <p><strong>Pour activer votre compte :</strong></p>
        <ol>
          <li>Allez sur la page de connexion</li>
          <li>Cliquez sur "Première connexion"</li>
          <li>Saisissez votre email : <strong>${to}</strong></li>
          <li>Entrez ce code : <strong>${activationCode}</strong></li>
          <li>Créez votre mot de passe</li>
        </ol>
        
        <p style="background: #fff3cd; padding: 10px; border-radius: 4px; margin: 15px 0;">
          ⚠️ <strong>Important :</strong> Ce code expire dans 24 heures.
        </p>
        
        <p style="text-align: center; font-size: 12px; color: #666; margin-top: 30px;">
          PrintAlma - Email automatique
        </p>
      </div>
    `;

    try {
      // Envoi asynchrone pour la vitesse
      this.mailerService.sendMail({
        to,
        subject,
        html,
      }).catch(error => {
        console.error('Erreur envoi email activation:', error);
      });
      
      console.log(`📧 Code d'activation envoyé à ${to} (${formattedVendeurType})`);
    } catch (error) {
      console.error('Erreur immédiate envoi email:', error);
      // Ne pas bloquer la création du compte pour un problème d'email
    }
  }

  /**
   * Envoie une notification d'ajout de numéro de téléphone avec période de sécurité
   */
  async sendPhoneAddedNotification(params: {
    to: string;
    vendorName: string;
    phoneNumber: string;
    activationDate: Date;
  }): Promise<void> {
    const { to, vendorName, phoneNumber, activationDate } = params;

    const subject = '🔒 Nouveau numéro ajouté à votre compte PrintAlma';

    const formattedDate = activationDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: rgb(20, 104, 154); border-bottom: 2px solid rgb(20, 104, 154); padding-bottom: 10px;">
          Nouveau numéro de téléphone ajouté
        </h2>

        <p>Bonjour <strong>${vendorName}</strong>,</p>

        <p>Un nouveau numéro de téléphone a été ajouté à votre compte PrintAlma :</p>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Numéro:</strong> ${phoneNumber}</p>
          <p style="margin: 10px 0 0 0;"><strong>Date d'activation:</strong> ${formattedDate}</p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #92400e;">⏱️ Période de sécurité: 48 heures</h3>
          <p style="margin: 0; color: #92400e;">
            Par mesure de sécurité, ce numéro ne pourra être utilisé pour des retraits
            qu'après une période de 48 heures. Cela permet de protéger votre compte contre
            les accès non autorisés.
          </p>
        </div>

        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #991b1b;">⚠️ Vous n'avez pas effectué cette action?</h3>
          <p style="margin: 0; color: #991b1b;">
            Si vous n'êtes pas à l'origine de cet ajout, veuillez <strong>contacter immédiatement</strong>
            notre support à <a href="mailto:security@printalma.com" style="color: #991b1b; font-weight: bold;">security@printalma.com</a>
            ou changez votre mot de passe dès maintenant.
          </p>
        </div>

        <div style="background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #075985;">ℹ️ Comment ça marche?</h3>
          <ul style="margin: 10px 0; padding-left: 20px; color: #075985;">
            <li>Votre numéro est maintenant vérifié et enregistré</li>
            <li>Vous pourrez l'utiliser pour les retraits après ${formattedDate}</li>
            <li>Vous recevrez une confirmation par email quand il sera activé</li>
            <li>Vous pouvez voir le statut dans votre espace vendeur</li>
          </ul>
        </div>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Cet email a été envoyé automatiquement par PrintAlma. Merci de ne pas y répondre.<br>
          Pour toute question, contactez notre support: <a href="mailto:support@printalma.com">support@printalma.com</a>
        </p>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      console.log(`📧 Email de notification d'ajout de numéro envoyé à ${to}`);
    } catch (error) {
      console.error('Erreur envoi email notification numéro:', error);
      // Ne pas bloquer l'opération pour un problème d'email
    }
  }

  /**
   * Envoie une notification de suppression de numéro
   */
  async sendPhoneRemovedNotification(params: {
    to: string;
    vendorName: string;
    phoneNumber: string;
  }): Promise<void> {
    const { to, vendorName, phoneNumber } = params;

    const subject = '🗑️ Numéro de téléphone supprimé de votre compte';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: rgb(20, 104, 154); border-bottom: 2px solid rgb(20, 104, 154); padding-bottom: 10px;">
          Numéro de téléphone supprimé
        </h2>

        <p>Bonjour <strong>${vendorName}</strong>,</p>

        <p>Le numéro de téléphone suivant a été supprimé de votre compte PrintAlma :</p>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Numéro supprimé:</strong> ${phoneNumber}</p>
          <p style="margin: 10px 0 0 0;"><strong>Date de suppression:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>

        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #991b1b;">⚠️ Vous n'avez pas effectué cette action?</h3>
          <p style="margin: 0; color: #991b1b;">
            Si vous n'êtes pas à l'origine de cette suppression, veuillez <strong>contacter immédiatement</strong>
            notre support à <a href="mailto:security@printalma.com" style="color: #991b1b; font-weight: bold;">security@printalma.com</a>
            et changez votre mot de passe dès maintenant.
          </p>
        </div>

        <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Cet email a été envoyé automatiquement par PrintAlma. Merci de ne pas y répondre.
        </p>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        html,
      });
      console.log(`📧 Email de notification de suppression envoyé à ${to}`);
    } catch (error) {
      console.error('Erreur envoi email notification suppression:', error);
    }
  }

  /**
   * Envoie la facture de commande par email avec l'image du produit
   * @param order - Commande complète avec items et utilisateur
   */
  async sendOrderInvoice(order: any): Promise<void> {
    console.log(`\n📧 [MailService] sendOrderInvoice appelée pour commande ${order.orderNumber}`);
    console.log(`📧 [MailService] Email destination: ${order.email || 'AUCUN'}`);
    console.log(`📧 [MailService] Nombre d'items: ${order.orderItems?.length || 0}`);

    if (!order.email) {
      console.warn(`⚠️  [MailService] IMPOSSIBLE d'envoyer la facture pour la commande ${order.orderNumber} : email manquant`);
      console.warn(`💡 [MailService] Vérifiez que le champ "email" est bien fourni lors de la création de commande`);
      return;
    }

    const subject = `Facture PrintAlma - Commande #${order.orderNumber}`;
    const customerName = order.shippingName || 'Client';
    const orderDate = new Date(order.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Calculer le total
    const subtotal = order.subtotal || order.totalAmount - (order.shippingAmount || 0);
    const shippingFee = order.deliveryFee || order.shippingAmount || 0;
    const total = order.totalAmount;

    // Générer le HTML des items de commande
    const itemsHtml = order.orderItems?.map((item: any) => {
      const productName = item.productName || item.product?.name || item.vendorProduct?.name || 'Produit';

      // 🔧 FIX: Différencier les produits vendeurs des produits normaux
      // Pour les PRODUITS VENDEURS : utiliser finalImageUrl du vendorProduct
      // Pour les PRODUITS NORMAUX : utiliser mockupUrl de l'orderItem
      let rawImage: string | null = null;

      if (item.vendorProductId && item.vendorProduct?.finalImageUrl) {
        // Cas 1: Produit vendeur - utiliser finalImageUrl
        rawImage = item.vendorProduct.finalImageUrl;
        console.log(`📸 [MailService] Produit vendeur "${productName}" - Image: ${rawImage}`);
      } else if (item.mockupUrl) {
        // Cas 2: Produit normal avec mockup personnalisé (image déjà générée lors de la commande)
        rawImage = item.mockupUrl;
        console.log(`📸 [MailService] Produit normal "${productName}" - Image: ${rawImage}`);
      } else {
        console.warn(`⚠️  [MailService] Aucune image pour "${productName}" (vendorProductId: ${item.vendorProductId}, mockupUrl: ${item.mockupUrl})`);
      }

      // Convertir les URLs relatives en URLs absolues pour l'affichage dans l'email
      const productImage = this.toAbsoluteUrl(rawImage) || 'https://via.placeholder.com/80?text=Image';
      console.log(`🔗 [MailService] Image finale pour "${productName}": ${productImage}`);

      const quantity = item.quantity || 1;
      const unitPrice = item.unitPrice || item.price || 0;
      const itemTotal = unitPrice * quantity;
      const size = item.size || 'Standard';
      const color = item.color || item.colorVariation?.name || '-';

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 15px 10px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <img
                src="${productImage}"
                alt="${productName}"
                style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e5e7eb;"
                onerror="this.src='https://via.placeholder.com/80?text=Image'"
              />
              <div>
                <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${productName}</div>
                <div style="font-size: 13px; color: #6b7280;">
                  Taille: ${size} • Couleur: ${color}
                </div>
              </div>
            </div>
          </td>
          <td style="padding: 15px 10px; text-align: center; color: #6b7280;">${quantity}</td>
          <td style="padding: 15px 10px; text-align: right; color: #6b7280;">${unitPrice.toFixed(0)} FCFA</td>
          <td style="padding: 15px 10px; text-align: right; font-weight: 600; color: #111827;">${itemTotal.toFixed(0)} FCFA</td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #6b7280;">Aucun article</td></tr>';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Facture PrintAlma</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #14689a 0%, #0d4a6f 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">PrintAlma</h1>
            <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 14px;">Votre plateforme de vente en ligne</p>
          </div>

          <!-- Facture Info -->
          <div style="padding: 30px; background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0 0 10px 0; color: #111827; font-size: 24px;">Facture de commande</h2>
              <div style="display: inline-block; background-color: #14689a; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                #${order.orderNumber}
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 25px; flex-wrap: wrap; gap: 20px;">
              <div style="flex: 1; min-width: 200px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Facturé à</div>
                <div style="color: #111827; font-weight: 600; margin-bottom: 4px;">${customerName}</div>
                <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                  ${order.shippingAddressFull || order.shippingStreet || ''}<br>
                  ${order.shippingCity || ''} ${order.shippingPostalCode || ''}<br>
                  ${order.shippingCountry || ''}
                </div>
              </div>
              <div style="text-align: right; min-width: 200px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; font-weight: 600;">Date de commande</div>
                <div style="color: #111827; font-weight: 600;">${orderDate}</div>
                <div style="margin-top: 12px; font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; font-weight: 600;">Statut de paiement</div>
                <div style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600;">
                  Payé
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div style="padding: 30px;">
            <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 700;">Détails de la commande</h3>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                  <th style="padding: 12px 10px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Produit</th>
                  <th style="padding: 12px 10px; text-align: center; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; width: 80px;">Qté</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; width: 120px;">Prix unit.</th>
                  <th style="padding: 12px 10px; text-align: right; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: 600; width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="padding: 0 30px 30px 30px;">
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-size: 15px;">Sous-total</span>
                <span style="color: #111827; font-weight: 600; font-size: 15px;">${subtotal.toFixed(0)} FCFA</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: #6b7280; font-size: 15px;">Frais de livraison</span>
                <span style="color: #111827; font-weight: 600; font-size: 15px;">${shippingFee.toFixed(0)} FCFA</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px;">
                <span style="color: #111827; font-size: 18px; font-weight: 700;">Total</span>
                <span style="color: #14689a; font-size: 24px; font-weight: 700;">${total.toFixed(0)} FCFA</span>
              </div>
            </div>
          </div>

          <!-- Shipping Info -->
          ${order.deliveryCityName ? `
          <div style="padding: 0 30px 30px 30px;">
            <div style="background-color: #eff6ff; border-left: 4px solid #14689a; padding: 16px; border-radius: 6px;">
              <div style="font-weight: 600; color: #14689a; margin-bottom: 8px; font-size: 15px;">📦 Informations de livraison</div>
              <div style="color: #1e40af; font-size: 14px; line-height: 1.6;">
                <strong>Destination:</strong> ${order.deliveryCityName}, ${order.deliveryRegionName || ''}<br>
                ${order.transporteurName ? `<strong>Transporteur:</strong> ${order.transporteurName}<br>` : ''}
                ${order.deliveryTime ? `<strong>Délai estimé:</strong> ${order.deliveryTime}` : ''}
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px; font-weight: 700;">Merci pour votre commande !</h3>
            <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
              Nous apprécions votre confiance en PrintAlma.<br>
              Si vous avez des questions, n'hésitez pas à nous contacter.
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} PrintAlma - Plateforme de vente en ligne<br>
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;

    try {
      console.log(`📧 [MailService] Envoi de l'email à ${order.email}...`);
      console.log(`📧 [MailService] Sujet: ${subject}`);

      await this.mailerService.sendMail({
        to: order.email,
        subject,
        html,
      });

      console.log(`✅ [MailService] Facture envoyée avec succès à ${order.email} pour la commande ${order.orderNumber}`);
    } catch (error) {
      console.error(`❌ [MailService] Erreur lors de l'envoi de la facture pour la commande ${order.orderNumber}:`, error.message);
      console.error(`   Détails:`, error);
      // Ne pas faire échouer la mise à jour de la commande si l'email échoue
      throw error; // 🔧 Re-throw pour que order.service puisse logger l'erreur
    }
  }

  /**
   * Envoie un email de confirmation de personnalisation au client
   * @param customizationData - Données de personnalisation avec mockup et infos produit
   */
  async sendCustomizationEmail(customizationData: {
    email: string;
    productName: string;
    mockupUrl: string;
    clientName?: string;
  }): Promise<void> {
    console.log(`\n📧 [MailService] sendCustomizationEmail appelée pour le produit "${customizationData.productName}"`);
    console.log(`📧 [MailService] Email destination: ${customizationData.email}`);
    console.log(`📧 [MailService] Mockup URL: ${customizationData.mockupUrl}`);

    if (!customizationData.email) {
      console.warn(`⚠️  [MailService] IMPOSSIBLE d'envoyer l'email de personnalisation : email manquant`);
      return;
    }

    if (!customizationData.mockupUrl) {
      console.warn(`⚠️  [MailService] IMPOSSIBLE d'envoyer l'email de personnalisation : mockup manquant`);
      return;
    }

    const subject = `Votre personnalisation PrintAlma - ${customizationData.productName}`;
    const customerName = customizationData.clientName || 'Cher client';
    const mockupImage = this.toAbsoluteUrl(customizationData.mockupUrl) || customizationData.mockupUrl;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre personnalisation PrintAlma</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff;">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #14689a 0%, #0d4a6f 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">PrintAlma</h1>
            <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 14px;">Votre plateforme de personnalisation en ligne</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 24px; text-align: center;">Votre personnalisation est prête ! 🎨</h2>

            <p style="margin: 0 0 25px 0; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
              Bonjour ${customerName},<br><br>
              Nous avons bien enregistré votre personnalisation pour <strong style="color: #111827;">${customizationData.productName}</strong>.
            </p>

            <!-- Mockup Image -->
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <img
                  src="${mockupImage}"
                  alt="${customizationData.productName}"
                  style="width: 100%; max-width: 500px; height: auto; display: block;"
                  onerror="this.style.display='none'; this.parentElement.innerHTML='<p style=padding:40px;color:#6b7280;>Image non disponible</p>'"
                />
              </div>
            </div>

            <!-- Description -->
            <div style="background-color: #eff6ff; border-left: 4px solid #14689a; padding: 20px; border-radius: 6px; margin: 30px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 15px; line-height: 1.6;">
                <strong>✨ Votre création est unique !</strong><br><br>
                Votre personnalisation a été sauvegardée avec succès. Vous pouvez maintenant passer commande pour recevoir ce produit personnalisé.
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${process.env.FRONTEND_URL || 'https://printalma.com'}"
                 style="display: inline-block; background-color: #14689a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(20, 104, 154, 0.2);">
                Commander maintenant
              </a>
            </div>

            <p style="margin: 25px 0 0 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
              Vous pouvez également revenir à tout moment pour modifier votre personnalisation<br>
              ou créer de nouvelles personnalisations.
            </p>
          </div>

          <!-- Footer -->
          <div style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #111827; font-size: 18px; font-weight: 700;">Merci de faire confiance à PrintAlma !</h3>
            <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
              Notre équipe est là pour vous accompagner dans la création de vos produits personnalisés.<br>
              Si vous avez des questions, n'hésitez pas à nous contacter.
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} PrintAlma - Plateforme de personnalisation en ligne<br>
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>

        </div>
      </body>
      </html>
    `;

    try {
      console.log(`📧 [MailService] Envoi de l'email de personnalisation à ${customizationData.email}...`);
      console.log(`📧 [MailService] Sujet: ${subject}`);

      await this.mailerService.sendMail({
        to: customizationData.email,
        subject,
        html,
      });

      console.log(`✅ [MailService] Email de personnalisation envoyé avec succès à ${customizationData.email}`);
    } catch (error) {
      console.error(`❌ [MailService] Erreur lors de l'envoi de l'email de personnalisation:`, error.message);
      console.error(`   Détails:`, error);
      // Ne pas faire échouer la sauvegarde de personnalisation si l'email échoue
      throw error;
    }
  }
}