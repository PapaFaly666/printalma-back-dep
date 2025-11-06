import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaydunyaCronService } from './paydunya-cron.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/guards/roles.decorator';

/**
 * Contrôleur pour gérer manuellement le cron job PayDunya
 * Tous les endpoints sont protégés et nécessitent un rôle ADMIN
 */
@ApiTags('paydunya-cron')
@Controller('paydunya/cron')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(['ADMIN', 'SUPERADMIN'])
@ApiBearerAuth()
export class PaydunyaCronController {
  private readonly logger = new Logger(PaydunyaCronController.name);

  constructor(private readonly paydunyaCronService: PaydunyaCronService) {}

  /**
   * Forcer l'exécution manuelle du cron job
   * Vérifie toutes les commandes en attente
   */
  @Post('run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force manual execution of PayDunya cron job (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cron job executed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async runCronJobManually() {
    try {
      this.logger.log('Manual cron job execution requested');
      await this.paydunyaCronService.forceCheckAllPendingPayments();

      return {
        success: true,
        message: 'Cron job executed successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Manual cron job execution failed:', error.message, error.stack);
      throw error;
    }
  }

  /**
   * Vérifier manuellement une commande spécifique
   */
  @Post('check/:orderNumber')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check specific order payment status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order checked successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async checkSpecificOrder(@Param('orderNumber') orderNumber: string) {
    try {
      this.logger.log(`Manual check requested for order: ${orderNumber}`);

      const wasUpdated = await this.paydunyaCronService.checkSpecificOrder(orderNumber);

      return {
        success: true,
        message: wasUpdated
          ? `Order ${orderNumber} status updated`
          : `Order ${orderNumber} status unchanged`,
        data: {
          orderNumber,
          wasUpdated,
          checkedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Check order ${orderNumber} failed:`, error.message, error.stack);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques du cron job
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get cron job statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatistics() {
    try {
      const stats = await this.paydunyaCronService.getStatistics();

      return {
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats,
      };
    } catch (error) {
      this.logger.error('Failed to get statistics:', error.message, error.stack);
      throw error;
    }
  }
}
