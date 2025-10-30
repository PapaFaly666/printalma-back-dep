import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto, PaymentMethod } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { SalesStatsUpdaterService } from '../vendor-product/services/sales-stats-updater.service';
import { PaytechService } from '../paytech/paytech.service';
import { ConfigService } from '@nestjs/config';
import { PayTechCurrency, PayTechEnvironment } from '../paytech/dto/payment-request.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private salesStatsUpdaterService: SalesStatsUpdaterService,
    private paytechService: PaytechService,
    private configService: ConfigService
  ) {}

  async createGuestOrder(createOrderDto: CreateOrderDto) {
    return this.createOrder(3, createOrderDto); // Utiliser userId: 3 pour les commandes invitées
  }

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    try {
      console.log('📦 Données reçues pour orderItems:', createOrderDto.orderItems?.map(item => ({
        productId: item.productId,
        colorId: (item as any).colorId,
        color: item.color,
        size: item.size,
        quantity: item.quantity
      })));

      const order = await this.prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId: userId,
          totalAmount: (createOrderDto as any).totalAmount || 200,
          phoneNumber: createOrderDto.phoneNumber || '771234567',
          notes: createOrderDto.notes,
          status: OrderStatus.PENDING,
          shippingName: (createOrderDto as any).shippingName || (createOrderDto as any).shippingDetails?.shippingName || 'Client Invité',
          shippingStreet: (createOrderDto as any).shippingStreet || (createOrderDto as any).shippingDetails?.shippingStreet || '123 Rue Test',
          shippingCity: (createOrderDto as any).shippingCity || (createOrderDto as any).shippingDetails?.shippingCity || 'Dakar',
          shippingRegion: (createOrderDto as any).shippingRegion || (createOrderDto as any).shippingDetails?.shippingRegion || 'Dakar',
          shippingPostalCode: (createOrderDto as any).shippingPostalCode || (createOrderDto as any).shippingDetails?.shippingPostalCode || '12345',
          shippingCountry: (createOrderDto as any).shippingCountry || (createOrderDto as any).shippingDetails?.shippingCountry || 'Sénégal',
          shippingAddressFull: (createOrderDto as any).shippingAddressFull || `${(createOrderDto as any).shippingDetails?.shippingStreet || '123 Rue Test'}, ${(createOrderDto as any).shippingDetails?.shippingCity || 'Dakar'}, ${(createOrderDto as any).shippingDetails?.shippingCountry || 'Sénégal'}`,
          orderItems: {
            create: ((createOrderDto as any).orderItems || []).map((item: any) => {
              console.log(`📦 Création orderItem:`, {
                productId: item.productId,
                colorId: item.colorId,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.unitPrice || 0
              });
              
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice || 200,
                size: item.size,
                color: item.color,
                colorId: item.colorId
              };
            })
          }
        },
        include: {
          orderItems: {
            include: {
              product: true,
              colorVariation: true,
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

      // 💳 PayTech Payment Integration
      let paymentData = null;
      if (createOrderDto.paymentMethod === PaymentMethod.PAYTECH && createOrderDto.initiatePayment) {
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

          this.logger.log(`💳 Payment initialized successfully: ${paymentResponse.token}`);
        } catch (error) {
          this.logger.error(`❌ Failed to initialize PayTech payment: ${error.message}`, error.stack);
          // Don't fail order creation if payment initialization fails
          // The user can try to pay later
        }
      }

      const formattedOrder = this.formatOrderResponse(order);

      return paymentData
        ? { ...formattedOrder, payment: paymentData }
        : formattedOrder;
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