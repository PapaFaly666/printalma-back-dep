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
                  images: {
                    select: {
                      id: true,
                      url: true,
                    },
                  },
                },
              },
              customization: true,
              vendorProduct: {
                include: {
                  vendor: true,
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
        user: true,
        validator: true,
        orderItems: {
          include: {
            product: true,
            colorVariation: {
              include: {
                images: {
                  include: {
                    delimitations: true,
                  },
                },
              },
            },
            customization: true,
            vendorProduct: {
              include: {
                vendor: true,
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
   * Formatter une commande selon la structure attendue (identique à formatOrderResponse)
   */
  private formatOrder(order: any): VendorOrder {
    // Recalculer les valeurs de commission et vendorAmount avec la nouvelle logique
    let calculatedVendorAmount = order.vendorAmount;
    let calculatedCommissionAmount = order.commissionAmount;

    // Recalculer seulement si la commande est payée et a des items
    if (order.paymentStatus === 'PAID' && order.orderItems && order.orderItems.length > 0) {
      let totalProfit = 0;

      // Calculer le bénéfice total pour cette commande
      for (const item of order.orderItems) {
        const productCost = item.product?.price || 0;
        const sellingPrice = item.unitPrice || 0;
        const quantity = item.quantity || 1;
        const itemProfit = (sellingPrice - productCost) * quantity;
        totalProfit += itemProfit;
      }

      // Recalculer la commission sur le bénéfice
      const commissionRate = (order.commissionRate || 59) / 100;
      calculatedCommissionAmount = totalProfit * commissionRate;
      calculatedVendorAmount = totalProfit - calculatedCommissionAmount;
    }

    // Calculer le bénéfice total de la commande (sans déduire la commission)
    let beneficeCommande = 0;
    if (order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        const productCost = item.product?.price || 0;
        const sellingPrice = item.unitPrice || 0;
        const quantity = item.quantity || 1;
        const itemProfit = (sellingPrice - productCost) * quantity;
        beneficeCommande += itemProfit;
      }
    }

    const baseOrder = {
      ...order,
      // Ajouter le bénéfice de la commande
      beneficeCommande: beneficeCommande,
      // Utiliser les valeurs recalculées
      vendorAmount: calculatedVendorAmount,
      commissionAmount: calculatedCommissionAmount,
      orderItems: order.orderItems.map((item: any) => {
        return {
          ...item,
          // 🆕 Prix et quantité
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice || (item.unitPrice * item.quantity),
          colorId: item.colorId,
          color: item.color,

          product: {
            ...item.product,
            orderedColorName: item.colorVariation?.name || null,
            orderedColorHexCode: item.colorVariation?.colorCode || null,
            orderedColorImageUrl: item.colorVariation?.images?.[0]?.url || null,
          },

          // 🎨 Inclure les données de personnalisation si présentes
          customization: item.customization ? {
            id: item.customization.id,
            designElements: item.customization.designElements,
            elementsByView: item.customization.elementsByView,
            previewImageUrl: item.customization.previewImageUrl,
            colorVariationId: item.customization.colorVariationId,
            viewId: item.customization.viewId,
            sizeSelections: item.customization.sizeSelections,
            status: item.customization.status,
            createdAt: item.customization.createdAt,
            updatedAt: item.customization.updatedAt,
            // 🎨 Indicateur de produit personnalisé
            isCustomized: true,
            hasDesignElements: Array.isArray(item.customization.designElements) && item.customization.designElements.length > 0,
            hasMultiViewDesign: item.customization.elementsByView && Object.keys(item.customization.elementsByView).length > 0
          } : null,

          // 🎨 Indicateur rapide de personnalisation
          isCustomizedProduct: !!item.customization || !!item.customizationId || !!item.customizationIds,

          // 🏪 Ajouter les informations du vendeur si le produit n'est pas personnalisé
          ...(!!item.customization || !!item.customizationId || !!item.customizationIds ? {} : {
            vendorInfo: item.vendorProduct?.vendor ? {
              id: item.vendorProduct.vendor.id,
              firstName: item.vendorProduct.vendor.firstName,
              lastName: item.vendorProduct.vendor.lastName,
              shopName: item.vendorProduct.vendor.shop_name,
              profilePhotoUrl: item.vendorProduct.vendor.profile_photo_url,
              email: `${item.vendorProduct.vendor.firstName}.${item.vendorProduct.vendor.lastName}@example.com`,
              phone: '+221' + '00000000',
              address: item.vendorProduct.vendor.address || null,
              country: item.vendorProduct.vendor.country || null,
              vendorType: item.vendorProduct.vendor.vendeur_type || 'ARTISTE',
              status: item.vendorProduct.vendor.status ? 'ACTIVE' : 'INACTIVE',
              createdAt: item.vendorProduct.vendor.created_at,
              lastLogin: item.vendorProduct.vendor.last_login_at,
              shopDescription: `Boutique ${item.vendorProduct.vendor.shop_name} - Spécialisé dans les produits personnalisés`,
              specialties: ['Personnalisation', 'Design personnalisé', 'Impression qualité'],
              responseTime: 'Quelques heures',
              rating: 4.5,
              totalSales: item.vendorProduct.salesCount || 0,
              totalRevenue: item.vendorProduct.totalRevenue || 0
            } : null
          }),

          // 🎨 MULTI-VUES: Métadonnées des vues avec imageUrl (IMPORTANT pour le frontend)
          viewsMetadata: item.viewsMetadata || null,
          designElementsByView: item.designElementsByView || null,
          customizationIds: item.customizationIds || null
        };
      })
    };

    // 🆕 Ajouter les informations de paiement enrichies
    const paymentInfo: any = {
      status: order.paymentStatus,
      status_text: this.getPaymentStatusText(order.paymentStatus),
      status_icon: this.getPaymentStatusIcon(order.paymentStatus),
      status_color: this.getPaymentStatusColor(order.paymentStatus),
      method: order.paymentMethod,
      method_text: this.getPaymentMethodText(order.paymentMethod),
      transaction_id: order.transactionId,
      attempts_count: order.paymentAttempts || 0,
      last_attempt_at: order.lastPaymentAttemptAt,
    };

    // 🆕 Ajouter détails sur les fonds insuffisants si applicable
    if (order.hasInsufficientFunds) {
      paymentInfo.insufficient_funds = {
        detected: true,
        last_failure_reason: order.lastPaymentFailureReason,
        message: '💰 Paiement échoué - Fonds insuffisants',
        user_message: '❌ Fonds insuffisants. Veuillez vérifier votre solde ou utiliser une autre méthode de paiement.',
        can_retry: true,
        retry_available: true,
      };
    }

    // 🆕 Inclure historique des tentatives si disponible
    if (order.paymentAttemptsHistory && order.paymentAttemptsHistory.length > 0) {
      paymentInfo.recent_attempts = order.paymentAttemptsHistory.slice(0, 3).map((attempt: any) => ({
        attempt_number: attempt.attemptNumber,
        status: attempt.status,
        attempted_at: attempt.attemptedAt,
        failure_reason: attempt.failureReason,
        failure_category: attempt.failureCategory,
        payment_method: attempt.paymentMethod,
      }));
    }

    // 🆕 Informations complètes du client pour l'admin
    const customerInfo: any = {
      // Informations utilisateur si disponible
      user_id: order.userId || null,
      user_firstname: order.user?.firstName || null,
      user_lastname: order.user?.lastName || null,
      user_email: order.user?.email || null,
      user_phone: order.user?.phone || null,
      user_role: order.user?.role || null,

      // Informations de livraison de la commande
      shipping_name: order.shippingName || null,
      shipping_email: order.email || null,
      shipping_phone: order.phoneNumber || null,

      // Informations de contact principales
      email: order.email || order.user?.email || null,
      phone: order.phoneNumber || order.user?.phone || null,

      // Nom complet pour affichage
      full_name: order.shippingName ||
        (order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : 'Client inconnu'),

      // Détails de livraison
      shipping_address: order.shippingDetails ? {
        address: order.shippingDetails.address || null,
        city: order.shippingDetails.city || null,
        postal_code: order.shippingDetails?.postalCode || null,
        country: order.shippingDetails.country || null,
        additional_info: order.shippingDetails.additionalInfo || null,
      } : null,

      // Notes client
      notes: order.notes || null,

      // Dates importantes
      created_at: order.createdAt || null,
      updated_at: order.updatedAt || null,
    };

    return {
      ...baseOrder,
      // 🆕 Inclure les champs de paiement directement pour le frontend
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId,
      paymentAttempts: order.paymentAttempts || 0,
      lastPaymentAttemptAt: order.lastPaymentAttemptAt,
      lastPaymentFailureReason: order.lastPaymentFailureReason,
      hasInsufficientFunds: order.hasInsufficientFunds || false,

      // 🆕 Garder payment_info pour compatibilité
      payment_info: paymentInfo,

      // 🆕 Informations complètes du client pour l'admin
      customer_info: customerInfo,

      // Champs supplémentaires pour correspondre à la réponse attendue
      user: order.user,
      validator: order.validator,
    };
  }

  /**
   * Obtenir le texte du statut de paiement
   */
  private getPaymentStatusText(status: string): string {
    switch (status) {
      case 'PAID': return 'Payé';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      case 'CANCELLED': return 'Annulé';
      default: return status;
    }
  }

  /**
   * Obtenir l'icône du statut de paiement
   */
  private getPaymentStatusIcon(status: string): string {
    switch (status) {
      case 'PAID': return '✅';
      case 'PENDING': return '⏳';
      case 'FAILED': return '❌';
      case 'CANCELLED': return '🚫';
      default: return '📄';
    }
  }

  /**
   * Obtenir la couleur du statut de paiement
   */
  private getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'PAID': return '#28A745';
      case 'PENDING': return '#FFA500';
      case 'FAILED': return '#DC3545';
      case 'CANCELLED': return '#6C757D';
      default: return '#007BFF';
    }
  }

  /**
   * Obtenir le texte de la méthode de paiement
   */
  private getPaymentMethodText(method: string): string {
    switch (method) {
      case 'PAYDUNYA': return 'PayDunya';
      case 'PAYTECH': return 'PayTech';
      case 'MOBILE_MONEY': return 'Mobile Money';
      case 'CREDIT_CARD': return 'Carte de crédit';
      default: return method || 'Non spécifié';
    }
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