import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MonthlyRevenueDataDto, AnnualRevenueStatsDto, MonthlyRevenueStatsDto } from './dto/monthly-revenue.dto';

@Injectable()
export class VendorStatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère les statistiques de revenus mensuels pour un vendeur
   * @param vendorId ID du vendeur
   * @param months Nombre de mois à récupérer (par défaut: 7)
   * @returns Tableau de données mensuelles
   */
  async getMonthlyRevenue(
    vendorId: number,
    months: number = 7,
  ): Promise<MonthlyRevenueDataDto[]> {
    try {
      console.log(`📊 [VendorStatsService] Récupération des revenus mensuels pour vendeur ${vendorId}, ${months} mois`);

      // Calculer la date de début (X mois en arrière)
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months + 1);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      console.log(`📅 [VendorStatsService] Date de début: ${startDate.toISOString()}`);

      // Récupérer toutes les commandes du vendeur depuis la date de début
      const orders = await this.prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              vendorProduct: {
                vendorId: vendorId,
              },
            },
          },
          createdAt: {
            gte: startDate,
          },
          paymentStatus: 'PAID', // Seulement les commandes payées
        },
        select: {
          id: true,
          createdAt: true,
          vendorAmount: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      console.log(`📦 [VendorStatsService] ${orders.length} commandes trouvées`);

      // Récupérer les usages de designs depuis la date de début
      const designUsages = await this.prisma.designUsage.findMany({
        where: {
          design: {
            vendorId: vendorId,
          },
          usedAt: {
            gte: startDate,
          },
        },
        select: {
          id: true,
          usedAt: true,
          vendorRevenue: true,
        },
        orderBy: {
          usedAt: 'asc',
        },
      });

      console.log(`🎨 [VendorStatsService] ${designUsages.length} utilisations de designs trouvées`);

      // Grouper les données par mois
      const monthlyData = new Map<string, {
        revenue: number;
        orders: number;
        productRevenue: number;
        designRevenue: number;
        designUsages: number;
      }>();

      // Initialiser tous les mois avec 0
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        monthlyData.set(monthKey, {
          revenue: 0,
          orders: 0,
          productRevenue: 0,
          designRevenue: 0,
          designUsages: 0,
        });
      }

      // Remplir avec les données de commandes
      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

        if (monthlyData.has(monthKey)) {
          const data = monthlyData.get(monthKey);

          // Ajouter le revenu vendeur pour cette commande
          const orderRevenue = order.vendorAmount || 0;
          data.productRevenue += orderRevenue;
          data.revenue += orderRevenue;

          // Incrémenter le nombre de commandes
          data.orders += 1;
        }
      });

      // Remplir avec les données de designs
      designUsages.forEach((usage) => {
        const usageDate = new Date(usage.usedAt);
        const monthKey = `${usageDate.getFullYear()}-${String(usageDate.getMonth() + 1).padStart(2, '0')}`;

        if (monthlyData.has(monthKey)) {
          const data = monthlyData.get(monthKey);

          // Ajouter le revenu des designs (conversion en number pour Prisma Decimal)
          const designRev = Number(usage.vendorRevenue || 0);
          data.designRevenue += designRev;
          data.revenue += designRev;

          // Incrémenter le nombre d'utilisations de designs
          data.designUsages += 1;
        }
      });

      // Convertir en tableau de résultats
      const result: MonthlyRevenueDataDto[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = monthNames[date.getMonth()];
        const data = monthlyData.get(monthKey);

        result.push({
          month: monthLabel,
          revenue: Math.round(data.revenue),
          orders: data.orders,
          productRevenue: Math.round(data.productRevenue),
          designRevenue: Math.round(data.designRevenue),
          designUsages: data.designUsages,
        });
      }

      console.log(`✅ [VendorStatsService] Données mensuelles calculées (produits + designs):`, result);

      return result;
    } catch (error) {
      console.error('❌ [VendorStatsService] Erreur:', error);
      // Retourner des données par défaut en cas d'erreur
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const now = new Date();
      const result: MonthlyRevenueDataDto[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = monthNames[date.getMonth()];
        result.push({
          month: monthLabel,
          revenue: 0,
          orders: 0,
          productRevenue: 0,
          designRevenue: 0,
          designUsages: 0,
        });
      }

      return result;
    }
  }

  /**
   * Récupère les statistiques de revenus avec évolution et pourcentages
   * @param vendorId ID du vendeur
   * @returns Statistiques annuelles et mensuelles avec pourcentages
   */
  async getRevenueStats(vendorId: number): Promise<{ annual: AnnualRevenueStatsDto; monthly: MonthlyRevenueStatsDto }> {
    try {
      console.log(`📊 [VendorStatsService] Calcul des statistiques de revenus pour vendeur ${vendorId}`);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // ===== STATISTIQUES ANNUELLES =====

      // Début de l'année en cours
      const currentYearStart = new Date(currentYear, 0, 1);
      const currentYearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

      // Début de l'année précédente
      const previousYearStart = new Date(currentYear - 1, 0, 1);
      const previousYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);

      // Revenus des commandes pour l'année en cours
      const currentYearOrders = await this.prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              vendorProduct: { vendorId },
            },
          },
          createdAt: {
            gte: currentYearStart,
            lte: currentYearEnd,
          },
          paymentStatus: 'PAID',
        },
        select: {
          vendorAmount: true,
          createdAt: true,
        },
      });

      const currentYearOrderRevenue = currentYearOrders.reduce((sum, order) => sum + (order.vendorAmount || 0), 0);

      // Revenus des designs pour l'année en cours (usages)
      const currentYearDesignRevenue = await this.prisma.designUsage.aggregate({
        where: {
          design: { vendorId },
          usedAt: {
            gte: currentYearStart,
            lte: currentYearEnd,
          },
        },
        _sum: {
          vendorRevenue: true,
        },
      });

      const currentYearRevenue = currentYearOrderRevenue + Number(currentYearDesignRevenue._sum.vendorRevenue || 0);

      // Revenus de l'année précédente
      const previousYearOrders = await this.prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              vendorProduct: { vendorId },
            },
          },
          createdAt: {
            gte: previousYearStart,
            lte: previousYearEnd,
          },
          paymentStatus: 'PAID',
        },
        select: {
          vendorAmount: true,
        },
      });

      const previousYearOrderRevenue = previousYearOrders.reduce((sum, order) => sum + (order.vendorAmount || 0), 0);

      const previousYearDesignRevenue = await this.prisma.designUsage.aggregate({
        where: {
          design: { vendorId },
          usedAt: {
            gte: previousYearStart,
            lte: previousYearEnd,
          },
        },
        _sum: {
          vendorRevenue: true,
        },
      });

      const previousYearRevenue = previousYearOrderRevenue + Number(previousYearDesignRevenue._sum.vendorRevenue || 0);

      // Calcul du pourcentage d'évolution annuel
      const yearOverYearGrowth = previousYearRevenue > 0
        ? ((currentYearRevenue - previousYearRevenue) / previousYearRevenue) * 100
        : 0;

      // Données mensuelles des 12 derniers mois
      const monthlyData: number[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(currentYear, currentMonth - i, 1);
        const monthEnd = new Date(currentYear, currentMonth - i + 1, 0, 23, 59, 59);

        const monthOrders = await this.prisma.order.findMany({
          where: {
            orderItems: {
              some: {
                vendorProduct: { vendorId },
              },
            },
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
            paymentStatus: 'PAID',
          },
          select: {
            vendorAmount: true,
          },
        });

        const monthOrderRevenue = monthOrders.reduce((sum, order) => sum + (order.vendorAmount || 0), 0);

        const monthDesignRevenue = await this.prisma.designUsage.aggregate({
          where: {
            design: { vendorId },
            usedAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: {
            vendorRevenue: true,
          },
        });

        monthlyData.push(monthOrderRevenue + Number(monthDesignRevenue._sum.vendorRevenue || 0));
      }

      // ===== STATISTIQUES MENSUELLES =====

      // Mois en cours
      const currentMonthStart = new Date(currentYear, currentMonth, 1);
      const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      // Mois précédent
      const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const previousMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

      // Revenus du mois en cours
      const currentMonthOrders = await this.prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              vendorProduct: { vendorId },
            },
          },
          createdAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
          paymentStatus: 'PAID',
        },
        select: {
          vendorAmount: true,
          createdAt: true,
        },
      });

      const currentMonthOrderRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.vendorAmount || 0), 0);

      const currentMonthDesignRevenue = await this.prisma.designUsage.aggregate({
        where: {
          design: { vendorId },
          usedAt: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
        _sum: {
          vendorRevenue: true,
        },
      });

      const currentMonthRevenue = currentMonthOrderRevenue + Number(currentMonthDesignRevenue._sum.vendorRevenue || 0);

      // Revenus du mois précédent
      const previousMonthOrders = await this.prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              vendorProduct: { vendorId },
            },
          },
          createdAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
          paymentStatus: 'PAID',
        },
        select: {
          vendorAmount: true,
        },
      });

      const previousMonthOrderRevenue = previousMonthOrders.reduce((sum, order) => sum + (order.vendorAmount || 0), 0);

      const previousMonthDesignRevenue = await this.prisma.designUsage.aggregate({
        where: {
          design: { vendorId },
          usedAt: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
        _sum: {
          vendorRevenue: true,
        },
      });

      const previousMonthRevenue = previousMonthOrderRevenue + Number(previousMonthDesignRevenue._sum.vendorRevenue || 0);

      // Calcul du pourcentage d'évolution mensuel
      const monthOverMonthGrowth = previousMonthRevenue > 0
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
        : 0;

      // Données hebdomadaires des 7 dernières semaines
      const weeklyData: number[] = [];
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const weeksCount = 7;
      const daysPerSegment = Math.ceil(daysInMonth / weeksCount);

      for (let i = 0; i < weeksCount; i++) {
        const segmentStart = new Date(currentYear, currentMonth, i * daysPerSegment + 1);
        const segmentEnd = new Date(currentYear, currentMonth, Math.min((i + 1) * daysPerSegment, daysInMonth), 23, 59, 59);

        const segmentOrders = currentMonthOrders.filter(
          order => order.createdAt >= segmentStart && order.createdAt <= segmentEnd
        );

        const segmentRevenue = segmentOrders.reduce((sum, order) => sum + (order.vendorAmount || 0), 0);
        weeklyData.push(segmentRevenue);
      }

      console.log(`✅ [VendorStatsService] Statistiques calculées:`, {
        currentYearRevenue: Math.round(currentYearRevenue),
        yearOverYearGrowth: yearOverYearGrowth.toFixed(1),
        currentMonthRevenue: Math.round(currentMonthRevenue),
        monthOverMonthGrowth: monthOverMonthGrowth.toFixed(1),
      });

      return {
        annual: {
          currentYearRevenue: Math.round(currentYearRevenue),
          previousYearRevenue: Math.round(previousYearRevenue),
          yearOverYearGrowth: Math.round(yearOverYearGrowth * 10) / 10,
          monthlyData,
        },
        monthly: {
          currentMonthRevenue: Math.round(currentMonthRevenue),
          previousMonthRevenue: Math.round(previousMonthRevenue),
          monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 10) / 10,
          weeklyData,
        },
      };
    } catch (error) {
      console.error('❌ [VendorStatsService] Erreur:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        annual: {
          currentYearRevenue: 0,
          previousYearRevenue: 0,
          yearOverYearGrowth: 0,
          monthlyData: Array(12).fill(0),
        },
        monthly: {
          currentMonthRevenue: 0,
          previousMonthRevenue: 0,
          monthOverMonthGrowth: 0,
          weeklyData: Array(7).fill(0),
        },
      };
    }
  }

  /**
   * Récupère les statistiques globales du vendeur
   * @param vendorId ID du vendeur
   * @returns Statistiques du vendeur
   */
  async getVendorStats(vendorId: number) {
    try {
      console.log(`📊 [VendorStatsService] Récupération des statistiques pour vendeur ${vendorId}`);

      // Statistiques des produits
      const products = await this.prisma.vendorProduct.findMany({
        where: { vendorId, isDelete: false },
        select: {
          status: true,
          price: true,
        },
      });

      const totalProducts = products.length;
      const publishedProducts = products.filter(p => p.status === 'PUBLISHED').length;
      const draftProducts = products.filter(p => p.status === 'DRAFT').length;
      const pendingProducts = products.filter(p => p.status === 'PENDING').length;
      const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
      const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

      // Statistiques des designs
      const designs = await this.prisma.design.findMany({
        where: { vendorId, isDelete: false },
        select: {
          isPublished: true,
          isDraft: true,
          isPending: true,
          isValidated: true,
        },
      });

      const totalDesigns = designs.length;
      const publishedDesigns = designs.filter(d => d.isPublished).length;
      const draftDesigns = designs.filter(d => d.isDraft).length;
      const pendingDesigns = designs.filter(d => d.isPending).length;
      const validatedDesigns = designs.filter(d => d.isValidated).length;

      // Vues de la boutique (somme des vues de tous les designs)
      const designsWithViews = await this.prisma.design.findMany({
        where: { vendorId, isDelete: false },
        select: {
          views: true,
        },
      });

      const shopViews = designsWithViews.reduce((sum, d) => sum + (d.views || 0), 0);

      // Informations du vendeur
      const vendor = await this.prisma.user.findUnique({
        where: { id: vendorId },
        select: {
          created_at: true,
          last_login_at: true,
        },
      });

      return {
        totalProducts,
        publishedProducts,
        draftProducts,
        pendingProducts,
        totalValue,
        averagePrice: Math.round(averagePrice),
        totalDesigns,
        publishedDesigns,
        draftDesigns,
        pendingDesigns,
        validatedDesigns,
        shopViews,
        memberSince: vendor?.created_at?.toISOString() || '',
        lastLoginAt: vendor?.last_login_at?.toISOString() || '',
      };
    } catch (error) {
      console.error('❌ [VendorStatsService] Erreur:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        totalProducts: 0,
        publishedProducts: 0,
        draftProducts: 0,
        pendingProducts: 0,
        totalValue: 0,
        averagePrice: 0,
        totalDesigns: 0,
        publishedDesigns: 0,
        draftDesigns: 0,
        pendingDesigns: 0,
        validatedDesigns: 0,
        shopViews: 0,
        memberSince: '',
        lastLoginAt: '',
      };
    }
  }
}
