import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { VendorProductValidationService } from './vendor-product-validation.service';
import { PrismaService } from '../prisma.service';

// DTOs spécifiques pour la validation WIZARD
class ValidateProductDto {
  approved: boolean;
  rejectionReason?: string;
}

class ValidateProductsBatchDto {
  productIds: number[];
  approved: boolean;
  rejectionReason?: string;
}

@ApiBearerAuth()
@ApiTags('Admin - Validation Produits WIZARD')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class AdminWizardValidationController {
  private readonly logger = new Logger(AdminWizardValidationController.name);

  constructor(
    private readonly validationService: VendorProductValidationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * ⭐ PRIORITÉ HAUTE - GET /api/admin/products/validation
   * Récupère les produits en attente avec distinction WIZARD/TRADITIONNEL
   */
  @Get('products/validation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🎯 Récupérer les produits en attente (WIZARD + Traditionnels)',
    description: `
    **ENDPOINT PRINCIPAL INTERFACE ADMIN:**

    - ✅ **Distinction automatique**: WIZARD vs TRADITIONNEL
    - ✅ **Filtrage**: Par type de produit, vendeur, statut
    - ✅ **Enrichissement**: Données complètes pour interface
    - ✅ **Pagination**: Configurable
    - ✅ **Statistiques**: Globales incluses

    **LOGIQUE WIZARD:**
    - isWizardProduct = !designId || designId === null
    - productType = WIZARD | TRADITIONAL
    - hasDesign = !isWizardProduct
    - adminProductName = baseProduct.name
    `
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Limite (défaut: 20)' })
  @ApiQuery({ name: 'productType', required: false, enum: ['WIZARD', 'TRADITIONAL', 'ALL'], description: 'Filtrer par type de produit' })
  @ApiQuery({ name: 'vendor', required: false, type: 'string', description: 'Filtrer par nom vendeur' })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'], description: 'Filtrer par statut' })
  @ApiResponse({
    status: 200,
    description: 'Produits en attente récupérés avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Produits récupérés avec succès' },
        data: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 138 },
                  vendorName: { type: 'string', example: 'Mon T-shirt Personnalisé' },
                  vendorDescription: { type: 'string', example: 'T-shirt avec mes propres images' },
                  vendorPrice: { type: 'number', example: 12000 },
                  status: { type: 'string', example: 'PENDING' },
                  isValidated: { type: 'boolean', example: false },
                  designCloudinaryUrl: { type: 'string', nullable: true },
                  // Nouvelles propriétés WIZARD
                  isWizardProduct: { type: 'boolean', example: true },
                  productType: { type: 'string', enum: ['WIZARD', 'TRADITIONAL'], example: 'WIZARD' },
                  hasDesign: { type: 'boolean', example: false },
                  adminProductName: { type: 'string', example: 'T-shirt Blanc Classique' },
                  baseProduct: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 34 },
                      name: { type: 'string', example: 'T-shirt Blanc Classique' }
                    }
                  },
                  vendor: {
                    type: 'object',
                    properties: {
                      id: { type: 'number', example: 7 },
                      firstName: { type: 'string', example: 'John' },
                      lastName: { type: 'string', example: 'Vendor' },
                      email: { type: 'string', example: 'john@vendor.com' },
                      shop_name: { type: 'string', example: 'Ma Boutique' }
                    }
                  },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 5 },
                totalItems: { type: 'number', example: 100 },
                itemsPerPage: { type: 'number', example: 20 }
              }
            },
            stats: {
              type: 'object',
              properties: {
                pending: { type: 'number', example: 25 },
                validated: { type: 'number', example: 150 },
                rejected: { type: 'number', example: 8 },
                total: { type: 'number', example: 183 },
                wizardProducts: { type: 'number', example: 12 },
                traditionalProducts: { type: 'number', example: 13 }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin requis' })
  async getProductsValidation(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('productType') productType?: 'WIZARD' | 'TRADITIONAL' | 'ALL',
    @Query('vendor') vendor?: string,
    @Query('status') status?: string
  ) {
    try {
      const adminId = req.user.id || req.user.sub;

      this.logger.log(`🎯 Admin ${adminId} récupère les produits en attente - Type: ${productType || 'ALL'}`);

      // Récupération des produits avec les filtres existants
      const options = {
        page: page || 1,
        limit: limit || 20,
        vendorId: undefined, // On utilisera le filtre vendor plus tard
        designUrl: undefined,
        status: status || 'PENDING'
      };

      const result = await this.validationService.getPendingProducts(adminId, options);

      // 🔧 Récupération enrichie des produits avec images pour WIZARD
      const productsWithImages = await Promise.all(
        result.products.map(async (product) => {
          const isWizardProduct = !product.designId || product.designId === null;

          let vendorImages = [];
          if (isWizardProduct) {
            // Récupérer les images du produit WIZARD
            vendorImages = await this.getVendorImages(product.id);
          }

          return {
            ...product,
            isWizardProduct,
            productType: isWizardProduct ? 'WIZARD' : 'TRADITIONAL',
            hasDesign: !isWizardProduct,
            adminProductName: product.adminProductName || product.baseProduct?.name || 'Produit de base',
            vendorImages: vendorImages
          };
        })
      );

      // Utiliser les produits enrichis avec images
      const enrichedProducts = productsWithImages;

      // 🔧 Filtrage par type de produit
      let filteredProducts = enrichedProducts;
      if (productType && productType !== 'ALL') {
        filteredProducts = enrichedProducts.filter(p => p.productType === productType);
      }

      // 🔧 Filtrage par vendeur
      if (vendor) {
        const vendorLower = vendor.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.vendor?.firstName?.toLowerCase().includes(vendorLower) ||
          p.vendor?.lastName?.toLowerCase().includes(vendorLower) ||
          p.vendor?.shop_name?.toLowerCase().includes(vendorLower) ||
          p.vendor?.email?.toLowerCase().includes(vendorLower)
        );
      }

      // 🔧 Statistiques enrichies
      const wizardCount = enrichedProducts.filter(p => p.isWizardProduct).length;
      const traditionalCount = enrichedProducts.filter(p => !p.isWizardProduct).length;

      const enrichedStats = {
        ...result.stats,
        wizardProducts: wizardCount,
        traditionalProducts: traditionalCount
      };

      // 🔧 Pagination recalculée après filtrage
      const totalFiltered = filteredProducts.length;
      const currentPage = page || 1;
      const itemsPerPage = limit || 20;
      const totalPages = Math.ceil(totalFiltered / itemsPerPage);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

      const enrichedPagination = {
        currentPage,
        totalPages,
        totalItems: totalFiltered,
        itemsPerPage,
        hasNext: currentPage < totalPages,
        hasPrevious: currentPage > 1
      };

      this.logger.log(`✅ Produits récupérés: ${paginatedProducts.length} (${wizardCount} WIZARD, ${traditionalCount} TRADITIONAL)`);

      return {
        success: true,
        message: 'Produits en attente récupérés avec succès',
        data: {
          products: paginatedProducts,
          pagination: enrichedPagination,
          stats: enrichedStats
        }
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération produits en attente:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des produits',
        data: null
      };
    }
  }

  /**
   * ⭐ PRIORITÉ HAUTE - POST /api/admin/products/{productId}/validate
   * Valide un produit individuel (WIZARD ou traditionnel)
   */
  @Post('products/:productId/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🎯 Valider un produit individuel',
    description: `
    **VALIDATION PRODUIT (WIZARD & TRADITIONNEL):**

    - ✅ **Détection automatique**: Type de produit (WIZARD/TRADITIONNEL)
    - ✅ **Validation adaptée**: Logique selon le type
    - ✅ **Logging enrichi**: Distinction dans les logs
    - ✅ **Réponse enrichie**: Informations type incluses

    **LOGIQUE:**
    - Produits WIZARD: Validation des images personnalisées
    - Produits traditionnels: Validation du design + produit
    `
  })
  @ApiParam({ name: 'productId', type: 'number', description: 'ID du produit à valider' })
  @ApiBody({
    type: ValidateProductDto,
    examples: {
      approuver: {
        summary: 'Approuver le produit',
        description: 'Valide le produit pour publication',
        value: { approved: true }
      },
      rejeter: {
        summary: 'Rejeter le produit',
        description: 'Rejette le produit avec une raison',
        value: {
          approved: false,
          rejectionReason: 'Images de mauvaise qualité'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Produit validé avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Produit WIZARD validé avec succès' },
        productId: { type: 'number', example: 123 },
        newStatus: { type: 'string', example: 'PUBLISHED', enum: ['PUBLISHED', 'REJECTED'] },
        validatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T14:30:00Z' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Données invalides ou produit déjà validé' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async validateIndividualProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: ValidateProductDto,
    @Request() req: any
  ) {
    try {
      const adminId = req.user.id || req.user.sub;

      // Validation des données
      if (typeof dto.approved !== 'boolean') {
        throw new BadRequestException('Le champ "approved" est requis et doit être un booléen');
      }

      if (!dto.approved && !dto.rejectionReason) {
        throw new BadRequestException('Une raison de rejet est obligatoire pour rejeter un produit');
      }

      this.logger.log(`🎯 Admin ${adminId} valide le produit ${productId} - Approuvé: ${dto.approved}`);

      // Appel du service de validation existant
      const result = await this.validationService.validateProduct(
        productId,
        adminId,
        dto.approved,
        dto.rejectionReason
      );

      this.logger.log(`✅ Produit ${productId} traité avec succès`);

      // 🔧 Format de réponse selon ha.md
      if (result.success && result.product) {
        const isWizardProduct = !result.product.designId || result.product.designId === null;
        const productType = isWizardProduct ? 'WIZARD' : 'TRADITIONNEL';

        return {
          success: true,
          message: `Produit ${productType} ${dto.approved ? 'validé' : 'rejeté'} avec succès`,
          productId: productId,
          newStatus: result.product.status || (dto.approved ? 'PUBLISHED' : 'REJECTED'),
          validatedAt: result.product.validatedAt || new Date().toISOString()
        };
      }

      return result;

    } catch (error) {
      this.logger.error(`❌ Erreur validation produit ${productId}:`, error);

      return {
        success: false,
        message: error.message || 'Erreur lors de la validation du produit',
        data: null
      };
    }
  }

  /**
   * 🔹 PRIORITÉ NORMALE - PATCH /admin/validate-products-batch
   * Validation en lot de plusieurs produits
   */
  @Patch('validate-products-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🎯 Valider plusieurs produits en lot',
    description: `
    **VALIDATION EN LOT:**

    - ✅ **Performance**: Traitement optimisé multiple produits
    - ✅ **Robustesse**: Gestion des erreurs individuelles
    - ✅ **Reporting**: Résumé succès/échecs
    - ✅ **Distinction**: Compteurs WIZARD vs TRADITIONNEL

    **LOGIQUE:**
    - Traitement séquentiel pour éviter les conflits
    - Collecte des erreurs individuelles
    - Statistiques finales par type de produit
    `
  })
  @ApiBody({
    type: ValidateProductsBatchDto,
    examples: {
      validation_lot: {
        summary: 'Valider un lot de produits',
        description: 'Valide plusieurs produits en une seule opération',
        value: {
          productIds: [138, 139, 140],
          approved: true
        }
      },
      rejet_lot: {
        summary: 'Rejeter un lot de produits',
        description: 'Rejette plusieurs produits avec une raison commune',
        value: {
          productIds: [141, 142],
          approved: false,
          rejectionReason: 'Non-conformité aux standards qualité'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Validation en lot effectuée',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '3 produits traités avec succès' },
        data: {
          type: 'object',
          properties: {
            totalRequested: { type: 'number', example: 5 },
            successCount: { type: 'number', example: 3 },
            errorCount: { type: 'number', example: 2 },
            wizardProcessed: { type: 'number', example: 2 },
            traditionalProcessed: { type: 'number', example: 1 },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'number', example: 142 },
                  error: { type: 'string', example: 'Produit déjà validé' }
                }
              }
            },
            processedProducts: {
              type: 'array',
              items: { type: 'number' },
              example: [138, 139, 140]
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async validateProductsBatch(
    @Body() dto: ValidateProductsBatchDto,
    @Request() req: any
  ) {
    try {
      const adminId = req.user.id || req.user.sub;

      // Validation des données
      if (!Array.isArray(dto.productIds) || dto.productIds.length === 0) {
        throw new BadRequestException('productIds doit être un tableau non vide');
      }

      if (typeof dto.approved !== 'boolean') {
        throw new BadRequestException('Le champ "approved" est requis et doit être un booléen');
      }

      if (!dto.approved && !dto.rejectionReason) {
        throw new BadRequestException('Une raison de rejet est obligatoire pour rejeter des produits');
      }

      this.logger.log(`🎯 Admin ${adminId} traite ${dto.productIds.length} produits en lot - Approuvé: ${dto.approved}`);

      const errors: Array<{ productId: number; error: string }> = [];
      const processedProducts: number[] = [];
      let wizardCount = 0;
      let traditionalCount = 0;

      // Traitement séquentiel pour éviter les conflits de concurrence
      for (const productId of dto.productIds) {
        try {
          const result = await this.validationService.validateProduct(
            productId,
            adminId,
            dto.approved,
            dto.rejectionReason
          );

          if (result.success) {
            processedProducts.push(productId);

            // Compter selon le type
            const isWizardProduct = !result.product?.designId || result.product?.designId === null;
            if (isWizardProduct) {
              wizardCount++;
            } else {
              traditionalCount++;
            }

            this.logger.log(`✅ Produit ${productId} traité avec succès`);
          } else {
            errors.push({ productId, error: result.message || 'Erreur inconnue' });
          }
        } catch (error) {
          this.logger.error(`❌ Erreur produit ${productId}:`, error);
          errors.push({ productId, error: error.message || 'Erreur de traitement' });
        }
      }

      const totalRequested = dto.productIds.length;
      const successCount = processedProducts.length;
      const errorCount = errors.length;

      const action = dto.approved ? 'validés' : 'rejetés';
      const message = errorCount === 0
        ? `${successCount} produits ${action} avec succès`
        : `${successCount} produits ${action}, ${errorCount} erreurs`;

      this.logger.log(`📊 Résumé lot: ${successCount} succès, ${errorCount} erreurs (${wizardCount} WIZARD, ${traditionalCount} TRADITIONAL)`);

      return {
        success: errorCount < totalRequested, // Succès si au moins un produit traité
        message,
        data: {
          totalRequested,
          successCount,
          errorCount,
          wizardProcessed: wizardCount,
          traditionalProcessed: traditionalCount,
          errors,
          processedProducts
        }
      };

    } catch (error) {
      this.logger.error('❌ Erreur validation en lot:', error);

      return {
        success: false,
        message: error.message || 'Erreur lors de la validation en lot',
        data: null
      };
    }
  }

  /**
   * 🖼️ Méthode privée pour récupérer les images d'un produit WIZARD
   */
  private async getVendorImages(productId: number) {
    try {
      const images = await this.prisma.vendorProductImage.findMany({
        where: {
          vendorProductId: productId
        },
        select: {
          id: true,
          imageType: true,
          cloudinaryUrl: true,
          colorId: true,
          width: true,
          height: true
        },
        orderBy: {
          id: 'asc'
        }
      });

      // Enrichir avec les informations de couleur si disponibles
      const enrichedImages = await Promise.all(
        images.map(async (image) => {
          let colorInfo = null;

          if (image.colorId) {
            try {
              const color = await this.prisma.colorVariation.findUnique({
                where: { id: image.colorId },
                select: {
                  name: true,
                  colorCode: true
                }
              });
              colorInfo = color;
            } catch (error) {
              this.logger.warn(`Couleur non trouvée pour image ${image.id}: ${error.message}`);
            }
          }

          return {
            id: image.id,
            imageType: image.imageType || 'base', // 'base' | 'detail' | 'admin_reference'
            cloudinaryUrl: image.cloudinaryUrl,
            colorName: colorInfo?.name || null,
            colorCode: colorInfo?.colorCode || null,
            width: image.width,
            height: image.height
          };
        })
      );

      return enrichedImages;

    } catch (error) {
      this.logger.error(`Erreur récupération images produit ${productId}:`, error);
      return [];
    }
  }
}