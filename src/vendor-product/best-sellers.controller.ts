import {
  Controller,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { VendorPublishService } from './vendor-publish.service';

@ApiTags('Meilleures Ventes - Public')
@Controller('vendor')
export class BestSellersController {
  private readonly logger = new Logger(BestSellersController.name);

  constructor(
    private readonly vendorPublishService: VendorPublishService,
  ) {}

  /**
   * ✅ MEILLEURES VENTES - Récupérer les produits avec les meilleures ventes (PUBLIC)
   */
  @Get('products/best-sellers')
  @ApiOperation({
    summary: 'Récupérer les produits avec les meilleures ventes',
    description: 'Retourne les produits marqués comme meilleures ventes pour un vendeur ou tous les vendeurs (Endpoint public)'
  })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'ID du vendeur (optionnel)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de produits à retourner (défaut: 10)' })
  async getBestSellers(
    @Query('vendorId') vendorId?: number,
    @Query('limit') limit?: number
  ) {
    this.logger.log(`🏆 Récupération des meilleures ventes${vendorId ? ` pour vendeur ${vendorId}` : ''}`);
    
    return this.vendorPublishService.getBestSellers(vendorId, limit || 10);
  }
} 