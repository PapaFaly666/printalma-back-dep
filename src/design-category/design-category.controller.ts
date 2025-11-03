import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../core/guards/admin.guard';
import { RequestWithUser } from '../auth/jwt.strategy';
import { DesignCategoryService } from './design-category.service';
import {
  CreateDesignCategoryDto,
  UpdateDesignCategoryDto,
  ListDesignCategoriesQueryDto,
  DesignCategoryResponseDto,
} from './dto/create-design-category.dto';
import { ParseArrayIntPipe } from './pipes/parse-array-int.pipe';

@ApiTags('Design Categories')
@Controller('design-categories')
export class DesignCategoryController {
  constructor(private readonly designCategoryService: DesignCategoryService) {}

  /**
   * 🌐 PUBLIC - Récupérer les catégories actives pour les vendeurs
   */
  @Get('active')
  @ApiOperation({
    summary: 'Récupérer les catégories actives',
    description: 'Endpoint public pour récupérer toutes les catégories actives utilisables par les vendeurs',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des catégories actives récupérée avec succès',
    type: [DesignCategoryResponseDto],
  })
  async getActiveCategories(): Promise<DesignCategoryResponseDto[]> {
    return this.designCategoryService.getActiveCategories();
  }

  /**
   * 👑 ADMIN - Créer une nouvelle catégorie
   */
  @Post('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '[ADMIN] Créer une catégorie de design',
    description: 'Créer une nouvelle catégorie de design avec image de couverture optionnelle. Seuls les admins peuvent créer des catégories.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Catégorie créée avec succès',
    type: DesignCategoryResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Données invalides' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Nom ou slug déjà utilisé' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Token admin requis' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Droits administrateur requis' })
  async createCategory(
    @Body() createDto: CreateDesignCategoryDto,
    @Req() req: RequestWithUser,
    @UploadedFile() coverImage?: Express.Multer.File,
  ): Promise<DesignCategoryResponseDto> {
    return this.designCategoryService.createCategory(createDto, req.user.sub, coverImage);
  }

  /**
   * 👑 ADMIN - Lister toutes les catégories avec pagination
   */
  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[ADMIN] Lister les catégories',
    description: 'Récupérer toutes les catégories avec pagination et filtres. Accessible aux admins uniquement.',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Filtrer par statut actif' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom/slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des catégories récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        categories: {
          type: 'array',
          items: { $ref: '#/components/schemas/DesignCategoryResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 },
            total: { type: 'number', example: 50 },
            totalPages: { type: 'number', example: 3 },
            hasNext: { type: 'boolean', example: true },
            hasPrevious: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  async getCategories(@Query() queryDto: ListDesignCategoriesQueryDto) {
    return this.designCategoryService.getCategories(queryDto);
  }

  /**
   * 👑 ADMIN - Mettre à jour la configuration des thèmes en vedette
   */
  @Put('featured/update')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[ADMIN] Mettre à jour les thèmes en vedette',
    description: 'Met à jour la liste et l\'ordre des thèmes marqués comme "en vedette". Maximum 5 thèmes. L\'ordre dans le tableau détermine l\'ordre d\'affichage.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Thèmes en vedette mis à jour avec succès',
    type: [DesignCategoryResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation échouée (max 5 thèmes, IDs invalides, catégories inactives, etc.)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Token admin requis',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Droits administrateur requis',
  })
  async updateFeaturedCategories(
    @Body() body: any,
  ): Promise<DesignCategoryResponseDto[]> {
    // Validate body structure
    if (!body || !body.categoryIds) {
      throw new BadRequestException('La liste des IDs de catégories est requise');
    }

    if (!Array.isArray(body.categoryIds)) {
      throw new BadRequestException('categoryIds doit être un tableau');
    }

    if (body.categoryIds.length === 0) {
      throw new BadRequestException('Au moins 1 catégorie doit être sélectionnée');
    }

    if (body.categoryIds.length > 5) {
      throw new BadRequestException('Maximum 5 thèmes autorisés');
    }

    // Convert string IDs to numbers
    const categoryIds = body.categoryIds.map((id, index) => {
      const num = typeof id === 'string' ? parseInt(id, 10) : Number(id);
      if (isNaN(num) || !Number.isInteger(num)) {
        throw new BadRequestException(`ID invalide à l'index ${index}: "${id}" n'est pas un nombre valide`);
      }
      return num;
    });

    return this.designCategoryService.updateFeaturedCategories(categoryIds);
  }

  /**
   * 👑 ADMIN - Récupérer une catégorie par ID
   */
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[ADMIN] Récupérer une catégorie',
    description: 'Récupérer les détails d\'une catégorie spécifique par son ID.',
  })
  @ApiParam({ name: 'id', description: 'ID de la catégorie' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Catégorie récupérée avec succès',
    type: DesignCategoryResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Catégorie non trouvée' })
  async getCategoryById(@Param('id', ParseIntPipe) id: number): Promise<DesignCategoryResponseDto> {
    return this.designCategoryService.getCategoryById(id);
  }

  /**
   * 👑 ADMIN - Mettre à jour une catégorie
   */
  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('coverImage'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '[ADMIN] Mettre à jour une catégorie',
    description: 'Mettre à jour une catégorie existante avec nouvelle image de couverture optionnelle. Tous les champs sont optionnels.',
  })
  @ApiParam({ name: 'id', description: 'ID de la catégorie à modifier' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Catégorie mise à jour avec succès',
    type: DesignCategoryResponseDto,
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Données invalides' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Catégorie non trouvée' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Nom ou slug déjà utilisé' })
  async updateCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDesignCategoryDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ): Promise<DesignCategoryResponseDto> {
    return this.designCategoryService.updateCategory(id, updateDto, coverImage);
  }

  /**
   * 👑 ADMIN - Supprimer une catégorie
   */
  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[ADMIN] Supprimer une catégorie',
    description: 'Supprimer définitivement une catégorie. Impossible si des designs y sont associés.',
  })
  @ApiParam({ name: 'id', description: 'ID de la catégorie à supprimer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Catégorie supprimée avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Catégorie "Logo Design" supprimée avec succès' },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Catégorie non trouvée' })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Impossible de supprimer une catégorie contenant des designs',
  })
  async deleteCategory(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.designCategoryService.deleteCategory(id);
  }

  /**
   * 🌐 PUBLIC - Récupérer une catégorie par slug (pour les pages publiques)
   */
  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Récupérer une catégorie par slug',
    description: 'Endpoint public pour récupérer une catégorie par son slug (pour URLs SEO-friendly)',
  })
  @ApiParam({ name: 'slug', description: 'Slug de la catégorie' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Catégorie récupérée avec succès',
    type: DesignCategoryResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Catégorie non trouvée' })
  async getCategoryBySlug(@Param('slug') slug: string): Promise<DesignCategoryResponseDto> {
    // Pour cette méthode, nous devons ajouter une fonction au service
    return this.designCategoryService.getCategoryBySlug(slug);
  }

  /**
   * 🌐 PUBLIC - Récupérer les thèmes en vedette (featured/trending)
   */
  @Get('featured')
  @ApiOperation({
    summary: 'Récupérer les thèmes tendances',
    description: 'Endpoint public pour récupérer les thèmes marqués comme "en vedette" pour affichage sur le landing page (max 5)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des thèmes en vedette récupérée avec succès',
    type: [DesignCategoryResponseDto],
  })
  async getFeaturedCategories(): Promise<DesignCategoryResponseDto[]> {
    return this.designCategoryService.getFeaturedCategories();
  }
}