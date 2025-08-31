import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { RealBestSellersService, BestSellersOptions } from './real-best-sellers.service';

@ApiTags('🏆 Meilleures Ventes (Données Réelles)')
@Controller('public')
export class RealBestSellersController {
  private readonly logger = new Logger(RealBestSellersController.name);

  constructor(private readonly realBestSellersService: RealBestSellersService) {}

  /**
   * 🏆 Endpoint public pour récupérer les meilleures ventes basées sur les vraies commandes
   */
  @Get('real-best-sellers')
  @ApiOperation({
    summary: 'Meilleures Ventes Basées sur les Vraies Commandes',
    description: `
      Récupère les produits avec les meilleures ventes basées sur les données réelles de commande.
      
      **Logique :**
      - Analyse les commandes LIVRÉES uniquement
      - Calcule le total des unités vendues par produit (SUM(quantity))
      - Groupe par produit et trie par nombre total d'unités vendues
      - Supporte le filtrage par période, vendeur, catégorie
      - Inclut les statistiques détaillées (revenus, clients uniques, etc.)
      
      **Périodes supportées :**
      - day: Dernières 24h
      - week: 7 derniers jours  
      - month: 30 derniers jours
      - year: 365 derniers jours
      - all: Depuis le début (défaut)
    `
  })
  @ApiQuery({ 
    name: 'period', 
    required: false, 
    enum: ['day', 'week', 'month', 'year', 'all'],
    description: 'Période d\'analyse des ventes',
    example: 'month'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: 'number', 
    description: 'Nombre de produits à récupérer',
    example: 10 
  })
  @ApiQuery({ 
    name: 'offset', 
    required: false, 
    type: 'number', 
    description: 'Décalage pour la pagination',
    example: 0 
  })
  @ApiQuery({ 
    name: 'vendorId', 
    required: false, 
    type: 'number', 
    description: 'Filtrer par vendeur spécifique' 
  })
  @ApiQuery({ 
    name: 'categoryId', 
    required: false, 
    type: 'number', 
    description: 'Filtrer par catégorie spécifique' 
  })
  @ApiQuery({ 
    name: 'minSales', 
    required: false, 
    type: 'number', 
    description: 'Nombre minimum de ventes requises',
    example: 1 
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des meilleures ventes récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            bestSellers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  vendorProductId: { type: 'number', example: 1 },
                  productName: { type: 'string', example: 'T-shirt Design Unique' },
                  vendorName: { type: 'string', example: 'John Doe' },
                  businessName: { type: 'string', example: 'Boutique John' },
                  totalQuantitySold: { type: 'number', example: 45 },
                  totalRevenue: { type: 'number', example: 112500 },
                  averageUnitPrice: { type: 'number', example: 2500 },
                  uniqueCustomers: { type: 'number', example: 32 },
                  category: { type: 'string', example: 'Vêtements' },
                  rank: { type: 'number', example: 1 }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                total: { type: 'number', example: 25 },
                limit: { type: 'number', example: 10 },
                offset: { type: 'number', example: 0 },
                hasMore: { type: 'boolean', example: true }
              }
            },
            stats: {
              type: 'object',
              properties: {
                totalProducts: { type: 'number', example: 25 },
                totalRevenue: { type: 'number', example: 1250000 },
                totalQuantitySold: { type: 'number', example: 500 },
                period: { type: 'string', example: 'month' }
              }
            }
          }
        }
      }
    }
  })
  async getRealBestSellers(
    @Query('period') period?: 'day' | 'week' | 'month' | 'year' | 'all',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('vendorId') vendorId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('minSales') minSales?: string,
  ) {
    const startTime = Date.now();
    
    this.logger.log(`🏆 Récupération meilleures ventes réelles - Période: ${period || 'all'}, Limite: ${limit || 10}`);
    
    try {
      const options: BestSellersOptions = {
        period: period || 'all',
        limit: limit ? parseInt(limit) : 10,
        offset: offset ? parseInt(offset) : 0,
        vendorId: vendorId ? parseInt(vendorId) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        minSales: minSales ? parseInt(minSales) : 1,
      };

      const result = await this.realBestSellersService.getRealBestSellers(options);
      
      const executionTime = Date.now() - startTime;
      this.logger.log(`✅ Meilleures ventes récupérées: ${result.data.bestSellers.length} produits en ${executionTime}ms`);
      
      return {
        success: true,
        message: `Meilleures ventes récupérées (période: ${options.period})`,
        data: result.data,
        meta: {
          executionTime: `${executionTime}ms`,
          queryOptions: options
        }
      };
      
    } catch (error) {
      this.logger.error(`❌ Erreur récupération meilleures ventes: ${error.message}`);
      return {
        success: false,
        message: 'Erreur lors de la récupération des meilleures ventes',
        error: error.message,
        data: {
          bestSellers: [],
          pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
          stats: { totalProducts: 0, totalRevenue: 0, totalQuantitySold: 0, period: 'all' }
        }
      };
    }
  }

  /**
   * 🔄 Endpoint pour forcer la mise à jour du cache des meilleures ventes
   */
  @Get('real-best-sellers/refresh-cache')
  @ApiOperation({
    summary: 'Rafraîchir le Cache des Meilleures Ventes',
    description: 'Force la mise à jour du cache des meilleures ventes basé sur les vraies données'
  })
  async refreshBestSellersCache() {
    this.logger.log('🔄 Rafraîchissement du cache des meilleures ventes...');
    
    try {
      await this.realBestSellersService.updateBestSellersCache();
      
      return {
        success: true,
        message: 'Cache des meilleures ventes mis à jour avec succès',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Erreur rafraîchissement cache: ${error.message}`);
      return {
        success: false,
        message: 'Erreur lors de la mise à jour du cache',
        error: error.message
      };
    }
  }
} 