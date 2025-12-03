import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
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
  private readonly logger = new Logger(VendorFundsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Calculer les gains d'un vendeur basés sur les commandes après débit de commission
   */
  async calculateVendorEarnings(vendorId: number): Promise<VendorEarningsData> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Récupérer le taux de commission actuel du vendeur (priorité au taux personnalisé)
    const vendorCommission = await this.prisma.vendorCommission.findUnique({
      where: { vendorId: vendorId }
    });

    const commissionRate = vendorCommission?.commissionRate || 0.10; // Taux par défaut si non spécifié

    console.log(`[VENDOR ${vendorId}] Taux de commission utilisé: ${commissionRate}`);

    // Calculer les gains depuis les commandes confirmées et livrées (commission déjà débitée)
    // On considère CONFIRMED et DELIVERED car ces statuts indiquent que la commission a été appliquée
    const validOrders = await this.prisma.order.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'DELIVERED']
        },
        // Ne considérer que les commandes où la commission a été effectivement débitée
        // Cela signifie que la commande est complètement finalisée ou confirmée
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

    // Calculer les gains nets après commission
    let totalEarnings = 0; // Gains nets pour le vendeur (après commission)
    let totalCommissionAmount = 0; // Commission totale prélevée par l'admin
    let thisMonthEarnings = 0;
    let lastMonthEarnings = 0;

    for (const order of validOrders) {
      for (const item of order.orderItems) {
        if (item.product.vendorProducts.length > 0) {
          // Si la commission est déjà calculée dans la commande, utiliser ces valeurs
          // Sinon, la calculer avec le taux par défaut
          let netEarnings: number;
          let commissionAmount: number;
          let orderItemTotal: number;

          if (order.commissionAmount && order.vendorAmount) {
            // Utiliser les valeurs déjà calculées dans la commande
            orderItemTotal = item.unitPrice * item.quantity;
            commissionAmount = order.commissionAmount;
            netEarnings = order.vendorAmount;
          } else if (order.commissionRate) {
            // Utiliser le taux de commission de la commande
            orderItemTotal = item.unitPrice * item.quantity;
            commissionAmount = orderItemTotal * order.commissionRate;
            netEarnings = orderItemTotal - commissionAmount;
          } else {
            // Calcul par défaut
            orderItemTotal = item.unitPrice * item.quantity;
            commissionAmount = orderItemTotal * commissionRate;
            netEarnings = orderItemTotal - commissionAmount;
          }

          totalEarnings += netEarnings;
          totalCommissionAmount += commissionAmount;

          // Gains de ce mois
          if (order.createdAt >= firstDayThisMonth) {
            thisMonthEarnings += netEarnings;
          }

          // Gains du mois dernier
          if (order.createdAt >= firstDayLastMonth && order.createdAt <= lastDayLastMonth) {
            lastMonthEarnings += netEarnings;
          }

          console.log(`[VENDOR ${vendorId}] Commande ${order.id}:`, {
            orderItemTotal,
            commissionAmount,
            netEarnings,
            orderStatus: order.status,
            commissionRate: order.commissionRate || commissionRate
          });
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
    // 💰 Montant disponible pour le vendeur = Total gagné - Commission admin - Déjà retiré - En attente
    const availableAmount = Math.max(0, totalEarnings - totalCommissionAmount - pendingAmount - paidAmount);

    // Mettre à jour le cache des gains (sans availableAmount qui se calcule dynamiquement)
    await this.prisma.vendorEarnings.upsert({
      where: { vendorId: vendorId },
      update: {
        totalEarnings,
        thisMonthEarnings,
        lastMonthEarnings,
        totalCommissionPaid: totalCommissionAmount, // Utiliser le montant réel de commission calculée
        lastCalculatedAt: new Date(),
      },
      create: {
        vendorId,
        totalEarnings,
        availableAmount: 0, // Valeur par défaut, sera recalculée dynamiquement
        pendingAmount: 0,   // Valeur par défaut, sera recalculée dynamiquement
        thisMonthEarnings,
        lastMonthEarnings,
        totalCommissionPaid: totalCommissionAmount, // Commission admin réelle
        averageCommissionRate: 0.10,
      },
    });

    console.log(`[VENDOR ${vendorId}] Calcul complet des gains:`, {
      totalEarnings,
      paidAmount,
      pendingAmount,
      availableAmount
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
    // Forcer un recalcul en temps réel pour éviter les données cachées obsolètes
    const realTimeEarnings = await this.calculateVendorEarnings(vendorId);

    // Récupérer les demandes de fonds actuelles pour un calcul précis
    const fundsRequests = await this.prisma.vendorFundsRequest.findMany({
      where: { vendorId }
    });

    // Calculer les montants réels depuis les demandes
    const paidAmount = fundsRequests
      .filter(req => req.status === 'PAID')
      .reduce((sum, req) => sum + req.amount, 0);

    const pendingAmount = fundsRequests
      .filter(req => req.status === 'PENDING')
      .reduce((sum, req) => sum + req.amount, 0);

    const approvedAmount = fundsRequests
      .filter(req => req.status === 'APPROVED')
      .reduce((sum, req) => sum + req.amount, 0);

    // CORRECTION : Si realTimeEarnings.totalEarnings contient déjà les gains nets (après déduction commission),
    // alors on ne doit PLUS déduire la commission dans le calcul final
    // totalEarnings = GAINS NETS (commission déjà déduite)
    const availableAmount = Math.max(0, realTimeEarnings.totalEarnings - paidAmount - pendingAmount - approvedAmount);

    console.log(`[VENDOR ${vendorId}] Calcul des gains en temps réel:`, {
      totalEarnings: realTimeEarnings.totalEarnings,
      paidAmount,
      pendingAmount,
      approvedAmount,
      availableAmount
    });

    return {
      totalEarnings: realTimeEarnings.totalEarnings,
      availableAmount: availableAmount,
      pendingAmount: pendingAmount + approvedAmount, // Comprend les montants en attente et approuvés
      thisMonthEarnings: realTimeEarnings.thisMonthEarnings,
      lastMonthEarnings: realTimeEarnings.lastMonthEarnings,
      commissionPaid: 0, // Commission déjà déduite des gains nets
      totalCommission: 0, // Commission déjà déduite des gains nets
      averageCommissionRate: realTimeEarnings.averageCommissionRate,
    };
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
    // 🔧 VALIDATION DES DONNÉES D'ENTRÉE
    this.logger.log('🔍 Données reçues dans createFundsRequest:', JSON.stringify(createData));

    if (!createData || typeof createData !== 'object') {
      throw new BadRequestException('Les données de la demande sont requises et doivent être un objet JSON valide');
    }

    const { amount, description, paymentMethod, phoneNumber, iban, orderIds } = createData;

    // Validation des champs requis
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new BadRequestException('Le montant est requis et doit être un nombre positif (minimum 1000 FCFA)');
    }

    if (amount < 1000) {
      throw new BadRequestException('Le montant minimum de retrait est de 1000 FCFA');
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new BadRequestException('La description est requise et ne peut pas être vide');
    }

    if (!paymentMethod || typeof paymentMethod !== 'string') {
      throw new BadRequestException('La méthode de paiement est requise');
    }

    const validPaymentMethods = ['WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      throw new BadRequestException(`Méthode de paiement invalide. Options: ${validPaymentMethods.join(', ')}`);
    }

    if (paymentMethod !== 'BANK_TRANSFER' && (!phoneNumber || typeof phoneNumber !== 'string')) {
      throw new BadRequestException('Le numéro de téléphone est requis pour cette méthode de paiement');
    }

    if (paymentMethod === 'BANK_TRANSFER' && (!iban || typeof iban !== 'string')) {
      throw new BadRequestException('L\'IBAN est requis pour les virements bancaires');
    }

    // Vérifier le solde disponible avec un calcul précis en temps réel
    const earnings = await this.getVendorEarnings(vendorId);

    this.logger.log(`💰 [VENDOR ${vendorId}] Vérification solde disponible:`, {
      totalEarnings: earnings.totalEarnings,
      availableAmount: earnings.availableAmount,
      pendingAmount: earnings.pendingAmount,
      requestedAmount: amount
    });

    if (earnings.availableAmount < amount) {
      this.logger.warn(`⚠️ [VENDOR ${vendorId}] Solde insuffisant pour retrait:`, {
        disponible: earnings.availableAmount,
        demandé: amount,
        différence: amount - earnings.availableAmount
      });

      throw new BadRequestException(
        `Solde insuffisant. Disponible: ${earnings.availableAmount.toLocaleString('fr-FR')} FCFA, Demandé: ${amount.toLocaleString('fr-FR')} FCFA. ` +
        `Vous devez attendre que vos commandes soient livrées ou que vos demandes en attente soient traitées.`
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
        phoneNumber: paymentMethod === 'BANK_TRANSFER' ? null : phoneNumber,
        // Stocker l'IBAN pour virement bancaire si fourni (adapter le schéma si besoin)
        // bankIban: paymentMethod === 'BANK_TRANSFER' ? iban : null, // TODO: Add to schema
        availableBalance: earnings.availableAmount,
        commissionRate: earnings.averageCommissionRate,
        // Statut automatiquement en attente dès la demande
        status: 'PENDING',
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

    // Le rejet n'est plus autorisé
    if (status === 'REJECTED') {
      throw new BadRequestException('Le rejet de demandes n\'est plus autorisé.');
    }

    // Mettre à jour la demande
    const updatedRequest = await this.prisma.vendorFundsRequest.update({
      where: { id: requestId },
      data: {
        status,
        adminNote,
        rejectReason: null,
        processedBy: adminId,
        processedAt: new Date(),
        // 🔧 Ajouter la date de validation quand l'admin traite la demande
        validatedAt: new Date(),
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

    // Le rejet en lot n'est plus autorisé
    if (status === 'REJECTED') {
      throw new BadRequestException('Le rejet de demandes n\'est plus autorisé.');
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
      // 🔧 Ajout des nouvelles dates pour l'affichage
      requestedAt: request.requestedAt?.toISOString(),
      validatedAt: request.validatedAt?.toISOString(),
      availableBalance: request.availableBalance,
      commissionRate: request.commissionRate,
      requestDate: request.createdAt.toISOString(),
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    };
  }
}