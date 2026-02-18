import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreatePaymentConfigDto,
  PaymentProvider,
} from './dto/create-payment-config.dto';
import { UpdatePaymentConfigDto } from './dto/update-payment-config.dto';
import { PaymentConfigPublicDto } from './dto/payment-config-public.dto';

@Injectable()
export class PaymentConfigService {
  private readonly logger = new Logger(PaymentConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une nouvelle configuration de paiement
   * Une seule configuration par provider peut exister
   * Elle contient à la fois les clés TEST et LIVE
   */
  async create(createDto: CreatePaymentConfigDto) {
    this.logger.log(
      `Création d'une configuration pour ${createDto.provider}`,
    );

    // Vérifier si une configuration existe déjà pour ce provider
    const existing = await this.prisma.paymentConfig.findUnique({
      where: {
        provider: createDto.provider,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Une configuration existe déjà pour ${createDto.provider}. Utilisez la mise à jour.`,
      );
    }

    const config = await this.prisma.paymentConfig.create({
      data: {
        provider: createDto.provider,
        isActive: createDto.isActive ?? true,
        activeMode: createDto.mode || 'test',
        // Stocker les clés selon le mode
        ...(createDto.mode === 'test' ? {
          testMasterKey: createDto.masterKey,
          testPrivateKey: createDto.privateKey,
          testToken: createDto.token,
          testPublicKey: createDto.publicKey,
        } : {
          liveMasterKey: createDto.masterKey,
          livePrivateKey: createDto.privateKey,
          liveToken: createDto.token,
          livePublicKey: createDto.publicKey,
        }),
        webhookSecret: createDto.webhookSecret,
        metadata: {},
      },
    });

    this.logger.log(
      `Configuration créée avec succès pour ${createDto.provider}`,
    );
    return this.sanitizeConfig(config);
  }

  /**
   * Récupère toutes les configurations (admin)
   */
  async findAll() {
    const configs = await this.prisma.paymentConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return configs.map((config) => this.sanitizeConfig(config));
  }

  /**
   * Récupère la configuration pour un provider
   */
  async findByProvider(provider: string) {
    const config = await this.prisma.paymentConfig.findUnique({
      where: { provider },
    });

    if (!config) {
      throw new NotFoundException(
        `Aucune configuration trouvée pour le provider ${provider}`,
      );
    }

    return this.sanitizeConfig(config);
  }

  /**
   * Récupère la configuration active pour un provider
   * Utilisé par les services de paiement
   * Retourne les clés appropriées selon le mode actif
   */
  async getActiveConfig(provider: PaymentProvider) {
    const config = await this.prisma.paymentConfig.findFirst({
      where: {
        provider,
        isActive: true,
      },
    });

    if (!config) {
      this.logger.warn(`Aucune configuration active pour ${provider}`);
      return null;
    }

    return config;
  }

  /**
   * Met à jour une configuration spécifique
   * Peut mettre à jour les clés TEST, LIVE, ou les deux
   */
  async update(provider: string, updateDto: UpdatePaymentConfigDto) {
    this.logger.log(`Mise à jour de la configuration ${provider}`);

    const existing = await this.prisma.paymentConfig.findUnique({
      where: { provider },
    });

    if (!existing) {
      throw new NotFoundException(
        `Configuration non trouvée pour ${provider}`,
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (updateDto.isActive !== undefined) {
      updateData.isActive = updateDto.isActive;
    }

    if (updateDto.mode) {
      updateData.activeMode = updateDto.mode;
    }

    // Mise à jour des clés selon le mode spécifié
    if (updateDto.mode === 'test') {
      if (updateDto.masterKey !== undefined) updateData.testMasterKey = updateDto.masterKey;
      if (updateDto.privateKey !== undefined) updateData.testPrivateKey = updateDto.privateKey;
      if (updateDto.token !== undefined) updateData.testToken = updateDto.token;
      if (updateDto.publicKey !== undefined) updateData.testPublicKey = updateDto.publicKey;
    } else if (updateDto.mode === 'live') {
      if (updateDto.masterKey !== undefined) updateData.liveMasterKey = updateDto.masterKey;
      if (updateDto.privateKey !== undefined) updateData.livePrivateKey = updateDto.privateKey;
      if (updateDto.token !== undefined) updateData.liveToken = updateDto.token;
      if (updateDto.publicKey !== undefined) updateData.livePublicKey = updateDto.publicKey;
    }

    if (updateDto.webhookSecret !== undefined) {
      updateData.webhookSecret = updateDto.webhookSecret;
    }

    const updated = await this.prisma.paymentConfig.update({
      where: { provider },
      data: updateData,
    });

    this.logger.log(`Configuration mise à jour avec succès pour ${provider}`);
    return this.sanitizeConfig(updated);
  }

  /**
   * Basculer entre les modes TEST et LIVE
   * Change simplement le champ activeMode
   */
  async switchMode(provider: PaymentProvider, targetMode: 'test' | 'live') {
    this.logger.log(`Basculement vers le mode ${targetMode.toUpperCase()} pour ${provider}`);

    // Vérifier que la config existe
    const config = await this.prisma.paymentConfig.findUnique({
      where: { provider },
    });

    if (!config) {
      throw new NotFoundException(
        `Configuration ${provider} non trouvée. Créez-la d'abord.`,
      );
    }

    // Vérifier que les clés pour le mode cible existent
    const hasKeys = targetMode === 'test'
      ? config.testPrivateKey && config.testToken
      : config.livePrivateKey && config.liveToken;

    if (!hasKeys) {
      throw new BadRequestException(
        `Les clés ${targetMode.toUpperCase()} ne sont pas configurées pour ${provider}`,
      );
    }

    const previousMode = config.activeMode;

    // Basculer le mode actif
    const activated = await this.prisma.paymentConfig.update({
      where: { provider },
      data: {
        activeMode: targetMode,
      },
    });

    this.logger.log(`✅ Basculement réussi vers le mode ${targetMode.toUpperCase()}`);

    return {
      message: `Basculement réussi vers le mode ${targetMode.toUpperCase()}`,
      config: this.sanitizeConfig(activated),
      previousMode,
      currentMode: targetMode,
    };
  }

  /**
   * Supprime une configuration spécifique
   */
  async remove(provider: string) {
    this.logger.log(`Suppression de la configuration ${provider}`);

    const existing = await this.prisma.paymentConfig.findUnique({
      where: { provider },
    });

    if (!existing) {
      throw new NotFoundException(
        `Configuration non trouvée pour ${provider}`,
      );
    }

    await this.prisma.paymentConfig.delete({
      where: { provider },
    });

    this.logger.log(`Configuration supprimée avec succès pour ${provider}`);
    return { message: `Configuration supprimée avec succès` };
  }

  /**
   * Récupère les informations publiques pour le frontend
   * Retourne les clés appropriées selon le mode actif
   */
  async getPublicConfig(
    provider: PaymentProvider,
  ): Promise<PaymentConfigPublicDto | null> {
    const config = await this.getActiveConfig(provider);

    if (!config) {
      return null;
    }

    // Sélectionner les clés appropriées selon le mode actif
    const publicKey = config.activeMode === 'test'
      ? config.testPublicKey
      : config.livePublicKey;

    return {
      provider: config.provider,
      isActive: config.isActive,
      mode: config.activeMode,
      publicKey: publicKey,
      apiUrl: this.getApiUrl(config.provider, config.activeMode),
    };
  }

  /**
   * Retourne l'URL de l'API selon le provider et le mode
   */
  private getApiUrl(provider: string, mode: string): string {
    if (provider === 'PAYDUNYA' || provider === 'paydunya') {
      return mode === 'live'
        ? 'https://app.paydunya.com/api/v1'
        : 'https://app.paydunya.com/sandbox-api/v1';
    }

    // Ajouter d'autres providers ici
    return '';
  }

  /**
   * Sanitize la config en masquant les clés sensibles
   * Utilisé pour les réponses API admin
   */
  private sanitizeConfig(config: any) {
    return {
      ...config,
      // Masquer les clés TEST
      testMasterKey: config.testMasterKey ? this.maskKey(config.testMasterKey) : null,
      testPrivateKey: config.testPrivateKey ? this.maskKey(config.testPrivateKey) : null,
      testToken: config.testToken ? this.maskKey(config.testToken) : null,
      // Masquer les clés LIVE
      liveMasterKey: config.liveMasterKey ? this.maskKey(config.liveMasterKey) : null,
      livePrivateKey: config.livePrivateKey ? this.maskKey(config.livePrivateKey) : null,
      liveToken: config.liveToken ? this.maskKey(config.liveToken) : null,
      // Masquer le webhook secret
      webhookSecret: config.webhookSecret
        ? this.maskKey(config.webhookSecret)
        : null,
    };
  }

  /**
   * Masque une clé API pour l'affichage
   */
  private maskKey(key: string): string {
    if (!key || key.length < 8) return '****';
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }
}
