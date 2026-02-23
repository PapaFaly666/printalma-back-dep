import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma.service';
import { PaymentConfigService } from '../payment-config/payment-config.service';
import { CreateOrangePaymentDto } from './dto/orange-payment.dto';

interface OrangeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface OrangeQRResponse {
  deepLinks: {
    MAXIT: string;
    OM: string;
  };
  qrCode: string;
  validity: number;
}

@Injectable()
export class OrangeMoneyService {
  private readonly logger = new Logger(OrangeMoneyService.name);
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly paymentConfigService: PaymentConfigService,
  ) {}

  /**
   * Récupère le token OAuth2 depuis l'API Orange Money
   * Cache le token et le rafraîchit automatiquement avant expiration
   */
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Si token valide, le retourner
    if (this.accessToken && now < this.tokenExpiry) {
      return this.accessToken;
    }

    this.logger.log('🔐 Récupération d\'un nouveau token Orange Money...');

    // Récupérer la config depuis la DB
    const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);

    if (!dbConfig || !dbConfig.isActive) {
      // Fallback sur les variables d'environnement si pas de config DB
      this.logger.warn('⚠️ Pas de config Orange Money dans la DB, utilisation des variables d\'environnement');

      const clientId = this.configService.get<string>('ORANGE_CLIENT_ID');
      const clientSecret = this.configService.get<string>('ORANGE_CLIENT_SECRET');
      const mode = this.configService.get<string>('ORANGE_MODE') || 'production';

      if (!clientId || !clientSecret) {
        throw new BadRequestException('Orange Money credentials not configured in database or environment');
      }

      return this.authenticateWithOrange(clientId, clientSecret, mode);
    }

    // Utiliser la config depuis la DB
    const mode = dbConfig.activeMode; // 'test' ou 'live'
    const clientId = mode === 'test' ? dbConfig.testPublicKey : dbConfig.livePublicKey;
    const clientSecret = mode === 'test' ? dbConfig.testPrivateKey : dbConfig.livePrivateKey;

    if (!clientId || !clientSecret) {
      throw new BadRequestException(`Orange Money ${mode.toUpperCase()} credentials not configured in database`);
    }

    this.logger.log(`📊 Utilisation de la configuration ${mode.toUpperCase()} depuis la base de données`);

    return this.authenticateWithOrange(clientId, clientSecret, mode);
  }

  /**
   * Effectue l'authentification OAuth2 avec Orange Money
   */
  private async authenticateWithOrange(clientId: string, clientSecret: string, mode: string): Promise<string> {
    const now = Date.now();

    // Déterminer l'endpoint selon le mode
    const authUrl = mode === 'live' || mode === 'production'
      ? 'https://api.orange-sonatel.com/oauth/token'
      : 'https://api.sandbox.orange-sonatel.com/oauth/token';

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', clientId);
      params.append('client_secret', clientSecret);

      this.logger.log(`🔑 Mode: ${mode.toUpperCase()}`);
      this.logger.log(`🔑 Auth URL: ${authUrl}`);
      this.logger.log(`🔑 Tentative d'authentification avec Client ID: ${clientId.substring(0, 8)}...`);

      const response = await axios.post<OrangeTokenResponse>(
        authUrl,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      // Rafraîchir 60 secondes avant expiration
      this.tokenExpiry = now + (response.data.expires_in - 60) * 1000;

      this.logger.log(`✅ Token Orange Money obtenu (expire dans ${response.data.expires_in}s)`);
      return this.accessToken;
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      this.logger.error('❌ Erreur lors de la récupération du token Orange:');
      this.logger.error(`   Mode: ${mode}`);
      this.logger.error(`   URL: ${authUrl}`);
      this.logger.error(`   Status: ${status}`);
      this.logger.error(`   Data: ${JSON.stringify(errorData)}`);
      this.logger.error(`   Message: ${error.message}`);

      // Gestion détaillée des erreurs HTTP selon la doc
      if (status === 401) {
        throw new BadRequestException(
          'Orange Money authentication failed: Invalid credentials (Client ID or Client Secret incorrect)'
        );
      } else if (status === 400) {
        throw new BadRequestException(
          `Orange Money authentication failed: Bad request - ${errorData?.error_description || errorData?.message || 'Invalid parameters'}`
        );
      } else if (status === 500 || status === 502 || status === 503) {
        throw new BadRequestException(
          'Orange Money API is temporarily unavailable. Please retry in a few seconds.'
        );
      } else {
        throw new BadRequestException(
          `Failed to authenticate with Orange Money API: ${error.message}`
        );
      }
    }
  }

  /**
   * Génère un QR Code et des deeplinks pour le paiement Orange Money
   */
  async generatePayment(dto: CreateOrangePaymentDto): Promise<{
    qrCode: string;
    deepLinks: { MAXIT: string; OM: string };
    validity: number;
    reference: string;
  }> {
    this.logger.log(`🍊 Génération paiement Orange Money pour commande ${dto.orderNumber}`);

    const token = await this.getAccessToken();

    // Récupérer la config depuis la DB
    const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);

    let merchantCode: string;
    let mode: string;
    let qrUrl: string;

    if (!dbConfig || !dbConfig.isActive) {
      // Fallback sur les variables d'environnement
      this.logger.warn('⚠️ Pas de config Orange Money dans la DB, utilisation des variables d\'environnement');
      merchantCode = this.configService.get<string>('ORANGE_MERCHANT_CODE') || 'PRINTALMA001';
      mode = this.configService.get<string>('ORANGE_MODE') || 'production';
      qrUrl = mode === 'production'
        ? 'https://api.orange-sonatel.com/api/eWallet/v4/qrcode'
        : 'https://api.sandbox.orange-sonatel.com/api/eWallet/v4/qrcode';
    } else {
      // Utiliser la config depuis la DB
      mode = dbConfig.activeMode; // 'test' ou 'live'
      merchantCode = mode === 'test' ? dbConfig.testToken : dbConfig.liveToken;

      if (!merchantCode) {
        throw new BadRequestException(`Orange Money merchant code not configured for ${mode.toUpperCase()} mode`);
      }

      // Déterminer l'URL selon le mode
      qrUrl = mode === 'live'
        ? 'https://api.orange-sonatel.com/api/eWallet/v4/qrcode'
        : 'https://api.sandbox.orange-sonatel.com/api/eWallet/v4/qrcode';

      this.logger.log(`📊 Utilisation de la configuration ${mode.toUpperCase()} depuis la base de données`);
    }

    const FRONTEND_URL = this.configService.get<string>('FRONTEND_URL') || 'https://printalma-website-dep.onrender.com';
    const BACKEND_URL = this.configService.get<string>('BACKEND_URL') || 'https://printalma-back-dep.onrender.com';
    const reference = `OM-${dto.orderNumber}-${Date.now()}`;

    const payload = {
      amount: {
        unit: 'XOF',
        value: dto.amount,
      },
      // URLs de redirection pour l'utilisateur (frontend)
      callbackCancelUrl: `${FRONTEND_URL}/payment/orange-money?orderNumber=${dto.orderNumber}&status=cancelled`,
      callbackSuccessUrl: `${FRONTEND_URL}/payment/orange-money?orderNumber=${dto.orderNumber}&status=success`,
      // URL de notification pour le webhook backend
      notificationUrl: `${BACKEND_URL}/orange-money/callback`,
      code: merchantCode,
      metadata: {
        orderId: dto.orderId.toString(),
        orderNumber: dto.orderNumber,
        customerName: dto.customerName,
      },
      name: 'Printalma B2C',
      reference,
      validity: 600, // 10 minutes
    };

    this.logger.log(`📦 Mode: ${mode.toUpperCase()}`);
    this.logger.log(`📦 QR URL: ${qrUrl}`);
    this.logger.log(`📦 Merchant Code: ${merchantCode}`);
    this.logger.log(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      const response = await axios.post<OrangeQRResponse>(
        qrUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`✅ QR Code Orange généré pour ${dto.orderNumber}`);

      // 🆕 Sauvegarder la référence dans transactionId pour la traçabilité (comme PayDunya)
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          transactionId: reference,
          paymentMethod: 'ORANGE_MONEY'
        }
      });

      this.logger.log(`💾 Référence ${reference} sauvegardée dans transactionId pour order ${dto.orderNumber}`);

      return {
        qrCode: response.data.qrCode,
        deepLinks: response.data.deepLinks,
        validity: response.data.validity,
        reference,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      this.logger.error('❌ Erreur génération QR Orange:');
      this.logger.error(`   Mode: ${mode}`);
      this.logger.error(`   URL: ${qrUrl}`);
      this.logger.error(`   Status: ${status}`);
      this.logger.error(`   Data: ${JSON.stringify(errorData)}`);
      this.logger.error(`   Message: ${error.message}`);

      // Gestion détaillée des erreurs HTTP selon la doc
      if (status === 401) {
        // Token expiré ou invalide - Réessayer avec un nouveau token
        this.logger.warn('⚠️ Token expiré, tentative de renouvellement...');
        this.accessToken = null;
        this.tokenExpiry = 0;
        throw new BadRequestException(
          'Orange Money authentication expired. Please retry - a new token will be obtained automatically.'
        );
      } else if (status === 400) {
        // Paramètres manquants ou invalides
        const errorMsg = errorData?.message || errorData?.error || 'Invalid parameters';
        throw new BadRequestException(
          `Orange Money payment creation failed: ${errorMsg}. Please check amount, merchant code, and validity.`
        );
      } else if (status === 500 || status === 502 || status === 503) {
        // Erreur serveur Orange
        throw new BadRequestException(
          'Orange Money API is temporarily unavailable. Please retry in a few seconds.'
        );
      } else {
        throw new BadRequestException(
          errorData?.message || error.message || 'Failed to generate Orange Money payment'
        );
      }
    }
  }

  /**
   * Enregistre l'URL de callback auprès d'Orange Money
   * À faire UNE FOIS lors du déploiement en production
   *
   * Doc: https://developer.orange-sonatel.com/documentation
   * Endpoint: POST /api/notification/v1/merchantcallback
   */
  async registerCallbackUrl(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const token = await this.getAccessToken();
      const mode = this.configService.get<string>('ORANGE_MONEY_MODE') || 'sandbox';
      const merchantCode = this.configService.get<string>(`ORANGE_MONEY_MERCHANT_CODE_${mode.toUpperCase()}`);
      const BACKEND_URL = this.configService.get<string>('BACKEND_URL') || 'https://printalma-back-dep.onrender.com';

      const notificationUrl = mode === 'sandbox'
        ? 'https://api.sandbox.orange-sonatel.com/api/notification/v1/merchantcallback'
        : 'https://api.orange-sonatel.com/api/notification/v1/merchantcallback';

      const callbackPayload = {
        code: merchantCode,
        name: 'Printalma Payment Callback',
        callbackUrl: `${BACKEND_URL}/orange-money/callback`,
      };

      this.logger.log('📋 Enregistrement du callback URL auprès d\'Orange Money...');
      this.logger.log(`   Mode: ${mode}`);
      this.logger.log(`   Merchant Code: ${merchantCode}`);
      this.logger.log(`   Callback URL: ${callbackPayload.callbackUrl}`);

      const response = await axios.post(
        notificationUrl,
        callbackPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log('✅ Callback URL enregistré avec succès!');
      this.logger.log(`   Response: ${JSON.stringify(response.data)}`);

      return {
        success: true,
        message: 'Callback URL registered successfully',
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur lors de l\'enregistrement du callback URL:');
      this.logger.error(`   Status: ${error.response?.status}`);
      this.logger.error(`   Data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`   Message: ${error.message}`);

      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to register callback URL',
      };
    }
  }

  /**
   * Vérifie l'URL de callback enregistrée
   * Endpoint: GET /api/notification/v1/merchantcallback?code=MERCHANT_CODE
   */
  async getRegisteredCallbackUrl(): Promise<{
    success: boolean;
    data?: any;
  }> {
    try {
      const token = await this.getAccessToken();
      const mode = this.configService.get<string>('ORANGE_MONEY_MODE') || 'sandbox';
      const merchantCode = this.configService.get<string>(`ORANGE_MONEY_MERCHANT_CODE_${mode.toUpperCase()}`);

      const notificationUrl = mode === 'sandbox'
        ? `https://api.sandbox.orange-sonatel.com/api/notification/v1/merchantcallback?code=${merchantCode}`
        : `https://api.orange-sonatel.com/api/notification/v1/merchantcallback?code=${merchantCode}`;

      this.logger.log('🔍 Vérification du callback URL enregistré...');

      const response = await axios.get(notificationUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.logger.log('✅ Callback URL récupéré:');
      this.logger.log(`   ${JSON.stringify(response.data)}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur lors de la vérification du callback URL:');
      this.logger.error(`   ${error.message}`);

      return {
        success: false,
      };
    }
  }

  /**
   * Teste la connexion à l'API Orange Money
   */
  async testConnection(): Promise<{
    success: boolean;
    mode: string;
    tokenObtained: boolean;
    source: string;
    error?: string;
  }> {
    try {
      const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);
      const mode = dbConfig?.activeMode || this.configService.get<string>('ORANGE_MODE') || 'test';
      const source = dbConfig ? 'database' : 'environment';

      const token = await this.getAccessToken();

      return {
        success: true,
        mode,
        source,
        tokenObtained: !!token,
      };
    } catch (error: any) {
      const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);
      return {
        success: false,
        mode: dbConfig?.activeMode || this.configService.get<string>('ORANGE_MODE') || 'test',
        source: dbConfig ? 'database' : 'environment',
        tokenObtained: false,
        error: error.message,
      };
    }
  }

  /**
   * Traite le callback webhook d'Orange Money
   * Selon la doc Orange Money, le payload contient:
   * {
   *   status: "SUCCESS" | "FAILED" | "CANCELLED",
   *   transactionId: "TXN_123456",
   *   reference: "CMD_456",
   *   apiKey: "CLE_SECRETE",
   *   metadata: { orderNumber: "..." }
   * }
   */
  async handleCallback(payload: any): Promise<void> {
    this.logger.log('========== TRAITEMENT CALLBACK ORANGE MONEY ==========');
    this.logger.log('📦 Payload reçu:', JSON.stringify(payload, null, 2));

    // 1. VÉRIFICATION DE L'API KEY (SÉCURITÉ CRITIQUE)
    const { apiKey, reference, status, transactionId, metadata, amount, code } = payload;

    // Récupérer l'apiKey attendue depuis la config ou l'environnement
    const expectedApiKey = this.configService.get<string>('ORANGE_CALLBACK_API_KEY');

    if (expectedApiKey && apiKey !== expectedApiKey) {
      this.logger.error('🚨 SÉCURITÉ: apiKey invalide dans le callback Orange Money');
      this.logger.error(`   apiKey reçue: ${apiKey?.substring(0, 10)}...`);
      this.logger.error(`   apiKey attendue: ${expectedApiKey?.substring(0, 10)}...`);
      throw new BadRequestException('Invalid API key');
    }

    this.logger.log(`🔍 Données extraites du callback:`);
    this.logger.log(`   - Status: ${status}`);
    this.logger.log(`   - TransactionId: ${transactionId}`);
    this.logger.log(`   - Reference: ${reference}`);
    this.logger.log(`   - Code marchand: ${code}`);
    this.logger.log(`   - Amount: ${amount?.value} ${amount?.unit}`);
    this.logger.log(`   - Metadata: ${JSON.stringify(metadata)}`);

    // 2. VÉRIFIER QUE LA RÉFÉRENCE EXISTE
    // Essayer plusieurs sources pour obtenir le orderNumber
    const orderNumber = metadata?.orderNumber ||
                       metadata?.order_number ||
                       (reference && reference.includes('OM-') ? reference.split('-')[1] : null);

    if (!orderNumber) {
      this.logger.error('❌ ERREUR: Callback sans orderNumber ni reference valide');
      this.logger.error('   Payload complet:', JSON.stringify(payload, null, 2));
      this.logger.error('   metadata:', JSON.stringify(metadata, null, 2));
      this.logger.error('   reference:', reference);
      return;
    }

    this.logger.log(`🔎 Recherche de la commande: ${orderNumber}`);

    // 3. TROUVER LA COMMANDE
    const order = await this.prisma.order.findFirst({
      where: { orderNumber },
    });

    if (!order) {
      this.logger.error(`❌ ERREUR: Commande ${orderNumber} introuvable dans la base de données`);
      this.logger.error(`   Recherche tentée avec orderNumber = "${orderNumber}"`);
      this.logger.error(`   Veuillez vérifier que la commande existe`);
      return;
    }

    this.logger.log(`✅ Commande trouvée:`);
    this.logger.log(`   - ID: ${order.id}`);
    this.logger.log(`   - Numéro: ${order.orderNumber}`);
    this.logger.log(`   - Statut paiement actuel: ${order.paymentStatus}`);
    this.logger.log(`   - Transaction ID actuel: ${order.transactionId || 'null'}`);
    this.logger.log(`   - Méthode de paiement: ${order.paymentMethod}`);
    this.logger.log(`   - Montant total: ${order.totalAmount} FCFA`);

    // 4. VÉRIFICATION D'IDEMPOTENCE (éviter double traitement)
    if (order.paymentStatus === 'PAID') {
      this.logger.warn('⚠️ IDEMPOTENCE: Callback déjà traité pour cette commande');
      this.logger.warn(`   Commande ${orderNumber} est déjà marquée comme PAYÉE`);
      this.logger.warn(`   Transaction ID existante: ${order.transactionId}`);
      this.logger.warn(`   Callback actuel - TransactionId: ${transactionId}`);
      this.logger.warn(`   → Ignorer ce callback pour éviter le double traitement`);
      return;
    }

    // 5. TRAITER SELON LE STATUT
    if (status === 'SUCCESS') {
      this.logger.log(`💰 PAIEMENT RÉUSSI - Mise à jour de la commande en PAYÉE...`);

      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          transactionId: transactionId || reference,
          paymentMethod: 'ORANGE_MONEY',
        },
      });

      this.logger.log(`✅✅✅ SUCCÈS: Commande ${orderNumber} marquée comme PAYÉE`);
      this.logger.log(`   - Nouveau statut: ${updatedOrder.paymentStatus}`);
      this.logger.log(`   - Transaction ID enregistrée: ${updatedOrder.transactionId}`);
      this.logger.log(`   - Montant payé: ${amount?.value} ${amount?.unit}`);
      this.logger.log(`   - Code marchand: ${code}`);
      this.logger.log(`   - Timestamp: ${new Date().toISOString()}`);

      // TODO: Envoyer email de confirmation au client
      // await this.sendConfirmationEmail(order.email, order);

    } else if (status === 'CANCELLED' || status === 'FAILED') {
      this.logger.log(`❌ PAIEMENT ÉCHOUÉ - Mise à jour de la commande...`);
      this.logger.log(`   - Raison: ${status}`);

      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          transactionId: transactionId || reference,
          paymentMethod: 'ORANGE_MONEY',
        },
      });

      this.logger.log(`❌ Commande ${orderNumber} marquée comme ÉCHOUÉE`);
      this.logger.log(`   - Statut Orange Money: ${status}`);
      this.logger.log(`   - Nouveau statut BDD: ${updatedOrder.paymentStatus}`);
      this.logger.log(`   - Transaction ID enregistrée: ${updatedOrder.transactionId}`);
      this.logger.log(`   - Code marchand: ${code}`);
      this.logger.log(`   - Timestamp: ${new Date().toISOString()}`);

      // TODO: Envoyer notification au client (paiement échoué)
      // await this.notifyClientPaymentFailed(order.email);

    } else {
      this.logger.warn(`⚠️⚠️⚠️ ATTENTION: Statut inconnu reçu d'Orange Money: "${status}"`);
      this.logger.warn(`   Statuts attendus: SUCCESS, FAILED, CANCELLED`);
      this.logger.warn(`   Statut reçu: ${status}`);
      this.logger.warn(`   Payload complet: ${JSON.stringify(payload, null, 2)}`);
      this.logger.warn(`   → La commande ${orderNumber} n'a PAS été mise à jour`);
    }

    this.logger.log('========== FIN TRAITEMENT CALLBACK ==========');
    this.logger.log('');
  }

  /**
   * Vérifie le statut de paiement d'une commande
   * Utilisé pour le polling côté frontend
   */
  async getPaymentStatus(orderNumber: string): Promise<{
    paymentStatus: string | null;
    transactionId: string | null;
    paymentMethod: string | null;
    totalAmount: number;
    orderStatus: string;
    shouldRedirect?: boolean;
    redirectUrl?: string;
    message?: string;
  }> {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber },
      select: {
        paymentStatus: true,
        transactionId: true,
        paymentMethod: true,
        totalAmount: true,
        status: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    const response: any = {
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      orderStatus: order.status,
    };

    // 🆕 Si le paiement est déjà effectué, indiquer qu'une redirection est nécessaire
    if (order.paymentStatus === 'PAID') {
      const FRONTEND_URL = this.configService.get<string>('FRONTEND_URL') || 'https://printalma-website-dep.onrender.com';

      this.logger.log(`💰 Commande ${orderNumber} déjà payée - Redirection nécessaire`);

      response.shouldRedirect = true;
      response.redirectUrl = `${FRONTEND_URL}/payment/orange-money?orderNumber=${orderNumber}&status=success`;
      response.message = 'Cette commande a déjà été payée avec succès';
    } else if (order.paymentStatus === 'FAILED') {
      const FRONTEND_URL = this.configService.get<string>('FRONTEND_URL') || 'https://printalma-website-dep.onrender.com';

      this.logger.log(`❌ Commande ${orderNumber} - Paiement échoué - Redirection nécessaire`);

      response.shouldRedirect = true;
      response.redirectUrl = `${FRONTEND_URL}/payment/orange-money?orderNumber=${orderNumber}&status=failed`;
      response.message = 'Le paiement de cette commande a échoué';
    }

    return response;
  }

  /**
   * Annule une commande Orange Money en attente
   * Utilisé quand Orange Money ne notifie pas d'échec (timeout, abandon, etc.)
   */
  async cancelPendingPayment(orderNumber: string): Promise<void> {
    this.logger.log(`🚫 Annulation du paiement pour: ${orderNumber}`);

    const order = await this.prisma.order.findFirst({
      where: { orderNumber },
    });

    if (!order) {
      this.logger.error(`❌ Commande ${orderNumber} introuvable`);
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    if (order.paymentStatus === 'PAID') {
      this.logger.warn(`⚠️ Impossible d'annuler: commande ${orderNumber} déjà payée`);
      throw new BadRequestException('Cannot cancel: order already paid');
    }

    if (order.paymentStatus !== 'PENDING') {
      this.logger.warn(`⚠️ Commande ${orderNumber} n'est pas en attente (statut: ${order.paymentStatus})`);
      throw new BadRequestException(`Order is not pending (status: ${order.paymentStatus})`);
    }

    // Marquer comme CANCELLED
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'CANCELLED',
      },
    });

    this.logger.log(`✅ Commande ${orderNumber} annulée (${order.paymentStatus} → CANCELLED)`);
  }
}
