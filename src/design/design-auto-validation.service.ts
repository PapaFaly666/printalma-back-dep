import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DesignAutoValidationService {
  private readonly logger = new Logger(DesignAutoValidationService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 🎯 PRIORITÉ 1: Auto-valider tous les VendorProducts utilisant un design spécifique
   * Endpoint: POST /admin/designs/{designId}/auto-validate-products
   */
  async autoValidateProductsForDesign(designId: number): Promise<{
    success: boolean;
    message: string;
    data: {
      updatedProducts: any[];
    };
  }> {
    try {
      // 1. Vérifier que le design existe et est validé
      const design = await this.prisma.design.findUnique({
        where: { id: designId },
        select: {
          id: true,
          name: true,
          isValidated: true,
          isPublished: true // Selon guidefr.md: Design.isPublished = true
        }
      });

      if (!design) {
        throw new NotFoundException('Design non trouvé');
      }

      if (!design.isPublished) {
        return {
          success: false,
          message: 'Le design doit être publié pour auto-valider les produits',
          data: { updatedProducts: [] }
        };
      }

      // 2. Trouver tous les VendorProduct non validés utilisant ce design
      const vendorProductsToUpdate = await this.prisma.vendorProduct.findMany({
        where: {
          designId: designId,
          isValidated: false,
          isDelete: false
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (vendorProductsToUpdate.length === 0) {
        return {
          success: true,
          message: 'Aucun produit à auto-valider pour ce design',
          data: { updatedProducts: [] }
        };
      }

      // 3. Auto-valider tous ces VendorProduct
      const updatedProducts = [];
      
      for (const product of vendorProductsToUpdate) {
        const updatedProduct = await this.prisma.vendorProduct.update({
          where: { id: product.id },
          data: {
            isValidated: true,
            validatedAt: new Date(),
            validatedBy: -1, // ID spécial pour auto-validation
            // Appliquer l'action post-validation choisie par le vendeur
            status: product.postValidationAction === 'AUTO_PUBLISH' 
              ? 'PUBLISHED' 
              : 'DRAFT'
          },
          select: {
            id: true,
            name: true,
            isValidated: true,
            vendorId: true,
            status: true,
            postValidationAction: true
          }
        });

        updatedProducts.push(updatedProduct);

        // Log pour audit
        this.logger.log(
          `✅ Auto-validation: Produit "${product.name}" (ID: ${product.id}) ` +
          `du vendeur ${product.vendor.firstName} ${product.vendor.lastName} ` +
          `validé automatiquement (Design ID: ${designId})`
        );
      }

      return {
        success: true,
        message: `${updatedProducts.length} produit(s) auto-validé(s) avec succès`,
        data: {
          updatedProducts
        }
      };

    } catch (error) {
      this.logger.error('Erreur lors de l\'auto-validation:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Erreur lors de l'auto-validation: ${error.message}`);
    }
  }

  /**
   * 🎯 PRIORITÉ 2: Auto-validation globale de tous les produits éligibles
   * Endpoint: POST /admin/vendor-products/auto-validate
   */
  async autoValidateAllEligibleProducts(): Promise<{
    success: boolean;
    message: string;
    data: {
      updated: any[];
    };
  }> {
    try {
      // Trouver tous les VendorProduct non validés dont le design est publié
      const eligibleProducts = await this.prisma.vendorProduct.findMany({
        where: {
          isValidated: false,
          isDelete: false,
          design: {
            isPublished: true // Design publié = validé
          }
        },
        include: {
          design: {
            select: { id: true, name: true }
          },
          vendor: {
            select: { firstName: true, lastName: true, email: true }
          }
        }
      });

      if (eligibleProducts.length === 0) {
        return {
          success: true,
          message: 'Aucun produit éligible pour l\'auto-validation',
          data: { updated: [] }
        };
      }

      const updated = [];

      // Auto-valider tous les produits éligibles
      for (const product of eligibleProducts) {
        const updatedProduct = await this.prisma.vendorProduct.update({
          where: { id: product.id },
          data: {
            isValidated: true,
            validatedAt: new Date(),
            validatedBy: -1, // Auto-validation
            status: product.postValidationAction === 'AUTO_PUBLISH' 
              ? 'PUBLISHED' 
              : 'DRAFT'
          },
          select: {
            id: true,
            name: true,
            vendorId: true,
            isValidated: true,
            validatedAt: true,
            validatedBy: true
          }
        });

        updated.push(updatedProduct);

        this.logger.log(
          `🤖 Auto-validation globale: Produit "${product.name}" (ID: ${product.id}) ` +
          `validé automatiquement (Design: "${product.design.name}")`
        );
      }

      return {
        success: true,
        message: `Auto-validation globale terminée: ${updated.length} produit(s) validé(s)`,
        data: { updated }
      };

    } catch (error) {
      this.logger.error('Erreur lors de l\'auto-validation globale:', error);
      throw new Error(`Erreur lors de l'auto-validation globale: ${error.message}`);
    }
  }

  /**
   * 🎯 BONUS: Statistiques d'auto-validation
   * Endpoint: GET /admin/stats/auto-validation
   */
  async getAutoValidationStats(): Promise<{
    success: boolean;
    data: {
      autoValidated: number;
      manualValidated: number;
      pending: number;
      totalValidated: number;
    };
  }> {
    try {
      const stats = await this.prisma.vendorProduct.groupBy({
        by: ['validatedBy'],
        where: {
          isDelete: false
        },
        _count: true
      });

      let autoValidated = 0;
      let manualValidated = 0;
      let pending = 0;

      // Compter par catégorie
      const pendingCount = await this.prisma.vendorProduct.count({
        where: {
          isDelete: false,
          isValidated: false
        }
      });

      const validatedStats = await this.prisma.vendorProduct.groupBy({
        by: ['validatedBy'],
        where: {
          isDelete: false,
          isValidated: true,
          validatedBy: {
            not: null
          }
        },
        _count: true
      });

      for (const stat of validatedStats) {
        if (stat.validatedBy === -1) {
          autoValidated += stat._count;
        } else {
          manualValidated += stat._count;
        }
      }

      return {
        success: true,
        data: {
          autoValidated,
          manualValidated,
          pending: pendingCount,
          totalValidated: autoValidated + manualValidated
        }
      };

    } catch (error) {
      this.logger.error('Erreur lors de la récupération des stats:', error);
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }
}