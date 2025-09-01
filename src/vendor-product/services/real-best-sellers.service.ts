import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface BestSellersOptions {
  period?: 'day' | 'week' | 'month' | 'all';
  limit?: number;
  offset?: number;
  vendorId?: number;
  categoryId?: number;
  minSales?: number;
}

export interface BestSellerProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  uniqueCustomers: number;
  firstSaleDate: Date;
  lastSaleDate: Date;
  rank: number;
  vendor: {
    id: number;
    name: string;
    shopName?: string;
    profilePhotoUrl?: string;
  };
  baseProduct: {
    id: number;
    name: string;
    categories: string[];
  };
  design?: {
    id: number;
    name?: string;
    cloudinaryUrl?: string;
  };
  mainImage?: string;
}

export interface BestSellersResponse {
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
    totalRevenue: number;
    averageOrderValue: number;
    periodAnalyzed: string;
  };
  cacheInfo?: {
    cached: boolean;
    cacheAge: number;
  };
}

// Cache simple en mémoire
interface CacheEntry {
  data: BestSellersResponse;
  timestamp: number;
  key: string;
}

@Injectable()
export class RealBestSellersService {
  private readonly logger = new Logger(RealBestSellersService.name);
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor(private prisma: PrismaService) {}

  /**
   * 🏆 Récupérer les meilleures ventes basées sur les vraies données de commande
   */
  async getRealBestSellers(options: BestSellersOptions = {}): Promise<BestSellersResponse> {
    const {
      period = 'all',
      limit = 10,
      offset = 0,
      vendorId,
      categoryId,
      minSales = 1
    } = options;

    // Générer clé de cache
    const cacheKey = this.generateCacheKey(options);
    
    // Vérifier le cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.log(`📦 Cache hit pour les meilleures ventes (${cacheKey})`);
      return {
        ...cached.data,
        cacheInfo: {
          cached: true,
          cacheAge: Date.now() - cached.timestamp
        }
      };
    }

    this.logger.log(`🔍 Calcul des meilleures ventes - Période: ${period}, Limite: ${limit}`);

