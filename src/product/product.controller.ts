import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  BadRequestException,
  Patch,
  UseGuards,
  UploadedFiles,
  Res,
  UploadedFile,
  Req,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateReadyProductDto } from './dto/create-ready-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateStocksDto } from './dto/update-stocks.dto';
import { RechargeStockDto } from './dto/recharge-stock.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockHistoryQueryDto } from './dto/stock-history-query.dto';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiProperty,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequestWithUser } from '../auth/jwt.strategy';
import { IsEnum } from 'class-validator';
import { FileFieldsInterceptor, FileInterceptor, AnyFilesInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../multerConfig';
import { Response, Request } from 'express';
import { PrismaService } from '../prisma.service';

// DTO pour la mise à jour du statut
class UpdateStatusDto {
  @ApiProperty({
    description: 'Statut de publication du produit',
    enum: ['PUBLISHED', 'DRAFT'],
  })
  @IsEnum(['PUBLISHED', 'DRAFT'])
  status: 'PUBLISHED' | 'DRAFT';
}

// DTO pour l'upload d'image de couleur
class UploadColorImageDto {
  @ApiProperty({
    description: 'ID de la couleur à mettre à jour',
    type: 'number',
  })
  colorId: number;
}

@ApiBearerAuth()
@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly prismaService: PrismaService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product with all its variations' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productData: {
          type: 'string',
          description: 'A JSON string of the product data.',
        },
        // Files are uploaded as separate parts of the multipart request
      },
    },
  })
  @ApiResponse({ status: 201, description: 'The product has been successfully created.'})
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(
    @Body('productData') productDataString: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // ✅ LOGS DE DÉBOGAGE DÉTAILLÉS POUR TRACER LE PROBLÈME
    console.log('=== DIAGNOSTIC GENRE - CONTRÔLEUR ===');
    console.log('📥 [CONTROLLER] Raw productDataString:', productDataString);
    console.log('📥 [CONTROLLER] Files count:', files?.length || 0);
    
    if (!productDataString) {
      throw new BadRequestException('productData is required.');
    }
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required.');
    }
    
    let productDto: CreateProductDto;
    try {
      productDto = JSON.parse(productDataString);
      
      // ✅ LOGS DÉTAILLÉS APRÈS PARSING
      console.log('📥 [CONTROLLER] Parsed productDto:', JSON.stringify(productDto, null, 2));
      console.log('📥 [CONTROLLER] Genre reçu:', productDto.genre);
      console.log('📥 [CONTROLLER] Genre type:', typeof productDto.genre);
      console.log('📥 [CONTROLLER] Genre is defined?', !!productDto.genre);
      console.log('📥 [CONTROLLER] isReadyProduct reçu:', productDto.isReadyProduct);
      console.log('📥 [CONTROLLER] isReadyProduct type:', typeof productDto.isReadyProduct);
      console.log('📥 [CONTROLLER] isReadyProduct is defined?', productDto.isReadyProduct !== undefined);
      console.log('=======================================');
      
    } catch (error) {
      console.error('❌ [CONTROLLER] Error parsing JSON:', error);
      throw new BadRequestException('productData must be a valid JSON string.');
    }

    return this.productService.create(productDto, files);
  }

  @Post('with-images')
  @ApiOperation({ summary: 'Créer un nouveau produit avec des images de couleurs (ancienne méthode)' })
  @ApiResponse({ status: 201, description: 'Produit créé avec succès avec images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'colorImages', maxCount: 10 }, // Max 10 images par requête
  ], multerConfig))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        stock: { type: 'number' },
        status: { type: 'string', enum: ['PUBLISHED', 'DRAFT'] },
        designId: { type: 'number' },
        sizeIds: { type: 'array', items: { type: 'number' } },
        colorIds: { type: 'array', items: { type: 'number' } },
        customColors: { 
          type: 'array', 
          items: { 
            type: 'object',
            properties: {
              name: { type: 'string' },
              hexCode: { type: 'string' },
              imageUrl: { type: 'string', description: 'URL optionnelle de l\'image de la couleur déjà téléchargée sur Cloudinary' }
            }
          } 
        },
        customColorImages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL Cloudinary de l\'image pour la couleur personnalisée correspondante' }
            }
          },
          description: 'URLs des images Cloudinary pour les couleurs personnalisées'
        },
        colorImages: {
          type: 'object',
          properties: {},
          additionalProperties: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL Cloudinary de l\'image' }
            }
          },
          description: 'Dictionnaire d\'URLs d\'images pour les couleurs standards, où la clé est l\'ID de la couleur'
        },
        categoryId: { type: 'number' },
      },
      required: ['name', 'description', 'price', 'stock', 'sizeIds', 'categoryId'],
    },
  })
  async createWithImages(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() files: { colorImages?: Express.Multer.File[] },
  ) {
    // This endpoint is disabled for the new schema
    throw new BadRequestException('This endpoint is temporarily disabled. Please use POST /products instead.');
  }

  @Post(':productId/colors/:colorId/images')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Uploader une image pour une couleur d\'un produit admin (mockup)' })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiParam({ name: 'colorId', description: 'ID de la variation couleur' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary', description: 'Fichier image à uploader' }
      },
      required: ['image']
    }
  })
  async uploadColorImageAdmin(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('colorId', ParseIntPipe) colorId: number,
    @UploadedFile() image: Express.Multer.File,
    @Req() req: any
  ) {
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent uploader une image de couleur');
    }
    return this.productService.uploadColorImage(productId, colorId, image);
  }

  /**
   * Upload direct d'image de couleur pour modification de produit
   */
  @Post('upload-color-image/:productId/:colorId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload direct d\'image de couleur pour modification de produit' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image de couleur à uploader',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image de couleur (JPG, PNG, WEBP)'
        }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Image uploadée avec succès' })
  @ApiResponse({ status: 400, description: 'Format d\'image non supporté ou erreur d\'upload' })
  @ApiResponse({ status: 404, description: 'Produit ou couleur non trouvé' })
  async uploadColorImage(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('colorId', ParseIntPipe) colorId: number,
    @UploadedFile() image: Express.Multer.File
  ) {
    return this.productService.uploadColorImage(productId, colorId, image);
  }

  @Post(':productId/colors/:colorId/images')
  @ApiOperation({ summary: 'Ajouter des images à une couleur d\'un produit' })
  @ApiResponse({ status: 201, description: 'Images ajoutées avec succès' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'images', maxCount: 10 }, // Max 10 images par requête
  ], multerConfig))
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiParam({ name: 'colorId', description: 'ID de la couleur' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['images'],
    },
  })
  async addColorImages(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('colorId', ParseIntPipe) colorId: number,
    @UploadedFiles() files: { images?: Express.Multer.File[] },
    @Res() res: Response,
  ) {
    if (!files.images || files.images.length === 0) {
      throw new BadRequestException('Au moins une image doit être fournie');
    }

    // Vérifier que le produit existe et contient cette couleur
    await this.productService.findOne(productId);
    
    // Appeler le service de couleur via le service de produit ou injecter le service de couleur ici
    // Pour cet exemple, redirigeons simplement vers l'API des couleurs
    return res.redirect(307, `/colors/${colorId}/images`);
  }

  @Get()
  @ApiOperation({ summary: 'List all products' })
  @ApiQuery({ name: 'isReadyProduct', required: false, type: Boolean, description: 'Filtrer par produits prêts (true) ou mockups (false)' })
  @ApiQuery({ name: 'hasDelimitations', required: false, type: Boolean, description: 'Filtrer par produits avec délimitations' })
  @ApiQuery({ name: 'forVendorDesign', required: false, type: Boolean, description: 'Filtrer pour les designs vendeur (mockups avec délimitations)' })
  @ApiQuery({ name: 'status', required: false, enum: ['PUBLISHED', 'DRAFT'], description: 'Filtrer par statut' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'genre', required: false, enum: ['HOMME', 'FEMME', 'BEBE', 'UNISEXE', 'AUTOCOLLANT'], description: 'Filtrer par genre (public cible)' })
  @ApiQuery({ name: 'requiresStock', required: false, type: Boolean, description: 'Filtrer par gestion de stock (true/false)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Rechercher par nom' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de produits à retourner' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset pour pagination' })
  @ApiResponse({ status: 200, description: 'Liste des produits récupérée avec succès' })
  async findAll(
    @Query('isReadyProduct') isReadyProduct?: boolean,
    @Query('hasDelimitations') hasDelimitations?: boolean,
    @Query('forVendorDesign') forVendorDesign?: boolean,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('genre') genre?: string,
    @Query('requiresStock') requiresStock?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number
  ) {
    const filters = {
      isReadyProduct,
      hasDelimitations,
      forVendorDesign,
      status,
      category,
      genre,
      requiresStock: requiresStock === 'true' ? true : requiresStock === 'false' ? false : undefined,
      search,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined
    };

    return this.productService.findAllWithFilters(filters);
  }

  @Get('deleted')
  @ApiOperation({ summary: 'Lister tous les produits supprimés (soft deleted)' })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits supprimés',
    type: [ProductResponseDto],
  })
  findAllDeleted() {
    return this.productService.findAllDeleted();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productService.findOne(id);
  }

  @Get('health')
  @ApiOperation({ summary: 'Check database health and performance' })
  @ApiResponse({ status: 200, description: 'Database health status' })
  async healthCheck() {
    const health = await this.prismaService.healthCheck();
    
    // Cleanup des connexions si nécessaire
    if (health.connections?.idle_in_transaction > 5) {
      await this.prismaService.cleanupConnections();
    }
    
    return {
      ...health,
      recommendations: this.getPerformanceRecommendations(health)
    };
  }

  private getPerformanceRecommendations(health: any) {
    const recommendations = [];
    
    if (health.database?.responseTime > 1000) {
      recommendations.push('Database response time is slow (>1s). Consider optimizing queries.');
    }
    
    if (health.connections?.active_connections > 15) {
      recommendations.push('High number of active connections. Consider connection pooling.');
    }
    
    if (health.connections?.idle_in_transaction > 3) {
      recommendations.push('Idle transactions detected. Consider shorter transaction timeouts.');
    }
    
    return recommendations;
  }

  @Post(':productId/colors/:colorId/images/:imageId/design')
  @ApiOperation({ 
    summary: 'Upload de design pour une image spécifique',
    description: 'Upload un design personnalisé sur une image de produit spécifique'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('design', multerConfig))
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiParam({ name: 'colorId', description: 'ID de la couleur' })
  @ApiParam({ name: 'imageId', description: 'ID de l\'image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        design: {
          type: 'string',
          format: 'binary',
          description: 'Fichier image du design (PNG, JPG, JPEG, SVG - max 10MB)'
        },
        originalName: {
          type: 'string',
          description: 'Nom original du fichier'
        },
        description: {
          type: 'string',
          description: 'Description du design'
        }
      },
      required: ['design']
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Design uploadé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        design: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'design_123' },
            url: { type: 'string', example: 'https://res.cloudinary.com/example/design.webp' },
            filename: { type: 'string', example: 'design_123.webp' },
            size: { type: 'number', example: 245760 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou fichier non supporté' })
  @ApiResponse({ status: 404, description: 'Produit, couleur ou image non trouvé' })
  async uploadDesign(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('colorId', ParseIntPipe) colorId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @UploadedFile() designFile: Express.Multer.File,
    @Body('originalName') originalName?: string,
    @Body('description') description?: string,
  ) {
    if (!designFile) {
      throw new BadRequestException('Fichier design requis');
    }

    return this.productService.uploadDesign(
      productId,
      colorId,
      imageId,
      designFile,
      { 
        originalName: originalName || designFile.originalname,
        description,
        replaceExisting: true 
      }
    );
  }

  @Patch(':productId/colors/:colorId/images/:imageId/design')
  @ApiOperation({ 
    summary: 'Remplacement de design existant',
    description: 'Remplace un design existant sur une image de produit'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('design', multerConfig))
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiParam({ name: 'colorId', description: 'ID de la couleur' })
  @ApiParam({ name: 'imageId', description: 'ID de l\'image' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        design: {
          type: 'string',
          format: 'binary',
          description: 'Nouveau fichier image du design'
        },
        originalName: {
          type: 'string',
          description: 'Nom original du fichier'
        },
        description: {
          type: 'string',
          description: 'Description du design'
        }
      },
      required: ['design']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Design remplacé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        design: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'design_456' },
            url: { type: 'string', example: 'https://res.cloudinary.com/example/new_design.webp' },
            filename: { type: 'string', example: 'new_design.webp' },
            size: { type: 'number', example: 312345 }
          }
        },
        previousDesign: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'design_123' },
            deleted: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  async replaceDesign(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('colorId', ParseIntPipe) colorId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @UploadedFile() designFile: Express.Multer.File,
    @Body('originalName') originalName?: string,
  ) {
    if (!designFile) {
      throw new BadRequestException('Fichier design requis');
    }

    return this.productService.replaceDesign(
      productId,
      colorId,
      imageId,
      designFile,
      { originalName: originalName || designFile.originalname }
    );
  }

  @Delete(':productId/colors/:colorId/images/:imageId/design')
  @ApiOperation({ 
    summary: 'Suppression de design',
    description: 'Supprime le design d\'une image de produit'
  })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiParam({ name: 'colorId', description: 'ID de la couleur' })
  @ApiParam({ name: 'imageId', description: 'ID de l\'image' })
  @ApiResponse({ 
    status: 200, 
    description: 'Design supprimé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        deletedDesign: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'design_123' },
            filename: { type: 'string', example: 'design_123.webp' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Design non trouvé' })
  async deleteDesign(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('colorId', ParseIntPipe) colorId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.productService.deleteDesign(productId, colorId, imageId);
  }

  @Get(':productId/colors/:colorId/images/:imageId/design')
  @ApiOperation({ 
    summary: 'Récupération de design',
    description: 'Récupère les informations d\'un design sur une image'
  })
  @ApiParam({ name: 'productId', description: 'ID du produit' })
  @ApiParam({ name: 'colorId', description: 'ID de la couleur' })
  @ApiParam({ name: 'imageId', description: 'ID de l\'image' })
  @ApiResponse({ 
    status: 200, 
    description: 'Informations du design',
    schema: {
      type: 'object',
      properties: {
        design: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', example: 'design_123' },
            url: { type: 'string', example: 'https://res.cloudinary.com/example/design.webp' },
            filename: { type: 'string', example: 'design_123.webp' },
            originalName: { type: 'string', example: 'mon-design.png' },
            size: { type: 'number', example: 245760 },
            uploadedAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
            isActive: { type: 'boolean', example: true },
            description: { type: 'string', example: 'Design personnalisé', nullable: true }
          }
        }
      }
    }
  })
  async getDesign(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('colorId', ParseIntPipe) colorId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.productService.getDesign(productId, colorId, imageId);
  }

  @Get('blank')
  @ApiOperation({ 
    summary: 'Récupération des produits vierges',
    description: 'Récupère tous les produits qui n\'ont aucun design personnalisé'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des produits vierges',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'T-shirt Basic' },
              price: { type: 'number', example: 19.99 },
              status: { type: 'string', example: 'PUBLISHED' },
              hasDesign: { type: 'boolean', example: false },
              designCount: { type: 'number', example: 0 }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 25 },
            limit: { type: 'number', example: 50 },
            offset: { type: 'number', example: 0 },
            hasNext: { type: 'boolean', example: false }
          }
        }
      }
    }
  })
  async getBlankProducts(
    @Req() req: Request,
  ) {
    const { status, limit, offset, search } = req.query;
    
    const filters = {
      status: status as 'published' | 'draft' | 'all',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      search: search as string
    };

    return this.productService.getBlankProducts(filters);
  }

  @Get('design-stats')
  @ApiOperation({ summary: 'Obtenir les statistiques des designs' })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques des designs',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        stats: {
          type: 'object',
          properties: {
            totalProducts: { type: 'number' },
            productsWithDesign: { type: 'number' },
            blankProducts: { type: 'number' },
            designPercentage: { type: 'number' },
            totalDesigns: { type: 'number' },
            averageDesignsPerProduct: { type: 'number' }
          }
        }
      }
    }
  })
  async getDesignStats() {
    return this.productService.getDesignStats();
  }

  /**
   * ENDPOINTS DE VALIDATION DES PRODUITS
   */

  @Post(':id/submit-for-validation')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Soumettre un produit pour validation admin',
    description: 'Permet à un vendeur de soumettre son produit pour validation par un administrateur'
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiResponse({ 
    status: 200, 
    description: 'Produit soumis pour validation avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Produit soumis pour validation avec succès' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 123 },
            name: { type: 'string', example: 'T-shirt personnalisé' },
            submittedForValidationAt: { type: 'string', example: '2024-01-15T10:30:00Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Produit pas en brouillon ou déjà soumis' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async submitProductForValidation(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    const vendorId = req.user?.id;
    if (!vendorId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    const result = await this.productService.submitProductForValidation(id, vendorId);
    
    return {
      success: true,
      message: 'Produit soumis pour validation avec succès',
      data: result
    };
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Voir les produits en attente de validation (Admin)',
    description: 'Récupère tous les produits en attente de validation pour les administrateurs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des produits en attente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 123 },
                  name: { type: 'string', example: 'T-shirt personnalisé' },
                  price: { type: 'number', example: 25000 },
                  submittedForValidationAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        name: { type: 'string' }
                      }
                    }
                  }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 5 },
                totalItems: { type: 'number', example: 85 },
                itemsPerPage: { type: 'number', example: 20 }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Accès réservé aux admins' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getPendingProducts(
    @Req() req: any
  ) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    const queryDto = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      search: req.query.search,
      category: req.query.category,
      sortBy: req.query.sortBy || 'submittedForValidationAt',
      sortOrder: req.query.sortOrder || 'desc'
    };

    const result = await this.productService.getPendingProducts(adminId, queryDto);
    
    return {
      success: true,
      data: result
    };
  }

  @Post(':id/validate')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ 
    summary: 'Valider ou rejeter un produit (Admin)',
    description: 'Permet à un administrateur d\'approuver ou rejeter un produit soumis pour validation'
  })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        approved: { 
          type: 'boolean', 
          example: true,
          description: 'true pour approuver, false pour rejeter'
        },
        rejectionReason: { 
          type: 'string', 
          example: 'La qualité des images n\'est pas suffisante',
          description: 'Raison du rejet (obligatoire si approved = false)'
        }
      },
      required: ['approved']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Produit validé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Produit approuvé avec succès' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 123 },
            isValidated: { type: 'boolean', example: true },
            status: { type: 'string', example: 'PUBLISHED' },
            validatedAt: { type: 'string', example: '2024-01-15T11:00:00Z' },
            validatorName: { type: 'string', example: 'Admin User' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou produit pas en attente' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux admins' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async validateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() validationDto: { approved: boolean; rejectionReason?: string },
    @Req() req: any
  ) {
    const adminId = req.user?.id;
    if (!adminId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    const { approved, rejectionReason } = validationDto;

    if (!approved && !rejectionReason) {
      throw new BadRequestException('La raison du rejet est obligatoire lors du rejet d\'un produit');
    }

    const result = await this.productService.validateProduct(id, adminId, approved, rejectionReason);
    
    return {
      success: true,
      message: approved ? 'Produit approuvé avec succès' : 'Produit rejeté avec succès',
      data: result
    };
  }

  @Patch(':id/soft-delete')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Soft delete d\'un produit admin (mockup)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du produit admin' })
  async softDeleteProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent supprimer un produit admin');
    }
    await this.productService.softDeleteProduct(id);
    return { success: true, message: 'Produit admin supprimé (soft delete)' };
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Restaurer un produit admin supprimé (soft delete)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du produit admin' })
  async restoreProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent restaurer un produit admin');
    }
    await this.productService.restore(id);
    return { success: true, message: 'Produit restauré avec succès' };
  }

  @Delete(':id/delete-forever')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Suppression définitive d\'un produit admin déjà soft deleted' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du produit admin' })
  async deleteForever(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent supprimer définitivement un produit admin');
    }
    await this.productService.deleteForever(id);
    return { success: true, message: 'Produit supprimé définitivement' };
  }

  @Get('debug/user-role')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Debug - Vérifier le rôle de l\'utilisateur connecté' })
  async debugUserRole(@Req() req: any) {
    return {
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        roleType: typeof req.user.role,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
      },
      debug: {
        isAdmin: req.user.role === 'ADMIN',
        isSuperAdmin: req.user.role === 'SUPERADMIN',
        includesAdminCheck: ['ADMIN', 'SUPERADMIN'].includes(req.user.role),
        rawUserObject: req.user
      }
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Modifier un produit admin (mockup) - toutes infos (délimitation, couleur, face, etc.)' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du produit admin' })
  @ApiBody({ type: UpdateProductDto })
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductDto,
    @Req() req: any
  ) {
    // DEBUG: Ajouter des logs pour comprendre le problème
    console.log('🔍 DEBUG UPDATE PRODUCT:');
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);
    console.log('User Role Type:', typeof req.user.role);
    console.log('Is ADMIN?', req.user.role === 'ADMIN');
    console.log('Is SUPERADMIN?', req.user.role === 'SUPERADMIN');
    console.log('Array includes check:', ['ADMIN', 'SUPERADMIN'].includes(req.user.role));

    // Vérifier que l'utilisateur est admin ou superadmin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException(`Seuls les administrateurs peuvent modifier les produits. Rôle actuel: ${req.user.role}`);
    }

    return this.productService.updateProduct(id, updateDto);
  }

  // Endpoints pour les produits prêts (sans délimitations)
  @Post('ready')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new ready product (admin only)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productData: {
          type: 'string',
          description: 'A JSON string of the ready product data.',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'The ready product has been successfully created.'})
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async createReadyProduct(
    @Body('productData') productDataString: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any
  ) {
    // ✅ LOGS DE DÉBOGAGE
    console.log('🔍 createReadyProduct - Request body:', req.body);
    console.log('🔍 createReadyProduct - productDataString:', productDataString);
    console.log('🔍 createReadyProduct - Files count:', files?.length || 0);

    // Vérifier que l'utilisateur est admin ou superadmin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent créer des produits prêts.');
    }

    if (!productDataString) {
      throw new BadRequestException('productData is required.');
    }
    if (!files || files.length === 0) {
      throw new BadRequestException('At least one image file is required.');
    }
    
    let productDto: CreateReadyProductDto;
    try {
      productDto = JSON.parse(productDataString);
      
      // ✅ LOGS DE DÉBOGAGE APRÈS PARSING
      console.log('🔍 createReadyProduct - Parsed productDto:', JSON.stringify(productDto, null, 2));
      console.log('🔍 createReadyProduct - isReadyProduct from DTO:', productDto.isReadyProduct);
      console.log('🔍 createReadyProduct - Type isReadyProduct:', typeof productDto.isReadyProduct);
      
      // ✅ NOUVEAUX LOGS POUR LE GENRE
      console.log('🔍 [CONTROLLER] createReadyProduct - Genre reçu:', productDto.genre);
      console.log('🔍 [CONTROLLER] createReadyProduct - Genre est-il défini?', !!productDto.genre);
      console.log('🔍 [CONTROLLER] createReadyProduct - Genre est-il HOMME?', productDto.genre === 'HOMME');
      console.log('🔍 [CONTROLLER] createReadyProduct - Genre est-il FEMME?', productDto.genre === 'FEMME');
      console.log('🔍 [CONTROLLER] createReadyProduct - Genre est-il BEBE?', productDto.genre === 'BEBE');
      console.log('🔍 [CONTROLLER] createReadyProduct - Genre est-il UNISEXE?', productDto.genre === 'UNISEXE');
      console.log('🔍 [CONTROLLER] createReadyProduct - Type de genre:', typeof productDto.genre);
      
      // ✅ VÉRIFICATION CRITIQUE
      if (productDto.isReadyProduct === true) {
        console.log('✅ Produit prêt détecté - isReadyProduct = true');
      } else {
        console.log('❌ Produit mockup - isReadyProduct = false ou undefined');
      }
      
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      throw new BadRequestException('Invalid JSON in productData.');
    }

    return this.productService.createReadyProduct(productDto, files);
  }

  @Get('ready')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all ready products (admin only)' })
  @ApiQuery({ name: 'status', required: false, enum: ['published', 'draft', 'all'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of ready products.' })
  async getReadyProducts(
    @Query('status') status?: 'published' | 'draft' | 'all',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search') search?: string,
    @Req() req?: any
  ) {
    // Vérifier que l'utilisateur est admin ou superadmin
    if (!['ADMIN', 'SUPERADMIN'].includes(req?.user?.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent accéder aux produits prêts.');
    }

    return this.productService.getReadyProducts({
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      search,
    });
  }

  @Get('ready/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a specific ready product (admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Ready product details.' })
  @ApiResponse({ status: 404, description: 'Ready product not found.' })
  async getReadyProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    // Vérifier que l'utilisateur est admin ou superadmin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent accéder aux produits prêts.');
    }

    return this.productService.getReadyProduct(id);
  }

  @Patch('ready/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a ready product (admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor())
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productData: {
          type: 'string',
          description: 'A JSON string of the ready product data to update.',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Ready product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Ready product not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async updateReadyProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body('productData') productDataString: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any
  ) {
    // ✅ LOGS DE DÉBOGAGE
    console.log('🔍 updateReadyProduct - Request body:', req.body);
    console.log('🔍 updateReadyProduct - productDataString:', productDataString);
    console.log('🔍 updateReadyProduct - Files count:', files?.length || 0);

    // Vérifier que l'utilisateur est admin ou superadmin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent modifier les produits prêts.');
    }

    if (!productDataString) {
      throw new BadRequestException('productData is required.');
    }
    
    let productDto: any;
    try {
      productDto = JSON.parse(productDataString);
      
      // ✅ LOGS DE DÉBOGAGE APRÈS PARSING
      console.log('🔍 updateReadyProduct - Parsed productDto:', JSON.stringify(productDto, null, 2));
      console.log('🔍 updateReadyProduct - isReadyProduct:', productDto.isReadyProduct);
      console.log('🔍 updateReadyProduct - Type isReadyProduct:', typeof productDto.isReadyProduct);
      
      // ✅ VÉRIFICATION CRITIQUE
      if (productDto.isReadyProduct === true) {
        console.log('✅ Produit prêt détecté - isReadyProduct = true');
      } else {
        console.log('❌ Produit mockup - isReadyProduct = false ou undefined');
      }
      
    } catch (error) {
      console.error('❌ Erreur parsing JSON:', error);
      throw new BadRequestException('Invalid JSON in productData.');
    }

    return this.productService.updateReadyProduct(id, productDto, files);
  }

  @Delete('ready/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a ready product (admin only)' })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 204, description: 'Ready product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Ready product not found.' })
  async deleteReadyProduct(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    // Vérifier que l'utilisateur est admin ou superadmin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent supprimer les produits prêts.');
    }

    await this.productService.deleteReadyProduct(id);
  }

  // Endpoint de test simple
  @Get('ready/test')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Test endpoint for ready products' })
  @ApiResponse({ status: 200, description: 'Test successful.' })
  async testReadyProducts(@Req() req: any) {
    // Vérifier que l'utilisateur est admin ou superadmin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent accéder aux produits prêts.');
    }

    return {
      success: true,
      message: 'Test endpoint working',
      user: {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email
      },
      timestamp: new Date().toISOString()
    };
  }

  // Endpoint de test très simple (sans service)
  @Get('ready/simple-test')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Very simple test endpoint' })
  @ApiResponse({ status: 200, description: 'Simple test successful.' })
  async simpleTest(@Req() req: any) {
    try {
      // Vérifier que l'utilisateur est admin ou superadmin
      if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
        return {
          success: false,
          error: 'Seuls les administrateurs peuvent accéder aux produits prêts.',
          userRole: req.user.role
        };
      }

      return {
        success: true,
        message: 'Simple test endpoint working',
        user: {
          id: req.user.id,
          role: req.user.role,
          email: req.user.email
        },
        timestamp: new Date().toISOString(),
        serverStatus: 'OK'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Endpoint de test ultra-simple (sans authentification)
  @Get('ready/ultra-test')
  @ApiOperation({ summary: 'Ultra simple test endpoint - no auth' })
  @ApiResponse({ status: 200, description: 'Ultra simple test successful.' })
  async ultraTest() {
    return {
      success: true,
      message: 'Ultra simple test endpoint working',
      timestamp: new Date().toISOString(),
      serverStatus: 'OK',
      endpoints: {
        simple: '/products/ready/simple-test',
        test: '/products/ready/test',
        list: '/products/ready'
      },
      port: '3004',
      note: 'This endpoint works without any dependencies'
    };
  }

  // Endpoint de test pour le port 3004
  @Get('ready/port-test')
  @ApiOperation({ summary: 'Test endpoint for port 3004' })
  @ApiResponse({ status: 200, description: 'Port test successful.' })
  async portTest() {
    return {
      success: true,
      message: 'Port 3004 test endpoint working',
      timestamp: new Date().toISOString(),
      port: '3004',
      server: 'Backend API',
      status: 'Running'
    };
  }

  // Endpoint de test ultra-simple sans dépendances
  @Get('ready/basic-test')
  @ApiOperation({ summary: 'Basic test endpoint - no dependencies' })
  @ApiResponse({ status: 200, description: 'Basic test successful.' })
  async basicTest() {
    try {
      return {
        success: true,
        message: 'Basic test endpoint working',
        timestamp: new Date().toISOString(),
        port: '3004',
        server: 'Backend API',
        status: 'Running',
        note: 'No service dependencies'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // =========================
  // Admin: Mise à jour des catégories d'un produit (mockup)
  // =========================
  @Patch('admin/:id/category')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Admin: Mettre à jour les catégories d’un produit (catégorie, sous-catégorie, variation)' })
  @ApiParam({ name: 'id', description: 'ID du produit' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        categoryId: { type: 'number', nullable: true },
        subCategoryId: { type: 'number', nullable: true },
        variationId: { type: 'number', nullable: true }
      }
    }
  })
  async updateProductCategoriesAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { categoryId?: number | null; subCategoryId?: number | null; variationId?: number | null },
    @Req() req: any
  ) {
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent modifier les catégories d’un produit');
    }
    return (this.productService as any).updateProductCategoriesAdmin(id, body);
  }

  @Get('filters/categories')
  @ApiOperation({ summary: 'Récupérer toutes les catégories disponibles' })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des catégories',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        categories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'T-shirts' },
              productCount: { type: 'number', example: 25 }
            }
          }
        }
      }
    }
  })
  async getCategories() {
    return this.productService.getAvailableCategories();
  }

  @Get('filters/genres')
  @ApiOperation({ summary: 'Récupérer tous les genres disponibles avec compteurs' })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des genres avec nombres de produits',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        genres: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              genre: { type: 'string', example: 'HOMME' },
              count: { type: 'number', example: 15 },
              label: { type: 'string', example: 'Homme' }
            }
          }
        },
        total: { type: 'number', example: 50 }
      }
    }
  })
  async getGenres() {
    return this.productService.getAvailableGenres();
  }

  @Get('filters/stats')
  @ApiOperation({ summary: 'Récupérer les statistiques de filtrage' })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques pour les filtres',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        stats: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 100 },
            byStatus: {
              type: 'object',
              properties: {
                PUBLISHED: { type: 'number', example: 75 },
                DRAFT: { type: 'number', example: 25 }
              }
            },
            byType: {
              type: 'object',
              properties: {
                mockups: { type: 'number', example: 60 },
                readyProducts: { type: 'number', example: 40 }
              }
            },
            byGenre: {
              type: 'object',
              properties: {
                HOMME: { type: 'number', example: 30 },
                FEMME: { type: 'number', example: 25 },
                BEBE: { type: 'number', example: 15 },
                UNISEXE: { type: 'number', example: 30 }
              }
            }
          }
        }
      }
    }
  })
  async getFilterStats() {
    return this.productService.getFilterStats();
  }

  // ==========================================
  // 📦 ENDPOINTS GESTION DES STOCKS
  // ==========================================

  @Post(':productId/stocks')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Créer ou mettre à jour les stocks d\'un produit' })
  @ApiParam({ name: 'productId', type: 'number', description: 'ID du produit' })
  @ApiBody({ type: UpdateStocksDto })
  @ApiResponse({
    status: 200,
    description: 'Stocks mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Stocks mis à jour avec succès' },
        data: {
          type: 'object',
          properties: {
            productId: { type: 'number', example: 123 },
            totalStockUpdated: { type: 'number', example: 3 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async updateProductStocks(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateStocksDto: UpdateStocksDto
  ) {
    return this.productService.updateProductStocks(productId, updateStocksDto);
  }

  @Get(':productId/stocks')
  @ApiOperation({ summary: 'Récupérer tous les stocks d\'un produit' })
  @ApiParam({ name: 'productId', type: 'number', description: 'ID du produit' })
  @ApiResponse({
    status: 200,
    description: 'Stocks récupérés avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            productId: { type: 'number', example: 123 },
            stocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  colorId: { type: 'number', example: 1 },
                  colorName: { type: 'string', example: 'Blanc' },
                  sizeName: { type: 'string', example: 'M' },
                  stock: { type: 'number', example: 25 }
                }
              }
            }
          }
        }
      }
    }
  })
  async getProductStocks(@Param('productId', ParseIntPipe) productId: number) {
    return this.productService.getProductStocks(productId);
  }

  @Patch(':productId/stocks/:stockId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mettre à jour un stock spécifique' })
  @ApiParam({ name: 'productId', type: 'number', description: 'ID du produit' })
  @ApiParam({ name: 'stockId', type: 'number', description: 'ID du stock' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        stock: { type: 'number', example: 50, minimum: 0 }
      },
      required: ['stock']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Stock mis à jour avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Stock mis à jour avec succès' },
        data: {
          type: 'object',
          properties: {
            stockId: { type: 'number', example: 1 },
            previousStock: { type: 'number', example: 30 },
            newStock: { type: 'number', example: 50 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Stock non trouvé' })
  async updateSingleStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('stockId', ParseIntPipe) stockId: number,
    @Body('stock', ParseIntPipe) stock: number
  ) {
    return this.productService.updateSingleStock(productId, stockId, stock);
  }

  @Post(':productId/stocks/:stockId/recharge')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Recharger le stock (ajouter au stock existant)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'ID du produit' })
  @ApiParam({ name: 'stockId', type: 'number', description: 'ID du stock' })
  @ApiBody({ type: RechargeStockDto })
  @ApiResponse({
    status: 200,
    description: 'Stock rechargé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Stock rechargé avec succès' },
        data: {
          type: 'object',
          properties: {
            previousStock: { type: 'number', example: 30 },
            addedAmount: { type: 'number', example: 20 },
            newStock: { type: 'number', example: 50 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Stock non trouvé' })
  async rechargeStock(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('stockId', ParseIntPipe) stockId: number,
    @Body() rechargeDto: RechargeStockDto
  ) {
    return this.productService.rechargeStock(productId, stockId, rechargeDto);
  }

  @Post(':productId/stocks/movement')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Enregistrer un mouvement de stock (entrée ou sortie)' })
  @ApiParam({ name: 'productId', type: 'number', description: 'ID du produit' })
  @ApiBody({ type: CreateStockMovementDto })
  @ApiResponse({
    status: 200,
    description: 'Mouvement de stock enregistré',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Mouvement de stock enregistré' },
        data: {
          type: 'object',
          properties: {
            movement: {
              type: 'object',
              properties: {
                id: { type: 'number', example: 123 },
                productId: { type: 'number', example: 45 },
                colorId: { type: 'number', example: 15 },
                sizeName: { type: 'string', example: 'M' },
                type: { type: 'string', enum: ['IN', 'OUT'], example: 'IN' },
                quantity: { type: 'number', example: 50 },
                reason: { type: 'string', example: 'Réception fournisseur XYZ' },
                createdAt: { type: 'string', format: 'date-time' }
              }
            },
            newStock: { type: 'number', example: 150 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation échouée' })
  @ApiResponse({ status: 404, description: 'Produit ou couleur introuvable' })
  @ApiResponse({ status: 409, description: 'Stock insuffisant pour une sortie' })
  async createStockMovement(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: CreateStockMovementDto,
    @Req() req: RequestWithUser
  ) {
    const userId = req.user.sub;
    return this.productService.createStockMovement(productId, dto, userId);
  }

  @Get(':productId/stocks/history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer l\'historique des mouvements de stock' })
  @ApiParam({ name: 'productId', type: 'number', description: 'ID du produit' })
  @ApiQuery({ name: 'colorId', required: false, type: 'number', description: 'Filtrer par ID de couleur' })
  @ApiQuery({ name: 'sizeName', required: false, type: 'string', description: 'Filtrer par taille' })
  @ApiQuery({ name: 'type', required: false, enum: ['IN', 'OUT'], description: 'Filtrer par type de mouvement' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre d\'éléments par page (défaut: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Décalage pour la pagination (défaut: 0)' })
  @ApiResponse({
    status: 200,
    description: 'Historique des mouvements récupéré',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            movements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 125 },
                  productId: { type: 'number', example: 45 },
                  productName: { type: 'string', example: 'T-shirt Premium' },
                  colorId: { type: 'number', example: 15 },
                  colorName: { type: 'string', example: 'Bleu Marine' },
                  sizeName: { type: 'string', example: 'M' },
                  type: { type: 'string', enum: ['IN', 'OUT'], example: 'IN' },
                  quantity: { type: 'number', example: 50 },
                  reason: { type: 'string', example: 'Réception fournisseur XYZ' },
                  createdAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string', example: 'Admin' }
                }
              }
            },
            total: { type: 'number', example: 47 },
            limit: { type: 'number', example: 20 },
            offset: { type: 'number', example: 0 }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Produit introuvable' })
  async getStockHistory(
    @Param('productId', ParseIntPipe) productId: number,
    @Query() query: StockHistoryQueryDto
  ) {
    return this.productService.getStockHistory(productId, query);
  }
}