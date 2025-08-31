import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { VendorGuard } from 'src/core/guards/vendor.guard';
import { AdminGuard } from 'src/core/guards/admin.guard';
import { VendorProductValidationService, PostValidationAction } from './vendor-product-validation.service';
import { UpdatePostValidationActionDto } from './dto/update-post-validation-action.dto';
import { CompleteVendorProductsResponseDto } from './dto/vendor-product-complete-response.dto';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { AdminCreateVendorProductDto } from './dto/admin-create-vendor-product.dto';
import { AdminCreateVendorProductResponseDto } from './dto/admin-create-vendor-product.dto';
import { VendorListResponseDto, VendorDesignsResponseDto } from './dto/admin-create-vendor-product.dto';

class ValidateProductDto {
  approved: boolean;
  rejectionReason?: string;
}

@ApiBearerAuth()
@ApiTags('Cascade Validation')
@Controller('vendor-product-validation')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VendorProductValidationController {
  private readonly logger = new Logger(VendorProductValidationController.name);

  constructor(
    private readonly validationService: VendorProductValidationService,
  ) {}

  // =================== ENDPOINTS VENDEUR ===================

  @Put('post-validation-action/:productId')
  @Roles('VENDOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Modifier l\'action après validation du design',
    description: 'Permet au vendeur de choisir ce qui se passe après validation du design (publication automatique ou mise en brouillon)'
  })
  @ApiResponse({ status: 200, description: 'Action mise à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Produit déjà validé ou données invalides' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async updatePostValidationAction(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: UpdatePostValidationActionDto,
    @Request() req: any
  ) {
    const vendorId = req.user.id;

    if (!['AUTO_PUBLISH', 'TO_DRAFT'].includes(dto.postValidationAction)) {
      throw new BadRequestException('Action invalide. Valeurs acceptées: AUTO_PUBLISH, TO_DRAFT');
    }

    return await this.validationService.updatePostValidationAction(
      productId,
      vendorId,
      dto.postValidationAction
    );
  }

  @Post('publish/:productId')
  @Roles('VENDOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Publier manuellement un produit validé',
    description: 'Permet au vendeur de publier un produit qui a été validé et mis en brouillon'
  })
  @ApiResponse({ status: 200, description: 'Produit publié avec succès' })
  @ApiResponse({ status: 400, description: 'Produit non validé ou déjà publié' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async publishValidatedProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Request() req: any
  ) {
    const vendorId = req.user.id;
    
    return await this.validationService.publishValidatedProduct(productId, vendorId);
  }

  // =================== ENDPOINTS ADMIN ===================

  /**
   * 🎯 ENDPOINT ADMIN: Récupérer TOUS les produits vendeur avec TOUTES les informations détaillées
   */
  @Get('all-products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🎯 Récupérer tous les produits vendeur (Admin)',
    description: `
    **ENDPOINT ADMIN COMPLET:**
    
    - ✅ **Accès**: Admin/SuperAdmin uniquement
    - ✅ **Données**: Informations complètes des produits vendeur
    - ✅ **Relations**: Vendeurs, designs, images, positions, transformations
    - ✅ **Filtrage**: Par vendeur, statut, recherche
    - ✅ **Pagination**: Configurable
    - ✅ **Statistiques**: Globales incluses
    
    **NOUVEAUTÉS CRITIQUES:**
    - designApplication (URL, positionnement, échelle)
    - selectedColors (couleurs sélectionnées par vendeur)
    - adminProduct (structure complète avec variations)
    - designPositions (positions précises des designs)
    `
  })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Limite (défaut: 20)' })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'Filtrer par vendeur' })
  @ApiQuery({ name: 'status', required: false, type: 'string', description: 'Filtrer par statut' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Recherche textuelle' })
  @ApiQuery({ name: 'includeDesigns', required: false, type: 'boolean', description: 'Inclure les designs' })
  @ApiQuery({ name: 'includeImages', required: false, type: 'boolean', description: 'Inclure les images' })
  @ApiQuery({ name: 'includePositions', required: false, type: 'boolean', description: 'Inclure les positions' })
  @ApiQuery({ name: 'includeTransforms', required: false, type: 'boolean', description: 'Inclure les transformations' })
  @ApiResponse({
    status: 200,
    description: 'Produits vendeur récupérés avec succès',
    type: CompleteVendorProductsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Admin requis',
  })
  async getAllVendorProductsWithDetails(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('vendorId') vendorId?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('includeDesigns') includeDesigns?: boolean,
    @Query('includeImages') includeImages?: boolean,
    @Query('includePositions') includePositions?: boolean,
    @Query('includeTransforms') includeTransforms?: boolean,
  ) {
    const adminId = req.user.sub;
    
    return this.validationService.getAllVendorProductsWithDetails(adminId, {
      page,
      limit,
      vendorId,
      status,
      search,
      includeDesigns,
      includeImages,
      includePositions,
      includeTransforms,
    });
  }

  /**
   * 🎯 ENDPOINT ADMIN: Créer un produit pour un vendeur
   */
  @Post('create-for-vendor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '🎯 Créer un produit pour un vendeur (Admin)',
    description: `
    **CRÉATION DE PRODUIT VENDEUR PAR ADMIN:**
    
    - ✅ **Principe**: Identique à la création vendeur mais avec vendorId
    - ✅ **Permissions**: Admin/SuperAdmin uniquement
    - ✅ **Validation**: Vérification vendeur, design, produit de base
    - ✅ **Bypass**: Option bypassAdminValidation pour les tests
    - ✅ **Statut**: Peut forcer le statut ou suivre la logique normale
    - ✅ **Structure**: Même structure que vendeur (Architecture v2)
    
    **VALIDATIONS:**
    - Vendeur existe et est actif
    - Design appartient au vendeur
    - Produit de base existe
    - Structure admin valide
    `
  })
  @ApiBody({
    type: AdminCreateVendorProductDto,
    description: 'Données du produit à créer',
    examples: {
      produit_complet: {
        summary: 'Produit complet avec design',
        value: {
          vendorId: 123,
          baseProductId: 4,
          productStructure: {
            adminProduct: {
              id: 4,
              name: 'T-shirt Premium',
              description: 'T-shirt en coton bio',
              price: 2000,
              images: {
                colorVariations: [
                  {
                    id: 1,
                    name: 'Noir',
                    colorCode: '#000000',
                    images: [
                      {
                        id: 1,
                        url: 'https://res.cloudinary.com/...',
                        viewType: 'FRONT',
                        delimitations: [
                          {
                            x: 25,
                            y: 30,
                            width: 50,
                            height: 40,
                            coordinateType: 'PERCENTAGE'
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              sizes: [
                { id: 1, sizeName: 'S' },
                { id: 2, sizeName: 'M' },
                { id: 3, sizeName: 'L' }
              ]
            },
            designApplication: {
              positioning: 'CENTER',
              scale: 0.75
            }
          },
          vendorPrice: 2500,
          vendorName: 'T-shirt Design Dragon',
          vendorDescription: 'T-shirt premium avec design dragon exclusif',
          vendorStock: 100,
          selectedColors: [
            { id: 1, name: 'Noir', colorCode: '#000000' },
            { id: 2, name: 'Blanc', colorCode: '#FFFFFF' }
          ],
          selectedSizes: [
            { id: 1, sizeName: 'S' },
            { id: 2, sizeName: 'M' },
            { id: 3, sizeName: 'L' }
          ],
          designId: 42,
          forcedStatus: 'DRAFT',
          postValidationAction: 'AUTO_PUBLISH',
          designPosition: {
            x: 0,
            y: 0,
            scale: 0.75,
            rotation: 0
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Produit créé avec succès',
    type: AdminCreateVendorProductResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Admin requis',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendeur, design ou produit de base non trouvé',
  })
  async createProductForVendor(
    @Request() req: any,
    @Body() productData: AdminCreateVendorProductDto
  ) {
    const adminId = req.user.sub;
    
    return this.validationService.createProductForVendor(adminId, productData);
  }

  /**
   * 👥 ENDPOINT ADMIN: Lister les vendeurs disponibles
   */
  @Get('vendors')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '👥 Lister les vendeurs disponibles (Admin)',
    description: `
    **LISTE DES VENDEURS POUR ADMIN:**
    
    - ✅ **Données**: Informations complètes des vendeurs
    - ✅ **Statistiques**: Produits, designs, statut
    - ✅ **Tri**: Actifs en premier, puis par date de création
    - ✅ **Usage**: Sélection vendeur dans interface admin
    
    **INFORMATIONS INCLUSES:**
    - Données personnelles (nom, email, boutique)
    - Statistiques produits (total, publiés)
    - Nombre de designs
    - Statut et dates
    `
  })
  @ApiResponse({
    status: 200,
    description: 'Vendeurs récupérés avec succès',
    type: VendorListResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Admin requis',
  })
  async getAvailableVendors(
    @Request() req: any
  ) {
    const adminId = req.user.sub;
    
    return this.validationService.getAvailableVendors(adminId);
  }

  @Get('vendors/:vendorId/designs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🎨 Récupérer les designs d\'un vendeur (Admin)',
    description: 'Permet à un admin de récupérer tous les designs associés à un vendeur.'
  })
  @ApiResponse({
    status: 200,
    description: 'Designs récupérés avec succès',
    type: VendorDesignsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès refusé - Admin requis',
  })
  @ApiResponse({
    status: 404,
    description: 'Vendeur non trouvé',
  })
  async getVendorDesigns(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Request() req: any
  ) {
    const adminId = req.user.sub;
    return this.validationService.getVendorDesigns(adminId, vendorId);
  }

  @Get('pending')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ 
    summary: 'Lister les produits en attente de validation',
    description: 'Récupère tous les produits vendeur en attente de validation par un admin'
  })
  @ApiResponse({ status: 200, description: 'Liste des produits en attente' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Admin requis' })
  async getPendingProducts(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('vendorId') vendorId?: string,
    @Query('designUrl') designUrl?: string
  ) {
    const adminId = req.user.id;
    
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      vendorId: vendorId ? parseInt(vendorId) : undefined,
      designUrl: designUrl || undefined
    };

    return await this.validationService.getPendingProducts(adminId, options);
  }

  @Put('validate/:productId')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ 
    summary: 'Valider ou rejeter un produit',
    description: 'Permet à un admin de valider ou rejeter un produit vendeur spécifique'
  })
  @ApiResponse({ status: 200, description: 'Produit validé/rejeté avec succès' })
  @ApiResponse({ status: 400, description: 'Produit déjà validé ou données invalides' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async validateProduct(
    @Param('productId', ParseIntPipe) productId: number,
    @Body() dto: ValidateProductDto,
    @Request() req: any
  ) {
    const adminId = req.user.id;

    if (typeof dto.approved !== 'boolean') {
      throw new BadRequestException('Le champ "approved" est requis et doit être un booléen');
    }

    if (!dto.approved && !dto.rejectionReason) {
      throw new BadRequestException('Une raison de rejet est obligatoire pour rejeter un produit');
    }

    return await this.validationService.validateProduct(
      productId,
      adminId,
      dto.approved,
      dto.rejectionReason
    );
  }

  @Get('stats')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ 
    summary: 'Statistiques de validation des produits',
    description: 'Récupère les statistiques globales de validation des produits vendeur'
  })
  @ApiResponse({ status: 200, description: 'Statistiques de validation' })
  async getValidationStats(@Request() req: any) {
    return await this.validationService.getPendingProducts(req.user.id, { limit: 0 })
      .then(result => result.stats);
  }
} 
 