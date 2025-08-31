import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { 
  calculateDesignPosition, 
  formatDesignPositions, 
  DesignPositionData 
} from '../utils/design-position-calculator';
import { 
  standardizeDelimitations, 
  processImageDelimitations,
  StandardDelimitation 
} from '../utils/delimitation-converter';

export interface BestSellerProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  salesCount: number;
  totalRevenue: number;
  bestSellerRank: number;
  averageRating?: number;
  viewsCount: number;
  
  // Informations du design
  designCloudinaryUrl?: string;
  designWidth?: number;
  designHeight?: number;
  designFormat?: string;
  designScale?: number;
  designPositioning?: string;
  // Positions du design standardisées
  designPositions: DesignPositionData[];
  
  // Informations du produit de base
  baseProduct: {
    id: number;
    name: string;
    genre: string;
    categories: Array<{ id: number; name: string }>;
    colorVariations: Array<{
      id: number;
      name: string;
      colorCode: string;
      images: Array<{
        id: number;
        url: string;
        view: string;
        naturalWidth: number;
        naturalHeight: number;
        delimitations: StandardDelimitation[];
      }>;
    }>;
  };
  
  // Informations du vendeur
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl?: string;
    businessName?: string;
  };
  
  // Métadonnées
  createdAt: Date;
  lastSaleDate?: Date;
}

