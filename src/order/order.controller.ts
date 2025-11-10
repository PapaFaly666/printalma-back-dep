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
  BadRequestException
} from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderGateway } from './order.gateway';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';
import { PrismaService } from '../prisma.service';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderGateway: OrderGateway,
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
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
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
  async getUserOrders(@Request() req) {
    // Si l'utilisateur est un VENDEUR, récupérer les commandes de ses produits
    if (req.user.role === 'VENDEUR') {
      return {
        success: true,
        message: 'Vos commandes récupérées avec succès',
        data: await this.orderService.getVendorOrders(req.user.sub)
      };
    }

    // Sinon, commandes normales (client)
    return {
      success: true,
      message: 'Vos commandes récupérées avec succès',
      data: await this.orderService.getUserOrders(req.user.sub)
    };
  }

  // Endpoint de test pour vérifier l'authentification et les rôles
  @Get('test-auth')
  @UseGuards(JwtAuthGuard)
  async testAuth(@Request() req) {
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
  async testAdmin(@Request() req) {
    return {
      success: true,
      message: 'Accès admin confirmé',
      data: {
        user: req.user,
        role: req.user?.role
      }
    };
  }

  // Obtenir une commande spécifique
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id', ParseIntPipe) id: number, @Request() req) {
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
    @Request() req
  ) {
    return {
      success: true,
      message: 'Statut de la commande mis à jour avec succès',
      data: await this.orderService.updateOrderStatus(id, updateOrderStatusDto, req.user.sub)
    };
  }

  // Annuler une commande (utilisateur propriétaire seulement)
  @Delete(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(@Param('id', ParseIntPipe) id: number, @Request() req) {
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

  } 