import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BestSellersService } from './best-sellers.service';

@ApiTags('Public - New Arrivals')
@Controller('public/new-arrivals')
export class PublicNewArrivalsController {
  constructor(private readonly bestSellersService: BestSellersService) {}

  @Get()
  @ApiOperation({
    summary: 'Récupérer les nouveautés (endpoint public)',
    description: 'Retourne les produits récemment publiés/validés, triés par date de création, avec la même structure de réponse que /public/best-sellers-v2'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de produits à retourner (défaut: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset pour pagination (défaut: 0)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'vendorId', required: false, type: Number, description: 'Filtrer par vendeur spécifique' })
  @ApiResponse({
    status: 200,
    description: 'Liste des nouveautés récupérée avec succès',
  })
  async getNewArrivals(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('category') category?: string,
    @Query('vendorId') vendorId?: number,
  ) {
    return this.bestSellersService.getPublicNewArrivals({
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
      category,
      vendorId: vendorId ? parseInt(vendorId.toString()) : undefined,
    });
  }

  @Get('vendor/:vendorId')
  @ApiOperation({
    summary: 'Récupérer les nouveautés d\'un vendeur spécifique',
    description: 'Retourne les nouveautés d\'un vendeur donné, triées par date de création'
  })
  async getVendorNewArrivals(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.bestSellersService.getPublicNewArrivals({
      vendorId,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });
  }
}



