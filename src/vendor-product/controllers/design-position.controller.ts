import { Controller, Put, Get, Delete, Param, Body, UseGuards, Req, Logger, HttpStatus, HttpException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DesignPositionService } from '../services/design-position.service';
import { UpdateDesignPositionDto } from '../dto/update-design-position.dto';

@Controller('api/vendor-products/:productId/designs/:designId/position')
@UseGuards(JwtAuthGuard)
export class DesignPositionController {
  private readonly logger = new Logger(DesignPositionController.name);

  constructor(private readonly service: DesignPositionService) {}

  @Put()
  async upsert(
    @Req() req: any,
    @Param('productId') productId: string,
    @Param('designId') designId: string,
    @Body() dto: UpdateDesignPositionDto,
  ) {
    const vendorId = req.user.id;
    const data = await this.service.upsertPosition(vendorId, Number(productId), Number(designId), dto);
    return {
      success: true,
      data,
    };
  }

  /**
   * 🆕 Sauvegarde position directe avec protection contre les boucles infinies
   */
  @Put('direct')
  async savePositionDirect(
    @Req() req: any,
    @Param('productId') productId: string,
    @Param('designId') designId: string,
    @Body() positioning: any,
  ) {
    const vendorId = req.user.id;
    let productIdNum = Number(productId);
    let designIdNum = Number(designId);
    
    this.logger.log(`🔄 PUT /api/vendor-products/${productId}/designs/${designId}/position/direct - vendorId: ${vendorId}`);
    
    try {
      // ✅ VALIDATION PRÉALABLE POUR ÉVITER LES BOUCLES INFINIES
      let product = await this.service.prismaClient.vendorProduct.findUnique({
        where: { id: productIdNum },
        select: { id: true, vendorId: true, name: true, baseProductId: true },
      });
      
      // 🔄 Fallback: mapping baseProductId → vendorProductId
      if (!product) {
        const mappedByBase = await this.service.prismaClient.vendorProduct.findFirst({
          where: {
            baseProductId: productIdNum,
            vendorId: vendorId,
          },
          select: { id: true, vendorId: true, name: true, baseProductId: true },
        });

        if (mappedByBase) {
          this.logger.log(`🔁 Mapping baseProductId → vendorProductId: ${productIdNum} → ${mappedByBase.id}`);
          product = mappedByBase;
          productIdNum = mappedByBase.id; // on remplace pour la suite du traitement
        }
      }
      
      if (!product) {
        // 🛠️ Tentative finale : récupérer le premier vendorProduct du vendeur qui dérive de ce baseProductId
        const alt = await this.service.prismaClient.vendorProduct.findFirst({
          where: { vendorId, baseProductId: productIdNum },
          orderBy: { createdAt: 'asc' },
        });

        if (alt) {
          this.logger.log(`🔁 Fallback (any) baseProductId → vendorProductId: ${productIdNum} → ${alt.id}`);
          product = alt;
          productIdNum = alt.id;
        } else {
          this.logger.warn(`❌ Produit ${productIdNum} introuvable (ni vendorProduct ni baseProductId associé)`);
          throw new HttpException(
            {
              success: false,
              message: 'Produit introuvable',
              error: 'NOT_FOUND',
              statusCode: 404,
            },
            HttpStatus.NOT_FOUND,
          );
        }
      }
      
      if (product.vendorId !== vendorId) {
        this.logger.warn(`❌ Produit ${productIdNum} (baseProductId: ${product.baseProductId}) n'appartient pas au vendeur ${vendorId}`);
        
        // 🔧 CORRECTION AUTOMATIQUE - Suggérer le bon produit
        const correctProduct = await this.service.prismaClient.vendorProduct.findFirst({
          where: { 
            vendorId: vendorId,
            baseProductId: product.baseProductId // Même produit de base
          },
          select: { id: true, name: true, baseProductId: true }
        });
        
        if (correctProduct) {
          this.logger.log(`💡 Suggestion de correction: Utiliser le produit ${correctProduct.id} au lieu de ${productIdNum}`);
        }
        
        throw new HttpException({
          success: false,
          message: 'Ce produit ne vous appartient pas',
          error: 'FORBIDDEN',
          statusCode: 403,
          debugInfo: {
            requestedProductId: productIdNum,
            requestedDesignId: designIdNum,
            vendorId: vendorId,
            productOwner: product.vendorId,
            baseProductId: product.baseProductId,
            suggestion: correctProduct ? {
              correctProductId: correctProduct.id,
              correctProductName: correctProduct.name
            } : null
          }
        }, HttpStatus.FORBIDDEN);
      }
      
      // ✅ VALIDATION DU DESIGN
      let design = await this.service.prismaClient.design.findUnique({
        where: { id: designIdNum },
        select: { id: true, name: true, vendorId: true, isPublished: true },
      });
      
      if (!design) {
        this.logger.warn(`❌ Design ${designIdNum} introuvable`);

        // Essayer un fallback simple : si le vendeur n'a qu'UN seul design, on l'utilise
        const vendorDesigns = await this.service.prismaClient.design.findMany({
          where: { vendorId },
          select: { id: true, name: true, vendorId: true, isPublished: true },
          orderBy: { createdAt: 'asc' }
        });

        if (vendorDesigns.length === 1) {
          const fallback = vendorDesigns[0];
          this.logger.log(`🔁 Mapping designId invalide → seul design du vendeur: ${designIdNum} → ${fallback.id}`);
          design = fallback;
          designIdNum = fallback.id;
        } else {
          // 🔧 CORRECTION AUTOMATIQUE - Suggérer le dernier design
          const correctDesign = vendorDesigns[vendorDesigns.length - 1];
          throw new HttpException({
            success: false,
            message: 'Design introuvable',
            error: 'NOT_FOUND',
            statusCode: 404,
            debugInfo: {
              requestedProductId: productIdNum,
              requestedDesignId: designIdNum,
              vendorId: vendorId,
              suggestion: correctDesign ? {
                correctDesignId: correctDesign.id,
                correctDesignName: correctDesign.name
              } : null
            }
          }, HttpStatus.NOT_FOUND);
        }
      }
      
      // ✅ SAUVEGARDE POSITION
      await this.service.savePositionByDesignId(
        vendorId, 
        productIdNum, 
        designIdNum, 
        positioning
      );
      
      this.logger.log(`✅ Position sauvegardée avec succès: Produit ${productIdNum} ↔ Design ${designIdNum}`);
      
      return {
        success: true,
        message: 'Position sauvegardée avec succès',
        data: {
          x: positioning.x || 0,
          y: positioning.y || 0,
          scale: positioning.scale || 1,
          rotation: positioning.rotation || 0,
          constraints: positioning.constraints || { adaptive: true }
        }
      };
      
    } catch (error) {
      // Si c'est déjà une HttpException, on la relance
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Sinon, on wrap dans une erreur générique
      this.logger.error(`❌ Erreur sauvegarde position:`, error);
      throw new HttpException({
        success: false,
        message: 'Erreur serveur lors de la sauvegarde',
        error: 'INTERNAL_SERVER_ERROR',
        statusCode: 500
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async get(@Param('productId') productId: string, @Param('designId') designId: string) {
    const data = await this.service.getPosition(Number(productId), Number(designId));
    return {
      success: true,
      data: {
        position: data.position,
      },
    };
  }

  /**
   * 🆕 Récupération position directe avec validation vendeur améliorée
   */
  @Get('direct')
  async getPositionDirect(
    @Req() req: any,
    @Param('productId') productId: string, 
    @Param('designId') designId: string
  ) {
    const vendorId = req.user.id;
    let productIdNum = Number(productId);
    let designIdNum = Number(designId);
    
    this.logger.log(`🔍 GET /api/vendor-products/${productId}/designs/${designId}/position/direct - vendorId: ${vendorId}`);
    
    try {
      // ✅ VALIDATION VENDEUR
      let product = await this.service.prismaClient.vendorProduct.findUnique({
        where: { id: productIdNum },
        select: { id: true, vendorId: true, name: true },
      });
      
      // 🔄 Fallback: mapping baseProductId → vendorProductId
      if (!product) {
        const mappedByBase = await this.service.prismaClient.vendorProduct.findFirst({
          where: {
            baseProductId: productIdNum,
            vendorId: vendorId,
          },
          select: { id: true, vendorId: true, name: true },
        });

        if (mappedByBase) {
          this.logger.log(`🔁 Mapping baseProductId → vendorProductId: ${productIdNum} → ${mappedByBase.id}`);
          product = mappedByBase;
          productIdNum = mappedByBase.id;
        }
      }
      
      if (!product) {
        this.logger.warn(`❌ Produit ${productIdNum} introuvable (ni vendorProduct ni baseProductId associé)`);
        throw new HttpException({
          success: false,
          message: 'Produit introuvable',
          error: 'NOT_FOUND',
          statusCode: 404,
        }, HttpStatus.NOT_FOUND);
      }
      
      if (product.vendorId !== vendorId) {
        this.logger.warn(`❌ Produit ${productIdNum} n'appartient pas au vendeur ${vendorId}`);
        return {
          success: false,
          message: 'Ce produit ne vous appartient pas',
          data: null
        };
      }
      
      // ✅ RÉCUPÉRATION POSITION PRINCIPALE
      let position = await this.service.getPositionByDesignId(productIdNum, designIdNum);

      // 🔄 Fallback : si aucune position pour ce design, retourner la première position trouvée sur ce produit
      if (!position) {
        this.logger.log(`ℹ️ Position non trouvée pour design ${designIdNum}. Tentative fallback...`);
        const anyPosition = await this.service.prismaClient.productDesignPosition.findFirst({
          where: { vendorProductId: productIdNum },
          orderBy: { updatedAt: 'desc' }
        });
        if (anyPosition) {
          this.logger.log(`🔁 Fallback réussi -> design ${anyPosition.designId}`);
          position = anyPosition;
        }
      }

      return {
        success: true,
        data: position ? position.position ?? position : null
      };
      
    } catch (error) {
      this.logger.error(`❌ Erreur récupération position:`, error);
      return {
        success: false,
        message: 'Erreur serveur',
        data: null
      };
    }
  }

  @Delete()
  async remove(@Req() req: any, @Param('productId') productId: string, @Param('designId') designId: string) {
    const vendorId = req.user.id;
    await this.service.deletePosition(vendorId, Number(productId), Number(designId));
    return { success: true };
  }

  /**
   * 🔍 Debug endpoint amélioré avec suggestions de correction
   */
  @Get('debug')
  async debugPermissions(
    @Req() req: any,
    @Param('productId') productId: string,
    @Param('designId') designId: string
  ) {
    const vendorId = req.user.id;
    const productIdNum = Number(productId);
    const designIdNum = Number(designId);
    
    this.logger.log(`🔍 DEBUG: vendorId=${vendorId}, productId=${productIdNum}, designId=${designIdNum}`);
    
    try {
      const debugInfo = await this.service.debugPermissions(vendorId, productIdNum, designIdNum);
      
      // 🔧 AJOUT DE SUGGESTIONS DE CORRECTION AUTOMATIQUE
      const corrections = [];
      
      // Si le produit n'appartient pas au vendeur, suggérer le bon produit
      if (debugInfo.product && debugInfo.product.vendorId !== vendorId) {
        const correctProduct = await this.service.prismaClient.vendorProduct.findFirst({
          where: { 
            vendorId: vendorId,
            baseProductId: debugInfo.product.baseProductId
          },
          select: { id: true, name: true }
        });
        
        if (correctProduct) {
          corrections.push({
            type: 'WRONG_PRODUCT_ID',
            message: `Utiliser le produit ${correctProduct.id} au lieu de ${productIdNum}`,
            correctProductId: correctProduct.id,
            correctProductName: correctProduct.name
          });
        }
      }
      
      // Si le design n'appartient pas au vendeur, suggérer le bon design
      if (debugInfo.design && debugInfo.design.vendorId !== vendorId) {
        const correctDesign = await this.service.prismaClient.design.findFirst({
          where: { vendorId: vendorId },
          select: { id: true, name: true },
          orderBy: { createdAt: 'desc' }
        });
        
        if (correctDesign) {
          corrections.push({
            type: 'WRONG_DESIGN_ID',
            message: `Utiliser le design ${correctDesign.id} au lieu de ${designIdNum}`,
            correctDesignId: correctDesign.id,
            correctDesignName: correctDesign.name
          });
        }
      }
      
      return {
        success: true,
        debug: {
          ...debugInfo,
          corrections
        }
      };
      
    } catch (error) {
      this.logger.error(`❌ Erreur debug:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }
} 
 