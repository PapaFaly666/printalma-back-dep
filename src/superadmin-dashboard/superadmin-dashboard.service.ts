import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  SuperadminDashboardDto,
  TopVendorDto,
  PendingProductDto,
  PendingDesignDto,
  PendingFundRequestDto,
} from './dto/dashboard-stats.dto';

@Injectable()
export class SuperadminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<SuperadminDashboardDto> {
    // Récupérer toutes les statistiques en parallèle pour optimiser les performances
    const [
      financialStats,
      vendorStats,
      topVendors,
      productStats,
      designStats,
      orderStats,
      pendingFundRequests,
    ] = await Promise.all([
      this.getFinancialStats(),
      this.getVendorStats(),
      this.getTopVendors(),
      this.getProductStats(),
      this.getDesignStats(),
      this.getOrderStats(),
      this.getPendingFundRequests(),
    ]);

    const now = new Date();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      currentMonth: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
      currentMonthNumber: now.getMonth() + 1,
      currentYear: now.getFullYear(),
      financialStats,
      vendorStats,
      topVendors,
      productStats,
      designStats,
      orderStats,
      pendingFundRequests,
    };
  }

  private async getFinancialStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Récupérer les statistiques des vendeurs
    const vendorEarnings = await this.prisma.vendorEarnings.aggregate({
      _sum: {
        totalEarnings: true,
        totalCommissionPaid: true,
        thisMonthEarnings: true,
        pendingAmount: true,
        availableAmount: true,
      },
      _avg: {
        averageCommissionRate: true,
      },
    });

    // 💰 Récupérer toutes les commandes pour recalculer les commissions sur le bénéfice
    const allOrders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
        paymentStatus: 'PAID',
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                price: true,
              },
            },
            customization: {
              select: {
                id: true,
                designElements: true,
              },
            },
          },
        },
      },
    });

    // Calculer les gains totaux de l'admin en recalculant sur le bénéfice
    let totalAdminGains = 0;
    let thisMonthAdminGains = 0;

    // 💰 Calculer le chiffre d'affaires (CA = montant total des commandes)
    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let thisYearRevenue = 0;

    const startOfYear = new Date(now.getFullYear(), 0, 1);

    for (const order of allOrders) {
      // Calculer les gains admin pour cette commande
      let orderAdminGains = 0;

      for (const item of order.orderItems) {
        const sellingPrice = item.unitPrice || 0;
        const quantity = item.quantity || 1;
        const commissionRate = (order.commissionRate || 40) / 100;

        // 🏪 PARTIE 1 : Prix de vente COMPLET du mockup avec commission admin
        const mockupRevenue = sellingPrice * quantity;
        const adminMockupGain = mockupRevenue * commissionRate;
        orderAdminGains += adminMockupGain;

        // 🎨 PARTIE 2 : Prix designs avec commission admin
        let itemDesignsTotal = 0;

        // Extraire les designs depuis designElementsByView
        if (item.designElementsByView && typeof item.designElementsByView === 'object') {
          const designElementsByView = item.designElementsByView as Record<string, any[]>;
          for (const viewKey in designElementsByView) {
            const elements = designElementsByView[viewKey];
            if (Array.isArray(elements)) {
              for (const element of elements) {
                if (element.type === 'image' && element.designPrice) {
                  itemDesignsTotal += parseFloat(element.designPrice);
                }
              }
            }
          }
        }

        // Ou depuis customization.designElements
        if (itemDesignsTotal === 0 && item.customization?.designElements) {
          const designElements = item.customization.designElements as any[];
          if (Array.isArray(designElements)) {
            for (const element of designElements) {
              if (element.type === 'image' && element.designPrice) {
                itemDesignsTotal += parseFloat(element.designPrice);
              }
            }
          }
        }

        // Appliquer la commission admin sur les designs
        const adminDesignsGain = itemDesignsTotal * commissionRate;
        orderAdminGains += adminDesignsGain;
      }

      // Ajouter au total des gains admin
      totalAdminGains += orderAdminGains;

      // 💰 Ajouter au chiffre d'affaires total
      totalRevenue += order.totalAmount;

      // Vérifier si la commande est du mois en cours
      const orderDate = new Date(order.createdAt);
      if (orderDate >= startOfMonth) {
        thisMonthAdminGains += orderAdminGains;
        thisMonthRevenue += order.totalAmount;
      }

      // Vérifier si la commande est de l'année en cours
      if (orderDate >= startOfYear) {
        thisYearRevenue += order.totalAmount;
      }
    }

    return {
      totalPlatformRevenue: vendorEarnings._sum.totalCommissionPaid || 0,
      thisMonthPlatformRevenue: thisMonthAdminGains,
      totalVendorEarnings: vendorEarnings._sum.totalEarnings || 0,
      thisMonthVendorEarnings: vendorEarnings._sum.thisMonthEarnings || 0,
      pendingPayouts: vendorEarnings._sum.pendingAmount || 0,
      availableForPayout: vendorEarnings._sum.availableAmount || 0,
      averageCommissionRate: vendorEarnings._avg.averageCommissionRate || 0,
      totalAdminGains: totalAdminGains,
      // 💰 Nouveaux champs de chiffre d'affaires
      totalRevenue: totalRevenue,
      thisMonthRevenue: thisMonthRevenue,
      thisYearRevenue: thisYearRevenue,
    };
  }

  private async getVendorStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Compter tous les vendeurs par statut
    const totalVendors = await this.prisma.user.count({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
      },
    });

    const activeVendors = await this.prisma.user.count({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
        userStatus: 'ACTIVE',
        status: true,
      },
    });

    const inactiveVendors = await this.prisma.user.count({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
        userStatus: 'INACTIVE',
      },
    });

    const suspendedVendors = await this.prisma.user.count({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
        userStatus: 'SUSPENDED',
      },
    });

    // Compter par type de vendeur
    const vendorsByType = {
      designers: 0,
      influencers: 0,
      artists: 0,
    };

    const designersCount = await this.prisma.user.count({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
        vendorType: {
          label: 'DESIGNER',
        },
      },
    });

    const influencersCount = await this.prisma.user.count({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
        vendorType: {
          label: 'INFLUENCEUR',
        },
      },
    });

    const artistsCount = await this.prisma.user.count({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
        vendorType: {
          label: 'ARTISTE',
        },
      },
    });

    vendorsByType.designers = designersCount;
    vendorsByType.influencers = influencersCount;
    vendorsByType.artists = artistsCount;

    // Nouveaux vendeurs ce mois
    const newVendorsThisMonth = await this.prisma.user.count({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
        created_at: {
          gte: startOfMonth,
        },
      },
    });

    return {
      totalVendors,
      activeVendors,
      inactiveVendors,
      suspendedVendors,
      vendorsByType,
      newVendorsThisMonth,
    };
  }

  private async getTopVendors() {
    // Top 10 par revenus
    const topByRevenue = await this.prisma.vendorEarnings.findMany({
      take: 10,
      orderBy: {
        totalEarnings: 'desc',
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
            email: true,
            profile_photo_url: true,
            vendorType: {
              select: {
                label: true,
              },
            },
            vendorCommission: {
              select: {
                commissionRate: true,
              },
            },
          },
        },
      },
    });

    // Top 10 par nombre de ventes (nombre de produits vendus)
    const topBySales = await this.prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
      },
      take: 10,
      orderBy: {
        salesCount: 'desc',
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
            email: true,
            profile_photo_url: true,
            vendorType: {
              select: {
                label: true,
              },
            },
            vendorCommission: {
              select: {
                commissionRate: true,
              },
            },
          },
        },
      },
    });

    // Top 10 par nombre de produits publiés
    const vendorsWithMostProducts = await this.prisma.user.findMany({
      where: {
        role: 'VENDEUR',
        is_deleted: false,
      },
      take: 10,
      include: {
        _count: {
          select: {
            vendorProducts: {
              where: {
                isDelete: false,
                status: 'PUBLISHED',
              },
            },
          },
        },
        vendorType: {
          select: {
            label: true,
          },
        },
        vendorCommission: {
          select: {
            commissionRate: true,
          },
        },
      },
      orderBy: {
        vendorProducts: {
          _count: 'desc',
        },
      },
    });

    // Transformer les données pour byRevenue
    const byRevenue: TopVendorDto[] = topByRevenue.map((earning) => ({
      vendorId: earning.vendor.id,
      vendorName: `${earning.vendor.firstName} ${earning.vendor.lastName}`,
      shopName: earning.vendor.shop_name || 'N/A',
      email: earning.vendor.email,
      vendorType: earning.vendor.vendorType?.label || 'N/A',
      totalRevenue: earning.totalEarnings,
      commissionRate: earning.vendor.vendorCommission?.commissionRate || 40,
      profileImage: earning.vendor.profile_photo_url,
    }));

    // Transformer les données pour bySales (grouper par vendeur)
    const salesByVendor = new Map<number, { vendor: any; totalSales: number }>();

    topBySales.forEach((product) => {
      const existing = salesByVendor.get(product.vendorId);
      if (existing) {
        existing.totalSales += product.salesCount || 0;
      } else {
        salesByVendor.set(product.vendorId, {
          vendor: product.vendor,
          totalSales: product.salesCount || 0,
        });
      }
    });

    const bySales: TopVendorDto[] = Array.from(salesByVendor.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10)
      .map((item) => ({
        vendorId: item.vendor.id,
        vendorName: `${item.vendor.firstName} ${item.vendor.lastName}`,
        shopName: item.vendor.shop_name || 'N/A',
        email: item.vendor.email,
        vendorType: item.vendor.vendorType?.label || 'N/A',
        totalSales: item.totalSales,
        commissionRate: item.vendor.vendorCommission?.commissionRate || 40,
        profileImage: item.vendor.profile_photo_url,
      }));

    // Transformer les données pour byProducts
    const byProducts: TopVendorDto[] = vendorsWithMostProducts.map((vendor) => ({
      vendorId: vendor.id,
      vendorName: `${vendor.firstName} ${vendor.lastName}`,
      shopName: vendor.shop_name || 'N/A',
      email: vendor.email,
      vendorType: vendor.vendorType?.label || 'N/A',
      totalProducts: vendor._count.vendorProducts,
      commissionRate: vendor.vendorCommission?.commissionRate || 40,
      profileImage: vendor.profile_photo_url,
    }));

    return {
      byRevenue,
      bySales,
      byProducts,
    };
  }

  private async getProductStats() {
    // Compter tous les produits par statut
    const totalProducts = await this.prisma.vendorProduct.count({
      where: {
        isDelete: false,
      },
    });

    const publishedProducts = await this.prisma.vendorProduct.count({
      where: {
        isDelete: false,
        status: 'PUBLISHED',
      },
    });

    const pendingProducts = await this.prisma.vendorProduct.count({
      where: {
        isDelete: false,
        status: 'PENDING',
      },
    });

    const draftProducts = await this.prisma.vendorProduct.count({
      where: {
        isDelete: false,
        status: 'DRAFT',
      },
    });

    const rejectedProducts = await this.prisma.vendorProduct.count({
      where: {
        isDelete: false,
        status: 'REJECTED',
      },
    });

    // Récupérer la liste détaillée des produits en attente
    const productsAwaitingValidation = await this.prisma.vendorProduct.findMany({
      where: {
        isDelete: false,
        status: 'PENDING',
      },
      take: 50, // Limiter à 50 pour ne pas surcharger
      orderBy: {
        submittedForValidationAt: 'asc', // Les plus anciens en premier
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
          },
        },
        design: {
          select: {
            name: true,
          },
        },
        images: {
          take: 1,
          select: {
            cloudinaryUrl: true,
          },
        },
      },
    });

    const productsAwaitingValidationDto: PendingProductDto[] =
      productsAwaitingValidation.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        vendorId: product.vendorId,
        vendorName: `${product.vendor.firstName} ${product.vendor.lastName}`,
        shopName: product.vendor.shop_name || 'N/A',
        submittedAt: product.submittedForValidationAt || product.createdAt,
        hasDesign: !!product.designId,
        designName: product.design?.name,
        imageUrl: product.images[0]?.cloudinaryUrl,
      }));

    return {
      totalProducts,
      publishedProducts,
      pendingProducts,
      draftProducts,
      rejectedProducts,
      productsAwaitingValidation: productsAwaitingValidationDto,
    };
  }

  private async getDesignStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Compter tous les designs
    const totalDesigns = await this.prisma.design.count({
      where: {
        isDelete: false,
      },
    });

    const publishedDesigns = await this.prisma.design.count({
      where: {
        isDelete: false,
        isPublished: true,
      },
    });

    const pendingDesigns = await this.prisma.design.count({
      where: {
        isDelete: false,
        isPending: true,
      },
    });

    const draftDesigns = await this.prisma.design.count({
      where: {
        isDelete: false,
        isDraft: true,
      },
    });

    const validatedDesigns = await this.prisma.design.count({
      where: {
        isDelete: false,
        isValidated: true,
      },
    });

    // Statistiques d'utilisation des designs
    const totalDesignUsage = await this.prisma.designUsage.count();

    const thisMonthDesignUsage = await this.prisma.designUsage.count({
      where: {
        usedAt: {
          gte: startOfMonth,
        },
      },
    });

    // Récupérer la liste détaillée des designs en attente
    const designsAwaitingValidation = await this.prisma.design.findMany({
      where: {
        isDelete: false,
        isPending: true,
      },
      take: 50, // Limiter à 50
      orderBy: {
        submittedForValidationAt: 'asc', // Les plus anciens en premier
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    const designsAwaitingValidationDto: PendingDesignDto[] =
      designsAwaitingValidation.map((design) => ({
        id: design.id,
        name: design.name,
        price: design.price,
        vendorId: design.vendorId,
        vendorName: `${design.vendor.firstName} ${design.vendor.lastName}`,
        shopName: design.vendor.shop_name || 'N/A',
        submittedAt: design.submittedForValidationAt || design.createdAt,
        thumbnailUrl: design.thumbnailUrl,
        category: design.category?.name,
        tags: design.tags || [],
      }));

    return {
      totalDesigns,
      publishedDesigns,
      pendingDesigns,
      draftDesigns,
      validatedDesigns,
      designsAwaitingValidation: designsAwaitingValidationDto,
      totalDesignUsage,
      thisMonthDesignUsage,
    };
  }

  private async getOrderStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Compter toutes les commandes
    const totalOrders = await this.prisma.order.count();

    const thisMonthOrders = await this.prisma.order.count({
      where: {
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Compter par statut
    const pendingOrders = await this.prisma.order.count({
      where: {
        status: 'PENDING',
      },
    });

    const confirmedOrders = await this.prisma.order.count({
      where: {
        status: 'CONFIRMED',
      },
    });

    const processingOrders = await this.prisma.order.count({
      where: {
        status: 'PROCESSING',
      },
    });

    const shippedOrders = await this.prisma.order.count({
      where: {
        status: 'SHIPPED',
      },
    });

    const deliveredOrders = await this.prisma.order.count({
      where: {
        status: 'DELIVERED',
      },
    });

    const cancelledOrders = await this.prisma.order.count({
      where: {
        status: 'CANCELLED',
      },
    });

    // Calculer la valeur moyenne d'une commande
    const orderAggregate = await this.prisma.order.aggregate({
      _avg: {
        totalAmount: true,
      },
      where: {
        status: {
          notIn: ['CANCELLED', 'REJECTED'],
        },
      },
    });

    // Calculer le chiffre d'affaires ce mois
    const thisMonthRevenueAggregate = await this.prisma.order.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        createdAt: {
          gte: startOfMonth,
        },
        status: {
          in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
        },
      },
    });

    return {
      totalOrders,
      thisMonthOrders,
      pendingOrders,
      confirmedOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      averageOrderValue: orderAggregate._avg.totalAmount || 0,
      thisMonthRevenue: thisMonthRevenueAggregate._sum.totalAmount || 0,
    };
  }

  private async getPendingFundRequests() {
    // Récupérer toutes les demandes de fonds en attente
    const requests = await this.prisma.vendorFundsRequest.findMany({
      where: {
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'asc', // Les plus anciennes en premier
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            shop_name: true,
            email: true,
          },
        },
      },
    });

    const totalAmount = requests.reduce(
      (sum, request) => sum + request.requestedAmount,
      0,
    );

    const requestsDto: PendingFundRequestDto[] = requests.map((request) => ({
      id: request.id,
      vendorId: request.vendorId,
      vendorName: `${request.vendor.firstName} ${request.vendor.lastName}`,
      shopName: request.vendor.shop_name || 'N/A',
      requestedAmount: request.requestedAmount,
      paymentMethod: request.paymentMethod,
      phoneNumber: request.phoneNumber,
      bankIban: request.bankIban,
      requestedAt: request.createdAt,
      vendorEmail: request.vendor.email,
    }));

    return {
      count: requests.length,
      totalAmount,
      requests: requestsDto,
    };
  }
}
