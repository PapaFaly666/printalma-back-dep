import { Controller, Post, Body, HttpCode, Logger, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrangeMoneyService } from './orange-money.service';
import { CreateOrangePaymentDto } from './dto/orange-payment.dto';

@ApiTags('Orange Money')
@Controller('orange-money')
export class OrangeMoneyController {
  private readonly logger = new Logger(OrangeMoneyController.name);

  constructor(private readonly orangeMoneyService: OrangeMoneyService) {}

  /**
   * Teste la connexion à l'API Orange Money
   * GET /orange-money/test-connection
   */
  @Get('test-connection')
  @ApiOperation({ summary: 'Test Orange Money API connection' })
  async testConnection() {
    this.logger.log('🧪 Test de connexion Orange Money...');
    const result = await this.orangeMoneyService.testConnection();
    this.logger.log(`🧪 Résultat: ${JSON.stringify(result)}`);
    return result;
  }

  /**
   * Génère un QR Code / Deeplink Orange Money pour un paiement
   * POST /orange-money/payment
   */
  @Post('payment')
  @ApiOperation({ summary: 'Generate Orange Money QR Code and Deeplinks' })
  async createPayment(@Body() dto: CreateOrangePaymentDto) {
    try {
      const result = await this.orangeMoneyService.generatePayment(dto);
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur création paiement Orange:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Webhook pour recevoir les callbacks d'Orange Money
   * POST /orange-money/callback
   */
  @Post('callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Orange Money webhook callback' })
  async handleCallback(@Body() payload: any) {
    this.logger.log('📞 Webhook Orange Money reçu');
    try {
      await this.orangeMoneyService.handleCallback(payload);
      return { success: true };
    } catch (error: any) {
      this.logger.error('❌ Erreur traitement callback:', error.message);
      return { success: false };
    }
  }
}
