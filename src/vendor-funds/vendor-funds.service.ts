import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CommissionService } from '../commission/commission.service';
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

  constructor(
    private prisma: PrismaService,
    private commissionService: CommissionService,
  ) {}

  /**
   * Calculer les gains d'un vendeur basés sur les commandes confirmées et payées
   */
  async calculateVendorEarnings(vendorId: number): Promise<VendorEarningsData> {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Récupérer le taux de commission personnalisé du vendeur
    const vendorCommission = await this.commissionService.getCommissionByVendorId(vendorId);
    const vendorCommissionRate = vendorCommission ? vendorCommission.commissionRate / 100 : 0.4; // Convertir en décimal

    console.log(`[VENDOR ${vendorId}] Début du calcul des gains - Taux commission: ${(vendorCommissionRate * 100).toFixed(2)}%`);

    // Calculer les gains depuis les commandes LIVRÉES ET PAYÉES uniquement
    // 🔒 SÉCURITÉ: Le vendeur ne peut retirer que les montants des commandes livrées ET payées
    // Ces commandes ont déjà la commission appliquée et le paiement validé
    const validOrders = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        // Filtrer les commandes contenant des produits du vendeur
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

    console.log(`[VENDOR ${vendorId}] Nombre de commandes valides trouvées: ${validOrders.length}`);

    // Calculer les gains en utilisant les valeurs déjà calculées dans les commandes
    let totalEarnings = 0; // Gains nets pour le vendeur (après commission) = somme des vendorAmount
    let totalCommissionAmount = 0; // Commission totale prélevée par l'admin = somme des commissionAmount
    let thisMonthEarnings = 0;
    let lastMonthEarnings = 0;
    let totalSalesAmount = 0; // Montant total des ventes avant commission

    for (const order of validOrders) {
      for (const item of order.orderItems) {
        if (item.product.vendorProducts.length > 0) {
          const orderItemTotal = item.unitPrice * item.quantity;
          const vendorProduct = item.product.vendorProducts[0];

          // Calculer le bénéfice du vendeur: Prix de vente - Prix de reviens (product.price)
          const productCost = item.product.price || 0; // Prix de reviens du produit
          const totalBaseCost = productCost * item.quantity;

          // Le bénéfice réel du vendeur = prix de vente - prix de reviens
          const vendorProfit = orderItemTotal - totalBaseCost;

          // Calculer la commission basée sur le bénéfice et le taux de commission
          const commissionRate = (order.commissionRate || vendorCommissionRate * 100) / 100; // Convertir en décimal
          const commissionAmount = vendorProfit * commissionRate;

          // Gains nets du vendeur = Bénéfice - Commission admin
          const vendorNetEarnings = vendorProfit - commissionAmount;

          totalEarnings += vendorNetEarnings; // Gains nets après déduction de la commission
          totalCommissionAmount += commissionAmount; // Commission prélevée par l'admin
          totalSalesAmount += orderItemTotal;

          // Gains de ce mois
          if (order.createdAt >= firstDayThisMonth) {
            thisMonthEarnings += vendorNetEarnings;
          }

          // Gains du mois dernier
          if (order.createdAt >= firstDayLastMonth && order.createdAt <= lastDayLastMonth) {
            lastMonthEarnings += vendorNetEarnings;
          }

          console.log(`[VENDOR ${vendorId}] Commande ${order.orderNumber} (ID: ${order.id}):`, {
            orderItemTotal,
            totalBaseCost,
            vendorProfit,
            commissionAmount,
            vendorNetEarnings,
            orderStatus: order.status,
            paymentStatus: order.paymentStatus,
            commissionRate: commissionRate,
            productCost
          });
        }
      }
    }

    // 🎨 Ajouter les revenus des designs CONFIRMÉS
    const designUsages = await this.prisma.designUsage.findMany({
      where: {
        vendorId,
        paymentStatus: 'CONFIRMED' // Designs des commandes confirmées et payées
      },
      select: {
        vendorRevenue: true,
        usedAt: true
      }
    });

    console.log(`[VENDOR ${vendorId}] Nombre de designs utilisés trouvés: ${designUsages.length}`);

    let totalDesignRevenue = 0;
    for (const designUsage of designUsages) {
      const designRevenue = parseFloat(designUsage.vendorRevenue.toString());
      totalDesignRevenue += designRevenue;
      totalEarnings += designRevenue; // Ajouter aux gains totaux

      // Gains de ce mois
      if (designUsage.usedAt >= firstDayThisMonth) {
        thisMonthEarnings += designRevenue;
      }

      // Gains du mois dernier
      if (designUsage.usedAt >= firstDayLastMonth && designUsage.usedAt <= lastDayLastMonth) {
        lastMonthEarnings += designRevenue;
      }
    }

    console.log(`[VENDOR ${vendorId}] Total revenus designs: ${totalDesignRevenue} FCFA`);

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

    // 💰 Montant disponible pour le vendeur = Gains nets (commission déjà déduite) - Déjà retiré - En attente
    const availableAmount = Math.max(0, totalEarnings - pendingAmount - paidAmount);

    // Utiliser le taux de commission personnalisé du vendeur au lieu de calculer une moyenne
    const averageCommissionRate = vendorCommissionRate;

    // Mettre à jour le cache des gains (sans availableAmount qui se calcule dynamiquement)
    await this.prisma.vendorEarnings.upsert({
      where: { vendorId: vendorId },
      update: {
        totalEarnings,
        thisMonthEarnings,
        lastMonthEarnings,
        totalCommissionPaid: totalCommissionAmount, // Utiliser le montant réel de commission calculée
        averageCommissionRate: averageCommissionRate,
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
        averageCommissionRate: averageCommissionRate,
      },
    });

    console.log(`[VENDOR ${vendorId}] Calcul complet des gains:`, {
      totalSalesAmount,
      totalEarnings,
      totalDesignRevenue,
      totalCommissionAmount,
      paidAmount,
      pendingAmount,
      availableAmount,
      averageCommissionRate: `${(averageCommissionRate * 100).toFixed(2)}%`
    });

    return {
      totalEarnings,
      pendingAmount,
      availableAmount,
      thisMonthEarnings,
      lastMonthEarnings,
      commissionPaid: totalCommissionAmount, // Commission réelle déduite
      totalCommission: totalCommissionAmount, // Commission totale prélevée
      averageCommissionRate: averageCommissionRate,
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

    // totalEarnings contient déjà les gains nets (commission déjà déduite)
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
      commissionPaid: realTimeEarnings.commissionPaid, // Commission réelle déduite
      totalCommission: realTimeEarnings.totalCommission, // Commission totale prélevée
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