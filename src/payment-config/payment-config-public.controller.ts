import { Controller, Get, Param } from '@nestjs/common';
import { PaymentConfigService } from './payment-config.service';
import { PaymentProvider } from './dto/create-payment-config.dto';

/**
 * Controller public pour récupérer les configurations de paiement
 * Utilisé par le frontend pour obtenir les informations nécessaires
 */
@Controller('payment-config')
export class PaymentConfigPublicController {
  constructor(private readonly paymentConfigService: PaymentConfigService) {}

  /**
   * Récupère le statut du paiement à la livraison
   * GET /payment-config/cash-on-delivery
   * Doit être AVANT @Get(':provider') pour éviter le conflit de route
   */
  @Get('cash-on-delivery')
  async getCodStatus() {
    return this.paymentConfigService.getCodStatus();
  }

  /**
   * Récupère la configuration publique pour un provider
   * GET /payment-config/:provider
   *
   * Retourne uniquement les informations sécurisées nécessaires au frontend :
   * - provider
   * - isActive
   * - mode (test/live)
   * - publicKey (si disponible)
   * - apiUrl
   *
   * Les clés privées et sensibles ne sont JAMAIS exposées
   */
  @Get(':provider')
  async getPublicConfig(@Param('provider') provider: PaymentProvider) {
    const config = await this.paymentConfigService.getPublicConfig(provider);

    if (!config) {
      return {
        message: `Aucune configuration active pour ${provider}`,
        provider,
        isActive: false,
      };
    }

    return config;
  }

  /**
   * Récupère la configuration publique de Paydunya
   * GET /payment-config/paydunya/public
   *
   * Endpoint de commodité pour Paydunya
   */
  @Get('paydunya/public')
  async getPaydunyaPublicConfig() {
    return this.getPublicConfig(PaymentProvider.PAYDUNYA);
  }
}
