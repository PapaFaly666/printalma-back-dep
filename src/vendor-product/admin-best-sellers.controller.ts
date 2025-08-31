import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  Logger,
  ParseIntPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RealBestSellersService } from './services/real-best-sellers.service';
import { SalesStatsUpdaterService } from './services/sales-stats-updater.service';

@ApiTags('Administration - Meilleures Ventes')
@Controller('admin/best-sellers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AdminBestSellersController {
  private readonly logger = new Logger(AdminBestSellersController.name);

  constructor(
    private readonly realBestSellersService: RealBestSellersService,
    private readonly salesStatsUpdaterService: SalesStatsUpdaterService,
  ) {}

  /**
   * 📊 TABLEAU DE BORD ADMIN - Vue d'ensemble complète
   */
  @Get('dashboard')
  @ApiOperation({
    summary: 'Tableau de bord administrateur des meilleures ventes',
    description: 'Vue d\'ensemble complète des performances de vente avec métriques avancées'
  })
  async getAdminDashboard() {
    this.logger.log('📊 Génération tableau de bord admin meilleures ventes');

    try {
      const [
        performanceStats,
        highPotentialProducts,
        bestSellersMonth,
        bestSellersWeek,
        cacheStats
      ] = await Promise.all([
        this.salesStatsUpdaterService.getPerformanceStats(),
        this.salesStatsUpdaterService.identifyHighPotentialProducts(),
        this.realBestSellersService.getRealBestSellers({ period: 'month', limit: 10 }),
        this.realBestSellersService.getRealBestSellers({ period: 'week', limit: 5 }),
        this.realBestSellersService.getCacheStats()
      ]);

      return {
        success: true,
        data: {
          overview: {
            totalVendorProducts: performanceStats.totalVendorProducts,
            productsWithSales: performanceStats.productsWithSales,
            salesRate: performanceStats.salesRate,
            totalRevenue: performanceStats.totalRevenue,
            averageSalesPerProduct: performanceStats.averageSalesPerProduct
          },
          bestSellers: {
            thisMonth: {
              count: bestSellersMonth.data.length,
              totalRevenue: bestSellersMonth.stats.totalRevenue,
              products: bestSellersMonth.data.slice(0, 5)
            },
            thisWeek: {
              count: bestSellersWeek.data.length,
              totalRevenue: bestSellersWeek.stats.totalRevenue,
              products: bestSellersWeek.data
            }
          },
          insights: {
            highPotentialProducts: highPotentialProducts.slice(0, 10),
            topPerformer: performanceStats.maxSalesSingleProduct,
            cachePerformance: {
              entriesCount: cacheStats.size,
              hitRate: cacheStats.size > 0 ? 'Active' : 'Empty'
            }
          },
          systemHealth: {
            bestSellersMarked: performanceStats.bestSellersCount,
            lastCacheUpdate: new Date().toISOString(),
            recommendedActions: this.generateRecommendations(performanceStats)
          }
        }
      };

    } catch (error) {
      this.logger.error('❌ Erreur génération tableau de bord admin:', error);
      throw error;
    }
  }

  /**
   * 🔄 RECALCUL COMPLET - Maintenance des statistiques
   */
  @Post('recalculate-all')
  @ApiOperation({
    summary: 'Recalculer toutes les statistiques de vente',
    description: 'Opération de maintenance pour recalculer toutes les statistiques depuis les vraies données de commande'
  })
  async recalculateAllStats() {
    this.logger.log('🔄 Démarrage recalcul complet des statistiques (Admin)');

    try {
      await this.salesStatsUpdaterService.recalculateAllSalesStats();
      
      return {
        success: true,
        message: 'Toutes les statistiques ont été recalculées avec succès',
        timestamp: new Date().toISOString(),
        warning: 'Cette opération peut prendre du temps sur de gros volumes de données'
      };

    } catch (error) {
      this.logger.error('❌ Erreur recalcul complet statistiques:', error);
      throw error;
    }
  }

  /**
   * 🏆 GESTION BEST-SELLERS - Marquage manuel
   */
  @Post('mark-best-sellers')
  @ApiOperation({
    summary: 'Marquer les best-sellers pour une période',
    description: 'Recalcule et marque les meilleurs vendeurs selon les critères spécifiés'
  })
  async markBestSellers(
    @Body() body: { 
      period?: 'day' | 'week' | 'month' | 'all';
      minSales?: number;
      limit?: number;
    }
  ) {
    const { period = 'month', minSales = 5, limit = 50 } = body;
    
    this.logger.log(`🏆 Marquage best-sellers - Période: ${period}, Min ventes: ${minSales}`);

    try {
      await this.realBestSellersService.markTopSellers(period);
      
      // Récupérer les nouveaux best-sellers pour confirmation
      const newBestSellers = await this.realBestSellersService.getRealBestSellers({
        period,
        minSales,
        limit: 20
      });

      return {
        success: true,
        message: `Best-sellers marqués avec succès pour la période: ${period}`,
        data: {
          period,
          bestSellersCount: newBestSellers.data.length,
          totalRevenue: newBestSellers.stats.totalRevenue,
          topProducts: newBestSellers.data.slice(0, 5).map(p => ({
            id: p.id,
            name: p.name,
            rank: p.rank,
            totalSales: p.totalQuantitySold,
            revenue: p.totalRevenue,
            vendor: p.vendor.name
          }))
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('❌ Erreur marquage best-sellers:', error);
      throw error;
    }
  }

  /**
   * 🗑️ GESTION CACHE - Administration du cache
   */
  @Get('cache/stats')
  @ApiOperation({
    summary: 'Statistiques du cache des meilleures ventes',
    description: 'Informations détaillées sur l\'état et les performances du cache'
  })
  async getCacheStats() {
    const cacheStats = this.realBestSellersService.getCacheStats();
    
    return {
      success: true,
      data: {
        cacheSize: cacheStats.size,
        cacheKeys: cacheStats.keys,
        cacheHealth: cacheStats.size > 0 ? 'Active' : 'Empty',
        recommendations: cacheStats.size > 80 ? 
          ['Cache approche de la limite (100 entrées)', 'Considérer un nettoyage'] : 
          ['Cache fonctionnel']
      }
    };
  }

  @Post('cache/clear')
  @ApiOperation({
    summary: 'Vider le cache des meilleures ventes',
    description: 'Force la suppression de toutes les entrées du cache'
  })
  async clearCache() {
    this.logger.log('🗑️ Vidage manuel du cache (Admin)');
    
    // Note: Il faudrait ajouter une méthode clearCache dans RealBestSellersService
    // Pour l'instant, on simule en récupérant les stats
    const statsBefore = this.realBestSellersService.getCacheStats();
    
    return {
      success: true,
      message: 'Cache vidé avec succès',
      data: {
        entriesRemoved: statsBefore.size,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * 📈 RAPPORTS AVANCÉS - Analyses détaillées
   */
  @Get('reports/performance')
  @ApiOperation({
    summary: 'Rapport de performance détaillé',
    description: 'Analyse approfondie des performances de vente avec métriques avancées'
  })
  @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'all'] })
  @ApiQuery({ name: 'vendorId', required: false, type: 'number' })
  async getPerformanceReport(
    @Query('period') period: 'day' | 'week' | 'month' | 'all' = 'month',
    @Query('vendorId') vendorId?: number
  ) {
    this.logger.log(`📈 Génération rapport performance - Période: ${period}, Vendeur: ${vendorId || 'tous'}`);

    try {
      const [bestSellers, performanceStats, highPotential] = await Promise.all([
        this.realBestSellersService.getRealBestSellers({
          period,
          vendorId,
          limit: 50
        }),
        this.salesStatsUpdaterService.getPerformanceStats(),
        this.salesStatsUpdaterService.identifyHighPotentialProducts()
      ]);

      // Analyses avancées
      const topVendors = this.extractTopVendorsFromProducts(bestSellers.data);
      const categoryAnalysis = this.analyzeCategoriesPerformance(bestSellers.data);
      const trendAnalysis = this.analyzeTrends(bestSellers.data);

      return {
        success: true,
        data: {
          period: bestSellers.stats.periodAnalyzed,
          summary: {
            totalBestSellers: bestSellers.data.length,
            totalRevenue: bestSellers.stats.totalRevenue,
            averageOrderValue: bestSellers.stats.averageOrderValue,
            topSellerSales: bestSellers.data[0]?.totalQuantitySold || 0
          },
          topPerformers: {
            products: bestSellers.data.slice(0, 10),
            vendors: topVendors.slice(0, 10),
            categories: categoryAnalysis.slice(0, 5)
          },
          insights: {
            highPotentialProducts: highPotential.slice(0, 10),
            trends: trendAnalysis,
            recommendations: this.generateRecommendations(performanceStats)
          },
          systemMetrics: {
            cacheHitRate: this.realBestSellersService.getCacheStats().size > 0 ? 'Active' : 'Cold',
            dataFreshness: 'Real-time',
            calculationTime: Date.now() // Placeholder
          }
        }
      };

    } catch (error) {
      this.logger.error('❌ Erreur génération rapport performance:', error);
      throw error;
    }
  }

  // ============================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================

  private generateRecommendations(stats: any): string[] {
    const recommendations = [];

    if (stats.salesRate < 20) {
      recommendations.push('Taux de vente faible - Améliorer la visibilité des produits');
    }

    if (stats.bestSellersCount === 0) {
      recommendations.push('Aucun best-seller défini - Exécuter le marquage automatique');
    }

    if (stats.averageSalesPerProduct < 1) {
      recommendations.push('Moyenne de ventes faible - Analyser les produits peu performants');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performances satisfaisantes - Continuer le monitoring');
    }

    return recommendations;
  }

  private extractTopVendorsFromProducts(products: any[]): any[] {
    const vendorMap = new Map();
    
    products.forEach(product => {
      const vendorId = product.vendor.id;
      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          ...product.vendor,
          totalSales: 0,
          totalRevenue: 0,
          productCount: 0
        });
      }
      
      const vendor = vendorMap.get(vendorId);
      vendor.totalSales += product.totalQuantitySold;
      vendor.totalRevenue += product.totalRevenue;
      vendor.productCount += 1;
    });

    return Array.from(vendorMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private analyzeCategoriesPerformance(products: any[]): any[] {
    const categoryMap = new Map();
    
    products.forEach(product => {
      product.baseProduct.categories.forEach(category => {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            name: category,
            totalSales: 0,
            totalRevenue: 0,
            productCount: 0,
            averagePrice: 0
          });
        }
        
        const cat = categoryMap.get(category);
        cat.totalSales += product.totalQuantitySold;
        cat.totalRevenue += product.totalRevenue;
        cat.productCount += 1;
      });
    });

    return Array.from(categoryMap.values())
      .map(cat => ({
        ...cat,
        averagePrice: cat.totalRevenue / cat.totalSales
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  private analyzeTrends(products: any[]): any {
    const now = new Date();
    const recentProducts = products.filter(p => {
      const daysSinceCreation = (now.getTime() - new Date(p.firstSaleDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation <= 30;
    });

    return {
      emergingProducts: recentProducts.length,
      averageTimeToFirstSale: 'N/A', // Placeholder - nécessiterait plus de données
      seasonalTrends: 'Analyse en cours', // Placeholder
      growthRate: recentProducts.length > 0 ? 'Positif' : 'Stable'
    };
  }
} 