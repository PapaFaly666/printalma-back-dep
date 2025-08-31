import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Récupérer les notifications de l'utilisateur connecté
   */
  @Get()
  async getUserNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('includeRead') includeRead?: string,
  ) {
    const userId = req.user.userId;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const includeReadBool = includeRead !== 'false';

    const [notifications, unreadCount] = await Promise.all([
      this.notificationService.getUserNotifications(userId, limitNum, includeReadBool),
      this.notificationService.getUnreadCount(userId),
    ]);

    return {
      success: true,
      data: notifications,
      unreadCount,
      metadata: {
        limit: limitNum,
        includeRead: includeReadBool,
        total: notifications.length,
      },
    };
  }

  /**
   * Compter les notifications non lues
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const userId = req.user.userId;
    const unreadCount = await this.notificationService.getUnreadCount(userId);

    return {
      success: true,
      unreadCount,
    };
  }

  /**
   * Marquer une notification comme lue
   */
  @Post(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Request() req,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    const userId = req.user.userId;
    
    await this.notificationService.markAsRead(notificationId, userId);

    return {
      success: true,
      message: 'Notification marquée comme lue',
    };
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req) {
    const userId = req.user.userId;
    const result = await this.notificationService.markAllAsRead(userId);

    return {
      success: true,
      message: `${result.count} notification(s) marquée(s) comme lue(s)`,
      updatedCount: result.count,
    };
  }

  /**
   * Supprimer une notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Request() req,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    const userId = req.user.userId;
    
    await this.notificationService.deleteNotification(notificationId, userId);

    return {
      success: true,
      message: 'Notification supprimée',
    };
  }

  /**
   * Nettoyage des notifications expirées (endpoint admin)
   */
  @Post('admin/clean-expired')
  @HttpCode(HttpStatus.OK)
  async cleanExpired(@Request() req) {
    // Vérifier que l'utilisateur est admin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      return {
        success: false,
        message: 'Accès refusé - droits admin requis',
      };
    }

    const result = await this.notificationService.cleanExpired();

    return {
      success: true,
      message: `${result.count} notification(s) expirée(s) supprimée(s)`,
      deletedCount: result.count,
    };
  }
} 