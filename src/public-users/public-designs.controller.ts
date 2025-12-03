import {
  Controller,
  Get,
  Query,
  Logger,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PublicDesignsService } from './services/public-designs.service';

@ApiTags('public-designs')
@Controller('public/designs')
export class PublicDesignsController {
  private readonly logger = new Logger(PublicDesignsController.name);

  constructor(
    private readonly publicDesignsService: PublicDesignsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister tous les designs publiés (Public)',
    description: 'Récupère tous les designs publiés avec leurs informations complètes : utilisateur, produits mockup avec design et délimitation'
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de designs (défaut: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Pagination (défaut: 0)' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Recherche textuelle' })
  @ApiQuery({ name: 'categoryId', required: false, type: 'number', description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'Filtrer par vendeur' })
  @ApiResponse({
    status: 200,
    description: 'Liste des designs récupérée avec succès'
  })
  async getAllDesigns(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: number,
    @Query('vendorId') vendorId?: number,
  ) {
    this.logger.log(`🎨 Récupération de tous les designs publiés`);

    return this.publicDesignsService.getAllDesigns({
      limit,
      offset,
      search,
      categoryId,
      vendorId,
    });
  }

  @Get(':designId')
  @ApiOperation({
    summary: 'Récupérer un design spécifique (Public)',
    description: 'Récupère un design publié avec toutes ses informations'
  })
  @ApiResponse({
    status: 200,
    description: 'Design récupéré avec succès'
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé'
  })
  async getDesignById(
    @Param('designId', ParseIntPipe) designId: number,
  ) {
    this.logger.log(`🎨 Récupération du design #${designId}`);

    return this.publicDesignsService.getDesignById(designId);
  }
}
