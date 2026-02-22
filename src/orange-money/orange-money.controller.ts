import { Controller, Post, Body, HttpCode, Logger, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
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
   *
   * IMPORTANT: Retourne 200 immédiatement pour éviter les retentatives d'Orange
   * Le traitement du callback se fait de manière asynchrone
   */
  @Post('callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Orange Money webhook callback' })
  async handleCallback(@Body() payload: any) {
    this.logger.log('📞 ========== WEBHOOK ORANGE MONEY REÇU ==========');
    this.logger.log(`📦 Payload complet: ${JSON.stringify(payload, null, 2)}`);

    // 1. RETOURNER 200 IMMÉDIATEMENT pour éviter les retentatives d'Orange
    // Le traitement se fait en arrière-plan
    setImmediate(async () => {
      try {
        await this.orangeMoneyService.handleCallback(payload);
        this.logger.log('✅ Callback traité avec succès');
      } catch (error: any) {
        this.logger.error('❌ Erreur traitement callback:', error.message);
        this.logger.error('Stack:', error.stack);
      }
    });

    // 2. Réponse immédiate
    return { received: true };
  }

  /**
   * Vérifie le statut de paiement d'une commande
   * GET /orange-money/payment-status/:orderNumber
   *
   * Endpoint pour le polling côté frontend
   * Permet de vérifier si le callback a été reçu et traité
   *
   * Retourne shouldRedirect: true si le paiement est déjà effectué
   * Le frontend peut utiliser redirectUrl pour rediriger l'utilisateur
   */
  @Get('payment-status/:orderNumber')
  @ApiOperation({ summary: 'Check Orange Money payment status for an order' })
  @ApiParam({ name: 'orderNumber', description: 'Order number to check', example: 'ORD-12345' })
  async getPaymentStatus(@Param('orderNumber') orderNumber: string) {
    this.logger.log(`🔍 Vérification du statut de paiement pour: ${orderNumber}`);

    try {
      const status = await this.orangeMoneyService.getPaymentStatus(orderNumber);

      // Log si une redirection est nécessaire
      if (status.shouldRedirect) {
        this.logger.log(`🔀 Redirection requise pour ${orderNumber} → ${status.redirectUrl}`);
        this.logger.log(`   Raison: ${status.message}`);
      }

      return {
        success: true,
        orderNumber,
        ...status,
      };
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('❌ Erreur lors de la vérification du statut:', error.message);
      return {
        success: false,
        orderNumber,
        error: error.message,
      };
    }
  }

  /**
   * Endpoint de TEST pour simuler un callback Orange Money SUCCESS
   * POST /orange-money/test-callback-success
   */
  @Post('test-callback-success')
  @HttpCode(200)
  @ApiOperation({ summary: 'Test Orange Money callback SUCCESS' })
  async testCallbackSuccess(@Body() testData?: { orderNumber?: string; transactionId?: string }) {
    this.logger.log('🧪 ========== TEST CALLBACK SUCCESS ==========');

    const orderNumber = testData?.orderNumber || 'TEST-ORDER-001';
    const transactionId = testData?.transactionId || `TXN-TEST-${Date.now()}`;

    const mockPayload = {
      status: 'SUCCESS',
      transactionId: transactionId,
      amount: { unit: 'XOF', value: 10000 },
      code: 'PRINTALMA001',
      reference: `OM-${orderNumber}-${Date.now()}`,
      metadata: {
        orderId: '1',
        orderNumber: orderNumber,
        customerName: 'Test Client'
      }
    };

    this.logger.log(`📦 Mock payload: ${JSON.stringify(mockPayload, null, 2)}`);

    try {
      await this.orangeMoneyService.handleCallback(mockPayload);
      this.logger.log('✅ Test callback SUCCESS traité avec succès');
      return {
        success: true,
        message: 'Callback SUCCESS simulé avec succès',
        payload: mockPayload
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur test callback:', error.message);
      return {
        success: false,
        error: error.message,
        payload: mockPayload
      };
    }
  }

  /**
   * Endpoint de TEST pour simuler un callback Orange Money FAILED
   * POST /orange-money/test-callback-failed
   */
  @Post('test-callback-failed')
  @HttpCode(200)
  @ApiOperation({ summary: 'Test Orange Money callback FAILED' })
  async testCallbackFailed(@Body() testData?: { orderNumber?: string }) {
    this.logger.log('🧪 ========== TEST CALLBACK FAILED ==========');

    const orderNumber = testData?.orderNumber || 'TEST-ORDER-001';

    const mockPayload = {
      status: 'FAILED',
      transactionId: `TXN-FAILED-${Date.now()}`,
      amount: { unit: 'XOF', value: 10000 },
      code: 'PRINTALMA001',
      reference: `OM-${orderNumber}-${Date.now()}`,
      metadata: {
        orderId: '1',
        orderNumber: orderNumber,
        customerName: 'Test Client'
      }
    };

    this.logger.log(`📦 Mock payload: ${JSON.stringify(mockPayload, null, 2)}`);

    try {
      await this.orangeMoneyService.handleCallback(mockPayload);
      this.logger.log('✅ Test callback FAILED traité avec succès');
      return {
        success: true,
        message: 'Callback FAILED simulé avec succès',
        payload: mockPayload
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur test callback:', error.message);
      return {
        success: false,
        error: error.message,
        payload: mockPayload
      };
    }
  }
}