    try {
      // 1. Calculer la période d'analyse
      const dateRange = this.calculateDateRange(period);
      this.logger.log(`📅 Période d'analyse: ${dateRange.from.toISOString()} → ${dateRange.to.toISOString()}`);

      // 2. Requête SQL optimisée pour récupérer les meilleures ventes
      const rawQuery = `
        SELECT 
          vp.id as vendor_product_id,
          vp.name as product_name,
          vp.description as product_description,
          vp.price as product_price,
          vp."vendorId" as vendor_id,
          vp."designCloudinaryUrl" as design_url,
          
          -- Informations vendeur
          u."firstName" || ' ' || u."lastName" as vendor_name,
          u.shop_name as shop_name,
          u.profile_photo_url as profile_photo_url,
          
          -- Informations produit de base
          p.name as base_product_name,
          p.id as base_product_id,
          
          -- Informations design
          d.id as design_id,
          d.name as design_name,
          d."cloudinaryUrl" as design_cloudinary_url,
          
          -- Agrégations des ventes
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.quantity * oi."unitPrice") as total_revenue,
          AVG(oi."unitPrice") as average_unit_price,
          COUNT(DISTINCT o."userId") as unique_customers,
          MIN(o."createdAt") as first_sale_date,
          MAX(o."createdAt") as last_sale_date,
          COUNT(DISTINCT o.id) as total_orders,
          
          -- Image principale du produit
          (
            SELECT cv.images->0->>'url' 
            FROM "ColorVariation" cv 
            WHERE cv."productId" = p.id 
            LIMIT 1
          ) as main_image,
          
          -- Catégories du produit
          (
            SELECT string_agg(cat.name, ', ') 
            FROM "_ProductToCategory" ptc
            JOIN "Category" cat ON cat.id = ptc."B"
            WHERE ptc."A" = p.id
          ) as categories
          
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "VendorProduct" vp ON vp.id = oi."productId"
        JOIN "Product" p ON p.id = vp."baseProductId"
        JOIN "User" u ON u.id = vp."vendorId"
        LEFT JOIN "Design" d ON d.id = vp."designId"
        
        WHERE 
          o.status = 'DELIVERED'
          AND o."createdAt" >= $1
          AND o."createdAt" <= $2
          AND vp."isDelete" = false
          AND vp.status = 'PUBLISHED'
          ${vendorId ? 'AND vp."vendorId" = $3' : ''}
          ${categoryId ? `AND EXISTS (
            SELECT 1 FROM "_ProductToCategory" ptc 
            WHERE ptc."A" = p.id AND ptc."B" = ${categoryId}
          )` : ''}
          
        GROUP BY 
          vp.id, vp.name, vp.description, vp.price, vp."vendorId", vp."designCloudinaryUrl",
          u."firstName", u."lastName", u.shop_name, u.profile_photo_url,
          p.name, p.id, d.id, d.name, d."cloudinaryUrl"
          
        HAVING SUM(oi.quantity) >= $${vendorId ? '4' : '3'}
        
        ORDER BY total_quantity_sold DESC, total_revenue DESC
        LIMIT $${vendorId ? '5' : '4'} OFFSET $${vendorId ? '6' : '5'}
      `;

      // 3. Exécuter la requête
      const queryParams = [
        dateRange.from,
        dateRange.to,
        minSales,
        limit,
        offset
      ];

      if (vendorId) {
        queryParams.splice(2, 0, vendorId);
      }

      const rawResults = await this.prisma.$queryRawUnsafe(rawQuery, ...queryParams);

      // 4. Transformer les résultats
      const bestSellers: BestSellerProduct[] = (rawResults as any[]).map((row, index) => ({
        id: row.vendor_product_id,
        name: row.product_name,
        description: row.product_description,
        price: Number(row.product_price),
        totalQuantitySold: Number(row.total_quantity_sold),
        totalRevenue: Number(row.total_revenue),
        averageUnitPrice: Number(row.average_unit_price),
        uniqueCustomers: Number(row.unique_customers),
        firstSaleDate: row.first_sale_date,
        lastSaleDate: row.last_sale_date,
        rank: offset + index + 1,
        vendor: {
          id: row.vendor_id,
          name: row.vendor_name,
          shopName: row.shop_name,
          profilePhotoUrl: row.profile_photo_url
        },
        baseProduct: {
          id: row.base_product_id,
          name: row.base_product_name,
          categories: row.categories ? row.categories.split(', ') : []
        },
        design: row.design_id ? {
          id: row.design_id,
          name: row.design_name,
          cloudinaryUrl: row.design_cloudinary_url
        } : undefined,
        mainImage: row.main_image || row.design_url
      }));

      // 5. Calculer les statistiques globales
      const totalStatsQuery = `
        SELECT 
          COUNT(DISTINCT vp.id) as total_best_sellers,
          SUM(oi.quantity * oi."unitPrice") as total_revenue,
          AVG(oi.quantity * oi."unitPrice") as average_order_value
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "VendorProduct" vp ON vp.id = oi."productId"
        WHERE 
          o.status = 'DELIVERED'
          AND o."createdAt" >= $1
          AND o."createdAt" <= $2
          AND vp."isDelete" = false
          AND vp.status = 'PUBLISHED'
          ${vendorId ? 'AND vp."vendorId" = $3' : ''}
      `;

      const statsParams: (Date | number)[] = [dateRange.from, dateRange.to];
      if (vendorId) {
        statsParams.push(vendorId);
      }

      const statsResult = await this.prisma.$queryRawUnsafe(totalStatsQuery, ...statsParams);
      const stats = (statsResult as any[])[0];

      // 6. Construire la réponse
      const response: BestSellersResponse = {
        success: true,
        data: bestSellers,
        pagination: {
          total: Number(stats.total_best_sellers) || 0,
          limit,
          offset,
          hasMore: bestSellers.length === limit
        },
        stats: {
          totalBestSellers: Number(stats.total_best_sellers) || 0,
          totalRevenue: Number(stats.total_revenue) || 0,
          averageOrderValue: Number(stats.average_order_value) || 0,
          periodAnalyzed: this.getPeriodLabel(period, dateRange)
        }
      };

      // 7. Mettre en cache
      this.setCache(cacheKey, response);

      this.logger.log(`✅ ${bestSellers.length} meilleures ventes calculées pour la période ${period}`);
      return response;

    } catch (error) {
      this.logger.error('❌ Erreur lors du calcul des meilleures ventes:', error);
      throw error;
    }
  }

  /**
   * 🔄 Mettre à jour les statistiques d'un produit après une vente
   */
  async updateProductSalesStats(vendorProductId: number, quantity: number, unitPrice: number): Promise<void> {
    try {
      await this.prisma.vendorProduct.update({
        where: { id: vendorProductId },
        data: {
          salesCount: { increment: quantity },
          totalRevenue: { increment: quantity * unitPrice },
          lastSaleDate: new Date()
        }
      });

      // Invalider le cache
      this.invalidateCache();

      this.logger.log(`📊 Statistiques mises à jour pour le produit ${vendorProductId}: +${quantity} ventes, +${(quantity * unitPrice).toFixed(2)}€`);
    } catch (error) {
      this.logger.error(`❌ Erreur mise à jour statistiques produit ${vendorProductId}:`, error);
    }
  }

  /**
   * 🏷️ Marquer automatiquement les meilleurs vendeurs
   */
  async markTopSellers(period: 'day' | 'week' | 'month' | 'all' = 'month'): Promise<void> {
    try {
      this.logger.log(`🏆 Marquage des top sellers pour la période: ${period}`);

      // 1. Réinitialiser tous les produits
      await this.prisma.vendorProduct.updateMany({
        data: {
          isBestSeller: false,
          bestSellerRank: null,
          bestSellerCategory: null
        }
      });

      // 2. Récupérer les top 50 pour différentes catégories
      const topSellers = await this.getRealBestSellers({
        period,
        limit: 50,
        minSales: 5
      });

      // 3. Marquer les produits comme best-sellers
      for (let i = 0; i < topSellers.data.length; i++) {
        const product = topSellers.data[i];
        await this.prisma.vendorProduct.update({
          where: { id: product.id },
          data: {
            isBestSeller: true,
            bestSellerRank: i + 1,
            bestSellerCategory: 'GLOBAL',
            salesCount: product.totalQuantitySold,
            totalRevenue: product.totalRevenue,
            lastSaleDate: product.lastSaleDate
          }
        });
      }

      this.logger.log(`✅ ${topSellers.data.length} produits marqués comme best-sellers`);
    } catch (error) {
      this.logger.error('❌ Erreur lors du marquage des top sellers:', error);
    }
  }

  /**
   * 📅 Calculer la période d'analyse
   */
  private calculateDateRange(period: string): { from: Date; to: Date } {
    const now = new Date();
    const to = new Date(now);
    let from: Date;

    switch (period) {
      case 'day':
        from = new Date(now);
        from.setHours(0, 0, 0, 0);
        break;
      case 'week':
        from = new Date(now);
        from.setDate(now.getDate() - 7);
        break;
      case 'month':
        from = new Date(now);
        from.setMonth(now.getMonth() - 1);
        break;
      case 'all':
      default:
        from = new Date('2020-01-01'); // Date de début de l'application
        break;
    }

    return { from, to };
  }

  /**
   * 🏷️ Obtenir le libellé de la période
   */
  private getPeriodLabel(period: string, dateRange: { from: Date; to: Date }): string {
    switch (period) {
      case 'day':
        return 'Dernières 24h';
      case 'week':
        return '7 derniers jours';
      case 'month':
        return '30 derniers jours';
      case 'all':
        return `Depuis le ${dateRange.from.toLocaleDateString('fr-FR')}`;
      default:
        return period;
    }
  }

  /**
   * 🔑 Générer une clé de cache
   */
  private generateCacheKey(options: BestSellersOptions): string {
    const { period, limit, offset, vendorId, categoryId, minSales } = options;
    return `best-sellers:${period}:${limit}:${offset}:${vendorId || 'all'}:${categoryId || 'all'}:${minSales}`;
  }

  /**
   * 📦 Récupérer du cache
   */
  private getFromCache(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Vérifier si le cache est encore valide
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * 💾 Sauvegarder en cache
   */
  private setCache(key: string, data: BestSellersResponse): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });

    // Nettoyer le cache si trop d'entrées
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 🗑️ Invalider le cache
   */
  private invalidateCache(): void {
    this.cache.clear();
    this.logger.log('🗑️ Cache des meilleures ventes invalidé');
  }

  /**
   * 📊 Obtenir les statistiques du cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
} 