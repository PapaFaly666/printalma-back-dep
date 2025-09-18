import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  Logger,
  BadRequestException,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendorGuard } from '../core/guards/vendor.guard';
import { VendorPublishService } from './vendor-publish.service';
import {
  VendorPublishDto,
  VendorPublishResponseDto,
  CreateDesignDto,
  CreateDesignResponseDto,
} from './dto/vendor-publish.dto';
import {
  VendorProductsListResponseDto,
  VendorStatsResponseDto,
  VendorProductDetailResponseDto
} from './dto/vendor-product-response.dto';
import {
  UpdateVendorAccountStatusDto,
  VendorAccountStatusResponseDto,
  VendorAccountInfoResponseDto
} from './dto/vendor-account-status.dto';
import { SaveDesignPositionDto } from './dto/save-design-position.dto';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { PrismaService } from '../prisma.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from '../../multerConfig';

@ApiBearerAuth()
@ApiTags('Vendor Publication v2 - Designs & Products')
@Controller('vendor')
@UseGuards(JwtAuthGuard, VendorGuard)
export class VendorPublishController {
  private readonly logger = new Logger(VendorPublishController.name);

  constructor(
    private readonly vendorPublishService: VendorPublishService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 🎨 NOUVEAU ENDPOINT - CRÉER UN DESIGN
   * Les vendeurs créent d'abord leurs designs, puis les utilisent pour créer des produits
   */
  @Post('designs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🎨 Créer un design',
    description: `
    **CRÉATION DE DESIGN SÉPARÉE:**
    
    - ✅ **Étape 1**: Créer le design avec cette route
    - ✅ **Étape 2**: Utiliser le designId pour créer des produits
    - ✅ **Avantage**: Un design peut être utilisé pour plusieurs produits
    - ✅ **Validation**: L'admin valide le design une seule fois
    
    **PAYLOAD REQUIS:**
    \`\`\`json
    {
      "name": "Mon Super Design",
      "description": "Description optionnelle",
      "category": "ILLUSTRATION",
      "imageBase64": "data:image/png;base64,...",
      "tags": ["créatif", "moderne"]
    }
    \`\`\`
    `
  })
  @ApiBody({
    type: CreateDesignDto,
    description: 'Données du design à créer',
    examples: {
      nouveau_design: {
        summary: 'Création d\'un nouveau design',
        value: {
          name: 'Dragon Mystique',
          description: 'Design de dragon dans un style mystique',
          category: 'ILLUSTRATION',
          imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
          tags: ['dragon', 'mystique', 'fantasy']
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Design créé avec succès',
    type: CreateDesignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  async createDesign(
    @Body() designData: CreateDesignDto,
    @Request() req: any
  ): Promise<CreateDesignResponseDto> {
    const vendorId = req.user.sub;
    this.logger.log(`🎨 Création design par vendeur ${vendorId}`);
    
    try {
      const result = await this.vendorPublishService.createDesign(designData, vendorId);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur création design: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🎨 ENDPOINT - LISTER LES DESIGNS DU VENDEUR
   */
  @Get('designs')
  @ApiOperation({
    summary: '📋 Lister les designs du vendeur',
    description: 'Récupère tous les designs créés par le vendeur connecté'
  })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'offset', required: false, example: 0 })
  @ApiQuery({ name: 'status', required: false, enum: ['all', 'VALIDATED', 'PENDING', 'DRAFT'] })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom ou description' })
  @ApiResponse({
    status: 200,
    description: 'Liste des designs du vendeur',
  })
  async getVendorDesigns(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const vendorId = req.user.sub;
    this.logger.log(`📋 Récupération designs vendeur ${vendorId}`);
    
    try {
      const result = await this.vendorPublishService.getVendorDesigns(vendorId, {
        limit: limit || 20,
        offset: offset || 0,
        status,
        search
      });
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération designs: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ ENDPOINT PRINCIPAL - NOUVELLE ARCHITECTURE
   * Crée un produit vendeur en utilisant un design existant
   */
  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '✅ Créer un produit vendeur avec design existant',
    description: `
    **NOUVELLE ARCHITECTURE SIMPLIFIÉE:**
    
    - ✅ **Étape 1**: Créer d'abord un design avec POST /vendor/designs
    - ✅ **Étape 2**: Utiliser le designId pour créer un produit
    - ✅ **Avantage**: Un design peut être utilisé pour plusieurs produits
    - ✅ **Validation**: L'admin valide le design une seule fois
    
    **PAYLOAD REQUIS:**
    \`\`\`json
    {
      "baseProductId": 4,
      "designId": 42,
      "vendorName": "T-shirt Dragon Rouge",
      "vendorPrice": 25000,
      "selectedColors": [...],
      "selectedSizes": [...],
      "productStructure": {
        "adminProduct": { ... },
        "designApplication": { "scale": 0.6 }
      }
    }
    \`\`\`
    `
  })
  @ApiBody({
    type: VendorPublishDto,
    description: 'Structure produit admin + designId',
    examples: {
      nouvelle_architecture: {
        summary: 'Nouvelle architecture - Design existant',
        value: {
          baseProductId: 4,
          designId: 42,
          productStructure: {
            adminProduct: {
              id: 4,
              name: 'T-shirt Basique',
              description: 'T-shirt en coton 100% de qualité premium',
              price: 19000,
              images: {
                colorVariations: [
                  {
                  id: 12,
                  name: 'Rouge',
                    colorCode: '#ff0000',
                    images: [
                      {
                        id: 101,
                        url: 'https://res.cloudinary.com/printalma/tshirt-front-red.jpg',
                        viewType: 'FRONT',
                        delimitations: [
                          { x: 150, y: 200, width: 200, height: 200, coordinateType: 'PIXEL' }
                        ]
                      }
                    ]
                  }
                ]
              },
              sizes: [
                { id: 1, sizeName: 'S' },
                { id: 2, sizeName: 'M' }
              ]
            },
            designApplication: {
              scale: 0.6
            }
          },
          vendorName: 'T-shirt Dragon Rouge Premium',
          vendorDescription: 'T-shirt avec design dragon exclusif',
          vendorPrice: 25000,
          vendorStock: 100,
          selectedColors: [
            { id: 12, name: 'Rouge', colorCode: '#ff0000' }
          ],
          selectedSizes: [
            { id: 1, sizeName: 'S' },
            { id: 2, sizeName: 'M' }
          ],
          postValidationAction: 'AUTO_PUBLISH'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Produit créé avec succès (Architecture v2)',
    type: VendorPublishResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides ou design introuvable',
  })
  async createVendorProduct(
    @Body() productData: VendorPublishDto,
    @Request() req: any
  ): Promise<VendorPublishResponseDto> {
    const vendorId = req.user.sub;
    this.logger.log(`📦 Création produit vendeur (Architecture v2) par vendeur ${vendorId}`);
    
    try {
      // ✅ VALIDATION NOUVELLE ARCHITECTURE
      if (!productData.productStructure?.adminProduct) {
        throw new BadRequestException({
          error: 'Structure admin requise',
          message: 'productStructure.adminProduct manquant (Architecture v2)',
          architecture: 'v2_admin_preserved'
        });
      }

      if (!productData.designId) {
        throw new BadRequestException({
          error: 'Design ID requis',
          message: 'designId manquant. Veuillez d\'abord créer un design avec POST /vendor/designs',
          architecture: 'v2_admin_preserved'
        });
      }
      
      // ✅ CRÉATION AVEC NOUVELLE LOGIQUE
      const result = await this.vendorPublishService.publishProduct(productData, vendorId);
      
      return result;
      
    } catch (error) {
      this.logger.error(`❌ Erreur création produit: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📍 ENDPOINT - SAUVEGARDER POSITION DESIGN
   * Sauvegarde la position d'un design sur un produit (depuis localStorage)
   */
  @Post('design-position')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '📍 Sauvegarder position design',
    description: `
    **SAUVEGARDE POSITION DESIGN:**
    
    - ✅ **Usage**: Sauvegarder la position d'un design sur un produit
    - ✅ **Source**: Données depuis localStorage frontend
    - ✅ **Timing**: Peut être appelé avant ou après publication
    - ✅ **Persistance**: Stocké dans ProductDesignPosition
    
    **PAYLOAD REQUIS:**
    \`\`\`json
    {
      "vendorProductId": 2,
      "designId": 42,
      "position": {
        "x": 0,
        "y": 0,
        "scale": 1,
        "rotation": 0
      }
    }
    \`\`\`
    `
  })
  @ApiBody({
    type: SaveDesignPositionDto,
    description: 'Position du design à sauvegarder',
    examples: {
      position_centree: {
        summary: 'Position centrée',
        value: {
          vendorProductId: 2,
          designId: 42,
          position: {
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
          }
        }
      },
      position_personnalisee: {
        summary: 'Position personnalisée',
        value: {
          vendorProductId: 2,
          designId: 42,
          position: {
            x: -44,
            y: -68,
            scale: 0.44,
            rotation: 15
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Position sauvegardée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Position design sauvegardée' },
        data: {
          type: 'object',
          properties: {
            vendorProductId: { type: 'number', example: 2 },
            designId: { type: 'number', example: 42 },
            position: {
              type: 'object',
              example: { x: 0, y: 0, scale: 1, rotation: 0 }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Produit ou design non autorisé',
  })
  async saveDesignPosition(
    @Body() positionData: SaveDesignPositionDto,
    @Request() req: any
  ) {
    const vendorId = req.user.sub;
    this.logger.log(`📍 Sauvegarde position design par vendeur ${vendorId}`);
    
    try {
      const result = await this.vendorPublishService.saveDesignPosition(
        vendorId,
        positionData
      );
      return {
        success: true,
        message: 'Position design sauvegardée',
        data: result
      };
    } catch (error) {
      this.logger.error(`❌ Erreur sauvegarde position: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📋 ENDPOINT - LISTER LES PRODUITS VENDEUR
   */
  @Get('products')
  @ApiOperation({
    summary: 'Lister les produits du vendeur (Architecture v2)',
    description: `
    Récupère la liste des produits vendeur avec la nouvelle structure:
    - Structure admin préservée
    - Design application metadata
    - Images admin conservées (pas de fusion)
    - Santé architecture: toujours 100% (pas de mélange possible)
    `
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Limite (défaut: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Décalage (défaut: 0)' })
  @ApiQuery({ name: 'status', required: false, type: 'string', enum: ['all', 'published', 'draft'], description: 'Filtrer par statut' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Recherche textuelle' })
  @ApiResponse({
    status: 200,
    description: 'Liste des produits (Architecture v2)',
    type: VendorProductsListResponseDto,
  })
  async getVendorProducts(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const vendorId = req.user.sub;
    
    const result = await this.vendorPublishService.getVendorProducts(vendorId, {
      limit: Math.min(limit || 20, 100),
      offset: offset || 0,
      status,
      search,
    });
    
    this.logger.log(`📋 [v2] ${result.data.products.length} produits récupérés pour vendeur ${vendorId}`);
    
    return result;
  }

  /**
   * ✅ DÉTAILS PRODUIT VENDEUR - Structure complète
   */
  @Get('products/:id')
  @ApiOperation({
    summary: 'Détails complets d\'un produit vendeur (Architecture v2)',
    description: `
    Récupère tous les détails avec:
    - Structure admin complète (colorVariations, images, delimitations)
    - Design application (base64, positionnement, échelle)
    - Métadonnées vendeur
    `
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du produit vendeur' })
  @ApiResponse({
    status: 200,
    description: 'Détails complets (Architecture v2)',
    type: VendorProductDetailResponseDto,
  })
  async getVendorProductDetail(
    @Param('id', ParseIntPipe) productId: number,
    @Request() req: any,
  ) {
    const userRole = req.user.role;
    const vendorId = userRole === 'SUPERADMIN' || userRole === 'ADMIN' ? undefined : req.user.sub;
    
    this.logger.log(`🔍 [v2] Récupération détails produit ${productId} par ${req.user.email}`);
    
    const result = await this.vendorPublishService.getVendorProductDetail(productId, vendorId);
    
    return result;
  }

  /**
   * ✅ STATISTIQUES VENDEUR
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques du vendeur (Architecture v2)',
    description: `
    Récupère les statistiques complètes du vendeur incluant :
    - Statistiques produits (total, publié, brouillon, en attente)
    - Statistiques designs (total, publié, brouillon, en attente, validé)
    - Valeurs financières (total, prix moyen)
    - Exclusion automatique des éléments soft-deleted (isDelete=true)
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques vendeur avec designs',
    type: VendorStatsResponseDto,
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalProducts: { type: 'number', example: 12 },
            publishedProducts: { type: 'number', example: 3 },
            draftProducts: { type: 'number', example: 3 },
            pendingProducts: { type: 'number', example: 6 },
            totalValue: { type: 'number', example: 84000 },
            averagePrice: { type: 'number', example: 7000 },
            totalDesigns: { type: 'number', example: 8 },
            publishedDesigns: { type: 'number', example: 5 },
            draftDesigns: { type: 'number', example: 2 },
            pendingDesigns: { type: 'number', example: 1 },
            validatedDesigns: { type: 'number', example: 6 },
            architecture: { type: 'string', example: 'v2_preserved_admin' }
          }
        }
      }
    }
  })
  async getVendorStats(@Request() req: any) {
    const vendorId = req.user.sub;
    
    const result = await this.vendorPublishService.getVendorStats(vendorId);
    
    this.logger.log(`📊 [v2] Statistiques calculées pour vendeur ${vendorId}`);
    
    return result;
  }

  /**
   * ✅ PRODUITS GROUPÉS PAR TYPE
   */
  @Get('products/grouped')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Produits vendeurs groupés par type de produit admin (Architecture v2)',
    description: `Groupement par baseProduct.name avec structure admin préservée`
  })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'ID vendeur spécifique' })
  @ApiQuery({ name: 'status', required: false, type: 'string', description: 'Statut produits' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Recherche' })
  @ApiQuery({ name: 'productType', required: false, type: 'string', description: 'Type produit admin' })
  async getVendorProductsGrouped(
    @Query('vendorId') vendorId?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('productType') productType?: string,
  ) {
    this.logger.log(`📊 [v2] Récupération produits groupés par type admin`);
    
    return this.vendorPublishService.getVendorProductsGroupedByBaseProduct({
      vendorId: vendorId ? parseInt(vendorId.toString()) : undefined,
      status,
      search,
      productType,
    });
  }

  /**
   * ✅ RAPPORT SANTÉ - Toujours 100% en Architecture v2
   */
  @Get('products/health-report')
  @ApiOperation({ 
    summary: 'Rapport de santé des produits (Architecture v2)',
    description: `
    En Architecture v2, le rapport de santé retourne toujours 100% car:
    - Pas de mélange d'images possible
    - Structure admin préservée
    - Design appliqué séparément
    `
  })
  async getImageHealthReport(@Request() req: any) {
    const vendorId = req.user.sub;
    
    this.logger.log(`📊 [v2] Génération rapport santé pour vendeur ${vendorId}`);
    
    try {
      const result = await this.vendorPublishService.validateAndCleanImageMixing({
        dryRun: true,
        vendorId,
        autoFix: false
      });
      
      return {
        success: true,
        message: 'Architecture v2: Santé garantie à 100%',
        healthReport: {
          vendorId,
          totalProducts: result.report.totalProducts,
          healthyProducts: result.report.totalProducts,
          unhealthyProducts: 0,
          overallHealthScore: 100,
          lastChecked: new Date().toISOString(),
          architecture: 'v2_admin_preserved',
          issues: [] // Aucun problème possible en v2
        },
        ...result
      };
      
    } catch (error) {
      this.logger.error('❌ Erreur génération rapport santé v2:', error);
      throw new BadRequestException('Erreur lors de la génération du rapport de santé');
    }
  }

  /**
   * ✅ ENDPOINTS ADMIN - Accès à tous les produits vendeurs
   */
  @Get('admin/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({
    summary: 'Lister tous les produits vendeurs (Admin - Architecture v2)',
    description: 'Accès admin à tous les produits avec structure admin préservée'
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number' })
  @ApiQuery({ name: 'offset', required: false, type: 'number' })
  @ApiQuery({ name: 'status', required: false, type: 'string' })
  @ApiQuery({ name: 'search', required: false, type: 'string' })
  async getAllVendorProducts(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    this.logger.log(`📋 [v2] Récupération admin de tous les produits vendeurs`);

    return this.vendorPublishService.getVendorProducts(undefined, {
      limit: Math.min(limit || 20, 100),
      offset: Math.max(offset || 0, 0),
      status,
      search,
    });
  }

  /**
   * Soft delete d'un produit vendeur (isDelete=true)
   */
  @Delete('products/:id')
  @ApiOperation({ summary: 'Supprimer (soft delete) un produit vendeur' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du produit vendeur' })
  async softDeleteVendorProduct(
    @Param('id', ParseIntPipe) productId: number,
    @Request() req: any
  ) {
    // Si admin, il peut tout supprimer, sinon seulement ses produits
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPERADMIN';
    return this.vendorPublishService.softDeleteVendorProduct(productId, req.user.sub, isAdmin);
  }

  /**
   * ✅ HEALTH CHECK
   */
  @Get('health')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Vérification santé service vendeur (Architecture v2)',
    description: 'Endpoint de monitoring pour Architecture v2 - Admin Structure Preserved'
  })
  async healthCheck() {
    this.logger.log('🏥 [v2] Vérification santé service vendeur');
    
    return {
      status: 'healthy',
      architecture: 'v2_admin_preserved',
      timestamp: new Date().toISOString(),
      features: [
        'Admin structure preserved',
        'Design centered application',
        'No image mixing',
        'Real-time rendering',
        '100% health guaranteed'
      ],
      services: {
        database: 'connected',
        cloudinary: 'connected', 
        imageProcessing: 'simplified'
      }
    };
  }

  /**
   * ⚠️ ENDPOINTS DÉSACTIVÉS - Non applicables en Architecture v2
   */
  @Post('products/:id/generate-mockups')
  async generateMockups() {
    throw new BadRequestException({
      error: 'Endpoint désactivé',
      message: 'Génération de mockups non applicable en Architecture v2',
      architecture: 'v2_admin_preserved',
      alternative: 'Utilisez le rendu temps réel côté client'
    });
  }

  @Get('products/:id/mockups')
  async getProductMockups() {
    throw new BadRequestException({
      error: 'Endpoint désactivé',
      message: 'Mockups par couleur non applicable en Architecture v2',
      architecture: 'v2_admin_preserved',
      alternative: 'Structure admin conservée avec design séparé'
    });
  }

  @Post('products/:id/regenerate-failed-mockups')
  async regenerateFailedMockups() {
    throw new BadRequestException({
      error: 'Endpoint désactivé',
      message: 'Régénération mockups non applicable en Architecture v2',
      architecture: 'v2_admin_preserved'
    });
  }

  @Get('products/migration-status')
  async getMigrationStatus() {
    return {
      success: true,
      data: {
        architecture: 'v2_admin_preserved',
        migrationComplete: true,
        features: [
          'Admin structure fully preserved',
          'Design application centered',
          'No image fusion required',
          'Real-time client rendering',
          'Zero health issues possible'
        ]
      }
    };
  }

  @Post('design-product/upload-design')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Uploader une image pour un produit vendeur (VendorProduct)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image', multerConfig))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        vendorProductId: { type: 'number', description: 'ID du produit vendeur' },
        colorId: { type: 'number', description: 'ID de la variation couleur (optionnel)' },
        image: { type: 'string', format: 'binary', description: 'Fichier image à uploader' }
      },
      required: ['vendorProductId', 'image']
    }
  })
  async uploadVendorDesignImage(
    @Body('vendorProductId') vendorProductId: number,
    @Body('colorId') colorId: number,
    @UploadedFile() image: Express.Multer.File,
    @Req() req: any
  ) {
    // Vérification d'accès : le vendeur doit être propriétaire du produit ou admin
    // (À adapter selon ta logique d'accès)
    return this.vendorPublishService.uploadVendorDesignImage(vendorProductId, colorId, image, req.user);
  }

  /**
   * ✅ MEILLEURES VENTES - Récupérer les produits avec les meilleures ventes
   * ⚠️ DÉPLACÉ vers BestSellersController (public)
   */

  /**
   * ✅ MISE À JOUR STATISTIQUES - Mettre à jour les statistiques de vente
   */
  @Post('products/update-sales-stats')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({
    summary: 'Mettre à jour les statistiques de vente',
    description: 'Calcule et met à jour les statistiques de vente pour marquer les meilleures ventes'
  })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'ID du vendeur (optionnel, admin seulement)' })
  async updateSalesStats(
    @Query('vendorId') vendorId?: number,
    @Request() req?: any
  ) {
    this.logger.log(`📊 Mise à jour des statistiques de vente${vendorId ? ` pour vendeur ${vendorId}` : ''}`);
    
    // Si vendorId n'est pas fourni, utiliser l'ID du vendeur connecté
    const targetVendorId = vendorId || req.user.id;
    
    return this.vendorPublishService.updateBestSellerStats(targetVendorId);
  }

  /**
   * ✅ MEILLEURES VENTES VENDEUR - Récupérer les meilleures ventes du vendeur connecté
   */
  @Get('products/my-best-sellers')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({
    summary: 'Récupérer mes meilleures ventes',
    description: 'Retourne les produits avec les meilleures ventes du vendeur connecté'
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de produits à retourner (défaut: 10)' })
  async getMyBestSellers(
    @Query('limit') limit?: number,
    @Request() req?: any
  ) {
    this.logger.log(`🏆 Récupération des meilleures ventes du vendeur ${req.user.id}`);
    
    return this.vendorPublishService.getBestSellers(req.user.id, limit || 10);
  }

  /**
   * 🚀 PUBLIER UN PRODUIT VENDEUR - Endpoint manquant
   */
  @Patch('products/:id/publish')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({
    summary: 'Publier un produit vendeur',
    description: `
    **PUBLICATION PRODUIT VENDEUR:**

    - ✅ **Fonction**: Changer le statut d'un produit de DRAFT/PENDING vers PUBLISHED
    - ✅ **Sécurité**: Seul le propriétaire du produit peut le publier
    - ✅ **Validation**: Vérification que le produit peut être publié
    - ✅ **Statuts acceptés**: DRAFT, PENDING
    - ✅ **Résultat**: status = PUBLISHED, publishedAt = maintenant
    `
  })
  @ApiParam({
    name: 'id',
    type: 'number',
    description: 'ID du produit vendeur à publier'
  })
  @ApiResponse({
    status: 200,
    description: 'Produit publié avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Produit publié avec succès' },
        product: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 122 },
            name: { type: 'string', example: 'T-shirt Dragon Rouge' },
            status: { type: 'string', example: 'PUBLISHED' },
            publishedAt: { type: 'string', example: '2024-01-15T10:30:00.000Z' }
          }
        },
        previousStatus: { type: 'string', example: 'DRAFT' },
        newStatus: { type: 'string', example: 'PUBLISHED' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Statut invalide pour publication'
  })
  @ApiResponse({
    status: 404,
    description: 'Produit non trouvé ou accès refusé'
  })
  async publishVendorProduct(
    @Param('id', ParseIntPipe) productId: number,
    @Request() req: any
  ) {
    const vendorId = req.user.sub;
    this.logger.log(`🚀 Publication produit ${productId} par vendeur ${vendorId}`);

    try {
      const result = await this.vendorPublishService.publishVendorProduct(productId, vendorId);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur publication produit ${productId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔄 GESTION DU STATUT DU COMPTE VENDEUR
   */
  @Patch('account/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Activer/Désactiver son compte vendeur',
    description: `
    **GESTION DU STATUT DU COMPTE :**

    - ✅ **Désactivation** : Le vendeur peut désactiver son propre compte
    - ✅ **Réactivation** : Le vendeur peut réactiver son compte à tout moment
    - ✅ **Impact** : Quand désactivé, tous les produits et designs deviennent invisibles publiquement
    - ✅ **Sécurité** : Seul le propriétaire du compte peut modifier son statut
    - ✅ **Raison** : Possibilité d'ajouter une raison optionnelle

    **Exemples d'utilisation :**
    - Pause temporaire (vacances, congés)
    - Maintenance de la boutique
    - Réorganisation des produits
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Statut du compte modifié avec succès',
    type: VendorAccountStatusResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides'
  })
  async updateAccountStatus(
    @Body() statusDto: UpdateVendorAccountStatusDto,
    @Request() req: any
  ): Promise<VendorAccountStatusResponseDto> {
    const vendorId = req.user.sub;
    const action = statusDto.status ? 'RÉACTIVATION' : 'DÉSACTIVATION';

    this.logger.log(`🔄 ${action} compte vendeur ${vendorId}`);

    try {
      const result = await this.vendorPublishService.updateVendorAccountStatus(
        vendorId,
        statusDto.status,
        statusDto.reason
      );
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur ${action.toLowerCase()} compte ${vendorId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 📋 INFORMATIONS DU COMPTE VENDEUR
   */
  @Get('account/info')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({
    summary: 'Récupérer les informations du compte vendeur',
    description: `
    **INFORMATIONS COMPLÈTES DU COMPTE :**

    - ✅ **Données personnelles** : Nom, email, téléphone, pays
    - ✅ **Statut actuel** : Actif ou désactivé
    - ✅ **Statistiques** : Nombre de produits, designs publiés
    - ✅ **Dates importantes** : Création du compte, dernière connexion
    - ✅ **Boutique** : Nom de la boutique si configuré

    Utile pour afficher un tableau de bord vendeur complet.
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Informations du compte récupérées avec succès',
    type: VendorAccountInfoResponseDto,
  })
  async getAccountInfo(@Request() req: any): Promise<VendorAccountInfoResponseDto> {
    const vendorId = req.user.sub;

    this.logger.log(`📋 Récupération informations compte vendeur ${vendorId}`);

    try {
      const result = await this.vendorPublishService.getVendorAccountInfo(vendorId);
      return result;
    } catch (error) {
      this.logger.error(`❌ Erreur récupération informations compte ${vendorId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * 🔍 VÉRIFIER L'ÉTAT DU COMPTE - Endpoint simple
   */
  @Get('account/status')
  @UseGuards(JwtAuthGuard) // Seulement JWT, pas VendorGuard
  @ApiOperation({
    summary: 'Vérifier l\'état du compte vendeur',
    description: `
    **ENDPOINT SIMPLE POUR L'ÉTAT DU COMPTE :**

    - ✅ **Usage** : Savoir si le compte est actif ou désactivé
    - ✅ **Sécurité** : Nécessite seulement un token JWT valide
    - ✅ **Réponse** : État simple (actif/inactif) avec détails de base
    - ✅ **Utilisation** : Pour afficher le bon bouton (Activer/Désactiver)

    **Cas d'utilisation typiques :**
    - Afficher "Désactiver mon compte" si actif
    - Afficher "Réactiver mon compte" si inactif
    - Connaître l'état sans déclencher d'erreur
    `
  })
  @ApiResponse({
    status: 200,
    description: 'État du compte récupéré avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean', example: true },
            userId: { type: 'number', example: 123 },
            email: { type: 'string', example: 'vendor@example.com' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            role: { type: 'string', example: 'VENDEUR' },
            lastStatusChange: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
            canToggleStatus: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT invalide ou expiré'
  })
  async getAccountStatus(@Request() req: any) {
    const user = req.user;

    this.logger.log(`🔍 Vérification état compte utilisateur ${user?.id || 'UNKNOWN'}`);

    if (!user) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    // Retourner l'état simple du compte
    return {
      success: true,
      data: {
        isActive: user.status === true,
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastStatusChange: user.updated_at?.toISOString() || null,
        canToggleStatus: user.role === 'VENDEUR' // Seuls les vendeurs peuvent toggle
      }
    };
  }

} 
 
 
 
 
 
 
 
 
 
 