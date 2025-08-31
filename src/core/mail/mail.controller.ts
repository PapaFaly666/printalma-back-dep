import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { MailService, VendeurType } from './mail.service';

@ApiTags('Mail (Test)')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('test-password-generation')
  @ApiOperation({ summary: 'Tester la génération de mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe généré' })
  testPasswordGeneration() {
    const password = this.mailService.generateRandomPassword();
    return {
      message: 'Mot de passe généré avec succès',
      password: password,
      length: password.length
    };
  }

  @Post('test-send-email')
  @ApiOperation({ summary: 'Tester l\'envoi d\'email simple (développement uniquement)' })
  @ApiResponse({ status: 200, description: 'Email envoyé' })
  async testSendEmail(@Body() body: { email: string; firstName: string; lastName: string }) {
    const { email, firstName, lastName } = body;
    const temporaryPassword = this.mailService.generateRandomPassword();
    
    try {
      await this.mailService.sendPasswordEmail(email, firstName, lastName, temporaryPassword);
      return {
        message: 'Email envoyé avec succès',
        sentTo: email,
        temporaryPassword: temporaryPassword // À supprimer en production
      };
    } catch (error) {
      return {
        message: 'Erreur lors de l\'envoi de l\'email',
        error: error.message
      };
    }
  }

  @Post('test-send-email-with-type')
  @ApiOperation({ summary: 'Tester l\'envoi d\'email avec type de vendeur' })
  @ApiResponse({ status: 200, description: 'Email avec type envoyé' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'pfdiagne35@gmail.com' },
        firstName: { type: 'string', example: 'Jean' },
        lastName: { type: 'string', example: 'Dupont' },
        vendeurType: { 
          type: 'string', 
          enum: ['DESIGNER', 'INFLUENCEUR', 'ARTISTE'],
          example: 'DESIGNER'
        }
      }
    }
  })
  async testSendEmailWithType(@Body() body: { email: string; firstName: string; lastName: string; vendeurType: VendeurType }) {
    const { email, firstName, lastName, vendeurType } = body;
    const temporaryPassword = this.mailService.generateRandomPassword();
    
    try {
      await this.mailService.sendPasswordEmailWithType(email, firstName, lastName, temporaryPassword, vendeurType);
      return {
        message: 'Email avec type de vendeur envoyé avec succès',
        sentTo: email,
        vendeurType: vendeurType,
        temporaryPassword: temporaryPassword // À supprimer en production
      };
    } catch (error) {
      return {
        message: 'Erreur lors de l\'envoi de l\'email',
        error: error.message
      };
    }
  }

  @Get('seller-types')
  @ApiOperation({ summary: 'Lister les types de vendeurs disponibles' })
  @ApiResponse({ status: 200, description: 'Types de vendeurs' })
  getSellerTypes() {
    return {
      message: 'Types de vendeurs disponibles',
      types: [
        { value: VendeurType.DESIGNER, label: 'Designer', description: 'Création de designs graphiques et visuels' },
        { value: VendeurType.INFLUENCEUR, label: 'Influenceur', description: 'Promotion via réseaux sociaux et influence' },
        { value: VendeurType.ARTISTE, label: 'Artiste', description: 'Création artistique et œuvres originales' }
      ]
    };
  }
}
