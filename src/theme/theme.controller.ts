import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  ParseIntPipe,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiConsumes,
  ApiBody 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ThemeService } from './theme.service';
import { CreateThemeDto } from './dto/create-theme.dto';
import { UpdateThemeDto } from './dto/update-theme.dto';
import { AddProductsToThemeDto } from './dto/add-products-to-theme.dto';

@ApiTags('themes')
@Controller('themes')
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des thèmes' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'all'] })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'featured', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Liste des thèmes récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Aucun thème trouvé' })
  async findAll(
    @Query('status') status?: 'active' | 'inactive' | 'all',
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('featured') featured?: boolean
  ) {
    const filters = {
      status,
      category,
      search,
      limit: limit ? parseInt(limit.toString()) : 20,
      offset: offset ? parseInt(offset.toString()) : 0,
      featured
    };

    const result = await this.themeService.findAll(filters);

    if (result.data.length === 0) {
      return {
        success: false,
        error: 'Aucun thème trouvé',
        statusCode: 404
      };
    }

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un thème' })
  @ApiParam({ name: 'id', description: 'ID du thème' })
  @ApiResponse({ status: 200, description: 'Détails du thème récupérés avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.themeService.findOne(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Récupérer les produits d\'un thème' })
  @ApiParam({ name: 'id', description: 'ID du thème' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'READY'], description: 'Filtrer par statut des produits' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Rechercher par nom de produit' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de produits à retourner' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset pour la pagination' })
  @ApiQuery({ name: 'sort', required: false, enum: ['name', 'price', 'createdAt'], description: 'Trier par champ' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @ApiResponse({ status: 200, description: 'Liste des produits du thème récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async getThemeProducts(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sort') sort?: string,
    @Query('order') order?: 'asc' | 'desc'
  ) {
    const filters = {
      status,
      category,
      search,
      limit: limit ? parseInt(limit.toString()) : 20,
      offset: offset ? parseInt(offset.toString()) : 0,
      sort: sort || 'createdAt',
      order: order || 'desc'
    };

    return this.themeService.getThemeProducts(id, filters);
  }

  // Endpoints protégés par authentification pour l'administration
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Créer un thème' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Manga Collection' },
        description: { type: 'string', example: 'Thème dédié aux mangas et animes populaires' },
        category: { type: 'string', example: 'anime' },
        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
        featured: { type: 'boolean', example: false },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Image de couverture du thème'
        }
      },
      required: ['name', 'description', 'category']
    }
  })
  @ApiResponse({ status: 201, description: 'Thème créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() createThemeDto: CreateThemeDto,
    @UploadedFile() coverImage?: Express.Multer.File
  ) {
    // Validation des données requises
    if (!createThemeDto.name || !createThemeDto.description || !createThemeDto.category) {
      const missingFields = [];
      if (!createThemeDto.name) missingFields.push('Le nom du thème est requis');
      if (!createThemeDto.description) missingFields.push('La description est requise');
      if (!createThemeDto.category) missingFields.push('La catégorie est requise');

      throw new BadRequestException({
        success: false,
        error: 'Validation failed',
        details: missingFields,
        statusCode: 400
      });
    }

    return this.themeService.create(createThemeDto, coverImage);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Modifier un thème' })
  @ApiParam({ name: 'id', description: 'ID du thème' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Manga Collection Updated' },
        description: { type: 'string', example: 'Description mise à jour' },
        category: { type: 'string', example: 'anime' },
        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
        featured: { type: 'boolean', example: true },
        coverImage: {
          type: 'string',
          format: 'binary',
          description: 'Nouvelle image de couverture (optionnel)'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Thème modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateThemeDto: UpdateThemeDto,
    @UploadedFile() coverImage?: Express.Multer.File
  ) {
    return this.themeService.update(id, updateThemeDto, coverImage);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer un thème' })
  @ApiParam({ name: 'id', description: 'ID du thème' })
  @ApiResponse({ status: 204, description: 'Thème supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.themeService.remove(id);
    return {
      statusCode: 204,
      ...result
    };
  }

  @Get(':id/available-products')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer les produits disponibles pour un thème' })
  @ApiParam({ name: 'id', description: 'ID du thème' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'READY'], description: 'Filtrer par statut des produits' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Rechercher par nom de produit' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de produits à retourner' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset pour la pagination' })
  @ApiResponse({ status: 200, description: 'Liste des produits disponibles récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  async getAvailableProducts(
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const filters = {
      status,
      category,
      search,
      limit: limit ? parseInt(limit.toString()) : 20,
      offset: offset ? parseInt(offset.toString()) : 0
    };

    return this.themeService.getAvailableProducts(id, filters);
  }

  @Post(':id/products')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter des produits à un thème' })
  @ApiParam({ name: 'id', description: 'ID du thème' })
  @ApiBody({ type: AddProductsToThemeDto })
  @ApiResponse({ status: 200, description: 'Produits ajoutés au thème avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async addProductsToTheme(
    @Param('id', ParseIntPipe) id: number,
    @Body() addProductsDto: AddProductsToThemeDto
  ) {
    return this.themeService.addProductsToTheme(id, addProductsDto);
  }

  @Delete(':id/products')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer des produits d\'un thème' })
  @ApiParam({ name: 'id', description: 'ID du thème' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productIds: {
          type: 'array',
          items: { type: 'number' },
          example: [1, 2, 3],
          description: 'Liste des IDs des produits à supprimer du thème'
        }
      },
      required: ['productIds']
    }
  })
  @ApiResponse({ status: 200, description: 'Produits supprimés du thème avec succès' })
  @ApiResponse({ status: 404, description: 'Thème non trouvé' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async removeProductsFromTheme(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { productIds: number[] }
  ) {
    return this.themeService.removeProductsFromTheme(id, body.productIds);
  }
} 