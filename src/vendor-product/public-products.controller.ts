import {
  Controller,
  Get,
  Query,
  Logger,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { VendorPublishService } from './vendor-publish.service';
import { BestSellersService } from './best-sellers.service';
import { PrismaService } from '../prisma.service';

@ApiTags('vendor-products-public')
@Controller('public')
export class PublicProductsController {
  private readonly logger = new Logger(PublicProductsController.name);

  constructor(
    private readonly vendorPublishService: VendorPublishService,
    private readonly bestSellersService: BestSellersService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * ✅ MEILLEURES VENTES - Endpoint public
   * Récupère les meilleures ventes des vendeurs avec designs, mockups, délimitations
   */
  @Get('vendor-products')
  @ApiOperation({
    summary: 'Récupérer les meilleures ventes des vendeurs (Public)',
    description: `
    **ENDPOINT PUBLIC** - Récupère les meilleures ventes des vendeurs avec:
    
    ✅ **Meilleures ventes** - Produits avec les meilleures performances
    ✅ **Designs incorporés** - Designs appliqués avec positions exactes
    ✅ **Mockups** - Images de base des produits admin
    ✅ **Délimitations** - Zones où les designs peuvent être appliqués
    ✅ **Dimensions designs** - designWidth, designHeight
    ✅ **Positions designs** - Coordonnées exactes d'application
    ✅ **Informations vendeurs** - Profils et boutiques
    ✅ **Statistiques** - Nombre de ventes, revenus, etc.
    
    **PARAMÈTRES:**
    - limit: Nombre de produits (défaut: 20, max: 100)
    - offset: Pagination (défaut: 0)
    - vendorId: Filtrer par vendeur (optionnel)
    - status: Filtrer par statut (PUBLISHED, DRAFT, etc.)
    - search: Recherche textuelle
    - category: Catégorie de design
    - minPrice/maxPrice: Filtre par prix
    - allProducts: Afficher tous les produits au lieu des meilleures ventes
    `
  })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de produits (défaut: 20, max: 100)' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Pagination (défaut: 0)' })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'ID du vendeur spécifique' })
  @ApiQuery({ name: 'status', required: false, type: 'string', description: 'Statut: PUBLISHED, DRAFT, etc.' })
  @ApiQuery({ name: 'search', required: false, type: 'string', description: 'Recherche textuelle' })
  @ApiQuery({ name: 'category', required: false, type: 'string', description: 'Catégorie de design' })
  @ApiQuery({ name: 'minPrice', required: false, type: 'number', description: 'Prix minimum' })
  @ApiQuery({ name: 'maxPrice', required: false, type: 'number', description: 'Prix maximum' })
  @ApiQuery({ name: 'allProducts', required: false, type: 'boolean', description: 'Afficher tous les produits au lieu des meilleures ventes' })
  async getAllVendorProducts(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('vendorId') vendorId?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('allProducts') allProducts?: boolean,
  ) {
    this.logger.log(`🏆 Récupération publique des meilleures ventes`);
    this.logger.log(`🔍 Paramètre allProducts: ${allProducts} (type: ${typeof allProducts})`);
    
    try {
      // Construire les filtres
      const filters: any = {};
      
      if (vendorId) filters.vendorId = parseInt(vendorId.toString());
      if (status) filters.status = status;
      if (search) filters.search = search;
      if (category) filters.category = category;
      if (minPrice) filters.minPrice = minPrice;
      if (maxPrice) filters.maxPrice = maxPrice;
      
      // ✅ PAR DÉFAUT: Afficher les meilleures ventes
      // Seulement si allProducts=true, on affiche tous les produits
      const shouldShowAllProducts = allProducts === true;
      
      if (!shouldShowAllProducts) {
        filters.isBestSeller = true;
        this.logger.log(`🏆 Filtre isBestSeller activé pour afficher seulement les meilleures ventes`);
      } else {
        this.logger.log(`📦 Mode allProducts activé - affichage de tous les produits`);
      }

      this.logger.log(`🔍 Filtres finaux:`, filters);

      const result = await this.vendorPublishService.getPublicVendorProducts({
        limit: Math.min(limit || 20, 100),
        offset: offset || 0,
        ...filters
      });

      return {
        success: true,
        message: allProducts ? 'Tous les produits récupérés avec succès' : 'Meilleures ventes récupérées avec succès',
        data: {
          products: result.products,
          pagination: result.pagination,
          type: allProducts ? 'all_products' : 'best_sellers'
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération produits publics:', error);
      return {
        success: false,
        message: 'Erreur lors de la récupération des produits',
        error: error.message
      };
    }
  }

  /**
   * ✅ DÉTAILS PRODUIT VENDEUR - Endpoint public
   * Récupère les détails complets d'un produit avec design incorporé
   */
  @Get('vendor-products/:id')
  @ApiOperation({
    summary: 'Détails complets d\'un produit vendeur (Public)',
    description: `
    **ENDPOINT PUBLIC** - Récupère tous les détails d'un produit:
    
    ✅ **Produit vendeur** - Informations complètes
    ✅ **Design incorporé** - Design appliqué avec position exacte
    ✅ **Mockups** - Images de base pour toutes les couleurs
    ✅ **Délimitations** - Zones d'application du design
    ✅ **Dimensions** - designWidth, designHeight, scale
    ✅ **Position** - Coordonnées exactes (x, y, rotation)
    ✅ **Vendeur** - Informations du vendeur
    ✅ **Statistiques** - Ventes, revenus, etc.
    `
  })
  @ApiParam({ 
    name: 'id', 
    type: 'number', 
    description: 'ID du produit vendeur',
    example: 52
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Détails produit récupérés avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Détails produit récupérés avec succès' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 52 },
            vendorName: { type: 'string', example: 'T-shirt Dragon Rouge Premium' },
            price: { type: 'number', example: 25000 },
            status: { type: 'string', example: 'PUBLISHED' },
            bestSeller: {
              type: 'object',
              properties: {
                isBestSeller: { type: 'boolean', example: true },
                salesCount: { type: 'number', example: 85 },
                totalRevenue: { type: 'number', example: 2125000 }
              }
            },
            designPositions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  designId: { type: 'number', example: 42 },
                  position: {
                    type: 'object',
                    properties: {
                      x: { type: 'number', example: -44 },
                      y: { type: 'number', example: -68 },
                      scale: { type: 'number', example: 0.44 },
                      rotation: { type: 'number', example: 15 },
                      designWidth: { type: 'number', example: 1200 },
                      designHeight: { type: 'number', example: 1200 }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Produit introuvable ou non publié',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Produit 999 introuvable ou non publié' },
        statusCode: { type: 'number', example: 404 }
      }
    }
  })
  async getVendorProductDetail(
    @Param('id', ParseIntPipe) productId: number
  ) {
    this.logger.log(`🔍 Récupération détails produit public ${productId}`);
    
    try {
      const result = await this.vendorPublishService.getPublicVendorProductDetail(productId);
      
      return {
        success: true,
        message: 'Détails produit récupérés avec succès',
        data: result
      };
    } catch (error) {
      this.logger.error(`❌ Erreur récupération détails produit: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ PRODUITS PAR VENDEUR - Endpoint public
   * Récupère tous les produits d'un vendeur spécifique
   */
  @Get('vendors/:vendorId/products')
  @ApiOperation({
    summary: 'Produits d\'un vendeur spécifique (Public)',
    description: 'Récupère tous les produits d\'un vendeur avec designs incorporés'
  })
  @ApiParam({ name: 'vendorId', type: 'number', description: 'ID du vendeur' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de produits' })
  @ApiQuery({ name: 'offset', required: false, type: 'number', description: 'Pagination' })
  @ApiQuery({ name: 'status', required: false, type: 'string', description: 'Statut des produits' })
  async getVendorProductsByVendor(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('status') status?: string,
  ) {
    this.logger.log(`🏪 Récupération produits du vendeur ${vendorId}`);
    
    try {
      const result = await this.vendorPublishService.getPublicVendorProducts({
        vendorId,
        limit: Math.min(limit || 20, 100),
        offset: offset || 0,
        status
      });

      return {
        success: true,
        message: `Produits du vendeur ${vendorId} récupérés`,
        data: result
      };
    } catch (error) {
      this.logger.error(`❌ Erreur récupération produits vendeur: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ MEILLURES VENTES - Endpoint public (déjà existant mais centralisé)
   */
  @Get('best-sellers')
  @ApiOperation({
    summary: 'Meilleures ventes (Public)',
    description: 'Récupère les produits avec les meilleures ventes'
  })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'ID du vendeur (optionnel)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de produits (défaut: 10)' })
  async getBestSellers(
    @Query('vendorId') vendorId?: number,
    @Query('limit') limit?: number
  ) {
    this.logger.log(`🏆 Récupération meilleures ventes${vendorId ? ` pour vendeur ${vendorId}` : ''}`);
    
    try {
      // ✅ UTILISER LE NOUVEAU SERVICE avec vraies dimensions
      const result = await this.bestSellersService.getPublicBestSellers({
        vendorId: vendorId ? parseInt(vendorId.toString()) : undefined,
        limit: limit || 10
      });
      
      // ✅ CONVERTIR vers l'ancien format pour compatibilité
      const bestSellers = result.data.map(product => ({
        id: product.id,
        vendorName: product.name,
        price: product.price,
        status: 'PUBLISHED',
        
        // 🏆 MEILLEURES VENTES avec vraies valeurs ET RANG
        bestSeller: {
          isBestSeller: true,
          salesCount: product.salesCount,
          totalRevenue: product.totalRevenue
        },
        
        // 🏆 AJOUTER LE RANG POUR LE FRONTEND
        bestSellerRank: product.bestSellerRank,
        
        // 🎨 STRUCTURE ADMIN CONSERVÉE
        adminProduct: product.baseProduct,
        
        // 🎨 APPLICATION DESIGN avec vraies dimensions
        designApplication: {
          hasDesign: !!product.designCloudinaryUrl,
          designUrl: product.designCloudinaryUrl,
          positioning: product.designPositioning,
          scale: product.designScale,
          mode: 'PRESERVED'
        },
        
        // 🎨 DÉLIMITATIONS DU DESIGN avec format standardisé depuis BestSellersService
        designDelimitations: product.baseProduct.colorVariations.map(colorVar => ({
          colorName: colorVar.name,
          colorCode: colorVar.colorCode,
          imageUrl: colorVar.images?.[0]?.url || null,
          naturalWidth: colorVar.images?.[0]?.naturalWidth || 800,
          naturalHeight: colorVar.images?.[0]?.naturalHeight || 600,
          delimitations: colorVar.images?.[0]?.delimitations || []
        })),
        
        // 🎨 INFORMATIONS DESIGN COMPLÈTES
        design: {
          id: product.designCloudinaryUrl ? 1 : null,
          name: 'Design Vendeur',
          description: '',
          category: 'LOGO',
          imageUrl: product.designCloudinaryUrl,
          tags: [],
          isValidated: true
        },
        
        // 🎨 POSITIONNEMENTS DU DESIGN avec VRAIES POSITIONS depuis BestSellersService
        designPositions: product.designPositions && product.designPositions.length > 0 ? product.designPositions : [{
          designId: 1,
          position: {
            x: 0,
            y: 0,
            scale: product.designScale || 0.6,
            rotation: 0,
            constraints: {
              minScale: 0.1,
              maxScale: 2
            },
            designWidth: product.designWidth || 1200,
            designHeight: product.designHeight || 1200
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],
        
        // 👤 INFORMATIONS VENDEUR
        vendor: {
          id: product.vendor.id,
          fullName: `${product.vendor.firstName} ${product.vendor.lastName}`,
          shop_name: product.vendor.businessName,
          profile_photo_url: product.vendor.profilePhotoUrl
        },
        
        // 🖼️ IMAGES ADMIN CONSERVÉES
        images: {
          adminReferences: product.baseProduct.colorVariations.map(colorVar => ({
            colorName: colorVar.name,
            colorCode: colorVar.colorCode,
            adminImageUrl: colorVar.images?.[0]?.url || null,
            imageType: 'admin_reference'
          })),
          total: product.baseProduct.colorVariations.length,
          primaryImageUrl: product.baseProduct.colorVariations?.[0]?.images?.[0]?.url || null
        },
        
        // 📏 SÉLECTIONS VENDEUR (simulations)
        selectedSizes: [
          { id: 36, sizeName: 'XS' },
          { id: 37, sizeName: 'S' },
          { id: 38, sizeName: 'M' },
          { id: 39, sizeName: 'L' },
          { id: 40, sizeName: 'XL' }
        ],
        selectedColors: product.baseProduct.colorVariations.slice(0, 3).map(colorVar => ({
          id: colorVar.id,
          name: colorVar.name,
          colorCode: colorVar.colorCode
        })),
        designId: 1
      }));
      
      return {
        success: true,
        message: 'Meilleures ventes récupérées',
        data: {
          bestSellers,
          total: bestSellers.length
        }
      };
    } catch (error) {
      this.logger.error(`❌ Erreur récupération meilleures ventes: ${error.message}`);
      throw error;
    }
  }

  /**
   * ✅ RECHERCHE PRODUITS - Endpoint public
   * Recherche avancée dans tous les produits vendeurs
   */
  @Get('search')
  @ApiOperation({
    summary: 'Recherche avancée de produits (Public)',
    description: 'Recherche dans tous les produits vendeurs avec filtres avancés'
  })
  @ApiQuery({ name: 'q', required: true, type: 'string', description: 'Terme de recherche' })
  @ApiQuery({ name: 'category', required: false, type: 'string', description: 'Catégorie de design' })
  @ApiQuery({ name: 'minPrice', required: false, type: 'number', description: 'Prix minimum' })
  @ApiQuery({ name: 'maxPrice', required: false, type: 'number', description: 'Prix maximum' })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number', description: 'Vendeur spécifique' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Nombre de résultats' })
  async searchProducts(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('vendorId') vendorId?: number,
    @Query('limit') limit?: number,
  ) {
    this.logger.log(`🔍 Recherche publique: "${query}"`);
    
    try {
      const result = await this.vendorPublishService.searchPublicVendorProducts({
        query,
        category,
        minPrice,
        maxPrice,
        vendorId: vendorId ? parseInt(vendorId.toString()) : undefined,
        limit: Math.min(limit || 20, 100)
      });

      return {
        success: true,
        message: `Résultats de recherche pour "${query}"`,
        data: result
      };
    } catch (error) {
      this.logger.error(`❌ Erreur recherche publique: ${error.message}`);
      throw error;
    }
  }
} 