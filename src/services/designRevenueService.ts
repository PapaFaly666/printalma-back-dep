import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma, OrderStatus } from '@prisma/client';

@Injectable()
export class DesignRevenueService {
  private readonly logger = new Logger(DesignRevenueService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculer les dates pour le filtre de période
   */
  private calculateDateFilter(period: string): { gte: Date } | undefined {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        return undefined;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { gte: startDate };
  }

  /**
   * Mapper le statut interne vers le statut UI
   */
  private mapPaymentStatusToUIStatus(paymentStatus: string): string {
    switch (paymentStatus) {
      case 'PENDING':
      case 'CONFIRMED':
        return 'PENDING';
      case 'READY_FOR_PAYOUT':
      case 'PAID':
        return 'COMPLETED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  /**
   * Récupère les statistiques de revenus pour un vendeur
   */
  async getRevenueStats(vendorId: number, period: string = 'month') {
    this.logger.log(`📊 [Design Revenue] Récupération stats vendeur ${vendorId}, période: ${period}`);

    try {
      const dateFilter = this.calculateDateFilter(period);
      const whereClause: any = {
        vendorId,
      };

      if (dateFilter) {
        whereClause.usedAt = dateFilter;
      }

      // Statistiques globales (uniquement designs CONFIRMED)
      const stats = await this.prisma.designUsage.aggregate({
        where: {
          ...whereClause,
          paymentStatus: 'CONFIRMED'  // Uniquement les designs avec statut CONFIRMED
        },
        _sum: {
          vendorRevenue: true,
        },
        _count: true,
      });

      // Revenus en attente (designs CONFIRMED)
      const pendingRevenue = await this.prisma.designUsage.aggregate({
        where: {
          ...whereClause,
          paymentStatus: 'CONFIRMED',
        },
        _sum: { vendorRevenue: true },
      });

      // Revenus complétés (designs traités)
      const completedRevenue = await this.prisma.designUsage.aggregate({
        where: {
          ...whereClause,
          paymentStatus: { in: ['READY_FOR_PAYOUT', 'PAID'] },
        },
        _sum: { vendorRevenue: true },
      });

      // Nombre de designs uniques utilisés (uniquement designs CONFIRMED)
      const designUsages = await this.prisma.designUsage.findMany({
        where: {
          ...whereClause,
          paymentStatus: 'CONFIRMED'
        },
        select: { designId: true },
        distinct: ['designId'],
      });

      const uniqueDesignsUsed = designUsages.length;
      const totalRevenue = parseFloat(stats._sum.vendorRevenue?.toString() || '0');
      const pendingAmount = parseFloat(pendingRevenue._sum.vendorRevenue?.toString() || '0');
      const completedAmount = parseFloat(completedRevenue._sum.vendorRevenue?.toString() || '0');

      return {
        totalRevenue,
        pendingRevenue: pendingAmount,
        completedRevenue: completedAmount,
        totalUsages: stats._count,
        uniqueDesignsUsed,
        averageRevenuePerDesign:
          uniqueDesignsUsed > 0 ? totalRevenue / uniqueDesignsUsed : 0,
      };
    } catch (error) {
      this.logger.error(`❌ [Design Revenue] Erreur récupération stats:`, error);
      throw error;
    }
  }

  /**
   * Récupérer la liste des designs avec leurs revenus
   */
  async getDesignRevenues(
    vendorId: number,
    filters: {
      period?: string;
      sortBy?: string;
      search?: string;
    }
  ) {
    const { period = 'month', sortBy = 'revenue', search = '' } = filters;

    this.logger.log(`📊 [Design Revenue] Récupération designs vendeur ${vendorId}, période: ${period}, tri: ${sortBy}`);

    try {
      const dateFilter = this.calculateDateFilter(period);
      const whereClause: any = {
        vendorId,
      };

      if (dateFilter) {
        whereClause.usedAt = dateFilter;
      }

      // Récupérer tous les design usages avec statut CONFIRMED
      const designUsages = await this.prisma.designUsage.findMany({
        where: {
          ...whereClause,
          paymentStatus: 'CONFIRMED'  // Filtrer uniquement les designs avec statut CONFIRMED
        },
        include: {
          design: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              thumbnailUrl: true,
              price: true,
            },
          },
          order: {
            select: {
              orderNumber: true,
              shippingName: true,
              paymentStatus: true,
            },
          },
        },
        orderBy: {
          usedAt: 'desc',
        },
      });

      // Grouper par design
      const designMap = new Map<
        number,
        {
          id: number;
          designId: number;
          designName: string;
          designImage: string;
          designPrice: number;
          totalUsages: number;
          totalRevenue: number;
          pendingRevenue: number;
          completedRevenue: number;
          lastUsedAt: Date;
          usageHistory: Array<{
            id: number;
            orderId: number;
            orderNumber: string;
            customerName: string;
            productName: string;
            usedAt: Date;
            revenue: number;
            status: string;
            commissionRate: number;
          }>;
        }
      >();

      for (const usage of designUsages) {
        const designId = usage.designId;
        const revenue = parseFloat(usage.vendorRevenue.toString());

        if (!designMap.has(designId)) {
          designMap.set(designId, {
            id: designId,
            designId,
            designName: usage.designName,
            designImage: usage.design?.imageUrl || usage.design?.thumbnailUrl || '',
            designPrice: parseFloat(usage.design?.price?.toString() || '0'),
            totalUsages: 0,
            totalRevenue: 0,
            pendingRevenue: 0,
            completedRevenue: 0,
            lastUsedAt: usage.usedAt,
            usageHistory: [],
          });
        }

        const designData = designMap.get(designId)!;
        designData.totalUsages++;
        designData.totalRevenue += revenue;

        if (['PENDING', 'CONFIRMED'].includes(usage.paymentStatus)) {
          designData.pendingRevenue += revenue;
        } else if (['READY_FOR_PAYOUT', 'PAID'].includes(usage.paymentStatus)) {
          designData.completedRevenue += revenue;
        }

        if (usage.usedAt > designData.lastUsedAt) {
          designData.lastUsedAt = usage.usedAt;
        }

        designData.usageHistory.push({
          id: usage.id,
          orderId: usage.orderId,
          orderNumber: usage.orderNumber,
          customerName: usage.customerName,
          productName: usage.productName,
          usedAt: usage.usedAt,
          revenue,
          status: this.mapPaymentStatusToUIStatus(usage.paymentStatus),
          commissionRate: parseFloat(usage.commissionRate.toString()),
          paymentStatus: usage.paymentStatus,  // Ajout du statut brut du design
          orderPaymentStatus: usage.order.paymentStatus,  // Statut de paiement de la commande
        } as any);  // Type any pour éviter les erreurs TypeScript
      }

      // Convertir en array et filtrer par recherche
      let designs = Array.from(designMap.values());

      if (search) {
        const searchLower = search.toLowerCase();
        designs = designs.filter(d =>
          d.designName.toLowerCase().includes(searchLower)
        );
      }

      // Trier
      designs.sort((a, b) => {
        switch (sortBy) {
          case 'revenue':
            return b.totalRevenue - a.totalRevenue;
          case 'usage':
            return b.totalUsages - a.totalUsages;
          case 'recent':
            return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
          default:
            return b.totalRevenue - a.totalRevenue;
        }
      });

      return designs;
    } catch (error) {
      this.logger.error(`❌ [Design Revenue] Erreur récupération designs:`, error);
      throw error;
    }
  }

  /**
   * Récupère l'historique des revenus pour un design spécifique
   */
  async getDesignRevenueHistory(designId: number, vendorId: number) {
    this.logger.log(`📊 [Design Revenue] Récupération historique design ${designId} pour vendeur ${vendorId}`);

    try {
      const usageHistory = await this.prisma.designUsage.findMany({
        where: {
          designId: parseInt(designId.toString()),
          vendorId,
          paymentStatus: 'CONFIRMED'  // Uniquement les designs avec statut CONFIRMED
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              paymentStatus: true,
            },
          },
        },
        orderBy: {
          usedAt: 'desc',
        },
      });

      return usageHistory.map(usage => ({
        id: usage.id,
        orderId: usage.orderId,
        orderNumber: usage.order.orderNumber,
        customerName: usage.customerName,
        productName: usage.productName,
        usedAt: usage.usedAt,
        revenue: parseFloat(usage.vendorRevenue.toString()),
        status: this.mapPaymentStatusToUIStatus(usage.paymentStatus),
        commissionRate: parseFloat(usage.commissionRate.toString()),
        orderPaymentStatus: usage.order.paymentStatus,  // Ajout du statut de paiement de la commande
      }));
    } catch (error) {
      this.logger.error(`❌ [Design Revenue] Erreur récupération historique:`, error);
      throw error;
    }
  }

  /**
   * Récupère les revenus mensuels pour un vendeur
   */
  async getMonthlyRevenues(vendorId: number, year: number = new Date().getFullYear()) {
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // TODO: Implement when DesignUsage model exists
      monthlyData.push({
        month,
        monthName: new Date(year, month - 1).toLocaleString('fr-FR', { month: 'long' }),
        revenue: 0,
        orders: 0
      });
    }

    return monthlyData;
  }

  /**
   * Calcule la date de début selon la période
   */
  static calculateStartDate(period: string): Date {
    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return startDate;
  }

  /**
   * Récupère les designs les plus rentables
   */
  async getTopDesigns(vendorId: number, limit: number = 10) {
    // TODO: Implement when DesignUsage model exists
    return [];
  }

  /**
   * Demande un paiement pour les revenus accumulés
   */
  async requestPayout(vendorId: number, bankAccountId: number, amount: number) {
    // TODO: Implement when DesignUsage model exists
    const availableRevenue = 0;

    if (amount > availableRevenue) {
      throw new Error('Montant supérieur aux revenus disponibles');
    }

    // TODO: Implement when VendorPayout model exists
    return null;
  }

  /**
   * Récupère les informations bancaires du vendeur
   */
  async getBankAccounts(vendorId: number) {
    // TODO: Implement when VendorBankAccount model exists
    return [];
  }

  /**
   * Ajoute un compte bancaire pour le vendeur
   */
  async addBankAccount(vendorId: number, bankData: any) {
    // TODO: Implement when VendorBankAccount model exists
    return null;
  }

  /**
   * Met à jour le statut des paiements
   */
  async updatePaymentStatus(usageIds: number[], status: string) {
    // TODO: Implement when DesignUsage model exists
    return null;
  }

  // Static methods for direct access (used by routes and jobs)
  static async getRevenueStats(vendorId: number, period: string = 'month') {
    // TODO: Implement when DesignUsage model is properly defined
    return {
      period,
      totalRevenue: 0,
      totalOrders: 0,
      totalDesigns: 0,
      pendingPayouts: 0,
      startDate: new Date(),
      endDate: new Date()
    };
  }

  static async getDesignsWithRevenue(vendorId: number, options: {
    period?: string;
    sortBy?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    // TODO: Implement when DesignUsage model is properly defined
    return {
      items: [],
      pagination: {
        page: options.page,
        limit: options.limit,
        total: 0,
        totalPages: 0
      }
    };
  }

  static async getDesignUsageHistory(designId: number, vendorId: number, options: {
    page: number;
    limit: number;
  }) {
    // TODO: Implement when DesignUsage model is properly defined
    return {
      designId,
      items: [],
      pagination: {
        page: options.page,
        limit: options.limit,
        total: 0,
        totalPages: 0
      }
    };
  }

  static async getAvailableBalance(vendorId: number): Promise<number> {
    // TODO: Implement when DesignUsage model is properly defined
    return 0;
  }

  static async createPayoutRequest(vendorId: number, data: {
    bankAccountId: number;
    amount: number;
    notes?: string;
  }) {
    const prisma = new PrismaService();

    // Vérifier si le vendeur a suffisamment de revenus
    const availableBalance = await DesignRevenueService.getAvailableBalance(vendorId);

    if (data.amount > availableBalance) {
      throw new Error('Montant supérieur aux revenus disponibles');
    }

    // TODO: Implement when VendorPayout model exists
    return null;
  }

  static async getPayoutHistory(vendorId: number, options: {
    page: number;
    limit: number;
  }) {
    const prisma = new PrismaService();

    // TODO: Implement when VendorPayout model exists
    return {
      items: [],
      pagination: {
        page: options.page,
        limit: options.limit,
        total: 0,
        totalPages: 0
      }
    };
  }

  static async recordDesignUsage(data: {
    designId: number;
    vendorId: number;
    customerId: number;
    orderId: number;
    orderItemId?: number;
    customizationId?: number;
    commissionRate: number;
    vendorRevenue: number;
  }) {
    const prisma = new PrismaService();

    // TODO: Implement this when DesignUsage model is properly defined
    console.log('Recording design usage:', data);
    return null;
  }

  static async initializeRevenueSettings() {
    // TODO: Implement when DesignRevenueSettings model exists
    console.log('Initializing revenue settings...');
  }

  static async processPendingPayouts() {
    const prisma = new PrismaService();

    // TODO: Implement when VendorPayout model exists
    console.log('Processing pending payouts...');
  }
}