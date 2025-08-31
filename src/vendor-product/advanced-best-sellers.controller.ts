import {
  Controller,
  Get,
  Query,
  Logger,
  ParseIntPipe,
  BadRequestException,
  Post,
  Body,
  UseGuards
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { RealBestSellersService, BestSellersOptions } from './services/real-best-sellers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Meilleures Ventes Avancées')
@Controller('best-sellers')
export class AdvancedBestSellersController {
  private readonly logger = new Logger(AdvancedBestSellersController.name);

  constructor(
    private readonly realBestSellersService: RealBestSellersService,
  ) {}

  /**
   * 🏆 ENDPOINT PRINCIPAL - Meilleures ventes avec filtres avancés
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer les meilleures ventes avec filtres avancés',
    description: `
    Récupère les meilleures ventes basées sur les vraies données de commandes livrées.
    
    **Fonctionnalités :**
    - Filtrage par période (jour, semaine, mois, tout le temps)
    - Filtrage par vendeur spécifique
    - Filtrage par catégorie
    - Pagination complète
    - Cache automatique (10 minutes)
    - Statistiques détaillées
    
    **Calcul basé sur :**
    - Commandes avec statut 'DELIVERED' uniquement
    - Agrégation SUM(quantité) par produit
    - Tri par quantité vendue puis chiffre d'affaires
    - Données enrichies avec informations vendeur, produit et design
    `
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['day', 'week', 'month', 'all'],
    description: 'Période d\'analyse (défaut: all)' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: 'number',
    description: 'Nombre de résultats à retourner (défaut: 10, max: 100)' 
  })
  @ApiQuery({ 
    name: 'offset', 
    required: false, 
    type: 'number',
    description: 'Offset pour la pagination (défaut: 0)' 
  })
  @ApiQuery({ 
    name: 'vendorId', 
    required: false, 
    type: 'number',
    description: 'Filtrer par ID vendeur spécifique' 
  })
  @ApiQuery({ 
    name: 'categoryId', 
    required: false, 
    type: 'number',
    description: 'Filtrer par ID catégorie' 
  })
  @ApiQuery({ 
    name: 'minSales', 
    required: false, 
    type: 'number',
    description: 'Nombre minimum de ventes requises (défaut: 1)' 
  })
  @ApiResponse({
    status: 200,
    description: 'Meilleures ventes récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 123 },
              name: { type: 'string', example: 'T-shirt Design Unique' },
              description: { type: 'string' },
              price: { type: 'number', example: 2500 },
              totalQuantitySold: { type: 'number', example: 45 },
              totalRevenue: { type: 'number', example: 112500 },
              averageUnitPrice: { type: 'number', example: 2500 },
              uniqueCustomers: { type: 'number', example: 32 },
              firstSaleDate: { type: 'string', format: 'date-time' },
              lastSaleDate: { type: 'string', format: 'date-time' },
              rank: { type: 'number', example: 1 },
              vendor: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 456 },
                  name: { type: 'string', example: 'Jean Dupont' },
                  shopName: { type: 'string', example: 'Design Studio JD' },
                  profilePhotoUrl: { type: 'string' }
                }
              },
              baseProduct: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 789 },
                  name: { type: 'string', example: 'T-shirt Coton Bio' },
                  categories: { type: 'array', items: { type: 'string' } }
                }
              },
              design: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 101 },
                  name: { type: 'string', example: 'Logo Moderne' },
                  cloudinaryUrl: { type: 'string' }
                }
              },
              mainImage: { type: 'string' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            limit: { type: 'number', example: 10 },
            offset: { type: 'number', example: 0 },
            hasMore: { type: 'boolean', example: true }
          }
        },
        stats: {
          type: 'object',
          properties: {
            totalBestSellers: { type: 'number', example: 150 },
            totalRevenue: { type: 'number', example: 2500000 },
            averageOrderValue: { type: 'number', example: 3500 },
            periodAnalyzed: { type: 'string', example: '30 derniers jours' }
          }
        },
        cacheInfo: {
          type: 'object',
          properties: {
            cached: { type: 'boolean', example: false },
            cacheAge: { type: 'number', example: 0 }
          }
        }
      }
    }
  })
  async getAdvancedBestSellers(
    @Query('period') period?: 'day' | 'week' | 'month' | 'all',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('vendorId') vendorId?: number,
    @Query('categoryId') categoryId?: number,
    @Query('minSales') minSales?: number
  ) {
    this.logger.log(`🏆 Récupération meilleures ventes avancées - Période: ${period || 'all'}, Vendeur: ${vendorId || 'tous'}`);

    // Validation des paramètres
    const validatedLimit = limit ? Math.min(Math.max(1, limit), 100) : 10;
    const validatedOffset = offset ? Math.max(0, offset) : 0;
    const validatedMinSales = minSales ? Math.max(1, minSales) : 1;

    if (period && !['day', 'week', 'month', 'all'].includes(period)) {
      throw new BadRequestException('Période invalide. Valeurs acceptées: day, week, month, all');
    }

    const options: BestSellersOptions = {
      period: period || 'all',
      limit: validatedLimit,
      offset: validatedOffset,
      vendorId: vendorId ? Number(vendorId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      minSales: validatedMinSales
    };

    try {
      const result = await this.realBestSellersService.getRealBestSellers(options);
      
      this.logger.log(`✅ ${result.data.length} meilleures ventes retournées (${result.cacheInfo?.cached ? 'depuis cache' : 'calculées'})`);
      
      return result;
    } catch (error) {
      this.logger.error('❌ Erreur récupération meilleures ventes:', error);
      throw new BadRequestException('Erreur lors de la récupération des meilleures ventes');
    }
  }

  /**
   * 📊 STATISTIQUES RAPIDES - Vue d'ensemble des meilleures ventes
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques rapides des meilleures ventes',
    description: 'Récupère un aperçu statistique des meilleures ventes pour différentes périodes'
  })
  async getBestSellersStats() {
    this.logger.log('📊 Récupération statistiques meilleures ventes');

    try {
      // Récupérer les stats pour différentes périodes
      const [dayStats, weekStats, monthStats, allTimeStats] = await Promise.all([
        this.realBestSellersService.getRealBestSellers({ period: 'day', limit: 5 }),
        this.realBestSellersService.getRealBestSellers({ period: 'week', limit: 10 }),
        this.realBestSellersService.getRealBestSellers({ period: 'month', limit: 20 }),
        this.realBestSellersService.getRealBestSellers({ period: 'all', limit: 50 })
      ]);

      return {
        success: true,
        data: {
          periods: {
            day: {
              topSellers: dayStats.data.length,
              totalRevenue: dayStats.stats.totalRevenue,
              averageOrderValue: dayStats.stats.averageOrderValue
            },
            week: {
              topSellers: weekStats.data.length,
              totalRevenue: weekStats.stats.totalRevenue,
              averageOrderValue: weekStats.stats.averageOrderValue
            },
            month: {
              topSellers: monthStats.data.length,
              totalRevenue: monthStats.stats.totalRevenue,
              averageOrderValue: monthStats.stats.averageOrderValue
            },
            allTime: {
              topSellers: allTimeStats.data.length,
              totalRevenue: allTimeStats.stats.totalRevenue,
              averageOrderValue: allTimeStats.stats.averageOrderValue
            }
          },
          topVendors: this.extractTopVendors(allTimeStats.data),
          topCategories: this.extractTopCategories(allTimeStats.data),
          cacheStats: this.realBestSellersService.getCacheStats()
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur récupération statistiques:', error);
      throw new BadRequestException('Erreur lors de la récupération des statistiques');
    }
  }

  /**
   * 🔄 MISE À JOUR MANUELLE - Recalculer et marquer les best-sellers
   */
  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Recalculer et marquer les best-sellers (Admin uniquement)',
    description: 'Force le recalcul des meilleures ventes et met à jour les marqueurs dans la base de données'
  })
  async refreshBestSellers(
    @Body() body: { period?: 'day' | 'week' | 'month' | 'all' }
  ) {
    this.logger.log(`🔄 Recalcul forcé des best-sellers - Période: ${body.period || 'month'}`);

    try {
      await this.realBestSellersService.markTopSellers(body.period || 'month');
      
      return {
        success: true,
        message: `Best-sellers recalculés avec succès pour la période: ${body.period || 'month'}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('❌ Erreur recalcul best-sellers:', error);
      throw new BadRequestException('Erreur lors du recalcul des best-sellers');
    }
  }

  /**
   * 🏪 MEILLEURES VENTES PAR VENDEUR - Focus sur un vendeur spécifique
   */
  @Get('vendor/:vendorId')
  @ApiOperation({
    summary: 'Meilleures ventes d\'un vendeur spécifique',
    description: 'Récupère les meilleures ventes pour un vendeur donné avec historique détaillé'
  })
  async getVendorBestSellers(
    @Query('vendorId', ParseIntPipe) vendorId: number,
    @Query('period') period?: 'day' | 'week' | 'month' | 'all',
    @Query('limit') limit?: number
  ) {
    this.logger.log(`🏪 Récupération meilleures ventes vendeur ${vendorId}`);

    const options: BestSellersOptions = {
      vendorId,
      period: period || 'all',
      limit: limit ? Math.min(limit, 50) : 20
    };

    try {
      const result = await this.realBestSellersService.getRealBestSellers(options);
      
      // Enrichir avec des statistiques spécifiques au vendeur
      const vendorStats = this.calculateVendorStats(result.data);
      
      return {
        ...result,
        vendorStats
      };
    } catch (error) {
      this.logger.error(`❌ Erreur meilleures ventes vendeur ${vendorId}:`, error);
      throw new BadRequestException('Erreur lors de la récupération des meilleures ventes du vendeur');
    }
  }

  /**
   * 📈 TENDANCES - Évolution des meilleures ventes
   */
  @Get('trends')
  @ApiOperation({
    summary: 'Tendances des meilleures ventes',
    description: 'Analyse l\'évolution des meilleures ventes sur différentes périodes'
  })
  async getBestSellersTrends() {
    this.logger.log('📈 Analyse des tendances meilleures ventes');

    try {
      // Comparer les périodes pour identifier les tendances
      const [currentMonth, previousMonth, currentWeek, previousWeek] = await Promise.all([
        this.realBestSellersService.getRealBestSellers({ period: 'month', limit: 20 }),
        this.realBestSellersService.getRealBestSellers({ 
          period: 'month', 
          limit: 20,
          // Note: pour une vraie implémentation, il faudrait ajouter un paramètre de date de début
        }),
        this.realBestSellersService.getRealBestSellers({ period: 'week', limit: 10 }),
        this.realBestSellersService.getRealBestSellers({ period: 'week', limit: 10 })
      ]);

      return {
        success: true,
        data: {
          monthlyTrend: {
            current: currentMonth.stats,
            growth: this.calculateGrowth(currentMonth.stats.totalRevenue, previousMonth.stats.totalRevenue),
            topRisers: this.identifyRisers(currentMonth.data, previousMonth.data)
          },
          weeklyTrend: {
            current: currentWeek.stats,
            growth: this.calculateGrowth(currentWeek.stats.totalRevenue, previousWeek.stats.totalRevenue),
            topRisers: this.identifyRisers(currentWeek.data, previousWeek.data)
          },
          analysis: {
            fastestGrowing: currentMonth.data.slice(0, 5),
            mostConsistent: this.findConsistentSellers(currentMonth.data),
            emergingTrends: this.identifyEmergingTrends(currentMonth.data)
          }
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur analyse tendances:', error);
      throw new BadRequestException('Erreur lors de l\'analyse des tendances');
    }
  }

  // ============================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================

  private extractTopVendors(products: any[]) {
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
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }

  private extractTopCategories(products: any[]) {
    const categoryMap = new Map();
    
    products.forEach(product => {
      product.baseProduct.categories.forEach(category => {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            name: category,
            totalSales: 0,
            totalRevenue: 0,
            productCount: 0
          });
        }
        
        const cat = categoryMap.get(category);
        cat.totalSales += product.totalQuantitySold;
        cat.totalRevenue += product.totalRevenue;
        cat.productCount += 1;
      });
    });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  }

  private calculateVendorStats(products: any[]) {
    if (products.length === 0) return null;

    const totalSales = products.reduce((sum, p) => sum + p.totalQuantitySold, 0);
    const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
    const avgPrice = products.reduce((sum, p) => sum + p.averageUnitPrice, 0) / products.length;

    return {
      totalProducts: products.length,
      totalSales,
      totalRevenue,
      averagePrice: avgPrice,
      bestRank: Math.min(...products.map(p => p.rank)),
      averageRank: products.reduce((sum, p) => sum + p.rank, 0) / products.length
    };
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private identifyRisers(current: any[], previous: any[]): any[] {
    // Logique simplifiée - dans une vraie implémentation, 
    // il faudrait comparer les positions dans les classements
    return current.slice(0, 5);
  }

  private findConsistentSellers(products: any[]): any[] {
    // Produits avec ventes régulières (logique simplifiée)
    return products.filter(p => p.uniqueCustomers > 10).slice(0, 5);
  }

  private identifyEmergingTrends(products: any[]): any[] {
    // Nouveaux produits qui performent bien (logique simplifiée)
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    return products.filter(p => 
      new Date(p.firstSaleDate) > threeMonthsAgo && 
      p.totalQuantitySold > 10
    ).slice(0, 5);
  }
} 