@Injectable()
export class BestSellersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 🏆 Endpoint public pour récupérer les meilleurs vendeurs
   */
  async getPublicBestSellers(options: {
    limit?: number;
    offset?: number;
    category?: string;
    vendorId?: number;
    minSales?: number;
  } = {}): Promise<{
    success: boolean;
    data: BestSellerProduct[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    stats: {
      totalBestSellers: number;
      categoriesCount: number;
      vendorsCount: number;
    };
  }> {
    const { limit = 20, offset = 0, category, vendorId, minSales = 1 } = options;

    console.log('🔍 [BEST-SELLERS] Récupération des meilleurs vendeurs:', options);

    // Construire les conditions de filtrage
    const where: any = {
      isBestSeller: true,
      isValidated: true,
      status: 'PUBLISHED',
      isDelete: false,
      salesCount: {
        gte: minSales
      }
    };

    console.log('🔍 [BEST-SELLERS] Conditions where:', JSON.stringify(where, null, 2));

    // Filtre par vendeur
    if (vendorId) {
      where.vendorId = vendorId;
    }

    // Filtre par catégorie (via le produit de base)
    if (category) {
      where.baseProduct = {
        categories: {
          some: {
            name: category
          }
        }
      };
    }

    console.log('🔍 [BEST-SELLERS] Conditions finales:', JSON.stringify(where, null, 2));

    try {
      // Récupérer les produits avec toutes les informations + positions de design
      let [products, total] = await Promise.all([
        this.prisma.vendorProduct.findMany({
          where,
          include: {
            baseProduct: {
              include: {
                categories: true,
                colorVariations: {
                  include: {
                    images: {
                      include: {
                        delimitations: true
                      }
                    }
                  }
                }
              }
            },
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profile_photo_url: true,
                shop_name: true
              }
            },
            // ✅ INCLURE LES POSITIONS DE DESIGN STOCKÉES
            designPositions: {
              include: {
                design: true
              }
            }
          },
          orderBy: [
            { bestSellerRank: 'asc' },
            { salesCount: 'desc' },
            { totalRevenue: 'desc' }
          ],
          take: limit,
          skip: offset
        }),
        this.prisma.vendorProduct.count({ where })
      ]);

      console.log('🔍 [BEST-SELLERS] Produits trouvés:', products.length);
      console.log('🔍 [BEST-SELLERS] Total count:', total);

      // ❌ Pas de fallback: si aucun best-seller réel, on retourne une liste vide
      if (products.length === 0) {
        console.log('⚠️ [BEST-SELLERS] Aucun produit best-seller réel trouvé. Aucun fallback appliqué.');
      }

      if (products.length > 0) {
        console.log('🔍 [BEST-SELLERS] Premier produit:', {
          id: products[0].id,
          name: products[0].name,
          isBestSeller: products[0].isBestSeller,
          isValidated: products[0].isValidated,
          status: products[0].status,
          isDelete: products[0].isDelete,
          salesCount: products[0].salesCount,
          vendor: products[0].vendor,
          designPositions: products[0].designPositions?.length || 0
        });
      }

      // Statistiques
      const stats = await this.getBestSellersStats();

      // Formatter les résultats avec les utilitaires unifiés
      const formattedProducts: BestSellerProduct[] = products.map(product => {
        // ✅ UTILISER LES UTILITAIRES UNIFIÉS pour les positions de design
        const standardizedDesignPositions = formatDesignPositions(product.designPositions || []);
        
        console.log(`✅ [UNIFIED] Produit ${product.id}: Positions standardisées`, standardizedDesignPositions.length);

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          salesCount: product.salesCount,
          totalRevenue: product.totalRevenue,
          bestSellerRank: product.bestSellerRank || 999,
          averageRating: product.averageRating,
          viewsCount: product.viewsCount,
          
          // Design info avec vraies dimensions depuis les utilitaires unifiés
          designCloudinaryUrl: product.designCloudinaryUrl,
          designWidth: standardizedDesignPositions[0]?.position.designWidth || 1200,
          designHeight: standardizedDesignPositions[0]?.position.designHeight || 1200,
          designFormat: product.designFormat,
          designScale: product.designScale,
          designPositioning: product.designPositioning,
          designPositions: standardizedDesignPositions,
          
          // Base product info
          baseProduct: {
            id: product.baseProduct.id,
            name: product.baseProduct.name,
            genre: product.baseProduct.genre,
            categories: product.baseProduct.categories.map(cat => ({
              id: cat.id,
              name: cat.name
            })),
            colorVariations: product.baseProduct.colorVariations.map(color => ({
              id: color.id,
              name: color.name,
              colorCode: color.colorCode,
              images: processImageDelimitations(color.images)
            }))
          },
          
          // Vendor info
          vendor: {
            id: product.vendor.id,
            firstName: product.vendor.firstName,
            lastName: product.vendor.lastName,
            email: product.vendor.email,
            profilePhotoUrl: product.vendor.profile_photo_url,
            businessName: product.vendor.shop_name
          },
          
          createdAt: product.createdAt,
          lastSaleDate: product.lastSaleDate
        };
      });

      console.log(`✅ [BEST-SELLERS] Trouvé ${formattedProducts.length} produits best-sellers avec vraies dimensions`);

      return {
        success: true,
        data: formattedProducts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        stats
      };

    } catch (error) {
      console.error('❌ [BEST-SELLERS] Erreur lors de la récupération:', error);
      
      // Retourner une réponse d'erreur
      return {
        success: false,
        data: [],
        pagination: {
          total: 0,
          limit,
          offset,
          hasMore: false
        },
        stats: {
          totalBestSellers: 0,
          categoriesCount: 0,
          vendorsCount: 0
        }
      };
    }
  }

  /**
   * 🆕 Endpoint public pour récupérer les nouveautés (produits récents)
   * Même structure de réponse que les best-sellers
   */
  async getPublicNewArrivals(options: {
    limit?: number;
    offset?: number;
    category?: string;
    vendorId?: number;
  } = {}): Promise<{
    success: boolean;
    data: BestSellerProduct[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    stats: {
      totalBestSellers: number;
      categoriesCount: number;
      vendorsCount: number;
    };
  }> {
    const { limit = 20, offset = 0, category, vendorId } = options;

    const where: any = {
      isValidated: true,
      status: 'PUBLISHED',
      isDelete: false
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (category) {
      where.baseProduct = {
        categories: {
          some: {
            name: category
          }
        }
      };
    }

    try {
      const [products, total] = await Promise.all([
        this.prisma.vendorProduct.findMany({
          where,
          include: {
            baseProduct: {
              include: {
                categories: true,
                colorVariations: {
                  include: {
                    images: {
                      include: {
                        delimitations: true
                      }
                    }
                  }
                }
              }
            },
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profile_photo_url: true,
                shop_name: true
              }
            },
            designPositions: {
              include: { design: true }
            }
          },
          orderBy: [
            { createdAt: 'desc' }
          ],
          take: limit,
          skip: offset
        }),
        this.prisma.vendorProduct.count({ where })
      ]);

      const stats = await this.getBestSellersStats();

      const formattedProducts: BestSellerProduct[] = products.map(product => {
        // ✅ UTILISER LES UTILITAIRES UNIFIÉS pour les positions de design
        const standardizedDesignPositions = formatDesignPositions(product.designPositions || []);
        
        console.log(`✅ [UNIFIED-NEW-ARRIVALS] Produit ${product.id}: Positions standardisées`, standardizedDesignPositions.length);

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          salesCount: product.salesCount,
          totalRevenue: product.totalRevenue,
          bestSellerRank: product.bestSellerRank || 999,
          averageRating: product.averageRating,
          viewsCount: product.viewsCount,

          designCloudinaryUrl: product.designCloudinaryUrl,
          designWidth: standardizedDesignPositions[0]?.position.designWidth || 1200,
          designHeight: standardizedDesignPositions[0]?.position.designHeight || 1200,
          designFormat: product.designFormat,
          designScale: product.designScale,
          designPositioning: product.designPositioning,
          designPositions: standardizedDesignPositions,

          baseProduct: {
            id: product.baseProduct.id,
            name: product.baseProduct.name,
            genre: product.baseProduct.genre,
            categories: product.baseProduct.categories.map(cat => ({ id: cat.id, name: cat.name })),
            colorVariations: product.baseProduct.colorVariations.map(color => ({
              id: color.id,
              name: color.name,
              colorCode: color.colorCode,
              images: processImageDelimitations(color.images)
            }))
          },

          vendor: {
            id: product.vendor.id,
            firstName: product.vendor.firstName,
            lastName: product.vendor.lastName,
            email: product.vendor.email,
            profilePhotoUrl: product.vendor.profile_photo_url,
            businessName: product.vendor.shop_name
          },

          createdAt: product.createdAt,
          lastSaleDate: product.lastSaleDate
        };
      });

      return {
        success: true,
        data: formattedProducts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        },
        stats
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        pagination: { total: 0, limit, offset, hasMore: false },
        stats: { totalBestSellers: 0, categoriesCount: 0, vendorsCount: 0 }
      };
    }
  }

  /**
   * 📊 Récupérer les statistiques des best-sellers
   */
  async getBestSellersStats() {
    const [totalBestSellers, categoriesResult, vendorsResult] = await Promise.all([
      this.prisma.vendorProduct.count({
        where: {
          isBestSeller: true,
          isValidated: true,
          status: 'PUBLISHED',
          isDelete: false
        }
      }),
      this.prisma.vendorProduct.findMany({
        where: {
          isBestSeller: true,
          isValidated: true,
          status: 'PUBLISHED',
          isDelete: false
        },
        include: {
          baseProduct: {
            include: {
              categories: true
            }
          }
        }
      }),
      this.prisma.vendorProduct.groupBy({
        by: ['vendorId'],
        where: {
          isBestSeller: true,
          isValidated: true,
          status: 'PUBLISHED',
          isDelete: false
        }
      })
    ]);

    // Compter les catégories uniques
    const uniqueCategories = new Set();
    categoriesResult.forEach(product => {
      product.baseProduct.categories.forEach(cat => {
        uniqueCategories.add(cat.name);
      });
    });

    return {
      totalBestSellers,
      categoriesCount: uniqueCategories.size,
      vendorsCount: vendorsResult.length
    };
  }

  /**
   * 🔄 Mettre à jour les rangs des best-sellers
   * Appelé automatiquement chaque jour à minuit
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateBestSellersRanking(): Promise<void> {
    console.log('🏆 [CRON] Mise à jour des rangs best-sellers...');

    try {
      // 1. Récupérer tous les produits vendeur validés et publiés
      const products = await this.prisma.vendorProduct.findMany({
        where: {
          isValidated: true,
          status: 'PUBLISHED',
          isDelete: false
        },
        orderBy: [
          { salesCount: 'desc' },
          { totalRevenue: 'desc' },
          { viewsCount: 'desc' }
        ]
      });

      console.log(`📊 [CRON] ${products.length} produits à analyser`);

      // 2. Déterminer qui sont les best-sellers (top 10% ou minimum 5 ventes)
      const minSalesForBestSeller = Math.max(5, Math.floor(products.length * 0.1));
      const bestSellerThreshold = products[Math.min(minSalesForBestSeller - 1, products.length - 1)]?.salesCount || 5;

      console.log(`🎯 [CRON] Seuil best-seller: ${bestSellerThreshold} ventes`);

      // 3. Réinitialiser tous les produits
      await this.prisma.vendorProduct.updateMany({
        data: {
          isBestSeller: false,
          bestSellerRank: null
        }
      });

      // 4. Marquer et ranger les best-sellers
      let rank = 1;
      for (const product of products) {
        if (product.salesCount >= bestSellerThreshold && rank <= 100) {
          await this.prisma.vendorProduct.update({
            where: { id: product.id },
            data: {
              isBestSeller: true,
              bestSellerRank: rank,
              bestSellerCategory: await this.determineBestSellerCategory(product.id)
            }
          });
          rank++;
        }
      }

      console.log(`✅ [CRON] ${rank - 1} best-sellers mis à jour`);

    } catch (error) {
      console.error('❌ [CRON] Erreur lors de la mise à jour des best-sellers:', error);
    }
  }

  /**
   * 🏷️ Déterminer la catégorie d'un best-seller
   */
  private async determineBestSellerCategory(productId: number): Promise<string> {
    const product = await this.prisma.vendorProduct.findUnique({
      where: { id: productId },
      include: {
        baseProduct: {
          include: {
            categories: true
          }
        }
      }
    });

    if (!product || !product.baseProduct.categories.length) {
      return 'Général';
    }

    // Retourner la première catégorie
    return product.baseProduct.categories[0].name;
  }

  /**
   * 📈 Incrémenter le nombre de vues d'un produit
   */
  async incrementViews(productId: number): Promise<void> {
    try {
      await this.prisma.vendorProduct.update({
        where: { id: productId },
        data: {
          viewsCount: {
            increment: 1
          }
        }
      });
    } catch (error) {
      console.error(`❌ Erreur lors de l'incrémentation des vues pour le produit ${productId}:`, error);
    }
  }

  /**
   * 💰 Enregistrer une vente (à appeler depuis le système de commandes)
   */
  async recordSale(productId: number, saleAmount: number): Promise<void> {
    try {
      await this.prisma.vendorProduct.update({
        where: { id: productId },
        data: {
          salesCount: {
            increment: 1
          },
          totalRevenue: {
            increment: saleAmount
          },
          lastSaleDate: new Date()
        }
      });

      console.log(`💰 [SALE] Vente enregistrée: Produit ${productId}, Montant: ${saleAmount}€`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'enregistrement de la vente pour le produit ${productId}:`, error);
    }
  }

  /**
   * 🔧 Méthode manuelle pour forcer la mise à jour des rangs
   */
  async forceUpdateRanking(): Promise<{ success: boolean; message: string; bestSellersCount: number }> {
    try {
      await this.updateBestSellersRanking();
      
      const bestSellersCount = await this.prisma.vendorProduct.count({
        where: { isBestSeller: true }
      });

      return {
        success: true,
        message: 'Rangs des best-sellers mis à jour avec succès',
        bestSellersCount
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${error.message}`,
        bestSellersCount: 0
      };
    }
  }
} 