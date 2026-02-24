import { Controller, Post, Body, HttpCode, Logger, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { OrangeMoneyService } from './orange-money.service';
import { CreateOrangePaymentDto } from './dto/orange-payment.dto';
import { OrangeTransactionStatus, OrangeTransactionType } from './interfaces/orange-transaction.interface';
import { OrangeCallbackPayload, OrangeCallbackPayloadFull } from './interfaces/orange-callback.interface';

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
   * Enregistre l'URL de callback auprès d'Orange Money
   * POST /orange-money/register-callback
   *
   * IMPORTANT: À exécuter UNE FOIS lors du déploiement en production
   * pour que Orange Money sache où envoyer les callbacks
   */
  @Post('register-callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Register callback URL with Orange Money' })
  async registerCallback() {
    this.logger.log('📋 Enregistrement du callback URL...');
    const result = await this.orangeMoneyService.registerCallbackUrl();
    return result;
  }

  /**
   * Vérifie l'URL de callback enregistrée
   * GET /orange-money/verify-callback
   */
  @Get('verify-callback')
  @ApiOperation({ summary: 'Verify registered callback URL' })
  async verifyCallback() {
    this.logger.log('🔍 Vérification du callback URL enregistré...');
    const result = await this.orangeMoneyService.getRegisteredCallbackUrl();
    return result;
  }

  /**
   * Génère un QR Code / Deeplink Orange Money pour un paiement
   * POST /orange-money/payment
   *
   * API Orange Money v4: https://api.orange-sonatel.com/api/eWallet/v4/qrcode
   * Documentation: https://developer.orange-sonatel.com/documentation
   */
  @Post('payment')
  @ApiOperation({
    summary: 'Generate Orange Money QR Code and Deeplinks',
    description: `Génère un QR Code Orange Money pour le paiement d'une commande.

**Fonctionnalités:**
- Génération de QR Code scannable
- Création de deeplinks (MAXIT et Orange Money)
- Configuration des URLs de callback (succès/annulation)
- Validité configurable (max 86400 secondes)
- Réception de webhooks pour les notifications de paiement

**Format de réponse:**
\`\`\`json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,...",
    "deepLinks": {
      "MAXIT": "maxit://...",
      "OM": "om://..."
    },
    "validity": 600,
    "reference": "OM-ORD-123-1234567890"
  }
}
\`\`\`

**Codes d'erreur Orange Money:**
- 400 (2000): Customer account does not exist
- 400 (4099): Bad request, please check passed parameters
- 401: Token expiré ou invalide
- 404 (4004): Invalid QR Code, it's expired
- 500/502/503: Service temporarily unavailable`
  })
  @ApiBody({ type: CreateOrangePaymentDto })
  @ApiResponse({
    status: 200,
    description: 'QR Code généré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            qrCode: { type: 'string', example: 'data:image/png;base64,iVBORw0KGgo...' },
            deepLinks: {
              type: 'object',
              properties: {
                MAXIT: { type: 'string', example: 'maxit://payment?ref=OM-ORD-123-1234567890' },
                OM: { type: 'string', example: 'om://payment?ref=OM-ORD-123-1234567890' }
              }
            },
            validity: { type: 'number', example: 600, description: 'Validité en secondes' },
            reference: { type: 'string', example: 'OM-ORD-123-1234567890' }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Requête invalide (paramètres manquants, credentials incorrects, etc.)',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Orange Money payment creation failed: Invalid merchant code' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token expiré ou authentification échouée'
  })
  @ApiResponse({
    status: 500,
    description: 'Erreur serveur ou API Orange Money indisponible'
  })
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
   * Orange Money envoie des callbacks POST JSON à cette URL après chaque paiement.
   *
   * DEUX FORMATS POSSIBLES :
   *
   * 1. FORMAT COMPLET (avec metadata) :
   * {
   *   "amount": { "value": 2, "unit": "XOF" },
   *   "partner": { "idType": "CODE", "id": "12345" },
   *   "customer": { "idType": "MSISDN", "id": 786258731 },
   *   "reference": "eaed4551-8f07-497d-afb4-ded49d9e92d6",
   *   "metadata": { "orderId": "123", "orderNumber": "ORD-12345" },
   *   "type": "MERCHANT_PAYMENT",
   *   "channel": "API",
   *   "transactionId": "MP220928.1029.C58502",
   *   "paymentMethod": "QRCODE",
   *   "status": "SUCCESS"
   * }
   *
   * 2. FORMAT SIMPLIFIÉ (sans metadata) :
   * {
   *   "transactionId": "MP240224.1234.AB3456",
   *   "status": "SUCCESS",
   *   "amount": { "value": 2500, "unit": "XOF" },
   *   "reference": "uuid-12345-xyz",
   *   "type": "MERCHANT_PAYMENT"
   * }
   *
   * IMPORTANT: Retourne 200 immédiatement pour éviter les retentatives d'Orange
   * Le traitement du callback se fait de manière asynchrone
   */
  @Post('callback')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Orange Money webhook callback',
    description: `Reçoit les notifications de paiement d'Orange Money.

    Gère automatiquement les deux formats de callback possibles.

    **Statuts possibles:**
    - SUCCESS: Paiement réussi
    - FAILED: Paiement échoué
    - CANCELLED: Paiement annulé`
  })
  async handleCallback(@Body() payload: OrangeCallbackPayload) {
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
   * Endpoint de TEST pour simuler un callback Orange Money SUCCESS (format complet)
   * POST /orange-money/test-callback-success
   */
  @Post('test-callback-success')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Test Orange Money callback SUCCESS (format complet avec metadata)',
    description: `Simule un callback Orange Money au format complet pour tester le traitement.

    Vous pouvez passer un orderNumber et un transactionId personnalisés dans le body.

    Exemple:
    \`\`\`json
    {
      "orderNumber": "ORD-12345",
      "transactionId": "MP240224.1234.AB3456"
    }
    \`\`\``
  })
  async testCallbackSuccess(@Body() testData?: { orderNumber?: string; transactionId?: string }) {
    this.logger.log('🧪 ========== TEST CALLBACK SUCCESS (FORMAT COMPLET) ==========');

    const orderNumber = testData?.orderNumber || 'TEST-ORDER-001';
    const transactionId = testData?.transactionId || `MP${Date.now()}.TEST.SUCCESS`;

    // Mock payload au format COMPLET (avec metadata)
    const mockPayload: OrangeCallbackPayloadFull = {
      amount: { unit: 'XOF', value: 10000 },
      partner: { idType: 'CODE', id: '123456' },
      customer: { idType: 'MSISDN', id: '221771234567' },
      reference: `uuid-${Date.now()}`,
      type: 'MERCHANT_PAYMENT',
      channel: 'API',
      transactionId: transactionId,
      paymentMethod: 'QRCODE',
      status: 'SUCCESS',
      metadata: {
        orderId: '1',
        orderNumber: orderNumber,
        customerName: 'Test Client'
      }
    };

    this.logger.log(`📦 Mock payload (format complet): ${JSON.stringify(mockPayload, null, 2)}`);

    try {
      await this.orangeMoneyService.handleCallback(mockPayload);
      this.logger.log('✅ Test callback SUCCESS traité avec succès');
      return {
        success: true,
        message: 'Callback SUCCESS (format complet) simulé avec succès',
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
   * Annule manuellement une commande Orange Money en attente
   * POST /orange-money/cancel-payment/:orderNumber
   *
   * Utilisé quand:
   * - L'utilisateur abandonne le paiement
   * - Le QR code expire
   * - Orange Money ne notifie pas d'échec
   */
  @Post('cancel-payment/:orderNumber')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel pending Orange Money payment' })
  @ApiParam({ name: 'orderNumber', description: 'Order number to cancel' })
  async cancelPayment(@Param('orderNumber') orderNumber: string) {
    this.logger.log(`🚫 Annulation manuelle du paiement: ${orderNumber}`);

    try {
      await this.orangeMoneyService.cancelPendingPayment(orderNumber);
      return {
        success: true,
        message: 'Paiement annulé avec succès',
        orderNumber,
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur annulation paiement:', error.message);
      return {
        success: false,
        error: error.message,
        orderNumber,
      };
    }
  }

  /**
   * Récupère la liste des transactions depuis Orange Money
   * GET /orange-money/transactions
   *
   * Endpoint Orange Money: GET /api/eWallet/v1/transactions
   * Documentation: https://developer.orange-sonatel.com/documentation (Transaction Search > Get transactions)
   *
   * Query parameters optionnels:
   * - bulkId: ID du bulk (pour les opérations en masse)
   * - fromDateTime: Date de début (ISO 8601)
   * - toDateTime: Date de fin (ISO 8601)
   * - status: ACCEPTED | CANCELLED | FAILED | INITIATED | PENDING | PRE_INITIATED | REJECTED | SUCCESS
   * - type: CASHIN | MERCHANT_PAYMENT | WEB_PAYMENT
   * - transactionId: ID de transaction spécifique
   * - reference: Référence externe
   * - page: Numéro de page (défaut: 0, min: 0)
   * - size: Taille de page (défaut: 20, max: 500)
   */
  @Get('transactions')
  @ApiOperation({
    summary: 'Get transactions from Orange Money API',
    description: `Récupère l'historique des transactions depuis l'API Orange Money.

    Tous les paramètres sont optionnels. Sans filtre, retourne les 20 dernières transactions.

    **Statuts disponibles:**
    - ACCEPTED: Transaction acceptée
    - CANCELLED: Transaction annulée
    - FAILED: Transaction échouée
    - INITIATED: Transaction initiée
    - PENDING: Transaction en attente
    - PRE_INITIATED: Transaction pré-initiée
    - REJECTED: Transaction rejetée
    - SUCCESS: Transaction réussie

    **Types de transaction:**
    - CASHIN: Dépôt d'argent
    - MERCHANT_PAYMENT: Paiement marchand
    - WEB_PAYMENT: Paiement web`
  })
  async getAllTransactions(
    @Query('bulkId') bulkId?: string,
    @Query('fromDateTime') fromDateTime?: string,
    @Query('toDateTime') toDateTime?: string,
    @Query('status') status?: OrangeTransactionStatus,
    @Query('type') type?: OrangeTransactionType,
    @Query('transactionId') transactionId?: string,
    @Query('reference') reference?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    this.logger.log('📋 Récupération des transactions Orange Money...');

    const filters: any = {};
    if (bulkId) filters.bulkId = bulkId;
    if (fromDateTime) filters.fromDateTime = fromDateTime;
    if (toDateTime) filters.toDateTime = toDateTime;
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (transactionId) filters.transactionId = transactionId;
    if (reference) filters.reference = reference;
    if (page) filters.page = parseInt(page, 10);
    if (size) filters.size = parseInt(size, 10);

    const result = await this.orangeMoneyService.getAllTransactions(filters);

    return result;
  }

  /**
   * Vérifie le statut d'une transaction spécifique auprès d'Orange Money
   * GET /orange-money/verify-transaction/:transactionId
   *
   * Endpoint Orange Money: GET /api/eWallet/v1/transactions/{transactionId}/status
   *
   * @param transactionId - ID de la transaction Orange Money (ex: "MP260223.0012.B07597")
   */
  @Get('verify-transaction/:transactionId')
  @ApiOperation({ summary: 'Verify transaction status with Orange Money API' })
  @ApiParam({ name: 'transactionId', description: 'Orange Money transaction ID', example: 'MP260223.0012.B07597' })
  async verifyTransaction(@Param('transactionId') transactionId: string) {
    this.logger.log(`🔍 Vérification de la transaction: ${transactionId}`);

    const result = await this.orangeMoneyService.verifyTransactionStatus(transactionId);

    return result;
  }

  /**
   * Vérifie si une commande a été payée en interrogeant Orange Money
   * et réconcilie automatiquement la BDD si nécessaire
   * GET /orange-money/check-payment/:orderNumber
   *
   * Cette méthode est utile pour:
   * - Réconcilier les paiements si le webhook a échoué
   * - Vérifier manuellement le statut d'un paiement
   * - Forcer la synchronisation avec Orange Money
   *
   * @param orderNumber - Numéro de commande
   */
  @Get('check-payment/:orderNumber')
  @ApiOperation({ summary: 'Check if order is paid (with Orange Money verification and reconciliation)' })
  @ApiParam({ name: 'orderNumber', description: 'Order number to check and reconcile', example: 'ORD-12345' })
  async checkPayment(@Param('orderNumber') orderNumber: string) {
    this.logger.log(`🔍 Vérification + réconciliation du paiement: ${orderNumber}`);

    try {
      const result = await this.orangeMoneyService.checkIfOrderIsPaid(orderNumber);

      if (result.reconciled) {
        this.logger.log(`✅ Réconciliation effectuée pour ${orderNumber}`);
        this.logger.log(`   ${result.message}`);
      }

      return result;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('❌ Erreur lors de la vérification du paiement:', error.message);
      return {
        success: false,
        orderNumber,
        error: error.message,
      };
    }
  }

  /**
   * Endpoint de TEST pour simuler un callback Orange Money FAILED (format complet)
   * POST /orange-money/test-callback-failed
   */
  @Post('test-callback-failed')
  @HttpCode(200)
  @ApiOperation({ summary: 'Test Orange Money callback FAILED (format complet)' })
  async testCallbackFailed(@Body() testData?: { orderNumber?: string }) {
    this.logger.log('🧪 ========== TEST CALLBACK FAILED (FORMAT COMPLET) ==========');

    const orderNumber = testData?.orderNumber || 'TEST-ORDER-001';

    // Mock payload au format COMPLET (avec metadata)
    const mockPayload: OrangeCallbackPayloadFull = {
      amount: { unit: 'XOF', value: 10000 },
      partner: { idType: 'CODE', id: '123456' },
      customer: { idType: 'MSISDN', id: '221771234567' },
      reference: `uuid-failed-${Date.now()}`,
      type: 'MERCHANT_PAYMENT',
      channel: 'API',
      transactionId: `MP${Date.now()}.TEST.FAILED`,
      paymentMethod: 'QRCODE',
      status: 'FAILED',
      metadata: {
        orderId: '1',
        orderNumber: orderNumber,
        customerName: 'Test Client'
      }
    };

    this.logger.log(`📦 Mock payload (format complet): ${JSON.stringify(mockPayload, null, 2)}`);

    try {
      await this.orangeMoneyService.handleCallback(mockPayload);
      this.logger.log('✅ Test callback FAILED traité avec succès');
      return {
        success: true,
        message: 'Callback FAILED (format complet) simulé avec succès',
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
   * Endpoint de TEST pour simuler un callback Orange Money SUCCESS (format simplifié)
   * POST /orange-money/test-callback-simple
   */
  @Post('test-callback-simple')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Test Orange Money callback SUCCESS (format simplifié sans metadata)',
    description: `Simule un callback Orange Money au format simplifié pour tester le fallback.

    Ce format ne contient pas de metadata, donc le handler doit chercher la commande
    via le transactionId ou reference.

    IMPORTANT: La commande doit déjà avoir le transactionId enregistré dans la BDD.`
  })
  async testCallbackSimple(@Body() testData?: { transactionId?: string }) {
    this.logger.log('🧪 ========== TEST CALLBACK SUCCESS (FORMAT SIMPLIFIÉ) ==========');

    const transactionId = testData?.transactionId || `MP${Date.now()}.TEST.SIMPLE`;

    // Mock payload au format SIMPLIFIÉ (sans metadata, partner, customer, etc.)
    const mockPayload = {
      transactionId: transactionId,
      status: 'SUCCESS' as OrangeTransactionStatus,
      amount: { value: 10000, unit: 'XOF' },
      reference: `uuid-simple-${Date.now()}`,
      type: 'MERCHANT_PAYMENT' as OrangeTransactionType,
    };

    this.logger.log(`📦 Mock payload (format simplifié): ${JSON.stringify(mockPayload, null, 2)}`);
    this.logger.log(`⚠️ IMPORTANT: La commande doit déjà avoir le transactionId "${transactionId}" dans la BDD`);

    try {
      await this.orangeMoneyService.handleCallback(mockPayload);
      this.logger.log('✅ Test callback SUCCESS (format simplifié) traité avec succès');
      return {
        success: true,
        message: 'Callback SUCCESS (format simplifié) simulé avec succès',
        payload: mockPayload,
        note: 'La commande doit déjà avoir le transactionId enregistré dans la BDD pour être trouvée'
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
