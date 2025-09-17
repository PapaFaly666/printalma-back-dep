import {
  Controller,
  Get,
  Post,
  Patch,
  Query,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { VendorOrdersService } from './vendor-orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import {
  VendorOrderFiltersDto,
  UpdateOrderStatusDto,
  VendorOrderResponseDto,
  VendorOrdersListResponseDto,
  VendorStatisticsResponseDto,
  NotificationResponseDto,
} from './dto/vendor-orders.dto';

@Controller('vendor/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENDEUR)
export class VendorOrdersController {
  constructor(private readonly vendorOrdersService: VendorOrdersService) {}

  /**
   * 1. Récupérer les commandes du vendeur avec filtres et pagination
   * GET /vendor/orders
   */
  @Get()
  async getVendorOrders(
    @Query() filters: VendorOrderFiltersDto,
    @Req() req: any,
  ): Promise<VendorOrdersListResponseDto> {
    try {
      const vendorId = req.user.id;
      const result = await this.vendorOrdersService.getVendorOrders(
        vendorId,
        filters,
      );

      return {
        success: true,
        message: 'Commandes récupérées avec succès',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des commandes',
        data: null,
      };
    }
  }

  /**
   * 2. Détails d'une commande spécifique
   * GET /vendor/orders/:orderId
   */
  @Get(':orderId(\\d+)')
  async getOrderDetails(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Req() req: any,
  ): Promise<VendorOrderResponseDto> {
    try {
      const vendorId = req.user.id;
      const order = await this.vendorOrdersService.getOrderDetails(
        vendorId,
        orderId,
      );

      return {
        success: true,
        message: 'Détails de commande récupérés avec succès',
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération de la commande',
        data: null,
      };
    }
  }

  /**
   * 3. Mettre à jour le statut d'une commande
   * PATCH /vendor/orders/:orderId/status
   */
  @Patch(':orderId/status')
  async updateOrderStatus(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() updateData: UpdateOrderStatusDto,
    @Req() req: any,
  ): Promise<VendorOrderResponseDto> {
    try {
      const vendorId = req.user.id;
      const updatedOrder = await this.vendorOrdersService.updateOrderStatus(
        vendorId,
        orderId,
        updateData,
      );

      return {
        success: true,
        message: 'Statut de commande mis à jour',
        data: updatedOrder,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour du statut',
        data: null,
      };
    }
  }

  /**
   * 4. Statistiques vendeur
   * GET /vendor/orders/statistics
   */
  @Get('statistics')
  async getVendorStatistics(
    @Req() req: any,
  ): Promise<VendorStatisticsResponseDto> {
    try {
      const vendorId = req.user.id;
      const statistics = await this.vendorOrdersService.getVendorStatistics(
        vendorId,
      );

      return {
        success: true,
        message: 'Statistiques récupérées',
        data: statistics,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des statistiques',
        data: null,
      };
    }
  }

  /**
   * 5. Recherche de commandes
   * GET /vendor/orders/search?q=:query
   */
  @Get('search')
  async searchOrders(
    @Query('q') query: string,
    @Query() additionalFilters: Partial<VendorOrderFiltersDto>,
    @Req() req: any,
  ): Promise<VendorOrdersListResponseDto> {
    try {
      const vendorId = req.user.id;
      const filters: VendorOrderFiltersDto = {
        ...additionalFilters,
        search: query,
      };

      const result = await this.vendorOrdersService.getVendorOrders(
        vendorId,
        filters,
      );

      return {
        success: true,
        message: 'Résultats de recherche récupérés',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la recherche',
        data: null,
      };
    }
  }

  /**
   * 6. Commandes par statut
   * GET /vendor/orders/status/:status
   */
  @Get('status/:status')
  async getOrdersByStatus(
    @Param('status') status: string,
    @Query() additionalFilters: Partial<VendorOrderFiltersDto>,
    @Req() req: any,
  ): Promise<VendorOrdersListResponseDto> {
    try {
      const vendorId = req.user.id;
      const filters: VendorOrderFiltersDto = {
        ...additionalFilters,
        status: status.toUpperCase() as any,
      };

      const result = await this.vendorOrdersService.getVendorOrders(
        vendorId,
        filters,
      );

      return {
        success: true,
        message: `Commandes avec statut ${status} récupérées`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des commandes par statut',
        data: null,
      };
    }
  }

  /**
   * 7. Export CSV
   * GET /vendor/orders/export/csv
   */
  @Get('export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="vendor-orders.csv"')
  async exportOrdersCSV(
    @Query() filters: Partial<VendorOrderFiltersDto>,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const vendorId = req.user.id;
      const csv = await this.vendorOrdersService.exportOrdersCSV(
        vendorId,
        filters,
      );

      res.send(csv);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Erreur lors de l\'export CSV',
        data: null,
      });
    }
  }

  /**
   * 8. Notifications vendeur
   * GET /vendor/orders/notifications
   */
  @Get('notifications')
  async getVendorNotifications(
    @Req() req: any,
  ): Promise<NotificationResponseDto> {
    try {
      const vendorId = req.user.id;
      const notifications = await this.vendorOrdersService.getVendorNotifications(
        vendorId,
      );

      return {
        success: true,
        message: 'Notifications récupérées',
        data: notifications,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des notifications',
        data: null,
      };
    }
  }

  /**
   * 9. Marquer notification comme lue
   * PATCH /vendor/orders/notifications/:notificationId/read
   */
  @Patch('notifications/:notificationId/read')
  async markNotificationAsRead(
    @Param('notificationId', ParseIntPipe) notificationId: number,
    @Req() req: any,
  ) {
    try {
      const vendorId = req.user.id;
      await this.vendorOrdersService.markNotificationAsRead(
        vendorId,
        notificationId,
      );

      return {
        success: true,
        message: 'Notification marquée comme lue',
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour de la notification',
        data: null,
      };
    }
  }
}