import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FundsRequestStatus, PaymentMethodType } from '@prisma/client';
import {
  VendorFundsRequestFiltersDto,
  CreateFundsRequestDto,
  ProcessFundsRequestDto,
  BatchProcessFundsRequestDto,
  AdminFundsRequestFiltersDto,
  FundsRequestData,
  VendorEarningsData,
  VendorFundsRequestsListData,
  AdminFundsStatistics,
} from './dto/vendor-funds.dto';

@Injectable()
export class VendorFundsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculer les gains d'un vendeur
   */
  async calculateVendorEarnings(vendorId: number): Promise<VendorEarningsData> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculer les gains totaux depuis les commandes livrées
    const deliveredOrders = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED',
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
        orderItems: {
          include: {
            product: {
              include: {
                vendorProducts: {
                  where: { vendorId: vendorId },
                },
              },
            },
          },
        },
      },
    });

    // Calculer les gains avec commission
    let totalEarnings = 0;
    let thisMonthEarnings = 0;
    let lastMonthEarnings = 0;

    for (const order of deliveredOrders) {
      for (const item of order.orderItems) {
        if (item.product.vendorProducts.length > 0) {
          const vendorProduct = item.product.vendorProducts[0];
          const commissionRate = 0.10; // Taux par défaut
          const itemEarnings = item.unitPrice * item.quantity * (1 - commissionRate);

          totalEarnings += itemEarnings;

          // Gains de ce mois
          if (order.createdAt >= firstDayThisMonth) {
            thisMonthEarnings += itemEarnings;
          }

          // Gains du mois dernier
          if (order.createdAt >= firstDayLastMonth && order.createdAt <= lastDayLastMonth) {
            lastMonthEarnings += itemEarnings;
          }
        }
      }
    }

    // Calculer les montants en attente et payés
    const pendingRequests = await this.prisma.vendorFundsRequest.findMany({
      where: {
        vendorId: vendorId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    const paidRequests = await this.prisma.vendorFundsRequest.findMany({
      where: {
        vendorId: vendorId,
        status: 'PAID',
      },
    });

    const pendingAmount = pendingRequests.reduce((sum, req) => sum + req.amount, 0);
    const paidAmount = paidRequests.reduce((sum, req) => sum + req.amount, 0);
    const availableAmount = Math.max(0, totalEarnings - pendingAmount - paidAmount);

    // Mettre à jour le cache des gains
    await this.prisma.vendorEarnings.upsert({
      where: { vendorId: vendorId },
      update: {
        totalEarnings,
        availableAmount,
        pendingAmount,
        thisMonthEarnings,
        lastMonthEarnings,
        totalCommissionPaid: totalEarnings * 0.10,
        lastCalculatedAt: new Date(),
      },
      create: {
        vendorId,
        totalEarnings,
        availableAmount,
        pendingAmount,
        thisMonthEarnings,
        lastMonthEarnings,
        totalCommissionPaid: totalEarnings * 0.10,
        averageCommissionRate: 0.10,
      },
    });

    return {
      totalEarnings,
      pendingAmount,
      availableAmount,
      thisMonthEarnings,
      lastMonthEarnings,
      commissionPaid: totalEarnings * 0.10,
      totalCommission: totalEarnings * 0.10,
      averageCommissionRate: 0.10,
    };
  }

  /**
   * Récupérer les gains du vendeur
   */
  async getVendorEarnings(vendorId: number): Promise<VendorEarningsData> {
    return await this.calculateVendorEarnings(vendorId);
  }

  /**
   * Récupérer les demandes du vendeur
   */
  async getVendorFundsRequests(
    vendorId: number,
    filters: VendorFundsRequestFiltersDto,
  ): Promise<VendorFundsRequestsListData> {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const offset = (page - 1) * limit;

    const whereConditions: any = {
      vendorId: vendorId,
    };

    if (status) {
      whereConditions.status = status;
    }

    if (startDate && endDate) {
      whereConditions.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [requests, total] = await Promise.all([
      this.prisma.vendorFundsRequest.findMany({
        where: whereConditions,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              shop_name: true,
            },
          },
          processedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.vendorFundsRequest.count({ where: whereConditions }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      requests: requests.map((req) => this.formatFundsRequest(req)),
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Créer une demande d'appel de fonds
   */
  async createFundsRequest(
    vendorId: number,
    createData: CreateFundsRequestDto,
  ): Promise<FundsRequestData> {
    const { amount, description, paymentMethod, phoneNumber, orderIds } = createData;

    // Vérifier le solde disponible
    const earnings = await this.calculateVendorEarnings(vendorId);

    if (earnings.availableAmount < amount) {
      throw new BadRequestException(
        `Solde insuffisant. Disponible: ${earnings.availableAmount} FCFA, Demandé: ${amount} FCFA`
      );
    }

    // Créer la demande
    const fundsRequest = await this.prisma.vendorFundsRequest.create({
      data: {
        vendorId,
        amount,
        requestedAmount: amount,
        description,
        paymentMethod,
        phoneNumber,
        availableBalance: earnings.availableAmount,
        commissionRate: earnings.averageCommissionRate,
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            shop_name: true,
          },
        },
      },
    });

    // Lier aux commandes si spécifiées
    if (orderIds && orderIds.length > 0) {
      const orderLinks = orderIds.map((orderId) => ({
        fundsRequestId: fundsRequest.id,
        orderId,
      }));

      await this.prisma.vendorFundsRequestOrder.createMany({
        data: orderLinks,
      });
    }

    return this.formatFundsRequest(fundsRequest);
  }

  /**
   * Récupérer les détails d'une demande
   */
  async getFundsRequestDetails(
    vendorId: number,
    requestId: number,
  ): Promise<FundsRequestData> {
    const request = await this.prisma.vendorFundsRequest.findFirst({
      where: {
        id: requestId,
        vendorId: vendorId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            shop_name: true,
          },
        },
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }

    return this.formatFundsRequest(request);
  }

  /**
   * Annuler une demande en attente
   */
  async cancelFundsRequest(
    vendorId: number,
    requestId: number,
  ): Promise<FundsRequestData> {
    const request = await this.prisma.vendorFundsRequest.findFirst({
      where: {
        id: requestId,
        vendorId: vendorId,
        status: 'PENDING',
      },
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée ou non modifiable');
    }

    const updatedRequest = await this.prisma.vendorFundsRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED', rejectReason: 'Annulée par le vendeur' },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            shop_name: true,
          },
        },
      },
    });

    return this.formatFundsRequest(updatedRequest);
  }

  /**
   * MÉTHODES ADMIN
   */

  /**
   * Récupérer toutes les demandes (admin)
   */
  async getAllFundsRequests(
    filters: AdminFundsRequestFiltersDto,
  ): Promise<VendorFundsRequestsListData> {
    const {
      page = 1,
      limit = 10,
      status,
      vendorId,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const offset = (page - 1) * limit;
    const whereConditions: any = {};

    if (status) whereConditions.status = status;
    if (vendorId) whereConditions.vendorId = vendorId;

    if (startDate && endDate) {
      whereConditions.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (minAmount || maxAmount) {
      whereConditions.amount = {};
      if (minAmount) whereConditions.amount.gte = minAmount;
      if (maxAmount) whereConditions.amount.lte = maxAmount;
    }

    const [requests, total] = await Promise.all([
      this.prisma.vendorFundsRequest.findMany({
        where: whereConditions,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              shop_name: true,
            },
          },
          processedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: offset,
        take: limit,
      }),
      this.prisma.vendorFundsRequest.count({ where: whereConditions }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      requests: requests.map((req) => this.formatFundsRequest(req)),
      total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  /**
   * Statistiques admin
   */
  async getAdminFundsStatistics(): Promise<AdminFundsStatistics> {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Statistiques par statut
    const statusStats = await this.prisma.vendorFundsRequest.groupBy({
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    });

    // Statistiques par méthode de paiement
    const methodStats = await this.prisma.vendorFundsRequest.groupBy({
      by: ['paymentMethod'],
      _count: { id: true },
    });

    // Statistiques du jour
    const todayStats = await this.prisma.vendorFundsRequest.findMany({
      where: {
        processedAt: { gte: todayStart },
        status: { in: ['APPROVED', 'PAID'] },
      },
    });

    // Temps moyen de traitement (derniers 30 jours)
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const processedRequests = await this.prisma.vendorFundsRequest.findMany({
      where: {
        processedAt: { not: null },
        createdAt: { gte: last30Days },
      },
      select: {
        createdAt: true,
        processedAt: true,
      },
    });

    const totalProcessingTime = processedRequests.reduce((sum, req) => {
      if (req.processedAt) {
        const diff = req.processedAt.getTime() - req.createdAt.getTime();
        return sum + (diff / (1000 * 60 * 60)); // en heures
      }
      return sum;
    }, 0);

    const averageProcessingTime = processedRequests.length > 0
      ? totalProcessingTime / processedRequests.length
      : 0;

    // Formater les résultats
    const requestsByStatus = {
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
    };

    statusStats.forEach((stat) => {
      requestsByStatus[stat.status.toLowerCase() as keyof typeof requestsByStatus] = stat._count.id;
    });

    const requestsByPaymentMethod = {
      wave: 0,
      orangeMoney: 0,
      bankTransfer: 0,
    };

    methodStats.forEach((stat) => {
      switch (stat.paymentMethod) {
        case 'WAVE':
          requestsByPaymentMethod.wave = stat._count.id;
          break;
        case 'ORANGE_MONEY':
          requestsByPaymentMethod.orangeMoney = stat._count.id;
          break;
        case 'BANK_TRANSFER':
          requestsByPaymentMethod.bankTransfer = stat._count.id;
          break;
      }
    });

    const pendingStat = statusStats.find((s) => s.status === 'PENDING');
    const todayProcessedAmount = todayStats.reduce((sum, req) => sum + req.amount, 0);

    return {
      totalPendingRequests: pendingStat?._count.id || 0,
      totalPendingAmount: pendingStat?._sum.amount || 0,
      totalProcessedToday: todayStats.length,
      totalProcessedAmount: todayProcessedAmount,
      averageProcessingTime,
      requestsByStatus,
      requestsByPaymentMethod,
    };
  }

  /**
   * Traiter une demande (admin)
   */
  async processFundsRequest(
    adminId: number,
    requestId: number,
    processData: ProcessFundsRequestDto,
  ): Promise<FundsRequestData> {
    const { status, adminNote, rejectReason } = processData;

    // Vérifier que la demande existe
    const request = await this.prisma.vendorFundsRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }

    if (!['PENDING', 'APPROVED'].includes(request.status)) {
      throw new BadRequestException('Cette demande ne peut plus être modifiée');
    }

    if (status === 'REJECTED' && !rejectReason) {
      throw new BadRequestException('La raison du rejet est requise');
    }

    // Mettre à jour la demande
    const updatedRequest = await this.prisma.vendorFundsRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNote,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
        processedBy: adminId,
        processedAt: new Date(),
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            shop_name: true,
          },
        },
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.formatFundsRequest(updatedRequest);
  }

  /**
   * Traitement en lot (admin)
   */
  async batchProcessRequests(
    adminId: number,
    batchData: BatchProcessFundsRequestDto,
  ): Promise<{ processed: number; errors: string[] }> {
    const { requestIds, status, adminNote, rejectReason } = batchData;

    if (status === 'REJECTED' && !rejectReason) {
      throw new BadRequestException('La raison du rejet est requise pour le traitement en lot');
    }

    let processed = 0;
    const errors: string[] = [];

    for (const requestId of requestIds) {
      try {
        await this.processFundsRequest(adminId, requestId, {
          status,
          adminNote,
          rejectReason,
        });
        processed++;
      } catch (error) {
        errors.push(`Demande ${requestId}: ${error.message}`);
      }
    }

    return { processed, errors };
  }

  /**
   * Exposer le service Prisma pour l'admin
   */
  get prismaService() {
    return this.prisma;
  }

  /**
   * Formatter une demande pour la réponse
   */
  formatFundsRequest(request: any): FundsRequestData {
    return {
      id: request.id,
      vendorId: request.vendorId,
      vendor: request.vendor ? {
        id: request.vendor.id,
        firstName: request.vendor.firstName,
        lastName: request.vendor.lastName,
        email: request.vendor.email,
        shopName: request.vendor.shop_name,
      } : undefined,
      amount: request.amount,
      requestedAmount: request.requestedAmount,
      description: request.description,
      paymentMethod: request.paymentMethod,
      phoneNumber: request.phoneNumber,
      status: request.status,
      rejectReason: request.rejectReason,
      adminNote: request.adminNote,
      processedBy: request.processedBy,
      processedByUser: request.processedByUser,
      processedAt: request.processedAt?.toISOString(),
      availableBalance: request.availableBalance,
      commissionRate: request.commissionRate,
      requestDate: request.createdAt.toISOString(),
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }
}