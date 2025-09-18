import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus } from '@prisma/client';
import {
  VendorOrderFiltersDto,
  VendorOrder,
  VendorOrdersListData,
  VendorStatistics,
  VendorNotification,
} from './dto/vendor-orders.dto';

@Injectable()
export class VendorOrdersService {
  constructor(private prisma: PrismaService) {}


  /**
   * Récupérer les commandes du vendeur avec filtres et pagination
   */
  async getVendorOrders(
    vendorId: number,
    filters: VendorOrderFiltersDto,
  ): Promise<VendorOrdersListData> {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const offset = (page - 1) * limit;

    // Construction des filtres WHERE
    const whereConditions: any = {
      orderItems: {
        some: {
          product: {
            vendorProducts: {
              some: {
                vendorId: vendorId,
              },
            },
          },
        },
      },
    };

    // Filtre par statut
    if (status) {
      whereConditions.status = status;
    }

    // Filtre par recherche (numéro commande, nom client, email)
    if (search) {
      whereConditions.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Filtre par plage de dates
    if (startDate) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      whereConditions.createdAt = {
        ...whereConditions.createdAt,
        lte: new Date(endDate),
      };
    }

    // Filtre par montant
    if (minAmount) {
      whereConditions.totalAmount = {
        ...whereConditions.totalAmount,
        gte: minAmount,
      };
    }
    if (maxAmount) {
      whereConditions.totalAmount = {
        ...whereConditions.totalAmount,
        lte: maxAmount,
      };
    }

    // Requête principale avec pagination
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: whereConditions,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              photo_profil: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  price: true,
                },
              },
              colorVariation: {
                select: {
                  id: true,
                  name: true,
                  colorCode: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.order.count({ where: whereConditions }),
    ]);

    // Formatage des commandes selon la structure attendue
    const formattedOrders = orders.map((order) => this.formatOrder(order));

    const totalPages = Math.ceil(total / limit);

    return {
      orders: formattedOrders,
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Récupérer les détails d'une commande spécifique
   */
  async getOrderDetails(vendorId: number, orderId: number): Promise<VendorOrder> {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        orderItems: {
          some: {
            product: {
              vendorProducts: {
                some: {
                  vendorId: vendorId,
                },
              },
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            photo_profil: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                price: true,
              },
            },
            colorVariation: {
              select: {
                id: true,
                name: true,
                colorCode: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée ou accès non autorisé');
    }

    return this.formatOrder(order);
  }


  /**
   * Récupérer les statistiques du vendeur
   */
  async getVendorStatistics(vendorId: number): Promise<VendorStatistics> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Condition pour les commandes du vendeur
    const vendorOrderCondition = {
      orderItems: {
        some: {
          product: {
            vendorProducts: {
              some: {
                vendorId: vendorId,
              },
            },
          },
        },
      },
    };

    // Requêtes parallèles pour les statistiques
    const [
      allOrders,
      pendingCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      thisMonthOrders,
      lastMonthOrders,
    ] = await Promise.all([
      // Toutes les commandes du vendeur
      this.prisma.order.findMany({
        where: vendorOrderCondition,
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),
      // Compteurs par statut
      this.prisma.order.count({
        where: { ...vendorOrderCondition, status: 'PENDING' },
      }),
      this.prisma.order.count({
        where: { ...vendorOrderCondition, status: 'PROCESSING' },
      }),
      this.prisma.order.count({
        where: { ...vendorOrderCondition, status: 'SHIPPED' },
      }),
      this.prisma.order.count({
        where: { ...vendorOrderCondition, status: 'DELIVERED' },
      }),
      this.prisma.order.count({
        where: { ...vendorOrderCondition, status: 'CANCELLED' },
      }),
      // Commandes ce mois-ci
      this.prisma.order.findMany({
        where: {
          ...vendorOrderCondition,
          createdAt: { gte: firstDayThisMonth },
        },
      }),
      // Commandes le mois dernier
      this.prisma.order.findMany({
        where: {
          ...vendorOrderCondition,
          createdAt: {
            gte: firstDayLastMonth,
            lte: lastDayLastMonth,
          },
        },
      }),
    ]);

    // Calculs des statistiques
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const revenueThisMonth = thisMonthOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const ordersThisMonth = thisMonthOrders.length;

    const revenueLastMonth = lastMonthOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0,
    );
    const ordersLastMonth = lastMonthOrders.length;

    // Calcul de la croissance mensuelle
    const monthlyGrowth =
      revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : revenueThisMonth > 0
        ? 100
        : 0;

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      monthlyGrowth,
      pendingOrders: pendingCount,
      processingOrders: processingCount,
      shippedOrders: shippedCount,
      deliveredOrders: deliveredCount,
      cancelledOrders: cancelledCount,
      revenueThisMonth,
      ordersThisMonth,
      revenueLastMonth,
      ordersLastMonth,
    };
  }

  /**
   * Export des commandes en CSV
   */
  async exportOrdersCSV(
    vendorId: number,
    filters: Partial<VendorOrderFiltersDto>,
  ): Promise<string> {
    const orders = await this.getVendorOrders(vendorId, {
      ...filters,
      page: 1,
      limit: 1000, // Limite raisonnable pour l'export
    });

    // En-têtes CSV selon la documentation
    const headers = [
      'Numéro',
      'Client',
      'Email',
      'Statut',
      'Montant',
      'Date Création',
      'Date Livraison',
    ];

    const csvRows = [headers.join(',')];

    orders.orders.forEach((order) => {
      const row = [
        order.orderNumber,
        `${order.user.firstName} ${order.user.lastName}`,
        order.user.email,
        order.status,
        order.totalAmount.toString(),
        order.createdAt,
        order.deliveredAt || '',
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Récupérer les notifications du vendeur
   */
  async getVendorNotifications(vendorId: number): Promise<VendorNotification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: vendorId,
        type: {
          in: ['ORDER_NEW', 'ORDER_UPDATED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limiter à 50 notifications récentes
    });

    return notifications.map((notif) => ({
      id: notif.id,
      type: this.mapNotificationType(notif.type),
      title: notif.title,
      message: notif.message,
      orderId: (notif.metadata as any)?.orderId || null,
      isRead: notif.isRead,
      createdAt: notif.createdAt.toISOString(),
    }));
  }

  /**
   * Marquer une notification comme lue
   */
  async markNotificationAsRead(
    vendorId: number,
    notificationId: number,
  ): Promise<void> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: vendorId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }


  /**
   * Formatter une commande selon la structure attendue
   */
  private formatOrder(order: any): VendorOrder {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      user: {
        id: order.user.id,
        firstName: order.user.firstName,
        lastName: order.user.lastName,
        email: order.user.email,
        role: order.user.role,
        photo_profil: order.user.photo_profil,
      },
      status: order.status,
      totalAmount: order.totalAmount,
      subtotal: order.totalAmount, // TODO: Calculer le sous-total réel
      taxAmount: 0, // TODO: Calculer la taxe si applicable
      shippingAmount: 3500, // TODO: Calculer les frais de livraison réels
      paymentMethod: 'MOBILE_MONEY', // TODO: Ajouter au schéma si nécessaire
      shippingAddress: this.formatShippingAddress(order),
      phoneNumber: order.phoneNumber,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      confirmedAt: order.confirmedAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      orderItems: order.orderItems.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        size: item.size,
        color: item.colorVariation?.name || item.color,
        colorId: item.colorId,
        productId: item.productId,
        productName: item.product.name,
        productImage: 'https://cloudinary.com/placeholder.jpg', // TODO: Récupérer l'image réelle
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          price: item.product.price,
          designName: 'Design Placeholder', // TODO: Récupérer le nom du design réel
          designDescription: 'Description du design', // TODO: Récupérer la description réelle
          designImageUrl: 'https://cloudinary.com/design-placeholder.jpg', // TODO: Récupérer l'image du design
          categoryId: 1, // TODO: Récupérer la catégorie réelle
          categoryName: 'Vêtements', // TODO: Récupérer le nom de la catégorie
        },
      })),
    };
  }

  /**
   * Formatter l'adresse de livraison
   */
  private formatShippingAddress(order: any) {
    return {
      name: `${order.user.firstName} ${order.user.lastName}`,
      firstName: order.user.firstName,
      lastName: order.user.lastName,
      street: order.shippingStreet || '123 Rue par défaut',
      city: order.shippingCity || 'Dakar',
      region: order.shippingRegion || 'Dakar',
      country: order.shippingCountry || 'Sénégal',
      fullFormatted: order.shippingAddressFull || `${order.shippingStreet || 'Adresse'}, ${order.shippingCity || 'Dakar'}, ${order.shippingCountry || 'Sénégal'}`,
      phone: order.phoneNumber,
    };
  }

  /**
   * Mapper le type de notification
   */
  private mapNotificationType(type: string): string {
    switch (type) {
      case 'ORDER_NEW':
        return 'NEW_ORDER';
      case 'ORDER_UPDATED':
        return 'ORDER_STATUS_CHANGED';
      default:
        return 'SYSTEM';
    }
  }
}