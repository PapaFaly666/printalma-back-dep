import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException,
  ForbiddenException
} from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderGateway } from './order.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { Logger } from '@nestjs/common';
import { VendorFundsService } from '../vendor-funds/vendor-funds.service';
import { OrderStatus } from '@prisma/client';
import { CreateFundsRequestDto } from '../vendor-funds/dto/vendor-funds.dto';
import { PrismaService } from '../prisma.service';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    private readonly orderService: OrderService,
    private readonly orderGateway: OrderGateway,
    private readonly vendorFundsService: VendorFundsService,
    private readonly prisma: PrismaService
  ) {}

  // Créer une commande pour un invité (sans authentification)
  @Post('guest')
  @HttpCode(HttpStatus.CREATED)
  async createGuestOrder(@Body() createOrderDto: CreateOrderDto) {
    return {
      success: true,
      message: 'Commande invité créée avec succès',
      data: await this.orderService.createGuestOrder(createOrderDto)
    };
  }

  // Créer une nouvelle commande (utilisateurs)
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Request() req: Request & { user: any }, @Body() createOrderDto: CreateOrderDto) {
    return {
      success: true,
      message: 'Commande créée avec succès',
      data: await this.orderService.createOrder(req.user.sub, createOrderDto)
    };
  }

  // 🔍 Endpoint de test pour voir la structure des données (temporaire)
  @Get('admin/test-sample')
  async getSampleOrderStructure() {
    try {
      // Créer une structure de commande exemple avec toutes les infos client
      const sampleOrder = {
        success: true,
        message: 'Structure de commande pour le frontend',
        data: {
          orders: [
            {
              id: 1,
              orderNumber: 'CMD-2024-001',
              totalAmount: 15000,
              subTotal: 14000,
              taxAmount: 1000,
              shippingFee: 500,
              finalAmount: 15000,
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
              paymentMethod: 'PAYDUNYA',
              transactionId: 'test_token_123',
              itemsCount: 2,
              email: 'client@email.com',
              phoneNumber: '+221771234567',
              notes: 'Instructions spéciales pour la livraison',
              createdAt: '2024-01-15T10:30:00Z',
              updatedAt: '2024-01-15T10:35:00Z',
              estimatedDelivery: '2024-01-18T14:00:00Z',

              // 🎨 Informations enrichies sur le paiement
              payment_info: {
                status: 'PAID',
                status_text: 'Payé',
                status_icon: '✅',
                status_color: '#28A745',
                method: 'PAYDUNYA',
                method_text: 'PayDunya',
                transaction_id: 'test_token_123',
                attempts_count: 1,
                last_attempt_at: '2024-01-15T10:35:00Z'
              },

              // 🆕 INFORMATIONS COMPLÈTES DU CLIENT
              customer_info: {
                // Informations utilisateur si disponible
                user_id: 101,
                user_firstname: 'Client',
                user_lastname: 'Name',
                user_email: 'client@email.com',
                user_phone: '+221771234567',
                user_role: 'CLIENT',

                // Informations de livraison de la commande
                shipping_name: 'Client Name',
                shipping_email: 'client@email.com',
                shipping_phone: '+221771234567',

                // Informations de contact principales
                email: 'client@email.com',
                phone: '+221771234567',
                full_name: 'Client Name',

                // Détails de livraison
                shipping_address: {
                  address: '123 Rue, Dakar, Sénégal',
                  city: 'Dakar',
                  postal_code: '10000',
                  country: 'Sénégal',
                  additional_info: 'Face au marché, à côté du pharmacie'
                },

                // Notes client
                notes: 'Instructions spéciales pour la livraison',

                // Dates importantes
                created_at: '2024-01-15T10:30:00Z',
                updated_at: '2024-01-15T10:35:00Z'
              },

              // Articles de la commande
              order_items: [
                {
                  id: 1,
                  quantity: 2,
                  unitPrice: 7000,
                  totalPrice: 14000,
                  size: 'L',
                  color: 'Noir',
                  product: {
                    id: 101,
                    name: 'T-shirt personnalisé',
                    reference: 'TS-001',
                    description: 'T-shirt de qualité supérieure',
                    orderedColorName: 'Noir',
                    orderedColorHexCode: '#000000',
                    orderedColorImageUrl: null
                  }
                }
              ]
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
            hasNext: true,
            hasPrevious: false
          }
        }
      };

      return sampleOrder;
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la génération de la structure',
        error: error.message
      };
    }
  }

  // Obtenir toutes les commandes (admin seulement)
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async getAllOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    
    // Validation des paramètres
    if (pageNum < 1) {
      throw new BadRequestException('La page doit être supérieure à 0');
    }
    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('La limite doit être entre 1 et 100');
    }
    
    return {
      success: true,
      message: 'Commandes récupérées avec succès',
      data: await this.orderService.getAllOrders(pageNum, limitNum, status as any)
    };
  }

  // Obtenir les commandes de l'utilisateur connecté
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async getUserOrders(@Request() req: Request & { user: any }) {
    let orders;

    // L'utilisateur doit être authentifié grâce à JwtAuthGuard

    // Si l'utilisateur est un VENDEUR, récupérer les commandes de ses produits
    if (req.user.role === 'VENDEUR') {
      orders = await this.orderService.getVendorOrders(req.user.sub);
    } else {
      // Sinon, commandes normales (client)
      orders = await this.orderService.getUserOrders(req.user.sub);
    }

    // Calculer les statistiques
    const stats = this.calculateOrdersStatistics(orders);

    // 💰 Calculer le montant disponible pour les appels de fonds (seulement pour les vendeurs)
    let vendorFinances = null;
    if (req.user.role === 'VENDEUR') {
      vendorFinances = await this.calculateVendorAvailableFunds(req.user.sub, orders);

      // ✅ Mettre à jour les statistiques avec les revenus designs
      // Les statistics.totalVendorAmount ne contient que les produits, il faut ajouter les designs
      if (vendorFinances) {
        // Recalculer totalRevenue et totalVendorAmount en incluant les designs
        stats.totalVendorAmount = vendorFinances.totalEarnings; // Total incluant produits + designs
        stats.totalRevenue = stats.totalCommission + vendorFinances.totalEarnings; // Commission + gains vendeur
      }
    }

    return {
      success: true,
      message: 'Vos commandes récupérées avec succès',
      data: {
        orders: orders,
        statistics: stats,
        // 💰 Ajouter les finances du vendeur si c'est un vendeur
        ...(vendorFinances && { vendorFinances })
      }
    };
  }

  // Endpoint de test pour vérifier l'authentification et les rôles
  @Get('test-auth')
  @UseGuards(JwtAuthGuard)
  async testAuth(@Request() req: Request & { user: any }) {
    return {
      success: true,
      message: 'Authentification testée',
      data: {
        user: req.user,
        hasUser: !!req.user,
        userRole: req.user?.role,
        userId: req.user?.sub
      }
    };
  }

  // Endpoint de test pour vérifier les rôles admin
  @Get('test-admin')
  @UseGuards(RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async testAdmin(@Request() req: Request & { user: any }) {
    return {
      success: true,
      message: 'Accès admin confirmé',
      data: {
        user: req.user,
        role: req.user?.role
      }
    };
  }

  // Obtenir une commande par son numéro (public - utilisé après redirection PayDunya)
  @Get('number/:orderNumber')
  @HttpCode(HttpStatus.OK)
  async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    return {
      success: true,
      message: 'Commande récupérée avec succès',
      data: await this.orderService.getOrderByNumber(orderNumber)
    };
  }

  // Obtenir une commande spécifique
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id', ParseIntPipe) id: number, @Request() req: Request & { user: any }) {
    // Les utilisateurs normaux ne peuvent voir que leurs propres commandes
    // Les admins peuvent voir toutes les commandes
    const userId = req.user.role === 'ADMIN' || req.user.role === 'SUPERADMIN'
      ? undefined
      : req.user.sub;

    return {
      success: true,
      message: 'Commande récupérée avec succès',
      data: await this.orderService.getOrderById(id, userId)
    };
  }

  // Mettre à jour le statut d'une commande (admin seulement)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Request() req: Request & { user: any }
  ) {
    return {
      success: true,
      message: 'Statut de la commande mis à jour avec succès',
      data: await this.orderService.updateOrderStatus(id, updateOrderStatusDto, req.user.sub)
    };
  }

  // Mettre à jour le statut de paiement d'une commande (public - appelé par le frontend après retour PayDunya)
  @Patch(':id/payment-status')
  @HttpCode(HttpStatus.OK)
  async updatePaymentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { payment_status: string; transaction_id?: string; payment_failure_reason?: string }
  ) {
    const { payment_status, transaction_id, payment_failure_reason } = body;

    if (!payment_status) {
      throw new BadRequestException('payment_status est requis');
    }

    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Commande ${id} introuvable`);
    }

    const isPaid = payment_status.toUpperCase() === 'PAID';

    await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: payment_status.toUpperCase(),
        ...(transaction_id ? { transactionId: transaction_id } : {}),
        ...(payment_failure_reason ? { lastPaymentFailureReason: payment_failure_reason } : {}),
        ...(isPaid ? { status: OrderStatus.CONFIRMED, confirmedAt: new Date() } : {}),
        lastPaymentAttemptAt: new Date(),
      },
    });

    this.logger.log(`💳 Statut paiement commande #${id} mis à jour: ${payment_status.toUpperCase()} (transactionId: ${transaction_id || 'non fourni'})`);

    return {
      success: true,
      message: `Statut de paiement mis à jour: ${payment_status.toUpperCase()}`,
    };
  }

  // Annuler une commande (utilisateur propriétaire seulement)
  @Delete(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(@Param('id', ParseIntPipe) id: number, @Request() req: Request & { user: any }) {
    return {
      success: true,
      message: 'Commande annulée avec succès',
      data: await this.orderService.cancelOrder(id, req.user.sub)
    };
  }

  // Statistiques des commandes (admin seulement)
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async getOrderStatistics() {
    return {
      success: true,
      message: 'Statistiques des commandes récupérées avec succès',
      data: await this.orderService.getStatistics()
    };
  }

  // Statistiques au format frontend (admin seulement)
  @Get('admin/frontend-statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async getFrontendOrderStatistics() {
    return {
      success: true,
      message: 'Statistiques frontend récupérées avec succès',
      data: await this.orderService.getFrontendStatistics()
    };
  }

  // Statistiques des connexions WebSocket (admin seulement)
  @Get('admin/websocket-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async getWebSocketStats() {
    return {
      success: true,
      message: 'Statistiques WebSocket récupérées',
      data: this.orderGateway.getConnectionStats()
    };
  }

  /**
   * Calculate statistics from orders array
   */
  private calculateOrdersStatistics(orders: any[]) {
    if (!orders || orders.length === 0) {
      return {
        totalOrders: 0,
        totalAmount: 0,
        statusBreakdown: {},
        paymentStatusBreakdown: {},
        averageOrderValue: 0,
        recentOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        paidOrders: 0,
        unpaidOrders: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalVendorAmount: 0,
        paymentMethods: {}
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const stats = {
      totalOrders: orders.length,
      totalAmount: 0,
      statusBreakdown: {} as Record<string, number>,
      paymentStatusBreakdown: {} as Record<string, number>,
      averageOrderValue: 0,
      recentOrders: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      paidOrders: 0,
      unpaidOrders: 0,
      totalRevenue: 0,
      totalCommission: 0,
      totalVendorAmount: 0,
      annualRevenue: 0,
      monthlyRevenue: 0,
      paymentMethods: {} as Record<string, number>
    };

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    orders.forEach(order => {
      // Pour les commandes payées, utiliser le vendorAmount stocké
      if (order.paymentStatus === 'PAID') {
        const orderVendorAmount = order.vendorAmount || 0;
        stats.totalAmount += orderVendorAmount;
      }

      // Status breakdown
      const status = order.status || 'UNKNOWN';
      stats.statusBreakdown[status] = (stats.statusBreakdown[status] || 0) + 1;

      // Payment status breakdown
      const paymentStatus = order.paymentStatus || 'UNKNOWN';
      stats.paymentStatusBreakdown[paymentStatus] = (stats.paymentStatusBreakdown[paymentStatus] || 0) + 1;

      // Payment methods
      const paymentMethod = order.paymentMethod || 'UNKNOWN';
      stats.paymentMethods[paymentMethod] = (stats.paymentMethods[paymentMethod] || 0) + 1;

      // Order status counts
      switch (status) {
        case 'PENDING':
          stats.pendingOrders++;
          break;
        case 'CONFIRMED':
          stats.confirmedOrders++;
          break;
        case 'DELIVERED':
          stats.deliveredOrders++;
          break;
        case 'CANCELLED':
          stats.cancelledOrders++;
          break;
      }

      // Payment status counts
      if (paymentStatus === 'PAID') {
        stats.paidOrders++;
      } else {
        stats.unpaidOrders++;
      }

      // Recent orders (last 7 days)
      const orderDate = new Date(order.createdAt);
      if (orderDate > oneWeekAgo) {
        stats.recentOrders++;
      }

      // Revenue and commission (for PAID orders - CONFIRMED or DELIVERED)
      // Utiliser directement les montants calculés et stockés dans la commande
      if (paymentStatus === 'PAID') {
        // Utiliser les montants déjà calculés et stockés
        const orderCommission = order.commissionAmount || 0;
        const orderVendorAmount = order.vendorAmount || 0;

        // Calculer le bénéfice total (ce qui a été vendu moins le coût de revient)
        // Le bénéfice = commission + montant vendeur = beneficeCommande
        const beneficeCommande = orderCommission + orderVendorAmount;

        stats.totalRevenue += beneficeCommande; // Chiffre d'affaires = bénéfice total (prix vente - coût revient)
        stats.totalCommission += orderCommission; // Commission déduite
        stats.totalVendorAmount += orderVendorAmount; // Montant net pour le vendeur

        // Annual and monthly revenue calculation
        const orderDate = new Date(order.createdAt);
        const orderYear = orderDate.getFullYear();
        const orderMonth = orderDate.getMonth();

        // Chiffre d'affaires annuel (bénéfice des commandes payées de l'année en cours)
        if (orderYear === currentYear) {
          stats.annualRevenue += beneficeCommande;

          // Chiffre d'affaires mensuel (bénéfice des commandes payées du mois en cours)
          if (orderMonth === currentMonth) {
            stats.monthlyRevenue += beneficeCommande;
          }
        }
      }
    });

    // Calculate average order value
    stats.averageOrderValue = stats.totalOrders > 0 ? Math.round(stats.totalAmount / stats.totalOrders) : 0;

    return stats;
  }

  /**
   * Retry payment for a failed order
   * Public endpoint - can be accessed by customers with order number
   */
  @Post(':orderNumber/retry-payment')
  @HttpCode(HttpStatus.OK)
  async retryPayment(
    @Param('orderNumber') orderNumber: string,
    @Body() body?: { paymentMethod?: string }
  ) {
    return await this.orderService.retryPayment(
      orderNumber,
      body?.paymentMethod
    );
  }

  /**
   * Get orders with insufficient funds failures (Admin only - for analytics)
   */
  @Get('admin/insufficient-funds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async getInsufficientFundsOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    if (pageNum < 1) {
      throw new BadRequestException('La page doit être supérieure à 0');
    }
    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('La limite doit être entre 1 et 100');
    }

    return {
      success: true,
      message: 'Commandes avec fonds insuffisants récupérées',
      data: await this.orderService.getInsufficientFundsOrders(pageNum, limitNum)
    };
  }

  /**
   * Get payment attempts history for an order
   * Public endpoint - can be accessed by customers with order number
   */
  @Get(':orderNumber/payment-attempts')
  @HttpCode(HttpStatus.OK)
  async getPaymentAttempts(@Param('orderNumber') orderNumber: string) {
    return await this.orderService.getPaymentAttempts(orderNumber);
  }

  /**
   * Get detailed information about a specific payment attempt
   * Admin only - for debugging and support
   */
  @Get('admin/payment-attempt/:attemptId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async getPaymentAttemptDetails(@Param('attemptId', ParseIntPipe) attemptId: number) {
    return await this.orderService.getPaymentAttemptDetails(attemptId);
  }

  /**
   * 🧪 TEST: Get all orders without authentication (temporary)
   * This endpoint is for testing the enriched product data
   */
  @Get('test-enriched-orders')
  @HttpCode(HttpStatus.OK)
  async testGetAllOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    // Validation des paramètres
    if (pageNum < 1) {
      throw new BadRequestException('La page doit être supérieure à 0');
    }
    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('La limite doit être entre 1 et 100');
    }

    return {
      success: true,
      message: 'Commandes récupérées avec succès (TEST)',
      data: await this.orderService.getAllOrders(pageNum, limitNum, status as any)
    };
  }

  /**
   * 📢 Marquer une commande comme payée et notifier le vendeur
   * Endpoint pour les appels de fond ou les paiements manuels
   */
  @Post(':id/mark-as-paid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  @HttpCode(HttpStatus.OK)
  async markOrderAsPaid(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() body: { paymentMethod?: string; notes?: string },
    @Request() req: Request & { user: any }
  ) {
    try {
      this.logger.log('📢 Marquage commande', orderId, 'comme payée par admin', req.user.sub);

      const result = await this.orderService.updateOrderStatus(
        orderId,
        {
          status: OrderStatus.CONFIRMED,
          paymentStatus: 'PAID',
          paymentMethod: body.paymentMethod || 'MANUAL',
          notes: body.notes,
          validatedBy: req.user.sub
        },
        req.user.sub
      );

      return {
        success: true,
        message: 'Commande ' + result.orderNumber + ' marquée comme payée avec succès',
        data: result
      };
    } catch (error) {
      this.logger.error('❌ Erreur marquage commande', orderId, 'comme payée:', error);
      throw new BadRequestException(
        'Erreur lors du marquage de la commande comme payée: ' + error.message
      );
    }
  }

  // Créer une demande de retrait de fonds à partir d'une commande confirmée
  @Post(':id/request-funds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(['VENDEUR'])
  @HttpCode(HttpStatus.CREATED)
  async requestFundsFromOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @Body() body: {
      amount: number;
      paymentMethod: string;
      phoneNumber?: string;
      iban?: string;
      description?: string
    },
    @Request() req: Request & { user: any }
  ) {
    try {
      this.logger.log('💰 Création demande de fonds depuis commande', orderId, 'par vendeur', req.user.sub);

      // 🔥 VALIDATION IMMÉDIATE AU DÉBUT
      this.logger.log('🔍 PARSER DEBUG - Body brut:', JSON.stringify(body));
      this.logger.log('🔍 PARSER DEBUG - Type body:', typeof body);

      if (!body) {
        throw new BadRequestException('Corps de requête manquant. Veuillez fournir les données requises.');
      }

      if (typeof body !== 'object') {
        throw new BadRequestException(`Corps de requête invalide. Type reçu: ${typeof body}, attendu: object`);
      }

      if (Object.keys(body).length === 0) {
        throw new BadRequestException('Corps de requête vide. Veuillez fournir les données requises: amount, paymentMethod, etc.');
      }

      // 🔧 VALIDATION DES DONNÉES REQUISES
      this.logger.log('🔍 Body reçu:', JSON.stringify(body), typeof body);

      if (!body || typeof body !== 'object') {
        throw new BadRequestException('Le corps de la requête est requis et doit être un objet JSON valide');
      }

      // Vérifier les champs requis
      if (!body.amount || typeof body.amount !== 'number' || body.amount <= 0) {
        throw new BadRequestException('Le champ "amount" est requis et doit être un nombre positif (minimum 1000 FCFA)');
      }

      if (body.amount < 1000) {
        throw new BadRequestException('Le montant minimum de retrait est de 1000 FCFA');
      }

      if (!body.paymentMethod || typeof body.paymentMethod !== 'string') {
        throw new BadRequestException('Le champ "paymentMethod" est requis (WAVE, ORANGE_MONEY, ou BANK_TRANSFER)');
      }

      const validPaymentMethods = ['WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER'];
      if (!validPaymentMethods.includes(body.paymentMethod.toUpperCase())) {
        throw new BadRequestException(`Méthode de paiement invalide. Options: ${validPaymentMethods.join(', ')}`);
      }

      // Validation spécifique selon la méthode de paiement
      if (body.paymentMethod.toUpperCase() !== 'BANK_TRANSFER') {
        if (!body.phoneNumber || typeof body.phoneNumber !== 'string') {
          throw new BadRequestException('Le champ "phoneNumber" est requis pour cette méthode de paiement');
        }
      }

      if (body.paymentMethod.toUpperCase() === 'BANK_TRANSFER') {
        if (!body.iban || typeof body.iban !== 'string') {
          throw new BadRequestException('Le champ "iban" est requis pour les virements bancaires');
        }
      }

      // ✅ VALIDE: Continuer seulement si toutes les validations sont passées
      this.logger.log('✅ Validation des données réussie');

      // Vérifier que la commande existe et est confirmée
      const order = await this.orderService.getOrderById(orderId, req.user.sub);

      if (!order) {
        throw new NotFoundException('Commande non trouvée');
      }

      if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException('Seules les commandes confirmées ou livrées peuvent faire l\'objet d\'une demande de retrait');
      }

      // Vérifier que la commande appartient bien au vendeur connecté
      const hasVendorItems = order.orderItems?.some((item: any) =>
        item.vendorProduct?.vendor?.id === req.user.sub
      );

      if (!hasVendorItems && order.userId !== req.user.sub) {
        throw new ForbiddenException('Vous n\'êtes pas autorisé à créer une demande de fonds pour cette commande');
      }

      // Calculer le montant disponible pour cette commande
      const availableAmount = await this.vendorFundsService.calculateVendorEarnings(req.user.sub);

      if (body.amount > availableAmount.availableAmount) {
        throw new BadRequestException(
          `Le montant demandé (${body.amount}) dépasse le montant disponible (${availableAmount.availableAmount})`
        );
      }

      // 🔧 VALIDATION FINALE AVANT APPEL DU SERVICE
      const finalCreateData = {
        amount: body.amount,
        description: body.description || `Retrait pour commande ${order.orderNumber}`,
        paymentMethod: body.paymentMethod?.toUpperCase() as any,
        phoneNumber: body.phoneNumber,
        iban: body.iban
      };

      // Vérification finale que tous les champs requis sont présents
      if (!finalCreateData.amount || !finalCreateData.paymentMethod) {
        throw new BadRequestException('Données invalides: amount et paymentMethod sont requis');
      }

      this.logger.log('🔧 Données finales pour createFundsRequest:', JSON.stringify(finalCreateData));

      // Créer la demande de fonds en liant la commande
      const fundsRequest = await this.vendorFundsService.createFundsRequest(
        req.user.sub,
        finalCreateData
      );

      // Lier la commande à la demande de fonds
      await this.prisma.vendorFundsRequestOrder.create({
        data: {
          fundsRequestId: fundsRequest.id,
          orderId: orderId
        }
      });

      this.logger.log('✅ Demande de fonds créée', fundsRequest.id, 'pour commande', orderId);

      return {
        success: true,
        message: 'Demande de retrait créée avec succès',
        data: {
          fundsRequest: {
            id: fundsRequest.id,
            amount: fundsRequest.amount,
            status: fundsRequest.status,
            createdAt: fundsRequest.createdAt,
            description: fundsRequest.description,
            paymentMethod: fundsRequest.paymentMethod,
            requestedAmount: fundsRequest.requestedAmount,
            availableAmount: availableAmount.availableAmount
          },
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            status: order.status
          }
        }
      };
    } catch (error) {
      this.logger.error('❌ Erreur création demande de fonds:', error);
      throw new BadRequestException(
        'Erreur lors de la création de la demande de retrait: ' + error.message
      );
    }
  }

  /**
   * 💰 Calculer le montant disponible pour les appels de fonds du vendeur
   *
   * Formule:
   * availableForWithdrawal = totalVendorAmount - withdrawnAmount - pendingWithdrawalAmount
   *
   * @param vendorId ID du vendeur
   * @param orders Liste des commandes du vendeur
   * @returns Informations financières détaillées
   */
  private async calculateVendorAvailableFunds(vendorId: number, orders: any[]) {
    try {
      // 💰 Calculer le montant total des vendorAmount de toutes les commandes PAYÉES (tous statuts)
      const totalEarningsAllPaidOrders = orders
        .filter(order =>
          order.paymentStatus === 'PAID' &&
          order.vendorAmount != null
        )
        .reduce((sum, order) => sum + (order.vendorAmount || 0), 0);

      // 💰 Calculer le montant total des vendorAmount de toutes les commandes LIVRÉES et PAYÉES (disponible pour retrait)
      const totalProductRevenue = orders
        .filter(order =>
          order.status === OrderStatus.DELIVERED &&
          order.paymentStatus === 'PAID' &&
          order.vendorAmount != null
        )
        .reduce((sum, order) => sum + (order.vendorAmount || 0), 0);

      // 🎨 Calculer le montant total des revenus de designs en fonction du statut de la commande
      // ✅ CORRECTION: Récupérer les designs avec la relation Order pour filtrer par statut de commande
      const designUsagesDelivered = await this.prisma.designUsage.findMany({
        where: {
          vendorId,
          paymentStatus: { in: ['CONFIRMED', 'READY_FOR_PAYOUT'] }, // Designs payés
          order: {
            status: 'DELIVERED', // Seulement les commandes livrées
            paymentStatus: 'PAID'
          }
        },
        select: {
          vendorRevenue: true
        }
      });

      const totalDesignRevenue = designUsagesDelivered.reduce(
        (sum, usage) => sum + parseFloat(usage.vendorRevenue.toString()),
        0
      );

      // 💵 Montant total disponible = revenus produits livrés + revenus designs livrés
      const totalVendorAmount = totalProductRevenue + totalDesignRevenue;

      // 🎨 Calculer le montant total des revenus de designs PAYÉS (tous statuts) pour le calcul du pending
      const designUsagesAllPaid = await this.prisma.designUsage.findMany({
        where: {
          vendorId,
          paymentStatus: { in: ['CONFIRMED', 'READY_FOR_PAYOUT'] }, // Designs payés
          order: {
            paymentStatus: 'PAID' // Toutes les commandes payées (peu importe le statut)
          }
        },
        select: {
          vendorRevenue: true
        }
      });

      const totalDesignRevenueAllPaid = designUsagesAllPaid.reduce(
        (sum, usage) => sum + parseFloat(usage.vendorRevenue.toString()),
        0
      );

      // 💰 Total des gains de toutes les commandes payées (produits + designs)
      const totalEarningsAllPaidIncludingDesigns = totalEarningsAllPaidOrders + totalDesignRevenueAllPaid;

      // 📊 Récupérer toutes les demandes de fonds du vendeur
      const fundsRequests = await this.prisma.vendorFundsRequest.findMany({
        where: { vendorId },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true
        }
      });

      // 💸 Montant déjà retiré (demandes PAYÉES)
      const withdrawnAmount = fundsRequests
        .filter(req => req.status === 'PAID')
        .reduce((sum, req) => sum + req.amount, 0);

      // ⏳ Montant en attente de retrait (demandes PENDING ou APPROVED)
      const pendingWithdrawalAmount = fundsRequests
        .filter(req => req.status === 'PENDING' || req.status === 'APPROVED')
        .reduce((sum, req) => sum + req.amount, 0);

      // ✅ Montant disponible pour retrait
      const availableForWithdrawal = Math.max(0, totalVendorAmount - withdrawnAmount - pendingWithdrawalAmount);

      // 📈 Statistiques supplémentaires
      const deliveredOrdersCount = orders.filter(o => o.status === OrderStatus.DELIVERED).length;
      const totalCommissionDeducted = orders
        .filter(order => order.status === OrderStatus.DELIVERED && order.paymentStatus === 'PAID')
        .reduce((sum, order) => sum + (order.commissionAmount || 0), 0);

      // 💰 Calculer le montant en attente de livraison (payé mais pas encore livré)
      const pendingOrdersAmount = Math.max(0, totalEarningsAllPaidIncludingDesigns - totalVendorAmount);

      this.logger.log(`💰 [VENDOR ${vendorId}] Calcul des fonds disponibles:`, {
        totalEarningsAllPaidOrders,
        totalDesignRevenueAllPaid,
        totalEarningsAllPaidIncludingDesigns,
        totalProductRevenue,
        totalDesignRevenue,
        totalVendorAmount,
        pendingOrdersAmount,
        withdrawnAmount,
        pendingWithdrawalAmount,
        availableForWithdrawal
      });

      return {
        // 💰 Total des gains de toutes les commandes PAYÉES (produits + designs, tous statuts)
        totalEarnings: totalEarningsAllPaidIncludingDesigns,
        // Montant total gagné par le vendeur sur les commandes LIVRÉES (après commission)
        totalVendorAmount,
        // 🆕 Montant des gains livrés (disponible pour calcul de retrait)
        deliveredVendorAmount: totalVendorAmount,
        // 🆕 Montant en attente de livraison (payé mais pas encore livré)
        pendingOrdersAmount,
        // 🆕 Répartition par source de revenus (LIVRÉS uniquement)
        totalProductRevenue,
        totalDesignRevenue,
        // 💸 Montant déjà retiré
        withdrawnAmount,
        // ⏰ Montant en attente de retrait
        pendingWithdrawalAmount,
        // ✅ Montant disponible pour un nouveau retrait
        availableForWithdrawal,
        // 💰 Montant disponible pour appel de fonds (même valeur que availableForWithdrawal)
        fundsRequestAvailableAmount: availableForWithdrawal,
        // 📈 Statistiques additionnelles
        deliveredOrdersCount,
        totalCommissionDeducted,
        // 📋 Nombre de demandes de fonds par statut
        fundsRequestsSummary: {
          total: fundsRequests.length,
          paid: fundsRequests.filter(r => r.status === 'PAID').length,
          pending: fundsRequests.filter(r => r.status === 'PENDING').length,
          approved: fundsRequests.filter(r => r.status === 'APPROVED').length,
          rejected: fundsRequests.filter(r => r.status === 'REJECTED').length
        },
        // 💬 Message d'information pour le frontend
        message: availableForWithdrawal > 0
          ? `Vous pouvez faire un appel de fonds de ${availableForWithdrawal.toLocaleString('fr-FR')} FCFA (${deliveredOrdersCount} commande${deliveredOrdersCount > 1 ? 's' : ''} livrée${deliveredOrdersCount > 1 ? 's' : ''})`
          : pendingOrdersAmount > 0
          ? `Vous avez ${totalEarningsAllPaidIncludingDesigns.toLocaleString('fr-FR')} FCFA de gains totaux dont ${pendingOrdersAmount.toLocaleString('fr-FR')} FCFA en attente de livraison. Aucun montant disponible pour appel de fonds actuellement.`
          : 'Aucun montant disponible pour appel de fonds actuellement. Vous devez avoir au moins une commande livrée.'
      };
    } catch (error) {
      this.logger.error(`❌ Erreur calcul fonds disponibles pour vendeur ${vendorId}:`, error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        totalEarnings: 0,
        totalVendorAmount: 0,
        deliveredVendorAmount: 0,
        pendingOrdersAmount: 0,
        totalProductRevenue: 0,
        totalDesignRevenue: 0,
        withdrawnAmount: 0,
        pendingWithdrawalAmount: 0,
        availableForWithdrawal: 0,
        fundsRequestAvailableAmount: 0,
        deliveredOrdersCount: 0,
        totalCommissionDeducted: 0,
        fundsRequestsSummary: {
          total: 0,
          paid: 0,
          pending: 0,
          approved: 0,
          rejected: 0
        },
        message: 'Erreur lors du calcul des fonds disponibles'
      };
    }
  }
}
