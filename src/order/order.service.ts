import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto, PaymentMethod } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { SalesStatsUpdaterService } from '../vendor-product/services/sales-stats-updater.service';
import { PaytechService } from '../paytech/paytech.service';
import { PaydunyaService } from '../paydunya/paydunya.service';
import { ConfigService } from '@nestjs/config';
import { PayTechCurrency, PayTechEnvironment } from '../paytech/dto/payment-request.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private salesStatsUpdaterService: SalesStatsUpdaterService,
    private paytechService: PaytechService,
    private paydunyaService: PaydunyaService,
    private configService: ConfigService
  ) {}

  async createGuestOrder(createOrderDto: CreateOrderDto) {
    return this.createOrder(3, createOrderDto); // Utiliser userId: 3 pour les commandes invitées
  }

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    try {
      console.log('📦 [ORDER] Données reçues:', JSON.stringify(createOrderDto, null, 2));

      // 🆕 Construction du nom complet du client
      const fullName = [
        createOrderDto.shippingDetails.firstName || '',
        createOrderDto.shippingDetails.lastName || ''
      ].filter(Boolean).join(' ').trim() || 'Client';

      // 🆕 Construction de l'adresse complète
      const fullAddress = [
        createOrderDto.shippingDetails.street,
        createOrderDto.shippingDetails.city,
        createOrderDto.shippingDetails.postalCode,
        createOrderDto.shippingDetails.country
      ].filter(Boolean).join(', ');

      // 🆕 Calcul du montant total si non fourni
      const totalAmount = createOrderDto.totalAmount ||
        createOrderDto.orderItems.reduce((sum, item) =>
          sum + ((item.unitPrice || 0) * item.quantity), 0
        );

      console.log('📊 [ORDER] Informations calculées:', {
        fullName,
        fullAddress,
        totalAmount,
        email: createOrderDto.email
      });

      const order = await this.prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId: userId,
          totalAmount: totalAmount,
          phoneNumber: createOrderDto.phoneNumber,
          email: createOrderDto.email || null, // 🆕 Email du client
          notes: createOrderDto.notes,
          status: OrderStatus.PENDING,
          paymentMethod: createOrderDto.paymentMethod || 'CASH_ON_DELIVERY',
          paymentStatus: 'PENDING',

          // 🆕 Informations de livraison complètes
          shippingName: fullName,
          shippingStreet: createOrderDto.shippingDetails.street,
          shippingCity: createOrderDto.shippingDetails.city,
          shippingRegion: createOrderDto.shippingDetails.region || createOrderDto.shippingDetails.city,
          shippingPostalCode: createOrderDto.shippingDetails.postalCode || null,
          shippingCountry: createOrderDto.shippingDetails.country,
          shippingAddressFull: fullAddress,

          orderItems: {
            create: createOrderDto.orderItems.map((item) => {
              console.log(`📦 [ORDER] Création orderItem:`, {
                productId: item.productId,
                vendorProductId: item.vendorProductId, // 🆕
                colorId: item.colorId,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.unitPrice
              });

              return {
                productId: item.productId,
                vendorProductId: item.vendorProductId || null, // 🆕 ID du produit vendeur
                quantity: item.quantity,
                unitPrice: item.unitPrice || 0,
                size: item.size || null,
                color: item.color || null,
                colorId: item.colorId || null
              };
            })
          }
        },
        include: {
          orderItems: {
            include: {
              product: true,
              colorVariation: true,
              vendorProduct: { // 🆕 Inclure le produit vendeur
                include: {
                  vendor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      shop_name: true,
                      email: true,
                      phone: true
                    }
                  }
                }
              }
            }
          },
          user: userId ? true : false // Inclure user seulement si userId existe
        }
      });

      // 🆕 MISE À JOUR AUTOMATIQUE DES STATISTIQUES - Création de commande
      try {
        await this.salesStatsUpdaterService.updateStatsOnOrderCreation(order.id);
        this.logger.log(`📊 Statistiques de création mises à jour pour commande ${order.id}`);
      } catch (error) {
        this.logger.error(`❌ Erreur mise à jour statistiques création commande ${order.id}:`, error);
        // Ne pas faire échouer la création de commande pour cette erreur
      }

      // 🆕 NOTIFICATION DES VENDEURS CONCERNÉS
      try {
        await this.notifyVendorsOfNewOrder(order.id);
        this.logger.log(`🔔 Notifications vendeurs envoyées pour commande ${order.id}`);
      } catch (error) {
        this.logger.error(`❌ Erreur notification vendeurs pour commande ${order.id}:`, error);
        // Ne pas faire échouer la création de commande pour cette erreur
      }

      // 💳 Payment Integration (PayDunya or PayTech)
      let paymentData = null;

      // 💰 PayDunya Payment Integration
      if (createOrderDto.paymentMethod === PaymentMethod.PAYDUNYA && createOrderDto.initiatePayment) {
        try {
          this.logger.log(`💳 Initializing PayDunya payment for order: ${order.orderNumber}`);

          const paymentResponse = await this.paydunyaService.createInvoice({
            invoice: {
              total_amount: order.totalAmount,
              description: `Commande Printalma - ${order.orderNumber}`,
              customer: {
                name: fullName,
                email: createOrderDto.email || undefined,
                phone: createOrderDto.phoneNumber
              }
            },
            store: {
              name: 'Printalma',
              tagline: 'Impression personnalisée de qualité',
              postal_address: 'Dakar, Sénégal',
              phone: this.configService.get('STORE_PHONE') || '+221338234567',
              website_url: this.configService.get('STORE_URL') || 'https://printalma.com'
            },
            custom_data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              userId: userId
            },
            actions: {
              return_url: this.configService.get('PAYDUNYA_SUCCESS_URL'),
              cancel_url: this.configService.get('PAYDUNYA_CANCEL_URL'),
              callback_url: this.configService.get('PAYDUNYA_IPN_URL')
            }
          });

          // Générer l'URL de redirection en utilisant la même logique que PaydunyaController
          let paymentUrl: string;

          if (paymentResponse.response_text && paymentResponse.response_text.startsWith('http')) {
            // PayDunya a retourné l'URL complète dans response_text
            paymentUrl = paymentResponse.response_text;
            this.logger.log(`Using PayDunya provided URL: ${paymentUrl}`);
          } else {
            // Construire l'URL selon la documentation Paydunya
            const paydunyaMode = this.configService.get('PAYDUNYA_MODE', 'test');
            const baseUrl = paydunyaMode === 'test'
              ? 'https://app.paydunya.com/sandbox-checkout/invoice'
              : 'https://app.paydunya.com/checkout/invoice';
            paymentUrl = `${baseUrl}/${paymentResponse.token}`;
            this.logger.log(`Constructed payment URL: ${paymentUrl}`);
          }

          this.logger.log(`Final payment URL: ${paymentUrl}`);

          paymentData = {
            token: paymentResponse.token,
            redirect_url: paymentUrl,
            payment_url: paymentUrl,
            mode: this.configService.get('PAYDUNYA_MODE', 'test')
          };

          this.logger.log(`💳 PayDunya payment initialized successfully: ${paymentResponse.token}`);
        } catch (error) {
          this.logger.error(`❌ Failed to initialize PayDunya payment: ${error.message}`, error.stack);
          // Don't fail order creation if payment initialization fails
          // The user can try to pay later
        }
      }

      // 💳 PayTech Payment Integration
      else if (createOrderDto.paymentMethod === PaymentMethod.PAYTECH && createOrderDto.initiatePayment) {
        try {
          this.logger.log(`💳 Initializing PayTech payment for order: ${order.orderNumber}`);

          const paymentResponse = await this.paytechService.requestPayment({
            item_name: `Order ${order.orderNumber}`,
            item_price: order.totalAmount,
            ref_command: order.orderNumber,
            command_name: `Printalma Order - ${order.orderNumber}`,
            currency: PayTechCurrency.XOF,
            env: (this.configService.get('PAYTECH_ENVIRONMENT') === 'test'
              ? PayTechEnvironment.TEST
              : PayTechEnvironment.PROD),
            ipn_url: this.configService.get('PAYTECH_IPN_URL'),
            success_url: this.configService.get('PAYTECH_SUCCESS_URL'),
            cancel_url: this.configService.get('PAYTECH_CANCEL_URL'),
            custom_field: JSON.stringify({ orderId: order.id, userId })
          });

          paymentData = {
            token: paymentResponse.token,
            redirect_url: paymentResponse.redirect_url || paymentResponse.redirectUrl
          };

          this.logger.log(`💳 PayTech payment initialized successfully: ${paymentResponse.token}`);
        } catch (error) {
          this.logger.error(`❌ Failed to initialize PayTech payment: ${error.message}`, error.stack);
          // Don't fail order creation if payment initialization fails
          // The user can try to pay later
        }
      }

      const formattedOrder = this.formatOrderResponse(order);

      // Debug: vérifier les données de paiement
      this.logger.log(`🔍 PaymentData check:`, {
        hasPaymentData: !!paymentData,
        paymentDataToken: paymentData?.token,
        paymentDataUrl: paymentData?.redirect_url
      });

      const finalResponse = paymentData
        ? { ...formattedOrder, payment: paymentData }
        : formattedOrder;

      this.logger.log(`🔍 Final response payment field:`, finalResponse.payment);

      return finalResponse;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw new BadRequestException(`Erreur lors de la création de la commande: ${error.message}`);
    }
  }

  /**
   * Update order payment status after PayTech IPN callback
   * This should be called by the PayTech IPN handler
   *
   * 🆕 Enhanced with automatic insufficient funds tracking
   */
  async updateOrderPaymentStatus(
    orderNumber: string,
    paymentStatus: 'PAID' | 'FAILED',
    transactionId?: string,
    failureDetails?: {
      reason: string;
      code?: string;
      message?: string;
      processorResponse?: string;
      category: string;
    },
    attemptNumber?: number
  ) {
    try {
      this.logger.log(`💳 Updating payment status for order ${orderNumber}: ${paymentStatus}`);

      const order = await this.prisma.order.findFirst({
        where: { orderNumber }
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderNumber} not found`);
      }

      // Prepare update data
      const updateData: any = {
        paymentStatus,
        transactionId,
        // If payment is successful, update order status to CONFIRMED
        ...(paymentStatus === 'PAID' && { status: OrderStatus.CONFIRMED }),
        // 🆕 Update payment attempts counter
        ...(attemptNumber && { paymentAttempts: attemptNumber }),
        // 🆕 Update last payment attempt timestamp
        lastPaymentAttemptAt: new Date(),
      };

      // Store failure details if payment failed
      if (paymentStatus === 'FAILED' && failureDetails) {
        // Store as JSON string in notes field or add custom fields
        const failureInfo = {
          reason: failureDetails.reason,
          category: failureDetails.category,
          code: failureDetails.code,
          message: failureDetails.message,
          processorResponse: failureDetails.processorResponse,
          timestamp: new Date().toISOString(),
          attemptNumber: attemptNumber || 1
        };

        // 🆕 Update insufficient funds flag
        if (failureDetails.category === 'insufficient_funds') {
          updateData.hasInsufficientFunds = true;
          updateData.lastPaymentFailureReason = failureDetails.reason;
          this.logger.log(`💰 Insufficient funds detected for order ${orderNumber}`);
        } else {
          updateData.lastPaymentFailureReason = failureDetails.reason;
        }

        // Add failure info to notes field (or you could add new fields to the schema)
        updateData.notes = order.notes
          ? `${order.notes}\n\n💳 PAYMENT FAILED (Attempt #${attemptNumber || 1}): ${JSON.stringify(failureInfo, null, 2)}`
          : `💳 PAYMENT FAILED (Attempt #${attemptNumber || 1}): ${JSON.stringify(failureInfo, null, 2)}`;

        this.logger.log(
          `💳 Payment failure details stored for order ${orderNumber}: ${failureDetails.reason} (${failureDetails.category})`
        );
      }

      // 🆕 Reset insufficient funds flag if payment succeeds
      if (paymentStatus === 'PAID' && order.hasInsufficientFunds) {
        updateData.hasInsufficientFunds = false;
        updateData.lastPaymentFailureReason = null;
        this.logger.log(`✅ Payment succeeded - insufficient funds flag reset for order ${orderNumber}`);
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: updateData,
        include: {
          orderItems: {
            include: {
              product: true,
              colorVariation: true,
            }
          },
          user: true
        }
      });

      this.logger.log(`✅ Payment status updated for order ${orderNumber}`);
      return this.formatOrderResponse(updatedOrder);
    } catch (error) {
      this.logger.error(`❌ Failed to update payment status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllOrders(page: number = 1, limit: number = 10, status?: OrderStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: true,
              colorVariation: true,
            },
          },
          user: true,
          validator: true,
          // 🆕 Inclure l'historique des tentatives de paiement
          paymentAttemptsHistory: {
            orderBy: {
              attemptedAt: 'desc',
            },
            take: 3, // Dernières 3 tentatives
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where })
    ]);

    const formattedOrders = orders.map(order => this.formatOrderResponse(order));

    return {
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true,
            colorVariation: true,
          },
        },
        // 🆕 Inclure l'historique des tentatives de paiement
        paymentAttemptsHistory: {
          orderBy: {
            attemptedAt: 'desc',
          },
          take: 3, // Dernières 3 tentatives
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map(order => this.formatOrderResponse(order));
  }

  /**
   * Récupère toutes les commandes contenant des produits du vendeur
   */
  async getVendorOrders(vendorId: number) {
    // Récupérer les informations du vendeur
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        shop_name: true,
        role: true
      }
    });

    // Récupérer tous les produits de base liés à ce vendeur via VendorProduct
    const vendorProducts = await this.prisma.vendorProduct.findMany({
      where: { vendorId },
      select: { baseProductId: true }
    });

    const baseProductIds = vendorProducts.map(vp => vp.baseProductId);

    if (baseProductIds.length === 0) {
      this.logger.log(`Vendeur ${vendorId} n'a aucun produit`);
      return [];
    }

    // Récupérer toutes les commandes contenant ces produits
    const orders = await this.prisma.order.findMany({
      where: {
        orderItems: {
          some: {
            productId: { in: baseProductIds }
          }
        }
      },
      include: {
        orderItems: {
          include: {
            product: true,
            colorVariation: true,
          },
        },
        user: true,
        validator: true,
        // 🆕 Inclure l'historique des tentatives de paiement
        paymentAttemptsHistory: {
          orderBy: {
            attemptedAt: 'desc',
          },
          take: 3,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.logger.log(`Vendeur ${vendorId}: ${orders.length} commande(s) trouvée(s)`);

    // Ajouter les informations du vendeur à chaque commande
    return orders.map(order => ({
      ...this.formatOrderResponse(order),
      vendor: {
        id: vendor.id,
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        email: vendor.email,
        shopName: vendor.shop_name,
        role: vendor.role
      }
    }));
  }

  async getOrderById(id: number, userId?: number) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findUnique({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
            colorVariation: true,
          },
        },
        user: true,
        validator: true,
        // 🆕 Inclure TOUTES les tentatives de paiement pour la vue détaillée
        paymentAttemptsHistory: {
          orderBy: {
            attemptedAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.formatOrderResponse(order);
  }

  private formatOrderResponse(order: any) {
    const baseOrder = {
      ...order,
      orderItems: order.orderItems.map((item: any) => {
        console.log('🎨 Données de couleur récupérées:', {
          itemColorId: item.colorId,
          itemColor: item.color,
          colorFromJoin: item.colorVariation
        });

        return {
          ...item,
          colorId: item.colorId,
          color: item.color,

          product: {
            ...item.product,
            orderedColorName: item.colorVariation?.name || null,
            orderedColorHexCode: item.colorVariation?.colorCode || null,
            orderedColorImageUrl: item.colorVariation?.images?.[0]?.url || null,
          }
        };
      })
    };

    // 🆕 Ajouter les informations de paiement enrichies
    const paymentInfo: any = {
      status: order.paymentStatus,
      method: order.paymentMethod,
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
      // Garder payment_info pour compatibilité
      payment_info: paymentInfo,
    };
  }

  async updateOrderStatus(id: number, updateData: any, validatedBy?: number) {
    try {
      const previousOrder = await this.prisma.order.findUnique({
        where: { id },
        select: { status: true }
      });

      const order = await this.prisma.order.update({
        where: { id },
        data: {
          status: updateData.status,
          notes: updateData.notes,
          validatedBy: validatedBy || null,
          validatedAt: updateData.status === OrderStatus.CONFIRMED ? new Date() : null,
        },
        include: {
          orderItems: {
            include: {
              product: true,
              colorVariation: true,
            },
          },
          user: true,
          validator: true,
        },
      });

      // 🆕 MISE À JOUR AUTOMATIQUE DES STATISTIQUES - Commande livrée
      if (updateData.status === OrderStatus.DELIVERED && previousOrder?.status !== OrderStatus.DELIVERED) {
        this.logger.log(`🚚 Commande ${id} marquée comme livrée, mise à jour des statistiques de vente`);
        
        try {
          await this.salesStatsUpdaterService.updateSalesStatsOnDelivery(id);
          this.logger.log(`📊 Statistiques de vente mises à jour pour commande livrée ${id}`);
        } catch (error) {
          this.logger.error(`❌ Erreur mise à jour statistiques livraison commande ${id}:`, error);
          // Ne pas faire échouer la mise à jour du statut pour cette erreur
        }
      }
      
      return this.formatOrderResponse(order);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw new BadRequestException(`Error updating order status: ${error.message}`);
    }
  }

  async cancelOrder(id: number, userId?: number) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    try {
      const order = await this.prisma.order.update({
        where,
        data: {
          status: OrderStatus.CANCELLED,
      },
      include: {
        orderItems: {
          include: {
              product: true,
            },
          },
          user: true,
        },
      });
      return order;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw new BadRequestException(`Error cancelling order: ${error.message}`);
    }
  }

  async getStatistics() {
    const [totalOrders, pendingOrders, confirmedOrders, shippedOrders, cancelledOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    const totalRevenue = await this.prisma.order.aggregate({
      where: { status: { in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] } },
      _sum: { totalAmount: true },
    });

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }

  async getFrontendStatistics() {
    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        orderItems: true,
      },
    });

    const stats = await this.getStatistics();
    
    return {
      ...stats,
      recentOrders,
    };
  }

  async create(createOrderDto: CreateOrderDto) {
    return this.createOrder(1, createOrderDto);
  }

  async findAll() {
    const result = await this.getAllOrders();
    return result.orders;
  }

  async findOne(id: number) {
    return this.getOrderById(id);
  }

  async update(id: number, updateOrderDto: any) {
    return this.updateOrderStatus(id, updateOrderDto);
  }

  async remove(id: number) {
    try {
      await this.prisma.order.delete({
        where: { id },
      });
      return { message: `Order with ID ${id} has been deleted` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw new BadRequestException(`Error deleting order: ${error.message}`);
    }
  }

  async findByUser(userId: number) {
    return this.getUserOrders(userId);
        }

  async updateStatus(id: number, status: OrderStatus, validatedBy?: number) {
    return this.updateOrderStatus(id, { status }, validatedBy);
  }

  /**
   * Retry payment for a failed order
   * This method allows customers to retry payment after a failed attempt
   * Particularly useful for insufficient funds scenarios
   *
   * @param orderNumber Order number to retry payment for
   * @param paymentMethod Optional new payment method
   * @returns Payment data with new token and redirect URL
   */
  async retryPayment(orderNumber: string, paymentMethod?: string) {
    try {
      this.logger.log(`💳 Retry payment requested for order: ${orderNumber}`);

      // Find the order
      const order = await this.prisma.order.findFirst({
        where: { orderNumber },
        include: { user: true }
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderNumber} not found`);
      }

      // Verify order is in a state that allows payment retry
      if (order.paymentStatus === 'PAID') {
        throw new BadRequestException('Order has already been paid');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot retry payment for cancelled order');
      }

      // Initialize new payment with PayTech
      this.logger.log(`💳 Initializing retry payment for order: ${orderNumber}`);

      const paymentResponse = await this.paytechService.requestPayment({
        item_name: `Order ${order.orderNumber} (Retry)`,
        item_price: order.totalAmount,
        ref_command: order.orderNumber,
        command_name: `Printalma Order - ${order.orderNumber} (Retry Payment)`,
        currency: PayTechCurrency.XOF,
        env: (this.configService.get('PAYTECH_ENVIRONMENT') === 'test'
          ? PayTechEnvironment.TEST
          : PayTechEnvironment.PROD),
        ipn_url: this.configService.get('PAYTECH_IPN_URL'),
        success_url: this.configService.get('PAYTECH_SUCCESS_URL'),
        cancel_url: this.configService.get('PAYTECH_CANCEL_URL'),
        custom_field: JSON.stringify({
          orderId: order.id,
          userId: order.userId,
          retryAttempt: true,
          previousFailure: order.notes?.includes('INSUFFICIENT FUNDS') ? 'insufficient_funds' : 'unknown'
        }),
        ...(paymentMethod && { target_payment: paymentMethod })
      });

      // Update order notes with retry attempt
      const retryNote = `\n\n🔄 Payment retry initiated at ${new Date().toISOString()}\nNew token: ${paymentResponse.token}`;
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          notes: order.notes ? order.notes + retryNote : retryNote
        }
      });

      this.logger.log(`✅ Retry payment initialized successfully: ${paymentResponse.token}`);

      return {
        success: true,
        message: 'Payment retry initialized successfully',
        data: {
          order_id: order.id,
          order_number: order.orderNumber,
          amount: order.totalAmount,
          currency: 'XOF',
          payment: {
            token: paymentResponse.token,
            redirect_url: paymentResponse.redirect_url || paymentResponse.redirectUrl,
            is_retry: true
          }
        }
      };
    } catch (error) {
      this.logger.error(`❌ Failed to retry payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get orders with insufficient funds failures for analytics
   * 🆕 Enhanced with hasInsufficientFunds flag
   */
  async getInsufficientFundsOrders(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          // 🆕 Use the new flag for faster queries
          hasInsufficientFunds: true
        },
        include: {
          orderItems: {
            include: {
              product: true,
              colorVariation: true,
            }
          },
          user: true,
          paymentAttemptsHistory: {
            orderBy: {
              attemptedAt: 'desc'
            },
            take: 5 // Show last 5 attempts
          }
        },
        orderBy: {
          lastPaymentAttemptAt: 'desc' // Most recent attempts first
        },
        skip,
        take: limit
      }),
      this.prisma.order.count({
        where: {
          hasInsufficientFunds: true
        }
      })
    ]);

    return {
      orders: orders.map(order => ({
        ...this.formatOrderResponse(order),
        payment_attempts_count: order.paymentAttempts,
        last_payment_attempt: order.lastPaymentAttemptAt,
        last_failure_reason: order.lastPaymentFailureReason,
        recent_attempts: order.paymentAttemptsHistory
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 🆕 Get payment attempts history for an order
   * Shows all payment attempts with detailed information
   */
  async getPaymentAttempts(orderNumber: string) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { orderNumber },
        include: {
          paymentAttemptsHistory: {
            orderBy: {
              attemptedAt: 'desc'
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderNumber} not found`);
      }

      return {
        success: true,
        message: 'Payment attempts retrieved successfully',
        data: {
          order_id: order.id,
          order_number: order.orderNumber,
          total_amount: order.totalAmount,
          payment_status: order.paymentStatus,
          total_attempts: order.paymentAttempts,
          has_insufficient_funds: order.hasInsufficientFunds,
          last_payment_attempt: order.lastPaymentAttemptAt,
          last_failure_reason: order.lastPaymentFailureReason,
          customer: order.user,
          attempts: order.paymentAttemptsHistory.map(attempt => ({
            id: attempt.id,
            attempt_number: attempt.attemptNumber,
            status: attempt.status,
            amount: attempt.amount,
            currency: attempt.currency,
            payment_method: attempt.paymentMethod,
            is_retry: attempt.isRetry,
            failure: attempt.failureCategory ? {
              category: attempt.failureCategory,
              reason: attempt.failureReason,
              code: attempt.failureCode,
              message: attempt.failureMessage,
              processor_response: attempt.processorResponse
            } : null,
            attempted_at: attempt.attemptedAt,
            completed_at: attempt.completedAt,
            failed_at: attempt.failedAt,
            paytech_token: attempt.paytechToken,
            paytech_transaction_id: attempt.paytechTransactionId
          }))
        }
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get payment attempts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 🆕 Notifier les vendeurs concernés par une nouvelle commande
   * Envoie une notification en base de données pour chaque vendeur
   */
  private async notifyVendorsOfNewOrder(orderId: number) {
    try {
      // Récupérer la commande avec tous les items et produits vendeurs
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true }
              },
              vendorProduct: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      shop_name: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!order) {
        this.logger.warn(`⚠️ Commande ${orderId} non trouvée pour notification`);
        return;
      }

      // Identifier tous les vendeurs uniques concernés par cette commande
      const vendorIds = new Set<number>();
      const vendorNames = new Map<number, string>();

      for (const item of order.orderItems) {
        if (item.vendorProduct && item.vendorProduct.vendor) {
          const vendor = item.vendorProduct.vendor;
          vendorIds.add(vendor.id);
          vendorNames.set(vendor.id, vendor.shop_name || `${vendor.firstName} ${vendor.lastName}`);
        }
      }

      if (vendorIds.size === 0) {
        this.logger.log(`ℹ️ Aucun vendeur trouvé pour la commande ${order.orderNumber}`);
        return;
      }

      this.logger.log(`🔔 Notification de ${vendorIds.size} vendeur(s) pour commande ${order.orderNumber}`);

      // Créer une notification pour chaque vendeur
      const notificationPromises = Array.from(vendorIds).map(async (vendorId) => {
        try {
          await this.prisma.notification.create({
            data: {
              userId: vendorId,
              type: 'ORDER_NEW', // ✅ Utiliser ORDER_NEW au lieu de NEW_ORDER
              title: '🛍️ Nouvelle commande reçue !',
              message: `Une nouvelle commande (${order.orderNumber}) contenant vos produits a été passée par ${order.shippingName}.`,
              metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                customerName: order.shippingName,
                customerPhone: order.phoneNumber,
                customerEmail: order.email,
                itemsCount: order.orderItems.length,
                createdAt: order.createdAt.toISOString()
              },
              isRead: false
            }
          });

          this.logger.log(`✅ Notification envoyée au vendeur ${vendorNames.get(vendorId)} (ID: ${vendorId})`);
        } catch (error) {
          this.logger.error(`❌ Erreur notification vendeur ${vendorId}:`, error);
        }
      });

      await Promise.all(notificationPromises);

      this.logger.log(`🎉 Notifications envoyées à tous les vendeurs pour commande ${order.orderNumber}`);

    } catch (error) {
      this.logger.error(`❌ Erreur lors de la notification des vendeurs:`, error);
      throw error;
    }
  }

  /**
   * 🆕 Get detailed information about a specific payment attempt
   * Admin only - includes complete IPN data for debugging
   */
  async getPaymentAttemptDetails(attemptId: number) {
    try {
      const attempt = await this.prisma.paymentAttempt.findUnique({
        where: { id: attemptId },
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!attempt) {
        throw new NotFoundException(`Payment attempt ${attemptId} not found`);
      }

      return {
        success: true,
        message: 'Payment attempt details retrieved',
        data: {
          ...attempt,
          order: {
            id: attempt.order.id,
            order_number: attempt.order.orderNumber,
            total_amount: attempt.order.totalAmount,
            status: attempt.order.status,
            payment_status: attempt.order.paymentStatus,
            customer: attempt.order.user
          }
        }
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get payment attempt details: ${error.message}`, error.stack);
      throw error;
    }
  }
} 