import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { RealBestSellersService } from './real-best-sellers.service';

@Injectable()
export class SalesStatsUpdaterService {
  private readonly logger = new Logger(SalesStatsUpdaterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realBestSellersService: RealBestSellersService
  ) {}

  /**
   * 🔄 Mettre à jour les statistiques de vente après une commande livrée
   */
  async updateSalesStatsOnDelivery(orderId: number): Promise<void> {
    try {
      this.logger.log(`🚚 Mise à jour statistiques vente pour commande livrée: ${orderId}`);

      // 1. Récupérer les détails de la commande
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        this.logger.warn(`⚠️ Commande ${orderId} introuvable`);
        return;
      }

      if (order.status !== 'DELIVERED') {
        this.logger.warn(`⚠️ Commande ${orderId} n'est pas livrée (statut: ${order.status})`);
        return;
      }

      // 2. Mettre à jour les statistiques pour chaque produit de la commande
      const updatePromises = order.orderItems.map(async (item) => {
        // Vérifier si c'est un VendorProduct
        const vendorProduct = await this.prisma.vendorProduct.findUnique({
          where: { id: item.productId }
        });

        if (!vendorProduct) {
          this.logger.debug(`🔍 Produit ${item.productId} n'est pas un VendorProduct, ignoré`);
          return;
        }

        // Mettre à jour les statistiques du VendorProduct
        await this.realBestSellersService.updateProductSalesStats(
          vendorProduct.id,
          item.quantity,
          item.unitPrice
        );

        this.logger.debug(`📊 Stats mises à jour pour VendorProduct ${vendorProduct.id}: +${item.quantity} ventes`);
      });

      await Promise.all(updatePromises);

      // 3. Recalculer les best-sellers si nécessaire (pas à chaque commande pour les performances)
      const shouldRecalculate = await this.shouldRecalculateBestSellers();
      if (shouldRecalculate) {
        this.logger.log('🏆 Recalcul des best-sellers déclenché');
        // Faire le recalcul en arrière-plan sans attendre
        this.realBestSellersService.markTopSellers('month').catch(error => {
          this.logger.error('❌ Erreur recalcul best-sellers en arrière-plan:', error);
        });
      }

      this.logger.log(`✅ Statistiques mises à jour pour commande ${orderId} (${order.orderItems.length} produits)`);

    } catch (error) {
      this.logger.error(`❌ Erreur mise à jour statistiques commande ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * 🔄 Mettre à jour les statistiques lors de la création d'une commande
   */
  async updateStatsOnOrderCreation(orderId: number): Promise<void> {
    try {
      this.logger.log(`📝 Préparation statistiques pour nouvelle commande: ${orderId}`);

      // Incrémenter les vues des produits commandés
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true }
      });

      if (!order) return;

      const updateViewsPromises = order.orderItems.map(async (item) => {
        const vendorProduct = await this.prisma.vendorProduct.findUnique({
          where: { id: item.productId }
        });

        if (vendorProduct) {
          await this.prisma.vendorProduct.update({
            where: { id: vendorProduct.id },
            data: { viewsCount: { increment: 1 } }
          });
        }
      });

      await Promise.all(updateViewsPromises);

      this.logger.log(`✅ Vues mises à jour pour commande ${orderId}`);

    } catch (error) {
      this.logger.error(`❌ Erreur mise à jour vues commande ${orderId}:`, error);
    }
  }

  /**
   * 📊 Recalculer toutes les statistiques de vente (tâche de maintenance)
   */
  async recalculateAllSalesStats(): Promise<void> {
    try {
      this.logger.log('🔄 Recalcul complet des statistiques de vente...');

      // 1. Réinitialiser toutes les statistiques
      await this.prisma.vendorProduct.updateMany({
        data: {
          salesCount: 0,
          totalRevenue: 0,
          lastSaleDate: null,
          isBestSeller: false,
          bestSellerRank: null
        }
      });

      // 2. Recalculer depuis les vraies données de commande
      const salesData = await this.prisma.$queryRaw`
        SELECT 
          vp.id as vendor_product_id,
          SUM(oi.quantity) as total_sales,
          SUM(oi.quantity * oi."unitPrice") as total_revenue,
          MAX(o."createdAt") as last_sale_date
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        JOIN "VendorProduct" vp ON vp.id = oi."productId"
        WHERE o.status = 'DELIVERED'
        GROUP BY vp.id
      `;

      // 3. Mettre à jour chaque produit avec ses vraies statistiques
      const updatePromises = (salesData as any[]).map(async (data) => {
        await this.prisma.vendorProduct.update({
          where: { id: data.vendor_product_id },
          data: {
            salesCount: Number(data.total_sales),
            totalRevenue: Number(data.total_revenue),
            lastSaleDate: data.last_sale_date
          }
        });
      });

      await Promise.all(updatePromises);

      // 4. Recalculer les best-sellers
      await this.realBestSellersService.markTopSellers('all');

      this.logger.log(`✅ Recalcul complet terminé: ${(salesData as any[]).length} produits mis à jour`);

    } catch (error) {
      this.logger.error('❌ Erreur recalcul complet statistiques:', error);
      throw error;
    }
  }

  /**
   * 📈 Obtenir les statistiques de performance du système
   */
  async getPerformanceStats(): Promise<any> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT vp.id) as total_vendor_products,
          COUNT(DISTINCT CASE WHEN vp."salesCount" > 0 THEN vp.id END) as products_with_sales,
          COUNT(DISTINCT CASE WHEN vp."isBestSeller" = true THEN vp.id END) as best_sellers_count,
          SUM(vp."salesCount") as total_sales,
          SUM(vp."totalRevenue") as total_revenue,
          AVG(vp."salesCount") as avg_sales_per_product,
          MAX(vp."salesCount") as max_sales_single_product
        FROM "VendorProduct" vp
        WHERE vp."isDelete" = false AND vp.status = 'PUBLISHED'
      `;

      const result = (stats as any[])[0];

      return {
        totalVendorProducts: Number(result.total_vendor_products),
        productsWithSales: Number(result.products_with_sales),
        bestSellersCount: Number(result.best_sellers_count),
        totalSales: Number(result.total_sales),
        totalRevenue: Number(result.total_revenue),
        averageSalesPerProduct: Number(result.avg_sales_per_product),
        maxSalesSingleProduct: Number(result.max_sales_single_product),
        salesRate: result.total_vendor_products > 0 
          ? (Number(result.products_with_sales) / Number(result.total_vendor_products)) * 100 
          : 0
      };

    } catch (error) {
      this.logger.error('❌ Erreur récupération stats performance:', error);
      throw error;
    }
  }

