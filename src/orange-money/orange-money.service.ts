import { Injectable, Logger, BadRequestException } from '@nestjs/common';
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
      this.logger.error('❌ Erreur lors de la récupération du token Orange:');
      this.logger.error(`   Mode: ${mode}`);
      this.logger.error(`   URL: ${authUrl}`);
      this.logger.error(`   Status: ${error.response?.status}`);
      this.logger.error(`   Data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`   Message: ${error.message}`);
      throw new BadRequestException('Failed to authenticate with Orange Money API');
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
    const reference = `OM-${dto.orderNumber}-${Date.now()}`;

    const payload = {
      amount: {
        unit: 'XOF',
        value: dto.amount,
      },
      callbackCancelUrl: `${FRONTEND_URL}/order-confirmation?orderNumber=${dto.orderNumber}&status=cancelled`,
      callbackSuccessUrl: `${FRONTEND_URL}/order-confirmation?orderNumber=${dto.orderNumber}&status=success`,
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

      return {
        qrCode: response.data.qrCode,
        deepLinks: response.data.deepLinks,
        validity: response.data.validity,
        reference,
      };
    } catch (error: any) {
      this.logger.error('❌ Erreur génération QR Orange:');
      this.logger.error(`   Mode: ${mode}`);
      this.logger.error(`   URL: ${qrUrl}`);
      this.logger.error(`   Status: ${error.response?.status}`);
      this.logger.error(`   Data: ${JSON.stringify(error.response?.data)}`);
      this.logger.error(`   Message: ${error.message}`);
      throw new BadRequestException(error.response?.data?.message || 'Failed to generate Orange Money payment');
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
   *   metadata: { orderNumber: "..." }
   * }
   */
  async handleCallback(payload: any): Promise<void> {
    this.logger.log('📞 Callback Orange Money reçu:', JSON.stringify(payload));

    // Extraire les données du callback
    const { reference, status, transactionId, metadata } = payload;

    // Essayer de trouver la commande par reference OU par metadata.orderNumber
    const orderNumber = metadata?.orderNumber || reference;

    if (!orderNumber) {
      this.logger.warn('⚠️ Callback sans orderNumber ni reference');
      return;
    }

    // Trouver la commande
    const order = await this.prisma.order.findFirst({
      where: { orderNumber },
    });

    if (!order) {
      this.logger.warn(`⚠️ Commande ${orderNumber} introuvable`);
      return;
    }

    // Mettre à jour le statut selon la réponse Orange (doc: SUCCESS, FAILED, CANCELLED)
    if (status === 'SUCCESS') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          transactionId: transactionId || reference,
        },
      });
      this.logger.log(`✅ Commande ${orderNumber} marquée comme PAYÉE (transaction: ${transactionId || reference})`);
    } else if (status === 'CANCELLED' || status === 'FAILED') {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
          transactionId: transactionId || reference,
        },
      });
      this.logger.log(`❌ Commande ${orderNumber} marquée comme ÉCHOUÉE (statut: ${status})`);
    } else {
      this.logger.warn(`⚠️ Statut inconnu reçu d'Orange Money: ${status}`);
    }
  }
}
