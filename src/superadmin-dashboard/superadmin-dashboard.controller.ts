import { Controller, Get, UseGuards } from '@nestjs/common';
import { SuperadminDashboardService } from './superadmin-dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SuperadminDashboardDto, MonthlyRevenueDto } from './dto/dashboard-stats.dto';

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

  /**
   * Récupère l'évolution du chiffre d'affaires par mois (12 derniers mois)
   *
   * @returns {Promise<MonthlyRevenueDto[]>} Données mensuelles de CA
   *
   * @example
   * GET /superadmin/dashboard/monthly-revenue
   *
   * Headers:
   * Authorization: Bearer <jwt-token>
   *
   * Response:
   * [
   *   {
   *     "month": "Mar 2025",
   *     "year": 2025,
   *     "monthNumber": 3,
   *     "revenue": 125000,
   *     "orderCount": 45
   *   },
   *   {
   *     "month": "Apr 2025",
   *     "year": 2025,
   *     "monthNumber": 4,
   *     "revenue": 150000,
   *     "orderCount": 52
   *   },
   *   ...
   * ]
   */
  @Get('dashboard/monthly-revenue')
  async getMonthlyRevenue(): Promise<MonthlyRevenueDto[]> {
    return this.dashboardService.getMonthlyRevenueEvolution();
  }
}