  /**
   * 🎯 Identifier les produits à fort potentiel
   */
  async identifyHighPotentialProducts(): Promise<any[]> {
    try {
      // Produits récents avec de bonnes performances initiales
      const highPotentialProducts = await this.prisma.$queryRaw`
        SELECT 
          vp.id,
          vp.name,
          vp."salesCount",
          vp."totalRevenue",
          vp."viewsCount",
          vp."createdAt",
          u."firstName" || ' ' || u."lastName" as vendor_name,
          u.shop_name,
          EXTRACT(DAYS FROM NOW() - vp."createdAt") as days_since_creation,
          (vp."salesCount"::float / GREATEST(EXTRACT(DAYS FROM NOW() - vp."createdAt"), 1)) as sales_per_day
        FROM "VendorProduct" vp
        JOIN "User" u ON u.id = vp."vendorId"
        WHERE 
          vp."isDelete" = false 
          AND vp.status = 'PUBLISHED'
          AND vp."createdAt" > NOW() - INTERVAL '30 days'
          AND vp."salesCount" > 0
        ORDER BY sales_per_day DESC, vp."viewsCount" DESC
        LIMIT 20
      `;

      return (highPotentialProducts as any[]).map(product => ({
        id: product.id,
        name: product.name,
        salesCount: Number(product.salesCount),
        totalRevenue: Number(product.totalRevenue),
        viewsCount: Number(product.viewsCount),
        daysSinceCreation: Number(product.days_since_creation),
        salesPerDay: Number(product.sales_per_day),
        vendor: {
          name: product.vendor_name,
          shopName: product.shop_name
        }
      }));

    } catch (error) {
      this.logger.error('❌ Erreur identification produits à fort potentiel:', error);
      throw error;
    }
  }

  /**
   * 🔍 Vérifier si on doit recalculer les best-sellers
   */
  private async shouldRecalculateBestSellers(): Promise<boolean> {
    try {
      // Recalculer seulement si:
      // 1. Aucun best-seller n'est défini
      // 2. Le dernier recalcul date de plus de 24h
      // 3. Il y a eu beaucoup de nouvelles ventes

      const bestSellersCount = await this.prisma.vendorProduct.count({
        where: { isBestSeller: true }
      });

      if (bestSellersCount === 0) {
        this.logger.log('🎯 Aucun best-seller défini, recalcul nécessaire');
        return true;
      }

      // Vérifier les ventes récentes (dernières 24h)
      const recentSales = await this.prisma.order.count({
        where: {
          status: 'DELIVERED',
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      });

      // Recalculer si plus de 10 commandes livrées dans les dernières 24h
      if (recentSales > 10) {
        this.logger.log(`🎯 ${recentSales} ventes récentes, recalcul nécessaire`);
        return true;
      }

      return false;

    } catch (error) {
      this.logger.error('❌ Erreur vérification recalcul best-sellers:', error);
      return false;
    }
  }
} 