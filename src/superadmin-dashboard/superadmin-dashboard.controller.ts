import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperadminDashboardService } from './superadmin-dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SuperadminDashboardDto } from './dto/dashboard-stats.dto';

@Controller('superadmin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN') // Seulement accessible aux superadmins
export class SuperadminDashboardController {
  constructor(
    private readonly dashboardService: SuperadminDashboardService,
  ) {}

  /**
   * Récupère toutes les statistiques du dashboard superadmin
   *
   * @returns {Promise<SuperadminDashboardDto>} Statistiques complètes de la plateforme
   *
   * @example
   * GET /superadmin/dashboard
   *
   * Headers:
   * Authorization: Bearer <jwt-token>
   *
   * Response:
   * {
   *   "currentMonth": "December 2025",
   *   "currentMonthNumber": 12,
   *   "currentYear": 2025,
   *   "financialStats": {
   *     "totalPlatformRevenue": 50000,
   *     "thisMonthPlatformRevenue": 5000,
   *     ...
   *   },
   *   "vendorStats": {
   *     "totalVendors": 150,
   *     "activeVendors": 120,
   *     ...
   *   },
   *   ...
   * }
   */
  @Get('dashboard')
  async getDashboard(): Promise<SuperadminDashboardDto> {
    return this.dashboardService.getDashboardStats();
  }
}
