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

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly orderGateway: OrderGateway
  ) {}

  // Créer une nouvelle commande (utilisateurs)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return {
      success: true,
      message: 'Commande créée avec succès',
      data: await this.orderService.createOrder(req.user.sub, createOrderDto)
    };
  }

  // Obtenir toutes les commandes (admin seulement)
  @Get('admin/all')
  @UseGuards(RolesGuard)
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
  async getUserOrders(@Request() req) {
    return {
      success: true,
      message: 'Vos commandes récupérées avec succès',
      data: await this.orderService.getUserOrders(req.user.sub)
    };
  }

  // Obtenir une commande spécifique
  @Get(':id')
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
  @UseGuards(RolesGuard)
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
  async cancelOrder(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return {
      success: true,
      message: 'Commande annulée avec succès',
      data: await this.orderService.cancelOrder(id, req.user.sub)
    };
  }

  // Statistiques des commandes (admin seulement)
  @Get('admin/statistics')
  @UseGuards(RolesGuard)
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
  @UseGuards(RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async getFrontendOrderStatistics() {
    return {
      success: true,
      message: 'Statistiques frontend récupérées avec succès',
      data: await this.orderService.getFrontendStatistics()
    };
  }

  // Endpoint de test pour vérifier l'authentification et les rôles
  @Get('test-auth')
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

  // Statistiques des connexions WebSocket (admin seulement)
  @Get('admin/websocket-stats')
  @UseGuards(RolesGuard)
  @Roles(['ADMIN', 'SUPERADMIN'])
  async getWebSocketStats() {
    return {
      success: true,
      message: 'Statistiques WebSocket récupérées',
      data: this.orderGateway.getConnectionStats()
    };
  }
} 