import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

export interface RealBestSellerProduct {
  id: number;
  vendorProductId: number;
  productName: string;
  vendorName: string;
  businessName?: string;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  firstSaleDate: Date;
  lastSaleDate: Date;
  uniqueCustomers: number;
  productImage?: string;
  category: string;
  vendorId: number;
  baseProductId: number;
  rank: number;
}

export interface BestSellersOptions {
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  limit?: number;
  offset?: number;
  vendorId?: number;
  categoryId?: number;
  minSales?: number;
}

export interface BestSellersResponse {
  success: boolean;
  data: {
    bestSellers: RealBestSellerProduct[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    stats: {
      totalProducts: number;
      totalRevenue: number;
      totalQuantitySold: number;
      period: string;
      dateRange: {
        from: Date;
        to: Date;
      };
    };
  };
}

@Injectable()
export class RealBestSellersService {
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

    console.log('🔍 [REAL-BEST-SELLERS] Options:', options);

    try {
      // 1. Calculer la période d'analyse
      const dateRange = this.calculateDateRange(period);
      console.log('📅 [REAL-BEST-SELLERS] Période d\'analyse:', dateRange);

      // 2. Construire les conditions WHERE
      const whereConditions: any = {
        order: {
          status: 'DELIVERED', // Seulement les commandes livrées
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        }
      };

      // 3. Requête principale avec agrégation
      const rawQuery = `
        SELECT 
          vp.id as vendor_product_id,
          vp.name as product_name,
          vp."vendorId" as vendor_id,
          u."firstName" || ' ' || u."lastName" as vendor_name,
          u.shop_name as business_name,
          p.name as base_product_name,
          p.id as base_product_id,
          
          -- Agrégations des ventes
          SUM(oi.quantity) as total_quantity_sold,
          SUM(oi.quantity * oi."unitPrice") as total_revenue,
          AVG(oi."unitPrice") as average_unit_price,
          COUNT(DISTINCT o."userId") as unique_customers,
          MIN(o."createdAt") as first_sale_date,
          MAX(o."createdAt") as last_sale_date,
          
          -- Images et catégories
          (
            SELECT cv.images->0->>'url' 
            FROM "ColorVariation" cv 
            WHERE cv."productId" = p.id 
            LIMIT 1
          ) as product_image,
          
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
        
        WHERE 
          o.status = 'DELIVERED'
          AND o."createdAt" >= $1
          AND o."createdAt" <= $2
          ${vendorId ? 'AND vp."vendorId" = $3' : ''}
          ${categoryId ? 'AND EXISTS (SELECT 1 FROM "_ProductToCategory" ptc WHERE ptc."A" = p.id AND ptc."B" = $' + (vendorId ? '4' : '3') + ')' : ''}
        
        GROUP BY 
          vp.id, vp.name, vp."vendorId", u."firstName", u."lastName", 
          u.shop_name, p.name, p.id
        
        HAVING SUM(oi.quantity) >= ${minSales}
        
        ORDER BY total_quantity_sold DESC, total_revenue DESC
        
        LIMIT $${vendorId && categoryId ? '5' : vendorId || categoryId ? '4' : '3'}
        OFFSET $${vendorId && categoryId ? '6' : vendorId || categoryId ? '5' : '4'}
      `;

      // 4. Paramètres de la requête
      const queryParams: (Date | number)[] = [dateRange.from, dateRange.to];
      if (vendorId) queryParams.push(vendorId);
      if (categoryId) queryParams.push(categoryId);
      queryParams.push(limit, offset);

      console.log('🔍 [REAL-BEST-SELLERS] Requête SQL:', rawQuery);
      console.log('🔍 [REAL-BEST-SELLERS] Paramètres:', queryParams);

      // 5. Exécuter la requête
      const rawResults = await this.prisma.$queryRawUnsafe(rawQuery, ...queryParams);

      console.log('📊 [REAL-BEST-SELLERS] Résultats bruts:', rawResults);

      // 6. Transformer les résultats
      const bestSellers: RealBestSellerProduct[] = (rawResults as any[]).map((row, index) => ({
        id: row.vendor_product_id,
        vendorProductId: row.vendor_product_id,
        productName: row.product_name || row.base_product_name,
        vendorName: row.vendor_name,
        businessName: row.business_name,
        totalQuantitySold: parseInt(row.total_quantity_sold),
        totalRevenue: parseFloat(row.total_revenue),
        averageUnitPrice: parseFloat(row.average_unit_price),
        firstSaleDate: new Date(row.first_sale_date),
        lastSaleDate: new Date(row.last_sale_date),
        uniqueCustomers: parseInt(row.unique_customers),
        productImage: row.product_image,
        category: row.categories || 'Non catégorisé',
        vendorId: row.vendor_id,
        baseProductId: row.base_product_id,
        rank: offset + index + 1
      }));

      // 7. Calculer le total pour la pagination
      const countQuery = rawQuery.replace(
        /SELECT[\s\S]*?FROM/i,
        'SELECT COUNT(DISTINCT vp.id) as total FROM'
      ).replace(/ORDER BY[\s\S]*?LIMIT[\s\S]*?OFFSET[\s\S]*$/i, '');

      const countParams = queryParams.slice(0, -2); // Enlever LIMIT et OFFSET
      const totalResult = await this.prisma.$queryRawUnsafe(countQuery, ...countParams);
      const total = parseInt((totalResult as any[])[0]?.total || 0);

      // 8. Calculer les statistiques globales
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT vp.id) as total_products,
          COALESCE(SUM(oi.quantity * oi."unitPrice"), 0) as total_revenue,
          COALESCE(SUM(oi.quantity), 0) as total_quantity_sold
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "VendorProduct" vp ON vp.id = oi."productId"
        WHERE 
          o.status = 'DELIVERED'
          AND o."createdAt" >= $1
          AND o."createdAt" <= $2
          ${vendorId ? 'AND vp."vendorId" = $3' : ''}
      `;

      const statsParams: (Date | number)[] = [dateRange.from, dateRange.to];
      if (vendorId) statsParams.push(vendorId);

      const statsResult = await this.prisma.$queryRawUnsafe(statsQuery, ...statsParams);
      const stats = (statsResult as any[])[0];

      console.log('📊 [REAL-BEST-SELLERS] Statistiques:', stats);

      return {
        success: true,
        data: {
          bestSellers,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          },
          stats: {
            totalProducts: parseInt(stats.total_products),
            totalRevenue: parseFloat(stats.total_revenue),
            totalQuantitySold: parseInt(stats.total_quantity_sold),
            period,
            dateRange
          }
        }
      };

    } catch (error) {
      console.error('❌ [REAL-BEST-SELLERS] Erreur:', error);
      throw new Error(`Erreur lors de la récupération des meilleures ventes: ${error.message}`);
    }
  }

  /**
   * 📅 Calculer la plage de dates selon la période
   */
  private calculateDateRange(period: string): { from: Date; to: Date } {
    const now = new Date();
    const to = now;
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
      
      case 'year':
        from = new Date(now);
        from.setFullYear(now.getFullYear() - 1);
        break;
      
      case 'all':
      default:
        from = new Date('2020-01-01'); // Date de début de l'application
        break;
    }

    return { from, to };
  }

  /**
   * 🔄 Mettre à jour le cache des meilleures ventes
   */
  async updateBestSellersCache(): Promise<void> {
    console.log('🔄 [REAL-BEST-SELLERS] Mise à jour du cache...');

    try {
      // Récupérer les top 100 de tous les temps
      const allTimeBestSellers = await this.getRealBestSellers({
        period: 'all',
        limit: 100
      });

      // Mettre à jour les rangs dans la base de données
      for (const product of allTimeBestSellers.data.bestSellers) {
        await this.prisma.vendorProduct.update({
          where: { id: product.vendorProductId },
          data: {
            salesCount: product.totalQuantitySold,
            totalRevenue: product.totalRevenue,
            lastSaleDate: product.lastSaleDate,
            isBestSeller: product.rank <= 20, // Top 20 = best sellers
            bestSellerRank: product.rank
          }
        });
      }

      console.log('✅ [REAL-BEST-SELLERS] Cache mis à jour avec succès');
    } catch (error) {
      console.error('❌ [REAL-BEST-SELLERS] Erreur mise à jour cache:', error);
    }
  }
} 