import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma.service';
import { PaymentConfigService } from '../payment-config/payment-config.service';
import { OrderService } from '../order/order.service';
import { CreateOrangePaymentDto } from './dto/orange-payment.dto';
import { ExecuteCashInDto, CashInResponseDto } from './dto/orange-cashin.dto';
import {
  OrangeTransaction,
  OrangeTransactionFilters,
  OrangeTransactionStatus,
  OrangeTransactionStatusResponse,
  OrangeErrorResponse,
  OrangeCashInPayload,
  OrangeCashInResponse,
} from './interfaces/orange-transaction.interface';
import {
  OrangeCallbackPayload,
  OrangeSetCallbackPayload,
  OrangeGetCallbackResponse,
  isFullCallbackPayload,
  isSimpleCallbackPayload,
  extractOrderNumber,
} from './interfaces/orange-callback.interface';

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
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
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

    // 📝 Référence locale pour nos logs et traçabilité interne
    // ⚠️ Cette référence n'est PAS envoyée à Orange Money
    // Orange Money génère son propre UUID de référence dans le callback
    const reference = `OM-${dto.orderNumber}-${Date.now()}`;

    // ⚠️ Convertir le code marchand en nombre (la doc Orange Money exige un nombre de 6 chiffres)
    const merchantCodeNumber = parseInt(merchantCode, 10);

    if (isNaN(merchantCodeNumber) || merchantCode.length !== 6) {
      throw new BadRequestException(
        `Invalid merchant code format. Must be exactly 6 digits. Received: ${merchantCode}`
      );
    }

    // 🔥 Payload EXACTEMENT conforme à la doc officielle Orange Money v4
    // Doc: https://developer.orange-sonatel.com/documentation (Merchant Payment > Generate QR Code)
    // ⚠️ IMPORTANT: Le champ "reference" n'existe PAS dans le payload (contrairement à PayDunya)
    // ⚠️ Le "code" DOIT être un nombre de 6 chiffres
    // ⚠️ Les metadata sont renvoyées dans le callback pour identifier la commande
    const payload = {
      amount: {
        unit: 'XOF',
        value: dto.amount,
      },
      callbackCancelUrl: `${FRONTEND_URL}/payment/orange-money?orderNumber=${dto.orderNumber}&status=cancelled`,
      callbackSuccessUrl: `${FRONTEND_URL}/payment/orange-money?orderNumber=${dto.orderNumber}&status=success`,
      code: merchantCodeNumber, // NOMBRE de 6 chiffres (ex: 123456)
      metadata: {
        // ⚠️ CRITIQUE: Ces metadata sont renvoyées dans le callback
        // C'est ainsi qu'on identifie la commande !
        orderId: dto.orderId.toString(),
        orderNumber: dto.orderNumber, // ⚠️ UTILISÉ dans le callback pour identifier la commande
        customerName: dto.customerName,
      },
      name: 'Printalma B2C',
      validity: 600, // en secondes (max 86400 = 24h)
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
            'X-Callback-Url': `${BACKEND_URL}/orange-money/callback`,
          },
        },
      );

      this.logger.log(`✅ QR Code Orange généré pour ${dto.orderNumber}`);

      // 💾 Sauvegarder notre référence locale pour la traçabilité
      // ⚠️ Cette référence sera remplacée par le transactionId Orange Money dans le callback
      await this.prisma.order.update({
        where: { id: dto.orderId },
        data: {
          transactionId: reference, // Référence locale temporaire
          paymentMethod: 'ORANGE_MONEY'
        }
      });

      this.logger.log(`💾 Référence locale ${reference} sauvegardée dans transactionId pour order ${dto.orderNumber}`);

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
   *
   * Structure du payload selon la doc Orange (pages 9-10):
   * {
   *   "apiKey": "xyz",
   *   "code": "123456",
   *   "name": "Callback configuration",
   *   "callbackUrl": "https://my-backend.com/callback"
   * }
   */
  async registerCallbackUrl(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      const token = await this.getAccessToken();

      // Récupérer la config depuis la DB
      const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);

      let merchantCode: string;
      let mode: string;
      let notificationUrl: string;

      if (!dbConfig || !dbConfig.isActive) {
        // Fallback sur les variables d'environnement
        this.logger.warn('⚠️ Pas de config Orange Money dans la DB, utilisation des variables d\'environnement');
        merchantCode = this.configService.get<string>('ORANGE_MERCHANT_CODE') || 'PRINTALMA001';
        mode = this.configService.get<string>('ORANGE_MODE') || 'sandbox';
        notificationUrl = mode === 'production'
          ? 'https://api.orange-sonatel.com/api/notification/v1/merchantcallback'
          : 'https://api.sandbox.orange-sonatel.com/api/notification/v1/merchantcallback';
      } else {
        // Utiliser la config depuis la DB
        mode = dbConfig.activeMode; // 'test' ou 'live'
        merchantCode = mode === 'test' ? dbConfig.testToken : dbConfig.liveToken;

        if (!merchantCode) {
          throw new BadRequestException(`Orange Money merchant code not configured for ${mode.toUpperCase()} mode`);
        }

        notificationUrl = mode === 'live'
          ? 'https://api.orange-sonatel.com/api/notification/v1/merchantcallback'
          : 'https://api.sandbox.orange-sonatel.com/api/notification/v1/merchantcallback';

        this.logger.log(`📊 Utilisation de la configuration ${mode.toUpperCase()} depuis la base de données`);
      }

      const BACKEND_URL = this.configService.get<string>('BACKEND_URL') || 'https://printalma-back-dep.onrender.com';

      // Payload selon la documentation Orange Money (Webhooks > Set Merchant CallBack)
      const callbackPayload: OrangeSetCallbackPayload = {
        apiKey: this.configService.get<string>('ORANGE_CALLBACK_API_KEY') || 'PRINTALMA_API_KEY',
        code: merchantCode,
        name: 'Printalma B2C Payment Callback',
        callbackUrl: `${BACKEND_URL}/orange-money/callback`,
      };

      this.logger.log('📋 Enregistrement du callback URL auprès d\'Orange Money...');
      this.logger.log(`   Mode: ${mode.toUpperCase()}`);
      this.logger.log(`   Merchant Code: ${merchantCode}`);
      this.logger.log(`   Callback URL: ${callbackPayload.callbackUrl}`);
      this.logger.log(`   API Key: ${callbackPayload.apiKey?.substring(0, 10)}...`);

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
        message: 'Callback URL registered successfully with Orange Money',
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
   * Vérifie l'URL de callback enregistrée chez Orange Money
   * Endpoint: GET /api/notification/v1/merchantcallback
   *
   * Doc: Webhooks > Get merchant CallBack
   * Query parameters optionnels: code, page, size
   */
  async getRegisteredCallbackUrl(): Promise<{
    success: boolean;
    data?: OrangeGetCallbackResponse[];
    merchantCode?: string;
    mode?: string;
    error?: string;
  }> {
    try {
      const token = await this.getAccessToken();

      // Récupérer la config depuis la DB
      const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);

      let merchantCode: string;
      let mode: string;
      let notificationUrl: string;

      if (!dbConfig || !dbConfig.isActive) {
        // Fallback sur les variables d'environnement
        this.logger.warn('⚠️ Pas de config Orange Money dans la DB, utilisation des variables d\'environnement');
        merchantCode = this.configService.get<string>('ORANGE_MERCHANT_CODE') || 'PRINTALMA001';
        mode = this.configService.get<string>('ORANGE_MODE') || 'sandbox';
        notificationUrl = mode === 'production'
          ? `https://api.orange-sonatel.com/api/notification/v1/merchantcallback?code=${merchantCode}`
          : `https://api.sandbox.orange-sonatel.com/api/notification/v1/merchantcallback?code=${merchantCode}`;
      } else {
        // Utiliser la config depuis la DB
        mode = dbConfig.activeMode; // 'test' ou 'live'
        merchantCode = mode === 'test' ? dbConfig.testToken : dbConfig.liveToken;

        if (!merchantCode) {
          throw new BadRequestException(`Orange Money merchant code not configured for ${mode.toUpperCase()} mode`);
        }

        notificationUrl = mode === 'live'
          ? `https://api.orange-sonatel.com/api/notification/v1/merchantcallback?code=${merchantCode}`
          : `https://api.sandbox.orange-sonatel.com/api/notification/v1/merchantcallback?code=${merchantCode}`;

        this.logger.log(`📊 Utilisation de la configuration ${mode.toUpperCase()} depuis la base de données`);
      }

      this.logger.log('🔍 Vérification du callback URL enregistré chez Orange Money...');
      this.logger.log(`   Mode: ${mode.toUpperCase()}`);
      this.logger.log(`   Merchant Code: ${merchantCode}`);
      this.logger.log(`   Query URL: ${notificationUrl}`);

      const response = await axios.get(notificationUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      this.logger.log('✅ Callback URL récupéré avec succès:');
      this.logger.log(`   ${JSON.stringify(response.data, null, 2)}`);

      return {
        success: true,
        data: response.data,
        merchantCode,
        mode,
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur lors de la vérification du callback URL:');
      this.logger.error(`   Status: ${error.response?.status}`);
      this.logger.error(`   Data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`   Message: ${error.message}`);

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
   * Gère DEUX formats possibles :
   *
   * FORMAT COMPLET (avec metadata) :
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
   * FORMAT SIMPLIFIÉ (sans metadata) :
   * {
   *   "transactionId": "MP240224.1234.AB3456",
   *   "status": "SUCCESS",
   *   "amount": { "value": 2500, "unit": "XOF" },
   *   "reference": "uuid-12345-xyz",
   *   "type": "MERCHANT_PAYMENT"
   * }
   */
  async handleCallback(payload: OrangeCallbackPayload): Promise<void> {
    this.logger.log('========== TRAITEMENT CALLBACK ORANGE MONEY ==========');
    this.logger.log('📦 Payload reçu:', JSON.stringify(payload, null, 2));

    // Détection du format de callback
    const isFullFormat = isFullCallbackPayload(payload);
    const isSimpleFormat = isSimpleCallbackPayload(payload);

    this.logger.log(`🔍 Format du callback: ${isFullFormat ? 'COMPLET (avec metadata)' : 'SIMPLIFIÉ'}`);

    // Extraire les données communes
    const { status, transactionId, reference, amount, type } = payload;

    this.logger.log(`🔍 Données extraites du callback:`);
    this.logger.log(`   - Status: ${status}`);
    this.logger.log(`   - TransactionId: ${transactionId}`);
    this.logger.log(`   - Reference: ${reference}`);
    this.logger.log(`   - Type: ${type}`);
    this.logger.log(`   - Amount: ${amount?.value} ${amount?.unit}`);

    // Données spécifiques au format complet
    if (isFullFormat) {
      this.logger.log(`   - Channel: ${payload.channel}`);
      this.logger.log(`   - PaymentMethod: ${payload.paymentMethod}`);
      this.logger.log(`   - Partner: ${payload.partner?.id}`);
      this.logger.log(`   - Customer: ${payload.customer?.id}`);
      this.logger.log(`   - Metadata: ${JSON.stringify(payload.metadata)}`);
    }

    // 🔎 ÉTAPE 1 : TROUVER LA COMMANDE

    let order: any = null;
    let orderNumber: string | undefined;

    if (isFullFormat && payload.metadata?.orderNumber) {
      // 🟢 FORMAT COMPLET : Utiliser metadata.orderNumber
      orderNumber = payload.metadata.orderNumber;
      this.logger.log(`🔎 Recherche de la commande via metadata.orderNumber: ${orderNumber}`);

      order = await this.prisma.order.findFirst({
        where: { orderNumber },
      });
    } else {
      // 🟠 FORMAT SIMPLIFIÉ : Chercher par transactionId ou reference
      this.logger.log(`🔎 Recherche de la commande via transactionId ou reference`);

      // Essayer de trouver via transactionId (si déjà enregistré)
      order = await this.prisma.order.findFirst({
        where: {
          OR: [
            { transactionId: transactionId },
            { transactionId: reference },
          ],
        },
      });

      if (order) {
        orderNumber = order.orderNumber;
        this.logger.log(`✅ Commande trouvée via transactionId: ${orderNumber}`);
      } else {
        this.logger.error('❌ ERREUR: Impossible de trouver la commande');
        this.logger.error(`   - transactionId: ${transactionId}`);
        this.logger.error(`   - reference: ${reference}`);
        this.logger.error(`   - Aucune commande ne correspond dans la base de données`);
        this.logger.error(`   💡 ASTUCE: Assurez-vous que generatePayment() enregistre bien le transactionId AVANT le paiement`);
        return;
      }
    }

    // Vérifier si commande trouvée
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

    // 🔒 ÉTAPE 2 : VÉRIFICATION D'IDEMPOTENCE (éviter double traitement)
    if (order.paymentStatus === 'PAID') {
      this.logger.warn('⚠️ IDEMPOTENCE: Callback déjà traité pour cette commande');
      this.logger.warn(`   Commande ${order.orderNumber} est déjà marquée comme PAYÉE`);
      this.logger.warn(`   Transaction ID existante: ${order.transactionId}`);
      this.logger.warn(`   Callback actuel - TransactionId: ${transactionId}`);
      this.logger.warn(`   → Ignorer ce callback pour éviter le double traitement`);
      return;
    }

    // 💰 ÉTAPE 3 : TRAITER SELON LE STATUT
    if (status === 'SUCCESS') {
      this.logger.log(`💰 PAIEMENT RÉUSSI - Mise à jour de la commande en PAYÉE...`);

      // 🎯 Utiliser updateOrderPaymentStatus pour déclencher l'envoi de facture
      await this.orderService.updateOrderPaymentStatus(
        order.orderNumber,
        'PAID',
        transactionId || reference,
        null,
        1
      );

      this.logger.log(`✅✅✅ SUCCÈS: Commande ${order.orderNumber} marquée comme PAYÉE`);
      this.logger.log(`   - Nouveau statut: PAID`);
      this.logger.log(`   - Transaction ID enregistrée: ${transactionId || reference}`);
      this.logger.log(`   - Montant payé: ${amount?.value} ${amount?.unit}`);
      if (isFullFormat) {
        this.logger.log(`   - Code marchand: ${payload.partner?.id}`);
        this.logger.log(`   - Client: ${payload.customer?.id}`);
      }
      this.logger.log(`   - Timestamp: ${new Date().toISOString()}`);
      this.logger.log(`   - 📧 Facture envoyée automatiquement par email`);

    } else if (status === 'CANCELLED' || status === 'FAILED') {
      this.logger.log(`❌ PAIEMENT ÉCHOUÉ - Mise à jour de la commande...`);
      this.logger.log(`   - Raison: ${status}`);

      // 🎯 Utiliser updateOrderPaymentStatus avec détails d'erreur
      await this.orderService.updateOrderPaymentStatus(
        order.orderNumber,
        'FAILED',
        transactionId || reference,
        {
          reason: status === 'CANCELLED' ? 'user_cancelled' : 'payment_failed',
          category: status === 'CANCELLED' ? 'user_action' : 'technical_error',
          message: `Orange Money payment ${status}`,
        },
        1
      );

      this.logger.log(`❌ Commande ${order.orderNumber} marquée comme ÉCHOUÉE`);
      this.logger.log(`   - Statut Orange Money: ${status}`);
      this.logger.log(`   - Nouveau statut BDD: FAILED`);
      this.logger.log(`   - Transaction ID enregistrée: ${transactionId || reference}`);
      if (isFullFormat) {
        this.logger.log(`   - Code marchand: ${payload.partner?.id}`);
      }
      this.logger.log(`   - Timestamp: ${new Date().toISOString()}`);

      // TODO: Envoyer notification au client (paiement échoué)
      // await this.notifyClientPaymentFailed(order.email);

    } else {
      this.logger.warn(`⚠️⚠️⚠️ ATTENTION: Statut inconnu reçu d'Orange Money: "${status}"`);
      this.logger.warn(`   Statuts attendus: SUCCESS, FAILED, CANCELLED`);
      this.logger.warn(`   Statut reçu: ${status}`);
      this.logger.warn(`   Payload complet: ${JSON.stringify(payload, null, 2)}`);
      this.logger.warn(`   → La commande ${order.orderNumber} n'a PAS été mise à jour`);
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

    // Marquer comme CANCELLED (FAILED avec raison user_cancelled)
    await this.orderService.updateOrderPaymentStatus(
      orderNumber,
      'FAILED',
      null,
      {
        reason: 'user_cancelled',
        category: 'user_action',
        message: 'Order cancelled by user',
      },
      1
    );

    this.logger.log(`✅ Commande ${orderNumber} annulée (PENDING → FAILED/CANCELLED)`);
  }

  /**
   * Récupère la liste des transactions depuis l'API Orange Money
   * Endpoint Orange: GET /api/eWallet/v1/transactions
   *
   * Doc: https://developer.orange-sonatel.com/documentation (Transaction Search > Get transactions)
   *
   * @param filters - Filtres optionnels conformes à la documentation Orange Money
   * @returns Liste des transactions avec pagination
   */
  async getAllTransactions(filters?: OrangeTransactionFilters): Promise<{
    success: boolean;
    data?: OrangeTransaction[];
    page?: number;
    size?: number;
    total?: number;
    error?: string;
    errorDetails?: OrangeErrorResponse;
  }> {
    try {
      const token = await this.getAccessToken();

      // Récupérer la config pour déterminer l'URL
      const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);
      const mode = dbConfig?.activeMode || this.configService.get<string>('ORANGE_MODE') || 'production';

      const baseUrl = mode === 'live' || mode === 'production'
        ? 'https://api.orange-sonatel.com'
        : 'https://api.sandbox.orange-sonatel.com';

      // Construire les query parameters selon la doc Orange Money
      const params = new URLSearchParams();
      if (filters?.bulkId) params.append('bulkId', filters.bulkId);
      if (filters?.fromDateTime) params.append('fromDateTime', filters.fromDateTime);
      if (filters?.toDateTime) params.append('toDateTime', filters.toDateTime);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.transactionId) params.append('transactionId', filters.transactionId);
      if (filters?.reference) params.append('reference', filters.reference);
      if (filters?.page !== undefined) params.append('page', filters.page.toString());
      if (filters?.size !== undefined) params.append('size', filters.size.toString());

      const url = `${baseUrl}/api/eWallet/v1/transactions${params.toString() ? '?' + params.toString() : ''}`;

      this.logger.log('📋 Récupération des transactions Orange Money...');
      this.logger.log(`   Mode: ${mode.toUpperCase()}`);
      this.logger.log(`   URL: ${url}`);
      if (filters) {
        this.logger.log(`   Filtres: ${JSON.stringify(filters)}`);
      }

      const response = await axios.get<OrangeTransaction[]>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const transactions = response.data;
      this.logger.log(`✅ ${transactions.length} transaction(s) récupérée(s)`);

      // Log détaillé des transactions si mode debug
      if (transactions.length > 0) {
        this.logger.log('📊 Aperçu des transactions:');
        transactions.slice(0, 3).forEach((tx) => {
          this.logger.log(`   - ${tx.transactionId}: ${tx.type} | ${tx.status} | ${tx.amount.value} ${tx.amount.unit} | ${tx.createdAt}`);
        });
        if (transactions.length > 3) {
          this.logger.log(`   ... et ${transactions.length - 3} autre(s)`);
        }
      }

      return {
        success: true,
        data: transactions,
        page: filters?.page || 0,
        size: filters?.size || 20,
        total: transactions.length,
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur lors de la récupération des transactions:');
      this.logger.error(`   Status: ${error.response?.status}`);
      this.logger.error(`   Data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`   Message: ${error.message}`);

      const errorResponse: OrangeErrorResponse | undefined = error.response?.data;

      return {
        success: false,
        error: error.message,
        errorDetails: errorResponse,
      };
    }
  }

  /**
   * Vérifie le statut d'une transaction spécifique auprès d'Orange Money
   * Endpoint Orange: GET /api/eWallet/v1/transactions/{transactionId}/status
   *
   * Doc: https://developer.orange-sonatel.com/documentation (Transaction Search > Get transaction Status)
   *
   * @param transactionId - ID de la transaction Orange Money (ex: "MP260223.0012.B07597", 20 caractères max)
   * @returns Statut de la transaction
   */
  async verifyTransactionStatus(transactionId: string): Promise<{
    success: boolean;
    status?: OrangeTransactionStatus;
    transactionId?: string;
    data?: OrangeTransactionStatusResponse;
    error?: string;
    errorDetails?: OrangeErrorResponse;
  }> {
    try {
      const token = await this.getAccessToken();

      // Récupérer la config pour déterminer l'URL
      const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);
      const mode = dbConfig?.activeMode || this.configService.get<string>('ORANGE_MODE') || 'production';

      const baseUrl = mode === 'live' || mode === 'production'
        ? 'https://api.orange-sonatel.com'
        : 'https://api.sandbox.orange-sonatel.com';

      const url = `${baseUrl}/api/eWallet/v1/transactions/${transactionId}/status`;

      this.logger.log('🔍 Vérification du statut de transaction Orange Money...');
      this.logger.log(`   Mode: ${mode.toUpperCase()}`);
      this.logger.log(`   Transaction ID: ${transactionId}`);
      this.logger.log(`   URL: ${url}`);

      const response = await axios.get<OrangeTransactionStatusResponse>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`✅ Statut de la transaction ${transactionId}: ${response.data.status}`);

      return {
        success: true,
        transactionId,
        status: response.data.status,
        data: response.data,
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur lors de la vérification du statut:');
      this.logger.error(`   Transaction ID: ${transactionId}`);
      this.logger.error(`   Status: ${error.response?.status}`);
      this.logger.error(`   Data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`   Message: ${error.message}`);

      const errorResponse: OrangeErrorResponse | undefined = error.response?.data;

      return {
        success: false,
        transactionId,
        error: error.message,
        errorDetails: errorResponse,
      };
    }
  }

  /**
   * Vérifie si une commande a été payée en interrogeant Orange Money
   * et met à jour automatiquement le statut dans la BDD si nécessaire
   *
   * Cette méthode combine:
   * 1. Recherche de la commande dans la BDD locale
   * 2. Vérification du statut auprès d'Orange Money (si transactionId existe)
   * 3. Réconciliation automatique si le statut diffère
   *
   * @param orderNumber - Numéro de commande
   * @returns Statut de paiement mis à jour
   */
  async checkIfOrderIsPaid(orderNumber: string): Promise<{
    success: boolean;
    orderNumber: string;
    paymentStatus: string;
    transactionId?: string;
    orangeMoneyStatus?: string;
    reconciled?: boolean;
    message?: string;
  }> {
    try {
      this.logger.log(`🔍 Vérification du paiement pour commande: ${orderNumber}`);

      // 1. Trouver la commande dans la BDD
      const order = await this.prisma.order.findFirst({
        where: { orderNumber },
      });

      if (!order) {
        this.logger.error(`❌ Commande ${orderNumber} introuvable`);
        throw new NotFoundException(`Order ${orderNumber} not found`);
      }

      // 2. Si pas de transactionId, impossible de vérifier auprès d'Orange
      if (!order.transactionId) {
        this.logger.warn(`⚠️ Commande ${orderNumber} n'a pas de transactionId`);
        return {
          success: true,
          orderNumber,
          paymentStatus: order.paymentStatus,
          message: 'No transactionId - cannot verify with Orange Money',
        };
      }

      // 3. Si déjà payé dans la BDD, pas besoin de vérifier
      if (order.paymentStatus === 'PAID') {
        this.logger.log(`✅ Commande ${orderNumber} déjà marquée comme PAID`);
        return {
          success: true,
          orderNumber,
          paymentStatus: 'PAID',
          transactionId: order.transactionId,
          message: 'Order already marked as PAID in database',
        };
      }

      // 4. Vérifier le statut auprès d'Orange Money
      this.logger.log(`🔄 Vérification auprès d'Orange Money pour transaction: ${order.transactionId}`);
      const orangeStatus = await this.verifyTransactionStatus(order.transactionId);

      if (!orangeStatus.success) {
        this.logger.error('❌ Impossible de vérifier le statut auprès d\'Orange Money');
        return {
          success: false,
          orderNumber,
          paymentStatus: order.paymentStatus,
          transactionId: order.transactionId,
          message: 'Failed to verify status with Orange Money',
        };
      }

      // 5. Réconciliation : Si Orange Money dit SUCCESS mais BDD dit PENDING
      if (orangeStatus.status === 'SUCCESS' && order.paymentStatus === 'PENDING') {
        this.logger.warn(`⚠️ RÉCONCILIATION: Orange Money = SUCCESS, BDD = PENDING`);
        this.logger.log(`🔄 Mise à jour de la commande ${orderNumber} → PAID`);

        await this.orderService.updateOrderPaymentStatus(
          orderNumber,
          'PAID',
          order.transactionId || null,
          null,
          1
        );

        this.logger.log(`✅ Commande ${orderNumber} réconciliée: PENDING → PAID`);

        return {
          success: true,
          orderNumber,
          paymentStatus: 'PAID',
          transactionId: order.transactionId,
          orangeMoneyStatus: orangeStatus.status,
          reconciled: true,
          message: 'Payment status reconciled: Orange Money reported SUCCESS',
        };
      }

      // 6. Si Orange Money dit FAILED mais BDD dit PENDING
      if (orangeStatus.status === 'FAILED' && order.paymentStatus === 'PENDING') {
        this.logger.warn(`⚠️ RÉCONCILIATION: Orange Money = FAILED, BDD = PENDING`);
        this.logger.log(`🔄 Mise à jour de la commande ${orderNumber} → FAILED`);

        await this.orderService.updateOrderPaymentStatus(
          orderNumber,
          'FAILED',
          order.transactionId || null,
          {
            reason: 'payment_failed',
            category: 'technical_error',
            message: 'Orange Money payment failed - detected during reconciliation',
          },
          1
        );

        this.logger.log(`✅ Commande ${orderNumber} réconciliée: PENDING → FAILED`);

        return {
          success: true,
          orderNumber,
          paymentStatus: 'FAILED',
          transactionId: order.transactionId,
          orangeMoneyStatus: orangeStatus.status,
          reconciled: true,
          message: 'Payment status reconciled: Orange Money reported FAILED',
        };
      }

      // 7. Statuts synchronisés (pas de réconciliation nécessaire)
      this.logger.log(`✅ Statuts synchronisés: BDD = ${order.paymentStatus}, Orange = ${orangeStatus.status}`);

      return {
        success: true,
        orderNumber,
        paymentStatus: order.paymentStatus,
        transactionId: order.transactionId,
        orangeMoneyStatus: orangeStatus.status,
        reconciled: false,
        message: 'Status synchronized',
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur lors de la vérification du paiement:');
      this.logger.error(`   ${error.message}`);

      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        success: false,
        orderNumber,
        paymentStatus: 'UNKNOWN',
        message: error.message,
      };
    }
  }

  /**
   * Exécute un Cash In Orange Money - Envoie de l'argent vers un wallet client
   * Doc: https://developer.orange-sonatel.com/documentation#operation/Cash%20In
   * Endpoint: POST /api/eWallet/v1/cashins
   *
   * Cas d'usage : Paiement de vendeurs (appels de fonds), remboursements, cashback, etc.
   *
   * @param dto - Données du Cash In (montant, numéro client, référence, etc.)
   * @returns Réponse Orange Money avec transactionId et statut
   */
  async executeCashIn(dto: ExecuteCashInDto): Promise<CashInResponseDto> {
    this.logger.log(`💰 Exécution Cash In Orange Money vers ${dto.customerPhone} - Montant: ${dto.amount} FCFA`);

    const token = await this.getAccessToken();

    // Récupérer la config depuis la DB
    const dbConfig = await this.paymentConfigService.getActiveConfig('ORANGE_MONEY' as any);

    let retailerMsisdn: string;
    let retailerPinCode: string;
    let mode: string;
    let cashinUrl: string;

    if (!dbConfig || !dbConfig.isActive) {
      // Fallback sur les variables d'environnement
      this.logger.warn('⚠️ Pas de config Orange Money dans la DB, utilisation des variables d\'environnement');

      retailerMsisdn = this.configService.get<string>('ORANGE_RETAILER_MSISDN');
      retailerPinCode = this.configService.get<string>('ORANGE_RETAILER_PIN');
      mode = this.configService.get<string>('ORANGE_MODE') || 'sandbox';

      if (!retailerMsisdn || !retailerPinCode) {
        throw new BadRequestException(
          'Orange Money retailer credentials (MSISDN and PIN) not configured in environment variables'
        );
      }

      cashinUrl = mode === 'production'
        ? 'https://api.orange-sonatel.com/api/eWallet/v1/cashins'
        : 'https://api.sandbox.orange-sonatel.com/api/eWallet/v1/cashins';
    } else {
      // Utiliser la config depuis la DB
      mode = dbConfig.activeMode; // 'test' ou 'live'

      // On stocke le MSISDN du retailer dans un champ metadata
      const metadata = dbConfig.metadata as any;
      retailerMsisdn = metadata?.retailerMsisdn;
      retailerPinCode = mode === 'test'
        ? metadata?.testRetailerPin
        : metadata?.liveRetailerPin;

      if (!retailerMsisdn || !retailerPinCode) {
        throw new BadRequestException(
          `Orange Money retailer credentials not configured for ${mode.toUpperCase()} mode in database`
        );
      }

      cashinUrl = mode === 'live'
        ? 'https://api.orange-sonatel.com/api/eWallet/v1/cashins'
        : 'https://api.sandbox.orange-sonatel.com/api/eWallet/v1/cashins';

      this.logger.log(`📊 Utilisation de la configuration ${mode.toUpperCase()} depuis la base de données`);
    }

    // ⚠️ IMPORTANT: Le PIN code doit être crypté avec la clé publique Orange Money
    // Pour l'instant, on utilise le PIN en clair (fonctionnera en sandbox)
    // En production, il faudra récupérer la clé publique et crypter le PIN
    // TODO: Implémenter la récupération de la clé publique et le cryptage RSA
    const encryptedPinCode = retailerPinCode; // À remplacer par le PIN crypté

    // 📝 Référence unique pour traçabilité
    const reference = dto.reference || `CASHIN-${Date.now()}`;

    // 🔥 Payload EXACTEMENT conforme à la doc Orange Money Cash In
    // Doc: https://developer.orange-sonatel.com/documentation (Cash In > POST /api/eWallet/v1/cashins)
    const payload: OrangeCashInPayload = {
      amount: {
        unit: 'XOF',
        value: dto.amount,
      },
      customer: {
        id: dto.customerPhone,
        idType: 'MSISDN',
        walletType: 'PRINCIPAL',
      },
      partner: {
        id: retailerMsisdn,
        idType: 'MSISDN',
        encryptedPinCode: encryptedPinCode,
        walletType: 'PRINCIPAL',
      },
      reference: reference,
      receiveNotification: dto.receiveNotification ?? false,
      metadata: {
        customerName: dto.customerName,
        description: dto.description,
        ...(dto.fundsRequestId && { fundsRequestId: dto.fundsRequestId.toString() }),
      },
      requestDate: new Date().toISOString(),
    };

    this.logger.log(`📦 Mode: ${mode.toUpperCase()}`);
    this.logger.log(`📦 Cash In URL: ${cashinUrl}`);
    this.logger.log(`📦 Retailer MSISDN: ${retailerMsisdn}`);
    this.logger.log(`📦 Customer: ${dto.customerPhone}`);
    this.logger.log(`📦 Payload: ${JSON.stringify({ ...payload, partner: { ...payload.partner, encryptedPinCode: '***' } }, null, 2)}`);

    try {
      const response = await axios.post<OrangeCashInResponse>(
        cashinUrl,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`✅ Cash In Orange Money réussi - Transaction ID: ${response.data.transactionId}`);
      this.logger.log(`📊 Statut: ${response.data.status}`);

      // Si un fundsRequestId est fourni, mettre à jour la demande de fonds
      if (dto.fundsRequestId) {
        await this.prisma.vendorFundsRequest.update({
          where: { id: dto.fundsRequestId },
          data: {
            transactionId: response.data.transactionId,
            status: response.data.status === 'SUCCESS' ? 'PAID' : 'APPROVED',
          },
        });

        this.logger.log(`💾 VendorFundsRequest #${dto.fundsRequestId} mise à jour avec transactionId ${response.data.transactionId}`);
      }

      return {
        transactionId: response.data.transactionId,
        status: response.data.status,
        description: response.data.description,
        reference: response.data.reference || reference,
        requestId: response.data.requestId,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      this.logger.error('❌ Erreur Cash In Orange Money:');
      this.logger.error(`   Mode: ${mode}`);
      this.logger.error(`   URL: ${cashinUrl}`);
      this.logger.error(`   Status: ${status}`);
      this.logger.error(`   Data: ${JSON.stringify(errorData)}`);
      this.logger.error(`   Message: ${error.message}`);

      // Gestion des erreurs selon la doc Orange Money
      if (status === 401) {
        this.logger.warn('⚠️ Token expiré, tentative de renouvellement...');
        this.accessToken = null;
        this.tokenExpiry = 0;
        throw new BadRequestException(
          'Orange Money authentication expired. Please retry - a new token will be obtained automatically.'
        );
      } else if (status === 400) {
        // Erreur métier (solde insuffisant, compte invalide, etc.)
        const errorCode = errorData?.code;
        const errorMessage = errorData?.detail || errorData?.message || 'Invalid parameters';

        // Codes d'erreur métier Orange Money (voir doc Error Codes)
        const businessErrorMessages: { [key: string]: string } = {
          '2000': 'Le compte client n\'existe pas',
          '2001': 'Le numéro MSISDN du client est invalide',
          '2011': 'Code PIN invalide, 2 tentatives restantes',
          '2012': 'Code PIN invalide, 1 tentative restante',
          '2013': 'Code PIN invalide, compte bloqué',
          '2020': 'Solde insuffisant',
          '2021': 'Solde insuffisant pour le payeur',
          '2041': 'Transaction non autorisée',
          '2042': 'Transaction non autorisée pour le payeur',
        };

        const errorMsg = errorCode && businessErrorMessages[errorCode]
          ? businessErrorMessages[errorCode]
          : errorMessage;

        throw new BadRequestException(`Cash In échoué: ${errorMsg}`);
      } else if (status === 422) {
        // Erreur de validation
        throw new BadRequestException(
          `Paramètres invalides: ${errorData?.detail || 'Vérifiez le montant, le numéro et les autres paramètres'}`
        );
      } else if (status === 500 || status === 502 || status === 503) {
        throw new BadRequestException(
          'L\'API Orange Money est temporairement indisponible. Veuillez réessayer dans quelques instants.'
        );
      } else {
        throw new BadRequestException(
          errorData?.detail || errorData?.message || error.message || 'Échec du Cash In Orange Money'
        );
      }
    }
  }

  /**
   * Gère le callback webhook pour les Cash In Orange Money
   * Le callback peut arriver de manière asynchrone après l'exécution du Cash In
   *
   * @param callbackData - Données du callback Orange Money
   */
  async handleCashInCallback(callbackData: any): Promise<void> {
    this.logger.log('📨 Réception callback Cash In Orange Money');
    this.logger.log(`📦 Callback data: ${JSON.stringify(callbackData, null, 2)}`);

    try {
      const transactionId = callbackData.transactionId;
      const status = callbackData.status;
      const metadata = callbackData.metadata || {};
      const fundsRequestId = metadata.fundsRequestId ? parseInt(metadata.fundsRequestId, 10) : null;

      if (!transactionId) {
        this.logger.warn('⚠️ Callback Cash In reçu sans transactionId');
        return;
      }

      // Si un fundsRequestId est présent dans les metadata
      if (fundsRequestId) {
        const fundsRequest = await this.prisma.vendorFundsRequest.findUnique({
          where: { id: fundsRequestId },
        });

        if (!fundsRequest) {
          this.logger.warn(`⚠️ VendorFundsRequest #${fundsRequestId} introuvable`);
          return;
        }

        // Vérifier l'idempotence - ne pas traiter 2 fois le même callback
        if (fundsRequest.status === 'PAID' && fundsRequest.transactionId === transactionId) {
          this.logger.log(`✓ Callback déjà traité pour VendorFundsRequest #${fundsRequestId}`);
          return;
        }

        // Mettre à jour le statut selon le callback
        let newStatus: 'PAID' | 'REJECTED' | 'APPROVED' = 'APPROVED';

        if (status === 'SUCCESS') {
          newStatus = 'PAID';
          this.logger.log(`✅ Cash In réussi - VendorFundsRequest #${fundsRequestId} marqué comme PAID`);
        } else if (status === 'FAILED' || status === 'REJECTED' || status === 'CANCELLED') {
          newStatus = 'REJECTED';
          this.logger.log(`❌ Cash In échoué - VendorFundsRequest #${fundsRequestId} marqué comme REJECTED`);
        }

        await this.prisma.vendorFundsRequest.update({
          where: { id: fundsRequestId },
          data: {
            transactionId: transactionId,
            status: newStatus,
            processedAt: new Date(),
            adminNote: `Callback Orange Money reçu - Statut: ${status}`,
          },
        });

        this.logger.log(`💾 VendorFundsRequest #${fundsRequestId} mis à jour: ${newStatus}`);
      } else {
        // Pas de fundsRequestId, juste logger le callback
        this.logger.log(`📊 Cash In callback reçu - Transaction ID: ${transactionId}, Statut: ${status}`);
      }
    } catch (error) {
      this.logger.error('❌ Erreur traitement callback Cash In:', error);
      throw error;
    }
  }
}
